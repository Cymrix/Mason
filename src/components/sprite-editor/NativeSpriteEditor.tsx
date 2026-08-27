import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { SpriteFile } from '../../engine/masonProjectSchema';
import { sliceSpritesheetToFrames } from '../../utils/spriteUtils';

export interface NativeSpriteEditorHandle {
  save: (targetFileName?: string) => Promise<{
    success: boolean;
    spriteData?: any;
    dataUrl?: string;
    error?: string;
  }>;
  loadFile: (file: SpriteFile) => Promise<void>;
  markClean: () => void;
  requestExport: () => void;
  postMessage: (message: any) => void;
}

export interface NativeSpriteEditorProps {
  activeFile: SpriteFile;
  onDirtyChange?: (isDirty: boolean) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number; frameCount: number }) => void;
  onExportImage?: (exportData: {
    filename: string;
    dataUrl: string;
    suggestedName?: string;
    width?: number;
    height?: number;
    frameCount?: number;
    fps?: number;
  }) => void;
  onReady?: () => void;
  className?: string;
}

export const NativeSpriteEditor = forwardRef<NativeSpriteEditorHandle, NativeSpriteEditorProps>(({
  activeFile,
  onDirtyChange,
  onDimensionsChange,
  onExportImage,
  onReady,
  className = 'w-full h-full border-none bg-neutral-950'
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef<boolean>(false);
  const lastLoadedFileNameRef = useRef<string | null>(null);
  const lastLoadedUpdatedAtRef = useRef<string | null>(null);
  const pendingSaveResolversRef = useRef<Map<string, (result: any) => void>>(new Map());

  const postToContainer = useCallback((message: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  const loadFileIntoContainer = useCallback(async (file: SpriteFile) => {
    if (!iframeRef.current?.contentWindow || !isReadyRef.current) return;
    lastLoadedFileNameRef.current = file.fileName;
    lastLoadedUpdatedAtRef.current = file.updatedAt || null;

    if (file.spriteData) {
      postToContainer({
        type: 'LOAD_PROJECT',
        projectData: file.spriteData,
        projectName: file.name
      });
    } else if (file.imageUrl || file.dataUrl) {
      const cols = file.exportSettings?.cols || 1;
      const rows = file.exportSettings?.rows || 1;
      const tw = file.exportSettings?.tileWidth || file.width || 32;
      const th = file.exportSettings?.tileHeight || file.height || 32;
      const imageSrc = file.imageUrl || file.dataUrl || '';

      try {
        const sliced = await sliceSpritesheetToFrames(imageSrc, cols, rows, tw, th);
        const projData = {
          version: 1,
          width: sliced.width,
          height: sliced.height,
          layers: sliced.frames[0]?.layers || [{ name: 'Layer 1', data: '' }],
          frames: sliced.frames,
          currentFrameIndex: 0,
          exportSettings: file.exportSettings || {
            exportMode: cols > 1 || rows > 1 ? 'spritesheet' : 'flattened',
            targetFileName: `${file.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
            cols,
            rows,
            tileWidth: sliced.width,
            tileHeight: sliced.height,
            frameCount: sliced.frames.length
          }
        };

        postToContainer({
          type: 'LOAD_PROJECT',
          projectData: projData,
          projectName: file.name
        });
      } catch (err) {
        console.warn('[NativeSpriteEditor] Failed slicing spritesheet, loading direct:', err);
        postToContainer({
          type: 'LOAD_SPRITE',
          width: file.width || 32,
          height: file.height || 32,
          projectName: file.name
        });
      }
    } else {
      postToContainer({
        type: 'LOAD_SPRITE',
        width: file.width || 32,
        height: file.height || 32,
        projectName: file.name
      });
    }
  }, [postToContainer]);

  const saveActiveState = useCallback((targetFileName?: string): Promise<{
    success: boolean;
    spriteData?: any;
    dataUrl?: string;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow || !isReadyRef.current) {
        return resolve({ success: false, error: 'Editor container is not ready' });
      }

      const saveId = `save_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const timeoutId = setTimeout(() => {
        if (pendingSaveResolversRef.current.has(saveId)) {
          pendingSaveResolversRef.current.delete(saveId);
          resolve({ success: false, error: 'Save request timed out' });
        }
      }, 3500);

      pendingSaveResolversRef.current.set(saveId, (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      });

      postToContainer({
        type: 'REQUEST_SAVE',
        saveId,
        targetFileName: targetFileName || activeFile.fileName,
        isExplicitSave: true
      });
    });
  }, [postToContainer, activeFile.fileName]);

  // Imperative handle for parent components
  useImperativeHandle(ref, () => ({
    save: saveActiveState,
    loadFile: loadFileIntoContainer,
    markClean: () => postToContainer({ type: 'MARK_CLEAN' }),
    requestExport: () => postToContainer({ type: 'REQUEST_EXPORT' }),
    postMessage: postToContainer
  }), [saveActiveState, loadFileIntoContainer, postToContainer]);

  // Handle incoming messages from the in-memory engine container
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      const { type } = e.data;

      if (type === 'SPRITE_READY' || type === 'SPRITE_EDITOR_READY') {
        if (!isReadyRef.current) {
          isReadyRef.current = true;
          onReady?.();
          loadFileIntoContainer(activeFile);
          postToContainer({ type: 'REQUEST_STATUS' });
        }
      } else if (type === 'SPRITE_DIRTY') {
        onDirtyChange?.(Boolean(e.data.isDirty));
      } else if (type === 'SPRITE_STATUS' || type === 'SPRITE_STATUS_UPDATE') {
        onDimensionsChange?.({
          width: e.data.width || 32,
          height: e.data.height || 32,
          frameCount: e.data.frameCount || 1
        });
      } else if (type === 'IMAGE_EXPORTED') {
        onExportImage?.({
          filename: e.data.filename,
          dataUrl: e.data.dataUrl,
          suggestedName: e.data.suggestedName,
          width: e.data.width,
          height: e.data.height,
          frameCount: e.data.frameCount,
          fps: e.data.fps
        });
      } else if (type === 'SAVE_PROJECT_DATA') {
        const resolver = pendingSaveResolversRef.current.get(e.data.saveId);
        if (resolver) {
          pendingSaveResolversRef.current.delete(e.data.saveId);
          resolver({
            success: true,
            spriteData: e.data.data || e.data.spriteData,
            dataUrl: e.data.spritesheetUrl || e.data.dataUrl || e.data.imageDataUrl
          });
        }
      } else if (type === 'SAVE_PROJECT_DATA_ERROR') {
        const resolver = pendingSaveResolversRef.current.get(e.data.saveId);
        if (resolver) {
          pendingSaveResolversRef.current.delete(e.data.saveId);
          resolver({
            success: false,
            error: e.data.error || 'Failed saving project data'
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [activeFile, loadFileIntoContainer, onDimensionsChange, onDirtyChange, onExportImage, onReady, postToContainer]);

  // Sync activeFile changes
  useEffect(() => {
    if (!isReadyRef.current) return;
    const isDifferentFile = lastLoadedFileNameRef.current !== activeFile.fileName;
    const isDifferentTime = activeFile.updatedAt && activeFile.updatedAt !== lastLoadedUpdatedAtRef.current;

    if (isDifferentFile || isDifferentTime) {
      loadFileIntoContainer(activeFile);
    }
  }, [activeFile, loadFileIntoContainer]);

  return (
    <iframe
      ref={iframeRef}
      src="./modules/sprites/index.html"
      className={className}
      title="Image & Sprite Studio Native Engine"
      onLoad={() => {
        // Fallback ready check if message was missed
        setTimeout(() => {
          if (!isReadyRef.current) {
            isReadyRef.current = true;
            onReady?.();
            loadFileIntoContainer(activeFile);
            postToContainer({ type: 'REQUEST_STATUS' });
          }
        }, 150);
      }}
    />
  );
});

NativeSpriteEditor.displayName = 'NativeSpriteEditor';
