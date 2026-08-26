import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''  const handleLaunchModule = (modId: string | null) => {
    if (modId === 'macro') {'''

replacement = '''  const handleLaunchModule = async (modId: string | null) => {
    if (activeModuleId === 'sprites' && (window as any).masonRequestSpriteSave) {
      await (window as any).masonRequestSpriteSave();
    }
    if (modId === 'macro') {'''

if target in text:
    text = text.replace(target, replacement)
    with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched EditorLayout.tsx handleLaunchModule")
else:
    print("Target not found")
