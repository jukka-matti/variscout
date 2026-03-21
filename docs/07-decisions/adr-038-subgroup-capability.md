---
title: 'ADR-038: Subgroup Capability Analysis (Cp/Cpk per Subgroup)'
status: Accepted
date: 2026-03-21
---

# ADR-038: Subgroup Capability Analysis

## Status

Accepted

## Date

2026-03-21

## Context

VariScout targets the supplier market, where quality professionals need to demonstrate process capability stability — not just a single Pp/Ppk number. A process can have an acceptable overall Ppk while hiding capability shifts across batches, shifts, or time periods.

Plotting Cp and Cpk per subgroup on the I-Chart reveals whether **capability itself is stable**. An in-control Cpk I-Chart means Cpk ≈ Ppk naturally; out-of-control signals show _when and how_ capability shifts. The gap between Cp and Cpk directly visualizes centering loss.

## Decision

Add a **capability mode** to the standard analysis dashboard that calculates and plots Cp/Cpk per subgroup:

1. **Subgroup formation**: Two methods — column-based (e.g., Batch) or fixed-size (consecutive groups of n, default 5)
2. **I-Chart dual series**: Capability mode shows both Cp and Cpk as two series with separate control limits. Primary series = Cpk (blue), secondary = Cp (green)
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
