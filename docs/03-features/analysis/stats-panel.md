---
title: Statistics Panel
audience: [analyst, engineer]
category: analysis
status: stable
related: [capability, probability-plot, specs, analysis-dashboard]
---

# Statistics Panel

<!-- journey-phase: scout -->

> **Journey phase:** SCOUT — summary metrics and spec context for the current analysis scope.

VariScout no longer treats "stats" as one monolithic panel in the main Analysis view. Statistics now live across three coordinated surfaces:

- **Top strip (`ProcessHealthBar`)** — fast summary and spec shortcut
- **Adaptive lens** — Probability plus Distribution/Capability, and optional Pareto
- **Detailed side panel / secondary views** — deeper stats, data, questions, or what-if tools where supported

---

## Normal Laptop View

In the laptop-first Analysis dashboard:

- the **top strip** owns quick summary values such as `x̄`, `σ`, and `n`
- the **spec shortcut** lives in the top strip
- the **adaptive lens** owns the distribution/spec reading workflow

That means the I-Chart header does **not** repeat the same summary numbers in the normal view.

---

## What The Analyst Sees

### 1. Top Strip Summary

The top strip gives the analyst fast scope awareness:

- current mean
- current spread
- sample count
- active filters
- factor-management entry
- spec shortcut

When specs are not configured, this is the main statistical summary surface.

### 2. Adaptive Lens

The right-hand adaptive card carries the diagnostic/statistical reading flow:

| Context                    | Tabs shown                                |
| -------------------------- | ----------------------------------------- |
| No specs, no subgroup data | `Probability` + `Distribution`            |
| Specs, no subgroup data    | `Probability` + `Capability`              |
| No specs, subgroup data    | `Probability` + `Distribution` + `Pareto` |
| Specs, subgroup data       | `Probability` + `Capability` + `Pareto`   |

`Probability` is the default tab because it is the first distribution check after the I-Chart in VariScout's EDA sequence.

### 3. Detailed Stats Surfaces

Detailed stats still exist where needed:

- sidebars and secondary panels in Azure
- focused chart view for chart-specific export and reading
- report views and other downstream evidence surfaces

The key design point is that these are **secondary** to the main Analysis reading path.

---

## Distribution vs Capability

The histogram surface changes meaning based on specs:

- **No specs** → label it `Distribution`
- **Specs exist** → label it `Capability`

The underlying chart is still the histogram/distribution view, but the label follows the analyst's question rather than the drawing primitive.

---

## Spec Input Flow

Specification limits can be set from:

1. **Column Mapping** — before analysis starts
2. **Top strip shortcut** — during analysis

Once specs exist:

- the adaptive lens switches from `Distribution` to `Capability`
- capability metrics become meaningful
- the top strip can summarize capability context without duplicating chart-local controls

---

## Design Principles

- Put fast summary in the top strip
- Keep distribution/spec reading in the adaptive lens
- Do not duplicate the same numbers across the top strip and hero chart header
- Let labels reflect the analyst's question, not just the chart primitive

---

## See Also

- [Capability Analysis](capability.md)
- [Probability Plot](probability-plot.md)
- [Analysis Dashboard Pattern](../../06-design-system/patterns/analysis-dashboard.md)
