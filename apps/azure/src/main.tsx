import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './lib/runtimeConfig';
import { initAppInsights } from './lib/appInsights';
import { initTelemetry } from './services/telemetry';
import { registerLocaleLoaders } from '@variscout/core';
import type { MessageCatalog } from '@variscout/core';
import { bus } from './events/bus';
import { registerListeners } from './events/listeners';
import './index.css';

// Register domain event listeners (once, before render)
registerListeners(bus);

// Register bundler-specific locale loaders (Vite code-splits each into its own chunk)
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../../packages/core/src/i18n/messages/*.ts', {
    eager: false,
  })
);

// Load runtime config before rendering — required for Marketplace deployments
// where VITE_* env vars are baked at build time.
loadRuntimeConfig().then(config => {
  // Initialize client-side error monitoring (no-op if connection string is empty)
  initAppInsights(config.appInsightsConnectionString);

  // Initialize AI telemetry (no-op if connection string is not configured)
  initTelemetry();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
