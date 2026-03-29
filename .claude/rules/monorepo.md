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
├── hooks/     # @variscout/hooks - Shared React hooks:
│              #   useChartScale - Y-axis scale calculation
│              #   useFilterNavigation - Filter navigation with breadcrumbs
│              #   useVariationTracking - Cumulative Total SS scope tracking
│              #   useDataState - Shared DataContext state management
│              #   useDataIngestion - File upload and data parsing
│              #   useKeyboardNavigation - Arrow key focus management
│              #   useResponsiveChartMargins - Dynamic chart margins
│              #   useTier - License tier state and limits
│              #   useBoxplotData - Shared d3 boxplot computation
│              #   useIChartData - Shared I-Chart data transform
│              #   useAnnotations - Chart annotation state (highlights, text notes)
│              #   useFindings - Finding CRUD, status, actions, outcomes
│              #   useHypotheses - Hypothesis tree CRUD, auto-validation
│              #   useControlViolations - Control/spec violation detection
│              #   useFocusedChartNav - Focused chart carousel navigation
│              #   useChartCopy - Chart export (clipboard, PNG, SVG)
│              #   useBoxplotWrapperData - Shared boxplot wrapper data prep
│              #   useIChartWrapperData - Shared I-Chart wrapper data prep
│              #   useParetoChartData - Shared Pareto chart data prep
│              #   useDashboardComputedData - Shared dashboard computed stats
│              #   useDashboardChartsBase - Shared dashboard chart state composition
│              #   useAIContext - AI context building hook
│              #   useNarration - NarrativeBar state
│              #   useChartInsights - Per-chart insight orchestration
│              #   useAICoScout - CoScout conversation state
│              #   useKnowledgeSearch - Knowledge Base search wrapper (returns lastSearchTimestamp)
│              #   useFilterHandlers - Dashboard filter handler callbacks
│              #   useCreateFactorModal - Dashboard create-factor modal state
│              #   useVerificationCharts - Verification chart toggle state + availability
│              #   useReportSections - Report type detection + section composition
│              #   useScrollSpy - IntersectionObserver TOC tracking
│              #   useJourneyPhase - Journey phase detection + entry scenario (AI tool gating)
│              #   useSnapshotData - Per-finding filtered data + stats
│              #   copySectionAsHTML - Rich clipboard copy utility
│              #   useLocaleState - Locale state (localStorage + data-locale attribute)
│              #   useTranslation - Component-level translation hook (MutationObserver)
│              #   useYamazumiChartData - Yamazumi stacked bar data from filtered rows
│              #   useYamazumiIChartData - I-Chart data with switchable metric for Yamazumi
│              #   useYamazumiParetoData - Pareto data with 5 switchable modes for Yamazumi
│              #   useAsyncStats - Async stats computation via Web Worker with generation counter
│              #   useTooltipPosition - Viewport-aware tooltip positioning (auto-flip)
│              #   useProbabilityPlotData - Multi-series probability plot data (factor grouping + AD test)
└── ui/        # @variscout/ui - Shared UI components:
               #   AnovaResults, FilterBreadcrumb, FilterChipDropdown, FilterContextBar,
               #   PerformanceSetupPanelBase, VariationBar,
               #   YAxisPopover, ChartCard, ColumnMapping, MeasureColumnSelector,
               #   PerformanceDetectedModal, DataQualityBanner, HelpTooltip,
               #   SelectionPanel, CreateFactorModal, UpgradePrompt,
               #   Slider, WhatIfSimulator, WhatIfPageBase,
               #   ErrorBoundary, AxisEditor, FactorSelector, StatsPanelBase,
               #   FindingsWindow, FindingsLog, FindingCard, FindingEditor,
               #   InvestigationPrompt, PasteScreenBase, BoxplotDisplayToggle,
               #   ChartAnnotationLayer, AnnotationContextMenu, MobileCategorySheet,
               #   ManualEntryBase, ManualEntrySetupBase, SpecsPopover, SpecEditor,
               #   CapabilityHistogram, ProbabilityPlot, ProbabilityPlotTooltip, DataPanelBase, DataTableBase,
               #   ChartDownloadMenu, CharacteristicTypeSelector,
               #   EditableChartTitle, SettingsPanelBase, FocusedChartViewBase,
               #   DashboardBase (DashboardLayoutBase, FocusedViewOverlay, FocusedChartCard,
               #     DashboardChartCard, DashboardGrid),
               #   CoScoutInline, CoScoutMessages, InvestigationPhaseBadge,
               #   AIOnboardingTooltip, InvestigationSidebar, StagedComparisonCard,
               #   ReportViewBase, ReportSection, ReportStepMarker, ReportKPIGrid,
               #   ReportChartSnapshot, ReportCpkLearningLoop, ReportHypothesisSummary,
               #   ReportImprovementSummary, ReportCapabilityKPIGrid, ReportPerformanceKPIGrid,
               #   VerificationEvidenceBase,
               #   SynthesisCard, IdeaGroupCard, ImprovementSummaryBar, ImprovementWorkspaceBase,
               #   RiskPopover, PrioritizationMatrix,
               #   YamazumiDetectedModal, YamazumiIChartMetricToggle, YamazumiParetoModeDropdown,
               #   YamazumiSummaryBar,
               #   useGlossary, useIsMobile, errorService

