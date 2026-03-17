/**
 * Variation module type definitions
 */

/**
 * Result of drill variation calculation
 */
export interface DrillVariationResult {
  /**
   * Array of variation data for each drill level
   * Index 0 is root (100%), subsequent indices match filter order
   */
  levels: DrillLevelVariation[];

  /**
   * Final cumulative scope percentage (product of all level scope fractions)
   * Represents what fraction of total variation is in the current focus
   */
  cumulativeVariationPct: number;

  /**
   * Impact level based on cumulative scope
   */
  impactLevel: 'high' | 'moderate' | 'low';

  /**
   * Insight text for the current cumulative scope
   */
  insightText: string;
}

/**
 * Variation data for a single drill level
 */
export interface DrillLevelVariation {
  /** Factor name (null for root level) */
  factor: string | null;

  /** Filter values at this level (null for root) */
  values: (string | number)[] | null;

  /** Local scope % at this level: selected categories' Total SS fraction (100 for root) */
  localVariationPct: number;

  /** Cumulative scope % up to and including this level */
  cumulativeVariationPct: number;
}

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
  /** Percentage of total variation contributed by this category (0-100) */
  contributionPct: number;
}

/**
 * Result of Total SS contribution calculation per category
 */
export interface CategoryTotalSSResult {
  /**
   * Map from category value to percentage of total SS
   * This captures both mean shift AND spread (within-group variation)
   */
  contributions: Map<string | number, number>;

  /**
   * Total SS for reference
   */
  ssTotal: number;
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
