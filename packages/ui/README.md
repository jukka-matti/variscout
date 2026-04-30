# @variscout/ui

Shared UI components for VariScout applications (PWA, Azure).

## Installation

```json
{
  "dependencies": {
    "@variscout/ui": "workspace:*"
  }
}
```

## Exports

60+ shared components and utilities. Key categories:

### Data Input

`ColumnMapping`, `MeasureColumnSelector`, `PerformanceDetectedModal`, `DataQualityBanner`, `PasteScreenBase`, `ManualEntryBase`, `ManualEntrySetupBase`

### Charts & Analysis

`CapabilityHistogram`, `ProbabilityPlot`, `StatsPanelBase`, `AnovaResults`, `BoxplotDisplayToggle`, `ChartAnnotationLayer`, `AnnotationContextMenu`, `MobileCategorySheet`, `ChartCard`, `ChartDownloadMenu`, `EditableChartTitle`

### Dashboard

`DashboardGrid`, `DashboardChartCard`, `FocusedChartCard`, `FocusedViewOverlay`, `FocusedChartViewBase`

### Navigation & Filters

`FilterBreadcrumb`, `FilterChipDropdown`, `FilterContextBar`, `YAxisPopover`, `AxisEditor`

### Investigation & Findings

`FindingsWindow`, `FindingsLog`, `FindingCard`, `FindingEditor`, `InvestigationPrompt`, `InvestigationSidebar`, `InvestigationPhaseBadge`

### AI Components

`CoScoutInline`, `CoScoutMessages`, `AIOnboardingTooltip`

### Settings & Misc

`SettingsPanelBase`, `SpecEditor`, `UpgradePrompt`, `HelpTooltip`, `SelectionPanel`, `CreateFactorModal`, `WhatIfSimulator`, `WhatIfPageBase`, `DataTableBase`, `ErrorBoundary`, `Slider`, `FactorSelector`, `CharacteristicTypeSelector`, `PerformanceSetupPanelBase`

### Hooks & Utilities

`useGlossary`, `useIsMobile`, `errorService`

### Shared CSS

`@variscout/ui/styles/theme.css`, `@variscout/ui/styles/components.css`

## Design Pattern

Components use the **colorScheme pattern** with semantic tokens:

```tsx
import { defaultScheme } from '@variscout/ui';
<StatsPanelBase colorScheme={defaultScheme} stats={stats} />;
```

## Testing

```bash
pnpm --filter @variscout/ui test
```

## Related

- [Hooks Package](../hooks/README.md)
- [Charts Package](../charts/README.md)
- [Core Package](../core/README.md)
