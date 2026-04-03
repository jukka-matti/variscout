/**
 * Variation module type definitions
 */

/**
 * Result item for optimal factor selection
 */
export interface OptimalFactorResult {
  /** Factor name */
  factor: string;
  /** Variation percentage for this factor (eta squared * 100 in findOptimalFactors) */
  variationPct: number;
  /** Best value for this factor (highest variation category) */
  bestValue?: string | number;
  /** Cumulative variation in focus after applying this and all previous factors */
  cumulativePct: number;
}

/**
 * Projected statistics if certain categories were excluded
 * Used for the Process Improvement Simulator (Phase 2: Interactive Toggle)
 */
export interface ProjectedStats {
  /** Projected mean after exclusions */
  mean: number;
  /** Projected standard deviation after exclusions */
  stdDev: number;
  /** Projected Cpk (requires specs) */
  cpk?: number;
  /** Projected Cp (requires both USL and LSL) */
  cp?: number;
  /** Number of remaining samples after exclusions */
  remainingCount: number;
  /** Percentage improvement in mean centering (closer to target) */
  meanImprovementPct?: number;
  /** Percentage reduction in standard deviation */
  stdDevReductionPct?: number;
  /** Percentage improvement in Cpk */
  cpkImprovementPct?: number;
}

/**
 * Statistics for a single category within a factor
 * Used for the Process Improvement Simulator (Phase 1: Category Breakdown)
 */
export interface CategoryStats {
  /** Category value (e.g., "Machine A", "Shift_1") */
  value: string | number;
  /** Number of samples in this category */
  count: number;
  /** Category mean */
  mean: number;
  /** Category standard deviation */
  stdDev: number;
}

/**
 * Parameters for direct adjustment simulation (What-If Simulator)
 */
export interface DirectAdjustmentParams {
  /** Absolute mean shift (+/- from current mean toward target) */
  meanShift: number;
  /** Variation reduction as decimal (0.0-0.5, meaning 0-50% reduction) */
  variationReduction: number;
}

/**
 * Result of overall impact simulation — how improving a filtered subset
 * affects the whole process
 */
export interface OverallImpactResult {
  currentOverall: { mean: number; stdDev: number; cpk?: number; yield?: number };
  projectedOverall: { mean: number; stdDev: number; cpk?: number; yield?: number };
  /** Fraction of total data in the adjusted subset (0-1) */
  subsetFraction: number;
  improvements: { cpkChange?: number; yieldChange?: number };
}

/**
 * Toolbar projection — compact result for the ProcessHealthBar
 */
export interface ProcessProjection {
  /** Current Cpk (from overall or filtered stats) */
  currentCpk: number;
  /** Projected Cpk after fix */
  projectedCpk: number;
  /** Description label: "if fixed", "if 3 fixed" */
  label: string;
  /** Number of findings contributing to this projection */
  findingCount: number;
}

/**
 * Centering opportunity (Cp vs Cpk gap)
 */
export interface CenteringOpportunity {
  /** Current Cpk (accounting for centering) */
  currentCpk: number;
  /** Process Capability (spread only, perfect centering) */
  cp: number;
  /** Gap (Cp - Cpk) — the "free win" from centering */
  gap: number;
}

/**
 * Data-driven specification suggestion from complement data
 */
export interface SpecSuggestion {
  /** Suggested lower specification limit */
  suggestedLsl: number;
  /** Suggested upper specification limit */
  suggestedUsl: number;
  /** Display label e.g. "Achievable: 10.0–11.8" */
  label: string;
}

/**
 * Result of direct adjustment simulation
 */
export interface DirectAdjustmentResult {
  /** Projected mean after adjustment */
  projectedMean: number;
  /** Projected standard deviation after reduction */
  projectedStdDev: number;
  /** Projected Cpk (if specs provided) */
  projectedCpk?: number;
  /** Projected Cp (if both USL and LSL provided) */
  projectedCp?: number;
  /** Projected yield percentage (% in spec) */
  projectedYield?: number;
  /** Projected parts per million defective */
  projectedPPM?: number;
  /** Improvement metrics */
  improvements: {
    /** Percentage improvement in Cpk */
    cpkImprovementPct?: number;
    /** Absolute change in yield percentage */
    yieldImprovementPct?: number;
  };
}
