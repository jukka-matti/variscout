import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIME_LENS,
  applyTimeLens,
  timeLensIndices,
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

  it('returns empty when anchor is negative', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: -1, windowSize: 2 };
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

describe('applyTimeLens — empty rows', () => {
  const emptyRows: { t: number; v: number }[] = [];

  it('cumulative returns empty array', () => {
    const result = applyTimeLens(emptyRows, { mode: 'cumulative' }, 't');
    expect(result).toEqual([]);
  });

  it('rolling returns empty array', () => {
    const result = applyTimeLens(emptyRows, { mode: 'rolling', windowSize: 5 }, 't');
    expect(result).toEqual([]);
  });

  it('fixed returns empty array (anchor >= rows.length fires when length is 0)', () => {
    const result = applyTimeLens(emptyRows, { mode: 'fixed', anchor: 0, windowSize: 5 }, 't');
    expect(result).toEqual([]);
  });

  it('openEnded returns empty array (anchor >= rows.length fires when length is 0)', () => {
    const result = applyTimeLens(emptyRows, { mode: 'openEnded', anchor: 0 }, 't');
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

// ---------------------------------------------------------------------------
// timeLensIndices — one it per mode + edge cases
// ---------------------------------------------------------------------------

describe('timeLensIndices — cumulative', () => {
  it('returns [0, length) for the full dataset', () => {
    expect(timeLensIndices(5, { mode: 'cumulative' })).toEqual({ start: 0, end: 5 });
  });

  it('returns [0, 0) for length=0', () => {
    expect(timeLensIndices(0, { mode: 'cumulative' })).toEqual({ start: 0, end: 0 });
  });

  it('slice derived from indices deep-equals applyTimeLens result', () => {
    const lens: TimeLens = { mode: 'cumulative' };
    const arr = [...rows];
    const { start, end } = timeLensIndices(arr.length, lens);
    expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
  });
});

describe('timeLensIndices — rolling', () => {
  it('returns last windowSize indices for a typical window', () => {
    expect(timeLensIndices(5, { mode: 'rolling', windowSize: 3 })).toEqual({ start: 2, end: 5 });
  });

  it('returns [0, length) when windowSize exceeds length', () => {
    expect(timeLensIndices(5, { mode: 'rolling', windowSize: 100 })).toEqual({ start: 0, end: 5 });
  });

  it('returns empty window [length, length) when windowSize is 0', () => {
    const { start, end } = timeLensIndices(5, { mode: 'rolling', windowSize: 0 });
    expect(start).toBe(end);
    expect(end - start).toBe(0);
  });

  it('returns empty window when windowSize is negative', () => {
    const { start, end } = timeLensIndices(5, { mode: 'rolling', windowSize: -5 });
    expect(end - start).toBe(0);
  });

  it('slice derived from indices deep-equals applyTimeLens result', () => {
    const lens: TimeLens = { mode: 'rolling', windowSize: 3 };
    const arr = [...rows];
    const { start, end } = timeLensIndices(arr.length, lens);
    expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
  });
});

describe('timeLensIndices — fixed', () => {
  it('returns [anchor, anchor+windowSize) for a typical window', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: 1, windowSize: 3 })).toEqual({
      start: 1,
      end: 4,
    });
  });

  it('truncates end to length when window extends past the end', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: 3, windowSize: 5 })).toEqual({
      start: 3,
      end: 5,
    });
  });

  it('returns [0,0) when anchor equals length', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: 5, windowSize: 2 })).toEqual({
      start: 0,
      end: 0,
    });
  });

  it('returns [0,0) when anchor is beyond length (e.g. anchor=99, length=5)', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: 99, windowSize: 5 })).toEqual({
      start: 0,
      end: 0,
    });
  });

  it('returns [0,0) when windowSize is 0', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: 0, windowSize: 0 })).toEqual({
      start: 0,
      end: 0,
    });
  });

  it('returns [0,0) when anchor is negative', () => {
    expect(timeLensIndices(5, { mode: 'fixed', anchor: -1, windowSize: 2 })).toEqual({
      start: 0,
      end: 0,
    });
  });

  it('slice derived from indices deep-equals applyTimeLens result', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 1, windowSize: 3 };
    const arr = [...rows];
    const { start, end } = timeLensIndices(arr.length, lens);
    expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
  });

  it('slice from out-of-bounds anchor returns empty (anchor=99, length=5)', () => {
    const lens: TimeLens = { mode: 'fixed', anchor: 99, windowSize: 5 };
    const arr = [...rows];
    const { start, end } = timeLensIndices(arr.length, lens);
    expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
    expect(end - start).toBe(0);
  });
});

describe('timeLensIndices — openEnded', () => {
  it('returns [anchor, length) from anchor', () => {
    expect(timeLensIndices(5, { mode: 'openEnded', anchor: 2 })).toEqual({ start: 2, end: 5 });
  });

  it('returns [0, length) when anchor is 0', () => {
    expect(timeLensIndices(5, { mode: 'openEnded', anchor: 0 })).toEqual({ start: 0, end: 5 });
  });

  it('returns [0,0) when anchor equals length', () => {
    expect(timeLensIndices(5, { mode: 'openEnded', anchor: 5 })).toEqual({ start: 0, end: 0 });
  });

  it('returns [0,0) when anchor is beyond length', () => {
    expect(timeLensIndices(5, { mode: 'openEnded', anchor: 99 })).toEqual({ start: 0, end: 0 });
  });

  it('returns [0,0) when anchor is negative', () => {
    expect(timeLensIndices(5, { mode: 'openEnded', anchor: -1 })).toEqual({ start: 0, end: 0 });
  });

  it('slice derived from indices deep-equals applyTimeLens result', () => {
    const lens: TimeLens = { mode: 'openEnded', anchor: 2 };
    const arr = [...rows];
    const { start, end } = timeLensIndices(arr.length, lens);
    expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
  });
});

describe('timeLensIndices — empty array invariants', () => {
  it('cumulative on length=0 gives [0,0)', () => {
    const { start, end } = timeLensIndices(0, { mode: 'cumulative' });
    expect(start).toBe(0);
    expect(end).toBe(0);
  });

  it('rolling on length=0 gives start===end', () => {
    const { start, end } = timeLensIndices(0, { mode: 'rolling', windowSize: 5 });
    expect(start).toBe(end);
  });

  it('fixed on length=0 gives [0,0)', () => {
    const { start, end } = timeLensIndices(0, { mode: 'fixed', anchor: 0, windowSize: 5 });
    expect(start).toBe(0);
    expect(end).toBe(0);
  });

  it('openEnded on length=0 gives [0,0)', () => {
    const { start, end } = timeLensIndices(0, { mode: 'openEnded', anchor: 0 });
    expect(start).toBe(0);
    expect(end).toBe(0);
  });
});

describe('timeLensIndices — parallel-array alignment invariant', () => {
  it('for every mode, arr.slice(start,end) deep-equals applyTimeLens(arr, lens, col)', () => {
    const arr = [...rows];
    const lenses: TimeLens[] = [
      { mode: 'cumulative' },
      { mode: 'rolling', windowSize: 3 },
      { mode: 'rolling', windowSize: 0 },
      { mode: 'fixed', anchor: 1, windowSize: 2 },
      { mode: 'fixed', anchor: 99, windowSize: 5 },
      { mode: 'openEnded', anchor: 2 },
      { mode: 'openEnded', anchor: 99 },
    ];
    for (const lens of lenses) {
      const { start, end } = timeLensIndices(arr.length, lens);
      expect(arr.slice(start, end)).toEqual(applyTimeLens(arr, lens, 't'));
    }
  });
});
