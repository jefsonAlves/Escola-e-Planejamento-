import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdvancedGradePanel from './components/AdvancedGradePanel.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Simple auto-update for PWA with periodic checks
export const updateSW = registerSW({
  onNeedRefresh() {
    // Dispatch a custom event that App.tsx can listen to, passing the update function
    const event = new CustomEvent("app-update-available", {
      detail: {
        acceptUpdate: () => updateSW(true)
      }
    });
    window.dispatchEvent(event);
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  },
  immediate: true
});

// Check for updates every hour
setInterval(() => {
  updateSW();
}, 60 * 60 * 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AdvancedGradePanel />
  </StrictMode>,
);
