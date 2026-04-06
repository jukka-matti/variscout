---
title: 'Statistics & Investigation Technical Reference'
---

# Statistics & Investigation Technical Reference

Exact formulas, algorithm choices, and implementation notes for the VariScout statistical engine and the Investigation & Findings system.

---

## Audience & Conventions

**For**: developers extending the codebase, statisticians validating methods, auditors checking conformance.

**Source references**: each section cites the implementation file as `package/path/file.ts`. Function signatures use TypeScript notation.

**Formula notation**: LaTeX-style inline (`σ`, `Σ`, `η²`). Greek letters are spelled out in code (`sigmaWithin`, `etaSquared`).

**Not covered here**: user-facing chart interactions, UI component APIs, design system colors. See `docs/03-features/analysis/` for user documentation and `docs/06-design-system/charts/` for chart component rules.

---

## Data Model

VariScout operates on **individual measurements** (subgroup size n = 1). Every row is a single observation with:

- One **outcome** column (numeric measurement)
- Zero or more **factor** columns (categorical grouping variables)
- Optionally a **stage** column (time period or batch identifier)

Data must be in **time/production order** for moving-range calculations to be meaningful. Shuffled data inflates MR-bar and overestimates σ_within.

---

## Part 1 — Core Statistics

> Source: `packages/core/src/stats/basic.ts`
> User docs: [I-Chart](../03-features/analysis/i-chart.md), [Capability](../03-features/analysis/capability.md)

### Central Tendency

| Statistic | Formula                     | Implementation    |
| --------- | --------------------------- | ----------------- |
| Mean      | x̄ = (1/n) Σ xᵢ              | `d3.mean(data)`   |
| Median    | Middle value of sorted data | `d3.median(data)` |

Both are computed from the full (unfiltered within current scope) dataset.

### Dispersion — Two Sigmas

VariScout maintains **two** standard deviation estimates. The choice of which to use depends on the purpose:

| Sigma     | Symbol        | Formula                          | Used for                                               |
| --------- | ------------- | -------------------------------- | ------------------------------------------------------ |
| σ_overall | `stdDev`      | Sample std dev (n−1 denominator) | ANOVA SS decomposition, general descriptive statistics |
| σ_within  | `sigmaWithin` | MR-bar / d2                      | Control limits, Cp, Cpk                                |

**σ_overall** — computed via `d3.deviation(data)`, the unbiased sample standard deviation:

```
σ_overall = sqrt( Σ(xᵢ - x̄)² / (n - 1) )
```

**σ_within** — estimated from the mean moving range (I-MR / Individuals chart method):

```
MR_i = |x_i - x_{i-1}|        for i = 2, ..., n
MR-bar = (1/(n-1)) Σ MR_i
σ_within = MR-bar / d2         where d2 = 1.128
```

The constant **d2 = 1.128** is the Hartley unbiasing constant for a moving range with span 2. Since VariScout always uses individual measurements (n = 1), the span is always 2 and d2 is fixed.

**Why two sigmas?** σ*within captures short-term, inherent process variation — the variation between consecutive measurements. It excludes between-subgroup shifts. This makes it the correct denominator for Shewhart control limits and capability indices (Wheeler, \_Understanding Variation*). σ_overall includes all sources of variation and is used for ANOVA, where both within-group and between-group variation matter.

**Edge case**: when `data.length < 2`, the moving range cannot be computed. The implementation falls back to `d3.deviation(data)` for σ_within and returns `mrBar = 0`.

### Control Limits (I-Chart)

```
UCL = x̄ + 3 × σ_within
LCL = x̄ - 3 × σ_within
```

These are the natural process limits (Shewhart 3-sigma limits). Points outside these limits signal special-cause variation. The limits use σ_within (not σ_overall) because they measure the expected range of short-term variation.

### Process Capability

> Source: `packages/core/src/stats/basic.ts` — `calculateStats()`
> User docs: [Capability](../03-features/analysis/capability.md)

Capability indices require user-supplied specification limits (USL, LSL, or both).

**Cp** — process potential (spread vs tolerance width):

```
Cp = (USL - LSL) / (6 × σ_within)
```

Requires both USL and LSL. Undefined when σ_within = 0 (all values identical).

**Cpk** — process capability (centering + spread):

```
Cpu = (USL - x̄) / (3 × σ_within)
Cpl = (x̄ - LSL) / (3 × σ_within)
Cpk = min(Cpu, Cpl)
```

Can be computed with only one limit (one-sided). Undefined when σ_within = 0.

**Interpretation**: Cpk ≥ 1.33 is generally considered capable (AIAG standard). A process with Cpk = 1.0 has its mean exactly 3σ from the nearest limit.

**Edge cases**:

- σ_within = 0 → Cp and Cpk are `undefined` (not Infinity)
- Single limit → Cp is `undefined`, Cpk is one-sided
- Empty data → zero-filled StatsResult with no capability indices

### Conformance

> Source: `packages/core/src/stats/conformance.ts`

