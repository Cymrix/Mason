import React, { useState, useEffect, useRef } from 'react';
import { Biome, DecorItem, INITIAL_BIOMES } from '../engine/biomes';
import { DamageType } from '../engine/schema';
import { 
  TreePine, 
  Sparkles, 
  Shield, 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Check, 
  Info,
  Flame,
  Zap,
  Snowflake,
  Crosshair,
  Skull,
  Radio
} from 'lucide-react';

interface BiomeEditorProps {
  biomes: Biome[];
  onUpdateBiomes: (biomes: Biome[]) => void;
  onSelectActiveBiomeForPainting?: (biomeId: string) => void;
  activePaintBiomeId?: string;
}

const DAMAGE_TYPES: { type: DamageType; label: string; color: string; icon: string }[] = [
  { type: 'kinetic', label: 'Kinetic', color: '#94a3b8', icon: '⚔️' },
  { type: 'thermal', label: 'Thermal', color: '#f87171', icon: '🔥' },
  { type: 'cryo', label: 'Cryo', color: '#38bdf8', icon: '❄️' },
  { type: 'galvanic', label: 'Galvanic', color: '#facc15', icon: '⚡' },
  { type: 'toxic', label: 'Toxic', color: '#4ade80', icon: '🧪' },
  { type: 'radiant', label: 'Radiant', color: '#fbbf24', icon: '✨' },
  { type: 'void', label: 'Void', color: '#c084fc', icon: '🌌' },
  { type: 'psionic', label: 'Psionic', color: '#ec4899', icon: '🔮' },
];

