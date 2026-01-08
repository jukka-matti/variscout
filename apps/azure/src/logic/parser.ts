/**
 * Parser utilities - re-exported from @variscout/core
 *
 * This file re-exports all parser functionality from the shared core package
 * for backwards compatibility with existing imports.
 */

// Re-export types
export type {
  ColumnAnalysis,
  DetectedColumns,
  ExclusionReason,
  ExcludedRow,
  ColumnIssue,
  DataQualityReport,
  ParetoRow,
} from '@variscout/core';

// Re-export functions
export {
  parseCSV,
  parseExcel,
  detectColumns,
  validateData,
  parseParetoFile,
} from '@variscout/core';
