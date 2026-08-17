import { RefinedMapData, RefinedCellState } from '../types';
import { RefinedBiome } from './refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from './refinedBiomes';
import { MASON_VERSION_DISPLAY } from '../version';

// ==========================================
// 1. MAP FILE (.map)
// ==========================================
export interface MapExit {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMapFileName: string; // e.g. "crystal_chasm.map"
  targetExitId: string; // Exit id on destination map
  transitionType: 'seamless' | 'door_fade' | 'elevator' | 'teleport';
  requiredProgressionFlag?: string; // e.g. "has_double_jump" or "boss_key_caldera"
  direction: 'left' | 'right' | 'up' | 'down';
}

export interface PlayerSpawnPoint {
  x: number;
  y: number;
  facing: 'left' | 'right';
  spawnId: string;
  isDefault: boolean;
}

export interface MapFile {
  id: string;
  name: string;
  fileName: string; // e.g. "ashen_outpost.map"
  description: string;
  createdAt: string;
  updatedAt: string;
  width: number;
  height: number;
  defaultBiomeId: string;
  musicTrackOverride?: string;
  ambientLightOverride?: string;
  playerSpawns: PlayerSpawnPoint[];
  exits: MapExit[];
  cells?: RefinedCellState[][];
  chunks?: Record<string, RefinedCellState[]>;
  data?: any;
}

// ==========================================
// 2. BIOME FILE (.biome)
// ==========================================
export interface BiomeFile {
  id: string;
  name: string;
  fileName: string; // e.g. "mourne_ashen_steppes.biome"
  createdAt: string;
  updatedAt: string;
  biomeData: RefinedBiome;
}

// ==========================================
// 3. ARCHETYPE FILE (.arch)
// ==========================================
export interface TraversalAbility {
  id: string;
  name: string;
  tag: string;
  staminaCost: number;
  description: string;
  icon: string;
}

export interface ArchetypeData {
  id: string;
  name: string;
  title: string;
  backstory: string;
  avatarIcon: string;
  themeColor: string;
  baseStats: {
    health: number;
    energy: number;
    stamina: number;
    poise: number;
    moveSpeed: number;
    jumpForce: number;
  };
  traversalTags: string[]; // ['double_jump', 'wall_cling', 'air_dash']
  foci: {
    action: string[]; // Primary attacks
    ability: string[]; // Spells / skills
    armor: string;
    defensive: string;
  };
  weaponProficiencies: string[];
  damageAffinity: 'slashing' | 'blunt' | 'piercing' | 'fire' | 'frost' | 'lightning' | 'void' | 'kinetic';
  passivePerks: { id: string; name: string; desc: string }[];
  assignedBehaviorFileName?: string;
  behaviorDataOverride?: BehaviorData;
}

export interface ArchetypeFile {
  id: string;
  name: string;
  fileName: string; // e.g. "korrath_steelhand.arch"
  createdAt: string;
  updatedAt: string;
  archetypeData: ArchetypeData;
}

// ==========================================
// 3.5 BEHAVIORS, SENSORY TAGS & IFTTT RULES ENGINE (.behavior)
// ==========================================
export type SensoryTagID = 'head_eyes' | 'head_ears' | 'torso_center' | 'feet_ground' | 'hand_weapon' | 'back_weakspot' | string;

export interface SensoryTagConfig {
  tagId: SensoryTagID;
  label: string;
  offsetX: number; // px relative to center
  offsetY: number; // px relative to center
}

export type TriggerType = 'sight' | 'sound' | 'proximity' | 'health' | 'timer' | 'state' | 'collision' | 'input_press' | 'player_condition';

export interface SightTrigger {
  type: 'sight';
  sensoryTag: SensoryTagID; // e.g. 'head_eyes'
  visionRadiusPx: number; // e.g. 240
  visionAngleDeg: number; // e.g. 120
  requireLineOfSight: boolean;
  targetFilter: 'player' | 'enemy' | 'npc' | 'any';
}

export interface SoundTrigger {
  type: 'sound';
  sensoryTag: SensoryTagID; // e.g. 'head_ears'
  hearingRadiusPx: number; // e.g. 300
  minNoiseLevel: number; // 0 to 100
}

export interface ProximityTrigger {
  type: 'proximity';
  sensoryTag: SensoryTagID;
  distancePx: number;
  comparator: 'less_than' | 'greater_than';
}

export interface HealthTrigger {
  type: 'health';
  healthPercentThreshold: number; // 0-100
  comparator: 'less_than' | 'greater_than';
}

export interface TimerTrigger {
  type: 'timer';
  intervalMs: number;
  randomJitterMs: number;
}

export interface StateTrigger {
  type: 'state';
  requiredState: string; // e.g. 'patrol', 'alerted', 'chase'
}

export interface CollisionTrigger {
  type: 'collision';
  contactType: 'cliff_edge' | 'wall_impact' | 'ground_contact';
}

export interface InputPressTrigger {
  type: 'input_press';
  button: 'jump' | 'dash' | 'attack_primary' | 'attack_heavy' | 'interact' | 'skill_1' | 'skill_2' | 'block';
}

export interface PlayerConditionTrigger {
  type: 'player_condition';
  condition: 'is_grounded' | 'is_airborne' | 'is_wall_sliding' | 'low_stamina' | 'low_health' | 'staggered';
}

export type BehaviorTrigger = SightTrigger | SoundTrigger | ProximityTrigger | HealthTrigger | TimerTrigger | StateTrigger | CollisionTrigger | InputPressTrigger | PlayerConditionTrigger;

export type ActionType = 'move' | 'attack' | 'state_change' | 'emit_signal' | 'animation' | 'camera' | 'hero_impulse';

export interface BehaviorAction {
  id: string;
  actionType: ActionType;
  moveMode?: 'towards_target' | 'away_from_target' | 'ground_patrol' | 'flying_sine' | 'jump' | 'stop';
  speed?: number;
  attackType?: 'melee_slash' | 'fire_projectile' | 'charge_dash' | 'guard';
  telegraphWindupMs?: number;
  targetState?: string;
  signalType?: 'emit_sound' | 'alert_icon' | 'call_allies';
  signalRadiusPx?: number;
  animState?: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hurt' | 'death' | string;
  cameraMode?: 'focus_target' | 'zoom_in' | 'shake';
  impulseType?: 'jump' | 'dash' | 'wall_jump' | 'ground_slam';
  force?: number;
}

export interface BehaviorRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: BehaviorTrigger;
  actions: BehaviorAction[];
}

export interface CameraFocusConfig {
  id: string;
  name: string;
  focusType: 'player_tracker' | 'static_anchor' | 'boss_lock' | 'deadzone_box' | 'rail_path' | 'cutscene_locus';
  cameraZoom: number; // 0.5x to 2.5x
  smoothingDamping: number; // 0.05 to 0.5
  deadzoneWidth: number; // px
  deadzoneHeight: number; // px
  lookAheadOffsetX: number;
  lookAheadOffsetY: number;
  lockOnPriority: number; // 1 to 10
}

