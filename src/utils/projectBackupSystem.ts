/**
 * Automated Project File Backup System
 * - Automatically backs up active projects at a configurable interval (3 to 60 minutes, default 10 minutes).
 * - Saves backups to local storage / IndexedDB and to a 'backups' sub-folder in Cloud Drive (Google Drive / OneDrive).
 * - Retains the last N backups (1 to 50 backups, default 10 backups) using FIFO rotation.
 */

import { MasonProject } from '../engine/masonProjectSchema';
import { 
  ProjectBackupRecord, 
  saveProjectBackup, 
  getProjectBackups, 
  restoreProjectBackup as idbRestoreBackup, 
  deleteProjectBackup as idbDeleteBackup,
  downloadJsonFile
} from './masonStorage';
import { 
  getGoogleDriveToken, 
  getGoogleDriveSelectedFolder, 
  listGoogleDriveFolderContents, 
  createGoogleDriveFolder, 
  saveProjectToGoogleDrive, 
  deleteGoogleDriveFile,
  loadProjectFromGoogleDrive
} from './googleDriveStorage';
import { 
  getOneDriveToken, ensureOneDriveToken, 
  getOneDriveSelectedFolder, 
  listOneDriveFolderContents, 
  createOneDriveFolder, 
  saveProjectToOneDrive, 
  deleteOneDriveFile,
  loadProjectFromOneDrive,
  getActiveCloudProvider 
} from './oneDriveStorage';
import { ProjectData } from './projectStorage';

export interface BackupSettings {
  retentionCount: number; // 1 to 50, default 10
  intervalMinutes: number; // 3 to 60, default 10
  lastBackupTime: string | null;
  lastBackupStatus?: string | null;
}

export interface BackupFileItem {
  id: string;
  name: string;
  modifiedTime: string;
  size?: number | string;
  provider: 'gdrive' | 'onedrive' | 'local';
  downloadUrl?: string;
  folderId?: string | null;
}

const BACKUP_SETTINGS_KEY = 'mason_backup_system_settings';

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  retentionCount: 10,
  intervalMinutes: 10,
  lastBackupTime: null,
  lastBackupStatus: null
};

export const getBackupSettings = (): BackupSettings => {
  try {
    const raw = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_BACKUP_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      retentionCount: Math.min(50, Math.max(1, typeof parsed.retentionCount === 'number' ? parsed.retentionCount : 10)),
      intervalMinutes: Math.min(60, Math.max(3, typeof parsed.intervalMinutes === 'number' ? parsed.intervalMinutes : 10)),
      lastBackupTime: parsed.lastBackupTime || null,
      lastBackupStatus: parsed.lastBackupStatus || null
    };
  } catch {
    return { ...DEFAULT_BACKUP_SETTINGS };
  }
};

