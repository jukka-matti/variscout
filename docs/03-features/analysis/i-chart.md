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

| Element       | Description                               |
| ------------- | ----------------------------------------- |
| Data points   | Individual measurements plotted over time |
| Mean line (x̄) | Process average                           |
| UCL           | Upper Control Limit (x̄ + 2.66MR̄)          |
| LCL           | Lower Control Limit (x̄ - 2.66MR̄)          |
| Spec lines    | Optional USL/LSL overlay                  |

---

## Interpretation

| Pattern                      | Meaning              | Action      |
| ---------------------------- | -------------------- | ----------- |
| Points within limits, random | Stable process       | Maintain    |
| Point above UCL              | Special cause (high) | Investigate |
| Point below LCL              | Special cause (low)  | Investigate |
| 7+ points one side           | Shift in mean        | Investigate |
| Trending up/down             | Drift                | Investigate |

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
import { calculateStats, getNelsonRule2ViolationPoints } from '@variscout/core';

const stats = calculateStats(values, usl, lsl);
// Returns: { mean, stdDev, ucl, lcl, cp, cpk, outOfSpecPercentage }

const violations = getNelsonRule2ViolationPoints(values, stats.mean);
// Returns: Set of indices in violation runs
```

**Test coverage:** See `packages/core/src/__tests__/stats.test.ts` and `packages/core/src/__tests__/nelson.test.ts`.

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
