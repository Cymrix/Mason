export type AccentColorKey = 
  | 'indigo'
  | 'cyan'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'purple'
  | 'blue'
  | 'crimson'
  | 'teal'
  | 'fuchsia'
  | 'lime'
  | 'orange'
  | 'gold'
  | 'sky'
  | 'coral'
  | 'monochrome'
  | 'white'
  | 'okabe_blue'
  | 'okabe_orange'
  | 'okabe_skyblue'
  | 'okabe_bluishgreen'
  | 'okabe_yellow'
  | 'okabe_vermillion'
  | 'okabe_redpurple';

export type BackgroundToneKey = 
  | 'void' 
  | 'slate' 
  | 'navy' 
  | 'carbon' 
  | 'espresso'
  | 'obsidian'
  | 'emerald_dark'
  | 'amethyst_dark'
  | 'crimson_dark'
  | 'deep_ocean'
  | 'zinc'
  | 'amber_dark';

export type ThemeCategory = 'standard' | 'accessibility';

export interface ModuleColorMap {
  maps: AccentColorKey;
  biomes: AccentColorKey;
  prefabs: AccentColorKey;
  ui: AccentColorKey;
  gamestructure: AccentColorKey;
}

export interface AppThemeConfig {
  id: string;
  name: string;
  description: string;
  category?: ThemeCategory;
  accessibilityTag?: string;
  primary: AccentColorKey;
  backgroundTone: BackgroundToneKey;
  moduleColors: ModuleColorMap;
  isCustom?: boolean;
}

export interface ColorDef {
  name: string;
  hex: string;
  rgb: string; // "99, 102, 241"
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  ringClass: string;
  gradientFromClass: string;
}

