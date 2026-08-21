import React, { useState } from 'react';
import { MasonProject } from '../engine/masonProjectSchema';
import { MASON_FULL_VERSION, MASON_VERSION_DISPLAY } from '../version';
import { usePWA } from '../hooks/usePWA';
import { 
  Folder, 
  FileCode, 
  Clock, 
  User, 
  Edit3, 
  Sparkles, 
  Layers, 
  Compass, 
  Download, 
  Settings,
  DownloadCloud
} from 'lucide-react';

interface ProjectDashboardProps {
  project: MasonProject;
  onUpdateProject: (updated: MasonProject) => void;
  onLaunchModule: (moduleId: string) => void;
  onOpenExplorer: () => void;
  onOpenModulesModal?: () => void;
  onExportBundle: () => void;
  onOpenPWAInstallModal?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onUpdateProject,
  onLaunchModule,
  onOpenExplorer,
  onOpenModulesModal,
  onExportBundle,
  onOpenPWAInstallModal
}) => {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [name, setName] = useState(project.name);
  const [author, setAuthor] = useState(project.author || 'Mason Architect');
  const [description, setDescription] = useState(project.description || '');

  const handleSaveMetadata = () => {
    onUpdateProject({
      ...project,
      name,
      author,
      description
    });
    setIsEditingMetadata(false);
  };

  const mapCount = project.fileSystem?.maps?.length || 0;
  const biomeCount = project.fileSystem?.biomes?.length || 0;
  const characterCount = project.fileSystem?.characters?.length || 0;
  const uiCount = project.fileSystem?.ui?.length || 0;
  const gameCount = project.fileSystem?.game?.length || 0;

  const totalFiles = mapCount + biomeCount + characterCount + uiCount + gameCount;
  const { isInstalled } = usePWA();

  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto p-6 md:p-8 space-y-6 select-none max-w-6xl mx-auto w-full">
      
      {/* Project Banner & Overview */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 md:p-8 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                Active Mason Project
              </span>
              <span className="text-xs font-mono text-cyan-400/80 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                {MASON_VERSION_DISPLAY}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-neutral-100 tracking-tight">
              {project.name}
            </h1>

            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {project.description || '2D Metroidvania project with modular level design, 7-layer parallax biomes, characters, and game flow architecture.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-500" />
                <span className="text-neutral-300">{project.author || 'Mason Architect'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-neutral-500" />
                <span>Updated: {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Folder size={13} className="text-neutral-500" />
                <span className="text-cyan-400 font-bold">{totalFiles} Project Files</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenModulesModal}
              className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>🧩 Open Modules Directory</span>
            </button>

            <button
              type="button"
              onClick={onOpenExplorer}
              className="px-5 py-2 rounded-2xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <span>📂 Virtual Files Hub</span>
            </button>

            {onOpenPWAInstallModal && !isInstalled && (
              <button
                type="button"
                onClick={onOpenPWAInstallModal}
                className="px-5 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <DownloadCloud size={14} className="text-cyan-400" />
                <span>Install Mason PWA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="px-5 py-1.5 rounded-xl text-neutral-400 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition"
            >
              <Edit3 size={12} />
              <span>{isEditingMetadata ? 'Close Settings' : 'Edit Project Details'}</span>
            </button>
          </div>
        </div>

        {/* Project Metadata Edit Form (Collapsible) */}
        {isEditingMetadata && (
          <div className="mt-6 pt-6 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Lead Author / Studio</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingMetadata(false)}
                className="px-4 py-1.5 rounded-xl text-neutral-400 hover:bg-neutral-800 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetadata}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Save Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subfolder Stats Overview Cards - Dynamically centered */}
      <div className="flex flex-wrap justify-center items-stretch gap-3.5 w-full mx-auto">
        {/* Maps */}
        <div 
          onClick={() => onLaunchModule('maps')}
          className="flex-1 min-w-[130px] max-w-[190px] p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-cyan-500/60 hover:bg-neutral-850 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🗺️</span>
            <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 px-1.5 py-0.5 rounded font-bold">.map</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black text-white group-hover:text-cyan-400 transition font-mono">{mapCount}</div>
            <div className="text-[11px] font-bold text-neutral-300 truncate">Maps</div>
          </div>
        </div>

        {/* Biomes */}
        <div 
          onClick={() => onLaunchModule('biomes')}
          className="flex-1 min-w-[130px] max-w-[190px] p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🌲</span>
            <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded font-bold">.biome</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black text-white group-hover:text-emerald-400 transition font-mono">{biomeCount}</div>
            <div className="text-[11px] font-bold text-neutral-300 truncate">Biomes</div>
          </div>
        </div>

        {/* Characters & Bespoke AI */}
        <div 
          onClick={() => onLaunchModule('characters')}
          className="flex-1 min-w-[130px] max-w-[190px] p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-rose-500/60 hover:bg-neutral-850 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🎭</span>
            <span className="text-[10px] font-mono bg-rose-950/60 text-rose-400 px-1.5 py-0.5 rounded font-bold">.character</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black text-white group-hover:text-rose-400 transition font-mono">{characterCount}</div>
            <div className="text-[11px] font-bold text-neutral-300 truncate">Characters & AI</div>
          </div>
        </div>

        {/* UI & HUD */}
        <div 
          onClick={() => onLaunchModule('ui')}
          className="flex-1 min-w-[130px] max-w-[190px] p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-850 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">💎</span>
            <span className="text-[10px] font-mono bg-amber-950/60 text-amber-400 px-1.5 py-0.5 rounded font-bold">.ui</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black text-white group-hover:text-amber-400 transition font-mono">{uiCount}</div>
            <div className="text-[11px] font-bold text-neutral-300 truncate">UI & HUD</div>
          </div>
        </div>

        {/* Game Structure */}
        <div 
          onClick={() => onLaunchModule('gamestructure')}
          className="flex-1 min-w-[130px] max-w-[190px] p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-purple-500/60 hover:bg-neutral-850 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🌐</span>
            <span className="text-[10px] font-mono bg-purple-950/60 text-purple-400 px-1.5 py-0.5 rounded font-bold">.gamestructure</span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black text-white group-hover:text-purple-400 transition font-mono">{gameCount}</div>
            <div className="text-[11px] font-bold text-neutral-300 truncate">Game Graph</div>
          </div>
        </div>
      </div>

    </div>
  );
};
