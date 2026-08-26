import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the bounds manually
start_idx = text.find("  // Duplicate the active or specified sprite file")
end_idx = text.find("triggerToast(`Duplicated to \"${dupeName}\"`, 'success');\n  };") + len("triggerToast(`Duplicated to \"${dupeName}\"`, 'success');\n  };")

new_str = """  // Duplicate the active or specified sprite file
  const handleDuplicateFile = async (fileName: string) => {
    if (fileName === activeFileName && isDirty) {
      if (window.confirm("You have unsaved changes in the current sprite. Save them before duplicating? (Click OK to save, Cancel to duplicate last saved version)")) {
        handleSaveFile();
        setIsDirty(false);
      }
    }

    const target = spriteFiles.find(f => f.fileName === fileName) || activeFile;
    if (!target) return;

    const baseName = target.name.replace(/\\s*\\(Copy.*?\\)$/i, '');
    const cleanFileBase = (target.fileName || 'sprite').replace(/\\.sprite$/, '').replace(/_copy.*$/, '');
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
      return {
        ...prev,
        activeFiles: { ...prev.activeFiles, spriteFileName: dupeFileName },
        fileSystem: {
          ...prev.fileSystem,
          sprites: [...currentList, dupeFile]
        }
      };
    });

    setActiveFileName(dupeFileName);
    sendLoadFileToIframe(dupeFile);
    setIsDirty(false);
    triggerToast(`Duplicated to "${dupeName}"`, 'success');
  };"""

text = text[:start_idx] + new_str + text[end_idx:]

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced dupe")
