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
  SpraySettings,
  PaletteGroup,
  GradientRamp,
  LoopMode,
  BlendModeType,
  SymmetryMode,
  SelectionState
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
import { createDefaultPaletteGroups } from './utils/palettes';
import { SprayPhysicsEngine } from './engine/SprayPhysicsEngine';
import { ViewportCanvas } from './components/ViewportCanvas';
import { SpraySettingsPanel } from './components/SpraySettingsPanel';
import { PaletteStudioPanel } from './components/PaletteStudioPanel';
import { LayersPanel } from './components/LayersPanel';
import { AnimationTimeline } from './components/AnimationTimeline';
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
  Grid,
  Sparkles,
  Layers as LayersIcon,
  Film,
  Eye,
  Repeat
} from 'lucide-react';

export interface NativePaletteSprayStudioHandle {
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

export interface NativePaletteSprayStudioProps {
  activeFile?: SpriteFile;
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

export const NativePaletteSprayStudio = forwardRef<
  NativePaletteSprayStudioHandle,
  NativePaletteSprayStudioProps
>(({
  activeFile,
  onDirtyChange,
  onDimensionsChange,
  onExportImage,
  onReady,
  className = 'w-full h-full bg-[#121316] flex flex-col select-none'
}, ref) => {
  // Document Dimensions & Metadata
  const [docWidth, setDocWidth] = useState<number>(() => activeFile?.width || 32);
  const [docHeight, setDocHeight] = useState<number>(() => activeFile?.height || 32);
  const [docName, setDocName] = useState<string>(() => activeFile?.name || 'Spray Project');
  const [fps, setFps] = useState<number>(8);
  const [loopMode, setLoopMode] = useState<LoopMode>('loop');

  // Animation Frames & Layers State
  const [frames, setFrames] = useState<AnimationFrame[]>(() => [
    createDefaultFrame(activeFile?.width || 32, activeFile?.height || 32, 'Frame 1')
  ]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);

  // Active Tool & Spray Physics Settings
  const [activeTool, setActiveTool] = useState<ToolType>('spray');
  const [spraySettings, setSpraySettings] = useState<SpraySettings>({
    mode: 'paint',
    brushSize: 16,
    density: 50,
    flow: 65,
    falloff: 50,
    opacity: 100,
    dabShape: 'circle',
    dabWidth: 1,
    dabHeight: 1,
    dabLockAspect: true,
    dabRoundness: 100,
    sizeJitterMin: 100,
    sizeJitterMax: 100,
    dabWidthJitterMin: 100,
    dabWidthJitterMax: 100,
    dabHeightJitterMin: 100,
    dabHeightJitterMax: 100,
    opacityJitterMin: 100,
    opacityJitterMax: 100,
    angleJitterMin: 0,
    angleJitterMax: 0,
    angleMode: 'manual',
    manualAngle: 0,
    interpolate: true,
    pixelPerfect: true,
    taperEnabled: false,
    taperLength: 16,
    taperSizePct: 0,
    taperSpreadPct: 0,
    taperOpacityFade: false,
    sourceKind: 'palette',
    selectedGradientId: null,
    gradientOrdered: true,
    gradientStepMode: 'distance',
    gradientCycleLength: 120,
    gradientDabsPerStep: 4,
    seamlessMode: false,
    symmetry: 'none',
    dither: 'none',
    fillTolerance: 0,
    fillMode: 'connected'
  });

  // Palette Studio State
  const [fgColor, setFgColor] = useState<string>('#ffca28');
  const [selectedColorHexes, setSelectedColorHexes] = useState<Set<string>>(new Set(['#ffca28']));
  const [paletteGroups, setPaletteGroups] = useState<PaletteGroup[]>(() => createDefaultPaletteGroups());
  const [gradients, setGradients] = useState<GradientRamp[]>([]);
  const [selectedGradientId, setSelectedGradientId] = useState<string | null>(null);

  // Viewport Nav State (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(14);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTileGrid, setShowTileGrid] = useState<boolean>(false);
  const [seamlessMode, setSeamlessMode] = useState<boolean>(false);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [selection, setSelection] = useState<SelectionState | null>(null);

  // Bottom drawer state (Layers vs Animation Timeline)
  const [bottomDrawer, setBottomDrawer] = useState<'timeline' | 'layers'>('timeline');

  // Dialogs
  const [showResizeDialog, setShowResizeDialog] = useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);

  // History & Undo/Redo Tracking
  const historyStackRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Cursor halo preview state
  const [cursorPreview, setCursorPreview] = useState<{
    x: number;
    y: number;
    radius: number;
    shape: string;
  } | null>(null);

  // Current active frame & layers
  const activeFrame = frames[activeFrameIndex] || frames[0];
  const activeLayers = activeFrame?.layers || [];

  // Initialize SprayPhysicsEngine
  const sprayEngineRef = useRef<SprayPhysicsEngine | null>(null);

  // Force render trigger when canvas pixels change
  const [, setCanvasTick] = useState<number>(0);
  const triggerCanvasModified = useCallback(() => {
    setCanvasTick(t => t + 1);
    setIsDirty(true);
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  // Maintain Engine Instance
  useEffect(() => {
    sprayEngineRef.current = new SprayPhysicsEngine({
      width: docWidth,
      height: docHeight,
      getLayers: () => (frames[activeFrameIndex]?.layers || []).map(l => ({
        canvas: l.canvas,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity
      })),
      getActiveLayerIndex: () => activeLayerIndex,
      getSpraySettings: () => spraySettings,
      getActiveColors: () => {
        if (spraySettings.sourceKind === 'gradient' && selectedGradientId) {
          const grad = gradients.find(g => g.id === selectedGradientId);
          if (grad && grad.stops.length > 0) return grad.stops;
        }
        const setColors = Array.from(selectedColorHexes);
        return setColors.length > 0 ? setColors : [fgColor];
      },
      getFgColor: () => fgColor,
      onCanvasModified: triggerCanvasModified
    });
  }, [
    docWidth,
    docHeight,
    frames,
    activeFrameIndex,
    activeLayerIndex,
    spraySettings,
    selectedColorHexes,
    fgColor,
    gradients,
    selectedGradientId,
    triggerCanvasModified
  ]);

  // History snapshot recorder
  const recordHistory = useCallback((desc: string) => {
    const serializedFrames = frames.map(serializeFrame);
    const snap = {
      desc,
      frames: serializedFrames,
      width: docWidth,
      height: docHeight,
      activeFrameIndex,
      activeLayerIndex
    };
    historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    historyStackRef.current.push(snap);
    if (historyStackRef.current.length > 40) historyStackRef.current.shift();
    historyIndexRef.current = historyStackRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    setIsDirty(true);
    onDirtyChange?.(true);
  }, [frames, docWidth, docHeight, activeFrameIndex, activeLayerIndex, onDirtyChange]);

  // Initial history seed
  useEffect(() => {
    if (historyStackRef.current.length === 0 && frames.length > 0) {
      recordHistory('Initial');
    }
  }, [frames, recordHistory]);

  // Undo / Redo Actions
  const handleUndo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const step = historyStackRef.current[historyIndexRef.current];
    if (!step) return;

    const restoredFrames = await Promise.all(
      step.frames.map((f: any) => deserializeFrame(f, step.width, step.height))
    );
    setDocWidth(step.width);
    setDocHeight(step.height);
    setFrames(restoredFrames);
    setActiveFrameIndex(Math.min(step.activeFrameIndex, restoredFrames.length - 1));
    setActiveLayerIndex(step.activeLayerIndex);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  const handleRedo = useCallback(async () => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1) return;
    historyIndexRef.current++;
    const step = historyStackRef.current[historyIndexRef.current];
    if (!step) return;

    const restoredFrames = await Promise.all(
      step.frames.map((f: any) => deserializeFrame(f, step.width, step.height))
    );
    setDocWidth(step.width);
    setDocHeight(step.height);
    setFrames(restoredFrames);
    setActiveFrameIndex(Math.min(step.activeFrameIndex, restoredFrames.length - 1));
    setActiveLayerIndex(step.activeLayerIndex);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Pointer & Spray Handlers
  const isPointerDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const px = Math.floor((clientX / rect.width) * docWidth);
    const py = Math.floor((clientY / rect.height) * docHeight);
    return { px, py };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    // Right-click or Pan tool
    if (e.button === 2 || activeTool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }

    const { px, py } = getCanvasCoords(e);

    if (activeTool === 'colorpick' || activeTool === 'picker') {
      const activeLayer = activeLayers[activeLayerIndex];
      if (activeLayer) {
        const ctx = activeLayer.canvas.getContext('2d');
        if (ctx) {
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          if (pixel[3] > 0) {
            const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
            setFgColor(hex);
            setSelectedColorHexes(new Set([hex]));
          }
        }
      }
      return;
    }

    if (activeTool === 'spray') {
      isPointerDownRef.current = true;
      sprayEngineRef.current?.startStroke(px, py);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      setPanX(e.clientX - panStartRef.current.x);
      setPanY(e.clientY - panStartRef.current.y);
      return;
    }

    const { px, py } = getCanvasCoords(e);

    // Update cursor preview ring
    setCursorPreview({
      x: px,
      y: py,
      radius: spraySettings.brushSize / 2,
      shape: spraySettings.dabShape
    });

    if (isPointerDownRef.current && activeTool === 'spray') {
      sprayEngineRef.current?.moveStroke(px, py);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      sprayEngineRef.current?.endStroke();
      recordHistory('Spray Stroke');
    }
  };

  const handlePointerLeave = () => {
    setCursorPreview(null);
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      sprayEngineRef.current?.endStroke();
      recordHistory('Spray Stroke');
    }
  };

  // Color selection toggles
  const handleToggleColorSelection = (hex: string, isMulti: boolean) => {
    if (!isMulti) {
      setSelectedColorHexes(new Set([hex]));
      return;
    }
    setSelectedColorHexes(prev => {
      const next = new Set(prev);
      if (next.has(hex)) next.delete(hex);
      else next.add(hex);
      return next.size > 0 ? next : new Set([hex]);
    });
  };

  const handleSelectAllGroupColors = (group: PaletteGroup) => {
    const mainGroup = paletteGroups.find(g => g.isMain) || paletteGroups[0];
    const swatches: string[] = group.isMain
      ? (group.colors || []).map(c => c.hex)
      : (group.colorRefs || [])
          .map(id => mainGroup?.colors?.find(c => c.id === id)?.hex)
          .filter(Boolean) as string[];

    if (swatches.length > 0) {
      setSelectedColorHexes(new Set(swatches));
    }
  };

  // Layer Operations
  const handleAddLayer = () => {
    const newL = createDefaultLayer(docWidth, docHeight, `Layer ${activeLayers.length + 1}`);
    setFrames(prev =>
      prev.map((f, fi) =>
        fi === activeFrameIndex ? { ...f, layers: [...f.layers, newL] } : f
      )
    );
    setActiveLayerIndex(activeLayers.length);
    recordHistory('Add Layer');
  };

  const handleDuplicateLayer = (index: number) => {
    const src = activeLayers[index];
    if (!src) return;
    const dup: Layer = {
      ...src,
      id: `layer_${Date.now()}`,
      name: `${src.name} (Copy)`,
      canvas: cloneCanvas(src.canvas)
    };
    setFrames(prev =>
      prev.map((f, fi) =>
        fi === activeFrameIndex
          ? {
              ...f,
              layers: [
                ...f.layers.slice(0, index + 1),
                dup,
                ...f.layers.slice(index + 1)
              ]
            }
          : f
      )
    );
    setActiveLayerIndex(index + 1);
    recordHistory('Duplicate Layer');
  };

  const handleDeleteLayer = (index: number) => {
    if (activeLayers.length <= 1) return;
    setFrames(prev =>
      prev.map((f, fi) =>
        fi === activeFrameIndex
          ? { ...f, layers: f.layers.filter((_, i) => i !== index) }
          : f
      )
    );
    setActiveLayerIndex(Math.max(0, index - 1));
    recordHistory('Delete Layer');
  };

  const handleMergeDown = (index: number) => {
    if (index === 0 || activeLayers.length <= 1) return;
    const upper = activeLayers[index];
    const lower = activeLayers[index - 1];
    if (!upper || !lower) return;

    const lowerCtx = lower.canvas.getContext('2d');
    if (lowerCtx) {
      lowerCtx.save();
      lowerCtx.globalAlpha = upper.opacity / 100;
      lowerCtx.drawImage(upper.canvas, 0, 0);
      lowerCtx.restore();
    }

    setFrames(prev =>
      prev.map((f, fi) =>
        fi === activeFrameIndex
          ? { ...f, layers: f.layers.filter((_, i) => i !== index) }
          : f
      )
    );
    setActiveLayerIndex(index - 1);
    recordHistory('Merge Layer Down');
  };

  // Flip / Rotate operations
  const handleFlipHorizontal = () => {
    const layer = activeLayers[activeLayerIndex];
    if (!layer || layer.locked) return;
    flipCanvas(layer.canvas, true, false);
    triggerCanvasModified();
    recordHistory('Flip Horizontal');
  };

  const handleFlipVertical = () => {
    const layer = activeLayers[activeLayerIndex];
    if (!layer || layer.locked) return;
    flipCanvas(layer.canvas, false, true);
    triggerCanvasModified();
    recordHistory('Flip Vertical');
  };

  const handleRotateCw = () => {
    const layer = activeLayers[activeLayerIndex];
    if (!layer || layer.locked) return;
    rotateCanvas90(layer.canvas);
    triggerCanvasModified();
    recordHistory('Rotate 90°');
  };

  const handleInvertColors = () => {
    const layer = activeLayers[activeLayerIndex];
    if (!layer || layer.locked) return;
    invertColors(layer.canvas);
    triggerCanvasModified();
    recordHistory('Invert Colors');
  };

  // Save / Export handle
  const handleSave = useCallback(async (targetFileName?: string) => {
    const comp = compositeFrame(activeFrame, docWidth, docHeight);
    const dataUrl = comp.toDataURL('image/png');
    return {
      success: true,
      dataUrl,
      spriteData: {
        width: docWidth,
        height: docHeight,
        name: docName,
        fps,
        frames: frames.map(serializeFrame)
      }
    };
  }, [activeFrame, docWidth, docHeight, docName, fps, frames]);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    loadFile: async () => {},
    markClean: () => setIsDirty(false),
    requestExport: () => setShowExportDialog(true),
    postMessage: (msg: any) => {
      if (msg.type === 'REQUEST_SAVE') {
        handleSave().then(res => {
          window.postMessage({ type: 'SAVE_PROJECT_DATA', dataUrl: res.dataUrl }, '*');
        });
      }
    }
  }), [handleSave]);

  return (
    <div className={className}>
      {/* Studio Header Toolbar */}
      <div className="h-11 bg-[#17181d] border-b border-[#262833] flex items-center justify-between px-3 shrink-0 shadow-sm z-20">
        {/* Left Actions (Undo/Redo, Canvas Flips, Invert) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 disabled:opacity-30 border border-[#2d2f3d]"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 disabled:opacity-30 border border-[#2d2f3d]"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#262833] mx-1" />

          <button
            onClick={handleFlipHorizontal}
            title="Flip Horizontal"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 border border-[#2d2f3d]"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFlipVertical}
            title="Flip Vertical"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 border border-[#2d2f3d]"
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRotateCw}
            title="Rotate 90° Clockwise"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 border border-[#2d2f3d]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleInvertColors}
            title="Invert Colors"
            className="p-1.5 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 border border-[#2d2f3d]"
          >
            <SunMedium className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#262833] mx-1" />

          {/* Seamless Mode & Grid Toggles */}
          <button
            onClick={() => {
              setSeamlessMode(!seamlessMode);
              setSpraySettings(s => ({ ...s, seamlessMode: !seamlessMode }));
            }}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              seamlessMode
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                : 'bg-[#1f2027] text-neutral-400 border border-[#2d2f3d]'
            }`}
            title="Toggle 3x3 Seamless Texture Wrapping"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Seamless 3x3</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
              showGrid
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                : 'bg-[#1f2027] text-neutral-400 border border-[#2d2f3d]'
            }`}
            title="Toggle Pixel Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Actions: Resize Canvas & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResizeDialog(true)}
            className="px-2.5 py-1 rounded bg-[#1f2027] hover:bg-[#282a36] text-neutral-300 border border-[#2d2f3d] text-xs font-semibold flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Resize ({docWidth}×{docHeight})</span>
          </button>

          <button
            onClick={() => setShowExportDialog(true)}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Main Center Workspace */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Left Spray Settings & Tools */}
        <SpraySettingsPanel
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          settings={spraySettings}
          onUpdateSettings={setSpraySettings}
        />

        {/* Center Viewport Canvas with Compositor & 3x3 Simulation */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          <ViewportCanvas
            width={docWidth}
            height={docHeight}
            layers={activeLayers}
            activeLayerIndex={activeLayerIndex}
            zoom={zoom}
            panX={panX}
            panY={panY}
            showGrid={showGrid}
            showTileGrid={showTileGrid}
            seamlessMode={seamlessMode}
            symmetry={symmetry}
            selection={selection}
            cursorPreview={cursorPreview}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={e => e.preventDefault()}
          />

          {/* Floating Zoom Bar */}
          <div className="absolute bottom-3 left-3 bg-[#18191e]/90 backdrop-blur border border-[#2d2f3d] rounded-lg px-2 py-1 flex items-center gap-2 text-neutral-300 text-[11px] shadow-lg">
            <span>Zoom</span>
            <input
              type="range"
              min={2}
              max={32}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-20 accent-amber-400 h-1 bg-neutral-700 rounded cursor-pointer"
            />
            <span className="font-mono text-amber-300">{zoom}x</span>
          </div>
        </div>

        {/* Right Color & Gradient Palette Studio */}
        <PaletteStudioPanel
          fgColor={fgColor}
          onChangeFgColor={setFgColor}
          paletteGroups={paletteGroups}
          onUpdatePaletteGroups={setPaletteGroups}
          selectedColorHexes={selectedColorHexes}
          onToggleColorSelection={handleToggleColorSelection}
          onClearColorSelection={() => setSelectedColorHexes(new Set([fgColor]))}
          onSelectAllGroupColors={handleSelectAllGroupColors}
          gradients={gradients}
          selectedGradientId={selectedGradientId}
          onSelectGradient={setSelectedGradientId}
          onAddGradient={(name, stops) => {
            const newGrad: GradientRamp = {
              id: `grad_${Date.now()}`,
              name,
              stops
            };
            setGradients(g => [...g, newGrad]);
            setSelectedGradientId(newGrad.id);
          }}
          sourceKind={spraySettings.sourceKind}
          onChangeSourceKind={kind => setSpraySettings(s => ({ ...s, sourceKind: kind }))}
        />
      </div>

      {/* Bottom Drawer Tabs: Animation Timeline / Layers */}
      <div className="h-28 bg-[#17181d] border-t border-[#262833] flex flex-col shrink-0">
        <div className="h-7 bg-[#14151a] border-b border-[#262833] px-3 flex items-center gap-4 text-[11px] font-semibold">
          <button
            onClick={() => setBottomDrawer('timeline')}
            className={`flex items-center gap-1.5 py-1 transition-all ${
              bottomDrawer === 'timeline'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Animation Timeline ({frames.length} frames)</span>
          </button>

          <button
            onClick={() => setBottomDrawer('layers')}
            className={`flex items-center gap-1.5 py-1 transition-all ${
              bottomDrawer === 'layers'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayersIcon className="w-3.5 h-3.5" />
            <span>Layer Stack ({activeLayers.length} layers)</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {bottomDrawer === 'timeline' ? (
            <AnimationTimeline
              frames={frames}
              activeFrameIndex={activeFrameIndex}
              width={docWidth}
              height={docHeight}
              fps={fps}
              loopMode={loopMode}
              onionSkinEnabled={false}
              onSelectFrame={setActiveFrameIndex}
              onAddFrame={() => {
                const newF = createDefaultFrame(docWidth, docHeight, `Frame ${frames.length + 1}`);
                setFrames(f => [...f, newF]);
                setActiveFrameIndex(frames.length);
                recordHistory('Add Frame');
              }}
              onDuplicateFrame={idx => {
                const src = frames[idx];
                if (!src) return;
                const dup: AnimationFrame = {
                  id: `frame_${Date.now()}`,
                  name: `${src.name} (Copy)`,
                  duration: src.duration,
                  layers: src.layers.map(l => ({
                    ...l,
                    id: `layer_${Date.now()}_${Math.random()}`,
                    canvas: cloneCanvas(l.canvas)
                  }))
                };
                setFrames(f => [...f.slice(0, idx + 1), dup, ...f.slice(idx + 1)]);
                setActiveFrameIndex(idx + 1);
                recordHistory('Duplicate Frame');
              }}
              onDeleteFrame={idx => {
                if (frames.length <= 1) return;
                setFrames(f => f.filter((_, i) => i !== idx));
                setActiveFrameIndex(Math.max(0, idx - 1));
                recordHistory('Delete Frame');
              }}
              onMoveFrame={() => {}}
              onChangeFps={setFps}
              onChangeLoopMode={setLoopMode}
              onToggleOnionSkin={() => {}}
            />
          ) : (
            <div className="flex h-full">
              <LayersPanel
                layers={activeLayers}
                activeLayerIndex={activeLayerIndex}
                onSelectLayer={setActiveLayerIndex}
                onAddLayer={handleAddLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onDeleteLayer={handleDeleteLayer}
                onMergeDown={handleMergeDown}
                onMoveLayer={() => {}}
                onToggleLayerVisibility={idx => {
                  setFrames(prev =>
                    prev.map((f, fi) =>
                      fi === activeFrameIndex
                        ? {
                            ...f,
                            layers: f.layers.map((l, li) =>
                              li === idx ? { ...l, visible: !l.visible } : l
                            )
                          }
                        : f
                    )
                  );
                }}
                onToggleLayerLock={idx => {
                  setFrames(prev =>
                    prev.map((f, fi) =>
                      fi === activeFrameIndex
                        ? {
                            ...f,
                            layers: f.layers.map((l, li) =>
                              li === idx ? { ...l, locked: !l.locked } : l
                            )
                          }
                        : f
                    )
                  );
                }}
                onChangeLayerOpacity={(idx, op) => {
                  setFrames(prev =>
                    prev.map((f, fi) =>
                      fi === activeFrameIndex
                        ? {
                            ...f,
                            layers: f.layers.map((l, li) =>
                              li === idx ? { ...l, opacity: op } : l
                            )
                          }
                        : f
                    )
                  );
                }}
                onChangeLayerBlendMode={(idx, mode) => {
                  setFrames(prev =>
                    prev.map((f, fi) =>
                      fi === activeFrameIndex
                        ? {
                            ...f,
                            layers: f.layers.map((l, li) =>
                              li === idx ? { ...l, blendMode: mode } : l
                            )
                          }
                        : f
                    )
                  );
                }}
                onRenameLayer={(idx, name) => {
                  setFrames(prev =>
                    prev.map((f, fi) =>
                      fi === activeFrameIndex
                        ? {
                            ...f,
                            layers: f.layers.map((l, li) =>
                              li === idx ? { ...l, name } : l
                            )
                          }
                        : f
                    )
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resize Dialog */}
      <ResizeDialog
        isOpen={showResizeDialog}
        currentWidth={docWidth}
        currentHeight={docHeight}
        onClose={() => setShowResizeDialog(false)}
        onApplyResize={(newW, newH) => {
          setDocWidth(newW);
          setDocHeight(newH);
          setShowResizeDialog(false);
          recordHistory(`Resize ${newW}x${newH}`);
        }}
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
