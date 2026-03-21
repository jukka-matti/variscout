/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
        manualChunks(id) {
          // Locale files → individual named chunks (English stays in main bundle)
          const localeMatch = id.match(/i18n\/messages\/(\w+)\.ts$/);
          if (localeMatch && localeMatch[1] !== 'en') {
            return `locale-${localeMatch[1]}`;
          }
          if (id.includes('node_modules/d3-')) return 'd3';
          if (id.includes('node_modules/@visx/')) return 'visx';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/lucide-react')
          )
            return 'vendor';
          if (id.includes('node_modules/@microsoft/teams-js')) return 'teams';
          if (id.includes('node_modules/dexie')) return 'storage';
        },
      },
    },
  },
});
