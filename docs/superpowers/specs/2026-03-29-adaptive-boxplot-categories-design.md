---
title: Adaptive Boxplot Category Limits
audience: [developer, analyst]
category: architecture
status: delivered
related: [boxplot, charts, wide-form, responsive]
---

# Adaptive Boxplot Category Limits

## Context

With wide-form data support (ADR-050), datasets can produce 80+ categories after stacking. The Pareto chart handles this with Top 20 + "Others" aggregation (ADR-051), but boxplots can't meaningfully aggregate distributions. With 82 country boxes at ~7px each, the chart is unreadable.

User testing confirmed: after stacking Finland arrivals data and asking "which countries have the highest amount?", the boxplot was the natural tool but couldn't deliver with 82 categories.

## Design: Three-Layer Architecture

### Layer 1 — Width-Driven Limits

Calculate max visible categories from container width using a minimum box step of 50px (includes scaleBand padding).

| Context                  | Width   | Max categories | Box width |
| ------------------------ | ------- | -------------- | --------- |
| Mobile carousel          | ~300px  | 5              | ~36px     |
| Tablet card              | ~500px  | 8              | ~38px     |
| Desktop card (grid)      | ~700px  | 12             | ~35px     |
| Desktop scroll / focused | ~1100px | 20             | ~33px     |
| Export                   | 1200px  | 20             | ~36px     |

Formula: `maxCategories = floor(innerWidth / MIN_BOX_STEP)` where `MIN_BOX_STEP = 50`.

When total categories <= maxCategories, all are shown (no filtering). The adaptive limit only activates when there are more categories than fit.

### Layer 2 — Specs-Aware Priority

Which N categories to show depends on the measurement context:

| Context                        | "Worst" means        | Selection criterion                                  |
| ------------------------------ | -------------------- | ---------------------------------------------------- |
| `smaller-is-better` (USL only) | Highest values       | Categories with highest median                       |
| `larger-is-better` (LSL only)  | Lowest values        | Categories with lowest median                        |
| `nominal/target` (USL + LSL)   | Farthest from target | Categories with median farthest from target/midpoint |
| No specs (exploratory)         | Most variation       | Categories with highest IQR                          |
| User sort override             | User's choice        | Sort criterion (mean/spread/name) drives selection   |

The sort override rule: when the user explicitly changes the sort in BoxplotDisplayToggle, the sort criterion takes precedence over specs-based priority. This makes the behavior predictable — "I sorted by spread, so I see the top N by spread."

### Layer 3 — User Control

Auto mode with manual override, accessed via BoxplotDisplayToggle popover:

**Auto mode (default):**

- Shows "Top N by [criterion]" label
- Categories are read-only (determined by Layer 2 logic)
- Count badge: "8 of 82"

**Manual mode:**

- Toggle auto off → searchable checkbox list appears
- Each category shows name + mean value
- Quick actions: All / None / Top 10
- Scrollable list (max-height 160px)
- Selected categories persist until auto is toggled back on

**Overflow indicator (on chart):**

- When categories are truncated, a subtle "⋯ +N" indicator appears at the right edge of the chart
- Clickable — opens BoxplotDisplayToggle to categories section
- Status line below chart: "Top 5 by mean ↓ · 82 categories total"

### How Pareto and Boxplot differ

| Aspect                | Pareto                                            | Boxplot                        |
| --------------------- | ------------------------------------------------- | ------------------------------ |
| Overflow handling     | Aggregate into "Others" bar                       | Filter (show top N, hide rest) |
| Why                   | Ranking is Pareto's purpose; "Others" makes sense | Can't aggregate distributions  |
| User access to hidden | Not shown (aggregated)                            | Manual override to pick any    |
| Limit                 | Fixed 20 (PARETO_MAX_CATEGORIES)                  | Adaptive based on width        |

## Core Function: `selectBoxplotCategories()`

Location: `packages/core/src/stats/boxplotCategories.ts`

```typescript
interface CategoryStat {
  key: string;
  median: number;
  iqr: number;
  mean: number;
  count: number;
}

function selectBoxplotCategories(
  categoryStats: CategoryStat[],
  maxCount: number,
  specs: SpecLimits,
  sortBy: BoxplotSortBy,
  sortDirection: BoxplotSortDirection
): string[];
```

Pure function. Computes priority ranking based on specs + sort, returns top N category keys.

## Hook: `useBoxplotCategoryLimit`

Location: `packages/hooks/src/useBoxplotCategoryLimit.ts`

```typescript
interface UseBoxplotCategoryLimitOptions {
  parentWidth: number;
  data: BoxplotGroupData[];
  specs: SpecLimits;
  sortBy: BoxplotSortBy;
  sortDirection: BoxplotSortDirection;
  isAutoMode: boolean;
  manualSelection?: string[];
}

interface UseBoxplotCategoryLimitReturn {
  visibleCategories: string[];
  totalCategories: number;
  maxCategories: number;
  isAutoMode: boolean;
  priorityCriterion: string; // "mean" | "spread" | "distance from target" | "name"
}
```

## State Persistence

`DisplayOptions` gains:

- `boxplotVisibleCategories?: string[]` — manual selection (only when auto mode is off)
- `boxplotAutoMode?: boolean` — default true

## Testing

- Unit tests for `selectBoxplotCategories()`: all priority modes, sort override, edge cases
- Hook tests for `useBoxplotCategoryLimit`: width calculation, mode switching
- Component tests: BoxplotDisplayToggle categories section visibility, toggle behavior

## Scope Boundaries

**In scope:**

- `selectBoxplotCategories()` pure function
- `useBoxplotCategoryLimit` hook
- BoxplotDisplayToggle categories section (auto/manual)
- BoxplotBase `visibleCategories` prop + overflow indicator
- Dashboard wiring for both apps
- State persistence in DisplayOptions

**Out of scope:**

- Boxplot horizontal scroll (alternative to limiting)
- Category grouping/clustering ("combine similar countries")
- Animated transitions when categories change
