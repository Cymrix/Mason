import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Save, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Map as MapIcon, 
  TreePine, 
  Clock, 
  Layers, 
  Sparkles, 
  Search, 
  X, 
  AlertTriangle,
  HardDrive,
  FileUp,
  Image as ImageIcon,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { 
  ProjectData, 
  ProjectMetadata, 
  STARTER_TEMPLATES, 
  StarterTemplate,
  getAllSavedProjects, 
  loadProjectFromStorage, 
  saveProjectToStorage, 
  deleteProjectFromStorage, 
  duplicateProjectInStorage, 
  exportProjectAsJson, 
  importProjectFromFile,
  createStarterProject 
} from '../utils/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
  onSaveCurrentProject: (name?: string, description?: string) => void;
  hasUnsavedChanges: boolean;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onSaveCurrentProject,
  hasUnsavedChanges
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'new' | 'import_export'>('library');
  const [savedProjects, setSavedProjects] = useState<ProjectMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('mourne_steppes_outpost');
  const [customDimension, setCustomDimension] = useState<number>(24);

  // Save As Form State
  const [saveAsName, setSaveAsName] = useState(currentProject.name || 'My Mourne Level');
  const [saveAsDesc, setSaveAsDesc] = useState(currentProject.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Import State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProjectsList = () => {
    const list = getAllSavedProjects();
    setSavedProjects(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshProjectsList();
      setSaveAsName(currentProject.name || 'My Mourne Level');
      setSaveAsDesc(currentProject.description || '');
      setDeleteConfirmId(null);
      setImportError(null);
      setImportSuccess(null);
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleQuickSave = () => {
    setIsSaving(true);
    try {
      onSaveCurrentProject(saveAsName, saveAsDesc);
      refreshProjectsList();
      setSaveSuccessMsg('Project saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (e: any) {
      setImportError(e.message || 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSaved = (id: string) => {
    const loaded = loadProjectFromStorage(id);
    if (loaded) {
      onLoadProject(loaded);
      onClose();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProjectFromStorage(id);
    setDeleteConfirmId(null);
    refreshProjectsList();
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = duplicateProjectInStorage(id);
    if (copy) {
      refreshProjectsList();
    }
  };

  const handleExportSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = loadProjectFromStorage(id);
    if (proj) {
      exportProjectAsJson(proj);
    }
  };

  const handleCreateNew = () => {
    const newProj = createStarterProject(
      selectedTemplateId, 
      newProjectName.trim() || undefined,
      { width: customDimension, height: customDimension }
    );
    // Save to storage immediately
    saveProjectToStorage(newProj);
    onLoadProject(newProj);
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importProjectFromFile(file);
      saveProjectToStorage(imported);
      refreshProjectsList();
      setImportSuccess(`Successfully imported "${imported.name}"!`);
      setTimeout(() => {
        onLoadProject(imported);
        onClose();
      }, 1000);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import JSON project file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const filteredProjects = savedProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.activeBiomeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl h-[680px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-md">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Project Hub & Level Manifests</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  v2.0 PBR
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Save, load, duplicate, and export 64px dual-noise map projects and custom biomes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Close Hub"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Save Bar / Unsaved Banner */}
        <div className="px-6 py-2.5 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-neutral-400">Current Workspace:</span>
            <strong className="text-white truncate font-medium">{currentProject.name}</strong>
            {hasUnsavedChanges ? (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <AlertTriangle size={10} /> Unsaved Changes
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <Check size={10} /> Up to date
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                <CheckCircle2 size={13} /> {saveSuccessMsg}
              </span>
            )}
            <button
              onClick={handleQuickSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving...' : 'Save Current'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'library'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderOpen size={14} />
            <span>Saved Projects ({savedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'new'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus size={14} />
            <span>New Level / Starter Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('import_export')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'import_export'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileUp size={14} />
            <span>Import & Export JSON</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900/40">

          {/* TAB 1: SAVED PROJECTS LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects by name, biome, or description..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('new')}
                    className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus size={13} className="text-emerald-400" /> Create New
                  </button>
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 px-4 bg-neutral-950/40 border border-dashed border-neutral-800 rounded-2xl space-y-3">
                  <FolderOpen size={40} className="mx-auto text-neutral-600" />
                  <h3 className="text-sm font-bold text-neutral-300">
                    {searchQuery ? 'No matching projects found' : 'No saved projects in local library yet'}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'Save your current level with "Save Current" or start fresh from a starter template.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleQuickSave}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Save Current Project
                    </button>
                    <button
                      onClick={() => setActiveTab('new')}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition"
                    >
                      Explore Templates
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((proj) => {
                    const isCurrent = proj.id === currentProject.id;
                    const isConfirmingDelete = deleteConfirmId === proj.id;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleLoadSaved(proj.id)}
                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                            : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-neutral-100 truncate group-hover:text-emerald-300 transition-colors">
                                  {proj.name}
                                </h3>
                                {isCurrent && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                                  {proj.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Metadata Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 flex items-center gap-1">
                              <MapIcon size={10} className="text-cyan-400" />
                              {proj.mapWidth}×{proj.mapHeight} (64px)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 flex items-center gap-1">
                              <TreePine size={10} className="text-emerald-400" />
                              {proj.activeBiomeName}
                            </span>
                            {proj.totalCustomTextures !== undefined && proj.totalCustomTextures > 0 && (
                              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 flex items-center gap-1 text-purple-300">
                                <ImageIcon size={10} className="text-purple-400" />
                                {proj.totalCustomTextures} Custom Textures
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer & Action Buttons */}
                        <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(proj.updatedAt)}
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-red-950/80 border border-red-800 px-2 py-1 rounded-lg">
                                <span className="text-[10px] text-red-300">Delete?</span>
                                <button
                                  onClick={(e) => handleDelete(proj.id, e)}
                                  className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded font-bold"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="text-[10px] text-neutral-400 hover:text-white px-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => handleDuplicate(proj.id, e)}
                                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                                  title="Duplicate Project"
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleExportSaved(proj.id, e)}
                                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                                  title="Export JSON File"
                                >
                                  <Download size={13} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(proj.id);
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                                  title="Delete Project"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleLoadSaved(proj.id)}
                                  className="ml-1 px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition"
                                >
                                  Load
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEW PROJECT / STARTER TEMPLATES */}
          {activeTab === 'new' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-neutral-200">Select a Starter Level Template</h3>
                <p className="text-xs text-neutral-400">
                  Initialize a new level with pre-sculpted terrain, custom noise blends, and ambient wildlife.
                </p>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {STARTER_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;

                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        if (!newProjectName) {
                          setNewProjectName(tmpl.name);
                        }
                        setCustomDimension(tmpl.defaultWidth);
                      }}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-br ${tmpl.accentColor} ring-2 ring-emerald-500 shadow-xl`
                          : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{tmpl.icon}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-neutral-300">
                            {tmpl.badge}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{tmpl.name}</h4>
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>Default {tmpl.defaultWidth}×{tmpl.defaultHeight} Grid</span>
                        {isSelected && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check size={11} /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Project Customization Form */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4">
                <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" />
                  New Project Parameters
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Project / Level Name</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Ashen Fortress Outpost"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Grid Dimensions (Tiles)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[16, 24, 32, 48].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setCustomDimension(size)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition border ${
                            customDimension === size
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {size}×{size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCreateNew}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Create & Initialize Project</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT & EXPORT JSON */}
          {activeTab === 'import_export' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Import Section */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <Upload size={16} className="text-cyan-400" />
                    Import Project Manifest (.json)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Load exported 64px maps, custom materials, heightmaps, and biome definitions into your workspace.
                  </p>
                </div>

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDraggingFile
                      ? 'border-cyan-400 bg-cyan-950/20 text-cyan-200 scale-[1.01]'
                      : 'border-neutral-700 bg-neutral-950/60 hover:border-neutral-500 text-neutral-400'
                  }`}
                >
                  <FileUp size={36} className="mb-2 text-cyan-400" />
                  <p className="text-xs font-bold text-neutral-200">
                    Click to select or drag and drop a project <code className="text-cyan-400 font-mono">.json</code> file
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Supports full level manifests, biomes, dual-material settings, and custom textures
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {importError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>

              {/* Export Section */}
              <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <Download size={16} className="text-emerald-400" />
                    Export Current Project Manifest
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Download complete standalone JSON file containing map grid, 64px PBR blend parameters, and biome audio tags.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-neutral-400 font-mono">
                    <span>{currentProject.map.width}×{currentProject.map.height} Grid • {currentProject.biomes.length} Biomes</span>
                  </div>

                  <button
                    onClick={() => exportProjectAsJson(currentProject)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                  >
                    <Download size={14} />
                    <span>Download {currentProject.name.replace(/\s+/g, '_')}.json</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded font-mono text-[10px] text-neutral-300">Ctrl+S</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded font-mono text-[10px] text-neutral-300">Cmd+S</kbd> to quick-save</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
