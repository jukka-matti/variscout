/**
 * Shared type definitions for VariScout
 */

// Re-export performance types
export type { CpkThresholds } from './performance';

// ============================================================================
// Data Row Types - Foundation for type-safe data handling
// ============================================================================

/**
 * Valid values that can appear in a data cell
 * Covers all typical CSV/Excel cell types
 */
export type DataCellValue = string | number | boolean | null | undefined;

/**
 * A single row of data with dynamic column names
 * Replaces `any[]` throughout the data layer
 *
 * @example
 * const row: DataRow = {
 *   'Product': 'Widget A',
 *   'Weight': 12.5,
 *   'Pass': true,
 *   'Notes': null
 * };
 */
export interface DataRow {
  [columnName: string]: DataCellValue;
}

/**
 * Type guard to check if a value is a valid numeric value
 * Filters out NaN, Infinity, and non-number types
 *
 * @param value - The cell value to check
 * @returns true if the value is a finite number
 *
 * @example
 * if (isNumericValue(row['Weight'])) {
 *   // TypeScript knows row['Weight'] is a number here
 *   const weight: number = row['Weight'];
 * }
 */
export function isNumericValue(value: DataCellValue): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if a value is a non-empty string
 *
 * @param value - The cell value to check
 * @returns true if the value is a non-empty string
 */
export function isStringValue(value: DataCellValue): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Extract numeric value from a cell, parsing strings if needed
 * Returns undefined if the value cannot be converted to a number
 *
 * @param value - The cell value to extract
 * @returns The numeric value or undefined
 *
 * @example
 * toNumericValue('12.5') // 12.5
 * toNumericValue(12.5)   // 12.5
 * toNumericValue('abc')  // undefined
 * toNumericValue(null)   // undefined
 */
