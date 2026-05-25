import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// pool: 'threads' + happy-dom tuning — see docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    pool: 'threads',
    setupFiles: ['../../test/setup.ts'],
    exclude: ['dist/**', 'node_modules/**'],
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
