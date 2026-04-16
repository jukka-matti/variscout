---
title: Defect Mode Evidence Map Integration
audience: [engineer, analyst]
category: analysis
status: delivered
related: [defect, evidence-map, regression, cross-type, investigation]
---

# Defect Mode Evidence Map Integration

## Context

The Evidence Map is factor-centric: nodes are factor column names (Machine, Shift, Product), positioned by R²adj from Best Subsets regression. Defect mode introduces defect types as a categorical dimension that decomposes the outcome — they're failure modes, not factors. An MBB thinks: "Different defect types have different root causes. I want to see the cause-and-effect for each failure mode separately, and then compare which factors are shared across types."

The existing regression engine (`computeBestSubsets`) works on aggregated defect rates without modification. The Evidence Map visualization layer (`useEvidenceMapData`) is mode-agnostic. The integration is a matter of controlling what data feeds the existing pipeline, plus a new cross-type meta-view.

## Design Principle

**Y decomposition, not X expansion.** Defect types decompose the outcome (Y), they don't become additional factors (X). The Evidence Map node model stays factor-centric. A dropdown scopes which Y the map shows: total defect rate, a specific type's rate, or a cross-type comparison. This matches the MBB mental model: fishbone per failure mode, shared causes across modes.

## Three-View Model

### View 1: All Defects (default)

Standard factor-centric map on total defect rate. Uses the existing `bestSubsets` result from the normal analysis pipeline — zero extra computation.

- Outcome node: "Defect Rate" (red)
- Factor nodes: positioned by R²adj on total rate
- Edges: standard relationship classification
- Equation bar: best overall model

### View 2: Per-Type (e.g., "Scratch Defects")

Same map layout, but regression re-runs on data filtered to one defect type. Factor ranking and R²adj values change — a factor that's weak overall may be strong for a specific type.

- Outcome node: "[Type] Rate" (amber, type name shown)
- Factor nodes: re-positioned by per-type R²adj
- Equation bar: best model for this type
- Sample size shown in header (e.g., "n=42 rows")
- If insufficient data: centered warning with row count and suggestion to coarsen aggregation

### View 3: Cross-Type Insight

Meta-view comparing factor significance across all analyzed types. No single regression — derived from cached per-type results.

- No outcome node (multiple outcomes)
- Factor nodes: sized by number of defect types where the factor is significant (R²adj > threshold)
- Each node shows colored badges indicating which defect types
- Nodes with 0 types shown faded/dashed (ruled out across all analyzed types)
- Subtitle: "Analyzed N of M types — explore more types to complete the picture"
- Insight callout when a factor drives 2+ types: "[Factor] drives [types] → systemic cause"

## Lazy Computation with Progressive Cache

Computation follows Approach C: lazy per-type with progressive cross-type.

### Cache Structure

```typescript
interface DefectTypeMapCache {
  typeResults: Map<string, BestSubsetsResult>;
  allTypesResult: BestSubsetsResult | null;
  crossTypeMatrix: Map<string, { types: string[]; avgRSquaredAdj: number }>;
}
```

### Computation Strategy

- **All Defects**: uses existing `bestSubsets` from normal pipeline (no extra computation)
- **Per-type**: on first access, filters `defectResult.data` to that type, removes the defect type column from factors, runs `computeBestSubsets()`, caches result. Subsequent visits are instant from cache.
- **Cross-type**: derived from all cached `typeResults`. Each time a per-type result is computed, the cross-type matrix updates. Shows "N of M types analyzed."
- **Cache invalidation**: when `defectResult` changes (data reload, upstream filter change), all cached results clear and recompute lazily.

### Sample Size Guard

Before computing per-type regression:

```typescript
const minRequired = MIN_OBS_PER_PREDICTOR * factors.length;
if (filteredRows.length < minRequired) {
  return { insufficient: true, have: filteredRows.length, need: minRequired };
}
```

Minimum threshold: `MIN_OBS_PER_PREDICTOR = 10` (from `bestSubsets.ts`). With 5 factors, need at least 50 aggregated rows per type. If insufficient, show warning state instead of computing.

## Cross-Type Significance Threshold

A factor is "significant" for a defect type when its R²adj contribution exceeds a threshold. This determines badge assignment on the cross-type view.

Threshold: R²adj >= 0.05 (5% of variance explained). This matches the existing auto-ruled-out threshold in question generation: factors below 5% are considered insignificant.

## View Selector UI

Pill/tab group in the Evidence Map header, visible only when `analysisMode === 'defect'`:

```
[All Defects] [Scratch●] [Seal Failure●] [Dent○] [Contamination○] [Cross-Type 2/4]
```

