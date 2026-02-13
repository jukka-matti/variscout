# Marketing Website

The variscout.com website serves three strategic purposes: **lead generation** through SEO-optimized educational content, **product education** through interactive chart demos, and **conversion** by funneling visitors toward the PWA (free), Excel Add-in (free), and Azure App (paid).

---

## Overview

The website is the top of the VaRiScout funnel. It targets quality professionals, Lean Six Sigma learners, and operations managers searching for variation analysis tools and SPC concepts.

| Purpose           | How                                                              |
| ----------------- | ---------------------------------------------------------------- |
| Lead generation   | Tool pages, glossary, and learn topics rank for SPC search terms |
| Product education | Live Visx chart demos show VaRiScout in action without signup    |
| Conversion        | Every page funnels toward "Try Now" CTA linking to the PWA       |

The website does **not** contain the application itself. The PWA, Excel Add-in, and Azure App are separate products with their own codebases and deployment.

---

## Technology Stack

| Component   | Technology                   | Why                                                           |
| ----------- | ---------------------------- | ------------------------------------------------------------- |
| Framework   | Astro 5                      | Static HTML + selective hydration = fast page loads, good SEO |
| Interactive | React 19 Islands             | Only chart demos need client-side JS                          |
| Styling     | Tailwind CSS v4              | Utility-first, consistent with PWA/Azure design tokens        |
| Charts      | Visx (via @variscout/charts) | Same chart components used in the real product                |
| Icons       | lucide-astro                 | Lightweight, tree-shakeable                                   |
| Hosting     | Vercel                       | Auto-deploy on push to main, global CDN                       |

---

## Architecture: Astro Islands

The website is primarily static HTML. React only loads for interactive chart demos.

```
Page request
  └─ Astro renders static HTML (Header, Hero, content, Footer)
       └─ React islands hydrate when scrolled into view (client:visible)
            └─ IChartIsland, BoxplotIsland, ParetoIsland, etc.
                 └─ Use @variscout/charts + @variscout/data for live demos
```

**9 React islands:** IChartIsland, BoxplotIsland, ParetoIsland, StatsIsland, PerformanceDemo, ToolChartIsland, CaseStudyChartsIsland, GlossaryTooltipIsland, ChartContainer

**23 Astro components:** Header, Footer, Hero, FourPillars, PricingCard, ProductCard, UseCaseCard, FeatureCard, and more (static, zero JS)

---

## Internationalization (i18n)

Five languages with locale-prefixed routing:

| Language          | Prefix | Example             |
| ----------------- | ------ | ------------------- |
| English (default) | none   | `/tools/i-chart`    |
| German            | `/de`  | `/de/tools/i-chart` |
| Spanish           | `/es`  | `/es/tools/i-chart` |
| French            | `/fr`  | `/fr/tools/i-chart` |
| Portuguese        | `/pt`  | `/pt/tools/i-chart` |

Configured in `astro.config.mjs` with `prefixDefaultLocale: false`. Translation strings live in `src/i18n/ui.ts` (~170 lines covering nav, footer, glossary UI).

---

## Page Inventory

| Route template            | Dynamic data source           | Pages per lang | Total (5 langs) |
| ------------------------- | ----------------------------- | -------------- | --------------- |
| `[lang]/index`            | -                             | 1              | 5               |
| `[lang]/pricing`          | -                             | 1              | 5               |
| `[lang]/journey`          | -                             | 1              | 5               |
| `[lang]/product/compare`  | -                             | 1              | 5               |
| `[lang]/product/[slug]`   | hardcoded slugs               | ~3             | ~15             |
| `[lang]/use-cases/[slug]` | hardcoded slugs               | ~4             | ~20             |
| `[lang]/tools/[tool]`     | `toolsData.ts` (7 tools)      | 7              | 35              |
| `[lang]/learn/[topic]`    | `learnData.ts` (10 topics)    | 10             | 50              |
| `[lang]/cases/[slug]`     | case data                     | varies         | varies          |
| `[lang]/glossary/[term]`  | `glossaryData.ts` (~26 terms) | ~26            | ~130            |
| `[lang]/glossary/index`   | -                             | 1              | 5               |
| Static pages              | -                             | 7              | 7               |

**Static pages** (not localized): `/`, `/404`, `/app`, `/about`, `/contact`, `/resources/tutorials`, `/resources/sample-data`, `/legal/privacy`, `/legal/terms`

---

## Content Architecture

