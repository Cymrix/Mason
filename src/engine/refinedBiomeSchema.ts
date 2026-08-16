import { TileShape } from './tileShape';
export * from './tileShape';

export type DamageType = 'kinetic' | 'thermal' | 'cryo' | 'galvanic' | 'toxic' | 'radiant' | 'void' | 'psionic';
export type ConditionType = 'vulnerable' | 'stunned' | 'burning' | 'frozen' | 'shocked';
export type BlendStyle = 'fade' | 'line' | 'dither';
export type TraversalModifierTag = 'climbable' | 'sticky' | 'bouncy' | 'slippery' | 'hazard' | 'sinkable';

export const TILE_SIZE = 16; // 16px square micro-tiles (128px player = 8 tiles tall)

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
 * Parallax Architecture (7 Layers from -5 to +1)
 * Sidescroller 2D Metroidvania Depth Layers
 */
export type ParallaxLayerIndex = -5 | -4 | -3 | -2 | -1 | 0 | 1;

export type ParallaxProceduralTheme = 
  | 'celestial_sky' 
  | 'distant_mountain_range' 
  | 'ruined_megastructures' 
  | 'cavern_pillars' 
  | 'interior_masonry_backwall' 
  | 'foreground_overgrowth' 
  | 'custom_image';

export interface ParallaxLayerConfig {
  layerIndex: ParallaxLayerIndex;
  name: string;
  speedFactorX: number; // e.g. -5: 0.04, -4: 0.12, -3: 0.28, -2: 0.5, -1: 0.78, 0: 1.0, 1: 1.35
  speedFactorY: number; // Vertical scroll parallax factor
  opacity: number; // 0.0 to 1.0
  tintColor: string;
  gradientTop?: string;
  gradientBottom?: string;
  textureUrl?: string; // Uploaded custom PNG/SVG
  proceduralTheme: ParallaxProceduralTheme;
  repeatX: boolean;
  repeatY: boolean;
  offsetY: number; // Vertical shift in px
  scale: number;
  blurPx?: number;
}

/**
 * Noise Configuration for dual-overlapping noise blend map
 */
export interface NoiseLayerConfig {
  scale: number; // Texel size / wavelength in world pixels (e.g. 4 to 512)
  octaves: number; // 1 to 4
  persistence: number; // 0.1 to 1.0
  lacunarity: number; // 1.5 to 3.0
  offset: { x: number; y: number };
  weight: number; // 0.0 to 1.0
  seed?: number; // Integer seed for reproducible noise generation
}

export interface DualNoiseBlendMapConfig {
  noiseA: NoiseLayerConfig;
  noiseB: NoiseLayerConfig;
  blendThreshold: number; // 0.0 to 1.0
  blendContrast: number; // 0.1 to 3.0
  invert: boolean;
}

/**
 * Material Map Texture Spec (Albedo, Heightmap, Roughness Map)
 */
export interface PBRMaterialSpec {
  albedoColor?: string; // Optional fallback color
  albedoTextureUrl?: string; // Uploaded custom image (PNG/JPG/WebP/DataURL)
  heightMapScale: number; // 0.0 to 1.0 (shared between base A and B)
  roughness: number; // 0.0 (smooth/glossy) to 1.0 (matte/rough, shared between A and B)
  normalStrength?: number; // 0.0 to 2.0
}

/**
 * Auto-Tiling Edge Overlays (top, left side, right side, bottom)
 * Used to construct the composite autotileset without requiring fixed color codes
 */
export interface AutoTileDetails {
  top: {
    
    color?: string; // Optional fallback color
    overlayTextureUrl?: string; // Uploaded custom top trim image (DataURL or URL)
    thicknessPx: number; // e.g., 4px - 16px
    texturePattern?: string; // grass tufts, snow crust, crystal ridge
    noiseEdge: boolean;
  };
  bottom: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx: number;
    texturePattern?: string;
    noiseEdge: boolean;
  };
  leftSide: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx: number;
    texturePattern?: string;
    noiseEdge: boolean;
  };
  rightSide: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx: number;
    texturePattern?: string;
    noiseEdge: boolean;
  };
  innerCorner: {
    
    color?: string;
    overlayTextureUrl?: string;
  };
  slopeInnerCorner?: {
    
    color?: string;
    overlayTextureUrl?: string;
  };
  slope?: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx: number;
    texturePattern?: string;
    noiseEdge: boolean;
  };
  slopeTop?: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx?: number;
    texturePattern?: string;
    noiseEdge?: boolean;
  };
  slopeBottom?: {
    
    color?: string;
    overlayTextureUrl?: string;
    thicknessPx?: number;
    texturePattern?: string;
    noiseEdge?: boolean;
  };
}

/**
 * Refined TileType
 * Contains mapColor (for procedural map & painting palette),
 * 2 base materials (same heightmap/roughness, different albedos A & B),
 * uploadable heightmap and roughness map,
 * a dual-noise blend map to break up repeating patterns,
 * top/bottom/left/right autotiling details, tags, and destructibility.
 */
export interface BiomeTileType {
  id: string;
  name: string;
  category: 'natural' | 'structure' | 'hazard' | 'synthetic';
  
  // Associated color for larger procedural map, minimap & painting selection
  mapColor: string;

  // Base Materials A and B
  baseMaterialA: PBRMaterialSpec;
  baseMaterialBAlbedoColor?: string; // Differing albedo variant color fallback
  baseMaterialBTextureUrl?: string; // Uploaded custom Base Material B image

