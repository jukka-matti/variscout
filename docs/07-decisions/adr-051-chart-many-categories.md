---
title: 'ADR-051: Chart Handling for Many Categories'
---

# ADR-051: Chart Handling for Many Categories

**Status:** Accepted
**Date:** 2026-03-29
**Deciders:** JM

## Context

With wide-form data support (ADR-050), datasets can produce 80+ categories after stacking (e.g., 82 countries). The standard Pareto and Boxplot charts had no category limits and rendered all categories with horizontal labels, making them unreadable when categories exceeded ~10.

User testing with the Finland arrivals dataset confirmed this — the Pareto chart with 82 country bars was completely unusable due to label crowding.

Performance mode charts already handled this: `PerformancePareto` has `maxDisplayed=20` with label rotation and truncation, and `PerformanceBoxplot` has `maxDisplayed=5`.

## Decision

### Pareto: Top N + "Others" aggregation

When categories exceed 20 (configurable via `maxCategories`):

- Show top 20 categories sorted by value
- Aggregate remaining categories into an "Others" bar (muted color)
- Cumulative line includes "Others" in the total
- `PARETO_MAX_CATEGORIES = 20` constant exported from `useParetoChartData`

### Both Pareto and Boxplot: Label rotation + truncation

When categories exceed 10:

- Rotate X-axis labels -45 degrees
- Truncate labels to 12 characters + "…"

## Consequences

- Charts remain readable with any number of categories
- The 80% line in Pareto is meaningful even with many categories (top 20 + Others = 100%)
- "Others" bar is visually distinct (muted color) so users understand it's an aggregate
- Boxplot shows all categories (no "Others" grouping) — users drill-down to reduce
- Consistent with PerformancePareto patterns, reducing code divergence

## Implementation

- `packages/hooks/src/useParetoChartData.ts` — `PARETO_MAX_CATEGORIES`, "Others" aggregation
- `packages/charts/src/ParetoChart.tsx` — Label rotation, truncation, `othersKey` muted styling
- `packages/charts/src/Boxplot.tsx` — Label rotation + truncation for 10+ categories
