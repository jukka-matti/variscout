# Monorepo Rules

## Architecture

DDD-lite with Feature-Sliced Design ([ADR-045](../../docs/07-decisions/adr-045-modular-architecture.md)):
- **Domain layer** (`@variscout/core`) — pure TypeScript, no React
- **Orchestration layer** (`@variscout/hooks`) — React hooks, data pipeline
- **Presentation layer** (`@variscout/ui`, `@variscout/charts`) — props-based components
- **Apps layer** — Azure (Feature-Sliced + Zustand), PWA (Context, flat)

Dependencies flow strictly downward. Packages never import apps.

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic, glossary, tier system, i18n (no React)
├── charts/    # @variscout/charts - React + Visx (standard + Performance + Yamazumi charts), useChartTheme
├── data/      # @variscout/data - Sample datasets with pre-computed chart data
├── stores/    # @variscout/stores - 4 Zustand domain stores (project, investigation, improvement, session)
│              #   Source of truth for all app state. Components read via selectors.
│              #   investigationStore includes CausalLink entity. sessionStore auto-persists to IndexedDB.
├── hooks/     # @variscout/hooks - 60+ shared React hooks (ls packages/hooks/src/use*.ts for full list)
│              #   Key hooks: useFilteredData, useAnalysisStats, useProjectActions,
│              #   useEvidenceMapData, useAICoScout, usePopoutChannel,
│              #   useQuestions, useFindings, useProblemStatement,
│              #   useHubComputations, useCoScoutProps, useImprovementProjections,
│              #   useScopedModels, useWhatIfReferences
└── ui/        # @variscout/ui - 110+ shared UI components (ls packages/ui/src/components/ for full list)
               #   Key: DashboardLayoutBase, CoScoutPanelBase, ImprovementWorkspaceBase,
               #   ReportViewBase, FindingsWindow, HubComposer, EvidenceMapNodeSheet,
               #   WhatIfExplorer, WhatIfExplorerPage
               #   Store-aware PI Panel tabs: StatsTabContent, QuestionsTabContent, JournalTabContent
               #   Also exports: useGlossary, useIsMobile, useTheme, errorService, BREAKPOINTS

apps/
├── pwa/          # @variscout/pwa - PWA website
├── azure/        # @variscout/azure-app - Azure Team App (Feature-Sliced Design)
│              #   features/ - 6 feature modules with co-located stores:
│              #     findings/, investigation/, improvement/, ai/, data-flow/, panels/
│              #   hooks/ - useProjectLoader, useProjectOverview
│              #   components/ - ProjectDashboard, ProjectCard, editor/InvestigationWorkspace
└── website/      # @variscout/website - Marketing website (Astro + React Islands)
```

## Tailwind v4 `@source` (Critical)

Tailwind v4 (`@tailwindcss/vite`) does not reliably auto-scan linked workspace packages in a pnpm monorepo. Each app's CSS entry point **must** declare `@source` directives for shared packages, or responsive utility classes (`lg:grid`, `md:flex-row`, etc.) from those packages will be silently missing.

```css
/* Required in apps/pwa/src/index.css and apps/azure/src/index.css */
@import 'tailwindcss';

