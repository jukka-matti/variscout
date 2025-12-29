/**
 * @variscout/charts - Shared chart components
 *
 * Props-based chart components for use across PWA and Excel Add-in.
 * All charts accept data via props rather than context, enabling
 * platform-agnostic usage.
 */

// Types
export type {
  BaseChartProps,
  SpecLimits,
  GradeTier,
  IChartProps,
  BoxplotGroupInput,
  BoxplotGroupData,
  BoxplotProps,
  ParetoDataPoint,
  ParetoChartProps,
  CapabilityHistogramProps,
  ProbabilityPlotProps,
  ChartSourceBarProps,
  ChartMargins,
  ChartFonts,
} from './types';

// Helper functions
export { calculateBoxplotStats } from './types';

// Responsive utilities
export {
  getResponsiveMargins,
  getResponsiveFonts,
  getResponsiveTickCount,
  getBreakpoints,
  type ChartType,
} from './responsive';

// Chart components
export { default as IChart, IChartBase } from './IChart';
export { default as Boxplot, BoxplotBase } from './Boxplot';
export { default as ParetoChart, ParetoChartBase } from './ParetoChart';
export { default as CapabilityHistogram, CapabilityHistogramBase } from './CapabilityHistogram';
export { default as ProbabilityPlot, ProbabilityPlotBase } from './ProbabilityPlot';
export { default as ChartSourceBar, getSourceBarHeight } from './ChartSourceBar';
