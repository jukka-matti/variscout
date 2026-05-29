---
title: 'ADR-089: Retire mode/lens as user axes; Values⇄Capability as the one surviving view'
status: active
date: 2026-05-29
purpose: decide
tier: living
audience: both
topic: [analysis, ux, capability, wedge-v1]
related:
  - adr-088-level-native-contribution
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-084-capability-indices-cp-cpk-only
  - 2026-05-29-investigation-surface-design
layer: L5
last-verified: 2026-05-29
---

# ADR-089: Retire mode/lens as user axes; Values⇄Capability as the one surviving view

**Status:** Accepted
**Date:** 2026-05-29

## Context

VariScout's analysis surface accumulated three orthogonal-sounding axes that the UI presented, or threatened to present, as user choices: **"mode"**, **"level"**, and **"lens"**. The 2026-05-29 holistic investigation-surface design ([spec](../superpowers/specs/2026-05-29-investigation-surface-design.md)) settled what each actually is, and found that none of them should be a knob the analyst turns.

What the code actually does today:

- **`AnalysisMode`** is a 3-value persisted type — `'standard' | 'performance' | 'defect'` (`packages/core/src/types.ts:334`). It is a **data-shape discriminant**, not a view selector. It is set automatically at Frame/setup time: `setAnalysisMode` fires from `PerformanceSetupPanel.tsx:78` (wide-channel transform) and from the defect-ingest path in `Editor.tsx` (`computeDefectRates` transform). There is no menu where a user picks "I'd like performance mode now."
- **`ResolvedMode`** (`packages/core/src/analysisStrategy.ts:6`) adds `'capability'` to that set, but `capability` is never an `AnalysisMode` value. It is **derived** at render time by `resolveMode()` (`analysisStrategy.ts:85`) from `standardIChartMetric === 'capability'` — confirmed by the `@variscout/core` strategy invariant ("never persist it as an `AnalysisMode` value").
- **The CHANGE / FLOW / FAILURE / VALUE "lenses"** were teaching language. They have **no type and no picker** in shipped code. Two genuinely-typed lens concepts live elsewhere and are unrelated to this teaching vocabulary: `ProcessStateLens` (`'outcome'|'flow'|'conversion'|'measurement'|'sustainment'`, `packages/core/src/processState.ts:10`) and `TimeLens` (stats windowing).
- **Values⇄Capability** is a real, persisted, distinct view: `StandardIChartMetric = 'measurement' | 'capability'` (`packages/core/src/stats/subgroupCapability.ts:73`), persisted as `DisplayOptions.standardIChartMetric` (`packages/core/src/ui-types/index.ts:80`), backed by `calculateSubgroupCapability` + `SubgroupConfig` (`subgroupCapability.ts:21,:168`) and surfaced by the `CapabilityMetricToggle` UI per ADR-038.

The design also examined whether the four charts (I-Chart / Boxplot / Pareto / Stats) should track per-chart outcome bindings. They currently do not: `Dashboard.tsx:216` reads **one shared outcome string** and feeds it to all four charts, with a reverse-mirror at `Dashboard.tsx:465-478`. The data model already carries the richer binding (`ImprovementProjectOutcomeGoal.outcomeGoals[].stepId`, `improvementProject/types.ts:45`, plus `ProcessMapNode.ctqColumn`); only the render layer is single-Y.

The result was three pseudo-axes the analyst was being asked to reason about, where the actual mental model is just **measure + factor → charts + drill** (the Cluster B spine, companion to [ADR-088](adr-088-level-native-contribution.md) on level-native contribution).

## Decision

**Retire "mode" and "lens" as user-facing axes. The analyst picks a measure (Y) and one or more factors (X). The four charts — I-Chart, Boxplot, Pareto, Stats — are always shown and always drillable. There is no mode-picker and no lens-picker.**

Concretely:

1. **"Mode", "level", "lens" are reframed, not surfaced.** "Level" = _which measure_ (a global outcome vs a step-local measure — see [ADR-088](adr-088-level-native-contribution.md)). "Mode" = _data shape_ (set by Frame). "Lens" = _the chart set_ (always the same four). None is a user knob.

