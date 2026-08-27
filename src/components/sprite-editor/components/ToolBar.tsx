import React from 'react';
import {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Minus,
  Square,
  Circle,
  Sparkles,
  BoxSelect,
  Hand,
  FlipVertical,
  FlipHorizontal,
  Crosshair,
  Check
} from 'lucide-react';
import {
  ToolType,
  BrushShape,
  SymmetryMode,
  DitherPatternType,
  BrushSettings
} from '../types';

interface ToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushSettings: BrushSettings;
  onChangeBrushSettings: (updater: (prev: BrushSettings) => BrushSettings) => void;
  showPixelGrid: boolean;
  onTogglePixelGrid: () => void;
  showTileGrid: boolean;
  onToggleTileGrid: () => void;
  onionSkinEnabled: boolean;
  onToggleOnionSkin: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  onSelectTool,
  brushSettings,
  onChangeBrushSettings,
  showPixelGrid,
  onTogglePixelGrid,
  showTileGrid,
  onToggleTileGrid,
  onionSkinEnabled,
  onToggleOnionSkin
}) => {
  const tools: Array<{
    id: ToolType;
    label: string;
    shortcut: string;
    icon: React.ReactNode;
  }> = [
    { id: 'pencil', label: 'Pencil (P/B)', shortcut: 'B', icon: <Pencil size={16} /> },
    { id: 'eraser', label: 'Eraser (E)', shortcut: 'E', icon: <Eraser size={16} /> },
    { id: 'fill', label: 'Paint Bucket (G)', shortcut: 'G', icon: <PaintBucket size={16} /> },
    { id: 'picker', label: 'Color Picker (I)', shortcut: 'I', icon: <Pipette size={16} /> },
    { id: 'line', label: 'Straight Line (L)', shortcut: 'L', icon: <Minus size={16} /> },
    { id: 'rectangle', label: 'Rectangle (U)', shortcut: 'U', icon: <Square size={16} /> },
    { id: 'ellipse', label: 'Ellipse (C)', shortcut: 'C', icon: <Circle size={16} /> },
    { id: 'spray', label: 'Palette Spray (S)', shortcut: 'S', icon: <Sparkles size={16} /> },
    { id: 'select', label: 'Marquee Select (M)', shortcut: 'M', icon: <BoxSelect size={16} /> },
    { id: 'pan', label: 'Hand / Pan (H)', shortcut: 'H', icon: <Hand size={16} /> }
  ];

  const brushSizes = [1, 2, 3, 4, 6, 8, 12, 16];

  const symmetryModes: Array<{ id: SymmetryMode; label: string; icon: React.ReactNode }> = [
    { id: 'none', label: 'No Symmetry', icon: <span className="text-[10px] font-bold">OFF</span> },
    { id: 'horizontal', label: 'Horizontal Mirror', icon: <FlipHorizontal size={14} /> },
    { id: 'vertical', label: 'Vertical Mirror', icon: <FlipVertical size={14} /> },
    { id: 'both', label: '4-Way Mirror', icon: <Crosshair size={14} /> }
  ];

  return (
    <div className="w-14 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-2.5 px-1.5 select-none gap-3 shrink-0 z-10 overflow-y-auto">
      {/* Primary Tool Buttons */}
      <div className="flex flex-col gap-1 w-full items-center">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              id={`tool-btn-${t.id}`}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 font-bold'
                  : 'bg-neutral-800/60 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700/40'
              }`}
            >
              {t.icon}
              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-40 font-mono">
                {t.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-neutral-800 shrink-0" />

      {/* Brush Size Selector */}
      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[9px] font-bold text-neutral-400 tracking-tight uppercase">Size</span>
        <div className="grid grid-cols-2 gap-1 w-full px-0.5">
          {brushSizes.slice(0, 6).map((sz) => {
            const isSelected = brushSettings.size === sz;
            return (
              <button
                key={sz}
                type="button"
                id={`brush-size-${sz}`}
                onClick={() => onChangeBrushSettings(prev => ({ ...prev, size: sz }))}
                title={`Brush Size ${sz}px`}
                className={`h-6 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/30'
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-8 h-px bg-neutral-800 shrink-0" />

      {/* Pixel Perfect Toggle */}
      <div className="flex flex-col items-center gap-1 w-full">
        <button
          type="button"
          id="toggle-pixel-perfect-btn"
          onClick={() => onChangeBrushSettings(prev => ({ ...prev, pixelPerfect: !prev.pixelPerfect }))}
          title="Pixel Perfect line mode (removes double corners)"
          className={`w-10 h-8 rounded-xl text-[9px] font-bold transition flex flex-col items-center justify-center ${
            brushSettings.pixelPerfect
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 border border-neutral-700/40'
          }`}
        >
          <span>P-P</span>
        </button>
      </div>

      {/* Symmetry Modes */}
      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[9px] font-bold text-neutral-400 tracking-tight uppercase">Mirror</span>
        <div className="flex flex-col gap-1 w-full items-center">
          {symmetryModes.map((sym) => {
            const isActive = brushSettings.symmetry === sym.id;
            return (
              <button
                key={sym.id}
                type="button"
                id={`sym-mode-${sym.id}`}
                onClick={() => onChangeBrushSettings(prev => ({ ...prev, symmetry: sym.id }))}
                title={sym.label}
                className={`w-9 h-7 rounded-lg flex items-center justify-center transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-750'
                }`}
              >
                {sym.icon}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-8 h-px bg-neutral-800 shrink-0" />

      {/* Viewport Grid & Overlay Toggles */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <button
          type="button"
          id="toggle-pixel-grid-btn"
          onClick={onTogglePixelGrid}
          title="Toggle 1px Pixel Grid"
          className={`w-9 h-7 rounded-lg text-[9px] font-bold transition flex items-center justify-center ${
            showPixelGrid
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-750'
          }`}
        >
          Grid
        </button>

        <button
          type="button"
          id="toggle-tile-grid-btn"
          onClick={onToggleTileGrid}
          title="Toggle Tile Bounds (16x16 / 32x32)"
          className={`w-9 h-7 rounded-lg text-[9px] font-bold transition flex items-center justify-center ${
            showTileGrid
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-750'
          }`}
        >
          Tile
        </button>

        <button
          type="button"
          id="toggle-onion-skin-btn"
          onClick={onToggleOnionSkin}
          title="Toggle Onion Skinning (Animation Ghosts)"
          className={`w-9 h-7 rounded-lg text-[9px] font-bold transition flex items-center justify-center ${
            onionSkinEnabled
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-750'
          }`}
        >
          Skin
        </button>
      </div>
    </div>
  );
};
