import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell, AutotileNeighborMask } from '../engine/tileMaterialRenderer';
import { BLOB_47_TILESET, BlobTileDefinition } from '../engine/blobTilesetConfig';
import { useCanvasPanZoom } from '../hooks/useCanvasPanZoom';
import { 
  Layers, 
  Play, 
  Grid, 
  Download, 
  Eye, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Move, 
  RotateCcw 
} from 'lucide-react';

interface BlobTilesetPreviewProps {
  tileType: BiomeTileType;
  onUpdateTileType?: (updated: BiomeTileType) => void;
}

export const BlobTilesetPreview: React.FC<BlobTilesetPreviewProps> = ({
  tileType,
  onUpdateTileType
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'sandbox' | 'diagnostics'>('matrix');
  const [tileSize, setTileSize] = useState<number>(48);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredTileDef, setHoveredTileDef] = useState<BlobTileDefinition | null>(null);

  // Sandbox interactive grid (7x7 default layout with an island and pond)
  const [sandboxGrid, setSandboxGrid] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]);

  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderTrigger, setRenderTrigger] = useState(0);

  const matrixCols = 8;
  const matrixRows = 6;
  const matrixWidth = matrixCols * tileSize;
  const matrixHeight = matrixRows * tileSize;

  const sandboxRows = sandboxGrid.length;
  const sandboxCols = sandboxGrid[0].length;
  const sandboxWidth = sandboxCols * tileSize;
  const sandboxHeight = sandboxRows * tileSize;

  // Pan & Zoom for Matrix Canvas
  const matrixPanZoom = useCanvasPanZoom({
    minScale: 0.25,
    maxScale: 4.5,
    initialScale: 1.0,
    zoomSensitivity: 1.15
  });

  // Pan & Zoom for Sandbox Canvas
  const sandboxPanZoom = useCanvasPanZoom({
    minScale: 0.25,
    maxScale: 4.5,
    initialScale: 1.0,
    zoomSensitivity: 1.15
  });

  // Auto center matrix view on mount or tile size change
  const matrixCenteredRef = useRef(false);
  useEffect(() => {
    if (viewMode === 'matrix' && matrixPanZoom.containerRef.current) {
      matrixPanZoom.centerContent(matrixWidth, matrixHeight, 1.0);
    }
  }, [viewMode, tileSize, matrixWidth, matrixHeight]);

  // Auto center sandbox view on mode change or tile size change
  useEffect(() => {
    if (viewMode === 'sandbox' && sandboxPanZoom.containerRef.current) {
      sandboxPanZoom.centerContent(sandboxWidth, sandboxHeight, 1.0);
    }
  }, [viewMode, tileSize, sandboxWidth, sandboxHeight]);

  const forceRerender = useCallback(() => {
    setRenderTrigger(prev => prev + 1);
  }, []);

  // 1. Render the 47-Blob Tileset Matrix
  useEffect(() => {
    if (viewMode !== 'matrix' && viewMode !== 'diagnostics') return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    canvas.width = matrixWidth;
    canvas.height = matrixHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background checkerboard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    BLOB_47_TILESET.forEach((blobDef) => {
      const screenX = blobDef.gridCol * tileSize;
      const screenY = blobDef.gridRow * tileSize;

      const neighborMask: AutotileNeighborMask = {
        hasTop: blobDef.neighbors.top,
        hasBottom: blobDef.neighbors.bottom,
        hasLeft: blobDef.neighbors.left,
        hasRight: blobDef.neighbors.right,
        hasTopLeft: blobDef.neighbors.topLeft ?? (blobDef.neighbors.top && blobDef.neighbors.left),
        hasTopRight: blobDef.neighbors.topRight ?? (blobDef.neighbors.top && blobDef.neighbors.right),
        hasBottomLeft: blobDef.neighbors.bottomLeft ?? (blobDef.neighbors.bottom && blobDef.neighbors.left),
        hasBottomRight: blobDef.neighbors.bottomRight ?? (blobDef.neighbors.bottom && blobDef.neighbors.right)
      };

      renderRefinedTileCell(
        ctx,
        blobDef.gridCol,
        blobDef.gridRow,
        screenX,
        screenY,
        tileSize,
        tileType,
        neighborMask,
        forceRerender
      );

      // Grid line
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
      }

      // Small index tag
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(screenX + 2, screenY + 2, 16, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`#${blobDef.id}`, screenX + 4, screenY + 11);
    });
  }, [tileType, tileSize, showGrid, viewMode, renderTrigger, forceRerender, matrixWidth, matrixHeight]);

  // 2. Render Sandbox Playground
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

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let r = 0; r < sandboxRows; r++) {
      for (let c = 0; c < sandboxCols; c++) {
        ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // Render cells
    for (let r = 0; r < sandboxRows; r++) {
      for (let c = 0; c < sandboxCols; c++) {
        if (sandboxGrid[r][c] === 1) {
          const screenX = c * tileSize;
          const screenY = r * tileSize;

          const hasTop = r > 0 && sandboxGrid[r - 1][c] === 1;
          const hasBottom = r < sandboxRows - 1 && sandboxGrid[r + 1][c] === 1;
          const hasLeft = c > 0 && sandboxGrid[r][c - 1] === 1;
          const hasRight = c < sandboxCols - 1 && sandboxGrid[r][c + 1] === 1;
          const hasTopLeft = r > 0 && c > 0 && sandboxGrid[r - 1][c - 1] === 1;
          const hasTopRight = r > 0 && c < sandboxCols - 1 && sandboxGrid[r - 1][c + 1] === 1;
          const hasBottomLeft = r < sandboxRows - 1 && c > 0 && sandboxGrid[r + 1][c - 1] === 1;
          const hasBottomRight = r < sandboxRows - 1 && c < sandboxCols - 1 && sandboxGrid[r + 1][c + 1] === 1;

          const mask: AutotileNeighborMask = {
            hasTop,
            hasBottom,
            hasLeft,
            hasRight,
            hasTopLeft,
            hasTopRight,
            hasBottomLeft,
            hasBottomRight
          };

          renderRefinedTileCell(
            ctx,
            c,
            r,
            screenX,
            screenY,
            tileSize,
            tileType,
            mask,
            forceRerender
          );

          if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.strokeRect(screenX, screenY, tileSize, tileSize);
          }
        }
      }
    }
  }, [sandboxGrid, tileType, tileSize, showGrid, viewMode, renderTrigger, forceRerender, sandboxWidth, sandboxHeight, sandboxRows, sandboxCols]);

  // Handle matrix hover
  const handleMatrixMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (normX >= 0 && normX < 1 && normY >= 0 && normY < 1) {
      const col = Math.floor(normX * matrixCols);
      const row = Math.floor(normY * matrixRows);
      const found = BLOB_47_TILESET.find(b => b.gridCol === col && b.gridRow === row);
      setHoveredTileDef(found || null);
    } else {
      setHoveredTileDef(null);
    }
  };

  // Handle sandbox click
  const handleSandboxClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle left click for cell toggling
    if (e.button !== 0 || sandboxPanZoom.isPanning) return;

    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (normX >= 0 && normX < 1 && normY >= 0 && normY < 1) {
      const col = Math.floor(normX * sandboxCols);
      const row = Math.floor(normY * sandboxRows);

      if (row >= 0 && row < sandboxRows && col >= 0 && col < sandboxCols) {
        setSandboxGrid(prev => {
          const next = prev.map(r => [...r]);
          next[row][col] = next[row][col] === 1 ? 0 : 1;
          return next;
        });
      }
    }
  };

  const handleExportAtlas = () => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${tileType.id}_blob_tileset_atlas.png`;
    link.href = dataUrl;
    link.click();
  };

  const resetSandbox = (pattern: 'clear' | 'island' | 'corridors') => {
    if (pattern === 'clear') {
      setSandboxGrid(Array(7).fill(0).map(() => Array(7).fill(0)));
    } else if (pattern === 'island') {
      setSandboxGrid([
        [0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ]);
    } else if (pattern === 'corridors') {
      setSandboxGrid([
        [0, 1, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 1, 0],
      ]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: tileType.mapColor || '#38bdf8' }}
          />
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>Blob Autotileset Preview:</span>
              <span className="text-cyan-400">{tileType.name}</span>
            </h4>
            <p className="text-xs text-slate-400">
              Dual-noise blended base + 4-way composite edge autotiling bitmask
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'matrix'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            47-Blob Matrix
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
            Live Sandbox Canvas
          </button>
          <button
            onClick={() => setViewMode('diagnostics')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'diagnostics'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Asset Slots
          </button>
        </div>
      </div>

      {/* Control Toolstrip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Tile Scale:</span>
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-750">
            <button
              onClick={() => setTileSize(32)}
              className={`px-2 py-0.5 rounded ${tileSize === 32 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              32px
            </button>
            <button
              onClick={() => setTileSize(48)}
              className={`px-2 py-0.5 rounded ${tileSize === 48 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              48px
            </button>
            <button
              onClick={() => setTileSize(64)}
              className={`px-2 py-0.5 rounded ${tileSize === 64 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              64px (PBR)
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Show Grid Borders</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'sandbox' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Presets:</span>
              <button
                onClick={() => resetSandbox('island')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Island & Cave
              </button>
              <button
                onClick={() => resetSandbox('corridors')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Crossroads
              </button>
              <button
                onClick={() => resetSandbox('clear')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Clear
              </button>
            </div>
          )}

          {viewMode === 'matrix' && (
            <button
              onClick={handleExportAtlas}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded flex items-center gap-1 font-medium transition-colors"
              title="Download compiled autotileset PNG sprite sheet"
            >
              <Download className="w-3.5 h-3.5" />
              Export Sprite Atlas
            </button>
          )}
        </div>
      </div>

      {/* Main Display Area */}
      {viewMode === 'matrix' && (
        <div className="flex flex-col gap-3">
          {/* Matrix Viewport Container with Cursor-Centered Zoom and Right-Click Pan */}
          <div 
            ref={matrixPanZoom.containerRef}
            onMouseDown={matrixPanZoom.handleMouseDown}
            onContextMenu={matrixPanZoom.handleContextMenu}
            className={`relative w-full h-[380px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden select-none ${
              matrixPanZoom.isPanning ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Transformed Matrix Canvas Wrapper */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${matrixWidth}px`,
                height: `${matrixHeight}px`,
                transform: `translate(${matrixPanZoom.pan.x}px, ${matrixPanZoom.pan.y}px) scale(${matrixPanZoom.scale})`,
                transformOrigin: '0 0',
                willChange: 'transform'
              }}
            >
              <canvas
                ref={matrixCanvasRef}
                onMouseMove={handleMatrixMouseMove}
                onMouseLeave={() => setHoveredTileDef(null)}
                className="block border border-slate-750 shadow-2xl rounded"
              />
            </div>

            {/* Matrix Viewport HUD */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs select-none">
              <div className="flex items-center gap-1 px-2 text-[10px] font-mono text-slate-400 border-r border-slate-800">
                <Move size={11} className="text-cyan-400" />
                <span>R-Click Pan • Wheel Zoom</span>
              </div>

              <button
                type="button"
                onClick={matrixPanZoom.zoomOut}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={() => matrixPanZoom.centerContent(matrixWidth, matrixHeight, 1.0)}
                className="px-1.5 py-0.5 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-mono text-[11px] font-semibold transition"
                title="Reset Zoom to 100% & Center"
              >
                {Math.round(matrixPanZoom.scale * 100)}%
              </button>

              <button
                type="button"
                onClick={matrixPanZoom.zoomIn}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>

              <button
                type="button"
                onClick={() => matrixPanZoom.centerContent(matrixWidth, matrixHeight, 1.0)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Center Matrix"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Hover Status Bar */}
          <div className="min-h-[36px] bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            {hoveredTileDef ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-semibold">#{hoveredTileDef.id}</span>
                <span className="text-white font-medium">{hoveredTileDef.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Category: {hoveredTileDef.category} | Matrix: ({hoveredTileDef.gridCol}, {hoveredTileDef.gridRow})
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">
                Hover over any tile in the 47-blob matrix to inspect bitmask connectivity and topological role.
              </span>
            )}
            <span className="text-[11px] text-slate-500">
              47 Combinations • Fully World-Aligned Noise Blend
            </span>
          </div>
        </div>
      )}

      {viewMode === 'sandbox' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs text-slate-400 text-center">
            Click any cell to paint / erase. Use <strong>Right Mouse Drag</strong> to pan and <strong>Mouse Wheel</strong> to zoom centered on cursor:
          </div>

          {/* Sandbox Viewport Container with Cursor-Centered Zoom and Right-Click Pan */}
          <div 
            ref={sandboxPanZoom.containerRef}
            onMouseDown={sandboxPanZoom.handleMouseDown}
            onContextMenu={sandboxPanZoom.handleContextMenu}
            className={`relative w-full h-[380px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden select-none ${
              sandboxPanZoom.isPanning ? 'cursor-grabbing' : 'cursor-pointer'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Transformed Sandbox Canvas Wrapper */}
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
                onClick={handleSandboxClick}
                className="block border border-slate-700 shadow-2xl rounded"
              />
            </div>

            {/* Sandbox Viewport HUD */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs select-none">
              <div className="flex items-center gap-1 px-2 text-[10px] font-mono text-slate-400 border-r border-slate-800">
                <Move size={11} className="text-cyan-400" />
                <span>R-Click Pan • Wheel Zoom</span>
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

          <div className="text-[11px] text-slate-500 flex items-center gap-4">
            <span>🖱️ Left-Click: Toggle Cell</span>
            <span>🖱️ Right-Click + Drag: Pan View</span>
            <span>🎡 Wheel: Zoom to Cursor</span>
          </div>
        </div>
      )}

      {viewMode === 'diagnostics' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Base Material A */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Base Material A</span>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.baseMaterialA.albedoColor || '#334155' }}
              >
                {tileType.baseMaterialA.albedoTextureUrl ? (
                  <img src={tileType.baseMaterialA.albedoTextureUrl} alt="A" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">Albedo</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.baseMaterialA.albedoTextureUrl ? 'Custom Texture' : (tileType.baseMaterialA.albedoColor || 'Fallback Color')}
              </div>
            </div>
          </div>

          {/* Base Material B */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Base Material B</span>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.baseMaterialBAlbedoColor || '#475569' }}
              >
                {tileType.baseMaterialBTextureUrl ? (
                  <img src={tileType.baseMaterialBTextureUrl} alt="B" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">Variant</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.baseMaterialBTextureUrl ? 'Custom Texture' : (tileType.baseMaterialBAlbedoColor || 'Fallback Color')}
              </div>
            </div>
          </div>

          {/* Heightmap */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Heightmap</span>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-750 flex items-center justify-center overflow-hidden shrink-0">
                {tileType.heightMapTextureUrl ? (
                  <img src={tileType.heightMapTextureUrl} alt="Height" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Scale {(tileType.baseMaterialA.heightMapScale * 100).toFixed(0)}%</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.heightMapTextureUrl ? 'Custom Grayscale' : 'Procedural Relief'}
              </div>
            </div>
          </div>

          {/* Roughness Map */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Roughness Map</span>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-750 flex items-center justify-center overflow-hidden shrink-0">
                {tileType.roughnessMapTextureUrl ? (
                  <img src={tileType.roughnessMapTextureUrl} alt="Roughness" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">{(tileType.baseMaterialA.roughness * 100).toFixed(0)}%</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.roughnessMapTextureUrl ? 'Custom Roughness' : 'Shared Specular'}
              </div>
            </div>
          </div>

          {/* Top Overlay */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Top Overlay</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tileType.tileDetails.top.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {tileType.tileDetails.top.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.tileDetails.top.color || '#94a3b8' }}
              >
                {tileType.tileDetails.top.overlayTextureUrl ? (
                  <img src={tileType.tileDetails.top.overlayTextureUrl} alt="Top" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">{tileType.tileDetails.top.thicknessPx}px</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.tileDetails.top.overlayTextureUrl ? 'Custom Trim' : 'Procedural Trim'}
              </div>
            </div>
          </div>

          {/* Bottom Overlay */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Bottom Overlay</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tileType.tileDetails.bottom.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {tileType.tileDetails.bottom.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.tileDetails.bottom.color || '#1e293b' }}
              >
                {tileType.tileDetails.bottom.overlayTextureUrl ? (
                  <img src={tileType.tileDetails.bottom.overlayTextureUrl} alt="Bottom" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">{tileType.tileDetails.bottom.thicknessPx}px</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.tileDetails.bottom.overlayTextureUrl ? 'Custom Trim' : 'Procedural Trim'}
              </div>
            </div>
          </div>

          {/* Left Overlay */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Left Overlay</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tileType.tileDetails.leftSide.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {tileType.tileDetails.leftSide.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.tileDetails.leftSide.color || '#334155' }}
              >
                {tileType.tileDetails.leftSide.overlayTextureUrl ? (
                  <img src={tileType.tileDetails.leftSide.overlayTextureUrl} alt="Left" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">{tileType.tileDetails.leftSide.thicknessPx}px</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.tileDetails.leftSide.overlayTextureUrl ? 'Custom Trim' : 'Procedural Trim'}
              </div>
            </div>
          </div>

          {/* Right Overlay */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Right Overlay</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tileType.tileDetails.rightSide.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {tileType.tileDetails.rightSide.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-slate-750 flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: tileType.tileDetails.rightSide.color || '#1e293b' }}
              >
                {tileType.tileDetails.rightSide.overlayTextureUrl ? (
                  <img src={tileType.tileDetails.rightSide.overlayTextureUrl} alt="Right" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">{tileType.tileDetails.rightSide.thicknessPx}px</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tileType.tileDetails.rightSide.overlayTextureUrl ? 'Custom Trim' : 'Procedural Trim'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
