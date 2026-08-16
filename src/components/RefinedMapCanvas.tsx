import React, { useRef, useEffect, useState } from 'react';
import { RefinedMapData } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { globalChunkCache, CHUNK_SIZE } from '../engine/chunkCacheManager';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { ZoomIn, ZoomOut, RotateCcw, Move, Layers, Eye, EyeOff } from 'lucide-react';

interface RefinedMapCanvasProps {
  mapData: RefinedMapData;
  biomes: RefinedBiome[];
  activeBiome: RefinedBiome;
  onTileInteract: (x: number, y: number) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
  showDamageMasks?: boolean;
}

export const RefinedMapCanvas: React.FC<RefinedMapCanvasProps> = ({
  mapData,
  biomes,
  activeBiome,
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true,
  showDamageMasks = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showParallaxBg, setShowParallaxBg] = useState<boolean>(true);
  const [showForegroundLayer, setShowForegroundLayer] = useState<boolean>(true);
  const [, setRenderTrigger] = useState(0);

  const canvasWidth = mapData.width * TILE_SIZE;
  const canvasHeight = mapData.height * TILE_SIZE;

  const {
    scale,
    pan,
    isPanning,
    containerRef,
    handleMouseDown: handlePanMouseDown,
    handleContextMenu,
    centerContent,
    zoomIn,
    zoomOut
  } = useCanvasPanZoom({
    minScale: 0.15,
    maxScale: 4.0,
    initialScale: 0.8,
    zoomSensitivity: 1.15
  });

  // Auto-center content on initial mount
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (!hasAutoCentered.current && containerRef.current) {
      hasAutoCentered.current = true;
      centerContent(canvasWidth, canvasHeight, 0.75);
    }
  }, [canvasWidth, canvasHeight, centerContent]);

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

  // Main Render Loop: 7-Layer Parallax Architecture & 64px Dual-Noise Blended Terrain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      ctx.fillStyle = activeBiome.ambientBackgroundColor || '#111827';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // ==========================================
    // 2. RENDER BIOME CELL ATMOSPHERE TINT (Blank Air Tiles)
    // ==========================================
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
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
      }
    }

    // ==========================================
    // 3. LAYER 0: MAIN GAMEPLAY PLANE (Lazy Per-Chunk Cached Rendering with Slope/Shape Support)
    // ==========================================
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

    // ==========================================
    // 4. LAYER 0: ENVIRONMENTAL NON-TILE DETAILS (Trees, Rocks, Bushes)
    // ==========================================
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
        if (!cell.environmental_detail_id) continue;

        const env = envDetailMap[cell.environmental_detail_id];
        if (!env) continue;

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
      }
    }

    // ==========================================
    // 5. LAYER 0: WILDLIFE (Roamers & Ambient Flyers)
    // ==========================================
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
        if (!cell.wildlife_id) continue;

        const fauna = wildlifeMap[cell.wildlife_id];
        if (!fauna) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fauna.icon, screenX + TILE_SIZE * 0.7, screenY + TILE_SIZE * 0.3);
      }
    }

    // ==========================================
    // 6. LAYER 0: INTERACTIVE DETAILS (Enemies, Doors, Items, Binding Stones)
    // ==========================================
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
        if (!cell.interactive_detail_id) continue;

        const item = interactiveDetailMap[cell.interactive_detail_id];
        if (!item) continue;

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
      }
    }

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

    // ==========================================
    // 8. GRID OVERLAY (64px)
    // ==========================================
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= mapData.width; x++) {
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, mapData.height * TILE_SIZE);
      }
      for (let y = 0; y <= mapData.height; y++) {
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(mapData.width * TILE_SIZE, y * TILE_SIZE);
      }
      ctx.stroke();
    }

  }, [
    mapData, 
    showGrid, 
    showDamageMasks, 
    showParallaxBg, 
    showForegroundLayer, 
    pan.x, 
    pan.y, 
    scale, 
    activeBiome, 
    biomeMap, 
    tileTypeMap, 
    envDetailMap, 
    interactiveDetailMap, 
    wildlifeMap
  ]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
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

    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;

    if (normX < 0 || normX >= 1 || normY < 0 || normY >= 1) return null;

    const tileX = Math.floor(normX * mapData.width);
    const tileY = Math.floor(normY * mapData.height);

    return { x: tileX, y: tileY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && (e as React.MouseEvent).button === 2) {
      handlePanMouseDown(e as React.MouseEvent);
      return;
    }

    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) onTileInteract(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPanning) return;
    const coords = getCoordinates(e);
    if (coords) onTileInteract(coords.x, coords.y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handlePanMouseDown}
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
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: 'transform'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          className="block shadow-2xl bg-black ring-1 ring-neutral-800 rounded-sm"
        />
      </div>

      {/* Floating Viewport Navigation & Parallax HUD */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-700/80 shadow-2xl text-xs select-none">
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
          onClick={() => centerContent(canvasWidth, canvasHeight, 1.0)}
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
          onClick={() => centerContent(canvasWidth, canvasHeight, 0.75)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          title="Fit & Center View"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
