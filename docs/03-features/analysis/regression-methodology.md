---
title: Regression Methodology
audience: [analyst, engineer]
category: analysis
status: stable
related: [best-subsets, factor-intelligence, evidence-map, what-if]
---

# Regression Methodology

How VariScout models the relationship between process factors and the measured outcome — from factor type detection through the regression equation, sweet spot detection, and prediction.

---

## Overview

VariScout uses a **unified General Linear Model (GLM)** engine for factor analysis. One engine handles both categorical factors (machine type, shift, supplier) and continuous factors (temperature, pressure, speed) — and any mix of the two.

This matters because real process improvement rarely deals with pure categorical or pure continuous data. A coating process might have Operator (categorical, 4 levels), Temperature (continuous, 160–200°C), and Line Speed (continuous, 5–15 m/min) all affecting yield simultaneously. Analyzing these with different tools — ANOVA for Operator, correlation for Temperature — misses the interactions and gives incomplete answers.

### The teaching principle

> "Don't search for the equation first — search for which variables make a difference."

Best subsets regression evaluates all factor combinations to find the most explanatory model. The equation comes last — after you know which factors belong in it. This mirrors the INVESTIGATE phase logic: question-driven discovery, then synthesis.

### Two engines, clear separation

VariScout uses two statistical engines with distinct roles:

| Engine          | Used for                                                      | Why                                                         |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| One-way ANOVA   | Boxplot factor display, per-factor η²                         | Fast, categorical-only, familiar to Six Sigma practitioners |
| Unified OLS/GLM | Best subsets, Evidence Map, What-If sliders, equation display | Handles mixed factor types, supports continuous prediction  |

The ANOVA panel in the Boxplot view uses the simpler engine. Factor Intelligence, the Evidence Map, and the What-If Prediction Profiler all use the unified engine. Both engines agree exactly for categorical-only data.

---

## Factor Type Detection

Before building any model, VariScout classifies each column as categorical or continuous. This classification drives how the factor appears in the model.

### Auto-detection heuristic

| Unique values | Column values      | Classification |
| ------------- | ------------------ | -------------- |
| ≤ 6           | Any                | Categorical    |
| 7–20          | Mix of integers    | Categorical    |
| > 20          | Numeric            | Continuous     |
| Any           | Non-numeric (text) | Categorical    |

The heuristic uses unique value count as the primary signal. A column with values `[1, 2, 3, 4]` is treated as categorical (4 machine heads), not continuous — unless overridden. A column with 25 distinct temperature readings is treated as continuous.

### Examples

| Column name | Sample values          | Auto-detected as |
| ----------- | ---------------------- | ---------------- |
| Machine     | A, B, C, D             | Categorical      |
| Shift       | Day, Night             | Categorical      |
| Head        | 1, 2, 3, 4             | Categorical      |
| Temperature | 163.2, 177.5, 182.1, … | Continuous       |
| Speed       | 7.5, 8.0, 8.5, 9.0, …  | Continuous       |
| Month       | Jan, Feb, Mar, …       | Categorical      |

### Override

The analyst can change the classification in the Column Mapping step. A date column auto-detected as categorical can be overridden to continuous (treating date as a time trend). A head number column (1–8) can stay categorical even though it looks numeric.

---

## Best Subsets Regression

Factor Intelligence uses **best subsets regression** to find which combination of factors best explains variation in the outcome.

### How it works

For _k_ factors, there are 2^k − 1 possible non-empty subsets. Best subsets evaluates all of them and reports the one (or few) with the highest R²adj. For k = 6 factors, that is 63 candidate models evaluated simultaneously.

The algorithm uses the **Furnival-Wilson leaps and bounds** method to avoid evaluating all subsets exhaustively. For small k (≤ 10 factors), the result is exact.

### Group constraint for categorical factors

A categorical factor with _m_ levels requires _m − 1_ dummy variables in the design matrix. Best subsets treats the entire set of dummy variables as a unit — a categorical factor either enters the model completely or not at all. This prevents nonsensical partial inclusion (e.g., including "Machine B" but not "Machine C").

