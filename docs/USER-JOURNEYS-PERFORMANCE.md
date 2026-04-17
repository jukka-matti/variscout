---
title: Performance Mode — User Journey
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-17
related: [performance, journey, multi-channel, cpk, drill-down]
---

# Performance Mode — User Journey

## Who uses this mode

Process engineers responsible for multi-stream production equipment: bottling lines with 8–16 fill heads, injection molding presses with 4–32 cavities, multi-spindle machining centers, or dispensing systems with multiple nozzles. Their data arrives as wide-format exports — one row per sample, one column per channel. Their day-to-day question is not "is my process capable?" but "which head is the problem, and is it isolated to one or systemic across several?"

## What they want to achieve

The engineer wants to compare Cpk across all channels simultaneously, identify the worst performers immediately, and then drill into a single channel for root cause investigation — all without splitting the file by hand. The measurable outcome is a channel health ranking that prioritizes investigation effort correctly. A Cpk ≥ 1.33 across all channels confirms equipment qualification; anything below that threshold gets a drill-down.

## How they use VariScout for it

The engineer pastes or uploads wide-format data with columns named Head_1 through Head_8 (or Cavity_1, Nozzle_A, etc.) alongside optional factor columns such as Shift and Line. VariScout auto-detects the common column prefix pattern and offers Performance Mode. The engineer confirms which columns are measurement channels and sets LSL/USL specification limits that apply to all channels.

The dashboard opens in multi-channel overview:

- **Slot 1 — Performance I-Chart (Scatter)**: Each point is one channel at one time period. Points are colored by health status — excellent (Cpk ≥ 1.67), good (1.33–1.67), marginal (1.00–1.33), poor (< 1.00). The scatter view shows when a channel degraded, not just the final state.
- **Slot 2 — Performance Boxplot**: Distribution comparison across channels, limited to 5 at once. The engineer selects which channels to compare — typically the top 2 worst from the Pareto plus the best channel as a reference.
- **Slot 3 — Performance Pareto**: All channels ranked worst-first by Cpk, up to 20 channels shown. The channels using `operatorColors` (8-color palette) are consistently colored across all three charts. This is the first chart the engineer reads — a single glance identifies whether one channel is isolated or a cluster of channels is failing.
- **Slot 4 — Performance Capability**: Single-channel capability histogram for the `selectedMeasure`. The distribution overlaid against spec limits, with the full Cp/Cpk calculation.

The decision flow starts at Slot 3. If only one channel is Poor, the engineer clicks that bar — `selectedMeasure` updates, Slot 4 shows its histogram, and Slot 2 compares it against a reference channel. CoScout coaches: "Is Head_3's problem centering or spread? Compare Cp to Cpk — if Cp is acceptable but Cpk low, the head is capable but off-center. If Cp also fails, the variation itself is too wide."

If multiple channels cluster as poor, a pattern where channels 1–4 are poor and 5–8 are good suggests a positional gradient, not random wear. CoScout prompts: "Check common causes like manifold temperature or material pressure — an isolated fix will not hold."

After resolving a channel, the engineer returns to the Performance Pareto. When all channels reach Good or Excellent, the analysis serves as equipment qualification evidence.

## What makes this mode distinctive

- **Wide-format input requirement**: Performance Mode expects one row per sample with multiple measure columns — not long-format data with a Channel column. Auto-detection triggers on shared column prefixes (Head*, Cavity*, Nozzle\_).
- **Channel-level health classification**: `calculateChannelResults()` from `@variscout/core` returns `ChannelResult[]` with per-channel Cpk and a health classification enum. Charts receive this typed array, not raw data.
- **Worst-first Pareto as the navigation anchor**: The Pareto ranking (up to 20 channels) is the primary navigation instrument — clicking a bar sets `selectedMeasure` and updates both Slot 2 and Slot 4 to show that channel's detail.
- **`operatorColors` palette**: The 8-color array assigns consistent colors to channels across Scatter, Boxplot, and Pareto. Head_3 is always the same color across all three views, removing visual context-switching.
- **CoScout multi-channel coaching**: CoScout uses the pattern of good vs poor channels to classify whether the problem is isolated, clustered, or systematic — and frames investigation accordingly with questions about position, temperature gradients, and common-cause equipment factors.

## Design reference

- **Spec:** `docs/03-features/analysis/performance-mode.md`, `docs/03-features/workflows/performance-mode-workflow.md`
- **ADR:** `docs/07-decisions/adr-034-yamazumi-analysis-mode.md` (AnalysisMode union origin), `docs/07-decisions/adr-005-props-based-charts.md`
- **Code:** `packages/core/src/performance.ts` (calculateChannelResults, classifyChannelHealth), `packages/charts/src/PerformanceIChart/`, `packages/charts/src/PerformanceBoxplot/`, `packages/charts/src/PerformancePareto/`, `packages/charts/src/PerformanceCapability/`, `packages/charts/src/colors.ts` (operatorColors)
