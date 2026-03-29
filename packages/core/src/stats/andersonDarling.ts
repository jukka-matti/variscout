/**
 * Anderson-Darling normality test
 *
 * Tests whether a sample comes from a normal distribution.
 * Uses the A² statistic with sample-size adjustment and
 * D'Agostino & Stephens (1986) p-value approximation.
 */

/**
 * Standard normal CDF using the error function
 * Φ(x) = 0.5 * (1 + erf(x / √2))
 *
 * erf() uses Horner form of a rational approximation (Abramowitz & Stegun 7.1.28)
 * Accurate to ~1.5e-7
 */
export function normalCDF(x: number): number {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;

  // erf approximation constants (Abramowitz & Stegun 7.1.28, 5-term)
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const absX = Math.abs(x / Math.SQRT2);
  const t = 1 / (1 + p * absX);
  const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  const phi = 0.5 * (1 + (x >= 0 ? erf : -erf));

  return phi;
}

export interface AndersonDarlingResult {
  /** A²* (sample-size adjusted statistic) */
  statistic: number;
  /** Approximate p-value */
  pValue: number;
}

/**
 * Anderson-Darling normality test
 *
 * @param data - Array of numeric values (at least 7 recommended)
 * @returns A²* statistic and approximate p-value
 */
export function andersonDarlingTest(data: number[]): AndersonDarlingResult {
  const valid = data.filter(v => typeof v === 'number' && isFinite(v) && !isNaN(v));
  const n = valid.length;

  if (n < 2) {
    return { statistic: 0, pValue: 1 };
  }

  // Compute mean and stdDev
  let sum = 0;
  for (let i = 0; i < n; i++) sum += valid[i];
  const mean = sum / n;

  let ssq = 0;
  for (let i = 0; i < n; i++) {
    const d = valid[i] - mean;
    ssq += d * d;
  }
  const stdDev = Math.sqrt(ssq / (n - 1));

  if (stdDev === 0) {
    // All values identical — perfectly non-normal (degenerate)
    return { statistic: Infinity, pValue: 0 };
  }

  // Sort and standardize
  const sorted = [...valid].sort((a, b) => a - b);
  const z = sorted.map(x => (x - mean) / stdDev);

  // Compute A² statistic
  let S = 0;
  for (let i = 0; i < n; i++) {
    const phi_i = normalCDF(z[i]);
    const phi_n_minus_i = normalCDF(z[n - 1 - i]);

    // Clamp to avoid log(0)
    const p1 = Math.max(1e-15, Math.min(1 - 1e-15, phi_i));
    const p2 = Math.max(1e-15, Math.min(1 - 1e-15, phi_n_minus_i));

    S += (2 * (i + 1) - 1) * (Math.log(p1) + Math.log(1 - p2));
  }

  const A2 = -n - S / n;

  // Sample-size adjustment (Stephens, 1974)
  const A2star = A2 * (1 + 0.75 / n + 2.25 / (n * n));

  // P-value approximation (D'Agostino & Stephens, 1986)
  const pValue = andersonDarlingPValue(A2star);

  return { statistic: A2star, pValue };
}

/**
 * Approximate p-value for adjusted A² statistic
 * From D'Agostino & Stephens (1986), Table 4.9
 */
function andersonDarlingPValue(A2star: number): number {
  if (A2star <= 0) return 1;

  // Piecewise approximation from Marsaglia & Marsaglia (2004)
  if (A2star >= 0.6) {
    const p = Math.exp(1.2937 - 5.709 * A2star + 0.0186 * A2star * A2star);
    return Math.min(1, Math.max(0, p));
  }
  if (A2star > 0.34) {
    const p = Math.exp(0.9177 - 4.279 * A2star - 1.38 * A2star * A2star);
    return Math.min(1, Math.max(0, p));
  }
  if (A2star > 0.2) {
    const p = 1 - Math.exp(-8.318 + 42.796 * A2star - 59.938 * A2star * A2star);
    return Math.min(1, Math.max(0, p));
  }

  // Very small A²* — data is very normal
  const p = 1 - Math.exp(-13.436 + 101.14 * A2star - 223.73 * A2star * A2star);
  return Math.min(1, Math.max(0, p));
}
