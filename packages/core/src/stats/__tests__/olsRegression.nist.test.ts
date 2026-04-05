/**
 * NIST StRD validation tests for QR-based OLS solver.
 *
 * Validates against NIST Standard Reference Datasets for Linear Least Squares:
 *   - Norris (2 params, 36 obs, lower difficulty)
 *   - Pontius (3 params, 40 obs, lower difficulty, quadratic)
 *   - Longley (7 params, 16 obs, higher difficulty, ill-conditioned)
 *
 * Target: match certified values to at least 9 significant digits.
 *
 * Reference: https://www.itl.nist.gov/div898/strd/lls/lls.shtml
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

/**
 * Assert actual matches expected to at least `digits` significant figures.
 * For values near zero, use absolute tolerance scaled by the expected magnitude.
 */
function expectSigDigits(actual: number, expected: number, digits: number, label: string): void {
  if (expected === 0) {
    // For expected zero, check absolute magnitude
    expect(Math.abs(actual), `${label}: expected ~0, got ${actual}`).toBeLessThan(
      Math.pow(10, -digits)
    );
    return;
  }
  const relError = Math.abs((actual - expected) / expected);
  const maxRelError = Math.pow(10, -digits);
  expect(
    relError,
    `${label}: expected ${expected}, got ${actual}, relError=${relError.toExponential(3)}`
  ).toBeLessThan(maxRelError);
}

// ============================================================================
// NIST Norris Dataset (Linear, 2 params, 36 observations)
// ============================================================================

// Data: y, x
const NORRIS_DATA: [number, number][] = [
  [0.1, 0.2],
  [338.8, 337.4],
  [118.1, 118.2],
  [888.0, 884.6],
  [9.2, 10.1],
  [228.1, 226.5],
  [668.5, 666.3],
  [998.5, 996.3],
  [449.1, 448.6],
  [778.9, 777.0],
  [559.2, 558.2],
  [0.3, 0.4],
  [0.1, 0.6],
  [778.1, 775.5],
  [668.8, 666.9],
  [339.3, 338.0],
  [448.9, 447.5],
  [10.8, 11.6],
  [557.7, 556.0],
  [228.3, 228.1],
  [998.0, 995.8],
  [888.8, 887.6],
  [119.6, 120.2],
  [0.3, 0.3],
  [0.6, 0.3],
  [557.6, 556.8],
  [339.3, 339.1],
  [888.0, 887.2],
  [998.5, 999.0],
  [778.9, 779.0],
  [10.2, 11.1],
  [117.6, 118.3],
  [228.9, 229.2],
  [668.4, 669.1],
  [449.2, 448.9],
  [0.2, 0.5],
];

// NIST Certified Values
const NORRIS_CERTIFIED = {
  beta: [-0.262323073774029, 1.00211681802045],
  se: [0.232818234301152, 0.429796848199937e-3],
  rSquared: 0.999993745883712,
  residualSD: 0.884796396144373,
  // ANOVA
  ssRegression: 4255954.13232369,
  ssResidual: 26.6173985294224,
  msRegression: 4255954.13232369,
  msResidual: 0.782864662630069,
  fStatistic: 5436385.54079785,
  dfRegression: 1,
  dfResidual: 34,
};

// ============================================================================
// NIST Pontius Dataset (Quadratic, 3 params, 40 observations)
// ============================================================================

const PONTIUS_DATA: [number, number][] = [
  [0.11019, 150000],
  [0.21956, 300000],
  [0.32949, 450000],
  [0.43899, 600000],
  [0.54803, 750000],
  [0.65694, 900000],
  [0.76562, 1050000],
  [0.87487, 1200000],
  [0.98292, 1350000],
  [1.09146, 1500000],
  [1.20001, 1650000],
  [1.30822, 1800000],
  [1.41599, 1950000],
  [1.52399, 2100000],
  [1.63194, 2250000],
  [1.73947, 2400000],
  [1.84646, 2550000],
  [1.95392, 2700000],
  [2.06128, 2850000],
  [2.16844, 3000000],
  [0.11052, 150000],
  [0.22018, 300000],
  [0.32939, 450000],
  [0.43886, 600000],
  [0.54798, 750000],
  [0.65739, 900000],
  [0.76596, 1050000],
  [0.87474, 1200000],
  [0.983, 1350000],
  [1.0915, 1500000],
  [1.20004, 1650000],
  [1.30818, 1800000],
  [1.41613, 1950000],
  [1.52408, 2100000],
  [1.63159, 2250000],
  [1.73965, 2400000],
  [1.84696, 2550000],
  [1.95445, 2700000],
  [2.06177, 2850000],
  [2.16829, 3000000],
];

