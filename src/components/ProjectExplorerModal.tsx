import React, { useState } from 'react';
import { 
  MasonProject, 
  MasonModuleId,
  MapFile,
  BiomeFile,
  UIThemeFile,
  GameStructureFile
} from '../engine/masonProjectSchema';
import { 
  exportMapFile, 
  exportBiomeFile, 
  exportUIThemeFile, 
  exportGameStructureFile, 
  exportFullProjectBundle,
  createNewMapInProject,
  createNewBiomeInProject,
  createNewUIThemeInProject,
  createNewGameStructureInProject
} from '../utils/masonStorage';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Sparkles, 
  HardDrive, 
  X,
  ExternalLink,
  Code,
  Map as MapIcon,
  TreePine,
  Users,
  Layout,
  Compass
} from 'lucide-react';

interface ProjectExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onNavigateToModule: (module: MasonModuleId, fileToSelect?: string) => void;
}

export const ProjectExplorerModal: React.FC<ProjectExplorerModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onNavigateToModule
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    subfolder: 'maps' | 'biomes' | 'characters' | 'ui' | 'game';
    file: any;
  } | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    maps: true,
    biomes: true,
    characters: true,
    ui: true,
    game: true
  });

  const [newFileInput, setNewFileInput] = useState<{ subfolder: string; name: string } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen) return null;

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileInput || !newFileInput.name.trim()) return;

    const name = newFileInput.name.trim();
    if (newFileInput.subfolder === 'maps') {
      const { project: updated } = createNewMapInProject(project, name);
      onUpdateProject(() => updated);
    } else if (newFileInput.subfolder === 'biomes') {
      const { project: updated } = createNewBiomeInProject(project, name);
      onUpdateProject(() => updated);
    } else if (newFileInput.subfolder === 'characters') {
      const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.character`;
      const newChar = {
        id: `char_${Date.now()}`,
        name,
        fileName: safeName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        characterData: {
          id: `char_${Date.now()}`,
          name,
          characterType: 'enemy_mob' as const,
          avatarIcon: '👹',
          spriteWidth: 64,
          spriteHeight: 64,
          tintColor: '#f59e0b',
          baseScale: 1.0,
          states: ['idle', 'patrol', 'combat'],
          variables: [
            { id: 'var_max_hp', name: 'Max Health', category: 'attribute' as const, type: 'number' as const, isStatic: true, defaultValue: 100 },
            { id: 'var_speed', name: 'Move Speed', category: 'attribute' as const, type: 'number' as const, isStatic: false, defaultValue: 3.0 }
          ],
          behaviorVariables: {
            var_max_hp: 100,
            var_speed: 3.0
          },
          rules: [
            {
              id: 'rule_sight',
              name: 'Sight Raycast Detection',
              enabled: true,
              trigger: {
                type: 'sight' as const,
                sensoryTag: 'head_eyes' as const,
                visionRadiusPx: 200,
                visionAngleDeg: 120,
                requireLineOfSight: true,
                targetFilter: 'player' as const
              },
              actions: [
                { id: 'act_alert', actionType: 'emit_signal' as const, signalType: 'alert_icon' as const, signalRadiusPx: 100 },
                { id: 'act_chase', actionType: 'move' as const, moveMode: 'towards_target' as const, speed: 4.0 }
              ]
            }
          ],
          sockets: [
            { tagId: 'head_eyes' as const, label: 'Sight Locus (Eyes)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
            { tagId: 'head_ears' as const, label: 'Acoustic Ears', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
            { tagId: 'torso_center' as const, label: 'Torso Hurtbox', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' }
          ],
          animations: [
            { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_main', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
          ]
        }
      };
      onUpdateProject(p => ({
        ...p,
        fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), newChar] }
      }));
    } else if (newFileInput.subfolder === 'ui') {
      const { project: updated } = createNewUIThemeInProject(project, name);
      onUpdateProject(() => updated);
    } else if (newFileInput.subfolder === 'game') {
      const { project: updated } = createNewGameStructureInProject(project, name);
      onUpdateProject(() => updated);
    }

    setNewFileInput(null);
  };

  // Import custom JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Determine file type by structure or file extension
        if (file.name.endsWith('.map') || parsed.cells) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, maps: [...p.fileSystem.maps, parsed] }
          }));
        } else if (file.name.endsWith('.biome') || parsed.tileTypes) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, biomes: [...p.fileSystem.biomes, parsed] }
          }));
        } else if (file.name.endsWith('.character') || parsed.characterData) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, characters: [...(p.fileSystem.characters || []), parsed] }
          }));
        } else if (file.name.endsWith('.behavior') || parsed.behaviorData) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, behaviors: [...(p.fileSystem.behaviors || []), parsed] }
          }));
        } else if (file.name.endsWith('.ui') || parsed.healthOrb) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, ui: [...p.fileSystem.ui, parsed] }
          }));
        } else if (file.name.endsWith('.gamestructure') || parsed.worldGraphLinks) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, game: [...p.fileSystem.game, parsed] }
          }));
        } else if (parsed.fileSystem) {
          // Full project bundle
          onUpdateProject(() => parsed);
        }
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Project File System Explorer</h2>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                  v{project.engineVersion}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Subfolder-based virtual file storage for Maps, Biomes, Characters, Behaviors, UI & Game Framework
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
              <Upload size={14} className="text-cyan-400" />
              <span>Import File</span>
              <input type="file" accept=".json,.map,.biome,.arch,.ui,.gamestructure" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => exportFullProjectBundle(project)}
              className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download size={14} />
              <span>Export Full Project Bundle</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body: Left File Tree | Right File Inspector */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: SUBFOLDER TREE VIEW */}
          <div className="w-80 border-r border-neutral-800 bg-neutral-950/60 p-4 overflow-y-auto space-y-3 shrink-0">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">
              Workspace Subfolders
            </div>

            {/* FOLDER 1: /maps/ (.map) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('maps')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.maps ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-cyan-400" />
                  <span>maps/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({project.fileSystem.maps.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'maps', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-cyan-400 rounded"
                  title="New .map file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.maps && (
                <div className="pl-6 space-y-0.5">
                  {project.fileSystem.maps.map(m => (
                    <button
                      key={m.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'maps', file: m })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === m.fileName
                          ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m.fileName}</span>
                      <span className="text-[9px] text-neutral-500">{m.width}x{m.height}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOLDER 2: /biomes/ (.biome) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('biomes')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.biomes ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-emerald-400" />
                  <span>biomes/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({project.fileSystem.biomes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'biomes', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-emerald-400 rounded"
                  title="New .biome file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.biomes && (
                <div className="pl-6 space-y-0.5">
                  {project.fileSystem.biomes.map(b => (
                    <button
                      key={b.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'biomes', file: b })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === b.fileName
                          ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{b.fileName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOLDER 3.5: /characters/ (.character) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('characters')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.characters ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-rose-400" />
                  <span>characters/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({(project.fileSystem.characters || []).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'characters', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 rounded"
                  title="New .character file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.characters && (
                <div className="pl-6 space-y-0.5">
                  {(project.fileSystem.characters || []).map(c => (
                    <button
                      key={c.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'characters', file: c })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === c.fileName
                          ? 'bg-rose-950/60 text-rose-200 border border-rose-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{c.fileName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOLDER 4: /ui/ (.ui) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('ui')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.ui ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-amber-400" />
                  <span>ui/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({project.fileSystem.ui.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'ui', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-amber-400 rounded"
                  title="New .ui file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.ui && (
                <div className="pl-6 space-y-0.5">
                  {project.fileSystem.ui.map(u => (
                    <button
                      key={u.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'ui', file: u })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === u.fileName
                          ? 'bg-amber-950/60 text-amber-200 border border-amber-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{u.fileName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOLDER 5: /game/ (.gamestructure) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('game')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.game ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-purple-400" />
                  <span>game/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({project.fileSystem.game.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'game', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-purple-400 rounded"
                  title="New .gamestructure file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.game && (
                <div className="pl-6 space-y-0.5">
                  {project.fileSystem.game.map(g => (
                    <button
                      key={g.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'game', file: g })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === g.fileName
                          ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{g.fileName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: SELECTED FILE INSPECTOR */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {selectedFile ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-mono">
                        /{selectedFile.subfolder}/{selectedFile.file.fileName}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {selectedFile.file.name} • Updated {new Date(selectedFile.file.updatedAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetModule: MasonModuleId = 
                          selectedFile.subfolder === 'maps' ? 'maps' :
                          selectedFile.subfolder === 'biomes' ? 'biomes' :
                          selectedFile.subfolder === 'characters' ? 'characters' :
                          selectedFile.subfolder === 'ui' ? 'ui' : 'gamestructure';

                        onNavigateToModule(targetModule, selectedFile.file.fileName);
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30"
                    >
                      <ExternalLink size={14} />
                      <span>Open in {selectedFile.subfolder.toUpperCase()} Module</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFile.subfolder === 'maps') exportMapFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'biomes') exportBiomeFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'ui') exportUIThemeFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'game') exportGameStructureFile(selectedFile.file);
                        else {
                          const jsonStr = JSON.stringify(selectedFile.file, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = selectedFile.file.fileName;
                          a.click();
                        }
                      }}
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs"
                      title="Download File"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </div>

                {/* Raw JSON inspection toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    File Manifest Data
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Code size={13} /> {showRawJson ? 'Show Formatted View' : 'Show Raw JSON'}
                  </button>
                </div>

                {showRawJson ? (
                  <pre className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-[11px] font-mono text-cyan-300 max-h-96 overflow-y-auto">
                    {JSON.stringify(selectedFile.file, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-neutral-500 font-bold block">File Type:</span>
                        <span className="text-neutral-200 font-mono">.{selectedFile.subfolder} schema</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-bold block">Internal ID:</span>
                        <span className="text-neutral-200 font-mono">{selectedFile.file.id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 space-y-3">
                <FolderOpen size={48} className="text-neutral-700" />
                <p className="text-xs">Select any file in the workspace subfolders on the left to inspect or open.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Create New File Dialog */}
      {newFileInput && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleCreateFileSubmit} className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Create New File in /{newFileInput.subfolder}/</h3>
            <input
              type="text"
              autoFocus
              value={newFileInput.name}
              onChange={(e) => setNewFileInput({ ...newFileInput, name: e.target.value })}
              placeholder="Display Name"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNewFileInput(null)} className="px-3 py-1.5 text-xs text-neutral-400">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-bold">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
