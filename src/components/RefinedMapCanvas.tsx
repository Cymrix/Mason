
// Bresenham's line algorithm for smooth continuous painting between discrete mouse ticks
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
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
  }
  return points;
}

import React, { useRef, useEffect, useState } from 'react';
import { RefinedMapData, RefinedCellState } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { getCell, calculateMapBounds, CHUNK_SIZE } from '../engine/mapChunkHelper';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { ZoomIn, ZoomOut, RotateCcw, Move, Layers, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface RefinedMapCanvasProps {
  mapData: RefinedMapData;
  biomes: RefinedBiome[];
  activeBiome: RefinedBiome;
  onTileInteract: (x: number, y: number, points?: Array<{ x: number; y: number }>) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
  showDamageMasks?: boolean;
  isLitMode?: boolean;
}

export const RefinedMapCanvas: React.FC<RefinedMapCanvasProps> = ({
  mapData,
  biomes,
  activeBiome,
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true,
  showDamageMasks = true,
  isLitMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showParallaxBg, setShowParallaxBg] = useState<boolean>(true);
  const [showForegroundLayer, setShowForegroundLayer] = useState<boolean>(true);
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

  // Auto-center content on initial mount
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (!hasAutoCentered.current && containerRef.current) {
      hasAutoCentered.current = true;
      centerContent(logicalMapWidth, logicalMapHeight, 0.75);
    }
  }, [canvasWidth, canvasHeight, centerContent]);

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

  // Main Render Loop: 7-Layer Parallax Architecture & 64px Dual-Noise Blended Terrain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // ==========================================
    // 1. RENDER PARALLAX BACKGROUND LAYERS (-5 to -1)
    // ==========================================
    if (showParallaxBg && activeBiome.parallaxLayers) {
      const bgLayers = activeBiome.parallaxLayers
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
          activeBiome
        );
      });
    } else {
      // Fallback clean studio backdrop
      
    }

    // ==========================================
    // APPLY CAMERA TRANSFORM (World Space)
    // ==========================================
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // ==========================================
    // 2. RENDER BIOME CELL ATMOSPHERE TINT (Blank Air Tiles)
    // ==========================================
    const renderCell_2 = (cell: RefinedCellState, x: number, y: number) => {
        const cellBiome = biomeMap[cell.biome_id] || activeBiome;

        // If this cell is Blank Air, add subtle biome atmospheric gradient / haze
        if (!cell.tile_type_id) {
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;

          if (cellBiome.atmosphereFogColor) {
            ctx.fillStyle = cellBiome.atmosphereFogColor;
            ctx.globalAlpha = cellBiome.atmosphereFogDensity || 0.15;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1.0;
          }
        }
    };
        
    if (mapData.chunks) {
      Object.keys(mapData.chunks).forEach(key => {
        const [cx, cy] = key.split(',').map(Number);
        const chunk = mapData.chunks[key];
        if (!chunk || !Array.isArray(chunk)) return;
        for (let i = 0; i < chunk.length; i++) {
          if (!chunk[i]) continue;
          const lx = i % 16; // CHUNK_SIZE
          const ly = Math.floor(i / 16);
          renderCell_2(chunk[i], cx * 16 + lx, cy * 16 + ly);
        }
      });
    } else if (mapData.cells) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          if (mapData.cells[y] && mapData.cells[y][x]) {
            renderCell_2(mapData.cells[y][x], x, y);
          }
        }
      }
    }

    // ==========================================
    // 3. LAYER 0: MAIN GAMEPLAY PLANE (Lazy Per-Chunk Cached Rendering with Slope/Shape Support)
    // ==========================================
    if (mapData.chunks) {
      for (const key of Object.keys(mapData.chunks)) {
        const [cxStr, cyStr] = key.split(',');
        const cx = parseInt(cxStr, 10);
        const cy = parseInt(cyStr, 10);
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
    } else {
      const numChunksX = Math.ceil(mapData.width / CHUNK_SIZE);
      const numChunksY = Math.ceil(mapData.height / CHUNK_SIZE);

      for (let cy = 0; cy < numChunksY; cy++) {
        for (let cx = 0; cx < numChunksX; cx++) {
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
    // 4. LAYER 0: ENVIRONMENTAL NON-TILE DETAILS (Trees, Rocks, Bushes)
    // ==========================================
    const renderCell_4 = (cell: RefinedCellState, x: number, y: number) => {
        if (!cell.environmental_detail_id) return;

        const env = envDetailMap[cell.environmental_detail_id];
        if (!env) return;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 6, TILE_SIZE * 0.35, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon Graphic
        ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(env.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      };
    
    if (mapData.chunks) {
      Object.keys(mapData.chunks).forEach(key => {
        const [cx, cy] = key.split(',').map(Number);
        const chunk = mapData.chunks[key];
        if (!chunk || !Array.isArray(chunk)) return;
        for (let i = 0; i < chunk.length; i++) {
          if (!chunk[i]) continue;
          const lx = i % 16;
          const ly = Math.floor(i / 16);
          renderCell_4(chunk[i], cx * 16 + lx, cy * 16 + ly);
        }
      });
    } else if (mapData.cells) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          if (mapData.cells[y] && mapData.cells[y][x]) {
            renderCell_4(mapData.cells[y][x], x, y);
          }
        }
      }
    }

    // ==========================================
    // 5. LAYER 0: WILDLIFE (Roamers & Ambient Flyers)
    // ==========================================
    const renderCell_5 = (cell: RefinedCellState, x: number, y: number) => {
        if (!cell.wildlife_id) return;

        const fauna = wildlifeMap[cell.wildlife_id];
        if (!fauna) return;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fauna.icon, screenX + TILE_SIZE * 0.7, screenY + TILE_SIZE * 0.3);
      };
    
    if (mapData.chunks) {
      Object.keys(mapData.chunks).forEach(key => {
        const [cx, cy] = key.split(',').map(Number);
        const chunk = mapData.chunks[key];
        if (!chunk || !Array.isArray(chunk)) return;
        for (let i = 0; i < chunk.length; i++) {
          if (!chunk[i]) continue;
          const lx = i % 16;
          const ly = Math.floor(i / 16);
          renderCell_5(chunk[i], cx * 16 + lx, cy * 16 + ly);
        }
      });
    } else if (mapData.cells) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          if (mapData.cells[y] && mapData.cells[y][x]) {
            renderCell_5(mapData.cells[y][x], x, y);
          }
        }
      }
    }

    // ==========================================
    // 6. LAYER 0: INTERACTIVE DETAILS (Enemies, Doors, Items, Binding Stones)
    // ==========================================
    const renderCell_6 = (cell: RefinedCellState, x: number, y: number) => {
        if (!cell.interactive_detail_id) return;

        const item = interactiveDetailMap[cell.interactive_detail_id];
        if (!item) return;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;
        // Interactive Halo Indicator
        ctx.strokeStyle = item.color || '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      };
    
    if (mapData.chunks) {
      Object.keys(mapData.chunks).forEach(key => {
        const [cx, cy] = key.split(',').map(Number);
        const chunk = mapData.chunks[key];
        if (!chunk || !Array.isArray(chunk)) return;
        for (let i = 0; i < chunk.length; i++) {
          if (!chunk[i]) continue;
          const lx = i % 16;
          const ly = Math.floor(i / 16);
          renderCell_6(chunk[i], cx * 16 + lx, cy * 16 + ly);
        }
      });
    } else if (mapData.cells) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          if (mapData.cells[y] && mapData.cells[y][x]) {
            renderCell_6(mapData.cells[y][x], x, y);
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
    // RESTORE SCREEN SPACE
    // ==========================================
    ctx.restore();

    // ==========================================
    // 7. LAYER +1: FOREGROUND OVERGROWTH & PARTICLES
    // ==========================================
    if (showForegroundLayer && activeBiome.parallaxLayers) {
      const fgLayers = activeBiome.parallaxLayers
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
          activeBiome
        );
      });
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
    canvasHeight
  ]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
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

    const lastTileCoordRef = useRef<{ x: number; y: number } | null>(null);

  const handleFitMap = React.useCallback(() => {
    const bounds = calculateMapBounds(mapData);
    const minX = bounds.minX;
    const maxX = bounds.maxX;
    const minY = bounds.minY;
    const maxY = bounds.maxY;

    const mapPixelWidth = Math.max((maxX - minX + 1) * TILE_SIZE, (mapData.width || 32) * TILE_SIZE);
    const mapPixelHeight = Math.max((maxY - minY + 1) * TILE_SIZE, (mapData.height || 24) * TILE_SIZE);
    const originPixelX = Math.min(minX * TILE_SIZE, 0);
    const originPixelY = Math.min(minY * TILE_SIZE, 0);

    fitContent(mapPixelWidth, mapPixelHeight, 48, originPixelX, originPixelY);
  }, [mapData, fitContent]);

  // Window-level pointer release to prevent stuck drawing
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        lastTileCoordRef.current = null;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDrawing, setIsDrawing]);


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
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) {
      lastTileCoordRef.current = coords;
      onTileInteract(coords.x, coords.y, [coords]);
    }
  };

  const handleContainerPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPanning) return;
    const coords = getCoordinates(e);
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

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleContainerPointerDown}
      onMouseMove={handleContainerPointerMove}
      onTouchStart={handleContainerPointerDown}
      onTouchMove={handleContainerPointerMove}
      onContextMenu={handleContextMenu}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
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
