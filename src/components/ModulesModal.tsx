import React from 'react';
import { MASON_MODULES } from '../engine/modulesRegistry';
import { 
  X, 
  Play, 
  Folder, 
  Check, 
  Info,
  ChevronRight,
  Boxes,
  Map,
  TreePine,
  Users,
  Sliders,
  Network
} from 'lucide-react';

interface ModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
  activeModuleId: string | null;
}

export const ModulesModal: React.FC<ModulesModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  activeModuleId
}) => {
  if (!isOpen) return null;

  const getAccentBg = (color: string) => {
    switch (color) {
      case 'cyan': return 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400';
      case 'emerald': return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400';
      case 'blue': return 'bg-blue-950/60 border-blue-500/40 text-blue-400';
      case 'amber': return 'bg-amber-950/60 border-amber-500/40 text-amber-400';
      case 'purple': return 'bg-purple-950/60 border-purple-500/40 text-purple-400';
      case 'rose': return 'bg-rose-950/60 border-rose-500/40 text-rose-400';
      default: return 'bg-neutral-900 border-neutral-700 text-neutral-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Boxes size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Mason Modules Directory</h2>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                  {MASON_MODULES.length} Installed Modules
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Click any module below to immediately launch its workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modules Grid - No tabs or categories, directly showing all modules */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MASON_MODULES.map(mod => {
            const isActive = activeModuleId === mod.id;

            const renderModalModuleIcon = () => {
              switch (mod.iconName) {
                case 'Map':
                  return <Map size={22} />;
                case 'TreePine':
                  return <TreePine size={22} />;
                case 'Users':
                  return <Users size={22} />;
                case 'Sliders':
                  return <Sliders size={22} />;
                case 'Network':
                  return <Network size={22} />;
                default:
                  return <Map size={22} />;
              }
            };

            return (
              <div
                key={mod.id}
                onClick={() => {
                  onSelectModule(mod.id);
                  onClose();
                }}
                className={`p-4.5 rounded-2xl border bg-neutral-950/80 backdrop-blur flex flex-col justify-between transition-all cursor-pointer group hover:bg-neutral-900 active:scale-[0.98] ${
                  isActive 
                    ? 'border-cyan-500 ring-1 ring-cyan-500/40 bg-neutral-900/90 shadow-lg shadow-cyan-950/40' 
                    : 'border-neutral-800 hover:border-neutral-700 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-md group-hover:scale-105 transition shrink-0 ${getAccentBg(mod.accentColor)}`}>
                        {renderModalModuleIcon()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-100 group-hover:text-cyan-300 transition truncate">
                            {mod.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Folder size={10} className="text-neutral-500" />
                          <span className="truncate">{mod.subfolder}/</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                        {mod.associatedExtension}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1 pt-1">
                    {mod.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Check size={11} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 mt-3 border-t border-neutral-850 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono truncate">
                    {mod.entryHtml}
                  </span>

                  <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
                    <span>{isActive ? 'Open' : 'Launch'}</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="h-12 border-t border-neutral-800 px-6 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-cyan-400" />
            <span>Click any module tile to instantly jump to that module.</span>
          </div>
          <span className="font-mono text-[10px] text-neutral-500">Mason Studio Architecture</span>
        </div>

      </div>
    </div>
  );
};
