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

export interface MapParticleEmitter {
  id: string;
  particleSystemId: string;
  x: number; // tile coordinate x
  y: number; // tile coordinate y
  name?: string;
  enabled?: boolean;
  scale?: number;
  tintOverride?: string;
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
  particleEmitters?: MapParticleEmitter[];
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
// 3.5 BEHAVIORS, SENSORY TAGS & IFTTT RULES ENGINE (.behavior)
// ==========================================
export type SensoryTagID = 'head_eyes' | 'head_ears' | 'torso_center' | 'feet_ground' | 'hand_weapon' | 'back_weakspot' | string;

export interface SensoryTagConfig {
  tagId: SensoryTagID;
  label: string;
  offsetX: number; // px relative to center
  offsetY: number; // px relative to center
}

export interface BehaviorSkill {
  id: string;
  name: string;
  description: string;
  actionType: 'primary_attack' | 'special_ability' | 'defensive_guard' | 'passive_aura' | 'traversal';
  cooldownMs: number;
  energyCost: number;
  staminaCost: number;
  triggerInputId?: string; // Links to MappedInput ID
}

export type TriggerType = 
  | 'sight' 
  | 'sound' 
  | 'proximity' 
  | 'health' 
  | 'timer' 
  | 'state' 
  | 'collision' 
  | 'input_press' 
  | 'player_condition' 
  | 'keyboard_key' 
  | 'raw_keyboard'
  | 'raw_mouse'
  | 'raw_gamepad'
  | 'listener' 
  | 'mapped_input' 
  | 'possession' 
  | 'variable_condition' 
  | 'dialogue_trigger' 
  | 'solid_detection' 
  | 'slope_detection'
  | 'slope'
  | 'physics_state' 
  | 'on_spawn' 
  | 'spawn';

export interface SpawnTrigger {
  type: 'on_spawn' | 'spawn';
  spawnDelayMs?: number; // Optional delay in ms after instantiation before executing (default: 0)
  triggerOnce?: boolean; // Only trigger once upon instantiation (default: true)
}

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
  stateMode?: 'is_state' | 'on_enter' | 'on_exit' | 'on_transition';
  requiredState: string; // e.g. 'patrol', 'alerted', 'chase', 'combat', 'idle'
  fromState?: string; // For transition triggers e.g. 'patrol' -> 'alerted'
  toState?: string;
  transitionId?: string;
}

export interface CollisionTrigger {
  type: 'collision';
  contactType: 'cliff_edge' | 'wall_impact' | 'ground_contact' | 'enemy_contact' | 'hitbox_touch';
}

export interface InputPressTrigger {
  type: 'input_press';
  button: 'jump' | 'dash' | 'attack_primary' | 'attack_heavy' | 'interact' | 'skill_1' | 'skill_2' | 'block';
}

export interface SolidDetectionTrigger {
  type: 'solid_detection';
  direction: 'left' | 'right' | 'above' | 'below' | 'ground' | 'ceiling' | 'wall_forward' | 'wall_backward';
  detectionDistancePx?: number; // Distance in pixels to check for solids (default 2-4px)
  checkMode?: 'touching' | 'near' | 'clear' | 'ledge_ahead'; // touching = directly colliding, near = within distance, clear = no solids, ledge_ahead = solid below ahead
}

export interface SlopeDetectionTrigger {
  type: 'slope_detection' | 'slope';
  slopeCondition?: 
    | 'on_any_slope'
    | 'on_floor_ramp'
    | 'on_ceiling_slope'
    | 'ascending_slope'
    | 'descending_slope'
    | 'slope_up_right'
    | 'slope_up_left'
    | 'slope_down_right'
    | 'slope_down_left'
    | 'facing_uphill'
    | 'facing_downhill'
    | 'no_slope';
  contactLocation?: 'feet' | 'head' | 'ahead' | 'any';
  detectionDistancePx?: number;
}

export interface PhysicsStateTrigger {
  type: 'physics_state';
  stateKind: 
    | 'jump_peak'               // Vertical velocity near zero at apex of jump
    | 'falling'                 // Pulled down by gravity (vy > 0)
    | 'rising'                  // Ascending upward (vy < 0)
    | 'grounded'                // Standing on solid floor
    | 'airborne'                // Free falling or leaping in air
    | 'wall_sliding'            // Clinging / sliding on vertical wall
    | 'moving_horizontally'     // Horizontal speed |vx| > threshold
    | 'stopped'                 // Zero velocity / at rest
    | 'weightless_environment'  // Low/zero gravity zone or underwater/space
    | 'high_velocity'           // Moving faster than nominal terminal threshold
    | 'direction_change';       // Swapped moving direction
  velocityThreshold?: number;   // Optional numerical threshold (e.g. min vy or vx)
}

export interface KeyboardKeyTrigger {
  type: 'keyboard_key' | 'raw_keyboard';
  key: string;
  triggerMode?: 'press' | 'tap' | 'hold' | 'release';
  requireShift?: boolean;
  requireCtrl?: boolean;
  requireAlt?: boolean;
}

export interface RawKeyboardTrigger {
  type: 'raw_keyboard';
  key: string;
  triggerMode?: 'press' | 'tap' | 'hold' | 'release';
  requireShift?: boolean;
  requireCtrl?: boolean;
  requireAlt?: boolean;
}

export interface RawMouseTrigger {
  type: 'raw_mouse';
  button?: 'left' | 'right' | 'middle' | 'button_4' | 'button_5' | 'any';
  action?: 'press' | 'hold' | 'release' | 'wheel_up' | 'wheel_down' | 'move' | 'hover';
  targetArea?: 'anywhere' | 'on_prefab' | 'screen_left_half' | 'screen_right_half';
}

export interface RawGamepadTrigger {
  type: 'raw_gamepad';
  gamepadIndex?: 'any' | 0 | 1 | 2 | 3;
  inputType?: 'button' | 'stick_axis' | 'trigger_axis';
  button?: 
    | 'button_a' 
    | 'button_b' 
    | 'button_x' 
    | 'button_y' 
    | 'left_bumper' 
    | 'right_bumper' 
    | 'left_trigger' 
    | 'right_trigger' 
    | 'select_back' 
    | 'start_pause' 
    | 'left_stick_click' 
    | 'right_stick_click' 
    | 'dpad_up' 
    | 'dpad_down' 
    | 'dpad_left' 
    | 'dpad_right' 
    | 'home_guide'
    | 'any';
  buttonMode?: 'press' | 'hold' | 'release';
  axis?: 'left_stick_x' | 'left_stick_y' | 'right_stick_x' | 'right_stick_y' | 'left_trigger' | 'right_trigger';
  axisDirection?: 'positive' | 'negative' | 'any_movement' | 'greater_than' | 'less_than';
  axisThreshold?: number;
}

export interface ListenerTrigger {
  type: 'listener';
  channelTag: string; // Channel or event tag e.g. 'boss_phase_2', 'alarm_triggered'
  filterSource?: string;
}

export interface MappedInputTrigger {
  type: 'mapped_input';
  inputId: string; // e.g. 'jump', 'dash', 'interact', 'move_left', 'move_right', 'attack'
  inputName?: string;
  triggerMode?: 'press' | 'tap' | 'hold' | 'release' | 'combo';
  triggerModeOverride?: 'press' | 'tap' | 'hold' | 'release' | 'combo';
  key?: string;
}

export interface PlayerConditionTrigger {
  type: 'player_condition';
  condition: 'is_grounded' | 'is_airborne' | 'is_wall_sliding' | 'low_stamina' | 'low_health' | 'staggered';
}

export interface PossessionTrigger {
  type: 'possession';
  event: 'on_possess' | 'on_unpossess' | 'on_spawn';
}

export interface VariableConditionTrigger {
  type: 'variable_condition';
  variableId: string;
  comparator: 'less_than' | 'less_or_equal' | 'equals' | 'greater_or_equal' | 'greater_than' | 'not_equals';
  value: any;
}

export interface DialogueTrigger {
  type: 'dialogue_trigger';
  triggerMode: 'on_interact' | 'on_approach' | 'on_leave';
}

export type BehaviorTrigger = 
  | SightTrigger 
  | SoundTrigger 
  | ProximityTrigger 
  | HealthTrigger 
  | TimerTrigger 
  | StateTrigger 
  | CollisionTrigger 
  | InputPressTrigger 
  | PlayerConditionTrigger 
  | KeyboardKeyTrigger 
  | RawKeyboardTrigger
  | RawMouseTrigger
  | RawGamepadTrigger
  | ListenerTrigger 
  | MappedInputTrigger
  | PossessionTrigger
  | VariableConditionTrigger
  | DialogueTrigger
  | SolidDetectionTrigger
  | SlopeDetectionTrigger
  | PhysicsStateTrigger
  | SpawnTrigger;

export type ActionType = 
  | 'none' 
  | 'move' 
  | 'ai_action'
  | 'attack' 
  | 'state_change' 
  | 'emit_signal' 
  | 'animation' 
  | 'set_frame'
  | 'set_random_frame'
  | 'camera' 
  | 'hero_impulse' 
  | 'variable_modify' 
  | 'math_operation'
  | 'set_gravity' 
  | 'set_traversal_angle'
  | 'audio' 
  | 'dialogue'
  | 'spawn_particles';

export interface BehaviorAction {
  id: string;
  actionType: ActionType;
  // Manual Kinematic Move Modes
  moveMode?: 
    | 'move_left' 
    | 'move_right' 
    | 'move_up' 
    | 'move_down' 
    | 'move_angle' 
    | 'move_forward' 
    | 'move_backward' 
    | 'set_velocity' 
    | 'add_velocity' 
    | 'stop' 
    | 'stop_x' 
    | 'stop_y' 
    | 'crouch' 
    | 'duck'
    | 'towards_target' 
    | 'away_from_target' 
    | 'ground_patrol' 
    | 'flying_sine' 
    | string;
  speed?: number;
  speedSource?: 'fixed' | 'variable';
  speedVariableId?: string;
  angleDeg?: number;
  velocityX?: number;
  velocityY?: number;
  velocityXSource?: 'fixed' | 'variable';
  velocityYSource?: 'fixed' | 'variable';
  velocityXVariableId?: string;
  velocityYVariableId?: string;
  setFacing?: 'none' | 'left' | 'right' | 'match_movement' | 'reverse';
  maxDescendSpeed?: number;
  descendRate?: number;
  isDucking?: boolean;
  crouch?: boolean;
  capsuleHeightMultiplier?: number;

  // AI & Automation Actions
  aiMode?: 'ground_patrol' | 'towards_target' | 'away_from_target' | 'flight_sine' | 'wander' | 'circle_target';
  patrolTurnOnWall?: boolean;
  patrolTurnOnLedge?: boolean;
  sineFrequency?: number;
  sineAmplitude?: number;

  attackType?: 'melee_slash' | 'fire_projectile' | 'charge_dash' | 'guard';
  telegraphWindupMs?: number;
  targetState?: string;
  signalType?: 'emit_sound' | 'alert_icon' | 'call_allies';
  signalRadiusPx?: number;
  animState?: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hurt' | 'death' | string;
  
  // Frame Action Configuration (Set Frame / Random Frame in Range)
  frameMode?: 'fixed' | 'random_range' | 'random_all' | 'variable';
  targetAnimationState?: string; // target animation state e.g. 'idle', 'walk', '*' for active
  targetFrameIndex?: number; // for 'fixed' mode (e.g. 0, 1, 4)
  minFrameIndex?: number; // for 'random_range' mode (e.g. 0)
  maxFrameIndex?: number; // for 'random_range' mode (e.g. 7)
  frameVariableId?: string; // for 'variable' mode
  pauseOnFrame?: boolean; // freeze/pause on this frame (default: true)
  targetVisualScope?: 'prefab_sprite' | 'composite_part' | 'all';
  compositePartId?: string; // optional composite part id

  cameraMode?: 'focus_target' | 'zoom_in' | 'shake' | 'track_self';
  cameraZoom?: number;
  cameraSmoothing?: number;
  cameraLookAheadX?: number;
  cameraLookAheadY?: number;
  cameraShakeIntensity?: number;
  impulseType?: 'jump' | 'dash' | 'wall_jump' | 'ground_slam' | 'knockback' | 'custom_vector';
  force?: number;
  forceSource?: 'fixed' | 'variable';
  forceVariableId?: string;
  wallJumpForceX?: number;
  wallJumpForceY?: number;
  
  // Variable Modification & Math Operations
  variableId?: string;
  variableScope?: 'prefab' | 'local';
  localVariableName?: string;
  variableOp?: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'power' | 'min' | 'max' | 'clamp' | 'abs' | 'round' | 'floor' | 'ceil' | 'negate' | 'lerp' | 'random_range' | 'toggle';
  mathOp?: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'power' | 'min' | 'max' | 'clamp' | 'abs' | 'round' | 'floor' | 'ceil' | 'negate' | 'lerp' | 'random_range' | 'toggle';
  variableValue?: any;
  operandASource?: 'constant' | 'variable';
  operandAVariableId?: string;
  operandAConstant?: number;
  operandBSource?: 'constant' | 'variable';
  operandBVariableId?: string;
  operandBConstant?: number;
  clampMin?: number;
  clampMax?: number;
  clampMinSource?: 'constant' | 'variable';
  clampMinVariableId?: string;
  clampMaxSource?: 'constant' | 'variable';
  clampMaxVariableId?: string;
  lerpT?: number;
  lerpFactorT?: number;
  lerpTSource?: 'constant' | 'variable';
  lerpTVariableId?: string;

  // Gravity Override (Overrides active Biome gravity)
  gravityScale?: number;
  gravityMode?: 'custom' | 'zero_g' | 'low_g' | 'normal' | 'heavy_g' | 'inverted' | 'reset_to_biome';
  gravitySource?: 'fixed' | 'variable';
  gravityVariableId?: string;

  // Traversal & Slope Angle Configuration
  traversalAngleDeg?: number; // Allowed slope traversal angle in degrees (0° to 90°)
  traversalAngleSource?: 'fixed' | 'variable';
  traversalAngleVariableId?: string;
  traversalMode?: 'slope_and_stairs' | 'slope_only' | 'flat_only' | 'all_angles' | 'custom';
  steepSlopeBehavior?: 'block' | 'slide_down' | 'slow_down';
  steepSlideSpeed?: number;
  allowCeilingTraversal?: boolean;
  stepHeightPx?: number;

  soundCue?: string;
  volume?: number;
  dialogueText?: string;
  speakerName?: string;
  // Particle Systems Spawning
  particleSystemId?: string;
  particleCount?: number;
  particleSpawnLocation?: 'self' | 'target' | 'ground' | 'socket' | 'custom_offset';
  particleSocketId?: string;
  particleOffsetX?: number;
  particleOffsetY?: number;
  delayMs?: number; // Delay in milliseconds before executing this action
}

export interface BehaviorRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: BehaviorTrigger;
  triggers?: BehaviorTrigger[];
  triggerLogic?: 'AND' | 'OR';
  executionMode?: 'simultaneous' | 'sequential'; // 'simultaneous' (default: all at once) or 'sequential' (in order)
  stepDelayMs?: number; // Delay in milliseconds between consecutive actions when in sequential mode
  localVariables?: Array<{
    id: string;
    name: string;
    defaultValue?: any;
    type?: 'number' | 'string' | 'boolean';
  }>;
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

export interface BehaviorVariable {
  id: string;
  name: string;
  category: 'attribute' | 'proficiency' | 'setting' | string;
  type: 'number' | 'string' | 'boolean' | 'enum';
  options?: string[]; // Used if type is enum
  isStatic: boolean;
  defaultValue: any;
  value?: any;
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
  skills?: BehaviorSkill[]; // Added for combat/abilities configuration
  exposedVariables?: BehaviorVariable[]; // Variables dictated to the linked Prefab
  foci: CameraFocusConfig;
  movement: MovementControllerConfig;
  ai: EnemyAIConfig;
  
