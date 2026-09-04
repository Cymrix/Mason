import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Layers, 
  Folder, 
  FileText, 
  Save, 
  Copy,
  Clock,
  Download, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  Info,
  Compass,
  Zap,
  Palette,
  Cloud,
  User,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { MasonProject } from '../engine/masonProjectSchema';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { useAppTheme } from '../theme/ThemeContext';
import { MasonBrandIcon } from './MasonBrandIcon';
import { getActiveProfile } from '../utils/appProfileSystem';

interface HamburgerMenuProps {
  project: MasonProject | null;
  onOpenModulesModal: () => void;
  onOpenExplorerModal: () => void;
  onOpenThemeModal: () => void;
  onOpenAppProfileConfigModal?: () => void;
  onShowProjectInfo: () => void;
  onSaveProject: () => void;
  onSaveAs: () => void;
  onManageBackups: () => void;
  onExportBundle: () => void;
  onCloseProject: () => void;
  onSelectModule: (moduleId: string) => void;
  activeModuleId: string | null;
  onRefreshFromLinked?: () => void;
  isRefreshingLinked?: boolean;
  isOutOfSync?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  project,
  onOpenModulesModal,
  onOpenExplorerModal,
  onOpenThemeModal,
  onOpenAppProfileConfigModal,
  onShowProjectInfo,
  onSaveProject,
  onSaveAs,
  onManageBackups,
  onExportBundle,
  onCloseProject,
  onSelectModule,
  activeModuleId,
  onRefreshFromLinked,
  isRefreshingLinked = false,
  isOutOfSync = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModuleSubmenu, setShowModuleSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, primaryDef } = useAppTheme();
  const activeProf = getActiveProfile();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowModuleSubmenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative select-none" ref={menuRef}>
      {/* Hamburger Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center p-2 rounded-xl border transition ${
          isOpen
            ? 'bg-neutral-800 border-neutral-600 text-white shadow-lg'
            : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
        }`}
        title="Mason Main Menu"
        aria-label="Open Mason Main Menu"
      >
        <Menu size={18} className="text-neutral-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl backdrop-blur-xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="px-4 py-2 border-b border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-950/90 border border-sky-500/50 flex items-center justify-center shrink-0 shadow-xs p-0.5">
                <MasonBrandIcon size={14} className="drop-shadow" />
              </div>
              <span className="text-xs font-bold text-neutral-200">Mason Navigation</span>
            </div>
            {project && (
              <span 
                className="text-[10px] font-mono font-semibold truncate max-w-[120px]"
                style={{ color: primaryDef.hex }}
              >
                {project.name}
              </span>
            )}
          </div>

          {/* Core Navigation Items */}
          <div className="p-1 space-y-0.5">
            {/* Modules Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenModulesModal();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🧩</span>
                <div>
                  <span className="font-bold text-neutral-100 group-hover:text-white transition">Modules Directory</span>
                  <p className="text-[10px] text-neutral-400">Browse & launch mini-apps</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-neutral-500 group-hover:text-neutral-300" />
            </button>

            {/* Project Info / Dashboard */}
            {project && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onShowProjectInfo();
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between group transition ${
                  activeModuleId === null 
                    ? 'border' 
                    : 'text-neutral-200 hover:bg-neutral-800'
                }`}
                style={
                  activeModuleId === null
                    ? {
                        backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`,
                        borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                        color: primaryDef.hex
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📄</span>
                  <div>
                    <span className="font-bold">Project Info & Dashboard</span>
                    <p className="text-[10px] text-neutral-400">Default project overview</p>
                  </div>
                </div>
                {activeModuleId === null && (
                  <span 
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: `rgba(${primaryDef.rgb}, 0.3)`,
                      color: primaryDef.hex
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            )}

            {/* Virtual File Explorer */}
            {project && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenExplorerModal();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📂</span>
                  <div>
                    <span className="font-bold text-neutral-100 group-hover:text-amber-300 transition">Virtual Files Explorer</span>
                    <p className="text-[10px] text-neutral-400">Subfolder management (.map, .biome, etc.)</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-neutral-300" />
              </button>
            )}

            {/* App Theme Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenThemeModal();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs shadow-sm border"
                  style={{
                    backgroundColor: `rgba(${primaryDef.rgb}, 0.25)`,
                    borderColor: primaryDef.hex,
                    color: primaryDef.hex
                  }}
                >
                  <Palette size={12} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-100 group-hover:text-white transition">App Theme & Colors</span>
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: primaryDef.hex }} 
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate max-w-[170px]">{theme.name}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-neutral-500 group-hover:text-neutral-300" />
            </button>

            {/* User Profiles & App Config Option */}
            {onOpenAppProfileConfigModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAppProfileConfigModal();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-neutral-200 hover:bg-neutral-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs shadow-sm">
                    <User size={12} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-100 group-hover:text-amber-200 transition">User Profiles & Config</span>
                      <span className="text-xs">{activeProf.avatar}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate max-w-[170px]">Profile: {activeProf.name}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-neutral-300" />
              </button>
            )}
          </div>

          <div className="h-px bg-neutral-800 my-1.5"></div>

          {/* Project Management Actions */}
          <div className="p-1 space-y-0.5">
            {project && (
              <>
                {onRefreshFromLinked && project.storageLocation && project.storageLocation.type !== 'local_idb' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onRefreshFromLinked();
                    }}
                    disabled={isRefreshingLinked}
                    className={`w-full px-3 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                      isOutOfSync
                        ? "bg-amber-950/80 hover:bg-amber-900 border border-amber-500/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        : "text-neutral-200 hover:text-white hover:bg-neutral-800"
                    } ${isRefreshingLinked ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <RefreshCw size={14} className={`${isRefreshingLinked ? "animate-spin text-cyan-400" : isOutOfSync ? "text-amber-400" : "text-cyan-400"}`} />
                      <div>
                        <span>{isRefreshingLinked ? "Pulling Updates..." : "Refresh from Linked Storage"}</span>
                        <p className="text-[10px] text-neutral-400 font-normal truncate max-w-[170px]">
                          {project.storageLocation.displayName || project.storageLocation.targetFolderName || 'Linked Folder'}
                        </p>
                      </div>
                    </div>
                    {isOutOfSync && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold">
                        Newer
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSaveProject();
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
                >
                  <Save size={14} className="text-amber-400" />
                  <span>Save Active Project</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSaveAs();
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
                >
                  <Copy size={14} className="text-emerald-400" />
                  <span>Save As...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onManageBackups();
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
                >
                  <Clock size={14} className="text-sky-400" />
                  <span>Manage Backups...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onExportBundle();
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
                >
                  <Download size={14} className="text-purple-400" />
                  <span>Export Project Bundle (.mason.json)</span>
                </button>

                <div className="h-px bg-neutral-800 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCloseProject();
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2.5 transition"
                >
                  <LogOut size={14} className="text-red-400" />
                  <span>Close Project (Unload)</span>
                </button>
              </>
            )}

            {!project && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onManageBackups();
                }}
                className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
              >
                <Clock size={14} className="text-sky-400" />
                <span>Manage Backups...</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
