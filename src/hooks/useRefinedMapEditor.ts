import { useState, useCallback } from 'react';
import { RefinedMapData, ToolType, ModeType, PaintCategory } from '../types';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from '../engine/refinedBiomes';

const INITIAL_WIDTH = 24; // 24x24 tiles at 64px = 1536x1536 viewport
const INITIAL_HEIGHT = 24;

const createEmptyRefinedMap = (width: number, height: number, defaultTileTypeId: string): RefinedMapData => {
  return {
    width,
    height,
    cells: Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({
        tile_type_id: defaultTileTypeId,
        current_health: 100,
        damage_threshold_index: 0,
        environmental_detail_id: null,
        interactive_detail_id: null,
        wildlife_id: null
      }))
    ),
  };
};

export const useRefinedMapEditor = () => {
  const [biomes, setBiomes] = useState<RefinedBiome[]>(INITIAL_REFINED_BIOMES);
  const [activeBiomeId, setActiveBiomeId] = useState<string>('mourne_ashen_steppes');
  
  const activeBiome = biomes.find(b => b.id === activeBiomeId) || biomes[0];

  const [mapData, setMapData] = useState<RefinedMapData>(() => 
    createEmptyRefinedMap(INITIAL_WIDTH, INITIAL_HEIGHT, activeBiome.primaryTileTypeId || 'ashen_basalt')
  );

  const [mode, setMode] = useState<ModeType>('paint');
  const [paintCategory, setPaintCategory] = useState<PaintCategory>('tile_type');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ashen_basalt');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [autoScatterEnvironmental, setAutoScatterEnvironmental] = useState<boolean>(true);
  const [autoScatterWildlife, setAutoScatterWildlife] = useState<boolean>(true);

  const applyTool = useCallback((centerX: number, centerY: number) => {
    if (centerX < 0 || centerX >= mapData.width || centerY < 0 || centerY >= mapData.height) return;

    setMapData(prev => {
      const newCells = prev.cells.map(row => row.map(cell => ({ ...cell })));
      const radius = Math.floor(brushSize / 2);

      const paintCell = (x: number, y: number) => {
        if (x < 0 || x >= prev.width || y < 0 || y >= prev.height) return;
        const target = newCells[y][x];

        if (activeTool === 'brush') {
          if (paintCategory === 'tile_type') {
            target.tile_type_id = selectedAssetId;
            
            // Auto-scatter environmental & wildlife if enabled
            if (autoScatterEnvironmental && activeBiome.environmentalDetails.length > 0) {
              let placedEnv: string | null = null;
              for (const env of activeBiome.environmentalDetails) {
                if (Math.random() < env.spawnFrequency * 0.35) {
                  placedEnv = env.id;
                  break;
                }
              }
              target.environmental_detail_id = placedEnv;
            }

            if (autoScatterWildlife && activeBiome.wildlife.length > 0) {
              let placedFauna: string | null = null;
              for (const fauna of activeBiome.wildlife) {
                if (Math.random() < fauna.spawnFrequency * 0.2) {
                  placedFauna = fauna.id;
                  break;
                }
              }
              target.wildlife_id = placedFauna;
            }
          } else if (paintCategory === 'environmental') {
            target.environmental_detail_id = selectedAssetId;
          } else if (paintCategory === 'interactive') {
            target.interactive_detail_id = selectedAssetId;
          } else if (paintCategory === 'wildlife') {
            target.wildlife_id = selectedAssetId;
          }
        } else if (activeTool === 'eraser') {
          if (paintCategory === 'tile_type') {
            target.tile_type_id = activeBiome.primaryTileTypeId || 'ashen_basalt';
          } else if (paintCategory === 'environmental') {
            target.environmental_detail_id = null;
          } else if (paintCategory === 'interactive') {
            target.interactive_detail_id = null;
          } else if (paintCategory === 'wildlife') {
            target.wildlife_id = null;
          }
        }
      };

      if (activeTool === 'bucket' && paintCategory === 'tile_type') {
        const originTileId = prev.cells[centerY][centerX].tile_type_id;
        if (originTileId === selectedAssetId) return prev;

        const stack = [[centerX, centerY]];
        const visited = new Set<string>();

        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          const key = `${cx},${cy}`;
          if (visited.has(key)) continue;
          visited.add(key);

          if (cx < 0 || cx >= prev.width || cy < 0 || cy >= prev.height) continue;
          if (newCells[cy][cx].tile_type_id !== originTileId) continue;

          newCells[cy][cx].tile_type_id = selectedAssetId;

          stack.push([cx + 1, cy]);
          stack.push([cx - 1, cy]);
          stack.push([cx, cy + 1]);
          stack.push([cx, cy - 1]);
        }

        return { ...prev, cells: newCells };
      }

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (brushSize > 2 && dx * dx + dy * dy > radius * radius + 1) continue;
          paintCell(centerX + dx, centerY + dy);
        }
      }

      return { ...prev, cells: newCells };
    });
  }, [mapData.width, mapData.height, brushSize, activeTool, paintCategory, selectedAssetId, autoScatterEnvironmental, autoScatterWildlife, activeBiome]);

  // Macro procedural generator
  const generateBiomeWorld = useCallback(() => {
    setMapData(prev => {
      const newCells = prev.cells.map(row => row.map(cell => ({ ...cell })));

      const pseudoNoise = (x: number, y: number, scale: number) => {
        return (Math.sin(x / scale * 3.14 + y / scale * 1.618) + Math.cos(x / scale * 0.8 + y / scale * 2.2)) * 0.5 + 0.5;
      };

      for (let y = 0; y < prev.height; y++) {
        for (let x = 0; x < prev.width; x++) {
          const val = pseudoNoise(x, y, 8);
          const ttIndex = Math.floor(val * activeBiome.tileTypes.length) % activeBiome.tileTypes.length;
          const assignedTileType = activeBiome.tileTypes[ttIndex] || activeBiome.tileTypes[0];

          newCells[y][x].tile_type_id = assignedTileType.id;
          newCells[y][x].environmental_detail_id = null;
          newCells[y][x].interactive_detail_id = null;
          newCells[y][x].wildlife_id = null;

          // Scatter Environmental
          for (const env of activeBiome.environmentalDetails) {
            if (Math.random() < env.spawnFrequency * 0.35) {
              newCells[y][x].environmental_detail_id = env.id;
              break;
            }
          }

          // Scatter Wildlife
          for (const fauna of activeBiome.wildlife) {
            if (Math.random() < fauna.spawnFrequency * 0.15) {
              newCells[y][x].wildlife_id = fauna.id;
              break;
            }
          }
        }
      }

      // Guarantee one binding stone checkpoint in center
      newCells[Math.floor(prev.height / 2)][Math.floor(prev.width / 2)].interactive_detail_id = activeBiome.interactiveDetails[0]?.id || null;

      return { ...prev, cells: newCells };
    });
  }, [activeBiome]);

  return {
    biomes,
    setBiomes,
    activeBiomeId,
    setActiveBiomeId,
    activeBiome,
    mapData,
    setMapData,
    mode,
    setMode,
    paintCategory,
    setPaintCategory,
    selectedAssetId,
    setSelectedAssetId,
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    isDrawing,
    setIsDrawing,
    applyTool,
    autoScatterEnvironmental,
    setAutoScatterEnvironmental,
    autoScatterWildlife,
    setAutoScatterWildlife,
    generateBiomeWorld
  };
};
