import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ToolType,
  Layer,
  AnimationFrame,
  BrushSettings,
  SelectionState,
  DitherPatternType
} from '../types';
import {
  createOffscreenCanvas,
  cloneCanvas,
  clearCanvas,
  drawBrushDab,
  drawBresenhamLine,
  floodFill,
  drawRectangle,
  drawEllipse,
  sprayDabs,
  compositeFrame,
  getSymmetricPoints
} from '../utils/canvasUtils';
import { hexToRgb, rgbToHex } from '../utils/palettes';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scan,
  RotateCw,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';

interface CanvasViewportProps {
  width: number;
  height: number;
  activeFrame: AnimationFrame;
  previousFrame?: AnimationFrame | null;
  activeLayerIndex: number;
  activeTool: ToolType;
  brushSettings: BrushSettings;
  primaryColor: string;
  secondaryColor: string;
  ditherPattern: DitherPatternType;
  showPixelGrid: boolean;
  showTileGrid: boolean;
  onionSkinEnabled: boolean;
  onModifyCanvas: (description: string) => void;
  onSampleColor: (hex: string) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  width,
  height,
  activeFrame,
  previousFrame,
  activeLayerIndex,
  activeTool,
  brushSettings,
  primaryColor,
  secondaryColor,
  ditherPattern,
  showPixelGrid,
  showTileGrid,
  onionSkinEnabled,
  onModifyCanvas,
  onSampleColor
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(16); // Default 16x zoom for 32x32
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Interactive drawing refs
  const isPaintingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const isSpacePressedRef = useRef<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const startDragPixelRef = useRef<{ x: number; y: number } | null>(null);

  // Track spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const activeLayer = activeFrame.layers[activeLayerIndex] || activeFrame.layers[0];

