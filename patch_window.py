import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

win_hook = """  // Register the global hook for synchronous project saving from EditorLayout or Ctrl+S
  useEffect(() => {
    (window as any).masonCheckSpriteDirty = () => isDirty;
    (window as any).masonRequestSpriteSave = async () => {
"""

text = text.replace("  // Register the global hook for synchronous project saving from EditorLayout or Ctrl+S\n  useEffect(() => {\n    (window as any).masonRequestSpriteSave = async () => {", win_hook)

clean_hook = """    return () => {
      delete (window as any).masonCheckSpriteDirty;
      delete (window as any).masonRequestSpriteSave;
    };
  }, [captureIframeStatePromise, activeFileName, onUpdateProject, project, isDirty]);"""

text = re.sub(r'    return \(\) => \{\n      delete \(window as any\)\.masonRequestSpriteSave;\n    \};\n  \}, \[captureIframeStatePromise, activeFileName, onUpdateProject, project\]\);', clean_hook, text)

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched window hook")
