/**
 * Shared types for @variscout/charts
 * Props-based chart components for use across PWA and Azure App
 */

import type React from 'react';
import type {
  StatsResult,
  SpecLimits,
  StagedStatsResult,
  StageBoundary,
  ChannelResult,
  CpkThresholds,
  BoxplotGroupInput,
  BoxplotGroupData,
  ChartMargins,
  ChartFonts,
} from '@variscout/core';

/** Highlight color for annotated chart elements */
export type HighlightColor = 'red' | 'amber' | 'green';

// Re-export types from core for convenience
export type {
  SpecLimits,
  StagedStatsResult,
  StageBoundary,
  ChannelResult,
  CpkThresholds,
  BoxplotGroupInput,
  BoxplotGroupData,
  ChartMargins,
  ChartFonts,
};

/**
 * Y-axis domain override for locking scale to full dataset
 */
export interface YAxisDomain {
  min: number;
  max: number;
}

/**
 * Common props shared by all chart components
 */
export interface BaseChartProps {
  /** Container width in pixels */
  parentWidth: number;
  /** Container height in pixels */
  parentHeight: number;
  /** Show branding footer bar */
  showBranding?: boolean;
  /** Custom branding text (defaults to edition-based text) */
  brandingText?: string;
}

/**
 * Data point for I-Chart
 */
export interface IChartDataPoint {
  /** X-axis value (typically index or time) */
  x: number;
  /** Y-axis value (measurement) */
  y: number;
  /** Original row index for drill-down navigation */
  originalIndex?: number;
  /** Stage identifier for staged I-Charts */
  stage?: string;
  /** Formatted time value for tooltip display */
  timeValue?: string | null;
}

/**
 * I-Chart (Individual Control Chart) props
 */
export interface IChartProps extends BaseChartProps {
  /** Data points with x (index), y (value), and optional stage */
  data: IChartDataPoint[];
  /** Statistical results (mean, stdDev, ucl, lcl) - used when not staged */
  stats: StatsResult | null;
  /** Staged statistics - when provided, renders per-stage control limits */
  stagedStats?: StagedStatsResult;
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Axis settings for manual scaling */
  axisSettings?: { min?: number; max?: number };
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Callback when a point is clicked */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Enable brush selection (Minitab-style multi-point selection) */
  enableBrushSelection?: boolean;
  /** Currently selected point indices (for cross-chart sync) */
  selectedPoints?: Set<number>;
  /** Callback when brush selection changes (new selection indices) */
  onSelectionChange?: (indices: Set<number>) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Show Minitab-style labels next to limit lines (default: true) */
  showLimitLabels?: boolean;
  /** Callback when a spec limit label is clicked (for editing) */
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  /** Callback when Y-axis area is clicked (for editing scale) */
  onYAxisClick?: (event?: React.MouseEvent) => void;
  /** Highlighted point index for bi-directional sync (e.g., from data panel selection) */
  highlightedPointIndex?: number | null;
  /** Show color-coded legend explaining point colors (default: false) */
  showLegend?: boolean;
  /** Legend display mode: educational (variation learning) or practical (action-oriented) */
  legendMode?: 'educational' | 'practical';
}

/**
 * Boxplot chart props
 */
export interface BoxplotProps extends BaseChartProps {
  /** Grouped data for boxplot */
  data: BoxplotGroupData[];
  /** Specification limits */
  specs: SpecLimits;
  /** Y-axis label */
  yAxisLabel?: string;
  /** X-axis label (factor name) */
  xAxisLabel?: string;
  /** Override Y-axis domain (for locking scale to full dataset) */
  yDomainOverride?: YAxisDomain;
  /** Currently selected groups */
  selectedGroups?: string[];
  /** Callback when a box is clicked */
  onBoxClick?: (key: string) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Max category contribution % for this factor (for drill suggestion indicator) */
  variationPct?: number;
  /** Threshold for "high variation" highlight (default: 50) */
  variationThreshold?: number;
  /** Category contributions - Map from category key to % of total variation */
  categoryContributions?: Map<string | number, number>;
  /** Show contribution labels below boxes (default: false) */
  showContributionLabels?: boolean;
  /** Show contribution bars below boxes (default: true when categoryContributions provided) */
  showContributionBars?: boolean;
  /** Callback when Y-axis label area is clicked (for editing) */
  onYAxisClick?: () => void;
  /** Callback when X-axis label area is clicked (for editing) */
  onXAxisClick?: () => void;
  /** Custom tick formatter for X-axis (e.g., value labels) */
  xTickFormat?: (value: string) => string;
  /** Show violin (density) overlay behind box elements (default: false) */
  showViolin?: boolean;
  /** Pre-computed KDE violin data (category key → density points). When provided, skips internal KDE computation. */
  violinData?: Map<string, Array<{ value: number; count: number }>>;
  /** Highlighted categories with annotation colors (category key → color) */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Callback when a box is right-clicked (for annotation context menu) */
  onBoxContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Per-key fill color overrides (key → hex). Priority: highlightedCategories > fillOverrides > selection > default */
  fillOverrides?: Record<string, string>;
  /** Draw thin dashed vertical separator lines between every N boxes (for staged grouping) */
  groupSize?: number;
}

