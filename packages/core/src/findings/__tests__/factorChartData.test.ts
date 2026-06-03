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
    // The fitted line is now sampled (more than 2 points).
    expect(result.fittedLine!.length).toBeGreaterThanOrEqual(2);
    const last = result.fittedLine!.length - 1;
    // Y rises with TEMP → the fitted line slopes up (endpoints ordered by x).
    expect(result.fittedLine![last].x).toBeGreaterThan(result.fittedLine![0].x);
    expect(result.fittedLine![last].y).toBeGreaterThan(result.fittedLine![0].y);
    expect(result.isSignificant).toBe(true);
  });

  it('traces curvature (a quadratic fit is NOT a straight chord)', () => {
    // Near-perfect U-shaped parabola: y ≈ x² with tiny deterministic noise so
    // SSE_quadratic > 0 (the shouldIncludeQuadratic F-test requires a non-zero
    // denominator; a perfect parabola gives SSE_quad=0 → F=0 → no selection).
    // x values use 0.5 steps so the factor classifies as continuous (mixed
    // integer/non-integer bypasses the "all-integer → categorical" heuristic).
    // Noise cycle [+0.05, 0, -0.05] keeps the data near-parabolic but ≠ exact.
    const noise = [0.05, 0, -0.05];
    const parabolicRows: DataRow[] = Array.from({ length: 13 }, (_, i) => {
      const x = (i - 6) * 0.5; // -3.0, -2.5, ..., 2.5, 3.0
      return { X: x, Y: x * x + noise[i % 3] };
    });
    const result = deriveScatterFitData(parabolicRows, 'X', 'Y');
    expect(result.fittedLine).not.toBeNull();
    expect(result.fittedLine!.length).toBeGreaterThanOrEqual(3);

    // For a U-shaped parabola the MIDDLE sampled point should dip well BELOW
    // the chord between the first and last fitted-line points.
    // A straight-chord (2-point) implementation would have mid ≈ chordMidY;
    // a faithfully-sampled quadratic curve has mid << chordMidY.
    const fl = result.fittedLine!;
    const mid = fl[Math.floor(fl.length / 2)];
    const chordMidY = (fl[0].y + fl[fl.length - 1].y) / 2;
    expect(mid.y).toBeLessThan(chordMidY - 1);
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
