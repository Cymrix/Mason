import { 
  MasonProject, 
  FileCheckoutInfo 
} from '../engine/masonProjectSchema';
import { getActiveProfile } from './appProfileSystem';
import { addToastLog } from './toastLogStore';

const SESSION_STORAGE_KEY = 'mason_active_editor_session_id';

let inMemorySessionId: string | null = null;

/**
 * Retrieves or establishes a tab-unique session ID.
 * This guarantees multi-tab / multi-user checkout isolation.
 */
export const getCurrentSessionId = (): string => {
  if (inMemorySessionId) return inMemorySessionId;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        stored = `sess_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, stored);
      }
      inMemorySessionId = stored;
      return stored;
    }
  } catch (err) {
    // Fallback for sandboxed iframes without sessionStorage access
  }
  inMemorySessionId = `sess_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
  return inMemorySessionId;
};

/**
 * Gets a human-readable short session ID (e.g. "8A3F")
 */
export const getShortSessionId = (sessionId?: string): string => {
  const sid = sessionId || getCurrentSessionId();
  const parts = sid.replace('sess_', '').split('_');
  return (parts[0] || sid).substring(0, 6).toUpperCase();
};

/**
 * Checks if a file checkout was performed by the current browser tab session
 */
export const isCurrentSessionCheckout = (checkout?: FileCheckoutInfo | null): boolean => {
  if (!checkout || !checkout.isCheckedOut) return false;
  return checkout.sessionId === getCurrentSessionId();
};

/**
 * Checks if a file is checked out by someone else / another session
 */
export const isOtherSessionCheckout = (checkout?: FileCheckoutInfo | null): boolean => {
  if (!checkout || !checkout.isCheckedOut) return false;
  return checkout.sessionId !== getCurrentSessionId();
};

/**
 * Helper to normalize subfolder names to project.fileSystem keys
 */
export const normalizeSubfolderKey = (subfolderName: string): keyof MasonProject['fileSystem'] => {
  const clean = subfolderName.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (clean === 'maps' || clean === 'map') return 'maps';
  if (clean === 'biomes' || clean === 'biome') return 'biomes';
  if (clean === 'prefabs' || clean === 'prefab') return 'prefabs';
  if (clean === 'particles' || clean === 'particle') return 'particles';
  if (clean === 'sprites' || clean === 'sprite') return 'sprites';
  if (clean === 'images' || clean === 'image') return 'images';
  if (clean === 'ui' || clean === 'themes') return 'ui';
  if (clean === 'game' || clean === 'gamestructure' || clean === 'structure') return 'game';
  if (clean === 'behaviors' || clean === 'behavior') return 'behaviors';
  return clean as any;
};

/**
 * Retrieves the checkout metadata for a specific file in the project
 */
export const getFileCheckout = (
  project: MasonProject,
  subfolder: string,
  fileName: string
): FileCheckoutInfo | null => {
  if (!project || !project.fileSystem) return null;
  const key = normalizeSubfolderKey(subfolder);
  const fileArray = project.fileSystem[key] as any[];
  if (!Array.isArray(fileArray)) return null;

  const found = fileArray.find(f => f.fileName === fileName || f.id === fileName);
  return found?.checkout || null;
};

/**
 * Marks a file as checked out by the active user and session
 */
export const performFileCheckout = (
  project: MasonProject,
  subfolder: string,
  fileName: string,
  note?: string
): { project: MasonProject; checkout: FileCheckoutInfo } => {
  const activeProfile = getActiveProfile();
  const sessionId = getCurrentSessionId();
  const now = new Date().toISOString();

  const checkoutInfo: FileCheckoutInfo = {
    isCheckedOut: true,
    checkedOutBy: activeProfile.name || 'Studio Developer',
    userId: activeProfile.id,
    userAvatar: activeProfile.avatar || '🔑',
    userColor: activeProfile.color || 'amber',
    sessionId,
    checkedOutAt: now,
    lockNote: note?.trim() || undefined
  };

  const key = normalizeSubfolderKey(subfolder);
  const fileArray = (project.fileSystem[key] || []) as any[];

  const updatedFiles = fileArray.map(f => {
    if (f.fileName === fileName || f.id === fileName) {
      return {
        ...f,
        checkout: checkoutInfo,
        updatedAt: now
      };
    }
    return f;
  });

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    fileSystem: {
      ...project.fileSystem,
      [key]: updatedFiles
    }
  };

  const shortSid = getShortSessionId(sessionId);
  addToastLog(`Checked out ${fileName} (${activeProfile.name} • ${shortSid})`, 'info');

  return { project: updatedProject, checkout: checkoutInfo };
};

