
function getLineGridCells(r0: number, c0: number, r1: number, c1: number): Array<{ row: number; col: number }> {
  const points: Array<{ row: number; col: number }> = [];
  const dx = Math.abs(c1 - c0);
  const dy = Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sy = r0 < r1 ? 1 : -1;
  let err = dx - dy;

  let curX = c0;
  let curY = r0;

  while (true) {
    points.push({ row: curY, col: curX });
    if (curX === c1 && curY === r1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
  }
  return points;
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell, renderPureAlbedoCell } from '../engine/tileMaterialRenderer';
import { TileShape } from '../engine/tileShape';
import { resolveAutoTileShape } from '../engine/autoTileSlopeSolver';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { 
  Layers, 
  Play, 
  Download, 
  Eye, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Paintbrush,
  Eraser,
  RotateCcw,
  Sparkle
} from 'lucide-react';

interface BlobTilesetPreviewProps {
  tileType: BiomeTileType;
  onUpdateTileType?: (updated: BiomeTileType) => void;
}

const DEFAULT_COLS = 12;
const DEFAULT_ROWS = 8;

function createEmptyGrid(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function createIslandPreset(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): number[][] {
  const g = createEmptyGrid(rows, cols);
  for (let r = 2; r < rows - 1; r++) {
    for (let c = 2; c < cols - 2; c++) {
      if (g[r]) g[r][c] = 1;
    }
  }
  if (g[1]) {
    if (g[1].length > 4) g[1][4] = 1;
    if (g[1].length > 5) g[1][5] = 1;
    if (g[1].length > 6) g[1][6] = 1;
    if (g[1].length > 7) g[1][7] = 1;
  }
  if (g[4]) {
    if (g[4].length > 4) g[4][4] = 0;
    if (g[4].length > 5) g[4][5] = 0;
  }
  if (g[5]) {
    if (g[5].length > 4) g[5][4] = 0;
    if (g[5].length > 5) g[5][5] = 0;
  }
  return g;
}

function createPlatformPreset(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): number[][] {
  const g = createEmptyGrid(rows, cols);
  for (let c = 0; c < cols; c++) {
    if (rows >= 2 && g[rows - 2]) g[rows - 2][c] = 1;
    if (rows >= 1 && g[rows - 1]) g[rows - 1][c] = 1;
  }
  if (g[3]) {
    for (let c = 2; c <= Math.min(5, cols - 1); c++) g[3][c] = 1;
  }
  if (g[4]) {
    for (let c = 7; c <= Math.min(9, cols - 1); c++) g[4][c] = 1;
  }
  return g;
}

export const BlobTilesetPreview: React.FC<BlobTilesetPreviewProps> = ({
  tileType,
  onUpdateTileType
}) => {
  const [viewMode, setViewMode] = useState<'albedo' | 'sandbox' | 'diagnostics'>('albedo');
  const [tileSize, setTileSize] = useState<number>(32);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [sandboxTool, setSandboxTool] = useState<'draw' | 'erase'>('draw');

  const [sandboxGrid, setSandboxGrid] = useState<number[][]>(() => createIslandPreset());
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const albedoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderTrigger, setRenderTrigger] = useState(0);

  const albedoCols = 8;
  const albedoRows = 8;
  const albedoWidth = albedoCols * tileSize;
  const albedoHeight = albedoRows * tileSize;

  const sandboxRows = sandboxGrid.length;
  const sandboxCols = sandboxGrid[0]?.length || 0;
  const sandboxWidth = sandboxCols * tileSize;
  const sandboxHeight = sandboxRows * tileSize;

  const albedoPanZoom = useCanvasPanZoom({
    minScale: 0.25,
    maxScale: 4.5,
    initialScale: 1.0,
    zoomSensitivity: 1.15
  });

  const sandboxPanZoom = useCanvasPanZoom({
    minScale: 0.25,
    maxScale: 4.5,
    initialScale: 1.0,
    zoomSensitivity: 1.15
  });

  useEffect(() => {
    if (viewMode === 'albedo' && albedoPanZoom.containerRef.current) {
      albedoPanZoom.centerContent(albedoWidth, albedoHeight, 1.0);
    }
  }, [viewMode, tileSize, albedoWidth, albedoHeight]);

  useEffect(() => {
    if (viewMode === 'sandbox' && sandboxPanZoom.containerRef.current) {
      sandboxPanZoom.centerContent(sandboxWidth, sandboxHeight, 1.0);
    }
  }, [viewMode, tileSize, sandboxWidth, sandboxHeight]);

  const forceRerender = useCallback(() => {
    setRenderTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (viewMode !== 'albedo') return;
    const canvas = albedoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    canvas.width = albedoWidth;
    canvas.height = albedoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < albedoRows; r++) {
      for (let c = 0; c < albedoCols; c++) {
        const screenX = c * tileSize;
        const screenY = r * tileSize;

        renderPureAlbedoCell(
          ctx,
          c,
          r,
          screenX,
          screenY,
          tileSize,
          tileType,
          forceRerender
        );

        if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }, [viewMode, tileType, tileSize, showGrid, renderTrigger, forceRerender, albedoWidth, albedoHeight]);

  useEffect(() => {
    if (viewMode !== 'sandbox') return;
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    canvas.width = sandboxWidth;
    canvas.height = sandboxHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const materialType = tileType.materialType || 'hard';
    const bevelProbability = tileType.bevelProbability ?? 0;

    for (let r = 0; r < sandboxRows; r++) {
      for (let c = 0; c < sandboxCols; c++) {
        const cellActive = sandboxGrid[r]?.[c] === 1;
        const screenX = c * tileSize;
        const screenY = r * tileSize;

        if (cellActive) {
          const hasTop = r > 0 && sandboxGrid[r - 1]?.[c] === 1;
          const hasBottom = r < sandboxRows - 1 && sandboxGrid[r + 1]?.[c] === 1;
          const hasLeft = c > 0 && sandboxGrid[r]?.[c - 1] === 1;
          const hasRight = c < sandboxCols - 1 && sandboxGrid[r]?.[c + 1] === 1;
          const hasTopLeft = r > 0 && c > 0 && sandboxGrid[r - 1]?.[c - 1] === 1;
          const hasTopRight = r > 0 && c < sandboxCols - 1 && sandboxGrid[r - 1]?.[c + 1] === 1;
          const hasBottomLeft = r < sandboxRows - 1 && c > 0 && sandboxGrid[r + 1]?.[c - 1] === 1;
          const hasBottomRight = r < sandboxRows - 1 && c < sandboxCols - 1 && sandboxGrid[r + 1]?.[c + 1] === 1;

          const effectiveShape: TileShape = resolveAutoTileShape(tileType.bevelProbability ?? 0, c, r, {
            hasTop,
            hasBottom,
            hasLeft,
            hasRight,
            hasTopLeft,
            hasTopRight,
            hasBottomLeft,
            hasBottomRight
          });

          renderRefinedTileCell(
            ctx,
            c,
            r,
            screenX,
            screenY,
            tileSize,
            tileType,
            {
              hasTop,
              hasBottom,
              hasLeft,
              hasRight,
              hasTopLeft,
              hasTopRight,
              hasBottomLeft,
              hasBottomRight
            },
            forceRerender,
            effectiveShape,
            1.0
          );
        }

        if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }, [sandboxGrid, tileType, tileSize, showGrid, viewMode, renderTrigger, forceRerender, sandboxWidth, sandboxHeight, sandboxRows, sandboxCols]);

  const dragTargetValRef = useRef<number>(1);
  const lastTouchedCellRef = useRef<string | null>(null);

  // Global mouseup window listener so releasing mouse anywhere stops drawing cleanly
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false);
      lastTouchedCellRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const applySandboxTile = (row: number, col: number, valToSet: number) => {
    if (row >= 0 && row < sandboxRows && col >= 0 && col < sandboxCols) {
      setSandboxGrid(prev => {
        if (!prev[row] || prev[row][col] === valToSet) return prev;
        const next = prev.map(r => [...r]);
        if (next[row]) next[row][col] = valToSet;
        return next;
      });
    }
  };

    const lastGridCoordRef = useRef<{ row: number; col: number } | null>(null);

  const applySandboxTilesBatch = (pts: Array<{ row: number; col: number }>, val: number) => {
    setSandboxGrid(prev => {
      let changed = false;
      const next = prev.map(r => [...r]);
      for (const pt of pts) {
        if (pt.row >= 0 && pt.row < next.length && pt.col >= 0 && pt.col < (next[0]?.length || 0)) {
          if (next[pt.row][pt.col] !== val) {
            next[pt.row][pt.col] = val;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  };

  const handleMouseDownSandbox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const col = Math.floor((clickX / rect.width) * sandboxCols);
    const row = Math.floor((clickY / rect.height) * sandboxRows);

    if (row >= 0 && row < sandboxRows && col >= 0 && col < sandboxCols) {
      setIsDrawing(true);
      const currentVal = sandboxGrid[row]?.[col] ?? 0;
      const targetVal = sandboxTool === 'erase' ? 0 : (currentVal === 1 ? 0 : 1);
      
      dragTargetValRef.current = targetVal;
      lastTouchedCellRef.current = `${row},${col}`;
      lastGridCoordRef.current = { row, col };
      applySandboxTilesBatch([{ row, col }], targetVal);
    }
  };

  const handleMouseMoveSandbox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.buttons !== 1) return;
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const col = Math.floor((clickX / rect.width) * sandboxCols);
    const row = Math.floor((clickY / rect.height) * sandboxRows);

    if (row >= 0 && row < sandboxRows && col >= 0 && col < sandboxCols) {
      if (lastGridCoordRef.current) {
        if (lastGridCoordRef.current.row === row && lastGridCoordRef.current.col === col) return;
        const pts = getLineGridCells(lastGridCoordRef.current.row, lastGridCoordRef.current.col, row, col);
        applySandboxTilesBatch(pts, dragTargetValRef.current);
      } else {
        applySandboxTilesBatch([{ row, col }], dragTargetValRef.current);
      }
      lastTouchedCellRef.current = `${row},${col}`;
      lastGridCoordRef.current = { row, col };
    }
  };

  const handleMouseUpSandbox = () => {
    setIsDrawing(false);
    lastTouchedCellRef.current = null;
    lastGridCoordRef.current = null;
  };

  const handleExportAlbedo = () => {
    const canvas = albedoCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${tileType.name.toLowerCase().replace(/\s+/g, '_')}_albedo_map.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>{tileType.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                (tileType.bevelProbability ?? 0) > 0
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-cyan-950 text-cyan-400 border-cyan-800'
              }`}>
                {(tileType.bevelProbability ?? 0) > 0 ? `${Math.round((tileType.bevelProbability ?? 0) * 100)}% Auto-Bevels` : 'Rigid Solid Block'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Procedural dual-noise material blending & autotiled 16px micro-grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('albedo')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'albedo'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Albedo Texture Map
          </button>
          <button
            onClick={() => setViewMode('sandbox')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'sandbox'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live Autotile Sandbox
          </button>
          <button
            onClick={() => setViewMode('diagnostics')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'diagnostics'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Material Layers
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Show Grid</span>
          </label>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 mr-1">Scale:</span>
            {[
              { sz: 16, label: '16px (1x)' },
              { sz: 32, label: '32px (2x)' },
              { sz: 64, label: '64px (4x)' }
            ].map(item => (
              <button
                key={item.sz}
                type="button"
                onClick={() => setTileSize(item.sz)}
                className={`px-1.5 py-0.5 rounded transition ${
                  tileSize === item.sz
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {viewMode === 'sandbox' && (
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSandboxTool('draw')}
                className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition ${
                  sandboxTool === 'draw'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paintbrush size={12} />
                Place Block
              </button>
              <button
                type="button"
                onClick={() => setSandboxTool('erase')}
                className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition ${
                  sandboxTool === 'erase'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eraser size={12} />
                Erase
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'albedo' && (
            <button
              onClick={handleExportAlbedo}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded flex items-center gap-1 font-medium transition-colors"
              title="Download full blended albedo texture PNG"
            >
              <Download className="w-3.5 h-3.5" />
              Export Albedo PNG
            </button>
          )}

          {viewMode === 'sandbox' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Presets:</span>
              <button
                onClick={() => setSandboxGrid(createIslandPreset())}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Dune & Cave
              </button>
              <button
                onClick={() => setSandboxGrid(createPlatformPreset())}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Platforms
              </button>
              <button
                onClick={() => setSandboxGrid(createEmptyGrid())}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-red-300 hover:text-red-200 rounded text-[11px]"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'albedo' && (
        <div className="flex flex-col gap-3">
          <div 
            ref={albedoPanZoom.containerRef}
            onMouseDown={albedoPanZoom.handleMouseDown}
            onContextMenu={albedoPanZoom.handleContextMenu}
            className={`relative w-full h-[380px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden select-none ${
              albedoPanZoom.isPanning ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${albedoWidth}px`,
                height: `${albedoHeight}px`,
                transform: `translate(${albedoPanZoom.pan.x}px, ${albedoPanZoom.pan.y}px) scale(${albedoPanZoom.scale})`,
                transformOrigin: '0 0',
                willChange: 'transform'
              }}
            >
              <canvas
                ref={albedoCanvasRef}
                className="block border border-slate-750 shadow-2xl rounded"
              />
            </div>

            <div data-no-paint="true" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs select-none">
              <div className="flex items-center gap-1 px-2 text-[10px] font-mono text-slate-400 border-r border-slate-800">
                <Move size={11} className="text-cyan-400" />
                <span>R-Click Pan • Wheel Zoom</span>
              </div>

              <button
                type="button"
                onClick={albedoPanZoom.zoomOut}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={() => albedoPanZoom.centerContent(albedoWidth, albedoHeight, 1.0)}
                className="px-1.5 py-0.5 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-mono text-[11px] font-semibold transition"
                title="Reset Zoom to 100% & Center"
              >
                {Math.round(albedoPanZoom.scale * 100)}%
              </button>

              <button
                type="button"
                onClick={albedoPanZoom.zoomIn}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>

              <button
                type="button"
                onClick={() => albedoPanZoom.centerContent(albedoWidth, albedoHeight, 1.0)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Center Canvas"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Continuous procedural dual-noise texture preview (8x8 continuous grid)</span>
            <span className="font-mono text-cyan-400">Resolution: {albedoWidth}x{albedoHeight}px</span>
          </div>
        </div>
      )}

      {viewMode === 'sandbox' && (
        <div className="flex flex-col gap-3">
          <div 
            ref={sandboxPanZoom.containerRef}
            onMouseDown={sandboxPanZoom.handleMouseDown}
            onContextMenu={sandboxPanZoom.handleContextMenu}
            className={`relative w-full h-[380px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden select-none ${
              sandboxPanZoom.isPanning ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${sandboxWidth}px`,
                height: `${sandboxHeight}px`,
                transform: `translate(${sandboxPanZoom.pan.x}px, ${sandboxPanZoom.pan.y}px) scale(${sandboxPanZoom.scale})`,
                transformOrigin: '0 0',
                willChange: 'transform'
              }}
            >
              <canvas
                ref={sandboxCanvasRef}
                onMouseDown={handleMouseDownSandbox}
                onMouseMove={handleMouseMoveSandbox}
                onMouseUp={handleMouseUpSandbox}
                onMouseLeave={handleMouseUpSandbox}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="block border border-slate-750 shadow-2xl rounded"
              />
            </div>

            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs select-none">
              <div className="flex items-center gap-1 px-2 text-[10px] font-mono text-slate-400 border-r border-slate-800">
                <Move size={11} className="text-cyan-400" />
                <span>L-Click: Place/Erase • R-Click: Pan</span>
              </div>

              <button
                type="button"
                onClick={sandboxPanZoom.zoomOut}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={() => sandboxPanZoom.centerContent(sandboxWidth, sandboxHeight, 1.0)}
                className="px-1.5 py-0.5 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-mono text-[11px] font-semibold transition"
                title="Reset Zoom to 100% & Center"
              >
                {Math.round(sandboxPanZoom.scale * 100)}%
              </button>

              <button
                type="button"
                onClick={sandboxPanZoom.zoomIn}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>

              <button
                type="button"
                onClick={() => sandboxPanZoom.centerContent(sandboxWidth, sandboxHeight, 1.0)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Center Sandbox"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Click or drag to place / erase tiles. Adjacent tiles automatically calculate 45° corner slopes and edge trims in real-time.
            </span>
            <span className="font-mono text-cyan-400">Interactive Sandbox</span>
          </div>
        </div>
      )}

      {viewMode === 'diagnostics' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Base Material A</span>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.baseMaterialA.albedoColor || '#334155' }}
              >
                {tileType.baseMaterialA.albedoTextureUrl ? (
                  <img
                    src={tileType.baseMaterialA.albedoTextureUrl}
                    alt="A"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col text-[11px] truncate">
                <span className="font-mono text-slate-200">Primary Strata</span>
                <span className="text-slate-400 font-mono text-[10px]">{tileType.baseMaterialA.albedoColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Base Material B</span>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.baseMaterialBAlbedoColor || '#1e293b' }}
              >
                {tileType.baseMaterialBTextureUrl ? (
                  <img
                    src={tileType.baseMaterialBTextureUrl}
                    alt="B"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col text-[11px] truncate">
                <span className="font-mono text-slate-200">Secondary Strata</span>
                <span className="text-slate-400 font-mono text-[10px]">{tileType.baseMaterialBAlbedoColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Top Edge Fringe</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Enabled:</span>
              <span className={Boolean(tileType.tileDetails.top.overlayTextureUrl || tileType.tileDetails.top.color) ? 'text-emerald-400' : 'text-slate-500'}>
                {Boolean(tileType.tileDetails.top.overlayTextureUrl || tileType.tileDetails.top.color) ? 'Yes' : 'No'}
              </span>
            </div>
            {Boolean(tileType.tileDetails.top.overlayTextureUrl || tileType.tileDetails.top.color) && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Thickness:</span>
                <span className="font-mono text-cyan-300">{tileType.tileDetails.top.thicknessPx}px</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5 text-[11px]">
            <span className="text-xs font-semibold text-slate-300 mb-1">Corner Topology</span>
            <div className="flex items-center justify-between text-slate-400">
              <span>Behavior:</span>
              <span className={`font-mono font-bold capitalize ${(tileType.materialType || 'hard') === 'soft' ? 'text-amber-400' : ((tileType.materialType || 'hard') === 'water' ? 'text-blue-400' : 'text-cyan-300')}`}>
                {tileType.materialType || 'hard'} Material
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 mt-1">
              <span>Shape:</span>
              <span className={`font-mono font-bold ${(tileType.bevelProbability ?? 0) > 0 ? 'text-amber-400' : 'text-cyan-300'}`}>
                {(tileType.bevelProbability ?? 0) > 0 ? `${Math.round((tileType.bevelProbability ?? 0) * 100)}% Auto-Bevels` : 'Square Blocks'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Noise Scale A:</span>
              <span className="font-mono text-cyan-300">{tileType.blendMap.noiseA.scale}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Contrast:</span>
              <span className="font-mono text-cyan-300">{tileType.blendMap.blendContrast}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