apps/
├── pwa/          # @variscout/pwa - PWA website
├── azure/        # @variscout/azure-app - Azure Team App
│              #   features/ - Feature modules (Feature-Sliced Design, stores co-located):
│              #     findings/ - Findings feature wiring + findingsStore
│              #     investigation/ - Investigation feature wiring + investigationStore
│              #     improvement/ - Improvement workspace feature wiring + improvementStore
│              #     ai/ - AI/CoScout feature wiring + aiStore
│              #     data-flow/ - Data pipeline orchestration
│              #     panels/ - panelsStore (panel visibility & layout)
│              #   hooks/ - App-specific hooks:
│              #     useProjectLoader - Project loading lifecycle + error classification
│              #     useProjectOverview - Overview dashboard data (userId, projects, lastViewedAt)
│              #   components/ - Azure-only app components:
│              #     ProjectDashboard - Full project overview view (peer to Editor)
│              #     ProjectStatusCard - Status summary (findings, hypotheses, actions)
│              #     DashboardSummaryCard - AI summary card + quick-ask input
│              #     ProjectCard - Rich portfolio card (phase, findings, tasks, overdue, what's-new dot)
│              #     WhatsNewSection - "What's new since last visit" summary on Dashboard
│              #     OtherProjectsList - Cross-project compact list on Dashboard Overview
│              #     SampleDataPicker - Guided sample data entry for empty portfolio state
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
- `@variscout/ui` exports `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `FilterContextBar`, `PerformanceSetupPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `UpgradePrompt`, `Slider`, `WhatIfSimulator`, `WhatIfPageBase`, `ErrorBoundary`, `AxisEditor`, `FactorSelector`, `StatsPanelBase`, `FindingsWindow`, `FindingsLog`, `FindingCard`, `FindingEditor`, `FindingStatusBadge`, `FindingComments`, `FindingBoardView`, `FindingsExportMenu`, `HypothesisTreeView`, `HypothesisNode`, `InvestigationPrompt`, `PasteScreenBase`, `ManualEntryBase`, `ManualEntrySetupBase`, `SpecsPopover`, `SpecEditor`, `CapabilityHistogram`, `ProbabilityPlot`, `BoxplotDisplayToggle`, `ChartAnnotationLayer`, `AnnotationContextMenu`, `MobileCategorySheet`, `DataPanelBase`, `DataTableBase`, `DataTableModalBase`, `ChartDownloadMenu`, `CharacteristicTypeSelector`, `EditableChartTitle`, `SettingsPanelBase`, `FocusedChartViewBase`, `FocusedViewOverlay`, `FocusedChartCard`, `DashboardChartCard`, `DashboardGrid`, `DashboardLayoutBase`, `IChartWrapperBase`, `BoxplotWrapperBase`, `ParetoChartWrapperBase`, `FindingsPanelBase`, `BriefHeader`, `FindingDetailPanel`, `NarrativeBar`, `ProcessDescriptionField`, `ChartInsightChip`, `CoScoutInline`, `CoScoutMessages`, `CoScoutPanelBase`, `InvestigationPhaseBadge`, `AIOnboardingTooltip`, `InvestigationSidebar`, `StagedComparisonCard`, `PresentationViewBase`, `PreviewBadge`, `ReportViewBase`, `ReportSection`, `ReportStepMarker`, `ReportKPIGrid`, `ReportChartSnapshot`, `ReportCpkLearningLoop`, `ReportHypothesisSummary`, `ReportImprovementSummary`, `ReportCapabilityKPIGrid`, `ReportPerformanceKPIGrid`, `SynthesisCard`, `IdeaGroupCard`, `ImprovementSummaryBar`, `ImprovementWorkspaceBase`, `RiskPopover`, `PrioritizationMatrix`, `BREAKPOINTS`, `useGlossary`, `useIsMobile`, `errorService`

## @variscout/core Sub-Path Exports

The core package supports granular sub-path imports (in addition to the root `@variscout/core` import):

| Import Path | Module | Key Exports |
|-------------|--------|-------------|
| `@variscout/core` | Root barrel | Everything (backwards compatible) |
| `@variscout/core/stats` | stats/ | calculateStats, calculateAnova, calculateBoxplotStats, calculateKDE, lttb |
| `@variscout/core/ai` | ai/ | responsesApi, buildAIContext, actionTools, chartInsights |
| `@variscout/core/parser` | parser/ | parseText, detectColumns, validateData |
| `@variscout/core/findings` | findings/ | Finding types, factories, helpers, migration |
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

- **`*Base`** — Shared primitive component in `@variscout/ui` (e.g., `StatsPanelBase`, `DashboardGrid`). Accepts data/callbacks via props, no app-specific logic.
- **`*WrapperBase`** — App-level chart wrapper in `@variscout/ui` (e.g., `IChartWrapperBase`, `BoxplotWrapperBase`). Composes shared hooks + Base chart + app UI (display toggles, context menu). Each app imports WrapperBase and adds ~50 lines of app-specific wiring.
- App wrappers (in `apps/*/`) import `*WrapperBase` or `*Base` and add app-specific context, persistence, and keyboard navigation.