/**
 * Checks in a file, clearing checkout lock and saving the change
 */
export const performFileCheckIn = (
  project: MasonProject,
  subfolder: string,
  fileName: string,
  options?: { note?: string }
): { project: MasonProject } => {
  const now = new Date().toISOString();
  const key = normalizeSubfolderKey(subfolder);
  const fileArray = (project.fileSystem[key] || []) as any[];

  const updatedFiles = fileArray.map(f => {
    if (f.fileName === fileName || f.id === fileName) {
      const copy = { ...f };
      delete copy.checkout;
      copy.updatedAt = now;
      return copy;
    }
    return f;
  });

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    fileSystem: {
      ...project.fileSystem,
      [key]: updatedFiles
    }
  };

  addToastLog(`Checked in ${fileName}${options?.note ? ` — "${options.note}"` : ''}`, 'success');

  return { project: updatedProject };
};

/**
 * Force unlocks a file checked out by another user or abandoned session
 */
export const performFileForceUnlock = (
  project: MasonProject,
  subfolder: string,
  fileName: string
): { project: MasonProject } => {
  const now = new Date().toISOString();
  const key = normalizeSubfolderKey(subfolder);
  const fileArray = (project.fileSystem[key] || []) as any[];

  const updatedFiles = fileArray.map(f => {
    if (f.fileName === fileName || f.id === fileName || f.name === fileName) {
      const copy = { ...f };
      delete copy.checkout;
      copy.updatedAt = now;
      return copy;
    }
    return f;
  });

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    fileSystem: {
      ...project.fileSystem,
      [key]: updatedFiles
    }
  };

  addToastLog(`Force unlocked ${fileName}`, 'info');

  return { project: updatedProject };
};

/**
 * Saves content as a new file, automatically checking it out for the current session
 */
