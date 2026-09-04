import { MasonProject } from '../engine/masonProjectSchema';
import { 
  saveProjectToGoogleDrive, 
  saveModularProjectToGoogleDrive, 
  getGoogleDriveToken,
  readModularProjectFromGoogleDrive,
  listGoogleDriveFolderContents,
  downloadFileAsTextFromGoogleDrive,
  clearGoogleDriveModularCache
} from './googleDriveStorage';
import { 
  saveProjectToOneDrive, 
  saveModularProjectToOneDrive, 
  getOneDriveToken, 
  ensureOneDriveToken,
  readModularProjectFromOneDrive,
  listOneDriveFolderContents,
  downloadFileAsTextFromOneDrive,
  clearOneDriveModularCache
} from './oneDriveStorage';
import { getProjectMasonFileName, idbSaveHandle, idbGetHandle, idbDeleteHandle } from './masonStorage';
import { getActiveProfile } from './appProfileSystem';

export type LinkedLocationType = 'local_idb' | 'local_file' | 'local_directory' | 'gdrive' | 'onedrive';

export interface LinkedStorageLocation {
  type: LinkedLocationType;
  displayName: string;
  targetId?: string;           // Cloud fileId, or folder ID, or local file handle key
  targetFolderId?: string;     // Cloud parent folder ID or path
  targetFolderName?: string;   // Cloud folder name or local directory name
  fileName?: string;           // e.g. "MyWorld.mason"
  lastSyncedAt?: string;       // ISO string
  etag?: string;               // Cloud or local file checksum / modified timestamp for lock detection
  isAutoSyncEnabled?: boolean; // If changes should auto-sync in the background
  lockedBy?: {                 // Step 2 lock indicator
    user: string;
    timestamp: string;
    clientId: string;
  };
}

export interface FileLockInfo {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  lockClientId?: string;
  isStale?: boolean; // Lock expired (> 15 minutes without heartbeat)
  lockedByProfile?: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
}

export interface SyncResult {
  success: boolean;
  remoteConflictDetected?: boolean;
  conflictDetails?: {
    remoteModifiedAt?: string;
    remoteVersion?: string;
    remoteUser?: string;
  };
  error?: string;
  syncedLocation?: LinkedStorageLocation;
  syncedFiles?: string[];
}

// In-memory runtime handle storage for File System Access API (not serializable in JSON)
let activeFileSystemFileHandle: any = null;
let activeFileSystemDirHandle: any = null;

export const getActiveFileSystemFileHandle = () => activeFileSystemFileHandle;
export const setActiveFileSystemFileHandle = (handle: any) => {
  activeFileSystemFileHandle = handle;
  if (handle) {
    idbSaveHandle('active_file', handle);
    if (handle.name) idbSaveHandle(`file_name_${handle.name}`, handle);
  }
};

export const getActiveFileSystemDirHandle = () => activeFileSystemDirHandle;
export const setActiveFileSystemDirHandle = (handle: any) => {
  activeFileSystemDirHandle = handle;
  if (handle) {
    idbSaveHandle('active_dir', handle);
    if (handle.name) idbSaveHandle(`dir_name_${handle.name}`, handle);
  }
};

export const setStoredDirHandleForProject = async (projectId: string, handle: any, folderName?: string) => {
  activeFileSystemDirHandle = handle;
  if (!handle) return;
  await idbSaveHandle(`dir_${projectId}`, handle);
  if (folderName || handle.name) {
    await idbSaveHandle(`dir_name_${folderName || handle.name}`, handle);
  }
  await idbSaveHandle('active_dir', handle);
};

export const setStoredFileHandleForProject = async (projectId: string, handle: any, fileName?: string) => {
  activeFileSystemFileHandle = handle;
  if (!handle) return;
  await idbSaveHandle(`file_${projectId}`, handle);
  if (fileName || handle.name) {
    await idbSaveHandle(`file_name_${fileName || handle.name}`, handle);
  }
  await idbSaveHandle('active_file', handle);
};

export const getOrRestoreActiveFileSystemDirHandle = async (project?: MasonProject | null): Promise<any> => {
  if (activeFileSystemDirHandle) {
    return activeFileSystemDirHandle;
  }
  if (!project) {
    const handle = await idbGetHandle('active_dir');
    if (handle) {
      activeFileSystemDirHandle = handle;
      return handle;
    }
    return null;
  }
  const targetName = project.storageLocation?.targetFolderName;
  
  let handle = await idbGetHandle(`dir_${project.id}`);
  if (!handle && targetName) {
    handle = await idbGetHandle(`dir_name_${targetName}`);
  }
  if (!handle) {
    handle = await idbGetHandle('active_dir');
  }
  if (handle) {
    activeFileSystemDirHandle = handle;
    return handle;
  }
  return null;
};

export const getOrRestoreActiveFileSystemFileHandle = async (project?: MasonProject | null): Promise<any> => {
  if (activeFileSystemFileHandle) {
    return activeFileSystemFileHandle;
  }
  if (!project) {
    const handle = await idbGetHandle('active_file');
    if (handle) {
      activeFileSystemFileHandle = handle;
      return handle;
    }
    return null;
  }
  const fileName = project.storageLocation?.fileName;
  
  let handle = await idbGetHandle(`file_${project.id}`);
  if (!handle && fileName) {
    handle = await idbGetHandle(`file_name_${fileName}`);
  }
  if (!handle) {
    handle = await idbGetHandle('active_file');
  }
  if (handle) {
    activeFileSystemFileHandle = handle;
    return handle;
  }
  return null;
};