export const COLOR_DEFINITIONS: Record<AccentColorKey, ColorDef> = {
  indigo: {
    name: 'Citadel Indigo',
    hex: '#6366f1',
    rgb: '99, 102, 241',
    bgClass: 'bg-indigo-600 hover:bg-indigo-500',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/50',
    badgeClass: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300',
    ringClass: 'ring-indigo-500/40',
    gradientFromClass: 'from-indigo-600'
  },
  cyan: {
    name: 'Neon Cyan',
    hex: '#06b6d4',
    rgb: '6, 182, 212',
    bgClass: 'bg-cyan-600 hover:bg-cyan-500',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/50',
    badgeClass: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
    ringClass: 'ring-cyan-500/40',
    gradientFromClass: 'from-cyan-600'
  },
  emerald: {
    name: 'Verdant Emerald',
    hex: '#10b981',
    rgb: '16, 185, 129',
    bgClass: 'bg-emerald-600 hover:bg-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50',
    badgeClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    ringClass: 'ring-emerald-500/40',
    gradientFromClass: 'from-emerald-600'
  },
  rose: {
    name: 'Crimson Rose',
    hex: '#f43f5e',
    rgb: '244, 63, 94',
    bgClass: 'bg-rose-600 hover:bg-rose-500',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    badgeClass: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
    ringClass: 'ring-rose-500/40',
    gradientFromClass: 'from-rose-600'
  },
  amber: {
    name: 'Solar Amber',
    hex: '#f59e0b',
    rgb: '245, 158, 11',
    bgClass: 'bg-amber-600 hover:bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    badgeClass: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    ringClass: 'ring-amber-500/40',
    gradientFromClass: 'from-amber-600'
  },
  purple: {
    name: 'Astral Purple',
    hex: '#a855f7',
    rgb: '168, 85, 247',
    bgClass: 'bg-purple-600 hover:bg-purple-500',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/50',
    badgeClass: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
    ringClass: 'ring-purple-500/40',
    gradientFromClass: 'from-purple-600'
  },
  blue: {
    name: 'Cobalt Blue',
    hex: '#3b82f6',
    rgb: '59, 130, 246',
    bgClass: 'bg-blue-600 hover:bg-blue-500',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/50',
    badgeClass: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
    ringClass: 'ring-blue-500/40',
    gradientFromClass: 'from-blue-600'
  },
  crimson: {
    name: 'Obsidian Crimson',
    hex: '#ef4444',
    rgb: '239, 68, 68',
    bgClass: 'bg-red-600 hover:bg-red-500',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/50',
    badgeClass: 'bg-red-950/80 border-red-500/40 text-red-300',
    ringClass: 'ring-red-500/40',
    gradientFromClass: 'from-red-600'
  },
  teal: {
    name: 'Abyssal Teal',
    hex: '#14b8a6',
    rgb: '20, 184, 166',
    bgClass: 'bg-teal-600 hover:bg-teal-500',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-500/50',
    badgeClass: 'bg-teal-950/80 border-teal-500/40 text-teal-300',
    ringClass: 'ring-teal-500/40',
    gradientFromClass: 'from-teal-600'
  },
  fuchsia: {
    name: 'Vapor Fuchsia',
    hex: '#d946ef',
    rgb: '217, 70, 239',
    bgClass: 'bg-fuchsia-600 hover:bg-fuchsia-500',
    textClass: 'text-fuchsia-400',
    borderClass: 'border-fuchsia-500/50',
    badgeClass: 'bg-fuchsia-950/80 border-fuchsia-500/40 text-fuchsia-300',
    ringClass: 'ring-fuchsia-500/40',
    gradientFromClass: 'from-fuchsia-600'
  },
  lime: {
    name: 'Electric Lime',
    hex: '#84cc16',
    rgb: '132, 204, 22',
    bgClass: 'bg-lime-600 hover:bg-lime-500',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500/50',
    badgeClass: 'bg-lime-950/80 border-lime-500/40 text-lime-300',
    ringClass: 'ring-lime-500/40',
    gradientFromClass: 'from-lime-600'
  },
  orange: {
    name: 'Blaze Orange',
    hex: '#ea580c',
    rgb: '234, 88, 12',
    bgClass: 'bg-orange-600 hover:bg-orange-500',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/50',
    badgeClass: 'bg-orange-950/80 border-orange-500/40 text-orange-300',
    ringClass: 'ring-orange-500/40',
    gradientFromClass: 'from-orange-600'
  },
  gold: {
    name: 'Solar Gold',
    hex: '#eab308',
    rgb: '234, 179, 8',
    bgClass: 'bg-yellow-600 hover:bg-yellow-500',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/50',
    badgeClass: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-300',
    ringClass: 'ring-yellow-500/40',
    gradientFromClass: 'from-yellow-600'
  },
  sky: {
    name: 'Sky Blue',
    hex: '#0ea5e9',
    rgb: '14, 165, 233',
    bgClass: 'bg-sky-600 hover:bg-sky-500',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/50',
    badgeClass: 'bg-sky-950/80 border-sky-500/40 text-sky-300',
    ringClass: 'ring-sky-500/40',
    gradientFromClass: 'from-sky-600'
  },
  coral: {
    name: 'Sunset Coral',
    hex: '#fb7185',
    rgb: '251, 113, 133',
    bgClass: 'bg-rose-500 hover:bg-rose-400',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-400/50',
    badgeClass: 'bg-rose-950/80 border-rose-400/40 text-rose-200',
    ringClass: 'ring-rose-400/40',
    gradientFromClass: 'from-rose-500'
  },
  monochrome: {
    name: 'Carbon Slate',
    hex: '#94a3b8',
    rgb: '148, 163, 184',
    bgClass: 'bg-slate-600 hover:bg-slate-500',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500/50',
    badgeClass: 'bg-slate-900 border-slate-700 text-slate-300',
    ringClass: 'ring-slate-500/40',
    gradientFromClass: 'from-slate-600'
  },
  white: {
    name: 'Platinum White',
    hex: '#f8fafc',
    rgb: '248, 250, 252',
    bgClass: 'bg-white hover:bg-neutral-100 text-neutral-900',
    textClass: 'text-neutral-100',
    borderClass: 'border-neutral-200/60',
    badgeClass: 'bg-neutral-800 border-neutral-600 text-white',
    ringClass: 'ring-white/50',
    gradientFromClass: 'from-white'
  },
  // Okabe-Ito Scientific Color Universal Design (CUD) Palette
  okabe_blue: {
    name: 'CUD Deep Blue',
    hex: '#0072b2',
    rgb: '0, 114, 178',
    bgClass: 'bg-[#0072b2] hover:bg-[#005a8e]',
    textClass: 'text-[#56b4e9]',
    borderClass: 'border-[#0072b2]/50',
    badgeClass: 'bg-[#002844] border-[#0072b2]/40 text-[#56b4e9]',
    ringClass: 'ring-[#0072b2]/40',
    gradientFromClass: 'from-[#0072b2]'
  },
  okabe_orange: {
    name: 'CUD Orange',
    hex: '#e69f00',
    rgb: '230, 159, 0',
    bgClass: 'bg-[#e69f00] hover:bg-[#c48700]',
    textClass: 'text-[#e69f00]',
    borderClass: 'border-[#e69f00]/50',
    badgeClass: 'bg-[#402c00] border-[#e69f00]/40 text-[#e69f00]',
    ringClass: 'ring-[#e69f00]/40',
    gradientFromClass: 'from-[#e69f00]'
  },
  okabe_skyblue: {
    name: 'CUD Sky Blue',
    hex: '#56b4e9',
    rgb: '86, 180, 233',
    bgClass: 'bg-[#56b4e9] hover:bg-[#3ca0db]',
    textClass: 'text-[#56b4e9]',
    borderClass: 'border-[#56b4e9]/50',
    badgeClass: 'bg-[#0b2838] border-[#56b4e9]/40 text-[#56b4e9]',
    ringClass: 'ring-[#56b4e9]/40',
    gradientFromClass: 'from-[#56b4e9]'
  },
  okabe_bluishgreen: {
    name: 'CUD Bluish Green',
    hex: '#009e73',
    rgb: '0, 158, 115',
    bgClass: 'bg-[#009e73] hover:bg-[#007f5d]',
    textClass: 'text-[#009e73]',
    borderClass: 'border-[#009e73]/50',
    badgeClass: 'bg-[#002a1f] border-[#009e73]/40 text-[#009e73]',
    ringClass: 'ring-[#009e73]/40',
    gradientFromClass: 'from-[#009e73]'
  },
  okabe_yellow: {
    name: 'CUD Yellow',
    hex: '#f0e442',
    rgb: '240, 228, 66',
    bgClass: 'bg-[#f0e442] hover:bg-[#ded12e] text-neutral-950',
    textClass: 'text-[#f0e442]',
    borderClass: 'border-[#f0e442]/50',
    badgeClass: 'bg-[#3b380b] border-[#f0e442]/40 text-[#f0e442]',
    ringClass: 'ring-[#f0e442]/40',
    gradientFromClass: 'from-[#f0e442]'
  },
  okabe_vermillion: {
    name: 'CUD Vermillion',
    hex: '#d55e00',
    rgb: '213, 94, 0',
    bgClass: 'bg-[#d55e00] hover:bg-[#af4d00]',
    textClass: 'text-[#d55e00]',
    borderClass: 'border-[#d55e00]/50',
    badgeClass: 'bg-[#381900] border-[#d55e00]/40 text-[#d55e00]',
    ringClass: 'ring-[#d55e00]/40',
    gradientFromClass: 'from-[#d55e00]'
  },
  okabe_redpurple: {
    name: 'CUD Red-Purple',
    hex: '#cc79a7',
    rgb: '204, 121, 167',
    bgClass: 'bg-[#cc79a7] hover:bg-[#b86191]',
    textClass: 'text-[#cc79a7]',
    borderClass: 'border-[#cc79a7]/50',
    badgeClass: 'bg-[#3b172a] border-[#cc79a7]/40 text-[#cc79a7]',
    ringClass: 'ring-[#cc79a7]/40',
    gradientFromClass: 'from-[#cc79a7]'
  }
};

