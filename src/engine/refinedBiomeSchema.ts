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
 * Parallax Architecture (Dynamic Layers, negative for background, 0 for main gameplay, positive for foreground)
 * Sidescroller 2D Metroidvania Depth Layers
 */
export type ParallaxLayerIndex = number;

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

  // Traversal, Physics Colliders & Modifiers
  generatesCollider?: boolean; // Defaults to true when undefined. Uncheck for open air, invisible trigger surfaces, background pass-through tiles, etc.
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

export type PropKind = 'zone' | 'item';
export type PropInteractionMethod = 'overlap' | 'touch_collision' | 'interact';
export type PropActionType = 'immediate_transport' | 'destination_menu' | 'trigger_behavior' | 'modify_resource' | 'spawn_entity' | 'none';

export type PropInteractionTrigger = 'on_overlap' | 'on_interact_prompt' | 'on_interact_no_prompt';
export type PropTransportBehavior = 'none' | 'popup_menu' | 'immediate_transport';

/**
 * Manually Placeable Interactive Detail (Zones or Items, with/without sprites)
 * Supports Overlap, Touch/Collision, and Interact triggers with rich actions
 */
export interface InteractivePlacementDetail {
  id: string;
  name: string;
  propKind?: PropKind; // 'zone' (trigger area) or 'item' (placed object)
  hasSprite?: boolean; // For items: whether an explicit sprite image is used or algorithmic icon
  spriteUrl?: string;
  type?: 'enemy' | 'door_gate' | 'chest' | 'binding_stone' | 'hazard_emitter' | 'npc' | 'switch' | 'zone' | string;
  icon: string;
  color: string;
  interactionPrompt: string; // e.g. "Open Chest", "Attune Binding Stone", "Press [E] to Inspect"
  interactionMethod?: PropInteractionMethod; // 'overlap' | 'touch_collision' | 'interact'
  actionType?: PropActionType; // 'immediate_transport' | 'destination_menu' | 'trigger_behavior' | 'modify_resource' | 'spawn_entity' | 'none'
  
  // Dimensions for zone or large item
  widthTiles?: number; // 1 to 32
  heightTiles?: number; // 1 to 32
  zoneType?: 'transition_zone' | 'trigger_zone' | 'boundary_warp' | 'safe_zone' | 'audio_zone';
  
  // Action Payload: Transport
  immediateDestinationId?: string; // Target .map fileName
  targetSpawnId?: string; // Optional arrival spawn identifier
  popupMenuTitle?: string; // Title for popup destination menu
  allowedDestinations?: string[]; // Array of linked map fileNames
  
  // Action Payload: Behavior Trigger
  targetBehaviorId?: string; // ID of Biome Behavior rule
  behaviorPayload?: string; // Optional payload / custom event string
  
  // Action Payload: Resource Modification
  resourceType?: 'health' | 'mana' | 'stamina' | 'gold' | 'ammo' | 'key' | 'biome_variable';
  targetVariableId?: string; // If resourceType === 'biome_variable'
  resourceOp?: 'add' | 'subtract' | 'set' | 'toggle';
  resourceAmount?: number;
  feedbackMessage?: string; // e.g. "+50 Gold", "Ancient Shrine Attuned"
  
  // Action Payload: Entity / Fauna / Item Drop Spawning
  spawnCategory?: 'wildlife' | 'enemy' | 'npc' | 'prop' | 'item_drop';
  spawnEntityId?: string; // Creature / wildlife ID or entity name
  spawnCount?: number;
  
  // Legacy / Additional fields
  health?: number;
  properties?: Record<string, any>;
  triggerType?: PropInteractionTrigger;
  transportBehavior?: PropTransportBehavior;
}

/**
 * Biome Variable Specification
 * Custom variables and attributes scoped locally or globally across biomes & maps
 */
