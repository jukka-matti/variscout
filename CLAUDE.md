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
│   ├── flows/           # seo-learner, social-discovery, enterprise, return-visitor
│   └── use-cases/       # 13 strategic use cases with SEO keyword clusters
├── 03-features/         # Feature documentation
│   ├── index.md
│   ├── specifications.md
│   ├── user-guide.md
│   ├── analysis/        # boxplot, capability, i-chart, pareto, gage-rr, performance-mode,
│   │                    # nelson-rules, staged-analysis, probability-plot, regression
│   ├── workflows/       # four-pillars, drill-down, performance-mode, msa, quick-check,
│   │                    # deep-dive, decision-trees (analyst workflows & decision guides)
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
│   ├── architecture/    # offline-first, monorepo, shared-packages, data-flow, component-patterns
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
│   └── adr-001 through adr-007
├── 08-products/         # Product-specific specs
│   ├── index.md
│   ├── feature-parity.md # Platform × Feature availability matrix
│   ├── azure/           # index, marketplace, pricing-tiers, arm-template, msal-auth, onedrive-sync
│   ├── excel/           # index, architecture, design-system, strategy, appsource, license-detection
│   ├── pwa/             # index (demo tool), storage
│   ├── website/
│   └── powerbi/
└── archive/             # HISTORICAL ONLY — removed features, do not reference for current work
```

## Task-to-Documentation Mapping

| Task Type              | Read First                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- |
| Statistics/Cpk changes | docs/03-features/analysis/capability.md, packages/core/src/stats.ts           |
| Chart modifications    | docs/06-design-system/charts/, .claude/rules/charts.md                        |
| Excel Add-in work      | docs/08-products/excel/, .claude/rules/excel-addin.md                         |
| Azure app changes      | docs/08-products/azure/, packages/hooks/src/useDataState.ts                   |
| Adding new feature     | docs/07-decisions/ (check ADRs), docs/05-technical/                           |
| Parser/data input      | docs/03-features/data/data-input.md, packages/core/src/parser.ts              |
| Design system          | docs/06-design-system/foundations/, packages/ui/src/colors.ts                 |
| User personas          | docs/02-journeys/personas/, docs/01-vision/philosophy.md                      |
| Use cases / SEO        | docs/02-journeys/use-cases/                                                   |
| Performance Mode       | docs/03-features/analysis/performance-mode.md                                 |
| Testing                | docs/05-technical/implementation/testing.md, .claude/rules/testing.md         |
| Licensing/Tiers        | docs/07-decisions/adr-007-azure-marketplace-distribution.md                   |
| Deployment             | docs/05-technical/implementation/deployment.md                                |
| Website changes        | docs/08-products/website/, apps/website/README.md, .claude/rules/charts.md    |
| Nelson Rules/Runs      | docs/03-features/analysis/nelson-rules.md                                     |
| Staged Analysis        | docs/03-features/analysis/staged-analysis.md                                  |
| Probability Plots      | docs/03-features/analysis/probability-plot.md                                 |
| Data Flow/Architecture | docs/05-technical/architecture/data-flow.md                                   |
| Hook Integration       | docs/05-technical/architecture/component-patterns.md                          |
| Platform Comparison    | docs/08-products/feature-parity.md                                            |
| Analysis Workflows     | docs/03-features/workflows/ (four-pillars, drill-down, decision-trees)        |
| MSA/Gage R&R Study     | docs/03-features/workflows/msa-workflow.md                                    |
| Quick Analysis         | docs/03-features/workflows/quick-check.md, deep-dive.md                       |
| Drill-down workflow    | docs/03-features/workflows/drill-down-workflow.md                             |
| Four Pillars workflow  | docs/03-features/workflows/four-pillars-workflow.md                           |
| Decision trees         | docs/03-features/workflows/decision-trees.md                                  |
| Glossary/terminology   | packages/core/src/glossary/terms.ts, docs/03-features/learning/glossary.md    |
| Azure deployment/ARM   | docs/08-products/azure/marketplace.md, docs/08-products/azure/arm-template.md |
| Azure MSAL/auth        | docs/08-products/azure/msal-auth.md                                           |
| OneDrive sync          | docs/08-products/azure/onedrive-sync.md                                       |
| AppSource submission   | docs/08-products/excel/appsource.md                                           |
| UI components (modals) | docs/06-design-system/components/                                             |
| Color/typography       | docs/06-design-system/foundations/                                            |
| Case studies           | docs/04-cases/index.md                                                        |
| Product specs/tagline  | docs/03-features/specifications.md                                            |

## Repository Structure

pnpm workspaces monorepo:

```
variscout-lite/
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, tier, types
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

## Products & Pricing

| Product      | Distribution      | Pricing                                        | Status      |
| ------------ | ----------------- | ---------------------------------------------- | ----------- |
| Azure App    | Azure Marketplace | €150/month (Managed Application, all features) | **PRIMARY** |
| Excel Add-in | AppSource         | FREE (forever, core SPC only)                  | Production  |
| PWA          | Public URL        | FREE (forever, training & education)           | Production  |

See [ADR-007](docs/07-decisions/adr-007-azure-marketplace-distribution.md) for the distribution strategy.

## Key Files

| File                                                           | Purpose                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/core/src/stats.ts`                                   | Statistics engine (mean, Cp, Cpk, ANOVA, GageRR)                                 |
| `packages/core/src/__tests__/stats.test.ts`                    | Unit tests for statistics engine                                                 |
| `packages/core/src/types.ts`                                   | Shared TypeScript interfaces                                                     |
| `packages/core/src/navigation.ts`                              | Navigation types and utilities                                                   |
| `packages/core/src/tier.ts`                                    | Tier configuration (`getTier()`, `isPaidTier()`, channel limits)                 |
| `packages/core/src/edition.ts`                                 | Edition detection (deprecated, use tier.ts for new code)                         |
| `packages/hooks/src/useTier.ts`                                | React hook for tier state and limits                                             |
| `packages/ui/src/components/TierBadge/`                        | Tier indicator badge component                                                   |
| `packages/ui/src/components/UpgradePrompt/`                    | Upgrade call-to-action component                                                 |
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
