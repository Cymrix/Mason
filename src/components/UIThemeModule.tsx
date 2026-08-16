import React, { useState } from 'react';
import { 
  MasonProject, 
  UIThemeFile, 
  UIConfigData,
  DEFAULT_UI_THEMES
} from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Layout, 
  Heart, 
  Zap, 
  Activity, 
  Compass, 
  MessageSquare, 
  Swords, 
  Sparkles, 
  Eye, 
  Check, 
  Sliders, 
  Palette,
  Maximize2
} from 'lucide-react';

interface UIThemeModuleProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
}

export const UIThemeModule: React.FC<UIThemeModuleProps> = ({
  project,
  onUpdateProject
}) => {
  const activeFileName = project.activeFiles.uiFileName || project.fileSystem.ui?.[0]?.fileName;
  const currentUiFile = project.fileSystem.ui.find(u => u.fileName === activeFileName) || project.fileSystem.ui[0];

  const [activeTab, setActiveTab] = useState<'health_mana' | 'minimap' | 'dialogue' | 'boss_bars' | 'combat_text'>('health_mana');
  const [simHealth, setSimHealth] = useState<number>(75);
  const [simMana, setSimMana] = useState<number>(60);
  const [simStamina, setSimStamina] = useState<number>(85);
  const [simBossHealth, setSimBossHealth] = useState<number>(65);

  const ui = currentUiFile.uiConfig;

  const updateUI = (updater: (prev: UIConfigData) => UIConfigData) => {
    onUpdateProject(p => {
      const updated = p.fileSystem.ui.map(u => {
        if (u.fileName === currentUiFile.fileName) {
          return {
            ...u,
            updatedAt: new Date().toISOString(),
            uiConfig: updater(u.uiConfig)
          };
        }
        return u;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, ui: updated }
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      {/* Subfolder File Header */}
      <FileSubfolderHeader
        subfolderName="ui"
        extension=".ui"
        files={project.fileSystem.ui.map(u => ({
          id: u.id,
          name: u.name,
          fileName: u.fileName,
          updatedAt: u.updatedAt
        }))}
        activeFileName={currentUiFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ui`;
          const newU: UIThemeFile = {
            id: `ui_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uiConfig: {
              ...ui,
              id: `ui_${Date.now()}`,
              name,
              themeName: name
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: safeName },
            fileSystem: {
              ...p.fileSystem,
              ui: [...p.fileSystem.ui, newU]
            }
          }));
        }}
        onDuplicateFile={(fName) => {
          const target = project.fileSystem.ui.find(u => u.fileName === fName);
          if (!target) return;
          const dupeName = `${target.name} (Copy)`;
          const dupeFileName = `${target.fileName.replace('.ui', '')}_copy.ui`;
          const dupe: UIThemeFile = {
            ...target,
            id: `ui_${Date.now()}`,
            name: dupeName,
            fileName: dupeFileName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: dupeFileName },
            fileSystem: {
              ...p.fileSystem,
              ui: [...p.fileSystem.ui, dupe]
            }
          }));
        }}
        onSaveFile={() => {}}
        onExportFile={(fName) => {
          const target = project.fileSystem.ui.find(u => u.fileName === fName);
          if (target) {
            const jsonStr = JSON.stringify(target, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = target.fileName;
            a.click();
          }
        }}
        onDeleteFile={(fName) => {
          onUpdateProject(p => {
            const filtered = p.fileSystem.ui.filter(u => u.fileName !== fName);
            return {
              ...p,
              activeFiles: { ...p.activeFiles, uiFileName: filtered?.[0]?.fileName || '' },
              fileSystem: { ...p.fileSystem, ui: filtered }
            };
          });
        }}
        accentColor="emerald"
      />

      {/* Main UI Editor Canvas & Settings */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-neutral-800 bg-neutral-900/70 backdrop-blur p-3.5 flex flex-col gap-1 shrink-0">
          <div className="px-2 py-1 mb-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              HUD & Layout Components
            </span>
            <p className="text-xs text-neutral-300 font-semibold mt-0.5 truncate">
              {ui.themeName}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('health_mana')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'health_mana' 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Heart size={16} className={activeTab === 'health_mana' ? 'text-emerald-400' : 'text-neutral-500'} />
            <div>
              <span className="block">1. Health & Mana Gauges</span>
              <span className="text-[10px] font-normal text-neutral-500">Orbs, bars, and rune pips</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('minimap')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'minimap' 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Compass size={16} className={activeTab === 'minimap' ? 'text-emerald-400' : 'text-neutral-500'} />
            <div>
              <span className="block">2. Minimap Radar Frame</span>
              <span className="text-[10px] font-normal text-neutral-500">Shape, scale & scanner</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('dialogue')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'dialogue' 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <MessageSquare size={16} className={activeTab === 'dialogue' ? 'text-emerald-400' : 'text-neutral-500'} />
            <div>
              <span className="block">3. Dialogue Box</span>
              <span className="text-[10px] font-normal text-neutral-500">Portraits & Typewriter</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('boss_bars')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'boss_bars' 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Swords size={16} className={activeTab === 'boss_bars' ? 'text-emerald-400' : 'text-neutral-500'} />
            <div>
              <span className="block">4. Boss Health Overlay</span>
              <span className="text-[10px] font-normal text-neutral-500">Phases & Ornate styles</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('combat_text')}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition ${
              activeTab === 'combat_text' 
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'text-neutral-400 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'combat_text' ? 'text-emerald-400' : 'text-neutral-500'} />
            <div>
              <span className="block">5. Damage Numbers (FCT)</span>
              <span className="text-[10px] font-normal text-neutral-500">Modality color palette</span>
            </div>
          </button>
        </aside>

        {/* Center Live HUD Viewport & Controls */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          {/* Live In-Game HUD Simulation Viewport */}
          <div className="relative w-full h-80 rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950 shadow-2xl flex flex-col justify-between p-6 shrink-0">
            {/* Background Simulated Game Level */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/60 to-black pointer-events-none" />
            <div className="absolute bottom-10 left-0 right-0 h-12 bg-neutral-900 border-t-2 border-neutral-700/60 pointer-events-none" />
            {/* Mock Player */}
            <div className="absolute bottom-22 left-32 w-10 h-14 bg-cyan-600/40 border border-cyan-400 rounded-md flex items-center justify-center text-xs font-mono text-cyan-200 pointer-events-none">
              HERO
            </div>

            {/* TOP BAR HUD ELEMENTS */}
            <div className="relative z-20 flex items-start justify-between">
              
              {/* Health & Mana Gauges */}
              <div className="flex items-center gap-3">
                {ui.healthOrb.style === 'classic_orb' ? (
                  <div 
                    className="relative w-16 h-16 rounded-full border-2 border-amber-600/60 bg-black/80 flex items-center justify-center shadow-lg overflow-hidden"
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                      style={{ height: `${simHealth}%`, backgroundColor: ui.healthOrb.fillColor }}
                    />
                    <span className="relative z-10 font-bold text-xs text-white font-mono drop-shadow">
                      {simHealth} HP
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-black/60 p-2.5 rounded-xl border border-neutral-800 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-red-500" />
                      <div className="w-36 h-3.5 bg-neutral-900 rounded-full border border-white/20 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ width: `${simHealth}%`, backgroundColor: ui.healthOrb.fillColor }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white font-bold">{simHealth}/100</span>
                    </div>

                    {ui.manaGauge.enabled && (
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-blue-400" />
                        <div className="w-36 h-2.5 bg-neutral-900 rounded-full border border-white/20 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ width: `${simMana}%`, backgroundColor: ui.manaGauge.fillColor }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-blue-300 font-bold">{simMana}/100</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Boss Bar (if active) */}
              {ui.bossBar.enabled && (
                <div className="w-72 bg-black/70 p-2.5 rounded-xl border border-red-500/40 text-center space-y-1 backdrop-blur shadow-2xl">
                  <span className="text-[11px] font-black tracking-widest text-red-400 uppercase">
                    IGNIS ARCHON • PYRE LORD
                  </span>
                  <div className="w-full h-3 bg-neutral-950 rounded border border-white/20 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                      style={{ width: `${simBossHealth}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Minimap Frame */}
              {ui.minimap.enabled && (
                <div 
                  className={`bg-black/80 border-2 flex items-center justify-center relative overflow-hidden backdrop-blur shadow-xl ${
                    ui.minimap.shape === 'circle' ? 'rounded-full' : ui.minimap.shape === 'radar_diamond' ? 'rotate-45 rounded-lg' : 'rounded-xl'
                  }`}
                  style={{ 
                    width: `${ui.minimap.sizePx * 0.75}px`, 
                    height: `${ui.minimap.sizePx * 0.75}px`, 
                    borderColor: ui.minimap.borderColor 
                  }}
                >
                  <div className={`text-center ${ui.minimap.shape === 'radar_diamond' ? '-rotate-45' : ''}`}>
                    <Compass size={16} className="text-cyan-400 mx-auto" />
                    <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">SECTOR A</span>
                  </div>
                  {ui.minimap.radarScanEffect && (
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent animate-pulse pointer-events-none" />
                  )}
                </div>
              )}

            </div>

            {/* BOTTOM HUD / DIALOGUE BOX PREVIEW */}
            <div className="relative z-20">
              <div 
                className="p-3 rounded-xl border backdrop-blur-md flex items-center gap-3 shadow-2xl max-w-xl mx-auto"
                style={{ 
                  backgroundColor: ui.dialogueBox.backgroundColor, 
                  borderColor: ui.dialogueBox.accentBorderColor 
                }}
              >
                {ui.dialogueBox.showSpeakerPortrait && (
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-white/20 flex items-center justify-center text-lg shrink-0">
                    🧙‍♂️
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Elder Korvath
                  </span>
                  <p className="text-xs" style={{ color: ui.dialogueBox.textColor }}>
                    "The volcanic vents beyond the eastern gate require the Aether Wings to cross safely..."
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Configuration Inspector Panels */}
          <div className="flex-1 overflow-y-auto space-y-4">
            
            {activeTab === 'health_mana' && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-neutral-100">Health & Mana Gauge Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Health Gauge Style</label>
                    <select
                      value={ui.healthOrb.style}
                      onChange={(e) => updateUI(u => ({ ...u, healthOrb: { ...u.healthOrb, style: e.target.value as any } }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="classic_orb">Classic Gothic Health Orb</option>
                      <option value="horizontal_bar">Horizontal Metric Bar</option>
                      <option value="cyber_gauge">Cybernetic HUD Gauge</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Health Fill Color</label>
                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5">
                      <input
                        type="color"
                        value={ui.healthOrb.fillColor}
                        onChange={(e) => updateUI(u => ({ ...u, healthOrb: { ...u.healthOrb, fillColor: e.target.value } }))}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-neutral-300">{ui.healthOrb.fillColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Mana Gauge Active</label>
                    <label className="flex items-center gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ui.manaGauge.enabled}
                        onChange={(e) => updateUI(u => ({ ...u, manaGauge: { ...u.manaGauge, enabled: e.target.checked } }))}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-300 font-semibold">Enable Mana Gauge</span>
                    </label>
                  </div>
                </div>

                {/* Simulator Slider */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Live Simulator Health Value:</span>
                    <span className="font-mono text-emerald-400 font-bold">{simHealth}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simHealth}
                    onChange={(e) => setSimHealth(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'minimap' && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-neutral-100">Minimap Radar Parameters</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Minimap Frame Shape</label>
                    <select
                      value={ui.minimap.shape}
                      onChange={(e) => updateUI(u => ({ ...u, minimap: { ...u.minimap, shape: e.target.value as any } }))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="circle">Circular Lens</option>
                      <option value="square">Square HUD Window</option>
                      <option value="radar_diamond">Rotated Radar Diamond</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Border Tint</label>
                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5">
                      <input
                        type="color"
                        value={ui.minimap.borderColor}
                        onChange={(e) => updateUI(u => ({ ...u, minimap: { ...u.minimap, borderColor: e.target.value } }))}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-neutral-300">{ui.minimap.borderColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Radar Sweep Effect</label>
                    <label className="flex items-center gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ui.minimap.radarScanEffect}
                        onChange={(e) => updateUI(u => ({ ...u, minimap: { ...u.minimap, radarScanEffect: e.target.checked } }))}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-300 font-semibold">Pulse Radar Scanner</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'combat_text' && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-neutral-100">Floating Damage Numbers (Modality Color Scheme)</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ui.combatText.damageColors).map(([damageType, color]) => (
                    <div key={damageType} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block capitalize">{damageType}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateUI(u => ({
                              ...u,
                              combatText: {
                                ...u.combatText,
                                damageColors: {
                                  ...u.combatText.damageColors,
                                  [damageType]: val
                                }
                              }
                            }));
                          }}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono font-bold" style={{ color }}>94</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
