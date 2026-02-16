# VaRiScout Marketing Website

Static marketing, education, and conversion website for VaRiScout. Live at [variscout.com](https://variscout.com).

**Stack:** Astro 5 + React 19 Islands + Tailwind CSS v4 + Visx charts

## Quick Start

```bash
pnpm --filter @variscout/website dev      # Dev server (localhost:4321)
pnpm --filter @variscout/website build    # Production build to dist/
pnpm --filter @variscout/website preview  # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── islands/           # React islands (client-side interactive)
│   │   ├── IChartIsland.tsx
│   │   ├── BoxplotIsland.tsx
│   │   ├── ParetoIsland.tsx
│   │   ├── StatsIsland.tsx
│   │   ├── PerformanceDemo.tsx
│   │   ├── ToolChartIsland.tsx
│   │   ├── CaseStudyChartsIsland.tsx
│   │   ├── GlossaryTooltipIsland.tsx
│   │   └── ChartContainer.tsx
│   ├── *.astro            # Static Astro components (Header, Footer, Hero, etc.)
│   └── *.tsx              # Non-island React components (CaseStepsDisplay, LensAnimation)
├── data/
│   ├── toolsData.ts       # 6 tool pages (I-Chart, Boxplot, Pareto, Capability, Regression, Performance)
│   ├── learnData.ts       # 10 learn topics (Two Voices, Four Lenses, EDA, Staged Analysis, methodologies, etc.)
│   └── glossaryData.ts    # ~26 glossary terms extending @variscout/core glossary
├── i18n/
│   ├── ui.ts              # Translation strings for 5 languages
│   └── utils.ts           # getLangFromUrl(), useTranslations(), getRouteFromUrl()
├── layouts/
│   └── BaseLayout.astro   # Root layout (SEO meta, OG tags, Schema.org, fonts)
├── pages/
│   ├── index.astro        # Root redirect to default locale
│   ├── [lang]/            # Localized pages (en, de, es, fr, pt)
│   │   ├── index.astro
│   │   ├── pricing.astro
│   │   ├── journey.astro
│   │   ├── tools/         # Tool index + [tool].astro dynamic routes
│   │   ├── learn/         # Learn index + [topic].astro dynamic routes
│   │   ├── cases/         # Case index + [slug].astro dynamic routes
│   │   ├── glossary/      # Glossary index + [term].astro dynamic routes
│   │   ├── product/       # Product pages + compare.astro
│   │   └── use-cases/     # Use case pages
│   ├── resources/         # Tutorials, sample data (not localized)
│   ├── legal/             # Privacy, terms (not localized)
│   ├── about.astro
│   ├── contact.astro
│   ├── app.astro          # PWA redirect/embed
│   └── 404.astro
└── styles/
    └── global.css         # Tailwind v4 + custom theme tokens
```

## Content Management

Content lives in three TypeScript data files (no CMS). Each exports an array of typed objects and helper functions.

### Adding a Tool Page

1. Add a `ToolData` entry to `src/data/toolsData.ts`
2. The `[lang]/tools/[tool].astro` page generates routes automatically from `getAllToolSlugs()`
3. Required fields: `slug`, `name`, `lens`, `hero`, `whenToUse`, `dataRequirements`, `howToRead`, `patterns`, `features`, `sampleKey`, `nextTools`

### Adding a Learn Topic

1. Add a `LearnTopic` entry to `src/data/learnData.ts`
2. Routes generated from `getAllLearnSlugs()`
3. Sections support visual types: `comparison`, `diagram`, `list`, `quote`, `chart`
4. Chart visuals render live Visx charts using `@variscout/charts` and `@variscout/data`

### Adding a Glossary Term

1. Add the base term to `packages/core/src/glossary/terms.ts` (shared across all apps)
2. Add website extensions (SEO, sections, tips) to `src/data/glossaryData.ts` `GLOSSARY_EXTENSIONS`
3. Routes generated from `getAllGlossaryTermIds()`

## i18n

Five languages: English (default), German, Spanish, French, Portuguese.

### How Routing Works

- Configured in `astro.config.mjs` with `prefixDefaultLocale: false`
- English pages: `/tools/i-chart`, `/pricing`
- Other languages: `/de/tools/i-chart`, `/fr/pricing`
- `getLangFromUrl()` extracts the language from the URL path segment
- `useTranslations(lang)` returns a `t()` function for UI string lookup

### Adding Translations

1. Add key-value pairs to each language object in `src/i18n/ui.ts`
2. Use in Astro components: `const t = useTranslations(lang)`
3. TypeScript enforces all keys exist for the default language (English)

### Adding a Language

1. Add the locale code to `astro.config.mjs` `i18n.locales` array
2. Add the language entry to `languages` in `src/i18n/ui.ts`
3. Add all translation keys for the new language in the `ui` object

## React Islands

Interactive components that hydrate on the client. Static content uses Astro components.

**When to use an island vs Astro component:**

- **Island** (React): needs client-side interactivity (hover, click, state, animation), chart rendering with Visx
- **Astro component**: static content, layout, navigation, cards

**Adding an island:**

1. Create `src/components/islands/MyIsland.tsx` as a standard React component
2. Export from `src/components/islands/index.ts`
3. Use in Astro pages with a hydration directive: `<MyIsland client:visible />`

**Hydration directives:**

- `client:visible` — hydrate when scrolled into view (preferred for charts)
- `client:load` — hydrate immediately on page load
- `client:idle` — hydrate when browser is idle

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Custom theme tokens defined in `src/styles/global.css`
- Brand fonts: Inter (body), JetBrains Mono (code) — self-hosted woff2 in `public/fonts/`, preloaded in BaseLayout
- Color palette follows the design system: blue (CHANGE), orange (FLOW), red (FAILURE), green (VALUE)

### CSS Component Classes

Reusable classes defined in `src/styles/global.css` (inside `@layer components`):

| Class                | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `.btn`               | Base button — inline-flex, `px-4 py-2.5`, rounded-md, focus ring  |
| `.btn-primary`       | Blue background (`bg-brand-primary`), white text                  |
| `.btn-secondary`     | White background, neutral-900 text, neutral-300 border            |
| `.btn-outline`       | Transparent with neutral-300 border — use on light backgrounds    |
| `.btn-outline-light` | Transparent with white/30 border — use on dark backgrounds        |
| `.container-wide`    | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` — main content container |

Usage: `<a class="btn btn-primary" href="...">Get Started</a>`

### Mobile & Responsiveness

Foundations defined in `BaseLayout.astro` and `global.css`:

- **Viewport:** `width=device-width, initial-scale=1.0` + `<meta name="theme-color" content="#2563eb">`
- **Touch targets:** `--touch-target-min: 44px` CSS variable; base `.btn` uses `py-2.5` (~40px height), CTAs can override to `py-3` (44px+)
- **Overscroll:** `overscroll-behavior: none` on `body` prevents pull-to-refresh interference
- **Touch feedback:** `.touch-feedback` class applies `scale(0.97)` + blue tint on `:active` (touch devices)
- **Responsive card padding:** `p-6 md:p-8` pattern for content cards
- **Chart island heights:** 400px default (tool pages, learn pages); 500px for use-case pages

## Performance & Navigation

The website uses Astro's View Transitions to feel like a SPA while remaining a static MPA.

### View Transitions

`ClientRouter` is added in `BaseLayout.astro`, enabling cross-fade transitions between pages. Header and Footer use `transition:persist` so they stay mounted across navigations. The mobile menu script re-initializes on `astro:after-swap` because persisted scripts don't re-run automatically.

### Prefetching

`astro.config.mjs` sets `prefetch.defaultStrategy: 'hover'`. When a user hovers a link, Astro prefetches that page in the background so navigation feels near-instant.

### Loading Skeletons

`ChartContainer.tsx` renders a pulse-animated skeleton placeholder while a `ResizeObserver` measures the container width. Charts only render once width is known, preventing layout shifts.

### Accessibility

`BaseLayout.astro` includes a skip-to-content link that targets `id="main-content"` on `<main>`. Focus is managed after view transitions to ensure keyboard users land in the right place.

## Dependencies

### Workspace Packages

| Package             | Usage                                |
| ------------------- | ------------------------------------ |
| `@variscout/core`   | Glossary terms, types, tier system   |
| `@variscout/charts` | Visx chart components for live demos |
| `@variscout/data`   | Sample datasets for chart islands    |

### Key External Dependencies

| Package               | Version | Purpose                         |
| --------------------- | ------- | ------------------------------- |
| `astro`               | ^5.17   | Static site framework           |
| `react` / `react-dom` | ^19.0   | Island hydration                |
| `tailwindcss`         | ^4.1    | Utility-first CSS               |
| `@visx/*`             | ^3.12   | Low-level chart primitives      |
| `d3`                  | ^7.9    | Scale/math utilities for charts |
| `lucide-astro`        | ^0.556  | Icon library (Astro variant)    |

## Related Docs

- [Product documentation](../../docs/08-products/website/index.md)
- [User journeys & flows](../../docs/02-journeys/index.md)
- [Design system](../../docs/06-design-system/index.md)
- [Deployment guide](../../docs/05-technical/implementation/deployment.md)
