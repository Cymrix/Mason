import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Layers, 
  Folder, 
  FileText, 
  Plus, 
  Upload, 
  Save, 
  Download, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  Info,
  Compass,
  Zap
} from 'lucide-react';
import { MasonProject } from '../engine/masonProjectSchema';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { MASON_FULL_VERSION, MASON_VERSION_DISPLAY } from '../version';
import { usePWA } from '../hooks/usePWA';
import { DownloadCloud, WifiOff } from 'lucide-react';

interface HamburgerMenuProps {
  project: MasonProject | null;
  onOpenModulesModal: () => void;
  onOpenExplorerModal: () => void;
  onShowProjectInfo: () => void;
  onNewProject: () => void;
  onLoadProject: () => void;
  onSaveProject: () => void;
  onExportBundle: () => void;
  onCloseProject: () => void;
  onSelectModule: (moduleId: string) => void;
  onOpenPWAInstallModal: () => void;
  activeModuleId: string | null;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  project,
  onOpenModulesModal,
  onOpenExplorerModal,
  onShowProjectInfo,
  onNewProject,
  onLoadProject,
  onSaveProject,
  onExportBundle,
  onCloseProject,
  onSelectModule,
  onOpenPWAInstallModal,
  activeModuleId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModuleSubmenu, setShowModuleSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isInstalled, isOffline } = usePWA();

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
              <div className="w-5 h-5 rounded bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300 font-black">
                M
              </div>
              <span className="text-xs font-bold text-neutral-200">Mason Navigation</span>
            </div>
            {project && (
              <span className="text-[10px] font-mono text-cyan-400 font-semibold truncate max-w-[120px]">
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
                  <span className="font-bold text-neutral-100 group-hover:text-cyan-300 transition">Modules Directory</span>
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
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30' 
                    : 'text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📄</span>
                  <div>
                    <span className="font-bold">Project Info & Dashboard</span>
                    <p className="text-[10px] text-neutral-400">Default project overview</p>
                  </div>
                </div>
                {activeModuleId === null && (
                  <span className="text-[9px] font-mono bg-cyan-900/60 text-cyan-300 px-1.5 py-0.5 rounded">Active</span>
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
          </div>

          <div className="h-px bg-neutral-800 my-1.5"></div>

          {/* Project Management Actions */}
          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNewProject();
              }}
              className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
            >
              <Plus size={14} className="text-emerald-400" />
              <span>Create New Project...</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLoadProject();
              }}
              className="w-full px-3 py-1.5 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition"
            >
              <Upload size={14} className="text-blue-400" />
              <span>Load Existing Project...</span>
            </button>

            {project && (
              <>
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

            {/* PWA App Install Action (Only when not installed) */}
            {!isInstalled && (
              <>
                <div className="h-px bg-neutral-800 my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPWAInstallModal();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <DownloadCloud size={15} className="text-cyan-400 group-hover:scale-110 transition" />
                    <span>Install Mason PWA...</span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400/70 uppercase">{MASON_VERSION_DISPLAY}</span>
                </button>
              </>
            )}
          </div>

          {/* Footer Version & Status */}
          <div className="px-4 py-2 border-t border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span>Mason {MASON_FULL_VERSION}</span>
            {isOffline ? (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <WifiOff size={11} /> Offline Ready
              </span>
            ) : (
              <span className="text-neutral-400">PWA Enabled</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
