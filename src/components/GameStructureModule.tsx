import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  GameStructureFile, 
  MasonProject, 
  WorldGraphLink, 
  ProgressionFlag,
  MapExit,
  createDefaultGameStructure
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Compass, 
  Sliders, 
  Play, 
  Map as MapIcon, 
  Layers, 
  Key, 
  Tv, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles, 
  Maximize2,
  Lock,
  Unlock,
  Volume2,
  ShieldAlert,
  Zap,
  Users,
  Layout,
  RefreshCw,
  Eye,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  ExternalLink,
  Edit3,
  X,
  Radio,
  DoorOpen,
  Box
} from 'lucide-react';

function getQuadBezierArrowHeads(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  tValues: number[]
) {
  return tValues.map((t) => {
    const omt = 1 - t;
    const x = omt * omt * p0.x + 2 * omt * t * p1.x + t * t * p2.x;
    const y = omt * omt * p0.y + 2 * omt * t * p1.y + t * t * p2.y;
    const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { x, y, angleDeg };
  });
}

import { getSavedModuleTab, saveModuleTab } from '../utils/moduleTabStore';

interface GameStructureModuleProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onNavigateToModule: (moduleId: string, fileToSelect?: string) => void;
  onBackToDashboard?: () => void;
}

export const GameStructureModule: React.FC<GameStructureModuleProps> = ({
  project,
  onUpdateProject,
  onNavigateToModule,
  onBackToDashboard
}) => {
  const gameFiles = project.fileSystem?.game || [];
  const activeFileName = project.activeFiles?.gameStructureFileName || gameFiles[0]?.fileName;
  const defaultGameStructureFile: GameStructureFile = {
    id: 'game_main_campaign',
    name: 'Main Campaign Framework',
    fileName: 'main_campaign.gamestructure',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    structureData: createDefaultGameStructure()
  };
  const currentStructureFile: GameStructureFile = gameFiles.find(g => g.fileName === activeFileName) || gameFiles[0] || defaultGameStructureFile;

  const [activeTab, setActiveTabState] = useState<'world_graph' | 'entry_bindings' | 'main_menu' | 'loading_screen' | 'pause_menu' | 'progression_flags'>(
    () => getSavedModuleTab('gamestructure', 'world_graph') as any
  );
  const setActiveTab = (tab: 'world_graph' | 'entry_bindings' | 'main_menu' | 'loading_screen' | 'pause_menu' | 'progression_flags') => {
    setActiveTabState(tab);
    saveModuleTab('gamestructure', tab);
  };
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [selectedMapFileName, setSelectedMapFileName] = useState<string | null>(null);
  const [previewingMainMenu, setPreviewingMainMenu] = useState(false);
  const [previewingLoadingScreen, setPreviewingLoadingScreen] = useState(false);
  const [testFlagState, setTestFlagState] = useState<Record<string, boolean>>({});

  // Toast notification state for Game Structure Module
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Graph Pan, Zoom & Dragging States
  const [graphZoom, setGraphZoom] = useState<number>(1.0);
  const [graphPanX, setGraphPanX] = useState<number>(40);
  const [graphPanY, setGraphPanY] = useState<number>(40);
  const [isGraphPanning, setIsGraphPanning] = useState(false);
  const graphPanStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);
  const graphCanvasRef = useRef<HTMLDivElement | null>(null);

  const [draggingMapFileName, setDraggingMapFileName] = useState<string | null>(null);
  const dragNodeStartRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null);

  // Link connection tool state
  const [connectingSourceMap, setConnectingSourceMap] = useState<string | null>(null);
  const [graphViewMode, setGraphViewMode] = useState<'visual_graph' | 'table_matrix'>('visual_graph');

  // Helper updater for current game structure data
  const updateStructure = (updater: (prev: typeof currentStructureFile.structureData) => typeof currentStructureFile.structureData) => {
    onUpdateProject(p => {
      const updatedFiles = p.fileSystem.game.map(gf => {
        if (gf.fileName === currentStructureFile.fileName) {
          return {
            ...gf,
            updatedAt: new Date().toISOString(),
            structureData: updater(gf.structureData)
          };
        }
        return gf;
      });
      return {
        ...p,
        fileSystem: {
          ...p.fileSystem,
          game: updatedFiles
        }
      };
    });
  };

  const data = currentStructureFile.structureData;

  // Compute unified directional world links from map exits, interactive props/zones, and visual links
  const computedWorldLinks = useMemo(() => {
    interface ComputedWorldLink {
      id: string;
      sourceMapFileName: string;
      targetMapFileName: string;
      sourceType: 'map_exit' | 'interactive_prop' | 'graph_link';
      detailName: string;
      isMapDefined: boolean;
    }

    const links: ComputedWorldLink[] = [];
    const seen = new Set<string>();

    // 1. Gather all links defined in map files (exits and interactive props/zones)
    (project.fileSystem?.maps || []).forEach(mapFile => {
      // Exits on map
      (mapFile.exits || []).forEach(exit => {
        if (exit.targetMapFileName) {
          const key = `${mapFile.fileName}->${exit.targetMapFileName}->${exit.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            links.push({
              id: exit.id || `exit_${mapFile.fileName}_${exit.targetMapFileName}`,
              sourceMapFileName: mapFile.fileName,
              targetMapFileName: exit.targetMapFileName,
              sourceType: 'map_exit',
              detailName: exit.name || 'Doorway / Gate Exit',
              isMapDefined: true
            });
          }
        }
      });

      // Biomes interactive details
      (project.fileSystem?.biomes || []).forEach(biomeFile => {
        (biomeFile.biomeData?.interactiveDetails || []).forEach(item => {
          if (item.transportBehavior === 'immediate_transport' && item.immediateDestinationId) {
            const key = `${mapFile.fileName}->${item.immediateDestinationId}->${item.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              links.push({
                id: `${item.id}_${mapFile.fileName}`,
                sourceMapFileName: mapFile.fileName,
                targetMapFileName: item.immediateDestinationId,
                sourceType: 'interactive_prop',
                detailName: item.name || 'Transition Zone',
                isMapDefined: true
              });
            }
          } else if (item.transportBehavior === 'popup_menu' && item.allowedDestinations) {
            item.allowedDestinations.forEach(dest => {
              const key = `${mapFile.fileName}->${dest}->${item.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                links.push({
                  id: `${item.id}_${dest}`,
                  sourceMapFileName: mapFile.fileName,
                  targetMapFileName: dest,
                  sourceType: 'interactive_prop',
                  detailName: item.name || 'Fast Travel Portal',
                  isMapDefined: true
                });
              }
            });
          }
        });
      });
    });

    // 2. Include custom visual topology links from data.worldGraphLinks
    (data.worldGraphLinks || []).forEach(link => {
      const key = `${link.sourceMapFileName}->${link.targetMapFileName}->${link.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        links.push({
          id: link.id,
          sourceMapFileName: link.sourceMapFileName,
          targetMapFileName: link.targetMapFileName,
          sourceType: 'graph_link',
          detailName: link.notes || 'Visual Map Link',
          isMapDefined: false
        });
      }
    });

    return links;
  }, [project.fileSystem.maps, project.fileSystem.biomes, data.worldGraphLinks]);

  // Resolve Map Node positions
  const mapsList = project.fileSystem.maps || [];
  const getNodePos = (mapFileName: string, index: number) => {
    const saved = data.graphNodes?.find(n => n.mapFileName === mapFileName);
    if (saved) return { x: saved.x, y: saved.y };
    // Default smart grid arrangement
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: 100 + col * 380,
      y: 100 + row * 260
    };
  };

  const updateNodePosition = (mapFileName: string, newX: number, newY: number) => {
    updateStructure(s => {
      const currentNodes = s.graphNodes || [];
      const existing = currentNodes.find(n => n.mapFileName === mapFileName);
      let updatedNodes;
      if (existing) {
        updatedNodes = currentNodes.map(n => n.mapFileName === mapFileName ? { ...n, x: newX, y: newY } : n);
      } else {
        updatedNodes = [...currentNodes, { mapFileName, x: newX, y: newY }];
      }
      return { ...s, graphNodes: updatedNodes };
    });
  };

  // Add a direct visual directional link between maps (no modal needed)
  const handleAddGraphLink = (srcMap?: string, tgtMap?: string) => {
    const defaultSourceMap = srcMap || mapsList[0]?.fileName || 'ashen_outpost.map';
    const defaultTargetMap = tgtMap || mapsList[1]?.fileName || mapsList[0]?.fileName || 'crystal_chasm.map';
    
    // Avoid self-connection
    if (defaultSourceMap === defaultTargetMap) return;

    const newLink: WorldGraphLink = {
      id: `link_${Date.now()}`,
      sourceMapFileName: defaultSourceMap,
      sourceExitId: 'door_exit',
      targetMapFileName: defaultTargetMap,
      targetExitId: 'spawn_arrival',
      isBiDirectional: false,
      transitionType: 'door',
      notes: `${defaultSourceMap} ➔ ${defaultTargetMap}`
    };

    updateStructure(s => ({
      ...s,
      worldGraphLinks: [...s.worldGraphLinks, newLink]
    }));
    setSelectedLinkId(newLink.id);
  };

  // Remove a link
  const handleRemoveLink = (linkId: string) => {
    updateStructure(s => ({
      ...s,
      worldGraphLinks: s.worldGraphLinks.filter(l => l.id !== linkId)
    }));
    // Also remove from map exits if applicable
    onUpdateProject(p => ({
      ...p,
      fileSystem: {
        ...p.fileSystem,
        maps: p.fileSystem.maps.map(m => ({
          ...m,
          exits: (m.exits || []).filter(e => e.id !== linkId)
        }))
      }
    }));
    if (selectedLinkId === linkId) {
      setSelectedLinkId(null);
    }
  };

  // Add a new progression flag
  const handleAddProgressionFlag = () => {
    const flagId = `flag_${Date.now()}`;
    const newFlag: ProgressionFlag = {
      id: flagId,
      name: 'New Progression Ability',
      description: 'Key item or traversal unlock for metroidvania progression',
      category: 'traversal',
      defaultUnlocked: false
    };

    updateStructure(s => ({
      ...s,
      progressionFlags: [...s.progressionFlags, newFlag]
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      {/* Subfolder File Navigator Header */}
      <FileSubfolderHeader
        subfolderName="game"
        extension=".gamestructure"
        onBackToDashboard={onBackToDashboard}
        centerContent={
          <div className="flex items-center gap-1.5 max-w-full truncate">
            <span className="text-sm">🏰</span>
            <input
              type="text"
              value={data.gameTitle || data.name}
              onChange={(e) => updateStructure(s => ({ ...s, gameTitle: e.target.value, name: e.target.value }))}
              className="bg-transparent text-xs font-bold text-white border-b border-dashed border-neutral-700 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none transition py-0.5 max-w-[160px] sm:max-w-[220px] text-center"
              title="Click to edit game structure title"
            />
          </div>
        }
        files={project.fileSystem.game.map(g => ({
          id: g.id,
          name: g.name,
          fileName: g.fileName,
          updatedAt: g.updatedAt
        }))}
        activeFileName={currentStructureFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, gameStructureFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gamestructure`;
          const newG: GameStructureFile = {
            id: `game_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            structureData: {
              ...data,
              id: `game_${Date.now()}`,
              name,
              gameTitle: name.toUpperCase()
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, gameStructureFileName: safeName },
            fileSystem: {
              ...p.fileSystem,
              game: [...p.fileSystem.game, newG]
            }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = project.fileSystem.game.find(g => g.fileName === fName);
          if (!target) return;
          const dupeName = `${target.name} (Copy)`;
          const dupeFileName = `${target.fileName.replace('.gamestructure', '')}_copy.gamestructure`;
          const dupe: GameStructureFile = {
            ...target,
            id: `game_${Date.now()}`,
            name: dupeName,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, gameStructureFileName: dupeFileName },
            fileSystem: {
              ...p.fileSystem,
              game: [...p.fileSystem.game, dupe]
            }
          }));
        }}
        onSaveFile={() => {
          updateStructure(s => ({ ...s }));
          showToast(`Saved framework "${data.gameTitle || currentStructureFile.name}" (${currentStructureFile.fileName})`, 'success');
        }}
        onExportFile={(fName) => {
          const target = project.fileSystem.game.find(g => g.fileName === fName);
          if (target) {
            const jsonStr = JSON.stringify(target, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = target.fileName;
            a.click();
          }
        }}
        onDeleteFile={(fName) => {
          onUpdateProject(p => {
            const filtered = p.fileSystem.game.filter(g => g.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, gameStructureFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, game: filtered }
            };
          });
        }}
        accentColor="purple"
      />

      {/* Main Module Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Module Sub-navigation Sidebar */}
        <aside className="w-64 border-r border-neutral-800 bg-neutral-900/70 backdrop-blur p-3.5 flex flex-col gap-1 shrink-0">
          <div className="px-2 py-1 mb-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Game Framework Sections
            </span>
            <p className="text-xs text-neutral-300 font-semibold mt-0.5 truncate">
              {data.gameTitle}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('world_graph')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'world_graph' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Compass size={16} className={activeTab === 'world_graph' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">1. World Map Graph</span>
              <span className="text-[10px] font-normal text-neutral-500">{data.worldGraphLinks.length} room connections</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('entry_bindings')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'entry_bindings' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <MapIcon size={16} className={activeTab === 'entry_bindings' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">2. Entry & Attachments</span>
              <span className="text-[10px] font-normal text-neutral-500">Starting Map, UI & Hero</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('main_menu')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'main_menu' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Tv size={16} className={activeTab === 'main_menu' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">3. Main Menu Scene</span>
              <span className="text-[10px] font-normal text-neutral-500">Title screen & Parallax</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('loading_screen')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'loading_screen' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Clock size={16} className={activeTab === 'loading_screen' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">4. Loading Screens & Lore</span>
              <span className="text-[10px] font-normal text-neutral-500">Wipes & Lore Tips</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('pause_menu')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'pause_menu' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Sliders size={16} className={activeTab === 'pause_menu' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">5. Pause & In-Game Menu</span>
              <span className="text-[10px] font-normal text-neutral-500">Inventory & System Tabs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('progression_flags')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'progression_flags' 
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Key size={16} className={activeTab === 'progression_flags' ? 'text-purple-400' : 'text-neutral-500'} />
            <div className="min-w-0">
              <span className="block truncate">6. Metroidvania Flags</span>
              <span className="text-[10px] font-normal text-neutral-500">{data.progressionFlags.length} gates registered</span>
            </div>
          </button>

          <div className="mt-auto pt-3 border-t border-neutral-800 space-y-2">
            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-300 font-semibold mb-1">
                <Info size={13} className="text-purple-400" />
                <span>Framework Integrity</span>
              </div>
              <p>Structure file governs game loop orchestration and room transitions across all modules.</p>
            </div>
          </div>
        </aside>

        {/* Section Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: WORLD MAP GRAPH & EXITS LINKER */}
          {activeTab === 'world_graph' && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Compass size={18} className="text-purple-400" />
                    World Map Graph & Room Transition Linker
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Drag and connect level cards to architect world topology, doorway transitions, teleporters, and progression locks.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setGraphViewMode('visual_graph')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        graphViewMode === 'visual_graph'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Layout size={13} />
                      <span>Visual Graph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGraphViewMode('table_matrix')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        graphViewMode === 'table_matrix'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <FileText size={13} />
                      <span>Links List</span>
                    </button>
                  </div>

                  {/* Canvas Zoom Controls (for visual graph mode) */}
                  {graphViewMode === 'visual_graph' && (
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setGraphZoom(z => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="Zoom Out"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGraphZoom(1.0); setGraphPanX(40); setGraphPanY(40); }}
                        className="px-1.5 py-0.5 text-neutral-300 hover:text-white text-[11px] font-mono font-bold rounded hover:bg-neutral-800"
                        title="Reset Zoom & Pan"
                      >
                        {Math.round(graphZoom * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setGraphZoom(z => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="Zoom In"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setGraphZoom(1.0); setGraphPanX(40); setGraphPanY(40); }}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="Reset Center"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  )}

                  {/* Quick Add Link Button */}
                  <button
                    type="button"
                    onClick={() => handleAddGraphLink()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>

              {/* Connecting prompt banner */}
              {connectingSourceMap && (
                <div className="p-2.5 bg-purple-950/80 border border-purple-500 rounded-xl flex items-center justify-between gap-3 text-xs animate-pulse">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Radio size={14} className="text-purple-400 animate-spin" />
                    <span>
                      Connecting from <strong className="text-white font-mono">{connectingSourceMap}</strong>. Click any target level card to create a directional connection link.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConnectingSourceMap(null)}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-bold"
                  >
                    Cancel Connection
                  </button>
                </div>
              )}

              {/* VISUAL GRAPH CANVAS VIEW */}
              {graphViewMode === 'visual_graph' ? (
                <div className="flex-1 w-full min-h-[560px] bg-neutral-950 rounded-2xl border border-neutral-800/90 relative overflow-hidden flex flex-col">
                  <div
                    ref={graphCanvasRef}
                    onContextMenu={(e) => e.preventDefault()}
                    onWheel={(e) => {
                      e.preventDefault();
                      const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
                      setGraphZoom(z => Math.max(0.4, Math.min(2.2, Number((z + zoomDelta).toFixed(2)))));
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 2 || e.button === 1 || e.target === graphCanvasRef.current) {
                        setIsGraphPanning(true);
                        graphPanStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: graphPanX, panY: graphPanY };
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isGraphPanning && graphPanStartRef.current) {
                        const dx = e.clientX - graphPanStartRef.current.mouseX;
                        const dy = e.clientY - graphPanStartRef.current.mouseY;
                        setGraphPanX(graphPanStartRef.current.panX + dx);
                        setGraphPanY(graphPanStartRef.current.panY + dy);
                        return;
                      }

                      if (!draggingMapFileName || !dragNodeStartRef.current) return;
                      const dx = (e.clientX - dragNodeStartRef.current.mouseX) / graphZoom;
                      const dy = (e.clientY - dragNodeStartRef.current.mouseY) / graphZoom;
                      const newX = Math.round(dragNodeStartRef.current.nodeX + dx);
                      const newY = Math.round(dragNodeStartRef.current.nodeY + dy);
                      updateNodePosition(draggingMapFileName, Math.max(20, Math.min(3000, newX)), Math.max(20, Math.min(3000, newY)));
                    }}
                    onMouseUp={() => {
                      setIsGraphPanning(false);
                      graphPanStartRef.current = null;
                      if (draggingMapFileName) setDraggingMapFileName(null);
                    }}
                    className={`flex-1 w-full h-full relative overflow-hidden select-none ${isGraphPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                    style={{
                      backgroundImage: 'radial-gradient(circle, #3b284c 1.2px, transparent 1.2px)',
                      backgroundSize: `${26 * graphZoom}px ${26 * graphZoom}px`,
                      backgroundPosition: `${graphPanX}px ${graphPanY}px`
                    }}
                  >
                    {/* SVG Directional Connection Wires Layer */}
                    <svg 
                      className="w-full h-full absolute inset-0 pointer-events-none z-0" 
                      style={{ 
                        transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                        transformOrigin: '0 0' 
                      }}
                    >
                      {computedWorldLinks.map((link, linkIdx) => {
                        const srcIdx = mapsList.findIndex(m => m.fileName === link.sourceMapFileName);
                        const tgtIdx = mapsList.findIndex(m => m.fileName === link.targetMapFileName);
                        if (srcIdx < 0 || tgtIdx < 0) return null;

                        const srcPos = getNodePos(link.sourceMapFileName, srcIdx);
                        const tgtPos = getNodePos(link.targetMapFileName, tgtIdx);

                        const CARD_WIDTH = 260;
                        const CARD_HEIGHT = 140;
                        const p0 = { x: srcPos.x + CARD_WIDTH / 2, y: srcPos.y + CARD_HEIGHT / 2 };
                        const p2 = { x: tgtPos.x + CARD_WIDTH / 2, y: tgtPos.y + CARD_HEIGHT / 2 };

                        const isSelected = selectedLinkId === link.id;

                        // Calculate multi-link offset curve
                        const dx = p2.x - p0.x;
                        const dy = p2.y - p0.y;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const normX = -dy / len;
                        const normY = dx / len;

                        const siblingLinks = computedWorldLinks.filter(l => 
                          (l.sourceMapFileName === link.sourceMapFileName && l.targetMapFileName === link.targetMapFileName) ||
                          (l.sourceMapFileName === link.targetMapFileName && l.targetMapFileName === link.sourceMapFileName)
                        );
                        const siblingIdx = siblingLinks.findIndex(l => l.id === link.id);
                        const spreadOffset = (siblingIdx - (siblingLinks.length - 1) / 2) * 36;
                        const curveFactor = siblingLinks.length > 1 ? spreadOffset : 24;

                        const ctrlX = ((p0.x + p2.x) / 2) + normX * curveFactor;
                        const ctrlY = ((p0.y + p2.y) / 2) + normY * curveFactor;
                        const p1 = { x: ctrlX, y: ctrlY };

                        const pathD = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
                        const arrowHeads = getQuadBezierArrowHeads(p0, p1, p2, [0.35, 0.65]);

                        return (
                          <g 
                            key={link.id + '_' + linkIdx} 
                            className="pointer-events-auto cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLinkId(link.id);
                              setSelectedMapFileName(null);
                            }}
                          >
                            {/* Hitbox path */}
                            <path
                              d={pathD}
                              stroke="transparent"
                              strokeWidth={22}
                              fill="none"
                            />
                            {/* Visual directional wire */}
                            <path
                              d={pathD}
                              stroke={isSelected ? '#c084fc' : link.sourceType === 'interactive_prop' ? '#10b981' : link.sourceType === 'map_exit' ? '#06b6d4' : '#a855f7'}
                              strokeWidth={isSelected ? 3.5 : 2.5}
                              fill="none"
                              strokeDasharray={link.sourceType === 'interactive_prop' ? '6 3' : undefined}
                              className="transition-all hover:stroke-purple-300"
                            />
                            {/* Directional arrow heads */}
                            {arrowHeads.map((arrow, aIdx) => (
                              <g
                                key={aIdx}
                                transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angleDeg})`}
                                className="pointer-events-none"
                              >
                                <path
                                  d="M -7 -5 L 6 0 L -7 5 L -3.5 0 Z"
                                  fill={isSelected ? '#e9d5ff' : link.sourceType === 'interactive_prop' ? '#34d399' : link.sourceType === 'map_exit' ? '#22d3ee' : '#c084fc'}
                                  stroke={isSelected ? '#581c87' : '#0f172a'}
                                  strokeWidth={0.8}
                                />
                              </g>
                            ))}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Transition Midpoint Interactive Badges */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-10" 
                      style={{ 
                        transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                        transformOrigin: '0 0' 
                      }}
                    >
                      {computedWorldLinks.map((link, linkIdx) => {
                        const srcIdx = mapsList.findIndex(m => m.fileName === link.sourceMapFileName);
                        const tgtIdx = mapsList.findIndex(m => m.fileName === link.targetMapFileName);
                        if (srcIdx < 0 || tgtIdx < 0) return null;

                        const srcPos = getNodePos(link.sourceMapFileName, srcIdx);
                        const tgtPos = getNodePos(link.targetMapFileName, tgtIdx);

                        const CARD_WIDTH = 260;
                        const CARD_HEIGHT = 140;
                        const p0 = { x: srcPos.x + CARD_WIDTH / 2, y: srcPos.y + CARD_HEIGHT / 2 };
                        const p2 = { x: tgtPos.x + CARD_WIDTH / 2, y: tgtPos.y + CARD_HEIGHT / 2 };

                        const dx = p2.x - p0.x;
                        const dy = p2.y - p0.y;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const normX = -dy / len;
                        const normY = dx / len;

                        const siblingLinks = computedWorldLinks.filter(l => 
                          (l.sourceMapFileName === link.sourceMapFileName && l.targetMapFileName === link.targetMapFileName) ||
                          (l.sourceMapFileName === link.targetMapFileName && l.targetMapFileName === link.sourceMapFileName)
                        );
                        const siblingIdx = siblingLinks.findIndex(l => l.id === link.id);
                        const spreadOffset = (siblingIdx - (siblingLinks.length - 1) / 2) * 36;
                        const curveFactor = siblingLinks.length > 1 ? spreadOffset : 24;

                        const midX = ((p0.x + p2.x) / 2) + normX * (curveFactor * 0.6);
                        const midY = ((p0.y + p2.y) / 2) + normY * (curveFactor * 0.6);

                        const isSelected = selectedLinkId === link.id;

                        const typeIcon = 
                          link.sourceType === 'interactive_prop' ? '🟩' :
                          link.sourceType === 'map_exit' ? '🚪' : '🔗';

                        return (
                          <div
                            key={link.id + '_' + linkIdx}
                            style={{ left: `${midX}px`, top: `${midY}px`, transform: 'translate(-50%, -50%)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLinkId(link.id);
                              setSelectedMapFileName(null);
                            }}
                            className={`pointer-events-auto cursor-pointer p-1.5 px-2.5 rounded-full border shadow-lg transition flex items-center gap-1.5 text-[11px] font-bold ${
                              isSelected
                                ? 'bg-purple-900 border-purple-400 text-white ring-2 ring-purple-500/50 scale-105'
                                : link.sourceType === 'interactive_prop'
                                ? 'bg-neutral-900/95 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                                : link.sourceType === 'map_exit'
                                ? 'bg-neutral-900/95 border-cyan-500/50 text-cyan-200 hover:border-cyan-400'
                                : 'bg-neutral-900/95 border-purple-500/50 text-purple-200 hover:border-purple-400'
                            }`}
                            title="Click to view connection details"
                          >
                            <span>{typeIcon}</span>
                            <span className="font-mono text-[10px]">
                              {link.sourceMapFileName.replace('.map', '')} ➔ {link.targetMapFileName.replace('.map', '')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Level Cards (Draggable Nodes) Layer */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-20" 
                      style={{ 
                        transform: `translate(${graphPanX}px, ${graphPanY}px) scale(${graphZoom})`, 
                        transformOrigin: '0 0' 
                      }}
                    >
                      {mapsList.map((mapFile, idx) => {
                        const pos = getNodePos(mapFile.fileName, idx);
                        const isEntry = data.entryMapFileName === mapFile.fileName;
                        const isSelected = selectedMapFileName === mapFile.fileName;
                        const outgoingLinks = computedWorldLinks.filter(l => l.sourceMapFileName === mapFile.fileName);
                        const incomingLinks = computedWorldLinks.filter(l => l.targetMapFileName === mapFile.fileName);
                        const isConnectingThis = connectingSourceMap === mapFile.fileName;

                        return (
                          <div
                            key={mapFile.fileName}
                            style={{
                              left: `${pos.x}px`,
                              top: `${pos.y}px`,
                              width: '260px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (connectingSourceMap) {
                                if (connectingSourceMap !== mapFile.fileName) {
                                  handleAddGraphLink(connectingSourceMap, mapFile.fileName);
                                }
                                setConnectingSourceMap(null);
                                return;
                              }
                              setSelectedMapFileName(mapFile.fileName);
                              setSelectedLinkId(null);
                            }}
                            className={`pointer-events-auto absolute rounded-2xl border transition shadow-xl bg-neutral-900/95 backdrop-blur-md overflow-hidden ${
                              isConnectingThis
                                ? 'border-purple-400 ring-2 ring-purple-500 shadow-purple-500/30'
                                : isSelected
                                ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-cyan-500/20'
                                : isEntry
                                ? 'border-purple-500/70 shadow-purple-950/40'
                                : 'border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            {/* Card Header (Draggable Handle) */}
                            <div 
                              onMouseDown={(e) => {
                                if (e.button === 0) {
                                  setDraggingMapFileName(mapFile.fileName);
                                  dragNodeStartRef.current = {
                                    mouseX: e.clientX,
                                    mouseY: e.clientY,
                                    nodeX: pos.x,
                                    nodeY: pos.y
                                  };
                                }
                              }}
                              className={`p-2.5 px-3 border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${
                                isEntry 
                                  ? 'bg-purple-950/70 border-purple-500/40' 
                                  : 'bg-neutral-950/80 border-neutral-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm">🗺️</span>
                                <span className="font-mono text-xs font-bold text-white truncate" title={mapFile.fileName}>
                                  {mapFile.fileName}
                                </span>
                              </div>
                              {isEntry && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0 font-mono">
                                  START
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="p-3 space-y-2.5">
                              <div>
                                <div className="text-xs font-bold text-neutral-200 truncate">{mapFile.name}</div>
                                <div className="text-[10px] text-neutral-500 font-mono">
                                  {mapFile.width}×{mapFile.height} Tiles • {Object.keys(mapFile.chunks || {}).length || 1} Chunks
                                </div>
                              </div>

                              {/* Outgoing Destinations Preview */}
                              <div className="space-y-1 bg-neutral-950/80 p-2 rounded-xl border border-neutral-800/80 text-[10px] font-mono">
                                <div className="flex items-center justify-between text-neutral-400">
                                  <span className="text-cyan-400">🔗 Out: {outgoingLinks.length}</span>
                                  <span className="text-neutral-500">In: {incomingLinks.length}</span>
                                </div>
                                {outgoingLinks.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {outgoingLinks.slice(0, 3).map((l, i) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[9px] truncate max-w-[105px]">
                                        ➔ {l.targetMapFileName.replace('.map', '')}
                                      </span>
                                    ))}
                                    {outgoingLinks.length > 3 && (
                                      <span className="px-1 py-0.5 text-neutral-500 text-[9px]">
                                        +{outgoingLinks.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-neutral-600 text-[9px] italic">No outgoing exits configured</div>
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-neutral-800/70 text-[11px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConnectingSourceMap(mapFile.fileName);
                                  }}
                                  className="px-2 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 rounded-lg font-bold transition flex items-center gap-1 text-[10px]"
                                  title="Connect to another map"
                                >
                                  <Plus size={11} />
                                  <span>Link To...</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  {!isEntry && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateStructure(s => ({ ...s, entryMapFileName: mapFile.fileName }));
                                      }}
                                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-semibold transition text-[10px]"
                                      title="Set as initial starting level"
                                    >
                                      Set Start
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateToModule('maps', mapFile.fileName);
                                    }}
                                    className="px-2 py-1 bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 text-neutral-300 rounded-lg font-semibold transition text-[10px] flex items-center gap-1"
                                    title="Open level in Map Editor"
                                  >
                                    <span>Edit Map</span>
                                    <ExternalLink size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Link Floating Inspector Bar */}
                    {(() => {
                      const selectedLink = computedWorldLinks.find(l => l.id === selectedLinkId);
                      if (!selectedLink) return null;

                      return (
                        <div className="absolute bottom-4 left-4 right-4 z-30 bg-neutral-900/95 border border-purple-500/60 backdrop-blur-md rounded-2xl p-3 px-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-base">
                              {selectedLink.sourceType === 'interactive_prop' ? '🟩' : selectedLink.sourceType === 'map_exit' ? '🚪' : '🔗'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                                <span className="text-purple-300">{selectedLink.sourceMapFileName}</span>
                                <ArrowRight size={13} className="text-cyan-400" />
                                <span className="text-cyan-300">{selectedLink.targetMapFileName}</span>
                              </div>
                              <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                                <span>{selectedLink.detailName}</span>
                                <span className="text-neutral-600">•</span>
                                <span className="text-neutral-500 text-[10px]">
                                  {selectedLink.isMapDefined ? 'Configured on Level Map' : 'World Graph Route'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigateToModule('maps', selectedLink.sourceMapFileName)}
                              className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                            >
                              <span>Open Origin Map in Editor</span>
                              <ExternalLink size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(selectedLink.id)}
                              className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              title="Delete Link"
                            >
                              <Trash2 size={12} />
                              <span>Delete Link</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedLinkId(null)}
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* TABLE / MATRIX VIEW */
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        Active World Map Connections ({computedWorldLinks.length})
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Links determined directly by level maps, doorway exits, interactive zones, and graph routes
                      </p>
                    </div>

                    <div className="space-y-2">
                      {computedWorldLinks.length === 0 ? (
                        <div className="p-8 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                          No map connections configured yet. Use the Visual Graph or place doorway/zone destination links on your maps.
                        </div>
                      ) : (
                        computedWorldLinks.map((link, idx) => (
                          <div 
                            key={link.id + '_' + idx}
                            className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 px-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-400">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                                  <span className="text-purple-300">{link.sourceMapFileName}</span>
                                  <ArrowRight size={12} className="text-cyan-400" />
                                  <span className="text-cyan-300">{link.targetMapFileName}</span>
                                </div>
                                <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                                  <span>{link.detailName}</span>
                                  <span className="text-neutral-600">•</span>
                                  <span className="text-neutral-500 text-[10px]">
                                    {link.isMapDefined ? 'Configured on Level Map' : 'World Graph Route'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onNavigateToModule('maps', link.sourceMapFileName)}
                                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 text-neutral-300 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                              >
                                <span>Edit Origin Map</span>
                                <ExternalLink size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(link.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                                title="Delete Link"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENTRY POINT & MODULE ATTACHMENTS */}
          {activeTab === 'entry_bindings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <MapIcon size={18} className="text-purple-400" />
                  Initial Game Entry & Active Module Attachments
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Designate the starting level, initial prefab, and HUD theme attached to this game session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Initial Starting Map File */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <MapIcon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">Starting World Level</h4>
                      <p className="text-xs text-neutral-400">First level loaded upon New Game</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Select .map File</label>
                    <select
                      value={data.entryMapFileName}
                      onChange={(e) => updateStructure(s => ({ ...s, entryMapFileName: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {project.fileSystem.maps.map(m => (
                        <option key={m.fileName} value={m.fileName}>{m.fileName} ({m.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Starting Hero Prefab */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">Default Prefab</h4>
                      <p className="text-xs text-neutral-400">Initial player appearance & stats</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Select .prefab File</label>
                    <select
                      value={data.defaultPrefabFileName}
                      onChange={(e) => updateStructure(s => ({ ...s, defaultPrefabFileName: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {(project.fileSystem.prefabs || []).map(c => (
                        <option key={c.fileName} value={c.fileName}>{c.fileName} ({c.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. In-Game Attached UI Theme */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Layout size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">Attached HUD Theme</h4>
                      <p className="text-xs text-neutral-400">Health orb, minimap & boss bars</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Select .ui File</label>
                    <select
                      value={data.attachedUiFileName}
                      onChange={(e) => updateStructure(s => ({ ...s, attachedUiFileName: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {project.fileSystem.ui.map(u => (
                        <option key={u.fileName} value={u.fileName}>{u.fileName} ({u.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Game Identity & Version */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">Game Identity & Version</h4>
                      <p className="text-xs text-neutral-400">Title, Subtitle & Release Tag</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={data.gameTitle}
                      onChange={(e) => updateStructure(s => ({ ...s, gameTitle: e.target.value }))}
                      placeholder="Title"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={data.gameSubtitle}
                      onChange={(e) => updateStructure(s => ({ ...s, gameSubtitle: e.target.value }))}
                      placeholder="Subtitle"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-300"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: MAIN MENU SCENE BUILDER */}
          {activeTab === 'main_menu' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Tv size={18} className="text-purple-400" />
                    Main Menu Scene & Parallax Title Screen
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Configure title presentation, backdrop parallax theme, soundtrack, and menu actions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewingMainMenu(!previewingMainMenu)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye size={14} className="text-cyan-400" />
                  <span>{previewingMainMenu ? 'Exit Live Preview' : 'Preview Title Screen'}</span>
                </button>
              </div>

              {/* Live Title Screen Simulator */}
              <div className="relative w-full h-80 rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950 shadow-2xl flex flex-col justify-between p-8">
                {/* Background Parallax Mock / Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-neutral-950/80 to-black pointer-events-none" />

                {/* Top Meta info */}
                <div className="relative z-20 flex justify-between items-start">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    Build Version: {data.version} • Mason Engine
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    BGM: {data.mainMenu.backgroundThemeSong}
                  </div>
                </div>

                {/* Center Title Logo */}
                <div className="relative z-20 text-center space-y-1">
                  <h1 
                    className="text-3xl md:text-4xl font-black tracking-widest uppercase drop-shadow-2xl"
                    style={{ color: data.mainMenu.titleColor || '#f43f5e' }}
                  >
                    {data.mainMenu.gameTitle || 'GAME TITLE'}
                  </h1>
                  <p 
                    className="text-xs md:text-sm font-semibold tracking-wider text-neutral-400"
                    style={{ color: data.mainMenu.accentColor || '#06b6d4' }}
                  >
                    {data.mainMenu.gameSubtitle || 'A METROIDVANIA ODYSSEY'}
                  </p>
                </div>

                {/* Menu Buttons List */}
                <div className="relative z-20 flex flex-col items-center gap-2">
                  {data.mainMenu.menuButtons.map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      className="px-6 py-1.5 rounded-lg text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-transparent hover:border-white/20 transition tracking-wider uppercase"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-200">Title & Subtitle Typography</h4>
                  <input
                    type="text"
                    value={data.mainMenu.gameTitle}
                    onChange={(e) => updateStructure(s => ({ ...s, mainMenu: { ...s.mainMenu, gameTitle: e.target.value } }))}
                    placeholder="Game Title"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={data.mainMenu.gameSubtitle}
                    onChange={(e) => updateStructure(s => ({ ...s, mainMenu: { ...s.mainMenu, gameSubtitle: e.target.value } }))}
                    placeholder="Game Subtitle"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-200">Parallax Backdrop & Audio</h4>
                  <select
                    value={data.mainMenu.backgroundBiomeFileName}
                    onChange={(e) => updateStructure(s => ({ ...s, mainMenu: { ...s.mainMenu, backgroundBiomeFileName: e.target.value } }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  >
                    {project.fileSystem.biomes.map(b => (
                      <option key={b.fileName} value={b.fileName}>{b.fileName} ({b.name})</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={data.mainMenu.backgroundThemeSong}
                    onChange={(e) => updateStructure(s => ({ ...s, mainMenu: { ...s.mainMenu, backgroundThemeSong: e.target.value } }))}
                    placeholder="BGM Cue (e.g. bgm_ashen_requiem)"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOADING SCREENS & LORE */}
          {activeTab === 'loading_screen' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Clock size={18} className="text-purple-400" />
                  Loading Screen Wipes & Lore Tips Carousel
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Manage transition wipes (iris, shutter, fade) between map sectors and author gameplay lore hints.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Transition Wipe Style */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Screen Wipe Effect</h3>
                  <select
                    value={data.loadingScreen.style}
                    onChange={(e) => updateStructure(s => ({ ...s, loadingScreen: { ...s.loadingScreen, style: e.target.value as any } }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="lore_slate">Lore Slate & Tips Carousel</option>
                    <option value="dark_ambient">Dark Ambient Fade</option>
                    <option value="animated_shutter">Vertical Shutter Wipe</option>
                    <option value="iris_wipe">Circular Iris Eye Close</option>
                  </select>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Min Duration: {data.loadingScreen.minDisplayDurationMs}ms</label>
                    <input
                      type="range"
                      min="500"
                      max="4000"
                      step="250"
                      value={data.loadingScreen.minDisplayDurationMs}
                      onChange={(e) => updateStructure(s => ({ ...s, loadingScreen: { ...s.loadingScreen, minDisplayDurationMs: parseInt(e.target.value) } }))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>

                {/* Lore Tips Editor */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                      Lore Hints Carousel ({data.loadingScreen.loreTips.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        updateStructure(s => ({
                          ...s,
                          loadingScreen: {
                            ...s.loadingScreen,
                            loreTips: [...s.loadingScreen.loreTips, 'New exploration tip for the player.']
                          }
                        }));
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Hint
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {data.loadingScreen.loreTips.map((tip, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateStructure(s => ({
                              ...s,
                              loadingScreen: {
                                ...s.loadingScreen,
                                loreTips: s.loadingScreen.loreTips.map((t, i) => i === idx ? val : t)
                              }
                            }));
                          }}
                          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateStructure(s => ({
                              ...s,
                              loadingScreen: {
                                ...s.loadingScreen,
                                loreTips: s.loadingScreen.loreTips.filter((_, i) => i !== idx)
                              }
                            }));
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAUSE & IN-GAME MENUS */}
          {activeTab === 'pause_menu' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Sliders size={18} className="text-purple-400" />
                  Pause & System Menu Configuration
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Select available pause tabs during active gameplay and set background world freeze parameters.
                </p>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Active Pause Tabs</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(data.pauseMenu.enabledTabs).map(([key, isEnabled]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl cursor-pointer hover:border-neutral-700 transition">
                      <span className="text-xs font-semibold text-neutral-200 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')} Tab
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(isEnabled)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateStructure(s => ({
                            ...s,
                            pauseMenu: {
                              ...s.pauseMenu,
                              enabledTabs: {
                                ...s.pauseMenu.enabledTabs,
                                [key]: checked
                              }
                            }
                          }));
                        }}
                        className="rounded accent-purple-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROGRESSION FLAGS & ABILITIES */}
          {activeTab === 'progression_flags' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Key size={18} className="text-purple-400" />
                    Metroidvania Progression & Ability Flags
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Define gates, boss seals, and traversal abilities that govern passage unlocks across maps.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddProgressionFlag}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Flag
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {data.progressionFlags.map((flag, idx) => (
                  <div key={flag.id} className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">{flag.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          flag.category === 'traversal' ? 'bg-cyan-500/20 text-cyan-300' :
                          flag.category === 'boss' ? 'bg-red-500/20 text-red-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {flag.category}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={flag.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStructure(s => ({
                            ...s,
                            progressionFlags: s.progressionFlags.map((f, i) => i === idx ? { ...f, name: val } : f)
                          }));
                        }}
                        className="font-semibold text-xs text-neutral-200 bg-transparent border-b border-dashed border-neutral-700 focus:border-purple-500 outline-none w-full"
                      />
                      <input
                        type="text"
                        value={flag.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStructure(s => ({
                            ...s,
                            progressionFlags: s.progressionFlags.map((f, i) => i === idx ? { ...f, description: val } : f)
                          }));
                        }}
                        className="text-[11px] text-neutral-400 bg-transparent border-none outline-none w-full"
                        placeholder="Description"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateStructure(s => ({
                          ...s,
                          progressionFlags: s.progressionFlags.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Toast Notification Alert for Game Structure Module */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div 
            className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-purple-950/95 border-purple-500/60 text-white shadow-purple-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/60 text-red-200 shadow-red-950/50'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200 shadow-neutral-950/50'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
            )}
            {toast.type === 'error' && <AlertTriangle size={16} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && <Compass size={16} className="text-purple-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};
