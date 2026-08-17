import React from 'react';
import { MASON_VERSION_DISPLAY } from '../version';

export interface MasonModuleDefinition {
  id: string;
  name: string;
  tagline: string;
  category: 'World & Levels' | 'Biomes & Environment' | 'Actors & Combat' | 'Interface & HUD' | 'Game Architecture' | 'Generative Tools';
  subfolder: string; // e.g. "modules/maps"
  entryHtml: string; // e.g. "/modules/maps/index.html"
  associatedFolder: string; // e.g. "maps"
  associatedExtension: string; // e.g. ".map"
  icon: string; // emoji or identifier
  accentColor: string; // cyan, emerald, purple, amber, blue, etc.
  description: string;
  features: string[];
  version: string;
}

export const MASON_MODULES: MasonModuleDefinition[] = [
  {
    id: 'maps',
    name: 'Maps',
    tagline: '2D sidescroller rooms, terrain strata painting, full autotiling & Map Macro',
    category: 'World & Levels',
    subfolder: 'modules/maps',
    entryHtml: '/modules/maps/index.html',
    associatedFolder: 'maps',
    associatedExtension: '.map',
    icon: '🗺️',
    accentColor: 'cyan',
    description: 'A dedicated mini-app to author 2D Metroidvania room geometry, terrain strata layers with comprehensive autotiling, destructible block matrices, blank traversable airspaces, and integrated Map Macro synthesis.',
    features: [
      '64px Strata tile painting with real-time autotiling & slope trims',
      'Solid blocks vs traversable open air voids',
      'Integrated Map Macro (1px:1tile) cellular & platform synthesis',
      'Environmental flora & entity scatter',
      'Multi-room level management (.map format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'biomes',
    name: 'Biomes',
    tagline: '7-layer depth parallax (-5 to +1), PBR dual-noise materials & palettes',
    category: 'Biomes & Environment',
    subfolder: 'modules/biomes',
    entryHtml: '/modules/biomes/index.html',
    associatedFolder: 'biomes',
    associatedExtension: '.biome',
    icon: '🌲',
    accentColor: 'emerald',
    description: 'A dedicated mini-app to calibrate multi-depth parallax horizons (-5 skybox to +1 foreground occlusion), simplex noise strata materials, volumetric atmospheric mist, and biome flora palettes.',
    features: [
      '7-Layer Parallax live depth preview & scroll simulator',
      'Dual-noise procedural texture generators',
      'Edge trim & autotiling rule authoring',
      'Atmospheric color gradients & weather particles',
      'Custom biome asset pack definitions (.biome format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'archetypes',
    name: 'Archetypes',
    tagline: 'Player classes, traversal tags, foci slots, damage affinities & narrative prose',
    category: 'Actors & Combat',
    subfolder: 'modules/archetypes',
    entryHtml: '/modules/archetypes/index.html',
    associatedFolder: 'archetypes',
    associatedExtension: '.arch',
    icon: '🛡️',
    accentColor: 'blue',
    description: 'A dedicated mini-app to configure playable hero archetypes, mobility tags (Double Jump, Air Dash, Wall Cling, Grapple Hook), core stats (Health, Energy, Stamina, Poise), action foci slots, and backstory lore.',
    features: [
      'Movement physics & traversal modifier tags',
      'Base attribute matrices & energy pools',
      'Action & spell foci slot configurations',
      'Damage affinity & resistance profiling',
      'Narrative lore & archetype register (.arch format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'ui',
    name: 'UI & HUD',
    tagline: 'Gothic orbs, cyber gauges, minimap radars, dialogue boxes & boss bars',
    category: 'Interface & HUD',
    subfolder: 'modules/ui',
    entryHtml: '/modules/ui/index.html',
    associatedFolder: 'ui',
    associatedExtension: '.ui',
    icon: '💎',
    accentColor: 'amber',
    description: 'A dedicated mini-app to customize in-game heads-up displays, Gothic obsidian health orbs, cybernetic HUD gauges, minimap scanner radars, NPC dialogue frames, and damage numbers.',
    features: [
      'Customizable health/mana/stamina gauge styles',
      'Circular, square & diamond radar minimap frames',
      'NPC dialogue boxes with portrait windows',
      'Boss phase health bars with ornate filigree',
      'Damage number floating combat text (FCT) palettes (.ui format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'characters',
    name: 'Character Creator',
    tagline: 'Visual sprites, sensory socket tags (eyes, ears, hurtbox), animation sheets & behavior links',
    category: 'Actors & Combat',
    subfolder: 'modules/characters',
    entryHtml: '/modules/characters/index.html',
    associatedFolder: 'characters',
    associatedExtension: '.character',
    icon: '🎭',
    accentColor: 'rose',
    description: 'A dedicated mini-app to author player heroes, NPCs, and enemy sprites, calibrate sensory tag sockets (head_eyes for sight, head_ears for hearing, feet_ground for footsteps), configure animation frame states, and attach behavior scripts.',
    features: [
      'Visual Sprite Customizer: Scale, tinting, sprite sheets & avatar icons',
      'Sensory Socket Tag Editor: Calibrate offset positions for head_eyes, head_ears, torso_center, feet_ground, hand_weapon',
      'Animation Frame State Sheet: Idle, walk, run, jump, attack, hurt, death frame rates & SFX cues',
      'Unified Driver Linkage to Behaviors (.behavior) and Archetypes (.arch)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'behaviors',
    name: 'Behaviors & AI',
    tagline: 'Rule-based IFTTT engine, sight/sound attributes, camera loci & movement controllers',
    category: 'Actors & Combat',
    subfolder: 'modules/behaviors',
    entryHtml: '/modules/behaviors/index.html',
    associatedFolder: 'behaviors',
    associatedExtension: '.behavior',
    icon: '🧠',
    accentColor: 'indigo',
    description: 'A dedicated mini-app to author "If This Then That" (IFTTT) conditional behavior rules using sensory attributes (Sight rays from head_eyes, Sound hearing from head_ears, Proximity, Health, Timers) and trigger actions.',
    features: [
      'Rule-Based IFTTT Engine: Author IF (Sight, Sound, Proximity, Health, Collision) -> THEN (Move, Attack, Signal, Anim) rules',
      'Sensory Tag Integration: Bind sight raycasts to head_eyes and acoustic listening to head_ears',
      'Camera Foci & Kinematic Movement: Deadzones, player tracking, ledge patrol, sine waves & turrets',
      '1-Click Driver Assignment to Characters (.character), Archetypes (.arch) & Map Entities'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'gamestructure',
    name: 'World Graph',
    tagline: 'World map graph linker, main menu builder, loading wipes & progression flags',
    category: 'Game Architecture',
    subfolder: 'modules/gamestructure',
    entryHtml: '/modules/gamestructure/index.html',
    associatedFolder: 'game',
    associatedExtension: '.gamestructure',
    icon: '🌐',
    accentColor: 'purple',
    description: 'A dedicated mini-app to connect all levels into a cohesive Metroidvania world graph, author main menu title screens with live parallax backdrops, loading screen lore tips, and progression keys.',
    features: [
      'World room graph with bi-directional exit connections',
      'Main menu scene authoring with live parallax',
      'Loading screen wipe styles & lore hints carousel',
      'Metroidvania progression flag registry',
      'System pause menu & map tracker configuration (.gamestructure format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'macro',
    name: 'Map Macro',
    tagline: '1px:1tile procedural cellular automata, biome zoning masks & level structure generation',
    category: 'Generative Tools',
    subfolder: 'modules/maps/macro',
    entryHtml: '/modules/macro/index.html',
    associatedFolder: 'maps',
    associatedExtension: '.macro',
    icon: '⚡',
    accentColor: 'rose',
    description: 'A dedicated subset studio inside the Maps module to procedurally generate large-scale biome distribution heatmaps, cellular cave networks, and platforming layouts using the 1px:1tile macro synthesis engine.',
    features: [
      'Perlin/Simplex macro biome allocation',
      'Metroidvania cave & platforming synthesis templates',
      'Brush painting with biome territory masks',
      'Direct 1-click level synthesis onto active .map files',
      'Procedural seed randomization'
    ],
    version: MASON_VERSION_DISPLAY
  }
];

export const getModuleById = (id: string): MasonModuleDefinition | undefined => {
  return MASON_MODULES.find(m => m.id === id);
};
