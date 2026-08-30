import { ParticleEngine } from "../engine/ParticleEngine";

// Super Cover Line Algorithm (Orthogonal Line Interpolation) for smooth gapless painting
function getInterpolatedLineTiles(x0: number, y0: number, x1: number, y1: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let curX = x0;
  let curY = y0;

  while (true) {
    points.push({ x: curX, y: curY });
    if (curX === x1 && curY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy && e2 < dx) {
      // Add orthogonal step to eliminate diagonal gaps in tile brushes
      points.push({ x: curX + sx, y: curY });
      err -= dy;
      curX += sx;
      err += dx;
      curY += sy;
    } else if (e2 > -dy) {
      err -= dy;
      curX += sx;
    } else if (e2 < dx) {
      err += dx;
      curY += sy;
    }
  }
  return points;
}

// Calculate exact tile coordinates affected by the active brush size/tool
function getBrushTiles(px: number, py: number, brushSize: number = 1, activeTool?: ToolType | string): Array<{ x: number; y: number }> {
  if (activeTool === 'chunk_add' || activeTool === 'chunk_delete') {
    const chunkX = Math.floor(px / CHUNK_SIZE);
    const chunkY = Math.floor(py / CHUNK_SIZE);
    const tiles: Array<{ x: number; y: number }> = [];
    for (let cy = 0; cy < CHUNK_SIZE; cy++) {
      for (let cx = 0; cx < CHUNK_SIZE; cx++) {
        tiles.push({ x: chunkX * CHUNK_SIZE + cx, y: chunkY * CHUNK_SIZE + cy });
      }
    }
    return tiles;
  }

  const tiles: Array<{ x: number; y: number }> = [];
  const minX = px - Math.floor((brushSize - 1) / 2);
  const maxX = px + Math.ceil((brushSize - 1) / 2);
  const minY = py - Math.floor((brushSize - 1) / 2);
  const maxY = py + Math.ceil((brushSize - 1) / 2);

  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (brushSize > 2 && ((cx - px) * (cx - px) + (cy - py) * (cy - py) > (brushSize / 2) * (brushSize / 2) + 1)) {
        continue;
      }
      tiles.push({ x: cx, y: cy });
    }
  }
  return tiles;
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefinedMapData, RefinedCellState, ToolType, ModeType } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { getTileSurfaceHeightAt, buildTileShapePath, TileShape, TILE_SHAPE_DEFINITIONS } from '../engine/tileShape';
import { resolveAutoTileShape } from '../engine/autoTileSlopeSolver';
import { PrefabData, BehaviorData, InputMapping, UIConfigData, UNIFIED_INPUT_TEMPLATE, ensureUIConfigDefaults } from '../engine/masonProjectSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { getCell, calculateMapBounds, CHUNK_SIZE, getChunkCoords, getChunkKey } from '../engine/mapChunkHelper';
import { getMergedPolygonColliders, invalidateMergedColliders } from '../utils/colliderMerger';
import { useMasonViewport, ViewportHUD, ViewportCanvasContainer } from './shared/viewport';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Layers, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Compass, 
  Grid, 
  Play, 
  Square, 
  Sparkles, 
  Shield, 
  Heart, 
  Zap, 
  Crosshair, 
  MapPin, 
  Activity,
  Flame,
  Cpu,
  Bookmark,
  Undo2,
  Redo2
} from 'lucide-react';

interface RefinedMapCanvasProps {
  particleSystems?: any[];
  prefabs?: any[];
  mapData: RefinedMapData;
  biomes: RefinedBiome[];
  activeBiome: RefinedBiome;
  onTileInteract: (x: number, y: number, points?: Array<{ x: number; y: number }>) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
  setShowGrid?: React.Dispatch<React.SetStateAction<boolean>>;
  showDamageMasks?: boolean;
  isLitMode?: boolean;
  brushSize?: number;
  activeTool?: ToolType;
  mode?: ModeType;
  setMode?: (mode: ModeType) => void;
  testCharacter?: PrefabData;
  linkedBehavior?: BehaviorData;
  spawnPoint?: { x: number; y: number; facing?: 'left' | 'right' };
  onSetSpawnPoint?: (x: number, y: number) => void;
  onExitPlayMode?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  inputMappings?: InputMapping[];
  uiTheme?: UIConfigData;
}

