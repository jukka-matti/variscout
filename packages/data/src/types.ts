/**
 * Category for grouping samples in the UI
 */
export type SampleCategory = 'featured' | 'cases' | 'journeys' | 'standard';

/**
 * Sample dataset configuration for VariScout demos and case studies
 */
export interface SampleDataset {
  /** Display name */
  name: string;
  /** Brief description of the case/scenario */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** URL-friendly key for ?sample= parameter */
  urlKey: string;
  /** Category for grouping in UI */
  category: SampleCategory;
  /** Show as visual card in web demo mode */
  featured: boolean;
  /** Raw data records */
  data: Record<string, unknown>[];
  /** Analysis configuration */
  config: SampleConfig;
}

export interface SampleConfig {
  /** Column name for the measurement/outcome variable */
  outcome: string;
  /** Column names for factor/grouping variables */
  factors: string[];
  /** Specification limits */
  specs: SpecLimits;
  /** Enable performance mode (multi-measure Cpk analysis) */
  performanceMode?: boolean;
  /** Column names for measure variables (wide format data) */
  measureColumns?: string[];
}

export interface SpecLimits {
  /** Upper specification limit */
  usl?: number;
  /** Lower specification limit */
  lsl?: number;
  /** Target value */
  target?: number;
}

/**
 * Pre-computed chart data for a sample dataset
 */
export interface ComputedChartData {
  /** URL key to match with SampleDataset */
  urlKey: string;
  /** I-Chart data points */
  ichartData: IChartPoint[];
  /** Boxplot grouped data */
  boxplotData: BoxplotGroup[];
  /** Pareto frequency data */
  paretoData: ParetoItem[];
  /** Pre-calculated statistics */
  stats: PrecomputedStats;
  /** Specs from the sample config */
  specs: SpecLimits;
}

export interface IChartPoint {
  x: number;
  y: number;
  originalIndex: number;
  stage?: string;
}

export interface BoxplotGroup {
  key: string;
  values: number[];
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  outliers: number[];
  mean: number;
  stdDev: number;
  variationPct?: number;
}

export interface ParetoItem {
  key: string;
  value: number;
  cumulative: number;
  cumulativePercentage: number;
}

export interface PrecomputedStats {
  n: number;
  mean: number;
  /** Median (50th percentile) */
  median: number;
  stdDev: number;
  /** Within-subgroup standard deviation estimated from moving range (MR̄/d2) */
  sigmaWithin: number;
  /** Mean moving range (MR̄ = mean of |x_i - x_{i-1}|) */
  mrBar: number;
  min: number;
  max: number;
  ucl: number;
  lcl: number;
  cp?: number;
  cpk?: number;
  outOfSpecPercentage: number;
}
