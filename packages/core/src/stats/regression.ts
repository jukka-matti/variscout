import * as d3 from 'd3-array';
import type { RegressionResult, LinearFit, QuadraticFit } from '../types';
import { tDistributionPValue } from './distributions';

/**
 * Calculate linear regression fit using least squares
 *
 * @param points - Array of {x, y} data points
 * @returns LinearFit with slope, intercept, R², and p-value
 */
function calculateLinearFit(points: Array<{ x: number; y: number }>): LinearFit {
  const n = points.length;

  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, pValue: 1, isSignificant: false };
  }

  // Calculate means
  const xMean = d3.mean(points, p => p.x) || 0;
  const yMean = d3.mean(points, p => p.y) || 0;

  // Calculate sums for least squares
  let ssXX = 0; // Sum of (x - xMean)²
  let ssXY = 0; // Sum of (x - xMean)(y - yMean)
  let ssYY = 0; // Sum of (y - yMean)²

  points.forEach(p => {
    const dx = p.x - xMean;
    const dy = p.y - yMean;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  });

  // Guard against division by zero
  if (ssXX === 0) {
    return { slope: 0, intercept: yMean, rSquared: 0, pValue: 1, isSignificant: false };
  }

  // Calculate slope and intercept
  const slope = ssXY / ssXX;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  const ssRes = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);

  const rSquared = ssYY > 0 ? 1 - ssRes / ssYY : 0;

  // Calculate t-statistic for slope significance
  // t = slope / SE(slope), where SE(slope) = sqrt(MSE / ssXX)
  const mse = ssRes / (n - 2);
  const seSlope = Math.sqrt(mse / ssXX);

  // Handle perfect or near-perfect correlation (ssRes ≈ 0)
  // When residuals are essentially zero, the relationship is significant
  const isPerfectFit = ssRes < 1e-10 && rSquared > 0.999;
  const tStat = seSlope > 0 ? Math.abs(slope) / seSlope : isPerfectFit ? Infinity : 0;

  // Calculate p-value (two-tailed)
  // For perfect fit, p-value is essentially 0
  const pValue = isPerfectFit ? 0 : n > 2 ? tDistributionPValue(tStat, n - 2) : 1;
  const isSignificant = pValue < 0.05 || isPerfectFit;

  return { slope, intercept, rSquared, pValue, isSignificant };
}

/**
 * Calculate quadratic regression fit: y = a*x² + b*x + c
 * Uses normal equations solved via matrix operations
 *
 * @param points - Array of {x, y} data points
 * @returns QuadraticFit or null if calculation fails
 */
function calculateQuadraticFit(points: Array<{ x: number; y: number }>): QuadraticFit | null {
  const n = points.length;

  if (n < 3) return null;

  // Build sums for normal equations
  let sumX = 0,
    sumX2 = 0,
    sumX3 = 0,
    sumX4 = 0;
  let sumY = 0,
    sumXY = 0,
    sumX2Y = 0;

  points.forEach(p => {
    const x = p.x;
    const x2 = x * x;
    sumX += x;
    sumX2 += x2;
    sumX3 += x2 * x;
    sumX4 += x2 * x2;
    sumY += p.y;
    sumXY += x * p.y;
    sumX2Y += x2 * p.y;
  });

  // Solve 3x3 system using Cramer's rule
  const det =
    sumX4 * (sumX2 * n - sumX * sumX) -
    sumX3 * (sumX3 * n - sumX * sumX2) +
    sumX2 * (sumX3 * sumX - sumX2 * sumX2);

  if (Math.abs(det) < 1e-10) return null;

  const detA =
    sumX2Y * (sumX2 * n - sumX * sumX) -
    sumX3 * (sumXY * n - sumX * sumY) +
    sumX2 * (sumXY * sumX - sumX2 * sumY);

  const detB =
    sumX4 * (sumXY * n - sumX * sumY) -
    sumX2Y * (sumX3 * n - sumX * sumX2) +
    sumX2 * (sumX3 * sumY - sumXY * sumX2);

  const detC =
    sumX4 * (sumX2 * sumY - sumX * sumXY) -
    sumX3 * (sumX3 * sumY - sumX2 * sumXY) +
    sumX2Y * (sumX3 * sumX - sumX2 * sumX2);

  const a = detA / det;
  const b = detB / det;
  const c = detC / det;

  // Calculate R² for quadratic fit
  const yMean = sumY / n;
  let ssRes = 0;
  let ssTot = 0;

  points.forEach(p => {
    const predicted = a * p.x * p.x + b * p.x + c;
    ssRes += Math.pow(p.y - predicted, 2);
    ssTot += Math.pow(p.y - yMean, 2);
  });

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate optimum (vertex of parabola: x = -b/2a)
  let optimumX: number | null = null;
  let optimumType: 'peak' | 'valley' | null = null;

  if (Math.abs(a) > 1e-10) {
    optimumX = -b / (2 * a);
    optimumType = a < 0 ? 'peak' : 'valley';

    // Only report optimum if it's within or near the data range
    const xMin = d3.min(points, p => p.x) || 0;
    const xMax = d3.max(points, p => p.x) || 0;
    const range = xMax - xMin;

    if (optimumX < xMin - range * 0.5 || optimumX > xMax + range * 0.5) {
      optimumX = null;
      optimumType = null;
    }
  }

  return { a, b, c, rSquared, optimumX, optimumType };
}

