import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
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
  Settings,
  Bookmark,
  BookmarkCheck,
  Star,
  Scissors,
  Image as ImageIcon,
  Monitor,
  FileText,
  Link2,
  Lock,
  FileSpreadsheet,
  FolderSync,
  Save
} from 'lucide-react';
import { 
  LocationBookmark, 
  getLocationBookmarks, 
  toggleLocationBookmark, 
  removeLocationBookmark, 
  isLocationBookmarked 
} from '../utils/locationBookmarksStorage';
import { ProjectData } from '../utils/projectStorage';
import { MASON_VERSION, MASON_VERSION_DISPLAY } from '../version';
import { 
  getGoogleDriveToken, 
  getGoogleDriveUser, 
  authenticateGoogleDrive, 
  disconnectGoogleDrive, 
  saveProjectToGoogleDrive, 
  saveFileToGoogleDrive,
  loadProjectFromGoogleDrive, 
  DriveItem,
  listGoogleDriveFolderContents,
  listAllGoogleDriveFolders,
  openGoogleDrivePicker,
  createGoogleDriveFolder,
  getGoogleDriveSelectedFolder,
  setGoogleDriveSelectedFolder,
  deleteGoogleDriveFile,
  downloadFileAsDataUrlFromGoogleDrive,
  downloadFileAsTextFromGoogleDrive,
  saveModularProjectToGoogleDrive,
  readModularProjectFromGoogleDrive,
  checkIfGoogleDriveFolderIsModularProject,
  checkExistingGDriveDirProject
} from '../utils/googleDriveStorage';
import { 
  getOneDriveToken, 
  getOneDriveUser, 
  authenticateOneDrive, 
  disconnectOneDrive, 
  saveProjectToOneDrive, 
  saveFileToOneDrive,
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
  deleteOneDriveFile,
  downloadFileAsDataUrlFromOneDrive,
  downloadFileAsTextFromOneDrive,
  saveModularProjectToOneDrive,
  readModularProjectFromOneDrive,
  checkIfOneDriveFolderIsModularProject,
  checkExistingOneDriveDirProject
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
import { ProjectIndexItem, saveActiveMasonProject } from '../utils/masonStorage';
import { MasonProject } from '../engine/masonProjectSchema';
import { 
  linkProjectToLocalFile, 
  linkProjectToLocalDirectory,
  readModularProjectFromDirectory,
  writeModularProjectToDirectory,
  checkExistingLocalDirProject,
  setActiveFileSystemDirHandle,
  isFileSystemAccessSupported,
  isDirectoryAccessSupported,
  saveProjectToLinkedLocation,
  LinkedStorageLocation,
  CURRENT_CLIENT_SESSION_ID
} from '../utils/linkedSaveTarget';

export type UnifiedFileAction = 'save_project' | 'load_project' | 'import_asset' | 'export_file' | 'import_profile';

export interface UnifiedFilePayload {
  name: string;
  content: string;
  mimeType: string;
}

export interface VirtualDriveItem {
  id: string;
  name: string;
  displayName?: string;
  dataUrl: string;
  width?: number;
  height?: number;
  isFolder: false;
  mimeType: string;
  category?: string;
  tags?: string[];
  lastModified?: string;
  type: 'image' | 'sprite';
}

export interface UnifiedFileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Dynamic requested Action:
  action?: UnifiedFileAction;
  
  // Existing local loading / IndexedDB project state
  savedProjects?: ProjectIndexItem[];
  onSelectProject?: (id: string) => void;
  onDeleteProject?: (id: string, e: React.MouseEvent) => void;
  onImportBundle?: (project: MasonProject) => void;

  // Existing cloud loading / project structure
  currentProject?: (ProjectData & { fullMasonProject?: any }) | null;
  onLoadProject?: (project: ProjectData) => void;
  onProjectSaved?: (project: MasonProject) => void;
  initialMode?: 'explore' | 'backups';
  focusLinkedLocation?: boolean;
  saveFilePayload?: UnifiedFilePayload | null;

  // Existing image/spritesheet imports
  project?: MasonProject;
  importMode?: 'sprite_editor' | 'select_image';
  activeSpriteName?: string;
  onSelectImage?: (imageSrc: string, fileName: string) => void;
  onImportSingleImage?: (
    dataUrl: string, 
    fileName: string, 
    targetMode: 'new' | 'replace', 
    newSpriteName?: string
  ) => void;
  onImportSpritesheet?: (
    imageSrc: string, 
    fileName: string, 
    targetMode: 'new' | 'replace', 
    newSpriteName?: string
  ) => void;
  onImportSpriteProject?: (
    spriteProjectData: any, 
    fileName: string, 
    targetMode: 'new' | 'replace', 
    newSpriteName?: string
  ) => void;

  onOpenProfileSettings?: (tab?: 'profiles' | 'config' | 'export') => void;
  onImportProfileConfig?: (jsonContent: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const UnifiedFileManagerModal: React.FC<UnifiedFileManagerProps> = ({
  isOpen,
  onClose,
  action = 'load_project',
  savedProjects = [],
  onSelectProject,
  onDeleteProject,
  onImportBundle,
  currentProject,
  onLoadProject,
  onProjectSaved,
  initialMode = 'explore',
  focusLinkedLocation = false,
  saveFilePayload = null,
  project,
  importMode = 'sprite_editor',
  activeSpriteName = 'Current Sprite',
  onSelectImage,
  onImportSingleImage,
  onImportSpritesheet,
  onImportSpriteProject,
  onOpenProfileSettings,
  onImportProfileConfig,
  onShowToast
}) => {
  // Resolve active project workspace
  const activeWorkspaceProject = useMemo(() => project || currentProject?.fullMasonProject || null, [project, currentProject]);

  // Version Mismatch Dialog State
  const [versionMismatchDialog, setVersionMismatchDialog] = useState<{
    fileVersion: string;
    projectName: string;
    onConfirm: () => void;
  } | null>(null);

  // Helper to check version before loading/importing/restoring project
  const checkVersionAndProceed = (
    loadedVersion: string | undefined, 
    projectName: string, 
    onProceed: () => void
  ) => {
    const cleanLoaded = (loadedVersion || '').trim().replace(/^v/i, '');
    const cleanCurrent = MASON_VERSION.trim().replace(/^v/i, '');

    if (!cleanLoaded || cleanLoaded !== cleanCurrent) {
      setVersionMismatchDialog({
        fileVersion: loadedVersion || 'Unknown / Legacy',
        projectName: projectName || 'Project',
        onConfirm: () => {
          setVersionMismatchDialog(null);
          onProceed();
        }
      });
    } else {
      onProceed();
    }
  };
  const isProjectLoaded = Boolean(currentProject && currentProject.id && currentProject.id !== 'temp_proj');

  // Unified Providers (Local Device, Cloud Drives, Virtual Drive)
  const [activeStorageProvider, setActiveStorageProvider] = useState<'local' | 'cloud' | 'virtual'>('local');

  // Cloud Providers Tab (Google Drive vs OneDrive)
  const [activeCloudProvider, setActiveCloudProviderState] = useState<CloudProvider>('gdrive');
  const [cloudViewMode, setCloudViewMode] = useState<'subfolders' | 'all_folders'>('subfolders');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Backup Snapshots state (Virtual backup engine)
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

  // Check if currently viewing the linked project folder
  const isViewingLinkedFolder = useMemo(() => {
    const loc = activeWorkspaceProject?.storageLocation;
    if (!loc || loc.type === 'local_idb') return false;
    if (activeStorageProvider === 'cloud') {
      const curFolderId = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.id : onedriveCurrentFolder.id;
      return (
        loc.type === activeCloudProvider &&
        (Boolean(loc.targetFolderId && loc.targetFolderId === curFolderId) || (!loc.targetFolderId && !curFolderId))
      );
    }
    if (activeStorageProvider === 'local') {
      return loc.type === 'local_directory' || loc.type === 'local_file';
    }
    return false;
  }, [activeWorkspaceProject, activeStorageProvider, activeCloudProvider, gdriveCurrentFolder.id, onedriveCurrentFolder.id]);

  // Folder creation & loading
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Custom File saving naming
  const [customSaveFileName, setCustomSaveFileName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Import Mode Slices calibration states
  const [selectedCloudItem, setSelectedCloudItem] = useState<(DriveItem | OneDriveItem | VirtualDriveItem) | null>(null);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [selectedImageDims, setSelectedImageDims] = useState<{ width: number; height: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [customSpriteName, setCustomSpriteName] = useState('');
  const [targetMode, setTargetMode] = useState<'new' | 'replace'>('new');

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<LocationBookmark[]>(getLocationBookmarks);

  // Section & selection states for Windows Explorer sidebar navigation
  const [virtualSection, setVirtualSection] = useState<'assets' | 'backups'>('assets');

  // Local File Inputs Ref
  const localProjectInputRef = useRef<HTMLInputElement>(null);
  const localAssetInputRef = useRef<HTMLInputElement>(null);
  const localProfileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onImportProfileConfig) {
        onImportProfileConfig(content);
        if (onShowToast) onShowToast('Imported profile configuration!', 'success');
        onClose();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Track initializations
  const prevIsOpenRef = useRef(false);

  // Direct Jump to Linked Workspace Folder
  const handleJumpToLinkedFolder = () => {
    const loc = activeWorkspaceProject?.storageLocation;
    if (!loc || loc.type === 'local_idb') return;
    if (loc.type === 'onedrive') {
      isJumpingBookmarkRef.current = true;
      prevCloudProviderRef.current = 'onedrive';
      setActiveStorageProvider('cloud');
      setActiveCloudProviderState('onedrive');
      setActiveCloudProvider('onedrive');
      const crumb: FolderBreadcrumb = { id: loc.targetFolderId || null, name: loc.targetFolderName || 'OneDrive Folder' };
      setOnedriveCurrentFolder(crumb);
      setOnedrivePathStack(loc.targetFolderId ? [{ id: null, name: 'OneDrive Root (My Files)' }, crumb] : [{ id: null, name: 'OneDrive Root (My Files)' }]);
      if (getOneDriveToken()) {
        fetchOneDriveFolder(loc.targetFolderId || null);
      }
      if (onShowToast) onShowToast(`Navigated to linked OneDrive workspace: ${crumb.name}`, 'info');
    } else if (loc.type === 'gdrive') {
      isJumpingBookmarkRef.current = true;
      prevCloudProviderRef.current = 'gdrive';
      setActiveStorageProvider('cloud');
      setActiveCloudProviderState('gdrive');
      setActiveCloudProvider('gdrive');
      const crumb: FolderBreadcrumb = { id: loc.targetFolderId || null, name: loc.targetFolderName || 'Google Drive Folder' };
      setGdriveCurrentFolder(crumb);
      setGdrivePathStack(loc.targetFolderId ? [{ id: null, name: 'My Drive (Root)' }, crumb] : [{ id: null, name: 'My Drive (Root)' }]);
      if (getGoogleDriveToken()) {
        fetchGDriveFolder(loc.targetFolderId || null);
      }
      if (onShowToast) onShowToast(`Navigated to linked Google Drive workspace: ${crumb.name}`, 'info');
    } else {
      setActiveStorageProvider('local');
      if (onShowToast) onShowToast(`Switched to linked local workspace: ${loc.displayName || loc.targetFolderName || loc.fileName}`, 'info');
    }
  };

  // Synced bookmarks across windows
  useEffect(() => {
    const syncBookmarks = () => setBookmarks(getLocationBookmarks());
    window.addEventListener('mason_bookmarks_updated', syncBookmarks);
    return () => window.removeEventListener('mason_bookmarks_updated', syncBookmarks);
  }, []);

  // Listen to window focus / storage events to refresh cloud tokens when user connects cloud accounts in Profile Settings
  useEffect(() => {
    if (!isOpen) return;
    const handleRefresh = () => {
      refreshCloudState();
    };
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [isOpen]);

  // All bookmarks remain accessible in Quick Access
  const validBookmarks = useMemo(() => {
    return bookmarks;
  }, [bookmarks]);

  // Set initial providers based on action, linked storage target, and token state when modal opens
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (justOpened) {
      const linkedLoc = activeWorkspaceProject?.storageLocation;
      
      // Determine best default workspace view based on action when modal is opened
      if (initialMode === 'backups') {
        setActiveStorageProvider('virtual');
        setVirtualSection('backups');
      } else if (action === 'import_asset') {
        // If has virtual assets, let's start with Virtual or local
        const virtualHasItems = ((activeWorkspaceProject?.fileSystem?.images || []).length > 0);
        setActiveStorageProvider(virtualHasItems ? 'virtual' : 'local');
      } else if (linkedLoc && linkedLoc.type !== 'local_idb') {
        // If the project has a linked cloud or local folder, open directly into that folder
        if (linkedLoc.type === 'onedrive') {
          setActiveStorageProvider('cloud');
          setActiveCloudProviderState('onedrive');
          setActiveCloudProvider('onedrive');
          const crumb: FolderBreadcrumb = {
            id: linkedLoc.targetFolderId || null,
            name: linkedLoc.targetFolderName || 'OneDrive Folder'
          };
          setOnedriveCurrentFolder(crumb);
          setOnedrivePathStack(linkedLoc.targetFolderId ? [{ id: null, name: 'OneDrive Root (My Files)' }, crumb] : [{ id: null, name: 'OneDrive Root (My Files)' }]);
          if (getOneDriveToken()) {
            fetchOneDriveFolder(linkedLoc.targetFolderId || null);
          }
        } else if (linkedLoc.type === 'gdrive') {
          setActiveStorageProvider('cloud');
          setActiveCloudProviderState('gdrive');
          setActiveCloudProvider('gdrive');
          const crumb: FolderBreadcrumb = {
            id: linkedLoc.targetFolderId || null,
            name: linkedLoc.targetFolderName || 'Google Drive Folder'
          };
          setGdriveCurrentFolder(crumb);
          setGdrivePathStack(linkedLoc.targetFolderId ? [{ id: null, name: 'My Drive (Root)' }, crumb] : [{ id: null, name: 'My Drive (Root)' }]);
          if (getGoogleDriveToken()) {
            fetchGDriveFolder(linkedLoc.targetFolderId || null);
          }
        } else {
          setActiveStorageProvider('local');
        }
      } else {
        setActiveStorageProvider('local');
      }

      // Sync active Cloud driver provider from localStorage
      if (!linkedLoc || linkedLoc.type === 'local_idb' || linkedLoc.type === 'local_directory' || linkedLoc.type === 'local_file') {
        setActiveCloudProviderState(getActiveCloudProvider());
      }

      // Init naming field
      if (saveFilePayload) {
        setCustomSaveFileName(saveFilePayload.name);
      } else if (isProjectLoaded && currentProject) {
        const cleanProjectName = (currentProject.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
        setCustomSaveFileName(`${cleanProjectName}.mason`);
      } else {
        setCustomSaveFileName('');
      }

      // Fresh state loads
      refreshCloudState();
      setBackupSettingsState(getBackupSettings());
      loadBackups();
    }
  }, [isOpen, action, initialMode, currentProject, saveFilePayload, activeWorkspaceProject]);

  // Reset folder navigations if user swaps between cloud providers to avoid stalling / mismatching
  const isJumpingBookmarkRef = useRef(false);
  const prevCloudProviderRef = useRef<CloudProvider | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (isJumpingBookmarkRef.current) {
      isJumpingBookmarkRef.current = false;
      prevCloudProviderRef.current = activeCloudProvider;
      return;
    }
    if (prevCloudProviderRef.current && prevCloudProviderRef.current !== activeCloudProvider) {
      // Clean navigations to avoid API leaks
      setGdriveCurrentFolder({ id: null, name: 'My Drive (Root)' });
      setGdrivePathStack([{ id: null, name: 'My Drive (Root)' }]);
      setGdriveFolderItems([]);

      setOnedriveCurrentFolder({ id: null, name: 'OneDrive Root (My Files)' });
      setOnedrivePathStack([{ id: null, name: 'OneDrive Root (My Files)' }]);
      setOnedriveFolderItems([]);

      // Fetch newly focused
      refreshCloudState();
    }
    prevCloudProviderRef.current = activeCloudProvider;
  }, [activeCloudProvider, isOpen]);

  // Sync bookmarks active state
  const isCurrentBookmarked = useMemo(() => {
    const curFolderId = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.id : onedriveCurrentFolder.id;
    return isLocationBookmarked(activeCloudProvider, curFolderId);
  }, [activeCloudProvider, gdriveCurrentFolder.id, onedriveCurrentFolder.id, bookmarks]);

  // Toggle location bookmark
  const handleToggleBookmarkCurrentLocation = () => {
    const curFolder = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder : onedriveCurrentFolder;
    const curPathStack = activeCloudProvider === 'gdrive' ? gdrivePathStack : onedrivePathStack;
    const folderName = curFolder.name || (activeCloudProvider === 'gdrive' ? 'Google Drive Root' : 'OneDrive Root');

    const res = toggleLocationBookmark(activeCloudProvider, curFolder.id, folderName, curPathStack);
    setBookmarks(res.bookmarks);
    if (onShowToast) {
      onShowToast(
        res.isBookmarked ? `Bookmarked "${folderName}" for quick access!` : `Removed bookmark for "${folderName}"`,
        res.isBookmarked ? 'success' : 'info'
      );
    }
  };

  // Jump direct to folder bookmark
  const handleJumpToBookmark = (bm: LocationBookmark) => {
    if (bm.provider === 'virtual') {
      setActiveStorageProvider('virtual');
      setVirtualSection('assets');
      if (onShowToast) {
        onShowToast(`Switched to Virtual Workspace bookmark: ${bm.label}`, 'info');
      }
      return;
    }

    if (bm.provider === 'gdrive' || bm.provider === 'onedrive') {
      isJumpingBookmarkRef.current = true;
      prevCloudProviderRef.current = bm.provider;
      setActiveStorageProvider('cloud');
      setActiveCloudProviderState(bm.provider);
      setActiveCloudProvider(bm.provider);
      const crumb = { id: bm.folderId, name: bm.folderName };
      if (bm.provider === 'gdrive') {
        setGdriveCurrentFolder(crumb);
        setGdrivePathStack(bm.pathStack && bm.pathStack.length > 0 ? bm.pathStack : [crumb]);
        fetchGDriveFolder(bm.folderId);
      } else {
        setOnedriveCurrentFolder(crumb);
        setOnedrivePathStack(bm.pathStack && bm.pathStack.length > 0 ? bm.pathStack : [crumb]);
        fetchOneDriveFolder(bm.folderId);
      }
      if (onShowToast) {
        onShowToast(`Switched to cloud bookmark: ${bm.label}`, 'info');
      }
    }
  };

  // Remove bookmark entry
  const handleRemoveBookmark = (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    const updated = removeLocationBookmark(id);
    setBookmarks(updated);
    if (onShowToast) onShowToast(`Removed bookmark "${label}"`, 'info');
  };

  // Deletion Confirm popup states
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    name: string;
    type: 'gdrive' | 'onedrive' | 'backup';
    backupItem?: BackupFileItem;
  } | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  // Restoration confirm states
  const [restoreConfirmTarget, setRestoreConfirmTarget] = useState<BackupFileItem | null>(null);
  const [restoringInProgress, setRestoringInProgress] = useState(false);

  // Folder Linking Project Conflict State
  const [detectedProjectConflict, setDetectedProjectConflict] = useState<{
    targetFolderType: 'local_directory' | 'gdrive' | 'onedrive';
    targetFolderName: string;
    dirHandle?: any;
    targetFolderId?: string;
    foundProject: MasonProject;
    currentProjectToLink: MasonProject;
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Virtual items compute (Terrain, props, sprites)
  const virtualDriveItems = useMemo<VirtualDriveItem[]>(() => {
    const list: VirtualDriveItem[] = [];
    if (!activeWorkspaceProject || !activeWorkspaceProject.fileSystem) return list;

    // 1. Image Files
    const images = activeWorkspaceProject.fileSystem.images || [];
    images.forEach(img => {
      if (img.dataUrl) {
        list.push({
          id: img.id || img.fileName,
          name: img.fileName,
          displayName: img.name || img.fileName,
          dataUrl: img.dataUrl,
          width: img.width,
          height: img.height,
          isFolder: false,
          mimeType: 'image/png',
          category: 'Images',
          lastModified: img.updatedAt,
          type: 'image'
        });
      }
    });

    // 2. Spritesheets from Prefabs
    const prefabs = activeWorkspaceProject.fileSystem.prefabs || [];
    prefabs.forEach(prefab => {
      const sheets = prefab.prefabData?.spritesheets || [];
      sheets.forEach(sheet => {
        const url = sheet.imageUrl || sheet.dataUrl;
        if (url && !list.some(item => item.dataUrl === url)) {
          list.push({
            id: `sheet_${sheet.id}`,
            name: `${sheet.name || 'sheet'}.png`,
            displayName: `${prefab.name || 'Prefab'} — ${sheet.name || 'Spritesheet'}`,
            dataUrl: url,
            width: sheet.imageWidth || (sheet.cols && sheet.tileWidth ? sheet.cols * sheet.tileWidth : undefined),
            height: sheet.imageHeight || (sheet.rows && sheet.tileHeight ? sheet.rows * sheet.tileHeight : undefined),
            isFolder: false,
            mimeType: 'image/png',
            category: 'Prefab Sheets',
            type: 'image'
          });
        }
      });
    });

    return list;
  }, [activeWorkspaceProject]);

  // Load backups list (for backups section in Virtual drive)
  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetchBackupFilesFromFolder(activeCloudProvider, currentProject?.id);
      setBackupsList(res.items);
      setBackupsLocationName(res.locationName);
    } catch (err) {
      console.warn('Could not load project backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleUpdateBackupSettings = (updates: Partial<BackupSettings>) => {
    const updated = saveBackupSettings(updates);
    setBackupSettingsState(updated);
    if (onShowToast) onShowToast(`Backup settings saved: every ${updated.intervalMinutes}m, keep ${updated.retentionCount}`, 'success');
  };

  const handleTriggerManualBackup = async () => {
    if (!isProjectLoaded || !currentProject) {
      if (onShowToast) onShowToast('No active project is open to back up.', 'warning');
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
      if (onShowToast) onShowToast(`Backup snapshot created (${res.totalKept} backups retained)`, 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Backup failed: ${err.message}`, 'error');
    } finally {
      setExecutingBackup(false);
    }
  };

  const executeConfirmedDelete = async () => {
    if (!deleteConfirmTarget) return;
    setDeletingInProgress(true);
    try {
      if (deleteConfirmTarget.type === 'gdrive') {
        await deleteGoogleDriveFile(deleteConfirmTarget.id);
        setGdriveStatusMsg(`Deleted "${deleteConfirmTarget.name}" from Google Drive.`);
        if (onShowToast) onShowToast(`Deleted "${deleteConfirmTarget.name}" from Google Drive`, 'info');
        await fetchGDriveFolder(gdriveCurrentFolder.id);
      } else if (deleteConfirmTarget.type === 'onedrive') {
        await deleteOneDriveFile(deleteConfirmTarget.id);
        setOnedriveStatusMsg(`Deleted "${deleteConfirmTarget.name}" from OneDrive.`);
        if (onShowToast) onShowToast(`Deleted "${deleteConfirmTarget.name}" from OneDrive`, 'info');
        await fetchOneDriveFolder(onedriveCurrentFolder.id);
      } else if (deleteConfirmTarget.type === 'backup' && deleteConfirmTarget.backupItem) {
        await deleteBackupFile(deleteConfirmTarget.backupItem);
        await loadBackups();
        if (onShowToast) onShowToast(`Deleted backup snapshot "${deleteConfirmTarget.name}"`, 'info');
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Delete operation failed';
      if (deleteConfirmTarget.type === 'gdrive') setGdriveStatusMsg(`Delete failed: ${errorMsg}`);
      if (deleteConfirmTarget.type === 'onedrive') setOnedriveStatusMsg(`Delete failed: ${errorMsg}`);
      if (onShowToast) onShowToast(`Delete failed: ${errorMsg}`, 'error');
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
        const fileVersion = (restored as any).engineVersion || (restored as any).engine_version || (restored as any).masonVersion || (restored as any).version;
        checkVersionAndProceed(fileVersion, restored.name || restoreConfirmTarget.name, () => {
          if (onLoadProject) {
            onLoadProject(restored);
            if (onShowToast) onShowToast(`Restored project from backup "${restoreConfirmTarget.name}"!`, 'success');
            setRestoreConfirmTarget(null);
            onClose();
          }
        });
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Restore failed: ${err.message}`, 'error');
    } finally {
      setRestoringInProgress(false);
    }
  };

  const executeOverwriteFolderConflict = async () => {
    if (!detectedProjectConflict) return;
    setIsResolvingConflict(true);
    try {
      const { targetFolderType, dirHandle, targetFolderId, targetFolderName, currentProjectToLink } = detectedProjectConflict;
      if (targetFolderType === 'local_directory' && dirHandle) {
        setActiveFileSystemDirHandle(dirHandle);
        await writeModularProjectToDirectory(currentProjectToLink, dirHandle);
      } else if (targetFolderType === 'gdrive' && targetFolderId) {
        await saveModularProjectToGoogleDrive(currentProjectToLink, targetFolderId, targetFolderName);
        handleSetGDriveTargetFolder(targetFolderId, targetFolderName);
      } else if (targetFolderType === 'onedrive' && targetFolderId) {
        await saveModularProjectToOneDrive(currentProjectToLink, targetFolderId, targetFolderName);
        handleSetOneDriveTargetFolder(targetFolderId, targetFolderName);
      }

      saveActiveMasonProject(currentProjectToLink);
      if (onProjectSaved) onProjectSaved(currentProjectToLink);
      if (onShowToast) onShowToast(`Overwrote folder and linked project "${currentProjectToLink.name}"!`, 'success');
      setDetectedProjectConflict(null);
      onClose();
    } catch (err: any) {
      if (onShowToast) onShowToast(`Overwrite failed: ${err.message}`, 'error');
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const executeLoadFoundProjectConflict = async () => {
    if (!detectedProjectConflict) return;
    setIsResolvingConflict(true);
    try {
      const { targetFolderType, dirHandle, targetFolderId, targetFolderName, foundProject } = detectedProjectConflict;
      
      const linkedFoundProject: MasonProject = {
        ...foundProject,
        updatedAt: foundProject.updatedAt || new Date().toISOString(),
        storageLocation: targetFolderType === 'local_directory' ? {
          type: 'local_directory',
          displayName: `Local Folder (${targetFolderName})`,
          targetFolderName: targetFolderName,
          targetId: targetFolderName,
          fileName: `${foundProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mason`,
          lastSyncedAt: foundProject.storageLocation?.lastSyncedAt || foundProject.updatedAt || new Date().toISOString(),
          isAutoSyncEnabled: true
        } : {
          type: targetFolderType,
          displayName: `${targetFolderType === 'gdrive' ? 'Google Drive' : 'OneDrive'} Folder (${targetFolderName})`,
          targetFolderId: targetFolderId || 'root',
          targetFolderName: targetFolderName,
          lastSyncedAt: foundProject.storageLocation?.lastSyncedAt || foundProject.updatedAt || new Date().toISOString(),
          isAutoSyncEnabled: true
        }
      };

      if (targetFolderType === 'local_directory' && dirHandle) {
        setActiveFileSystemDirHandle(dirHandle);
      } else if (targetFolderType === 'gdrive' && targetFolderId) {
        handleSetGDriveTargetFolder(targetFolderId, targetFolderName);
      } else if (targetFolderType === 'onedrive' && targetFolderId) {
        handleSetOneDriveTargetFolder(targetFolderId, targetFolderName);
      }

      saveActiveMasonProject(linkedFoundProject, 'Load Found Project', undefined, { preserveUpdatedAt: true, skipBackups: true });

      if (onImportBundle) {
        onImportBundle(linkedFoundProject);
      } else if (onLoadProject) {
        onLoadProject(linkedFoundProject as any);
      }

      if (onShowToast) onShowToast(`Loaded and linked project "${linkedFoundProject.name}"!`, 'success');
      setDetectedProjectConflict(null);
      onClose();
    } catch (err: any) {
      if (onShowToast) onShowToast(`Failed to load found project: ${err.message}`, 'error');
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleDownloadBackupRecord = async (item: BackupFileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await downloadBackupFileToClient(item);
      if (onShowToast) onShowToast(`Downloaded backup "${item.name}"`, 'info');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Download failed: ${err.message}`, 'error');
    }
  };

  const refreshCloudState = async () => {
    // Refresh Google Drive Token & Info
    const gToken = getGoogleDriveToken();
    setGdriveToken(gToken);
    setGdriveUser(getGoogleDriveUser());
    const gSelected = getGoogleDriveSelectedFolder();
    setGdriveSelectedTarget(gSelected);

    if (gToken) {
      fetchGDriveFolder(gdriveCurrentFolder.id);
    }

    // Refresh OneDrive Token & Info
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
    setLoadingCloud(true);
    setGdriveStatusMsg(null);
    try {
      const items = await listGoogleDriveFolderContents(folderId);
      setGdriveFolderItems(items);
    } catch (e: any) {
      setGdriveStatusMsg(`Folder list error: ${e.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  const fetchAllGDriveFolders = async () => {
    setLoadingCloud(true);
    try {
      const folders = await listAllGoogleDriveFolders();
      setGdriveAllFolders(folders);
      setCloudViewMode('all_folders');
    } catch (e: any) {
      setGdriveStatusMsg(`Could not fetch folder index: ${e.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  const fetchOneDriveFolder = async (folderId: string | null) => {
    setLoadingCloud(true);
    setOnedriveStatusMsg(null);
    try {
      const items = await listOneDriveFolderContents(folderId);
      setOnedriveFolderItems(items);
    } catch (e: any) {
      setOnedriveStatusMsg(`OneDrive folder list error: ${e.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Navigate deeper inside folders explorer
  const handleNavigateToFolder = (folder: DriveItem | OneDriveItem) => {
    const nextCrumb = { id: folder.id, name: folder.name };
    if (activeCloudProvider === 'gdrive') {
      const nextStack = [...gdrivePathStack, nextCrumb];
      setGdrivePathStack(nextStack);
      setGdriveCurrentFolder(nextCrumb);
      fetchGDriveFolder(folder.id);
    } else {
      const nextStack = [...onedrivePathStack, nextCrumb];
      setOnedrivePathStack(nextStack);
      setOnedriveCurrentFolder(nextCrumb);
      fetchOneDriveFolder(folder.id);
    }
    setSearchQuery('');
    setSaveSuccessMsg(null);
  };

  // Go backwards in breadcrumb chain
  const handleJumpToBreadcrumb = (index: number) => {
    if (activeCloudProvider === 'gdrive') {
      if (index >= gdrivePathStack.length) return;
      const nextStack = gdrivePathStack.slice(0, index + 1);
      setGdrivePathStack(nextStack);
      setGdriveCurrentFolder(nextStack[index]);
      fetchGDriveFolder(nextStack[index].id);
    } else {
      if (index >= onedrivePathStack.length) return;
      const nextStack = onedrivePathStack.slice(0, index + 1);
      setOnedrivePathStack(nextStack);
      setOnedriveCurrentFolder(nextStack[index]);
      fetchOneDriveFolder(nextStack[index].id);
    }
    setSearchQuery('');
    setSaveSuccessMsg(null);
  };

  // Set the folder as the target save destination
  const handleSetGDriveTargetFolder = (id: string | null, name: string) => {
    const target = { id, name };
    setGoogleDriveSelectedFolder(id, name);
    setGdriveSelectedTarget(target);
    if (onShowToast) onShowToast(`Selected GDrive folder: ${name}`, 'success');
  };

  const handleSetOneDriveTargetFolder = (id: string | null, name: string) => {
    const target = { id, name };
    setOneDriveSelectedFolder(id, name);
    setOnedriveSelectedTarget(target);
    if (onShowToast) onShowToast(`Selected OneDrive folder: ${name}`, 'success');
  };

  // Perform a new folder creation in active directory
  const handleCreateNewCloudFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoadingCloud(true);
    const name = newFolderName.trim();
    try {
      if (activeCloudProvider === 'gdrive') {
        const parentId = gdriveCurrentFolder.id;
        const res = await createGoogleDriveFolder(name, parentId);
        setGdriveStatusMsg(`Successfully created folder "${res.name}"!`);
        setNewFolderName('');
        setShowCreateFolder(false);
        fetchGDriveFolder(parentId);
      } else {
        const parentId = onedriveCurrentFolder.id;
        const res = await createOneDriveFolder(name, parentId);
        setOnedriveStatusMsg(`Successfully created folder "${res.name}"!`);
        setNewFolderName('');
        setShowCreateFolder(false);
        fetchOneDriveFolder(parentId);
      }
    } catch (err: any) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Creation failed: ${err.message}`);
      if (activeCloudProvider === 'onedrive') setOnedriveStatusMsg(`Creation failed: ${err.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Authenticate Drive services
  const handleAuthCloud = async () => {
    setLoadingCloud(true);
    try {
      if (activeCloudProvider === 'gdrive') {
        await authenticateGoogleDrive();
      } else {
        await authenticateOneDrive();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Authentication failed: ${err.message}`, 'error');
    } finally {
      setLoadingCloud(false);
      refreshCloudState();
    }
  };

  // Disconnect / logout Drive service
  const handleDisconnectCloud = () => {
    if (activeCloudProvider === 'gdrive') {
      disconnectGoogleDrive();
      setGdriveToken(null);
      setGdriveUser(null);
      setGdriveFolderItems([]);
    } else {
      disconnectOneDrive();
      setOnedriveToken(null);
      setOnedriveUser(null);
      setOnedriveFolderItems([]);
    }
    if (onShowToast) onShowToast(`Disconnected ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'}!`, 'info');
  };

  // Drag and drop asset upload helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Select item from Cloud or Local
  const handleCloudFileClick = async (item: DriveItem | OneDriveItem) => {
    if (item.isFolder) {
      handleNavigateToFolder(item);
      return;
    }

    setSelectedCloudItem(item);
    setLoadingPreview(true);
    setSelectedImageDataUrl(null);
    setSelectedImageDims(null);

    const baseName = item.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
    setCustomSpriteName(baseName || 'Imported Sprite');

    try {
      let url: string | null = null;
      if (activeCloudProvider === 'gdrive') {
        url = await downloadFileAsDataUrlFromGoogleDrive(item.id);
      } else if (activeCloudProvider === 'onedrive') {
        url = await downloadFileAsDataUrlFromOneDrive({ id: item.id, downloadUrl: (item as any).downloadUrl });
      }

      if (url) {
        setSelectedImageDataUrl(url);
        const img = new Image();
        img.onload = () => {
          setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = url;
      }
    } catch (err: any) {
      console.warn('Failed to load file preview:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to download preview from cloud', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSelectVirtualItem = (item: VirtualDriveItem) => {
    setSelectedCloudItem(item);
    setSelectedImageDataUrl(item.dataUrl);
    const cleanBaseName = (item.displayName || item.name).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
    setCustomSpriteName(cleanBaseName || 'Virtual Asset');

    if (item.width && item.height) {
      setSelectedImageDims({ width: item.width, height: item.height });
    } else {
      const img = new Image();
      img.onload = () => {
        setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = item.dataUrl;
    }
  };

  // Confirmation functions for Import Assets
  const handleConfirmSingleImageImport = () => {
    if (!selectedImageDataUrl || !selectedCloudItem) return;
    const finalName = customSpriteName.trim() || selectedCloudItem.name.replace(/\.[^.]+$/, '');
    if (onImportSingleImage) {
      onImportSingleImage(selectedImageDataUrl, selectedCloudItem.name, targetMode, finalName);
    }
    if (onShowToast) onShowToast(`Loaded "${finalName}" successfully!`, 'success');
    onClose();
  };

  const handleConfirmSpritesheetImport = () => {
    if (!selectedImageDataUrl || !selectedCloudItem) return;
    const finalName = customSpriteName.trim() || selectedCloudItem.name.replace(/\.[^.]+$/, '');
    if (onImportSpritesheet) {
      onImportSpritesheet(selectedImageDataUrl, selectedCloudItem.name, targetMode, finalName);
    }
    if (onShowToast) onShowToast(`Spritesheet "${finalName}" imported!`, 'success');
    onClose();
  };

  const handleConfirmSelectForSlicing = () => {
    if (!selectedImageDataUrl || !selectedCloudItem) return;
    const finalName = customSpriteName.trim() || selectedCloudItem.name.replace(/\.[^.]+$/, '');
    if (onSelectImage) {
      onSelectImage(selectedImageDataUrl, selectedCloudItem.name);
    } else if (onImportSingleImage) {
      onImportSingleImage(selectedImageDataUrl, selectedCloudItem.name, 'new', finalName);
    }
    onClose();
  };

  // Perform Local Save/Export (.mason download)
  const handleLocalFileDownload = () => {
    if (saveFilePayload) {
      const blob = new Blob([saveFilePayload.content], { type: saveFilePayload.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = customSaveFileName.trim() || saveFilePayload.name;
      link.click();
      URL.revokeObjectURL(url);
      if (onShowToast) onShowToast(`Downloaded "${link.download}" successfully!`, 'success');
      onClose();
      return;
    }

    if (!currentProject) {
      if (onShowToast) onShowToast('No project open to download.', 'error');
      return;
    }

    // Export complete project bundle
    const rawProject = currentProject.fullMasonProject || currentProject;
    const finalName = customSaveFileName.trim() || `${currentProject.name}.mason`;
    const cleanProjectName = finalName.replace(/\.mason(\.json)?$/i, '');
    
    const projectToSave: MasonProject = {
      ...(rawProject as any),
      name: cleanProjectName || rawProject.name,
      engineVersion: MASON_VERSION,
      updatedAt: new Date().toISOString()
    };

    const bundleStr = JSON.stringify(projectToSave, null, 2);
    const blob = new Blob([bundleStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    link.click();
    URL.revokeObjectURL(url);

    if (action === 'save_project' && onProjectSaved) {
      onProjectSaved(projectToSave);
    }

    if (onShowToast) onShowToast(`Downloaded project bundle "${finalName}"!`, 'success');
    onClose();
  };

  // Link Active Project to a Local Directory (Modular Multi-File Storage - Step 1)
  const handleLinkLocalDirectorySave = async () => {
    if (!currentProject) {
      if (onShowToast) onShowToast('No project open to link.', 'error');
      return;
    }
    try {
      const rawProject = currentProject.fullMasonProject || currentProject;
      const linked = await linkProjectToLocalDirectory(currentProject.name);
      if (!linked) return; // User cancelled

      const projectToSave: MasonProject = {
        ...(rawProject as any),
        storageLocation: linked.location,
        engineVersion: MASON_VERSION,
        updatedAt: new Date().toISOString()
      };

      // Check if folder already contains a project manifest
      const existingProject = await checkExistingLocalDirProject(linked.handle);
      if (existingProject) {
        setDetectedProjectConflict({
          targetFolderType: 'local_directory',
          targetFolderName: linked.handle.name,
          dirHandle: linked.handle,
          foundProject: existingProject,
          currentProjectToLink: projectToSave
        });
        return;
      }

      const saveRes = await saveProjectToLinkedLocation(projectToSave);
      if (!saveRes.success) {
        if (onShowToast) onShowToast(`Save failed: ${saveRes.error}`, 'error');
        return;
      }

      if (onProjectSaved) onProjectSaved(projectToSave);
      if (onShowToast) onShowToast(`Linked project to folder "${linked.location.targetFolderName}" with modular files!`, 'success');
      onClose();
    } catch (err: any) {
      if (onShowToast) onShowToast(`Folder linking failed: ${err.message}`, 'error');
    }
  };

  // Open & Load a Modular Project Directory from Disk (Step 1)
  const handleOpenModularDirectory = async () => {
    if (!isDirectoryAccessSupported()) {
      alert('Directory Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      if (!dirHandle) return;

      setActiveFileSystemDirHandle(dirHandle);

      const loadedProject = await readModularProjectFromDirectory(dirHandle);
      const fileVersion = (loadedProject as any).engineVersion || (loadedProject as any).version;

      checkVersionAndProceed(fileVersion, loadedProject.name, () => {
        if (onImportBundle) {
          onImportBundle(loadedProject);
          if (onShowToast) onShowToast(`Opened modular project "${loadedProject.name}" from local folder!`, 'success');
          onClose();
        } else if (onLoadProject) {
          onLoadProject(loadedProject as any);
          if (onShowToast) onShowToast(`Opened modular project "${loadedProject.name}" from local folder!`, 'success');
          onClose();
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        if (onShowToast) onShowToast(`Failed to read folder: ${err.message}`, 'error');
      }
    }
  };

  // Local file input loaders
  const handleLocalProjectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as MasonProject;
        if (parsed && parsed.id && parsed.fileSystem) {
          const fileVersion = (parsed as any).engineVersion || (parsed as any).engine_version || (parsed as any).masonVersion || (parsed as any).version;
          checkVersionAndProceed(fileVersion, parsed.name || file.name, () => {
            if (onImportBundle) {
              onImportBundle(parsed);
              if (onShowToast) onShowToast(`Imported project "${parsed.name}" from local file!`, 'success');
              onClose();
            }
          });
        } else {
          alert('Invalid Mason project bundle format.');
        }
      } catch (err) {
        console.error('Failed to parse project file:', err);
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleLocalAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedCloudItem({
        id: `local_${Date.now()}`,
        name: file.name,
        isFolder: false,
        mimeType: file.type || 'image/png'
      } as any);
      setSelectedImageDataUrl(dataUrl);

      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
      setCustomSpriteName(baseName || 'Uploaded Asset');

      const img = new Image();
      img.onload = () => {
        setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDropLocalFile = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (action === 'load_project') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as MasonProject;
          if (parsed && parsed.id && parsed.fileSystem) {
            if (onImportBundle) {
              onImportBundle(parsed);
              if (onShowToast) onShowToast(`Imported project "${parsed.name}" successfully!`, 'success');
              onClose();
            }
          } else {
            if (onShowToast) onShowToast('Invalid project format', 'error');
          }
        } catch (err) {
          if (onShowToast) onShowToast('Failed to parse file', 'error');
        }
      };
      reader.readAsText(file);
    } else if (action === 'import_asset') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedCloudItem({
          id: `local_${Date.now()}`,
          name: file.name,
          isFolder: false,
          mimeType: file.type || 'image/png'
        } as any);
        setSelectedImageDataUrl(dataUrl);

        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
        setCustomSpriteName(baseName || 'Dropped Asset');

        const img = new Image();
        img.onload = () => {
          setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } else if (action === 'import_profile') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content && onImportProfileConfig) {
          onImportProfileConfig(content);
          if (onShowToast) onShowToast('Imported profile configuration!', 'success');
          onClose();
        }
      };
      reader.readAsText(file);
    }
  };

  // Perform Cloud Save Project or custom file payloads
  const handleCloudSaveConfirm = async () => {
    const token = activeCloudProvider === 'gdrive' ? gdriveToken : onedriveToken;
    if (!token) {
      if (onShowToast) onShowToast('Please connect to your cloud account first.', 'warning');
      return;
    }

    const folderId = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.id : onedriveCurrentFolder.id;
    const folderName = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.name : onedriveCurrentFolder.name;

    setLoadingCloud(true);
    const finalFileName = customSaveFileName.trim() || (saveFilePayload ? saveFilePayload.name : `${(currentProject?.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_')}.mason`);

    if (saveFilePayload) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Saving file "${finalFileName}" into Google Drive...`);
      else setOnedriveStatusMsg(`Saving file "${finalFileName}" into OneDrive...`);

      try {
        const saved = activeCloudProvider === 'gdrive' 
          ? await saveFileToGoogleDrive(finalFileName, saveFilePayload.content, saveFilePayload.mimeType, { targetFolderId: folderId })
          : await saveFileToOneDrive(finalFileName, saveFilePayload.content, saveFilePayload.mimeType, { targetFolderId: folderId });

        setSaveSuccessMsg(`Successfully saved file "${saved.name}" to "${folderName}"!`);
        if (activeCloudProvider === 'gdrive') {
          setGdriveStatusMsg(`Successfully saved "${saved.name}"!`);
          handleSetGDriveTargetFolder(folderId, folderName);
          fetchGDriveFolder(folderId);
        } else {
          setOnedriveStatusMsg(`Successfully saved "${saved.name}"!`);
          handleSetOneDriveTargetFolder(folderId, folderName);
          fetchOneDriveFolder(folderId);
        }
        if (onShowToast) onShowToast(`Saved file "${saved.name}" to cloud drive folder "${folderName}"!`, 'success');
      } catch (err: any) {
        if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Save failed: ${err.message}`);
        else setOnedriveStatusMsg(`Save failed: ${err.message}`);
      } finally {
        setLoadingCloud(false);
      }
      return;
    }

    if (!currentProject) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg('Save failed: No active project data to save.');
      else setOnedriveStatusMsg('Save failed: No active project data to save.');
      setLoadingCloud(false);
      return;
    }

    if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Saving modular workspace folder "${folderName}" into Google Drive...`);
    else setOnedriveStatusMsg(`Saving modular workspace folder "${folderName}" to OneDrive...`);

    try {
      const rawProject = currentProject.fullMasonProject || currentProject;
      const cleanProjectName = finalFileName.replace(/\.mason(\.json)?$/i, '');
      const storageLocation: LinkedStorageLocation = {
        type: activeCloudProvider === 'gdrive' ? 'gdrive' : 'onedrive',
        displayName: `${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} Folder (${folderName || 'Workspace Folder'})`,
        targetFolderId: folderId || 'root',
        targetFolderName: folderName || 'Workspace Folder',
        lastSyncedAt: new Date().toISOString(),
        isAutoSyncEnabled: true
      };

      const projectToSave: MasonProject = {
        ...(rawProject as any),
        name: cleanProjectName || rawProject.name,
        storageLocation,
        engineVersion: MASON_VERSION,
        updatedAt: new Date().toISOString()
      };

      // Check if folder already contains a project manifest
      const existingProject = activeCloudProvider === 'gdrive'
        ? await checkExistingGDriveDirProject(folderId || 'root', folderName)
        : await checkExistingOneDriveDirProject(folderId || 'root', folderName);

      if (existingProject) {
        setDetectedProjectConflict({
          targetFolderType: activeCloudProvider,
          targetFolderName: folderName || 'Workspace Folder',
          targetFolderId: folderId || 'root',
          foundProject: existingProject,
          currentProjectToLink: projectToSave
        });
        setLoadingCloud(false);
        return;
      }

      if (activeCloudProvider === 'gdrive') {
        await saveModularProjectToGoogleDrive(projectToSave, folderId || 'root', folderName);
        handleSetGDriveTargetFolder(folderId, folderName);
        fetchGDriveFolder(folderId);
      } else {
        await saveModularProjectToOneDrive(projectToSave, folderId || 'root', folderName);
        handleSetOneDriveTargetFolder(folderId, folderName);
        fetchOneDriveFolder(folderId);
      }

      if (action === 'save_project' && onProjectSaved) {
        onProjectSaved(projectToSave);
      }

      setSaveSuccessMsg(`Saved modular workspace project "${projectToSave.name}" to cloud folder "${folderName}"!`);
      if (onShowToast) onShowToast(`Linked & saved project to cloud folder "${folderName}"!`, 'success');
      onClose();
    } catch (err: any) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Save failed: ${err.message}`);
      else setOnedriveStatusMsg(`Save failed: ${err.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Link current Cloud Drive folder as active project workspace (Modular multi-file storage)
  const handleLinkCloudDirectoryWorkspace = async () => {
    if (!currentProject) {
      if (onShowToast) onShowToast('No project open to link.', 'error');
      return;
    }
    const token = activeCloudProvider === 'gdrive' ? gdriveToken : onedriveToken;
    if (!token) {
      if (onShowToast) onShowToast(`Please connect your ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} account.`, 'warning');
      return;
    }

    const folderId = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.id : onedriveCurrentFolder.id;
    const folderName = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.name : onedriveCurrentFolder.name;

    setLoadingCloud(true);
    if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Initializing modular workspace folder "${folderName}" in Google Drive...`);
    else setOnedriveStatusMsg(`Initializing modular workspace folder "${folderName}" in OneDrive...`);

    try {
      const rawProject = currentProject.fullMasonProject || currentProject;
      const updatedStorageLoc: LinkedStorageLocation = {
        type: activeCloudProvider === 'gdrive' ? 'gdrive' : 'onedrive',
        displayName: `${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} Folder (${folderName || 'Workspace Folder'})`,
        targetFolderId: folderId || 'root',
        targetFolderName: folderName || 'Workspace Folder',
        lastSyncedAt: new Date().toISOString(),
        isAutoSyncEnabled: true
      };

      const projectToSave: MasonProject = {
        ...(rawProject as any),
        storageLocation: updatedStorageLoc,
        engineVersion: MASON_VERSION,
        updatedAt: new Date().toISOString()
      };

      // Check if cloud folder already contains a project manifest
      const existingProject = activeCloudProvider === 'gdrive'
        ? await checkExistingGDriveDirProject(folderId || 'root', folderName)
        : await checkExistingOneDriveDirProject(folderId || 'root', folderName);

      if (existingProject) {
        setDetectedProjectConflict({
          targetFolderType: activeCloudProvider,
          targetFolderName: folderName || 'Workspace Folder',
          targetFolderId: folderId || 'root',
          foundProject: existingProject,
          currentProjectToLink: projectToSave
        });
        setLoadingCloud(false);
        return;
      }

      if (activeCloudProvider === 'gdrive') {
        await saveModularProjectToGoogleDrive(projectToSave, folderId || 'root', folderName);
        handleSetGDriveTargetFolder(folderId, folderName);
        fetchGDriveFolder(folderId);
      } else {
        await saveModularProjectToOneDrive(projectToSave, folderId || 'root', folderName);
        handleSetOneDriveTargetFolder(folderId, folderName);
        fetchOneDriveFolder(folderId);
      }

      if (onProjectSaved) onProjectSaved(projectToSave);
      if (onShowToast) onShowToast(`Linked project "${projectToSave.name}" to ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} workspace folder "${folderName}"!`, 'success');
      onClose();
    } catch (err: any) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Linking failed: ${err.message}`);
      else setOnedriveStatusMsg(`Linking failed: ${err.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Open & Load a modular workspace folder from Cloud Drive
  const handleOpenCloudDirectoryWorkspace = async () => {
    const token = activeCloudProvider === 'gdrive' ? gdriveToken : onedriveToken;
    if (!token) {
      if (onShowToast) onShowToast(`Please connect your ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} account.`, 'warning');
      return;
    }

    const folderId = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.id : onedriveCurrentFolder.id;
    const folderName = activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.name : onedriveCurrentFolder.name;

    setLoadingCloud(true);
    if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Reading modular workspace folder "${folderName}" from Google Drive...`);
    else setOnedriveStatusMsg(`Reading modular workspace folder "${folderName}" from OneDrive...`);

    try {
      const loaded = activeCloudProvider === 'gdrive'
        ? await readModularProjectFromGoogleDrive(folderId || 'root', folderName)
        : await readModularProjectFromOneDrive(folderId || 'root', folderName);

      const fileVersion = loaded.engineVersion || loaded.version;
      checkVersionAndProceed(fileVersion, loaded.name || folderName, () => {
        if (onImportBundle) {
          onImportBundle(loaded);
          if (onShowToast) onShowToast(`Opened modular workspace folder "${folderName}"!`, 'success');
          onClose();
        } else if (onLoadProject) {
          onLoadProject(loaded);
          if (onShowToast) onShowToast(`Opened modular workspace folder "${folderName}"!`, 'success');
          onClose();
        }
      });
    } catch (err: any) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Open workspace failed: ${err.message}`);
      else setOnedriveStatusMsg(`Open workspace failed: ${err.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Perform Loading from Cloud
  const handleCloudLoadConfirm = async (item: DriveItem | OneDriveItem | VirtualDriveItem) => {
    setLoadingCloud(true);
    if (activeCloudProvider === 'gdrive') setGdriveStatusMsg('Downloading file from Google Drive...');
    else setOnedriveStatusMsg('Downloading file from OneDrive...');

    try {
      if (action === 'import_profile') {
        const text = activeCloudProvider === 'gdrive'
          ? await downloadFileAsTextFromGoogleDrive(item.id)
          : await downloadFileAsTextFromOneDrive({ id: item.id, downloadUrl: (item as any).downloadUrl });

        if (text && onImportProfileConfig) {
          onImportProfileConfig(text);
          if (onShowToast) onShowToast(`Imported profile configuration from ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'}!`, 'success');
          onClose();
        }
        return;
      }

      const loaded = activeCloudProvider === 'gdrive'
        ? await loadProjectFromGoogleDrive(item.id)
        : await loadProjectFromOneDrive({ id: item.id, downloadUrl: (item as any).downloadUrl });

      if (loaded) {
        (loaded as any).storageLocation = {
          type: activeCloudProvider === 'gdrive' ? 'gdrive' : 'onedrive',
          displayName: `${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} (${item.name})`,
          targetId: item.id,
          fileName: item.name,
          lastSyncedAt: new Date().toISOString(),
          isAutoSyncEnabled: true
        };
      }

      const fileVersion = (loaded as any).engineVersion || (loaded as any).engine_version || (loaded as any).masonVersion || (loaded as any).version;
      checkVersionAndProceed(fileVersion, loaded.name || item.name, () => {
        if (onLoadProject) {
          onLoadProject(loaded);
          if (onShowToast) onShowToast(`Successfully loaded project "${loaded.name}" from Cloud!`, 'success');
          onClose();
        }
      });
    } catch (err: any) {
      if (activeCloudProvider === 'gdrive') setGdriveStatusMsg(`Load failed: ${err.message}`);
      else setOnedriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setLoadingCloud(false);
    }
  };

  // Check if item is valid file for current view filters
  const filterCloudOrVirtualItem = (name: string, mime?: string) => {
    const matchesSearch = !searchQuery.trim() || name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (action === 'import_asset') {
      const lower = name.toLowerCase();
      return (
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.bmp') ||
        lower.endsWith('.svg') ||
        (mime && mime.startsWith('image/'))
      );
    }

    if (action === 'load_project') {
      const lower = name.toLowerCase();
      return lower.endsWith('.mason') || lower.endsWith('.json') || lower.endsWith('.sprite');
    }

    if (action === 'import_profile') {
      const lower = name.toLowerCase();
      return lower.endsWith('.profile') || lower.endsWith('.json');
    }

    return true;
  };

  // Lists files in folders
  const currentCloudFiles = activeCloudProvider === 'gdrive' ? gdriveFolderItems : onedriveFolderItems;
  const filteredCloudFiles = currentCloudFiles.filter(item => {
    if (item.isFolder) {
      return !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return filterCloudOrVirtualItem(item.name, (item as any).mimeType);
  });

  const filteredVirtualDriveItems = virtualDriveItems.filter(item => filterCloudOrVirtualItem(item.displayName || item.name, item.mimeType));

  // Determine user friendly display text
  const actionHeadline = useMemo(() => {
    switch (action) {
      case 'save_project': return 'Save Project';
      case 'load_project': return 'Load Project Workspace';
      case 'import_asset': return 'Import Sprites & Assets';
      case 'export_file': return 'Export Config / Data';
      case 'import_profile': return 'Import Profile Configuration';
      default: return 'Files Engine Manager';
    }
  }, [action]);

  const actionDescription = useMemo(() => {
    switch (action) {
      case 'save_project': return 'Secure your active project modules, biomes, prefabs, and configs to Local slots or Cloud directories.';
      case 'load_project': return 'Retrieve local browser backups, upload a project bundle, or pull direct from your Cloud drives.';
      case 'import_asset': return 'Browse and load raw PNG sprites, frames, or spritesheets to build workspace objects.';
      case 'export_file': return 'Save profiles config file directly to local folder or secure cloud directories.';
      case 'import_profile': return 'Select or upload a saved profile .profile file from Local Storage, OneDrive, or Google Drive.';
      default: return 'Core sub-module for browsing, saving, loading, and importing all file payloads.';
    }
  }, [action]);

  // Primary contextual button label & handler logic
  const primaryButtonLabel = useMemo(() => {
    switch (action) {
      case 'save_project':
        if (activeStorageProvider === 'local') return 'Save to Local Disk';
        if (activeStorageProvider === 'cloud') return `Save to ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'}`;
        return 'Save Snapshot';
      case 'export_file':
        if (activeStorageProvider === 'local') return 'Export File to Disk';
        if (activeStorageProvider === 'cloud') return `Export to ${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'}`;
        return 'Export File';
      case 'load_project':
        if (activeStorageProvider === 'local') return 'Browse .mason File';
        if (selectedCloudItem) return 'Load Selected File';
        return 'Open / Load Project';
      case 'import_asset':
        if (selectedImageDataUrl || selectedCloudItem) return 'Import Selected Asset';
        return 'Import Asset';
      case 'import_profile':
        if (activeStorageProvider === 'local') return 'Browse .profile File';
        if (selectedCloudItem) return 'Import Selected Profile';
        return 'Import Profile Config';
      default:
        return 'Execute Action';
    }
  }, [action, activeStorageProvider, activeCloudProvider, selectedCloudItem, selectedImageDataUrl]);

  const isPrimaryActionDisabled = useMemo(() => {
    if (loadingCloud) return true;
    if (action === 'save_project' || action === 'export_file') {
      if (activeStorageProvider === 'cloud') {
        const token = activeCloudProvider === 'gdrive' ? gdriveToken : onedriveToken;
        return !token;
      }
      return false;
    }
    if (action === 'load_project' || action === 'import_profile') {
      if (activeStorageProvider === 'local') return false;
      if (activeStorageProvider === 'cloud') return !selectedCloudItem;
      return true;
    }
    if (action === 'import_asset') {
      return !selectedImageDataUrl && !selectedCloudItem;
    }
    return false;
  }, [action, activeStorageProvider, activeCloudProvider, gdriveToken, onedriveToken, selectedCloudItem, selectedImageDataUrl, loadingCloud]);

  const handlePrimaryActionClick = () => {
    if (action === 'save_project' || action === 'export_file') {
      if (activeStorageProvider === 'local') handleLocalFileDownload();
      else if (activeStorageProvider === 'cloud') handleCloudSaveConfirm();
      else handleTriggerManualBackup();
    } else if (action === 'load_project') {
      if (activeStorageProvider === 'local') {
        localProjectInputRef.current?.click();
      } else if (activeStorageProvider === 'cloud' && selectedCloudItem) {
        handleCloudLoadConfirm(selectedCloudItem);
      }
    } else if (action === 'import_profile') {
      if (activeStorageProvider === 'local') {
        localProfileInputRef.current?.click();
      } else if (activeStorageProvider === 'cloud' && selectedCloudItem) {
        handleCloudLoadConfirm(selectedCloudItem);
      }
    } else if (action === 'import_asset') {
      if (importMode === 'select_image' && onSelectImage) {
        handleConfirmSelectForSlicing();
      } else if (onImportSpritesheet) {
        handleConfirmSpritesheetImport();
      } else if (onImportSingleImage) {
        handleConfirmSingleImageImport();
      } else if (onSelectImage) {
        handleConfirmSelectForSlicing();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-750 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* TOP COMPANION HEADER */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {action === 'import_asset' ? <ImageIcon size={20} /> : action === 'save_project' ? <Download size={20} /> : <Upload size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-neutral-100 uppercase tracking-wide">
                  {actionHeadline}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Files Sub-Module
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-snug mt-0.5 max-w-xl">
                {actionDescription}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* FILE MANAGER MAIN WORKING CONTAINER */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* WINDOWS EXPLORER LEFT SIDEBAR DIRECTORY TREE */}
          <div className="w-60 sm:w-64 border-r border-neutral-800 bg-neutral-950/60 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto select-none">
            
            {/* ACTIVE LINKED WORKSPACE SHORTCUT */}
            {activeWorkspaceProject?.storageLocation && activeWorkspaceProject.storageLocation.type !== 'local_idb' && (
              <div className="space-y-1 pb-2 border-b border-neutral-850">
                <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider px-2 flex items-center justify-between">
                  <span className="flex items-center gap-1"><FolderSync size={11} className="text-emerald-400" /> Linked Workspace</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {activeWorkspaceProject.storageLocation.type === 'onedrive' ? 'OneDrive' : activeWorkspaceProject.storageLocation.type === 'gdrive' ? 'GDrive' : 'Local'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleJumpToLinkedFolder}
                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                    isViewingLinkedFolder
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-400/90 hover:bg-emerald-900/40 hover:text-emerald-200'
                  }`}
                  title={`Jump directly to linked folder: ${activeWorkspaceProject.storageLocation.targetFolderName || activeWorkspaceProject.storageLocation.fileName || activeWorkspaceProject.storageLocation.displayName}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isViewingLinkedFolder ? 'text-emerald-300' : 'text-emerald-400'}`} />
                    <span className="truncate text-[11px] font-bold">
                      {activeWorkspaceProject.storageLocation.targetFolderName || activeWorkspaceProject.storageLocation.fileName || 'Linked Folder'}
                    </span>
                  </span>
                  {isViewingLinkedFolder && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </button>
              </div>
            )}

            {/* QUICK ACCESS / BOOKMARKS SECTION */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider px-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> Quick Access</span>
                <span className="text-[9px] font-mono text-neutral-600">({validBookmarks.length})</span>
              </div>
              {validBookmarks.length === 0 ? (
                <div className="px-2 py-1 text-[10px] text-neutral-600 italic">No bookmarked folders</div>
              ) : (
                <div className="space-y-0.5">
                  {validBookmarks.map(bm => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => handleJumpToBookmark(bm)}
                      className="w-full px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center justify-between group transition text-left"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Folder size={12} className="text-amber-400/80 shrink-0" />
                        <span className="truncate text-[11px]">{bm.label}</span>
                      </span>
                      <X
                        size={11}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 shrink-0 transition"
                        onClick={(e) => handleRemoveBookmark(e, bm.id, bm.label)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LOCATIONS / STORAGE DRIVES */}
            <div className="space-y-1 pt-2 border-t border-neutral-850">
              <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider px-2 flex items-center gap-1">
                <HardDrive size={11} className="text-blue-400" /> Locations
              </div>
              
              {/* Local Computer Disk */}
              <button
                type="button"
                onClick={() => {
                  setActiveStorageProvider('local');
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                  activeStorageProvider === 'local'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <HardDrive size={13} className="text-blue-400 shrink-0" />
                  <span className="truncate">Local Computer Disk</span>
                </span>
                <Upload size={11} className="text-neutral-500" />
              </button>

              {/* Google Drive */}
              <button
                type="button"
                onClick={() => {
                  setActiveStorageProvider('cloud');
                  setActiveCloudProviderState('gdrive');
                  setActiveCloudProvider('gdrive');
                  if (gdriveToken) {
                    setGdriveCurrentFolder({ id: null, name: 'My Drive (Root)' });
                    setGdrivePathStack([{ id: null, name: 'My Drive (Root)' }]);
                    fetchGDriveFolder(null);
                  }
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                  activeStorageProvider === 'cloud' && activeCloudProvider === 'gdrive'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Cloud size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">Google Drive</span>
                </span>
                {gdriveToken ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
                ) : (
                  <span className="text-[9px] font-mono text-neutral-500 bg-neutral-850 px-1.5 py-0.5 rounded border border-neutral-750 shrink-0">
                    Off
                  </span>
                )}
              </button>

              {/* Microsoft OneDrive */}
              <button
                type="button"
                onClick={() => {
                  setActiveStorageProvider('cloud');
                  setActiveCloudProviderState('onedrive');
                  setActiveCloudProvider('onedrive');
                  if (onedriveToken) {
                    setOnedriveCurrentFolder({ id: null, name: 'OneDrive Root (My Files)' });
                    setOnedrivePathStack([{ id: null, name: 'OneDrive Root (My Files)' }]);
                    fetchOneDriveFolder(null);
                  }
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                  activeStorageProvider === 'cloud' && activeCloudProvider === 'onedrive'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Cloud size={13} className="text-blue-400 shrink-0" />
                  <span className="truncate">Microsoft OneDrive</span>
                </span>
                {onedriveToken ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
                ) : (
                  <span className="text-[9px] font-mono text-neutral-500 bg-neutral-850 px-1.5 py-0.5 rounded border border-neutral-750 shrink-0">
                    Off
                  </span>
                )}
              </button>
            </div>

            {/* VIRTUAL DRIVE SECTION */}
            <div className="space-y-1 pt-2 border-t border-neutral-850">
              <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider px-2 flex items-center gap-1">
                <History size={11} className="text-purple-400" /> Virtual Workspace
              </div>

              {/* Assets Sub-node */}
              <button
                type="button"
                onClick={() => {
                  setActiveStorageProvider('virtual');
                  setVirtualSection('assets');
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                  activeStorageProvider === 'virtual' && virtualSection === 'assets'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <ImageIcon size={13} className="text-purple-400 shrink-0" />
                  <span className="truncate">Workspace Assets</span>
                </span>
                <span className="text-[9px] font-mono text-neutral-500">({virtualDriveItems.length})</span>
              </button>

              {/* Backups Sub-node */}
              <button
                type="button"
                onClick={() => {
                  setActiveStorageProvider('virtual');
                  setVirtualSection('backups');
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition text-left ${
                  activeStorageProvider === 'virtual' && virtualSection === 'backups'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Clock size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">Snapshots & Backups</span>
                </span>
                <span className="text-[9px] font-mono text-neutral-500">({backupsList.length})</span>
              </button>
            </div>

          </div>

          {/* MAIN WORKSPACE AREA */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-neutral-950/20">
            
            {/* SEARCH & FILTERS CONTROLS */}
            <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/20 shrink-0 gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder={
                    activeStorageProvider === 'virtual' 
                      ? "Search virtual items..." 
                      : activeStorageProvider === 'cloud' 
                        ? "Search cloud folder..." 
                        : "Search local indexes..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-amber-500/50 rounded-xl text-xs text-neutral-200 outline-none transition"
                />
              </div>
            </div>

            {/* TAB INTERFACES CONTENT VIEW */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* 📂 LOCAL DEVICE STORAGE PANEL */}
              {activeStorageProvider === 'local' && (
                <div className="space-y-6">
                  {/* Save Mode */}
                  {(action === 'save_project' || action === 'export_file') && (
                    <div className="space-y-5 max-w-2xl">
                      {/* Linked Local Folder (Modular Multi-File) Option */}
                      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                            <FolderSync className="w-4 h-4 text-emerald-400" /> Link to Local Project Folder (Modular Multi-File)
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                            Multi-User Safe
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Saves the project broken into modular files (<code className="text-emerald-300">maps/</code>, <code className="text-emerald-300">biomes/</code>, <code className="text-emerald-300">prefabs/</code>, <code className="text-emerald-300">sprites/</code>) inside a local folder. Direct Save (Ctrl+S) will write live modular updates and protect against multi-user file collision.
                        </p>
                        <button
                          type="button"
                          onClick={handleLinkLocalDirectorySave}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition active:scale-95"
                        >
                          <FolderOpen className="w-4 h-4" /> Select Local Folder & Link Project
                        </button>
                      </div>

                      {/* Standard Download to Device */}
                      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-850 space-y-3">
                        <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-amber-400" /> Download Standalone Bundle to Browser Downloads
                        </h4>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase text-neutral-400">File Output Name</label>
                          <input
                            type="text"
                            placeholder="Enter filename..."
                            value={customSaveFileName}
                            onChange={(e) => setCustomSaveFileName(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-200 outline-none focus:border-amber-500/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleLocalFileDownload}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" /> Download File to Device
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Load/Browse Mode */}
                  {action === 'load_project' && (
                    <div className="space-y-5 max-w-2xl">
                      {/* Open Modular Folder Option (Step 1) */}
                      <div
                        onClick={handleOpenModularDirectory}
                        className="p-6 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-emerald-500/60 bg-neutral-900/40 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
                      >
                        <FolderSync size={36} className="text-neutral-500 group-hover:text-emerald-400 transition" />
                        <div>
                          <div className="text-sm font-bold text-neutral-200">Open Modular Project Folder from Disk</div>
                          <p className="text-xs text-neutral-400 mt-1">Open and live-link a directory containing modular <code className="text-emerald-300 font-mono text-[11px]">maps/</code>, <code className="text-emerald-300 font-mono text-[11px]">biomes/</code>, <code className="text-emerald-300 font-mono text-[11px]">prefabs/</code> files</p>
                        </div>
                        <button
                          type="button"
                          className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/10 transition"
                        >
                          Select Project Folder
                        </button>
                      </div>

                      {/* Drag & Drop File Upload */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDropLocalFile}
                        onClick={() => localProjectInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-amber-500/50 bg-neutral-900/30 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
                      >
                        <Upload size={36} className="text-neutral-500 group-hover:text-amber-400 transition" />
                        <div>
                          <div className="text-sm font-bold text-neutral-200">Open Single .mason File from Disk</div>
                          <p className="text-xs text-neutral-400 mt-1">Select or drag-and-drop a monolithic <code className="text-amber-300 font-mono text-[11px]">.mason</code> bundle file</p>
                        </div>
                        <button
                          type="button"
                          className="mt-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition"
                        >
                          Browse Computer Files
                        </button>
                        <input
                          type="file"
                          ref={localProjectInputRef}
                          onChange={handleLocalProjectUpload}
                          accept=".mason,.mason.json,.json"
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Asset Import Mode */}
                  {action === 'import_asset' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                      {/* Local File Drag Drop Loader */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDropLocalFile}
                        onClick={() => localAssetInputRef.current?.click()}
                        className="p-8 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-amber-500/50 bg-neutral-900/20 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
                      >
                        <ImageIcon size={32} className="text-neutral-500 group-hover:text-amber-400 transition" />
                        <div>
                          <div className="text-xs font-bold text-neutral-200">Import Local Asset</div>
                          <p className="text-[10px] text-neutral-400 mt-1">Select or drop a PNG/JPG spritesheet from your device</p>
                        </div>
                        <input
                          type="file"
                          ref={localAssetInputRef}
                          onChange={handleLocalAssetUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      {/* Display Selected Image Calibration Preview directly */}
                      {selectedImageDataUrl && (
                        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3.5">
                          <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Asset Properties</h4>
                          <div className="max-h-40 flex justify-center bg-neutral-950 p-3 rounded-xl overflow-hidden border border-neutral-850">
                            <img
                              src={selectedImageDataUrl}
                              alt="Local preview"
                              className="max-h-full object-contain pixelated"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="space-y-1 text-xs text-neutral-300 font-mono">
                            <div>Dimensions: <span className="text-neutral-100">{selectedImageDims ? `${selectedImageDims.width}×${selectedImageDims.height}px` : 'Loading...'}</span></div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase text-neutral-400">Layer Name</label>
                            <input
                              type="text"
                              value={customSpriteName}
                              onChange={(e) => setCustomSpriteName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Import Mode */}
                  {action === 'import_profile' && (
                    <div className="space-y-5 max-w-2xl">
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDropLocalFile}
                        onClick={() => localProfileInputRef.current?.click()}
                        className="p-8 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-sky-500/50 bg-neutral-900/30 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
                      >
                        <Upload size={36} className="text-neutral-500 group-hover:text-sky-400 transition" />
                        <div>
                          <div className="text-sm font-bold text-neutral-200">Import Profile File from Disk</div>
                          <p className="text-xs text-neutral-400 mt-1">Select or drag-and-drop a saved <code className="text-sky-300 font-mono text-[11px]">.profile</code> (or <code className="text-neutral-400 font-mono text-[11px]">.json</code>) profile configuration file</p>
                        </div>
                        <button
                          type="button"
                          className="mt-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs shadow-lg shadow-sky-500/10 transition cursor-pointer"
                        >
                          Browse Computer Files
                        </button>
                        <input
                          type="file"
                          ref={localProfileInputRef}
                          onChange={handleLocalProfileUpload}
                          accept=".profile,.json,application/json"
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ☁️ CLOUD DRIVES EXPLORER PANEL */}
              {activeStorageProvider === 'cloud' && (
                <div className="space-y-4">
                  {((activeCloudProvider === 'gdrive' && !gdriveToken) || (activeCloudProvider === 'onedrive' && !onedriveToken)) ? (
                    <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-4 max-w-lg mx-auto my-8 shadow-xl">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                        <Cloud size={28} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-bold text-neutral-100">
                          {activeCloudProvider === 'gdrive' ? 'Google Drive' : 'Microsoft OneDrive'} is Not Connected
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
                          Connect your cloud account in Profile Settings to browse, load, save, and sync project workspaces directly with your cloud drive.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenProfileSettings) {
                              onOpenProfileSettings('config');
                            } else {
                              onShowToast?.('Open Profile Settings from the profile badge to connect cloud accounts.', 'info');
                            }
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
                        >
                          <Settings size={14} />
                          <span>Open Profile Settings ("Editor & App Defaults")</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveStorageProvider('local')}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition border border-neutral-700"
                        >
                          Use Local Storage
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      
                      {/* Nav paths / actions bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-neutral-800/60">
                        {/* Breadcrumbs */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 font-medium">
                          {(activeCloudProvider === 'gdrive' ? gdrivePathStack : onedrivePathStack).map((crumb, idx) => (
                            <React.Fragment key={crumb.id || idx}>
                              {idx > 0 && <ChevronRight size={12} className="text-neutral-600 shrink-0" />}
                              <button
                                type="button"
                                onClick={() => handleJumpToBreadcrumb(idx)}
                                className={`hover:text-amber-400 hover:underline truncate ${idx === (activeCloudProvider === 'gdrive' ? gdrivePathStack : onedrivePathStack).length - 1 ? 'font-bold text-neutral-200' : ''}`}
                              >
                                {crumb.name}
                              </button>
                            </React.Fragment>
                          ))}

                          {isViewingLinkedFolder && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold shadow-xs ml-1.5">
                              <FolderSync size={11} className="text-emerald-400 animate-pulse" />
                              <span>Linked Project Folder</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive triggers */}
                        <div className="flex items-center gap-1.5">
                          {/* Bookmark */}
                          <button
                            type="button"
                            onClick={handleToggleBookmarkCurrentLocation}
                            className={`p-1.5 rounded-lg border transition ${
                              isCurrentBookmarked 
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title={isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark current directory'}
                          >
                            <Star size={13} fill={isCurrentBookmarked ? 'currentColor' : 'none'} />
                          </button>

                          {/* New Folder */}
                          <button
                            type="button"
                            onClick={() => setShowCreateFolder(!showCreateFolder)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-neutral-300 text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <FolderPlus size={12} /> New Folder
                          </button>

                          {/* Link Project to Cloud Workspace Folder */}
                          {(action === 'save_project' || action === 'export_file') && (
                            <button
                              type="button"
                              onClick={handleLinkCloudDirectoryWorkspace}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
                              title="Set current Cloud Drive folder as active project workspace with modular multi-file structure"
                            >
                              <FolderSync size={13} /> Link Workspace Folder
                            </button>
                          )}

                          {/* Open Modular Cloud Workspace Folder */}
                          {action === 'load_project' && (
                            <button
                              type="button"
                              onClick={handleOpenCloudDirectoryWorkspace}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
                              title="Open current Cloud Drive folder as active modular project workspace"
                            >
                              <FolderOpen size={13} /> Open Workspace Folder
                            </button>
                          )}

                          {/* Quick Save button in Cloud */}
                          {(action === 'save_project' || action === 'export_file') && (
                            <button
                              type="button"
                              onClick={handleCloudSaveConfirm}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <Check size={12} /> Save Here
                            </button>
                          )}
                        </div>
                      </div>

                      {/* New folder creation popover input */}
                      {showCreateFolder && (
                        <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 max-w-sm flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-neutral-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCreateNewCloudFolder}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                          >
                            Create
                          </button>
                        </div>
                      )}

                      {/* Display Status / Save responses */}
                      {activeCloudProvider === 'gdrive' && gdriveStatusMsg && (
                        <div className="p-2.5 rounded-xl bg-neutral-900 text-neutral-400 text-[11px] border border-neutral-850 font-mono">
                          {gdriveStatusMsg}
                        </div>
                      )}
                      {activeCloudProvider === 'onedrive' && onedriveStatusMsg && (
                        <div className="p-2.5 rounded-xl bg-neutral-900 text-neutral-400 text-[11px] border border-neutral-850 font-mono">
                          {onedriveStatusMsg}
                        </div>
                      )}

                      {/* Dynamic Save Input Naming */}
                      {(action === 'save_project' || action === 'export_file') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end max-w-xl bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-neutral-400">Cloud Target File Name</label>
                            <input
                              type="text"
                              value={customSaveFileName}
                              onChange={(e) => setCustomSaveFileName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 rounded-xl text-xs text-neutral-200 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleCloudSaveConfirm}
                            className="py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
                          >
                            Execute Upload Save
                          </button>
                        </div>
                      )}

                      {/* Files/Folders Grid list */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Files Explorer column */}
                        <div className="md:col-span-2 border border-neutral-800 rounded-2xl bg-neutral-950/20 p-3 space-y-2">
                          <h5 className="text-[10px] font-bold uppercase text-neutral-400 px-1">
                            Directory Contents ({filteredCloudFiles.length})
                          </h5>

                          {loadingCloud ? (
                            <div className="p-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                              <RefreshCw size={14} className="animate-spin text-amber-500" /> Fetching cloud items...
                            </div>
                          ) : filteredCloudFiles.length === 0 ? (
                            <div className="p-12 rounded-xl bg-neutral-900/20 text-center text-xs text-neutral-500 border border-neutral-850/40">
                              Directory is empty or no files match search filter.
                            </div>
                          ) : (
                            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                              {filteredCloudFiles.map((item) => {
                                const isFolder = item.isFolder;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleCloudFileClick(item)}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                      selectedCloudItem?.id === item.id
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate pr-2">
                                      {isFolder ? (
                                        <Folder className={`w-4.5 h-4.5 shrink-0 ${item.id === activeWorkspaceProject?.storageLocation?.targetFolderId ? 'text-emerald-400' : 'text-blue-400'}`} />
                                      ) : (
                                        <FileCode className="w-4.5 h-4.5 text-neutral-400 shrink-0" />
                                      )}
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="block text-xs font-semibold text-neutral-200 hover:text-amber-400 truncate">
                                            {item.name}
                                          </span>
                                          {isFolder && item.id === activeWorkspaceProject?.storageLocation?.targetFolderId && (
                                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40 shrink-0">
                                              Linked Target
                                            </span>
                                          )}
                                        </div>
                                        {/* Timestamp logic */}
                                        <span className="block text-[9px] text-neutral-500 mt-0.5 font-mono">
                                          {isFolder ? 'Folder' : 'File'} • {item.modifiedTime ? `${new Date(item.modifiedTime).toLocaleDateString()} ${new Date(item.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Recent'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                      {/* Load project click shortcut */}
                                      {!isFolder && action === 'load_project' && (
                                        <button
                                          type="button"
                                          onClick={() => handleCloudLoadConfirm(item)}
                                          className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                                        >
                                          Load
                                        </button>
                                      )}
                                      
                                      {/* Delete item */}
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmTarget({ id: item.id, name: item.name, type: activeCloudProvider })}
                                        className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-850 transition"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Import Image preview column (only visible in import_asset action mode) */}
                        {action === 'import_asset' && (
                          <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 p-4 space-y-4">
                            <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Asset Preview</h5>
                            
                            {loadingPreview ? (
                              <div className="p-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Downloading preview...
                              </div>
                            ) : selectedImageDataUrl ? (
                              <div className="space-y-4">
                                <div className="max-h-40 flex justify-center bg-neutral-950 p-2.5 rounded-xl overflow-hidden border border-neutral-850">
                                  <img
                                    src={selectedImageDataUrl}
                                    alt="Preview"
                                    className="max-h-full object-contain pixelated"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="space-y-1 text-xs text-neutral-300 font-mono">
                                  <div>Name: <span className="text-neutral-100 truncate max-w-full block font-bold">{selectedCloudItem?.name}</span></div>
                                  <div>Size: <span className="text-neutral-100">{selectedImageDims ? `${selectedImageDims.width}×${selectedImageDims.height}px` : 'Loading...'}</span></div>
                                </div>

                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold uppercase text-neutral-400">Sprite layer name</label>
                                  <input
                                    type="text"
                                    value={customSpriteName}
                                    onChange={(e) => setCustomSpriteName(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 outline-none focus:border-amber-500/40"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-8 text-center text-xs text-neutral-500 font-medium">
                                Choose any image file on your cloud drive directory to preview asset dimensions and properties.
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* 💾 VIRTUAL DRIVE PANEL (Dynamic backup manager or workspace assets browser) */}
              {activeStorageProvider === 'virtual' && (
                <div className="space-y-5">
                  
                  {/* ASSET IMPORT FROM VIRTUAL DISK */}
                  {action === 'import_asset' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Virtual drive assets list */}
                      <div className="md:col-span-2 border border-neutral-800 rounded-2xl bg-neutral-950/20 p-3.5 space-y-2">
                        <h5 className="text-[10px] font-bold uppercase text-neutral-400 px-1">
                          Workspace Preloaded Images ({filteredVirtualDriveItems.length})
                        </h5>

                        {filteredVirtualDriveItems.length === 0 ? (
                          <div className="p-12 rounded-xl bg-neutral-900/20 text-center text-xs text-neutral-500 border border-neutral-850/40">
                            No virtual assets match your query or project virtual drive is empty.
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                            {filteredVirtualDriveItems.map(item => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectVirtualItem(item)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  selectedCloudItem?.id === item.id
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <ImageIcon className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                                  <div className="truncate">
                                    <span className="block text-xs font-semibold text-neutral-200 truncate">
                                      {item.displayName || item.name}
                                    </span>
                                    <span className="block text-[9px] text-neutral-500 mt-0.5">
                                      {item.width && item.height ? `${item.width}×${item.height}px` : 'Image'} • {item.category || 'Local'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-amber-400 hover:underline">Select →</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Import Properties Calibration Preview */}
                      <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 p-4 space-y-4">
                        <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Asset Calibration</h5>
                        
                        {selectedImageDataUrl ? (
                          <div className="space-y-4">
                            <div className="max-h-40 flex justify-center bg-neutral-950 p-2 rounded-xl overflow-hidden border border-neutral-850">
                              <img
                                src={selectedImageDataUrl}
                                alt="Virtual preview"
                                className="max-h-full object-contain pixelated"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="space-y-1 text-xs text-neutral-300 font-mono">
                              <div>Source: <span className="text-neutral-100 truncate block font-bold">{selectedCloudItem?.name}</span></div>
                              <div>Dimensions: <span className="text-neutral-100">{selectedImageDims ? `${selectedImageDims.width}×${selectedImageDims.height}px` : 'Loading...'}</span></div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase text-neutral-400">Sprite layer name</label>
                              <input
                                type="text"
                                value={customSpriteName}
                                onChange={(e) => setCustomSpriteName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-neutral-500">
                            Choose preloaded virtual templates or assets from the project list to load into Sprite editor.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* BACKUPS SNAPS AND RETENTIONS (Visible in load_project / save_project modes) */}
                  {(action === 'load_project' || action === 'save_project') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                      
                      {/* Interval settings panel */}
                      <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 p-4 space-y-4">
                        <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5" /> Backups Calibration
                        </h5>

                        <div className="space-y-3.5 text-xs">
                          {/* Interval Minutes selector */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase">Save Interval</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={2}
                                max={60}
                                value={backupSettings.intervalMinutes}
                                onChange={(e) => handleUpdateBackupSettings({ intervalMinutes: parseInt(e.target.value) })}
                                className="flex-1 h-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                              />
                              <span className="font-mono text-neutral-200 font-bold px-1.5 py-0.5 bg-neutral-950 rounded text-[10px] border border-neutral-800">
                                {backupSettings.intervalMinutes}m
                              </span>
                            </div>
                          </div>

                          {/* Retention count slider */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase font-black">Retention Limit</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={3}
                                max={30}
                                value={backupSettings.retentionCount}
                                onChange={(e) => handleUpdateBackupSettings({ retentionCount: parseInt(e.target.value) })}
                                className="flex-1 h-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                              />
                              <span className="font-mono text-neutral-200 font-bold px-1.5 py-0.5 bg-neutral-950 rounded text-[10px] border border-neutral-800">
                                {backupSettings.retentionCount}
                              </span>
                            </div>
                          </div>

                          {/* Snapshot trigger button */}
                          <button
                            type="button"
                            onClick={handleTriggerManualBackup}
                            disabled={executingBackup}
                            className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1"
                          >
                            {executingBackup ? (
                              <RefreshCw size={13} className="animate-spin text-amber-500" />
                            ) : (
                              <Clock size={13} />
                            )}
                            Save Custom Snapshot
                          </button>
                        </div>
                      </div>

                      {/* Snapshots items list */}
                      <div className="md:col-span-2 border border-neutral-800 rounded-2xl bg-neutral-950/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between pb-1 px-1">
                          <h5 className="text-[10px] font-bold uppercase text-neutral-400">
                            Snapshots History ({backupsList.length})
                          </h5>
                          <button
                            type="button"
                            onClick={loadBackups}
                            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-850 rounded transition"
                          >
                            <RefreshCw size={11} />
                          </button>
                        </div>

                        {loadingBackups ? (
                          <div className="p-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                            <RefreshCw size={14} className="animate-spin text-amber-500" /> Fetching snapshots...
                          </div>
                        ) : backupsList.length === 0 ? (
                          <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-900/20 border border-neutral-850/40 rounded-xl">
                            No backup snapshots found in active workspace folder.
                          </div>
                        ) : (
                          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                            {backupsList.map(item => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-850 hover:border-neutral-750 flex items-center justify-between transition"
                              >
                                <div className="space-y-0.5 truncate pr-2">
                                  <span className="block text-xs font-semibold text-neutral-200 truncate">
                                    {item.name}
                                  </span>
                                  <span className="block text-[9px] font-mono text-neutral-500">
                                    {item.size || '0 KB'} • {new Date(item.modifiedTime || '').toLocaleDateString()} {new Date(item.modifiedTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {onLoadProject && (
                                    <button
                                      type="button"
                                      onClick={() => setRestoreConfirmTarget(item)}
                                      className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                                    >
                                      Restore
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDownloadBackupRecord(item, e)}
                                    className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800"
                                  >
                                    <Download size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => setDeleteConfirmTarget({ id: item.id, name: item.name, type: 'backup', backupItem: item })}
                                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                                  >
                                    <Trash2 size={11} />
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
              )}

            </div>

          </div>

        </div>

        {/* WINDOWS EXPLORER CONTEXTUAL BOTTOM ACTION BAR */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          
          {/* Active location prompt / Selected item info */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 overflow-hidden pr-2">
            <span className="text-[10px] font-bold uppercase text-neutral-500 shrink-0">Location:</span>
            <span className="font-mono text-[11px] text-amber-300/90 truncate bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
              {activeStorageProvider === 'local' 
                ? `This PC > Local Storage > Local Disk`
                : activeStorageProvider === 'cloud'
                  ? `${activeCloudProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'} > ${activeCloudProvider === 'gdrive' ? gdriveCurrentFolder.name : onedriveCurrentFolder.name}`
                  : `Virtual Workspace > ${virtualSection === 'assets' ? 'Assets' : 'Snapshots'}`
              }
            </span>
          </div>

          {/* Contextual filename input & Primary Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {(action === 'save_project' || action === 'export_file') && (
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
                <FileText size={13} className="text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={customSaveFileName}
                  onChange={(e) => setCustomSaveFileName(e.target.value)}
                  placeholder="File name..."
                  className="bg-transparent text-xs text-neutral-200 outline-none w-36 sm:w-48"
                />
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold transition active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isPrimaryActionDisabled}
              onClick={handlePrimaryActionClick}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-lg active:scale-95 ${
                isPrimaryActionDisabled
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-750'
                  : action === 'save_project'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/10'
                    : action === 'import_asset'
                      ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/10'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/10'
              }`}
            >
              {loadingCloud && <RefreshCw size={13} className="animate-spin" />}
              {primaryButtonLabel}
            </button>
          </div>

        </div>

      </div>

      {/* DELETE CONFIRM POPUP DIALOG */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
              <AlertTriangle size={15} /> Confirm File Deletion
            </h4>
            <p className="text-xs text-neutral-300 leading-normal">
              Are you sure you want to permanently delete <strong className="text-white">"{deleteConfirmTarget.name}"</strong>? This operation cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                disabled={deletingInProgress}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1"
              >
                {deletingInProgress && <RefreshCw size={11} className="animate-spin" />} Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRM POPUP DIALOG */}
      {restoreConfirmTarget && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <AlertCircle size={15} /> Confirm Workspace Restore
            </h4>
            <p className="text-xs text-neutral-300 leading-normal">
              Are you sure you want to restore <strong className="text-white">"{restoreConfirmTarget.name}"</strong>? This will overwrite your active workspace project data and assets.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedRestore}
                disabled={restoringInProgress}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold flex items-center gap-1"
              >
                {restoringInProgress && <RefreshCw size={11} className="animate-spin" />} Overwrite & Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION MISMATCH WARNING DIALOG */}
      {versionMismatchDialog && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-amber-400 tracking-wide">
                  Version Mismatch Detected
                </h4>
                <p className="text-xs text-neutral-400">
                  Project version differs from current Mason version
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Project Name:</span>
                <span className="font-bold text-neutral-200">{versionMismatchDialog.projectName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">File Version:</span>
                <span className="font-mono font-bold text-amber-400">{versionMismatchDialog.fileVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current App Version:</span>
                <span className="font-mono font-bold text-emerald-400">{MASON_VERSION}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              This project was saved in a different version of Mason. Loading it may cause compatibility differences with tilesets, layers, or schema structures. Would you like to proceed with opening it?
            </p>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setVersionMismatchDialog(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={versionMismatchDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
              >
                Proceed & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXISTING PROJECT DETECTED CONFLICT DIALOG */}
      {detectedProjectConflict && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-100">
                  Existing Project Detected in Folder
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  A project named <strong className="text-amber-300">"{detectedProjectConflict.foundProject.name}"</strong> was detected in folder <strong className="text-neutral-200">"{detectedProjectConflict.targetFolderName}"</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Detected Project in Folder:</span>
                <span className="font-semibold text-amber-300">{detectedProjectConflict.foundProject.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Currently Open in Editor:</span>
                <span className="font-semibold text-emerald-400">{detectedProjectConflict.currentProjectToLink.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Target Folder:</span>
                <span className="font-mono text-neutral-300">{detectedProjectConflict.targetFolderName}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                What would you like to do?
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Overwrite Folder */}
                <button
                  type="button"
                  onClick={executeOverwriteFolderConflict}
                  disabled={isResolvingConflict}
                  className="w-full px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 hover:text-white text-xs font-semibold flex items-center justify-between transition group"
                >
                  <div className="text-left">
                    <div className="font-bold text-red-400 group-hover:text-red-300 flex items-center gap-1.5">
                      {isResolvingConflict && <RefreshCw size={12} className="animate-spin" />} Overwrite Folder
                    </div>
                    <div className="text-[11px] text-neutral-400 font-normal mt-0.5">
                      Replace folder contents with "{detectedProjectConflict.currentProjectToLink.name}" and link it
                    </div>
                  </div>
                  <Save size={16} className="text-red-400 shrink-0 ml-2" />
                </button>

                {/* Option 2: Load Found Project */}
                <button
                  type="button"
                  onClick={executeLoadFoundProjectConflict}
                  disabled={isResolvingConflict}
                  className="w-full px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:text-white text-xs font-semibold flex items-center justify-between transition group"
                >
                  <div className="text-left">
                    <div className="font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                      {isResolvingConflict && <RefreshCw size={12} className="animate-spin" />} Load Found Project
                    </div>
                    <div className="text-[11px] text-neutral-400 font-normal mt-0.5">
                      Open "{detectedProjectConflict.foundProject.name}" in editor and link it to this folder
                    </div>
                  </div>
                  <FolderOpen size={16} className="text-amber-400 shrink-0 ml-2" />
                </button>

                {/* Option 3: Cancel */}
                <button
                  type="button"
                  onClick={() => setDetectedProjectConflict(null)}
                  disabled={isResolvingConflict}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium text-center transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

interface FolderBreadcrumb {
  id: string | null;
  name: string;
}
