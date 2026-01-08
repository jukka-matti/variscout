# VariScout Lite

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm dev:excel       # Excel Add-in dev server (localhost:3000)
pnpm --filter @variscout/azure-app dev  # Azure app dev server

pnpm build           # Build all packages and apps
pnpm test            # Run Vitest tests (all packages)
pnpm --filter @variscout/core test      # Core package tests only
pnpm --filter @variscout/pwa test       # PWA tests only
pnpm --filter @variscout/azure-app test # Azure app tests only
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
│   ├── azure/         # Azure Team App (MSAL + OneDrive sync)
│   └── excel-addin/   # Excel Add-in (Office.js + Fluent UI)
└── docs/
    ├── cases/         # Case studies with demo data (coffee, packaging, avocado)
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

| File                                            | Purpose                                                   |
| ----------------------------------------------- | --------------------------------------------------------- |
| `packages/core/src/stats.ts`                    | Statistics engine (mean, Cp, Cpk, ANOVA, GageRR)          |
| `packages/core/src/__tests__/stats.test.ts`     | Unit tests for statistics engine                          |
| `packages/core/src/types.ts`                    | Shared TypeScript interfaces                              |
| `packages/core/src/navigation.ts`               | Navigation types and utilities                            |
| `packages/charts/src/`                          | IChart, Boxplot, ParetoChart, ScatterPlot, GageRRChart    |
| `apps/pwa/src/context/DataContext.tsx`          | Central state management                                  |
| `apps/pwa/src/components/__tests__/`            | Component tests (Dashboard, RegressionPanel, GageRRPanel) |
| `packages/core/src/parser.ts`                   | CSV/Excel parsing, validation, keyword detection (shared) |
| `apps/pwa/src/hooks/useDataIngestion.ts`        | File upload handlers, validation integration              |
| `apps/pwa/src/components/DataQualityBanner.tsx` | Validation summary UI component                           |
| `apps/pwa/src/hooks/useDrillDown.ts`            | Drill-down navigation hook                                |
| `apps/pwa/src/components/DrillBreadcrumb.tsx`   | Breadcrumb UI component                                   |
| `apps/azure/src/context/DataContext.tsx`        | Azure app central state (mirrors PWA)                     |
| `apps/azure/src/services/storage.ts`            | Offline-first storage + OneDrive sync                     |
| `apps/azure/src/components/__tests__/`          | Azure app component tests                                 |
| `apps/excel-addin/src/lib/stateBridge.ts`       | Excel state sync                                          |
| `docs/cases/`                                   | Case studies with demo data and teaching briefs           |
| `docs/concepts/LSS_TRAINER_STRATEGY.md`         | Green Belt training feature roadmap                       |
| `docs/concepts/POWER_BI_STRATEGY.md`            | Power BI Custom Visual strategy                           |
| `docs/concepts/SUBSCRIPTION_LICENSING.md`       | Paddle integration, license key system                    |
| `docs/concepts/FOUR_PILLARS_METHODOLOGY.md`     | Core methodology (Watson's Four Pillars)                  |
| `docs/concepts/TWO_VOICES_CONTROL_VS_SPEC.md`   | Control limits vs spec limits (Two Voices)                |
| `docs/concepts/CASE_BASED_LEARNING.md`          | Three-act case structure for learning                     |
| `docs/technical/TESTING_STRATEGY.md`            | Testing philosophy, coverage, patterns                    |
| `docs/technical/`                               | PWA storage, deployment, testing strategy                 |
| `docs/products/pwa/`                            | PWA product spec (licensing, storage, stack)              |
| `docs/products/website/`                        | Marketing website spec (design, copy, pages)              |
| `docs/products/excel/`                          | Excel Add-in spec                                         |
| `docs/products/powerbi/`                        | Power BI custom visuals spec                              |
| `docs/products/azure/`                          | Azure team deployment spec (SharePoint, SSO)              |

> Use `Read` tool to examine these files when needed.

## Documentation

- `README.md` - Quick start
- `ARCHITECTURE.md` - Technical details
- `docs/MONOREPO_ARCHITECTURE.md` - Package structure
- `Specs.md` - Feature specifications
- `docs/cases/` - **Case studies** (coffee, packaging, avocado - with demo data)
- `docs/design-system/` - **Design system** (colors, typography, components, charts)
- `docs/technical/` - **Technical specs** (storage, deployment, data input)
- `docs/technical/DATA_INPUT.md` - **Data input system** (parsing, validation, auto-mapping)
- `docs/concepts/` - **Strategic decisions** (Excel, LSS, Power BI, Licensing, Methodology)
- `docs/products/` - **Product specs** (PWA, Website, Excel, Power BI, Azure)
