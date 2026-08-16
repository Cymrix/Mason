import { RefinedMapData } from '../types';
import { RefinedBiome } from '../engine/refinedBiomeSchema';
import { INITIAL_REFINED_BIOMES } from '../engine/refinedBiomes';

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  mapWidth: number;
  mapHeight: number;
  biomesCount: number;
  activeBiomeName: string;
  activeBiomeId: string;
  primaryTileName?: string;
  totalCustomTextures?: number;
}

export interface ProjectSettings {
  brushSize?: number;
  autoScatterEnvironmental?: boolean;
  autoScatterWildlife?: boolean;
  activeLayout?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  engine_version: string;
  tile_size_px: number;
  createdAt: string;
  updatedAt: string;
  map: RefinedMapData;
  biomes: RefinedBiome[];
  activeBiomeId: string;
  settings?: ProjectSettings;
}

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  accentColor: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  biomeId: string;
}

const STORAGE_PREFIX = 'mourne_project_';
const PROJECT_LIST_KEY = 'mourne_projects_index';
const AUTO_SAVE_KEY = 'mourne_project_autosave';
const CURRENT_ACTIVE_PROJECT_KEY = 'mourne_current_active_project_id';

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'mourne_steppes_outpost',
    name: 'Ashen Steppes Stronghold',
    description: 'Wind-scoured volcanic basalt plains with mineral crags, obsidian ruins, and ember wolves.',
    badge: 'Volcanic',
    accentColor: 'from-amber-600/30 to-orange-950/40 border-amber-500/40',
    icon: '🌋',
    defaultWidth: 24,
    defaultHeight: 24,
    biomeId: 'mourne_ashen_steppes'
  },
  {
    id: 'whispering_canopy_grove',
    name: 'Whispering Canopy Grove',
    description: 'Ancient luminescent woodland with towering canopy trees, bioluminescent moss, and spirit stag wildlife.',
    badge: 'Verdant',
    accentColor: 'from-emerald-600/30 to-teal-950/40 border-emerald-500/40',
    icon: '🌲',
    defaultWidth: 24,
    defaultHeight: 24,
    biomeId: 'whispering_canopy'
  },
  {
    id: 'brimstone_caldera_forge',
    name: 'Brimstone Caldera & Crucible',
    description: 'Active magma flows, scorched bedrock, heat distortion, and sulfur vents ready for high-stakes combat.',
    badge: 'Inferno',
    accentColor: 'from-red-600/30 to-rose-950/40 border-red-500/40',
    icon: '🔥',
    defaultWidth: 24,
    defaultHeight: 24,
    biomeId: 'brimstone_caldera'
  },
  {
    id: 'blank_canvas_standard',
    name: 'Standard Arena Canvas',
    description: 'A clean 24×24 world grid initialized with base terrain, ready for custom authoring and biome sculpting.',
    badge: 'Clean 24x24',
    accentColor: 'from-blue-600/30 to-indigo-950/40 border-blue-500/40',
    icon: '🗺️',
    defaultWidth: 24,
    defaultHeight: 24,
    biomeId: 'mourne_ashen_steppes'
  },
  {
    id: 'blank_canvas_grand',
    name: 'Grand Expedition Map (32×32)',
    description: 'Expansive 32×32 layout designed for multi-biome transitions, deep dungeon crawls, or vast overland zones.',
    badge: 'Grand 32x32',
    accentColor: 'from-purple-600/30 to-violet-950/40 border-purple-500/40',
    icon: '⚔️',
    defaultWidth: 32,
    defaultHeight: 32,
    biomeId: 'mourne_ashen_steppes'
  }
];

