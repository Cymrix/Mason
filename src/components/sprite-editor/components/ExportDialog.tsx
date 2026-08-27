import React, { useState } from 'react';
import { Download, Save, X, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { AnimationFrame } from '../types';
import { compositeFrame, generateSpritesheet, createOffscreenCanvas } from '../utils/canvasUtils';

interface ExportDialogProps {
  isOpen: boolean;
  frames: AnimationFrame[];
  width: number;
  height: number;
  spriteName: string;
  fps: number;
  onClose: () => void;
  onSaveToProject?: (exportData: {
    filename: string;
    dataUrl: string;
    suggestedName?: string;
    width: number;
    height: number;
    frameCount: number;
    fps: number;
  }) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  frames,
  width,
  height,
  spriteName,
  fps,
  onClose,
  onSaveToProject
}) => {
  const [exportType, setExportType] = useState<'flattened' | 'spritesheet'>('spritesheet');
  const [scale, setScale] = useState<number>(1);
  const [cols, setCols] = useState<number>(Math.max(1, frames.length));

  if (!isOpen) return null;

  const cleanBaseName = (spriteName || 'sprite').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const exportFilename = `${cleanBaseName}.png`;

  // Generate exported canvas with scaling
  const getExportCanvas = (): HTMLCanvasElement => {
    let sourceCanvas: HTMLCanvasElement;
    if (exportType === 'flattened') {
      sourceCanvas = compositeFrame(frames[0], width, height);
    } else {
      sourceCanvas = generateSpritesheet(frames, width, height, cols).canvas;
    }

    if (scale === 1) return sourceCanvas;

    const scaledCanvas = createOffscreenCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
    const ctx = scaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    }
    return scaledCanvas;
  };

  const handleDownload = () => {
    const canvas = getExportCanvas();
    const link = document.createElement('a');
    link.download = exportFilename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onClose();
  };

  const handleSaveToProject = () => {
    const canvas = getExportCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    if (onSaveToProject) {
      onSaveToProject({
        filename: exportFilename,
        dataUrl,
        suggestedName: spriteName,
        width: width * scale,
        height: height * scale,
        frameCount: frames.length,
        fps
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Export Sprite Image</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Export Mode */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Layout Format</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExportType('spritesheet')}
              className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                exportType === 'spritesheet'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-750'
              }`}
            >
              <span className="font-bold">Spritesheet Grid</span>
              <span className="text-[10px] opacity-70">All {frames.length} Animation Frames</span>
            </button>

            <button
              type="button"
              onClick={() => setExportType('flattened')}
              className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                exportType === 'flattened'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-750'
              }`}
            >
              <span className="font-bold">Single Image</span>
              <span className="text-[10px] opacity-70">Frame 1 Only</span>
            </button>
          </div>
        </div>

        {/* Scale Multiplier */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-neutral-400">
            <span>Pixel Resolution Scale</span>
            <span className="text-emerald-400 font-mono">{scale}× ({width * scale}×{height * scale} px/tile)</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 4, 8, 16].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                  scale === s
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-750'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Spritesheet Columns (if spritesheet) */}
        {exportType === 'spritesheet' && frames.length > 1 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-neutral-400">
              <span>Sheet Columns</span>
              <span className="text-cyan-400 font-mono">{cols} cols × {Math.ceil(frames.length / cols)} rows</span>
            </div>
            <input
              type="range"
              min="1"
              max={frames.length}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-neutral-750 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-600/60 flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToProject}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Save to Mason /images/</span>
          </button>
        </div>
      </div>
    </div>
  );
};
