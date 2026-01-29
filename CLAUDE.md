# VariScout

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
│   ├── charts/        # @variscout/charts - Visx chart components
│   ├── data/          # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/         # @variscout/hooks - Shared React hooks (filter navigation, scale, tracking)
│   └── ui/            # @variscout/ui - Shared UI utilities, colors, and hooks
├── apps/
│   ├── pwa/           # PWA website (React + Vite)
│   ├── azure/         # Azure Team App (MSAL + OneDrive sync)
│   ├── website/       # Marketing website (Astro + React Islands)
│   └── excel-addin/   # Excel Add-in (Office.js + Fluent UI)
└── docs/
    ├── cases/         # Case studies with demo data (coffee, packaging, avocado, bottleneck, hospital-ward, machine-utilization)
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

| Edition   | Branding              | Theming                     | Build Command              |
| --------- | --------------------- | --------------------------- | -------------------------- |
| Community | "VariScout"           | Dark only                   | `pnpm build:pwa:community` |
| Licensed  | No branding (€99 key) | Light/Dark/System + Accents | `pnpm build:pwa:licensed`  |

## Key Files

| File                                                           | Purpose                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/core/src/stats.ts`                                   | Statistics engine (mean, Cp, Cpk, ANOVA, GageRR)                          |
| `packages/core/src/__tests__/stats.test.ts`                    | Unit tests for statistics engine                                          |
| `packages/core/src/types.ts`                                   | Shared TypeScript interfaces                                              |
| `packages/core/src/navigation.ts`                              | Navigation types and utilities                                            |
| `packages/charts/src/`                                         | IChart, Boxplot, ParetoChart, ScatterPlot, GageRRChart                    |
| `packages/charts/src/PerformanceIChart.tsx`                    | Multi-channel Cpk scatter plot (shared)                                   |
| `packages/charts/src/PerformanceBoxplot.tsx`                   | Multi-channel distribution comparison (shared)                            |
| `packages/charts/src/PerformancePareto.tsx`                    | Multi-channel Cpk ranking chart (shared)                                  |
| `packages/charts/src/PerformanceCapability.tsx`                | Single channel histogram (shared)                                         |
| `packages/charts/src/colors.ts`                                | Chart color constants (chartColors, chromeColors)                         |
| `packages/data/src/`                                           | Sample datasets with pre-computed stats and chart data                    |
| `packages/data/src/samples/`                                   | Individual sample files (coffee, journey, bottleneck, sachets)            |
| `packages/ui/src/colors.ts`                                    | Shared UI colors (gradeColors)                                            |
| `packages/ui/src/hooks/useMediaQuery.ts`                       | Responsive hooks (useIsMobile)                                            |
| `packages/ui/src/components/HelpTooltip/`                      | Help tooltip component with CSS theming and "Learn more"                  |
| `packages/ui/src/hooks/useGlossary.ts`                         | Hook for accessing glossary terms and definitions                         |
| `packages/core/src/glossary/types.ts`                          | Glossary term type definitions (GlossaryTerm, etc.)                       |
| `packages/core/src/glossary/terms.ts`                          | Glossary content (~20 terms for capability, statistics)                   |
| `apps/excel-addin/src/components/HelpTooltip.tsx`              | Fluent UI variant of HelpTooltip for Excel Add-in                         |
| `packages/hooks/src/useChartScale.ts`                          | Chart Y-axis scale calculation                                            |
| `packages/hooks/src/useFilterNavigation.ts`                    | Filter navigation with multi-select, updateFilterValues(), removeFilter() |
| `packages/hooks/src/useDataIngestion.ts`                       | Shared file upload and data parsing                                       |
| `packages/hooks/src/useVariationTracking.ts`                   | Cumulative η² tracking + filterChipData with contribution %               |
| `packages/hooks/src/useKeyboardNavigation.ts`                  | Keyboard navigation (arrow keys, focus management)                        |
| `packages/hooks/src/useResponsiveChartMargins.ts`              | Dynamic chart margins based on container width                            |
| `packages/hooks/src/useDataState.ts`                           | Shared DataContext state (used by PWA & Azure)                            |
| `apps/pwa/src/context/DataContext.tsx`                         | Central state management                                                  |
| `apps/pwa/src/context/ThemeContext.tsx`                        | Theme state (light/dark/system, company accent)                           |
| `packages/core/src/edition.ts`                                 | Edition detection, `isThemingEnabled()` feature gate                      |
| `packages/charts/src/useChartTheme.ts`                         | Theme-aware chart colors hook                                             |
| `apps/pwa/src/components/__tests__/`                           | Component tests (Dashboard, RegressionPanel, GageRRPanel)                 |
| `packages/core/src/parser.ts`                                  | CSV/Excel parsing, validation, keyword detection (shared)                 |
| `apps/pwa/src/hooks/useDataIngestion.ts`                       | PWA wrapper (adds loadSample to shared hook)                              |
| `packages/ui/src/components/DataQualityBanner/`                | Shared validation summary UI component                                    |
| `packages/ui/src/components/ColumnMapping/`                    | Shared column mapping UI component                                        |
| `packages/ui/src/components/MeasureColumnSelector/`            | Shared measure column selector                                            |
| `packages/ui/src/components/PerformanceDetectedModal/`         | Shared wide-format detection modal                                        |
| `apps/pwa/src/components/FilterBreadcrumb.tsx`                 | Filter chips UI component (multi-select, contribution %)                  |
| `apps/pwa/src/components/MobileMenu.tsx`                       | Mobile navigation hamburger menu                                          |
| `apps/pwa/src/components/FunnelPanel.tsx`                      | Variation funnel visualization panel                                      |
| `apps/pwa/src/components/VariationFunnel.tsx`                  | Funnel chart showing drill-down progress                                  |
| `apps/pwa/src/components/PerformanceSetupPanel.tsx`            | Setup panel for multi-measure analysis                                    |
| `apps/pwa/src/components/PerformanceDashboard.tsx`             | Performance Mode dashboard (Cp/Cpk toggle, drill navigation)              |
| `apps/pwa/src/components/Dashboard.tsx`                        | Main dashboard (drillFromPerformance, onBackToPerformance)                |
| `apps/pwa/src/components/views/`                               | Extracted view components (chart containers)                              |
| `apps/azure/src/context/DataContext.tsx`                       | Azure app central state (mirrors PWA)                                     |
| `apps/azure/src/services/storage.ts`                           | Offline-first storage + OneDrive sync                                     |
| `apps/azure/src/components/__tests__/`                         | Azure app component tests                                                 |
| `apps/azure/src/components/PerformanceDashboard.tsx`           | Azure Performance Mode dashboard (Cp/Cpk toggle, drill navigation)        |
| `apps/azure/src/components/DataPanel.tsx`                      | Azure data table panel (resizable, bi-directional sync)                   |
| `apps/azure/src/components/FilterBreadcrumb.tsx`               | Azure filter chips UI component                                           |
| `apps/azure/src/components/FilterChips.tsx`                    | Azure active filter chips display                                         |
| `apps/excel-addin/src/content/ContentPerformanceDashboard.tsx` | Excel Performance Mode dashboard (Cp/Cpk toggle, drill navigation)        |
| `apps/excel-addin/src/lib/stateBridge.ts`                      | Excel state sync                                                          |
| `docs/cases/`                                                  | Case studies with demo data and teaching briefs                           |
| `docs/concepts/LSS_TRAINER_STRATEGY.md`                        | Green Belt training feature roadmap                                       |
| `docs/concepts/POWER_BI_STRATEGY.md`                           | Power BI Custom Visual strategy                                           |
| `docs/concepts/licensing/OVERVIEW.md`                          | Paddle integration, license key system                                    |
| `docs/concepts/four-pillars/OVERVIEW.md`                       | Core methodology (Watson's Four Pillars)                                  |
| `docs/concepts/two-voices/OVERVIEW.md`                         | Control limits vs spec limits (Two Voices)                                |
| `docs/design-system/charts/hooks.md`                           | Chart hooks (useChartLayout, useChartTooltip, useSelectionState)          |
| `docs/design-system/charts/shared-components.md`               | Reusable chart components (SpecLimitLine, ChartTooltip, etc.)             |
| `docs/concepts/CASE_BASED_LEARNING.md`                         | Three-act case structure for learning                                     |
| `docs/technical/TESTING_STRATEGY.md`                           | Testing philosophy, coverage, patterns                                    |
| `docs/technical/`                                              | PWA storage, deployment, testing strategy                                 |
| `docs/products/pwa/`                                           | PWA product spec (licensing, storage, stack)                              |
| `docs/products/website/`                                       | Marketing website spec (design, copy, pages)                              |
| `docs/products/website/flows/OVERVIEW.md`                      | Website user flows overview (personas, architecture)                      |
| `docs/products/website/flows/1-SEO-LEARNER.md`                 | SEO → Tool → Product flow (Green Belt Gary)                               |
| `docs/products/website/flows/2-SOCIAL-DISCOVERY.md`            | Social → Case → Product flow (Curious Carlos)                             |
| `docs/products/website/flows/CONTENT-STRATEGY.md`              | 16-week content marketing campaign                                        |
| `docs/products/excel/`                                         | Excel Add-in spec                                                         |
| `docs/products/powerbi/`                                       | Power BI custom visuals spec                                              |
| `docs/products/azure/`                                         | Azure team deployment spec (SharePoint, SSO)                              |

> Use `Read` tool to examine these files when needed.

## Documentation

- `README.md` - Quick start
- `ARCHITECTURE.md` - Technical details
- `docs/MONOREPO_ARCHITECTURE.md` - Package structure
- `Specs.md` - Feature specifications
- `docs/cases/` - **Case studies** (coffee, packaging, avocado, bottleneck, hospital-ward, machine-utilization)
- `docs/design-system/` - **Design system** (colors, typography, components, charts)
- `docs/design-system/ACCESSIBILITY.md` - **Accessibility** (WCAG AA, keyboard navigation, screen readers)
- `docs/technical/` - **Technical specs** (storage, deployment, data input)
- `docs/technical/DATA_INPUT.md` - **Data input system** (parsing, validation, auto-mapping)
- `docs/technical/ADR.md` - **Architecture Decision Records** (key technical decisions)
- `docs/technical/DEPLOYMENT.md` - **Deployment** (CI/CD, build commands, environments)
- `docs/flows/ERROR-HANDLING.md` - **Error handling** (validation, recovery patterns)
- `docs/concepts/` - **Strategic decisions** (Excel, LSS, Power BI, Licensing, Methodology)
- `docs/products/` - **Product specs** (PWA, Website, Excel, Power BI, Azure)
