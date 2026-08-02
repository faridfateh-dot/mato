import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister legacy service workers to prevent stale cached asset white-screen lockouts on GitHub Pages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});

  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {});
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    const root = createRoot(rootEl);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err) {
    console.error('Failed to mount React root:', err);
  }
}
