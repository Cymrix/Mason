import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Download,
  Upload,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Shield,
  Layers,
  Palette,
  Volume2,
  VolumeX,
  Grid,
  Cloud,
  HardDrive,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Laptop,
  Bookmark,
  ExternalLink,
  LogOut,
  RefreshCw
} from 'lucide-react';
import {
  MasonUserProfile,
  MasonAppConfig,
  DEFAULT_APP_CONFIG,
  getAllProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  updateActiveProfileConfig,
  updateProfileInfo,
  deleteProfile,
  exportProfilesJSON,
  importProfilesJSON
} from '../utils/appProfileSystem';
import { useAppTheme } from '../theme/ThemeContext';
import {
  getGoogleDriveToken,
  getGoogleDriveUser,
  authenticateGoogleDrive,
  disconnectGoogleDrive
} from '../utils/googleDriveStorage';
import {
  getOneDriveToken,
  getOneDriveUser,
  authenticateOneDrive,
  disconnectOneDrive
} from '../utils/oneDriveStorage';

interface AppProfileConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenThemeModal?: () => void;
  onSavePayloadToCloud?: (payload: { name: string; content: string; mimeType: string }) => void;
  onExportProfileViaFileManager?: (payload: { name: string; content: string; mimeType: string }) => void;
  onImportProfileViaFileManager?: () => void;
  initialTab?: 'profiles' | 'config' | 'export';
}

const EMOJI_AVATARS = ['🧙‍♂️', '🎨', '🚀', '🛠️', '🎮', '🏰', '🗺️', '🧙', '🐉', '🔮', '⚡', '🌌', '⚙️', '💎'];

