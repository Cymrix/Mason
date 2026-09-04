import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MasonProject, SpriteFile, ImageFile, SpriteExportMetadata } from '../engine/masonProjectSchema';
import { getModuleUrl } from '../engine/modulesRegistry';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { createNewSpriteInProject, saveActiveMasonProject } from '../utils/masonStorage';
import { sliceSpritesheetToFrames } from '../utils/spriteUtils';
import { VirtualExportImageModal, PendingExportData } from './VirtualExportImageModal';
import { UnifiedFileManagerModal } from './UnifiedFileManagerModal';
import { SpritesheetSliceModal } from './shared/spritesheet/SpritesheetSliceModal';
import { SpritesheetSliceResult } from './shared/spritesheet/types';
import { Image as ImageIcon, AlertTriangle, Save, Trash2, X, Cloud, Scissors, Upload } from 'lucide-react';

interface SpriteEditorWrapperProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject, options?: any) => void;
  onBackToDashboard: () => void;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  onRefreshFromLinked?: () => void;
  isSyncingLinked?: boolean;
  isOutOfSync?: boolean;
}

interface UnsavedAction {
  type: 'select' | 'new' | 'duplicate' | 'back' | 'custom';
  targetFileName?: string;
  newName?: string;
  onProceed?: () => Promise<void> | void;
}

