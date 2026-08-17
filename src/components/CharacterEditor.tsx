import React, { useState, useRef, useEffect } from 'react';
import { 
  MasonProject, 
  CharacterFile, 
  CharacterData, 
  CharacterSpritesheet,
  CharacterNamedPoint,
  CharacterNamedPolygon,
  CharacterAnimationConfig,
  CharacterCapsuleConfig,
  PolygonHitboxVertex,
  FrameKeyframeData
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Circle, 
  Pentagon, 
  Grid, 
  Brain, 
  Layers, 
  Check, 
  X, 
  Key, 
  Shield, 
  Sword, 
  Maximize2,
  Sparkles,
  Upload,
  ChevronRight,
  HelpCircle,
  Minimize2
} from 'lucide-react';

interface CharacterEditorProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles?: () => void;
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  project,
  onUpdateProject
}) => {
  // Primary Studio View Tabs
  const [activeTab, setActiveTab] = useState<'animation_studio' | 'spritesheet_manager' | 'behavior_linkage'>('animation_studio');

  // Animation Playback & State
  const [selectedAnimStateId, setSelectedAnimStateId] = useState<string>('idle');
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(true);
  const [currentFrameOffset, setCurrentFrameOffset] = useState<number>(0);

  // Viewport Pan & Zoom Controls
  const [zoom, setZoom] = useState<number>(2.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport Layer Toggles
  const [showCapsule, setShowCapsule] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showPolygons, setShowPolygons] = useState<boolean>(true);
  const [showSprite, setShowSprite] = useState<boolean>(true);

  // Per-item individual visibility toggles
  const [hiddenPointIds, setHiddenPointIds] = useState<Set<string>>(new Set());
  const [hiddenPolygonIds, setHiddenPolygonIds] = useState<Set<string>>(new Set());

  // Active Selections & Dragging
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [selectedPolygonId, setSelectedPolygonId] = useState<string>('');
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

  const [dragTarget, setDragTarget] = useState<{
    type: 'point' | 'poly_vertex';
    id: string;
    vertexIndex?: number;
  } | null>(null);

  // Item Edit Modal State
  const [editingItem, setEditingItem] = useState<{
    type: 'point' | 'polygon';
    id: string;
    name: string;
    color: string;
    polyType?: 'hurtbox' | 'hitbox' | 'shield' | 'trigger';
    tagId?: string;
  } | null>(null);

  // Character Files
  const charFiles = project.fileSystem.characters || [];
  const activeFileName = project.activeFiles.characterFileName || charFiles[0]?.fileName || '';
  const currentFile = charFiles.find(c => c.fileName === activeFileName) || charFiles[0] || {
    id: 'char_default',
    name: 'Korrath Steelhand',
    fileName: 'korrath.character',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterData: {
      id: 'char_korrath',
      name: 'Korrath Steelhand',
      characterType: 'player_hero',
      avatarIcon: '🛡️',
      spriteWidth: 64,
      spriteHeight: 64,
      tintColor: '#06b6d4',
      baseScale: 1.0,
      capsule: { radius: 16, height: 44, offsetX: 0, offsetY: 2 },
      spritesheets: [{ id: 'sheet_default', name: 'Default Hero Sheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }],
      points: [
        { id: 'pt_eyes', name: 'Eyes (Sight Locus)', color: '#38bdf8', defaultOffsetX: 10, defaultOffsetY: -18 },
        { id: 'pt_ears', name: 'Ears (Acoustic Hearing)', color: '#a855f7', defaultOffsetX: 0, defaultOffsetY: -20 },
        { id: 'pt_torso', name: 'Torso Center (Hurtbox)', color: '#22c55e', defaultOffsetX: 0, defaultOffsetY: 0 },
        { id: 'pt_feet', name: 'Feet (Footstep Sound)', color: '#f59e0b', defaultOffsetX: 0, defaultOffsetY: 26 },
        { id: 'pt_weapon', name: 'Right Hand (Weapon Origin)', color: '#ef4444', defaultOffsetX: 18, defaultOffsetY: 2 }
      ],
      polygons: [
        {
          id: 'poly_body',
          name: 'Main Body Hurtbox',
          type: 'hurtbox',
          color: '#22c55e',
          defaultVertices: [{ x: -14, y: -24 }, { x: 14, y: -24 }, { x: 14, y: 24 }, { x: -14, y: 24 }]
        }
      ],
      animations: [
        { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_default', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
      ],
      sockets: []
    } as CharacterData
  };

  const char = currentFile.characterData;

  // Defaults
  const pointsList = char.points || [
    { id: 'pt_eyes', name: 'Eyes (Sight Locus)', color: '#38bdf8', defaultOffsetX: 10, defaultOffsetY: -18 },
    { id: 'pt_ears', name: 'Ears (Acoustic Hearing)', color: '#a855f7', defaultOffsetX: 0, defaultOffsetY: -20 },
    { id: 'pt_torso', name: 'Torso Center (Hurtbox)', color: '#22c55e', defaultOffsetX: 0, defaultOffsetY: 0 },
    { id: 'pt_feet', name: 'Feet (Footstep Sound)', color: '#f59e0b', defaultOffsetX: 0, defaultOffsetY: 26 },
    { id: 'pt_weapon', name: 'Right Hand (Weapon Origin)', color: '#ef4444', defaultOffsetX: 18, defaultOffsetY: 2 }
  ];

  const polygonsList = char.polygons || [
    {
      id: 'poly_body',
      name: 'Main Body Hurtbox',
      type: 'hurtbox',
      color: '#22c55e',
      defaultVertices: [{ x: -14, y: -24 }, { x: 14, y: -24 }, { x: 14, y: 24 }, { x: -14, y: 24 }]
    }
  ];

  const spritesheetsList = char.spritesheets || [
    { id: 'sheet_default', name: 'Default Hero Sheet', tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }
  ];

  const capsuleConfig: CharacterCapsuleConfig = char.capsule || { radius: 16, height: 44, offsetX: 0, offsetY: 2 };

  const currentAnim = char.animations?.find(a => a.stateId === selectedAnimStateId) || char.animations?.[0] || {
    stateId: 'idle',
    label: 'Idle Stance',
    spritesheetId: spritesheetsList[0]?.id || 'sheet_default',
    startFrameIndex: 0,
    endFrameIndex: 3,
    frameRateFps: 8,
    loop: true
  };

  const currentSpritesheet = spritesheetsList.find(s => s.id === currentAnim.spritesheetId) || spritesheetsList[0];

  // Active frame index logic
  const totalAnimFrames = Math.max(1, (currentAnim.endFrameIndex - currentAnim.startFrameIndex) + 1);
  const activeFrameIndex = currentAnim.startFrameIndex + (currentFrameOffset % totalAnimFrames);

  // Keyframe Data for active frame
  const activeKeyframe: FrameKeyframeData = (currentAnim.keyframes || []).find(k => k.frameIndex === activeFrameIndex) || {
    frameIndex: activeFrameIndex,
    points: pointsList.map(p => ({ pointId: p.id, enabled: true, x: p.defaultOffsetX, y: p.defaultOffsetY })),
    polygons: polygonsList.map(p => ({ polygonId: p.id, enabled: true, vertices: p.defaultVertices }))
  };

  // Effective Points & Polygons for active frame
  const effectivePoints = pointsList.map(p => {
    const kfPoint = activeKeyframe.points?.find(kp => kp.pointId === p.id);
    return {
      id: p.id,
      name: p.name,
      color: p.color || '#38bdf8',
      enabled: kfPoint ? kfPoint.enabled : true,
      x: kfPoint ? kfPoint.x : p.defaultOffsetX,
      y: kfPoint ? kfPoint.y : p.defaultOffsetY
    };
  });

  const effectivePolygons = polygonsList.map(p => {
    const kfPoly = activeKeyframe.polygons?.find(kp => kp.polygonId === p.id);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      color: p.color || '#22c55e',
      enabled: kfPoly ? kfPoly.enabled : true,
      vertices: kfPoly ? kfPoly.vertices : p.defaultVertices
    };
  });

  const updateCharacter = (updater: (prev: CharacterData) => CharacterData) => {
    onUpdateProject(p => {
      const existing = p.fileSystem.characters || [];
      const updated = existing.map(c => {
        if (c.fileName === currentFile.fileName) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            characterData: updater(c.characterData)
          };
        }
        return c;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, characters: updated }
      };
    });
  };

  // Frame Timer Playback Effect
  useEffect(() => {
    if (!isPlayingAnim) return;
    const fps = Math.max(1, currentAnim.frameRateFps || 8);
    const intervalMs = 1000 / fps;

    const timer = setInterval(() => {
      setCurrentFrameOffset(prev => (prev + 1) % totalAnimFrames);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlayingAnim, currentAnim.frameRateFps, totalAnimFrames]);

  // Keyframe Update Helper
  const updateKeyframeForCurrentFrame = (updater: (prevKf: FrameKeyframeData) => FrameKeyframeData) => {
    const anims = char.animations || [];
    const updatedAnims = anims.map(a => {
      if (a.stateId === currentAnim.stateId) {
        const keyframes = a.keyframes || [];
        const existingKfIndex = keyframes.findIndex(k => k.frameIndex === activeFrameIndex);
        
        let newKeyframe: FrameKeyframeData;
        if (existingKfIndex >= 0) {
          newKeyframe = updater(keyframes[existingKfIndex]);
        } else {
          newKeyframe = updater({
            frameIndex: activeFrameIndex,
            points: pointsList.map(p => ({ pointId: p.id, enabled: true, x: p.defaultOffsetX, y: p.defaultOffsetY })),
            polygons: polygonsList.map(p => ({ polygonId: p.id, enabled: true, vertices: p.defaultVertices }))
          });
        }

        const newKeyframes = existingKfIndex >= 0
          ? keyframes.map((k, i) => i === existingKfIndex ? newKeyframe : k)
          : [...keyframes, newKeyframe];

        return { ...a, keyframes: newKeyframes };
      }
      return a;
    });

    updateCharacter(c => ({ ...c, animations: updatedAnims }));
  };

  // Canvas Refs
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const spritesheetCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render Viewport Canvas (with Zoom, Pan, Dragging Handles, Capsule, Points, Polygons)
  useEffect(() => {
    const canvas = frameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2 + 10;

    ctx.clearRect(0, 0, w, h);

    // Save context for transform
    ctx.save();
    ctx.translate(centerX + panX, centerY + panY);
    ctx.scale(zoom, zoom);

    // 1. Grid Background in World Coords
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1 / zoom;
    const gridBounds = 300;
    for (let x = -gridBounds; x <= gridBounds; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, -gridBounds); ctx.lineTo(x, gridBounds); ctx.stroke();
    }
    for (let y = -gridBounds; y <= gridBounds; y += 20) {
      ctx.beginPath(); ctx.moveTo(-gridBounds, y); ctx.lineTo(gridBounds, y); ctx.stroke();
    }

    // Origin Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath(); ctx.moveTo(0, -gridBounds); ctx.lineTo(0, gridBounds); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-gridBounds, 0); ctx.lineTo(gridBounds, 0); ctx.stroke();

    // Ground Line
    const groundY = capsuleConfig.height / 2 + capsuleConfig.offsetY;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(-150, groundY);
    ctx.lineTo(150, groundY);
    ctx.stroke();

    // 2. Spritesheet Tile Frame Render
    if (showSprite) {
      const tileW = currentSpritesheet.tileWidth || 64;
      const tileH = currentSpritesheet.tileHeight || 64;

      if (currentSpritesheet.dataUrl) {
        const img = new Image();
        img.src = currentSpritesheet.dataUrl;
        if (img.complete) {
          const cols = currentSpritesheet.cols || 8;
          const col = activeFrameIndex % cols;
          const row = Math.floor(activeFrameIndex / cols);
          ctx.drawImage(
            img,
            col * tileW, row * tileH, tileW, tileH,
            -tileW / 2, -tileH / 2, tileW, tileH
          );
        }
      } else {
        // Procedural Sprite Silhouette
        ctx.fillStyle = char.tintColor || '#06b6d4';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.roundRect(-tileW / 3, -tileH / 2 + 6, tileW * 0.66, tileH * 0.85, 8);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();

        const bounce = Math.sin(activeFrameIndex * 0.8) * 3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -tileH / 3 + bounce, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Physics Capsule Render
    if (showCapsule) {
      const capX = capsuleConfig.offsetX;
      const capY = capsuleConfig.offsetY;
      const capR = capsuleConfig.radius;
      const capH = capsuleConfig.height;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.arc(capX, capY - capH / 2 + capR, capR, Math.PI, 0, false);
      ctx.lineTo(capX + capR, capY + capH / 2 - capR);
      ctx.arc(capX, capY + capH / 2 - capR, capR, 0, Math.PI, false);
      ctx.lineTo(capX - capR, capY - capH / 2 + capR);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(capX, capY, 3 / zoom, 0, Math.PI * 2); ctx.fill();
    }

    // 4. Polygon Hitboxes Render
    if (showPolygons) {
      effectivePolygons.forEach(poly => {
        if (!poly.enabled || hiddenPolygonIds.has(poly.id) || poly.vertices.length < 3) return;

        const isSelected = poly.id === selectedPolygonId;
        ctx.fillStyle = poly.type === 'hitbox' ? 'rgba(239, 68, 68, 0.25)' : poly.type === 'hurtbox' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(168, 85, 247, 0.25)';
        ctx.strokeStyle = poly.color || (poly.type === 'hitbox' ? '#ef4444' : '#22c55e');
        ctx.lineWidth = (isSelected ? 3 : 1.5) / zoom;

        ctx.beginPath();
        poly.vertices.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Polygon Vertices Handles
        poly.vertices.forEach((v, vIdx) => {
          const isVertSelected = isSelected && selectedVertexIdx === vIdx;
          ctx.fillStyle = isVertSelected ? '#ffffff' : poly.color || '#22c55e';
          ctx.beginPath();
          ctx.arc(v.x, v.y, (isVertSelected ? 6 : 4) / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();
        });
      });
    }

    // 5. Named Points / Sockets Handles Render
    if (showPoints) {
      effectivePoints.forEach(pt => {
        if (!pt.enabled || hiddenPointIds.has(pt.id)) return;

        const isSelected = pt.id === selectedPointId;

        // Connector line to origin
        ctx.strokeStyle = pt.color || '#38bdf8';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([2 / zoom, 2 / zoom]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(pt.x, pt.y); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = pt.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (isSelected ? 8 : 5) / zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : '#000000';
        ctx.lineWidth = (isSelected ? 2.5 : 1.5) / zoom;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(9, Math.round(11 / zoom))}px monospace`;
        ctx.fillText(pt.name, pt.x + 8 / zoom, pt.y + 3 / zoom);
      });
    }

    ctx.restore();

  }, [char, activeFrameIndex, effectivePoints, effectivePolygons, capsuleConfig, selectedPointId, selectedPolygonId, selectedVertexIdx, currentSpritesheet, zoom, panX, panY, showCapsule, showPoints, showPolygons, showSprite, hiddenPointIds, hiddenPolygonIds]);

  // Render Spritesheet Canvas Grid Overlay
  useEffect(() => {
    const canvas = spritesheetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const tileW = currentSpritesheet.tileWidth || 64;
    const tileH = currentSpritesheet.tileHeight || 64;
    const cols = currentSpritesheet.cols || 8;
    const rows = currentSpritesheet.rows || 4;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (currentSpritesheet.dataUrl) {
      const img = new Image();
      img.src = currentSpritesheet.dataUrl;
      if (img.complete) {
        ctx.drawImage(img, 0, 0, cols * tileW, rows * tileH);
      }
    }

    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const frameIdx = r * cols + c;
        const x = c * tileW;
        const y = r * tileH;

        const isCurrentActive = frameIdx === activeFrameIndex;
        const isInAnimRange = frameIdx >= currentAnim.startFrameIndex && frameIdx <= currentAnim.endFrameIndex;

        ctx.strokeStyle = isCurrentActive ? '#38bdf8' : isInAnimRange ? 'rgba(16, 185, 129, 0.8)' : '#334155';
        ctx.lineWidth = isCurrentActive ? 2.5 : isInAnimRange ? 1.5 : 0.8;
        ctx.strokeRect(x, y, tileW, tileH);

        if (isCurrentActive) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fillRect(x, y, tileW, tileH);
        } else if (isInAnimRange) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
          ctx.fillRect(x, y, tileW, tileH);
        }

        // Frame Number Badge
        ctx.fillStyle = isCurrentActive ? '#0284c7' : isInAnimRange ? '#059669' : '#1e293b';
        ctx.fillRect(x + 2, y + 2, 22, 14);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x + 2, y + 2, 22, 14);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${frameIdx}`, x + 5, y + 12);
      }
    }

  }, [currentSpritesheet, activeFrameIndex, currentAnim]);

  // Mouse Down Drag Handler on Frame Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = frameCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2 + 10;

    // Convert screen mouse to world coordinates relative to character center
    const worldX = (mouseX - (centerX + panX)) / zoom;
    const worldY = (mouseY - (centerY + panY)) / zoom;

    // Pan with Middle Click or Alt / Space key
    if (e.button === 1 || e.altKey || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    // 1. Check Points Hit
    if (showPoints) {
      for (const pt of effectivePoints) {
        if (!pt.enabled || hiddenPointIds.has(pt.id)) continue;
        const dx = worldX - pt.x;
        const dy = worldY - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 10 / zoom) {
          setSelectedPointId(pt.id);
          setDragTarget({ type: 'point', id: pt.id });
          return;
        }
      }
    }

    // 2. Check Polygon Vertices Hit
    if (showPolygons) {
      for (const poly of effectivePolygons) {
        if (!poly.enabled || hiddenPolygonIds.has(poly.id)) continue;
        for (let vIdx = 0; vIdx < poly.vertices.length; vIdx++) {
          const v = poly.vertices[vIdx];
          const dx = worldX - v.x;
          const dy = worldY - v.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 8 / zoom) {
            setSelectedPolygonId(poly.id);
            setSelectedVertexIdx(vIdx);
            setDragTarget({ type: 'poly_vertex', id: poly.id, vertexIndex: vIdx });
            return;
          }
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (!dragTarget) return;

    const canvas = frameCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2 + 10;

    const worldX = Math.round((mouseX - (centerX + panX)) / zoom);
    const worldY = Math.round((mouseY - (centerY + panY)) / zoom);

    // Update keyframe live as dragged!
    if (dragTarget.type === 'point') {
      updateKeyframeForCurrentFrame(prevKf => ({
        ...prevKf,
        points: prevKf.points.map(p => p.pointId === dragTarget.id ? { ...p, x: worldX, y: worldY } : p)
      }));
    } else if (dragTarget.type === 'poly_vertex' && dragTarget.vertexIndex !== undefined) {
      updateKeyframeForCurrentFrame(prevKf => ({
        ...prevKf,
        polygons: prevKf.polygons.map(p => {
          if (p.polygonId === dragTarget.id) {
            const updatedVerts = p.vertices.map((v, i) => i === dragTarget.vertexIndex ? { x: worldX, y: worldY } : v);
            return { ...p, vertices: updatedVerts };
          }
          return p;
        })
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setDragTarget(null);
    setIsPanning(false);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(5.0, Math.max(0.5, prev * zoomFactor)));
  };

  // Spritesheet Upload Helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const tileWidth = 64;
        const tileHeight = 64;
        const cols = Math.max(1, Math.floor(width / tileWidth));
        const rows = Math.max(1, Math.floor(height / tileHeight));

        updateCharacter(c => {
          const sheets = c.spritesheets || [];
          const sheetToUpdate = currentSpritesheet.id;
          const updatedSheets = sheets.map(s => {
            if (s.id === sheetToUpdate) {
              return {
                ...s,
                dataUrl,
                tileWidth,
                tileHeight,
                cols,
                rows,
                totalFrames: cols * rows
              };
            }
            return s;
          });
          return { ...c, spritesheets: updatedSheets };
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      <FileSubfolderHeader
        subfolderName="characters"
        extension=".character"
        files={charFiles.map(c => ({
          id: c.id,
          name: c.name,
          fileName: c.fileName,
          updatedAt: c.updatedAt
        }))}
        activeFileName={currentFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.character`;
          const newChar: CharacterFile = {
            id: `char_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            characterData: {
              id: `char_${Date.now()}`,
              name,
              characterType: 'player_hero',
              avatarIcon: '🛡️',
              spriteWidth: 64,
              spriteHeight: 64,
              tintColor: '#06b6d4',
              baseScale: 1.0,
              capsule: { radius: 16, height: 44, offsetX: 0, offsetY: 2 },
              spritesheets: [{ id: `sheet_${Date.now()}`, name: `${name} Sheet`, tileWidth: 64, tileHeight: 64, cols: 8, rows: 4, totalFrames: 32 }],
              points: [
                { id: 'pt_eyes', name: 'Eyes (Sight Locus)', color: '#38bdf8', defaultOffsetX: 10, defaultOffsetY: -18 },
                { id: 'pt_weapon', name: 'Right Hand Weapon', color: '#ef4444', defaultOffsetX: 18, defaultOffsetY: 2 }
              ],
              polygons: [],
              animations: [
                { stateId: 'idle', label: 'Idle Stance', spritesheetId: `sheet_${Date.now()}`, startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
              ],
              sockets: []
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: safeName },
            fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), newChar] }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = charFiles.find(c => c.fileName === fName);
          if (!target) return;
          const dupeFileName = `${target.fileName.replace('.character', '')}_copy.character`;
          const dupe: CharacterFile = {
            ...target,
            id: `char_${Date.now()}`,
            name: `${target.name} (Copy)`,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, characterFileName: dupeFileName },
            fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), dupe] }
          }));
        }}
        onSaveFile={() => {}}
        onExportFile={(fName) => {
          const target = charFiles.find(c => c.fileName === fName);
          if (target) {
            const jsonStr = JSON.stringify(target, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = target.fileName;
            a.click();
          }
        }}
        onDeleteFile={(fName) => {
          onUpdateProject(p => {
            const filtered = (p.fileSystem.characters || []).filter(c => c.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, characterFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, characters: filtered }
            };
          });
        }}
        accentColor="indigo"
      />

      {/* Main Inspector Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* Hero Title Banner */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border-2 border-cyan-500/50 flex items-center justify-center text-2xl shadow-lg shrink-0">
              {char.avatarIcon || '🛡️'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => updateCharacter(c => ({ ...c, name: e.target.value }))}
                  className="font-black text-lg text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-cyan-500 outline-none"
                />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-cyan-400 border border-neutral-800">
                  {currentFile.fileName}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                <span>Class: <strong className="text-cyan-300 capitalize">{char.characterType.replace('_', ' ')}</strong></span>
                <span>• Spritesheets: <strong className="text-white">{spritesheetsList.length}</strong></span>
                <span>• Points: <strong className="text-white">{pointsList.length}</strong></span>
                <span>• Polygons: <strong className="text-white">{polygonsList.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={char.characterType}
              onChange={(e) => updateCharacter(c => ({ ...c, characterType: e.target.value as any }))}
              className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white capitalize font-bold outline-none"
            >
              <option value="player_hero">⚡ Player Hero</option>
              <option value="enemy_mob">👹 Creep Mob</option>
              <option value="boss_archon">👑 Boss Archon</option>
              <option value="friendly_npc">💬 Friendly NPC</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation bar: Animation Studio is DEFAULT */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => setActiveTab('animation_studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'animation_studio' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Play size={15} />
            <span>Animation Studio Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spritesheet_manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'spritesheet_manager' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Grid size={15} />
            <span>Spritesheet Manager & Grid Config ({spritesheetsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('behavior_linkage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'behavior_linkage' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Brain size={15} />
            <span>Behavior Linkage</span>
          </button>
        </div>

        {/* TAB 1: ALL-IN-ONE ANIMATION STUDIO WORKSPACE */}
        {activeTab === 'animation_studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDEBAR (Cols 3): Animation States & Capsule Config */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Animation States List */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play size={14} />
                    Animation States
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const stateId = prompt('Enter animation state ID (e.g. roll, attack_heavy, skill_1):');
                      if (!stateId) return;
                      const newAnim: CharacterAnimationConfig = {
                        stateId: stateId.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                        label: `${stateId} Anim`,
                        spritesheetId: currentSpritesheet.id,
                        startFrameIndex: 0,
                        endFrameIndex: 3,
                        frameRateFps: 10,
                        loop: true
                      };
                      updateCharacter(c => ({ ...c, animations: [...(c.animations || []), newAnim] }));
                      setSelectedAnimStateId(newAnim.stateId);
                    }}
                    className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(char.animations || []).map((anim) => (
                    <div
                      key={anim.stateId}
                      onClick={() => {
                        setSelectedAnimStateId(anim.stateId);
                        setCurrentFrameOffset(0);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                        selectedAnimStateId === anim.stateId
                          ? 'bg-cyan-600 text-white shadow'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      <span className="capitalize">{anim.label}</span>
                      <span className="font-mono text-[9px] opacity-75">{anim.startFrameIndex}-{anim.endFrameIndex}</span>
                    </div>
                  ))}
                </div>

                {/* Animation Config Fields */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Start Frame</label>
                      <input
                        type="number"
                        value={currentAnim.startFrameIndex}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map(a => a.stateId === currentAnim.stateId ? { ...a, startFrameIndex: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Stop Frame</label>
                      <input
                        type="number"
                        value={currentAnim.endFrameIndex}
                        onChange={(e) => {
                          const val = Math.max(currentAnim.startFrameIndex, parseInt(e.target.value) || 0);
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map(a => a.stateId === currentAnim.stateId ? { ...a, endFrameIndex: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Framerate (FPS)</label>
                      <input
                        type="number"
                        value={currentAnim.frameRateFps}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 8);
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map(a => a.stateId === currentAnim.stateId ? { ...a, frameRateFps: val } : a)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-[9px] text-neutral-400 font-bold">Loop</span>
                      <input
                        type="checkbox"
                        checked={currentAnim.loop}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateCharacter(c => ({
                            ...c,
                            animations: c.animations.map(a => a.stateId === currentAnim.stateId ? { ...a, loop: val } : a)
                          }));
                        }}
                        className="accent-cyan-500 w-3.5 h-3.5 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Physics Capsule Config */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} />
                  Player Capsule Collider
                </span>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Radius (px)</label>
                      <input
                        type="number"
                        value={capsuleConfig.radius}
                        onChange={(e) => {
                          const val = Math.max(4, parseInt(e.target.value) || 16);
                          updateCharacter(c => ({ ...c, capsule: { ...capsuleConfig, radius: val } }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Height (px)</label>
                      <input
                        type="number"
                        value={capsuleConfig.height}
                        onChange={(e) => {
                          const val = Math.max(8, parseInt(e.target.value) || 44);
                          updateCharacter(c => ({ ...c, capsule: { ...capsuleConfig, height: val } }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Offset X</label>
                      <input
                        type="number"
                        value={capsuleConfig.offsetX}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateCharacter(c => ({ ...c, capsule: { ...capsuleConfig, offsetX: val } }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block">Offset Y</label>
                      <input
                        type="number"
                        value={capsuleConfig.offsetY}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateCharacter(c => ({ ...c, capsule: { ...capsuleConfig, offsetY: val } }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* CENTER VIEWPORT CANVAS (Cols 6): Interactive Drag, Pan, Zoom, Layers */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                
                {/* Viewport Top Header & Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Maximize2 size={14} className="text-cyan-400" />
                      Frame #{activeFrameIndex} Viewport
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-cyan-400 border border-neutral-800">
                      Zoom: {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1"
                    >
                      {isPlayingAnim ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingAnim ? 'Pause' : 'Play'}</span>
                    </button>
                  </div>
                </div>

                {/* Viewport Layer Toggles & Zoom Toolbar */}
                <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSprite(!showSprite)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${showSprite ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700' : 'bg-neutral-900 text-neutral-500'}`}
                    >
                      {showSprite ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>Sprite</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCapsule(!showCapsule)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${showCapsule ? 'bg-sky-900/60 text-sky-300 border border-sky-700' : 'bg-neutral-900 text-neutral-500'}`}
                    >
                      {showCapsule ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>Capsule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPoints(!showPoints)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${showPoints ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700' : 'bg-neutral-900 text-neutral-500'}`}
                    >
                      {showPoints ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>Points</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPolygons(!showPolygons)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${showPolygons ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-neutral-900 text-neutral-500'}`}
                    >
                      {showPolygons ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>Polygons</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.min(5.0, z + 0.25))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setZoom(2.0); setPanX(0); setPanY(0); }}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                      title="Reset Viewport"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                {/* Interactive Canvas */}
                <div className="w-full h-80 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden relative cursor-crosshair">
                  <canvas
                    ref={frameCanvasRef}
                    width={512}
                    height={320}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onWheel={handleCanvasWheel}
                    className="w-full h-full block"
                  />

                  <div className="absolute bottom-2 left-2 bg-neutral-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-neutral-800 text-[9px] text-neutral-400 font-mono">
                    💡 Click & Drag points or polygon vertices on canvas | Middle-click / Alt+Drag to Pan
                  </div>
                </div>

                {/* Animation Scrub Bar */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-3">
                  <span className="text-[10px] font-mono text-neutral-400 whitespace-nowrap">
                    Frame {currentFrameOffset + 1} / {totalAnimFrames} (Grid #{activeFrameIndex})
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, totalAnimFrames - 1)}
                    value={currentFrameOffset}
                    onChange={(e) => {
                      setIsPlayingAnim(false);
                      setCurrentFrameOffset(parseInt(e.target.value));
                    }}
                    className="flex-1 accent-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Snapshot all points and polygons explicitly into keyframe
                      updateKeyframeForCurrentFrame(prevKf => prevKf);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                    title="Keyframe All Items on Active Frame"
                  >
                    <Key size={11} />
                    <span>Keyframe All</span>
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT SIDEBAR (Cols 3): Unified Points & Polygons Per-Frame List */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Named Points List (No X/Y clutter as requested!) */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Circle size={13} />
                    Named Points ({pointsList.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const ptName = prompt('Name for new point anchor (e.g. Shield Center, Sword Tip):');
                      if (!ptName) return;
                      const newPt: CharacterNamedPoint = {
                        id: `pt_${Date.now()}`,
                        name: ptName,
                        color: '#38bdf8',
                        defaultOffsetX: 10,
                        defaultOffsetY: 0
                      };
                      updateCharacter(c => ({ ...c, points: [...(c.points || []), newPt] }));
                    }}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {effectivePoints.map((pt) => {
                    const isHidden = hiddenPointIds.has(pt.id);
                    const isSelected = pt.id === selectedPointId;

                    return (
                      <div
                        key={pt.id}
                        onClick={() => setSelectedPointId(pt.id)}
                        className={`p-2 rounded-xl text-xs flex items-center justify-between border cursor-pointer transition ${
                          isSelected ? 'bg-indigo-950/80 border-indigo-500' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHiddenPointIds(prev => {
                                const next = new Set(prev);
                                if (next.has(pt.id)) next.delete(pt.id);
                                else next.add(pt.id);
                                return next;
                              });
                            }}
                            className="p-0.5 text-neutral-400 hover:text-white"
                          >
                            {isHidden ? <EyeOff size={13} className="text-neutral-600" /> : <Eye size={13} className="text-indigo-400" />}
                          </button>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                          <span className="font-bold text-neutral-200 truncate">{pt.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateKeyframeForCurrentFrame(prevKf => ({
                                ...prevKf,
                                points: prevKf.points.map(p => p.pointId === pt.id ? { ...p, x: pt.x, y: pt.y } : p)
                              }));
                            }}
                            className="p-1 text-neutral-400 hover:text-cyan-400"
                            title="Set Keyframe on Current Frame"
                          >
                            <Key size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem({
                                type: 'point',
                                id: pt.id,
                                name: pt.name,
                                color: pt.color
                              });
                            }}
                            className="p-1 text-neutral-400 hover:text-white"
                            title="Edit Point"
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCharacter(c => ({ ...c, points: c.points?.filter(p => p.id !== pt.id) }));
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400"
                            title="Delete Point"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hitbox Polygons List & Per-Frame Vertex Modifier */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Pentagon size={13} />
                    Hit Polygons ({polygonsList.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const polyName = prompt('Name for new hitbox polygon (e.g. Shield Defense, Spear Thrust):');
                      if (!polyName) return;
                      const newPoly: CharacterNamedPolygon = {
                        id: `poly_${Date.now()}`,
                        name: polyName,
                        type: 'hurtbox',
                        color: '#22c55e',
                        defaultVertices: [
                          { x: -15, y: -20 },
                          { x: 15, y: -20 },
                          { x: 15, y: 20 },
                          { x: -15, y: 20 }
                        ]
                      };
                      updateCharacter(c => ({ ...c, polygons: [...(c.polygons || []), newPoly] }));
                    }}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {effectivePolygons.map((poly) => {
                    const isHidden = hiddenPolygonIds.has(poly.id);
                    const isSelected = poly.id === selectedPolygonId;

                    return (
                      <div
                        key={poly.id}
                        onClick={() => setSelectedPolygonId(poly.id)}
                        className={`p-2.5 rounded-xl text-xs space-y-2 border cursor-pointer transition ${
                          isSelected ? 'bg-emerald-950/80 border-emerald-500' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHiddenPolygonIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(poly.id)) next.delete(poly.id);
                                  else next.add(poly.id);
                                  return next;
                                });
                              }}
                              className="p-0.5 text-neutral-400 hover:text-white"
                            >
                              {isHidden ? <EyeOff size={13} className="text-neutral-600" /> : <Eye size={13} className="text-emerald-400" />}
                            </button>
                            <span className="font-bold text-neutral-200 truncate">{poly.name}</span>
                          </div>

                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 text-emerald-400">
                            {poly.type} ({poly.vertices.length} verts)
                          </span>
                        </div>

                        {/* Per-Frame Vertices Modifier Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add vertex to polygon on current frame
                                const last = poly.vertices[poly.vertices.length - 1] || { x: 0, y: 0 };
                                const newVerts = [...poly.vertices, { x: last.x + 10, y: last.y + 10 }];
                                updateKeyframeForCurrentFrame(prevKf => ({
                                  ...prevKf,
                                  polygons: prevKf.polygons.map(p => p.polygonId === poly.id ? { ...p, vertices: newVerts } : p)
                                }));
                              }}
                              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 font-bold flex items-center gap-1"
                            >
                              <Plus size={10} />
                              <span>Add Vert</span>
                            </button>

                            {poly.vertices.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Remove last vertex
                                  const newVerts = poly.vertices.slice(0, -1);
                                  updateKeyframeForCurrentFrame(prevKf => ({
                                    ...prevKf,
                                    polygons: prevKf.polygons.map(p => p.polygonId === poly.id ? { ...p, vertices: newVerts } : p)
                                  }));
                                }}
                                className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-red-400 font-bold flex items-center gap-1"
                              >
                                <Trash2 size={10} />
                                <span>Remove Vert</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateKeyframeForCurrentFrame(prevKf => ({
                                  ...prevKf,
                                  polygons: prevKf.polygons.map(p => p.polygonId === poly.id ? { ...p, vertices: poly.vertices } : p)
                                }));
                              }}
                              className="p-1 text-neutral-400 hover:text-cyan-400"
                              title="Set Keyframe"
                            >
                              <Key size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({
                                  type: 'polygon',
                                  id: poly.id,
                                  name: poly.name,
                                  color: poly.color,
                                  polyType: poly.type
                                });
                              }}
                              className="p-1 text-neutral-400 hover:text-white"
                              title="Edit Polygon"
                            >
                              <Edit3 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCharacter(c => ({ ...c, polygons: c.polygons?.filter(p => p.id !== poly.id) }));
                              }}
                              className="p-1 text-neutral-500 hover:text-red-400"
                              title="Delete Polygon"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: SPRITESHEET MANAGER & NUMBERED GRID */}
        {activeTab === 'spritesheet_manager' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Grid size={16} />
                  Spritesheet Grid Manager
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Upload custom PNG spritesheets and configure grid tile dimensions, columns, and total frame counts.
                </p>
              </div>

              <label className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer">
                <Upload size={14} />
                <span>Upload PNG Spritesheet</span>
                <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sheet Config Card */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4 text-xs">
                <span className="font-bold text-neutral-200 block border-b border-neutral-900 pb-2">Active Sheet Settings: {currentSpritesheet.name}</span>

                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block">Spritesheet Name</label>
                  <input
                    type="text"
                    value={currentSpritesheet.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCharacter(c => ({
                        ...c,
                        spritesheets: c.spritesheets?.map(s => s.id === currentSpritesheet.id ? { ...s, name: val } : s)
                      }));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Tile Width (px)</label>
                    <input
                      type="number"
                      value={currentSpritesheet.tileWidth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 64;
                        updateCharacter(c => ({
                          ...c,
                          spritesheets: c.spritesheets?.map(s => s.id === currentSpritesheet.id ? { ...s, tileWidth: val } : s)
                        }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Tile Height (px)</label>
                    <input
                      type="number"
                      value={currentSpritesheet.tileHeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 64;
                        updateCharacter(c => ({
                          ...c,
                          spritesheets: c.spritesheets?.map(s => s.id === currentSpritesheet.id ? { ...s, tileHeight: val } : s)
                        }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Grid Columns</label>
                    <input
                      type="number"
                      value={currentSpritesheet.cols}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 8;
                        updateCharacter(c => ({
                          ...c,
                          spritesheets: c.spritesheets?.map(s => s.id === currentSpritesheet.id ? { ...s, cols: val, totalFrames: val * s.rows } : s)
                        }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block">Grid Rows</label>
                    <input
                      type="number"
                      value={currentSpritesheet.rows}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 4;
                        updateCharacter(c => ({
                          ...c,
                          spritesheets: c.spritesheets?.map(s => s.id === currentSpritesheet.id ? { ...s, rows: val, totalFrames: s.cols * val } : s)
                        }));
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-white font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Numbered Grid Preview */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <span className="font-bold text-neutral-200 block text-xs">Numbered Grid Cell Preview Canvas</span>
                <div className="w-full h-56 bg-neutral-900 border border-neutral-800 rounded-xl overflow-auto p-2 flex items-center justify-center">
                  <canvas ref={spritesheetCanvasRef} width={Math.max(384, currentSpritesheet.cols * currentSpritesheet.tileWidth)} height={Math.max(128, currentSpritesheet.rows * currentSpritesheet.tileHeight)} className="block" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: BEHAVIOR LINKAGE */}
        {activeTab === 'behavior_linkage' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Brain size={16} />
              Behavior Script Assignment
            </h3>

            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs">
              <label className="text-neutral-400 font-bold block">Assigned Behavior Script File</label>
              <select
                value={char.assignedBehaviorFileName || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCharacter(c => ({ ...c, assignedBehaviorFileName: val }));
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white font-mono"
              >
                <option value="">-- No Behavior File Assigned --</option>
                {(project.fileSystem.behaviors || []).map(b => (
                  <option key={b.fileName} value={b.fileName}>{b.name} ({b.fileName})</option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>

      {/* EDIT ITEM MODAL FOR POINTS & POLYGONS */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 size={15} className="text-cyan-400" />
                Edit {editingItem.type === 'point' ? 'Named Point' : 'Hitbox Polygon'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 font-bold block">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-bold block">Color</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={editingItem.color}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={editingItem.color}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {editingItem.type === 'polygon' && (
                <div>
                  <label className="text-neutral-400 font-bold block">Polygon Classification Type</label>
                  <select
                    value={editingItem.polyType || 'hurtbox'}
                    onChange={(e) => setEditingItem({ ...editingItem, polyType: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white capitalize font-mono mt-1"
                  >
                    <option value="hurtbox">🟢 Hurtbox (Takes Damage)</option>
                    <option value="hitbox">🔴 Hitbox (Deals Attack Damage)</option>
                    <option value="shield">🟣 Shield (Blocks Incoming Damage)</option>
                    <option value="trigger">🟡 Trigger Zone (Detects Proximity)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingItem.type === 'point') {
                    updateCharacter(c => ({
                      ...c,
                      points: c.points?.map(p => p.id === editingItem.id ? { ...p, name: editingItem.name, color: editingItem.color } : p)
                    }));
                  } else {
                    updateCharacter(c => ({
                      ...c,
                      polygons: c.polygons?.map(p => p.id === editingItem.id ? {
                        ...p,
                        name: editingItem.name,
                        color: editingItem.color,
                        type: editingItem.polyType || p.type
                      } : p)
                    }));
                  }
                  setEditingItem(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
