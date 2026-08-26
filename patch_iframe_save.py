import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''    } else if (data.type === 'REQUEST_EXPORT') {
      sendSpriteToHost();
    }'''

replacement = '''    } else if (data.type === 'REQUEST_EXPORT') {
      sendSpriteToHost();
    } else if (data.type === 'REQUEST_SAVE') {
      const proj = buildProjectData();
      window.parent.postMessage({ type: 'SAVE_PROJECT_DATA', data: proj }, '*');
    } else if (data.type === 'LOAD_PROJECT') {
      if (data.projectData) {
        loadProjectData(data.projectData);
      }
    }'''

if target in text:
    text = text.replace(target, replacement)
    with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Patched iframe save!")
else:
    print("Target not found!")
