---
title: Capability Mode Coherence
audience: [engineer]
category: analysis
status: delivered
related: [capability, cpk, boxplot, i-chart, process-health-bar]
---

# Capability Mode Coherence

## Problem

When the analyst toggles to capability mode (Values → Capability), only the I-Chart fully transforms. The rest of the dashboard — boxplot labels, stats toolbar, dot colors — stays in measurement-land. This creates a disjointed experience where the analyst's mental frame has shifted to "am I meeting spec targets?" but most of the UI still speaks raw-measurement language.

Additionally, boxplots across all modes render misleading box-and-whisker graphics when categories have very few data points, giving a false sense of distributional knowledge.

## Changes

### 1. Universal Dot Plot Fallback (all modes)

**Rule:** When a boxplot category has fewer than 7 data points, render individual dots (jittered strip plot) instead of a box-and-whisker for that category.

- Applies to: `BoxplotBase`, `PerformanceBoxplotBase` — all modes, all contexts
- **Per-category decision** — a single chart can show boxes for some categories and dots for others
- Dots use the same color as the box would have (direction coloring, highlight colors still apply)
- No median/quartile lines for dot-mode categories (stats are meaningless with < 7 values)
- Dots are vertically positioned at their actual value, horizontally jittered randomly within ~40% of the category band width to avoid overlap
- Threshold constant: `MIN_BOXPLOT_VALUES = 7` (exported from `@variscout/charts`)

**Why 7:** A boxplot requires at minimum 5 values for meaningful quartiles, but even 5 is unreliable. 7 provides a reasonable margin. This follows Minitab's approach of switching to individual value plots for small samples.

### 2. Capability I-Chart Series Redesign

**Current:** Cpk = blue, Cp = green, no visual connection.

**New:**

| Element            | Style                          | Value                                           |
| ------------------ | ------------------------------ | ----------------------------------------------- |
| Cpk dots           | Solid filled, r=5              | `#3b82f6` (blue, `chartColors.mean`)            |
| Cp dots            | Solid filled, r=4, opacity 0.7 | `#8b5cf6` (purple)                              |
| Connecting line    | Per Cpk-Cp pair                | `#94a3b8` (grey), stroke-width 1.5, opacity 0.5 |
| Cpk control limits | Dashed red (unchanged)         | UCL/LCL from Cpk series values                  |
| Cpk target         | Green dashed (unchanged)       | User-configured target (default 1.33)           |
| Violations         | Red dot (unchanged)            | Cpk dots turn red when breaching UCL/LCL        |
| Nelson rules       | Unchanged                      | Same shapes (diamonds ◆, squares ■), same logic |

**Connecting line:** A vertical grey line from each Cpk dot to its paired Cp dot. Cp is always ≥ Cpk (Cp measures spread only, Cpk adds centering loss), so the line always goes upward. The length of the line directly visualizes centering loss — longer line = more off-center.

**Legend:** "Cpk (actual)" solid blue dot, "Cp (potential)" purple dot, "Centering gap" grey line segment.

**One-sided specs:** When only USL or LSL is set, Cp is undefined — only Cpk series shown, no connecting lines. Existing behavior preserved.

**Implementation:**

- Add purple to chart color constants (`chartColors.cpPotential = '#8b5cf6'`)
- `IChartBase`: new `secondaryColor` prop (defaults to purple when secondary series present)
- `IChartBase`: render `<line>` elements between paired primary/secondary data points
- Remove existing green color for secondary series

### 3. ProcessHealthBar in Capability Mode

**Current:** Shows raw measurement stats regardless of mode.

**New behavior when `isCapabilityMode` is true:**

| Slot          | Standard mode (unchanged) | Capability mode                 |
| ------------- | ------------------------- | ------------------------------- |
| Primary KPI   | Cpk (or σ if no specs)    | Cpk (overall, same calculation) |
| Secondary KPI | Pass rate %               | % subgroups ≥ Cpk target        |
| Detail stats  | x̄, σ, n                   | x̄, σ, n subgroups               |

- Overall Cpk is the same number as in standard mode — the anchor metric
- "% subgroups ≥ target" format: "85% ≥ 1.33" — shows both the percentage and the target value
- Sample count displays number of subgroups, not total measurements
- Data source: `useCapabilityIChartData` already returns `subgroupsMeetingTarget` and `subgroupResults.length`

**Implementation:**

- New prop: `isCapabilityMode?: boolean`
- New prop: `capabilityStats?: { subgroupsMeetingTarget: number; totalSubgroups: number }`
- Conditional rendering in the secondary KPI slot and detail stats

### 4. Capability Boxplot Fixes

**Y-axis label:** "Cpk" when capability mode is active (currently stays as measurement column name).

**Cpk target reference line:** Horizontal green dashed line at the Cpk target value (e.g., 1.33). Same style as I-Chart target line. Lets analyst see which categories consistently meet target.

**Implementation:**

- `BoxplotWrapperBase`: pass `yAxisLabel="Cpk"` when `isCapabilityMode`
- `BoxplotBase`: new optional `targetLine?: { value: number; color: string; label?: string }` prop — renders horizontal dashed line. Reusable for other contexts.
- Spec lines: already hidden in capability mode (`specs={}`)
- Contribution bars: already hidden in capability mode

## Explicitly NOT in Scope

- **Pareto changes** — stays as variation contribution in capability mode (complements boxplot which shows Cpk by factor)
- **VerificationCard changes** — histogram + probability plot continue showing raw measurement distribution (useful as "reality check" against specs)
- **New analysis mode** — capability stays as sub-mode of standard (toggled via `displayOptions.standardIChartMetric`)
- **Strategy slot changes** — slots 2-4 remain `boxplot`, `pareto`, `stats`
- **Staged analysis + capability** — deferred (ADR-023)
- **Cpk trend regression** — deferred (ADR-038)

## Key Files

| Area                     | File                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| Boxplot base             | `packages/charts/src/Boxplot.tsx`                                  |
| Performance boxplot base | `packages/charts/src/PerformanceBoxplot.tsx`                       |
| Chart colors             | `packages/charts/src/colors.ts`                                    |
| I-Chart base             | `packages/charts/src/ichart/IChartBase.tsx`                        |
| I-Chart wrapper          | `packages/ui/src/components/IChartWrapper/index.tsx`               |
| Boxplot wrapper          | `packages/ui/src/components/BoxplotWrapper/index.tsx`              |
| ProcessHealthBar         | `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` |
| Capability I-Chart hook  | `packages/hooks/src/useCapabilityIChartData.ts`                    |
| Capability boxplot hook  | `packages/hooks/src/useCapabilityBoxplotData.ts`                   |
| Strategy registry        | `packages/core/src/analysisStrategy.ts`                            |

## Verification

1. **Dot plot fallback:** Load coffee sample data, drill by a factor with many levels so some categories have < 7 values. Verify those categories show dots, others show boxes.
2. **Capability I-Chart:** Enable capability mode with specs set. Verify blue Cpk + purple Cp dots with grey connecting lines. Verify violations still turn red. Verify one-sided specs show only Cpk series.
3. **ProcessHealthBar:** Toggle to capability mode. Verify toolbar shows overall Cpk + "X% ≥ Y" subgroup target metric + n subgroups.
4. **Capability boxplot:** Toggle to capability mode. Verify Y-axis says "Cpk", green dashed target line visible, no spec lines, dot fallback for small categories.
5. **No regressions:** Standard mode, Performance mode, Yamazumi mode all unchanged.
