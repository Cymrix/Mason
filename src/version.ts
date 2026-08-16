/**
 * Mason Core Version Configuration
 * Current Release: v0.35
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.30 -> v0.31 -> v0.32 -> v0.33 -> v0.34 -> v0.35).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.35.0';
export const MASON_VERSION_DISPLAY = 'v0.35';
export const MASON_FULL_VERSION = 'v0.35';

export interface ProjectChangeRecord {
  timestamp: string;
  action: string;
  revision: number;
}

/**
 * Returns formatted version string with optional revision or build tag
 */
export const getMasonVersionString = (revision?: number): string => {
  if (revision !== undefined && revision > 0) {
    return `${MASON_VERSION_DISPLAY}-rev${revision}`;
  }
  return MASON_FULL_VERSION;
};

/**
 * Release History Log
 */
export const MASON_RELEASE_HISTORY = [
  {
    version: 'v0.35',
    date: '2026-08-16',
    changes: [
      'Added Full Albedo Texture preview tab to the left of 47-Blob Matrix in Biome Studio preview workspace',
      'Implemented pure seamless blended albedo canvas (Base Material A ↔ Base Material B dual-noise projection)',
      'Added interactive cursor-centered wheel zoom, right-click panning, reset HUD, and grid border toggle support',
      'Added Export Albedo PNG download feature for standalone map exports'
    ]
  },
  {
    version: 'v0.34',
    date: '2026-08-16',
    changes: [
      'Relocated Dual Overlapping Noise Blend Map controls directly to the left side of the Blob Tileset Preview section',
      'Created side-by-side side panel layout enabling instant real-time visualization of noise scale, weight, seed, contrast, and threshold adjustments on the preview canvas'
    ]
  },
  {
    version: 'v0.33',
    date: '2026-08-16',
    changes: [
      'Fixed albedo noise map range normalization (stretching raw noise from [0.25, 0.75] to full [0.0, 1.0] range)',
      'Ensured Base Material B reaches 100% solid opacity at contrast 1.0 without requiring extreme contrast boosts',
      'Fixed noise mask inversion (Base A <-> Base B swap) to produce immediate 100% pattern reversals',
      'Added Layer 1 and Layer 2 Weight Influence sliders to Biome Studio noise blend controls'
    ]
  },
  {
    version: 'v0.32',
    date: '2026-08-16',
    changes: [
      'Expanded noise scale sliders to 4px - 512px, enabling noise features up to full albedo texture sizes',
      'Added seed controls and randomize buttons for Noise Layer 1 and Noise Layer 2',
      'Increased blend contrast range up to 10.0 with C2 quintic noise smoothstep, enabling sharp patches of Material B at 100% full opacity'
    ]
  },
  {
    version: 'v0.31',
    date: '2026-08-16',
    changes: [
      'Fixed mouse wheel cursor-centered zoom in Biome Studio blob matrix and live sandbox preview',
      'Hardcoded tile size to 64px and removed tile scale UI selectors from Biome preview',
      'Fixed Base Material B albedo texture wrapping to support 100% full opacity blending'
    ]
  },
  {
    version: 'v0.30',
    date: '2026-08-16',
    changes: [
      'Updated autotile edge overlay render order in Biome Studio: sides -> bottom -> top',
      'Configured heightmap and roughness textures to use world-aligned seamless repeating matching albedo texture scale'
    ]
  },
  {
    version: 'v0.29',
    date: '2026-08-16',
    changes: [
      'Removed "MENU" text label from the main hamburger trigger button',
      'Automatically hide PWA install buttons once the application is running in installed mode'
    ]
  }
];
