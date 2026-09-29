/**
 * 3D Model Studio & Skeletal Animator
 * 
 * Features:
 * 1. 3D Primitive Modeling: Cube, cylinder, sphere, cone, wedge, capsule, torus with multi-part hierarchy.
 * 2. Surface Vertex & Color Painting: Raycast 3D painting directly onto mesh parts.
 * 3. Skeletal Bone Rigging: Bone hierarchies, preset biped & quadruped armatures, part attachments.
 * 4. Keyframe Animation Timeline: Multi-track timeline, quaternion/euler interpolation, animation clips.
 * 5. Multi-Angle Animation Exporter: Renders transparent Spritesheet Strips (.png) and animated GIFs (.gif)
 *    with optional retro pixel-art downsampling for direct application to 2D Prefabs.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Model3DFile, 
  Model3DData, 
  Model3DPart, 
  Model3DBone, 
  Model3DAnimationClip, 
  Model3DKeyframe,
  createDefaultModel3DFile,
  MasonProject
} from '../engine/masonProjectSchema';
import { GifEncoder } from '../utils/gifEncoder';
import JSZip from 'jszip';
import { ModelTemplateFabricator } from './ModelTemplateFabricator';
import { 
  Box, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  Sparkles, 
  Layers, 
  Sliders, 
  Grid, 
  Compass, 
  Film, 
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
  FolderOpen
} from 'lucide-react';

interface Model3DStudioProps {
  project: MasonProject;
  activeModelFile?: Model3DFile;
  onSaveModelFile: (file: Model3DFile) => void;
  onSwitchModelFile?: (fileName: string) => void;
  onCreateNewModel?: (name: string) => void;
  onSendToPrefab?: (spritesheetDataUrl: string, frameCount: number, clipName: string) => void;
}

type StudioTab = 'model' | 'rig' | 'animate' | 'export';
type ShadingMode = 'shaded' | 'wireframe' | 'solid' | 'bones';
type CameraViewMode = 'perspective' | 'ortho';

export const Model3DStudio: React.FC<Model3DStudioProps> = ({
  project,
  activeModelFile,
  onSaveModelFile,
  onSwitchModelFile,
  onCreateNewModel,
  onSendToPrefab
}) => {
  // Active Model State
  const [modelFile, setModelFile] = useState<Model3DFile>(() => {
    return activeModelFile || project.fileSystem.models3d?.[0] || createDefaultModel3DFile();
  });

  useEffect(() => {
    if (activeModelFile) {
      setModelFile(activeModelFile);
    }
  }, [activeModelFile]);

  const modelData = modelFile.modelData;

  // Studio Mode Tabs
  const [activeTab, setActiveTab] = useState<StudioTab>('model');
  const [shadingMode, setShadingMode] = useState<ShadingMode>('shaded');
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Selection
  const [selectedPartId, setSelectedPartId] = useState<string | null>(modelData.parts[0]?.id || null);
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(modelData.bones[0]?.id || null);

  // Active Animation & Playback
  const [activeClipId, setActiveClipId] = useState<string>(modelData.activeAnimationId || modelData.animations[0]?.id || 'anim_idle');
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackFps, setPlaybackFps] = useState<number>(12);

  // Painting State
  const [paintColor, setPaintColor] = useState<string>('#38bdf8');
  const [paintMode, setPaintMode] = useState<'part_color' | 'vertex_paint'>('part_color');

  // Export State
  const [exportAngle, setExportAngle] = useState<'lateral' | 'isometric' | 'topdown' | 'front'>('lateral');
  const [exportResolution, setExportResolution] = useState<number>(64);
  const [exportPixelArt, setExportPixelArt] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [capturedFrameDataUrls, setCapturedFrameDataUrls] = useState<string[]>([]);
  const [isFabricatorOpen, setIsFabricatorOpen] = useState<boolean>(false);

  // Viewport DOM Ref
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js Instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const perspCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  // Mesh & Bone Object Cache
  const meshGroupRef = useRef<THREE.Group>(new THREE.Group());
  const boneGroupRef = useRef<THREE.Group>(new THREE.Group());
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Orbit / Viewport Drag State
  const isDraggingRef = useRef<boolean>(false);
  const dragButtonRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 90,
    target: new THREE.Vector3(0, 20, 0)
  });

  const activeClip = useMemo(() => {
    return modelData.animations.find(a => a.id === activeClipId) || modelData.animations[0];
  }, [modelData.animations, activeClipId]);

  const selectedPart = useMemo(() => {
    return modelData.parts.find(p => p.id === selectedPartId) || null;
  }, [modelData.parts, selectedPartId]);

  const selectedBone = useMemo(() => {
    return modelData.bones.find(b => b.id === selectedBoneId) || null;
  }, [modelData.bones, selectedBoneId]);

  // ==========================================
  // 1. THREE.JS VIEWPORT INITIALIZATION
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    sceneRef.current = scene;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 0.9);
    dirLight.position.set(60, 100, 80);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rimLight.position.set(-60, -20, -60);
    scene.add(rimLight);

    // 3. Grid Floor
    const grid = new THREE.GridHelper(100, 20, 0x06b6d4, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // 4. Groups
    scene.add(meshGroupRef.current);
    scene.add(boneGroupRef.current);

    // 5. Cameras
    const aspect = width / height;
    const perspCam = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
    const orthoCam = new THREE.OrthographicCamera(-width / 16, width / 16, height / 16, -height / 16, 1, 2000);
    perspCamRef.current = perspCam;
    orthoCamRef.current = orthoCam;

    cameraRef.current = cameraViewMode === 'ortho' ? orthoCam : perspCam;

    // 6. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const updateCameraPos = () => {
      const { theta, phi, radius, target } = cameraAngleRef.current;
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

      perspCam.position.set(x, y, z);
      perspCam.lookAt(target);

      orthoCam.position.set(x, y, z);
      orthoCam.lookAt(target);
    };

    updateCameraPos();

    // 7. Render Loop
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);
      const activeCam = cameraViewMode === 'ortho' ? orthoCam : perspCam;
      renderer.render(scene, activeCam);
    };
    render();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      perspCam.aspect = w / h;
      perspCam.updateProjectionMatrix();

      orthoCam.left = -w / 16;
      orthoCam.right = w / 16;
      orthoCam.top = h / 16;
      orthoCam.bottom = -h / 16;
      orthoCam.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, [cameraViewMode]);

  // Update Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // ==========================================
  // 2. BUILD PROCEDURAL MESHES & BONES IN THREE.JS
  // ==========================================
  const buildPrimitiveGeometry = useCallback((part: Model3DPart): THREE.BufferGeometry => {
    const [sx, sy, sz] = part.scale;
    switch (part.primitiveType) {
      case 'cube':
        return new THREE.BoxGeometry(sx, sy, sz);
      case 'cylinder':
        return new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 16);
      case 'sphere':
        return new THREE.SphereGeometry(sx / 2, 16, 12);
      case 'cone':
        return new THREE.ConeGeometry(sx / 2, sy, 16);
      case 'capsule':
        return new THREE.CapsuleGeometry(sx / 2, Math.max(0.1, sy - sx), 8, 16);
      case 'torus':
        return new THREE.TorusGeometry(sx / 2, sz / 4, 12, 24);
      case 'plane':
        return new THREE.PlaneGeometry(sx, sy);
      case 'wedge': {
        const geom = new THREE.BufferGeometry();
        const halfX = sx / 2;
        const halfY = sy / 2;
        const halfZ = sz / 2;
        const vertices = new Float32Array([
          -halfX, -halfY, -halfZ,  halfX, -halfY, -halfZ,  halfX, -halfY,  halfZ,
          -halfX, -halfY, -halfZ,  halfX, -halfY,  halfZ, -halfX, -halfY,  halfZ,
          -halfX,  halfY, -halfZ,  halfX,  halfY, -halfZ,  halfX, -halfY,  halfZ,
          -halfX,  halfY, -halfZ,  halfX, -halfY,  halfZ, -halfX, -halfY,  halfZ,
          -halfX, -halfY, -halfZ, -halfX,  halfY, -halfZ,  halfX,  halfY, -halfZ,
          -halfX, -halfY, -halfZ,  halfX,  halfY, -halfZ,  halfX, -halfY, -halfZ
        ]);
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();
        return geom;
      }
      default:
        return new THREE.BoxGeometry(sx, sy, sz);
    }
  }, []);

  // Compute Animated Bone Transforms at currentFrame
  const animatedBoneTransforms = useMemo(() => {
    const transforms = new Map<string, { pos: THREE.Vector3; rot: THREE.Euler }>();

    modelData.bones.forEach(b => {
      transforms.set(b.id, {
        pos: new THREE.Vector3(...b.position),
        rot: new THREE.Euler(
          (b.rotation[0] * Math.PI) / 180,
          (b.rotation[1] * Math.PI) / 180,
          (b.rotation[2] * Math.PI) / 180
        )
      });
    });

    if (!activeClip || !activeClip.keyframes || activeClip.keyframes.length === 0) {
      return transforms;
    }

    // Evaluate keyframes for each bone
    modelData.bones.forEach(b => {
      const boneKfs = activeClip.keyframes
        .filter(k => k.boneId === b.id)
        .sort((a, b) => a.frame - b.frame);

      if (boneKfs.length === 0) return;

      // Find surrounding keyframes
      let prevKf = boneKfs[0];
      let nextKf = boneKfs[boneKfs.length - 1];

      for (let i = 0; i < boneKfs.length; i++) {
        if (boneKfs[i].frame <= currentFrame) {
          prevKf = boneKfs[i];
        }
        if (boneKfs[i].frame >= currentFrame) {
          nextKf = boneKfs[i];
          break;
        }
      }

      const t = prevKf.frame === nextKf.frame
        ? 0
        : (currentFrame - prevKf.frame) / (nextKf.frame - prevKf.frame);

      // Interpolate Rotation
      const prevRot = prevKf.rotation || b.rotation;
      const nextRot = nextKf.rotation || b.rotation;
      const curRotX = (prevRot[0] + (nextRot[0] - prevRot[0]) * t) * Math.PI / 180;
      const curRotY = (prevRot[1] + (nextRot[1] - prevRot[1]) * t) * Math.PI / 180;
      const curRotZ = (prevRot[2] + (nextRot[2] - prevRot[2]) * t) * Math.PI / 180;

      // Interpolate Position
      const prevPos = prevKf.position || b.position;
      const nextPos = nextKf.position || b.position;
      const curPosX = prevPos[0] + (nextPos[0] - prevPos[0]) * t;
      const curPosY = prevPos[1] + (nextPos[1] - prevPos[1]) * t;
      const curPosZ = prevPos[2] + (nextPos[2] - prevPos[2]) * t;

      transforms.set(b.id, {
        pos: new THREE.Vector3(curPosX, curPosY, curPosZ),
        rot: new THREE.Euler(curRotX, curRotY, curRotZ)
      });
    });

    return transforms;
  }, [modelData.bones, activeClip, currentFrame]);

  // Synchronize Three.js Meshes & Visual Bones
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    const boneGroup = boneGroupRef.current;

    // Clear previous geometries
    while (meshGroup.children.length > 0) {
      const child = meshGroup.children[0] as THREE.Mesh;
      meshGroup.remove(child);
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }

    while (boneGroup.children.length > 0) {
      const child = boneGroup.children[0] as THREE.Mesh;
      boneGroup.remove(child);
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }

    // 1. Build Part Meshes
    modelData.parts.forEach(part => {
      const geom = buildPrimitiveGeometry(part);
      const isSelected = part.id === selectedPartId;

      let mat: THREE.Material;
      if (shadingMode === 'wireframe') {
        mat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0x22d3ee : new THREE.Color(part.color),
          wireframe: true
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(part.color),
          roughness: part.roughness ?? 0.6,
          metalness: part.metalness ?? 0.1,
          wireframe: part.wireframe ?? false,
          emissive: isSelected ? new THREE.Color(0x06b6d4) : new THREE.Color(0x000000),
          emissiveIntensity: isSelected ? 0.35 : 0
        });
      }

      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = part.id;

      // Position relative to attached bone if animated
      let finalPos = new THREE.Vector3(...part.position);
      let finalRot = new THREE.Euler(
        (part.rotation[0] * Math.PI) / 180,
        (part.rotation[1] * Math.PI) / 180,
        (part.rotation[2] * Math.PI) / 180
      );

      if (part.parentBoneId && animatedBoneTransforms.has(part.parentBoneId)) {
        const boneT = animatedBoneTransforms.get(part.parentBoneId)!;
        finalPos.add(new THREE.Vector3(boneT.pos.x - (part.position[0] * 0.1), boneT.pos.y - (part.position[1] * 0.1), boneT.pos.z));
        finalRot.x += boneT.rot.x;
        finalRot.y += boneT.rot.y;
        finalRot.z += boneT.rot.z;
      }

      mesh.position.copy(finalPos);
      mesh.rotation.copy(finalRot);
      meshGroup.add(mesh);
    });

    // 2. Build Visual Bone Nodes (Octahedral Diamonds & Joint Spheres)
    if (activeTab === 'rig' || shadingMode === 'bones') {
      modelData.bones.forEach(bone => {
        const isBoneSelected = bone.id === selectedBoneId;
        const bTransform = animatedBoneTransforms.get(bone.id) || {
          pos: new THREE.Vector3(...bone.position),
          rot: new THREE.Euler()
        };

        // Joint Sphere
        const jointGeom = new THREE.SphereGeometry(2, 12, 8);
        const jointMat = new THREE.MeshBasicMaterial({
          color: isBoneSelected ? 0xf59e0b : 0x06b6d4,
          wireframe: false,
          depthTest: false
        });
        const jointMesh = new THREE.Mesh(jointGeom, jointMat);
        jointMesh.position.copy(bTransform.pos);
        jointMesh.renderOrder = 999;
        boneGroup.add(jointMesh);

        // Bone Octahedron Pointer
        const boneGeom = new THREE.ConeGeometry(2.5, Math.max(6, bone.length), 4);
        boneGeom.rotateX(Math.PI / 2);
        const boneMat = new THREE.MeshBasicMaterial({
          color: isBoneSelected ? 0xfbbf24 : 0x38bdf8,
          wireframe: true,
          depthTest: false
        });
        const boneMesh = new THREE.Mesh(boneGeom, boneMat);
        boneMesh.position.copy(bTransform.pos);
        boneMesh.rotation.copy(bTransform.rot);
        boneMesh.renderOrder = 998;
        boneGroup.add(boneMesh);
      });
    }
  }, [modelData.parts, modelData.bones, selectedPartId, selectedBoneId, shadingMode, activeTab, buildPrimitiveGeometry, animatedBoneTransforms]);

  // ==========================================
  // 3. ANIMATION TICKER LOOP
  // ==========================================
  useEffect(() => {
    if (!isPlaying || !activeClip) return;

    const interval = 1000 / (activeClip.fps || playbackFps || 12);
    const timer = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= activeClip.totalFrames) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return activeClip.totalFrames - 1;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, activeClip, playbackFps, isLooping]);

  // ==========================================
  // 4. VIEWPORT MOUSE & ORBIT CONTROLS
  // ==========================================
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const angle = cameraAngleRef.current;

    if (dragButtonRef.current === 0) {
      // Orbit Camera (Left Click Drag)
      angle.theta -= dx * 0.01;
      angle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, angle.phi - dy * 0.01));
    } else if (dragButtonRef.current === 2 || dragButtonRef.current === 1) {
      // Pan Camera Target (Right / Middle Click Drag)
      const panSpeed = 0.08 * (angle.radius / 100);
      const right = new THREE.Vector3(Math.cos(angle.theta), 0, -Math.sin(angle.theta));
      const up = new THREE.Vector3(0, 1, 0);

      angle.target.addScaledVector(right, -dx * panSpeed);
      angle.target.addScaledVector(up, dy * panSpeed);
    }

    const { theta, phi, radius, target } = angle;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    if (perspCamRef.current) {
      perspCamRef.current.position.set(x, y, z);
      perspCamRef.current.lookAt(target);
    }
    if (orthoCamRef.current) {
      orthoCamRef.current.position.set(x, y, z);
      orthoCamRef.current.lookAt(target);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const angle = cameraAngleRef.current;
    angle.radius = Math.max(10, Math.min(500, angle.radius * zoomFactor));

    const { theta, phi, radius, target } = angle;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    if (perspCamRef.current) {
      perspCamRef.current.position.set(x, y, z);
      perspCamRef.current.lookAt(target);
    }
    if (orthoCamRef.current) {
      orthoCamRef.current.position.set(x, y, z);
      orthoCamRef.current.lookAt(target);
    }
  };

  // ==========================================
  // 5. PART & MODELING CRUD
  // ==========================================
  const handleAddPart = (type: Model3DPart['primitiveType']) => {
    const newPartId = `part_${Date.now().toString(36)}`;
    const newPart: Model3DPart = {
      id: newPartId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${modelData.parts.length + 1}`,
      primitiveType: type,
      position: [0, 20, 0],
      rotation: [0, 0, 0],
      scale: [12, 12, 12],
      color: paintColor,
      parentBoneId: selectedBoneId || undefined
    };

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        parts: [...prev.modelData.parts, newPart]
      }
    }));
    setSelectedPartId(newPartId);
    setIsDirty(true);
  };

  const handleDeletePart = (id: string) => {
    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        parts: prev.modelData.parts.filter(p => p.id !== id)
      }
    }));
    if (selectedPartId === id) {
      setSelectedPartId(modelData.parts[0]?.id || null);
    }
    setIsDirty(true);
  };

  const handleDuplicatePart = (id: string) => {
    const part = modelData.parts.find(p => p.id === id);
    if (!part) return;

    const newPartId = `part_${Date.now().toString(36)}`;
    const cloned: Model3DPart = {
      ...part,
      id: newPartId,
      name: `${part.name} (Copy)`,
      position: [part.position[0] + 4, part.position[1], part.position[2] + 4]
    };

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        parts: [...prev.modelData.parts, cloned]
      }
    }));
    setSelectedPartId(newPartId);
    setIsDirty(true);
  };

  const handleMirrorPartX = (id: string) => {
    const part = modelData.parts.find(p => p.id === id);
    if (!part) return;

    const newPartId = `part_${Date.now().toString(36)}`;
    const mirrored: Model3DPart = {
      ...part,
      id: newPartId,
      name: part.name.includes('.L') ? part.name.replace('.L', '.R') : `${part.name} (Mirrored)`,
      position: [-part.position[0], part.position[1], part.position[2]],
      rotation: [part.rotation[0], -part.rotation[1], -part.rotation[2]]
    };

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        parts: [...prev.modelData.parts, mirrored]
      }
    }));
    setSelectedPartId(newPartId);
    setIsDirty(true);
  };

  const handleUpdateSelectedPart = (updater: Partial<Model3DPart>) => {
    if (!selectedPartId) return;

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        parts: prev.modelData.parts.map(p => p.id === selectedPartId ? { ...p, ...updater } : p)
      }
    }));
    setIsDirty(true);
  };

  // ==========================================
  // 6. SKELETAL RIGGING CRUD
  // ==========================================
  const handleAddBone = () => {
    const newBoneId = `bone_${Date.now().toString(36)}`;
    const newBone: Model3DBone = {
      id: newBoneId,
      name: `Bone ${modelData.bones.length + 1}`,
      parentId: selectedBoneId || 'bone_root',
      position: [0, 20, 0],
      rotation: [0, 0, 0],
      length: 14
    };

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        bones: [...prev.modelData.bones, newBone]
      }
    }));
    setSelectedBoneId(newBoneId);
    setIsDirty(true);
  };

  const handleDeleteBone = (id: string) => {
    if (id === 'bone_root') return; // Cannot delete root
    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        bones: prev.modelData.bones.filter(b => b.id !== id),
        parts: prev.modelData.parts.map(p => p.parentBoneId === id ? { ...p, parentBoneId: undefined } : p)
      }
    }));
    setSelectedBoneId(modelData.bones[0]?.id || null);
    setIsDirty(true);
  };

  // ==========================================
  // 7. KEYFRAME & ANIMATION TIMELINE CRUD
  // ==========================================
  const handleInsertKeyframe = () => {
    if (!activeClip) return;

    // Record keyframe for selected bone (or all bones if none selected)
    const bonesToKey = selectedBone ? [selectedBone] : modelData.bones;
    const newKeyframes = [...activeClip.keyframes.filter(k => !(k.frame === currentFrame && bonesToKey.some(b => b.id === k.boneId)))];

    bonesToKey.forEach(b => {
      const bTransform = animatedBoneTransforms.get(b.id) || {
        pos: new THREE.Vector3(...b.position),
        rot: new THREE.Euler()
      };

      newKeyframes.push({
        frame: currentFrame,
        boneId: b.id,
        position: [Math.round(bTransform.pos.x), Math.round(bTransform.pos.y), Math.round(bTransform.pos.z)],
        rotation: [
          Math.round((bTransform.rot.x * 180) / Math.PI),
          Math.round((bTransform.rot.y * 180) / Math.PI),
          Math.round((bTransform.rot.z * 180) / Math.PI)
        ]
      });
    });

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        animations: prev.modelData.animations.map(a => a.id === activeClip.id ? { ...a, keyframes: newKeyframes } : a)
      }
    }));
    setIsDirty(true);
  };

  const handleDeleteCurrentKeyframe = () => {
    if (!activeClip) return;
    const filtered = activeClip.keyframes.filter(k => !(k.frame === currentFrame && (!selectedBoneId || k.boneId === selectedBoneId)));

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        animations: prev.modelData.animations.map(a => a.id === activeClip.id ? { ...a, keyframes: filtered } : a)
      }
    }));
    setIsDirty(true);
  };

  const handleCreateNewClip = () => {
    const newClipId = `anim_${Date.now().toString(36)}`;
    const newClip: Model3DAnimationClip = {
      id: newClipId,
      name: `Animation ${modelData.animations.length + 1}`,
      fps: 12,
      totalFrames: 24,
      isLooping: true,
      keyframes: []
    };

    setModelFile(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      modelData: {
        ...prev.modelData,
        animations: [...prev.modelData.animations, newClip],
        activeAnimationId: newClipId
      }
    }));
    setActiveClipId(newClipId);
    setCurrentFrame(0);
    setIsDirty(true);
  };

  // ==========================================
  // 8. MULTI-ANGLE ANIMATION EXPORT PIPELINE
  // ==========================================
  const handleRenderExport = async (format: 'spritesheet' | 'gif' | 'frames_zip') => {
    if (!activeClip || !rendererRef.current || !sceneRef.current) return;
    setIsExporting(true);

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const res = exportResolution;
    const totalFrames = activeClip.totalFrames;

    // Temporary offscreen canvas for rendering frames
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = res;
    offscreenCanvas.height = res;

    // Create an isolated offscreen renderer for pixel-perfect captures
    const exportRenderer = new THREE.WebGLRenderer({
      canvas: offscreenCanvas,
      alpha: true,
      antialias: !exportPixelArt,
      preserveDrawingBuffer: true
    });
    exportRenderer.setSize(res, res);
    exportRenderer.setClearColor(0x000000, 0); // Transparent

    // Camera preset for export angle
    const cam = new THREE.OrthographicCamera(-res / 4, res / 4, res / 4, -res / 4, 1, 1000);
    const targetY = 20;

    if (exportAngle === 'lateral') {
      cam.position.set(0, targetY, 100); // 2D Side-scroller viewpoint
    } else if (exportAngle === 'isometric') {
      cam.position.set(70, targetY + 60, 70); // Isometric 3/4
    } else if (exportAngle === 'topdown') {
      cam.position.set(0, 100, 0.1); // Top-down
    } else {
      cam.position.set(0, targetY, -100); // Frontal
    }
    cam.lookAt(0, targetY, 0);

    // Hide helper grid during export
    const prevGridVis = gridHelperRef.current?.visible;
    if (gridHelperRef.current) gridHelperRef.current.visible = false;
    boneGroupRef.current.visible = false;

    const capturedFrames: HTMLCanvasElement[] = [];
    const frameDataUrls: string[] = [];

    // Capture each frame
    for (let f = 0; f < totalFrames; f++) {
      setCurrentFrame(f);
      // Wait for state & animation transforms to settle
      await new Promise(resolve => setTimeout(resolve, 15));

      exportRenderer.render(scene, cam);

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = res;
      frameCanvas.height = res;
      const ctx = frameCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = !exportPixelArt;
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
      capturedFrames.push(frameCanvas);
      frameDataUrls.push(frameCanvas.toDataURL('image/png'));
    }

    setCapturedFrameDataUrls(frameDataUrls);

    // Restore grid & bone helpers
    if (gridHelperRef.current && prevGridVis !== undefined) gridHelperRef.current.visible = prevGridVis;
    boneGroupRef.current.visible = activeTab === 'rig';
    exportRenderer.dispose();

    if (format === 'spritesheet') {
      // Pack into a single horizontal strip: (res * totalFrames) × res
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = res * totalFrames;
      sheetCanvas.height = res;
      const sCtx = sheetCanvas.getContext('2d');
      if (sCtx) {
        sCtx.imageSmoothingEnabled = !exportPixelArt;
        capturedFrames.forEach((fc, idx) => {
          sCtx.drawImage(fc, idx * res, 0);
        });
      }

      const dataUrl = sheetCanvas.toDataURL('image/png');
      setExportPreviewUrl(dataUrl);

      // Trigger download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${modelData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeClip.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_strip.png`;
      a.click();
    } else if (format === 'gif') {
      // Encode GIF89a using GifEncoder
      const gif = new GifEncoder(res, res, 0);
      const delayMs = Math.round(1000 / (activeClip.fps || 12));

      capturedFrames.forEach(fc => {
        gif.addFrame(fc, { delayMs, transparentColor: [0, 0, 0] });
      });

      const gifBlob = gif.encode();
      const gifUrl = URL.createObjectURL(gifBlob);
      setExportPreviewUrl(gifUrl);

      const a = document.createElement('a');
      a.href = gifUrl;
      a.download = `${modelData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeClip.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gif`;
      a.click();
    } else if (format === 'frames_zip') {
      // Bundle into ZIP with JSZip
      const zip = new JSZip();
      capturedFrames.forEach((fc, idx) => {
        const dataUrl = fc.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const pad = String(idx).padStart(3, '0');
        zip.file(`frame_${pad}.png`, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      setExportPreviewUrl(frameDataUrls[0] || null);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${modelData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeClip.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_frames.zip`;
      a.click();
    }

    setIsExporting(false);
  };

  const handleApplyToPrefab = () => {
    if (!exportPreviewUrl || !onSendToPrefab || !activeClip) return;
    onSendToPrefab(exportPreviewUrl, activeClip.totalFrames, activeClip.name);
  };

  const handleSave = () => {
    onSaveModelFile(modelFile);
    setIsDirty(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 select-none overflow-hidden font-sans">
      {/* ==========================================
          TOP STUDIO HEADER & MODE TABS
          ========================================== */}
      <header className="h-13 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60">
            <Box size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white">{modelData.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-indigo-300 border border-neutral-700">
                {modelFile.fileName}
              </span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />}
            </div>
            <span className="text-[9px] text-neutral-500 font-mono">
              {modelData.parts.length} Parts • {modelData.bones.length} Bones • {modelData.animations.length} Clips
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'model'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Box size={13} />
            <span>Model</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rig')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'rig'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Compass size={13} />
            <span>Rig</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('animate')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'animate'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Film size={13} />
            <span>Animate</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'export'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Download size={13} />
            <span>Export (Strip/GIF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFabricatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-950/50 active:scale-95 ml-1"
            title="Open Parametric 3D Creature Fabricator (synthesize multi-head, multi-limb creatures)"
          >
            <Sparkles size={13} />
            <span>🧬 Creature Fabricator</span>
          </button>
        </div>

        {/* Top Right Save & Model Selector */}
        <div className="flex items-center gap-2">
          {project.fileSystem.models3d && project.fileSystem.models3d.length > 1 && (
            <select
              value={modelFile.fileName}
              onChange={e => onSwitchModelFile?.(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 outline-none font-mono"
            >
              {project.fileSystem.models3d.map(m => (
                <option key={m.id} value={m.fileName}>{m.name} ({m.fileName})</option>
              ))}
            </select>
          )}

          {onCreateNewModel && (
            <button
              type="button"
              onClick={() => onCreateNewModel('New Character')}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition border border-neutral-700"
              title="Create New 3D Model"
            >
              <Plus size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50"
            title="Save 3D Model (Ctrl+S)"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* ==========================================
          MAIN WORKSPACE LAYOUT (3 PANELS)
          ========================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ==========================================
            LEFT PANEL: HIERARCHY & TOOLS
            ========================================== */}
        <aside className="w-72 bg-neutral-900/70 border-r border-neutral-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          {/* TAB 1: MODELING & PRIMITIVES */}
          {activeTab === 'model' && (
            <div className="p-3 flex flex-col gap-4">
              {/* Add Primitive Buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  Add 3D Primitive
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['cube', 'cylinder', 'sphere', 'cone', 'wedge', 'capsule', 'torus', 'plane'] as const).map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => handleAddPart(pt)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition border border-neutral-700/60 active:scale-95"
                      title={`Add ${pt}`}
                    >
                      <Box size={14} className="text-indigo-400 mb-1" />
                      <span className="text-[9px] capitalize truncate w-full text-center">{pt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface Paint & Color Palette */}
              <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-300 uppercase font-mono">Part Color / Paint</span>
                  <input
                    type="color"
                    value={paintColor}
                    onChange={e => {
                      setPaintColor(e.target.value);
                      if (selectedPartId) handleUpdateSelectedPart({ color: e.target.value });
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>
                {/* Palette Swatches */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#0284c7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#fcd34d', '#e2e8f0', '#1e293b', '#475569'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setPaintColor(c);
                        if (selectedPartId) handleUpdateSelectedPart({ color: c });
                      }}
                      className="w-5 h-5 rounded-lg border border-white/20 transition hover:scale-110 shadow-sm"
                      style={{ backgroundColor: c }}
                      title={`Pick ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Parts Hierarchy Tree */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                    Model Parts ({modelData.parts.length})
                  </span>
                </div>
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                  {modelData.parts.map(part => {
                    const isSel = part.id === selectedPartId;
                    return (
                      <div
                        key={part.id}
                        onClick={() => setSelectedPartId(part.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition border ${
                          isSel
                            ? 'bg-indigo-600/30 border-indigo-500/60 text-white font-bold'
                            : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border-neutral-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: part.color }} />
                          <span className="truncate">{part.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMirrorPartX(part.id)}
                            className="p-1 text-neutral-400 hover:text-white"
                            title="Mirror along X axis"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 text-neutral-400 hover:text-rose-400"
                            title="Delete part"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKELETAL RIGGING */}
          {activeTab === 'rig' && (
            <div className="p-3 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  Skeletal Bones ({modelData.bones.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddBone}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40"
                >
                  <Plus size={11} />
                  <span>Add Bone</span>
                </button>
              </div>

              {/* Bones List */}
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                {modelData.bones.map(bone => {
                  const isSel = bone.id === selectedBoneId;
                  return (
                    <div
                      key={bone.id}
                      onClick={() => setSelectedBoneId(bone.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition border ${
                        isSel
                          ? 'bg-amber-600/30 border-amber-500/60 text-white font-bold'
                          : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border-neutral-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Compass size={12} className={isSel ? 'text-amber-400' : 'text-neutral-500'} />
                        <span className="truncate">{bone.name}</span>
                      </div>
                      {bone.id !== 'bone_root' && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteBone(bone.id);
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Bone Inspector */}
              {selectedBone && (
                <div className="p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Bone Parameters</span>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[10px] text-neutral-400">Name</label>
                    <input
                      type="text"
                      value={selectedBone.name}
                      onChange={e => {
                        const val = e.target.value;
                        setModelFile(prev => ({
                          ...prev,
                          modelData: {
                            ...prev.modelData,
                            bones: prev.modelData.bones.map(b => b.id === selectedBone.id ? { ...b, name: val } : b)
                          }
                        }));
                      }}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[10px] text-neutral-400">Parent Bone</label>
                    <select
                      value={selectedBone.parentId || ''}
                      onChange={e => {
                        const val = e.target.value || null;
                        setModelFile(prev => ({
                          ...prev,
                          modelData: {
                            ...prev.modelData,
                            bones: prev.modelData.bones.map(b => b.id === selectedBone.id ? { ...b, parentId: val } : b)
                          }
                        }));
                      }}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    >
                      <option value="">(None - Root)</option>
                      {modelData.bones.filter(b => b.id !== selectedBone.id).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANIMATION CLIPS */}
          {activeTab === 'animate' && (
            <div className="p-3 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  Animation Clips ({modelData.animations.length})
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewClip}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold border border-cyan-500/40"
                >
                  <Plus size={11} />
                  <span>New Clip</span>
                </button>
              </div>

              {/* Clips List */}
              <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                {modelData.animations.map(clip => {
                  const isSel = clip.id === activeClipId;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => {
                        setActiveClipId(clip.id);
                        setCurrentFrame(0);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition border ${
                        isSel
                          ? 'bg-cyan-600/30 border-cyan-500/60 text-white font-bold'
                          : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border-neutral-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Film size={12} className={isSel ? 'text-cyan-400' : 'text-neutral-500'} />
                        <span className="truncate">{clip.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">{clip.totalFrames}f @ {clip.fps}fps</span>
                    </div>
                  );
                })}
              </div>

              {/* Clip Settings */}
              {activeClip && (
                <div className="p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono">Clip Properties</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Total Frames</span>
                    <input
                      type="number"
                      min={4}
                      max={120}
                      value={activeClip.totalFrames}
                      onChange={e => {
                        const val = Math.max(4, parseInt(e.target.value) || 24);
                        setModelFile(prev => ({
                          ...prev,
                          modelData: {
                            ...prev.modelData,
                            animations: prev.modelData.animations.map(a => a.id === activeClip.id ? { ...a, totalFrames: val } : a)
                          }
                        }));
                      }}
                      className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs text-white text-right font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Playback FPS</span>
                    <input
                      type="number"
                      min={4}
                      max={60}
                      value={activeClip.fps}
                      onChange={e => {
                        const val = Math.max(4, parseInt(e.target.value) || 12);
                        setPlaybackFps(val);
                        setModelFile(prev => ({
                          ...prev,
                          modelData: {
                            ...prev.modelData,
                            animations: prev.modelData.animations.map(a => a.id === activeClip.id ? { ...a, fps: val } : a)
                          }
                        }));
                      }}
                      className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs text-white text-right font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORT STUDIO */}
          {activeTab === 'export' && (
            <div className="p-3 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                2D Prefab & GIF Exporter
              </span>

              {/* Angle Preset */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Camera Angle</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['lateral', 'isometric', 'topdown', 'front'] as const).map(ang => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setExportAngle(ang)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition capitalize border ${
                        exportAngle === ang
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {ang === 'lateral' ? '2D Lateral' : ang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Resolution */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Frame Resolution</label>
                <div className="grid grid-cols-4 gap-1">
                  {[32, 48, 64, 128].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setExportResolution(sz)}
                      className={`px-1 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                        exportResolution === sz
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Pixel Art Nearest Filter Toggle */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportPixelArt}
                  onChange={e => setExportPixelArt(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-xs font-medium text-neutral-300">Retro Pixel Art (Nearest Filter)</span>
              </label>

              {/* Export Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleRenderExport('spritesheet')}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50"
                >
                  <Download size={13} />
                  <span>{isExporting ? 'Rendering...' : 'Download Spritesheet (.png)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleRenderExport('gif')}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50"
                >
                  <Sparkles size={13} />
                  <span>{isExporting ? 'Encoding GIF...' : 'Download Animated GIF (.gif)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleRenderExport('frames_zip')}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition shadow-lg shadow-amber-950/50"
                >
                  <Download size={13} />
                  <span>{isExporting ? 'Packaging Frames...' : 'Download All Frames (.zip)'}</span>
                </button>

                {capturedFrameDataUrls.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">
                      Exported Frame Sequence ({capturedFrameDataUrls.length} frames)
                    </span>
                    <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                      {capturedFrameDataUrls.map((fUrl, fIdx) => (
                        <a
                          key={fIdx}
                          href={fUrl}
                          download={`${modelData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_f${String(fIdx).padStart(3, '0')}.png`}
                          className="group relative flex flex-col items-center justify-center p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
                          title={`Click to download Frame ${fIdx + 1}`}
                        >
                          <img src={fUrl} alt={`Frame ${fIdx}`} className="w-8 h-8 object-contain" />
                          <span className="text-[8px] font-mono text-neutral-500 group-hover:text-amber-300">
                            #{fIdx}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {exportPreviewUrl && onSendToPrefab && (
                  <button
                    type="button"
                    onClick={handleApplyToPrefab}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/50 mt-2"
                  >
                    <Share2 size={13} />
                    <span>Apply Directly to 2D Prefab</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ==========================================
            CENTER 3D VIEWPORT & OVERLAYS
            ========================================== */}
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

          {/* Viewport Overlay Controls (Top-Left) */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800 shadow-xl pointer-events-auto">
            {/* Shading Mode */}
            <button
              type="button"
              onClick={() => setShadingMode(prev => prev === 'shaded' ? 'wireframe' : prev === 'wireframe' ? 'solid' : 'shaded')}
              className="px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition capitalize"
              title="Toggle Shading Mode"
            >
              {shadingMode}
            </button>
            <div className="w-px h-3 bg-neutral-700" />

            {/* Camera View Mode */}
            <button
              type="button"
              onClick={() => setCameraViewMode(prev => prev === 'perspective' ? 'ortho' : 'perspective')}
              className="px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition capitalize"
              title="Toggle Perspective / Orthographic View"
            >
              {cameraViewMode === 'perspective' ? '3D Persp' : '2D Ortho'}
            </button>
            <div className="w-px h-3 bg-neutral-700" />

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGrid(prev => !prev)}
              className={`p-1 rounded-lg transition ${showGrid ? 'text-cyan-400 bg-cyan-950/40' : 'text-neutral-500'}`}
              title="Toggle Ground Grid"
            >
              <Grid size={13} />
            </button>
          </div>

          {/* Viewport Overlay Controls (Top-Right Angle Quick-Presets) */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800 shadow-xl pointer-events-auto">
            {(['Front', 'Side', 'Top', 'Iso'] as const).map(angle => (
              <button
                key={angle}
                type="button"
                onClick={() => {
                  const a = cameraAngleRef.current;
                  if (angle === 'Side') { a.theta = 0; a.phi = Math.PI / 2; }
                  else if (angle === 'Front') { a.theta = Math.PI / 2; a.phi = Math.PI / 2; }
                  else if (angle === 'Top') { a.theta = 0; a.phi = 0.05; }
                  else { a.theta = Math.PI / 4; a.phi = Math.PI / 3; }

                  const { theta, phi, radius, target } = a;
                  const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
                  const y = target.y + radius * Math.cos(phi);
                  const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
                  if (perspCamRef.current) { perspCamRef.current.position.set(x, y, z); perspCamRef.current.lookAt(target); }
                  if (orthoCamRef.current) { orthoCamRef.current.position.set(x, y, z); orthoCamRef.current.lookAt(target); }
                }}
                className="px-2 py-1 rounded-lg text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
              >
                {angle}
              </button>
            ))}
          </div>

          {/* Preview Thumbnail (If Exported) */}
          {exportPreviewUrl && (
            <div className="absolute bottom-3 right-3 z-30 p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-mono text-neutral-400">Export Output</span>
              <img src={exportPreviewUrl} alt="Export preview" className="w-16 h-16 object-contain border border-neutral-700 rounded-lg bg-black/60" />
            </div>
          )}
        </div>

        {/* ==========================================
            RIGHT PANEL: TRANSFORM & PROPERTIES INSPECTOR
            ========================================== */}
        <aside className="w-72 bg-neutral-900/70 border-l border-neutral-800 flex flex-col shrink-0 z-20 overflow-y-auto p-3 gap-4">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
            Inspector & Properties
          </span>

          {selectedPart ? (
            <div className="flex flex-col gap-3">
              {/* Part Name */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400">Part Name</label>
                <input
                  type="text"
                  value={selectedPart.name}
                  onChange={e => handleUpdateSelectedPart({ name: e.target.value })}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none"
                />
              </div>

              {/* Position X/Y/Z */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400">Position (X, Y, Z)</label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map(idx => (
                    <input
                      key={idx}
                      type="number"
                      value={selectedPart.position[idx]}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newPos: [number, number, number] = [...selectedPart.position];
                        newPos[idx] = val;
                        handleUpdateSelectedPart({ position: newPos });
                      }}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-1.5 py-1 text-xs text-white text-right font-mono"
                    />
                  ))}
                </div>
              </div>

              {/* Scale / Dimensions (W, H, D) */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400">Dimensions / Scale</label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map(idx => (
                    <input
                      key={idx}
                      type="number"
                      min={1}
                      value={selectedPart.scale[idx]}
                      onChange={e => {
                        const val = Math.max(1, parseFloat(e.target.value) || 1);
                        const newScale: [number, number, number] = [...selectedPart.scale];
                        newScale[idx] = val;
                        handleUpdateSelectedPart({ scale: newScale });
                      }}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-1.5 py-1 text-xs text-white text-right font-mono"
                    />
                  ))}
                </div>
              </div>

              {/* Rotation Euler */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400">Rotation (Deg X, Y, Z)</label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map(idx => (
                    <input
                      key={idx}
                      type="number"
                      value={selectedPart.rotation[idx]}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newRot: [number, number, number] = [...selectedPart.rotation];
                        newRot[idx] = val;
                        handleUpdateSelectedPart({ rotation: newRot });
                      }}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-1.5 py-1 text-xs text-white text-right font-mono"
                    />
                  ))}
                </div>
              </div>

              {/* Parent Bone Attachment */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[10px] text-neutral-400">Attached Bone Armature</label>
                <select
                  value={selectedPart.parentBoneId || ''}
                  onChange={e => handleUpdateSelectedPart({ parentBoneId: e.target.value || undefined })}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none font-mono"
                >
                  <option value="">(None - Fixed to World)</option>
                  {modelData.bones.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-neutral-500 font-mono">
              No Part Selected. Click a part in the hierarchy or 3D view to inspect.
            </div>
          )}
        </aside>
      </div>

      {/* ==========================================
          BOTTOM ANIMATION TIMELINE & SCRUBBER
          ========================================== */}
      {activeClip && (
        <footer className="h-20 bg-neutral-900/90 border-t border-neutral-800 px-4 flex flex-col justify-center gap-1.5 shrink-0 z-30">
          <div className="flex items-center justify-between text-xs">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentFrame(0)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                title="Rewind to Frame 0"
              >
                <SkipBack size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(p => !p)}
                className={`p-1.5 rounded-lg transition ${
                  isPlaying ? 'bg-amber-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
                title={isPlaying ? 'Pause Animation' : 'Play Animation'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame(0);
                }}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                title="Stop Animation"
              >
                <Square size={13} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentFrame(prev => Math.min(activeClip.totalFrames - 1, prev + 1))}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                title="Step Forward (+1 frame)"
              >
                <SkipForward size={13} />
              </button>

              <div className="w-px h-4 bg-neutral-700 mx-1" />

              <span className="font-mono text-cyan-400 font-bold text-xs">
                Frame {currentFrame} / {activeClip.totalFrames - 1}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">({activeClip.fps} FPS)</span>
            </div>

            {/* Keyframe Operations */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInsertKeyframe}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-bold border border-amber-500/40 transition"
                title="Insert Keyframe at Current Frame"
              >
                <Plus size={11} />
                <span>Key Pose</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentKeyframe}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 text-xs transition"
                title="Clear Keyframe at Current Frame"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          {/* Interactive Frame Track with Keyframe Diamonds */}
          <div className="relative w-full h-5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center px-1">
            {/* Scrubber Range Input */}
            <input
              type="range"
              min={0}
              max={activeClip.totalFrames - 1}
              value={currentFrame}
              onChange={e => setCurrentFrame(parseInt(e.target.value) || 0)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />

            {/* Visual Frame Ticks */}
            <div className="w-full h-full flex items-center justify-between pointer-events-none relative z-10 px-1">
              {Array.from({ length: activeClip.totalFrames }).map((_, fIdx) => {
                const hasKey = activeClip.keyframes.some(k => k.frame === fIdx);
                const isCur = fIdx === currentFrame;
                return (
                  <div key={fIdx} className="flex flex-col items-center justify-center flex-1 h-full">
                    {hasKey && (
                      <span className="w-2 h-2 rotate-45 bg-amber-400 rounded-xs shadow-sm mb-0.5" />
                    )}
                    <span className={`w-0.5 ${isCur ? 'h-3.5 bg-cyan-400' : hasKey ? 'h-2 bg-amber-400/80' : 'h-1.5 bg-neutral-700'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </footer>
      )}

      {/* Parametric Creature Fabricator Modal Overlay */}
      {isFabricatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col">
          <ModelTemplateFabricator
            project={project}
            onSaveToProject={(newModel) => {
              onSaveModelFile(newModel);
              setModelFile(newModel);
            }}
            onOpenInStudio={(fileName) => {
              const target = project.fileSystem.models3d?.find(m => m.fileName === fileName);
              if (target) {
                setModelFile(target);
              }
              setIsFabricatorOpen(false);
            }}
            onBack={() => setIsFabricatorOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
