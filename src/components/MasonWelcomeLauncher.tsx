import React from 'react';
import { 
  Plus, 
  FolderOpen, 
  Upload, 
  Layers, 
  Sparkles, 
  Compass, 
  Play, 
  Trash2, 
  FileText,
  CheckCircle2,
  Box,
  Cpu
} from 'lucide-react';
import { ProjectIndexItem } from '../utils/masonStorage';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { MASON_FULL_VERSION } from '../version';
import { usePWA } from '../hooks/usePWA';
import { DownloadCloud } from 'lucide-react';

interface MasonWelcomeLauncherProps {
  savedProjects: ProjectIndexItem[];
  onCreateNewProject: () => void;
  onLoadProjectFromFile: () => void;
  onSelectSavedProject: (id: string) => void;
  onDeleteSavedProject: (id: string, e: React.MouseEvent) => void;
  onOpenPWAInstallModal: () => void;
}

export const MasonWelcomeLauncher: React.FC<MasonWelcomeLauncherProps> = ({
  savedProjects,
  onCreateNewProject,
  onLoadProjectFromFile,
  onSelectSavedProject,
  onDeleteSavedProject,
  onOpenPWAInstallModal
}) => {
  const { isInstalled } = usePWA();

  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-12 select-none relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full space-y-10 relative z-10">
        
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Mason World Authoring Studio {MASON_FULL_VERSION}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Mason Project Manager
          </h1>

          <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Modular 2D Metroidvania & Sidescroller world authoring system. Load independent HTML mini-apps for level editing, biomes, archetypes, and game flow.
          </p>

          {/* PWA Install Action */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onOpenPWAInstallModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition shadow-lg shadow-cyan-950/50 group"
            >
              <DownloadCloud size={15} className="text-cyan-400 group-hover:scale-110 transition" />
              <span>{isInstalled ? 'Mason PWA App Mode Active' : 'Install Mason as Desktop / Mobile App (PWA)'}</span>
              <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.2 rounded font-mono text-cyan-200">v0.24</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons (Create & Load) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Project Card */}
          <button
            type="button"
            onClick={onCreateNewProject}
            className="group relative overflow-hidden p-6 md:p-8 rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-neutral-900 to-neutral-950 text-left transition hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-[0.99]"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition duration-300 shadow-lg">
                <Plus size={28} />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-white group-hover:text-cyan-300 transition">
                  Create New Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Start a new 2D Metroidvania universe with starter maps, 7-layer parallax biomes, archetype hero classes, and UI presets.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold pt-2">
                <span>Configure & Start</span>
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Load Project Card */}
          <button
            type="button"
            onClick={onLoadProjectFromFile}
            className="group relative overflow-hidden p-6 md:p-8 rounded-3xl border border-neutral-700 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-left transition hover:border-neutral-500 hover:shadow-2xl active:scale-[0.99]"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 group-hover:scale-110 group-hover:bg-neutral-200 group-hover:text-black transition duration-300 shadow-lg">
                <FolderOpen size={28} />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-white group-hover:text-neutral-200 transition">
                  Load Existing Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Open a <code className="text-cyan-300 font-mono">.mason.json</code> project bundle or select a saved project from local storage.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 font-bold pt-2">
                <span>Browse Files or Local Saves</span>
                <span>→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Saved Projects Section (if any exists) */}
        {savedProjects.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recent Projects on this Device
              </h3>
              <span className="text-[10px] font-mono text-neutral-500">
                {savedProjects.length} saved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedProjects.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectSavedProject(p.id)}
                  className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1 pr-3 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-100 group-hover:text-cyan-300 transition truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                      <span>{p.mapCount} maps</span>
                      <span>•</span>
                      <span>{p.biomeCount} biomes</span>
                      <span>•</span>
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => onDeleteSavedProject(p.id, e)}
                      className="p-2 rounded-xl text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition"
                      title="Delete saved project"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 group-hover:bg-cyan-600 group-hover:text-white text-xs font-bold transition flex items-center gap-1">
                      <span>Open</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mason Modular Architecture Specs */}
        <div className="p-6 rounded-3xl border border-neutral-800/80 bg-neutral-950/50 backdrop-blur space-y-4">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Mason Subfolder & Mini-App Architecture
            </h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {MASON_MODULES.map(m => (
              <div key={m.id} className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-850 space-y-1">
                <div className="flex items-center gap-2">
                  <span>{m.icon}</span>
                  <span className="font-bold text-neutral-200">{m.name}</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500">{m.subfolder}/</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
