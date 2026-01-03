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
