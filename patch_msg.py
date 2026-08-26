import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add handling for SPRITE_DIRTY
msg_handler = """      } else if (e.data.type === 'SPRITE_NAME_CHANGED') {
        if (e.data.name && typeof e.data.name === 'string') {
          onUpdateProject(prev => {
            const list = prev.fileSystem.sprites || [];
            const idx = list.findIndex(f => f.fileName === activeFileName);
            if (idx !== -1 && list[idx].name !== e.data.name) {
              const updated = [...list];
              updated[idx] = {
                ...updated[idx],
                name: e.data.name,
                updatedAt: new Date().toISOString()
              };
              return {
                ...prev,
                fileSystem: { ...prev.fileSystem, sprites: updated }
              };
            }
            return prev;
          });
        }
      } else if (e.data.type === 'SPRITE_DIRTY') {
        setIsDirty(!!e.data.isDirty);
      }"""

text = text.replace("      } else if (e.data.type === 'SPRITE_NAME_CHANGED') {\n        if (e.data.name && typeof e.data.name === 'string') {\n          onUpdateProject(prev => {\n            const list = prev.fileSystem.sprites || [];\n            const idx = list.findIndex(f => f.fileName === activeFileName);\n            if (idx !== -1 && list[idx].name !== e.data.name) {\n              const updated = [...list];\n              updated[idx] = {\n                ...updated[idx],\n                name: e.data.name,\n                updatedAt: new Date().toISOString()\n              };\n              return {\n                ...prev,\n                fileSystem: { ...prev.fileSystem, sprites: updated }\n              };\n            }\n            return prev;\n          });\n        }\n      }", msg_handler)

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched msg")