const PONTIUS_CERTIFIED = {
  beta: [0.673565789473684e-3, 0.732059160401003e-6, -0.316081871345029e-14],
  se: [0.107938612033077e-3, 0.157817399981659e-9, 0.486652849992036e-16],
  rSquared: 0.999999900178537,
  residualSD: 0.205177424076185e-3,
  ssRegression: 15.6040343244198,
  ssResidual: 0.155761768796992e-5,
  msRegression: 7.80201716220991,
  msResidual: 0.420977753505385e-7,
  fStatistic: 185330865.995752,
  dfRegression: 2,
  dfResidual: 37,
};

// ============================================================================
// NIST Longley Dataset (7 params, 16 observations, higher difficulty)
// ============================================================================

// Data: y, x1, x2, x3, x4, x5, x6
const LONGLEY_DATA: number[][] = [
  [60323, 83.0, 234289, 2356, 1590, 107608, 1947],
  [61122, 88.5, 259426, 2325, 1456, 108632, 1948],
  [60171, 88.2, 258054, 3682, 1616, 109773, 1949],
  [61187, 89.5, 284599, 3351, 1650, 110929, 1950],
  [63221, 96.2, 328975, 2099, 3099, 112075, 1951],
  [63639, 98.1, 346999, 1932, 3594, 113270, 1952],
  [64989, 99.0, 365385, 1870, 3547, 115094, 1953],
  [63761, 100.0, 363112, 3578, 3350, 116219, 1954],
  [66019, 101.2, 397469, 2904, 3048, 117388, 1955],
  [67857, 104.6, 419180, 2822, 2857, 118734, 1956],
  [68169, 108.4, 442769, 2936, 2798, 120445, 1957],
  [66513, 110.8, 444546, 4681, 2637, 121950, 1958],
  [68655, 112.6, 482704, 3813, 2552, 123366, 1959],
  [69564, 114.2, 502601, 3931, 2514, 125368, 1960],
  [69331, 115.7, 518173, 4806, 2572, 127852, 1961],
  [70551, 116.9, 554894, 4007, 2827, 130081, 1962],
];

const LONGLEY_CERTIFIED = {
  beta: [
    -3482258.63459582, // B0 (intercept)
    15.0618722713733, // B1
    -0.035819179292591, // B2
    -2.02022980381683, // B3
    -1.03322686717359, // B4
    -0.0511041056535807, // B5
    1829.15146461355, // B6
  ],
  se: [
    890420.383607373, 84.9149257747669, 0.0334910077722432, 0.488399681651699, 0.214274163161675,
    0.22607320006937, 455.478499142212,
  ],
  rSquared: 0.995479004577296,
  residualSD: 304.854073561965,
  // ANOVA from NIST certified values
  ssRegression: 184172401.944494,
  ssResidual: 836424.055505915,
  fStatistic: 330.285339234588,
  dfRegression: 6,
  dfResidual: 9,
};

// ============================================================================
// Test suites
// ============================================================================

describe('NIST StRD: Norris (linear, 2 params)', () => {
  const n = NORRIS_DATA.length;
  const p = 2;
  const X = toColumnMajor(NORRIS_DATA.map(([, x]) => [1, x]));
  const y = Float64Array.from(NORRIS_DATA.map(([yi]) => yi));

  let result: OLSSolution;

  it('should solve Norris dataset', () => {
    result = solveOLS(X, y, n, p);
    expect(result).toBeDefined();
    expect(result.n).toBe(36);
    expect(result.p).toBe(2);
    expect(result.rank).toBe(2);
  });

  it('coefficients match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.coefficients[0], NORRIS_CERTIFIED.beta[0], 9, 'B0');
    expectSigDigits(result.coefficients[1], NORRIS_CERTIFIED.beta[1], 9, 'B1');
  });

  it('standard errors match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.standardErrors[0], NORRIS_CERTIFIED.se[0], 9, 'SE(B0)');
    expectSigDigits(result.standardErrors[1], NORRIS_CERTIFIED.se[1], 9, 'SE(B1)');
  });

  it('R² matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rSquared, NORRIS_CERTIFIED.rSquared, 9, 'R²');
  });

  it('residual standard deviation matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rmse, NORRIS_CERTIFIED.residualSD, 9, 'RMSE');
  });

  it('SSE matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.sse, NORRIS_CERTIFIED.ssResidual, 9, 'SSE');
  });

  it('SSR matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.ssr, NORRIS_CERTIFIED.ssRegression, 9, 'SSR');
  });

  it('F-statistic matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.fStatistic, NORRIS_CERTIFIED.fStatistic, 9, 'F');
  });
});

