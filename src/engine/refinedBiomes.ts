import { RefinedBiome, BiomeTileType, EnvironmentalDetail, InteractivePlacementDetail, BiomeWildlife } from './refinedBiomeSchema';

export const INITIAL_REFINED_BIOMES: RefinedBiome[] = [
  {
    id: 'mourne_ashen_steppes',
    name: 'Mourne Ashen Steppes',
    description: 'Wind-scoured basalt wastes layered in volcanic loam and ancient calcified petrified trunks.',
    regionColor: '#64748b',
    primaryTileTypeId: 'ashen_basalt',
    tileTypes: [
      {
        id: 'ashen_basalt',
        name: 'Ashen Basalt Rock',
        category: 'natural',
        mapColor: '#475569',
        baseMaterialA: {
          albedoColor: '#334155', // Dark charcoal slate
          heightMapScale: 0.75,
          roughness: 0.85,
          normalStrength: 1.2
        },
        baseMaterialBAlbedoColor: '#475569', // Ash-dusted cool basalt
        blendMap: {
          noiseA: {
            scale: 32,
            octaves: 3,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 12.3, y: 45.6 },
            weight: 0.6
          },
          noiseB: {
            scale: 14,
            octaves: 2,
            persistence: 0.6,
            lacunarity: 2.2,
            offset: { x: 88.1, y: 19.4 },
            weight: 0.4
          },
          blendThreshold: 0.48,
          blendContrast: 1.4,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#94a3b8', thicknessPx: 6, texturePattern: 'ash_crust', noiseEdge: true },
          bottom: { enabled: true, color: '#1e293b', thicknessPx: 4, noiseEdge: false },
          leftSide: { enabled: true, color: '#334155', thicknessPx: 3, noiseEdge: true },
          rightSide: { enabled: true, color: '#1e293b', thicknessPx: 3, noiseEdge: true }
        },
        isDestructible: true,
        health: 140,
        defense_type: 'kinetic',
        armor_deduction: 8,
        damage_affinities: { kinetic: 1.0, thermal: 1.2, cryo: 0.5, void: 1.4 },
        shares_damage_overlay: true,
        traversal_tags: [],
        speed_modifier: 1.0
      },
      {
        id: 'volcanic_ash_soil',
        name: 'Volcanic Loam Soil',
        category: 'natural',
        mapColor: '#78350f',
        baseMaterialA: {
          albedoColor: '#3d2617', // Dark smoldering dirt
          heightMapScale: 0.35,
          roughness: 0.95,
          normalStrength: 0.8
        },
        baseMaterialBAlbedoColor: '#5c3a21', // Lighter ember-soil
        blendMap: {
          noiseA: {
            scale: 24,
            octaves: 2,
            persistence: 0.55,
            lacunarity: 2.0,
            offset: { x: 4.1, y: 7.9 },
            weight: 0.5
          },
          noiseB: {
            scale: 8,
            octaves: 3,
            persistence: 0.4,
            lacunarity: 2.5,
            offset: { x: 31.2, y: 92.5 },
            weight: 0.5
          },
          blendThreshold: 0.5,
          blendContrast: 1.1,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#78350f', thicknessPx: 8, texturePattern: 'embers', noiseEdge: true },
          bottom: { enabled: false, color: '#27170b', thicknessPx: 2, noiseEdge: false },
          leftSide: { enabled: false, color: '#27170b', thicknessPx: 2, noiseEdge: false },
          rightSide: { enabled: false, color: '#27170b', thicknessPx: 2, noiseEdge: false }
        },
        isDestructible: true,
        health: 50,
        defense_type: 'toxic',
        armor_deduction: 2,
        damage_affinities: { thermal: 1.8, kinetic: 1.1 },
        shares_damage_overlay: true,
        traversal_tags: [],
        speed_modifier: 0.9
      },
      {
        id: 'cinder_brick',
        name: 'Empire Cinder Fortification',
        category: 'structure',
        mapColor: '#3f3f46',
        baseMaterialA: {
          albedoColor: '#27272a', // Zinc dark brick
          heightMapScale: 0.9,
          roughness: 0.7,
          normalStrength: 1.5
        },
        baseMaterialBAlbedoColor: '#3f3f46', // Mortared brick variant
        blendMap: {
          noiseA: {
            scale: 48,
            octaves: 2,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 10, y: 20 },
            weight: 0.7
          },
          noiseB: {
            scale: 16,
            octaves: 2,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 50, y: 80 },
            weight: 0.3
          },
          blendThreshold: 0.52,
          blendContrast: 2.0,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#52525b', thicknessPx: 4, noiseEdge: false },
          bottom: { enabled: true, color: '#18181b', thicknessPx: 4, noiseEdge: false },
          leftSide: { enabled: true, color: '#27272a', thicknessPx: 3, noiseEdge: false },
          rightSide: { enabled: true, color: '#18181b', thicknessPx: 3, noiseEdge: false }
        },
        isDestructible: true,
        health: 220,
        defense_type: 'kinetic',
        armor_deduction: 15,
        damage_affinities: { kinetic: 0.7, void: 1.5 },
        shares_damage_overlay: false,
        traversal_tags: ['climbable'],
        speed_modifier: 1.0
      }
    ],
    environmentalDetails: [
      {
        id: 'petrified_iron_tree',
        name: 'Petrified Ironwood Trunk',
        category: 'tree',
        icon: '🌲',
        color: '#475569',
        widthTiles: 2,
        heightTiles: 2,
        spawnFrequency: 0.12,
        isDestructible: true,
        health: 80,
        armor: 5,
        modalityWeakness: 'thermal'
      },
      {
        id: 'basalt_monolith',
        name: 'Basalt Pillar Shard',
        category: 'rock',
        icon: '🪨',
        color: '#334155',
        widthTiles: 1,
        heightTiles: 1,
        spawnFrequency: 0.18,
        isDestructible: true,
        health: 120,
        armor: 10,
        modalityWeakness: 'void'
      },
      {
        id: 'smoldering_spore_bush',
        name: 'Smoldering Cinder Bush',
        category: 'bush',
        icon: '🌿',
        color: '#ea580c',
        widthTiles: 1,
        heightTiles: 1,
        spawnFrequency: 0.22,
        isDestructible: true,
        health: 20,
        armor: 0,
        modalityWeakness: 'cryo'
      }
    ],
    interactiveDetails: [
      {
        id: 'ashen_binding_stone',
        name: 'Ashen Steppes Binding Stone',
        type: 'binding_stone',
        icon: '💎',
        color: '#38bdf8',
        interactionPrompt: 'Attune Archetype & Save Checkpoint'
      },
      {
        id: 'iron_reinforced_gate',
        name: 'Reinforced Vault Gate',
        type: 'door_gate',
        icon: '🚪',
        color: '#f59e0b',
        interactionPrompt: 'Unlock Steppes Gate'
      },
      {
        id: 'cinder_stalker_enemy',
        name: 'Cinder Stalker Vanguard',
        type: 'enemy',
        icon: '👾',
        color: '#ef4444',
        health: 150,
        interactionPrompt: 'Engage in Combat'
      },
      {
        id: 'steppes_relic_chest',
        name: 'Calcified Supply Chest',
        type: 'chest',
        icon: '📦',
        color: '#fbbf24',
        interactionPrompt: 'Open Supply Chest'
      }
    ],
    wildlife: [
      {
        id: 'ash_moth',
        name: 'Gilded Ash Moth',
        icon: '🦋',
        color: '#fbbf24',
        spawnFrequency: 0.35,
        isInteractable: true,
        interactionAction: 'Harvest Luminescent Spores',
        isDestructible: true,
        health: 10,
        behavior: 'ambient_flying'
      },
      {
        id: 'basalt_tortoise',
        name: 'Basalt Carapace Tortoise',
        icon: '🐢',
        color: '#64748b',
        spawnFrequency: 0.15,
        isInteractable: true,
        interactionAction: 'Pet & Observe Shell Glyphs',
        isDestructible: true,
        health: 60,
        behavior: 'passive_wander'
      },
      {
        id: 'ember_burrower',
        name: 'Ember Sand Crab',
        icon: '🦀',
        color: '#f97316',
        spawnFrequency: 0.2,
        isInteractable: false,
        isDestructible: true,
        health: 25,
        behavior: 'burrowing'
      }
    ],
    soundtrack: {
      ambientExplorationTrack: 'ost_steppes_winds_of_mourne.ogg',
      combatTrack: 'ost_steppes_cinder_skirmish.ogg',
      bossEngagementTrack: 'ost_boss_archon_of_ash.ogg',
      hazardAtmosphereTrack: 'sfx_steppes_gale_loop.ogg',
      reverbDecaySeconds: 0.8,
      windIntensity: 0.75
    },
    noiseRules: {
      macroScale: 64,
      elevationRange: [0.3, 0.7],
      moistureRange: [0.1, 0.4]
    }
  },
  {
    id: 'luminescent_hollow',
    name: 'Luminescent Hollow',
    description: 'Subterranean fungal caverns overflowing with bioluminescent spore-canopies and glowing mycelium veins.',
    regionColor: '#06b6d4',
    primaryTileTypeId: 'bioluminescent_turf',
    tileTypes: [
      {
        id: 'bioluminescent_turf',
        name: 'Bioluminescent Turf',
        category: 'natural',
        mapColor: '#06b6d4',
        baseMaterialA: {
          albedoColor: '#083344', // Dark cyan mycelium
          heightMapScale: 0.5,
          roughness: 0.6,
          normalStrength: 1.0
        },
        baseMaterialBAlbedoColor: '#0e7490', // Vibrant teal glow spore
        blendMap: {
          noiseA: {
            scale: 28,
            octaves: 3,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 5, y: 15 },
            weight: 0.6
          },
          noiseB: {
            scale: 12,
            octaves: 2,
            persistence: 0.4,
            lacunarity: 2.2,
            offset: { x: 44, y: 66 },
            weight: 0.4
          },
          blendThreshold: 0.45,
          blendContrast: 1.6,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#22d3ee', thicknessPx: 8, texturePattern: 'spores', noiseEdge: true },
          bottom: { enabled: true, color: '#042f2e', thicknessPx: 4, noiseEdge: false },
          leftSide: { enabled: true, color: '#083344', thicknessPx: 3, noiseEdge: true },
          rightSide: { enabled: true, color: '#083344', thicknessPx: 3, noiseEdge: true }
        },
        isDestructible: true,
        health: 45,
        defense_type: 'toxic',
        armor_deduction: 1,
        damage_affinities: { thermal: 2.2, cryo: 0.6, radiant: 0.4 },
        shares_damage_overlay: true,
        traversal_tags: ['bouncy'],
        speed_modifier: 1.1
      },
      {
        id: 'subterranean_quartz',
        name: 'Subterranean Quartz Wall',
        category: 'natural',
        mapColor: '#4338ca',
        baseMaterialA: {
          albedoColor: '#1e1b4b', // Deep indigo crystal base
          heightMapScale: 0.9,
          roughness: 0.2, // Very smooth/glassy
          normalStrength: 1.6
        },
        baseMaterialBAlbedoColor: '#4338ca', // Fluorescent crystal core
        blendMap: {
          noiseA: {
            scale: 36,
            octaves: 2,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 33, y: 77 },
            weight: 0.7
          },
          noiseB: {
            scale: 10,
            octaves: 3,
            persistence: 0.5,
            lacunarity: 2.4,
            offset: { x: 80, y: 12 },
            weight: 0.3
          },
          blendThreshold: 0.5,
          blendContrast: 1.8,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#818cf8', thicknessPx: 6, texturePattern: 'crystal_ridges', noiseEdge: true },
          bottom: { enabled: true, color: '#0f172a', thicknessPx: 4, noiseEdge: false },
          leftSide: { enabled: true, color: '#1e1b4b', thicknessPx: 3, noiseEdge: false },
          rightSide: { enabled: true, color: '#1e1b4b', thicknessPx: 3, noiseEdge: false }
        },
        isDestructible: true,
        health: 180,
        defense_type: 'psionic',
        armor_deduction: 12,
        damage_affinities: { kinetic: 1.2, void: 1.6, psionic: 0.3 },
        shares_damage_overlay: false,
        traversal_tags: ['climbable'],
        speed_modifier: 1.0
      }
    ],
    environmentalDetails: [
      {
        id: 'glowing_spore_mushroom',
        name: 'Giant Phosphor Cap',
        category: 'tree',
        icon: '🍄',
        color: '#06b6d4',
        widthTiles: 2,
        heightTiles: 2,
        spawnFrequency: 0.2,
        isDestructible: true,
        health: 40,
        armor: 2,
        modalityWeakness: 'thermal'
      },
      {
        id: 'quartz_shard_cluster',
        name: 'Harmonic Quartz Spire',
        category: 'crystal',
        icon: '🔮',
        color: '#a855f7',
        widthTiles: 1,
        heightTiles: 2,
        spawnFrequency: 0.14,
        isDestructible: true,
        health: 100,
        armor: 8,
        modalityWeakness: 'kinetic'
      }
    ],
    interactiveDetails: [
      {
        id: 'hollow_binding_stone',
        name: 'Luminescent Hollow Resonator',
        type: 'binding_stone',
        icon: '💎',
        color: '#22d3ee',
        interactionPrompt: 'Attune Archetype & Save Checkpoint'
      },
      {
        id: 'spore_alchemist_cache',
        name: 'Alchemist Spore Cache',
        type: 'chest',
        icon: '📦',
        color: '#34d399',
        interactionPrompt: 'Examine Alchemical Stash'
      }
    ],
    wildlife: [
      {
        id: 'glow_wisp',
        name: 'Resonant Glow Wisp',
        icon: '✨',
        color: '#22d3ee',
        spawnFrequency: 0.45,
        isInteractable: true,
        interactionAction: 'Harvest Phosphor Essence',
        isDestructible: true,
        health: 15,
        behavior: 'ambient_flying'
      },
      {
        id: 'cavern_salamander',
        name: 'Indigo Blind Salamander',
        icon: '🦎',
        color: '#818cf8',
        spawnFrequency: 0.25,
        isInteractable: true,
        interactionAction: 'Feed Spore Cap',
        isDestructible: true,
        health: 30,
        behavior: 'flees_player'
      }
    ],
    soundtrack: {
      ambientExplorationTrack: 'ost_hollow_subterranean_echoes.ogg',
      combatTrack: 'ost_hollow_fungal_frenzy.ogg',
      bossEngagementTrack: 'ost_boss_mycelium_matriarch.ogg',
      hazardAtmosphereTrack: 'sfx_hollow_drips_and_whispers.ogg',
      reverbDecaySeconds: 2.4, // Long cave reverb
      windIntensity: 0.1
    },
    noiseRules: {
      macroScale: 48,
      elevationRange: [0.0, 0.4],
      moistureRange: [0.6, 1.0]
    }
  },
  {
    id: 'cryo_frost_shelf',
    name: 'Cryo Glacial Shelf',
    description: 'Permafrost ridges, razor-sharp ice needles, and sub-zero blizzard plateaus.',
    regionColor: '#38bdf8',
    primaryTileTypeId: 'glacial_ice',
    tileTypes: [
      {
        id: 'glacial_ice',
        name: 'Glacial Permafrost Ice',
        category: 'natural',
        mapColor: '#38bdf8',
        baseMaterialA: {
          albedoColor: '#0369a1', // Deep arctic blue
          heightMapScale: 0.6,
          roughness: 0.15, // Highly reflective
          normalStrength: 0.9
        },
        baseMaterialBAlbedoColor: '#38bdf8', // Bright frost glaze
        blendMap: {
          noiseA: {
            scale: 30,
            octaves: 3,
            persistence: 0.5,
            lacunarity: 2.0,
            offset: { x: 17, y: 82 },
            weight: 0.55
          },
          noiseB: {
            scale: 10,
            octaves: 2,
            persistence: 0.5,
            lacunarity: 2.2,
            offset: { x: 61, y: 29 },
            weight: 0.45
          },
          blendThreshold: 0.5,
          blendContrast: 1.5,
          invert: false
        },
        tileDetails: {
          top: { enabled: true, color: '#e0f2fe', thicknessPx: 7, texturePattern: 'snow_sheet', noiseEdge: true },
          bottom: { enabled: true, color: '#0c4a6e', thicknessPx: 4, noiseEdge: false },
          leftSide: { enabled: true, color: '#0369a1', thicknessPx: 3, noiseEdge: true },
          rightSide: { enabled: true, color: '#0369a1', thicknessPx: 3, noiseEdge: true }
        },
        isDestructible: true,
        health: 70,
        defense_type: 'cryo',
        armor_deduction: 3,
        damage_affinities: { thermal: 3.5, kinetic: 1.4, cryo: 0.1 },
        shares_damage_overlay: true,
        traversal_tags: ['slippery'],
        speed_modifier: 1.4
      }
    ],
    environmentalDetails: [
      {
        id: 'frost_pine',
        name: 'Frost-Glazed Pine',
        category: 'tree',
        icon: '🌲',
        color: '#7dd3fc',
        widthTiles: 2,
        heightTiles: 2,
        spawnFrequency: 0.15,
        isDestructible: true,
        health: 50,
        armor: 3,
        modalityWeakness: 'thermal'
      },
      {
        id: 'glacial_spire',
        name: 'Permafrost Needle Spire',
        category: 'rock',
        icon: '🧊',
        color: '#bae6fd',
        widthTiles: 1,
        heightTiles: 2,
        spawnFrequency: 0.18,
        isDestructible: true,
        health: 90,
        armor: 6,
        modalityWeakness: 'thermal'
      }
    ],
    interactiveDetails: [
      {
        id: 'cryo_binding_stone',
        name: 'Glacial Shelf Binding Stone',
        type: 'binding_stone',
        icon: '💎',
        color: '#7dd3fc',
        interactionPrompt: 'Attune Archetype & Save Checkpoint'
      }
    ],
    wildlife: [
      {
        id: 'arctic_hare',
        name: 'Snow Glider Hare',
        icon: '🐇',
        color: '#f8fafc',
        spawnFrequency: 0.3,
        isInteractable: true,
        interactionAction: 'Pet & Groom Soft Fur',
        isDestructible: true,
        health: 20,
        behavior: 'flees_player'
      },
      {
        id: 'frost_owl',
        name: 'Glacial Screech Owl',
        icon: '🦉',
        color: '#e2e8f0',
        spawnFrequency: 0.2,
        isInteractable: false,
        isDestructible: true,
        health: 25,
        behavior: 'ambient_flying'
      }
    ],
    soundtrack: {
      ambientExplorationTrack: 'ost_shelf_howling_tundra.ogg',
      combatTrack: 'ost_shelf_icebound_duel.ogg',
      bossEngagementTrack: 'ost_boss_rime_behemoth.ogg',
      hazardAtmosphereTrack: 'sfx_shelf_blizzard_wind.ogg',
      reverbDecaySeconds: 1.2,
      windIntensity: 0.95
    },
    noiseRules: {
      macroScale: 60,
      elevationRange: [0.6, 1.0],
      moistureRange: [0.4, 0.8]
    }
  }
];
