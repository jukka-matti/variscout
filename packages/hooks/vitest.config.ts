import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 68,
        branches: 53,
        functions: 78,
      },
    },
  },
});