  // Center canvas on container
  const handleCenterCanvas = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasDisplayW = width * zoom;
    const canvasDisplayH = height * zoom;
    setPanOffset({
      x: Math.round((rect.width - canvasDisplayW) / 2),
      y: Math.round((rect.height - canvasDisplayH) / 2)
    });
  }, [width, height, zoom]);

  // Initial centering
  useEffect(() => {
    handleCenterCanvas();
  }, []);

  // Composite and render all layers onto the main canvas
  const renderMainCanvas = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;

    mainCanvas.width = width;
    mainCanvas.height = height;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    // 1. Onion skinning of previous frame (if enabled)
    if (onionSkinEnabled && previousFrame) {
      const prevComp = compositeFrame(previousFrame, width, height);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(prevComp, 0, 0);
      ctx.restore();
    }

    // 2. Composite all layers of current frame
    for (let i = 0; i < activeFrame.layers.length; i++) {
      const layer = activeFrame.layers[i];
      if (!layer.visible || layer.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      switch (layer.blendMode) {
        case 'multiply':
          ctx.globalCompositeOperation = 'multiply';
          break;
        case 'screen':
          ctx.globalCompositeOperation = 'screen';
          break;
        case 'overlay':
          ctx.globalCompositeOperation = 'overlay';
          break;
        default:
          ctx.globalCompositeOperation = 'source-over';
      }
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
  }, [width, height, activeFrame, previousFrame, onionSkinEnabled]);

  // Re-render main canvas when layers or frame changes
  useEffect(() => {
    renderMainCanvas();
  }, [renderMainCanvas]);

  // Render Grid Overlay
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;

    const displayW = width * zoom;
    const displayH = height * zoom;
    gridCanvas.width = displayW;
    gridCanvas.height = displayH;

    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, displayW, displayH);

    // 1. Pixel Grid (Subtle lines between pixels when zoom >= 4)
    if (showPixelGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x++) {
        const px = Math.floor(x * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, displayH);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y++) {
        const py = Math.floor(y * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(displayW, py);
        ctx.stroke();
      }
    }

    // 2. Tile Grid (16x16 / 32x32 blocks)
    if (showTileGrid) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan
      ctx.lineWidth = 1.5;

      const tileSize = 16;
      for (let x = 0; x <= width; x += tileSize) {
        const px = Math.floor(x * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, displayH);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += tileSize) {
        const py = Math.floor(y * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(displayW, py);
        ctx.stroke();
      }
    }

    // 3. Symmetry Axis Guide Lines
    if (brushSettings.symmetry !== 'none') {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // Pink mirror line
      ctx.lineWidth = 1;

      if (brushSettings.symmetry === 'horizontal' || brushSettings.symmetry === 'both') {
        const midX = Math.floor((width / 2) * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, displayH);
        ctx.stroke();
      }
      if (brushSettings.symmetry === 'vertical' || brushSettings.symmetry === 'both') {
        const midY = Math.floor((height / 2) * zoom) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(displayW, midY);
        ctx.stroke();
      }
    }
  }, [width, height, zoom, showPixelGrid, showTileGrid, brushSettings.symmetry]);

  // Convert screen coordinates to canvas pixel coordinates
  const screenToCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left - panOffset.x;
    const relY = clientY - rect.top - panOffset.y;

    const px = Math.floor(relX / zoom);
    const py = Math.floor(relY / zoom);

    if (px < 0 || px >= width || py < 0 || py >= height) {
      return null;
    }
    return { x: px, y: py };
  };

  // Zoom handlers
  const handleZoom = (delta: number, clientX?: number, clientY?: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.max(1, Math.min(64, delta > 0 ? prevZoom * 1.25 : prevZoom / 1.25));
      return Math.round(newZoom);
    });
  };

  // Wheel event for pan / zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      handleZoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    } else {
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Pointer Down (Mouse / Touch / Pen)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click or Spacebar = Pan
    if (e.button === 1 || activeTool === 'pan' || isSpacePressedRef.current) {
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0 && e.button !== 2) return; // Left or Right click only
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    const coords = screenToCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const isSecondary = e.button === 2;
    const colorHex = isSecondary ? secondaryColor : primaryColor;
    const colorRgba = hexToRgb(colorHex);

    isPaintingRef.current = true;
    startDragPixelRef.current = coords;
    lastPixelRef.current = coords;

    const layerCtx = activeLayer.canvas.getContext('2d', { willReadFrequently: true });
    if (!layerCtx) return;

    // Tool Execution
    if (activeTool === 'picker') {
      // Sample color from composite
      const mainCtx = mainCanvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (mainCtx) {
        const pixel = mainCtx.getImageData(coords.x, coords.y, 1, 1).data;
        if (pixel[3] > 0) {
          const sampledHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
          onSampleColor(sampledHex);
        }
      }
      isPaintingRef.current = false;
      return;
    }

    if (activeTool === 'fill') {
      floodFill(activeLayer.canvas, coords.x, coords.y, colorRgba, ditherPattern);
      renderMainCanvas();
      onModifyCanvas('Bucket Fill');
      isPaintingRef.current = false;
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const isEraser = activeTool === 'eraser';
      drawBresenhamLine(
        layerCtx,
        coords.x,
        coords.y,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.size,
        brushSettings.shape,
        brushSettings.pixelPerfect,
        ditherPattern,
        brushSettings.symmetry,
        width,
        height,
        isEraser
      );
      renderMainCanvas();
    } else if (activeTool === 'spray') {
      sprayDabs(
        layerCtx,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.sprayRadius,
        brushSettings.sprayDensity,
        ditherPattern
      );
      renderMainCanvas();
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    // Handle Panning
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y
      });
      return;
    }

    const coords = screenToCanvasCoords(e.clientX, e.clientY);
    setCursorPos(coords);

    if (!isPaintingRef.current || !coords || !activeLayer || activeLayer.locked) return;

    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    const colorHex = primaryColor;
    const colorRgba = hexToRgb(colorHex);

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const isEraser = activeTool === 'eraser';
      const last = lastPixelRef.current || coords;
      drawBresenhamLine(
        layerCtx,
        last.x,
        last.y,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.size,
        brushSettings.shape,
        brushSettings.pixelPerfect,
        ditherPattern,
        brushSettings.symmetry,
        width,
        height,
        isEraser
      );
      lastPixelRef.current = coords;
      renderMainCanvas();
    } else if (activeTool === 'spray') {
      sprayDabs(
        layerCtx,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.sprayRadius,
        brushSettings.sprayDensity,
        ditherPattern
      );
      lastPixelRef.current = coords;
      renderMainCanvas();
    } else if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'ellipse') {
      // Shape Preview Canvas
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      previewCanvas.width = width;
      previewCanvas.height = height;
      const previewCtx = previewCanvas.getContext('2d');
      if (!previewCtx) return;

      previewCtx.clearRect(0, 0, width, height);
      const start = startDragPixelRef.current || coords;

      if (activeTool === 'line') {
        drawBresenhamLine(
          previewCtx,
          start.x,
          start.y,
          coords.x,
          coords.y,
          colorRgba,
          brushSettings.size,
          brushSettings.shape,
          false,
          ditherPattern,
          brushSettings.symmetry,
          width,
          height,
          false
        );
      } else if (activeTool === 'rectangle') {
        drawRectangle(
          previewCtx,
          start.x,
          start.y,
          coords.x,
          coords.y,
          colorRgba,
          brushSettings.size,
          false,
          ditherPattern
        );
      } else if (activeTool === 'ellipse') {
        drawEllipse(
          previewCtx,
          start.x,
          start.y,
          coords.x,
          coords.y,
          colorRgba,
          brushSettings.size,
          false,
          ditherPattern
        );
      }
    }
  };

  // Pointer Up (Finalize Stroke/Shape)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;

    const coords = screenToCanvasCoords(e.clientX, e.clientY) || lastPixelRef.current;
    if (!coords || !activeLayer || activeLayer.locked) return;

    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    const colorRgba = hexToRgb(primaryColor);
    const start = startDragPixelRef.current || coords;

    if (activeTool === 'line') {
      drawBresenhamLine(
        layerCtx,
        start.x,
        start.y,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.size,
        brushSettings.shape,
        false,
        ditherPattern,
        brushSettings.symmetry,
        width,
        height,
        false
      );
    } else if (activeTool === 'rectangle') {
      drawRectangle(
        layerCtx,
        start.x,
        start.y,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.size,
        false,
        ditherPattern
      );
    } else if (activeTool === 'ellipse') {
      drawEllipse(
        layerCtx,
        start.x,
        start.y,
        coords.x,
        coords.y,
        colorRgba,
        brushSettings.size,
        false,
        ditherPattern
      );
    }

    // Clear preview canvas
    if (previewCanvasRef.current) {
      clearCanvas(previewCanvasRef.current);
    }

    renderMainCanvas();
    onModifyCanvas(`Tool ${activeTool}`);
    startDragPixelRef.current = null;
    lastPixelRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        isPaintingRef.current = false;
        isPanningRef.current = false;
        setCursorPos(null);
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="flex-1 h-full bg-neutral-950 relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      {/* Zoom / Viewport HUD Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 rounded-xl p-1 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          title="Zoom Out (Ctrl -)"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[11px] font-mono font-bold text-emerald-400 px-1.5">
          {zoom * 100}%
        </span>
        <button
          type="button"
          onClick={() => handleZoom(1)}
          title="Zoom In (Ctrl +)"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <ZoomIn size={14} />
        </button>
        <div className="w-px h-4 bg-neutral-800" />
        <button
          type="button"
          onClick={handleCenterCanvas}
          title="Center & Fit Canvas"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Canvas Wrapper Stage */}
      <div
        className="absolute transition-transform duration-75 ease-out shadow-2xl"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          width: width * zoom,
          height: height * zoom
        }}
      >
        {/* Checkerboard Background */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #18181b 25%, transparent 25%), 
              linear-gradient(-45deg, #18181b 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #18181b 75%), 
              linear-gradient(-45deg, transparent 75%, #18181b 75%)
            `,
            backgroundSize: `${Math.max(8, zoom * 2)}px ${Math.max(8, zoom * 2)}px`,
            backgroundColor: '#09090b'
          }}
        />

        {/* Main Composite Canvas */}
        <canvas
          ref={mainCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Shape / Tool Preview Canvas */}
        <canvas
          ref={previewCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Grid & Overlay Canvas */}
        <canvas
          ref={gridCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Cursor Pixel Highlight Box */}
        {cursorPos && (
          <div
            className="absolute border border-white/60 pointer-events-none transition-all duration-75"
            style={{
              left: cursorPos.x * zoom,
              top: cursorPos.y * zoom,
              width: Math.max(zoom, brushSettings.size * zoom),
              height: Math.max(zoom, brushSettings.size * zoom),
              transform: brushSettings.size > 1 ? `translate(-${Math.floor(brushSettings.size / 2) * zoom}px, -${Math.floor(brushSettings.size / 2) * zoom}px)` : 'none'
            }}
          />
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2 left-3 z-20 flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1 text-[11px] text-neutral-400 font-mono shadow-md backdrop-blur">
        <span>
          Cursor: <strong className="text-white">{cursorPos ? `${cursorPos.x}, ${cursorPos.y}` : '--, --'}</strong>
        </span>
        <span>•</span>
        <span>
          Canvas: <strong className="text-emerald-400">{width}×{height}</strong>
        </span>
        <span>•</span>
        <span>
          Layer: <strong className="text-cyan-400">{activeLayer?.name || 'Layer 1'}</strong>
        </span>
      </div>
    </div>
  );
};
