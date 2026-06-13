/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { variscoutManualChunks } from '../../config/viteChunks';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Bundle analysis: run with ANALYZE=true pnpm build
  // Requires: pnpm add -D rollup-plugin-visualizer
  const analyzePlugins: PluginOption[] = [];
  if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer');
    analyzePlugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
      }) as PluginOption
    );
  }

  const channel =
    process.env.VITE_VARISCOUT_CHANNEL ??
    (mode === 'test' ||
    process.env.VITEST ||
    process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test'
      ? 'individual'
      : 'free');
  const outDir = process.env.VITE_VARISCOUT_OUT_DIR ?? 'dist';
  const artifactsModule =
    channel === 'individual' || channel === 'company'
      ? path.resolve(__dirname, 'src/artifacts/paidArtifacts.ts')
      : path.resolve(__dirname, 'src/artifacts/freeArtifacts.ts');
  const artifactsEnabled = channel === 'individual' || channel === 'company';

  return {
    define: {
      __WORKSPACE_ARTIFACTS__: JSON.stringify(artifactsEnabled),
    },
    resolve: {
      alias: {
        '@pwa-artifacts': artifactsModule,
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'VariScout',
          short_name: 'VariScout',
          description: 'Offline-first manufacturing variation analysis for quality professionals',
          theme_color: '#1e3a5f',
          background_color: '#ffffff',
          display: 'browser',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          // Only precache the app shell — not lazy-loaded feature chunks
          globPatterns: ['**/*.{css,html,ico,png,svg,woff,woff2}'],
          // Lazy JS chunks get runtime-cached on first use (content-hashed = immutable)
          runtimeCaching: [
            {
              urlPattern: /\.js$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'js-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      ...analyzePlugins,
    ],
    base: '/',
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['../../test/setup.ts'],
      exclude: ['**/node_modules/**', '**/e2e/**'],
      pool: 'forks',
      fileParallelism: false,
      coverage: {
        provider: 'v8',
        thresholds: {
          lines: 44,
          branches: 33,
          functions: 20,
        },
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: variscoutManualChunks,
        },
      },
    },
  };
});