### Selection criterion: R²adj

R²adj (adjusted R-squared) is the primary selection criterion:

```
R²adj = 1 − (1 − R²) × (n − 1) / (n − p − 1)
```

Where _n_ is the sample count and _p_ is the number of model parameters. R²adj penalizes model complexity — adding a weak factor reduces R²adj even if R² improves slightly. The best model maximizes R²adj, not R².

**Why not AIC or BIC?** R²adj is familiar to practitioners trained in Six Sigma and Minitab. It answers the analyst's natural question: "how much of the variation does this model explain?" directly. AIC and BIC answer a different question (relative model quality for prediction).

### Reading the Evidence Map

The Evidence Map shows factor nodes positioned by their R²adj contribution. Stronger factors appear closer to the center of the map. The size of each node reflects its unique contribution (partial η²). Nodes are colored by exploration status — grey for unexplored, colored once the analyst has drilled into that factor.

---

## The Regression Equation

When Factor Intelligence identifies the best model, VariScout computes the regression equation — the transfer function that predicts the outcome from factor values.

### Mixed equation form

For a model with one continuous factor (Temperature) and one categorical factor (Machine with levels A, B, C, D):

```
ŷ = β₀ + β₁ × Temperature + δ_B × [Machine=B] + δ_C × [Machine=C] + δ_D × [Machine=D]
```

Where:

- β₀ is the intercept (baseline: Machine=A at Temperature=0)
- β₁ is the slope for Temperature
- δ_B, δ_C, δ_D are the effects of Machine B, C, D relative to the reference level A
- [Machine=X] is 1 if Machine equals X, 0 otherwise

The reference level (Machine=A in this example) is the first category alphabetically. Its effect is captured in the intercept.

### Interpreting coefficients

**Continuous coefficient:** β₁ = 0.42 for Temperature means each additional 1°C raises the predicted outcome by 0.42 units. "Each 10°C increase adds ~4% yield."

**Categorical coefficient:** δ_B = −2.1 for Machine B means Machine B produces outcomes 2.1 units below the reference Machine A, holding Temperature constant.

### Two display modes

**Natural language view:** "Temperature has a strong positive effect (β = 0.42). Machine B underperforms the baseline by 2.1 units."

**Expanded math view:** Full equation with all coefficients and their standard errors. Toggle between views in the equation bar at the top of the Evidence Map.

---

## Quadratic Detection

For continuous factors, VariScout automatically tests whether a **quadratic term** improves the model. A quadratic term detects curvature — the presence of an optimum or a diminishing-returns relationship.

### What quadratic detection tells you

A linear model for Temperature: "More temperature → more yield (forever)."

A quadratic model: "Yield increases with temperature up to about 185°C, then decreases. There is an operating optimum."

### How the test works

For each continuous factor, VariScout fits two models:

1. Linear-only: ŷ = β₀ + β₁ × X
2. Linear + quadratic: ŷ = β₀ + β₁ × X + β₂ × X²

If adding the quadratic term improves R²adj by a meaningful margin, the quadratic term is retained. The centered form (X − X̄) is used to reduce numerical correlation between X and X².

### Operating window

When a quadratic term is detected, VariScout computes the **operating window** — the range of the continuous factor where predicted performance stays within ~1% of the optimum:

```
Optimum:        X* = −β₁ / (2 × β₂)
Operating window: [X* − δ, X* + δ]  where δ is the 1%-degradation radius
```

The What-If Profiler shows the operating window as a shaded band on the continuous slider. The **Sweet Spot card** summarizes: "Temperature optimum at 185°C, window 180–190°C."

### When quadratic detection is most useful

- Process optimization: finding the temperature, pressure, or speed that maximizes yield
- Process robustness: understanding how sensitive the process is to deviations from the optimum
- DOE planning: identifying the range worth exploring in a designed experiment

---

## Type III SS and Partial η²

When a model contains multiple factors, each factor's contribution must be computed **adjusted for all other factors** — this is Type III sum of squares (Type III SS).

