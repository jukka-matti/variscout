# Pareto Chart

The Pareto Chart is VariScout's tool for the **FAILURE** lens - finding where problems concentrate.

---

## Purpose

_"Where do problems concentrate? Is 'chaotic data' actually mixed streams?"_

The Pareto reveals:

- Which categories contain most defects/issues
- The vital few vs trivial many (80/20 rule)
- Hidden patterns in "generic scrap buckets"
- Whether failure modes are being masked

---

## Key Elements

| Element         | Description                        |
| --------------- | ---------------------------------- |
| Bars            | Category counts, sorted descending |
| Cumulative line | Running total percentage           |
| 80% marker      | Visual guide for vital few         |

---

## Interpretation

| Pattern                | Meaning                  |
| ---------------------- | ------------------------ |
| Steep cumulative curve | Few categories dominate  |
| Flat curve             | Many small contributors  |
| First bar >50%         | Single dominant category |
| Top 3 bars >80%        | Classic 80/20 pattern    |

---

## Linked Filtering

Click any bar to:

- Filter all charts to that category
- See which factors affect that defect type
- Understand root causes

---

## Use Cases

| Scenario        | What to Analyze             |
| --------------- | --------------------------- |
| Defect analysis | Count by defect type        |
| Downtime        | Count by stoppage reason    |
| Complaints      | Count by complaint category |
| Scrap           | Count by rejection reason   |

---

---

## Technical Reference

Pareto charts in VariScout use sorted category counts with cumulative percentages. The calculation is straightforward:

```typescript
// Sort categories by count descending
// Calculate cumulative percentage
// Mark 80% threshold for "vital few"
```

---

## See Also

- [FAILURE Lens](../../01-vision/four-lenses/failure.md) - Problem concentration concepts
- [Boxplot](boxplot.md) - Previous step: compare variation by factor
- [Capability](capability.md) - Next step: assess capability of focused subset
- [Drill-Down](../navigation/drill-down.md) - Navigate into top categories
- [Chart Design](../../06-design-system/charts/pareto.md)
- [Case: Packaging](../../04-cases/packaging/index.md) - Pareto in action
- [Performance Mode](performance-mode.md) - Multi-channel Cpk ranking
