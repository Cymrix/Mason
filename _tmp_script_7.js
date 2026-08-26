
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof layers !== 'undefined' && (!layers || layers.length === 0)) {
      if (typeof resetProjectToDefaults === 'function') {
        resetProjectToDefaults(32, 32);
      }
    } else {
      if (typeof render === 'function') render();
      if (typeof drawGridOverlay === 'function') drawGridOverlay();
      if (typeof centerCanvas === 'function') centerCanvas();
    }
  }, 50);
});
