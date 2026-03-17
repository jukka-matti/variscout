import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './lib/runtimeConfig';
import './index.css';

// Load runtime config before rendering — required for Marketplace deployments
// where VITE_* env vars are baked at build time.
loadRuntimeConfig().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