// Unique client session ID for this browser tab to identify lock owners
export const CURRENT_CLIENT_SESSION_ID = `mason_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

/**
 * Creates default local storage location metadata
 */
export const createDefaultStorageLocation = (projectName: string): LinkedStorageLocation => {
  return {
    type: 'local_idb',
    displayName: 'Browser Workspace (IndexedDB)',
    fileName: `${projectName}.mason`,
    lastSyncedAt: new Date().toISOString(),
    isAutoSyncEnabled: true
  };
};

/**
 * Checks if File System Access API is supported by the user's browser
 */
export const isFileSystemAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

export const isDirectoryAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

/**
 * Prompts user to pick a local file on their hard drive to bind to this project
 */
export const linkProjectToLocalFile = async (projectName: string, projectId?: string): Promise<{ location: LinkedStorageLocation; handle: any } | null> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
  }

  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${projectName}.mason`,
      types: [{
        description: 'Mason Project Bundle (*.mason)',
        accept: {
          'application/json': ['.mason', '.json']
        }
      }]
    });

    if (!handle) return null;

    activeFileSystemFileHandle = handle;
    if (projectId) {
      await setStoredFileHandleForProject(projectId, handle, handle.name);
    } else {
      await idbSaveHandle('active_file', handle);
      await idbSaveHandle(`file_name_${handle.name}`, handle);
    }

    const location: LinkedStorageLocation = {
      type: 'local_file',
      displayName: `Local File (${handle.name})`,
      fileName: handle.name,
      targetId: handle.name,
      lastSyncedAt: new Date().toISOString(),
      isAutoSyncEnabled: true
    };

    return { location, handle };
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
};

/**
 * Prompts user to pick a local folder on their hard drive for modular multi-file sync (Step 1)
 */
export const linkProjectToLocalDirectory = async (projectName: string, projectId?: string): Promise<{ location: LinkedStorageLocation; handle: any } | null> => {
  if (!isDirectoryAccessSupported()) {
    throw new Error('Directory Access is not supported in this browser. Please use Chrome, Edge, or Opera.');
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });

    if (!dirHandle) return null;

    activeFileSystemDirHandle = dirHandle;
    if (projectId) {
      await setStoredDirHandleForProject(projectId, dirHandle, dirHandle.name);
    } else {
      await idbSaveHandle('active_dir', dirHandle);
      await idbSaveHandle(`dir_name_${dirHandle.name}`, dirHandle);
    }

    const location: LinkedStorageLocation = {
      type: 'local_directory',
      displayName: `Local Folder (${dirHandle.name})`,
      targetFolderName: dirHandle.name,
      targetId: dirHandle.name,
      fileName: `${projectName}.mason`,
      lastSyncedAt: new Date().toISOString(),
      isAutoSyncEnabled: true
    };

    return { location, handle: dirHandle };
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
};

// In-memory cache of written modular files to avoid re-writing unchanged files on disk
const writtenModularFileTimestampCache = new Map<string, string>();

export const clearLocalModularCache = (projectId?: string) => {
  if (projectId) {
    for (const key of Array.from(writtenModularFileTimestampCache.keys())) {
      if (key.startsWith(`${projectId}:`)) {
        writtenModularFileTimestampCache.delete(key);
      }
    }
  } else {
    writtenModularFileTimestampCache.clear();
  }
};

export const clearAllModularSyncCaches = (projectId?: string) => {
  clearLocalModularCache(projectId);
  clearGoogleDriveModularCache(projectId);
  clearOneDriveModularCache(projectId);
};

/**
 * Writes modular files (Step 1: Modular Multi-File Structure) to a connected local directory
 */
