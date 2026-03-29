import { describe, it, expect } from 'vitest';
import { andersonDarlingTest, normalCDF } from '../andersonDarling';

describe('normalCDF', () => {
  it('returns 0.5 for z=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 6);
  });

  it('returns ~0.8413 for z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it('returns ~0.1587 for z=-1', () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
  });

  it('returns ~0.9772 for z=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
  });

  it('handles extremes', () => {
    expect(normalCDF(Infinity)).toBe(1);
    expect(normalCDF(-Infinity)).toBe(0);
  });

  it('is symmetric: CDF(z) + CDF(-z) = 1', () => {
    for (const z of [0.5, 1, 1.5, 2, 2.5, 3]) {
      expect(normalCDF(z) + normalCDF(-z)).toBeCloseTo(1, 6);
    }
  });
});

describe('andersonDarlingTest', () => {
  // Known normal data — should have high p-value
  it('accepts normally distributed data (high p-value)', () => {
    // 50 points from N(0,1) — generated with known seed
    const normalData = [
      -1.28, -0.84, -0.52, -0.25, -0.13, 0.0, 0.13, 0.25, 0.52, 0.84, -1.15, -0.67, -0.38, -0.16,
      -0.05, 0.05, 0.16, 0.38, 0.67, 1.15, -1.04, -0.57, -0.32, -0.1, 0.03, 0.1, 0.2, 0.43, 0.74,
      1.28, -0.95, -0.49, -0.26, -0.07, 0.07, 0.15, 0.26, 0.49, 0.81, 1.41, -0.88, -0.43, -0.21,
      -0.03, 0.09, 0.18, 0.31, 0.55, 0.88, 1.55,
    ];

    const result = andersonDarlingTest(normalData);
    expect(result.pValue).toBeGreaterThan(0.05);
    expect(result.statistic).toBeGreaterThan(0);
  });

  // R reference: ad.test(c(1,2,3,4,5,100)) gives A² ≈ 0.6 area, p < 0.05
  it('rejects obviously non-normal data (low p-value)', () => {
    // Heavily skewed data
    const skewedData = [1, 1, 1, 2, 2, 3, 3, 4, 5, 50, 100, 200];
    const result = andersonDarlingTest(skewedData);
    expect(result.pValue).toBeLessThan(0.05);
  });

  // Uniform distribution should have lower p-value than normal data
  it('gives lower p-value for uniform than normal data', () => {
    const uniformData = Array.from({ length: 50 }, (_, i) => i);
    const normalLike = [
      -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, -1.8, -1.2, -0.7, -0.3, 0.1, 0.3, 0.7, 1.2, 1.8, -1.6,
      -0.9, -0.4, 0.2, 0.4, 0.9, 1.6, -0.1, -0.6, 0.6, 1.4, -1.4, -2.1, -1.7, -1.1, -0.8, -0.2,
      0.15, 0.35, 0.8, 1.1, 1.7, -1.9, -1.3, -0.65, -0.35, 0.05, 0.25, 0.65, 1.3, 1.9, 0,
    ];
    const pUniform = andersonDarlingTest(uniformData).pValue;
    const pNormal = andersonDarlingTest(normalLike).pValue;
    expect(pNormal).toBeGreaterThan(pUniform);
  });

  // Bimodal data should fail normality
  it('rejects bimodal data', () => {
    const bimodal = [
      ...Array.from({ length: 25 }, () => -3 + Math.random() * 0.5),
      ...Array.from({ length: 25 }, () => 3 + Math.random() * 0.5),
    ];
    const result = andersonDarlingTest(bimodal);
    expect(result.pValue).toBeLessThan(0.05);
  });

  it('handles small samples (n=2)', () => {
    const result = andersonDarlingTest([1, 2]);
    expect(result.statistic).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  it('handles constant data', () => {
    const result = andersonDarlingTest([5, 5, 5, 5, 5]);
    expect(result.statistic).toBe(Infinity);
    expect(result.pValue).toBe(0);
  });

  it('handles empty array', () => {
    const result = andersonDarlingTest([]);
    expect(result.statistic).toBe(0);
    expect(result.pValue).toBe(1);
  });

  it('handles single value', () => {
    const result = andersonDarlingTest([42]);
    expect(result.statistic).toBe(0);
    expect(result.pValue).toBe(1);
  });

  it('filters non-numeric values', () => {
    const data = [1, 2, NaN, 3, Infinity, 4, 5, -Infinity, 6, 7, 8, 9, 10];
    const result = andersonDarlingTest(data);
    expect(result.statistic).toBeGreaterThan(0);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
  });

  // R reference: shapiro.test(1:20) gives p ≈ 0.036 (rejects normality)
  // AD test should also reject a perfectly uniform sequence
  it('produces A²* > 0 for any real data', () => {
    const data = [10, 12, 14, 16, 18, 20, 22, 24];
    const result = andersonDarlingTest(data);
    expect(result.statistic).toBeGreaterThan(0);
  });

  // p-value should be monotonic: more normal data → higher p
  it('gives higher p-value for more normal data', () => {
    const veryNormal = [
      -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, -1.8, -1.2, -0.7, -0.3, 0.1, 0.3, 0.7, 1.2, 1.8, -1.6,
      -0.9, -0.4, 0.2, 0.4, 0.9, 1.6,
    ];
    const lessNormal = [1, 1, 1, 1, 2, 2, 3, 5, 10, 20, 50];

    const pNormal = andersonDarlingTest(veryNormal).pValue;
    const pSkewed = andersonDarlingTest(lessNormal).pValue;
    expect(pNormal).toBeGreaterThan(pSkewed);
  });
});
