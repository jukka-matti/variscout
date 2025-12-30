import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { darkTheme } from '../lib/darkTheme';

// Office.js initialization for Content Add-in
Office.onReady(info => {
  if (info.host === Office.HostType.Excel) {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    // Show error if not in Excel
    document.getElementById('root')!.innerHTML = `
      <div style="padding: ${darkTheme.spacingL}px; color: ${darkTheme.colorStatusDangerForeground};">
        This add-in requires Microsoft Excel.
      </div>
    `;
  }
});
