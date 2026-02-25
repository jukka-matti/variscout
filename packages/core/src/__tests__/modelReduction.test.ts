import { describe, it, expect } from 'vitest';
import { suggestTermRemoval } from '../stats';
import type { MultiRegressionResult, CoefficientResult, RegressionTerm } from '../types';

/**
 * Helper to create a minimal MultiRegressionResult for testing suggestTermRemoval.
 * Only the coefficients array matters for the function under test.
 */
function makeResult(coefficients: CoefficientResult[]): MultiRegressionResult {
  return {
    yColumn: 'Y',
    xColumns: coefficients.map(c => c.term),
    terms: coefficients.map(c => c.termInfo),
    n: 100,
    p: coefficients.length,
    rSquared: 0.5,
    adjustedRSquared: 0.45,
    fStatistic: 10,
    pValue: 0.001,
    isSignificant: true,
    rmse: 1.0,
    intercept: 5.0,
    coefficients,
    vifWarnings: [],
    hasCollinearity: false,
    insight: 'test',
    topPredictors: [],
    strengthRating: 3,
  };
}

function makeCoeff(overrides: Partial<CoefficientResult> & { term: string }): CoefficientResult {
  const termInfo: RegressionTerm = overrides.termInfo ?? {
    columns: [overrides.term],
    label: overrides.term,
    type: 'continuous',
  };
  return {
    term: overrides.term,
    coefficient: overrides.coefficient ?? 1.0,
    stdError: overrides.stdError ?? 0.5,
    tStatistic: overrides.tStatistic ?? 2.0,
    pValue: overrides.pValue ?? 0.01,
    isSignificant: overrides.isSignificant ?? true,
    standardized: overrides.standardized ?? 0.3,
    vif: overrides.vif,
    termInfo,
  };
}

describe('suggestTermRemoval', () => {
  it('returns null when all terms are significant', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true }),
      makeCoeff({ term: 'B', pValue: 0.03, isSignificant: true }),
    ]);

    expect(suggestTermRemoval(result)).toBeNull();
  });

  it('returns null for empty coefficients', () => {
    const result = makeResult([]);
    expect(suggestTermRemoval(result)).toBeNull();
  });

  it('suggests the single non-significant term', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true }),
      makeCoeff({ term: 'B', pValue: 0.45, isSignificant: false }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.term).toBe('B');
    expect(suggestion!.reason).toBe('not_significant');
    expect(suggestion!.pValue).toBeCloseTo(0.45);
  });

  it('suggests the term with highest p-value among non-significant', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true }),
      makeCoeff({ term: 'B', pValue: 0.12, isSignificant: false }),
      makeCoeff({ term: 'C', pValue: 0.72, isSignificant: false }),
      makeCoeff({ term: 'D', pValue: 0.34, isSignificant: false }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion!.term).toBe('C');
    expect(suggestion!.pValue).toBeCloseTo(0.72);
  });

  it('prefers interaction terms over main effects at similar p-values', () => {
    const result = makeResult([
      makeCoeff({
        term: 'A',
        pValue: 0.5,
        isSignificant: false,
        termInfo: { columns: ['A'], label: 'A', type: 'continuous' },
      }),
      makeCoeff({
        term: 'A x B',
        pValue: 0.5,
        isSignificant: false,
        termInfo: { columns: ['A', 'B'], label: 'A x B', type: 'interaction' },
      }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion!.term).toBe('A x B');
  });

  it('prioritizes severe VIF regardless of p-value significance', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.001, isSignificant: true, vif: 15.2 }),
      makeCoeff({ term: 'B', pValue: 0.72, isSignificant: false, vif: 1.5 }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion!.term).toBe('A');
    expect(suggestion!.reason).toBe('high_vif');
    expect(suggestion!.explanation).toContain('VIF');
  });

  it('picks the worst VIF when multiple terms have severe VIF', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true, vif: 12.0 }),
      makeCoeff({ term: 'B', pValue: 0.02, isSignificant: true, vif: 25.0 }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion!.term).toBe('B');
    expect(suggestion!.reason).toBe('high_vif');
  });

  it('does not flag VIF below threshold', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true, vif: 3.5 }),
      makeCoeff({ term: 'B', pValue: 0.02, isSignificant: true, vif: 8.0 }),
    ]);

    // VIF 8.0 is moderate but not severe (>10), and both terms are significant
    expect(suggestTermRemoval(result)).toBeNull();
  });

  it('returns explanation with term type', () => {
    const result = makeResult([
      makeCoeff({
        term: 'Temp x Press',
        pValue: 0.85,
        isSignificant: false,
        termInfo: { columns: ['Temp', 'Press'], label: 'Temp x Press', type: 'interaction' },
      }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion!.explanation).toContain('interaction term');
  });

  // ==========================================================================
  // VIF boundary semantics
  // ==========================================================================

  it('VIF exactly 10.0 → does NOT trigger high_vif (strict >10 threshold)', () => {
    // suggestTermRemoval uses vif > 10 (strict), not >= 10
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true, vif: 10.0 }),
      makeCoeff({ term: 'B', pValue: 0.02, isSignificant: true, vif: 4.0 }),
    ]);

    // VIF 10.0 is NOT > 10, so no severe VIF; both significant → null
    expect(suggestTermRemoval(result)).toBeNull();
  });

  it('VIF 10.001 → triggers high_vif', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.01, isSignificant: true, vif: 10.001 }),
      makeCoeff({ term: 'B', pValue: 0.02, isSignificant: true, vif: 4.0 }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.term).toBe('A');
    expect(suggestion!.reason).toBe('high_vif');
  });

  it('non-significant AND high VIF → VIF wins (high_vif reason)', () => {
    const result = makeResult([
      makeCoeff({ term: 'A', pValue: 0.8, isSignificant: false, vif: 15.0 }),
      makeCoeff({ term: 'B', pValue: 0.02, isSignificant: true, vif: 2.0 }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.term).toBe('A');
    // VIF is first priority, so reason should be high_vif
    expect(suggestion!.reason).toBe('high_vif');
  });

  it('not_significant explanation contains term name', () => {
    const result = makeResult([
      makeCoeff({ term: 'Pressure', pValue: 0.42, isSignificant: false, vif: 2.0 }),
    ]);

    const suggestion = suggestTermRemoval(result);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.reason).toBe('not_significant');
    expect(suggestion!.explanation).toContain('Pressure');
  });
});
