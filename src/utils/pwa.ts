/**
 * Progressive Web App (PWA) Service Worker Registration & Lifecycle
 */

export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isIframe = window.self !== window.top;
    const isCloudPreview = window.location.hostname.includes('.run.app') || window.location.hostname.includes('localhost') || Boolean((import.meta as any).env?.DEV);

    // In preview, iframe, or cloud dev environments, always purge and unregister service workers to prevent white-screen stale cache locks
    if (isIframe || isCloudPreview) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[Mason PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Mason PWA] Service Worker registration warning:', err);
        });
    });
  }
};
