/**
 * Shared type definitions for VariScout
 */

/**
 * Result of statistical calculations for a dataset
 */
export interface StatsResult {
  /** Arithmetic mean of all values */
  mean: number;
  /** Sample standard deviation */
  stdDev: number;
  /** Upper Control Limit (mean + 3σ) */
  ucl: number;
  /** Lower Control Limit (mean - 3σ) */
  lcl: number;
  /** Process Capability index - requires both USL and LSL */
  cp?: number;
  /** Process Capability index accounting for centering */
  cpk?: number;
  /** Percentage of values outside specification limits */
  outOfSpecPercentage: number;
  /** Distribution across grade tiers (if grades defined) */
  gradeCounts?: GradeCount[];
}

/**
 * Grade tier for multi-tier classification
 */
export interface GradeTier {
  max: number;
  label: string;
  color: string;
}

/**
 * Grade count result after classification
 */
export interface GradeCount {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Specification limits
 */
export interface SpecLimits {
  usl?: number;
  lsl?: number;
  target?: number;
}

/**
 * Result of conformance calculation
 */
export interface ConformanceResult {
  /** Count of values within spec */
  pass: number;
  /** Count of values above USL */
  failUsl: number;
  /** Count of values below LSL */
  failLsl: number;
  /** Total number of values */
  total: number;
  /** Pass rate as percentage (0-100) */
  passRate: number;
}

/**
 * Data point for probability plot with confidence interval
 */
export interface ProbabilityPlotPoint {
  /** Original data value */
  value: number;
  /** Expected percentile using Blom's formula */
  expectedPercentile: number;
  /** Lower bound of 95% CI */
  lowerCI: number;
  /** Upper bound of 95% CI */
  upperCI: number;
}

/**
 * Display options for capability metrics
 */
export interface DisplayOptions {
  showCp: boolean;
  showCpk: boolean;
  showSpecs?: boolean;
}

/**
 * Group statistics for ANOVA
 */
export interface AnovaGroup {
  /** Group name (factor level) */
  name: string;
  /** Sample size */
  n: number;
  /** Group mean */
  mean: number;
  /** Group standard deviation */
  stdDev: number;
}

/**
 * Result of one-way ANOVA calculation
 */
export interface AnovaResult {
  /** Statistics for each group */
  groups: AnovaGroup[];
  /** Sum of squares between groups */
  ssb: number;
  /** Sum of squares within groups */
  ssw: number;
  /** Degrees of freedom between groups (k-1) */
  dfBetween: number;
  /** Degrees of freedom within groups (N-k) */
  dfWithin: number;
  /** Mean square between groups */
  msb: number;
  /** Mean square within groups */
  msw: number;
  /** F-statistic (MSB / MSW) */
  fStatistic: number;
  /** P-value from F-distribution */
  pValue: number;
  /** Whether difference is statistically significant (p < 0.05) */
  isSignificant: boolean;
  /** Eta-squared effect size (SSB / SST) */
  etaSquared: number;
  /** Plain-language interpretation */
  insight: string;
}

/**
 * Linear regression fit results
 */
export interface LinearFit {
  /** Slope coefficient (β₁) */
  slope: number;
  /** Y-intercept (β₀) */
  intercept: number;
  /** Coefficient of determination (0-1) */
  rSquared: number;
  /** P-value for slope significance */
  pValue: number;
  /** Whether slope is statistically significant (p < 0.05) */
  isSignificant: boolean;
}

/**
 * Quadratic regression fit results
 */
export interface QuadraticFit {
  /** Coefficient for x² term */
  a: number;
  /** Coefficient for x term */
  b: number;
  /** Constant term */
  c: number;
  /** Coefficient of determination (0-1) */
  rSquared: number;
  /** X value at peak or valley (-b/2a) */
  optimumX: number | null;
  /** Whether optimum is a peak or valley */
  optimumType: 'peak' | 'valley' | null;
}

/**
 * Result of regression analysis for one X-Y pair
 */
export interface RegressionResult {
  /** X column name */
  xColumn: string;
  /** Y column name */
  yColumn: string;
  /** Sample size */
  n: number;
  /** Raw data points for plotting */
  points: Array<{ x: number; y: number }>;
  /** Linear fit: y = slope * x + intercept */
  linear: LinearFit;
  /** Quadratic fit: y = a*x² + b*x + c (null if not computed) */
  quadratic: QuadraticFit | null;
  /** Which fit is recommended based on R² improvement */
  recommendedFit: 'linear' | 'quadratic' | 'none';
  /** Star rating 1-5 based on R² strength */
  strengthRating: 1 | 2 | 3 | 4 | 5;
  /** Plain-language insight */
  insight: string;
}

/**
 * Interaction data point for Operator × Part plot
 */
export interface GageRRInteraction {
  /** Part identifier */
  part: string;
  /** Operator identifier */
  operator: string;
  /** Mean measurement for this Part × Operator combination */
  mean: number;
}

/**
 * Result of Gage R&R (Measurement System Analysis)
 */
export interface GageRRResult {
  // Input summary
  /** Number of unique parts measured */
  partCount: number;
  /** Number of operators */
  operatorCount: number;
  /** Number of replicate measurements per Part × Operator */
  replicates: number;
  /** Total number of measurements */
  totalMeasurements: number;

  // Variance components (σ² values)
  /** Part-to-part variance */
  varPart: number;
  /** Operator variance */
  varOperator: number;
  /** Operator × Part interaction variance */
  varInteraction: number;
  /** Repeatability variance (equipment variation) */
  varRepeatability: number;
  /** Reproducibility variance (operator + interaction) */
  varReproducibility: number;
  /** Total Gage R&R variance */
  varGRR: number;
  /** Total variance (Part + GRR) */
  varTotal: number;

  // Percentage contributions (based on σ, not σ²)
  /** % contribution from Part-to-Part */
  pctPart: number;
  /** % contribution from Repeatability */
  pctRepeatability: number;
  /** % contribution from Reproducibility */
  pctReproducibility: number;
  /** % Gage R&R (main result) */
  pctGRR: number;

  // Verdict
  /** Overall assessment */
  verdict: 'excellent' | 'marginal' | 'unacceptable';
  /** Plain-language verdict description */
  verdictText: string;

  // For interaction plot
  /** Data for Operator × Part interaction chart */
  interactionData: GageRRInteraction[];
}

/**
 * Stage order determination mode for I-Chart with stages
 */
export type StageOrderMode = 'auto' | 'first-occurrence' | 'alphabetical';

/**
 * Result of staged statistical calculations
 * Used when data is divided into distinct phases with separate control limits
 */
export interface StagedStatsResult {
  /** Stats calculated separately for each stage */
  stages: Map<string, StatsResult>;
  /** Ordered list of stage names (determines display order) */
  stageOrder: string[];
  /** Combined stats across all stages (for reference) */
  overallStats: StatsResult;
}

/**
 * Stage boundary information for chart rendering
 */
export interface StageBoundary {
  /** Stage name/label */
  name: string;
  /** Starting X index (inclusive) */
  startX: number;
  /** Ending X index (inclusive) */
  endX: number;
  /** Stats for this stage */
  stats: StatsResult;
}