  // Prefab Category-Specific Behavior Configurations
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
// 3.6 PREFAB CREATOR & ANIMATION FILE (.prefab)
// ==========================================
export type PrefabPartType = 'sprite' | 'particle' | 'light' | 'collider';
export type PrefabLayerTarget = 'background' | 'ground' | 'objects' | 'overlay' | 'foreground' | 'custom';

export interface PrefabPartBase {
  id: string;
  name: string;
  type: PrefabPartType;
  offsetX: number;
  offsetY: number;
  rotationDeg?: number;
  scale?: number;
  targetLayer: PrefabLayerTarget;
  zOrder: number; // e.g. -5 (behind base), 0 (base level), +5 (in front of base)
  visible: boolean;
  opacity?: number; // 0.0 - 1.0
  flipX?: boolean;
  flipY?: boolean;
  socketTagId?: string; // If bound to a named socket anchor (e.g. 'hand_weapon', 'head_eyes')
}

export interface PrefabSpritePart extends PrefabPartBase {
  type: 'sprite';
  spritesheetId?: string;
  frameIndex?: number;
  isAnimated?: boolean; // false if static frame or non-animated sprite
  spawnFrameMode?: 'first' | 'random' | 'fixed' | 'sequential'; // How to pick frame on spawn
  fixedFrameIndex?: number;
  animationStateId?: string;
  syncWithBaseAnimation?: boolean; // When true, matches current base animation state & frame
  tintColor?: string;
  blendMode?: 'source-over' | 'screen' | 'multiply' | 'additive' | 'overlay';
  ySorting?: boolean; // Dynamic top-down Y-depth sorting
}

export interface PrefabParticlePart extends PrefabPartBase {
  type: 'particle';
  particleFile?: string; // e.g. "campfire_flames.particle"
  particleSystemId?: string;
  rateMultiplier?: number;
  scaleMultiplier?: number;
  autoPlay?: boolean;
  isBehind?: boolean;
}

export interface PrefabLightPart extends PrefabPartBase {
  type: 'light';
  color: string; // e.g. '#ff9922'
  radius: number; // in pixels, e.g. 120
  intensity: number; // 0.0 - 2.0
  pulseSpeed?: number; // Hz, e.g. 1.5
  pulseAmount?: number; // 0.0 - 0.5
  castShadows?: boolean;
}

export interface PrefabColliderPart extends PrefabPartBase {
  type: 'collider';
  shape: 'box' | 'circle' | 'capsule' | 'polygon';
  isSolid: boolean; // Blocks hero / mob physics
  isTrigger: boolean; // Triggers interaction / damage zones
  width?: number;
  height?: number;
  radius?: number;
  vertices?: PolygonHitboxVertex[];
}

export type PrefabPart = PrefabSpritePart | PrefabParticlePart | PrefabLightPart | PrefabColliderPart;

export interface PrefabEquipmentSlot {
  id: string;
  name: string;
  socketTagId: SensoryTagID | string; // e.g. 'hand_weapon', 'torso_center'
  allowedPartTypes: PrefabPartType[];
  defaultPartId?: string;
  icon?: string;
}

export interface PrefabVariant {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  activePartIds: string[]; // List of enabled part IDs for this variant
  partOverrides?: Record<string, Partial<PrefabPart>>; // Overrides for specific parts
}

export interface PrefabSocket {
  tagId: SensoryTagID; // e.g. 'head_eyes', 'head_ears', 'torso_center', 'feet_ground', 'hand_weapon'
  label: string;
  offsetX: number; // px relative to center
  offsetY: number; // px relative to center
  visualMarkerColor?: string;
}

// ==========================================
// 3.6.1 2D BONES & INVERSE KINEMATICS (IK) SCHEMA
// ==========================================
export interface PrefabBone {
  id: string;
  name: string;
  parentBoneId?: string | null; // null/undefined for root / independent bone
  length: number; // Bone length in pixels (e.g. 24px)
  localAngleDeg: number; // Relative angle to parent in degrees (-180 to 180)
  color?: string; // Visual color for bone diamond rendering
  width?: number; // Visual thickness on canvas (e.g. 6)
  minAngleDeg?: number; // Minimum rotation constraint (-180 to 180)
  maxAngleDeg?: number; // Maximum rotation constraint (-180 to 180)
  attachedPartId?: string; // Bound composite part ID (from char.parts)
  attachedSpriteFileName?: string; // Optional direct sprite / image link
  partOffsetPx?: { x: number; y: number }; // Offset of the sprite part relative to bone
  partRotationOffsetDeg?: number; // Rotation offset of sprite relative to bone
  inheritScale?: boolean;
}

export interface PrefabIKTarget {
  id: string;
  name: string;
  chainRootBoneId: string; // Top ancestor bone of the IK chain
  endEffectorBoneId: string; // Tip bone of the IK chain
  targetX: number; // Current IK goal X in local space (relative to prefab origin)
  targetY: number; // Current IK goal Y in local space (relative to prefab origin)
  poleVectorX?: number; // Optional bend direction hint / pole vector
  poleVectorY?: number;
  flipBend?: boolean; // Flip knee / elbow bend direction in 2-bone analytical IK
  maxIterations?: number; // For CCD / FABRIK multi-bone solver (default 15)
  weight?: number; // 0.0 to 1.0
  enabled: boolean;
  color?: string;
}

export interface PrefabBoneKeyframe {
  id?: string;
  frameIndex: number;
  timeMs?: number;
  name?: string;
  boneRotations: Record<string, number>; // boneId -> localAngleDeg
  ikPositions?: Record<string, { x: number; y: number; flipBend?: boolean }>; // ikId -> {x, y, flipBend}
}

export interface PrefabBoneAnimationTrack {
  id: string;
  name: string;
  durationFrames: number;
  frameRateFps: number;
  loop: boolean;
  keyframes: PrefabBoneKeyframe[];
}

export interface PrefabSkeleton {
  rootX: number;
  rootY: number;
  bones: PrefabBone[];
  ikTargets: PrefabIKTarget[];
  animationTracks?: PrefabBoneAnimationTrack[];
  activeTrackId?: string;
}

export interface PrefabSpritesheet {
  id: string;
  name: string;
  dataUrl?: string; // base64 or data URL for uploaded image
  imageUrl?: string; // optional image URL / asset link
  imageWidth?: number; // total image width in px (e.g. 512)
  imageHeight?: number; // total image height in px (e.g. 256)
  splitMode?: 'pixels' | 'columns'; // 'pixels' (tileWidth/tileHeight) or 'columns' (cols/rows)
  tileWidth: number; // e.g., 64
  tileHeight: number; // e.g., 64
  cols: number; // grid columns e.g. 8
  rows: number; // grid rows e.g. 4
  totalFrames: number; // total cells e.g. 32
}

export interface PrefabNamedPoint {
  id: string;
  name: string;
  color?: string;
  tagId?: string;
  defaultOffsetX: number;
  defaultOffsetY: number;
}

export interface PolygonHitboxVertex {
  x: number;
  y: number;
}

export interface PrefabNamedPolygon {
  id: string;
  name: string;
  type: 'hurtbox' | 'hitbox' | 'shield' | 'trigger';
  color?: string;
  defaultVertices: PolygonHitboxVertex[];
}

export interface PointAnchorFrameData {
  pointId: string;
  enabled: boolean;
  x: number;
  y: number;
}

export interface PolygonHitboxFrameData {
  polygonId: string;
  enabled: boolean;
  vertices: PolygonHitboxVertex[];
}

export interface FrameKeyframeData {
  frameIndex: number; // grid index on the spritesheet (e.g. 0..31)
  points: PointAnchorFrameData[];
  polygons: PolygonHitboxFrameData[];
  capsule?: PrefabCapsuleConfig;
  motionBlur?: boolean; // Toggles motion blur rendering for this keyframe
}

export interface PrefabAnimationConfig {
  stateId: string; // 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hurt' | 'death'
  label: string;
  spritesheetId: string;
  startFrameIndex: number;
  endFrameIndex: number;
  frameRateFps: number;
  loop: boolean;
  isAnimated?: boolean; // false if static single frame or non-animated prop
  spawnFrameMode?: 'first' | 'random' | 'fixed' | 'sequential'; // How to determine frame on spawn
  fixedFrameIndex?: number;
  soundCue?: string;
  keyframes?: FrameKeyframeData[];
}

export interface PrefabCapsuleConfig {
  radius: number; // e.g., 16
  height: number; // e.g., 48
  offsetX: number;
  offsetY: number;
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

export interface PrefabStateNode {
  id: string; // e.g. 'st_idle', 'st_patrol'
  name: string; // e.g. 'Idle', 'Patrol', 'Chase', 'Combat', 'Stunned', 'Flee'
  color?: string; // hex color e.g. '#38bdf8'
  x: number; // graph node x position
  y: number; // graph node y position
  isInitial?: boolean; // starting default state
  description?: string;
}

export interface PrefabStateTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  isBidirectional?: boolean; // One-way (false) or both-ways (true)
  triggerLabel?: string; // e.g. 'See Player', 'Lost Target', 'Low HP'
  behaviorRuleId?: string; // Linked behavior rule ID if behavior condition
  conditionType?: 'none' | 'behavior' | 'custom';
}

export interface PrefabStateMachine {
  initialStateId?: string;
  states: PrefabStateNode[];
  transitions: PrefabStateTransition[];
}

export interface PrefabData {
  id: string;
  name: string;
  title?: string;
  backstory?: string;
  prefabType: 'player_hero' | 'enemy_mob' | 'boss_archon' | 'friendly_npc' | 'environmental_prop';
  avatarIcon: string;
  spriteWidth: number;
  spriteHeight: number;
  tintColor: string;
  baseScale: number;

  attachedParticles?: {
    particleSystemId: string;
    offsetX: number;
    offsetY: number;
    isBehind: boolean;
    enabled: boolean;
  }[];

  // Variables & Attributes
  variables?: BehaviorVariable[];
  behaviorVariables?: Record<string, any>; // Stored values / overrides for variables

  // Bespoke IFTTT Rule Engine & AI Logic
  rules?: BehaviorRule[];
  states?: string[];
  stateMachine?: PrefabStateMachine;
  movement?: MovementControllerConfig;
  ai?: EnemyAIConfig;

  // Visual Prefab Creator Fields
  capsule?: PrefabCapsuleConfig;
  spritesheets?: PrefabSpritesheet[];
  points?: PrefabNamedPoint[];
  polygons?: PrefabNamedPolygon[];
  animations: PrefabAnimationConfig[];

  // Composite Parts, Sockets, Equipment & Variants
  parts?: PrefabPart[];
  skeleton?: PrefabSkeleton;
  equipmentSlots?: PrefabEquipmentSlot[];
  variants?: PrefabVariant[];
  activeVariantId?: string;

  // Sensory Sockets & Dialogue
  sockets: PrefabSocket[];
  dialogueGreeting?: string;

  // Legacy fields for backward compatibility
  baseStats?: {
    health: number;
    energy: number;
    stamina: number;
    poise: number;
    speed: number;
  };
  weaponProficiencies?: string[];
  damageAffinity?: 'slashing' | 'blunt' | 'piercing' | 'fire' | 'frost' | 'lightning' | 'void' | 'kinetic';
  passivePerks?: { id: string; name: string; desc: string }[];
  linkedBehaviorId?: string;
  assignedBehaviorFileName?: string;
}

export interface PrefabFile {
  id: string;
  name: string;
  fileName: string; // e.g. "ashen_hunter.prefab"
  createdAt: string;
  updatedAt: string;
  prefabData: PrefabData;
}

// ==========================================
// 4. UI THEME FILE (.ui)
// ==========================================
export type UICornerRoundness = 'sharp' | 'subtle' | 'standard' | 'smooth' | 'pill' | 'custom';
export type UIThemePreset = 'gothic_metroidvania' | 'cyberpunk_neon' | 'pixel_16bit' | 'minimal_dark' | 'fantasy_arcane';

export interface UIThemeColors {
  primaryAccent: string;
  secondaryAccent: string;
  surfaceBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  healthColor: string;
  manaColor: string;
  staminaColor: string;
  dangerColor: string;
  goldColor: string;
}

export interface UIThemeStyling {
  preset: UIThemePreset;
  roundness: UICornerRoundness;
  customRadiusPx: number; // 0-32px
  borderWidthPx: number; // 0-4px
  borderGlow: boolean;
  panelBackdropBlur: number; // 0-24px
  panelOpacityPercent: number; // 50-100%
  fontFamily: 'default' | 'pixel' | 'serif_gothic' | 'mono_scifi' | 'sans_modern';
  fontScale: number; // 0.8 - 1.4
  colors: UIThemeColors;
  animations: {
    buttonHoverScale: number; // 1.0 - 1.15
    buttonClickDepthPx: number; // 0 - 6px
    panelTransition: 'slide_horizontal' | 'slide_vertical' | 'fade_scale' | 'flip_3d' | 'instant';
    transitionDurationMs: number; // 150 - 600ms
    glowPulseEnabled: boolean;
    shimmerEffect: boolean;
  };
}

export interface UISplashScreenConfig {
  gameTitle: string;
  gameSubtitle: string;
  studioName: string;
  pressPromptText: string; // e.g. "PRESS ANY BUTTON TO ENTER"
  showStudioLogo: boolean;
  logoIcon: string; // e.g. '⚔️', '👁️', '⚡', or custom image url
  versionText: string; // e.g. "v1.0.0 Alpha Build"
  promptBlinkSpeedMs: number; // 800ms
  backgroundTint: string;
  backgroundParticleEffect: 'embers' | 'digital_rain' | 'dust_motes' | 'snow' | 'none';
}

export interface UIMenuButtonConfig {
  id: string;
  label: string;
  action: 'start_game' | 'load_game' | 'inventory' | 'options' | 'credits' | 'quit' | 'custom';
  icon?: string;
  badge?: string;
  isPrimary?: boolean;
}

export interface UIMainMenuConfig {
  alignment: 'left' | 'center' | 'right' | 'card_window';
  buttons: UIMenuButtonConfig[];
  showVersionStamp: boolean;
  bannerHeadline: string;
  showDifficultySelector: boolean;
  selectedButtonIndex: number;
}

export interface UIPauseMenuConfig {
  title: string;
  buttons: UIMenuButtonConfig[];
  showStatsSummary: boolean;
  backdropBlurAmount: number;
  pauseGameEngine: boolean;
}

export interface UIInventoryScreenConfig {
  gridCols: number; // 4, 5, 6
  gridRows: number; // 3, 4, 5
  showPaperdoll: boolean;
  equipmentSlots: {
    slotId: string;
    label: string;
    icon: string;
    category: 'weapon' | 'armor' | 'relic' | 'trinket' | 'boots';
  }[];
  categoryTabs: { id: string; label: string; icon: string }[];
  showStatSummary: boolean;
  showGoldCounter: boolean;
  currencyName: string;
}

export type UIButtonActionType = 'navigate_menu' | 'close_menu' | 'start_game' | 'resume_game' | 'quit_game' | 'custom_event';

export interface UICustomWidget {
  id: string;
  name: string;
  type: 'button' | 'text' | 'input_field' | 'image' | 'progress_bar' | 'slider' | 'toggle' | 'card' | 'badge';
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Text & Content
  text?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'password';
  icon?: string;
  badge?: string;
  isPrimary?: boolean;
  
  // Visual Styles
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  
  // Numerical & State Values
  value?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
  checked?: boolean;
  imageUrl?: string;
  animationTrigger?: 'on_click_slide' | 'on_hover_grow' | 'pulse' | 'none';
  