export const generateProjectId = (name: string): string => {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${sanitized || 'project'}_${timestamp}_${random}`;
};

export const countCustomTexturesInBiomes = (biomes: RefinedBiome[]): number => {
  let count = 0;
  for (const b of biomes) {
    for (const tt of b.tileTypes) {
      if (tt.baseMaterialA.albedoTextureUrl) count++;
      if (tt.baseMaterialBTextureUrl) count++;
      if (tt.heightMapTextureUrl) count++;
      if (tt.roughnessMapTextureUrl) count++;
      if (tt.tileDetails?.top?.overlayTextureUrl) count++;
      if (tt.tileDetails?.bottom?.overlayTextureUrl) count++;
      if (tt.tileDetails?.leftSide?.overlayTextureUrl) count++;
      if (tt.tileDetails?.rightSide?.overlayTextureUrl) count++;
    }
  }
  return count;
};

export const buildMetadata = (project: ProjectData): ProjectMetadata => {
  const activeB = project.biomes.find(b => b.id === project.activeBiomeId) || project.biomes[0];
  const primaryTile = activeB?.tileTypes.find(t => t.id === activeB.primaryTileTypeId) || activeB?.tileTypes[0];

  return {
    id: project.id,
    name: project.name || 'Untitled World',
    description: project.description || '',
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
    mapWidth: project.map?.width || 24,
    mapHeight: project.map?.height || 24,
    biomesCount: project.biomes?.length || 1,
    activeBiomeName: activeB?.name || 'Unknown Biome',
    activeBiomeId: project.activeBiomeId || activeB?.id || '',
    primaryTileName: primaryTile?.name || 'Base Rock',
    totalCustomTextures: countCustomTexturesInBiomes(project.biomes)
  };
};

export const getAllSavedProjects = (): ProjectMetadata[] => {
  try {
    const raw = localStorage.getItem(PROJECT_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return [];
  } catch (e) {
    console.error('Failed to load project index from localStorage:', e);
    return [];
  }
};

export const saveProjectToStorage = (project: ProjectData): ProjectMetadata => {
  const now = new Date().toISOString();
  const updatedProject: ProjectData = {
    ...project,
    updatedAt: now,
    createdAt: project.createdAt || now
  };

  const metadata = buildMetadata(updatedProject);

  try {
    // Save project data
    localStorage.setItem(`${STORAGE_PREFIX}${updatedProject.id}`, JSON.stringify(updatedProject));

    // Update index
    const list = getAllSavedProjects().filter(p => p.id !== updatedProject.id);
    list.unshift(metadata);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(list));
    localStorage.setItem(CURRENT_ACTIVE_PROJECT_KEY, updatedProject.id);
  } catch (e) {
    console.error('Failed to save project to localStorage:', e);
    throw new Error('Could not save project. LocalStorage quota might be exceeded.');
  }

  return metadata;
};

export const loadProjectFromStorage = (id: string): ProjectData | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    const project = JSON.parse(raw) as ProjectData;
    localStorage.setItem(CURRENT_ACTIVE_PROJECT_KEY, id);
    return project;
  } catch (e) {
    console.error(`Failed to load project with id ${id}:`, e);
    return null;
  }
};

export const deleteProjectFromStorage = (id: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    const list = getAllSavedProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(list));
    
    if (localStorage.getItem(CURRENT_ACTIVE_PROJECT_KEY) === id) {
      localStorage.removeItem(CURRENT_ACTIVE_PROJECT_KEY);
    }
  } catch (e) {
    console.error(`Failed to delete project ${id}:`, e);
  }
};

export const duplicateProjectInStorage = (id: string, newName?: string): ProjectData | null => {
  const source = loadProjectFromStorage(id);
  if (!source) return null;

  const copyName = newName || `${source.name} (Copy)`;
  const newId = generateProjectId(copyName);
  const now = new Date().toISOString();

  const duplicatedProject: ProjectData = {
    ...source,
    id: newId,
    name: copyName,
    createdAt: now,
    updatedAt: now
  };

  saveProjectToStorage(duplicatedProject);
  return duplicatedProject;
};

export const saveAutoSave = (project: ProjectData): void => {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
      ...project,
      updatedAt: new Date().toISOString()
    }));
  } catch {
    // Silent fail for autosave in case storage is full
  }
};

export const getAutoSavedProject = (): ProjectData | null => {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectData;
  } catch {
    return null;
  }
};

export const createEmptyMap = (width: number, height: number, defaultTileTypeId: string = '', defaultBiomeId: string = 'mourne_ashen_steppes'): RefinedMapData => {
  return {
    width,
    height,
    chunks: {},
  };
};

export const createStarterProject = (
  templateId: string,
  customName?: string,
  dimensions?: { width: number; height: number }
): ProjectData => {
  const template = STARTER_TEMPLATES.find(t => t.id === templateId) || STARTER_TEMPLATES[0];
  const width = dimensions?.width || template.defaultWidth;
  const height = dimensions?.height || template.defaultHeight;
  const biomes = JSON.parse(JSON.stringify(INITIAL_REFINED_BIOMES)) as RefinedBiome[];
  
  const targetBiome = biomes.find(b => b.id === template.biomeId) || biomes[0];
  const primaryTileId = targetBiome.primaryTileTypeId || targetBiome.tileTypes?.[0]?.id || 'ashen_basalt';

  const map = createEmptyMap(width, height, primaryTileId, targetBiome.id);

  // Add terrain variety for pre-built templates
  if (templateId === 'mourne_steppes_outpost') {
    // Generate gentle elevation and scattered features
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noise = (Math.sin(x * 0.45) + Math.cos(y * 0.45)) * 0.5 + 0.5;
        if (noise > 0.65 && targetBiome.tileTypes[1]) {
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].tile_type_id = targetBiome.tileTypes[1].id;
        } else if (noise > 0.85 && targetBiome.tileTypes[2]) {
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].tile_type_id = targetBiome.tileTypes[2].id;
        }

        // Scatter flora/rocks
        if (Math.random() < 0.12 && targetBiome.environmentalDetails.length > 0) {
          const randEnv = targetBiome.environmentalDetails[Math.floor(Math.random() * targetBiome.environmentalDetails.length)];
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].environmental_detail_id = randEnv.id;
        }

        // Scatter wildlife
        if (Math.random() < 0.04 && targetBiome.wildlife.length > 0) {
          const randFauna = targetBiome.wildlife[Math.floor(Math.random() * targetBiome.wildlife.length)];
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].wildlife_id = randFauna.id;
        }

        // Interactive altar/chest in center
        if (x === Math.floor(width / 2) && y === Math.floor(height / 2) && targetBiome.interactiveDetails[0]) {
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].interactive_detail_id = targetBiome.interactiveDetails[0].id;
        }
      }
    }
  } else if (templateId === 'whispering_canopy_grove' || templateId === 'brimstone_caldera_forge') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distCenter = Math.sqrt((x - width / 2) ** 2 + (y - height / 2) ** 2);
        if (distCenter > (width * 0.35) && targetBiome.tileTypes[1]) {
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].tile_type_id = targetBiome.tileTypes[1].id;
        }
        if (Math.random() < 0.15 && targetBiome.environmentalDetails.length > 0) {
          if (map.cells[y] && map.cells[y][x]) map.cells[y][x].environmental_detail_id = targetBiome.environmentalDetails[0].id;
        }
      }
    }
  }

  const name = customName || template.name;
  const now = new Date().toISOString();

  return {
    id: generateProjectId(name),
    name,
    description: template.description,
    engine_version: '2.0-refined-biomes',
    tile_size_px: 64,
    createdAt: now,
    updatedAt: now,
    map,
    biomes,
    activeBiomeId: targetBiome.id,
    settings: {
      brushSize: 1,
      autoScatterEnvironmental: true,
      autoScatterWildlife: true
    }
  };
};

export const exportProjectAsJson = (project: ProjectData, customFilename?: string): void => {
  const exportPayload = {
    ...project,
    engine_version: '2.0-refined-biomes',
    tile_size_px: 64,
    updatedAt: new Date().toISOString()
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = (customFilename || project.name || 'mourne_project')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${cleanFilename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const parseProjectJson = (jsonStr: string): ProjectData => {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: any) {
    throw new Error('Invalid JSON file format: ' + err.message);
  }

  if (!parsed) {
    throw new Error('JSON file is empty.');
  }

  // Handle compatibility with old or raw map exports
  const biomes = Array.isArray(parsed.biomes) && parsed.biomes.length > 0 
    ? parsed.biomes 
    : JSON.parse(JSON.stringify(INITIAL_REFINED_BIOMES));

  const activeBiomeId = parsed.active_biome_id || parsed.activeBiomeId || biomes?.[0]?.id || 'mourne_ashen_steppes';
  
  let mapData: RefinedMapData;
  if (parsed.map && (Array.isArray(parsed.map.cells) || parsed.map.chunks)) {
    mapData = parsed.map;
  } else if (parsed.cells && Array.isArray(parsed.cells)) {
    mapData = {
      width: parsed.width || parsed.cells?.[0]?.length || 24,
      height: parsed.height || parsed.cells.length || 24,
      cells: parsed.cells
    };
  } else {
    // Generate empty fallback map
    const defaultBiome = biomes.find((b: any) => b.id === activeBiomeId) || biomes[0];
    mapData = createEmptyMap(24, 24, defaultBiome?.primaryTileTypeId || 'ashen_basalt');
  }

  const now = new Date().toISOString();
  const projectName = parsed.name || parsed.projectName || 'Imported World Project';

  return {
    id: parsed.id || generateProjectId(projectName),
    name: projectName,
    description: parsed.description || 'Imported Mourne level manifest',
    engine_version: parsed.engine_version || '2.0-refined-biomes',
    tile_size_px: parsed.tile_size_px || 64,
    createdAt: parsed.createdAt || now,
    updatedAt: now,
    map: mapData,
    biomes,
    activeBiomeId,
    settings: parsed.settings || {
      brushSize: 1,
      autoScatterEnvironmental: true,
      autoScatterWildlife: true
    }
  };
};

export const importProjectFromFile = (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const project = parseProjectJson(text);
        resolve(project);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};
