import React, { useRef, useEffect, useCallback } from 'react';
import { Layer, SelectionState, SymmetryMode } from '../types';

interface ViewportCanvasProps {
  width: number;
  height: number;
  layers: Layer[];
  activeLayerIndex: number;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showTileGrid: boolean;
  seamlessMode: boolean;
  symmetry: SymmetryMode;
  selection: SelectionState | null;
  cursorPreview: { x: number; y: number; radius: number; shape: string } | null;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  width,
  height,
  layers,
  zoom,
  panX,
  panY,
  showGrid,
  showTileGrid,
  seamlessMode,
  symmetry,
  selection,
  cursorPreview,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onContextMenu
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw compositor whenever layers or viewport settings update
  useEffect(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw 3x3 Seamless tiles in the background if seamlessMode is active
    if (seamlessMode) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      const tileOffsets = [
        [-width, -height], [0, -height], [width, -height],
        [-width, 0],                      [width, 0],
        [-width, height],  [0, height],  [width, height]
      ];

      for (const [ox, oy] of tileOffsets) {
        for (const layer of layers) {
          if (!layer.visible) continue;
          ctx.save();
          ctx.globalAlpha = (layer.opacity / 100) * 0.45;
          ctx.drawImage(layer.canvas, ox, oy);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // Draw main frame composite
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : (layer.blendMode as any);
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }

    // Draw floating selection if active
    if (selection && selection.floatingCanvas && selection.isFloating) {
      ctx.save();
      ctx.drawImage(selection.floatingCanvas, selection.x, selection.y);
      ctx.restore();
    }
  }, [layers, width, height, seamlessMode, selection]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#121316] select-none cursor-crosshair flex items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {/* Checkerboard Background Canvas Container */}
      <div
        className="relative shadow-2xl transition-transform duration-75 origin-center"
        style={{
          width: `${width * zoom}px`,
          height: `${height * zoom}px`,
          transform: `translate(${panX}px, ${panY}px)`
        }}
      >
        {/* Checkerboard Pattern */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[2px]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #1e2026 25%, transparent 25%),
              linear-gradient(-45deg, #1e2026 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1e2026 75%),
              linear-gradient(-45deg, transparent 75%, #1e2026 75%)
            `,
            backgroundSize: `${Math.max(8, zoom * 2)}px ${Math.max(8, zoom * 2)}px`,
            backgroundPosition: `0 0, 0 ${Math.max(4, zoom)}px, ${Math.max(4, zoom)}px -${Math.max(4, zoom)}px, -${Math.max(4, zoom)}px 0px`,
            backgroundColor: '#16171d'
          }}
        />

        {/* Composited Sprite Pixel Canvas */}
        <canvas
          ref={compositeCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onContextMenu={onContextMenu}
        />

        {/* Pixel Grid Overlay */}
        {showGrid && zoom >= 4 && (
          <div
            className="absolute inset-0 pointer-events-none border border-white/10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: `${zoom}px ${zoom}px`
            }}
          />
        )}

        {/* Symmetry Guide Lines */}
        {symmetry !== 'none' && (
          <div className="absolute inset-0 pointer-events-none">
            {(symmetry === 'horizontal' || symmetry === 'both') && (
              <div
                className="absolute top-0 bottom-0 border-l border-dashed border-cyan-400/60 z-20"
                style={{ left: `${(width / 2) * zoom}px` }}
              />
            )}
            {(symmetry === 'vertical' || symmetry === 'both') && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-cyan-400/60 z-20"
                style={{ top: `${(height / 2) * zoom}px` }}
              />
            )}
          </div>
        )}

        {/* Selection Marquee Overlay */}
        {selection && (
          <div
            className="absolute border border-dashed border-yellow-300 pointer-events-none animate-pulse z-30"
            style={{
              left: `${selection.x * zoom}px`,
              top: `${selection.y * zoom}px`,
              width: `${selection.w * zoom}px`,
              height: `${selection.h * zoom}px`
            }}
          />
        )}

        {/* Spray Brush Ring Preview */}
        {cursorPreview && (
          <div
            className="absolute rounded-full border border-white/60 pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 shadow-sm"
            style={{
              left: `${cursorPreview.x * zoom}px`,
              top: `${cursorPreview.y * zoom}px`,
              width: `${cursorPreview.radius * 2 * zoom}px`,
              height: `${cursorPreview.radius * 2 * zoom}px`,
              borderRadius: cursorPreview.shape === 'square' ? '2px' : '9999px'
            }}
          />
        )}
      </div>
    </div>
  );
};