export function toNumericValue(value: DataCellValue): number | undefined {
  if (typeof value === 'number') {
    return isFinite(value) && !isNaN(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isFinite(parsed) && !isNaN(parsed) ? parsed : undefined;
  }
  return undefined;
}

// ============================================================================
// Statistics Result Types
// ============================================================================

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
 * Quality characteristic type for process capability interpretation
 * - 'nominal': Both limits exist, target is ideal (e.g., fill weight)
 * - 'smaller': Only USL exists, smaller is better (e.g., defects, cycle time)
 * - 'larger': Only LSL exists, larger is better (e.g., yield, strength)
 */
export type CharacteristicType = 'nominal' | 'smaller' | 'larger';

/**
 * Specification limits
 */
export interface SpecLimits {
  usl?: number;
  lsl?: number;
  target?: number;
  /** Quality characteristic type (inferred from specs if not set) */
  characteristicType?: CharacteristicType;
}

/**
 * Nelson Rule 2 sequence detection result
 * Represents a consecutive run of 9+ points on one side of the mean
 */
export interface NelsonRule2Sequence {
  /** Starting index of the sequence (inclusive) */
  startIndex: number;
  /** Ending index of the sequence (inclusive) */
  endIndex: number;
  /** Which side of the mean ('above' or 'below') */
  side: 'above' | 'below';
}

/**
 * Infer quality characteristic type from specification limits
 *
 * @param specs - Specification limits
 * @returns CharacteristicType based on which specs are present:
 *   - 'nominal' if both USL and LSL are defined
 *   - 'smaller' if only USL is defined (smaller-is-better)
 *   - 'larger' if only LSL is defined (larger-is-better)
 *   - 'nominal' as fallback if no specs are defined
 *
 * @example
 * inferCharacteristicType({ usl: 100, lsl: 90 })  // 'nominal'
 * inferCharacteristicType({ usl: 5 })              // 'smaller'
 * inferCharacteristicType({ lsl: 80 })             // 'larger'
 * inferCharacteristicType({})                      // 'nominal'
 */
export function inferCharacteristicType(specs: SpecLimits): CharacteristicType {
  // If explicitly set, use that value
  if (specs.characteristicType) {
    return specs.characteristicType;
  }

  const hasUSL = specs.usl !== undefined;
  const hasLSL = specs.lsl !== undefined;

  if (hasUSL && hasLSL) {
    return 'nominal';
  } else if (hasUSL && !hasLSL) {
    return 'smaller';
  } else if (!hasUSL && hasLSL) {
    return 'larger';
  }

  // Default fallback when no specs defined
  return 'nominal';
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
  /** Expected percentile using Median Rank (Benard) formula */
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
 * - 'auto': Detects numeric patterns and sorts accordingly, otherwise uses data order
 * - 'data-order': Preserves original data sequence (as in data)
 */
export type StageOrderMode = 'auto' | 'data-order';

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

// ============================================================================
// Performance Module Types - Multi-channel process analysis
// ============================================================================

/**
 * Channel health classification based on Cpk thresholds
 * - critical: Cpk < 1.0 (process is not capable)
 * - warning: 1.0 <= Cpk < 1.33 (process barely capable)
 * - capable: 1.33 <= Cpk < 1.67 (process is capable)
 * - excellent: Cpk >= 1.67 (process is highly capable)
 */
export type ChannelHealth = 'critical' | 'warning' | 'capable' | 'excellent';

/**
 * Channel detection result for wide format data
 */
export interface ChannelInfo {
  /** Column name (channel identifier) */
  id: string;
  /** Display label (may be aliased) */
  label: string;
  /** Number of valid measurements */
  n: number;
  /** Quick preview stats */
  preview: {
    min: number;
    max: number;
    mean: number;
  };
  /** Whether column name matches channel patterns (V1, Valve_1, etc.) */
  matchedPattern: boolean;
}

/**
 * Per-channel statistics result
 */
export interface ChannelResult {
  /** Column name (channel identifier) */
  id: string;
  /** Display label */
  label: string;
  /** Sample size */
  n: number;
  /** Mean value */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Process capability index (if both specs defined) */
  cp?: number;
  /** Process capability index accounting for centering */
  cpk?: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Health classification based on Cpk */
  health: ChannelHealth;
  /** Percentage of values outside specification limits */
  outOfSpecPercentage: number;
  /** Raw measurement values for detailed analysis */
  values: number[];
}

/**
 * Summary statistics across all channels
 */
export interface PerformanceSummary {
  /** Total number of channels analyzed */
  totalChannels: number;
  /** Count by health classification */
  healthCounts: Record<ChannelHealth, number>;
  /** Overall statistics across all channels */
  overall: {
    meanCpk: number;
    minCpk: number;
    maxCpk: number;
    stdDevCpk: number;
  };
  /** Channels that need attention (critical + warning) */
  needsAttentionCount: number;
}

/**
 * Complete performance analysis result
 */
export interface ChannelPerformanceData {
  /** Per-channel results */
  channels: ChannelResult[];
  /** Summary statistics */
  summary: PerformanceSummary;
  /** Specification limits used */
  specs: SpecLimits;
}

/**
 * Wide format detection result
 */
export interface WideFormatDetection {
  /** Whether data appears to be wide format (multiple channels) */
  isWideFormat: boolean;
  /** Detected channel columns */
  channels: ChannelInfo[];
  /** Non-channel columns (metadata like date, batch, etc.) */
  metadataColumns: string[];
  /** Detection confidence */
  confidence: 'high' | 'medium' | 'low';
  /** Reason for classification */
  reason: string;
}

// ============================================================================
// Multiple Regression Types - General Linear Model (GLM) support
// ============================================================================

/**
 * Options for multiple regression analysis
 */
export interface MultiRegressionOptions {
  /** Include two-way interaction terms between predictors (default: false) */
  includeInteractions?: boolean;
  /** Column names to treat as categorical (dummy-encoded) */
  categoricalColumns?: string[];
  /** Use forward selection to auto-select significant predictors (default: false) */
  autoSelect?: boolean;
  /** P-value threshold for auto-selection (default: 0.05) */
  pValueThreshold?: number;
}

/**
 * Represents a term in the regression model
 * Can be a single predictor or an interaction
 */
export interface RegressionTerm {
  /** Original column name(s) */
  columns: string[];
  /** Display name for the term (e.g., "Temp", "Machine_B", "Temp × Press") */
  label: string;
  /** Term type */
  type: 'continuous' | 'categorical' | 'interaction';
  /** For categorical: the level this dummy represents */
  level?: string;
  /** For categorical: the reference level */
  referenceLevel?: string;
}

/**
 * Result for a single coefficient in the model
 */
export interface CoefficientResult {
  /** Term label (e.g., "Temperature", "Machine_B", "Temp × Press") */
  term: string;
  /** Regression coefficient (β) */
  coefficient: number;
  /** Standard error of the coefficient */
  stdError: number;
  /** t-statistic for testing H₀: β = 0 */
  tStatistic: number;
  /** Two-tailed p-value */
  pValue: number;
  /** Whether coefficient is statistically significant (p < 0.05) */
  isSignificant: boolean;
  /** Standardized coefficient (beta weight) for importance ranking */
  standardized: number;
  /** Variance Inflation Factor for this predictor */
  vif?: number;
  /** Term metadata */
  termInfo: RegressionTerm;
}

/**
 * VIF (Variance Inflation Factor) warning for multicollinearity
 */
export interface VIFWarning {
  /** Term with high VIF */
  term: string;
  /** VIF value */
  vif: number;
  /** Severity level based on VIF value */
  severity: 'moderate' | 'high' | 'severe';
  /** Suggested action */
  suggestion: string;
}

/**
 * Result of multiple regression analysis
 */
export interface MultiRegressionResult {
  /** Response (Y) column name */
  yColumn: string;
  /** Predictor column names (original columns, not dummy-encoded) */
  xColumns: string[];
  /** All terms in the model (includes dummies and interactions) */
  terms: RegressionTerm[];
  /** Sample size (rows used in analysis) */
  n: number;
  /** Number of predictors (degrees of freedom for regression) */
  p: number;

  // Fit statistics
  /** Coefficient of determination (0-1) */
  rSquared: number;
  /** Adjusted R² accounting for number of predictors */
  adjustedRSquared: number;
  /** F-statistic for overall model significance */
  fStatistic: number;
  /** P-value for F-test */
  pValue: number;
  /** Whether model is statistically significant (p < 0.05) */
  isSignificant: boolean;
  /** Root Mean Square Error */
  rmse: number;

  // Coefficients
  /** Intercept (β₀) */
  intercept: number;
  /** Coefficient results for each term */
  coefficients: CoefficientResult[];

  // Diagnostics
  /** VIF warnings for multicollinearity */
  vifWarnings: VIFWarning[];
  /** Whether any severe multicollinearity was detected */
  hasCollinearity: boolean;

  // Insights
  /** Plain-language interpretation of results */
  insight: string;
  /** Top predictors ranked by absolute standardized coefficient */
  topPredictors: string[];

  /** Star rating 1-5 based on adjusted R² strength */
  strengthRating: 1 | 2 | 3 | 4 | 5;
}
