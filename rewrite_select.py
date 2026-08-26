import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace handleSelectFile
match_str = r"  // When a file is selected from the header\n  const handleSelectFile = async \(targetFileName: string\) => \{[\s\S]*?    \}\n  \};"

new_str = """  // When a file is selected from the header
  const handleSelectFile = async (targetFileName: string) => {
    if (targetFileName === activeFileName) return;

    if (isDirty) {
      if (window.confirm("You have unsaved changes in the current sprite. Save them before switching? (Click OK to save, Cancel to discard)")) {
        handleSaveFile();
      }
      setIsDirty(false);
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

text = re.sub(match_str, new_str, text)

# Replace handleNewFile caching
match_new_str = r"  // Create a new sprite file\n  const handleNewFile = async \(name: string\) => \{[\s\S]*?triggerToast\(`Created new sprite \"\$\{name\}\"`, 'success'\);\n  \};"
new_new_str = """  // Create a new sprite file
  const handleNewFile = async (name: string) => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes in the current sprite. Save them before creating a new one? (Click OK to save, Cancel to discard)")) {
        handleSaveFile();
      }
      setIsDirty(false);
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
    triggerToast(`Created new sprite "${name}"`, 'success');
  };"""
text = re.sub(match_new_str, new_new_str, text)

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced functions")
