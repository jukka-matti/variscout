---
tier: living
purpose: decide
title: 'ADR-038: Subgroup Capability Analysis (Cp/Cpk per Subgroup)'
status: active
date: 2026-03-21
layer: L5
---

# ADR-038: Subgroup Capability Analysis

## Status

Accepted

> **Amendment 2026-05-31 ([ADR-089](adr-089-retire-mode-lens-user-axis.md), [ADR-084](adr-084-capability-indices-cp-cpk-only.md)).** Two terms in this ADR are now stale:
>
> - **"Capability mode" is a _view_, not a mode.** ADR-089 retires mode/lens as user axes; `AnalysisMode` is a Frame-derived data-shape discriminant. Values ⇄ Capability is the one surviving analysis _view_ — a specs-gated `StandardIChartMetric` toggle on the I-Chart. It is explicitly _not_ an `AnalysisMode` value and _not_ a lens. Read "capability mode" / "mode toggle" below as "capability **view** / **view** toggle".
> - **Pp/Ppk is gone.** ADR-084 makes VariScout Cp/Cpk-only against within-subgroup σ̂. The Context's "single Pp/Ppk number" framing motivated this ADR but the indices themselves are no longer surfaced anywhere. "Stability" here means per-subgroup Cp/Cpk, never Pp/Ppk.
>
> The engine, persistence, and `CapabilityMetricToggle` are unchanged — only the vocabulary is corrected.

## Date

2026-03-21

## Context

VariScout targets the supplier market, where quality professionals need to demonstrate process capability stability — not just a single overall capability number. A process can have acceptable overall capability while hiding capability shifts across batches, shifts, or time periods. (The original framing here contrasted against an overall Pp/Ppk number; per the amendment above, VariScout is now Cp/Cpk-only — [ADR-084](adr-084-capability-indices-cp-cpk-only.md).)

Plotting Cp and Cpk per subgroup on the I-Chart reveals whether **capability itself is stable**. An in-control Cpk I-Chart shows capability holds across subgroups; out-of-control signals show _when and how_ capability shifts. The gap between Cp and Cpk directly visualizes centering loss.

## Decision

Add a **capability view** (toggled, not a mode — see amendment) to the standard analysis dashboard that calculates and plots Cp/Cpk per subgroup:

1. **Subgroup formation**: Two methods — column-based (e.g., Batch) or fixed-size (consecutive groups of n, default 5)
2. **I-Chart dual series**: The capability view shows both Cp and Cpk as two series with separate control limits. Primary series = Cpk (blue), secondary = Cp (green)
3. **Boxplot**: Shows Cpk (or Cp) distribution per factor level
4. **Toggle UI**: Segmented control "Values | Capability" in I-Chart header, with subgroup configuration gear icon
5. **Persistence**: Mode toggle in DisplayOptions, subgroup config in AnalysisState

### Architecture

- Core: `subgroupCapability.ts` — grouping, capability calculation, generic control limits
- Hooks: `useCapabilityIChartData`, `useCapabilityBoxplotData` — follow Yamazumi hook patterns
- Charts: `IChartBase` extended with optional secondary series props (~30 lines)
- UI: `CapabilityMetricToggle`, `SubgroupConfigPopover` — follow Yamazumi toggle patterns
- State: `StandardIChartMetric` type, `subgroupConfig` in AnalysisState

### Key formulas

- Cp = (USL − LSL) / (6σ_within) — requires both specs
- Cpk = min((USL − mean)/(3σ), (mean − LSL)/(3σ)) — requires at least one spec
- σ_within per subgroup uses moving range method (same as `calculateMovingRangeSigma`)
- Control limits on the Cp/Cpk series: UCL = mean + 3σ, LCL = max(0, mean − 3σ)

## Consequences

### Positive

- Suppliers can demonstrate capability stability (not just a number)
- Leverages existing chart infrastructure — no new chart components needed
- Dual Cp/Cpk visualization makes centering loss immediately visible
- Subgroup-by-column reuses existing factor columns naturally

### Negative

- Adds complexity to the I-Chart header (another toggle)
- Fixed-size subgrouping requires time-ordered data (same assumption as standard I-Chart)
- Drops trailing partial subgroup in fixed-size mode (standard practice but worth noting)

### Deferred

- Pareto in capability mode (rank factors by median Cpk)
- Staged analysis + capability interaction
- Cpk trend regression (linear fit on Cpk over time)

## Implementation

Delivered in feature branch `feature/subgroup-capability`. New files:

- `packages/core/src/stats/subgroupCapability.ts` — types + calculation
- `packages/hooks/src/useCapabilityIChartData.ts` — dual-series data hook
- `packages/hooks/src/useCapabilityBoxplotData.ts` — boxplot capability data hook
- `packages/ui/src/components/CapabilityMetricToggle/` — mode toggle
- `packages/ui/src/components/SubgroupConfig/` — config popover