export interface MovementControllerConfig {
  id: string;
  name: string;
  movementType: 'ground_patrol' | 'flying_sine' | 'leaper_jumper' | 'track_follower' | 'turret_aim' | 'charge_dash' | 'hover_chaser' | 'wall_clinger';
  moveSpeed: number;
  acceleration: number;
  jumpForce: number;
  gravityScale: number;
  turnOnEdge: boolean;
  turnOnObstacle: boolean;
  sineFrequency: number;
  sineAmplitude: number;
  airControl: number;
  trackNodeSpeed: number;
}

export interface EnemyAIConfig {
  id: string;
  name: string;
  aiProfile: 'aggressive_chaser' | 'ranged_kiter' | 'ambush_stalker' | 'shield_guard' | 'coward_fleer' | 'boss_multiphase' | 'passive_patrol' | 'sentry_turret';
  visionRadiusPx: number;
  visionAngleDeg: number;
  losCheckWall: boolean;
  attackRangePx: number;
  telegraphWindupMs: number;
  attackCooldownMs: number;
  retreatHealthPercent: number;
  comboChainCount: number;
  enragePhaseTriggerPercent: number;
  fsmStates: string[];
}

export interface HeroInputConfig {
  controlScheme: 'keyboard_wasd' | 'gamepad_stick' | 'virtual_dpad';
  jumpBufferMs: number;
  coyoteTimeMs: number;
  variableJumpHeight: boolean;
  maxAirJumps: number;
  dashCooldownMs: number;
  dashIFrameMs: number;
  allowAirDash: boolean;
  dashSpeedMultiplier: number;
  wallClingFriction: number;
  wallJumpForceX: number;
  wallJumpForceY: number;
  airControlPercent: number;
  footstepNoiseLevel: number;
  landingNoiseLevel: number;
}

export interface BossPhaseConfig {
  phaseNumber: number;
  hpPercentTrigger: number;
  phaseTitle: string;
  speedMultiplier: number;
  telegraphWindupMs: number;
  unlockedAttackTypes: string[];
  enrageAura: boolean;
  summonMinionCount: number;
}

export interface SentryTargetingConfig {
  scanSweepAngleDeg: number;
  aimSpeedDegPerSec: number;
  acquisitionRadiusPx: number;
  burstFireCount: number;
  burstIntervalMs: number;
}

export interface NPCInteractionConfig {
  interactionRadiusPx: number;
  promptText: string;
  npcRole: 'dialogue_quest' | 'shopkeeper' | 'save_shrine' | 'ambient_townsfolk';
  wanderRadiusPx: number;
  returnToPostDelayMs: number;
}

export interface BehaviorData {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'hero' | 'boss' | 'mob' | 'sentry' | 'npc';
  sensoryTags: SensoryTagConfig[];
  rules: BehaviorRule[];
  states: string[];
  foci: CameraFocusConfig;
  movement: MovementControllerConfig;
  ai: EnemyAIConfig;
  
  // Actor Category-Specific Behavior Configurations
  heroInput?: HeroInputConfig;
  bossPhases?: BossPhaseConfig[];
  sentryTargeting?: SentryTargetingConfig;
  npcInteraction?: NPCInteractionConfig;
}

export interface BehaviorFile {
  id: string;
  name: string;
  fileName: string; // e.g. "ashen_hunter.behavior"
  createdAt: string;
  updatedAt: string;
  behaviorData: BehaviorData;
}

// ==========================================
// 3.6 CHARACTER CREATOR & ANIMATION FILE (.character)
// ==========================================
export interface CharacterSocket {
  tagId: SensoryTagID; // e.g. 'head_eyes', 'head_ears', 'torso_center', 'feet_ground', 'hand_weapon'
  label: string;
  offsetX: number; // px relative to center
  offsetY: number; // px relative to center
  visualMarkerColor?: string;
}

export interface AnimationStateConfig {
  stateId: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hurt' | 'death' | string;
  label: string;
  frameCount: number;
  frameRateFps: number;
  loop: boolean;
  spriteRow: number;
  soundCue?: string;
}

export interface CharacterData {
  id: string;
  name: string;
  characterType: 'player_hero' | 'enemy_mob' | 'boss_archon' | 'friendly_npc';
  avatarIcon: string;
  spriteWidth: number;
  spriteHeight: number;
  tintColor: string;
  baseScale: number;
  sockets: CharacterSocket[];
  animations: AnimationStateConfig[];
  assignedBehaviorFileName?: string;
  assignedArchetypeFileName?: string;
  dialogueGreeting?: string;
}

export interface CharacterFile {
  id: string;
  name: string;
  fileName: string; // e.g. "ashen_hunter.character"
  createdAt: string;
  updatedAt: string;
  characterData: CharacterData;
}

// ==========================================
// 4. UI THEME FILE (.ui)
// ==========================================
export interface UIHealthOrbConfig {
  style: 'classic_orb' | 'horizontal_bar' | 'segmented_pips' | 'cyber_gauge';
  fillColor: string;
  dangerColor: string;
  borderColor: string;
  showNumericValue: boolean;
  scale: number;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_center';
}

export interface UIMinimapConfig {
  enabled: boolean;
  shape: 'circle' | 'square' | 'radar_diamond';
  sizePx: number;
  position: 'top_right' | 'bottom_right' | 'top_left';
  showPlayerBeacon: boolean;
  showExitMarkers: boolean;
  radarScanEffect: boolean;
  borderColor: string;
}

export interface UIDialogueBoxConfig {
  theme: 'gothic_parchment' | 'dark_stone' | 'cyber_hologram' | 'pixel_retro';
  fontFamily: string;
  fontSizePx: number;
  textSpeedCharsPerSec: number;
  showSpeakerPortrait: boolean;
  portraitPosition: 'left' | 'right';
  boxPosition: 'bottom' | 'top';
  backgroundColor: string;
  textColor: string;
  accentBorderColor: string;
}

export interface UIBossBarConfig {
  enabled: boolean;
  position: 'top_center' | 'bottom_center';
  style: 'ornate_golden' | 'dark_iron' | 'fiery_glow' | 'minimalist';
  showBossTitle: boolean;
  barColor: string;
  phaseMarkers: boolean;
}

export interface UICombatTextConfig {
  enabled: boolean;
  font: string;
  criticalPopScale: number;
  damageColors: {
    slashing: string;
    blunt: string;
    piercing: string;
    fire: string;
    frost: string;
    lightning: string;
    void: string;
    kinetic: string;
  };
}

export interface UIConfigData {
  id: string;
  name: string;
  themeName: string;
  healthOrb: UIHealthOrbConfig;
  manaGauge: {
    enabled: boolean;
    fillColor: string;
    style: 'bar' | 'orb' | 'runes';
  };
  staminaGauge: {
    enabled: boolean;
    fillColor: string;
    showBelowPlayer: boolean;
  };
  minimap: UIMinimapConfig;
  dialogueBox: UIDialogueBoxConfig;
  bossBar: UIBossBarConfig;
  combatText: UICombatTextConfig;
  buttonPromptStyle: 'keyboard' | 'playstation' | 'xbox' | 'nintendo';
}

