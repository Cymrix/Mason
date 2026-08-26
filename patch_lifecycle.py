import re

with open('src/components/EditorLayout.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

def replace_with_prompt(match):
    return """    if (activeModuleId === 'sprites') {
      const checkDirty = (window as any).masonCheckSpriteDirty;
      if (checkDirty && checkDirty()) {
        if (!window.confirm("You have unsaved changes in the Sprite Editor. Do you want to continue? (Click OK to discard changes, Cancel to stay)")) {
          return;
        }
      }
    }"""

text = re.sub(r'    if \(activeModuleId === \'sprites\' && \(window as any\)\.masonRequestSpriteSave\) \{\n      await \(window as any\)\.masonRequestSpriteSave\(\);\n    \}', replace_with_prompt, text)

with open('src/components/EditorLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched lifecycle")