export const writeModularProjectToDirectory = async (project: MasonProject, dirHandle: any): Promise<string[]> => {
  if (!dirHandle) throw new Error('No directory handle available');

  const syncedFileList: string[] = [];

  // 1. Write root project manifest file (e.g. mourne_edris.mason)
  const manifestFileName = getProjectMasonFileName(project.name);
  const manifestCacheKey = `${project.id}:root:${manifestFileName}`;
  const manifestStamp = `${project.updatedAt || ''}_${project.engineVersion || ''}_${JSON.stringify(project.lockInfo || {})}`;

  syncedFileList.push(manifestFileName);

  if (writtenModularFileTimestampCache.get(manifestCacheKey) !== manifestStamp) {
    const manifestFileHandle = await dirHandle.getFileHandle(manifestFileName, { create: true });
    const manifestWritable = await manifestFileHandle.createWritable();
    
    // Clean manifest copy containing metadata and index
    const manifestData = {
      id: project.id,
      name: project.name,
      description: project.description,
      author: project.author,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      engineVersion: project.engineVersion,
      activeModule: project.activeModule,
      activeFiles: project.activeFiles,
      storageLocation: project.storageLocation,
      lockInfo: project.lockInfo,
      taskBoard: project.taskBoard,
      fileIndex: {
        maps: (project.fileSystem?.maps || []).map(m => m.fileName),
        biomes: (project.fileSystem?.biomes || []).map(b => b.fileName),
        prefabs: (project.fileSystem?.prefabs || []).map(p => p.fileName),
        ui: (project.fileSystem?.ui || []).map(u => u.fileName),
        game: (project.fileSystem?.game || []).map(g => g.fileName),
        particles: (project.fileSystem?.particles || []).map(p => p.fileName),
        sprites: (project.fileSystem?.sprites || []).map(s => s.fileName),
        behaviors: (project.fileSystem?.behaviors || []).map(b => b.fileName),
        images: (project.fileSystem?.images || []).map(i => i.fileName)
      }
    };

    await manifestWritable.write(JSON.stringify(manifestData, null, 2));
    await manifestWritable.close();
    writtenModularFileTimestampCache.set(manifestCacheKey, manifestStamp);
    await new Promise(r => setTimeout(r, 0));
  }

  // Helper to write subdirectories incrementally
  const writeSubdirFiles = async (subdirName: string, files: any[]) => {
    if (!files || files.length === 0) return;
    const subDirHandle = await dirHandle.getDirectoryHandle(subdirName, { create: true });
    for (const file of files) {
      const fileName = file.fileName || `${file.id || 'file'}.json`;
      const relPath = `${subdirName}/${fileName}`;
      syncedFileList.push(relPath);

      const cacheKey = `${project.id}:${subdirName}:${fileName}`;
      const currentStamp = file.updatedAt || file.id || 'initial';

      // Skip re-writing file if it hasn't changed since last sync
      if (writtenModularFileTimestampCache.get(cacheKey) === currentStamp) {
        continue;
      }

      const fileHandle = await subDirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(file, null, 2));
      await writable.close();
      writtenModularFileTimestampCache.set(cacheKey, currentStamp);

      // Cooperative yield to the browser event loop so animation frames render smoothly
      await new Promise(r => setTimeout(r, 0));
    }
  };

  // Write all modular sub-folders
  await writeSubdirFiles('maps', project.fileSystem?.maps || []);
  await writeSubdirFiles('biomes', project.fileSystem?.biomes || []);
  await writeSubdirFiles('prefabs', project.fileSystem?.prefabs || []);
  await writeSubdirFiles('ui', project.fileSystem?.ui || []);
  await writeSubdirFiles('structure', project.fileSystem?.game || []);
  await writeSubdirFiles('particles', project.fileSystem?.particles || []);
  await writeSubdirFiles('sprites', project.fileSystem?.sprites || []);
  await writeSubdirFiles('behaviors', project.fileSystem?.behaviors || []);
  await writeSubdirFiles('images', project.fileSystem?.images || []);

  return syncedFileList;
};

/**
 * Saves a project to its configured target location (Local File, Local Folder, GDrive, OneDrive, or IDB)
 * Includes Step 2 Lock & Conflict verification
 */