export const saveBackupSettings = (newSettings: Partial<BackupSettings>): BackupSettings => {
  const current = getBackupSettings();
  const updated: BackupSettings = {
    retentionCount: Math.min(50, Math.max(1, newSettings.retentionCount !== undefined ? newSettings.retentionCount : current.retentionCount)),
    intervalMinutes: Math.min(60, Math.max(3, newSettings.intervalMinutes !== undefined ? newSettings.intervalMinutes : current.intervalMinutes)),
    lastBackupTime: newSettings.lastBackupTime !== undefined ? newSettings.lastBackupTime : current.lastBackupTime,
    lastBackupStatus: newSettings.lastBackupStatus !== undefined ? newSettings.lastBackupStatus : current.lastBackupStatus
  };
  localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

/**
 * Lists all backup files directly from the actual 'backups/' directory in the active Cloud Drive,
 * or falls back to local storage if no cloud drive is active.
 */
export async function fetchBackupFilesFromFolder(
  providerOverride?: 'gdrive' | 'onedrive',
  projectId?: string
): Promise<{ items: BackupFileItem[]; locationName: string; isCloud: boolean }> {
  const provider = providerOverride || getActiveCloudProvider();

  if (provider === 'gdrive' && getGoogleDriveToken()) {
    try {
      const selectedFolder = getGoogleDriveSelectedFolder();
      const parentId = selectedFolder.id || 'root';
      const contents = await listGoogleDriveFolderContents(parentId);
      let backupFolder = contents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));

      if (!backupFolder && parentId !== 'root') {
        // Also check root drive for backups folder
        const rootContents = await listGoogleDriveFolderContents('root');
        backupFolder = rootContents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));
      }

      if (backupFolder && backupFolder.id) {
        const backupContents = await listGoogleDriveFolderContents(backupFolder.id);
        const files: BackupFileItem[] = backupContents
          .filter(i => !i.isFolder && (i.name.endsWith('.mason') || i.name.endsWith('.json')))
          .map(i => ({
            id: i.id,
            name: i.name,
            modifiedTime: i.modifiedTime,
            size: i.size,
            provider: 'gdrive' as const,
            folderId: backupFolder.id
          }))
          .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

        return {
          items: files,
          locationName: `Google Drive: ${selectedFolder.name}/backups`,
          isCloud: true
        };
      }

      return {
        items: [],
        locationName: `Google Drive: ${selectedFolder.name}/backups (Empty/Created upon next backup)`,
        isCloud: true
      };
    } catch (err) {
      console.warn('Error fetching backups from Google Drive:', err);
    }
  }

  if (provider === 'onedrive' && getOneDriveToken()) {
    try {
      const selectedFolder = getOneDriveSelectedFolder();
      const parentId = selectedFolder.id || 'root';
      const contents = await listOneDriveFolderContents(parentId);
      let backupFolder = contents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));

      if (!backupFolder && parentId !== 'root') {
        const rootContents = await listOneDriveFolderContents('root');
        backupFolder = rootContents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));
      }

      if (backupFolder && backupFolder.id) {
        const backupContents = await listOneDriveFolderContents(backupFolder.id);
        const files: BackupFileItem[] = backupContents
          .filter(i => !i.isFolder && (i.name.endsWith('.mason') || i.name.endsWith('.json')))
          .map(i => ({
            id: i.id,
            name: i.name,
            modifiedTime: i.modifiedTime,
            size: i.size,
            provider: 'onedrive' as const,
            downloadUrl: i.downloadUrl,
            folderId: backupFolder.id
          }))
          .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

        return {
          items: files,
          locationName: `OneDrive: ${selectedFolder.name}/backups`,
          isCloud: true
        };
      }

      return {
        items: [],
        locationName: `OneDrive: ${selectedFolder.name}/backups (Empty/Created upon next backup)`,
        isCloud: true
      };
    } catch (err) {
      console.warn('Error fetching backups from OneDrive:', err);
    }
  }

  // Fallback: Local IndexedDB records if offline
  if (projectId) {
    const localRecords = await getProjectBackups(projectId);
    const files: BackupFileItem[] = localRecords.map(r => ({
      id: r.id,
      name: `${(r.projectSnapshot?.name || 'project').replace(/[/\\?%*:|"<>]/g, '_')}_backup_${new Date(r.timestamp).toISOString().replace(/[:.]/g, '-')}.mason`,
      modifiedTime: r.timestamp,
      provider: 'local' as const
    })).sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

    return {
      items: files,
      locationName: 'Local Browser Storage (IndexedDB)',
      isCloud: false
    };
  }

  return {
    items: [],
    locationName: 'No connected cloud drive or local backups',
    isCloud: false
  };
}

/**
 * Restores a project from a backup item
 */
export async function restoreBackupFile(item: BackupFileItem): Promise<(ProjectData & { fullMasonProject?: any }) | null> {
  if (item.provider === 'gdrive') {
    return await loadProjectFromGoogleDrive(item.id);
  }
  if (item.provider === 'onedrive') {
    return await loadProjectFromOneDrive(item as any);
  }
  if (item.provider === 'local') {
    const restored = await idbRestoreBackup(item.id);
    if (!restored) return null;
    return {
      id: restored.id,
      name: restored.name,
      description: restored.description,
      engine_version: restored.engineVersion || '2.0.0',
      tile_size_px: 64,
      createdAt: restored.createdAt,
      updatedAt: restored.updatedAt,
      map: (restored.fileSystem.maps?.[0]?.data || {
        width: restored.fileSystem.maps?.[0]?.width || 24,
        height: restored.fileSystem.maps?.[0]?.height || 24,
        chunks: restored.fileSystem.maps?.[0]?.chunks || {},
        cells: restored.fileSystem.maps?.[0]?.cells || []
      }) as any,
      biomes: restored.fileSystem.biomes?.map(b => b.biomeData) || [],
      activeBiomeId: restored.fileSystem.biomes?.[0]?.id || 'mourne_ashen_steppes',
      fullMasonProject: restored
    };
  }
  return null;
}

