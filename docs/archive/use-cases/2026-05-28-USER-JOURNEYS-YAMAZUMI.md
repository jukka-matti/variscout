---
tier: archived
purpose: design
title: 'Yamazumi Mode — User Journey (archived 2026-05-28)'
audience: human
category: reference
status: archived
last-reviewed: 2026-05-28
related: [yamazumi, journey, lean, cycle-time, takt]
---

> **ARCHIVED 2026-05-28** — Yamazumi mode was removed in wedge V1 via PR-LV1-0.
> See [ADR-034](../../07-decisions/adr-034-yamazumi-analysis-mode.md) (superseded)
> and [the linked-views Phase 1 spec §6.1](../../superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md)
> for the rationale (process-flow mode + future pivot-table capability subsume
> the yamazumi use case). Kept here for historical reference.

# Yamazumi Mode — User Journey (archived)

Under the [V1 pivot](superpowers/specs/2026-05-16-wedge-architecture-design.md) ([ADR-082](07-decisions/adr-082-wedge-architecture.md)), Yamazumi mode serves the single V1 persona — the **Improvement Specialist** — working either solo (quick analysis, no project) or inside a Project. The lean methodology below is unchanged; persona variants (industrial engineer / Lean lead / kaizen facilitator) have collapsed to one Specialist. See [USER-JOURNEYS.md](USER-JOURNEYS.md) for the canonical spine.

## What the Specialist wants

The Specialist runs Yamazumi mode during formal time studies on production lines, assembly cells, or service processes. The question they need to answer: "Which stations exceed takt time, and is that because of real work or waste?"

Today, they export time-study spreadsheets from Excel and rebuild stacked bar charts by hand — losing the drill-down, Findings, and improvement workflow in the process. The goal in Yamazumi mode: see cycle-time composition per station broken down by activity type (value-adding, non-value-adding, waste, wait), compared against takt time.

The measurable outcome is identifying which stations to target for kaizen, quantified by VA ratio (the lean counterpart to Cpk) and takt compliance percentage. Before/after staged analysis then verifies whether the kaizen achieved the expected waste reduction.

## How the Specialist uses it

The Specialist pastes time-study data — one row per observed activity, with columns for station name, activity type, and duration. If a column contains values matching VA, NVA, SNVA, or Wait patterns, VariScout auto-detects Yamazumi mode. The Specialist sets takt time (available production time / demand) and confirms the column mapping.

The dashboard opens with four slots: **Slot 1 — Yamazumi Chart** (stacked bars per station, fixed activity-type colors, dashed takt reference line), **Slot 2 — I-Chart** (cycle time per observation, toggleable between total / VA-only / NVA-only), **Slot 3 — Pareto** (switchable: "Waste by Station" or "Waste by Type"), **Slot 4 — Summary Panel** (takt time, bottleneck station, process efficiency, takt compliance %, total NVA).

The decision flow: the Specialist identifies stations above the takt line in Slot 1 and clicks the worst offender, filtering all four charts to that station. The Pareto switches to "Waste by Type" to reveal whether motion waste, material waiting, or unnecessary checking dominates. She pins a Finding: "Station 3 exceeds takt — material wait accounts for 40% of cycle time." The I-Chart in NVA-only mode shows whether waste is worsening over the observation sequence.

For kaizen verification, she uploads post-improvement data with a Stage column. VariScout calculates takt compliance per stage independently; the Summary Panel shows VA ratio before and after.

Inside a Project, the Specialist as project Lead pins these station-level Findings and Hypotheses on the Investigation Wall, captures Measurement Plans for the remaining evidence (longer observation horizons, additional cycles), and runs the Improve stage as the kaizen plays out. Outside a Project (quick analysis), the same chart suite still drives action — just without the lifecycle wrapper.

## What makes this mode distinctive

- **Stacked bar composition**: Every station shows the exact split between VA, NVA Required, Waste, and Wait — colors are fixed semantic assignments (not relative to data range), so the same activity type always looks the same across sessions and projects.
- **Takt compliance as the primary KPI**: The dashed takt line replaces specification limits. Process efficiency (VA%) replaces Cpk as the headline metric. Stations above takt are the equivalent of out-of-spec points.
- **Mode transform before analysis**: `computeYamazumiData()` aggregates raw activity rows into per-station summaries before any chart or ANOVA calculation runs. The working dataset is the transformed output — all four charts consume the same aggregated rows.
- **I-Chart metric switching**: Slot 2 shows total cycle time, VA-only, or NVA-only time in the same individual chart component. This lets the Specialist ask "Is waste increasing over time?" without changing charts.
- **Lean-specific CoScout coaching**: CoScout uses lean methodology language — muda, takt, kaizen, flow efficiency — and generates waste composition questions rather than standard Factor Intelligence R²adj questions. The evidence metric shown in the question checklist is "Waste %" rather than R²adj.

## Design reference

- **V1 canon:** [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- **Spec:** `docs/archive/specs/2026-03-20-yamazumi-analysis-mode-design.md`, `docs/archive/specs/2026-03-21-yamazumi-reporting-design.md`
- **ADR:** [`adr-034-yamazumi-analysis-mode.md`](07-decisions/adr-034-yamazumi-analysis-mode.md)
- **Code:** `packages/core/src/yamazumi/` (detection, classification, aggregation), `packages/charts/src/YamazumiChart/` (YamazumiChart, YamazumiChartBase), `packages/ui/src/components/YamazumiSummaryPanel/`, `packages/hooks/src/useYamazumiData.ts`

## Code ground truth

When this doc and code disagree, trust the code.

- `apps/azure/e2e/full-lifecycle.spec.ts` — end-to-end Project lifecycle the Specialist follows when wrapping a Yamazumi kaizen in formal structure
- `packages/data/src/samples/journey.ts` — seeded journey-shaped dataset; Yamazumi-specific fixtures live alongside the time-study samples
- `apps/azure/src/lib/journeyPhaseConfig.ts` — phase configuration for project-anchored Yamazumi investigations
