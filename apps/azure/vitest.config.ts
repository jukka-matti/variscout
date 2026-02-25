import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
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
});
