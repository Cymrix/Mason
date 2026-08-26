import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

save_block = """          if (idx !== -1) {
            const updated = [...sprites];
            updated[idx] = {
              ...updated[idx],
              updatedAt: new Date().toISOString(),
              spriteData
            };
            const updatedProject = {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: updated }
            };
            if (isExplicitSave) {
              saveActiveMasonProject(updatedProject);
            }
            return updatedProject;
          }"""

new_save_block = """          if (idx !== -1) {
            const updated = [...sprites];
            updated[idx] = {
              ...updated[idx],
              updatedAt: new Date().toISOString(),
              spriteData
            };
            const updatedProject = {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: updated }
            };
            if (isExplicitSave) {
              saveActiveMasonProject(updatedProject);
              setIsDirty(false); // Clear dirty on save!
            }
            return updatedProject;
          }"""

text = text.replace(save_block, new_save_block)

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched save message clear")
