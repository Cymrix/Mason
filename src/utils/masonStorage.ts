import { 
  MasonProject, 
  MapFile, 
  BiomeFile, 
  UIThemeFile, 
  GameStructureFile,
  ParticleSystemFile,
  SpriteFile,
  ImageFile,
  ParticleSystemData,
  ProjectBackupRecord,
  FileBackupRecord,
  MasonModuleId,
  createInitialMasonProject,
  createDefaultMapFile,
  DEFAULT_UI_THEMES,
  DEFAULT_PARTICLE_SYSTEMS,
  createDefaultGameStructure,
  createDefaultTaskBoard
} from '../engine/masonProjectSchema';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { MASON_VERSION_DISPLAY } from '../version';

export type { ProjectBackupRecord, FileBackupRecord };

const MASON_PROJECT_STORAGE_KEY = 'mason_active_project_data';
const MASON_PROJECT_LIST_INDEX = 'mason_projects_index';
const MASON_ACTIVE_ID_KEY = 'mason_active_project_id';

export interface ProjectIndexItem {
  id: string;
  name: string;
  description?: string;
  author?: string;
  updatedAt: string;
  engineVersion: string;
  mapCount: number;
  biomeCount: number;
}

// In-memory runtime cache for zero-latency synchronous access
let inMemoryActiveProject: MasonProject | null = null;
const inMemoryProjectsCache: Map<string, MasonProject> = new Map();

// ==================================================
// INDEXED_DB PERSISTENCE (Quota-free high-capacity storage)
// ==================================================
const DB_NAME = 'mason_metroidvania_studio_idb';
const DB_VERSION = 3;
const STORE_PROJECTS = 'projects';
const STORE_META = 'meta';
const STORE_BACKUPS = 'backups';
const STORE_FILE_BACKUPS = 'file_backups';

let idbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
          const bStore = db.createObjectStore(STORE_BACKUPS, { keyPath: 'id' });
          bStore.createIndex('projectId', 'projectId', { unique: false });
          bStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
          const fbStore = db.createObjectStore(STORE_FILE_BACKUPS, { keyPath: 'id' });
          fbStore.createIndex('projectId', 'projectId', { unique: false });
          fbStore.createIndex('fileName', 'fileName', { unique: false });
          fbStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Could not open IndexedDB, using fallback storage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return idbPromise;
}

// In-memory runtime cache for backups fallback
const inMemoryBackupsCache: Map<string, ProjectBackupRecord[]> = new Map();
const inMemoryFileBackupsCache: Map<string, FileBackupRecord[]> = new Map();

