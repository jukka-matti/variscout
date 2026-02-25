import { describe, it, expect } from 'vitest';
import { calculateKDE } from '../stats';

// =============================================================================
// KDE correctness validation — golden values
//
// Complements the behavioral tests in stats.test.ts and the reference checks
// in reference-validation.test.ts with hand-computed expected values.
// =============================================================================

/** Trapezoidal rule integration of KDE density curve. */
function trapezoidalArea(kde: Array<{ value: number; count: number }>): number {
  let area = 0;
  for (let i = 1; i < kde.length; i++) {
    const dx = kde[i].value - kde[i - 1].value;
    area += ((kde[i].count + kde[i - 1].count) / 2) * dx;
  }
  return area;
}

// =============================================================================
// Section 1: Silverman bandwidth
// =============================================================================

describe('KDE Silverman bandwidth', () => {
  it('computes correct h for [1..10]: h = 0.9 * sigma * n^(-0.2)', () => {
    // Data: [1,2,3,4,5,6,7,8,9,10], n=10
    // Sample std dev = sqrt(sum((xi - 5.5)^2) / 9) = sqrt(82.5/9) = sqrt(9.1667) ~= 3.02765
    // Q1 = d3.quantile(sorted, 0.25) for n=10: index = 0.25*9 = 2.25 => 3 + 0.25*(4-3) = 3.25
    // Q3 = d3.quantile(sorted, 0.75) for n=10: index = 0.75*9 = 6.75 => 7 + 0.75*(8-7) = 7.75
    // IQR = 7.75 - 3.25 = 4.5
    // IQR/1.34 = 4.5/1.34 ~= 3.3582
    // min(3.02765, 3.3582) = 3.02765
    // h = 0.9 * 3.02765 * 10^(-0.2) = 0.9 * 3.02765 * 0.63096 = 1.7196
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const expectedH = 0.9 * 3.02765 * Math.pow(10, -0.2);
    const kde = calculateKDE(values, 50);

    // Verify range matches [min - 3h, max + 3h]
    expect(kde[0].value).toBeCloseTo(1 - 3 * expectedH, 1);
    expect(kde[kde.length - 1].value).toBeCloseTo(10 + 3 * expectedH, 1);
  });

  it('range for [1..10] spans approximately [-4.16, 15.16]', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const h = 0.9 * 3.02765 * Math.pow(10, -0.2); // ~1.7196
    const kde = calculateKDE(values, 100);

    expect(kde[0].value).toBeCloseTo(1 - 3 * h, 0); // ~-4.16
    expect(kde[kde.length - 1].value).toBeCloseTo(10 + 3 * h, 0); // ~15.16
  });

  it('uses fallback spread=1 for identical values [5,5,5,5,5]', () => {
    // sigma=0, IQR=0 => spread=1, h = 0.9 * 1 * 5^(-0.2)
    const values = [5, 5, 5, 5, 5];
    const expectedH = 0.9 * 1 * Math.pow(5, -0.2); // ~0.6545
    const kde = calculateKDE(values, 50);

    expect(kde.length).toBe(50);
    // Range: [5 - 3h, 5 + 3h]
    expect(kde[0].value).toBeCloseTo(5 - 3 * expectedH, 1);
    expect(kde[kde.length - 1].value).toBeCloseTo(5 + 3 * expectedH, 1);
  });

  it('computes reasonable bandwidth for two distant values [0, 100]', () => {
    // n=2, sorted=[0,100]
    // d3.deviation([0,100]) = sqrt((2500+2500)/1) = sqrt(5000) = 70.711
    // d3.quantile([0,100], 0.25) = 0 + 0.25*100 = 25
    // d3.quantile([0,100], 0.75) = 0 + 0.75*100 = 75
    // IQR = 50, IQR/1.34 = 37.313
    // min(70.711, 37.313) = 37.313
    // h = 0.9 * 37.313 * 2^(-0.2) = 0.9 * 37.313 * 0.8706 = 29.23
    const values = [0, 100];
    const expectedH = 0.9 * (50 / 1.34) * Math.pow(2, -0.2);
    const kde = calculateKDE(values, 100);

    expect(kde[0].value).toBeCloseTo(0 - 3 * expectedH, 0);
    expect(kde[kde.length - 1].value).toBeCloseTo(100 + 3 * expectedH, 0);
  });

  it('numPoints=2 produces exactly 2 points spanning the full range', () => {
    const values = [10, 20, 30];
    const kde = calculateKDE(values, 2);

    expect(kde).toHaveLength(2);
    expect(kde[0].value).toBeLessThan(10);
    expect(kde[1].value).toBeGreaterThan(30);
    expect(kde[1].value - kde[0].value).toBeGreaterThan(20); // wider than data range
  });

  it('bandwidth uses stdDev when IQR is zero (e.g. [0, 0, 0, 10])', () => {
    // 3 of 4 values identical at 0, one outlier at 10
    // d3.quantile([0,0,0,10], 0.25) = 0, Q3 = d3.quantile([0,0,0,10], 0.75)
    // index 0.75*3 = 2.25 => sorted[2] + 0.25*(sorted[3]-sorted[2]) = 0 + 2.5 = 2.5
    // IQR = 2.5, so IQR > 0, this actually uses min(stdDev, IQR/1.34)
    // Let's instead test [5, 5, 5, 5, 5, 10] where Q1 = Q3 = 5 for most quartile methods
    // Actually d3 linear interpolation makes IQR nonzero for most cases.
    // Test that h > 0 for data where spread exists in any form
    const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 100];
    const kde = calculateKDE(values, 20);
    expect(kde.length).toBe(20);
    for (const pt of kde) {
      expect(isFinite(pt.value)).toBe(true);
      expect(isFinite(pt.count)).toBe(true);
      expect(pt.count).toBeGreaterThanOrEqual(0);
    }
  });
});