  // Button Actions & Navigation
  action?: UIButtonActionType;
  targetMenuId?: string; // ID of the target menu to open
  pauseAction?: 'none' | 'pause' | 'unpause' | 'toggle_pause'; // Pause/unpause behavior on click
  customEventName?: string;
}

export interface UIMenuScreen {
  id: string;
  name: string; // e.g. "Start Menu", "Pause Menu", "Options", "Inventory"
  description?: string;
  isInitialScreen?: boolean;
  isPauseMenu?: boolean;
  isOverlay?: boolean;
  backdropBlur?: number; // 0-24px
  backgroundColor?: string;
  widgets: UICustomWidget[];
}

export interface UICustomCanvasConfig {
  name: string;
  widgets: UICustomWidget[];
}

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

export interface InputMapping {
  id: string;
  name: string; // e.g. 'jump', 'dash', 'attack_primary', 'interact', 'block', 'pause_menu'
  label: string; // e.g. 'Jump / Ascent', 'Pause System Menu'
  category?: string; // e.g. 'movement', 'combat', 'interaction', 'navigation', or custom string
  triggerMode: 'press' | 'tap' | 'hold' | 'toggle' | 'release' | 'double_tap' | 'combo';
  holdDurationMs?: number;
  keys: string[]; // e.g. ['Space', 'KeyW']
  gamepadButtons?: string[]; // e.g. ['ButtonSouth', 'LeftBumper']
  comboKeys?: string[];
  actionType?: 'gameplay_action' | 'open_ui';
  targetUiMenuId?: string; // ID of the UI menu screen to open (or 'pause_menu', 'initial_menu')
}

export const UNIFIED_INPUT_TEMPLATE: InputMapping[] = [
  // Movement
  { id: 'inp_jump', name: 'jump', label: 'Jump / Leap', category: 'movement', triggerMode: 'press', actionType: 'gameplay_action', keys: ['Space', 'KeyW', 'ArrowUp'], gamepadButtons: ['ButtonSouth / A'] },
  { id: 'inp_move_left', name: 'move_left', label: 'Move Left', category: 'movement', triggerMode: 'hold', actionType: 'gameplay_action', keys: ['KeyA', 'ArrowLeft'], gamepadButtons: ['D-Pad Left', 'L-Stick Left'] },
  { id: 'inp_move_right', name: 'move_right', label: 'Move Right', category: 'movement', triggerMode: 'hold', actionType: 'gameplay_action', keys: ['KeyD', 'ArrowRight'], gamepadButtons: ['D-Pad Right', 'L-Stick Right'] },
  { id: 'inp_crouch', name: 'crouch', label: 'Crouch / Drop Down', category: 'movement', triggerMode: 'hold', actionType: 'gameplay_action', keys: ['KeyS', 'ArrowDown'], gamepadButtons: ['D-Pad Down', 'L-Stick Down'] },
  { id: 'inp_dash', name: 'dash', label: 'Air / Ground Dash', category: 'movement', triggerMode: 'tap', actionType: 'gameplay_action', keys: ['ShiftLeft', 'KeyC'], gamepadButtons: ['ButtonEast / B'] },
  { id: 'inp_wall_slide', name: 'wall_slide', label: 'Wall Slide / Cling', category: 'movement', triggerMode: 'hold', actionType: 'gameplay_action', keys: ['KeyA', 'KeyD'], gamepadButtons: ['L-Stick'] },
  
  // Combat
  { id: 'inp_attack', name: 'attack', label: 'Primary Attack / Strike', category: 'combat', triggerMode: 'press', actionType: 'gameplay_action', keys: ['KeyJ', 'KeyZ'], gamepadButtons: ['ButtonWest / X'] },
  { id: 'inp_special', name: 'special_attack', label: 'Secondary / Special Skill', category: 'combat', triggerMode: 'press', actionType: 'gameplay_action', keys: ['KeyK', 'KeyX'], gamepadButtons: ['ButtonNorth / Y'] },
  { id: 'inp_block', name: 'block', label: 'Shield Guard / Parry', category: 'combat', triggerMode: 'hold', holdDurationMs: 0, actionType: 'gameplay_action', keys: ['KeyL', 'KeyV'], gamepadButtons: ['LeftBumper / LB'] },
  { id: 'inp_cast_spell', name: 'cast_spell', label: 'Cast Magic / Ranged', category: 'combat', triggerMode: 'press', actionType: 'gameplay_action', keys: ['KeyU', 'KeyQ'], gamepadButtons: ['RightTrigger / RT'] },
  
  // Interaction
  { id: 'inp_interact', name: 'interact', label: 'Interact / Talk / Inspect', category: 'interaction', triggerMode: 'hold', holdDurationMs: 300, actionType: 'gameplay_action', keys: ['KeyE', 'KeyF'], gamepadButtons: ['RightBumper / RB'] },
  { id: 'inp_use_item', name: 'use_item', label: 'Use Consumable / Potion', category: 'interaction', triggerMode: 'press', actionType: 'gameplay_action', keys: ['KeyR', 'Digit1'], gamepadButtons: ['D-Pad Up'] },
  
  // Navigation & System (Includes UI triggers)
  { id: 'inp_inventory', name: 'inventory', label: 'Inventory / Equipment', category: 'navigation', triggerMode: 'press', actionType: 'open_ui', targetUiMenuId: 'menu_inventory', keys: ['KeyI', 'Tab'], gamepadButtons: ['Select / Back'] },
  { id: 'inp_map', name: 'map_tracker', label: 'World Map Tracker', category: 'navigation', triggerMode: 'press', actionType: 'open_ui', targetUiMenuId: 'menu_world_map', keys: ['KeyM'], gamepadButtons: ['Select'] },
  { id: 'inp_pause', name: 'pause_menu', label: 'Pause / System Menu', category: 'navigation', triggerMode: 'press', actionType: 'open_ui', targetUiMenuId: 'pause_menu', keys: ['Escape'], gamepadButtons: ['Start'] }
];

export interface UIConfigData {
  id: string;
  name: string;
  themeName: string;
  initialMenuId?: string;
  pauseMenuId?: string;
  menus: UIMenuScreen[];
  styling?: UIThemeStyling;
  splashScreen?: UISplashScreenConfig;
  mainMenu?: UIMainMenuConfig;
  pauseMenu?: UIPauseMenuConfig;
  inventoryScreen?: UIInventoryScreenConfig;
  customCanvas?: UICustomCanvasConfig;
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
  inputMappings?: InputMapping[];
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
  transitionType?: 'door' | 'portal' | 'seamless' | 'teleporter' | 'elevator' | 'zone';
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
  defaultPrefabFileName: string; // Starting player class
  attachedUiFileName: string; // Active HUD/UI configuration
  
  // Game framework configs
  mainMenu: MainMenuConfig;
  loadingScreen: LoadingScreenConfig;
  pauseMenu: PauseMenuConfig;
  progressionFlags: ProgressionFlag[];
  worldGraphLinks: WorldGraphLink[];
  graphNodes?: { mapFileName: string; x: number; y: number }[];
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
// 5.5 PARTICLE SYSTEMS (.particle)
// ==========================================
export type ParticleEmitterShape = 'point' | 'box' | 'circle' | 'cone' | 'line' | 'ring';
export type ParticleShape = 'glow_circle' | 'spark_line' | 'ember' | 'smoke_puff' | 'star' | 'diamond' | 'ring' | 'square' | 'pixel_square' | 'bubble' | 'custom_glyph' | 'svg_path' | 'spritesheet';
export type ParticleBlendMode = 'source-over' | 'lighter' | 'screen' | 'multiply';
export type ParticleCurveMode = 'balanced' | 'linear' | 'quick_in_long_out' | 'long_in_quick_out' | 'bell_arch' | 'burst_decay' | 'constant' | 'grow' | 'shrink' | 'bell' | 'burst_shrink';
export type ParticleSizeCurve = ParticleCurveMode;
export type ParticleFxStyle = 'default' | 'pulse_oscillate' | 'flicker_shimmer' | 'orbit_swirl' | 'spark_crackle';
export type ParticleEmissiveMode = 'glow_only' | 'light_up_area';
export type ParticleAnimStyle = 'one_shot' | 'oscillate' | 'repeat';

export interface ParticleEmitterConfig {
  shape: ParticleEmitterShape;
  width: number;       // For box / line / circle / ring / cone (px)
  height: number;      // For box / circle / ring / cone (px)
  radius: number;      // Legacy / fallback for circle / ring / cone (px)
  rotationDeg?: number;// Rotation angle for emitter shapes except point (0-360 deg)
  emissionRate: number;// particles per second (e.g. 20-200)
  emissionRateMin?: number;
  emissionRateMax?: number;
  maxParticles: number;// e.g. 50-1000
  duration: number;    // emitter lifetime in seconds (0 = infinite / looping)
  loop: boolean;
  burstCount: number;  // Particles spawned on burst trigger
  burstCountMin?: number;
  burstCountMax?: number;
  burstInterval: number; // Seconds between periodic bursts (0 = disabled)
  burstIntervalMin?: number;
  burstIntervalMax?: number;
  isContinuous: boolean; // Continuous stream vs trigger-only
  burstEnabled?: boolean;
  animateEmitterWidth?: boolean;
  animateEmitterHeight?: boolean;
  animateEmitterRotation?: boolean;
  animateEmissionRate?: boolean;
  animateBurstCount?: boolean;
  animateBurstInterval?: boolean;
}

export interface ParticleKinematicsConfig {
  minSpeed: number;
  maxSpeed: number;
  angleDeg: number;       // 0 to 360 (0 = right, 90 = down, 180 = left, 270 = up)
  spreadDeg: number;      // 0 to 360
  gravityScale?: number;  // Standardized Gravity Scale matching Biomes & Prefabs (1.0 = Standard 1.0G Earth Gravity, 0.0 = Zero-G, -0.05 = Thermal Buoyancy)
  gravityScaleX?: number; // Optional horizontal gravity/drift scale (-1.0 to 1.0G)
  gravityX: number;       // legacy/computed acceleration X (px/s^2)
  gravityY: number;       // legacy/computed acceleration Y (px/s^2, positive = down)
  windSensitivity?: number; // 0.0 to 2.0 (Sensitivity to Biome Environmental Wind, 1.0 = 100%)
  drag: number;           // air resistance 0.0 to 1.0 (e.g. 0.98)
  startDrag?: number;     // 3-keyframe air drag setup (e.g. 0.98)
  startDragMax?: number;  // Optional max range for random start drag
  midDrag?: number;       // Optional 50% keyframe air drag
  midDragMax?: number;    // Optional max range for random mid drag
  endDrag?: number;       // 3-keyframe end air drag
  endDragMax?: number;    // Optional max range for random end drag
  dragCurve?: ParticleCurveMode; // Drag lifecycle curve
  

  windForce: number;      // legacy horizontal wind drift
  emitterPull?: boolean;
  emitterPullRadius?: number;
  emitterPullStrength?: number;
  emitterPullFalloff?: number;
  turbulenceJitter: number;// random velocity noise jitter
  minAngularVelocity: number; // deg/s
  maxAngularVelocity: number; // deg/s
  angularDrag: number;
}

export interface ParticleVisualsConfig {
  shape: ParticleShape;
  customGlyph?: string;   // Single prefab / emoji / icon symbol (e.g. ✦, ❄, 💧, ⚔️, 💀)
  customSvgPath?: string; // Custom vector SVG Path d="..." string
  minLifetime: number;    // seconds (e.g. 0.5)
  maxLifetime: number;    // seconds (e.g. 1.8)
  startSize: number;      // px
  startSizeMax?: number;   // Optional max range for random start size (px)
  midSize?: number;       // Optional mid lifecycle particle size (px)
  midSizeMax?: number;    // Optional max range for random mid size (px)
  endSize: number;        // px
  endSizeMax?: number;     // Optional max range for random end size (px)
  sizeCurve: ParticleSizeCurve;
  alphaCurve?: ParticleCurveMode;
  startColor: string;     // Hex color e.g. #f59e0b
  startAlpha: number;     // 0.0 to 1.0
  startAlphaMax?: number; // Optional max range for random start alpha
  midColor?: string;      // Optional mid gradient color
  midAlpha?: number;
  midAlphaMax?: number;   // Optional max range for random mid alpha
  endColor: string;       // Hex color e.g. #ef4444
  endAlpha: number;       // 0.0 to 1.0
  endAlphaMax?: number;   // Optional max range for random end alpha
  blendMode: ParticleBlendMode; // 'lighter' = Additive glow, 'source-over' = Standard
  glowBlurRadius: number; // px blur / bloom (0 = crisp, 4-20 = glowing)
  fxStyle?: ParticleFxStyle; // Behavioral modulation style preset
  isEmissive?: boolean; // Toggles emissive light casting & glow
  emissiveMode?: ParticleEmissiveMode; // 'glow_only' vs 'light_up_area'
  emissiveStartColor?: string;
  emissiveStartStrength?: number; // 0 to 100 / radius px
  emissiveStartStrengthMax?: number;
  emissiveMidColor?: string;
  emissiveMidStrength?: number;
  emissiveMidStrengthMax?: number;
  emissiveEndColor?: string;
  emissiveEndStrength?: number;
  emissiveEndStrengthMax?: number;
  emissiveCurve?: ParticleCurveMode;
  startRotationDeg?: number; // Start lifecycle orientation angle (deg)
  startRotationDegMax?: number;
  midRotationDeg?: number; // Optional 50% keyframe orientation angle (deg)
  midRotationDegMax?: number;
  endRotationDeg?: number; // End lifecycle orientation angle (deg)
  endRotationDegMax?: number;
  rotationCurve?: ParticleCurveMode;
  sizeAnimStyle?: ParticleAnimStyle;
  colorAnimStyle?: ParticleAnimStyle;
  emissiveAnimStyle?: ParticleAnimStyle;
  rotationAnimStyle?: ParticleAnimStyle;
  animateSize?: boolean;
  animateColor?: boolean;
  animateAlpha?: boolean;
  animateEmissive?: boolean;
  animateRotation?: boolean;
  animateSpeed?: boolean;
  animateDrag?: boolean;
  animateMotionBlur?: boolean;
  startMotionBlur?: number;
  midMotionBlur?: number;
  endMotionBlur?: number;
  motionBlurAnimStyle?: ParticleAnimStyle;
  motionBlurCurve?: ParticleCurveMode;
  hasTrails?: boolean;
  trailLength?: number;
  trailWidthScale?: number;
  trailTaper?: boolean;
  trailTaperLength?: number;
  renderResolutionScale?: number; // 0.25, 0.35, 0.5, 0.75, 1.0 (Offscreen buffer resolution scale for speed)
  metaballThreshold?: number; // 20 to 180 (Gooiness connection reach cutoff)
  metaballRimThickness?: number; // 0 to 50 (Surface tension contour rim)
  metaballResolutionScale?: number; // 0.25, 0.35, 0.5 (Offscreen buffer resolution scale)
  spritesheet?: ParticleSpritesheetConfig;
  frameAnimStyle?: 'loop' | 'keyframe';
  startFrameIndex?: number;
  midFrameIndex?: number;
  endFrameIndex?: number;
  frameRateFps?: number;
  frameLoop?: boolean;
  trackNodes?: Record<string, any>;
  trackRepeats?: Record<string, number>;
}

export interface ParticleSpritesheetConfig {
  id: string;
  name: string;
  imageUrl?: string;
  dataUrl?: string;
  tileWidth: number;
  tileHeight: number;
  cols: number;
  rows: number;
  totalFrames?: number;
  splitMode?: 'columns' | 'pixels';
}

export interface ParticlePhysicsConfig {
  collideWithMapSolids: boolean; // Bounce / destroy on floor & walls
  collisionRestitution: number;  // Bounciness / Elasticity 0.0 to 1.0 (e.g. 0.5, 0.0 = sticky)
  maxBounces?: number;           // Max allowed bounces before sticking (undefined or 0 = unlimited)
  destroyOnCollision: boolean;
  spawnCollisionSparks: boolean;
  fluidSelfCollision?: boolean;
  fluidRepulsionForce?: number;
  collisionShape?: 'circle' | 'box' | 'triangle' | 'hexagon' | 'diamond' | 'custom_polygon';
  collisionOffset?: { x: number; y: number }; // Offset position (px) relative to particle center
  collisionScale?: number; // Scale factor for physics size vs visual particle size (0.1 to 3.0)
  customPolygon?: Array<{ x: number; y: number }>; // Normalized 2D polygon vertices relative to center
}

export interface ParticleSystemData {
  id: string;
  name: string;
  category: 'environmental' | 'combat' | 'magic' | 'weather' | 'ui_effects' | 'custom';
  description: string;
  icon: string;
  tintColor: string;
  emitter: ParticleEmitterConfig;
  kinematics: ParticleKinematicsConfig;
  visuals: ParticleVisualsConfig;
  physics: ParticlePhysicsConfig;
}

export interface ParticleSystemFile {
  id: string;
  name: string;
  fileName: string; // e.g. "torch_flame.particle"
  createdAt: string;
  updatedAt: string;
  particleData: ParticleSystemData;
}

// ==========================================
// 6. MASON MASTER PROJECT CONTAINER
// ==========================================
export type MasonModuleId = 'maps' | 'biomes' | 'prefabs' | 'ui' | 'gamestructure' | 'behaviors' | 'macro' | 'explorer' | 'particles' | 'sprites' | 'images';

export interface SpriteExportMetadata {
  exportMode?: 'flattened' | 'spritesheet' | 'gif' | 'layers' | string;
  targetFileName?: string;
  cols?: number;
  rows?: number;
  tileWidth?: number;
  tileHeight?: number;
  frameCount?: number;
  layerCount?: number;
  description?: string;
  updatedAt?: string;
}

export interface SpriteFile {
  id: string;
  name: string;
  fileName: string;
  createdAt?: string;
  updatedAt: string;
  spriteData?: any; // Raw JSON export from Palette Spray Studio
  imageUrl?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  exportSettings?: SpriteExportMetadata;
  linkedImageFileNames?: string[];
}

export interface ImageFile {
  id: string;
  name: string;
  fileName: string; // e.g. "player_hero.png"
  createdAt?: string;
  updatedAt: string;
  dataUrl: string; // "data:image/png;base64,..."
  width?: number;
  height?: number;
  sourceSpriteFileName?: string;
  exportSettings?: SpriteExportMetadata;
}

export interface ProjectBackupRecord {
  id: string;
  projectId: string;
  timestamp: string;
  module: MasonModuleId | 'general' | 'save';
  actionLabel: string;
  fileCountsSummary?: {
    maps: number;
    biomes: number;
    prefabs: number;
    sprites: number;
    images: number;
    behaviors: number;
  };
  projectSnapshot: MasonProject;
}

export interface FileBackupRecord {
  id: string;
  projectId: string;
  fileCategory: 'maps' | 'biomes' | 'prefabs' | 'ui' | 'game' | 'behaviors' | 'particles' | 'sprites' | 'images';
  fileName: string;
  timestamp: string;
  actionLabel: string;
  fileSnapshot: any;
  fileSizeEstimate?: number;
  isCurrent?: boolean;
}

export interface MasonFileSystem {
  maps: MapFile[];
  biomes: BiomeFile[];
  prefabs: PrefabFile[];
  ui: UIThemeFile[];
  game: GameStructureFile[];
  behaviors: BehaviorFile[];
  particles?: ParticleSystemFile[];
  sprites?: SpriteFile[];
  images?: ImageFile[];
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
    prefabFileName?: string;
    uiFileName: string;
    gameStructureFileName: string;
    behaviorFileName?: string;
    particleFileName?: string;
    spriteFileName?: string;
  };
  
