/**
 * Internal statistical distribution functions.
 * Not exported from the package — used by anova, regression, and multiRegression modules.
 */

/**
 * Normal probability density function
 * @param x - Z-score value
 * @returns PDF value at x
 */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Log gamma function using Lanczos approximation
 */
export function lnGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }

  x -= 1;
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) {
    sum += c[i] / (x + i);
  }

  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

/**
 * Incomplete beta function using continued fraction approximation
 * Used for F-distribution CDF calculation
 */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use continued fraction approximation
  const maxIterations = 200;
  const epsilon = 1e-10;

  // Calculate the log of the beta coefficient
  const logBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - logBeta) / a;

  // Lentz's algorithm for continued fraction
  let f = 1;
  let c = 1;
  let d = 0;

  for (let m = 0; m <= maxIterations; m++) {
    // Calculate the numerator
    let numerator: number;
    if (m === 0) {
      numerator = 1;
    } else if (m % 2 === 0) {
      const k = m / 2;
      numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k));
    } else {
      const k = (m - 1) / 2;
      numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1));
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    const delta = c * d;
    f *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  return front * (f - 1);
}

/**
 * Calculate p-value from F-distribution
 *
 * @param f - F-statistic value
 * @param df1 - Degrees of freedom numerator (between groups)
 * @param df2 - Degrees of freedom denominator (within groups)
 * @returns P-value (probability of observing F >= f under null hypothesis)
 */
export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  if (!isFinite(f)) return 0;

  // Use the relationship between F-distribution and incomplete beta function
  // P(F > f) = I_x(df2/2, df1/2) where x = df2 / (df2 + df1 * f)
  const x = df2 / (df2 + df1 * f);
  return incompleteBeta(df2 / 2, df1 / 2, x);
}

/**
 * Calculate p-value from t-distribution (two-tailed)
 * Used for testing significance of regression slope
 *
 * @param t - t-statistic value
 * @param df - Degrees of freedom
 * @returns Two-tailed p-value
 */
export function tDistributionPValue(t: number, df: number): number {
  if (df <= 0) return 1;
  if (!isFinite(t)) return 0;

  // Use relationship between t-distribution and F-distribution
  // t² with df degrees of freedom = F(1, df)
  const f = t * t;
  return fDistributionPValue(f, 1, df);
}
