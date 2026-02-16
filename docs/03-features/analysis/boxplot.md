# Boxplot

The Boxplot is VariScout's tool for the **FLOW** lens - comparing variation across factors.

---

## Purpose

_"Which upstream inputs explain the variation I see downstream?"_

The Boxplot reveals:

- Comparison across factors (Machine A vs B vs C)
- Between-group vs within-group variation
- Which subgroup contributes most variation
- The "soup ingredients" that create the output

---

## Key Elements

| Element     | Description                                     |
| ----------- | ----------------------------------------------- |
| Box         | Interquartile range (IQR, 25th-75th percentile) |
| Median line | Middle value (50th percentile)                  |
| Whiskers    | Extend to 1.5×IQR from box                      |
| Outliers    | Points beyond whiskers                          |

---

## ANOVA Statistics

When comparing factors, VariScout calculates:

| Statistic        | Description                      |
| ---------------- | -------------------------------- |
| F-statistic      | Ratio of between/within variance |
| p-value          | Probability of chance difference |
| η² (eta-squared) | Proportion of variance explained |

---

## Interpretation

| Pattern               | Meaning                         |
| --------------------- | ------------------------------- |
| Non-overlapping boxes | Significant difference          |
| High η²               | Factor explains much variation  |
| Wide box              | High variation within group     |
| Many outliers         | Check data quality or subgroups |

---

## Violin Mode (Distribution Shape)

Toggle **Show distribution shape** in Settings to switch to violin-primary rendering (industry standard, matching Seaborn/Plotly/ggplot2). This uses Kernel Density Estimation (KDE) with a Gaussian kernel and Silverman's rule-of-thumb bandwidth.

| Pattern           | What the violin reveals                              |
| ----------------- | ---------------------------------------------------- |
| Single peak       | Unimodal process, well-centered                      |
| Two peaks         | Bimodal distribution — likely two process conditions |
| Skewed shape      | Asymmetric process — investigate cause               |
| Wide/narrow shape | Variation magnitude at a glance                      |

When enabled, the density curve becomes the dominant shape with a thin IQR box inside showing Q1-Q3 range, median line, and mean diamond. Whiskers and outliers are hidden since the density curve conveys the full distribution shape.

Available in PWA and Azure App. Not available in Excel Add-in (core SPC only).

---

## Linked Filtering

Click any box to:

- Filter all charts to that subgroup
- See I-Chart for just that factor level
- Continue drill-down analysis

---

---

## Technical Reference

VariScout's implementation:

```typescript
// From @variscout/core
import { calculateAnova, getEtaSquared } from '@variscout/core';

const anova = calculateAnova(data, 'Machine', 'Weight');
// Returns: { fStatistic, pValue, etaSquared, groups }

const etaSq = getEtaSquared(data, 'Machine', 'Weight');
// Returns: number (0-1)
```

**Test coverage:** See `packages/core/src/__tests__/stats.test.ts` for ANOVA tests.

---

## See Also

- [FLOW Lens](../../01-vision/four-lenses/flow.md) - Upstream factor concepts
- [Drill-Down](../navigation/drill-down.md) - Multi-level factor exploration
- [I-Chart](i-chart.md) - Previous step: detect instability over time
- [Pareto](pareto.md) - Next step: rank contribution of factors
- [Regression](regression.md) - When to check for interactions
- [Chart Design](../../06-design-system/charts/boxplot.md)
- [Glossary: η² (Eta-squared)](../../glossary.md#eta-squared)
- [Glossary: F-statistic](../../glossary.md#f-statistic)
- [Case: Bottleneck](../../04-cases/bottleneck/index.md) - Factor comparison example
