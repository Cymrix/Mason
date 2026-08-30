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
  Search,
  Trash2,
  FileCheck,
  Sparkles,
  Layers,
  Clock,
  Compass,
  Check,
  ExternalLink,
  FolderTree
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

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
  initialMode?: 'explore' | 'save' | 'load';
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
  initialMode = 'explore'
}) => {
  const [activeProvider, setActiveProviderState] = useState<CloudProvider>('gdrive');
  const [activeTab, setActiveTab] = useState<'explore' | 'save' | 'load'>('explore');
  const [explorerViewMode, setExplorerViewMode] = useState<'subfolders' | 'all_folders'>('subfolders');

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');

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

  // Custom Save Dialog State
  const [customSaveFileName, setCustomSaveFileName] = useState('');
  const [isBackupSave, setIsBackupSave] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Scroll Container Refs
  const modalBodyRef = React.useRef<HTMLDivElement>(null);
  const itemsListRef = React.useRef<HTMLDivElement>(null);
  const loadListRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (itemsListRef.current) {
      itemsListRef.current.scrollTop = 0;
    }
    if (loadListRef.current) {
      loadListRef.current.scrollTop = 0;
    }
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveProviderState(getActiveCloudProvider());
      setActiveTab(initialMode);
      setCustomSaveFileName(
        `${(currentProject?.name || 'mason_world').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${currentProject?.id || 'map'}.mason`
      );
      refreshCloudState();
    }
  }, [isOpen, initialMode, currentProject]);

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

  const handleDeleteGDriveFile = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${fileName}" from Google Drive?`)) return;
    setLoading(true);
    try {
      await deleteGoogleDriveFile(fileId);
      setGdriveStatusMsg(`Deleted "${fileName}" from Google Drive.`);
      fetchGDriveFolder(gdriveCurrentFolder.id);
    } catch (err: any) {
      setGdriveStatusMsg(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  const handleDeleteOneDriveFile = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${fileName}" from OneDrive?`)) return;
    setLoading(true);
    try {
      await deleteOneDriveFile(fileId);
      setOnedriveStatusMsg(`Deleted "${fileName}" from OneDrive.`);
      fetchOneDriveFolder(onedriveCurrentFolder.id);
    } catch (err: any) {
      setOnedriveStatusMsg(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
        <div className="px-5 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'explore'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Explore Folders & Pick Location
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('save')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'save'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Save Project As...
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('load')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'load'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Load from Cloud
            </button>
          </div>

          {activeTab === 'explore' && activeProvider === 'gdrive' && activeToken && (
            <button
              type="button"
              onClick={() => handleOpenGooglePicker('folder')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition shadow-sm"
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
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    Connect Google Drive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectOneDrive()}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    Sign In with Microsoft
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refreshCloudState()}
                    disabled={loading}
                    className="p-2 rounded-lg border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs transition"
                    title="Refresh folder listing"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={activeProvider === 'gdrive' ? handleDisconnectGDrive : handleDisconnectOneDrive}
                    className="px-3 py-1.5 rounded-lg border border-stone-700 hover:border-red-500/50 hover:bg-red-500/10 text-stone-300 hover:text-red-400 text-xs transition"
                  >
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
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
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
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition"
                      title="Set this open folder as the active destination for project saves"
                    >
                      <FolderCheck className="w-3.5 h-3.5" /> Pick This Location
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
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                      title="Save the active project directly into this current directory"
                    >
                      <Upload className="w-3.5 h-3.5" /> Save Project Here
                    </button>
                  </div>
                </div>

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
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition"
                                    title="Delete from cloud"
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

          {/* MAIN TAB 2: SAVE PROJECT AS... DIALOG */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-5">
                <div>
                  <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Save Active Project to Cloud Location
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Choose your file name, confirm the target destination folder, and push the latest map data to your cloud drive.
                  </p>
                </div>

                {/* Target Location Card */}
                <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <FolderCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Save Destination Folder</div>
                      <div className="font-bold text-stone-100 text-sm">{activeCurrentFolder.name}</div>
                      <div className="text-[11px] text-stone-500">Service: {activeProvider === 'gdrive' ? 'Google Drive' : 'Microsoft OneDrive'}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" /> Change Target Folder...
                  </button>
                </div>

                {/* Filename Input Form */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-300">
                    File Name:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSaveFileName}
                      onChange={(e) => setCustomSaveFileName(e.target.value)}
                      placeholder="e.g. world_map_level1.mason"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-500 text-xs text-stone-100 font-mono focus:outline-none"
                    />
                    <div className="px-3 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-stone-400 text-xs font-mono flex items-center">
                      .mason
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Saves map cells ({currentProject?.map?.width || 0}x{currentProject?.map?.height || 0}), biomes ({(currentProject?.biomes || []).length}), custom entities, checkpoints, and settings in Mason format (.mason).
                  </p>
                </div>

                {/* Options Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="backupCheckbox"
                    checked={isBackupSave}
                    onChange={(e) => setIsBackupSave(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="backupCheckbox" className="text-xs text-stone-300 cursor-pointer">
                    Prefix with <code className="text-amber-400">[BACKUP]_</code> for version safety
                  </label>
                </div>

                {/* Save Execution Button */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
                  >
                    Back to Explorer
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
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Project to Selected Location
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* MAIN TAB 3: LOAD SAVED CLOUD PROJECTS */}
          {activeTab === 'load' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-400" />
                      Saved Cloud Projects in "{activeCurrentFolder.name}"
                    </h3>
                    <p className="text-xs text-stone-400">
                      Select any previously saved Mason project file to open it directly in the editor.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" /> Browse Other Folders...
                  </button>
                </div>

                {/* Project File List */}
                {(!activeToken) ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    Connect your cloud account to view saved projects.
                  </div>
                ) : (
                  <div ref={loadListRef} className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(activeProvider === 'gdrive' ? gdriveFolderItems : onedriveFolderItems)
                      .filter(item => !item.isFolder && (item.name.endsWith('.mason') || item.name.endsWith('.json')))
                      .map(file => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-blue-500/40 flex items-center justify-between gap-3 text-xs transition"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                              <FileCode className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-stone-200 truncate">{file.name}</span>
                              <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                                <span>Modified: {new Date(file.modifiedTime).toLocaleDateString()}</span>
                                {file.size && <span>• {Math.round(Number(file.size) / 1024)} KB</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (activeProvider === 'gdrive') {
                                  handleLoadFromGDrive(file.id);
                                } else {
                                  handleLoadFromOneDrive(file as OneDriveItem);
                                }
                              }}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Download className="w-3.5 h-3.5" /> Load Project
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                if (activeProvider === 'gdrive') {
                                  handleDeleteGDriveFile(file.id, file.name, e);
                                } else {
                                  handleDeleteOneDriveFile(file.id, file.name, e);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition"
                              title="Delete from cloud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {(activeProvider === 'gdrive' ? gdriveFolderItems : onedriveFolderItems)
                      .filter(item => !item.isFolder && (item.name.endsWith('.mason') || item.name.endsWith('.json'))).length === 0 && (
                      <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-xl">
                        No saved Mason project files (.mason) found in this folder.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Cloud Target: <strong className="text-stone-300">{activeSelectedTarget.name}</strong> ({activeProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'})</span>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