/**
 * Pareto chart data point
 */
export interface ParetoDataPoint {
  key: string;
  value: number;
  cumulative: number;
  cumulativePercentage: number;
}

/**
 * Pareto chart props
 */
export interface ParetoChartProps extends BaseChartProps {
  /** Pareto data with counts and cumulative percentages */
  data: ParetoDataPoint[];
  /** Total count for percentage calculations */
  totalCount: number;
  /** X-axis label (factor name) */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Currently selected bars */
  selectedBars?: string[];
  /** Callback when a bar is clicked */
  onBarClick?: (key: string) => void;
  /** Callback when Y-axis label area is clicked (for editing) */
  onYAxisClick?: () => void;
  /** Callback when X-axis label area is clicked (for editing) */
  onXAxisClick?: () => void;
  /** Comparison data for ghost bars behind regular bars (key → expected value) */
  comparisonData?: Map<string, number>;
  /** Custom tooltip content renderer. Replaces default tooltip when provided. */
  tooltipContent?: (data: ParetoDataPoint) => React.ReactNode;
  /** Highlighted categories with annotation colors (category key → color) */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Callback when a bar is right-clicked (for annotation context menu) */
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Show rank change indicators when comparisonData is present */
  showRankChange?: boolean;
}

/**
 * Capability histogram props
 */
export interface CapabilityHistogramProps extends BaseChartProps {
  /** Raw numeric values */
  data: number[];
  /** Specification limits */
  specs: SpecLimits;
  /** Mean value for reference line */
  mean: number;
  /** Override X-axis domain (for locking scale to full dataset) - data values axis */
  xDomainOverride?: YAxisDomain;
}

/**
 * Probability plot props
 */
export interface ProbabilityPlotProps extends BaseChartProps {
  /** Raw numeric values */
  data: number[];
  /** Mean for theoretical line */
  mean: number;
  /** Standard deviation for theoretical line */
  stdDev: number;
  /** Optional custom margin override */
  marginOverride?: { top: number; right: number; bottom: number; left: number };
  /** Optional custom font sizes override */
  fontsOverride?: ChartFonts;
  /** Optional signature element to render */
  signatureElement?: React.ReactNode;
}

/**
 * Chart source bar props
 */
export interface ChartSourceBarProps {
  /** Width of the bar */
  width: number;
  /** Top position */
  top: number;
  /** Left position (default 0) */
  left?: number;
  /** Sample size to display */
  n?: number;
  /** Override branding text */
  brandingText?: string;
  /** Accent color (default blue) */
  accentColor?: string;
  /** Force show branding (overrides edition check) */
  forceShow?: boolean;
  /** Font size for branding text (from responsive fonts) */
  fontSize?: number;
}

// ============================================================================
// Performance Chart Types
// ============================================================================

/**
 * PerformanceIChart props - I-Chart for capability metrics (Cpk/Cp)
 */
export interface PerformanceIChartProps extends BaseChartProps {
  /** Channel results with Cpk values */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Callback when a channel point is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Which capability metric to display: 'cpk' (default), 'cp', or 'both' */
  capabilityMetric?: 'cp' | 'cpk' | 'both';
  /** User-defined Cpk/Cp target line (default: 1.33) */
  cpkTarget?: number;
  /** Custom Cpk thresholds for health classification (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
}

/**
 * PerformanceBoxplot props - Distribution comparison for channels
 */
export interface PerformanceBoxplotProps extends BaseChartProps {
  /** Channel results with values for boxplot calculation */
  channels: ChannelResult[];
  /** Specification limits for reference lines */
  specs: SpecLimits;
  /** Currently selected measure/channel (shows only this channel when set) */
  selectedMeasure?: string | null;
  /** Maximum number of channels to display (default: 5) */
  maxDisplayed?: number;
  /** Callback when a boxplot is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Show stats table below the chart (default: false) */
  showStatsTable?: boolean;
  /** Custom Cpk thresholds for health classification in stats table (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
  /** Show violin (density) overlay behind box elements (default: false) */
  showViolin?: boolean;
}

/**
 * PerformancePareto props - Cpk ranking chart (worst first)
 */
export interface PerformanceParetoProps extends BaseChartProps {
  /** Channel results for ranking */
  channels: ChannelResult[];
  /** Currently selected measure/channel */
  selectedMeasure?: string | null;
  /** Maximum number of channels to display (default: 20) */
  maxDisplayed?: number;
  /** Callback when a bar is clicked */
  onChannelClick?: (channelId: string) => void;
  /** Custom Cpk thresholds for health classification and reference lines (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
}

/**
 * PerformanceCapability props - Histogram for selected channel
 */
export interface PerformanceCapabilityProps extends BaseChartProps {
  /** Single channel result to display (null shows placeholder) */
  channel: ChannelResult | null;
  /** Specification limits for reference lines */
  specs: SpecLimits;
}
