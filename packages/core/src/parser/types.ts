/**
 * Parser module type definitions
 */

export interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  uniqueCount: number;
  hasVariation: boolean;
  missingCount: number;
  sampleValues: string[];
}

/**
 * Suggestion for stacking (unpivoting) wide-form columns.
 */
export interface StackSuggestion {
  /** Columns suggested for stacking */
  columnsToStack: string[];
  /** Columns to keep as-is (factors/metadata) */
  keepColumns: string[];
  /** Confidence in the suggestion */
  confidence: 'high' | 'medium' | 'low';
  /** AI-suggested measure name (only when AI available) */
  measureName?: string;
  /** AI-suggested label name (only when AI available) */
  labelName?: string;
}

export interface DetectedColumns {
  outcome: string | null;
  factors: string[];
  timeColumn: string | null;
  confidence: 'high' | 'medium' | 'low';
  columnAnalysis: ColumnAnalysis[];
  /** Suggestion for stacking wide-form data (present when 5+ numeric columns detected) */
  suggestedStack?: StackSuggestion;
}

export interface ExclusionReason {
  type: 'missing' | 'non_numeric' | 'empty';
  column: string;
  value?: string;
}

export interface ExcludedRow {
  index: number;
  reasons: ExclusionReason[];
}

export interface ColumnIssue {
  column: string;
  type: 'missing' | 'non_numeric' | 'no_variation' | 'all_empty';
  count: number;
  severity: 'warning' | 'info';
}

export interface PerOutcomeQuality {
  validCount: number;
  invalidCount: number;
  missingCount: number;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
  /** Per-outcome quality summary. Present when validateData is called with an array. */
  perOutcome: Record<string, PerOutcomeQuality>;
}

export interface ParetoRow {
  category: string;
  count: number;
  value?: number;
}

/**
 * Options for channel detection
 */
export interface DetectChannelsOptions {
  /** Minimum percentage of numeric values to consider a column as numeric (default: 0.9) */
  numericThreshold?: number;
  /** Minimum number of valid values required (default: 2) */
  minValidValues?: number;
}

/**
 * Options for wide format detection
 */
export interface DetectWideFormatOptions extends DetectChannelsOptions {
  /** Minimum number of similar numeric columns to consider wide format (default: 3) */
  minChannels?: number;
  /** Minimum percentage of channels with matching pattern for high confidence (default: 0.5) */
  patternMatchThreshold?: number;
}

/**
 * Options for column detection
 */
export interface DetectColumnsOptions {
  /**
   * Free-text description of the investigation goal (e.g. "Reduce defect rate at our line.").
   * Keywords extracted from this string are used to apply an additive score bonus to outcome
   * candidates whose column names share tokens with the goal. Does not replace keyword-based
   * scoring — purely additive (D4).
   */
  goalContext?: string;
}

/**
 * Per-column parsing analysis for the canvas palette (Spec 2 §3.1.1).
 * Sibling to ColumnAnalysis — focused on parse-ability, not role detection.
 */
export type ParsingStatus = 'ok' | 'warning' | 'error';

export interface ParsingInterpretation {
  /** Coarse kind for icon + grouping in the palette. */
  kind: 'numeric' | 'date' | 'categorical' | 'id' | 'text';
  /** Human-readable label, e.g. "numeric · EU decimal", "DD/MM/YYYY", "categorical · 4 levels". */
  label: string;
  /** Interpretation-specific machine-readable detail (decimal separator, date format string, affix, etc). */
  detail: Record<string, unknown>;
}

export interface ParsingAlternative {
  interpretation: ParsingInterpretation;
  /** How many non-null cells this interpretation successfully parses. */
  parseCount: number;
  /** Total non-null cells considered. */
  totalCount: number;
}

export interface ColumnParsingProfile {
  columnName: string;
  status: ParsingStatus;
  /** Whole-percent confidence in `primary` (0–100). Equals parseRate × 100 for the primary interpretation. */
  confidence: number;
  /** Best-fit interpretation. May be `null` when status is 'error' (no interpretation parses ≥ 1 cell). */
  primary: ParsingInterpretation | null;
  /** Other tried interpretations ranked by parseCount desc, excluding the primary. */
  alternatives: ParsingAlternative[];
  /** Up to 3 raw→transformed sample pairs (e.g. "182,5" → "182.5"). */
  transformedSamples: Array<{ raw: string; transformed: string }>;
  /** Whether this profile represents a derived/computed column (NOT a raw column from the data).
   *  Derived chips render in a separate palette group with a green tint + ✨ marker.
   *  D1: Task 8 adds the type; Task 10 (CanvasWorkspace integration) populates them. */
  derived?: boolean;
  /** When `derived === true`, indicates the source of the derivation. Drives the
   *  "DERIVED FROM ..." header label in the palette group. */
  derivationSource?: 'timings' | 'formula' | 'time-decomposition';
}