All content is managed through three TypeScript data files (no CMS, no Markdown):

| File              | Interface          | Items | Content                                                                                              |
| ----------------- | ------------------ | ----- | ---------------------------------------------------------------------------------------------------- |
| `toolsData.ts`    | `ToolData`         | 7     | Tool name, pillar, hero, when-to-use, data requirements, how-to-read, patterns, features, sample key |
| `learnData.ts`    | `LearnTopic`       | 10    | Topic title, sections with visuals (comparison, diagram, list, quote, chart)                         |
| `glossaryData.ts` | `GlossaryPageData` | ~26   | Extends `@variscout/core` glossary with SEO metadata, rich sections, practical tips                  |

Each file exports helper functions (`getToolBySlug()`, `getLearnTopicBySlug()`, `getGlossaryPageData()`) used by dynamic route pages for static generation.

---

## Product Funnel

```
Search / Social / Referral
    │
    ▼
  Website (variscout.com)
  ├── Tool pages ──────── "Try this chart" ──► PWA (free, instant)
  ├── Learn topics ─────── "Practice now" ──► PWA (free, instant)
  ├── Glossary ──────────── Cross-links ──► Tool & Learn pages
  ├── Case studies ───── "See it in action" ──► PWA (free, instant)
  ├── Use cases ────── "For your workflow" ──► Product pages
  └── Pricing ────────── "Get started" ──► Azure Marketplace / AppSource
```

Every page includes a CTA. Tool and learn pages link to the free PWA for immediate engagement. Pricing and product pages link to the Azure Marketplace (paid) and AppSource (free Excel Add-in).

---

## User Journeys

The website supports five primary visitor flows:

| Journey          | Entry                      | Path                         | Goal                    |
| ---------------- | -------------------------- | ---------------------------- | ----------------------- |
| SEO Learner      | Google search for SPC term | Tool/glossary/learn page     | Try PWA                 |
| Social Discovery | LinkedIn/social share      | Case study                   | Explore tools           |
| Enterprise       | Referral/direct            | Product comparison + pricing | Azure signup            |
| Content          | YouTube/blog link          | Learn topic                  | Engage with methodology |
| Return Visitor   | Direct URL                 | PWA/app page                 | Use product             |

See [User Journeys](../../02-journeys/index.md) and [Flow Documentation](../../02-journeys/flows/) for details.

---

## SEO Implementation

`BaseLayout.astro` provides SEO infrastructure for every page:

- **Meta tags:** title, description, canonical URL (per-page)
- **Open Graph:** og:title, og:description, og:image, og:locale (per language)
- **Twitter Cards:** summary_large_image with per-page content
- **Schema.org:** `SoftwareApplication` structured data with pricing (Free web/Excel, 150/month Azure)
- **Sitemap:** auto-generated via `@astrojs/sitemap` integration
- **Canonical URLs:** resolve to `https://variscout.com` with correct locale paths
- **Self-hosted fonts:** woff2 files in `public/fonts/` (GDPR-clean — no requests to Google)

---

## Performance

| Feature            | Implementation                        | Benefit                                         |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| View Transitions   | `ClientRouter` in BaseLayout          | Smooth cross-fade navigation, no white flash    |
| Prefetching        | `hover` strategy in astro.config      | Near-instant page loads after hover             |
| Deferred hydration | `client:visible` on all chart islands | JS loads only when scrolled into view           |
| Loading skeletons  | Pulse animation in ChartContainer     | No blank-box flash before charts render         |
| Self-hosted fonts  | woff2 in `public/fonts/`              | GDPR-clean, faster (same-origin), works offline |
| Skip-to-content    | Accessible skip link in BaseLayout    | WCAG 2.1 AA keyboard navigation                 |

---

## Deployment

| Setting               | Value                            |
| --------------------- | -------------------------------- |
| Host                  | Vercel                           |
| Deploy trigger        | Push to `main` branch            |
| Build command         | `astro build`                    |
| Output                | Static files (no server runtime) |
| Environment variables | None required                    |
| Domain                | variscout.com                    |

The website is fully static. No server-side code, no database, no environment variables needed at runtime.

---

## See Also

- [Website README](../../../apps/website/README.md) (developer guide)
- [User Journeys](../../02-journeys/index.md)
- [Design System](../../06-design-system/index.md)
- [Deployment Guide](../../05-technical/implementation/deployment.md)
- [Feature Parity Matrix](../feature-parity.md)
