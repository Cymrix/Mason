import { 
  MasonProject, 
  MapFile, 
  BiomeFile, 
  UIThemeFile, 
  GameStructureFile, 
  ParticleSystemFile, 
  BehaviorFile, 
  PrefabFile,
  Model3DFile,
  Scene3DFile,
  TerrainFile,
  MultiplayerFile,
  createDefaultMapFile,
  createDefaultScene3DFile,
  createDefaultModel3DFile,
  createDefaultTerrainFile,
  createDefaultMultiplayerFile,
  createDefaultGameStructure,
  DEFAULT_UI_THEMES,
  DEFAULT_PARTICLE_SYSTEMS,
  DEFAULT_BEHAVIORS,
  DEFAULT_PREFABS,
  ProjectTaskBoardData,
  DEFAULT_TASK_CATEGORIES,
  DEFAULT_TASK_BOARD_MEMBERS
} from './masonProjectSchema';
import { INITIAL_REFINED_BIOMES } from './refinedBiomes';
import { MASON_VERSION_DISPLAY } from '../version';

export type GenreArchetypeId = 
  | 'metroidvania'
  | 'stealth_action'
  | 'action_adventure_3d'
  | 'soulslike_shooter'
  | 'mmofps_looter'
  | 'coop_horde_fps'
  | 'mmo_rpg_3d'
  | 'fps_tps'
  | 'vehicular_combat'
  | 'vehicular_demolition'
  | 'racing_circuit'
  | 'rts'
  | 'action_rpg'
  | 'tactical_rpg'
  | 'flight_sim'
  | 'twin_stick'
  | 'brawler'
  | 'survival_craft'
  | 'tower_defense';

export type DimensionOption = '2d' | '2.5d' | '3d';

export type MultiplayerTopologyOption = 
  | 'singleplayer'
  | 'local_couch'
  | 'p2p_coop'
  | 'dedicated_hub'
  | 'mmo_mesh';

export interface GenreArchetypeDefinition {
  id: GenreArchetypeId;
  name: string;
  category: 'Action & Combat' | 'Vehicular & Driving' | 'Strategy & Tactics' | 'RPG & Simulation';
  shortTag: string;
  tagline: string;
  inspiration: string;
  badge: string;
  iconName: string;
  accentColor: string; // e.g. indigo, cyan, emerald, amber, rose, purple
  supportedDimensions: DimensionOption[];
  defaultDimension: DimensionOption;
  supportedMultiplayer: MultiplayerTopologyOption[];
  defaultMultiplayer: MultiplayerTopologyOption;
  recommendedControls: string;
  keyMechanics: string[];
  suggestedTitles: string[];
}

