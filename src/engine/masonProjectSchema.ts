import { RefinedMapData, RefinedCellState } from '../types';
import { RefinedBiome } from './refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from './refinedBiomes';

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
  cells: RefinedCellState[][];
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
export type MasonModuleId = 'maps' | 'biomes' | 'archetypes' | 'ui' | 'gamestructure' | 'explorer';

export interface MasonFileSystem {
  maps: MapFile[];
  biomes: BiomeFile[];
  archetypes: ArchetypeFile[];
  ui: UIThemeFile[];
  game: GameStructureFile[];
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
    uiFileName: string;
    gameStructureFileName: string;
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
  const cells: RefinedCellState[][] = [];
  for (let y = 0; y < height; y++) {
    const row: RefinedCellState[] = [];
    for (let x = 0; x < width; x++) {
      // Create a nice sidescroller layout with platforms and open air
      const isSolidGround = y >= height - 4 || (y === Math.floor(height * 0.6) && (x < 10 || x > 20)) || (y === Math.floor(height * 0.35) && x >= 10 && x <= 22);
      row.push({
        biome_id: biomeId,
        tile_type_id: isSolidGround ? 'ashen_basalt' : '',
        current_health: 100,
        damage_threshold_index: 0,
        environmental_detail_id: isSolidGround && y === height - 4 && (x === 4 || x === 14 || x === 26) ? 'ashen_crag_pillar' : null,
        interactive_detail_id: isSolidGround && y === height - 4 && x === 8 ? 'shrine_of_ember' : null,
        wildlife_id: !isSolidGround && y === 5 && x === 16 ? 'cinder_wisp' : null
      });
    }
    cells.push(row);
  }

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
    exits: [
      {
        id: 'exit_east',
        name: 'East Cavern Gate',
        x: width - 1,
        y: height - 6,
        width: 1,
        height: 3,
        targetMapFileName: 'crystal_chasm.map',
        targetExitId: 'exit_west',
        transitionType: 'seamless',
        direction: 'right'
      },
      {
        id: 'exit_west',
        name: 'West Ascent Ledge',
        x: 0,
        y: height - 6,
        width: 1,
        height: 3,
        targetMapFileName: 'brimstone_caldera.map',
        targetExitId: 'exit_east',
        transitionType: 'door_fade',
        direction: 'left'
      }
    ],
    cells
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
    archetypeData: a
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
    description: '2D Metroidvania world with modular maps, biomes, archetypes, UI themes, and game structure framework.',
    author: 'Mason Architect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    engineVersion: '2.4.0',
    activeModule: 'maps',
    activeFiles: {
      mapFileName: 'ashen_outpost.map',
      biomeFileName: 'mourne_ashen_steppes.biome',
      archetypeFileName: 'korrath.arch',
      uiFileName: 'classic_gothic_hud.ui',
      gameStructureFileName: 'main_campaign.gamestructure'
    },
    fileSystem: {
      maps: [map1, map2, map3],
      biomes,
      archetypes,
      ui: uiThemes,
      game: gameStructures
    }
  };
};
