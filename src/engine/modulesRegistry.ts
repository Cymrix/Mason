import React from 'react';
import { MASON_VERSION_DISPLAY } from '../version';

/**
 * Computes an absolute, environment-agnostic URL for mini-app HTML module entrypoints.
 * Handles subpath deployments (GitHub Pages), PWA relative paths, and local dev servers.
 */
export function getModuleUrl(subpath: string): string {
  const cleanSubpath = subpath.replace(/^\.\//, '').replace(/^\//, '');

  const envBase = (import.meta as any).env?.BASE_URL;
  if (envBase && envBase !== './' && envBase !== '/') {
    const formattedBase = envBase.endsWith('/') ? envBase : `${envBase}/`;
    return `${formattedBase}${cleanSubpath}`;
  }

  if (typeof window !== 'undefined' && window.location) {
    let pathname = window.location.pathname;
    if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
      pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    }
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    return `${window.location.origin}${pathname}${cleanSubpath}`;
  }

  return `./${cleanSubpath}`;
}

export interface MasonModuleDefinition {
  id: string;
  name: string;
  tagline: string;
  category: 'World & Levels' | 'Biomes & Environment' | 'Actors & Combat' | 'Interface & HUD' | 'Game Architecture' | 'Generative Tools' | 'VFX & Particles' | '3D & Models' | 'Online & Multiplayer';
  subfolder: string; // e.g. "modules/maps"
  entryHtml: string; // e.g. "/modules/maps/index.html"
  associatedFolder: string; // e.g. "maps"
  associatedExtension: string; // e.g. ".map"
  iconName: 'Map' | 'TreePine' | 'Sliders' | 'Users' | 'Network' | 'LayoutDashboard' | 'Sparkles' | 'Paintbrush' | 'Box' | 'Compass' | 'Server';
  accentColor: string; // cyan, emerald, purple, amber, blue, etc.
  description: string;
  features: string[];
  version: string;
}