```typescript
calculateConformance(values: number[], usl?: number, lsl?: number): ConformanceResult
```

Counts pass/fail against specification limits. USL failure takes priority — a value above USL is counted as `failUsl` even if LSL also exists. Pass rate is `(pass / total) × 100`.

---

## Part 2 — One-Way ANOVA

> Source: `packages/core/src/stats/anova.ts`
> User docs: [Variation Decomposition](../03-features/analysis/variation-decomposition.md)

### Full SS Decomposition

For a factor with _k_ groups, each of size _nᵢ_, total sample size _N = Σ nᵢ_:

```
SS_total   = Σ (x_ij - x̄)²              where x̄ is the grand mean
SS_between = Σ nᵢ × (x̄ᵢ - x̄)²          between-group sum of squares
SS_within  = Σ (nᵢ - 1) × s²ᵢ           within-group sum of squares
```

Note: SS_within is computed from per-group sample variances, not as SS_total − SS_between. This avoids floating-point accumulation errors.

### Degrees of Freedom

```
df_between = k - 1
df_within  = N - k
```

### F-Statistic and p-Value

```
MS_between = SS_between / df_between
MS_within  = SS_within / df_within
F = MS_between / MS_within
p = P(F > f | df_between, df_within)    via fDistributionPValue()
```

### Eta-Squared (Effect Size)

```
η² = SS_between / (SS_between + SS_within)
```

