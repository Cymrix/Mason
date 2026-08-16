import React, { useState } from 'react';
import { 
  GameStructureFile, 
  MasonProject, 
  WorldGraphLink, 
  ProgressionFlag,
  MapExit
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
  Info
} from 'lucide-react';

interface GameStructureModuleProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onNavigateToModule: (moduleId: string, fileToSelect?: string) => void;
}

export const GameStructureModule: React.FC<GameStructureModuleProps> = ({
  project,
  onUpdateProject,
  onNavigateToModule
}) => {
  const activeFileName = project.activeFiles.gameStructureFileName || project.fileSystem.game[0]?.fileName;
  const currentStructureFile = project.fileSystem.game.find(g => g.fileName === activeFileName) || project.fileSystem.game[0];

  const [activeTab, setActiveTab] = useState<'world_graph' | 'entry_bindings' | 'main_menu' | 'loading_screen' | 'pause_menu' | 'progression_flags'>('world_graph');
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);
  const [previewingMainMenu, setPreviewingMainMenu] = useState(false);
  const [previewingLoadingScreen, setPreviewingLoadingScreen] = useState(false);
  const [testFlagState, setTestFlagState] = useState<Record<string, boolean>>({});

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

  // Add a new World Graph Link between maps
  const handleAddGraphLink = () => {
    const defaultSourceMap = project.fileSystem.maps[0]?.fileName || 'ashen_outpost.map';
    const defaultTargetMap = project.fileSystem.maps[1]?.fileName || project.fileSystem.maps[0]?.fileName || 'crystal_chasm.map';
    
    const newLink: WorldGraphLink = {
      id: `link_${Date.now()}`,
      sourceMapFileName: defaultSourceMap,
      sourceExitId: 'exit_east',
      targetMapFileName: defaultTargetMap,
      targetExitId: 'exit_west',
      isBiDirectional: true,
      notes: 'New corridor connection between rooms'
    };

    updateStructure(s => ({
      ...s,
      worldGraphLinks: [...s.worldGraphLinks, newLink]
    }));
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
        onSaveFile={() => {}}
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
              activeFiles: { ...p.activeFiles, gameStructureFileName: filtered[0]?.fileName || '' },
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
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Compass size={18} className="text-purple-400" />
                    World Map Graph & Metroidvania Room Linker
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect individual <code className="text-cyan-300 font-mono">.map</code> level files through exit doorways, elevators, and locked progression gates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddGraphLink}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                >
                  <Plus size={14} /> Add Map Link
                </button>
              </div>

              {/* Visual Node Matrix of Available Maps */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Available Levels in Project File System ({project.fileSystem.maps.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {project.fileSystem.maps.map(mapFile => {
                    const outgoingCount = data.worldGraphLinks.filter(l => l.sourceMapFileName === mapFile.fileName).length;
                    const incomingCount = data.worldGraphLinks.filter(l => l.targetMapFileName === mapFile.fileName).length;
                    const isEntry = data.entryMapFileName === mapFile.fileName;

                    return (
                      <div 
                        key={mapFile.fileName}
                        className={`p-3.5 rounded-xl border transition ${
                          isEntry 
                            ? 'bg-purple-950/30 border-purple-500/50 shadow-md' 
                            : 'bg-neutral-950 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-neutral-200 truncate">
                            {mapFile.fileName}
                          </span>
                          {isEntry && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              ENTRY POINT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 truncate">{mapFile.name}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-800/80 pt-2">
                          <span>{mapFile.width}×{mapFile.height} Tiles</span>
                          <span className="text-cyan-400">{outgoingCount + incomingCount} Connections</span>
                          <button
                            type="button"
                            onClick={() => onNavigateToModule('maps', mapFile.fileName)}
                            className="text-cyan-400 hover:underline"
                          >
                            Open Map →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Connections List & Link Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Active Door & Transition Links ({data.worldGraphLinks.length})
                </h3>

                <div className="space-y-2.5">
                  {data.worldGraphLinks.map((link, idx) => {
                    const sourceMap = project.fileSystem.maps.find(m => m.fileName === link.sourceMapFileName);
                    const targetMap = project.fileSystem.maps.find(m => m.fileName === link.targetMapFileName);
                    const requiredFlag = data.progressionFlags.find(f => f.id === link.requiredFlagId);

                    return (
                      <div 
                        key={link.id}
                        className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xs font-mono font-bold text-purple-300">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-neutral-200">{link.notes || `Connection ${idx + 1}`}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-neutral-400">
                                <span>{link.sourceMapFileName} [{link.sourceExitId}]</span>
                                {link.isBiDirectional ? <ArrowLeftRight size={12} className="text-purple-400" /> : <ArrowRight size={12} className="text-cyan-400" />}
                                <span>{link.targetMapFileName} [{link.targetExitId}]</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {link.requiredFlagId && (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded font-semibold flex items-center gap-1">
                                <Lock size={10} /> Requires: {requiredFlag?.name || link.requiredFlagId}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                updateStructure(s => ({
                                  ...s,
                                  worldGraphLinks: s.worldGraphLinks.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                              title="Delete Link"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Link Property Modifiers */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Origin Map (.map)</label>
                            <select
                              value={link.sourceMapFileName}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateStructure(s => ({
                                  ...s,
                                  worldGraphLinks: s.worldGraphLinks.map((l, i) => i === idx ? { ...l, sourceMapFileName: val } : l)
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            >
                              {project.fileSystem.maps.map(m => (
                                <option key={m.fileName} value={m.fileName}>{m.fileName}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Target Map (.map)</label>
                            <select
                              value={link.targetMapFileName}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateStructure(s => ({
                                  ...s,
                                  worldGraphLinks: s.worldGraphLinks.map((l, i) => i === idx ? { ...l, targetMapFileName: val } : l)
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            >
                              {project.fileSystem.maps.map(m => (
                                <option key={m.fileName} value={m.fileName}>{m.fileName}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Lock with Flag</label>
                            <select
                              value={link.requiredFlagId || ''}
                              onChange={(e) => {
                                const val = e.target.value || undefined;
                                updateStructure(s => ({
                                  ...s,
                                  worldGraphLinks: s.worldGraphLinks.map((l, i) => i === idx ? { ...l, requiredFlagId: val } : l)
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="">No Lock (Free Passage)</option>
                              {data.progressionFlags.map(flag => (
                                <option key={flag.id} value={flag.id}>{flag.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 flex flex-col justify-end">
                            <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={link.isBiDirectional}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  updateStructure(s => ({
                                    ...s,
                                    worldGraphLinks: s.worldGraphLinks.map((l, i) => i === idx ? { ...l, isBiDirectional: checked } : l)
                                  }));
                                }}
                                className="rounded accent-purple-500 cursor-pointer"
                              />
                              <span className="text-[11px] text-neutral-300 font-semibold">Bi-Directional Exit</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                  Designate the starting level, initial archetype class, and HUD theme attached to this game session.
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

                {/* 2. Starting Hero Archetype */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">Default Archetype</h4>
                      <p className="text-xs text-neutral-400">Initial player class & move set</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300">Select .arch File</label>
                    <select
                      value={data.defaultArchetypeFileName}
                      onChange={(e) => updateStructure(s => ({ ...s, defaultArchetypeFileName: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {project.fileSystem.archetypes.map(a => (
                        <option key={a.fileName} value={a.fileName}>{a.fileName} ({a.name})</option>
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
                        checked={isEnabled}
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
    </div>
  );
};