export interface UIThemeFile {
  id: string;
  name: string;
  fileName: string; // e.g. "classic_gothic_hud.ui"
  createdAt: string;
  updatedAt: string;
  uiConfig: UIConfigData;
}

// ==========================================
// 5. GAME STRUCTURE FILE (.gamestructure)
// ==========================================
export interface ProgressionFlag {
  id: string;
  name: string;
  description: string;
  category: 'traversal' | 'boss' | 'story' | 'key_item';
  defaultUnlocked?: boolean;
}

export interface WorldGraphLink {
  id: string;
  sourceMapFileName: string;
  sourceExitId: string;
  targetMapFileName: string;
  targetExitId: string;
  isBiDirectional: boolean;
  requiredFlagId?: string; // Flag needed to open this passage
  notes?: string;
}

export interface MainMenuConfig {
  gameTitle: string;
  gameSubtitle: string;
  titleLogoUrl?: string;
  backgroundBiomeFileName: string; // Biome for live parallax backdrop
  backgroundThemeSong: string;
  menuButtons: { id: string; label: string; action: 'start_game' | 'load_game' | 'settings' | 'credits' | 'quit' }[];
  showCinematicFade: boolean;
  titleColor: string;
  accentColor: string;
}

export interface LoadingScreenConfig {
  style: 'dark_ambient' | 'animated_shutter' | 'iris_wipe' | 'lore_slate';
  loreTips: string[];
  showSpinner: boolean;
  showMinimapPreview: boolean;
  minDisplayDurationMs: number;
  splashImageUrl?: string;
}

export interface PauseMenuConfig {
  enabledTabs: {
    inventory: boolean;
    worldMap: boolean;
    archetypes: boolean;
    quests: boolean;
    audioSettings: boolean;
  };
  pauseGameWorld: boolean;
  backgroundBlurAmount: number;
}

export interface GameStructureData {
  id: string;
  name: string;
  gameTitle: string;
  gameSubtitle: string;
  version: string;
  author: string;
  
  // Attachments to other modules
  entryMapFileName: string; // Initial starting .map file
  entrySpawnId: string;
  defaultArchetypeFileName: string; // Starting player class
  attachedUiFileName: string; // Active HUD/UI configuration
  
  // Game framework configs
  mainMenu: MainMenuConfig;
  loadingScreen: LoadingScreenConfig;
  pauseMenu: PauseMenuConfig;
  progressionFlags: ProgressionFlag[];
  worldGraphLinks: WorldGraphLink[];
}

export interface GameStructureFile {
  id: string;
  name: string;
  fileName: string; // e.g. "main_campaign.gamestructure"
  createdAt: string;
  updatedAt: string;
  structureData: GameStructureData;
}

// ==========================================
// 6. MASON MASTER PROJECT CONTAINER
// ==========================================
export type MasonModuleId = 'maps' | 'biomes' | 'archetypes' | 'characters' | 'ui' | 'gamestructure' | 'behaviors' | 'macro' | 'explorer';

export interface MasonFileSystem {
  maps: MapFile[];
  biomes: BiomeFile[];
  archetypes: ArchetypeFile[];
  characters: CharacterFile[];
  ui: UIThemeFile[];
  game: GameStructureFile[];
  behaviors: BehaviorFile[];
}

export interface MasonProject {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  engineVersion: string;
  
  activeModule: MasonModuleId;
  
  // Active selected files per module
  activeFiles: {
    mapFileName: string;
    biomeFileName: string;
    archetypeFileName: string;
    characterFileName?: string;
    uiFileName: string;
    gameStructureFileName: string;
    behaviorFileName?: string;
  };
  
  fileSystem: MasonFileSystem;
}

// ==========================================
// DEFAULT STARTER TEMPLATES & PRESETS
// ==========================================
export const DEFAULT_PROGRESSION_FLAGS: ProgressionFlag[] = [
  { id: 'has_double_jump', name: 'Aether Wings (Double Jump)', description: 'Allows jumping a second time mid-air to reach high ledges', category: 'traversal' },
  { id: 'has_air_dash', name: 'Cinder Dash (Air Dash)', description: 'Surge horizontally through narrow laser hazards and chasms', category: 'traversal' },
  { id: 'has_wall_cling', name: 'Iron Claws (Wall Cling)', description: 'Grip vertical masonry surfaces and perform wall kicks', category: 'traversal' },
  { id: 'boss_caldera_slain', name: 'Infernal Core Destroyed', description: 'Defeated Ignis Archon; magma barriers cooled', category: 'boss' },
  { id: 'gate_sanctuary_key', name: 'Sanctuary Sun Crest Key', description: 'Unlocks the celestial seal on the Grand Sanctum entrance', category: 'key_item' },
  { id: 'met_the_cartographer', name: 'Cartographer Rescued', description: 'Reveals hidden biome rooms on the in-game world map', category: 'story' }
];

export const DEFAULT_UI_THEMES: UIConfigData[] = [
  {
    id: 'classic_gothic_hud',
    name: 'Gothic Obsidian & Ruby',
    themeName: 'Gothic Obsidian & Ruby',
    healthOrb: {
      style: 'classic_orb',
      fillColor: '#dc2626',
      dangerColor: '#7f1d1d',
      borderColor: '#382f2d',
      showNumericValue: true,
      scale: 1.0,
      position: 'top_left'
    },
    manaGauge: {
      enabled: true,
      fillColor: '#2563eb',
      style: 'orb'
    },
    staminaGauge: {
      enabled: true,
      fillColor: '#16a34a',
      showBelowPlayer: true
    },
    minimap: {
      enabled: true,
      shape: 'circle',
      sizePx: 140,
      position: 'top_right',
      showPlayerBeacon: true,
      showExitMarkers: true,
      radarScanEffect: true,
      borderColor: '#475569'
    },
    dialogueBox: {
      theme: 'gothic_parchment',
      fontFamily: 'serif',
      fontSizePx: 14,
      textSpeedCharsPerSec: 35,
      showSpeakerPortrait: true,
      portraitPosition: 'left',
      boxPosition: 'bottom',
      backgroundColor: '#18181bfa',
      textColor: '#f4f4f5',
      accentBorderColor: '#d97706'
    },
    bossBar: {
      enabled: true,
      position: 'top_center',
      style: 'ornate_golden',
      showBossTitle: true,
      barColor: '#e11d48',
      phaseMarkers: true
    },
    combatText: {
      enabled: true,
      font: 'sans-serif',
      criticalPopScale: 1.6,
      damageColors: {
        slashing: '#ef4444',
        blunt: '#f97316',
        piercing: '#eab308',
        fire: '#ff4d00',
        frost: '#38bdf8',
        lightning: '#a855f7',
        void: '#c084fc',
        kinetic: '#e2e8f0'
      }
    },
    buttonPromptStyle: 'keyboard'
  },
  {
    id: 'minimalist_scifi_hud',
    name: 'Cybernetic Neon & Glass',
    themeName: 'Cybernetic Neon & Glass',
    healthOrb: {
      style: 'cyber_gauge',
      fillColor: '#06b6d4',
      dangerColor: '#f43f5e',
      borderColor: '#0e7490',
      showNumericValue: true,
      scale: 1.0,
      position: 'top_left'
    },
    manaGauge: {
      enabled: true,
      fillColor: '#8b5cf6',
      style: 'bar'
    },
    staminaGauge: {
      enabled: true,
      fillColor: '#10b981',
      showBelowPlayer: true
    },
    minimap: {
      enabled: true,
      shape: 'radar_diamond',
      sizePx: 150,
      position: 'top_right',
      showPlayerBeacon: true,
      showExitMarkers: true,
      radarScanEffect: true,
      borderColor: '#06b6d4'
    },
    dialogueBox: {
      theme: 'cyber_hologram',
      fontFamily: 'monospace',
      fontSizePx: 13,
      textSpeedCharsPerSec: 50,
      showSpeakerPortrait: true,
      portraitPosition: 'left',
      boxPosition: 'bottom',
      backgroundColor: '#030712f0',
      textColor: '#67e8f9',
      accentBorderColor: '#06b6d4'
    },
    bossBar: {
      enabled: true,
      position: 'top_center',
      style: 'fiery_glow',
      showBossTitle: true,
      barColor: '#06b6d4',
      phaseMarkers: true
    },
    combatText: {
      enabled: true,
      font: 'monospace',
      criticalPopScale: 1.8,
      damageColors: {
        slashing: '#06b6d4',
        blunt: '#3b82f6',
        piercing: '#6366f1',
        fire: '#f97316',
        frost: '#38bdf8',
        lightning: '#a855f7',
        void: '#ec4899',
        kinetic: '#f3f4f6'
      }
    },
    buttonPromptStyle: 'keyboard'
  }
];