Interpretation ranges (Cohen's conventions):

- 0.01–0.06: small effect
- 0.06–0.14: medium effect
- \> 0.14: large effect

### Significance

Alpha = 0.05 (hard-coded). `isSignificant = pValue < 0.05`.

### Insight Generation

The `generateAnovaInsight()` function produces a plain-English summary:

- Not significant → "No significant difference between groups"
- Significant + lower-is-better keywords (time, defect, error, reject, delay, cost, waste) → names the lowest-mean group as "best"
- Significant + higher-is-better → names the highest-mean group as "best"

### Guard Clauses

Returns `null` when:

- Fewer than 2 groups
- Total N < 3
- df_within = 0 (every group has exactly 1 observation)

---

## Part 3 — Distribution Functions

> Source: `packages/core/src/stats/distributions.ts` (internal, not re-exported from package)

These are used by ANOVA and probability calculations. They are not exported from `@variscout/core` — they are internal to the stats module.

### Normal PDF

```
φ(x) = exp(-0.5 × x²) / √(2π)
```

Standard normal density. Used in probability plot SE calculations.

### Log-Gamma (Lanczos Approximation)

```
ln Γ(x)    using g = 7, 9-term Lanczos series
```

For x < 0.5, uses the reflection formula: `ln(π / sin(πx)) − ln Γ(1 − x)`.

### Regularized Incomplete Beta

```
I_x(a, b) = B(x; a, b) / B(a, b)
```

Computed via Lentz's continued fraction algorithm (max 200 iterations, ε = 1e-10). Near-zero values floored at 1e-30 to prevent division by zero.

### F-Distribution p-Value

```
P(F > f | df1, df2) = I_x(df2/2, df1/2)    where x = df2 / (df2 + df1 × f)
```

Returns 1 for f ≤ 0, returns 0 for non-finite f.

### t-Distribution p-Value

Two-tailed: delegates to `fDistributionPValue(t², 1, df)` using the F-t equivalence.

---

## Part 4 — Normal Quantile (Inverse CDF)

> Source: `packages/core/src/stats/probability.ts` — `normalQuantile()`

Acklam's rational approximation — a three-region piecewise function:

| Region     | Range                 | Method                                         |
| ---------- | --------------------- | ---------------------------------------------- |
| Lower tail | p < 0.02425           | `q = √(-2 ln p)`, rational 6/4 polynomial in q |
| Central    | 0.02425 ≤ p ≤ 0.97575 | `r = p - 0.5`, rational 6/5 polynomial in r    |
| Upper tail | p > 0.97575           | Symmetric to lower tail via 1−p                |

Accuracy: ~1e-9 (sufficient for all SPC applications). Returns −∞ for p ≤ 0, +∞ for p ≥ 1, 0 for p = 0.5.

---

## Part 5 — Probability Plot

> Source: `packages/core/src/stats/probability.ts` — `calculateProbabilityPlotData()`
> User docs: [Probability Plot](../03-features/analysis/probability-plot.md)

### Median Rank (Benard's Approximation)

For sorted data points i = 1, ..., n:

```
p_i = (i - 0.3) / (n + 0.4)
```

This is the Benard median-rank formula, the default in Minitab. It provides an unbiased estimate of the cumulative probability for each order statistic.

### Z-Score

```
z_i = Φ⁻¹(p_i)    via normalQuantile()
```

### Standard Error of Percentile

```
SE_i = (σ × √(p_i × (1 - p_i) / n)) / φ(z_i)
```

Where φ is the standard normal PDF. Capped at `σ × 10` to prevent explosion at extreme percentiles where φ(z) approaches zero.

### 95% Confidence Interval

```
lower_i = x_i - 1.96 × SE_i
upper_i = x_i + 1.96 × SE_i
```

### Preprocessing

Non-numeric, NaN, and Infinity values are filtered before computation. Data is sorted ascending.

---

## Part 6a — Nelson Rule 2

> Source: `packages/core/src/stats/nelson.ts`
> User docs: [Nelson Rules](../03-features/analysis/nelson-rules.md)

### Definition

**9 or more consecutive points on the same side of the center line** — a signal of systematic process shift.

### Algorithm

Single-pass scan with run tracking:

1. Initialize `runStart = 0`, `runSide = null`
2. For each point, determine its side: `'above'` if value > mean, `'below'` if value < mean, `null` if exactly equal
3. If side differs from `runSide` or side is `null`: check completed run (if ≥ 9 points, record), reset run
4. After loop, check the final run
5. Points exactly equal to the mean break the current run (conservative interpretation)

### Exports

Two functions provide different output formats:

| Function                          | Returns                                 | Use case                       |
| --------------------------------- | --------------------------------------- | ------------------------------ |
| `getNelsonRule2ViolationPoints()` | `Set<number>` of indices                | Point-level violation coloring |
| `getNelsonRule2Sequences()`       | `Array<{ startIndex, endIndex, side }>` | Segment highlight rendering    |

Returns empty results for arrays with fewer than 9 values.

---

## Part 6b — Nelson Rule 3

> Source: `packages/core/src/stats/nelson.ts`
> User docs: [Nelson Rules](../03-features/analysis/nelson-rules.md)

### Definition

**6 or more consecutive strictly increasing or decreasing values** — a signal of a sustained trend (drift) in the process. This rule is distinct from Rule 2 (same-side runs): Rule 3 detects monotonic direction, not deviation from the mean.

### Algorithm

Single-pass scan with direction tracking:

1. Initialize `runStart = 1`, `currentDirection = null`, `runLength = 1`
2. For each consecutive pair (i−1, i), compute `delta = x_i - x_{i-1}`
3. Determine step direction: `'up'` if `delta > 0`, `'down'` if `delta < 0`, `null` if `delta === 0`
4. If step direction matches `currentDirection`: increment `runLength`
5. If step direction differs (including equal values, which break the trend): check completed run (if `runLength ≥ 6`, record all points in the run), reset with new direction and `runLength = 2` (the current pair starts a new candidate run)
6. After loop, check the final open run

### Edge Cases

- **Equal consecutive values** (`delta === 0`) break the current trend run — a plateau is not a trend in either direction.
- **Exactly 6** consecutive strictly monotonic values is the minimum qualifying run.
- **Overlapping runs** are not possible since each point belongs to at most one run at a time; a new run begins only after the previous direction changes.
- Returns empty results for arrays with fewer than 6 values.

### Exports

Two functions provide different output formats, matching the Rule 2 API:

| Function                          | Returns                                                                 | Use case                       |
| --------------------------------- | ----------------------------------------------------------------------- | ------------------------------ | --------------------- |
| `getNelsonRule3ViolationPoints()` | `Set<number>` of indices                                                | Point-level violation coloring |
| `getNelsonRule3Sequences()`       | `Array<{ startIndex, endIndex, direction }>` where `direction` is `'up' | 'down'`                        | Trend arrow rendering |

---

## Part 7 — Boxplot Statistics

> Source: `packages/core/src/stats/boxplot.ts`
> User docs: [Boxplot](../03-features/analysis/boxplot.md)

### Five-Number Summary

Input values are sorted ascending. Then:

| Statistic | Formula                                         |
| --------- | ----------------------------------------------- |
| Median    | Exact midpoint (even n) or middle value (odd n) |
| Q1        | Linear interpolation at index `(n−1) × 0.25`    |
| Q3        | Linear interpolation at index `(n−1) × 0.75`    |
| IQR       | Q3 − Q1                                         |

### Outlier Detection (Tukey)

```
Lower fence = Q1 - 1.5 × IQR
Upper fence = Q3 + 1.5 × IQR
```

Values strictly outside the fences are classified as outliers. Whiskers extend to the fence values (not to the most extreme non-outlier).

### Sorting

`sortBoxplotData()` sorts an array of boxplot groups without mutation:

| `sortBy`           | Sort key                         |
| ------------------ | -------------------------------- |
| `'name'` (default) | `localeCompare()` — alphabetical |
| `'mean'`           | Numeric mean comparison          |
| `'spread'`         | IQR comparison                   |

Direction: `'asc'` (default) or `'desc'`.

---

## Part 8 — Kernel Density Estimation

> Source: `packages/core/src/stats/kde.ts`

### Bandwidth Selection (Silverman's Rule)

```
h = 0.9 × min(σ, IQR/1.34) × n^(-1/5)
```

The `min(σ, IQR/1.34)` term is a robust spread estimator resistant to outliers. If only one spread measure is available, the other is used alone. Returns empty result if h ≤ 0 or n < 2.

### Gaussian Kernel

```
K(u) = exp(-0.5 × u²)
```

Unnormalized in the loop; the sum is divided by `n × h × √(2π)` for proper normalization.

### Evaluation Grid

- Default: 100 points
- Range: `[min - 3h, max + 3h]` — extends 3 bandwidths beyond data range (matches the R/ggplot2 `cut=3` default)
- Output format: `{ value: x, count: density }` — compatible with `@visx/stats` ViolinPlot

---

## Part 9 — Staged Analysis

> Source: `packages/core/src/stats/staged.ts`
> User docs: [Staged Analysis](../03-features/analysis/staged-analysis.md)

### Stage Order Detection

`determineStageOrder(stageValues, mode?)`:

| Mode               | Behavior                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'data-order'`     | First-occurrence order (no sorting)                                                                                                                                                    |
| `'auto'` (default) | If all values match numeric patterns (`/^\d+(\.\d+)?$/` or `/^(stage\|phase\|batch\|period\|run)?\s*\d+$/i`), sorts numerically by embedded number. Otherwise, first-occurrence order. |

### Per-Stage Statistics

`calculateStatsByStage()` calls `calculateStats()` independently for each stage, producing separate UCL, LCL, Cp, Cpk per stage. Also computes `overallStats` across all values combined.

Returns `null` for empty data, empty stage order, or if no stage contains any data.

### Stage Boundaries

`getStageBoundaries()` maps sorted chart data points to stage x-axis extents for rendering. Returns `{ name, startX, endX, stats }` per non-empty stage, using `safeMin`/`safeMax` iterative min/max (avoids `Math.min(...spread)` stack overflow on large arrays).

---

## Part 10 — Variation Decomposition

> Source: `packages/core/src/variation/contributions.ts`
> User docs: [Variation Decomposition](../03-features/analysis/variation-decomposition.md)

### Factor-Level Effect Size

η² (eta-squared) is the standard metric for factor-level variation attribution:

```
η² = SS_between / SS_total
```

η² measures the proportion of total variance explained by between-group mean differences. A high η² indicates a factor whose category means differ substantially — the primary criterion for factor ranking in Factor Intelligence.

For within-group spread, the boxplot StdDev column in the group statistics table is the appropriate complement: it quantifies how consistent each category is independently of its mean position.

### Category Stats

`getCategoryStats()` returns per-category detail: count, mean, stdDev (population). Sorted by mean deviation from overall mean (descending). Used by the What-If Simulator.

---

## Part 11 — Drill-Down & Factor Exploration

> Source: `packages/core/src/variation/drill.ts`, `packages/hooks/src/useDrillPath.ts`

### Factor Exploration Order

Drill-down uses Factor Intelligence R²adj to guide factor exploration order. The Factor Intelligence engine (Best Subsets for standard mode, waste % for Yamazumi mode) ranks factors so analysts investigate the highest-impact ones first.

Filter chips show sample count (`n=X`) for the filtered subset, giving the analyst an immediate read on how many observations remain after each drill step.

### Drill Path Statistics (useDrillPath hook)

The `useDrillPath` hook retrospectively computes drill path statistics by iterating the filter stack:

```typescript
interface DrillStep {
  factor: string;
  values: (string | number)[];
  meanBefore: number; // mean before this filter applied
  meanAfter: number; // mean after this filter applied
  cpkBefore: number | undefined;
  cpkAfter: number | undefined;
  countBefore: number;
  countAfter: number;
}
```

For each filter action, the hook calls `calculateStats()` on the outcome values before and after the filter. This provides the before/after delta visible in the narrative timeline.

---

## Part 12 — Drill Suggestions

> Source: `packages/core/src/variation/suggestions.ts`

### Constants

```
DRILL_SWITCH_THRESHOLD = 5    // Minimum % variation for drill suggestions
```

### Max Category Contribution

`getMaxCategoryContribution(data, factor, outcome)`: returns the highest single-category η² contribution for a factor, as a fraction (0–1). Used internally by the drill suggestion logic to determine whether a factor has any category with meaningful effect size.

### Next Drill Factor

`getNextDrillFactor(factorVariations, currentFactor, minThreshold?)`: after drilling into a factor, finds the remaining factor with highest variation above `minThreshold` (default 5%). Returns factor name or `null`.

### Optimal Factor Selection (Greedy)

`findOptimalFactors(data, factors, outcome, targetPct?, maxFactors?)`:

1. Compute η² for each factor via `getEtaSquared()`
2. Sort factors by η² descending
3. Greedy selection: accumulate as `remaining = remaining × (1 - η²_i)`, cumulative = `100 - remaining × 100`
4. Stop when cumulative ≥ `targetPct` (default 70%) or `maxFactors` (default 3) reached

Returns `OptimalFactorResult[]` with factor, variationPct (η² × 100), bestValue (category with highest weighted mean deviation), and cumulativePct.

---

## Part 13 — What-If Simulation

> Source: `packages/core/src/variation/simulation.ts`
> User docs: [Investigation to Action](../03-features/workflows/investigation-to-action.md)

### Direct Adjustment

`simulateDirectAdjustment(currentStats, params, specs?)`:

```
projectedMean = currentStats.mean + meanShift
projectedStdDev = currentStats.stdDev × (1 - variationReduction)
```

Where `variationReduction` is a fraction 0–1 (e.g., 0.2 = 20% reduction).

Projected capability:

```
projectedCp  = (USL - LSL) / (6 × projectedStdDev)
projectedCpk = min((USL - projectedMean) / (3 × projectedStdDev),
                   (projectedMean - LSL) / (3 × projectedStdDev))
```

### Yield Calculation

Normal CDF via the error function (Abramowitz & Stegun formula 7.1.26):

```
erf(x) ≈ 1 - (a₁t + a₂t² + a₃t³ + a₄t⁴ + a₅t⁵) × exp(-x²)
  where t = 1/(1 + 0.3275911 × |x|)

Φ(z) = 0.5 × (1 + erf(z / √2))
```

Constants: a₁ = 0.254829592, a₂ = −0.284496736, a₃ = 1.421413741, a₄ = −1.453152027, a₅ = 1.061405429.

Yield is computed as the probability of falling within specification limits:

```
yield = Φ((USL - mean) / σ) - Φ((LSL - mean) / σ)      (both limits)
yield = Φ((USL - mean) / σ)                               (USL only)
yield = 1 - Φ((LSL - mean) / σ)                           (LSL only)
```

Clamped to [0, 100]. PPM = `round((100 - yield%) × 10000)`.

**Edge case**: σ = 0 → yield is 100% if mean is within specs, 0% otherwise.

### Category Exclusion

`calculateProjectedStats(data, factor, outcome, excludedCategories, specs?)`:

Filters out rows matching excluded categories, recomputes mean and **population** std dev on remaining data. Computes improvement percentages (stdDev reduction, mean centering improvement, Cpk improvement) when baseline stats are provided.

### Model-Driven Simulation (Deferred)

The `simulateFromModel()` function and `getFactorBaselines()` exist in the codebase but are not used in Phase 1. They support regression-based what-if analysis (categorical coefficient swaps, continuous factor shifts, interaction terms). Deferred to Phase 2 per ADR-014.

---

## Part 14 — Investigation & Findings System

> Sources: `packages/hooks/src/useFindings.ts`, `packages/hooks/src/useHypotheses.ts`, `packages/ui/src/components/FindingsWindow/`, `packages/ui/src/components/FindingsLog/`
> User docs: [Investigation to Action](../03-features/workflows/investigation-to-action.md), [Hypothesis Investigation](../03-features/workflows/question-driven-investigation.md)

### Architecture

The Investigation & Findings system replaced the earlier Mindmap visualization (Feb 2026). It provides a structured workflow for tracking observations, hypotheses, and improvement actions.

| Component              | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `FindingsWindow`       | Popout window for findings (board view, question tree)    |
| `FindingsLog`          | Inline findings list with cards and status management     |
| `FindingCard`          | Individual finding with status badge, comments, actions   |
| `FindingBoardView`     | Horizontal drag-and-drop board (5 status columns)         |
| `HypothesisTreeView`   | Collapsible tree with validation status and η² thresholds |
| `InvestigationSidebar` | Phase tracking, uncovered factors, suggested questions    |

### Finding Data Model

```typescript
interface Finding {
  id: string;
  title: string;
  description: string;
  status: FindingStatus; // 'observed' | 'investigating' | 'analyzed' | 'improving' | 'resolved'
  tags: FindingTag[]; // 'key-driver' | 'low-impact'
  source?: FindingSource; // chart type, category, anchor position
  hypothesisId?: string;
  validationStatus?: 'supported' | 'refuted' | 'inconclusive';
  projection?: ProjectionResult;
  actions?: ActionItem[];
  outcome?: FindingOutcome;
  createdAt: string;
  updatedAt: string;
}
```

**Status transitions** (PWA supports first 3 only):

- `'observed'` → `'investigating'`: analyst begins root cause analysis
- `'investigating'` → `'analyzed'`: hypothesis validated or refuted
- `'analyzed'` → `'improving'`: improvement action defined
- `'improving'` → `'resolved'`: action completed with measured outcome

### Hypothesis Tree

> Source: `packages/hooks/src/useHypotheses.ts`

Hypotheses are organized as a tree structure for structured root cause investigation:

- **CRUD operations**: create, update, delete hypotheses at any tree level
- **Auto-validation**: η² thresholds determine whether a hypothesis is supported by the data
- **Ideas**: each hypothesis can have child ideas (`addIdea`, `updateIdea`, `removeIdea`, `setIdeaProjection`, `selectIdea`)
- **Investigation phases**: initial → diverging → validating → converging (investigation diamond); improving → resolved (IMPROVE/PDCA)

### η² Suggestion Logic

The system uses η² (eta-squared) from ANOVA to suggest which factors to investigate:

- Factors with η² ≥ 0.14 (large effect) are highlighted as key drivers
- The `InvestigationSidebar` shows uncovered factors ranked by η², with suggested questions
- Auto-validation thresholds: η² ≥ 0.14 → supported, η² < 0.01 → refuted, otherwise inconclusive

### Board View

> Source: `packages/ui/src/components/FindingsLog/FindingBoardColumns.tsx`

5-column horizontal board with native HTML5 drag-and-drop (no external library):

| Column        | Status          | Color  |
| ------------- | --------------- | ------ |
| Observed      | `observed`      | Amber  |
| Investigating | `investigating` | Blue   |
| Analyzed      | `analyzed`      | Purple |
| Improving     | `improving`     | Indigo |
| Resolved      | `resolved`      | Green  |

### Chart Integration

Findings connect to charts via `FindingSource` metadata:

| Chart   | Anchor Type       | Finding carries                          |
| ------- | ----------------- | ---------------------------------------- |
| Boxplot | Category-based    | `source.chartType`, `source.category`    |
| Pareto  | Category-based    | `source.chartType`, `source.category`    |
| I-Chart | Free-floating (%) | `source.anchorX`, `source.anchorY` (0–1) |

`ChartAnnotationLayer` renders findings as positioned text boxes with status dots (amber/blue/purple matching investigation phase).

### State Hooks

**`useFindings`** — CRUD for findings plus:

- `linkHypothesis`, `unlinkHypothesis` — connect findings to question tree
- `setProjection` — attach What-If projection result
- `addAction`, `updateAction`, `completeAction`, `deleteAction` — improvement actions
- `setOutcome` — record measured result

**`useHypotheses`** — tree management plus:

- Auto-validation against η² thresholds
- Idea management (`addIdea`, `updateIdea`, `removeIdea`)
- `setIdeaProjection`, `selectIdea` for What-If integration

---

## Part 15 — Unified GLM Regression Engine

> Sources: `packages/core/src/stats/ols.ts`, `packages/core/src/stats/bestSubsets.ts`, `packages/core/src/stats/designMatrix.ts`, `packages/core/src/stats/quadratic.ts`, `packages/core/src/stats/typeIII.ts`
> User docs: [Regression Methodology](../03-features/analysis/regression-methodology.md)
> Decision: [ADR-067](../07-decisions/adr-067-unified-glm-regression.md)

The unified OLS/GLM engine handles both categorical (dummy-coded) and continuous factors in a single model. It supersedes the categorical-only best subsets engine for Factor Intelligence, Evidence Map positioning, and What-If prediction. The simple `calculateAnova()` (Part 2) is retained for one-way ANOVA in the Boxplot panel.

### Design Matrix Construction

> Source: `packages/core/src/stats/designMatrix.ts`

Categorical factors use reference cell dummy coding. For a factor with levels [A, B, C, D], reference level A produces three dummy columns:

```
[Machine=B]   1 if Machine is B, 0 otherwise
[Machine=C]   1 if Machine is C, 0 otherwise
[Machine=D]   1 if Machine is D, 0 otherwise
```

Reference level is the first category alphabetically. Its effect is absorbed into the intercept.

Continuous factors enter as raw numeric columns. For quadratic terms (see below), the centered form is used:

```
X_centered = X − mean(X)
X_quadratic = X_centered²
```

### OLS Solver (QR Decomposition)

> Source: `packages/core/src/stats/ols.ts`

Solves `β = argmin ||Xβ − y||²` via QR decomposition using Householder reflections:

```
X = QR    (Q orthogonal, R upper triangular)
β = R⁻¹ Qᵀ y
```

QR decomposition is preferred over the normal equations (X'X)⁻¹X'y because it does not square the condition number of the design matrix. For near-singular X (correlated factors), the normal equations amplify numerical errors; QR decomposition remains stable.

**Validation**: Tested against NIST StRD datasets (Norris, Pontius, Longley) to 9+ significant digits. The Longley dataset is deliberately ill-conditioned and is the standard benchmark for numerical stability.

**Residual standard error**:

```
s = sqrt( ||y − Xβ̂||² / (n − p − 1) )
```

**Coefficient standard errors**:

```
SE(β_j) = s × sqrt( (R⁻¹)ⱼⱼ )
```

Where (R⁻¹)ⱼⱼ is the j-th diagonal of the inverse of the upper triangular R factor.

### Best Subsets Model Selection

> Source: `packages/core/src/stats/bestSubsets.ts`

Evaluates all 2^k − 1 non-empty factor combinations (k ≤ 10, exact via Furnival-Wilson leaps and bounds). Categorical factors enter/leave as a unit — all dummy variables for a categorical factor are either included or excluded together.

Selection criterion: R²adj:

```
R²adj = 1 − (1 − R²) × (n − 1) / (n − p − 1)
```

Where p is the number of model parameters (intercept + predictor columns). R²adj penalizes model complexity: adding a predictor that explains little variance reduces R²adj even if R² increases.

### Quadratic Detection

> Source: `packages/core/src/stats/quadratic.ts`

For each continuous factor, tests whether a quadratic term (β₂ × X²) improves R²adj over the linear-only model. If the improvement exceeds a threshold, the quadratic term is retained in the best subsets candidate pool.

**Sweet spot computation** (when β₂ < 0, indicating a maximum):

```
X_optimum = X̄ − β₁ / (2 × β₂)
```

Where X̄ is the sample mean (added back because the quadratic was fitted on centered X).

**Operating window**: the range where predicted response is within 1% of the optimum. Computed by solving `ŷ(X*) − ŷ(X) = 0.01 × ŷ(X*)` for X on both sides of the optimum.

### Type III Sum of Squares

> Source: `packages/core/src/stats/typeIII.ts`

Type III SS for factor j: fit the full model, then fit the model with factor j removed. The difference in residual SS is the Type III SS for factor j:

```
SS_j(Type III) = RSS(model without j) − RSS(full model)
```

**Partial η²**:

```
Partial η²_j = SS_j(Type III) / (SS_j(Type III) + RSS_full)
```

Type III SS is the standard for unbalanced observational data — it adjusts each factor's contribution for all others, removing order dependency.

**F-statistic and p-value** for factor j:

```
F_j = (SS_j(Type III) / df_j) / (RSS_full / df_residual)
p_j = P(F > F_j | df_j, df_residual)    via fDistributionPValue()
```

Where df_j = number of parameters for factor j (1 for continuous, m−1 for categorical with m levels).

### VIF (Variance Inflation Factor)

For each factor j, regress factor j on all other factors. VIF_j = 1 / (1 − R²_j):

```
VIF_j = 1 / (1 − R²_j)
```

VIF > 10 triggers a warning. This is computed only for continuous factors (VIF for dummy-coded categorical blocks is reported as the maximum VIF among the block's individual dummies).

### Prediction

> Source: `packages/core/src/stats/` → exported as `predictFromModel`

```typescript
predictFromModel(
  model: GLMModel,
  factorValues: Record<string, number | string>
): { predicted: number; lowerPI: number; upperPI: number }
```

Constructs the prediction vector x\* from factor values (dummy-encoding categorical values), then:

```
ŷ* = x*ᵀ β̂

Prediction interval (95%):
ŷ* ± t_{α/2, n-p-1} × s × sqrt(1 + x*ᵀ (XᵀX)⁻¹ x*)
```

The term `sqrt(1 + x*ᵀ (XᵀX)⁻¹ x*)` accounts for both estimation uncertainty (the second term) and individual observation scatter (the leading 1). This is a **prediction interval**, not a confidence interval — it bounds a single future observation.

**Extrapolation detection**: `computeCoverage()` checks whether each continuous factor value in x\* falls within the observed range [min, max]. Values outside this range set an `isExtrapolation` flag, triggering the amber warning in the What-If Profiler.

### Two-Engine Architecture

| Engine        | Module                            | Used for                                            | Algorithm                      |
| ------------- | --------------------------------- | --------------------------------------------------- | ------------------------------ |
| One-way ANOVA | `stats/anova.ts`                  | Boxplot panel, per-factor η²                        | Group means, exact F-test      |
| Unified GLM   | `stats/ols.ts` + `bestSubsets.ts` | Factor Intelligence, Evidence Map, What-If Profiler | QR decomposition, best subsets |

For categorical-only data, both engines produce mathematically equivalent results (within floating-point precision). The ANOVA engine is retained for Boxplot display because it is faster, simpler, and uses terminology (F, p, η²) familiar to Six Sigma practitioners.

### NIST Validation Reference

> Test file: `packages/core/src/stats/__tests__/nist.test.ts`

| Dataset | Description                                | VariScout accuracy     |
| ------- | ------------------------------------------ | ---------------------- |
| Norris  | Simple linear, n=36                        | ≥ 9 significant digits |
| Pontius | Quadratic, n=40                            | ≥ 9 significant digits |
| Longley | Multiple regression, ill-conditioned, n=16 | ≥ 9 significant digits |

Certified reference values from NIST StRD: https://www.itl.nist.gov/div898/strd/

---

## Evidence Levels

VariScout classifies the confidence in ANOVA results using evidence levels derived from the p-value:

| p-value | Evidence Level | Interpretation                                         |
| ------- | -------------- | ------------------------------------------------------ |
| < 0.01  | Strong         | High confidence that the factor drives variation       |
| < 0.05  | Moderate       | Reasonable confidence — worth investigating further    |
| < 0.10  | Weak           | Some signal — strengthen with gemba or expert evidence |
| >= 0.10 | Insufficient   | No clear evidence of a pattern                         |

Evidence level tells you **how confident** you can be. η² tells you **how important** the factor is. Both are needed:

- **High η² + strong evidence**: This factor clearly drives variation — drill into it
- **High η² + weak evidence**: Promising pattern — validate with gemba walk or expert
- **Low η² + strong evidence**: Real but small — other factors matter more
- **Low η² + weak evidence**: No clear pattern for this factor

> **ASA alignment**: VariScout follows the American Statistical Association's 2016/2019 position — p-values are not used as binary pass/fail thresholds. "Statistically significant" language is replaced with evidence-calibrated descriptions.

---

## References & Standards

| Topic                                | Standard / Source                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| I-MR chart, σ_within                 | Wheeler, _Understanding Variation_ (2000); d2 constant from AIAG SPC Manual   |
| Cp, Cpk                              | AIAG Statistical Process Control Reference Manual, 2nd ed.                    |
| d2 = 1.128                           | Hartley unbiasing constant for moving range span 2                            |
| ANOVA effect size (η²)               | Cohen, _Statistical Power Analysis for the Behavioral Sciences_ (1988)        |
| Boxplot, IQR fences                  | Tukey, _Exploratory Data Analysis_ (1977)                                     |
| KDE bandwidth                        | Silverman, _Density Estimation for Statistics and Data Analysis_ (1986)       |
| Benard median rank                   | Benard & Bos-Levenbach (1953); Minitab default                                |
| Normal quantile                      | Acklam's rational approximation (~1e-9 accuracy)                              |
| Error function                       | Abramowitz & Stegun, _Handbook of Mathematical Functions_, formula 7.1.26     |
| Incomplete beta / continued fraction | Lentz's algorithm (max 200 iterations, ε = 1e-10)                             |
| Nelson Rule 2                        | Nelson, _Journal of Quality Technology_ (1984) — 9-point runs                 |
| Nelson Rule 3                        | Nelson, _Journal of Quality Technology_ (1984) — 6-point trends               |
| Evidence levels (p-value)            | ASA Statement on Statistical Significance and P-Values (2016, 2019)           |
| OLS QR decomposition                 | Golub, G.H. & Van Loan, C.F. (2013). _Matrix Computations_, 4th ed., Ch. 5    |
| Best subsets (leaps and bounds)      | Furnival, G.M. & Wilson, R.W. (1974). _Technometrics_ 16(4):499–511           |
| Type III SS                          | Montgomery, D.C. (2017). _Design and Analysis of Experiments_, 9th ed., Ch. 8 |
| VIF multicollinearity                | Belsley, Kuh & Welsch. _Regression Diagnostics_ (1980). Wiley.                |
| NIST StRD regression benchmarks      | NIST Statistical Reference Datasets, https://www.itl.nist.gov/div898/strd/    |

---

## Numerical Safety — Three-Boundary Defense

> Source: `packages/core/src/stats/safeMath.ts`
> Architecture: [ADR-069](../07-decisions/adr-069-three-boundary-numeric-safety.md)

### Architecture

```
Raw Data → [B1: Input] → Clean Data → [Stats Engine] → [B2: Output] → Safe Results → [B3: Display] → User
```

| Boundary | Location                                | Guard                                               | Handles                               |
| -------- | --------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| **B1**   | `toNumericValue()` in `types.ts`        | `isFinite() && !isNaN()`                            | Rejects NaN/Infinity from parsed data |
| **B2**   | `safeMath.ts` utilities                 | `finiteOrUndefined`, `safeDivide`, `computeOptimum` | Guarantees finite stats output        |
| **B3**   | `formatStatistic()` in `i18n/format.ts` | `!isFinite(value) → '—'`                            | Prevents "NaN"/"Infinity" in UI text  |

### Utilities (`safeMath.ts`)

| Function            | Signature                                                | Returns                                                       |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `finiteOrUndefined` | `(n: number) → number \| undefined`                      | `n` if finite, else `undefined`                               |
| `safeDivide`        | `(num, denom, minDenom?) → number \| undefined`          | Result if finite and `\|denom\| ≥ minDenom`, else `undefined` |
| `computeOptimum`    | `(linearCoef, quadCoef, quadMean) → number \| undefined` | Vertex `x̄ − b₁/(2b₂)` if finite, else `undefined`             |

### Functions That Can Return `undefined` or `null`

| Function                         | Return Type               | When                                   |
| -------------------------------- | ------------------------- | -------------------------------------- |
| `calculateAnova()`               | `null`                    | Non-finite F-statistic, p-value, or η² |
| `calculateStats()` → `cp`, `cpk` | `undefined`               | σ_within = 0                           |
| `computeOptimum()`               | `undefined`               | Near-zero or non-finite coefficients   |
| `andersonDarlingTest()`          | `{ statistic: Infinity }` | All values identical (intentional)     |

### Convention

Stats functions return `number | undefined` (or `null` for ANOVA), never `NaN` or `Infinity`. The single exception is `andersonDarlingTest()` which returns `Infinity` intentionally for degenerate data.
