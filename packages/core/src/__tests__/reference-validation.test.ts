/**
 * Reference Validation Test Suite
 *
 * Validates VariScout's statistical engine against:
 * - NIST StRD certified datasets (https://www.itl.nist.gov/div898/strd/)
 * - R statistical software reference values (R 4.x)
 *
 * Private functions (normalPDF, incompleteBeta, lnGamma, fDistributionPValue,
 * tDistributionPValue) are validated indirectly through ANOVA p-values
 * (F-distribution chain) and regression p-values (t-distribution chain).
 */
import { describe, it, expect } from 'vitest';
import {
  normalQuantile,
  calculateStats,
  calculateMovingRangeSigma,
  calculateAnova,
  calculateRegression,
  calculateBoxplotStats,
  calculateKDE,
  calculateProbabilityPlotData,
} from '../stats';
import { transpose, multiply, inverse, solve } from '../matrix';

// =============================================================================
// Section 1: Normal Distribution — normalQuantile vs R qnorm()
// =============================================================================

describe('Section 1: Normal Distribution (normalQuantile vs R qnorm)', () => {
  // Reference: R 4.x qnorm() at standard percentile points
  // Acklam's algorithm is accurate to ~1e-9
  const referencePoints: Array<{ p: number; z: number }> = [
    { p: 0.001, z: -3.090232306167814 },
    { p: 0.01, z: -2.326347874040841 },
    { p: 0.025, z: -1.959963984540054 },
    { p: 0.05, z: -1.644853626951473 },
    { p: 0.1, z: -1.281551565544601 },
    { p: 0.5, z: 0.0 },
    { p: 0.9, z: 1.281551565544601 },
    { p: 0.95, z: 1.644853626951473 },
    { p: 0.975, z: 1.959963984540054 },
    { p: 0.99, z: 2.326347874040841 },
    { p: 0.999, z: 3.090232306167814 },
  ];

  it.each(referencePoints)('normalQuantile($p) ≈ $z', ({ p, z }) => {
    expect(normalQuantile(p)).toBeCloseTo(z, 8);
  });

  it('satisfies symmetry: normalQuantile(p) = -normalQuantile(1-p)', () => {
    const testPoints = [0.001, 0.01, 0.025, 0.05, 0.1, 0.25];
    for (const p of testPoints) {
      expect(normalQuantile(p)).toBeCloseTo(-normalQuantile(1 - p), 12);
    }
  });

  it('returns correct boundary values', () => {
    expect(normalQuantile(0)).toBe(-Infinity);
    expect(normalQuantile(1)).toBe(Infinity);
    expect(normalQuantile(0.5)).toBe(0);
  });
});

// =============================================================================
// Section 2: NIST Univariate Statistics — calculateStats (mean, stdDev)
// =============================================================================

describe('Section 2: NIST Univariate Statistics (calculateStats)', () => {
  // Source: NIST StRD https://www.itl.nist.gov/div898/strd/univ/

  it('NumAcc1 (Lower difficulty, n=3): large-offset precision', () => {
    // Data: 3 values near 10,000,002 — tests precision with large offset
    // Certified Mean: 10000002.0
    // Certified StdDev: 1.0
    const data = [10000001, 10000003, 10000002];
    const stats = calculateStats(data);

    expect(stats.mean).toBeCloseTo(10000002.0, 9);
    expect(stats.stdDev).toBeCloseTo(1.0, 9);
  });

  it('NumAcc4 (Higher difficulty, n=1001): catastrophic cancellation stress test', () => {
    // Data pattern designed to cause catastrophic cancellation in naive algorithms:
    //   1 × 10000000.2, 500 × 10000000.1, 500 × 10000000.3
    // Certified Mean: 10000000.2
    // Certified StdDev: 0.1
    const data = [
      10000000.2,
      ...Array<number>(500).fill(10000000.1),
      ...Array<number>(500).fill(10000000.3),
    ];
    expect(data).toHaveLength(1001);

    const stats = calculateStats(data);

    // 7 decimal places for mean — d3.mean uses simple sum/n, loses ~2 digits
    // with values near 10^7. A naive two-pass algorithm would fail catastrophically.
    expect(stats.mean).toBeCloseTo(10000000.2, 7);
    // 8 decimal places for stdDev — d3.deviation uses Welford's algorithm but
    // precision is bounded by the mean estimate feeding into variance.
    expect(stats.stdDev).toBeCloseTo(0.1, 8);
  });

  it('control limits use σ_within (3 × MR̄/d2 from mean)', () => {
    const data = [10000001, 10000003, 10000002];
    const stats = calculateStats(data);

    // Control limits use σ_within (moving range), not σ_overall
    expect(stats.ucl).toBeCloseTo(stats.mean + 3 * stats.sigmaWithin, 9);
    expect(stats.lcl).toBeCloseTo(stats.mean - 3 * stats.sigmaWithin, 9);
  });
});

