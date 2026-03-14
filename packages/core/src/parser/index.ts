/**
 * Parser module — barrel re-export
 *
 * All consumer imports remain unchanged:
 *   import { parseCSV, detectColumns } from '@variscout/core'
 *
 * Internal structure:
 *   types.ts       — Type definitions (ColumnAnalysis, DetectedColumns, etc.)
 *   keywords.ts    — OUTCOME_KEYWORDS, FACTOR_KEYWORDS, channel/metadata patterns
 *   csv.ts         — parseCSV, parseText (PapaParse)
 *   excel.ts       — parseExcel (ExcelJS)
 *   detection.ts   — analyzeColumn, detectColumns, detectChannelColumns, detectWideFormat
 *   validation.ts  — validateData
 *   pareto.ts      — parseParetoFile
 */

// Types
export type {
  ColumnAnalysis,
  DetectedColumns,
  ExclusionReason,
  ExcludedRow,
  ColumnIssue,
  DataQualityReport,
  ParetoRow,
  DetectChannelsOptions,
  DetectWideFormatOptions,
} from './types';

// CSV/text parsing
export { parseCSV, parseText } from './csv';

// Excel parsing
export { parseExcel } from './excel';

// Column detection and wide format
export { detectColumns, detectChannelColumns, detectWideFormat } from './detection';

// Data validation
export { validateData } from './validation';

// Pareto file parsing
export { parseParetoFile } from './pareto';

// Factor role inference (AI context)
export { FACTOR_ROLE_KEYWORDS, inferFactorRole } from './keywords';
