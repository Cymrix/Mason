import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MasonProject, 
  MasonModuleId,
  MapFile,
  BiomeFile,
  UIThemeFile,
  GameStructureFile,
  createDefaultMapFile
} from '../engine/masonProjectSchema';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { 
  getActiveMasonProject,
  saveActiveMasonProject, 
  closeActiveMasonProject,
  listSavedProjects,
  loadSavedProjectById,
  deleteSavedProject,
  createNewProject,
  exportFullProjectBundle,
  exportMapFile, 
  exportBiomeFile,
  createNewMapInProject,
  ProjectIndexItem,
  idbGetProject,
  convertProjectDataToMasonProject
} from '../utils/masonStorage';
import { HamburgerMenu } from './HamburgerMenu';
import { ModulesModal } from './ModulesModal';
import { ProjectDashboard } from './ProjectDashboard';
import { MasonWelcomeLauncher } from './MasonWelcomeLauncher';
import { CreateProjectModal } from './CreateProjectModal';
import { LoadProjectModal } from './LoadProjectModal';
import { ProjectExplorerModal } from './ProjectExplorerModal';
import { BiomeMacroMapModal } from './BiomeMacroMapModal';
import { ModuleRunnerContainer } from './ModuleRunnerContainer';
import { RefinedMapCanvas } from './RefinedMapCanvas';
import { RefinedBiomeEditor } from './RefinedBiomeEditor';
import { UIThemeModule } from './UIThemeModule';
import { GameStructureModule } from './GameStructureModule';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { CloudSyncModal } from './CloudSyncModal';
import {
  Paintbrush,
  Eraser,
  PlusSquare,
  MinusSquare, 
  Layers, 
  TreePine, 
  Users, 
  Box, 
  Compass, 
  FolderOpen, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive,
  Download,
  Plus,
  Sun,
  Moon,
  ChevronDown,
  RefreshCw,
  Grid,
  MapPin,
  Play,
  Square,
  User,
  LayoutDashboard,
  Map,
  Sliders,
  Network,
  Cloud,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2
} from 'lucide-react';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { TileShape, TILE_SHAPE_DEFINITIONS } from '../engine/tileShape';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { getCell, setCell } from '../engine/mapChunkHelper';
import { buildMapFromBiomeMatrix, BiomeAllocationMatrix, MetroidvaniaLayoutStyle } from '../engine/metroidvaniaGenerator';
import { ToolType, ModeType, PaintCategory, RefinedMapData, RefinedCellState } from '../types';
import { MASON_VERSION_DISPLAY, MASON_FULL_VERSION } from '../version';
import { usePWA } from '../hooks/usePWA';
import { DownloadCloud, WifiOff } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';
import { ThemeModal } from './ThemeModal';
import { useAppTheme } from '../theme/ThemeContext';
import { Palette } from 'lucide-react';
import { MasonBrandIcon } from './MasonBrandIcon';