export const saveProjectToLinkedLocation = async (
  project: MasonProject, 
  forceOverride: boolean = false
): Promise<SyncResult> => {
  const location = project.storageLocation;
  if (!location || location.type === 'local_idb') {
    return {
      success: true,
      syncedLocation: {
        ...(location || createDefaultStorageLocation(project.name)),
        lastSyncedAt: new Date().toISOString()
      }
    };
  }

  // Pre-flight check: Verify target storage location connectivity and access permission
  const accessCheck = await verifyLinkedStorageAccess(project);
  if (!accessCheck.available) {
    return {
      success: false,
      error: `Storage location unreachable: ${accessCheck.reason}`
    };
  }

  // Check locks (Step 2)
  if (!forceOverride && project.lockInfo?.isLocked) {
    const isLockedByOther = project.lockInfo.lockClientId && project.lockInfo.lockClientId !== CURRENT_CLIENT_SESSION_ID;
    if (isLockedByOther) {
      return {
        success: false,
        remoteConflictDetected: true,
        conflictDetails: {
          remoteUser: project.lockInfo.lockedBy || 'Another Collaborator',
          remoteModifiedAt: project.lockInfo.lockedAt
        },
        error: `Project is locked by ${project.lockInfo.lockedBy || 'another user'} to prevent conflicting changes.`
      };
    }
  }

  try {
    if (location.type === 'local_file') {
      let handle = activeFileSystemFileHandle;
      if (!handle) {
        handle = await getOrRestoreActiveFileSystemFileHandle(project);
      }
      if (!handle) {
        const linked = await linkProjectToLocalFile(project.name, project.id);
        if (!linked) return { success: false, error: 'Save cancelled: No file selected' };
        handle = linked.handle;
      }

      if (typeof handle.queryPermission === 'function') {
        const status = await handle.queryPermission({ mode: 'readwrite' });
        if (status !== 'granted' && typeof handle.requestPermission === 'function') {
          const req = await handle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') {
            return { success: false, error: `Permission denied for local file "${handle.name}".` };
          }
        }
      }

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(project, null, 2));
      await writable.close();

      await setStoredFileHandleForProject(project.id, handle, handle.name);

      const updatedLoc: LinkedStorageLocation = {
        ...location,
        displayName: `Local File (${handle.name})`,
        fileName: handle.name,
        lastSyncedAt: new Date().toISOString()
      };

      return { success: true, syncedLocation: updatedLoc, syncedFiles: [handle.name] };
    }

    if (location.type === 'local_directory') {
      let dirHandle = activeFileSystemDirHandle;
      if (!dirHandle) {
        dirHandle = await getOrRestoreActiveFileSystemDirHandle(project);
      }
      if (!dirHandle) {
        const linked = await linkProjectToLocalDirectory(project.name, project.id);
        if (!linked) return { success: false, error: 'Save cancelled: No folder selected' };
        dirHandle = linked.handle;
      }

      if (typeof dirHandle.queryPermission === 'function') {
        const status = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (status !== 'granted' && typeof dirHandle.requestPermission === 'function') {
          const req = await dirHandle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') {
            return { success: false, error: `Permission denied for local folder "${dirHandle.name}".` };
          }
        }
      }

      const syncedFiles = await writeModularProjectToDirectory(project, dirHandle);
      await setStoredDirHandleForProject(project.id, dirHandle, dirHandle.name);

      const updatedLoc: LinkedStorageLocation = {
        ...location,
        displayName: `Local Folder (${dirHandle.name})`,
        targetFolderName: dirHandle.name,
        lastSyncedAt: new Date().toISOString()
      };

      return { success: true, syncedLocation: updatedLoc, syncedFiles };
    }

    if (location.type === 'gdrive') {
      const token = getGoogleDriveToken();
      if (!token) {
        return { success: false, error: 'Google Drive is not connected. Please connect via File Manager.' };
      }

      if (location.targetFolderId) {
        await saveModularProjectToGoogleDrive(project, location.targetFolderId, location.targetFolderName);
        const updatedLoc: LinkedStorageLocation = {
          ...location,
          displayName: `Google Drive Folder (${location.targetFolderName || 'Workspace Folder'})`,
          lastSyncedAt: new Date().toISOString()
        };
        const defaultManifest = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mason`;
        const fileList = [defaultManifest, ...(project.fileSystem?.maps || []).map(m => `maps/${m.fileName}`), ...(project.fileSystem?.prefabs || []).map(p => `prefabs/${p.fileName}`)];
        return { success: true, syncedLocation: updatedLoc, syncedFiles: fileList };
      } else {
        const saved = await saveProjectToGoogleDrive(project as any, {
          targetFolderId: location.targetFolderId,
          customFileName: location.fileName || `${project.name}.mason`
        });

        const updatedLoc: LinkedStorageLocation = {
          ...location,
          targetId: saved.id,
          fileName: saved.name,
          displayName: `Google Drive (${location.targetFolderName || 'Root'})`,
          lastSyncedAt: new Date().toISOString(),
          etag: saved.modifiedTime
        };

        return { success: true, syncedLocation: updatedLoc, syncedFiles: [saved.name || `${project.name}.mason`] };
      }
    }

    if (location.type === 'onedrive') {
      let token: string | null = null;
      try {
        token = await ensureOneDriveToken();
      } catch {
        token = getOneDriveToken();
      }
      if (!token) {
        return { success: false, error: 'OneDrive is not connected. Please connect via File Manager.' };
      }

      if (location.targetFolderId) {
        await saveModularProjectToOneDrive(project, location.targetFolderId, location.targetFolderName);
        const updatedLoc: LinkedStorageLocation = {
          ...location,
          displayName: `OneDrive Folder (${location.targetFolderName || 'Workspace Folder'})`,
          lastSyncedAt: new Date().toISOString()
        };
        const defaultManifest = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mason`;
        const fileList = [defaultManifest, ...(project.fileSystem?.maps || []).map(m => `maps/${m.fileName}`), ...(project.fileSystem?.prefabs || []).map(p => `prefabs/${p.fileName}`)];
        return { success: true, syncedLocation: updatedLoc, syncedFiles: fileList };
      } else {
        const saved = await saveProjectToOneDrive(project as any, {
          targetFolderId: location.targetFolderId,
          customFileName: location.fileName || `${project.name}.mason`
        });

        const updatedLoc: LinkedStorageLocation = {
          ...location,
          targetId: saved.id,
          fileName: saved.name,
          displayName: `OneDrive (${location.targetFolderName || 'Root'})`,
          lastSyncedAt: new Date().toISOString(),
          etag: saved.modifiedTime
        };

        return { success: true, syncedLocation: updatedLoc, syncedFiles: [saved.name || `${project.name}.mason`] };
      }
    }

    return { success: true, syncedLocation: location };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown save error' };
  }
};

/**
 * Reads a modular project structure from a connected local directory
 */
