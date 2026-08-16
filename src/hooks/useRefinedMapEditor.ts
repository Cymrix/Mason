import { useState, useCallback, useEffect, useRef } from 'react';
import { RefinedMapData, ToolType, ModeType, PaintCategory } from '../types';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from '../engine/refinedBiomes';
import { 
  ProjectData, 
  generateProjectId, 
  saveProjectToStorage, 
  loadProjectFromStorage, 
  getAllSavedProjects,
  saveAutoSave,
  createStarterProject
} from '../utils/projectStorage';
import { 
  BiomeAllocationMatrix, 
  buildMapFromBiomeMatrix, 
  MetroidvaniaLayoutStyle 
} from '../engine/metroidvaniaGenerator';

const INITIAL_WIDTH = 24;
const INITIAL_HEIGHT = 24;

const createEmptyRefinedMap = (
  width: number, 
  height: number, 
  defaultBiomeId: string, 
  defaultTileTypeId: string = ''
): RefinedMapData => {
  return {
    width,
    height,
    cells: Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({
        biome_id: defaultBiomeId,
        tile_type_id: defaultTileTypeId, // '' means open air / traversable space
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
  // Project metadata
  const [projectId, setProjectId] = useState<string>(() => generateProjectId('mourne_world'));
  const [projectName, setProjectName] = useState<string>('Ashen Steppes Metroidvania');
  const [projectDescription, setProjectDescription] = useState<string>('Sidescroller 2D cavern world with 7-layer parallax backgrounds.');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>(() => new Date().toISOString());

  // Biomes and active biome
  const [biomes, setBiomesState] = useState<RefinedBiome[]>(INITIAL_REFINED_BIOMES);
  const [activeBiomeId, setActiveBiomeId] = useState<string>('mourne_ashen_steppes');
  
  const activeBiome = biomes.find(b => b.id === activeBiomeId) || biomes[0];

  // Map Data
  const [mapData, setMapDataState] = useState<RefinedMapData>(() => 
    createEmptyRefinedMap(INITIAL_WIDTH, INITIAL_HEIGHT, activeBiome.id, activeBiome.primaryTileTypeId || 'ashen_basalt')
  );

  // Editor modes & tools
  const [mode, setMode] = useState<ModeType>('paint');
  const [paintCategory, setPaintCategory] = useState<PaintCategory>('tile_type');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ashen_basalt'); // '' represents Blank / Open Air
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [autoScatterEnvironmental, setAutoScatterEnvironmental] = useState<boolean>(true);
  const [autoScatterWildlife, setAutoScatterWildlife] = useState<boolean>(true);

  // Setter wrappers to mark unsaved changes
  const setBiomes = useCallback((newBiomes: RefinedBiome[] | ((prev: RefinedBiome[]) => RefinedBiome[])) => {
    setBiomesState(newBiomes);
    setHasUnsavedChanges(true);
  }, []);

  const setMapData = useCallback((newMap: RefinedMapData | ((prev: RefinedMapData) => RefinedMapData)) => {
    setMapDataState(newMap);
    setHasUnsavedChanges(true);
  }, []);

  // Assemble full project object
  const getCurrentProjectData = useCallback((): ProjectData => {
    return {
      id: projectId,
      name: projectName,
      description: projectDescription,
      engine_version: '2.0-refined-biomes',
      tile_size_px: 64,
      createdAt: lastSavedTimestamp,
      updatedAt: new Date().toISOString(),
      map: mapData,
      biomes,
      activeBiomeId,
      settings: {
        brushSize,
        autoScatterEnvironmental,
        autoScatterWildlife
      }
    };
  }, [projectId, projectName, projectDescription, lastSavedTimestamp, mapData, biomes, activeBiomeId, brushSize, autoScatterEnvironmental, autoScatterWildlife]);

  // Save current project to storage
  const saveCurrentProject = useCallback((name?: string, description?: string) => {
    const finalName = name || projectName;
    const finalDesc = description !== undefined ? description : projectDescription;
    
    if (name) setProjectName(name);
    if (description !== undefined) setProjectDescription(description);

    const projectToSave: ProjectData = {
      id: projectId,
      name: finalName,
      description: finalDesc,
      engine_version: '2.0-refined-biomes',
      tile_size_px: 64,
      createdAt: lastSavedTimestamp,
      updatedAt: new Date().toISOString(),
      map: mapData,
      biomes,
      activeBiomeId,
      settings: {
        brushSize,
        autoScatterEnvironmental,
        autoScatterWildlife
      }
    };

    saveProjectToStorage(projectToSave);
    setHasUnsavedChanges(false);
    setLastSavedTimestamp(projectToSave.updatedAt);
    return projectToSave;
  }, [projectId, projectName, projectDescription, lastSavedTimestamp, mapData, biomes, activeBiomeId, brushSize, autoScatterEnvironmental, autoScatterWildlife]);

  // Load project into active state
  const loadProject = useCallback((project: ProjectData) => {
    setProjectId(project.id || generateProjectId(project.name || 'loaded_world'));
    setProjectName(project.name || 'Untitled World');
    setProjectDescription(project.description || '');
    setBiomesState(project.biomes && project.biomes.length > 0 ? project.biomes : INITIAL_REFINED_BIOMES);
    
    const validBiomeId = project.biomes?.some(b => b.id === project.activeBiomeId) 
      ? project.activeBiomeId 
      : project.biomes?.[0]?.id || 'mourne_ashen_steppes';
    setActiveBiomeId(validBiomeId);

    if (project.map && project.map.cells) {
      // Ensure all cells have biome_id
      const normalizedCells = project.map.cells.map(row => row.map(cell => ({
        ...cell,
        biome_id: cell.biome_id || validBiomeId,
        tile_type_id: cell.tile_type_id !== undefined ? cell.tile_type_id : ''
      })));
      setMapDataState({ ...project.map, cells: normalizedCells });
    } else {
      const defaultTile = project.biomes?.find(b => b.id === validBiomeId)?.primaryTileTypeId || 'ashen_basalt';
      setMapDataState(createEmptyRefinedMap(24, 24, validBiomeId, defaultTile));
    }

    if (project.settings) {
      if (project.settings.brushSize) setBrushSize(project.settings.brushSize);
      if (project.settings.autoScatterEnvironmental !== undefined) setAutoScatterEnvironmental(project.settings.autoScatterEnvironmental);
      if (project.settings.autoScatterWildlife !== undefined) setAutoScatterWildlife(project.settings.autoScatterWildlife);
    }

    const firstTile = project.biomes?.find(b => b.id === validBiomeId)?.tileTypes[0]?.id || 'ashen_basalt';
    setSelectedAssetId(firstTile);
    setPaintCategory('tile_type');

    setHasUnsavedChanges(false);
    setLastSavedTimestamp(project.updatedAt || new Date().toISOString());
  }, []);

  // Initialize from storage or starter on first mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const allProjects = getAllSavedProjects();
    if (allProjects.length > 0) {
      const mostRecent = loadProjectFromStorage(allProjects[0].id);
      if (mostRecent) {
        loadProject(mostRecent);
        return;
      }
    }

    const defaultStarter = createStarterProject('mourne_steppes_outpost');
    saveProjectToStorage(defaultStarter);
    loadProject(defaultStarter);
  }, [loadProject]);

  // Debounced auto-save to prevent data loss
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      const curr = getCurrentProjectData();
      saveAutoSave(curr);
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, getCurrentProjectData]);

  const applyTool = useCallback((centerX: number, centerY: number) => {
    if (centerX < 0 || centerX >= mapData.width || centerY < 0 || centerY >= mapData.height) return;

    setMapData(prev => {
      const newCells = prev.cells.map(row => row.map(cell => ({ ...cell })));
      const radius = Math.floor(brushSize / 2);

      const paintCell = (x: number, y: number) => {
        if (x < 0 || x >= prev.width || y < 0 || y >= prev.height) return;
        const target = newCells[y][x];

        // Always stamp the cell with the active biome
        target.biome_id = activeBiome.id;

        if (activeTool === 'brush') {
          if (paintCategory === 'tile_type') {
            target.tile_type_id = selectedAssetId; // Can be '' for Open Air, or a solid tile ID
            
            // If painting solid tile, auto-scatter environmental & wildlife if enabled
            if (selectedAssetId !== '') {
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
            // Erasing terrain turns it into Open Air / Blank space while retaining the biome background!
            target.tile_type_id = '';
            target.environmental_detail_id = null;
            target.wildlife_id = null;
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
          newCells[cy][cx].biome_id = activeBiome.id;

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

  // Apply a 1px:1tile Biome Allocation Matrix to the world
  const applyBiomeMatrix = useCallback((
    matrix: BiomeAllocationMatrix, 
    layoutStyle: MetroidvaniaLayoutStyle = 'blank_air'
  ) => {
    const generated = buildMapFromBiomeMatrix(matrix, biomes, layoutStyle);
    setMapData(generated);
  }, [biomes, setMapData]);

  // Quick procedural generator
  const generateBiomeWorld = useCallback((layoutStyle: MetroidvaniaLayoutStyle = 'sidescroller_platforms') => {
    const matrix: BiomeAllocationMatrix = {
      width: mapData.width,
      height: mapData.height,
      biomeIds: Array(mapData.height).fill(null).map(() => Array(mapData.width).fill(activeBiome.id))
    };
    applyBiomeMatrix(matrix, layoutStyle);
  }, [mapData.width, mapData.height, activeBiome.id, applyBiomeMatrix]);

  return {
    projectId,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    hasUnsavedChanges,
    saveCurrentProject,
    loadProject,
    getCurrentProjectData,
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
    applyBiomeMatrix,
    autoScatterEnvironmental,
    setAutoScatterEnvironmental,
    autoScatterWildlife,
    setAutoScatterWildlife,
    generateBiomeWorld
  };
};
