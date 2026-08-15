import { DamageType } from './schema';

export interface DecorItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  frequency: number; // 0.0 to 1.0 (appearance frequency / density probability)
  layer: 'tile_layer' | 'foreground_layer'; // tile_layer blends with material; foreground_layer sits on top (windows, enemies, interactive)
  isWalkable: boolean;
  destructible: boolean;
  health: number;
  armor: number;
  weakness?: DamageType;
  heightOffset?: number;
}

export interface BiomeMaterial {
  heightScale: number; // 0 to 1: height map (shared with shadow shader)
  blendSoftness: number; // 0 to 1: softness/blend style for height transitions
  surfaceOverlayColor: string;
  health: number; // destructible terrain health for shared combat resolver
  armor: number;
  damageAffinities: Partial<Record<DamageType, number>>; // RPS modality dominance multipliers
}

export interface BiomeNoiseSettings {
  scale: number;
  octaves: number;
  roughness: number;
  density: number;
  scatterDensity: number;
}

export interface Biome {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  baseColor: string;
  accentColor: string;
  material: BiomeMaterial;
  noise: BiomeNoiseSettings;
  decorItems: DecorItem[];
}

export const INITIAL_BIOMES: Biome[] = [
  {
    id: 'mourne_ashen_steppes',
    name: 'Mourne Ashen Steppes',
    subtitle: 'Outer convergence perimeter of Mourne Edris',
    description: 'A desolate expanse of compacted carbon dust and petrified strata at the edge of the twelve empire rift. Kinetic vibrations resonate deeply through the bedrock.',
    baseColor: '#383b42',
    accentColor: '#f97316',
    material: {
      heightScale: 0.65,
      blendSoftness: 0.4,
      surfaceOverlayColor: '#4b5563',
      health: 80,
      armor: 5,
      damageAffinities: {
        kinetic: 1.0,
        thermal: 1.5,
        cryo: 0.5,
      }
    },
    noise: {
      scale: 18,
      octaves: 3,
      roughness: 0.45,
      density: 0.7,
      scatterDensity: 0.4
    },
    decorItems: [
      {
        id: 'ash_tuft',
        name: 'Scorched Briar',
        color: '#6b7280',
        icon: '🌿',
        frequency: 0.35,
        layer: 'tile_layer',
        isWalkable: true,
        destructible: true,
        health: 20,
        armor: 0,
        weakness: 'thermal'
      },
      {
        id: 'basalt_pillar',
        name: 'Basalt Monolith',
        color: '#1f2937',
        icon: '🗿',
        frequency: 0.15,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: true,
        health: 120,
        armor: 12,
        weakness: 'kinetic'
      },
      {
        id: 'fray_vent',
        name: 'Fray Pressure Vent',
        color: '#ea580c',
        icon: '🌋',
        frequency: 0.08,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: false,
        health: 0,
        armor: 0
      }
    ]
  },
  {
    id: 'luminescent_hollow',
    name: 'Luminescent Hollow',
    subtitle: 'Subterranean psionic fungal caves',
    description: 'Sub-surface caverns saturated in psionic spores and glowing mycelial veins. The atmosphere hums with latent metaphysical frequency.',
    baseColor: '#0f2937',
    accentColor: '#06b6d4',
    material: {
      heightScale: 0.45,
      blendSoftness: 0.8,
      surfaceOverlayColor: '#164e63',
      health: 50,
      armor: 2,
      damageAffinities: {
        psionic: 0.5,
        void: 1.5,
        thermal: 2.0
      }
    },
    noise: {
      scale: 24,
      octaves: 4,
      roughness: 0.6,
      density: 0.6,
      scatterDensity: 0.55
    },
    decorItems: [
      {
        id: 'spore_cluster',
        name: 'Glow Spore Cluster',
        color: '#22d3ee',
        icon: '🍄',
        frequency: 0.4,
        layer: 'tile_layer',
        isWalkable: true,
        destructible: true,
        health: 15,
        armor: 0,
        weakness: 'thermal'
      },
      {
        id: 'psionic_nodule',
        name: 'Resonant Crystal Nodule',
        color: '#818cf8',
        icon: '💎',
        frequency: 0.18,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: true,
        health: 90,
        armor: 8,
        weakness: 'void'
      },
      {
        id: 'spore_pylon',
        name: 'Anchor Pillar',
        color: '#0e7490',
        icon: '🏛️',
        frequency: 0.05,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: false,
        health: 0,
        armor: 0
      }
    ]
  },
  {
    id: 'caldera_depths',
    name: 'Caldera Depths',
    subtitle: 'Magma crust fissures and vulcanite plates',
    description: 'Tectonic convergence zone with intense thermal upwelling. Obsidian shelves cool rapidly against atmospheric shielding.',
    baseColor: '#2b1411',
    accentColor: '#ef4444',
    material: {
      heightScale: 0.85,
      blendSoftness: 0.3,
      surfaceOverlayColor: '#451a03',
      health: 140,
      armor: 15,
      damageAffinities: {
        thermal: 0.2,
        cryo: 2.0,
        kinetic: 1.2
      }
    },
    noise: {
      scale: 14,
      octaves: 3,
      roughness: 0.7,
      density: 0.75,
      scatterDensity: 0.35
    },
    decorItems: [
      {
        id: 'magma_crack',
        name: 'Glowing Fissure',
        color: '#f97316',
        icon: '⚡',
        frequency: 0.3,
        layer: 'tile_layer',
        isWalkable: true,
        destructible: false,
        health: 0,
        armor: 0
      },
      {
        id: 'obsidian_boulder',
        name: 'Obsidian Spire',
        color: '#1c1917',
        icon: '🪨',
        frequency: 0.22,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: true,
        health: 180,
        armor: 20,
        weakness: 'cryo'
      }
    ]
  },
  {
    id: 'ironwood_grove',
    name: 'Ironwood Galvanic Grove',
    subtitle: 'Petrified conductive cyber-forest',
    description: 'Petrified organic matter hybridized with ancient empire energy conduits. Trunks channel galvanic pulses directly from the planet core.',
    baseColor: '#1c241e',
    accentColor: '#10b981',
    material: {
      heightScale: 0.55,
      blendSoftness: 0.5,
      surfaceOverlayColor: '#064e3b',
      health: 95,
      armor: 8,
      damageAffinities: {
        galvanic: 0.3,
        toxic: 0.5,
        thermal: 1.8
      }
    },
    noise: {
      scale: 20,
      octaves: 3,
      roughness: 0.5,
      density: 0.65,
      scatterDensity: 0.5
    },
    decorItems: [
      {
        id: 'ironwood_trunk',
        name: 'Ironwood Trunk',
        color: '#047857',
        icon: '🌲',
        frequency: 0.3,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: true,
        health: 110,
        armor: 10,
        weakness: 'thermal'
      },
      {
        id: 'conduit_root',
        name: 'Galvanic Root',
        color: '#34d399',
        icon: '〰️',
        frequency: 0.25,
        layer: 'tile_layer',
        isWalkable: true,
        destructible: true,
        health: 40,
        armor: 2,
        weakness: 'cryo'
      }
    ]
  },
  {
    id: 'cryo_frost_shelf',
    name: 'Cryo Frost Shelf',
    subtitle: 'Sub-zero glacier barrier',
    description: 'Dense crystal-hard ice pack preserved under cryogenic pressure. Vulnerable to concentrated thermal discharge.',
    baseColor: '#1e293b',
    accentColor: '#38bdf8',
    material: {
      heightScale: 0.6,
      blendSoftness: 0.6,
      surfaceOverlayColor: '#0284c7',
      health: 70,
      armor: 4,
      damageAffinities: {
        cryo: 0.2,
        thermal: 2.5,
        kinetic: 1.5
      }
    },
    noise: {
      scale: 22,
      octaves: 4,
      roughness: 0.4,
      density: 0.7,
      scatterDensity: 0.45
    },
    decorItems: [
      {
        id: 'ice_stalagmite',
        name: 'Frost Stalagmite',
        color: '#bae6fd',
        icon: '🧊',
        frequency: 0.28,
        layer: 'foreground_layer',
        isWalkable: false,
        destructible: true,
        health: 60,
        armor: 3,
        weakness: 'thermal'
      },
      {
        id: 'permafrost_crust',
        name: 'Rime Frost Patch',
        color: '#7dd3fc',
        icon: '❄️',
        frequency: 0.4,
        layer: 'tile_layer',
        isWalkable: true,
        destructible: false,
        health: 0,
        armor: 0
      }
    ]
  }
];
