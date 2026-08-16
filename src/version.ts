/**
 * Mason Studio Core Version Configuration
 * Current Stage: Alpha
 * Current Release: v0.24
 */
export const MASON_VERSION = '0.24.0';
export const MASON_VERSION_DISPLAY = 'v0.24';
export const MASON_STAGE = 'Alpha';
export const MASON_FULL_VERSION = `v0.24 (Alpha)`;

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
