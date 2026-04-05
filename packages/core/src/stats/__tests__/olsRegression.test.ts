/**
 * Unit tests for QR-based OLS regression solver.
 */

import { describe, it, expect } from 'vitest';
import { solveOLS, shouldIncludeQuadratic } from '../olsRegression';
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

// ============================================================================
// shouldIncludeQuadratic tests
// ============================================================================

describe('shouldIncludeQuadratic', () => {
  // Deterministic pseudo-noise for reproducible tests (avoids Math.random())
  // Lehmer LCG: produces values in (-0.5, 0.5)
  function deterministicNoise(n: number, seed: number = 42, scale: number = 0.3): number[] {
    const noise: number[] = [];
    let s = seed;
    for (let i = 0; i < n; i++) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      noise.push(((s >>> 0) / 0xffffffff - 0.5) * scale);
    }
    return noise;
  }

  describe('linear data — quadratic term should NOT be significant', () => {
    // y = 2 + 3x + small noise; true relationship is linear
    const xVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const n = xVals.length;
    const noise = deterministicNoise(n, 7, 0.2);
    const x = Float64Array.from(xVals);
    const y = Float64Array.from(xVals.map((xi, i) => 2 + 3 * xi + noise[i]));

    it('should return include: false for linear data', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.include).toBe(false);
    });

    it('should have high p-value (> 0.10)', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.pValue).toBeGreaterThan(0.1);
    });

    it('should return valid R² values with linearR2 > 0.99', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.linearR2).toBeGreaterThan(0.99);
      expect(result.quadraticR2).toBeGreaterThanOrEqual(result.linearR2 - 0.01);
    });
  });

  describe('quadratic data — quadratic term SHOULD be significant', () => {
    // y = 2 + 3x - 0.5x² + small noise; true relationship is quadratic
    const xVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const n = xVals.length;
    const noise = deterministicNoise(n, 13, 0.5);
    const x = Float64Array.from(xVals);
    const y = Float64Array.from(xVals.map((xi, i) => 2 + 3 * xi - 0.5 * xi * xi + noise[i]));

    it('should return include: true for quadratic data', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.include).toBe(true);
    });

    it('should have low p-value (< 0.10)', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.pValue).toBeLessThan(0.1);
    });

    it('should show improvement: quadraticR2 >= linearR2', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.quadraticR2).toBeGreaterThanOrEqual(result.linearR2);
    });

    it('should return positive partialF', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.partialF).toBeGreaterThan(0);
    });
  });

  describe('perfect quadratic: y = x²', () => {
    const xVals = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const n = xVals.length;
    const x = Float64Array.from(xVals);
    const y = Float64Array.from(xVals.map(xi => xi * xi));

    it('should return include: true', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.include).toBe(true);
    });

    it('should have very low p-value', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.pValue).toBeLessThan(0.001);
    });

    it('should achieve near-perfect quadraticR2', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.quadraticR2).toBeGreaterThan(0.99);
    });
  });

  describe('flat data (constant y) — quadratic should NOT be significant', () => {
    const xVals = [1, 2, 3, 4, 5, 6, 7, 8];
    const n = xVals.length;
    const x = Float64Array.from(xVals);
    const y = Float64Array.from(xVals.map(() => 5.0));

    it('should return include: false for constant y', () => {
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.include).toBe(false);
    });

    it('should return include: false (not enough variation to detect quadratic)', () => {
      // With constant y there is no variation to explain — quadratic cannot be significant
      const result = shouldIncludeQuadratic(y, x, n);
      expect(result.include).toBe(false);
    });
  });

  describe('centering verification — x and x_centered² should be near-orthogonal', () => {
    // Verify that centering x before squaring eliminates the linear/quadratic
    // correlation that causes multicollinearity
    const xVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const n = xVals.length;

    function pearsonCorrelation(a: number[], b: number[]): number {
      const meanA = a.reduce((s, v) => s + v, 0) / n;
      const meanB = b.reduce((s, v) => s + v, 0) / n;
      let num = 0,
        da2 = 0,
        db2 = 0;
      for (let i = 0; i < n; i++) {
        const da = a[i] - meanA;
        const db = b[i] - meanB;
        num += da * db;
        da2 += da * da;
        db2 += db * db;
      }
      return num / Math.sqrt(da2 * db2);
    }

    it('centered x² should have lower |correlation| with x than uncentered x²', () => {
      const xMean = xVals.reduce((s, v) => s + v, 0) / n;
      const xSq = xVals.map(xi => xi * xi);
      const xCenteredSq = xVals.map(xi => (xi - xMean) ** 2);

      const corrUncentered = Math.abs(pearsonCorrelation(xVals, xSq));
      const corrCentered = Math.abs(pearsonCorrelation(xVals, xCenteredSq));

      // Centering should substantially reduce multicollinearity
      expect(corrCentered).toBeLessThan(corrUncentered);
      // For x = 1..10, centered correlation should be very small
      expect(corrCentered).toBeLessThan(0.1);
    });
  });

  describe('custom alpha threshold', () => {
    // Use strict alpha=0.01; data with modest quadratic curvature may not reach it
    const xVals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const n = xVals.length;
    const noise = [0.1, -0.2, 0.15, -0.1, 0.3, -0.25, 0.2, -0.1, 0.05, -0.15];
    const x = Float64Array.from(xVals);
    // Perfect quadratic — should be significant even at strict alpha
    const y = Float64Array.from(xVals.map((xi, i) => xi * xi + noise[i]));

    it('alpha=0.01: perfect quadratic should still be detected', () => {
      const result = shouldIncludeQuadratic(y, x, n, 0.01);
      expect(result.include).toBe(true);
    });

    it('alpha=0.001: very strict — reports p-value correctly regardless', () => {
      const result = shouldIncludeQuadratic(y, x, n, 0.001);
      // pValue itself is trustworthy — include is determined by threshold
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    });
  });

  describe('minimum observations guard', () => {
    it('should return include: false when n < 4', () => {
      const x = Float64Array.from([1, 2, 3]);
      const y = Float64Array.from([1, 4, 9]);
      const result = shouldIncludeQuadratic(y, x, 3);
      expect(result.include).toBe(false);
      expect(result.pValue).toBe(1);
    });
  });
});
