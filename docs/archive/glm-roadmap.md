---
title: 'GLM Engine Roadmap'
---

> **HISTORICAL ONLY** — This document describes deferred math enhancements. Regression UI was removed in Feb 2026 per [ADR-014](../07-decisions/adr-014-regression-deferral.md). Kept for reference only.

# GLM Engine Roadmap

> **Note:** Regression UI has been deferred per [ADR-014](../07-decisions/adr-014-regression-deferral.md). Core math files (regression.ts, multiRegression.ts, interaction.ts, modelReduction.ts, matrix.ts) are preserved in the repository but unexported from `@variscout/core`. This roadmap applies to Phase 2 re-enablement.

Post-MVP enhancements for VariScout's regression engine. Current implementation uses OLS via the Normal Equations `(X'X)⁻¹X'Y` with categorical dummy coding — the General Linear Model (not Generalized). It works well for typical SPC data (3–6 factors, 100–10K rows, roughly normal distributions).

**Status**: Deferred (Phase 2). See [ADR-014](../07-decisions/adr-014-regression-deferral.md) for re-enablement criteria.

## Summary

| #   | Feature                     | Complexity | Dependencies            | Priority |
| --- | --------------------------- | ---------- | ----------------------- | -------- |
| 1   | Distribution Identification | ~250 lines | None                    | Medium   |
| 2   | Residual Diagnostics        | ~20 lines  | None                    | High     |
| 3   | Residual Normality Test     | ~150 lines | Feature 2               | High     |
| 4   | QR Decomposition            | ~120 lines | None                    | High     |
| 5   | Leverage + Cook's Distance  | ~120 lines | Feature 2               | Medium   |
| 6   | Generalized Linear Models   | ~400 lines | Feature 4 (recommended) | Low      |
| 7   | Robust/Weighted Regression  | ~200 lines | Feature 4 (recommended) | Low      |

## Dependency Graph

```
1 (Distribution ID)      — independent

2 (Residuals) ─────┬───→ 3 (Normality Test)
                    └───→ 5 (Leverage/Cook's)

4 (QR Decomposition) ──┬─→ 6 (GLM) [recommended]
                        └─→ 7 (Robust Regression) [recommended]
```

Features 1, 2, and 4 can be implemented independently and in parallel. Feature 4 is recommended (not required) before 6 and 7 because IRLS and M-estimation benefit from numerically stable decomposition.

---

## Feature 1: Distribution Identification

**What**: Fit Normal, Lognormal, Weibull, and Exponential distributions to data. Rank by Anderson-Darling goodness-of-fit statistic.

**Why for quality engineers**: SPC assumes normality. When data is non-normal (e.g., cycle times follow Lognormal, failure rates follow Weibull), Cpk calculations are misleading. Distribution identification tells the user which distribution fits best, enabling correct capability analysis.

**Current state**: `calculateProbabilityPlotData()` in `packages/core/src/stats/probability.ts` computes normal Q-Q plot data with Benard ranks. The probability plot visually reveals non-normality but doesn't quantify it.

**Implementation sketch**:

- New module: `packages/core/src/stats/distributions-fit.ts`
- MLE parameter estimation for each family (closed-form for Normal/Exponential, numerical for Weibull/Lognormal)
- Anderson-Darling statistic: `A² = -n - Σ[(2i-1)/n][ln F(y_i) + ln(1 - F(y_{n+1-i}))]`
- Return ranked results with parameters, A², and p-value approximation
- UI: badge on probability plot showing best-fit distribution

**Complexity**: ~250 lines core. MLE for Weibull requires Newton-Raphson iteration (~40 lines). Critical tables for A-D p-values add ~50 lines.

**Dependencies**: None — uses existing sorted data from stats engine.

**Test strategy**: Validate against R `fitdistr()` and `ad.test()`. Generate synthetic data from each distribution family and verify correct identification.

---

## Feature 2: Residual Diagnostics

**What**: Return residuals (e_i = y_i - ŷ_i) and fitted values (ŷ_i) from `calculateMultipleRegression()`.

**Why for quality engineers**: Residual plots reveal model violations — patterns indicate missing terms, non-constant variance (heteroscedasticity), or outliers. Without residuals, users cannot validate that the regression model is appropriate.

