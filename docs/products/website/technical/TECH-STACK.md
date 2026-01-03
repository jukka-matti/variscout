# Technical Stack

## Overview

Technology choices for variscout.com marketing website.

---

## Framework

### Recommended: Astro

| Property  | Value                                          |
| --------- | ---------------------------------------------- |
| Framework | [Astro](https://astro.build)                   |
| Version   | Latest stable                                  |
| Why       | Fast static sites, partial hydration, good SEO |

Alternatives:

- Next.js (if more interactivity needed)
- SvelteKit (if team prefers Svelte)

### Component Library

| Property      | Value                       |
| ------------- | --------------------------- |
| UI Components | Custom or Shadcn/UI adapted |
| Styling       | Tailwind CSS                |
| Icons         | Lucide Icons                |

---

## Styling

### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          'primary-dark': '#1D4ED8',
          'primary-light': '#3B82F6',
        },
        // See TOKENS.md for full color palette
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

### CSS Custom Properties

Import tokens from `design-system/TOKENS.md`:

```css
:root {
  --color-brand-primary: #2563eb;
  /* ... */
}
```

---

## Content Management

### Approach: Markdown + YAML

Content stored in markdown files:

- `content/COPY-*.md` — Page copy
- `content/MESSAGING.md` — Shared messaging

Benefits:

- Version controlled
- Easy for AI agents to edit
- No CMS dependency
- Fast builds

### Content Loading (Astro)

```astro
---
import { getEntry } from 'astro:content';
const homeContent = await getEntry('content', 'home');
---

<h1>{homeContent.data.hero.headline}</h1>
```

---

## Hosting

### Recommended: Vercel or Cloudflare Pages

| Option                | Pros                        | Cons                      |
| --------------------- | --------------------------- | ------------------------- |
| Vercel                | Easy deploy, good analytics | Cost at scale             |
| Cloudflare Pages      | Free, fast CDN              | Less integrated analytics |
| Netlify               | Good features               | Similar to Vercel         |
| Azure Static Web Apps | Microsoft ecosystem         | More setup                |

### Configuration

```yaml
# vercel.json
{ 'buildCommand': 'npm run build', 'outputDirectory': 'dist', 'framework': 'astro' }
```

---

## Domain & SSL

| Property | Value                         |
| -------- | ----------------------------- |
| Domain   | variscout.com                 |
| SSL      | Auto via host (Let's Encrypt) |
| CDN      | Included with host            |

DNS Records:

```
A     @      → Host IP
CNAME www    → variscout.com
CNAME app    → [PWA subdomain or same]
```

---

## Build & Deploy

### Build Process

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### CI/CD

GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: [deploy action for your host]
```

---

## PWA Integration

### App at /app

Options:

1. **Same repo, different route** — Astro serves `/app` as separate SPA
2. **Subdomain** — app.variscout.com (separate deploy)
3. **Same build** — PWA bundled with marketing site

Recommended: **Same repo, /app route**

```
/src
  /pages
    /index.astro        → Marketing homepage
    /pricing.astro      → Pricing page
    /app/
      /index.astro      → PWA entry point (SPA)
```

### PWA manifest

```json
{
  "name": "VaRiScout",
  "short_name": "VaRiScout",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB"
}
```

---

## Performance Budget

| Metric            | Budget              |
| ----------------- | ------------------- |
| Total page weight | < 500KB             |
| JavaScript        | < 100KB             |
| CSS               | < 50KB              |
| Images            | < 300KB (optimized) |
| LCP               | < 2.5s              |
| FID               | < 100ms             |
| CLS               | < 0.1               |

### Optimizations

- Astro partial hydration (only interactive components load JS)
- Image optimization (Astro Image component)
- Font subsetting (Latin only)
- Preload critical assets
- Lazy load below-fold content

---

## Dependencies

### Production

```json
{
  "dependencies": {
    "astro": "^4.x",
    "@astrojs/tailwind": "^5.x",
    "lucide-astro": "^0.x"
  }
}
```

### Development

```json
{
  "devDependencies": {
    "tailwindcss": "^3.x",
    "prettier": "^3.x",
    "prettier-plugin-astro": "^0.x"
  }
}
```

---

## File Structure

```
variscout-website/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── FeatureCard.astro
│   │   └── ...
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ProductLayout.astro
│   │   └── ...
│   ├── pages/
│   │   ├── index.astro
│   │   ├── pricing.astro
│   │   ├── product/
│   │   ├── use-cases/
│   │   ├── resources/
│   │   └── app/
│   ├── content/
│   │   └── [content files]
│   └── styles/
│       └── global.css
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── ...
├── astro.config.mjs
├── tailwind.config.js
├── package.json
└── README.md
```

---

## Environment Variables

```bash
# .env
PUBLIC_SITE_URL=https://variscout.com
PUBLIC_APP_URL=https://variscout.com/app
PUBLIC_ANALYTICS_ID=UA-XXXXX

# Not needed for static site, but for any API calls:
# STRIPE_SECRET_KEY=sk_xxx
# LICENSE_API_URL=https://api.variscout.com
```

---

## Testing

### Lighthouse

Run on every deploy:

- Performance > 90
- Accessibility > 95
- Best Practices > 95
- SEO > 95

### Visual Testing

- Playwright for screenshot comparison
- Test key pages at multiple breakpoints

### Link Checking

- Check all internal links
- Check all external links
- Run in CI

---

## Monitoring

### Uptime

- Pingdom or UptimeRobot
- Alert on downtime

### Error Tracking

- Sentry (if any JS)
- Or none (static site is simple)

### Analytics

See `TECH-ANALYTICS.md`