export interface BackgroundToneDef {
  name: string;
  bgClass: string;
  cardClass: string;
  borderClass: string;
  hex: string;
  cardHex: string;
  borderHex: string;
  description: string;
}

export const BACKGROUND_TONES: Record<BackgroundToneKey, BackgroundToneDef> = {
  void: {
    name: 'Void Black',
    bgClass: 'bg-neutral-950',
    cardClass: 'bg-neutral-900/90',
    borderClass: 'border-neutral-800',
    hex: '#0a0a0a',
    cardHex: '#141414',
    borderHex: '#262626',
    description: 'Pure pitch black OLED contrast'
  },
  slate: {
    name: 'Dark Slate',
    bgClass: 'bg-slate-950',
    cardClass: 'bg-slate-900/90',
    borderClass: 'border-slate-800',
    hex: '#0b0f19',
    cardHex: '#131b2e',
    borderHex: '#1e293b',
    description: 'Cool midnight grey-blue studio'
  },
  navy: {
    name: 'Midnight Navy',
    bgClass: 'bg-[#050c1e]',
    cardClass: 'bg-[#0d1836]/90',
    borderClass: 'border-[#1c2d5a]',
    hex: '#050c1e',
    cardHex: '#0d1836',
    borderHex: '#1c2d5a',
    description: 'Abyssal deep sci-fi maritime blue'
  },
  carbon: {
    name: 'Carbon Steel',
    bgClass: 'bg-[#121215]',
    cardClass: 'bg-[#1c1c22]/90',
    borderClass: 'border-[#2c2c36]',
    hex: '#121215',
    cardHex: '#1c1c22',
    borderHex: '#2c2c36',
    description: 'Neutral matte graphite charcoal'
  },
  espresso: {
    name: 'Espresso Dark',
    bgClass: 'bg-[#140f0d]',
    cardClass: 'bg-[#1f1714]/90',
    borderClass: 'border-[#362722]',
    hex: '#140f0d',
    cardHex: '#1f1714',
    borderHex: '#362722',
    description: 'Warm earthy dark roasted coffee'
  },
  obsidian: {
    name: 'Volcanic Obsidian',
    bgClass: 'bg-[#120911]',
    cardClass: 'bg-[#1d101c]/90',
    borderClass: 'border-[#361c34]',
    hex: '#120911',
    cardHex: '#1d101c',
    borderHex: '#361c34',
    description: 'Velvet plum gothic dark wine'
  },
  emerald_dark: {
    name: 'Verdant Deepwood',
    bgClass: 'bg-[#05130e]',
    cardClass: 'bg-[#0a2119]/90',
    borderClass: 'border-[#133b2c]',
    hex: '#05130e',
    cardHex: '#0a2119',
    borderHex: '#133b2c',
    description: 'Nocturnal dark forest pine & moss'
  },
  amethyst_dark: {
    name: 'Occult Amethyst',
    bgClass: 'bg-[#0e0918]',
    cardClass: 'bg-[#170f28]/90',
    borderClass: 'border-[#2c1c4d]',
    hex: '#0e0918',
    cardHex: '#170f28',
    borderHex: '#2c1c4d',
    description: 'Deep twilight astral dark violet'
  },
  crimson_dark: {
    name: 'Blood Abyss',
    bgClass: 'bg-[#160708]',
    cardClass: 'bg-[#240c0e]/90',
    borderClass: 'border-[#421418]',
    hex: '#160708',
    cardHex: '#240c0e',
    borderHex: '#421418',
    description: 'Sinister gothic dungeon crimson'
  },
  deep_ocean: {
    name: 'Mariana Trench',
    bgClass: 'bg-[#04131c]',
    cardClass: 'bg-[#082030]/90',
    borderClass: 'border-[#0f3854]',
    hex: '#04131c',
    cardHex: '#082030',
    borderHex: '#0f3854',
    description: 'Submerged oceanic teal abyss'
  },
  zinc: {
    name: 'Industrial Zinc',
    bgClass: 'bg-[#101114]',
    cardClass: 'bg-[#181a1f]/90',
    borderClass: 'border-[#292d36]',
    hex: '#101114',
    cardHex: '#181a1f',
    borderHex: '#292d36',
    description: 'Tactical gunmetal titanium'
  },
  amber_dark: {
    name: 'Antique Bronze',
    bgClass: 'bg-[#151006]',
    cardClass: 'bg-[#22190a]/90',
    borderClass: 'border-[#3d2e14]',
    hex: '#151006',
    cardHex: '#22190a',
    borderHex: '#3d2e14',
    description: 'Subtle warm vintage dark amber'
  }
};

