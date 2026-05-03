/**
 * Time lens — global filter over the time-ordered observation set.
 *
 * Tasks 3+ wire chart-data hooks and page-level stats to consume this lens; this
 * module owns only the type + default. The legacy I-Chart segmented buttons
 * (Fixed / Rolling / Open-ended / Cumulative) are removed in Task 5.
 */

export type TimeLensMode = 'cumulative' | 'fixed' | 'rolling' | 'openEnded';

export interface TimeLens {
  mode: TimeLensMode;
  /** Required for 'rolling' (last N) and 'fixed' (window of N from anchor). Omitted for 'cumulative'. */
  windowSize?: number;
  /** Required for 'fixed' and 'openEnded' (start index in the time-ordered row set). Omitted for 'cumulative' and 'rolling'. */
  anchor?: number;
}

export const DEFAULT_TIME_LENS: TimeLens = { mode: 'cumulative' };
