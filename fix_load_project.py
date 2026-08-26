import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

load_old = """    } else if (data.type === 'LOAD_PROJECT') {
      if (data.projectData) {
        window.isSuppressingDirty = true;
        isSuppressingDirty = true;
        Promise.resolve(loadProjectData(data.projectData)).then(() => {
          if (data.projectName && document.getElementById('projectNameInput')) {
            document.getElementById('projectNameInput').value = data.projectName;
          }
          window.isSuppressingDirty = false;
          isSuppressingDirty = false;
          setDirty(false);
          notifyHostStatus();
        });
      }
    }"""

load_new = """    } else if (data.type === 'LOAD_PROJECT') {
      if (data.projectData) {
        window.isSuppressingDirty = true;
        isSuppressingDirty = true;
        Promise.resolve(loadProjectData(data.projectData)).then(() => {
          if (data.projectName && document.getElementById('projectNameInput')) {
            document.getElementById('projectNameInput').value = data.projectName;
          }
          if (typeof render === 'function') render();
          if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
          if (typeof centerCanvas === 'function') centerCanvas();
          if (typeof drawGridOverlay === 'function') drawGridOverlay();
          window.isSuppressingDirty = false;
          isSuppressingDirty = false;
          setDirty(false);
          notifyHostStatus();
        });
      }
    }"""

if load_old in text:
    text = text.replace(load_old, load_new, 1)
    print("Patched LOAD_PROJECT to call render")
else:
    print("Could not find LOAD_PROJECT")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
