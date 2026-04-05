/**
 * QR-based Ordinary Least Squares (OLS) regression solver.
 *
 * Uses Householder reflections for QR decomposition — numerically stable
 * and suitable for ill-conditioned problems (e.g., Longley dataset).
 *
 * All internal storage uses Float64Array for IEEE 754 double precision.
 * Column-major input X[col][row] matches the designMatrix.ts convention.
 *
 * @module olsRegression
 */

import { fDistributionPValue, tDistributionPValue } from './distributions';

// ============================================================================
// Public types
// ============================================================================

/**
 * Complete OLS solution with diagnostics.
 */
export interface OLSSolution {
  /** Estimated coefficients β (length p) */
  coefficients: Float64Array;
  /** Standard errors SE(βᵢ) (length p) */
  standardErrors: Float64Array;
  /** t-statistics βᵢ/SE(βᵢ) (length p) */
  tStatistics: Float64Array;
  /** Two-tailed p-values for each coefficient (length p) */
  pValues: Float64Array;
  /** Residuals eᵢ = yᵢ - ŷᵢ (length n) */
  residuals: Float64Array;
  /** Sum of squared errors (residual SS) */
  sse: number;
  /** Total sum of squares about the mean */
  sst: number;
  /** Regression sum of squares (SST - SSE) */
  ssr: number;
  /** Coefficient of determination */
  rSquared: number;
  /** Adjusted R² = 1 - (1-R²)(n-1)/(n-p) */
  rSquaredAdj: number;
  /** F-statistic for the overall model */
  fStatistic: number;
  /** p-value for the F-test */
  fPValue: number;
  /** Root mean squared error √(SSE/(n-p)) */
  rmse: number;
  /** Number of observations */
  n: number;
  /** Number of parameters (including intercept) */
  p: number;
  /** Condition number: max|diag(R)| / min|diag(R)| */
  conditionNumber: number;
  /** Effective rank after tolerance check */
  rank: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Tolerance for rank deficiency detection relative to max |R[k][k]| */
const RANK_TOLERANCE = 1e-12;

/** Condition number threshold for warning */
export const CONDITION_NUMBER_WARNING = 1e8;

// ============================================================================
// Main solver
// ============================================================================

/**
 * Solve the OLS problem min‖Xβ - y‖² via Householder QR decomposition.
 *
 * @param X - Column-major design matrix: X[col] is Float64Array of length n.
 *            Column 0 is typically the intercept (all 1s).
 * @param y - Response vector of length n.
 * @param n - Number of observations.
 * @param p - Number of parameters (columns in X).
 * @returns  Complete OLS solution with diagnostics.
 *
 * @throws {Error} If n < p (underdetermined system).
 */
export function solveOLS(X: Float64Array[], y: Float64Array, n: number, p: number): OLSSolution {
  if (n < p) {
    throw new Error(`Underdetermined system: n=${n} < p=${p}`);
  }
  if (n === p) {
    // Exactly determined — R² = 1 trivially, no residual df
    // Still solve, but F-test / SE undefined
  }

  // -----------------------------------------------------------------------
  // 1. Copy X into row-major working matrix A[row * p + col] and y into qy
  //    We work row-major internally for cache-friendly Householder sweeps.
  // -----------------------------------------------------------------------
  const A = new Float64Array(n * p);
  for (let j = 0; j < p; j++) {
    const col = X[j];
    for (let i = 0; i < n; i++) {
      A[i * p + j] = col[i];
    }
  }

  const qy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    qy[i] = y[i];
  }

  // -----------------------------------------------------------------------
  // 2. Householder QR decomposition in-place on A.
  //    After completion:
  //      - Upper triangle of A contains R.
  //      - qy contains Q'y (first p entries are the transformed RHS).
  //    We also store the diagonal of R separately for condition checks.
  // -----------------------------------------------------------------------
  const diagR = new Float64Array(p);

  for (let k = 0; k < p; k++) {
    // Compute the norm of column k from row k to n-1
    let sigma = 0;
    for (let i = k; i < n; i++) {
      const val = A[i * p + k];
      sigma += val * val;
    }
    sigma = Math.sqrt(sigma);

    if (sigma === 0) {
      diagR[k] = 0;
      continue;
    }

    // Choose sign to avoid cancellation
    const akk = A[k * p + k];
    if (akk > 0) sigma = -sigma;

    // Householder vector: v[k] = a[k,k] - sigma, v[i] = a[i,k] for i > k
    // Store v in-place in the lower part of A column k
    const vk = akk - sigma;
    A[k * p + k] = vk;

    // tau = -2 / (v'v) — the Householder scalar
    // v'v = vk^2 + sum_{i>k} a[i,k]^2 = vk^2 + (sigma^2 - akk^2)
    const vTv = vk * vk + (sigma * sigma - akk * akk);

    if (vTv === 0) {
      diagR[k] = sigma;
      A[k * p + k] = sigma;
      continue;
    }

    const tau = -2.0 / vTv;

    // Apply Householder reflection to remaining columns j > k of A
    for (let j = k + 1; j < p; j++) {
      // dot = v' * A[:,j] (rows k to n-1)
      let dot = vk * A[k * p + j];
      for (let i = k + 1; i < n; i++) {
        dot += A[i * p + k] * A[i * p + j];
      }
      const scale = tau * dot;
      // A[:,j] += scale * v
      A[k * p + j] += scale * vk;
      for (let i = k + 1; i < n; i++) {
        A[i * p + j] += scale * A[i * p + k];
      }
    }

    // Apply same reflection to qy
    let dot = vk * qy[k];
    for (let i = k + 1; i < n; i++) {
      dot += A[i * p + k] * qy[i];
    }
    const scale = tau * dot;
    qy[k] += scale * vk;
    for (let i = k + 1; i < n; i++) {
      qy[i] += scale * A[i * p + k];
    }

    // Store R diagonal
    diagR[k] = sigma;
    A[k * p + k] = sigma;
  }

