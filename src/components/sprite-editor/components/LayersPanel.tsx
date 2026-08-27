import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Copy,
  Trash2,
  ArrowDown,
  ArrowUp,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { Layer, BlendModeType } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (index: number) => void;
  onDeleteLayer: (index: number) => void;
  onMergeDown: (index: number) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onToggleLayerVisibility: (index: number) => void;
  onToggleLayerLock: (index: number) => void;
  onChangeLayerOpacity: (index: number, opacity: number) => void;
  onChangeLayerBlendMode: (index: number, mode: BlendModeType) => void;
  onRenameLayer: (index: number, name: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerIndex,
  onSelectLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMergeDown,
  onMoveLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onChangeLayerOpacity,
  onChangeLayerBlendMode,
  onRenameLayer
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const activeLayer = layers[activeLayerIndex] || layers[0];

  const handleStartRename = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const handleFinishRename = (index: number) => {
    if (editingName.trim()) {
      onRenameLayer(index, editingName.trim());
    }
    setEditingIndex(null);
  };

  const blendModes: Array<{ id: BlendModeType; label: string }> = [
    { id: 'normal', label: 'Normal' },
    { id: 'multiply', label: 'Multiply' },
    { id: 'screen', label: 'Screen' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'darken', label: 'Darken' },
    { id: 'lighten', label: 'Lighten' }
  ];

  return (
    <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
          <Layers size={14} className="text-emerald-400" />
          <span>Layers</span>
          <span className="text-[10px] text-neutral-500 font-mono">({layers.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            id="add-layer-btn"
            onClick={onAddLayer}
            title="Add New Layer"
            className="p-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            id="duplicate-layer-btn"
            onClick={() => onDuplicateLayer(activeLayerIndex)}
            title="Duplicate Active Layer"
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            id="merge-layer-btn"
            onClick={() => onMergeDown(activeLayerIndex)}
            disabled={activeLayerIndex === 0 || layers.length <= 1}
            title="Merge Layer Down"
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-30 border border-neutral-700/60 transition"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            id="delete-layer-btn"
            onClick={() => onDeleteLayer(activeLayerIndex)}
            disabled={layers.length <= 1}
            title="Delete Layer"
            className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 disabled:opacity-30 border border-rose-500/30 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Active Layer Opacity & Blend Mode Properties */}
      {activeLayer && (
        <div className="p-2.5 border-b border-neutral-800 bg-neutral-950/40 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span className="uppercase font-bold">Opacity</span>
            <span className="font-mono text-emerald-400 font-bold">{activeLayer.opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLayer.opacity}
            onChange={(e) => onChangeLayerOpacity(activeLayerIndex, parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Blend</span>
            <select
              id="layer-blend-mode-select"
              value={activeLayer.blendMode}
              onChange={(e) => onChangeLayerBlendMode(activeLayerIndex, e.target.value as BlendModeType)}
              className="bg-neutral-800 border border-neutral-700/80 rounded-md text-[11px] font-semibold text-neutral-200 px-2 py-0.5 focus:outline-none focus:border-emerald-500"
            >
              {blendModes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Layer List Stack (Rendered Top-to-Bottom, Top is Highest Layer) */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col-reverse gap-1.5">
        {layers.map((layer, index) => {
          const isActive = index === activeLayerIndex;
          const isEditing = editingIndex === index;

          return (
            <div
              key={layer.id}
              id={`layer-item-${index}`}
              onClick={() => onSelectLayer(index)}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                  : 'bg-neutral-800/60 hover:bg-neutral-800 border-neutral-750'
              }`}
            >
              {/* Layer Thumbnail Canvas Snapshot */}
              <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-700/60 overflow-hidden flex items-center justify-center shrink-0 relative">
                <canvas
                  ref={(canvasEl) => {
                    if (canvasEl && layer.canvas) {
                      canvasEl.width = 32;
                      canvasEl.height = 32;
                      const ctx = canvasEl.getContext('2d');
                      if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 32, 32);
                        ctx.drawImage(layer.canvas, 0, 0, 32, 32);
                      }
                    }
                  }}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Layer Title / Rename Field */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(index);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    className="w-full bg-neutral-900 border border-emerald-500 text-xs font-bold text-white px-1.5 py-0.5 rounded focus:outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartRename(index, layer.name)}
                    className={`text-xs font-bold block truncate ${
                      isActive ? 'text-white' : 'text-neutral-300'
                    }`}
                    title="Double-click to rename"
                  >
                    {layer.name}
                  </span>
                )}
                <span className="text-[9px] text-neutral-400 font-mono">
                  {layer.opacity}% • {layer.blendMode}
                </span>
              </div>

              {/* Action Buttons: Visibility & Lock */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  id={`layer-vis-btn-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerVisibility(index);
                  }}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  className={`p-1 rounded-md transition ${
                    layer.visible
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-neutral-400 bg-neutral-900'
                  }`}
                >
                  {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                <button
                  type="button"
                  id={`layer-lock-btn-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerLock(index);
                  }}
                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  className={`p-1 rounded-md transition ${
                    layer.locked
                      ? 'text-amber-400 bg-amber-950/40'
                      : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
