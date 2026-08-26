import React, { useState, useRef, useEffect } from 'react';
import { RefinedBiome, ParallaxLayerConfig, ParallaxProceduralTheme } from '../engine/refinedBiomeSchema';
import { renderParallaxLayer } from '../engine/parallaxRenderer';
import { 
  Layers, 
  Upload, 
  Trash2, 
  MoveHorizontal, 
  MoveVertical,
  RotateCcw,
  Plus,
  Lock,
  X,
  Shield,
  PlusCircle
} from 'lucide-react';

interface ParallaxLayersEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
}

const DEFAULT_LAYER_META: Record<number, { title: string; desc: string; defaultTheme: ParallaxProceduralTheme }> = {
  [-5]: { title: '-5 Background: Celestial Deep Horizon', desc: 'Distant cosmos, sun/moon, nebulae & atmospheric sky dome', defaultTheme: 'celestial_sky' },
  [-4]: { title: '-4 Background: Distant Mountain Range', desc: 'Far silhouette peaks, jagged ridges, and skyline horizon', defaultTheme: 'distant_mountain_range' },
  [-3]: { title: '-3 Background: Colossal Megastructures', desc: 'Ruined ancient titan towers, massive arches, colossal trees', defaultTheme: 'ruined_megastructures' },
  [-2]: { title: '-2 Background: Cavern Pillars & Arches', desc: 'Stalactites, stalagmites, crystal clusters, and rock ribs', defaultTheme: 'cavern_pillars' },
  [-1]: { title: '-1 Background: Immediate Backwall', desc: 'Interior masonry backdrop, cavern wall seams, scaffolding', defaultTheme: 'interior_masonry_backwall' },
  [0]: { title: '0 Main: Gameplay Collision Plane', desc: 'Solid platforms, traversable terrain tiles, player action space', defaultTheme: 'interior_masonry_backwall' },
  [1]: { title: '+1 Foreground: Overgrowth & Particles', desc: 'Hanging chains, dangling vines, close dust motes passing camera', defaultTheme: 'foreground_overgrowth' }
};

const getLayerMeta = (index: number) => {
  if (DEFAULT_LAYER_META[index]) {
    return DEFAULT_LAYER_META[index];
  }
  if (index === 0) {
    return {
      title: '0 Main: Gameplay Collision Plane',
      desc: 'Solid platforms, traversable terrain tiles, player action space',
      defaultTheme: 'interior_masonry_backwall' as ParallaxProceduralTheme
    };
  }
  if (index < 0) {
    return {
      title: `${index} Background: Parallax Layer ${Math.abs(index)}`,
      desc: `Atmospheric background perspective backdrop at depth ${index}`,
      defaultTheme: 'celestial_sky' as ParallaxProceduralTheme
    };
  }
  return {
    title: `+${index} Foreground: Parallax Layer ${index}`,
    desc: `Close foreground perspective layer passing in front of camera at depth +${index}`,
    defaultTheme: 'foreground_overgrowth' as ParallaxProceduralTheme
  };
};

const getDefaultSpeedFactorX = (index: number) => {
  if (index === 0) return 1.0;
  if (index < 0) {
    return Math.max(0.01, Math.round((1.0 + index * 0.18) * 100) / 100);
  }
  return Math.round((1.0 + index * 0.35) * 100) / 100;
};

const getDefaultSpeedFactorY = (index: number) => {
  if (index === 0) return 1.0;
  if (index < 0) {
    return Math.max(0.01, Math.round((1.0 + index * 0.16) * 100) / 100);
  }
  return Math.round((1.0 + index * 0.25) * 100) / 100;
};

