import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import { SpriteFile } from '../../engine/masonProjectSchema';
import {
  ToolType,
  Layer,
  AnimationFrame,
  BrushSettings,
  DitherPatternType,
  SpriteProjectData,
  HistoryStep,
  BlendModeType,
  LoopMode
} from './types';
import {
  createOffscreenCanvas,
  cloneCanvas,
  clearCanvas,
  createDefaultFrame,
  createDefaultLayer,
  serializeFrame,
  deserializeFrame,
  compositeFrame,
  generateSpritesheet,
  flipCanvas,
  rotateCanvas90,
  invertColors
} from './utils/canvasUtils';
import { sliceSpritesheetToFrames } from '../../utils/spriteUtils';
import { ToolBar } from './components/ToolBar';
import { ColorPalettePanel } from './components/ColorPalettePanel';
import { LayersPanel } from './components/LayersPanel';
import { AnimationTimeline } from './components/AnimationTimeline';
import { CanvasViewport } from './components/CanvasViewport';
import { ResizeDialog } from './components/ResizeDialog';
import { ExportDialog } from './components/ExportDialog';
import {
  Undo2,
  Redo2,
  Maximize2,
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  SunMedium,
  Trash2,
  Check,
  Sparkles
} from 'lucide-react';

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
  className = 'w-full h-full bg-neutral-950 flex flex-col'
}, ref) => {
  // Document Dimensions & Name
  const [docWidth, setDocWidth] = useState<number>(() => activeFile.width || 32);
  const [docHeight, setDocHeight] = useState<number>(() => activeFile.height || 32);
  const [docName, setDocName] = useState<string>(() => activeFile.name || 'Sprite');
  const [fps, setFps] = useState<number>(8);
  const [loopMode, setLoopMode] = useState<LoopMode>('loop');

  // Animation Frames & Layers State
  const [frames, setFrames] = useState<AnimationFrame[]>(() => [
    createDefaultFrame(activeFile.width || 32, activeFile.height || 32, 'Frame 1')
  ]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);

  // Active Tool & Settings
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [primaryColor, setPrimaryColor] = useState<string>('#ffffff');
  const [secondaryColor, setSecondaryColor] = useState<string>('#000000');
  const [ditherPattern, setDitherPattern] = useState<DitherPatternType>('none');
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 1,
    shape: 'square',
    pixelPerfect: true,
    symmetry: 'none',
    dither: 'none',
    sprayRadius: 6,
    sprayDensity: 12,
    opacity: 100
  });

  // Viewport overlays
  const [showPixelGrid, setShowPixelGrid] = useState<boolean>(true);
  const [showTileGrid, setShowTileGrid] = useState<boolean>(false);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState<boolean>(false);

  // Dialogs
  const [showResizeDialog, setShowResizeDialog] = useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);

  // Undo / Redo History Stack
  const historyStackRef = useRef<HistoryStep[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Callback refs to avoid effect re-triggers from unstable function references
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;
  const onExportImageRef = useRef(onExportImage);
  onExportImageRef.current = onExportImage;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Dirty flag tracking
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const isDirtyRef = useRef<boolean>(false);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
    isDirtyRef.current = dirty;
    onDirtyChangeRef.current?.(dirty);
  }, []);

  // Current active frame & layer getters
  const activeFrame = frames[activeFrameIndex] || frames[0];
  const activeLayer = activeFrame?.layers[activeLayerIndex] || activeFrame?.layers[0];
  const previousFrame = activeFrameIndex > 0 ? frames[activeFrameIndex - 1] : null;

  // Push history snapshot
  const pushHistory = useCallback((description: string) => {
    const serializedFrames = frames.map(serializeFrame);
    const snapshot: HistoryStep = {
      description,
      frames: serializedFrames,
      width: docWidth,
      height: docHeight,
      activeFrameIndex,
      activeLayerIndex
    };

    // Trim redo branch
    historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    historyStackRef.current.push(snapshot);
    if (historyStackRef.current.length > 40) {
      historyStackRef.current.shift();
    }
    historyIndexRef.current = historyStackRef.current.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setDirty(true);
  }, [frames, docWidth, docHeight, activeFrameIndex, activeLayerIndex, setDirty]);

  // Execute Undo
  const handleUndo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const step = historyStackRef.current[historyIndexRef.current];
    if (!step) return;

    const restoredFrames = await Promise.all(
      step.frames.map(f => deserializeFrame(f, step.width, step.height))
    );

    setDocWidth(step.width);
    setDocHeight(step.height);
    setFrames(restoredFrames);
    setActiveFrameIndex(Math.min(step.activeFrameIndex, restoredFrames.length - 1));
    setActiveLayerIndex(step.activeLayerIndex);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Execute Redo
  const handleRedo = useCallback(async () => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1) return;
    historyIndexRef.current++;
    const step = historyStackRef.current[historyIndexRef.current];
    if (!step) return;

    const restoredFrames = await Promise.all(
      step.frames.map(f => deserializeFrame(f, step.width, step.height))
    );

    setDocWidth(step.width);
    setDocHeight(step.height);
    setFrames(restoredFrames);
    setActiveFrameIndex(Math.min(step.activeFrameIndex, restoredFrames.length - 1));
    setActiveLayerIndex(step.activeLayerIndex);

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Load a file into native state
  const loadFile = useCallback(async (file: SpriteFile) => {
    try {
      const targetW = file.width || 32;
      const targetH = file.height || 32;
      const targetName = file.name || 'Sprite';

      setDocName(targetName);
      setDocWidth(targetW);
      setDocHeight(targetH);

      if (file.spriteData && file.spriteData.frames && file.spriteData.frames.length > 0) {
        const loadedFrames = await Promise.all(
          file.spriteData.frames.map((f: any) =>
            deserializeFrame(f, file.spriteData.width || targetW, file.spriteData.height || targetH)
          )
        );
        setFrames(loadedFrames);
        setFps(file.spriteData.fps || 8);
        setActiveFrameIndex(file.spriteData.currentFrameIndex || 0);
        setActiveLayerIndex(0);
      } else if (file.imageUrl || file.dataUrl) {
        const cols = file.exportSettings?.cols || 1;
        const rows = file.exportSettings?.rows || 1;
        const tw = file.exportSettings?.tileWidth || targetW;
        const th = file.exportSettings?.tileHeight || targetH;
        const imageSrc = file.imageUrl || file.dataUrl || '';

        try {
          const sliced = await sliceSpritesheetToFrames(imageSrc, cols, rows, tw, th);
          const newFrames: AnimationFrame[] = [];

          for (let fi = 0; fi < sliced.frames.length; fi++) {
            const rawFrame = sliced.frames[fi];
            const liveLayers: Layer[] = [];

            for (const l of rawFrame.layers) {
              const layerCanvas = createOffscreenCanvas(sliced.width, sliced.height);
              const ctx = layerCanvas.getContext('2d');
              if (ctx && l.data) {
                await new Promise<void>((res) => {
                  const img = new Image();
                  img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    res();
                  };
                  img.onerror = () => res();
                  img.src = l.data;
                });
              }
              liveLayers.push({
                id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: l.name || `Layer ${liveLayers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 100,
                blendMode: 'normal',
                canvas: layerCanvas
              });
            }

            newFrames.push({
              id: `frame_${fi + 1}`,
              name: `Frame ${fi + 1}`,
              duration: 100,
              layers: liveLayers.length > 0 ? liveLayers : [createDefaultLayer(sliced.width, sliced.height)]
            });
          }

          setDocWidth(sliced.width);
          setDocHeight(sliced.height);
          setFrames(newFrames);
          setActiveFrameIndex(0);
          setActiveLayerIndex(0);
        } catch (err) {
          console.warn('Failed slicing spritesheet, creating blank canvas:', err);
          setFrames([createDefaultFrame(targetW, targetH, 'Frame 1')]);
        }
      } else {
        setFrames([createDefaultFrame(targetW, targetH, 'Frame 1')]);
        setActiveFrameIndex(0);
        setActiveLayerIndex(0);
      }

      // Reset history with initial state
      setTimeout(() => {
        historyStackRef.current = [];
        historyIndexRef.current = -1;
        setCanUndo(false);
        setCanRedo(false);
        setDirty(false);

        onDimensionsChangeRef.current?.({
          width: targetW,
          height: targetH,
          frameCount: file.spriteData?.frames?.length || 1
        });
      }, 50);
    } catch (err) {
      console.error('Failed to load file in NativeSpriteEditor:', err);
    }
  }, [setDirty]);

  // Track loaded file signature to avoid unnecessary re-parsing
  const loadedFileSigRef = useRef<string>('');

  // Initial and reactive file load
  useEffect(() => {
    const fileSig = `${activeFile.fileName}#${activeFile.updatedAt || ''}`;
    if (loadedFileSigRef.current !== fileSig) {
      loadedFileSigRef.current = fileSig;
      loadFile(activeFile);
      onReadyRef.current?.();
    }
  }, [activeFile.fileName, activeFile.updatedAt, loadFile]);

  // Notify parent on dimension / frame count changes (guarded against duplicate notifications)
  const lastReportedDimsRef = useRef<string>('');
  useEffect(() => {
    const dimsKey = `${docWidth}x${docHeight}_${frames.length}`;
    if (lastReportedDimsRef.current !== dimsKey) {
      lastReportedDimsRef.current = dimsKey;
      onDimensionsChangeRef.current?.({
        width: docWidth,
        height: docHeight,
        frameCount: frames.length
      });
    }
  }, [docWidth, docHeight, frames.length]);

  // Layer operations
  const handleAddLayer = () => {
    pushHistory('Add Layer');
    const newLayer = createDefaultLayer(docWidth, docHeight, `Layer ${activeFrame.layers.length + 1}`);
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: [...frame.layers, newLayer]
      };
    }));
    setActiveLayerIndex(activeFrame.layers.length);
  };

  const handleDuplicateLayer = (index: number) => {
    const srcLayer = activeFrame.layers[index];
    if (!srcLayer) return;

    pushHistory(`Duplicate ${srcLayer.name}`);
    const dupLayer: Layer = {
      ...srcLayer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${srcLayer.name} Copy`,
      canvas: cloneCanvas(srcLayer.canvas)
    };

    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      const updated = [...frame.layers];
      updated.splice(index + 1, 0, dupLayer);
      return { ...frame, layers: updated };
    }));
    setActiveLayerIndex(index + 1);
  };

  const handleDeleteLayer = (index: number) => {
    if (activeFrame.layers.length <= 1) return;
    pushHistory('Delete Layer');
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.filter((_, idx) => idx !== index)
      };
    }));
    setActiveLayerIndex(Math.max(0, index - 1));
  };

  const handleMergeDown = (index: number) => {
    if (index === 0 || activeFrame.layers.length <= 1) return;
    pushHistory('Merge Layer Down');

    const topLayer = activeFrame.layers[index];
    const bottomLayer = activeFrame.layers[index - 1];
    if (!topLayer || !bottomLayer) return;

    const targetCtx = bottomLayer.canvas.getContext('2d');
    if (targetCtx) {
      targetCtx.save();
      targetCtx.globalAlpha = topLayer.opacity / 100;
      targetCtx.drawImage(topLayer.canvas, 0, 0);
      targetCtx.restore();
    }

    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.filter((_, idx) => idx !== index)
      };
    }));
    setActiveLayerIndex(index - 1);
  };

  const handleToggleLayerVisibility = (index: number) => {
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.map((l, lIdx) =>
          lIdx === index ? { ...l, visible: !l.visible } : l
        )
      };
    }));
  };

  const handleToggleLayerLock = (index: number) => {
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.map((l, lIdx) =>
          lIdx === index ? { ...l, locked: !l.locked } : l
        )
      };
    }));
  };

  const handleChangeLayerOpacity = (index: number, opacity: number) => {
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.map((l, lIdx) =>
          lIdx === index ? { ...l, opacity } : l
        )
      };
    }));
  };

  const handleChangeLayerBlendMode = (index: number, blendMode: BlendModeType) => {
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.map((l, lIdx) =>
          lIdx === index ? { ...l, blendMode } : l
        )
      };
    }));
  };

  const handleRenameLayer = (index: number, name: string) => {
    setFrames(prev => prev.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return {
        ...frame,
        layers: frame.layers.map((l, lIdx) =>
          lIdx === index ? { ...l, name } : l
        )
      };
    }));
  };

  // Frame operations
  const handleAddFrame = () => {
    pushHistory('Add Frame');
    const newFrame = createDefaultFrame(docWidth, docHeight, `Frame ${frames.length + 1}`);
    setFrames(prev => [...prev, newFrame]);
    setActiveFrameIndex(frames.length);
  };

  const handleDuplicateFrame = (index: number) => {
    const srcFrame = frames[index];
    if (!srcFrame) return;

    pushHistory(`Duplicate ${srcFrame.name}`);
    const dupFrame: AnimationFrame = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${srcFrame.name} Copy`,
      duration: srcFrame.duration,
      layers: srcFrame.layers.map(l => ({
        ...l,
        id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        canvas: cloneCanvas(l.canvas)
      }))
    };

    setFrames(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, dupFrame);
      return updated;
    });
    setActiveFrameIndex(index + 1);
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    pushHistory('Delete Frame');
    setFrames(prev => prev.filter((_, idx) => idx !== index));
    setActiveFrameIndex(Math.max(0, index - 1));
  };

  // Layer transform shortcuts (Flip, Rotate, Invert, Clear)
  const handleFlipHorizontal = () => {
    if (!activeLayer || activeLayer.locked) return;
    pushHistory('Flip Horizontal');
    flipCanvas(activeLayer.canvas, true, false);
    setFrames(prev => [...prev]);
  };

  const handleFlipVertical = () => {
    if (!activeLayer || activeLayer.locked) return;
    pushHistory('Flip Vertical');
    flipCanvas(activeLayer.canvas, false, true);
    setFrames(prev => [...prev]);
  };

  const handleRotateCw = () => {
    if (!activeLayer || activeLayer.locked) return;
    pushHistory('Rotate 90° CW');
    rotateCanvas90(activeLayer.canvas, true);
    setFrames(prev => [...prev]);
  };

  const handleInvertColors = () => {
    if (!activeLayer || activeLayer.locked) return;
    pushHistory('Invert Colors');
    invertColors(activeLayer.canvas);
    setFrames(prev => [...prev]);
  };

  const handleClearLayer = () => {
    if (!activeLayer || activeLayer.locked) return;
    pushHistory('Clear Layer');
    clearCanvas(activeLayer.canvas);
    setFrames(prev => [...prev]);
  };

  // Canvas Resize execution
  const handleApplyResize = async (newW: number, newH: number, mode: 'expand' | 'scale', anchor: string) => {
    pushHistory(`Resize Canvas to ${newW}×${newH}`);

    const resizedFrames = await Promise.all(
      frames.map(async (frame) => {
        const newLayers = frame.layers.map((layer) => {
          const newCanvas = createOffscreenCanvas(newW, newH);
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = false;
            if (mode === 'scale') {
              ctx.drawImage(layer.canvas, 0, 0, newW, newH);
            } else {
              // Anchor offset calculation
              let ox = 0;
              let oy = 0;
              if (anchor.includes('center') || anchor === 'middle-left' || anchor === 'middle-right') {
                oy = Math.round((newH - docHeight) / 2);
              }
              if (anchor.includes('bottom')) {
                oy = newH - docHeight;
              }
              if (anchor.includes('center') || anchor === 'top-center' || anchor === 'bottom-center') {
                ox = Math.round((newW - docWidth) / 2);
              }
              if (anchor.includes('right')) {
                ox = newW - docWidth;
              }
              ctx.drawImage(layer.canvas, ox, oy);
            }
          }
          return { ...layer, canvas: newCanvas };
        });
        return { ...frame, layers: newLayers };
      })
    );

    setDocWidth(newW);
    setDocHeight(newH);
    setFrames(resizedFrames);
  };

  // Save serialization method
  const handleSave = useCallback(async (targetFileName?: string) => {
    try {
      const activeComposite = compositeFrame(activeFrame, docWidth, docHeight);
      const compositeDataUrl = activeComposite.toDataURL('image/png');

      const serializedFrames = frames.map(serializeFrame);
      const spriteData: SpriteProjectData = {
        version: 1,
        name: docName,
        width: docWidth,
        height: docHeight,
        fps,
        frames: serializedFrames,
        currentFrameIndex: activeFrameIndex,
        exportSettings: {
          exportMode: frames.length > 1 ? 'spritesheet' : 'flattened',
          targetFileName: targetFileName || activeFile.fileName,
          cols: frames.length,
          rows: 1,
          tileWidth: docWidth,
          tileHeight: docHeight,
          frameCount: frames.length
        }
      };

      setDirty(false);
      return {
        success: true,
        spriteData,
        dataUrl: compositeDataUrl
      };
    } catch (err) {
      console.error('Save error:', err);
      return { success: false, error: String(err) };
    }
  }, [activeFrame, docWidth, docHeight, frames, docName, fps, activeFrameIndex, activeFile.fileName, setDirty]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    save: handleSave,
    loadFile,
    markClean: () => setDirty(false),
    requestExport: () => setShowExportDialog(true),
    postMessage: (msg) => {
      if (msg.type === 'MARK_CLEAN') setDirty(false);
      if (msg.type === 'REQUEST_EXPORT') setShowExportDialog(true);
    }
  }), [handleSave, loadFile, setDirty]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'b' || key === 'p') setActiveTool('pencil');
      else if (key === 'e') setActiveTool('eraser');
      else if (key === 'g') setActiveTool('fill');
      else if (key === 'i') setActiveTool('picker');
      else if (key === 'l') setActiveTool('line');
      else if (key === 'u') setActiveTool('rectangle');
      else if (key === 'c') setActiveTool('ellipse');
      else if (key === 's') setActiveTool('spray');
      else if (key === 'm') setActiveTool('select');
      else if (key === 'h') setActiveTool('pan');
      else if (key === 'x') {
        // Swap primary & secondary
        const temp = primaryColor;
        setPrimaryColor(secondaryColor);
        setSecondaryColor(temp);
      } else if (key === '[') {
        setBrushSettings(prev => ({ ...prev, size: Math.max(1, prev.size - 1) }));
      } else if (key === ']') {
        setBrushSettings(prev => ({ ...prev, size: Math.min(32, prev.size + 1) }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, primaryColor, secondaryColor]);

  return (
    <div className={className}>
      {/* Studio Top Control Header */}
      <div className="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 select-none shrink-0 shadow-sm z-20">
        {/* Left: Quick Actions & History */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-30 border border-neutral-700/60 transition"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-30 border border-neutral-700/60 transition"
          >
            <Redo2 size={14} />
          </button>

          <div className="w-px h-4 bg-neutral-800 mx-1" />

          {/* Flip & Rotate Tools */}
          <button
            type="button"
            onClick={handleFlipHorizontal}
            title="Flip Horizontal"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition"
          >
            <FlipHorizontal size={14} />
          </button>
          <button
            type="button"
            onClick={handleFlipVertical}
            title="Flip Vertical"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition"
          >
            <FlipVertical size={14} />
          </button>
          <button
            type="button"
            onClick={handleRotateCw}
            title="Rotate 90° Clockwise"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={handleInvertColors}
            title="Invert Layer Colors"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition"
          >
            <SunMedium size={14} />
          </button>
          <button
            type="button"
            onClick={handleClearLayer}
            title="Clear Active Layer"
            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Right: Resize Canvas & Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResizeDialog(true)}
            title="Resize Canvas Dimensions"
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Maximize2 size={13} className="text-cyan-400" />
            <span>Resize ({docWidth}×{docHeight})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportDialog(true)}
            title="Export Sprite or Spritesheet"
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition"
          >
            <Download size={13} />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (ToolBar | Canvas Viewport | Layers & Palette) */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Left ToolBar */}
        <ToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          brushSettings={brushSettings}
          onChangeBrushSettings={setBrushSettings}
          showPixelGrid={showPixelGrid}
          onTogglePixelGrid={() => setShowPixelGrid(!showPixelGrid)}
          showTileGrid={showTileGrid}
          onToggleTileGrid={() => setShowTileGrid(!showTileGrid)}
          onionSkinEnabled={onionSkinEnabled}
          onToggleOnionSkin={() => setOnionSkinEnabled(!onionSkinEnabled)}
        />

        {/* Center Canvas Viewport */}
        <CanvasViewport
          width={docWidth}
          height={docHeight}
          activeFrame={activeFrame}
          previousFrame={previousFrame}
          activeLayerIndex={activeLayerIndex}
          activeTool={activeTool}
          brushSettings={brushSettings}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          ditherPattern={ditherPattern}
          showPixelGrid={showPixelGrid}
          showTileGrid={showTileGrid}
          onionSkinEnabled={onionSkinEnabled}
          onModifyCanvas={pushHistory}
          onSampleColor={(hex) => setPrimaryColor(hex)}
        />

        {/* Right Side Panels: Color Palette & Layers */}
        <div className="flex flex-col h-full border-l border-neutral-800 shrink-0">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ColorPalettePanel
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              onChangePrimaryColor={setPrimaryColor}
              onChangeSecondaryColor={setSecondaryColor}
              onSwapColors={() => {
                const temp = primaryColor;
                setPrimaryColor(secondaryColor);
                setSecondaryColor(temp);
              }}
              ditherPattern={ditherPattern}
              onChangeDitherPattern={setDitherPattern}
            />
          </div>
          <div className="h-64 border-t border-neutral-800 flex flex-col">
            <LayersPanel
              layers={activeFrame?.layers || []}
              activeLayerIndex={activeLayerIndex}
              onSelectLayer={setActiveLayerIndex}
              onAddLayer={handleAddLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onDeleteLayer={handleDeleteLayer}
              onMergeDown={handleMergeDown}
              onMoveLayer={() => {}}
              onToggleLayerVisibility={handleToggleLayerVisibility}
              onToggleLayerLock={handleToggleLayerLock}
              onChangeLayerOpacity={handleChangeLayerOpacity}
              onChangeLayerBlendMode={handleChangeLayerBlendMode}
              onRenameLayer={handleRenameLayer}
            />
          </div>
        </div>
      </div>

      {/* Bottom Animation Timeline */}
      <AnimationTimeline
        frames={frames}
        activeFrameIndex={activeFrameIndex}
        width={docWidth}
        height={docHeight}
        fps={fps}
        loopMode={loopMode}
        onionSkinEnabled={onionSkinEnabled}
        onSelectFrame={setActiveFrameIndex}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onMoveFrame={() => {}}
        onChangeFps={setFps}
        onChangeLoopMode={setLoopMode}
        onToggleOnionSkin={() => setOnionSkinEnabled(!onionSkinEnabled)}
      />

      {/* Resize Dialog */}
      <ResizeDialog
        isOpen={showResizeDialog}
        currentWidth={docWidth}
        currentHeight={docHeight}
        onClose={() => setShowResizeDialog(false)}
        onApplyResize={handleApplyResize}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        frames={frames}
        width={docWidth}
        height={docHeight}
        spriteName={docName}
        fps={fps}
        onClose={() => setShowExportDialog(false)}
        onSaveToProject={onExportImage}
      />
    </div>
  );
});