**Current state**: `calculateMultipleRegression()` in `packages/core/src/stats/multiRegression.ts` computes β, R², and p-values but discards the fitted values and residuals after using them for RMSE.

**Implementation sketch**:

- Extend `MultiRegressionResult` in `packages/core/src/types.ts` with optional `residuals: number[]` and `fittedValues: number[]`
- In `multiRegression.ts`, retain `Xβ` (fitted) and `Y - Xβ` (residuals) instead of discarding
- Optionally gated by a `diagnostics: boolean` option to avoid memory overhead for large datasets

**Complexity**: ~20 lines — the values are already computed, just not returned.

**Dependencies**: None.

**Test strategy**: Verify `sum(residuals) ≈ 0`, `mean(fitted) ≈ mean(Y)`, and residuals match hand calculations for small datasets.

---

## Feature 3: Residual Normality Test

**What**: Shapiro-Wilk test on regression residuals. Surface as amber warning on the regression panel when residuals are non-normal (p < 0.05).

**Why for quality engineers**: OLS assumes normally distributed errors. Non-normal residuals mean confidence intervals, p-values, and prediction intervals may be unreliable. An amber warning alerts users without blocking analysis.

**Current state**: No residual normality checking. Users must visually inspect the probability plot.

**Implementation sketch**:

- New function: `shapiroWilk(values: number[]): { W: number; pValue: number }` in `packages/core/src/stats/normality.ts`
- Algorithm: Royston's approximation (handles n ≤ 5000)
- Coefficients: precomputed table for n ≤ 50, polynomial approximation for larger n
- UI: amber badge on `RegressionPanelBase` when `shapiroWilk(residuals).pValue < 0.05`

**Complexity**: ~150 lines. Royston's algorithm requires ~80 lines for the W statistic and ~40 lines for p-value approximation from normalized W.

**Dependencies**: Feature 2 (residuals must be available in `MultiRegressionResult`).

**Test strategy**: Validate W and p-value against R `shapiro.test()` for normal, uniform, and exponential samples.

---

## Feature 4: QR Decomposition

**What**: Replace Normal Equations `(X'X)⁻¹X'Y` with QR decomposition `X = QR, β = R⁻¹Q'Y` for solving the regression system.