export async function savePerFileBackupsForProject(
  project: MasonProject,
  actionLabel?: string
): Promise<FileBackupRecord[]> {
  if (!project || !project.id || !project.fileSystem) return [];
  const newRecords: FileBackupRecord[] = [];
  const projectId = project.id;

  const fileCategories: Array<{
    key: 'maps' | 'biomes' | 'prefabs' | 'ui' | 'game' | 'behaviors' | 'particles' | 'sprites' | 'images';
    list: any[];
  }> = [
    { key: 'maps', list: project.fileSystem.maps || [] },
    { key: 'biomes', list: project.fileSystem.biomes || [] },
    { key: 'prefabs', list: project.fileSystem.prefabs || [] },
    { key: 'ui', list: project.fileSystem.ui || [] },
    { key: 'game', list: project.fileSystem.game || [] },
    { key: 'behaviors', list: project.fileSystem.behaviors || [] },
    { key: 'particles', list: project.fileSystem.particles || [] },
    { key: 'sprites', list: project.fileSystem.sprites || [] },
    { key: 'images', list: project.fileSystem.images || [] }
  ];

  try {
    const db = await getIDB();
    for (const cat of fileCategories) {
      for (const file of cat.list) {
        if (!file || !file.fileName) continue;
        const cacheKey = `${projectId}:${file.fileName}`;
        let existingList = inMemoryFileBackupsCache.get(cacheKey);

        if (!existingList && db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
          existingList = await new Promise<FileBackupRecord[]>((resolve) => {
            const tx = db.transaction(STORE_FILE_BACKUPS, 'readonly');
            const req = tx.objectStore(STORE_FILE_BACKUPS).getAll();
            req.onsuccess = () => {
              const all: FileBackupRecord[] = req.result || [];
              const matching = all.filter(r => r.projectId === projectId && r.fileName === file.fileName);
              matching.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              resolve(matching);
            };
            req.onerror = () => resolve([]);
          });
          inMemoryFileBackupsCache.set(cacheKey, existingList);
        }
        if (!existingList) existingList = [];

        const stripTimestamp = (obj: any) => {
          if (!obj) return null;
          const clone = JSON.parse(JSON.stringify(obj));
          delete clone.updatedAt;
          return JSON.stringify(clone);
        };

        const currentNormalized = stripTimestamp(file);

        // Check if current state matches any existing backup point
        const matchingIndex = existingList.findIndex(bk => stripTimestamp(bk.fileSnapshot) === currentNormalized);

        if (matchingIndex !== -1) {
          // Content matches an existing restore point — DO NOT create a new restore point!
          let changed = false;
          existingList.forEach((bk, idx) => {
            const shouldBeCurrent = (idx === matchingIndex);
            if (bk.isCurrent !== shouldBeCurrent) {
              bk.isCurrent = shouldBeCurrent;
              changed = true;
              if (db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
                const tx = db.transaction(STORE_FILE_BACKUPS, 'readwrite');
                tx.objectStore(STORE_FILE_BACKUPS).put(bk);
              }
            }
          });
          if (changed) {
            inMemoryFileBackupsCache.set(cacheKey, [...existingList]);
          }
        } else {
          // Content is newly edited — unmark previous points and create a new restore point
          existingList.forEach(bk => {
            if (bk.isCurrent) {
              bk.isCurrent = false;
              if (db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
                const tx = db.transaction(STORE_FILE_BACKUPS, 'readwrite');
                tx.objectStore(STORE_FILE_BACKUPS).put(bk);
              }
            }
          });

          const record: FileBackupRecord = {
            id: `fbk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            projectId,
            fileCategory: cat.key,
            fileName: file.fileName,
            timestamp: file.updatedAt || new Date().toISOString(),
            actionLabel: actionLabel || `Updated ${file.name || file.fileName}`,
            fileSnapshot: JSON.parse(JSON.stringify(file)),
            fileSizeEstimate: JSON.stringify(file).length,
            isCurrent: true
          };

          const fullList = [record, ...existingList];
          const updatedList = fullList.slice(0, 10);
          const evictedList = fullList.slice(10);

          inMemoryFileBackupsCache.set(cacheKey, updatedList);
          newRecords.push(record);

          if (db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
            const tx = db.transaction(STORE_FILE_BACKUPS, 'readwrite');
            const store = tx.objectStore(STORE_FILE_BACKUPS);
            store.put(record);
            evictedList.forEach(ev => store.delete(ev.id));
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error saving per-file backups:', err);
  }

  return newRecords;
}

export async function getFileBackups(projectId: string, fileName: string): Promise<FileBackupRecord[]> {
  try {
    const cacheKey = `${projectId}:${fileName}`;
    const memory = inMemoryFileBackupsCache.get(cacheKey);
    if (memory && memory.length > 0) return memory.slice(0, 10);

    const db = await getIDB();
    if (!db || !db.objectStoreNames.contains(STORE_FILE_BACKUPS)) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILE_BACKUPS, 'readwrite');
      const store = tx.objectStore(STORE_FILE_BACKUPS);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: FileBackupRecord[] = req.result || [];
        const matching = all.filter(r => r.projectId === projectId && r.fileName === fileName);
        matching.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const kept = matching.slice(0, 10);
        const evicted = matching.slice(10);
        evicted.forEach(ev => store.delete(ev.id));

        inMemoryFileBackupsCache.set(cacheKey, kept);
        resolve(kept);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function restoreFileVersion(
  project: MasonProject,
  fileBackupId: string
): Promise<{ updatedProject: MasonProject; restoredFileName: string; restoredCategory: string } | null> {
  try {
    const db = await getIDB();
    let record: FileBackupRecord | null = null;

    if (db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
      record = await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILE_BACKUPS, 'readonly');
        const req = tx.objectStore(STORE_FILE_BACKUPS).get(fileBackupId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    }

    if (!record) {
      for (const [, records] of inMemoryFileBackupsCache.entries()) {
        const found = records.find(r => r.id === fileBackupId);
        if (found) {
          record = found;
          break;
        }
      }
    }

    if (!record || !record.fileSnapshot) return null;

    const cat = record.fileCategory;
    const restoredFile = JSON.parse(JSON.stringify(record.fileSnapshot));
    restoredFile.updatedAt = new Date().toISOString();

    const currentList: any[] = (project.fileSystem as any)[cat] || [];
    const idx = currentList.findIndex(f => f.fileName === record.fileName);

    let updatedList: any[];
    if (idx !== -1) {
      updatedList = [...currentList];
      updatedList[idx] = restoredFile;
    } else {
      updatedList = [...currentList, restoredFile];
    }

    let updatedFileSystem = {
      ...project.fileSystem,
      [cat]: updatedList
    };

    // BIDIRECTIONAL SYNC FOR RESTORING SPRITES & IMAGES
    if (cat === 'images' && restoredFile.dataUrl) {
      const cleanBase = record.fileName.replace(/\.png$/, '');
      const spriteName = `${cleanBase}.sprite`;
      const currentSprites = project.fileSystem.sprites || [];
      const spriteIdx = currentSprites.findIndex(s => s.fileName === spriteName || s.fileName === restoredFile.sourceSpriteFileName);
      if (spriteIdx !== -1) {
        const updatedSprites = [...currentSprites];
        const s = updatedSprites[spriteIdx];
        updatedSprites[spriteIdx] = {
          ...s,
          updatedAt: new Date().toISOString(),
          dataUrl: restoredFile.dataUrl,
          imageUrl: restoredFile.dataUrl
        };
        updatedFileSystem.sprites = updatedSprites;
      }
    } else if (cat === 'sprites' && (restoredFile.dataUrl || restoredFile.imageUrl)) {
      const restoredDataUrl = restoredFile.dataUrl || restoredFile.imageUrl;
      const cleanBase = record.fileName.replace(/\.sprite$/, '');
      const pngName = `${cleanBase}.png`;
      const currentImages = project.fileSystem.images || [];
      const imgIdx = currentImages.findIndex(i => i.fileName === pngName || record.fileSnapshot.linkedImageFileNames?.includes(i.fileName));
      if (imgIdx !== -1 && restoredDataUrl) {
        const updatedImages = [...currentImages];
        updatedImages[imgIdx] = {
          ...updatedImages[imgIdx],
          updatedAt: new Date().toISOString(),
          dataUrl: restoredDataUrl
        };
        updatedFileSystem.images = updatedImages;
      }
    }

    const updatedProject: MasonProject = {
      ...project,
      fileSystem: updatedFileSystem
    };

    saveActiveMasonProject(
      updatedProject,
      `Restored /${cat}/${record.fileName} to version from ${new Date(record.timestamp).toLocaleTimeString()}`
    );

    return {
      updatedProject,
      restoredFileName: record.fileName,
      restoredCategory: cat
    };
  } catch (err) {
    console.error('Failed to restore file version:', err);
    return null;
  }
}

export async function deleteFileBackup(fileBackupId: string): Promise<void> {
  try {
    const db = await getIDB();
    if (db && db.objectStoreNames.contains(STORE_FILE_BACKUPS)) {
      const tx = db.transaction(STORE_FILE_BACKUPS, 'readwrite');
      tx.objectStore(STORE_FILE_BACKUPS).delete(fileBackupId);
    }
    for (const [key, records] of inMemoryFileBackupsCache.entries()) {
      inMemoryFileBackupsCache.set(key, records.filter(r => r.id !== fileBackupId));
    }
  } catch (err) {
    console.warn('Failed to delete file backup:', err);
  }
}

export async function saveProjectBackup(
  project: MasonProject,
  actionLabel?: string,
  module?: MasonModuleId
): Promise<ProjectBackupRecord | null> {
  if (!project || !project.id) return null;
  try {
    const now = new Date().toISOString();
    const backupId = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const record: ProjectBackupRecord = {
      id: backupId,
      projectId: project.id,
      timestamp: now,
      module: module || project.activeModule || 'general',
      actionLabel: actionLabel || `Saved ${project.name}`,
      fileCountsSummary: {
        maps: project.fileSystem?.maps?.length || 0,
        biomes: project.fileSystem?.biomes?.length || 0,
        prefabs: project.fileSystem?.prefabs?.length || 0,
        sprites: project.fileSystem?.sprites?.length || 0,
        images: project.fileSystem?.images?.length || 0,
        behaviors: project.fileSystem?.behaviors?.length || 0
      },
      projectSnapshot: JSON.parse(JSON.stringify(project))
    };

    // Update memory cache
    const existing = inMemoryBackupsCache.get(project.id) || [];
    const updated = [record, ...existing].slice(0, 50); // Keep last 50 backups
    inMemoryBackupsCache.set(project.id, updated);

    // Save to IndexedDB
    const db = await getIDB();
    if (db && db.objectStoreNames.contains(STORE_BACKUPS)) {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      tx.objectStore(STORE_BACKUPS).put(record);
    }

    return record;
  } catch (err) {
    console.warn('Failed to save project backup:', err);
    return null;
  }
}

export async function getProjectBackups(projectId: string): Promise<ProjectBackupRecord[]> {
  try {
    const memory = inMemoryBackupsCache.get(projectId);
    if (memory && memory.length > 0) return memory;

    const db = await getIDB();
    if (!db || !db.objectStoreNames.contains(STORE_BACKUPS)) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BACKUPS, 'readonly');
      const store = tx.objectStore(STORE_BACKUPS);
      const index = store.index('projectId');
      const req = index.getAll(projectId);

      req.onsuccess = () => {
        const records: ProjectBackupRecord[] = req.result || [];
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        inMemoryBackupsCache.set(projectId, records);
        resolve(records);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function restoreProjectBackup(backupId: string): Promise<MasonProject | null> {
  try {
    const db = await getIDB();
    let targetRecord: ProjectBackupRecord | null = null;

    if (db && db.objectStoreNames.contains(STORE_BACKUPS)) {
      targetRecord = await new Promise((resolve) => {
        const tx = db.transaction(STORE_BACKUPS, 'readonly');
        const req = tx.objectStore(STORE_BACKUPS).get(backupId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    }

    if (!targetRecord) {
      for (const [, records] of inMemoryBackupsCache.entries()) {
        const found = records.find(r => r.id === backupId);
        if (found) {
          targetRecord = found;
          break;
        }
      }
    }

    if (targetRecord && targetRecord.projectSnapshot) {
      const restored = JSON.parse(JSON.stringify(targetRecord.projectSnapshot)) as MasonProject;
      restored.updatedAt = new Date().toISOString();
      saveActiveMasonProject(restored, `Restored version from ${new Date(targetRecord.timestamp).toLocaleTimeString()}`);
      return restored;
    }
  } catch (err) {
    console.error('Failed to restore project backup:', err);
  }
  return null;
}

export async function deleteProjectBackup(backupId: string): Promise<void> {
  try {
    const db = await getIDB();
    if (db && db.objectStoreNames.contains(STORE_BACKUPS)) {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      tx.objectStore(STORE_BACKUPS).delete(backupId);
    }
    for (const [projId, records] of inMemoryBackupsCache.entries()) {
      inMemoryBackupsCache.set(projId, records.filter(r => r.id !== backupId));
    }
  } catch (err) {
    console.warn('Failed to delete backup record:', err);
  }
}

export async function idbSaveProject(project: MasonProject): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction([STORE_PROJECTS, STORE_META], 'readwrite');
    tx.objectStore(STORE_PROJECTS).put(project);
    tx.objectStore(STORE_META).put({ key: 'active_id', value: project.id });
  } catch (err) {
    console.warn('IndexedDB write error:', err);
  }
}

export async function idbGetProject(id: string): Promise<MasonProject | null> {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const req = tx.objectStore(STORE_PROJECTS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbDeleteProject(id: string): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(id);
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

export async function idbSaveHandle(key: string, handle: any): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction([STORE_META], 'readwrite');
    tx.objectStore(STORE_META).put({ key: `fshandle_${key}`, handle });
  } catch (err) {
    console.warn('IndexedDB save handle error:', err);
  }
}

export async function idbGetHandle(key: string): Promise<any> {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get(`fshandle_${key}`);
      req.onsuccess = () => resolve(req.result?.handle || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbDeleteHandle(key: string): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).delete(`fshandle_${key}`);
  } catch (err) {
    console.warn('IndexedDB delete handle error:', err);
  }
}

// Self-clean legacy localStorage keys that previously caused quota crashes
(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('mason_all_saved_projects_store');
    } catch {
      // ignore
    }
  }
})();

// ==================================================
// LOCAL & SESSION STORAGE INTERFACE
// ==================================================

/**
 * Loads the active project, or returns null if no project is currently open
 */
export const getActiveMasonProject = (): MasonProject | null => {
  if (inMemoryActiveProject) return inMemoryActiveProject;

  try {
    const raw = localStorage.getItem(MASON_PROJECT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MasonProject;
      if (parsed && parsed.fileSystem && parsed.id) {
        if (!parsed.fileSystem.particles || parsed.fileSystem.particles.length === 0) {
          parsed.fileSystem.particles = DEFAULT_PARTICLE_SYSTEMS.map(p => ({
            id: p.id,
            name: p.name,
            fileName: `${p.id.replace('particles_', '')}.particle`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            particleData: p
          }));
        }
        if (!parsed.activeFiles.particleFileName) {
          parsed.activeFiles.particleFileName = parsed.fileSystem.particles[0]?.fileName || 'fire_embers.particle';
        }
        if (!parsed.taskBoard) {
          parsed.taskBoard = createDefaultTaskBoard();
        }
        inMemoryActiveProject = parsed;
        inMemoryProjectsCache.set(parsed.id, parsed);
        idbSaveProject(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('LocalStorage read warning:', err);
  }
  return null;
};

/**
 * Loads the active project or creates an initial default project if nothing exists yet
 */
export const loadActiveMasonProject = (): MasonProject => {
  const existing = getActiveMasonProject();
  if (existing) return existing;
  const initial = createInitialMasonProject();
  saveActiveMasonProject(initial);
  return initial;
};

export interface SaveProjectOptions {
  preserveUpdatedAt?: boolean;
  skipBackups?: boolean;
}

/**
 * Saves a project to active storage, memory cache, differential backups, and library index
 */
export const saveActiveMasonProject = (
  project: MasonProject,
  actionLabel?: string,
  module?: MasonModuleId,
  options?: SaveProjectOptions
): void => {
  try {
    const shouldPreserve = options?.preserveUpdatedAt || 
      actionLabel?.toLowerCase().includes('load') || 
      actionLabel?.toLowerCase().includes('restore') || 
      actionLabel?.toLowerCase().includes('cache') ||
      actionLabel?.toLowerCase().includes('selection');

    if (!shouldPreserve) {
      project.updatedAt = new Date().toISOString();
    } else if (!project.updatedAt) {
      project.updatedAt = new Date().toISOString();
    }

    project.engineVersion = MASON_VERSION_DISPLAY;
    
    // 1. Update in-memory cache instantly
    inMemoryActiveProject = project;
    inMemoryProjectsCache.set(project.id, project);

    // 2. Persist asynchronously in IndexedDB
    idbSaveProject(project);

    // 3. Create differential project and file-level backup snapshots asynchronously ONLY if not skipping or loading
    if (!options?.skipBackups && !actionLabel?.toLowerCase().includes('load') && !actionLabel?.toLowerCase().includes('selection')) {
      saveProjectBackup(project, actionLabel, module);
      savePerFileBackupsForProject(project, actionLabel);
    }

    // 3. Update index list in localStorage (lightweight metadata, few kilobytes only)
    try {
      const indexRaw = localStorage.getItem(MASON_PROJECT_LIST_INDEX);
      let index: ProjectIndexItem[] = indexRaw ? JSON.parse(indexRaw) : [];
      index = index.filter(p => p.id !== project.id);
      index.unshift({
        id: project.id,
        name: project.name,
        description: project.description,
        author: project.author,
        updatedAt: project.updatedAt,
        engineVersion: MASON_VERSION_DISPLAY,
        mapCount: project.fileSystem?.maps?.length || 0,
        biomeCount: project.fileSystem?.biomes?.length || 0
      });
      localStorage.setItem(MASON_PROJECT_LIST_INDEX, JSON.stringify(index.slice(0, 50)));
      localStorage.setItem(MASON_ACTIVE_ID_KEY, project.id);
    } catch {
      // index update fallback
    }

    // 4. Try saving to localStorage with safety catch for quota limits
    try {
      localStorage.removeItem('mason_all_saved_projects_store');
      localStorage.setItem(MASON_PROJECT_STORAGE_KEY, JSON.stringify(project));
    } catch (quotaErr) {
      // If local storage is full, keep active project in memory + IndexedDB
      try {
        localStorage.removeItem('mason_all_saved_projects_store');
        localStorage.removeItem(MASON_PROJECT_STORAGE_KEY);
        localStorage.setItem(MASON_ACTIVE_ID_KEY, project.id);
      } catch {
        // Safe silence
      }
    }
  } catch (err) {
    console.error('Failed to save Mason project:', err);
  }
};

/**
 * Closes the active project
 */
export const closeActiveMasonProject = (): void => {
  inMemoryActiveProject = null;
  try {
    localStorage.removeItem(MASON_PROJECT_STORAGE_KEY);
    localStorage.removeItem(MASON_ACTIVE_ID_KEY);
  } catch (err) {
    console.error('Failed to close active Mason project:', err);
  }
};

/**
 * Lists all saved projects in local storage index
 */
export const listSavedProjects = (): ProjectIndexItem[] => {
  try {
    const raw = localStorage.getItem(MASON_PROJECT_LIST_INDEX);
    if (raw) {
      return JSON.parse(raw) as ProjectIndexItem[];
    }
  } catch (err) {
    console.error('Failed to list saved projects:', err);
  }
  return [];
};

/**
 * Loads a specific saved project by ID
 */
export const loadSavedProjectById = (projectId: string): MasonProject | null => {
  // Check memory cache first
  if (inMemoryProjectsCache.has(projectId)) {
    const cached = inMemoryProjectsCache.get(projectId)!;
    saveActiveMasonProject(cached, 'Load Cached Project', undefined, { preserveUpdatedAt: true, skipBackups: true });
    return cached;
  }

  // Check active project
  if (inMemoryActiveProject && inMemoryActiveProject.id === projectId) {
    return inMemoryActiveProject;
  }

  try {
    const raw = localStorage.getItem(MASON_PROJECT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MasonProject;
      if (parsed && parsed.id === projectId) {
        saveActiveMasonProject(parsed, 'Load Local Project', undefined, { preserveUpdatedAt: true, skipBackups: true });
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load project with ID ${projectId}:`, err);
  }

  // Trigger background IndexedDB fetch
  idbGetProject(projectId).then(proj => {
    if (proj) {
      inMemoryProjectsCache.set(projectId, proj);
    }
  });

  return null;
};

/**
 * Deletes a project from the library
 */
export const deleteSavedProject = (projectId: string): void => {
  try {
    inMemoryProjectsCache.delete(projectId);
    idbDeleteProject(projectId);

    const indexRaw = localStorage.getItem(MASON_PROJECT_LIST_INDEX);
    if (indexRaw) {
      const index: ProjectIndexItem[] = JSON.parse(indexRaw);
      localStorage.setItem(MASON_PROJECT_LIST_INDEX, JSON.stringify(index.filter(p => p.id !== projectId)));
    }

    const current = inMemoryActiveProject || getActiveMasonProject();
    if (current && current.id === projectId) {
      closeActiveMasonProject();
    }
  } catch (err) {
    console.error(`Failed to delete project ${projectId}:`, err);
  }
};

/**
 * Creates a brand new project
 */
export const createNewProject = (
  name: string, 
  description: string = '', 
  author: string = 'Mason Architect'
): MasonProject => {
  const initial = createInitialMasonProject(name);
  initial.id = `proj_${Date.now()}`;
  initial.description = description || '2D Metroidvania world authored in Mason Studio.';
  initial.author = author;
  saveActiveMasonProject(initial);
  return initial;
};

// ==================================================
// FILE EXPORT & DOWNLOAD UTILITIES
// ==================================================

export const downloadJsonFile = (filename: string, data: any) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportMapFile = (file: MapFile) => {
  downloadJsonFile(file.fileName.endsWith('.map') ? file.fileName : `${file.fileName}.map`, file);
};

export const exportBiomeFile = (file: BiomeFile) => {
  downloadJsonFile(file.fileName.endsWith('.biome') ? file.fileName : `${file.fileName}.biome`, file);
};

export const exportUIThemeFile = (file: UIThemeFile) => {
  downloadJsonFile(file.fileName.endsWith('.ui') ? file.fileName : `${file.fileName}.ui`, file);
};

export const exportGameStructureFile = (file: GameStructureFile) => {
  downloadJsonFile(file.fileName.endsWith('.gamestructure') ? file.fileName : `${file.fileName}.gamestructure`, file);
};

export const exportParticleFile = (file: ParticleSystemFile) => {
  downloadJsonFile(file.fileName.endsWith('.particle') ? file.fileName : `${file.fileName}.particle`, file);
};

export const getProjectMasonFileName = (projectName?: string): string => {
  if (!projectName || !projectName.trim()) return 'project.mason';
  const clean = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${clean || 'project'}.mason`;
};

export const exportFullProjectBundle = (project: MasonProject) => {
  const safeName = (project.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
  downloadJsonFile(`${safeName}.mason`, project);
};

// ==================================================
// FILE SYSTEM HELPERS
// ==================================================

export const createNewMapInProject = (
  project: MasonProject,
  name: string,
  width: number = 32,
  height: number = 24,
  biomeId: string = 'mourne_ashen_steppes'
): { project: MasonProject; newFile: MapFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.map`;
  const newMap = createDefaultMapFile(`map_${Date.now()}`, name, safeFileName, width, height, biomeId);
  
  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      mapFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      maps: [...project.fileSystem.maps, newMap]
    }
  };
  
  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newMap };
};

