import React, { useState, useEffect } from 'react';
import { 
  MasonProject, 
  MasonModuleId,
  MapFile,
  BiomeFile,
  ArchetypeFile,
  UIThemeFile,
  GameStructureFile,
  createDefaultMapFile
} from '../engine/masonProjectSchema';
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
  ProjectIndexItem
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
import { ArchetypeEditor } from './ArchetypeEditor';
import { UIThemeModule } from './UIThemeModule';
import { GameStructureModule } from './GameStructureModule';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Paintbrush, 
  Eraser, 
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
  Plus
} from 'lucide-react';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { TileShape, TILE_SHAPE_DEFINITIONS } from '../engine/tileShape';
import { globalChunkCache } from '../engine/chunkCacheManager';
import { ToolType, ModeType, PaintCategory, RefinedMapData, RefinedCellState } from '../types';
import { MASON_VERSION_DISPLAY, MASON_FULL_VERSION } from '../version';
import { usePWA } from '../hooks/usePWA';
import { DownloadCloud, WifiOff } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

export const EditorLayout: React.FC = () => {
  // Master Mason Project State (null when no project is loaded)
  const [project, setProject] = useState<MasonProject | null>(() => getActiveMasonProject());
  
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

  // Saved projects index cache for launcher
  const [savedProjects, setSavedProjects] = useState<ProjectIndexItem[]>(() => listSavedProjects());

  // Modals state
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);
  const [isBiomeMacroModalOpen, setIsBiomeMacroModalOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Map Painting State (for maps module)
  const [mode, setMode] = useState<ModeType>('paint');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [paintCategory, setPaintCategory] = useState<PaintCategory>('tile_type');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ashen_basalt');
  const [selectedShape, setSelectedShape] = useState<TileShape>('full');
  const [selectedFullness, setSelectedFullness] = useState<number>(1.0);
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showDamageMasks, setShowDamageMasks] = useState<boolean>(true);

  const refreshSavedProjects = () => {
    setSavedProjects(listSavedProjects());
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync project update
  const handleUpdateProject = (updated: MasonProject | ((prev: MasonProject) => MasonProject)) => {
    if (!project) return;
    const newProject = typeof updated === 'function' ? updated(project) : updated;
    setProject(newProject);
    saveActiveMasonProject(newProject);
    refreshSavedProjects();
  };

  // Project lifecycle handlers
  const handleCreateNewProject = (name: string, description: string, author: string) => {
    const newProj = createNewProject(name, description, author);
    setProject(newProj);
    setActiveModuleId(null); // Show project info by default
    refreshSavedProjects();
    showToast(`Created new project: ${name}`, 'success');
  };

  const handleSelectSavedProject = (id: string) => {
    const loaded = loadSavedProjectById(id);
    if (loaded) {
      setProject(loaded);
      setActiveModuleId(null); // Show project info by default
      refreshSavedProjects();
      showToast(`Loaded project: ${loaded.name}`, 'success');
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

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (project) {
          saveActiveMasonProject(project);
          refreshSavedProjects();
          showToast(`Saved ${project.name} to local storage`, 'success');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  // Derived references for active project
  const currentMapFile = project ? (project.fileSystem.maps.find(m => m.fileName === project.activeFiles.mapFileName) || project.fileSystem.maps[0]) : null;
  const currentBiomeFile = project ? (project.fileSystem.biomes.find(b => b.fileName === project.activeFiles.biomeFileName) || project.fileSystem.biomes[0]) : null;
  const activeBiome: RefinedBiome | null = currentBiomeFile?.biomeData || project?.fileSystem.biomes[0]?.biomeData || null;
  const biomesList: RefinedBiome[] = project ? project.fileSystem.biomes.map(b => b.biomeData) : [];

  const currentMapData: RefinedMapData | null = currentMapFile ? {
    width: currentMapFile.width,
    height: currentMapFile.height,
    cells: currentMapFile.cells
  } : null;

  // Map tile editing handler
  const handleMapTileInteract = (x: number, y: number) => {
    if (!project || !currentMapFile || !activeBiome || mode !== 'paint') return;

    handleUpdateProject(p => {
      const updatedMaps = p.fileSystem.maps.map(m => {
        if (m.fileName === currentMapFile.fileName) {
          const newCells = m.cells.map(row => row.map(cell => ({ ...cell })));
          const minX = Math.max(0, x - Math.floor((brushSize - 1) / 2));
          const maxX = Math.min(m.width - 1, x + Math.ceil((brushSize - 1) / 2));
          const minY = Math.max(0, y - Math.floor((brushSize - 1) / 2));
          const maxY = Math.min(m.height - 1, y + Math.ceil((brushSize - 1) / 2));

          for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
              const target = newCells[cy][cx];
              target.biome_id = activeBiome.id;

              if (activeTool === 'eraser') {
                target.tile_type_id = '';
                target.environmental_detail_id = null;
                target.interactive_detail_id = null;
                target.wildlife_id = null;
                target.shape = 'full';
                target.fullness = 1.0;
                globalChunkCache.invalidateCell(cx, cy);
              } else {
                if (paintCategory === 'tile_type') {
                  target.tile_type_id = selectedAssetId;
                  target.current_health = 100;
                  target.damage_threshold_index = 0;
                  target.shape = selectedShape;
                  target.fullness = selectedFullness;
                  globalChunkCache.invalidateCell(cx, cy);
                } else if (paintCategory === 'environmental') {
                  target.environmental_detail_id = selectedAssetId || null;
                } else if (paintCategory === 'interactive') {
                  target.interactive_detail_id = selectedAssetId || null;
                } else if (paintCategory === 'wildlife') {
                  target.wildlife_id = selectedAssetId || null;
                }
              }
            }
          }

          return {
            ...m,
            updatedAt: new Date().toISOString(),
            cells: newCells
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

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden select-none">
      
      {/* Top Navbar: Hamburger Menu replaces the 2D-Metroidvania tag */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          
          {/* Hamburger Menu Navigation */}
          <HamburgerMenu
            project={project}
            onOpenModulesModal={() => setIsModulesModalOpen(true)}
            onOpenExplorerModal={() => setIsExplorerModalOpen(true)}
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
            onSelectModule={(modId) => setActiveModuleId(modId)}
            onOpenPWAInstallModal={() => setIsPWAInstallModalOpen(true)}
            activeModuleId={activeModuleId}
          />

          <div className="h-4 w-px bg-neutral-800"></div>

          {/* Project Title / Studio Brand & Version */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-neutral-100">Mason</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                {MASON_VERSION_DISPLAY}
              </span>
            </div>

            {project ? (
              <button
                type="button"
                onClick={() => setActiveModuleId(null)}
                className="text-xs font-mono text-cyan-300 hover:underline flex items-center gap-1.5 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800"
                title="Click to view Project Info"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="truncate max-w-[180px] sm:max-w-[240px]">{project.name}</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
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

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* PWA Install Action (Always accessible so users can install to desktop/phone anytime) */}
          <button
            type="button"
            onClick={async () => {
              if (hasNativePrompt) {
                const installed = await triggerNativeInstall();
                if (!installed) setIsPWAInstallModalOpen(true);
              } else {
                setIsPWAInstallModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition shadow-sm group"
            title="Install Mason Studio as Standalone App (PWA)"
          >
            <DownloadCloud size={14} className="text-cyan-400 group-hover:scale-110 transition" />
            <span className="hidden sm:inline">{isInstalled ? 'Mason App' : 'Install App'}</span>
          </button>

          {project && (
            <>
              {/* Modules Browser Button */}
              <button
                type="button"
                onClick={() => setIsModulesModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition shadow-sm"
                title="Browse & Launch Mini-Apps"
              >
                <span>🧩 Modules</span>
              </button>

              {/* 1px:1tile Studio Button */}
              <button
                type="button"
                onClick={() => setIsBiomeMacroModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <Compass size={14} />
                <span className="hidden sm:inline">1px:1tile Studio</span>
              </button>

              {/* Virtual Files Explorer Button */}
              <button
                type="button"
                onClick={() => setIsExplorerModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition shadow-sm"
                title="Virtual Files Explorer"
              >
                <FolderOpen size={14} className="text-amber-400" />
                <span className="hidden md:inline">Files</span>
              </button>

              {/* Save Project Button */}
              <button
                type="button"
                onClick={() => {
                  saveActiveMasonProject(project);
                  refreshSavedProjects();
                  showToast(`Saved ${project.name}`, 'success');
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-cyan-600/30"
              >
                <Save size={13} />
                <span>Save</span>
              </button>
            </>
          )}

          {!project && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
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
      <div className="flex-1 flex overflow-hidden relative">
        
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
            onExportBundle={handleExportBundle}
            onOpenPWAInstallModal={() => setIsPWAInstallModalOpen(true)}
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
                  files={project.fileSystem.maps.map(m => ({
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
                    const { project: updated } = createNewMapInProject(project, name);
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
                      const filtered = p.fileSystem.maps.filter(m => m.fileName !== fName);
                      return {
                        ...p,
                        activeFiles: { ...p.activeFiles, mapFileName: filtered[0]?.fileName || '' },
                        fileSystem: { ...p.fileSystem, maps: filtered }
                      };
                    });
                  }}
                  accentColor="cyan"
                />

                <div className="flex-1 flex overflow-hidden">
                  {/* Left Tool Rail */}
                  <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur flex flex-col items-center py-4 shrink-0 z-10 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTool('brush')}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'brush' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Paint Brush"
                    >
                      <Paintbrush size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool('eraser')}
                      className={`p-2.5 rounded-xl border transition ${
                        activeTool === 'eraser' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Eraser / Void"
                    >
                      <Eraser size={16} />
                    </button>

                    <div className="w-8 h-px bg-neutral-800 my-2" />

                    {/* Brush Size Picker */}
                    {[1, 2, 3].map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setBrushSize(sz)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition ${
                          brushSize === sz ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {sz}x
                      </button>
                    ))}
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
                      showGrid={true}
                      showDamageMasks={showDamageMasks}
                    />

                    {/* Canvas Status Badge */}
                    <div className="absolute bottom-4 left-4 pointer-events-none z-20">
                      <div className="bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-300 shadow-xl flex items-center gap-3">
                        <span className="font-mono text-cyan-400">{currentMapFile.fileName} ({currentMapData.width}×{currentMapData.height} Tiles @ 64px)</span>
                        <span className="text-neutral-600">•</span>
                        <span>Biome: <strong className="text-white">{activeBiome.name}</strong></span>
                      </div>
                    </div>
                  </main>

                  {/* Right Palette */}
                  <aside className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col shrink-0 z-10">
                    <div className="p-4 border-b border-neutral-800">
                      <h2 className="font-semibold text-sm text-neutral-200">Level Strata & Scatter</h2>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Author terrain, open air, and entities</p>
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
                              onClick={() => setPaintCategory(cat.id as PaintCategory)}
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
                          {/* Tile Shape & Slope Selector */}
                          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                                Shape & Slope Mode
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400 font-semibold truncate max-w-[140px]">
                                {TILE_SHAPE_DEFINITIONS[selectedShape]?.name || 'Solid Block'}
                              </span>
                            </div>

                            {/* Shape Grid Buttons */}
                            <div className="grid grid-cols-4 gap-1.5">
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

                            {/* Soft Dune Fullness Slider */}
                            <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-neutral-400">Soft Dune Fullness</span>
                                <span className="font-mono text-cyan-300 font-semibold">
                                  {Math.round(selectedFullness * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={selectedFullness}
                                onChange={(e) => setSelectedFullness(parseFloat(e.target.value) || 1.0)}
                                className="w-full accent-cyan-500 cursor-pointer h-1.5"
                              />
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

                          {activeBiome.tileTypes.map(t => {
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
                                    className="w-6 h-6 rounded border border-neutral-700 shadow-sm"
                                    style={{ backgroundColor: t.mapColor || t.baseMaterialA?.albedoColor || '#3f3f46' }}
                                  />
                                  <div>
                                    <div className="text-xs font-bold">{t.name}</div>
                                    <div className="text-[10px] text-neutral-500 font-mono">
                                      {t.category} • {t.health} HP
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
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
              />
            )}
          </>
        )}

      </div>

      {/* Modules Directory Modal */}
      <ModulesModal
        isOpen={isModulesModalOpen}
        onClose={() => setIsModulesModalOpen(false)}
        onSelectModule={(modId) => setActiveModuleId(modId)}
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
              else if (mod === 'archetypes') handleUpdateProject(p => ({ ...p, activeFiles: { ...p.activeFiles, archetypeFileName: file } }));
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
              const updatedMaps = p.fileSystem.maps.map(m => {
                if (m.fileName === currentMapFile.fileName) {
                  const newCells: RefinedCellState[][] = [];
                  for (let y = 0; y < matrix.height; y++) {
                    const row: RefinedCellState[] = [];
                    for (let x = 0; x < matrix.width; x++) {
                      const bId = matrix.grid[y][x];
                      const biomeObj = biomesList.find(b => b.id === bId) || biomesList[0];
                      const primaryTile = biomeObj.primaryTileTypeId || biomeObj.tileTypes[0]?.id || 'ashen_basalt';
                      
                      let isSolid = true;
                      if (layout === 'metroidvania_sidescroller') {
                        isSolid = y >= matrix.height - 4 || (y === Math.floor(matrix.height * 0.6) && (x < 10 || x > 20)) || (y === Math.floor(matrix.height * 0.35) && x >= 10 && x <= 22);
                      } else if (layout === 'blank_open_air') {
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

      {/* Toast Notification Alerts */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200'
              : toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/60 text-red-200'
              : 'bg-neutral-900/90 border-neutral-700 text-neutral-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={15} className="text-cyan-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle size={15} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && <HardDrive size={15} className="text-cyan-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};
