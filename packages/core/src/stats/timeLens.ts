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

import { assertNever } from '../types';

export type TimeLens =
  | { mode: 'cumulative' }
  | { mode: 'rolling'; windowSize: number }
  | { mode: 'fixed'; anchor: number; windowSize: number }
  | { mode: 'openEnded'; anchor: number };

export type TimeLensMode = TimeLens['mode'];

export const DEFAULT_TIME_LENS = { mode: 'cumulative' } as const;

/**
 * Apply a TimeLens to an already time-ordered row array and return a filtered copy.
 *
 * @param rows - Input rows in ascending time order. This array is **not mutated**.
 * @param lens - The lens variant that controls which rows are included.
 * @param timeColumn - The key of the time column on each row. **Accepted but unused
 *   in this implementation**: the function relies on the existing row order rather
 *   than sorting internally, because chart-data pipelines already sort once at the
 *   data-prep step. The parameter is part of the public signature so that Task 3
 *   callers can pass it without a future resignature.
 * @returns A new array containing the selected rows (never a view into the original).
 */
export function applyTimeLens<T>(
  rows: readonly T[],
  lens: TimeLens,

  _timeColumn: keyof T | string
): T[] {
  switch (lens.mode) {
    case 'cumulative':
      // Identity — return all rows in the same order.
      return rows.slice();

    case 'rolling': {
      const { windowSize } = lens;
      if (windowSize <= 0) return [];
      return rows.slice(Math.max(0, rows.length - windowSize));
    }

    case 'fixed': {
      const { anchor, windowSize } = lens;
      if (anchor >= rows.length || windowSize <= 0) return [];
      return rows.slice(anchor, anchor + windowSize);
    }

    case 'openEnded': {
      const { anchor } = lens;
      if (anchor < 0 || anchor >= rows.length) return [];
      return rows.slice(anchor);
    }

    default:
      return assertNever(lens);
  }
}
