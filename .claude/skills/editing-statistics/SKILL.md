---
name: editing-statistics
description: Use when editing packages/core/src/stats/ or statistical computation code. Three-boundary numeric safety (ADR-069), safeMath.ts, two-pass best subsets with interaction screening (ADR-067), NIST validation expectations, OLS regression via QR solver, ANOVA metrics (ADR-062), design matrices. Stats functions must return number | undefined, never NaN.
---

# Editing Statistics

## When this skill applies

Triggered when editing `packages/core/src/stats/` or any statistical computation code in `@variscout/core`.
Covers numeric safety contracts, the OLS/GLM engine, best subsets, interaction screening, design matrices, and ANOVA metrics.

---

## Three-boundary numeric safety (ADR-069)

The stats engine enforces a three-boundary architecture between raw data and user display:

```
Raw Data → [B1: Input] → Clean Data → [Stats Engine] → [B2: Output] → Safe Results → [B3: Display] → User
```

### Boundary 1 — Input sanitization (B1)

**Invariant:** No NaN or Infinity enters the stats engine from the parser.

`toNumericValue()` in `packages/core/src/types.ts` rejects any non-finite value at parse time using
`isFinite() && !isNaN()`. B1 already existed before ADR-069 and is the first line of defense.

### Boundary 2 — Stats engine output (B2)

**Invariant:** Stats functions return `number | undefined`, never `NaN` or `Infinity`.

All stats functions apply `safeMath.ts` primitives at return boundaries. When a computation would produce
a non-finite result (e.g., division by zero, degenerate data), the function returns `undefined` rather
than propagating NaN downstream.

**Exception:** `andersonDarlingTest()` intentionally returns `{ statistic: Infinity, pValue: 0 }` for
degenerate data (all values identical). Consumers of that function must handle this explicitly.

Applied to: ANOVA, best subsets, factor effects, Type III SS, Evidence Map layout, OLS solver boundaries.

### Boundary 3 — Display formatting (B3)

**Invariant:** `undefined` and non-finite values are formatted as "—", never rendered as `NaN` or blank.

`formatStatistic()` from `@variscout/core/i18n` returns "—" for non-finite values. All `.toFixed()` calls
on statistical values in UI and AI code are guarded with `Number.isFinite()`. An ESLint `no-restricted-syntax`
rule warns on unguarded `.toFixed()` in UI/AI paths to prevent regression.

### safeMath.ts primitives

File: `packages/core/src/stats/safeMath.ts`

These three functions are the only exports — verify the actual file, as ADR-069 text and the template spec
both listed functions that do not exist (`safeSqrt`, `safeLog`):

| Function | Signature | Purpose |
|---|---|---|
| `finiteOrUndefined` | `(n: number) => number \| undefined` | Converts any non-finite number to `undefined`. Applied at function return boundaries. |
| `safeDivide` | `(numerator, denominator, minDenom?) => number \| undefined` | Guards division against zero/near-zero/non-finite denominators. Default `minDenom = 1e-15`. |
| `computeOptimum` | `(linearCoefficient, quadCoefficient, quadMean) => number \| undefined` | Single source of truth for quadratic vertex formula `x* = x̄ − β₁/(2·β₂)`. Used by `evidenceMapLayout.ts` and `buildAIContext.ts`. |

Use `safeDivide` for **any** division where the denominator could be zero or near-zero. Use
`finiteOrUndefined` at return boundaries of stats functions that perform complex arithmetic. Use
`computeOptimum` whenever you need the sweet-spot (optimum X*) from a centered quadratic model — do not
duplicate this formula.

---

## Two-pass best subsets with interaction screening (ADR-067)

### Background

The OLS/GLM engine replaces the old categorical-only cell-means ANOVA engine for **factor ranking** (best
subsets, Factor Intelligence, Evidence Map node positioning). The simpler `calculateAnova()` is retained
for single-factor boxplot display — two engines with distinct roles, both intentional.

### Pass 1 — Main-effects enumeration

**File:** `packages/core/src/stats/bestSubsets.ts`

Evaluates all `2^k − 1` non-empty subsets of factor groups and selects the best model by R²adj. Categorical
factors enter as a unit (all `m − 1` dummy-coded columns together), so enumeration is over factor groups,
not individual predictor columns.

- Selection criterion: adjusted R² (R²adj)
- Exact algorithm for `k ≤ 10` factors (1023 models); stepwise fallback for `k > 10`
- In practice, tier limits (6 factors for Azure) mean the exact algorithm is always used
- Benchmarked against Minitab Best Subsets output

### Pass 2 — Interaction screening among Pass 1 winners