export interface BiomeVariable {
  id: string; // e.g. bvar_xxxxxxxx
  name: string;
  category: 'environment' | 'progression' | 'hazard' | 'weather' | 'custom' | string;
  type: 'number' | 'string' | 'boolean' | 'enum';
  scope: 'local_biome' | 'global_interbiome'; // interbiome persists across all maps
  options?: string[]; // Used if type is enum
  defaultValue: any;
  currentValue?: any;
  minValue?: number;
  maxValue?: number;
  description?: string;
}

/**
 * Biome State Node Specification
 */
export interface BiomeStateNode {
  id: string;
  name: string;
  description?: string;
  color: string;
  ambientColor?: string;
  fogDensity?: number; // 0.0 to 1.0
  hazardLevel?: 'none' | 'mild' | 'severe' | 'fatal';
  weatherType?: 'clear' | 'ash_storm' | 'rain' | 'fog' | 'blizzard' | 'spore_drift' | 'acid_rain' | 'solar_flare';
  wildlifeSpawnMultiplier?: number;
  musicTrackOverride?: string;
  isDefault?: boolean;
  x?: number;
  y?: number;
}

/**
 * Biome State Transition Specification
 */
export interface BiomeStateTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  triggerLabel?: string;
  conditionVariableId?: string;
  conditionComparator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  conditionValue?: any;
}

/**
 * Biome State Machine Specification
 */
export interface BiomeStateMachine {
  states: BiomeStateNode[];
  transitions: BiomeStateTransition[];
  defaultStateId: string;
}

/**
 * Biome Behavior Triggers
 */
export type BiomeTriggerType = 
  | 'on_variable_value'
  | 'on_map_load'
  | 'on_biome_state'
  | 'on_prop_interact'
  | 'on_time_tick'
  | 'on_enter_biome'
  | 'manual_trigger';

export interface BiomeBehaviorTrigger {
  type: BiomeTriggerType;
  variableId?: string;
  comparator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  targetValue?: any;
  mapFileName?: string; // '.map' file name, or 'any_map'
  biomeStateId?: string;
  propId?: string;
  intervalSeconds?: number;
  customEventName?: string;
}

/**
 * Biome Behavior Actions
 */
export type BiomeActionType =
  | 'set_variable'
  | 'change_biome_state'
  | 'change_map'
  | 'spawn_entity'
  | 'environmental_effect'
  | 'audio_cue'
  | 'unlock_progression_flag'
  | 'broadcast_interbiome_signal';

export interface BiomeBehaviorAction {
  id: string;
  actionType: BiomeActionType;
  // set_variable
  variableId?: string;
  variableOp?: 'set' | 'add' | 'subtract' | 'toggle';
  variableValue?: any;
  // change_biome_state
  targetStateId?: string;
  // change_map
  targetMapFileName?: string;
  targetSpawnPoint?: string;
  // spawn_entity
  spawnCategory?: 'wildlife' | 'enemy' | 'npc' | 'item';
  spawnEntityId?: string;
  spawnCount?: number;
  // environmental_effect
  effectType?: 'screen_shake' | 'weather_change' | 'fog_surge' | 'lightning_flash' | 'corrupt_pulse';
  intensity?: number;
  durationMs?: number;
  // audio_cue
  soundTrackName?: string;
  volume?: number;
  // unlock_progression_flag
  flagId?: string;
  // broadcast_interbiome_signal
  signalName?: string;
  signalPayload?: string;
}

export interface BiomeBehaviorRule {
  id: string;
  name: string;
  enabled: boolean;
  scope: 'local_biome' | 'global_interbiome'; // interbiome rule
  description?: string;
  trigger: BiomeBehaviorTrigger;
  actions: BiomeBehaviorAction[];
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

  // Interactive Placeable Details (enemies, items, doors, binding stones, zones)
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

  // Biome Variables (Local & Interbiome Global)
  variables?: BiomeVariable[];

  // Biome State Machine (States & Transitions)
  stateMachine?: BiomeStateMachine;

  // Biome Behaviors (IFTTT Rules & Global Actions)
  behaviorRules?: BiomeBehaviorRule[];
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
