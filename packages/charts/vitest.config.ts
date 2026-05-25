import { defineConfig } from 'vitest/config';

// pool: 'threads' + happy-dom tuning — see docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    pool: 'threads',
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 63,
        branches: 56,
        functions: 75,
      },
    },
  },
});