**Why for quality engineers**: The Normal Equations square the condition number of X (κ(X'X) = κ(X)²). For correlated predictors — common in manufacturing (temperature correlates with humidity, shift correlates with time) — this can cause coefficient instability or complete failure. QR decomposition is numerically stable.

**Current state**: `packages/core/src/matrix.ts` implements Gauss-Jordan elimination with partial pivoting for `inverse()`. The Hilbert 4×4 test (`reference-validation.test.ts`) shows 3-digit accuracy, and the 5×5 test documents precision degradation. VIF computation also uses matrix inversion via the same path.

**Implementation sketch**:

- New functions in `packages/core/src/matrix.ts`: `qrDecompose(A): { Q, R }` and `qrSolve(Q, R, b): number[]`
- Modified Gram-Schmidt process (~60 lines) or Householder reflections (~80 lines, more stable)
- Update `calculateMultipleRegression()` to use `qrSolve` instead of `inverse(XtX) * XtY`
- Retain `inverse()` for backward compatibility and VIF computation

**Complexity**: ~120 lines. Householder QR is preferred for numerical stability.

**Dependencies**: None — pure linear algebra addition to `matrix.ts`.

**Test strategy**: Hilbert matrix tests (already in `reference-validation.test.ts`) should show improved precision. Longley dataset (`multiRegression.test.ts`) should achieve tighter coefficient tolerances. Performance benchmarks should show comparable speed.

---

## Feature 5: Leverage + Cook's Distance

**What**: Compute leverage values h_ii (hat matrix diagonal) and Cook's distance D_i for each observation. Flag influential points.

**Why for quality engineers**: A single unusual measurement can dominate the regression model. Leverage identifies points far from the predictor mean; Cook's distance combines leverage with residual magnitude to identify observations that disproportionately influence all fitted values.

**Current state**: No influence diagnostics. Users cannot identify which data points are driving the model.

**Implementation sketch**:

- Leverage: `h_ii = diagonal(X(X'X)⁻¹X')` — requires hat matrix diagonal
- Cook's distance: `D_i = (e_i² × h_ii) / (p × MSE × (1 - h_ii)²)`
- Threshold: `D_i > 4/n` flags influential observations
- Add `leverage: number[]` and `cooksDistance: number[]` to `MultiRegressionResult`
- UI: highlight influential points in scatter plot (red ring marker)

**Complexity**: ~120 lines. Hat matrix diagonal can be computed without forming the full n×n hat matrix by using the design matrix and inverse.

**Dependencies**: Feature 2 (needs residuals). Benefits from Feature 4 (QR provides cleaner hat matrix computation via `H = Q₁Q₁'`).

**Test strategy**: Verify against R `hatvalues()` and `cooks.distance()` for NIST datasets.

---

## Feature 6: Generalized Linear Models

**What**: Extend regression to non-normal response distributions via Iteratively Reweighted Least Squares (IRLS). Support Logistic (binary outcomes), Poisson (count data), and Gamma (positive continuous) families.

**Why for quality engineers**: Not all quality metrics are continuous and normal. Pass/fail rates (binomial), defect counts per unit (Poisson), and time-to-failure (Gamma) require appropriate link functions for valid inference.

**Current state**: Only OLS (identity link, normal family). The design matrix construction and categorical dummy coding in `multiRegression.ts` are reusable.

**Implementation sketch**:

- New module: `packages/core/src/stats/glm.ts`
- Family interface: `{ linkFn, inverseLinkFn, varianceFn, devianceFn }`
- IRLS loop: solve weighted least squares at each iteration until convergence
- Deviance-based R² analog and likelihood ratio tests for significance
- Reuse existing `buildDesignMatrix` and `buildDummyVariables` from `multiRegression.ts`

**Complexity**: ~400 lines. IRLS core is ~100 lines; family definitions ~80 lines each; convergence checks and diagnostics ~60 lines.

**Dependencies**: Feature 4 recommended — IRLS solves a weighted least squares problem at each iteration, and QR decomposition handles the changing weights more stably than Normal Equations.

**Test strategy**: Validate against R `glm()` for logistic, Poisson, and Gamma families using small certified datasets.

---

## Feature 7: Robust/Weighted Regression

**What**: Huber M-estimation for regression resistant to outliers. Optionally, user-supplied observation weights.

**Why for quality engineers**: Manufacturing data often contains outliers — measurement errors, equipment malfunctions, or startup transients. A single extreme value can distort OLS coefficients. Robust regression downweights extreme residuals, giving stable estimates without manual outlier removal.

**Current state**: No outlier robustness. Users must manually identify and exclude outliers.

**Implementation sketch**:

- New module: `packages/core/src/stats/robust.ts`
- Huber M-estimation: IRLS with Huber weight function `w(r) = min(1, c/|r|)` where c = 1.345
- Converge when max weight change < ε
- Weighted regression: extend `calculateMultipleRegression` options with `weights: number[]`
- Return both OLS and robust estimates for comparison

**Complexity**: ~200 lines. Huber IRLS ~80 lines; weight function variants (Tukey bisquare) ~40 lines; integration with existing regression ~80 lines.

**Dependencies**: Feature 4 recommended — weighted least squares with rapidly changing weights benefits from QR stability. Feature 5 helpful — Cook's distance identifies points that robust regression would downweight, useful for validation.

**Test strategy**: Verify that injecting 10% outliers degrades OLS R² but robust R² remains stable. Validate Huber coefficients against R `rlm()` from the MASS package.

---

## Implementation Priority

**Phase 1** (foundation): Features 2, 4 — residuals and QR decomposition. Low effort, high value, unblock everything else.

**Phase 2** (diagnostics): Features 3, 5 — normality test and influence diagnostics. Immediate user value via warnings and highlights.

**Phase 3** (distribution): Feature 1 — distribution identification. Independent, enhances probability plot.

**Phase 4** (advanced): Features 6, 7 — GLM and robust regression. Significant scope expansion, lowest priority for SPC use case.
