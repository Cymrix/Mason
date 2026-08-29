import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  MasonProject, 
  PrefabData, 
  PrefabPart, 
  PrefabSpritePart, 
  PrefabParticlePart, 
  PrefabLightPart, 
  PrefabColliderPart, 
  PrefabPartType, 
  PrefabLayerTarget, 
  PrefabVariant,
  PrefabSpritesheet,
  ParticleSystemData,
  SensoryTagID,
  PrefabNamedPoint,
  PrefabNamedPolygon,
  PrefabCapsuleConfig,
  PolygonHitboxVertex,
  PrefabSocket
} from '../../engine/masonProjectSchema';
import { ParticleEngine } from '../../engine/ParticleEngine';
import { useMasonViewport, ViewportCanvasContainer } from './viewport';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Flame, 
  Sun, 
  Box, 
  Image as ImageIcon, 
  Sliders, 
  Check, 
  X, 
  Download, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Maximize2, 
  Anchor, 
  ArrowUp, 
  ArrowDown, 
  Grid, 
  Circle,
  Crosshair,
  Wand2,
  RefreshCw,
  Tag,
  Palette,
  Shield,
  Sword,
  Target
} from 'lucide-react';

interface PrefabCompositionEditorProps {
  project: MasonProject;
  char: PrefabData;
  onUpdateCharacter: (updater: (prev: PrefabData) => PrefabData) => void;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

// Built-in particle presets for instant multi-part composition (campfires, torches, magic, smoke)
const BUILTIN_PARTICLE_PRESETS: Record<string, any> = {
  campfire_fire: {
    id: 'ps_campfire_fire',
    name: 'Campfire Flame & Embers',
    icon: '🔥',
    tintColor: '#f97316',
    emitter: {
      shape: 'cone',
      width: 24,
      height: 36,
      radius: 18,
      emissionRate: 28,
      maxParticles: 80,
      duration: 0,
      loop: true,
      burstCount: 0,
      burstInterval: 0,
      isContinuous: true
    },
    visuals: {
      shape: 'glow_circle',
      minLifetime: 0.6,
      maxLifetime: 1.1,
      startSize: 14,
      endSize: 2,
      sizeCurve: 'shrink',
      startColor: '#ffea00',
      midColor: '#ff5500',
      endColor: '#770000',
      startAlpha: 1,
      endAlpha: 0,
      blendMode: 'lighter',
      glowBlurRadius: 10
    },
    kinematics: {
      minSpeed: 0.3,
      maxSpeed: 0.7,
      angleDeg: 270,
      spreadDeg: 35,
      gravityY: -35,
      gravityX: 0,
      drag: 0.98,
      angularDrag: 1.0,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      windForce: 5,
      turbulenceJitter: 12
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  campfire_smoke: {
    id: 'ps_campfire_smoke',
    name: 'Rising Campfire Smoke',
    icon: '💨',
    tintColor: '#94a3b8',
    emitter: {
      shape: 'circle',
      width: 24,
      height: 24,
      radius: 12,
      emissionRate: 12,
      maxParticles: 45,
      duration: 0,
      loop: true,
      burstCount: 0,
      burstInterval: 0,
      isContinuous: true
    },
    visuals: {
      shape: 'smoke_puff',
      minLifetime: 1.2,
      maxLifetime: 2.2,
      startSize: 10,
      endSize: 28,
      sizeCurve: 'grow',
      startColor: '#cbd5e1',
      endColor: '#475569',
      startAlpha: 0.5,
      endAlpha: 0,
      blendMode: 'source-over',
      glowBlurRadius: 4
    },
    kinematics: {
      minSpeed: 0.2,
      maxSpeed: 0.45,
      angleDeg: 270,
      spreadDeg: 25,
      gravityY: -25,
      gravityX: 8,
      drag: 0.96,
      angularDrag: 1.0,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      windForce: 10,
      turbulenceJitter: 15
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  weapon_glow: {
    id: 'ps_weapon_glow',
    name: 'Magic Enchantment Sparkles',
    icon: '✨',
    tintColor: '#38bdf8',
    emitter: {
      shape: 'line',
      width: 28,
      height: 6,
      radius: 14,
      emissionRate: 20,
      maxParticles: 40,
      duration: 0,
      loop: true,
      burstCount: 0,
      burstInterval: 0,
      isContinuous: true
    },
    visuals: {
      shape: 'star',
      minLifetime: 0.4,
      maxLifetime: 0.8,
      startSize: 10,
      endSize: 2,
      sizeCurve: 'shrink',
      startColor: '#ffffff',
      midColor: '#38bdf8',
      endColor: '#6366f1',
      startAlpha: 1,
      endAlpha: 0,
      blendMode: 'lighter',
      glowBlurRadius: 8
    },
    kinematics: {
      minSpeed: 0.1,
      maxSpeed: 0.3,
      angleDeg: 270,
      spreadDeg: 180,
      gravityY: -15,
      gravityX: 0,
      drag: 0.98,
      angularDrag: 0.98,
      minAngularVelocity: -120,
      maxAngularVelocity: 120,
      windForce: 0,
      turbulenceJitter: 8
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  torch_ember: {
    id: 'ps_torch_ember',
    name: 'Torch Ember Sparks',
    icon: '🔥',
    tintColor: '#f59e0b',
    emitter: {
      shape: 'circle',
      width: 12,
      height: 12,
      radius: 6,
      emissionRate: 15,
      maxParticles: 30,
      duration: 0,
      loop: true,
      burstCount: 0,
      burstInterval: 0,
      isContinuous: true
    },
    visuals: {
      shape: 'glow_circle',
      minLifetime: 0.5,
      maxLifetime: 1.0,
      startSize: 6,
      endSize: 1.5,
      sizeCurve: 'shrink',
      startColor: '#fffbeb',
      midColor: '#f59e0b',
      endColor: '#b45309',
      startAlpha: 1,
      endAlpha: 0,
      blendMode: 'lighter',
      glowBlurRadius: 6
    },
    kinematics: {
      minSpeed: 0.25,
      maxSpeed: 0.6,
      angleDeg: 270,
      spreadDeg: 40,
      gravityY: -30,
      gravityX: 0,
      drag: 0.98,
      angularDrag: 1.0,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      windForce: 4,
      turbulenceJitter: 10
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  }
};

export const PrefabCompositionEditor: React.FC<PrefabCompositionEditorProps> = ({
  project,
  char,
  onUpdateCharacter,
  onUpdateProject,
  showToast
}) => {
  const parts: PrefabPart[] = char.parts || [];
  const variants: PrefabVariant[] = char.variants || [];
  const sockets: PrefabSocket[] = char.sockets || [];
  const points: PrefabNamedPoint[] = char.points || [];
  const polygons: PrefabNamedPolygon[] = char.polygons || [];
  const capsule: PrefabCapsuleConfig = char.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 };
  const spritesheets = char.spritesheets || [];

  // Active Subtab: 'parts' | 'sockets' | 'colliders'
  const [activeSubTab, setActiveSubTab] = useState<'parts' | 'sockets' | 'colliders'>('parts');

  // Selected state
  const [selectedPartId, setSelectedPartId] = useState<string | null>(parts[0]?.id || null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [isSelectedCapsule, setIsSelectedCapsule] = useState<boolean>(false);
  const [activeVariantId, setActiveVariantId] = useState<string>('all');
  const [soloPartId, setSoloPartId] = useState<string | null>(null);

  // Standard Mason Viewport Sub-Module Hook
  const viewport = useMasonViewport({
    initialScale: 2.5,
    minScale: 0.25,
    maxScale: 8.0,
    zoomSensitivity: 1.15,
    originMode: 'center'
  });

  // Viewport Settings
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showColliders, setShowColliders] = useState<boolean>(false);
  const [showPolygons, setShowPolygons] = useState<boolean>(false);
  const [showLights, setShowLights] = useState<boolean>(false);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showSockets, setShowSockets] = useState<boolean>(false);
  const [bgTheme, setBgTheme] = useState<'dark' | 'grid' | 'dungeon' | 'forest' | 'magma'>('dark');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  // Animation Playback in Viewport (Paused by default!)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrameOffset, setCurrentFrameOffset] = useState<number>(0);
  const [activeAnimationState, setActiveAnimationState] = useState<string>(char.animations?.[0]?.stateId || 'idle');

  // Dragging Gizmo in Viewport
  const [draggingGizmo, setDraggingGizmo] = useState<{
    kind: 'part' | 'point' | 'poly_vertex' | 'capsule';
    id: string;
    vertexIndex?: number;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Add Part Modal
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState<boolean>(false);
  const [addPartType, setAddPartType] = useState<PrefabPartType>('sprite');
  const [addPartName, setAddPartName] = useState<string>('');
  const [addPartZOrder, setAddPartZOrder] = useState<number>(0);

  // Add Preset Modal
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);

  // Bake Spritesheet Modal
  const [isBakeModalOpen, setIsBakeModalOpen] = useState<boolean>(false);
  const [bakeResultUrl, setBakeResultUrl] = useState<string | null>(null);

  // Canvas & Simulation Engine Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleEnginesRef = useRef<Map<string, ParticleEngine>>(new Map());
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  // Current selected part object
  const selectedPart = useMemo(() => {
    return parts.find(p => p.id === selectedPartId) || null;
  }, [parts, selectedPartId]);

  // Current base animation
  const currentAnimation = useMemo(() => {
    const anim = (char.animations || []).find(a => a.stateId === activeAnimationState);
    return anim || char.animations?.[0] || {
      stateId: 'idle',
      label: 'Idle',
      spritesheetId: char.spritesheets?.[0]?.id || 'sheet_default',
      startFrameIndex: 0,
      endFrameIndex: 3,
      frameRateFps: 8,
      loop: true
    };
  }, [char.animations, activeAnimationState, char.spritesheets]);

  const frameCount = useMemo(() => {
    return Math.max(1, (currentAnimation.endFrameIndex - currentAnimation.startFrameIndex) + 1);
  }, [currentAnimation]);

  const activeGlobalFrameIndex = useMemo(() => {
    return (currentAnimation.startFrameIndex || 0) + (currentFrameOffset % frameCount);
  }, [currentAnimation, currentFrameOffset, frameCount]);

  // Helpers to resolve spritesheet image data
  const getSpritesheetDataUrl = useCallback((sheet?: PrefabSpritesheet): string | undefined => {
    if (!sheet) return undefined;
    return sheet.dataUrl || sheet.imageUrl;
  }, []);

  // Animation frame ticker
  useEffect(() => {
    if (!isPlaying) return;
    const fps = Math.max(1, currentAnimation.frameRateFps || 8);
    const intervalMs = 1000 / fps;

    const timer = setInterval(() => {
      setCurrentFrameOffset(prev => {
        const next = prev + 1;
        if (next >= frameCount) {
          return currentAnimation.loop ? 0 : frameCount - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentAnimation, frameCount]);

  // Layer order weighting for rendering
  const layerOrderMap: Record<PrefabLayerTarget, number> = {
    background: 0,
    ground: 10,
    objects: 20,
    overlay: 30,
    foreground: 40,
    custom: 50
  };

  // Sort parts for render pipeline (Relative Z-layer order)
  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));
  }, [parts]);

  // Active Variant Filter
  const isPartActiveInCurrentVariant = useCallback((partId: string): boolean => {
    if (activeVariantId === 'all') return true;
    const variant = variants.find(v => v.id === activeVariantId);
    if (!variant) return true;
    return variant.activePartIds.includes(partId);
  }, [activeVariantId, variants]);

  // Update a single part
  const updatePart = (partId: string, updater: (prev: PrefabPart) => PrefabPart) => {
    onUpdateCharacter(c => {
      const currParts = c.parts || [];
      const updated = currParts.map(p => p.id === partId ? updater(p) : p);
      return { ...c, parts: updated };
    });
  };

  // Delete part
  const handleDeletePart = (partId: string) => {
    onUpdateCharacter(c => {
      const remaining = (c.parts || []).filter(p => p.id !== partId);
      return { ...c, parts: remaining };
    });
    if (selectedPartId === partId) {
      const remaining = parts.filter(p => p.id !== partId);
      setSelectedPartId(remaining[0]?.id || null);
    }
    showToast('Removed composite part', 'info');
  };

  // Sockets & Points helpers
  const updatePoint = (pointId: string, updater: (prev: PrefabNamedPoint) => PrefabNamedPoint) => {
    onUpdateCharacter(c => {
      const currPoints = c.points || [];
      const updatedPoints = currPoints.map(pt => pt.id === pointId ? updater(pt) : pt);
      // Synchronize with sockets list
      const currSockets = c.sockets || [];
      const ptObj = updatedPoints.find(p => p.id === pointId);
      let updatedSockets = currSockets;
      if (ptObj) {
        updatedSockets = currSockets.map(s => s.tagId === ptObj.tagId ? {
          ...s,
          label: ptObj.name,
          offsetX: ptObj.defaultOffsetX,
          offsetY: ptObj.defaultOffsetY,
          visualMarkerColor: ptObj.color
        } : s);
      }
      return { ...c, points: updatedPoints, sockets: updatedSockets };
    });
  };

  const handleAddSocket = (name: string, tagId: SensoryTagID, color: string = '#38bdf8', offsetX: number = 0, offsetY: number = -16) => {
    const newPtId = `pt_${Date.now().toString().slice(-4)}`;
    const newPt: PrefabNamedPoint = {
      id: newPtId,
      name,
      tagId,
      color,
      defaultOffsetX: offsetX,
      defaultOffsetY: offsetY
    };
    const newSocket: PrefabSocket = {
      tagId,
      label: name,
      offsetX,
      offsetY,
      visualMarkerColor: color
    };

    onUpdateCharacter(c => {
      const currPoints = c.points || [];
      const currSockets = c.sockets || [];
      const existingSockIdx = currSockets.findIndex(s => s.tagId === tagId);
      const nextSockets = existingSockIdx >= 0 
        ? currSockets.map((s, i) => i === existingSockIdx ? newSocket : s)
        : [...currSockets, newSocket];

      return {
        ...c,
        points: [...currPoints, newPt],
        sockets: nextSockets
      };
    });
    setSelectedPointId(newPtId);
    showToast(`Added socket "${name}"`, 'success');
  };

  const handleDeleteSocket = (pointId: string) => {
    const pt = points.find(p => p.id === pointId);
    onUpdateCharacter(c => {
      const nextPoints = (c.points || []).filter(p => p.id !== pointId);
      const nextSockets = pt ? (c.sockets || []).filter(s => s.tagId !== pt.tagId) : (c.sockets || []);
      return { ...c, points: nextPoints, sockets: nextSockets };
    });
    if (selectedPointId === pointId) setSelectedPointId(null);
    showToast('Deleted socket', 'info');
  };

  // Polygons & Hitboxes helpers
  const updatePolygon = (polygonId: string, updater: (prev: PrefabNamedPolygon) => PrefabNamedPolygon) => {
    onUpdateCharacter(c => {
      const currPolys = c.polygons || [];
      const updatedPolys = currPolys.map(poly => poly.id === polygonId ? updater(poly) : poly);
      return { ...c, polygons: updatedPolys };
    });
  };

  const handleAddPolygon = (name: string, type: 'hurtbox' | 'hitbox' | 'shield' | 'trigger' = 'hurtbox') => {
    const newPolyId = `poly_${Date.now().toString().slice(-4)}`;
    const defaultColor = type === 'hitbox' ? '#ef4444' : type === 'shield' ? '#38bdf8' : type === 'trigger' ? '#eab308' : '#22c55e';
    const newPoly: PrefabNamedPolygon = {
      id: newPolyId,
      name,
      type,
      color: defaultColor,
      defaultVertices: [
        { x: -16, y: -24 },
        { x: 16, y: -24 },
        { x: 16, y: 16 },
        { x: -16, y: 16 }
      ]
    };
    onUpdateCharacter(c => ({
      ...c,
      polygons: [...(c.polygons || []), newPoly]
    }));
    setSelectedPolygonId(newPolyId);
    showToast(`Added ${type} polygon "${name}"`, 'success');
  };

  const handleDeletePolygon = (polygonId: string) => {
    onUpdateCharacter(c => ({
      ...c,
      polygons: (c.polygons || []).filter(p => p.id !== polygonId)
    }));
    if (selectedPolygonId === polygonId) setSelectedPolygonId(null);
    showToast('Deleted polygon', 'info');
  };

  // Base Capsule Collider helpers
  const updateCapsuleConfig = (updater: (prev: PrefabCapsuleConfig) => PrefabCapsuleConfig) => {
    onUpdateCharacter(c => {
      const currCapsule = c.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 };
      const nextCapsule = updater(currCapsule);
      return { ...c, capsule: nextCapsule };
    });
  };

  // Duplicate part
  const handleDuplicatePart = (part: PrefabPart) => {
    const newPart: PrefabPart = JSON.parse(JSON.stringify(part));
    newPart.id = `part_${Date.now().toString().slice(-4)}`;
    newPart.name = `${part.name} (Copy)`;
    newPart.offsetX = (part.offsetX || 0) + 8;
    newPart.offsetY = (part.offsetY || 0) + 8;

    onUpdateCharacter(c => ({
      ...c,
      parts: [...(c.parts || []), newPart]
    }));
    setSelectedPartId(newPart.id);
    showToast(`Duplicated part "${part.name}"`, 'success');
  };

  // Add new part
  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    const name = addPartName.trim() || `New ${addPartType.toUpperCase()} Part`;
    const newId = `part_${Date.now().toString().slice(-4)}`;

    let newPart: PrefabPart;
    if (addPartType === 'sprite') {
      newPart = {
        id: newId,
        name,
        type: 'sprite',
        offsetX: 0,
        offsetY: 0,
        targetLayer: 'objects',
        zOrder: addPartZOrder,
        visible: true,
        spritesheetId: spritesheets[0]?.id,
        frameIndex: 0,
        syncWithBaseAnimation: true,
        blendMode: 'source-over',
        opacity: 1
      };
    } else if (addPartType === 'particle') {
      newPart = {
        id: newId,
        name,
        type: 'particle',
        offsetX: 0,
        offsetY: 0,
        targetLayer: 'objects',
        zOrder: addPartZOrder,
        visible: true,
        particleSystemId: 'campfire_fire',
        rateMultiplier: 1.0,
        scaleMultiplier: 1.0,
        autoPlay: true
      };
    } else if (addPartType === 'light') {
      newPart = {
        id: newId,
        name,
        type: 'light',
        offsetX: 0,
        offsetY: 0,
        targetLayer: 'objects',
        zOrder: addPartZOrder,
        visible: true,
        color: '#ff9922',
        radius: 120,
        intensity: 1.0,
        pulseSpeed: 1.2,
        pulseAmount: 0.15
      };
    } else {
      newPart = {
        id: newId,
        name,
        type: 'collider',
        offsetX: 0,
        offsetY: 0,
        targetLayer: 'objects',
        zOrder: addPartZOrder,
        visible: true,
        shape: 'box',
        isSolid: true,
        isTrigger: false,
        width: 32,
        height: 32
      };
    }

    onUpdateCharacter(c => ({
      ...c,
      parts: [...(c.parts || []), newPart]
    }));

    setSelectedPartId(newId);
    setIsAddPartModalOpen(false);
    setAddPartName('');
    showToast(`Added part "${name}"`, 'success');
  };

  // Load Preset Composite Assemblies (e.g. Campfire, Tall Tree, Skeleton Warrior)
  const handleApplyPreset = (presetKey: 'campfire' | 'tree' | 'warrior' | 'mage') => {
    let newParts: PrefabPart[] = [];
    if (presetKey === 'campfire') {
      newParts = [
        {
          id: `part_logs_${Date.now()}`,
          name: 'Campfire Wood Logs (Base)',
          type: 'sprite',
          offsetX: 0,
          offsetY: 10,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          frameIndex: 0,
          opacity: 1
        },
        {
          id: `part_flame_${Date.now()}`,
          name: 'Campfire Flames (Live Particles)',
          type: 'particle',
          offsetX: 0,
          offsetY: -4,
          targetLayer: 'objects',
          zOrder: 1,
          visible: true,
          particleSystemId: 'campfire_fire',
          rateMultiplier: 1.0,
          scaleMultiplier: 1.0,
          autoPlay: true
        },
        {
          id: `part_smoke_${Date.now()}`,
          name: 'Rising Campfire Smoke',
          type: 'particle',
          offsetX: 0,
          offsetY: -16,
          targetLayer: 'overlay',
          zOrder: 2,
          visible: true,
          particleSystemId: 'campfire_smoke',
          rateMultiplier: 0.8,
          scaleMultiplier: 1.2,
          autoPlay: true
        },
        {
          id: `part_glow_${Date.now()}`,
          name: 'Warm Flame Glow (Point Light)',
          type: 'light',
          offsetX: 0,
          offsetY: -2,
          targetLayer: 'objects',
          zOrder: 3,
          visible: true,
          color: '#ff8822',
          radius: 140,
          intensity: 1.2,
          pulseSpeed: 2.0,
          pulseAmount: 0.2
        },
        {
          id: `part_solid_${Date.now()}`,
          name: 'Campfire Base Collider (Solid)',
          type: 'collider',
          offsetX: 0,
          offsetY: 8,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          shape: 'circle',
          radius: 14,
          isSolid: true,
          isTrigger: false
        }
      ];
    } else if (presetKey === 'tree') {
      newParts = [
        {
          id: `part_trunk_${Date.now()}`,
          name: 'Tree Trunk Base (Collidable)',
          type: 'sprite',
          offsetX: 0,
          offsetY: 16,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          frameIndex: 0,
          opacity: 1
        },
        {
          id: `part_canopy_${Date.now()}`,
          name: 'Tree Foliage Canopy (Overlay)',
          type: 'sprite',
          offsetX: 0,
          offsetY: -32,
          targetLayer: 'overlay',
          zOrder: 10,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          frameIndex: 1,
          opacity: 1,
          ySorting: true
        },
        {
          id: `part_trunk_solid_${Date.now()}`,
          name: 'Trunk Footing Collider',
          type: 'collider',
          offsetX: 0,
          offsetY: 20,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          shape: 'box',
          width: 20,
          height: 16,
          isSolid: true,
          isTrigger: false
        }
      ];
    } else if (presetKey === 'warrior') {
      newParts = [
        {
          id: `part_body_${Date.now()}`,
          name: 'Warrior Skeleton Body (Base)',
          type: 'sprite',
          offsetX: 0,
          offsetY: 0,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          syncWithBaseAnimation: true,
          opacity: 1
        },
        {
          id: `part_sword_${Date.now()}`,
          name: 'Steel Broadsword (Right Hand)',
          type: 'sprite',
          offsetX: 16,
          offsetY: 2,
          targetLayer: 'objects',
          zOrder: 2,
          visible: true,
          socketTagId: 'hand_weapon',
          spritesheetId: spritesheets[0]?.id,
          opacity: 1
        },
        {
          id: `part_shield_${Date.now()}`,
          name: 'Wooden Shield (Offhand)',
          type: 'sprite',
          offsetX: -14,
          offsetY: 4,
          targetLayer: 'objects',
          zOrder: -1,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          opacity: 1
        },
        {
          id: `part_sword_sparkle_${Date.now()}`,
          name: 'Flaming Sword Sparkles',
          type: 'particle',
          offsetX: 20,
          offsetY: -6,
          targetLayer: 'objects',
          zOrder: 3,
          visible: true,
          particleSystemId: 'weapon_glow',
          rateMultiplier: 1.2,
          scaleMultiplier: 0.9,
          autoPlay: true
        }
      ];
    } else if (presetKey === 'mage') {
      newParts = [
        {
          id: `part_body_${Date.now()}`,
          name: 'Mage Robe Base Body',
          type: 'sprite',
          offsetX: 0,
          offsetY: 0,
          targetLayer: 'objects',
          zOrder: 0,
          visible: true,
          spritesheetId: spritesheets[0]?.id,
          syncWithBaseAnimation: true,
          opacity: 1
        },
        {
          id: `part_staff_${Date.now()}`,
          name: 'Arcane Staff (Right Hand)',
          type: 'sprite',
          offsetX: 18,
          offsetY: -4,
          targetLayer: 'objects',
          zOrder: 2,
          visible: true,
          socketTagId: 'hand_weapon',
          spritesheetId: spritesheets[0]?.id,
          opacity: 1
        },
        {
          id: `part_staff_aura_${Date.now()}`,
          name: 'Arcane Orb Particle Aura',
          type: 'particle',
          offsetX: 20,
          offsetY: -22,
          targetLayer: 'objects',
          zOrder: 4,
          visible: true,
          particleSystemId: 'weapon_glow',
          rateMultiplier: 1.5,
          scaleMultiplier: 1.1,
          autoPlay: true
        },
        {
          id: `part_magic_light_${Date.now()}`,
          name: 'Arcane Crystal Glow Light',
          type: 'light',
          offsetX: 20,
          offsetY: -22,
          targetLayer: 'objects',
          zOrder: 3,
          visible: true,
          color: '#38bdf8',
          radius: 90,
          intensity: 1.4,
          pulseSpeed: 3.0,
          pulseAmount: 0.25
        }
      ];
    }

    onUpdateCharacter(c => ({
      ...c,
      parts: [...(c.parts || []), ...newParts]
    }));

    if (newParts.length > 0) {
      setSelectedPartId(newParts[0].id);
    }
    setIsPresetModalOpen(false);
    showToast(`Loaded "${presetKey}" composite assembly (${newParts.length} parts)`, 'success');
  };

  // Bake Composite Spritesheet function
  const handleBakeCompositeSpritesheet = () => {
    const baseSheet = spritesheets.find(s => s.id === currentAnimation.spritesheetId) || spritesheets[0];
    if (!baseSheet) {
      showToast('No active spritesheet to bake from', 'error');
      return;
    }

    const tileW = baseSheet.tileWidth || 64;
    const tileH = baseSheet.tileHeight || 64;
    const cols = baseSheet.cols || 8;
    const rows = baseSheet.rows || 4;
    const totalFrames = Math.min(cols * rows, (currentAnimation.endFrameIndex || 7) + 1);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cols * tileW;
    offCanvas.height = rows * tileH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.imageSmoothingEnabled = false;

    // Draw frame-by-frame
    for (let f = 0; f < totalFrames; f++) {
      const col = f % cols;
      const row = Math.floor(f / cols);
      const destX = col * tileW;
      const destY = row * tileH;
      const hw = tileW / 2;
      const hh = tileH / 2;

      offCtx.save();
      offCtx.translate(destX + hw, destY + hh);

      // Draw active sprite parts
      sortedParts.forEach(part => {
        if (!part.visible || part.type !== 'sprite') return;
        if (soloPartId && part.id !== soloPartId) return;
        if (!isPartActiveInCurrentVariant(part.id)) return;

        const spritePart = part as PrefabSpritePart;
        const partSheet = spritesheets.find(s => s.id === spritePart.spritesheetId) || baseSheet;
        const imgUrl = getSpritesheetDataUrl(partSheet);
        if (!imgUrl) return;

        const img = loadedImagesRef.current.get(imgUrl);
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const pCols = partSheet.cols || 8;
        const pTileW = partSheet.tileWidth || 64;
        const pTileH = partSheet.tileHeight || 64;
        const pFrame = spritePart.syncWithBaseAnimation ? f : (spritePart.frameIndex || 0);
        const pCol = pFrame % pCols;
        const pRow = Math.floor(pFrame / pCols);

        offCtx.save();
        offCtx.translate(part.offsetX || 0, part.offsetY || 0);
        if (part.rotationDeg) offCtx.rotate((part.rotationDeg * Math.PI) / 180);
        if (part.scale) offCtx.scale(part.scale, part.scale);
        if (part.flipX || part.flipY) offCtx.scale(part.flipX ? -1 : 1, part.flipY ? -1 : 1);
        if (spritePart.opacity !== undefined) offCtx.globalAlpha = spritePart.opacity;
        if (spritePart.blendMode) offCtx.globalCompositeOperation = spritePart.blendMode as any;

        offCtx.drawImage(
          img,
          pCol * pTileW, pRow * pTileH, pTileW, pTileH,
          -pTileW / 2, -pTileH / 2, pTileW, pTileH
        );
        offCtx.restore();
      });

      offCtx.restore();
    }

    const dataUrl = offCanvas.toDataURL('image/png');
    setBakeResultUrl(dataUrl);
    setIsBakeModalOpen(true);
  };

  // Save baked sheet to project
  const handleSaveBakedSheetToProject = () => {
    if (!bakeResultUrl) return;
    const baseSheet = spritesheets[0];
    const newSheetId = `sheet_composite_${Date.now().toString().slice(-4)}`;
    const newSheet: PrefabSpritesheet = {
      id: newSheetId,
      name: `${char.name} (Baked Composite)`,
      dataUrl: bakeResultUrl,
      tileWidth: baseSheet?.tileWidth || 64,
      tileHeight: baseSheet?.tileHeight || 64,
      cols: baseSheet?.cols || 8,
      rows: baseSheet?.rows || 4,
      totalFrames: baseSheet?.totalFrames || 32
    };

    onUpdateCharacter(c => ({
      ...c,
      spritesheets: [...(c.spritesheets || []), newSheet]
    }));

    setIsBakeModalOpen(false);
    showToast(`Saved composite sheet "${newSheet.name}" to Spritesheets!`, 'success');
  };

  // Main Live Render Loop for Composite Viewport
  useEffect(() => {
    let animId: number;

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          const width = canvas.width;
          const height = canvas.height;

          // 1. Draw Background
          ctx.clearRect(0, 0, width, height);

          if (bgTheme === 'grid') {
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, width, height);
          } else if (bgTheme === 'dungeon') {
            ctx.fillStyle = '#18181b';
            ctx.fillRect(0, 0, width, height);
          } else if (bgTheme === 'forest') {
            ctx.fillStyle = '#062e1e';
            ctx.fillRect(0, 0, width, height);
          } else if (bgTheme === 'magma') {
            ctx.fillStyle = '#2a0c0c';
            ctx.fillRect(0, 0, width, height);
          } else {
            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.save();
          ctx.translate(width / 2 + viewport.pan.x, height / 2 + viewport.pan.y);
          ctx.scale(viewport.scale, viewport.scale);

          // 2. Viewport Grid Lines
          if (showGrid) {
            const gridSize = 16;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 0.5;
            const range = 240;
            for (let x = -range; x <= range; x += gridSize) {
              ctx.beginPath();
              ctx.moveTo(x, -range);
              ctx.lineTo(x, range);
              ctx.stroke();
            }
            for (let y = -range; y <= range; y += gridSize) {
              ctx.beginPath();
              ctx.moveTo(-range, y);
              ctx.lineTo(range, y);
              ctx.stroke();
            }

            // Origin Crosshair Axes
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-24, 0);
            ctx.lineTo(24, 0);
            ctx.moveTo(0, -24);
            ctx.lineTo(0, 24);
            ctx.stroke();
          }

          // 3. Fallback Base Silhouette if no parts
          if (parts.length === 0) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-24, -32, 48, 64, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char.avatarIcon || '🛡️', 0, 0);
          }

          // 4. Render Composite Parts in strict layer & Z-order
          sortedParts.forEach(part => {
            if (!part.visible) return;
            if (soloPartId && part.id !== soloPartId) return;
            if (!isPartActiveInCurrentVariant(part.id)) return;

            const isSelected = part.id === selectedPartId;
            const px = part.offsetX || 0;
            const py = part.offsetY || 0;

            // ----------------------------------------------------
            // A. SPRITE PART RENDERING
            // ----------------------------------------------------
            if (part.type === 'sprite') {
              const spritePart = part as PrefabSpritePart;
              const sheet = spritesheets.find(s => s.id === spritePart.spritesheetId) || spritesheets[0];
              const imgUrl = getSpritesheetDataUrl(sheet);

              const tileW = sheet?.tileWidth || char.spriteWidth || 64;
              const tileH = sheet?.tileHeight || char.spriteHeight || 64;
              const cols = sheet?.cols || 8;

              ctx.save();
              ctx.translate(px, py);
              if (part.rotationDeg) ctx.rotate((part.rotationDeg * Math.PI) / 180);
              if (part.scale) ctx.scale(part.scale, part.scale);
              if (part.flipX || part.flipY) ctx.scale(part.flipX ? -1 : 1, part.flipY ? -1 : 1);
              if (spritePart.opacity !== undefined) ctx.globalAlpha = spritePart.opacity;
              if (spritePart.blendMode) ctx.globalCompositeOperation = spritePart.blendMode as any;

              if (imgUrl) {
                let cached = loadedImagesRef.current.get(imgUrl);
                if (!cached) {
                  cached = new Image();
                  cached.src = imgUrl;
                  loadedImagesRef.current.set(imgUrl, cached);
                }

                if (cached.complete && cached.naturalWidth > 0) {
                  const frameIdx = spritePart.syncWithBaseAnimation ? activeGlobalFrameIndex : (spritePart.frameIndex || 0);
                  const c = frameIdx % cols;
                  const r = Math.floor(frameIdx / cols);

                  ctx.drawImage(
                    cached,
                    c * tileW, r * tileH, tileW, tileH,
                    -tileW / 2, -tileH / 2, tileW, tileH
                  );
                } else {
                  ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                  ctx.strokeStyle = '#38bdf8';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(-tileW / 2, -tileH / 2, tileW, tileH);
                  ctx.font = '16px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('🖼️', 0, 0);
                }
              } else {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.strokeRect(-tileW / 2, -tileH / 2, tileW, tileH);
              }

              // Highlight outline for selected part
              if (isSelected) {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(-tileW / 2 - 2, -tileH / 2 - 2, tileW + 4, tileH + 4);
                ctx.setLineDash([]);
              }

              ctx.restore();
            }

            // ----------------------------------------------------
            // B. PARTICLE SYSTEM RENDERING
            // ----------------------------------------------------
            if (part.type === 'particle' && showParticles) {
              const particlePart = part as PrefabParticlePart;

              let engine = particleEnginesRef.current.get(part.id);
              if (!engine) {
                engine = new ParticleEngine();
                particleEnginesRef.current.set(part.id, engine);
              }

              // Resolve particle system data
              let sysData: ParticleSystemData | undefined;
              if (particlePart.particleSystemId && BUILTIN_PARTICLE_PRESETS[particlePart.particleSystemId]) {
                sysData = BUILTIN_PARTICLE_PRESETS[particlePart.particleSystemId] as ParticleSystemData;
              } else {
                const userFile = project.fileSystem.particles?.find(p => p.id === particlePart.particleSystemId || p.fileName === particlePart.particleFile);
                if (userFile) {
                  sysData = userFile.particleData;
                } else {
                  sysData = BUILTIN_PARTICLE_PRESETS.campfire_fire as ParticleSystemData;
                }
              }

              if (sysData && isPlaying && (particlePart.autoPlay !== false)) {
                const rate = (sysData.emitter.emissionRate || 20) * (particlePart.rateMultiplier || 1.0);
                const countToSpawn = Math.max(1, Math.floor(rate * dt));
                if (Math.random() < (rate * dt) % 1) {
                  engine.spawnParticles(1, sysData, { x: px, y: py });
                }
                if (countToSpawn > 1) {
                  engine.spawnParticles(countToSpawn - 1, sysData, { x: px, y: py });
                }
              }

              // Update & Draw live particles in exact z-order layer position
              engine.update(dt, { collideWithMapSolids: false }, 9999, 0);
              engine.render(ctx, { x: 0, y: 0 }, 1, null, false);

              // Gizmo marker for particle emitter locus
              if (isSelected || showSockets) {
                ctx.save();
                ctx.translate(px, py);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.stroke();

                ctx.font = '9px monospace';
                ctx.fillStyle = '#fbbf24';
                ctx.textAlign = 'center';
                ctx.fillText(part.name, 0, -12);
                ctx.restore();
              }
            }

            // ----------------------------------------------------
            // C. LIGHT SOURCE RENDERING
            // ----------------------------------------------------
            if (part.type === 'light' && showLights) {
              const lightPart = part as PrefabLightPart;
              const rad = lightPart.radius || 100;
              const intensity = lightPart.intensity || 1.0;
              const pulse = lightPart.pulseAmount ? Math.sin(now * 0.005 * (lightPart.pulseSpeed || 1)) * lightPart.pulseAmount : 0;
              const effRadius = Math.max(10, rad * (1 + pulse));

              ctx.save();
              ctx.translate(px, py);
              ctx.globalCompositeOperation = 'screen';

              const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, effRadius);
              grad.addColorStop(0, `${lightPart.color || '#ff9922'}${Math.round(Math.min(255, 200 * intensity)).toString(16).padStart(2, '0')}`);
              grad.addColorStop(0.5, `${lightPart.color || '#ff9922'}${Math.round(Math.min(255, 80 * intensity)).toString(16).padStart(2, '0')}`);
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(0, 0, effRadius, 0, Math.PI * 2);
              ctx.fill();

              if (isSelected || showSockets) {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(0, 0, effRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
              }
              ctx.restore();
            }

            // ----------------------------------------------------
            // D. COLLIDER / TRIGGER RENDERING
            // ----------------------------------------------------
            if (part.type === 'collider' && showColliders) {
              const colPart = part as PrefabColliderPart;
              const isSolid = colPart.isSolid !== false;
              const colColor = isSolid ? '#ef4444' : '#22c55e';

              ctx.save();
              ctx.translate(px, py);
              ctx.strokeStyle = colColor;
              ctx.fillStyle = isSolid ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
              ctx.lineWidth = isSelected ? 2.5 : 1.5;

              if (colPart.shape === 'circle') {
                const r = colPart.radius || 16;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              } else {
                const w = colPart.width || 32;
                const h = colPart.height || 32;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 4);
                ctx.fill();
                ctx.stroke();
              }

              if (isSelected) {
                ctx.fillStyle = colColor;
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(isSolid ? '🧱 SOLID' : '⚡ TRIGGER', 0, 0);
              }

              ctx.restore();
            }
          });

          // 5. Base Capsule Collider Overlay
          if (showColliders && capsule) {
            const cx = capsule.offsetX || 0;
            const cy = capsule.offsetY || 0;
            const cr = capsule.radius || 16;
            const ch = capsule.height || 44;
            const halfH = Math.max(0, ch / 2 - cr);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = isSelectedCapsule ? '#38bdf8' : '#06b6d4';
            ctx.fillStyle = isSelectedCapsule ? 'rgba(56, 189, 248, 0.2)' : 'rgba(6, 182, 212, 0.12)';
            ctx.lineWidth = isSelectedCapsule ? 2.5 : 1.5;
            ctx.setLineDash(isSelectedCapsule ? [] : [3, 2]);

            ctx.beginPath();
            ctx.arc(0, -halfH, cr, Math.PI, 0, false);
            ctx.lineTo(cr, halfH);
            ctx.arc(0, halfH, cr, 0, Math.PI, false);
            ctx.lineTo(-cr, -halfH);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '8px monospace';
            ctx.fillStyle = isSelectedCapsule ? '#38bdf8' : '#06b6d4';
            ctx.textAlign = 'center';
            ctx.fillText(`Base Capsule (${cr}r x ${ch}h)`, 0, halfH + cr + 9);
            ctx.restore();
          }

          // 7. Polygons & Hitboxes Overlay
          if ((showColliders || showPolygons) && polygons.length > 0) {
            polygons.forEach(poly => {
              const isSelected = poly.id === selectedPolygonId;
              const verts = poly.defaultVertices || [];
              if (verts.length < 3) return;

              const col = poly.color || (poly.type === 'hitbox' ? '#ef4444' : poly.type === 'shield' ? '#38bdf8' : poly.type === 'trigger' ? '#eab308' : '#22c55e');

              ctx.save();
              ctx.strokeStyle = col;
              ctx.fillStyle = isSelected ? `${col}40` : `${col}20`;
              ctx.lineWidth = isSelected ? 2.5 : 1.5;

              ctx.beginPath();
              verts.forEach((v, i) => {
                if (i === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
              });
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Draw vertex handle dots
              verts.forEach((v, i) => {
                const isVertSel = isSelected && selectedVertexIndex === i;
                ctx.fillStyle = isVertSel ? '#ffffff' : col;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(v.x, v.y, isVertSel ? 5 : (isSelected ? 3.5 : 2.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              });

              // Centroid label
              const avgX = verts.reduce((acc, v) => acc + v.x, 0) / verts.length;
              const avgY = verts.reduce((acc, v) => acc + v.y, 0) / verts.length;
              ctx.font = '8px monospace';
              ctx.fillStyle = col;
              ctx.textAlign = 'center';
              ctx.fillText(poly.name, avgX, avgY);
              ctx.restore();
            });
          }

          // 8. Sensory Sockets Overlay
          if (showSockets && (points.length > 0 || sockets.length > 0)) {
            const allRenderSockets = points.length > 0 ? points.map(pt => ({
              id: pt.id,
              tagId: pt.tagId,
              label: pt.name,
              x: pt.defaultOffsetX,
              y: pt.defaultOffsetY,
              color: pt.color || '#38bdf8'
            })) : sockets.map(sock => ({
              id: sock.tagId,
              tagId: sock.tagId,
              label: sock.label || sock.tagId,
              x: sock.offsetX || 0,
              y: sock.offsetY || 0,
              color: sock.visualMarkerColor || '#38bdf8'
            }));

            allRenderSockets.forEach(sock => {
              const isSelected = selectedPointId === sock.id || selectedPointId === sock.tagId;
              ctx.save();
              ctx.translate(sock.x, sock.y);

              ctx.fillStyle = sock.color;
              ctx.beginPath();
              ctx.arc(0, 0, isSelected ? 4.5 : 3, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = isSelected ? '#ffffff' : sock.color;
              ctx.lineWidth = isSelected ? 2 : 1;
              ctx.beginPath();
              ctx.arc(0, 0, isSelected ? 9 : 7, 0, Math.PI * 2);
              ctx.stroke();

              ctx.font = isSelected ? 'bold 9px monospace' : '8px monospace';
              ctx.fillStyle = isSelected ? '#ffffff' : sock.color;
              ctx.textAlign = 'center';
              ctx.fillText(sock.label, 0, -11);

              ctx.restore();
            });
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    viewport.scale, 
    viewport.pan, 
    showGrid, 
    showColliders,
    showPolygons, 
    showLights, 
    showParticles, 
    showSockets, 
    bgTheme, 
    sortedParts, 
    selectedPartId,
    selectedPointId,
    selectedPolygonId,
    selectedVertexIndex,
    isSelectedCapsule,
    soloPartId, 
    activeVariantId, 
    isPlaying, 
    activeGlobalFrameIndex, 
    char, 
    spritesheets, 
    sockets,
    points,
    polygons,
    capsule,
    project.fileSystem.particles
  ]);

  // Viewport Mouse / Drag Gizmo Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Center world coords via viewport
    const worldPt = viewport.screenToWorld({ x: clientX, y: clientY }, 'center');
    const worldX = worldPt.x;
    const worldY = worldPt.y;

    // 1. Hit test Polygon Vertices (if a polygon is selected or active)
    if ((showColliders || showPolygons) && polygons.length > 0) {
      // Check selected polygon vertices first
      const selPoly = polygons.find(p => p.id === selectedPolygonId);
      if (selPoly) {
        const vIdx = selPoly.defaultVertices.findIndex(v => {
          const dist = Math.hypot(worldX - v.x, worldY - v.y);
          return dist <= 8;
        });
        if (vIdx >= 0) {
          setSelectedVertexIndex(vIdx);
          setDraggingGizmo({
            kind: 'poly_vertex',
            id: selPoly.id,
            vertexIndex: vIdx,
            startMouseX: worldX,
            startMouseY: worldY,
            startX: selPoly.defaultVertices[vIdx].x,
            startY: selPoly.defaultVertices[vIdx].y
          });
          return;
        }
      }

      // Check any polygon centroid / vertex
      for (const poly of polygons) {
        const vIdx = poly.defaultVertices.findIndex(v => Math.hypot(worldX - v.x, worldY - v.y) <= 8);
        if (vIdx >= 0) {
          setSelectedPolygonId(poly.id);
          setSelectedVertexIndex(vIdx);
          setSelectedPartId(null);
          setSelectedPointId(null);
          setIsSelectedCapsule(false);
          setDraggingGizmo({
            kind: 'poly_vertex',
            id: poly.id,
            vertexIndex: vIdx,
            startMouseX: worldX,
            startMouseY: worldY,
            startX: poly.defaultVertices[vIdx].x,
            startY: poly.defaultVertices[vIdx].y
          });
          return;
        }
      }
    }

    // 2. Hit test Sockets & Points
    if (showSockets && points.length > 0) {
      const hitPt = points.find(pt => {
        const dist = Math.hypot(worldX - pt.defaultOffsetX, worldY - pt.defaultOffsetY);
        return dist <= 12;
      });
      if (hitPt) {
        setSelectedPointId(hitPt.id);
        setSelectedPartId(null);
        setSelectedPolygonId(null);
        setIsSelectedCapsule(false);
        setDraggingGizmo({
          kind: 'point',
          id: hitPt.id,
          startMouseX: worldX,
          startMouseY: worldY,
          startX: hitPt.defaultOffsetX,
          startY: hitPt.defaultOffsetY
        });
        return;
      }
    }

    // 3. Hit test Base Capsule Collider
    if (showColliders && capsule) {
      const cx = capsule.offsetX || 0;
      const cy = capsule.offsetY || 0;
      const cr = capsule.radius || 16;
      const ch = capsule.height || 44;
      if (Math.abs(worldX - cx) <= cr + 4 && Math.abs(worldY - cy) <= ch / 2 + 4) {
        setIsSelectedCapsule(true);
        setSelectedPartId(null);
        setSelectedPointId(null);
        setSelectedPolygonId(null);
        setDraggingGizmo({
          kind: 'capsule',
          id: 'base_capsule',
          startMouseX: worldX,
          startMouseY: worldY,
          startX: cx,
          startY: cy
        });
        return;
      }
    }

    // 4. Hit test composite parts (in reverse sort order: topmost first)
    const hitPart = [...sortedParts].reverse().find(part => {
      if (!part.visible) return false;
      const px = part.offsetX || 0;
      const py = part.offsetY || 0;
      const dist = Math.sqrt((worldX - px) * (worldX - px) + (worldY - py) * (worldY - py));
      return dist <= 24; // 24px grab radius
    });

    if (hitPart) {
      setSelectedPartId(hitPart.id);
      setSelectedPointId(null);
      setSelectedPolygonId(null);
      setIsSelectedCapsule(false);
      setDraggingGizmo({
        kind: 'part',
        id: hitPart.id,
        startMouseX: worldX,
        startMouseY: worldY,
        startX: hitPart.offsetX || 0,
        startY: hitPart.offsetY || 0
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingGizmo) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const worldPt = viewport.screenToWorld({ x: clientX, y: clientY }, 'center');
      const worldX = worldPt.x;
      const worldY = worldPt.y;

      let newX = Math.round(draggingGizmo.startX + (worldX - draggingGizmo.startMouseX));
      let newY = Math.round(draggingGizmo.startY + (worldY - draggingGizmo.startMouseY));

      if (snapToGrid) {
        newX = Math.round(newX / 8) * 8;
        newY = Math.round(newY / 8) * 8;
      }

      if (draggingGizmo.kind === 'part') {
        updatePart(draggingGizmo.id, p => ({ ...p, offsetX: newX, offsetY: newY }));
      } else if (draggingGizmo.kind === 'point') {
        updatePoint(draggingGizmo.id, pt => ({ ...pt, defaultOffsetX: newX, defaultOffsetY: newY }));
      } else if (draggingGizmo.kind === 'poly_vertex' && draggingGizmo.vertexIndex !== undefined) {
        const vIdx = draggingGizmo.vertexIndex;
        updatePolygon(draggingGizmo.id, poly => {
          const nextVerts = [...poly.defaultVertices];
          nextVerts[vIdx] = { x: newX, y: newY };
          return { ...poly, defaultVertices: nextVerts };
        });
      } else if (draggingGizmo.kind === 'capsule') {
        updateCapsuleConfig(cap => ({ ...cap, offsetX: newX, offsetY: newY }));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingGizmo(null);
  };

  // Keyboard Nudging for selected part
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPartId) return;
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const step = e.shiftKey ? 8 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updatePart(selectedPartId, p => ({ ...p, offsetX: (p.offsetX || 0) - step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updatePart(selectedPartId, p => ({ ...p, offsetX: (p.offsetX || 0) + step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updatePart(selectedPartId, p => ({ ...p, offsetY: (p.offsetY || 0) - step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updatePart(selectedPartId, p => ({ ...p, offsetY: (p.offsetY || 0) + step }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartId]);

  return (
    <div className="flex flex-col xl:flex-row gap-5 items-start">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: PARTS HIERARCHY, LAYERS STACK & SOCKETS */}
      {/* ========================================================================= */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        
        {/* Subtabs Selector Bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('parts');
              if (parts.length > 0 && !selectedPartId) setSelectedPartId(parts[0].id);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'parts' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Parts ({parts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('sockets');
              if (points.length > 0) setSelectedPointId(points[0].id);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'sockets' 
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Anchor size={13} />
            <span>Sockets ({points.length || sockets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('colliders');
              if (polygons.length > 0) setSelectedPolygonId(polygons[0].id);
              else setIsSelectedCapsule(true);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'colliders' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield size={13} />
            <span>Colliders ({polygons.length + 1})</span>
          </button>
        </div>

        {/* SUBTAB 1: PARTS & LAYERS HIERARCHY */}
        {activeSubTab === 'parts' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            {/* Header & Quick Action Buttons */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Composite Hierarchy
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                  title="Load multi-part composite templates (Campfire, Tree, Warrior, Mage)"
                >
                  <Wand2 size={11} />
                  <span>Presets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md shadow-emerald-600/30 transition"
                >
                  <Plus size={12} />
                  <span>Add Part</span>
                </button>
              </div>
            </div>

            {/* Variant Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                <span>Equipment / Variant View</span>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Enter new variant name (e.g. Archer, Mage, Unlit):');
                    if (!name) return;
                    const newVarId = `var_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                    const newVar: PrefabVariant = {
                      id: newVarId,
                      name,
                      activePartIds: parts.map(p => p.id)
                    };
                    onUpdateCharacter(c => ({
                      ...c,
                      variants: [...(c.variants || []), newVar],
                      activeVariantId: newVarId
                    }));
                    setActiveVariantId(newVarId);
                    showToast(`Created variant "${name}"`, 'success');
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  + New Variant
                </button>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveVariantId('all')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                    activeVariantId === 'all' ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  Master (All Parts)
                </button>
                {variants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVariantId(v.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                      activeVariantId === v.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Parts Stack List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {parts.length === 0 ? (
                <div className="p-6 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
                  <Layers size={24} className="mx-auto text-neutral-600" />
                  <p className="text-xs font-bold text-neutral-400">No Parts In Hierarchy</p>
                  <p className="text-[10px] text-neutral-500">
                    Add sprites, particle systems, point lights, or colliders to compose your object.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPresetModalOpen(true)}
                    className="mt-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold"
                  >
                    Load Campfire / Tree Preset
                  </button>
                </div>
              ) : (
                sortedParts.map((part) => {
                  const isSelected = part.id === selectedPartId;
                  const isSolo = soloPartId === part.id;
                  const isEnabledInVariant = isPartActiveInCurrentVariant(part.id);

                  return (
                    <div
                      key={part.id}
                      onClick={() => {
                        setSelectedPartId(part.id);
                        setSelectedPointId(null);
                        setSelectedPolygonId(null);
                        setIsSelectedCapsule(false);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-neutral-950 border-emerald-500 shadow-md shadow-emerald-500/10' 
                          : 'bg-neutral-950/60 border-neutral-800/90 hover:border-neutral-700 text-neutral-300'
                      } ${!part.visible || !isEnabledInVariant ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Icon & Name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0"
                            style={{
                              backgroundColor: part.type === 'sprite' ? '#38bdf822' : part.type === 'particle' ? '#f59e0b22' : part.type === 'light' ? '#fbbf2422' : '#ef444422',
                              color: part.type === 'sprite' ? '#38bdf8' : part.type === 'particle' ? '#f59e0b' : part.type === 'light' ? '#fbbf24' : '#ef4444'
                            }}
                          >
                            {part.type === 'sprite' && <ImageIcon size={12} />}
                            {part.type === 'particle' && <Flame size={12} />}
                            {part.type === 'light' && <Sun size={12} />}
                            {part.type === 'collider' && <Box size={12} />}
                          </span>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {part.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold">
                                {part.zOrder === 0 && 'Main (0)'}
                                {part.zOrder === 1 && 'In Front (+1)'}
                                {part.zOrder === -1 && 'Behind (-1)'}
                                {part.zOrder === 2 && 'Top (+2)'}
                                {part.zOrder === -2 && 'Far Back (-2)'}
                                {![ -2, -1, 0, 1, 2 ].includes(part.zOrder) && `Z: ${part.zOrder > 0 ? `+${part.zOrder}` : part.zOrder}`}
                              </span>
                              {part.socketTagId && (
                                <span className="text-sky-400 flex items-center gap-0.5">
                                  <Anchor size={8} /> {part.socketTagId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Quick Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          {activeVariantId !== 'all' && (
                            <input
                              type="checkbox"
                              checked={isEnabledInVariant}
                              onChange={(e) => {
                                e.stopPropagation();
                                const checked = e.target.checked;
                                onUpdateCharacter(c => ({
                                  ...c,
                                  variants: (c.variants || []).map(v => {
                                    if (v.id === activeVariantId) {
                                      const activeIds = checked 
                                        ? [...v.activePartIds, part.id]
                                        : v.activePartIds.filter(id => id !== part.id);
                                      return { ...v, activePartIds: activeIds };
                                    }
                                    return v;
                                  })
                                }));
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              title="Toggle in this variant"
                            />
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePart(part.id, p => ({ ...p, visible: !p.visible }));
                            }}
                            className={`p-1 rounded hover:bg-neutral-800 ${part.visible ? 'text-neutral-400 hover:text-white' : 'text-neutral-600'}`}
                            title={part.visible ? 'Hide Part' : 'Show Part'}
                          >
                            {part.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSoloPartId(prev => prev === part.id ? null : part.id);
                            }}
                            className={`p-1 rounded text-[9px] font-bold ${isSolo ? 'bg-amber-500 text-black font-extrabold' : 'text-neutral-500 hover:text-amber-400'}`}
                            title="Solo this part only"
                          >
                            S
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicatePart(part);
                            }}
                            className="p-1 rounded text-neutral-500 hover:text-white"
                            title="Duplicate part"
                          >
                            <Copy size={11} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePart(part.id);
                            }}
                            className="p-1 rounded text-neutral-500 hover:text-red-400"
                            title="Delete part"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: SOCKETS & PAPERDOLL ANCHORS */}
        {activeSubTab === 'sockets' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Anchor size={16} className="text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Attachment Sockets ({points.length || sockets.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const label = prompt('Enter socket label (e.g. Weapon Hand, Offhand, Head, Footsteps, Aura Anchor):');
                  if (!label) return;
                  const tagId = `sock_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}` as SensoryTagID;
                  handleAddSocket(label, tagId, '#38bdf8', 0, -12);
                }}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md shadow-sky-600/30 transition"
              >
                <Plus size={12} />
                <span>Add Socket</span>
              </button>
            </div>

            <p className="text-[11px] text-neutral-400">
              Sockets are structural attachment points. Equipment, armor, weapons, and particle effects can attach and snap to them.
            </p>

            {/* Sockets Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { name: 'Head / Eyes', tag: 'head_eyes', col: '#38bdf8', x: 0, y: -24 },
                { name: 'Weapon Hand', tag: 'hand_weapon', col: '#ef4444', x: 16, y: 0 },
                { name: 'Offhand Shield', tag: 'hand_offhand', col: '#3b82f6', x: -16, y: 0 },
                { name: 'Feet / Ground', tag: 'feet_ground', col: '#22c55e', x: 0, y: 20 },
                { name: 'Cast Point', tag: 'spell_cast', col: '#a855f7', x: 0, y: -32 }
              ].map(preset => {
                const alreadyExists = points.some(p => p.tagId === preset.tag);
                if (alreadyExists) return null;
                return (
                  <button
                    key={preset.tag}
                    type="button"
                    onClick={() => handleAddSocket(preset.name, preset.tag as SensoryTagID, preset.col, preset.x, preset.y)}
                    className="px-2 py-0.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-white transition"
                  >
                    + {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Sockets List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {points.length === 0 ? (
                <div className="p-6 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
                  <Anchor size={24} className="mx-auto text-neutral-600" />
                  <p className="text-xs font-bold text-neutral-400">No Sockets Configured</p>
                  <p className="text-[10px] text-neutral-500">
                    Add sockets to allow modular items, weapons, and particle effects to anchor dynamically.
                  </p>
                </div>
              ) : (
                points.map((pt) => {
                  const isSelected = pt.id === selectedPointId;
                  return (
                    <div
                      key={pt.id}
                      onClick={() => {
                        setSelectedPointId(pt.id);
                        setSelectedPartId(null);
                        setSelectedPolygonId(null);
                        setIsSelectedCapsule(false);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-neutral-950 border-sky-500 shadow-md shadow-sky-500/10' 
                          : 'bg-neutral-950/60 border-neutral-800/90 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: pt.color || '#38bdf8' }} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{pt.name}</h4>
                            <span className="text-[10px] font-mono text-neutral-500">Tag: {pt.tagId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[10px] text-cyan-400 font-bold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                            ({pt.defaultOffsetX}, {pt.defaultOffsetY})
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSocket(pt.id);
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Delete socket"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: HITBOXES, HURTBOXES & COLLIDERS */}
        {activeSubTab === 'colliders' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Physics & Hitboxes
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const name = prompt('Enter polygon name (e.g. Torso Hurtbox, Sword Slash Hitbox, Shield Wall):');
                  if (!name) return;
                  handleAddPolygon(name, 'hurtbox');
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md shadow-amber-600/30 transition"
              >
                <Plus size={12} />
                <span>Add Polygon</span>
              </button>
            </div>

            {/* Base Capsule Collider Card */}
            <div
              onClick={() => {
                setIsSelectedCapsule(true);
                setSelectedPolygonId(null);
                setSelectedPointId(null);
                setSelectedPartId(null);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer ${
                isSelectedCapsule 
                  ? 'bg-neutral-950 border-cyan-500 shadow-md shadow-cyan-500/10' 
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Box size={14} className="text-cyan-400" />
                  <h4 className="text-xs font-bold text-white">Base Capsule Collider</h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {capsule.radius}r x {capsule.height}h
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Primary movement & world solid obstacle boundary for characters and entities.
              </p>
            </div>

            {/* Hitbox / Hurtbox Polygon Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                <span>Polygon Colliders ({polygons.length})</span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddPolygon('Full Body Hurtbox', 'hurtbox')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  + Hurtbox
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPolygon('Weapon Slash Hitbox', 'hitbox')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-red-400 hover:text-red-300 font-medium"
                >
                  + Hitbox
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPolygon('Shield Block Area', 'shield')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  + Shield
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPolygon('Proximity Trigger', 'trigger')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  + Trigger
                </button>
              </div>
            </div>

            {/* Polygons List */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {polygons.length === 0 ? (
                <div className="p-4 text-center bg-neutral-950/60 rounded-xl border border-neutral-800">
                  <p className="text-[11px] text-neutral-500">
                    No custom polygon hitboxes yet. Add hurtboxes, weapon strike hitboxes, or shields above.
                  </p>
                </div>
              ) : (
                polygons.map((poly) => {
                  const isSelected = poly.id === selectedPolygonId;
                  const col = poly.color || (poly.type === 'hitbox' ? '#ef4444' : poly.type === 'shield' ? '#38bdf8' : poly.type === 'trigger' ? '#eab308' : '#22c55e');

                  return (
                    <div
                      key={poly.id}
                      onClick={() => {
                        setSelectedPolygonId(poly.id);
                        setSelectedPointId(null);
                        setSelectedPartId(null);
                        setIsSelectedCapsule(false);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/10' 
                          : 'bg-neutral-950/60 border-neutral-800/90 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: col }} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{poly.name}</h4>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono">
                              <span className="uppercase font-bold" style={{ color: col }}>{poly.type}</span>
                              <span className="text-neutral-500">• {poly.defaultVertices?.length || 0} vertices</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePolygon(poly.id);
                          }}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                          title="Delete polygon"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER WORKSPACE: INTERACTIVE LIVE COMPOSITE VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
        
        {/* Viewport Toolbar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 px-4 flex items-center justify-between flex-wrap gap-2 shadow-xl">
          
          {/* Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs ${
                isPlaying ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Play Live Simulation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentFrameOffset(prev => Math.max(0, prev - 1))}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
              title="Previous Frame"
            >
              <SkipBack size={13} />
            </button>

            <span className="text-xs font-mono font-bold text-neutral-300 px-1">
              Frame #{activeGlobalFrameIndex}
            </span>

            <button
              type="button"
              onClick={() => setCurrentFrameOffset(prev => prev + 1)}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
              title="Next Frame"
            >
              <SkipForward size={13} />
            </button>

            {/* Animation State Picker */}
            <select
              value={activeAnimationState}
              onChange={(e) => {
                setActiveAnimationState(e.target.value);
                setCurrentFrameOffset(0);
              }}
              className="bg-neutral-950 border border-neutral-800 text-white rounded-xl px-2 py-1 text-xs font-mono cursor-pointer"
              title="Test Animation State"
            >
              {(char.animations || []).map(a => (
                <option key={a.stateId} value={a.stateId}>
                  🎬 {a.label || a.stateId}
                </option>
              ))}
            </select>
          </div>

          {/* Viewport Toggles & Bake Button */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Layer Visibility Toggles */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setShowParticles(!showParticles)}
                className={`p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  showParticles ? 'bg-amber-600 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Particle Simulation"
              >
                <Flame size={11} />
                <span>Particles</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLights(!showLights)}
                className={`p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  showLights ? 'bg-amber-500 text-black font-extrabold' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Lights"
              >
                <Sun size={11} />
                <span>Lights</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !showColliders;
                  setShowColliders(nextVal);
                  setShowPolygons(nextVal);
                }}
                className={`p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  showColliders ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Colliders"
              >
                <Box size={11} />
                <span>Colliders</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSockets(!showSockets)}
                className={`p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  showSockets ? 'bg-sky-600 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Toggle Sockets"
              >
                <Anchor size={11} />
                <span>Sockets</span>
              </button>
            </div>

            {/* Background Theme Selector */}
            <select
              value={bgTheme}
              onChange={(e) => setBgTheme(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 text-white rounded-xl px-2 py-1 text-xs cursor-pointer font-mono"
              title="Canvas Backdrop Theme"
            >
              <option value="dark">🌑 Dark Void</option>
              <option value="grid">📐 Blueprint Grid</option>
              <option value="dungeon">🏰 Dungeon Stone</option>
              <option value="forest">🌲 Forest Foliage</option>
              <option value="magma">🌋 Magma Cavern</option>
            </select>

            {/* Bake Composite Spritesheet Button */}
            <button
              type="button"
              onClick={handleBakeCompositeSpritesheet}
              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition"
              title="Flatten multi-layer sprites into a single composite spritesheet"
            >
              <Download size={13} />
              <span>Bake Spritesheet</span>
            </button>

          </div>

        </div>

        {/* Viewport Canvas Container */}
        <div className="relative bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl h-[540px] w-full flex items-center justify-center select-none">
          <ViewportCanvasContainer
            viewport={viewport}
            cursorMode="crosshair"
            showHud={true}
            hudProps={{
              themeColor: 'cyan',
              showGrid: showGrid,
              onToggleGrid: () => setShowGrid(!showGrid),
              onResetZoom: () => viewport.resetView(),
              onFitContent: () => viewport.fitContent(128, 128, 64)
            }}
          >
            <canvas
              ref={canvasRef}
              width={viewport.viewportSize.width}
              height={viewport.viewportSize.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="w-full h-full block cursor-crosshair"
            />

            {/* Selected Part Badge Overlay */}
            {selectedPart && (
              <div className="absolute top-3 left-3 pointer-events-none z-10">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
                  <span>Selected: <strong>{selectedPart.name}</strong> (X: {selectedPart.offsetX}, Y: {selectedPart.offsetY})</span>
                </span>
              </div>
            )}
          </ViewportCanvasContainer>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT SIDEBAR: INSPECTOR & PROPERTY EDITOR */}
      {/* ========================================================================= */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        
        {selectedPart ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Part Inspector
                </h3>
              </div>

              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase font-bold">
                {selectedPart.type}
              </span>
            </div>

            {/* 1. Identity & Layer Target */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 font-bold block">Part Name</label>
                <input
                  type="text"
                  value={selectedPart.name}
                  onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 font-bold block">Relative Layer</label>
                  <select
                    value={selectedPart.zOrder}
                    onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, zOrder: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  >
                    <option value={-2}>-2 : Far Back</option>
                    <option value={-1}>-1 : Behind Base</option>
                    <option value={0}>0 : Main / Base Layer</option>
                    <option value={1}>+1 : In Front</option>
                    <option value={2}>+2 : Top Overlay</option>
                    {![ -2, -1, 0, 1, 2 ].includes(selectedPart.zOrder) && (
                      <option value={selectedPart.zOrder}>
                        {selectedPart.zOrder > 0 ? `+${selectedPart.zOrder}` : selectedPart.zOrder} : Custom Layer
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block">Z-Order Value</label>
                  <input
                    type="number"
                    min={-20}
                    max={20}
                    value={selectedPart.zOrder}
                    onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, zOrder: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  />
                </div>
              </div>

              {/* 2. Transform Offsets */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Local Transform Offset
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold">Offset X (px)</label>
                    <input
                      type="number"
                      value={selectedPart.offsetX}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, offsetX: Number(e.target.value) }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-white font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold">Offset Y (px)</label>
                    <input
                      type="number"
                      value={selectedPart.offsetY}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, offsetY: Number(e.target.value) }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-white font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => updatePart(selectedPart.id, p => ({ ...p, offsetX: 0, offsetY: 0 }))}
                    className="text-[10px] text-neutral-400 hover:text-white font-mono"
                  >
                    Reset (0, 0)
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updatePart(selectedPart.id, p => ({ ...p, flipX: !p.flipX }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedPart.flipX ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
                    >
                      Flip X
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePart(selectedPart.id, p => ({ ...p, flipY: !p.flipY }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedPart.flipY ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
                    >
                      Flip Y
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Type-Specific Properties */}
              {selectedPart.type === 'sprite' && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Sprite Options
                  </span>

                  <div>
                    <label className="text-neutral-400 font-bold block">Source Spritesheet</label>
                    <select
                      value={(selectedPart as PrefabSpritePart).spritesheetId || ''}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, spritesheetId: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    >
                      {spritesheets.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold">Sync With Animation</label>
                    <input
                      type="checkbox"
                      checked={(selectedPart as PrefabSpritePart).syncWithBaseAnimation !== false}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, syncWithBaseAnimation: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  {!(selectedPart as PrefabSpritePart).syncWithBaseAnimation && (
                    <div>
                      <label className="text-neutral-400 font-bold block">Static Frame Index</label>
                      <input
                        type="number"
                        min={0}
                        max={64}
                        value={(selectedPart as PrefabSpritePart).frameIndex || 0}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, frameIndex: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-neutral-400 font-bold block">Blend Mode</label>
                    <select
                      value={(selectedPart as PrefabSpritePart).blendMode || 'source-over'}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, blendMode: e.target.value as any }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    >
                      <option value="source-over">Normal (source-over)</option>
                      <option value="screen">Screen (Glow)</option>
                      <option value="additive">Additive (Bright Flare)</option>
                      <option value="multiply">Multiply (Shadow / Darken)</option>
                      <option value="overlay">Overlay</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedPart.type === 'particle' && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Particle System Options
                  </span>

                  <div>
                    <label className="text-neutral-400 font-bold block">Particle Preset / File</label>
                    <select
                      value={(selectedPart as PrefabParticlePart).particleSystemId || ''}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, particleSystemId: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    >
                      <optgroup label="Built-in Presets">
                        <option value="campfire_fire">🔥 Campfire Flame & Embers</option>
                        <option value="campfire_smoke">💨 Rising Campfire Smoke</option>
                        <option value="weapon_glow">✨ Magic Weapon Glow</option>
                        <option value="torch_ember">🔥 Torch Ember Sparks</option>
                      </optgroup>
                      {(project.fileSystem.particles || []).length > 0 && (
                        <optgroup label="Project Particle Files">
                          {project.fileSystem.particles.map(pf => (
                            <option key={pf.id} value={pf.id}>{pf.name} ({pf.fileName})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-400 font-bold block">Rate Multiplier</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.1}
                        max={5}
                        value={(selectedPart as PrefabParticlePart).rateMultiplier || 1}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, rateMultiplier: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-400 font-bold block">Size Scale</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.2}
                        max={4}
                        value={(selectedPart as PrefabParticlePart).scaleMultiplier || 1}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, scaleMultiplier: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPart.type === 'light' && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Point Light Options
                  </span>

                  <div>
                    <label className="text-neutral-400 font-bold block">Light Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={(selectedPart as PrefabLightPart).color || '#ff9922'}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, color: e.target.value }))}
                        className="w-8 h-8 rounded bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedPart as PrefabLightPart).color || '#ff9922'}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, color: e.target.value }))}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-400 font-bold block">Radius (px)</label>
                      <input
                        type="number"
                        min={20}
                        max={400}
                        value={(selectedPart as PrefabLightPart).radius || 120}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, radius: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-400 font-bold block">Intensity</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.1}
                        max={3}
                        value={(selectedPart as PrefabLightPart).intensity || 1}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, intensity: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPart.type === 'collider' && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Collider & Physics Options
                  </span>

                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold">Solid Obstacle (Blocks Physics)</label>
                    <input
                      type="checkbox"
                      checked={(selectedPart as PrefabColliderPart).isSolid !== false}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, isSolid: e.target.checked }))}
                      className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold">Sensor Trigger (Interaction Zone)</label>
                    <input
                      type="checkbox"
                      checked={Boolean((selectedPart as PrefabColliderPart).isTrigger)}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, isTrigger: e.target.checked }))}
                      className="rounded text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 font-bold block">Shape</label>
                    <select
                      value={(selectedPart as PrefabColliderPart).shape || 'box'}
                      onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, shape: e.target.value as any }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    >
                      <option value="box">Box (Width x Height)</option>
                      <option value="circle">Circle (Radius)</option>
                    </select>
                  </div>

                  {(selectedPart as PrefabColliderPart).shape === 'circle' ? (
                    <div>
                      <label className="text-neutral-400 font-bold block">Radius (px)</label>
                      <input
                        type="number"
                        min={4}
                        max={120}
                        value={(selectedPart as PrefabColliderPart).radius || 16}
                        onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, radius: Number(e.target.value) }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-neutral-400 font-bold block">Width (px)</label>
                        <input
                          type="number"
                          min={4}
                          max={200}
                          value={(selectedPart as PrefabColliderPart).width || 32}
                          onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, width: Number(e.target.value) }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 font-bold block">Height (px)</label>
                        <input
                          type="number"
                          min={4}
                          max={200}
                          value={(selectedPart as PrefabColliderPart).height || 32}
                          onChange={(e) => updatePart(selectedPart.id, p => ({ ...p, height: Number(e.target.value) }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        ) : selectedPointId ? (() => {
          const pt = points.find(p => p.id === selectedPointId);
          if (!pt) return null;
          return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Anchor size={16} className="text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Socket Inspector</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSocket(pt.id)}
                  className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                  title="Delete socket"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 font-bold block">Socket Label</label>
                  <input
                    type="text"
                    value={pt.name}
                    onChange={(e) => updatePoint(pt.id, p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block">Tag ID</label>
                  <input
                    type="text"
                    value={pt.tagId}
                    onChange={(e) => updatePoint(pt.id, p => ({ ...p, tagId: e.target.value as SensoryTagID }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-sky-400 font-mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block">Marker Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={pt.color || '#38bdf8'}
                      onChange={(e) => updatePoint(pt.id, p => ({ ...p, color: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-neutral-950 border border-neutral-800 p-0.5"
                    />
                    <span className="font-mono text-neutral-400 text-xs">{pt.color || '#38bdf8'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Offset X (px)</label>
                    <input
                      type="number"
                      value={pt.defaultOffsetX}
                      onChange={(e) => updatePoint(pt.id, p => ({ ...p, defaultOffsetX: Number(e.target.value) }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Offset Y (px)</label>
                    <input
                      type="number"
                      value={pt.defaultOffsetY}
                      onChange={(e) => updatePoint(pt.id, p => ({ ...p, defaultOffsetY: Number(e.target.value) }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })() : selectedPolygonId ? (() => {
          const poly = polygons.find(p => p.id === selectedPolygonId);
          if (!poly) return null;
          return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Polygon Inspector</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePolygon(poly.id)}
                  className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                  title="Delete polygon"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 font-bold block">Polygon Name</label>
                  <input
                    type="text"
                    value={poly.name}
                    onChange={(e) => updatePolygon(poly.id, p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block">Collision Role</label>
                  <select
                    value={poly.type}
                    onChange={(e) => updatePolygon(poly.id, p => ({ ...p, type: e.target.value as any }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono mt-1"
                  >
                    <option value="hurtbox">🛡️ Hurtbox (Takes Damage)</option>
                    <option value="hitbox">⚔️ Hitbox (Deals Damage)</option>
                    <option value="shield">🛡️ Shield (Blocks Attacks)</option>
                    <option value="trigger">⚡ Proximity Trigger</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block">Wireframe Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={poly.color || '#22c55e'}
                      onChange={(e) => updatePolygon(poly.id, p => ({ ...p, color: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-neutral-950 border border-neutral-800 p-0.5"
                    />
                    <span className="font-mono text-neutral-400 text-xs">{poly.color || '#22c55e'}</span>
                  </div>
                </div>

                {/* Vertices List */}
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold">Vertices ({poly.defaultVertices.length})</label>
                    <button
                      type="button"
                      onClick={() => {
                        updatePolygon(poly.id, p => ({
                          ...p,
                          defaultVertices: [...p.defaultVertices, { x: 0, y: 0 }]
                        }));
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                    >
                      + Add Vertex
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {poly.defaultVertices.map((v, vIdx) => (
                      <div key={vIdx} className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
                        <span className="text-[9px] font-mono text-neutral-500 w-4">#{vIdx + 1}</span>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[9px] text-neutral-400 font-mono">X:</span>
                          <input
                            type="number"
                            value={v.x}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updatePolygon(poly.id, p => {
                                const nextVerts = [...p.defaultVertices];
                                nextVerts[vIdx] = { ...nextVerts[vIdx], x: val };
                                return { ...p, defaultVertices: nextVerts };
                              });
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[9px] text-neutral-400 font-mono">Y:</span>
                          <input
                            type="number"
                            value={v.y}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updatePolygon(poly.id, p => {
                                const nextVerts = [...p.defaultVertices];
                                nextVerts[vIdx] = { ...nextVerts[vIdx], y: val };
                                return { ...p, defaultVertices: nextVerts };
                              });
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-white"
                          />
                        </div>
                        {poly.defaultVertices.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              updatePolygon(poly.id, p => ({
                                ...p,
                                defaultVertices: p.defaultVertices.filter((_, i) => i !== vIdx)
                              }));
                            }}
                            className="text-neutral-500 hover:text-red-400 p-0.5"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })() : isSelectedCapsule ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Base Capsule Collider</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 font-bold block">Radius (px)</label>
                  <input
                    type="number"
                    value={capsule.radius}
                    onChange={(e) => updateCapsuleConfig(c => ({ ...c, radius: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-bold block">Height (px)</label>
                  <input
                    type="number"
                    value={capsule.height}
                    onChange={(e) => updateCapsuleConfig(c => ({ ...c, height: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 font-bold block">Offset X (px)</label>
                  <input
                    type="number"
                    value={capsule.offsetX || 0}
                    onChange={(e) => updateCapsuleConfig(c => ({ ...c, offsetX: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-bold block">Offset Y (px)</label>
                  <input
                    type="number"
                    value={capsule.offsetY || 0}
                    onChange={(e) => updateCapsuleConfig(c => ({ ...c, offsetY: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white font-mono mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
            <Sliders size={28} className="mx-auto text-neutral-600" />
            <h4 className="text-xs font-bold text-neutral-300">No Item Selected</h4>
            <p className="text-[11px] text-neutral-500">
              Click any part, socket, polygon, or collider on the left or directly on the canvas to inspect and edit its properties.
            </p>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW COMPOSITE PART */}
      {/* ========================================================================= */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePart} className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" />
                Add Composite Part
              </h4>
              <button
                type="button"
                onClick={() => setIsAddPartModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 font-bold block">Part Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAddPartType('sprite')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-left transition ${
                      addPartType === 'sprite' ? 'bg-sky-600/30 border-sky-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <ImageIcon size={16} className="text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs">Sprite Layer</div>
                      <div className="text-[9px] text-neutral-500">Base / Armor / Weapon</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddPartType('particle')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-left transition ${
                      addPartType === 'particle' ? 'bg-amber-600/30 border-amber-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Flame size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs">Particle System</div>
                      <div className="text-[9px] text-neutral-500">Flames, Smoke, Sparks</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddPartType('light')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-left transition ${
                      addPartType === 'light' ? 'bg-yellow-600/30 border-yellow-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Sun size={16} className="text-yellow-400 shrink-0" />
                    <div>
                      <div className="text-xs">Point Light</div>
                      <div className="text-[9px] text-neutral-500">Glowing Fire / Halo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddPartType('collider')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-left transition ${
                      addPartType === 'collider' ? 'bg-red-600/30 border-red-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Box size={16} className="text-red-400 shrink-0" />
                    <div>
                      <div className="text-xs">Collider / Trigger</div>
                      <div className="text-[9px] text-neutral-500">Physical Boundary</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-bold block">Part Name</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${addPartType === 'sprite' ? 'Iron Chestplate' : addPartType === 'particle' ? 'Torch Flames' : addPartType === 'light' ? 'Warm Hearth Glow' : 'Trunk Collider'}`}
                  value={addPartName}
                  onChange={(e) => setAddPartName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-bold block">Relative Layer Depth</label>
                <select
                  value={addPartZOrder}
                  onChange={(e) => setAddPartZOrder(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono mt-1"
                >
                  <option value={-2}>-2 : Far Back (Shadows, Background Auras)</option>
                  <option value={-1}>-1 : Behind Base (Back Arm, Back Cape)</option>
                  <option value={0}>0 : Main / Base Layer (Torso, Primary Body)</option>
                  <option value={1}>+1 : In Front (Front Arm, Held Items, Belts)</option>
                  <option value={2}>+2 : Top Overlay (Visors, Foreground Effects)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddPartModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
              >
                Create Part
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOAD COMPOSITE PRESET TEMPLATES */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Wand2 size={16} className="text-amber-400" />
                Composite Prefab Assembly Presets
              </h4>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Quickly load pre-configured multi-part assemblies with sprites, live particle emitters, and point lights:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <button
                type="button"
                onClick={() => handleApplyPreset('campfire')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-xl text-left transition group space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-amber-400 group-hover:text-amber-300">
                  <span className="text-lg">🔥</span>
                  <span>Campfire Assembly</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Wood logs sprite + live flame particle system + rising smoke + warm pulsing point light + solid collider.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('tree')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 rounded-xl text-left transition group space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400 group-hover:text-emerald-300">
                  <span className="text-lg">🌲</span>
                  <span>Tall Tree (Canopy Overlay)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Collidable trunk base on Solids layer + walk-under leafy canopy on Overlay layer with Y-depth sorting.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('warrior')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-sky-500/50 rounded-xl text-left transition group space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-sky-400 group-hover:text-sky-300">
                  <span className="text-lg">🗡️</span>
                  <span>Skeleton Warrior (Weapon & Shield)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Base body + sword in right hand with flame sparkles + shield in left hand on back layer.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('mage')}
                className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/50 rounded-xl text-left transition group space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-purple-400 group-hover:text-purple-300">
                  <span className="text-lg">🧙</span>
                  <span>Arcane Mage (Staff & Aura)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Robe body + glowing magic staff + particle aura attached to staff crystal + magic point light.
                </p>
              </button>

            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BAKE TO SPRITESHEET PREVIEW & EXPORT */}
      {/* ========================================================================= */}
      {isBakeModalOpen && bakeResultUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Download size={16} className="text-purple-400" />
                Baked Composite Spritesheet
              </h4>
              <button
                type="button"
                onClick={() => setIsBakeModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              All active layered sprite parts have been flattened into this single spritesheet image:
            </p>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center overflow-auto max-h-64">
              <img
                src={bakeResultUrl}
                alt="Baked Spritesheet"
                className="max-h-56 object-contain image-rendering-pixelated border border-neutral-700"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <a
                href={bakeResultUrl}
                download={`${char.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_composite.png`}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBakeModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBakedSheetToProject}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Add to Project Spritesheets</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
