import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, 
  Upload, 
  Cloud,
  Grid, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Sliders, 
  Maximize2, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  AlertTriangle,
  Layers,
  Info
} from 'lucide-react';
import { SpritesheetSliceModalProps, SpritesheetSliceResult } from './types';
import { useCanvasPanZoom } from '../../../hooks/useCanvasPanZoom';
import { CloudImageImportModal } from '../../CloudImageImportModal';

const PIXEL_PRESETS = [16, 24, 32, 48, 64, 128, 256];
const GRID_PRESETS = [
  { cols: 4, rows: 1, label: '4 × 1 (Strip)' },
  { cols: 5, rows: 1, label: '5 × 1 (Strip)' },
  { cols: 6, rows: 1, label: '6 × 1 (Strip)' },
  { cols: 8, rows: 1, label: '8 × 1 (Strip)' },
  { cols: 10, rows: 1, label: '10 × 1 (Strip)' },
  { cols: 4, rows: 4, label: '4 × 4 (16)' },
  { cols: 8, rows: 4, label: '8 × 4 (32)' },
  { cols: 8, rows: 8, label: '8 × 8 (64)' },
  { cols: 12, rows: 8, label: '12 × 8 (96)' },
  { cols: 16, rows: 16, label: '16 × 16 (256)' }
];

