/**
 * Tests for calculateRegression()
 *
 * Exercises the full regression pipeline: calculateLinearFit, calculateQuadraticFit,
 * getStrengthRating, generateRegressionInsight, and the recommendation logic.
 */

import { describe, it, expect } from 'vitest';
import { calculateRegression } from '../stats';

// =============================================================================
// Helper: build data records from x/y arrays
// =============================================================================

function makeData(xs: number[], ys: number[]): Record<string, unknown>[] {
  return xs.map((x, i) => ({ X: x, Y: ys[i] }));
}

// =============================================================================
// Linear fit
// =============================================================================

describe('calculateRegression — linear fit', () => {
  it('perfect positive linear: y = 2x + 1', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map(x => 2 * x + 1);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(2, 6);
    expect(result!.linear.intercept).toBeCloseTo(1, 6);
    expect(result!.linear.rSquared).toBeCloseTo(1.0, 6);
    expect(result!.linear.isSignificant).toBe(true);
    expect(result!.recommendedFit).toBe('linear');
  });

  it('perfect negative linear: y = -3x + 10', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map(x => -3 * x + 10);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(-3, 6);
    expect(result!.linear.intercept).toBeCloseTo(10, 6);
    expect(result!.linear.rSquared).toBeCloseTo(1.0, 6);
    expect(result!.linear.isSignificant).toBe(true);
  });

  it('weak/no relationship → R² near 0, recommendedFit "none"', () => {
    // Scattered data with no pattern
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [5, 2, 8, 3, 7, 1, 9, 4, 6, 5]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeLessThan(0.1);
    expect(result!.recommendedFit).toBe('none');
  });

  it('minimum data: exactly 3 points → computes result', () => {
    const data = makeData([1, 2, 3], [2, 4, 6]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.n).toBe(3);
    expect(result!.linear.slope).toBeCloseTo(2, 6);
  });

  it('fewer than 3 points → returns null', () => {
    const data = makeData([1, 2], [3, 4]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).toBeNull();
  });

  it('all same X value (zero variance) → R² = 0, not significant', () => {
    const data = makeData([5, 5, 5, 5], [1, 2, 3, 4]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBe(0);
    expect(result!.linear.isSignificant).toBe(false);
    expect(result!.recommendedFit).toBe('none');
  });

  it('NaN/non-numeric values filtered out, uses valid pairs only', () => {
    const data = [
      { X: 1, Y: 2 },
      { X: NaN, Y: 4 },
      { X: 3, Y: NaN },
      { X: 4, Y: 8 },
      { X: 5, Y: 10 },
    ];
    const result = calculateRegression(data, 'X', 'Y');

    // Only 3 valid pairs: (1,2), (4,8), (5,10)
    expect(result).not.toBeNull();
    expect(result!.n).toBe(3);
  });

  it('string values in numeric column → filtered out', () => {
    const data = [
      { X: 1, Y: 3 },
      { X: 'bad', Y: 6 },
      { X: 3, Y: 9 },
      { X: 4, Y: 12 },
    ];
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.n).toBe(3);
    expect(result!.linear.slope).toBeCloseTo(3, 6);
  });
});

// =============================================================================
// Quadratic fit
// =============================================================================

describe('calculateRegression — quadratic fit', () => {
  it('parabola y = x² - 4x + 5: valley at x ≈ 2', () => {
    const xs = [0, 1, 2, 3, 4, 5];
    const ys = xs.map(x => x * x - 4 * x + 5);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.quadratic!.rSquared).toBeCloseTo(1.0, 4);
    expect(result!.quadratic!.optimumType).toBe('valley');
    expect(result!.quadratic!.optimumX).toBeCloseTo(2, 1);
    expect(result!.recommendedFit).toBe('quadratic');
  });

  it('inverted parabola y = -x² + 6x: peak at x ≈ 3', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6];
    const ys = xs.map(x => -x * x + 6 * x);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.quadratic!.optimumType).toBe('peak');
    expect(result!.quadratic!.optimumX).toBeCloseTo(3, 1);
  });

  it('3 data points → quadratic is null (needs ≥ 4)', () => {
    const data = makeData([1, 2, 3], [1, 4, 9]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).toBeNull();
  });

  it('4+ points → quadratic computed', () => {
    const data = makeData([1, 2, 3, 4], [1, 4, 9, 16]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.quadratic!.rSquared).toBeCloseTo(1.0, 4);
  });

  it('optimum far outside data range → optimumX is null', () => {
    // y = 0.001x² - 100x + 0 → vertex at x = 50000, data range 1-10
    // The vertex is far outside 1.5× data range
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const ys = xs.map(x => 0.001 * x * x - 100 * x);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    if (result!.quadratic) {
      expect(result!.quadratic.optimumX).toBeNull();
    }
  });
});

// =============================================================================
// Recommendation logic
// =============================================================================

describe('calculateRegression — recommendation logic', () => {
  it('linear significant, quadratic not >5% better → "linear"', () => {
    // Strong linear, quadratic barely different
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const ys = xs.map(x => 3 * x + 2 + Math.sin(x) * 0.5); // mostly linear
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.recommendedFit).toBe('linear');
    expect(result!.linear.isSignificant).toBe(true);
  });

  it('quadratic R² > linear R² + 0.05 AND R² ≥ 0.5 → "quadratic"', () => {
    // Strong U-shape: quadratic dominates
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    const ys = xs.map(x => x * x + 1);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.quadratic!.rSquared).toBeGreaterThan(result!.linear.rSquared + 0.05);
    expect(result!.quadratic!.rSquared).toBeGreaterThanOrEqual(0.5);
    expect(result!.recommendedFit).toBe('quadratic');
  });

  it('neither significant → "none"', () => {
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [5, 2, 8, 3, 7, 1, 9, 4, 6, 5]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.recommendedFit).toBe('none');
  });

  it('symmetric U-shape: linear R² ≈ 0 but quadratic strong', () => {
    // Perfectly symmetric parabola: linear slope ≈ 0
    const xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const ys = xs.map(x => x * x);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeLessThan(0.01);
    expect(result!.quadratic!.rSquared).toBeGreaterThan(0.99);
    expect(result!.recommendedFit).toBe('quadratic');
  });
});

