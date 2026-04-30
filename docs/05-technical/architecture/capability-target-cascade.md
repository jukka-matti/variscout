---
title: Capability Target Cascade
audience: [developer]
category: architecture
status: delivered
related: [analysis-strategy, dashboard-layout, capability]
last-reviewed: 2026-04-30
---

# Capability Target Cascade

The Cpk target ("what does capable mean for this characteristic?") is **per-characteristic** in VariScout, not a single project-wide knob. Different industries, different customers, and different characteristic classes (CTS / Major / Minor) all carry different bars; encoding the bar at the column level is what AIAG, AS9100, ISO 13485, JMP, and Minitab all do, and what every banding surface in this product reads.

This document describes the foundation that makes that possible: where the target is stored, how surfaces resolve it, and how Cpk values are graded against it.

## Type model

The per-column target lives on `SpecLimits` alongside USL / LSL / target / characteristicType:

```ts
interface SpecLimits {
  usl?: number;
  lsl?: number;
  target?: number;
  cpkTarget?: number; // per-characteristic capability bar
  characteristicType?: CharacteristicType;
}
```

`measureSpecs: Record<string, SpecLimits>` on `projectStore` is the per-column home. Per-mapping overrides ride for free on `InvestigationNodeMapping.specsOverride`, which already wraps `SpecLimits`.

## Cascade order

When a surface needs to grade Cpk for a column, it asks `resolveCpkTarget(column, ctx)`:

```ts
import { resolveCpkTarget } from '@variscout/core/capability';

const target = resolveCpkTarget(outcomeColumn, {
  measureSpecs: project.measureSpecs,
  hubCpkTarget: hub?.reviewSignal?.capability?.cpkTarget,
  projectCpkTarget: project.cpkTarget,
});
```

The cascade is:

1. **Per-column spec** — `measureSpecs[column].cpkTarget` (FRAME node-detail or SpecsPopover)
2. **Hub default** — `processHub.reviewSignal.capability.cpkTarget`
3. **Investigation default** — `projectStore.cpkTarget`
4. **Hardcoded floor** — `DEFAULT_CPK_TARGET` (`1.33`)

Levels can be omitted from `ctx` when not in scope. An investigation surface without a hub passes only `measureSpecs` + `projectCpkTarget`; the hub Capability tab passes all three.

### Why this order

- **Per-column wins** because the column IS the characteristic. A fill-weight Cpk target and a syringe-barrel diameter Cpk target should not be conflated.
- **Hub default wins over investigation default** so a hub owner can publish "everyone analyzing this hub starts at 1.67" once and have every linked investigation inherit it.
- **Investigation default exists** as the legacy single-knob fallback for projects that pre-date the cascade.
- **`1.33` is the literature "capable" line** — a safe floor when the analyst hasn't expressed an opinion.

## Banding rule

Once the target is resolved, the surface grades Cpk via a single function:

```ts
import { gradeCpk } from '@variscout/core/capability';

const grade = gradeCpk(stats.cpk, target); // 'green' | 'amber' | 'red'
```

| Range                          | Grade                     |
| ------------------------------ | ------------------------- |
| `cpk ≥ target`                 | green — meets the bar     |
| `target × 0.75 ≤ cpk < target` | amber — within 75% of bar |
| `cpk < target × 0.75`          | red — well below bar      |

### Why `target × 0.75`, not absolute `1.0`

The user-set target IS the "what does capable mean for this characteristic" abstraction. Hardcoding `1.0` as the amber/red boundary reintroduces literature absolutes the target was supposed to replace, and it breaks for industries whose target is far from 1.33:

- Class III medical device (target = 2.0): amber would otherwise span `[1.0, 2.0)` — an enormous range with very different meanings inside it.
- Commodity assembly (target = 1.0): the absolute floor and the green threshold collapse onto each other; there's no amber band at all.

`target × 0.75` keeps the amber band proportional to the bar in every regime.

## Where it's read

Banding surfaces calling `gradeCpk` (and, via the cascade, `resolveCpkTarget`):

