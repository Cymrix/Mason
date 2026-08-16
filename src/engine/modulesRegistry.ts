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
    name: 'Level & Tilemap Studio',
    tagline: '2D sidescroller rooms, terrain strata painting, destructible blocks & voids',
    category: 'World & Levels',
    subfolder: 'modules/maps',
    entryHtml: '/modules/maps/index.html',
    associatedFolder: 'maps',
    associatedExtension: '.map',
    icon: '🗺️',
    accentColor: 'cyan',
    description: 'A dedicated mini-app to author 2D Metroidvania room geometry, terrain strata layers, destructible block health matrices, blank traversable airspaces, and room exit triggers.',
    features: [
      '64px Strata tile painting with real-time autotiling',
      'Solid blocks vs traversable open air voids',
      'Environmental flora & entity scatter',
      'Doorway exit markers & spawn points',
      'Multi-room level management (.map format)'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'biomes',
    name: 'Biome & Parallax Architect',
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
    name: 'Hero & Archetype Forge',
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
    name: 'HUD & UI Theme Forge',
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
    id: 'gamestructure',
    name: 'Game Structure & World Graph',
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
    name: '1px:1tile Procedural Macro Studio',
    tagline: 'Procedural cellular automata, biome zoning masks & level structure generation',
    category: 'Generative Tools',
    subfolder: 'modules/macro',
    entryHtml: '/modules/macro/index.html',
    associatedFolder: 'maps',
    associatedExtension: '.macro',
    icon: '⚡',
    accentColor: 'rose',
    description: 'A dedicated mini-app to procedurally generate large-scale biome distribution heatmaps, cellular cave networks, and platforming layouts using the 1px:1tile macro synthesis engine.',
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
