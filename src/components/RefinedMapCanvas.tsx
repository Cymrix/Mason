import React, { useRef, useEffect } from 'react';
import { RefinedMapData } from '../types';
import { TILE_SIZE, RefinedBiome, BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell } from '../engine/tileMaterialRenderer';
import { drawThresholdCrackMask } from '../engine/heightBlendShader';

interface RefinedMapCanvasProps {
  mapData: RefinedMapData;
  biomes: RefinedBiome[];
  onTileInteract: (x: number, y: number) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  showGrid?: boolean;
  showDamageMasks?: boolean;
}

export const RefinedMapCanvas: React.FC<RefinedMapCanvasProps> = ({
  mapData,
  biomes,
  onTileInteract,
  isDrawing,
  setIsDrawing,
  showGrid = true,
  showDamageMasks = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Biome and TileType lookup caches
  const { tileTypeMap, envDetailMap, interactiveDetailMap, wildlifeMap } = React.useMemo(() => {
    const tileTypes: Record<string, { tileType: BiomeTileType; biome: RefinedBiome }> = {};
    const envDetails: Record<string, any> = {};
    const interactiveDetails: Record<string, any> = {};
    const wildlifeItems: Record<string, any> = {};

    biomes.forEach(biome => {
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

    return { tileTypeMap: tileTypes, envDetailMap: envDetails, interactiveDetailMap: interactiveDetails, wildlifeMap: wildlifeItems };
  }, [biomes]);

  // Main 64px PBR Dual-Noise Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Render World-Aligned Repeating Base Materials with Dual-Noise Blend & Autotiling Edge Overlays
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
        const tileTypeId = cell.tile_type_id;
        
        // Lookup TileType
        const record = tileTypeMap[tileTypeId];
        if (!record) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        // Neighbor check for auto-tiling composite edges
        const hasTop = y > 0 && mapData.cells[y - 1][x].tile_type_id === tileTypeId;
        const hasBottom = y < mapData.height - 1 && mapData.cells[y + 1][x].tile_type_id === tileTypeId;
        const hasLeft = x > 0 && mapData.cells[y][x - 1].tile_type_id === tileTypeId;
        const hasRight = x < mapData.width - 1 && mapData.cells[y][x + 1].tile_type_id === tileTypeId;

        renderRefinedTileCell(
          ctx,
          x,
          y,
          screenX,
          screenY,
          TILE_SIZE,
          record.tileType,
          { hasTop, hasBottom, hasLeft, hasRight }
        );

        // Cracking overlay if damaged
        if (showDamageMasks && cell.damage_threshold_index > 0) {
          drawThresholdCrackMask(
            ctx, 
            screenX, 
            screenY, 
            TILE_SIZE, 
            cell.damage_threshold_index, 
            record.tileType.shares_damage_overlay, 
            42
          );
        }
      }
    }

    // 2. Render Environmental Non-Tile Details (Trees, Rocks, Bushes)
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
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 8, TILE_SIZE * 0.35, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon Graphic
        ctx.font = `${Math.floor(TILE_SIZE * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(env.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }
    }

    // 3. Render Wildlife
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.cells[y][x];
        if (!cell.wildlife_id) continue;

        const fauna = wildlifeMap[cell.wildlife_id];
        if (!fauna) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fauna.icon, screenX + TILE_SIZE * 0.75, screenY + TILE_SIZE * 0.25);
      }
    }

    // 4. Render Interactive Placement Details (Enemies, Doors, Items, Chests, Binding Stones)
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

    // 5. Grid Overlay (64px)
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

  }, [mapData, showGrid, showDamageMasks, tileTypeMap, envDetailMap, interactiveDetailMap, wildlifeMap]);

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