2. **`AnalysisMode` is retained as a Frame-derived discriminant — this is a doc/UX reframe, not a deletion cascade.** The `'standard' | 'performance' | 'defect'` type stays; `resolveMode()` / `getStrategy()` stay; the ~21 `ResolvedMode` consumers and ~82 `.analysisMode` reads stay. What is removed is any user-facing _mode-picker_ presentation. `capability` remains a derived `ResolvedMode`, never an `AnalysisMode` value.

3. **The CHANGE / FLOW / FAILURE / VALUE lenses are pedagogy only.** No type, no picker — that is already the shipped reality. They are deleted from the glossary as if they were product features. The typed `ProcessStateLens` and `TimeLens` are **not** touched by this ADR.

4. **The one genuine survivor is Values⇄Capability:** a specs-gated, distinct _view_ toggled by `StandardIChartMetric` (ADR-038), showing per-subgroup Cp/Cpk **stability** (the "don't Pp on my Cp" rigor — Cp/Cpk only, per [ADR-084](adr-084-capability-indices-cp-cpk-only.md)). It is explicitly **not a lens and not an `AnalysisMode`**.

5. **Add a Frame-aware outcome+decomposition pairing** (the L1+L2 bottleneck view): I-Chart shows the framed outcome; Boxplot shows the framed per-step measures laid out by step. This requires **per-chart measure binding** in the render layer (net-new). It is constrained to **part-whole relationships only** per [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md): the decomposition is allowed when the per-step measures compose the outcome (`lead_time = f(step cycle_times)`). Two **unrelated** Ys (lead-time + defect-rate) are forbidden in one pairing and stay separate investigations.

## Rationale

- **The analyst's real choice is measure + factor, nothing else.** Every other axis is either determined by the data (mode) or invariant (the four charts). Presenting them as choices manufactures decisions and forces the analyst to hold three mental models where one suffices. Removing the pickers makes the surface honest about what is actually adjustable.
- **The reframe costs almost nothing because the code already agrees.** `AnalysisMode` is already set from setup panels, not a menu; the four lenses already have no type; capability is already a derived `ResolvedMode`. This ADR ratifies the implemented reality and removes the _documentation_ drift that still describes these as user modes — not a type migration.
- **Values⇄Capability earns its survival because it is a different question, not a different framing of the same charts.** "What are the values doing?" and "Is the process capable when stable?" are distinct analytical postures with distinct math (raw series vs per-subgroup σ̂ Cp/Cpk). A toggle is the right primitive; the rigor it protects (within-subgroup σ̂, no Pp/Ppk) is locked by [ADR-084](adr-084-capability-indices-cp-cpk-only.md).
- **Decomposition must respect part-whole or it becomes the aggregation hazard [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) forbids.** A step-by-step boxplot is legitimate when the steps compose the framed outcome; pairing two unrelated outcomes on one surface would invite exactly the cross-unit roll-up ADR-073 prohibits. The constraint is what keeps the new pairing safe.
- **Scope is still not cause.** The decomposition view shows _where_ variation concentrates (which step, the L1+L2 view); it does not assert _why_. Suspected causes (Hypotheses) remain mechanisms nested within whichever `{factor=level}` condition the analyst drilled to — never read off the boxplot directly.

## Consequences

### Code-level

- **No tsc-wide rename.** `AnalysisMode` (`packages/core/src/types.ts:334`), `resolveMode()` / `ResolvedMode` (`analysisStrategy.ts:6,:85`), and the ~45 files referencing `AnalysisMode` are untouched at the type level. Any future temptation to delete the type because "modes are retired" must be resisted — the discriminant is load-bearing for the Frame-time transforms.
- **`ProcessStateLens` (`processState.ts:10`) and `TimeLens` are out of scope.** They share the word "lens" with the retired pedagogy but are unrelated typed concepts; deleting them would be a regression.
- **Values⇄Capability is unchanged.** `StandardIChartMetric` (`subgroupCapability.ts:73`), `DisplayOptions.standardIChartMetric` (`ui-types/index.ts:80`), `calculateSubgroupCapability` + `SubgroupConfig{ method: 'column'|'fixed-size', size >= 2 default 5 }` (`subgroupCapability.ts:21,:168`), and `CapabilityMetricToggle` continue exactly as shipped (ADR-038).
- **Net-new work is the per-chart binding integration.** Today `Dashboard.tsx:216` reads one shared outcome for all four charts, with a reverse-mirror at `Dashboard.tsx:465-478`. Wiring per-chart measure binding from the existing data model (`ImprovementProjectOutcomeGoal.outcomeGoals[].stepId`, `improvementProject/types.ts:45`; `ProcessMapNode.ctqColumn`) into the render layer is judgment-heavy, multi-file integration — Opus-class, not a mechanical rename. The shared-Y reverse-mirror must be unwound carefully so existing single-Y investigations keep rendering.

