import { describe, it, expect } from 'vitest';
import { computeFormulaColumn } from '../evaluate';
import type { FormulaBinding } from '../types';

function binding(partial: Partial<FormulaBinding>): FormulaBinding {
  return {
    id: 'test',
    name: 'test formula',
    numerator: [],
    denominator: [],
    multiplier: 1,
    ...partial,
  };
}

const NO_AUGMENTED: Record<string, number[]> = {};

describe('computeFormulaColumn', () => {
  it('empty rows → empty array', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'A', sign: '+' }],
    });
    expect(computeFormulaColumn([], b, NO_AUGMENTED)).toEqual([]);
  });

  it('returns null when binding has empty numerator (signals: no derivation)', () => {
    const b = binding({ numerator: [], denominator: [], multiplier: 1 });
    expect(computeFormulaColumn([{ A: 1 }, { A: 2 }], b, NO_AUGMENTED)).toBeNull();
  });

  it('three rows, all valid → three-element array', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'A', sign: '+' }],
      multiplier: 2,
    });
    const rows = [{ A: 1 }, { A: 2 }, { A: 3 }];
    const result = computeFormulaColumn(rows, b, NO_AUGMENTED);
    expect(result).toEqual([2, 4, 6]);
  });

  it('three rows with one missing cell → [ok, NaN, ok]', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'A', sign: '+' }],
    });
    const rows = [{ A: 10 }, { B: 99 }, { A: 30 }]; // row[1] has no 'A'
    const result = computeFormulaColumn(rows, b, NO_AUGMENTED);
    expect(result).not.toBeNull();
    expect(result![0]).toBe(10);
    expect(Number.isNaN(result![1])).toBe(true);
    expect(result![2]).toBe(30);
  });

  it('augmented column ref: Lead_time / Count for two rows', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'Lead_time', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Count', sign: '+' }],
      multiplier: 1,
    });
    const rows = [{ Count: 10 }, { Count: 20 }];
    const augmented: Record<string, number[]> = { Lead_time: [3600000, 7200000] };
    const result = computeFormulaColumn(rows, b, augmented);
    expect(result).toEqual([360000, 360000]);
  });

  it('preserves row order even when intermediate rows are NaN', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'X', sign: '+' }],
    });
    const rows = [{ X: 5 }, { X: null }, { X: 15 }, { X: undefined }, { X: 25 }];
    const result = computeFormulaColumn(rows, b, NO_AUGMENTED);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(5);
    expect(result![0]).toBe(5);
    expect(Number.isNaN(result![1])).toBe(true);
    expect(result![2]).toBe(15);
    expect(Number.isNaN(result![3])).toBe(true);
    expect(result![4]).toBe(25);
  });

  it('handles a constant-only numerator with no rows referencing any column', () => {
    const b = binding({
      numerator: [{ kind: 'constant', value: 42 }],
      denominator: [],
      multiplier: 2,
    });
    const rows = [{}, {}, {}];
    const result = computeFormulaColumn(rows, b, NO_AUGMENTED);
    expect(result).toEqual([84, 84, 84]);
  });
});