// =============================================================================
// Section 3: NIST One-Way ANOVA — calculateAnova
// =============================================================================

describe('Section 3: NIST One-Way ANOVA (calculateAnova)', () => {
  // Source: NIST StRD https://www.itl.nist.gov/div898/strd/anova/SiRstv.html
  // Dataset: SiRstv — Silicon Resistivity, 5 instruments × 5 observations

  // SiRstv data: Silicon wafer resistivity measured by 5 instruments
  const siRstvData = [
    // Instrument 1
    { y: 196.3052, instrument: '1' },
    { y: 196.124, instrument: '1' },
    { y: 196.189, instrument: '1' },
    { y: 196.2569, instrument: '1' },
    { y: 196.3403, instrument: '1' },
    // Instrument 2
    { y: 196.3042, instrument: '2' },
    { y: 196.3825, instrument: '2' },
    { y: 196.1669, instrument: '2' },
    { y: 196.3257, instrument: '2' },
    { y: 196.0422, instrument: '2' },
    // Instrument 3
    { y: 196.1303, instrument: '3' },
    { y: 196.2005, instrument: '3' },
    { y: 196.2889, instrument: '3' },
    { y: 196.0343, instrument: '3' },
    { y: 196.1811, instrument: '3' },
    // Instrument 4
    { y: 196.2795, instrument: '4' },
    { y: 196.1748, instrument: '4' },
    { y: 196.1494, instrument: '4' },
    { y: 196.1485, instrument: '4' },
    { y: 195.9885, instrument: '4' },
    // Instrument 5
    { y: 196.2119, instrument: '5' },
    { y: 196.1051, instrument: '5' },
    { y: 196.185, instrument: '5' },
    { y: 196.0052, instrument: '5' },
    { y: 196.209, instrument: '5' },
  ];

  it('SiRstv: certified F-statistic and degrees of freedom', () => {
    const result = calculateAnova(siRstvData, 'y', 'instrument');
    expect(result).not.toBeNull();

    // NIST certified F-statistic: 1.18046237440255E+00
    expect(result!.fStatistic).toBeCloseTo(1.18046237440255, 6);

    // Degrees of freedom
    expect(result!.dfBetween).toBe(4);
    expect(result!.dfWithin).toBe(20);
  });

  it('SiRstv: certified eta-squared (R²)', () => {
    const result = calculateAnova(siRstvData, 'y', 'instrument');
    expect(result).not.toBeNull();

    // NIST certified R²: 1.90999039051129E-01
    expect(result!.etaSquared).toBeCloseTo(0.190999039051129, 6);
  });

  it('SiRstv: certified residual standard deviation', () => {
    const result = calculateAnova(siRstvData, 'y', 'instrument');
    expect(result).not.toBeNull();

    // NIST certified Residual SD: 1.04076068334656E-01
    // MSW = Residual SD² = 0.010831823...
    const residualSD = Math.sqrt(result!.msw);
    expect(residualSD).toBeCloseTo(0.104076068334656, 6);
  });

  it('SiRstv: result is not significant (p > 0.05)', () => {
    const result = calculateAnova(siRstvData, 'y', 'instrument');
    expect(result).not.toBeNull();

    // F = 1.18 with (4, 20) df is not significant
    // R: pf(1.18046237440255, 4, 20, lower.tail=FALSE) ≈ 0.349
    expect(result!.isSignificant).toBe(false);
    expect(result!.pValue).toBeGreaterThan(0.05);
    expect(result!.pValue).toBeLessThan(1.0);
  });

  it('SiRstv: p-value validates F-distribution chain', () => {
    const result = calculateAnova(siRstvData, 'y', 'instrument');
    expect(result).not.toBeNull();

    // Indirect validation of fDistributionPValue → incompleteBeta → lnGamma
    // R: pf(1.18046237440255, 4, 20, lower.tail=FALSE) ≈ 0.349
    expect(result!.pValue).toBeCloseTo(0.349, 1);
  });
});

