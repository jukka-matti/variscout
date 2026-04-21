---
title: Analysis Dashboard Pattern
audience: [analyst, engineer]
category: reference
status: stable
related: [dashboard, boxplot, pareto, probability-plot, capability]
---

# Analysis Dashboard Pattern

Canonical layout contract for the main **Analysis** workspace.

This pattern is the source of truth for the laptop-first SCOUT dashboard. It defines what each region of the dashboard is for, what changes with context, and what must stay stable.

---

## Design Target

The baseline target is **full-screen laptop**. This is the normal case the layout must optimize first.

- **Laptop baseline**: one hero chart plus two supporting panels
- **XL / large monitor**: may reveal more simultaneous content, but must preserve the same mental model
- **Small windows**: degrade from the laptop baseline; do not become the primary design driver

---

## Laptop Baseline

```
┌──────────────────────────────────────────────────────────────┐
│  Top strip: x̄ · σ · n · filters · specs · export           │
├──────────────────────────────────────────────────────────────┤
│  I-Chart (always visible hero)                              │
├───────────────────────────────┬──────────────────────────────┤
│  Variation Sources            │  Adaptive Lens              │
│  Boxplot / subgroup drill     │  Probability                │
│  or guided empty state        │  Distribution or Capability │
│                               │  Pareto (when meaningful)   │
└───────────────────────────────┴──────────────────────────────┘
```

The baseline question flow is:

1. What is the process doing over sequence?
2. Which subgroup explains the variation?
3. What does the distribution/spec picture look like?
4. If ranking is meaningful, where should I drill next?

---

## Region Ownership

### Top Strip

The top strip owns shared dashboard summary and global actions:

- summary values such as `x̄`, `σ`, and `n`
- active filter chips
- factor-management entry
- spec shortcut
- dashboard-level export

It should **not** repeat chart-local controls or compete with the hero chart for attention.

### I-Chart

The I-Chart is always visible in the Analysis dashboard.

- It is the main orientation surface
- It stays present whether the analyst is reading values or subgroup capability
- It should not repeat top-strip summary stats in the normal laptop view

### Variation Sources Panel

The left lower panel stays about **subgroups and variation source**, not general utility.

- With subgroup data: show Boxplot / factor comparison and drill-down controls
- Without subgroup data: keep the slot visible as a guided empty state

The empty state should explain what the analyst is missing and how to unlock drill-down:

- use `Factors` to map subgroup columns
- if timestamp data exists, suggest extracting time-based factors
- if selection-based factor creation is relevant, point to that workflow

### Adaptive Lens

The right lower panel is a **context-aware exploratory lens** with no shared title. Tabs speak for themselves.

- `Probability` is always present
- `Distribution` is shown when specs are not configured
- `Capability` replaces `Distribution` once specs exist
- `Pareto` appears only when the dataset has a meaningful ranking dimension

This keeps the panel honest. The dashboard should not advertise tabs that the current dataset cannot support.

---

## Adaptive Lens Rules

| Data context               | Tabs shown                                |
| -------------------------- | ----------------------------------------- |
| No subgroup data, no specs | `Probability` + `Distribution`            |
| No subgroup data, specs    | `Probability` + `Capability`              |
| Subgroup data, no specs    | `Probability` + `Distribution` + `Pareto` |
| Subgroup data, specs       | `Probability` + `Capability` + `Pareto`   |

`Probability` is the default tab because it is the first diagnostic check after the I-Chart in VariScout's EDA sequence.

---

## Control Ownership

Chart-local selectors remain visible, but they should live in a **local subheader** under the chart title rather than in one crowded header row.

- I-Chart local controls: outcome, stages, capability toggle, subgroup config
- Variation Sources local controls: factor selector and subgroup display controls
- Adaptive Lens local controls: the tabs themselves, plus any mode-specific control only when active

Visible utility chrome in the normal dashboard is intentionally minimal:

- keep `maximize`
- move copy/download/share to focused view or secondary UI

---

## Duplication Rules

The laptop baseline removes duplicate information and duplicate actions.

- Do not repeat `UCL / Mean / LCL / Specs` in the I-Chart header when the top strip already owns summary context
- Do not show global export and per-card export toolbars at the same visual priority
- Do not split the same decision across the top strip and a chart header without a strong reason

---

## XL Expansion

Large monitors can support more simultaneous analysis, but expansion must remain an extension of the laptop baseline.

- The hero I-Chart still anchors the page
- The subgroup panel still owns variation-source drill-down
- The adaptive lens still owns Probability + Distribution/Capability + optional Pareto

XL layouts may reveal more content at once, but they must not change the meaning of each region.

---

## See Also

- [Dashboard Design Principles](dashboard-design.md)
- [Dashboard Layout Architecture](../../05-technical/architecture/dashboard-layout.md)
- [Analysis Flow](../../03-features/workflows/analysis-flow.md)