export const readModularProjectFromDirectory = async (dirHandle: any): Promise<MasonProject> => {
  if (!dirHandle) throw new Error('No directory handle available');

  // 1. Read root project manifest (e.g. mourne_edris.mason or project.mason)
  let manifestFileHandle: any;
  let foundManifestName: string | null = null;
  const expectedManifestName = getProjectMasonFileName(dirHandle.name);

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.mason')) {
        if (entry.name === expectedManifestName) {
          foundManifestName = entry.name;
          break;
        }
        if (!foundManifestName || entry.name === 'project.mason') {
          foundManifestName = entry.name;
        }
      }
    }

    if (foundManifestName) {
      manifestFileHandle = await dirHandle.getFileHandle(foundManifestName);
    } else {
      manifestFileHandle = await dirHandle.getFileHandle('project.mason');
    }
  } catch (e) {
    throw new Error(`No .mason project manifest found in directory "${dirHandle.name}".`);
  }

  const manifestFile = await manifestFileHandle.getFile();
  const manifestText = await manifestFile.text();
  const manifestData = JSON.parse(manifestText);

  // Helper to read all json files from a subdirectory
  const readSubdirFiles = async (subdirName: string): Promise<any[]> => {
    try {
      const subDirHandle = await dirHandle.getDirectoryHandle(subdirName);
      const items: any[] = [];
      for await (const entry of subDirHandle.values()) {
        if (entry.kind === 'file' && !entry.name.startsWith('.')) {
          const f = await entry.getFile();
          const t = await f.text();
          try {
            const parsed = JSON.parse(t);
            if (subdirName === 'particles' && parsed) {
              if (!parsed.particleData && parsed.emitter) {
                items.push({
                  id: parsed.id || entry.name.replace(/\.[^/.]+$/, ''),
                  name: parsed.name || entry.name.replace(/\.[^/.]+$/, ''),
                  fileName: entry.name,
                  createdAt: parsed.createdAt || new Date().toISOString(),
                  updatedAt: parsed.updatedAt || new Date().toISOString(),
                  particleData: parsed
                });
              } else {
                if (!parsed.fileName) parsed.fileName = entry.name;
                items.push(parsed);
              }
            } else {
              items.push(parsed);
            }
          } catch (err) {
            console.warn(`Failed parsing modular file: ${subdirName}/${entry.name}`, err);
          }
        }
      }
      return items;
    } catch (e) {
      return [];
    }
  };

  const maps = await readSubdirFiles('maps');
  const biomes = await readSubdirFiles('biomes');
  const prefabs = await readSubdirFiles('prefabs');
  const ui = await readSubdirFiles('ui');
  const game = await readSubdirFiles('structure');
  const particles = await readSubdirFiles('particles');
  const sprites = await readSubdirFiles('sprites');
  const behaviors = await readSubdirFiles('behaviors');
  const imagesFromImages = await readSubdirFiles('images');
  const imagesFromAssets = await readSubdirFiles('assets');
  const images = imagesFromImages.length > 0 ? imagesFromImages : imagesFromAssets;

  const loadedProject: MasonProject = {
    id: manifestData.id || `proj_${Date.now()}`,
    name: manifestData.name || dirHandle.name || 'Modular Project',
    description: manifestData.description || '',
    author: manifestData.author || '',
    createdAt: manifestData.createdAt || new Date().toISOString(),
    updatedAt: manifestData.updatedAt || new Date().toISOString(),
    engineVersion: manifestData.engineVersion || '0.257',
    activeModule: manifestData.activeModule || 'map_editor',
    activeFiles: manifestData.activeFiles || {
      mapFileName: maps[0]?.fileName || 'main_world.map',
      biomeFileName: biomes[0]?.fileName || 'mourne_steppes.biome',
      prefabFileName: prefabs[0]?.fileName || '',
      uiFileName: ui[0]?.fileName || 'default_ui.ui',
      gameStructureFileName: game[0]?.fileName || 'game_flow.structure',
      particleFileName: particles[0]?.fileName || '',
      spriteFileName: sprites[0]?.fileName || ''
    },
    storageLocation: {
      type: 'local_directory',
      displayName: `Local Folder (${dirHandle.name})`,
      targetFolderName: dirHandle.name,
      targetId: dirHandle.name,
      fileName: getProjectMasonFileName(manifestData.name || dirHandle.name),
      lastSyncedAt: new Date().toISOString(),
      isAutoSyncEnabled: true
    },
    lockInfo: manifestData.lockInfo || {
      isLocked: false,
      lockClientId: CURRENT_CLIENT_SESSION_ID
    },
    taskBoard: manifestData.taskBoard,
    fileSystem: {
      maps,
      biomes,
      prefabs,
      ui,
      game,
      particles,
      sprites,
      behaviors,
      images
    }
  };

  return loadedProject;
};

/**
 * Acquires a collaborative lock on the project (Step 2 Concurrency Control)
 */
export const acquireProjectLock = (project: MasonProject, userName?: string): MasonProject => {
  const profile = getActiveProfile();
  const displayName = userName || profile?.name || 'User';
  return {
    ...project,
    lockInfo: {
      isLocked: true,
      lockedBy: displayName,
      lockedAt: new Date().toISOString(),
      lockClientId: CURRENT_CLIENT_SESSION_ID,
      lockedByProfile: profile ? {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        color: profile.color
      } : undefined
    }
  };
};

export interface StorageAccessVerification {
  available: boolean;
  reason?: string;
  locationType: LinkedLocationType;
  displayName: string;
}

/**
 * Verifies if the linked storage location for a project is currently accessible/reachable.
 * Used on app launch, before saving, before backing up, and periodically in background.
 */