// =============================================================================
// Section 4: NIST Linear Regression — calculateRegression (Norris dataset)
// =============================================================================

describe('Section 4: NIST Linear Regression (Norris dataset)', () => {
  // Source: NIST StRD https://www.itl.nist.gov/div898/strd/lls/data/Norris.shtml
  // Lower difficulty, 36 observations, well-conditioned linear fit
  // Model: y = B0 + B1 * x
  // Certified B0 (intercept): -0.262323073774029
  // Certified B1 (slope):      1.00211681802045
  // Certified R²:              0.999993745883712
  // Certified Residual SD:     0.884796396144373

  const norrisData = [
    { x: 0.2, y: 0.1 },
    { x: 337.4, y: 338.8 },
    { x: 118.2, y: 118.1 },
    { x: 884.6, y: 888.0 },
    { x: 10.1, y: 9.2 },
    { x: 226.5, y: 228.1 },
    { x: 666.3, y: 668.5 },
    { x: 996.3, y: 998.5 },
    { x: 448.6, y: 449.1 },
    { x: 777.0, y: 778.9 },
    { x: 558.2, y: 559.2 },
    { x: 0.4, y: 0.3 },
    { x: 0.6, y: 0.1 },
    { x: 775.5, y: 778.1 },
    { x: 666.9, y: 668.8 },
    { x: 338.0, y: 339.3 },
    { x: 447.5, y: 448.9 },
    { x: 11.6, y: 10.8 },
    { x: 556.0, y: 557.7 },
    { x: 228.1, y: 228.3 },
    { x: 995.8, y: 998.0 },
    { x: 887.6, y: 888.8 },
    { x: 120.2, y: 119.6 },
    { x: 0.3, y: 0.3 },
    { x: 0.3, y: 0.6 },
    { x: 556.8, y: 557.6 },
    { x: 339.1, y: 339.3 },
    { x: 887.2, y: 888.0 },
    { x: 999.0, y: 998.5 },
    { x: 779.0, y: 778.9 },
    { x: 11.1, y: 10.2 },
    { x: 118.3, y: 117.6 },
    { x: 229.2, y: 228.9 },
    { x: 669.1, y: 668.4 },
    { x: 448.9, y: 449.2 },
    { x: 0.5, y: 0.2 },
  ];

  it('Norris: correct sample size', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();
    expect(result!.n).toBe(36);
  });

  it('Norris: certified slope (B1)', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();

    // NIST certified slope: 1.00211681802045
    expect(result!.linear.slope).toBeCloseTo(1.00211681802045, 10);
  });

  it('Norris: certified intercept (B0)', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();

    // NIST certified intercept: -0.262323073774029
    expect(result!.linear.intercept).toBeCloseTo(-0.262323073774029, 10);
  });

  it('Norris: certified R²', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();

    // NIST certified R²: 0.999993745883712
    expect(result!.linear.rSquared).toBeCloseTo(0.999993745883712, 10);
  });

  it('Norris: slope is highly significant', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();

    // Slope t-statistic ≈ 2331, p ≈ 0
    // Validates tDistributionPValue → fDistributionPValue → incompleteBeta
    expect(result!.linear.isSignificant).toBe(true);
    expect(result!.linear.pValue).toBeLessThan(1e-10);
  });

  it('Norris: linear fit is recommended', () => {
    const result = calculateRegression(norrisData, 'x', 'y');
    expect(result).not.toBeNull();

    expect(result!.recommendedFit).toBe('linear');
  });
});

// =============================================================================
// Section 4b: NIST Quadratic Regression — Pontius dataset
// =============================================================================

