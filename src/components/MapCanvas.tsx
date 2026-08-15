import React, { useRef, useEffect } from 'react';
import { MapData } from '../types';
import { TILE_MAP, TILE_SIZE } from '../constants';
import { Biome } from '../engine/biomes';

interface MapCanvasProps {
  mapData: MapData;
  biomes?: Biome[];
  onTileInteract: (x: number, y: number) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ 
  mapData, 
  biomes = [],
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper map for quick biome and decor lookup
  const biomeMap = React.useMemo(() => {
    const map: Record<string, Biome> = {};
    biomes.forEach(b => { map[b.id] = b; });
    return map;
  }, [biomes]);

  const decorMap = React.useMemo(() => {
    const map: Record<string, { name: string; color: string; icon: string; layer: string }> = {};
    biomes.forEach(b => {
      b.decorItems.forEach(d => {
        map[d.id] = { name: d.name, color: d.color, icon: d.icon, layer: d.layer };
      });
    });
    return map;
  }, [biomes]);

  // Draw the map whenever mapData changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw procedural layer (Biomes & Base Terrain)
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tileId = mapData.layers.procedural[y][x];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (biomeMap[tileId]) {
          const biome = biomeMap[tileId];
          // Base Strata
          ctx.fillStyle = biome.baseColor;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          // Top/Side Surface Shading & Height Blend overlay
          ctx.fillStyle = biome.accentColor;
          ctx.globalAlpha = 0.15 + biome.material.blendSoftness * 0.1;
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.globalAlpha = 1.0;

          // Surface Overlay Edge Accent
          ctx.fillStyle = biome.material.surfaceOverlayColor;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
          ctx.globalAlpha = 1.0;
        } else if (tileId && TILE_MAP[tileId]) {
          ctx.fillStyle = TILE_MAP[tileId].color;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // 2. Draw manual layer (Override tiles, Detail Decor, & Foreground Objects)
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tileId = mapData.layers.manual[y][x];
        if (!tileId) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        // Check if it's a dynamic Biome Decor object
        if (decorMap[tileId]) {
          const decor = decorMap[tileId];
          
          if (decor.layer === 'tile_layer') {
            // Tile-layer objects blend as part of that tile's material
            ctx.fillStyle = decor.color;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Small subtle glyph
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(decor.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          } else {
            // Foreground-layer objects ignore tile blending entirely (distinct interactive/destructible entity)
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 8, TILE_SIZE - 8);

            // Body
            ctx.fillStyle = decor.color;
            ctx.fillRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);

            // Glyph
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(decor.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          }
        } else if (TILE_MAP[tileId]) {
          // Legacy object/tile
          ctx.fillStyle = TILE_MAP[tileId].color;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          
          if (TILE_MAP[tileId].type === 'object') {
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          }
        }
      }
    }

    // 3. Draw Grid
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

  }, [mapData, showGrid, biomeMap, decorMap]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    return { x: tileX, y: tileY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (coords) onTileInteract(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (coords) onTileInteract(coords.x, coords.y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <div 
      ref={containerRef}
      className="overflow-auto w-full h-full bg-neutral-950 border border-neutral-800 select-none cursor-crosshair flex items-center justify-center p-8"
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchEnd={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        width={mapData.width * TILE_SIZE}
        height={mapData.height * TILE_SIZE}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        className="block shadow-2xl rounded-md bg-black ring-1 ring-neutral-800"
      />
    </div>
  );
};
