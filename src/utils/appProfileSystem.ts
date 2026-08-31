export interface MasonAppConfig {
  theme: string;
  gridSize: number; // 8, 16, 32, 64
  gridColor: string;
  autoBackupEnabled: boolean;
  autoBackupIntervalMinutes: number; // default 10
  autoSaveOnExport: boolean;
  defaultCloudProvider: 'gdrive' | 'onedrive' | 'virtual';
  audioEnabled: boolean;
  showGridCoordinates: boolean;
  locationBookmarksSync: boolean;
  notes?: string;
  gridSnap?: boolean; // legacy optional for back-compat
  uiDensity?: 'comfortable' | 'compact'; // legacy optional for back-compat
}

export interface MasonUserProfile {
  id: string;
  name: string;
  avatar: string; // Emoji avatar e.g. 🧙‍♂️, 🎨, 🚀, 🛠️, 🎮, 🏰, 🗺️
  color: string;  // Badge color name e.g. 'amber', 'emerald', 'sky', 'rose', 'purple', 'cyan'
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  config: MasonAppConfig;
}

export const DEFAULT_APP_CONFIG: MasonAppConfig = {
  theme: 'indigo_citadel',
  gridSize: 32,
  gridColor: '#38bdf8',
  autoBackupEnabled: true,
  autoBackupIntervalMinutes: 10,
  autoSaveOnExport: true,
  defaultCloudProvider: 'gdrive',
  audioEnabled: true,
  showGridCoordinates: true,
  locationBookmarksSync: true,
  notes: 'Default Mason App Configuration'
};

const PROFILES_STORAGE_KEY = 'mason_global_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'mason_active_profile_id_v1';
const GLOBAL_CONFIG_CACHE_KEY = 'mason_app_config_cache_v1';

export const EVENT_PROFILE_CHANGED = 'mason_profile_changed';

const createDefaultProfile = (): MasonUserProfile => {
  return {
    id: 'profile_default',
    name: 'Default Architect',
    avatar: '🧙‍♂️',
    color: 'amber',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: { ...DEFAULT_APP_CONFIG }
  };
};

/**
 * Retrieve all saved user profiles from localStorage
 */
export const getAllProfiles = (): MasonUserProfile[] => {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      const def = createDefaultProfile();
      saveProfiles([def]);
      setActiveProfileId(def.id);
      syncGlobalConfigCache(def.config);
      return [def];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const def = createDefaultProfile();
    saveProfiles([def]);
    setActiveProfileId(def.id);
    syncGlobalConfigCache(def.config);
    return [def];
  } catch (err) {
    console.warn('Failed to load Mason user profiles:', err);
    const def = createDefaultProfile();
    return [def];
  }
};

/**
 * Save array of profiles to localStorage and broadcast change event
 */
export const saveProfiles = (profiles: MasonUserProfile[]): void => {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent(EVENT_PROFILE_CHANGED));
  } catch (err) {
    console.warn('Failed to save Mason user profiles:', err);
  }
};

/**
 * Get active profile ID
 */
export const getActiveProfileId = (): string => {
  try {
    const id = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    if (id) return id;
    const profiles = getAllProfiles();
    return profiles[0]?.id || 'profile_default';
  } catch {
    return 'profile_default';
  }
};

/**
 * Set active profile ID
 */
export const setActiveProfileId = (id: string): void => {
  try {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
  } catch (err) {
    console.warn('Failed to set active profile ID:', err);
  }
};

/**
 * Sync raw global config cache object for instant cross-app / cold start loading
 */
export const syncGlobalConfigCache = (config: MasonAppConfig): void => {
  try {
    localStorage.setItem(GLOBAL_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to sync global config cache:', err);
  }
};

/**
 * Get raw cached active config object
 */
export const getGlobalConfigCache = (): MasonAppConfig => {
  try {
    const raw = localStorage.getItem(GLOBAL_CONFIG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_APP_CONFIG, ...parsed };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_APP_CONFIG };
};

/**
 * Get currently active Mason user profile
 */
export const getActiveProfile = (): MasonUserProfile => {
  const profiles = getAllProfiles();
  const activeId = getActiveProfileId();
  const found = profiles.find((p) => p.id === activeId);
  if (found) {
    return found;
  }
  return profiles[0] || createDefaultProfile();
};

/**
 * Switch active user profile
 */
export const setActiveProfile = (profileId: string): MasonUserProfile => {
  const profiles = getAllProfiles();
  const target = profiles.find((p) => p.id === profileId);
  if (!target) return getActiveProfile();

  setActiveProfileId(target.id);
  syncGlobalConfigCache(target.config);
  window.dispatchEvent(new CustomEvent(EVENT_PROFILE_CHANGED));
  return target;
};

/**
 * Create a new User Profile with custom name, avatar, color, and optional config preset
 */
export const createProfile = (
  name: string,
  avatar: string = '🎨',
  color: string = 'sky',
  initialConfig?: Partial<MasonAppConfig>
): MasonUserProfile => {
  const profiles = getAllProfiles();
  const newProfile: MasonUserProfile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || 'New Designer Profile',
    avatar: avatar || '🎨',
    color: color || 'sky',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      ...DEFAULT_APP_CONFIG,
      ...(initialConfig || {})
    }
  };

  const updatedProfiles = [...profiles, newProfile];
  saveProfiles(updatedProfiles);
  setActiveProfile(newProfile.id);
  return newProfile;
};