export const GENRE_ARCHETYPES: GenreArchetypeDefinition[] = [
  {
    id: 'action_adventure_3d',
    name: '3D Action-Adventure & Dungeon Quest',
    category: 'Action & Combat',
    shortTag: 'Action Adventure',
    tagline: 'Third-person over-the-shoulder & orbit camera, Z-targeting lock-on, sword/shield melee, rolling, ledge climbing, and environmental dungeon puzzles.',
    inspiration: 'The Legend of Zelda, Tomb Raider, Dark Souls, Shadow of the Colossus',
    badge: 'NEW ARCHETYPE',
    iconName: 'Sword',
    accentColor: 'emerald',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop', 'local_couch'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'WASD to Move & Climb, Space to Roll / Vault, Left-Click for Sword Slash Combo, Right-Click / L-Shift for Lock-On Focus Target, E to Interact / Push Block, Q to Aim Bow / Hookshot',
    keyMechanics: [
      'Z-Targeting & Lock-On Camera: Dynamic reticle anchoring camera to targeted foes or interactables with strafe locomotion',
      'Melee Combos & Shield Parry: 3-hit light/heavy slashing chain, directional shield block, and timed parry stun counters',
      'Environmental Dungeon Puzzles: Pressure plates, pushable stone blocks, lit torches, crystal switches, and locked boss doors',
      'Ledge Grab, Vaulting & Climbing: Wall-surface stamina climbing, mantle ledge pulls, and tightrope balance',
      'Exploration Item Arsenal: Hookshot/grapple, bomb satchels, bow & arrow projectile aiming, and heart container health capacity'
    ],
    suggestedTitles: [
      'Echoes of the Forgotten Shrine',
      'Tomb of the Sunken Citadel',
      'Aethelgard: The Ancient Relic',
      'Chronicles of the Sky Temple'
    ]
  },
  {
    id: 'soulslike_shooter',
    name: 'Third-Person Soulslike Shooter (Gun-Soulslike)',
    category: 'Action & Combat',
    shortTag: 'TPS Soulslike',
    tagline: 'Tight over-the-shoulder gunplay, Dragon Heart healing flasks, stamina i-frame dodges, World Stone checkpoints, and procedural dungeon worlds.',
    inspiration: 'Remnant: From the Ashes, Remnant 2, Returnal, Outriders',
    badge: 'NEW ARCHETYPE',
    iconName: 'Flame',
    accentColor: 'amber',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['p2p_coop', 'mmo_mesh', 'dedicated_hub', 'singleplayer'],
    defaultMultiplayer: 'p2p_coop',
    recommendedControls: 'WASD to Move, Shift to Sprint, Space for Stamina Dodge Roll (i-frames), Right-Click Hold to ADS Aim, Left-Click to Shoot, Q for Relic Heal Flask, E for Weapon Mod, 1-3 to Switch Long Gun / Handgun / Melee',
    keyMechanics: [
      'World Stone Checkpoints: Interacting rests at the crystal shard, refilling Relic charges and ammo while respawning all world enemies',
      'Dragon Heart Relic Economy: Finite healing relic charges with timed swig animation vulnerability and upgradeable capacity',
      'Stamina & i-Frame Dodge Roll: Precise invulnerability window dodging against punishing boss telegraphs, sweeps, and projectile waves',
      'Weapon Mod Generation: Gunshots fill elemental mod charge meters to trigger summon minions, caustic rounds, beam cannons, or barrier shields',
      'Procedural Biome Tile Stitching: Dynamic world seeds re-rolling multi-realm dungeons, inject events, and alternate boss encounters',
      'Seamless 1–3 Player Co-Op & MMO World: Drop-in peer-to-peer co-op or shared MMO mesh with dynamic enemy health/damage scaling and shared boss rewards'
    ],
    suggestedTitles: [
      'Ashen Core: Beyond the Stones',
      'Riftfall: Remnants of the Realm',
      'Rootbreaker: Chronicles of Yaesha',
      'Voidshard: The Broken World'
    ]
  },
  {
    id: 'mmofps_looter',
    name: 'Shared-World MMOFPS & Looter-Shooter',
    category: 'RPG & Simulation',
    shortTag: 'MMOFPS Looter',
    tagline: 'Massively multiplayer first-person shooting, shared patrol worlds, public anomaly events, strike dungeon matchmaking, and exotic gear chase.',
    inspiration: 'Destiny 2, PlanetSide 2, The Division, Warframe, Defiance',
    badge: 'NEW ARCHETYPE',
    iconName: 'Radio',
    accentColor: 'cyan',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['mmo_mesh', 'dedicated_hub', 'p2p_coop'],
    defaultMultiplayer: 'mmo_mesh',
    recommendedControls: 'WASD to Move, Shift to Sprint, Space to Double Jump / Glide, Left-Click to Shoot, Right-Click to ADS, F for Super Ability, C for Class Melee, G for Grenade, 1-3 for Kinetic / Energy / Heavy Weapons, M for Planetary Map',
    keyMechanics: [
      'Shared-World Spatial Patrol Zones: Seamless world chunk transitions with live public events (Warsat drops, Anomaly breaches, World Bosses)',
      '3-Weapon Loadout Matrix: Kinetic Primary (Auto-Rifle/Hand Cannon), Energy Special (Shotgun/Fusion), and Heavy Power (Rocket Launcher/Sword)',
      'Subclass & Super Cooldowns: Elemental energy attunement (Solar, Arc, Void) with charged super abilities and grenade synergies',
      'Strike & Raid Matchmaking: 3-player Strike instances with boss checkpoint gates and 6-player mechanical puzzle raid dungeons',
      'Tiered Exotic Loot Rarity: Common, Rare, Legendary, and Exotic weapons with distinct intrinsic perks and cosmetic masterworks',
      'Power Level Gear Rating: Arithmetic power level average driving damage scaling and high-tier endgame raid entry gates'
    ],
    suggestedTitles: [
      'Solaris Vanguard: Frontier Zero',
      'Aetherbound: Eclipse Sector',
      'Cosmic Protocol: Iron Banner',
      'Chronos Void: Fireteam Delta'
    ]
  },
  {
    id: 'coop_horde_fps',
    name: 'First-Person Horde & Co-Op Objective Shooter',
    category: 'Action & Combat',
    shortTag: 'Horde Co-Op FPS',
    tagline: 'First-person weapon viewmodel, wave-based zombie/alien horde swarms, class perk roles, barricade welding, and objective extraction.',
    inspiration: 'Half-Life 2, Killing Floor 2, Left 4 Dead, Team Fortress 2, Warhammer: Vermintide',
    badge: 'NEW ARCHETYPE',
    iconName: 'Skull',
    accentColor: 'rose',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['p2p_coop', 'dedicated_hub', 'singleplayer'],
    defaultMultiplayer: 'p2p_coop',
    recommendedControls: 'WASD to Move, Left-Click to Shoot, Right-Click to ADS Iron Sights, R to Reload, F for Flashlight, E to Weld Door / Revive Ally, 1-4 for Weapons / Medical Syringe',
    keyMechanics: [
      'Cooperative Horde Waves: Escalating swarm rounds with elite specials (chargers, spitters, sirens) and inter-round trader bench',
      'Environmental Physics & Interaction: Physics objects for barricading doorways, gravity manipulation, and valve switches',
      'Class Synergy & Perk Loadouts: Support (ammo/welding), Medic (healing darts), Assault (dps), and Demolitionist (explosives)',
      'Bleedout Down-State & Defibrillator: Teammate incapacitated rescue window, revive syringes, and dynamic respawn closets',
      'Objective Hold & Extraction: Fuel pump defense, payload push, elevator survival hold, and chopper evac escape'
    ],
    suggestedTitles: [
      'Outbreak Sector: Dead Wave',
      'Quarantine Protocol: Zero Evac',
      'Black Mesa: Breach Division',
      'Scourge Survivors: Hold the Line'
    ]
  },
  {
    id: 'mmo_rpg_3d',
    name: '3D MMORPG & Persistent World RPG',
    category: 'RPG & Simulation',
    shortTag: 'MMORPG',
    tagline: 'Third-person free camera, tab-targeting reticle, Global Cooldown (GCD) spell hotbars, NPC quest exclamation marks, equipment paper dolls, and raid frames.',
    inspiration: 'World of Warcraft, Final Fantasy XIV, Guild Wars 2, RuneScape',
    badge: 'NEW ARCHETYPE',
    iconName: 'Crown',
    accentColor: 'indigo',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['mmo_mesh', 'dedicated_hub', 'singleplayer'],
    defaultMultiplayer: 'mmo_mesh',
    recommendedControls: 'WASD or Right-Click Hold to Steer, Tab to Cycle Targets, 1-8 for GCD Action Hotbar, M for World Map, C for Character Paper Doll, L for Quest Log',
    keyMechanics: [
      'Tab-Targeting & Threat Aggro Table: Target selection bracket, line-of-sight checks, and enemy aggro threat meters for Tank/Healer/DPS trinity',
      'GCD Hotbar Rotation & Cast Bars: Instant casts vs timed incantations, interrupts, mana pools, and buff/debuff aura frames',
      'NPC Quest Hubs & Dialogue: Floating exclamation marks (!), quest turn-in question marks (?), multi-step objective trackers, and reward picks',
      'Full Equipment Paper Doll: Head, Shoulders, Chest, Legs, Main Hand, Off-Hand slots with stat scaling (Strength, Agility, Intellect)',
      'Multiplayer Spatial Mesh & Party Raid UI: Spatial chunk synchronization, 5-player party frames, 20-player raid health bars, and guild chat'
    ],
    suggestedTitles: [
      'Chronicles of Azeria: Awakening',
      'Realm of the Astral Vanguard',
      'Eldoria Online: Realm War',
      'Legacy of the Shattered Throne'
    ]
  },
  {
    id: 'stealth_action',
    name: 'Stealth Ninja & Infiltrator',
    category: 'Action & Combat',
    shortTag: 'Stealth Action',
    tagline: 'Vertical grappling hook locomotion, dynamic vision cones, noise rings, and one-hit stealth executions.',
    inspiration: 'Tenchu: Stealth Assassins, Mark of the Ninja, Metal Gear Solid',
    badge: 'NEW ARCHETYPE',
    iconName: 'Eye',
    accentColor: 'rose',
    supportedDimensions: ['3d', '2d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop', 'local_couch'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'WASD to Sneak / Sprint, Space to Jump, F for Grappling Hook, E for Silent Assassination, Q for Shuriken',
    keyMechanics: [
      'Ki Proximity Awareness Radar: Real-time detection distance and alert stage (? Suspicious, !! Alerted)',
      'Grappling Hook: Aim and fire hook to zip onto rooftops, high beams, and wall ledges',
      'Vision Cones & Hearing Rings: Guard flashlights and footstep acoustic radiuses with line-of-sight checks',
      'One-Hit Stealth Execution: High-damage execution cinematic when approaching unaware guards from behind',
      'Shadow Concealment: Concealment volumes in dark corners and bamboo brush'
    ],
    suggestedTitles: [
      'Shadow of Kurogane: Nightfall',
      'Shinobi Protocol: Eclipse',
      'Silent Blade: Blood Moon',
      'Specter of the Shogun'
    ]
  },
  {
    id: 'vehicular_combat',
    name: 'Vehicular Combat Arena',
    category: 'Vehicular & Driving',
    shortTag: 'Car Combat',
    tagline: 'Armored combat buggies, high-impact ramming physics, mounted cannons, nitro boosts, and demolition arena.',
    inspiration: 'Twisted Metal, Vigilante 8, Carmageddon',
    badge: 'NEW ARCHETYPE',
    iconName: 'Flame',
    accentColor: 'amber',
    supportedDimensions: ['3d', '2.5d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['dedicated_hub', 'local_couch', 'p2p_coop', 'singleplayer'],
    defaultMultiplayer: 'dedicated_hub',
    recommendedControls: 'W/S for Throttle & Reverse, A/D for Steering, Space for Handbrake Drift, Left-Click for Cannons, Right-Click for Homing Missiles, Shift for Nitro Boost',
    keyMechanics: [
      'Momentum-Based Ramming: Kinetic collision damage calculated from relative velocity and vehicle armor tiers',
      'Mounted Weapon Systems: Dual frontal Gatling cannons with rotating homing missile racks and rear drop-mines',
      'Arena Floating Pickups: Respawning health repair wrenches, nitro tanks, and missile ammunition crates',
      'Demolition Coliseum: Perimeter death barriers, jump ramps, explosive barrels, and hazard crushers',
      'Multi-Vehicle Destruction Scoring: Deathmatch killfeed, multi-kill multipliers, and revenge bounties'
    ],
    suggestedTitles: [
      'Wasteland Carnage: Turbo Arena',
      'Overdrive Coliseum: Apocalypse',
      'Steel Vengeance: Road Wars',
      'Diesel Havoc: Demolition Derby'
    ]
  },
  {
    id: 'vehicular_demolition',
    name: 'Top-Down Vehicular Demolition',
    category: 'Vehicular & Driving',
    shortTag: 'Demolition Puzzle',
    tagline: 'Vehicle switching, heavy machinery destruction physics, crumbling obstacles, and ticking hazard route clearance.',
    inspiration: 'Blast Corps, Renegade Ops',
    badge: 'NEW ARCHETYPE',
    iconName: 'Wrench',
    accentColor: 'yellow',
    supportedDimensions: ['2.5d', '3d'],
    defaultDimension: '2.5d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop', 'local_couch'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'WASD to Steer, Space for Machine Special (Ram / Slide Tackle / Smash), E to Exit & Switch Vehicles',
    keyMechanics: [
      'Multi-Machine Fleet Switching: Exit driver seat and commandeer heavy Bulldozers, Dump Trucks, or Mechs',
      'Destructible Modular Structures: Fracturable concrete and brick obstacle buildings with kinetic impact thresholds',
      'Convoy Ticking Route Hazard: Automated transport drone following path; failure triggered on collision',
      'Debris Pushing & Trench Filling: Bulldozer physics to push rubble into gap trenches to build bridges',
      'Time Attack & Gold Demolition Medals: Clearing percentage, speed bonus, and bonus civilian rescue counters'
    ],
    suggestedTitles: [
      'Core Clearance Unit: Hazard Zone',
      'Breach Corps: Urban Demolition',
      'Groundshaker: Rapid Transit',
      'Rubble Runners: Heavy Clearance'
    ]
  },
  {
    id: 'metroidvania',
    name: 'Metroidvania Action Platformer',
    category: 'Action & Combat',
    shortTag: 'Metroidvania',
    tagline: 'Interconnected 2D sidescroller strata rooms, autotiling, coyote-time jumps, dash abilities, and boss encounters.',
    inspiration: 'Super Metroid, Hollow Knight, Castlevania: Symphony of the Night',
    badge: 'CLASSIC MASON',
    iconName: 'Map',
    accentColor: 'cyan',
    supportedDimensions: ['2d'],
    defaultDimension: '2d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop', 'local_couch'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'A/D to Walk, Space to Jump, Shift to Dash, J for Melee Slash, K for Ranged Magic projectile',
    keyMechanics: [
      '7-Layer Parallax Strata: Deep atmospheric horizons (-5 skybox to +1 foreground occlusion)',
      'Strict Platformer Physics: 0.15s coyote time, 0.15s jump buffering, 20px step height, and ground snapping',
      'Ability Gate Progression: Double jump, wall cling, and dash unlocks to open sealed room doors',
      'Strata Autotiling & Map Macro: Real-time terrain borders and cellular room generation',
      'Metroidvania World Grid: Multi-room interconnected map matrix (.map files)'
    ],
    suggestedTitles: [
      'Ashen Echoes of the Void',
      'Luminescent Chasm: Hollow Strata',
      'Vespera: Nocturne of the Forsaken',
      'Riftwalker: Crystal Depths'
    ]
  },
  {
    id: 'fps_tps',
    name: 'FPS / TPS Combat Arena',
    category: 'Action & Combat',
    shortTag: 'Shooter Arena',
    tagline: 'First/Third-person shooter combat with hitscan/projectile raycasting, weapon recoil, and weapon pickup spawners.',
    inspiration: 'Quake III Arena, DOOM, Unreal Tournament',
    badge: 'FAST PACED',
    iconName: 'Crosshair',
    accentColor: 'indigo',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['dedicated_hub', 'p2p_coop', 'local_couch', 'singleplayer'],
    defaultMultiplayer: 'dedicated_hub',
    recommendedControls: 'WASD to Move, Mouse Look, Left-Click to Shoot, Right-Click to ADS, R to Reload, 1-4 to Switch Weapons',
    keyMechanics: [
      'Hitscan & Projectile Physics: Raycast bullet tracing, ballistic rocket trajectories, and blast radius falloff',
      'Camera Dual Modes: Seamless 1st-Person perspective and 3rd-person over-the-shoulder perspective',
      'Weapon Arsenal: Assault rifle (rapid fire), rocket launcher (splash), shotgun (spread), and plasma rifle',
      'Arena Movement Physics: Bunny hopping acceleration, jump pads, teleporters, and armor shards',
      'Target Practice Bot AI: Roaming target bots with pathfinding, combat states, and respawn loops'
    ],
    suggestedTitles: [
      'Hyperion: Sector 7 Quarantine',
      'Nexus Arena: Frag Protocol',
      'Vortex Breach: Zero Hour',
      'Titan Outpost: Deathmatch'
    ]
  },
  {
    id: 'racing_circuit',
    name: 'Racing & Driving Simulator',
    category: 'Vehicular & Driving',
    shortTag: 'Circuit Racing',
    tagline: 'Track physics, tire grip friction, drifting curves, checkpoint gates, and telemetry ghost speedruns.',
    inspiration: 'Ridge Racer, F-Zero, Mario Kart',
    badge: 'PRECISION DRIVING',
    iconName: 'Gauge',
    accentColor: 'purple',
    supportedDimensions: ['3d', '2.5d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['dedicated_hub', 'local_couch', 'p2p_coop', 'singleplayer'],
    defaultMultiplayer: 'dedicated_hub',
    recommendedControls: 'W/Up for Gas, S/Down for Brakes, A/D for Steering, Space for Drift Slide, Shift for Turbo Boost',
    keyMechanics: [
      'Wheel Torque & Drift Mechanics: Slip angle calculation, counter-steering torque, and drift boost charge',
      'Checkpoint Sequence Verification: Strict gate order validation to prevent shortcut exploitation',
      'Asynchronous Telemetry Ghost: Record player lap telemetry and replay translucent rival ghost racers',
      'Dynamic Track Surface Strata: High-friction asphalt, sliding gravel, and puddle hydroplaning areas',
      'Split-Screen & P2P Grid: 2–4 quadrant multi-camera views with real-time lap leaderboard'
    ],
    suggestedTitles: [
      'Apex Horizon: Grand Prix',
      'Neon Slipstream 2099',
      'Formula Velocity: Asphalt Pro',
      'Redline Drift: Midnight Run'
    ]
  },
  {
    id: 'rts',
    name: 'Real-Time Strategy (RTS)',
    category: 'Strategy & Tactics',
    shortTag: 'RTS & Command',
    tagline: 'Drag-box multi-unit selection, resource harvesting, base construction, and fog-of-war exploration.',
    inspiration: 'StarCraft, Command & Conquer, Age of Empires',
    badge: 'STRATEGY',
    iconName: 'Shield',
    accentColor: 'blue',
    supportedDimensions: ['2.5d', '3d'],
    defaultDimension: '2.5d',
    supportedMultiplayer: ['dedicated_hub', 'p2p_coop', 'singleplayer'],
    defaultMultiplayer: 'dedicated_hub',
    recommendedControls: 'Left-Click Drag to Select Box, Right-Click to Move/Attack, Middle-Click to Pan, 1-9 for Control Groups',
    keyMechanics: [
      'Multi-Unit Selection Box: Canvas drag-selection with marquee box, unit formations, and waypoint pathing',
      'Harvesting & Economy Cycle: Harvester drones collecting crystals/gas returning to Command Center',
      'Building Placement Grid: Snap-to-grid structure placement (Barracks, Turrets, Power Plants)',
      'Fog-of-War Grid Mask: Explored terrain memory vs real-time vision radii of active units',
      'Combat Formations & Aggro AI: Attack-move orders, patrol loops, and ranged projectile exchanges'
    ],
    suggestedTitles: [
      'Iron Vanguard: Dominion Wars',
      'ExoCommand: Sigma Sector',
      'Sovereign Front: Total War',
      'Colony Strike: Zero Resource'
    ]
  },
  {
    id: 'action_rpg',
    name: 'Action RPG / Hack & Slash',
    category: 'RPG & Simulation',
    shortTag: 'Action RPG',
    tagline: 'Top-down dungeon crawling, dodge-roll stamina bar, hotbar ability cooldowns, and tiered loot tables.',
    inspiration: 'Diablo, Hades, Path of Exile',
    badge: 'LOOT & COMBAT',
    iconName: 'Sparkles',
    accentColor: 'emerald',
    supportedDimensions: ['2.5d', '3d'],
    defaultDimension: '2.5d',
    supportedMultiplayer: ['p2p_coop', 'dedicated_hub', 'singleplayer'],
    defaultMultiplayer: 'p2p_coop',
    recommendedControls: 'Click or WASD to Move, Space to Dodge Roll, Left-Click for Basic Attack, 1-4 for Spells & Abilities',
    keyMechanics: [
      'Twin-Stick / Click-to-Move Combat: Directional sword strikes, fireball projectiles, and whirlwinds',
      'Stamina & Dodge Invulnerability: Dodge roll with brief i-frames and stamina recovery cooldown',
      'Tiered Loot Drop Engine: Common, Rare, Epic, Legendary item drops with randomized stat prefixes',
      'Dungeon Room Spawners: Monster packs with elite affixes (Fast, Frozen, Molten explosion on death)',
      'Hotbar Ability Architecture: Mana costs, cast times, area-of-effect ground indicators, and buffs'
    ],
    suggestedTitles: [
      'Chasm of the Damned: Infernal Depths',
      'Soulbound: Realm of Ash',
      'Arcane Vanguard: Dungeon Lords',
      'Eldritch Siege: Voidfall'
    ]
  },
  {
    id: 'tactical_rpg',
    name: 'Turn-Based Tactical RPG',
    category: 'RPG & Simulation',
    shortTag: 'Tactical Grid',
    tagline: 'Initiative turn queue, tile movement range, action point (AP) economy, and elemental affinity combat.',
    inspiration: 'Final Fantasy Tactics, Fire Emblem, XCOM',
    badge: 'TURN BASED',
    iconName: 'Grid',
    accentColor: 'purple',
    supportedDimensions: ['2.5d', '3d'],
    defaultDimension: '2.5d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop', 'local_couch'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'Mouse Click to Select Tile / Action, 1-4 to Choose Attack / Skill / Item / Wait',
    keyMechanics: [
      'Turn Order Timeline: Speed-stat determined initiative sequence displaying upcoming actor turns',
      'Movement & Attack Reach Grid: Breadth-first reach pathfinding accounting for terrain height and obstacles',
      'Action Point (AP) Budget: Movement AP vs Action AP with end-turn confirmations',
      'Directional Advantage & Cover: Flanking / backstab critical strike multipliers and half/full cover shields',
      'Status Effects & Elemental Matrix: Burn, Freeze, Stun, and elemental rock-paper-scissors affinities'
    ],
    suggestedTitles: [
      'Chronicles of Valens: Tactics',
      'Iron Decree: War of Crowns',
      'Aether Grid: Knights of Light',
      'Tactics Vanguard: Final Gambit'
    ]
  },
  {
    id: 'flight_sim',
    name: 'Flight & Space Dogfight Sim',
    category: 'Vehicular & Driving',
    shortTag: 'Space Dogfight',
    tagline: '6DOF pitch/yaw/roll flight aerodynamics, cockpit HUD, homing missiles, afterburners, and asteroid dogfights.',
    inspiration: 'Star Wars: Squadrons, Ace Combat, Wing Commander',
    badge: '6DOF AERODYNAMICS',
    iconName: 'Compass',
    accentColor: 'cyan',
    supportedDimensions: ['3d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['dedicated_hub', 'p2p_coop', 'singleplayer'],
    defaultMultiplayer: 'dedicated_hub',
    recommendedControls: 'W/S for Pitch, A/D for Roll, Q/E for Yaw Rudder, Space for Afterburner Boost, Left-Click for Blasters, Right-Click for Missile Lock',
    keyMechanics: [
      'True 6-Degrees-of-Freedom Physics: Quaternion angular torque, inertia dampening, and velocity vectors',
      'Cockpit Target Lock-On HUD: Lead-target aim reticle calculation based on target speed and distance',
      'Weapon Energy Management: Power divert between Shields, Blaster Engines, and Thruster Boosters',
      'Homing Missile Tracking: Proportional navigation missiles that chase enemy thruster heat signatures',
      'Volumetric Space Debris: High-speed asteroid canyon weaving with collision impact shields'
    ],
    suggestedTitles: [
      'Solar Wing: Void Corsairs',
      'Omega Squadron: Deep Space',
      'Starfall Aces: Strike Vector',
      'Nebula Vanguard: Zero-G'
    ]
  },
  {
    id: 'twin_stick',
    name: 'Twin-Stick Bullet Hell',
    category: 'Action & Combat',
    shortTag: 'Bullet Hell',
    tagline: 'Independent 360° aiming, massive swarms of hundreds of enemies, weapon stacking, and gem collection upgrades.',
    inspiration: 'Vampire Survivors, Enter the Gungeon, Geometry Wars',
    badge: 'SWARM SURVIVAL',
    iconName: 'Zap',
    accentColor: 'rose',
    supportedDimensions: ['2d', '2.5d'],
    defaultDimension: '2d',
    supportedMultiplayer: ['singleplayer', 'local_couch', 'p2p_coop'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'WASD to Move, Mouse 360° to Aim & Auto-Shoot, Space to Trigger Screen Bomb',
    keyMechanics: [
      'High-Performance Projectile Pooling: Hundreds of simultaneous bullet entities with zero garbage-collection stutter',
      'Flocking Enemy Swarms: Hundreds of chaser enemies with separation/cohesion vector steering behaviors',
      'Experience Magnet & Level-Up: Defeated enemies drop XP gems; collecting them triggers 3-card upgrade choices',
      'Weapon Synergy Evolutions: Combining elemental weapons with passive stat charms for super abilities',
      'Ticking Survival Timer: 15-minute survival timer with escalating enemy density and screen-clearing boss waves'
    ],
    suggestedTitles: [
      'Necro Horde: 20 Minutes Left',
      'Void Survivors: Bullet Cascade',
      'Neon Swarm: Cyber Surge',
      'Relic Storm: Vampire Abyss'
    ]
  },
  {
    id: 'brawler',
    name: 'Platformer Arena Brawler',
    category: 'Action & Combat',
    shortTag: 'Arena Brawler',
    tagline: 'Knockback scaling with damage percentage, aerial combos, ledge recovery, and blast-zone ringouts.',
    inspiration: 'Super Smash Bros, Brawlhalla, Rivals of Aether',
    badge: 'PARTY COMBAT',
    iconName: 'Users',
    accentColor: 'indigo',
    supportedDimensions: ['2d', '2.5d'],
    defaultDimension: '2d',
    supportedMultiplayer: ['local_couch', 'p2p_coop', 'dedicated_hub'],
    defaultMultiplayer: 'local_couch',
    recommendedControls: 'A/D to Run, Space to Jump, Double Jump, J for Normal Attack, K for Special Attack, L for Shield / Air Dodge',
    keyMechanics: [
      'Damage % Knockback Scaling: Higher damage percentage increases launch velocity and knockback arc',
      'Blast-Zone Boundary Ringouts: Off-screen death zones with screen-shake zoom tracking the active fight',
      'Aerial Directional Combos: Neutral-air, forward-air, down-air spike, and up-air recovery moves',
      'Ledge Grab & Recovery Timing: Grapple ledges with brief invulnerability and drop-down hops',
      'Local 2–4 Player Controller: Multiple players on one screen with dynamic camera framing'
    ],
    suggestedTitles: [
      'Clash of Champions: Smash Stage',
      'Rumble Arena: Knockout Strike',
      'Aether Brawlers: Ringout Pro',
      'Strike Legends: Super Blast'
    ]
  },
  {
    id: 'survival_craft',
    name: 'Survival & Sandbox Crafting',
    category: 'RPG & Simulation',
    shortTag: 'Survival Craft',
    tagline: 'Voxel terrain excavation, resource harvesting (wood/stone), hunger and health vitals, and day/night atmospheric cycle.',
    inspiration: 'Minecraft, Terraria, Valheim',
    badge: 'OPEN WORLD',
    iconName: 'Layers',
    accentColor: 'emerald',
    supportedDimensions: ['3d', '2d'],
    defaultDimension: '3d',
    supportedMultiplayer: ['dedicated_hub', 'p2p_coop', 'singleplayer'],
    defaultMultiplayer: 'p2p_coop',
    recommendedControls: 'WASD to Move, Space to Jump, Left-Click to Mine / Chop, Right-Click to Place Block, E for Crafting Inventory',
    keyMechanics: [
      'Voxel Block Digging & Building: Destructible 3D voxel terrain with block harvest drops and placement',
      'Resource Crafting Matrix: Wood, stone, iron recipes to craft tools (Pickaxe, Axe, Torch, Workbench)',
      'Player Vitality Gauges: Health hearts, hunger meter, stamina bar, and oxygen meter when underwater',
      'Day/Night Lighting Cycle: Directional sun rotation with torch point-lights and night monster spawning',
      'Inventory & Quickbar: 9-slot hotbar selection with item stack counts and drag-drop bag'
    ],
    suggestedTitles: [
      'Wilderlands: Frontier Survival',
      'Blockborne: Voxel Haven',
      'Shattered Isle: Craft & Survive',
      'Outpost Prime: Earth Colony'
    ]
  },
  {
    id: 'tower_defense',
    name: 'Tower Defense / Auto-Battler',
    category: 'Strategy & Tactics',
    shortTag: 'Tower Defense',
    tagline: 'Waypoint creep pathing, strategic turret placement grids, gold economy, and wave scaling.',
    inspiration: 'Kingdom Rush, Bloons TD, Plants vs Zombies',
    badge: 'TOWER DEFENSE',
    iconName: 'Target',
    accentColor: 'amber',
    supportedDimensions: ['2.5d', '2d'],
    defaultDimension: '2.5d',
    supportedMultiplayer: ['singleplayer', 'p2p_coop'],
    defaultMultiplayer: 'singleplayer',
    recommendedControls: 'Mouse Click to Select Defense Turret, Click Grid Slot to Build or Upgrade, Space to Call Early Wave',
    keyMechanics: [
      'Waypoint Path Navigation: Enemy creeps marching along calibrated paths with turn corners and speeds',
      'Turret Types: Rapid Archer Tower, Heavy Cannon (Splash), Ice Shard (Slow aura), and Tesla Coil (Chain lightning)',
      'Gold Bounty Economy: Kill bounty rewards, wave clear interest bonuses, and upgrade costs',
      'Creep Armor & Speed Affixes: Armored golems, fast runners, flying gargoyles, and boss titans',
      'Base Castle Health: Lives counter decreasing when creeps reach end portal, with star rating evaluation'
    ],
    suggestedTitles: [
      'Kingdom Bulwark: Siege Defense',
      'Tesla Citadel: Creep Wars',
      'Fortress Prime: Wave Defense',
      'Bastion of the Realm'
    ]
  }
];

export interface CreateProjectOptions {
  name: string;
  description?: string;
  author?: string;
  archetypeId?: GenreArchetypeId;
  dimension?: DimensionOption;
  multiplayerTopology?: MultiplayerTopologyOption;
}

/**
 * Creates a fully initialized, working, playable Mason Project seeded for a specific genre archetype.
 */
export function createArchetypeProject(options: CreateProjectOptions): MasonProject {
  const archetype = GENRE_ARCHETYPES.find(a => a.id === options.archetypeId) || GENRE_ARCHETYPES[0];
  const dimension: DimensionOption = options.dimension || archetype.defaultDimension;
  const multiplayerTopology: MultiplayerTopologyOption = options.multiplayerTopology || archetype.defaultMultiplayer;
  const name = options.name || archetype.suggestedTitles[0];
  const author = options.author || 'Mason Architect';
  const description = options.description || archetype.tagline;

  const now = new Date().toISOString();
  const projId = `proj_${Date.now()}`;

  // 1. Initialize starter Biome
  const starterBiome: BiomeFile = {
    id: `biome_${archetype.id}`,
    name: `${archetype.name} Environment`,
    fileName: `${archetype.id}_zone.biome`,
    createdAt: now,
    updatedAt: now,
    biomeData: {
      ...INITIAL_REFINED_BIOMES[0],
      id: `biome_${archetype.id}`,
      name: `${archetype.name} Environment`,
      regionColor: archetype.accentColor
    }
  };

  // 2. Initialize starter 2D Map (for 2D/2.5D games or Metroidvania)
  const mapWidth = archetype.id === 'brawler' ? 24 : 36;
  const mapHeight = archetype.id === 'brawler' ? 18 : 24;
  const starterMap: MapFile = createDefaultMapFile(
    `map_${archetype.id}`,
    `${archetype.name} Arena`,
    `${archetype.id}_arena.map`,
    mapWidth,
    mapHeight,
    starterBiome.id
  );

  // 3. Initialize starter 3D Model tailored to the archetype
  const starterModel: Model3DFile = createDefaultModel3DFile();
  starterModel.id = `model_${archetype.id}_player`;
  starterModel.name = `${archetype.shortTag} Hero`;
  starterModel.fileName = `${archetype.id}_player.model3d`;

  // 4. Initialize starter 3D Scene (.scene3d) configured for the archetype
  const starterScene: Scene3DFile = createDefaultScene3DFile(
    `scene_${archetype.id}`,
    `${archetype.name} Level`,
    `${archetype.id}_level.scene3d`
  );

  // Customize scene environment based on genre
  if (archetype.id === 'stealth_action') {
    starterScene.sceneData.environment.skyboxType = 'night';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#050814';
    starterScene.sceneData.environment.ambientLightColor = '#1e293b';
  } else if (archetype.id === 'action_adventure_3d') {
    starterScene.sceneData.environment.skyboxType = 'noon';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#60a5fa';
    starterScene.sceneData.environment.ambientLightColor = '#064e3b';
  } else if (archetype.id === 'soulslike_shooter') {
    starterScene.sceneData.environment.skyboxType = 'sunset';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#292524';
    starterScene.sceneData.environment.ambientLightColor = '#78350f';
    starterScene.sceneData.environment.sunIntensity = 1.5;
  } else if (archetype.id === 'mmofps_looter') {
    starterScene.sceneData.environment.skyboxType = 'noon';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#0284c7';
    starterScene.sceneData.environment.ambientLightColor = '#0f172a';
    starterScene.sceneData.environment.sunIntensity = 1.6;
  } else if (archetype.id === 'coop_horde_fps') {
    starterScene.sceneData.environment.skyboxType = 'night';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#1c1917';
    starterScene.sceneData.environment.ambientLightColor = '#450a0a';
  } else if (archetype.id === 'mmo_rpg_3d') {
    starterScene.sceneData.environment.skyboxType = 'dawn';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#38bdf8';
    starterScene.sceneData.environment.ambientLightColor = '#1e1b4b';
  } else if (archetype.id === 'vehicular_combat') {
    starterScene.sceneData.environment.skyboxType = 'sunset';
    starterScene.sceneData.environment.fogEnabled = true;
    starterScene.sceneData.environment.fogColor = '#451a03';
    starterScene.sceneData.environment.sunIntensity = 1.8;
  } else if (archetype.id === 'flight_sim') {
    starterScene.sceneData.environment.skyboxType = 'void';
    starterScene.sceneData.environment.fogEnabled = false;
  }

  // 5. Initialize starter 3D Terrain (.terrain)
  const starterTerrain: TerrainFile = createDefaultTerrainFile(
    `terrain_${archetype.id}`,
    `${archetype.shortTag} Terrain Ground`,
    `${archetype.id}_ground.terrain`
  );

  // 6. Initialize starter Multiplayer Mesh (.multiplayer) configured to the requested topology
  const starterMultiplayer: MultiplayerFile = createDefaultMultiplayerFile(
    `multiplayer_${archetype.id}`,
    `${archetype.shortTag} Network Mesh`,
    `${archetype.id}_mesh.multiplayer`
  );

  if (multiplayerTopology === 'p2p_coop') {
    starterMultiplayer.multiplayerData.topology = 'peer_to_peer';
    starterMultiplayer.multiplayerData.maxPlayersPerRoom = 4;
  } else if (multiplayerTopology === 'dedicated_hub') {
    starterMultiplayer.multiplayerData.topology = 'dedicated_hub';
    starterMultiplayer.multiplayerData.maxPlayersPerRoom = 16;
    starterMultiplayer.multiplayerData.tickRate = 60;
  } else if (multiplayerTopology === 'mmo_mesh') {
    starterMultiplayer.multiplayerData.topology = 'distributed_mesh';
    starterMultiplayer.multiplayerData.maxPlayersPerRoom = 500;
  } else if (multiplayerTopology === 'local_couch') {
    starterMultiplayer.multiplayerData.topology = 'peer_to_peer';
    starterMultiplayer.multiplayerData.maxPlayersPerRoom = 4;
  }

  // 7. Seed genre-specific Task Board
  const starterTaskBoard: ProjectTaskBoardData = {
    categories: DEFAULT_TASK_CATEGORIES,
    members: DEFAULT_TASK_BOARD_MEMBERS,
    tasks: [
      {
        id: `task_${archetype.id}_setup`,
        title: `Seed ${archetype.name} Archetype`,
        description: `Project initialized with ${dimension.toUpperCase()} dimension, working starter level, and ${multiplayerTopology.replace('_', ' ')} architecture.`,
        categoryId: 'cat_code',
        assigneeId: 'member_1',
        priority: 'high',
        createdAt: now,
        updatedAt: now
      },
      {
        id: `task_${archetype.id}_core`,
        title: `Tune ${archetype.shortTag} Controls & Physics`,
        description: `Controls: ${archetype.recommendedControls}`,
        categoryId: 'cat_code',
        assigneeId: 'member_1',
        priority: 'high',
        createdAt: now,
        updatedAt: now
      },
      {
        id: `task_${archetype.id}_1`,
        title: `Expand ${archetype.keyMechanics[0].split(':')[0]}`,
        description: archetype.keyMechanics[0],
        categoryId: 'cat_level',
        assigneeId: 'member_3',
        priority: 'medium',
        createdAt: now,
        updatedAt: now
      },
      {
        id: `task_${archetype.id}_2`,
        title: `Place Custom ${archetype.shortTag} Obstacles & Enemies`,
        description: `Decorate the starter level in the 3D Scenes or Maps module.`,
        categoryId: 'cat_art',
        assigneeId: 'member_2',
        priority: 'low',
        createdAt: now,
        updatedAt: now
      }
    ]
  };

  // Determine initial active module
  const initialActiveModule = (dimension === '3d' || dimension === '2.5d') 
    ? (archetype.id === 'vehicular_combat' || archetype.id === 'stealth_action' || archetype.id === 'fps_tps' ? 'scenes' : 'scenes')
    : 'maps';

  return {
    id: projId,
    name,
    description,
    author,
    createdAt: now,
    updatedAt: now,
    engineVersion: MASON_VERSION_DISPLAY,
    activeModule: initialActiveModule as any,
    activeFiles: {
      mapFileName: starterMap.fileName,
      biomeFileName: starterBiome.fileName,
      prefabFileName: `${DEFAULT_PREFABS[0]?.id.replace('char_', '')}.prefab` || 'korrath.prefab',
      uiFileName: `${DEFAULT_UI_THEMES[0]?.id}.ui` || 'classic_crimson.ui',
      gameStructureFileName: 'main_campaign.gamestructure',
      behaviorFileName: `${DEFAULT_BEHAVIORS[0]?.id.replace('behavior_', '')}.behavior` || 'patrol_sentry.behavior',
      particleFileName: `${DEFAULT_PARTICLE_SYSTEMS[0]?.id.replace('particles_', '')}.particle` || 'flame_burst.particle',
      spriteFileName: 'hero_character.sprite',
      model3dFileName: starterModel.fileName,
      scene3dFileName: starterScene.fileName,
      terrainFileName: starterTerrain.fileName,
      multiplayerFileName: starterMultiplayer.fileName
    },
    fileSystem: {
      maps: [starterMap],
      biomes: [starterBiome],
      prefabs: DEFAULT_PREFABS.map(c => ({
        id: c.id,
        name: c.name,
        fileName: `${c.id.replace('char_', '')}.prefab`,
        createdAt: now,
        updatedAt: now,
        prefabData: c
      })),
      ui: DEFAULT_UI_THEMES.map(u => ({ id: u.id, name: u.name, fileName: `${u.id}.ui`, createdAt: now, updatedAt: now, uiConfig: u })),
      game: [
        {
          id: 'game_main_campaign',
          name: `${archetype.name} Campaign`,
          fileName: 'main_campaign.gamestructure',
          createdAt: now,
          updatedAt: now,
          structureData: createDefaultGameStructure()
        }
      ],
      behaviors: DEFAULT_BEHAVIORS.map(b => ({
        id: b.id,
        name: b.name,
        fileName: `${b.id.replace('behavior_', '')}.behavior`,
        createdAt: now,
        updatedAt: now,
        behaviorData: b
      })),
      particles: DEFAULT_PARTICLE_SYSTEMS.map(p => ({
        id: p.id,
        name: p.name,
        fileName: `${p.id.replace('particles_', '')}.particle`,
        createdAt: now,
        updatedAt: now,
        particleData: p
      })),
      sprites: [],
      images: [],
      models3d: [starterModel],
      scenes3d: [starterScene],
      terrain: [starterTerrain],
      multiplayer: [starterMultiplayer]
    },
    taskBoard: starterTaskBoard
  };
}