// =============================================================================
// Strength rating
// =============================================================================

describe('calculateRegression — strength rating', () => {
  it('R² ≥ 0.9 → rating 5', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const ys = xs.map(x => 2 * x + 1);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result!.strengthRating).toBe(5);
  });

  it('R² ≈ 0.7–0.89 → rating 4', () => {
    // Moderate noise added to a linear trend
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [3, 5, 4, 8, 7, 10, 9, 14, 11, 16]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeGreaterThanOrEqual(0.7);
    expect(result!.linear.rSquared).toBeLessThan(0.9);
    expect(result!.strengthRating).toBe(4);
  });

  it('R² ≈ 0.5–0.69 → rating 3', () => {
    // Add heavy noise to linear data
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const noise = [3, -4, 5, -3, 6, -5, 4, -6, 5, -4];
    const ys = xs.map((x, i) => 2 * x + noise[i]);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeGreaterThanOrEqual(0.5);
    expect(result!.linear.rSquared).toBeLessThan(0.7);
    expect(result!.strengthRating).toBe(3);
  });
});

// =============================================================================
// Insight generation
// =============================================================================

describe('calculateRegression — insight', () => {
  it('positive slope → "Higher X → higher Y"', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map(x => 2 * x + 1);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result!.insight).toBe('Higher X → higher Y');
  });

  it('negative slope → "Lower X → lower Y"', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map(x => -3 * x + 10);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result!.insight).toBe('Lower X → lower Y');
  });

  it('no relationship → "No significant relationship"', () => {
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [5, 2, 8, 3, 7, 1, 9, 4, 6, 5]);
    const result = calculateRegression(data, 'X', 'Y');

    expect(result!.insight).toContain('No significant relationship');
  });

  it('quadratic with peak → "Maximum Y at X ≈ ..."', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6];
    const ys = xs.map(x => -x * x + 6 * x);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result!.insight).toContain('Maximum');
    expect(result!.insight).toContain('Y');
    expect(result!.insight).toContain('X');
  });

  it('quadratic with valley → "Minimum Y at X ≈ ..."', () => {
    const xs = [0, 1, 2, 3, 4, 5];
    const ys = xs.map(x => x * x - 4 * x + 5);
    const result = calculateRegression(makeData(xs, ys), 'X', 'Y');

    expect(result!.insight).toContain('Minimum');
    expect(result!.insight).toContain('Y');
  });

  it('uses actual column names in insight', () => {
    const data = [
      { Temperature: 20, Yield: 80 },
      { Temperature: 25, Yield: 85 },
      { Temperature: 30, Yield: 90 },
      { Temperature: 35, Yield: 95 },
      { Temperature: 40, Yield: 100 },
    ];
    const result = calculateRegression(data, 'Temperature', 'Yield');

    expect(result!.insight).toContain('Temperature');
    expect(result!.insight).toContain('Yield');
  });
});

// ============================================================================
// Strength rating bands and edge cases
// ============================================================================

describe('Strength rating edge cases', () => {
  it('R² < 0.3 → strengthRating 1', () => {
    // Weak linear fit — scattered data
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8], [10, 5, 12, 3, 11, 6, 14, 2]);
    const result = calculateRegression(data, 'X', 'Y');
    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeLessThan(0.3);
    expect(result!.strengthRating).toBe(1);
  });

  it('R² 0.3–0.5 → strengthRating 2', () => {
    // Noisy upward trend — R² ≈ 0.40
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 6, 1, 5, 4, 8, 3, 7, 6, 9]);
    const result = calculateRegression(data, 'X', 'Y');
    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeGreaterThanOrEqual(0.3);
    expect(result!.linear.rSquared).toBeLessThan(0.5);
    expect(result!.strengthRating).toBe(2);
  });

  it('all-same Y values → R²=0, recommendedFit "none"', () => {
    const data = makeData([1, 2, 3, 4, 5], [7, 7, 7, 7, 7]);
    const result = calculateRegression(data, 'X', 'Y');
    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBe(0);
    expect(result!.recommendedFit).toBe('none');
  });

  it('perfect linear fit (Y=2X) → pValue=0 (perfect fit branch)', () => {
    const data = makeData([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    const result = calculateRegression(data, 'X', 'Y');
    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeCloseTo(1.0, 10);
    expect(result!.linear.pValue).toBe(0);
  });

  it('quadratic R² < 0.5 → does NOT recommend quadratic even if ΔR² > 0.05', () => {
    // Noisy data where quadratic may fit marginally better than linear
    // but neither fit is strong
    const data = makeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [8, 3, 9, 2, 10, 1, 9, 4, 8, 3]);
    const result = calculateRegression(data, 'X', 'Y');
    expect(result).not.toBeNull();
    // With such scattered data, neither fit should be recommended as quadratic
    if (result!.quadratic && result!.quadratic.rSquared < 0.5) {
      expect(result!.recommendedFit).not.toBe('quadratic');
    }
  });
});