export const PRESET_APP_THEMES: AppThemeConfig[] = [
  // ── STANDARD PRESETS (Guaranteed 6 mutually-exclusive distinct colors) ──
  {
    id: 'indigo_citadel',
    name: 'Citadel Indigo (Default)',
    description: 'The standard Mason blueprint theme. 6 fully distinct hues across primary header and all modules.',
    category: 'standard',
    primary: 'indigo',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'cyan',
      biomes: 'emerald',
      prefabs: 'rose',
      ui: 'amber',
      gamestructure: 'purple'
    }
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon 2088',
    description: 'High-contrast glowing cyan primary with lime strata, teal biomes, hot fuchsia avatars, and amber HUD.',
    category: 'standard',
    primary: 'cyan',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'lime',
      biomes: 'teal',
      prefabs: 'fuchsia',
      ui: 'amber',
      gamestructure: 'purple'
    }
  },
  {
    id: 'emerald_deepwood',
    name: 'Emerald Deepwood',
    description: 'Lush forest tones with radiant emerald primary, sky blue maps, chartreuse biomes, and gold interface.',
    category: 'standard',
    primary: 'emerald',
    backgroundTone: 'slate',
    moduleColors: {
      maps: 'sky',
      biomes: 'lime',
      prefabs: 'rose',
      ui: 'gold',
      gamestructure: 'indigo'
    }
  },
  {
    id: 'obsidian_crimson',
    name: 'Obsidian Crimson',
    description: 'Dramatic blood-ruby crimson primary with neon cyan maps, verdant biomes, fuchsia avatars, and solar HUD.',
    category: 'standard',
    primary: 'crimson',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'cyan',
      biomes: 'emerald',
      prefabs: 'fuchsia',
      ui: 'amber',
      gamestructure: 'purple'
    }
  },
  {
    id: 'solar_amber',
    name: 'Solar Flare & Gold',
    description: 'Warm energetic amber primary paired with cyan maps, electric lime biomes, and deep astral graph.',
    category: 'standard',
    primary: 'amber',
    backgroundTone: 'espresso',
    moduleColors: {
      maps: 'cyan',
      biomes: 'lime',
      prefabs: 'rose',
      ui: 'teal',
      gamestructure: 'purple'
    }
  },
  {
    id: 'astral_violet',
    name: 'Astral Void & Amethyst',
    description: 'Cosmic purple primary with cyan cartography, chartreuse flora, rose avatars, and cobalt logic graph.',
    category: 'standard',
    primary: 'purple',
    backgroundTone: 'navy',
    moduleColors: {
      maps: 'cyan',
      biomes: 'lime',
      prefabs: 'rose',
      ui: 'amber',
      gamestructure: 'blue'
    }
  },
  {
    id: 'vaporwave_sunset',
    name: 'Vaporwave Sunset',
    description: 'Retro synthwave fuchsia with cyan wireframes, electric lime, blaze orange avatars, and golden horizon HUD.',
    category: 'standard',
    primary: 'fuchsia',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'cyan',
      biomes: 'lime',
      prefabs: 'orange',
      ui: 'gold',
      gamestructure: 'indigo'
    }
  },

  // ── COLOR BLINDNESS ACCESSIBLE THEMES (CUD & High Distinction) ──
  {
    id: 'okabe_ito_universal',
    name: 'Okabe-Ito Universal (CUD)',
    description: 'Gold-standard Color Universal Design (Nature Methods). Maximally distinct for all vision types.',
    category: 'accessibility',
    accessibilityTag: 'Universal Safe',
    primary: 'okabe_blue',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'okabe_skyblue',
      biomes: 'okabe_bluishgreen',
      prefabs: 'okabe_vermillion',
      ui: 'okabe_yellow',
      gamestructure: 'okabe_redpurple'
    }
  },
  {
    id: 'deuteranopia_safe',
    name: 'Deuteranopia / Protanopia Safe',
    description: 'Optimized for red-green color blindness (~8% of males). Zero red-green confusion using blue, gold, and orange.',
    category: 'accessibility',
    accessibilityTag: 'Red-Green Safe',
    primary: 'blue',
    backgroundTone: 'slate',
    moduleColors: {
      maps: 'sky',
      biomes: 'teal',
      prefabs: 'orange',
      ui: 'gold',
      gamestructure: 'purple'
    }
  },
  {
    id: 'tritanopia_safe',
    name: 'Tritanopia Safe',
    description: 'Optimized for blue-yellow vision deficiency. High-contrast crimson, emerald, hot fuchsia, and platinum.',
    category: 'accessibility',
    accessibilityTag: 'Blue-Yellow Safe',
    primary: 'crimson',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'emerald',
      biomes: 'lime',
      prefabs: 'fuchsia',
      ui: 'coral',
      gamestructure: 'white'
    }
  },
  {
    id: 'high_contrast_achromatopsia',
    name: 'High-Contrast Luminance',
    description: 'Stepped lightness values for total color blindness (achromatopsia), grayscale, or low-vision clarity.',
    category: 'accessibility',
    accessibilityTag: 'Achromatopsia Safe',
    primary: 'white',
    backgroundTone: 'void',
    moduleColors: {
      maps: 'cyan',
      biomes: 'lime',
      prefabs: 'coral',
      ui: 'gold',
      gamestructure: 'monochrome'
    }
  }
];

