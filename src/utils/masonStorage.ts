import { 
  MasonProject, 
  MapFile, 
  BiomeFile, 
  UIThemeFile, 
  GameStructureFile,
  createInitialMasonProject,
  createDefaultMapFile,
  DEFAULT_UI_THEMES,
  createDefaultGameStructure
} from '../engine/masonProjectSchema';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { MASON_VERSION_DISPLAY } from '../version';

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
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_META = 'meta';

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

/**
 * Saves a project to active storage, memory cache, and library index
 */
export const saveActiveMasonProject = (project: MasonProject): void => {
  try {
    project.updatedAt = new Date().toISOString();
    project.engineVersion = MASON_VERSION_DISPLAY;
    
    // 1. Update in-memory cache instantly
    inMemoryActiveProject = project;
    inMemoryProjectsCache.set(project.id, project);

    // 2. Persist asynchronously in IndexedDB
    idbSaveProject(project);

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
    saveActiveMasonProject(cached);
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
        saveActiveMasonProject(parsed);
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

export const exportFullProjectBundle = (project: MasonProject) => {
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadJsonFile(`${safeName}_project_bundle.mason`, project);
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
    updatedAt: projectData.updatedAt || now,
    chunks: mapData.chunks || {},
    cells: mapData.cells || [],
    data: mapData
  };

  const biomeFiles: BiomeFile[] = biomesData.map((b: any, idx: number) => ({
    id: b.id || `biome_${idx}`,
    name: b.name || `Biome ${idx + 1}`,
    fileName: `${(b.name || 'biome').toLowerCase().replace(/[^a-z0-9]/g, '_')}.biome`,
    createdAt: now,
    updatedAt: now,
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
    updatedAt: now,
    activeFiles: {
      mapFileName: mapFile.fileName,
      biomeFileName: biomeFiles[0]?.fileName || 'ashen_steppes.biome',
      characterFileName: 'hero_adventurer.character',
      uiFileName: 'standard_dark.ui',
      gameStructureFileName: 'main_metroidvania.gamestructure'
    },
    fileSystem: {
      maps: [mapFile],
      biomes: biomeFiles,
      characters: [
        {
          id: 'char_hero',
          name: 'Hero Adventurer',
          fileName: 'hero_adventurer.character',
          createdAt: now,
          updatedAt: now,
          characterData: {
            id: 'char_hero',
            name: 'Hero Adventurer',
            characterType: 'player_hero',
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
          createdAt: now,
          updatedAt: now,
          uiConfig: DEFAULT_UI_THEMES[0]
        }
      ],
      game: [
        {
          id: 'game_main',
          name: 'Main Game Flow',
          fileName: 'main_metroidvania.gamestructure',
          createdAt: now,
          updatedAt: now,
          structureData: createDefaultGameStructure()
        }
      ],
      behaviors: []
    }
  };

  saveActiveMasonProject(masonProj);
  return masonProj;
};