export const ParallaxLayersEditor: React.FC<ParallaxLayersEditorProps> = ({
  biome,
  onUpdateBiome
}) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(-5);
  const [simPanX, setSimPanX] = useState<number>(0);
  const [simPanY, setSimPanY] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);

  // Add Layer Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addRole, setAddRole] = useState<'background' | 'foreground'>('background');
  const [addIndex, setAddIndex] = useState<number>(-6);
  const [addName, setAddName] = useState<string>('');
  const [addTheme, setAddTheme] = useState<ParallaxProceduralTheme>('celestial_sky');
  const [addTintColor, setAddTintColor] = useState<string>('#38bdf8');
  const [addOpacity, setAddOpacity] = useState<number>(0.8);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const layers = (biome.parallaxLayers || []).slice().sort((a, b) => a.layerIndex - b.layerIndex);
  const selectedLayer = layers.find(l => l.layerIndex === selectedLayerIndex) || layers[0];

  const existingIndices = new Set(layers.map(l => l.layerIndex));

  // Update selected layer property
  const handleUpdateLayer = (updater: (prev: ParallaxLayerConfig) => ParallaxLayerConfig) => {
    onUpdateBiome(b => {
      const currentLayers = b.parallaxLayers || [];
      const updated = currentLayers.map(l => l.layerIndex === selectedLayerIndex ? updater(l) : l);
      return { ...b, parallaxLayers: updated };
    });
  };

  // Delete layer handler with Main Layer safety check
  const handleDeleteLayer = (layerIndexToDelete: number) => {
    if (layerIndexToDelete === 0) return; // Safeguard: Main layer 0 cannot be deleted!

    onUpdateBiome(b => {
      const currentLayers = b.parallaxLayers || [];
      const updated = currentLayers.filter(l => l.layerIndex !== layerIndexToDelete);
      return { ...b, parallaxLayers: updated };
    });

    if (selectedLayerIndex === layerIndexToDelete) {
      const remaining = layers.filter(l => l.layerIndex !== layerIndexToDelete);
      if (remaining.length > 0) {
        const closest = remaining.reduce((prev, curr) => 
          Math.abs(curr.layerIndex - layerIndexToDelete) < Math.abs(prev.layerIndex - layerIndexToDelete) ? curr : prev
        );
        setSelectedLayerIndex(closest.layerIndex);
      } else {
        setSelectedLayerIndex(0);
      }
    }
  };

  // Open Add Layer modal and prepare suggested fields
  const handleOpenAddModal = () => {
    const bgAvailable = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10].filter(i => !existingIndices.has(i));
    const defaultBg = bgAvailable.length > 0 ? bgAvailable[0] : -6;
    setAddRole('background');
    setAddIndex(defaultBg);
    setAddName('');
    setAddTheme('celestial_sky');
    setAddTintColor('#38bdf8');
    setAddOpacity(0.8);
    setShowAddModal(true);
  };

  // Change Add Role (background / foreground)
  const handleRoleChange = (role: 'background' | 'foreground') => {
    setAddRole(role);
    if (role === 'background') {
      const available = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10].filter(i => !existingIndices.has(i));
      const nextIdx = available.length > 0 ? available[0] : -6;
      setAddIndex(nextIdx);
      setAddTheme('celestial_sky');
    } else {
      const available = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(i => !existingIndices.has(i));
      const nextIdx = available.length > 0 ? available[0] : 2;
      setAddIndex(nextIdx);
      setAddTheme('foreground_overgrowth');
    }
  };

  // Submit new layer creation
  const handleCreateLayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addIndex === 0 || existingIndices.has(addIndex)) return;

    const meta = getLayerMeta(addIndex);
    const speedX = getDefaultSpeedFactorX(addIndex);
    const speedY = getDefaultSpeedFactorY(addIndex);

    const newLayer: ParallaxLayerConfig = {
      layerIndex: addIndex,
      name: addName.trim() || meta.title.split(':')[1]?.trim() || `Layer ${addIndex}`,
      speedFactorX: speedX,
      speedFactorY: speedY,
      opacity: addOpacity,
      tintColor: addTintColor,
      proceduralTheme: addTheme,
      repeatX: true,
      repeatY: addIndex === -1,
      offsetY: addIndex < 0 ? Math.abs(addIndex) * 15 : 0,
      scale: 1.0
    };

    onUpdateBiome(b => {
      const currentLayers = b.parallaxLayers || [];
      const updated = [...currentLayers, newLayer].sort((a, b) => a.layerIndex - b.layerIndex);
      return { ...b, parallaxLayers: updated };
    });

    setSelectedLayerIndex(addIndex);
    setShowAddModal(false);
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
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render background base
          ctx.fillStyle = biome.ambientBackgroundColor || '#0a0a12';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render all layers in sorted order
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
              Dynamic Metroidvania Parallax Pipeline ({layers.length} Active {layers.length === 1 ? 'Layer' : 'Layers'})
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Multi-depth camera perspective scrolling. Backgrounds scroll behind the main gameplay plane, foregrounds pass in front.
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
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Parallax Depth Layers
            </h4>
            
            {/* Add Layer Trigger Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1 shadow-sm"
              title="Add new background or foreground parallax depth layer"
            >
              <Plus size={13} />
              <span>Add Layer</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {layers.map(layer => {
              const meta = getLayerMeta(layer.layerIndex);
              const isSelected = selectedLayerIndex === layer.layerIndex;
              const isGameplay = layer.layerIndex === 0;

              return (
                <div
                  key={layer.layerIndex}
                  className={`group relative w-full rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md text-white'
                      : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLayerIndex(layer.layerIndex)}
                    className="flex-1 p-3 text-left min-w-0 pr-2 space-y-0.5"
                  >
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
                        {layer.name || (meta?.title ? (meta.title.split(':')[1] || `Layer ${layer.layerIndex}`) : `Layer ${layer.layerIndex}`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 truncate">
                      Speed: {layer.speedFactorX}x • {layer.proceduralTheme.replace(/_/g, ' ')}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 pr-3 shrink-0">
                    <div 
                      className="w-3.5 h-3.5 rounded-full border border-black/40" 
                      style={{ backgroundColor: layer.tintColor || '#38bdf8' }}
                      title={`Tint Color: ${layer.tintColor || '#38bdf8'}`}
                    />

                    {isGameplay ? (
                      <span className="p-1 text-amber-400/80" title="Main Gameplay Layer (Required - Cannot be deleted)">
                        <Lock size={13} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayer(layer.layerIndex);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition opacity-60 group-hover:opacity-100"
                        title={`Delete Layer ${layer.layerIndex}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Configuration Panel (8 Cols) */}
        {selectedLayer && (
          <div className="lg:col-span-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <span>{getLayerMeta(selectedLayer.layerIndex).title}</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {getLayerMeta(selectedLayer.layerIndex).desc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Depth: {selectedLayer.layerIndex}
                </span>

                {selectedLayer.layerIndex === 0 ? (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
                    <Lock size={12} />
                    <span>Main Layer (Locked)</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDeleteLayer(selectedLayer.layerIndex)}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                    title={`Delete Parallax Layer ${selectedLayer.layerIndex}`}
                  >
                    <Trash2 size={13} />
                    <span>Delete Layer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Layer Display Name & Procedural Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Layer Name</label>
                <input
                  type="text"
                  value={selectedLayer.name}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, name: e.target.value }))}
                  placeholder="Layer Name"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Procedural Theme</label>
                <select
                  value={selectedLayer.proceduralTheme}
                  onChange={(e) => handleUpdateLayer(l => ({ ...l, proceduralTheme: e.target.value as ParallaxProceduralTheme }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="celestial_sky">Celestial Sky Dome & Stars</option>
                  <option value="distant_mountain_range">Distant Mountain Peaks</option>
                  <option value="ruined_megastructures">Ruined Megastructures / Titan Ruins</option>
                  <option value="cavern_pillars">Cavern Pillars & Stalactites</option>
                  <option value="interior_masonry_backwall">Interior Masonry / Cavern Backwall</option>
                  <option value="foreground_overgrowth">Foreground Overgrowth Vines & Spores</option>
                  <option value="custom_image">Custom Uploaded Texture</option>
                </select>
              </div>
            </div>

            {/* Tint Color */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Layer Color Tint</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 w-fit">
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

            {/* Custom Image Upload */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200">Custom Layer Image Texture</span>
                {selectedLayer.textureUrl && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLayer(l => ({ ...l, textureUrl: undefined, proceduralTheme: getLayerMeta(l.layerIndex)?.defaultTheme || 'celestial_sky' }))}
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
                  max="2.5"
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
                  max="2.0"
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

      {/* Add Parallax Layer Modal Dialog */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Add Parallax Depth Layer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLayerSubmit} className="space-y-4">
              {/* Role Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Layer Type & Depth Role</label>
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('background')}
                    className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      addRole === 'background'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>Background (Behind)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('foreground')}
                    className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      addRole === 'foreground'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>Foreground (In Front)</span>
                  </button>
                </div>
              </div>

              {/* Layer Index Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Depth Layer Index</label>
                <select
                  value={addIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setAddIndex(idx);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {addRole === 'background' ? (
                    [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10].map(idx => (
                      <option key={idx} value={idx} disabled={existingIndices.has(idx)}>
                        {idx} Depth {existingIndices.has(idx) ? '(In Use)' : ''}
                      </option>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(idx => (
                      <option key={idx} value={idx} disabled={existingIndices.has(idx)}>
                        +{idx} Depth {existingIndices.has(idx) ? '(In Use)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Custom Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Layer Name (Optional)</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder={addRole === 'background' ? `Background Layer ${addIndex}` : `Foreground Layer +${addIndex}`}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Procedural Theme */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Procedural Theme</label>
                <select
                  value={addTheme}
                  onChange={(e) => setAddTheme(e.target.value as ParallaxProceduralTheme)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="celestial_sky">Celestial Sky Dome & Stars</option>
                  <option value="distant_mountain_range">Distant Mountain Peaks</option>
                  <option value="ruined_megastructures">Ruined Megastructures / Titan Ruins</option>
                  <option value="cavern_pillars">Cavern Pillars & Stalactites</option>
                  <option value="interior_masonry_backwall">Interior Masonry / Cavern Backwall</option>
                  <option value="foreground_overgrowth">Foreground Overgrowth Vines & Spores</option>
                  <option value="custom_image">Custom Uploaded Texture</option>
                </select>
              </div>

              {/* Tint Color & Opacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">Tint Color</label>
                  <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={addTintColor}
                      onChange={(e) => setAddTintColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-neutral-300">{addTintColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">Initial Opacity ({Math.round(addOpacity * 100)}%)</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={addOpacity}
                    onChange={(e) => setAddOpacity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer pt-2"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addIndex === 0 || existingIndices.has(addIndex)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
                >
                  <Plus size={14} />
                  <span>Create Parallax Layer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
