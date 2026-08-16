import React, { useRef, useEffect } from 'react';
import { MapData } from '../types';
import { TILE_SIZE } from '../constants';
import { Biome } from '../engine/biomes';
import { TileType } from '../engine/schema';
import { STANDARD_TILE_TYPES } from '../engine/tileTypes';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface MapCanvasProps {
  mapData: MapData;
  biomes?: Biome[];
  tileTypes?: Record<string, TileType>;
  onTileInteract: (x: number, y: number) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
  showDamageMasks?: boolean;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ 
  mapData, 
  biomes = [],
  tileTypes = STANDARD_TILE_TYPES,
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true,
  showDamageMasks = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (!hasAutoCentered.current && containerRef.current) {
      hasAutoCentered.current = true;
      centerContent(canvasWidth, canvasHeight, 0.75);
    }
  }, [canvasWidth, canvasHeight, centerContent]);

  // Quick lookup caches
  const biomeMap = React.useMemo(() => {
    const map: Record<string, Biome> = {};
    biomes.forEach(b => { map[b.id] = b; });
    return map;
  }, [biomes]);

  const decorMap = React.useMemo(() => {
    const map: Record<string, { name: string; color: string; icon: string; layer: string; health: number; armor: number }> = {};
    biomes.forEach(b => {
      b.decorItems.forEach(d => {
        map[d.id] = { 
          name: d.name, 
          color: d.color, 
          icon: d.icon, 
          layer: d.layer,
          health: d.health,
          armor: d.armor
        };
      });
    });
    return map;
  }, [biomes]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Procedural Base Layer
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tileTypeId = mapData.layers.procedural[y][x];
        const tile = tileTypes[tileTypeId] || STANDARD_TILE_TYPES.stone;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        ctx.fillStyle = tile.base_color || '#334155';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    // 2. Interactive Details Layer
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const decorId = mapData.layers.interactive[y][x];
        if (!decorId) continue;

        const decor = decorMap[decorId];
        if (!decor) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(decor.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }
    }

    // 3. Render Destruction Overlay Masks
    if (showDamageMasks) {
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;
          const hostId = mapData.layers.procedural[y][x];
          const tile = tileTypes[hostId] || STANDARD_TILE_TYPES.stone;

          if ((x === 12 && y === 12) || (x === 13 && y === 12) || (x === 14 && y === 12)) {
            drawThresholdCrackMask(ctx, screenX, screenY, TILE_SIZE, 2, tile.shares_damage_overlay, 42);
          }
        }
      }
    }

    // 4. Draw Grid
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

  }, [mapData, showGrid, showDamageMasks, biomeMap, decorMap, tileTypes]);

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

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-700/80 shadow-2xl text-xs select-none">
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
