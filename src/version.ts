/**
 * Mason Core Version Configuration
 * Current Release: v0.31
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.30 -> v0.31 -> v0.32).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.31.0';
export const MASON_VERSION_DISPLAY = 'v0.31';
export const MASON_FULL_VERSION = 'v0.31';

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
