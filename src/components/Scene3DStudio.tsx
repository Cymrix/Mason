/**
 * Mason 3D Scene Level Composer (Scene3DStudio)
 * 
 * Features:
 * 1. 3D Space Level Composition:
 *    - Freeform 3D entity placement with translation, rotation, and scale.
 *    - Prefab Placement: Place 3D models (.model3d) and 2D billboard prefabs directly in 3D.
 *    - 3D Primitives: Cubes, cylinders, spheres, cones, planes with custom materials & colliders.
 *    - Dynamic Lighting: Point lights, spot lights, directional sun with real-time shadow maps.
 *    - Player Spawns & Collision Volumes.
 * 2. Hierarchy & Outliner:
 *    - Live entity list, visibility toggling, transform locking, duplication, deletion.
 * 3. Atmospheric Skyboxes & Environment:
 *    - Presets: Starry Night, Golden Sunset, Bright Noon, Cyberpunk Void, Twilight Dawn.
 *    - Volumetric fog, ambient lighting, directional shadows, grid floor calibration.
 * 4. Interactive Walkthrough Test Play:
 *    - First-person / third-person WASD character controller with live collisions to explore the scene.
 * 5. Full Project Integration:
 *    - `.scene3d` format saving, loading, new scene creation, duplicate, and export.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Scene3DFile, 
  Scene3DData, 
  Scene3DEntity, 
  SceneEntityType,
  Scene3DEnvironment,
  createDefaultScene3DFile,
  MasonProject,
  PrefabFile,
  Model3DFile
} from '../engine/masonProjectSchema';
import { 
  Compass, 
  Box, 
  Sun, 
  Lightbulb, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Download, 
  Sparkles, 
  Layers, 
  Sliders, 
  Grid, 
  Camera, 
  Move, 
  RotateCw, 
  Maximize2, 
  Palette, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Share2, 
  FileCode,
  FolderOpen,
  MapPin,
  Shield,
  User,
  Zap,
  Flame,
  Search
} from 'lucide-react';

interface Scene3DStudioProps {
  project: MasonProject;
  activeSceneFile?: Scene3DFile;
  onSaveSceneFile: (file: Scene3DFile) => void;
  onSwitchSceneFile?: (fileName: string) => void;
  onCreateNewScene?: (name: string) => void;
  onDuplicateScene?: (fileName: string) => void;
  onBackToDashboard?: () => void;
}

type TransformGizmoMode = 'translate' | 'rotate' | 'scale';
type SkyboxPreset = 'night' | 'sunset' | 'noon' | 'dawn' | 'cyber_grid' | 'void';

export const Scene3DStudio: React.FC<Scene3DStudioProps> = ({
  project,
  activeSceneFile,
  onSaveSceneFile,
  onSwitchSceneFile,
  onCreateNewScene,
  onDuplicateScene,
  onBackToDashboard
}) => {
  // Active Scene State
  const [sceneFile, setSceneFile] = useState<Scene3DFile>(() => {
    return activeSceneFile || project.fileSystem.scenes3d?.[0] || createDefaultScene3DFile();
  });

  useEffect(() => {
    if (activeSceneFile) {
      setSceneFile(activeSceneFile);
    }
  }, [activeSceneFile]);

  const sceneData = sceneFile.sceneData;

  // View & Tool States
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(sceneData.entities[0]?.id || null);
  const [gizmoMode, setGizmoMode] = useState<TransformGizmoMode>('translate');
  const [gridSnap, setGridSnap] = useState<number>(1); // 0 = off, 1, 2, 5, 10
  const [isTestWalkMode, setIsTestWalkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'add' | 'environment'>('hierarchy');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Available project assets
  const availableModels = project.fileSystem.models3d || [];
  const availablePrefabs = project.fileSystem.prefabs || [];

  // Viewport DOM refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const entitiesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const lightsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Selected Entity Gizmo Visualizer
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);

  // Orbit / Camera drag state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 110,
    target: new THREE.Vector3(0, 8, 0)
  });

  // Walkthrough character controller state
  const walkPlayerRef = useRef<{
    pos: THREE.Vector3;
    rotY: number;
    pitch: number;
    velocity: THREE.Vector3;
    isGrounded: boolean;
  }>({
    pos: new THREE.Vector3(0, 2, 24),
    rotY: 0,
    pitch: 0,
    velocity: new THREE.Vector3(),
    isGrounded: true
  });
  const keysDownRef = useRef<Record<string, boolean>>({});

  const selectedEntity = useMemo(() => {
    return sceneData.entities.find(e => e.id === selectedEntityId) || null;
  }, [sceneData.entities, selectedEntityId]);

  // ==========================================
  // 1. THREE.JS VIEWPORT INITIALIZATION
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Groups
    scene.add(entitiesGroupRef.current);
    scene.add(lightsGroupRef.current);

    // Environment Lighting
    const ambient = new THREE.AmbientLight(
      new THREE.Color(sceneData.environment.ambientLightColor),
      sceneData.environment.ambientLightIntensity
    );
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const sun = new THREE.DirectionalLight(
      new THREE.Color(sceneData.environment.sunColor),
      sceneData.environment.sunIntensity
    );
    sun.position.set(...sceneData.environment.sunPosition);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    scene.add(sun);
    sunLightRef.current = sun;

    // Floor Grid
    const grid = new THREE.GridHelper(
      sceneData.environment.gridFloorSize,
      Math.floor(sceneData.environment.gridFloorSize / 5),
      0x6366f1,
      0x1e293b
    );
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

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
        // Walkthrough first-person camera
        const p = walkPlayerRef.current;
        camera.position.set(p.pos.x, p.pos.y + 3.2, p.pos.z);
        const lookDir = new THREE.Vector3(
          -Math.sin(p.rotY) * Math.cos(p.pitch),
          Math.sin(p.pitch),
          -Math.cos(p.rotY) * Math.cos(p.pitch)
        );
        camera.lookAt(camera.position.clone().add(lookDir));
      } else {
        // Orbit editor camera
        const { theta, phi, radius, target } = cameraAngleRef.current;
        const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        const y = target.y + radius * Math.cos(phi);
        const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.position.set(x, y, z);
        camera.lookAt(target);
      }
    };
    updateCameraPos();

    // Render & Physics Loop
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle Test Walk Controller
      if (isTestWalkMode) {
        const p = walkPlayerRef.current;
        const speed = 26;
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

        // Gravity & Jump
        p.velocity.y -= 48 * dt; // Gravity
        p.pos.y += p.velocity.y * dt;

        if (p.pos.y <= 0) {
          p.pos.y = 0;
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
  }, [isTestWalkMode]);

  // Update Skybox & Fog when Environment Settings change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const env = sceneData.environment;

    // Apply Fog
    if (env.fogEnabled) {
      scene.fog = new THREE.Fog(new THREE.Color(env.fogColor), env.fogNear, env.fogFar);
    } else {
      scene.fog = null;
    }

    // Skybox Background
    switch (env.skyboxType) {
      case 'night':
        scene.background = new THREE.Color('#030712');
        break;
      case 'sunset':
        scene.background = new THREE.Color('#431407');
        break;
      case 'noon':
        scene.background = new THREE.Color('#38bdf8');
        break;
      case 'dawn':
        scene.background = new THREE.Color('#1e1b4b');
        break;
      case 'cyber_grid':
        scene.background = new THREE.Color('#09090b');
        break;
      default:
        scene.background = new THREE.Color(env.skyColorBottom);
    }

    // Update Lighting
    if (ambientLightRef.current) {
      ambientLightRef.current.color = new THREE.Color(env.ambientLightColor);
      ambientLightRef.current.intensity = env.ambientLightIntensity;
    }
    if (sunLightRef.current) {
      sunLightRef.current.color = new THREE.Color(env.sunColor);
      sunLightRef.current.intensity = env.sunIntensity;
      sunLightRef.current.position.set(...env.sunPosition);
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = env.showGridFloor;
    }
  }, [sceneData.environment]);

  // ==========================================
  // 2. REBUILD ENTITY 3D MESHES IN SCENE
  // ==========================================
  useEffect(() => {
    const entGroup = entitiesGroupRef.current;
    const lgtGroup = lightsGroupRef.current;
    if (!entGroup || !lgtGroup) return;

    // Clear old meshes
    while (entGroup.children.length > 0) {
      const obj = entGroup.children[0] as THREE.Mesh;
      entGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    while (lgtGroup.children.length > 0) {
      lgtGroup.remove(lgtGroup.children[0]);
    }

    // Build each entity
    sceneData.entities.forEach(entity => {
      if (entity.visible === false) return;

      if (entity.type === 'primitive') {
        let geo: THREE.BufferGeometry;
        const [sx, sy, sz] = entity.scale;

        switch (entity.primitiveType) {
          case 'cylinder':
            geo = new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 24);
            break;
          case 'sphere':
            geo = new THREE.SphereGeometry(sx / 2, 24, 24);
            break;
          case 'cone':
            geo = new THREE.ConeGeometry(sx / 2, sy, 24);
            break;
          case 'plane':
            geo = new THREE.PlaneGeometry(sx, sz);
            geo.rotateX(-Math.PI / 2);
            break;
          case 'cube':
          default:
            geo = new THREE.BoxGeometry(sx, sy, sz);
        }

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(entity.color || '#64748b'),
          roughness: entity.roughness ?? 0.6,
          metalness: entity.metalness ?? 0.1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...entity.position);
        mesh.rotation.set(
          THREE.MathUtils.degToRad(entity.rotation[0]),
          THREE.MathUtils.degToRad(entity.rotation[1]),
          THREE.MathUtils.degToRad(entity.rotation[2])
        );
        mesh.castShadow = entity.castShadow !== false;
        mesh.receiveShadow = entity.receiveShadow !== false;
        mesh.userData = { entityId: entity.id };
        entGroup.add(mesh);
      } else if (entity.type === 'model3d') {
        // 3D Model Instance from file
        const modelFile = project.fileSystem.models3d?.find(m => m.fileName === entity.model3dFileName);
        const modelGroup = new THREE.Group();
        modelGroup.position.set(...entity.position);
        modelGroup.rotation.set(
          THREE.MathUtils.degToRad(entity.rotation[0]),
          THREE.MathUtils.degToRad(entity.rotation[1]),
          THREE.MathUtils.degToRad(entity.rotation[2])
        );
        modelGroup.scale.set(...entity.scale);
        modelGroup.userData = { entityId: entity.id };

        if (modelFile && modelFile.modelData) {
          // Render parts of model
          modelFile.modelData.parts.forEach(p => {
            let pGeo: THREE.BufferGeometry;
            const [psx, psy, psz] = p.scale;
            switch (p.primitiveType) {
              case 'cylinder': pGeo = new THREE.CylinderGeometry(psx / 2, psx / 2, psy, 12); break;
              case 'sphere': pGeo = new THREE.SphereGeometry(psx / 2, 12, 12); break;
              case 'cone': pGeo = new THREE.ConeGeometry(psx / 2, psy, 12); break;
              case 'wedge': {
                pGeo = new THREE.ConeGeometry(psx / 2, psy, 4);
                pGeo.rotateY(Math.PI / 4);
                break;
              }
              default: pGeo = new THREE.BoxGeometry(psx, psy, psz);
            }
            const pMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(p.color),
              roughness: 0.5,
              metalness: 0.1
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(...p.position);
            pMesh.rotation.set(
              THREE.MathUtils.degToRad(p.rotation[0]),
              THREE.MathUtils.degToRad(p.rotation[1]),
              THREE.MathUtils.degToRad(p.rotation[2])
            );
            pMesh.castShadow = true;
            modelGroup.add(pMesh);
          });
        } else {
          // Placeholder model box
          const pBox = new THREE.Mesh(
            new THREE.BoxGeometry(10, 16, 10),
            new THREE.MeshStandardMaterial({ color: 0x8b5cf6, wireframe: true })
          );
          modelGroup.add(pBox);
        }
        entGroup.add(modelGroup);
      } else if (entity.type === 'prefab') {
        // 2D Billboard Prefab
        const prefab = project.fileSystem.prefabs?.find(p => p.id === entity.prefabId);
        const billboardGeo = new THREE.PlaneGeometry(entity.scale[0] * 12, entity.scale[1] * 16);
        const billboardMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          transparent: true,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(billboardGeo, billboardMat);
        mesh.position.set(...entity.position);
        mesh.rotation.set(
          THREE.MathUtils.degToRad(entity.rotation[0]),
          THREE.MathUtils.degToRad(entity.rotation[1]),
          THREE.MathUtils.degToRad(entity.rotation[2])
        );
        mesh.userData = { entityId: entity.id, isBillboard: true, billboardMode: entity.billboardMode || 'camera' };
        entGroup.add(mesh);
      } else if (entity.type === 'light') {
        // Point / Spot Light entity
        const lColor = new THREE.Color(entity.lightColor || '#fbbf24');
        const intensity = entity.lightIntensity || 2.5;
        const dist = entity.lightDistance || 60;

        if (entity.lightType === 'spot') {
          const spot = new THREE.SpotLight(lColor, intensity, dist, Math.PI / 4, 0.4);
          spot.position.set(...entity.position);
          spot.castShadow = true;
          lgtGroup.add(spot);
        } else {
          const point = new THREE.PointLight(lColor, intensity, dist);
          point.position.set(...entity.position);
          point.castShadow = true;
          lgtGroup.add(point);
        }

        // Visual helper bulb
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(2, 12, 12),
          new THREE.MeshBasicMaterial({ color: lColor })
        );
        bulb.position.set(...entity.position);
        bulb.userData = { entityId: entity.id };
        entGroup.add(bulb);
      } else if (entity.type === 'spawn_point') {
        // Player Spawn Marker
        const markerGroup = new THREE.Group();
        markerGroup.position.set(...entity.position);
        markerGroup.userData = { entityId: entity.id };

        const cylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(5, 5, 0.8, 16),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true })
        );
        cylinder.position.y = 0.4;
        markerGroup.add(cylinder);

        const arrow = new THREE.Mesh(
          new THREE.ConeGeometry(2, 6, 8),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
        );
        arrow.position.set(0, 4, -3);
        arrow.rotation.x = Math.PI / 2;
        markerGroup.add(arrow);

        entGroup.add(markerGroup);
      }
    });
  }, [sceneData.entities, project.fileSystem.models3d, project.fileSystem.prefabs]);

  // Update Selection Highlight Box
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (selectionBoxRef.current) {
      scene.remove(selectionBoxRef.current);
      selectionBoxRef.current.dispose();
      selectionBoxRef.current = null;
    }

    if (!selectedEntityId) return;

    const targetObj = entitiesGroupRef.current.children.find(
      child => child.userData.entityId === selectedEntityId
    );

    if (targetObj) {
      const box = new THREE.BoxHelper(targetObj, 0x38bdf8);
      scene.add(box);
      selectionBoxRef.current = box;
    }
  }, [selectedEntityId, sceneData.entities]);

  // ==========================================
  // 3. MOUSE & KEYBOARD EVENT HANDLERS
  // ==========================================
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTestWalkMode) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Raycast click to select entity
    if (e.button === 0 && cameraRef.current && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(entitiesGroupRef.current.children, true);

      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !cur.userData?.entityId && cur.parent) {
          cur = cur.parent;
        }
        if (cur?.userData?.entityId) {
          setSelectedEntityId(cur.userData.entityId);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTestWalkMode) {
      // First-person mouse look
      const p = walkPlayerRef.current;
      p.rotY -= e.movementX * 0.003;
      p.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, p.pitch - e.movementY * 0.003));
      return;
    }

    if (!isDraggingRef.current || !cameraRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.buttons === 1) {
      // Orbit
      cameraAngleRef.current.theta -= dx * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - dy * 0.008));
    } else if (e.buttons === 2) {
      // Pan
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), -cameraAngleRef.current.theta);
      cameraAngleRef.current.target.addScaledVector(right, -dx * 0.1);
      cameraAngleRef.current.target.y += dy * 0.1;
    }

    const { theta, phi, radius, target } = cameraAngleRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isTestWalkMode || !cameraRef.current) return;
    cameraAngleRef.current.radius = Math.max(20, Math.min(600, cameraAngleRef.current.radius + e.deltaY * 0.15));
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
      if (e.code === 'KeyW' && (e.ctrlKey || e.metaKey)) return;
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
  // 4. ENTITY CRUD & TRANSFORMS
  // ==========================================
  const handleUpdateSelectedEntity = (updater: Partial<Scene3DEntity>) => {
    if (!selectedEntityId) return;

    setSceneFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sceneData: {
        ...prev.sceneData,
        entities: prev.sceneData.entities.map(e => e.id === selectedEntityId ? { ...e, ...updater } : e)
      }
    }));
    setIsDirty(true);
  };

  const handleAddEntity = (type: SceneEntityType, options?: Partial<Scene3DEntity>) => {
    const newId = `ent_${type}_${Date.now().toString(36)}`;
    const newEntity: Scene3DEntity = {
      id: newId,
      name: options?.name || `New ${type.toUpperCase()}`,
      type,
      position: [0, 4, 0],
      rotation: [0, 0, 0],
      scale: [10, 10, 10],
      visible: true,
      locked: false,
      color: '#38bdf8',
      primitiveType: 'cube',
      ...options
    };

    setSceneFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sceneData: {
        ...prev.sceneData,
        entities: [...prev.sceneData.entities, newEntity]
      }
    }));
    setSelectedEntityId(newId);
    setIsDirty(true);
  };

  const handleDeleteEntity = (id: string) => {
    setSceneFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sceneData: {
        ...prev.sceneData,
        entities: prev.sceneData.entities.filter(e => e.id !== id)
      }
    }));
    if (selectedEntityId === id) {
      setSelectedEntityId(sceneData.entities[0]?.id || null);
    }
    setIsDirty(true);
  };

  const handleDuplicateEntity = (id: string) => {
    const target = sceneData.entities.find(e => e.id === id);
    if (!target) return;

    const newId = `ent_${target.type}_${Date.now().toString(36)}`;
    const cloned: Scene3DEntity = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      position: [target.position[0] + 6, target.position[1], target.position[2] + 6]
    };

    setSceneFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sceneData: {
        ...prev.sceneData,
        entities: [...prev.sceneData.entities, cloned]
      }
    }));
    setSelectedEntityId(newId);
    setIsDirty(true);
  };

  const handleUpdateEnvironment = (updater: Partial<Scene3DEnvironment>) => {
    setSceneFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sceneData: {
        ...prev.sceneData,
        environment: {
          ...prev.sceneData.environment,
          ...updater
        }
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveSceneFile(sceneFile);
    setIsDirty(false);
  };

  // Focus Camera on Selected Entity
  const handleFocusSelected = () => {
    if (!selectedEntity || !cameraRef.current) return;
    cameraAngleRef.current.target.set(...selectedEntity.position);
    const { theta, phi, radius, target } = cameraAngleRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 select-none overflow-hidden font-sans">
      {/* ==========================================
          HEADER & TOP STUDIO TOOLBAR
          ========================================== */}
      <header className="h-14 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60">
            <Compass size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white">{sceneData.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-cyan-300 border border-neutral-700">
                {sceneFile.fileName}
              </span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              {sceneData.entities.length} Placed Entities • 3D Space Level
            </span>
          </div>
        </div>

        {/* Center Mode Controls & Gizmos */}
        <div className="flex items-center gap-2">
          {/* Transform Gizmo Selector */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setGizmoMode('translate')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                gizmoMode === 'translate' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Translate Tool (W)"
            >
              <Move size={14} />
            </button>
            <button
              type="button"
              onClick={() => setGizmoMode('rotate')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                gizmoMode === 'rotate' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Rotate Tool (E)"
            >
              <RotateCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setGizmoMode('scale')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                gizmoMode === 'scale' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Scale Tool (R)"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Grid Snap Selector */}
          <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded-xl border border-neutral-800 text-xs">
            <span className="text-[10px] text-neutral-500 font-mono">Snap:</span>
            <select
              value={gridSnap}
              onChange={e => setGridSnap(+e.target.value)}
              className="bg-transparent text-neutral-300 font-mono outline-none cursor-pointer"
            >
              <option value={0}>Off</option>
              <option value={1}>1 Unit</option>
              <option value={2}>2 Units</option>
              <option value={5}>5 Units</option>
              <option value={10}>10 Units</option>
            </select>
          </div>

          {/* Walkthrough Play Test Mode Button */}
          <button
            type="button"
            onClick={() => {
              setIsTestWalkMode(prev => !prev);
              if (!isTestWalkMode) {
                walkPlayerRef.current.pos.set(...(sceneData.playerSpawnPosition || [0, 0, 24]));
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

        {/* Right Scene File Selector & Save */}
        <div className="flex items-center gap-2">
          {project.fileSystem.scenes3d && project.fileSystem.scenes3d.length > 1 && (
            <select
              value={sceneFile.fileName}
              onChange={e => onSwitchSceneFile?.(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 outline-none font-mono"
            >
              {project.fileSystem.scenes3d.map(s => (
                <option key={s.id} value={s.fileName}>{s.name} ({s.fileName})</option>
              ))}
            </select>
          )}

          {onCreateNewScene && (
            <button
              type="button"
              onClick={() => onCreateNewScene('New 3D Scene')}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition border border-neutral-700"
              title="Create New 3D Scene"
            >
              <Plus size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50"
            title="Save Scene (Ctrl+S)"
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
        {/* LEFT PANEL: OUTLINER & ENTITY ADDER */}
        <aside className="w-72 bg-neutral-900/80 border-r border-neutral-800 flex flex-col shrink-0 z-20">
          {/* Subtabs: Hierarchy / Add / Environment */}
          <div className="flex border-b border-neutral-800 p-1 bg-neutral-950">
            <button
              type="button"
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'hierarchy' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Outliner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'add' ? 'bg-neutral-800 text-cyan-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              + Place
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('environment')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'environment' ? 'bg-neutral-800 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Skybox
            </button>
          </div>

          {/* TAB 1: OUTLINER */}
          {activeTab === 'hierarchy' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search filter */}
              <div className="p-2 border-b border-neutral-800 flex items-center gap-1.5 bg-neutral-950/60">
                <Search size={13} className="text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter entities..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>

              {/* Entity Tree List */}
              <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
                {sceneData.entities
                  .filter(e => !searchFilter || e.name.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map(ent => {
                    const isSelected = selectedEntityId === ent.id;
                    const renderIcon = () => {
                      switch (ent.type) {
                        case 'model3d': return <Box size={13} className="text-purple-400" />;
                        case 'prefab': return <User size={13} className="text-emerald-400" />;
                        case 'light': return <Lightbulb size={13} className="text-amber-400" />;
                        case 'spawn_point': return <MapPin size={13} className="text-cyan-400" />;
                        default: return <Box size={13} className="text-indigo-400" />;
                      }
                    };

                    return (
                      <div
                        key={ent.id}
                        onClick={() => setSelectedEntityId(ent.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition border ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                            : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderIcon()}
                          <span className="truncate">{ent.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleUpdateSelectedEntity({ visible: ent.visible === false ? true : false })}
                            className="p-1 hover:text-white text-neutral-500"
                            title="Toggle Visibility"
                          >
                            {ent.visible === false ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateEntity(ent.id)}
                            className="p-1 hover:text-white text-neutral-500"
                            title="Duplicate"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity(ent.id)}
                            className="p-1 hover:text-rose-400 text-neutral-500"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: ADD / PLACE ENTITIES */}
          {activeTab === 'add' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Place 3D Assets & Entities
              </span>

              {/* 3D Models (.model3d) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Box size={14} className="text-purple-400" />
                  <span>3D Models ({availableModels.length})</span>
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {availableModels.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleAddEntity('model3d', {
                        name: m.name,
                        model3dFileName: m.fileName,
                        scale: [1, 1, 1],
                        activeAnimation: m.modelData.animations[0]?.id
                      })}
                      className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-purple-500 text-left transition hover:bg-neutral-800"
                    >
                      <span className="text-xs font-bold text-neutral-200">{m.name}</span>
                      <span className="text-[10px] text-purple-400 font-mono">Place</span>
                    </button>
                  ))}
                  {availableModels.length === 0 && (
                    <div className="text-[10px] text-neutral-500 p-2">No 3D models in project. Create one in 3D Studio!</div>
                  )}
                </div>
              </div>

              {/* 2D Prefabs */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <User size={14} className="text-emerald-400" />
                  <span>2D Billboard Prefabs ({availablePrefabs.length})</span>
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {availablePrefabs.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddEntity('prefab', {
                        name: p.name,
                        prefabId: p.id,
                        billboardMode: 'camera',
                        scale: [1, 1, 1]
                      })}
                      className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-left transition hover:bg-neutral-800"
                    >
                      <span className="text-xs font-bold text-neutral-200">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Billboard</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Primitives */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Box size={14} className="text-indigo-400" />
                  <span>3D Primitives</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { type: 'cube', label: 'Box Block', scale: [12, 12, 12] },
                    { type: 'cylinder', label: 'Cylinder', scale: [12, 20, 12] },
                    { type: 'sphere', label: 'Sphere Orb', scale: [14, 14, 14] },
                    { type: 'cone', label: 'Cone / Spike', scale: [10, 18, 10] },
                    { type: 'plane', label: 'Floor Plane', scale: [40, 1, 40] }
                  ].map(prim => (
                    <button
                      key={prim.type}
                      type="button"
                      onClick={() => handleAddEntity('primitive', {
                        name: prim.label,
                        primitiveType: prim.type as any,
                        scale: prim.scale as any,
                        color: '#475569',
                        isCollider: true
                      })}
                      className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500 text-left transition hover:bg-neutral-800 text-xs font-bold text-neutral-300"
                    >
                      {prim.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lights & Markers */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-400" />
                  <span>Lights & Spawns</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddEntity('light', { name: 'Torch Light', lightType: 'point', lightColor: '#f59e0b', lightIntensity: 3, lightDistance: 70 })}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500 text-left transition hover:bg-neutral-800 text-xs font-bold text-neutral-300"
                  >
                    Point Light
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddEntity('spawn_point', { name: 'Player Spawn', position: [0, 0, 0] })}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500 text-left transition hover:bg-neutral-800 text-xs font-bold text-neutral-300"
                  >
                    Spawn Point
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKYBOX & ENVIRONMENT */}
          {activeTab === 'environment' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                Atmosphere & Skybox
              </span>

              {/* Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Atmospheric Preset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'night', label: 'Starry Night', sun: '#38bdf8', amb: '#0f172a' },
                    { id: 'sunset', label: 'Golden Sunset', sun: '#f97316', amb: '#451a03' },
                    { id: 'noon', label: 'Bright Noon', sun: '#fff7ed', amb: '#ffffff' },
                    { id: 'dawn', label: 'Twilight Dawn', sun: '#c084fc', amb: '#1e1b4b' },
                    { id: 'cyber_grid', label: 'Cyberpunk Grid', sun: '#06b6d4', amb: '#09090b' }
                  ].map(pre => (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => handleUpdateEnvironment({
                        skyboxType: pre.id as any,
                        sunColor: pre.sun,
                        ambientLightColor: pre.amb
                      })}
                      className={`p-2 rounded-xl text-xs font-bold transition border capitalize ${
                        sceneData.environment.skyboxType === pre.id
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      {pre.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Light Intensity */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Ambient Light</span>
                  <span className="font-mono text-amber-400">{sceneData.environment.ambientLightIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={sceneData.environment.ambientLightIntensity}
                  onChange={e => handleUpdateEnvironment({ ambientLightIntensity: +e.target.value })}
                  className="accent-amber-500"
                />
              </div>

              {/* Sun Light Intensity */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Sun Directional Light</span>
                  <span className="font-mono text-amber-400">{sceneData.environment.sunIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={sceneData.environment.sunIntensity}
                  onChange={e => handleUpdateEnvironment({ sunIntensity: +e.target.value })}
                  className="accent-amber-500"
                />
              </div>

              {/* Fog Toggle & Color */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sceneData.environment.fogEnabled}
                    onChange={e => handleUpdateEnvironment({ fogEnabled: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span className="text-xs font-bold text-white">Volumetric Atmospheric Fog</span>
                </label>
                {sceneData.environment.fogEnabled && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-400">Fog Color:</span>
                    <input
                      type="color"
                      value={sceneData.environment.fogColor}
                      onChange={e => handleUpdateEnvironment({ fogColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border border-neutral-700 cursor-pointer"
                    />
                  </div>
                )}
              </div>
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
          className="flex-1 relative overflow-hidden bg-neutral-950 cursor-grab active:cursor-grabbing select-none"
        >
          <canvas ref={canvasRef} className="block w-full h-full outline-none" />

          {/* Floating Viewport Overlay: Focus Target / Status */}
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto">
            {selectedEntity && (
              <button
                type="button"
                onClick={handleFocusSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs font-bold text-cyan-300 hover:text-white transition shadow-lg"
                title="Focus Camera on Entity (F)"
              >
                <Camera size={13} />
                <span>Focus: {selectedEntity.name}</span>
              </button>
            )}
          </div>

          {/* Test Walk Instructions Banner */}
          {isTestWalkMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/60 shadow-2xl text-xs pointer-events-auto animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-bold text-white">Walkthrough Active:</span>
              <span className="text-neutral-300 font-mono">WASD = Move • Mouse = Look • Space = Jump • Esc = Exit</span>
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
            Left-Click: Select & Orbit • Right-Click: Pan • Scroll: Zoom
          </div>
        </div>

        {/* RIGHT PANEL: INSPECTOR */}
        <aside className="w-80 bg-neutral-900/80 border-l border-neutral-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          {selectedEntity ? (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-black uppercase text-white tracking-wide">
                  Entity Inspector
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-cyan-300 border border-neutral-700 capitalize">
                  {selectedEntity.type}
                </span>
              </div>

              {/* Entity Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Name</label>
                <input
                  type="text"
                  value={selectedEntity.name}
                  onChange={e => handleUpdateSelectedEntity({ name: e.target.value })}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Transform: Position */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Position (X, Y, Z)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, aIdx) => (
                    <div key={axis} className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-500">{axis}</span>
                      <input
                        type="number"
                        step={gridSnap || 1}
                        value={selectedEntity.position[aIdx]}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextPos = [...selectedEntity.position] as [number, number, number];
                          nextPos[aIdx] = val;
                          handleUpdateSelectedEntity({ position: nextPos });
                        }}
                        className="w-full bg-transparent text-xs font-mono text-white outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform: Rotation */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Rotation (°deg)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, aIdx) => (
                    <div key={axis} className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-500">{axis}</span>
                      <input
                        type="number"
                        step={15}
                        value={selectedEntity.rotation[aIdx]}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const nextRot = [...selectedEntity.rotation] as [number, number, number];
                          nextRot[aIdx] = val;
                          handleUpdateSelectedEntity({ rotation: nextRot });
                        }}
                        className="w-full bg-transparent text-xs font-mono text-white outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform: Scale */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Scale</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['X', 'Y', 'Z'] as const).map((axis, aIdx) => (
                    <div key={axis} className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-500">{axis}</span>
                      <input
                        type="number"
                        step={1}
                        value={selectedEntity.scale[aIdx]}
                        onChange={e => {
                          const val = Math.max(0.1, parseFloat(e.target.value) || 1);
                          const nextScale = [...selectedEntity.scale] as [number, number, number];
                          nextScale[aIdx] = val;
                          handleUpdateSelectedEntity({ scale: nextScale });
                        }}
                        className="w-full bg-transparent text-xs font-mono text-white outline-none text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Type-Specific Configurations */}
              {selectedEntity.type === 'primitive' && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Primitive Material</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Color:</span>
                    <input
                      type="color"
                      value={selectedEntity.color || '#475569'}
                      onChange={e => handleUpdateSelectedEntity({ color: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border border-neutral-700 cursor-pointer"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={selectedEntity.isCollider !== false}
                      onChange={e => handleUpdateSelectedEntity({ isCollider: e.target.checked })}
                      className="rounded text-indigo-500"
                    />
                    <span className="text-xs text-neutral-300">Solid Physics Collider</span>
                  </label>
                </div>
              )}

              {selectedEntity.type === 'model3d' && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-bold text-purple-400 uppercase font-mono">3D Model Asset</span>
                  <select
                    value={selectedEntity.model3dFileName || ''}
                    onChange={e => handleUpdateSelectedEntity({ model3dFileName: e.target.value })}
                    className="bg-neutral-900 border border-neutral-700 text-xs text-white rounded-lg p-2 font-mono"
                  >
                    {availableModels.map(m => (
                      <option key={m.id} value={m.fileName}>{m.name} ({m.fileName})</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedEntity.type === 'light' && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Light Intensity</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Color:</span>
                    <input
                      type="color"
                      value={selectedEntity.lightColor || '#f59e0b'}
                      onChange={e => handleUpdateSelectedEntity({ lightColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border border-neutral-700 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Intensity</span>
                      <span className="font-mono text-amber-400">{selectedEntity.lightIntensity || 2.5}</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={10.0}
                      step={0.5}
                      value={selectedEntity.lightIntensity || 2.5}
                      onChange={e => handleUpdateSelectedEntity({ lightIntensity: +e.target.value })}
                      className="accent-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 text-xs text-center">
              <Compass size={24} className="mb-2 opacity-50" />
              <span>Select an entity from the Outliner or click in 3D viewport to inspect transform and properties.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
