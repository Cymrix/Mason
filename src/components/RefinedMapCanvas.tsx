
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

import React, { useRef, useEffect, useState } from 'react';
import { RefinedMapData, RefinedCellState, ToolType, ModeType } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { getCell, calculateMapBounds, CHUNK_SIZE } from '../engine/mapChunkHelper';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { ZoomIn, ZoomOut, RotateCcw, Move, Layers, Eye, EyeOff, Maximize2, Compass, Grid } from 'lucide-react';

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
  mode = 'paint'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showParallaxBg, setShowParallaxBg] = useState<boolean>(true);
  const [showForegroundLayer, setShowForegroundLayer] = useState<boolean>(true);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [, setRenderTrigger] = useState(0);

  



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
    zoomOut
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
    const envDetails: Record<string, RefinedCellState> = {};
    const interactiveDetails: Record<string, RefinedCellState> = {};
    const wildlifeItems: Record<string, RefinedCellState> = {};

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
  // BIOME CROSSFADE ANIMATION ENGINE
  // ==========================================
  const prevBiomeRef = useRef<RefinedBiome | null>(null);
  const currentBiomeRef = useRef<RefinedBiome | null>(null);
  const fadeAlphaRef = useRef<number>(1.0);
  const lastTimeRef = useRef<number>(performance.now());

  // Determine centermost camera biome (returns null if camera is over unallocated space without a chunk)
  const centerTileX = Math.floor((canvasWidth / 2 - pan.x) / (scale * TILE_SIZE));
  const centerTileY = Math.floor((canvasHeight / 2 - pan.y) / (scale * TILE_SIZE));
  const centerCell = getCell(mapData, centerTileX, centerTileY);
  const targetBiome = (centerCell?.biome_id && biomeMap[centerCell.biome_id]) ? biomeMap[centerCell.biome_id] : null;
  const targetBiomeId = targetBiome ? targetBiome.id : 'VOID';

  const isInitialMountRef = useRef(true);

  // Handle Target Biome change with smooth crossfade trigger (including transitions to/from VOID)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      currentBiomeRef.current = targetBiome;
      fadeAlphaRef.current = 1.0;
      return;
    }

    const currentId = currentBiomeRef.current ? currentBiomeRef.current.id : 'VOID';
    if (currentId !== targetBiomeId) {
      prevBiomeRef.current = currentBiomeRef.current;
      currentBiomeRef.current = targetBiome;
      fadeAlphaRef.current = 0.0;
      lastTimeRef.current = performance.now();
    }
  }, [targetBiomeId]);

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

  // Smooth 60fps animation ticker loop during crossfade transition
  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (fadeAlphaRef.current < 1.0) {
        const now = performance.now();
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        const transitionSpeed = 2.5; // 0.4 seconds crossfade duration
        fadeAlphaRef.current = Math.min(1.0, fadeAlphaRef.current + dt * transitionSpeed);

        if (fadeAlphaRef.current >= 1.0) {
          prevBiomeRef.current = null;
        }

        setRenderTrigger(t => t + 1);
        animId = requestAnimationFrame(tick);
      }
    };

    if (fadeAlphaRef.current < 1.0) {
      lastTimeRef.current = performance.now();
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [fadeAlphaRef.current < 1.0, targetBiomeId]);

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
    const currBiome = currentBiomeRef.current || targetBiome;

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
          opacityMult
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
    if (hoverTile && mode !== 'pan') {
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
          opacityMult
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
    mode
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
      onContextMenu={handleContextMenu}
      onMouseUp={handlePointerUp}
      onMouseLeave={handleMouseLeaveContainer}
      onTouchEnd={handlePointerUp}
      className={`relative w-full h-full bg-neutral-950 border border-neutral-800 select-none overflow-hidden ${
        isPanning ? 'cursor-grabbing' : 'cursor-crosshair'
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

      {/* Biome Region Transition HUD Overlay Banner */}
      {fadeAlphaRef.current < 1.0 && (currentBiomeRef.current || prevBiomeRef.current) && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300">
          <div className="bg-neutral-950/90 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 animate-fade-in">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-mono font-bold">Region Transitioning</span>
              <span className="text-xs font-extrabold text-white tracking-wide">
                {currentBiomeRef.current ? currentBiomeRef.current.name : 'Unallocated Void (No Biome)'}
              </span>
            </div>
            <div className="w-12 h-1.5 bg-neutral-800/80 rounded-full overflow-hidden ml-1 border border-neutral-700/50">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-75"
                style={{ width: `${Math.round(fadeAlphaRef.current * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}


      {/* Floating Viewport Navigation & Parallax HUD */}
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
    </div>
  );
};
