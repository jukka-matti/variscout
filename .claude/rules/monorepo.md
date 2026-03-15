# Monorepo Rules

## Package Structure

```
packages/
├── core/      # @variscout/core - Pure logic, glossary, tier system (no React)
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
│              #   useBoxplotWrapperData - Shared boxplot wrapper data prep
│              #   useIChartWrapperData - Shared I-Chart wrapper data prep
│              #   useParetoChartData - Shared Pareto chart data prep
│              #   useDashboardComputedData - Shared dashboard computed stats
│              #   useDashboardChartsBase - Shared dashboard chart state composition
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
               #   DashboardBase (FocusedViewOverlay, FocusedChartCard,
               #     DashboardChartCard, DashboardGrid),
               #   CoScoutInline, CoScoutMessages, InvestigationPhaseBadge,
               #   AIOnboardingTooltip, InvestigationSidebar,
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
- `@variscout/ui` exports `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `FilterContextBar`, `PerformanceSetupPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `UpgradePrompt`, `Slider`, `WhatIfSimulator`, `WhatIfPageBase`, `ErrorBoundary`, `AxisEditor`, `FactorSelector`, `StatsPanelBase`, `FindingsWindow`, `FindingsLog`, `FindingCard`, `FindingEditor`, `InvestigationPrompt`, `PasteScreenBase`, `ManualEntryBase`, `ManualEntrySetupBase`, `SpecsPopover`, `SpecEditor`, `CapabilityHistogram`, `ProbabilityPlot`, `BoxplotDisplayToggle`, `ChartAnnotationLayer`, `AnnotationContextMenu`, `MobileCategorySheet`, `DataTableBase`, `ChartDownloadMenu`, `CharacteristicTypeSelector`, `EditableChartTitle`, `SettingsPanelBase`, `FocusedChartViewBase`, `FocusedViewOverlay`, `FocusedChartCard`, `DashboardChartCard`, `DashboardGrid`, `CoScoutInline`, `CoScoutMessages`, `InvestigationPhaseBadge`, `AIOnboardingTooltip`, `InvestigationSidebar`, `useGlossary`, `useIsMobile`, `errorService`

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
