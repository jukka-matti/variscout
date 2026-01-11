/**
 * Shared types for @variscout/charts
 * Props-based chart components for use across PWA and Excel Add-in
 */

import type {
  StatsResult,
  SpecLimits,
  GradeTier,
  StagedStatsResult,
  StageBoundary,
} from '@variscout/core';

// Re-export types from core for convenience
export type { SpecLimits, GradeTier, StagedStatsResult, StageBoundary };

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
  /** Grade tiers for multi-tier grading */
  grades?: GradeTier[];
  /** Y-axis label */
  yAxisLabel?: string;
  /** Axis settings for manual scaling */
  axisSettings?: { min?: number; max?: number };
  /** Callback when a point is clicked */
  onPointClick?: (index: number, originalIndex?: number) => void;
  /** Callback when brush selection changes */
  onBrushChange?: (range: [number, number] | null) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
}

/**
 * Simple boxplot input (just group name and values)
 * Use calculateBoxplotStats() to convert to BoxplotGroupData
 */
export interface BoxplotGroupInput {
  group: string;
  values: number[];
}

/**
 * Boxplot data structure for a single group (with pre-calculated stats)
 */
export interface BoxplotGroupData {
  key: string;
  values: number[];
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  outliers: number[];
}

/**
 * Calculate boxplot statistics from raw values
 */
export function calculateBoxplotStats(input: BoxplotGroupInput): BoxplotGroupData {
  const sorted = [...input.values].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 0) {
    return {
      key: input.group,
      values: [],
      min: 0,
      max: 0,
      q1: 0,
      median: 0,
      q3: 0,
      outliers: [],
    };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  // Q1 and Q3 using linear interpolation
  const q1Index = (n - 1) * 0.25;
  const q3Index = (n - 1) * 0.75;

  const q1 =
    sorted[Math.floor(q1Index)] +
    (q1Index % 1) * (sorted[Math.ceil(q1Index)] - sorted[Math.floor(q1Index)]);
  const q3 =
    sorted[Math.floor(q3Index)] +
    (q3Index % 1) * (sorted[Math.ceil(q3Index)] - sorted[Math.floor(q3Index)]);

  // Outliers: points beyond 1.5 * IQR
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

  return {
    key: input.group,
    values: input.values,
    min: Math.max(min, lowerFence),
    max: Math.min(max, upperFence),
    q1,
    median,
    q3,
    outliers,
  };
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
  /** Currently selected groups */
  selectedGroups?: string[];
  /** Callback when a box is clicked */
  onBoxClick?: (key: string) => void;
  /** Sample size for branding bar */
  sampleSize?: number;
  /** Variation % explained by this factor (for drill suggestion indicator) */
  variationPct?: number;
  /** Threshold for "high variation" highlight (default: 50) */
  variationThreshold?: number;
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
  fontsOverride?: { tickLabel: number; axisLabel: number };
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
}

/**
 * Chart margins
 */
export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Chart font sizes
 */
export interface ChartFonts {
  tickLabel: number;
  axisLabel: number;
  statLabel: number;
}
