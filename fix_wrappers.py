import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the timeout handler to properly reject when save fails, so it doesn't mock success.
# Let's completely rewrite handleSaveFile just to be safe.
save_old = """  const handleSaveFile = (targetFileName?: string) => {
    const saveId = Math.random().toString(36).substring(2, 9);
    const fileToSave = targetFileName || activeFileNameRef.current;
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) {
        triggerToast('Could not save: sprite editor not ready', 'error');
        return resolve(false);
      }

      let resolved = false;

      const handler = (e: MessageEvent) => {
        if (!e.data || typeof e.data !== 'object') return;

        if (e.data.type === 'SAVE_PROJECT_DATA_ERROR' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          triggerToast(`Failed to save sprite: ${e.data.error || 'Unknown error'}`, 'error');
          resolve(false);
          return;
        }

        if (e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);

          const proj = e.data.data;
          
          onUpdateProject((prev) => {
            const list = [...(prev.fileSystem.sprites || [])];
            const idx = list.findIndex(f => f.fileName === fileToSave);
            
            const savedFileDisplayName = idx !== -1 ? list[idx].name : fileToSave;
            const targetName = proj.name || savedFileDisplayName;

            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                name: targetName,
                spriteData: proj,
                updatedAt: new Date().toISOString()
              };
            } else {
              list.push({
                id: `sprite_${Date.now()}`,
                name: targetName,
                fileName: fileToSave,
                updatedAt: new Date().toISOString(),
                spriteData: proj
              });
            }
            return {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: list }
            };
          });

          // Force clean state
          setIsDirty(false);
          postToIframe({ type: 'MARK_CLEAN' });

          const savedFileDisplayName = targetFileName || fileToSave;
          const targetName = proj.name || savedFileDisplayName;
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
          triggerToast(`Saved sprite "${fileToSave}"`, 'success');
          setIsDirty(false);
          resolve(true);
        }
      }, 3000);
    });
  };"""

save_new = """  const handleSaveFile = (targetFileName?: string) => {
    const saveId = Math.random().toString(36).substring(2, 9);
    const fileToSave = targetFileName || activeFileNameRef.current;
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) {
        triggerToast('Could not save: sprite editor not ready', 'error');
        return resolve(false);
      }

      let resolved = false;

      const handler = (e: MessageEvent) => {
        if (!e.data || typeof e.data !== 'object') return;

        if (e.data.type === 'SAVE_PROJECT_DATA_ERROR' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          triggerToast(`Failed to save sprite: ${e.data.error || 'Unknown error'}`, 'error');
          resolve(false);
          return;
        }

        if (e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);

          const proj = e.data.data;
          
          onUpdateProject((prev) => {
            const list = [...(prev.fileSystem.sprites || [])];
            const idx = list.findIndex(f => f.fileName === fileToSave);
            
            const savedFileDisplayName = idx !== -1 ? list[idx].name : fileToSave;
            const targetName = proj.name || savedFileDisplayName;

            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                name: targetName,
                spriteData: proj,
                updatedAt: new Date().toISOString()
              };
            } else {
              list.push({
                id: `sprite_${Date.now()}`,
                name: targetName,
                fileName: fileToSave,
                updatedAt: new Date().toISOString(),
                spriteData: proj
              });
            }
            return {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: list }
            };
          });

          // Force clean state
          setIsDirty(false);
          postToIframe({ type: 'MARK_CLEAN' });

          const savedFileDisplayName = targetFileName || fileToSave;
          const targetName = proj.name || savedFileDisplayName;
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
          triggerToast(`Save timeout for "${fileToSave}"`, 'error');
          resolve(false);
        }
      }, 3000);
    });
  };"""

if save_old in text:
    text = text.replace(save_old, save_new, 1)
    print("Patched SpriteEditorWrapper save handler")
else:
    # try the other variant (without SAVE_PROJECT_DATA_ERROR block)
    save_old2 = """  const handleSaveFile = (targetFileName?: string) => {
    const saveId = Math.random().toString(36).substring(2, 9);
    const fileToSave = targetFileName || activeFileNameRef.current;
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) {
        return resolve(false);
      }

      let resolved = false;

      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);

          const proj = e.data.data;
          
          onUpdateProject((prev) => {
            const list = [...(prev.fileSystem.sprites || [])];
            const idx = list.findIndex(f => f.fileName === fileToSave);
            
            const savedFileDisplayName = idx !== -1 ? list[idx].name : fileToSave;
            const targetName = proj.name || savedFileDisplayName;

            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                name: targetName,
                spriteData: proj,
                updatedAt: new Date().toISOString()
              };
            } else {
              list.push({
                id: `sprite_${Date.now()}`,
                name: targetName,
                fileName: fileToSave,
                updatedAt: new Date().toISOString(),
                spriteData: proj
              });
            }
            return {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: list }
            };
          });

          // Force clean state
          setIsDirty(false);
          postToIframe({ type: 'MARK_CLEAN' });

          const savedFileDisplayName = targetFileName || fileToSave;
          const targetName = proj.name || savedFileDisplayName;
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
          resolve(false);
        }
      }, 2000);
    });
  };"""
    if save_old2 in text:
        text = text.replace(save_old2, save_new, 1)
        print("Patched SpriteEditorWrapper save handler (variant 2)")
    else:
        print("Could not find SpriteEditorWrapper save handler to patch")

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

launch_old = """  const handleLaunchModule = async (modId: string | null) => {
    if (modId === 'macro') {
      setActiveModuleId('maps');
      setMapsSubMode('macro');
    } else {
      setActiveModuleId(modId);
      if (modId === 'maps') {
        setMapsSubMode('tilemap');
      }
    }
  };"""

launch_new = """  const handleLaunchModule = async (modId: string | null) => {
    if (activeModuleId === 'sprites' && modId !== 'sprites' && (window as any).masonCheckSpriteDirty?.()) {
      const choice = window.confirm(
        'You have unsaved changes in your active sprite.\\n\\nClick OK to Save before leaving, or Cancel to Discard changes.'
      );
      if (choice && (window as any).masonRequestSpriteSave) {
        await (window as any).masonRequestSpriteSave();
      }
    }
    if (modId === 'macro') {
      setActiveModuleId('maps');
      setMapsSubMode('macro');
    } else {
      setActiveModuleId(modId);
      if (modId === 'maps') {
        setMapsSubMode('tilemap');
      }
    }
  };"""

if launch_old in text:
    text = text.replace(launch_old, launch_new, 1)
    print("Patched handleLaunchModule in EditorLayout")
else:
    print("Could not find handleLaunchModule in EditorLayout")

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

