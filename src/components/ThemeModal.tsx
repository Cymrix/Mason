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
  ShieldCheck,
  Paintbrush
} from 'lucide-react';
import { MasonBrandIcon } from './MasonBrandIcon';
import { 
  useAppTheme 
} from '../theme/ThemeContext';
import { 
  COLOR_DEFINITIONS, 
  COLOR_FAMILIES,
  HUE_GROUPS,
  HUE_ORDERED_COLOR_KEYS,
  BACKGROUND_TONES, 
  PRESET_APP_THEMES, 
  DEFAULT_CUSTOM_HEXES,
  getColorDef,
  getBackgroundToneDef,
  getThemeResolvedHexes,
  AccentColorKey, 
  BackgroundToneKey,
  ThemeCategory,
  analyzeThemeFamilies,
  getColorFamilyKey,
  getContrastTextColor
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
    setCustomHexColor,
    updateTheme,
    resetTheme 
  } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [presetFilter, setPresetFilter] = useState<'all' | ThemeCategory>('all');

  if (!isOpen) return null;

  const colorKeys = HUE_ORDERED_COLOR_KEYS;
  const toneKeys = Object.keys(BACKGROUND_TONES).filter(k => k !== 'custom') as BackgroundToneKey[];

  const filteredPresets = PRESET_APP_THEMES.filter(p => {
    if (presetFilter === 'all') return true;
    return p.category === presetFilter;
  });

  const customResolved = {
    ...DEFAULT_CUSTOM_HEXES,
    ...(theme.customHexes || {})
  };

  const customColor = getColorDef('custom', customResolved.primary);
  const customBg = getBackgroundToneDef('custom', customResolved.backgroundTone);

  const customSpritesDef = getColorDef('custom', customResolved.sprites);
  const customMapsDef = getColorDef('custom', customResolved.maps);
  const customBiomesDef = getColorDef('custom', customResolved.biomes);
  const customCharDef = getColorDef('custom', customResolved.prefabs);
  const customParticlesDef = getColorDef('custom', customResolved.particles);
  const customUiDef = getColorDef('custom', customResolved.ui);
  const customGameDef = getColorDef('custom', customResolved.gamestructure);

  const renderModuleColorRow = (
    moduleId: keyof typeof theme.moduleColors,
    title: string,
    subtitle: string,
    icon: React.ReactNode
  ) => {
    const modDef = getModuleColorDef(moduleId);
    const isCustomSelected = theme.moduleColors[moduleId] === 'custom';
    const customHex = theme.customHexes?.[moduleId] || DEFAULT_CUSTOM_HEXES[moduleId] || '#00f59b';

    return (
      <div className="pt-3 first:pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors"
            style={{ 
              backgroundColor: `rgba(${modDef.rgb}, 0.2)`,
              borderColor: modDef.hex,
              color: modDef.hex
            }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>{title}</span>
              {isCustomSelected && (
                <span 
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: `rgba(${modDef.rgb}, 0.2)`,
                    borderColor: `rgba(${modDef.rgb}, 0.4)`,
                    color: modDef.hex
                  }}
                >
                  Custom {customHex.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">{subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md shrink-0">
          {/* Custom Swatch for this module */}
          <div className="relative shrink-0 flex items-center">
            <label 
              className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center text-white cursor-pointer relative ${
                isCustomSelected 
                  ? 'ring-2 ring-white scale-110 shadow-lg' 
                  : 'opacity-80 hover:opacity-100 border-dashed border-neutral-500 hover:border-white'
              }`}
              style={{ 
                backgroundColor: customHex, 
                borderColor: isCustomSelected ? '#ffffff' : customHex 
              }}
              title={`Custom Swatch (${customHex}) - Click to pick any custom color`}
            >
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustomHexColor(moduleId, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {isCustomSelected ? (
                <Check size={12} className="drop-shadow" />
              ) : (
                <Paintbrush size={11} className="drop-shadow opacity-90" />
              )}
            </label>
          </div>

          <div className="w-px h-4 bg-neutral-800 shrink-0 mx-0.5" />

          {/* Standard chromatic swatches */}
          {colorKeys.map(k => {
            const cDef = COLOR_DEFINITIONS[k];
            const isSelected = theme.moduleColors[moduleId] === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setModuleColor(moduleId, k)}
                className={`w-6 h-6 rounded-lg border transition flex items-center justify-center text-white shrink-0 ${
                  isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: cDef.hex, borderColor: cDef.hex }}
                title={cDef.name}
              >
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
                {/* Custom Theme Card */}
                <div
                  onClick={() => {
                    updateTheme(prev => ({
                      ...prev,
                      isCustom: true,
                      primary: 'custom',
                      backgroundTone: 'custom',
                      moduleColors: {
                        sprites: 'custom',
                        maps: 'custom',
                        biomes: 'custom',
                        prefabs: 'custom',
                        particles: 'custom',
                        ui: 'custom',
                        gamestructure: 'custom'
                      },
                      name: 'Custom Theme Palette',
                      customHexes: prev.customHexes || DEFAULT_CUSTOM_HEXES
                    }));
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between gap-3 relative group ${
                    theme.isCustom
                      ? 'border-neutral-500 bg-neutral-850 ring-2 shadow-xl'
                      : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/60'
                  }`}
                  style={theme.isCustom ? { 
                    borderColor: customColor.hex, 
                    boxShadow: `0 0 0 2px rgba(${customColor.rgb}, 0.5)` 
                  } : {}}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: customColor.hex }}
                        />
                        <h3 className="font-bold text-sm text-neutral-100 group-hover:text-white transition flex items-center gap-1.5">
                          <span>Custom Theme Palette</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </h3>
                      </div>

                      {theme.isCustom && (
                        <span 
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border"
                          style={{
                            backgroundColor: `rgba(${customColor.rgb}, 0.2)`,
                            borderColor: `rgba(${customColor.rgb}, 0.4)`,
                            color: customColor.hex
                          }}
                        >
                          <Check size={11} />
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                      User-defined custom color palette with tailored accent highlights across all game engine modules.
                    </p>
                  </div>

                  {/* 7-Module Spectrum Strip */}
                  <div className="pt-2.5 border-t border-neutral-800/80 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">Palette Spectrum:</span>
                      <span className="text-neutral-500">{customBg.name}</span>
                    </div>

                    <div className="grid grid-cols-8 gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800/80 text-[9px] font-mono font-bold text-center">
                      {/* App Primary */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customColor.rgb}, 0.2)`,
                          borderColor: customColor.hex,
                          color: customColor.hex
                        }}
                        title={`Primary / App Header: ${customColor.name}`}
                      >
                        <span className="text-[8px] opacity-70">APP</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customColor.hex }} />
                      </div>

                      {/* Image Editor */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customSpritesDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customSpritesDef?.hex,
                          color: customSpritesDef?.hex
                        }}
                        title={`Image & Sprite Studio (.sprite): ${customSpritesDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">IMG</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customSpritesDef?.hex }} />
                      </div>

                      {/* Maps */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customMapsDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customMapsDef?.hex,
                          color: customMapsDef?.hex
                        }}
                        title={`Maps (.map): ${customMapsDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">MAP</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customMapsDef?.hex }} />
                      </div>

                      {/* Biomes */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customBiomesDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customBiomesDef?.hex,
                          color: customBiomesDef?.hex
                        }}
                        title={`Biomes (.biome): ${customBiomesDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">BIO</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customBiomesDef?.hex }} />
                      </div>

                      {/* Prefabs */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customCharDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customCharDef?.hex,
                          color: customCharDef?.hex
                        }}
                        title={`Prefabs & AI (.prefab): ${customCharDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">CHR</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customCharDef?.hex }} />
                      </div>

                      {/* Particles */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customParticlesDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customParticlesDef?.hex,
                          color: customParticlesDef?.hex
                        }}
                        title={`Particles (.particle): ${customParticlesDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">PAR</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customParticlesDef?.hex }} />
                      </div>

                      {/* UI */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customUiDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customUiDef?.hex,
                          color: customUiDef?.hex
                        }}
                        title={`UI & HUD (.ui): ${customUiDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">HUD</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customUiDef?.hex }} />
                      </div>

                      {/* Game Graph */}
                      <div 
                        className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                        style={{
                          backgroundColor: `rgba(${customGameDef?.rgb || '0,0,0'}, 0.2)`,
                          borderColor: customGameDef?.hex,
                          color: customGameDef?.hex
                        }}
                        title={`Game Graph (.gamestructure): ${customGameDef?.name}`}
                      >
                        <span className="text-[8px] opacity-70">STR</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customGameDef?.hex }} />
                      </div>
                    </div>
                  </div>
                </div>

              {filteredPresets.map(preset => {
                const isSelected = theme.id === preset.id && !theme.isCustom;
                const pColor = getColorDef(preset.primary, preset.customHexes?.primary);
                const pBg = getBackgroundToneDef(preset.backgroundTone, preset.customHexes?.backgroundTone);

                const spritesDef = getColorDef(preset.moduleColors.sprites, preset.customHexes?.sprites);
                const mapsDef = getColorDef(preset.moduleColors.maps, preset.customHexes?.maps);
                const biomesDef = getColorDef(preset.moduleColors.biomes, preset.customHexes?.biomes);
                const charDef = getColorDef(preset.moduleColors.prefabs, preset.customHexes?.prefabs);
                const particlesDef = getColorDef(preset.moduleColors.particles, preset.customHexes?.particles);
                const uiDef = getColorDef(preset.moduleColors.ui, preset.customHexes?.ui);
                const gameDef = getColorDef(preset.moduleColors.gamestructure, preset.customHexes?.gamestructure);

                const familyAnalysis = analyzeThemeFamilies(preset);

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

                    {/* 7-Module Spectrum Strip */}
                    <div className="pt-2.5 border-t border-neutral-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400">Palette Spectrum:</span>
                        <span className="text-neutral-500">{pBg.name}</span>
                      </div>

                      <div className="grid grid-cols-8 gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800/80 text-[9px] font-mono font-bold text-center">
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

                        {/* Image Editor */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${spritesDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: spritesDef?.hex,
                            color: spritesDef?.hex
                          }}
                          title={`Image & Sprite Studio (.sprite): ${spritesDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">IMG</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: spritesDef?.hex }} />
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

                        {/* Prefabs */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${charDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: charDef?.hex,
                            color: charDef?.hex
                          }}
                          title={`Prefabs & AI (.prefab): ${charDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">CHR</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: charDef?.hex }} />
                        </div>

                        {/* Particles */}
                        <div 
                          className="py-1 px-0.5 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: `rgba(${particlesDef?.rgb || '0,0,0'}, 0.2)`,
                            borderColor: particlesDef?.hex,
                            color: particlesDef?.hex
                          }}
                          title={`Particles (.particle): ${particlesDef?.name}`}
                        >
                          <span className="text-[8px] opacity-70">PAR</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: particlesDef?.hex }} />
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
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: primaryDef.hex }} 
                    />
                    Main App & Dashboard Accent
                    {theme.primary === 'custom' && (
                      <span 
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                          borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                          color: primaryDef.hex
                        }}
                      >
                        Custom {(theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary).toUpperCase()}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Primary theme color ordered linearly by chromatic hue, or configure your own custom hex swatch.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {/* Custom Swatch Card */}
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between gap-1.5 transition text-left relative ${
                      theme.primary === 'custom'
                        ? 'border-white/60 bg-neutral-800 ring-2'
                        : 'border-dashed border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-500'
                    }`}
                    style={theme.primary === 'custom' ? { 
                      borderColor: primaryDef.hex,
                      boxShadow: `0 0 0 2px ${primaryDef.hex}` 
                    } : {}}
                  >
                    <button
                      type="button"
                      onClick={() => setPrimaryColor('custom')}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      title={`Custom Accent Color (${theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary})`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center text-white relative border border-white/20"
                        style={{ backgroundColor: theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary }}
                      >
                        {theme.primary === 'custom' && <Check size={10} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-neutral-200 block truncate">
                          Custom
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 block truncate">
                          {(theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary).toUpperCase()}
                        </span>
                      </div>
                    </button>

                    <label className="cursor-pointer p-1 rounded-md bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white transition relative shrink-0" title="Pick custom color">
                      <Paintbrush size={11} />
                      <input
                        type="color"
                        value={theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary}
                        onChange={(e) => setCustomHexColor('primary', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {/* Standard chromatic swatches */}
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
                        <span className="text-xs font-semibold text-neutral-200 truncate" title={cDef.name}>
                          {cDef.name}
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
                    Configure custom swatches or chromatic presets for each mini-app module.
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-neutral-850">
                  {renderModuleColorRow(
                    'sprites',
                    'Image & Sprite Studio (.sprite)',
                    'Pixel art studio, spray brush & sprite frame editing',
                    <Paintbrush size={15} />
                  )}

                  {renderModuleColorRow(
                    'maps',
                    'Maps Module (.map)',
                    'Strata painting & level geometry',
                    <Map size={15} />
                  )}

                  {renderModuleColorRow(
                    'biomes',
                    'Biomes Module (.biome)',
                    'Parallax depth & dual-noise strata',
                    <TreePine size={15} />
                  )}

                  {renderModuleColorRow(
                    'prefabs',
                    'Prefab Creator & AI (.prefab)',
                    'Spritesheets, hitboxes & IFTTT AI rules',
                    <Users size={15} />
                  )}

                  {renderModuleColorRow(
                    'particles',
                    'Particles & VFX Module (.particle)',
                    'GPU physics particles, weather & spell FX',
                    <Sparkles size={15} />
                  )}

                  {renderModuleColorRow(
                    'ui',
                    'UI & HUD Module (.ui)',
                    'Gothic obsidian orbs, radar & gauges',
                    <Sliders size={15} />
                  )}

                  {renderModuleColorRow(
                    'gamestructure',
                    'Game Graph Module (.gamestructure)',
                    'Finite state machine & world game flow',
                    <Network size={15} />
                  )}
                </div>
              </div>

              {/* 3. Dark Backdrop Tone */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-md border border-neutral-700 shadow-inner" 
                      style={{ backgroundColor: bgDef.hex }} 
                    />
                    <span>App Background Tone</span>
                    {theme.backgroundTone === 'custom' && (
                      <span 
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                          borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                          color: primaryDef.hex
                        }}
                      >
                        Custom {(theme.customHexes?.backgroundTone || DEFAULT_CUSTOM_HEXES.backgroundTone).toUpperCase()}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Choose the ambient dark tone for the workspace canvas, project dashboard, and UI chrome, or pick a custom tone.
                  </p>
                </div>

                {/* Swatch Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                  {/* Custom Background Tone Card */}
                  <div
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 relative group ${
                      theme.backgroundTone === 'custom'
                        ? 'ring-2 shadow-lg border-white/60 bg-neutral-800'
                        : 'border-dashed border-neutral-700 bg-neutral-900/60 hover:border-neutral-500'
                    }`}
                    style={{ 
                      backgroundColor: theme.customHexes?.backgroundTone || DEFAULT_CUSTOM_HEXES.backgroundTone,
                      borderColor: theme.backgroundTone === 'custom' ? primaryDef.hex : undefined,
                      boxShadow: theme.backgroundTone === 'custom' ? `0 0 0 2px ${primaryDef.hex}` : undefined
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setBackgroundTone('custom')}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      title="Custom Dark Tone"
                    >
                      <div 
                        className="w-5 h-5 rounded-lg shrink-0 border border-neutral-600 flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: getBackgroundToneDef('custom', theme.customHexes?.backgroundTone).cardHex }}
                      >
                        {theme.backgroundTone === 'custom' && <Check size={11} style={{ color: primaryDef.hex }} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-100 truncate group-hover:text-white transition">
                          Custom Tone
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 truncate">
                          {(theme.customHexes?.backgroundTone || DEFAULT_CUSTOM_HEXES.backgroundTone).toUpperCase()}
                        </div>
                      </div>
                    </button>

                    <label className="cursor-pointer p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-300 hover:text-white transition relative shrink-0" title="Pick custom dark tone">
                      <Paintbrush size={11} />
                      <input
                        type="color"
                        value={theme.customHexes?.backgroundTone || DEFAULT_CUSTOM_HEXES.backgroundTone}
                        onChange={(e) => setCustomHexColor('backgroundTone', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {toneKeys.map(t => {
                    const bgOption = BACKGROUND_TONES[t];
                    const isSelected = theme.backgroundTone === t;

                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBackgroundTone(t)}
                        title={bgOption.name}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 relative group ${
                          isSelected
                            ? 'ring-2 shadow-lg'
                            : 'border-neutral-800 hover:border-neutral-650'
                        }`}
                        style={{ 
                          backgroundColor: bgOption.hex,
                          borderColor: isSelected ? primaryDef.hex : '#262626',
                          boxShadow: isSelected ? `0 0 0 2px ${primaryDef.hex}` : undefined
                        }}
                      >
                        <div 
                          className="w-5 h-5 rounded-lg shrink-0 border border-neutral-700 flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: bgOption.cardHex }}
                        >
                          {isSelected && <Check size={11} style={{ color: primaryDef.hex }} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-neutral-100 truncate group-hover:text-white transition">
                            {bgOption.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

          {/* 3. LIVE INTERACTIVE THEME PREVIEW */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Eye size={13} className={primaryDef.textClass} />
                Live Theme Preview
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Primary: {primaryDef.name} • Background: {bgDef.name}
              </span>
            </div>

            {/* Simulated mini Mason application window matching actual app workspace behavior */}
            <div 
              className="rounded-2xl border overflow-hidden transition-all duration-300 shadow-2xl"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: `rgba(${primaryDef.rgb}, 0.25)`
              }}
            >
              {/* Mini Window App Header / Bar */}
              <div 
                className="h-9 px-3 border-b flex items-center justify-between transition-colors duration-200"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.12)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.25)`
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-3 w-px bg-white/20 mx-1" />
                  <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                    <MasonBrandIcon size={14} />
                    <span>Mason Studio</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span 
                    className="px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                      borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                      color: primaryDef.hex
                    }}
                  >
                    {primaryDef.name}
                  </span>
                </div>
              </div>

              {/* Mini App Workspace Canvas (Matches true app background) */}
              <div 
                className="p-4 sm:p-5 relative overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: bgDef.hex }}
              >
                {/* Simulated inner project dashboard card */}
                <div 
                  className="p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 shadow-xl"
                  style={{
                    backgroundColor: bgDef.cardHex,
                    borderColor: bgDef.borderHex
                  }}
                >
                  {/* Dynamic Primary Accent Glow overlay */}
                  <div 
                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl pointer-events-none opacity-20"
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
                        <span className="text-[10px] font-mono text-neutral-400 bg-black/40 border border-neutral-700/50 px-1.5 py-0.5 rounded">
                          {bgDef.name} Canvas
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white">Citadel Metroidvania Core</h4>
                      <p className="text-xs text-neutral-400">Modular level geometry & 7-layer parallax</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg transition"
                        style={{
                          backgroundColor: primaryDef.hex,
                          color: getContrastTextColor(primaryDef),
                          boxShadow: `0 6px 14px -3px rgba(${primaryDef.rgb}, 0.4)`
                        }}
                      >
                        Open Editor
                      </button>

                      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-neutral-800">
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('sprites').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('sprites').hex,
                            color: getModuleColorDef('sprites').hex
                          }}
                          title="Image Editor"
                        >
                          <Paintbrush size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('maps').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('maps').hex,
                            color: getModuleColorDef('maps').hex
                          }}
                          title="Maps"
                        >
                          <Map size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('biomes').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('biomes').hex,
                            color: getModuleColorDef('biomes').hex
                          }}
                          title="Biomes"
                        >
                          <TreePine size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('prefabs').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('prefabs').hex,
                            color: getModuleColorDef('prefabs').hex
                          }}
                          title="Prefabs & AI"
                        >
                          <Users size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('particles').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('particles').hex,
                            color: getModuleColorDef('particles').hex
                          }}
                          title="Particles"
                        >
                          <Sparkles size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('ui').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('ui').hex,
                            color: getModuleColorDef('ui').hex
                          }}
                          title="UI & HUD"
                        >
                          <Sliders size={13} />
                        </div>
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: `rgba(${getModuleColorDef('gamestructure').rgb}, 0.2)`,
                            borderColor: getModuleColorDef('gamestructure').hex,
                            color: getModuleColorDef('gamestructure').hex
                          }}
                          title="Game Architecture"
                        >
                          <Network size={13} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

        {/* Footer */}
        <div className="h-14 border-t border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/90 shrink-0">
          <div className="text-xs text-neutral-400">
            Theme changes apply immediately and persist in your browser.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition"
            style={{
              backgroundColor: primaryDef.hex,
              color: getContrastTextColor(primaryDef)
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