export const MASON_MODULES: MasonModuleDefinition[] = [
  {
    id: 'sprites',
    name: 'Image Editor',
    tagline: 'Layered pixel-art painter with palette gradient-driven spray brush & animation timeline',
    category: 'Actors & Combat',
    subfolder: 'modules/sprites',
    entryHtml: './modules/sprites/index.html',
    associatedFolder: 'sprites',
    associatedExtension: '.png',
    iconName: 'Paintbrush',
    accentColor: 'emerald',
    description: 'A powerful embedded pixel studio for drawing hero sprites, monster animations, tilesets, and height/normal maps with gradient spray brushes, palette swatches, and multi-frame animation timelines.',
    features: [
      'Gradient & Palette-Driven Spray Brushes with custom scatter jitter',
      'Multi-Layer Canvas: Opacity, blend layers, flip, rotate, and sharpening FX',
      'Animation Timeline: Frame sequencing, onion skinning, live preview & FPS controls',
      'Spritesheet & Heightmap Export: Direct grid export or instant application to Mason Prefabs',
      'Seamless Pattern & Tileset Authoring tools'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'maps',
    name: 'Maps',
    tagline: '2D sidescroller rooms, terrain strata painting, full autotiling & Map Macro',
    category: 'World & Levels',
    subfolder: 'modules/maps',
    entryHtml: './modules/maps/index.html',
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
    entryHtml: './modules/biomes/index.html',
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
    id: 'prefabs',
    name: 'Prefabs',
    tagline: 'Visual spritesheets, state machines, props, attributes & bespoke IFTTT rule engine',
    category: 'Actors & Combat',
    subfolder: 'modules/prefabs',
    entryHtml: './modules/prefabs/index.html',
    associatedFolder: 'prefabs',
    associatedExtension: '.prefab',
    iconName: 'Users',
    accentColor: 'rose',
    description: 'Author player heroes, NPCs, enemies, and animated props (like campfires) with custom spritesheets, state machines, custom variables, and bespoke IFTTT behavior rule logic.',
    features: [
      'Visual Animation Studio: Multi-spritesheet support, frame sequencing, hitbox/hurtbox polygons & sockets',
      'Base Attributes & Variables: Manage stats, proficiencies, and custom variables with auto-generated IDs',
      'Bespoke IFTTT Rule Engine: Author sensory sight, sound hearing, proximity, player input, and camera tracking rules',
      'Rule Inheritance & Cloning: 1-click duplicate prefab or copy behavior rules from another prefab'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'particles',
    name: 'Particles',
    tagline: 'Physics-based GPU particle systems, fire, sparks, weather, magic & map emitter placement',
    category: 'VFX & Particles',
    subfolder: 'modules/particles',
    entryHtml: './modules/particles/index.html',
    associatedFolder: 'particles',
    associatedExtension: '.particle',
    iconName: 'Sparkles',
    accentColor: 'amber',
    description: 'Author stunning 2D particle systems: torches, embers, magic sparkles, rain, snow, toxic spores, and explosions. Place ambient emitters in the Map Editor or spawn FX dynamically via Behavior Rules and prefab sockets.',
    features: [
      'Interactive 60fps Real-Time Physics Preview with live cursor burst & drag emitter',
      'Kinematics: Velocity, spread angle dial, gravity X/Y, drag, wind drift & turbulence jitter',
      'Visuals: 10 shapes (embers, sparkles, smoke puffs, stars, glyphs), size curves & color gradients',
      'Map Placement: Paint ambient emitters directly onto room tiles in Map Editor',
      'Behavior Triggering: Spawn bursts dynamically on hit, jump, dash, or spell cast'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'ui',
    name: 'UI & HUD',
    tagline: 'Gothic orbs, cyber gauges, minimap radars, dialogue boxes & boss bars',
    category: 'Interface & HUD',
    subfolder: 'modules/ui',
    entryHtml: './modules/ui/index.html',
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
    name: 'Game Architecture',
    tagline: 'World map graph linker, main menu builder, loading wipes & progression flags',
    category: 'Game Architecture',
    subfolder: 'modules/gamestructure',
    entryHtml: './modules/gamestructure/index.html',
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
  },
  {
    id: 'models3d',
    name: '3D Studio',
    tagline: 'Low-poly 3D modeling, vertex & texture painting, bone rigging, animation & spritesheet/GIF export',
    category: '3D & Models',
    subfolder: 'modules/models3d',
    entryHtml: './modules/models3d/index.html',
    associatedFolder: 'models',
    associatedExtension: '.model3d',
    iconName: 'Box',
    accentColor: 'indigo',
    description: 'A comprehensive 3D modeling, texturing, bone rigging, and keyframe animation studio. Build characters and props from 3D primitives, paint vertex colors and textures, bind skeletal bone armatures with auto-weighting, pose and animate with timelines, and export multi-angle spritesheet strips (.png) or animated GIFs directly to 2D prefabs.',
    features: [
      '3D Primitive Modeling: Cube, cylinder, sphere, cone, wedge, capsule with real-time transforms and mirroring',
      'Direct 3D Painting: Surface raycast vertex color painting and canvas UV texture painting',
      'Skeletal Armature Rigging: Bone hierarchies, preset biped/quadruped rigs & automated heat-weight envelopes',
      'Keyframe Animation Timeline: Multi-track dope sheet, quaternion interpolation & loop controls',
      'Animation Exporter: Render multi-angle 2D spritesheet strips and transparent animated GIFs (.gif) for direct 2D Prefab playback'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'fabricator',
    name: 'Model Fabricator',
    tagline: 'Parametric creature & character synthesizer with anatomy sliders and auto-rigging',
    category: '3D & Models',
    subfolder: 'modules/fabricator',
    entryHtml: './modules/fabricator/index.html',
    associatedFolder: 'models',
    associatedExtension: '.model3d',
    iconName: 'Box',
    accentColor: 'purple',
    description: 'A parametric 3D creature and character synthesizer. Configure head counts, arm counts, leg configurations (biped, quadruped, hexapod, serpentine), breast counts, eye clusters, horns, wings, and body proportions. Automatically generates anatomically matched bone armatures and dynamic walking/idle animations for instant baking into 3D Studio or 2D spritesheet/GIF export.',
    features: [
      'Parametric Anatomy: Sliders for heads (1-4), arms (0-8), legs (0-8), breasts (0-6), eyes (1-8), horns & wings',
      'Archetype Presets: Humanoid Biped, Asura Deity, Quadruped Beast, Insectoid, Serpentine Hydra, Winged Seraph, Eldritch Void',
      'Automatic Skeletal Rigging: Procedurally synthesizes matching bone hierarchy and weight associations',
      'Adaptive Animation Generator: Gait-synchronized walk cycles (biped, quadruped trot, insect crawl) and idle breathing',
      'Direct Project Baking: 1-click export to .model3d, transparent PNG spritesheets, animated GIFs, or ZIP frame sequences'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'scenes',
    name: '3D Scenes',
    tagline: '3D level & scene composer with prefab placement, lighting, skybox & walkthrough play test',
    category: 'World & Levels',
    subfolder: 'modules/scenes',
    entryHtml: './modules/scenes/index.html',
    associatedFolder: 'scenes',
    associatedExtension: '.scene3d',
    iconName: 'Compass',
    accentColor: 'indigo',
    description: 'Compose full 3D levels and game spaces. Place 3D models and characters from 3D Studio, place 2D billboard prefabs, build architectural structures with 3D primitives and colliders, configure point and directional lighting, calibrate atmospheric fog and skyboxes, and immediately walk through your 3D world with integrated real-time play controls.',
    features: [
      '3D Space Composition: Freeform 3D entity placement with translation, rotation & scale gizmos',
      'Prefab & Model Placement: Place .model3d assets and 2D billboard prefabs directly in 3D',
      'Dynamic 3D Lighting & Shadows: Directional sun, point lights, beacons, and volumetric fog presets',
      'Atmospheric Skyboxes: Presets for Dawn, Noon, Golden Sunset, Starry Night, Cyberpunk Void',
      'Walkthrough Test Play: WASD player controller with collisions to explore the scene in real time'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'terrain',
    name: 'Terrain Builder',
    tagline: 'Voxel sculpting, plane sculpting, triplanar biome materials & baked detail scatter',
    category: 'World & Levels',
    subfolder: 'modules/terrain',
    entryHtml: './modules/terrain/index.html',
    associatedFolder: 'terrain',
    associatedExtension: '.terrain',
    iconName: 'TreePine',
    accentColor: 'emerald',
    description: 'A comprehensive 3D terrain authoring engine. Sculpt voxel volumes and heightmap plane meshes with elevate, dig, smooth, and plateau brushes. Paint triplanar biome strata materials (topsoil, steep cliff rock, valley silt) without UV stretching. Scatter trees, foliage, and boulders tied to biome materials, with 1-click static geometry baking for non-destructible terrain.',
    features: [
      'Voxel & Plane Mesh Sculpting: Add voxel volumes or heightmaps and sculpt with dynamic radius/falloff brushes',
      'Triplanar Biome Materials: Auto-terrain slope strata (grass top, vertical cliff basalt, silt base) grouped by biome',
      'Automated Detail Scatter: Scatter pine trees, broadleaf trees, boulders, and foliage tied to terrain materials',
      'Static Geometry Baking: 1-click bake non-destructible scatter into merged static geometry for zero runtime overhead',
      'Static & Dynamic Props: Place breakable barrels, chests, and shrines directly into the 3D terrain environment'
    ],
    version: MASON_VERSION_DISPLAY
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer Hub',
    tagline: 'Authoritative server mesh, MMO spatial zone partitioning, Ed25519 auth & live network sandbox',
    category: 'Online & Multiplayer',
    subfolder: 'modules/multiplayer',
    entryHtml: './modules/multiplayer/index.html',
    associatedFolder: 'network',
    associatedExtension: '.multiplayer',
    iconName: 'Server',
    accentColor: 'indigo',
    description: 'Design, simulate, and deploy distributed multiplayer game networks. Configure authoritative dedicated hubs, peer-to-peer WebRTC connections, or distributed MMO server meshes with spatial zone handoffs. Features Ed25519 cryptographic keypair player authentication, client-side prediction, entity interpolation & reconciliation, live packet latency injection, and 1-click production server script generation.',
    features: [
      'Multi-Topology Architecture: Switch seamlessly between Peer-to-Peer, Dedicated Authoritative Hub, and Distributed MMO Server Mesh',
      'Spatial Zone Partitioning: Multi-node server mesh with automatic player migration across boundary coordinates',
      'Cryptographic Identity: Ed25519 keypair verification, signed packet payloads, replay nonce windows, and RBAC permission tiers',
      'Authoritative Tick Simulation: Calibrate 20Hz-128Hz tick loops, client-side prediction, interpolation buffers & lag compensation rewind',
      'Live Network Testbed & Sandbox: Interactive visual arena with simulated players, artificial latency/packet loss injection, and real-time telemetry'
    ],
    version: MASON_VERSION_DISPLAY
  }
];

export const getModuleById = (id: string): MasonModuleDefinition | undefined => {
  return MASON_MODULES.find(m => m.id === id);
};