### Why Type III matters

Consider a dataset where Machine and Shift are correlated (the night shift uses older machines). A naive ANOVA attributes too much variation to Machine and too little to Shift (or vice versa), depending on which factor is fitted first. Type III SS removes this order dependency: each factor's contribution is computed as the additional variance explained after all other factors are already in the model.

This is the correct approach for **unbalanced data** — real process data where not all combinations of factor levels appear equally often.

### Partial η²

Partial η² measures the fraction of the remaining variance that a factor explains after removing the contributions of all other factors:

```
Partial η² = SS_factor(Type III) / (SS_factor(Type III) + SS_residual)
```

In the Evidence Map, partial η² determines node size. A factor with partial η² = 0.45 explains 45% of the variance not explained by other factors — it deserves a large node.

### How this maps to the Evidence Map

| Metric                    | Node attribute       | Meaning                                           |
| ------------------------- | -------------------- | ------------------------------------------------- |
| R²adj (best subsets)      | Node radial position | How close to center; stronger factors are central |
| Partial η²                | Node size            | Relative importance within the fitted model       |
| p-value (Type III F-test) | Evidence badge color | Statistical confidence (strong/moderate/weak)     |

---

## Guardrails

The regression engine includes automatic warnings for conditions that can mislead interpretation.

### Extrapolation warning

Prediction is reliable within the range of observed data. VariScout warns when a What-If slider is moved outside the observed range for a continuous factor:

> "Temperature 210°C is outside the observed range (163–198°C). Predictions in this region are extrapolations and may be unreliable."

The warning appears as an amber indicator on the slider. The model still produces a prediction, but the analyst is informed that the linear (or quadratic) relationship may not hold beyond the data.

### VIF — Variance Inflation Factor

**VIF** detects multicollinearity: when two or more factors are highly correlated with each other, individual coefficient estimates become unstable (large standard errors), even if the model as a whole fits well.

```
VIF_j = 1 / (1 − R²_j)
```

Where R²_j is the R² from regressing factor j on all other factors.

| VIF value | Interpretation                                                  |
| --------- | --------------------------------------------------------------- |
| 1–5       | Acceptable                                                      |
| 5–10      | Moderate concern — interpret individual coefficients cautiously |
| > 10      | High multicollinearity — factor estimates are unreliable        |

VariScout shows VIF in the Factor Intelligence panel for each factor. A VIF > 10 triggers a warning: "Machine and Shift are highly correlated (VIF = 12.4). Individual effects may be unreliable. Consider collecting data with more varied combinations."

### Low R² warning

When the best model explains less than 30% of variation (R²adj < 0.30), VariScout shows a guidance prompt:

> "The identified factors explain only 24% of variation. Important factors may be missing. Consider: Are there factors not captured in this dataset? Is the data time-ordered correctly?"

Low R² is not an error — it is informative. Many real processes have unexplained variation that requires gemba observation or expert knowledge to explain. The Evidence Map's investigation layer (Layer 2) is specifically designed to capture this complementary evidence.

### Overfitting check

A large gap between R² and R²adj indicates overfitting — the model fits the noise in the current sample rather than the true pattern:

```
Overfitting indicator = R² − R²adj > 0.10
```

This typically appears when there are many factors relative to the number of observations (k > n/10). The warning suggests collecting more data or reducing the factor count.

---

## What-If Prediction

The **Prediction Profiler** (What-If simulator) uses the fitted regression model to answer: "If I change this factor, what happens to the outcome?"

### Continuous sliders

For continuous factors, the profiler shows a response curve — how the predicted outcome changes as the factor value changes, with all other factors held constant at their current settings.

The slider covers the observed range (extrapolation warning outside). The response curve shows:

- The predicted value (blue line)
- The 95% prediction interval (grey band)
- The current operating point (filled dot)
- The scenario point (empty dot, dragged by the analyst)
- The operating window for quadratic factors (shaded region)

### Categorical selectors

