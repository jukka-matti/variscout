---
tier: living
purpose: decide
title: 'ADR-067: Unified GLM Regression Engine'
status: active
date: 2026-04-05
layer: L5
---

# ADR-067: Unified GLM Regression Engine

## Status

Accepted — 2026-04-05

## Context

VariScout's best subsets engine handled only categorical factors via the ANOVA cell-means model. Factor Intelligence ranked factors and factor combinations, but all factors had to be categorical. This created a structural limitation:

**Approximately 75% of real-world process improvement predictors are continuous.** Temperature, pressure, speed, fill volume, coating weight, cycle time, humidity — these are continuous measurements. Treating them as categorical (binning into "Low/Medium/High") loses information, introduces artificial group boundaries, and prevents smooth prediction for What-If simulation.

Three benchmark tools were reviewed to understand the standard approach:

- **Minitab**: Best Subsets Regression with Mallow's Cp and R²adj; handles mixed predictors via dummy coding; Type III SS for unbalanced data.
- **JMP**: Prediction Profiler with response curves and confidence intervals; automatic stepwise; interaction detection.
- **NIST StRD**: Certified numerical reference datasets for validating regression implementations.

The previous ADR-014 deferred regression as a separate "Phase 2" UI feature. However, the continuous factor limitation was identified as a gap in the investigation workflow rather than a UI complexity question: the Evidence Map needs continuous factor nodes to be positioned correctly by R²adj, and the What-If Profiler needs a fitted model to produce response curves.

The key insight that made this tractable: the GLM engine replaces the _factor ranking model_ (what gets shown in Factor Intelligence and the Evidence Map), not the _chart display engine_ (ANOVA panel in the Boxplot remains one-way ANOVA). This allows the GLM to be introduced without changing the user-facing chart experience.

## Decision

Replace the categorical-only best subsets cell-means engine with a **unified OLS/GLM engine** that handles both categorical (dummy-coded) and continuous predictors. Keep the simple `calculateAnova()` for single-factor boxplot display. Add the following capabilities:

### 1. Design Matrix Construction

Categorical factors are dummy-coded with the most frequent level as the reference level (with alphabetical tie-breaking) using reference cell coding. Continuous factors enter the design matrix directly as numeric columns. Factor type is detected by `detectFactorType()` in `@variscout/core` based on unique-value count heuristic, with user override in Column Mapping.

### 2. QR-Based OLS Solver

The OLS solver uses QR decomposition (Householder reflections) rather than the normal equations. This achieves 9+ significant digits of accuracy on the NIST Longley dataset, which is deliberately ill-conditioned. The solver is in `packages/core/src/stats/olsRegression.ts`.

### 3. Best Subsets with Group Constraint

Categorical factors with _m_ levels enter as a unit (all _m − 1_ dummies together). The Furnival-Wilson leaps and bounds algorithm evaluates all 2^k − 1 factor combinations (k ≤ 10). Selection criterion: R²adj. Implementation: `packages/core/src/stats/bestSubsets.ts`.

### 4. Two-Pass Best Subsets with Interaction Screening

