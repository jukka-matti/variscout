import { describe, it, expect } from 'vitest';
import { computeRankDeltas } from '../ParetoChart';

describe('computeRankDeltas', () => {
  it('returns positive delta when category moved up in rank', () => {
    // Current: A(rank1), B(rank2), C(rank3)
    const currentKeys = ['A', 'B', 'C'];
    // Comparison: C was rank1, A was rank2, B was rank3
    const comparisonData = new Map([
      ['C', 100],
      ['A', 80],
      ['B', 60],
    ]);
    const deltas = computeRankDeltas(currentKeys, comparisonData);

    // A: was rank 2, now rank 1 → delta = +1
    expect(deltas.get('A')).toBe(1);
    // B: was rank 3, now rank 2 → delta = +1
    expect(deltas.get('B')).toBe(1);
    // C: was rank 1, now rank 3 → delta = -2
    expect(deltas.get('C')).toBe(-2);
  });

  it('returns 0 delta when rank unchanged', () => {
    const currentKeys = ['X', 'Y'];
    const comparisonData = new Map([
      ['X', 50],
      ['Y', 30],
    ]);
    const deltas = computeRankDeltas(currentKeys, comparisonData);
    expect(deltas.get('X')).toBe(0);
    expect(deltas.get('Y')).toBe(0);
  });

  it('handles categories missing from comparison data', () => {
    const currentKeys = ['A', 'B', 'NEW'];
    const comparisonData = new Map([
      ['A', 100],
      ['B', 50],
    ]);
    const deltas = computeRankDeltas(currentKeys, comparisonData);
    expect(deltas.get('A')).toBe(0);
    expect(deltas.get('B')).toBe(0);
    // NEW has no comparison rank
    expect(deltas.has('NEW')).toBe(false);
  });

  it('returns empty map when comparison data is empty', () => {
    const currentKeys = ['A', 'B'];
    const comparisonData = new Map<string, number>();
    const deltas = computeRankDeltas(currentKeys, comparisonData);
    expect(deltas.size).toBe(0);
  });

  it('handles single category', () => {
    const currentKeys = ['Only'];
    const comparisonData = new Map([['Only', 10]]);
    const deltas = computeRankDeltas(currentKeys, comparisonData);
    expect(deltas.get('Only')).toBe(0);
  });
});
