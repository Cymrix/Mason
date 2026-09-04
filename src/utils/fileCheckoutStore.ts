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
  if (clean === 'game' || clean === 'gamestructure') return 'game';
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

  addToastLog(`Force unlocked ${fileName}`, 'info');

  return { project: updatedProject };
};
