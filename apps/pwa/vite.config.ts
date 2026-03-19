/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(async () => {
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

  return {
    plugins: [
      react(),
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
          clientsClaim: true,
          skipWaiting: true,
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
      setupFiles: ['../../test/setup.ts', './src/test/setup.ts'],
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
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/d3-')) {
              return 'vendor-d3';
            }
            if (id.includes('node_modules/@visx/')) {
              return 'vendor-visx';
            }
          },
        },
      },
    },
  };
});