  // Shared Heightmap and Roughness map texture uploads
  heightMapTextureUrl?: string; // Uploaded custom grayscale heightmap
  roughnessMapTextureUrl?: string; // Uploaded custom roughness map

  // Dual Overlapping Noise Blend Map
  blendMap: DualNoiseBlendMapConfig;

  // Auto-Tiling Composite Details (Top, Bottom, Left, Right Overlays)
  tileDetails: AutoTileDetails;

  // Destructibility & Combat
  isDestructible: boolean;
  health: number; // Base destructible health
  defense_type: DamageType;
  armor_deduction: number; // Flat subtraction
  damage_affinities: Partial<Record<DamageType, number>>;
  shares_damage_overlay: boolean;

  // Traversal & Modifiers
  traversal_tags: TraversalModifierTag[];
  speed_modifier: number; // 1.0 = normal
  hazard_damage?: DamageInstance;

  // Soft Material & Slopes (e.g. Sand, Silt, Snow, Soft Dirt)
  materialType: 'hard' | 'soft' | 'water'; // When true, material defaults to soft 45° angular corners / natural dunes
  softness?: number; // 0.0 (rigid stone/brick) to 1.0 (loose powdery sand)
  bevelProbability: number; // Whether slopes/ramps are enabled for this tile type
  defaultSlopeShape?: TileShape;
}

/**
 * Environmental Non-Tile Detail (Trees, bushes, rocks, crystals)
 * Not intended for player interaction beyond possible destruction
 */
export interface EnvironmentalDetail {
  id: string;
  name: string;
  category: 'tree' | 'bush' | 'rock' | 'spore' | 'relic' | 'crystal';
  icon: string;
  color: string;
  widthTiles: number; // 1, 2, 3
  heightTiles: number; // 1, 2, 3
  spawnFrequency: number; // 0.0 to 1.0
  isDestructible: boolean;
  health: number;
  armor: number;
  modalityWeakness?: DamageType;
}

/**
 * Manually Placeable Interactive Detail (Enemies, doors, gates, items, chests, binding stones)
 * Intended for direct gameplay/player interaction
 */
export interface InteractivePlacementDetail {
  id: string;
  name: string;
  type: 'enemy' | 'door_gate' | 'chest' | 'binding_stone' | 'hazard_emitter' | 'npc' | 'switch';
  icon: string;
  color: string;
  interactionPrompt: string; // e.g. "Open Chest", "Attune Binding Stone", "Unlock Gate"
  health?: number;
  properties?: Record<string, any>;
}

/**
 * Biome Wildlife Spec
 * Ambient / roaming creatures with spawn frequencies and interactable/destructible flags
 */
export interface BiomeWildlife {
  id: string;
  name: string;
  icon: string;
  color: string;
  spawnFrequency: number; // 0.0 to 1.0 (how often they show up)
  isInteractable: boolean; // can pet/talk/collect
  interactionAction?: string; // "Harvest Spores", "Pet", "Catch"
  isDestructible: boolean; // can take damage/flee/die
  health: number;
  behavior: 'passive_wander' | 'flees_player' | 'ambient_flying' | 'burrowing';
}

/**
 * Biome Soundtrack & Audio Cue Specs
 */
export interface BiomeSoundtrack {
  ambientExplorationTrack: string;
  combatTrack: string;
  bossEngagementTrack?: string;
  hazardAtmosphereTrack?: string;
  reverbDecaySeconds: number; // e.g., 1.5s in caves, 0.4s outdoors
  windIntensity: number; // 0.0 to 1.0
}

/**
 * Complete Refined Biome Definition
 */
export interface RefinedBiome {
  id: string;
  name: string;
  description: string;
  regionColor: string; // Identification tint in map view
  
  // Background & Atmosphere
  ambientBackgroundColor?: string;
  atmosphereFogColor?: string;
  atmosphereFogDensity?: number; // 0.0 to 1.0

  // 7-Layer Parallax Configuration (-5 to +1)
  parallaxLayers: ParallaxLayerConfig[];

  // Multiple Tile Types per Biome
  tileTypes: BiomeTileType[];
  primaryTileTypeId: string;

  // Environmental Non-Tile Details (trees, rocks, bushes, etc.)
  environmentalDetails: EnvironmentalDetail[];

  // Interactive Placeable Details (enemies, items, doors, binding stones)
  interactiveDetails: InteractivePlacementDetail[];

  // Wildlife Details
  wildlife: BiomeWildlife[];

  // Soundtrack & Audio Ambience
  soundtrack: BiomeSoundtrack;

  // Macro Noise Placement Rules
  noiseRules: {
    macroScale: number;
    elevationRange: [number, number]; // 0.0 to 1.0
    moistureRange: [number, number]; // 0.0 to 1.0
  };
}

/**
 * Map Cell & Level Data Structure
 */
export interface RefinedMapCell {
  biome_id: string; // References RefinedBiome ID
  tile_type_id: string; // References BiomeTileType ID, or empty string '' for Open Air / Blank Space
  current_health: number;
  damage_threshold_index: number;
  environmental_detail_id?: string | null;
  interactive_detail_id?: string | null;
  wildlife_id?: string | null;
}

export interface RefinedMapLevel {
  id: string;
  name: string;
  biome_id: string;
  width: number;
  height: number;
  tileSizePx: number; // 64
  seed: number;
  cells: RefinedMapCell[];
}