export const BiomeEditor: React.FC<BiomeEditorProps> = ({
  biomes,
  onUpdateBiomes,
  onSelectActiveBiomeForPainting,
  activePaintBiomeId
}) => {
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(biomes?.[0]?.id || 'mourne_ashen_steppes');
  const [activeSubTab, setActiveSubTab] = useState<'decor' | 'material' | 'noise'>('decor');
  const [previewSeed, setPreviewSeed] = useState<number>(1);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // New decor modal state
  const [isAddingDecor, setIsAddingDecor] = useState(false);
  const [newDecor, setNewDecor] = useState<Partial<DecorItem>>({
    name: 'New Detail Object',
    color: '#38bdf8',
    icon: '✨',
    frequency: 0.25,
    layer: 'tile_layer',
    isWalkable: true,
    destructible: true,
    health: 30,
    armor: 2,
    weakness: 'thermal'
  });

  const selectedBiome = biomes.find(b => b.id === selectedBiomeId) || biomes[0];

  const handleUpdateCurrentBiome = (updater: (prev: Biome) => Biome) => {
    onUpdateBiomes(biomes.map(b => b.id === selectedBiomeId ? updater(b) : b));
  };

  const handleAddNewBiome = () => {
    const newId = `biome_${Date.now()}`;
    const newBiome: Biome = {
      id: newId,
      name: 'New Convergence Biome',
      subtitle: 'Unmapped Fray Sector',
      description: 'Newly discovered metaphysical sector with uncharted terrain and resonance properties.',
      baseColor: '#27272a',
      accentColor: '#38bdf8',
      material: {
        heightScale: 0.5,
        blendSoftness: 0.5,
        surfaceOverlayColor: '#3f3f46',
        health: 75,
        armor: 5,
        damageAffinities: {
          kinetic: 1.0,
          thermal: 1.0
        }
      },
      noise: {
        scale: 20,
        octaves: 3,
        roughness: 0.5,
        density: 0.65,
        scatterDensity: 0.4
      },
      decorItems: [
        {
          id: `decor_${Date.now()}_1`,
          name: 'Flora Scatter',
          color: '#38bdf8',
          icon: '🌱',
          frequency: 0.3,
          layer: 'tile_layer',
          isWalkable: true,
          destructible: true,
          health: 20,
          armor: 0,
          weakness: 'thermal'
        }
      ]
    };
    onUpdateBiomes([...biomes, newBiome]);
    setSelectedBiomeId(newId);
  };

  const handleDuplicateBiome = (biomeToCopy: Biome) => {
    const newId = `${biomeToCopy.id}_copy_${Date.now()}`;
    const clonedBiome: Biome = {
      ...JSON.parse(JSON.stringify(biomeToCopy)),
      id: newId,
      name: `${biomeToCopy.name} (Copy)`
    };
    onUpdateBiomes([...biomes, clonedBiome]);
    setSelectedBiomeId(newId);
  };

  const handleDeleteBiome = (idToDelete: string) => {
    if (biomes.length <= 1) return;
    const filtered = biomes.filter(b => b.id !== idToDelete);
    onUpdateBiomes(filtered);
    setSelectedBiomeId(filtered[0].id);
  };

  // Render live preview chunk of the selected biome
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !selectedBiome) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const size = 16;
    const tileSize = 16;
    canvas.width = size * tileSize;
    canvas.height = size * tileSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple pseudo-random hash generator for deterministic preview
    const pseudoNoise = (x: number, y: number, seed: number) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
      return n - Math.floor(n);
    };

    // Draw procedural terrain base
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = pseudoNoise(x / (selectedBiome.noise.scale / 4), y / (selectedBiome.noise.scale / 4), previewSeed);
        
        // Base terrain shading with blend softness
        ctx.fillStyle = selectedBiome.baseColor;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        if (val > 1 - selectedBiome.noise.density) {
          ctx.fillStyle = selectedBiome.accentColor;
          ctx.globalAlpha = 0.25 + (val * 0.35);
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          ctx.globalAlpha = 1.0;
        }

        // Overlay accent lines
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
          ctx.fillStyle = selectedBiome.material.surfaceOverlayColor;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, 2);
          ctx.globalAlpha = 1.0;
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Draw Scatter Decor items based on configured frequency
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        selectedBiome.decorItems.forEach((decor, idx) => {
          const spawnHash = pseudoNoise(x + idx * 7, y + idx * 13, previewSeed + idx * 100);
          if (spawnHash < decor.frequency * selectedBiome.noise.scatterDensity) {
            if (decor.layer === 'tile_layer') {
              // Tile-layer objects blend as part of terrain material
              ctx.fillStyle = decor.color;
              ctx.globalAlpha = 0.7;
              ctx.beginPath();
              ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
            } else {
              // Foreground-layer objects stand out with border/distinct rendering
              ctx.fillStyle = decor.color;
              ctx.fillRect(x * tileSize + 3, y * tileSize + 3, tileSize - 6, tileSize - 6);
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 1;
              ctx.strokeRect(x * tileSize + 3, y * tileSize + 3, tileSize - 6, tileSize - 6);
            }
          }
        });
      }
    }
  }, [selectedBiome, previewSeed]);

  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      
      {/* Left Biome List Rail */}
      <aside className="w-72 border-r border-neutral-800 bg-neutral-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
              <TreePine size={16} className="text-emerald-400" />
              Biomes of the Fray
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Defined terrain & decor frequency</p>
          </div>
          <button 
            onClick={handleAddNewBiome}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
            title="Create new Biome"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {biomes.map((biome) => {
            const isSelected = selectedBiomeId === biome.id;
            const isCurrentPaintBiome = activePaintBiomeId === biome.id;

            return (
              <div
                key={biome.id}
                onClick={() => setSelectedBiomeId(biome.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-2 relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                    : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: biome.accentColor }}
                    />
                    <span className="font-semibold text-xs text-neutral-200 truncate max-w-[130px]">
                      {biome.name}
                    </span>
                  </div>

                  {isCurrentPaintBiome && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ACTIVE PAINT
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 truncate">{biome.subtitle}</p>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span>{biome.decorItems.length} decor rules</span>
                  <span className="font-mono">HP {biome.material.health}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70">
          <button
            onClick={() => onSelectActiveBiomeForPainting?.(selectedBiome.id)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <Check size={14} />
            Set as Active World Brush
          </button>
        </div>
      </aside>

      {/* Main Biome Configuration Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        
        {/* Top Biome Header */}
        <div className="p-6 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={selectedBiome.name}
                onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, name: e.target.value }))}
                className="font-bold text-xl text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 hover:border-blue-500 focus:border-blue-500 outline-none px-1 py-0.5"
              />
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                ID: {selectedBiome.id}
              </span>
            </div>
            <input
              type="text"
              value={selectedBiome.subtitle}
              onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, subtitle: e.target.value }))}
              placeholder="Subtitle / Region tag"
              className="text-xs text-neutral-400 bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-neutral-700 outline-none w-full px-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDuplicateBiome(selectedBiome)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              title="Duplicate this biome"
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              onClick={() => handleDeleteBiome(selectedBiome.id)}
              disabled={biomes.length <= 1}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-red-950/60 hover:text-red-400 border border-neutral-700 text-neutral-400 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-30"
              title="Delete biome"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Workspace Body: Tabs & Live Preview */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Configuration Pane */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
            
            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <button
                onClick={() => setActiveSubTab('decor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'decor'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Sparkles size={14} /> Detail & Decor Scatter ({selectedBiome.decorItems.length})
              </button>
              <button
                onClick={() => setActiveSubTab('material')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'material'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Shield size={14} /> Material & Combat (`TileType`)
              </button>
              <button
                onClick={() => setActiveSubTab('noise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'noise'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Sliders size={14} /> Procedural Noise & Density
              </button>
            </div>

            {/* TAB 1: DETAIL & DECOR SCATTER RULES (CORE TO WORLD PAINTING) */}
            {activeSubTab === 'decor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                      <Sparkles size={15} className="text-amber-400" />
                      Detail Scatter Rules & Blend Zones
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                      When you paint this biome on the world map, these objects automatically scatter based on their <strong>frequency</strong>. Tile-layer objects blend into the material shader; Foreground-layer objects ignore blending and act as interactive/destructible entities.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingDecor(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                  >
                    <Plus size={14} /> Add Decor Item
                  </button>
                </div>

                {/* Decor Item Cards List */}
                <div className="grid grid-cols-1 gap-3">
                  {selectedBiome.decorItems.map((decor, index) => (
                    <div
                      key={decor.id}
                      className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div 
                          className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-lg shadow-inner"
                          style={{ backgroundColor: decor.color }}
                        >
                          {decor.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-neutral-100">{decor.name}</span>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-semibold ${
                              decor.layer === 'tile_layer'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                                : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                            }`}>
                              {decor.layer === 'tile_layer' ? 'Tile Blend Layer' : 'Foreground Entity'}
                            </span>
                            {decor.destructible && (
                              <span className="text-[10px] bg-red-950/40 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded">
                                HP {decor.health} | Armor {decor.armor}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {decor.layer === 'tile_layer' 
                              ? 'Blends as part of terrain material texture & height' 
                              : 'Stands above terrain; independent collision & behavior'}
                          </p>
                        </div>
                      </div>

                      {/* Frequency & Quick Controls */}
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-neutral-500">Spawn Frequency:</span>
                            <strong className="text-blue-400 font-bold">{(decor.frequency * 100).toFixed(0)}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={decor.frequency}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleUpdateCurrentBiome(b => ({
                                ...b,
                                decorItems: b.decorItems.map((d, i) => i === index ? { ...d, frequency: val } : d)
                              }));
                            }}
                            className="w-32 accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                          />
                        </div>

                        <button
                          onClick={() => {
                            handleUpdateCurrentBiome(b => ({
                              ...b,
                              decorItems: b.decorItems.filter((_, i) => i !== index)
                            }));
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Decor Modal / Card */}
                {isAddingDecor && (
                  <div className="p-5 bg-neutral-900 border border-blue-500/50 rounded-2xl space-y-4 shadow-2xl animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                        <Plus size={16} /> New Detail Scatter Object
                      </h4>
                      <button
                        onClick={() => setIsAddingDecor(false)}
                        className="text-neutral-500 hover:text-neutral-300 text-sm"
                      >
                        ✕ Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">Object Name</label>
                        <input
                          type="text"
                          value={newDecor.name}
                          onChange={(e) => setNewDecor({ ...newDecor, name: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">Icon / Glyph</label>
                        <input
                          type="text"
                          value={newDecor.icon}
                          onChange={(e) => setNewDecor({ ...newDecor, icon: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newDecor.color}
                            onChange={(e) => setNewDecor({ ...newDecor, color: e.target.value })}
                            className="w-8 h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={newDecor.color}
                            onChange={(e) => setNewDecor({ ...newDecor, color: e.target.value })}
                            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">Blend Layer</label>
                        <select
                          value={newDecor.layer}
                          onChange={(e) => setNewDecor({ ...newDecor, layer: e.target.value as any })}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                        >
                          <option value="tile_layer">Tile Layer (Blends with material)</option>
                          <option value="foreground_layer">Foreground Layer (Distinct object)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                          Frequency: {(Number(newDecor.frequency || 0.2) * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={newDecor.frequency}
                          onChange={(e) => setNewDecor({ ...newDecor, frequency: parseFloat(e.target.value) })}
                          className="w-full accent-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">Health (HP)</label>
                        <input
                          type="number"
                          value={newDecor.health}
                          onChange={(e) => setNewDecor({ ...newDecor, health: parseInt(e.target.value) || 10 })}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          if (!newDecor.name) return;
                          const created: DecorItem = {
                            id: `decor_${Date.now()}`,
                            name: newDecor.name || 'Detail Item',
                            color: newDecor.color || '#38bdf8',
                            icon: newDecor.icon || '✨',
                            frequency: newDecor.frequency ?? 0.25,
                            layer: newDecor.layer || 'tile_layer',
                            isWalkable: newDecor.isWalkable ?? true,
                            destructible: newDecor.destructible ?? true,
                            health: newDecor.health ?? 30,
                            armor: newDecor.armor ?? 2,
                            weakness: newDecor.weakness || 'thermal'
                          };
                          handleUpdateCurrentBiome(b => ({
                            ...b,
                            decorItems: [...b.decorItems, created]
                          }));
                          setIsAddingDecor(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Save & Add to Biome
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MATERIAL & COMBAT (`TileType`) */}
            {activeSubTab === 'material' && (
              <div className="space-y-6">
                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
                  <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                    <Shield size={15} className="text-blue-400" />
                    Material / Shading & Destructible Terrain Specs
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Defines height map slope, shadow depth, edge blend softness, and the shared combat resolver stats when terrain is attacked.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Colors & Visual Properties */}
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Biome Color Palette</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-300">Base Strata / Ground Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBiome.baseColor}
                            onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, baseColor: e.target.value }))}
                            className="w-7 h-7 rounded border border-neutral-700 cursor-pointer bg-transparent"
                          />
                          <span className="text-xs font-mono text-neutral-400">{selectedBiome.baseColor}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-300">Surface Accent Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBiome.accentColor}
                            onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, accentColor: e.target.value }))}
                            className="w-7 h-7 rounded border border-neutral-700 cursor-pointer bg-transparent"
                          />
                          <span className="text-xs font-mono text-neutral-400">{selectedBiome.accentColor}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-300">Surface Overlay Tint</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBiome.material.surfaceOverlayColor}
                            onChange={(e) => handleUpdateCurrentBiome(b => ({ 
                              ...b, 
                              material: { ...b.material, surfaceOverlayColor: e.target.value } 
                            }))}
                            className="w-7 h-7 rounded border border-neutral-700 cursor-pointer bg-transparent"
                          />
                          <span className="text-xs font-mono text-neutral-400">{selectedBiome.material.surfaceOverlayColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">Height Scale (Shadow Depth)</span>
                          <span className="font-mono text-blue-400">{selectedBiome.material.heightScale}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={selectedBiome.material.heightScale}
                          onChange={(e) => handleUpdateCurrentBiome(b => ({
                            ...b,
                            material: { ...b.material, heightScale: parseFloat(e.target.value) }
                          }))}
                          className="w-full accent-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">Blend Softness (Edge Transition)</span>
                          <span className="font-mono text-blue-400">{selectedBiome.material.blendSoftness}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={selectedBiome.material.blendSoftness}
                          onChange={(e) => handleUpdateCurrentBiome(b => ({
                            ...b,
                            material: { ...b.material, blendSoftness: parseFloat(e.target.value) }
                          }))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Destructible Combat Resolution */}
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Flame size={14} className="text-red-400" />
                      Shared Combat Pipeline Stats
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Base Health (HP)</span>
                        <input
                          type="number"
                          value={selectedBiome.material.health}
                          onChange={(e) => handleUpdateCurrentBiome(b => ({
                            ...b,
                            material: { ...b.material, health: parseInt(e.target.value) || 0 }
                          }))}
                          className="text-lg font-bold text-red-400 bg-transparent outline-none w-full mt-1"
                        />
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Armor Rating</span>
                        <input
                          type="number"
                          value={selectedBiome.material.armor}
                          onChange={(e) => handleUpdateCurrentBiome(b => ({
                            ...b,
                            material: { ...b.material, armor: parseInt(e.target.value) || 0 }
                          }))}
                          className="text-lg font-bold text-neutral-200 bg-transparent outline-none w-full mt-1"
                        />
                      </div>
                    </div>

                    {/* RPS Modality Wheel Multipliers */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-neutral-400 block mb-2">
                        8-Point Modality RPS Multipliers
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {DAMAGE_TYPES.map(({ type, label, color, icon }) => {
                          const currentMult = selectedBiome.material.damageAffinities[type] ?? 1.0;
                          return (
                            <div 
                              key={type}
                              className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs"
                            >
                              <span className="flex items-center gap-1.5" style={{ color }}>
                                <span>{icon}</span> {label}
                              </span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={currentMult}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1.0;
                                  handleUpdateCurrentBiome(b => ({
                                    ...b,
                                    material: {
                                      ...b.material,
                                      damageAffinities: {
                                        ...b.material.damageAffinities,
                                        [type]: val
                                      }
                                    }
                                  }));
                                }}
                                className="w-12 bg-neutral-900 border border-neutral-700 text-right px-1.5 py-0.5 rounded font-mono text-neutral-200 outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: PROCEDURAL NOISE & FREQUENCY GENERATOR */}
            {activeSubTab === 'noise' && (
              <div className="space-y-6">
                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
                  <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                    <Sliders size={15} className="text-amber-400" />
                    Procedural Noise & Frequency Generator
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Upfront whole-world noise parameters that drive semi-procedural macro generation across the map template.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">Macro Noise Scale</span>
                        <span className="font-mono text-amber-400">{selectedBiome.noise.scale}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={selectedBiome.noise.scale}
                        onChange={(e) => handleUpdateCurrentBiome(b => ({
                          ...b,
                          noise: { ...b.noise, scale: parseInt(e.target.value) }
                        }))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">Roughness & Octaves</span>
                        <span className="font-mono text-amber-400">{selectedBiome.noise.roughness} ({selectedBiome.noise.octaves} oct)</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={selectedBiome.noise.roughness}
                        onChange={(e) => handleUpdateCurrentBiome(b => ({
                          ...b,
                          noise: { ...b.noise, roughness: parseFloat(e.target.value) }
                        }))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">Base Coverage Density Threshold</span>
                        <span className="font-mono text-amber-400">{(selectedBiome.noise.density * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={selectedBiome.noise.density}
                        onChange={(e) => handleUpdateCurrentBiome(b => ({
                          ...b,
                          noise: { ...b.noise, density: parseFloat(e.target.value) }
                        }))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">Overall Detail Scatter Multiplier</span>
                        <span className="font-mono text-amber-400">{(selectedBiome.noise.scatterDensity * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={selectedBiome.noise.scatterDensity}
                        onChange={(e) => handleUpdateCurrentBiome(b => ({
                          ...b,
                          noise: { ...b.noise, scatterDensity: parseFloat(e.target.value) }
                        }))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Lore & Metaphysical Profile</h4>
                      <textarea
                        value={selectedBiome.description}
                        onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, description: e.target.value }))}
                        className="w-full h-40 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs leading-relaxed text-neutral-300 outline-none focus:border-blue-500 resize-none font-sans"
                        placeholder="Lore description benchmarked to Korrath Steelhand's trial prose register..."
                      />
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-2 flex items-center gap-1.5">
                      <Info size={13} /> Written in literal, tight third-person style for Fray series lore.
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Live Procedural Preview Chunk Panel */}
          <div className="w-80 border-l border-neutral-800 bg-neutral-900/80 flex flex-col shrink-0 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-400" />
                  Live Chunk Preview
                </h3>
                <p className="text-[10px] text-neutral-500">16×16 semi-procedural stamp</p>
              </div>
              <button
                onClick={() => setPreviewSeed(s => s + 1)}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition flex items-center gap-1"
                title="Reroll procedural seed"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Preview Canvas */}
            <div className="flex justify-center items-center bg-black/80 border border-neutral-800 rounded-2xl p-3 shadow-inner">
              <canvas
                ref={previewCanvasRef}
                className="rounded-lg shadow-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Legend for active decor scatter */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">Scatter Legend</span>
              {selectedBiome.decorItems.map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{d.icon}</span>
                    <span className="text-neutral-300 font-medium">{d.name}</span>
                  </div>
                  <span className="text-neutral-500 font-mono text-[11px]">{(d.frequency * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800">
              <button
                onClick={() => onSelectActiveBiomeForPainting?.(selectedBiome.id)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <TreePine size={14} />
                Paint with {selectedBiome.name}
              </button>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
};
