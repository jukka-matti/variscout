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
    setupFiles: ['../../test/setup.ts', './src/setupTests.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'api/**'],
    pool: 'forks',
    fileParallelism: false,
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
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
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: variscoutManualChunks,
      },
    },
  },
});
