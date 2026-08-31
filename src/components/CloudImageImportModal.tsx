import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Folder, 
  FolderOpen, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Upload, 
  Check, 
  X, 
  Scissors, 
  Image as ImageIcon, 
  FileCode, 
  Layers, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  FolderArchive,
  Database,
  ExternalLink,
  Sliders,
  FolderTree,
  FileCheck
} from 'lucide-react';
import { MasonProject, ImageFile, SpriteFile } from '../engine/masonProjectSchema';
import { getActiveMasonProject } from '../utils/masonStorage';
import { 
  getGoogleDriveToken, 
  getGoogleDriveUser, 
  authenticateGoogleDrive, 
  disconnectGoogleDrive, 
  listGoogleDriveFolderContents, 
  DriveItem,
  downloadFileAsDataUrlFromGoogleDrive,
  downloadFileAsTextFromGoogleDrive
} from '../utils/googleDriveStorage';
import { 
  getOneDriveToken, 
  getOneDriveUser, 
  authenticateOneDrive, 
  disconnectOneDrive, 
  listOneDriveFolderContents, 
  OneDriveItem,
  downloadFileAsDataUrlFromOneDrive,
  downloadFileAsTextFromOneDrive,
  CloudProvider,
  getActiveCloudProvider,
  setActiveCloudProvider
} from '../utils/oneDriveStorage';

export interface CloudImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: MasonProject;
  mode?: 'sprite_editor' | 'select_image';
  title?: string;
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
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

interface VirtualDriveItem {
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

export const CloudImageImportModal: React.FC<CloudImageImportModalProps> = ({
  isOpen,
  onClose,
  project,
  mode = 'sprite_editor',
  title = 'Import',
  activeSpriteName = 'Current Sprite',
  onSelectImage,
  onImportSingleImage,
  onImportSpritesheet,
  onImportSpriteProject,
  onShowToast
}) => {
  if (!isOpen) return null;

  // Active Project resolution
  const activeProject = useMemo(() => project || getActiveMasonProject(), [project]);

  // Helper to determine active tab based on project cloud login state
  const getInitialProviderTab = (): 'gdrive' | 'onedrive' | 'virtual' | 'local' => {
    const activeProvider = getActiveCloudProvider();
    const gdTok = getGoogleDriveToken();
    const odTok = getOneDriveToken();
    if (activeProvider === 'onedrive' && odTok) return 'onedrive';
    if (activeProvider === 'gdrive' && gdTok) return 'gdrive';
    if (gdTok) return 'gdrive';
    if (odTok) return 'onedrive';
    // If virtual drive has items, default to virtual drive if cloud not connected
    if ((activeProject?.fileSystem?.images || []).length > 0) return 'virtual';
    return activeProvider === 'onedrive' ? 'onedrive' : 'gdrive';
  };

  // Active Provider tab: 'gdrive' | 'onedrive' | 'virtual' | 'local'
  const [activeTab, setActiveTab] = useState<'gdrive' | 'onedrive' | 'virtual' | 'local'>(getInitialProviderTab);

  // Authentication & State
  const [gdriveToken, setGdriveToken] = useState<string | null>(getGoogleDriveToken());
  const [gdriveUser, setGdriveUser] = useState<any>(getGoogleDriveUser());
  const [onedriveToken, setOnedriveToken] = useState<string | null>(getOneDriveToken());
  const [onedriveUser, setOnedriveUser] = useState<any>(getOneDriveUser());

  // Folder navigation state for Cloud tabs
  const [currentFolder, setCurrentFolder] = useState<FolderBreadcrumb>({ id: null, name: 'Root Directory' });
  const [pathStack, setPathStack] = useState<FolderBreadcrumb[]>([{ id: null, name: 'Root Directory' }]);
  const [folderItems, setFolderItems] = useState<(DriveItem | OneDriveItem)[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'images' | 'sprites'>('all');

  // Selected file state
  const [selectedItem, setSelectedItem] = useState<(DriveItem | OneDriveItem | VirtualDriveItem) | null>(null);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [selectedImageDims, setSelectedImageDims] = useState<{ width: number; height: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Import configuration (for Sprite Editor mode)
  const [targetMode, setTargetMode] = useState<'new' | 'replace'>('new');
  const [customSpriteName, setCustomSpriteName] = useState('');

  // Local file upload input ref & state
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const [localDragging, setLocalDragging] = useState(false);

  // Synchronize cloud tokens and load folder contents on mount / open
  useEffect(() => {
    if (!isOpen) return;
    const gdTok = getGoogleDriveToken();
    const gdUsr = getGoogleDriveUser();
    const odTok = getOneDriveToken();
    const odUsr = getOneDriveUser();

    setGdriveToken(gdTok);
    setGdriveUser(gdUsr);
    setOnedriveToken(odTok);
    setOnedriveUser(odUsr);

    const initialTab = getInitialProviderTab();
    setActiveTab(initialTab);
  }, [isOpen]);

  // Load items whenever folder or active provider changes
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'local' || activeTab === 'virtual') {
      setFolderItems([]);
      setSelectedItem(null);
      setSelectedImageDataUrl(null);
      setSelectedImageDims(null);
      return;
    }

    loadFolder(currentFolder.id);
  }, [activeTab, currentFolder.id, isOpen]);

