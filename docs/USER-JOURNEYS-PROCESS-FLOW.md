---
tier: living
purpose: design
title: Process Flow Mode — User Journey
audience: human
category: reference
status: draft
last-reviewed: 2026-05-16
related: [process-flow, journey, bottleneck, design-only]
---

# Process Flow Mode — User Journey

Under the [V1 pivot](superpowers/specs/2026-05-16-wedge-architecture-design.md) ([ADR-082](07-decisions/adr-082-wedge-architecture.md)), Process Flow mode serves the single V1 persona — the **Improvement Specialist** — working either solo (quick analysis, no project) or inside a Project. The methodology below is unchanged; persona variants have collapsed to one. See [USER-JOURNEYS.md](USER-JOURNEYS.md) for the canonical spine.

This mode is designed but not yet coded. The journey described below is the intended experience when implementation ships.

## What the Specialist wants

The Specialist runs Process Flow mode against sequential production line data — typically MES or time-tracking exports that record start and end timestamps per station for each unit produced. The question is not "is my overall line capable?" but "which station or which queue between stations contributes most to lead-time and throughput variability?"

Today, the Specialist exports per-station averages and loses the variation structure that reveals whether the bottleneck is a consistently slow station or an unpredictably variable one. The goal in Process Flow mode: decompose line-level lead-time variation into per-station cycle-time contributions and inter-station wait-time contributions — ranked by statistical influence on overall output rate.

The measurable outcome is a prioritized list: "Station 3 cycle time contributes 42% of lead-time variation; Wait 2→3 contributes 28%." That ranking drives the kaizen investment decision. Once a bottleneck station is confirmed, the Specialist may drill further into Yamazumi mode to see its activity composition — integrating the two modes in a level-by-level investigation.

## How the Specialist uses it

### Data entry and detection

The Specialist pastes data with one row per product and paired timestamp columns per station (e.g., `St1_Start`, `St1_End`, `St2_Start`, `St2_End`). The parser recognizes matching column prefixes and offers Process Flow mode. Minimum two station pairs are required.

On confirmation, the **Flow Transform** derives: `{Station}_CycleTime`, `Wait_{A}→{B}` (queue time between stations), `LeadTime`, and `{Station}_OutputRate`. These become first-class columns — all charts, ANOVA, and Best Subsets regression operate on them without special treatment.

The dashboard: **Slot 1 — Line Output I-Chart** (output rate or lead time per product; existing component, derived Y column), **Slot 2 — Flow Boxplot** (station CTs and wait times interleaved in process sequence order; bottleneck station red; high-variation wait amber; new chart component — ordering is fixed, never sorted by mean/spread), **Slot 3 — Station Pareto** (stations and waits ranked by R²adj contribution to Y variation), **Slot 4 — Flow Summary Panel** (mean/range of lead time, flow efficiency, bottleneck station identification).

### Investigation flow

The Specialist reads the Station Pareto to find the top contributor, then clicks that station in the Flow Boxplot to drill down. If per-station factor columns exist (e.g., a Machine column scoped to Station 2), clicking splits the boxplot into side-by-side distributions by machine — a parallel machine comparison at station level.

If Yamazumi activity-type data exists for the bottleneck station, a "View Activity Breakdown" action (Phase 2) opens the Yamazumi dashboard filtered to that station. The answer becomes: "Station 3 is the bottleneck — and its waste time in Activity X is the dominant contribution."

CoScout uses Theory of Constraints language (bottleneck, constraint, throughput) and flow thinking (upstream variation propagates downstream). When a bottleneck station is confirmed, the Specialist creates a SuspectedCause and uses the What-If Explorer to project: "If Station 3 CT reduces by 8 seconds, lead time improves by X."

Inside a Project, the Specialist as project Lead pins station-level Findings and Hypotheses to the Investigation Wall, and writes Measurement Plans for evidence still needed (e.g., changeover time stratified by operator). Outside a Project (quick analysis), the same flow still produces a station-ranked action — just without the lifecycle wrapper.

## What makes this mode distinctive

- **Flow Transform derives the analysis columns**: The mode transform (`computeFlowData()`, planned) produces cycle time, wait time, and output rate columns from raw timestamps — the same transform pattern used by Yamazumi mode. No pre-aggregation is required from the Specialist.
- **Flow Boxplot preserves station sequence**: Unlike the standard Boxplot where categories can be sorted by mean or spread, the Flow Boxplot locks stations in process order. Reordering by mean would destroy the spatial flow context.
- **Three-level drill-down**: Line level (I-Chart) → Station/Wait level (Flow Boxplot + Pareto) → Activity level (Yamazumi bridge, Phase 2). Each level answers a different question without leaving VariScout.
- **No new statistics**: The Station Pareto and ANOVA use the existing Best Subsets regression engine on the derived cycle time columns. Process Flow mode is a data transformation layer, not a new statistical method.
- **Design-only, Phase 1 planned**: Parser detection, Flow Transform, Flow Boxplot, Station Pareto, and Flow Summary Panel are Phase 1 scope. Yamazumi bridge (Phase 2) and quality angle — using a test result column as Y with flow columns as factors (Phase 3) — follow in later releases.

## Design reference

- **V1 canon:** [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- **Spec:** `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`
- **ADR:** (no ADR yet — Process Flow mode is pre-implementation)
- **Code:** No implementation yet. Planned entry points: `packages/core/src/processFlow/` (detection, FlowConfig, computeFlowData), `packages/charts/src/FlowBoxplot/` (new chart component), `packages/core/src/analysisStrategy.ts` (strategy registration)

## Code ground truth

When this doc and code disagree, trust the code.

- `apps/azure/e2e/full-lifecycle.spec.ts` — end-to-end Project lifecycle the Specialist follows when wrapping a flow investigation in formal structure
- `packages/data/src/samples/journey.ts` — seeded journey-shaped dataset; flow-specific fixtures will land alongside `computeFlowData()` when Phase 1 ships
- `apps/azure/src/lib/journeyPhaseConfig.ts` — phase configuration for project-anchored flow investigations
