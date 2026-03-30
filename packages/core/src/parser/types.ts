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

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  excludedRows: ExcludedRow[];
  columnIssues: ColumnIssue[];
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
