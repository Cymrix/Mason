import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BiomeTileType } from '../engine/refinedBiomeSchema';
import { renderRefinedTileCell, AutotileNeighborMask } from '../engine/tileMaterialRenderer';
import { BLOB_47_TILESET, BlobTileDefinition } from '../engine/blobTilesetConfig';
import { Layers, Play, Grid, Download, Eye, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

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

    const cols = 8;
    const rows = 6;
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

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
  }, [tileType, tileSize, showGrid, viewMode, renderTrigger, forceRerender]);

  // 2. Render Sandbox Playground
  useEffect(() => {
    if (viewMode !== 'sandbox') return;
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = sandboxGrid.length;
    const cols = sandboxGrid[0].length;
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // Render cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (sandboxGrid[r][c] === 1) {
          const screenX = c * tileSize;
          const screenY = r * tileSize;

          const hasTop = r > 0 && sandboxGrid[r - 1][c] === 1;
          const hasBottom = r < rows - 1 && sandboxGrid[r + 1][c] === 1;
          const hasLeft = c > 0 && sandboxGrid[r][c - 1] === 1;
          const hasRight = c < cols - 1 && sandboxGrid[r][c + 1] === 1;
          const hasTopLeft = r > 0 && c > 0 && sandboxGrid[r - 1][c - 1] === 1;
          const hasTopRight = r > 0 && c < cols - 1 && sandboxGrid[r - 1][c + 1] === 1;
          const hasBottomLeft = r < rows - 1 && c > 0 && sandboxGrid[r + 1][c - 1] === 1;
          const hasBottomRight = r < rows - 1 && c < cols - 1 && sandboxGrid[r + 1][c + 1] === 1;

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
  }, [sandboxGrid, tileType, tileSize, showGrid, viewMode, renderTrigger, forceRerender]);

  // Handle matrix hover
  const handleMatrixMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    const found = BLOB_47_TILESET.find(b => b.gridCol === col && b.gridRow === row);
    setHoveredTileDef(found || null);
  };

  // Handle sandbox click
  const handleSandboxClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (row >= 0 && row < sandboxGrid.length && col >= 0 && col < sandboxGrid[0].length) {
      setSandboxGrid(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = next[row][col] === 1 ? 0 : 1;
        return next;
      });
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
          <div className="overflow-x-auto bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center min-h-[320px]">
            <canvas
              ref={matrixCanvasRef}
              onMouseMove={handleMatrixMouseMove}
              onMouseLeave={() => setHoveredTileDef(null)}
              className="border border-slate-750 shadow-2xl rounded cursor-crosshair max-w-full"
            />
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
            Click any cell below to paint / erase and watch autotile edges, inner notches, and dual-noise blends adapt in real time:
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-center">
            <canvas
              ref={sandboxCanvasRef}
              onClick={handleSandboxClick}
              className="border border-slate-700 shadow-2xl rounded cursor-pointer"
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-4">
            <span>🖱️ Click to toggle cell</span>
            <span>✨ Automatically computes 8-way bitmasks & inner notches</span>
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