- "All Defects" always first, default active
- Per-type pills ordered by frequency (most defects first, matching Pareto)
- Filled dot (●) = cached/analyzed, empty dot (○) = not yet visited
- "Cross-Type" always last, with green badge showing analyzed count
- Active pill highlighted: blue for All/per-type, green for Cross-Type

## Investigation Layers (2 + 3)

CausalLinks and SuspectedCause hubs are **view-independent**. They persist across all three views:

- Created in any view, visible in all views
- Causal links connect factor nodes (which exist in all views, just repositioned)
- Convergence zones (Layer 3) overlay on whatever statistical layout is active
- This means: investigate in "All Defects" view, create causal links, then switch to "Scratch" view — all annotations remain, factor nodes just have different positions/sizes

## Hook Architecture

### `useDefectEvidenceMap` (new, in `@variscout/hooks`)

```typescript
interface UseDefectEvidenceMapOptions {
  defectResult: DefectTransformResult | null;
  defectMapping: DefectMapping | null;
  allTypesBestSubsets: BestSubsetsResult | null;
  selectedView: 'all' | string | 'cross-type'; // 'all', type name, or 'cross-type'
  factors: string[];
}

interface UseDefectEvidenceMapResult {
  bestSubsets: BestSubsetsResult | null; // For current view (passed to useEvidenceMapData)
  crossTypeMatrix: Map<string, { types: string[]; avgRSquaredAdj: number }> | null;
  analyzedTypes: string[];
  totalTypes: string[];
  isComputing: boolean;
  insufficient: { have: number; need: number } | null;
}
```

- When `selectedView === 'all'`: returns `allTypesBestSubsets` directly
- When `selectedView` is a type name: filters data, computes or retrieves from cache
- When `selectedView === 'cross-type'`: returns null for bestSubsets, populates crossTypeMatrix
- The existing `useEvidenceMapData` receives the result and renders normally

### Integration Point

The hook sits between the defect transform and the existing Evidence Map pipeline:

```
useDefectTransform → useDefectEvidenceMap → useEvidenceMapData → EvidenceMap component
                          ↑
                    view selector state
```

No changes needed to `useEvidenceMapData` or the chart component — they receive `BestSubsetsResult` and render as always.

## Cross-Type View Rendering

The cross-type view requires a different rendering path in the Evidence Map since there's no single `BestSubsetsResult` to layout:

- Factor nodes positioned in a circle (same radial layout function, but radius proportional to `types.length` instead of R²adj — most systemic factors closest to center)
- Node radius proportional to `types.length / totalTypes.length`
- Badge rendering: small colored rectangles below each node, one per type
- Insight line: when a factor has `types.length >= 2`, render a green highlight and "systemic" label

This is the only new rendering logic needed in the chart component. A `crossTypeData` prop on the Evidence Map component controls this alternate mode.

## Statistical Validity

Validated against literature and engine capabilities:

- **Per-type regression**: standard failure-mode-specific analysis in quality engineering. Simpson's Paradox justifies analyzing types separately.
- **OLS on aggregated rates**: valid for EDA screening when aggregation groups have >= 10-20 events. Not valid for formal hypothesis testing — CoScout coaching frames results as "contribution indicators."
- **Cross-type comparison**: uses R²adj (effect size) not p-values — better for comparing across different sample sizes per type.
- **Engine support**: `computeBestSubsets()` works on aggregated rate data without modification. Minimum 10 observations per predictor enforced.
- **Neither Minitab nor JMP offer "attribute Best Subsets"** — this is a market gap.

## What's Reused vs. New

### Reused

- `computeBestSubsets()` — no changes
- `useEvidenceMapData` — no changes (receives BestSubsetsResult as before)
- Evidence Map chart component (Layers 1-3) — no changes for All/Per-Type views
- CausalLink and SuspectedCause system — view-independent
- `computeDefectRates()` — already produces data with defect type column

### New

1. `useDefectEvidenceMap` hook — cache management, lazy computation, cross-type derivation
2. View selector component — pill tabs with dot indicators and Cross-Type badge
3. Cross-type rendering in Evidence Map — alternate node layout with type badges
4. Insufficient data state component
5. Sample size guard logic

## Verification

1. **All Defects view**: identical to current Evidence Map on total defect rate
2. **Per-type view**: switch to "Scratch" → map re-layouts with different R²adj values. Machine should be more prominent if it specifically drives scratches.
3. **Cache**: switch to "Scratch" (computes), switch to "All", switch back to "Scratch" (instant from cache)
4. **Cross-type**: after analyzing 2+ types, Cross-Type view shows shared causes. Machine badge count matches per-type results.
5. **Insufficient data**: select a rare defect type with few rows → warning message, no regression attempt
6. **Investigation persistence**: create a causal link in "All Defects" view, switch to "Scratch" → link still visible
7. **Cache invalidation**: change upstream filter → all cached per-type results clear
