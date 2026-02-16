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

## See Also

- [CHANGE Lens](../../01-vision/four-lenses/change.md) - Time-based stability concepts
- [Two Voices](../../01-vision/two-voices/index.md) - Control limits vs specs
- [Nelson Rules](nelson-rules.md) - Pattern detection (9-point runs)
- [Staged Analysis](staged-analysis.md) - Per-stage control limits
- [Boxplot](boxplot.md) - Next step: find which factor explains variation
- [Chart Design](../../06-design-system/charts/ichart.md)
- [Glossary: UCL/LCL](../../glossary.md#ucl)
- [Case: Bottleneck](../../04-cases/bottleneck/index.md) - I-Chart in action