describe('NIST StRD: Pontius (quadratic, 3 params)', () => {
  const n = PONTIUS_DATA.length;
  const p = 3;
  const X = toColumnMajor(PONTIUS_DATA.map(([, x]) => [1, x, x * x]));
  const y = Float64Array.from(PONTIUS_DATA.map(([yi]) => yi));

  let result: OLSSolution;

  it('should solve Pontius dataset', () => {
    result = solveOLS(X, y, n, p);
    expect(result).toBeDefined();
    expect(result.n).toBe(40);
    expect(result.p).toBe(3);
    expect(result.rank).toBe(3);
  });

  it('coefficients match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.coefficients[0], PONTIUS_CERTIFIED.beta[0], 9, 'B0');
    expectSigDigits(result.coefficients[1], PONTIUS_CERTIFIED.beta[1], 9, 'B1');
    expectSigDigits(result.coefficients[2], PONTIUS_CERTIFIED.beta[2], 9, 'B2');
  });

  it('standard errors match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.standardErrors[0], PONTIUS_CERTIFIED.se[0], 9, 'SE(B0)');
    expectSigDigits(result.standardErrors[1], PONTIUS_CERTIFIED.se[1], 9, 'SE(B1)');
    expectSigDigits(result.standardErrors[2], PONTIUS_CERTIFIED.se[2], 9, 'SE(B2)');
  });

  it('R² matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rSquared, PONTIUS_CERTIFIED.rSquared, 9, 'R²');
  });

  it('residual standard deviation matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rmse, PONTIUS_CERTIFIED.residualSD, 9, 'RMSE');
  });

  it('SSE matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.sse, PONTIUS_CERTIFIED.ssResidual, 9, 'SSE');
  });

  it('SSR matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.ssr, PONTIUS_CERTIFIED.ssRegression, 9, 'SSR');
  });

  it('F-statistic matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.fStatistic, PONTIUS_CERTIFIED.fStatistic, 9, 'F');
  });
});

describe('NIST StRD: Longley (7 params, ill-conditioned)', () => {
  const n = LONGLEY_DATA.length;
  const p = 7; // intercept + 6 predictors
  const X = toColumnMajor(
    LONGLEY_DATA.map(row => [1, row[1], row[2], row[3], row[4], row[5], row[6]])
  );
  const y = Float64Array.from(LONGLEY_DATA.map(row => row[0]));

  let result: OLSSolution;

  it('should solve Longley dataset', () => {
    result = solveOLS(X, y, n, p);
    expect(result).toBeDefined();
    expect(result.n).toBe(16);
    expect(result.p).toBe(7);
    expect(result.rank).toBe(7);
  });

  it('should report high condition number', () => {
    result = solveOLS(X, y, n, p);
    // Longley is known to be ill-conditioned
    expect(result.conditionNumber).toBeGreaterThan(1e4);
  });

  it('coefficients match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    for (let i = 0; i < p; i++) {
      expectSigDigits(result.coefficients[i], LONGLEY_CERTIFIED.beta[i], 9, `B${i}`);
    }
  });

  it('standard errors match NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    for (let i = 0; i < p; i++) {
      expectSigDigits(result.standardErrors[i], LONGLEY_CERTIFIED.se[i], 9, `SE(B${i})`);
    }
  });

  it('R² matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rSquared, LONGLEY_CERTIFIED.rSquared, 9, 'R²');
  });

  it('residual standard deviation matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.rmse, LONGLEY_CERTIFIED.residualSD, 9, 'RMSE');
  });

  it('SSE matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.sse, LONGLEY_CERTIFIED.ssResidual, 9, 'SSE');
  });

  it('SSR matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.ssr, LONGLEY_CERTIFIED.ssRegression, 9, 'SSR');
  });

  it('F-statistic matches NIST to 9+ significant digits', () => {
    result = solveOLS(X, y, n, p);
    expectSigDigits(result.fStatistic, LONGLEY_CERTIFIED.fStatistic, 9, 'F');
  });
});
