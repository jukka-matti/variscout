---
title: Yamazumi Mode — User Journey
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-17
related: [yamazumi, journey, lean, cycle-time, takt]
---

# Yamazumi Mode — User Journey

## Who uses this mode

Lean practitioners, industrial engineers, and kaizen facilitators conducting formal time studies. They work on production lines, assembly cells, or service processes and need to answer the question: "Which stations exceed takt time, and is that because of real work or waste?" They typically export time study spreadsheets from Excel and rebuild stacked bar charts by hand — losing the drill-down, findings, and improvement workflow in the process.

## What they want to achieve

The analyst wants to see cycle time composition per station broken down by activity type (value-adding, non-value-adding, waste, wait), compared against takt time. The measurable outcome is identifying which stations to target for kaizen, quantified by VA ratio (the lean counterpart to Cpk) and takt compliance percentage. Before/after staged analysis then verifies whether the kaizen achieved the expected waste reduction.

## How they use VariScout for it

The engineer pastes time study data — one row per observed activity, with columns for station name, activity type, and duration. If a column contains values matching VA, NVA, SNVA, or Wait patterns, VariScout auto-detects Yamazumi mode. The engineer sets takt time (available production time / demand) and confirms the column mapping.

The dashboard opens with four slots: **Slot 1 — Yamazumi Chart** (stacked bars per station, fixed activity-type colors, dashed takt reference line), **Slot 2 — I-Chart** (cycle time per observation, toggleable between total / VA-only / NVA-only), **Slot 3 — Pareto** (switchable: "Waste by Station" or "Waste by Type"), **Slot 4 — Summary Panel** (takt time, bottleneck station, process efficiency, takt compliance %, total NVA).

The decision flow: the engineer identifies stations above the takt line in Slot 1 and clicks the worst offender, filtering all four charts to that station. The Pareto switches to "Waste by Type" to reveal whether motion waste, material waiting, or unnecessary checking dominates. She pins a finding: "Station 3 exceeds takt — material wait accounts for 40% of cycle time." The I-Chart in NVA-only mode shows whether waste is worsening over the observation sequence.

For kaizen verification, she uploads post-improvement data with a Stage column. VariScout calculates takt compliance per stage independently; the Summary Panel shows VA ratio before and after.

## What makes this mode distinctive

- **Stacked bar composition**: Every station shows the exact split between VA, NVA Required, Waste, and Wait — colors are fixed semantic assignments (not relative to data range), so the same activity type always looks the same across sessions and projects.
- **Takt compliance as the primary KPI**: The dashed takt line replaces specification limits. Process efficiency (VA%) replaces Cpk as the headline metric. Stations above takt are the equivalent of out-of-spec points.
- **Mode transform before analysis**: `computeYamazumiData()` aggregates raw activity rows into per-station summaries before any chart or ANOVA calculation runs. The working dataset is the transformed output — all four charts consume the same aggregated rows.
- **I-Chart metric switching**: Slot 1 shows total cycle time, VA-only, or NVA-only time in the same individual chart component. This lets the engineer ask "Is waste increasing over time?" without changing charts.
- **Lean-specific CoScout coaching**: CoScout uses lean methodology language — muda, takt, kaizen, flow efficiency — and generates waste composition questions rather than standard Factor Intelligence R²adj questions. The evidence metric shown in the question checklist is "Waste %" rather than R²adj.

## Design reference

- **Spec:** `docs/superpowers/specs/2026-03-20-yamazumi-analysis-mode-design.md`, `docs/superpowers/specs/2026-03-21-yamazumi-reporting-design.md`
- **ADR:** `docs/07-decisions/adr-034-yamazumi-analysis-mode.md`
- **Code:** `packages/core/src/yamazumi/` (detection, classification, aggregation), `packages/charts/src/YamazumiChart/` (YamazumiChart, YamazumiChartBase), `packages/ui/src/components/YamazumiSummaryPanel/`, `packages/hooks/src/useYamazumiData.ts`
