import re

with open('src/components/SpriteEditorWrapper.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {'''

replacement = '''  // Listen for messages from the iframe
  useEffect(() => {
    (window as any).masonRequestSpriteSave = () => {
      return new Promise<void>(resolve => {
        if (!iframeRef.current?.contentWindow) return resolve();
        
        const handler = (e: MessageEvent) => {
          if (e.data && e.data.type === 'SAVE_PROJECT_DATA') {
            window.removeEventListener('message', handler);
            resolve();
          }
        };
        window.addEventListener('message', handler);
        iframeRef.current.contentWindow.postMessage({ type: 'REQUEST_SAVE' }, '*');
        
        setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve();
        }, 300);
      });
    };

    const handleMessage = (e: MessageEvent) => {'''

target2 = '''    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeFileName, onUpdateProject]);'''

replacement2 = '''    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      delete (window as any).masonRequestSpriteSave;
    };
  }, [activeFileName, onUpdateProject]);'''

if target in text and target2 in text:
    text = text.replace(target, replacement)
    text = text.replace(target2, replacement2)
    with open('src/components/SpriteEditorWrapper.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched SpriteEditorWrapper!")
else:
    print("Target not found!")
