import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  Upload, 
  Download, 
  X, 
  ShieldCheck, 
  FileCode, 
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Trash2,
  FileCheck,
  Sparkles,
  Layers,
  Clock,
  Compass,
  Check,
  ExternalLink,
  FolderTree,
  LogOut,
  History,
  Settings
} from 'lucide-react';
import { ProjectData } from '../utils/projectStorage';
import { 
  getGoogleDriveToken, 
  getGoogleDriveUser, 
  authenticateGoogleDrive, 
  disconnectGoogleDrive, 
  saveProjectToGoogleDrive, 
  loadProjectFromGoogleDrive, 
  DriveItem,
  listGoogleDriveFolderContents,
  listAllGoogleDriveFolders,
  openGoogleDrivePicker,
  createGoogleDriveFolder,
  getGoogleDriveSelectedFolder,
  setGoogleDriveSelectedFolder,
  deleteGoogleDriveFile
} from '../utils/googleDriveStorage';
import { 
  getOneDriveToken, 
  getOneDriveUser, 
  authenticateOneDrive, 
  disconnectOneDrive, 
  saveProjectToOneDrive, 
  loadProjectFromOneDrive, 
  OneDriveItem,
  listOneDriveFolderContents,
  createOneDriveFolder,
  getOneDriveSelectedFolder,
  setOneDriveSelectedFolder,
  getActiveCloudProvider,
  setActiveCloudProvider,
  getOneDriveTenant,
  setOneDriveTenant,
  getOneDriveClientId,
  setOneDriveClientId,
  CloudProvider,
  deleteOneDriveFile
} from '../utils/oneDriveStorage';
import {
  getBackupSettings,
  saveBackupSettings,
  executeProjectBackup,
  fetchBackupFilesFromFolder,
  deleteBackupFile,
  restoreBackupFile,
  downloadBackupFileToClient,
  BackupSettings,
  BackupFileItem
} from '../utils/projectBackupSystem';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: (ProjectData & { fullMasonProject?: any }) | null;
  onLoadProject: (project: ProjectData) => void;
  initialMode?: 'explore' | 'backups';
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  initialMode = 'explore',
  onShowToast
}) => {
  const isProjectLoaded = Boolean(currentProject && currentProject.id && currentProject.id !== 'temp_proj');
  const [activeProvider, setActiveProviderState] = useState<CloudProvider>('gdrive');
  const [activeTab, setActiveTab] = useState<'explore' | 'backups'>('explore');
  const [explorerViewMode, setExplorerViewMode] = useState<'subfolders' | 'all_folders'>('subfolders');

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Backup System State
  const [backupSettings, setBackupSettingsState] = useState<BackupSettings>(getBackupSettings());
  const [backupsList, setBackupsList] = useState<BackupFileItem[]>([]);
  const [backupsLocationName, setBackupsLocationName] = useState<string>('');
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [executingBackup, setExecutingBackup] = useState(false);

  // Google Drive State
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveStatusMsg, setGdriveStatusMsg] = useState<string | null>(null);
  const [gdriveCurrentFolder, setGdriveCurrentFolder] = useState<FolderBreadcrumb>({ id: null, name: 'My Drive (Root)' });
  const [gdriveSelectedTarget, setGdriveSelectedTarget] = useState<FolderBreadcrumb>({ id: null, name: 'My Drive (Root)' });
  const [gdriveFolderItems, setGdriveFolderItems] = useState<DriveItem[]>([]);
  const [gdriveAllFolders, setGdriveAllFolders] = useState<DriveItem[]>([]);
  const [gdrivePathStack, setGdrivePathStack] = useState<FolderBreadcrumb[]>([{ id: null, name: 'My Drive (Root)' }]);

  // OneDrive State
  const [onedriveToken, setOnedriveToken] = useState<string | null>(null);
  const [onedriveUser, setOnedriveUser] = useState<any>(null);
  const [onedriveStatusMsg, setOnedriveStatusMsg] = useState<string | null>(null);
  const [onedriveCurrentFolder, setOnedriveCurrentFolder] = useState<FolderBreadcrumb>({ id: null, name: 'OneDrive Root (My Files)' });
  const [onedriveSelectedTarget, setOnedriveSelectedTarget] = useState<FolderBreadcrumb>({ id: null, name: 'OneDrive Root (My Files)' });
  const [onedriveFolderItems, setOnedriveFolderItems] = useState<OneDriveItem[]>([]);
  const [onedrivePathStack, setOnedrivePathStack] = useState<FolderBreadcrumb[]>([{ id: null, name: 'OneDrive Root (My Files)' }]);

  // Folder creation & loading
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Custom Save Dialog State (in Explorer tab)
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [customSaveFileName, setCustomSaveFileName] = useState('');
  const [isBackupSave, setIsBackupSave] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // In-Modal Confirmation State for Deletion & Restoration
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    name: string;
    type: 'gdrive' | 'onedrive' | 'backup';
    backupItem?: BackupFileItem;
  } | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  const [restoreConfirmTarget, setRestoreConfirmTarget] = useState<BackupFileItem | null>(null);
  const [restoringInProgress, setRestoringInProgress] = useState(false);

  // Scroll Container Refs
  const modalBodyRef = React.useRef<HTMLDivElement>(null);
  const itemsListRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (itemsListRef.current) {
      itemsListRef.current.scrollTop = 0;
    }
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetchBackupFilesFromFolder(activeProvider, currentProject?.id);
      setBackupsList(res.items);
      setBackupsLocationName(res.locationName);
    } catch (err) {
      console.warn('Could not load project backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const prevIsOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen) {
      setActiveProviderState(getActiveCloudProvider());
      if (!prevIsOpenRef.current) {
        setActiveTab(initialMode);
      }
      if (isProjectLoaded && currentProject) {
        const cleanProjectName = (currentProject.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
        setCustomSaveFileName(`${cleanProjectName}.mason`);
      } else {
        setCustomSaveFileName('');
      }
      refreshCloudState();
      setBackupSettingsState(getBackupSettings());
      loadBackups();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialMode]);

  const handleUpdateBackupSettings = (updates: Partial<BackupSettings>) => {
    const updated = saveBackupSettings(updates);
    setBackupSettingsState(updated);
    onShowToast?.(`Backup settings saved: every ${updated.intervalMinutes}m, keep ${updated.retentionCount}`, 'success');
  };

  const handleTriggerManualBackup = async () => {
    if (!isProjectLoaded || !currentProject) {
      onShowToast?.('No project is open to back up. Please create or load a project first.', 'warning');
      return;
    }
    setExecutingBackup(true);
    try {
      const projToBackup = currentProject.fullMasonProject || {
        id: currentProject.id,
        name: currentProject.name,
        description: currentProject.description,
        engineVersion: currentProject.engine_version || '2.0.0',
        activeModule: 'general',
        fileSystem: {
          maps: [{
            id: 'map_1',
            fileName: 'main_world.map',
            width: currentProject.map?.width || 24,
            height: currentProject.map?.height || 24,
            cells: currentProject.map?.cells || [],
            data: currentProject.map || {}
          }],
          biomes: (currentProject.biomes || []).map((b: any, idx: number) => ({
            id: b.id || `biome_${idx}`,
            fileName: `${b.name || 'biome'}.biome`,
            biomeData: b
          })),
          prefabs: [],
          sprites: [],
          images: [],
          behaviors: [],
          audio: [],
          docs: [],
          particles: []
        },
        createdAt: currentProject.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await executeProjectBackup(projToBackup as any, 'Manual Backup Snapshot');
      await loadBackups();
      setBackupSettingsState(getBackupSettings());
      onShowToast?.(`Backup snapshot created (${res.totalKept} backups retained)`, 'success');
    } catch (err: any) {
      onShowToast?.(`Backup failed: ${err.message}`, 'error');
    } finally {
      setExecutingBackup(false);
    }
  };

  const handleRestoreBackupRecord = (item: BackupFileItem) => {
    setRestoreConfirmTarget(item);
  };

  const handleDeleteBackupRecord = (item: BackupFileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmTarget({
      id: item.id,
      name: item.name,
      type: 'backup',
      backupItem: item
    });
  };

  const executeConfirmedDelete = async () => {
    if (!deleteConfirmTarget) return;
    setDeletingInProgress(true);
    try {
      if (deleteConfirmTarget.type === 'gdrive') {
        await deleteGoogleDriveFile(deleteConfirmTarget.id);
        setGdriveStatusMsg(`Deleted "${deleteConfirmTarget.name}" from Google Drive.`);
        onShowToast?.(`Deleted "${deleteConfirmTarget.name}" from Google Drive`, 'info');
        await fetchGDriveFolder(gdriveCurrentFolder.id);
      } else if (deleteConfirmTarget.type === 'onedrive') {
        await deleteOneDriveFile(deleteConfirmTarget.id);
        setOnedriveStatusMsg(`Deleted "${deleteConfirmTarget.name}" from OneDrive.`);
        onShowToast?.(`Deleted "${deleteConfirmTarget.name}" from OneDrive`, 'info');
        await fetchOneDriveFolder(onedriveCurrentFolder.id);
      } else if (deleteConfirmTarget.type === 'backup' && deleteConfirmTarget.backupItem) {
        await deleteBackupFile(deleteConfirmTarget.backupItem);
        await loadBackups();
        onShowToast?.(`Deleted backup snapshot "${deleteConfirmTarget.name}"`, 'info');
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Delete operation failed';
      if (deleteConfirmTarget.type === 'gdrive') setGdriveStatusMsg(`Delete failed: ${errorMsg}`);
      if (deleteConfirmTarget.type === 'onedrive') setOnedriveStatusMsg(`Delete failed: ${errorMsg}`);
      onShowToast?.(`Delete failed: ${errorMsg}`, 'error');
    } finally {
      setDeletingInProgress(false);
    }
  };

  const executeConfirmedRestore = async () => {
    if (!restoreConfirmTarget) return;
    setRestoringInProgress(true);
    try {
      const restored = await restoreBackupFile(restoreConfirmTarget);
      if (restored) {
        onLoadProject(restored);
        onShowToast?.(`Restored project from backup "${restoreConfirmTarget.name}"!`, 'success');
        setRestoreConfirmTarget(null);
        onClose();
      }
    } catch (err: any) {
      onShowToast?.(`Restore failed: ${err.message}`, 'error');
    } finally {
      setRestoringInProgress(false);
    }
  };

  const handleDownloadBackupRecord = async (item: BackupFileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await downloadBackupFileToClient(item);
      onShowToast?.(`Downloaded backup "${item.name}"`, 'info');
    } catch (err: any) {
      onShowToast?.(`Download failed: ${err.message}`, 'error');
    }
  };

  const handleSwitchProvider = (provider: CloudProvider) => {
    setActiveProviderState(provider);
    setActiveCloudProvider(provider);
    setSearchQuery('');
    setSaveSuccessMsg(null);
  };

  const refreshCloudState = async () => {
    // Refresh Google Drive
    const gToken = getGoogleDriveToken();
    setGdriveToken(gToken);
    setGdriveUser(getGoogleDriveUser());
    const gSelected = getGoogleDriveSelectedFolder();
    setGdriveSelectedTarget(gSelected);

    if (gToken) {
      fetchGDriveFolder(gdriveCurrentFolder.id);
    }

    // Refresh OneDrive
    const oToken = getOneDriveToken();
    setOnedriveToken(oToken);
    setOnedriveUser(getOneDriveUser());
    const oSelected = getOneDriveSelectedFolder();
    setOnedriveSelectedTarget(oSelected);

    if (oToken) {
      fetchOneDriveFolder(onedriveCurrentFolder.id);
    }
  };

  const fetchGDriveFolder = async (folderId: string | null) => {
    setLoading(true);
    setGdriveStatusMsg(null);
    try {
      const items = await listGoogleDriveFolderContents(folderId);
      setGdriveFolderItems(items);
    } catch (e: any) {
      setGdriveStatusMsg(`Folder list error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGDriveFolders = async () => {
    setLoading(true);
    try {
      const folders = await listAllGoogleDriveFolders();
      setGdriveAllFolders(folders);
      setExplorerViewMode('all_folders');
    } catch (e: any) {
      setGdriveStatusMsg(`Could not fetch folder index: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOneDriveFolder = async (folderId: string | null) => {
    setLoading(true);
    setOnedriveStatusMsg(null);
    try {
      const items = await listOneDriveFolderContents(folderId);
      setOnedriveFolderItems(items);
    } catch (e: any) {
      setOnedriveStatusMsg(`OneDrive folder list error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Google Drive Handlers ---

  const handleConnectGDrive = async () => {
    setLoading(true);
    setGdriveStatusMsg('Opening Google OAuth popup window...');
    try {
      const token = await authenticateGoogleDrive();
      setGdriveToken(token);
      setGdriveUser(getGoogleDriveUser());
      setGdriveStatusMsg('Connected to Google Drive! Loading directories...');
      fetchGDriveFolder(null);
    } catch (err: any) {
      setGdriveStatusMsg(`Google Drive connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGDrive = () => {
    disconnectGoogleDrive();
    setGdriveToken(null);
    setGdriveUser(null);
    setGdriveFolderItems([]);
    setGdriveStatusMsg('Google Drive disconnected.');
  };

  const handleCreateGDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    setGdriveStatusMsg(`Creating folder "${newFolderName}"...`);
    try {
      const newFolder = await createGoogleDriveFolder(newFolderName.trim(), gdriveCurrentFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
      setGdriveStatusMsg(`Created folder "${newFolder.name}"!`);
      fetchGDriveFolder(gdriveCurrentFolder.id);
    } catch (err: any) {
      setGdriveStatusMsg(`Error creating folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetGDriveTargetFolder = (folderId?: string | null, folderName?: string) => {
    const id = folderId !== undefined ? folderId : gdriveCurrentFolder.id;
    const name = folderName || gdriveCurrentFolder.name;
    setGoogleDriveSelectedFolder(id, name);
    setGdriveSelectedTarget({ id, name });
    setGdriveStatusMsg(`Active save target folder set to: "${name}"`);
  };

  const handleNavigateGDriveFolder = (folder: DriveItem) => {
    scrollToTop();
    const nextBreadcrumb = { id: folder.id, name: folder.name };
    setGdriveCurrentFolder(nextBreadcrumb);
    setGdrivePathStack(prev => [...prev, nextBreadcrumb]);
    setExplorerViewMode('subfolders');
    fetchGDriveFolder(folder.id);
    setSearchQuery('');
  };

  const handleNavigateGDriveCrumb = (index: number) => {
    scrollToTop();
    const target = gdrivePathStack[index];
    const newStack = gdrivePathStack.slice(0, index + 1);
    setGdrivePathStack(newStack);
    setGdriveCurrentFolder(target);
    setExplorerViewMode('subfolders');
    fetchGDriveFolder(target.id);
    setSearchQuery('');
  };

  const handleNavigateUpGDrive = () => {
    scrollToTop();
    if (gdrivePathStack.length <= 1) return;
    const newStack = [...gdrivePathStack];
    newStack.pop();
    const parent = newStack[newStack.length - 1];
    setGdrivePathStack(newStack);
    setGdriveCurrentFolder(parent);
    setExplorerViewMode('subfolders');
    fetchGDriveFolder(parent.id);
    setSearchQuery('');
  };

  const handleJumpToGDriveRoot = () => {
    scrollToTop();
    const rootCrumb = { id: null, name: 'My Drive (Root)' };
    setGdrivePathStack([rootCrumb]);
    setGdriveCurrentFolder(rootCrumb);
    setExplorerViewMode('subfolders');
    fetchGDriveFolder(null);
    setSearchQuery('');
  };

  const handleOpenGooglePicker = async (mode: 'folder' | 'file' = 'folder') => {
    setLoading(true);
    setGdriveStatusMsg('Opening native Google Drive Picker dialog...');
    try {
      const picked = await openGoogleDrivePicker(mode);
      if (picked) {
        if (picked.isFolder) {
          handleSetGDriveTargetFolder(picked.id, picked.name);
          const crumb = { id: picked.id, name: picked.name };
          setGdriveCurrentFolder(crumb);
          setGdrivePathStack([
            { id: null, name: 'My Drive (Root)' },
            crumb
          ]);
          setExplorerViewMode('subfolders');
          fetchGDriveFolder(picked.id);
          setGdriveStatusMsg(`Selected folder "${picked.name}" via Google Picker.`);
        } else {
          handleLoadFromGDrive(picked.id);
        }
      }
    } catch (err: any) {
      setGdriveStatusMsg(`Google Picker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToGDriveLocation = async (targetFolderId?: string | null, targetFolderName?: string) => {
    const folderId = targetFolderId !== undefined ? targetFolderId : gdriveCurrentFolder.id;
    const folderName = targetFolderName || gdriveCurrentFolder.name;

    setLoading(true);
    setGdriveStatusMsg(`Saving map "${currentProject.name}" into "${folderName}"...`);
    try {
      const saved = await saveProjectToGoogleDrive(currentProject, {
        isBackup: isBackupSave,
        customFileName: customSaveFileName.trim() || undefined,
        targetFolderId: folderId,
        targetFolderName: folderName
      });
      setSaveSuccessMsg(`Saved map file "${saved.name}" to Google Drive folder "${folderName}"!`);
      setGdriveStatusMsg(`Successfully saved "${saved.name}"!`);
      handleSetGDriveTargetFolder(folderId, folderName);
      fetchGDriveFolder(folderId);
    } catch (err: any) {
      setGdriveStatusMsg(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromGDrive = async (fileId: string) => {
    setLoading(true);
    setGdriveStatusMsg('Downloading complete project from Google Drive...');
    try {
      const loaded = await loadProjectFromGoogleDrive(fileId);
      onLoadProject(loaded);
      setGdriveStatusMsg(`Loaded project "${loaded.name}"!`);
      onClose();
    } catch (err: any) {
      setGdriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGDriveFile = (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmTarget({
      id: fileId,
      name: fileName,
      type: 'gdrive'
    });
  };

  // --- OneDrive Handlers ---

  const handleConnectOneDrive = async () => {
    setLoading(true);
    setOnedriveStatusMsg('Opening Microsoft Account login window...');
    try {
      const token = await authenticateOneDrive();
      setOnedriveToken(token);
      setOnedriveUser(getOneDriveUser());
      setOnedriveStatusMsg('Connected to Microsoft OneDrive!');
      fetchOneDriveFolder(null);
    } catch (err: any) {
      setOnedriveStatusMsg(`OneDrive connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectOneDrive = () => {
    disconnectOneDrive();
    setOnedriveToken(null);
    setOnedriveUser(null);
    setOnedriveFolderItems([]);
    setOnedriveStatusMsg('Microsoft OneDrive disconnected.');
  };

  const handleCreateOneDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    setOnedriveStatusMsg(`Creating folder "${newFolderName}"...`);
    try {
      const newFolder = await createOneDriveFolder(newFolderName.trim(), onedriveCurrentFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
      setOnedriveStatusMsg(`Created folder "${newFolder.name}"!`);
      fetchOneDriveFolder(onedriveCurrentFolder.id);
    } catch (err: any) {
      setOnedriveStatusMsg(`Error creating folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToOneDriveLocation = async (targetFolderId?: string | null, targetFolderName?: string) => {
    const folderId = targetFolderId !== undefined ? targetFolderId : onedriveCurrentFolder.id;
    const folderName = targetFolderName || onedriveCurrentFolder.name;

    setLoading(true);
    setOnedriveStatusMsg(`Saving project "${currentProject.name}" to OneDrive...`);
    try {
      const saved = await saveProjectToOneDrive(currentProject, {
        isBackup: isBackupSave,
        customFileName: customSaveFileName.trim() || undefined,
        targetFolderId: folderId,
        targetFolderName: folderName
      });
      setSaveSuccessMsg(`Saved file "${saved.name}" to OneDrive folder "${folderName}"!`);
      setOnedriveStatusMsg(`Successfully saved "${saved.name}"!`);
      handleSetOneDriveTargetFolder(folderId, folderName);
      fetchOneDriveFolder(folderId);
    } catch (err: any) {
      setOnedriveStatusMsg(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetOneDriveTargetFolder = (folderId?: string | null, folderName?: string) => {
    const id = folderId !== undefined ? folderId : onedriveCurrentFolder.id;
    const name = folderName || onedriveCurrentFolder.name;
    setOneDriveSelectedFolder(id, name);
    setOnedriveSelectedTarget({ id, name });
    setOnedriveStatusMsg(`Active OneDrive save location updated to: "${name}"`);
  };

  const handleNavigateOneDriveFolder = (folder: OneDriveItem) => {
    scrollToTop();
    const nextBreadcrumb = { id: folder.id, name: folder.name };
    setOnedriveCurrentFolder(nextBreadcrumb);
    setOnedrivePathStack(prev => [...prev, nextBreadcrumb]);
    fetchOneDriveFolder(folder.id);
    setSearchQuery('');
  };

  const handleNavigateOneDriveCrumb = (index: number) => {
    scrollToTop();
    const target = onedrivePathStack[index];
    const newStack = onedrivePathStack.slice(0, index + 1);
    setOnedrivePathStack(newStack);
    setOnedriveCurrentFolder(target);
    fetchOneDriveFolder(target.id);
    setSearchQuery('');
  };

  const handleNavigateUpOneDrive = () => {
    scrollToTop();
    if (onedrivePathStack.length <= 1) return;
    const newStack = [...onedrivePathStack];
    newStack.pop();
    const parent = newStack[newStack.length - 1];
    setOnedrivePathStack(newStack);
    setOnedriveCurrentFolder(parent);
    fetchOneDriveFolder(parent.id);
    setSearchQuery('');
  };

  const handleJumpToOneDriveRoot = () => {
    scrollToTop();
    const rootCrumb = { id: null, name: 'OneDrive Root (My Files)' };
    setOnedrivePathStack([rootCrumb]);
    setOnedriveCurrentFolder(rootCrumb);
    fetchOneDriveFolder(null);
    setSearchQuery('');
  };

  const handleLoadFromOneDrive = async (file: OneDriveItem) => {
    setLoading(true);
    setOnedriveStatusMsg('Downloading complete project from Microsoft OneDrive...');
    try {
      const loaded = await loadProjectFromOneDrive(file);
      onLoadProject(loaded);
      setOnedriveStatusMsg(`Loaded project "${loaded.name}"!`);
      onClose();
    } catch (err: any) {
      setOnedriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOneDriveFile = (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmTarget({
      id: fileId,
      name: fileName,
      type: 'onedrive'
    });
  };

  // Filter items
  const currentItems = activeProvider === 'gdrive' 
    ? (explorerViewMode === 'all_folders' ? gdriveAllFolders : gdriveFolderItems)
    : onedriveFolderItems;

  const filteredItems = currentItems.filter(item => 
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard listener for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset scrollbar to top whenever navigating to a folder or when folder content updates
  useEffect(() => {
    if (!isOpen) return;
    scrollToTop();
  }, [
    isOpen,
    gdriveCurrentFolder.id,
    onedriveCurrentFolder.id,
    gdriveFolderItems,
    onedriveFolderItems,
    gdriveAllFolders,
    explorerViewMode,
    activeProvider,
    activeTab
  ]);

  if (!isOpen) {
    return null;
  }

  const activeToken = activeProvider === 'gdrive' ? gdriveToken : onedriveToken;
  const activeCurrentFolder = activeProvider === 'gdrive' ? gdriveCurrentFolder : onedriveCurrentFolder;
  const activeSelectedTarget = activeProvider === 'gdrive' ? gdriveSelectedTarget : onedriveSelectedTarget;
  const activePathStack = activeProvider === 'gdrive' ? gdrivePathStack : onedrivePathStack;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[96vh] bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600/30 to-orange-900/40 border border-amber-500/40 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-stone-100 to-amber-200 bg-clip-text text-transparent">
                  Cloud Drives Explorer & Save Location
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Folder Navigation
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Browse cloud directories, select exact destination folders, and save/load your Mason project files (.mason)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close Explorer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Provider Switcher & Save Target Summary */}
        <div className="px-5 py-2.5 bg-stone-950/70 border-b border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Provider Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-stone-400">Cloud Storage:</span>
            <div className="p-1 rounded-xl bg-stone-900 border border-stone-800 flex gap-1">
              <button
                type="button"
                onClick={() => handleSwitchProvider('gdrive')}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeProvider === 'gdrive'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.01 1.992L4.01 15.992h15.999l-8-14zm-7.009 15.008l4.004 7h12l-4.004-7h-12zm12.009-1h4l-7.999-14h-4l7.999 14z" />
                </svg>
                Google Drive
                {gdriveToken && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchProvider('onedrive')}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeProvider === 'onedrive'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-200" />
                Microsoft OneDrive
                {onedriveToken && <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />}
              </button>
            </div>
          </div>

          {/* Active Target Summary Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 border border-amber-500/30 text-xs">
              <FolderCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-stone-400">Active Save Target:</span>
              <span className="font-bold text-amber-300 truncate max-w-[200px]" title={activeSelectedTarget.name}>
                {activeSelectedTarget.name}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'explore'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Explore Folders & Projects
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('backups');
                loadBackups();
              }}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'backups'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Project Backups & History
            </button>
          </div>

          {activeTab === 'explore' && activeProvider === 'gdrive' && activeToken && (
            <button
              type="button"
              onClick={() => handleOpenGooglePicker('folder')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 active:bg-blue-700 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Open Google's official Drive folder selection window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Google Drive Picker
            </button>
          )}
        </div>

        {/* Modal Main Body */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Account Header Banner */}
          <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {activeProvider === 'gdrive' ? (
                gdriveUser?.picture ? (
                  <img src={gdriveUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-blue-500/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Cloud className="w-4 h-4" />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-100 text-xs sm:text-sm">
                    {activeProvider === 'gdrive' 
                      ? (gdriveUser?.name || 'Google Drive Cloud Storage') 
                      : (onedriveUser?.displayName || 'Microsoft OneDrive Storage')}
                  </span>
                  {activeToken ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  {activeProvider === 'gdrive' 
                    ? (gdriveUser?.email || 'Choose destination folders in Google Drive to store and sync projects') 
                    : (onedriveUser?.email || 'Choose destination folders in Microsoft OneDrive to store and sync projects')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!activeToken ? (
                activeProvider === 'gdrive' ? (
                  <button
                    type="button"
                    onClick={handleConnectGDrive}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    Connect Google Drive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectOneDrive()}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    Sign In with Microsoft
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      onShowToast?.('Refreshing cloud drive contents...', 'info');
                      await refreshCloudState();
                      onShowToast?.('Cloud drive contents updated', 'success');
                    }}
                    disabled={loading}
                    className="p-2.5 rounded-xl border border-stone-700 hover:border-sky-500/70 bg-stone-900/90 hover:bg-stone-800 active:bg-stone-700 text-stone-300 hover:text-white active:scale-95 transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center group"
                    title="Refresh folder listing"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-stone-400 group-hover:text-sky-400 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const name = activeProvider === 'gdrive' ? 'Google Drive' : 'Microsoft OneDrive';
                      if (activeProvider === 'gdrive') {
                        handleDisconnectGDrive();
                      } else {
                        handleDisconnectOneDrive();
                      }
                      onShowToast?.(`Disconnected from ${name}`, 'info');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-700 hover:border-red-500/70 bg-stone-900/90 hover:bg-red-500/20 active:bg-red-500/30 text-stone-300 hover:text-red-300 active:scale-95 transition-all shadow-sm hover:shadow cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback & Status Message */}
          {(activeProvider === 'gdrive' ? gdriveStatusMsg : onedriveStatusMsg) && (
            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2 animate-fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{activeProvider === 'gdrive' ? gdriveStatusMsg : onedriveStatusMsg}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button 
                type="button"
                onClick={() => setSaveSuccessMsg(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MAIN TAB 1: EXPLORE & PICK LOCATION */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              
              {/* Folder Navigation & Toolbar */}
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Interactive Breadcrumb Bar & Up Button */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs bg-stone-900/90 px-3 py-2 rounded-xl border border-stone-800/80 flex-1">
                    
                    {/* Up Level Button */}
                    {activePathStack.length > 1 && (
                      <button
                        type="button"
                        onClick={activeProvider === 'gdrive' ? handleNavigateUpGDrive : handleNavigateUpOneDrive}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center gap-1 transition mr-1 border border-stone-700"
                        title="Go up one folder level"
                      >
                        <ArrowLeft className="w-3 h-3 text-amber-400" /> Up Level
                      </button>
                    )}

                    <span className="text-stone-500 font-bold flex items-center gap-1 mr-1">
                      <Compass className="w-3.5 h-3.5 text-amber-400" /> Path:
                    </span>

                    {activePathStack.map((crumb, idx) => (
                      <React.Fragment key={crumb.id || `crumb-${idx}`}>
                        {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-600 shrink-0" />}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeProvider === 'gdrive') {
                              handleNavigateGDriveCrumb(idx);
                            } else {
                              handleNavigateOneDriveCrumb(idx);
                            }
                          }}
                          className={`hover:underline transition truncate max-w-[140px] px-1.5 py-0.5 rounded ${
                            idx === activePathStack.length - 1 
                              ? 'font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20' 
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {crumb.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCreateFolder(!showCreateFolder)}
                      disabled={!activeToken}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> + New Subfolder
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeProvider === 'gdrive') {
                          handleSetGDriveTargetFolder();
                        } else {
                          handleSetOneDriveTargetFolder();
                        }
                      }}
                      disabled={!activeToken}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Set this open folder as the active destination for project saves"
                    >
                      <FolderCheck className="w-3.5 h-3.5 text-amber-400" /> Pick This Location
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isProjectLoaded) {
                          onShowToast?.('No project is currently open to save.', 'warning');
                          return;
                        }
                        if (!showSaveAsDialog && !customSaveFileName && currentProject?.name) {
                          setCustomSaveFileName(currentProject.name);
                        }
                        setShowSaveAsDialog(!showSaveAsDialog);
                      }}
                      disabled={!activeToken || !isProjectLoaded}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        showSaveAsDialog
                          ? 'bg-amber-500 text-stone-950 shadow-amber-500/30'
                          : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 shadow-amber-600/20'
                      }`}
                      title={isProjectLoaded ? "Save active project to this folder with custom options" : "No project open to save"}
                    >
                      <Upload className="w-3.5 h-3.5" /> Save As...
                    </button>
                  </div>
                </div>

                {/* Inline Save As Dialog Form */}
                {showSaveAsDialog && (
                  <div className="p-4 rounded-xl bg-stone-900/95 border border-amber-500/40 shadow-lg space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-stone-200">
                          Save Active Project into "{activeCurrentFolder.name}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSaveAsDialog(false)}
                        className="text-stone-400 hover:text-stone-200 text-xs p-1 rounded hover:bg-stone-800 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-stone-300">
                        Project File Name:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSaveFileName}
                          onChange={(e) => setCustomSaveFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (activeProvider === 'gdrive') {
                                handleSaveToGDriveLocation();
                              } else {
                                handleSaveToOneDriveLocation();
                              }
                            }
                          }}
                          placeholder="e.g. MyProject"
                          autoFocus
                          className="flex-1 px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 text-xs text-stone-100 font-mono focus:outline-none"
                        />
                        <div className="px-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-400 text-xs font-mono flex items-center">
                          .mason
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="explorerBackupCheckbox"
                        checked={isBackupSave}
                        onChange={(e) => setIsBackupSave(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-700 bg-stone-950 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="explorerBackupCheckbox" className="text-xs text-stone-300 cursor-pointer select-none">
                        Prefix with <code className="text-amber-400">[BACKUP]_</code> for version safety
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                      <button
                        type="button"
                        onClick={() => setShowSaveAsDialog(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 text-xs font-semibold transition cursor-pointer active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeProvider === 'gdrive') {
                            handleSaveToGDriveLocation();
                          } else {
                            handleSaveToOneDriveLocation();
                          }
                        }}
                        disabled={!activeToken || loading}
                        className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save Project File
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline New Folder Form */}
                {showCreateFolder && (
                  <div className="flex gap-2 p-3 rounded-xl bg-stone-900 border border-amber-500/40 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Enter new folder name (e.g. Dungeon Levels, Campaign Maps)..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          activeProvider === 'gdrive' ? handleCreateGDriveFolder() : handleCreateOneDriveFolder();
                        }
                      }}
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={activeProvider === 'gdrive' ? handleCreateGDriveFolder : handleCreateOneDriveFolder}
                      disabled={!newFolderName.trim() || loading}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition"
                    >
                      Create Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }}
                      className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Quick Navigation Shortcuts & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
                  
                  {/* Quick Locations */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[11px] font-semibold text-stone-500 mr-1">Quick Jump:</span>
                    <button
                      type="button"
                      onClick={activeProvider === 'gdrive' ? handleJumpToGDriveRoot : handleJumpToOneDriveRoot}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-[11px] flex items-center gap-1"
                    >
                      <HardDrive className="w-3 h-3 text-stone-400" /> Root Drive
                    </button>

                    {activeSelectedTarget.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeProvider === 'gdrive') {
                            setGdriveCurrentFolder(activeSelectedTarget);
                            setGdrivePathStack([{ id: null, name: 'My Drive' }, activeSelectedTarget]);
                            fetchGDriveFolder(activeSelectedTarget.id);
                          } else {
                            setOnedriveCurrentFolder(activeSelectedTarget);
                            setOnedrivePathStack([{ id: null, name: 'OneDrive Root' }, activeSelectedTarget]);
                            fetchOneDriveFolder(activeSelectedTarget.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1"
                      >
                        <FolderCheck className="w-3 h-3 text-amber-400" /> Target: {activeSelectedTarget.name}
                      </button>
                    )}

                    {activeProvider === 'gdrive' && activeToken && (
                      <button
                        type="button"
                        onClick={fetchAllGDriveFolders}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 ${
                          explorerViewMode === 'all_folders'
                            ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                            : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-300'
                        }`}
                      >
                        <FolderTree className="w-3 h-3" /> All Drive Folders
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Filter current directory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Folder & Files List View */}
              {!activeToken ? (
                <div className="p-10 text-center border border-dashed border-stone-800 rounded-2xl bg-stone-950/40 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto text-stone-400">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-stone-200 text-sm">Not Connected to {activeProvider === 'gdrive' ? 'Google Drive' : 'Microsoft OneDrive'}</h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      {activeProvider === 'gdrive' 
                        ? 'Connect your Google Drive account to explore folders, pick save locations, and open projects.'
                        : 'Connect your Microsoft OneDrive account to explore folders, pick save locations, and sync your Mason projects.'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {activeProvider === 'gdrive' ? (
                      <button
                        type="button"
                        onClick={handleConnectGDrive}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
                      >
                        <Cloud className="w-4 h-4" /> Connect Google Drive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnectOneDrive()}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-600/20 transition"
                      >
                        <Cloud className="w-4 h-4" /> Sign In with Microsoft
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-stone-800 rounded-2xl bg-stone-950/30 space-y-3">
                      <Folder className="w-10 h-10 text-stone-600 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-stone-300 text-sm">
                          {searchQuery ? 'No items matched your filter query' : 'This directory has no subfolders or files'}
                        </h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          You can create a new subfolder here, set this folder as your cloud save location, or browse other drives.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {activePathStack.length > 1 && (
                          <button
                            type="button"
                            onClick={activeProvider === 'gdrive' ? handleNavigateUpGDrive : handleNavigateUpOneDrive}
                            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Up to Parent Folder
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowCreateFolder(true)}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-amber-400" /> + Create Subfolder
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeProvider === 'gdrive') {
                              handleSaveToGDriveLocation();
                            } else {
                              handleSaveToOneDriveLocation();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Save Project Here
                        </button>
                        {activeProvider === 'gdrive' && (
                          <button
                            type="button"
                            onClick={() => handleOpenGooglePicker('folder')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Google Drive Picker
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div ref={itemsListRef} className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                      {filteredItems.map(item => {
                        const isFolder = item.isFolder;
                        const isSelectedTarget = isFolder && activeSelectedTarget.id === item.id;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition group ${
                              isFolder
                                ? isSelectedTarget
                                  ? 'bg-amber-950/30 border-amber-500/60 shadow-sm'
                                  : 'bg-stone-950/60 border-stone-800 hover:border-amber-500/40 hover:bg-stone-900/60'
                                : 'bg-stone-950/40 border-stone-800/60 hover:border-blue-500/30'
                            }`}
                          >
                            {/* Left: Icon & Title (Clickable) */}
                            <div 
                              className={`flex items-center gap-3 truncate ${isFolder ? 'cursor-pointer flex-1' : ''}`}
                              onClick={() => {
                                if (isFolder) {
                                  if (activeProvider === 'gdrive') {
                                    handleNavigateGDriveFolder(item as DriveItem);
                                  } else {
                                    handleNavigateOneDriveFolder(item as OneDriveItem);
                                  }
                                }
                              }}
                            >
                              <div className={`p-2.5 rounded-xl shrink-0 ${
                                isFolder 
                                  ? isSelectedTarget ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {isFolder ? <FolderOpen className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                              </div>

                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-xs sm:text-sm truncate ${
                                    isFolder 
                                      ? 'text-stone-100 group-hover:text-amber-300' 
                                      : 'text-stone-200'
                                  }`}>
                                    {item.name}
                                  </span>
                                  {isSelectedTarget && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Active Save Target
                                    </span>
                                  )}
                                  {isFolder && (
                                    <span className="hidden sm:inline text-[10px] text-stone-500">
                                      (Click to browse folder)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(item.modifiedTime).toLocaleDateString()}
                                  </span>
                                  {item.size && (
                                    <span>• {Math.round(Number(item.size) / 1024)} KB</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {isFolder ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeProvider === 'gdrive') {
                                        handleSetGDriveTargetFolder(item.id, item.name);
                                      } else {
                                        handleSetOneDriveTargetFolder(item.id, item.name);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-[11px] font-medium transition flex items-center gap-1 border border-stone-700"
                                    title="Set this subfolder as default save location"
                                  >
                                    <FolderCheck className="w-3 h-3 text-amber-400" /> Set Target
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeProvider === 'gdrive') {
                                        handleSaveToGDriveLocation(item.id, item.name);
                                      } else {
                                        handleSaveToOneDriveLocation(item.id, item.name);
                                      }
                                    }}
                                    disabled={loading}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-bold transition flex items-center gap-1"
                                    title="Save project directly inside this folder"
                                  >
                                    <Upload className="w-3 h-3" /> Save Here
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeProvider === 'gdrive') {
                                        handleNavigateGDriveFolder(item as DriveItem);
                                      } else {
                                        handleNavigateOneDriveFolder(item as OneDriveItem);
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-stone-950 font-bold text-[11px] transition flex items-center gap-1"
                                    title="Open and browse inside this folder"
                                  >
                                    Open Folder <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeProvider === 'gdrive') {
                                        handleLoadFromGDrive(item.id);
                                      } else {
                                        handleLoadFromOneDrive(item as OneDriveItem);
                                      }
                                    }}
                                    disabled={loading}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                                  >
                                    <Download className="w-3 h-3" /> Load Project
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      if (activeProvider === 'gdrive') {
                                        handleDeleteGDriveFile(item.id, item.name, e);
                                      } else {
                                        handleDeleteOneDriveFile(item.id, item.name, e);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 hover:border-red-500 hover:bg-red-600 active:bg-red-700 text-stone-400 hover:text-white active:scale-95 transition cursor-pointer shadow-sm"
                                    title="Delete file from cloud drive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* MAIN TAB 2: AUTOMATED PROJECT BACKUPS & HISTORY */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              
              {/* Backup Engine Configuration Box */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Automated Project Backup Engine
                    </h3>
                    <p className="text-xs text-stone-400">
                      Snapshots are automatically created to IndexedDB and synced to your cloud <code className="text-amber-300">backups/</code> subfolder.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerManualBackup}
                    disabled={executingBackup}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition cursor-pointer self-start sm:self-auto"
                  >
                    {executingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Create Backup Snapshot Now
                  </button>
                </div>

                {/* Settings Controls (Interval & Retention) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-200">
                        Backup Frequency
                      </label>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                        Every {backupSettings.intervalMinutes} minutes
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Interval between automatic background snapshots (Allowed: 3 to 60 minutes).
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="3"
                        max="60"
                        step="1"
                        value={backupSettings.intervalMinutes}
                        onChange={(e) => handleUpdateBackupSettings({ intervalMinutes: Number(e.target.value) })}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-stone-400 w-12 text-right">
                        {backupSettings.intervalMinutes}m
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-200">
                        Backup Retention Limit
                      </label>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                        Keep last {backupSettings.retentionCount} backups
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Oldest backups automatically cycle out once limit is reached (Allowed: 1 to 50 backups).
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={backupSettings.retentionCount}
                        onChange={(e) => handleUpdateBackupSettings({ retentionCount: Number(e.target.value) })}
                        className="flex-1 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-stone-400 w-12 text-right">
                        {backupSettings.retentionCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cloud sync status banner */}
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-300">
                    <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Cloud Destination: <strong className="text-stone-100">backups/</strong> in {activeSelectedTarget.name} ({activeProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'})
                    </span>
                  </div>
                  {backupSettings.lastBackupTime && (
                    <span className="text-[11px] text-stone-400">
                      Last backup: {new Date(backupSettings.lastBackupTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Backup History Snapshots List */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-200 text-xs flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-stone-400" />
                      Backups Folder Snapshots ({backupsList.length})
                    </h4>
                    {backupsLocationName && (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Location: <span className="font-mono text-stone-300">{backupsLocationName}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      onShowToast?.('Refreshing backups folder...', 'info');
                      await loadBackups();
                      onShowToast?.('Backups folder updated', 'success');
                    }}
                    className="p-1.5 rounded-lg border border-stone-800 hover:border-sky-500/50 bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs transition cursor-pointer active:scale-95 shadow-sm"
                    title="Refresh snapshots from backups folder"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingBackups ? (
                  <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading backup files directly from backups folder...
                  </div>
                ) : backupsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-xl space-y-2">
                    <Clock className="w-6 h-6 text-stone-600 mx-auto" />
                    <p>No backup files found in the backups folder.</p>
                    <p className="text-[11px] text-stone-600">
                      Click "Create Backup Snapshot Now" or wait for the automatic periodic snapshot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {backupsList.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 flex items-center justify-between gap-3 text-xs transition group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-stone-200 truncate">
                                {rec.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-stone-800 text-amber-400 border border-amber-500/20">
                                {rec.provider === 'gdrive' ? 'Google Drive' : rec.provider === 'onedrive' ? 'OneDrive' : 'Local'}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                              <span>Saved: {new Date(rec.modifiedTime).toLocaleString()}</span>
                              {rec.size && (
                                <span>• {Math.round(Number(rec.size) / 1024)} KB</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestoreBackupRecord(rec)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                            title="Restore this backup state into the editor"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Restore
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadBackupRecord(rec, e)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 hover:text-white transition cursor-pointer active:scale-95 shadow-sm"
                            title="Download .mason backup file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteBackupRecord(rec, e)}
                            className="p-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 hover:border-red-500 hover:bg-red-600 active:bg-red-700 text-stone-400 hover:text-white active:scale-95 transition cursor-pointer shadow-sm"
                            title="Delete backup file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* In-Modal Delete Confirmation Overlay */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-stone-900 border border-red-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Delete Permanently?</h3>
                  <p className="text-xs text-stone-400">
                    {deleteConfirmTarget.type === 'backup' ? 'Remove backup snapshot' : 'Remove project file from cloud drive'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">File Name</div>
                <div className="font-mono text-xs text-amber-300 font-bold break-all">
                  {deleteConfirmTarget.name}
                </div>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Are you sure you want to permanently delete this project file? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  disabled={deletingInProgress}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 text-xs font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedDelete}
                  disabled={deletingInProgress}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {deletingInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-Modal Restore Confirmation Overlay */}
        {restoreConfirmTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Restore Backup Snapshot?</h3>
                  <p className="text-xs text-stone-400">
                    Replaces the active workspace project
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">Snapshot File</div>
                <div className="font-mono text-xs text-amber-300 font-bold break-all">
                  {restoreConfirmTarget.name}
                </div>
                <div className="text-[10px] text-stone-500">
                  Saved: {new Date(restoreConfirmTarget.modifiedTime).toLocaleString()}
                </div>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Are you sure you want to restore this snapshot? Any unsaved changes in your current session will be replaced with this backup state.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setRestoreConfirmTarget(null)}
                  disabled={restoringInProgress}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 text-xs font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedRestore}
                  disabled={restoringInProgress}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {restoringInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Restore Snapshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Cloud Target: <strong className="text-stone-300">{activeSelectedTarget.name}</strong> ({activeProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'})</span>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-600/20 hover:shadow-amber-600/40 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
