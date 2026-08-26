import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''        onUpdateProject(prev => {
          const sprites = prev.fileSystem.sprites || [];
          const idx = sprites.findIndex(f => f.fileName === activeFileName);
          if (idx !== -1) {
            const newSprites = [...sprites];
            newSprites[idx] = {
              ...newSprites[idx],
              updatedAt: new Date().toISOString(),
              spriteData
            };
            return {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: newSprites }
            };
          }
          return prev;
        });
      }
    };'''

replacement = '''        onUpdateProject(prev => {
          const sprites = prev.fileSystem.sprites || [];
          const idx = sprites.findIndex(f => f.fileName === activeFileName);
          if (idx !== -1) {
            const newSprites = [...sprites];
            newSprites[idx] = {
              ...newSprites[idx],
              updatedAt: new Date().toISOString(),
              spriteData
            };
            return {
              ...prev,
              fileSystem: { ...prev.fileSystem, sprites: newSprites }
            };
          }
          return prev;
        });
      } else if (e.data && e.data.type === 'SPRITE_SAVED') {
        const link = document.createElement('a');
        link.download = `${e.data.projectName || activeFileName.replace('.sprite', '')}.png`;
        link.href = e.data.spritesheetUrl || e.data.dataUrl;
        link.click();
      }
    };'''

if target in text:
    text = text.replace(target, replacement)
    with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched export handling!")
else:
    print("Target not found!")
