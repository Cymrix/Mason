import re

with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add isDirty logic
dirty_logic = """
  let isDirty = false;
  function setDirty(state) {
    if (isDirty !== state) {
      isDirty = state;
      if (isEmbeddedInIframe()) {
        try {
          window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty }, '*');
        } catch(e){}
      }
    }
  }
"""
text = text.replace("let isPlaying = false;", dirty_logic + "  let isPlaying = false;")

# Insert into pushHistory
text = text.replace("function pushHistory(){", "function pushHistory(){\n    setDirty(true);")
text = text.replace("function undo(){", "function undo(){\n    setDirty(true);")
text = text.replace("function redo(){", "function redo(){\n    setDirty(true);")

# Clear dirty on save
text = text.replace("function saveProject(forceNewLocation){", "function saveProject(forceNewLocation){\n    setDirty(false);")

# Clear dirty on load
text = text.replace("function loadProjectData(projectData){", "function loadProjectData(projectData){\n    setDirty(false);")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched isDirty")
