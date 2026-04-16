---
title: Defect Analysis
audience: [analyst, engineer]
category: analysis
status: stable
related: [defect, pareto, aggregation, failure-mode, evidence-map]
---

# Defect Analysis

<!-- journey-phase: scout -->

> **Journey phase:** SCOUT — defect rate aggregation and Pareto-driven drill-down reveal where quality problems concentrate.

Defect analysis mode transforms raw defect/error data into aggregated rates per time unit, then applies the existing Four Lenses for investigation. The key insight: turn event logs into rates, and the entire SPC investigation workflow applies.

---

## Purpose

_"Which defect types dominate, and what factors drive them?"_

Traditional defect analysis requires separate tools: p-charts for proportions, c-charts for counts, Pareto charts in Excel, and manual stratification. VariScout's defect mode provides:

- **Automatic aggregation** — raw defect events become rates per shift/hour/batch
- **Four Lenses on rates** — I-Chart, Boxplot, Pareto, and DefectSummary work on the aggregated data
- **Pareto-driven drill-down** — click a defect type to re-aggregate and see what drives it
- **Cross-type Evidence Map** — discover which factors are systemic vs type-specific

---

## When to Use Defect Mode

| Situation                                       | Use Defect Mode? | Why                                |
| ----------------------------------------------- | ---------------- | ---------------------------------- |
| Defect event log (one row per defect)           | Yes              | Core use case — auto-detected      |
| Pre-aggregated defect counts per period         | Yes              | Pass-through, no transform needed  |
| Pass/fail data (OK/NG per unit)                 | Yes              | Aggregated to proportion defective |
| Continuous measurement data (fill weight, etc.) | No               | Use Standard SPC mode              |
| Multi-channel equipment data                    | No               | Use Performance mode               |
| Cycle time with activity types                  | No               | Use Yamazumi mode                  |

---

## Three Data Shapes

### Event Log

One row per defect occurrence. Most common format from MES/quality systems.

```
Date,       DefectType, Machine, Shift, Product
2026-01-15, Scratch,    M3,      Day,   Widget-A
2026-01-15, Dent,       M1,      Day,   Widget-B
```

**Transform**: grouped by [aggregation unit x defect type] into counts per group.

### Pre-aggregated Counts

One row per period with a count column.

```
Date,       Shift, DefectCount, UnitsProduced
2026-01-15, Day,   12,          500
2026-01-15, Night, 23,          480
```

**Transform**: pass-through (count column becomes Y).

### Pass/Fail

One row per unit with a binary outcome.

```
UnitID, Result, Machine, Shift
U001,   OK,     M1,      Day
U002,   NG,     M3,      Day
```

**Transform**: grouped by [aggregation unit], fail proportion computed.

---

## Chart Slots

| Slot | Lens    | Chart               | What It Shows                                                              |
| ---- | ------- | ------------------- | -------------------------------------------------------------------------- |
| 1    | CHANGE  | Defect Rate I-Chart | Aggregated rate over time. Brush to select spikes.                         |
| 2    | FLOW    | Boxplot by Factor   | Rate by defect type (L1) or machine/shift (L2 after drill).                |
| 3    | FAILURE | Pareto Chart        | Types ranked by frequency / time / cost. Factor switching for composition. |
| 4    | VALUE   | Defect Summary      | Total defects, rate, trend, top type, 80/20 indicator.                     |

---

## Drill-Down Flow

**Level 1 — Overview:**
All defect types combined. I-Chart shows total rate, Pareto ranks types, Boxplot compares types.

**Level 2 — Single Type:**
Click a type in Pareto or Boxplot. I-Chart re-aggregates for that type only. Boxplot auto-switches to the next best factor (machine, shift, line). Pareto switches to show composition by factor.

**Level 3+ — Progressive Stratification:**
Standard filter chip accumulation. Each level narrows the investigation. Same as standard mode from here.

---

## Evidence Map (Three-View Model)

The Evidence Map provides three views in defect mode:

**All Defects (default):** Standard factor-centric map on total defect rate. Factors positioned by R-squared-adj.

**Per-Type:** Same map re-computed for a single defect type. Factor ranking changes — a factor weak overall may be strong for a specific type. Computed lazily on first access, cached for instant switching.

**Cross-Type Insight:** Meta-view showing which factors are systemic (significant across multiple types) vs type-specific. Node size reflects how many types a factor drives. Colored badges show which types.

Sample size guard: per-type regression requires at least 10 observations per predictor factor.

---

## CoScout Coaching

Defect mode uses specialized terminology:

**Use:** defect type, failure mode, defect rate, containment, corrective action, Pareto principle, 80/20, composition, contributing factor

**Never use:** Cpk, Cp, specification limits, capability index

Nelson rules are valid on aggregated rates (which are approximately continuous), not on raw event counts.

---

## Detection

Auto-detected during data import. Detection signals:

- **Event log**: categorical column with defect keywords + no continuous numeric outcome
- **Pre-aggregated**: numeric column with count keywords + defect type column
- **Pass/fail**: 2-value categorical matching known patterns (OK/NG, Pass/Fail, etc.) with keyword column name

When detected, `DefectDetectedModal` asks the user to confirm mode and configure the aggregation unit.

---

## Design Specs

- [Defect Analysis Mode Design](../../superpowers/specs/2026-04-16-defect-analysis-mode-design.md) — full mode architecture
- [Defect Evidence Map Integration](../../superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md) — three-view Evidence Map model

## Key Files

| Module   | Files                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Core     | `packages/core/src/defect/` (detection, transform, questions, types)                 |
| Hooks    | `useDefectTransform`, `useDefectSummary`, `useDefectEvidenceMap`                     |
| UI       | `DefectDetectedModal`, `DefectSummary`, `DefectTypeSelector`, `CrossTypeEvidenceMap` |
| Strategy | `packages/core/src/analysisStrategy.ts` (defect entry)                               |
| CoScout  | `packages/core/src/ai/prompts/coScout/modes/defect.ts`                               |
| Sample   | `packages/data/src/samples/manufacturing-defects.ts`                                 |
