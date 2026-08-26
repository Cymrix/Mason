with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add global isEmbeddedInIframe & isSuppressingDirty at line 4 <script>
top_script = """<script>
window.isEmbeddedInIframe = function() {
  try { return window.self !== window.top; } catch(e) { return true; }
};
var isEmbeddedInIframe = window.isEmbeddedInIframe;
var isDirty = false;
var isSuppressingDirty = false;
function setDirty(state) {
  if (isSuppressingDirty && state === true) return;
  if (isDirty !== state) {
    isDirty = state;
    if (isEmbeddedInIframe()) {
      try {
        window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty: isDirty }, '*');
      } catch(e){}
    }
  }
}
window.setDirty = setDirty;
</script>"""

text = text.replace("<head>", "<head>\n" + top_script, 1)

# Remove duplicate local setDirty definitions if any
text = text.replace("let isDirty = false;", "// isDirty top level")

# Ensure resetProjectToDefaults sets suppressing flag and renders at end
reset_def_old = "async function resetProjectToDefaults(w = 512, h = 512, initialLayerName = 'Layer 1', initialDrawFn = null, projName = 'Untitled'){"
reset_def_new = """async function resetProjectToDefaults(w = 512, h = 512, initialLayerName = 'Layer 1', initialDrawFn = null, projName = 'Untitled'){
    isSuppressingDirty = true;"""

text = text.replace(reset_def_old, reset_def_new)

# Add render and clear at end of resetProjectToDefaults
reset_end_old = "if(typeof refreshGridPanel === 'function') refreshGridPanel();"
reset_end_new = """if(typeof refreshGridPanel === 'function') refreshGridPanel();
    if(typeof render === 'function') render();
    if(typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
    if(typeof centerCanvas === 'function') centerCanvas();
    isDirty = false;
    isSuppressingDirty = false;
    setDirty(false);"""
text = text.replace(reset_end_old, reset_end_new, 1)

# loadProjectData: suppress dirty
load_def_old = "function loadProjectData(proj){"
load_def_new = "function loadProjectData(proj){\n    isSuppressingDirty = true;"
text = text.replace(load_def_old, load_def_new)

# end of loadProjectData then callback
load_end_old = "if(proj.backupsEnabled && !backupDirHandle) tryReenableBackupsFromProject();"
load_end_new = """if(proj.backupsEnabled && !backupDirHandle) tryReenableBackupsFromProject();
      isDirty = false;
      isSuppressingDirty = false;
      setDirty(false);"""
text = text.replace(load_end_old, load_end_new)

# MARK_CLEAN message handler
msg_clean_handler = """} else if (data.type === 'MARK_CLEAN') {
      isDirty = false;
      isSuppressingDirty = false;
      setDirty(false);"""

text = text.replace("} else if (data.type === 'REQUEST_EXPORT') {", msg_clean_handler + "\n    } else if (data.type === 'REQUEST_EXPORT') {")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated index.html")
