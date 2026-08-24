export type AccentColorKey = 
  | 'hue_0'   | 'hue_10'  | 'hue_20'  | 'hue_30'  | 'hue_40'  | 'hue_50'
  | 'hue_60'  | 'hue_70'  | 'hue_80'  | 'hue_90'  | 'hue_100' | 'hue_110'
  | 'hue_120' | 'hue_130' | 'hue_140' | 'hue_150' | 'hue_160' | 'hue_170'
  | 'hue_180' | 'hue_190' | 'hue_200' | 'hue_210' | 'hue_220' | 'hue_230'
  | 'hue_240' | 'hue_250' | 'hue_260' | 'hue_270' | 'hue_280' | 'hue_290'
  | 'hue_300' | 'hue_310' | 'hue_320' | 'hue_330' | 'hue_340' | 'hue_350'
  | 'gray_white'
  | 'gray_silver'
  | 'gray_slate'
  | 'gray_charcoal'
  | 'gray_obsidian'
  // Legacy aliases
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
  sprites: AccentColorKey;
  maps: AccentColorKey;
  biomes: AccentColorKey;
  prefabs: AccentColorKey;
  particles: AccentColorKey;
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
  // ── 36 CHROMATIC HUES (10° Intervals around 360° Color Wheel at 100% Saturation & 50% Lightness) ──
  hue_0:   { name: 'Pure Red', hex: '#ff0000', rgb: '255, 0, 0', bgClass: 'bg-[#ff0000] hover:opacity-90', textClass: 'text-[#ff0000]', borderClass: 'border-[#ff0000]/50', badgeClass: 'bg-[#ff0000]/20 border-[#ff0000]/40 text-[#ff0000]', ringClass: 'ring-[#ff0000]/40', gradientFromClass: 'from-[#ff0000]' },
  hue_10:  { name: 'Scarlet Red', hex: '#ff2b00', rgb: '255, 43, 0', bgClass: 'bg-[#ff2b00] hover:opacity-90', textClass: 'text-[#ff2b00]', borderClass: 'border-[#ff2b00]/50', badgeClass: 'bg-[#ff2b00]/20 border-[#ff2b00]/40 text-[#ff2b00]', ringClass: 'ring-[#ff2b00]/40', gradientFromClass: 'from-[#ff2b00]' },
  hue_20:  { name: 'Coral Red', hex: '#ff5500', rgb: '255, 85, 0', bgClass: 'bg-[#ff5500] hover:opacity-90', textClass: 'text-[#ff5500]', borderClass: 'border-[#ff5500]/50', badgeClass: 'bg-[#ff5500]/20 border-[#ff5500]/40 text-[#ff5500]', ringClass: 'ring-[#ff5500]/40', gradientFromClass: 'from-[#ff5500]' },
  hue_30:  { name: 'Deep Orange', hex: '#ff8000', rgb: '255, 128, 0', bgClass: 'bg-[#ff8000] hover:opacity-90', textClass: 'text-[#ff8000]', borderClass: 'border-[#ff8000]/50', badgeClass: 'bg-[#ff8000]/20 border-[#ff8000]/40 text-[#ff8000]', ringClass: 'ring-[#ff8000]/40', gradientFromClass: 'from-[#ff8000]' },
  hue_40:  { name: 'Blaze Orange', hex: '#ffaa00', rgb: '255, 170, 0', bgClass: 'bg-[#ffaa00] hover:opacity-90 text-neutral-950', textClass: 'text-[#ffaa00]', borderClass: 'border-[#ffaa00]/50', badgeClass: 'bg-[#ffaa00]/20 border-[#ffaa00]/40 text-[#ffaa00]', ringClass: 'ring-[#ffaa00]/40', gradientFromClass: 'from-[#ffaa00]' },
  hue_50:  { name: 'Golden Amber', hex: '#ffd500', rgb: '255, 213, 0', bgClass: 'bg-[#ffd500] hover:opacity-90 text-neutral-950', textClass: 'text-[#ffd500]', borderClass: 'border-[#ffd500]/50', badgeClass: 'bg-[#ffd500]/20 border-[#ffd500]/40 text-[#ffd500]', ringClass: 'ring-[#ffd500]/40', gradientFromClass: 'from-[#ffd500]' },
  hue_60:  { name: 'Pure Yellow', hex: '#ffff00', rgb: '255, 255, 0', bgClass: 'bg-[#ffff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#ffff00]', borderClass: 'border-[#ffff00]/50', badgeClass: 'bg-[#ffff00]/20 border-[#ffff00]/40 text-[#ffff00]', ringClass: 'ring-[#ffff00]/40', gradientFromClass: 'from-[#ffff00]' },
  hue_70:  { name: 'Lime Yellow', hex: '#d5ff00', rgb: '213, 255, 0', bgClass: 'bg-[#d5ff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#d5ff00]', borderClass: 'border-[#d5ff00]/50', badgeClass: 'bg-[#d5ff00]/20 border-[#d5ff00]/40 text-[#d5ff00]', ringClass: 'ring-[#d5ff00]/40', gradientFromClass: 'from-[#d5ff00]' },
  hue_80:  { name: 'Solar Lime', hex: '#aaff00', rgb: '170, 255, 0', bgClass: 'bg-[#aaff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#aaff00]', borderClass: 'border-[#aaff00]/50', badgeClass: 'bg-[#aaff00]/20 border-[#aaff00]/40 text-[#aaff00]', ringClass: 'ring-[#aaff00]/40', gradientFromClass: 'from-[#aaff00]' },
  hue_90:  { name: 'Pure Lime', hex: '#80ff00', rgb: '128, 255, 0', bgClass: 'bg-[#80ff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#80ff00]', borderClass: 'border-[#80ff00]/50', badgeClass: 'bg-[#80ff00]/20 border-[#80ff00]/40 text-[#80ff00]', ringClass: 'ring-[#80ff00]/40', gradientFromClass: 'from-[#80ff00]' },
  hue_100: { name: 'Electric Green', hex: '#55ff00', rgb: '85, 255, 0', bgClass: 'bg-[#55ff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#55ff00]', borderClass: 'border-[#55ff00]/50', badgeClass: 'bg-[#55ff00]/20 border-[#55ff00]/40 text-[#55ff00]', ringClass: 'ring-[#55ff00]/40', gradientFromClass: 'from-[#55ff00]' },
  hue_110: { name: 'Bright Green', hex: '#2bff00', rgb: '43, 255, 0', bgClass: 'bg-[#2bff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#2bff00]', borderClass: 'border-[#2bff00]/50', badgeClass: 'bg-[#2bff00]/20 border-[#2bff00]/40 text-[#2bff00]', ringClass: 'ring-[#2bff00]/40', gradientFromClass: 'from-[#2bff00]' },
  hue_120: { name: 'Pure Green', hex: '#00ff00', rgb: '0, 255, 0', bgClass: 'bg-[#00ff00] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ff00]', borderClass: 'border-[#00ff00]/50', badgeClass: 'bg-[#00ff00]/20 border-[#00ff00]/40 text-[#00ff00]', ringClass: 'ring-[#00ff00]/40', gradientFromClass: 'from-[#00ff00]' },
  hue_130: { name: 'Emerald Mint', hex: '#00ff2b', rgb: '0, 255, 43', bgClass: 'bg-[#00ff2b] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ff2b]', borderClass: 'border-[#00ff2b]/50', badgeClass: 'bg-[#00ff2b]/20 border-[#00ff2b]/40 text-[#00ff2b]', ringClass: 'ring-[#00ff2b]/40', gradientFromClass: 'from-[#00ff2b]' },
  hue_140: { name: 'Hyper Mint', hex: '#00ff55', rgb: '0, 255, 85', bgClass: 'bg-[#00ff55] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ff55]', borderClass: 'border-[#00ff55]/50', badgeClass: 'bg-[#00ff55]/20 border-[#00ff55]/40 text-[#00ff55]', ringClass: 'ring-[#00ff55]/40', gradientFromClass: 'from-[#00ff55]' },
  hue_150: { name: 'Pure Jade', hex: '#00ff80', rgb: '0, 255, 128', bgClass: 'bg-[#00ff80] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ff80]', borderClass: 'border-[#00ff80]/50', badgeClass: 'bg-[#00ff80]/20 border-[#00ff80]/40 text-[#00ff80]', ringClass: 'ring-[#00ff80]/40', gradientFromClass: 'from-[#00ff80]' },
  hue_160: { name: 'Abyssal Teal', hex: '#00ffaa', rgb: '0, 255, 170', bgClass: 'bg-[#00ffaa] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ffaa]', borderClass: 'border-[#00ffaa]/50', badgeClass: 'bg-[#00ffaa]/20 border-[#00ffaa]/40 text-[#00ffaa]', ringClass: 'ring-[#00ffaa]/40', gradientFromClass: 'from-[#00ffaa]' },
  hue_170: { name: 'Ocean Teal', hex: '#00ffd5', rgb: '0, 255, 213', bgClass: 'bg-[#00ffd5] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ffd5]', borderClass: 'border-[#00ffd5]/50', badgeClass: 'bg-[#00ffd5]/20 border-[#00ffd5]/40 text-[#00ffd5]', ringClass: 'ring-[#00ffd5]/40', gradientFromClass: 'from-[#00ffd5]' },
  hue_180: { name: 'Pure Cyan', hex: '#00ffff', rgb: '0, 255, 255', bgClass: 'bg-[#00ffff] hover:opacity-90 text-neutral-950', textClass: 'text-[#00ffff]', borderClass: 'border-[#00ffff]/50', badgeClass: 'bg-[#00ffff]/20 border-[#00ffff]/40 text-[#00ffff]', ringClass: 'ring-[#00ffff]/40', gradientFromClass: 'from-[#00ffff]' },
  hue_190: { name: 'Sky Cyan', hex: '#00d5ff', rgb: '0, 213, 255', bgClass: 'bg-[#00d5ff] hover:opacity-90 text-neutral-950', textClass: 'text-[#00d5ff]', borderClass: 'border-[#00d5ff]/50', badgeClass: 'bg-[#00d5ff]/20 border-[#00d5ff]/40 text-[#00d5ff]', ringClass: 'ring-[#00d5ff]/40', gradientFromClass: 'from-[#00d5ff]' },
  hue_200: { name: 'Sky Blue', hex: '#00aaff', rgb: '0, 170, 255', bgClass: 'bg-[#00aaff] hover:opacity-90 text-neutral-950', textClass: 'text-[#00aaff]', borderClass: 'border-[#00aaff]/50', badgeClass: 'bg-[#00aaff]/20 border-[#00aaff]/40 text-[#00aaff]', ringClass: 'ring-[#00aaff]/40', gradientFromClass: 'from-[#00aaff]' },
  hue_210: { name: 'Pure Azure', hex: '#0080ff', rgb: '0, 128, 255', bgClass: 'bg-[#0080ff] hover:opacity-90', textClass: 'text-[#0080ff]', borderClass: 'border-[#0080ff]/50', badgeClass: 'bg-[#0080ff]/20 border-[#0080ff]/40 text-[#0080ff]', ringClass: 'ring-[#0080ff]/40', gradientFromClass: 'from-[#0080ff]' },
  hue_220: { name: 'Royal Cobalt', hex: '#0055ff', rgb: '0, 85, 255', bgClass: 'bg-[#0055ff] hover:opacity-90', textClass: 'text-[#0055ff]', borderClass: 'border-[#0055ff]/50', badgeClass: 'bg-[#0055ff]/20 border-[#0055ff]/40 text-[#0055ff]', ringClass: 'ring-[#0055ff]/40', gradientFromClass: 'from-[#0055ff]' },
  hue_230: { name: 'Royal Blue', hex: '#002bff', rgb: '0, 43, 255', bgClass: 'bg-[#002bff] hover:opacity-90', textClass: 'text-[#002bff]', borderClass: 'border-[#002bff]/50', badgeClass: 'bg-[#002bff]/20 border-[#002bff]/40 text-[#002bff]', ringClass: 'ring-[#002bff]/40', gradientFromClass: 'from-[#002bff]' },
  hue_240: { name: 'Pure Blue', hex: '#0000ff', rgb: '0, 0, 255', bgClass: 'bg-[#0000ff] hover:opacity-90', textClass: 'text-[#0000ff]', borderClass: 'border-[#0000ff]/50', badgeClass: 'bg-[#0000ff]/20 border-[#0000ff]/40 text-[#0000ff]', ringClass: 'ring-[#0000ff]/40', gradientFromClass: 'from-[#0000ff]' },
  hue_250: { name: 'Electric Indigo', hex: '#2b00ff', rgb: '43, 0, 255', bgClass: 'bg-[#2b00ff] hover:opacity-90', textClass: 'text-[#2b00ff]', borderClass: 'border-[#2b00ff]/50', badgeClass: 'bg-[#2b00ff]/20 border-[#2b00ff]/40 text-[#2b00ff]', ringClass: 'ring-[#2b00ff]/40', gradientFromClass: 'from-[#2b00ff]' },
  hue_260: { name: 'Cosmic Violet', hex: '#5500ff', rgb: '85, 0, 255', bgClass: 'bg-[#5500ff] hover:opacity-90', textClass: 'text-[#5500ff]', borderClass: 'border-[#5500ff]/50', badgeClass: 'bg-[#5500ff]/20 border-[#5500ff]/40 text-[#5500ff]', ringClass: 'ring-[#5500ff]/40', gradientFromClass: 'from-[#5500ff]' },
  hue_270: { name: 'Pure Violet', hex: '#8000ff', rgb: '128, 0, 255', bgClass: 'bg-[#8000ff] hover:opacity-90', textClass: 'text-[#8000ff]', borderClass: 'border-[#8000ff]/50', badgeClass: 'bg-[#8000ff]/20 border-[#8000ff]/40 text-[#8000ff]', ringClass: 'ring-[#8000ff]/40', gradientFromClass: 'from-[#8000ff]' },
  hue_280: { name: 'Astral Purple', hex: '#aa00ff', rgb: '170, 0, 255', bgClass: 'bg-[#aa00ff] hover:opacity-90', textClass: 'text-[#aa00ff]', borderClass: 'border-[#aa00ff]/50', badgeClass: 'bg-[#aa00ff]/20 border-[#aa00ff]/40 text-[#aa00ff]', ringClass: 'ring-[#aa00ff]/40', gradientFromClass: 'from-[#aa00ff]' },
  hue_290: { name: 'Deep Magenta', hex: '#d500ff', rgb: '213, 0, 255', bgClass: 'bg-[#d500ff] hover:opacity-90', textClass: 'text-[#d500ff]', borderClass: 'border-[#d500ff]/50', badgeClass: 'bg-[#d500ff]/20 border-[#d500ff]/40 text-[#d500ff]', ringClass: 'ring-[#d500ff]/40', gradientFromClass: 'from-[#d500ff]' },
  hue_300: { name: 'Pure Magenta', hex: '#ff00ff', rgb: '255, 0, 255', bgClass: 'bg-[#ff00ff] hover:opacity-90', textClass: 'text-[#ff00ff]', borderClass: 'border-[#ff00ff]/50', badgeClass: 'bg-[#ff00ff]/20 border-[#ff00ff]/40 text-[#ff00ff]', ringClass: 'ring-[#ff00ff]/40', gradientFromClass: 'from-[#ff00ff]' },
  hue_310: { name: 'Bright Fuchsia', hex: '#ff00d5', rgb: '255, 0, 213', bgClass: 'bg-[#ff00d5] hover:opacity-90', textClass: 'text-[#ff00d5]', borderClass: 'border-[#ff00d5]/50', badgeClass: 'bg-[#ff00d5]/20 border-[#ff00d5]/40 text-[#ff00d5]', ringClass: 'ring-[#ff00d5]/40', gradientFromClass: 'from-[#ff00d5]' },
  hue_320: { name: 'Neon Pink', hex: '#ff00aa', rgb: '255, 0, 170', bgClass: 'bg-[#ff00aa] hover:opacity-90', textClass: 'text-[#ff00aa]', borderClass: 'border-[#ff00aa]/50', badgeClass: 'bg-[#ff00aa]/20 border-[#ff00aa]/40 text-[#ff00aa]', ringClass: 'ring-[#ff00aa]/40', gradientFromClass: 'from-[#ff00aa]' },
  hue_330: { name: 'Deep Rose', hex: '#ff0080', rgb: '255, 0, 128', bgClass: 'bg-[#ff0080] hover:opacity-90', textClass: 'text-[#ff0080]', borderClass: 'border-[#ff0080]/50', badgeClass: 'bg-[#ff0080]/20 border-[#ff0080]/40 text-[#ff0080]', ringClass: 'ring-[#ff0080]/40', gradientFromClass: 'from-[#ff0080]' },
  hue_340: { name: 'Deep Carmine', hex: '#ff0055', rgb: '255, 0, 85', bgClass: 'bg-[#ff0055] hover:opacity-90', textClass: 'text-[#ff0055]', borderClass: 'border-[#ff0055]/50', badgeClass: 'bg-[#ff0055]/20 border-[#ff0055]/40 text-[#ff0055]', ringClass: 'ring-[#ff0055]/40', gradientFromClass: 'from-[#ff0055]' },
  hue_350: { name: 'Ruby Red', hex: '#ff002b', rgb: '255, 0, 43', bgClass: 'bg-[#ff002b] hover:opacity-90', textClass: 'text-[#ff002b]', borderClass: 'border-[#ff002b]/50', badgeClass: 'bg-[#ff002b]/20 border-[#ff002b]/40 text-[#ff002b]', ringClass: 'ring-[#ff002b]/40', gradientFromClass: 'from-[#ff002b]' },

  // ── 5 GRAYSCALE CONTRAST STEPS ──
  gray_white: {
    name: 'Platinum White',
    hex: '#ffffff',
    rgb: '255, 255, 255',
    bgClass: 'bg-[#ffffff] hover:bg-[#e6e6e6] text-neutral-950',
    textClass: 'text-[#ffffff]',
    borderClass: 'border-[#ffffff]/50',
    badgeClass: 'bg-[#ffffff]/20 border-[#ffffff]/40 text-[#ffffff]',
    ringClass: 'ring-[#ffffff]/40',
    gradientFromClass: 'from-[#ffffff]'
  },
  gray_silver: {
    name: 'Bright Silver',
    hex: '#cccccc',
    rgb: '204, 204, 204',
    bgClass: 'bg-[#cccccc] hover:bg-[#b3b3b3] text-neutral-950',
    textClass: 'text-[#cccccc]',
    borderClass: 'border-[#cccccc]/50',
    badgeClass: 'bg-[#cccccc]/20 border-[#cccccc]/40 text-[#cccccc]',
    ringClass: 'ring-[#cccccc]/40',
    gradientFromClass: 'from-[#cccccc]'
  },
  gray_slate: {
    name: 'Steel Slate',
    hex: '#888888',
    rgb: '136, 136, 136',
    bgClass: 'bg-[#888888] hover:bg-[#777777]',
    textClass: 'text-[#888888]',
    borderClass: 'border-[#888888]/50',
    badgeClass: 'bg-[#888888]/20 border-[#888888]/40 text-[#888888]',
    ringClass: 'ring-[#888888]/40',
    gradientFromClass: 'from-[#888888]'
  },
  gray_charcoal: {
    name: 'Dark Charcoal',
    hex: '#444444',
    rgb: '68, 68, 68',
    bgClass: 'bg-[#444444] hover:bg-[#333333]',
    textClass: 'text-[#aaaaaa]',
    borderClass: 'border-[#444444]/50',
    badgeClass: 'bg-[#444444]/20 border-[#444444]/40 text-[#aaaaaa]',
    ringClass: 'ring-[#444444]/40',
    gradientFromClass: 'from-[#444444]'
  },
  gray_obsidian: {
    name: 'Carbon Graphite',
    hex: '#111111',
    rgb: '17, 17, 17',
    bgClass: 'bg-[#111111] hover:bg-[#000000]',
    textClass: 'text-[#888888]',
    borderClass: 'border-[#333333]',
    badgeClass: 'bg-[#111111]/80 border-[#333333] text-[#888888]',
    ringClass: 'ring-[#333333]',
    gradientFromClass: 'from-[#111111]'
  },

  // ── LEGACY ALIASES (Backwards compatibility) ──
  indigo: { name: 'Citadel Indigo', hex: '#4000ff', rgb: '64, 0, 255', bgClass: 'bg-[#4000ff]', textClass: 'text-[#4000ff]', borderClass: 'border-[#4000ff]/50', badgeClass: 'bg-[#4000ff]/20 text-[#4000ff]', ringClass: 'ring-[#4000ff]/40', gradientFromClass: 'from-[#4000ff]' },
  cyan: { name: 'Pure Cyan', hex: '#00ffff', rgb: '0, 255, 255', bgClass: 'bg-[#00ffff] text-neutral-950', textClass: 'text-[#00ffff]', borderClass: 'border-[#00ffff]/50', badgeClass: 'bg-[#00ffff]/20 text-[#00ffff]', ringClass: 'ring-[#00ffff]/40', gradientFromClass: 'from-[#00ffff]' },
  emerald: { name: 'Pure Green', hex: '#00ff00', rgb: '0, 255, 0', bgClass: 'bg-[#00ff00] text-neutral-950', textClass: 'text-[#00ff00]', borderClass: 'border-[#00ff00]/50', badgeClass: 'bg-[#00ff00]/20 text-[#00ff00]', ringClass: 'ring-[#00ff00]/40', gradientFromClass: 'from-[#00ff00]' },
  rose: { name: 'Crimson Rose', hex: '#ff006a', rgb: '255, 0, 106', bgClass: 'bg-[#ff006a]', textClass: 'text-[#ff006a]', borderClass: 'border-[#ff006a]/50', badgeClass: 'bg-[#ff006a]/20 text-[#ff006a]', ringClass: 'ring-[#ff006a]/40', gradientFromClass: 'from-[#ff006a]' },
  amber: { name: 'Warm Amber', hex: '#ffea00', rgb: '255, 234, 0', bgClass: 'bg-[#ffea00] text-neutral-950', textClass: 'text-[#ffea00]', borderClass: 'border-[#ffea00]/50', badgeClass: 'bg-[#ffea00]/20 text-[#ffea00]', ringClass: 'ring-[#ffea00]/40', gradientFromClass: 'from-[#ffea00]' },
  purple: { name: 'Astral Purple', hex: '#aa00ff', rgb: '170, 0, 255', bgClass: 'bg-[#aa00ff]', textClass: 'text-[#aa00ff]', borderClass: 'border-[#aa00ff]/50', badgeClass: 'bg-[#aa00ff]/20 text-[#aa00ff]', ringClass: 'ring-[#aa00ff]/40', gradientFromClass: 'from-[#aa00ff]' },
  blue: { name: 'Royal Cobalt', hex: '#0055ff', rgb: '0, 85, 255', bgClass: 'bg-[#0055ff]', textClass: 'text-[#0055ff]', borderClass: 'border-[#0055ff]/50', badgeClass: 'bg-[#0055ff]/20 text-[#0055ff]', ringClass: 'ring-[#0055ff]/40', gradientFromClass: 'from-[#0055ff]' },
  crimson: { name: 'Pure Red', hex: '#ff0000', rgb: '255, 0, 0', bgClass: 'bg-[#ff0000]', textClass: 'text-[#ff0000]', borderClass: 'border-[#ff0000]/50', badgeClass: 'bg-[#ff0000]/20 text-[#ff0000]', ringClass: 'ring-[#ff0000]/40', gradientFromClass: 'from-[#ff0000]' },
  teal: { name: 'Abyssal Teal', hex: '#00ffaa', rgb: '0, 255, 170', bgClass: 'bg-[#00ffaa] text-neutral-950', textClass: 'text-[#00ffaa]', borderClass: 'border-[#00ffaa]/50', badgeClass: 'bg-[#00ffaa]/20 text-[#00ffaa]', ringClass: 'ring-[#00ffaa]/40', gradientFromClass: 'from-[#00ffaa]' },
  fuchsia: { name: 'Vapor Fuchsia', hex: '#ff00ea', rgb: '255, 0, 234', bgClass: 'bg-[#ff00ea]', textClass: 'text-[#ff00ea]', borderClass: 'border-[#ff00ea]/50', badgeClass: 'bg-[#ff00ea]/20 text-[#ff00ea]', ringClass: 'ring-[#ff00ea]/40', gradientFromClass: 'from-[#ff00ea]' },
  lime: { name: 'Pure Lime', hex: '#80ff00', rgb: '128, 255, 0', bgClass: 'bg-[#80ff00] text-neutral-950', textClass: 'text-[#80ff00]', borderClass: 'border-[#80ff00]/50', badgeClass: 'bg-[#80ff00]/20 text-[#80ff00]', ringClass: 'ring-[#80ff00]/40', gradientFromClass: 'from-[#80ff00]' },
  orange: { name: 'Blaze Orange', hex: '#ffaa00', rgb: '255, 170, 0', bgClass: 'bg-[#ffaa00] text-neutral-950', textClass: 'text-[#ffaa00]', borderClass: 'border-[#ffaa00]/50', badgeClass: 'bg-[#ffaa00]/20 text-[#ffaa00]', ringClass: 'ring-[#ffaa00]/40', gradientFromClass: 'from-[#ffaa00]' },
  gold: { name: 'Pure Yellow', hex: '#ffff00', rgb: '255, 255, 0', bgClass: 'bg-[#ffff00] text-neutral-950', textClass: 'text-[#ffff00]', borderClass: 'border-[#ffff00]/50', badgeClass: 'bg-[#ffff00]/20 text-[#ffff00]', ringClass: 'ring-[#ffff00]/40', gradientFromClass: 'from-[#ffff00]' },
  sky: { name: 'Sky Blue', hex: '#00aaff', rgb: '0, 170, 255', bgClass: 'bg-[#00aaff] text-neutral-950', textClass: 'text-[#00aaff]', borderClass: 'border-[#00aaff]/50', badgeClass: 'bg-[#00aaff]/20 text-[#00aaff]', ringClass: 'ring-[#00aaff]/40', gradientFromClass: 'from-[#00aaff]' },
  coral: { name: 'Coral Red', hex: '#ff5500', rgb: '255, 85, 0', bgClass: 'bg-[#ff5500]', textClass: 'text-[#ff5500]', borderClass: 'border-[#ff5500]/50', badgeClass: 'bg-[#ff5500]/20 text-[#ff5500]', ringClass: 'ring-[#ff5500]/40', gradientFromClass: 'from-[#ff5500]' },
  monochrome: { name: 'Steel Slate', hex: '#888888', rgb: '136, 136, 136', bgClass: 'bg-[#888888]', textClass: 'text-[#888888]', borderClass: 'border-[#888888]/50', badgeClass: 'bg-[#888888]/20 text-[#888888]', ringClass: 'ring-[#888888]/40', gradientFromClass: 'from-[#888888]' },
  white: { name: 'Platinum White', hex: '#ffffff', rgb: '255, 255, 255', bgClass: 'bg-[#ffffff] text-neutral-950', textClass: 'text-[#ffffff]', borderClass: 'border-[#ffffff]/50', badgeClass: 'bg-[#ffffff]/20 text-[#ffffff]', ringClass: 'ring-[#ffffff]/40', gradientFromClass: 'from-[#ffffff]' },
  okabe_blue: { name: 'Deep Blue', hex: '#0015ff', rgb: '0, 21, 255', bgClass: 'bg-[#0015ff]', textClass: 'text-[#0015ff]', borderClass: 'border-[#0015ff]/50', badgeClass: 'bg-[#0015ff]/20 text-[#0015ff]', ringClass: 'ring-[#0015ff]/40', gradientFromClass: 'from-[#0015ff]' },
  okabe_orange: { name: 'Pure Orange', hex: '#ff9500', rgb: '255, 149, 0', bgClass: 'bg-[#ff9500]', textClass: 'text-[#ff9500]', borderClass: 'border-[#ff9500]/50', badgeClass: 'bg-[#ff9500]/20 text-[#ff9500]', ringClass: 'ring-[#ff9500]/40', gradientFromClass: 'from-[#ff9500]' },
  okabe_skyblue: { name: 'Sky Cyan', hex: '#00d5ff', rgb: '0, 213, 255', bgClass: 'bg-[#00d5ff]', textClass: 'text-[#00d5ff]', borderClass: 'border-[#00d5ff]/50', badgeClass: 'bg-[#00d5ff]/20 text-[#00d5ff]', ringClass: 'ring-[#00d5ff]/40', gradientFromClass: 'from-[#00d5ff]' },
  okabe_bluishgreen: { name: 'Teal Green', hex: '#00ff95', rgb: '0, 255, 149', bgClass: 'bg-[#00ff95]', textClass: 'text-[#00ff95]', borderClass: 'border-[#00ff95]/50', badgeClass: 'bg-[#00ff95]/20 text-[#00ff95]', ringClass: 'ring-[#00ff95]/40', gradientFromClass: 'from-[#00ff95]' },
  okabe_yellow: { name: 'Pure Yellow', hex: '#ffff00', rgb: '255, 255, 0', bgClass: 'bg-[#ffff00] text-neutral-950', textClass: 'text-[#ffff00]', borderClass: 'border-[#ffff00]/50', badgeClass: 'bg-[#ffff00]/20 text-[#ffff00]', ringClass: 'ring-[#ffff00]/40', gradientFromClass: 'from-[#ffff00]' },
  okabe_vermillion: { name: 'Vermillion', hex: '#ff6a00', rgb: '255, 106, 0', bgClass: 'bg-[#ff6a00]', textClass: 'text-[#ff6a00]', borderClass: 'border-[#ff6a00]/50', badgeClass: 'bg-[#ff6a00]/20 text-[#ff6a00]', ringClass: 'ring-[#ff6a00]/40', gradientFromClass: 'from-[#ff6a00]' },
  okabe_redpurple: { name: 'Vapor Fuchsia', hex: '#ff00ea', rgb: '255, 0, 234', bgClass: 'bg-[#ff00ea]', textClass: 'text-[#ff00ea]', borderClass: 'border-[#ff00ea]/50', badgeClass: 'bg-[#ff00ea]/20 text-[#ff00ea]', ringClass: 'ring-[#ff00ea]/40', gradientFromClass: 'from-[#ff00ea]' }
};