export const verifyLinkedStorageAccess = async (
  project: MasonProject
): Promise<StorageAccessVerification> => {
  const loc = project?.storageLocation;
  if (!loc || loc.type === 'local_idb') {
    return {
      available: true,
      locationType: 'local_idb',
      displayName: 'Browser Workspace (IndexedDB)'
    };
  }

  const displayName = loc.displayName || loc.targetFolderName || loc.fileName || loc.type;

  if (loc.type === 'local_directory') {
    let handle = activeFileSystemDirHandle;
    if (!handle) {
      handle = await getOrRestoreActiveFileSystemDirHandle(project);
    }
    if (!handle) {
      return {
        available: false,
        reason: `Local folder handle for "${displayName}" is missing or expired in current session. Click Re-Connect or re-select folder in File Manager.`,
        locationType: loc.type,
        displayName
      };
    }
    try {
      if (typeof handle.queryPermission === 'function') {
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'denied') {
          return {
            available: false,
            reason: `Permission to access local folder "${handle.name || displayName}" is denied. Re-select folder in File Manager.`,
            locationType: loc.type,
            displayName
          };
        }
      }
      return { available: true, locationType: loc.type, displayName };
    } catch (e: any) {
      return {
        available: false,
        reason: `Local directory unreachable: ${e.message}`,
        locationType: loc.type,
        displayName
      };
    }
  }

  if (loc.type === 'local_file') {
    let handle = activeFileSystemFileHandle;
    if (!handle) {
      handle = await getOrRestoreActiveFileSystemFileHandle(project);
    }
    if (!handle) {
      return {
        available: false,
        reason: `Local file handle for "${displayName}" is missing or expired in current session. Click Re-Connect or re-select file in File Manager.`,
        locationType: loc.type,
        displayName
      };
    }
    try {
      if (typeof handle.queryPermission === 'function') {
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'denied') {
          return {
            available: false,
            reason: `Permission to access local file "${handle.name || displayName}" is denied. Re-select file in File Manager.`,
            locationType: loc.type,
            displayName
          };
        }
      }
      return { available: true, locationType: loc.type, displayName };
    } catch (e: any) {
      return {
        available: false,
        reason: `Local file unreachable: ${e.message}`,
        locationType: loc.type,
        displayName
      };
    }
  }

  if (loc.type === 'gdrive') {
    const token = getGoogleDriveToken();
    if (!token) {
      return {
        available: false,
        reason: `Google Drive is disconnected. Please re-authenticate Google Drive in profile or File Manager.`,
        locationType: loc.type,
        displayName
      };
    }
    try {
      const targetId = loc.targetFolderId || loc.targetId || 'root';
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${targetId}?fields=id,name`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            available: false,
            reason: `Google Drive session has expired. Please re-connect Google Drive in File Manager.`,
            locationType: loc.type,
            displayName
          };
        }
        if (res.status === 404) {
          return {
            available: false,
            reason: `Target Google Drive folder or file (${targetId}) was not found or was deleted.`,
            locationType: loc.type,
            displayName
          };
        }
      }
      return { available: true, locationType: loc.type, displayName };
    } catch (err: any) {
      return {
        available: false,
        reason: `Google Drive network check failed: ${err.message}`,
        locationType: loc.type,
        displayName
      };
    }
  }

  if (loc.type === 'onedrive') {
    let token: string | null = null;
    try {
      token = await ensureOneDriveToken();
    } catch {
      token = getOneDriveToken();
    }
    if (!token) {
      return {
        available: false,
        reason: `OneDrive is disconnected. Please re-authenticate Microsoft OneDrive in profile or File Manager.`,
        locationType: loc.type,
        displayName
      };
    }
    try {
      const targetId = loc.targetFolderId || loc.targetId || 'root';
      const endpoint = targetId === 'root'
        ? 'https://graph.microsoft.com/v1.0/me/drive/root'
        : `https://graph.microsoft.com/v1.0/me/drive/items/${targetId}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            available: false,
            reason: `OneDrive session has expired. Please re-connect OneDrive in File Manager.`,
            locationType: loc.type,
            displayName
          };
        }
        if (res.status === 404) {
          return {
            available: false,
            reason: `Target OneDrive folder or file (${targetId}) was not found or was deleted.`,
            locationType: loc.type,
            displayName
          };
        }
      }
      return { available: true, locationType: loc.type, displayName };
    } catch (err: any) {
      return {
        available: false,
        reason: `OneDrive network check failed: ${err.message}`,
        locationType: loc.type,
        displayName
      };
    }
  }

  return { available: true, locationType: loc.type, displayName };
};

/**
 * Checks if a local directory already contains a valid Mason project
 */
export const checkExistingLocalDirProject = async (dirHandle: any): Promise<MasonProject | null> => {
  if (!dirHandle) return null;
  try {
    const proj = await readModularProjectFromDirectory(dirHandle);
    if (proj && (proj.name || proj.id)) return proj;
  } catch (err) {
    // Directory does not contain a valid .mason project manifest; check if non-empty
    try {
      let count = 0;
      for await (const entry of dirHandle.values()) {
        count++;
        if (count > 0) break;
      }
      if (count > 0) {
        return {
          id: `existing_dir_${Date.now()}`,
          name: dirHandle.name || 'Existing Directory Contents',
          description: 'Non-empty local folder containing existing files',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          engineVersion: '0.270',
          activeModule: 'map_editor',
          author: 'Unknown',
          activeFiles: {},
          fileSystem: {}
        } as unknown as MasonProject;
      }
    } catch {}
  }
  return null;
};

/**
 * Releases a collaborative lock on the project (Step 2 Concurrency Control)
 */
export const releaseProjectLock = (project: MasonProject): MasonProject => {
  return {
    ...project,
    lockInfo: {
      isLocked: false,
      lockedBy: undefined,
      lockedAt: undefined,
      lockClientId: undefined,
      lockedByProfile: undefined
    }
  };
};

export interface FetchLinkedProjectResult {
  success: boolean;
  project?: MasonProject;
  error?: string;
  isRemoteNewer?: boolean;
  remoteModifiedAt?: string;
  filesCount?: number;
  syncedFiles?: string[];
}