@source "../../../packages/ui/src/**/*.tsx";
@source "../../../packages/charts/src/**/*.tsx";
@source "../../../packages/hooks/src/**/*.ts";
```

When adding a new shared package that uses Tailwind classes, add a corresponding `@source` directive to each app's CSS.

## Import Rules

- Apps import from packages: `import { calculateStats } from '@variscout/core'`
- Packages never import from apps
- `@variscout/core` has no React dependencies (exports stats, parser, glossary, tier)
- `@variscout/charts` depends on `@variscout/core`
- `@variscout/hooks` depends on `@variscout/core` (for types, utilities, and tier)
- `@variscout/ui` — 110+ components + `useGlossary`, `useIsMobile`, `useTheme`, `errorService`, `BREAKPOINTS`
- `@variscout/ui` depends on `@variscout/stores` for store-aware tab content components (`StatsTabContent`, `QuestionsTabContent`, `JournalTabContent`). This is acceptable because stores are shared infrastructure. Props-based components remain preferred for purely presentational UI.

## @variscout/core Sub-Path Exports

The core package supports granular sub-path imports (in addition to the root `@variscout/core` import):

| Import Path | Module | Key Exports |
|-------------|--------|-------------|
| `@variscout/core` | Root barrel | Everything (backwards compatible) |
| `@variscout/core/stats` | stats/ | calculateStats, calculateAnova, calculateBoxplotStats, calculateKDE, lttb, predictFromModel, computeCoverage |
| `@variscout/core/ai` | ai/ | responsesApi, buildAIContext, actionTools, chartInsights |
| `@variscout/core/parser` | parser/ | parseText, detectColumns, validateData |
| `@variscout/core/findings` | findings/ | Finding types, factories, helpers, migration, computeHubProjection, detectEvidenceClusters |
| `@variscout/core/variation` | variation/ | Variation tracking, simulation, suggestions |
| `@variscout/core/yamazumi` | yamazumi/ | Yamazumi aggregation, classification, detection |
| `@variscout/core/tier` | tier.ts | configureTier, getTier, isPaidTier, feature gates |
| `@variscout/core/types` | types.ts | All TypeScript domain types |
| `@variscout/core/i18n` | i18n/ | registerLocaleLoaders, preloadLocale, getMessage, formatMessage |
| `@variscout/core/glossary` | glossary/ | Knowledge model, term definitions |
| `@variscout/core/export` | export.ts | CSV export, PDF metadata |
| `@variscout/core/navigation` | navigation.ts | Navigation utilities |
| `@variscout/core/responsive` | responsive.ts | getResponsiveMargins, getResponsiveFonts, getResponsiveTickCount |
| `@variscout/core/performance` | performance.ts | Multi-measure performance analysis |
| `@variscout/core/time` | time.ts | Time column detection and extraction |
| `@variscout/core/projectMetadata` | projectMetadata.ts | Project metadata computation (phase, findings summary, timestamps) |
| `@variscout/core/strategy` | analysisStrategy.ts | resolveMode, getStrategy, AnalysisModeStrategy (ADR-047) |
| `@variscout/core/ui-types` | ui-types/ | DisplayOptions, ScaleMode, HighlightColor, ViewState, ChartTitles, AxisSettings, ParetoMode, ParetoAggregation |
| `@variscout/core/evidenceMap` | evidenceMap/ | FactorNodeData, RelationshipEdgeData, OutcomeNodeData, EquationData, CausalEdgeData, ConvergencePointData, RelationshipType |

Apps must call `registerLocaleLoaders()` at startup to provide bundler-specific locale loading (see app `main.tsx` files).

## Build Commands

```bash
pnpm build              # Build all
pnpm --filter @variscout/pwa build    # Build specific package
pnpm -r build           # Build recursively
```

## Adding Dependencies

- Root devDependencies: Shared tooling (TypeScript, ESLint)
- Package dependencies: Package-specific needs
- Use `workspace:*` for internal package references
- `@variscout/azure-app` depends on `zustand` (feature stores, see ADR-041)

## Naming Conventions

- **`*Base`** — Shared primitive component in `@variscout/ui` (e.g., `PIPanelBase`, `DashboardGrid`). Accepts data/callbacks via props, no app-specific logic.
- **`*WrapperBase`** — App-level chart wrapper in `@variscout/ui` (e.g., `IChartWrapperBase`, `BoxplotWrapperBase`). Composes shared hooks + Base chart + app UI (display toggles, context menu). Each app imports WrapperBase and adds ~50 lines of app-specific wiring.
- App wrappers (in `apps/*/`) import `*WrapperBase` or `*Base` and add app-specific context, persistence, and keyboard navigation.
