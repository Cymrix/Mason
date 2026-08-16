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
import { DEFAULT_PARALLAX_LAYERS } from '../engine/parallaxConfig';
import { BlobTilesetPreview } from './BlobTilesetPreview';
import { ParallaxLayersEditor } from './ParallaxLayersEditor';
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
  Shuffle,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
  Palette,
  X,
  ZoomIn,
  Maximize2
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

interface ImageUploadThumbnailFieldProps {
  label: string;
  sublabel?: string;
  badge?: string;
  imageUrl?: string;
  fallbackColor?: string;
  fallbackText?: string;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
  onPreviewModal?: (title: string, url: string) => void;
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'blue' | 'purple';
  accept?: string;
}

const ImageUploadThumbnailField: React.FC<ImageUploadThumbnailFieldProps> = ({
  label,
  sublabel,
  badge,
  imageUrl,
  fallbackColor,
  fallbackText = 'Procedural',
  onUpload,
  onClear,
  onPreviewModal,
  accentColor = 'cyan',
  accept = 'image/*'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpload(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const accentBorder = {
    cyan: 'border-cyan-500/50 group-hover:border-cyan-400',
    amber: 'border-amber-500/50 group-hover:border-amber-400',
    emerald: 'border-emerald-500/50 group-hover:border-emerald-400',
    blue: 'border-blue-500/50 group-hover:border-blue-400',
    purple: 'border-purple-500/50 group-hover:border-purple-400'
  }[accentColor];

  const accentText = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
  }[accentColor];

  const accentBg = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }[accentColor];

  return (
    <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-neutral-200 truncate">{label}</span>
          {badge && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase border ${accentBg} shrink-0`}>
              {badge}
            </span>
          )}
        </div>
        {imageUrl && (
          <div className="flex items-center gap-2 shrink-0">
            {onPreviewModal && (
              <button
                type="button"
                onClick={() => onPreviewModal(label, imageUrl)}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                title="View Full Size Image"
              >
                <Eye size={11} /> Zoom
              </button>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              title="Remove Image"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
        )}
      </div>

      {sublabel && (
        <p className="text-[10px] text-neutral-400">{sublabel}</p>
      )}

      {/* Thumbnail + Action Controls */}
      <div className="flex items-center gap-3 pt-0.5">
        {/* Visual Thumbnail Box with Checkerboard Background */}
        <div
          onClick={() => {
            if (imageUrl && onPreviewModal) {
              onPreviewModal(label, imageUrl);
            } else {
              fileInputRef.current?.click();
            }
          }}
          className={`relative group w-12 h-12 rounded-lg border overflow-hidden cursor-pointer shrink-0 transition-all shadow-inner flex items-center justify-center ${
            imageUrl 
              ? `${accentBorder} shadow-black/60 ring-1 ring-white/5` 
              : 'border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-900/60'
          }`}
          style={{
            backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
            backgroundSize: '10px 10px',
            backgroundColor: fallbackColor || '#18181b'
          }}
          title={imageUrl ? 'Click to inspect thumbnail in high-resolution zoom modal' : 'Click to select and upload image'}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={label}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <ZoomIn size={14} className="drop-shadow" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-500 group-hover:text-neutral-300 transition-colors p-1 text-center">
              <ImageIcon size={16} className="mb-0.5 opacity-70" />
              <span className="text-[8px] font-mono leading-tight">{fallbackText}</span>
            </div>
          )}
        </div>

        {/* Upload & Info Section */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 rounded-md text-[11px] font-medium flex items-center gap-1.5 text-neutral-200 transition active:scale-95 shadow-sm">
              <Upload size={12} className={accentText} />
              <span>{imageUrl ? 'Replace' : 'Upload'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {imageUrl ? (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                <Check size={11} className="text-emerald-400 shrink-0" />
                Custom Texture Active
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500 font-mono truncate">
                Procedural Fallback
              </span>
            )}
          </div>

          <div className="text-[9px] text-neutral-500 truncate">
            {imageUrl ? 'Active in Blob Autotile engine' : 'Default algorithmic noise shader'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RefinedBiomeEditor: React.FC<RefinedBiomeEditorProps> = ({
  biomes,
  onUpdateBiomes,
  onSelectForPainting,
  activePaintBiomeId
}) => {
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(biomes?.[0]?.id || 'mourne_ashen_steppes');
  const [activeSubTab, setActiveSubTab] = useState<'tile_types' | 'environmental' | 'interactive' | 'wildlife' | 'soundtrack' | 'parallax'>('tile_types');
  const [selectedTileTypeIndex, setSelectedTileTypeIndex] = useState<number>(0);
  const [previewModalImage, setPreviewModalImage] = useState<{ title: string; url: string } | null>(null);
  const [deleteConfirmBiomeId, setDeleteConfirmBiomeId] = useState<string | null>(null);

  const selectedBiome = biomes.find(b => b.id === selectedBiomeId) || biomes[0];
  const selectedTileType = selectedBiome?.tileTypes?.[selectedTileTypeIndex] || selectedBiome?.tileTypes?.[0];

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
        top: {  thicknessPx: 6, noiseEdge: true },
        bottom: {  thicknessPx: 4, noiseEdge: false },
        leftSide: {  thicknessPx: 3, noiseEdge: false },
        rightSide: {  thicknessPx: 3, noiseEdge: false },
        innerCorner: {  },
        slope: {  thicknessPx: 4, noiseEdge: false }
      },
      isDestructible: true,
      materialType: 'hard',
      bevelProbability: 0,
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

  // Handler: Add Brand New Biome
  const handleAddNewBiome = () => {
    const newId = `biome_${Date.now()}`;
    const primaryTileId = `tile_${newId}_primary`;
    const newBiome: RefinedBiome = {
      id: newId,
      name: 'New Custom Biome',
      description: 'Custom regional strata with dual-noise blended materials and parallax backdrop.',
      regionColor: '#10b981',
      ambientBackgroundColor: '#0f172a',
      atmosphereFogColor: '#1e293b',
      atmosphereFogDensity: 0.2,
      primaryTileTypeId: primaryTileId,
      tileTypes: [
        {
          id: primaryTileId,
          name: 'Primary Terrain Strata',
          category: 'natural',
          mapColor: '#10b981',
          baseMaterialA: {
            albedoColor: '#059669',
            heightMapScale: 0.6,
            roughness: 0.7,
            normalStrength: 1.0
          },
          baseMaterialBAlbedoColor: '#34d399',
          blendMap: {
            noiseA: { scale: 32, octaves: 2, persistence: 0.5, lacunarity: 2.0, offset: { x: 0, y: 0 }, weight: 0.6 },
            noiseB: { scale: 16, octaves: 2, persistence: 0.5, lacunarity: 2.0, offset: { x: 10, y: 10 }, weight: 0.4 },
            blendThreshold: 0.5,
            blendContrast: 1.2,
            invert: false
          },
          tileDetails: {
            top: {  color: '#6ee7b7', thicknessPx: 6, noiseEdge: true },
            bottom: {  color: '#047857', thicknessPx: 4, noiseEdge: false },
            leftSide: {  thicknessPx: 3, noiseEdge: false },
            rightSide: {  thicknessPx: 3, noiseEdge: false },
            innerCorner: {  },
        slope: {  thicknessPx: 4, noiseEdge: false }
          },
          isDestructible: true,
      materialType: 'hard',
      bevelProbability: 0,
          health: 100,
          defense_type: 'kinetic',
          armor_deduction: 5,
          damage_affinities: { kinetic: 1.0, thermal: 1.0 },
          shares_damage_overlay: true,
          traversal_tags: [],
          speed_modifier: 1.0
        }
      ],
      environmentalDetails: [],
      interactiveDetails: [],
      wildlife: [],
      soundtrack: {
        ambientExplorationTrack: 'synth_droning_echoes.mp3',
        combatTrack: 'heavy_percussion_tension.mp3',
        reverbDecaySeconds: 1.2,
        windIntensity: 0.3
      },
      noiseRules: {
        macroScale: 48,
        elevationRange: [0.0, 1.0],
        moistureRange: [0.0, 1.0]
      },
      parallaxLayers: DEFAULT_PARALLAX_LAYERS.mourne_ashen_steppes ? JSON.parse(JSON.stringify(DEFAULT_PARALLAX_LAYERS.mourne_ashen_steppes)) : []
    };

    onUpdateBiomes([...biomes, newBiome]);
    setSelectedBiomeId(newId);
    setSelectedTileTypeIndex(0);
  };

  // Handler: Delete Biome
  const handleDeleteBiome = (biomeIdToDelete: string) => {
    if (biomes.length <= 1) {
      alert('Cannot delete the last remaining biome. Projects must contain at least one regional biome.');
      return;
    }

    const targetBiome = biomes.find(b => b.id === biomeIdToDelete);
    if (!targetBiome) return;

    if (window.confirm(`Are you sure you want to delete the biome "${targetBiome.name}"? This action cannot be undone.`)) {
      const remaining = biomes.filter(b => b.id !== biomeIdToDelete);
      onUpdateBiomes(remaining);

      if (selectedBiomeId === biomeIdToDelete) {
        setSelectedBiomeId(remaining[0].id);
        setSelectedTileTypeIndex(0);
      }
    }
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddNewBiome}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
              title="Add New Biome"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
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
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-1.5 relative group ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: biome.regionColor }}
                    />
                    <span className="font-semibold text-xs text-neutral-200 truncate">
                      {biome.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPainting && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                        ACTIVE
                      </span>
                    )}
                    {biomes.length > 1 && (
                      deleteConfirmBiomeId === biome.id ? (
                        <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/50 rounded p-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBiome(biome.id);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold"
                          >
                            Del
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmBiomeId(null);
                            }}
                            className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[9px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmBiomeId(biome.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 hover:bg-red-950/40 rounded transition"
                          title="Delete Biome"
                        >
                          <Trash2 size={12} />
                        </button>
                      )
                    )}
                  </div>
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

            {biomes.length > 1 && (
              deleteConfirmBiomeId === selectedBiome.id ? (
                <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/60 rounded-lg p-1 animate-in fade-in duration-150">
                  <span className="text-[11px] text-red-300 font-semibold px-1">Delete Biome?</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBiome(selectedBiome.id)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-bold transition shadow"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmBiomeId(null)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmBiomeId(selectedBiome.id)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Delete this Biome"
                >
                  <Trash2 size={13} />
                  <span>Delete Biome</span>
                </button>
              )
            )}
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
            <Layers size={14} /> 1. Tile Types, Textures & Autotiling ({selectedBiome?.tileTypes?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('environmental')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'environmental' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <TreePine size={14} /> 2. Environmental Non-Tile Details ({selectedBiome?.environmentalDetails?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('interactive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'interactive' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Box size={14} /> 3. Interactive Placements ({selectedBiome?.interactiveDetails?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('wildlife')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'wildlife' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Zap size={14} /> 4. Wildlife ({selectedBiome?.wildlife?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('soundtrack')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'soundtrack' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Music size={14} /> 5. Soundtrack & Audio Cues
          </button>
          <button
            onClick={() => setActiveSubTab('parallax')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'parallax' ? 'bg-cyan-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Layers size={14} className="text-cyan-300" /> 6. Parallax Backgrounds (-5 to +1)
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

                  {/* Row 1: Texture Uploads & Edge Trim Specification */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Panel 1: Base Materials A & B and Height/Roughness Texture Uploads */}
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
                      <ImageUploadThumbnailField
                        label="Base Material A (Primary Albedo)"
                        badge="Albedo A"
                        imageUrl={selectedTileType.baseMaterialA.albedoTextureUrl}
                        fallbackColor={selectedTileType.baseMaterialA.albedoColor || '#475569'}
                        fallbackText="Albedo A"
                        accentColor="cyan"
                        onUpload={(url) => {
                          handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: url }
                          }));
                        }}
                        onClear={() => {
                          handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            baseMaterialA: { ...tt.baseMaterialA, albedoTextureUrl: undefined }
                          }));
                        }}
                        onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                      />

                      {/* Base Material B Upload */}
                      <ImageUploadThumbnailField
                        label="Base Material B (Secondary Albedo)"
                        badge="Albedo B"
                        imageUrl={selectedTileType.baseMaterialBTextureUrl}
                        fallbackColor={selectedTileType.baseMaterialBAlbedoColor || '#64748b'}
                        fallbackText="Albedo B"
                        accentColor="blue"
                        onUpload={(url) => {
                          handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            baseMaterialBTextureUrl: url
                          }));
                        }}
                        onClear={() => {
                          handleUpdateCurrentTileType(tt => ({
                            ...tt,
                            baseMaterialBTextureUrl: undefined
                          }));
                        }}
                        onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                      />

                      {/* Heightmap Upload & Depth Scale */}
                      <div className="space-y-2">
                        <ImageUploadThumbnailField
                          label="Shared Heightmap (Relief Depth)"
                          badge="Heightmap"
                          imageUrl={selectedTileType.heightMapTextureUrl}
                          fallbackColor="#1e293b"
                          fallbackText="Grayscale"
                          accentColor="amber"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              heightMapTextureUrl: url
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              heightMapTextureUrl: undefined
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
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
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Roughness Map Upload & Slider */}
                      <div className="space-y-2">
                        <ImageUploadThumbnailField
                          label="Shared Roughness Map (Matte vs Gloss)"
                          badge="Roughness"
                          imageUrl={selectedTileType.roughnessMapTextureUrl}
                          fallbackColor="#1e293b"
                          fallbackText="Roughness"
                          accentColor="purple"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              roughnessMapTextureUrl: url
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              roughnessMapTextureUrl: undefined
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-neutral-400">Roughness Factor:</span>
                            <span className="font-mono text-purple-400 font-bold">{selectedTileType.baseMaterialA.roughness}</span>
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
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Panel 2: Edge Overlays (Top, Bottom, Left, Right) & Combat / Tags */}
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Top Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Top Edge Overlay Trim"
                          badge="Top"
                          imageUrl={selectedTileType.tileDetails.top.overlayTextureUrl}
                          
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, top: { ...tt.tileDetails.top, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Bottom Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Bottom Edge Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Bottom Edge Trim"
                          badge="Bottom"
                          imageUrl={selectedTileType.tileDetails.bottom.overlayTextureUrl}
                          
                          accentColor="purple"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, bottom: { ...tt.tileDetails.bottom, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Left Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Left Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Left Wall Trim"
                          badge="Left"
                          imageUrl={selectedTileType.tileDetails.leftSide.overlayTextureUrl}
                          
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, leftSide: { ...tt.tileDetails.leftSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Right Side Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Right Side Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Right Wall Trim"
                          badge="Right"
                          imageUrl={selectedTileType.tileDetails.rightSide.overlayTextureUrl}
                          
                          accentColor="blue"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, rightSide: { ...tt.tileDetails.rightSide, overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Top Slope Overlay (Floor) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Top Slope Overlay <span className="text-neutral-500 font-normal">(Floor Ramps ◢ / ◣)</span></span></div>
                        <ImageUploadThumbnailField
                          label="Top Slope Trim (Floor)"
                          badge="Top Slope"
                          sublabel="Upload a 45° Up-Right slope (◢). Mirrored horizontally for Up-Left (◣)."
                          imageUrl={selectedTileType.tileDetails.slopeTop?.overlayTextureUrl || (selectedTileType.tileDetails as any).slope?.overlayTextureUrl}
                          
                          accentColor="orange"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: url, thicknessPx: (tt.tileDetails as any).slope?.thicknessPx ?? 4, noiseEdge: true },
                                slopeTop: { ...((tt.tileDetails as any).slopeTop || {}), overlayTextureUrl: url, thicknessPx: 4, noiseEdge: true }
                              }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slope: { ...((tt.tileDetails as any).slope || {}), overlayTextureUrl: undefined },
                                slopeTop: { ...((tt.tileDetails as any).slopeTop || {}), overlayTextureUrl: undefined }
                              }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Bottom Slope Overlay (Ceiling) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Bottom Slope Overlay <span className="text-neutral-500 font-normal">(Ceiling ◥ / ◤)</span></span></div>
                        <ImageUploadThumbnailField
                          label="Bottom Slope Trim (Ceiling)"
                          badge="Bot Slope"
                          sublabel="Upload a 45° Ceil Down-Right slope (◥). Mirrored horizontally for Ceil Down-Left (◤)."
                          imageUrl={selectedTileType.tileDetails.slopeBottom?.overlayTextureUrl}
                          
                          accentColor="amber"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slopeBottom: { ...((tt.tileDetails as any).slopeBottom || {}), overlayTextureUrl: url, thicknessPx: 4, noiseEdge: true }
                              }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: {
                                ...tt.tileDetails,
                                slopeBottom: { ...((tt.tileDetails as any).slopeBottom || {}), overlayTextureUrl: undefined }
                              }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Block Inner Corner Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Block Inner Corner Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Block Inner Corner Trim"
                          badge="Block Inner"
                          sublabel="Concave inside corner between adjacent solid blocks."
                          imageUrl={selectedTileType.tileDetails.innerCorner?.overlayTextureUrl}
                          
                          accentColor="emerald"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, innerCorner: { ...((tt.tileDetails as any).innerCorner || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
                      </div>

                      {/* Slope Inner Corner Overlay */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">Slope Inner Corner Overlay</span></div>
                        <ImageUploadThumbnailField
                          label="Slope Inner Corner Trim"
                          badge="Slope Inner"
                          sublabel="Concave corner transition where slopes meet adjacent ground or walls."
                          imageUrl={selectedTileType.tileDetails.slopeInnerCorner?.overlayTextureUrl}
                          
                          accentColor="teal"
                          onUpload={(url) => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slopeInnerCorner: { ...((tt.tileDetails as any).slopeInnerCorner || {}), overlayTextureUrl: url } }
                            }));
                          }}
                          onClear={() => {
                            handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              tileDetails: { ...tt.tileDetails, slopeInnerCorner: { ...((tt.tileDetails as any).slopeInnerCorner || {}), overlayTextureUrl: undefined } }
                            }));
                          }}
                          onPreviewModal={(title, url) => setPreviewModalImage({ title, url })}
                        />
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

                      {/* Soft Material & 45° Corner Bevels (Sand / Silt / Snow) */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 font-bold text-amber-200">
                            <span>Material Type (Physics/Wear)</span>
                          </label>
                          <select
                            value={selectedTileType.materialType || 'hard'}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, materialType: e.target.value as any }))}
                            className="text-xs bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="hard">Hard</option>
                            <option value="soft">Soft</option>
                            <option value="water">Water</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Determines the gameplay mechanics for this material (e.g. footsteps, sinking, rendering layers).
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 font-bold text-teal-200">
                            <span>Auto-Bevel Slopes Probability</span>
                          </label>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${(selectedTileType.bevelProbability ?? 0) > 0 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-neutral-900 text-neutral-500'}`}>
                            {Math.round((selectedTileType.bevelProbability ?? 0) * 100)}%
                          </span>
                        </div>
                        <div className="pt-2 pb-1 px-1">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedTileType.bevelProbability ?? 0}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({ ...tt, bevelProbability: parseFloat(e.target.value) }))}
                            className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Determines the chance that exposed outer corners automatically bevel into smooth 45° diagonal ramps instead of sharp 90° block edges. 0% = always square, 100% = always sloped.
                        </p>

                        {(selectedTileType.bevelProbability ?? 0) > 0 && (
                          <div className="p-2 bg-teal-950/20 border border-teal-800/40 rounded flex items-center gap-2 text-[11px] text-teal-300/90 font-mono">
                            <span className="text-teal-400 font-bold">✓ Active:</span>
                            <span>16px micro-grid contouring enabled (◤ ◥ ◣ ◢ diagonal corner transitions)</span>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* Row 2: Live Dual-Noise Blend Controls (Left) & Real-Time Preview Workspace (Right) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Side: Dual-Overlapping Noise Blend Map Controls */}
                    <div className="xl:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
                      <div className="border-b border-neutral-800 pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Sliders size={14} className="text-blue-400" />
                          Dual Overlapping Noise Blend Map
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Seamlessly blends Base A and Base B. Tweak noise parameters here and observe real-time updates on the preview canvas to the right.
                        </p>
                      </div>

                      {/* Noise A Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200">Noise Layer 1 (Base A)</span>
                          <span className="text-blue-400 font-mono text-xs font-bold">{selectedTileType.blendMap.noiseA.scale}px Texel Size</span>
                        </div>

                        {/* Texel Size / Scale Slider (4px to 512px) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Texel Wavelength Scale</span>
                            <span className="font-mono text-neutral-300">{selectedTileType.blendMap.noiseA.scale}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="512"
                            step="4"
                            value={selectedTileType.blendMap.noiseA.scale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseA: { ...tt.blendMap.noiseA, scale: parseInt(e.target.value) || 4 }
                              }
                            }))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Weight Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Layer 1 Weight Influence</span>
                            <span className="font-mono text-blue-300 font-bold">{(selectedTileType.blendMap.noiseA.weight ?? 0.5).toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.blendMap.noiseA.weight ?? 0.5}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseA: { ...tt.blendMap.noiseA, weight: parseFloat(e.target.value) }
                              }
                            }))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Seed Input & Randomizer */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                          <span className="text-[10px] font-bold text-neutral-400">Noise Seed 1:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="99999"
                              value={selectedTileType.blendMap.noiseA.seed ?? 1337}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: {
                                  ...tt.blendMap,
                                  noiseA: { ...tt.blendMap.noiseA, seed: parseInt(e.target.value) || 0 }
                                }
                              }))}
                              className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono text-blue-300 outline-none text-right"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSeed = Math.floor(Math.random() * 9999);
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  blendMap: {
                                    ...tt.blendMap,
                                    noiseA: { ...tt.blendMap.noiseA, seed: newSeed }
                                  }
                                }));
                              }}
                              className="p-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-white transition"
                              title="Randomize Noise 1 Seed"
                            >
                              <Shuffle size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Noise B Controls */}
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200">Noise Layer 2 (Base B)</span>
                          <span className="text-indigo-400 font-mono text-xs font-bold">{selectedTileType.blendMap.noiseB.scale}px Texel Size</span>
                        </div>

                        {/* Texel Size / Scale Slider (4px to 512px) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Texel Wavelength Scale</span>
                            <span className="font-mono text-neutral-300">{selectedTileType.blendMap.noiseB.scale}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="512"
                            step="4"
                            value={selectedTileType.blendMap.noiseB.scale}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseB: { ...tt.blendMap.noiseB, scale: parseInt(e.target.value) || 4 }
                              }
                            }))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Weight Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Layer 2 Weight Influence</span>
                            <span className="font-mono text-indigo-300 font-bold">{(selectedTileType.blendMap.noiseB.weight ?? 0.5).toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={selectedTileType.blendMap.noiseB.weight ?? 0.5}
                            onChange={(e) => handleUpdateCurrentTileType(tt => ({
                              ...tt,
                              blendMap: {
                                ...tt.blendMap,
                                noiseB: { ...tt.blendMap.noiseB, weight: parseFloat(e.target.value) }
                              }
                            }))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Seed Input & Randomizer */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                          <span className="text-[10px] font-bold text-neutral-400">Noise Seed 2:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="99999"
                              value={selectedTileType.blendMap.noiseB.seed ?? 4242}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: {
                                  ...tt.blendMap,
                                  noiseB: { ...tt.blendMap.noiseB, seed: parseInt(e.target.value) || 0 }
                                }
                              }))}
                              className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono text-indigo-300 outline-none text-right"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSeed = Math.floor(Math.random() * 9999);
                                handleUpdateCurrentTileType(tt => ({
                                  ...tt,
                                  blendMap: {
                                    ...tt.blendMap,
                                    noiseB: { ...tt.blendMap.noiseB, seed: newSeed }
                                  }
                                }));
                              }}
                              className="p-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-white transition"
                              title="Randomize Noise 2 Seed"
                            >
                              <Shuffle size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Blend Threshold & Contrast */}
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                            <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                              <span>Threshold</span>
                              <span className="text-white font-mono">{selectedTileType.blendMap.blendThreshold}</span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="0.95"
                              step="0.05"
                              value={selectedTileType.blendMap.blendThreshold}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, blendThreshold: parseFloat(e.target.value) }
                              }))}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1">
                            <div className="flex justify-between text-[10px] text-neutral-400 font-bold">
                              <span>Contrast</span>
                              <span className="text-white font-mono">{selectedTileType.blendMap.blendContrast}</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="10.0"
                              step="0.1"
                              value={selectedTileType.blendMap.blendContrast}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, blendContrast: parseFloat(e.target.value) }
                              }))}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Invert Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!selectedTileType.blendMap.invert}
                              onChange={(e) => handleUpdateCurrentTileType(tt => ({
                                ...tt,
                                blendMap: { ...tt.blendMap, invert: e.target.checked }
                              }))}
                              className="rounded accent-blue-500 cursor-pointer"
                            />
                            <span className="text-neutral-300 font-medium">Invert Noise Mask (Base A ↔ B)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Real-time Blob Tileset Preview */}
                    <div className="xl:col-span-7 min-w-0">
                      <BlobTilesetPreview
                        tileType={selectedTileType}
                        onUpdateTileType={(updated) => handleUpdateCurrentTileType(() => updated)}
                      />
                    </div>

                  </div>

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

          {/* TAB 6: PARALLAX BACKGROUNDS (-5 TO +1) */}
          {activeSubTab === 'parallax' && (
            <ParallaxLayersEditor
              biome={selectedBiome}
              onUpdateBiome={handleUpdateCurrentBiome}
            />
          )}

        </div>

      </main>

      {/* Full-Resolution Image Inspection Lightbox Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm text-neutral-100">{previewModalImage.title} Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div 
              className="w-full h-72 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-inner p-4"
              style={{
                backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
                backgroundSize: '16px 16px'
              }}
            >
              <img
                src={previewModalImage.url}
                alt={previewModalImage.title}
                className="max-h-full max-w-full object-contain drop-shadow-2xl rounded"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span className="font-mono text-[11px] text-neutral-400">Crisp Pixelated • Alpha Transparency Preview</span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition text-xs shadow"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
