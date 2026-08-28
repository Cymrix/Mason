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
  Settings
} from 'lucide-react';
import { ProjectData } from '../utils/projectStorage';
import { 
  getGoogleDriveToken, 
  getGoogleDriveUser, 
  authenticateGoogleDrive, 
  disconnectGoogleDrive, 
  saveProjectToGoogleDrive, 
  listGoogleDriveProjects, 
  loadProjectFromGoogleDrive, 
  DriveFileInfo,
  isGoogleDriveBackupEnabled,
  setGoogleDriveBackupEnabled
} from '../utils/googleDriveStorage';
import { 
  getOneDriveToken, 
  getOneDriveUser, 
  authenticateOneDrive, 
  disconnectOneDrive, 
  saveProjectToOneDrive, 
  listOneDriveProjects, 
  loadProjectFromOneDrive, 
  OneDriveFileInfo,
  isOneDriveBackupEnabled,
  setOneDriveBackupEnabled
} from '../utils/oneDriveStorage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject
}) => {
  const [activeTab, setActiveTab] = useState<'gdrive' | 'onedrive'>('gdrive');

  // Google Drive State
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveFiles, setGdriveFiles] = useState<DriveFileInfo[]>([]);
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [gdriveBackup, setGdriveBackup] = useState(false);
  const [gdriveStatusMsg, setGdriveStatusMsg] = useState<string | null>(null);

  // OneDrive State
  const [onedriveToken, setOnedriveToken] = useState<string | null>(null);
  const [onedriveUser, setOnedriveUser] = useState<any>(null);
  const [onedriveFiles, setOnedriveFiles] = useState<OneDriveFileInfo[]>([]);
  const [onedriveLoading, setOnedriveLoading] = useState(false);
  const [onedriveBackup, setOnedriveBackup] = useState(false);
  const [onedriveStatusMsg, setOnedriveStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshCloudState();
    }
  }, [isOpen]);

  const refreshCloudState = async () => {
    // Refresh GDrive
    const gToken = getGoogleDriveToken();
    setGdriveToken(gToken);
    setGdriveUser(getGoogleDriveUser());
    setGdriveBackup(isGoogleDriveBackupEnabled());
    if (gToken) {
      loadGdriveFileList();
    }

    // Refresh OneDrive
    const oToken = getOneDriveToken();
    setOnedriveToken(oToken);
    setOnedriveUser(getOneDriveUser());
    setOnedriveBackup(isOneDriveBackupEnabled());
    if (oToken) {
      loadOnedriveFileList();
    }
  };

  const loadGdriveFileList = async () => {
    setGdriveLoading(true);
    try {
      const files = await listGoogleDriveProjects();
      setGdriveFiles(files);
    } catch (e) {
      console.warn('Gdrive list error:', e);
    } finally {
      setGdriveLoading(false);
    }
  };

  const loadOnedriveFileList = async () => {
    setOnedriveLoading(true);
    try {
      const files = await listOneDriveProjects();
      setOnedriveFiles(files);
    } catch (e) {
      console.warn('OneDrive list error:', e);
    } finally {
      setOnedriveLoading(false);
    }
  };

  if (!isOpen) return null;

  // Google Drive Handlers
  const handleConnectGDrive = async () => {
    setGdriveLoading(true);
    setGdriveStatusMsg(null);
    try {
      await authenticateGoogleDrive();
      refreshCloudState();
      setGdriveStatusMsg('Connected to Google Drive successfully!');
    } catch (err: any) {
      setGdriveStatusMsg(`Google Drive connection failed: ${err.message}`);
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleDisconnectGDrive = () => {
    disconnectGoogleDrive();
    setGdriveToken(null);
    setGdriveUser(null);
    setGdriveFiles([]);
    setGdriveStatusMsg('Disconnected from Google Drive.');
  };

  const handleSaveToGDrive = async () => {
    setGdriveLoading(true);
    setGdriveStatusMsg('Saving project level to Google Drive...');
    try {
      const saved = await saveProjectToGoogleDrive(currentProject);
      setGdriveStatusMsg(`Saved "${saved.name}" to Google Drive!`);
      loadGdriveFileList();
    } catch (err: any) {
      setGdriveStatusMsg(`Save failed: ${err.message}`);
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleLoadFromGDrive = async (fileId: string) => {
    setGdriveLoading(true);
    setGdriveStatusMsg('Downloading level from Google Drive...');
    try {
      const loaded = await loadProjectFromGoogleDrive(fileId);
      onLoadProject(loaded);
      setGdriveStatusMsg(`Loaded "${loaded.name}" successfully!`);
      onClose();
    } catch (err: any) {
      setGdriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleToggleGDriveBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setGdriveBackup(val);
    setGoogleDriveBackupEnabled(val);
  };

  // OneDrive Handlers
  const handleConnectOneDrive = async () => {
    setOnedriveLoading(true);
    setOnedriveStatusMsg(null);
    try {
      await authenticateOneDrive();
      refreshCloudState();
      setOnedriveStatusMsg('Connected to Microsoft OneDrive!');
    } catch (err: any) {
      setOnedriveStatusMsg(`OneDrive connection error: ${err.message}`);
    } finally {
      setOnedriveLoading(false);
    }
  };

  const handleDisconnectOneDrive = () => {
    disconnectOneDrive();
    setOnedriveToken(null);
    setOnedriveUser(null);
    setOnedriveFiles([]);
    setOnedriveStatusMsg('Disconnected from Microsoft OneDrive.');
  };

  const handleSaveToOneDrive = async () => {
    setOnedriveLoading(true);
    setOnedriveStatusMsg('Uploading project level to Microsoft OneDrive...');
    try {
      const saved = await saveProjectToOneDrive(currentProject);
      setOnedriveStatusMsg(`Saved "${saved.name}" to OneDrive!`);
      loadOnedriveFileList();
    } catch (err: any) {
      setOnedriveStatusMsg(`OneDrive Save failed: ${err.message}`);
    } finally {
      setOnedriveLoading(false);
    }
  };

  const handleLoadFromOneDrive = async (file: OneDriveFileInfo) => {
    setOnedriveLoading(true);
    setOnedriveStatusMsg('Downloading level from Microsoft OneDrive...');
    try {
      const loaded = await loadProjectFromOneDrive(file);
      onLoadProject(loaded);
      setOnedriveStatusMsg(`Loaded "${loaded.name}"!`);
      onClose();
    } catch (err: any) {
      setOnedriveStatusMsg(`Load failed: ${err.message}`);
    } finally {
      setOnedriveLoading(false);
    }
  };

  const handleToggleOneDriveBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setOnedriveBackup(val);
    setOneDriveBackupEnabled(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-900/40 border border-blue-500/40 text-blue-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
                Cloud Storage & Sync
              </h2>
              <p className="text-xs text-stone-400">
                Save, load, and auto-backup Mason level files across Google Drive & Microsoft OneDrive
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

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-5 gap-2">
          <button
            onClick={() => setActiveTab('gdrive')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'gdrive'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
            }`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.01 1.992L4.01 15.992h15.999l-8-14zm-7.009 15.008l4.004 7h12l-4.004-7h-12zm12.009-1h4l-7.999-14h-4l7.999 14z" />
            </svg>
            Google Drive
            {gdriveToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('onedrive')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'onedrive'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            Microsoft OneDrive
            {onedriveToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* GOOGLE DRIVE TAB */}
          {activeTab === 'gdrive' && (
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="p-5 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {gdriveUser?.picture ? (
                    <img src={gdriveUser.picture} alt="Profile" className="w-12 h-12 rounded-full border border-blue-500/40" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Cloud className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-100">
                        {gdriveUser?.name || 'Google Drive Sync'}
                      </h3>
                      {gdriveToken ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {gdriveUser?.email || 'Save, backup, and restore level files directly on Google Drive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!gdriveToken ? (
                    <button
                      onClick={() => handleConnectGDrive()}
                      disabled={gdriveLoading}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                      {gdriveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
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
                  {/* Actions & Auto-Backup */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-blue-400" />
                          Save Current Level to Drive
                        </h4>
                        <p className="text-xs text-stone-400 mt-1">
                          Uploads "{currentProject.name}" as a .mason level file to your Google Drive.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveToGDrive}
                        disabled={gdriveLoading}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center gap-2"
                      >
                        <FileCode className="w-3.5 h-3.5" /> Save Level File (.mason)
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-400" />
                          Auto-Backup Settings
                        </h4>
                        <p className="text-xs text-stone-400 mt-1">
                          Automatically upload level backups to Google Drive when saving.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={gdriveBackup}
                          onChange={handleToggleGDriveBackup}
                          className="w-4 h-4 rounded bg-stone-800 border-stone-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Enable Auto-Backup to Google Drive</span>
                      </label>
                    </div>
                  </div>

                  {/* Remote File Explorer */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-stone-300 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        Saved Levels on Google Drive
                      </h4>
                      <button
                        onClick={loadGdriveFileList}
                        disabled={gdriveLoading}
                        className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${gdriveLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    {gdriveFiles.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs">
                        No saved level files found in Google Drive yet. Click "Save Current Level" to upload one!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {gdriveFiles.map(file => (
                          <div 
                            key={file.id} 
                            className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-stone-700 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                                <FileCode className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-stone-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-stone-500">
                                  Modified: {new Date(file.modifiedTime).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleLoadFromGDrive(file.id)}
                              disabled={gdriveLoading}
                              className="px-3 py-1.5 rounded bg-stone-800 hover:bg-blue-600 hover:text-white text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" /> Load
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MICROSOFT ONEDRIVE TAB */}
          {activeTab === 'onedrive' && (
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="p-5 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-100">
                        {onedriveUser?.displayName || 'Microsoft OneDrive Sync'}
                      </h3>
                      {onedriveToken ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {onedriveUser?.email || 'Save and backup level files directly to Microsoft OneDrive cloud storage'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!onedriveToken ? (
                    <button
                      onClick={() => handleConnectOneDrive()}
                      disabled={onedriveLoading}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-600/20"
                    >
                      {onedriveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-sky-400" />
                          Upload to OneDrive
                        </h4>
                        <p className="text-xs text-stone-400 mt-1">
                          Uploads "{currentProject.name}" into the MasonMapEditor folder on OneDrive.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveToOneDrive}
                        disabled={onedriveLoading}
                        className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center justify-center gap-2"
                      >
                        <FileCode className="w-3.5 h-3.5" /> Save Level File (.mason)
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-sky-400" />
                          Auto-Backup Settings
                        </h4>
                        <p className="text-xs text-stone-400 mt-1">
                          Keep automatic backup copies of your active level state in OneDrive.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={onedriveBackup}
                          onChange={handleToggleOneDriveBackup}
                          className="w-4 h-4 rounded bg-stone-800 border-stone-700 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Enable Auto-Backup to OneDrive</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-stone-300 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-sky-400" />
                        Saved Levels in OneDrive (MasonMapEditor)
                      </h4>
                      <button
                        onClick={loadOnedriveFileList}
                        disabled={onedriveLoading}
                        className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${onedriveLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    {onedriveFiles.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs">
                        No level files found in your OneDrive MasonMapEditor directory.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {onedriveFiles.map(file => (
                          <div 
                            key={file.id} 
                            className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-stone-700 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded bg-sky-500/10 text-sky-400">
                                <FileCode className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-stone-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-stone-500">
                                  Modified: {new Date(file.modifiedTime).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleLoadFromOneDrive(file)}
                              disabled={onedriveLoading}
                              className="px-3 py-1.5 rounded bg-stone-800 hover:bg-sky-600 hover:text-white text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" /> Load
                            </button>
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
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure OAuth Cloud Storage Token Handshake Active
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
