import React, { useState } from 'react';
import { TileType, BlendStyle, DamageType, TraversalModifierTag } from '../engine/schema';
import { STANDARD_TILE_TYPES } from '../engine/tileTypes';
import { 
  Layers, 
  Sparkles, 
  Shield, 
  Flame, 
  Footprints, 
  Sliders, 
  Copy, 
  Plus, 
  Trash2, 
  Activity,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface TileTypeEditorProps {
  tileTypes: Record<string, TileType>;
  onUpdateTileTypes: (types: Record<string, TileType>) => void;
  onSelectForPainting?: (tileTypeId: string) => void;
  activePaintTileId?: string;
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

const TRAVERSAL_TAGS: { tag: TraversalModifierTag; label: string; desc: string }[] = [
  { tag: 'climbable', label: 'Climbable', desc: 'Allows wall navigation and vertical ascent' },
  { tag: 'sticky', label: 'Sticky', desc: 'Halts slide momentum; reduces jump height' },
  { tag: 'bouncy', label: 'Bouncy', desc: 'Reflects kinetic velocity and enhances leaps' },
  { tag: 'slippery', label: 'Slippery', desc: 'Lowers friction, increases slide speed' },
  { tag: 'hazard', label: 'Hazard', desc: 'Deals contact damage via DamageResolver' }
];

export const TileTypeEditor: React.FC<TileTypeEditorProps> = ({
  tileTypes,
  onUpdateTileTypes,
  onSelectForPainting,
  activePaintTileId
}) => {
  const tileList: TileType[] = Object.values(tileTypes);
  const [selectedId, setSelectedId] = useState<string>(tileList[0]?.id || 'stone');
  const [activeSubTab, setActiveSubTab] = useState<'shading' | 'combat' | 'traversal'>('shading');

  const selectedTile = tileTypes[selectedId] || tileList[0];

  const handleUpdateCurrent = (updater: (prev: TileType) => TileType) => {
    onUpdateTileTypes({
      ...tileTypes,
      [selectedId]: updater(selectedTile)
    });
  };

  const handleAddNewType = () => {
    const newId = `material_${Date.now()}`;
    const newTile: TileType = {
      id: newId,
      name: 'New Material Strata',
      category: 'natural',
      height_map_scale: 0.5,
      base_color: '#3b82f6',
      surface_overlay_top: '#60a5fa',
      softness: 0.5,
      blend_style: 'fade',
      fade_amount: 0.4,
      health: 80,
      defense_type: 'kinetic',
      armor_deduction: 5,
      damage_affinities: {
        kinetic: 1.0,
        thermal: 1.0
      },
      shares_damage_overlay: true,
      traversal_tags: [],
      speed_modifier: 1.0
    };
    onUpdateTileTypes({
      ...tileTypes,
      [newId]: newTile
    });
    setSelectedId(newId);
  };

  const handleDuplicate = (tile: TileType) => {
    const newId = `${tile.id}_copy_${Date.now()}`;
    const cloned: TileType = {
      ...JSON.parse(JSON.stringify(tile)),
      id: newId,
      name: `${tile.name} (Copy)`
    };
    onUpdateTileTypes({
      ...tileTypes,
      [newId]: cloned
    });
    setSelectedId(newId);
  };

  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      
      {/* Left Material Resources Rail */}
      <aside className="w-72 border-r border-neutral-800 bg-neutral-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
              <Layers size={16} className="text-blue-400" />
              TileType Resources
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Reference-not-duplicate model</p>
          </div>
          <button
            onClick={handleAddNewType}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
            title="Create new TileType"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* List of TileTypes */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {tileList.map(tile => {
            const isSelected = selectedId === tile.id;
            const isActivePaint = activePaintTileId === tile.id;

            return (
              <div
                key={tile.id}
                onClick={() => setSelectedId(tile.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col gap-1.5 relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                    : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: tile.base_color }}
                    />
                    <span className="font-semibold text-xs text-neutral-200 truncate max-w-[130px]">
                      {tile.name}
                    </span>
                  </div>

                  {isActivePaint && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      PAINT
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span className="capitalize font-mono text-[10px] text-neutral-400">
                    {tile.blend_style} (soft {tile.softness})
                  </span>
                  <span className="font-mono text-red-400">HP {tile.health} (Arm {tile.armor_deduction})</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70">
          <button
            onClick={() => onSelectForPainting?.(selectedTile.id)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <Check size={14} />
            Paint World with {selectedTile.name}
          </button>
        </div>
      </aside>

      {/* Main Configuration Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        
        {/* Top Header */}
        <div className="p-6 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur flex items-center justify-between shrink-0">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={selectedTile.name}
                onChange={(e) => handleUpdateCurrent(t => ({ ...t, name: e.target.value }))}
                className="font-bold text-xl text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 hover:border-blue-500 focus:border-blue-500 outline-none px-1 py-0.5"
              />
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                Resource ID: {selectedTile.id}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              One unified resource per material. Rebalancing here updates all world cells referencing <code className="text-blue-400 font-mono">"{selectedTile.id}"</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDuplicate(selectedTile)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <Copy size={13} /> Duplicate
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-800 flex items-center gap-2 shrink-0 bg-neutral-900/30">
          <button
            onClick={() => setActiveSubTab('shading')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'shading' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Sparkles size={14} /> Height-Blend Shader & Textures
          </button>
          <button
            onClick={() => setActiveSubTab('combat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'combat' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Flame size={14} /> Damage & Destruction Resolver
          </button>
          <button
            onClick={() => setActiveSubTab('traversal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'traversal' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Footprints size={14} /> Traversal & Speed Modifiers
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: SHADER & BLEND STYLE */}
          {activeSubTab === 'shading' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Shader Math Controls */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Sliders size={14} className="text-blue-400" />
                    Height-Blend Shader Parameters
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">Continuous smoothstep</span>
                </div>

                {/* Blend Style Selector */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-2">Blend Style Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fade', 'line', 'dither'] as BlendStyle[]).map(style => (
                      <button
                        key={style}
                        onClick={() => handleUpdateCurrent(t => ({ ...t, blend_style: style }))}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                          selectedTile.blend_style === style
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    {selectedTile.blend_style === 'fade' && 'Continuous wide smoothstep blend across the height delta.'}
                    {selectedTile.blend_style === 'line' && 'Tight transition band with distinct edge contouring.'}
                    {selectedTile.blend_style === 'dither' && '4×4 Bayer matrix dithered pixel transition.'}
                  </p>
                </div>

                {/* Softness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">Softness (Neighbor Bleed)</span>
                    <span className="font-mono text-blue-400 font-bold">{selectedTile.softness}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={selectedTile.softness}
                    onChange={(e) => handleUpdateCurrent(t => ({ ...t, softness: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Controls how far a neighbor bleeds into this tile (larger = softer/more permissive).
                  </span>
                </div>

                {/* Fade Amount Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">Fade Amount</span>
                    <span className="font-mono text-blue-400 font-bold">{selectedTile.fade_amount}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={selectedTile.fade_amount}
                    onChange={(e) => handleUpdateCurrent(t => ({ ...t, fade_amount: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Softens any style toward the wide continuous Fade curve.
                  </span>
                </div>

                {/* Height Map Scale */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">Height Map Scale (Shadow Depth)</span>
                    <span className="font-mono text-blue-400 font-bold">{selectedTile.height_map_scale}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={selectedTile.height_map_scale}
                    onChange={(e) => handleUpdateCurrent(t => ({ ...t, height_map_scale: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Shared directly with the 2D directional shadow shader.
                  </span>
                </div>
              </div>

              {/* Textures & Albedo Colors */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    World-Aligned Texture & Colors
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">1 texel = 1 world unit</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-300">Base Albedo Strata</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedTile.base_color}
                        onChange={(e) => handleUpdateCurrent(t => ({ ...t, base_color: e.target.value }))}
                        className="w-8 h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-400">{selectedTile.base_color}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-300">Top Surface Overlay</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedTile.surface_overlay_top || '#52525b'}
                        onChange={(e) => handleUpdateCurrent(t => ({ ...t, surface_overlay_top: e.target.value }))}
                        className="w-8 h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-400">{selectedTile.surface_overlay_top || 'None'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-300">Side Surface Overlay</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedTile.surface_overlay_side || '#27272a'}
                        onChange={(e) => handleUpdateCurrent(t => ({ ...t, surface_overlay_side: e.target.value }))}
                        className="w-8 h-8 rounded border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-400">{selectedTile.surface_overlay_side || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 space-y-1">
                  <div className="font-semibold text-neutral-300 flex items-center gap-1">
                    <Info size={13} className="text-blue-400" />
                    Texture Authoring Strategy
                  </div>
                  <p>
                    Uniform base textures sampled at true world position via MODEL_MATRIX. Visual interest driven by Mason-placed detail scatter rather than artificial noise composite layers.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COMBAT & DAMAGE RESOLVER */}
          {activeSubTab === 'combat' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Stats & Threshold Overlay */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Shield size={14} className="text-red-400" />
                    Damage & Flat Armor Pipeline
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">Shared DamageResolver</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Base Health (HP)</span>
                    <input
                      type="number"
                      value={selectedTile.health}
                      onChange={(e) => handleUpdateCurrent(t => ({ ...t, health: parseInt(e.target.value) || 0 }))}
                      className="text-xl font-bold text-red-400 bg-transparent outline-none w-full mt-1"
                    />
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Armor Deduction</span>
                    <input
                      type="number"
                      value={selectedTile.armor_deduction}
                      onChange={(e) => handleUpdateCurrent(t => ({ ...t, armor_deduction: parseInt(e.target.value) || 0 }))}
                      className="text-xl font-bold text-neutral-200 bg-transparent outline-none w-full mt-1"
                    />
                  </div>
                </div>

                {/* Shares Damage Overlay Checkbox */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="shares_overlay"
                    checked={selectedTile.shares_damage_overlay}
                    onChange={(e) => handleUpdateCurrent(t => ({ ...t, shares_damage_overlay: e.target.checked }))}
                    className="mt-1 rounded accent-blue-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="shares_overlay" className="font-semibold text-xs text-neutral-200 cursor-pointer">
                      Shares Contiguous Damage Overlay Mask
                    </label>
                    <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                      When true, crack & destruction threshold masks bleed contiguously across neighbors sharing this threshold instead of isolated cell cracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* 8-Point Modality RPS Wheel */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Flame size={14} className="text-amber-400" />
                    8-Point Modality RPS Multipliers
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">attack_damage → RPS</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DAMAGE_TYPES.map(({ type, label, color, icon }) => {
                    const currentMult = selectedTile.damage_affinities[type] ?? 1.0;
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
                            handleUpdateCurrent(t => ({
                              ...t,
                              damage_affinities: {
                                ...t.damage_affinities,
                                [type]: val
                              }
                            }));
                          }}
                          className="w-14 bg-neutral-900 border border-neutral-700 text-right px-1.5 py-0.5 rounded font-mono text-neutral-200 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TRAVERSAL & SPEED MODIFIERS */}
          {activeSubTab === 'traversal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Footprints size={14} className="text-emerald-400" />
                    Traversal Tags & Modifiers
                  </h3>
                </div>

                <div className="space-y-2">
                  {TRAVERSAL_TAGS.map(({ tag, label, desc }) => {
                    const hasTag = selectedTile.traversal_tags.includes(tag);
                    return (
                      <div
                        key={tag}
                        onClick={() => {
                          const updatedTags = hasTag
                            ? selectedTile.traversal_tags.filter(t => t !== tag)
                            : [...selectedTile.traversal_tags, tag];
                          handleUpdateCurrent(t => ({ ...t, traversal_tags: updatedTags }));
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                          hasTag
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:bg-neutral-900'
                        }`}
                      >
                        <div>
                          <span className="font-semibold block">{label}</span>
                          <span className="text-[10px] text-neutral-500">{desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={hasTag}
                          readOnly
                          className="rounded accent-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300">
                    Speed Modifier on Contact
                  </h3>
                  <span className="font-mono text-emerald-400 font-bold">{selectedTile.speed_modifier}x</span>
                </div>

                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={selectedTile.speed_modifier}
                  onChange={(e) => handleUpdateCurrent(t => ({ ...t, speed_modifier: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />

                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>0.2x (Deep Sludge)</span>
                  <span>1.0x (Standard)</span>
                  <span>2.0x (Fast Slide)</span>
                </div>

                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 space-y-1">
                  <span className="font-semibold text-neutral-300">Gating Separation</span>
                  <p>
                    TileType handles speed and contact hazards. Progression gating is explicitly reserved for archetype traversal abilities (double jump, dash, glide).
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
};
