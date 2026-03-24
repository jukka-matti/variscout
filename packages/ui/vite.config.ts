import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VariScoutUI',
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'tailwindcss'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          tailwindcss: 'tailwindcss',
        },
      },
    },
    rolldownOptions: {
      checks: {
        // @variscout/core statically imported everywhere; dynamic import
        // in useAsyncStats fallback is intentional (Worker unavailable path)
        ineffectiveDynamicImport: false,
        // vite-plugin-dts is slow but correct; suppress timing noise
        pluginTimings: false,
      },
    },
  },
});