export const performFileSaveAs = (
  project: MasonProject,
  subfolder: string,
  originalFileName: string,
  newFileName: string,
  modifiedFileData?: any
): { project: MasonProject; newFileName: string } => {
  const activeProfile = getActiveProfile();
  const sessionId = getCurrentSessionId();
  const now = new Date().toISOString();
  const key = normalizeSubfolderKey(subfolder);
  const fileArray = (project.fileSystem[key] || []) as any[];

  // Clean extension handling
  const ext = subfolder === 'maps' ? '.map'
    : subfolder === 'biomes' ? '.biome'
    : subfolder === 'prefabs' ? '.prefab'
    : subfolder === 'particles' ? '.particle'
    : subfolder === 'sprites' ? '.sprite'
    : subfolder === 'ui' ? '.ui'
    : subfolder === 'game' ? '.gamestructure'
    : subfolder === 'behaviors' ? '.behavior'
    : '';

  const cleanFileName = (ext && !newFileName.endsWith(ext)) ? `${newFileName}${ext}` : newFileName;
  const displayName = cleanFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  const checkoutInfo: FileCheckoutInfo = {
    isCheckedOut: true,
    checkedOutBy: activeProfile.name || 'Studio Developer',
    userId: activeProfile.id,
    userAvatar: activeProfile.avatar || '🔑',
    userColor: activeProfile.color || 'amber',
    sessionId,
    checkedOutAt: now,
    lockNote: 'Created via Save As'
  };

  const originalFile = fileArray.find(f => f.fileName === originalFileName || f.id === originalFileName) || fileArray[0];

  const newFile = {
    ...(modifiedFileData || originalFile || {}),
    id: `${key}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: displayName,
    fileName: cleanFileName,
    createdAt: now,
    updatedAt: now,
    checkout: checkoutInfo
  };

  // Set active file key if applicable
  const activeKeyMap: Record<string, string> = {
    maps: 'mapFileName',
    biomes: 'biomeFileName',
    prefabs: 'prefabFileName',
    particles: 'particleFileName',
    sprites: 'spriteFileName',
    ui: 'uiFileName',
    game: 'gameStructureFileName',
    behaviors: 'behaviorFileName'
  };
  const activeKey = activeKeyMap[key];

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    activeFiles: activeKey ? { ...project.activeFiles, [activeKey]: cleanFileName } : project.activeFiles,
    fileSystem: {
      ...project.fileSystem,
      [key]: [...fileArray, newFile]
    }
  };

  addToastLog(`Saved as ${cleanFileName} (Checked out by you)`, 'success');

  return { project: updatedProject, newFileName: cleanFileName };
};

export interface CheckedOutFileInfo {
  file: any;
  subfolder: string;
  subfolderKey: keyof MasonProject['fileSystem'];
  fileName: string;
  name: string;
  checkout: FileCheckoutInfo;
  isCurrentSession: boolean;
  isOtherSession: boolean;
}

/**
 * Returns a list of all currently checked out / locked files across the entire project
 */
export const getAllCheckedOutFiles = (project: MasonProject): CheckedOutFileInfo[] => {
  if (!project || !project.fileSystem) return [];
  const results: CheckedOutFileInfo[] = [];
  const currentSessionId = getCurrentSessionId();

  const subfolders: Array<{ key: keyof MasonProject['fileSystem']; label: string }> = [
    { key: 'maps', label: 'Maps' },
    { key: 'biomes', label: 'Biomes' },
    { key: 'prefabs', label: 'Prefabs' },
    { key: 'particles', label: 'Particles' },
    { key: 'sprites', label: 'Sprites' },
    { key: 'images', label: 'Images' },
    { key: 'ui', label: 'UI Themes' },
    { key: 'game', label: 'Game Structure' },
    { key: 'behaviors', label: 'Behaviors' }
  ];

  for (const { key, label } of subfolders) {
    const list = (project.fileSystem[key] || []) as any[];
    for (const f of list) {
      if (f.checkout && f.checkout.isCheckedOut) {
        const isCurrentSession = f.checkout.sessionId === currentSessionId;
        results.push({
          file: f,
          subfolder: label,
          subfolderKey: key,
          fileName: f.fileName || f.id || 'unnamed',
          name: f.name || f.fileName || 'Unnamed File',
          checkout: f.checkout,
          isCurrentSession,
          isOtherSession: !isCurrentSession
        });
      }
    }
  }

  return results;
};

/**
 * Checks in all files (or only files locked by current session)
 */
export const performCheckInAllFiles = (
  project: MasonProject,
  options?: { onlyCurrentSession?: boolean; note?: string }
): { project: MasonProject; count: number } => {
  const now = new Date().toISOString();
  const currentSessionId = getCurrentSessionId();
  const onlyCurrent = options?.onlyCurrentSession ?? true;
  let count = 0;

  const nextFileSystem = { ...project.fileSystem } as Record<string, any[]>;
  const keys: Array<keyof MasonProject['fileSystem']> = [
    'maps', 'biomes', 'prefabs', 'particles', 'sprites', 'images', 'ui', 'game', 'behaviors'
  ];

  for (const key of keys) {
    const arr = (nextFileSystem[key] || []) as any[];
    if (Array.isArray(arr) && arr.length > 0) {
      nextFileSystem[key] = arr.map(f => {
        if (f.checkout && f.checkout.isCheckedOut) {
          if (!onlyCurrent || f.checkout.sessionId === currentSessionId) {
            count++;
            const copy = { ...f };
            delete copy.checkout;
            copy.updatedAt = now;
            return copy;
          }
        }
        return f;
      });
    }
  }

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    fileSystem: nextFileSystem as any
  };

  if (count > 0) {
    addToastLog(`Checked in ${count} file${count === 1 ? '' : 's'}${options?.note ? ` — "${options.note}"` : ''}`, 'success');
  }

  return { project: updatedProject, count };
};

/**
 * Force unlocks all locked files in the project
 */
export const performForceUnlockAllFiles = (
  project: MasonProject
): { project: MasonProject; count: number } => {
  const now = new Date().toISOString();
  let count = 0;

  const nextFileSystem = { ...project.fileSystem } as Record<string, any[]>;
  const keys: Array<keyof MasonProject['fileSystem']> = [
    'maps', 'biomes', 'prefabs', 'particles', 'sprites', 'images', 'ui', 'game', 'behaviors'
  ];

  for (const key of keys) {
    const arr = (nextFileSystem[key] || []) as any[];
    if (Array.isArray(arr) && arr.length > 0) {
      nextFileSystem[key] = arr.map(f => {
        if (f.checkout && f.checkout.isCheckedOut) {
          count++;
          const copy = { ...f };
          delete copy.checkout;
          copy.updatedAt = now;
          return copy;
        }
        return f;
      });
    }
  }

  const updatedProject: MasonProject = {
    ...project,
    updatedAt: now,
    fileSystem: nextFileSystem as any
  };

  if (count > 0) {
    addToastLog(`Force unlocked all ${count} locked file${count === 1 ? '' : 's'}`, 'info');
  }

  return { project: updatedProject, count };
};