export type ColorFamilyKey = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'pink' | 'neutral';

export interface ColorFamilyDef {
  key: ColorFamilyKey;
  name: string;
  badgeHex: string;
  keys: AccentColorKey[];
}

export const COLOR_FAMILIES: Record<ColorFamilyKey, ColorFamilyDef> = {
  red: { key: 'red', name: 'Reds', badgeHex: '#ff0000', keys: ['hue_0', 'hue_10', 'hue_340', 'hue_350', 'crimson', 'rose', 'coral', 'okabe_vermillion'] },
  orange: { key: 'orange', name: 'Oranges', badgeHex: '#ff8000', keys: ['hue_20', 'hue_30', 'hue_40', 'hue_50', 'orange', 'amber', 'okabe_orange'] },
  yellow: { key: 'yellow', name: 'Yellows', badgeHex: '#ffff00', keys: ['hue_60', 'hue_70', 'gold', 'okabe_yellow'] },
  green: { key: 'green', name: 'Greens & Limes', badgeHex: '#00ff00', keys: ['hue_80', 'hue_90', 'hue_100', 'hue_110', 'hue_120', 'hue_130', 'hue_140', 'hue_150', 'emerald', 'lime', 'okabe_bluishgreen'] },
  cyan: { key: 'cyan', name: 'Teals & Cyans', badgeHex: '#00ffff', keys: ['hue_160', 'hue_170', 'hue_180', 'hue_190', 'cyan', 'teal'] },
  blue: { key: 'blue', name: 'Blues', badgeHex: '#0055ff', keys: ['hue_200', 'hue_210', 'hue_220', 'hue_230', 'hue_240', 'blue', 'sky', 'indigo', 'okabe_blue', 'okabe_skyblue'] },
  purple: { key: 'purple', name: 'Purples & Violets', badgeHex: '#aa00ff', keys: ['hue_250', 'hue_260', 'hue_270', 'hue_280', 'hue_290', 'purple', 'fuchsia', 'okabe_redpurple'] },
  pink: { key: 'pink', name: 'Pinks', badgeHex: '#ff00aa', keys: ['hue_300', 'hue_310', 'hue_320', 'hue_330'] },
  neutral: { key: 'neutral', name: 'Grayscales', badgeHex: '#888888', keys: ['gray_white', 'gray_silver', 'gray_slate', 'gray_charcoal', 'gray_obsidian', 'monochrome', 'white'] }
};

