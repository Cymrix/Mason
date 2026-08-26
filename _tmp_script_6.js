
(function() {
  const applyToAppBtn = document.getElementById('applyToAppBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  function isEmbeddedInIframe() {
    try {
      return window.self !== window.top;
    } catch(e) {
      return true;
    }
  }

  if (isEmbeddedInIframe() && cancelModalBtn) {
    cancelModalBtn.style.display = 'inline-flex';
  }

  function sendSpriteToHost() {
    if (typeof render === 'function') render();
    let colorCanvas = null;
    if (typeof buildCompositeExportCanvas === 'function') {
      try { colorCanvas = buildCompositeExportCanvas('color'); } catch(e) {}
    }
    if (!colorCanvas) {
      colorCanvas = document.createElement('canvas');
      colorCanvas.width = typeof W !== 'undefined' ? W : 32;
      colorCanvas.height = typeof H !== 'undefined' ? H : 32;
      const ctx = colorCanvas.getContext('2d');
      if (typeof layers !== 'undefined' && Array.isArray(layers)) {
        layers.forEach(l => {
          if (l.visible && (l.colorCanvas || l.canvas)) {
            ctx.globalAlpha = (l.opacity !== undefined ? l.opacity : 100) / 100;
            ctx.drawImage(l.colorCanvas || l.canvas, 0, 0);
          }
        });
      }
    }

    const dataUrl = colorCanvas.toDataURL('image/png');
    let sheetUrl = dataUrl;

    if (typeof animFrames !== 'undefined' && Array.isArray(animFrames) && animFrames.length > 1) {
      try {
        const fw = typeof W !== 'undefined' ? W : 32;
        const fh = typeof H !== 'undefined' ? H : 32;
        const count = animFrames.length;
        const sheet = document.createElement('canvas');
        sheet.width = fw * count;
        sheet.height = fh;
        const sctx = sheet.getContext('2d');
        animFrames.forEach((fr, idx) => {
          if (fr.layers && Array.isArray(fr.layers)) {
            fr.layers.forEach(l => {
              if (l.visible && (l.colorCanvas || l.canvas)) {
                sctx.globalAlpha = (l.opacity !== undefined ? l.opacity : 100) / 100;
                sctx.drawImage(l.colorCanvas || l.canvas, idx * fw, 0);
              }
            });
          }
        });
        sctx.globalAlpha = 1;
        sheetUrl = sheet.toDataURL('image/png');
      } catch(err) {
        console.warn('Spritesheet frame composition warning:', err);
      }
    }

    const projName = (document.getElementById('projectNameInput')?.value) || 'Sprite';

    const payload = {
      type: 'SPRITE_SAVED',
      dataUrl: dataUrl,
      spritesheetUrl: sheetUrl,
      width: typeof W !== 'undefined' ? W : 32,
      height: typeof H !== 'undefined' ? H : 32,
      frameCount: (typeof animFrames !== 'undefined' && Array.isArray(animFrames)) ? animFrames.length : 1,
      fps: typeof animFPS !== 'undefined' ? animFPS : 12,
      projectName: projName
    };

    if (isEmbeddedInIframe()) {
      window.parent.postMessage(payload, '*');
    } else {
      const link = document.createElement('a');
      link.download = projName + '.png';
      link.href = dataUrl;
      link.click();
    }
  }

  if (applyToAppBtn) {
    applyToAppBtn.addEventListener('click', sendSpriteToHost);
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => {
      if (isEmbeddedInIframe()) {
        window.parent.postMessage({ type: 'SPRITE_CANCEL' }, '*');
      }
    });
  }

  window.addEventListener('message', (evt) => {
    const data = evt.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LOAD_SPRITE') {
      if (data.imageDataUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const targetW = data.width || img.width;
          const targetH = data.height || img.height;
          if (typeof resizeCanvasTo === 'function') {
            resizeCanvasTo(targetW, targetH);
          } else {
            if (typeof W !== 'undefined') W = targetW;
            if (typeof H !== 'undefined') H = targetH;
          }
          if (typeof layers !== 'undefined' && layers && layers[0]) {
            const l = layers[0];
            const ctx = (l.colorCanvas || l.canvas).getContext('2d');
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0);
          }
          if (typeof render === 'function') render();
        };
        img.src = data.imageDataUrl;
      }
      if (data.projectName && document.getElementById('projectNameInput')) {
        document.getElementById('projectNameInput').value = data.projectName;
      }
    } else if (data.type === 'REQUEST_EXPORT') {
      sendSpriteToHost();
    }
  });
})();
