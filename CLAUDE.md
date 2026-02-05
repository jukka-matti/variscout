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

npx claude-flow@v3alpha security scan --depth full  # OWASP security scan
npx claude-flow@v3alpha security cve --check        # CVE check
```

## Retrieval-Led Reasoning

**IMPORTANT**: Prefer retrieval-led reasoning over pre-training-led reasoning for VariScout tasks. Always read relevant docs before generating code.

## Documentation Index

```
docs/
├── 01-vision/           # Product philosophy, Four Pillars, Two Voices methodology
│   ├── index.md
│   ├── philosophy.md
│   ├── product-overview.md
│   ├── four-pillars/    # change, failure, flow, value, drilldown
│   └── two-voices/      # control-limits, spec-limits, variation-types
├── 02-journeys/         # User research, personas, flows
│   ├── index.md
│   ├── ux-research.md
│   ├── personas/        # green-belt-gary, student-sara, curious-carlos, etc.
│   └── flows/           # seo-learner, social-discovery, enterprise, return-visitor
├── 03-features/         # Feature documentation
│   ├── index.md
│   ├── specifications.md
│   ├── user-guide.md
│   ├── analysis/        # boxplot, capability, i-chart, pareto, gage-rr, performance-mode
│   ├── data/            # data-input, storage, validation
│   ├── navigation/      # drill-down, breadcrumbs, linked-filtering
│   └── learning/        # case-based-learning, glossary, help-tooltips
├── 04-cases/            # Case studies with demo data
│   ├── coffee/
│   ├── packaging/
│   ├── avocado/
│   ├── bottleneck/
│   ├── hospital-ward/
│   ├── machine-utilization/
│   └── oven-zones/
├── 05-technical/        # Technical architecture
│   ├── index.md
│   ├── architecture.md
│   ├── architecture/    # offline-first, monorepo, shared-packages
│   ├── implementation/  # data-input, deployment, testing
│   └── integrations/    # shared-ui, embed-messaging
├── 06-design-system/    # Design tokens and components
│   ├── index.md
│   ├── foundations/     # colors, typography, spacing, accessibility
│   ├── components/      # buttons, cards, forms, modals, variation-funnel
│   ├── charts/          # overview, boxplot, capability, pareto, hooks, responsive
│   └── patterns/        # layout, feedback, navigation
├── 07-decisions/        # Architecture Decision Records
│   ├── index.md
│   └── adr-001 through adr-006
├── 08-products/         # Product-specific specs
│   ├── index.md
│   ├── pwa/             # index, licensing, storage
│   ├── excel/           # index, architecture, design-system, strategy
│   ├── azure/           # index, msal-auth, onedrive-sync
│   ├── website/
│   └── powerbi/
└── archive/             # Historical implementation docs
```

## Task-to-Documentation Mapping

| Task Type              | Read First                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| Statistics/Cpk changes | docs/03-features/analysis/capability.md, packages/core/src/stats.ts   |
| Chart modifications    | docs/06-design-system/charts/, .claude/rules/charts.md                |
| Excel Add-in work      | docs/08-products/excel/, .claude/rules/excel-addin.md                 |
| Azure app changes      | docs/08-products/azure/, packages/hooks/src/useDataState.ts           |
| Adding new feature     | docs/07-decisions/ (check ADRs), docs/05-technical/                   |
| Parser/data input      | docs/03-features/data/data-input.md, packages/core/src/parser.ts      |
| Design system          | docs/06-design-system/foundations/, packages/ui/src/colors.ts         |
| User personas          | docs/02-journeys/personas/, docs/01-vision/philosophy.md              |
| Performance Mode       | docs/03-features/analysis/performance-mode.md                         |
| Testing                | docs/05-technical/implementation/testing.md, .claude/rules/testing.md |

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
└── docs/              # Documentation (see index above)
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

| Edition   | Branding              | Theming                                | Build Command              |
| --------- | --------------------- | -------------------------------------- | -------------------------- |
| Community | "VariScout"           | Dark only                              | `pnpm build:pwa:community` |
| Licensed  | No branding (€99 key) | Light/Dark/System + Accents (PWA only) | `pnpm build:pwa:licensed`  |

> **Note**: Theme customization requires PWA installation (Add to Home Screen) plus a valid license key.

## Key Files

| File                                                           | Purpose                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/core/src/stats.ts`                                   | Statistics engine (mean, Cp, Cpk, ANOVA, GageRR)                                 |
| `packages/core/src/__tests__/stats.test.ts`                    | Unit tests for statistics engine                                                 |
| `packages/core/src/types.ts`                                   | Shared TypeScript interfaces                                                     |
| `packages/core/src/navigation.ts`                              | Navigation types and utilities                                                   |
| `packages/charts/src/`                                         | IChart, Boxplot, ParetoChart, ScatterPlot, GageRRChart                           |
| `packages/charts/src/PerformanceIChart.tsx`                    | Multi-channel Cpk scatter plot (shared)                                          |
| `packages/charts/src/PerformanceBoxplot.tsx`                   | Multi-channel distribution comparison (shared)                                   |
| `packages/charts/src/PerformancePareto.tsx`                    | Multi-channel Cpk ranking chart (shared)                                         |
| `packages/charts/src/PerformanceCapability.tsx`                | Single channel histogram (shared)                                                |
| `packages/charts/src/colors.ts`                                | Chart color constants (chartColors, chromeColors)                                |
| `packages/data/src/`                                           | Sample datasets with pre-computed stats and chart data                           |
| `packages/data/src/samples/`                                   | Individual sample files (coffee, journey, bottleneck, sachets)                   |
| `packages/ui/src/colors.ts`                                    | Shared UI colors (gradeColors)                                                   |
| `packages/ui/src/hooks/useMediaQuery.ts`                       | Responsive hooks (useIsMobile)                                                   |
| `packages/ui/src/components/HelpTooltip/`                      | Help tooltip component with CSS theming and "Learn more"                         |
| `packages/ui/src/hooks/useGlossary.ts`                         | Hook for accessing glossary terms and definitions                                |
| `packages/core/src/glossary/types.ts`                          | Glossary term type definitions (GlossaryTerm, etc.)                              |
| `packages/core/src/glossary/terms.ts`                          | Glossary content (~20 terms for capability, statistics)                          |
| `apps/excel-addin/src/components/HelpTooltip.tsx`              | Fluent UI variant of HelpTooltip for Excel Add-in                                |
| `packages/hooks/src/useChartScale.ts`                          | Chart Y-axis scale calculation                                                   |
| `packages/hooks/src/useFilterNavigation.ts`                    | Filter navigation with multi-select, updateFilterValues(), removeFilter()        |
| `packages/hooks/src/useDataIngestion.ts`                       | Shared file upload and data parsing                                              |
| `packages/hooks/src/useVariationTracking.ts`                   | Cumulative η² tracking + filterChipData with contribution %                      |
| `packages/hooks/src/useKeyboardNavigation.ts`                  | Keyboard navigation (arrow keys, focus management)                               |
| `packages/hooks/src/useResponsiveChartMargins.ts`              | Dynamic chart margins based on container width                                   |
| `packages/hooks/src/useDataState.ts`                           | Shared DataContext state (used by PWA & Azure)                                   |
| `apps/pwa/src/context/DataContext.tsx`                         | Central state management                                                         |
| `apps/pwa/src/context/ThemeContext.tsx`                        | Theme state (light/dark/system, company accent)                                  |
| `packages/core/src/edition.ts`                                 | Edition detection, `isThemingEnabled()` feature gate                             |
| `packages/charts/src/useChartTheme.ts`                         | Theme-aware chart colors hook                                                    |
| `apps/pwa/src/components/__tests__/`                           | Component tests (Dashboard, RegressionPanel, GageRRPanel)                        |
| `packages/core/src/parser.ts`                                  | CSV/Excel parsing, validation, keyword detection (shared)                        |
| `apps/pwa/src/hooks/useDataIngestion.ts`                       | PWA wrapper (adds loadSample to shared hook)                                     |
| `packages/ui/src/components/DataQualityBanner/`                | Shared validation summary UI component                                           |
| `packages/ui/src/components/ColumnMapping/`                    | Shared column mapping UI component                                               |
| `packages/ui/src/components/MeasureColumnSelector/`            | Shared measure column selector                                                   |
| `packages/ui/src/components/PerformanceDetectedModal/`         | Shared wide-format detection modal                                               |
| `apps/pwa/src/components/FilterBreadcrumb.tsx`                 | Filter chips UI component (multi-select, contribution %)                         |
| `apps/pwa/src/components/MobileMenu.tsx`                       | Mobile navigation hamburger menu                                                 |
| `apps/pwa/src/components/FunnelPanel.tsx`                      | Variation funnel visualization panel                                             |
| `apps/pwa/src/components/VariationFunnel.tsx`                  | Funnel chart showing drill-down progress                                         |
| `apps/pwa/src/components/PerformanceSetupPanel.tsx`            | Setup panel for multi-measure analysis                                           |
| `apps/pwa/src/components/PerformanceDashboard.tsx`             | Performance Mode dashboard (Cp/Cpk toggle, drill navigation)                     |
| `apps/pwa/src/components/Dashboard.tsx`                        | Main dashboard (drillFromPerformance, onBackToPerformance)                       |
| `apps/pwa/src/components/views/`                               | Extracted view components (chart containers)                                     |
| `apps/azure/src/context/DataContext.tsx`                       | Azure app central state (mirrors PWA)                                            |
| `apps/azure/src/services/storage.ts`                           | Offline-first storage + OneDrive sync                                            |
| `apps/azure/src/components/__tests__/`                         | Azure app component tests                                                        |
| `apps/azure/src/components/PerformanceDashboard.tsx`           | Azure Performance Mode dashboard (Cp/Cpk toggle, drill navigation)               |
| `apps/azure/src/components/DataPanel.tsx`                      | Azure data table panel (resizable, bi-directional sync)                          |
| `apps/azure/src/components/FilterBreadcrumb.tsx`               | Azure filter chips UI component                                                  |
| `apps/azure/src/components/FilterChips.tsx`                    | Azure active filter chips display                                                |
| `apps/excel-addin/src/content/ContentPerformanceDashboard.tsx` | Excel Performance Mode (Cpk target input, control-based coloring, Cp/Cpk toggle) |
| `apps/excel-addin/src/lib/stateBridge.ts`                      | Excel state sync with Custom Document Properties                                 |
| `docs/04-cases/`                                               | Case studies with demo data and teaching briefs                                  |

> Use `Read` tool to examine these files when needed.
