import React, { useRef } from 'react';
import { X, Check, Paintbrush } from 'lucide-react';
import {
  NativePaletteSprayStudio,
  NativePaletteSprayStudioHandle
} from './sprite-editor';

export interface SpriteSaveResult {
  dataUrl: string;
  spritesheetUrl?: string;
  width: number;
  height: number;
  frameCount: number;
  fps: number;
  projectName: string;
}

export interface SpriteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (result: SpriteSaveResult) => void;
  initialImageDataUrl?: string;
  initialWidth?: number;
  initialHeight?: number;
  title?: string;
}

export const SpriteEditorModal: React.FC<SpriteEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialImageDataUrl,
  initialWidth = 32,
  initialHeight = 32,
  title = 'Palette Spray Studio — Pixel & Sprite Editor'
}) => {
  const studioRef = useRef<NativePaletteSprayStudioHandle>(null);

  const spriteName = title.includes('—') ? title.split('—')[0].trim() : 'Sprite';

  const handleApplyAndSave = async () => {
    if (!studioRef.current) return;
    const res = await studioRef.current.save(spriteName);
    if (res.success && res.dataUrl && onSave) {
      onSave({
        dataUrl: res.dataUrl,
        spritesheetUrl: res.dataUrl,
        width: res.spriteData?.width || initialWidth,
        height: res.spriteData?.height || initialHeight,
        frameCount: res.spriteData?.frames?.length || 1,
        fps: res.spriteData?.fps || 8,
        projectName: res.spriteData?.name || spriteName
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-md animate-fadeIn">
      {/* Top Navigation Header */}
      <div className="h-14 px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between select-none shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                Native React Studio
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Layered pixel art, palette spray brush, gradient sequencer & animation tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyAndSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-neutral-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-all border border-amber-400/40 active:scale-95"
          >
            <Check className="w-4 h-4" />
            Apply & Save Sprite
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition border border-neutral-700/50"
            title="Close Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Native React Sprite Studio Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#121316]">
        <NativePaletteSprayStudio
          ref={studioRef}
          activeFile={{
            id: `sprite_${Date.now()}`,
            name: spriteName,
            fileName: `${spriteName}.sprite`,
            width: initialWidth,
            height: initialHeight,
            dataUrl: initialImageDataUrl,
            updatedAt: new Date().toISOString()
          }}
          onExportImage={exportData => {
            if (onSave) {
              onSave({
                dataUrl: exportData.dataUrl,
                spritesheetUrl: exportData.dataUrl,
                width: exportData.width || initialWidth,
                height: exportData.height || initialHeight,
                frameCount: exportData.frameCount || 1,
                fps: exportData.fps || 8,
                projectName: exportData.suggestedName || spriteName
              });
            }
          }}
        />
      </div>
    </div>
  );
};

