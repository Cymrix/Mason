import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/pwa';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadSavedAppTheme, applyThemeCSSVariables } from './theme/appTheme';

// Immediately apply saved theme CSS variables and PWA window titlebar meta tags
try {
  applyThemeCSSVariables(loadSavedAppTheme());
} catch (e) {
  console.warn('Initial theme setup warning:', e);
}

// Initialize PWA Service Worker (and purge old stale preview workers)
registerServiceWorker();

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (mountErr: any) {
    console.error('Fatal mount error in main.tsx:', mountErr);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background-color: #0a0a0a; color: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; font-family: ui-sans-serif, system-ui, sans-serif;">
        <div style="max-width: 480px; width: 100%; background-color: #171717; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #f87171;">
            <span style="font-size: 24px;">⚠️</span>
            <h2 style="font-size: 18px; font-weight: bold; margin: 0; color: #ffffff;">Mason Workspace Recovery</h2>
          </div>
          <p style="font-size: 13px; color: #a3a3a3; margin-bottom: 16px; line-height: 1.5;">
            An unexpected error occurred while mounting the engine workspace:
          </p>
          <div style="background-color: #0a0a0a; padding: 12px; border-radius: 8px; border: 1px solid #262626; font-family: monospace; font-size: 11px; color: #fca5a5; margin-bottom: 16px; overflow-x: auto; white-space: pre-wrap;">
            ${String(mountErr?.message || mountErr)}
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.location.reload()" style="cursor: pointer; padding: 8px 16px; background-color: #0284c7; color: #ffffff; border: none; border-radius: 8px; font-size: 12px; font-weight: bold;">
              Reload App
            </button>
            <button onclick="localStorage.clear(); window.location.reload();" style="cursor: pointer; padding: 8px 16px; background-color: #262626; color: #d4d4d4; border: 1px solid #404040; border-radius: 8px; font-size: 12px; font-weight: bold;">
              Clear Cache & Reset
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

