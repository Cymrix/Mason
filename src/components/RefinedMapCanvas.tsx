
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

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefinedMapData, RefinedCellState, ToolType, ModeType } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { CharacterData, BehaviorData } from '../engine/masonProjectSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { getCell, calculateMapBounds, CHUNK_SIZE, getChunkCoords, getChunkKey } from '../engine/mapChunkHelper';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
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
  testCharacter?: CharacterData;
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
}

export const RefinedMapCanvas: React.FC<RefinedMapCanvasProps> = ({
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
  redoCount = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showParallaxBg, setShowParallaxBg] = useState<boolean>(true);
  const [showForegroundLayer, setShowForegroundLayer] = useState<boolean>(true);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [, setRenderTrigger] = useState(0);

  // Exact character configuration derivation strictly from testCharacter and linkedBehavior
  const charConfig = React.useMemo(() => {
    // 1. Dimensions & Capsule from Character File
    const rawRad = testCharacter?.capsule?.radius;
    const rawH = testCharacter?.capsule?.height;
    const radius = (rawRad !== undefined && rawRad > 0) ? rawRad : (testCharacter?.spriteWidth ? Math.min(14, testCharacter.spriteWidth / 4) : 16);
    const height = (rawH !== undefined && rawH > 0) ? rawH : (testCharacter?.spriteHeight ? Math.min(48, testCharacter.spriteHeight * 0.75) : 44);
    const offsetX = testCharacter?.capsule?.offsetX ?? 0;
    const offsetY = testCharacter?.capsule?.offsetY ?? 0;
    
    // 2. Health, Mana, Stamina from Character BaseStats
    const maxHp = testCharacter?.baseStats?.health ?? 100;
    const maxMp = testCharacter?.baseStats?.energy ?? 100;
    const maxSp = testCharacter?.baseStats?.stamina ?? 100;

    // 3. Movement & Kinematics — Strictly driven by Behavior Module configuration
    const behMov = linkedBehavior?.movement;
    const heroInp = linkedBehavior?.heroInput;

    // Movement speed: strictly from Character Base Stats. If no stats, defaults to 5.
    const baseSpeed = testCharacter?.baseStats?.speed ?? 5;
    const accel = baseSpeed * 0.8; // Derived from speed
    const gravScale = behMov?.gravityScale !== undefined ? behMov.gravityScale : 1.0;
    const airCtrl = heroInp?.airControlPercent !== undefined 
      ? heroInp.airControlPercent / 100 
      : (behMov?.airControl !== undefined ? behMov.airControl : 0.85);

    // 4. Jump & Air Jumps — Strictly from behavior. If jumpForce is not configured (>0), jump is disabled.
    const jumpForce = behMov?.jumpForce !== undefined ? behMov.jumpForce : 0;
    const canJump = jumpForce > 0;
    const maxAirJumps = heroInp?.maxAirJumps ?? 0;
    const totalJumps = canJump ? (1 + maxAirJumps) : 0;

    // 5. Dash — Strictly from behavior hero input or charge_dash movement type
    const hasDash = !!(heroInp?.dashCooldownMs !== undefined || behMov?.movementType === 'charge_dash');
    const allowAirDash = !!(heroInp?.allowAirDash);
    const dashCooldownFrames = heroInp?.dashCooldownMs ? Math.round(heroInp.dashCooldownMs / 16.66) : 36;
    const dashSpeed = (heroInp?.dashSpeedMultiplier ?? 2.2) * (baseSpeed > 0 ? baseSpeed * 1.5 : 8);
    const dashDurationFrames = heroInp?.dashIFrameMs ? Math.max(4, Math.round(heroInp.dashIFrameMs / 25)) : 8;

    // 6. Wall Cling & Wall Jump — Strictly from behavior hero input / wall_clinger movement type
    const hasWallCling = !!((heroInp?.wallClingFriction !== undefined && heroInp.wallClingFriction > 0) || behMov?.movementType === 'wall_clinger');
    const wallFriction = heroInp?.wallClingFriction ?? 0.6;
    const wallJumpForceX = heroInp?.wallJumpForceX ?? (baseSpeed * 1.8);
    const wallJumpForceY = heroInp?.wallJumpForceY ?? (jumpForce > 0 ? jumpForce * 0.95 : 0);

    // 7. Combat Attacks — Driven by character hitboxes/animations and behavior attack rules/actions/skills
    const hasAttack = !!(
      testCharacter?.polygons?.some(poly => poly.type === 'hitbox') ||
      testCharacter?.animations?.some(anim => anim.stateId === 'attack') ||
      linkedBehavior?.rules?.some(r => r.actions.some(a => a.actionType === 'attack')) ||
      linkedBehavior?.skills?.some(s => s.actionType === 'primary_attack')
    );

    // 8. Special Skills — Driven by behavior projectile rules or behavior skills
    const hasSpecial = !!(
      linkedBehavior?.rules?.some(r => r.actions.some(a => a.attackType === 'fire_projectile' || a.actionType === 'hero_impulse')) ||
      linkedBehavior?.skills?.some(s => s.actionType === 'special_ability')
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

  // Character Spritesheet Image Loader & Cache
  const charImgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [charImgVersion, setCharImgVersion] = useState<number>(0);

  const getCharacterSpriteInfo = useCallback((char?: CharacterData) => {
    if (!char) return null;
    const sheet = char.spritesheets?.[0];
    const tileW = sheet?.tileWidth || char.spriteWidth || 64;
    const tileH = sheet?.tileHeight || char.spriteHeight || 64;
    const cols = sheet?.cols || 8;
    const rows = sheet?.rows || 4;

    let url = sheet?.imageUrl || sheet?.dataUrl || (sheet as any)?.imageBase64 || '';
    if (!url) {
      // Procedural fallback spritesheet canvas matching Character Studio
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
    gravityOverride: null as number | null
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

  



  const {
    scale,
    pan,
    isPanning,
    containerRef,
    handleMouseDown: handlePanMouseDown,
    handleContextMenu,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setPan
  } = useCanvasPanZoom({
    minScale: 0.15,
    maxScale: 4.0,
    initialScale: 0.8,
    zoomSensitivity: 1.15
  });

  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);
  
  const canvasWidth = viewportSize.width;
  const canvasHeight = viewportSize.height;
  
  // Logical map bounds (for things that still need to know how big the active map is)
  const logicalMapWidth = mapData.width * TILE_SIZE;
  const logicalMapHeight = mapData.height * TILE_SIZE;

  const handleFitMap = React.useCallback(() => {
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
  const { biomeMap, tileTypeMap, envDetailMap, interactiveDetailMap, wildlifeMap } = React.useMemo(() => {
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
  const targetBiome = React.useMemo<RefinedBiome | null>(() => {
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
        const cell = mapData.cells[centerTileY]?.[centerTileX];
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
  const hoveredChunkInfo = React.useMemo(() => {
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

  // Keyboard shortcut for toggling grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
          return;
        }
        if (setShowGrid) {
          setShowGrid(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowGrid]);

  // Respawn character function
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
    p.jumpsLeft = charConfig.totalJumps;
    p.health = charConfig.maxHp;
    p.maxHealth = charConfig.maxHp;
    p.stamina = charConfig.maxSp;
    p.maxStamina = charConfig.maxSp;
    p.mana = charConfig.maxMp;
    p.maxMana = charConfig.maxMp;
    p.ghostTrails = [];
    p.slashes = [];
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

  // Play Mode Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (mode === 'play') {
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

        // Jump / Wall Jump trigger
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
          e.preventDefault();
          const p = playerRef.current;

          // Wall kick jump
          if (p.isWallSliding && charConfig.hasWallCling) {
            p.vy = -charConfig.wallJumpForceY;
            p.vx = p.facing === 'left' ? charConfig.wallJumpForceX : -charConfig.wallJumpForceX;
            p.facing = p.facing === 'left' ? 'right' : 'left';
            p.isWallSliding = false;
            p.isGrounded = false;
            p.jumpStretch = 1.3;
            // Wall kick sparks
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
            return;
          }

          // Standard Ground / Air Jump
          if (charConfig.canJump && p.jumpsLeft > 0) {
            p.vy = -Math.abs(charConfig.jumpForce);
            p.jumpsLeft -= 1;
            p.isGrounded = false;
            p.isWallSliding = false;
            p.jumpStretch = 1.25;
            // Jump dust particles
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

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
          e.preventDefault();
          triggerDash();
        }

        if (e.code === 'KeyJ' || e.code === 'KeyZ') {
          e.preventDefault();
          triggerAttack();
        }

        if (e.code === 'KeyK' || e.code === 'KeyX') {
          e.preventDefault();
          triggerSpecial();
        }
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
  }, [mode, onExitPlayMode, setMode, respawnPlayer, triggerDash, triggerAttack, triggerSpecial, charConfig]);

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

      p.animTime += dt;

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

      // Helper to check if tile at (tx, ty) is solid
      const isSolidTile = (tx: number, ty: number): boolean => {
        const cell = getCell(mapData, tx, ty);
        return !!(cell && cell.tile_type_id);
      };

      const halfW = charConfig.radius;
      const charH = charConfig.height;

      // Movement Input (if not dashing and character speed > 0)
      // 0. Environmental Gravity & Dynamic Kinematic Configuration
      // Determine active biome for the player's current location or viewport
      const pTileX = Math.floor(p.x / TILE_SIZE);
      const pTileY = Math.floor(p.y / TILE_SIZE);
      const { cx: pCx, cy: pCy, lx: pLx, ly: pLy } = getChunkCoords(pTileX, pTileY);
      const pChunkKey = getChunkKey(pCx, pCy);
      const playerChunk = mapData.chunks?.[pChunkKey];
      const playerCell = playerChunk ? playerChunk[pLy * CHUNK_SIZE + pLx] : (mapData.cells ? getCell(mapData, pTileX, pTileY) : null);
      const pBiomeId = playerCell?.biome_id || playerChunk?.find(c => c && c.biome_id)?.biome_id || targetBiome?.id || currentBiomeRef.current?.id;
      const playerBiome = pBiomeId ? (biomeMap[pBiomeId] || biomes.find(b => b.id === pBiomeId) || targetBiome || currentBiomeRef.current) : (targetBiome || currentBiomeRef.current);
      
      const biomeGravityScale = playerBiome?.gravityScale !== undefined ? playerBiome.gravityScale : (charConfig.gravScale ?? 1.0);
      
      // Effective Gravity: Character behavior override strictly takes precedence over biome gravity
      const effectiveGravScale = (p.gravityOverride !== null && p.gravityOverride !== undefined)
        ? p.gravityOverride
        : biomeGravityScale;

      // Character Variable resolver helper
      const getCharVarNum = (varIdOrName?: string, fallback: number = 0): number => {
        if (!varIdOrName) return fallback;
        const v = (testCharacter?.variables || []).find(cv => cv.id === varIdOrName || cv.name.toLowerCase() === varIdOrName.toLowerCase());
        if (v) {
          const rawVal = testCharacter?.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue;
          if (rawVal !== undefined && rawVal !== null) {
            const n = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
            if (!isNaN(n)) return n;
          }
        }
        return fallback;
      };

      if (!p.isDashing) {
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
          p.vx = 0;
          p.isWalking = false;
        }

        // Apply environmental or overridden gravity
        p.vy = Math.min(p.vy + 0.52 * effectiveGravScale, 14);
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
      } else {
        p.isWallSliding = false;
      }

      // 1. Move X with Collision Check
      const nextX = p.x + p.vx;
      const checkY1 = p.y - 4;
      const checkY2 = p.y - charH + 4;
      const testTileX = Math.floor((p.vx > 0 ? nextX + halfW : nextX - halfW) / TILE_SIZE);
      const testTileY1 = Math.floor(checkY1 / TILE_SIZE);
      const testTileY2 = Math.floor(checkY2 / TILE_SIZE);

      if (isSolidTile(testTileX, testTileY1) || isSolidTile(testTileX, testTileY2)) {
        p.vx = 0;
      } else {
        p.x = nextX;
      }

      // 2. Move Y with Collision Check
      const nextY = p.y + p.vy;
      if (p.vy >= 0) {
        // Falling down
        const footTileY = Math.floor(nextY / TILE_SIZE);
        const footLeftX = Math.floor((p.x - halfW + 2) / TILE_SIZE);
        const footRightX = Math.floor((p.x + halfW - 2) / TILE_SIZE);

        if (isSolidTile(footLeftX, footTileY) || isSolidTile(footRightX, footTileY)) {
          p.y = footTileY * TILE_SIZE;
          if (p.vy > 5) {
            p.landingSquash = 1.3;
            // Landing dust
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
        } else {
          p.y = nextY;
          p.isGrounded = false;
        }
      } else {
        // Jumping up (Ceiling check)
        const headTileY = Math.floor((nextY - charH) / TILE_SIZE);
        const headLeftX = Math.floor((p.x - halfW + 2) / TILE_SIZE);
        const headRightX = Math.floor((p.x + halfW - 2) / TILE_SIZE);

        if (isSolidTile(headLeftX, headTileY) || isSolidTile(headRightX, headTileY)) {
          p.y = (headTileY + 1) * TILE_SIZE + charH;
          p.vy = 0;
        } else {
          p.y = nextY;
          p.isGrounded = false;
        }
      }

      // Auto respawn if falling off world
      const bounds = calculateMapBounds(mapData);
      if (p.y > (bounds.maxY + 12) * TILE_SIZE || p.y < (bounds.minY - 20) * TILE_SIZE) {
        respawnPlayer();
      }

      // ==========================================
      // BEHAVIOR RULES & SENSORY TRIGGER EVALUATION
      // ==========================================
      const rulesToEvaluate = linkedBehavior?.rules || testCharacter?.rules || [];
      if (rulesToEvaluate.length > 0) {
        // Solid check helper in specific direction and distance in pixels
        const checkSolidsInDirection = (
          direction: 'left' | 'right' | 'above' | 'below' | 'ground' | 'ceiling' | 'wall_forward' | 'wall_backward',
          distancePx: number = 4,
          mode: 'touching' | 'near' | 'clear' | 'ledge_ahead' = 'touching'
        ): boolean => {
          let checkX = p.x;
          let checkY = p.y;
          const dist = Math.max(1, distancePx);
          const fwd = p.facing === 'right' ? 'right' : 'left';
          const bwd = p.facing === 'right' ? 'left' : 'right';

          let effDir = direction;
          if (direction === 'wall_forward') effDir = fwd;
          if (direction === 'wall_backward') effDir = bwd;
          if (direction === 'ground') effDir = 'below';
          if (direction === 'ceiling') effDir = 'above';

          if (mode === 'ledge_ahead') {
            // Ledge check: ground ahead of character in facing direction
            const lookAheadX = p.x + (p.facing === 'right' ? halfW + dist : -(halfW + dist));
            const lookDownY = p.y + 6;
            const tX = Math.floor(lookAheadX / TILE_SIZE);
            const tY = Math.floor(lookDownY / TILE_SIZE);
            return !isSolidTile(tX, tY); // True if there is a pit/ledge ahead!
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
          velocityThreshold: number = 0.5,
          gravityEnvironment?: string
        ): boolean => {
          switch (stateKind) {
            case 'jump_peak':
              // Peak of jump: ascending previously or airborne with vertical speed near 0
              return !p.isGrounded && Math.abs(p.vy) <= Math.max(0.6, velocityThreshold) && p.prevVy <= 0.2;
            case 'falling':
              // Falling downward pulled by gravity
              return !p.isGrounded && p.vy > (velocityThreshold > 0 ? velocityThreshold : 0.5);
            case 'rising':
              // Ascending upward in air
              return !p.isGrounded && p.vy < -(velocityThreshold > 0 ? velocityThreshold : 0.5);
            case 'grounded':
              return p.isGrounded;
            case 'airborne':
              return !p.isGrounded;
            case 'wall_sliding':
              return p.isWallSliding;
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
          switch (trig.type) {
            case 'solid_detection':
              return checkSolidsInDirection(trig.direction, trig.detectionDistancePx ?? 4, trig.checkMode ?? 'touching');
            case 'physics_state':
              return evaluatePhysicsState(trig.stateKind, trig.velocityThreshold ?? 0.5);
            case 'variable_condition': {
              const v = (testCharacter?.variables || []).find(cv => cv.id === trig.variableId || cv.name.toLowerCase() === trig.variableId?.toLowerCase());
              if (!v) return false;
              const leftVal = testCharacter?.behaviorVariables?.[v.id] ?? v.value ?? v.defaultValue;
              const rightVal = trig.value;
              if (v.type === 'boolean') {
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
              if (trig.condition === 'low_health') return p.health <= 30;
              if (trig.condition === 'low_stamina') return p.stamina <= 20;
              return false;
            case 'state':
              return p.activeBehaviorState === trig.stateId || trig.stateId === 'any';
            case 'keyboard_key':
              return !!keys[trig.key] || !!keys[`Key${trig.key?.toUpperCase()}`];
            case 'collision':
              return p.isGrounded || p.isWallSliding;
            default:
              return false;
          }
        };

        // Helper to execute single character behavior action
        const executeCharacterAction = (action: any) => {
          if (!action || action.actionType === 'none') return;

          // 1. Hero Impulse (Jump, Dash, Wall Jump, Knockback) with dynamic Character Variables support
          if (action.actionType === 'hero_impulse') {
            const force = (action.forceSource === 'variable' && action.forceVariableId)
              ? getCharVarNum(action.forceVariableId, action.force ?? 12)
              : (action.force ?? 12);

            if (action.impulseType === 'jump' && p.isGrounded) {
              p.vy = -force;
              p.isGrounded = false;
            } else if (action.impulseType === 'dash') {
              triggerDash();
            } else if (action.impulseType === 'wall_jump' && p.isWallSliding) {
              p.vy = -force * 0.9;
              p.vx = (p.facing === 'left' ? 1 : -1) * force * 0.8;
            } else if (action.impulseType === 'knockback') {
              p.vx = (p.facing === 'left' ? 1 : -1) * force;
              p.vy = -force * 0.35;
            }
          }
          // 2. Kinematic Move with dynamic Character Variables support
          else if (action.actionType === 'move') {
            const speed = (action.speedSource === 'variable' && action.speedVariableId)
              ? getCharVarNum(action.speedVariableId, action.speed ?? 4.0)
              : (action.speed ?? 4.0);

            if (action.moveMode === 'towards_target' || action.moveMode === 'ground_patrol') {
              p.vx = p.facing === 'right' ? speed : -speed;
              p.isWalking = true;
            } else if (action.moveMode === 'away_from_target') {
              p.vx = p.facing === 'right' ? -speed : speed;
              p.isWalking = true;
            } else if (action.moveMode === 'stop') {
              p.vx = 0;
              p.isWalking = false;
            }
          }
          // 3. Gravity Override (Overrides active Biome gravity)
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
          }
          // 4. FSM State Transition
          else if (action.actionType === 'state_change' && action.targetState) {
            p.activeBehaviorState = action.targetState;
          }
          // 5. Attack Execution
          else if (action.actionType === 'attack') {
            triggerAttack();
          }
        };

        // Evaluate Character FSM State Transitions conditioned on Behavior "IFs"
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
      setPan(prev => ({
        x: prev.x + (targetPanX - prev.x) * 0.12,
        y: prev.y + (targetPanY - prev.y) * 0.12
      }));

      // Update HUD State periodically
      setHudState({
        health: p.health,
        maxHealth: charConfig.maxHp,
        stamina: Math.round(p.stamina),
        mana: Math.round(p.mana),
        isGrounded: p.isGrounded,
        isWallSliding: p.isWallSliding,
        facing: p.facing
      });

      setRenderTrigger(t => t + 1);
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
          pan.x,
          pan.y,
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
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // ==========================================
    // VIEWPORT FRUSTUM CULLING CALCULATION
    // ==========================================
    const minVisTileX = Math.floor((-pan.x / scale) / TILE_SIZE) - 1;
    const maxVisTileX = Math.ceil(((canvasWidth - pan.x) / scale) / TILE_SIZE) + 1;
    const minVisTileY = Math.floor((-pan.y / scale) / TILE_SIZE) - 1;
    const maxVisTileY = Math.ceil(((canvasHeight - pan.y) / scale) / TILE_SIZE) + 1;

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
          const cell = mapData.cells[y]?.[x];
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
          const cell = mapData.cells[y]?.[x];
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
      
      const startCol = Math.floor((-pan.x / scale) / TILE_SIZE);
      const endCol = startCol + Math.ceil((canvasWidth / scale) / TILE_SIZE) + 1;
      const startRow = Math.floor((-pan.y / scale) / TILE_SIZE);
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
      // Draw Placed Character Spawn Point Marker
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

      // Character Editor defines (0,0) as the center of the sprite cell (tileW/2, tileH/2)
      // On the map, ground contact is at spawnY, so the sprite center is at (spawnX, spawnY - spriteTileH / 2)
      const spriteTileH = spriteInfo?.tileH || testCharacter?.spriteHeight || 64;
      const spriteTileW = spriteInfo?.tileW || testCharacter?.spriteWidth || 64;
      const charCenterY = spawnY - spriteTileH / 2;

      ctx.save();
      ctx.translate(spawnX + capOx, charCenterY + capOy);
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

      // 4. Render Real Character Sprite Frame (Idle frame 0)
      if (spriteInfo && spriteInfo.img.complete && spriteInfo.img.naturalWidth > 0) {
        const { img, tileW, tileH, cols } = spriteInfo;
        const idleAnim = testCharacter?.animations?.find(a => a.stateId === 'idle') || testCharacter?.animations?.[0];
        const frameIdx = idleAnim?.startFrameIndex || 0;
        const col = frameIdx % cols;
        const row = Math.floor(frameIdx / cols);
        const srcX = col * tileW;
        const srcY = row * tileH;

        ctx.save();
        ctx.translate(spawnX, spawnY - tileH / 2);
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
        ctx.roundRect(spawnX - 10, charCenterY - 14, 20, 28, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();

        ctx.font = `${Math.max(12, 12 / scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(testCharacter?.avatarIcon || '🛡️', spawnX, charCenterY);
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
          ctx.translate(hX, hY - tileH / 2);
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
          ctx.roundRect(hX - 7, hY - 28, 14, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = `${Math.max(12, 12 / scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(testCharacter?.avatarIcon || '📍', hX, hY - 14);
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
      let animState = 'idle';
      if (p.isAttacking) {
        animState = 'attack';
      } else if (p.isDashing) {
        animState = 'run';
      } else if (!p.isGrounded) {
        animState = 'jump';
      } else if (p.isWalking) {
        animState = Math.abs(p.vx) > 3.2 ? 'run' : 'walk';
      } else {
        animState = 'idle';
      }

      const activeAnim = testCharacter?.animations?.find(a => a.stateId === animState)
        || testCharacter?.animations?.find(a => a.stateId === 'idle')
        || testCharacter?.animations?.[0];

      // 4. Animated Character Body (with Squash & Stretch and Real Spritesheet Frame)
      const spriteTileH = spriteInfo?.tileH || testCharacter?.spriteHeight || 64;
      const spriteTileW = spriteInfo?.tileW || testCharacter?.spriteWidth || 64;

      ctx.save();
      // Translate to character sprite center
      ctx.translate(p.x, p.y - spriteTileH / 2);

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

        // Character Avatar Icon inside body
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
      const nameText = testCharacter?.name || 'Player Hero';
      ctx.font = `bold ${Math.max(8 / scale, 7.5)}px monospace`;
      const nW = ctx.measureText(nameText).width;
      const nX = p.x - nW / 2 - 3 / scale;
      const nY = p.y - 38 / scale;

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
          pan.x,
          pan.y,
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

    // Convert to world coordinates
    const worldX = (viewX - pan.x) / scale;
    const worldY = (viewY - pan.y) / scale;

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
      const isSpace = (window as any).__isSpaceDown || false;
      if (btn === 2 || btn === 1 || (btn === 0 && isSpace)) {
        handlePanMouseDown(e as React.MouseEvent);
        return;
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
    <div 
      ref={containerRef}
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
      className={`relative w-full h-full bg-neutral-950 border border-neutral-800 select-none overflow-hidden ${
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
          {/* Top-Left Character Stats & Health Orb/Gauges */}
          <div 
            data-no-paint="true"
            className="absolute top-4 left-4 z-30 flex items-start gap-3 bg-neutral-950/85 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 select-none pointer-events-auto"
          >
            {/* Character Portrait Gem */}
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

            {/* Bars & Character Metadata */}
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-white tracking-wide truncate max-w-[120px]">
                  {testCharacter?.name || 'Player Hero'}
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-cyan-300 font-bold shrink-0">
                  {testCharacter?.characterType?.replace('_', ' ') || 'Hero'}
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
              title="Respawn character at spawn point (Hotkey: R)"
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
      {mode === 'paint' && (
        <div 
          data-no-paint="true"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-700/80 shadow-2xl text-xs select-none"
        >
          {/* Undo & Redo Quick Buttons */}
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

          {/* Grid Toggle Checkbox / Button */}
          <button
            type="button"
            onClick={() => setShowGrid?.(!showGrid)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              showGrid 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
            title="Toggle Tile Grid & Chunk Outlines (Shortcut: G)"
          >
            <Grid size={13} className={showGrid ? 'text-emerald-400' : 'text-neutral-500'} />
            <span>Grid</span>
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-0.5" />

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
            <span>BG Parallax</span>
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
            <span>+1 FG</span>
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-0.5" />

          <div className="flex items-center gap-1 px-2 text-[11px] font-mono text-neutral-400 border-r border-neutral-800">
            <Move size={12} className="text-cyan-400" />
            <span className="hidden sm:inline">R-Click Pan • Wheel Zoom</span>
          </div>

          <button
            type="button"
            onClick={zoomOut}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <button
            type="button"
            onClick={() => centerContent(logicalMapWidth, logicalMapHeight, 1.0)}
            className="px-2 py-1 rounded-lg text-neutral-200 hover:text-white hover:bg-neutral-800 font-mono text-xs font-semibold transition"
            title="Reset Zoom to 100% & Center"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            onClick={handleFitMap}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600 hover:text-white border border-cyan-500/40 shadow-sm transition"
            title="Fit Entire Map in Viewport"
          >
            <Maximize2 size={13} />
            <span>Fit</span>
          </button>
          <button
            type="button"
            onClick={() => centerContent(logicalMapWidth, logicalMapHeight, 0.8)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Reset Center & Pan"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