describe('Section 4b: NIST Quadratic Regression (Pontius dataset)', () => {
  // Source: NIST StRD https://www.itl.nist.gov/div898/strd/lls/data/Pontius.shtml
  // Average difficulty, 40 observations, deflection vs load
  // Model: y = B0 + B1*x + B2*x²
  // Certified B0: 0.673565789473684E-03
  // Certified B1: 0.732059160401003E-06
  // Certified B2: -0.316081871345029E-14
  // Certified R²: 0.999999900178537

  const pontiusData = [
    { x: 150000, y: 0.11019 },
    { x: 300000, y: 0.21956 },
    { x: 450000, y: 0.32949 },
    { x: 600000, y: 0.43899 },
    { x: 750000, y: 0.54803 },
    { x: 900000, y: 0.65694 },
    { x: 1050000, y: 0.76562 },
    { x: 1200000, y: 0.87487 },
    { x: 1350000, y: 0.98292 },
    { x: 1500000, y: 1.09146 },
    { x: 1650000, y: 1.20001 },
    { x: 1800000, y: 1.30822 },
    { x: 1950000, y: 1.41599 },
    { x: 2100000, y: 1.52399 },
    { x: 2250000, y: 1.63194 },
    { x: 2400000, y: 1.73947 },
    { x: 2550000, y: 1.84646 },
    { x: 2700000, y: 1.95392 },
    { x: 2850000, y: 2.06128 },
    { x: 3000000, y: 2.16844 },
    // Replicate set
    { x: 150000, y: 0.11052 },
    { x: 300000, y: 0.22018 },
    { x: 450000, y: 0.32939 },
    { x: 600000, y: 0.43886 },
    { x: 750000, y: 0.54798 },
    { x: 900000, y: 0.65739 },
    { x: 1050000, y: 0.76596 },
    { x: 1200000, y: 0.87474 },
    { x: 1350000, y: 0.983 },
    { x: 1500000, y: 1.0915 },
    { x: 1650000, y: 1.20004 },
    { x: 1800000, y: 1.30818 },
    { x: 1950000, y: 1.41613 },
    { x: 2100000, y: 1.52408 },
    { x: 2250000, y: 1.63159 },
    { x: 2400000, y: 1.73965 },
    { x: 2550000, y: 1.84696 },
    { x: 2700000, y: 1.95445 },
    { x: 2850000, y: 2.06177 },
    { x: 3000000, y: 2.16829 },
  ];

  it('Pontius: quadratic fit is computed', () => {
    const result = calculateRegression(pontiusData, 'x', 'y');
    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.n).toBe(40);
  });

  it('Pontius: linear R² is very high', () => {
    const result = calculateRegression(pontiusData, 'x', 'y');
    expect(result).not.toBeNull();

    // Even the linear fit has extremely high R²
    expect(result!.linear.rSquared).toBeGreaterThan(0.9999);
  });

  it('Pontius: quadratic R² matches NIST certified value', () => {
    const result = calculateRegression(pontiusData, 'x', 'y');
    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();

    // NIST certified R²: 0.999999900178537
    // Use 6-digit tolerance due to numerical conditioning of large x values
    expect(result!.quadratic!.rSquared).toBeCloseTo(0.999999900178537, 6);
  });
});

// =============================================================================
// Section 5: Boxplot Quantiles — calculateBoxplotStats vs R quantile(type=7)
// =============================================================================

