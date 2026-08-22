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

// Initialize PWA Service Worker
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

