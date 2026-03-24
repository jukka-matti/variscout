/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { variscoutManualChunks } from '../../config/viteChunks';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'api/**'],
    pool: 'forks',
    fileParallelism: false,
    execArgv: ['--max-old-space-size=4096'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 48,
        branches: 47,
        functions: 32,
      },
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: variscoutManualChunks,
      },
      checks: {
        // App Insights SDK loads via dynamic import (async chunk) —
        // intentional conditional loading, same pattern as Microsoft's
        // SDK Loader Script. See build-system.md.
        ineffectiveDynamicImport: false,
      },
    },
  },
});
