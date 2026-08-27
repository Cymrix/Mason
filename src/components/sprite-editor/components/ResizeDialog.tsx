import React, { useState } from 'react';
import { Maximize2, X, Check } from 'lucide-react';

interface ResizeDialogProps {
  isOpen: boolean;
  currentWidth: number;
  currentHeight: number;
  onClose: () => void;
  onApplyResize: (newWidth: number, newHeight: number, mode: 'expand' | 'scale', anchor: string) => void;
}

export const ResizeDialog: React.FC<ResizeDialogProps> = ({
  isOpen,
  currentWidth,
  currentHeight,
  onClose,
  onApplyResize
}) => {
  const [targetWidth, setTargetWidth] = useState<number>(currentWidth);
  const [targetHeight, setTargetHeight] = useState<number>(currentHeight);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [resizeMode, setResizeMode] = useState<'expand' | 'scale'>('expand');
  const [anchor, setAnchor] = useState<string>('center');

  if (!isOpen) return null;

  const presets = [
    { label: '16×16', w: 16, h: 16 },
    { label: '24×24', w: 24, h: 24 },
    { label: '32×32', w: 32, h: 32 },
    { label: '48×48', w: 48, h: 48 },
    { label: '64×64', w: 64, h: 64 },
    { label: '128×128', w: 128, h: 128 }
  ];

  const handleApply = () => {
    const w = Math.max(1, Math.min(1024, targetWidth));
    const h = Math.max(1, Math.min(1024, targetHeight));
    onApplyResize(w, h, resizeMode, anchor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Maximize2 size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Resize Canvas</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Presets</span>
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTargetWidth(p.w);
                  setTargetHeight(p.h);
                }}
                className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                  targetWidth === p.w && targetHeight === p.h
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700/60 hover:bg-neutral-750'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400">Width (px)</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={targetWidth}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setTargetWidth(val);
                if (keepAspect) setTargetHeight(val);
              }}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-neutral-400">Height (px)</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={targetHeight}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setTargetHeight(val);
                if (keepAspect) setTargetWidth(val);
              }}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Resize Mode */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Mode</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResizeMode('expand')}
              className={`p-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-0.5 ${
                resizeMode === 'expand'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-750'
              }`}
            >
              <span>Canvas Anchor</span>
              <span className="text-[9px] opacity-70">Crop / Expand</span>
            </button>
            <button
              type="button"
              onClick={() => setResizeMode('scale')}
              className={`p-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-0.5 ${
                resizeMode === 'scale'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-750'
              }`}
            >
              <span>Resample</span>
              <span className="text-[9px] opacity-70">Scale Pixels</span>
            </button>
          </div>
        </div>

        {/* Anchor Grid (if expand mode) */}
        {resizeMode === 'expand' && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Anchor Position</span>
            <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
              {['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setAnchor(pos)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    anchor === pos
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  •
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Resize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
