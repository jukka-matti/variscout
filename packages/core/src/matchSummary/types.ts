export type SourceAxisCase =
  | 'same-source'
  | 'different-source-joinable'
  | 'different-source-no-key'
  | 'mixed';

export type TemporalAxisCase =
  | 'append'
  | 'backfill'
  | 'overlap'
  | 'replace'
  | 'no-timestamp'
  | 'different-grain';

export type BlockReason = 'overlap' | 'different-grain' | 'different-source-no-key';

export interface MatchSummaryClassification {
  source: SourceAxisCase;
  temporal: TemporalAxisCase;
  blockReasons: BlockReason[];
  /** Existing snapshot range derived from hub's most recent snapshot. */
  existingRange?: { startISO: string; endISO: string };
  /** New paste range (when timeColumn detected and parseable). */
  newRange?: { startISO: string; endISO: string };
  /** Overlap range when temporal === 'overlap'. */
  overlapRange?: { startISO: string; endISO: string };
  /** Estimated duplicate-row rate when temporal === 'replace'. */
  duplicateRate?: number;
}

export interface ClassifyPasteContext {
  /** Existing hub data shape — column names from previous snapshots. */
  hubColumns: readonly string[];
  /** Existing time-anchored snapshot range; absent if no time column or no snapshots. */
  existingRange?: { startISO: string; endISO: string };
  /** Existing rows for duplicate-detection on temporal = 'replace'. */
  existingRows?: ReadonlyArray<Record<string, unknown>>;
  /** Detected time column name on existing data. */
  existingTimeColumn?: string;
}

export interface ClassifyPasteInput {
  newColumns: readonly string[];
  newRows: ReadonlyArray<Record<string, unknown>>;
  newTimeColumn?: string;
}
