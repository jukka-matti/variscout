// DocumentInfo is defined in @variscout/hooks (hooks layer) to avoid upward imports.
// Re-exported here for convenience within @variscout/ui.
export type { DocumentInfo } from '@variscout/hooks';

export interface AutoIndexSummaryData {
  findings: number;
  answers: number;
  conclusions: number;
}