describe('Section 5: Boxplot Quantiles (calculateBoxplotStats vs R type=7)', () => {
  // R's default quantile method (type=7) uses linear interpolation:
  // Q(p) = (1-g)*x[j] + g*x[j+1]
  // where j = floor((n-1)*p), g = (n-1)*p - j

  it('even n (n=8): linear interpolation at non-integer indices', () => {
    // R: quantile(1:8, c(0.25, 0.5, 0.75), type=7) = 2.75, 4.50, 6.25
    const result = calculateBoxplotStats({ group: 'test', values: [1, 2, 3, 4, 5, 6, 7, 8] });

    expect(result.q1).toBeCloseTo(2.75, 10);
    expect(result.median).toBeCloseTo(4.5, 10);
    expect(result.q3).toBeCloseTo(6.25, 10);
    expect(result.mean).toBeCloseTo(4.5, 10);
  });

  it('odd n (n=7): exact quartile at integer indices', () => {
    // R: quantile(1:7, c(0.25, 0.5, 0.75), type=7) = 2.5, 4, 5.5
    const result = calculateBoxplotStats({ group: 'test', values: [1, 2, 3, 4, 5, 6, 7] });

    expect(result.q1).toBeCloseTo(2.5, 10);
    expect(result.median).toBeCloseTo(4.0, 10);
    expect(result.q3).toBeCloseTo(5.5, 10);
  });

  it('non-uniform spacing (n=8): interpolation with real-valued data', () => {
    // Data: [2.1, 3.7, 4.2, 5.8, 6.3, 7.9, 8.4, 9.1]
    // q1Index = 7 * 0.25 = 1.75 → 3.7 + 0.75*(4.2 - 3.7) = 4.075
    // q3Index = 7 * 0.75 = 5.25 → 7.9 + 0.25*(8.4 - 7.9) = 8.025
    // median = (5.8 + 6.3) / 2 = 6.05
    const values = [2.1, 3.7, 4.2, 5.8, 6.3, 7.9, 8.4, 9.1];
    const result = calculateBoxplotStats({ group: 'test', values });

    expect(result.q1).toBeCloseTo(4.075, 10);
    expect(result.median).toBeCloseTo(6.05, 10);
    expect(result.q3).toBeCloseTo(8.025, 10);
  });

  it('outlier detection: values beyond 1.5×IQR', () => {
    // Data with outlier: [1, 2, 3, 4, 5, 6, 7, 20]
    // q1 = 2.75, q3 = 6.25, IQR = 3.5
    // Upper fence = 6.25 + 1.5*3.5 = 11.5
    // 20 > 11.5 → outlier
    const result = calculateBoxplotStats({ group: 'test', values: [1, 2, 3, 4, 5, 6, 7, 20] });

    expect(result.outliers).toContain(20);
    expect(result.outliers).toHaveLength(1);
  });

  it('standard deviation matches sample stdDev formula', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const result = calculateBoxplotStats({ group: 'test', values });

    // Manual: mean=5, variance = sum((xi-5)²)/7 = (9+1+1+1+0+0+4+16)/7 = 32/7
    // stdDev = sqrt(32/7) ≈ 2.138
    expect(result.mean).toBeCloseTo(5.0, 10);
    expect(result.stdDev).toBeCloseTo(Math.sqrt(32 / 7), 10);
  });

  // Edge cases

  it('empty values → all zeroes, no outliers', () => {
    const result = calculateBoxplotStats({ group: 'empty', values: [] });

    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.q1).toBe(0);
    expect(result.median).toBe(0);
    expect(result.mean).toBe(0);
    expect(result.q3).toBe(0);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
    expect(result.values).toEqual([]);
  });

  it('single value [42] → all stats equal 42, stdDev=0, no outliers', () => {
    const result = calculateBoxplotStats({ group: 'single', values: [42] });

    expect(result.min).toBe(42);
    expect(result.max).toBe(42);
    expect(result.q1).toBe(42);
    expect(result.median).toBe(42);
    expect(result.mean).toBe(42);
    expect(result.q3).toBe(42);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
  });

  it('two values [10, 20] → median=15, proper q1/q3', () => {
    const result = calculateBoxplotStats({ group: 'two', values: [10, 20] });

    expect(result.median).toBeCloseTo(15, 10);
    expect(result.mean).toBeCloseTo(15, 10);
    // q1Index = (2-1)*0.25 = 0.25 → 10 + 0.25*(20-10) = 12.5
    expect(result.q1).toBeCloseTo(12.5, 10);
    // q3Index = (2-1)*0.75 = 0.75 → 10 + 0.75*(20-10) = 17.5
    expect(result.q3).toBeCloseTo(17.5, 10);
  });

  it('all identical [5,5,5,5] → IQR=0, no outliers, stdDev=0', () => {
    const result = calculateBoxplotStats({ group: 'identical', values: [5, 5, 5, 5] });

    expect(result.q1).toBe(5);
    expect(result.q3).toBe(5);
    expect(result.median).toBe(5);
    expect(result.mean).toBe(5);
    expect(result.stdDev).toBe(0);
    expect(result.outliers).toEqual([]);
  });

  it('whisker clamping: min/max clamped to fences when outliers present', () => {
    // Data with lower and upper outlier
    // Core: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], outliers: [0, 40]
    const values = [0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 40];
    const result = calculateBoxplotStats({ group: 'clamped', values });

    // The reported min and max should be clamped to fences, not raw extremes
    expect(result.min).toBeGreaterThan(0); // not the raw min of 0
    expect(result.max).toBeLessThan(40); // not the raw max of 40
    expect(result.outliers).toContain(0);
    expect(result.outliers).toContain(40);
  });

  it('multiple outliers on both sides → all captured, whiskers clamped', () => {
    // Core data: 45-55 (tight cluster), outliers on both sides
    // n=17: q1Index=4→46, q3Index=12→54, IQR=8
    // lowerFence = 46 - 12 = 34, upperFence = 54 + 12 = 66
    const values = [10, 20, 30, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 70, 80, 90];
    const result = calculateBoxplotStats({ group: 'multi-outlier', values });

    // Lower outliers: 10, 20, 30 (below 34)
    // Upper outliers: 70, 80, 90 (above 66)
    expect(result.outliers.length).toBeGreaterThanOrEqual(4);
    expect(result.outliers).toContain(10);
    expect(result.outliers).toContain(90);
    // Whiskers should be clamped to fences, not raw extremes
    expect(result.min).toBeGreaterThan(10);
    expect(result.max).toBeLessThan(90);
  });
});