  fileSystem: MasonFileSystem;
  taskBoard?: ProjectTaskBoardData;
}

// ==========================================
// 7. PROJECT TASK BOARD & KANBAN SCHEMA
// ==========================================
export interface ProjectTaskCategory {
  id: string;
  name: string;
  color: string;
}

export interface ProjectTaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectTaskCard {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  assigneeId?: string; // Column/person ID ('unassigned' or undefined for Project Tasks column)
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  subtasks?: ProjectTaskSubtask[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMemberColumn {
  id: string;
  name: string;
  role?: string;
  avatarColor?: string;
}

export interface ProjectTaskBoardData {
  categories: ProjectTaskCategory[];
  members: ProjectTeamMemberColumn[];
  tasks: ProjectTaskCard[];
}

export const DEFAULT_TASK_CATEGORIES: ProjectTaskCategory[] = [
  { id: 'cat_art', name: 'Art & Sprites', color: '#ec4899' },
  { id: 'cat_level', name: 'Level Design', color: '#06b6d4' },
  { id: 'cat_code', name: 'Code & Mechanics', color: '#3b82f6' },
  { id: 'cat_audio', name: 'Audio & Music', color: '#f59e0b' },
  { id: 'cat_qa', name: 'QA & Polish', color: '#10b981' },
  { id: 'cat_story', name: 'World & Story', color: '#8b5cf6' }
];

export const DEFAULT_TASK_BOARD_MEMBERS: ProjectTeamMemberColumn[] = [
  { id: 'member_1', name: 'Alex Vance', role: 'Lead Programmer', avatarColor: '#3b82f6' },
  { id: 'member_2', name: 'Maya Lin', role: 'Pixel Artist', avatarColor: '#ec4899' },
  { id: 'member_3', name: 'Leo Kai', role: 'Level Designer', avatarColor: '#06b6d4' }
];

export const createDefaultTaskBoard = (): ProjectTaskBoardData => ({
  categories: DEFAULT_TASK_CATEGORIES,
  members: DEFAULT_TASK_BOARD_MEMBERS,
  tasks: [
    {
      id: 'task_1',
      title: 'Design Boss Arena Environment & Colliders',
      description: 'Sculpt the central chasm platforms, place hazard spikes, and test wall jump spacing for the caldera archon fight.',
      categoryId: 'cat_level',
      assigneeId: 'member_3',
      priority: 'high',
      dueDate: '2026-09-01',
      subtasks: [
        { id: 'sub_1', title: 'Carve primary floor & ceiling tiles', completed: true },
        { id: 'sub_2', title: 'Add hazard trigger zones & particle vents', completed: false },
        { id: 'sub_3', title: 'Verify camera lookahead bounds', completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_2',
      title: 'Animate Korrath Flame Surge Attack',
      description: 'Draw 6 frame sprite animation for hero flame surge with glow emissive layer.',
      categoryId: 'cat_art',
      assigneeId: 'member_2',
      priority: 'urgent',
      dueDate: '2026-08-28',
      subtasks: [
        { id: 'sub_4', title: 'Draft keyframe silhouettes', completed: true },
        { id: 'sub_5', title: 'Add particle emission points', completed: true },
        { id: 'sub_6', title: 'Export .png spritesheet', completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_3',
      title: 'Implement IFTTT Sight Sensor Trigger',
      description: 'Connect line-of-sight cone check to mob behavior state transitions for alerted & chase modes.',
      categoryId: 'cat_code',
      assigneeId: 'member_1',
      priority: 'medium',
      subtasks: [
        { id: 'sub_7', title: 'Add vision angle parameter', completed: true },
        { id: 'sub_8', title: 'Test obstacle raycast collision', completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_4',
      title: 'Compose Crystal Chasm Ambient Track',
      description: 'Produce atmospheric synth bass pad track with crystalline percussion for sub-cavern exploration.',
      categoryId: 'cat_audio',
      assigneeId: undefined,
      priority: 'medium',
      subtasks: [
        { id: 'sub_9', title: 'Draft 2-minute looping theme', completed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_5',
      title: 'Audit Biome Parallax Layer Speed Scaling',
      description: 'Verify all 7 parallax layers move smoothly at 60fps across wide map transition bounds.',
      categoryId: 'cat_qa',
      assigneeId: undefined,
      priority: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
});

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

export const ensureUIConfigDefaults = (config?: Partial<UIConfigData>): UIConfigData => {
  const basePreset = config?.styling?.preset || 'gothic_metroidvania';
  
  const defaultColors: UIThemeColors = {
    primaryAccent: basePreset === 'cyberpunk_neon' ? '#06b6d4' : basePreset === 'pixel_16bit' ? '#38bdf8' : basePreset === 'minimal_dark' ? '#10b981' : basePreset === 'fantasy_arcane' ? '#c084fc' : '#d97706',
    secondaryAccent: basePreset === 'cyberpunk_neon' ? '#f43f5e' : basePreset === 'pixel_16bit' ? '#fbbf24' : basePreset === 'minimal_dark' ? '#06b6d4' : basePreset === 'fantasy_arcane' ? '#fbbf24' : '#ef4444',
    surfaceBg: '#09090b',
    cardBg: '#18181b',
    cardBorder: '#27272a',
    textPrimary: '#ffffff',
    textMuted: '#a1a1aa',
    healthColor: '#ef4444',
    manaColor: '#3b82f6',
    staminaColor: '#10b981',
    dangerColor: '#f43f5e',
    goldColor: '#f59e0b',
    ...(config?.styling?.colors || {})
  };

  const defaultStyling: UIThemeStyling = {
    preset: basePreset,
    roundness: config?.styling?.roundness || 'standard',
    customRadiusPx: config?.styling?.customRadiusPx ?? 8,
    borderWidthPx: config?.styling?.borderWidthPx ?? 1,
    borderGlow: config?.styling?.borderGlow ?? false,
    panelBackdropBlur: config?.styling?.panelBackdropBlur ?? 12,
    panelOpacityPercent: config?.styling?.panelOpacityPercent ?? 90,
    fontFamily: config?.styling?.fontFamily || 'default',
    fontScale: config?.styling?.fontScale ?? 1.0,
    colors: defaultColors,
    animations: {
      buttonHoverScale: config?.styling?.animations?.buttonHoverScale ?? 1.04,
      buttonClickDepthPx: config?.styling?.animations?.buttonClickDepthPx ?? 2,
      panelTransition: config?.styling?.animations?.panelTransition || 'slide_horizontal',
      transitionDurationMs: config?.styling?.animations?.transitionDurationMs ?? 250,
      glowPulseEnabled: config?.styling?.animations?.glowPulseEnabled ?? true,
      shimmerEffect: config?.styling?.animations?.shimmerEffect ?? false,
      ...(config?.styling?.animations || {})
    }
  };

  const defaultSplashScreen: UISplashScreenConfig = {
    gameTitle: config?.splashScreen?.gameTitle || 'ECHOES OF THE ASHEN VOID',
    gameSubtitle: config?.splashScreen?.gameSubtitle || 'A 2D Metroidvania Odyssey',
    studioName: config?.splashScreen?.studioName || 'MASON ENGINE STUDIOS',
    pressPromptText: config?.splashScreen?.pressPromptText || 'PRESS ANY BUTTON TO ENTER',
    showStudioLogo: config?.splashScreen?.showStudioLogo ?? true,
    logoIcon: config?.splashScreen?.logoIcon || '⚔️',
    versionText: config?.splashScreen?.versionText || 'v1.0.0 Alpha Build',
    promptBlinkSpeedMs: config?.splashScreen?.promptBlinkSpeedMs ?? 900,
    backgroundTint: config?.splashScreen?.backgroundTint || '#09090b',
    backgroundParticleEffect: config?.splashScreen?.backgroundParticleEffect || 'embers',
    ...(config?.splashScreen || {})
  };

  const defaultMainMenu: UIMainMenuConfig = {
    alignment: config?.mainMenu?.alignment || 'left',
    buttons: config?.mainMenu?.buttons || [
      { id: 'btn_start', label: 'ENTER THE VOID', action: 'start_game', icon: '⚔️', isPrimary: true },
      { id: 'btn_load', label: 'CONTINUE ODYSSEY', action: 'load_game', icon: '💾', badge: 'Save 1' },
      { id: 'btn_inventory', label: 'INVENTORY & GEAR', action: 'inventory', icon: '🎒' },
      { id: 'btn_settings', label: 'SETTINGS & CONTROLS', action: 'options', icon: '⚙️' },
      { id: 'btn_credits', label: 'CREDITS & ARCHIVE', action: 'credits', icon: '📜' }
    ],
    showVersionStamp: config?.mainMenu?.showVersionStamp ?? true,
    bannerHeadline: config?.mainMenu?.bannerHeadline || 'THE CROWN OF ASHES AWAITS',
    showDifficultySelector: config?.mainMenu?.showDifficultySelector ?? true,
    selectedButtonIndex: config?.mainMenu?.selectedButtonIndex ?? 0,
    ...(config?.mainMenu || {})
  };

  const defaultPauseMenu: UIPauseMenuConfig = {
    title: config?.pauseMenu?.title || 'GAME PAUSED',
    buttons: config?.pauseMenu?.buttons || [
      { id: 'btn_resume', label: 'RESUME GAME', action: 'start_game', icon: '▶️', isPrimary: true },
      { id: 'btn_pause_inv', label: 'EQUIPMENT & POUCH', action: 'inventory', icon: '🎒' },
      { id: 'btn_pause_map', label: 'WORLD MAP TRACKER', action: 'custom', icon: '🗺️' },
      { id: 'btn_pause_opts', label: 'AUDIO & GRAPHICS', action: 'options', icon: '⚙️' },
      { id: 'btn_pause_quit', label: 'RETURN TO TITLE', action: 'quit', icon: '🚪' }
    ],
    showStatsSummary: config?.pauseMenu?.showStatsSummary ?? true,
    backdropBlurAmount: config?.pauseMenu?.backdropBlurAmount ?? 10,
    pauseGameEngine: config?.pauseMenu?.pauseGameEngine ?? true,
    ...(config?.pauseMenu || {})
  };

  const defaultInventory: UIInventoryScreenConfig = {
    gridCols: config?.inventoryScreen?.gridCols ?? 5,
    gridRows: config?.inventoryScreen?.gridRows ?? 4,
    showPaperdoll: config?.inventoryScreen?.showPaperdoll ?? true,
    equipmentSlots: config?.inventoryScreen?.equipmentSlots || [
      { slotId: 'slot_head', label: 'Headgear', icon: '🪖', category: 'armor' },
      { slotId: 'slot_chest', label: 'Chestplate', icon: '🛡️', category: 'armor' },
      { slotId: 'slot_weapon_main', label: 'Main Blade', icon: '🗡️', category: 'weapon' },
      { slotId: 'slot_weapon_off', label: 'Off-Hand / Shield', icon: '🛡️', category: 'weapon' },
      { slotId: 'slot_relic', label: 'Aether Relic', icon: '💎', category: 'relic' },
      { slotId: 'slot_boots', label: 'Stride Boots', icon: '👢', category: 'boots' }
    ],
    categoryTabs: config?.inventoryScreen?.categoryTabs || [
      { id: 'tab_all', label: 'All Items', icon: '📦' },
      { id: 'tab_weapons', label: 'Weapons', icon: '⚔️' },
      { id: 'tab_armor', label: 'Armor', icon: '🛡️' },
      { id: 'tab_consumables', label: 'Potions', icon: '🧪' },
      { id: 'tab_key', label: 'Key Items', icon: '🗝️' }
    ],
    showStatSummary: config?.inventoryScreen?.showStatSummary ?? true,
    showGoldCounter: config?.inventoryScreen?.showGoldCounter ?? true,
    currencyName: config?.inventoryScreen?.currencyName || 'Aether Shards',
    ...(config?.inventoryScreen || {})
  };

  const defaultCustomCanvas: UICustomCanvasConfig = {
    name: config?.customCanvas?.name || 'Custom UI Canvas',
    widgets: config?.customCanvas?.widgets || [
      { id: 'w_title', name: 'Header Title', type: 'text', x: 24, y: 24, width: 260, height: 40, text: 'Custom Overlay UI', color: '#ffffff' },
      { id: 'w_btn_action', name: 'Primary Action Button', type: 'button', x: 24, y: 80, width: 180, height: 42, text: 'Trigger Action', icon: '⚡', backgroundColor: defaultColors.primaryAccent, borderRadius: 8, animationTrigger: 'on_hover_grow' },
      { id: 'w_progress', name: 'Special Gauge Bar', type: 'progress_bar', x: 24, y: 140, width: 220, height: 16, value: 72, minValue: 0, maxValue: 100, color: defaultColors.secondaryAccent },
      { id: 'w_card', name: 'Info Stat Card', type: 'card', x: 280, y: 24, width: 200, height: 132, text: 'Active Buffs:\n• +20% Attack Speed\n• Cinder Armor Active', backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8 }
    ]
  };

  const defaultMenus: UIMenuScreen[] = [
    {
      id: 'menu_main_start',
      name: 'Start / Title Menu',
      description: 'Primary landing screen with new game launch, load, and settings options',
      isInitialScreen: false,
      widgets: [
        {
          id: 'w_title_main',
          name: 'Game Title Heading',
          type: 'text',
          x: 48,
          y: 40,
          width: 520,
          height: 60,
          text: 'ECHOES OF THE ASHEN VOID',
          fontSize: 32,
          color: defaultColors.primaryAccent,
          textAlign: 'left'
        },
        {
          id: 'w_title_sub',
          name: 'Subtitle',
          type: 'text',
          x: 50,
          y: 104,
          width: 480,
          height: 28,
          text: 'A 2D Metroidvania Odyssey // v1.0.0 Alpha',
          fontSize: 14,
          color: '#a1a1aa',
          textAlign: 'left'
        },
        {
          id: 'w_hero_input',
          name: 'Hero Name Input',
          type: 'input_field',
          x: 48,
          y: 156,
          width: 320,
          height: 48,
          text: 'Korrath',
          placeholder: 'Enter Hero Name...',
          backgroundColor: '#18181b',
          borderColor: '#3f3f46',
          color: '#ffffff',
          borderRadius: 8
        },
        {
          id: 'w_btn_start_game',
          name: 'Start Game Button',
          type: 'button',
          x: 48,
          y: 220,
          width: 320,
          height: 50,
          text: 'ENTER THE VOID (NEW GAME)',
          icon: '⚔️',
          isPrimary: true,
          action: 'start_game',
          pauseAction: 'unpause',
          backgroundColor: defaultColors.primaryAccent,
          color: '#ffffff',
          borderRadius: 8,
          animationTrigger: 'on_hover_grow'
        },
        {
          id: 'w_btn_load_menu',
          name: 'Options & Audio Button',
          type: 'button',
          x: 48,
          y: 282,
          width: 320,
          height: 46,
          text: 'AUDIO & SETTINGS',
          icon: '⚙️',
          action: 'navigate_menu',
          targetMenuId: 'menu_settings',
          pauseAction: 'none',
          backgroundColor: '#18181b',
          borderColor: '#3f3f46',
          color: '#ffffff',
          borderRadius: 8,
          animationTrigger: 'on_hover_grow'
        },
        {
          id: 'w_btn_hero_inventory',
          name: 'Prefab & Equipment Button',
          type: 'button',
          x: 48,
          y: 338,
          width: 320,
          height: 46,
          text: 'EQUIPMENT & POUCH',
          icon: '🎒',
          badge: 'New Item',
          action: 'navigate_menu',
          targetMenuId: 'menu_inventory',
          pauseAction: 'none',
          backgroundColor: '#18181b',
          borderColor: '#3f3f46',
          color: '#ffffff',
          borderRadius: 8,
          animationTrigger: 'on_hover_grow'
        },
        {
          id: 'w_side_info_card',
          name: 'Status Card',
          type: 'card',
          x: 420,
          y: 156,
          width: 340,
          height: 228,
          text: '🔥 ASHEN PROTOCOL ACTIVE\n\n• Progression: Ignis Caldera Cleared\n• Aether Relics: 4 / 12 Found\n• Difficulty: Hero (Normal)\n• Engine Suspended: In Menu',
          backgroundColor: '#18181be6',
          borderColor: '#27272a',
          borderRadius: 12
        }
      ]
    },
    {
      id: 'menu_pause',
      name: 'Pause Menu (In-Game)',
      description: 'Suspended overlay menu with resume, inventory, and title actions',
      isOverlay: true,
      backdropBlur: 14,
      widgets: [
        {
          id: 'w_pause_card',
          name: 'Pause Dialog Window',
          type: 'card',
          x: 180,
          y: 50,
          width: 440,
          height: 380,
          backgroundColor: '#18181bf2',
          borderColor: defaultColors.primaryAccent,
          borderRadius: 16
        },
        {
          id: 'w_pause_title',
          name: 'Pause Title',
          type: 'text',
          x: 200,
          y: 75,
          width: 400,
          height: 36,
          text: 'GAME PAUSED',
          fontSize: 24,
          color: defaultColors.primaryAccent,
          textAlign: 'center'
        },
        {
          id: 'w_pause_sub',
          name: 'Pause Status Subtitle',
          type: 'text',
          x: 200,
          y: 115,
          width: 400,
          height: 24,
          text: 'Suspended State // Playtime: 04h 28m',
          fontSize: 12,
          color: '#a1a1aa',
          textAlign: 'center'
        },
        {
          id: 'w_btn_resume',
          name: 'Resume Button',
          type: 'button',
          x: 220,
          y: 155,
          width: 360,
          height: 48,
          text: 'RESUME GAMEPLAY',
          icon: '▶️',
          isPrimary: true,
          action: 'resume_game',
          pauseAction: 'unpause',
          backgroundColor: defaultColors.primaryAccent,
          color: '#ffffff',
          borderRadius: 8,
          animationTrigger: 'on_hover_grow'
        },
        {
          id: 'w_btn_pause_inv',
          name: 'Inventory Nav Button',
          type: 'button',
          x: 220,
          y: 215,
          width: 360,
          height: 44,
          text: 'EQUIPMENT & POUCH',
          icon: '🎒',
          action: 'navigate_menu',
          targetMenuId: 'menu_inventory',
          pauseAction: 'pause',
          backgroundColor: '#27272a',
          borderColor: '#3f3f46',
          color: '#ffffff',
          borderRadius: 8
        },
        {
          id: 'w_btn_pause_settings',
          name: 'Settings Nav Button',
          type: 'button',
          x: 220,
          y: 269,
          width: 360,
          height: 44,
          text: 'AUDIO & GRAPHICS',
          icon: '⚙️',
          action: 'navigate_menu',
          targetMenuId: 'menu_settings',
          pauseAction: 'pause',
          backgroundColor: '#27272a',
          borderColor: '#3f3f46',
          color: '#ffffff',
          borderRadius: 8
        },
        {
          id: 'w_btn_pause_quit',
          name: 'Return to Title Button',
          type: 'button',
          x: 220,
          y: 323,
          width: 360,
          height: 44,
          text: 'RETURN TO MAIN MENU',
          icon: '🚪',
          action: 'navigate_menu',
          targetMenuId: 'menu_main_start',
          pauseAction: 'unpause',
          backgroundColor: '#27272a',
          borderColor: '#7f1d1d',
          color: '#f87171',
          borderRadius: 8
        }
      ]
    },
    {
      id: 'menu_settings',
      name: 'Audio & Controls Settings',
      description: 'Configurable sliders, toggles, and inputs for game parameters',
      widgets: [
        {
          id: 'w_sett_title',
          name: 'Settings Title',
          type: 'text',
          x: 48,
          y: 36,
          width: 500,
          height: 40,
          text: 'AUDIO & DISPLAY SETTINGS',
          fontSize: 26,
          color: defaultColors.primaryAccent,
          textAlign: 'left'
        },
        {
          id: 'w_sett_player_tag',
          name: 'Gamertag Input Field',
          type: 'input_field',
          x: 48,
          y: 92,
          width: 340,
          height: 46,
          text: 'ShadowStrider',
          placeholder: 'Enter Display Name...',
          backgroundColor: '#18181b',
          borderColor: '#3f3f46',
          borderRadius: 8
        },
        {
          id: 'w_vol_master',
          name: 'Master Volume Slider',
          type: 'slider',
          x: 48,
          y: 156,
          width: 340,
          height: 48,
          text: 'Master Volume',
          value: 80,
          minValue: 0,
          maxValue: 100,
          unit: '%',
          color: defaultColors.primaryAccent
        },
        {
          id: 'w_vol_sfx',
          name: 'SFX & Combat Volume',
          type: 'slider',
          x: 48,
          y: 216,
          width: 340,
          height: 48,
          text: 'SFX & Combat Audio',
          value: 95,
          minValue: 0,
          maxValue: 100,
          unit: '%',
          color: defaultColors.secondaryAccent
        },
        {
          id: 'w_toggle_shake',
          name: 'Screen Shake Toggle',
          type: 'toggle',
          x: 48,
          y: 280,
          width: 340,
          height: 40,
          text: 'Screen Shake on Impact',
          checked: true
        },
        {
          id: 'w_toggle_damage_pop',
          name: 'Combat Floating Text Toggle',
          type: 'toggle',
          x: 48,
          y: 326,
          width: 340,
          height: 40,
          text: 'Floating Damage Numbers',
          checked: true
        },
        {
          id: 'w_btn_sett_back',
          name: 'Back to Title Button',
          type: 'button',
          x: 48,
          y: 382,
          width: 220,
          height: 44,
          text: 'BACK TO MENU',
          icon: '⬅️',
          action: 'navigate_menu',
          targetMenuId: 'menu_main_start',
          backgroundColor: defaultColors.primaryAccent,
          color: '#ffffff',
          borderRadius: 8
        }
      ]
    },
    {
      id: 'menu_inventory',
      name: 'Prefab & Equipment',
      description: 'Item cards, stat gauges, and paperdoll summary',
      widgets: [
        {
          id: 'w_inv_title',
          name: 'Inventory Header',
          type: 'text',
          x: 48,
          y: 36,
          width: 480,
          height: 40,
          text: 'EQUIPMENT & POUCH',
          fontSize: 26,
          color: defaultColors.primaryAccent,
          textAlign: 'left'
        },
        {
          id: 'w_inv_hp_bar',
          name: 'Vitality Health Bar',
          type: 'progress_bar',
          x: 48,
          y: 92,
          width: 320,
          height: 24,
          text: 'VITALITY HP: 85/100',
          value: 85,
          minValue: 0,
          maxValue: 100,
          color: defaultColors.healthColor
        },
        {
          id: 'w_inv_mana_bar',
          name: 'Mana Gauge Bar',
          type: 'progress_bar',
          x: 48,
          y: 126,
          width: 320,
          height: 24,
          text: 'AETHER MANA: 60/100',
          value: 60,
          minValue: 0,
          maxValue: 100,
          color: defaultColors.manaColor
        },
        {
          id: 'w_inv_weapon_card',
          name: 'Equipped Weapon Card',
          type: 'card',
          x: 48,
          y: 170,
          width: 340,
          height: 110,
          text: '🗡️ Ashen Greatblade (Epic)\n\n+45 Attack • +12 Void Damage\nMagma Core Enchantment Active',
          backgroundColor: '#18181be6',
          borderColor: '#a855f7',
          borderRadius: 10
        },
        {
          id: 'w_inv_armor_card',
          name: 'Equipped Armor Card',
          type: 'card',
          x: 48,
          y: 290,
          width: 340,
          height: 90,
          text: '🛡️ Aether Crest Plate (Legendary)\n\n+60 Defense • -25% Aerial Hazard DMG',
          backgroundColor: '#18181be6',
          borderColor: '#f59e0b',
          borderRadius: 10
        },
        {
          id: 'w_btn_inv_back',
          name: 'Close Inventory Button',
          type: 'button',
          x: 48,
          y: 396,
          width: 220,
          height: 42,
          text: 'CLOSE INVENTORY',
          icon: '⬅️',
          action: 'navigate_menu',
          targetMenuId: 'menu_main_start',
          backgroundColor: defaultColors.primaryAccent,
          color: '#ffffff',
          borderRadius: 8
        }
      ]
    }
  ];

  // Determine menu list
  const baseMenus = config?.menus && config.menus.length > 0 ? config.menus : defaultMenus;

  // Resolve initial menu ID (strictly mutual exclusive, at most one menu or undefined)
  let resolvedInitialMenuId: string | undefined = undefined;
  if (config?.initialMenuId && baseMenus.some(m => m.id === config.initialMenuId)) {
    resolvedInitialMenuId = config.initialMenuId;
  } else {
    // If not specified in initialMenuId, check if any menu was marked isInitialScreen
    const marked = baseMenus.find(m => m.isInitialScreen === true);
    if (marked) {
      resolvedInitialMenuId = marked.id;
    }
  }

  // Resolve pause menu ID (strictly mutual exclusive, at most one menu or undefined)
  let resolvedPauseMenuId: string | undefined = undefined;
  if (config?.pauseMenuId && baseMenus.some(m => m.id === config.pauseMenuId)) {
    resolvedPauseMenuId = config.pauseMenuId;
  } else {
    const markedPause = baseMenus.find(m => m.isPauseMenu === true);
    if (markedPause) {
      resolvedPauseMenuId = markedPause.id;
    }
  }

  // Normalize menus to enforce single-landing-screen and single-pause-menu invariants
  const normalizedMenus: UIMenuScreen[] = baseMenus.map(m => ({
    ...m,
    isInitialScreen: resolvedInitialMenuId ? m.id === resolvedInitialMenuId : false,
    isPauseMenu: resolvedPauseMenuId ? m.id === resolvedPauseMenuId : false
  }));

  return {
    id: config?.id || 'classic_gothic_hud',
    name: config?.name || 'Gothic Obsidian & Ruby',
    themeName: config?.themeName || config?.name || 'Gothic Obsidian & Ruby',
    initialMenuId: resolvedInitialMenuId,
    pauseMenuId: resolvedPauseMenuId,
    menus: normalizedMenus,
    styling: defaultStyling,
    splashScreen: defaultSplashScreen,
    mainMenu: defaultMainMenu,
    pauseMenu: defaultPauseMenu,
    inventoryScreen: defaultInventory,
    customCanvas: defaultCustomCanvas,
    healthOrb: config?.healthOrb || {
      style: 'classic_orb',
      fillColor: '#dc2626',
      dangerColor: '#7f1d1d',
      borderColor: '#382f2d',
      showNumericValue: true,
      scale: 1.0,
      position: 'top_left'
    },
    manaGauge: config?.manaGauge || {
      enabled: true,
      fillColor: '#2563eb',
      style: 'orb'
    },
    staminaGauge: config?.staminaGauge || {
      enabled: true,
      fillColor: '#16a34a',
      showBelowPlayer: true
    },
    minimap: config?.minimap || {
      enabled: true,
      shape: 'circle',
      sizePx: 140,
      position: 'top_right',
      showPlayerBeacon: true,
      showExitMarkers: true,
      radarScanEffect: true,
      borderColor: '#475569'
    },
    dialogueBox: config?.dialogueBox || {
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
    bossBar: config?.bossBar || {
      enabled: true,
      position: 'top_center',
      style: 'ornate_golden',
      showBossTitle: true,
      barColor: '#e11d48',
      phaseMarkers: true
    },
    combatText: config?.combatText || {
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
    buttonPromptStyle: config?.buttonPromptStyle || 'keyboard',
    inputMappings: config?.inputMappings || [
      { id: 'inp_jump', name: 'jump', label: 'Jump / Leap', triggerMode: 'press', keys: ['Space', 'KeyW'], gamepadButtons: ['ButtonSouth / A'] },
      { id: 'inp_dash', name: 'dash', label: 'Air / Ground Dash', triggerMode: 'tap', keys: ['ShiftLeft'], gamepadButtons: ['ButtonEast / B'] },
      { id: 'inp_attack', name: 'attack', label: 'Primary Attack', triggerMode: 'press', keys: ['KeyJ'], gamepadButtons: ['ButtonWest / X'] },
      { id: 'inp_interact', name: 'interact', label: 'Interact / Talk', triggerMode: 'hold', holdDurationMs: 300, keys: ['KeyE'], gamepadButtons: ['ButtonNorth / Y'] },
      { id: 'inp_block', name: 'block', label: 'Shield Guard', triggerMode: 'hold', holdDurationMs: 0, keys: ['KeyK'], gamepadButtons: ['LeftBumper / LB'] }
    ]
  };
};

export const DEFAULT_UI_THEMES: UIConfigData[] = [
  ensureUIConfigDefaults({
    id: 'classic_gothic_hud',
    name: 'Gothic Obsidian & Ruby',
    themeName: 'Gothic Obsidian & Ruby',
    styling: {
      preset: 'gothic_metroidvania',
      roundness: 'subtle',
      customRadiusPx: 4,
      borderWidthPx: 1,
      borderGlow: false,
      panelBackdropBlur: 16,
      panelOpacityPercent: 92,
      fontFamily: 'serif_gothic',
      fontScale: 1.0,
      colors: {
        primaryAccent: '#d97706',
        secondaryAccent: '#ef4444',
        surfaceBg: '#09090b',
        cardBg: '#18181b',
        cardBorder: '#3f3f46',
        textPrimary: '#ffffff',
        textMuted: '#a1a1aa',
        healthColor: '#dc2626',
        manaColor: '#2563eb',
        staminaColor: '#16a34a',
        dangerColor: '#ef4444',
        goldColor: '#f59e0b'
      },
      animations: {
        buttonHoverScale: 1.03,
        buttonClickDepthPx: 2,
        panelTransition: 'slide_horizontal',
        transitionDurationMs: 280,
        glowPulseEnabled: true,
        shimmerEffect: false
      }
    },
    splashScreen: {
      gameTitle: 'ECHOES OF THE ASHEN VOID',
      gameSubtitle: 'A 2D Metroidvania Odyssey',
      studioName: 'MASON ENGINE STUDIOS',
      pressPromptText: 'PRESS ANY BUTTON TO ENTER',
      showStudioLogo: true,
      logoIcon: '⚔️',
      versionText: 'v1.0.0 Alpha Build',
      promptBlinkSpeedMs: 900,
      backgroundTint: '#09090b',
      backgroundParticleEffect: 'embers'
    },
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
    }
  }),
  ensureUIConfigDefaults({
    id: 'minimalist_scifi_hud',
    name: 'Cybernetic Neon & Hologram',
    themeName: 'Cybernetic Neon & Hologram',
    styling: {
      preset: 'cyberpunk_neon',
      roundness: 'sharp',
      customRadiusPx: 0,
      borderWidthPx: 2,
      borderGlow: true,
      panelBackdropBlur: 18,
      panelOpacityPercent: 88,
      fontFamily: 'mono_scifi',
      fontScale: 1.0,
      colors: {
        primaryAccent: '#06b6d4',
        secondaryAccent: '#f43f5e',
        surfaceBg: '#030712',
        cardBg: '#0b1329',
        cardBorder: '#0e7490',
        textPrimary: '#67e8f9',
        textMuted: '#94a3b8',
        healthColor: '#06b6d4',
        manaColor: '#8b5cf6',
        staminaColor: '#10b981',
        dangerColor: '#f43f5e',
        goldColor: '#eab308'
      },
      animations: {
        buttonHoverScale: 1.06,
        buttonClickDepthPx: 3,
        panelTransition: 'slide_vertical',
        transitionDurationMs: 200,
        glowPulseEnabled: true,
        shimmerEffect: true
      }
    },
    splashScreen: {
      gameTitle: 'CYBERPUNK ASCENSION',
      gameSubtitle: 'Neon Protocol // v2.04',
      studioName: 'SYNAPSE LABS',
      pressPromptText: '[ SYSTEM READY // PRESS ANY KEY ]',
      showStudioLogo: true,
      logoIcon: '⚡',
      versionText: 'CYBER-KERNEL v2.04-RC',
      promptBlinkSpeedMs: 700,
      backgroundTint: '#030712',
      backgroundParticleEffect: 'digital_rain'
    },
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
    }
  }),
  ensureUIConfigDefaults({
    id: 'retro_pixel_hud',
    name: '16-Bit Nostalgia & Arcade',
    themeName: '16-Bit Nostalgia & Arcade',
    styling: {
      preset: 'pixel_16bit',
      roundness: 'sharp',
      customRadiusPx: 0,
      borderWidthPx: 3,
      borderGlow: false,
      panelBackdropBlur: 0,
      panelOpacityPercent: 100,
      fontFamily: 'pixel',
      fontScale: 1.1,
      colors: {
        primaryAccent: '#38bdf8',
        secondaryAccent: '#fbbf24',
        surfaceBg: '#0f172a',
        cardBg: '#1e293b',
        cardBorder: '#475569',
        textPrimary: '#f8fafc',
        textMuted: '#94a3b8',
        healthColor: '#ef4444',
        manaColor: '#3b82f6',
        staminaColor: '#22c55e',
        dangerColor: '#dc2626',
        goldColor: '#fbbf24'
      },
      animations: {
        buttonHoverScale: 1.02,
        buttonClickDepthPx: 4,
        panelTransition: 'instant',
        transitionDurationMs: 120,
        glowPulseEnabled: false,
        shimmerEffect: false
      }
    },
    splashScreen: {
      gameTitle: 'SUPER HERO ODYSSEY',
      gameSubtitle: 'Insert Coin to Begin',
      studioName: 'RETRO ARCADE 1994',
      pressPromptText: 'PRESS START / ENTER',
      showStudioLogo: true,
      logoIcon: '👾',
      versionText: 'REV 1.2 JAPAN',
      promptBlinkSpeedMs: 600,
      backgroundTint: '#0f172a',
      backgroundParticleEffect: 'dust_motes'
    },
    healthOrb: {
      style: 'segmented_pips',
      fillColor: '#ef4444',
      dangerColor: '#7f1d1d',
      borderColor: '#000000',
      showNumericValue: true,
      scale: 1.1,
      position: 'top_left'
    },
    manaGauge: {
      enabled: true,
      fillColor: '#3b82f6',
      style: 'bar'
    },
    staminaGauge: {
      enabled: true,
      fillColor: '#22c55e',
      showBelowPlayer: true
    },
    minimap: {
      enabled: true,
      shape: 'square',
      sizePx: 130,
      position: 'top_right',
      showPlayerBeacon: true,
      showExitMarkers: true,
      radarScanEffect: false,
      borderColor: '#000000'
    }
  }),
  ensureUIConfigDefaults({
    id: 'minimal_dark_hud',
    name: 'Sleek Midnight Glass',
    themeName: 'Sleek Midnight Glass',
    styling: {
      preset: 'minimal_dark',
      roundness: 'smooth',
      customRadiusPx: 12,
      borderWidthPx: 1,
      borderGlow: false,
      panelBackdropBlur: 20,
      panelOpacityPercent: 80,
      fontFamily: 'sans_modern',
      fontScale: 1.0,
      colors: {
        primaryAccent: '#10b981',
        secondaryAccent: '#06b6d4',
        surfaceBg: '#09090b',
        cardBg: '#121215',
        cardBorder: '#27272a',
        textPrimary: '#ffffff',
        textMuted: '#71717a',
        healthColor: '#f43f5e',
        manaColor: '#06b6d4',
        staminaColor: '#10b981',
        dangerColor: '#e11d48',
        goldColor: '#eab308'
      },
      animations: {
        buttonHoverScale: 1.04,
        buttonClickDepthPx: 2,
        panelTransition: 'fade_scale',
        transitionDurationMs: 300,
        glowPulseEnabled: true,
        shimmerEffect: true
      }
    },
    splashScreen: {
      gameTitle: 'HORIZON DRIFT',
      gameSubtitle: 'A Minimalist Journey',
      studioName: 'MONOCHROME WORKS',
      pressPromptText: 'Click anywhere to begin',
      showStudioLogo: true,
      logoIcon: '✨',
      versionText: 'v0.9.8 Smooth',
      promptBlinkSpeedMs: 1200,
      backgroundTint: '#09090b',
      backgroundParticleEffect: 'snow'
    },
    healthOrb: {
      style: 'horizontal_bar',
      fillColor: '#f43f5e',
      dangerColor: '#881337',
      borderColor: '#27272a',
      showNumericValue: true,
      scale: 1.0,
      position: 'top_left'
    },
    manaGauge: {
      enabled: true,
      fillColor: '#06b6d4',
      style: 'bar'
    },
    staminaGauge: {
      enabled: true,
      fillColor: '#10b981',
      showBelowPlayer: false
    },
    minimap: {
      enabled: true,
      shape: 'circle',
      sizePx: 130,
      position: 'top_right',
      showPlayerBeacon: true,
      showExitMarkers: true,
      radarScanEffect: true,
      borderColor: '#27272a'
    }
  }),
  ensureUIConfigDefaults({
    id: 'arcane_fantasy_hud',
    name: 'Royal Arcane & Gold Filigree',
    themeName: 'Royal Arcane & Gold Filigree',
    styling: {
      preset: 'fantasy_arcane',
      roundness: 'standard',
      customRadiusPx: 8,
      borderWidthPx: 2,
      borderGlow: true,
      panelBackdropBlur: 14,
      panelOpacityPercent: 92,
      fontFamily: 'serif_gothic',
      fontScale: 1.05,
      colors: {
        primaryAccent: '#c084fc',
        secondaryAccent: '#fbbf24',
        surfaceBg: '#110b1a',
        cardBg: '#1e142c',
        cardBorder: '#581c87',
        textPrimary: '#f5d0fe',
        textMuted: '#c084fc',
        healthColor: '#ec4899',
        manaColor: '#a855f7',
        staminaColor: '#34d399',
        dangerColor: '#f43f5e',
        goldColor: '#fbbf24'
      },
      animations: {
        buttonHoverScale: 1.05,
        buttonClickDepthPx: 2,
        panelTransition: 'slide_horizontal',
        transitionDurationMs: 260,
        glowPulseEnabled: true,
        shimmerEffect: true
      }
    },
    splashScreen: {
      gameTitle: 'REALMS OF ELDON',
      gameSubtitle: 'The High Mage Chronicles',
      studioName: 'MYSTIC SPHERE',
      pressPromptText: 'INVOKE RUNIC GATEWAY (PRESS ANY KEY)',
      showStudioLogo: true,
      logoIcon: '🔮',
      versionText: 'GRIMOIRE ED. 3.0',
      promptBlinkSpeedMs: 850,
      backgroundTint: '#110b1a',
      backgroundParticleEffect: 'embers'
    },
    healthOrb: {
      style: 'classic_orb',
      fillColor: '#ec4899',
      dangerColor: '#831843',
      borderColor: '#fbbf24',
      showNumericValue: true,
      scale: 1.0,
      position: 'top_left'
    },
    manaGauge: {
      enabled: true,
      fillColor: '#a855f7',
      style: 'runes'
    },
    staminaGauge: {
      enabled: true,
      fillColor: '#34d399',
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
      borderColor: '#fbbf24'
    }
  })
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
    defaultPrefabFileName: 'korrath.prefab',
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
    },
    exposedVariables: [
      { id: 'var_hero_max_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: false, defaultValue: 100 },
      { id: 'var_hero_max_energy', name: 'Max Energy', category: 'attribute', type: 'number', isStatic: false, defaultValue: 80 },
      { id: 'var_hero_max_stamina', name: 'Max Stamina', category: 'attribute', type: 'number', isStatic: false, defaultValue: 100 },
      { id: 'var_hero_speed', name: 'Base Movement Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 6.5 },
      { id: 'var_hero_poise', name: 'Base Poise', category: 'attribute', type: 'number', isStatic: false, defaultValue: 50 },
      { id: 'var_hero_weapons', name: 'Weapon Proficiencies', category: 'proficiency', type: 'string', isStatic: false, defaultValue: 'Sword, Bow, Dagger' },
      { id: 'var_hero_affinity', name: 'Damage Affinity', category: 'proficiency', type: 'string', isStatic: true, defaultValue: 'kinetic' },
      { id: 'var_hero_iframe_dash', name: 'iFrame Dash Enabled', category: 'setting', type: 'boolean', isStatic: true, defaultValue: true }
    ]
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
    },
    exposedVariables: [
      { id: 'var_mob_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: false, defaultValue: 150 },
      { id: 'var_mob_speed', name: 'Patrol Movement Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 4.8 },
      { id: 'var_mob_poise', name: 'Base Poise', category: 'attribute', type: 'number', isStatic: false, defaultValue: 80 },
      { id: 'var_mob_affinity', name: 'Damage Affinity', category: 'proficiency', type: 'string', isStatic: true, defaultValue: 'slashing' },
      { id: 'var_mob_aggro_radius', name: 'Vision Radius', category: 'setting', type: 'number', isStatic: false, defaultValue: 220 }
    ]
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
    },
    exposedVariables: [
      { id: 'var_boss_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: false, defaultValue: 1200 },
      { id: 'var_boss_speed', name: 'Stride Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 3.5 },
      { id: 'var_boss_poise', name: 'Base Poise Armor', category: 'attribute', type: 'number', isStatic: false, defaultValue: 250 },
      { id: 'var_boss_affinity', name: 'Damage Affinity', category: 'proficiency', type: 'string', isStatic: true, defaultValue: 'fire' },
      { id: 'var_boss_enrage_speed', name: 'Phase 3 Enrage Speed Multiplier', category: 'setting', type: 'number', isStatic: true, defaultValue: 1.7 }
    ]
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
    },
    exposedVariables: [
      { id: 'var_sentry_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: false, defaultValue: 80 },
      { id: 'var_sentry_range', name: 'Acquisition Radius (px)', category: 'setting', type: 'number', isStatic: false, defaultValue: 320 },
      { id: 'var_sentry_burst', name: 'Burst Count', category: 'setting', type: 'number', isStatic: true, defaultValue: 3 }
    ]
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
    },
    exposedVariables: [
      { id: 'var_npc_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: true, defaultValue: 100 },
      { id: 'var_npc_speed', name: 'Wander Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 1.5 },
      { id: 'var_npc_greeting', name: 'Dialogue Prompt Text', category: 'setting', type: 'string', isStatic: false, defaultValue: 'Greetings traveler, the ashen storm approaches.' }
    ]
  }
];

export const DEFAULT_PREFABS: PrefabData[] = [
  {
    id: 'char_korrath',
    name: 'Korrath Steelhand (Player Hero)',
    prefabType: 'player_hero',
    avatarIcon: '🛡️',
    spriteWidth: 64,
    spriteHeight: 64,
    tintColor: '#06b6d4',
    baseScale: 1.0,
    states: ['idle', 'running', 'airborne', 'attacking', 'hurt'],
    movement: {
      id: 'mov_korrath',
      name: 'Hero Kinematics',
      movementType: 'ground_patrol',
      moveSpeed: 5.5,
      acceleration: 0.25,
      jumpForce: 12.5,
      gravityScale: 1.0,
      turnOnEdge: false,
      turnOnObstacle: false,
      sineFrequency: 1.0,
      sineAmplitude: 1.0,
      airControl: 0.85,
      trackNodeSpeed: 5
    },
    variables: [
      { id: 'var_korrath_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: true, defaultValue: 100 },
      { id: 'var_korrath_stamina', name: 'Max Stamina', category: 'attribute', type: 'number', isStatic: true, defaultValue: 100 },
      { id: 'var_korrath_speed', name: 'Sprint Speed Multiplier', category: 'attribute', type: 'number', isStatic: false, defaultValue: 5.5 },
      { id: 'var_korrath_jump', name: 'Jump Impulse Force', category: 'attribute', type: 'number', isStatic: false, defaultValue: 12.5 },
      { id: 'var_korrath_weapon', name: 'Primary Weapon Class', category: 'proficiency', type: 'string', isStatic: true, defaultValue: 'Steel Greatblade' }
    ],
    behaviorVariables: {
      var_korrath_hp: 100,
      var_korrath_stamina: 100,
      var_korrath_speed: 5.5,
      var_korrath_jump: 12.5,
      var_korrath_weapon: 'Steel Greatblade'
    },
    rules: [
      {
        id: 'rule_hero_possession',
        name: 'Camera Tracking on Spawn / Possess',
        enabled: true,
        trigger: { type: 'possession', event: 'on_possess' },
        actions: [
          { id: 'act_cam_track', actionType: 'camera', cameraMode: 'track_self', cameraZoom: 1.0, cameraSmoothing: 0.15, cameraLookAheadX: 24, cameraLookAheadY: 0 }
        ]
      },
      {
        id: 'rule_hero_move_left',
        name: 'Move Left Input',
        enabled: true,
        trigger: { type: 'mapped_input', inputId: 'move_left', inputName: 'Move Left' },
        actions: [
          { id: 'act_mov_l', actionType: 'move', moveMode: 'towards_target', speed: 5.5 },
          { id: 'act_anim_run', actionType: 'animation', animState: 'run' }
        ]
      },
      {
        id: 'rule_hero_move_right',
        name: 'Move Right Input',
        enabled: true,
        trigger: { type: 'mapped_input', inputId: 'move_right', inputName: 'Move Right' },
        actions: [
          { id: 'act_mov_r', actionType: 'move', moveMode: 'towards_target', speed: 5.5 },
          { id: 'act_anim_run2', actionType: 'animation', animState: 'run' }
        ]
      },
      {
        id: 'rule_hero_jump',
        name: 'Jump Input Pressed',
        enabled: true,
        trigger: { type: 'mapped_input', inputId: 'jump', inputName: 'Jump Button' },
        actions: [
          { id: 'act_imp_jump', actionType: 'hero_impulse', impulseType: 'jump', force: 12.5 },
          { id: 'act_anim_jump', actionType: 'animation', animState: 'jump' },
          { id: 'act_sfx_jump', actionType: 'audio', soundCue: 'sfx_jump_whoosh' }
        ]
      },
      {
        id: 'rule_hero_attack',
        name: 'Primary Attack Blade Slash',
        enabled: true,
        trigger: { type: 'mapped_input', inputId: 'attack', inputName: 'Attack Button' },
        actions: [
          { id: 'act_atk_slash', actionType: 'attack', attackType: 'melee_slash', telegraphWindupMs: 80 },
          { id: 'act_anim_atk', actionType: 'animation', animState: 'attack' },
          { id: 'act_cam_shake', actionType: 'camera', cameraMode: 'shake', cameraShakeIntensity: 2.0 }
        ]
      },
      {
        id: 'rule_hero_dash',
        name: 'Dash Evade',
        enabled: true,
        trigger: { type: 'mapped_input', inputId: 'dash', inputName: 'Dash Button' },
        actions: [
          { id: 'act_imp_dash', actionType: 'hero_impulse', impulseType: 'dash', force: 18.0 },
          { id: 'act_part_dash', actionType: 'emit_signal', signalType: 'call_allies', signalRadiusPx: 40 }
        ]
      }
    ],
    baseStats: { health: 100, energy: 100, stamina: 100, poise: 50, speed: 5 },
    capsule: {
      radius: 16,
      height: 44,
      offsetX: 0,
      offsetY: 2
    },
    spritesheets: [
      {
        id: 'sheet_korrath_main',
        name: 'Korrath Hero Primary Sheet (64x64)',
        tileWidth: 64,
        tileHeight: 64,
        cols: 8,
        rows: 4,
        totalFrames: 32
      }
    ],
    points: [
      { id: 'pt_eyes', name: 'Eyes (Sight Locus)', color: '#38bdf8', defaultOffsetX: 10, defaultOffsetY: -18 },
      { id: 'pt_ears', name: 'Ears (Acoustic Hearing)', color: '#a855f7', defaultOffsetX: 0, defaultOffsetY: -20 },
      { id: 'pt_torso', name: 'Torso Center (Hurtbox)', color: '#22c55e', defaultOffsetX: 0, defaultOffsetY: 0 },
      { id: 'pt_feet', name: 'Feet (Footstep Sound)', color: '#f59e0b', defaultOffsetX: 0, defaultOffsetY: 26 },
      { id: 'pt_weapon', name: 'Right Hand (Weapon Origin)', color: '#ef4444', defaultOffsetX: 18, defaultOffsetY: 2 }
    ],
    polygons: [
      {
        id: 'poly_body_hurtbox',
        name: 'Main Body Hurtbox',
        type: 'hurtbox',
        color: '#22c55e',
        defaultVertices: [
          { x: -14, y: -24 },
          { x: 14, y: -24 },
          { x: 14, y: 24 },
          { x: -14, y: 24 }
        ]
      },
      {
        id: 'poly_sword_hitbox',
        name: 'Primary Weapon Melee Hitbox',
        type: 'hitbox',
        color: '#ef4444',
        defaultVertices: [
          { x: 10, y: -16 },
          { x: 38, y: -16 },
          { x: 38, y: 16 },
          { x: 10, y: 16 }
        ]
      }
    ],
    sockets: [
      { tagId: 'head_eyes', label: 'Eyes (Sight Locus)', offsetX: 10, offsetY: -18, visualMarkerColor: '#38bdf8' },
      { tagId: 'head_ears', label: 'Ears (Hearing Locus)', offsetX: 0, offsetY: -20, visualMarkerColor: '#a855f7' },
      { tagId: 'torso_center', label: 'Torso Center (Hurtbox)', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
      { tagId: 'feet_ground', label: 'Feet (Footstep Sound)', offsetX: 0, offsetY: 26, visualMarkerColor: '#f59e0b' },
      { tagId: 'hand_weapon', label: 'Right Hand (Weapon Origin)', offsetX: 18, offsetY: 2, visualMarkerColor: '#ef4444' }
    ],
    animations: [
      { stateId: 'idle', label: 'Idle Stance', spritesheetId: 'sheet_korrath_main', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 8, loop: true },
      { stateId: 'walk', label: 'Walk Cycle', spritesheetId: 'sheet_korrath_main', startFrameIndex: 8, endFrameIndex: 15, frameRateFps: 12, loop: true, soundCue: 'sfx_footstep_soft' },
      { stateId: 'run', label: 'Sprint Dash', spritesheetId: 'sheet_korrath_main', startFrameIndex: 16, endFrameIndex: 21, frameRateFps: 16, loop: true, soundCue: 'sfx_footstep_heavy' },
      { stateId: 'jump', label: 'Airborne Rise', spritesheetId: 'sheet_korrath_main', startFrameIndex: 22, endFrameIndex: 24, frameRateFps: 10, loop: false, soundCue: 'sfx_jump_whoosh' },
      { stateId: 'attack', label: 'Blade Slash', spritesheetId: 'sheet_korrath_main', startFrameIndex: 25, endFrameIndex: 29, frameRateFps: 18, loop: false, soundCue: 'sfx_sword_slash' },
      { stateId: 'hurt', label: 'Stagger Impact', spritesheetId: 'sheet_korrath_main', startFrameIndex: 30, endFrameIndex: 31, frameRateFps: 8, loop: false, soundCue: 'sfx_grunt_hurt' }
    ]
  },
  {
    id: 'char_ashen_hunter',
    name: 'Ashen Outpost Hunter (Enemy Mob)',
    prefabType: 'enemy_mob',
    avatarIcon: '👹',
    spriteWidth: 64,
    spriteHeight: 64,
    tintColor: '#ef4444',
    baseScale: 1.1,
    states: ['patrol', 'alerted', 'combat', 'dead'],
    movement: {
      id: 'mov_ashen',
      name: 'Mob Patrol',
      movementType: 'ground_patrol',
      moveSpeed: 3.2,
      acceleration: 0.15,
      jumpForce: 8.0,
      gravityScale: 1.0,
      turnOnEdge: true,
      turnOnObstacle: true,
      sineFrequency: 1.0,
      sineAmplitude: 1.0,
      airControl: 0.4,
      trackNodeSpeed: 3
    },
    variables: [
      { id: 'var_ashen_hp', name: 'Max Health', category: 'attribute', type: 'number', isStatic: true, defaultValue: 150 },
      { id: 'var_ashen_patrol_spd', name: 'Patrol Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 2.2 },
      { id: 'var_ashen_chase_spd', name: 'Aggro Chase Speed', category: 'attribute', type: 'number', isStatic: false, defaultValue: 4.5 },
      { id: 'var_ashen_sight_rng', name: 'Vision Acquisition Range', category: 'attribute', type: 'number', isStatic: false, defaultValue: 220 }
    ],
    behaviorVariables: {
      var_ashen_hp: 150,
      var_ashen_patrol_spd: 2.2,
      var_ashen_chase_spd: 4.5,
      var_ashen_sight_rng: 220
    },
    rules: [
      {
        id: 'rule_ashen_sight',
        name: 'Sight Raycast Detection (Eyes Socket)',
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
          { id: 'act_alert_icon', actionType: 'emit_signal', signalType: 'alert_icon', signalRadiusPx: 100 },
          { id: 'act_state_combat', actionType: 'state_change', targetState: 'combat' },
          { id: 'act_chase_hero', actionType: 'move', moveMode: 'towards_target', speed: 4.5 },
          { id: 'act_anim_sprint', actionType: 'animation', animState: 'run' }
        ]
      },
      {
        id: 'rule_ashen_sound',
        name: 'Acoustic Footstep Hearing (Ears Socket)',
        enabled: true,
        trigger: {
          type: 'sound',
          sensoryTag: 'head_ears',
          hearingRadiusPx: 180,
          minNoiseLevel: 30
        },
        actions: [
          { id: 'act_state_alert', actionType: 'state_change', targetState: 'alerted' },
          { id: 'act_anim_idle', actionType: 'animation', animState: 'idle' }
        ]
      },
      {
        id: 'rule_ashen_melee',
        name: 'Melee Heavy Cleave in Close Range',
        enabled: true,
        trigger: {
          type: 'proximity',
          sensoryTag: 'torso_center',
          distancePx: 42,
          comparator: 'less_than'
        },
        actions: [
          { id: 'act_cleave', actionType: 'attack', attackType: 'melee_slash', telegraphWindupMs: 350 },
          { id: 'act_anim_atk', actionType: 'animation', animState: 'attack' }
        ]
      },
      {
        id: 'rule_ashen_patrol',
        name: 'Default Ledge Patrol',
        enabled: true,
        trigger: {
          type: 'state',
          requiredState: 'patrol'
        },
        actions: [
          { id: 'act_patrol_mov', actionType: 'move', moveMode: 'ground_patrol', speed: 2.2 },
          { id: 'act_anim_walk', actionType: 'animation', animState: 'walk' }
        ]
      }
    ],
    baseStats: { health: 150, energy: 50, stamina: 80, poise: 80, speed: 4 },
    capsule: {
      radius: 18,
      height: 48,
      offsetX: 0,
      offsetY: 0
    },
    spritesheets: [
      {
        id: 'sheet_ashen_main',
        name: 'Ashen Hunter Sheet (64x64)',
        tileWidth: 64,
        tileHeight: 64,
        cols: 8,
        rows: 4,
        totalFrames: 32
      }
    ],
    points: [
      { id: 'pt_eyes', name: 'Glowing Red Eyes', color: '#ef4444', defaultOffsetX: 12, defaultOffsetY: -16 },
      { id: 'pt_ears', name: 'Acoustic Horns', color: '#a855f7', defaultOffsetX: -2, defaultOffsetY: -22 },
      { id: 'pt_torso', name: 'Chest Armor Center', color: '#22c55e', defaultOffsetX: 0, defaultOffsetY: 0 },
      { id: 'pt_feet', name: 'Heavy Hooves', color: '#f59e0b', defaultOffsetX: 0, defaultOffsetY: 24 },
      { id: 'pt_weapon', name: 'Greatsword Tip', color: '#dc2626', defaultOffsetX: 20, defaultOffsetY: -4 }
    ],
    polygons: [
      {
        id: 'poly_ashen_body',
        name: 'Ashen Body Armor Hurtbox',
        type: 'hurtbox',
        color: '#22c55e',
        defaultVertices: [
          { x: -16, y: -26 },
          { x: 16, y: -26 },
          { x: 16, y: 26 },
          { x: -16, y: 26 }
        ]
      }
    ],
    sockets: [
      { tagId: 'head_eyes', label: 'Glowing Red Eyes', offsetX: 12, offsetY: -16, visualMarkerColor: '#ef4444' },
      { tagId: 'head_ears', label: 'Acoustic Horns', offsetX: -2, offsetY: -22, visualMarkerColor: '#a855f7' },
      { tagId: 'torso_center', label: 'Chest Armor Center', offsetX: 0, offsetY: 0, visualMarkerColor: '#22c55e' },
      { tagId: 'feet_ground', label: 'Heavy Hooves', offsetX: 0, offsetY: 24, visualMarkerColor: '#f59e0b' },
      { tagId: 'hand_weapon', label: 'Greatsword Tip', offsetX: 20, offsetY: -4, visualMarkerColor: '#dc2626' }
    ],
    animations: [
      { stateId: 'idle', label: 'Alert Guard Idle', spritesheetId: 'sheet_ashen_main', startFrameIndex: 0, endFrameIndex: 3, frameRateFps: 6, loop: true },
      { stateId: 'walk', label: 'Ledge Patrol Walk', spritesheetId: 'sheet_ashen_main', startFrameIndex: 8, endFrameIndex: 13, frameRateFps: 8, loop: true },
      { stateId: 'run', label: 'Charge Attack Sprint', spritesheetId: 'sheet_ashen_main', startFrameIndex: 16, endFrameIndex: 21, frameRateFps: 14, loop: true },
      { stateId: 'attack', label: 'Heavy Cleave', spritesheetId: 'sheet_ashen_main', startFrameIndex: 24, endFrameIndex: 29, frameRateFps: 15, loop: false }
    ]
  }
];

export const DEFAULT_PARTICLE_SYSTEMS: ParticleSystemData[] = [
  {
    id: 'particles_fire_embers',
    name: 'Infernal Campfire & Embers',
    category: 'environmental',
    description: 'Vibrant rising fiery sparks and molten embers with soft heat turbulence and atmospheric orange glow.',
    icon: '🔥',
    tintColor: '#f97316',
    emitter: {
      shape: 'box',
      width: 48,
      height: 8,
      radius: 24,
      emissionRate: 45,
      maxParticles: 200,
      duration: 0,
      loop: true,
      burstCount: 15,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.3,
      maxSpeed: 0.85,
      angleDeg: 270,
      spreadDeg: 40,
      gravityX: 4,
      gravityY: -25,
      drag: 0.985,
      windForce: 6,
      turbulenceJitter: 12,
      minAngularVelocity: -90,
      maxAngularVelocity: 90,
      angularDrag: 0.99
    },
    visuals: {
      shape: 'ember',
      minLifetime: 0.8,
      maxLifetime: 2.2,
      startSize: 6,
      endSize: 1.5,
      sizeCurve: 'shrink',
      startColor: '#fde047',
      startAlpha: 1.0,
      midColor: '#f97316',
      midAlpha: 0.85,
      endColor: '#dc2626',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 10
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.3,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_torch_flame',
    name: 'Torch Sconce Flame',
    category: 'environmental',
    description: 'Compact rising flame core with flickering yellow/orange sparks for dungeon wall braziers and torches.',
    icon: '🕯️',
    tintColor: '#eab308',
    emitter: {
      shape: 'point',
      width: 8,
      height: 8,
      radius: 10,
      emissionRate: 60,
      maxParticles: 150,
      duration: 0,
      loop: true,
      burstCount: 10,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.2,
      maxSpeed: 0.6,
      angleDeg: 270,
      spreadDeg: 25,
      gravityX: 0,
      gravityY: -45,
      drag: 0.97,
      windForce: 2,
      turbulenceJitter: 8,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      angularDrag: 1.0
    },
    visuals: {
      shape: 'glow_circle',
      minLifetime: 0.4,
      maxLifetime: 1.0,
      startSize: 12,
      endSize: 3,
      sizeCurve: 'shrink',
      startColor: '#fef08a',
      startAlpha: 0.95,
      midColor: '#f97316',
      midAlpha: 0.8,
      endColor: '#b91c1c',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 14
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.2,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_magic_sparkles',
    name: 'Arcane Celestial Sparkles',
    category: 'magic',
    description: 'Mystical glittering arcane stars floating outwards with ethereal purple, magenta, and cyan hues.',
    icon: '✨',
    tintColor: '#c084fc',
    emitter: {
      shape: 'circle',
      width: 32,
      height: 32,
      radius: 20,
      emissionRate: 35,
      maxParticles: 180,
      duration: 0,
      loop: true,
      burstCount: 25,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.15,
      maxSpeed: 0.55,
      angleDeg: 0,
      spreadDeg: 360,
      gravityX: 0,
      gravityY: -8,
      drag: 0.96,
      windForce: 0,
      turbulenceJitter: 14,
      minAngularVelocity: -120,
      maxAngularVelocity: 120,
      angularDrag: 0.98
    },
    visuals: {
      shape: 'star',
      customGlyph: '✦',
      minLifetime: 0.9,
      maxLifetime: 2.0,
      startSize: 9,
      endSize: 2,
      sizeCurve: 'bell',
      startColor: '#e879f9',
      startAlpha: 0.95,
      midColor: '#a855f7',
      midAlpha: 0.9,
      endColor: '#38bdf8',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 12
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.5,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_soul_motes',
    name: 'Ethereal Spirit Motes',
    category: 'magic',
    description: 'Haunting turquoise spirits and glowing soul orbs lazily drifting in ancient crypts and sanctums.',
    icon: '👻',
    tintColor: '#2dd4bf',
    emitter: {
      shape: 'box',
      width: 120,
      height: 40,
      radius: 30,
      emissionRate: 20,
      maxParticles: 100,
      duration: 0,
      loop: true,
      burstCount: 8,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.1,
      maxSpeed: 0.3,
      angleDeg: 270,
      spreadDeg: 70,
      gravityX: 0,
      gravityY: -12,
      drag: 0.99,
      windForce: 4,
      turbulenceJitter: 18,
      minAngularVelocity: -40,
      maxAngularVelocity: 40,
      angularDrag: 0.99
    },
    visuals: {
      shape: 'glow_circle',
      minLifetime: 1.5,
      maxLifetime: 3.5,
      startSize: 8,
      endSize: 14,
      sizeCurve: 'bell',
      startColor: '#a7f3d0',
      startAlpha: 0.0,
      midColor: '#2dd4bf',
      midAlpha: 0.85,
      endColor: '#0284c7',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 16
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.3,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_toxic_spores',
    name: 'Bioluminescent Spores',
    category: 'environmental',
    description: 'Floating fungal spores and toxic haze particles wafting gently from overgrown flora.',
    icon: '🍄',
    tintColor: '#22c55e',
    emitter: {
      shape: 'box',
      width: 160,
      height: 30,
      radius: 40,
      emissionRate: 25,
      maxParticles: 120,
      duration: 0,
      loop: true,
      burstCount: 12,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.08,
      maxSpeed: 0.25,
      angleDeg: 270,
      spreadDeg: 90,
      gravityX: 2,
      gravityY: -6,
      drag: 0.99,
      windForce: 5,
      turbulenceJitter: 15,
      minAngularVelocity: -30,
      maxAngularVelocity: 30,
      angularDrag: 0.99
    },
    visuals: {
      shape: 'smoke_puff',
      minLifetime: 1.8,
      maxLifetime: 4.0,
      startSize: 7,
      endSize: 16,
      sizeCurve: 'bell',
      startColor: '#86efac',
      startAlpha: 0.7,
      midColor: '#22c55e',
      midAlpha: 0.6,
      endColor: '#14532d',
      endAlpha: 0.0,
      blendMode: 'source-over',
      glowBlurRadius: 8
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.2,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_rain_storm',
    name: 'Heavy Downpour & Splashes',
    category: 'weather',
    description: 'High-speed vertical rain streaks with ground collision impacts and water droplet splashes.',
    icon: '🌧️',
    tintColor: '#38bdf8',
    emitter: {
      shape: 'box',
      width: 400,
      height: 10,
      radius: 100,
      emissionRate: 140,
      maxParticles: 400,
      duration: 0,
      loop: true,
      burstCount: 40,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 2.6,
      maxSpeed: 3.8,
      angleDeg: 85,
      spreadDeg: 6,
      gravityX: 15,
      gravityY: 150,
      drag: 0.995,
      windForce: 20,
      turbulenceJitter: 4,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      angularDrag: 1.0
    },
    visuals: {
      shape: 'spark_line',
      minLifetime: 0.6,
      maxLifetime: 1.2,
      startSize: 3,
      endSize: 2,
      sizeCurve: 'constant',
      startColor: '#e0f2fe',
      startAlpha: 0.8,
      midColor: '#7dd3fc',
      midAlpha: 0.6,
      endColor: '#0284c7',
      endAlpha: 0.2,
      blendMode: 'lighter',
      glowBlurRadius: 4
    },
    physics: {
      collideWithMapSolids: true,
      collisionRestitution: 0.4,
      destroyOnCollision: true,
      spawnCollisionSparks: true
    }
  },
  {
    id: 'particles_snow_blizzard',
    name: 'Glacial Blizzard Flurries',
    category: 'weather',
    description: 'Swirling crystalline snowflakes and frost particles drifting softly across cold mountain peaks.',
    icon: '❄️',
    tintColor: '#bae6fd',
    emitter: {
      shape: 'box',
      width: 400,
      height: 10,
      radius: 100,
      emissionRate: 50,
      maxParticles: 250,
      duration: 0,
      loop: true,
      burstCount: 20,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.25,
      maxSpeed: 0.65,
      angleDeg: 110,
      spreadDeg: 35,
      gravityX: -30,
      gravityY: 35,
      drag: 0.98,
      windForce: -25,
      turbulenceJitter: 22,
      minAngularVelocity: -80,
      maxAngularVelocity: 80,
      angularDrag: 0.98
    },
    visuals: {
      shape: 'glow_circle',
      customGlyph: '❄',
      minLifetime: 2.0,
      maxLifetime: 4.5,
      startSize: 5,
      endSize: 3,
      sizeCurve: 'shrink',
      startColor: '#ffffff',
      startAlpha: 0.9,
      midColor: '#e0f2fe',
      midAlpha: 0.75,
      endColor: '#7dd3fc',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 6
    },
    physics: {
      collideWithMapSolids: true,
      collisionRestitution: 0.1,
      destroyOnCollision: true,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_waterfall_mist',
    name: 'Waterfall Foam & Mist',
    category: 'environmental',
    description: 'Rapid downward water cascade bursting into soft rising spray and mist foam on water basins.',
    icon: '🌊',
    tintColor: '#06b6d4',
    emitter: {
      shape: 'line',
      width: 64,
      height: 4,
      radius: 20,
      emissionRate: 90,
      maxParticles: 300,
      duration: 0,
      loop: true,
      burstCount: 25,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 1.4,
      maxSpeed: 2.2,
      angleDeg: 90,
      spreadDeg: 15,
      gravityX: 0,
      gravityY: 180,
      drag: 0.99,
      windForce: 2,
      turbulenceJitter: 8,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      angularDrag: 1.0
    },
    visuals: {
      shape: 'bubble',
      minLifetime: 0.5,
      maxLifetime: 1.4,
      startSize: 5,
      endSize: 12,
      sizeCurve: 'grow',
      startColor: '#ecfeff',
      startAlpha: 0.9,
      midColor: '#67e8f9',
      midAlpha: 0.7,
      endColor: '#0891b2',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 8
    },
    physics: {
      collideWithMapSolids: true,
      collisionRestitution: 0.3,
      destroyOnCollision: true,
      spawnCollisionSparks: true
    }
  },
  {
    id: 'particles_void_portal',
    name: 'Void Singularity Vortex',
    category: 'magic',
    description: 'Swirling dark magenta and purple vortex particles collapsing inward toward an interdimensional rift.',
    icon: '🌀',
    tintColor: '#d946ef',
    emitter: {
      shape: 'ring',
      width: 48,
      height: 48,
      radius: 40,
      emissionRate: 60,
      maxParticles: 200,
      duration: 0,
      loop: true,
      burstCount: 30,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.4,
      maxSpeed: 0.9,
      angleDeg: 0,
      spreadDeg: 360,
      gravityX: 0,
      gravityY: 0,
      drag: 0.97,
      windForce: 0,
      turbulenceJitter: 16,
      minAngularVelocity: 180,
      maxAngularVelocity: 360,
      angularDrag: 0.99
    },
    visuals: {
      shape: 'diamond',
      minLifetime: 0.8,
      maxLifetime: 1.8,
      startSize: 10,
      endSize: 1,
      sizeCurve: 'shrink',
      startColor: '#f472b6',
      startAlpha: 1.0,
      midColor: '#c026d3',
      midAlpha: 0.9,
      endColor: '#4c1d95',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 16
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.5,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_explosion_nova',
    name: 'Shockwave Impact Blast',
    category: 'combat',
    description: 'Violent high-velocity radial detonation of sparks, fireball flash, and expanding smoke puff clouds.',
    icon: '💥',
    tintColor: '#ef4444',
    emitter: {
      shape: 'point',
      width: 8,
      height: 8,
      radius: 12,
      emissionRate: 0,
      maxParticles: 250,
      duration: 0.3,
      loop: false,
      burstCount: 80,
      burstInterval: 0,
      isContinuous: false
    },
    kinematics: {
      minSpeed: 0.8,
      maxSpeed: 2.8,
      angleDeg: 0,
      spreadDeg: 360,
      gravityX: 0,
      gravityY: 60,
      drag: 0.92,
      windForce: 0,
      turbulenceJitter: 20,
      minAngularVelocity: -180,
      maxAngularVelocity: 180,
      angularDrag: 0.95
    },
    visuals: {
      shape: 'spark_line',
      minLifetime: 0.3,
      maxLifetime: 1.0,
      startSize: 14,
      endSize: 2,
      sizeCurve: 'burst_shrink',
      startColor: '#fef08a',
      startAlpha: 1.0,
      midColor: '#f97316',
      midAlpha: 0.85,
      endColor: '#7f1d1d',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 18
    },
    physics: {
      collideWithMapSolids: true,
      collisionRestitution: 0.6,
      destroyOnCollision: false,
      spawnCollisionSparks: true
    }
  },
  {
    id: 'particles_dash_smoke',
    name: 'Dash & Jump Dust Puff',
    category: 'combat',
    description: 'Ground impact dust clouds and speed streak lines kicked up during rapid dashes and high jumps.',
    icon: '💨',
    tintColor: '#94a3b8',
    emitter: {
      shape: 'box',
      width: 20,
      height: 6,
      radius: 12,
      emissionRate: 0,
      maxParticles: 80,
      duration: 0.2,
      loop: false,
      burstCount: 20,
      burstInterval: 0,
      isContinuous: false
    },
    kinematics: {
      minSpeed: 0.2,
      maxSpeed: 0.7,
      angleDeg: 270,
      spreadDeg: 120,
      gravityX: 0,
      gravityY: -5,
      drag: 0.92,
      windForce: 0,
      turbulenceJitter: 10,
      minAngularVelocity: -60,
      maxAngularVelocity: 60,
      angularDrag: 0.95
    },
    visuals: {
      shape: 'smoke_puff',
      minLifetime: 0.4,
      maxLifetime: 0.8,
      startSize: 6,
      endSize: 18,
      sizeCurve: 'grow',
      startColor: '#e2e8f0',
      startAlpha: 0.7,
      midColor: '#94a3b8',
      midAlpha: 0.4,
      endColor: '#475569',
      endAlpha: 0.0,
      blendMode: 'source-over',
      glowBlurRadius: 4
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.2,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_celestial_nova',
    name: 'Celestial Radiance Nova',
    category: 'magic',
    description: 'Ascending golden light beams, holy radiance halos, and sparkling diamond stars for level-ups and relics.',
    icon: '🌟',
    tintColor: '#fbbf24',
    emitter: {
      shape: 'circle',
      width: 32,
      height: 32,
      radius: 24,
      emissionRate: 50,
      maxParticles: 200,
      duration: 0,
      loop: true,
      burstCount: 30,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.4,
      maxSpeed: 1.1,
      angleDeg: 270,
      spreadDeg: 60,
      gravityX: 0,
      gravityY: -30,
      drag: 0.97,
      windForce: 0,
      turbulenceJitter: 12,
      minAngularVelocity: -90,
      maxAngularVelocity: 90,
      angularDrag: 0.98
    },
    visuals: {
      shape: 'star',
      customGlyph: '✦',
      minLifetime: 0.8,
      maxLifetime: 2.2,
      startSize: 12,
      endSize: 3,
      sizeCurve: 'bell',
      startColor: '#ffffff',
      startAlpha: 1.0,
      midColor: '#fde047',
      midAlpha: 0.9,
      endColor: '#d97706',
      endAlpha: 0.0,
      blendMode: 'lighter',
      glowBlurRadius: 16
    },
    physics: {
      collideWithMapSolids: false,
      collisionRestitution: 0.3,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
  },
  {
    id: 'particles_acid_goo',
    name: 'Toxic Slime Dripper',
    category: 'environmental',
    description: 'Viscous, glowing liquid slime droplets dripping and bouncing with toxic green aura.',
    icon: '🧪',
    tintColor: '#22c55e',
    emitter: {
      shape: 'circle',
      width: 32,
      height: 32,
      radius: 28,
      emissionRate: 45,
      maxParticles: 150,
      duration: 0,
      loop: true,
      burstCount: 20,
      burstInterval: 0,
      isContinuous: true
    },
    kinematics: {
      minSpeed: 0.3,
      maxSpeed: 0.85,
      angleDeg: 90,
      spreadDeg: 40,
      gravityX: 0,
      gravityY: 120,
      drag: 0.98,
      windForce: 0,
      turbulenceJitter: 12,
      minAngularVelocity: 0,
      maxAngularVelocity: 0,
      angularDrag: 1.0
    },
    visuals: {
      shape: 'glow_circle',
      minLifetime: 1.0,
      maxLifetime: 2.5,
      startSize: 18,
      endSize: 28,
      sizeCurve: 'bell',
      startColor: '#86efac',
      startAlpha: 0.9,
      midColor: '#22c55e',
      midAlpha: 0.85,
      endColor: '#15803d',
      endAlpha: 0.0,
      blendMode: 'source-over',
      glowBlurRadius: 18
    },
    physics: {
      collideWithMapSolids: true,
      collisionRestitution: 0.5,
      destroyOnCollision: false,
      spawnCollisionSparks: false
    }
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

  // Behavior files
  const behaviors: BehaviorFile[] = DEFAULT_BEHAVIORS.map(b => ({
    id: b.id,
    name: b.name,
    fileName: `${b.id.replace('beh_', '')}.behavior`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    behaviorData: b
  }));

  // Prefab files
  const prefabs: PrefabFile[] = DEFAULT_PREFABS.map(c => ({
    id: c.id,
    name: c.name,
    fileName: `${c.id.replace('char_', '')}.prefab`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    prefabData: c
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

  // Particle System files
  const particles: ParticleSystemFile[] = DEFAULT_PARTICLE_SYSTEMS.map(p => ({
    id: p.id,
    name: p.name,
    fileName: `${p.id.replace('particles_', '')}.particle`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    particleData: p
  }));

  return {
    id: `proj_${Date.now()}`,
    name,
    description: '2D Metroidvania world with modular maps, biomes, prefabs, behaviors, particles, UI themes, and game structure framework.',
    author: 'Mason Architect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    engineVersion: MASON_VERSION_DISPLAY,
    activeModule: 'maps',
    activeFiles: {
      mapFileName: 'ashen_outpost.map',
      biomeFileName: 'mourne_ashen_steppes.biome',
      prefabFileName: 'korrath.prefab',
      uiFileName: 'classic_gothic_hud.ui',
      gameStructureFileName: 'main_campaign.gamestructure',
      behaviorFileName: 'ashen_hunter.behavior',
      particleFileName: 'fire_embers.particle',
      spriteFileName: 'hero_character.sprite'
    },
    fileSystem: {
      maps: [map1, map2, map3],
      biomes,
      prefabs,
      ui: uiThemes,
      game: gameStructures,
      behaviors,
      particles,
      sprites: [
        {
          id: 'sprite_hero_character',
          name: 'Hero Character',
          fileName: 'hero_character.sprite',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          spriteData: null
        }
      ]
    },
    taskBoard: createDefaultTaskBoard()
  };
};