/**
 * Update current active profile's configuration
 */
export const updateActiveProfileConfig = (
  partialConfig: Partial<MasonAppConfig>
): MasonUserProfile => {
  const profiles = getAllProfiles();
  const activeId = getActiveProfileId();

  const updatedProfiles = profiles.map((p) => {
    if (p.id === activeId) {
      const newConfig = { ...p.config, ...partialConfig };
      return {
        ...p,
        updatedAt: Date.now(),
        config: newConfig
      };
    }
    return p;
  });

  saveProfiles(updatedProfiles);
  const active = updatedProfiles.find((p) => p.id === activeId) || updatedProfiles[0];
  if (active) {
    syncGlobalConfigCache(active.config);
  }
  return active;
};

/**
 * Update a specific profile's info (name, avatar, color)
 */
export const updateProfileInfo = (
  profileId: string,
  info: { name?: string; avatar?: string; color?: string; config?: Partial<MasonAppConfig> }
): MasonUserProfile[] => {
  const profiles = getAllProfiles();
  const updatedProfiles = profiles.map((p) => {
    if (p.id === profileId) {
      return {
        ...p,
        name: info.name !== undefined ? info.name.trim() || p.name : p.name,
        avatar: info.avatar !== undefined ? info.avatar : p.avatar,
        color: info.color !== undefined ? info.color : p.color,
        updatedAt: Date.now(),
        config: info.config ? { ...p.config, ...info.config } : p.config
      };
    }
    return p;
  });

  saveProfiles(updatedProfiles);
  const activeId = getActiveProfileId();
  if (activeId === profileId) {
    const active = updatedProfiles.find((p) => p.id === activeId);
    if (active) syncGlobalConfigCache(active.config);
  }
  return updatedProfiles;
};

/**
 * Delete a profile (cannot delete if it's the last remaining profile)
 */
export const deleteProfile = (profileId: string): { success: boolean; profiles: MasonUserProfile[] } => {
  const profiles = getAllProfiles();
  if (profiles.length <= 1) {
    return { success: false, profiles };
  }

  const updatedProfiles = profiles.filter((p) => p.id !== profileId);
  saveProfiles(updatedProfiles);

  const activeId = getActiveProfileId();
  if (activeId === profileId) {
    setActiveProfile(updatedProfiles[0].id);
  } else {
    window.dispatchEvent(new CustomEvent(EVENT_PROFILE_CHANGED));
  }

  return { success: true, profiles: updatedProfiles };
};

/**
 * Export Profile JSON string for importing into any Mason app instance
 */
export const exportProfilesJSON = (profileId?: string): string => {
  const profiles = getAllProfiles();
  const activeId = getActiveProfileId();

  let exportData: any;
  if (profileId) {
    const single = profiles.find((p) => p.id === profileId);
    exportData = {
      format: 'mason_app_config_export_v1',
      exportedAt: new Date().toISOString(),
      activeProfileId: profileId,
      profiles: single ? [single] : profiles
    };
  } else {
    exportData = {
      format: 'mason_app_config_export_v1',
      exportedAt: new Date().toISOString(),
      activeProfileId: activeId,
      profiles
    };
  }

  return JSON.stringify(exportData, null, 2);
};

/**
 * Import Profile JSON file content into current app
 */
export const importProfilesJSON = (
  jsonStr: string
): { success: boolean; count: number; error?: string } => {
  try {
    const parsed = JSON.parse(jsonStr);
    let importedProfiles: MasonUserProfile[] = [];

    if (parsed.format === 'mason_app_config_export_v1' && Array.isArray(parsed.profiles)) {
      importedProfiles = parsed.profiles;
    } else if (Array.isArray(parsed)) {
      importedProfiles = parsed;
    } else if (parsed.name && parsed.config) {
      importedProfiles = [parsed];
    } else {
      return { success: false, count: 0, error: 'Invalid profile configuration file format.' };
    }

    const currentProfiles = getAllProfiles();
    let addedCount = 0;

    const merged = [...currentProfiles];

    for (const imp of importedProfiles) {
      if (!imp.name || !imp.config) continue;
      const newProf: MasonUserProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: `${imp.name} (Imported)`,
        avatar: imp.avatar || '🎨',
        color: imp.color || 'sky',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: { ...DEFAULT_APP_CONFIG, ...imp.config }
      };
      merged.push(newProf);
      addedCount++;
    }

    if (addedCount > 0) {
      saveProfiles(merged);
      const newlyAdded = merged[merged.length - 1];
      setActiveProfile(newlyAdded.id);
      return { success: true, count: addedCount };
    }

    return { success: false, count: 0, error: 'No valid profile data found in file.' };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Failed to parse JSON file.' };
  }
};
