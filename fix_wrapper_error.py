import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

handler_old = """      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          const spriteData = e.data.data;"""

handler_new = """      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA_ERROR' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          triggerToast(`Failed to save sprite: ${e.data.error || 'Unknown error'}`, 'error');
          resolve(false);
          return;
        }
        if (e.data && e.data.type === 'SAVE_PROJECT_DATA' && (e.data.saveId === saveId || !e.data.saveId)) {
          if (resolved) return;
          resolved = true;
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          const spriteData = e.data.data;"""

if handler_old in text:
    text = text.replace(handler_old, handler_new, 1)
    print("Patched SpriteEditorWrapper to handle SAVE_PROJECT_DATA_ERROR")
else:
    print("Could not find handler_old")

with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
