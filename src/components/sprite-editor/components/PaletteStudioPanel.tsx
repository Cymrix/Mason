import React from 'react';
import { PaletteGroup, PaletteColor, GradientRamp } from '../types';
import { hexToHsl, hslToHex } from '../utils/palettes';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Check,
  Palette,
  Shuffle,
  Eye,
  Settings2
} from 'lucide-react';

interface PaletteStudioPanelProps {
  fgColor: string;
  onChangeFgColor: (hex: string) => void;
  paletteGroups: PaletteGroup[];
  onUpdatePaletteGroups: (updater: (prev: PaletteGroup[]) => PaletteGroup[]) => void;
  selectedColorHexes: Set<string>;
  onToggleColorSelection: (hex: string, isMulti: boolean) => void;
  onClearColorSelection: () => void;
  onSelectAllGroupColors: (group: PaletteGroup) => void;
  gradients: GradientRamp[];
  selectedGradientId: string | null;
  onSelectGradient: (id: string | null) => void;
  onAddGradient: (name: string, stops: string[]) => void;
  sourceKind: 'palette' | 'gradient';
  onChangeSourceKind: (kind: 'palette' | 'gradient') => void;
}

export const PaletteStudioPanel: React.FC<PaletteStudioPanelProps> = ({
  fgColor,
  onChangeFgColor,
  paletteGroups,
  onUpdatePaletteGroups,
  selectedColorHexes,
  onToggleColorSelection,
  onClearColorSelection,
  onSelectAllGroupColors,
  gradients,
  selectedGradientId,
  onSelectGradient,
  onAddGradient,
  sourceKind,
  onChangeSourceKind
}) => {
  const [activeTab, setActiveTab] = React.useState<'palettes' | 'gradients'>('palettes');
  const [editingHex, setEditingHex] = React.useState(fgColor);

  const mainGroup = paletteGroups.find(g => g.isMain) || paletteGroups[0];

  const handleCreateNewGroup = () => {
    const name = prompt('New Palette Group Name:', `Group ${paletteGroups.length + 1}`);
    if (!name) return;

    onUpdatePaletteGroups(prev => [
      ...prev,
      {
        id: Date.now(),
        name,
        isMain: false,
        colorRefs: [],
        collapsed: false,
        columns: 9
      }
    ]);
  };

  const handleAddColorToMain = (newHex: string) => {
    onUpdatePaletteGroups(prev => {
      return prev.map(g => {
        if (!g.isMain) return g;
        const nextId = Math.max(1, ...(g.colors || []).map(c => c.id)) + 1;
        return {
          ...g,
          colors: [...(g.colors || []), { id: nextId, hex: newHex }]
        };
      });
    });
  };

  const hsl = hexToHsl(fgColor);

  return (
    <div className="w-72 bg-[#18191e] border-l border-[#262833] flex flex-col h-full overflow-hidden text-neutral-200 text-xs select-none">
      {/* Top Mode Tabs: Palette Colors vs Gradient Ramps */}
      <div className="flex border-b border-[#262833] bg-[#14151a]">
        <button
          onClick={() => {
            setActiveTab('palettes');
            onChangeSourceKind('palette');
          }}
          className={`flex-1 py-2.5 text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'palettes'
              ? 'bg-[#18191e] text-amber-300 border-b-2 border-amber-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Palette Swatches</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('gradients');
            onChangeSourceKind('gradient');
          }}
          className={`flex-1 py-2.5 text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'gradients'
              ? 'bg-[#18191e] text-amber-300 border-b-2 border-amber-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gradient Ramps</span>
        </button>
      </div>

      {/* Active Color Preview & HSL Tuner Card */}
      <div className="p-3 border-b border-[#262833] bg-[#1b1c23] space-y-2.5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md border-2 border-white/30 shadow-md flex-shrink-0"
            style={{ backgroundColor: fgColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">Active Foreground</span>
              <span className="text-[10px] font-mono text-amber-300 uppercase">{fgColor}</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              <input
                type="text"
                value={editingHex}
                onChange={e => {
                  setEditingHex(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    onChangeFgColor(e.target.value);
                  }
                }}
                className="w-20 bg-[#121316] border border-[#2d2f3d] rounded px-1.5 py-0.5 font-mono text-[11px] text-neutral-200"
              />
              <button
                onClick={() => handleAddColorToMain(fgColor)}
                className="flex-1 bg-[#252733] hover:bg-[#303342] text-neutral-200 rounded px-2 py-0.5 text-[10px] font-medium flex items-center justify-center gap-1 border border-neutral-700"
                title="Add current color to palette"
              >
                <Plus className="w-3 h-3" />
                <span>Add to Palette</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Swatches Spray Counter */}
        {selectedColorHexes.size > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1 text-[11px] text-amber-300">
            <span>
              <strong>{selectedColorHexes.size}</strong> colors selected for spray
            </span>
            <button
              onClick={onClearColorSelection}
              className="hover:underline text-[10px] text-amber-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'palettes' ? (
          <>
            {/* Palette Groups List */}
            {paletteGroups.map(group => {
              const swatches: { id: number; hex: string }[] = group.isMain
                ? group.colors || []
                : (group.colorRefs || [])
                    .map(id => mainGroup?.colors?.find(c => c.id === id))
                    .filter(Boolean) as { id: number; hex: string }[];

              return (
                <div
                  key={group.id}
                  className="bg-[#1f2027] border border-[#2a2c38] rounded-md overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between p-2 bg-[#1b1c23] border-b border-[#2a2c38]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        onClick={() =>
                          onUpdatePaletteGroups(prev =>
                            prev.map(g =>
                              g.id === group.id ? { ...g, collapsed: !g.collapsed } : g
                            )
                          )
                        }
                        className="text-neutral-400 hover:text-neutral-200"
                      >
                        {group.collapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="font-bold text-[11px] text-neutral-200 truncate">
                        {group.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({swatches.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectAllGroupColors(group)}
                        className="px-1.5 py-0.5 bg-[#252733] hover:bg-[#303342] text-[10px] text-neutral-300 rounded border border-neutral-700"
                        title="Select all group colors for multi-color spray"
                      >
                        Select All
                      </button>
                    </div>
                  </div>

                  {/* Swatch Grid */}
                  {!group.collapsed && (
                    <div className="p-2.5">
                      <div
                        className="grid gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${group.columns || 9}, minmax(0, 1fr))`
                        }}
                      >
                        {swatches.map((swatch, idx) => {
                          const isSelected = selectedColorHexes.has(swatch.hex);
                          const isFg = fgColor.toLowerCase() === swatch.hex.toLowerCase();

                          return (
                            <div
                              key={`${group.id}_${swatch.id}_${idx}`}
                              onClick={e => {
                                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                  onToggleColorSelection(swatch.hex, true);
                                } else {
                                  onChangeFgColor(swatch.hex);
                                  setEditingHex(swatch.hex);
                                  onToggleColorSelection(swatch.hex, false);
                                }
                              }}
                              className={`aspect-square rounded-[3px] cursor-pointer transition-transform relative flex items-center justify-center ${
                                isFg ? 'ring-2 ring-white z-10 scale-105' : 'hover:scale-110'
                              } ${
                                isSelected
                                  ? 'border-2 border-amber-400 shadow-sm'
                                  : 'border border-black/30'
                              }`}
                              style={{ backgroundColor: swatch.hex }}
                              title={`${swatch.hex} (Shift+Click to multi-select)`}
                            >
                              {isSelected && (
                                <Check className="w-2.5 h-2.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleCreateNewGroup}
              className="w-full py-2 bg-[#1f2027] hover:bg-[#252733] border border-dashed border-[#343746] rounded text-neutral-300 text-[11px] font-medium flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Palette Group</span>
            </button>
          </>
        ) : (
          /* Gradient Ramps Tab */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Gradient Ramps
              </span>
              <button
                onClick={() => {
                  const colors = Array.from(selectedColorHexes);
                  if (colors.length < 2) {
                    alert('Select at least 2 swatches in the palette first to generate a gradient ramp.');
                    return;
                  }
                  onAddGradient(`Ramp ${gradients.length + 1}`, colors);
                }}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>From Selection</span>
              </button>
            </div>

            {gradients.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 bg-[#1f2027] border border-[#2a2c38] rounded-md">
                No gradient ramps created yet. Multi-select swatches in the palette to build a sequential spray ramp!
              </div>
            ) : (
              <div className="space-y-2">
                {gradients.map(grad => {
                  const isSelected = selectedGradientId === grad.id;
                  return (
                    <div
                      key={grad.id}
                      onClick={() => onSelectGradient(grad.id)}
                      className={`p-2 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                          : 'bg-[#1f2027] hover:bg-[#252733] border-[#2a2c38]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[11px] text-neutral-200">{grad.name}</span>
                        <span className="text-[10px] text-neutral-400">{grad.stops.length} stops</span>
                      </div>
                      <div
                        className="h-4 rounded border border-white/20"
                        style={{
                          background: `linear-gradient(to right, ${grad.stops.join(', ')})`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