  // -----------------------------------------------------------------------
  // 3. Rank deficiency detection
  // -----------------------------------------------------------------------
  let maxDiag = 0;
  for (let k = 0; k < p; k++) {
    const absD = Math.abs(diagR[k]);
    if (absD > maxDiag) maxDiag = absD;
  }

  const tol = RANK_TOLERANCE * maxDiag;
  let rank = 0;
  const isRankDeficient = new Uint8Array(p);
  for (let k = 0; k < p; k++) {
    if (Math.abs(diagR[k]) > tol) {
      rank++;
    } else {
      isRankDeficient[k] = 1;
    }
  }

  // Condition number
  let minDiag = Infinity;
  for (let k = 0; k < p; k++) {
    if (!isRankDeficient[k]) {
      const absD = Math.abs(diagR[k]);
      if (absD < minDiag) minDiag = absD;
    }
  }
  const conditionNumber = minDiag > 0 ? maxDiag / minDiag : Infinity;

  // -----------------------------------------------------------------------
  // 4. Back-substitution: Rβ = Q'y (upper p×p of A is R, first p of qy)
  // -----------------------------------------------------------------------
  const beta = new Float64Array(p);

  for (let k = p - 1; k >= 0; k--) {
    if (isRankDeficient[k]) {
      beta[k] = 0; // zero out rank-deficient coefficients
      continue;
    }
    let sum = qy[k];
    for (let j = k + 1; j < p; j++) {
      sum -= A[k * p + j] * beta[j];
    }
    beta[k] = sum / diagR[k];
  }

  // -----------------------------------------------------------------------
  // 5. Compute residuals, SSE, SST, fitted values
  // -----------------------------------------------------------------------
  const residuals = new Float64Array(n);

  // Compute ŷ = Xβ and residuals = y - ŷ
  let sse = 0;
  let ySum = 0;
  for (let i = 0; i < n; i++) {
    ySum += y[i];
  }
  const yMean = ySum / n;

  let sst = 0;
  for (let i = 0; i < n; i++) {
    // Compute ŷᵢ = Σⱼ X[j][i] * β[j]
    let yHat = 0;
    for (let j = 0; j < p; j++) {
      yHat += X[j][i] * beta[j];
    }
    residuals[i] = y[i] - yHat;
    sse += residuals[i] * residuals[i];

    const dev = y[i] - yMean;
    sst += dev * dev;
  }

  const ssr = sst - sse;

  // -----------------------------------------------------------------------
  // 6. R², R²adj, F-test
  // -----------------------------------------------------------------------
  const rSquared = sst > 0 ? 1 - sse / sst : 1;
  const dfRes = n - p;
  const dfReg = p - 1;
  const rSquaredAdj = dfRes > 0 ? 1 - ((1 - rSquared) * (n - 1)) / dfRes : rSquared;

  const mse = dfRes > 0 ? sse / dfRes : 0;
  const msr = dfReg > 0 ? ssr / dfReg : 0;
  const fStatistic = mse > 0 ? msr / mse : Infinity;
  const fPValue = dfReg > 0 && dfRes > 0 ? fDistributionPValue(fStatistic, dfReg, dfRes) : 0;
  const rmse = Math.sqrt(mse);

  // -----------------------------------------------------------------------
  // 7. Standard errors of coefficients via (R⁻¹)(R⁻¹)ᵀ diagonal
  //    SE(βᵢ) = √(MSE × [(R⁻¹)(R⁻¹)ᵀ]ᵢᵢ)
  //
  //    We compute R⁻¹ column by column via back-substitution of identity
  //    vectors, then compute diagonal of R⁻¹(R⁻¹)ᵀ = Σⱼ (R⁻¹)²ᵢⱼ.
  // -----------------------------------------------------------------------
  const se = new Float64Array(p);
  const tStats = new Float64Array(p);
  const pVals = new Float64Array(p);

  // Compute R⁻¹ column by column — we only need to accumulate diagonal sums
  // rInvSqDiag[i] = Σⱼ (R⁻¹[i][j])²
  const rInvSqDiag = new Float64Array(p);

  for (let col = 0; col < p; col++) {
    // Solve R * x = e_col via back-substitution
    const x = new Float64Array(p);
    if (isRankDeficient[col]) continue;

    for (let k = col; k >= 0; k--) {
      if (isRankDeficient[k]) continue;

      let sum = k === col ? 1.0 : 0.0;
      for (let j = k + 1; j <= col; j++) {
        sum -= A[k * p + j] * x[j];
      }
      x[k] = sum / diagR[k];
    }

    // Accumulate into diagonal: rInvSqDiag[i] += x[i]^2
    for (let i = 0; i <= col; i++) {
      rInvSqDiag[i] += x[i] * x[i];
    }
  }

  for (let i = 0; i < p; i++) {
    if (isRankDeficient[i]) {
      se[i] = Infinity;
      tStats[i] = 0;
      pVals[i] = 1;
    } else {
      se[i] = Math.sqrt(mse * rInvSqDiag[i]);
      tStats[i] = se[i] > 0 ? beta[i] / se[i] : 0;
      pVals[i] = dfRes > 0 ? tDistributionPValue(tStats[i], dfRes) : 0;
    }
  }

  return {
    coefficients: beta,
    standardErrors: se,
    tStatistics: tStats,
    pValues: pVals,
    residuals,
    sse,
    sst,
    ssr,
    rSquared,
    rSquaredAdj,
    fStatistic,
    fPValue,
    rmse,
    n,
    p,
    conditionNumber,
    rank,
  };
}
