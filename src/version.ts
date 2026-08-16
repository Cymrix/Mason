/**
 * Mason Core Version Configuration
 * Current Release: v0.30
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.29 -> v0.30 -> v0.31).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.30.0';
export const MASON_VERSION_DISPLAY = 'v0.30';
export const MASON_FULL_VERSION = 'v0.30';

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
  },
  {
    version: 'v0.28',
    date: '2026-08-16',
    changes: [
      'Added primary Biome creation (+ New Biome) and deletion capabilities in Biome Studio',
      'Aligned 64x64 tile overlays to render 1:1 directly over base tiles in autotile preview and level maps',
      'Enforced crisp nearest-neighbor pixel art scaling globally across all canvas renders and image elements'
    ]
  }
];
