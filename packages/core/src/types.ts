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
  /** Median (50th percentile) */
  median: number;
  /** Sample standard deviation (σ_overall) — used by ANOVA, variation tracking, etc. */
  stdDev: number;
  /** Within-subgroup standard deviation estimated from moving range (MR̄/d2) */
  sigmaWithin: number;
  /** Mean moving range (MR̄ = mean of |x_i - x_{i-1}|) */
  mrBar: number;
  /** Upper Control Limit (mean + 3 × σ_within) */
  ucl: number;
  /** Lower Control Limit (mean - 3 × σ_within) */
  lcl: number;
  /** Process Capability index (uses σ_within) - requires both USL and LSL */
  cp?: number;
  /** Process Capability index accounting for centering (uses σ_within) */
  cpk?: number;
  /** Percentage of values outside specification limits */
  outOfSpecPercentage: number;
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
 * Nelson Rule 3 sequence detection result
 * Represents a consecutive run of 6+ strictly increasing or decreasing points
 */
export interface NelsonRule3Sequence {
  /** Starting index of the sequence (inclusive) */
  startIndex: number;
  /** Ending index of the sequence (inclusive) */
  endIndex: number;
  /** Direction of the trend */
  direction: 'increasing' | 'decreasing';
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
  /** Show filter context bar inside chart cards for copy-to-clipboard (default: true) */
  showFilterContext?: boolean;
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
 * Stage order determination mode for I-Chart with stages
 * - 'auto': Detects numeric patterns and sorts accordingly, otherwise uses data order
 * - 'data-order': Preserves original data sequence (as in data)
 */
export type StageOrderMode = 'auto' | 'data-order';

/**
 * Analysis mode — determines chart layout and data pipeline
 * - 'standard': SPC analysis (I-Chart + Boxplot + Pareto + Stats)
 * - 'performance': Multi-channel analysis (Cpk Scatter + Boxplot + Pareto + Stats)
 * - 'yamazumi': Lean time study analysis (I-Chart + Yamazumi + Pareto + Summary)
 */
export type AnalysisMode = 'standard' | 'performance' | 'yamazumi';

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
// Boxplot Types - Statistical visualization
// ============================================================================

/** Boxplot sort criterion */
export type BoxplotSortBy = 'name' | 'mean' | 'spread';

/** Boxplot sort direction */
export type BoxplotSortDirection = 'asc' | 'desc';

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
  mean: number;
  q3: number;
  outliers: number[];
  stdDev: number;
}

// ============================================================================
// Licensing and Tier Types - Multi-tier subscription system
// ============================================================================

/**
 * License tier for VariScout distribution
 * - free: Demo tier (PWA, 5 channels max)
 * - enterprise: Azure Managed Application (all features, 1500 channels)
 */
export type LicenseTier = 'free' | 'enterprise';

/**
 * Marketplace plan for Azure Managed Application
 * - standard: Full analysis with CoScout AI, local file storage (€79/month)
 * - team: + OneDrive, SharePoint, Teams, Knowledge Base (€199/month)
 *
 * Orthogonal to LicenseTier: both plans are 'enterprise' tier (same analysis features).
 * Plan controls collaboration features; tier controls analysis features.
 */
export type MarketplacePlan = 'standard' | 'team';

/**
 * Tier-specific limits for feature gating
 */
export interface TierLimits {
  /** Maximum number of measurement channels allowed */
  maxChannels: number;
}

/**
 * Channel limit validation result
 */
export interface ChannelLimitResult {
  /** Whether the current channel count exceeds the limit */
  exceeded: boolean;
  /** Current channel count */
  current: number;
  /** Maximum allowed for the tier */
  max: number;
  /** Whether to show a performance warning (soft limit) */
  showWarning: boolean;
}

// ============================================================================
// Chart Data Point Types (shared between hooks and charts packages)
// ============================================================================

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
  /** Factor column values for tooltip display (e.g., {Month: "Jul", Year: "2019"}) */
  factorValues?: Record<string, string>;
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
