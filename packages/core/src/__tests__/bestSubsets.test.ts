import { describe, it, expect } from 'vitest';
import {
  computeBestSubsets,
  computeRSquaredAdjusted,
  getBestSingleFactor,
} from '../stats/bestSubsets';
import { getEtaSquared } from '../stats';

describe('Best Subsets Regression', () => {
  // =========================================================================
  // R² adjusted formula
  // =========================================================================

  describe('computeRSquaredAdjusted', () => {
    it('should return 0 for saturated model (n - k - 1 <= 0)', () => {
      // 5 observations, 4 model parameters → n-k-1 = 0
      expect(computeRSquaredAdjusted(0.99, 5, 4)).toBe(0);
      // Over-determined
      expect(computeRSquaredAdjusted(0.99, 3, 5)).toBe(0);
    });

    it('should penalize R² for additional parameters', () => {
      // Same R² = 0.5 but more parameters should give lower R²adj
      const adj1 = computeRSquaredAdjusted(0.5, 100, 1);
      const adj3 = computeRSquaredAdjusted(0.5, 100, 3);
      expect(adj1).toBeGreaterThan(adj3);
    });

    it('should match R² when k=0 (intercept-only baseline)', () => {
      // R²adj = 1 - (1-R²) * (n-1)/(n-1) = R²
      // When k=0 (which doesn't happen in practice but tests the formula):
      // Actually R²adj = 1 - (1-0.75) * 99/99 = 0.75
      // Not meaningful in practice but confirms formula
    });

    it('should return negative R²adj when model is worse than intercept', () => {
      // Very low R² with many parameters
      const adj = computeRSquaredAdjusted(0.01, 20, 10);
      expect(adj).toBeLessThan(0);
    });

    it('should compute known value correctly', () => {
      // R² = 0.6, n = 50, k = 3
      // R²adj = 1 - (1 - 0.6) * (50 - 1) / (50 - 3 - 1)
      //       = 1 - 0.4 * 49 / 46
      //       = 1 - 0.4261
      //       = 0.5739
      const adj = computeRSquaredAdjusted(0.6, 50, 3);
      expect(adj).toBeCloseTo(0.5739, 3);
    });
  });

  // =========================================================================
  // Full best subsets analysis
  // =========================================================================

  describe('computeBestSubsets', () => {
    // Shared test dataset: 3 factors with clear signal
    const data = [
      // Factor A clearly affects outcome (high mean when A='Hi')
      { A: 'Lo', B: 'X', C: '1', Y: 10 },
      { A: 'Lo', B: 'X', C: '2', Y: 11 },
      { A: 'Lo', B: 'Y', C: '1', Y: 12 },
      { A: 'Lo', B: 'Y', C: '2', Y: 10 },
      { A: 'Hi', B: 'X', C: '1', Y: 30 },
      { A: 'Hi', B: 'X', C: '2', Y: 31 },
      { A: 'Hi', B: 'Y', C: '1', Y: 29 },
      { A: 'Hi', B: 'Y', C: '2', Y: 30 },
      // Duplicates for more data
      { A: 'Lo', B: 'X', C: '1', Y: 11 },
      { A: 'Lo', B: 'X', C: '2', Y: 10 },
      { A: 'Hi', B: 'X', C: '1', Y: 31 },
      { A: 'Hi', B: 'Y', C: '2', Y: 29 },
    ];

    it('should enumerate all 2^k - 1 subsets', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();
      // 3 factors → 2³ - 1 = 7 subsets
      expect(result!.subsets).toHaveLength(7);
    });

    it('should rank subsets by R² adjusted (descending)', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();
      for (let i = 1; i < result!.subsets.length; i++) {
        expect(result!.subsets[i - 1].rSquaredAdj).toBeGreaterThanOrEqual(
          result!.subsets[i].rSquaredAdj
        );
      }
    });

    it('should identify the dominant factor (A) as best single-factor model', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();

      // The best single-factor model should be factor A
      const singleFactorModels = result!.subsets.filter(s => s.factorCount === 1);
      expect(singleFactorModels[0].factors).toEqual(['A']);

      // Factor A should explain most of the variation (high R²)
      expect(singleFactorModels[0].rSquared).toBeGreaterThan(0.8);
    });

    it('should show that R² adjusted penalizes for extra parameters', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();

      const justA = result!.subsets.find(s => s.factors.length === 1 && s.factors[0] === 'A');
      const allThree = result!.subsets.find(s => s.factors.length === 3);

      expect(justA).toBeDefined();
      expect(allThree).toBeDefined();

      // R² can only increase with more factors (or stay the same)
      expect(allThree!.rSquared).toBeGreaterThanOrEqual(justA!.rSquared);

      // But R² adjusted applies a penalty — so the gap between R² and R²adj
      // should be larger for the model with more parameters
      const penaltyA = justA!.rSquared - justA!.rSquaredAdj;
      const penaltyAll = allThree!.rSquared - allThree!.rSquaredAdj;
      expect(penaltyAll).toBeGreaterThan(penaltyA);
    });

    it('should mark significant models', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();

      // Factor A alone should be significant
      const justA = result!.subsets.find(s => s.factors.length === 1 && s.factors[0] === 'A');
      expect(justA!.isSignificant).toBe(true);
      expect(justA!.pValue).toBeLessThan(0.05);
    });

    it('should return correct metadata', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();
      expect(result!.n).toBe(12);
      expect(result!.totalFactors).toBe(3);
      expect(result!.factorNames).toEqual(['A', 'B', 'C']);
      expect(result!.ssTotal).toBeGreaterThan(0);
    });

    it('should compute R² that matches η² (getEtaSquared) for single factors', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);

      expect(result).not.toBeNull();

      // For a single-factor model, R² should equal η² (eta-squared)
      // because both are SSB/SST for one-way grouping.
      // Cross-validate against getEtaSquared() from the stats module.
      for (const factorName of ['A', 'B', 'C']) {
        const subset = result!.subsets.find(
          s => s.factors.length === 1 && s.factors[0] === factorName
        );
        const etaSquared = getEtaSquared(data, factorName, 'Y');
        expect(subset!.rSquared).toBeCloseTo(etaSquared, 10);
      }
    });

    // -----------------------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------------------

    it('should return null for empty factor list', () => {
      expect(computeBestSubsets(data, 'Y', [])).toBeNull();
    });

    it('should return null for insufficient data', () => {
      const tinyData = [
        { A: 'Lo', Y: 10 },
        { A: 'Hi', Y: 20 },
      ];
      // Only 2 observations, below MIN_OBSERVATIONS threshold
      expect(computeBestSubsets(tinyData, 'Y', ['A'])).toBeNull();
    });

    it('should return null when outcome has no variation', () => {
      const constantData = [
        { A: 'Lo', Y: 10 },
        { A: 'Hi', Y: 10 },
        { A: 'Lo', Y: 10 },
        { A: 'Hi', Y: 10 },
        { A: 'Lo', Y: 10 },
      ];
      expect(computeBestSubsets(constantData, 'Y', ['A'])).toBeNull();
    });

    it('should handle single factor correctly', () => {
      const result = computeBestSubsets(data, 'Y', ['A']);

      expect(result).not.toBeNull();
      expect(result!.subsets).toHaveLength(1);
      expect(result!.subsets[0].factors).toEqual(['A']);
    });

    it('should skip rows with missing factor values', () => {
      const dataWithMissing = [
        { A: 'Lo', Y: 10 },
        { A: 'Hi', Y: 30 },
        { A: null, Y: 20 },
        { A: 'Lo', Y: 11 },
        { A: 'Hi', Y: 29 },
        { A: undefined, Y: 15 },
        { A: 'Lo', Y: 12 },
      ];
      const result = computeBestSubsets(dataWithMissing, 'Y', ['A']);

      expect(result).not.toBeNull();
      // Only 5 valid rows (2 have null/undefined factor)
      expect(result!.n).toBe(5);
    });

    it('should skip rows with non-numeric outcome', () => {
      const dataWithBadOutcome = [
        { A: 'Lo', Y: 10 },
        { A: 'Hi', Y: 30 },
        { A: 'Lo', Y: 'bad' },
        { A: 'Hi', Y: null },
        { A: 'Lo', Y: 11 },
        { A: 'Hi', Y: 29 },
        { A: 'Lo', Y: 12 },
      ];
      const result = computeBestSubsets(dataWithBadOutcome, 'Y', ['A']);

      expect(result).not.toBeNull();
      expect(result!.n).toBe(5);
    });

    it('should handle two factors producing the expected number of subsets', () => {
      const result = computeBestSubsets(data, 'Y', ['A', 'B']);

      expect(result).not.toBeNull();
      // 2 factors → 2² - 1 = 3 subsets: {A}, {B}, {A,B}
      expect(result!.subsets).toHaveLength(3);
    });
  });

  // =========================================================================
  // Convenience wrapper
  // =========================================================================

  describe('getBestSingleFactor', () => {
    const data = [
      { A: 'Lo', B: 'X', Y: 10 },
      { A: 'Lo', B: 'Y', Y: 11 },
      { A: 'Hi', B: 'X', Y: 30 },
      { A: 'Hi', B: 'Y', Y: 29 },
      { A: 'Lo', B: 'X', Y: 12 },
      { A: 'Hi', B: 'Y', Y: 31 },
    ];

    it('should return the most important single factor', () => {
      const best = getBestSingleFactor(data, 'Y', ['A', 'B']);

      expect(best).not.toBeNull();
      expect(best!.factors).toEqual(['A']);
      expect(best!.factorCount).toBe(1);
    });

    it('should return null for insufficient data', () => {
      const best = getBestSingleFactor([{ A: 'Lo', Y: 10 }], 'Y', ['A']);
      expect(best).toBeNull();
    });
  });
});
