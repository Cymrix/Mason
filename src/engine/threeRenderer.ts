/**
 * Mason Unified 2D/3D WebGL Renderer Engine (powered by Three.js)
 * 
 * Capabilities:
 * 1. Unified 3D WebGL Pipeline: 2D is hosted as a specialized plane/view within a full 3D pipeline.
 * 2. Dual Camera Projections:
 *    - 2D Orthographic Mode: Pixel-perfect, 1:1 world coordinate mapping.
 *    - 3D Perspective Mode: 35° camera tilt with real spatial Z-depth parallax & lighting.
 * 3. Strict "Pixel Art" Mode:
 *    - Nearest-neighbor texture filtering (THREE.NearestFilter, no mipmap blur)
 *    - Strict Pixel Grid Snapping: Snaps camera and entity transforms to integer pixel boundaries,
 *      eliminating subpixel jitter, edge bleeding, and sprite shimmering.
 * 4. Smooth 3D Mode:
 *    - Bilinear/trilinear filtering with mipmapping (THREE.LinearMipmapLinearFilter)
 *    - Continuous subpixel motion and floating-point transforms.
 * 5. Raycasting Plane Intersection:
 *    - Accurately resolves mouse screen clicks to (worldX, worldY) on the Z=0 gameplay plane
 *      in both 2D Ortho and 3D Perspective projections.
 */

import * as THREE from 'three';

export type ProjectionMode = '2d' | '3d';

export interface ThreeRendererOptions {
  pixelArtMode?: boolean;
  projectionMode?: ProjectionMode;
  pixelSnapGrid?: boolean;
}

export interface ParallaxQuadData {
  id: string;
  source: HTMLImageElement | HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  layerIndex: number;
  opacity: number;
}

export interface EntitySpriteData {
  id: string;
  img?: HTMLImageElement | null;
  x: number; // Center X in Mason world pixels
  y: number; // Bottom Y in Mason world pixels
  width: number;
  height: number;
  facing?: 'left' | 'right';
  tintColor?: string;
  alpha?: number;
  zOrder?: number;
}

export interface ParticlePointData {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  layer?: 'background' | 'main' | 'foreground' | string;
}

export class MasonThreeRenderer {
  public renderer: THREE.WebGLRenderer | null = null;
  public scene: THREE.Scene;
  public orthoCamera: THREE.OrthographicCamera;
  public perspectiveCamera: THREE.PerspectiveCamera;
  public activeCamera: THREE.Camera;

  // Layer groups for strict Z-depth composition
  public backgroundParallaxGroup: THREE.Group;
  public terrainGroup: THREE.Group;
  public entityGroup: THREE.Group;
  public foregroundTerrainGroup: THREE.Group;
  public foregroundParallaxGroup: THREE.Group;
  public particleGroup: THREE.Group;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  public playerPointLight: THREE.PointLight;

  // Viewport / Screen sizing
  private width: number = 800;
  private height: number = 600;
  private currentPan: { x: number; y: number } = { x: 0, y: 0 };
  private currentScale: number = 1.0;

  // Modes
  public pixelArtMode: boolean = true;
  public projectionMode: ProjectionMode = '2d';
  public pixelSnapGrid: boolean = true;

  // Texture Caches
  private chunkTextures: Map<string, { texture: THREE.CanvasTexture; mesh: THREE.Mesh; version: number }> = new Map();
  private parallaxTextures: Map<string, { texture: THREE.Texture; mesh: THREE.Mesh }> = new Map();
  private spriteTextures: Map<string, THREE.Texture> = new Map();
  private entityMeshes: Map<string, THREE.Mesh> = new Map();

  // Shared geometry
  private unitQuadGeometry: THREE.PlaneGeometry;
  private chunkGeometry: THREE.PlaneGeometry;

  // Raycaster for mouse picking on the Z = 0 plane
  private raycaster: THREE.Raycaster;
  private gameplayPlane: THREE.Plane;

  // Reusable particle system
  private particlePointsMesh: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private maxParticles: number = 4000;

  constructor(canvas: HTMLCanvasElement, width: number, height: number, options: ThreeRendererOptions = {}) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.pixelArtMode = options.pixelArtMode !== undefined ? options.pixelArtMode : true;
    this.projectionMode = options.projectionMode || '2d';
    this.pixelSnapGrid = options.pixelSnapGrid !== undefined ? options.pixelSnapGrid : true;

