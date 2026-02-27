// Components
export { HelpTooltip, type HelpTooltipProps, type TooltipPosition } from './components/HelpTooltip';
export { ChartCard, type ChartCardProps, type ChartId } from './components/ChartCard';
export {
  MeasureColumnSelector,
  type MeasureColumnSelectorProps,
} from './components/MeasureColumnSelector';
export {
  PerformanceDetectedModal,
  type PerformanceDetectedModalProps,
} from './components/PerformanceDetectedModal';
export { DataQualityBanner, type DataQualityBannerProps } from './components/DataQualityBanner';
export { ColumnMapping, type ColumnMappingProps } from './components/ColumnMapping';
export { SelectionPanel, type SelectionPanelProps } from './components/SelectionPanel';
export { CreateFactorModal, type CreateFactorModalProps } from './components/CreateFactorModal';
export { UpgradePrompt, type UpgradePromptProps } from './components/UpgradePrompt';
export {
  AnovaResults,
  anovaDefaultColorScheme,
  type AnovaResultsProps,
  type AnovaResultsColorScheme,
} from './components/AnovaResults';
export {
  YAxisPopover,
  yAxisPopoverDefaultColorScheme,
  type YAxisPopoverProps,
  type YAxisPopoverColorScheme,
} from './components/YAxisPopover';
export {
  PerformanceSetupPanelBase,
  performanceSetupPanelDefaultColorScheme,
  performanceSetupPanelPwaColorScheme,
  type PerformanceSetupPanelBaseProps,
  type PerformanceSetupPanelColorScheme,
  type PerformanceSetupPanelTierProps,
  type ChannelValidation,
} from './components/PerformanceSetupPanel';
export {
  VariationBar,
  variationBarDefaultColorScheme,
  type VariationBarProps,
  type VariationBarColorScheme,
} from './components/VariationBar';
export {
  FilterChipDropdown,
  filterChipDropdownDefaultColorScheme,
  type FilterChipDropdownProps,
  type FilterChipDropdownColorScheme,
} from './components/FilterChipDropdown';
export {
  FilterBreadcrumb,
  filterBreadcrumbDefaultColorScheme,
  type FilterBreadcrumbProps,
  type FilterBreadcrumbColorScheme,
} from './components/FilterBreadcrumb';
export {
  Slider,
  sliderDefaultColorScheme,
  type SliderColorScheme,
  type SliderProps,
} from './components/Slider';

export {
  WhatIfSimulator,
  whatIfSimulatorDefaultColorScheme,
  type WhatIfSimulatorColorScheme,
  type WhatIfSimulatorProps,
  type SimulatorPreset,
  type WhatIfSimulatorHandle,
} from './components/WhatIfSimulator';

export {
  WhatIfPageBase,
  whatIfPageDefaultColorScheme,
  type WhatIfPageColorScheme,
  type WhatIfPageBaseProps,
} from './components/WhatIfPage';

export {
  ErrorBoundary,
  errorBoundaryDefaultColorScheme,
  type ErrorBoundaryProps,
  type ErrorBoundaryColorScheme,
} from './components/ErrorBoundary';
export {
  AxisEditor,
  axisEditorDefaultColorScheme,
  type AxisEditorProps,
  type AxisEditorColorScheme,
} from './components/AxisEditor';
export {
  FactorSelector,
  factorSelectorDefaultColorScheme,
  type FactorSelectorProps,
  type FactorSelectorColorScheme,
} from './components/FactorSelector';

export {
  FindingsWindow,
  openFindingsPopout,
  updateFindingsPopout,
  FINDINGS_SYNC_KEY,
  FINDINGS_ACTION_KEY,
  type FindingsSyncData,
  type FindingsAction,
} from './components/FindingsWindow';

export {
  StatsPanelBase,
  statsPanelDefaultColorScheme,
  type StatsPanelBaseProps,
  type StatsPanelColorScheme,
} from './components/StatsPanel';

export {
  ManualEntryBase,
  ManualEntrySetupBase,
  type ManualEntryBaseProps,
  type ManualEntryConfig,
  type ManualEntrySetupBaseProps,
} from './components/ManualEntry';

export {
  SpecsPopover,
  specsPopoverDefaultColorScheme,
  type SpecsPopoverProps,
  type SpecsPopoverColorScheme,
} from './components/SpecsPopover';

export {
  SpecEditor,
  specEditorDefaultColorScheme,
  type SpecEditorProps,
  type SpecEditorColorScheme,
} from './components/SpecEditor';

export {
  default as CharacteristicTypeSelector,
  type CharacteristicTypeSelectorProps,
} from './components/CharacteristicTypeSelector';

export {
  CapabilityHistogram,
  type CapabilityHistogramProps,
} from './components/CapabilityHistogram';

export { ProbabilityPlot, type ProbabilityPlotProps } from './components/ProbabilityPlot';

export {
  FilterContextBar,
  filterContextBarDefaultColorScheme,
  type FilterContextBarProps,
  type FilterContextBarColorScheme,
} from './components/FilterContextBar';

export {
  BoxplotDisplayToggle,
  boxplotDisplayToggleDefaultColorScheme,
  type BoxplotDisplayToggleProps,
  type BoxplotDisplayToggleColorScheme,
} from './components/BoxplotDisplayToggle';

export {
  ChartAnnotationLayer,
  type ChartAnnotationLayerProps,
  type ChartAnnotation as UIChartAnnotation,
  type HighlightColor as UIHighlightColor,
} from './components/ChartAnnotationLayer';

export {
  AnnotationContextMenu,
  type AnnotationContextMenuProps,
} from './components/AnnotationContextMenu';

export { DataTableBase, type DataTableBaseProps } from './components/DataTable';

export {
  ChartDownloadMenu,
  chartDownloadMenuDefaultColorScheme,
  type ChartDownloadMenuProps,
  type ChartDownloadMenuColorScheme,
} from './components/ChartExportMenu';

export {
  InvestigationPrompt,
  investigationPromptDefaultColorScheme,
  type InvestigationPromptProps,
  type InvestigationPromptColorScheme,
} from './components/InvestigationPrompt';

export {
  FindingsLog,
  FindingCard,
  FindingEditor,
  FindingStatusBadge,
  FindingComments,
  FindingBoardView,
  copyFindingsToClipboard,
  formatFindingsText,
  type FindingsLogProps,
  type FindingCardProps,
  type FindingEditorProps,
  type FindingStatusBadgeProps,
  type FindingCommentsProps,
  type FindingBoardViewProps,
} from './components/FindingsLog';

export {
  default as PasteScreenBase,
  pasteScreenDefaultColorScheme,
  type PasteScreenBaseProps,
  type PasteScreenColorScheme,
} from './components/PasteScreen';

// Dashboard building blocks
export {
  FocusedViewOverlay,
  FocusedChartCard,
  DashboardChartCard,
  DashboardGrid,
  type FocusedViewOverlayProps,
  type FocusedChartCardProps,
  type DashboardChartCardProps,
  type DashboardGridProps,
} from './components/DashboardBase';

// Services
export {
  errorService,
  type ErrorSeverity,
  type ErrorContext,
  type ErrorLogEntry,
  type ErrorNotificationHandler,
} from './services';

// Hooks
export { useIsMobile, useGlossary, type UseGlossaryOptions, type UseGlossaryResult } from './hooks';
