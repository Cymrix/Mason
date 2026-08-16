/**
 * Progressive Web App (PWA) Service Worker Registration & Lifecycle
 */

export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Mason PWA] Service Worker registered with scope:', reg.scope);

          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[Mason PWA] New update available; content cached.');
                  } else {
                    console.log('[Mason PWA] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[Mason PWA] Service Worker registration warning:', err);
        });
    });
  }
};
