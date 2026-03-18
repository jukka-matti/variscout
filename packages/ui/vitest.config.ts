import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 57,
        branches: 55,
        functions: 52,
      },
    },
  },
});