export const createNewBiomeInProject = (
  project: MasonProject,
  name: string,
  templateBiome?: RefinedBiome
): { project: MasonProject; newFile: BiomeFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.biome`;
  const baseBiome = templateBiome || project.fileSystem.biomes?.[0]?.biomeData;
  const newBiomeData: RefinedBiome = {
    ...(baseBiome || ({} as RefinedBiome)),
    id: `biome_${Date.now()}`,
    name,
    description: `Custom authored biome: ${name}`
  };

  const newBiomeFile: BiomeFile = {
    id: newBiomeData.id,
    name,
    fileName: safeFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    biomeData: newBiomeData
  };

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      biomeFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      biomes: [...project.fileSystem.biomes, newBiomeFile]
    }
  };

  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newBiomeFile };
};

export const createNewUIThemeInProject = (
  project: MasonProject,
  name: string
): { project: MasonProject; newFile: UIThemeFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ui`;
  const baseUi = DEFAULT_UI_THEMES[0];
  const newUiData = {
    ...baseUi,
    id: `ui_${Date.now()}`,
    name,
    themeName: name
  };

  const newUiFile: UIThemeFile = {
    id: newUiData.id,
    name,
    fileName: safeFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uiConfig: newUiData
  };

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      uiFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      ui: [...project.fileSystem.ui, newUiFile]
    }
  };

  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newUiFile };
};

