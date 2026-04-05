---
title: Continuous Regression Design
status: delivered
date: 2026-04-05
audience: [engineer]
category: analysis
related: [best-subsets, factor-intelligence, evidence-map, what-if, ols, glm]
---

# Continuous Regression Design

Design specification for the unified GLM regression engine — extending VariScout's best subsets engine from categorical-only to mixed categorical + continuous factor support.

## Status: delivered

Implemented in the `continuous-regression` branch. ADR-067 captures the decision record.

---

## Problem

Factor Intelligence ranked factors by R²adj, but only categorical factors could participate in the model. Continuous factors (temperature, pressure, speed, fill volume) had to be excluded or manually binned — a lossy approximation that:

1. Prevented continuous prediction (smooth response curves in What-If)
2. Left continuous factor nodes absent from the Evidence Map
3. Forced analysts to treat 75%+ of real-world predictors as second-class inputs
4. Broke the transfer function: no continuous coefficient means no "each 10°C increases yield by 4%"

---

## Solution: Unified OLS/GLM

One engine handles both factor types. Categorical factors enter via dummy coding (reference cell); continuous factors enter directly. The OLS solver is QR-based for numerical stability.

### Design matrix construction

```
Categorical factor (Machine: A, B, C, D):
  → 3 dummy columns: [Machine=B], [Machine=C], [Machine=D]
  → Reference level: A (intercept absorbs A's effect)

Continuous factor (Temperature):
  → 1 column: raw numeric values
  → Optionally: 1 additional column for quadratic term (Temperature − mean)²
```

### Model selection

Best subsets evaluates all 2^k − 1 factor combinations. Categorical factors enter/leave as groups (all dummies together). Selection criterion: R²adj. For k ≤ 10, evaluation is exact via leaps-and-bounds. For k > 10, stepwise fallback.

### Prediction

`predictFromModel(model, factorValues)` accepts:

- Continuous factor: numeric value
- Categorical factor: string level name

Returns: `{ predicted, lowerPI, upperPI }` — predicted value with 95% prediction interval.

---

## Key Components

| Module                | File                                             | Purpose                                           |
| --------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Factor type detection | `packages/core/src/stats/factorType.ts`          | Heuristic + user override                         |
| Design matrix         | `packages/core/src/stats/designMatrix.ts`        | Dummy coding + continuous columns                 |
| OLS solver            | `packages/core/src/stats/olsRegression.ts`       | QR decomposition (Householder)                    |
| Best subsets          | `packages/core/src/stats/bestSubsets.ts`         | R²adj model selection                             |
| Quadratic detection   | `packages/core/src/stats/olsRegression.ts`       | Curvature test + sweet spot (integrated into OLS) |
| Type III SS           | `packages/core/src/stats/typeIIISS.ts`           | Partial η² per factor                             |
| Prediction            | `packages/core/src/stats/` → `predictFromModel`  | What-If response curves                           |
| NIST validation       | `packages/core/src/stats/__tests__/nist.test.ts` | Certified reference datasets                      |

---

## UI Touchpoints

| Component                 | Change                                                        |
| ------------------------- | ------------------------------------------------------------- |
| Evidence Map Layer 1      | Continuous factor nodes now positioned by R²adj               |
| Factor Preview Overlay    | Shows continuous + categorical factors                        |
| What-If Profiler          | Continuous sliders with response curve + operating window     |
| Sweet Spot Card           | Operating window for quadratic factors                        |
| Equation Bar              | Mixed equation: slope × continuous + effect(categoricalLevel) |
| Factor Intelligence Panel | VIF warning for correlated continuous factors                 |

---

## Guardrails Added

| Guardrail     | Trigger                       | Message                                    |
| ------------- | ----------------------------- | ------------------------------------------ |
| Extrapolation | Slider outside observed range | Amber indicator + warning text             |
| High VIF      | VIF > 10                      | Factor correlation warning                 |
| Low R²        | R²adj < 0.30                  | "Important factors may be missing"         |
| Overfitting   | R² − R²adj > 0.10             | "Collect more data or reduce factor count" |

---

## NIST Validation

Three StRD datasets validated to 9+ significant digits:

| Dataset | Tests                      | Accuracy       |
| ------- | -------------------------- | -------------- |
| Norris  | Simple linear              | ✓ 9 sig digits |
| Pontius | Quadratic                  | ✓ 9 sig digits |
| Longley | Multiple (ill-conditioned) | ✓ 9 sig digits |

---

## References

- [ADR-067](../../07-decisions/adr-067-unified-glm-regression.md) — Decision record
- [Regression Methodology](../../03-features/analysis/regression-methodology.md) — Analyst-facing documentation
- [Statistics Technical Reference](../../05-technical/statistics-reference.md) — Developer formulas