For categorical factors, the profiler shows a dot plot — one dot per level, showing the predicted outcome if that level is selected. The current level is filled; others are empty.

### Cpk impact

The What-If profiler also projects how a change will affect Cpk — combining the regression-predicted mean shift with the variance model:

```
Projected Cpk = min(
  (USL − projected_mean) / (3 × σ_within),
  (projected_mean − LSL) / (3 × σ_within)
)
```

This gives the analyst a direct link between factor settings and process capability: "Setting Temperature to 185°C and switching to Supplier A is projected to improve Cpk from 0.82 to 1.24."

### Current vs. scenario comparison

The profiler shows two states side-by-side:

- **Current settings**: the factor values observed in the dataset
- **Scenario settings**: the analyst's proposed changes

Both states show predicted outcome, Cpk, and estimated yield. The delta is shown in green (improvement) or red (degradation).

---

## Validation

The regression engine is validated against **NIST Statistical Reference Datasets (StRD)** — a standard set of benchmark datasets with certified reference values computed to 15 significant digits.

### Datasets used

| Dataset | Type                                  | VariScout accuracy    |
| ------- | ------------------------------------- | --------------------- |
| Norris  | Simple linear regression              | 9+ significant digits |
| Pontius | Quadratic regression                  | 9+ significant digits |
| Longley | Multiple regression (ill-conditioned) | 9+ significant digits |

The Longley dataset is deliberately ill-conditioned (highly correlated predictors) and is the standard test for numerical stability. VariScout uses QR decomposition (Householder reflections) to achieve accurate results even on this dataset.

### Mathematical equivalence with ANOVA

For categorical-only data (no continuous factors), the unified GLM engine produces results mathematically equivalent to one-way ANOVA. The cell-means model from ANOVA and the dummy-coded GLM are the same model expressed differently. This means that Factor Intelligence rankings computed by the GLM engine agree with the η² values shown in the ANOVA panel (within floating-point precision).

### Why QR decomposition

The regression solver uses QR decomposition rather than the normal equations (X'X)⁻¹X'y. The normal equations involve squaring the condition number of the design matrix — for correlated factors, this can amplify numerical errors dramatically. QR decomposition is numerically stable even for near-singular design matrices.

---

## References

| Topic                            | Source                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Best subsets regression          | NIST/SEMATECH e-Handbook of Statistical Methods, Section 4.6                                           |
| Furnival-Wilson leaps and bounds | Furnival, G.M. & Wilson, R.W. (1974). "Regressions by Leaps and Bounds." _Technometrics_ 16(4):499–511 |
| Type III SS                      | Montgomery, D.C. (2017). _Design and Analysis of Experiments_, 9th ed., Chapter 8                      |
| VIF and multicollinearity        | Belsley, Kuh & Welsch. _Regression Diagnostics_ (1980). Wiley.                                         |
| NIST StRD benchmark              | NIST Statistical Reference Datasets, https://www.itl.nist.gov/div898/strd/                             |
| Minitab Best Subsets             | Minitab 21 documentation — Best Subsets Regression                                                     |
| JMP Prediction Profiler          | JMP 17 documentation — The Prediction Profiler                                                         |
| QR decomposition                 | Golub, G.H. & Van Loan, C.F. (2013). _Matrix Computations_, 4th ed., Chapter 5                         |

---

## Cross-references

| Topic                                 | Document                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| ANOVA and η² (one-factor analysis)    | [Variation Decomposition](variation-decomposition.md)                        |
| Factor Intelligence ranking           | [Factor Intelligence](factor-intelligence.md)                                |
| Evidence Map spatial layout           | [Evidence Map](../../superpowers/specs/2026-04-05-evidence-map-design.md)    |
| What-If Simulator (direct adjustment) | [Investigation to Action](../workflows/investigation-to-action.md)           |
| Implementation reference              | [Statistics Technical Reference](../../05-technical/statistics-reference.md) |
| ADR decision record                   | [ADR-067](../../07-decisions/adr-067-unified-glm-regression.md)              |
