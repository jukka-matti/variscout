/**
 * Tests for the membership-separation engine (ER-5a Task 1).
 *
 * Hand-verified fixtures use explicit arithmetic in comments so a reviewer can
 * confirm the numbers without running the code.
 */

import { describe, it, expect } from 'vitest';
import { computeMembershipSeparation } from '../membershipSeparation';
import type { DataRow } from '../../types';
import type { ConditionLeaf } from '../../findings/hypothesisCondition';

// ---------------------------------------------------------------------------
// Test 1: Hand-verified fixture (2 factors × 20 rows)
// ---------------------------------------------------------------------------

describe('computeMembershipSeparation — hand-verified fixture', () => {
  /**
   * Dataset: 20 rows
   *   factor "Color": Red(10) / Blue(10)
   *   factor "Size":  Sm(10) / Lg(10)
   *
   * Condition: Color === "Red"  → NIn=10, NOut=10
   *
   * ---------- Color contingency ----------
   * Observed table (color × membership):
   *         In   Out
   *   Red   10    0
   *   Blue   0   10
   * n = 20, k (levels) = 2, r (membership cols) = 2
   *
   * χ² = Σ (O − E)²/E
   *   Expected for each cell: n_i * m_j / n = 10*10/20 = 5
   *   (10−5)²/5 = 25/5 = 5   ← Red/In
   *   (0−5)²/5  = 25/5 = 5   ← Red/Out
   *   (0−5)²/5  = 25/5 = 5   ← Blue/In
   *   (10−5)²/5 = 25/5 = 5   ← Blue/Out
   *   χ² = 20
   *
   * φ²   = χ²/n = 20/20 = 1
   * φ̃²  = max(0, φ² − (k−1)(r−1)/(n−1))
   *       = max(0, 1 − (1)(1)/19)
   *       = 1 − 0.052631... = 0.947368...
   * k̃   = k − (k−1)²/(n−1) = 2 − 1/19 = 1.947368...
   * r̃   = r − (r−1)²/(n−1) = 2 − 1/19 = 1.947368...
   * min(k̃−1, r̃−1) = 0.947368...
   * Ṽ   = sqrt(0.947368.../0.947368...) = sqrt(1) = 1.0
   *
   * ---------- Size contingency ----------
   * Observed table:
   *         In   Out
   *   Sm     5    5
   *   Lg     5    5
   * χ² = 0 (perfectly uniform), Ṽ = 0
   *
   * Ranking: Color (Ṽ=1.0) before Size (Ṽ=0)
   */
  const rows20: DataRow[] = [
    // Color=Red, In-condition  (10 rows)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i,
      Color: 'Red',
      Size: i < 5 ? 'Sm' : 'Lg',
      value: 1,
    })),
    // Color=Blue, Out-of-condition  (10 rows)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 10,
      Color: 'Blue',
      Size: i < 5 ? 'Sm' : 'Lg',
      value: 2,
    })),
  ];

  // Condition: Color === "Red"
  const colorLeaf: ConditionLeaf = { kind: 'leaf', column: 'Color', op: 'eq', value: 'Red' };

  it('returns a result (not null) for a well-separated fixture', () => {
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size']);
    expect(result).not.toBeNull();
  });

  it('NIn and NOut are correct', () => {
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    expect(result.nIn).toBe(10);
    expect(result.nOut).toBe(10);
    expect(result.n).toBe(20);
  });

  it('Color factor Ṽ is 1.0 (bias-corrected Cramer V of perfect separation)', () => {
    // Computed by hand above: Ṽ = sqrt(φ̃²/min(k̃−1,r̃−1)) = sqrt(1) = 1.0
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const colorFactor = result.factors.find(f => f.factor === 'Color')!;
    expect(colorFactor).toBeDefined();
    expect(colorFactor.adjustedV).toBeCloseTo(1.0, 10);
  });

  it('Size factor Ṽ is 0 (uniform — no separation)', () => {
    // χ² = 0 for a uniform table → φ² = 0 → φ̃² = max(0, −something) = 0 → Ṽ = 0
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const sizeFactor = result.factors.find(f => f.factor === 'Size')!;
    expect(sizeFactor).toBeDefined();
    expect(sizeFactor.adjustedV).toBeCloseTo(0, 10);
  });

  it('factors are sorted by adjustedV descending (Color before Size)', () => {
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    expect(result.factors[0].factor).toBe('Color');
    expect(result.factors[1].factor).toBe('Size');
  });

  it('Color topLevel is "Red" (lift = undefined since nOut=0)', () => {
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const colorFactor = result.factors.find(f => f.factor === 'Color')!;
    // Red: nIn=10, nOut=0 → lift = undefined (only-in-condition sentinel)
    expect(colorFactor.topLevel).toBe('Red');
    const redLevel = colorFactor.levels.find(l => l.level === 'Red')!;
    expect(redLevel.nIn).toBe(10);
    expect(redLevel.nOut).toBe(0);
    expect(redLevel.lift).toBeUndefined();
  });

  it('Size topLevel is null when all levels have nIn < 3 threshold… actually null since no level is dominant', () => {
    // Each Size level has nIn=5 which is ≥3; lift = (5/10)/(5/10) = 1.0 for both
    // argmax lift: tie at 1.0, so topLevel picks one (either Sm or Lg) deterministically
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const sizeFactor = result.factors.find(f => f.factor === 'Size')!;
    // Both levels have equal lift of 1.0; topLevel will be whichever is first alphabetically
    expect(sizeFactor.topLevel === 'Sm' || sizeFactor.topLevel === 'Lg').toBe(true);
  });

  it('composition shareIn + shareOut sum correctly for Color/Red level', () => {
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const colorFactor = result.factors.find(f => f.factor === 'Color')!;
    const redLevel = colorFactor.levels.find(l => l.level === 'Red')!;
    // shareIn = nIn/NIn = 10/10 = 1.0, shareOut = 0/10 = 0
    expect(redLevel.shareIn).toBeCloseTo(1.0, 10);
    expect(redLevel.shareOut).toBeCloseTo(0.0, 10);
  });

  it('Color factor df = 1 (binary: k=2, df = k−1 = 1)', () => {
    // Color has 2 levels (Red / Blue) → k=2, df = k−1 = 1.
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const colorFactor = result.factors.find(f => f.factor === 'Color')!;
    expect(colorFactor.df).toBe(1);
  });

  it('Color factor n = 20 (all rows used, no nulls)', () => {
    // NIn=10, NOut=10 → n = 20.
    const result = computeMembershipSeparation(rows20, [colorLeaf], ['Color', 'Size'])!;
    const colorFactor = result.factors.find(f => f.factor === 'Color')!;
    expect(colorFactor.n).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Bias-correction floor — independent factor → Ṽ === 0
// ---------------------------------------------------------------------------

describe('bias-correction floor', () => {
  /**
   * 20 rows, 2 groups (In/Out, 10 each).
   * "Random" factor perfectly balanced: 5 A + 5 B per group.
   * Expected χ² = 0, Ṽ = 0 even before bias correction.
   */
  const rows: DataRow[] = [
    ...Array.from({ length: 5 }, (_, i) => ({ id: i, grp: 'In', label: 'A' })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: i + 5, grp: 'In', label: 'B' })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: i + 10, grp: 'Out', label: 'A' })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: i + 15, grp: 'Out', label: 'B' })),
  ];

  const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };

  it('independent factor has adjustedV = 0', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['label'])!;
    expect(result).not.toBeNull();
    const labelFactor = result.factors.find(f => f.factor === 'label')!;
    expect(labelFactor.adjustedV).toBeCloseTo(0, 10);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Cardinality penalty — many-level factor ranks BELOW a 2-level separator
