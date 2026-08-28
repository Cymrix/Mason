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
  ChevronRight,
  FolderCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
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
  createGoogleDriveFolder,
  getGoogleDriveSelectedFolder,
  setGoogleDriveSelectedFolder
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
  CloudProvider
} from '../utils/oneDriveStorage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
}

interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject
}) => {
  const [activeProvider, setActiveProviderState] = useState<CloudProvider>('gdrive');

  // Google Drive State
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveStatusMsg, setGdriveStatusMsg] = useState<string | null>(null);
  const [gdriveCurrentFolder, setGdriveCurrentFolder] = useState<FolderBreadcrumb>({ id: null, name: 'Root Directory' });
  const [gdriveSelectedTarget, setGdriveSelectedTarget] = useState<FolderBreadcrumb>({ id: null, name: 'Root Directory' });
  const [gdriveFolderItems, setGdriveFolderItems] = useState<DriveItem[]>([]);
  const [gdrivePathStack, setGdrivePathStack] = useState<FolderBreadcrumb[]>([{ id: null, name: 'Root' }]);

  // OneDrive State
  const [onedriveToken, setOnedriveToken] = useState<string | null>(null);
  const [onedriveUser, setOnedriveUser] = useState<any>(null);
  const [onedriveStatusMsg, setOnedriveStatusMsg] = useState<string | null>(null);
  const [onedriveCurrentFolder, setOnedriveCurrentFolder] = useState<FolderBreadcrumb>({ id: null, name: 'App Root / MasonMapEditor' });
  const [onedriveSelectedTarget, setOnedriveSelectedTarget] = useState<FolderBreadcrumb>({ id: null, name: 'App Root / MasonMapEditor' });
  const [onedriveFolderItems, setOnedriveFolderItems] = useState<OneDriveItem[]>([]);
  const [onedrivePathStack, setOnedrivePathStack] = useState<FolderBreadcrumb[]>([{ id: null, name: 'App Root' }]);

  // Folder creation & loading
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveProviderState(getActiveCloudProvider());
      refreshCloudState();
    }
  }, [isOpen]);

  const handleSwitchProvider = (provider: CloudProvider) => {
    setActiveProviderState(provider);
    setActiveCloudProvider(provider);
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
    try {
      const items = await listGoogleDriveFolderContents(folderId);
      setGdriveFolderItems(items);
    } catch (e: any) {
      setGdriveStatusMsg(`Folder list error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOneDriveFolder = async (folderId: string | null) => {
    setLoading(true);
    try {
      const items = await listOneDriveFolderContents(folderId);
      setOnedriveFolderItems(items);
    } catch (e: any) {
      setOnedriveStatusMsg(`Folder list error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Google Drive Handlers
  const handleConnectGDrive = async () => {
    setLoading(true);
    setGdriveStatusMsg(null);
    try {
      await authenticateGoogleDrive();
      handleSwitchProvider('gdrive');
      refreshCloudState();
      setGdriveStatusMsg('Connected to Google Drive successfully!');
    } catch (err: any) {
      setGdriveStatusMsg(`Google Drive connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGDrive = () => {
    disconnectGoogleDrive();
    setGdriveToken(null);
    setGdriveUser(null);
    setGdriveFolderItems([]);
    setGdriveStatusMsg('Disconnected from Google Drive.');
  };

  const handleSaveToGDrive = async () => {
    setLoading(true);
    setGdriveStatusMsg('Uploading full project structure (all levels, tilesets, settings) to Google Drive...');
    try {
      const saved = await saveProjectToGoogleDrive(currentProject);
      setGdriveStatusMsg(`Saved full project "${saved.name}" to Google Drive!`);
      fetchGDriveFolder(gdriveCurrentFolder.id);
    } catch (err: any) {
      setGdriveStatusMsg(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      await createGoogleDriveFolder(newFolderName.trim(), gdriveCurrentFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
      setGdriveStatusMsg(`Created folder "${newFolderName.trim()}"`);
      fetchGDriveFolder(gdriveCurrentFolder.id);
    } catch (err: any) {
      setGdriveStatusMsg(`Could not create folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetGDriveTargetFolder = () => {
    setGoogleDriveSelectedFolder(gdriveCurrentFolder.id, gdriveCurrentFolder.name);
    setGdriveSelectedTarget({ id: gdriveCurrentFolder.id, name: gdriveCurrentFolder.name });
    setGdriveStatusMsg(`Active Google Drive target folder set to: "${gdriveCurrentFolder.name}"`);
  };

  const handleNavigateGDriveFolder = (folder: DriveItem) => {
    const nextBreadcrumb = { id: folder.id, name: folder.name };
    setGdriveCurrentFolder(nextBreadcrumb);
    setGdrivePathStack(prev => [...prev, nextBreadcrumb]);
    fetchGDriveFolder(folder.id);
  };

  const handleNavigateUpGDrive = () => {
    if (gdrivePathStack.length <= 1) return;
    const newStack = [...gdrivePathStack];
    newStack.pop();
    const parent = newStack[newStack.length - 1];
    setGdrivePathStack(newStack);
    setGdriveCurrentFolder(parent);
    fetchGDriveFolder(parent.id);
  };

  const handleLoadFromGDrive = async (fileId: string) => {
    setLoading(true);
    setGdriveStatusMsg('Downloading complete project from Google Drive...');
    try {
      const loaded = await loadProjectFromGoogleDrive(fileId);
      onLoadProject(loaded);
      setGdriveStatusMsg(`Successfully loaded project "${loaded.name}"!`);
      onClose();
    } catch (err: any) {
      setGdriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // OneDrive Handlers
  const handleConnectOneDrive = async () => {
    setLoading(true);
    setOnedriveStatusMsg(null);
    try {
      await authenticateOneDrive();
      handleSwitchProvider('onedrive');
      refreshCloudState();
      setOnedriveStatusMsg('Connected to Microsoft OneDrive!');
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
    setOnedriveStatusMsg('Disconnected from Microsoft OneDrive.');
  };

  const handleSaveToOneDrive = async () => {
    setLoading(true);
    setOnedriveStatusMsg('Uploading full project structure (all levels, tilesets, settings) to Microsoft OneDrive...');
    try {
      const saved = await saveProjectToOneDrive(currentProject);
      setOnedriveStatusMsg(`Saved full project "${saved.name}" to OneDrive!`);
      fetchOneDriveFolder(onedriveCurrentFolder.id);
    } catch (err: any) {
      setOnedriveStatusMsg(`OneDrive Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOneDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      await createOneDriveFolder(newFolderName.trim(), onedriveCurrentFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
      setOnedriveStatusMsg(`Created folder "${newFolderName.trim()}" on OneDrive`);
      fetchOneDriveFolder(onedriveCurrentFolder.id);
    } catch (err: any) {
      setOnedriveStatusMsg(`Could not create folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetOneDriveTargetFolder = () => {
    setOneDriveSelectedFolder(onedriveCurrentFolder.id, onedriveCurrentFolder.name);
    setOnedriveSelectedTarget({ id: onedriveCurrentFolder.id, name: onedriveCurrentFolder.name });
    setOnedriveStatusMsg(`Active OneDrive target folder set to: "${onedriveCurrentFolder.name}"`);
  };

  const handleNavigateOneDriveFolder = (folder: OneDriveItem) => {
    const nextBreadcrumb = { id: folder.id, name: folder.name };
    setOnedriveCurrentFolder(nextBreadcrumb);
    setOnedrivePathStack(prev => [...prev, nextBreadcrumb]);
    fetchOneDriveFolder(folder.id);
  };

  const handleNavigateUpOneDrive = () => {
    if (onedrivePathStack.length <= 1) return;
    const newStack = [...onedrivePathStack];
    newStack.pop();
    const parent = newStack[newStack.length - 1];
    setOnedrivePathStack(newStack);
    setOnedriveCurrentFolder(parent);
    fetchOneDriveFolder(parent.id);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600/30 to-orange-900/40 border border-amber-500/40 text-amber-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-stone-100 to-amber-200 bg-clip-text text-transparent">
                Cloud Storage & Project Sync
              </h2>
              <p className="text-xs text-stone-400">
                Save, browse, and auto-backup complete Mason project files across cloud providers
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Provider Switcher */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400">Active Storage Provider:</span>
            <div className="p-1 rounded-xl bg-stone-900 border border-stone-800 flex gap-1">
              <button
                onClick={() => handleSwitchProvider('gdrive')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeProvider === 'gdrive'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.01 1.992L4.01 15.992h15.999l-8-14zm-7.009 15.008l4.004 7h12l-4.004-7h-12zm12.009-1h4l-7.999-14h-4l7.999 14z" />
                </svg>
                Google Drive
                {activeProvider === 'gdrive' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
              </button>

              <button
                onClick={() => handleSwitchProvider('onedrive')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeProvider === 'onedrive'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-200" />
                Microsoft OneDrive
                {activeProvider === 'onedrive' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Automatic cloud backups active for <strong>{activeProvider === 'gdrive' ? 'Google Drive' : 'OneDrive'}</strong></span>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* GOOGLE DRIVE SECTION */}
          {activeProvider === 'gdrive' && (
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {gdriveUser?.picture ? (
                    <img src={gdriveUser.picture} alt="Profile" className="w-10 h-10 rounded-full border border-blue-500/40" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Cloud className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-100 text-sm">
                        {gdriveUser?.name || 'Google Drive Storage'}
                      </h3>
                      {gdriveToken ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {gdriveUser?.email || 'Save entire project files directly to your Google Drive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!gdriveToken ? (
                    <button
                      onClick={() => handleConnectGDrive()}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Connect Google Drive
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectGDrive}
                      className="px-3 py-1.5 rounded-lg border border-stone-700 hover:border-red-500/50 hover:bg-red-500/10 text-stone-300 hover:text-red-400 text-xs transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {gdriveStatusMsg && (
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
                  {gdriveStatusMsg}
                </div>
              )}

              {gdriveToken && (
                <>
                  {/* Entire Project Cloud Save Action */}
                  <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-400" />
                        Save Entire Project to Google Drive
                      </h4>
                      <p className="text-xs text-stone-400">
                        Saves all levels, tilesets, palette, grid configs, and metadata of "{currentProject.name}" to target directory: <strong className="text-blue-300">{gdriveSelectedTarget.name}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleSaveToGDrive}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 shrink-0 transition-all"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                      Save Entire Project (.mason)
                    </button>
                  </div>

                  {/* Virtual Google Drive Folder Browser */}
                  <div className="space-y-3 p-4 rounded-xl bg-stone-950/70 border border-stone-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                          <Folder className="w-4 h-4 text-amber-400" /> Virtual Drive Browser:
                        </span>
                        
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1 text-xs text-stone-400 bg-stone-900 px-2.5 py-1 rounded-md border border-stone-800">
                          {gdrivePathStack.map((crumb, idx) => (
                            <React.Fragment key={crumb.id || 'root'}>
                              {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-600" />}
                              <span className={idx === gdrivePathStack.length - 1 ? 'font-bold text-amber-300' : ''}>
                                {crumb.name}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {gdrivePathStack.length > 1 && (
                          <button
                            onClick={handleNavigateUpGDrive}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3 h-3" /> Up
                          </button>
                        )}

                        <button
                          onClick={() => setShowCreateFolder(!showCreateFolder)}
                          className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1"
                        >
                          <FolderPlus className="w-3.5 h-3.5" /> + New Folder
                        </button>

                        <button
                          onClick={handleSetGDriveTargetFolder}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
                        >
                          <FolderCheck className="w-3.5 h-3.5" /> Set Sync Target
                        </button>
                      </div>
                    </div>

                    {/* Inline Folder Creator */}
                    {showCreateFolder && (
                      <div className="flex gap-2 p-3 rounded-lg bg-stone-900 border border-amber-500/30 animate-fade-in">
                        <input
                          type="text"
                          placeholder="New Folder Name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleCreateGDriveFolder}
                          disabled={!newFolderName.trim() || loading}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                        >
                          Create
                        </button>
                      </div>
                    )}

                    {/* Folder & File List */}
                    {gdriveFolderItems.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs">
                        This Google Drive folder is empty. Save your project here or create a subfolder!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {gdriveFolderItems.map(item => (
                          <div 
                            key={item.id}
                            className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80 hover:border-stone-700 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {item.isFolder ? (
                                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                              )}
                              <div className="truncate">
                                <span className={`font-medium ${item.isFolder ? 'text-amber-200 hover:underline cursor-pointer' : 'text-stone-200'}`}
                                      onClick={() => item.isFolder && handleNavigateGDriveFolder(item)}>
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-stone-500 ml-2">
                                  {new Date(item.modifiedTime).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.isFolder ? (
                                <button
                                  onClick={() => handleNavigateGDriveFolder(item)}
                                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1"
                                >
                                  Open <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLoadFromGDrive(item.id)}
                                  disabled={loading}
                                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Load Project
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MICROSOFT ONEDRIVE SECTION */}
          {activeProvider === 'onedrive' && (
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-100 text-sm">
                        {onedriveUser?.displayName || 'Microsoft OneDrive Storage'}
                      </h3>
                      {onedriveToken ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {onedriveUser?.email || 'Save entire project files directly to your Microsoft OneDrive account'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!onedriveToken ? (
                    <button
                      onClick={() => handleConnectOneDrive()}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-sky-600/20"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Connect OneDrive
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectOneDrive}
                      className="px-3 py-1.5 rounded-lg border border-stone-700 hover:border-red-500/50 hover:bg-red-500/10 text-stone-300 hover:text-red-400 text-xs transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {onedriveStatusMsg && (
                <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                  {onedriveStatusMsg}
                </div>
              )}

              {onedriveToken && (
                <>
                  {/* Entire Project Cloud Save Action */}
                  <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-sky-400" />
                        Save Entire Project to OneDrive
                      </h4>
                      <p className="text-xs text-stone-400">
                        Saves all levels, tilesets, palette, grid configs, and metadata of "{currentProject.name}" to target directory: <strong className="text-sky-300">{onedriveSelectedTarget.name}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleSaveToOneDrive}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 shrink-0 transition-all"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                      Save Entire Project (.mason)
                    </button>
                  </div>

                  {/* Virtual OneDrive Folder Browser */}
                  <div className="space-y-3 p-4 rounded-xl bg-stone-950/70 border border-stone-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                          <Folder className="w-4 h-4 text-sky-400" /> Virtual OneDrive Browser:
                        </span>
                        
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1 text-xs text-stone-400 bg-stone-900 px-2.5 py-1 rounded-md border border-stone-800">
                          {onedrivePathStack.map((crumb, idx) => (
                            <React.Fragment key={crumb.id || 'approot'}>
                              {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-600" />}
                              <span className={idx === onedrivePathStack.length - 1 ? 'font-bold text-sky-300' : ''}>
                                {crumb.name}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onedrivePathStack.length > 1 && (
                          <button
                            onClick={handleNavigateUpOneDrive}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3 h-3" /> Up
                          </button>
                        )}

                        <button
                          onClick={() => setShowCreateFolder(!showCreateFolder)}
                          className="px-2.5 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs flex items-center gap-1"
                        >
                          <FolderPlus className="w-3.5 h-3.5" /> + New Folder
                        </button>

                        <button
                          onClick={handleSetOneDriveTargetFolder}
                          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
                        >
                          <FolderCheck className="w-3.5 h-3.5" /> Set Sync Target
                        </button>
                      </div>
                    </div>

                    {/* Inline Folder Creator */}
                    {showCreateFolder && (
                      <div className="flex gap-2 p-3 rounded-lg bg-stone-900 border border-sky-500/30 animate-fade-in">
                        <input
                          type="text"
                          placeholder="New Folder Name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          onClick={handleCreateOneDriveFolder}
                          disabled={!newFolderName.trim() || loading}
                          className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                        >
                          Create
                        </button>
                      </div>
                    )}

                    {/* Folder & File List */}
                    {onedriveFolderItems.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs">
                        This OneDrive folder is empty. Click "Save Entire Project" or create a subfolder!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {onedriveFolderItems.map(item => (
                          <div 
                            key={item.id}
                            className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80 hover:border-stone-700 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {item.isFolder ? (
                                <Folder className="w-4 h-4 text-sky-400 shrink-0" />
                              ) : (
                                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                              )}
                              <div className="truncate">
                                <span className={`font-medium ${item.isFolder ? 'text-sky-200 hover:underline cursor-pointer' : 'text-stone-200'}`}
                                      onClick={() => item.isFolder && handleNavigateOneDriveFolder(item)}>
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-stone-500 ml-2">
                                  {new Date(item.modifiedTime).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.isFolder ? (
                                <button
                                  onClick={() => handleNavigateOneDriveFolder(item)}
                                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1"
                                >
                                  Open <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLoadFromOneDrive(item)}
                                  disabled={loading}
                                  className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Load Project
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Automatic non-optional cloud project persistence enabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
