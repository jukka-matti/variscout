/**
 * Time lens — global filter over the time-ordered observation set.
 *
 * Tasks 3+ wire chart-data hooks and page-level stats to consume this lens; this
 * module owns only the type + default. The legacy I-Chart segmented buttons
 * (Fixed / Rolling / Open-ended / Cumulative) are removed in Task 5.
 *
 * Each mode carries exactly the fields it requires — invalid combinations are
 * rejected at compile time by the discriminated union.
 */

export type TimeLens =
  | { mode: 'cumulative' }
  | { mode: 'rolling'; windowSize: number }
  | { mode: 'fixed'; anchor: number; windowSize: number }
  | { mode: 'openEnded'; anchor: number };

export type TimeLensMode = TimeLens['mode'];

export const DEFAULT_TIME_LENS = { mode: 'cumulative' } as const;