/**
 * Deletes a backup file from the cloud backups folder or local storage
 */
export async function deleteBackupFile(item: BackupFileItem): Promise<boolean> {
  if (item.provider === 'gdrive') {
    return await deleteGoogleDriveFile(item.id);
  }
  if (item.provider === 'onedrive') {
    return await deleteOneDriveFile(item.id);
  }
  if (item.provider === 'local') {
    await idbDeleteBackup(item.id);
    return true;
  }
  return false;
}

/**
 * Downloads a backup file directly to the client
 */
export async function downloadBackupFileToClient(item: BackupFileItem): Promise<void> {
  if (item.provider === 'gdrive') {
    const token = getGoogleDriveToken();
    if (!token) throw new Error('Not connected to Google Drive.');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to download file from Google Drive.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  if (item.provider === 'onedrive') {
    if (item.downloadUrl) {
      const a = document.createElement('a');
      a.href = item.downloadUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const token = await ensureOneDriveToken();
    if (!token) throw new Error('Not connected to Microsoft OneDrive.');
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to download file from OneDrive.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  if (item.provider === 'local') {
    const record = await idbRestoreBackup(item.id);
    if (record) {
      downloadJsonFile(item.name, record);
    }
  }
}

/**
 * Triggers an automated or manual backup of the given Mason project.
 * Enforces retention limits (default 10, 1-50) and syncs to 'backups' sub-folder on connected cloud drives.
 */
export async function executeProjectBackup(
  project: MasonProject, 
  reason: string = 'Automated Periodic Backup'
): Promise<{ record: ProjectBackupRecord | null; cloudBackupSaved: boolean; totalKept: number }> {
  if (!project || !project.id) {
    return { record: null, cloudBackupSaved: false, totalKept: 0 };
  }

  const settings = getBackupSettings();
  const now = new Date().toISOString();

  // 1. Create local snapshot in IndexedDB / cache
  const record = await saveProjectBackup(project, reason, project.activeModule);

  // 2. Enforce local retention pruning (keep latest N)
  let allLocalBackups = await getProjectBackups(project.id);
  allLocalBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (allLocalBackups.length > settings.retentionCount) {
    const toPrune = allLocalBackups.slice(settings.retentionCount);
    for (const oldBk of toPrune) {
      await idbDeleteBackup(oldBk.id);
    }
  }

  let cloudBackupSaved = false;
  const safeName = (project.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const timeCode = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${safeName}_backup_${timeCode}.mason`;

  // 3. If Cloud Drive is active, save to the 'backups' sub-folder
  const activeProvider = getActiveCloudProvider();
  
  if (activeProvider === 'gdrive' && getGoogleDriveToken()) {
    try {
      const selectedFolder = getGoogleDriveSelectedFolder();
      const parentId = selectedFolder.id || 'root';

      // Find or create 'backups' sub-folder
      const contents = await listGoogleDriveFolderContents(parentId);
      let backupFolder = contents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));
      
      if (!backupFolder) {
        backupFolder = await createGoogleDriveFolder('backups', parentId);
      }

      if (backupFolder && backupFolder.id) {
        // Convert to ProjectData format for cloud saver
        const projectDataFormat: any = {
          id: project.id,
          name: project.name,
          description: project.description,
          engine_version: project.engineVersion || '2.0.0',
          tile_size_px: 64,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          map: project.fileSystem?.maps?.[0]?.data || { width: 24, height: 24, cells: [] },
          biomes: project.fileSystem?.biomes?.map(b => b.biomeData) || [],
          activeBiomeId: project.fileSystem?.biomes?.[0]?.id || 'mourne_ashen_steppes',
          fullMasonProject: project
        };

        await saveProjectToGoogleDrive(projectDataFormat, {
          isBackup: true,
          customFileName: backupFileName,
          targetFolderId: backupFolder.id,
          targetFolderName: 'backups'
        });
        cloudBackupSaved = true;

        // Prune older backups in Google Drive 'backups' folder
        const backupItems = await listGoogleDriveFolderContents(backupFolder.id);
        const projectBackups = backupItems
          .filter(i => !i.isFolder && i.name.startsWith(safeName) && i.name.endsWith('.mason'))
          .sort((a, b) => new Date(b.modifiedTime || 0).getTime() - new Date(a.modifiedTime || 0).getTime());

        if (projectBackups.length > settings.retentionCount) {
          const cloudToPrune = projectBackups.slice(settings.retentionCount);
          for (const item of cloudToPrune) {
            await deleteGoogleDriveFile(item.id).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('[Backup System] Google Drive sub-folder backup warning:', err);
    }
  } else if (activeProvider === 'onedrive' && getOneDriveToken()) {
    try {
      const selectedFolder = getOneDriveSelectedFolder();
      const parentId = selectedFolder.id || 'root';

      // Find or create 'backups' sub-folder
      const contents = await listOneDriveFolderContents(parentId);
      let backupFolder = contents.find(i => i.isFolder && (i.name.toLowerCase() === 'backups' || i.name.toLowerCase() === 'mason backups'));

      if (!backupFolder) {
        backupFolder = await createOneDriveFolder('backups', parentId);
      }

      if (backupFolder && backupFolder.id) {
        const projectDataFormat: any = {
          id: project.id,
          name: project.name,
          description: project.description,
          engine_version: project.engineVersion || '2.0.0',
          tile_size_px: 64,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          map: project.fileSystem?.maps?.[0]?.data || { width: 24, height: 24, cells: [] },
          biomes: project.fileSystem?.biomes?.map(b => b.biomeData) || [],
          activeBiomeId: project.fileSystem?.biomes?.[0]?.id || 'mourne_ashen_steppes',
          fullMasonProject: project
        };

        await saveProjectToOneDrive(projectDataFormat, {
          isBackup: true,
          customFileName: backupFileName,
          targetFolderId: backupFolder.id,
          targetFolderName: 'backups'
        });
        cloudBackupSaved = true;

        // Prune older backups in OneDrive 'backups' folder
        const backupItems = await listOneDriveFolderContents(backupFolder.id);
        const projectBackups = backupItems
          .filter(i => !i.isFolder && i.name.startsWith(safeName) && i.name.endsWith('.mason'))
          .sort((a, b) => new Date(b.modifiedTime || 0).getTime() - new Date(a.modifiedTime || 0).getTime());

        if (projectBackups.length > settings.retentionCount) {
          const cloudToPrune = projectBackups.slice(settings.retentionCount);
          for (const item of cloudToPrune) {
            await deleteOneDriveFile(item.id).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('[Backup System] OneDrive sub-folder backup warning:', err);
    }
  }

  // Update last backup timestamp
  saveBackupSettings({
    lastBackupTime: now,
    lastBackupStatus: `Backup saved (${cloudBackupSaved ? 'Cloud backups/ folder' : 'Local storage'})`
  });

  const finalCount = Math.min(allLocalBackups.length + 1, settings.retentionCount);
  return { record, cloudBackupSaved, totalKept: finalCount };
}

/**
 * Downloads a backup snapshot as a standard .mason project file
 */
export const downloadBackupSnapshot = (backup: ProjectBackupRecord) => {
  if (!backup || !backup.projectSnapshot) return;
  const safeName = (backup.projectSnapshot.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const timeCode = new Date(backup.timestamp).toISOString().replace(/[:.]/g, '-');
  downloadJsonFile(`${safeName}_backup_${timeCode}.mason`, backup.projectSnapshot);
};

export { idbRestoreBackup as restoreBackupSnapshot, idbDeleteBackup as deleteBackupSnapshot };

