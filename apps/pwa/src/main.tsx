import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { ErrorBoundary } from '@variscout/ui';

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