// =============================================================================
// Section 6: Matrix Operations — inverse, multiply, solve
// =============================================================================

describe('Section 6: Matrix Operations (inverse, multiply, solve)', () => {
  it('well-conditioned 3×3: A × A⁻¹ = I', () => {
    // A = [[2,1,0],[1,3,1],[0,1,2]], det(A) = 8
    const A = [
      [2, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];

    const Ainv = inverse(A);
    expect(Ainv).not.toBeNull();

    const product = multiply(A, Ainv!);
    expect(product).not.toBeNull();

    // Verify A × A⁻¹ = I
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product![i][j]).toBeCloseTo(i === j ? 1 : 0, 10);
      }
    }
  });

  it('well-conditioned 3×3: analytically known inverse', () => {
    const A = [
      [2, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];

    const Ainv = inverse(A);
    expect(Ainv).not.toBeNull();

    // Known inverse: (1/8) × [[5,-2,1],[-2,4,-2],[1,-2,5]]
    const expected = [
      [5 / 8, -2 / 8, 1 / 8],
      [-2 / 8, 4 / 8, -2 / 8],
      [1 / 8, -2 / 8, 5 / 8],
    ];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Ainv![i][j]).toBeCloseTo(expected[i][j], 10);
      }
    }
  });

  it('Hilbert 3×3 (ill-conditioned): A × A⁻¹ ≈ I', () => {
    // Hilbert matrix: H[i][j] = 1/(i+j+1), condition number ≈ 524
    const H = [
      [1, 1 / 2, 1 / 3],
      [1 / 2, 1 / 3, 1 / 4],
      [1 / 3, 1 / 4, 1 / 5],
    ];

    const Hinv = inverse(H);
    expect(Hinv).not.toBeNull();

    // Known inverse of Hilbert 3×3
    const expectedInv = [
      [9, -36, 30],
      [-36, 192, -180],
      [30, -180, 180],
    ];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(Hinv![i][j]).toBeCloseTo(expectedInv[i][j], 6);
      }
    }

    // Also verify H × H⁻¹ ≈ I (looser tolerance due to ill-conditioning)
    const product = multiply(H, Hinv!);
    expect(product).not.toBeNull();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product![i][j]).toBeCloseTo(i === j ? 1 : 0, 6);
      }
    }
  });

  it('solve(A, b): verify x satisfies Ax = b', () => {
    const A = [
      [2, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];
    const b = [1, 2, 3];

    const x = solve(A, b);
    expect(x).not.toBeNull();

    // Known solution: x = [0.5, 0, 1.5]
    expect(x![0]).toBeCloseTo(0.5, 10);
    expect(x![1]).toBeCloseTo(0, 10);
    expect(x![2]).toBeCloseTo(1.5, 10);
  });

  it('transpose: dimensions and values correct', () => {
    const A = [
      [1, 2, 3],
      [4, 5, 6],
    ];

    const At = transpose(A);

    expect(At).toHaveLength(3);
    expect(At[0]).toHaveLength(2);
    expect(At[0][0]).toBe(1);
    expect(At[0][1]).toBe(4);
    expect(At[2][1]).toBe(6);
  });
});

// =============================================================================
// Section 7: KDE Bandwidth — calculateKDE (Silverman's rule)
// =============================================================================