  const loadFolder = async (folderId: string | null) => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedItem(null);
    setSelectedImageDataUrl(null);
    setSelectedImageDims(null);

    try {
      if (activeTab === 'gdrive') {
        const token = getGoogleDriveToken();
        if (!token) {
          setFolderItems([]);
          setLoading(false);
          return;
        }
        const items = await listGoogleDriveFolderContents(folderId);
        setFolderItems(items);
      } else if (activeTab === 'onedrive') {
        const token = getOneDriveToken();
        if (!token) {
          setFolderItems([]);
          setLoading(false);
          return;
        }
        const items = await listOneDriveFolderContents(folderId);
        setFolderItems(items);
      }
    } catch (err: any) {
      console.warn('Folder fetch error:', err);
      setErrorMsg(err.message || 'Failed to load folder items.');
      if (onShowToast) onShowToast(err.message || 'Failed to list files from cloud drive', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google Drive Connect
  const handleConnectGoogleDrive = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authenticateGoogleDrive();
      setGdriveToken(getGoogleDriveToken());
      setGdriveUser(getGoogleDriveUser());
      setActiveCloudProvider('gdrive');
      if (onShowToast) onShowToast('Connected to Google Drive successfully!', 'success');
      loadFolder(currentFolder.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authentication failed.');
      if (onShowToast) onShowToast(err.message || 'Google Drive connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // OneDrive Connect
  const handleConnectOneDrive = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authenticateOneDrive();
      setOnedriveToken(getOneDriveToken());
      setOnedriveUser(getOneDriveUser());
      setActiveCloudProvider('onedrive');
      if (onShowToast) onShowToast('Connected to Microsoft OneDrive successfully!', 'success');
      loadFolder(currentFolder.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'OneDrive authentication failed.');
      if (onShowToast) onShowToast(err.message || 'OneDrive connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navigate into subfolder
  const handleNavigateToFolder = (folder: DriveItem | OneDriveItem) => {
    const nextBreadcrumb: FolderBreadcrumb = { id: folder.id, name: folder.name };
    setCurrentFolder(nextBreadcrumb);
    setPathStack(prev => [...prev, nextBreadcrumb]);
  };

  // Navigate back one level
  const handleNavigateUp = () => {
    if (pathStack.length <= 1) return;
    const nextStack = [...pathStack];
    nextStack.pop();
    const parentFolder = nextStack[nextStack.length - 1];
    setPathStack(nextStack);
    setCurrentFolder(parentFolder);
  };

  // Navigate to specific breadcrumb
  const handleJumpToBreadcrumb = (index: number) => {
    if (index >= pathStack.length) return;
    const nextStack = pathStack.slice(0, index + 1);
    setPathStack(nextStack);
    setCurrentFolder(nextStack[index]);
  };

  // Check if an item is an image or sprite
  const isImageFile = (name: string, mimeType?: string) => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.bmp') ||
      lower.endsWith('.svg') ||
      (mimeType && mimeType.startsWith('image/'))
    );
  };

  const isSpriteProjectFile = (name: string) => {
    const lower = name.toLowerCase();
    return lower.endsWith('.sprite') || lower.endsWith('.json') || lower.endsWith('.mason');
  };

  // Select a file from cloud list
  const handleSelectItem = async (item: DriveItem | OneDriveItem) => {
    if (item.isFolder) {
      handleNavigateToFolder(item);
      return;
    }

    setSelectedItem(item);
    setLoadingPreview(true);
    setSelectedImageDataUrl(null);
    setSelectedImageDims(null);

    const cleanBaseName = item.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
    setCustomSpriteName(cleanBaseName || 'Imported Sprite');

    try {
      let dataUrl: string | null = null;
      if (activeTab === 'gdrive') {
        dataUrl = await downloadFileAsDataUrlFromGoogleDrive(item.id);
      } else if (activeTab === 'onedrive') {
        dataUrl = await downloadFileAsDataUrlFromOneDrive({ id: item.id, downloadUrl: (item as any).downloadUrl });
      }

      if (dataUrl) {
        setSelectedImageDataUrl(dataUrl);
        const img = new Image();
        img.onload = () => {
          setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = dataUrl;
      }
    } catch (err: any) {
      console.warn('Failed to load file preview:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to download preview from cloud', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Select a virtual drive item
  const handleSelectVirtualItem = (item: VirtualDriveItem) => {
    setSelectedItem(item);
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

  // Handle local file selection / drop
  const handleProcessLocalFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const cleanBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
      setCustomSpriteName(cleanBaseName || 'Local Sprite');

      const mockItem: DriveItem = {
        id: `local_${Date.now()}`,
        name: file.name,
        isFolder: false,
        mimeType: file.type || 'image/png',
        modifiedTime: new Date().toISOString(),
        size: `${file.size}`
      };

      setSelectedItem(mockItem);
      setSelectedImageDataUrl(result);

      const img = new Image();
      img.onload = () => {
        setSelectedImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Virtual drive image items
  const virtualDriveItems = useMemo<VirtualDriveItem[]>(() => {
    const list: VirtualDriveItem[] = [];
    if (!activeProject || !activeProject.fileSystem) return list;

    // 1. Virtual Drive Images
    const images = activeProject.fileSystem.images || [];
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

    // 2. Spritesheet textures from Prefabs (if any)
    const prefabs = activeProject.fileSystem.prefabs || [];
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
  }, [activeProject]);

  // Perform Load as Single Image (Image Editor mode)
  const handleConfirmSingleImage = () => {
    if (!selectedImageDataUrl || !selectedItem) return;
    const finalName = customSpriteName.trim() || selectedItem.name.replace(/\.[^.]+$/, '');
    if (onImportSingleImage) {
      onImportSingleImage(selectedImageDataUrl, selectedItem.name, targetMode, finalName);
    }
    if (onShowToast) onShowToast(`Loaded "${finalName}" into Image Studio`, 'success');
    onClose();
  };

  // Perform Load as Spritesheet (Image Editor mode)
  const handleConfirmSpritesheet = () => {
    if (!selectedImageDataUrl || !selectedItem) return;
    const finalName = customSpriteName.trim() || selectedItem.name.replace(/\.[^.]+$/, '');
    if (onImportSpritesheet) {
      onImportSpritesheet(selectedImageDataUrl, selectedItem.name, targetMode, finalName);
    }
    onClose();
  };

  // Perform Select Image for Slicing (Slicing / Sub-module mode)
  const handleConfirmSelectForSlicing = () => {
    if (!selectedImageDataUrl || !selectedItem) return;
    const finalName = customSpriteName.trim() || selectedItem.name.replace(/\.[^.]+$/, '');
    if (onSelectImage) {
      onSelectImage(selectedImageDataUrl, selectedItem.name);
    } else if (onImportSingleImage) {
      onImportSingleImage(selectedImageDataUrl, selectedItem.name, 'new', finalName);
    }
    onClose();
  };

  // Filter folder items for Cloud
  const filteredCloudItems = folderItems.filter(item => {
    if (item.isFolder) {
      if (searchQuery.trim()) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    }

    const matchesSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const itemMime = 'mimeType' in item ? (item as any).mimeType : undefined;

    if (fileFilter === 'images') {
      return isImageFile(item.name, itemMime);
    }
    if (fileFilter === 'sprites') {
      return isSpriteProjectFile(item.name);
    }
    return isImageFile(item.name, itemMime) || isSpriteProjectFile(item.name);
  });

  // Filter virtual drive items
  const filteredVirtualItems = virtualDriveItems.filter(item => {
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (fileFilter === 'images') return item.type === 'image';
    if (fileFilter === 'sprites') return item.type === 'sprite';
    return true;
  });

  const isConnected = (activeTab === 'gdrive' && !!gdriveToken) || (activeTab === 'onedrive' && !!onedriveToken);
  const isSelectImageMode = mode === 'select_image' || !!onSelectImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  Cloud, Local & Virtual Drive
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Browse Google Drive, OneDrive, Local Files, or Project Virtual Drive images
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition border border-neutral-700/50"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="px-5 pt-3 pb-2 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('gdrive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'gdrive'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive</span>
              {gdriveToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('onedrive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'onedrive'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>OneDrive</span>
              {onedriveToken && (
                <span className="w-2 h-2 rounded-full bg-blue-400" title="Connected" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('virtual')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'virtual'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Virtual Drive</span>
              {virtualDriveItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[9px] font-mono">
                  {virtualDriveItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'local'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Local File</span>
            </button>
          </div>

          {/* Account status or Connect Button */}
          {activeTab === 'gdrive' && (
            <div className="flex items-center gap-2">
              {gdriveToken ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">{gdriveUser?.email || gdriveUser?.name || 'Google Drive Connected'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectGoogleDrive();
                      setGdriveToken(null);
                      setGdriveUser(null);
                      setFolderItems([]);
                    }}
                    className="ml-1 text-[10px] text-neutral-400 hover:text-rose-400 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogleDrive}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Connect Google Drive
                </button>
              )}
            </div>
          )}

          {activeTab === 'onedrive' && (
            <div className="flex items-center gap-2">
              {onedriveToken ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-950/30 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="font-medium">{onedriveUser?.email || onedriveUser?.displayName || 'OneDrive Connected'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectOneDrive();
                      setOnedriveToken(null);
                      setOnedriveUser(null);
                      setFolderItems([]);
                    }}
                    className="ml-1 text-[10px] text-neutral-400 hover:text-rose-400 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectOneDrive}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950/40 border border-blue-400/30"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Connect OneDrive
                </button>
              )}
            </div>
          )}

          {activeTab === 'virtual' && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-500/30">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Project Virtual Assets ({virtualDriveItems.length})</span>
            </div>
          )}
        </div>

        {/* Modal Main Body (File Explorer & Inspector Split) */}
        <div className="flex-1 min-h-[380px] max-h-[520px] flex flex-col md:flex-row overflow-hidden bg-neutral-950">
          
          {/* Left Column: Explorer, Virtual Drive List, or Local Dropzone */}
          <div className="flex-1 flex flex-col border-r border-neutral-800 overflow-hidden">
            {activeTab === 'virtual' ? (
              /* Virtual Drive Explorer */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-3 bg-neutral-900/70 border-b border-neutral-800 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search virtual drive images, prefabs..."
                      className="w-full pl-8 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Virtual Items Grid */}
                <div className="flex-1 p-3 overflow-y-auto min-h-[220px]">
                  {filteredVirtualItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <FolderArchive className="w-10 h-10 text-neutral-600" />
                      <h4 className="text-sm font-bold text-white">No Virtual Images Found</h4>
                      <p className="text-xs text-neutral-400 max-w-xs">
                        {searchQuery 
                          ? 'No virtual assets match your search term.' 
                          : 'Export images from Sprite Studio or import images to populate your project virtual drive.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredVirtualItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectVirtualItem(item)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition group ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-950/40'
                                : 'bg-neutral-900/60 hover:bg-neutral-850 border-neutral-800/60 hover:border-neutral-700'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                              <img
                                src={item.dataUrl}
                                alt={item.displayName || item.name}
                                className="max-w-full max-h-full object-contain image-rendering-pixelated"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-amber-300' : 'text-neutral-200 group-hover:text-white'
                              }`}>
                                {item.displayName || item.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
                                {item.width && item.height && (
                                  <span>{item.width}×{item.height}px</span>
                                )}
                                {item.category && (
                                  <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[9px]">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab !== 'local' ? (
              /* Cloud Storage Explorer */
              <>
                {/* Explorer Toolbar & Breadcrumbs */}
                <div className="p-3 bg-neutral-900/70 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-none text-xs">
                    <button
                      type="button"
                      onClick={handleNavigateUp}
                      disabled={pathStack.length <= 1 || loading}
                      className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
                      title="Go to parent folder"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 text-neutral-300 font-medium">
                      {pathStack.map((item, idx) => (
                        <React.Fragment key={item.id || `crumb_${idx}`}>
                          {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />}
                          <button
                            type="button"
                            onClick={() => handleJumpToBreadcrumb(idx)}
                            className={`px-1.5 py-0.5 rounded hover:bg-neutral-800 text-xs transition truncate max-w-[120px] ${
                              idx === pathStack.length - 1 ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {item.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={() => loadFolder(currentFolder.id)}
                    disabled={loading || !isConnected}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition disabled:opacity-40"
                    title="Refresh folder"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-3 py-2 bg-neutral-900/40 border-b border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search images, spritesheets..."
                      className="w-full pl-8 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFileFilter('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        fileFilter === 'all' ? 'bg-neutral-800 text-emerald-400 border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileFilter('images')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        fileFilter === 'images' ? 'bg-neutral-800 text-emerald-400 border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      Images
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileFilter('sprites')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        fileFilter === 'sprites' ? 'bg-neutral-800 text-emerald-400 border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      .sprite
                    </button>
                  </div>
                </div>

                {/* Items List / Grid */}
                <div className="flex-1 p-3 overflow-y-auto min-h-[220px]">
                  {!isConnected ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400">
                        <Cloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          Connect to {activeTab === 'gdrive' ? 'Google Drive' : 'OneDrive'}
                        </h4>
                        <p className="text-xs text-neutral-400 max-w-xs">
                          Sign in to browse and import your cloud-hosted spritesheets, textures, character art, and animation frames.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={activeTab === 'gdrive' ? handleConnectGoogleDrive : handleConnectOneDrive}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                      >
                        <Cloud className="w-4 h-4" />
                        Connect Account
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                      <p className="text-xs text-neutral-400">Fetching files from cloud drive...</p>
                    </div>
                  ) : errorMsg ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-rose-400" />
                      <p className="text-xs text-rose-300">{errorMsg}</p>
                      <button
                        type="button"
                        onClick={() => loadFolder(currentFolder.id)}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg transition"
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredCloudItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <FolderOpen className="w-8 h-8 text-neutral-600" />
                      <p className="text-xs text-neutral-400">
                        {searchQuery ? 'No matching images or sprites found in this folder.' : 'This folder contains no supported image or sprite files.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredCloudItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        const isFolder = item.isFolder;
                        const itemMime = 'mimeType' in item ? (item as any).mimeType : undefined;
                        const isImg = isImageFile(item.name, itemMime);
                        const isSpr = isSpriteProjectFile(item.name);
                        const rawSize = item.size ? (typeof item.size === 'number' ? item.size : parseInt(String(item.size), 10)) : 0;
                        const sizeDisplay = rawSize > 0 ? `${Math.round(rawSize / 1024) || 1} KB` : null;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition group ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                                : isFolder
                                ? 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800/80 hover:border-neutral-700'
                                : 'bg-neutral-900/60 hover:bg-neutral-850 border-neutral-800/60 hover:border-neutral-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isFolder
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                : isSpr
                                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            }`}>
                              {isFolder ? (
                                <Folder className="w-4 h-4" />
                              ) : isSpr ? (
                                <FileCode className="w-4 h-4" />
                              ) : (
                                <ImageIcon className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-emerald-300' : 'text-neutral-200 group-hover:text-white'
                              }`}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                <span>{isFolder ? 'Folder' : isImg ? 'Image / Spritesheet' : 'Sprite Project'}</span>
                                {sizeDisplay && <span>• {sizeDisplay}</span>}
                              </div>
                            </div>

                            {isFolder && (
                              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Local Drag & Drop Area */
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <input
                  ref={localFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,.sprite,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessLocalFile(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setLocalDragging(true);
                  }}
                  onDragLeave={() => setLocalDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setLocalDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessLocalFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => localFileInputRef.current?.click()}
                  className={`w-full max-w-md p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition space-y-3 ${
                    localDragging
                      ? 'border-purple-400 bg-purple-500/10 scale-102'
                      : 'border-neutral-700 bg-neutral-900/60 hover:border-purple-500/50 hover:bg-neutral-900'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      Drop Spritesheet or Image File Here
                    </h4>
                    <p className="text-xs text-neutral-400">
                      or click to browse your computer (.png, .jpg, .webp, .gif, .sprite)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Local File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Selected Image Inspector & Action Panel */}
          <div className="w-full md:w-80 bg-neutral-900/90 flex flex-col justify-between overflow-y-auto p-4 border-t md:border-t-0 border-neutral-800 space-y-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Image Import Inspector
              </h3>

              {/* Preview Box */}
              <div className="w-full aspect-video bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                {loadingPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-[11px] text-neutral-400">Downloading image...</span>
                  </div>
                ) : selectedImageDataUrl ? (
                  <img
                    src={selectedImageDataUrl}
                    alt={selectedItem?.name || 'Selected Preview'}
                    className="max-w-full max-h-full object-contain image-rendering-pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-neutral-600">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span className="text-[11px] text-neutral-500">No image selected</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              {selectedItem && (
                <div className="space-y-2.5 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">File Name</span>
                    <p className="text-xs font-bold text-white truncate" title={selectedItem.name}>
                      {'displayName' in selectedItem && selectedItem.displayName ? selectedItem.displayName : selectedItem.name}
                    </p>
                  </div>

                  {selectedImageDims && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-400">Resolution</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {selectedImageDims.width} × {selectedImageDims.height} px
                      </span>
                    </div>
                  )}

                  {/* Destination Sprite Option (Only for Sprite Editor mode) */}
                  {!isSelectImageMode && (
                    <div className="pt-2 border-t border-neutral-800 space-y-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Import Destination</span>
                      
                      <div className="grid grid-cols-2 gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setTargetMode('new')}
                          className={`py-1 rounded font-semibold transition ${
                            targetMode === 'new' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          New Sprite File
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetMode('replace')}
                          className={`py-1 rounded font-semibold transition ${
                            targetMode === 'replace' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Active Sprite
                        </button>
                      </div>

                      {targetMode === 'new' ? (
                        <div>
                          <label className="text-[10px] text-neutral-500">Sprite Name</label>
                          <input
                            type="text"
                            value={customSpriteName}
                            onChange={(e) => setCustomSpriteName(e.target.value)}
                            placeholder="Sprite Name"
                            className="w-full px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-300/90 leading-tight">
                          Will load directly into active sprite: <span className="font-bold">"{activeSpriteName}"</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              {isSelectImageMode ? (
                <button
                  type="button"
                  onClick={handleConfirmSelectForSlicing}
                  disabled={!selectedImageDataUrl || loadingPreview}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition border border-purple-400/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Select Image for Slicing</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmSpritesheet}
                    disabled={!selectedImageDataUrl || loadingPreview}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition border border-emerald-400/30"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Load as Spritesheet (Slice)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSingleImage}
                    disabled={!selectedImageDataUrl || loadingPreview}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-neutral-700/60"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Load as Single Image</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
