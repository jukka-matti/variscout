import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './lib/runtimeConfig';
import { initAppInsights } from './lib/appInsights';
import { registerLocaleLoaders } from '@variscout/core';
import type { MessageCatalog } from '@variscout/core';
import './index.css';

// Register bundler-specific locale loaders (Vite code-splits each into its own chunk)
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../../packages/core/src/i18n/messages/*.ts', {
    eager: false,
  })
);

// Load runtime config before rendering — required for Marketplace deployments
// where VITE_* env vars are baked at build time.
loadRuntimeConfig().then(config => {
  // Initialize App Insights + AI trace flushing (no-op if connection string is empty)
  initAppInsights(config.appInsightsConnectionString);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
