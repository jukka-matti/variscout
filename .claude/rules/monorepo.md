# Monorepo Rules

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic, glossary, tier system, i18n (no React)
├── charts/    # @variscout/charts - React + Visx (standard + Performance charts), useChartTheme
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
│              #   useKnowledgeSearch - Knowledge Base search wrapper
│              #   useFilterHandlers - Dashboard filter handler callbacks
│              #   useCreateFactorModal - Dashboard create-factor modal state
│              #   useVerificationCharts - Verification chart toggle state + availability
│              #   useReportSections - Report type detection + section composition
│              #   useScrollSpy - IntersectionObserver TOC tracking
│              #   useJourneyPhase - Journey phase detection (frame/scout/investigate/improve)
│              #   useSnapshotData - Per-finding filtered data + stats
│              #   copySectionAsHTML - Rich clipboard copy utility
│              #   useLocaleState - Locale state (localStorage + data-locale attribute)
│              #   useTranslation - Component-level translation hook (MutationObserver)
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
               #   CapabilityHistogram, ProbabilityPlot, DataTableBase,
               #   ChartDownloadMenu, CharacteristicTypeSelector,
               #   EditableChartTitle, SettingsPanelBase, FocusedChartViewBase,
               #   DashboardBase (DashboardLayoutBase, FocusedViewOverlay, FocusedChartCard,
               #     DashboardChartCard, DashboardGrid),
               #   CoScoutInline, CoScoutMessages, InvestigationPhaseBadge,
               #   AIOnboardingTooltip, InvestigationSidebar, StagedComparisonCard,
               #   ReportViewBase, ReportSection, ReportStepMarker, ReportKPIGrid,
               #   ReportChartSnapshot, VerificationEvidenceBase,
               #   MethodologyCoachBase, JourneyPhaseIndicator, DiamondPhaseMap, PDCAProgress,
               #   useGlossary, useIsMobile, errorService

apps/
├── pwa/          # @variscout/pwa - PWA website
├── azure/        # @variscout/azure-app - Azure Team App
└── website/      # @variscout/website - Marketing website (Astro + React Islands)
```

## Import Rules

- Apps import from packages: `import { calculateStats } from '@variscout/core'`
- Packages never import from apps
- `@variscout/core` has no React dependencies (exports stats, parser, glossary, tier)
- `@variscout/charts` depends on `@variscout/core`
- `@variscout/hooks` depends on `@variscout/core` (for types, utilities, and tier)
- `@variscout/ui` exports `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `FilterContextBar`, `PerformanceSetupPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `UpgradePrompt`, `Slider`, `WhatIfSimulator`, `WhatIfPageBase`, `ErrorBoundary`, `AxisEditor`, `FactorSelector`, `StatsPanelBase`, `FindingsWindow`, `FindingsLog`, `FindingCard`, `FindingEditor`, `FindingStatusBadge`, `FindingComments`, `FindingBoardView`, `FindingsExportMenu`, `HypothesisTreeView`, `HypothesisNode`, `InvestigationPrompt`, `PasteScreenBase`, `ManualEntryBase`, `ManualEntrySetupBase`, `SpecsPopover`, `SpecEditor`, `CapabilityHistogram`, `ProbabilityPlot`, `BoxplotDisplayToggle`, `ChartAnnotationLayer`, `AnnotationContextMenu`, `MobileCategorySheet`, `DataTableBase`, `DataTableModalBase`, `ChartDownloadMenu`, `CharacteristicTypeSelector`, `EditableChartTitle`, `SettingsPanelBase`, `FocusedChartViewBase`, `FocusedViewOverlay`, `FocusedChartCard`, `DashboardChartCard`, `DashboardGrid`, `DashboardLayoutBase`, `IChartWrapperBase`, `BoxplotWrapperBase`, `ParetoChartWrapperBase`, `FindingsPanelBase`, `BriefHeader`, `FindingDetailPanel`, `NarrativeBar`, `ProcessDescriptionField`, `ChartInsightChip`, `CoScoutInline`, `CoScoutMessages`, `CoScoutPanelBase`, `InvestigationPhaseBadge`, `AIOnboardingTooltip`, `InvestigationSidebar`, `StagedComparisonCard`, `PresentationViewBase`, `PreviewBadge`, `ReportViewBase`, `ReportSection`, `ReportStepMarker`, `ReportKPIGrid`, `ReportChartSnapshot`, `BREAKPOINTS`, `useGlossary`, `useIsMobile`, `errorService`

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

## Naming Conventions

- **`*Base`** — Shared primitive component in `@variscout/ui` (e.g., `StatsPanelBase`, `DashboardGrid`). Accepts data/callbacks via props, no app-specific logic.
- **`*WrapperBase`** — App-level chart wrapper in `@variscout/ui` (e.g., `IChartWrapperBase`, `BoxplotWrapperBase`). Composes shared hooks + Base chart + app UI (display toggles, context menu). Each app imports WrapperBase and adds ~50 lines of app-specific wiring.
- App wrappers (in `apps/*/`) import `*WrapperBase` or `*Base` and add app-specific context, persistence, and keyboard navigation.
