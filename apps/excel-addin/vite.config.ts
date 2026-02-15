import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Try to load dev certs for HTTPS (required for Office Add-ins)
  let https: boolean | { key: Buffer; cert: Buffer } = false;

  if (mode === 'development') {
    const certPath = path.join(__dirname, '.cert');
    const keyFile = path.join(certPath, 'localhost.key');
    const certFile = path.join(certPath, 'localhost.crt');

    if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
      https = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
      };
    } else {
      console.warn('⚠️  No SSL certificates found. Run: npx office-addin-dev-certs install');
      console.warn('   Then copy certs to apps/excel-addin/.cert/');
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      https,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          taskpane: path.resolve(__dirname, 'index.html'),
          commands: path.resolve(__dirname, 'commands.html'),
          content: path.resolve(__dirname, 'content.html'),
        },
      },
    },
  };
});
