import { 
  MasonProject, 
  MapFile, 
  BiomeFile, 
  ArchetypeFile, 
  UIThemeFile, 
  GameStructureFile,
  createInitialMasonProject,
  createDefaultMapFile,
  DEFAULT_UI_THEMES,
  DEFAULT_ARCHETYPES,
  createDefaultGameStructure
} from '../engine/masonProjectSchema';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { MASON_VERSION_DISPLAY } from '../version';

const MASON_PROJECT_STORAGE_KEY = 'mason_active_project_data';
const MASON_PROJECT_LIST_INDEX = 'mason_projects_index';
const MASON_ALL_PROJECTS_STORE = 'mason_all_saved_projects_store';

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

// ==================================================
// LOCAL STORAGE MANAGEMENT
// ==================================================

/**
 * Loads the active project, or returns null if no project is currently open
 */
export const getActiveMasonProject = (): MasonProject | null => {
  try {
    const raw = localStorage.getItem(MASON_PROJECT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MasonProject;
      if (parsed && parsed.fileSystem && parsed.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load active Mason project from storage:', err);
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
 * Saves a project to active storage and library index
 */
export const saveActiveMasonProject = (project: MasonProject): void => {
  try {
    project.updatedAt = new Date().toISOString();
    project.engineVersion = MASON_VERSION_DISPLAY;
    localStorage.setItem(MASON_PROJECT_STORAGE_KEY, JSON.stringify(project));
    
    // Also save in full project library
    const allProjectsRaw = localStorage.getItem(MASON_ALL_PROJECTS_STORE);
    let allProjects: Record<string, MasonProject> = allProjectsRaw ? JSON.parse(allProjectsRaw) : {};
    allProjects[project.id] = project;
    localStorage.setItem(MASON_ALL_PROJECTS_STORE, JSON.stringify(allProjects));

    // Update index list
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
    localStorage.setItem(MASON_PROJECT_LIST_INDEX, JSON.stringify(index.slice(0, 20)));
  } catch (err) {
    console.error('Failed to save Mason project:', err);
  }
};

/**
 * Closes the active project (returns Mason to no-project launcher screen)
 */
export const closeActiveMasonProject = (): void => {
  try {
    localStorage.removeItem(MASON_PROJECT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to close active Mason project:', err);
  }
};

/**
 * Lists all saved projects from library index
 */
export const listSavedProjects = (): ProjectIndexItem[] => {
  try {
    const indexRaw = localStorage.getItem(MASON_PROJECT_LIST_INDEX);
    if (indexRaw) {
      return JSON.parse(indexRaw);
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
  try {
    const allProjectsRaw = localStorage.getItem(MASON_ALL_PROJECTS_STORE);
    if (allProjectsRaw) {
      const allProjects = JSON.parse(allProjectsRaw);
      if (allProjects[projectId]) {
        const proj = allProjects[projectId];
        saveActiveMasonProject(proj);
        return proj;
      }
    }
  } catch (err) {
    console.error(`Failed to load project with ID ${projectId}:`, err);
  }
  return null;
};

/**
 * Deletes a project from the library
 */
export const deleteSavedProject = (projectId: string): void => {
  try {
    const indexRaw = localStorage.getItem(MASON_PROJECT_LIST_INDEX);
    if (indexRaw) {
      const index: ProjectIndexItem[] = JSON.parse(indexRaw);
      localStorage.setItem(MASON_PROJECT_LIST_INDEX, JSON.stringify(index.filter(p => p.id !== projectId)));
    }
    const allProjectsRaw = localStorage.getItem(MASON_ALL_PROJECTS_STORE);
    if (allProjectsRaw) {
      const allProjects = JSON.parse(allProjectsRaw);
      delete allProjects[projectId];
      localStorage.setItem(MASON_ALL_PROJECTS_STORE, JSON.stringify(allProjects));
    }
    const current = getActiveMasonProject();
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

export const exportArchetypeFile = (file: ArchetypeFile) => {
  downloadJsonFile(file.fileName.endsWith('.arch') ? file.fileName : `${file.fileName}.arch`, file);
};

export const exportUIThemeFile = (file: UIThemeFile) => {
  downloadJsonFile(file.fileName.endsWith('.ui') ? file.fileName : `${file.fileName}.ui`, file);
};

export const exportGameStructureFile = (file: GameStructureFile) => {
  downloadJsonFile(file.fileName.endsWith('.gamestructure') ? file.fileName : `${file.fileName}.gamestructure`, file);
};

export const exportFullProjectBundle = (project: MasonProject) => {
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadJsonFile(`${safeName}_project_bundle.mason.json`, project);
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
  const baseBiome = templateBiome || project.fileSystem.biomes[0]?.biomeData;
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

export const createNewArchetypeInProject = (
  project: MasonProject,
  name: string
): { project: MasonProject; newFile: ArchetypeFile } => {
  const safeFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.arch`;
  const baseArch = DEFAULT_ARCHETYPES[0];
  const newArchData = {
    ...baseArch,
    id: `arch_${Date.now()}`,
    name,
    title: `${name} (Initiate)`
  };

  const newArchFile: ArchetypeFile = {
    id: newArchData.id,
    name,
    fileName: safeFileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archetypeData: newArchData
  };

  const updatedProject: MasonProject = {
    ...project,
    activeFiles: {
      ...project.activeFiles,
      archetypeFileName: safeFileName
    },
    fileSystem: {
      ...project.fileSystem,
      archetypes: [...project.fileSystem.archetypes, newArchFile]
    }
  };

  saveActiveMasonProject(updatedProject);
  return { project: updatedProject, newFile: newArchFile };
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