/**
 * Get star rating (1-5) based on R² value
 */
function getStrengthRating(rSquared: number): 1 | 2 | 3 | 4 | 5 {
  if (rSquared >= 0.9) return 5;
  if (rSquared >= 0.7) return 4;
  if (rSquared >= 0.5) return 3;
  if (rSquared >= 0.3) return 2;
  return 1;
}

/**
 * Generate plain-language insight for regression results
 */
function generateRegressionInsight(
  linear: LinearFit,
  quadratic: QuadraticFit | null,
  recommendedFit: 'linear' | 'quadratic' | 'none',
  xColumn: string,
  yColumn: string
): string {
  // Handle quadratic first (may have weak linear but strong quadratic)
  if (recommendedFit === 'quadratic' && quadratic && quadratic.optimumX !== null) {
    const optType = quadratic.optimumType === 'peak' ? 'maximum' : 'minimum';
    return `${optType.charAt(0).toUpperCase() + optType.slice(1)} ${yColumn} at ${xColumn} ≈ ${quadratic.optimumX.toFixed(1)}`;
  }

  if (recommendedFit === 'none') {
    return `No significant relationship between ${xColumn} and ${yColumn}`;
  }

  // Linear relationship
  const direction = linear.slope > 0 ? 'Higher' : 'Lower';
  const effect = linear.slope > 0 ? 'higher' : 'lower';
  return `${direction} ${xColumn} → ${effect} ${yColumn}`;
}

/**
 * Calculate regression analysis for X-Y relationship
 *
 * Performs both linear and quadratic regression, recommends the best fit,
 * and generates plain-language insights.
 *
 * @param data - Array of data records
 * @param xColumn - Column name for predictor (X) variable
 * @param yColumn - Column name for outcome (Y) variable
 * @returns RegressionResult with fits, recommendation, and insight
 *
 * @example
 * const result = calculateRegression(data, 'Temperature', 'Yield');
 * if (result?.recommendedFit === 'quadratic') {
 *   console.log(`Optimum at ${result.quadratic?.optimumX}`);
 * }
 */
export function calculateRegression<T extends Record<string, unknown>>(
  data: T[],
  xColumn: string,
  yColumn: string
): RegressionResult | null {
  // Extract numeric pairs
  const points: Array<{ x: number; y: number }> = [];

  data.forEach(row => {
    const x = Number(row[xColumn]);
    const y = Number(row[yColumn]);

    if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
      points.push({ x, y });
    }
  });

  // Need at least 3 points for meaningful regression
  if (points.length < 3) return null;

  // Calculate linear fit
  const linear = calculateLinearFit(points);

  // Calculate quadratic fit (need at least 4 points for meaningful quadratic)
  const quadratic = points.length >= 4 ? calculateQuadraticFit(points) : null;

  // Determine recommended fit
  let recommendedFit: 'linear' | 'quadratic' | 'none' = 'none';

  // Check if quadratic is strong even if linear isn't
  const quadraticIsStrong = quadratic && quadratic.rSquared >= 0.5;

  if (quadratic && quadratic.rSquared > linear.rSquared + 0.05 && quadraticIsStrong) {
    // Recommend quadratic if it improves R² by at least 5% AND is reasonably strong
    recommendedFit = 'quadratic';
  } else if (linear.isSignificant) {
    recommendedFit = 'linear';
  } else {
    recommendedFit = 'none';
  }

  // Get strength rating based on best R²
  const bestRSquared =
    quadratic && recommendedFit === 'quadratic' ? quadratic.rSquared : linear.rSquared;
  const strengthRating = getStrengthRating(bestRSquared);

  // Generate insight
  const insight = generateRegressionInsight(linear, quadratic, recommendedFit, xColumn, yColumn);

  return {
    xColumn,
    yColumn,
    n: points.length,
    points,
    linear,
    quadratic,
    recommendedFit,
    strengthRating,
    insight,
  };
}