**File:** `packages/core/src/stats/interactionScreening.ts`

After Pass 1 identifies the best main-effects model, Pass 2 screens all factor pairs **among the Pass 1
winner factors** for two-way interaction effects via partial F-test (α = 0.10). This hierarchical
constraint is load-bearing — do not change it without an ADR update.

Efficiency example: for k = 6 with 3 winners → 69 OLS solves total (63 Pass 1 + 6 Pass 2) versus
2,097,151 for full interaction enumeration.

Handles all three factor-pair types:

| Type | Description |
|---|---|
| `cont×cont` | Two continuous factors — product term `(x₁ − x̄₁)(x₂ − x̄₂)` |
| `cont×cat` | Continuous × categorical — one product column per non-reference level |
| `cat×cat` | Two categorical — product of indicator columns, one per level-pair |

Interaction column construction is in `packages/core/src/stats/designMatrix.ts` (see `FactorEncoding.type === 'interaction'`).

### Interaction pattern classification

Each significant interaction is classified using geometric terminology:

| Pattern | Meaning | Geometric test |
|---|---|---|
| `'ordinal'` | Gap between groups changes in magnitude; ranking of groups is stable across the other factor's levels | Lines differ in slope but do not cross |
| `'disordinal'` | Ranking of groups reverses across the other factor's levels | Lines cross within the observed factor range |

**Terminology rule:** Use `'ordinal'` and `'disordinal'` in all code identifiers, comments, docs, and
CoScout prose. Never use "moderator", "primary role", or "interaction moderator" — these are banned per
user feedback. Pattern classification is exported as `classifyInteractionPattern()` from
`interactionScreening.ts`.

### Exported functions from interactionScreening.ts

| Function | Purpose |
|---|---|
| `screenInteractionPair` | Partial F-test for one factor pair; returns `InteractionScreenResult` |
| `classifyInteractionPattern` | Ordinal vs. disordinal classification from slope data |
| `assignPlotAxes` | Axis assignment convention for interaction plots (continuous on X, or more levels on X) |

---

## Design matrix construction

**File:** `packages/core/src/stats/designMatrix.ts`

`buildDesignMatrix()` converts `DataRow[]` into a column-major `Float64Array[]` design matrix. Column
layout:

```
[0]        intercept (all 1s)
[1..k-1]   indicator columns for factor 1 (categorical, k-1 reference coding)
            or centered continuous value + optional (x − x̄)² quadratic column
...         repeated per factor in declaration order
```

Key encoding rules:
- **Categorical reference coding:** most-frequent level omitted as reference; alphabetical tie-breaking
- **Continuous centering:** values entered as `(x − x̄)` to reduce multicollinearity
- **Quadratic terms:** centered as `(x − x̄)²`, appended after the linear column
- **Interaction columns:** `FactorEncoding.type === 'interaction'` with `sourceFactors` and
  `interactionType` fields; product of the two source columns, both centered where applicable
- **Missing values:** rows with non-finite values in any predictor are excluded; valid row indices
  tracked in `DesignMatrixResult.validRowIndices`

---

## OLS regression and NIST validation

**File:** `packages/core/src/stats/olsRegression.ts`

`solveOLS()` uses Householder-reflection QR decomposition — numerically stable for ill-conditioned
problems. All internal storage uses `Float64Array` (IEEE 754 double precision). Column-major input
`X[col][row]` matches the design matrix convention.

Key exports:

| Export | Purpose |
|---|---|
| `solveOLS(X, y)` | Full OLS solution: coefficients, SE, t-stats, p-values, residuals, R², R²adj, F-stat |
| `shouldIncludeQuadratic(data, factorCol, outcomeCol, alpha?)` | Partial F-test for quadratic term; returns `QuadraticTestResult` |

### NIST validation

**Test file:** `packages/core/src/stats/__tests__/olsRegression.nist.test.ts`

Note: ADR-067 references `nist.test.ts` — that path does not exist. The actual test file is
`olsRegression.nist.test.ts`. The test validates against NIST StRD certified datasets:

- **Norris** (2 params, 36 obs, lower difficulty)
- **Pontius** (3 params, 40 obs, lower difficulty, quadratic)
- **Longley** (7 params, 16 obs, higher difficulty, ill-conditioned multicollinearity)

Target: match certified values to at least 9 significant digits. This is the same validation standard used
by Minitab and JMP.

---

## ANOVA metrics (ADR-062)

### Standardized output metrics

