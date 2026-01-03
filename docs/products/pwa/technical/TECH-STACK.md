# Technical Stack

## Overview

Technology choices for VaRiScout web app and installed PWA.

```
DEPLOYMENT MODEL
─────────────────────────────────────────────────────────────────

WEB APP (variscout.com/app)
├── Runs on: Vercel servers
├── Features: Free only (no saving, no upgrade)
├── Purpose: Learning, training, quick try
└── Same codebase, feature-flagged

INSTALLED PWA
├── Runs on: User's computer (after install)
├── Features: Free + Paid (saving, templates)
├── Purpose: Real project work
├── Upgrade: Via Paddle (in-app)
└── Works offline
```

---

## PWA Application

### Core Framework

| Component  | Technology   | Version |
| ---------- | ------------ | ------- |
| Framework  | React        | 18.x    |
| Build Tool | Vite         | 5.x     |
| Language   | TypeScript   | 5.x     |
| Styling    | Tailwind CSS | 3.x     |

### Data & State

| Component        | Technology                 | Purpose                                |
| ---------------- | -------------------------- | -------------------------------------- |
| Local Storage    | Dexie.js                   | IndexedDB wrapper (installed PWA only) |
| State Management | React Context + useReducer | Simple, built-in                       |
| Form Handling    | React Hook Form            | If needed                              |

### Charts & Visualization

| Component | Technology  | Purpose                                     |
| --------- | ----------- | ------------------------------------------- |
| Primary   | Visx        | React + D3 primitives, shared with Power BI |
| Export    | html2canvas | PNG export                                  |

**Why Visx:** Same chart components used across PWA, Power BI, and Excel. One codebase in `@variscout/core`.

### PWA Features

| Component      | Technology   | Purpose                         |
| -------------- | ------------ | ------------------------------- |
| Service Worker | Workbox      | Offline caching (installed PWA) |
| Manifest       | Standard PWA | Install capability              |

### Feature Flags

```typescript
// src/config/features.ts

export function getFeatures() {
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  return {
    // Web app: free only, no saving
    canSaveProjects: isInstalled,
    canExportVrs: isInstalled,
    canSaveTemplates: isInstalled,
    showUpgradeOption: isInstalled,

    // Both web and installed
    allCharts: true,
    allAnalysis: true,
    copyToClipboard: true,
    exportPng: true,
    exportCsv: true,
  };
}
```

### Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.1.0",
    "@visx/group": "^3.0.0",
    "@visx/scale": "^3.0.0",
    "@visx/shape": "^3.0.0",
    "@visx/axis": "^3.0.0",
    "@visx/tooltip": "^3.0.0",
    "lodash-es": "^4.17.21",
    "@paddle/paddle-js": "^1.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Marketing Website

### Framework

| Component | Technology   | Reason                               |
| --------- | ------------ | ------------------------------------ |
| Framework | Astro        | Fast static sites, partial hydration |
| Styling   | Tailwind CSS | Consistent with PWA                  |
| Icons     | Lucide       | Clean, consistent                    |

### Deployment

| Component   | Technology           |
| ----------- | -------------------- |
| Hosting     | Vercel               |
| PWA Hosting | Vercel (same)        |
| Domain      | variscout.com        |
| SSL         | Automatic via Vercel |

### Site Structure

```
variscout.com/           → Vercel
├── / (marketing home)   → Astro static
├── /pricing             → Astro static
├── /use-cases/          → Astro static
├── /resources/          → Astro static
└── /app                 → React PWA (Vite build)
                           ├── Web visitors: free features only
                           └── Installed users: free + paid features
```

### Dependencies

```json
{
  "dependencies": {
    "astro": "^4.x",
    "@astrojs/tailwind": "^5.x",
    "lucide-astro": "^0.x"
  }
}
```

---

## Webhook API (License Activation)

### Platform

| Component   | Technology            | Reason                          |
| ----------- | --------------------- | ------------------------------- |
| Runtime     | Vercel Edge Functions | Same platform as hosting        |
| Alternative | Cloudflare Workers    | If needed for edge distribution |

### Dependencies (API)

```json
{
  "dependencies": {
    "@paddle/paddle-webhook-auth": "^1.0.0"
  }
}
```

### Endpoints

| Endpoint                | Method | Purpose                                  |
| ----------------------- | ------ | ---------------------------------------- |
| `/api/license/activate` | POST   | Instant activation after Paddle purchase |
| `/api/webhook/paddle`   | POST   | Paddle webhook events                    |

---

## Email

### Provider

| Component           | Technology | Reason                          |
| ------------------- | ---------- | ------------------------------- |
| Transactional Email | Resend     | Simple API, good deliverability |
| Alternative         | SendGrid   | More features if needed         |

---

## Crypto (License Keys)

### Libraries

| Purpose             | Library                   |
| ------------------- | ------------------------- |
| Server signing      | Node.js crypto (built-in) |
| Client verification | Web Crypto API (built-in) |

### Key Specs

| Spec      | Value      |
| --------- | ---------- |
| Algorithm | RSA-SHA256 |
| Key Size  | 2048 bits  |
| Format    | PEM        |

---

## Development Tools

### Required

| Tool     | Purpose            |
| -------- | ------------------ |
| Node.js  | 18.x or 20.x       |
| npm/pnpm | Package management |
| Git      | Version control    |

### Recommended

| Tool     | Purpose         |
| -------- | --------------- |
| VS Code  | Editor          |
| Prettier | Code formatting |
| ESLint   | Linting         |

---

## Vite Configuration

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'VaRiScout Lite',
        short_name: 'VaRiScout',
        description: "Find what's driving variation. In minutes.",
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Chart colors
        chart: {
          value: '#3b82f6', // Blue - data points
          ucl: '#ef4444', // Red - upper limit
          lcl: '#ef4444', // Red - lower limit
          cl: '#22c55e', // Green - center line
          spec: '#f59e0b', // Amber - spec limits
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

---

## Performance Budget

| Metric              | Budget          |
| ------------------- | --------------- |
| Initial bundle      | < 200KB gzipped |
| Total app size      | < 700KB         |
| LCP                 | < 2.5s          |
| FID                 | < 100ms         |
| CLS                 | < 0.1           |
| Time to Interactive | < 3s            |

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 90+     |
| Firefox | 90+     |
| Safari  | 14+     |
| Edge    | 90+     |

**Required APIs**:

- IndexedDB
- Service Workers
- Web Crypto API
- ES2020+

---

## Monitoring (Optional)

| Purpose        | Tool                         |
| -------------- | ---------------------------- |
| Error tracking | Sentry (free tier)           |
| Analytics      | Plausible (privacy-friendly) |
| Uptime         | UptimeRobot (free)           |
