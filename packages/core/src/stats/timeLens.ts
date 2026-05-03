/**
 * Time lens — global filter over the time-ordered observation set.
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
 * Returns the [start, end) indices that `applyTimeLens` would slice for the
 * given lens against an array of `length`. Always normalised so that
 * `0 <= start <= end <= length`. Empty windows give `start === end`.
 *
 * Use this when you have two parallel arrays (rows + values) and need to
 * apply the same lens window to both without object-reference tricks.
 */
export function timeLensIndices(length: number, lens: TimeLens): { start: number; end: number } {
  switch (lens.mode) {
    case 'cumulative':
      return { start: 0, end: length };
    case 'rolling': {
      if (lens.windowSize <= 0) return { start: length, end: length };
      const start = Math.max(0, length - lens.windowSize);
      return { start, end: length };
    }
    case 'fixed': {
      if (lens.anchor < 0 || lens.anchor >= length || lens.windowSize <= 0) {
        return { start: 0, end: 0 };
      }
      return { start: lens.anchor, end: Math.min(length, lens.anchor + lens.windowSize) };
    }
    case 'openEnded': {
      if (lens.anchor < 0 || lens.anchor >= length) return { start: 0, end: 0 };
      return { start: lens.anchor, end: length };
    }
    default:
      return assertNever(lens);
  }
}

/**
 * Apply a TimeLens to an already time-ordered row array and return a filtered copy.
 *
 * @param rows - Input rows in ascending time order. This array is **not mutated**.
 * @param lens - The lens variant that controls which rows are included.
 * @param timeColumn - The key of the time column on each row. **Accepted but unused
 *   in this implementation**: the function relies on the existing row order rather
 *   than sorting internally, because chart-data pipelines already sort once at the
 *   data-prep step. The parameter is part of the public signature so that callers
 *   can pass it without a future resignature.
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
      if (anchor < 0 || anchor >= rows.length || windowSize <= 0) return [];
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
