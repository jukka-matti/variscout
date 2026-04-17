---
title: Process Flow Mode — User Journey
audience: [engineer, analyst]
category: reference
status: design
last-reviewed: 2026-04-17
related: [process-flow, journey, bottleneck, design-only]
---

# Process Flow Mode — User Journey

This mode is designed but not yet coded. The journey described below is the intended experience when implementation ships.

## Who uses this mode

Bottleneck analysts, operations managers, and flow engineers investigating sequential production lines. They have access to MES or time-tracking data that records start and end timestamps per station for each unit produced. Their question is not "is my overall line capable?" but "which station or which queue between stations causes variability in lead time and throughput?" They currently export per-station averages and miss the variation structure that reveals whether the bottleneck is a consistently slow station or an unpredictably variable one.

## What they want to achieve

The analyst wants to decompose line-level lead time variation into per-station cycle time contributions and inter-station wait time contributions — and rank them by their statistical influence on overall output rate. The measurable outcome is a prioritized list: "Station 3 cycle time explains 42% of lead time variation; Wait 2→3 explains 28%." That ranking drives the kaizen investment decision. Once a bottleneck station is confirmed, the analyst may drill further into Yamazumi mode to see its activity composition — integrating the two modes in a level-by-level investigation.

## How they use VariScout for it

### Data entry and detection

The engineer pastes data with one row per product and paired timestamp columns per station (e.g., `St1_Start`, `St1_End`, `St2_Start`, `St2_End`). The parser recognizes matching column prefixes and offers Process Flow mode. Minimum two station pairs are required.

On confirmation, the **Flow Transform** derives: `{Station}_CycleTime`, `Wait_{A}→{B}` (queue time between stations), `LeadTime`, and `{Station}_OutputRate`. These become first-class columns — all charts, ANOVA, and Best Subsets regression operate on them without special treatment.

The dashboard: **Slot 1 — Line Output I-Chart** (output rate or lead time per product; existing component, derived Y column), **Slot 2 — Flow Boxplot** (station CTs and wait times interleaved in process sequence order; bottleneck station red; high-variation wait amber; new chart component — ordering is fixed, never sorted by mean/spread), **Slot 3 — Station Pareto** (stations and waits ranked by R²adj contribution to Y variation), **Slot 4 — Flow Summary Panel** (mean/range of lead time, flow efficiency, bottleneck station identification).

### Investigation flow

The analyst reads the Station Pareto to find the top contributor, then clicks that station in the Flow Boxplot to drill down. If per-station factor columns exist (e.g., a Machine column scoped to Station 2), clicking splits the boxplot into side-by-side distributions by machine — a parallel machine comparison at station level.

If Yamazumi activity-type data exists for the bottleneck station, a "View Activity Breakdown" action (Phase 2) opens the Yamazumi dashboard filtered to that station. The answer becomes: "Station 3 is the bottleneck — and its waste time in Activity X is why."

CoScout uses Theory of Constraints language (bottleneck, constraint, throughput) and flow thinking (upstream variation propagates downstream). When a bottleneck station is confirmed, the analyst creates a SuspectedCause hub and uses the What-If Explorer to project: "If Station 3 CT reduces by 8 seconds, lead time improves by X."

## What makes this mode distinctive

- **Flow Transform derives the analysis columns**: The mode transform (`computeFlowData()`, planned) produces cycle time, wait time, and output rate columns from raw timestamps — the same transform pattern used by Yamazumi mode. No pre-aggregation is required from the analyst.
- **Flow Boxplot preserves station sequence**: Unlike the standard Boxplot where categories can be sorted by mean or spread, the Flow Boxplot locks stations in process order. Reordering by mean would destroy the spatial flow context.
- **Three-level drill-down**: Line level (I-Chart) → Station/Wait level (Flow Boxplot + Pareto) → Activity level (Yamazumi bridge, Phase 2). Each level answers a different question without leaving VariScout.
- **No new statistics**: The Station Pareto and ANOVA use the existing Best Subsets regression engine on the derived cycle time columns. Process Flow mode is a data transformation layer, not a new statistical method.
- **Design-only, Phase 1 planned**: Parser detection, Flow Transform, Flow Boxplot, Station Pareto, and Flow Summary Panel are Phase 1 scope. Yamazumi bridge (Phase 2) and quality angle — using a test result column as Y with flow columns as factors (Phase 3) — follow in later releases.

## Design reference

- **Spec:** `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`
- **ADR:** (no ADR yet — process flow mode is pre-implementation)
- **Code:** No implementation yet. Planned entry points: `packages/core/src/processFlow/` (detection, FlowConfig, computeFlowData), `packages/charts/src/FlowBoxplot/` (new chart component), `packages/core/src/analysisStrategy.ts` (strategy registration)
