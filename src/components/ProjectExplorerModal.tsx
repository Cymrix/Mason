import React, { useState, useEffect } from 'react';
import { 
  MasonProject, 
  MasonModuleId,
  MapFile,
  BiomeFile,
  UIThemeFile,
  GameStructureFile,
  FileBackupRecord
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
  createNewGameStructureInProject,
  saveActiveMasonProject,
  getFileBackups,
  restoreFileVersion,
  deleteFileBackup
} from '../utils/masonStorage';
import { createOrLinkImageAndSpriteProject } from '../utils/spriteUtils';
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
  Compass,
  Image as ImageIcon,
  History,
  RotateCcw,
  Clock,
  Check
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
    subfolder: 'maps' | 'biomes' | 'prefabs' | 'ui' | 'game' | 'sprites' | 'images';
    file: any;
  } | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    maps: true,
    biomes: true,
    prefabs: true,
    ui: true,
    game: true,
    sprites: true,
    images: true
  });

  const [newFileInput, setNewFileInput] = useState<{ subfolder: string; name: string } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [fileBackups, setFileBackups] = useState<FileBackupRecord[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);
  const [confirmingDeleteBackupId, setConfirmingDeleteBackupId] = useState<string | null>(null);
  const [previewBackup, setPreviewBackup] = useState<FileBackupRecord | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setConfirmingDeleteBackupId(null);
    if (selectedFile && project && project.id) {
      setIsLoadingBackups(true);
      getFileBackups(project.id, selectedFile.file.fileName).then((records) => {
        setFileBackups(records);
        setIsLoadingBackups(false);
      }).catch(() => {
        setFileBackups([]);
        setIsLoadingBackups(false);
      });
    } else {
      setFileBackups([]);
    }
    setPreviewBackup(null);
  }, [selectedFile?.file?.fileName, project.id, project.updatedAt]);

  if (!isOpen) return null;

  const handleRestoreVersion = async (backupId: string) => {
    setIsRestoringVersion(true);
    try {
      const result = await restoreFileVersion(project, backupId);
      if (result) {
        onUpdateProject(() => result.updatedProject);
        
        // Update currently selected file preview if it matches restored or linked file
        if (selectedFile) {
          const refreshedFile = (result.updatedProject.fileSystem as any)[selectedFile.subfolder]?.find(
            (f: any) => f.fileName === selectedFile.file.fileName
          );
          if (refreshedFile) {
            setSelectedFile({
              subfolder: selectedFile.subfolder,
              file: refreshedFile
            });
          }
        }

        setRestoreSuccessMsg(`Restored ${result.restoredFileName} to version!`);
        setTimeout(() => setRestoreSuccessMsg(null), 4000);
        if (project.id && selectedFile?.file?.fileName) {
          const refreshed = await getFileBackups(project.id, selectedFile.file.fileName);
          setFileBackups(refreshed);
        }
      }
    } finally {
      setIsRestoringVersion(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!project.id || !selectedFile?.file?.fileName) return;
    await deleteFileBackup(backupId);
    if (previewBackup?.id === backupId) {
      setPreviewBackup(null);
    }
    const refreshed = await getFileBackups(project.id, selectedFile.file.fileName);
    setFileBackups(refreshed);
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleDeleteSelectedFile = () => {
    if (!selectedFile) return;
    const { subfolder, file } = selectedFile;
    const fName = file.fileName;

    onUpdateProject(p => {
      if (subfolder === 'maps') {
        const remaining = p.fileSystem.maps.filter(m => m.fileName !== fName);
        if (remaining.length === 0) return p;
        return {
          ...p,
          activeFiles: {
            ...p.activeFiles,
            mapFileName: p.activeFiles.mapFileName === fName ? remaining[0].fileName : p.activeFiles.mapFileName
          },
          fileSystem: { ...p.fileSystem, maps: remaining }
        };
      } else if (subfolder === 'biomes') {
        const remaining = p.fileSystem.biomes.filter(b => b.fileName !== fName);
        if (remaining.length === 0) return p;
        return {
          ...p,
          activeFiles: {
            ...p.activeFiles,
            biomeFileName: p.activeFiles.biomeFileName === fName ? remaining[0].fileName : p.activeFiles.biomeFileName
          },
          fileSystem: { ...p.fileSystem, biomes: remaining }
        };
      } else if (subfolder === 'prefabs') {
        const remaining = (p.fileSystem.prefabs || []).filter(c => c.fileName !== fName);
        if (remaining.length === 0) return p;
        return {
          ...p,
          activeFiles: {
            ...p.activeFiles,
            prefabFileName: p.activeFiles.prefabFileName === fName ? remaining[0]?.fileName || '' : p.activeFiles.prefabFileName
          },
          fileSystem: { ...p.fileSystem, prefabs: remaining }
        };
      } else if (subfolder === 'ui') {
        const remaining = p.fileSystem.ui.filter(u => u.fileName !== fName);
        if (remaining.length === 0) return p;
        return {
          ...p,
          activeFiles: {
            ...p.activeFiles,
            uiFileName: p.activeFiles?.uiFileName === fName ? remaining[0].fileName : p.activeFiles?.uiFileName
          },
          fileSystem: { ...p.fileSystem, ui: remaining }
        };
      } else if (subfolder === 'game') {
        const remaining = p.fileSystem.game.filter(g => g.fileName !== fName);
        if (remaining.length === 0) return p;
        return {
          ...p,
          activeFiles: {
            ...p.activeFiles,
            gameStructureFileName: p.activeFiles?.gameStructureFileName === fName ? remaining[0].fileName : p.activeFiles?.gameStructureFileName
          },
          fileSystem: { ...p.fileSystem, game: remaining }
        };
      } else if (subfolder === 'sprites') {
        const remaining = (p.fileSystem.sprites || []).filter(s => s.fileName !== fName);
        return {
          ...p,
          fileSystem: { ...p.fileSystem, sprites: remaining }
        };
      } else if (subfolder === 'images') {
        const remaining = (p.fileSystem.images || []).filter(i => i.fileName !== fName);
        return {
          ...p,
          fileSystem: { ...p.fileSystem, images: remaining }
        };
      }
      return p;
    });

    setSelectedFile(null);
    setIsConfirmingDelete(false);
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
    } else if (newFileInput.subfolder === 'prefabs') {
      const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.prefab`;
      const newChar = {
        id: `char_${Date.now()}`,
        name,
        fileName: safeName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prefabData: {
          id: `char_${Date.now()}`,
          name,
          prefabType: 'enemy_mob' as const,
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
          sockets: [],
          polygons: [],
          animations: [
            { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_main', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true }
          ]
        }
      };
      onUpdateProject(p => ({
        ...p,
        fileSystem: { ...p.fileSystem, prefabs: [...(p.fileSystem.prefabs || []), newChar] }
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

  // Import custom JSON or Image file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
      const imgReader = new FileReader();
      imgReader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const { updatedProject } = await createOrLinkImageAndSpriteProject(project, {
          name: cleanName,
          imageSrc: dataUrl,
          cols: 1,
          rows: 1,
          tileWidth: 32,
          tileHeight: 32
        });
        onUpdateProject(() => updatedProject);
      };
      imgReader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Determine file type by structure or file extension
        if (file.name.endsWith('.sprite') || parsed.spriteData) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, sprites: [...(p.fileSystem.sprites || []), parsed] }
          }));
        } else if (file.name.endsWith('.map') || parsed.cells) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, maps: [...p.fileSystem.maps, parsed] }
          }));
        } else if (file.name.endsWith('.biome') || parsed.tileTypes) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, biomes: [...p.fileSystem.biomes, parsed] }
          }));
        } else if (file.name.endsWith('.prefab') || parsed.prefabData) {
          onUpdateProject(p => ({
            ...p,
            fileSystem: { ...p.fileSystem, prefabs: [...(p.fileSystem.prefabs || []), parsed] }
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
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
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
                Subfolder-based virtual file storage for Maps, Biomes, Prefabs, Behaviors, UI & Game Framework
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
              <Upload size={14} className="text-indigo-400" />
              <span>Import File</span>
              <input type="file" accept=".json,.map,.biome,.arch,.ui,.gamestructure" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => exportFullProjectBundle(project)}
              className="px-3.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
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

            {/* FOLDER 3.5: /prefabs/ (.prefab) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('prefabs')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.prefabs ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-rose-400" />
                  <span>prefabs/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({(project.fileSystem.prefabs || []).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileInput({ subfolder: 'prefabs', name: '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 rounded"
                  title="New .prefab file"
                >
                  <Plus size={13} />
                </button>
              </div>

              {expandedFolders.prefabs && (
                <div className="pl-6 space-y-0.5">
                  {(project.fileSystem.prefabs || []).map(c => (
                    <button
                      key={c.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'prefabs', file: c })}
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

            {/* FOLDER 6: /sprites/ (.sprite) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('sprites')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.sprites ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-pink-400" />
                  <span>sprites/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({(project.fileSystem.sprites || []).length})</span>
                </button>
              </div>

              {expandedFolders.sprites && (
                <div className="pl-6 space-y-0.5">
                  {(project.fileSystem.sprites || []).map(s => (
                    <button
                      key={s.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'sprites', file: s })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === s.fileName
                          ? 'bg-pink-950/60 text-pink-200 border border-pink-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{s.fileName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FOLDER 7: /images/ (.png) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 hover:bg-neutral-900 rounded-lg group">
                <button
                  type="button"
                  onClick={() => toggleFolder('images')}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-200"
                >
                  {expandedFolders.images ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                  <Folder size={15} className="text-amber-400" />
                  <span>images/</span>
                  <span className="text-[10px] font-mono text-neutral-500">({(project.fileSystem.images || []).length})</span>
                </button>
              </div>

              {expandedFolders.images && (
                <div className="pl-6 space-y-0.5">
                  {(project.fileSystem.images || []).map(img => (
                    <button
                      key={img.fileName}
                      type="button"
                      onClick={() => setSelectedFile({ subfolder: 'images', file: img })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition flex items-center justify-between ${
                        selectedFile?.file?.fileName === img.fileName
                          ? 'bg-amber-950/60 text-amber-200 border border-amber-500/40'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{img.fileName}</span>
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
                          selectedFile.subfolder === 'prefabs' ? 'prefabs' :
                          selectedFile.subfolder === 'ui' ? 'ui' :
                          selectedFile.subfolder === 'sprites' || selectedFile.subfolder === 'images' ? 'sprites' : 'gamestructure';

                        onNavigateToModule(targetModule, selectedFile.file.fileName);
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30"
                    >
                      <ExternalLink size={14} />
                      <span>Open in {selectedFile.subfolder === 'images' ? 'IMAGE EDITOR' : selectedFile.subfolder.toUpperCase()} Module</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFile.subfolder === 'maps') exportMapFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'biomes') exportBiomeFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'ui') exportUIThemeFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'game') exportGameStructureFile(selectedFile.file);
                        else if (selectedFile.subfolder === 'images' && selectedFile.file.dataUrl) {
                          const a = document.createElement('a');
                          a.href = selectedFile.file.dataUrl;
                          a.download = selectedFile.file.fileName;
                          a.click();
                        } else {
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

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/60 rounded-xl p-1 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-[11px] text-rose-300 font-bold px-1">Delete file?</span>
                        <button
                          type="button"
                          onClick={handleDeleteSelectedFile}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="p-2 bg-neutral-800 hover:bg-rose-950/80 border border-neutral-700 hover:border-rose-500/50 text-neutral-400 hover:text-rose-300 rounded-xl text-xs transition"
                        title={`Delete ${selectedFile.file.fileName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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
                ) : selectedFile.subfolder === 'images' && selectedFile.file.dataUrl ? (
                  <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center space-y-3">
                    <img 
                      src={selectedFile.file.dataUrl} 
                      alt={selectedFile.file.name} 
                      className="max-h-72 object-contain rounded-xl border border-neutral-800 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:10px_10px] p-2" 
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                      <span className="text-amber-400 font-bold">PNG Image Asset</span>
                      {selectedFile.file.width && <span className="text-neutral-400 font-mono">• {selectedFile.file.width} × {selectedFile.file.height} px</span>}
                      
                      {/* Linked Sprite Badge */}
                      {(() => {
                        const sourceSpriteName = selectedFile.file.sourceSpriteFileName;
                        const linkedSprite = sourceSpriteName
                          ? (project.fileSystem.sprites || []).find(s => s.fileName === sourceSpriteName)
                          : (project.fileSystem.sprites || []).find(s => (s.linkedImageFileNames || []).includes(selectedFile.file.fileName));

                        if (linkedSprite) {
                          return (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                              <span>🔗 Linked to: {linkedSprite.name} ({linkedSprite.fileName})</span>
                            </span>
                          );
                        }
                        return (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                            <span>⚠️ Unlinked Image (Not associated with any .sprite)</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
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

                {/* PREVIOUS VERSIONS & DIFFERENTIAL CHECKPOINTS */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <History size={18} className="text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                          Previous Versions & Checkpoints
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          Differential file-level history stored in local database
                        </p>
                      </div>
                      <span className="ml-2 text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-full border border-indigo-500/30">
                        {fileBackups.length}/10 retained
                      </span>
                    </div>

                    {restoreSuccessMsg && (
                      <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                        <Check size={13} />
                        <span>{restoreSuccessMsg}</span>
                      </div>
                    )}
                  </div>

                  {isLoadingBackups ? (
                    <div className="py-6 text-center text-xs text-neutral-500 font-mono">
                      Searching differential file history...
                    </div>
                  ) : fileBackups.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-950/60 rounded-xl border border-dashed border-neutral-800 p-4">
                      No previous file versions recorded yet. Checkpoints are automatically captured each time this file is modified and saved.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {fileBackups.map((bk, idx) => {
                        const isCurrentVersion = bk.isCurrent || (!fileBackups.some(b => b.isCurrent) && idx === 0);
                        return (
                          <div
                            key={bk.id}
                            className={`bg-neutral-950 border ${
                              isCurrentVersion
                                ? 'border-emerald-500/50 bg-emerald-950/10'
                                : previewBackup?.id === bk.id
                                ? 'border-indigo-500 bg-indigo-950/20'
                                : 'border-neutral-800 hover:border-neutral-700'
                            } rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono transition`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 shrink-0">
                                <Clock size={15} />
                              </div>
                              <div className="truncate">
                                <div className="text-neutral-200 font-bold flex items-center gap-2">
                                  <span>{new Date(bk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                  <span className="text-[10px] font-normal text-neutral-500">
                                    {new Date(bk.timestamp).toLocaleDateString()}
                                  </span>
                                  {isCurrentVersion && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                  {bk.actionLabel}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewBackup(previewBackup?.id === bk.id ? null : bk)}
                                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                title="Preview snapshot data"
                              >
                                <Eye size={13} />
                                <span>{previewBackup?.id === bk.id ? 'Hide' : 'Preview'}</span>
                              </button>

                              {isCurrentVersion ? (
                                <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1">
                                  <Check size={13} />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isRestoringVersion}
                                  onClick={() => handleRestoreVersion(bk.id)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/30 disabled:opacity-50"
                                  title="Restore file to this version"
                                >
                                  <RotateCcw size={13} />
                                  <span>Restore</span>
                                </button>
                              )}

                              {confirmingDeleteBackupId === bk.id ? (
                                <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/60 rounded-lg p-1 animate-in fade-in zoom-in-95 duration-150 shrink-0">
                                  <span className="text-[10px] text-rose-300 font-bold px-1 whitespace-nowrap">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteBackup(bk.id);
                                      setConfirmingDeleteBackupId(null);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition shadow"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingDeleteBackupId(null)}
                                    className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] transition"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteBackupId(bk.id)}
                                  className="p-1.5 bg-neutral-900 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-300 border border-neutral-800 hover:border-rose-500/50 rounded-lg transition shrink-0"
                                  title="Delete this restore point"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {previewBackup && (
                    <div className="mt-3 bg-neutral-950 border border-indigo-500/50 rounded-xl p-3.5 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <Eye size={13} />
                          Previewing Version from {new Date(previewBackup.timestamp).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewBackup(null)}
                          className="text-neutral-500 hover:text-white p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <pre className="text-[10px] font-mono text-cyan-300 max-h-52 overflow-y-auto bg-black/60 p-3 rounded-lg border border-neutral-800">
                        {JSON.stringify(previewBackup.fileSnapshot, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
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
