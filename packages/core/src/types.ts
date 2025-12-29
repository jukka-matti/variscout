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
