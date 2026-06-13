/**
 * computeDefectRateShares — level-native rate contribution tests (Task 1 / ER-5b).
 *
 * Test strategy:
 *   - Pure TS, no React.
 *   - Deterministic datasets (no Math.random).
 *   - 2-factor fixture: one factor perfectly separates defect rate (high
 *     concentration); one is flat (≈0). Assert ranking order + flat factor ≈ 0.
 *   - Number.isFinite guards: empty data, single-level factor return safe values.
 *   - Y-derived columns excluded via excludeYDerivedFactors.
 *   - Statistics (ADR-088): rate share is level-native rate contribution, NOT
 *     variance share.
 */

import { describe, it, expect } from 'vitest';
import type { DataRow } from '../../types';
import { computeDefectRateShares } from '../rateShares';

// ── Dataset builders ─────────────────────────────────────────────────────────

/**
 * Two-factor dataset where Queue perfectly separates defect rate:
 *   Queue=Billing: all 10 rows are defects (rate=1.0)
 *   Queue=Claims: 0 defects (rate=0.0)
 *   Shift alternates Day/Night equally in each queue → flat (rate ≈ 0.5 in each)
 */
function makeQueueShiftRows(): DataRow[] {
  const rows: DataRow[] = [];
  // Billing — all defects
  for (let i = 0; i < 10; i++) {
    rows.push({
      Queue: 'Billing',
      Shift: i % 2 === 0 ? 'Day' : 'Night',
      DefectCount: 1,
      DefectRate: 1.0,
    });
  }
  // Claims — no defects
  for (let i = 0; i < 10; i++) {
    rows.push({
      Queue: 'Claims',
      Shift: i % 2 === 0 ? 'Day' : 'Night',
      DefectCount: 0,
      DefectRate: 0.0,
    });
  }
  return rows;
}

/**
 * Single-level factor dataset: Queue has only one level — should produce
 * safe output (concentration ≈ 0 or undefined) without NaN/Infinity.
 */
function makeSingleLevelRows(): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < 5; i++) {
    rows.push({ Queue: 'Billing', DefectRate: i < 3 ? 1 : 0 });
  }
  return rows;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('computeDefectRateShares', () => {
  const outcomeColumn = 'DefectRate';
  const factors = ['Queue', 'Shift'];

  it('ranks Queue (perfect separator) above Shift (flat) by concentration', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, factors, outcomeColumn);

    expect(result).not.toBeNull();
    expect(result.length).toBe(2);

    // Queue must rank first (highest concentration)
    expect(result[0].factor).toBe('Queue');
    // Shift should be second
    expect(result[1].factor).toBe('Shift');

    // Queue concentration should be significantly above Shift
    expect(result[0].concentration).toBeGreaterThan(result[1].concentration);
  });

  it('Queue concentration is large, Shift concentration is approximately 0', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, factors, outcomeColumn);

    expect(result[0].concentration).toBeGreaterThan(0.1);
    // Shift is flat — concentration should be near 0
    expect(result[1].concentration).toBeCloseTo(0, 1);
  });

  it('per-level data: Queue=Billing has rate=1.0 and Queue=Claims has rate=0.0', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, factors, outcomeColumn);

    const queueShare = result.find(r => r.factor === 'Queue');
    expect(queueShare).toBeDefined();
    const billingLevel = queueShare!.perLevel.find(l => l.level === 'Billing');
    const claimsLevel = queueShare!.perLevel.find(l => l.level === 'Claims');
    expect(billingLevel).toBeDefined();
    expect(claimsLevel).toBeDefined();
    expect(billingLevel!.rate).toBeCloseTo(1.0, 5);
    expect(claimsLevel!.rate).toBeCloseTo(0.0, 5);
    // Exposures should sum to 20 (total rows)
    expect(billingLevel!.n + claimsLevel!.n).toBe(20);
  });

  it('significance flag: Queue is significant, Shift is not', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, factors, outcomeColumn);

    const queueShare = result.find(r => r.factor === 'Queue');
    const shiftShare = result.find(r => r.factor === 'Shift');
    expect(queueShare!.isSignificant).toBe(true);
    expect(shiftShare!.isSignificant).toBe(false);
  });

  it('returns empty array for empty data (no NaN/Infinity)', () => {
    const result = computeDefectRateShares([], factors, outcomeColumn);
    expect(result).toEqual([]);
  });

  it('returns empty array when no factors provided', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, [], outcomeColumn);
    expect(result).toEqual([]);
  });

  it('single-level factor: concentration is finite (not NaN/Infinity)', () => {
    const rows = makeSingleLevelRows();
    const result = computeDefectRateShares(rows, ['Queue'], outcomeColumn);
    // Single-level factor produces 0 concentration (no spread between levels)
    if (result.length > 0) {
      const concentration = result[0].concentration;
      expect(Number.isFinite(concentration)).toBe(true);
    }
  });

  it('excludes Y-derived columns (outcomeColumn itself not in factors)', () => {
    // Even if caller passes outcome as a factor, the function should exclude it
    const rows = makeQueueShiftRows();
    const factorsWithOutcome = ['Queue', 'Shift', 'DefectRate'];
    const result = computeDefectRateShares(rows, factorsWithOutcome, outcomeColumn);
    // DefectRate should not appear in results
    const outcomeInResult = result.find(r => r.factor === 'DefectRate');
    expect(outcomeInResult).toBeUndefined();
  });

  it('all concentration values are finite numbers, never NaN or Infinity', () => {
    const rows = makeQueueShiftRows();
    const result = computeDefectRateShares(rows, factors, outcomeColumn);
    for (const share of result) {
      expect(Number.isFinite(share.concentration)).toBe(true);
      for (const level of share.perLevel) {
        expect(Number.isFinite(level.rate)).toBe(true);
        expect(Number.isFinite(level.share)).toBe(true);
        expect(Number.isFinite(level.n)).toBe(true);
      }
    }
  });

  it('is deterministic — same input produces same output', () => {
    const rows = makeQueueShiftRows();
    const result1 = computeDefectRateShares(rows, factors, outcomeColumn);
    const result2 = computeDefectRateShares(rows, factors, outcomeColumn);
    expect(result1).toEqual(result2);
  });
});
