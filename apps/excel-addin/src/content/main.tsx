import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ContentThemeProvider } from './ThemeContext';
import { darkTheme } from '../lib/darkTheme';

// Office.js initialization for Content Add-in
Office.onReady(info => {
  if (info.host === Office.HostType.Excel) {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <ContentThemeProvider>
          <App />
        </ContentThemeProvider>
      </React.StrictMode>
    );
  } else {
    // Show error if not in Excel (uses dark theme as fallback for error state)
    // Using textContent instead of innerHTML to avoid XSS risks
    const rootEl = document.getElementById('root')!;
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = `${darkTheme.spacingL}px`;
    errorDiv.style.color = darkTheme.colorStatusDangerForeground;
    errorDiv.textContent = 'This add-in requires Microsoft Excel.';
    rootEl.appendChild(errorDiv);
  }
});
