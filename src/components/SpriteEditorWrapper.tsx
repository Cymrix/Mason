import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MasonProject, SpriteFile } from '../engine/masonProjectSchema';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { createNewSpriteInProject, saveActiveMasonProject } from '../utils/masonStorage';
import { Image as ImageIcon } from 'lucide-react';

interface SpriteEditorWrapperProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onBackToDashboard: () => void;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const SpriteEditorWrapper: React.FC<SpriteEditorWrapperProps> = ({
  project,
  onUpdateProject,
  onBackToDashboard,
  onShowToast
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isIframeReadyRef = useRef<boolean>(false);
  const projectRef = useRef<MasonProject>(project);
  projectRef.current = project;

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

  // Helper to safely post message to iframe
  const postToIframe = useCallback((message: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  // Load a specific sprite file into the iframe
  const sendLoadFileToIframe = useCallback((file: SpriteFile) => {
    if (!iframeRef.current?.contentWindow) return;
    if (file.spriteData) {
      postToIframe({
        type: 'LOAD_PROJECT',
        projectData: file.spriteData,
        projectName: file.name
      });
    } else {
      postToIframe({
        type: 'LOAD_SPRITE',
        width: 32,
        height: 32,
        projectName: file.name
      });
    }
  }, [postToIframe]);

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

          let savedFileDisplayName = 'Sprite';
          onUpdateProject(prev => {
            const list = prev.fileSystem.sprites || [];
            const idx = list.findIndex(f => f.fileName === targetName);
            if (idx !== -1) {
              savedFileDisplayName = list[idx].name || targetName;
              const updated = [...list];
              updated[idx] = {
                ...updated[idx],
                updatedAt: new Date().toISOString(),
                spriteData
              };
              const updatedProject = {
                ...prev,
                fileSystem: { ...prev.fileSystem, sprites: updated }
              };
              saveActiveMasonProject(updatedProject);
              return updatedProject;
            }
            return prev;
          });

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

  // When a file is selected from the header
  const handleSelectFile = async (targetFileName: string) => {
    if (targetFileName === activeFileNameRef.current) return;

    if (isDirtyRef.current) {
      const currentTargetFile = spriteFiles.find(f => f.fileName === activeFileNameRef.current);
      const choice = window.confirm(
        `You have unsaved changes in "${currentTargetFile?.name || activeFileNameRef.current}".\n\nClick OK to Save before switching, or Cancel to Discard changes.`
      );
      if (choice) {
        await saveActiveSprite(activeFileNameRef.current);
      } else {
        setIsDirty(false);
        postToIframe({ type: 'MARK_CLEAN' });
      }
    } else {
      setIsDirty(false);
      postToIframe({ type: 'MARK_CLEAN' });
    }

    onUpdateProject(prev => ({
      ...prev,
      activeFiles: { ...prev.activeFiles, spriteFileName: targetFileName }
    }));

    setActiveFileName(targetFileName);
    const targetFile = (projectRef.current.fileSystem.sprites || []).find(f => f.fileName === targetFileName) || spriteFiles.find(f => f.fileName === targetFileName);
    if (targetFile) {
      sendLoadFileToIframe(targetFile);
    }
  };

  // Create a new sprite file
  const handleNewFile = async (name: string) => {
    if (isDirtyRef.current) {
      const currentTargetFile = spriteFiles.find(f => f.fileName === activeFileNameRef.current);
      const choice = window.confirm(
        `You have unsaved changes in "${currentTargetFile?.name || activeFileNameRef.current}".\n\nClick OK to Save before creating a new sprite, or Cancel to Discard changes.`
      );
      if (choice) {
        await saveActiveSprite(activeFileNameRef.current);
      } else {
        setIsDirty(false);
        postToIframe({ type: 'MARK_CLEAN' });
      }
    }

    const { project: updatedProj, newFile } = createNewSpriteInProject(projectRef.current, name);

    const finalProject = {
      ...updatedProj,
      activeFiles: { ...updatedProj.activeFiles, spriteFileName: newFile.fileName }
    };

    onUpdateProject(() => finalProject);
    saveActiveMasonProject(finalProject);
    setActiveFileName(newFile.fileName);
    sendLoadFileToIframe(newFile);
    setIsDirty(false);
    triggerToast(`Created new sprite "${name}"`, 'success');
  };

  // Duplicate the active or specified sprite file
  const handleDuplicateFile = async (fileName: string) => {
    if (fileName === activeFileNameRef.current && isDirtyRef.current) {
      const choice = window.confirm(
        `You have unsaved changes in "${activeFile?.name || fileName}".\n\nClick OK to Save before duplicating, or Cancel to duplicate last saved version.`
      );
      if (choice) {
        await saveActiveSprite(activeFileNameRef.current);
      } else {
        setIsDirty(false);
        postToIframe({ type: 'MARK_CLEAN' });
      }
    }

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
    setIsDirty(false);
    triggerToast(`Duplicated to "${dupeName}"`, 'success');
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

    if (!window.confirm(`Are you sure you want to delete sprite file "${targetName}" (${fileName})?`)) {
      return;
    }

    const newRemaining = currentSprites.filter(f => f.fileName !== fileName);
    const nextFile = newRemaining[0];

    onUpdateProject(prev => {
      const updatedList = (prev.fileSystem.sprites || []).filter(f => f.fileName !== fileName);
      const updatedProject = {
        ...prev,
        activeFiles: {
          ...prev.activeFiles,
          spriteFileName: nextFile?.fileName || ''
        },
        fileSystem: {
          ...prev.fileSystem,
          sprites: updatedList
        }
      };
      saveActiveMasonProject(updatedProject);
      return updatedProject;
    });

    if (fileName === activeFileNameRef.current && nextFile) {
      setActiveFileName(nextFile.fileName);
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

  // Handle postMessages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'SPRITE_SAVED') {
        const dataUrl = e.data.spritesheetUrl || e.data.dataUrl;
        if (dataUrl) {
          const link = document.createElement('a');
          const cleanName = (e.data.projectName || activeFileRef.current?.name || 'sprite').toLowerCase().replace(/[^a-z0-9]/g, '_');
          link.download = `${cleanName}.png`;
          link.href = dataUrl;
          link.click();
          triggerToast(`Exported "${cleanName}.png"`, 'success');
        }
      } else if (e.data.type === 'SPRITE_STATUS_UPDATE') {
        if (typeof e.data.width === 'number' && typeof e.data.height === 'number') {
          setSpriteDimensions({ w: e.data.width, h: e.data.height });
        }
        if (typeof e.data.frameCount === 'number') {
          setSpriteFrameCount(e.data.frameCount);
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
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onUpdateProject, triggerToast]);

  const handleBackToDashboard = async () => {
    if (isDirtyRef.current) {
      const choice = window.confirm(
        `You have unsaved changes in "${activeFile?.name || activeFileName}".\n\nClick OK to Save before leaving, or Cancel to Discard changes.`
      );
      if (choice) {
        await saveActiveSprite(activeFileName);
      } else {
        setIsDirty(false);
        postToIframe({ type: 'MARK_CLEAN' });
      }
    }
    onBackToDashboard();
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-neutral-950 overflow-hidden relative select-none">
      {/* Top File & Module Subfolder Header */}
      <FileSubfolderHeader
        subfolderName="sprites"
        extension=".sprite"
        accentColor="emerald"
        onBackToDashboard={handleBackToDashboard}
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
          src="/modules/sprites/index.html"
          className="w-full h-full border-none bg-neutral-950"
          title="Image & Sprite Studio"
          onLoad={() => {
            isIframeReadyRef.current = true;
            setTimeout(() => {
              if (activeFile) {
                sendLoadFileToIframe(activeFile);
              }
              postToIframe({ type: 'REQUEST_STATUS' });
            }, 80);
          }}
        />
      </div>

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
