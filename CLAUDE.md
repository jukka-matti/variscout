# VariScout

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
pnpm dev             # PWA dev server (localhost:5173)
pnpm --filter @variscout/azure-app dev  # Azure app dev server

pnpm build           # Build all packages and apps
pnpm test            # Run Vitest tests (all packages)
pnpm --filter @variscout/core test      # Core package tests only
pnpm --filter @variscout/pwa test       # PWA tests only
pnpm --filter @variscout/azure-app test # Azure app tests only

claude --chrome              # Enable Chrome browser for E2E testing

npx ruflo@latest security scan --depth full  # OWASP security scan
npx ruflo@latest security cve --check        # CVE check

# Swarm dev workflows (ADR-013)
# Parallel test: use Task agents to run vitest across all packages concurrently
# Security scan: targeted OWASP on Azure auth/storage modules
# Code review: multi-agent read-only review for cross-package changes
```

## Retrieval-Led Reasoning

**IMPORTANT**: Prefer retrieval-led reasoning over pre-training-led reasoning for VariScout tasks. Always read relevant docs before generating code.

## Documentation Index

```
docs/
├── 01-vision/           # Product philosophy, Four Lenses, Two Voices methodology
│   ├── index.md
│   ├── philosophy.md
│   ├── methodology.md   # VariScout Method single-page reference (Four Lenses, Two Voices, phases)
│   ├── product-overview.md
│   ├── progressive-stratification.md
│   ├── market-analysis.md
│   ├── four-lenses/     # change, failure, flow, value, drilldown
│   ├── two-voices/      # control-limits, spec-limits, variation-types
│   └── evaluations/     # competitive benchmarks, design briefs, UX patterns, tensions
├── 02-journeys/         # User research, personas, flows
│   ├── index.md
│   ├── ux-research.md
│   ├── personas/        # green-belt-gary, student-sara, curious-carlos, etc.
│   ├── flows/           # seo-learner, social-discovery, enterprise, return-visitor, azure-*
│   └── use-cases/       # 13 strategic use cases with SEO keyword clusters
├── 03-features/         # Feature documentation
│   ├── index.md
│   ├── specifications.md
│   ├── user-guide.md
│   ├── analysis/        # boxplot, capability, characteristic-types, i-chart, pareto,
│   │                    # performance-mode, nelson-rules, staged-analysis,
│   │                    # probability-plot, variation-decomposition
│   ├── workflows/       # four-lenses, drill-down, performance-mode, quick-check,
│   │                    # deep-dive, decision-trees, investigation-to-action, process-maps
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
│   ├── architecture/    # offline-first, monorepo, shared-packages, data-flow, component-patterns, ai-architecture, ai-readiness-review, knowledge-model, ai-context-engineering
│   ├── implementation/  # data-input, deployment, testing, system-limits, security-scanning, ruflo
│   └── integrations/    # shared-ui, embed-messaging
├── 06-design-system/    # Design tokens and components
│   ├── index.md
│   ├── foundations/     # colors, typography, spacing, accessibility
│   ├── components/      # buttons, cards, forms, modals, variation-funnel, what-if-simulator,
│   │                    # interaction-guidance, findings, ai-components
│   ├── charts/          # overview, ichart, boxplot, pareto, capability,
│   │                    # probability-plot, performance-mode, colors, hooks, responsive,
│   │                    # shared-components
│   └── patterns/        # layout, feedback, navigation
├── 07-decisions/        # Architecture Decision Records
│   ├── index.md
│   ├── adr-001 through adr-019
│   └── audit-2026-02-state-of-product.md
├── 08-products/         # Product-specific specs
│   ├── index.md
│   ├── feature-parity.md # Platform × Feature availability matrix
│   ├── azure/           # index, marketplace, pricing-tiers, arm-template, authentication,
│   │                    # onedrive-sync, how-it-works, submission-checklist
│   ├── pwa/             # index (demo tool), storage
│   ├── website/         # index, design-philosophy, content-architecture
│   └── powerbi/
└── archive/             # HISTORICAL ONLY — removed features, do not reference for current work

