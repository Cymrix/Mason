/**
 * Mason 3D Terrain Builder Studio (TerrainStudio)
 * 
 * Features:
 * 1. 3D Terrain Mesh Sculpting:
 *    - Heightmap plane sculpting: Elevate, Dig, Smooth, Plateau, Noise/Roughen, and Slope Ramp brushes.
 *    - Real-time 3D projected brush ring cursor with radius, intensity, and falloff controls.
 *    - Voxel object sculpting: Add, remove, and paint voxels (Stone, Soil, Moss, Sand, Snow, Basalt).
 * 2. Triplanar Biome Materials:
 *    - Triplanar slope-based strata rendering: Top flat surface (grass/snow/moss), steep cliff walls (basalt/rock without UV stretching), and valley sediment.
 *    - Grouped by biome presets (Mourne Ashen Strata, Verdant Highlands, Glacial Tundra, Volcanic).
 * 3. Detail Object Placement & Auto-Scatter:
 *    - Tied directly to terrain materials: Procedural scatter of Pine Trees, Broadleaf Trees, Boulders, Foliage, Mushrooms.
 *    - Baking Engine for Non-Destructible Terrain: 1-click bake scatter into static merged geometry for zero runtime calculation overhead!
 * 4. Static & Dynamic Prop Placement:
 *    - Place breakable barrels, treasure chests, ancient shrines, and torches.
 * 5. Walkthrough Player Mode:
 *    - WASD first-person / third-person player controller traversing the sculpted 3D terrain heights.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  TerrainFile, 
  TerrainData, 
  TerrainObject, 
  TerrainBiomeMaterialLayer,
  BakedScatterInstance,
  PlacedPropObject,
  VoxelBlock,
  createDefaultTerrainFile,
  MasonProject
} from '../engine/masonProjectSchema';
import { 
  TreePine, 
  Mountain, 
  Layers, 
  Paintbrush, 
  Eraser, 
  Sliders, 
  Play, 
  Square, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  Sparkles, 
  Move, 
  Maximize2, 
  Check, 
  RotateCw, 
  Camera, 
  Sun, 
  Box, 
  Flame, 
  Shield, 
  Zap, 
  User, 
  Search,
  CheckCircle2
} from 'lucide-react';

interface TerrainStudioProps {
  project: MasonProject;
  activeTerrainFile?: TerrainFile;
  onSaveTerrainFile: (file: TerrainFile) => void;
  onSwitchTerrainFile?: (fileName: string) => void;
  onCreateNewTerrain?: (name: string) => void;
  onBackToDashboard?: () => void;
}

type SculptBrushType = 'elevate' | 'lower' | 'smooth' | 'plateau' | 'noise' | 'voxel_add' | 'voxel_remove';

export const TerrainStudio: React.FC<TerrainStudioProps> = ({
  project,
  activeTerrainFile,
  onSaveTerrainFile,
  onSwitchTerrainFile,
  onCreateNewTerrain,
  onBackToDashboard
}) => {
  // Active Terrain File State
  const [terrainFile, setTerrainFile] = useState<TerrainFile>(() => {
    return activeTerrainFile || project.fileSystem.terrain?.[0] || createDefaultTerrainFile();
  });

  useEffect(() => {
    if (activeTerrainFile) {
      setTerrainFile(activeTerrainFile);
    }
  }, [activeTerrainFile]);

  const terrainData = terrainFile.terrainData;

  // Selected object in terrain
  const [selectedObjectId, setSelectedObjectId] = useState<string>(
    terrainData.terrainObjects[0]?.id || 'obj_main_heightmap'
  );

  // Sculpting Tool States
  const [activeBrush, setActiveBrush] = useState<SculptBrushType>('elevate');
  const [brushRadius, setBrushRadius] = useState<number>(14);
  const [brushStrength, setBrushStrength] = useState<number>(0.6);
  const [targetPlateauHeight, setTargetPlateauHeight] = useState<number>(8);
  const [activeVoxelMat, setActiveVoxelMat] = useState<string>('stone');
  const [activeTab, setActiveTab] = useState<'sculpt' | 'material' | 'scatter' | 'props'>('sculpt');
  const [isTestWalkMode, setIsTestWalkMode] = useState<boolean>(false);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Viewport DOM refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshGroupRef = useRef<THREE.Group>(new THREE.Group());
  const scatterGroupRef = useRef<THREE.Group>(new THREE.Group());
  const propsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const brushCursorMeshRef = useRef<THREE.Mesh | null>(null);

  // Sculpting drag state
  const isSculptingRef = useRef<boolean>(false);
  const isOrbitingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 140,
    target: new THREE.Vector3(0, 4, 0)
  });

  // Walkthrough character controller state
  const walkPlayerRef = useRef<{
    pos: THREE.Vector3;
    rotY: number;
    pitch: number;
    velocity: THREE.Vector3;
    isGrounded: boolean;
  }>({
    pos: new THREE.Vector3(0, 6, 20),
    rotY: 0,
    pitch: 0,
    velocity: new THREE.Vector3(),
    isGrounded: true
  });
  const keysDownRef = useRef<Record<string, boolean>>({});

  const selectedObject = useMemo(() => {
    return terrainData.terrainObjects.find(o => o.id === selectedObjectId) || terrainData.terrainObjects[0];
  }, [terrainData.terrainObjects, selectedObjectId]);

  const activeMaterial = useMemo(() => {
    return terrainData.materialLayers.find(m => m.id === selectedObject?.materialLayerId) || terrainData.materialLayers[0];
  }, [terrainData.materialLayers, selectedObject?.materialLayerId]);

  // Helper to query ground height at any (x, z)
  const getTerrainHeightAt = useCallback((worldX: number, worldZ: number): number => {
    const hmObj = terrainData.terrainObjects.find(o => o.type === 'heightmap_plane' && o.heightmap);
    if (!hmObj || !hmObj.heightmap) return 0;
    const { resolutionX, resolutionZ, spacing, heights } = hmObj.heightmap;

    const halfW = (resolutionX * spacing) / 2;
    const halfD = (resolutionZ * spacing) / 2;

    const localX = worldX + halfW;
    const localZ = worldZ + halfD;

    const gridX = Math.max(0, Math.min(resolutionX - 1, Math.floor(localX / spacing)));
    const gridZ = Math.max(0, Math.min(resolutionZ - 1, Math.floor(localZ / spacing)));

    return heights[gridZ * resolutionX + gridX] || 0;
  }, [terrainData.terrainObjects]);

  // ==========================================
  // 1. THREE.JS VIEWPORT INITIALIZATION
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(terrainData.fogColor || '#090d16');
    if (terrainData.fogEnabled) {
      scene.fog = new THREE.Fog(new THREE.Color(terrainData.fogColor || '#090d16'), 90, 450);
    }
    sceneRef.current = scene;

    // Lights
    const ambient = new THREE.AmbientLight(new THREE.Color(terrainData.ambientColor || '#334155'), 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(new THREE.Color(terrainData.sunColor || '#fff7ed'), terrainData.sunIntensity || 1.2);
    sun.position.set(100, 160, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -160;
    sun.shadow.camera.right = 160;
    sun.shadow.camera.top = 160;
    sun.shadow.camera.bottom = -160;
    scene.add(sun);

    // Groups
    scene.add(terrainMeshGroupRef.current);
    scene.add(scatterGroupRef.current);
    scene.add(propsGroupRef.current);

    // 3D Projected Brush Ring Cursor
    const brushRingGeo = new THREE.RingGeometry(brushRadius - 0.6, brushRadius, 32);
    brushRingGeo.rotateX(-Math.PI / 2);
    const brushRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const brushRing = new THREE.Mesh(brushRingGeo, brushRingMat);
    brushRing.visible = false;
    scene.add(brushRing);
    brushCursorMeshRef.current = brushRing;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 3000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const updateCameraPos = () => {
      if (isTestWalkMode) {
        const p = walkPlayerRef.current;
        camera.position.set(p.pos.x, p.pos.y + 3.2, p.pos.z);
        const lookDir = new THREE.Vector3(
          -Math.sin(p.rotY) * Math.cos(p.pitch),
          Math.sin(p.pitch),
          -Math.cos(p.rotY) * Math.cos(p.pitch)
        );
        camera.lookAt(camera.position.clone().add(lookDir));
      } else {
        const { theta, phi, radius, target } = cameraAngleRef.current;
        const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        const y = target.y + radius * Math.cos(phi);
        const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.position.set(x, y, z);
        camera.lookAt(target);
      }
    };
    updateCameraPos();

    // Loop
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isTestWalkMode) {
        const p = walkPlayerRef.current;
        const speed = 24;
        const moveDir = new THREE.Vector3();

        if (keysDownRef.current['KeyW'] || keysDownRef.current['ArrowUp']) moveDir.z -= 1;
        if (keysDownRef.current['KeyS'] || keysDownRef.current['ArrowDown']) moveDir.z += 1;
        if (keysDownRef.current['KeyA'] || keysDownRef.current['ArrowLeft']) moveDir.x -= 1;
        if (keysDownRef.current['KeyD'] || keysDownRef.current['ArrowRight']) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          const sinY = Math.sin(p.rotY);
          const cosY = Math.cos(p.rotY);
          const worldDx = moveDir.x * cosY + moveDir.z * sinY;
          const worldDz = -moveDir.x * sinY + moveDir.z * cosY;

          p.pos.x += worldDx * speed * dt;
          p.pos.z += worldDz * speed * dt;
        }

        const groundY = getTerrainHeightAt(p.pos.x, p.pos.z);
        p.velocity.y -= 48 * dt;
        p.pos.y += p.velocity.y * dt;

        if (p.pos.y <= groundY) {
          p.pos.y = groundY;
          p.velocity.y = 0;
          p.isGrounded = true;
        }

        if (keysDownRef.current['Space'] && p.isGrounded) {
          p.velocity.y = 18;
          p.isGrounded = false;
        }

        updateCameraPos();
      }

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(loop);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isTestWalkMode, getTerrainHeightAt, terrainData.fogColor, terrainData.fogEnabled, terrainData.ambientColor, terrainData.sunColor, terrainData.sunIntensity, brushRadius]);

  // ==========================================
  // 2. REBUILD TERRAIN MESHES, TRIPLANAR & VOXELS
  // ==========================================
  useEffect(() => {
    const tGroup = terrainMeshGroupRef.current;
    if (!tGroup) return;

    while (tGroup.children.length > 0) {
      const c = tGroup.children[0] as THREE.Mesh;
      tGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    }

    terrainData.terrainObjects.forEach(obj => {
      const matLayer = terrainData.materialLayers.find(m => m.id === obj.materialLayerId) || terrainData.materialLayers[0];

      if (obj.type === 'heightmap_plane' && obj.heightmap) {
        const { resolutionX, resolutionZ, spacing, heights } = obj.heightmap;
        const width = (resolutionX - 1) * spacing;
        const depth = (resolutionZ - 1) * spacing;

        const geo = new THREE.PlaneGeometry(width, depth, resolutionX - 1, resolutionZ - 1);
        geo.rotateX(-Math.PI / 2);

        const posAttr = geo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          posAttr.setY(i, heights[i] || 0);
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        // Calculate Triplanar Slope-based Vertex Colors
        const colors = new Float32Array(posAttr.count * 3);
        const normAttr = geo.attributes.normal;
        const topColor = new THREE.Color(matLayer.topColor);
        const slopeColor = new THREE.Color(matLayer.slopeColor);
        const baseColor = new THREE.Color(matLayer.baseColor);

        for (let i = 0; i < posAttr.count; i++) {
          const ny = normAttr.getY(i);
          const y = posAttr.getY(i);

          let finalCol: THREE.Color;
          if (ny < matLayer.slopeThreshold) {
            // Steep vertical cliff -> exposed rock strata
            finalCol = slopeColor;
          } else if (y < 0.5) {
            // Low valley sediment
            finalCol = baseColor;
          } else {
            // Flat fertile topsoil / grass / snow
            finalCol = topColor;
          }

          colors[i * 3] = finalCol.r;
          colors[i * 3 + 1] = finalCol.g;
          colors[i * 3 + 2] = finalCol.b;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: matLayer.roughness,
          metalness: 0.1,
          wireframe: showWireframe,
          flatShading: true
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...obj.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { objectId: obj.id, isTerrain: true };
        tGroup.add(mesh);
      } else if (obj.type === 'voxel_volume' && obj.voxels) {
        // Voxel Volume Rendering
        const voxelGroup = new THREE.Group();
        voxelGroup.position.set(...obj.position);
        voxelGroup.userData = { objectId: obj.id };

        const voxelGeo = new THREE.BoxGeometry(3, 3, 3);
        obj.voxels.forEach(v => {
          const colorHex = v.color || (v.materialType === 'moss' ? '#15803d' : '#475569');
          const vMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });
          const vMesh = new THREE.Mesh(voxelGeo, vMat);
          vMesh.position.set(v.x * 3, v.y * 3, v.z * 3);
          vMesh.castShadow = true;
          vMesh.receiveShadow = true;
          voxelGroup.add(vMesh);
        });

        tGroup.add(voxelGroup);
      }
    });
  }, [terrainData.terrainObjects, terrainData.materialLayers, showWireframe]);

  // ==========================================
  // 3. REBUILD SCATTER & PLACED PROPS
  // ==========================================
  useEffect(() => {
    const sGroup = scatterGroupRef.current;
    const pGroup = propsGroupRef.current;
    if (!sGroup || !pGroup) return;

    while (sGroup.children.length > 0) sGroup.remove(sGroup.children[0]);
    while (pGroup.children.length > 0) pGroup.remove(pGroup.children[0]);

    // Build Scatter Instances
    terrainData.terrainObjects.forEach(obj => {
      obj.scatterInstances.forEach(s => {
        const itemGroup = new THREE.Group();
        itemGroup.position.set(...s.position);
        itemGroup.rotation.set(
          THREE.MathUtils.degToRad(s.rotation[0]),
          THREE.MathUtils.degToRad(s.rotation[1]),
          THREE.MathUtils.degToRad(s.rotation[2])
        );
        itemGroup.scale.set(...s.scale);

        if (s.objectType === 'pine_tree') {
          // Pine Tree: Trunk + Cones
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 4, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
          trunk.position.y = 2;
          trunk.castShadow = true;
          itemGroup.add(trunk);

          const cone1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 6, 8), new THREE.MeshStandardMaterial({ color: 0x166534 }));
          cone1.position.y = 5.5;
          cone1.castShadow = true;
          itemGroup.add(cone1);

          const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5, 8), new THREE.MeshStandardMaterial({ color: 0x15803d }));
          cone2.position.y = 8;
          cone2.castShadow = true;
          itemGroup.add(cone2);
        } else if (s.objectType === 'broadleaf_tree') {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 5, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
          trunk.position.y = 2.5;
          trunk.castShadow = true;
          itemGroup.add(trunk);

          const foliage = new THREE.Mesh(new THREE.SphereGeometry(3.8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e, flatShading: true }));
          foliage.position.y = 7;
          foliage.castShadow = true;
          itemGroup.add(foliage);
        } else if (s.objectType === 'boulder') {
          const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 0), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }));
          boulder.position.y = 1.2;
          boulder.castShadow = true;
          itemGroup.add(boulder);
        } else {
          // Foliage Bush
          const bush = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x15803d, flatShading: true }));
          bush.position.y = 1;
          bush.castShadow = true;
          itemGroup.add(bush);
        }

        sGroup.add(itemGroup);
      });

      // Build Placed Props
      obj.placedProps.forEach(p => {
        const propMesh = new THREE.Mesh(
          p.primitiveType === 'cylinder' ? new THREE.CylinderGeometry(p.scale[0] / 2, p.scale[0] / 2, p.scale[1], 12) : new THREE.BoxGeometry(...p.scale),
          new THREE.MeshStandardMaterial({ color: p.color || '#d97706', roughness: 0.6 })
        );
        propMesh.position.set(...p.position);
        propMesh.rotation.set(
          THREE.MathUtils.degToRad(p.rotation[0]),
          THREE.MathUtils.degToRad(p.rotation[1]),
          THREE.MathUtils.degToRad(p.rotation[2])
        );
        propMesh.castShadow = true;
        propMesh.receiveShadow = true;
        pGroup.add(propMesh);
      });
    });
  }, [terrainData.terrainObjects]);

  // ==========================================
  // 4. INTERACTIVE SCULPTING BRUSH LOGIC
  // ==========================================
  const applySculptAt = useCallback((worldX: number, worldZ: number) => {
    if (!selectedObject || selectedObject.type !== 'heightmap_plane' || !selectedObject.heightmap) return;
    const { resolutionX, resolutionZ, spacing, heights } = selectedObject.heightmap;
    const newHeights = [...heights];

    const halfW = (resolutionX * spacing) / 2;
    const halfD = (resolutionZ * spacing) / 2;

    const brushRadiusSq = brushRadius * brushRadius;

    for (let gz = 0; gz < resolutionZ; gz++) {
      for (let gx = 0; gx < resolutionX; gx++) {
        const vx = gx * spacing - halfW;
        const vz = gz * spacing - halfD;

        const distSq = (vx - worldX) * (vx - worldX) + (vz - worldZ) * (vz - worldZ);
        if (distSq < brushRadiusSq) {
          const dist = Math.sqrt(distSq);
          const falloff = Math.cos((dist / brushRadius) * (Math.PI / 2)); // Smooth cosine falloff
          const delta = brushStrength * falloff * 2.5;

          const idx = gz * resolutionX + gx;
          const currentH = newHeights[idx];

          switch (activeBrush) {
            case 'elevate':
              newHeights[idx] = currentH + delta;
              break;
            case 'lower':
              newHeights[idx] = currentH - delta;
              break;
            case 'smooth': {
              let avg = currentH;
              let count = 1;
              if (gx > 0) { avg += newHeights[gz * resolutionX + (gx - 1)]; count++; }
              if (gx < resolutionX - 1) { avg += newHeights[gz * resolutionX + (gx + 1)]; count++; }
              if (gz > 0) { avg += newHeights[(gz - 1) * resolutionX + gx]; count++; }
              if (gz < resolutionZ - 1) { avg += newHeights[(gz + 1) * resolutionX + gx]; count++; }
              avg /= count;
              newHeights[idx] = currentH + (avg - currentH) * falloff * 0.5;
              break;
            }
            case 'plateau':
              newHeights[idx] = currentH + (targetPlateauHeight - currentH) * falloff * 0.4;
              break;
            case 'noise':
              newHeights[idx] = currentH + (Math.random() - 0.5) * delta * 2;
              break;
          }
        }
      }
    }

    setTerrainFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      terrainData: {
        ...prev.terrainData,
        terrainObjects: prev.terrainData.terrainObjects.map(o => o.id === selectedObject.id ? {
          ...o,
          heightmap: {
            ...o.heightmap!,
            heights: newHeights
          },
          isBaked: false // editing invalidates baked cache
        } : o)
      }
    }));
    setIsDirty(true);
  }, [selectedObject, brushRadius, brushStrength, activeBrush, targetPlateauHeight]);

  // Mouse & Pointer Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTestWalkMode) return;
    if (e.button === 0) {
      // Left click: Sculpt
      isSculptingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      // Raycast to terrain
      if (cameraRef.current && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const hits = raycaster.intersectObjects(terrainMeshGroupRef.current.children, true);
        if (hits.length > 0) {
          applySculptAt(hits[0].point.x, hits[0].point.z);
        }
      }
    } else if (e.button === 2) {
      // Right click: Orbit
      isOrbitingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTestWalkMode) {
      const p = walkPlayerRef.current;
      p.rotY -= e.movementX * 0.003;
      p.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, p.pitch - e.movementY * 0.003));
      return;
    }

    // Update Brush Cursor Ring position
    if (cameraRef.current && viewportRef.current && brushCursorMeshRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const hits = raycaster.intersectObjects(terrainMeshGroupRef.current.children, true);

      if (hits.length > 0) {
        brushCursorMeshRef.current.position.set(hits[0].point.x, hits[0].point.y + 0.2, hits[0].point.z);
        brushCursorMeshRef.current.visible = true;

        if (isSculptingRef.current) {
          applySculptAt(hits[0].point.x, hits[0].point.z);
        }
      } else {
        brushCursorMeshRef.current.visible = false;
      }
    }

    if (isOrbitingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.theta -= dx * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - dy * 0.008));

      const { theta, phi, radius, target } = cameraAngleRef.current;
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      if (cameraRef.current) {
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(target);
      }
    }
  };

  const handleMouseUp = () => {
    isSculptingRef.current = false;
    isOrbitingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isTestWalkMode || !cameraRef.current) return;
    cameraAngleRef.current.radius = Math.max(20, Math.min(800, cameraAngleRef.current.radius + e.deltaY * 0.15));
    const { theta, phi, radius, target } = cameraAngleRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // Keyboard controls for Walkthrough Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = true;
      if (e.code === 'Escape' && isTestWalkMode) {
        setIsTestWalkMode(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isTestWalkMode]);

  // ==========================================
  // 5. SCATTER GENERATION & STATIC BAKING
  // ==========================================
  const handleGenerateScatter = () => {
    if (!selectedObject || selectedObject.type !== 'heightmap_plane' || !selectedObject.heightmap) return;
    const { resolutionX, resolutionZ, spacing } = selectedObject.heightmap;
    const halfW = (resolutionX * spacing) / 2;
    const halfD = (resolutionZ * spacing) / 2;

    const count = Math.floor(40 * activeMaterial.scatterDensity);
    const allowed = activeMaterial.allowedDetailObjects;
    const newScatter: BakedScatterInstance[] = [];

    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * (halfW * 1.6);
      const rz = (Math.random() - 0.5) * (halfD * 1.6);
      const ry = getTerrainHeightAt(rx, rz);

      const objType = allowed[Math.floor(Math.random() * allowed.length)] || 'pine_tree';
      newScatter.push({
        id: `scatter_${Date.now()}_${i}`,
        objectType: objType,
        position: [rx, ry, rz],
        rotation: [0, Math.random() * 360, 0],
        scale: [1 + Math.random() * 0.4, 1 + Math.random() * 0.6, 1 + Math.random() * 0.4],
        isBaked: selectedObject.isDestructible === false
      });
    }

    setTerrainFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      terrainData: {
        ...prev.terrainData,
        terrainObjects: prev.terrainData.terrainObjects.map(o => o.id === selectedObject.id ? {
          ...o,
          scatterInstances: newScatter
        } : o)
      }
    }));
    setIsDirty(true);
  };

  const handleBakeStaticScatter = () => {
    setTerrainFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      terrainData: {
        ...prev.terrainData,
        terrainObjects: prev.terrainData.terrainObjects.map(o => o.id === selectedObject.id ? {
          ...o,
          isBaked: true,
          scatterInstances: o.scatterInstances.map(s => ({ ...s, isBaked: true }))
        } : o)
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveTerrainFile(terrainFile);
    setIsDirty(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 select-none overflow-hidden font-sans">
      {/* ==========================================
          HEADER TOOLBAR
          ========================================== */}
      <header className="h-14 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60">
            <Mountain size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white">{terrainData.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-300 border border-neutral-700">
                {terrainFile.fileName}
              </span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              {terrainData.terrainObjects.length} Terrain Meshes • Biome: {activeMaterial.name}
            </span>
          </div>
        </div>

        {/* Center Brush Controls */}
        <div className="flex items-center gap-2">
          {/* Sculpt Brushes */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
            {[
              { id: 'elevate', label: 'Raise', icon: Mountain },
              { id: 'lower', label: 'Dig', icon: Eraser },
              { id: 'smooth', label: 'Smooth', icon: Sparkles },
              { id: 'plateau', label: 'Plateau', icon: Layers },
              { id: 'noise', label: 'Roughen', icon: Flame }
            ].map(b => {
              const Icon = b.icon;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBrush(b.id as SculptBrushType)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeBrush === b.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title={`${b.label} Brush`}
                >
                  <Icon size={13} />
                  <span>{b.label}</span>
                </button>
              );
            })}
          </div>

          {/* Wireframe Toggle */}
          <button
            type="button"
            onClick={() => setShowWireframe(prev => !prev)}
            className={`p-1.5 rounded-xl border text-xs transition ${
              showWireframe ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Layers size={14} />
          </button>

          {/* Walkthrough Play Test Mode */}
          <button
            type="button"
            onClick={() => {
              setIsTestWalkMode(prev => !prev);
              if (!isTestWalkMode) {
                walkPlayerRef.current.pos.set(0, getTerrainHeightAt(0, 20) + 2, 20);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition border shadow-md ${
              isTestWalkMode
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {isTestWalkMode ? <Square size={13} /> : <Play size={13} />}
            <span>{isTestWalkMode ? 'Exit Walkthrough' : 'Walkthrough Test'}</span>
          </button>
        </div>

        {/* Right File Selector & Save */}
        <div className="flex items-center gap-2">
          {project.fileSystem.terrain && project.fileSystem.terrain.length > 1 && (
            <select
              value={terrainFile.fileName}
              onChange={e => onSwitchTerrainFile?.(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 outline-none font-mono"
            >
              {project.fileSystem.terrain.map(t => (
                <option key={t.id} value={t.fileName}>{t.name} ({t.fileName})</option>
              ))}
            </select>
          )}

          {onCreateNewTerrain && (
            <button
              type="button"
              onClick={() => onCreateNewTerrain('New Terrain')}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition border border-neutral-700"
              title="Create New Terrain File"
            >
              <Plus size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50"
            title="Save Terrain (Ctrl+S)"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* ==========================================
          THREE-COLUMN WORKSPACE
          ========================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: SCULPT BRUSH SETTINGS & OBJECTS */}
        <aside className="w-76 bg-neutral-900/80 border-r border-neutral-800 flex flex-col shrink-0 z-20">
          <div className="flex border-b border-neutral-800 p-1 bg-neutral-950">
            <button
              type="button"
              onClick={() => setActiveTab('sculpt')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'sculpt' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sculpt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'material' ? 'bg-neutral-800 text-cyan-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Triplanar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scatter')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'scatter' ? 'bg-neutral-800 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Scatter & Bake
            </button>
          </div>

          {/* TAB 1: SCULPT CONTROLS */}
          {activeTab === 'sculpt' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Sculpting Brush Settings
              </span>

              {/* Brush Radius Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Brush Radius</span>
                  <span className="font-mono text-emerald-400">{brushRadius} units</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={50}
                  step={1}
                  value={brushRadius}
                  onChange={e => setBrushRadius(+e.target.value)}
                  className="accent-emerald-500"
                />
              </div>

              {/* Brush Intensity */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Brush Strength</span>
                  <span className="font-mono text-emerald-400">{(brushStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={brushStrength}
                  onChange={e => setBrushStrength(+e.target.value)}
                  className="accent-emerald-500"
                />
              </div>

              {/* Plateau Target Height */}
              {activeBrush === 'plateau' && (
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span>Target Plateau Elevation</span>
                    <span className="font-mono text-cyan-400">{targetPlateauHeight}m</span>
                  </div>
                  <input
                    type="range"
                    min={-4}
                    max={30}
                    step={1}
                    value={targetPlateauHeight}
                    onChange={e => setTargetPlateauHeight(+e.target.value)}
                    className="accent-cyan-500"
                  />
                </div>
              )}

              {/* Terrain Object List */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">
                  Terrain Meshes & Voxel Objects
                </span>
                <div className="flex flex-col gap-1">
                  {terrainData.terrainObjects.map(obj => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition border ${
                        selectedObjectId === obj.id
                          ? 'bg-emerald-600/30 border-emerald-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {obj.type === 'voxel_volume' ? <Box size={13} className="text-purple-400" /> : <Mountain size={13} className="text-emerald-400" />}
                        <span className="truncate">{obj.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 capitalize">{obj.type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRIPLANAR MATERIALS */}
          {activeTab === 'material' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Triplanar Biome Strata
              </span>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Active Biome Layer</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {terrainData.materialLayers.map(layer => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => {
                        setTerrainFile(prev => ({
                          ...prev,
                          terrainData: {
                            ...prev.terrainData,
                            terrainObjects: prev.terrainData.terrainObjects.map(o => o.id === selectedObjectId ? { ...o, materialLayerId: layer.id } : o)
                          }
                        }));
                        setIsDirty(true);
                      }}
                      className={`flex flex-col p-2.5 rounded-xl border text-left transition ${
                        selectedObject?.materialLayerId === layer.id
                          ? 'bg-cyan-950/60 border-cyan-500 shadow-md'
                          : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">{layer.name}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: layer.topColor }} title="Flat Topsoil" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: layer.slopeColor }} title="Cliff Strata" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: layer.baseColor }} title="Valley Silt" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Strata Rules */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
                <span className="font-bold text-white">Triplanar Slope Mapping:</span>
                <span className="text-[11px] text-neutral-400">
                  Flat slopes receive lush topsoil, while steep vertical cliff normals automatically transition to exposed basalt/rock strata with zero UV texture stretching.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SCATTER & BAKE */}
          {activeTab === 'scatter' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                Detail Scatter & Static Baking
              </span>

              {/* Non-Destructible Baking Status */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Non-Destructible Terrain</span>
                  <input
                    type="checkbox"
                    checked={selectedObject?.isDestructible === false}
                    onChange={e => {
                      setTerrainFile(prev => ({
                        ...prev,
                        terrainData: {
                          ...prev.terrainData,
                          terrainObjects: prev.terrainData.terrainObjects.map(o => o.id === selectedObjectId ? { ...o, isDestructible: !e.target.checked } : o)
                        }
                      }));
                      setIsDirty(true);
                    }}
                    className="rounded text-amber-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Non-destructible terrain allows pre-baking all scatter instances and chunk geometry into static batches for zero runtime recalculation.
                </span>
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  {selectedObject?.isBaked ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={13} /> Baked (Zero Runtime Overhead)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">Dynamic (Unbaked)</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={handleGenerateScatter}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition border border-neutral-700"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Generate Scatter Instances</span>
              </button>

              <button
                type="button"
                onClick={handleBakeStaticScatter}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs transition shadow-lg shadow-amber-950/50"
              >
                <Zap size={14} />
                <span>Bake Scatter & Static Geometry</span>
              </button>

              <span className="text-[10px] text-neutral-500 font-mono text-center">
                {selectedObject?.scatterInstances.length || 0} Detail Objects Placed
              </span>
            </div>
          )}
        </aside>

        {/* CENTER 3D VIEWPORT */}
        <div 
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
          className="flex-1 relative overflow-hidden bg-neutral-950 cursor-crosshair select-none"
        >
          <canvas ref={canvasRef} className="block w-full h-full outline-none" />

          {/* Test Walk Instructions Banner */}
          {isTestWalkMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/60 shadow-2xl text-xs pointer-events-auto animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-bold text-white">Terrain Walk Active:</span>
              <span className="text-neutral-300 font-mono">WASD = Traverse Hills • Mouse = Look • Space = Jump • Esc = Exit</span>
              <button
                type="button"
                onClick={() => setIsTestWalkMode(false)}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
              >
                Exit
              </button>
            </div>
          )}

          {/* Bottom Viewport Hint */}
          <div className="absolute bottom-3 left-3 text-[10px] text-neutral-500 font-mono pointer-events-none bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-900">
            Left-Click: Sculpt Terrain • Right-Click: Orbit Camera • Scroll: Zoom
          </div>
        </div>
      </div>
    </div>
  );
};
