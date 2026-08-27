import React, { useRef, useMemo } from 'react';
import { X, Sparkles, Check, Paintbrush, Layers, RotateCcw } from 'lucide-react';
import { NativeSpriteEditor, NativeSpriteEditorHandle } from './sprite-editor';
import { SpriteFile } from '../engine/masonProjectSchema';

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
  const editorRef = useRef<NativeSpriteEditorHandle>(null);

  const mockFile: SpriteFile = useMemo(() => {
    return {
      id: `modal_sprite_${Date.now()}`,
      name: title.includes('—') ? title.split('—')[0].trim() : 'Sprite',
      fileName: 'active_sprite.sprite',
      updatedAt: new Date().toISOString(),
      width: initialWidth,
      height: initialHeight,
      dataUrl: initialImageDataUrl,
      imageUrl: initialImageDataUrl
    };
  }, [title, initialWidth, initialHeight, initialImageDataUrl]);

  const handleRequestExport = async () => {
    if (editorRef.current) {
      const res = await editorRef.current.save();
      if (res.success && res.dataUrl) {
        if (onSave) {
          onSave({
            dataUrl: res.dataUrl,
            spritesheetUrl: res.dataUrl,
            width: initialWidth,
            height: initialHeight,
            frameCount: res.spriteData?.frames?.length || 1,
            fps: 12,
            projectName: mockFile.name
          });
        }
        onClose();
        return;
      }
      editorRef.current.requestExport();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-md animate-fadeIn">
      {/* Top Navigation Header */}
      <div className="h-14 px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between select-none shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Native Studio
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Layered pixel art, palette spray brush, normal map & animation tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestExport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all border border-emerald-400/30 active:scale-95"
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

      {/* Embedded Application Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-neutral-900">
        <NativeSpriteEditor
          ref={editorRef}
          activeFile={mockFile}
          onExportImage={(exportData) => {
            if (onSave) {
              onSave({
                dataUrl: exportData.dataUrl,
                spritesheetUrl: exportData.dataUrl,
                width: exportData.width || initialWidth,
                height: exportData.height || initialHeight,
                frameCount: exportData.frameCount || 1,
                fps: exportData.fps || 12,
                projectName: exportData.suggestedName || mockFile.name
              });
            }
            onClose();
          }}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};