export const createNewGameStructureInProject = (
  project: MasonProject,
  name: string
): { project: MasonProject; newFile: GameStructureFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gamestructure`;
  const defaultStructure = createDefaultGameStructure();
  defaultStructure.id = `game_${Date.now()}`;
  defaultStructure.name = name;

  const newStructureFile: GameStructureFile = {
    id: defaultStructure.id,
    name,
    fileName: safeFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    structureData: defaultStructure
  };

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      gameStructureFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      game: [...project.fileSystem.game, newStructureFile]
    }
  };

  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newStructureFile };
};

export const createNewParticleInProject = (
  project: MasonProject,
  name: string,
  templateParticle?: ParticleSystemData
): { project: MasonProject; newFile: ParticleSystemFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.particle`;
  const baseData = templateParticle || DEFAULT_PARTICLE_SYSTEMS[0];
  const newParticleData: ParticleSystemData = {
    ...JSON.parse(JSON.stringify(baseData)),
    id: `particles_${Date.now()}`,
    name,
    description: `Custom particle system: ${name}`
  };

  const newParticleFile: ParticleSystemFile = {
    id: newParticleData.id,
    name,
    fileName: safeFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    particleData: newParticleData
  };

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      particleFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      particles: [...(project.fileSystem.particles || []), newParticleFile]
    }
  };

  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newParticleFile };
};

