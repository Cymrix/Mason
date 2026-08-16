/**
 * Mason Core Version Configuration
 * Current Release: v0.26
 * 
 * HARD RULE:
 * - Every iteration / prompt change MUST bump the Mason release version (e.g., v0.25 -> v0.26 -> v0.27).
 * - All components, manifests, cache service workers, and UI badges must consume or sync with these constants.
 */
export const MASON_VERSION = '0.26.0';
export const MASON_VERSION_DISPLAY = 'v0.26';
export const MASON_FULL_VERSION = 'v0.26';

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
    version: 'v0.26',
    date: '2026-08-16',
    changes: [
      'Standardized project bundle extension strictly to .mason',
      'Cleaned versioning display to v0.26 without alpha suffix',
      'Unified app title to strictly "Mason" across document, PWA manifest, and install prompts'
    ]
  },
  {
    version: 'v0.25',
    date: '2026-08-16',
    changes: [
      'Enforced mandatory version increment protocol across all releases',
      'Refined PWA prompt modal, standalone app installer, and direct browser guides',
      'Added high-resolution vector and PNG app icons for desktop and mobile home screens'
    ]
  },
  {
    version: 'v0.24',
    date: '2026-08-15',
    changes: [
      'PWA Service Worker integration and offline caching for all mini-apps',
      'Web App Manifest with mobile display standalone mode'
    ]
  }
];
