import React from 'react';
import { getContrastTextColor } from '../theme/appTheme';
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
  Cpu,
  Map,
  TreePine,
  Users,
  Sliders,
  Network
} from 'lucide-react';
import { ProjectIndexItem } from '../utils/masonStorage';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { MASON_FULL_VERSION, MASON_VERSION_DISPLAY } from '../version';
import { usePWA } from '../hooks/usePWA';
import { useAppTheme } from '../theme/ThemeContext';
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
  const { primaryDef, bgDef } = useAppTheme();

  return (
    <div 
      className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-12 select-none relative transition-colors duration-200"
      style={{ backgroundColor: bgDef.hex }}
    >
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: primaryDef.hex }}
      ></div>

      <div className="max-w-4xl w-full space-y-10 relative z-10">
        
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border"
            style={{
              backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`,
              borderColor: `rgba(${primaryDef.rgb}, 0.35)`,
              color: primaryDef.hex
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryDef.hex }}></span>
            <span>Mason World Authoring Studio {MASON_FULL_VERSION}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Mason Project Manager
          </h1>

          <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Modular 2D Metroidvania & Sidescroller world authoring system. Load independent HTML mini-apps for level editing, biomes, prefabs, and game flow.
          </p>

          {/* PWA Install Action (Only when not installed) */}
          {!isInstalled && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onOpenPWAInstallModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition shadow-lg shadow-indigo-950/50 group"
              >
                <DownloadCloud size={15} className="text-indigo-400 group-hover:scale-110 transition" />
                <span>Install Mason as Desktop / Mobile App (PWA)</span>
                <span className="text-[10px] bg-indigo-900/60 px-1.5 py-0.2 rounded font-mono text-indigo-200">{MASON_VERSION_DISPLAY}</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Buttons (Create & Load) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Project Card */}
          <button
            type="button"
            onClick={onCreateNewProject}
            className="group relative overflow-hidden p-6 md:p-8 rounded-3xl border text-left transition hover:shadow-2xl active:scale-[0.99]"
            style={{
              backgroundColor: bgDef.cardHex,
              borderColor: `rgba(${primaryDef.rgb}, 0.35)`
            }}
          >
            <div className="space-y-4">
              <div 
                className="w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                  color: primaryDef.hex
                }}
              >
                <Plus size={28} />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-white transition">
                  Create New Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Start a new 2D Metroidvania universe with starter maps, 7-layer parallax biomes, prefabs, and UI presets.
                </p>
              </div>

              <div 
                className="flex items-center gap-2 text-xs font-mono font-bold pt-2"
                style={{ color: primaryDef.hex }}
              >
                <span>Configure & Start</span>
                <span>→</span>
              </div>
            </div>
          </button>

          {/* Load Project Card */}
          <button
            type="button"
            onClick={onLoadProjectFromFile}
            className="group relative overflow-hidden p-6 md:p-8 rounded-3xl border text-left transition hover:shadow-2xl active:scale-[0.99]"
            style={{
              backgroundColor: bgDef.cardHex,
              borderColor: bgDef.borderHex
            }}
          >
            <div className="space-y-4">
              <div 
                className="w-14 h-14 rounded-2xl border flex items-center justify-center text-neutral-300 group-hover:scale-110 transition duration-300 shadow-lg"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                <FolderOpen size={28} />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-white group-hover:text-neutral-200 transition">
                  Load Existing Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Open a <code className="font-mono" style={{ color: primaryDef.hex }}>.mason.json</code> project bundle or select a saved project from local storage.
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
                  className="p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between group shadow-lg"
                  style={{
                    backgroundColor: bgDef.cardHex,
                    borderColor: bgDef.borderHex
                  }}
                >
                  <div className="space-y-1 pr-3 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-100 group-hover:text-white transition truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
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
                      className="p-2 rounded-xl text-neutral-500 hover:text-red-400 transition"
                      style={{
                        backgroundColor: bgDef.hex,
                        borderColor: bgDef.borderHex
                      }}
                      title="Delete saved project"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div 
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      style={{
                        backgroundColor: primaryDef.hex,
                        color: getContrastTextColor(primaryDef)
                      }}
                    >
                      <span>Open</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mason Modular Architecture Specs */}
        <div 
          className="p-6 rounded-3xl border space-y-4 shadow-xl"
          style={{
            backgroundColor: bgDef.cardHex,
            borderColor: bgDef.borderHex
          }}
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} style={{ color: primaryDef.hex }} />
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Mason Subfolder & Mini-App Architecture
            </h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {MASON_MODULES.map(m => {
              const renderWelcomeIcon = () => {
                switch (m.iconName) {
                  case 'Map': return <Map size={14} className="text-cyan-400" />;
                  case 'TreePine': return <TreePine size={14} className="text-emerald-400" />;
                  case 'Users': return <Users size={14} className="text-rose-400" />;
                  case 'Sliders': return <Sliders size={14} className="text-amber-400" />;
                  case 'Network': return <Network size={14} className="text-purple-400" />;
                  default: return <Map size={14} className="text-cyan-400" />;
                }
              };

              return (
                <div 
                  key={m.id} 
                  className="p-3 rounded-xl border space-y-1"
                  style={{
                    backgroundColor: bgDef.hex,
                    borderColor: bgDef.borderHex
                  }}
                >
                  <div className="flex items-center gap-2">
                    {renderWelcomeIcon()}
                    <span className="font-bold text-neutral-200">{m.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400">{m.subfolder}/</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
