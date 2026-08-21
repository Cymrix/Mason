import React from 'react';
import { 
  RefinedBiome, 
  InteractivePlacementDetail, 
  PropKind, 
  PropInteractionMethod, 
  PropActionType 
} from '../engine/refinedBiomeSchema';
import { 
  Box, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Compass, 
  Zap, 
  Sparkles, 
  Activity, 
  Layers, 
  X,
  ChevronRight,
  Shield,
  Tag
} from 'lucide-react';

interface BiomePropsEditorProps {
  biome: RefinedBiome;
  onUpdateBiome: (updater: (prev: RefinedBiome) => RefinedBiome) => void;
  availableMaps?: { fileName: string; name: string }[];
}

export const BiomePropsEditor: React.FC<BiomePropsEditorProps> = ({
  biome,
  onUpdateBiome,
  availableMaps = []
}) => {
  const propsList = biome.interactiveDetails || [];

  const handleUpdateProp = (index: number, updater: (prev: InteractivePlacementDetail) => InteractivePlacementDetail) => {
    const updated = [...propsList];
    updated[index] = updater(updated[index]);
    onUpdateBiome(b => ({ ...b, interactiveDetails: updated }));
  };

  const handleDeleteProp = (index: number) => {
    const updated = propsList.filter((_, i) => i !== index);
    onUpdateBiome(b => ({ ...b, interactiveDetails: updated }));
  };

  const handleAddProp = (kind: PropKind) => {
    const newId = `prop_${Date.now().toString().slice(-6)}`;
    const newProp: InteractivePlacementDetail = {
      id: newId,
      name: kind === 'zone' ? 'Transition Gateway Zone' : 'Ancient Relic Shrine',
      propKind: kind,
      hasSprite: kind === 'item',
      type: kind === 'zone' ? 'zone' : 'switch',
      icon: kind === 'zone' ? '🟩' : '💎',
      color: kind === 'zone' ? '#06b6d4' : '#f59e0b',
      interactionPrompt: kind === 'zone' ? 'Step into Zone to Travel' : 'Press [E] to Inspect',
      interactionMethod: kind === 'zone' ? 'overlap' : 'interact',
      actionType: kind === 'zone' ? 'immediate_transport' : 'modify_resource',
      widthTiles: kind === 'zone' ? 3 : 1,
      heightTiles: kind === 'zone' ? 4 : 1,
      zoneType: 'transition_zone',
      immediateDestinationId: availableMaps[0]?.fileName || 'crystal_chasm.map',
      resourceType: 'health',
      resourceOp: 'set',
      resourceAmount: 100,
      feedbackMessage: 'Shrine Attuned & Vigor Restored'
    };

    onUpdateBiome(b => ({
      ...b,
      interactiveDetails: [...(b.interactiveDetails || []), newProp]
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) onLoaded(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Box size={16} className="text-amber-400" />
            Biome Props & Interactive Placements ({propsList.length})
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure props as <strong>Zones</strong> (trigger/fast-travel volumes) or <strong>Items</strong> (with/without sprites). Set interaction triggers (overlap, touch/collision, interact) and wired actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddProp('zone')}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/30"
          >
            <Plus size={14} />
            <span>+ Add Zone</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddProp('item')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-600/30"
          >
            <Plus size={14} />
            <span>+ Add Item Prop</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {propsList.length === 0 ? (
        <div className="text-center py-14 bg-neutral-900/40 rounded-2xl border border-neutral-800 text-neutral-500 text-xs space-y-3">
          <Box size={32} className="mx-auto text-neutral-600" />
          <p className="font-bold text-neutral-300">No Interactive Props or Zones Configured</p>
          <p className="max-w-md mx-auto text-neutral-500">
            Create trigger zones (room transitions, boundary warps, safe areas) or interactable item props (chests, monoliths, switches, shrines).
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleAddProp('zone')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg text-xs font-bold transition"
            >
              + Create Zone
            </button>
            <button
              type="button"
              onClick={() => handleAddProp('item')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
            >
              + Create Item Prop
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propsList.map((item, idx) => {
            const isZone = item.propKind === 'zone' || item.type === 'zone';
            const interaction = item.interactionMethod || (item.triggerType === 'on_overlap' ? 'overlap' : 'interact');
            const action = item.actionType || (item.transportBehavior === 'popup_menu' ? 'destination_menu' : item.transportBehavior === 'immediate_transport' ? 'immediate_transport' : 'none');

            return (
              <div 
                key={item.id || idx}
                className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3.5 shadow-lg relative group hover:border-neutral-700 transition"
              >
                {/* Prop Card Header */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="text"
                      value={item.icon || (isZone ? '🟩' : '📦')}
                      onChange={(e) => handleUpdateProp(idx, p => ({ ...p, icon: e.target.value }))}
                      className="w-8 h-8 text-xl bg-neutral-950 border border-neutral-800 rounded-lg text-center outline-none shrink-0"
                      title="Emoji Icon"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, name: e.target.value }))}
                        className="font-bold text-xs text-neutral-100 bg-transparent border-b border-dashed border-neutral-700 focus:border-amber-500 outline-none w-full truncate"
                        placeholder="Prop Name"
                      />
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          isZone ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        }`}>
                          {isZone ? 'Zone Area' : item.hasSprite ? 'Item (Sprite)' : 'Item (No Sprite)'}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          {item.widthTiles || 1}×{item.heightTiles || 1}T
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="color"
                      value={item.color || '#f59e0b'}
                      onChange={(e) => handleUpdateProp(idx, p => ({ ...p, color: e.target.value }))}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border border-neutral-700"
                      title="Tint Color"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteProp(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                      title="Delete Prop"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Classification: Zone vs Item */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Prop Kind</label>
                    <select
                      value={isZone ? 'zone' : 'item'}
                      onChange={(e) => {
                        const nextKind = e.target.value as PropKind;
                        handleUpdateProp(idx, p => ({
                          ...p,
                          propKind: nextKind,
                          type: nextKind === 'zone' ? 'zone' : (p.type === 'zone' ? 'switch' : p.type),
                          hasSprite: nextKind === 'item' ? (p.hasSprite ?? true) : false,
                          interactionMethod: nextKind === 'zone' ? 'overlap' : (p.interactionMethod || 'interact')
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-semibold"
                    >
                      <option value="zone">🟩 Zone (Area Volume)</option>
                      <option value="item">📦 Item / Object</option>
                    </select>
                  </div>

                  {isZone ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-cyan-400 uppercase">Zone Category</label>
                      <select
                        value={item.zoneType || 'transition_zone'}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, zoneType: e.target.value as any }))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-cyan-300"
                      >
                        <option value="transition_zone">🚪 Transition / Warp</option>
                        <option value="trigger_zone">⚡ Script Trigger Area</option>
                        <option value="safe_zone">🛡️ Safe / Checkpoint</option>
                        <option value="audio_zone">🎵 Ambient Audio Zone</option>
                        <option value="boundary_warp">🌀 Seamless Boundary</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-400 uppercase">Visual Sprite</label>
                      <select
                        value={item.hasSprite ? 'with_sprite' : 'no_sprite'}
                        onChange={(e) => {
                          const has = e.target.value === 'with_sprite';
                          handleUpdateProp(idx, p => ({ ...p, hasSprite: has }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-amber-300"
                      >
                        <option value="with_sprite">🖼️ With Sprite Graphics</option>
                        <option value="no_sprite">⚪ No Sprite (Invisible/Icon)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Optional Sprite Upload for Item Props */}
                {!isZone && item.hasSprite && (
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                        {item.spriteUrl ? (
                          <img src={item.spriteUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon size={14} className="text-neutral-500" />
                        )}
                      </div>
                      <div className="min-w-0 text-[10px]">
                        <div className="font-bold text-neutral-300 truncate">
                          {item.spriteUrl ? 'Custom Sprite Active' : 'Default Asset / Icon'}
                        </div>
                        <div className="text-neutral-500 truncate">PNG, JPG or SVG</div>
                      </div>
                    </div>

                    <label className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0">
                      <Upload size={11} />
                      <span>{item.spriteUrl ? 'Replace' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (url) => handleUpdateProp(idx, p => ({ ...p, spriteUrl: url })))}
                      />
                    </label>
                  </div>
                )}

                {/* Dimensions (Width x Height Tiles) */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase">Width (Tiles)</span>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={item.widthTiles ?? 1}
                      onChange={(e) => handleUpdateProp(idx, p => ({ ...p, widthTiles: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase">Height (Tiles)</span>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={item.heightTiles ?? 1}
                      onChange={(e) => handleUpdateProp(idx, p => ({ ...p, heightTiles: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* 1. HOW TO INTERACT (Trigger Method) */}
                <div className="space-y-1.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <label className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                    <Activity size={12} />
                    1. Interaction Method
                  </label>
                  <select
                    value={interaction}
                    onChange={(e) => handleUpdateProp(idx, p => ({ 
                      ...p, 
                      interactionMethod: e.target.value as PropInteractionMethod,
                      triggerType: e.target.value === 'overlap' ? 'on_overlap' : 'on_interact_prompt'
                    }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white font-semibold"
                  >
                    <option value="overlap">⚡ Overlap (Step inside zone / pass through)</option>
                    <option value="touch_collision">💥 Touch / Collision (Physical bump)</option>
                    <option value="interact">⌨️ Interact (Press Action Key [E / A])</option>
                  </select>

                  {interaction === 'interact' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={item.interactionPrompt || ''}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, interactionPrompt: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-200"
                        placeholder="Prompt text (e.g. Press [E] to Attune)"
                      />
                    </div>
                  )}
                </div>

                {/* 2. WHAT INTERACTION DOES (Action Type) */}
                <div className="space-y-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <Zap size={12} />
                    2. Interaction Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => handleUpdateProp(idx, p => ({
                      ...p,
                      actionType: e.target.value as PropActionType,
                      transportBehavior: e.target.value === 'immediate_transport' ? 'immediate_transport' : e.target.value === 'destination_menu' ? 'popup_menu' : 'none'
                    }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-semibold"
                  >
                    <option value="immediate_transport">🚀 Immediate Transport (Level Warp)</option>
                    <option value="destination_menu">📋 Destination Menu (Fast Travel)</option>
                    <option value="trigger_behavior">🧠 Trigger Global / Biome Behavior</option>
                    <option value="modify_resource">💎 Modify Resource / Biome Variable</option>
                    <option value="spawn_entity">👾 Spawn Entity / Prop / Fauna</option>
                    <option value="none">🔒 None / Visual & Lore Only</option>
                  </select>

                  {/* ACTION 1: IMMEDIATE TRANSPORT */}
                  {action === 'immediate_transport' && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Target Map (.map)</label>
                      <select
                        value={item.immediateDestinationId || ''}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, immediateDestinationId: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
                      >
                        <option value="">-- Select Destination Map --</option>
                        {availableMaps.map(m => (
                          <option key={m.fileName} value={m.fileName}>{m.fileName} ({m.name})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ACTION 2: DESTINATION MENU */}
                  {action === 'destination_menu' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={item.popupMenuTitle || ''}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, popupMenuTitle: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                        placeholder="Menu Title (e.g. Ancient Fast Travel Portal)"
                      />
                      <div className="space-y-1 max-h-24 overflow-y-auto bg-neutral-900 p-1.5 rounded border border-neutral-800">
                        {availableMaps.map(m => {
                          const isChecked = item.allowedDestinations?.includes(m.fileName) || false;
                          return (
                            <label key={m.fileName} className="flex items-center gap-1.5 text-[10px] text-neutral-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const prev = item.allowedDestinations || [];
                                  const next = e.target.checked ? [...prev, m.fileName] : prev.filter(f => f !== m.fileName);
                                  handleUpdateProp(idx, p => ({ ...p, allowedDestinations: next }));
                                }}
                                className="rounded accent-cyan-500"
                              />
                              <span className="font-mono">{m.fileName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ACTION 3: TRIGGER BEHAVIOR */}
                  {action === 'trigger_behavior' && (
                    <div className="space-y-2 pt-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Target Biome Behavior</label>
                      <select
                        value={item.targetBehaviorId || ''}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, targetBehaviorId: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-semibold"
                      >
                        <option value="">-- Select Biome Behavior Rule --</option>
                        {(biome.behaviorRules || []).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.scope === 'global_interbiome' ? '🌐 ' : '📍 '}{r.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.behaviorPayload || ''}
                        onChange={(e) => handleUpdateProp(idx, p => ({ ...p, behaviorPayload: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-300"
                        placeholder="Optional payload parameter"
                      />
                    </div>
                  )}

                  {/* ACTION 4: MODIFY RESOURCE */}
                  {action === 'modify_resource' && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={item.resourceType || 'health'}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, resourceType: e.target.value as any }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-[11px] text-white"
                        >
                          <option value="health">❤️ Health</option>
                          <option value="mana">💧 Mana</option>
                          <option value="stamina">⚡ Stamina</option>
                          <option value="gold">🪙 Gold</option>
                          <option value="ammo">🏹 Ammo</option>
                          <option value="key">🔑 Key</option>
                          <option value="biome_variable">🔢 Biome Variable</option>
                        </select>
                        <select
                          value={item.resourceOp || 'add'}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, resourceOp: e.target.value as any }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-[11px] text-white"
                        >
                          <option value="add">+ Add</option>
                          <option value="subtract">- Subtract</option>
                          <option value="set">= Set To</option>
                          <option value="toggle">🔄 Toggle</option>
                        </select>
                      </div>

                      {item.resourceType === 'biome_variable' && (
                        <select
                          value={item.targetVariableId || ''}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, targetVariableId: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                        >
                          <option value="">-- Select Biome Variable --</option>
                          {(biome.variables || []).map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.resourceAmount ?? 50}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, resourceAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                          placeholder="Amount"
                        />
                        <input
                          type="text"
                          value={item.feedbackMessage || ''}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, feedbackMessage: e.target.value }))}
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-300"
                          placeholder="HUD Toast message"
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION 5: SPAWN ENTITY */}
                  {action === 'spawn_entity' && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={item.spawnCategory || 'wildlife'}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, spawnCategory: e.target.value as any }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-[11px] text-white"
                        >
                          <option value="wildlife">🦋 Wildlife Fauna</option>
                          <option value="enemy">👾 Enemy Hostile</option>
                          <option value="npc">🗣️ Friendly NPC</option>
                          <option value="item_drop">🎁 Item Drop</option>
                          <option value="prop">📦 Puzzle Prop</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={item.spawnCount ?? 1}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, spawnCount: parseInt(e.target.value) || 1 }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                          placeholder="Count"
                        />
                      </div>

                      {item.spawnCategory === 'wildlife' ? (
                        <select
                          value={item.spawnEntityId || ''}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, spawnEntityId: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200"
                        >
                          <option value="">-- Select Biome Wildlife --</option>
                          {(biome.wildlife || []).map(w => (
                            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={item.spawnEntityId || ''}
                          onChange={(e) => handleUpdateProp(idx, p => ({ ...p, spawnEntityId: e.target.value }))}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                          placeholder="Entity identifier (e.g. cinder_stalker)"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