export const RefinedMapCanvas: React.FC<RefinedMapCanvasProps> = ({
  particleSystems = [],
  prefabs = [],
  mapData,
  biomes,
  activeBiome,
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true,
  setShowGrid,
  showDamageMasks = true,
  isLitMode = false,
  brushSize = 1,
  activeTool = 'brush',
  mode = 'paint',
  setMode,
  testCharacter,
  linkedBehavior,
  spawnPoint = { x: 4, y: 12, facing: 'right' },
  onSetSpawnPoint,
  onExitPlayMode,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  inputMappings = [],
  uiTheme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine());
  const [showParallaxBg, setShowParallaxBg] = useState<boolean>(true);
  const [showForegroundLayer, setShowForegroundLayer] = useState<boolean>(true);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [showColliders, setShowColliders] = useState<boolean>(false);
  const [, setRenderTrigger] = useState(0);


  // Set up particle emitters when entering play mode
  useEffect(() => {
    if (mode === 'play') {
      particleEngineRef.current.clearEmitters();
      particleEngineRef.current.particles = [];
      
      // Look for props/actors that have attached particles
      if (mapData && prefabs && particleSystems) {
        for (let y = 0; y < mapData.height; y++) {
          for (let x = 0; x < mapData.width; x++) {
            const cell = mapData.cells?.[y]?.[x];
            
            // Check prefab_id
            if (cell?.prefab_id) {
              const prefab = prefabs.find(c => c.id === cell.prefab_id);
              if (prefab) {
                // 1. Composite Prefab Parts (New Hierarchy)
                if (prefab.parts && Array.isArray(prefab.parts)) {
                  for (const part of prefab.parts) {
                    if (part.visible !== false && part.type === 'particle') {
                      const particlePart = part as any;
                      const system = particleSystems.find(ps => ps.id === particlePart.particleSystemId || ps.id === particlePart.particleFile);
                      if (system) {
                        const originX = x * 64 + 32 + (particlePart.offsetX || 0);
                        const originY = y * 64 + 32 + (particlePart.offsetY || 0);
                        particleEngineRef.current.addEmitter(system, originX, originY);
                      }
                    }
                  }
                }

                // 2. Legacy attachedParticles (Backward Compatibility)
                if (prefab.attachedParticles) {
                  for (const attachment of prefab.attachedParticles) {
                    const system = particleSystems.find(ps => ps.id === attachment.particleSystemId);
                    if (system) {
                      const originX = x * 64 + 32 + (attachment.offsetX || 0);
                      const originY = y * 64 + 32 + (attachment.offsetY || 0);
                      particleEngineRef.current.addEmitter(system, originX, originY);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [mode, mapData, prefabs, particleSystems]);

  // Exact prefab configuration
  // derivation strictly from testCharacter and linkedBehavior
  const charConfig = useMemo(() => {
    // 1. Dimensions & Capsule from Prefab File
    const rawRad = testCharacter?.capsule?.radius;
    const rawH = testCharacter?.capsule?.height;
    const radius = (rawRad !== undefined && rawRad > 0) ? rawRad : (testCharacter?.spriteWidth ? Math.min(14, testCharacter.spriteWidth / 4) : 16);
    const height = (rawH !== undefined && rawH > 0) ? rawH : (testCharacter?.spriteHeight ? Math.min(48, testCharacter.spriteHeight * 0.75) : 44);
    const offsetX = testCharacter?.capsule?.offsetX ?? 0;
    const offsetY = testCharacter?.capsule?.offsetY ?? 0;
    
    // 2. Health, Mana, Stamina from Prefab BaseStats
    const maxHp = testCharacter?.baseStats?.health ?? 100;
    const maxMp = testCharacter?.baseStats?.energy ?? 100;
    const maxSp = testCharacter?.baseStats?.stamina ?? 100;

    // 3. Movement & Kinematics — Strictly driven by configured Prefab Kinematics / Behavior Rules
    const behMov = linkedBehavior?.movement || testCharacter?.movement;
    const heroInp = linkedBehavior?.heroInput;

    // Movement speed: strictly from configured movement. If not configured, 0.
    const rawMoveSpeed = testCharacter?.movement?.moveSpeed ?? linkedBehavior?.movement?.moveSpeed;
    const baseSpeed = (rawMoveSpeed !== undefined && rawMoveSpeed > 0) ? rawMoveSpeed : 0;
    const accel = (testCharacter?.movement?.acceleration ?? behMov?.acceleration ?? 0.8) * (baseSpeed > 0 ? baseSpeed : 4.0);
    const gravScale = behMov?.gravityScale !== undefined ? behMov.gravityScale : (testCharacter?.movement?.gravityScale ?? 1.0);
    const airCtrl = heroInp?.airControlPercent !== undefined 
      ? heroInp.airControlPercent / 100 
      : (behMov?.airControl !== undefined ? behMov.airControl : (testCharacter?.movement?.airControl ?? 0.85));

    // 4. Jump & Air Jumps — Strictly from configured movement. If not configured, 0 / disabled.
    const rawJumpForce = testCharacter?.movement?.jumpForce ?? linkedBehavior?.movement?.jumpForce;
    const jumpForce = (rawJumpForce !== undefined && rawJumpForce > 0) ? rawJumpForce : 0;
    const canJump = jumpForce > 0 || (testCharacter as any)?.canJump === true;
    const maxAirJumps = heroInp?.maxAirJumps ?? 0;
    const totalJumps = canJump ? (1 + maxAirJumps) : 0;

    // 5. Dash — Strictly from behavior hero input or charge_dash movement type
    const hasDash = !!(
      heroInp?.dashCooldownMs !== undefined || 
      behMov?.movementType === 'charge_dash' || 
      (testCharacter as any)?.hasDash === true
    );
    const allowAirDash = !!(heroInp?.allowAirDash);
    const dashCooldownFrames = heroInp?.dashCooldownMs ? Math.round(heroInp.dashCooldownMs / 16.66) : 36;
    const dashSpeed = (heroInp?.dashSpeedMultiplier ?? 2.2) * (baseSpeed > 0 ? baseSpeed * 1.5 : 8);
    const dashDurationFrames = heroInp?.dashIFrameMs ? Math.max(4, Math.round(heroInp.dashIFrameMs / 25)) : 8;

    // 6. Wall Cling & Wall Jump — Strictly from behavior hero input / wall_clinger movement type
    const hasWallCling = !!(
      (heroInp?.wallClingFriction !== undefined && heroInp.wallClingFriction > 0) || 
      behMov?.movementType === 'wall_clinger' ||
      (testCharacter as any)?.hasWallCling === true
    );
    const wallFriction = heroInp?.wallClingFriction ?? 0.6;
    const wallJumpForceX = heroInp?.wallJumpForceX ?? (baseSpeed > 0 ? baseSpeed * 1.8 : 6);
    const wallJumpForceY = heroInp?.wallJumpForceY ?? (jumpForce > 0 ? jumpForce * 0.95 : 0);

    // 7. Combat Attacks — Driven by prefab hitboxes/animations and behavior skills
    const hasAttack = !!(
      testCharacter?.polygons?.some(poly => poly.type === 'hitbox') ||
      linkedBehavior?.skills?.some(s => s.actionType === 'primary_attack') ||
      (testCharacter as any)?.hasAttack === true
    );

    // 8. Special Skills — Driven by behavior skills
    const hasSpecial = !!(
      linkedBehavior?.skills?.some(s => s.actionType === 'special_ability') ||
      (testCharacter as any)?.hasSpecial === true
    );

    return {
      radius,
      height,
      offsetX,
      offsetY,
      maxHp,
      maxMp,
      maxSp,
      baseSpeed,
      accel,
      gravScale,
      airCtrl,
      jumpForce,
      canJump,
      maxAirJumps,
      totalJumps,
      hasDash,
      allowAirDash,
      dashCooldownFrames,
      dashSpeed,
      dashDurationFrames,
      hasWallCling,
      wallFriction,
      wallJumpForceX,
      wallJumpForceY,
      hasAttack,
      hasSpecial
    };
  }, [testCharacter, linkedBehavior]);

  // Prefab Spritesheet Image Loader & Cache
  const charImgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [charImgVersion, setCharImgVersion] = useState<number>(0);

  const getCharacterSpriteInfo = useCallback((char?: PrefabData) => {
    if (!char) return null;
    const sheet = char.spritesheets?.[0];
    const tileW = sheet?.tileWidth || char.spriteWidth || 64;
    const tileH = sheet?.tileHeight || char.spriteHeight || 64;
    const cols = sheet?.cols || 8;
    const rows = sheet?.rows || 4;

    let url = sheet?.imageUrl || sheet?.dataUrl || (sheet as any)?.imageBase64 || '';
    if (!url) {
      // Procedural fallback spritesheet canvas matching Prefab Studio
      const cvs = document.createElement('canvas');
      cvs.width = tileW * cols;
      cvs.height = tileH * rows;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const total = cols * rows;
        const charColor = char.tintColor || '#06b6d4';
        const avatar = char.avatarIcon || '🛡️';

        for (let i = 0; i < total; i++) {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = c * tileW;
          const y = r * tileH;

          // Subtle checkered frame box
          ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(30, 27, 75, 0.4)' : 'rgba(15, 23, 42, 0.4)';
          ctx.fillRect(x, y, tileW, tileH);

          const cx = x + tileW / 2;
          const cy = y + tileH / 2;
          const bob = Math.sin((i / total) * Math.PI * 4) * 3;
          const legOffset = Math.sin((i / 8) * Math.PI * 2) * 3;

          // Hero Body Capsule
          ctx.fillStyle = charColor;
          ctx.beginPath();
          ctx.roundRect(cx - 10, cy - 14 + bob, 20, 26, 6);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Visor / Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx + 2, cy - 10 + bob, 5, 3);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cx + 4, cy - 9 + bob, 2, 2);

          // Feet
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx - 7, cy + 12 + bob + legOffset, 5, 4);
          ctx.fillRect(cx + 2, cy + 12 + bob - legOffset, 5, 4);

          // Avatar Icon in chest
          ctx.font = `${Math.round(tileW * 0.26)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(avatar, cx, cy - 1 + bob);
        }
        url = cvs.toDataURL('image/png');
      }
    }

    if (!url) return null;

    let img = charImgCacheRef.current.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      img.onload = () => {
        setCharImgVersion(v => v + 1);
      };
      charImgCacheRef.current.set(url, img);
    }

    return { img, tileW, tileH, cols, rows };
  }, []);

  // Play Mode Player & Physics Engine State
  const playerRef = useRef({
    x: (spawnPoint?.x ?? 4) * TILE_SIZE + TILE_SIZE / 2,
    y: (spawnPoint?.y ?? 12) * TILE_SIZE + TILE_SIZE - 2,
    vx: 0,
    vy: 0,
    facing: (spawnPoint?.facing || 'right') as 'left' | 'right',
    isGrounded: false,
    isWallSliding: false,
    isDucking: false,
    maxDescendSpeed: null as number | null,
    requestedAnimState: null as string | null,
    capsuleHeightMultiplier: 1.0,
    jumpsLeft: 1,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    isAttacking: false,
    attackTimer: 0,
    specialTimer: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    mana: 100,
    maxMana: 100,
    animTime: 0,
    isWalking: false,
    landingSquash: 0,
    jumpStretch: 0,
    ghostTrails: [] as Array<{ x: number; y: number; facing: 'left' | 'right'; alpha: number; color: string }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }>,
    slashes: [] as Array<{ x: number; y: number; facing: 'left' | 'right'; frame: number; maxFrames: number; color: string }>,
    prevVx: 0,
    prevVy: 0,
    activeBehaviorState: 'idle',
    gravityOverride: null as number | null,
    allowedTraversalAngleDeg: 45,
    steepSlopeBehavior: 'block' as 'block' | 'slide_down' | 'slow_down',
    steepSlideSpeed: 3.5,
    allowCeilingTraversal: false,
    runtimeVariables: {} as Record<string, any>,
    localVariables: {} as Record<string, any>
  });

  const [hudState, setHudState] = useState({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    mana: 100,
    isGrounded: true,
    isWallSliding: false,
    facing: 'right'
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const justPressedKeysRef = useRef<Record<string, boolean>>({});
  const justReleasedKeysRef = useRef<Record<string, boolean>>({});
  const lastHudUpdateRef = useRef<number>(0);

  // Raw Mouse & Pointer State tracking for play-mode trigger evaluation
  const mouseDownRef = useRef<Record<number, boolean>>({});
  const justPressedMouseRef = useRef<Record<number, boolean>>({});
  const justReleasedMouseRef = useRef<Record<number, boolean>>({});
  const mouseWheelRef = useRef<{ up: boolean; down: boolean }>({ up: false, down: false });
  const mouseMovedRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ clientX: number; clientY: number; canvasX: number; canvasY: number; worldX: number; worldY: number; isHovering: boolean }>({
    clientX: 0,
    clientY: 0,
    canvasX: 0,
    canvasY: 0,
    worldX: 0,
    worldY: 0,
    isHovering: false
  });

  // Raw Gamepad State tracking
  const gamepadPrevButtonsRef = useRef<Record<number, Record<number, boolean>>>({});
  const gamepadJustPressedRef = useRef<Record<number, Record<number, boolean>>>({});
  const gamepadJustReleasedRef = useRef<Record<number, Record<number, boolean>>>({});

  



  const viewport = useMasonViewport({
    minScale: 0.15,
    maxScale: 4.0,
    initialScale: 0.8,
    zoomSensitivity: 1.15,
    originMode: 'topleft'
  });
  const {
    scale,
    pan,
    isPanning,
    containerRef,
    handleContextMenu,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setPan,
    viewportSize
  } = viewport;

  const canvasWidth = viewportSize.width;
  const canvasHeight = viewportSize.height;
  
  // Synchronize camera pan back into React state whenever exiting play mode
  const prevModeRef = useRef<ModeType>(mode);
  useEffect(() => {
    if (prevModeRef.current === 'play' && mode !== 'play') {
      setPan({ ...viewport.panRef.current });
    }
    prevModeRef.current = mode;
  }, [mode, setPan, viewport.panRef]);

  // Logical map bounds (for things that still need to know how big the active map is)
  const logicalMapWidth = mapData.width * TILE_SIZE;
  const logicalMapHeight = mapData.height * TILE_SIZE;

  const handleFitMap = useCallback(() => {
    const bounds = calculateMapBounds(mapData);
    const minX = bounds.minX;
    const maxX = bounds.maxX;
    const minY = bounds.minY;
    const maxY = bounds.maxY;

    const mapPixelWidth = (maxX - minX + 1) * TILE_SIZE;
    const mapPixelHeight = (maxY - minY + 1) * TILE_SIZE;
    const originPixelX = minX * TILE_SIZE;
    const originPixelY = minY * TILE_SIZE;

    fitContent(mapPixelWidth, mapPixelHeight, 48, originPixelX, originPixelY);
  }, [mapData, fitContent]);

  // Auto-fit chunks on initial mount or map change
  const lastMapIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (containerRef.current && lastMapIdRef.current !== mapData.id) {
      lastMapIdRef.current = mapData.id;
      handleFitMap();
    }
  }, [mapData.id, handleFitMap, canvasWidth, canvasHeight]);

  // Biome and TileType lookup caches
  const { biomeMap, tileTypeMap, envDetailMap, interactiveDetailMap, wildlifeMap } = useMemo(() => {
    const bMap: Record<string, RefinedBiome> = {};
    const tileTypes: Record<string, { tileType: BiomeTileType; biome: RefinedBiome }> = {};
    const envDetails: Record<string, any> = {};
    const interactiveDetails: Record<string, any> = {};
    const wildlifeItems: Record<string, any> = {};

    biomes.forEach(biome => {
      bMap[biome.id] = biome;
      biome.tileTypes.forEach(tt => {
        tileTypes[tt.id] = { tileType: tt, biome };
      });
      biome.environmentalDetails.forEach(ed => {
        envDetails[ed.id] = ed;
      });
      biome.interactiveDetails.forEach(id => {
        interactiveDetails[id.id] = id;
      });
      biome.wildlife.forEach(w => {
        wildlifeItems[w.id] = w;
      });
    });

    return { 
      biomeMap: bMap, 
      tileTypeMap: tileTypes, 
      envDetailMap: envDetails, 
      interactiveDetailMap: interactiveDetails, 
      wildlifeMap: wildlifeItems 
    };
  }, [biomes]);

  // ==========================================
  // BIOME CROSSFADE & CENTER-SCREEN DETECTION ENGINE
  // ==========================================
  const prevBiomeRef = useRef<RefinedBiome | null>(null);
  const currentBiomeRef = useRef<RefinedBiome | null>(null);
  const fadeAlphaRef = useRef<number>(1.0);

  // Determine centermost camera biome based strictly on the chunk at the center of the viewport
  const targetBiome = useMemo<RefinedBiome | null>(() => {
    const centerTileX = Math.floor((canvasWidth / 2 - pan.x) / (scale * TILE_SIZE));
    const centerTileY = Math.floor((canvasHeight / 2 - pan.y) / (scale * TILE_SIZE));

    if (mapData.chunks) {
      const { cx, cy } = getChunkCoords(centerTileX, centerTileY);
      const centerChunkKey = getChunkKey(cx, cy);
      const centerChunk = mapData.chunks[centerChunkKey];

      // If there is no chunk at the center of the screen, show no biome / no parallax background
      if (!centerChunk || !Array.isArray(centerChunk) || centerChunk.length === 0) {
        return null;
      }

      // Determine the primary biome assigned to this center chunk
      const biomeCounts = new Map<string, number>();
      for (let i = 0; i < centerChunk.length; i++) {
        const c = centerChunk[i];
        if (c?.biome_id) {
          biomeCounts.set(c.biome_id, (biomeCounts.get(c.biome_id) || 0) + 1);
        }
      }

      let maxCount = 0;
      let primaryBiomeId: string | null = null;
      for (const [bId, count] of biomeCounts.entries()) {
        if (count > maxCount && biomeMap[bId]) {
          maxCount = count;
          primaryBiomeId = bId;
        }
      }

      if (primaryBiomeId && biomeMap[primaryBiomeId]) {
        return biomeMap[primaryBiomeId];
      }

      return null;
    } else if (mapData.cells) {
      // Legacy bounds check for non-chunkified maps
      if (centerTileX >= 0 && centerTileX < mapData.width && centerTileY >= 0 && centerTileY < mapData.height) {
        const cell = mapData.cells?.[centerTileY]?.[centerTileX];
        if (cell?.biome_id && biomeMap[cell.biome_id]) {
          return biomeMap[cell.biome_id];
        }
      }
      return null;
    }

    return null;
  }, [canvasWidth, canvasHeight, pan.x, pan.y, scale, mapData, biomeMap]);

  const targetBiomeId = targetBiome ? targetBiome.id : 'VOID';
  const isInitialMountRef = useRef(true);

  // Handle Target Biome change with animated smooth crossfade (including transitions into and out of VOID)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      currentBiomeRef.current = targetBiome;
      prevBiomeRef.current = null;
      fadeAlphaRef.current = 1.0;
      return;
    }

    const currentId = currentBiomeRef.current ? currentBiomeRef.current.id : 'VOID';
    if (currentId !== targetBiomeId) {
      prevBiomeRef.current = currentBiomeRef.current;
      currentBiomeRef.current = targetBiome;
      fadeAlphaRef.current = 0.0;

      let rafId: number;
      const durationMs = 280;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        // Smooth quadratic ease-out
        fadeAlphaRef.current = progress * (2 - progress);
        setRenderTrigger(t => t + 1);

        if (progress < 1.0) {
          rafId = requestAnimationFrame(step);
        } else {
          fadeAlphaRef.current = 1.0;
          prevBiomeRef.current = null;
          setRenderTrigger(t => t + 1);
        }
      };

      rafId = requestAnimationFrame(step);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [targetBiomeId, targetBiome]);

  // Hovered Chunk & Biome derivation for Upper-Left HUD
  const hoveredChunkInfo = useMemo(() => {
    if (!hoverTile) return null;
    const { cx, cy, lx, ly } = getChunkCoords(hoverTile.x, hoverTile.y);
    const chunkKey = getChunkKey(cx, cy);
    const chunk = mapData.chunks?.[chunkKey];
    
    // Check cell directly first, then fall back to chunk cells
    const cell = chunk ? chunk[ly * CHUNK_SIZE + lx] : (mapData.cells ? getCell(mapData, hoverTile.x, hoverTile.y) : null);
    const firstCellWithBiome = chunk ? chunk.find(c => c && c.biome_id) : null;
    const biomeId = cell?.biome_id || firstCellWithBiome?.biome_id;
    
    const biome = biomeId ? (biomeMap[biomeId] || biomes.find(b => b.id === biomeId) || null) : null;
    const hasChunk = !!chunk || (mapData.cells && cell !== null);
    
    return {
      cx,
      cy,
      tileX: hoverTile.x,
      tileY: hoverTile.y,
      hasChunk,
      biome,
      biomeId
    };
  }, [hoverTile, mapData, biomeMap, biomes]);

  // Invalidate merged polygon collider cache whenever map data changes
  useEffect(() => {
    invalidateMergedColliders();
  }, [mapData]);

  // Keyboard shortcuts for toggling grid (G) and polygon colliders (C / Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        if (setShowGrid) {
          setShowGrid(prev => !prev);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setShowColliders(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowGrid]);

  // Respawn prefab function
  const respawnPlayer = useCallback(() => {
    const sx = (spawnPoint?.x ?? 4) * TILE_SIZE + TILE_SIZE / 2;
    const sy = (spawnPoint?.y ?? 12) * TILE_SIZE + TILE_SIZE - 2;
    const p = playerRef.current;
    p.x = sx;
    p.y = sy;
    p.vx = 0;
    p.vy = 0;
    p.facing = spawnPoint?.facing || 'right';
    p.isGrounded = false;
    p.isWallSliding = false;
    p.gravityOverride = null;
    p.allowedTraversalAngleDeg = (charConfig as any)?.allowedTraversalAngleDeg ?? 45;
    p.steepSlopeBehavior = (charConfig as any)?.steepSlopeBehavior || 'block';
    p.steepSlideSpeed = (charConfig as any)?.steepSlideSpeed || 3.5;
    p.allowCeilingTraversal = (charConfig as any)?.allowCeilingTraversal || false;
    p.jumpsLeft = charConfig.totalJumps;
    p.health = charConfig.maxHp;
    p.maxHealth = charConfig.maxHp;
    p.stamina = charConfig.maxSp;
    p.maxStamina = charConfig.maxSp;
    p.mana = charConfig.maxMp;
    p.maxMana = charConfig.maxMp;
    p.ghostTrails = [];
    p.slashes = [];
    p.runtimeVariables = {};
    p.localVariables = {};
    p.activeBehaviorState = 'idle';
    // Spawn respawn sparkle ring
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const spd = 2 + Math.random() * 3;
      p.particles.push({
        x: sx,
        y: sy - 16,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 25,
        maxLife: 25,
        color: testCharacter?.tintColor || '#06b6d4',
        size: 3 + Math.random() * 2
      });
    }
  }, [spawnPoint, testCharacter, charConfig]);

  // Attack execution (strictly if attack capability is configured)
  const triggerAttack = useCallback(() => {
    if (!charConfig.hasAttack) return;
    const p = playerRef.current;
    if (p.attackTimer > 0) return;
    p.isAttacking = true;
    p.attackTimer = 12;
    
    p.slashes.push({
      x: p.x,
      y: p.y - 14,
      facing: p.facing,
      frame: 0,
      maxFrames: 10,
      color: testCharacter?.tintColor || '#38bdf8'
    });

    const hitCenterX = p.facing === 'right' ? p.x + 18 : p.x - 18;
    const hitCenterY = p.y - 14;

    for (let i = 0; i < 6; i++) {
      p.particles.push({
        x: hitCenterX + (Math.random() - 0.5) * 14,
        y: hitCenterY + (Math.random() - 0.5) * 14,
        vx: (p.facing === 'right' ? 3.5 : -3.5) + (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 4,
        life: 16,
        maxLife: 16,
        color: testCharacter?.tintColor || '#67e8f9',
        size: 2.5 + Math.random() * 2
      });
    }
  }, [testCharacter, charConfig]);

  // Special skill execution (strictly if abilities / projectiles configured)
  const triggerSpecial = useCallback(() => {
    if (!charConfig.hasSpecial) return;
    const p = playerRef.current;
    if (p.specialTimer > 0 || p.mana < 25) return;
    p.specialTimer = 20;
    p.mana = Math.max(0, p.mana - 25);

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const spd = 3.5 + Math.random() * 3.5;
      p.particles.push({
        x: p.x,
        y: p.y - 16,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 25,
        maxLife: 25,
        color: '#a855f7',
        size: 3.5
      });
    }
  }, [charConfig]);

  // Dash execution (strictly if dash capability is configured)
  const triggerDash = useCallback(() => {
    if (!charConfig.hasDash) return;
    const p = playerRef.current;
    if (!charConfig.allowAirDash && !p.isGrounded) return;
    if (p.dashCooldown > 0 || p.stamina < 20) return;
    p.isDashing = true;
    p.dashTimer = charConfig.dashDurationFrames;
    p.dashCooldown = charConfig.dashCooldownFrames;
    p.stamina = Math.max(0, p.stamina - 20);
    p.vx = p.facing === 'right' ? charConfig.dashSpeed : -charConfig.dashSpeed;
    p.vy = 0;

    p.ghostTrails.push({
      x: p.x,
      y: p.y,
      facing: p.facing,
      alpha: 0.75,
      color: testCharacter?.tintColor || '#06b6d4'
    });
  }, [testCharacter, charConfig]);

  // Reset player to spawn point when entering play mode
  useEffect(() => {
    if (mode === 'play') {
      respawnPlayer();
    }
  }, [mode, respawnPlayer]);

  // Play Mode Input Listeners (Keyboard + Mouse + Gamepad)
  useEffect(() => {
    if (mode !== 'play') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (!keysDownRef.current[e.code]) {
        justPressedKeysRef.current[e.code] = true;
      }
      keysDownRef.current[e.code] = true;

      if (e.code === 'Escape') {
        e.preventDefault();
        onExitPlayMode?.();
        setMode?.('paint');
        return;
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        respawnPlayer();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      justReleasedKeysRef.current[e.code] = true;
      keysDownRef.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!mouseDownRef.current[e.button]) {
        justPressedMouseRef.current[e.button] = true;
      }
      mouseDownRef.current[e.button] = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      justReleasedMouseRef.current[e.button] = true;
      mouseDownRef.current[e.button] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseMovedRef.current = true;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const currentPan = viewport.panRef?.current || pan;
        const wx = (cx - currentPan.x) / scale;
        const wy = (cy - currentPan.y) / scale;
        const p = playerRef.current;
        const halfW = charConfig.radius;
        const charH = charConfig.height;
        const isHover = wx >= (p.x - halfW) && wx <= (p.x + halfW) && wy >= (p.y - charH) && wy <= p.y;
        mousePosRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          canvasX: cx,
          canvasY: cy,
          worldX: wx,
          worldY: wy,
          isHovering: isHover
        };
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) mouseWheelRef.current.up = true;
      if (e.deltaY > 0) mouseWheelRef.current.down = true;
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent default right-click context menu during play mode so right clicks can be used as raw inputs
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [mode, onExitPlayMode, setMode, respawnPlayer, pan, scale, charConfig.radius, charConfig.height]);

  // Main 60 FPS Physics & Animation Ticker for Play Mode
  useEffect(() => {
    if (mode !== 'play') return;

    let animId: number;
    let lastTickTime = performance.now();
    const physicsTick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTickTime) / 1000, 0.05);
      lastTickTime = now;

      const p = playerRef.current;
      const keys = keysDownRef.current;
      const justPressed = justPressedKeysRef.current;
      const justReleased = justReleasedKeysRef.current;

      p.animTime += dt;

      // Poll connected gamepads for raw_gamepad triggers
      const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
      const gpJustPressed: Record<number, Record<number, boolean>> = {};
      const gpJustReleased: Record<number, Record<number, boolean>> = {};

      for (let gIdx = 0; gIdx < gamepads.length; gIdx++) {
        const gp = gamepads[gIdx];
        if (!gp) continue;
        gpJustPressed[gIdx] = {};
        gpJustReleased[gIdx] = {};
        const prevBtns = gamepadPrevButtonsRef.current[gIdx] || {};
        const currBtns: Record<number, boolean> = {};

        for (let bIdx = 0; bIdx < gp.buttons.length; bIdx++) {
          const isDown = gp.buttons[bIdx]?.pressed ?? false;
          currBtns[bIdx] = isDown;
          if (isDown && !prevBtns[bIdx]) {
            gpJustPressed[gIdx][bIdx] = true;
          } else if (!isDown && prevBtns[bIdx]) {
            gpJustReleased[gIdx][bIdx] = true;
          }
        }
        gamepadPrevButtonsRef.current[gIdx] = currBtns;
      }
      gamepadJustPressedRef.current = gpJustPressed;
      gamepadJustReleasedRef.current = gpJustReleased;

      // Regenerate stamina & mana up to configured max
      p.stamina = Math.min(charConfig.maxSp, p.stamina + 0.35);
      p.mana = Math.min(charConfig.maxMp, p.mana + 0.2);

      // Dash timers
      if (p.dashCooldown > 0) p.dashCooldown--;
      if (p.dashTimer > 0) {
        p.dashTimer--;
        if (p.dashTimer <= 0) p.isDashing = false;
      }
      if (p.attackTimer > 0) {
        p.attackTimer--;
        if (p.attackTimer <= 0) p.isAttacking = false;
      }
      if (p.specialTimer > 0) p.specialTimer--;

      // Decay squash and stretch
      if (p.landingSquash > 1.0) p.landingSquash = Math.max(1.0, p.landingSquash - 0.05);
      if (p.jumpStretch > 1.0) p.jumpStretch = Math.max(1.0, p.jumpStretch - 0.04);

      // Helper to check if tile at (tx, ty) is solid (ignoring decoration/background tiles)
      const isSolidTile = (tx: number, ty: number): boolean => {
        const cell = getCell(mapData, tx, ty);
        if (!cell || !cell.tile_type_id) return false;
        const record = tileTypeMap[cell.tile_type_id];
        if (!record || record.tileType.generatesCollider === false) return false;
        return true;
      };

      // Helper to check if tile at (tx, ty) is solid and flat (not a slope)
      const isSolidFlatTile = (tx: number, ty: number): boolean => {
        if (!isSolidTile(tx, ty)) return false;
        const shape = getEffectiveTileShape(tx, ty);
        if (shape && shape.includes('slope')) return false;
        return true;
      };

      // Helper to get the resolved shape of a tile, resolving autotiles dynamically using neighbors
      const getEffectiveTileShape = (tx: number, ty: number): TileShape => {
        const cell = getCell(mapData, tx, ty);
        if (!cell || !cell.tile_type_id) return 'full';
        const record = tileTypeMap[cell.tile_type_id];
        if (!record) return 'full';

        const manualShape: TileShape = cell.shape || 'full';
        if (manualShape !== 'auto') {
          return manualShape;
        }

        const isNeighborSolid = (ny: number, nx: number) => {
          const neighbor = getCell(mapData, nx, ny);
          if (!neighbor || !neighbor.tile_type_id) return false;
          const rec = tileTypeMap[neighbor.tile_type_id];
          if (!rec) return false;
          return rec.tileType.generatesCollider !== false;
        };

        const shape: TileShape = resolveAutoTileShape(
          record.tileType.bevelProbability ?? 0,
          tx,
          ty,
          {
            hasTop: isNeighborSolid(ty - 1, tx),
            hasBottom: isNeighborSolid(ty + 1, tx),
            hasLeft: isNeighborSolid(ty, tx - 1),
            hasRight: isNeighborSolid(ty, tx + 1),
            hasTopLeft: isNeighborSolid(ty - 1, tx - 1),
            hasTopRight: isNeighborSolid(ty - 1, tx + 1),
            hasBottomLeft: isNeighborSolid(ty + 1, tx - 1),
            hasBottomRight: isNeighborSolid(ty + 1, tx + 1),
          },
          manualShape
        );
        return shape;
      };

      // Helper to query slope geometry at a specific world pixel point
      const checkSlopeAt = (worldX: number, worldY: number) => {
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        const cell = getCell(mapData, tx, ty);
        if (!cell || !cell.tile_type_id) {
          return { isSlope: false, isWalkableSlope: false, isCeilingSlope: false, shape: undefined, direction: undefined };
        }
        
        const shape = getEffectiveTileShape(tx, ty);
        const isUpRight = shape === 'slope_up_right_45';
        const isUpLeft = shape === 'slope_up_left_45';
        const isDownRight = shape === 'slope_down_right_45';
        const isDownLeft = shape === 'slope_down_left_45';
        const isWalkable = isUpRight || isUpLeft;
        const isCeiling = isDownRight || isDownLeft;
        const isSlope = isWalkable || isCeiling || (typeof shape === 'string' && shape.includes('slope'));

        let angleDeg = 45;
        if (shape && typeof shape === 'string') {
          if (shape.includes('30') || shape.includes('gentle')) angleDeg = 30;
          else if (shape.includes('60') || shape.includes('steep')) angleDeg = 60;
          else if (shape.includes('75')) angleDeg = 75;
          else if (shape.includes('90') || shape.includes('vertical')) angleDeg = 90;
        }

        let dir: 'up_right' | 'up_left' | 'down_right' | 'down_left' | undefined;
        if (isUpRight) dir = 'up_right';
        else if (isUpLeft) dir = 'up_left';
        else if (isDownRight) dir = 'down_right';
        else if (isDownLeft) dir = 'down_left';

        return { isSlope, isWalkableSlope: isWalkable, isCeilingSlope: isCeiling, shape, direction: dir, angleDeg };
      };

      // Slope evaluation helper for prefab behavior trigger conditions
      const evaluateSlopeDetection = (
        slopeCondition: string = 'on_slope',
        contactLocation: string = 'under_feet',
        detectionDistancePx: number = 4
      ): boolean => {
        const dist = Math.max(1, detectionDistancePx);
        const fwdDist = p.facing === 'right' ? halfW + dist : -(halfW + dist);
        const bwdDist = p.facing === 'right' ? -(halfW + dist) : halfW + dist;

        // Sample points based on contact location
        let probePoints: Array<{ x: number; y: number }> = [];
        if (contactLocation === 'ahead') {
          probePoints = [
            { x: p.x + fwdDist, y: p.y - 4 },
            { x: p.x + fwdDist, y: p.y + 4 }
          ];
        } else if (contactLocation === 'behind') {
          probePoints = [
            { x: p.x + bwdDist, y: p.y - 4 },
            { x: p.x + bwdDist, y: p.y + 4 }
          ];
        } else if (contactLocation === 'above_head') {
          probePoints = [
            { x: p.x - halfW / 2, y: p.y - charH - dist },
            { x: p.x + halfW / 2, y: p.y - charH - dist }
          ];
        } else {
          // 'under_feet'
          probePoints = [
            { x: p.x, y: p.y + dist },
            { x: p.x - halfW / 2, y: p.y + dist },
            { x: p.x + halfW / 2, y: p.y + dist },
            { x: p.x, y: p.y - 2 } // Feet level
          ];
        }

        const slopeInfos = probePoints.map(pt => checkSlopeAt(pt.x, pt.y));
        const hasSlope = slopeInfos.some(s => s.isSlope);
        const activeSlope = slopeInfos.find(s => s.isSlope);

        if (slopeCondition === 'not_on_slope' || slopeCondition === 'no_slope') {
          return !hasSlope;
        }
        if (!hasSlope || !activeSlope) {
          return false;
        }

        if (slopeCondition === 'on_slope' || slopeCondition === 'on_any_slope') {
          return true;
        }
        if (slopeCondition === 'on_floor_ramp') {
          return activeSlope.isWalkableSlope;
        }
        if (slopeCondition === 'on_ceiling_slope' || slopeCondition === 'slope_ceiling') {
          return activeSlope.isCeilingSlope;
        }
        if (slopeCondition === 'slope_up_right' || slopeCondition === 'slope_down_right_45') {
          return activeSlope.shape === 'slope_up_right_45';
        }
        if (slopeCondition === 'slope_up_left' || slopeCondition === 'slope_down_left_45') {
          return activeSlope.shape === 'slope_up_left_45';
        }
        if (slopeCondition === 'slope_down_right') {
          return activeSlope.shape === 'slope_down_right_45';
        }
        if (slopeCondition === 'slope_down_left') {
          return activeSlope.shape === 'slope_down_left_45';
        }
        if (slopeCondition === 'slope_steep') {
          return activeSlope.isSlope;
        }
        if (slopeCondition === 'slope_ascending_forward' || slopeCondition === 'ascending_slope' || slopeCondition === 'facing_uphill') {
          // Ascending: facing right + slope_up_right_45 (◢) OR facing left + slope_up_left_45 (◣)
          if (p.facing === 'right' && activeSlope.shape === 'slope_up_right_45') return true;
          if (p.facing === 'left' && activeSlope.shape === 'slope_up_left_45') return true;
          return false;
        }
        if (slopeCondition === 'slope_descending_forward' || slopeCondition === 'descending_slope' || slopeCondition === 'facing_downhill') {
          // Descending: facing right + slope_up_left_45 (◣) OR facing left + slope_up_right_45 (◢)
          if (p.facing === 'right' && activeSlope.shape === 'slope_up_left_45') return true;
          if (p.facing === 'left' && activeSlope.shape === 'slope_up_right_45') return true;
          return false;
        }

        return hasSlope;
      };

      const halfW = charConfig.radius;
      const charH = charConfig.height;

      // Reset dynamic per-frame states before rule evaluation
      p.requestedAnimState = null;
      p.maxDescendSpeed = null;
      p.isDucking = false;
      p.capsuleHeightMultiplier = 1.0;
      let movementOverridden = false;
      let jumpTriggeredByRule = false;

      // 0. Environmental Gravity & Biome lookup
      const pTileX = Math.floor(p.x / TILE_SIZE);
      const pTileY = Math.floor(p.y / TILE_SIZE);
      const { cx: pCx, cy: pCy, lx: pLx, ly: pLy } = getChunkCoords(pTileX, pTileY);
      const pChunkKey = getChunkKey(pCx, pCy);
      const playerChunk = mapData.chunks?.[pChunkKey];
      const playerCell = playerChunk ? playerChunk[pLy * CHUNK_SIZE + pLx] : (mapData.cells ? getCell(mapData, pTileX, pTileY) : null);
      const pBiomeId = playerCell?.biome_id || playerChunk?.find(c => c && c.biome_id)?.biome_id || targetBiome?.id || currentBiomeRef.current?.id;
      const playerBiome = pBiomeId ? (biomeMap[pBiomeId] || biomes.find(b => b.id === pBiomeId) || targetBiome || currentBiomeRef.current) : (targetBiome || currentBiomeRef.current);
      
      const biomeGravityScale = playerBiome?.gravityScale !== undefined ? playerBiome.gravityScale : (charConfig.gravScale ?? 1.0);
      
      // Effective Gravity: Prefab behavior override strictly takes precedence over biome gravity
      const effectiveGravScale = (p.gravityOverride !== null && p.gravityOverride !== undefined)
        ? p.gravityOverride
        : biomeGravityScale;

      // Prefab & Local Variable resolver helper
      const getCharVarRaw = (varIdOrName?: string, fallback: any = 0): any => {
        if (!varIdOrName) return fallback;
        // 1. Check localVariables first (rule-scoped / local)
        if (p.localVariables && p.localVariables[varIdOrName] !== undefined) {
          return p.localVariables[varIdOrName];
        }
        // 2. Check runtimeVariables (overridden during play test)
        if (p.runtimeVariables && p.runtimeVariables[varIdOrName] !== undefined) {
          return p.runtimeVariables[varIdOrName];
        }
        // 3. Check behaviorVariables on testCharacter
        if (testCharacter?.behaviorVariables?.[varIdOrName] !== undefined) {
          return testCharacter.behaviorVariables[varIdOrName];
        }
        // 4. Check variables on testCharacter by ID or Name
        const v = (testCharacter?.variables || []).find(cv => cv.id === varIdOrName || cv.name.toLowerCase() === varIdOrName.toLowerCase());
        if (v) {
          if (p.runtimeVariables && p.runtimeVariables[v.id] !== undefined) {
            return p.runtimeVariables[v.id];
          }
          const rawVal = testCharacter?.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue;
          if (rawVal !== undefined && rawVal !== null) return rawVal;
        }
        return fallback;
      };

      const getCharVarNum = (varIdOrName?: string, fallback: number = 0): number => {
        const val = getCharVarRaw(varIdOrName, fallback);
        if (typeof val === 'number') return isNaN(val) ? fallback : val;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
      };

      const setCharVar = (varIdOrName: string, value: any, scope: 'prefab' | 'local' = 'prefab') => {
        if (!varIdOrName) return;
        if (scope === 'local' || varIdOrName.startsWith('local_') || varIdOrName.startsWith('local.')) {
          if (!p.localVariables) p.localVariables = {};
          p.localVariables[varIdOrName] = value;
        } else {
          const v = (testCharacter?.variables || []).find(cv => cv.id === varIdOrName || cv.name.toLowerCase() === varIdOrName.toLowerCase());
          const effId = v ? v.id : varIdOrName;
          if (!p.runtimeVariables) p.runtimeVariables = {};
          p.runtimeVariables[effId] = value;
        }
      };

      const evaluateMathAction = (action: any) => {
        const op = action.mathOp || action.variableOp || 'set';
        const targetVarId = action.variableId || action.localVariableName || (action.variableScope === 'local' ? 'local_temp' : (testCharacter?.variables?.[0]?.id || 'var_1'));
        const scope: 'prefab' | 'local' = action.variableScope || (action.localVariableName || targetVarId?.startsWith('local_') || targetVarId?.startsWith('local.') ? 'local' : 'prefab');

        // Resolve Operand A
        let valA: number = 0;
        if (action.operandASource === 'constant') {
          valA = action.operandAConstant ?? (typeof action.variableValue === 'number' ? action.variableValue : 0);
        } else if (action.operandASource === 'variable' && action.operandAVariableId) {
          valA = getCharVarNum(action.operandAVariableId, 0);
        } else if (action.operandAVariableId) {
          valA = getCharVarNum(action.operandAVariableId, 0);
        } else if (action.variableValue !== undefined && action.variableValue !== null && action.actionType === 'variable_modify') {
          valA = getCharVarNum(targetVarId, 0);
        } else {
          valA = getCharVarNum(targetVarId, 0);
        }

        // Resolve Operand B
        let valB: number = 0;
        if (action.operandBSource === 'variable' && action.operandBVariableId) {
          valB = getCharVarNum(action.operandBVariableId, 0);
        } else if (action.operandBConstant !== undefined) {
          valB = action.operandBConstant;
        } else if (action.operandBVariableId) {
          valB = getCharVarNum(action.operandBVariableId, 0);
        } else if (action.variableValue !== undefined && action.actionType === 'variable_modify') {
          valB = typeof action.variableValue === 'number' ? action.variableValue : parseFloat(action.variableValue) || 0;
        }

        let result = valA;

        switch (op) {
          case 'set':
          case '=':
            result = (action.operandASource === 'constant' || action.operandASource === 'variable') ? valA : (action.operandBSource ? valB : (action.variableValue !== undefined ? Number(action.variableValue) : valA));
            break;
          case 'add':
          case '+':
            result = valA + valB;
            break;
          case 'subtract':
          case '-':
            result = valA - valB;
            break;
          case 'multiply':
          case '*':
            result = valA * valB;
            break;
          case 'divide':
          case '/':
            result = valB !== 0 ? (valA / valB) : 0;
            break;
          case 'modulo':
          case '%':
            result = valB !== 0 ? (valA % valB) : 0;
            break;
          case 'power':
          case '^':
            result = Math.pow(valA, valB);
            break;
          case 'min':
            result = Math.min(valA, valB);
            break;
          case 'max':
            result = Math.max(valA, valB);
            break;
          case 'clamp': {
            const minVal = action.clampMinSource === 'variable' && action.clampMinVariableId ? getCharVarNum(action.clampMinVariableId, 0) : (action.clampMin ?? 0);
            const maxVal = action.clampMaxSource === 'variable' && action.clampMaxVariableId ? getCharVarNum(action.clampMaxVariableId, 100) : (action.clampMax ?? 100);
            result = Math.min(Math.max(valA, Math.min(minVal, maxVal)), Math.max(minVal, maxVal));
            break;
          }
          case 'abs':
            result = Math.abs(valA);
            break;
          case 'round':
            result = Math.round(valA);
            break;
          case 'floor':
            result = Math.floor(valA);
            break;
          case 'ceil':
            result = Math.ceil(valA);
            break;
          case 'negate':
            result = -valA;
            break;
          case 'lerp': {
            const t = action.lerpTSource === 'variable' && action.lerpTVariableId ? getCharVarNum(action.lerpTVariableId, 0.5) : (action.lerpT ?? 0.5);
            result = valA + (valB - valA) * t;
            break;
          }
          case 'random_range': {
            const minVal = valA;
            const maxVal = valB;
            result = minVal + Math.random() * (maxVal - minVal);
            break;
          }
          case 'toggle': {
            const current = getCharVarRaw(targetVarId, false);
            setCharVar(targetVarId, !current, scope);
            return;
          }
          default:
            result = valA;
            break;
        }

        setCharVar(targetVarId, result, scope);
      };

      // Solid check helper in specific direction and distance in pixels
      const checkSolidsInDirection = (
        direction: 'left' | 'right' | 'above' | 'below' | 'ground' | 'ceiling' | 'wall_forward' | 'wall_backward',
        distancePx: number = 4,
        mode: 'touching' | 'near' | 'clear' | 'ledge_ahead' = 'touching'
      ): boolean => {
        const dist = Math.max(1, distancePx);
        const fwd = p.facing === 'right' ? 'right' : 'left';
        const bwd = p.facing === 'right' ? 'left' : 'right';

        let effDir = direction;
        if (direction === 'wall_forward') effDir = fwd;
        if (direction === 'wall_backward') effDir = bwd;
        if (direction === 'ground') effDir = 'below';
        if (direction === 'ceiling') effDir = 'above';

        if (mode === 'ledge_ahead') {
          const lookAheadX = p.x + (p.facing === 'right' ? halfW + dist : -(halfW + dist));
          const lookDownY = p.y + 6;
          const tX = Math.floor(lookAheadX / TILE_SIZE);
          const tY = Math.floor(lookDownY / TILE_SIZE);
          return !isSolidTile(tX, tY);
        }

        let solidDetected = false;
        if (effDir === 'left') {
          const tX = Math.floor((p.x - halfW - dist) / TILE_SIZE);
          const tY1 = Math.floor((p.y - 4) / TILE_SIZE);
          const tY2 = Math.floor((p.y - charH / 2) / TILE_SIZE);
          const tY3 = Math.floor((p.y - charH + 4) / TILE_SIZE);
          solidDetected = isSolidTile(tX, tY1) || isSolidTile(tX, tY2) || isSolidTile(tX, tY3);
        } else if (effDir === 'right') {
          const tX = Math.floor((p.x + halfW + dist) / TILE_SIZE);
          const tY1 = Math.floor((p.y - 4) / TILE_SIZE);
          const tY2 = Math.floor((p.y - charH / 2) / TILE_SIZE);
          const tY3 = Math.floor((p.y - charH + 4) / TILE_SIZE);
          solidDetected = isSolidTile(tX, tY1) || isSolidTile(tX, tY2) || isSolidTile(tX, tY3);
        } else if (effDir === 'above') {
          const tY = Math.floor((p.y - charH - dist) / TILE_SIZE);
          const tX1 = Math.floor((p.x - halfW + 2) / TILE_SIZE);
          const tX2 = Math.floor(p.x / TILE_SIZE);
          const tX3 = Math.floor((p.x + halfW - 2) / TILE_SIZE);
          solidDetected = isSolidTile(tX1, tY) || isSolidTile(tX2, tY) || isSolidTile(tX3, tY);
        } else if (effDir === 'below') {
          const tY = Math.floor((p.y + dist) / TILE_SIZE);
          const tX1 = Math.floor((p.x - halfW + 2) / TILE_SIZE);
          const tX2 = Math.floor(p.x / TILE_SIZE);
          const tX3 = Math.floor((p.x + halfW - 2) / TILE_SIZE);
          solidDetected = isSolidTile(tX1, tY) || isSolidTile(tX2, tY) || isSolidTile(tX3, tY);
        }

        if (mode === 'clear') {
          return !solidDetected;
        }
        return solidDetected;
      };

      // Physics State evaluation helper
      const evaluatePhysicsState = (
        stateKind: string,
        velocityThreshold: number = 0.5
      ): boolean => {
        switch (stateKind) {
          case 'jump_peak':
            return !p.isGrounded && Math.abs(p.vy) <= Math.max(0.6, velocityThreshold) && p.prevVy <= 0.2;
          case 'falling':
            return !p.isGrounded && p.vy > (velocityThreshold > 0 ? velocityThreshold : 0.5);
          case 'rising':
            return !p.isGrounded && p.vy < -(velocityThreshold > 0 ? velocityThreshold : 0.5);
          case 'grounded':
            return p.isGrounded;
          case 'airborne':
            return !p.isGrounded;
          case 'wall_sliding':
            return p.isWallSliding;
          case 'ducking':
          case 'crouched':
            return p.isDucking;
          case 'moving_horizontally':
            return Math.abs(p.vx) > velocityThreshold;
          case 'stopped':
            return Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1;
          case 'weightless_environment':
            return Math.abs(effectiveGravScale) <= 0.05;
          case 'high_velocity':
            return (Math.abs(p.vx) > (velocityThreshold || 6.0)) || (Math.abs(p.vy) > (velocityThreshold || 10.0));
          case 'direction_change':
            return (p.prevVx > 0.1 && p.vx < -0.1) || (p.prevVx < -0.1 && p.vx > 0.1);
          default:
            return false;
        }
      };

      // Evaluate single trigger
      const evaluateTrigger = (trig: any): boolean => {
        if (!trig) return false;
        const triggerMode = trig.triggerMode || 'press';

        switch (trig.type) {
          case 'slope_detection':
          case 'slope':
            return evaluateSlopeDetection(trig.slopeCondition ?? 'on_slope', trig.contactLocation ?? 'under_feet', trig.detectionDistancePx ?? 4);
          case 'solid_detection':
            return checkSolidsInDirection(trig.direction, trig.detectionDistancePx ?? 4, trig.checkMode ?? 'touching');
          case 'physics_state':
            return evaluatePhysicsState(trig.stateKind, trig.velocityThreshold ?? 0.5);
          case 'variable_condition': {
            const leftVal = getCharVarRaw(trig.variableId, undefined);
            if (leftVal === undefined) return false;
            const rightVal = trig.value;
            const v = (testCharacter?.variables || []).find(cv => cv.id === trig.variableId || cv.name.toLowerCase() === trig.variableId?.toLowerCase());
            const isBool = (v && v.type === 'boolean') || typeof leftVal === 'boolean' || typeof rightVal === 'boolean';
            if (isBool) {
              const bLeft = leftVal === true || leftVal === 'true' || leftVal === 1;
              const bRight = rightVal === undefined || rightVal === true || rightVal === 'true' || rightVal === 1;
              if (trig.comparator === 'not_equals' || trig.comparator === '!=') return bLeft !== bRight;
              return bLeft === bRight;
            }
            if (trig.comparator === 'equals' || trig.comparator === '==') return String(leftVal).toLowerCase() === String(rightVal).toLowerCase();
            if (trig.comparator === 'not_equals' || trig.comparator === '!=') return String(leftVal).toLowerCase() !== String(rightVal).toLowerCase();
            if (trig.comparator === 'greater_than' || trig.comparator === '>') return Number(leftVal) > Number(rightVal);
            if (trig.comparator === 'greater_or_equal' || trig.comparator === '>=') return Number(leftVal) >= Number(rightVal);
            if (trig.comparator === 'less_than' || trig.comparator === '<') return Number(leftVal) < Number(rightVal);
            if (trig.comparator === 'less_or_equal' || trig.comparator === '<=') return Number(leftVal) <= Number(rightVal);
            return false;
          }
          case 'player_condition':
            if (trig.condition === 'is_grounded') return p.isGrounded;
            if (trig.condition === 'is_airborne') return !p.isGrounded;
            if (trig.condition === 'is_wall_sliding') return p.isWallSliding;
            if (trig.condition === 'is_ducking') return p.isDucking;
            if (trig.condition === 'low_health') return p.health <= 30;
            if (trig.condition === 'low_stamina') return p.stamina <= 20;
            return false;
          case 'state':
            return p.activeBehaviorState === trig.stateId || trig.stateId === 'any';
          case 'raw_keyboard':
          case 'keyboard_key':
          case 'input_press': {
            // Check modifier requirements
            if (trig.requireShift && !keys['ShiftLeft'] && !keys['ShiftRight']) return false;
            if (trig.requireCtrl && !keys['ControlLeft'] && !keys['ControlRight']) return false;
            if (trig.requireAlt && !keys['AltLeft'] && !keys['AltRight']) return false;

            const k = trig.key || trig.button;
            if (!k) return false;
            const effectiveMode = trig.triggerMode || triggerMode || 'press';
            const keyMap: Record<string, string[]> = {
              jump: ['Space', 'KeyW', 'ArrowUp'],
              space: ['Space'],
              move_left: ['KeyA', 'ArrowLeft'],
              move_right: ['KeyD', 'ArrowRight'],
              duck: ['KeyS', 'ArrowDown'],
              crouch: ['KeyS', 'ArrowDown'],
              dash: ['ShiftLeft', 'ShiftRight', 'KeyC'],
              attack: ['KeyJ', 'KeyZ'],
              special: ['KeyK', 'KeyX'],
              block: ['KeyL', 'KeyV'],
              interact: ['KeyE', 'KeyF']
            };
            const targetCodes = keyMap[k.toLowerCase()] || [k, `Key${k.toUpperCase()}`, k.toLowerCase()];
            const checkKey = (code: string, dict: Record<string, boolean>) => {
              if (dict[code]) return true;
              if (code.startsWith('Key') && (dict[code.slice(3)] || dict[code.slice(3).toLowerCase()])) return true;
              if (dict[`Key${code.toUpperCase()}`]) return true;
              if (dict[code.toLowerCase()]) return true;
              if (dict[code.toUpperCase()]) return true;
              return false;
            };
            if (effectiveMode === 'release') {
              return targetCodes.some(c => checkKey(c, justReleased));
            }
            if (effectiveMode === 'press') {
              return targetCodes.some(c => checkKey(c, justPressed));
            }
            return targetCodes.some(c => checkKey(c, keys));
          }
          case 'raw_mouse': {
            const act = trig.action || 'press';
            const btn = trig.button || 'left';
            const targetArea = trig.targetArea || 'anywhere';

            // Check targetArea filter
            if (targetArea === 'on_prefab' && !mousePosRef.current.isHovering) return false;
            if (targetArea === 'screen_left_half' && mousePosRef.current.canvasX >= (canvasWidth / 2)) return false;
            if (targetArea === 'screen_right_half' && mousePosRef.current.canvasX < (canvasWidth / 2)) return false;

            if (act === 'wheel_up') return mouseWheelRef.current.up;
            if (act === 'wheel_down') return mouseWheelRef.current.down;
            if (act === 'move') return mouseMovedRef.current;
            if (act === 'hover') return mousePosRef.current.isHovering;

            const btnMap: Record<string, number> = {
              left: 0,
              middle: 1,
              right: 2,
              button_4: 3,
              button_5: 4
            };

            if (btn === 'any') {
              if (act === 'release') return Object.values(justReleasedMouseRef.current).some(Boolean);
              if (act === 'press') return Object.values(justPressedMouseRef.current).some(Boolean);
              return Object.values(mouseDownRef.current).some(Boolean);
            }

            const btnIndex = btnMap[btn] ?? 0;
            if (act === 'release') return !!justReleasedMouseRef.current[btnIndex];
            if (act === 'press') return !!justPressedMouseRef.current[btnIndex];
            return !!mouseDownRef.current[btnIndex];
          }
          case 'raw_gamepad': {
            const gpIdx = trig.gamepadIndex;
            const inputType = trig.inputType || 'button';
            
            // Filter relevant gamepads
            const targetPads: Gamepad[] = [];
            if (gpIdx === 'any' || gpIdx === undefined) {
              for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) targetPads.push(gamepads[i]!);
              }
            } else if (typeof gpIdx === 'number' && gamepads[gpIdx]) {
              targetPads.push(gamepads[gpIdx]!);
            }

            if (targetPads.length === 0) return false;

            const gpButtonMap: Record<string, number> = {
              button_a: 0,
              button_b: 1,
              button_x: 2,
              button_y: 3,
              left_bumper: 4,
              right_bumper: 5,
              left_trigger: 6,
              right_trigger: 7,
              select_back: 8,
              start_pause: 9,
              left_stick_click: 10,
              right_stick_click: 11,
              dpad_up: 12,
              dpad_down: 13,
              dpad_left: 14,
              dpad_right: 15,
              home_guide: 16
            };

            if (inputType === 'button') {
              const btn = trig.button || 'button_a';
              const btnMode = trig.buttonMode || triggerMode || 'press';
              const targetBtnIndex = gpButtonMap[btn];

              return targetPads.some(gp => {
                const gIndex = gp.index;
                if (btn === 'any') {
                  if (btnMode === 'release') {
                    return Object.values(gamepadJustReleasedRef.current[gIndex] || {}).some(Boolean);
                  }
                  if (btnMode === 'press') {
                    return Object.values(gamepadJustPressedRef.current[gIndex] || {}).some(Boolean);
                  }
                  return gp.buttons.some(b => b.pressed);
                }

                if (targetBtnIndex === undefined) return false;
                if (btnMode === 'release') {
                  return !!gamepadJustReleasedRef.current[gIndex]?.[targetBtnIndex];
                }
                if (btnMode === 'press') {
                  return !!gamepadJustPressedRef.current[gIndex]?.[targetBtnIndex];
                }
                return !!gp.buttons[targetBtnIndex]?.pressed;
              });
            }

            if (inputType === 'stick_axis' || inputType === 'trigger_axis') {
              const axis = trig.axis || 'left_stick_x';
              const dir = trig.axisDirection || 'positive';
              const threshold = trig.axisThreshold ?? 0.25;

              return targetPads.some(gp => {
                let val = 0;
                if (axis === 'left_stick_x') val = gp.axes[0] ?? 0;
                else if (axis === 'left_stick_y') val = gp.axes[1] ?? 0;
                else if (axis === 'right_stick_x') val = gp.axes[2] ?? 0;
                else if (axis === 'right_stick_y') val = gp.axes[3] ?? 0;
                else if (axis === 'left_trigger') val = gp.buttons[6]?.value ?? gp.axes[4] ?? 0;
                else if (axis === 'right_trigger') val = gp.buttons[7]?.value ?? gp.axes[5] ?? 0;

                if (dir === 'positive' || dir === 'greater_than') return val > threshold;
                if (dir === 'negative' || dir === 'less_than') return val < -threshold;
                if (dir === 'any_movement') return Math.abs(val) > threshold;
                return Math.abs(val) > threshold;
              });
            }

            return false;
          }
          case 'mapped_input': {
            const inpId = trig.inputId;
            const inpName = trig.inputName;
            
            // 1. Resolve configured mapping from UI module input mappings, prop inputMappings, or default UNIFIED_INPUT_TEMPLATE
            const activePool = (inputMappings && inputMappings.length > 0) ? inputMappings : UNIFIED_INPUT_TEMPLATE;
            const mapping = activePool.find(m => 
              m.id === inpId || 
              m.name === inpId || 
              (inpName && (m.name === inpName || m.id === inpName || m.label === inpName))
            ) || UNIFIED_INPUT_TEMPLATE.find(m => 
              m.id === inpId || 
              m.name === inpId || 
              (inpName && (m.name === inpName || m.id === inpName || m.label === inpName))
            );

            // 2. Resolve target keys configured in UI module
            let targetCodes: string[] = [];
            if (mapping && Array.isArray(mapping.keys) && mapping.keys.length > 0) {
              targetCodes = [...mapping.keys];
            } else {
              const fallbackKeyMap: Record<string, string[]> = {
                jump: ['Space', 'KeyW', 'ArrowUp'],
                inp_jump: ['Space', 'KeyW', 'ArrowUp'],
                move_left: ['KeyA', 'ArrowLeft'],
                inp_move_left: ['KeyA', 'ArrowLeft'],
                move_right: ['KeyD', 'ArrowRight'],
                inp_move_right: ['KeyD', 'ArrowRight'],
                duck: ['KeyS', 'ArrowDown'],
                crouch: ['KeyS', 'ArrowDown'],
                inp_crouch: ['KeyS', 'ArrowDown'],
                dash: ['ShiftLeft', 'ShiftRight', 'KeyC'],
                inp_dash: ['ShiftLeft', 'ShiftRight', 'KeyC'],
                attack: ['KeyJ', 'KeyZ'],
                inp_attack: ['KeyJ', 'KeyZ'],
                special: ['KeyK', 'KeyX'],
                inp_special: ['KeyK', 'KeyX'],
                block: ['KeyL', 'KeyV'],
                inp_block: ['KeyL', 'KeyV'],
                interact: ['KeyE', 'KeyF'],
                inp_interact: ['KeyE', 'KeyF'],
                cast_spell: ['KeyU', 'KeyQ'],
                inp_cast_spell: ['KeyU', 'KeyQ'],
                use_item: ['KeyR', 'Digit1'],
                inp_use_item: ['KeyR', 'Digit1']
              };
              targetCodes = fallbackKeyMap[inpId] || fallbackKeyMap[inpName || ''] || [inpId, inpName].filter(Boolean) as string[];
            }

            // 3. Timing / Trigger Mode: use UI Input Mappings configuration directly
            const effectiveMode = (
              mapping?.triggerMode === 'press' ? 'press' :
              mapping?.triggerMode === 'tap' ? 'press' :
              mapping?.triggerMode === 'release' ? 'release' :
              'hold'
            );

            const checkKey = (code: string, dict: Record<string, boolean>) => {
              if (dict[code]) return true;
              if (code.startsWith('Key') && (dict[code.slice(3)] || dict[code.slice(3).toLowerCase()])) return true;
              if (dict[`Key${code.toUpperCase()}`]) return true;
              if (dict[code.toLowerCase()]) return true;
              if (dict[code.toUpperCase()]) return true;
              return false;
            };

            if (effectiveMode === 'release') {
              return targetCodes.some(c => checkKey(c, justReleased));
            }
            if (effectiveMode === 'press') {
              return targetCodes.some(c => checkKey(c, justPressed));
            }
            return targetCodes.some(c => checkKey(c, keys));
          }
          case 'collision':
            return p.isGrounded || p.isWallSliding;
          default:
            return false;
        }
      };

      // Helper to execute single behavior action
      const executeCharacterAction = (action: any) => {
        if (!action || action.actionType === 'none') return;

        // 1. Hero Impulse (Jump, Wall Jump, Dash, Knockback, Ground Slam)
        if (action.actionType === 'hero_impulse') {
          const force = (action.forceSource === 'variable' && action.forceVariableId)
            ? getCharVarNum(action.forceVariableId, action.force ?? 12)
            : (action.force ?? 12);

          if (action.impulseType === 'jump') {
            if (p.isGrounded || p.jumpsLeft > 0) {
              p.vy = -Math.abs(force);
              p.jumpsLeft = Math.max(0, p.jumpsLeft - 1);
              p.isGrounded = false;
              p.isWallSliding = false;
              p.jumpStretch = 1.25;
              jumpTriggeredByRule = true;
              for (let i = 0; i < 5; i++) {
                p.particles.push({
                  x: p.x + (Math.random() - 0.5) * 12,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -Math.random() * 2,
                  life: 14,
                  maxLife: 14,
                  color: 'rgba(200, 200, 200, 0.7)',
                  size: 2
                });
              }
            }
          } else if (action.impulseType === 'wall_jump' || action.impulseType === 'wall_kick') {
            const jumpX = action.wallJumpForceX ?? (charConfig.baseSpeed > 0 ? charConfig.baseSpeed * 1.8 : 6);
            const jumpY = action.wallJumpForceY ?? Math.abs(force);
            p.vy = -jumpY;
            p.vx = (p.facing === 'left' ? 1 : -1) * jumpX;
            p.facing = p.facing === 'left' ? 'right' : 'left';
            p.isWallSliding = false;
            p.isGrounded = false;
            p.jumpStretch = 1.3;
            jumpTriggeredByRule = true;
            for (let i = 0; i < 6; i++) {
              p.particles.push({
                x: p.x,
                y: p.y - 12,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                life: 12,
                maxLife: 12,
                color: '#38bdf8',
                size: 2
              });
            }
          } else if (action.impulseType === 'dash') {
            triggerDash();
          } else if (action.impulseType === 'ground_slam') {
            p.vy = Math.abs(force);
          } else if (action.impulseType === 'knockback') {
            p.vx = (p.facing === 'left' ? 1 : -1) * force;
            p.vy = -force * 0.35;
          }
        }
        // 2. Kinematic Move (Manual Kinematics)
        else if (action.actionType === 'move') {
          const speed = (action.speedSource === 'variable' && action.speedVariableId)
            ? getCharVarNum(action.speedVariableId, action.speed ?? 4.0)
            : (action.speed ?? 4.0);

          const mode = action.moveMode || 'move_forward';

          if (mode === 'move_left' || mode === 'left') {
            p.vx = -speed;
            p.facing = 'left';
            p.isWalking = true;
            movementOverridden = true;
          } else if (mode === 'move_right' || mode === 'right') {
            p.vx = speed;
            p.facing = 'right';
            p.isWalking = true;
            movementOverridden = true;
          } else if (mode === 'move_up') {
            p.vy = -speed;
            movementOverridden = true;
          } else if (mode === 'move_down') {
            p.vy = speed;
            movementOverridden = true;
          } else if (mode === 'move_forward' || mode === 'towards_target') {
            p.vx = p.facing === 'right' ? speed : -speed;
            p.isWalking = true;
            movementOverridden = true;
          } else if (mode === 'move_backward' || mode === 'away_from_target') {
            p.vx = p.facing === 'right' ? -speed : speed;
            p.isWalking = true;
            movementOverridden = true;
          } else if (mode === 'move_angle') {
            const rad = ((action.angleDeg ?? 0) * Math.PI) / 180;
            p.vx = Math.cos(rad) * speed;
            p.vy = Math.sin(rad) * speed;
            p.isWalking = Math.abs(p.vx) > 0.1;
            movementOverridden = true;
          } else if (mode === 'set_velocity') {
            if (action.velocityX !== undefined) p.vx = action.velocityX;
            if (action.velocityY !== undefined) p.vy = action.velocityY;
            movementOverridden = true;
          } else if (mode === 'add_velocity') {
            if (action.velocityX !== undefined) p.vx += action.velocityX;
            if (action.velocityY !== undefined) p.vy += action.velocityY;
            movementOverridden = true;
          } else if (mode === 'set_velocity_x') {
            p.vx = speed;
            movementOverridden = true;
          } else if (mode === 'set_velocity_y') {
            p.vy = speed;
          } else if (mode === 'add_velocity_x') {
            p.vx += speed;
            movementOverridden = true;
          } else if (mode === 'add_velocity_y') {
            p.vy += speed;
          } else if (mode === 'stop') {
            p.vx = 0;
            p.vy = 0;
            p.isWalking = false;
            movementOverridden = true;
          } else if (mode === 'stop_x') {
            p.vx = 0;
            p.isWalking = false;
            movementOverridden = true;
          } else if (mode === 'stop_y') {
            p.vy = 0;
            movementOverridden = true;
          } else if (mode === 'duck' || mode === 'crouch') {
            p.isDucking = true;
            p.capsuleHeightMultiplier = action.capsuleHeightMultiplier || 0.5;
            p.vx = 0;
            movementOverridden = true;
          }

          if (action.setFacing) {
            if (action.setFacing === 'match_movement' && Math.abs(p.vx) > 0.1) {
              p.facing = p.vx > 0 ? 'right' : 'left';
            } else if (action.setFacing === 'left') {
              p.facing = 'left';
            } else if (action.setFacing === 'right') {
              p.facing = 'right';
            } else if (action.setFacing === 'reverse') {
              p.facing = p.facing === 'left' ? 'right' : 'left';
            }
          }

          if (action.maxDescendSpeed !== undefined || action.descendRate !== undefined) {
            p.maxDescendSpeed = action.descendRate ?? action.maxDescendSpeed;
          }

          if (action.isDucking || action.crouch) {
            p.isDucking = true;
            p.capsuleHeightMultiplier = action.capsuleHeightMultiplier || 0.5;
          }
        }
        // 2b. AI / Automation Actions
        else if (action.actionType === 'ai_action') {
          const speed = (action.speedSource === 'variable' && action.speedVariableId)
            ? getCharVarNum(action.speedVariableId, action.speed ?? 3.0)
            : (action.speed ?? 3.0);

          const aiMode = action.aiMode || 'ground_patrol';

          if (aiMode === 'ground_patrol') {
            const wallAhead = checkSolidsInDirection('wall_forward', 4, 'touching');
            const ledgeAhead = checkSolidsInDirection('wall_forward', 8, 'ledge_ahead');
            if (wallAhead || ledgeAhead) {
              p.facing = p.facing === 'left' ? 'right' : 'left';
            }
            p.vx = (p.facing === 'right' ? 1 : -1) * speed;
            p.isWalking = true;
            movementOverridden = true;
          } else if (aiMode === 'towards_target' || aiMode === 'chase') {
            p.vx = (p.facing === 'right' ? 1 : -1) * speed;
            p.isWalking = true;
            movementOverridden = true;
          } else if (aiMode === 'away_from_target' || aiMode === 'flee') {
            p.vx = (p.facing === 'right' ? -1 : 1) * speed;
            p.isWalking = true;
            movementOverridden = true;
          } else if (aiMode === 'flight_sine') {
            const freq = action.sineFrequency ?? 0.05;
            const amp = action.sineAmplitude ?? 3.0;
            p.vx = (p.facing === 'right' ? 1 : -1) * speed;
            p.vy = Math.sin((p.x / 16) * freq * Math.PI * 2) * amp;
            movementOverridden = true;
          } else if (aiMode === 'wander') {
            if (Math.random() < 0.02) {
              p.facing = Math.random() < 0.5 ? 'left' : 'right';
            }
            p.vx = (p.facing === 'right' ? 1 : -1) * (speed * 0.7);
            p.isWalking = true;
            movementOverridden = true;
          } else if (aiMode === 'circle_target') {
            const t = Date.now() / 600;
            p.vx = Math.cos(t) * speed;
            p.vy = Math.sin(t) * speed;
            movementOverridden = true;
          }

          if (action.setFacing) {
            if (action.setFacing === 'left') p.facing = 'left';
            else if (action.setFacing === 'right') p.facing = 'right';
            else if (action.setFacing === 'reverse') p.facing = p.facing === 'left' ? 'right' : 'left';
          }
        }
        // 3. Gravity Override & Descend Rate
        else if (action.actionType === 'set_gravity') {
          if (action.gravityMode === 'reset_to_biome') {
            p.gravityOverride = null;
          } else {
            let gravVal = action.gravityScale ?? 1.0;
            if (action.gravityMode === 'zero_g') gravVal = 0.0;
            else if (action.gravityMode === 'low_g') gravVal = 0.3;
            else if (action.gravityMode === 'normal') gravVal = 1.0;
            else if (action.gravityMode === 'heavy_g') gravVal = 1.8;
            else if (action.gravityMode === 'inverted') gravVal = -1.0;

            if (action.gravitySource === 'variable' && action.gravityVariableId) {
              gravVal = getCharVarNum(action.gravityVariableId, gravVal);
            }
            p.gravityOverride = gravVal;
          }

          if (action.descendRate !== undefined || action.maxDescendSpeed !== undefined) {
            p.maxDescendSpeed = action.descendRate ?? action.maxDescendSpeed;
          }
        }
        // 4. Animation & Frame Control
        else if (action.actionType === 'animation' || action.actionType === 'set_frame') {
          p.requestedAnimState = action.animState || action.targetAnimationState || 'idle';
        }
        // 5. State Machine Transition
        else if (action.actionType === 'state_change' && action.targetState) {
          p.activeBehaviorState = action.targetState;
        }
        // 6. Attack Execution
        else if (action.actionType === 'attack') {
          triggerAttack();
        }
        // 7. Math Operation / Modify Variable (Supports Rule Local Variables & Prefab Variables)
        else if (action.actionType === 'math_operation' || action.actionType === 'variable_modify') {
          evaluateMathAction(action);
        }
        // 8. Set Allowed Traversal Angle (Slope & Incline Traversability)
        else if (action.actionType === 'set_traversal_angle') {
          let angle = action.traversalAngleDeg ?? 45;
          if (action.traversalAngleSource === 'variable' && action.traversalAngleVariableId) {
            angle = getCharVarNum(action.traversalAngleVariableId, angle);
          }
          p.allowedTraversalAngleDeg = Math.max(0, Math.min(90, Number(angle)));
          if (action.steepSlopeBehavior) {
            p.steepSlopeBehavior = action.steepSlopeBehavior;
          }
          if (action.steepSlideSpeed !== undefined) {
            p.steepSlideSpeed = action.steepSlideSpeed;
          }
          if (action.allowCeilingTraversal !== undefined) {
            p.allowCeilingTraversal = action.allowCeilingTraversal;
          }
        }
      };

      // ==========================================
      // BEHAVIOR RULES & SENSORY TRIGGER EVALUATION
      // ==========================================
      const rulesToEvaluate = linkedBehavior?.rules || testCharacter?.rules || [];
      if (rulesToEvaluate.length > 0) {
        // Initialize rule local variables if defined
        for (const r of rulesToEvaluate) {
          if (r.localVariables && Array.isArray(r.localVariables)) {
            for (const lv of r.localVariables) {
              if (p.localVariables[lv.id] === undefined && lv.defaultValue !== undefined) {
                p.localVariables[lv.id] = lv.defaultValue;
              }
            }
          }
        }

        // Evaluate Prefab FSM State Transitions conditioned on Behavior "IFs"
        if (testCharacter?.stateMachine?.transitions && testCharacter.stateMachine.transitions.length > 0) {
          const charStates = testCharacter.stateMachine.states || [];
          const currentStateNode = charStates.find(s => s.id === p.activeBehaviorState || s.name.toLowerCase() === (p.activeBehaviorState || '').toLowerCase());
          const currentFromId = currentStateNode ? currentStateNode.id : (p.activeBehaviorState || 'idle');

          for (const tr of testCharacter.stateMachine.transitions) {
            if (tr.fromStateId === currentFromId || tr.fromStateId === p.activeBehaviorState) {
              if (tr.behaviorRuleId) {
                const bRule = (testCharacter.rules || []).find(r => r.id === tr.behaviorRuleId);
                if (bRule && bRule.enabled) {
                  const trigList = bRule.triggers && bRule.triggers.length > 0 ? bRule.triggers : (bRule.trigger ? [bRule.trigger] : []);
                  if (trigList.length > 0) {
                    const logic = bRule.triggerLogic || 'AND';
                    const rulePassed = logic === 'OR' ? trigList.some(evaluateTrigger) : trigList.every(evaluateTrigger);
                    if (rulePassed) {
                      const targetNode = charStates.find(s => s.id === tr.toStateId);
                      p.activeBehaviorState = targetNode ? targetNode.name : tr.toStateId;
                      if (bRule.actions && bRule.actions.length > 0) {
                        for (const act of bRule.actions) {
                          executeCharacterAction(act);
                        }
                      }
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        // Execute active rules
        for (const rule of rulesToEvaluate) {
          if (!rule.enabled) continue;
          const trigList = rule.triggers && rule.triggers.length > 0 ? rule.triggers : (rule.trigger ? [rule.trigger] : []);
          if (trigList.length === 0) continue;

          const logic = rule.triggerLogic || 'AND';
          let rulePassed = false;
          if (logic === 'OR') {
            rulePassed = trigList.some(evaluateTrigger);
          } else {
            rulePassed = trigList.every(evaluateTrigger);
          }

          if (rulePassed && rule.actions && rule.actions.length > 0) {
            for (const action of rule.actions) {
              executeCharacterAction(action);
            }
          }
        }
      }

      // ==========================================
      // KINEMATIC MOVEMENT & INPUT HANDLING
      // ==========================================
      if (!movementOverridden && !p.isDashing) {
        if (charConfig.baseSpeed > 0) {
          const left = keys['KeyA'] || keys['ArrowLeft'];
          const right = keys['KeyD'] || keys['ArrowRight'];
          const effectiveAccel = p.isGrounded ? charConfig.accel : charConfig.accel * charConfig.airCtrl;
          const maxSpeed = charConfig.baseSpeed;

          if (left && !right) {
            p.vx = Math.max(p.vx - effectiveAccel, -maxSpeed);
            p.facing = 'left';
            p.isWalking = true;
          } else if (right && !left) {
            p.vx = Math.min(p.vx + effectiveAccel, maxSpeed);
            p.facing = 'right';
            p.isWalking = true;
          } else {
            p.vx *= (p.isGrounded ? 0.76 : 0.92);
            if (Math.abs(p.vx) < 0.1) p.vx = 0;
            p.isWalking = false;
          }
        } else {
          p.vx *= (p.isGrounded ? 0.76 : 0.92);
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
          p.isWalking = false;
        }

        // Jump & Action fallback triggers (only if not handled by behavior rules)
        if (!jumpTriggeredByRule && charConfig.canJump) {
          if (justPressed['Space'] || justPressed['KeyW'] || justPressed['ArrowUp']) {
            if (p.isWallSliding && charConfig.hasWallCling) {
              p.vy = -charConfig.wallJumpForceY;
              p.vx = p.facing === 'left' ? charConfig.wallJumpForceX : -charConfig.wallJumpForceX;
              p.facing = p.facing === 'left' ? 'right' : 'left';
              p.isWallSliding = false;
              p.isGrounded = false;
              p.jumpStretch = 1.3;
              for (let i = 0; i < 6; i++) {
                p.particles.push({
                  x: p.x,
                  y: p.y - 12,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -Math.random() * 3,
                  life: 12,
                  maxLife: 12,
                  color: '#38bdf8',
                  size: 2
                });
              }
            } else if (p.jumpsLeft > 0) {
              p.vy = -Math.abs(charConfig.jumpForce);
              p.jumpsLeft -= 1;
              p.isGrounded = false;
              p.isWallSliding = false;
              p.jumpStretch = 1.25;
              for (let i = 0; i < 5; i++) {
                p.particles.push({
                  x: p.x + (Math.random() - 0.5) * 12,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -Math.random() * 2,
                  life: 14,
                  maxLife: 14,
                  color: 'rgba(200, 200, 200, 0.7)',
                  size: 2
                });
              }
            }
          }
        }

        if (charConfig.hasDash && (justPressed['ShiftLeft'] || justPressed['ShiftRight'] || justPressed['KeyC'])) {
          triggerDash();
        }

        if (charConfig.hasAttack && (justPressed['KeyJ'] || justPressed['KeyZ'])) {
          triggerAttack();
        }

        if (charConfig.hasSpecial && (justPressed['KeyK'] || justPressed['KeyX'])) {
          triggerSpecial();
        }

        // Apply environmental or overridden gravity with descend rate clamping
        p.vy += 0.52 * effectiveGravScale;
        if (p.maxDescendSpeed !== null) {
          p.vy = Math.min(p.vy, p.maxDescendSpeed);
        } else {
          p.vy = Math.min(p.vy, 14);
        }
      }

      // Wall Cling / Wall Slide Detection
      let wallTouching: 'left' | 'right' | null = null;
      if (!p.isGrounded && p.vy > 0 && charConfig.hasWallCling) {
        const checkTileY = Math.floor((p.y - charH / 2) / TILE_SIZE);
        const tileLeftX = Math.floor((p.x - halfW - 2) / TILE_SIZE);
        const tileRightX = Math.floor((p.x + halfW + 2) / TILE_SIZE);

        if (isSolidTile(tileLeftX, checkTileY) && (keys['KeyA'] || keys['ArrowLeft'])) {
          wallTouching = 'left';
        } else if (isSolidTile(tileRightX, checkTileY) && (keys['KeyD'] || keys['ArrowRight'])) {
          wallTouching = 'right';
        }

        if (wallTouching) {
          p.vy = Math.min(p.vy, 2.0 * (1 - charConfig.wallFriction));
          p.isWallSliding = true;
          p.facing = wallTouching === 'left' ? 'left' : 'right';
        } else {
          p.isWallSliding = false;
        }
      } else if (p.maxDescendSpeed !== null && !p.isGrounded && p.vy > 0) {
        p.isWallSliding = true;
      } else {
        p.isWallSliding = false;
      }

      // 1. Move X with Collision Check (using dynamic capsule height for ducking & slope traversal)
      const dynamicCharH = charH * (p.isDucking ? 0.5 : (p.capsuleHeightMultiplier || 1.0));
      const stepHeight = 6;
      const numSamples = 4;
      const originalY = p.y;
      const isGroundedBefore = p.isGrounded;

      // Helper to query the highest ground surface or slope under a specific horizontal world pixel coordinate
      const getGroundSurfaceAt = (worldX: number, currentY: number) => {
        const tx = Math.floor(worldX / TILE_SIZE);
        // Search tile rows around the current feet level for possible ground blocks
        const startTy = Math.floor((currentY - 16) / TILE_SIZE);
        const endTy = Math.floor((currentY + 16) / TILE_SIZE);
        
        let highestSurfaceY: number | null = null;
        let isSlope = false;
        let slopeShape: string | undefined = undefined;

        for (let ty = startTy; ty <= endTy; ty++) {
          const cell = getCell(mapData, tx, ty);
          if (cell && cell.tile_type_id) {
            const shape = getEffectiveTileShape(tx, ty);
            const isWalkable = shape === 'slope_up_right_45' || shape === 'slope_up_left_45';
            const isSolidFlat = !shape || !shape.includes('slope');
            
            if (isWalkable) {
              const h = getTileSurfaceHeightAt(tx, ty, worldX, shape, TILE_SIZE);
              if (h !== null) {
                if (highestSurfaceY === null || h < highestSurfaceY) {
                  highestSurfaceY = h;
                  isSlope = true;
                  slopeShape = shape;
                }
              }
            } else if (isSolidFlat) {
              const tileTop = ty * TILE_SIZE;
              if (highestSurfaceY === null || tileTop < highestSurfaceY) {
                highestSurfaceY = tileTop;
                isSlope = false;
                slopeShape = undefined;
              }
            }
          }
        }

        if (highestSurfaceY !== null) {
          return { y: highestSurfaceY, isSlope, slopeShape };
        }
        return null;
      };

      const testX = p.x + p.vx;
      const sideX = p.vx > 0 ? testX + halfW : testX - halfW;
      const testTileX = Math.floor(sideX / TILE_SIZE);
      let isBlockedX = false;

      // Probe multiple points vertically along the player's side to detect solid walls, bypassing the foot/step region
      for (let i = 0; i < numSamples; i++) {
        const checkY = p.y - stepHeight - (i / (numSamples - 1)) * (dynamicCharH - stepHeight - 2);
        const testTileY = Math.floor(checkY / TILE_SIZE);
        const cell = getCell(mapData, testTileX, testTileY);
        if (cell && cell.tile_type_id) {
          const shape = getEffectiveTileShape(testTileX, testTileY);
          const isSolidFlat = !shape || !shape.includes('slope');
          
          if (isSolidFlat) {
            isBlockedX = true;
            break;
          }
          
          // Block if running into the steep reverse back-wall of a slope
          if (shape === 'slope_up_left_45' && p.vx > 0) {
            isBlockedX = true;
            break;
          }
          if (shape === 'slope_up_right_45' && p.vx < 0) {
            isBlockedX = true;
            break;
          }
        }
      }

      const allowedAngle = p.allowedTraversalAngleDeg ?? 45;

      // Check if entering a slope that exceeds our maximum permitted traversal angle
      if (!isBlockedX && p.vx !== 0) {
        const fwdProbeX = p.x + p.vx + (p.vx > 0 ? halfW : -halfW);
        const fwdSlope = checkSlopeAt(fwdProbeX, p.y - 2);
        if (fwdSlope.isWalkableSlope && fwdSlope.angleDeg > allowedAngle) {
          if (p.steepSlopeBehavior === 'slide_down') {
            p.vx = (fwdSlope.direction === 'up_right' ? -1 : 1) * (p.steepSlideSpeed || 3.5);
            isBlockedX = true;
          } else if (p.steepSlopeBehavior === 'slow_down') {
            p.vx *= 0.35;
          } else {
            isBlockedX = true;
          }
        }
      }

      if (isBlockedX) {
        p.vx = 0;
      } else {
        p.x = testX;

        // Ground snapping traversal for climbs and descents
        if (isGroundedBefore) {
          const groundInfo = getGroundSurfaceAt(p.x, originalY);
          if (groundInfo) {
            const maxStepUp = 12;
            const maxSnapDown = 14;
            const heightDiff = originalY - groundInfo.y; // Positive is climbing up, negative is climbing down
            
            if (heightDiff >= -maxSnapDown && heightDiff <= maxStepUp) {
              p.y = groundInfo.y;
              p.vy = 0;
              p.isGrounded = true;
            } else {
              p.isGrounded = false;
            }
          } else {
            p.isGrounded = false;
          }
        }
      }

      // 2. Move Y with Collision Check
      const nextY = p.y + p.vy;
      if (p.vy >= 0) {
        // Falling or stationary on ground
        let highestGroundY: number | null = null;
        let groundedOnSlope = false;
        let slopeShape: string | undefined = undefined;

        const feetSamples = [p.x, p.x - halfW + 2, p.x + halfW - 2];
        feetSamples.forEach(sampleX => {
          const groundInfo = getGroundSurfaceAt(sampleX, nextY);
          if (groundInfo) {
            // Check if the falling position is within landing threshold of the surface
            if (nextY >= groundInfo.y - 8 && nextY <= groundInfo.y + 8) {
              if (highestGroundY === null || groundInfo.y < highestGroundY) {
                highestGroundY = groundInfo.y;
                groundedOnSlope = groundInfo.isSlope;
                slopeShape = groundInfo.slopeShape;
              }
            }
          }
        });

        if (highestGroundY !== null) {
          p.y = highestGroundY;
          if (p.vy > 5) {
            p.landingSquash = 1.3;
            for (let i = 0; i < 4; i++) {
              p.particles.push({
                x: p.x + (Math.random() - 0.5) * 14,
                y: p.y,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 1.5,
                life: 12,
                maxLife: 12,
                color: 'rgba(210, 210, 210, 0.6)',
                size: 2
              });
            }
          }
          p.vy = 0;
          p.isGrounded = true;
          p.isWallSliding = false;
          p.jumpsLeft = charConfig.totalJumps;

          // Slide off steep slopes if configured
          if (groundedOnSlope && slopeShape) {
            const slopeInfo = checkSlopeAt(p.x, p.y - 2);
            if (slopeInfo.isWalkableSlope && slopeInfo.angleDeg > allowedAngle) {
              if (p.steepSlopeBehavior === 'slide_down') {
                const slideDir = slopeInfo.direction === 'up_right' ? -1 : 1;
                p.vx = slideDir * (p.steepSlideSpeed || 3.5);
              }
            }
          }
        } else {
          p.y = nextY;
          p.isGrounded = false;
        }
      } else {
        // Jumping up (Ceiling Check)
        let isCeilingBlocked = false;
        let ceilingY: number | null = null;

        const headSamples = [p.x, p.x - halfW + 2, p.x + halfW - 2];
        headSamples.forEach(sampleX => {
          const tx = Math.floor(sampleX / TILE_SIZE);
          const ty = Math.floor((nextY - dynamicCharH) / TILE_SIZE);
          const cell = getCell(mapData, tx, ty);
          if (cell && cell.tile_type_id) {
            const shape = getEffectiveTileShape(tx, ty);
            const isSolidFlat = !shape || !shape.includes('slope');
            
            if (isSolidFlat || shape === 'slope_down_right_45' || shape === 'slope_down_left_45') {
              isCeilingBlocked = true;
              const tileBottom = (ty + 1) * TILE_SIZE;
              if (ceilingY === null || tileBottom > ceilingY) {
                ceilingY = tileBottom;
              }
            }
          }
        });

        if (isCeilingBlocked && ceilingY !== null) {
          p.y = ceilingY + dynamicCharH;
          p.vy = 0;
        } else {
          p.y = nextY;
          p.isGrounded = false;
        }
      }

      // Clear frame single-press keys and mouse states at end of tick
      justPressedKeysRef.current = {};
      justReleasedKeysRef.current = {};
      justPressedMouseRef.current = {};
      justReleasedMouseRef.current = {};
      mouseWheelRef.current = { up: false, down: false };
      mouseMovedRef.current = false;

      // Store previous velocity for apex / directional change detection
      p.prevVx = p.vx;
      p.prevVy = p.vy;

      // Update Particles
      p.particles.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
      });
      p.particles = p.particles.filter(pt => pt.life > 0);

      // Update Ghost Trails
      p.ghostTrails.forEach(gt => {
        gt.alpha -= 0.08;
      });
      p.ghostTrails = p.ghostTrails.filter(gt => gt.alpha > 0);

      // Update Slashes
      p.slashes.forEach(sl => {
        sl.frame++;
      });
      p.slashes = p.slashes.filter(sl => sl.frame < sl.maxFrames);

      // Smooth Camera Follow
      const targetPanX = canvasWidth / 2 - p.x * scale;
      const targetPanY = canvasHeight / 2 - (p.y - 20) * scale;
      const prevPan = viewport.panRef.current;
      viewport.panRef.current = {
        x: prevPan.x + (targetPanX - prevPan.x) * 0.12,
        y: prevPan.y + (targetPanY - prevPan.y) * 0.12
      };

      // Update HUD State periodically (Throttled to 10Hz to prevent React re-render thrashing during 60 FPS play)
      const nowMs = performance.now();
      if (nowMs - lastHudUpdateRef.current > 120) {
        lastHudUpdateRef.current = nowMs;
        const newStam = Math.round(p.stamina);
        const newMana = Math.round(p.mana);
        setHudState(prev => {
          if (
            prev.health !== p.health ||
            Math.abs(prev.stamina - newStam) >= 2 ||
            Math.abs(prev.mana - newMana) >= 2 ||
            prev.isGrounded !== p.isGrounded ||
            prev.isWallSliding !== p.isWallSliding ||
            prev.facing !== p.facing
          ) {
            return {
              health: p.health,
              maxHealth: charConfig.maxHp,
              stamina: newStam,
              mana: newMana,
              isGrounded: p.isGrounded,
              isWallSliding: p.isWallSliding,
              facing: p.facing
            };
          }
          return prev;
        });
      }
      
      particleEngineRef.current.update(dt, {}, mapData.height * 64 + 1000);
      animId = requestAnimationFrame(physicsTick);
    };

    animId = requestAnimationFrame(physicsTick);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [mode, mapData, canvasWidth, canvasHeight, scale, setPan, respawnPlayer, charConfig]);

  // Main Render Loop: 7-Layer Parallax Architecture & 64px Dual-Noise Blended Terrain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const renderFrame = () => {
      const currentPan = viewport.panRef.current;
      ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const fadeAlpha = fadeAlphaRef.current;
    const prevBiome = prevBiomeRef.current;
    const currBiome = currentBiomeRef.current !== undefined ? currentBiomeRef.current : targetBiome;

    // Helper to render background layers for a biome with opacity multiplier
    const renderBiomeBg = (biomeToRender: RefinedBiome, opacityMult: number) => {
      if (!showParallaxBg || !biomeToRender?.parallaxLayers || opacityMult <= 0.001) return;
      const bgLayers = biomeToRender.parallaxLayers
        .filter(l => l.layerIndex < 0)
        .sort((a, b) => a.layerIndex - b.layerIndex);

      bgLayers.forEach(layer => {
        renderParallaxLayer(
          ctx,
          layer,
          canvasWidth,
          canvasHeight,
          currentPan.x,
          currentPan.y,
          scale,
          biomeToRender,
          opacityMult,
          () => setRenderTrigger(t => t + 1)
        );
      });
    };

    // ==========================================
    // 1. RENDER PARALLAX BACKGROUND LAYERS (-5 to -1) WITH SMOOTH FADE
    // ==========================================
    if (prevBiome && fadeAlpha < 1.0) {
      renderBiomeBg(prevBiome, 1.0 - fadeAlpha);
    }
    if (currBiome) {
      renderBiomeBg(currBiome, fadeAlpha);
    }

    // ==========================================
    // APPLY CAMERA TRANSFORM (World Space)
    // ==========================================
    ctx.save();
    ctx.translate(currentPan.x, currentPan.y);
    ctx.scale(scale, scale);

    // ==========================================
    // VIEWPORT FRUSTUM CULLING CALCULATION
    // ==========================================
    const minVisTileX = Math.floor((-currentPan.x / scale) / TILE_SIZE) - 1;
    const maxVisTileX = Math.ceil(((canvasWidth - currentPan.x) / scale) / TILE_SIZE) + 1;
    const minVisTileY = Math.floor((-currentPan.y / scale) / TILE_SIZE) - 1;
    const maxVisTileY = Math.ceil(((canvasHeight - currentPan.y) / scale) / TILE_SIZE) + 1;

    const minVisChunkX = Math.floor(minVisTileX / CHUNK_SIZE);
    const maxVisChunkX = Math.floor(maxVisTileX / CHUNK_SIZE);
    const minVisChunkY = Math.floor(minVisTileY / CHUNK_SIZE);
    const maxVisChunkY = Math.floor(maxVisTileY / CHUNK_SIZE);

    const visibleChunks: Array<{ key: string; cx: number; cy: number; chunk: RefinedCellState[] }> = [];
    if (mapData.chunks) {
      for (let cy = minVisChunkY; cy <= maxVisChunkY; cy++) {
        for (let cx = minVisChunkX; cx <= maxVisChunkX; cx++) {
          const key = `${cx},${cy}`;
          const chunk = mapData.chunks[key];
          if (chunk && Array.isArray(chunk)) {
            visibleChunks.push({ key, cx, cy, chunk });
          }
        }
      }
    }

    // ==========================================
    // 2. RENDER BIOME CELL ATMOSPHERE TINT (Blank Air Tiles)
    // ==========================================
    if (mapData.chunks) {
      visibleChunks.forEach(({ cx, cy, chunk }) => {
        for (let i = 0; i < chunk.length; i++) {
          const cell = chunk[i];
          if (!cell || cell.tile_type_id) continue;
          const cellBiome = biomeMap[cell.biome_id] || activeBiome;
          if (cellBiome?.atmosphereFogColor) {
            const lx = i % CHUNK_SIZE;
            const ly = Math.floor(i / CHUNK_SIZE);
            const screenX = (cx * CHUNK_SIZE + lx) * TILE_SIZE;
            const screenY = (cy * CHUNK_SIZE + ly) * TILE_SIZE;
            ctx.fillStyle = cellBiome.atmosphereFogColor;
            ctx.globalAlpha = cellBiome.atmosphereFogDensity || 0.15;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1.0;
          }
        }
      });
    } else if (mapData.cells) {
      const startY = Math.max(0, minVisTileY);
      const endY = Math.min(mapData.height - 1, maxVisTileY);
      const startX = Math.max(0, minVisTileX);
      const endX = Math.min(mapData.width - 1, maxVisTileX);

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const cell = mapData.cells?.[y]?.[x];
          if (cell && !cell.tile_type_id) {
            const cellBiome = biomeMap[cell.biome_id] || activeBiome;
            if (cellBiome?.atmosphereFogColor) {
              ctx.fillStyle = cellBiome.atmosphereFogColor;
              ctx.globalAlpha = cellBiome.atmosphereFogDensity || 0.15;
              ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }
    }

    // ==========================================
    // 3. LAYER 0: MAIN GAMEPLAY PLANE (Lazy Per-Chunk Cached Rendering with Slope/Shape Support)
    // ==========================================
    if (mapData.chunks) {
      visibleChunks.forEach(({ cx, cy }) => {
        const chunkCanvas = globalChunkCache.getOrBakeChunk(
          cx,
          cy,
          mapData,
          tileTypeMap,
          showDamageMasks,
          () => setRenderTrigger(t => t + 1)
        );
        if (chunkCanvas) {
          const chunkScreenX = cx * CHUNK_SIZE * TILE_SIZE;
          const chunkScreenY = cy * CHUNK_SIZE * TILE_SIZE;
          ctx.drawImage(chunkCanvas, chunkScreenX, chunkScreenY);
        }
      });
    } else {
      const numChunksX = Math.ceil(mapData.width / CHUNK_SIZE);
      const numChunksY = Math.ceil(mapData.height / CHUNK_SIZE);
      const startCY = Math.max(0, minVisChunkY);
      const endCY = Math.min(numChunksY - 1, maxVisChunkY);
      const startCX = Math.max(0, minVisChunkX);
      const endCX = Math.min(numChunksX - 1, maxVisChunkX);

      for (let cy = startCY; cy <= endCY; cy++) {
        for (let cx = startCX; cx <= endCX; cx++) {
          const chunkCanvas = globalChunkCache.getOrBakeChunk(
            cx,
            cy,
            mapData,
            tileTypeMap,
            showDamageMasks,
            () => setRenderTrigger(t => t + 1)
          );

          if (chunkCanvas) {
            const chunkScreenX = cx * CHUNK_SIZE * TILE_SIZE;
            const chunkScreenY = cy * CHUNK_SIZE * TILE_SIZE;
            ctx.drawImage(chunkCanvas, chunkScreenX, chunkScreenY);
          }
        }
      }
    }

    // ==========================================
    // 4. LAYER 0: DETAILS, WILDLIFE & INTERACTIVES (Single-Pass Frustum Culled Loop)
    // ==========================================
    const renderCellDetails = (cell: RefinedCellState, x: number, y: number) => {
      const screenX = x * TILE_SIZE;
      const screenY = y * TILE_SIZE;

      // Environmental Details
      if (cell.environmental_detail_id) {
        const env = envDetailMap[cell.environmental_detail_id];
        if (env) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 6, TILE_SIZE * 0.35, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(env.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }

      // Wildlife
      if (cell.wildlife_id) {
        const fauna = wildlifeMap[cell.wildlife_id];
        if (fauna) {
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fauna.icon, screenX + TILE_SIZE * 0.7, screenY + TILE_SIZE * 0.3);
        }
      }

      // Interactive Details
      if (cell.interactive_detail_id) {
        const item = interactiveDetailMap[cell.interactive_detail_id];
        if (item) {
          ctx.strokeStyle = item.color || '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }
    };

    if (mapData.chunks) {
      visibleChunks.forEach(({ cx, cy, chunk }) => {
        for (let i = 0; i < chunk.length; i++) {
          const cell = chunk[i];
          if (!cell) continue;
          if (cell.environmental_detail_id || cell.wildlife_id || cell.interactive_detail_id) {
            const lx = i % CHUNK_SIZE;
            const ly = Math.floor(i / CHUNK_SIZE);
            renderCellDetails(cell, cx * CHUNK_SIZE + lx, cy * CHUNK_SIZE + ly);
          }
        }
      });
    } else if (mapData.cells) {
      const startY = Math.max(0, minVisTileY);
      const endY = Math.min(mapData.height - 1, maxVisTileY);
      const startX = Math.max(0, minVisTileX);
      const endX = Math.min(mapData.width - 1, maxVisTileX);

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const cell = mapData.cells?.[y]?.[x];
          if (cell) {
            renderCellDetails(cell, x, y);
          }
        }
      }
    }

        // ==========================================
    // 8. GRID OVERLAY & CHUNK OUTLINES
    // ==========================================
    if (showGrid) {
      // Tile Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 / scale; // Keep lines 1px regardless of zoom
      ctx.beginPath();
      
      const startCol = Math.floor((-currentPan.x / scale) / TILE_SIZE);
      const endCol = startCol + Math.ceil((canvasWidth / scale) / TILE_SIZE) + 1;
      const startRow = Math.floor((-currentPan.y / scale) / TILE_SIZE);
      const endRow = startRow + Math.ceil((canvasHeight / scale) / TILE_SIZE) + 1;

      for (let x = startCol; x <= endCol; x++) {
        ctx.moveTo(x * TILE_SIZE, startRow * TILE_SIZE);
        ctx.lineTo(x * TILE_SIZE, endRow * TILE_SIZE);
      }
      for (let y = startRow; y <= endRow; y++) {
        ctx.moveTo(startCol * TILE_SIZE, y * TILE_SIZE);
        ctx.lineTo(endCol * TILE_SIZE, y * TILE_SIZE);
      }
      ctx.stroke();

      // Chunk Outlines
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([10 / scale, 10 / scale]);
      ctx.beginPath();
      
      const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;
      if (mapData.chunks) {
        Object.keys(mapData.chunks).forEach(key => {
          const [cx, cy] = key.split(',').map(Number);
          ctx.rect(cx * chunkPixelSize, cy * chunkPixelSize, chunkPixelSize, chunkPixelSize);
        });
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ==========================================
    // 8b. POLYGON COLLIDER WIREFRAME OVERLAY
    // ==========================================
    if (showColliders) {
      ctx.save();
      
      // --- Merged Polygon Colliders (Thick Contiguous Outline contour paths) ---
      const mergedPolygons = getMergedPolygonColliders(mapData, tileTypeMap);

      mergedPolygons.forEach((poly) => {
        if (poly.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();

        // Semi-transparent fills for contiguous solid islands
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'; // Very subtle cyan fill
        ctx.fill();

        // Glowing bold outer contour line
        ctx.strokeStyle = '#22d3ee'; // Bright neon cyan
        ctx.lineWidth = Math.max(2.0 / scale, 1.5);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Vertex Dots for simplified geometric vertices
        if (scale > 0.3) {
          ctx.fillStyle = '#ffffff';
          poly.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(3.0 / scale, 1.5), 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 0.75 / scale;
            ctx.stroke();
          });
        }
      });

      ctx.restore();
    }

    // ==========================================
    // 9. LIT MODE OVERLAY (Darkness)
    // ==========================================
    if (isLitMode) {
      const bounds = calculateMapBounds(mapData);
      ctx.fillStyle = 'rgba(0, 0, 5, 0.6)'; // Global darkness
      ctx.fillRect(
        bounds.minX * TILE_SIZE, 
        bounds.minY * TILE_SIZE, 
        (bounds.maxX - bounds.minX + 1) * TILE_SIZE, 
        (bounds.maxY - bounds.minY + 1) * TILE_SIZE
      );
    }

    // ==========================================
    // 10. LIGHT DASHED BRUSH PREVIEW OUTLINE
    // ==========================================
    if (hoverTile && (mode as string) !== 'pan') {
      const brushTiles = getBrushTiles(hoverTile.x, hoverTile.y, brushSize, activeTool);

      let fillColor = 'rgba(56, 189, 248, 0.16)';
      let strokeColor = 'rgba(56, 189, 248, 0.95)';

      if (activeTool === 'eraser') {
        fillColor = 'rgba(244, 63, 94, 0.22)';
        strokeColor = 'rgba(244, 63, 94, 0.95)';
      } else if (activeTool === 'chunk_add') {
        fillColor = 'rgba(168, 85, 247, 0.2)';
        strokeColor = 'rgba(192, 132, 252, 0.95)';
      } else if (activeTool === 'chunk_delete') {
        fillColor = 'rgba(239, 68, 68, 0.25)';
        strokeColor = 'rgba(248, 113, 113, 0.95)';
      }

      ctx.save();
      
      // 1. Light translucent tile highlight fills
      ctx.fillStyle = fillColor;
      for (const t of brushTiles) {
        ctx.fillRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      // 2. Light dashed grid outline for every tile in the brush
      ctx.setLineDash([4 / scale, 3 / scale]);
      ctx.lineWidth = Math.max(1.2 / scale, 1);
      ctx.strokeStyle = strokeColor;
      for (const t of brushTiles) {
        ctx.strokeRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      // 3. Bold dashed outer bounding border for multi-tile brushes or chunks
      if (brushTiles.length > 1) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const t of brushTiles) {
          if (t.x < minX) minX = t.x;
          if (t.y < minY) minY = t.y;
          if (t.x > maxX) maxX = t.x;
          if (t.y > maxY) maxY = t.y;
        }
        const boxX = minX * TILE_SIZE;
        const boxY = minY * TILE_SIZE;
        const boxW = (maxX - minX + 1) * TILE_SIZE;
        const boxH = (maxY - minY + 1) * TILE_SIZE;

        ctx.setLineDash([8 / scale, 4 / scale]);
        ctx.lineWidth = Math.max(2.5 / scale, 1.5);
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Brush size pill badge
        if (scale > 0.25) {
          ctx.setLineDash([]);
          const badgeText = activeTool?.startsWith('chunk_') 
            ? '16×16 CHUNK' 
            : `${brushSize}×${brushSize} (${brushTiles.length}T)`;
          
          ctx.font = `bold ${Math.max(11 / scale, 10)}px monospace`;
          const textWidth = ctx.measureText(badgeText).width;
          const badgeX = boxX + boxW / 2 - textWidth / 2 - 4 / scale;
          const badgeY = boxY - 16 / scale;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(badgeX, badgeY, textWidth + 8 / scale, 15 / scale);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1 / scale;
          ctx.strokeRect(badgeX, badgeY, textWidth + 8 / scale, 15 / scale);

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX + 4 / scale, badgeY + 7.5 / scale);
        }
      }

      ctx.restore();
    }

    // ==========================================
    // 11. CHARACTER SPAWN & TEST PLAYER RENDERING
    // ==========================================
    const spriteInfo = getCharacterSpriteInfo(testCharacter);

    if (mode === 'paint') {
      // Draw Placed Prefab Spawn Point Marker
      const spawnX = (spawnPoint?.x ?? 4) * TILE_SIZE + TILE_SIZE / 2;
      const spawnY = (spawnPoint?.y ?? 12) * TILE_SIZE + TILE_SIZE;
      const charColor = testCharacter?.tintColor || '#06b6d4';
      const facing = spawnPoint?.facing || 'right';

      ctx.save();
      // 1. Pulsing Ground Ring
      const pulseTime = performance.now() / 1000;
      const ringRadius = 13 + Math.sin(pulseTime * 3) * 2;
      
      ctx.beginPath();
      ctx.ellipse(spawnX, spawnY - 2, ringRadius, ringRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${charColor}33`;
      ctx.fill();
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeStyle = charColor;
      ctx.stroke();

      // 2. Vertical Beacon Ray
      const grad = ctx.createLinearGradient(spawnX, spawnY, spawnX, spawnY - 48);
      grad.addColorStop(0, `${charColor}55`);
      grad.addColorStop(1, `${charColor}00`);
      ctx.fillStyle = grad;
      ctx.fillRect(spawnX - 12, spawnY - 48, 24, 48);

      // 3. Collision Capsule Outline
      const capRad = charConfig.radius;
      const capH = charConfig.height;
      const halfH = Math.max(0, (capH - capRad * 2) / 2);
      const capOx = charConfig.offsetX;
      const capOy = charConfig.offsetY;

      // In Prefab Studio, the capsule center is at (capOx, capOy) relative to sprite center (0,0).
      // On the map, the bottom of the capsule rests on the ground at spawnY (or p.y).
      // Therefore, the capsule center is at (spawnX, spawnY - capH / 2).
      // And the sprite center is at (spawnX - capOx, spawnY - (capOy + capH / 2)).
      const spriteTileH = spriteInfo?.tileH || testCharacter?.spriteHeight || 64;
      const spriteTileW = spriteInfo?.tileW || testCharacter?.spriteWidth || 64;
      const spriteCenterX = spawnX - capOx;
      const spriteCenterY = spawnY - (capOy + capH / 2);
      const capsuleCenterY = spawnY - capH / 2;

      ctx.save();
      ctx.translate(spawnX, capsuleCenterY);
      ctx.strokeStyle = `${charColor}ee`;
      ctx.fillStyle = `${charColor}22`;
      ctx.setLineDash([3 / scale, 3 / scale]);
      ctx.lineWidth = 1.2 / scale;
      ctx.beginPath();
      ctx.arc(0, -halfH, capRad, Math.PI, 0);
      ctx.arc(0, halfH, capRad, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 4. Render Real Prefab Sprite Frame (Idle frame 0)
      if (spriteInfo && spriteInfo.img.complete && spriteInfo.img.naturalWidth > 0) {
        const { img, tileW, tileH, cols } = spriteInfo;
        const idleAnim = testCharacter?.animations?.find(a => a.stateId === 'idle') || testCharacter?.animations?.[0];
        const frameIdx = idleAnim?.startFrameIndex || 0;
        const col = frameIdx % cols;
        const row = Math.floor(frameIdx / cols);
        const srcX = col * tileW;
        const srcY = row * tileH;

        ctx.save();
        ctx.translate(spriteCenterX, spriteCenterY);
        if (facing === 'left') {
          ctx.scale(-1, 1);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          srcX, srcY, tileW, tileH,
          -tileW / 2, -tileH / 2, tileW, tileH
        );
        ctx.restore();
      } else {
        // Fallback Capsule Silhouette aligned with sprite center
        ctx.fillStyle = charColor;
        ctx.beginPath();
        ctx.roundRect(spriteCenterX - 10, spriteCenterY - 14, 20, 28, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();

        ctx.font = `${Math.max(12, 12 / scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(testCharacter?.avatarIcon || '🛡️', spriteCenterX, spriteCenterY);
      }

      // 5. Facing Arrow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (facing === 'right') {
        ctx.moveTo(spawnX + 16, spawnY - 14);
        ctx.lineTo(spawnX + 10, spawnY - 19);
        ctx.lineTo(spawnX + 10, spawnY - 9);
      } else {
        ctx.moveTo(spawnX - 16, spawnY - 14);
        ctx.lineTo(spawnX - 10, spawnY - 19);
        ctx.lineTo(spawnX - 10, spawnY - 9);
      }
      ctx.fill();

      // 6. Name & Spawn Badge
      const spawnLabel = `📍 SPAWN • ${testCharacter?.name || 'Player'}`;
      ctx.font = `bold ${Math.max(9 / scale, 8)}px monospace`;
      const textW = ctx.measureText(spawnLabel).width;
      const bX = spawnX - textW / 2 - 4 / scale;
      const bY = spawnY - Math.max(36, capH) - 18 / scale;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(bX, bY, textW + 8 / scale, 12 / scale);
      ctx.strokeStyle = charColor;
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(bX, bY, textW + 8 / scale, 12 / scale);
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(spawnLabel, spawnX, bY + 6 / scale);

      // 7. Hover Spawn Placement Preview
      if (activeTool === 'spawn_place' && hoverTile) {
        const hX = hoverTile.x * TILE_SIZE + TILE_SIZE / 2;
        const hY = hoverTile.y * TILE_SIZE + TILE_SIZE;
        const hSpriteCenterX = hX - capOx;
        const hSpriteCenterY = hY - (capOy + capH / 2);

        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.setLineDash([4 / scale, 3 / scale]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5 / scale;
        ctx.beginPath();
        ctx.ellipse(hX, hY - 2, 14, 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (spriteInfo && spriteInfo.img.complete && spriteInfo.img.naturalWidth > 0) {
          const { img, tileW, tileH, cols } = spriteInfo;
          const idleAnim = testCharacter?.animations?.find(a => a.stateId === 'idle') || testCharacter?.animations?.[0];
          const frameIdx = idleAnim?.startFrameIndex || 0;
          const col = frameIdx % cols;
          const row = Math.floor(frameIdx / cols);
          const srcX = col * tileW;
          const srcY = row * tileH;

          ctx.save();
          ctx.translate(hSpriteCenterX, hSpriteCenterY);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            srcX, srcY, tileW, tileH,
            -tileW / 2, -tileH / 2, tileW, tileH
          );
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.roundRect(hSpriteCenterX - 10, hSpriteCenterY - 14, 20, 28, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = `${Math.max(12, 12 / scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(testCharacter?.avatarIcon || '📍', hSpriteCenterX, hSpriteCenterY);
        }

        const placeLabel = `CLICK TO PLACE SPAWN • ${testCharacter?.name || 'Player'}`;
        ctx.font = `bold ${Math.max(9 / scale, 8)}px monospace`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(placeLabel, hX, hY - Math.max(34, charConfig.height) - 14 / scale);
        ctx.restore();
      }

      ctx.restore();
    } else if (mode === 'play') {
      // ==========================================
      // PLAY MODE: RENDER INTERACTIVE TEST CHARACTER
      // ==========================================
      const p = playerRef.current;
      const charColor = testCharacter?.tintColor || '#06b6d4';

      ctx.save();

      // 1. Ghost Shadow Trails (Dash Effect)
      p.ghostTrails.forEach(gt => {
        ctx.save();
        ctx.globalAlpha = gt.alpha * 0.6;
        ctx.fillStyle = gt.color;
        ctx.beginPath();
        ctx.roundRect(gt.x - 7, gt.y - 28, 14, 26, 6);
        ctx.fill();
        ctx.restore();
      });

      // 2. Ground Contact Shadow
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 1, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // 3. Resolve Current Animation State
      let animState = p.requestedAnimState || p.activeBehaviorState || 'idle';
      if (!p.requestedAnimState && (!p.activeBehaviorState || p.activeBehaviorState === 'idle')) {
        if (p.isAttacking) {
          animState = 'attack';
        } else if (p.isDashing) {
          animState = 'run';
        } else if (p.isWallSliding) {
          animState = 'wall_slide';
        } else if (!p.isGrounded) {
          animState = 'jump';
        } else if (p.isDucking) {
          animState = 'duck';
        } else if (p.isWalking) {
          animState = Math.abs(p.vx) > 3.2 ? 'run' : 'walk';
        } else {
          animState = 'idle';
        }
      }

      const activeAnim = testCharacter?.animations?.find(a => a.stateId === animState || (a as any)?.name?.toLowerCase() === animState.toLowerCase())
        || (p.isDucking ? testCharacter?.animations?.find(a => a.stateId === 'crouch' || (a as any)?.name?.toLowerCase() === 'crouch') : undefined)
        || testCharacter?.animations?.find(a => a.stateId === (testCharacter as any)?.defaultAnimationState)
        || testCharacter?.animations?.find(a => a.stateId === 'idle')
        || testCharacter?.animations?.[0];

      // 4. Animated Prefab Body (with Squash & Stretch and Real Spritesheet Frame)
      const spriteTileH = spriteInfo?.tileH || testCharacter?.spriteHeight || 64;
      const spriteTileW = spriteInfo?.tileW || testCharacter?.spriteWidth || 64;
      const capOx = charConfig.offsetX;
      const capOy = charConfig.offsetY;
      const capH = charConfig.height;
      const pSpriteCenterX = p.x - capOx;
      const pSpriteCenterY = p.y - (capOy + capH / 2);

      ctx.save();
      // Translate to prefab sprite center
      ctx.translate(pSpriteCenterX, pSpriteCenterY);

      // Run animation bounce / tilt
      const runBounce = p.isWalking && p.isGrounded ? Math.sin(p.animTime * 10) * 1.5 : 0;
      const runTilt = p.isWalking && p.isGrounded ? (p.facing === 'right' ? 0.06 : -0.06) : 0;
      ctx.rotate(runTilt);

      let scaleX = (p.facing === 'left' ? -1 : 1) * p.landingSquash;
      let scaleY = p.jumpStretch / p.landingSquash;
      ctx.scale(scaleX, scaleY);

      if (spriteInfo && spriteInfo.img.complete && spriteInfo.img.naturalWidth > 0 && activeAnim) {
        const { img, tileW, tileH, cols } = spriteInfo;
        const startIdx = activeAnim.startFrameIndex || 0;
        const endIdx = activeAnim.endFrameIndex !== undefined ? activeAnim.endFrameIndex : startIdx;
        const span = Math.max(1, endIdx - startIdx + 1);
        const fps = Math.max(1, activeAnim.frameRateFps || 8);
        const frameOffset = Math.floor(p.animTime * fps) % span;
        const globalFrame = startIdx + frameOffset;

        const col = globalFrame % cols;
        const row = Math.floor(globalFrame / cols);
        const srcX = col * tileW;
        const srcY = row * tileH;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          srcX, srcY, tileW, tileH,
          -tileW / 2, -tileH / 2 + runBounce, tileW, tileH
        );
      } else {
        // Fallback Body Capsule
        const bodyGrad = ctx.createLinearGradient(0, -14 + runBounce, 0, 14 + runBounce);
        bodyGrad.addColorStop(0, charColor);
        bodyGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-8, -14 + runBounce, 16, 27, 6);
        ctx.fill();
        ctx.lineWidth = 1.2 / scale;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Visor / Eyes in facing direction
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, -8 + runBounce, 3, 3);

        // Prefab Avatar Icon inside body
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(testCharacter?.avatarIcon || '🛡️', 0, 0 + runBounce);
      }

      ctx.restore();

      // 5. Weapon Slash Arc Trajectory
      p.slashes.forEach(sl => {
        const progress = sl.frame / sl.maxFrames;
        const slashRadius = 24;
        const startAngle = sl.facing === 'right' ? -Math.PI * 0.45 : Math.PI * 0.45;
        const endAngle = sl.facing === 'right' ? Math.PI * 0.45 : -Math.PI * 0.45;
        const currentAngle = startAngle + (endAngle - startAngle) * progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, slashRadius, startAngle, currentAngle, sl.facing === 'left');
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = Math.max(3.5 / scale, 2) * (1 - progress * 0.6);
        ctx.lineCap = 'round';
        ctx.shadowColor = sl.color;
        ctx.shadowBlur = 8;
        ctx.stroke();

        // White hot tip
        const tipX = sl.x + Math.cos(currentAngle) * slashRadius;
        const tipY = sl.y + Math.sin(currentAngle) * slashRadius;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.5 / scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 5. Active Particles (Sparks & Dust)
      p.particles.forEach(pt => {
        const alpha = pt.life / pt.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, (pt.size / scale) * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 6. Floating Name & Mini Health Pip
      const nameText = testCharacter?.name || 'Player Prefab';
      ctx.font = `bold ${Math.max(8 / scale, 7.5)}px monospace`;
      const nW = ctx.measureText(nameText).width;
      const nX = p.x - nW / 2 - 3 / scale;
      const nY = p.y - (capH + 12 / scale);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(nX, nY, nW + 6 / scale, 10 / scale);
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(nameText, p.x, nY + 5 / scale);

      ctx.restore();
    }

    // ==========================================
    // RESTORE SCREEN SPACE
    // ==========================================
    ctx.restore();

    // ==========================================
    // 7. LAYER +1: FOREGROUND OVERGROWTH & PARTICLES WITH CROSSFADE
    // ==========================================
    const renderBiomeFg = (biomeToRender: RefinedBiome, opacityMult: number) => {
      if (!showForegroundLayer || !biomeToRender?.parallaxLayers || opacityMult <= 0.001) return;
      const fgLayers = biomeToRender.parallaxLayers
        .filter(l => l.layerIndex > 0)
        .sort((a, b) => a.layerIndex - b.layerIndex);

      fgLayers.forEach(layer => {
        renderParallaxLayer(
          ctx,
          layer,
          canvasWidth,
          canvasHeight,
          currentPan.x,
          currentPan.y,
          scale,
          biomeToRender,
          opacityMult,
          () => setRenderTrigger(t => t + 1)
        );
      });
    };

    if (prevBiome && fadeAlpha < 1.0) {
      renderBiomeFg(prevBiome, 1.0 - fadeAlpha);
    }
    if (currBiome) {
      renderBiomeFg(currBiome, fadeAlpha);
    }

    // Schedule next frame cleanly if in play mode
    if (mode === 'play') {
      rafId = requestAnimationFrame(renderFrame);
    }
    }; // end renderFrame

    if (mode === 'play') {
      rafId = requestAnimationFrame(renderFrame);
    } else {
      renderFrame();
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    mapData, 
    showParallaxBg, 
    showForegroundLayer, 
    showGrid, 
    showDamageMasks, 
    isLitMode, 
    pan, 
    scale, 
    activeBiome, 
    biomeMap, 
    tileTypeMap, 
    envDetailMap, 
    interactiveDetailMap, 
    wildlifeMap,
    canvasWidth,
    canvasHeight,
    hoverTile,
    brushSize,
    activeTool,
    mode,
    testCharacter,
    spawnPoint,
    charImgVersion
  ]);

  const isDrawingRef = useRef(false);
  const lastTileCoordRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  const getCoordinatesFromNative = (e: MouseEvent | TouchEvent) => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return null;
    }

    // Coordinates relative to the viewport container
    const viewX = clientX - rect.left;
    const viewY = clientY - rect.top;

    // Convert to world coordinates using live ref values to guarantee 100% pixel-perfect tile alignment
    const curPan = viewport.panRef.current;
    const curScale = viewport.scaleRef.current;
    const worldX = (viewX - curPan.x) / curScale;
    const worldY = (viewY - curPan.y) / curScale;

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    return { x: tileX, y: tileY };
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    return getCoordinatesFromNative(e.nativeEvent);
  };

  // Window-level pointer tracking for smooth, gapless painting interpolation
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const coords = getCoordinatesFromNative(e);
      if (coords) {
        setHoverTile(coords);
      }
      if (!isDrawingRef.current || isPanning) return;
      if (!coords) return;

      if (lastTileCoordRef.current) {
        if (lastTileCoordRef.current.x === coords.x && lastTileCoordRef.current.y === coords.y) {
          return;
        }
        const linePoints = getInterpolatedLineTiles(
          lastTileCoordRef.current.x,
          lastTileCoordRef.current.y,
          coords.x,
          coords.y
        );
        onTileInteract(coords.x, coords.y, linePoints);
      } else {
        onTileInteract(coords.x, coords.y, [coords]);
      }
      lastTileCoordRef.current = coords;
    };

    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setIsDrawing(false);
        lastTileCoordRef.current = null;
      }
    };

    if (isDrawing) {
      window.addEventListener('mousemove', handleGlobalMove, { passive: true });
      window.addEventListener('touchmove', handleGlobalMove, { passive: true });
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDrawing, isPanning, pan, scale, canvasWidth, canvasHeight, onTileInteract, setIsDrawing]);

  const handleContainerPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // If click target is inside a HUD or button or marked element, don't trigger drawing or panning on map
    const target = e.target as HTMLElement | null;
    if (target && target !== canvasRef.current) {
      if (target.closest('button') || target.closest('[data-no-paint]') || target.closest('.no-canvas-paint')) {
        return;
      }
    }

    // PLAY MODE: Direct interactive combat & skill triggers
    if (mode === 'play') {
      e.stopPropagation(); // Prevent bubbling to pan handler
      if ('button' in e) {
        const btn = (e as React.MouseEvent).button;
        if (btn === 0) {
          triggerAttack();
        } else if (btn === 2) {
          triggerSpecial();
        }
      } else {
        triggerAttack();
      }
      return;
    }

    // SPAWN PLACEMENT TOOL: Place spawn point without painting tiles
    if (activeTool === 'spawn_place') {
      const coords = getCoordinates(e);
      if (coords && onSetSpawnPoint) {
        onSetSpawnPoint(coords.x, coords.y);
      }
      return;
    }

    if ('button' in e) {
      const btn = (e as React.MouseEvent).button;
      const isSpace = viewport.isSpaceDown;
      if (btn === 2 || btn === 1 || (btn === 0 && isSpace)) {
        return; // Bubble up to ViewportCanvasContainer to handle panning
      }
    }
    isDrawingRef.current = true;
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) {
      setHoverTile(coords);
      lastTileCoordRef.current = coords;
      onTileInteract(coords.x, coords.y, [coords]);
    }
  };

  const handleContainerPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (coords) {
      setHoverTile(coords);
    }
    if (mode === 'play' || activeTool === 'spawn_place') return;
    if (!isDrawing || isPanning) return;
    if (!coords) return;

    if (lastTileCoordRef.current) {
      if (lastTileCoordRef.current.x === coords.x && lastTileCoordRef.current.y === coords.y) {
        return;
      }
      const linePoints = getInterpolatedLineTiles(
        lastTileCoordRef.current.x,
        lastTileCoordRef.current.y,
        coords.x,
        coords.y
      );
      onTileInteract(coords.x, coords.y, linePoints);
    } else {
      onTileInteract(coords.x, coords.y, [coords]);
    }
    lastTileCoordRef.current = coords;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastTileCoordRef.current = null;
  };

  const handleMouseLeaveContainer = () => {
    handlePointerUp();
    setHoverTile(null);
  };

  return (
    <ViewportCanvasContainer 
      viewport={viewport}
      cursorMode={mode === 'play' ? 'crosshair' : 'crosshair'}
      showHud={false}
      className="border border-neutral-800 rounded-none"
    >
      <div 
        onMouseDown={handleContainerPointerDown}
      onMouseMove={handleContainerPointerMove}
      onTouchStart={handleContainerPointerDown}
      onTouchMove={handleContainerPointerMove}
      onContextMenu={(e) => {
        if (mode === 'play') {
          e.preventDefault();
          triggerSpecial();
          return;
        }
        handleContextMenu(e);
      }}
      onMouseUp={handlePointerUp}
      onMouseLeave={handleMouseLeaveContainer}
      onTouchEnd={handlePointerUp}
      className={`absolute inset-0 z-0  w-full h-full bg-neutral-950 border border-neutral-800 select-none overflow-hidden ${
        mode === 'play' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-crosshair'
      }`}
      style={{ touchAction: 'none' }}
    >
      
      {/* Transformed Canvas Plane */}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block shadow-2xl bg-black outline-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* ==========================================
          PLAY MODE HUD OVERLAY (METROIDVANIA STYLE)
          ========================================== */}
      {mode === 'play' && (
        <>
          {/* Top-Left Prefab Stats & Health Orb/Gauges */}
          <div 
            data-no-paint="true"
            className="absolute top-4 left-4 z-30 flex items-start gap-3 bg-neutral-950/85 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 select-none pointer-events-auto"
          >
            {/* Prefab Portrait Gem */}
            <div 
              className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 border-cyan-400 bg-gradient-to-b from-neutral-900 to-neutral-950 shadow-lg relative shrink-0"
              style={{ borderColor: testCharacter?.tintColor || '#06b6d4' }}
            >
              <span className="text-2xl drop-shadow">{testCharacter?.avatarIcon || '🛡️'}</span>
              <span className="text-[8px] font-mono font-black text-white/70 uppercase mt-0.5">LV 1</span>
              {hudState.isWallSliding ? (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-neutral-950 animate-bounce" title="Wall Clinging" />
              ) : hudState.isGrounded ? (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950" title="Grounded" />
              ) : (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-neutral-950 animate-pulse" title="Airborne" />
              )}
            </div>

            {/* Bars & Prefab Metadata */}
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-white tracking-wide truncate max-w-[120px]">
                  {testCharacter?.name || 'Player Prefab'}
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-cyan-300 font-bold shrink-0">
                  {testCharacter?.prefabType?.replace('_', ' ') || 'Prefab'}
                </span>
              </div>

              {/* Linked Behavior Badge */}
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400">
                <span className="flex items-center gap-1 text-cyan-300/90 truncate max-w-[200px]" title={`Behavior: ${linkedBehavior?.name || testCharacter?.assignedBehaviorFileName || 'Default'}`}>
                  <Cpu size={10} className="shrink-0 text-cyan-400" />
                  <span className="truncate">{linkedBehavior?.name || testCharacter?.assignedBehaviorFileName || 'Default'}</span>
                </span>
              </div>

              {/* Health Bar */}
              <div className="flex items-center gap-1.5">
                <Heart size={12} className="text-rose-400 shrink-0 fill-rose-500" />
                <div className="flex-1 h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-0.5 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 rounded-full transition-all duration-75 shadow-sm"
                    style={{ width: `${Math.min(100, (hudState.health / Math.max(1, hudState.maxHealth)) * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white drop-shadow">
                    {hudState.health} / {hudState.maxHealth}
                  </span>
                </div>
              </div>

              {/* Stamina & Mana Dual Rows */}
              <div className="flex items-center gap-2">
                {/* Stamina Bar */}
                <div className="flex-1 flex items-center gap-1">
                  <Zap size={11} className="text-amber-400 shrink-0 fill-amber-400" />
                  <div className="flex-1 h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (hudState.stamina / Math.max(1, charConfig.maxSp)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mana Bar */}
                <div className="flex-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-purple-400 shrink-0 fill-purple-400" />
                  <div className="flex-1 h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full transition-all duration-75"
                      style={{ width: `${Math.min(100, (hudState.mana / Math.max(1, charConfig.maxMp)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top-Right Play Controls */}
          <div 
            data-no-paint="true"
            className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-neutral-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-cyan-500/50 shadow-2xl pointer-events-auto"
          >
            <button
              type="button"
              onClick={respawnPlayer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold transition border border-neutral-700"
              title="Respawn prefab at spawn point (Hotkey: R)"
            >
              <RotateCcw size={13} className="text-cyan-400" />
              <span>Respawn (R)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onExitPlayMode?.();
                setMode?.('paint');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/60 border border-rose-400"
              title="Exit Play Mode (Hotkey: Esc)"
            >
              <Square size={13} fill="currentColor" />
              <span>Exit Play Mode (Esc)</span>
            </button>
          </div>

          {/* Bottom Floating Controls Helper Banner — Strictly derived from configured capabilities */}
          <div 
            data-no-paint="true"
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="bg-neutral-950/90 border border-neutral-700/80 shadow-2xl backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 text-xs text-neutral-300">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-extrabold tracking-wider bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                Active Actions
              </span>
              
              {charConfig.baseSpeed > 0 && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">WASD / ◄►</strong> Move
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.canJump && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">Space</strong> Jump {charConfig.maxAirJumps > 0 ? `(${1 + charConfig.maxAirJumps}x)` : '(Single)'}
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.hasWallCling && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">Wall + Space</strong> Wall Kick
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.hasDash && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">Shift</strong> Dash {charConfig.allowAirDash ? '(Air/Gnd)' : '(Gnd)'}
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.hasAttack && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">J / Click</strong> Attack
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.hasSpecial && (
                <>
                  <span className="font-medium">
                    <strong className="text-white font-mono">K / R-Click</strong> Skill
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              {charConfig.baseSpeed === 0 && !charConfig.canJump && !charConfig.hasDash && !charConfig.hasAttack && !charConfig.hasSpecial && (
                <>
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <span>⚠️</span> No movement or jump configured for this prefab
                  </span>
                  <span className="text-neutral-600">•</span>
                </>
              )}

              <span className="font-medium">
                <strong className="text-white font-mono">R</strong> Respawn
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-medium">
                <strong className="text-white font-mono">Esc</strong> Exit
              </span>
            </div>
          </div>
        </>
      )}

      {/* Upper-Left Hovered Map Chunk Biome HUD Overlay */}
      {mode === 'paint' && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none select-none transition-all duration-200">
          <div 
            className="bg-neutral-950/90 border shadow-2xl backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center gap-3 animate-fade-in"
            style={{
              borderColor: hoveredChunkInfo?.biome?.regionColor 
                ? `${hoveredChunkInfo.biome.regionColor}60` 
                : (hoveredChunkInfo?.hasChunk ? 'rgba(56, 189, 248, 0.4)' : (hoveredChunkInfo ? 'rgba(148, 163, 184, 0.3)' : 'rgba(56, 189, 248, 0.3)')),
              boxShadow: hoveredChunkInfo?.biome?.regionColor
                ? `0 10px 25px -5px ${hoveredChunkInfo.biome.regionColor}33`
                : undefined
            }}
          >
            {/* Biome Indicator Gem */}
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors shadow-inner"
              style={{
                backgroundColor: hoveredChunkInfo?.biome?.regionColor 
                  ? `${hoveredChunkInfo.biome.regionColor}25` 
                  : (hoveredChunkInfo?.hasChunk ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)'),
                borderColor: hoveredChunkInfo?.biome?.regionColor 
                  ? hoveredChunkInfo.biome.regionColor 
                  : (hoveredChunkInfo?.hasChunk ? '#38bdf8' : '#64748b')
              }}
            >
              <Compass 
                className="w-4 h-4 transition-transform"
                style={{
                  color: hoveredChunkInfo?.biome?.regionColor || (hoveredChunkInfo?.hasChunk ? '#38bdf8' : '#94a3b8')
                }} 
              />
            </div>

            {/* Chunk & Biome Label */}
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-mono font-bold">
                  {hoveredChunkInfo 
                    ? `Chunk [${hoveredChunkInfo.cx}, ${hoveredChunkInfo.cy}]` 
                    : 'Current Map Biome'
                  }
                </span>
                {hoveredChunkInfo && (
                  <span className="text-[9px] font-mono text-neutral-500">
                    Tile ({hoveredChunkInfo.tileX}, {hoveredChunkInfo.tileY})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <span 
                  className="text-xs font-extrabold text-white tracking-wide truncate"
                >
                  {hoveredChunkInfo
                    ? (hoveredChunkInfo.biome 
                        ? hoveredChunkInfo.biome.name 
                        : (hoveredChunkInfo.hasChunk ? 'Custom / Unassigned Biome' : 'Unallocated Void'))
                    : (activeBiome?.name || 'No Biome Selected')
                  }
                </span>
                {hoveredChunkInfo?.biome?.regionColor ? (
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: hoveredChunkInfo.biome.regionColor }}
                  />
                ) : !hoveredChunkInfo && activeBiome?.regionColor ? (
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: activeBiome.regionColor }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Floating Viewport Navigation & Parallax HUD (Paint Mode only) */}
      </div>
      {mode === 'paint' && (
        <ViewportHUD
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => centerContent(logicalMapWidth, logicalMapHeight, 1.0)}
          onFitContent={handleFitMap}
          onCenterContent={() => centerContent(logicalMapWidth, logicalMapHeight, 0.8)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid?.(!showGrid)}
          showColliders={showColliders}
          onToggleColliders={() => setShowColliders(prev => !prev)}
          position="top-right"
          themeColor="cyan"
          className="shadow-2xl"
          leadingSlot={
            <>
              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                    canUndo 
                      ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95' 
                      : 'text-neutral-600 cursor-not-allowed'
                  }`}
                  title={`Undo Map Change (Ctrl+Z)${undoCount > 0 ? ` [${undoCount}]` : ''}`}
                >
                  <Undo2 size={13} className={canUndo ? 'text-cyan-400' : 'text-neutral-600'} />
                  <span className="hidden sm:inline">Undo</span>
                </button>
              )}
              {onRedo && (
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                    canRedo 
                      ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95' 
                      : 'text-neutral-600 cursor-not-allowed'
                  }`}
                  title={`Redo Map Change (Ctrl+Y / Cmd+Shift+Z)${redoCount > 0 ? ` [${redoCount}]` : ''}`}
                >
                  <Redo2 size={13} className={canRedo ? 'text-amber-400' : 'text-neutral-600'} />
                  <span className="hidden sm:inline">Redo</span>
                </button>
              )}
              {(onUndo || onRedo) && <div className="h-4 w-px bg-neutral-700 mx-0.5" />}

              {/* Parallax Layer Toggles */}
              <button
                type="button"
                onClick={() => setShowParallaxBg(!showParallaxBg)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                  showParallaxBg 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Toggle Parallax Background Layers (-5 to -1)"
              >
                <Layers size={13} />
                <span className="hidden sm:inline">BG Parallax</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForegroundLayer(!showForegroundLayer)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                  showForegroundLayer 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title="Toggle Foreground Layer (+1)"
              >
                {showForegroundLayer ? <Eye size={13} /> : <EyeOff size={13} />}
                <span className="hidden sm:inline">+1 FG</span>
              </button>
            </>
          }
        />
      )}
    </ViewportCanvasContainer>
  );
};
