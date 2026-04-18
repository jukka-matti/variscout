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

/**
 * Pre-populated investigation state for showcase/demo datasets.
 * When present, loadSample injects this into DataContext so the
 * dataset opens with questions, findings, and hubs already in place.
 */
export interface SampleInvestigationState {
  findings?: import('@variscout/core').Finding[];
  questions?: import('@variscout/core').Question[];
  suspectedCauses?: import('@variscout/core').SuspectedCause[];
  causalLinks?: import('@variscout/core').CausalLink[];
  categories?: import('@variscout/core').InvestigationCategory[];
}

/** Seed of the FRAME Process Map for a showcase — loadSample writes this to processContext. */
export type SampleProcessMap = import('@variscout/core/frame').ProcessMap;

export interface SampleConfig {
  /** Column name for the measurement/outcome variable */
  outcome: string;
  /** Column names for factor/grouping variables */
  factors: string[];
  /** Specification limits */
  specs: SpecLimits;
  /** Analysis mode (standard, performance, yamazumi, or defect) */
  analysisMode?: 'standard' | 'performance' | 'yamazumi' | 'defect';
  /** Column names for measure variables (wide format data) */
  measureColumns?: string[];
  /** Enable Yamazumi analysis mode (time study analysis) */
  yamazumiMode?: boolean;
  /** Yamazumi column role mapping */
  yamazumiMapping?: {
    activityTypeColumn: string;
    cycleTimeColumn: string;
    stepColumn: string;
    activityColumn?: string;
    reasonColumn?: string;
    productColumn?: string;
    waitTimeColumn?: string;
  };
  /** Defect column role mapping */
  defectMapping?: {
    dataShape: 'event-log' | 'pre-aggregated' | 'pass-fail';
    defectTypeColumn?: string;
    countColumn?: string;
    resultColumn?: string;
    aggregationUnit: string;
    unitsProducedColumn?: string;
  };
  /** Pre-populated investigation state for showcase/demo datasets */
  investigation?: SampleInvestigationState;
  /**
   * Pre-seeded FRAME Process Map. Populated on showcase/demo datasets so the
   * Frame workspace opens with a completed SIPOC spine that matches the
   * investigation story — no rebuild required. ADR-070.
   */
  processMap?: SampleProcessMap;
  /** Rational subgrouping config (rolling n, or group-by-column). Seeds projectStore.subgroupConfig. */
  subgroupConfig?: import('@variscout/core').SubgroupConfig;
  /** Default display options on load (e.g. standardIChartMetric). Merged into projectStore.displayOptions. */
  displayOptions?: Partial<import('@variscout/core').DisplayOptions>;
  /** Pre-aggregated Pareto data (e.g. QC defect counts). When present, loadSample switches paretoMode to 'separate'. */
  separateParetoData?: import('@variscout/core').ParetoRow[];
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