### Methodological

- **The analyst tunes exactly two things — measure and factor.** Everything else is derived or invariant. This is the Cluster B spine and the companion framing to [ADR-088](adr-088-level-native-contribution.md)'s level-native contribution.
- **Capability stays Cp/Cpk-only against within-subgroup σ̂** ([ADR-084](adr-084-capability-indices-cp-cpk-only.md)). The Values⇄Capability toggle never exposes Pp/Ppk. "Stability" here means _per-subgroup Cp/Cpk_, a soft caveat on whether the capability read is trustworthy — not a gate that blocks analysis.
- **Decomposition is part-whole only** ([ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md)). Related Frame-derived measures may share a decomposition view; unrelated outcomes may not be roll-up-aggregated and remain distinct investigations.

### Forward implication

- The per-chart-binding integration is the gating work item for the L1+L2 bottleneck pairing. It can ship after the doc/UX reframe lands, since the reframe has no code prerequisite.
- This ADR pairs with [ADR-088](adr-088-level-native-contribution.md): "measure + factor → charts + drill" (here) and "contribution is level-native" (there) are two faces of the same Cluster B spine. The [investigation-surface spec](../superpowers/specs/2026-05-29-investigation-surface-design.md) is the design home for both.

### Documentation

- **Highest-priority amendment:** `mental-model-hierarchy.md:120-128` still frames Performance / Yamazumi / Capability as "Analysis Modes". This is the top doc target — it must be rewritten so that Performance/Defect are _data shapes set at Frame_ and Capability is a _view_, not a mode the user selects.
- **Glossary:** delete the CHANGE / FLOW / FAILURE / VALUE lens entries as product features (retain only as one-line teaching aside if anywhere). Leave `ProcessStateLens` / `TimeLens` documentation intact.
- **ADR-038 needs a graduation note when this ADR lands.** ADR-038 currently describes capability as "a capability mode" and references Pp/Ppk in its Context. Both are now stale: capability is a _view_ (this ADR) and Pp/Ppk is gone ([ADR-084](adr-084-capability-indices-cp-cpk-only.md)). ADR-038's wording should be amended to match — flagged for the spec author below.

## Alternatives considered

1. **Delete `AnalysisMode` entirely now that "modes are retired."** Rejected: it conflates the user-facing axis (a picker, which is being removed) with the internal data-shape discriminant (which the Frame-time transforms depend on). The type is load-bearing; only the picker presentation is going.
2. **Keep mode + level + lens as three user knobs with sensible defaults.** Rejected: three axes for a choice that is really just measure + factor. Defaults do not undo the cognitive cost of presenting a knob that should never need turning.
3. **Fold Values⇄Capability into the lens set as one more "lens".** Rejected: it is a genuinely distinct analytical question with distinct math (per-subgroup σ̂ Cp/Cpk), not a re-skin of the four charts. Making it a lens would resurrect the very axis this ADR retires.
4. **Allow arbitrary multi-Y dashboards (any two outcomes side by side).** Rejected: violates [ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md). Only part-whole decomposition of a single framed outcome is permitted; unrelated outcomes stay separate investigations.
5. **Defer the per-chart binding and ship only the doc reframe.** Viable as a sequencing choice, not a substitute: the reframe stands alone, but the L1+L2 bottleneck pairing is only realized once per-chart binding wires the existing `stepId` / `ctqColumn` data into the render layer.
