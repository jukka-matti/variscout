import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './lib/runtimeConfig';
import { initTelemetry } from './services/telemetry';
import './index.css';

// Load runtime config before rendering — required for Marketplace deployments
// where VITE_* env vars are baked at build time.
loadRuntimeConfig().then(() => {
  // Initialize AI telemetry (no-op if connection string is not configured)
  initTelemetry();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