export const DEFAULT_ARCHETYPES: ArchetypeData[] = [
  {
    id: 'arch_korrath',
    name: 'Korrath Steelhand',
    title: 'Titan Vanguard & Bastion',
    backstory: 'A veteran of the fractured basalt citadels, Korrath wields heavy greatswords and kinetic shockwaves to sunder obsidian battlements and cleave subterranean beasts.',
    avatarIcon: '🛡️',
    themeColor: '#3b82f6',
    baseStats: {
      health: 140,
      energy: 40,
      stamina: 90,
      poise: 80,
      moveSpeed: 4.8,
      jumpForce: 9.5
    },
    traversalTags: ['double_jump', 'wall_cling'],
    foci: {
      action: ['foci_slash', 'foci_thrust', 'foci_earth_shatter'],
      ability: ['foci_shockwave', 'foci_stone_barrier', '', ''],
      armor: 'foci_heavy_plate',
      defensive: 'foci_iron_guard'
    },
    weaponProficiencies: ['Greatsword', 'Warhammer', 'Tower Shield'],
    damageAffinity: 'blunt',
    passivePerks: [
      { id: 'perk_juggernaut', name: 'Juggernaut Momentum', desc: 'Sprinting grants hyper-armor through lightweight enemy projectiles.' },
      { id: 'perk_stone_skin', name: 'Obsidian Resilience', desc: 'Blunt and kinetic damage taken is reduced by 25%.' }
    ]
  },
  {
    id: 'arch_valen',
    name: 'Valen Shadowalker',
    title: 'Aether Strider & Void Assassin',
    backstory: 'Trained in the twilight canopy branches, Valen traverses vertical shafts with effortless agility, shifting through shadow rifts to assassinate high-threat sentinels.',
    avatarIcon: '🗡️',
    themeColor: '#8b5cf6',
    baseStats: {
      health: 85,
      energy: 100,
      stamina: 120,
      poise: 30,
      moveSpeed: 6.5,
      jumpForce: 11.2
    },
    traversalTags: ['double_jump', 'air_dash', 'wall_cling'],
    foci: {
      action: ['foci_rapid_daggers', 'foci_shadow_strike', ''],
      ability: ['foci_blink_teleport', 'foci_void_knives', 'foci_smoke_veil', ''],
      armor: 'foci_shadow_cloak',
      defensive: 'foci_phase_dodge'
    },
    weaponProficiencies: ['Dual Daggers', 'Recurve Bow', 'Shadow Blade'],
    damageAffinity: 'slashing',
    passivePerks: [
      { id: 'perk_phantom_step', name: 'Phantom Step', desc: 'Dodging through enemies inflicts Bleed and restores 15 stamina.' },
      { id: 'perk_keen_eyes', name: 'Veil Sight', desc: 'Reveals hidden passages and breakable illusory walls on the minimap.' }
    ]
  },
  {
    id: 'arch_ignis',
    name: 'Ignis Caldera-Born',
    title: 'Pyromancer & Flame Weaver',
    backstory: 'Infused with the boiling core of the volcanic caldera, Ignis channels scorched sulfur and molten magma to burn enemy ranks from afar.',
    avatarIcon: '🔥',
    themeColor: '#f97316',
    baseStats: {
      health: 95,
      energy: 140,
      stamina: 80,
      poise: 40,
      moveSpeed: 5.2,
      jumpForce: 10.0
    },
    traversalTags: ['double_jump', 'air_dash'],
    foci: {
      action: ['foci_fireball', 'foci_flame_whip', ''],
      ability: ['foci_magma_eruption', 'foci_heat_shield', 'foci_cinder_blast', ''],
      armor: 'foci_flame_robes',
      defensive: 'foci_flame_burst'
    },
    weaponProficiencies: ['Catalyst Staff', 'Flaming Scythe'],
    damageAffinity: 'fire',
    passivePerks: [
      { id: 'perk_heat_absorption', name: 'Magma Conduit', desc: 'Standing near lava or fire surfaces recharges energy 100% faster.' },
      { id: 'perk_combustion', name: 'Ignition Flare', desc: 'Enemies slain with fire explode, dealing splash damage to nearby foes.' }
    ]
  }
];

