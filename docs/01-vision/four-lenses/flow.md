# FLOW Lens: Boxplot

> The Structural Lens — look at the same data grouped by factor

The FLOW lens asks what happens when you split your data by a categorical factor (machine, shift, operator). The same measurements that look uniform as one distribution reveal very different spreads when viewed through this lens.

---

## The Question

_"Which upstream inputs explain the variation I see downstream?"_

---

## What the Boxplot Reveals

- Comparison across factors (Machine A vs B vs C)
- Between-group vs within-group variation
- Which subgroup contributes most variation
- The "soup ingredients" that create the output

---

## Key Insight from Sock Mystery

> "Don't measure the 'soup' until you know the ingredients."

Participants initially measured output (sock length) without understanding inputs (size settings S/M/L). The boxplot traces footprints upstream.

---

## VariScout Implementation

- Compare any factor column (Machine, Shift, Operator, etc.)
- IQR-based outlier detection
- Visual median/spread comparison
- Violin mode: toggle density curves to reveal distribution shape (bimodality, skewness)
- Click any box → filters all other charts to that subgroup

---

## The Reality Check

> "Have we identified upstream inputs before measuring downstream outputs?"

Questions to ask:

- Input visibility
- Merge points
- Traceability

---

## Chart-to-Lens Reference

| Lens | Chart   | Key Metric                | Key Visual                     | User Action                    |
| ---- | ------- | ------------------------- | ------------------------------ | ------------------------------ |
| FLOW | Boxplot | Between-group variation % | Box position/spread comparison | Click box → filter to subgroup |

---

## See Also

- [Four Lenses Overview](index.md)
- [Drill-Down](drilldown.md) — How to drill into variation sources