export const convertProjectDataToMasonProject = (projectData: any): MasonProject => {
  const now = new Date().toISOString();
  const projName = projectData.name || 'Imported Level Project';
  const projId = projectData.id || `proj_${Date.now()}`;

  const biomesData = Array.isArray(projectData.biomes) && projectData.biomes.length > 0 
    ? projectData.biomes 
    : [
        {
          id: 'mourne_ashen_steppes',
          name: 'Ashen Steppes',
          description: 'Wind-scoured volcanic basalt plains',
          primaryTileTypeId: 'ashen_basalt',
          tileTypes: [],
          environmentalDetails: [],
          wildlife: [],
          parallaxLayers: []
        }
      ];

  const mapData = projectData.map || { width: 24, height: 24, cells: [] };

  const mapFile: MapFile = {
    id: `map_${projId}_main`,
    name: projName,
    fileName: 'world_main.map',
    description: 'Imported Metroidvania Level Map',
    defaultBiomeId: biomesData[0]?.id || 'mourne_ashen_steppes',
    playerSpawns: [],
    exits: [],
    width: mapData.width || 24,
    height: mapData.height || 24,
    createdAt: projectData.createdAt || now,
    updatedAt: projectData.updatedAt || projectData.createdAt || now,
    chunks: mapData.chunks || {},
    cells: mapData.cells || [],
    data: mapData
  };

  const biomeFiles: BiomeFile[] = biomesData.map((b: any, idx: number) => ({
    id: b.id || `biome_${idx}`,
    name: b.name || `Biome ${idx + 1}`,
    fileName: `${(b.name || 'biome').toLowerCase().replace(/[^a-z0-9]/g, '_')}.biome`,
    createdAt: b.createdAt || projectData.createdAt || now,
    updatedAt: b.updatedAt || projectData.updatedAt || projectData.createdAt || now,
    biomeData: b
  }));

  const masonProj: MasonProject = {
    id: projId,
    name: projName,
    description: projectData.description || 'Cloud Synced Metroidvania level',
    author: 'Mason Architect',
    engineVersion: '2.0.0',
    activeModule: 'maps',
    createdAt: projectData.createdAt || now,
    updatedAt: projectData.updatedAt || projectData.createdAt || now,
    storageLocation: projectData.storageLocation || {
      type: 'local_file',
      displayName: `Local File (${projName}.mason)`,
      fileName: `${projName}.mason`,
      targetId: projId,
      lastSyncedAt: projectData.updatedAt || now,
      isAutoSyncEnabled: true
    },
    activeFiles: {
      mapFileName: mapFile.fileName,
      biomeFileName: biomeFiles[0]?.fileName || 'ashen_steppes.biome',
      prefabFileName: 'hero_adventurer.prefab',
      uiFileName: 'standard_dark.ui',
      gameStructureFileName: 'main_metroidvania.gamestructure',
      particleFileName: 'fire_embers.particle'
    },
    fileSystem: {
      maps: [mapFile],
      biomes: biomeFiles,
      prefabs: [
        {
          id: 'char_hero',
          name: 'Hero Adventurer',
          fileName: 'hero_adventurer.prefab',
          createdAt: projectData.createdAt || now,
          updatedAt: projectData.updatedAt || projectData.createdAt || now,
          prefabData: {
            id: 'char_hero',
            name: 'Hero Adventurer',
            prefabType: 'player_hero',
            avatarIcon: '🛡️',
            spriteWidth: 64,
            spriteHeight: 64,
            tintColor: '#06b6d4',
            baseSpeed: 4.8,
            canJump: true,
            maxAirJumps: 1,
            hasDash: true,
            hasWallCling: true,
            hasAttack: true,
            hasSpecial: true
          } as any
        }
      ],
      ui: [
        {
          id: 'ui_dark',
          name: 'Standard Dark UI',
          fileName: 'standard_dark.ui',
          createdAt: projectData.createdAt || now,
          updatedAt: projectData.updatedAt || projectData.createdAt || now,
          uiConfig: DEFAULT_UI_THEMES[0]
        }
      ],
      game: [
        {
          id: 'game_main',
          name: 'Main Game Flow',
          fileName: 'main_metroidvania.gamestructure',
          createdAt: projectData.createdAt || now,
          updatedAt: projectData.updatedAt || projectData.createdAt || now,
          structureData: createDefaultGameStructure()
        }
      ],
      behaviors: [],
      particles: DEFAULT_PARTICLE_SYSTEMS.map(p => ({
        id: p.id,
        name: p.name,
        fileName: `${p.id.replace('particles_', '')}.particle`,
        createdAt: projectData.createdAt || now,
        updatedAt: projectData.updatedAt || projectData.createdAt || now,
        particleData: p
      }))
    }
  };

  saveActiveMasonProject(masonProj, 'Load Project Conversion', undefined, { preserveUpdatedAt: true, skipBackups: true });
  return masonProj;
};


export const createNewSpriteInProject = (
  project: MasonProject, 
  name: string,
  width: number = 32,
  height: number = 32
): { project: MasonProject, newFile: SpriteFile } => {
  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.sprite`;
  const newFile: SpriteFile = {
    id: `sprite_${Date.now()}`,
    name,
    fileName,
    width,
    height,
    updatedAt: new Date().toISOString(),
    spriteData: null
  };
  
  const updatedProject = {
    ...project,
    fileSystem: {
      ...project.fileSystem,
      sprites: [...(project.fileSystem.sprites || []), newFile]
    }
  };
  
  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile };
};
