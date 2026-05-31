/**
 * FE-2b — the fused "Try to break it" disconfirmation verdict (spec §4.2).
 *
 * The verdict is the deliberate INVERSION of the plain FE-2a evaluate, graded by
 * the engine (never self-graded):
 *
 *   significant (the predicted relationship IS present) → the cause WITHSTOOD an
 *     attempt to break it → verdict 'survived', validationStatus 'supports'.
 *   NOT significant (the predicted relationship is ABSENT) → verdict 'refuted',
 *     validationStatus 'contradicts', refutes true.
 *
 * The spindle example: testing whether SHIFT relates to HEAT with the spindle
 * controlled returns NOT significant → SHIFT doesn't drive it → the night-shift
 * hypothesis is REFUTED. Fixed fixtures, deterministic (no clock/RNG).
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateDisconfirmation,
  disconfirmationFindingText,
  isDisconfirmationFindingForFactor,
  evaluateFindingText,
} from '../hypothesisTestPlan';
import type { DataRow } from '../../types';

// Build a 2-group categorical fixture: `nPerGroup` rows in each of Day/Night.
// `gap` shifts the Night mean above the Day mean (gap=0 → flat → not significant).
function shiftRows(nPerGroup: number, gap: number): DataRow[] {
  const rows: DataRow[] = [];
  // A tiny deterministic jitter (±1, cycling) keeps each group's variance > 0 so
  // the ANOVA can run, without any RNG.
  const jitter = [0, 1, -1, 0, 1, -1, 0, 1, -1, 0];
  for (let i = 0; i < nPerGroup; i++) {
    rows.push({ SHIFT: 'Day', Y: 20 + jitter[i % jitter.length] });
  }
  for (let i = 0; i < nPerGroup; i++) {
    rows.push({ SHIFT: 'Night', Y: 20 + gap + jitter[i % jitter.length] });
  }
  return rows;
}

// SHIFT sharply splits Y → the predicted relationship is present (significant).
const significantRows: DataRow[] = [
  { SHIFT: 'Day', Y: 10 },
  { SHIFT: 'Day', Y: 11 },
  { SHIFT: 'Day', Y: 12 },
  { SHIFT: 'Day', Y: 13 },
  { SHIFT: 'Day', Y: 14 },
  { SHIFT: 'Night', Y: 30 },
  { SHIFT: 'Night', Y: 31 },
  { SHIFT: 'Night', Y: 32 },
  { SHIFT: 'Night', Y: 33 },
  { SHIFT: 'Night', Y: 34 },
];

// SHIFT splits nothing on a THIN sample (4 per group, 8 total) → not significant,
// but BELOW the per-group power floor (DISCONFIRM_MIN_PER_GROUP = 10). This is the
// masked-effect / low-power trap: a null here is low power, NOT evidence of
// absence. The spindle case must NOT falsely refute on a sample this thin.
const flatThinRows: DataRow[] = shiftRows(4, 0);

// SHIFT splits nothing on an ADEQUATELY-POWERED sample (10 per group, 20 total) →
// a TRUE null with enough power to trust → a legitimate refutation. This is the
// existing refute behaviour, preserved above the floor.
const flatPoweredRows: DataRow[] = shiftRows(10, 0);

describe('evaluateDisconfirmation — the engine-graded verdict (spec §4.2)', () => {
  it('a SIGNIFICANT result → survived + supports (the cause withstood the attempt)', () => {
    const result = evaluateDisconfirmation(significantRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.verdict).toBe('survived');
    expect(result!.validationStatus).toBe('supports');
    expect(result!.refutes).toBe(false);
    expect(result!.lowPower).toBe(false);
  });

  it('a SIGNIFICANT result on small-n still → survived (a strong effect detected despite low power is real)', () => {
    // 4 per group, but the effect is huge (gap 30) → significant despite small n.
    // The power floor must NEVER block a survive.
    const smallButStrong: DataRow[] = shiftRows(4, 30);
    const result = evaluateDisconfirmation(smallButStrong, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.verdict).toBe('survived');
    expect(result!.validationStatus).toBe('supports');
    expect(result!.lowPower).toBe(false);
  });

  it('MAJOR-1: a NOT-significant result BELOW the power floor → pending + inconclusive, NEVER refuted/red (the masked-effect / low-power case)', () => {
    const result = evaluateDisconfirmation(flatThinRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.lowPower).toBe(true);
    expect(result!.verdict).toBe('pending');
    expect(result!.validationStatus).toBe('inconclusive');
    // The cardinal honesty guarantee: a thin null is NOT a refutation → no red card.
    expect(result!.refutes).toBe(false);
    // The finding text is the soft "collect more" message, not a refutation.
    expect(result!.findingText).toContain('too few rows to draw a conclusion');
  });

  it('a NOT-significant result ABOVE the power floor → refuted + contradicts + refutes (a true null, the spindle inversion)', () => {
    const result = evaluateDisconfirmation(flatPoweredRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.lowPower).toBe(false);
    expect(result!.verdict).toBe('refuted');
    expect(result!.validationStatus).toBe('contradicts');
    expect(result!.refutes).toBe(true);
  });

  it('the refuted classification is the INVERSION of the plain evaluate (which is inconclusive)', () => {
    // Same powered flat data: the plain FE-2a evaluate is inconclusive; the
    // disconfirmation evaluate (under an attempt to break it) is refuted. Keystone.
    const disconfirm = evaluateDisconfirmation(flatPoweredRows, 'SHIFT', 'Y');
    expect(disconfirm!.refutes).toBe(true);
    expect(disconfirm!.validationStatus).toBe('contradicts');
  });

  it('returns null when the underlying test cannot run (constant factor)', () => {
    const constantRows: DataRow[] = [
      { SHIFT: 'Day', Y: 10 },
      { SHIFT: 'Day', Y: 11 },
      { SHIFT: 'Day', Y: 12 },
    ];
    expect(evaluateDisconfirmation(constantRows, 'SHIFT', 'Y')).toBeNull();
  });

  it('is deterministic — identical inputs produce identical p-values', () => {
    const a = evaluateDisconfirmation(significantRows, 'SHIFT', 'Y');
    const b = evaluateDisconfirmation(significantRows, 'SHIFT', 'Y');
    expect(a!.pValue).toBeCloseTo(b!.pValue, 12);
  });
});

describe('MAJOR-1 — the power floor on the regression (continuous) refute path', () => {
  // A continuous factor with no relationship to Y, on a sample below the total-n
  // floor (DISCONFIRM_MIN_ABSOLUTE = 20) → low-power null → pending, not refuted.
  // X sweeps monotonically; Y holds a flat mean with a small ZERO-SLOPE zig-zag
  // (symmetric ±1 noise that does not track X) so the regression slope is ~0 →
  // not significant. Deterministic (no RNG).
  function noisyContinuousRows(n: number): DataRow[] {
    const rows: DataRow[] = [];
    const zigzag = [0, 1, 0, -1]; // mean 0, uncorrelated with the monotone X
    for (let i = 0; i < n; i++) {
      rows.push({ X: i + 1, Y: 20 + zigzag[i % zigzag.length] });
    }
    return rows;
  }

  it('a NOT-significant regression result BELOW the total-n floor → pending + inconclusive (not refuted)', () => {
    const result = evaluateDisconfirmation(noisyContinuousRows(8), 'X', 'Y', {
      tool: 'regression',
    });
    expect(result).not.toBeNull();
    expect(result!.tool).toBe('regression');
    expect(result!.isSignificant).toBe(false);
    expect(result!.lowPower).toBe(true);
    expect(result!.verdict).toBe('pending');
    expect(result!.refutes).toBe(false);
  });

  it('a NOT-significant regression result ABOVE the total-n floor → refuted (a true null)', () => {
    const result = evaluateDisconfirmation(noisyContinuousRows(30), 'X', 'Y', {
      tool: 'regression',
    });
    expect(result).not.toBeNull();
    expect(result!.tool).toBe('regression');
    expect(result!.isSignificant).toBe(false);
    expect(result!.lowPower).toBe(false);
    expect(result!.verdict).toBe('refuted');
    expect(result!.refutes).toBe(true);
  });
});

describe('disconfirmation finding text recognition (idempotency)', () => {
  it('recognises its own survived/refuted/low-power templates per factor', () => {
    const survived = disconfirmationFindingText('SHIFT', true, 0.001);
    const refuted = disconfirmationFindingText('SHIFT', false, 0.42);
    const lowPower = disconfirmationFindingText('SHIFT', false, 0.42, true);
    expect(isDisconfirmationFindingForFactor(survived, 'SHIFT')).toBe(true);
    expect(isDisconfirmationFindingForFactor(refuted, 'SHIFT')).toBe(true);
    expect(isDisconfirmationFindingForFactor(lowPower, 'SHIFT')).toBe(true);
  });

  it('does NOT cross-match the plain evaluate finding text', () => {
    const plain = evaluateFindingText('SHIFT', true, 0.001);
    expect(isDisconfirmationFindingForFactor(plain, 'SHIFT')).toBe(false);
  });

  it('does NOT match a different factor', () => {
    const survived = disconfirmationFindingText('SHIFT', true, 0.001);
    expect(isDisconfirmationFindingForFactor(survived, 'MACHINE')).toBe(false);
  });
});
