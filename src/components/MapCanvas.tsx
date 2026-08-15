import React, { useRef, useEffect } from 'react';
import { MapData } from '../types';
import { TILE_SIZE } from '../constants';
import { Biome } from '../engine/biomes';
import { TileType } from '../engine/schema';
import { STANDARD_TILE_TYPES, computeDamageThresholdIndex } from '../engine/tileTypes';
import { computeHeightBlend, drawThresholdCrackMask } from '../engine/heightBlendShader';

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Main Render Loop: Height-Blend Shader Simulation & Shared Destruction Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Procedural & Base Material Layer with Continuous Height-Blend Shader
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tileId = mapData.layers.procedural[y][x];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        // Resolve material TileType resource (reference-not-duplicate)
        const currentTileType: TileType = tileTypes[tileId] || (biomeMap[tileId] ? {
          id: biomeMap[tileId].id,
          name: biomeMap[tileId].name,
          category: 'natural',
          height_map_scale: biomeMap[tileId].material.heightScale,
          base_color: biomeMap[tileId].baseColor,
          surface_overlay_top: biomeMap[tileId].accentColor,
          surface_overlay_side: biomeMap[tileId].material.surfaceOverlayColor,
          softness: biomeMap[tileId].material.blendSoftness,
          blend_style: 'fade',
          fade_amount: 0.4,
          health: biomeMap[tileId].material.health,
          defense_type: 'kinetic',
          armor_deduction: biomeMap[tileId].material.armor,
          damage_affinities: biomeMap[tileId].material.damageAffinities,
          shares_damage_overlay: true,
          traversal_tags: [],
          speed_modifier: 1.0
        } : STANDARD_TILE_TYPES.stone);

        // Base Strata
        ctx.fillStyle = currentTileType.base_color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Check right neighbor for horizontal height-blend boundary
        if (x < mapData.width - 1) {
          const rightId = mapData.layers.procedural[y][x + 1];
          if (rightId && rightId !== tileId) {
            const neighborType = tileTypes[rightId] || STANDARD_TILE_TYPES.stone;
            const blend = computeHeightBlend(x, y, currentTileType, neighborType, 0.0);
            
            // Continuous alpha blend along border
            ctx.fillStyle = neighborType.base_color;
            ctx.globalAlpha = blend.blendAlpha * 0.45;
            ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);
            ctx.globalAlpha = 1.0;
          }
        }

        // Check bottom neighbor for vertical height-blend boundary
        if (y < mapData.height - 1) {
          const bottomId = mapData.layers.procedural[y + 1][x];
          if (bottomId && bottomId !== tileId) {
            const neighborType = tileTypes[bottomId] || STANDARD_TILE_TYPES.stone;
            const blend = computeHeightBlend(x, y, currentTileType, neighborType, 0.0);
            
            ctx.fillStyle = neighborType.base_color;
            ctx.globalAlpha = blend.blendAlpha * 0.45;
            ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
            ctx.globalAlpha = 1.0;
          }
        }

        // Top Surface Overlay
        if (currentTileType.surface_overlay_top) {
          ctx.fillStyle = currentTileType.surface_overlay_top;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // 2. Draw Manual Layer (Tile-Layer Objects & Foreground Entities)
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tileId = mapData.layers.manual[y][x];
        if (!tileId) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (decorMap[tileId]) {
          const decor = decorMap[tileId];

          if (decor.layer === 'tile_layer') {
            // Tile-layer objects: baked into composite material, blends with terrain
            ctx.fillStyle = decor.color;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(decor.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          } else {
            // Foreground-layer objects: independent nodes with shadow & distinct collision
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(screenX + 3, screenY + 5, TILE_SIZE - 6, TILE_SIZE - 6);

            ctx.fillStyle = decor.color;
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(decor.icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          }
        } else if (tileTypes[tileId]) {
          // Manual material override
          const m = tileTypes[tileId];
          ctx.fillStyle = m.base_color;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // 3. Draw Shared Damage & Threshold Crack Masks
    if (showDamageMasks) {
      // Deterministic threshold cracking test pattern
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;
          const hostId = mapData.layers.procedural[y][x];
          const tile = tileTypes[hostId] || STANDARD_TILE_TYPES.stone;

          // Simulated damage pattern for interactive demonstration
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
