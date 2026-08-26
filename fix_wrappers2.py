import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

save_old = """      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handler);
          resolve(false);
        }
      }, 2000);
    });
  }, [postToIframe, onUpdateProject, triggerToast]);"""

save_new = """      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handler);
          triggerToast(`Failed to save sprite: Request timed out`, 'error');
          resolve(false);
        }
      }, 3000);
    });
  }, [postToIframe, onUpdateProject, triggerToast]);"""

if save_old in text:
    text = text.replace(save_old, save_new, 1)
    print("Patched SpriteEditorWrapper saveActiveSprite timeout")
else:
    print("Could not find SpriteEditorWrapper saveActiveSprite timeout")

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

