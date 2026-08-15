import React, { useState, useRef } from 'react';
import { 
  RefinedBiome, 
  BiomeTileType, 
  EnvironmentalDetail, 
  InteractivePlacementDetail, 
  BiomeWildlife,
  BiomeSoundtrack,
  TraversalModifierTag,
  DamageType
} from '../engine/refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from '../engine/refinedBiomes';
import { BlobTilesetPreview } from './BlobTilesetPreview';
import { 
  TreePine, 
  Layers, 
  Sparkles, 
  Music, 
  Volume2, 
  Compass, 
  Shield, 
  Flame, 
  Plus, 
  Copy, 
  Sliders, 
  Footprints, 
  Box, 
  Eye, 
  Check, 
  Zap, 
  Skull, 
  Disc,
  Play,
  RotateCcw,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
  Palette
} from 'lucide-react';

interface RefinedBiomeEditorProps {
  biomes: RefinedBiome[];
  onUpdateBiomes: (biomes: RefinedBiome[]) => void;
  onSelectForPainting?: (biomeId: string, tileTypeId?: string) => void;
  activePaintBiomeId?: string;
}

const TRAVERSAL_TAG_LIST: { tag: TraversalModifierTag; label: string }[] = [
  { tag: 'climbable', label: 'Climbable' },
  { tag: 'sticky', label: 'Sticky' },
  { tag: 'bouncy', label: 'Bouncy' },
  { tag: 'slippery', label: 'Slippery' },
  { tag: 'hazard', label: 'Hazard' },
  { tag: 'sinkable', label: 'Sinkable' }
];

