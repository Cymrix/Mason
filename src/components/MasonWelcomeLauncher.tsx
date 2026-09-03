import React from 'react';
import { getContrastTextColor } from '../theme/appTheme';
import { 
  Plus, 
  FolderOpen, 
  Layers, 
  Sparkles, 
  Trash2, 
  Cpu, 
  Map, 
  TreePine, 
  Users, 
  Sliders, 
  Network,
  Cloud,
  HardDrive
} from 'lucide-react';
import { ProjectIndexItem } from '../utils/masonStorage';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { useAppTheme } from '../theme/ThemeContext';
import { getGoogleDriveToken } from '../utils/googleDriveStorage';
import { getOneDriveToken } from '../utils/oneDriveStorage';

interface MasonWelcomeLauncherProps {
  savedProjects: ProjectIndexItem[];
  onCreateNewProject: () => void;
  onLoadProjectFromFile: () => void;
  onOpenCloudSyncModal: (mode?: 'explore' | 'backups') => void;
  onSelectSavedProject: (id: string) => void;
  onDeleteSavedProject: (id: string, e: React.MouseEvent) => void;
}

export const MasonWelcomeLauncher: React.FC<MasonWelcomeLauncherProps> = ({
  savedProjects,
  onCreateNewProject,
  onLoadProjectFromFile,
  onOpenCloudSyncModal,
  onSelectSavedProject,
  onDeleteSavedProject
}) => {
  const { primaryDef, bgDef } = useAppTheme();
  const isGDriveConnected = Boolean(getGoogleDriveToken());
  const isOneDriveConnected = Boolean(getOneDriveToken());

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

      <div className="max-w-5xl w-full space-y-8 relative z-10">
        
        {/* Primary Action Buttons (Create, Load Project) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* 1. Create Project Card */}
          <button
            type="button"
            onClick={onCreateNewProject}
            className="group relative overflow-hidden p-6 rounded-3xl border text-left transition-all hover:shadow-2xl active:scale-[0.98] cursor-pointer flex flex-col justify-between"
            style={{
              backgroundColor: bgDef.cardHex,
              borderColor: `rgba(${primaryDef.rgb}, 0.35)`
            }}
          >
            <div className="space-y-4">
              <div 
                className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                  color: primaryDef.hex
                }}
              >
                <Plus size={26} />
              </div>

              <div className="space-y-1">
                <h2 className="text-base md:text-lg font-black text-white transition">
                  Create New Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Start a new 2D Metroidvania universe with starter maps, 7-layer parallax biomes, prefabs, and UI presets.
                </p>
              </div>
            </div>

            <div 
              className="flex items-center gap-2 text-xs font-mono font-bold pt-4"
              style={{ color: primaryDef.hex }}
            >
              <span>Configure & Start</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* 2. Load Project Card */}
          <button
            type="button"
            onClick={onLoadProjectFromFile}
            className="group relative overflow-hidden p-6 rounded-3xl border text-left transition-all hover:shadow-2xl active:scale-[0.98] cursor-pointer flex flex-col justify-between"
            style={{
              backgroundColor: bgDef.cardHex,
              borderColor: bgDef.borderHex
            }}
          >
            <div className="space-y-4">
              <div 
                className="w-12 h-12 rounded-2xl border flex items-center justify-center text-neutral-300 group-hover:scale-110 transition duration-300 shadow-lg"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                <FolderOpen size={26} className="text-amber-400" />
              </div>

              <div className="space-y-1">
                <h2 className="text-base md:text-lg font-black text-white group-hover:text-neutral-200 transition">
                  Load Project
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Open a <code className="font-mono text-amber-300">.mason</code> project bundle file from your local disk or connected Google Drive / OneDrive.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-bold pt-4">
              <span>Open Project File</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
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
                  className="p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between group shadow-lg hover:border-neutral-500"
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
                      <span>{new Date(p.updatedAt).toLocaleDateString()} {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSavedProject(p.id, e);
                      }}
                      className="p-2 rounded-xl text-neutral-500 hover:text-red-400 transition hover:bg-red-500/10 cursor-pointer"
                      style={{
                        backgroundColor: bgDef.hex,
                        borderColor: bgDef.borderHex
                      }}
                      title="Delete saved project"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div 
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 group-hover:scale-105"
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
