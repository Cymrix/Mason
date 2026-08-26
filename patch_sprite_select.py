import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''  const handleSelectFile = (fileName: string) => {
    setActiveFileName(fileName);'''

replacement = '''  const handleSelectFile = async (fileName: string) => {
    if ((window as any).masonRequestSpriteSave) {
      await (window as any).masonRequestSpriteSave();
    }
    setActiveFileName(fileName);'''

target2 = '''  const handleNewFile = (name: string) => {
    const { project: updatedProject, newFile } = createNewSpriteInProject(project, name);'''

replacement2 = '''  const handleNewFile = async (name: string) => {
    if ((window as any).masonRequestSpriteSave) {
      await (window as any).masonRequestSpriteSave();
    }
    const { project: updatedProject, newFile } = createNewSpriteInProject(project, name);'''

if target in text and target2 in text:
    text = text.replace(target, replacement)
    text = text.replace(target2, replacement2)
    with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched file switches!")
else:
    print("Target not found!")
