with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Ensure top script is bulletproof
top_script_old = """<script>
window.isEmbeddedInIframe = function() {
  try { return window.self !== window.top; } catch(e) { return true; }
};
var isEmbeddedInIframe = window.isEmbeddedInIframe;
window.isDirty = false;
window.isSuppressingDirty = false;
var isDirty = false;
var isSuppressingDirty = false;

function setDirty(state) {
  if ((window.isSuppressingDirty || isSuppressingDirty) && state === true) return;
  window.isDirty = !!state;
  isDirty = !!state;
  if (window.isEmbeddedInIframe()) {
    try {
      window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty: window.isDirty }, '*');
    } catch(e){}
  }
}
window.setDirty = setDirty;
</script>"""

top_script_new = """<script>
window.isEmbeddedInIframe = function() {
  try { return window.self !== window.top; } catch(e) { return true; }
};
var isEmbeddedInIframe = window.isEmbeddedInIframe;
window.isDirty = false;
window.isSuppressingDirty = false;
var isDirty = false;
var isSuppressingDirty = false;

function setDirty(state) {
  if (state === true && (window.isSuppressingDirty || isSuppressingDirty)) return;
  window.isDirty = !!state;
  isDirty = !!state;
  if (window.isEmbeddedInIframe()) {
    try {
      window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty: !!state }, '*');
    } catch(e){}
  }
}
window.setDirty = setDirty;
</script>"""

if top_script_old in text:
    text = text.replace(top_script_old, top_script_new, 1)
    print("Updated top script")
else:
    print("Top script already updated or different")

# 2. In loadProjectData, ensure pushHistory() is not called at the start
if "  function loadProjectData(proj){\n    isSuppressingDirty = true;\n    if(!proj || !Array.isArray(proj.layers) || !proj.width || !proj.height){\n      alert('That doesn\\'t look like a valid project file.');\n      return;\n    }\n    pushHistory();" in text:
    text = text.replace(
        "  function loadProjectData(proj){\n    isSuppressingDirty = true;\n    if(!proj || !Array.isArray(proj.layers) || !proj.width || !proj.height){\n      alert('That doesn\\'t look like a valid project file.');\n      return;\n    }\n    pushHistory();",
        "  function loadProjectData(proj){\n    window.isSuppressingDirty = true;\n    isSuppressingDirty = true;\n    if(!proj || !Array.isArray(proj.layers) || !proj.width || !proj.height){\n      alert('That doesn\\'t look like a valid project file.');\n      window.isSuppressingDirty = false;\n      isSuppressingDirty = false;\n      return Promise.reject(new Error('Invalid project file'));\n    }\n    undoStack = [];\n    redoStack = [];\n    if (typeof clearPixiStroke === 'function') clearPixiStroke();"
    )
    print("Cleaned loadProjectData preamble")

# 3. In loadProjectData, clean up end state and clear suppression safely
old_load_end = """      fitCanvasToScreen(true);
      centerCanvas();
      fitSidePanelToPalette();
      render();
      updateSpraySourceHint();
      if(proj.backupsEnabled && !backupDirHandle) tryReenableBackupsFromProject();
      isDirty = false;
      isSuppressingDirty = false;
      setDirty(false);
    });
  }"""

new_load_end = """      fitCanvasToScreen(true);
      centerCanvas();
      fitSidePanelToPalette();
      render();
      updateSpraySourceHint();
      if(proj.backupsEnabled && !backupDirHandle) tryReenableBackupsFromProject();
      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
    }).catch(err => {
      console.error('loadProjectData error:', err);
      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
    });
  }"""

if old_load_end in text:
    text = text.replace(old_load_end, new_load_end, 1)
    print("Updated loadProjectData finish block")
else:
    print("old_load_end not matched exactly, checking alternate")

# 4. In resetProjectToDefaults, wrap with try/finally to never leave isSuppressingDirty true
old_reset_start = """  async function resetProjectToDefaults(w = 512, h = 512, initialLayerName = 'Layer 1', initialDrawFn = null, projName = 'Untitled'){
    isSuppressingDirty = true;"""

new_reset_start = """  async function resetProjectToDefaults(w = 512, h = 512, initialLayerName = 'Layer 1', initialDrawFn = null, projName = 'Untitled'){
    window.isSuppressingDirty = true;
    isSuppressingDirty = true;
    try {"""

if old_reset_start in text:
    text = text.replace(old_reset_start, new_reset_start, 1)
    print("Added try block to resetProjectToDefaults")

old_reset_end = """    fitCanvasToScreen(true);
    centerCanvas();
    fitSidePanelToPalette();
    render();
    window.isSuppressingDirty = false;
    isSuppressingDirty = false;
    window.isDirty = false;
    isDirty = false;
    setDirty(false);
  }"""

new_reset_end = """    fitCanvasToScreen(true);
    centerCanvas();
    fitSidePanelToPalette();
    render();
    } finally {
      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
    }
  }"""

if old_reset_end in text:
    text = text.replace(old_reset_end, new_reset_end, 1)
    print("Added finally block to resetProjectToDefaults")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Finished updating public/modules/sprites/index.html")
