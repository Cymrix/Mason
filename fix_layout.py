with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Restore simple handleLaunchModule with NO prompt
old_launch = """  const handleLaunchModule = async (modId: string | null) => {
    if (activeModuleId === 'sprites') {
      const checkDirty = (window as any).masonCheckSpriteDirty;
      if (checkDirty && checkDirty()) {
        if (!window.confirm("You have unsaved changes in the Sprite Editor. Do you want to exit? (Click OK to discard changes, Cancel to stay)")) {
          return;
        }
      }
    }
    if (modId === 'macro') {"""

new_launch = """  const handleLaunchModule = async (modId: string | null) => {
    if (modId === 'macro') {"""

text = text.replace(old_launch, new_launch)

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated EditorLayout")
