/**
 * Mason Core Version Configuration
 * Current Release: v0.38
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.30 -> v0.31 -> v0.32 -> v0.33 -> v0.34 -> v0.35 -> v0.36 -> v0.37 -> v0.38).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.38.0';
export const MASON_VERSION_DISPLAY = 'v0.38';
export const MASON_FULL_VERSION = 'v0.38';

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
    version: 'v0.38',
    date: '2026-08-16',
    changes: [
      'Separated slope overlays into dedicated Top Slope (Floor Ramps ◢ / ◣) and Bottom Slope (Ceilings ◥ / ◤)',
      'Converted slope rendering to pure horizontal mirroring (flipH) without rotation, keeping slope trims upright',
      'Added dedicated Inner Corner for Slopes in addition to standard Inner Corner for solid Blocks',
      'Preserved overlay Z-order hierarchy (Right Side -> Left Side -> Inner Corners -> Slopes -> Bottom -> Top)',
      'Updated Biome Studio Overlay panel with clear helper sublabels and thumbnail controls for top/bottom slopes and inner corners'
    ]
  },
  {
    version: 'v0.37',
    date: '2026-08-16',
    changes: [
      'Implemented 16px-grid spritesheet multi-frame overlays with deterministic spatial random frame picking',
      'Configured custom overlay Z-order hierarchy (Right -> Left -> Inner Corner -> Slope -> Bottom -> Top)',
      'Added automatic rotation transforms (-90°, 90°, 180°) for slope trims from a single 45° Up-Right source image',
      'Removed all vector/color fallback artifacts when overlay images are not provided',
      'Streamlined project dashboard header badge to cleanly display version tag without redundant name prefix',
      'Updated standalone PWA title and manifest metadata to strictly display "Mason"'
    ]
  },
  {
    version: 'v0.36',
    date: '2026-08-16',
    changes: [
      'Regenerated 100% compliant, pristine PNG icons (192x192, 512x512, 512x512 maskable) fixing corrupted IHDR bytes',
      'Updated web manifest with PWA id, display_override, prefer_related_applications, and wide desktop screenshot',
      'Updated index.html with explicit 192px/512px PNG and SVG favicon & apple-touch-icon links',
      'Updated Service Worker cache (v0.36) to precache all high-res PWA PNG icons and screenshots for offline installability'
    ]
  },
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
