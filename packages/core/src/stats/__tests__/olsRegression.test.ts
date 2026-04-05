/**
 * Unit tests for QR-based OLS regression solver.
 */

import { describe, it, expect } from 'vitest';
import { solveOLS } from '../olsRegression';
import type { OLSSolution } from '../olsRegression';

// ============================================================================
// Helpers
// ============================================================================

/** Build column-major X from row-major 2D array */
function toColumnMajor(rows: number[][]): Float64Array[] {
  const n = rows.length;
  const p = rows[0].length;
  const X: Float64Array[] = Array.from({ length: p }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      X[j][i] = rows[i][j];
    }
  }
  return X;
}

// ============================================================================
// Simple regression tests
// ============================================================================

describe('solveOLS', () => {
  describe('simple linear regression: y = 2 + 3x', () => {
    // Perfect fit: y = 2 + 3x with no noise
    const xVals = [1, 2, 3, 4, 5];
    const n = xVals.length;
    const p = 2;

    const X = toColumnMajor(xVals.map(x => [1, x]));
    const y = Float64Array.from(xVals.map(x => 2 + 3 * x));

    let result: OLSSolution;

    it('should solve without errors', () => {
      result = solveOLS(X, y, n, p);
      expect(result).toBeDefined();
    });

    it('should recover exact coefficients', () => {
      result = solveOLS(X, y, n, p);
      expect(result.coefficients[0]).toBeCloseTo(2, 10);
      expect(result.coefficients[1]).toBeCloseTo(3, 10);
    });

    it('should have R² = 1 for perfect fit', () => {
      result = solveOLS(X, y, n, p);
      expect(result.rSquared).toBeCloseTo(1, 10);
    });

    it('should have zero residuals', () => {
      result = solveOLS(X, y, n, p);
      for (let i = 0; i < n; i++) {
        expect(Math.abs(result.residuals[i])).toBeLessThan(1e-10);
      }
    });

    it('should have SSE ≈ 0', () => {
      result = solveOLS(X, y, n, p);
      expect(result.sse).toBeLessThan(1e-20);
    });

    it('should have full rank', () => {
      result = solveOLS(X, y, n, p);
      expect(result.rank).toBe(p);
    });
  });

  describe('regression with noise', () => {
    // y = 1 + 2x + noise
    const data = [
      [1, 3.1],
      [2, 4.9],
      [3, 7.2],
      [4, 8.8],
      [5, 11.1],
      [6, 13.0],
      [7, 14.9],
      [8, 17.2],
      [9, 18.8],
      [10, 21.1],
    ];
    const n = data.length;
    const p = 2;
    const X = toColumnMajor(data.map(([x]) => [1, x]));
    const y = Float64Array.from(data.map(([, yi]) => yi));

    it('should produce R² close to 1 for near-linear data', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.rSquared).toBeGreaterThan(0.99);
    });

    it('should produce sensible coefficient estimates', () => {
      const result = solveOLS(X, y, n, p);
      // Intercept should be near 1
      expect(result.coefficients[0]).toBeCloseTo(1, 0);
      // Slope should be near 2
      expect(result.coefficients[1]).toBeCloseTo(2, 0);
    });

    it('should compute correct SST', () => {
      const result = solveOLS(X, y, n, p);
      // SST = Σ(yi - ȳ)²
      const yMean = Array.from(y).reduce((s, v) => s + v, 0) / n;
      let expectedSST = 0;
      for (let i = 0; i < n; i++) {
        expectedSST += (y[i] - yMean) ** 2;
      }
      expect(result.sst).toBeCloseTo(expectedSST, 8);
    });

    it('should satisfy SST = SSR + SSE', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.sst).toBeCloseTo(result.ssr + result.sse, 8);
    });

    it('should produce significant F-statistic', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.fStatistic).toBeGreaterThan(100);
      expect(result.fPValue).toBeLessThan(0.001);
    });

    it('should produce valid standard errors', () => {
      const result = solveOLS(X, y, n, p);
      for (let i = 0; i < p; i++) {
        expect(result.standardErrors[i]).toBeGreaterThan(0);
      }
    });

    it('should have t-statistics consistent with coefficients / SE', () => {
      const result = solveOLS(X, y, n, p);
      for (let i = 0; i < p; i++) {
        expect(result.tStatistics[i]).toBeCloseTo(
          result.coefficients[i] / result.standardErrors[i],
          8
        );
      }
    });

    it('should compute correct RMSE', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.rmse).toBeCloseTo(Math.sqrt(result.sse / (n - p)), 10);
    });
  });

  describe('quadratic regression: y = 1 + 2x + 3x²', () => {
    const xVals = [-2, -1, 0, 1, 2, 3, 4];
    const n = xVals.length;
    const p = 3;
    const X = toColumnMajor(xVals.map(x => [1, x, x * x]));
    const y = Float64Array.from(xVals.map(x => 1 + 2 * x + 3 * x * x));

    it('should recover exact quadratic coefficients', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.coefficients[0]).toBeCloseTo(1, 10);
      expect(result.coefficients[1]).toBeCloseTo(2, 10);
      expect(result.coefficients[2]).toBeCloseTo(3, 10);
    });

    it('should have R² = 1', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.rSquared).toBeCloseTo(1, 10);
    });
  });

  describe('multiple regression: y = 1 + 2x₁ + 3x₂', () => {
    const data = [
      [1, 1, 1],
      [1, 2, 1],
      [1, 1, 2],
      [1, 2, 2],
      [1, 3, 1],
      [1, 1, 3],
      [1, 3, 3],
      [1, 2, 3],
    ];
    const n = data.length;
    const p = 3;
    const X = toColumnMajor(data);
    const y = Float64Array.from(data.map(([, x1, x2]) => 1 + 2 * x1 + 3 * x2));

    it('should recover exact coefficients', () => {
      const result = solveOLS(X, y, n, p);
      expect(result.coefficients[0]).toBeCloseTo(1, 10);
      expect(result.coefficients[1]).toBeCloseTo(2, 10);
      expect(result.coefficients[2]).toBeCloseTo(3, 10);
    });
  });

  describe('edge cases', () => {
    it('should throw for underdetermined system', () => {
      const X = toColumnMajor([[1, 1, 1]]);
      const y = Float64Array.from([1]);
      expect(() => solveOLS(X, y, 1, 3)).toThrow('Underdetermined');
    });

    it('should handle exactly determined system (n = p)', () => {
      const X = toColumnMajor([
        [1, 1],
        [1, 2],
      ]);
      const y = Float64Array.from([3, 5]);
      const result = solveOLS(X, y, 2, 2);
      expect(result.coefficients[0]).toBeCloseTo(1, 10); // intercept
      expect(result.coefficients[1]).toBeCloseTo(2, 10); // slope
    });

    it('should detect rank deficiency with duplicate columns', () => {
      // X has col2 = col1 → rank deficient
      const X = toColumnMajor([
        [1, 1, 1],
        [1, 2, 2],
        [1, 3, 3],
        [1, 4, 4],
        [1, 5, 5],
      ]);
      const y = Float64Array.from([3, 5, 7, 9, 11]);
      const result = solveOLS(X, y, 5, 3);
      expect(result.rank).toBeLessThan(3);
    });

    it('should handle constant y (SST = 0)', () => {
      const X = toColumnMajor([
        [1, 1],
        [1, 2],
        [1, 3],
      ]);
      const y = Float64Array.from([5, 5, 5]);
      const result = solveOLS(X, y, 3, 2);
      expect(result.rSquared).toBe(1); // sst = 0, perfect trivial fit
    });

    it('should report condition number', () => {
      const X = toColumnMajor([
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
      ]);
      const y = Float64Array.from([2, 4, 6, 8]);
      const result = solveOLS(X, y, 4, 2);
      expect(result.conditionNumber).toBeGreaterThan(0);
      expect(isFinite(result.conditionNumber)).toBe(true);
    });
  });

  describe('R²adj calculation', () => {
    it('should penalize overfitting (R²adj < R²)', () => {
      // More parameters than needed → R²adj should be lower than R²
      const xVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const n = xVals.length;
      const p = 4; // intercept + 3 predictors (some are noise)
      const X = toColumnMajor(xVals.map(x => [1, x, Math.random(), Math.random()]));
      const y = Float64Array.from(xVals.map(x => 2 + 3 * x + Math.random()));
      const result = solveOLS(X, y, n, p);
      // With noise predictors, R²adj should be less than R²
      expect(result.rSquaredAdj).toBeLessThanOrEqual(result.rSquared);
    });
  });

  describe('residuals orthogonality', () => {
    it('residuals should be orthogonal to each column of X', () => {
      const data = [
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
        [1, 7],
        [1, 8],
      ];
      const n = data.length;
      const p = 2;
      const X = toColumnMajor(data);
      const y = Float64Array.from([2.1, 3.9, 6.2, 8.1, 9.8, 12.1, 14.0, 15.9]);
      const result = solveOLS(X, y, n, p);

      for (let j = 0; j < p; j++) {
        let dot = 0;
        for (let i = 0; i < n; i++) {
          dot += X[j][i] * result.residuals[i];
        }
        expect(Math.abs(dot)).toBeLessThan(1e-8);
      }
    });
  });
});
