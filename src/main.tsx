import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker immediately for instant launch and offline access
registerSW({
  immediate: true,
  onNeedRefresh() {
    // When an update is ready, auto update or notify
  },
  onOfflineReady() {
    console.log('PULSE is offline-ready');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
