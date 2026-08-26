with open('public/modules/sprites/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update top-level script
top_script_target = """<script>
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

top_script_replacement = """<script>
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

if top_script_target in text:
    text = text.replace(top_script_target, top_script_replacement, 1)
else:
    print("WARNING: top_script_target not found exactly")

# 2. Remove shadowed setDirty around line 5691
shadow_old = """  // isDirty top level
  function setDirty(state) {
    if (isDirty !== state) {
      isDirty = state;
      if (isEmbeddedInIframe()) {
        try {
          window.parent.postMessage({ type: 'SPRITE_DIRTY', isDirty }, '*');
        } catch(e){}
      }
    }
  }"""

shadow_new = """  // isDirty delegator to top level
  // uses global setDirty"""

if shadow_old in text:
    text = text.replace(shadow_old, shadow_new, 1)
    print("Replaced shadow setDirty")
else:
    print("WARNING: shadow_old not found")

# 3. Clean up resetProjectToDefaults
# Remove premature clear at lines 18070-18072
premature_old = """    if(typeof render === 'function') render();
    if(typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
    if(typeof centerCanvas === 'function') centerCanvas();
    isDirty = false;
    isSuppressingDirty = false;
    setDirty(false);
    if(typeof drawGridOverlay === 'function') drawGridOverlay();"""

premature_new = """    if(typeof render === 'function') render();
    if(typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
    if(typeof centerCanvas === 'function') centerCanvas();
    if(typeof drawGridOverlay === 'function') drawGridOverlay();"""

if premature_old in text:
    text = text.replace(premature_old, premature_new, 1)
    print("Removed premature clear from resetProjectToDefaults")
else:
    print("WARNING: premature_old not found")

# Place clear at the true end of resetProjectToDefaults
end_reset_old = """    fitCanvasToScreen(true);
    centerCanvas();
    fitSidePanelToPalette();
    render();
  }"""

end_reset_new = """    fitCanvasToScreen(true);
    centerCanvas();
    fitSidePanelToPalette();
    render();
    window.isSuppressingDirty = false;
    isSuppressingDirty = false;
    window.isDirty = false;
    isDirty = false;
    setDirty(false);
  }"""

if end_reset_old in text:
    text = text.replace(end_reset_old, end_reset_new, 1)
    print("Added clear to end of resetProjectToDefaults")
else:
    print("WARNING: end_reset_old not found")

# 4. Make loadProjectData return Promise
load_ret_old = "    Promise.all([layerPromise, stampPromise, framesPromise]).then(([newLayers, newStamps, newFramesData])=>{"
load_ret_new = "    return Promise.all([layerPromise, stampPromise, framesPromise]).then(([newLayers, newStamps, newFramesData])=>{"

if load_ret_old in text:
    text = text.replace(load_ret_old, load_ret_new, 1)
    print("Made loadProjectData return Promise")
else:
    print("WARNING: load_ret_old not found")

# 5. Message listener update
msg_target_old = """  window.addEventListener('message', (evt) => {
    const data = evt.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LOAD_SPRITE') {
      setDirty(false);
      const targetW = data.width || (typeof W !== 'undefined' ? W : 32);
      const targetH = data.height || (typeof H !== 'undefined' ? H : 32);
      if (data.imageDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (typeof resizeCanvasWorkspace === 'function') {
            resizeCanvasWorkspace(targetW, targetH);
          } else {
            if (typeof W !== 'undefined') W = targetW;
            if (typeof H !== 'undefined') H = targetH;
            if (typeof resizeAllCanvasesToWH === 'function') resizeAllCanvasesToWH();
          }
          if (typeof layers !== 'undefined' && layers && layers[0]) {
            const l = layers[0];
            const ctx = (l.colorCanvas || l.canvas).getContext('2d');
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0);
          }
          if (typeof render === 'function') render();
          if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
          if (typeof centerCanvas === 'function') centerCanvas();
          notifyHostStatus();
        };
        img.src = data.imageDataUrl;
      } else {
        if (typeof resetProjectToDefaults === 'function') {
           resetProjectToDefaults(targetW, targetH);
           if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
           if (typeof centerCanvas === 'function') centerCanvas();
        } else {
           if (typeof W !== 'undefined') W = targetW;
           if (typeof H !== 'undefined') H = targetH;
           if (typeof resizeAllCanvasesToWH === 'function') resizeAllCanvasesToWH();
           if (typeof render === 'function') render();
           if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
           if (typeof centerCanvas === 'function') centerCanvas();
        }
        notifyHostStatus();
      }
      if (data.projectName && document.getElementById('projectNameInput')) {
        document.getElementById('projectNameInput').value = data.projectName;
      }
    } else if (data.type === 'MARK_CLEAN') {
      isDirty = false;
      isSuppressingDirty = false;
      setDirty(false);
    } else if (data.type === 'REQUEST_EXPORT') {
      sendSpriteToHost();
    } else if (data.type === 'REQUEST_SAVE') {
      const proj = buildProjectData();
      window.parent.postMessage({
        type: 'SAVE_PROJECT_DATA',
        data: proj,
        isExplicitSave: !!data.isExplicitSave
      }, '*');
    } else if (data.type === 'LOAD_PROJECT') {
      if (data.projectData) {
        loadProjectData(data.projectData);
        setDirty(false);
        setTimeout(notifyHostStatus, 60);
      }
    } else if (data.type === 'SET_PROJECT_NAME') {
      if (data.name !== undefined && document.getElementById('projectNameInput')) {
        document.getElementById('projectNameInput').value = data.name;
        notifyHostStatus();
      }
    } else if (data.type === 'REQUEST_STATUS') {
      notifyHostStatus();
    }
  });"""

msg_target_new = """  window.addEventListener('message', (evt) => {
    const data = evt.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LOAD_SPRITE') {
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
    } else if (data.type === 'LOAD_PROJECT') {
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
    } else if (data.type === 'MARK_CLEAN') {
      window.isSuppressingDirty = false;
      isSuppressingDirty = false;
      window.isDirty = false;
      isDirty = false;
      setDirty(false);
    } else if (data.type === 'REQUEST_EXPORT') {
      sendSpriteToHost();
    } else if (data.type === 'REQUEST_SAVE') {
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
    } else if (data.type === 'SET_PROJECT_NAME') {
      if (data.name !== undefined && document.getElementById('projectNameInput')) {
        document.getElementById('projectNameInput').value = data.name;
        notifyHostStatus();
      }
    } else if (data.type === 'REQUEST_STATUS') {
      notifyHostStatus();
    }
  });"""

if msg_target_old in text:
    text = text.replace(msg_target_old, msg_target_new, 1)
    print("Replaced message listener successfully")
else:
    print("WARNING: msg_target_old not found exactly")

with open('public/modules/sprites/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Saved updated index.html")