const THEME_STORAGE_KEY = 'mason_app_theme_config';

export function loadSavedAppTheme(): AppThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.primary && parsed.moduleColors) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved app theme:', err);
  }
  return PRESET_APP_THEMES[0];
}

export function saveAppTheme(theme: AppThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    applyThemeCSSVariables(theme);
  } catch (err) {
    console.warn('Failed to save app theme:', err);
  }
}

export function applyThemeCSSVariables(theme: AppThemeConfig): void {
  try {
    const root = document.documentElement;
    const primaryDef = COLOR_DEFINITIONS[theme.primary] || COLOR_DEFINITIONS.indigo;
    const bgDef = BACKGROUND_TONES[theme.backgroundTone] || BACKGROUND_TONES.void;

    root.style.setProperty('--mason-primary', primaryDef.hex);
    root.style.setProperty('--mason-primary-rgb', primaryDef.rgb);

    root.style.setProperty('--mason-maps-color', COLOR_DEFINITIONS[theme.moduleColors.maps]?.hex || '#06b6d4');
    root.style.setProperty('--mason-biomes-color', COLOR_DEFINITIONS[theme.moduleColors.biomes]?.hex || '#10b981');
    root.style.setProperty('--mason-prefabs-color', COLOR_DEFINITIONS[theme.moduleColors.prefabs]?.hex || '#f43f5e');
    root.style.setProperty('--mason-ui-color', COLOR_DEFINITIONS[theme.moduleColors.ui]?.hex || '#f59e0b');
    root.style.setProperty('--mason-gamestructure-color', COLOR_DEFINITIONS[theme.moduleColors.gamestructure]?.hex || '#a855f7');
    root.style.setProperty('--mason-bg-base', bgDef.hex);
    root.style.setProperty('--mason-bg-card', bgDef.cardHex);
    root.style.setProperty('--mason-border-base', bgDef.borderHex);

    // Update document & body background colors directly for immediate full-app application
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = bgDef.hex;
      if (document.body) {
        document.body.style.backgroundColor = bgDef.hex;
      }

      // Update all <meta name="theme-color"> tags to color the PWA window titlebar and browser chrome
      const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
      if (themeMetas.length > 0) {
        themeMetas.forEach(meta => meta.setAttribute('content', primaryDef.hex));
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('content', primaryDef.hex);
        document.head.appendChild(meta);
      }

      // Update msapplication-navbutton-color for Windows/Edge
      let msNav = document.querySelector('meta[name="msapplication-navbutton-color"]');
      if (!msNav) {
        msNav = document.createElement('meta');
        msNav.setAttribute('name', 'msapplication-navbutton-color');
        document.head.appendChild(msNav);
      }
      msNav.setAttribute('content', primaryDef.hex);

      // Update apple status bar
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(appleMeta);
      }
      appleMeta.setAttribute('content', 'black-translucent');
    }
  } catch (e) {
    console.warn('Failed to apply theme variables / meta tags:', e);
  }
}