export interface HueGroup {
  id: string;
  name: string;
  badgeHex: string;
  keys: AccentColorKey[];
}

export const HUE_GROUPS: HueGroup[] = [
  { id: 'chromatic', name: '10° Chromatic Spectrum (100% Saturation, 50% Lightness)', badgeHex: '#ff0000', keys: [
    'hue_0',   'hue_10',  'hue_20',  'hue_30',  'hue_40',  'hue_50',
    'hue_60',  'hue_70',  'hue_80',  'hue_90',  'hue_100', 'hue_110',
    'hue_120', 'hue_130', 'hue_140', 'hue_150', 'hue_160', 'hue_170',
    'hue_180', 'hue_190', 'hue_200', 'hue_210', 'hue_220', 'hue_230',
    'hue_240', 'hue_250', 'hue_260', 'hue_270', 'hue_280', 'hue_290',
    'hue_300', 'hue_310', 'hue_320', 'hue_330', 'hue_340', 'hue_350'
  ] },
  { id: 'grayscales', name: 'Grayscale Contrast Steps', badgeHex: '#888888', keys: [
    'gray_white', 'gray_silver', 'gray_slate', 'gray_charcoal', 'gray_obsidian'
  ] }
];

export const HUE_ORDERED_COLOR_KEYS: AccentColorKey[] = [
  'hue_0',   'hue_10',  'hue_20',  'hue_30',  'hue_40',  'hue_50',
  'hue_60',  'hue_70',  'hue_80',  'hue_90',  'hue_100', 'hue_110',
  'hue_120', 'hue_130', 'hue_140', 'hue_150', 'hue_160', 'hue_170',
  'hue_180', 'hue_190', 'hue_200', 'hue_210', 'hue_220', 'hue_230',
  'hue_240', 'hue_250', 'hue_260', 'hue_270', 'hue_280', 'hue_290',
  'hue_300', 'hue_310', 'hue_320', 'hue_330', 'hue_340', 'hue_350',
  'gray_white',
  'gray_silver',
  'gray_slate',
  'gray_charcoal',
  'gray_obsidian'
];

