export { gradeColors, type GradeColor } from './colors';

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
  anovaAzureColorScheme,
  type AnovaResultsProps,
  type AnovaResultsColorScheme,
} from './components/AnovaResults';
export {
  YAxisPopover,
  yAxisPopoverDefaultColorScheme,
  yAxisPopoverAzureColorScheme,
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
  variationBarAzureColorScheme,
  type VariationBarProps,
  type VariationBarColorScheme,
} from './components/VariationBar';
export {
  FilterChipDropdown,
  filterChipDropdownDefaultColorScheme,
  filterChipDropdownAzureColorScheme,
  type FilterChipDropdownProps,
  type FilterChipDropdownColorScheme,
} from './components/FilterChipDropdown';
export {
  FilterBreadcrumb,
  filterBreadcrumbDefaultColorScheme,
  filterBreadcrumbAzureColorScheme,
  type FilterBreadcrumbProps,
  type FilterBreadcrumbColorScheme,
} from './components/FilterBreadcrumb';
export {
  RegressionPanelBase,
  regressionPanelDefaultColorScheme,
  regressionPanelAzureColorScheme,
  type RegressionPanelBaseProps,
  type RegressionPanelColorScheme,
  type SimpleRegressionViewProps,
  type AdvancedRegressionViewProps,
  type ExpandedScatterModalProps,
  type ColumnClassification,
  SimpleRegressionView,
  AdvancedRegressionView,
  ExpandedScatterModal,
  regressionViewDefaultColorScheme,
  regressionViewAzureColorScheme,
  type RegressionViewColorScheme,
  type SimpleRegressionViewComponentProps,
  type AdvancedRegressionViewComponentProps,
  type ExpandedScatterModalComponentProps,
} from './components/RegressionPanel';

export {
  Slider,
  sliderDefaultColorScheme,
  sliderAzureColorScheme,
  type SliderColorScheme,
  type SliderProps,
} from './components/Slider';

export {
  WhatIfSimulator,
  whatIfSimulatorDefaultColorScheme,
  whatIfSimulatorAzureColorScheme,
  type WhatIfSimulatorColorScheme,
  type WhatIfSimulatorProps,
  type SimulatorPreset,
  type WhatIfSimulatorHandle,
} from './components/WhatIfSimulator';

export {
  WhatIfPageBase,
  whatIfPageDefaultColorScheme,
  whatIfPageAzureColorScheme,
  type WhatIfPageColorScheme,
  type WhatIfPageBaseProps,
} from './components/WhatIfPage';

export {
  ErrorBoundary,
  errorBoundaryDefaultColorScheme,
  errorBoundaryAzureColorScheme,
  type ErrorBoundaryProps,
  type ErrorBoundaryColorScheme,
} from './components/ErrorBoundary';
export {
  AxisEditor,
  axisEditorDefaultColorScheme,
  axisEditorAzureColorScheme,
  type AxisEditorProps,
  type AxisEditorColorScheme,
} from './components/AxisEditor';
export {
  FactorSelector,
  factorSelectorDefaultColorScheme,
  factorSelectorAzureColorScheme,
  type FactorSelectorProps,
  type FactorSelectorColorScheme,
} from './components/FactorSelector';

export {
  MindmapWindow,
  openMindmapPopout,
  updateMindmapPopout,
  mindmapWindowDefaultColorScheme,
  mindmapWindowAzureColorScheme,
  type MindmapWindowColorScheme,
  type MindmapWindowProps,
} from './components/MindmapWindow';

export {
  StatsPanelBase,
  statsPanelDefaultColorScheme,
  statsPanelAzureColorScheme,
  type StatsPanelBaseProps,
  type StatsPanelColorScheme,
} from './components/StatsPanel';

export {
  MindmapPanelContent,
  mindmapPanelDefaultColorScheme,
  mindmapPanelAzureColorScheme,
  type MindmapPanelColorScheme,
  type MindmapPanelContentProps,
} from './components/MindmapPanel';

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
  specsPopoverAzureColorScheme,
  type SpecsPopoverProps,
  type SpecsPopoverColorScheme,
} from './components/SpecsPopover';

export {
  SpecEditor,
  specEditorDefaultColorScheme,
  specEditorAzureColorScheme,
  type SpecEditorProps,
  type SpecEditorColorScheme,
} from './components/SpecEditor';

export {
  CapabilityHistogram,
  type CapabilityHistogramProps,
} from './components/CapabilityHistogram';

export { ProbabilityPlot, type ProbabilityPlotProps } from './components/ProbabilityPlot';

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
