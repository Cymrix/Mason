import { TileType, DamageType, DamageInstance } from './schema';

/**
 * Standard registry of TileType resources
 * Reference-not-duplicate model: Editing a single entry updates all cells referencing it.
 */
export const STANDARD_TILE_TYPES: Record<string, TileType> = {
  stone: {
    id: 'stone',
    name: 'Bedrock Granite',
    category: 'natural',
    height_map_scale: 0.75,
    base_color: '#334155',
    surface_overlay_top: '#475569',
    surface_overlay_side: '#1e293b',
    surface_overlay_bottom: '#0f172a',
    softness: 0.35,
    blend_style: 'fade',
    fade_amount: 0.4,
    health: 120,
    defense_type: 'kinetic',
    armor_deduction: 8,
    damage_affinities: {
      kinetic: 1.0,
      thermal: 1.2,
      cryo: 0.5,
      void: 1.4
    },
    shares_damage_overlay: true,
    traversal_tags: [],
    speed_modifier: 1.0
  },
  dirt: {
    id: 'dirt',
    name: 'Ash Loam',
    category: 'natural',
    height_map_scale: 0.4,
    base_color: '#451a03',
    surface_overlay_top: '#78350f',
    surface_overlay_side: '#291e13',
    softness: 0.8,
    blend_style: 'fade',
    fade_amount: 0.6,
    health: 40,
    defense_type: 'toxic',
    armor_deduction: 1,
    damage_affinities: {
      thermal: 1.8,
      kinetic: 1.2
    },
    shares_damage_overlay: true,
    traversal_tags: [],
    speed_modifier: 0.95
  },
  brick: {
    id: 'brick',
    name: 'Empire Ashlar Brick',
    category: 'structure',
    height_map_scale: 0.85,
    base_color: '#3f3f46',
    surface_overlay_top: '#52525b',
    surface_overlay_side: '#27272a',
    softness: 0.15,
    blend_style: 'line',
    fade_amount: 0.2,
    health: 160,
    defense_type: 'kinetic',
    armor_deduction: 12,
    damage_affinities: {
      kinetic: 0.8,
      void: 1.5
    },
    shares_damage_overlay: false,
    traversal_tags: ['climbable'],
    speed_modifier: 1.0
  },
  sand: {
    id: 'sand',
    name: 'Vitric Dune Sand',
    category: 'natural',
    height_map_scale: 0.25,
    base_color: '#713f12',
    surface_overlay_top: '#a16207',
    softness: 0.9,
    blend_style: 'dither',
    fade_amount: 0.7,
    health: 25,
    defense_type: 'thermal',
    armor_deduction: 0,
    damage_affinities: {
      cryo: 0.8,
      thermal: 0.5
    },
    shares_damage_overlay: true,
    traversal_tags: ['slippery'],
    speed_modifier: 0.8
  },
  obsidian: {
    id: 'obsidian',
    name: 'Caldera Obsidian',
    category: 'natural',
    height_map_scale: 0.95,
    base_color: '#09090b',
    surface_overlay_top: '#27272a',
    softness: 0.1,
    blend_style: 'line',
    fade_amount: 0.15,
    health: 250,
    defense_type: 'thermal',
    armor_deduction: 20,
    damage_affinities: {
      thermal: 0.1,
      cryo: 2.5,
      kinetic: 1.3
    },
    shares_damage_overlay: false,
    traversal_tags: [],
    speed_modifier: 1.0
  },
  ice: {
    id: 'ice',
    name: 'Cryo Glacial Shelf',
    category: 'hazard',
    height_map_scale: 0.5,
    base_color: '#0369a1',
    surface_overlay_top: '#38bdf8',
    softness: 0.6,
    blend_style: 'fade',
    fade_amount: 0.5,
    health: 60,
    defense_type: 'cryo',
    armor_deduction: 3,
    damage_affinities: {
      thermal: 3.0,
      kinetic: 1.5,
      cryo: 0.1
    },
    shares_damage_overlay: true,
    traversal_tags: ['slippery'],
    speed_modifier: 1.35
  }
};

/**
 * Shared DamageResolver Pipeline:
 * attack_damage → RPS multiplier → armor deduction → final value
 * Flat subtraction so sufficiently high armor can fully negate a weak attack.
 */
export function resolveTileDamage(
  incomingDamage: DamageInstance,
  targetTileType: TileType
): { effectiveDamage: number; isAbsorbed: boolean; oldThreshold: number; newThreshold: number } {
  // 1. RPS Multiplier
  const rpsMult = targetTileType.damage_affinities[incomingDamage.type] ?? 1.0;
  const scaledDamage = incomingDamage.amount * rpsMult;

  // 2. Armor Deduction (Flat subtraction)
  const afterArmor = Math.max(0, Math.floor(scaledDamage - targetTileType.armor_deduction));

  return {
    effectiveDamage: afterArmor,
    isAbsorbed: afterArmor <= 0,
    oldThreshold: 0,
    newThreshold: 0
  };
}

/**
 * Maps remaining HP percentage to damage threshold mask index (0 to 3)
 * Contiguous threshold masking across cells sharing damage overlay.
 */
export function computeDamageThresholdIndex(currentHealth: number, maxHealth: number): number {
  if (maxHealth <= 0) return 0;
  const ratio = currentHealth / maxHealth;
  if (ratio <= 0) return 3; // Critical / Destroyed
  if (ratio < 0.35) return 2; // Heavy Cracking
  if (ratio < 0.75) return 1; // Minor Stress
  return 0; // Pristine
}
