import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Eye, 
  Layers, 
  Map, 
  TreePine, 
  Users, 
  Network,
  ShieldCheck
} from 'lucide-react';
import { 
  useAppTheme 
} from '../theme/ThemeContext';
import { 
  COLOR_DEFINITIONS, 
  BACKGROUND_TONES, 
  PRESET_APP_THEMES, 
  AccentColorKey, 
  BackgroundToneKey,
  ThemeCategory
} from '../theme/appTheme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    theme, 
    primaryDef, 
    bgDef, 
    getModuleColorDef,
    setPresetTheme, 
    setPrimaryColor, 
    setModuleColor, 
    setBackgroundTone, 
    resetTheme 
  } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [presetFilter, setPresetFilter] = useState<'all' | ThemeCategory>('all');

  if (!isOpen) return null;

  const colorKeys = Object.keys(COLOR_DEFINITIONS) as AccentColorKey[];
  const toneKeys = Object.keys(BACKGROUND_TONES) as BackgroundToneKey[];

  const filteredPresets = PRESET_APP_THEMES.filter(p => {
    if (presetFilter === 'all') return true;
    return p.category === presetFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg transition-all"
              style={{ 
                backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`, 
                borderColor: primaryDef.hex,
                color: primaryDef.hex
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">App Theme & Accent Colors</h2>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                    borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                    color: primaryDef.hex
                  }}
                >
                  {theme.name}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Customize colors for the Dashboard, main header, and individual Mason modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetTheme}
              className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition"
              title="Reset to default theme"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 border-b border-neutral-800/80 bg-neutral-950/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'presets'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'presets' ? primaryDef.textClass : ''} />
              <span>Preset Color Themes</span>
              <span className="text-[10px] font-mono bg-neutral-900 text-neutral-400 px-1.5 py-0.2 rounded">
                {PRESET_APP_THEMES.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Sliders size={14} className={activeTab === 'custom' ? primaryDef.textClass : ''} />
              <span>Custom Palette Mixer</span>
            </button>
          </div>

          {activeTab === 'presets' && (
            <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setPresetFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  presetFilter === 'all'
                    ? 'bg-neutral-800 text-white shadow-xs font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({PRESET_APP_THEMES.length})
              </button>
              <button
                type="button"
                onClick={() => setPresetFilter('standard')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  presetFilter === 'standard'
                    ? 'bg-neutral-800 text-white shadow-xs font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Standard Presets (7)
              </button>
              <button
                type="button"
                onClick={() => setPresetFilter('accessibility')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  presetFilter === 'accessibility'
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Color Blind Safe (4)</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: PRESET THEMES */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPresets.map(preset => {
                const isSelected = theme.id === preset.id && !theme.isCustom;
                const pColor = COLOR_DEFINITIONS[preset.primary] || COLOR_DEFINITIONS.indigo;
                const pBg = BACKGROUND_TONES[preset.backgroundTone] || BACKGROUND_TONES.void;

                const mapsDef = COLOR_DEFINITIONS[preset.moduleColors.maps];
                const biomesDef = COLOR_DEFINITIONS[preset.moduleColors.biomes];
                const charDef = COLOR_DEFINITIONS[preset.moduleColors.characters];
                const uiDef = COLOR_DEFINITIONS[preset.moduleColors.ui];
                const gameDef = COLOR_DEFINITIONS[preset.moduleColors.gamestructure];

                return (
                  <div
                    key={preset.id}
                    onClick={() => setPresetTheme(preset.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between gap-3 relative group ${
                      isSelected
                        ? 'border-neutral-500 bg-neutral-850 ring-2 shadow-xl'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                    style={isSelected ? { 
                      borderColor: pColor.hex, 
                      boxShadow: `0 0 0 2px rgba(${pColor.rgb}, 0.5)` 
                    } : {}}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3.5 h-3.5 rounded-full shadow-sm"
                            style={{ backgroundColor: pColor.hex }}
                          />
                          <h3 className="font-bold text-sm text-neutral-100 group-hover:text-white transition">
                            {preset.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {preset.accessibilityTag && (
                            <span className="text-[9px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck size={10} />
                              {preset.accessibilityTag}
                            </span>
                          )}

                          {isSelected && (
                            <span 
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border"
                              style={{
                                backgroundColor: `rgba(${pColor.rgb}, 0.2)`,
                                borderColor: `rgba(${pColor.rgb}, 0.4)`,
                                color: pColor.hex
                              }}
                            >
                              <Check size={11} />
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    {/* 6-Color Distinction Spectrum Strip */}
                    <div className="pt-2.5 border-t border-neutral-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-mono">Palette Distinction (6 Unique Hues):</span>
                        <span className="text-[10px] font-mono text-neutral-500">{pBg.name}</span>
                      </div>

                      <div className="grid grid-cols-6 gap-1 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-800/80 text-[9px] font-mono font-bold text-center">
                        {/* App Primary */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${pColor.rgb}, 0.2)`,
                            borderColor: pColor.hex,
                            color: pColor.hex
                          }}
                          title={`Primary / App Header: ${pColor.name}`}
                        >
                          <span className="text-[8px] opacity-70">APP</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pColor.hex }} />
                        </div>

                        {/* Maps */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${mapsDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: mapsDef?.hex,
                            color: mapsDef?.hex
                          }}
                          title={`Maps (.map): ${mapsDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">MAP</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mapsDef?.hex }} />
                        </div>

                        {/* Biomes */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${biomesDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: biomesDef?.hex,
                            color: biomesDef?.hex
                          }}
                          title={`Biomes (.biome): ${biomesDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">BIO</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: biomesDef?.hex }} />
                        </div>

                        {/* Characters */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${charDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: charDef?.hex,
                            color: charDef?.hex
                          }}
                          title={`Characters & AI (.character): ${charDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">CHR</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: charDef?.hex }} />
                        </div>

                        {/* UI */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${uiDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: uiDef?.hex,
                            color: uiDef?.hex
                          }}
                          title={`UI & HUD (.ui): ${uiDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">HUD</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: uiDef?.hex }} />
                        </div>

                        {/* Game Graph */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${gameDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: gameDef?.hex,
                            color: gameDef?.hex
                          }}
                          title={`Game Graph (.gamestructure): ${gameDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">GRA</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gameDef?.hex }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR MIXER */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              
              {/* 1. Main App Accent */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: primaryDef.hex }} 
                    />
                    Main App & Dashboard Accent
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Primary theme color for header highlights, project banners, action buttons, and active indicators.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {colorKeys.map(k => {
                    const cDef = COLOR_DEFINITIONS[k];
                    const isSelected = theme.primary === k;

                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPrimaryColor(k)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition text-left ${
                          isSelected
                            ? 'border-white/60 bg-neutral-800 ring-2'
                            : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700'
                        }`}
                        style={isSelected ? { 
                          borderColor: cDef.hex,
                          boxShadow: `0 0 0 2px ${cDef.hex}` 
                        } : {}}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center text-white"
                          style={{ backgroundColor: cDef.hex }}
                        >
                          {isSelected && <Check size={10} />}
                        </div>
                        <span className="text-xs font-semibold text-neutral-200 truncate">
                          {cDef.name.split(' ')[1] || cDef.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Module Accent Colors */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <Layers size={16} className={primaryDef.textClass} />
                    Individual Module Accent Colors
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure custom colors for each mini-app module across header icons, dashboard cards, and subfolder headers.
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-neutral-850">
                  
                  {/* Maps Module */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg border flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(${getModuleColorDef('maps').rgb}, 0.2)`,
                          borderColor: getModuleColorDef('maps').hex,
                          color: getModuleColorDef('maps').hex
                        }}
                      >
                        <Map size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">Maps Module (.map)</div>
                        <div className="text-[10px] text-neutral-400">Strata painting & level geometry</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
                      {colorKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setModuleColor('maps', k)}
                          className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                            theme.moduleColors.maps === k ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: COLOR_DEFINITIONS[k].hex, borderColor: COLOR_DEFINITIONS[k].hex }}
                          title={COLOR_DEFINITIONS[k].name}
                        >
                          {theme.moduleColors.maps === k && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biomes Module */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg border flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(${getModuleColorDef('biomes').rgb}, 0.2)`,
                          borderColor: getModuleColorDef('biomes').hex,
                          color: getModuleColorDef('biomes').hex
                        }}
                      >
                        <TreePine size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">Biomes Module (.biome)</div>
                        <div className="text-[10px] text-neutral-400">Parallax depth & dual-noise strata</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
                      {colorKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setModuleColor('biomes', k)}
                          className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                            theme.moduleColors.biomes === k ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: COLOR_DEFINITIONS[k].hex, borderColor: COLOR_DEFINITIONS[k].hex }}
                          title={COLOR_DEFINITIONS[k].name}
                        >
                          {theme.moduleColors.biomes === k && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Characters Module */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg border flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(${getModuleColorDef('characters').rgb}, 0.2)`,
                          borderColor: getModuleColorDef('characters').hex,
                          color: getModuleColorDef('characters').hex
                        }}
                      >
                        <Users size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">Character Creator & AI (.character)</div>
                        <div className="text-[10px] text-neutral-400">Spritesheets, hitboxes & IFTTT AI rules</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
                      {colorKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setModuleColor('characters', k)}
                          className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                            theme.moduleColors.characters === k ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: COLOR_DEFINITIONS[k].hex, borderColor: COLOR_DEFINITIONS[k].hex }}
                          title={COLOR_DEFINITIONS[k].name}
                        >
                          {theme.moduleColors.characters === k && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Module */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg border flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(${getModuleColorDef('ui').rgb}, 0.2)`,
                          borderColor: getModuleColorDef('ui').hex,
                          color: getModuleColorDef('ui').hex
                        }}
                      >
                        <Sliders size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">UI & HUD Module (.ui)</div>
                        <div className="text-[10px] text-neutral-400">Gothic obsidian orbs, radar & gauges</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
                      {colorKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setModuleColor('ui', k)}
                          className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                            theme.moduleColors.ui === k ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: COLOR_DEFINITIONS[k].hex, borderColor: COLOR_DEFINITIONS[k].hex }}
                          title={COLOR_DEFINITIONS[k].name}
                        >
                          {theme.moduleColors.ui === k && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game Structure Module */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg border flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(${getModuleColorDef('gamestructure').rgb}, 0.2)`,
                          borderColor: getModuleColorDef('gamestructure').hex,
                          color: getModuleColorDef('gamestructure').hex
                        }}
                      >
                        <Network size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">Game Graph Module (.gamestructure)</div>
                        <div className="text-[10px] text-neutral-400">Finite state machine & world game flow</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
                      {colorKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setModuleColor('gamestructure', k)}
                          className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                            theme.moduleColors.gamestructure === k ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: COLOR_DEFINITIONS[k].hex, borderColor: COLOR_DEFINITIONS[k].hex }}
                          title={COLOR_DEFINITIONS[k].name}
                        >
                          {theme.moduleColors.gamestructure === k && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. Dark Backdrop Tone */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">
                    App Background Tone
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select the foundational dark tone for the workspace canvas, dashboard backdrop, and cards.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {toneKeys.map(t => {
                    const bgOption = BACKGROUND_TONES[t];
                    const isSelected = theme.backgroundTone === t;

                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBackgroundTone(t)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-white/60 ring-2'
                            : 'border-neutral-800 hover:border-neutral-700'
                        }`}
                        style={{ 
                          backgroundColor: bgOption.hex,
                          borderColor: isSelected ? primaryDef.hex : undefined,
                          boxShadow: isSelected ? `0 0 0 2px ${primaryDef.hex}` : undefined
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{bgOption.name}</span>
                          {isSelected && <Check size={12} className={primaryDef.textClass} />}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">{bgOption.hex}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* 3. LIVE INTERACTIVE THEME PREVIEW */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Eye size={13} className={primaryDef.textClass} />
                Live Theme Preview
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Primary: {primaryDef.name} ({primaryDef.hex})
              </span>
            </div>

            {/* Simulated mini dashboard card */}
            <div 
              className="p-4 rounded-2xl border relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: `rgba(${primaryDef.rgb}, 0.3)`
              }}
            >
              {/* Glow overlay */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-25"
                style={{ backgroundColor: primaryDef.hex }}
              />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                        borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                        color: primaryDef.hex
                      }}
                    >
                      Active Mason Project
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">Citadel Metroidvania Core</h4>
                  <p className="text-xs text-neutral-400">Modular level geometry & 7-layer parallax</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition"
                    style={{
                      backgroundColor: primaryDef.hex,
                      boxShadow: `0 8px 16px -4px rgba(${primaryDef.rgb}, 0.4)`
                    }}
                  >
                    Open Directory
                  </button>

                  <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs"
                      style={{
                        backgroundColor: `rgba(${getModuleColorDef('maps').rgb}, 0.2)`,
                        borderColor: getModuleColorDef('maps').hex,
                        color: getModuleColorDef('maps').hex
                      }}
                      title="Maps"
                    >
                      <Map size={14} />
                    </div>
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs"
                      style={{
                        backgroundColor: `rgba(${getModuleColorDef('biomes').rgb}, 0.2)`,
                        borderColor: getModuleColorDef('biomes').hex,
                        color: getModuleColorDef('biomes').hex
                      }}
                      title="Biomes"
                    >
                      <TreePine size={14} />
                    </div>
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs"
                      style={{
                        backgroundColor: `rgba(${getModuleColorDef('characters').rgb}, 0.2)`,
                        borderColor: getModuleColorDef('characters').hex,
                        color: getModuleColorDef('characters').hex
                      }}
                      title="Characters & AI"
                    >
                      <Users size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="h-14 border-t border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/90 shrink-0">
          <div className="text-xs text-neutral-400">
            Theme changes apply immediately and persist in your browser.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition"
            style={{
              backgroundColor: primaryDef.hex
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