/**
 * Fetches/Pulls the full project data from its linked storage location (Google Drive, OneDrive, Local Folder, or Local File)
 * Replaces the local in-memory/IDB project cache with the fresh data from the remote source.
 */
export const fetchProjectFromLinkedLocation = async (
  currentProject: MasonProject
): Promise<FetchLinkedProjectResult> => {
  const loc = currentProject?.storageLocation;
  if (!loc || loc.type === 'local_idb') {
    return {
      success: true,
      project: currentProject,
      isRemoteNewer: false,
      filesCount: (currentProject.fileSystem?.maps?.length || 0) + (currentProject.fileSystem?.particles?.length || 0)
    };
  }

  try {
    let loaded: MasonProject | null = null;

    if (loc.type === 'local_directory') {
      let dirHandle = activeFileSystemDirHandle;
      if (!dirHandle) {
        dirHandle = await getOrRestoreActiveFileSystemDirHandle(currentProject);
      }
      if (!dirHandle) {
        return {
          success: false,
          error: 'No local folder handle available. Please re-open or link the folder via Virtual Files Explorer.'
        };
      }
      if (typeof dirHandle.queryPermission === 'function') {
        const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted' && typeof dirHandle.requestPermission === 'function') {
          const req = await dirHandle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') {
            return {
              success: false,
              error: `Permission to access local folder "${dirHandle.name}" was not granted.`
            };
          }
        }
      }
      loaded = await readModularProjectFromDirectory(dirHandle);
    } else if (loc.type === 'gdrive') {
      const token = getGoogleDriveToken();
      if (!token) {
        return {
          success: false,
          error: 'Google Drive is not connected. Please connect via File Manager.'
        };
      }
      if (loc.targetFolderId) {
        loaded = await readModularProjectFromGoogleDrive(loc.targetFolderId, loc.targetFolderName || currentProject.name);
      } else if (loc.targetId) {
        const text = await downloadFileAsTextFromGoogleDrive(loc.targetId);
        loaded = JSON.parse(text);
      } else {
        return {
          success: false,
          error: 'Missing Google Drive target folder or file ID.'
        };
      }
    } else if (loc.type === 'onedrive') {
      const token = await ensureOneDriveToken();
      if (!token) {
        return {
          success: false,
          error: 'OneDrive is not connected. Please connect via File Manager.'
        };
      }
      if (loc.targetFolderId) {
        loaded = await readModularProjectFromOneDrive(loc.targetFolderId, loc.targetFolderName || currentProject.name);
      } else if (loc.targetId) {
        const text = await downloadFileAsTextFromOneDrive({ id: loc.targetId });
        loaded = JSON.parse(text);
      } else {
        return {
          success: false,
          error: 'Missing OneDrive target folder or file ID.'
        };
      }
    } else if (loc.type === 'local_file') {
      let fileHandle = activeFileSystemFileHandle;
      if (!fileHandle) {
        fileHandle = await getOrRestoreActiveFileSystemFileHandle(currentProject);
      }
      if (!fileHandle) {
        return {
          success: false,
          error: 'No local file handle available. Please re-select the file.'
        };
      }
      const file = await fileHandle.getFile();
      const text = await file.text();
      loaded = JSON.parse(text);
    }

    if (!loaded) {
      return {
        success: false,
        error: 'Failed to read project from linked location.'
      };
    }

    // Preserve and update storageLocation metadata with the current sync time
    loaded.storageLocation = {
      displayName: loc.displayName || 'Linked Storage',
      ...(loc || {}),
      ...(loaded.storageLocation || {}),
      type: loc.type,
      lastSyncedAt: new Date().toISOString()
    };

    const defaultManifest = `${(loaded.name || 'project').toLowerCase().replace(/[^a-z0-9]/g, '_')}.mason`;
    const syncedFilesList: string[] = [
      defaultManifest,
      ...(loaded.fileSystem?.maps || []).map(m => `maps/${m.fileName}`),
      ...(loaded.fileSystem?.biomes || []).map(b => `biomes/${b.fileName}`),
      ...(loaded.fileSystem?.prefabs || []).map(p => `prefabs/${p.fileName}`),
      ...(loaded.fileSystem?.particles || []).map(pt => `particles/${pt.fileName}`),
      ...(loaded.fileSystem?.sprites || []).map(s => `sprites/${s.fileName}`),
      ...(loaded.fileSystem?.ui || []).map(u => `ui/${u.fileName}`),
      ...(loaded.fileSystem?.game || []).map(g => `game/${g.fileName}`)
    ];

    const remoteUpdatedAt = loaded.updatedAt;
    const localUpdatedAt = currentProject.updatedAt;
    const isRemoteNewer = remoteUpdatedAt && localUpdatedAt 
      ? (new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime()) 
      : false;

    return {
      success: true,
      project: loaded,
      isRemoteNewer,
      remoteModifiedAt: remoteUpdatedAt,
      filesCount: syncedFilesList.length,
      syncedFiles: syncedFilesList
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to refresh project from linked storage.'
    };
  }
};

export interface RemoteSyncStatusResult {
  isAvailable: boolean;
  isOutOfSync: boolean;
  remoteModifiedAt?: string;
  localModifiedAt?: string;
  remoteLockInfo?: FileLockInfo;
  remoteIsLockedByOther?: boolean;
  reason?: string;
}

/**
 * Lightweight check (like a Git fetch check) to see if the remote linked folder
 * has newer updates or is currently locked by another client/user session.
 */