export const createDefaultMapFile = (
  id: string,
  name: string,
  fileName: string,
  width: number = 32,
  height: number = 24,
  biomeId: string = 'mourne_ashen_steppes'
): MapFile => {
  return {
    id,
    name,
    fileName,
    description: `2D Metroidvania sidescroller map level (${width}×${height})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    width,
    height,
    defaultBiomeId: biomeId,
    playerSpawns: [
      { spawnId: 'spawn_default', x: 4, y: height - 5, facing: 'right', isDefault: true }
    ],
    exits: [],
    data: {
      id,
      name,
      width,
      height,
      chunks: {}
    },
    chunks: {}
  };
};

export const createDefaultGameStructure = (): GameStructureData => {
  return {
    id: 'game_main_campaign',
    name: 'Main Campaign Framework',
    gameTitle: 'ECHOES OF THE ASHEN VOID',
    gameSubtitle: 'A 2D Metroidvania Odyssey',
    version: '1.0.0-rc',
    author: 'Mason Game Director',
    entryMapFileName: 'ashen_outpost.map',
    entrySpawnId: 'spawn_default',
    defaultArchetypeFileName: 'korrath_steelhand.arch',
    attachedUiFileName: 'classic_gothic_hud.ui',
    mainMenu: {
      gameTitle: 'ECHOES OF THE ASHEN VOID',
      gameSubtitle: 'A 2D Metroidvania Odyssey',
      backgroundBiomeFileName: 'mourne_ashen_steppes.biome',
      backgroundThemeSong: 'bgm_ashen_requiem',
      menuButtons: [
        { id: 'btn_start', label: 'ENTER THE VOID', action: 'start_game' },
        { id: 'btn_load', label: 'CONTINUE ODYSSEY', action: 'load_game' },
        { id: 'btn_settings', label: 'SETTINGS & CONTROLS', action: 'settings' },
        { id: 'btn_credits', label: 'CREDITS & ARCHIVE', action: 'credits' }
      ],
      showCinematicFade: true,
      titleColor: '#f43f5e',
      accentColor: '#06b6d4'
    },
    loadingScreen: {
      style: 'lore_slate',
      loreTips: [
        'Aether Wings allow double-jumping mid air to reach elevated titan ruins.',
        'Obsidian terrain resists blunt attacks, but yields quickly to thermal and void magic.',
        'Shrines of Ember replenish your stamina gauge and record your respawn waypoint.',
        'Check your World Graph to find undiscovered passage connections and sealed gates.'
      ],
      showSpinner: true,
      showMinimapPreview: true,
      minDisplayDurationMs: 1500
    },
    pauseMenu: {
      enabledTabs: {
        inventory: true,
        worldMap: true,
        archetypes: true,
        quests: true,
        audioSettings: true
      },
      pauseGameWorld: true,
      backgroundBlurAmount: 8
    },
    progressionFlags: DEFAULT_PROGRESSION_FLAGS,
    worldGraphLinks: [
      {
        id: 'link_ashen_to_crystal',
        sourceMapFileName: 'ashen_outpost.map',
        sourceExitId: 'exit_east',
        targetMapFileName: 'crystal_chasm.map',
        targetExitId: 'exit_west',
        isBiDirectional: true,
        notes: 'Main progression pathway from surface outpost into subterranean crystal caves'
      },
      {
        id: 'link_ashen_to_caldera',
        sourceMapFileName: 'ashen_outpost.map',
        sourceExitId: 'exit_west',
        targetMapFileName: 'brimstone_caldera.map',
        targetExitId: 'exit_east',
        isBiDirectional: true,
        requiredFlagId: 'has_double_jump',
        notes: 'High ledge entrance requiring Aether Wings to leap across volcanic chasm'
      }
    ]
  };
};

export const DEFAULT_BEHAVIORS: BehaviorData[] = [
  {
    id: 'beh_player_hero',
    name: 'Player Hero Traversal Driver',
    title: 'Kinematic Player Movement & Input Driver',
    description: 'Player hero control scheme with Jump Buffer, Coyote Time, Double Jump, Air Dash, Wall Cling/Jump & Acoustic Footstep Noise Emission.',
    category: 'hero',
    sensoryTags: [
      { tagId: 'head_eyes', label: 'Player Sight Focus', offsetX: 10, offsetY: -18 },
      { tagId: 'head_ears', label: 'Ears (Noise Listener)', offsetX: 0, offsetY: -20 },
      { tagId: 'torso_center', label: 'Hurtbox Locus', offsetX: 0, offsetY: 0 },
      { tagId: 'feet_ground', label: 'Footstep Noise Generator', offsetX: 0, offsetY: 26 },
      { tagId: 'hand_weapon', label: 'Weapon Origin', offsetX: 18, offsetY: 2 }
    ],
    heroInput: {
      controlScheme: 'keyboard_wasd',
      jumpBufferMs: 120,
      coyoteTimeMs: 100,
      variableJumpHeight: true,
      maxAirJumps: 2,
      dashCooldownMs: 800,
      dashIFrameMs: 250,
      allowAirDash: true,
      dashSpeedMultiplier: 2.2,
      wallClingFriction: 0.6,
      wallJumpForceX: 8.5,
      wallJumpForceY: 10.0,
      airControlPercent: 85,
      footstepNoiseLevel: 35,
      landingNoiseLevel: 65
    },
    states: ['idle', 'walk', 'run', 'jump', 'dash', 'wall_slide', 'attack', 'hurt'],
    rules: [
      {
        id: 'rule_hero_jump',
        name: 'IF Press Jump & Grounded -> THEN Vertical Impulse & Noise Emission',
        enabled: true,
        trigger: {
          type: 'input_press',
          button: 'jump'
        },
        actions: [
          { id: 'act_hj_1', actionType: 'hero_impulse', impulseType: 'jump', force: 11.5 },
          { id: 'act_hj_2', actionType: 'animation', animState: 'jump' },
          { id: 'act_hj_3', actionType: 'emit_signal', signalType: 'emit_sound', signalRadiusPx: 120 }
        ]
      },
      {
        id: 'rule_hero_dash',
        name: 'IF Press Dash -> THEN Horizontal Burst & i-Frames',
        enabled: true,
        trigger: {
          type: 'input_press',
          button: 'dash'
        },
        actions: [
          { id: 'act_hd_1', actionType: 'hero_impulse', impulseType: 'dash', force: 16.0 },
          { id: 'act_hd_2', actionType: 'animation', animState: 'run' }
        ]
      },
      {
        id: 'rule_hero_attack',
        name: 'IF Press Attack -> THEN Primary Blade Slash Combo',
        enabled: true,
        trigger: {
          type: 'input_press',
          button: 'attack_primary'
        },
        actions: [
          { id: 'act_ha_1', actionType: 'attack', attackType: 'melee_slash', telegraphWindupMs: 50 },
          { id: 'act_ha_2', actionType: 'animation', animState: 'attack' }
        ]
      }
    ],
    foci: {
      id: 'foci_hero',
      name: 'Player Tracking Smooth Focus',
      focusType: 'player_tracker',
      cameraZoom: 1.0,
      smoothingDamping: 0.12,
      deadzoneWidth: 100,
      deadzoneHeight: 60,
      lookAheadOffsetX: 48,
      lookAheadOffsetY: 0,
      lockOnPriority: 10
    },
    movement: {
      id: 'mov_hero',
      name: 'Player Kinematic Physics',
      movementType: 'ground_patrol',
      moveSpeed: 6.5,
      acceleration: 18.0,
      jumpForce: 11.5,
      gravityScale: 1.0,
      turnOnEdge: false,
      turnOnObstacle: false,
      sineFrequency: 0,
      sineAmplitude: 0,
      airControl: 0.85,
      trackNodeSpeed: 0
    },
    ai: {
      id: 'ai_hero',
      name: 'Direct Player Control',
      aiProfile: 'aggressive_chaser',
      visionRadiusPx: 0,
      visionAngleDeg: 0,
      losCheckWall: false,
      attackRangePx: 0,
      telegraphWindupMs: 0,
      attackCooldownMs: 0,
      retreatHealthPercent: 0,
      comboChainCount: 3,
      enragePhaseTriggerPercent: 0,
      fsmStates: ['idle', 'walk', 'run', 'jump', 'dash', 'attack']
    }
  },
  {
    id: 'beh_ashen_hunter',
    name: 'Ashen Hunter (Ground Aggressor)',
    title: 'IFTTT Sight/Sound Ledge Hunter',
    description: 'Uses IF SIGHT (eyes) -> THEN Charge & Attack, IF SOUND (ears) -> THEN Alert & Turn, IF LEDGE -> THEN Turn Around.',
    category: 'mob',
    sensoryTags: [
      { tagId: 'head_eyes', label: 'Optical Sensor (Eyes)', offsetX: 12, offsetY: -16 },
      { tagId: 'head_ears', label: 'Acoustic Ears', offsetX: 0, offsetY: -20 },
      { tagId: 'torso_center', label: 'Mass Center Locus', offsetX: 0, offsetY: 0 },
      { tagId: 'feet_ground', label: 'Ground Contact Point', offsetX: 0, offsetY: 24 }
    ],
    states: ['idle', 'patrol', 'alerted', 'chase', 'attack', 'flee'],
    rules: [
      {
        id: 'rule_1',
        name: 'IF Sight (Eyes) Detects Player -> THEN Chase & Charge',
        enabled: true,
        trigger: {
          type: 'sight',
          sensoryTag: 'head_eyes',
          visionRadiusPx: 220,
          visionAngleDeg: 120,
          requireLineOfSight: true,
          targetFilter: 'player'
        },
        actions: [
          { id: 'act_1', actionType: 'move', moveMode: 'towards_target', speed: 6.0 },
          { id: 'act_2', actionType: 'state_change', targetState: 'chase' },
          { id: 'act_3', actionType: 'animation', animState: 'run' }
        ]
      },
      {
        id: 'rule_2',
        name: 'IF Footstep Sound (Ears) Heard -> THEN Face Sound Source & Alert',
        enabled: true,
        trigger: {
          type: 'sound',
          sensoryTag: 'head_ears',
          hearingRadiusPx: 280,
          minNoiseLevel: 25
        },
        actions: [
          { id: 'act_4', actionType: 'emit_signal', signalType: 'alert_icon', signalRadiusPx: 200 },
          { id: 'act_5', actionType: 'state_change', targetState: 'alerted' }
        ]
      },
      {
        id: 'rule_3',
        name: 'IF Proximity <= 48px -> THEN Melee Slash Attack',
        enabled: true,
        trigger: {
          type: 'proximity',
          sensoryTag: 'torso_center',
          distancePx: 48,
          comparator: 'less_than'
        },
        actions: [
          { id: 'act_6', actionType: 'attack', attackType: 'melee_slash', telegraphWindupMs: 300 },
          { id: 'act_7', actionType: 'animation', animState: 'attack' }
        ]
      },
      {
        id: 'rule_4',
        name: 'IF Cliff Ledge Edge -> THEN Reverse Patrol Direction',
        enabled: true,
        trigger: {
          type: 'collision',
          contactType: 'cliff_edge'
        },
        actions: [
          { id: 'act_8', actionType: 'move', moveMode: 'ground_patrol', speed: 4.0 }
        ]
      }
    ],
    foci: {
      id: 'foci_ashen_hunter',
      name: 'Dynamic Target Focus',
      focusType: 'player_tracker',
      cameraZoom: 1.0,
      smoothingDamping: 0.15,
      deadzoneWidth: 120,
      deadzoneHeight: 80,
      lookAheadOffsetX: 40,
      lookAheadOffsetY: 0,
      lockOnPriority: 3
    },
    movement: {
      id: 'mov_ashen_hunter',
      name: 'Ledge Patrol Walker',
      movementType: 'ground_patrol',
      moveSpeed: 4.8,
      acceleration: 12.0,
      jumpForce: 9.5,
      gravityScale: 1.0,
      turnOnEdge: true,
      turnOnObstacle: true,
      sineFrequency: 1.0,
      sineAmplitude: 0,
      airControl: 0.4,
      trackNodeSpeed: 0
    },
    ai: {
      id: 'ai_ashen_hunter',
      name: 'Melee Aggressor FSM',
      aiProfile: 'aggressive_chaser',
      visionRadiusPx: 220,
      visionAngleDeg: 120,
      losCheckWall: true,
      attackRangePx: 48,
      telegraphWindupMs: 350,
      attackCooldownMs: 1200,
      retreatHealthPercent: 15,
      comboChainCount: 2,
      enragePhaseTriggerPercent: 0,
      fsmStates: ['idle', 'patrol', 'alerted', 'chase', 'windup', 'attack', 'cooldown', 'staggered']
    }
  },
  {
    id: 'beh_ignis_boss',
    name: 'Ignis Caldera Archon (Multi-Phase Boss)',
    title: '3-Phase Magma Archon with Enrage Auras',
    description: 'Boss enemy with phase triggers at 100%, 60%, and 25% HP, arena camera lock, and heavy telegraphed attacks.',
    category: 'boss',
    sensoryTags: [
      { tagId: 'head_eyes', label: 'Magma Core Eyes', offsetX: 0, offsetY: -32 },
      { tagId: 'torso_center', label: 'Caldera Heart', offsetX: 0, offsetY: 0 },
      { tagId: 'feet_ground', label: 'Tremor Stomp Base', offsetX: 0, offsetY: 40 }
    ],
    bossPhases: [
      {
        phaseNumber: 1,
        hpPercentTrigger: 100,
        phaseTitle: 'Phase I: Molten Awakening',
        speedMultiplier: 1.0,
        telegraphWindupMs: 600,
        unlockedAttackTypes: ['melee_slash', 'fire_projectile'],
        enrageAura: false,
        summonMinionCount: 0
      },
      {
        phaseNumber: 2,
        hpPercentTrigger: 60,
        phaseTitle: 'Phase II: Sulfur Eruption',
        speedMultiplier: 1.3,
        telegraphWindupMs: 400,
        unlockedAttackTypes: ['melee_slash', 'fire_projectile', 'charge_dash'],
        enrageAura: true,
        summonMinionCount: 2
      },
      {
        phaseNumber: 3,
        hpPercentTrigger: 25,
        phaseTitle: 'Phase III: Infernal Cataclysm',
        speedMultiplier: 1.7,
        telegraphWindupMs: 250,
        unlockedAttackTypes: ['melee_slash', 'fire_projectile', 'charge_dash'],
        enrageAura: true,
        summonMinionCount: 4
      }
    ],
    states: ['phase_1', 'phase_2', 'phase_3', 'windup', 'staggered', 'defeated'],
    rules: [
      {
        id: 'rule_boss_phase2',
        name: 'IF HP < 60% -> THEN Trigger Phase II Sulfur Eruption',
        enabled: true,
        trigger: {
          type: 'health',
          healthPercentThreshold: 60,
          comparator: 'less_than'
        },
        actions: [
          { id: 'act_bp_1', actionType: 'state_change', targetState: 'phase_2' },
          { id: 'act_bp_2', actionType: 'emit_signal', signalType: 'emit_sound', signalRadiusPx: 400 },
          { id: 'act_bp_3', actionType: 'camera', cameraMode: 'shake' }
        ]
      }
    ],
    foci: {
      id: 'foci_ignis',
      name: 'Arena Lock Focus',
      focusType: 'boss_lock',
      cameraZoom: 0.85,
      smoothingDamping: 0.08,
      deadzoneWidth: 200,
      deadzoneHeight: 150,
      lookAheadOffsetX: 0,
      lookAheadOffsetY: -30,
      lockOnPriority: 10
    },
    movement: {
      id: 'mov_ignis',
      name: 'Archon Heavy Stride',
      movementType: 'ground_patrol',
      moveSpeed: 3.5,
      acceleration: 8.0,
      jumpForce: 14.0,
      gravityScale: 1.2,
      turnOnEdge: false,
      turnOnObstacle: true,
      sineFrequency: 0,
      sineAmplitude: 0,
      airControl: 0.2,
      trackNodeSpeed: 0
    },
    ai: {
      id: 'ai_ignis',
      name: 'Boss Multi-Phase FSM',
      aiProfile: 'boss_multiphase',
      visionRadiusPx: 400,
      visionAngleDeg: 360,
      losCheckWall: false,
      attackRangePx: 120,
      telegraphWindupMs: 500,
      attackCooldownMs: 1500,
      retreatHealthPercent: 0,
      comboChainCount: 4,
      enragePhaseTriggerPercent: 60,
      fsmStates: ['phase_1', 'phase_2', 'phase_3', 'windup', 'attack', 'cooldown']
    }
  },
  {
    id: 'beh_crystal_sentry',
    name: 'Aether Crystal Sentry',
    title: 'Fixed Rotator Turret with Scan Sweep',
    description: 'Stationary sentry turret scanning a 120° arc and rapid firing projectiles upon target acquisition.',
    category: 'sentry',
    sensoryTags: [
      { tagId: 'head_eyes', label: 'Lens Optics', offsetX: 0, offsetY: 0 }
    ],
    sentryTargeting: {
      scanSweepAngleDeg: 120,
      aimSpeedDegPerSec: 90,
      acquisitionRadiusPx: 320,
      burstFireCount: 3,
      burstIntervalMs: 180
    },
    states: ['scanning', 'locking', 'firing', 'recharging'],
    rules: [
      {
        id: 'rule_sentry_fire',
        name: 'IF Target in Acquisition Range -> THEN Burst Fire',
        enabled: true,
        trigger: {
          type: 'sight',
          sensoryTag: 'head_eyes',
          visionRadiusPx: 320,
          visionAngleDeg: 120,
          requireLineOfSight: true,
          targetFilter: 'player'
        },
        actions: [
          { id: 'act_sen_1', actionType: 'attack', attackType: 'fire_projectile', telegraphWindupMs: 200 }
        ]
      }
    ],
    foci: {
      id: 'foci_sentry',
      name: 'Static Sentry Locus',
      focusType: 'static_anchor',
      cameraZoom: 1.0,
      smoothingDamping: 0.2,
      deadzoneWidth: 0,
      deadzoneHeight: 0,
      lookAheadOffsetX: 0,
      lookAheadOffsetY: 0,
      lockOnPriority: 1
    },
    movement: {
      id: 'mov_sentry',
      name: 'Turret Rotator',
      movementType: 'turret_aim',
      moveSpeed: 0,
      acceleration: 0,
      jumpForce: 0,
      gravityScale: 0,
      turnOnEdge: false,
      turnOnObstacle: false,
      sineFrequency: 0,
      sineAmplitude: 0,
      airControl: 0,
      trackNodeSpeed: 0
    },
    ai: {
      id: 'ai_sentry',
      name: 'Sentry FSM',
      aiProfile: 'sentry_turret',
      visionRadiusPx: 320,
      visionAngleDeg: 120,
      losCheckWall: true,
      attackRangePx: 320,
      telegraphWindupMs: 200,
      attackCooldownMs: 1200,
      retreatHealthPercent: 0,
      comboChainCount: 3,
      enragePhaseTriggerPercent: 0,
      fsmStates: ['scanning', 'locking', 'firing', 'recharging']
    }
  },
  {
    id: 'beh_elder_kael',
    name: 'Master Elder Kael (Friendly NPC)',
    title: 'Dialogue & Quest Giver NPC',
    description: 'Townsfolk NPC with proximity greeting, interact key prompt, and quest dialogue trigger.',
    category: 'npc',
    sensoryTags: [
      { tagId: 'head_eyes', label: 'Elder Sight', offsetX: 0, offsetY: -16 },
      { tagId: 'torso_center', label: 'Interaction Locus', offsetX: 0, offsetY: 0 }
    ],
    npcInteraction: {
      interactionRadiusPx: 50,
      promptText: 'Press [E] to Speak with Elder Kael',
      npcRole: 'dialogue_quest',
      wanderRadiusPx: 40,
      returnToPostDelayMs: 3000
    },
    states: ['idle', 'speaking', 'wandering'],
    rules: [
      {
        id: 'rule_npc_interact',
        name: 'IF Player Proximity <= 50px -> THEN Show Interact Prompt & Greet',
        enabled: true,
        trigger: {
          type: 'proximity',
          sensoryTag: 'torso_center',
          distancePx: 50,
          comparator: 'less_than'
        },
        actions: [
          { id: 'act_npc_1', actionType: 'emit_signal', signalType: 'alert_icon', signalRadiusPx: 50 },
          { id: 'act_npc_2', actionType: 'animation', animState: 'idle' }
        ]
      }
    ],
    foci: {
      id: 'foci_npc',
      name: 'NPC Focus',
      focusType: 'static_anchor',
      cameraZoom: 1.1,
      smoothingDamping: 0.2,
      deadzoneWidth: 0,
      deadzoneHeight: 0,
      lookAheadOffsetX: 0,
      lookAheadOffsetY: 0,
      lockOnPriority: 1
    },
    movement: {
      id: 'mov_npc',
      name: 'Slow Wanderer',
      movementType: 'ground_patrol',
      moveSpeed: 1.5,
      acceleration: 4.0,
      jumpForce: 0,
      gravityScale: 1.0,
      turnOnEdge: true,
      turnOnObstacle: true,
      sineFrequency: 0,
      sineAmplitude: 0,
      airControl: 0,
      trackNodeSpeed: 0
    },
    ai: {
      id: 'ai_npc',
      name: 'Passive NPC FSM',
      aiProfile: 'passive_patrol',
      visionRadiusPx: 80,
      visionAngleDeg: 180,
      losCheckWall: false,
      attackRangePx: 0,
      telegraphWindupMs: 0,
      attackCooldownMs: 0,
      retreatHealthPercent: 0,
      comboChainCount: 0,
      enragePhaseTriggerPercent: 0,
      fsmStates: ['idle', 'speaking', 'wandering']
    }
  }
];

export const DEFAULT_CHARACTERS: CharacterData[] = [
  {
    id: 'char_korrath',
    name: 'Korrath Steelhand (Player Hero)',
    characterType: 'player_hero',
    avatarIcon: '🛡️',
    spriteWidth: 64,
    spriteHeight: 64,
    tintColor: '#06b6d4',
    baseScale: 1.0,
    assignedBehaviorFileName: 'ashen_hunter.behavior',
    assignedArchetypeFileName: 'korrath.arch',
    sockets: [
      { tagId: 'head_eyes', label: 'Eyes (Sight Locus)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
      { tagId: 'head_ears', label: 'Ears (Hearing Locus)', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
      { tagId: 'torso_center', label: 'Torso Center (Hurtbox)', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
      { tagId: 'feet_ground', label: 'Feet (Footstep Sound)', offsetX: 0, offsetY: 26, visualMarkerColor: '#f59e0b' },
      { tagId: 'hand_weapon', label: 'Right Hand (Weapon Origin)', offsetX: 18, offsetY: 2, visualMarkerColor: '#ef4444' }
    ],
    animations: [
      { stateId: 'idle', label: 'Idle Stance', frameCount: 4, frameRateFps: 8, loop: true, spriteRow: 0 },
      { stateId: 'walk', label: 'Walk Cycle', frameCount: 8, frameRateFps: 12, loop: true, spriteRow: 1, soundCue: 'sfx_footstep_soft' },
      { stateId: 'run', label: 'Sprint Dash', frameCount: 6, frameRateFps: 16, loop: true, spriteRow: 2, soundCue: 'sfx_footstep_heavy' },
      { stateId: 'jump', label: 'Airborne Rise', frameCount: 3, frameRateFps: 10, loop: false, spriteRow: 3, soundCue: 'sfx_jump_whoosh' },
      { stateId: 'attack', label: 'Blade Slash', frameCount: 5, frameRateFps: 18, loop: false, spriteRow: 4, soundCue: 'sfx_sword_slash' },
      { stateId: 'hurt', label: 'Stagger Impact', frameCount: 2, frameRateFps: 8, loop: false, spriteRow: 5, soundCue: 'sfx_grunt_hurt' },
      { stateId: 'death', label: 'Collapse', frameCount: 6, frameRateFps: 10, loop: false, spriteRow: 6 }
    ]
  },
  {
    id: 'char_ashen_hunter',
    name: 'Ashen Outpost Hunter (NPC Creep)',
    characterType: 'enemy_mob',
    avatarIcon: '👹',
    spriteWidth: 64,
    spriteHeight: 64,
    tintColor: '#ef4444',
    baseScale: 1.1,
    assignedBehaviorFileName: 'ashen_hunter.behavior',
    assignedArchetypeFileName: 'korrath.arch',
    sockets: [
      { tagId: 'head_eyes', label: 'Glowing Red Eyes', offsetX: 12, offsetY: -16, visualMarkerColor: '#ef4444' },
      { tagId: 'head_ears', label: 'Acoustic Horns', offsetX: -2, offsetY: -22, visualMarkerColor: '#a855f7' },
      { tagId: 'torso_center', label: 'Chest Armor Center', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
      { tagId: 'feet_ground', label: 'Heavy Hooves', offsetX: 0, offsetY: 24, visualMarkerColor: '#f59e0b' },
      { tagId: 'hand_weapon', label: 'Greatsword Tip', offsetX: 20, offsetY: -4, visualMarkerColor: '#dc2626' }
    ],
    animations: [
      { stateId: 'idle', label: 'Alert Guard Idle', frameCount: 4, frameRateFps: 6, loop: true, spriteRow: 0 },
      { stateId: 'walk', label: 'Ledge Patrol Walk', frameCount: 6, frameRateFps: 8, loop: true, spriteRow: 1 },
      { stateId: 'run', label: 'Charge Attack Sprint', frameCount: 6, frameRateFps: 14, loop: true, spriteRow: 2 },
      { stateId: 'attack', label: 'Heavy Cleave', frameCount: 6, frameRateFps: 15, loop: false, spriteRow: 3 },
      { stateId: 'hurt', label: 'Armor Impact', frameCount: 2, frameRateFps: 8, loop: false, spriteRow: 4 },
      { stateId: 'death', label: 'Ashen Dissolve', frameCount: 7, frameRateFps: 12, loop: false, spriteRow: 5 }
    ]
  }
];

export const createInitialMasonProject = (name: string = 'Metroidvania Odyssey'): MasonProject => {
  // Biome files
  const biomes: BiomeFile[] = INITIAL_REFINED_BIOMES.map(b => ({
    id: b.id,
    name: b.name,
    fileName: `${b.id}.biome`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    biomeData: b
  }));

  // Map files
  const map1 = createDefaultMapFile('map_ashen_outpost', 'Ashen Stronghold Outpost', 'ashen_outpost.map', 32, 24, 'mourne_ashen_steppes');
  const map2 = createDefaultMapFile('map_crystal_chasm', 'Luminescent Crystal Chasm', 'crystal_chasm.map', 36, 28, 'whispering_canopy');
  const map3 = createDefaultMapFile('map_brimstone_caldera', 'Brimstone Crucible & Vents', 'brimstone_caldera.map', 30, 24, 'brimstone_caldera');

  // Archetype files
  const archetypes: ArchetypeFile[] = DEFAULT_ARCHETYPES.map(a => ({
    id: a.id,
    name: a.name,
    fileName: `${a.id.replace('arch_', '')}.arch`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archetypeData: {
      ...a,
      assignedBehaviorFileName: 'ashen_hunter.behavior'
    }
  }));

  // Behavior files
  const behaviors: BehaviorFile[] = DEFAULT_BEHAVIORS.map(b => ({
    id: b.id,
    name: b.name,
    fileName: `${b.id.replace('beh_', '')}.behavior`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    behaviorData: b
  }));

  // Character files
  const characters: CharacterFile[] = DEFAULT_CHARACTERS.map(c => ({
    id: c.id,
    name: c.name,
    fileName: `${c.id.replace('char_', '')}.character`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterData: c
  }));

  // UI Theme files
  const uiThemes: UIThemeFile[] = DEFAULT_UI_THEMES.map(u => ({
    id: u.id,
    name: u.name,
    fileName: `${u.id}.ui`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uiConfig: u
  }));

  // Game Structure files
  const gameStructures: GameStructureFile[] = [
    {
      id: 'game_main_campaign',
      name: 'Main Campaign Framework',
      fileName: 'main_campaign.gamestructure',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      structureData: createDefaultGameStructure()
    }
  ];

  return {
    id: `proj_${Date.now()}`,
    name,
    description: '2D Metroidvania world with modular maps, biomes, archetypes, characters, behaviors, UI themes, and game structure framework.',
    author: 'Mason Architect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    engineVersion: MASON_VERSION_DISPLAY,
    activeModule: 'maps',
    activeFiles: {
      mapFileName: 'ashen_outpost.map',
      biomeFileName: 'mourne_ashen_steppes.biome',
      archetypeFileName: 'korrath.arch',
      characterFileName: 'korrath.character',
      uiFileName: 'classic_gothic_hud.ui',
      gameStructureFileName: 'main_campaign.gamestructure',
      behaviorFileName: 'ashen_hunter.behavior'
    },
    fileSystem: {
      maps: [map1, map2, map3],
      biomes,
      archetypes,
      characters,
      ui: uiThemes,
      game: gameStructures,
      behaviors
    }
  };
};
