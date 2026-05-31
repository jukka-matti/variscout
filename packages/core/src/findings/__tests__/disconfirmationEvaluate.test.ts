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

// SHIFT splits nothing → the predicted relationship is absent (not significant).
// This is the spindle case: shift does NOT relate to the outcome once controlled.
const flatRows: DataRow[] = [
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Day', Y: 21 },
  { SHIFT: 'Day', Y: 19 },
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Night', Y: 20 },
  { SHIFT: 'Night', Y: 21 },
  { SHIFT: 'Night', Y: 19 },
  { SHIFT: 'Night', Y: 20 },
];

describe('evaluateDisconfirmation — the engine-graded verdict (spec §4.2)', () => {
  it('a SIGNIFICANT result → survived + supports (the cause withstood the attempt)', () => {
    const result = evaluateDisconfirmation(significantRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.verdict).toBe('survived');
    expect(result!.validationStatus).toBe('supports');
    expect(result!.refutes).toBe(false);
  });

  it('a NOT-significant result → refuted + contradicts + refutes (the spindle inversion)', () => {
    const result = evaluateDisconfirmation(flatRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.verdict).toBe('refuted');
    expect(result!.validationStatus).toBe('contradicts');
    expect(result!.refutes).toBe(true);
  });

  it('the refuted classification is the INVERSION of the plain evaluate (which is inconclusive)', () => {
    // Same flat data: the plain FE-2a evaluate is inconclusive; the disconfirmation
    // evaluate (under an attempt to break it) is refuted. This is the keystone.
    const disconfirm = evaluateDisconfirmation(flatRows, 'SHIFT', 'Y');
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

describe('disconfirmation finding text recognition (idempotency)', () => {
  it('recognises its own survived/refuted templates per factor', () => {
    const survived = disconfirmationFindingText('SHIFT', true, 0.001);
    const refuted = disconfirmationFindingText('SHIFT', false, 0.42);
    expect(isDisconfirmationFindingForFactor(survived, 'SHIFT')).toBe(true);
    expect(isDisconfirmationFindingForFactor(refuted, 'SHIFT')).toBe(true);
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