    // 1. Initialize Scene
    this.scene = new THREE.Scene();

    // 2. Groups
    this.backgroundParallaxGroup = new THREE.Group();
    this.terrainGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.foregroundTerrainGroup = new THREE.Group();
    this.foregroundParallaxGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();

    this.scene.add(this.backgroundParallaxGroup);
    this.scene.add(this.terrainGroup);
    this.scene.add(this.entityGroup);
    this.scene.add(this.foregroundTerrainGroup);
    this.scene.add(this.foregroundParallaxGroup);
    this.scene.add(this.particleGroup);

    // 3. Shared Geometries
    this.unitQuadGeometry = new THREE.PlaneGeometry(1, 1);
    this.chunkGeometry = new THREE.PlaneGeometry(1024, 1024);

    // 4. Cameras
    // Orthographic Camera: 1 Three.js unit = 1 Mason world pixel
    this.orthoCamera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      this.height / 2,
      -this.height / 2,
      0.1,
      10000
    );

    // Perspective Camera: 50° FOV looking at Z=0 with smooth 35° tilt
    this.perspectiveCamera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 15000);

    this.activeCamera = this.projectionMode === '3d' ? this.perspectiveCamera : this.orthoCamera;

    // 5. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 0.6);
    this.dirLight.position.set(400, 800, 1000);
    this.scene.add(this.dirLight);

    this.playerPointLight = new THREE.PointLight(0x38bdf8, 2.5, 450);
    this.playerPointLight.position.set(0, 0, 30);
    this.playerPointLight.visible = false;
    this.scene.add(this.playerPointLight);

    // 6. Raycaster
    this.raycaster = new THREE.Raycaster();
    this.gameplayPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // 7. Particle Buffers
    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 4);
    this.initParticleSystem();

    // 8. Initialize WebGLRenderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !this.pixelArtMode, // Antialiasing OFF for pixel art to keep razor-sharp pixels
        powerPreference: 'high-performance',
        premultipliedAlpha: false
      });
      this.renderer.setSize(this.width, this.height, false);
      this.renderer.setPixelRatio(this.pixelArtMode ? 1 : Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0); // Transparent canvas background so CSS / canvas theme shows
    } catch (err) {
      console.error('[MasonThreeRenderer] Failed to initialize WebGLRenderer:', err);
    }
  }

  private initParticleSystem() {
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 4));

    // Particle sprite texture (smooth circular / soft square)
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const pCtx = particleCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, 16, 16);
    }
    const pTexture = new THREE.CanvasTexture(particleCanvas);
    this.applyFiltering(pTexture);

    const particleMaterial = new THREE.PointsMaterial({
      size: 4,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.particlePointsMesh = new THREE.Points(this.particleGeometry, particleMaterial);
    this.particleGroup.add(this.particlePointsMesh);
  }

  public setPixelArtMode(enabled: boolean) {
    if (this.pixelArtMode === enabled) return;
    this.pixelArtMode = enabled;

    if (this.renderer) {
      this.renderer.setPixelRatio(enabled ? 1 : Math.min(window.devicePixelRatio, 2));
    }

    // Refresh filtering on all cached textures
    this.chunkTextures.forEach(({ texture }) => {
      this.applyFiltering(texture);
    });
    this.parallaxTextures.forEach(({ texture }) => {
      this.applyFiltering(texture);
    });
    this.spriteTextures.forEach(texture => {
      this.applyFiltering(texture);
    });
  }

  public setProjectionMode(mode: ProjectionMode) {
    this.projectionMode = mode;
    this.activeCamera = mode === '3d' ? this.perspectiveCamera : this.orthoCamera;
    this.updateCameraTransform();
  }

  public setLitMode(isLit: boolean, playerWorldX?: number, playerWorldY?: number) {
    if (isLit) {
      this.ambientLight.intensity = 0.22;
      this.dirLight.intensity = 0.15;
      this.playerPointLight.visible = true;
      if (playerWorldX !== undefined && playerWorldY !== undefined) {
        let lx = playerWorldX;
        let ly = -playerWorldY;
        if (this.pixelArtMode && this.pixelSnapGrid) {
          lx = Math.round(lx);
          ly = Math.round(ly);
        }
        this.playerPointLight.position.set(lx, ly, 35);
      }
    } else {
      this.ambientLight.intensity = 0.95;
      this.dirLight.intensity = 0.6;
      this.playerPointLight.visible = false;
    }
  }

  public resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    if (this.renderer) {
      this.renderer.setSize(this.width, this.height, false);
    }

    // Update Orthographic Frustum
    this.orthoCamera.left = -this.width / 2;
    this.orthoCamera.right = this.width / 2;
    this.orthoCamera.top = this.height / 2;
    this.orthoCamera.bottom = -this.height / 2;
    this.orthoCamera.updateProjectionMatrix();

    // Update Perspective Frustum
    this.perspectiveCamera.aspect = this.width / this.height;
    this.perspectiveCamera.updateProjectionMatrix();

    this.updateCameraTransform();
  }

  public applyFiltering(texture: THREE.Texture) {
    if (this.pixelArtMode) {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
    } else {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    }
    texture.needsUpdate = true;
  }

  /**
   * Synchronize viewport pan & zoom to Three.js camera.
   * Mason 2D world coords: X right (+), Y down (+).
   * Three.js coords: X right (+), Y up (+), Z towards viewer (+).
   * Therefore, Three.js world Y = -Mason world Y.
   */
  public setViewport(pan: { x: number; y: number }, scale: number, shake: { x: number; y: number } = { x: 0, y: 0 }) {
    this.currentPan = { ...pan };
    this.currentScale = scale;

    // Mason screen center maps to world coords:
    // screenX = (worldX) * scale + pan.x
    // When screenX = width / 2 => centerWorldX = (width / 2 - pan.x) / scale
    // When screenY = height / 2 => centerWorldY = (height / 2 - pan.y) / scale
    const centerWorldX = (this.width / 2 - (pan.x + shake.x)) / scale;
    const centerWorldY = (this.height / 2 - (pan.y + shake.y)) / scale;

    // Apply strict Pixel Grid Snapping if enabled
    let camTargetX = centerWorldX;
    let camTargetY = centerWorldY;
    if (this.pixelArtMode && this.pixelSnapGrid) {
      camTargetX = Math.round(camTargetX);
      camTargetY = Math.round(camTargetY);
    }

    if (this.projectionMode === '2d') {
      // Orthographic camera
      this.orthoCamera.left = (-this.width / 2) / scale;
      this.orthoCamera.right = (this.width / 2) / scale;
      this.orthoCamera.top = (this.height / 2) / scale;
      this.orthoCamera.bottom = (-this.height / 2) / scale;
      this.orthoCamera.position.set(camTargetX, -camTargetY, 1000);
      this.orthoCamera.lookAt(camTargetX, -camTargetY, 0);
      this.orthoCamera.updateProjectionMatrix();
    } else {
      // 3D Perspective camera: Tilted along the X axis for dramatic 2.5D / 3D depth
      // Distance from plane matches scale: distance = (height / 2) / Math.tan(fov / 2) / scale
      const fovRad = (this.perspectiveCamera.fov * Math.PI) / 360;
      const baseDistance = (this.height / 2) / Math.tan(fovRad) / scale;

      const tiltAngleRad = (32 * Math.PI) / 180; // 32° cinematic tilt
      const distZ = baseDistance * Math.cos(tiltAngleRad);
      const offsetY = -baseDistance * Math.sin(tiltAngleRad);

      this.perspectiveCamera.position.set(camTargetX, -camTargetY + offsetY, distZ);
      this.perspectiveCamera.lookAt(camTargetX, -camTargetY, 0);
      this.perspectiveCamera.updateProjectionMatrix();
    }
  }

  private updateCameraTransform() {
    this.setViewport(this.currentPan, this.currentScale);
  }

  /**
   * Synchronize active baked 16x16 chunk canvases to Three.js textured quads on the Z=0 terrain plane.
   */
  public updateChunks(visibleChunks: Array<{ key: string; cx: number; cy: number; canvas: HTMLCanvasElement }>) {
    const activeKeys = new Set<string>();

    visibleChunks.forEach(({ key, cx, cy, canvas }) => {
      activeKeys.add(key);
      const cached = this.chunkTextures.get(key);

      if (!cached) {
        // Create new Texture & Quad Mesh
        const texture = new THREE.CanvasTexture(canvas);
        this.applyFiltering(texture);

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.FrontSide
        });

        const mesh = new THREE.Mesh(this.chunkGeometry, material);
        // In Mason, chunk origin is at top-left: cx * 1024, cy * 1024
        // Chunk center is at cx * 1024 + 512, cy * 1024 + 512
        const posX = cx * 1024 + 512;
        const posY = -(cy * 1024 + 512);

        mesh.position.set(posX, posY, 0);
        this.terrainGroup.add(mesh);

        this.chunkTextures.set(key, { texture, mesh, version: 1 });
      } else {
        // Update existing texture
        cached.texture.image = canvas;
        cached.texture.needsUpdate = true;
      }
    });

    // Remove chunks that left the visible frustum
    for (const [key, cached] of this.chunkTextures.entries()) {
      if (!activeKeys.has(key)) {
        this.terrainGroup.remove(cached.mesh);
        cached.texture.dispose();
        (cached.mesh.material as THREE.Material).dispose();
        this.chunkTextures.delete(key);
      }
    }
  }

  /**
   * Render Parallax Background (-5 to -1) and Foreground (+1) layers at genuine 3D Z-depth.
   */
  public updateParallaxLayers(layers: ParallaxQuadData[]) {
    const activeIds = new Set<string>();

    layers.forEach(layer => {
      activeIds.add(layer.id);
      let cached = this.parallaxTextures.get(layer.id);

      // Real 3D depth placement:
      // Negative layer indices: Z = layerIndex * 120 (e.g. -1 => -120, -5 => -600)
      // Positive layer indices: Z = layerIndex * 80 (e.g. +1 => +80)
      const depthZ = layer.layerIndex < 0 ? layer.layerIndex * 120 : layer.layerIndex * 80;

      if (!cached) {
        const texture = layer.source instanceof HTMLCanvasElement
          ? new THREE.CanvasTexture(layer.source)
          : new THREE.Texture(layer.source);

        this.applyFiltering(texture);

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: layer.opacity,
          depthWrite: false
        });

        const geom = new THREE.PlaneGeometry(layer.width, layer.height);
        const mesh = new THREE.Mesh(geom, material);

        const targetGroup = layer.layerIndex < 0 ? this.backgroundParallaxGroup : this.foregroundParallaxGroup;
        targetGroup.add(mesh);

        cached = { texture, mesh };
        this.parallaxTextures.set(layer.id, cached);
      } else {
        cached.texture.image = layer.source;
        cached.texture.needsUpdate = true;
        (cached.mesh.material as THREE.MeshBasicMaterial).opacity = layer.opacity;
      }

      // Position quad centered
      let quadX = layer.x + layer.width / 2;
      let quadY = -(layer.y + layer.height / 2);

      if (this.pixelArtMode && this.pixelSnapGrid) {
        quadX = Math.round(quadX);
        quadY = Math.round(quadY);
      }

      cached.mesh.position.set(quadX, quadY, depthZ);
    });

    // Remove inactive layers
    for (const [id, cached] of this.parallaxTextures.entries()) {
      if (!activeIds.has(id)) {
        this.backgroundParallaxGroup.remove(cached.mesh);
        this.foregroundParallaxGroup.remove(cached.mesh);
        cached.texture.dispose();
        (cached.mesh.material as THREE.Material).dispose();
        cached.mesh.geometry.dispose();
        this.parallaxTextures.delete(id);
      }
    }
  }

  /**
   * Render Character & Prefab Sprites as 3D Quads with Pixel Snapping
   */
  public updateEntities(entities: EntitySpriteData[]) {
    const activeIds = new Set<string>();

    entities.forEach(ent => {
      activeIds.add(ent.id);
      let mesh = this.entityMeshes.get(ent.id);

      if (!mesh) {
        const geom = new THREE.PlaneGeometry(ent.width, ent.height);
        let mat: THREE.MeshBasicMaterial;

        if (ent.img && ent.img.complete && ent.img.naturalWidth > 0) {
          const texture = new THREE.CanvasTexture(ent.img);
          this.applyFiltering(texture);
          mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
          });
        } else {
          mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(ent.tintColor || '#06b6d4'),
            transparent: true,
            opacity: ent.alpha ?? 1.0
          });
        }

        mesh = new THREE.Mesh(geom, mat);
        this.entityGroup.add(mesh);
        this.entityMeshes.set(ent.id, mesh);
      }

      // Sprite bottom rests on ent.y: center Y is ent.y - height / 2
      let posX = ent.x;
      let posY = -(ent.y - ent.height / 2);

      if (this.pixelArtMode && this.pixelSnapGrid) {
        posX = Math.round(posX);
        posY = Math.round(posY);
      }

      mesh.position.set(posX, posY, ent.zOrder || 2);
      mesh.scale.set(ent.facing === 'left' ? -1 : 1, 1, 1);
    });

    for (const [id, mesh] of this.entityMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.entityGroup.remove(mesh);
        (mesh.material as THREE.Material).dispose();
        mesh.geometry.dispose();
        this.entityMeshes.delete(id);
      }
    }
  }

  /**
   * Batch update atmospheric weather particles (rain, snow, embers) into the WebGL point buffer.
   */
  public updateParticles(particles: ParticlePointData[]) {
    if (!this.particleGeometry || !this.particlePointsMesh) return;

    const count = Math.min(particles.length, this.maxParticles);
    const pos = this.particlePositions;
    const col = this.particleColors;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const i3 = i * 3;
      const i4 = i * 4;

      let px = p.x;
      let py = -p.y;

      if (this.pixelArtMode && this.pixelSnapGrid) {
        px = Math.round(px);
        py = Math.round(py);
      }

      const pz = p.layer === 'background' ? -50 : p.layer === 'foreground' ? 25 : 5;

      pos[i3] = px;
      pos[i3 + 1] = py;
      pos[i3 + 2] = pz;

      // Color parsing
      const c = new THREE.Color(p.color || '#ffffff');
      col[i4] = c.r;
      col[i4 + 1] = c.g;
      col[i4 + 2] = c.b;
      col[i4 + 3] = p.alpha ?? 1.0;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.setDrawRange(0, count);
  }

  /**
   * Screen Pixel to World Tile Coordinate Translation.
   * Handles both 2D Orthographic and 3D Perspective Raycast plane intersections.
   */
  public screenToWorld(screenX: number, screenY: number): { worldX: number; worldY: number } {
    if (this.projectionMode === '2d') {
      // Exact inverse transformation in 2D Orthographic
      const worldX = (screenX - this.currentPan.x) / this.currentScale;
      const worldY = (screenY - this.currentPan.y) / this.currentScale;
      return {
        worldX: this.pixelArtMode && this.pixelSnapGrid ? Math.round(worldX) : worldX,
        worldY: this.pixelArtMode && this.pixelSnapGrid ? Math.round(worldY) : worldY
      };
    } else {
      // Raycasting through perspective projection to intersect Z=0 gameplay plane
      const ndcX = (screenX / this.width) * 2 - 1;
      const ndcY = -(screenY / this.height) * 2 + 1;

      this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.perspectiveCamera);
      const hit = new THREE.Vector3();
      const intersected = this.raycaster.ray.intersectPlane(this.gameplayPlane, hit);

      if (intersected) {
        const worldX = hit.x;
        const worldY = -hit.y; // Convert Three.js -Y back to Mason +Y
        return {
          worldX: this.pixelArtMode && this.pixelSnapGrid ? Math.round(worldX) : worldX,
          worldY: this.pixelArtMode && this.pixelSnapGrid ? Math.round(worldY) : worldY
        };
      }

      // Fallback to 2D
      return {
        worldX: (screenX - this.currentPan.x) / this.currentScale,
        worldY: (screenY - this.currentPan.y) / this.currentScale
      };
    }
  }

  /**
   * Render the WebGL Frame
   */
  public render() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.activeCamera);
  }

  /**
   * Clean disposal of WebGL context and GPU allocations
   */
  public dispose() {
    this.chunkTextures.forEach(c => {
      c.texture.dispose();
      (c.mesh.material as THREE.Material).dispose();
    });
    this.chunkTextures.clear();

    this.parallaxTextures.forEach(p => {
      p.texture.dispose();
      (p.mesh.material as THREE.Material).dispose();
      p.mesh.geometry.dispose();
    });
    this.parallaxTextures.clear();

    this.entityMeshes.forEach(m => {
      (m.material as THREE.Material).dispose();
      m.geometry.dispose();
    });
    this.entityMeshes.clear();

    this.unitQuadGeometry.dispose();
    this.chunkGeometry.dispose();

    if (this.particleGeometry) this.particleGeometry.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
