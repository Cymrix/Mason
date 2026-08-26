import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

save_old = """    } else if (data.type === 'REQUEST_SAVE') {
      const proj = buildProjectData();
      window.parent.postMessage({
        type: 'SAVE_PROJECT_DATA',
        data: proj,
        saveId: data.saveId,
        targetFileName: data.targetFileName,
        isExplicitSave: !!data.isExplicitSave
      }, '*');
      if (data.isExplicitSave) {
        window.isSuppressingDirty = false;
        isSuppressingDirty = false;
        setDirty(false);
      }
    }"""

save_new = """    } else if (data.type === 'REQUEST_SAVE') {
      try {
        const proj = buildProjectData();
        window.parent.postMessage({
          type: 'SAVE_PROJECT_DATA',
          data: proj,
          saveId: data.saveId,
          targetFileName: data.targetFileName,
          isExplicitSave: !!data.isExplicitSave
        }, '*');
        if (data.isExplicitSave) {
          window.isSuppressingDirty = false;
          isSuppressingDirty = false;
          setDirty(false);
        }
      } catch (err) {
        console.error('Save failed in iframe:', err);
        window.parent.postMessage({
          type: 'SAVE_PROJECT_DATA_ERROR',
          error: err.message || String(err),
          saveId: data.saveId
        }, '*');
      }
    }"""

if save_old in text:
    text = text.replace(save_old, save_new, 1)
    print("Patched REQUEST_SAVE error handling")
else:
    print("Could not find REQUEST_SAVE old code")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
