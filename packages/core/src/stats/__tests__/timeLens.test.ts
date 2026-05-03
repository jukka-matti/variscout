import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIME_LENS,
  applyTimeLens,
  type TimeLens,
  type TimeLensMode,
} from '@variscout/core';

describe('timeLens — module', () => {
  it('DEFAULT_TIME_LENS is cumulative (frozen literal)', () => {
    expect(DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
    expect(DEFAULT_TIME_LENS.mode).toBe('cumulative');
  });

  it('TimeLensMode union accepts the four documented modes', () => {
    const modes: TimeLensMode[] = ['cumulative', 'fixed', 'rolling', 'openEnded'];
    expect(modes).toHaveLength(4);
  });

  it('rolling mode requires windowSize', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 50 };
    expect(lens.mode).toBe('rolling');
    expect(lens.windowSize).toBe(50);
  });

  it('fixed mode requires both anchor and windowSize', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 10, windowSize: 30 };
    expect(lens.mode).toBe('fixed');
    expect(lens.anchor).toBe(10);
    expect(lens.windowSize).toBe(30);
  });

  it('openEnded mode requires anchor only', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 5 };
    expect(lens.mode).toBe('openEnded');
    expect(lens.anchor).toBe(5);
  });
});

describe('timeLens — barrel re-export from @variscout/core', () => {
  it('exposes DEFAULT_TIME_LENS via @variscout/core barrel', () => {
    expect(DEFAULT_TIME_LENS).toEqual({ mode: 'cumulative' });
  });
});

// ---------------------------------------------------------------------------
// applyTimeLens tests
// ---------------------------------------------------------------------------

const ROWS = [
  { t: 0, v: 10 },
  { t: 1, v: 20 },
  { t: 2, v: 30 },
  { t: 3, v: 40 },
  { t: 4, v: 50 },
] as const;

type Row = { t: number; v: number };
// Cast to mutable for use with applyTimeLens (readonly T[] → T[])
const rows: readonly Row[] = ROWS;

describe('applyTimeLens — cumulative', () => {
  const lens: TimeLens = { mode: 'cumulative' };

  it('returns a new array (not the same reference)', () => {
    const result = applyTimeLens(rows, lens, 't');
    expect(result).not.toBe(rows);
  });

  it('returns all rows in the same order', () => {
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toHaveLength(rows.length);
    expect(result).toEqual([...rows]);
  });
});

describe('applyTimeLens — rolling', () => {
  it('returns the last N rows for a typical window', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 3 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([
      { t: 2, v: 30 },
      { t: 3, v: 40 },
      { t: 4, v: 50 },
    ]);
  });

  it('returns all rows when windowSize exceeds length', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 100 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([...rows]);
  });

  it('returns empty array when windowSize is 0', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 0 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty array when windowSize is negative', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: -5 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });
});

describe('applyTimeLens — fixed', () => {
  it('returns the slice [anchor, anchor+windowSize)', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 1, windowSize: 3 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([
      { t: 1, v: 20 },
      { t: 2, v: 30 },
      { t: 3, v: 40 },
    ]);
  });

  it('truncates when window extends past the end', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 3, windowSize: 5 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([
      { t: 3, v: 40 },
      { t: 4, v: 50 },
    ]);
  });

  it('returns empty when anchor equals length', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: rows.length, windowSize: 2 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty when anchor is beyond length', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 99, windowSize: 2 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty when windowSize is 0', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 0, windowSize: 0 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty when windowSize is negative', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 0, windowSize: -1 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });
});

describe('applyTimeLens — openEnded', () => {
  it('returns all rows from anchor to end', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 2 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([
      { t: 2, v: 30 },
      { t: 3, v: 40 },
      { t: 4, v: 50 },
    ]);
  });

  it('returns all rows when anchor is 0', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 0 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([...rows]);
  });

  it('returns empty when anchor equals length', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: rows.length };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty when anchor is beyond length', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 99 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });

  it('returns empty when anchor is negative', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: -1 };
    const result = applyTimeLens(rows, lens, 't');
    expect(result).toEqual([]);
  });
});

describe('applyTimeLens — input immutability', () => {
  it('does not mutate the input array', () => {
    const mutableRows: Row[] = [
      { t: 0, v: 10 },
      { t: 1, v: 20 },
      { t: 2, v: 30 },
    ];
    const snapshot = [...mutableRows];

    applyTimeLens(mutableRows, { mode: 'cumulative' }, 't');
    applyTimeLens(mutableRows, { mode: 'rolling', windowSize: 2 }, 't');
    applyTimeLens(mutableRows, { mode: 'fixed', anchor: 0, windowSize: 2 }, 't');
    applyTimeLens(mutableRows, { mode: 'openEnded', anchor: 1 }, 't');

    expect(mutableRows).toEqual(snapshot);
    expect(mutableRows).toHaveLength(3);
  });

  it('two calls with identical lens produce deep-equal results', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 3 };
    const first = applyTimeLens(rows, lens, 't');
    const second = applyTimeLens(rows, lens, 't');
    expect(first).toEqual(second);
  });
});