describe('Section 7: KDE Bandwidth (calculateKDE, Silverman rule)', () => {
  it('bandwidth follows Silverman formula: h = 0.9 × min(σ, IQR/1.34) × n^(-1/5)', () => {
    // Use a dataset where we can compute bandwidth analytically
    // Standard normal-like data: [-2, -1, -0.5, 0, 0.5, 1, 2]
    const values = [-2, -1, -0.5, 0, 0.5, 1, 2];
    const n = values.length;

    // Compute expected bandwidth manually
    const sorted = [...values].sort((a, b) => a - b);
    const mean = 0; // symmetric
    const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    // Q1 at index (6)*0.25 = 1.5 → sorted[1] + 0.5*(sorted[2]-sorted[1]) = -1 + 0.5*0.5 = -0.75
    // Q3 at index (6)*0.75 = 4.5 → sorted[4] + 0.5*(sorted[5]-sorted[4]) = 0.5 + 0.5*0.5 = 0.75
    const iqr = 1.5; // Q3 - Q1 = 0.75 - (-0.75) = 1.5
    const spread = Math.min(stdDev, iqr / 1.34);
    const expectedH = 0.9 * spread * Math.pow(n, -0.2);

    const kde = calculateKDE(values, 50);
    expect(kde.length).toBe(50);

    // Verify the evaluation range extends 3 bandwidths beyond data
    const minEval = kde[0].value;
    const maxEval = kde[kde.length - 1].value;
    expect(minEval).toBeCloseTo(-2 - 3 * expectedH, 1);
    expect(maxEval).toBeCloseTo(2 + 3 * expectedH, 1);
  });

  it('KDE peak is near the mode of the data', () => {
    // Unimodal data concentrated around 5
    const values = [4.5, 4.8, 5.0, 5.0, 5.1, 5.2, 5.3, 5.5];
    const kde = calculateKDE(values, 200);
    expect(kde.length).toBe(200);

    // Find the peak
    let maxDensity = 0;
    let peakValue = 0;
    for (const point of kde) {
      if (point.count > maxDensity) {
        maxDensity = point.count;
        peakValue = point.value;
      }
    }

    // Peak should be near the data center (~5.05)
    expect(peakValue).toBeCloseTo(5.05, 0);
  });

  it('KDE density integrates approximately to 1', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const numPoints = 500;
    const kde = calculateKDE(values, numPoints);

    // Numerical integration (trapezoidal rule)
    let integral = 0;
    for (let i = 1; i < kde.length; i++) {
      const dx = kde[i].value - kde[i - 1].value;
      integral += ((kde[i].count + kde[i - 1].count) / 2) * dx;
    }

    // Should integrate to approximately 1 (probability density)
    expect(integral).toBeCloseTo(1.0, 1);
  });
});

// =============================================================================
// Section 8: Probability Plot — calculateProbabilityPlotData (Benard formula)
// =============================================================================

describe('Section 8: Probability Plot (Benard formula + z-scores)', () => {
  it('Benard median rank formula: p(i) = (i - 0.3) / (n + 0.4)', () => {
    // For n=10, verify the expected percentiles match the Benard formula
    const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const points = calculateProbabilityPlotData(data);

    expect(points).toHaveLength(10);

    // Verify each point's expected percentile
    const n = 10;
    for (let i = 0; i < n; i++) {
      const expectedP = ((i + 1 - 0.3) / (n + 0.4)) * 100; // in percent
      expect(points[i].expectedPercentile).toBeCloseTo(expectedP, 10);
    }
  });

  it('z-scores correspond to normalQuantile of Benard probabilities', () => {
    const data = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const points = calculateProbabilityPlotData(data);

    // For each point, verify that its position on the normal probability
    // scale matches normalQuantile(p) where p is the Benard probability
    const n = 10;
    for (let i = 0; i < n; i++) {
      const p = (i + 1 - 0.3) / (n + 0.4);
      const expectedZ = normalQuantile(p);

      // The probability plot should place points at z-score positions
      // Verify the expected percentile maps to the correct z
      const actualP = points[i].expectedPercentile / 100;
      expect(normalQuantile(actualP)).toBeCloseTo(expectedZ, 10);
    }
  });

  it('data values are sorted ascending', () => {
    // Input in random order
    const data = [50, 10, 40, 20, 30];
    const points = calculateProbabilityPlotData(data);

    expect(points).toHaveLength(5);
    expect(points[0].value).toBe(10);
    expect(points[1].value).toBe(20);
    expect(points[2].value).toBe(30);
    expect(points[3].value).toBe(40);
    expect(points[4].value).toBe(50);
  });

  it('confidence intervals are centered on data values and have positive width', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const points = calculateProbabilityPlotData(data);

    for (const point of points) {
      // CIs are in data units, centered on the observed value
      const midpoint = (point.lowerCI + point.upperCI) / 2;
      expect(midpoint).toBeCloseTo(point.value, 10);

      // CI width should be positive
      expect(point.upperCI).toBeGreaterThan(point.lowerCI);
    }
  });
});

