/**
 * hypothesisTestPlan.test.ts — the hypothesis test-plan triad read-model + the
 * one-tap evaluate classification (Factors & Evaluation Increment 2a, spec §4).
 *
 * Determinism: fixed fixtures, no Date.now / Math.random / argless new Date,
 * float assertions via toBeCloseTo.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveHypothesisFactors,
  suggestToolForFactor,
  buildHypothesisTestPlan,
  evaluateHypothesisFactor,
} from '../hypothesisTestPlan';
import type { Hypothesis, Finding } from '../types';
import type { DataRow } from '../../types';

// ── fixtures ────────────────────────────────────────────────────────────────

function makeHub(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h1',
    name: 'Night shift runs hot',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    investigationId: 'inv-1',
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'finding',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    investigationId: 'inv-1',
    createdAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

// A deterministic dataset: outcome Y differs sharply by SHIFT (categorical) and
// rises with TEMP (continuous). SIZE is constant (no relationship).
// TEMP carries decimal precision so the engine classifies it as CONTINUOUS
// (the classifier treats ≤20 unique all-integer columns as categorical).
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

// A dataset where SHIFT has NO effect on Y (means equal) — drives inconclusive.
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

// ── deriveHypothesisFactors ───────────────────────────────────────────────────

describe('deriveHypothesisFactors', () => {
  it('derives factors from the hub condition', () => {
    const hub = makeHub({
      condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
    });
    expect(deriveHypothesisFactors(hub, [])).toEqual(['SHIFT']);
  });

  it('falls back to linked findings activeFilters columns when no condition', () => {
    const hub = makeHub({ findingIds: ['f1'] });
    const f = makeFinding({
      id: 'f1',
      context: { activeFilters: { TEMP: [30] }, cumulativeScope: null },
    });
    expect(deriveHypothesisFactors(hub, [f])).toEqual(['TEMP']);
  });

  it('returns empty when neither condition nor linked findings name columns', () => {
    expect(deriveHypothesisFactors(makeHub(), [])).toEqual([]);
  });
});

// ── suggestToolForFactor ──────────────────────────────────────────────────────

describe('suggestToolForFactor', () => {
  it('suggests boxplot + 2-sample for a categorical factor', () => {
    expect(suggestToolForFactor(rows, 'SHIFT')).toBe('two-sample');
  });

  it('suggests scatter + regression for a continuous factor', () => {
    expect(suggestToolForFactor(rows, 'TEMP')).toBe('regression');
  });
});

// ── buildHypothesisTestPlan ───────────────────────────────────────────────────

describe('buildHypothesisTestPlan', () => {
  it('tags a factor present in the data as ready with its suggested tool', () => {
    const hub = makeHub({
      condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
    });
    const plan = buildHypothesisTestPlan(hub, [], rows, 'Y');
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ factor: 'SHIFT', readiness: 'ready', tool: 'two-sample' });
  });

  it('tags a factor absent from the data as a gap', () => {
    const hub = makeHub({
      condition: { kind: 'leaf', column: 'OPERATOR', op: 'eq', value: 'Joe' },
    });
    const plan = buildHypothesisTestPlan(hub, [], rows, 'Y');
    expect(plan[0]).toMatchObject({ factor: 'OPERATOR', readiness: 'gap' });
  });
});

// ── evaluateHypothesisFactor ──────────────────────────────────────────────────

describe('evaluateHypothesisFactor', () => {
  it('classifies a significant categorical relationship as supports', () => {
    const result = evaluateHypothesisFactor(rows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.tool).toBe('two-sample');
    expect(result!.validationStatus).toBe('supports');
    expect(result!.refutes).toBeFalsy();
    expect(result!.pValue).toBeLessThan(0.05);
  });

  it('classifies a significant continuous relationship as supports', () => {
    const result = evaluateHypothesisFactor(rows, 'TEMP', 'Y');
    expect(result).not.toBeNull();
    expect(result!.tool).toBe('regression');
    expect(result!.validationStatus).toBe('supports');
    expect(result!.pValue).toBeLessThan(0.05);
  });

  it('classifies a non-significant relationship as inconclusive (NOT supporting)', () => {
    const result = evaluateHypothesisFactor(flatRows, 'SHIFT', 'Y');
    expect(result).not.toBeNull();
    expect(result!.validationStatus).toBe('inconclusive');
    expect(result!.validationStatus).not.toBe('supports');
    expect(result!.refutes).toBeFalsy();
    expect(result!.pValue).toBeGreaterThanOrEqual(0.05);
  });

  it('returns null when the factor has no usable variation in the data', () => {
    expect(evaluateHypothesisFactor(rows, 'SIZE', 'Y')).toBeNull();
  });

  it('produces a human-readable finding text using factor-side language', () => {
    const result = evaluateHypothesisFactor(rows, 'SHIFT', 'Y')!;
    expect(result.findingText.toLowerCase()).toContain('shift');
    expect(result.findingText.toLowerCase()).toContain('spread');
  });
});
