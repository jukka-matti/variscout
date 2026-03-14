# I-Chart (Individuals Chart)

The I-Chart is VariScout's tool for the **CHANGE** lens - analyzing time-based stability.

---

## Purpose

_"Is the process stable, or is something degrading/shifting over time?"_

The I-Chart reveals:

- Time-based stability or instability
- Trends, shifts, cycles
- Points outside control limits (UCL/LCL)
- Dynamic behavior: wear, degradation, seasonal effects

---

## Key Elements

| Element          | Description                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Data points      | Individual measurements plotted over time                                                                                 |
| Mean line (x̄)    | Process average                                                                                                           |
| UCL              | Upper Control Limit (x̄ + 2.66MR̄)                                                                                          |
| LCL              | Lower Control Limit (x̄ - 2.66MR̄)                                                                                          |
| Spec lines       | Optional USL/LSL overlay                                                                                                  |
| Violation shapes | Shape encodes rule type: circle = spec/control violation, diamond (◆) = Nelson Rule 2, square (■) = Nelson Rule 3 (trend) |

---

## Interpretation

| Pattern                      | Meaning                        | Symbol | Action      |
| ---------------------------- | ------------------------------ | ------ | ----------- |
| Points within limits, random | Stable process                 |        | Maintain    |
| Point above UCL              | Special cause (high)           | ●      | Investigate |
| Point below LCL              | Special cause (low)            | ●      | Investigate |
| 7+ points one side           | Shift in mean                  | ◆      | Investigate |
| 9+ points one side           | Shift in mean — Rule 2         | ◆      | Investigate |
| 6+ trending up/down          | Trend (Rule 3) — ▲ up / ▼ down | ■      | Investigate |

---

## Linked Filtering

Click any point to:

- See its factor values (Machine, Shift, Operator)
- Filter other charts to that subset
- Build drill-down path

---

## Point Selection & Create Factor

When instability patterns don't align with any existing factor, you can create an ad-hoc grouping variable directly from the time series.

### Selecting Points

- **Drag-select (brush)**: Click and drag on the chart to draw a blue selection rectangle. All points inside the rectangle are selected.
- **Ctrl+click**: Toggle individual points in/out of the selection.
- **Shift+click**: Add individual points to the current selection.
- **Esc**: Clear the selection.

### What Happens Next

1. A **Selection Panel** appears showing the count and details of selected points.
2. Click **"Create Factor"** to open the naming modal.
3. Enter a name for the group (e.g., "Monday anomalies", "Startup batch").
4. VariScout creates a new factor column with two levels: your named group and "Other".
5. The new factor is auto-applied as a filter, showing only the selected points.

### When to Use

- Special causes on the I-Chart that no existing factor explains
- A cluster of points that "look different" but don't map to Shift, Operator, or Machine
- Bridging from the **CHANGE** lens (time-series instability) to the **FLOW** lens (factor-based stratification): select the anomalous points, create a factor, then drill down with Boxplot to quantify the difference

---

## Technical Reference

VariScout's implementation:

```typescript
// From @variscout/core
import {
  calculateStats,
  getNelsonRule2ViolationPoints,
  getNelsonRule3ViolationPoints,
} from '@variscout/core';

const stats = calculateStats(values, usl, lsl);
// Returns: { mean, stdDev, ucl, lcl, cp, cpk, outOfSpecPercentage }

const rule2Violations = getNelsonRule2ViolationPoints(values, stats.mean);
// Returns: Set of indices in 9+ same-side runs

const rule3Violations = getNelsonRule3ViolationPoints(values);
// Returns: Set of indices in 6+ strictly monotonic trend runs
```

**Test coverage:** See `packages/core/src/__tests__/stats.test.ts` and `packages/core/src/__tests__/nelson.test.ts`.

---

## Violation Symbols

Each violation type is encoded by both color and shape, so patterns remain distinguishable even in grayscale or when multiple rule violations coexist on the same chart.

| Shape     | Rule                     | Meaning                                     |
| --------- | ------------------------ | ------------------------------------------- |
| ● Circle  | Spec / control violation | Point outside spec or control limits        |
| ◆ Diamond | Nelson Rule 2            | 9+ consecutive points on the same side      |
| ■ Square  | Nelson Rule 3            | 6+ strictly increasing or decreasing values |

When a point qualifies for more than one rule simultaneously, the highest-priority shape is rendered: spec/control violation (●) takes priority over Rule 2 (◆), which takes priority over Rule 3 (■). Color still reflects whether the signal is harmful or favorable (see [Beneficial Signals](#beneficial-signals) and [Characteristic Types](characteristic-types.md)).

---

## Beneficial Signals

When a [characteristic type](characteristic-types.md) is set (or auto-inferred from spec limits), control violations gain directional awareness:

- **Favorable special causes** (green dots) — the process moved in the desired direction. Investigate to _replicate_.
- **Harmful special causes** (red dots) — the process moved away from the goal. Investigate to _fix_.

For example, a point below LCL on a smaller-is-better chart (e.g. cycle time) is a favorable signal — unexpectedly fast performance worth understanding. Without direction awareness, this would be misidentified as a problem.

See [Characteristic Type Awareness](characteristic-types.md) for the full violation color map.

---

## See Also

- [CHANGE Lens](../../01-vision/four-lenses/change.md) - Time-based stability concepts
- [Two Voices](../../01-vision/two-voices/index.md) - Control limits vs specs
- [Nelson Rules](nelson-rules.md) - Pattern detection (9-point runs)
- [Staged Analysis](staged-analysis.md) - Per-stage control limits
- [Boxplot](boxplot.md) - Next step: find which factor explains variation
- [Chart Design](../../06-design-system/charts/ichart.md)
- [Glossary: UCL/LCL](../../glossary.md#ucl-upper-control-limit)
- [Case: Bottleneck](../../04-cases/bottleneck/index.md) - I-Chart in action
