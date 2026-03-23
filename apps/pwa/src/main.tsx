import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from '@variscout/ui';
import { LocaleProvider } from './context/LocaleContext';
import { ErrorBoundary } from '@variscout/ui';
import { registerLocaleLoaders } from '@variscout/core';
import type { MessageCatalog } from '@variscout/core';

// Register bundler-specific locale loaders (Vite code-splits each into its own chunk)
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../../packages/core/src/i18n/messages/*.ts', {
    eager: false,
  })
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <ThemeProvider>
        <DataProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </DataProvider>
      </ThemeProvider>
    </LocaleProvider>
  </React.StrictMode>
);
