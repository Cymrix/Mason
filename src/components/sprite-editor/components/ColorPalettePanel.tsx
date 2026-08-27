import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Shuffle,
  Eye,
  Sliders,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';
import { PalettePreset, DitherPatternType } from '../types';
import { DEFAULT_PALETTES, hexToRgb, rgbToHex } from '../utils/palettes';

interface ColorPalettePanelProps {
  primaryColor: string;
  secondaryColor: string;
  onChangePrimaryColor: (color: string) => void;
  onChangeSecondaryColor: (color: string) => void;
  onSwapColors: () => void;
  ditherPattern: DitherPatternType;
  onChangeDitherPattern: (pattern: DitherPatternType) => void;
}

export const ColorPalettePanel: React.FC<ColorPalettePanelProps> = ({
  primaryColor,
  secondaryColor,
  onChangePrimaryColor,
  onChangeSecondaryColor,
  onSwapColors,
  ditherPattern,
  onChangeDitherPattern
}) => {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('pico8');
  const [customColors, setCustomColors] = useState<string[]>([
    '#ffffff', '#000000', '#ff0055', '#00ffaa', '#0099ff', '#ffaa00'
  ]);
  const [recentColors, setRecentColors] = useState<string[]>([
    '#000000', '#ffffff', '#ff004d', '#29adff', '#00e436', '#ffec27'
  ]);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const currentPreset = DEFAULT_PALETTES.find(p => p.id === selectedPaletteId) || DEFAULT_PALETTES[0];
  const activeColors = selectedPaletteId === 'custom' ? customColors : currentPreset.colors;

  const handleSelectColor = (color: string, isSecondary: boolean = false) => {
    if (isSecondary) {
      onChangeSecondaryColor(color);
    } else {
      onChangePrimaryColor(color);
      // Track in recent
      setRecentColors(prev => {
        const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
        return [color, ...filtered].slice(0, 12);
      });
    }
  };

  const handleAddCustomColor = () => {
    if (!customColors.includes(primaryColor)) {
      setCustomColors(prev => [...prev, primaryColor]);
      setSelectedPaletteId('custom');
    }
  };

  const ditherOptions: Array<{ id: DitherPatternType; label: string }> = [
    { id: 'none', label: 'Solid / No Dither' },
    { id: 'checker50', label: '50% Checkerboard' },
    { id: 'bayer2', label: 'Bayer 2×2 (50%)' },
    { id: 'bayer4', label: 'Bayer 4×4 Fine' },
    { id: 'horizontal', label: 'Horizontal Scanlines' }
  ];

  return (
    <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Active Color Preview & Hex */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900/90">
        <div className="relative w-14 h-14 shrink-0">
          {/* Secondary Color Box */}
          <div
            id="secondary-color-swatch"
            onClick={() => handleSelectColor(secondaryColor, true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-lg border-2 border-neutral-900 shadow-md cursor-pointer transition hover:scale-105"
            style={{ backgroundColor: secondaryColor }}
            title={`Secondary Color (Right-Click): ${secondaryColor}`}
          />
          {/* Primary Color Box */}
          <div
            id="primary-color-swatch"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="absolute top-0 left-0 w-9 h-9 rounded-xl border-2 border-white/80 shadow-lg cursor-pointer transition hover:scale-105"
            style={{ backgroundColor: primaryColor }}
            title={`Primary Color (Left-Click): ${primaryColor} - Click to customize`}
          />
          {/* Swap Button */}
          <button
            type="button"
            id="swap-colors-btn"
            onClick={onSwapColors}
            title="Swap Primary and Secondary Colors (X)"
            className="absolute top-0 right-0 w-5 h-5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center justify-center border border-neutral-700 shadow"
          >
            ⇄
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Color (Hex)</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">{primaryColor.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              id="native-color-picker-input"
              value={primaryColor.length === 7 ? primaryColor : '#ffffff'}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              title="Open Color Wheel"
            />
            <button
              type="button"
              id="add-to-palette-btn"
              onClick={handleAddCustomColor}
              title="Add current color to Custom Palette"
              className="flex-1 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700/60 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            >
              <Plus size={12} className="text-emerald-400" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dithering Pattern Selector */}
      <div className="px-3 py-2 border-b border-neutral-800 flex flex-col gap-1.5 bg-neutral-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>Dither Texture</span>
          </span>
        </div>
        <select
          id="dither-pattern-select"
          value={ditherPattern}
          onChange={(e) => onChangeDitherPattern(e.target.value as DitherPatternType)}
          className="w-full bg-neutral-800 border border-neutral-700/80 rounded-lg text-xs font-semibold text-neutral-200 px-2 py-1 focus:outline-none focus:border-emerald-500"
        >
          {ditherOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Palette Selector Dropdown */}
      <div className="p-3 border-b border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1.5">
            <Palette size={12} className="text-emerald-400" />
            <span>Preset Palette</span>
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeColors.length} colors
          </span>
        </div>

        <select
          id="palette-preset-select"
          value={selectedPaletteId}
          onChange={(e) => setSelectedPaletteId(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700/80 rounded-lg text-xs font-semibold text-neutral-200 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          {DEFAULT_PALETTES.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
          <option value="custom">★ Custom User Palette</option>
        </select>

        {/* Swatch Color Grid */}
        <div className="grid grid-cols-6 gap-1.5 pt-1 max-h-48 overflow-y-auto pr-0.5">
          {activeColors.map((hex, idx) => {
            const isPrimary = primaryColor.toLowerCase() === hex.toLowerCase();
            const isSecondary = secondaryColor.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={`${hex}_${idx}`}
                type="button"
                id={`swatch-${idx}`}
                onClick={() => handleSelectColor(hex, false)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleSelectColor(hex, true);
                }}
                className={`h-7 rounded-md relative transition-transform hover:scale-110 flex items-center justify-center ${
                  isPrimary
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900 shadow-md z-10'
                    : isSecondary
                    ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-neutral-900'
                    : 'border border-black/40 hover:border-white/60'
                }`}
                style={{ backgroundColor: hex }}
                title={`Left-click: Primary, Right-click: Secondary (${hex})`}
              >
                {isPrimary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Colors Row */}
      <div className="p-3 flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold text-neutral-400">Recent Swatches</span>
        <div className="flex flex-wrap gap-1">
          {recentColors.map((hex, idx) => (
            <button
              key={`recent_${hex}_${idx}`}
              type="button"
              onClick={() => handleSelectColor(hex)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleSelectColor(hex, true);
              }}
              className="w-5 h-5 rounded-md border border-neutral-700/80 hover:scale-110 transition"
              style={{ backgroundColor: hex }}
              title={`Recent: ${hex}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
