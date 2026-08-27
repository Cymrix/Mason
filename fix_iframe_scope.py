import re

with open("public/modules/sprites/index.html", "r", encoding="utf-8") as f:
    text = f.read()

# First, remove the previous iframe logic that I appended outside the IIFE
start_marker = "// MASON IFRAME INTEGRATION"
end_marker = "if (document.readyState === 'complete') {\n    setTimeout(() => {\n      try { window.parent.postMessage({ type: 'SPRITE_READY' }, '*'); } catch (e) {}\n    }, 50);\n  }"

if start_marker in text:
    start_idx = text.rfind(start_marker)
    end_idx = text.find(end_marker, start_idx) + len(end_marker)
    if end_idx > start_idx:
        text = text[:start_idx] + text[end_idx:]
        print("Removed old iframe logic")

# Now insert it INSIDE the IIFE, right before the last `})();`
pos = text.rfind("})();")
if pos != -1:
    iframe_logic = """
  // MASON IFRAME INTEGRATION
  window.addEventListener('message', async (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    
    if (data.type === 'LOAD_PROJECT') {
      window.isSuppressingDirty = true;
      try {
        if (data.projectName) {
          const nameInput = document.getElementById('projectNameInput');
          if (nameInput) nameInput.value = data.projectName;
        }
        if (data.projectData) {
          await loadProjectData(data.projectData);
        }
        if (typeof render === 'function') render();
        if (typeof drawGridOverlay === 'function') drawGridOverlay();
        if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
        if (typeof centerCanvas === 'function') centerCanvas();
        if (typeof syncDocCompositeCanvasSize === 'function') syncDocCompositeCanvasSize();
      } catch (err) {
        console.error('Error loading project data in iframe:', err);
      } finally {
        setTimeout(() => {
          window.isSuppressingDirty = false;
          setDirty(false);
          try {
            window.parent.postMessage({
              type: 'SPRITE_STATUS',
              width: typeof W !== 'undefined' ? W : 32,
              height: typeof H !== 'undefined' ? H : 32,
              frameCount: (typeof frames !== 'undefined' && frames) ? frames.length : 1,
              isDirty: false
            }, '*');
          } catch (e) {}
        }, 50);
      }
    } else if (data.type === 'LOAD_SPRITE') {
      // For images
      window.isSuppressingDirty = true;
      try {
        const targetW = data.width || 32;
        const targetH = data.height || 32;
        const targetName = data.projectName || 'Sprite';
        const nameInput = document.getElementById('projectNameInput');
        if (nameInput) nameInput.value = targetName;
        if (data.imageDataUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            try {
              await resetProjectToDefaults(img.width || targetW, img.height || targetH, 'Background', ctx => ctx.drawImage(img, 0, 0), targetName);
              if (typeof render === 'function') render();
              if (typeof drawGridOverlay === 'function') drawGridOverlay();
              if (typeof fitCanvasToScreen === 'function') fitCanvasToScreen(true);
              if (typeof centerCanvas === 'function') centerCanvas();
            } finally {
              window.isSuppressingDirty = false;
              setDirty(false);
              window.parent.postMessage({
                type: 'SPRITE_STATUS', width: W, height: H, frameCount: frames ? frames.length : 1, isDirty: false
              }, '*');
            }
          };
          img.src = data.imageDataUrl;
        }
      } catch (err) {}
    } else if (data.type === 'REQUEST_SAVE') {
      try {
        if (typeof captureCurrentFrameState === 'function') captureCurrentFrameState();
        const projectData = typeof buildProjectData === 'function' ? buildProjectData() : null;
        const spritesheetDataUrl = (typeof frames !== 'undefined' && frames && frames.length > 1) ? buildSpriteSheetExportCanvas('color').toDataURL() : buildCompositeExportCanvas('color').toDataURL();
        const singleFrameDataUrl = buildCompositeExportCanvas('color').toDataURL();
        window.parent.postMessage({
          type: 'SAVE_PROJECT_DATA',
          saveId: data.saveId,
          data: projectData,
          spritesheetUrl: spritesheetDataUrl,
          dataUrl: spritesheetDataUrl,
          imageDataUrl: singleFrameDataUrl
        }, '*');
      } catch (err) {
        console.error('Error handling REQUEST_SAVE:', err);
        window.parent.postMessage({
          type: 'SAVE_PROJECT_DATA_ERROR',
          saveId: data.saveId,
          error: String(err)
        }, '*');
      }
    } else if (data.type === 'MARK_CLEAN') {
      setDirty(false);
    } else if (data.type === 'REQUEST_STATUS') {
      try {
        window.parent.postMessage({ type: 'SPRITE_READY' }, '*');
        window.parent.postMessage({
          type: 'SPRITE_STATUS',
          width: typeof W !== 'undefined' ? W : 32,
          height: typeof H !== 'undefined' ? H : 32,
          frameCount: (typeof frames !== 'undefined' && frames) ? frames.length : 1,
          isDirty: (typeof isDirty !== 'undefined' ? isDirty : false)
        }, '*');
      } catch (e) {}
    }
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      try { window.parent.postMessage({ type: 'SPRITE_READY' }, '*'); } catch (e) {}
    }, 50);
  });
  if (document.readyState === 'complete') {
    setTimeout(() => {
      try { window.parent.postMessage({ type: 'SPRITE_READY' }, '*'); } catch (e) {}
    }, 50);
  }
"""
    text = text[:pos] + iframe_logic + text[pos:]
    print("Inserted iframe logic into IIFE")

with open("public/modules/sprites/index.html", "w", encoding="utf-8") as f:
    f.write(text)

