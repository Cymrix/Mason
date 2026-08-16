import React, { useState, useRef, useEffect } from 'react';
import { RefinedBiome, ParallaxLayerConfig, ParallaxLayerIndex, ParallaxProceduralTheme } from '../engine/refinedBiomeSchema';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Upload, 
  Trash2, 
  Sliders, 
  Maximize2, 
  Sparkles, 
  MoveHorizontal, 
  MoveVertical,
  RotateCcw,
  Palette
} from 'lucide-react';

interface ParallaxLayersEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
}

const LAYER_TITLES: Record<ParallaxLayerIndex, { title: string; desc: string; defaultTheme: ParallaxProceduralTheme }> = {
  [-5]: { title: '-5 Background: Celestial Deep Horizon', desc: 'Distant cosmos, sun/moon, nebulae & atmospheric sky dome', defaultTheme: 'celestial_sky' },
  [-4]: { title: '-4 Background: Distant Mountain Range', desc: 'Far silhouette peaks, jagged ridges, and skyline horizon', defaultTheme: 'distant_mountain_range' },
  [-3]: { title: '-3 Background: Colossal Megastructures', desc: 'Ruined ancient titan towers, massive arches, colossal trees', defaultTheme: 'ruined_megastructures' },
  [-2]: { title: '-2 Background: Cavern Pillars & Arches', desc: 'Stalactites, stalagmites, crystal clusters, and rock ribs', defaultTheme: 'cavern_pillars' },
  [-1]: { title: '-1 Background: Immediate Backwall', desc: 'Interior masonry backdrop, cavern wall seams, scaffolding', defaultTheme: 'interior_masonry_backwall' },
  [0]: { title: '0 Main: Gameplay Collision Plane', desc: 'Solid platforms, traversable terrain tiles, player action space', defaultTheme: 'interior_masonry_backwall' },
  [1]: { title: '+1 Foreground: Overgrowth & Particles', desc: 'Hanging chains, dangling vines, close dust motes passing camera', defaultTheme: 'foreground_overgrowth' }
};