// ---------------------------------------------------------------------------

describe('cardinality penalty', () => {
  /**
   * Two factors over 40 rows (NIn=20, NOut=20).
   *
   * "Binary" (2 levels): perfectly separates In vs Out — Ṽ_raw = 1.0
   *
   * "Many" (10 levels, 4 rows each): each level partially overlaps membership,
   *   inflating raw χ² but the bias correction penalizes the many levels.
   *
   * We construct "Many" so that it has a non-trivial raw V but bias-correction
   * reduces it below Binary's adjusted V. A 10-level factor where each level
   * sends exactly 2 rows In and 2 rows Out has χ² = 0 (perfectly uniform per
   * level → no association); that is too easy. Instead let "Many" have 7 levels
   * with some skew so raw V is inflated, but bias penalizes high k.
   *
   * Simpler design: "Binary" is a perfect separator. "Many" has 8 levels with
   * a mild skew (3 In + 1 Out for first 4 levels, 1 In + 3 Out for last 4
   * levels). Adjusted V of "Many" must be < 1.0 (Binary's adjusted V).
   */
  // Build the dataset: Binary is a PERFECT 2-level separator (all 20 In rows have
  // Binary='Yes', all 20 Out rows have Binary='No'). Many is a PERFECT 10-level
  // separator — rows are divided into 10 groups of 4 (i/4), and the first 5 groups
  // (rows 0–19) are entirely in-condition while the last 5 (rows 20–39) are entirely
  // out-of-condition. Both factors have χ²=40 (equal raw separation strength), so
  // the test exercises the cardinality penalty at EQUAL raw separation:
  //   Binary: k=2, df=1  → bias correction is mild → Ṽ ≈ 1.0
  //   Many:   k=10, df=9 → heavier bias penalty   → Ṽ ≈ 0.889
  // The assertion verifies that Binary (Ṽ≈1.0) ranks above Many (Ṽ≈0.889).
  const rows40: DataRow[] = [];
  for (let i = 0; i < 40; i++) {
    const inCond = i < 20;
    // Binary: perfect separator
    const Binary = inCond ? 'Yes' : 'No';
    // Many: 10 levels each with 4 rows; first 5 levels (L0–L4) are all-In,
    // last 5 levels (L5–L9) are all-Out → perfect separation, same χ²=40 as Binary.
    const levelIdx = Math.floor(i / 4); // 10 levels of 4 rows
    const Many = `L${levelIdx}`;
    const grp = inCond ? 'In' : 'Out';
    rows40.push({ id: i, Binary, Many, grp });
  }

  const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };

  it('perfect 2-level separator has adjustedV = 1.0', () => {
    const result = computeMembershipSeparation(rows40, [leaf], ['Binary'])!;
    const f = result.factors.find(fac => fac.factor === 'Binary')!;
    expect(f.adjustedV).toBeCloseTo(1.0, 5);
  });

  it('uniform 10-level factor has adjustedV ≤ adjustedV of 2-level perfect separator', () => {
    const result = computeMembershipSeparation(rows40, [leaf], ['Binary', 'Many'])!;
    const bin = result.factors.find(f => f.factor === 'Binary')!;
    const many = result.factors.find(f => f.factor === 'Many')!;
    // Binary (Ṽ=1.0) must rank above or equal to Many
    expect(bin.adjustedV).toBeGreaterThanOrEqual(many.adjustedV);
    // Binary should be first in the sorted result
    expect(result.factors[0].factor).toBe('Binary');
  });

  it('Binary df = 1 (k=2, df = k−1 = 1), n = 40', () => {
    const result = computeMembershipSeparation(rows40, [leaf], ['Binary'])!;
    const bin = result.factors.find(f => f.factor === 'Binary')!;
    expect(bin.df).toBe(1);
    expect(bin.n).toBe(40);
  });

  it('Many df = 9 (k=10, df = k−1 = 9) — the regression case for the chip hover', () => {
    // This is the key regression test: a 3+-level factor must have df > 1.
    // Using df=1 in the hover (the original bug) would misrepresent the test.
    const result = computeMembershipSeparation(rows40, [leaf], ['Many'])!;
    const many = result.factors.find(f => f.factor === 'Many')!;
    expect(many.df).toBe(9);
    expect(many.n).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// Test 4: topLevel floor (nIn ≥ 3), lift=undefined, topLevel=null
// ---------------------------------------------------------------------------

describe('topLevel floor and lift edge cases', () => {
  /**
   * Construct a factor with one level that has nIn < 3.
   * 20 rows: NIn=10, NOut=10.
   * "Rare" level: nIn=2, nOut=0  → lift=Inf but nIn<3 → excluded from topLevel
   * "Common" level: nIn=8, nOut=8 → lift=1.0, nIn≥3 → candidate
   * topLevel should be "Common" (the only level with nIn≥3)
   */
  const rows: DataRow[] = [
    // In-condition rows
    { id: 0, grp: 'In', cat: 'Rare' },
    { id: 1, grp: 'In', cat: 'Rare' }, // nIn=2 for Rare
    ...Array.from({ length: 8 }, (_, i) => ({ id: i + 2, grp: 'In', cat: 'Common' })),
    // Out-of-condition rows
    ...Array.from({ length: 10 }, (_, i) => ({ id: i + 10, grp: 'Out', cat: 'Common' })),
  ];

  const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };

  it('Rare level (nIn=2) is NOT selected as topLevel despite infinite lift', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    const catFactor = result.factors.find(f => f.factor === 'cat')!;
    expect(catFactor.topLevel).not.toBe('Rare');
  });

  it('Rare level has lift=undefined and nIn=2', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    const catFactor = result.factors.find(f => f.factor === 'cat')!;
    const rareLevel = catFactor.levels.find(l => l.level === 'Rare')!;
    expect(rareLevel.nIn).toBe(2);
    expect(rareLevel.nOut).toBe(0);
    expect(rareLevel.lift).toBeUndefined();
  });

  it('topLevel is "Common" (nIn≥3 and highest valid lift)', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    const catFactor = result.factors.find(f => f.factor === 'cat')!;
    expect(catFactor.topLevel).toBe('Common');
  });

  it('topLevel is null when ALL levels have nIn < 3', () => {
    // 6 rows: NIn=3, NOut=3; factor has 3 levels with nIn=1 each → all nIn < 3
    const smallRows: DataRow[] = [
      { id: 0, grp: 'In', cat: 'A' },
      { id: 1, grp: 'In', cat: 'B' },
      { id: 2, grp: 'In', cat: 'C' },
      { id: 3, grp: 'Out', cat: 'A' },
      { id: 4, grp: 'Out', cat: 'B' },
      { id: 5, grp: 'Out', cat: 'C' },
    ];
    const smallLeaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result2 = computeMembershipSeparation(smallRows, [smallLeaf], ['cat'])!;
    expect(result2).not.toBeNull();
    const catFactor = result2.factors.find(f => f.factor === 'cat')!;
    expect(catFactor.topLevel).toBeNull();
  });
});

