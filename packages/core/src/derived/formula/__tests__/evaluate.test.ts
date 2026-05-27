import { describe, it, expect } from 'vitest';
import { evaluateFormulaRow } from '../evaluate';
import type { FormulaBinding } from '../types';

// Helper to build a minimal FormulaBinding
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

describe('evaluateFormulaRow', () => {
  // 1. Numerator-only (no denominator, multiplier=100)
  it('numerator-only: single column × multiplier', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'A', sign: '+' }],
      denominator: [],
      multiplier: 100,
    });
    expect(evaluateFormulaRow({ A: 5 }, b, NO_AUGMENTED, 0)).toBe(500);
  });

  // 2. Ratio: (A + B) / C × 100
  it('ratio: (A + B) / C × 100', () => {
    const b = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '+' },
      ],
      denominator: [{ kind: 'column', column: 'C', sign: '+' }],
      multiplier: 100,
    });
    expect(evaluateFormulaRow({ A: 85, B: 10, C: 100 }, b, NO_AUGMENTED, 0)).toBe(95);
  });

  // 3. Division by zero → NaN
  it('division by zero returns NaN', () => {
    const b = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '+' },
      ],
      denominator: [{ kind: 'column', column: 'C', sign: '+' }],
      multiplier: 100,
    });
    const result = evaluateFormulaRow({ A: 1, B: 0, C: 0 }, b, NO_AUGMENTED, 0);
    expect(Number.isNaN(result)).toBe(true);
  });

  // 4. Missing cell → NaN
  it('missing cell in ratio returns NaN', () => {
    const b = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '+' },
      ],
      denominator: [{ kind: 'column', column: 'C', sign: '+' }],
      multiplier: 100,
    });
    // row has no C
    const result = evaluateFormulaRow({ A: 5 }, b, NO_AUGMENTED, 0);
    expect(Number.isNaN(result)).toBe(true);
  });

  // 5. Uncoercible string cell → NaN
  it('non-numeric string cell returns NaN', () => {
    const b = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '+' },
      ],
      denominator: [{ kind: 'column', column: 'C', sign: '+' }],
      multiplier: 100,
    });
    const result = evaluateFormulaRow({ A: 'foo', B: 10, C: 100 }, b, NO_AUGMENTED, 0);
    expect(Number.isNaN(result)).toBe(true);
  });

  // 6. Augmented column ref — Lead_time from augmentedColumns
  it('augmented column resolved by rowIndex', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'Lead_time', sign: '+' }],
      denominator: [{ kind: 'column', column: 'Count', sign: '+' }],
      multiplier: 1,
    });
    const augmented = { Lead_time: [3600000, 7200000] };
    // row index 0 → Lead_time = 3600000, Count = 10 → 3600000 / 10 = 360000
    expect(evaluateFormulaRow({ Count: 10 }, b, augmented, 0)).toBe(360000);
  });

  // 7. Constant term in denominator: X / (C + 5), row {X:50, C:5} → 50 / 10 = 5
  it('constant term in denominator', () => {
    const b = binding({
      numerator: [{ kind: 'column', column: 'X', sign: '+' }],
      denominator: [
        { kind: 'column', column: 'C', sign: '+' },
        { kind: 'constant', value: 5 },
      ],
      multiplier: 1,
    });
    expect(evaluateFormulaRow({ X: 50, C: 5 }, b, NO_AUGMENTED, 0)).toBe(5);
  });

  // 8. Signed difference: A - B, denominator empty, multiplier 1
  it('signed difference: A - B', () => {
    const b = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '-' },
      ],
      denominator: [],
      multiplier: 1,
    });
    expect(evaluateFormulaRow({ A: 10, B: 3 }, b, NO_AUGMENTED, 0)).toBe(7);
  });

  // 9. Numeric string coercion
  describe('string coercion', () => {
    const ratioBinding = binding({
      numerator: [
        { kind: 'column', column: 'A', sign: '+' },
        { kind: 'column', column: 'B', sign: '+' },
      ],
      denominator: [{ kind: 'column', column: 'C', sign: '+' }],
      multiplier: 100,
    });

    it('coercible numeric string "5.5" is treated as 5.5', () => {
      // (5.5 + 10) / 100 × 100 = 15.5
      expect(
        evaluateFormulaRow({ A: '5.5', B: 10, C: 100 }, ratioBinding, NO_AUGMENTED, 0)
      ).toBeCloseTo(15.5, 10);
    });

    it('empty string returns NaN', () => {
      const result = evaluateFormulaRow({ A: '', B: 10, C: 100 }, ratioBinding, NO_AUGMENTED, 0);
      expect(Number.isNaN(result)).toBe(true);
    });

    it('null cell returns NaN', () => {
      const result = evaluateFormulaRow({ A: null, B: 10, C: 100 }, ratioBinding, NO_AUGMENTED, 0);
      expect(Number.isNaN(result)).toBe(true);
    });

    it('undefined cell returns NaN', () => {
      const result = evaluateFormulaRow(
        { A: undefined, B: 10, C: 100 },
        ratioBinding,
        NO_AUGMENTED,
        0
      );
      expect(Number.isNaN(result)).toBe(true);
    });
  });

  // Empty-terms contract — documents the evaluator's behavior with no terms
  describe('empty terms contract', () => {
    it('empty numerator and denominator: result is 0 × multiplier', () => {
      const b = binding({ numerator: [], denominator: [], multiplier: 100 });
      expect(evaluateFormulaRow({}, b, NO_AUGMENTED, 0)).toBe(0);
    });

    it('multiplier of 0 yields 0 (not NaN)', () => {
      const b = binding({
        numerator: [{ kind: 'column', column: 'A', sign: '+' }],
        denominator: [],
        multiplier: 0,
      });
      expect(evaluateFormulaRow({ A: 5 }, b, NO_AUGMENTED, 0)).toBe(0);
    });
  });
});