export const ParallaxLayersEditor: React.FC<ParallaxLayersEditorProps> = ({
  biome,
  onUpdateBiome
}) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<ParallaxLayerIndex>(-5);
  const [simPanX, setSimPanX] = useState<number>(0);
  const [simPanY, setSimPanY] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const layers = biome.parallaxLayers || [];
  const selectedLayer = layers.find(l => l.layerIndex === selectedLayerIndex) || layers[0];

  const handleUpdateLayer = (updater: (prev: ParallaxLayerConfig) => ParallaxLayerConfig) => {
    onUpdateBiome(b => {
      const currentLayers = b.parallaxLayers || [];
      const updated = currentLayers.map(l => l.layerIndex === selectedLayerIndex ? updater(l) : l);
      return { ...b, parallaxLayers: updated };
    });
  };

  // Live Parallax Preview Loop
  useEffect(() => {
    let currentX = simPanX;
    let direction = 1;

    const render = () => {
      if (isAutoScrolling) {
        currentX += 0.8 * direction;
        if (currentX > 300) direction = -1;
        if (currentX < -300) direction = 1;
        setSimPanX(currentX);
      }

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render background base
          ctx.fillStyle = biome.ambientBackgroundColor || '#0a0a12';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render all layers in order (-5 to 1)
          const sorted = [...(biome.parallaxLayers || [])].sort((a, b) => a.layerIndex - b.layerIndex);

          sorted.forEach(layer => {
            if (layer.layerIndex === 0) {
              // Simulated gameplay platform line
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.fillRect(0, canvas.height * 0.75 + simPanY, canvas.width, 12);
              ctx.fillStyle = biome.regionColor || '#475569';
              ctx.fillRect(40, canvas.height * 0.75 - 32 + simPanY, 32, 32); // mock player box
              return;
            }

            renderParallaxLayer(
              ctx,
              layer,
              canvas.width,
              canvas.height,
              currentX,
              simPanY,
              1.0,
              biome
            );
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [biome, isAutoScrolling, simPanY]);

  // Upload Custom Texture
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        handleUpdateLayer(l => ({ ...l, textureUrl: url, proceduralTheme: 'custom_image' }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Live Interactive Simulator */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" />
              7-Layer Metroidvania Parallax Pipeline (-5 to +1)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Multi-depth camera perspective scrolling. Open air space displays these atmospheric backdrops.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isAutoScrolling 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {isAutoScrolling ? 'Auto-Scrolling Active' : 'Manual Pan'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSimPanX(0);
                setSimPanY(0);
              }}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition"
              title="Reset Camera Position"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Live Simulator Viewport */}
        <div className="relative w-full h-56 rounded-xl border border-neutral-800 overflow-hidden bg-black shadow-2xl flex items-center justify-center">
          <canvas
            ref={previewCanvasRef}
            width={800}
            height={224}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-[10px] font-mono text-neutral-400">
            Camera Pan X: {Math.round(simPanX)}px • Simulated 2D Sidescroller
          </div>
        </div>

        {/* Manual Pan Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="flex items-center gap-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <MoveHorizontal size={14} className="text-cyan-400 shrink-0" />
            <span className="text-xs text-neutral-400 w-24">Camera X Pan:</span>
            <input
              type="range"
              min="-400"
              max="400"
              value={simPanX}
              onChange={(e) => {
                setIsAutoScrolling(false);
                setSimPanX(parseFloat(e.target.value));
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-cyan-300 w-12 text-right">{Math.round(simPanX)}</span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <MoveVertical size={14} className="text-amber-400 shrink-0" />
            <span className="text-xs text-neutral-400 w-24">Camera Y Pan:</span>
            <input
              type="range"
              min="-150"
              max="150"
              value={simPanY}
              onChange={(e) => setSimPanY(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-amber-300 w-12 text-right">{Math.round(simPanY)}</span>
          </div>
        </div>
      </div>

      {/* Layer Tabs & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Selector Rail (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
            Parallax Depth Layers
          </h4>

          <div className="space-y-1.5">
            {layers.map(layer => {
              const meta = LAYER_TITLES[layer.layerIndex as ParallaxLayerIndex];
              const isSelected = selectedLayerIndex === layer.layerIndex;
              const isGameplay = layer.layerIndex === 0;

              return (
                <button
                  key={layer.layerIndex}
                  type="button"
                  onClick={() => setSelectedLayerIndex(layer.layerIndex as ParallaxLayerIndex)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md text-white'
                      : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                        isGameplay 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : layer.layerIndex > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {layer.layerIndex > 0 ? `+${layer.layerIndex}` : layer.layerIndex}
                      </span>
                      <span className="text-xs font-semibold truncate">
                        {meta?.title ? (meta.title.split(':')[1] || `Layer ${layer.layerIndex}`) : `Layer ${layer.layerIndex}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate">
                      Speed: {layer.speedFactorX}x • {layer.proceduralTheme.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div 
                    className="w-4 h-4 rounded-full border border-black/40 shrink-0" 
                    style={{ backgroundColor: layer.tintColor || '#38bdf8' }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Configuration Panel (8 Cols) */}
        {selectedLayer && (
          <div className="lg:col-span-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-neutral-100">
                  {selectedLayer ? LAYER_TITLES[selectedLayer.layerIndex as ParallaxLayerIndex]?.title : ''}
                </h4>
                <p className="text-xs text-neutral-400">
                  {selectedLayer ? LAYER_TITLES[selectedLayer.layerIndex as ParallaxLayerIndex]?.desc : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Depth: {selectedLayer.layerIndex}
                </span>
              </div>
            </div>

            {/* Procedural Theme or Custom Image Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Procedural Theme</label>
                <select
                  value={selectedLayer.proceduralTheme}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, proceduralTheme: e.target.value as ParallaxProceduralTheme }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="celestial_sky">Celestial Sky Dome & Stars (-5)</option>
                  <option value="distant_mountain_range">Distant Mountain Peaks (-4)</option>
                  <option value="ruined_megastructures">Ruined Megastructures / Titan Ruins (-3)</option>
                  <option value="cavern_pillars">Cavern Pillars & Stalactites (-2)</option>
                  <option value="interior_masonry_backwall">Interior Masonry / Cavern Backwall (-1)</option>
                  <option value="foreground_overgrowth">Foreground Overgrowth Vines & Spores (+1)</option>
                  <option value="custom_image">Custom Uploaded Texture</option>
                </select>
              </div>

              {/* Tint Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Layer Color Tint</label>
                <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5">
                  <input
                    type="color"
                    value={selectedLayer.tintColor || '#38bdf8'}
                    onChange={(e) => handleUpdateLayer(l => ({ ...l, tintColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedLayer.tintColor || '#38bdf8'}
                    onChange={(e) => handleUpdateLayer(l => ({ ...l, tintColor: e.target.value }))}
                    className="bg-transparent text-xs font-mono text-neutral-200 outline-none w-24"
                  />
                </div>
              </div>
            </div>

            {/* Custom Image Upload */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200">Custom Layer Image Texture</span>
                {selectedLayer.textureUrl && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLayer(l => ({ ...l, textureUrl: undefined, proceduralTheme: LAYER_TITLES[l.layerIndex as ParallaxLayerIndex]?.defaultTheme || 'celestial_sky' }))}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Clear Image
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-medium flex items-center gap-2 text-neutral-200 transition">
                  <Upload size={13} className="text-cyan-400" />
                  <span>{selectedLayer.textureUrl ? 'Replace Custom Image' : 'Upload Parallax Layer PNG'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTextureUpload}
                    className="hidden"
                  />
                </label>

                {selectedLayer.textureUrl && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={selectedLayer.textureUrl} 
                      alt="Layer Preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-neutral-700" 
                    />
                    <span className="text-[11px] text-emerald-400 font-mono">Image Applied</span>
                  </div>
                )}
              </div>
            </div>

            {/* Speeds & Opacity Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Speed Factor X */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-bold">Speed Factor X</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedLayer.speedFactorX}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={selectedLayer.speedFactorX}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, speedFactorX: parseFloat(e.target.value) }))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Speed Factor Y */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-bold">Speed Factor Y</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedLayer.speedFactorY}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={selectedLayer.speedFactorY}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, speedFactorY: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Opacity */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-bold">Opacity</span>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round(selectedLayer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={selectedLayer.opacity}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
