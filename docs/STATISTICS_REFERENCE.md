# Statistics Reference

This document explains the statistical calculations used in VariScout Lite. Understanding these formulas helps quality professionals interpret results and explain findings to stakeholders.

## Table of Contents

- [Basic Statistics](#basic-statistics)
- [Control Limits (I-Chart)](#control-limits-i-chart)
- [Staged Control Limits](#staged-control-limits)
- [Process Capability (Cp & Cpk)](#process-capability-cp--cpk)
- [Conformance Metrics](#conformance-metrics)
- [Multi-Tier Grading](#multi-tier-grading)
- [Effect Size (Eta-Squared)](#effect-size-eta-squared)
- [Cumulative Variation Tracking](#cumulative-variation-tracking)
- [Probability Plot](#probability-plot)

---

## Basic Statistics

### Mean (Average)

The arithmetic mean of all measurements:

```
Mean = (x₁ + x₂ + ... + xₙ) / n
```

Where `n` is the total number of data points.

### Standard Deviation (StdDev)

Measures the spread of data around the mean. VariScout uses the **sample standard deviation**:

```
StdDev = √[ Σ(xᵢ - Mean)² / (n - 1) ]
```

A larger standard deviation indicates more variation in your process.

---

## Control Limits (I-Chart)

The Individual (I) Chart uses **3-sigma control limits** to identify unusual variation:

### Upper Control Limit (UCL)

```
UCL = Mean + (3 × StdDev)
```

### Lower Control Limit (LCL)

```
LCL = Mean - (3 × StdDev)
```

### Interpretation

- **Points within control limits**: Normal process variation
- **Points outside control limits**: Special cause variation (investigate)
- **~99.7%** of data should fall within control limits for a stable process

### Important Notes

- Control limits are calculated from your **data**, not specifications
- They show what your process **is doing**, not what it **should do**
- Specification limits (USL/LSL) are separate—they define what is acceptable

---

## Staged Control Limits

When analyzing data across distinct phases (before/after, different batches), staged control limits calculate separate UCL, Mean, and LCL for each stage.

### When to Use Staged Analysis

- Before/during/after a process improvement
- Comparing different production batches or shifts
- Equipment or material changes over time
- Any time the process baseline may have shifted

### How It Works

1. Select a categorical column as the "Stage Column"
2. Data is sorted so all points from each stage are grouped together
3. Control limits are calculated independently for each stage
4. Each stage displays its own UCL, Mean, and LCL lines

### Stage Order Detection

VariScout auto-detects the appropriate ordering:

- **Numeric stages** ("1", "2", "3" or "Stage 1", "Phase 2") → sorted numerically
- **Text stages** ("Before", "After") → first occurrence order

Manual override available: Auto-detect, First occurrence, A-Z/1-9

### Per-Stage Calculations

Each stage has its own statistics calculated independently:

```
Stage Mean = Σ(values in stage) / n_stage
Stage StdDev = √[ Σ(xᵢ - Stage Mean)² / (n_stage - 1) ]
Stage UCL = Stage Mean + (3 × Stage StdDev)
Stage LCL = Stage Mean - (3 × Stage StdDev)
```

### Visual Elements

- Vertical dashed lines at stage boundaries
- Stage labels at top of each section
- Per-stage control limit lines (UCL, Mean, LCL)
- Points colored based on their stage's limits

### API Functions

```typescript
import {
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
  type StagedStatsResult,
  type StageOrderMode,
  type StageBoundary,
} from '@variscout/core';

// Determine stage ordering (auto-detect or manual)
const stageOrder = determineStageOrder(stageValues, 'auto');

// Sort data by stage
const sortedData = sortDataByStage(data, 'PhaseColumn', stageOrder);

// Calculate per-stage statistics
const stagedStats = calculateStatsByStage(data, 'Measurement', 'PhaseColumn', { usl: 10, lsl: 0 });

// Get boundaries for chart rendering
const boundaries = getStageBoundaries(chartData, stagedStats);
```

> **User Guide:** [docs/products/pwa/STAGED_ANALYSIS.md](products/pwa/STAGED_ANALYSIS.md)
>
> Staged analysis is available in PWA, Azure Team App, and Excel Add-in.

---

## Process Capability (Cp & Cpk)

Capability indices compare your process variation to specification limits.

### Cp (Potential Capability)

Cp measures how well your process **could** perform if it were perfectly centered:

```
Cp = (USL - LSL) / (6 × StdDev)
```

**Requires both USL and LSL to be defined.**

| Cp Value    | Interpretation         |
| ----------- | ---------------------- |
| < 1.00      | Process is not capable |
| 1.00 - 1.33 | Marginally capable     |
| 1.33 - 1.67 | Capable                |
| > 1.67      | Highly capable         |

### Cpk (Actual Capability)

Cpk accounts for how **centered** your process is:

```
CPU = (USL - Mean) / (3 × StdDev)
CPL = (Mean - LSL) / (3 × StdDev)
Cpk = min(CPU, CPL)
```

**Works with one-sided specifications too:**

- Only USL defined: `Cpk = (USL - Mean) / (3 × StdDev)`
- Only LSL defined: `Cpk = (Mean - LSL) / (3 × StdDev)`

| Cpk Value   | Interpretation                        |
| ----------- | ------------------------------------- |
| < 1.00      | Process is not meeting specs          |
| 1.00 - 1.33 | Meeting specs, but with little margin |
| 1.33 - 1.67 | Good capability                       |
| > 1.67      | Excellent capability                  |

### Cp vs Cpk: When to Use Each

| Metric  | Use When                     | Tells You                                    |
| ------- | ---------------------------- | -------------------------------------------- |
| **Cp**  | Assessing potential          | How capable the process could be if centered |
| **Cpk** | Assessing actual performance | How capable the process actually is          |

**Key Insight**: If Cpk < Cp, your process is off-center. Focus on centering (reducing bias) before reducing variation.

---

## Conformance Metrics

### Out of Spec Percentage

The percentage of measurements that fall outside specification limits:

```
Out of Spec % = (Count outside specs / Total count) × 100
```

A measurement is "out of spec" if:

- Value > USL (exceeds upper limit)
- Value < LSL (below lower limit)

### Pass Rate

```
Pass Rate = 100% - Out of Spec %
```

---

## Multi-Tier Grading

For quality systems with multiple grades (e.g., coffee defects, textile grades), VariScout supports tiered classification.

### Grade Assignment

Each measurement is assigned to the **first grade** where the value is ≤ the grade's maximum threshold:

```
Example: Coffee defect count = 7

Grades:
- Specialty: max 5  → 7 > 5, skip
- Premium: max 8    → 7 ≤ 8, ASSIGN
- Exchange: max 23
- Below: max 86

Result: Grade = "Premium"
```

### Grade Summary

For each grade, VariScout calculates:

- **Count**: Number of measurements in this grade
- **Percentage**: `(Count / Total) × 100`

---

## Effect Size (Eta-Squared)

Eta-squared (η²) measures how much of the total variation is explained by a grouping factor.

```
η² = SS_between / SS_total
```

Where:

- **SS_total**: Total sum of squares (overall variation)
- **SS_between**: Sum of squares between groups

### Calculation

1. Calculate overall mean of the outcome variable
2. Calculate SS_total: `Σ(xᵢ - overall mean)²`
3. For each group, calculate group mean
4. Calculate SS_between: `Σ nⱼ × (group mean - overall mean)²`
5. η² = SS_between / SS_total

### Interpretation

| η² Value    | Interpretation |
| ----------- | -------------- |
| 0.01 - 0.06 | Small effect   |
| 0.06 - 0.14 | Medium effect  |
| > 0.14      | Large effect   |

**Example**: If η² = 0.34 for "Supplier" factor, it means 34% of the variation in your outcome can be attributed to differences between suppliers.

---

## Cumulative Variation Tracking

VariScout uses eta-squared to track variation through drill-down analysis. This helps users understand how much variation is isolated at each step.

### The Multiplicative Model

When drilling down through multiple factors, variation percentages are **multiplied** (not added) to show the cumulative impact:

```
Cumulative η² = η²₁ × η²₂ × η²₃ × ...
```

**Example drill-down sequence:**

| Step | Action                 | Local η² | Cumulative η²       |
| ---- | ---------------------- | -------- | ------------------- |
| 1    | All Data               | 100%     | 100%                |
| 2    | Drill to "Night Shift" | 65%      | 65%                 |
| 3    | Drill to "Machine C"   | 71%      | 65% × 71% = 46.2%   |
| 4    | Drill to "Operator B"  | 89%      | 46.2% × 89% = 41.1% |

**Interpretation**: After drilling through Shift → Machine → Operator, you've isolated 41% of the original variation into this specific combination.

### Thresholds and Insights

VariScout uses predefined thresholds to guide analysis:

| Cumulative η² | Classification  | Insight                                                        |
| ------------- | --------------- | -------------------------------------------------------------- |
| ≥ 50%         | High Impact     | "Fix this combination to address more than half the variation" |
| 30-50%        | Moderate Impact | "This factor combination explains significant variation"       |
| < 30%         | Low Impact      | "Consider investigating other factors"                         |

### Drill Suggestions

On the Boxplot chart, factors with η² ≥ 50% are highlighted with:

- Red-colored axis label showing `Factor (X%)`
- "↓ drill here" indicator text

This helps users identify which factor to drill into next for maximum insight.

### API Functions

```typescript
import {
  calculateDrillVariation,
  calculateFactorVariations,
  shouldHighlightDrill,
  VARIATION_THRESHOLDS,
  getVariationImpactLevel,
  getVariationInsight,
} from '@variscout/core';

// Calculate cumulative variation through a drill path
const result = calculateDrillVariation(rawData, filters, 'Weight');
// result.cumulativeVariationPct = 46.5
// result.impactLevel = 'moderate'
// result.insightText = "This factor combination explains significant variation"

// Calculate η² for each factor (for drill suggestions)
const variations = calculateFactorVariations(data, ['Shift', 'Machine', 'Operator'], 'Weight', [
  'Shift',
]);
// variations.get('Machine') = 67.5 -> highlight in UI

// Check if a factor should be highlighted
shouldHighlightDrill(67.5); // true (≥50%)
```

> **Detailed documentation:** [docs/products/pwa/VARIATION_TRACKING.md](products/pwa/VARIATION_TRACKING.md)

---

## Probability Plot

The probability plot (found in Stats Panel → Prob Plot tab) visually assesses whether your data follows a normal distribution.

### How It Works

Data points are plotted against their **expected percentile** positions. If the data is normally distributed, points will fall close to a straight line.

```
Percent
  99 ─┬─────────────────────────●───────
  95 ─┤                    ●  / ╱
  90 ─┤                  ●  / ╱   ← 95% CI bands
  75 ─┤               ●   /╱
  50 ─┤            ●    /╱ ← Fitted line
  25 ─┤          ●    ╱/
  10 ─┤        ●    ╱ /
   5 ─┤      ●    ╱  /
   1 ─┴──┬────┬────┬────┬────┬────
        10   20   30   40   50   60
                 Value
```

### Expected Percentile (Blom's Formula)

For sorted data, the expected percentile for the i-th value is:

```
p = (i - 0.375) / (n + 0.25)
```

Where:

- `i` = rank position (1, 2, 3, ...)
- `n` = total number of data points

This formula provides the most accurate unbiased estimate of percentile positions.

### 95% Confidence Interval Bands

The dashed lines show the 95% confidence interval for each percentile:

```
CI = Value ± 1.96 × SE
```

Where the standard error (SE) at each percentile depends on:

- Sample size (n)
- Standard deviation
- Position on the distribution (tails have wider CIs)

### Interpretation

| Pattern                        | Meaning                                       |
| ------------------------------ | --------------------------------------------- |
| Points follow the line closely | Data is approximately normal                  |
| S-curve pattern                | Data has heavier or lighter tails than normal |
| Points curve away at ends      | Skewed distribution                           |
| Points far outside CI bands    | Significant departure from normality          |

### When to Use

- **Before capability analysis**: Cp/Cpk assume normal distribution
- **Investigating outliers**: See if extreme values fit the pattern
- **Comparing processes**: Different distributions may need different analysis approaches

### Visual Elements

- **Green dots**: Your data points
- **Blue solid line**: Theoretical normal distribution (fitted to your data's mean and standard deviation)
- **Gray dashed lines**: 95% confidence interval bands
- **Light blue shading**: CI envelope

---

## Code Reference

All statistics are calculated in `src/logic/stats.ts`:

```typescript
// Main statistics function
calculateStats(data: number[], usl?: number, lsl?: number, grades?: Grade[]): StatsResult

// Effect size function
getEtaSquared(data: any[], factor: string, outcome: string): number

// Probability plot functions
calculateProbabilityPlotData(data: number[]): ProbabilityPlotPoint[]
normalQuantile(p: number): number  // Inverse normal CDF
```

---

## Further Reading

- [NIST Engineering Statistics Handbook](https://www.itl.nist.gov/div898/handbook/)
- [ASQ Quality Glossary](https://asq.org/quality-resources/quality-glossary)
- Montgomery, D.C. (2012). _Statistical Quality Control_
