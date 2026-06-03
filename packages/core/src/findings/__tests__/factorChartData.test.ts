import { describe, it, expect } from 'vitest';
import { deriveScatterFitData, groupOutcomeByFactor } from '../factorChartData';
import type { DataRow } from '../../types';

// Proven fixture (mirrors hypothesisTestPlan.test.ts): Y rises with TEMP
// (continuous — decimals make the engine classify it continuous); SIZE is
// constant (the negative control — a constant factor must get NO fitted line).
const rows: DataRow[] = [
  { SHIFT: 'Day', TEMP: 20.4, SIZE: 5, Y: 10 },
  { SHIFT: 'Day', TEMP: 21.7, SIZE: 5, Y: 11 },
  { SHIFT: 'Day', TEMP: 22.1, SIZE: 5, Y: 12 },
  { SHIFT: 'Day', TEMP: 23.9, SIZE: 5, Y: 13 },
  { SHIFT: 'Day', TEMP: 24.3, SIZE: 5, Y: 14 },
  { SHIFT: 'Night', TEMP: 30.6, SIZE: 5, Y: 30 },
  { SHIFT: 'Night', TEMP: 31.2, SIZE: 5, Y: 31 },
  { SHIFT: 'Night', TEMP: 32.8, SIZE: 5, Y: 32 },
  { SHIFT: 'Night', TEMP: 33.5, SIZE: 5, Y: 33 },
  { SHIFT: 'Night', TEMP: 34.1, SIZE: 5, Y: 34 },
];

describe('deriveScatterFitData', () => {
  it('returns all (x,y) points and a positively-sloped fitted line for a continuous factor', () => {
    const result = deriveScatterFitData(rows, 'TEMP', 'Y');
    expect(result.points).toHaveLength(10);
    expect(result.points[0]).toEqual({ x: 20.4, y: 10 });
    expect(result.fittedLine).not.toBeNull();
    expect(result.fittedLine!).toHaveLength(2);
    // Y rises with TEMP → the fitted line slopes up (endpoints ordered by x).
    expect(result.fittedLine![1].x).toBeGreaterThan(result.fittedLine![0].x);
    expect(result.fittedLine![1].y).toBeGreaterThan(result.fittedLine![0].y);
    expect(result.isSignificant).toBe(true);
  });

  it('NEGATIVE CONTROL: a constant factor yields points but NO fitted line', () => {
    // SIZE is constant (=5) → zero x-variance → a degenerate/always-drawn line
    // would spuriously pass; a data-driven line must be null.
    const result = deriveScatterFitData(rows, 'SIZE', 'Y');
    expect(result.points).toHaveLength(10);
    expect(result.fittedLine).toBeNull();
    expect(result.isSignificant).toBe(false);
  });

  it('skips rows with a non-finite x or y', () => {
    const dirty: DataRow[] = [
      ...rows,
      { SHIFT: 'Day', TEMP: null, SIZE: 5, Y: 99 },
      { SHIFT: 'Day', TEMP: 40, SIZE: 5, Y: null },
    ];
    expect(deriveScatterFitData(dirty, 'TEMP', 'Y').points).toHaveLength(10);
  });
});

describe('groupOutcomeByFactor', () => {
  it('groups outcome values by the factor levels, sorted by category', () => {
    const groups = groupOutcomeByFactor(rows, 'SHIFT', 'Y');
    expect(groups.map(g => g.category)).toEqual(['Day', 'Night']);
    expect(groups[0].values).toEqual([10, 11, 12, 13, 14]);
    expect(groups[1].values).toEqual([30, 31, 32, 33, 34]);
  });

  it('NEGATIVE CONTROL: excludes rows with a null category or non-numeric outcome', () => {
    const dirty: DataRow[] = [
      { SHIFT: 'Day', Y: 10 },
      { SHIFT: null, Y: 11 }, // null category → excluded
      { SHIFT: 'Night', Y: 'oops' }, // non-numeric outcome → excluded
    ];
    const groups = groupOutcomeByFactor(dirty, 'SHIFT', 'Y');
    expect(groups.map(g => g.category)).toEqual(['Day']);
    expect(groups[0].values).toEqual([10]);
  });
});
