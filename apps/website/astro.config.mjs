// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://variscout.com',
  redirects: {
    '/en/learn/four-pillars': '/en/learn/four-lenses',
    '/de/learn/four-pillars': '/de/learn/four-lenses',
    '/es/learn/four-pillars': '/es/learn/four-lenses',
    '/fr/learn/four-pillars': '/fr/learn/four-lenses',
    '/pt/learn/four-pillars': '/pt/learn/four-lenses',
  },
  integrations: [react(), sitemap()],
  prefetch: {
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()]
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "es", "fr", "pt"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true
    }
  }
});