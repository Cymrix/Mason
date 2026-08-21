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
  iconName: 'Map' | 'TreePine' | 'Sliders' | 'Users' | 'Network' | 'LayoutDashboard';
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
    iconName: 'Map',
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
    iconName: 'TreePine',
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
    id: 'characters',
    name: 'Character Creator & AI',
    tagline: 'Visual spritesheets, hurtboxes, sensory sockets, attributes & bespoke IFTTT rule engine',
    category: 'Actors & Combat',
    subfolder: 'modules/characters',
    entryHtml: '/modules/characters/index.html',
    associatedFolder: 'characters',
    associatedExtension: '.character',
    iconName: 'Users',
    accentColor: 'rose',
    description: 'Author player heroes, NPCs, and enemy sprites with custom spritesheets, frame sequences, sensory tag sockets (head_eyes for sight, head_ears for hearing), hurtboxes/hitboxes, custom variables, and bespoke IFTTT behavior rule logic.',
    features: [
      'Visual Animation Studio: Multi-spritesheet support, frame sequencing, hitbox/hurtbox polygons & sockets',
      'Base Attributes & Variables: Manage stats, proficiencies, and custom variables with auto-generated IDs',
      'Bespoke IFTTT Rule Engine: Author sensory sight, sound hearing, proximity, player input, and camera tracking rules',
      'Rule Inheritance & Cloning: 1-click duplicate character or copy behavior rules from another character'
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
    iconName: 'Sliders',
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
    name: 'World Graph',
    tagline: 'World map graph linker, main menu builder, loading wipes & progression flags',
    category: 'Game Architecture',
    subfolder: 'modules/gamestructure',
    entryHtml: '/modules/gamestructure/index.html',
    associatedFolder: 'game',
    associatedExtension: '.gamestructure',
    iconName: 'Network',
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
  }
];

export const getModuleById = (id: string): MasonModuleDefinition | undefined => {
  return MASON_MODULES.find(m => m.id === id);
};
