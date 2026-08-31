const MODULE_TAB_STORAGE_KEY = 'mason_module_active_tabs_v1';

/**
 * Retrieve saved active tab key for a specific module ID.
 * Returns defaultTab if no saved tab exists or on error.
 */
export function getSavedModuleTab<T extends string>(moduleId: string, defaultTab: T): T {
  try {
    const raw = localStorage.getItem(MODULE_TAB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[moduleId]) {
        return parsed[moduleId] as T;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved module tab:', e);
  }
  return defaultTab;
}

/**
 * Save active tab key for a specific module ID to localStorage.
 */
export function saveModuleTab(moduleId: string, tab: string): void {
  try {
    const raw = localStorage.getItem(MODULE_TAB_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[moduleId] = tab;
    localStorage.setItem(MODULE_TAB_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn('Failed to save module tab:', e);
  }
}