export const RefinedBiomeEditor: React.FC<RefinedBiomeEditorProps> = ({
  biomes,
  onUpdateBiomes,
  onSelectForPainting,
  activePaintBiomeId
}) => {
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(biomes[0]?.id || 'mourne_ashen_steppes');
  const [activeSubTab, setActiveSubTab] = useState<'tile_types' | 'environmental' | 'interactive' | 'wildlife' | 'soundtrack'>('tile_types');
  const [selectedTileTypeIndex, setSelectedTileTypeIndex] = useState<number>(0);

  const selectedBiome = biomes.find(b => b.id === selectedBiomeId) || biomes[0];
  const selectedTileType = selectedBiome.tileTypes[selectedTileTypeIndex] || selectedBiome.tileTypes[0];

  const handleUpdateCurrentBiome = (updater: (prev: RefinedBiome) => RefinedBiome) => {
    const updatedList = biomes.map(b => b.id === selectedBiome.id ? updater(b) : b);
    onUpdateBiomes(updatedList);
  };

  const handleUpdateCurrentTileType = (updater: (prev: BiomeTileType) => BiomeTileType) => {
    handleUpdateCurrentBiome(b => {
      const updatedTypes = [...b.tileTypes];
      updatedTypes[selectedTileTypeIndex] = updater(selectedTileType);
      return { ...b, tileTypes: updatedTypes };
    });
  };

  // Helper for uploading local image files as Data URLs
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onLoaded(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTileType = () => {
    const newId = `tile_type_${Date.now()}`;
    const newType: BiomeTileType = {
      id: newId,
      name: 'New Material Strata',
      category: 'natural',
      mapColor: '#38bdf8',
      baseMaterialA: {
        albedoColor: '#475569',
        heightMapScale: 0.5,
        roughness: 0.8,
        normalStrength: 1.0
      },
      baseMaterialBAlbedoColor: '#64748b',
      blendMap: {
        noiseA: {
          scale: 32,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
          offset: { x: 0, y: 0 },
          weight: 0.6
        },
        noiseB: {
          scale: 12,
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2.0,
          offset: { x: 20, y: 30 },
          weight: 0.4
        },
        blendThreshold: 0.5,
        blendContrast: 1.2,
        invert: false
      },
      tileDetails: {
        top: { enabled: true, thicknessPx: 6, noiseEdge: true },
        bottom: { enabled: false, thicknessPx: 4, noiseEdge: false },
        leftSide: { enabled: false, thicknessPx: 3, noiseEdge: false },
        rightSide: { enabled: false, thicknessPx: 3, noiseEdge: false }
      },
      isDestructible: true,
      health: 100,
      defense_type: 'kinetic',
      armor_deduction: 5,
      damage_affinities: { kinetic: 1.0, thermal: 1.0 },
      shares_damage_overlay: true,
      traversal_tags: [],
      speed_modifier: 1.0
    };

    handleUpdateCurrentBiome(b => ({
      ...b,
      tileTypes: [...b.tileTypes, newType]
    }));
    setSelectedTileTypeIndex(selectedBiome.tileTypes.length);
  };

  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      
      {/* Left Biomes Rail */}
      <aside className="w-72 border-r border-neutral-800 bg-neutral-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
              <TreePine size={16} className="text-emerald-400" />
              Regional Biomes
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Multi-Tile, Dual-Noise PBR Strata</p>
          </div>
          <button
            onClick={() => {
              const newId = `biome_${Date.now()}`;
              const cloned = JSON.parse(JSON.stringify(selectedBiome)) as RefinedBiome;
              cloned.id = newId;
              cloned.name = `${selectedBiome.name} (Copy)`;
              onUpdateBiomes([...biomes, cloned]);
              setSelectedBiomeId(newId);
            }}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow border border-neutral-700"
            title="Duplicate selected Biome"
          >
            <Copy size={13} />
          </button>
        </div>

        {/* Biome List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {biomes.map(biome => {
            const isSelected = selectedBiomeId === biome.id;
            const isPainting = activePaintBiomeId === biome.id;

            return (
              <div
                key={biome.id}
                onClick={() => {
                  setSelectedBiomeId(biome.id);
                  setSelectedTileTypeIndex(0);
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-1.5 relative ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: biome.regionColor }}
                    />
                    <span className="font-semibold text-xs text-neutral-200 truncate max-w-[130px]">
                      {biome.name}
                    </span>
                  </div>

                  {isPainting && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span className="font-mono text-neutral-400">{biome.tileTypes.length} TileTypes</span>
                  <span className="font-mono text-cyan-400">{biome.wildlife.length} Wildlife</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70">
          <button
            onClick={() => onSelectForPainting?.(selectedBiome.id, selectedTileType?.id)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <Check size={14} />
            Paint World with {selectedBiome.name}
          </button>
        </div>
      </aside>

      {/* Main Biome Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur flex items-center justify-between shrink-0">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={selectedBiome.name}
                onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, name: e.target.value }))}
                className="font-bold text-lg text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 hover:border-emerald-500 focus:border-emerald-500 outline-none px-1 py-0.5"
              />
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                64px Tile Standard
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {selectedBiome.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-300">
              <Compass size={13} className="text-emerald-400" />
              <span>Region Map Tint:</span>
              <input
                type="color"
                value={selectedBiome.regionColor}
                onChange={(e) => handleUpdateCurrentBiome(b => ({ ...b, regionColor: e.target.value }))}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border border-neutral-700 ml-1"
              />
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-neutral-800 flex items-center gap-2 shrink-0 bg-neutral-900/30 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('tile_types')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'tile_types' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Layers size={14} /> 1. Tile Types, Textures & Autotiling ({selectedBiome.tileTypes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('environmental')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'environmental' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <TreePine size={14} /> 2. Environmental Non-Tile Details ({selectedBiome.environmentalDetails.length})
          </button>
          <button
            onClick={() => setActiveSubTab('interactive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'interactive' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Box size={14} /> 3. Interactive Placements ({selectedBiome.interactiveDetails.length})
          </button>
          <button
            onClick={() => setActiveSubTab('wildlife')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'wildlife' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Zap size={14} /> 4. Wildlife ({selectedBiome.wildlife.length})
          </button>
          <button
            onClick={() => setActiveSubTab('soundtrack')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'soundtrack' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Music size={14} /> 5. Soundtrack & Audio Cues
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: TILE TYPES & ASSET UPLOADS & BLOB PREVIEW */}
          {activeSubTab === 'tile_types' && (
            <div className="space-y-6">
              
              {/* TileType Horizontal Selector Bar */}
              <div className="flex items-center justify-between bg-neutral-900/70 border border-neutral-800 p-2.5 rounded-xl">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2">Biome Tile Types:</span>
                  {selectedBiome.tileTypes.map((tt, idx) => (
                    <button
                      key={tt.id}
                      onClick={() => setSelectedTileTypeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                        selectedTileTypeIndex === idx
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded border border-white/20" style={{ backgroundColor: tt.mapColor || tt.baseMaterialA.albedoColor || '#38bdf8' }} />
                      <span>{tt.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAddTileType}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow shrink-0"
                >
                  <Plus size={13} /> Add TileType
                </button>
              </div>

              {/* TileType Detail Config */}
              {selectedTileType && (
                <div className="space-y-6">
                  
                  {/* Top Bar: Name & Map Color for Procedural Painting */}
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block">Tile Type Name</label>
                        <input
                          type="text"
                          value={selectedTileType.name}
                          onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, name: e.target.value }))}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:border-cyan-500 outline-none w-64"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                          <Palette size={11} className="text-cyan-400" />
                          <span>Map & Palette Color</span>
                        </label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1">
                          <input
                            type="color"
                            value={selectedTileType.mapColor || '#38bdf8'}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, mapColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-neutral-300">{selectedTileType.mapColor || '#38bdf8'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400">Category:</span>
                      <select
                        value={selectedTileType.category}
                        onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, category: e.target.value as any }))}
                        className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white ml-2"
                      >
                        <option value="natural">Natural (Rock / Loam / Ice)</option>
                        <option value="structure">Structure (Masonry / Fortress)</option>
                        <option value="hazard">Hazard (Volcanic / Spore)</option>
                        <option value="synthetic">Synthetic (Empire Tech)</option>
                      </select>
                    </div>
                  </div>

                  {/* 3-Column Asset Upload & Material Specification */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Base Materials A & B and Height/Roughness Texture Uploads */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-400" />
                          2 Base Materials (Texture Uploads)
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Base materials are identical in heightmap/roughness, differing only in Albedo A and B.
                        </p>
                      </div>

                      {/* Base Material A Upload */}
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-300">Base Material A (Primary Albedo)</span>
                          {selectedTileType.baseMaterialA.albedoTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: undefined }
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Clear
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-200 transition">
                            <Upload size={13} className="text-cyan-400" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, (url) => {
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: url }
                                }));
                              })}
                            />
                          </label>

                          <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                            {selectedTileType.baseMaterialA.albedoTextureUrl ? 'Custom Image Loaded' : 'Procedural Fallback'}
                          </span>
                        </div>
                      </div>

                      {/* Base Material B Upload */}
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-300">Base Material B (Secondary Albedo)</span>
                          {selectedTileType.baseMaterialBTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                baseMaterialBTextureUrl: undefined
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Clear
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-200 transition">
                            <Upload size={13} className="text-cyan-400" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, (url) => {
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  baseMaterialBTextureUrl: url
                                }));
                              })}
                            />
                          </label>

                          <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                            {selectedTileType.baseMaterialBTextureUrl ? 'Custom Image Loaded' : 'Procedural Fallback'}
                          </span>
                        </div>
                      </div>

                      {/* Heightmap Upload & Depth Scale */}
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-300">Shared Heightmap (Relief Depth)</span>
                          {selectedTileType.heightMapTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                heightMapTextureUrl: undefined
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Clear
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-200 transition">
                            <Upload size={13} className="text-amber-400" />
                            <span>Upload Grayscale</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, (url) => {
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  heightMapTextureUrl: url
                                }));
                              })}
                            />
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {selectedTileType.heightMapTextureUrl ? 'Custom Heightmap' : 'Procedural Depth'}
                          </span>
                        </div>

                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-400">Shadow Relief Scale:</span>
                            <span className="font-mono text-amber-400 font-bold">{selectedTileType.baseMaterialA.heightMapScale}</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.baseMaterialA.heightMapScale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, heightMapScale: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>

                      {/* Roughness Map Upload & Slider */}
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-300">Shared Roughness Map (Matte vs Gloss)</span>
                          {selectedTileType.roughnessMapTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                roughnessMapTextureUrl: undefined
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Clear
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-200 transition">
                            <Upload size={13} className="text-cyan-400" />
                            <span>Upload Roughness</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, (url) => {
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  roughnessMapTextureUrl: url
                                }));
                              })}
                            />
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {selectedTileType.roughnessMapTextureUrl ? 'Custom Roughness' : 'Procedural Sheen'}
                          </span>
                        </div>

                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-400">Roughness Factor:</span>
                            <span className="font-mono text-cyan-400 font-bold">{selectedTileType.baseMaterialA.roughness}</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.baseMaterialA.roughness}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              baseMaterialA: { ...tt.baseMaterialA, roughness: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-cyan-500"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Column 2: Dual-Overlapping Noise Blend Map */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Sliders size={14} className="text-blue-400" />
                          Dual Overlapping Noise Blend Map
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Seamlessly blends Base A and Base B across world coordinates to eliminate tile repetition.
                        </p>
                      </div>

                      {/* Noise A Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-neutral-300">
                          <span>Noise Layer 1 (Macro Scale)</span>
                          <span className="text-blue-400 font-mono">{selectedTileType.blendMap.noiseA.scale}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="96"
                          step="4"
                          value={selectedTileType.blendMap.noiseA.scale}
                          onChange={(e) => handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            blendMap: {
                              ...tt.blendMap,
                              noiseA: { ...tt.blendMap.noiseA, scale: parseInt(e.target.value) }
                            }
                          }))}
                          className="w-full accent-blue-500"
                        />
                      </div>

                      {/* Noise B Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-neutral-300">
                          <span>Noise Layer 2 (Micro Detail)</span>
                          <span className="text-indigo-400 font-mono">{selectedTileType.blendMap.noiseB.scale}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="32"
                          step="2"
                          value={selectedTileType.blendMap.noiseB.scale}
                          onChange={(e) => handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            blendMap: {
                              ...tt.blendMap,
                              noiseB: { ...tt.blendMap.noiseB, scale: parseInt(e.target.value) }
                            }
                          }))}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      {/* Blend Threshold & Contrast */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                            <span>Threshold</span>
                            <span className="text-white font-mono">{selectedTileType.blendMap.blendThreshold}</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={selectedTileType.blendMap.blendThreshold}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: { ...tt.blendMap, blendThreshold: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-blue-500"
                          />
                        </div>

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                            <span>Contrast</span>
                            <span className="text-white font-mono">{selectedTileType.blendMap.blendContrast}</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={selectedTileType.blendMap.blendContrast}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: { ...tt.blendMap, blendContrast: parseFloat(e.target.value) }
                            }))}
                            className="w-full accent-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Edge Overlays (Top, Bottom, Left, Right) & Combat / Tags */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Footprints size={14} className="text-emerald-400" />
                          Edge Overlays (Uploadable Trims)
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Composites top grass/snow, side rims, and bottom ledges onto the blob tileset.
                        </p>
                      </div>

                      {/* Top Overlay */}
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTileType.tileDetails.top.enabled}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, enabled: e.target.checked } }
                              }))}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-semibold text-neutral-200">Top Edge (Grass / Ridge Trim)</span>
                          </label>

                          {selectedTileType.tileDetails.top.overlayTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: undefined } }
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {selectedTileType.tileDetails.top.enabled && (
                          <div className="flex items-center gap-2 pt-1">
                            <label className="cursor-pointer px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] font-semibold flex items-center gap-1 text-neutral-200">
                              <Upload size={11} className="text-emerald-400" />
                              <span>Upload Trim PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: url } }
                                  }));
                                })}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">
                              {selectedTileType.tileDetails.top.overlayTextureUrl ? 'Custom Trim PNG' : 'Procedural Edge'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Overlay */}
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTileType.tileDetails.bottom.enabled}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, enabled: e.target.checked } }
                              }))}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-semibold text-neutral-200">Bottom Shadow Trim</span>
                          </label>

                          {selectedTileType.tileDetails.bottom.overlayTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: undefined } }
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {selectedTileType.tileDetails.bottom.enabled && (
                          <div className="flex items-center gap-2 pt-1">
                            <label className="cursor-pointer px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] font-semibold flex items-center gap-1 text-neutral-200">
                              <Upload size={11} className="text-emerald-400" />
                              <span>Upload Trim PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: url } }
                                  }));
                                })}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">
                              {selectedTileType.tileDetails.bottom.overlayTextureUrl ? 'Custom Trim PNG' : 'Procedural Shadow'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Left Side Overlay */}
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTileType.tileDetails.leftSide.enabled}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, enabled: e.target.checked } }
                              }))}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-semibold text-neutral-200">Left Side Overlay</span>
                          </label>

                          {selectedTileType.tileDetails.leftSide.overlayTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: undefined } }
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {selectedTileType.tileDetails.leftSide.enabled && (
                          <div className="flex items-center gap-2 pt-1">
                            <label className="cursor-pointer px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] font-semibold flex items-center gap-1 text-neutral-200">
                              <Upload size={11} className="text-emerald-400" />
                              <span>Upload Trim PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: url } }
                                  }));
                                })}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">
                              {selectedTileType.tileDetails.leftSide.overlayTextureUrl ? 'Custom Trim PNG' : 'Procedural Rim'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Side Overlay */}
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTileType.tileDetails.rightSide.enabled}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, enabled: e.target.checked } }
                              }))}
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-semibold text-neutral-200">Right Side Overlay</span>
                          </label>

                          {selectedTileType.tileDetails.rightSide.overlayTextureUrl && (
                            <button
                              onClick={() => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: undefined } }
                              }))}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {selectedTileType.tileDetails.rightSide.enabled && (
                          <div className="flex items-center gap-2 pt-1">
                            <label className="cursor-pointer px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] font-semibold flex items-center gap-1 text-neutral-200">
                              <Upload size={11} className="text-emerald-400" />
                              <span>Upload Trim PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => {
                                  handleUpdateCurrentTileType(tt => ({
                                    ...tt,
                                    tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: url } }
                                  }));
                                })}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">
                              {selectedTileType.tileDetails.rightSide.overlayTextureUrl ? 'Custom Trim PNG' : 'Procedural Rim'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Destructibility & Traversal */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-300">
                            <input
                              type="checkbox"
                              checked={selectedTileType.isDestructible}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, isDestructible: e.target.checked }))}
                              className="rounded accent-red-500 cursor-pointer"
                            />
                            <span>Destructible Tile</span>
                          </label>

                          {selectedTileType.isDestructible && (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span className="text-neutral-500">HP:</span>
                              <input
                                type="number"
                                value={selectedTileType.health}
                                onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, health: parseInt(e.target.value) || 0 }))}
                                className="w-14 bg-neutral-900 border border-neutral-700 text-right px-1.5 py-0.5 rounded text-red-400 font-bold"
                              />
                            </div>
                          )}
                        </div>

                        {/* Traversal Tags */}
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-neutral-400 block mb-1">Traversal Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {TRAVERSAL_TAG_LIST.map(({ tag, label }) => {
                              const hasTag = selectedTileType.traversal_tags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    const newTags = hasTag
                                      ? selectedTileType.traversal_tags.filter(t => t !== tag)
                                      : [...selectedTileType.traversal_tags, tag];
                                    handleUpdateCurrentTileType(tt => ({ ...tt, traversal_tags: newTags }));
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                                    hasTag
                                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Blob Tileset Preview (47-Blob Matrix & Live Sandbox) */}
                  <BlobTilesetPreview
                    tileType={selectedTileType}
                    onUpdateTileType={(updated) => handleUpdateCurrentTileType(() => updated)}
                  />

                </div>
              )}

            </div>
          )}

          {/* TAB 2: ENVIRONMENTAL NON-TILE DETAILS (Trees, Rocks, Bushes) */}
          {activeSubTab === 'environmental' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Environmental Details (Non-Tile)</h3>
                  <p className="text-xs text-neutral-400">
                    Trees, bushes, and rocks. Environmental assets not intended for player interaction beyond possible destruction.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newDetail: EnvironmentalDetail = {
                      id: `env_${Date.now()}`,
                      name: 'New Flora / Rock Detail',
                      category: 'rock',
                      icon: '🪨',
                      color: '#475569',
                      widthTiles: 1,
                      heightTiles: 1,
                      spawnFrequency: 0.15,
                      isDestructible: true,
                      health: 60,
                      armor: 5
                    };
                    handleUpdateCurrentBiome(b => ({
                      ...b,
                      environmentalDetails: [...b.environmentalDetails, newDetail]
                    }));
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
                >
                  <Plus size={13} /> Add Environmental Detail
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBiome.environmentalDetails.map((detail, idx) => (
                  <div key={detail.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{detail.icon}</span>
                        <div>
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) => {
                              const updated = [...selectedBiome.environmentalDetails];
                              updated[idx] = { ...detail, name: e.target.value };
                              handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                            }}
                            className="font-bold text-xs text-neutral-200 bg-transparent border-b border-dashed border-neutral-700 outline-none"
                          />
                          <div className="text-[10px] text-neutral-500 font-mono capitalize">{detail.category}</div>
                        </div>
                      </div>
                      <input
                        type="color"
                        value={detail.color}
                        onChange={(e) => {
                          const updated = [...selectedBiome.environmentalDetails];
                          updated[idx] = { ...detail, color: e.target.value };
                          handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                        }}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-400">Auto-Scatter Frequency</span>
                        <span className="font-mono text-emerald-400">{(detail.spawnFrequency * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={detail.spawnFrequency}
                        onChange={(e) => {
                          const updated = [...selectedBiome.environmentalDetails];
                          updated[idx] = { ...detail, spawnFrequency: parseFloat(e.target.value) };
                          handleUpdateCurrentBiome(b => ({ ...b, environmentalDetails: updated }));
                        }}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE PLACEMENTS */}
          {activeSubTab === 'interactive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Interactive Placements</h3>
                  <p className="text-xs text-neutral-400">
                    Binding stones (checkpoints), doors/gates, enemy spawners, and chests/containers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBiome.interactiveDetails.map((item) => (
                  <div key={item.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-neutral-200">{item.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono capitalize">{item.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-xs bg-neutral-950 p-2 rounded text-neutral-400 italic">
                      Prompt: "{item.interactionPrompt}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WILDLIFE */}
          {activeSubTab === 'wildlife' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">Wildlife & Creatures</h3>
                  <p className="text-xs text-neutral-400">
                    Ambient, interactable, and neutral wildlife specific to this biome ecosystem.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBiome.wildlife.map((beast) => (
                  <div key={beast.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{beast.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-neutral-200">{beast.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono capitalize">{beast.behavior.replace('_', ' ')}</div>
                      </div>
                    </div>
                    {beast.interactionAction && (
                      <div className="text-xs bg-neutral-950 p-2 rounded text-emerald-300">
                        Action: {beast.interactionAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SOUNDTRACK & AUDIO */}
          {activeSubTab === 'soundtrack' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Music size={16} className="text-indigo-400" />
                  Adaptive Soundtrack & Audio Rules
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Exploration Theme:</span>
                    <span className="font-mono text-indigo-300">{selectedBiome.soundtrack.ambientExplorationTrack}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Combat Encounter Theme:</span>
                    <span className="font-mono text-red-300">{selectedBiome.soundtrack.combatTrack}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <span className="text-neutral-300">Boss Arena Theme:</span>
                    <span className="font-mono text-amber-300">{selectedBiome.soundtrack.bossEngagementTrack}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
};