sales/                   # Sales leads and company contacts (not software docs)
```

## Task-to-Documentation Mapping

| Task Type                | Read First                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statistics/Cpk changes   | docs/03-features/analysis/capability.md, packages/core/src/stats.ts                                                                                   |
| Chart modifications      | docs/06-design-system/charts/, .claude/rules/charts.md                                                                                                |
| Azure app changes        | docs/08-products/azure/, packages/hooks/src/useDataState.ts                                                                                           |
| Adding new feature       | docs/07-decisions/ (check ADRs), docs/05-technical/                                                                                                   |
| Parser/data input        | docs/03-features/data/data-input.md, packages/core/src/parser.ts                                                                                      |
| Design system            | docs/06-design-system/foundations/, packages/ui/src/colors.ts                                                                                         |
| User personas            | docs/02-journeys/personas/, docs/01-vision/philosophy.md                                                                                              |
| Use cases / SEO          | docs/02-journeys/use-cases/                                                                                                                           |
| Performance Mode         | docs/03-features/analysis/performance-mode.md                                                                                                         |
| Testing (E2E/Chrome)     | docs/05-technical/implementation/testing.md Feature Verification Protocols                                                                            |
| Testing (Unit/Component) | docs/05-technical/implementation/testing.md, .claude/rules/testing.md                                                                                 |
| Licensing/Tiers          | docs/07-decisions/adr-007-azure-marketplace-distribution.md                                                                                           |
| Deployment               | docs/05-technical/implementation/deployment.md                                                                                                        |
| Website changes          | docs/08-products/website/, apps/website/README.md, .claude/rules/charts.md                                                                            |
| Website design           | docs/08-products/website/design-philosophy.md                                                                                                         |
| Website content arch     | docs/08-products/website/content-architecture.md, adr-008                                                                                             |
| Use case pages           | docs/08-products/website/content-architecture.md, apps/website/src/data/useCaseData.ts                                                                |
| Nelson Rules/Runs        | docs/03-features/analysis/nelson-rules.md                                                                                                             |
| Staged Analysis          | docs/03-features/analysis/staged-analysis.md                                                                                                          |
| Probability Plots        | docs/03-features/analysis/probability-plot.md                                                                                                         |
| Data Flow/Architecture   | docs/05-technical/architecture/data-flow.md                                                                                                           |
| Hook Integration         | docs/05-technical/architecture/component-patterns.md                                                                                                  |
| Platform Comparison      | docs/08-products/feature-parity.md                                                                                                                    |
| Analysis Workflows       | docs/03-features/workflows/ (four-lenses, drill-down, decision-trees)                                                                                 |
| Quick Analysis           | docs/03-features/workflows/quick-check.md, deep-dive.md                                                                                               |
| Drill-down workflow      | docs/03-features/workflows/drill-down-workflow.md                                                                                                     |
| Four Lenses workflow     | docs/03-features/workflows/four-lenses-workflow.md                                                                                                    |
| Decision trees           | docs/03-features/workflows/decision-trees.md                                                                                                          |
| Glossary/terminology     | packages/core/src/glossary/terms.ts, docs/03-features/learning/glossary.md                                                                            |
| Azure deployment/ARM     | docs/08-products/azure/marketplace.md, docs/08-products/azure/arm-template.md                                                                         |
| Azure auth (EasyAuth)    | docs/08-products/azure/authentication.md                                                                                                              |
| OneDrive sync            | docs/08-products/azure/onedrive-sync.md                                                                                                               |
| UI components (modals)   | docs/06-design-system/components/                                                                                                                     |
| Color/typography         | docs/06-design-system/foundations/                                                                                                                    |
| Case studies             | docs/04-cases/index.md                                                                                                                                |
| Product specs/tagline    | docs/03-features/specifications.md                                                                                                                    |
| Ruflo / AI tooling       | docs/07-decisions/adr-011-ai-development-tooling.md, docs/05-technical/implementation/ruflo.md                                                        |
| Statistics reference     | docs/05-technical/statistics-reference.md                                                                                                             |
| Investigation workflow   | docs/03-features/workflows/investigation-to-action.md                                                                                                 |
| Investigation tracking   | docs/07-decisions/adr-015-investigation-board.md, docs/03-features/workflows/investigation-to-action.md                                               |
| Characteristic types     | docs/03-features/analysis/characteristic-types.md, packages/core/src/types.ts                                                                         |
| Variation metrics/SS     | docs/03-features/analysis/variation-decomposition.md, packages/core/src/variation/contributions.ts                                                    |
| What-If/simulation       | docs/06-design-system/components/what-if-simulator.md, packages/core/src/variation/simulation.ts                                                      |
| Azure CI/CD pipeline     | `.github/workflows/deploy-azure-staging.yml`, `docs/05-technical/implementation/deployment.md`                                                        |
| Teams integration        | docs/07-decisions/adr-016-teams-integration.md, docs/08-products/azure/authentication.md                                                              |
| Teams SSO / OBO auth     | apps/azure/src/auth/graphToken.ts, docs/08-products/azure/authentication.md                                                                           |
| EXIF / photo security    | packages/core/src/utils/exifStrip.ts, docs/07-decisions/adr-021-security-evaluation.md                                                                |
| AI integration           | docs/07-decisions/adr-019-ai-integration.md, docs/05-technical/architecture/ai-architecture.md, docs/05-technical/architecture/ai-readiness-review.md |
| Knowledge model/glossary | docs/05-technical/architecture/knowledge-model.md, packages/core/src/glossary/, docs/03-features/learning/glossary.md                                 |
| AI context engineering   | docs/05-technical/architecture/ai-context-engineering.md, packages/core/src/ai/promptTemplates.ts                                                     |
| VariScout methodology    | docs/01-vision/methodology.md, docs/01-vision/philosophy.md, docs/01-vision/four-lenses/                                                              |
| AI components            | docs/06-design-system/components/ai-components.md, docs/03-features/workflows/ai-assisted-analysis.md                                                 |
| Findings UI              | docs/06-design-system/components/findings.md, docs/03-features/workflows/investigation-to-action.md                                                   |
| Investigation actions    | docs/07-decisions/adr-015-investigation-board.md, docs/03-features/workflows/investigation-to-action.md                                               |
| Hypothesis investigation | docs/03-features/workflows/hypothesis-investigation.md, docs/07-decisions/adr-020-investigation-workflow.md                                           |

## Repository Structure

pnpm workspaces monorepo:

```
variscout-lite/
├── .github/
│   └── workflows/     # GitHub Actions CI/CD (staging deploy)
├── packages/
│   ├── core/          # @variscout/core - Stats, parser, tier, types, findings, EXIF utils, AI (buildAIContext, prompt templates, insight builders)
│   ├── charts/        # @variscout/charts - Visx chart components
│   ├── data/          # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/         # @variscout/hooks - Shared React hooks (filter navigation, scale, tracking)
│   └── ui/            # @variscout/ui - Shared UI utilities, colors, and hooks
├── apps/
│   ├── pwa/           # PWA website (React + Vite)
│   ├── azure/         # Azure Team App (EasyAuth + OneDrive sync)
│   └── website/       # Marketing website (Astro + React Islands)
├── infra/             # ARM template (mainTemplate.json + createUiDefinition.json)
└── docs/              # Documentation (see index above)
```

## Code Conventions

- **TypeScript** strict mode enabled
- **React** functional components with hooks
- **State**: Context API (DataContext.tsx) - no Redux
- **Styling**: Tailwind CSS (PWA, Azure)
- **Charts**: Visx low-level primitives via @variscout/charts
- **Naming**: PascalCase components, `use` prefix hooks, camelCase utils

## Key Patterns

- **No Backend**: All processing in browser, data stays local
- **Shared Logic**: Statistics in `@variscout/core`, charts in `@variscout/charts`
- **Props-based Charts**: Chart components accept data via props (not context)
- **Persistence**: PWA = session-only (no persistence); Azure Standard = IndexedDB (local); Azure Team = IndexedDB + OneDrive sync
- **Offline-first**: PWA works without internet after first visit

## Products & Pricing

| Product        | Distribution      | Pricing    | Features                                               | Status      |
| -------------- | ----------------- | ---------- | ------------------------------------------------------ | ----------- |
| Azure Standard | Azure Marketplace | €99/month  | Full analysis, local file storage                      | **PRIMARY** |
| Azure Team     | Azure Marketplace | €199/month | + Teams, OneDrive, SharePoint, mobile, photos          | **PRIMARY** |
| Azure Team AI  | Azure Marketplace | €279/month | + AI Knowledge Base, AI-enhanced CoScout, org learning | **PRIMARY** |
| PWA            | Public URL        | FREE       | Training & education (forever free)                    | Production  |

See [ADR-007](docs/07-decisions/adr-007-azure-marketplace-distribution.md) for the distribution strategy.

## Key Files

| File                                                                 | Purpose                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/stats.ts`                                         | Statistics engine (mean, Cp, Cpk, ANOVA)                                                                                      |
| `packages/core/src/__tests__/stats.test.ts`                          | Unit tests for statistics engine                                                                                              |
| `packages/core/src/types.ts`                                         | Shared TypeScript interfaces                                                                                                  |
| `packages/core/src/navigation.ts`                                    | Navigation types and utilities                                                                                                |
| `packages/core/src/tier.ts`                                          | Tier configuration (`getTier()`, `isPaidTier()`, channel limits)                                                              |
| `packages/hooks/src/useTier.ts`                                      | React hook for tier state and limits                                                                                          |
| `packages/ui/src/components/TierBadge/`                              | Tier indicator badge component                                                                                                |
| `packages/ui/src/components/UpgradePrompt/`                          | Upgrade call-to-action component                                                                                              |
| `packages/charts/src/`                                               | IChart, Boxplot, ParetoChart                                                                                                  |
| `packages/charts/src/PerformanceIChart.tsx`                          | Multi-channel Cpk scatter plot (shared)                                                                                       |
| `packages/charts/src/PerformanceBoxplot.tsx`                         | Multi-channel distribution comparison (shared)                                                                                |
| `packages/charts/src/PerformancePareto.tsx`                          | Multi-channel Cpk ranking chart (shared)                                                                                      |
| `packages/charts/src/PerformanceCapability.tsx`                      | Single channel histogram (shared)                                                                                             |
| `packages/charts/src/colors.ts`                                      | Chart color constants (chartColors, chromeColors)                                                                             |
| `packages/data/src/`                                                 | Sample datasets with pre-computed stats and chart data                                                                        |
| `packages/data/src/samples/`                                         | Individual sample files (coffee, journey, bottleneck, sachets)                                                                |
| `packages/ui/src/colors.ts`                                          | Shared UI colors (statusColors)                                                                                               |
| `packages/ui/src/hooks/useMediaQuery.ts`                             | Responsive hooks (useIsMobile)                                                                                                |
| `packages/ui/src/components/HelpTooltip/`                            | Help tooltip component with CSS theming and "Learn more"                                                                      |
| `packages/ui/src/components/InvestigationPhaseBadge/`                | Colored phase badge (initial/diverging/validating/converging/acting)                                                          |
| `packages/ui/src/hooks/useGlossary.ts`                               | Hook for accessing glossary terms and definitions                                                                             |
| `packages/core/src/glossary/types.ts`                                | Glossary term type definitions (GlossaryTerm, etc.)                                                                           |
| `packages/core/src/glossary/terms.ts`                                | Glossary content (~20 terms for capability, statistics)                                                                       |
| `packages/hooks/src/useChartScale.ts`                                | Chart Y-axis scale calculation                                                                                                |
| `packages/hooks/src/useFilterNavigation.ts`                          | Filter navigation with multi-select, updateFilterValues(), removeFilter()                                                     |
| `packages/hooks/src/useDataIngestion.ts`                             | Shared file upload and data parsing                                                                                           |
| `packages/hooks/src/useVariationTracking.ts`                         | Cumulative Total SS scope tracking + filterChipData with contribution %                                                       |
| `packages/hooks/src/useKeyboardNavigation.ts`                        | Keyboard navigation (arrow keys, focus management)                                                                            |
| `packages/hooks/src/useResponsiveChartMargins.ts`                    | Dynamic chart margins based on container width                                                                                |
| `packages/hooks/src/useDataState.ts`                                 | Shared DataContext state (used by PWA & Azure)                                                                                |
| `packages/hooks/src/useBoxplotData.ts`                               | Shared boxplot d3 computation hook                                                                                            |
| `packages/hooks/src/useIChartData.ts`                                | Shared I-Chart data transform hook                                                                                            |
| `packages/hooks/src/useAnnotationMode.ts`                            | Chart annotation state (highlights, text notes, context menu)                                                                 |
| `packages/ui/src/components/CoScoutInline/`                          | CoScout inline conversation in FindingsPanel                                                                                  |
| `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`        | Shared message rendering (user/assistant bubbles, loading dots)                                                               |
| `packages/ui/src/components/ChartAnnotationLayer/`                   | Draggable text annotation overlay for charts                                                                                  |
| `packages/ui/src/components/AnnotationContextMenu/`                  | Right-click menu for chart annotations (highlight + add note)                                                                 |
| `packages/ui/src/components/DashboardBase/`                          | Shared dashboard building blocks (FocusedViewOverlay, FocusedChartCard, DashboardChartCard, DashboardGrid)                    |
| `apps/pwa/src/hooks/useDashboardCharts.ts`                           | PWA dashboard chart state                                                                                                     |
| `apps/azure/src/hooks/useDashboardCharts.ts`                         | Azure dashboard chart state (categoryContributions)                                                                           |
| `apps/pwa/src/context/DataContext.tsx`                               | Central state management                                                                                                      |
| `apps/pwa/src/context/ThemeContext.tsx`                              | Theme state (light/dark/system, company accent)                                                                               |
| `packages/charts/src/useChartTheme.ts`                               | Theme-aware chart colors hook                                                                                                 |
| `apps/pwa/src/components/__tests__/`                                 | Component tests (Dashboard)                                                                                                   |
| `packages/core/src/parser.ts`                                        | CSV/Excel parsing, validation, keyword detection (shared)                                                                     |
| `apps/pwa/src/hooks/useDataIngestion.ts`                             | PWA wrapper (adds loadSample to shared hook)                                                                                  |
| `packages/ui/src/components/DataQualityBanner/`                      | Shared validation summary UI component                                                                                        |
| `packages/ui/src/components/ColumnMapping/`                          | Shared column mapping UI component                                                                                            |
| `packages/ui/src/components/MeasureColumnSelector/`                  | Shared measure column selector                                                                                                |
| `packages/ui/src/components/PerformanceDetectedModal/`               | Shared wide-format detection modal                                                                                            |
| `apps/pwa/src/components/FilterBreadcrumb.tsx`                       | Filter chips UI component (multi-select, contribution %)                                                                      |
| `apps/pwa/src/components/MobileMenu.tsx`                             | Mobile navigation hamburger menu                                                                                              |
| `apps/pwa/src/components/PerformanceSetupPanel.tsx`                  | Setup panel for multi-measure analysis                                                                                        |
| `apps/pwa/src/components/PerformanceDashboard.tsx`                   | Performance Mode dashboard (Cp/Cpk toggle, drill navigation)                                                                  |
| `apps/pwa/src/components/Dashboard.tsx`                              | Main dashboard (drillFromPerformance, onBackToPerformance)                                                                    |
| `apps/pwa/src/components/views/`                                     | Extracted view components (chart containers)                                                                                  |
| `apps/azure/src/context/DataContext.tsx`                             | Azure app central state (mirrors PWA)                                                                                         |
| `apps/azure/src/services/storage.ts`                                 | StorageProvider singleton — offline-first storage, OneDrive sync, error classification, retry backoff                         |
| `apps/azure/src/components/__tests__/`                               | Azure app component tests                                                                                                     |
| `apps/azure/src/components/PerformanceDashboard.tsx`                 | Azure Performance Mode dashboard (Cp/Cpk toggle, drill navigation)                                                            |
| `apps/azure/src/components/DataPanel.tsx`                            | Azure data table panel (resizable, bi-directional sync)                                                                       |
| `apps/azure/src/auth/easyAuth.ts`                                    | EasyAuth helper (AuthError, refreshToken, proactive token refresh)                                                            |
| `apps/azure/src/components/SyncToast.tsx`                            | Sync notification toasts (success, error, auth prompt)                                                                        |
| `apps/azure/src/components/views/PresentationView.tsx`               | Presentation mode (full-screen chart overlay)                                                                                 |
| `apps/azure/src/hooks/useEditorPanels.ts`                            | Editor panel visibility + presentation mode state                                                                             |
| `apps/azure/src/components/FilterBreadcrumb.tsx`                     | Azure filter chips UI component                                                                                               |
| `apps/azure/src/components/FilterChips.tsx`                          | Azure active filter chips display                                                                                             |
| `packages/core/src/variation/simulation.ts`                          | What-If simulation (directAdjustment)                                                                                         |
| `packages/ui/src/components/WhatIfSimulator/`                        | WhatIfSimulator + WhatIfPageBase                                                                                              |
| `docs/03-features/workflows/investigation-to-action.md`              | 2-phase workflow: Findings → What-If                                                                                          |
| `packages/ui/src/components/AIOnboardingTooltip/`                    | AI onboarding tooltip (first-time "Ask" button hint)                                                                          |
| `packages/ui/src/components/FindingsWindow/InvestigationSidebar.tsx` | Investigation sidebar for FindingsWindow popout (phase, uncovered factors, suggested questions, Ask CoScout)                  |
| `packages/ui/src/components/FindingsLog/`                            | FindingsLog, FindingCard, FindingStatusBadge, FindingBoardView, FindingComments; FindingsWindow includes InvestigationSidebar |
| `packages/ui/src/components/FindingsLog/FindingBoardColumns.tsx`     | Horizontal drag-and-drop board for popout window                                                                              |
| `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx`      | Hypothesis tree view with collapsible nodes                                                                                   |
| `packages/ui/src/components/FindingsLog/HypothesisNode.tsx`          | Individual tree node component (status, badges, validation type)                                                              |
| `docs/04-cases/`                                                     | Case studies with demo data and teaching briefs                                                                               |
| `apps/azure/server.js`                                               | Zero-dep Node.js static server for App Service (SPA fallback, cache, /health)                                                 |
| `.github/workflows/deploy-azure-staging.yml`                         | CI/CD pipeline: build + OIDC deploy to staging App Service                                                                    |
| `infra/mainTemplate.json`                                            | ARM template for Azure Marketplace Managed Application deployment                                                             |
| `apps/azure/src/auth/graphToken.ts`                                  | OBO token exchange for Teams SSO (Graph API access)                                                                           |
| `infra/functions/token-exchange/index.js`                            | Azure Function for OBO token exchange (Teams SSO backend)                                                                     |
| `packages/core/src/utils/exifStrip.ts`                               | Byte-level EXIF/GPS metadata stripping for photo evidence                                                                     |
| `apps/azure/src/teams/teamsMedia.ts`                                 | Teams SDK camera wrapper (media.selectMedia)                                                                                  |
| `packages/core/src/preview.ts`                                       | Preview feature registry (localStorage toggle)                                                                                |
| `packages/core/src/ai/`                                              | AI module: buildAIContext, prompt templates, chart insight builders, suggested questions                                      |
| `packages/core/src/glossary/concepts.ts`                             | ~15 methodology concepts (Four Lenses, phases, principles) with typed relations                                               |
| `packages/core/src/glossary/knowledge.ts`                            | Unified knowledge lookup (getEntry, getRelated, getReferencedBy) across terms + concepts                                      |
| `apps/azure/src/services/aiService.ts`                               | AI Foundry integration: fetchNarration, fetchChartInsight, fetchCoScoutResponse/Streaming, localStorage cache                 |
| `apps/azure/src/services/searchService.ts`                           | AI Search client: searchRelatedFindings(), isKnowledgeBaseAvailable()                                                         |
| `packages/hooks/src/useNarration.ts`                                 | NarrativeBar state (loading, cached, error, refresh). Wraps fetchNarration                                                    |
| `packages/hooks/src/useChartInsights.ts`                             | Per-chart deterministic + AI-enhanced insight orchestration with debounced AI fallback                                        |
| `packages/hooks/src/useAICoScout.ts`                                 | CoScout conversation state, streaming, abort control                                                                          |

> Use `Read` tool to examine these files when needed.