export const SpritesheetSliceModal: React.FC<SpritesheetSliceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  project,
  initialImage,
  initialImageSrc,
  initialName,
  title = 'Configure & Slice Spritesheet',
  sheetLabel
}) => {
  // Active image data
  const [imageSrc, setImageSrc] = useState<string>(initialImageSrc || initialImage?.url || '');
  const [sheetName, setSheetName] = useState<string>(initialName || initialImage?.name || sheetLabel || 'Spritesheet');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Slicing parameters
  const [splitMode, setSplitMode] = useState<'pixels' | 'columns'>(initialImage?.splitMode || 'columns');
  const [tileWidth, setTileWidth] = useState<number>(initialImage?.tileWidth || 64);
  const [tileHeight, setTileHeight] = useState<number>(initialImage?.tileHeight || 64);
  const [cols, setCols] = useState<number>(initialImage?.cols || 8);
  const [rows, setRows] = useState<number>(initialImage?.rows || 1);

  // Margins and Spacing
  const [marginX, setMarginX] = useState<number>(initialImage?.marginX || 0);
  const [marginY, setMarginY] = useState<number>(initialImage?.marginY || 0);
  const [spacingX, setSpacingX] = useState<number>(initialImage?.spacingX || 0);
  const [spacingY, setSpacingY] = useState<number>(initialImage?.spacingY || 0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Dynamic canvas viewport dimensions to prevent non-square distortion / stretching
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  // Animation preview tester
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [previewFps, setPreviewFps] = useState<number>(10);
  const [previewStartFrame, setPreviewStartFrame] = useState<number>(0);
  const [previewEndFrame, setPreviewEndFrame] = useState<number>(4);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  // Inspection
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number; index: number } | null>(null);

  // Viewport hook for canvas zoom & pan
  const {
    scale,
    pan,
    setScale,
    setPan,
    isPanning,
    containerRef,
    handleMouseDown,
    handleContextMenu,
    resetView,
    centerContent
  } = useCanvasPanZoom({
    minScale: 0.1,
    maxScale: 10.0,
    initialScale: 1.0,
    zoomSensitivity: 1.15
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCloudPicker, setShowCloudPicker] = useState(false);

  // Auto-resize canvas buffer to match container DOM dimensions without stretching
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        setCanvasDimensions({ width: w, height: h });
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  // Smart Auto-Detect Grid Algorithm based on image geometry
  const autoDetectGrid = useCallback((w: number, h: number) => {
    if (w <= 0 || h <= 0) return;

    const availW = Math.max(1, w - marginX * 2);
    const availH = Math.max(1, h - marginY * 2);

    // 1. Check if single row horizontal strip of squares (e.g. 5x1 strip, 160x32 or 320x64)
    if (availW >= availH && availH > 0 && availW % availH === 0) {
      const c = Math.round(availW / availH);
      setCols(c);
      setRows(1);
      setTileWidth(availH);
      setTileHeight(availH);
      setPreviewStartFrame(0);
      setPreviewEndFrame(Math.max(0, c - 1));
      return;
    }

    // 2. Test common square tile sizes [64, 32, 48, 16, 128, 24, 256, 8]
    const candidates = [64, 32, 48, 16, 128, 24, 256, 8];
    for (const size of candidates) {
      if (availW % size === 0 && availH % size === 0) {
        const c = Math.round(availW / size);
        const r = Math.round(availH / size);
        setCols(c);
        setRows(r);
        setTileWidth(size);
        setTileHeight(size);
        setPreviewStartFrame(0);
        setPreviewEndFrame(Math.min(c * r - 1, 7));
        return;
      }
    }

    // 3. Fallback: divide width and height into nearest square-ish tiles
    const targetSize = Math.min(64, Math.max(16, availH));
    const c = Math.max(1, Math.round(availW / targetSize));
    const r = Math.max(1, Math.round(availH / targetSize));
    const tw = Math.max(1, Math.floor(availW / c));
    const th = Math.max(1, Math.floor(availH / r));

    setCols(c);
    setRows(r);
    setTileWidth(tw);
    setTileHeight(th);
    setPreviewStartFrame(0);
    setPreviewEndFrame(Math.min(c * r - 1, 7));
  }, [marginX, marginY]);

  // Load image element when source changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width || 512;
      const h = img.naturalHeight || img.height || 256;
      setImageDimensions({ width: w, height: h });
      setImageElement(img);

      // If initialImage didn't provide complete custom config, run smart auto-detection
      if (!initialImage?.tileWidth && !initialImage?.cols) {
        autoDetectGrid(w, h);
      } else {
        // If initialImage provided rows/cols or tileWidth, validate and set preview range
        const total = (initialImage?.cols || cols) * (initialImage?.rows || rows);
        setPreviewEndFrame(Math.max(0, Math.min(total - 1, 7)));
      }

      // Center image in canvas viewport
      centerContent(w, h, Math.min(1.5, Math.max(0.5, 400 / Math.max(w, h))));
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Recalculate dependent dimension when splitMode or parameters change
  const computedStats = useMemo(() => {
    const imgW = imageDimensions.width || 512;
    const imgH = imageDimensions.height || 256;

    let effTw = tileWidth;
    let effTh = tileHeight;
    let effCols = cols;
    let effRows = rows;

    if (splitMode === 'pixels') {
      effTw = Math.max(1, tileWidth);
      effTh = Math.max(1, tileHeight);
      const availW = Math.max(0, imgW - marginX * 2);
      const availH = Math.max(0, imgH - marginY * 2);
      effCols = Math.max(1, Math.floor((availW + spacingX) / (effTw + spacingX)));
      effRows = Math.max(1, Math.floor((availH + spacingY) / (effTh + spacingY)));
    } else {
      effCols = Math.max(1, cols);
      effRows = Math.max(1, rows);
      const availW = Math.max(0, imgW - marginX * 2);
      const availH = Math.max(0, imgH - marginY * 2);
      effTw = Math.max(1, Math.floor((availW - (effCols - 1) * spacingX) / effCols));
      effTh = Math.max(1, Math.floor((availH - (effRows - 1) * spacingY) / effRows));
    }

    const total = effCols * effRows;
    return {
      tileWidth: effTw,
      tileHeight: effTh,
      cols: effCols,
      rows: effRows,
      totalFrames: total,
      isExcessive: total > 1024
    };
  }, [splitMode, tileWidth, tileHeight, cols, rows, imageDimensions, marginX, marginY, spacingX, spacingY]);

  // Synchronize when switching between pixels & columns modes without resetting geometry
  const handleSetSplitMode = (mode: 'pixels' | 'columns') => {
    if (mode === 'pixels') {
      setTileWidth(computedStats.tileWidth);
      setTileHeight(computedStats.tileHeight);
    } else {
      setCols(computedStats.cols);
      setRows(computedStats.rows);
    }
    setSplitMode(mode);
  };

  // Keep preview range valid
  useEffect(() => {
    if (previewEndFrame >= computedStats.totalFrames) {
      setPreviewEndFrame(Math.max(0, computedStats.totalFrames - 1));
    }
  }, [computedStats.totalFrames, previewEndFrame]);

  // Animation playback loop for mini-tester
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 1000 / Math.max(1, previewFps);

    const timer = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev < previewStartFrame || prev >= previewEndFrame) {
          return previewStartFrame;
        }
        return prev + 1 > previewEndFrame ? previewStartFrame : prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, previewFps, previewStartFrame, previewEndFrame]);

  // Draw current frame slice onto preview mini canvas
  useEffect(() => {
    const cvs = previewCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (imageElement && computedStats.cols > 0 && computedStats.rows > 0) {
      const { cols: effCols, tileWidth: tw, tileHeight: th } = computedStats;
      const c = currentFrameIndex % effCols;
      const r = Math.floor(currentFrameIndex / effCols);

      const srcX = marginX + c * (tw + spacingX);
      const srcY = marginY + r * (th + spacingY);

      ctx.imageSmoothingEnabled = false;

      // Fit frame aspect ratio into preview canvas (64x64)
      const maxDim = Math.max(tw, th, 1);
      const drawW = (tw / maxDim) * cvs.width;
      const drawH = (th / maxDim) * cvs.height;
      const drawX = (cvs.width - drawW) / 2;
      const drawY = (cvs.height - drawH) / 2;

      ctx.drawImage(
        imageElement,
        srcX, srcY, tw, th,
        drawX, drawY, drawW, drawH
      );
    }
  }, [imageElement, currentFrameIndex, computedStats, marginX, marginY, spacingX, spacingY]);

  // Render Grid Overlay on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background checkered pattern
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // Render image
    if (imageElement && imageDimensions.width > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(imageElement, 0, 0, imageDimensions.width, imageDimensions.height);

      // Spritesheet boundary outline
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeRect(0, 0, imageDimensions.width, imageDimensions.height);

      // Draw Grid Slices
      const { cols: effCols, rows: effRows, tileWidth: tw, tileHeight: th } = computedStats;

      ctx.lineWidth = 1 / scale;
      for (let r = 0; r < effRows; r++) {
        for (let c = 0; c < effCols; c++) {
          const x = marginX + c * (tw + spacingX);
          const y = marginY + r * (th + spacingY);
          const fIdx = r * effCols + c;

          const isHovered = hoveredCell && hoveredCell.col === c && hoveredCell.row === r;
          const isInAnimRange = fIdx >= previewStartFrame && fIdx <= previewEndFrame;

          if (isHovered) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
            ctx.fillRect(x, y, tw, th);
            ctx.strokeStyle = '#c084fc';
          } else if (isInAnimRange) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
            ctx.fillRect(x, y, tw, th);
            ctx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          }

          ctx.strokeRect(x, y, tw, th);

          // Draw Frame Index Badge
          if (scale > 0.4) {
            ctx.fillStyle = isHovered ? '#f3e8ff' : '#94a3b8';
            ctx.font = `${Math.max(9, Math.min(12, Math.round(tw * 0.2)))}px monospace`;
            ctx.fillText(`#${fIdx}`, x + 3, y + Math.min(13, th - 2));
          }
        }
      }
    } else {
      // Empty state prompt
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No spritesheet image loaded. Upload an image to begin slicing.', width / (2 * scale), height / (2 * scale));
    }

    ctx.restore();
  }, [pan, scale, imageElement, imageDimensions, computedStats, hoveredCell, previewStartFrame, previewEndFrame, marginX, marginY, spacingX, spacingY]);

  // Track hover coordinate to highlight cell
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageElement || isPanning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    const { cols: effCols, rows: effRows, tileWidth: tw, tileHeight: th } = computedStats;

    if (
      worldX >= marginX &&
      worldX <= imageDimensions.width &&
      worldY >= marginY &&
      worldY <= imageDimensions.height
    ) {
      const col = Math.floor((worldX - marginX) / (tw + spacingX));
      const row = Math.floor((worldY - marginY) / (th + spacingY));
      if (col >= 0 && col < effCols && row >= 0 && row < effRows) {
        const index = row * effCols + col;
        setHoveredCell({ col, row, index });
        return;
      }
    }
    setHoveredCell(null);
  };

  // Commit and apply result
  const handleConfirmSlice = () => {
    if (!imageSrc) return;
    const result: SpritesheetSliceResult = {
      imageUrl: imageSrc,
      dataUrl: imageSrc,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height,
      tileWidth: computedStats.tileWidth,
      tileHeight: computedStats.tileHeight,
      cols: computedStats.cols,
      rows: computedStats.rows,
      totalFrames: computedStats.totalFrames,
      splitMode,
      marginX,
      marginY,
      spacingX,
      spacingY,
      name: sheetName
    };
    onConfirm(result);
    onClose();
  };

  // Sync initial parameters whenever the modal becomes active or initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialImageSrc || initialImage?.url) {
        setImageSrc(initialImageSrc || initialImage?.url || '');
      }
      if (initialName || initialImage?.name || sheetLabel) {
        setSheetName(initialName || initialImage?.name || sheetLabel || 'Spritesheet');
      }
      if (initialImage?.splitMode) setSplitMode(initialImage.splitMode);
      if (initialImage?.tileWidth) setTileWidth(initialImage.tileWidth);
      if (initialImage?.tileHeight) setTileHeight(initialImage.tileHeight);
      if (initialImage?.cols) setCols(initialImage.cols);
      if (initialImage?.rows) setRows(initialImage.rows);
      if (initialImage?.marginX !== undefined) setMarginX(initialImage.marginX);
      if (initialImage?.marginY !== undefined) setMarginY(initialImage.marginY);
      if (initialImage?.spacingX !== undefined) setSpacingX(initialImage.spacingX);
      if (initialImage?.spacingY !== undefined) setSpacingY(initialImage.spacingY);
    }
  }, [isOpen, initialImageSrc, initialImage, initialName, sheetLabel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-6xl h-[90vh] max-h-[860px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Grid size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="text-xs font-mono font-normal text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {sheetName}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Configure tile metrics, preview slicing grid overlays, and test playback before generating frames.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCloudPicker(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/70 text-neutral-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Import image or spritesheet from Cloud Drive, Local File, or Virtual Drive"
            >
              <Upload size={13} className="text-emerald-400" />
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cloud Image Import Modal Integration */}
        {showCloudPicker && (
          <CloudImageImportModal
            isOpen={showCloudPicker}
            onClose={() => setShowCloudPicker(false)}
            project={project}
            mode="select_image"
            title="Import"
            activeSpriteName={sheetName}
            onSelectImage={(dataUrl, fileName) => {
              setImageSrc(dataUrl);
              setSheetName(fileName.replace(/\.[^.]+$/, ''));
              setShowCloudPicker(false);
            }}
          />
        )}

        {/* Content Body: Left Workspace (Canvas Viewport) + Right Config Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Canvas Viewport */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            className="flex-1 relative bg-neutral-950 overflow-hidden cursor-crosshair flex items-center justify-center border-r border-neutral-800"
          >
            <canvas
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredCell(null)}
              className="w-full h-full block"
            />

            {/* Viewport Floating Controls */}
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-1 rounded-xl border border-neutral-800 shadow-lg text-xs">
              <button
                type="button"
                onClick={() => setScale(s => Math.min(10, s * 1.2))}
                className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <span className="text-[10px] font-mono text-neutral-400 px-1 min-w-[45px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale(s => Math.max(0.1, s / 1.2))}
                className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <div className="w-px h-3.5 bg-neutral-800 mx-1" />
              <button
                type="button"
                onClick={() => centerContent(imageDimensions.width, imageDimensions.height, 1.0)}
                className="px-2 py-1 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-mono transition"
                title="Reset to 100%"
              >
                1:1
              </button>
              <button
                type="button"
                onClick={() => centerContent(imageDimensions.width, imageDimensions.height, Math.min(1.5, Math.max(0.5, 400 / Math.max(imageDimensions.width, imageDimensions.height))))}
                className="p-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition"
                title="Fit to Screen"
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* Hover Frame Coordinate Pill */}
            {hoveredCell && (
              <div className="absolute bottom-4 left-4 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-300 flex items-center gap-2.5 shadow-lg">
                <span className="text-purple-400 font-bold">Frame #{hoveredCell.index}</span>
                <span>•</span>
                <span className="text-neutral-400">Col {hoveredCell.col}, Row {hoveredCell.row}</span>
                <span>•</span>
                <span className="text-neutral-400">
                  X: {marginX + hoveredCell.col * (computedStats.tileWidth + spacingX)}px, 
                  Y: {marginY + hoveredCell.row * (computedStats.tileHeight + spacingY)}px
                </span>
              </div>
            )}

            {/* Empty Image State Prompt */}
            {!imageSrc && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 p-6 z-20">
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
                    <Grid size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Select Spritesheet Image</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Import a spritesheet from Cloud Drive, Virtual Drive, or your local device to configure slicing.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCloudPicker(true)}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/50"
                    >
                      <Upload size={15} />
                      <span>Import Image (Cloud, Virtual Drive, Local)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Instruction tooltip */}
            <div className="absolute bottom-4 right-4 bg-neutral-900/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-neutral-800/80 text-[10px] text-neutral-400 pointer-events-none">
              Mouse Wheel: Zoom • Right-Click / Middle-Click / Space+Drag: Pan
            </div>
          </div>

          {/* Right Configuration Sidebar */}
          <div className="w-96 bg-neutral-900/60 flex flex-col justify-between overflow-y-auto p-5 space-y-5">
            
            <div className="space-y-5">
              {/* Sheet Metadata / Name + Auto-Detect Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Spritesheet Name
                  </label>
                  <button
                    type="button"
                    onClick={() => autoDetectGrid(imageDimensions.width, imageDimensions.height)}
                    className="text-[10px] font-bold text-purple-300 hover:text-purple-200 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                    title="Auto-detect grid rows, columns, and tile sizes from image dimensions"
                  >
                    <Sparkles size={11} className="text-purple-400" />
                    <span>Auto-Detect Grid</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. Hero_Attack_Sheet"
                />
              </div>

              {/* Slicing Method Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Slicing Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleSetSplitMode('columns')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      splitMode === 'columns'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <span>🗂 Grid (Cols×Rows)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSplitMode('pixels')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      splitMode === 'pixels'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <span>📏 Tile Pixels (W×H)</span>
                  </button>
                </div>
              </div>

              {/* Slicing Controls depending on Mode */}
              {splitMode === 'columns' ? (
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-neutral-300 font-bold block">Columns (count)</label>
                        <span className="text-[9px] text-purple-400 font-mono">{computedStats.tileWidth}px/col</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={128}
                        value={cols}
                        onChange={(e) => setCols(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-neutral-900 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-neutral-300 font-bold block">Rows (count)</label>
                        <span className="text-[9px] text-purple-400 font-mono">{computedStats.tileHeight}px/row</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={128}
                        value={rows}
                        onChange={(e) => setRows(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-neutral-900 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Quick Row Count Selector */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] text-neutral-400 font-mono block">Quick Rows:</span>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 6, 8].map(rCount => (
                        <button
                          key={rCount}
                          type="button"
                          onClick={() => setRows(rCount)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition ${
                            rows === rCount
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          {rCount === 1 ? '1 Row (Strip)' : `${rCount} Rows`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Column Count Selector */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] text-neutral-400 font-mono block">Quick Columns:</span>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(cCount => (
                        <button
                          key={cCount}
                          type="button"
                          onClick={() => setCols(cCount)}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono transition ${
                            cols === cCount
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          {cCount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-neutral-400 font-mono block">Standard Presets:</span>
                    <div className="grid grid-cols-2 gap-1">
                      {GRID_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setCols(preset.cols);
                            setRows(preset.rows);
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-mono transition text-left ${
                            cols === preset.cols && rows === preset.rows
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-neutral-300 font-bold block">Tile Width (px)</label>
                        <span className="text-[9px] text-purple-400 font-mono">{computedStats.cols} cols</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={imageDimensions.width || 4096}
                        value={tileWidth}
                        onChange={(e) => setTileWidth(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-neutral-900 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-neutral-300 font-bold block">Tile Height (px)</label>
                        <span className="text-[9px] text-purple-400 font-mono">{computedStats.rows} rows</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={imageDimensions.height || 4096}
                        value={tileHeight}
                        onChange={(e) => setTileHeight(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-neutral-900 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Pixel Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-neutral-400 font-mono block">Standard Pixel Presets:</span>
                    <div className="flex flex-wrap gap-1">
                      {PIXEL_PRESETS.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setTileWidth(size);
                            setTileHeight(size);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                            tileWidth === size && tileHeight === size
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          {size}×{size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Margins & Spacing Accordion */}
              <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/60">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-neutral-300 hover:bg-neutral-900/80 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders size={13} className="text-purple-400" />
                    Padding & Spacing Offsets
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {showAdvanced ? 'Hide' : 'Configure'}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="p-3.5 border-t border-neutral-800/80 grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block mb-1">Margin X (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={marginX}
                        onChange={(e) => setMarginX(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block mb-1">Margin Y (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={marginY}
                        onChange={(e) => setMarginY(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block mb-1">Spacing X (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={spacingX}
                        onChange={(e) => setSpacingX(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-400 font-bold block mb-1">Spacing Y (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={spacingY}
                        onChange={(e) => setSpacingY(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculated Slicing Summary & Statistics */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400 pb-1.5 border-b border-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Image Dimension:</span>
                  <span className="text-white">{imageDimensions.width} × {imageDimensions.height} px</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pb-1.5 border-b border-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Calculated Grid:</span>
                  <span className="text-purple-300 font-bold">
                    {computedStats.cols} cols × {computedStats.rows} rows
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pb-1.5 border-b border-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Tile Dimensions:</span>
                  <span className="text-purple-300 font-bold">
                    {computedStats.tileWidth} × {computedStats.tileHeight} px
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pt-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Total Frames:</span>
                  <span className={`font-bold ${computedStats.isExcessive ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {computedStats.totalFrames} frames
                  </span>
                </div>

                {computedStats.isExcessive && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-200 text-[10px] flex items-start gap-1.5 font-sans">
                    <AlertTriangle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                    <span>Large frame count detected ({computedStats.totalFrames}). Please verify your tile dimensions or column/row settings.</span>
                  </div>
                )}
              </div>

              {/* Real-time Interactive Animation Preview Tester */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-400" />
                    Animation Playback Tester
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-purple-300 transition"
                    title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Miniature Animated Box */}
                  <div 
                    className="w-16 h-16 bg-neutral-900 border border-purple-500/40 rounded-xl overflow-hidden flex items-center justify-center relative shrink-0 shadow-inner"
                  >
                    {imageSrc && computedStats.cols > 0 && computedStats.rows > 0 ? (
                      <canvas
                        ref={previewCanvasRef}
                        width={64}
                        height={64}
                        className="w-full h-full image-rendering-pixelated"
                      />
                    ) : (
                      <div className="text-[9px] text-neutral-600 font-mono">No Image</div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-purple-300">
                      #{currentFrameIndex}
                    </span>
                  </div>

                  {/* Playback Settings */}
                  <div className="flex-1 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between text-neutral-400 font-mono">
                      <span>Test Speed:</span>
                      <span className="text-white font-bold">{previewFps} FPS</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={60}
                      value={previewFps}
                      onChange={(e) => setPreviewFps(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>
                        <span className="text-[9px] text-neutral-500 block">Start Frame</span>
                        <input
                          type="number"
                          min={0}
                          max={computedStats.totalFrames - 1}
                          value={previewStartFrame}
                          onChange={(e) => setPreviewStartFrame(Math.min(previewEndFrame, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-white font-mono text-[10px]"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 block">End Frame</span>
                        <input
                          type="number"
                          min={previewStartFrame}
                          max={computedStats.totalFrames - 1}
                          value={previewEndFrame}
                          onChange={(e) => setPreviewEndFrame(Math.max(previewStartFrame, Math.min(computedStats.totalFrames - 1, Number(e.target.value) || 0)))}
                          className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-white font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!imageSrc || computedStats.totalFrames <= 0}
                onClick={handleConfirmSlice}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-600/30"
              >
                <Check size={14} />
                <span>Confirm & Slice Spritesheet</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