| Metric | Role | Where used |
|---|---|---|
| R²adj (best subsets) | Factor ranking — how much outcome variation each factor combination explains | Factor Intelligence, Evidence Map node positioning, question generation |
| η² (eta-squared) | Effect size — factor's contribution relative to total variation | ANOVA compact table in PI Panel |
| F-statistic + p-value | Overall model significance | ANOVA compact table |

η² formula: `η² = SS_between / SS_total`. For multi-factor models, partial η² is preferred:
`partial η² = SS_factor(Type III) / (SS_factor + SS_residual)`.

### What was removed (do not reintroduce)

**Category Total SS %** was a custom VariScout metric that combined between-group and within-group SS per
category, summing to 100% across all categories. It was removed in ADR-062 because:

1. R²adj from best subsets already provides statistically rigorous factor ranking
2. It could not be cross-validated against Minitab or JMP
3. Two overlapping "contribution" metrics created confusion for Six Sigma analysts

Do not reintroduce `scopeFraction`, `cumulativeScope`, `useVariationTracking`, or VariationBar.

### Contribution framing (not causation)

ANOVA, regression, and best subsets report **effect sizes** (η², R²adj, Type III SS). They describe which
factors **contribute** to explaining outcome variation in the observed data. They do not establish causal
proof. Use "contribution" in all statistical prose, comments, identifiers, and CoScout responses. Never
use "root cause" — that framing implies causality that EDA cannot establish.

### Question auto-validation thresholds

These thresholds are grounded in standard η² conventions and were unchanged by ADR-062:
- η² ≥ 15% → question answered
- η² < 5% → factor ruled out

---

## Gotchas

- **Stats functions must return `number | undefined` — never NaN or Infinity.** Tests assert finite
  values. Apply `finiteOrUndefined` at return boundaries and `safeDivide` for any division where the
  denominator could be zero or near-zero. Returning NaN silently breaks chart rendering (visx drops NaN
  SVG attributes with no error).

- **Never use `Math.random` in stats tests.** It makes tests flaky under concurrent test runs. Use a
  deterministic PRNG instead. See `packages/core/src/stats/__tests__/interactionScreening.test.ts` for
  the pattern: `(((i * 7919 + 104729) % 1000) / 1000 - 0.5) * scale`.

- **Never call `.toFixed()` on stat values inside stats code.** That violates the B2 contract — stats
  code produces `number | undefined`, not formatted strings. Consumers format via `formatStatistic()`
  from `@variscout/core/i18n`. For internal computation strings (e.g., equation builder), guard with
  `Number.isFinite()` first.

- **Never use "root cause" in statistical prose, identifiers, or CoScout coaching text.** ANOVA and
  regression show contribution to explaining variation, not causal proof. Use "contribution" and
  "effect size" instead.

- **Never label interaction patterns as "moderator" or "primary".** Use the geometric terms `'ordinal'`
  (ranking stable, gap changes) and `'disordinal'` (ranking reverses, lines cross). This applies to code
  identifiers, comments, and any generated prose. These are the terms exported in `InteractionScreenResult.pattern`.

- **Pass 2 interaction screening only tests pairs among Pass 1 winners** — not all possible factor pairs.
  This hierarchical constraint is fundamental to the algorithm's efficiency and matches the Minitab
  convention. Do not add full-enumeration interaction screening without an ADR update.

---

## Reference

- [ADR-067: Unified GLM Regression Engine](../../docs/07-decisions/adr-067-unified-glm-regression.md) — two-pass best subsets, OLS, design matrix
- [ADR-069: Three-Boundary Numeric Safety](../../docs/07-decisions/adr-069-three-boundary-numeric-safety.md) — B1/B2/B3 architecture
- [ADR-062: Standard ANOVA Metrics](../../docs/07-decisions/adr-062-standard-anova-metrics.md) — η² standardization, Category Total SS % removal
- [Statistics Reference](../../docs/05-technical/statistics-reference.md) — formulas, algorithm choices, two-sigma model
- `packages/core/src/stats/safeMath.ts` — B2 utility functions (3 exports: `finiteOrUndefined`, `safeDivide`, `computeOptimum`)
- `packages/core/src/stats/bestSubsets.ts` — Pass 1 orchestration and `predictFromUnifiedModel`
- `packages/core/src/stats/interactionScreening.ts` — Pass 2 screening and pattern classification
- `packages/core/src/stats/designMatrix.ts` — interaction column construction, reference coding
- `packages/core/src/stats/olsRegression.ts` — QR solver, quadratic detection
- `packages/core/src/stats/__tests__/olsRegression.nist.test.ts` — NIST Longley/Norris/Pontius validation
  (ADR-067 references `nist.test.ts` — that path does not exist; actual file is `olsRegression.nist.test.ts`)