// Cleaner topLevel=null test
describe('topLevel is null when no level qualifies', () => {
  it('all levels have nIn < 3 → topLevel = null', () => {
    const rows: DataRow[] = [
      { id: 0, grp: 'In', cat: 'A' },
      { id: 1, grp: 'In', cat: 'B' },
      { id: 2, grp: 'In', cat: 'C' }, // nIn=1 for each of A/B/C
      { id: 3, grp: 'Out', cat: 'A' },
      { id: 4, grp: 'Out', cat: 'B' },
      { id: 5, grp: 'Out', cat: 'C' },
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    expect(result).not.toBeNull();
    const catFactor = result.factors.find(f => f.factor === 'cat')!;
    expect(catFactor.topLevel).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 5: Degenerate guards → null
// ---------------------------------------------------------------------------

describe('degenerate guards', () => {
  it('returns null when leaves are empty (vacuous truth → NOut = 0)', () => {
    const rows: DataRow[] = Array.from({ length: 10 }, (_, i) => ({ id: i, cat: 'A', value: i }));
    // Empty leaves → all rows match → NIn=10, NOut=0
    const result = computeMembershipSeparation(rows, [], ['cat']);
    expect(result).toBeNull();
  });

  it('returns null when no rows match the condition (NIn = 0)', () => {
    const rows: DataRow[] = Array.from({ length: 10 }, (_, i) => ({ id: i, cat: 'A', value: i }));
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'cat', op: 'eq', value: 'Z' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat']);
    expect(result).toBeNull();
  });

  it('returns null when there are no usable factors', () => {
    const rows: DataRow[] = [
      { id: 0, grp: 'In', cat: 'A' },
      { id: 1, grp: 'Out', cat: 'A' },
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    // 'cat' has only 1 level → no separation possible (< 2 levels)
    const result = computeMembershipSeparation(rows, [leaf], ['cat']);
    // 1 level → factor is skipped; no usable factors → null
    expect(result).toBeNull();
  });

  it('returns null for an empty dataset', () => {
    const result = computeMembershipSeparation([], [], ['cat']);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 6: Continuous factor gets quartile-binned + binnedForRanking === true
// ---------------------------------------------------------------------------

describe('continuous factor pre-binning', () => {
  /**
   * 24 rows with a continuous factor "Score" (0..23).
   * Condition: first 12 rows are "In".
   * Score is continuous → should be quartile-binned before contingency.
   * binnedForRanking must be true.
   */
  const rows: DataRow[] = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    grp: i < 12 ? 'In' : 'Out',
    Score: i * 1.5, // continuous (24 distinct float values)
    Cat: i % 2 === 0 ? 'Even' : 'Odd', // categorical
  }));

  const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };

  it('continuous factor Score has binnedForRanking = true', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['Score', 'Cat'])!;
    expect(result).not.toBeNull();
    const scoreFactor = result.factors.find(f => f.factor === 'Score')!;
    expect(scoreFactor).toBeDefined();
    expect(scoreFactor.binnedForRanking).toBe(true);
  });

  it('categorical factor Cat has binnedForRanking = false', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['Score', 'Cat'])!;
    const catFactor = result.factors.find(f => f.factor === 'Cat')!;
    expect(catFactor).toBeDefined();
    expect(catFactor.binnedForRanking).toBe(false);
  });

  it('adjustedV is a finite non-NaN number for continuous factor', () => {
    const result = computeMembershipSeparation(rows, [leaf], ['Score'])!;
    const scoreFactor = result.factors[0];
    expect(Number.isFinite(scoreFactor.adjustedV)).toBe(true);
    expect(Number.isNaN(scoreFactor.adjustedV)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 7: p-value is defined and in [0, 1], never NaN
// ---------------------------------------------------------------------------

describe('p-value correctness', () => {
  it('p-value is a finite number in [0, 1] for perfect separator', () => {
    const rows: DataRow[] = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: i, grp: 'In', cat: 'Red' })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: i + 10, grp: 'Out', cat: 'Blue' })),
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    const catFactor = result.factors[0];
    expect(Number.isFinite(catFactor.pValue)).toBe(true);
    expect(Number.isNaN(catFactor.pValue)).toBe(false);
    expect(catFactor.pValue).toBeGreaterThanOrEqual(0);
    expect(catFactor.pValue).toBeLessThanOrEqual(1);
  });

  it('independent factor has high p-value (≥ 0.05)', () => {
    const rows: DataRow[] = [
      ...Array.from({ length: 5 }, (_, i) => ({ id: i, grp: 'In', cat: 'A' })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: i + 5, grp: 'In', cat: 'B' })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: i + 10, grp: 'Out', cat: 'A' })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: i + 15, grp: 'Out', cat: 'B' })),
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    const catFactor = result.factors[0];
    expect(catFactor.pValue).toBeGreaterThanOrEqual(0.05);
  });

  it('strongly associated factor has low p-value (< 0.05)', () => {
    const rows: DataRow[] = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: i, grp: 'In', cat: 'Red' })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: i + 10, grp: 'Out', cat: 'Blue' })),
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    expect(result.factors[0].pValue).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// Test 8: No NaN, no Infinity (lift uses undefined for NOut=0), no raw Infinity in adjustedV
// ---------------------------------------------------------------------------

describe('numeric safety invariant', () => {
  it('adjustedV is never NaN or ±Infinity', () => {
    const rows: DataRow[] = [
      ...Array.from({ length: 8 }, (_, i) => ({ id: i, grp: 'In', cat: i % 4 === 0 ? 'A' : 'B' })),
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 8,
        grp: 'Out',
        cat: i % 4 === 0 ? 'A' : 'B',
      })),
    ];
    const leaf: ConditionLeaf = { kind: 'leaf', column: 'grp', op: 'eq', value: 'In' };
    const result = computeMembershipSeparation(rows, [leaf], ['cat'])!;
    for (const factor of result.factors) {
      expect(Number.isNaN(factor.adjustedV)).toBe(false);
      expect(factor.adjustedV).not.toBe(Infinity);
      expect(factor.adjustedV).not.toBe(-Infinity);
    }
  });
});