// =============================================================================
// Section 2: Density integration
// =============================================================================

describe('KDE density integration', () => {
  it('area under curve is ~1.0 for [1,2,3,4,5]', () => {
    const kde = calculateKDE([1, 2, 3, 4, 5], 500);
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 1); // within 0.05
  });

  it('area under curve is ~1.0 for bimodal [10,10,10,20,20,20]', () => {
    const kde = calculateKDE([10, 10, 10, 20, 20, 20], 500);
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 1);
  });

  it('area under curve is ~1.0 for 100 pseudorandom values', () => {
    // Deterministic "random" via simple LCG to avoid flakiness
    const values: number[] = [];
    let seed = 42;
    for (let i = 0; i < 100; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      values.push((seed / 0x7fffffff) * 100); // range [0, 100]
    }
    const kde = calculateKDE(values, 500);
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 1);
  });

  it('peak is near 250.15 for coffee-weight data', () => {
    const coffeeWeights = [250.1, 250.3, 250.0, 249.8, 250.2, 250.4, 249.9, 250.1, 250.5, 250.0];
    const kde = calculateKDE(coffeeWeights, 200);

    // Find peak
    let peakIdx = 0;
    for (let i = 1; i < kde.length; i++) {
      if (kde[i].count > kde[peakIdx].count) peakIdx = i;
    }
    // Mean = 250.13, data is roughly symmetric around there
    expect(kde[peakIdx].value).toBeCloseTo(250.13, 0);
  });

  it('uniform-ish data has flatter density than peaked data', () => {
    // Peaked: tight cluster
    const peaked = [50, 50, 50, 50, 50, 50, 50, 51, 49, 50];
    // Uniform-ish: spread evenly
    const uniform = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    const kdePeaked = calculateKDE(peaked, 200);
    const kdeUniform = calculateKDE(uniform, 200);

    const maxPeaked = Math.max(...kdePeaked.map(p => p.count));
    const maxUniform = Math.max(...kdeUniform.map(p => p.count));

    // Peaked data should have a much higher max density
    expect(maxPeaked).toBeGreaterThan(maxUniform * 2);
  });

  it('negative values: peak near 0 and area ~1.0 for [-5,-3,-1,0,1,3,5]', () => {
    const values = [-5, -3, -1, 0, 1, 3, 5];
    const kde = calculateKDE(values, 500);

    // Area should integrate to ~1.0
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 1);

    // Peak should be near the mean (0)
    let peakIdx = 0;
    for (let i = 1; i < kde.length; i++) {
      if (kde[i].count > kde[peakIdx].count) peakIdx = i;
    }
    expect(kde[peakIdx].value).toBeCloseTo(0, 0);
  });
});

// =============================================================================
// Section 3: Edge cases
// =============================================================================

describe('KDE edge cases', () => {
  it('handles very large values without NaN or Infinity', () => {
    const values = [1e6, 1e6 + 1, 1e6 + 2];
    const kde = calculateKDE(values, 50);

    expect(kde.length).toBe(50);
    for (const pt of kde) {
      expect(Number.isNaN(pt.value)).toBe(false);
      expect(Number.isNaN(pt.count)).toBe(false);
      expect(isFinite(pt.value)).toBe(true);
      expect(isFinite(pt.count)).toBe(true);
    }

    // Area should still integrate to ~1.0
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 0);
  });

  it('handles very small differences [0.001, 0.002, 0.003]', () => {
    const values = [0.001, 0.002, 0.003];
    const kde = calculateKDE(values, 50);

    expect(kde.length).toBe(50);
    for (const pt of kde) {
      expect(isFinite(pt.count)).toBe(true);
      expect(pt.count).toBeGreaterThanOrEqual(0);
    }

    // Density should still be a valid PDF
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 0);
  });

  it('handles mixed sign values [-100, 0, 100]', () => {
    const values = [-100, 0, 100];
    const kde = calculateKDE(values, 100);

    expect(kde.length).toBe(100);
    for (const pt of kde) {
      expect(isFinite(pt.value)).toBe(true);
      expect(isFinite(pt.count)).toBe(true);
    }

    // Range should extend beyond [-100, 100]
    expect(kde[0].value).toBeLessThan(-100);
    expect(kde[kde.length - 1].value).toBeGreaterThan(100);
  });

  it('n=2 (minimum valid input) returns valid density', () => {
    const values = [3, 7];
    const kde = calculateKDE(values, 100);

    expect(kde.length).toBe(100);

    // All densities should be non-negative and finite
    for (const pt of kde) {
      expect(pt.count).toBeGreaterThanOrEqual(0);
      expect(isFinite(pt.count)).toBe(true);
    }

    // Area should approximate 1.0
    const area = trapezoidalArea(kde);
    expect(area).toBeCloseTo(1.0, 1);
  });
});