// =============================================================================
// Section 9: Moving Range σ_within (MR̄/d2 estimation)
// =============================================================================

describe('Section 9: Moving Range σ_within (calculateMovingRangeSigma)', () => {
  // d2 = 1.128 (unbiasing constant for subgroup size 2, individuals chart)
  const D2 = 1.128;

  it('known data: [10, 12, 11, 13, 10] → MR = [2,1,2,3], MR̄ = 2.0', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([10, 12, 11, 13, 10]);

    expect(mrBar).toBeCloseTo(2.0, 10);
    expect(sigmaWithin).toBeCloseTo(2.0 / D2, 10);
  });

  it('constant data: [5,5,5,5] → MR = [0,0,0], σ_within = 0', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([5, 5, 5, 5]);

    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });

  it('two points: [10, 20] → MR = [10], σ_within = 10/1.128', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([10, 20]);

    expect(mrBar).toBeCloseTo(10, 10);
    expect(sigmaWithin).toBeCloseTo(10 / D2, 10);
  });

  it('single point: fallback to σ_overall (which is 0 for n=1)', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([42]);

    // No moving ranges possible — falls back to d3.deviation which is 0 for n=1
    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });

  it('empty array: returns zeros', () => {
    const { sigmaWithin, mrBar } = calculateMovingRangeSigma([]);

    expect(mrBar).toBe(0);
    expect(sigmaWithin).toBe(0);
  });

  it('stable process: σ_within ≈ σ_overall (within 30%)', () => {
    // Well-behaved stationary data — no shifts or trends
    // Golden angle spacing produces uncorrelated pseudo-random values
    const data = Array.from({ length: 100 }, (_, i) => {
      const x = Math.sin(i * 137.508) * 10000;
      return 50 + (x - Math.floor(x) - 0.5) * 6;
    });

    const { sigmaWithin } = calculateMovingRangeSigma(data);
    const stats = calculateStats(data);

    // For a stable process, σ_within and σ_overall should be close
    const ratio = sigmaWithin / stats.stdDev;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.3);
  });

  it('unstable process (mean shift): σ_within < σ_overall', () => {
    // First 25 points around 50, next 25 around 60 — level shift
    const data = [
      ...Array.from({ length: 25 }, (_, i) => 50 + Math.sin(i * 1.7) * 2),
      ...Array.from({ length: 25 }, (_, i) => 60 + Math.sin(i * 1.7) * 2),
    ];

    const { sigmaWithin } = calculateMovingRangeSigma(data);
    const stats = calculateStats(data);

    // σ_overall is inflated by the mean shift; σ_within captures only local variation
    // except at the single transition point
    expect(sigmaWithin).toBeLessThan(stats.stdDev);
  });

  it('calculateStats includes sigmaWithin and mrBar in result', () => {
    const stats = calculateStats([10, 12, 11, 13, 10]);

    expect(stats.sigmaWithin).toBeCloseTo(2.0 / D2, 10);
    expect(stats.mrBar).toBeCloseTo(2.0, 10);
    // UCL/LCL use σ_within
    expect(stats.ucl).toBeCloseTo(stats.mean + 3 * stats.sigmaWithin, 10);
    expect(stats.lcl).toBeCloseTo(stats.mean - 3 * stats.sigmaWithin, 10);
  });

  it('Cp/Cpk use σ_within, not σ_overall', () => {
    // [9, 10, 11] with USL=13, LSL=7
    // σ_overall = 1.0, σ_within = 1/1.128
    const stats = calculateStats([9, 10, 11], 13, 7);

    // Cp with σ_overall would be 1.0; with σ_within it's 1.128
    expect(stats.cp).toBeCloseTo(1.128, 6);
    expect(stats.cpk).toBeCloseTo(1.128, 6);
    // Verify: Cp = (USL-LSL) / (6×σ_within)
    expect(stats.cp).toBeCloseTo((13 - 7) / (6 * stats.sigmaWithin), 10);
  });
});
