/**
 * Mason Core Version Configuration
 * Current Release: v0.28
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.27 -> v0.28 -> v0.29).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.28.0';
export const MASON_VERSION_DISPLAY = 'v0.28';
export const MASON_FULL_VERSION = 'v0.28';

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
    version: 'v0.28',
    date: '2026-08-16',
    changes: [
      'Added primary Biome creation (+ New Biome) and deletion capabilities in Biome Studio',
      'Aligned 64x64 tile overlays to render 1:1 directly over base tiles in autotile preview and level maps',
      'Enforced crisp nearest-neighbor pixel art scaling globally across all canvas renders and image elements'
    ]
  },
  {
    version: 'v0.27',
    date: '2026-08-16',
    changes: [
      'Wired full native React interactive modules for Biomes, Game Structure, and Procedural Macro',
      'Eliminated external script CDN network calls causing 404 GitHub Pages errors',
      'Integrated live 1px:1tile procedural layout synthesis for level maps'
    ]
  },
  {
    version: 'v0.26',
    date: '2026-08-16',
    changes: [
      'Standardized project bundle extension strictly to .mason',
      'Cleaned versioning display to v0.26 without alpha suffix',
      'Unified app title to strictly "Mason" across document, PWA manifest, and install prompts'
    ]
  }
];
