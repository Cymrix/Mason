import { useState, useCallback } from 'react';
import { MapData, ToolType, LayerType, ModeType } from '../types';
import { Biome, INITIAL_BIOMES } from '../engine/biomes';
import { TileType } from '../engine/schema';
import { STANDARD_TILE_TYPES, resolveTileDamage } from '../engine/tileTypes';

const INITIAL_WIDTH = 64;
const INITIAL_HEIGHT = 64;

const createEmptyMap = (width: number, height: number): MapData => {
  return {
    width,
    height,
    layers: {
      procedural: Array(height).fill(null).map(() => Array(width).fill('stone')),
      manual: Array(height).fill(null).map(() => Array(width).fill(null)),
    },
  };
};

export const useMapEditor = () => {
  const [mapData, setMapData] = useState<MapData>(createEmptyMap(INITIAL_WIDTH, INITIAL_HEIGHT));
  const [biomes, setBiomes] = useState<Biome[]>(INITIAL_BIOMES);
  const [tileTypes, setTileTypes] = useState<Record<string, TileType>>(STANDARD_TILE_TYPES);
  const [activeBiomeId, setActiveBiomeId] = useState<string>('mourne_ashen_steppes');
  const [mode, setMode] = useState<ModeType>('paint');
  const [activeLayer, setActiveLayer] = useState<LayerType>('procedural');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [selectedTile, setSelectedTile] = useState<string>('stone');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(1);
  const [autoScatterEnabled, setAutoScatterEnabled] = useState<boolean>(true);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const applyTool = useCallback((centerX: number, centerY: number) => {
    if (centerX < 0 || centerX >= mapData.width || centerY < 0 || centerY >= mapData.height) return;

    setMapData((prev) => {
      const newMap = {
        ...prev,
        layers: {
          procedural: prev.layers.procedural.map(row => [...row]),
          manual: prev.layers.manual.map(row => [...row]),
        }
      };

      const radius = Math.floor(brushSize / 2);
      const activeBiome = biomes.find(b => b.id === selectedTile || b.id === activeBiomeId);

      const paintCell = (x: number, y: number) => {
        if (x < 0 || x >= prev.width || y < 0 || y >= prev.height) return;

        if (activeTool === 'brush') {
          if (activeLayer === 'procedural') {
            if (newMap.layers.procedural[y]) newMap.layers.procedural[y][x] = selectedTile;

            // Auto-scatter for biome painting
            if (autoScatterEnabled && activeBiome && activeBiome.decorItems.length > 0) {
              let placedDecor: string | null = null;
              for (const decor of activeBiome.decorItems) {
                if (Math.random() < decor.frequency * 0.4) {
                  placedDecor = decor.id;
                  break;
                }
              }
              if (placedDecor) {
                if (newMap.layers.manual[y]) newMap.layers.manual[y][x] = placedDecor;
              }
            }
          } else {
            // Manual layer placement
            if (newMap.layers.manual[y]) newMap.layers.manual[y][x] = selectedTile;
          }
        } else if (activeTool === 'eraser') {
          if (activeLayer === 'procedural') {
            if (newMap.layers.procedural[y]) newMap.layers.procedural[y][x] = 'stone';
          } else {
            if (newMap.layers.manual[y]) newMap.layers.manual[y][x] = null;
          }
        }
      };

      if (activeTool === 'bucket') {
        const targetTile = prev.layers?.[activeLayer]?.[centerY]?.[centerX];
      if (targetTile === undefined) return prev;
        const replacement = activeTool === 'eraser' 
          ? (activeLayer === 'procedural' ? 'stone' : null) 
          : selectedTile;

        if (targetTile === replacement) return prev;

        const stack = [[centerX, centerY]];
        const visited = new Set<string>();

        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          const key = `${cx},${cy}`;
          if (visited.has(key)) continue;
          visited.add(key);

          if (cx < 0 || cx >= prev.width || cy < 0 || cy >= prev.height) continue;
          if (newMap.layers[activeLayer][cy]?.[cx] !== targetTile) continue;

          if (newMap.layers[activeLayer][cy]) newMap.layers[activeLayer][cy][cx] = replacement as any;

          if (activeLayer === 'procedural' && autoScatterEnabled && activeBiome && replacement) {
            for (const decor of activeBiome.decorItems) {
              if (Math.random() < decor.frequency * 0.3) {
                if(newMap.layers.manual[cy]) newMap.layers.manual[cy][cx] = decor.id;
                break;
              }
            }
          }

          stack.push([cx + 1, cy]);
          stack.push([cx - 1, cy]);
          stack.push([cx, cy + 1]);
          stack.push([cx, cy - 1]);
        }

        return newMap;
      }

      // Radius painting
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (brushSize > 2 && dx * dx + dy * dy > radius * radius + 1) continue;
          paintCell(centerX + dx, centerY + dy);
        }
      }

      return newMap;
    });
  }, [mapData.width, mapData.height, activeLayer, activeTool, selectedTile, brushSize, autoScatterEnabled, biomes, activeBiomeId]);

  // Macro procedural generator
  const generateWorldTemplate = useCallback(() => {
    setMapData((prev) => {
      const newProcedural = Array(prev.height).fill(null).map(() => Array(prev.width).fill('stone'));
      const newManual = Array(prev.height).fill(null).map(() => Array(prev.width).fill(null));

      const pseudoNoise = (x: number, y: number, scale: number) => {
        return (Math.sin(x / scale * 3.14 + y / scale * 1.618) + Math.cos(x / scale * 0.8 + y / scale * 2.2)) * 0.5 + 0.5;
      };

      for (let y = 0; y < prev.height; y++) {
        for (let x = 0; x < prev.width; x++) {
          const val = pseudoNoise(x, y, 16);
          let assignedBiome = biomes[0];
          if (biomes.length > 1) {
            const index = Math.floor(val * biomes.length) % biomes.length;
            assignedBiome = biomes[index];
          }

          if(newProcedural[y]) newProcedural[y][x] = assignedBiome.id;

          for (const decor of assignedBiome.decorItems) {
            if (Math.random() < decor.frequency * assignedBiome.noise.scatterDensity * 0.6) {
              if(newManual[y]) newManual[y][x] = decor.id;
              break;
            }
          }
        }
      }

      return {
        ...prev,
        layers: {
          procedural: newProcedural,
          manual: newManual
        }
      };
    });
  }, [biomes]);

  return {
    mapData,
    setMapData,
    biomes,
    setBiomes,
    tileTypes,
    setTileTypes,
    activeBiomeId,
    setActiveBiomeId,
    mode,
    setMode,
    activeLayer,
    setActiveLayer,
    activeTool,
    setActiveTool,
    selectedTile,
    setSelectedTile,
    isDrawing,
    setIsDrawing,
    applyTool,
    brushSize,
    setBrushSize,
    autoScatterEnabled,
    setAutoScatterEnabled,
    generateWorldTemplate,
    offset,
    setOffset,
    zoom,
    setZoom
  };
};
