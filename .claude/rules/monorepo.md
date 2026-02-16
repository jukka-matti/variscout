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
│              #   useVariationTracking - Cumulative η² tracking
│              #   useDataState - Shared DataContext state management
│              #   useDataIngestion - File upload and data parsing
│              #   useKeyboardNavigation - Arrow key focus management
│              #   useResponsiveChartMargins - Dynamic chart margins
│              #   useTier - License tier state and limits
└── ui/        # @variscout/ui - Shared UI components:
               #   AnovaResults, FilterBreadcrumb, FilterChipDropdown,
               #   PerformanceSetupPanelBase, RegressionPanelBase, VariationBar,
               #   YAxisPopover, ChartCard, ColumnMapping, MeasureColumnSelector,
               #   PerformanceDetectedModal, DataQualityBanner, HelpTooltip,
               #   SelectionPanel, CreateFactorModal, UpgradePrompt,
               #   Slider, WhatIfSimulator, WhatIfPageBase,
               #   ErrorBoundary, AxisEditor, FactorSelector, StatsPanelBase,
               #   MindmapWindow, MindmapPanelContent,
               #   useGlossary, useIsMobile, gradeColors, errorService

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
- `@variscout/ui` exports `AnovaResults`, `FilterBreadcrumb`, `FilterChipDropdown`, `PerformanceSetupPanelBase`, `RegressionPanelBase`, `VariationBar`, `YAxisPopover`, `ChartCard`, `ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `UpgradePrompt`, `Slider`, `WhatIfSimulator`, `WhatIfPageBase`, `ErrorBoundary`, `AxisEditor`, `FactorSelector`, `StatsPanelBase`, `MindmapWindow`, `MindmapPanelContent`, `useGlossary`, `useIsMobile`, `gradeColors`, `errorService`

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
