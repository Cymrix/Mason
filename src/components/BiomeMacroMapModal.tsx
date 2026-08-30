
function getLinePixels(x0: number, y0: number, x1: number, y1: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let curX = x0;
  let curY = y0;

  while (true) {
    points.push({ x: curX, y: curY });
    if (curX === x1 && curY === y1) break;
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

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { 
  BiomeAllocationMatrix, 
  createBiomeAllocationMatrix, 
  generateProceduralBiomeMatrix, 
  sampleImageToBiomeMatrix,
  MetroidvaniaLayoutStyle
} from '../engine/metroidvaniaGenerator';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Paintbrush, 
  PaintBucket, 
  Pipette, 
  Shuffle, 
  Check, 
  X, 
  Grid, 
  Sliders, 
  Compass
} from 'lucide-react';

interface BiomeMacroMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  biomes: RefinedBiome[];
  currentWidth: number;
  currentHeight: number;
  onApplyToLevel: (matrix: BiomeAllocationMatrix, layoutStyle: MetroidvaniaLayoutStyle) => void;
  embedded?: boolean;
}

export const BiomeMacroMapModal: React.FC<BiomeMacroMapModalProps> = ({
  isOpen,
  onClose,
  biomes,
  currentWidth,
  currentHeight,
  onApplyToLevel,
  embedded = false
}) => {
  const [width, setWidth] = useState<number>(currentWidth || 24);
  const [height, setHeight] = useState<number>(currentHeight || 24);
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(biomes?.[0]?.id || 'mourne_ashen_steppes');
  const [tool, setTool] = useState<'pencil' | 'bucket' | 'eyedropper'>('pencil');
  const [layoutStyle, setLayoutStyle] = useState<MetroidvaniaLayoutStyle>('blank_air');
  const [seed, setSeed] = useState<number>(1337);
  const [pixelScale, setPixelScale] = useState<number>(16); // Visual magnification per pixel
  const [showPixelGrid, setShowPixelGrid] = useState<boolean>(true);

  // The 1px:1tile matrix state
  const [matrix, setMatrix] = useState<BiomeAllocationMatrix>(() => 
    createBiomeAllocationMatrix(currentWidth || 24, currentHeight || 24, biomes?.[0]?.id || 'mourne_ashen_steppes')
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when opening
  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth);
      setHeight(currentHeight);
      setMatrix(prev => {
        if (prev.width === currentWidth && prev.height === currentHeight) return prev;
        return createBiomeAllocationMatrix(currentWidth, currentHeight, selectedBiomeId);
      });
    }
  }, [isOpen, currentWidth, currentHeight, selectedBiomeId]);

  const biomeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    biomes.forEach(b => {
      map[b.id] = b.regionColor || '#475569';
    });
    return map;
  }, [biomes]);

  // Render the 1px:1tile Matrix with Crisp Nearest-Neighbor Magnification
  const drawMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw each 1px biome tile
    for (let y = 0; y < matrix.height; y++) {
      for (let x = 0; x < matrix.width; x++) {
        const biomeId = matrix.biomeIds[y]?.[x] || biomes[0].id;
        const color = biomeColorMap[biomeId] || '#334155';

        ctx.fillStyle = color;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
      }
    }

    // 2. Pixel Grid
    if (showPixelGrid && pixelScale >= 8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= matrix.width; x++) {
        ctx.moveTo(x * pixelScale, 0);
        ctx.lineTo(x * pixelScale, matrix.height * pixelScale);
      }
      for (let y = 0; y <= matrix.height; y++) {
        ctx.moveTo(0, y * pixelScale);
        ctx.lineTo(matrix.width * pixelScale, y * pixelScale);
      }
      ctx.stroke();
    }
  }, [matrix, pixelScale, showPixelGrid, biomeColorMap, biomes]);

  useEffect(() => {
    drawMatrix();
  }, [drawMatrix]);

  // Handle Pixel Interactions on the 1px:1tile Canvas
  const getPixelCoord = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.floor(clientX / pixelScale);
    const py = Math.floor(clientY / pixelScale);

    if (px < 0 || px >= matrix.width || py < 0 || py >= matrix.height) return null;
    return { x: px, y: py };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coord = getPixelCoord(e);
    if (!coord) return;

    if (tool === 'eyedropper') {
      const picked = matrix.biomeIds[coord.y]?.[coord.x];
      if (picked) setSelectedBiomeId(picked);
      return;
    }

    if (tool === 'bucket') {
      const targetId = matrix.biomeIds[coord.y]?.[coord.x];
      if (targetId === selectedBiomeId) return;

      setMatrix(prev => {
        const newIds = prev.biomeIds.map(row => [...row]);
        const stack = [[coord.x, coord.y]];
        const visited = new Set<string>();

        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          const key = `${cx},${cy}`;
          if (visited.has(key)) continue;
          visited.add(key);

          if (cx < 0 || cx >= prev.width || cy < 0 || cy >= prev.height) continue;
          if (newIds[cy]?.[cx] !== targetId) continue;

          if (newIds[cy]) newIds[cy][cx] = selectedBiomeId;
          stack.push([cx + 1, cy]);
          stack.push([cx - 1, cy]);
          stack.push([cx, cy + 1]);
          stack.push([cx, cy - 1]);
        }

        return { ...prev, biomeIds: newIds };
      });
      return;
    }

    isMouseDownRef.current = true;
    paintPixel(coord.x, coord.y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || tool !== 'pencil') return;
    const coord = getPixelCoord(e);
    if (coord) paintPixel(coord.x, coord.y);
  };

  const handleCanvasMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const paintPixel = (x: number, y: number) => {
    setMatrix(prev => {
      if (prev.biomeIds[y]?.[x] === selectedBiomeId) return prev;
      const newIds = prev.biomeIds.map(row => [...row]);
      if (newIds[y]) newIds[y][x] = selectedBiomeId;
      return { ...prev, biomeIds: newIds };
    });
  };

  // Generate Procedural Voronoi / Perlin Biome Allocation Map
  const handleProceduralGenerate = () => {
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    const newMatrix = generateProceduralBiomeMatrix(width, height, biomes, newSeed);
    setMatrix(newMatrix);
  };

  // Image Upload: Sample 1px/tile PNG
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const sampledMatrix = sampleImageToBiomeMatrix(img, width, height, biomes);
        setMatrix(sampledMatrix);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Export 1px/tile PNG
  const handleExportPng = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = matrix.width;
    exportCanvas.height = matrix.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < matrix.height; y++) {
      for (let x = 0; x < matrix.width; x++) {
        const biomeId = matrix.biomeIds[y]?.[x] || biomes[0].id;
        ctx.fillStyle = biomeColorMap[biomeId] || '#334155';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `metroidvania_biome_map_${matrix.width}x${matrix.height}.png`;
    a.click();
  };

  // Resize Matrix Dimensions
  const handleResize = (newW: number, newH: number) => {
    setWidth(newW);
    setHeight(newH);
    setMatrix(prev => {
      const newIds: string[][] = [];
      for (let y = 0; y < newH; y++) {
        const row: string[] = [];
        for (let x = 0; x < newW; x++) {
          row.push(prev.biomeIds[y]?.[x] || selectedBiomeId);
        }
        newIds.push(row);
      }
      return { width: newW, height: newH, biomeIds: newIds };
    });
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div className={`flex flex-col overflow-hidden ${embedded ? 'w-full h-full bg-neutral-950' : 'bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Map Macro (1px:1tile Studio)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                1 Pixel = 1 World Tile
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Procedurally synthesize biome allocation heatmaps, cave networks, and platforming layouts directly into your map.
            </p>
          </div>
        </div>

        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Controls & Tools Palette (4 Cols) */}
          <div className="md:col-span-4 border-r border-neutral-800 p-5 flex flex-col gap-4 overflow-y-auto bg-neutral-950/40">
            {/* Dimensions & Resolution */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between mb-2">
                <span>World Dimensions (Tiles / Pixels)</span>
                <span className="font-mono text-cyan-400">{width} × {height}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '24×24', w: 24, h: 24 },
                  { label: '32×24', w: 32, h: 24 },
                  { label: '48×32', w: 48, h: 32 },
                  { label: '64×36', w: 64, h: 36 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleResize(preset.w, preset.h)}
                    className={`py-1 text-xs font-mono rounded-lg transition ${
                      width === preset.w && height === preset.h
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Biome Palette Selection */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300">
                Active Biome Brush
              </label>
              <div className="flex flex-col gap-1.5">
                {biomes.map(biome => (
                  <button
                    key={biome.id}
                    type="button"
                    onClick={() => setSelectedBiomeId(biome.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition border ${
                      selectedBiomeId === biome.id
                        ? 'bg-neutral-800 border-cyan-500 ring-1 ring-cyan-500/50 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-4 h-4 rounded-md shadow-sm border border-black/40"
                        style={{ backgroundColor: biome.regionColor || '#475569' }}
                      />
                      <span className="font-medium truncate max-w-[150px]">{biome.name}</span>
                    </div>
                    {selectedBiomeId === biome.id && <Check size={14} className="text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Pixel Tools */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300">Pixel Tools</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTool('pencil')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition border ${
                    tool === 'pencil' 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Paintbrush size={16} />
                  <span>1px Pencil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('bucket')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition border ${
                    tool === 'bucket' 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <PaintBucket size={16} />
                  <span>Bucket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('eyedropper')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition border ${
                    tool === 'eyedropper' 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Pipette size={16} />
                  <span>Sampler</span>
                </button>
              </div>
            </div>

            {/* Procedural Zoning Generator */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Procedural Zoning</span>
                <span className="text-[11px] font-mono text-neutral-400">Seed: {seed}</span>
              </label>
              <button
                type="button"
                onClick={handleProceduralGenerate}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium border border-neutral-700 transition"
              >
                <Shuffle size={14} className="text-amber-400" />
                <span>Generate Macro Voronoi Zones</span>
              </button>
            </div>

            {/* Image Upload & Export */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs border border-neutral-700 transition"
                title="Upload custom 1px-per-tile PNG"
              >
                <Upload size={13} />
                <span>Import 1px PNG</span>
              </button>

              <button
                type="button"
                onClick={handleExportPng}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs border border-neutral-700 transition"
                title="Download 1px-per-tile layout image"
              >
                <Download size={13} />
                <span>Export 1px PNG</span>
              </button>
            </div>
          </div>

          {/* Right Preview & Canvas Area (8 Cols) */}
          <div className="md:col-span-8 flex flex-col p-5 bg-neutral-950 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Layout Preset on Level Bake:</span>
                <select
                  value={layoutStyle}
                  onChange={(e) => setLayoutStyle(e.target.value as MetroidvaniaLayoutStyle)}
                  className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="blank_air">Blank Air Space (Open Metroidvania Void)</option>
                  <option value="sidescroller_platforms">Sidescroller Platforms & Shafts</option>
                  <option value="cavern_labyrinth">Cavern Network & Pockets</option>
                  <option value="solid_rooms">Solid Boundary Rooms</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPixelGrid(!showPixelGrid)}
                  className={`p-1.5 rounded-lg text-xs transition border ${
                    showPixelGrid 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                      : 'text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                  }`}
                  title="Toggle 1px Grid Lines"
                >
                  <Grid size={14} />
                </button>

                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-0.5 text-xs text-neutral-400 font-mono">
                  <span>Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setPixelScale(Math.max(6, pixelScale - 2))}
                    className="hover:text-white px-1"
                  >-</button>
                  <span className="text-white font-bold">{pixelScale}px</span>
                  <button
                    type="button"
                    onClick={() => setPixelScale(Math.min(32, pixelScale + 2))}
                    className="hover:text-white px-1"
                  >+</button>
                </div>
              </div>
            </div>

            {/* 1px:1tile Matrix Canvas Container */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-neutral-950/80 rounded-xl my-3 border border-neutral-800/80 shadow-inner">
              <canvas
                ref={canvasRef}
                width={matrix.width * pixelScale}
                height={matrix.height * pixelScale}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="cursor-crosshair shadow-2xl ring-1 ring-neutral-700 rounded-sm"
              />
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Blank air cells reveal the biome's multi-layered parallax backdrop.</span>
              </div>

              <div className="flex items-center gap-2">
                {!embedded && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs transition"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onApplyToLevel(matrix, layoutStyle);
                    if (!embedded) onClose();
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-cyan-500 to-blue-600 hover:from-rose-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition"
                >
                  <Check size={15} />
                  <span>Synthesize & Apply to Level Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      {content}
    </div>
  );
};
