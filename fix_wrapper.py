import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace handleSaveFile to be an async function returning promise
old_save_file = r"  const handleSaveFile = () => {\n    postToIframe\(\{ type: 'REQUEST_SAVE', isExplicitSave: true \}\);\n  \};"

new_save_file = """  const handleSaveFile = async () => {
    try {
      const spriteData = await captureIframeStatePromise();
      if (spriteData && activeFileName) {
        onUpdateProject(prev => {
          const list = prev.fileSystem.sprites || [];
          const idx = list.findIndex(f => f.fileName === activeFileName);
          if (idx !== -1) {
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
        triggerToast(`Saved sprite "${activeFile?.name || 'Sprite'}"`, 'success');
      }
    } catch (e) {
      console.error('Error saving sprite:', e);
    }
  };"""

text = re.sub(old_save_file, new_save_file, text)

# Replace handleSelectFile
match_select = r"  // When a file is selected from the header\n  const handleSelectFile = async \(targetFileName: string\) => \{[\s\S]*?sendLoadFileToIframe\(targetFile\);\n    \}\n  \};"

new_select = """  // When a file is selected from the header
  const handleSelectFile = async (targetFileName: string) => {
    if (targetFileName === activeFileName) return;

    if (isDirty) {
      const choice = window.confirm(
        `You have unsaved changes in "${activeFile?.name || activeFileName}".\\n\\nClick OK to Save before switching, or Cancel to Discard changes.`
      );
      if (choice) {
        await handleSaveFile();
      } else {
        setIsDirty(false);
      }
    }

    onUpdateProject(prev => ({
      ...prev,
      activeFiles: { ...prev.activeFiles, spriteFileName: targetFileName }
    }));

    setActiveFileName(targetFileName);
    const targetFile = spriteFiles.find(f => f.fileName === targetFileName);
    if (targetFile) {
      sendLoadFileToIframe(targetFile);
    }
  };"""

text = re.sub(match_select, new_select, text)

# Replace handleNewFile
match_new = r"  // Create a new sprite file\n  const handleNewFile = async \(name: string\) => \{[\s\S]*?triggerToast\(`Created new sprite \"\$\{name\}\"`, 'success'\);\n  \};"

new_new = """  // Create a new sprite file
  const handleNewFile = async (name: string) => {
    if (isDirty) {
      const choice = window.confirm(
        `You have unsaved changes in "${activeFile?.name || activeFileName}".\\n\\nClick OK to Save before creating a new sprite, or Cancel to Discard changes.`
      );
      if (choice) {
        await handleSaveFile();
      } else {
        setIsDirty(false);
      }
    }

    const { project: updatedProj, newFile } = createNewSpriteInProject(project, name);

    let finalProject = {
      ...updatedProj,
      activeFiles: { ...updatedProj.activeFiles, spriteFileName: newFile.fileName }
    };

    onUpdateProject(() => finalProject);
    saveActiveMasonProject(finalProject);
    setActiveFileName(newFile.fileName);
    sendLoadFileToIframe(newFile);
    setIsDirty(false);
    triggerToast(`Created new sprite "${name}"`, 'success');
  };"""

text = re.sub(match_new, new_new, text)

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated SpriteEditorWrapper")
