import React, { useState } from 'react';
import { MASON_MODULES, MasonModuleDefinition } from '../engine/modulesRegistry';
import { 
  X, 
  Play, 
  Folder, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Info,
  Code,
  Layers
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'World & Levels', 'Biomes & Environment', 'Actors & Combat', 'Interface & HUD', 'Game Architecture', 'Generative Tools'];

  const filteredModules = selectedCategory === 'All' 
    ? MASON_MODULES 
    : MASON_MODULES.filter(m => m.category === selectedCategory);

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

  const getLaunchBtnStyle = (color: string) => {
    switch (color) {
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30';
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30';
      case 'blue': return 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30';
      case 'purple': return 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30';
      case 'rose': return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30';
      default: return 'bg-cyan-600 hover:bg-cyan-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xl">
              🧩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Mason Modules Directory</h2>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                  {MASON_MODULES.length} Installed Modules
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Each module is an isolated HTML mini-app living in its own subfolder inside <code className="text-cyan-300 font-mono">modules/</code>
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

        {/* Category Bar */}
        <div className="px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat 
                  ? 'bg-neutral-800 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map(mod => {
            const isActive = activeModuleId === mod.id;
            return (
              <div
                key={mod.id}
                className={`p-5 rounded-2xl border bg-neutral-950/70 backdrop-blur flex flex-col justify-between transition hover:border-neutral-700 ${
                  isActive ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : 'border-neutral-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-md ${getAccentBg(mod.accentColor)}`}>
                        {mod.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-100">{mod.name}</h3>
                          <span className="text-[9px] font-mono bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                            v{mod.version}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Folder size={11} className="text-neutral-500" />
                          <span>{mod.subfolder}/</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-md">
                      {mod.associatedExtension}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {mod.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-1 pt-1">
                    {mod.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Entry: {mod.entryHtml}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectModule(mod.id);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${getLaunchBtnStyle(mod.accentColor)}`}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{isActive ? 'Active Module (Switch)' : 'Launch Module'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="h-12 border-t border-neutral-800 px-6 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-cyan-400" />
            <span>Modules communicate with Mason parent workspace through live postMessage bridge.</span>
          </div>
          <span className="font-mono text-[10px] text-neutral-500">Mason Architecture v2.4</span>
        </div>

      </div>
    </div>
  );
};
