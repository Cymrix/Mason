export type DamageType = 'kinetic' | 'thermal' | 'cryo' | 'galvanic' | 'toxic' | 'radiant' | 'void' | 'psionic';
export type ConditionType = 'vulnerable' | 'stunned' | 'burning' | 'frozen' | 'shocked';
export type BlendStyle = 'fade' | 'line' | 'dither';
export type TraversalModifierTag = 'climbable' | 'sticky' | 'bouncy' | 'slippery' | 'hazard';

export interface DamageInstance {
  amount: number;
  type: DamageType;
  isIndefensible?: boolean;
  isUninterruptible?: boolean;
}

export interface Effect {
  id: string;
  condition: ConditionType;
  durationMs: number;
  value?: number;
}

/**
 * TileType - One resource definition per material (e.g. stone, dirt, sand, brick, obsidian)
 * Reference-not-duplicate: Rebalancing stone edits this resource, not individual cells.
 */
export interface TileType {
  id: string;
  name: string;
  category: 'natural' | 'structure' | 'hazard' | 'synthetic';
  
  // Height map and visual blending shader configuration
  height_map_scale: number; // 0.0 to 1.0 (shared with shadow shader)
  base_color: string;
  surface_overlay_top?: string;
  surface_overlay_side?: string;
  surface_overlay_bottom?: string;
  
  softness: number; // Controls how far a neighbor bleeds into this tile (larger = softer/more permissive)
  blend_style: BlendStyle; // 'fade' | 'line' | 'dither'
  fade_amount: number; // 0.0 to 1.0 (softens any style toward wide Fade curve)

  // Damage & Destruction (shared DamageResolver pipeline)
  health: number; // Base destructible health pool
  defense_type: DamageType;
  armor_deduction: number; // Flat subtraction: attack_damage -> RPS mult -> armor_deduction -> final value
  damage_affinities: Partial<Record<DamageType, number>>; // 8-point modality RPS dominance
  shares_damage_overlay: boolean; // True: crack/burn threshold masks bleed contiguously across neighbors; False: cell-local
  
  // Traversal & Modifiers
  traversal_tags: TraversalModifierTag[];
  speed_modifier: number; // 1.0 = normal, 0.5 = swamp/sludge, 1.3 = ice slide
  hazard_damage?: DamageInstance; // Contact hazard damage through shared resolver
}

/**
 * MapCellData - What an actual map cell stores at runtime.
 * References TileType by id, plus per-instance mutable state.
 */
export interface MapCellData {
  tile_type_id: string; // Reference to TileType (never duplicate fields)
  current_health: number; // Instance mutable health
  damage_threshold_index: number; // 0 = pristine, 1 = slight, 2 = cracked, 3 = critical/shattered (from universal threshold mask)
  persists_across_reset: boolean; // For dungeon/puzzle permanence
  foreground_entity_id?: string | null; // ID of foreground object sitting on this host tile
}

/**
 * Placement markers for enemies, chests, doors, binding stones, spawn points
 */
export interface PlacementMarker {
  id: string;
  type: 'spawn_point' | 'enemy' | 'binding_stone' | 'door_gate' | 'chest' | 'hazard_emitter';
  x: number;
  y: number;
  properties?: Record<string, any>;
}

/**
 * MapLevelData - The full exported level package
 */
export interface MapLevelData {
  id: string;
  name: string;
  biome_id: string;
  width: number;
  height: number;
  generation_seed: number; // Kept even for hand-authored maps so regeneration stays reproducible
  cells: MapCellData[]; // Flat cell array of size width * height
  foreground_cells: (string | null)[]; // Flat array of foreground objects/windows/scatter
  placement_markers: PlacementMarker[];
}

export interface FociVariant {
  id: string;
  name: string;
  description: string;
  damageModifiers?: Record<DamageType, number>;
  effects?: Effect[];
}

export interface Foci {
  id: string;
  name: string;
  type: 'action' | 'ability' | 'armor' | 'defensive';
  baseDamage?: DamageInstance[];
  passiveDefense?: number;
  variants: [FociVariant, ...FociVariant[]]; // Base + up to 8 deviations
}

export type ArchetypeTraversalTag = 'double_jump' | 'wall_climb' | 'dash' | 'glide';

export interface Archetype {
  id: string;
  name: string;
  backstory: string;
  traversalTags: ArchetypeTraversalTag[];
  foci: {
    action: [string, string, string];
    ability: [string, string, string, string];
    armor: string;
    defensive: string;
  };
  baseStats: {
    health: number;
    energy: number;
  };
}

export interface CombatEntity {
  id: string;
  archetypeId: string | null;
  health: number;
  maxHealth: number;
  armor: number;
  conditions: Effect[];
  state: {
    movement: 'idle' | 'moving' | 'airborne';
    action: 'none' | 'attacking' | 'recovering' | 'stunned';
    stance: 'normal' | 'blocking' | 'dodging';
  };
}