export const checkRemoteSyncStatus = async (
  currentProject: MasonProject
): Promise<RemoteSyncStatusResult> => {
  const loc = currentProject?.storageLocation;
  if (!loc || loc.type === 'local_idb') {
    return {
      isAvailable: true,
      isOutOfSync: false
    };
  }

  try {
    if (loc.type === 'gdrive') {
      const token = getGoogleDriveToken();
      if (!token) return { isAvailable: false, isOutOfSync: false, reason: 'Google Drive not connected' };
      
      const parentFolderId = loc.targetFolderId || 'root';
      const rootItems = await listGoogleDriveFolderContents(parentFolderId);
      const expectedName = getProjectMasonFileName(loc.targetFolderName || currentProject.name);
      const manifestItem = rootItems.find(item => !item.isFolder && (item.name === expectedName || item.name.endsWith('.mason') || item.name === 'project.mason'));
      if (!manifestItem) return { isAvailable: true, isOutOfSync: false };

      const manifestText = await downloadFileAsTextFromGoogleDrive(manifestItem.id);
      const manifest = JSON.parse(manifestText);
      const remoteUpdatedAt = manifest.updatedAt || manifestItem.modifiedTime;
      const localUpdatedAt = currentProject.updatedAt;

      const remoteTime = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : 0;
      const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
      const isOutOfSync = remoteTime > localTime + 1000;

      const remoteLockInfo = manifest.lockInfo;
      const remoteIsLockedByOther = Boolean(
        remoteLockInfo?.isLocked && 
        remoteLockInfo.lockClientId && 
        remoteLockInfo.lockClientId !== CURRENT_CLIENT_SESSION_ID
      );

      return {
        isAvailable: true,
        isOutOfSync: isOutOfSync || remoteIsLockedByOther,
        remoteModifiedAt: remoteUpdatedAt,
        localModifiedAt: localUpdatedAt,
        remoteLockInfo,
        remoteIsLockedByOther
      };
    }

    if (loc.type === 'onedrive') {
      let token = getOneDriveToken();
      if (!token) {
        try {
          token = await ensureOneDriveToken();
        } catch {
          return { isAvailable: false, isOutOfSync: false, reason: 'OneDrive not connected' };
        }
      }
      if (!token) return { isAvailable: false, isOutOfSync: false, reason: 'OneDrive not connected' };

      const parentFolderId = loc.targetFolderId || 'root';
      const rootItems = await listOneDriveFolderContents(parentFolderId);
      const expectedName = getProjectMasonFileName(loc.targetFolderName || currentProject.name);
      const manifestItem = rootItems.find(item => !item.isFolder && (item.name === expectedName || item.name.endsWith('.mason') || item.name === 'project.mason'));
      if (!manifestItem) return { isAvailable: true, isOutOfSync: false };

      const manifestText = await downloadFileAsTextFromOneDrive(manifestItem);
      const manifest = JSON.parse(manifestText);
      const remoteUpdatedAt = manifest.updatedAt || manifestItem.modifiedTime;
      const localUpdatedAt = currentProject.updatedAt;

      const remoteTime = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : 0;
      const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
      const isOutOfSync = remoteTime > localTime + 1000;

      const remoteLockInfo = manifest.lockInfo;
      const remoteIsLockedByOther = Boolean(
        remoteLockInfo?.isLocked && 
        remoteLockInfo.lockClientId && 
        remoteLockInfo.lockClientId !== CURRENT_CLIENT_SESSION_ID
      );

      return {
        isAvailable: true,
        isOutOfSync: isOutOfSync || remoteIsLockedByOther,
        remoteModifiedAt: remoteUpdatedAt,
        localModifiedAt: localUpdatedAt,
        remoteLockInfo,
        remoteIsLockedByOther
      };
    }

    if (loc.type === 'local_directory') {
      const dirHandle = await getOrRestoreActiveFileSystemDirHandle(currentProject);
      if (!dirHandle) return { isAvailable: false, isOutOfSync: false };
      if (typeof dirHandle.queryPermission === 'function') {
        const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') return { isAvailable: false, isOutOfSync: false };
      }
      const manifestFileName = getProjectMasonFileName(currentProject.name);
      try {
        const fileHandle = await dirHandle.getFileHandle(manifestFileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        const manifest = JSON.parse(text);
        const remoteUpdatedAt = manifest.updatedAt;
        const localUpdatedAt = currentProject.updatedAt;
        const remoteTime = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : 0;
        const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
        const isOutOfSync = remoteTime > localTime + 1000;

        const remoteLockInfo = manifest.lockInfo;
        const remoteIsLockedByOther = Boolean(
          remoteLockInfo?.isLocked && 
          remoteLockInfo.lockClientId && 
          remoteLockInfo.lockClientId !== CURRENT_CLIENT_SESSION_ID
        );

        return {
          isAvailable: true,
          isOutOfSync: isOutOfSync || remoteIsLockedByOther,
          remoteModifiedAt: remoteUpdatedAt,
          localModifiedAt: localUpdatedAt,
          remoteLockInfo,
          remoteIsLockedByOther
        };
      } catch {
        return { isAvailable: true, isOutOfSync: false };
      }
    }

    return { isAvailable: true, isOutOfSync: false };
  } catch (err: any) {
    return { isAvailable: false, isOutOfSync: false, reason: err.message };
  }
};

