import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("  const [spriteDimensions, setSpriteDimensions] = useState<{ w: number; h: number }>({ w: 32, h: 32 });", "  const [spriteDimensions, setSpriteDimensions] = useState<{ w: number; h: number }>({ w: 32, h: 32 });\n  const [isDirty, setIsDirty] = useState(false);")

# Update FileSubfolderHeader props
text = text.replace("activeFileName={activeFileName}", "activeFileName={activeFileName}\n        isDirty={isDirty}")

# Handle dirty switch:
# Instead of silently caching, prompt if dirty.

select_file = """
  const handleSelectFile = async (targetFileName: string) => {
    if (targetFileName === activeFileName) return;

    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Do you want to save them before switching?\\n(Cancel to discard changes)")) {
        // user cancelled save -> discard
        setIsDirty(false);
      } else {
        // save them
        await handleSaveFile();
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
  };
"""
text = re.sub(r'  const handleSelectFile = async \(targetFileName: string\) => \{.*?sendLoadFileToIframe\(targetFile\);\n    \}\n  \};', select_file, text, flags=re.DOTALL)

# Handle back to dashboard
# Wait, back to dashboard is passed in from EditorLayout.
# The user asked: "Instead of keeping the cash between Sprite files, I'd rather just get a pop-up message prompting to save or lose all changes."
# Let's also wrap onBackToDashboard?
# Wait, SpriteEditorWrapper doesn't intercept onBackToDashboard. It just passes it to FileSubfolderHeader.
# I will make a wrapper function for onBackToDashboard.

# Fix handleSelectFile regex match: wait, I'll just use string replace.
