import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

new_launch = """  const handleLaunchModule = async (modId: string | null) => {
    if (activeModuleId === 'sprites') {
      const checkDirty = (window as any).masonCheckSpriteDirty;
      if (checkDirty && checkDirty()) {
        if (!window.confirm("You have unsaved changes in the Sprite Editor. Do you want to exit? (Click OK to discard changes, Cancel to stay)")) {
          return;
        }
      }
    }"""

text = text.replace("""  const handleLaunchModule = async (modId: string | null) => {
    if (activeModuleId === 'sprites' && (window as any).masonRequestSpriteSave) {
      await (window as any).masonRequestSpriteSave();
    }""", new_launch)

# Same for handleNavigateToModule ?
# We can also do the same for create new project, close project, etc.

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched launch")