After Pass 1 identifies the best main-effects model, Pass 2 screens all factor pairs among the winning factors for two-way interaction effects via partial F-test (α=0.10). Hierarchical constraint: interactions are only tested among factors in the winning model — not full enumeration. For k=6 with 3 winners: 69 OLS solves total (63 Pass 1 + 6 Pass 2) vs 2,097,151 for full interaction enumeration. Significant interactions are added to the model and re-fit. Each interaction is classified as ordinal (gap changes, lines don't cross) or disordinal (ranking reverses, lines cross) — geometric terms only, following the "contribution, not causation" principle. Implementation: `packages/core/src/stats/interactionScreening.ts`. Benchmarked against Minitab Best Subsets and JMP Fit Model for all factor type combinations (cont×cont, cont×cat, cat×cat).

### 5. Automatic Quadratic Detection

For each continuous factor, the engine tests a linear + quadratic term pair. If adding the quadratic term improves R²adj by a meaningful margin, the quadratic model is retained. Centered form (X − X̄) reduces numerical correlation. The sweet spot (optimum X\*) and operating window are computed from X̄ − β₁ / (2 × β₂). Quadratic detection is integrated into `packages/core/src/stats/olsRegression.ts`.

### 6. Type III SS with Partial η²

Type III SS is computed for each factor in the fitted model using the sequential SS approach: fit the full model, then fit the model with one factor removed; the difference is that factor's Type III SS. This correctly handles unbalanced data — each factor's contribution is adjusted for all others. Partial η² = SS_factor(Type III) / (SS_factor + SS_residual). Implementation: `packages/core/src/stats/typeIIISS.ts`.

### 7. VIF and Guardrails

VIF is computed for each continuous factor: VIF_j = 1 / (1 − R²_j) where R²_j regresses factor j on all others. Extrapolation detection flags When-If slider positions outside the observed range. Overfitting check: R² − R²adj > 0.10. Low R² warning: R²adj < 0.30.

### 8. Prediction Functions

`predictFromModel(model, factorValues)` accepts a map of factor names to values (numeric for continuous, string for categorical) and returns the predicted outcome with 95% prediction interval. Used by the What-If Prediction Profiler for continuous slider response curves. `computeCoverage()` computes the prediction interval width across the continuous factor range.

### 9. NIST Validation

A test suite in `packages/core/src/stats/__tests__/nist.test.ts` validates against the NIST StRD certified datasets (Norris, Pontius, Longley) to 9 significant digits. The Longley dataset specifically validates numerical stability under multicollinearity.

## Consequences

### Positive

- **Mixed factor types**: Analysts can include both categorical and continuous factors in the same model. A process with Machine (4 levels), Operator (3 levels), and Temperature (continuous) can now be analyzed in a single investigation.
- **Continuous prediction**: The What-If Profiler generates smooth response curves for continuous factors, not just categorical level comparisons. The sweet spot card shows the operating window.
- **Evidence Map correctness**: Continuous factor nodes are now positioned by R²adj rather than excluded. The map gives a complete view of all factors.
- **NIST validation**: The engine is validated to 9+ significant digits on certified reference datasets. This is the same validation standard used by Minitab and JMP.
- **Type III SS**: Handles unbalanced observational data correctly. Consistent with standard statistical practice.

### Trade-offs

- **Two engines to maintain**: `calculateAnova()` for one-way ANOVA (boxplot display) and the OLS/GLM engine for best subsets and prediction. This is a deliberate split — ANOVA is faster, simpler, and more familiar; GLM is more powerful. The split is documented in `statistics-reference.md`.
- **Computational cost**: OLS is more expensive than ANOVA (QR decomposition O(n × p²) vs. group means O(n × k)). Mitigated by running best subsets in a Web Worker via `useAsyncStats`, maintaining UI responsiveness.
- **Factor count limit**: Best subsets is exact for k ≤ 10 factors (1023 models). For k > 10, the engine falls back to stepwise selection. In practice, VariScout's tier limits (6 factors for Azure) mean the exact algorithm is always used.

## Implementation Notes

The unified GLM engine supersedes the deferred regression code from ADR-014. The old `regression.ts`, `multiRegression.ts`, and `modelReduction.ts` files are no longer the canonical implementation — the new modules (`olsRegression.ts`, `bestSubsets.ts`, `designMatrix.ts`, `typeIIISS.ts`) are. Quadratic detection is integrated into `olsRegression.ts`. The old files remain in the codebase but are not exported.

The `predictFromUnifiedModel()` function in `bestSubsets.ts` accepts mixed factor values (numeric for continuous, string for categorical) and returns the predicted outcome using the fitted OLS model. The direct-adjustment simulator remains available for analysts who prefer to work without fitting a model.

## Related Design Spec

[Continuous Regression Design](../archive/specs/2026-04-05-continuous-regression-design.md)

## Related ADRs

| ADR                                               | Relationship                                                   |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [ADR-014](adr-014-regression-deferral.md)         | Superseded — regression is no longer deferred                  |
| [ADR-052](adr-052-factor-intelligence.md)         | Factor Intelligence — best subsets now uses the unified engine |
| [ADR-065](adr-065-evidence-map-causal-graph.md)   | Evidence Map — continuous factor nodes now positioned by R²adj |
| [ADR-066](adr-066-evidence-map-analyze-center.md) | Evidence Map spine — What-If Profiler uses GLM prediction      |

## Amendment (2026-06-11) — ER-3 model drawer

**SE/t/p were already built and NIST-certified pre-ER-3.** The original spec text described per-coefficient SE/t/p as "one real core addition" needing ER-3. This was stale: `solveOLS` (`packages/core/src/stats/olsRegression.ts`, Householder QR) has computed SE/t/p since the initial GLM build, flowing through `BestSubsetResult.predictors` (`PredictorInfo{coefficient,standardError,tStatistic,pValue,isSignificant}`) and validated to 9 significant digits on the NIST Norris/Pontius/Longley certified datasets (including certified SE assertions).

**What ER-3 actually added:**

1. **`fitSubsetGLM`** (`packages/core/src/stats/fitSubsetGLM.ts`, barrel-exported from `@variscout/core`): refit any shown factor subset via `buildDesignMatrix` + `solveOLS` and return `{predictors (including the intercept row, term '(Intercept)'), intercept, rmse, sse, sst, rSquared, rSquaredAdj, n, referenceLevels, typeIII}`. This closes the all-categorical dispatch gap: `computeBestSubsetsANOVA` returned no predictors/intercept/rmse/typeIIIResults on the common demo shape; the drawer calls `fitSubsetGLM` of the shown subset to obtain the full coefficient table on those paths. The intercept row (index 0 of the OLSSolution arrays) is exposed with a reference-level caption, not omitted as a non-factor.

2. **`computeTypeIIISS` made marginality-aware** (`packages/core/src/stats/typeIIISS.ts`): the previous implementation silently lost the entire Type III decomposition on interaction-augmented models. The actual bug: when dropping a main effect to build the reduced model, the dangling interaction term that referenced it remained in `reducedSpecs`; `buildDesignMatrix` then threw on the incompatible spec; the surrounding try/catch swallowed the exception and the whole decomposition was silently discarded. The ER-3 fix is a marginality-pruning filter applied before each reduced-model build: dropping a main effect also drops every interaction term that references it (the standard hierarchical/marginality convention in linear models). With the filter in place, `buildDesignMatrix` never receives an invalid spec, the partial-F comparisons are well-defined, and Type III SS is computed correctly for interaction-augmented models. Main-effects-only models are byte-identical before and after the fix (the filter is a no-op when there are no interaction terms).

3. **`FitSubsetGLMResult.sst` added**: `fitSubsetGLM` now returns `sst` (total sum of squares — Σ(y − ȳ)² over the SAME listwise-deleted rows as `sse` and `n`). `solveOLS` already computed `sst` internally; ER-3 exposes it on the result so the drawer's ANOVA Total row uses the same population as the Error row — consistent even when factors have missing values. Note: `sse` has always been on `FitSubsetGLMResult` (not `BestSubsetResult`); on the OLS path the drawer derives error SS as `(1 − R²) · SST` from `BestSubsetsResult.ssTotal`.

**Covariance matrix: deliberately NOT exposed (YAGNI).** The drawer's coefficient-uncertainty presentation uses `fitted ± S` (residual standard deviation). The full covariance matrix — needed for joint prediction intervals, multi-coefficient hypothesis tests, and ridge/penalised paths — is not surfaced. Revive when prediction intervals or penalised regression enter scope.