export const EditorLayout: React.FC = () => {
  // Master Mason Project State (null when no project is loaded)
  const [project, setProject] = useState<MasonProject | null>(() => getActiveMasonProject());
  
  // App Theme Hook
  const { theme, primaryDef, bgDef, getModuleColorDef } = useAppTheme();
  
  // PWA Support Hook
  const { 
    hasNativePrompt, 
    isInstalled, 
    isOffline, 
    isInIframe, 
    platform, 
    triggerNativeInstall 
  } = usePWA();

  // Active Module State (null by default when a project is loaded, showing Project Info until clicked)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [mapsSubMode, setMapsSubMode] = useState<'tilemap' | 'macro'>('tilemap');

  const handleLaunchModule = (modId: string | null) => {
    if (modId === 'macro') {
      setActiveModuleId('maps');
      setMapsSubMode('macro');
    } else {
      setActiveModuleId(modId);
      if (modId === 'maps') {
        setMapsSubMode('tilemap');
      }
    }
  };

  const handleNavigateToModule = (modId: string, options?: { behaviorFileName?: string; characterFileName?: string }) => {
    if (options?.behaviorFileName || options?.characterFileName) {
      setProject(prev => ({
        ...prev,
        activeFiles: {
          ...prev.activeFiles,
          ...(options.behaviorFileName ? { behaviorFileName: options.behaviorFileName } : {}),
          ...(options.characterFileName ? { characterFileName: options.characterFileName } : {})
        }
      }));
    }
    handleLaunchModule(modId);
  };

  // Saved projects index cache for launcher
  const [savedProjects, setSavedProjects] = useState<ProjectIndexItem[]>(() => listSavedProjects());

  // Modals state
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);
  const [isBiomeMacroModalOpen, setIsBiomeMacroModalOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Map Painting State (for maps module)
  const [mode, setMode] = useState<ModeType>('paint');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [paintCategory, setPaintCategory] = useState<PaintCategory>('tile_type');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ashen_basalt');
  const [selectedShape, setSelectedShape] = useState<TileShape>('auto');
  const [brushSize, setBrushSizeState] = useState<number>(1);
  const [recentBrushSizes, setRecentBrushSizes] = useState<number[]>([1]);

  const setBrushSize = (size: number) => {
    setBrushSizeState(size);
    setRecentBrushSizes(prev => {
      const filtered = prev.filter(s => s !== size);
      return [size, ...filtered].slice(0, 4);
    });
  };

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isLitMode, setIsLitMode] = useState<boolean>(false);
  const [showDamageMasks, setShowDamageMasks] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const refreshSavedProjects = () => {
    setSavedProjects(listSavedProjects());
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync project update
  const handleUpdateProject = (updated: MasonProject | ((prev: MasonProject) => MasonProject)) => {
    setProject(prev => {
      if (!prev) return prev;
      const newProject = typeof updated === 'function' ? updated(prev) : updated;
      saveActiveMasonProject(newProject);
      refreshSavedProjects();
      return newProject;
    });
  };

  // Project lifecycle handlers
  const handleCreateNewProject = (name: string, description: string, author: string) => {
    const newProj = createNewProject(name, description, author);
    setProject(newProj);
    setActiveModuleId(null); // Show project info by default
    refreshSavedProjects();
    showToast(`Created new project: ${name}`, 'success');
  };

  const handleSelectSavedProject = async (id: string) => {
    const loaded = loadSavedProjectById(id);
    if (loaded) {
      setProject(loaded);
      setActiveModuleId(null); // Show project info by default
      refreshSavedProjects();
      showToast(`Loaded project: ${loaded.name}`, 'success');
      return;
    }

    // Asynchronous IndexedDB fallback
    try {
      const asyncLoaded = await idbGetProject(id);
      if (asyncLoaded) {
        setProject(asyncLoaded);
        saveActiveMasonProject(asyncLoaded);
        setActiveModuleId(null);
        refreshSavedProjects();
        showToast(`Loaded project: ${asyncLoaded.name}`, 'success');
      } else {
        showToast('Project could not be found in local storage or database', 'error');
      }
    } catch {
      showToast('Error loading project from database', 'error');
    }
  };

  const handleDeleteSavedProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedProject(id);
    if (project && project.id === id) {
      setProject(null);
      setActiveModuleId(null);
    }
    refreshSavedProjects();
    showToast('Deleted project from storage', 'info');
  };

  const handleCloseProject = () => {
    closeActiveMasonProject();
    setProject(null);
    setActiveModuleId(null);
    refreshSavedProjects();
    showToast('Closed active project', 'info');
  };

  const handleImportBundle = (imported: MasonProject) => {
    saveActiveMasonProject(imported);
    setProject(imported);
    setActiveModuleId(null);
    refreshSavedProjects();
    showToast(`Restored project bundle: ${imported.name}`, 'success');
  };

  const handleExportBundle = () => {
    if (project) {
      exportFullProjectBundle(project);
      showToast(`Exported ${project.name} bundle`, 'success');
    }
  };

  // Derived references for active project
  const currentMapFile = project ? (project.fileSystem.maps.find(m => m.fileName === project.activeFiles.mapFileName) || project.fileSystem.maps[0]) : null;
  const currentBiomeFile = project ? (project.fileSystem.biomes.find(b => b.fileName === project.activeFiles.biomeFileName) || project.fileSystem.biomes[0]) : null;
  const currentCharacterFile = project ? (project.fileSystem?.characters?.find(c => c.fileName === project.activeFiles?.characterFileName) || project.fileSystem?.characters?.[0]) : null;
  const activeBiome: RefinedBiome | null = currentBiomeFile?.biomeData || project?.fileSystem.biomes?.[0]?.biomeData || null;
  const biomesList: RefinedBiome[] = project ? project.fileSystem.biomes?.map(b => b.biomeData) : [];

  // ==========================================
  // UNDO / REDO HISTORY ENGINE FOR MAP EDITOR
  // ==========================================
  const [undoStack, setUndoStack] = useState<MapFile[]>([]);
  const [redoStack, setRedoStack] = useState<MapFile[]>([]);
  const strokeStartMapRef = useRef<MapFile | null>(null);
  const currentMapFileRef = useRef<MapFile | null>(currentMapFile);

  useEffect(() => {
    currentMapFileRef.current = currentMapFile;
  }, [currentMapFile]);

  // Reset undo/redo history when active map file changes
  const activeMapFileName = project?.activeFiles?.mapFileName;
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
    strokeStartMapRef.current = null;
  }, [activeMapFileName]);

  // Push an explicit snapshot for one-shot actions (fill, clear, macro, spawn, chunk mod)
  const pushUndoSnapshot = useCallback(() => {
    if (currentMapFileRef.current) {
      const clone = JSON.parse(JSON.stringify(currentMapFileRef.current));
      setUndoStack(prev => [...prev, clone].slice(-50));
      setRedoStack([]);
    }
  }, []);

  // Stroke-level snapshot bundling: capture state on stroke start, commit on stroke end
  useEffect(() => {
    if (isDrawing) {
      if (currentMapFileRef.current && !strokeStartMapRef.current) {
        strokeStartMapRef.current = JSON.parse(JSON.stringify(currentMapFileRef.current));
      }
    } else {
      if (strokeStartMapRef.current) {
        const startSnapshot = strokeStartMapRef.current;
        strokeStartMapRef.current = null;
        setUndoStack(prev => [...prev, startSnapshot].slice(-50));
        setRedoStack([]);
      }
    }
  }, [isDrawing]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !project || !currentMapFile) return;

    const previousMap = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, undoStack.length - 1);
    const currentCloned = JSON.parse(JSON.stringify(currentMapFile));

    setUndoStack(newUndoStack);
    setRedoStack(prev => [...prev, currentCloned].slice(-50));

    handleUpdateProject(p => ({
      ...p,
      fileSystem: {
        ...p.fileSystem,
        maps: p.fileSystem.maps.map(m => m.fileName === previousMap.fileName ? previousMap : m)
      }
    }));

    globalChunkCache.invalidateMap(previousMap.id);
    showToast('Undid map edit (Ctrl+Z)', 'info');
  }, [undoStack, project, currentMapFile]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !project || !currentMapFile) return;

    const nextMap = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, redoStack.length - 1);
    const currentCloned = JSON.parse(JSON.stringify(currentMapFile));

    setRedoStack(newRedoStack);
    setUndoStack(prev => [...prev, currentCloned].slice(-50));

    handleUpdateProject(p => ({
      ...p,
      fileSystem: {
        ...p.fileSystem,
        maps: p.fileSystem.maps.map(m => m.fileName === nextMap.fileName ? nextMap : m)
      }
    }));

    globalChunkCache.invalidateMap(nextMap.id);
    showToast('Redid map edit (Ctrl+Y)', 'info');
  }, [redoStack, project, currentMapFile]);

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+Z Undo, Ctrl+Y / Ctrl+Shift+Z Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (project) {
          saveActiveMasonProject(project);
          refreshSavedProjects();
          showToast(`Saved ${project.name} to local storage`, 'success');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, handleUndo, handleRedo]);

  const currentMapData: RefinedMapData | null = currentMapFile ? {
    id: currentMapFile.id,
    name: currentMapFile.name,
    width: currentMapFile.width || 32,
    height: currentMapFile.height || 24,
    cells: currentMapFile.cells || (currentMapFile as any).data?.cells,
    chunks: currentMapFile.chunks || (currentMapFile as any).data?.chunks || {}
  } : null;

  // Character Play Mode State & Spawn Configuration
  const [selectedTestCharacterId, setSelectedTestCharacterId] = useState<string>(() => {
    return currentCharacterFile?.characterData?.id || 'char_korrath';
  });

  const availableCharacters = React.useMemo(() => {
    const charsFromProject = project?.fileSystem?.characters?.map(c => c.characterData).filter(Boolean) || [];
    if (charsFromProject.length > 0) {
      return charsFromProject;
    }
    return [
      {
        id: 'hero_knight',
        name: 'Ashen Knight',
        characterType: 'player_hero' as const,
        avatarIcon: '🛡️',
        spriteWidth: 32,
        spriteHeight: 32,
        tintColor: '#06b6d4',
        baseScale: 1.0,
        animations: [],
        sockets: []
      },
      {
        id: 'hero_sorceress',
        name: 'Astral Sorceress',
        characterType: 'player_hero' as const,
        avatarIcon: '🔮',
        spriteWidth: 32,
        spriteHeight: 32,
        tintColor: '#a855f7',
        baseScale: 1.0,
        animations: [],
        sockets: []
      },
      {
        id: 'hero_rogue',
        name: 'Shadow Stalker',
        characterType: 'player_hero' as const,
        avatarIcon: '🗡️',
        spriteWidth: 32,
        spriteHeight: 32,
        tintColor: '#10b981',
        baseScale: 1.0,
        animations: [],
        sockets: []
      },
      {
        id: 'hero_valkyrie',
        name: 'Valkyrie Warden',
        characterType: 'player_hero' as const,
        avatarIcon: '⚡',
        spriteWidth: 32,
        spriteHeight: 32,
        tintColor: '#f59e0b',
        baseScale: 1.0,
        animations: [],
        sockets: []
      }
    ];
  }, [project?.fileSystem?.characters]);

  // Synchronize active character file in Character Studio with Map Editor selected test hero
  useEffect(() => {
    if (currentCharacterFile?.characterData?.id) {
      setSelectedTestCharacterId(currentCharacterFile.characterData.id);
    } else if (availableCharacters.length > 0 && !availableCharacters.some(c => c.id === selectedTestCharacterId)) {
      setSelectedTestCharacterId(availableCharacters[0].id);
    }
  }, [currentCharacterFile?.characterData?.id, currentCharacterFile?.fileName, availableCharacters]);

  const handleSelectTestCharacter = (charId: string) => {
    setSelectedTestCharacterId(charId);
    const matchedCharFile = project?.fileSystem?.characters?.find(c => c.characterData?.id === charId || c.id === charId);
    if (matchedCharFile && project && project.activeFiles.characterFileName !== matchedCharFile.fileName) {
      handleUpdateProject(p => ({
        ...p,
        activeFiles: {
          ...p.activeFiles,
          characterFileName: matchedCharFile.fileName
        }
      }));
    }
  };

  const activeTestCharacter = React.useMemo(() => {
    return availableCharacters.find(c => c.id === selectedTestCharacterId) || availableCharacters[0];
  }, [availableCharacters, selectedTestCharacterId]);

  // Resolve Linked Behavior from Character Configuration (preferring bespoke character rules)
  const linkedBehavior = React.useMemo(() => {
    if (!activeTestCharacter) return undefined;
    if (activeTestCharacter.rules && activeTestCharacter.rules.length > 0) {
      return {
        id: activeTestCharacter.id,
        name: activeTestCharacter.name,
        title: activeTestCharacter.name,
        description: activeTestCharacter.backstory || '',
        category: (activeTestCharacter.characterType === 'player_hero' ? 'hero' : activeTestCharacter.characterType === 'boss_archon' ? 'boss' : activeTestCharacter.characterType === 'friendly_npc' ? 'npc' : 'mob') as any,
        sensoryTags: activeTestCharacter.sockets?.map(s => ({
          tagId: s.tagId,
          label: s.label,
          offsetX: s.offsetX,
          offsetY: s.offsetY,
          visualMarkerColor: s.visualMarkerColor
        })) || [],
        rules: activeTestCharacter.rules || [],
        states: activeTestCharacter.states || ['idle', 'patrol', 'combat'],
        foci: {
          id: `foci_${activeTestCharacter.id}`,
          name: 'Camera Tracker',
          focusType: 'player_tracker' as const,
          cameraZoom: 1.0,
          smoothingDamping: 0.15,
          deadzoneWidth: 64,
          deadzoneHeight: 48,
          lookAheadOffsetX: 40,
          lookAheadOffsetY: 0,
          lockOnPriority: 5
        },
        movement: activeTestCharacter.movement || {
          id: `mov_${activeTestCharacter.id}`,
          name: 'Kinematic Movement',
          movementType: 'ground_patrol',
          moveSpeed: activeTestCharacter.baseStats?.speed || 4.0,
          acceleration: 0.2,
          jumpForce: 12.0,
          gravityScale: 1.0,
          turnOnEdge: true,
          turnOnObstacle: true,
          sineFrequency: 1.0,
          sineAmplitude: 1.0,
          airControl: 0.8,
          trackNodeSpeed: 4
        },
        ai: activeTestCharacter.ai || {
          id: `ai_${activeTestCharacter.id}`,
          name: 'AI',
          aiProfile: 'aggressive_chaser' as const,
          visionRadiusPx: 200,
          visionAngleDeg: 120,
          losCheckWall: true,
          attackRangePx: 40,
          telegraphWindupMs: 300,
          attackCooldownMs: 1000,
          retreatHealthPercent: 20,
          comboChainCount: 2,
          enragePhaseTriggerPercent: 40,
          fsmStates: activeTestCharacter.states || ['idle', 'patrol', 'combat']
        }
      };
    }
    const behFileName = activeTestCharacter.assignedBehaviorFileName;
    if (behFileName) {
      const found = project?.fileSystem?.behaviors?.find(b => b.fileName === behFileName || b.id === behFileName);
      if (found) return found.behaviorData;
    }
    // Fallback: try to find behavior with matching id or name
    return project?.fileSystem?.behaviors?.find(b => b.behaviorData?.id === activeTestCharacter.id || b.behaviorData?.name === activeTestCharacter.name)?.behaviorData;
  }, [activeTestCharacter, project?.fileSystem?.behaviors]);

  const currentSpawnPoint = React.useMemo(() => {
    const spawns = currentMapFile?.playerSpawns;
    if (spawns && spawns.length > 0) {
      return spawns[0];
    }
    return { x: 4, y: 12, facing: 'right' as const };
  }, [currentMapFile?.playerSpawns]);

  const handleSetSpawnPoint = (x: number, y: number) => {
    if (!currentMapFile) return;
    pushUndoSnapshot();
    const newSpawns = [{ 
      spawnId: 'spawn_default', 
      x, 
      y, 
      facing: 'right' as const,
      isDefault: true 
    }];
    handleUpdateProject(prev => {
      if (!prev) return prev;
      const updatedMaps = prev.fileSystem.maps.map(m => {
        if (m.fileName === currentMapFile.fileName) {
          return {
            ...m,
            playerSpawns: newSpawns
          };
        }
        return m;
      });
      return {
        ...prev,
        fileSystem: {
          ...prev.fileSystem,
          maps: updatedMaps
        }
      };
    });
    showToast(`Set character spawn point to (${x}, ${y})`, 'success');
  };

  // Map tile editing handler
  const handleMapTileInteract = (x: number, y: number, points?: Array<{ x: number; y: number }>) => {
    if (!project || !currentMapFile || !activeBiome || mode !== 'paint') return;
    const pointsToApply = points && points.length > 0 ? points : [{ x, y }];

    handleUpdateProject(p => {
      const updatedMaps = p.fileSystem.maps?.map(m => {
        if (m.fileName === currentMapFile.fileName) {
          const hasLegacyCells = Array.isArray(m.cells);
          let newCells = m.cells;
          const clonedCellRows = new Set<number>();
          
          let existingChunks = m.chunks || (m as any).data?.chunks || {};
          let newChunks: Record<string, any[]> = { ...existingChunks };
          const clonedChunkKeys = new Set<string>();

          const ensureChunkCloned = (chunkKey: string): any[] => {
            if (!clonedChunkKeys.has(chunkKey)) {
              clonedChunkKeys.add(chunkKey);
              if (existingChunks[chunkKey]) {
                newChunks[chunkKey] = [...existingChunks[chunkKey]];
              } else {
                newChunks[chunkKey] = new Array(256).fill(null).map(() => ({
                  biome_id: activeBiome.id,
                  tile_type_id: '',
                  current_health: 100,
                  damage_threshold_index: 0,
                  shape: 'full',
                  fullness: 1.0,
                  environmental_detail_id: null,
                  interactive_detail_id: null,
                  wildlife_id: null
                }));
              }
            }
            return newChunks[chunkKey];
          };

          if (activeTool === 'chunk_add' || activeTool === 'chunk_delete') {
            for (const pt of pointsToApply) {
              const chunkX = Math.floor(pt.x / 16);
              const chunkY = Math.floor(pt.y / 16);
              const chunkKey = `${chunkX},${chunkY}`;

              if (activeTool === 'chunk_add') {
                const chunk = ensureChunkCloned(chunkKey);
                // Set/reassign all 256 cells in this chunk to the active biome ID
                for (let i = 0; i < chunk.length; i++) {
                  chunk[i] = {
                    ...(chunk[i] || {
                      tile_type_id: '',
                      current_health: 100,
                      damage_threshold_index: 0,
                      shape: 'full',
                      fullness: 1.0,
                      environmental_detail_id: null,
                      interactive_detail_id: null,
                      wildlife_id: null
                    }),
                    biome_id: activeBiome.id
                  };
                }
              } else if (activeTool === 'chunk_delete') {
                if (newChunks[chunkKey]) {
                  if (!clonedChunkKeys.has(chunkKey)) {
                    clonedChunkKeys.add(chunkKey);
                  }
                  delete newChunks[chunkKey];
                }
              }
            }

            globalChunkCache.invalidateMap(m.id);

            return {
              ...m,
              updatedAt: new Date().toISOString(),
              cells: newCells,
              chunks: newChunks,
              ...(m.data ? { data: { ...m.data, chunks: newChunks } } : {})
            };
          }

          for (const pt of pointsToApply) {
            const px = pt.x;
            const py = pt.y;
            const minX = px - Math.floor((brushSize - 1) / 2);
            const maxX = px + Math.ceil((brushSize - 1) / 2);
            const minY = py - Math.floor((brushSize - 1) / 2);
            const maxY = py + Math.ceil((brushSize - 1) / 2);

            for (let cy = minY; cy <= maxY; cy++) {
              for (let cx = minX; cx <= maxX; cx++) {
                if (brushSize > 2 && ((cx - px) * (cx - px) + (cy - py) * (cy - py) > (brushSize / 2) * (brushSize / 2) + 1)) {
                  continue;
                }

                if (hasLegacyCells && newCells && newCells[cy] && newCells[cy][cx]) {
                  if (!clonedCellRows.has(cy)) {
                    clonedCellRows.add(cy);
                    if (newCells === m.cells) {
                      newCells = m.cells.map((row, rIdx) => rIdx === cy ? [...row] : row);
                    } else {
                      newCells[cy] = [...newCells[cy]];
                    }
                  }
                  const target = newCells[cy][cx];
                  target.biome_id = activeBiome.id;
                  if (activeTool === 'eraser') {
                    target.tile_type_id = '';
                    target.environmental_detail_id = null;
                    target.interactive_detail_id = null;
                    target.wildlife_id = null;
                    target.shape = 'full';
                    target.fullness = 1.0;
                  } else {
                    if (paintCategory === 'tile_type') {
                      target.tile_type_id = selectedAssetId;
                      target.current_health = 100;
                      target.damage_threshold_index = 0;
                      target.shape = selectedShape;
                      target.fullness = 1.0;
                    } else if (paintCategory === 'environmental') {
                      target.environmental_detail_id = selectedAssetId || null;
                    } else if (paintCategory === 'interactive') {
                      target.interactive_detail_id = selectedAssetId || null;
                    } else if (paintCategory === 'wildlife') {
                      target.wildlife_id = selectedAssetId || null;
                    }
                  }
                  globalChunkCache.invalidateCell(cx, cy, m.id);
                }

                // Chunked map painting
                const chunkX = Math.floor(cx / 16);
                const chunkY = Math.floor(cy / 16);
                const lx = ((cx % 16) + 16) % 16;
                const ly = ((cy % 16) + 16) % 16;
                const chunkKey = `${chunkX},${chunkY}`;

                const chunk = ensureChunkCloned(chunkKey);
                const localIdx = ly * 16 + lx;

                let currentCell: RefinedCellState = chunk[localIdx] ? { ...chunk[localIdx] } : {
                  biome_id: activeBiome.id,
                  tile_type_id: '',
                  current_health: 100,
                  damage_threshold_index: 0
                };
                currentCell.biome_id = activeBiome.id;
                if (activeTool === 'eraser') {
                  currentCell.tile_type_id = '';
                  currentCell.environmental_detail_id = null;
                  currentCell.interactive_detail_id = null;
                  currentCell.wildlife_id = null;
                  currentCell.shape = 'full';
                  currentCell.fullness = 1.0;
                } else {
                  if (paintCategory === 'tile_type') {
                    currentCell.tile_type_id = selectedAssetId;
                    currentCell.current_health = 100;
                    currentCell.damage_threshold_index = 0;
                    currentCell.shape = selectedShape;
                    currentCell.fullness = 1.0;
                  } else if (paintCategory === 'environmental') {
                    currentCell.environmental_detail_id = selectedAssetId || null;
                  } else if (paintCategory === 'interactive') {
                    currentCell.interactive_detail_id = selectedAssetId || null;
                  } else if (paintCategory === 'wildlife') {
                    currentCell.wildlife_id = selectedAssetId || null;
                  }
                }
                chunk[localIdx] = currentCell;
                globalChunkCache.invalidateCell(cx, cy, m.id);
              }
            }
          }

          return {
            ...m,
            updatedAt: new Date().toISOString(),
            cells: newCells,
            chunks: newChunks,
            data: {
              id: m.id,
              name: m.name,
              width: m.width,
              height: m.height,
              chunks: newChunks,
              ...(m.cells ? { cells: newCells } : {})
            }
          };
        }
        return m;
      });
      return {
        ...p,
        fileSystem: {
          ...p.fileSystem,
          maps: updatedMaps
        }
      };
    });
  };

  const handleReassignAllChunksToActiveBiome = () => {
    if (!project || !currentMapFile || !activeBiome) return;
    pushUndoSnapshot();
    handleUpdateProject(p => {
      const updatedMaps = p.fileSystem.maps?.map(m => {
        if (m.fileName === currentMapFile.fileName) {
          const newChunks = { ...m.chunks };
          Object.keys(newChunks).forEach(key => {
            if (Array.isArray(newChunks[key])) {
              newChunks[key] = newChunks[key].map(cell => ({
                ...(cell || {
                  tile_type_id: '',
                  current_health: 100,
                  damage_threshold_index: 0,
                  shape: 'full',
                  fullness: 1.0,
                }),
                biome_id: activeBiome.id
              }));
            }
          });
          globalChunkCache.invalidateMap(m.id);
          return {
            ...m,
            chunks: newChunks,
            data: {
              ...(m.data || {}),
              chunks: newChunks
            }
          };
        }
        return m;
      });
      return {
        ...p,
        fileSystem: {
          ...p.fileSystem,
          maps: updatedMaps
        }
      };
    });
    showToast(`Reassigned all map chunks to biome: ${activeBiome.name}`, 'success');
  };

  // Map Macro procedural synthesis handler
  const handleApplyMacroToLevel = (matrix: BiomeAllocationMatrix, layoutStyle: MetroidvaniaLayoutStyle) => {
    if (!project || !currentMapFile) return;
    pushUndoSnapshot();
    const generated = buildMapFromBiomeMatrix(matrix, biomesList, layoutStyle);

    handleUpdateProject(p => ({
      ...p,
      fileSystem: {
        ...p.fileSystem,
        maps: p.fileSystem.maps?.map(m => {
          if (m.fileName === currentMapFile.fileName) {
            return {
              ...m,
              width: generated.width,
              height: generated.height,
              cells: generated.cells,
              updatedAt: new Date().toISOString()
            };
          }
          return m;
        })
      }
    }));

    globalChunkCache.clear();
    showToast(`Synthesized level layout for ${currentMapFile.fileName}`, 'success');
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen text-neutral-100 font-sans overflow-hidden select-none transition-colors duration-200"
      style={{ backgroundColor: bgDef.hex }}
    >
      
      {/* Top Navbar: Full-featured Header */}
      <header 
        className="h-14 border-b px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur transition-colors duration-200"
        style={{
          backgroundColor: `rgba(${primaryDef.rgb}, 0.08)`,
          borderColor: `rgba(${primaryDef.rgb}, 0.22)`
        }}
      >
        <div className="flex items-center gap-3">
          
          {/* Hamburger Menu Navigation */}
          <HamburgerMenu
            project={project}
            onOpenModulesModal={() => setIsModulesModalOpen(true)}
            onOpenExplorerModal={() => setIsExplorerModalOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onShowProjectInfo={() => setActiveModuleId(null)}
            onNewProject={() => setIsCreateModalOpen(true)}
            onLoadProject={() => setIsLoadModalOpen(true)}
            onSaveProject={() => {
              if (project) {
                saveActiveMasonProject(project);
                refreshSavedProjects();
                showToast(`Saved ${project.name}`, 'success');
              }
            }}
            onExportBundle={handleExportBundle}
            onCloseProject={handleCloseProject}
            onSelectModule={(modId) => handleLaunchModule(modId)}
            onOpenPWAInstallModal={() => setIsPWAInstallModalOpen(true)}
            activeModuleId={activeModuleId}
          />

          <div className="h-4 w-px bg-neutral-800"></div>

          {/* Project Title / Studio Brand & Version */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModuleId(null)}
              className="flex items-center gap-2 group hover:opacity-90 transition text-left"
              title="Mason Studio - View Dashboard"
            >
              {/* Sky Blue Mason Citadel Brand Icon */}
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-900/90 via-sky-950 to-neutral-950 border border-sky-500/50 flex items-center justify-center shadow-md shadow-sky-950/60 shrink-0 group-hover:border-sky-400 group-hover:scale-105 transition-all p-1">
                <MasonBrandIcon size={18} className="drop-shadow" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-neutral-100 group-hover:text-white transition">Mason</span>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/40 px-1.5 py-0.2 rounded shadow-xs">
                  {MASON_VERSION_DISPLAY}
                </span>
              </div>
            </button>

            {project ? (
              <button
                type="button"
                onClick={() => setActiveModuleId(null)}
                className="text-xs font-mono flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
                title="Click to view Project Dashboard"
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: primaryDef.hex }}
                />
                <span className="truncate max-w-[180px] sm:max-w-[240px] font-semibold text-neutral-200">{project.name}</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                No Project Loaded
              </span>
            )}

            {isOffline && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.5 rounded" title="Offline Mode Active">
                <WifiOff size={11} /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Right Navigation & Action Tools */}
        <div className="flex items-center gap-2">
          {project && (
            <>
              {/* Module & Dashboard Direct Icon Bar */}
              <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
                {/* Dashboard Icon */}
                <button
                  type="button"
                  onClick={() => setActiveModuleId(null)}
                  title="Project Dashboard"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 relative border ${
                    activeModuleId === null
                      ? 'border shadow-md'
                      : 'border-transparent hover:bg-neutral-800 hover:border-neutral-700'
                  }`}
                  style={
                    activeModuleId === null
                      ? {
                          backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                          borderColor: `rgba(${primaryDef.rgb}, 0.5)`,
                          color: primaryDef.hex,
                          boxShadow: `0 4px 12px rgba(${primaryDef.rgb}, 0.3)`
                        }
                      : {
                          color: primaryDef.hex,
                          backgroundColor: `rgba(${primaryDef.rgb}, 0.08)`
                        }
                  }
                >
                  <LayoutDashboard size={16} />
                  {activeModuleId === null && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-neutral-900 animate-pulse" 
                      style={{ backgroundColor: primaryDef.hex }}
                    />
                  )}
                </button>

                <div className="h-4 w-px bg-neutral-800 mx-0.5" />

                {/* Modules Direct Line Art Icons */}
                {MASON_MODULES.map(mod => {
                  const isActive = activeModuleId === mod.id;
                  const modColor = getModuleColorDef(mod.id);

                  const renderModIcon = () => {
                    switch (mod.iconName) {
                      case 'Map': return <Map size={16} />;
                      case 'TreePine': return <TreePine size={16} />;
                      case 'Users': return <Users size={16} />;
                      case 'Sliders': return <Sliders size={16} />;
                      case 'Network': return <Network size={16} />;
                      default: return <Map size={16} />;
                    }
                  };

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleLaunchModule(mod.id)}
                      title={`${mod.name} (${mod.associatedExtension})`}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 group relative border ${
                        isActive
                          ? 'shadow-md ring-1'
                          : 'border-transparent hover:bg-neutral-800 hover:border-neutral-700'
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: `rgba(${modColor.rgb}, 0.25)`,
                              borderColor: `rgba(${modColor.rgb}, 0.6)`,
                              color: modColor.hex,
                              boxShadow: `0 4px 12px rgba(${modColor.rgb}, 0.35)`
                            }
                          : {
                              color: modColor.hex,
                              backgroundColor: `rgba(${modColor.rgb}, 0.08)`
                            }
                      }
                    >
                      <span className="group-hover:scale-110 transition-transform">
                        {renderModIcon()}
                      </span>
                      {isActive && (
                        <span 
                          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-neutral-900 animate-pulse" 
                          style={{ backgroundColor: modColor.hex }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-neutral-800" />

              {/* Undo & Redo Header Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border transition shadow-sm relative ${
                    undoStack.length > 0
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white cursor-pointer active:scale-95'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                  title={`Undo (Ctrl+Z)${undoStack.length > 0 ? ` [${undoStack.length} step${undoStack.length > 1 ? 's' : ''}]` : ''}`}
                  aria-label="Undo"
                >
                  <Undo2 size={15} className={undoStack.length > 0 ? 'text-cyan-400' : 'text-neutral-600'} />
                  {undoStack.length > 0 && (
                    <span className="absolute -top-1 -left-1 px-1 min-w-[14px] h-3.5 bg-cyan-950 text-[9px] font-mono font-bold text-cyan-300 rounded-full flex items-center justify-center border border-cyan-700 shadow-sm">
                      {undoStack.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border transition shadow-sm relative ${
                    redoStack.length > 0
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white cursor-pointer active:scale-95'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                  title={`Redo (Ctrl+Y / Cmd+Shift+Z)${redoStack.length > 0 ? ` [${redoStack.length} step${redoStack.length > 1 ? 's' : ''}]` : ''}`}
                  aria-label="Redo"
                >
                  <Redo2 size={15} className={redoStack.length > 0 ? 'text-amber-400' : 'text-neutral-600'} />
                  {redoStack.length > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-amber-950 text-[9px] font-mono font-bold text-amber-300 rounded-full flex items-center justify-center border border-amber-700 shadow-sm">
                      {redoStack.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="h-4 w-px bg-neutral-800" />

              {/* Virtual Files Explorer Button (Icon Only) */}
              <button
                type="button"
                onClick={() => setIsExplorerModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl transition shadow-sm"
                title="Virtual Files Explorer"
                aria-label="Files"
              >
                <FolderOpen size={16} className="text-amber-400" />
              </button>

              {/* Cloud Sync & Backups Button */}
              <button
                type="button"
                onClick={() => setIsCloudSyncModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-blue-400 hover:text-blue-300 rounded-xl transition shadow-sm relative group"
                title="Google Drive & OneDrive Cloud Storage & Backups"
                aria-label="Cloud Sync"
              >
                <Cloud size={16} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-neutral-950 animate-pulse" />
              </button>

              {/* Save Project Button (Icon Only) */}
              <button
                type="button"
                onClick={() => {
                  saveActiveMasonProject(project);
                  refreshSavedProjects();
                  showToast(`Saved ${project.name}`, 'success');
                }}
                className="w-8 h-8 flex items-center justify-center text-white rounded-xl transition shadow-md active:scale-95"
                style={{
                  backgroundColor: primaryDef.hex,
                  boxShadow: `0 4px 12px rgba(${primaryDef.rgb}, 0.35)`
                }}
                title="Save Project"
                aria-label="Save"
              >
                <Save size={16} />
              </button>
            </>
          )}

          {!project && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md active:scale-95"
                style={{
                  backgroundColor: primaryDef.hex,
                  boxShadow: `0 4px 12px rgba(${primaryDef.rgb}, 0.35)`
                }}
              >
                <Plus size={14} />
                <span>Create Project</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLoadModalOpen(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition"
              >
                <span>Load Project</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Layout */}
      <div 
        className="flex-1 flex overflow-hidden relative transition-colors duration-200"
        style={{ backgroundColor: bgDef.hex }}
      >
        
        {/* CASE A: No Project Loaded -> Mason Welcome & Launcher View */}
        {!project && (
          <MasonWelcomeLauncher
            savedProjects={savedProjects}
            onCreateNewProject={() => setIsCreateModalOpen(true)}
            onLoadProjectFromFile={() => setIsLoadModalOpen(true)}
            onSelectSavedProject={handleSelectSavedProject}
            onDeleteSavedProject={handleDeleteSavedProject}
            onOpenPWAInstallModal={() => setIsPWAInstallModalOpen(true)}
          />
        )}

        {/* CASE B: Project Loaded & No Module Active -> Default Project Info / Dashboard View */}
        {project && activeModuleId === null && (
          <ProjectDashboard
            project={project}
            onUpdateProject={handleUpdateProject}
            onLaunchModule={(modId) => setActiveModuleId(modId)}
            onOpenExplorer={() => setIsExplorerModalOpen(true)}
            onOpenModulesModal={() => setIsModulesModalOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onExportBundle={handleExportBundle}
          />
        )}

        {/* CASE C: Project Loaded & A Module is Active -> Module Runner Container */}
        {project && activeModuleId !== null && (
          <>
            {/* If maps module: Can render dedicated interactive full-scale canvas or iframe runner */}
            {activeModuleId === 'maps' && currentMapFile && currentMapData && activeBiome ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <FileSubfolderHeader
                  subfolderName="maps"
                  extension=".map"
                  files={project.fileSystem.maps?.map(m => ({
                    id: m.id,
                    name: m.name,
                    fileName: m.fileName,
                    updatedAt: m.updatedAt
                  }))}
                  activeFileName={currentMapFile.fileName}
                  onSelectFile={(fName) => {
                    handleUpdateProject(p => ({
                      ...p,
                      activeFiles: { ...p.activeFiles, mapFileName: fName }
                    }));
                  }}
                  onNewFile={(name) => {
                    const { project: updated, newFile } = createNewMapInProject(project, name);
                    globalChunkCache.invalidateMap(newFile.id);
                    handleUpdateProject(updated);
                    showToast(`Created new level ${name}`, 'success');
                  }}
                  onDuplicateFile={(fName) => {
                    const target = project.fileSystem.maps.find(m => m.fileName === fName);
                    if (!target) return;
                    const dupeName = `${target.name} (Copy)`;
                    const dupeFileName = `${target.fileName.replace('.map', '')}_copy.map`;
                    const dupe: MapFile = {
                      ...target,
                      id: `map_${Date.now()}`,
                      name: dupeName,
                      fileName: dupeFileName,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    handleUpdateProject(p => ({
                      ...p,
                      activeFiles: { ...p.activeFiles, mapFileName: dupeFileName },
                      fileSystem: { ...p.fileSystem, maps: [...p.fileSystem.maps, dupe] }
                    }));
                    showToast(`Duplicated to ${dupeFileName}`, 'success');
                  }}
                  onSaveFile={() => {
                    saveActiveMasonProject(project);
                    showToast(`Saved ${currentMapFile.fileName}`, 'success');
                  }}
                  onExportFile={(fName) => {
                    const target = project.fileSystem.maps.find(m => m.fileName === fName);
                    if (target) exportMapFile(target);
                  }}
                  onDeleteFile={(fName) => {
                    handleUpdateProject(p => {
                      let filtered = p.fileSystem.maps.filter(m => m.fileName !== fName);
                      if (filtered.length === 0) {
                        const newMap = createDefaultMapFile(
                          `map_${Date.now()}`,
                          'New Map',
                          'new_map.map',
                          32,
                          24,
                          p.fileSystem.biomes?.[0]?.id || 'mourne_ashen_steppes'
                        );
                        filtered = [newMap];
                      }
                      return {
                        ...p,
                        activeFiles: { ...p.activeFiles, mapFileName: filtered[0].fileName },
                        fileSystem: { ...p.fileSystem, maps: filtered }
                      };
                    });
                    showToast(`Deleted map: ${fName}`, 'info');
                  }}
                  onRenameFile={(oldFileName, newName) => {
                    handleUpdateProject(p => {
                      const safeName = `${newName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.map`;
                      return {
                        ...p,
                        activeFiles: {
                          ...p.activeFiles,
                          mapFileName: p.activeFiles.mapFileName === oldFileName ? safeName : p.activeFiles.mapFileName
                        },
                        fileSystem: {
                          ...p.fileSystem,
                          maps: p.fileSystem.maps.map(m => {
                            if (m.fileName === oldFileName) {
                              return {
                                ...m,
                                name: newName,
                                fileName: safeName,
                                updatedAt: new Date().toISOString()
                              };
                            }
                            return m;
                          })
                        }
                      };
                    });
                  }}
                  centerContent={
                    <div className="flex items-center gap-2 max-w-full truncate">
                      <Map size={14} className="text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        value={currentMapFile.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          handleUpdateProject(p => ({
                            ...p,
                            fileSystem: {
                              ...p.fileSystem,
                              maps: p.fileSystem.maps.map(m => {
                                if (m.fileName === currentMapFile.fileName) {
                                  return {
                                    ...m,
                                    name: newName,
                                    updatedAt: new Date().toISOString()
                                  };
                                }
                                return m;
                              })
                            }
                          }));
                        }}
                        className="bg-transparent text-xs sm:text-sm font-bold text-white border-b border-dashed border-neutral-700 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none transition py-0.5 max-w-[140px] sm:max-w-[220px] text-center truncate"
                        title="Click to edit map name"
                      />
                    </div>
                  }
                  accentColor="cyan"
                />

                {/* Submode Switcher & Play Mode Controls */}
                <div className="h-11 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setMapsSubMode('tilemap')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                          mapsSubMode === 'tilemap'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                        }`}
                      >
                        <span>🗺️ Tilemap Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapsSubMode('macro');
                          if (mode === 'play') setMode('paint');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                          mapsSubMode === 'macro'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                        }`}
                      >
                        <span>⚡ Map Macro (1px:1tile)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {mapsSubMode === 'tilemap' && (
                      <>
                        {/* Test Character Selector */}
                        <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                          <span className="text-neutral-400 text-xs font-semibold">Test Hero:</span>
                          <select
                            value={selectedTestCharacterId}
                            onChange={(e) => handleSelectTestCharacter(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 text-xs font-bold text-cyan-300 rounded px-2 py-0.5 outline-none cursor-pointer hover:border-cyan-500 transition"
                            title="Select which character to spawn and test control in this map"
                          >
                            {availableCharacters.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.avatarIcon} {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Place Spawn Point Tool Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (mode === 'play') setMode('paint');
                            setActiveTool(activeTool === 'spawn_place' ? 'brush' : 'spawn_place');
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                            activeTool === 'spawn_place' && mode !== 'play'
                              ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-sm' 
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white hover:bg-neutral-750'
                          }`}
                          title="Click anywhere on the map to place character spawn point"
                        >
                          <MapPin size={13} className={activeTool === 'spawn_place' ? 'text-cyan-400' : 'text-neutral-400'} />
                          <span>Place Spawn</span>
                        </button>

                        {/* Play Mode / Run Map Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (mode === 'play') {
                              setMode('paint');
                            } else {
                              setMode('play');
                              showToast(`Running map with ${activeTestCharacter.name}! Use WASD to move.`, 'info');
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition shadow-md border ${
                            mode === 'play'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-950/50 animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
                          }`}
                          title={mode === 'play' ? 'Exit Play Mode (Esc)' : 'Test Play Level with character physics & combat'}
                        >
                          {mode === 'play' ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                          <span>{mode === 'play' ? 'Stop Playing' : 'Play Level'}</span>
                        </button>

                        <div className="h-4 w-px bg-neutral-800 mx-0.5" />

                        {/* Lit Mode Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsLitMode(!isLitMode)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition border ${
                            isLitMode 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                          }`}
                          title="Toggle Lit / Unlit Mode"
                        >
                          {isLitMode ? <Sun size={13} /> : <Moon size={13} />}
                          <span>{isLitMode ? 'Lit' : 'Unlit'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {mapsSubMode === 'macro' ? (
                  <div className="flex-1 flex overflow-hidden bg-neutral-950">
                    <BiomeMacroMapModal
                      isOpen={true}
                      embedded={true}
                      onClose={() => setMapsSubMode('tilemap')}
                      biomes={biomesList}
                      currentWidth={currentMapData.width}
                      currentHeight={currentMapData.height}
                      onApplyToLevel={(matrix, layoutStyle) => {
                        handleApplyMacroToLevel(matrix, layoutStyle);
                        setMapsSubMode('tilemap');
                      }}
                    />
                  </div>
                ) : (
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Tool Rail */}
                  <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur flex flex-col items-center py-4 shrink-0 z-10 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'play') setMode('paint');
                        setActiveTool('brush');
                      }}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'brush' && mode !== 'play' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Paint Brush"
                    >
                      <Paintbrush size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'play') setMode('paint');
                        setActiveTool('eraser');
                      }}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'eraser' && mode !== 'play' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Eraser / Void"
                    >
                      <Eraser size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'play') setMode('paint');
                        setActiveTool('spawn_place');
                      }}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'spawn_place' && mode !== 'play' ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Place Character Spawn Point"
                    >
                      <MapPin size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'play') setMode('paint');
                        setActiveTool('chunk_add');
                      }}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'chunk_add' && mode !== 'play' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Add Chunk (Paints entire chunk)"
                    >
                      <PlusSquare size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'play') setMode('paint');
                        setActiveTool('chunk_delete');
                      }}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'chunk_delete' && mode !== 'play' ? 'bg-red-600 text-white border-red-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Delete Chunk (Removes chunk completely)"
                    >
                      <MinusSquare size={16} />
                    </button>

                    <div className="w-8 h-px bg-neutral-800 my-1" />

                    {/* Quick Undo / Redo in Tool Rail */}
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className={`p-2.5 rounded-xl border transition relative ${
                        undoStack.length > 0
                          ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 active:scale-95'
                          : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
                      }`}
                      title={`Undo Map Change (Ctrl+Z)${undoStack.length > 0 ? ` [${undoStack.length}]` : ''}`}
                    >
                      <Undo2 size={16} className={undoStack.length > 0 ? 'text-cyan-400' : 'text-neutral-600'} />
                    </button>

                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className={`p-2.5 rounded-xl border transition relative ${
                        redoStack.length > 0
                          ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 active:scale-95'
                          : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
                      }`}
                      title={`Redo Map Change (Ctrl+Y / Cmd+Shift+Z)${redoStack.length > 0 ? ` [${redoStack.length}]` : ''}`}
                    >
                      <Redo2 size={16} className={redoStack.length > 0 ? 'text-amber-400' : 'text-neutral-600'} />
                    </button>

                    <div className="w-8 h-px bg-neutral-800 my-1" />

                    {/* Brush Size Picker Dropdown */}
                    <div className="flex flex-col items-center gap-2">
                      <select
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-10 h-8 bg-neutral-900 border border-neutral-700 text-cyan-300 text-xs font-mono font-bold rounded-lg text-center outline-none appearance-none cursor-pointer hover:bg-neutral-800 transition px-1"
                        title="Select Brush Size"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sz => (
                          <option key={sz} value={sz}>{sz}x</option>
                        ))}
                      </select>

                      {/* Recent Brush Sizes */}
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {recentBrushSizes.map(sz => (
                          <button
                            key={`recent-${sz}`}
                            type="button"
                            onClick={() => setBrushSize(sz)}
                            className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition ${
                              brushSize === sz ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-neutral-500 hover:text-white bg-neutral-900/50'
                            }`}
                            title={`Recent Brush: ${sz}x`}
                          >
                            {sz}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* Center Canvas */}
                  <main className="flex-1 bg-neutral-950 relative overflow-hidden flex flex-col">
                    <RefinedMapCanvas 
                      mapData={currentMapData}
                      biomes={biomesList}
                      activeBiome={activeBiome}
                      onTileInteract={handleMapTileInteract}
                      isDrawing={isDrawing}
                      setIsDrawing={setIsDrawing}
                      showGrid={showGrid}
                      setShowGrid={setShowGrid}
                      showDamageMasks={showDamageMasks}
                      isLitMode={isLitMode}
                      brushSize={brushSize}
                      activeTool={activeTool}
                      mode={mode}
                      setMode={setMode}
                      testCharacter={activeTestCharacter}
                      linkedBehavior={linkedBehavior}
                      spawnPoint={currentSpawnPoint}
                      onSetSpawnPoint={handleSetSpawnPoint}
                      onExitPlayMode={() => setMode('paint')}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      canUndo={undoStack.length > 0}
                      canRedo={redoStack.length > 0}
                      undoCount={undoStack.length}
                      redoCount={redoStack.length}
                    />

                    {/* Canvas Status Badge */}
                    <div 
                      data-no-paint="true"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseMove={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-4 left-4 pointer-events-auto z-20 flex flex-col gap-2"
                    >
                      <div className="bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-300 shadow-xl flex items-center gap-3 select-text">
                        <span className="font-mono text-cyan-400">
                          {currentMapFile.fileName} 
                          {currentMapData.chunks 
                            ? ` (${Object.keys(currentMapData.chunks).length} Chunks)` 
                            : ` (${currentMapData.width}×${currentMapData.height} @ 16px/cell)`}
                        </span>
                        <span className="text-neutral-500">|</span>
                        <span className="font-mono text-emerald-400">128px Metroidvania Scale</span>
                        <span className="text-neutral-600">•</span>
                        <span>Biome: <strong className="text-white">{activeBiome.name}</strong></span>
                      </div>
                    </div>
                  </main>

                  {/* Right Palette */}
                  <aside className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col shrink-0 z-10">
                    {/* Active Biome Switcher */}
                    <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Active Biome
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {activeBiome?.tileTypes?.length || 0} Tiles
                        </span>
                      </div>
                      
                      {project?.fileSystem?.biomes && project.fileSystem.biomes.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <select
                              value={currentBiomeFile?.fileName || project.fileSystem.biomes[0]?.fileName}
                              onChange={(e) => {
                                const targetFileName = e.target.value;
                                const targetFile = project.fileSystem.biomes.find(b => b.fileName === targetFileName);
                                if (targetFile) {
                                  handleUpdateProject(p => ({
                                    ...p,
                                    activeFiles: {
                                      ...p.activeFiles,
                                      biomeFileName: targetFileName
                                    }
                                  }));
                                  const firstTile = targetFile.biomeData?.tileTypes?.[0];
                                  if (firstTile && paintCategory === 'tile_type') {
                                    setSelectedAssetId(firstTile.id);
                                  } else {
                                    setSelectedAssetId('');
                                  }
                                }
                              }}
                              className="w-full appearance-none bg-neutral-900 border border-neutral-700 hover:border-cyan-500/60 text-neutral-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 transition cursor-pointer pr-9"
                            >
                              {project.fileSystem.biomes.map((biomeFile) => (
                                <option key={biomeFile.fileName} value={biomeFile.fileName} className="bg-neutral-900 text-neutral-200">
                                  {biomeFile.biomeData.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                              <div 
                                className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0"
                                style={{ backgroundColor: activeBiome?.regionColor || '#06b6d4' }}
                              />
                              <ChevronDown size={14} className="text-neutral-400" />
                            </div>
                          </div>

                          {/* Quick Chunk Biome Paint Actions */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTool('chunk_add');
                                showToast(`Chunk Tool Active: Click or drag any chunk to set its biome to ${activeBiome?.name}`, 'info');
                              }}
                              className={`flex-1 text-[11px] font-semibold py-1 px-2 rounded-lg border transition flex items-center justify-center gap-1.5 ${
                                activeTool === 'chunk_add'
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                  : 'bg-neutral-900/80 text-neutral-300 border-neutral-700/80 hover:bg-neutral-800 hover:text-white'
                              }`}
                              title="Stamp or Paint individual Chunks with this Biome"
                            >
                              <PlusSquare size={12} />
                              <span>Stamp Chunk</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleReassignAllChunksToActiveBiome}
                              className="text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-neutral-900/80 text-cyan-400 border border-neutral-700/80 hover:bg-cyan-950/60 hover:text-cyan-300 transition flex items-center justify-center gap-1.5"
                              title="Convert all existing map chunks to this active biome"
                            >
                              <RefreshCw size={12} />
                              <span>Fill Map</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 italic">No Biomes Found</div>
                      )}
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                      {/* Category Picker */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                        {[
                          { id: 'tile_type', label: 'Terrain', icon: Layers },
                          { id: 'environmental', label: 'Flora', icon: TreePine },
                          { id: 'interactive', label: 'Props', icon: Box },
                          { id: 'wildlife', label: 'Entities', icon: Users },
                        ].map(cat => {
                          const Icon = cat.icon;
                          const active = paintCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setPaintCategory(cat.id as PaintCategory);
                                setSelectedAssetId('');
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                                active ? 'bg-cyan-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <Icon size={13} />
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Terrain Tiles & Open Air */}
                      {paintCategory === 'tile_type' && (
                        <div className="space-y-3">
                          {/* Tile Shape Selector (Solid & 45° Slopes) */}
                          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                                Tile Shape
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400 font-semibold truncate max-w-[140px]">
                                {TILE_SHAPE_DEFINITIONS[selectedShape]?.name || 'Solid Block'}
                              </span>
                            </div>

                            {/* Shape Grid Buttons */}
                            <div className="grid grid-cols-5 gap-1.5">
                              {(Object.keys(TILE_SHAPE_DEFINITIONS) as TileShape[]).map(shapeKey => {
                                const def = TILE_SHAPE_DEFINITIONS[shapeKey];
                                const isShapeActive = selectedShape === shapeKey;
                                return (
                                  <button
                                    key={shapeKey}
                                    type="button"
                                    onClick={() => setSelectedShape(shapeKey)}
                                    className={`py-1.5 px-1 rounded-lg text-center border transition flex flex-col items-center gap-0.5 ${
                                      isShapeActive
                                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-sm'
                                        : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                    }`}
                                    title={def.name}
                                  >
                                    <span className="text-xs font-mono font-bold">
                                      {def.shortLabel.split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] font-mono truncate w-full px-0.5 leading-tight">
                                      {def.shortLabel.split(' ').slice(1).join(' ') || def.name.split(' ')[0]}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedAssetId('')}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                              selectedAssetId === '' 
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded border border-dashed border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs">
                                ∅
                              </div>
                              <div>
                                <div className="text-xs font-bold">Blank Air Space (Open Void)</div>
                                <div className="text-[10px] text-neutral-500">Traversable player airspace</div>
                              </div>
                            </div>
                          </button>

                          {activeBiome?.tileTypes?.map(t => {
                            const isSelected = selectedAssetId === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelectedAssetId(t.id)}
                                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                                  isSelected 
                                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div 
                                    className="w-6 h-6 rounded border border-neutral-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
                                      backgroundSize: '8px 8px',
                                      backgroundColor: t.mapColor || t.baseMaterialA?.albedoColor || 'transparent'
                                    }}
                                  >
                                    {t.baseMaterialA?.albedoTextureUrl ? (
                                      <img src={t.baseMaterialA.albedoTextureUrl} alt={t.name} className="w-full h-full object-cover" />
                                    ) : null}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                      <span>{t.name}</span>
                                      {t.generatesCollider === false && (
                                        <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-400 border border-amber-800/80 font-mono">
                                          No Physics
                                        </span>
                                      )}
                                      {(!t.baseMaterialA?.albedoTextureUrl && !t.baseMaterialA?.albedoColor) && (
                                        <span className="text-[9px] px-1 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-mono">
                                          Invisible
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-mono">
                                      {t.category} • {t.isDestructible ? `${t.health} HP` : 'Indestructible'}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Environmental / Flora */}
                      {paintCategory === 'environmental' && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAssetId('')}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                              selectedAssetId === '' 
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded border border-dashed border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs">
                                ∅
                              </div>
                              <div className="text-xs font-bold">Clear Flora / Detail</div>
                            </div>
                          </button>

                          {activeBiome?.environmentalDetails && activeBiome.environmentalDetails.length > 0 ? (
                            activeBiome.environmentalDetails.map(env => {
                              const isSelected = selectedAssetId === env.id;
                              return (
                                <button
                                  key={env.id}
                                  type="button"
                                  onClick={() => setSelectedAssetId(env.id)}
                                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                                    isSelected 
                                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div 
                                      className="w-6 h-6 rounded border border-neutral-700 flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: env.color || '#10b981' }}
                                    >
                                      {env.icon || '🌲'}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold">{env.name}</div>
                                      <div className="text-[10px] text-neutral-500 font-mono">
                                        {env.category} • {env.widthTiles}×{env.heightTiles} tiles
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-xs text-neutral-500 italic p-3 text-center bg-neutral-950 rounded-xl border border-neutral-800">
                              No flora details defined in {activeBiome?.name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive Props */}
                      {paintCategory === 'interactive' && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAssetId('')}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                              selectedAssetId === '' 
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded border border-dashed border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs">
                                ∅
                              </div>
                              <div className="text-xs font-bold">Clear Interactive Prop</div>
                            </div>
                          </button>

                          {activeBiome?.interactiveDetails && activeBiome.interactiveDetails.length > 0 ? (
                            activeBiome.interactiveDetails.map(item => {
                              const isSelected = selectedAssetId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSelectedAssetId(item.id)}
                                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                                    isSelected 
                                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div 
                                      className="w-6 h-6 rounded border border-neutral-700 flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: item.color || '#f59e0b' }}
                                    >
                                      {item.icon || '📦'}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold">{item.name}</div>
                                      <div className="text-[10px] text-neutral-500 font-mono">
                                        {item.type} • {item.interactionPrompt || 'Interact'}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-xs text-neutral-500 italic p-3 text-center bg-neutral-950 rounded-xl border border-neutral-800">
                              No interactive props defined in {activeBiome?.name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Wildlife / Entities */}
                      {paintCategory === 'wildlife' && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAssetId('')}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                              selectedAssetId === '' 
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded border border-dashed border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs">
                                ∅
                              </div>
                              <div className="text-xs font-bold">Clear Wildlife / Entity</div>
                            </div>
                          </button>

                          {activeBiome?.wildlife && activeBiome.wildlife.length > 0 ? (
                            activeBiome.wildlife.map(fauna => {
                              const isSelected = selectedAssetId === fauna.id;
                              return (
                                <button
                                  key={fauna.id}
                                  type="button"
                                  onClick={() => setSelectedAssetId(fauna.id)}
                                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                                    isSelected 
                                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md' 
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div 
                                      className="w-6 h-6 rounded border border-neutral-700 flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: fauna.color || '#a855f7' }}
                                    >
                                      {fauna.icon || '👾'}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold">{fauna.name}</div>
                                      <div className="text-[10px] text-neutral-500 font-mono">
                                        Spawn Frequency: {Math.round(fauna.spawnFrequency * 100)}%
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-xs text-neutral-500 italic p-3 text-center bg-neutral-950 rounded-xl border border-neutral-800">
                              No wildlife defined in {activeBiome?.name}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
                )}
              </div>
            ) : (
              // For all other modules, render via ModuleRunnerContainer
              <ModuleRunnerContainer
                moduleId={activeModuleId}
                project={project}
                onUpdateProject={handleUpdateProject}
                onBackToProjectInfo={() => setActiveModuleId(null)}
                onOpenModulesModal={() => setIsModulesModalOpen(true)}
                onOpenExplorer={() => setIsExplorerModalOpen(true)}
                onNavigateToModule={handleNavigateToModule}
              />
            )}
          </>
        )}

      </div>

      {/* Modules Directory Modal */}
      <ModulesModal
        isOpen={isModulesModalOpen}
        onClose={() => setIsModulesModalOpen(false)}
        onSelectModule={(modId) => handleLaunchModule(modId)}
        activeModuleId={activeModuleId}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />

      {/* Load Project Modal */}
      <LoadProjectModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        savedProjects={savedProjects}
        onSelectProject={handleSelectSavedProject}
        onDeleteProject={handleDeleteSavedProject}
        onImportBundle={handleImportBundle}
      />

      {/* Project Explorer Modal */}
      {project && (
        <ProjectExplorerModal 
          isOpen={isExplorerModalOpen}
          onClose={() => setIsExplorerModalOpen(false)}
          project={project}
          onUpdateProject={handleUpdateProject}
          onNavigateToModule={(mod, file) => {
            setActiveModuleId(mod);
            if (file) {
              if (mod === 'maps') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, mapFileName: file } }));
              else if (mod === 'biomes') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, biomeFileName: file } }));
              else if (mod === 'characters') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, characterFileName: file } }));
              else if (mod === 'behaviors') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, behaviorFileName: file } }));
              else if (mod === 'ui') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, uiFileName: file } }));
              else if (mod === 'gamestructure') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, gameStructureFileName: file } }));
            }
          }}
        />
      )}

      {/* 1px:1tile Macro Modal */}
      {project && currentMapFile && currentMapData && (
        <BiomeMacroMapModal
          isOpen={isBiomeMacroModalOpen}
          onClose={() => setIsBiomeMacroModalOpen(false)}
          biomes={biomesList}
          currentWidth={currentMapData.width}
          currentHeight={currentMapData.height}
          onApplyToLevel={(matrix, layout) => {
            handleUpdateProject(p => {
              const updatedMaps = p.fileSystem.maps?.map(m => {
                if (m.fileName === currentMapFile.fileName) {
                  const newCells: RefinedCellState[][] = [];
                  for (let y = 0; y < matrix.height; y++) {
                    const row: RefinedCellState[] = [];
                    for (let x = 0; x < matrix.width; x++) {
                      const bId = matrix.biomeIds[y]?.[x];
                      const biomeObj = biomesList.find(b => b.id === bId) || biomesList[0];
                      const primaryTile = biomeObj?.primaryTileTypeId || biomeObj?.tileTypes?.[0]?.id || 'ashen_basalt';
                      
                      let isSolid = true;
                      if (layout === 'sidescroller_platforms') {
                        isSolid = y >= matrix.height - 4 || (y === Math.floor(matrix.height * 0.6) && (x < 10 || x > 20)) || (y === Math.floor(matrix.height * 0.35) && x >= 10 && x <= 22);
                      } else if (layout === 'blank_air') {
                        isSolid = false;
                      }

                      row.push({
                        biome_id: bId,
                        tile_type_id: isSolid ? primaryTile : '',
                        current_health: 100,
                        damage_threshold_index: 0,
                        environmental_detail_id: null,
                        interactive_detail_id: null,
                        wildlife_id: null
                      });
                    }
                    newCells.push(row);
                  }
                  return { ...m, cells: newCells, updatedAt: new Date().toISOString() };
                }
                return m;
              });
              return { ...p, fileSystem: { ...p.fileSystem, maps: updatedMaps } };
            });
            showToast(`Applied 1px:1tile layout to ${currentMapFile.fileName}`, 'success');
          }}
        />
      )}

      {/* Cloud Storage & Backups Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        currentProject={project ? {
          id: project.id,
          name: project.name,
          description: project.description,
          engine_version: project.engineVersion || '2.0.0',
          tile_size_px: 64,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          map: (project.fileSystem.maps?.[0]?.data || {
            width: project.fileSystem.maps?.[0]?.width || 24,
            height: project.fileSystem.maps?.[0]?.height || 24,
            chunks: project.fileSystem.maps?.[0]?.chunks || {},
            cells: project.fileSystem.maps?.[0]?.cells || []
          }) as any,
          biomes: project.fileSystem.biomes?.map(b => b.biomeData) || [],
          activeBiomeId: project.fileSystem.biomes?.[0]?.id || 'mourne_ashen_steppes'
        } : {
          id: 'temp_proj',
          name: 'New Mason Level',
          engine_version: '2.0.0',
          tile_size_px: 64,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          map: { width: 24, height: 24, cells: [] },
          biomes: [],
          activeBiomeId: 'mourne_ashen_steppes'
        }}
        onLoadProject={(loadedProjectData) => {
          const masonProj = convertProjectDataToMasonProject(loadedProjectData);
          setProject(masonProj);
          refreshSavedProjects();
          showToast(`Loaded "${masonProj.name}" from Cloud!`, 'success');
        }}
      />

      {/* PWA Direct Installation & Guidance Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
        hasNativePrompt={hasNativePrompt}
        isInIframe={isInIframe}
        isInstalled={isInstalled}
        platform={platform}
        onTriggerNativeInstall={triggerNativeInstall}
      />

      {/* App Theme Settings & Palette Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Toast Notification Alerts */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div 
            className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'shadow-lg'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/60 text-red-200'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
            }`}
            style={
              toast.type === 'success'
                ? {
                    backgroundColor: `rgba(${primaryDef.rgb}, 0.25)`,
                    borderColor: `rgba(${primaryDef.rgb}, 0.6)`,
                    color: '#ffffff',
                    boxShadow: `0 10px 25px -5px rgba(${primaryDef.rgb}, 0.4)`
                  }
                : undefined
            }
          >
            {toast.type === 'success' && (
              <CheckCircle2 size={15} style={{ color: primaryDef.hex }} className="shrink-0" />
            )}
            {toast.type === 'error' && <AlertTriangle size={15} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && (
              <HardDrive size={15} style={{ color: primaryDef.hex }} className="shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};