export function getColorFamilyKey(colorKey: AccentColorKey): ColorFamilyKey {
  for (const [famKey, famDef] of Object.entries(COLOR_FAMILIES)) {
    if (famDef.keys.includes(colorKey)) {
      return famKey as ColorFamilyKey;
    }
  }
  return 'neutral';
}

export interface ThemeFamilyAnalysis {
  uniqueKeysCount: number;
  familyCount: number;
  familiesUsed: { familyKey: ColorFamilyKey; familyName: string; badgeHex: string; count: number; colors: AccentColorKey[] }[];
  duplicateFamilies: { familyKey: ColorFamilyKey; familyName: string; count: number; colors: AccentColorKey[] }[];
}

export function analyzeThemeFamilies(theme: AppThemeConfig): ThemeFamilyAnalysis {
  const slots: { slotName: string; colorKey: AccentColorKey }[] = [
    { slotName: 'Primary Header', colorKey: theme.primary },
    { slotName: 'Image Editor Module', colorKey: theme.moduleColors.sprites },
    { slotName: 'Maps Module', colorKey: theme.moduleColors.maps },
    { slotName: 'Biomes Module', colorKey: theme.moduleColors.biomes },
    { slotName: 'Prefabs Module', colorKey: theme.moduleColors.prefabs },
    { slotName: 'Particles Module', colorKey: theme.moduleColors.particles },
    { slotName: 'UI Module', colorKey: theme.moduleColors.ui },
    { slotName: 'Game Architecture Module', colorKey: theme.moduleColors.gamestructure }
  ];

  const uniqueKeys = new Set(slots.map(s => s.colorKey));
  const familyMap = new Map<ColorFamilyKey, AccentColorKey[]>();

  for (const slot of slots) {
    const famKey = getColorFamilyKey(slot.colorKey);
    const existing = familyMap.get(famKey) || [];
    existing.push(slot.colorKey);
    familyMap.set(famKey, existing);
  }

  const familiesUsed = Array.from(familyMap.entries()).map(([famKey, colors]) => ({
    familyKey: famKey,
    familyName: COLOR_FAMILIES[famKey]?.name || famKey,
    badgeHex: COLOR_FAMILIES[famKey]?.badgeHex || '#888',
    count: colors.length,
    colors
  }));

  const duplicateFamilies = familiesUsed.filter(f => f.count > 1);

  return {
    uniqueKeysCount: uniqueKeys.size,
    familyCount: familiesUsed.length,
    familiesUsed,
    duplicateFamilies
  };
}

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
  // ── STANDARD PRESETS (Guaranteed 7 Color Family Distinction) ──
  {
    id: 'indigo_citadel',
    name: 'Citadel Indigo (Default)',
    description: 'Standard Mason blueprint theme. Spans all 7 color families with Citadel Indigo header, Emerald Image Editor & Cyan cartography.',
    category: 'standard',
    primary: 'indigo',
    backgroundTone: 'void',
    moduleColors: {
      sprites: 'emerald',
      maps: 'cyan',
      biomes: 'teal',
      prefabs: 'rose',
      particles: 'orange',
      ui: 'gold',
      gamestructure: 'purple'
    }
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon 2088',
    description: 'High-contrast 7-family spectrum: Neon Cyan primary, Emerald Image Editor, Electric Lime maps, Platinum biomes, Vapor Fuchsia prefabs, Blaze particles, Solar Gold HUD, Crimson logic.',
    category: 'standard',
    primary: 'cyan',
    backgroundTone: 'void',
    moduleColors: {
      sprites: 'emerald',
      maps: 'lime',
      biomes: 'white',
      prefabs: 'fuchsia',
      particles: 'orange',
      ui: 'gold',
      gamestructure: 'crimson'
    }
  },
  {
    id: 'emerald_deepwood',
    name: 'Emerald Deepwood',
    description: 'Lush forest theme: Emerald primary, Solar Lime Image Editor, Sky maps, Emerald biomes, Crimson Rose prefabs, Orange particles, Gold HUD, Astral Purple logic.',
    category: 'standard',
    primary: 'emerald',
    backgroundTone: 'slate',
    moduleColors: {
      sprites: 'lime',
      maps: 'sky',
      biomes: 'emerald',
      prefabs: 'rose',
      particles: 'orange',
      ui: 'gold',
      gamestructure: 'purple'
    }
  },
  {
    id: 'obsidian_crimson',
    name: 'Obsidian Crimson',
    description: 'Full 7-family spectrum: Blood-ruby Crimson primary, Pure Green Image Editor, Neon Cyan maps, Abyssal Teal biomes, Blaze Orange prefabs, Solar Gold particles, Slate HUD, Astral Purple logic.',
    category: 'standard',
    primary: 'crimson',
    backgroundTone: 'void',
    moduleColors: {
      sprites: 'emerald',
      maps: 'cyan',
      biomes: 'teal',
      prefabs: 'orange',
      particles: 'gold',
      ui: 'monochrome',
      gamestructure: 'purple'
    }
  },
  {
    id: 'solar_amber',
    name: 'Solar Flare & Amber',
    description: 'Warm energetic 7-family spectrum: Solar Amber primary, Pure Jade Image Editor, Cobalt Blue maps, Electric Lime biomes, Crimson Rose prefabs, Blaze Orange particles, Platinum HUD, Astral Purple logic.',
    category: 'standard',
    primary: 'amber',
    backgroundTone: 'espresso',
    moduleColors: {
      sprites: 'emerald',
      maps: 'blue',
      biomes: 'lime',
      prefabs: 'rose',
      particles: 'orange',
      ui: 'white',
      gamestructure: 'purple'
    }
  },
  {
    id: 'astral_violet',
    name: 'Astral Void & Amethyst',
    description: 'Cosmic 7-family spectrum: Astral Purple primary, Abyssal Teal Image Editor, Neon Cyan maps, Emerald biomes, Sunset Coral prefabs, Blaze Orange particles, Solar Gold HUD, Carbon Slate logic.',
    category: 'standard',
    primary: 'purple',
    backgroundTone: 'navy',
    moduleColors: {
      sprites: 'teal',
      maps: 'cyan',
      biomes: 'emerald',
      prefabs: 'coral',
      particles: 'orange',
      ui: 'gold',
      gamestructure: 'monochrome'
    }
  },
  {
    id: 'vaporwave_sunset',
    name: 'Vaporwave Sunset',
    description: 'Retro synthwave 7-family spectrum: Vapor Fuchsia primary, Emerald Mint Image Editor, Sky Blue maps, Electric Lime biomes, Crimson Rose prefabs, Blaze Orange particles, Solar Amber HUD, Carbon Slate logic.',
    category: 'standard',
    primary: 'fuchsia',
    backgroundTone: 'void',
    moduleColors: {
      sprites: 'emerald',
      maps: 'sky',
      biomes: 'lime',
      prefabs: 'rose',
      particles: 'orange',
      ui: 'amber',
      gamestructure: 'monochrome'
    }
  },
  {
    id: 'monochrome_precision',
    name: 'Monochrome Slate Studio',
    description: 'Tactical graphite neutral primary paired with 7 distinct colorful module accents for minimal header distraction & maximum workspace clarity.',
    category: 'standard',
    primary: 'monochrome',
    backgroundTone: 'carbon',
    moduleColors: {
      sprites: 'emerald',
      maps: 'cyan',
      biomes: 'teal',
      prefabs: 'rose',
      particles: 'amber',
      ui: 'orange',
      gamestructure: 'purple'
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
      sprites: 'okabe_bluishgreen',
      maps: 'okabe_skyblue',
      biomes: 'okabe_orange',
      prefabs: 'okabe_vermillion',
      particles: 'okabe_yellow',
      ui: 'okabe_redpurple',
      gamestructure: 'white'
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
      sprites: 'teal',
      maps: 'sky',
      biomes: 'blue',
      prefabs: 'orange',
      particles: 'amber',
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
      sprites: 'emerald',
      maps: 'lime',
      biomes: 'teal',
      prefabs: 'fuchsia',
      particles: 'coral',
      ui: 'amber',
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
      sprites: 'emerald',
      maps: 'cyan',
      biomes: 'lime',
      prefabs: 'coral',
      particles: 'gold',
      ui: 'amber',
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
        if (!parsed.moduleColors.sprites) {
          parsed.moduleColors.sprites = 'emerald';
        }
        if (!parsed.moduleColors.particles) {
          parsed.moduleColors.particles = 'amber';
        }
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

    root.style.setProperty('--mason-sprites-color', COLOR_DEFINITIONS[theme.moduleColors.sprites]?.hex || '#10b981');
    root.style.setProperty('--mason-maps-color', COLOR_DEFINITIONS[theme.moduleColors.maps]?.hex || '#06b6d4');
    root.style.setProperty('--mason-biomes-color', COLOR_DEFINITIONS[theme.moduleColors.biomes]?.hex || '#10b981');
    root.style.setProperty('--mason-prefabs-color', COLOR_DEFINITIONS[theme.moduleColors.prefabs]?.hex || '#f43f5e');
    root.style.setProperty('--mason-particles-color', COLOR_DEFINITIONS[theme.moduleColors.particles]?.hex || '#f59e0b');
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
