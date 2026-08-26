import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

sprite_old = """    if (data.type === 'LOAD_SPRITE') {
      window.isSuppressingDirty = true;
      isSuppressingDirty = true;
      const targetW = data.width || (typeof W !== 'undefined' ? W : 32);
      const targetH = data.height || (typeof H !== 'undefined' ? H : 32);
      const projName = data.projectName || 'Sprite';
      if (data.imageDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (typeof resetProjectToDefaults === 'function') {
            resetProjectToDefaults(targetW, targetH, 'Layer 1', null, projName).then(() => {
              if (typeof layers !== 'undefined' && layers && layers[0]) {
                const l = layers[0];
                const ctx = (l.colorCanvas || l.canvas).getContext('2d');
                ctx.clearRect(0, 0, targetW, targetH);
                ctx.drawImage(img, 0, 0);
              }
              if (typeof render === 'function') render();
              if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
              if (typeof centerCanvas === 'function') centerCanvas();
              window.isSuppressingDirty = false;
              isSuppressingDirty = false;
              setDirty(false);
              notifyHostStatus();
            });
          }
        };
        img.src = data.imageDataUrl;
      } else {
        if (typeof resetProjectToDefaults === 'function') {
          resetProjectToDefaults(targetW, targetH, 'Layer 1', null, projName).then(() => {
            if (document.getElementById('projectNameInput')) {
              document.getElementById('projectNameInput').value = projName;
            }
            window.isSuppressingDirty = false;
            isSuppressingDirty = false;
            setDirty(false);
            notifyHostStatus();
          });
        }
      }
    }"""

sprite_new = """    if (data.type === 'LOAD_SPRITE') {
      window.isSuppressingDirty = true;
      isSuppressingDirty = true;
      const targetW = data.width || (typeof W !== 'undefined' ? W : 32);
      const targetH = data.height || (typeof H !== 'undefined' ? H : 32);
      const projName = data.projectName || 'Sprite';
      if (data.imageDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (typeof resetProjectToDefaults === 'function') {
            resetProjectToDefaults(targetW, targetH, 'Layer 1', null, projName).then(() => {
              if (typeof layers !== 'undefined' && layers && layers[0]) {
                const l = layers[0];
                const ctx = (l.colorCanvas || l.canvas).getContext('2d');
                ctx.clearRect(0, 0, targetW, targetH);
                ctx.drawImage(img, 0, 0);
              }
              if (typeof render === 'function') render();
              if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
              if (typeof centerCanvas === 'function') centerCanvas();
              window.isSuppressingDirty = false;
              isSuppressingDirty = false;
              setDirty(false);
              notifyHostStatus();
            }).catch(e => {
              console.error(e);
              window.isSuppressingDirty = false;
              isSuppressingDirty = false;
              setDirty(false);
            });
          }
        };
        img.onerror = () => {
           window.isSuppressingDirty = false;
           isSuppressingDirty = false;
        };
        img.src = data.imageDataUrl;
      } else {
        if (typeof resetProjectToDefaults === 'function') {
          resetProjectToDefaults(targetW, targetH, 'Layer 1', null, projName).then(() => {
            if (document.getElementById('projectNameInput')) {
              document.getElementById('projectNameInput').value = projName;
            }
            if (typeof render === 'function') render();
            if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
            if (typeof centerCanvas === 'function') centerCanvas();
            if (typeof drawGridOverlay === 'function') drawGridOverlay();
            window.isSuppressingDirty = false;
            isSuppressingDirty = false;
            setDirty(false);
            notifyHostStatus();
          }).catch(e => {
            console.error(e);
            window.isSuppressingDirty = false;
            isSuppressingDirty = false;
            setDirty(false);
          });
        }
      }
    }"""

if sprite_old in text:
    text = text.replace(sprite_old, sprite_new, 1)
    print("Patched LOAD_SPRITE to catch errors and unlock dirty")
else:
    print("Could not find LOAD_SPRITE")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