const COLOR_BADGES = [
  { id: 'amber', name: 'Amber Gold', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  { id: 'sky', name: 'Sky Cyan', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { id: 'rose', name: 'Rose Crimson', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
  { id: 'purple', name: 'Violet Purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  { id: 'indigo', name: 'Indigo Blue', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' }
];

export const AppProfileConfigModal: React.FC<AppProfileConfigModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOpenThemeModal,
  onSavePayloadToCloud,
  onExportProfileViaFileManager,
  onImportProfileViaFileManager,
  initialTab = 'profiles'
}) => {
  const { theme, primaryDef, bgDef } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'profiles' | 'config' | 'export'>(initialTab);
  const [profiles, setProfiles] = useState<MasonUserProfile[]>(getAllProfiles);
  const [activeProf, setActiveProf] = useState<MasonUserProfile>(getActiveProfile);

  // New Profile Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('🎨');
  const [newProfileColor, setNewProfileColor] = useState('sky');

  // Editing Profile Info State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('🎨');
  const [editColor, setEditColor] = useState('amber');

  // Config Form State
  const [currentConfig, setCurrentConfig] = useState<MasonAppConfig>(activeProf.config);

  // Cloud connection states
  const [gdriveToken, setGdriveToken] = useState<string | null>(getGoogleDriveToken);
  const [gdriveUser, setGdriveUser] = useState<any>(getGoogleDriveUser);
  const [isConnectingGDrive, setIsConnectingGDrive] = useState(false);

  const [onedriveToken, setOnedriveToken] = useState<string | null>(getOneDriveToken);
  const [onedriveUser, setOnedriveUser] = useState<any>(getOneDriveUser);
  const [isConnectingOneDrive, setIsConnectingOneDrive] = useState(false);

  // Copy status
  const [copied, setCopied] = useState(false);

  const refreshCloudConnections = () => {
    setGdriveToken(getGoogleDriveToken());
    setGdriveUser(getGoogleDriveUser());
    setOnedriveToken(getOneDriveToken());
    setOnedriveUser(getOneDriveUser());
  };

  // Refresh data whenever modal opens or profiles update
  useEffect(() => {
    if (!isOpen) return;
    const all = getAllProfiles();
    const active = getActiveProfile();
    setProfiles(all);
    setActiveProf(active);
    setCurrentConfig(active.config);
    if (initialTab) {
      setActiveTab(initialTab);
    }
    refreshCloudConnections();
  }, [isOpen, initialTab]);

  const handleConnectGDrive = async () => {
    setIsConnectingGDrive(true);
    try {
      await authenticateGoogleDrive();
      refreshCloudConnections();
      if (onShowToast) onShowToast('Google Drive connected successfully!', 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`Google Drive connection error: ${err.message || err}`, 'error');
    } finally {
      setIsConnectingGDrive(false);
    }
  };

  const handleDisconnectGDrive = () => {
    disconnectGoogleDrive();
    refreshCloudConnections();
    if (onShowToast) onShowToast('Google Drive disconnected', 'info');
  };

  const handleConnectOneDrive = async () => {
    setIsConnectingOneDrive(true);
    try {
      await authenticateOneDrive();
      refreshCloudConnections();
      if (onShowToast) onShowToast('Microsoft OneDrive connected successfully!', 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(`OneDrive connection error: ${err.message || err}`, 'error');
    } finally {
      setIsConnectingOneDrive(false);
    }
  };

  const handleDisconnectOneDrive = () => {
    disconnectOneDrive();
    refreshCloudConnections();
    if (onShowToast) onShowToast('Microsoft OneDrive disconnected', 'info');
  };

  if (!isOpen) return null;

  // Handle switching active profile
  const handleSelectProfile = (id: string) => {
    const updated = setActiveProfile(id);
    setActiveProf(updated);
    setCurrentConfig(updated.config);
    setProfiles(getAllProfiles());
    onShowToast?.(`Switched to profile: ${updated.name}`, 'success');
  };

  // Handle creating new profile
  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const created = createProfile(newProfileName, newProfileAvatar, newProfileColor);
    setProfiles(getAllProfiles());
    setActiveProf(created);
    setCurrentConfig(created.config);
    setShowCreateForm(false);
    setNewProfileName('');
    onShowToast?.(`Created profile "${created.name}"!`, 'success');
  };

  // Start editing a profile
  const handleStartEdit = (p: MasonUserProfile) => {
    setEditingProfileId(p.id);
    setEditName(p.name);
    setEditAvatar(p.avatar);
    setEditColor(p.color);
  };

  // Save profile info edit
  const handleSaveEdit = (id: string) => {
    const updatedList = updateProfileInfo(id, {
      name: editName,
      avatar: editAvatar,
      color: editColor
    });
    setProfiles(updatedList);
    const active = getActiveProfile();
    setActiveProf(active);
    setEditingProfileId(null);
    onShowToast?.('Updated profile info!', 'success');
  };

  // Delete profile
  const handleDeleteProfileClick = (id: string, name: string) => {
    const res = deleteProfile(id);
    if (!res.success) {
      onShowToast?.('Cannot delete the last remaining profile.', 'warning');
      return;
    }
    setProfiles(res.profiles);
    const active = getActiveProfile();
    setActiveProf(active);
    setCurrentConfig(active.config);
    onShowToast?.(`Deleted profile "${name}"`, 'info');
  };

  // Update a config option for active profile
  const handleUpdateConfigValue = <K extends keyof MasonAppConfig>(
    key: K,
    value: MasonAppConfig[K]
  ) => {
    const newCfg = { ...currentConfig, [key]: value };
    setCurrentConfig(newCfg);
    const updatedProf = updateActiveProfileConfig({ [key]: value });
    setActiveProf(updatedProf);
  };

  // Export profile config using the Files Sub-Module
  const handleExportProfileClick = () => {
    const jsonStr = exportProfilesJSON(activeProf.id);
    const fileName = `mason_config_${activeProf.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    const payload = {
      name: fileName,
      content: jsonStr,
      mimeType: 'application/json'
    };

    if (onExportProfileViaFileManager) {
      onExportProfileViaFileManager(payload);
    } else if (onSavePayloadToCloud) {
      onSavePayloadToCloud(payload);
    } else {
      onShowToast?.('Files sub-module integration is unavailable.', 'error');
      return;
    }
    onClose();
  };

  // Import profile config using the Files Sub-Module
  const handleImportProfileClick = () => {
    if (onImportProfileViaFileManager) {
      onImportProfileViaFileManager();
    } else {
      onShowToast?.('Files sub-module integration is unavailable.', 'error');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Mason App Profiles & Configuration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Global Cache Enabled
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage user profiles and cached settings across any Mason app session.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 bg-neutral-950/60 border-b border-neutral-800 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition ${
              activeTab === 'profiles'
                ? 'bg-neutral-900 text-amber-300 border-neutral-700 border-b-neutral-900 -mb-px'
                : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>User Profiles ({profiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition ${
              activeTab === 'config'
                ? 'bg-neutral-900 text-amber-300 border-neutral-700 border-b-neutral-900 -mb-px'
                : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Editor & App Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition ${
              activeTab === 'export'
                ? 'bg-neutral-900 text-amber-300 border-neutral-700 border-b-neutral-900 -mb-px'
                : 'bg-transparent text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import / Export Config File</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: User Profiles Manager */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              
              {/* Active Profile Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner">
                    {activeProf.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Active Profile</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Currently Loaded
                      </span>
                    </div>
                    <div className="text-base font-bold text-white">{activeProf.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Updated: {new Date(activeProf.updatedAt).toLocaleDateString()} {new Date(activeProf.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-amber-400 font-semibold mt-0.5">
                    Theme: <span className="capitalize">{activeProf.config.theme}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Available Profiles ({profiles.length})
                </h3>

                {!showCreateForm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Profile
                  </button>
                )}
              </div>

              {/* Create Profile Form */}
              {showCreateForm && (
                <form 
                  onSubmit={handleCreateProfileSubmit}
                  className="p-4 rounded-xl bg-neutral-950 border border-amber-500/40 space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Create New User Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-neutral-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Profile Name:
                      </label>
                      <input
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="e.g. Pixel Level Designer, Jesse Main, RPG Architect..."
                        required
                        autoFocus
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Select Avatar Emoji:
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {EMOJI_AVATARS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewProfileAvatar(emoji)}
                            className={`p-1.5 text-base rounded-lg border transition ${
                              newProfileAvatar === emoji
                                ? 'bg-amber-500/20 border-amber-500 scale-110'
                                : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newProfileName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Profiles List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles.map((p) => {
                  const isActive = p.id === activeProf.id;
                  const isEditing = p.id === editingProfileId;

                  if (isEditing) {
                    return (
                      <div key={p.id} className="p-4 rounded-xl bg-neutral-950 border border-sky-500/40 space-y-3">
                        <div className="text-xs font-bold text-sky-300">Edit Profile Details</div>
                        <div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                          {EMOJI_AVATARS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setEditAvatar(e)}
                              className={`p-1 text-sm rounded border ${
                                editAvatar === e ? 'bg-sky-500/20 border-sky-400' : 'bg-neutral-900 border-neutral-800'
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingProfileId(null)}
                            className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-400 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-3 py-1 rounded bg-sky-500 text-neutral-950 text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProfile(p.id)}
                      className={`group cursor-pointer p-3.5 rounded-xl border transition flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/40'
                          : 'bg-neutral-950/80 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                          {p.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-amber-200 transition">
                              {p.name}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-neutral-950">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Theme: <span className="capitalize text-neutral-300">{p.config.theme}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                          title="Edit profile info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfileClick(p.id, p.name);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 transition"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: Global Editor & App Config Defaults */}
          {activeTab === 'config' && (
            <div className="space-y-6">

              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Config changes apply live to current profile: <strong>{activeProf.name}</strong></span>
                </div>
                <span className="font-mono text-[10px] text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded border border-sky-600/40">
                  Auto-Cached
                </span>
              </div>

              {/* Section 1: UI Theme (Read-Only Info Card) */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4" /> Active Visual Theme
                  </h4>
                  <span 
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                      borderColor: `rgba(${primaryDef.rgb}, 0.4)`,
                      color: primaryDef.hex
                    }}
                  >
                    {theme.name}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                        borderColor: primaryDef.hex,
                        color: primaryDef.hex
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{theme.name}</span>
                        {theme.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            CUSTOM PALETTE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Primary Accent: <span className="font-mono font-bold" style={{ color: primaryDef.hex }}>{primaryDef.hex.toUpperCase()} ({primaryDef.name})</span>
                      </div>
                    </div>
                  </div>

                  {onOpenThemeModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenThemeModal();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition shrink-0 self-start sm:self-center"
                    >
                      <Palette size={14} className="text-amber-400" />
                      <span>Configure Theme</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 3: Cloud Storage Connections & Backup Defaults */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="w-4 h-4" /> Cloud Storage Connections
                  </h4>
                  <span className="text-[10px] text-neutral-400">
                    Locations appear in the File Sub-Module when connected
                  </span>
                </div>

                {/* Cloud Provider Connection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Google Drive Card */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    gdriveToken ? 'bg-amber-950/20 border-amber-500/40' : 'bg-neutral-900 border-neutral-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Cloud size={14} />
                        </div>
                        <span className="text-xs font-bold text-neutral-200">Google Drive</span>
                      </div>
                      {gdriveToken ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 size={10} /> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono">Not Connected</span>
                      )}
                    </div>

                    {gdriveToken ? (
                      <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                        <div className="text-[11px] text-neutral-300 truncate font-mono">
                          {gdriveUser?.email || gdriveUser?.displayName || 'Authorized Account'}
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectGDrive}
                          className="w-full py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-rose-950/40 hover:border-rose-500/50 hover:text-rose-300 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <LogOut size={12} /> Disconnect Google Drive
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-neutral-400">
                          Connect Google Drive to save projects and access cloud backups.
                        </p>
                        <button
                          type="button"
                          onClick={handleConnectGDrive}
                          disabled={isConnectingGDrive}
                          className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          {isConnectingGDrive ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" /> Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink size={12} /> Connect Google Drive
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Microsoft OneDrive Card */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    onedriveToken ? 'bg-sky-950/20 border-sky-500/40' : 'bg-neutral-900 border-neutral-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                          <Cloud size={14} />
                        </div>
                        <span className="text-xs font-bold text-neutral-200">Microsoft OneDrive</span>
                      </div>
                      {onedriveToken ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 size={10} /> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono">Not Connected</span>
                      )}
                    </div>

                    {onedriveToken ? (
                      <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                        <div className="text-[11px] text-neutral-300 truncate font-mono">
                          {onedriveUser?.displayName || onedriveUser?.userPrincipalName || onedriveUser?.email || 'Authorized Account'}
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectOneDrive}
                          className="w-full py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-rose-950/40 hover:border-rose-500/50 hover:text-rose-300 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <LogOut size={12} /> Disconnect OneDrive
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-neutral-400">
                          Connect OneDrive to sync maps and assets across devices.
                        </p>
                        <button
                          type="button"
                          onClick={handleConnectOneDrive}
                          disabled={isConnectingOneDrive}
                          className="w-full py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 text-xs font-bold shadow-md shadow-sky-500/10 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          {isConnectingOneDrive ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" /> Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink size={12} /> Connect OneDrive
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-Backup System Settings */}
                <div className="pt-2 border-t border-neutral-850 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Auto-Backup Interval:
                      </label>
                      <select
                        value={currentConfig.autoBackupIntervalMinutes}
                        onChange={(e) => handleUpdateConfigValue('autoBackupIntervalMinutes', parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value={3}>Every 3 Minutes</option>
                        <option value={5}>Every 5 Minutes</option>
                        <option value={10}>Every 10 Minutes (Default)</option>
                        <option value={15}>Every 15 Minutes</option>
                        <option value={30}>Every 30 Minutes</option>
                      </select>
                    </div>

                    <div className="space-y-2.5 pt-1 sm:pt-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cfgAutoBackup"
                          checked={currentConfig.autoBackupEnabled}
                          onChange={(e) => handleUpdateConfigValue('autoBackupEnabled', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="cfgAutoBackup" className="text-xs text-neutral-200 cursor-pointer select-none">
                          Auto-Backup System Enabled
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cfgLocationSync"
                          checked={currentConfig.locationBookmarksSync}
                          onChange={(e) => handleUpdateConfigValue('locationBookmarksSync', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="cfgLocationSync" className="text-xs text-neutral-200 cursor-pointer select-none">
                          Sync Location Bookmarks Cross-Modal
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Import / Export Config File */}
          {activeTab === 'export' && (
            <div className="space-y-6">

              {/* Informational Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-emerald-950/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Cross-App Configuration Portability</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Your Mason configuration and user profiles are automatically cached in browser storage. When you open any Mason map editor session on this device, your active profile settings will be auto-loaded. You can also export your settings to a <code>.json</code> file to transfer them into ANY other Mason app instance on another computer or browser!
                </p>
              </div>

              {/* Export & Import Profile Options via Files Sub-Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* OPTION 1: Export Profile */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-900 text-emerald-300 border border-neutral-800">
                        .json
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Export Profile
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Export active profile <strong className="text-white">"{activeProf.name}"</strong> and settings to a JSON configuration file using the Files sub-module to Local Disk, OneDrive, or Google Drive.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportProfileClick}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Profile</span>
                  </button>
                </div>

                {/* OPTION 2: Import Profile */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-4 hover:border-sky-500/40 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-900 text-sky-300 border border-neutral-800">
                        .json
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Import Profile
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Import a saved profile <code className="text-sky-300">.json</code> file from Local Storage, OneDrive, or Google Drive using the Files sub-module to update or restore settings.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleImportProfileClick}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Profile</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Profile: <strong className="text-white">{activeProf.name}</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