- `ProcessHealthBar` — toolbar Cpk chip color
- `ReportKPIGrid` / `ReportCapabilityKPIGrid` / `ReportPerformanceKPIGrid` — Report view KPI cards
- `processMoments.statusForCpk` — process-moment status (green / amber / red / insufficient; the first three come from `gradeCpk`)
- Chart reference lines that draw the target — `PerformanceIChart`, `CapabilityBoxplot`, `CapabilityGapTrendChart` (cascade-aware target prop)

All of these import from `@variscout/core/capability`.

## Where it's written

Forward references — these surfaces become target-aware as the per-characteristic editing UX lands:

- **Phase B — SpecsPopover (quick edit).** Becomes per-column for real: takes a required `column: string`, persists `cpkTarget` as a first-class field of `SpecLimits` via `setMeasureSpec(column, partial)`. See `packages/ui/src/components/SpecsPopover/`.
- **Phase C — FRAME node-detail (primary).** Per-mapping target field next to each measurement column. Saves to `measureSpecs[column].cpkTarget` by default; per-mapping override goes to `nodeMapping.specsOverride.cpkTarget`. See `apps/azure/src/components/editor/FrameView.tsx` and `LayeredProcessViewWithCapability`.

This Phase A doc is about the foundation: type extension, single banding function, single cascade resolver. Phase B / C extend the resolution flow into editing surfaces and complete the per-characteristic story end-to-end.

## How surfaces wire it (post Phase B / C)

Each cascading surface reads `measureSpecs` + project-level `cpkTarget` from the store and resolves against the column it is grading:

```ts
const projectCpkTarget = useProjectStore(s => s.cpkTarget);
const measureSpecs = useProjectStore(s => s.measureSpecs);
const cpkTarget = resolveCpkTarget(outcome ?? '', { measureSpecs, projectCpkTarget });
```

Surfaces wired this way today:

- **Investigation outcome surfaces** (resolve against `outcome`):
  `apps/azure/src/components/Dashboard.tsx`, `apps/pwa/src/components/Dashboard.tsx`,
  `apps/azure/src/components/WhatIfPage.tsx`, `apps/pwa/src/components/WhatIfPage.tsx`,
  `apps/azure/src/components/views/ReportView.tsx`,
  `apps/azure/src/components/editor/InvestigationWorkspace.tsx`,
  `apps/azure/src/pages/Editor.tsx`, `apps/pwa/src/App.tsx`,
  `apps/azure/src/components/charts/IChart.tsx`,
  `apps/azure/src/components/charts/Boxplot.tsx`,
  `apps/pwa/src/components/charts/IChart.tsx`,
  `apps/pwa/src/components/charts/Boxplot.tsx`,
  `packages/ui/src/components/ProcessIntelligencePanel/StatsTabContent.tsx`,
  `packages/ui/src/components/ProcessIntelligencePanel/QuestionsTabContent.tsx`.
- **Multi-channel surfaces** (resolve against `selectedMeasure`):
  `apps/azure/src/components/PerformanceDashboard.tsx`.

Writers:

- **Per-characteristic editor** (`SpecEditor`) — writes `usl`/`lsl`/`target`/`characteristicType`/`cpkTarget` via `setMeasureSpec(outcome, partial)`.
- **Inline quick-tweak** (`ProcessHealthBar.onCpkTargetCommit`) — writes only `cpkTarget` via `setMeasureSpec(outcome, { cpkTarget })`. Adds a `columnLabel` chip so users see which column they are tuning.
- **Project-wide setup writer** (`PerformanceSetupPanel`) — retains `setCpkTarget` for the multi-channel setup flow. Acts as the cascade fallback when no per-column override is set.

The legacy `useProjectStore.specs` / `setSpecs` API remains for passive fallback when no `outcome` is in scope — no shipped surface writes to it from the SpecEditor / ProcessHealthBar paths anymore.

## See also

- `docs/03-features/analysis/capability.md` — user-facing description of capability grades
- `packages/core/src/capability/` — `gradeCpk`, `resolveCpkTarget`, types
- `packages/core/src/types.ts` — `SpecLimits.cpkTarget`
