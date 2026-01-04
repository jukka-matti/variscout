# VariScout Lite

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm dev:excel       # Excel Add-in dev server (localhost:3000)
pnpm build           # Build all packages and apps
pnpm test            # Run Vitest tests
```

## Repository Structure

pnpm workspaces monorepo:

```
variscout-lite/
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, license, types
│   └── charts/        # @variscout/charts - Visx chart components
├── apps/
│   ├── pwa/           # PWA website (React + Vite)
│   └── excel-addin/   # Excel Add-in (Office.js + Fluent UI)
└── docs/
    ├── concepts/      # Strategic product decisions
    ├── design-system/ # Design tokens, components, charts
    ├── technical/     # Implementation guides
    └── products/      # Product-specific specs (PWA, Excel, Website, Power BI, Azure)
```

## Code Conventions

- **TypeScript** strict mode enabled
- **React** functional components with hooks
- **State**: Context API (DataContext.tsx) - no Redux
- **Styling**: Tailwind CSS (PWA), Fluent UI (Excel Add-in)
- **Charts**: Visx low-level primitives via @variscout/charts
- **Naming**: PascalCase components, `use` prefix hooks, camelCase utils

## Key Patterns

- **No Backend**: All processing in browser, data stays local
- **Shared Logic**: Statistics in `@variscout/core`, charts in `@variscout/charts`
- **Props-based Charts**: Chart components accept data via props (not context)
- **Persistence**: IndexedDB + localStorage (PWA), Custom Document Properties (Excel)
- **Offline-first**: PWA works without internet after first visit

## Editions

| Edition   | Branding              | Build Command              |
| --------- | --------------------- | -------------------------- |
| Community | "VariScout Lite"      | `pnpm build:pwa:community` |
| ITC       | "ITC" branding        | `pnpm build:pwa:itc`       |
| Licensed  | No branding (€49 key) | `pnpm build:pwa:licensed`  |

## Key Files

| File                                          | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `packages/core/src/stats.ts`                  | Statistics engine (mean, Cp, Cpk, conformance) |
| `packages/core/src/__tests__/stats.test.ts`   | Unit tests for statistics engine               |
| `packages/core/src/types.ts`                  | Shared TypeScript interfaces                   |
| `packages/core/src/navigation.ts`             | Navigation types and utilities                 |
| `packages/charts/src/`                        | IChart, Boxplot, ParetoChart, responsive utils |
| `apps/pwa/src/context/DataContext.tsx`        | Central state management                       |
| `apps/pwa/src/hooks/useDrillDown.ts`          | Drill-down navigation hook                     |
| `apps/pwa/src/components/DrillBreadcrumb.tsx` | Breadcrumb UI component                        |
| `apps/excel-addin/src/lib/stateBridge.ts`     | Excel state sync                               |
| `docs/concepts/LSS_TRAINER_STRATEGY.md`       | Green Belt training feature roadmap            |
| `docs/concepts/POWER_BI_STRATEGY.md`          | Power BI Custom Visual strategy                |
| `docs/concepts/SUBSCRIPTION_LICENSING.md`     | Paddle integration, license key system         |
| `docs/technical/`                             | PWA storage, deployment, testing strategy      |
| `docs/products/pwa/`                          | PWA product spec (licensing, storage, stack)   |
| `docs/products/website/`                      | Marketing website spec (design, copy, pages)   |
| `docs/products/excel/`                        | Excel Add-in spec                              |
| `docs/products/powerbi/`                      | Power BI custom visuals spec                   |
| `docs/products/azure/`                        | Azure team deployment spec (SharePoint, SSO)   |

> Use `Read` tool to examine these files when needed.

## Documentation

- `README.md` - Quick start
- `ARCHITECTURE.md` - Technical details
- `docs/MONOREPO_ARCHITECTURE.md` - Package structure
- `Specs.md` - Feature specifications
- `docs/design-system/` - **Design system** (colors, typography, components, charts)
- `docs/technical/` - **Technical specs** (storage, deployment)
- `docs/concepts/` - **Strategic decisions** (Excel, LSS, Power BI, Licensing)
- `docs/products/` - **Product specs** (PWA, Website, Excel, Power BI, Azure)
