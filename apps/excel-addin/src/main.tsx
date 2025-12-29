import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './taskpane/App';

// Office.js initialization
Office.onReady(info => {
  if (info.host === Office.HostType.Excel) {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <FluentProvider theme={webLightTheme}>
          <App />
        </FluentProvider>
      </React.StrictMode>
    );
  }
});