export const SpriteEditorWrapper: React.FC<SpriteEditorWrapperProps> = ({
  project,
  onUpdateProject,
  onBackToDashboard,
  onShowToast,
  onRefreshFromLinked,
  isSyncingLinked = false,
  isOutOfSync = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isIframeReadyRef = useRef<boolean>(false);
  const projectRef = useRef<MasonProject>(project);
  projectRef.current = project;

  // Pending export modal data state
  const [pendingExportData, setPendingExportData] = useState<PendingExportData | null>(null);

  // Pending action state when unsaved changes exist
  const [pendingUnsavedAction, setPendingUnsavedAction] = useState<UnsavedAction | null>(null);
  const [isSavingPending, setIsSavingPending] = useState(false);

  // Cloud image and spritesheet import modal states
  const [showCloudImageModal, setShowCloudImageModal] = useState(false);
  const [showSliceModal, setShowSliceModal] = useState(false);
  const [sliceModalConfig, setSliceModalConfig] = useState<{
    imageUrl: string;
    fileName: string;
    targetMode: 'new' | 'replace';
    newSpriteName?: string;
  } | null>(null);

  // Fallback local toast if parent doesn't provide one
  const [localToast, setLocalToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const triggerToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onShowToast) {
      onShowToast(text, type);
    } else {
      setLocalToast({ text, type });
      setTimeout(() => setLocalToast(null), 3000);
    }
  }, [onShowToast]);

  // Ensure sprite array exists
  const rawSpriteFiles = project.fileSystem.sprites || [];
  
  // Active file resolution
  const [activeFileName, setActiveFileName] = useState<string>(() => {
    if (project.activeFiles?.spriteFileName && rawSpriteFiles.some(f => f.fileName === project.activeFiles.spriteFileName)) {
      return project.activeFiles.spriteFileName;
    }
    return rawSpriteFiles.length > 0 ? rawSpriteFiles[0].fileName : 'player_hero.sprite';
  });

  const activeFileNameRef = useRef<string>(activeFileName);
  activeFileNameRef.current = activeFileName;

  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef<boolean>(isDirty);
  isDirtyRef.current = isDirty;

  const [spriteDimensions, setSpriteDimensions] = useState<{ w: number; h: number }>({ w: 32, h: 32 });
  const [spriteFrameCount, setSpriteFrameCount] = useState<number>(1);

  // Initialize a default sprite if empty
  useEffect(() => {
    if (!project.fileSystem.sprites || project.fileSystem.sprites.length === 0) {
      const defaultSprite: SpriteFile = {
        id: 'sprite_player_hero',
        name: 'Player Hero',
        fileName: 'player_hero.sprite',
        updatedAt: new Date().toISOString(),
        spriteData: null
      };
      onUpdateProject(prev => ({
        ...prev,
        activeFiles: {
          ...prev.activeFiles,
          spriteFileName: defaultSprite.fileName
        },
        fileSystem: {
          ...prev.fileSystem,
          sprites: [defaultSprite]
        }
      }));
      setActiveFileName(defaultSprite.fileName);
    }
  }, [project.fileSystem.sprites, onUpdateProject]);

  const spriteFiles = project.fileSystem.sprites && project.fileSystem.sprites.length > 0
    ? project.fileSystem.sprites
    : [{
        id: 'sprite_player_hero',
        name: 'Player Hero',
        fileName: 'player_hero.sprite',
        updatedAt: new Date().toISOString(),
        spriteData: null
      }];

  const activeFile = spriteFiles.find(f => f.fileName === activeFileName) || spriteFiles[0];
  const activeFileRef = useRef(activeFile);
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  // Helper to safely post message to iframe
  const postToIframe = useCallback((message: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  const lastLoadedSpriteFileNameRef = useRef<string | null>(null);
  const lastLoadedSpriteUpdatedAtRef = useRef<string | null>(null);

  // Load a specific sprite file into the iframe
  const sendLoadFileToIframe = useCallback(async (file: SpriteFile) => {
    if (!iframeRef.current?.contentWindow) return;
    lastLoadedSpriteFileNameRef.current = file.fileName;
    lastLoadedSpriteUpdatedAtRef.current = file.updatedAt || null;
    if (file.spriteData) {
      postToIframe({
        type: 'LOAD_PROJECT',
        projectData: file.spriteData,
        projectName: file.name
      });
    } else if (file.imageUrl || file.dataUrl) {
      // Slicing spritesheet into animation frames if spriteData is not present
      const cols = file.exportSettings?.cols || 1;
      const rows = file.exportSettings?.rows || 1;
      const tw = file.exportSettings?.tileWidth || file.width || 32;
      const th = file.exportSettings?.tileHeight || file.height || 32;
      const imageSrc = file.imageUrl || file.dataUrl || '';

      const sliced = await sliceSpritesheetToFrames(imageSrc, cols, rows, tw, th);
      const projData = {
        version: 1,
        width: sliced.width,
        height: sliced.height,
        layers: sliced.frames[0]?.layers || [{ name: 'Layer 1', data: '' }],
        frames: sliced.frames,
        currentFrameIndex: 0,
        exportSettings: file.exportSettings || {
          exportMode: cols > 1 || rows > 1 ? 'spritesheet' : 'flattened',
          targetFileName: `${file.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
          cols,
          rows,
          tileWidth: sliced.width,
          tileHeight: sliced.height,
          frameCount: sliced.frames.length
        }
      };

      // Persist generated spriteData onto file
      onUpdateProject(prev => {
        const list = prev.fileSystem.sprites || [];
        const idx = list.findIndex(s => s.fileName === file.fileName);
        if (idx !== -1) {
          const updated = [...list];
          updated[idx] = {
            ...updated[idx],
            spriteData: projData,
            width: sliced.width,
            height: sliced.height
          };
          const updatedProj = {
            ...prev,
            fileSystem: { ...prev.fileSystem, sprites: updated }
          };
          saveActiveMasonProject(updatedProj, `Loaded and sliced sprite frames for ${file.name}`, undefined, { preserveUpdatedAt: true, skipBackups: true });
          return updatedProj;
        }
        return prev;
      });

      postToIframe({
        type: 'LOAD_PROJECT',
        projectData: projData,
        projectName: file.name
      });
    } else {
      postToIframe({
        type: 'LOAD_SPRITE',
        width: file.width || 32,
        height: file.height || 32,
        projectName: file.name
      });
    }
  }, [postToIframe, onUpdateProject]);

  // Reactively synchronize external spriteFileName selection (e.g. from PrefabEditor or Project Explorer)
  useEffect(() => {
    const externalFileName = project.activeFiles?.spriteFileName || activeFileName;
    if (externalFileName) {
      const list = project.fileSystem.sprites || [];
      const targetFile = list.find(f => f.fileName === externalFileName);
      if (targetFile) {
        const isFileChanged = lastLoadedSpriteFileNameRef.current !== externalFileName ||
          (targetFile.updatedAt && targetFile.updatedAt !== lastLoadedSpriteUpdatedAtRef.current);

        if (isFileChanged) {
          setActiveFileName(externalFileName);
          activeFileNameRef.current = externalFileName;
          if (isIframeReadyRef.current) {
            sendLoadFileToIframe(targetFile);
          }
        }
      }
    }
  }, [project.activeFiles?.spriteFileName, activeFileName, sendLoadFileToIframe, project.fileSystem.sprites]);

  // Request saving sprite canvas state directly and update project storage
  const saveActiveSprite = useCallback((targetFileName?: string): Promise<boolean> => {
    const fileToSave = targetFileName || activeFileNameRef.current;
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) {
        return resolve(false);
      }

      const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let resolved = false;

      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA_ERROR' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          triggerToast(`Failed to save sprite: ${e.data.error || 'Unknown error'}`, 'error');
          resolve(false);
          return;
        }
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);

          const spriteData = e.data.data;
          const targetName = fileToSave;
          const canvasDataUrl = e.data.spritesheetUrl || e.data.dataUrl || e.data.imageDataUrl;

          let savedFileDisplayName = 'Sprite';
          onUpdateProject(prev => {
            const list = prev.fileSystem.sprites || [];
            const idx = list.findIndex(f => f.fileName === targetName);
            
            let updatedSprites = [...list];
            let linkedImagesToUpdate: string[] = [];

            if (idx !== -1) {
              const activeSprite = list[idx];
              savedFileDisplayName = activeSprite.name || targetName;
              const nowIso = new Date().toISOString();
              
              lastLoadedSpriteUpdatedAtRef.current = nowIso;

              const updatedSpriteFile: SpriteFile = {
                ...activeSprite,
                updatedAt: nowIso,
                spriteData,
                ...(canvasDataUrl ? { dataUrl: canvasDataUrl, imageUrl: canvasDataUrl } : {})
              };
              updatedSprites[idx] = updatedSpriteFile;
              linkedImagesToUpdate = activeSprite.linkedImageFileNames || [];
            }

            // Sync corresponding ImageFile (.png) in fileSystem.images so PNG visuals stay 100% updated!
            const currentImages = prev.fileSystem.images || [];
            const cleanBase = targetName.replace(/\.sprite$/, '');
            const defaultPngName = `${cleanBase}.png`;

            let hasPngMatch = currentImages.some(img =>
              img.fileName === defaultPngName ||
              linkedImagesToUpdate.includes(img.fileName) ||
              img.sourceSpriteFileName === targetName
            );

            let updatedImages = currentImages.map(img => {
              const isMatch = img.fileName === defaultPngName ||
                linkedImagesToUpdate.includes(img.fileName) ||
                img.sourceSpriteFileName === targetName;

              if (isMatch && canvasDataUrl) {
                return {
                  ...img,
                  updatedAt: new Date().toISOString(),
                  dataUrl: canvasDataUrl
                };
              }
              return img;
            });

            if (!hasPngMatch && canvasDataUrl) {
              const newPngFile: ImageFile = {
                id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                fileName: defaultPngName,
                name: `${cleanBase}.png`,
                dataUrl: canvasDataUrl,
                width: 32,
                height: 32,
                updatedAt: new Date().toISOString(),
                sourceSpriteFileName: targetName
              };
              updatedImages = [...updatedImages, newPngFile];
            }

            const updatedProject = {
              ...prev,
              fileSystem: {
                ...prev.fileSystem,
                sprites: updatedSprites,
                images: updatedImages
              }
            };
            saveActiveMasonProject(updatedProject);
            return updatedProject;
          }, { actionLabel: `Saved sprite ${targetName}`, syncLinked: true } as any);

          setIsDirty(false);
          postToIframe({ type: 'MARK_CLEAN' });
          triggerToast(`Saved sprite "${savedFileDisplayName}" (${targetName})`, 'success');
          resolve(true);
        }
      };

      window.addEventListener('message', handler);

      postToIframe({
        type: 'REQUEST_SAVE',
        saveId,
        targetFileName: fileToSave,
        isExplicitSave: true
      });

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handler);
          triggerToast(`Failed to save sprite: Request timed out`, 'error');
          resolve(false);
        }
      }, 3000);
    });
  }, [postToIframe, onUpdateProject, triggerToast]);

  // Actual actions
  const doSwitchToFile = useCallback((targetFileName: string) => {
    setIsDirty(false);
    postToIframe({ type: 'MARK_CLEAN' });

    onUpdateProject(prev => ({
      ...prev,
      activeFiles: { ...prev.activeFiles, spriteFileName: targetFileName }
    }));

    setActiveFileName(targetFileName);
    const targetFile = (projectRef.current.fileSystem.sprites || []).find(f => f.fileName === targetFileName) || spriteFiles.find(f => f.fileName === targetFileName);
    if (targetFile) {
      sendLoadFileToIframe(targetFile);
    }
  }, [postToIframe, onUpdateProject, sendLoadFileToIframe, spriteFiles]);

  const doCreateNewFile = useCallback((name: string, width: number = 32, height: number = 32) => {
    setIsDirty(false);
    postToIframe({ type: 'MARK_CLEAN' });

    const { project: updatedProj, newFile } = createNewSpriteInProject(projectRef.current, name, width, height);

    const finalProject = {
      ...updatedProj,
      activeFiles: { ...updatedProj.activeFiles, spriteFileName: newFile.fileName }
    };

    onUpdateProject(() => finalProject);
    saveActiveMasonProject(finalProject);
    setActiveFileName(newFile.fileName);
    sendLoadFileToIframe(newFile);
    triggerToast(`Created new sprite "${name}" (${width}×${height})`, 'success');
  }, [postToIframe, onUpdateProject, sendLoadFileToIframe, triggerToast]);

  const doDuplicateFile = useCallback((fileName: string) => {
    setIsDirty(false);
    postToIframe({ type: 'MARK_CLEAN' });

    const currentSprites = projectRef.current.fileSystem.sprites || spriteFiles;
    const target = currentSprites.find(f => f.fileName === fileName) || activeFile;
    if (!target) return;

    const baseName = target.name.replace(/\s*\(Copy.*?\)$/i, '');
    const cleanFileBase = (target.fileName || 'sprite').replace(/\.sprite$/, '').replace(/_copy.*$/, '');
    const dupeId = `sprite_${Date.now()}`;
    const dupeName = `${baseName} (Copy)`;
    const dupeFileName = `${cleanFileBase}_copy_${Date.now().toString().slice(-4)}.sprite`;

    const dupeFile: SpriteFile = {
      id: dupeId,
      name: dupeName,
      fileName: dupeFileName,
      updatedAt: new Date().toISOString(),
      spriteData: target.spriteData ? JSON.parse(JSON.stringify(target.spriteData)) : null
    };

    onUpdateProject(prev => {
      const currentList = prev.fileSystem.sprites || [];
      const updatedProject = {
        ...prev,
        activeFiles: { ...prev.activeFiles, spriteFileName: dupeFileName },
        fileSystem: {
          ...prev.fileSystem,
          sprites: [...currentList, dupeFile]
        }
      };
      saveActiveMasonProject(updatedProject);
      return updatedProject;
    });

    setActiveFileName(dupeFileName);
    sendLoadFileToIframe(dupeFile);
    triggerToast(`Duplicated to "${dupeName}"`, 'success');
  }, [activeFile, onUpdateProject, postToIframe, sendLoadFileToIframe, spriteFiles, triggerToast]);

  // When a file is selected from the header
  const handleSelectFile = async (targetFileName: string) => {
    if (targetFileName === activeFileNameRef.current) return;

    if (isDirtyRef.current) {
      setPendingUnsavedAction({
        type: 'select',
        targetFileName,
        onProceed: () => doSwitchToFile(targetFileName)
      });
      return;
    }

    doSwitchToFile(targetFileName);
  };

  // Create a new sprite file
  const handleNewFile = async (name: string, dimensions?: { width: number; height: number }) => {
    const w = dimensions?.width || 32;
    const h = dimensions?.height || 32;
    if (isDirtyRef.current) {
      setPendingUnsavedAction({
        type: 'new',
        newName: name,
        onProceed: () => doCreateNewFile(name, w, h)
      });
      return;
    }

    doCreateNewFile(name, w, h);
  };

  // Duplicate the active or specified sprite file
  const handleDuplicateFile = async (fileName: string) => {
    if (fileName === activeFileNameRef.current && isDirtyRef.current) {
      setPendingUnsavedAction({
        type: 'duplicate',
        targetFileName: fileName,
        onProceed: () => doDuplicateFile(fileName)
      });
      return;
    }

    doDuplicateFile(fileName);
  };

  // Delete a sprite file
  const handleDeleteFile = (fileName: string) => {
    const currentSprites = projectRef.current.fileSystem.sprites || spriteFiles;
    if (currentSprites.length <= 1) {
      triggerToast('Cannot delete the last remaining sprite file.', 'error');
      return;
    }

    const targetToDelete = currentSprites.find(f => f.fileName === fileName);
    const targetName = targetToDelete?.name || fileName;

    const newRemaining = currentSprites.filter(f => f.fileName !== fileName);
    const nextFile = newRemaining[0];
    const isDeletingActive = fileName === activeFileNameRef.current;

    if (isDeletingActive) {
      setIsDirty(false);
      isDirtyRef.current = false;
      postToIframe({ type: 'MARK_CLEAN' });
    }

    onUpdateProject(prev => {
      const updatedList = (prev.fileSystem.sprites || []).filter(f => f.fileName !== fileName);
      const nextActiveFileName = isDeletingActive ? (nextFile?.fileName || '') : (prev.activeFiles.spriteFileName || '');
      const updatedProject = {
        ...prev,
        activeFiles: {
          ...prev.activeFiles,
          spriteFileName: nextActiveFileName
        },
        fileSystem: {
          ...prev.fileSystem,
          sprites: updatedList
        }
      };
      saveActiveMasonProject(updatedProject);
      return updatedProject;
    });

    if (isDeletingActive && nextFile) {
      setActiveFileName(nextFile.fileName);
      activeFileNameRef.current = nextFile.fileName;
      sendLoadFileToIframe(nextFile);
    }
    triggerToast(`Deleted sprite "${targetName}"`, 'info');
  };

  // Rename the active sprite (live input or modal rename)
  const handleRenameActiveFile = (newName: string) => {
    if (!activeFile) return;

    onUpdateProject(prev => {
      const list = prev.fileSystem.sprites || [];
      const idx = list.findIndex(f => f.fileName === activeFileNameRef.current);
      if (idx !== -1) {
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          name: newName,
          updatedAt: new Date().toISOString()
        };
        const updatedProj = {
          ...prev,
          fileSystem: { ...prev.fileSystem, sprites: updated }
        };
        saveActiveMasonProject(updatedProj);
        return updatedProj;
      }
      return prev;
    });

    // Notify iframe
    postToIframe({ type: 'SET_PROJECT_NAME', name: newName });
  };

  // Explicit Save File handler (Save disk icon in header)
  const handleSaveFile = async () => {
    await saveActiveSprite(activeFileNameRef.current);
  };

  // Export handler (Download icon in header)
  const handleExportFile = (_fileName: string) => {
    postToIframe({ type: 'REQUEST_EXPORT' });
  };

  // Register the global hook for synchronous project saving from EditorLayout or Ctrl+S
  useEffect(() => {
    (window as any).masonCheckSpriteDirty = () => isDirtyRef.current;
    (window as any).masonRequestSpriteSave = async () => {
      await saveActiveSprite(activeFileNameRef.current);
      return projectRef.current;
    };

    return () => {
      delete (window as any).masonCheckSpriteDirty;
      delete (window as any).masonRequestSpriteSave;
    };
  }, [saveActiveSprite]);

  // Save exported PNG images into project.fileSystem.images and link to active sprite
  const saveImageToProject = useCallback((
    pngFileName: string,
    dataUrl: string,
    displayName?: string,
    exportSettings?: SpriteExportMetadata
  ) => {
    const isGif = pngFileName.toLowerCase().endsWith('.gif');
    const cleanFileName = (pngFileName.endsWith('.png') || isGif) ? pngFileName : `${pngFileName}.png`;

    onUpdateProject(prev => {
      const currentImages = prev.fileSystem.images || [];

      const cleanBase = activeFileNameRef.current.replace(/\.sprite$/, '');
      const defaultPngName = `${cleanBase}.png`;
      const activeSprite = (prev.fileSystem.sprites || []).find(s => s.fileName === activeFileNameRef.current);
      const linkedList = activeSprite?.linkedImageFileNames || [];

      let existingIdx = currentImages.findIndex(img =>
        img.fileName === cleanFileName ||
        img.fileName === defaultPngName ||
        img.sourceSpriteFileName === activeFileNameRef.current ||
        linkedList.includes(img.fileName)
      );

      const targetFileName = existingIdx !== -1 ? currentImages[existingIdx].fileName : cleanFileName;
      const targetName = displayName || (existingIdx !== -1 ? currentImages[existingIdx].name : cleanFileName.replace(/\.(png|gif)$/i, ''));

      const newImgFile: ImageFile = {
        id: existingIdx !== -1 ? currentImages[existingIdx].id : `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: targetName,
        fileName: targetFileName,
        createdAt: existingIdx !== -1 ? currentImages[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataUrl,
        width: spriteDimensions.w,
        height: spriteDimensions.h,
        sourceSpriteFileName: activeFileNameRef.current,
        exportSettings
      };

      let updatedList: ImageFile[];
      if (existingIdx !== -1) {
        updatedList = [...currentImages];
        updatedList[existingIdx] = newImgFile;
      } else {
        updatedList = [...currentImages, newImgFile];
      }

      // Also link exportSettings & exported image on active SpriteFile
      const currentSprites = prev.fileSystem.sprites || [];
      const activeSpriteIdx = currentSprites.findIndex(s => s.fileName === activeFileNameRef.current);
      let updatedSprites = [...currentSprites];

      if (activeSpriteIdx !== -1) {
        const sprite = currentSprites[activeSpriteIdx];
        const newLinkedList = Array.from(new Set([...(sprite.linkedImageFileNames || []), targetFileName]));
        updatedSprites[activeSpriteIdx] = {
          ...sprite,
          updatedAt: new Date().toISOString(),
          exportSettings: exportSettings || sprite.exportSettings,
          linkedImageFileNames: newLinkedList
        };
      }

      const updatedProj = {
        ...prev,
        fileSystem: {
          ...prev.fileSystem,
          images: updatedList,
          sprites: updatedSprites
        }
      };
      saveActiveMasonProject(updatedProj, `Saved exported image "${targetFileName}"`);
      return updatedProj;
    }, { actionLabel: `Saved image ${cleanFileName}`, syncLinked: true });
  }, [onUpdateProject, spriteDimensions]);

  // Import a single image from Cloud Drive or local machine
  const handleImportSingleImage = useCallback(async (
    dataUrl: string, 
    fileName: string, 
    targetMode: 'new' | 'replace', 
    newSpriteName?: string
  ) => {
    // 1. Measure image dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = dataUrl;
    });

    const w = img.naturalWidth || 32;
    const h = img.naturalHeight || 32;
    const cleanBase = (newSpriteName || fileName).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').trim();
    const finalDisplayName = newSpriteName?.trim() || cleanBase || 'Imported Image';

    if (targetMode === 'new') {
      const uniqueFileName = `${cleanBase.toLowerCase()}.sprite`;
      let finalFileName = uniqueFileName;
      let counter = 2;
      const existingSprites = projectRef.current.fileSystem.sprites || [];
      while (existingSprites.some(s => s.fileName.toLowerCase() === finalFileName.toLowerCase())) {
        finalFileName = `${cleanBase.toLowerCase()}_${counter}.sprite`;
        counter++;
      }

      const pngFileName = `${finalFileName.replace(/\.sprite$/, '')}.png`;

      const newSpriteFile: SpriteFile = {
        id: `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: finalDisplayName,
        fileName: finalFileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        spriteData: {
          version: 1,
          width: w,
          height: h,
          fps: 8,
          layers: [{ id: 'layer_1', name: 'Background', visible: true, opacity: 1 }],
          frames: [{
            id: 'frame_1',
            name: 'Frame 1',
            duration: 125,
            layers: [{ id: 'layer_1', name: 'Background', data: dataUrl, visible: true, opacity: 1 }]
          }]
        },
        linkedImageFileNames: [pngFileName]
      };

      const newImageFile: ImageFile = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: finalDisplayName,
        fileName: pngFileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataUrl,
        width: w,
        height: h,
        sourceSpriteFileName: finalFileName
      };

      onUpdateProject(prev => {
        const sprites = [...(prev.fileSystem.sprites || []), newSpriteFile];
        const images = [...(prev.fileSystem.images || []).filter(img => img.fileName !== pngFileName), newImageFile];
        const updated = {
          ...prev,
          activeFiles: {
            ...prev.activeFiles,
            spriteFileName: finalFileName
          },
          fileSystem: {
            ...prev.fileSystem,
            sprites,
            images
          }
        };
        saveActiveMasonProject(updated, `Imported "${finalFileName}" from Cloud Drive`);
        return updated;
      });

      setActiveFileName(finalFileName);
      activeFileNameRef.current = finalFileName;
      setSpriteDimensions({ w, h });
      setSpriteFrameCount(1);

      // Notify iframe
      setTimeout(() => {
        postToIframe({
          type: 'LOAD_SPRITE',
          projectName: finalDisplayName,
          imageDataUrl: dataUrl,
          width: w,
          height: h
        });
      }, 80);

      triggerToast(`Loaded "${finalDisplayName}" (${w}×${h} px) into Image Studio`, 'success');
    } else {
      // Replace active sprite
      const curActiveFileName = activeFileNameRef.current;
      const pngFileName = `${curActiveFileName.replace(/\.sprite$/, '')}.png`;

      onUpdateProject(prev => {
        const sprites = (prev.fileSystem.sprites || []).map(s => {
          if (s.fileName === curActiveFileName) {
            return {
              ...s,
              name: newSpriteName?.trim() || s.name,
              updatedAt: new Date().toISOString(),
              spriteData: {
                version: 1,
                width: w,
                height: h,
                fps: 8,
                layers: [{ id: 'layer_1', name: 'Background', visible: true, opacity: 1 }],
                frames: [{
                  id: 'frame_1',
                  name: 'Frame 1',
                  duration: 125,
                  layers: [{ id: 'layer_1', name: 'Background', data: dataUrl, visible: true, opacity: 1 }]
                }]
              },
              linkedImageFileNames: Array.from(new Set([...(s.linkedImageFileNames || []), pngFileName]))
            };
          }
          return s;
        });

        const images = (prev.fileSystem.images || []).filter(img => img.fileName !== pngFileName);
        images.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: finalDisplayName,
          fileName: pngFileName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataUrl,
          width: w,
          height: h,
          sourceSpriteFileName: curActiveFileName
        });

        const updated = {
          ...prev,
          fileSystem: { ...prev.fileSystem, sprites, images }
        };
        saveActiveMasonProject(updated, `Updated "${curActiveFileName}" with imported image`);
        return updated;
      });

      setSpriteDimensions({ w, h });
      setSpriteFrameCount(1);

      postToIframe({
        type: 'LOAD_SPRITE',
        projectName: finalDisplayName,
        imageDataUrl: dataUrl,
        width: w,
        height: h
      });

      triggerToast(`Updated active sprite with image (${w}×${h} px)`, 'success');
    }
  }, [onUpdateProject, triggerToast, postToIframe]);

  // Open Spritesheet Slicer with selected cloud or local image
  const handleImportSpritesheet = useCallback((
    imageSrc: string, 
    fileName: string, 
    targetMode: 'new' | 'replace', 
    newSpriteName?: string
  ) => {
    setSliceModalConfig({
      imageUrl: imageSrc,
      fileName,
      targetMode,
      newSpriteName
    });
    setShowSliceModal(true);
  }, []);

  // Commit slice result to project
  const handleConfirmSliceResult = useCallback(async (result: SpritesheetSliceResult) => {
    if (!sliceModalConfig) return;
    const { targetMode, newSpriteName, fileName } = sliceModalConfig;

    const sliceOutcome = await sliceSpritesheetToFrames(
      result.imageUrl,
      result.cols,
      result.rows,
      result.tileWidth,
      result.tileHeight,
      {
        marginX: result.marginX,
        marginY: result.marginY,
        spacingX: result.spacingX,
        spacingY: result.spacingY,
        totalFrames: result.totalFrames
      }
    );

    const tw = sliceOutcome.width || result.tileWidth || 32;
    const th = sliceOutcome.height || result.tileHeight || 32;
    const cleanBase = (newSpriteName || result.name || fileName).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').trim();
    const finalDisplayName = newSpriteName?.trim() || result.name || cleanBase || 'Sliced Spritesheet';

    const spriteProjectData = {
      version: 1,
      width: tw,
      height: th,
      fps: 8,
      layers: [{ id: 'layer_1', name: 'Layer 1', visible: true, opacity: 1 }],
      frames: sliceOutcome.frames.map((f, idx) => ({
        id: `frame_${idx + 1}`,
        name: f.name || `Frame ${idx + 1}`,
        duration: 125,
        layers: f.layers.map((l, lIdx) => ({
          id: `layer_${lIdx + 1}`,
          name: l.name || `Layer ${lIdx + 1}`,
          data: l.data || '',
          visible: true,
          opacity: 1
        }))
      }))
    };

    if (targetMode === 'new') {
      const uniqueFileName = `${cleanBase.toLowerCase()}.sprite`;
      let finalFileName = uniqueFileName;
      let counter = 2;
      const existingSprites = projectRef.current.fileSystem.sprites || [];
      while (existingSprites.some(s => s.fileName.toLowerCase() === finalFileName.toLowerCase())) {
        finalFileName = `${cleanBase.toLowerCase()}_${counter}.sprite`;
        counter++;
      }

      const pngFileName = `${finalFileName.replace(/\.sprite$/, '')}.png`;

      const newSpriteFile: SpriteFile = {
        id: `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: finalDisplayName,
        fileName: finalFileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        spriteData: spriteProjectData,
        linkedImageFileNames: [pngFileName]
      };

      const newImageFile: ImageFile = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: finalDisplayName,
        fileName: pngFileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataUrl: result.imageUrl,
        width: result.imageWidth,
        height: result.imageHeight,
        sourceSpriteFileName: finalFileName
      };

      onUpdateProject(prev => {
        const sprites = [...(prev.fileSystem.sprites || []), newSpriteFile];
        const images = [...(prev.fileSystem.images || []).filter(img => img.fileName !== pngFileName), newImageFile];
        const updated = {
          ...prev,
          activeFiles: {
            ...prev.activeFiles,
            spriteFileName: finalFileName
          },
          fileSystem: {
            ...prev.fileSystem,
            sprites,
            images
          }
        };
        saveActiveMasonProject(updated, `Imported spritesheet "${finalFileName}" with ${sliceOutcome.frames.length} frames`);
        return updated;
      });

      setActiveFileName(finalFileName);
      activeFileNameRef.current = finalFileName;
      setSpriteDimensions({ w: tw, h: th });
      setSpriteFrameCount(sliceOutcome.frames.length);

      setTimeout(() => {
        postToIframe({
          type: 'LOAD_PROJECT',
          projectName: finalDisplayName,
          projectData: spriteProjectData
        });
      }, 80);

      triggerToast(`Loaded spritesheet "${finalDisplayName}" with ${sliceOutcome.frames.length} frames (${tw}×${th} px)`, 'success');
    } else {
      // Replace active sprite
      const curActiveFileName = activeFileNameRef.current;
      const pngFileName = `${curActiveFileName.replace(/\.sprite$/, '')}.png`;

      onUpdateProject(prev => {
        const sprites = (prev.fileSystem.sprites || []).map(s => {
          if (s.fileName === curActiveFileName) {
            return {
              ...s,
              name: finalDisplayName,
              updatedAt: new Date().toISOString(),
              spriteData: spriteProjectData,
              linkedImageFileNames: Array.from(new Set([...(s.linkedImageFileNames || []), pngFileName]))
            };
          }
          return s;
        });

        const images = (prev.fileSystem.images || []).filter(img => img.fileName !== pngFileName);
        images.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: finalDisplayName,
          fileName: pngFileName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataUrl: result.imageUrl,
          width: result.imageWidth,
          height: result.imageHeight,
          sourceSpriteFileName: curActiveFileName
        });

        const updated = {
          ...prev,
          fileSystem: { ...prev.fileSystem, sprites, images }
        };
        saveActiveMasonProject(updated, `Updated "${curActiveFileName}" with sliced spritesheet`);
        return updated;
      });

      setSpriteDimensions({ w: tw, h: th });
      setSpriteFrameCount(sliceOutcome.frames.length);

      postToIframe({
        type: 'LOAD_PROJECT',
        projectName: finalDisplayName,
        projectData: spriteProjectData
      });

      triggerToast(`Updated "${curActiveFileName}" with ${sliceOutcome.frames.length} frames (${tw}×${th} px)`, 'success');
    }

    setShowSliceModal(false);
    setSliceModalConfig(null);
  }, [sliceModalConfig, onUpdateProject, triggerToast, postToIframe]);

  // Handle postMessages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'SPRITE_READY') {
        const wasReady = isIframeReadyRef.current;
        isIframeReadyRef.current = true;
        if (!wasReady && activeFileRef.current) {
          sendLoadFileToIframe(activeFileRef.current);
        }
        postToIframe({ type: 'REQUEST_STATUS' });
      } else if (e.data.type === 'SPRITE_SAVED') {
        const dataUrl = e.data.spritesheetUrl || e.data.dataUrl;
        if (dataUrl) {
          const cleanName = (e.data.projectName || activeFile?.name || 'sprite').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const pngFileName = `${cleanName}.png`;

          saveImageToProject(pngFileName, dataUrl, e.data.projectName || activeFile?.name, e.data.exportSettings);

          triggerToast(`Saved "${pngFileName}" to /images/`, 'success');
        }
      } else if (e.data.type === 'IMAGE_EXPORTED') {
        const dataUrl = e.data.dataUrl;
        if (dataUrl) {
          const rawName = e.data.filename || `${activeFile?.name || 'export'}.png`;
          const activeSpriteName = activeFile?.name || 'Sprite';
          const cleanActiveBase = activeSpriteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          
          let defaultFileName = rawName.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
          if (defaultFileName.includes('untitled') || !defaultFileName) {
            defaultFileName = `${cleanActiveBase}.png`;
          }

          setPendingExportData({
            dataUrl,
            defaultFileName,
            defaultDisplayName: activeSpriteName,
            exportSettings: e.data.exportSettings,
            exportType: e.data.exportType || 'Rendered Image Export',
            width: spriteDimensions.w,
            height: spriteDimensions.h
          });
        }
      } else if (e.data.type === 'SPRITE_STATUS_UPDATE' || e.data.type === 'SPRITE_STATUS') {
        const wasReady = isIframeReadyRef.current;
        isIframeReadyRef.current = true;
        if (!wasReady && activeFileRef.current) {
          sendLoadFileToIframe(activeFileRef.current);
        }
        if (typeof e.data.width === 'number' && typeof e.data.height === 'number') {
          setSpriteDimensions({ w: e.data.width, h: e.data.height });
        }
        if (typeof e.data.frameCount === 'number') {
          setSpriteFrameCount(e.data.frameCount);
        }
        if (typeof e.data.isDirty === 'boolean') {
          setIsDirty(e.data.isDirty);
        }
      } else if (e.data.type === 'SPRITE_NAME_CHANGED') {
        if (e.data.name && typeof e.data.name === 'string') {
          onUpdateProject(prev => {
            const list = prev.fileSystem.sprites || [];
            const idx = list.findIndex(f => f.fileName === activeFileNameRef.current);
            if (idx !== -1 && list[idx].name !== e.data.name) {
              const updated = [...list];
              updated[idx] = {
                ...updated[idx],
                name: e.data.name,
                updatedAt: new Date().toISOString()
              };
              return {
                ...prev,
                fileSystem: { ...prev.fileSystem, sprites: updated }
              };
            }
            return prev;
          });
        }
      } else if (e.data.type === 'SPRITE_DIRTY') {
        setIsDirty(!!e.data.isDirty);
      } else if (e.data.type === 'OPEN_IMPORT_MODAL' || e.data.type === 'OPEN_CLOUD_IMPORT') {
        setShowCloudImageModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onUpdateProject, triggerToast, activeFile]);

  // Handshake retry timer to ping iframe until SPRITE_READY is received
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;
    const ping = () => {
      if (!isIframeReadyRef.current && iframeRef.current?.contentWindow) {
        postToIframe({ type: 'REQUEST_STATUS' });
      } else if (isIframeReadyRef.current && timerId) {
        clearInterval(timerId);
      }
    };
    ping();
    timerId = setInterval(ping, 150);
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [postToIframe]);

  const handleBackToDashboard = async () => {
    if (isDirtyRef.current) {
      setPendingUnsavedAction({
        type: 'back',
        onProceed: () => {
          setIsDirty(false);
          postToIframe({ type: 'MARK_CLEAN' });
          onBackToDashboard();
        }
      });
      return;
    }
    onBackToDashboard();
  };

  const handleConfirmSaveAction = async () => {
    if (!pendingUnsavedAction) return;
    setIsSavingPending(true);
    try {
      const savedOk = await saveActiveSprite(activeFileNameRef.current);
      if (savedOk) {
        const action = pendingUnsavedAction;
        setPendingUnsavedAction(null);
        if (action.onProceed) {
          await action.onProceed();
        }
      }
    } catch (err) {
      triggerToast('Failed to save sprite before switching', 'error');
    } finally {
      setIsSavingPending(false);
    }
  };

  const handleConfirmDiscardAction = async () => {
    if (!pendingUnsavedAction) return;
    setIsDirty(false);
    postToIframe({ type: 'MARK_CLEAN' });
    const action = pendingUnsavedAction;
    setPendingUnsavedAction(null);
    if (action.onProceed) {
      await action.onProceed();
    }
  };

  const handleCancelUnsavedAction = () => {
    setPendingUnsavedAction(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-neutral-950 overflow-hidden relative select-none">
      {/* Top File & Module Subfolder Header */}
      <FileSubfolderHeader
        subfolderName="sprites"
        extension=".sprite"
        accentColor="emerald"
        showDimensions={true}
        defaultWidth={32}
        defaultHeight={32}
        onBackToDashboard={handleBackToDashboard}
        onImportFile={() => setShowCloudImageModal(true)}
        onRefreshFromLinked={onRefreshFromLinked}
        isSyncingLinked={isSyncingLinked}
        isOutOfSync={isOutOfSync}
        storageType={project?.storageLocation?.type}
        files={spriteFiles.map(f => ({
          id: f.id,
          name: f.name,
          fileName: f.fileName,
          updatedAt: f.updatedAt
        }))}
        activeFileName={activeFileName}
        isDirty={isDirty}
        onSelectFile={handleSelectFile}
        onNewFile={handleNewFile}
        onDuplicateFile={handleDuplicateFile}
        onSaveFile={handleSaveFile}
        onExportFile={handleExportFile}
        onDeleteFile={handleDeleteFile}
        onRenameFile={(_oldFile, newName) => {
          handleRenameActiveFile(newName);
        }}
        centerContent={
          <div className="flex items-center gap-2 max-w-full truncate">
            <ImageIcon size={14} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              value={activeFile?.name || ''}
              onChange={(e) => handleRenameActiveFile(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-white border-b border-dashed border-neutral-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition py-0.5 max-w-[140px] sm:max-w-[220px] text-center truncate"
              title="Click to edit sprite name"
              placeholder="Sprite Name"
            />
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] text-neutral-300 shrink-0">
              <span className="text-neutral-500">Size:</span>
              <span className="font-mono text-emerald-400 font-bold">{spriteDimensions.w}×{spriteDimensions.h}</span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] text-neutral-300 shrink-0">
              <span className="text-neutral-500">Frames:</span>
              <span className="font-mono text-cyan-400 font-bold">{spriteFrameCount}</span>
            </div>
          </div>
        }
      />

      {/* Embedded Sprite Editor Engine Workspace */}
      <div className="flex-1 w-full relative overflow-hidden">
        <iframe
          ref={iframeRef}
          src={getModuleUrl('modules/sprites/index.html')}
          className="w-full h-full border-none bg-neutral-950"
          title="Image & Sprite Studio"
          onLoad={() => {
            postToIframe({ type: 'REQUEST_STATUS' });
          }}
        />
      </div>

      {/* Unsaved Changes Prompt Modal */}
      {pendingUnsavedAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Unsaved Changes in Image
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  You have unsaved changes in <span className="font-semibold text-amber-300">"{activeFile?.name || activeFileName}"</span>.
                  Would you like to save before switching?
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleCancelUnsavedAction}
                disabled={isSavingPending}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition border border-neutral-700/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardAction}
                disabled={isSavingPending}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Discard Changes</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAction}
                disabled={isSavingPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
              >
                {isSavingPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                <span>Save & Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Image Destination Picker Export Modal */}
      {pendingExportData && (
        <VirtualExportImageModal
          project={project}
          activeSpriteFileName={activeFileName}
          exportData={pendingExportData}
          onSaveExport={(targetFileName, displayName, dataUrl, exportSettings) => {
            saveImageToProject(targetFileName, dataUrl, displayName, exportSettings);
            triggerToast(`Saved "${targetFileName}" to /images/`, 'success');
            setPendingExportData(null);
          }}
          onClose={() => setPendingExportData(null)}
          onUpdateProject={onUpdateProject}
          onShowToast={triggerToast}
        />
      )}

      {/* Unified File Manager Modal - Asset Import Mode */}
      {showCloudImageModal && (
        <UnifiedFileManagerModal
          isOpen={showCloudImageModal}
          onClose={() => setShowCloudImageModal(false)}
          action="import_asset"
          project={project}
          activeSpriteName={activeFile?.name || activeFileName}
          onImportSingleImage={handleImportSingleImage}
          onImportSpritesheet={handleImportSpritesheet}
          onShowToast={onShowToast}
        />
      )}

      {/* Spritesheet Slicer & Grid Metric Calibration Modal */}
      {showSliceModal && sliceModalConfig && (
        <SpritesheetSliceModal
          isOpen={showSliceModal}
          project={project}
          initialImageSrc={sliceModalConfig.imageUrl}
          initialName={sliceModalConfig.newSpriteName || sliceModalConfig.fileName.replace(/\.[^.]+$/, '')}
          onClose={() => {
            setShowSliceModal(false);
            setSliceModalConfig(null);
          }}
          onConfirm={handleConfirmSliceResult}
        />
      )}

      {/* Local Toast Notice */}
      {localToast && (
        <div className="absolute bottom-4 right-4 z-50 px-3.5 py-2 bg-neutral-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{localToast.text}</span>
        </div>
      )}
    </div>
  );
};
