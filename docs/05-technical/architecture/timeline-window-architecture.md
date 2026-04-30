---
title: Timeline Window & Multi-Level Routing Architecture
audience: [developer]
category: architecture
status: delivered
related: [analysis-strategy, dashboard-layout, data-pipeline-map, mental-model-hierarchy]
---

# Timeline Window & Multi-Level Routing Architecture

Engineer-facing reference for how multi-level SCOUT routes data and how the timeline-window primitive plugs into every metric module.

For the user-facing intent, see [Timeline Windows in Investigations](../../03-features/analysis/timeline-window-investigations.md) and [Multi-Level Dashboard](../../03-features/analysis/multi-level-dashboard.md). For the design rationale and surface boundary policy, see [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).

---

## The `dataRouter` contract

`AnalysisModeStrategy` (in `packages/core/src/analysisStrategy.ts`) gains a single new method:

```ts
type DataRouterArgs = {
  rows: ParsedRow[];
  scope: Scope; // 'b0' | 'b1' | 'b2'
  phase: AnalysisPhase; // 'frame' | 'scout' | 'investigate' | 'improve'
  window: TimelineWindow;
  context: SpecLookupContext;
};

interface AnalysisModeStrategy {
  // existing fields…
  dataRouter(args: DataRouterArgs): Record<ChartSlotType, ChartInput>;
}
```

`dataRouter` is the single point where window + scope + context combine to decide what each chart slot receives. It does not introduce runtime hook switching: components keep importing the same hooks they always did. The router replaces _data shape_ per slot, never _component identity_.

`useDataRouter` (in `@variscout/hooks`) is a thin sanity-check wrapper used by `DashboardLayoutBase`. It asserts that the strategy returned a `ChartInput` for each declared slot and surfaces a typed error in dev if not. It is _not_ a runtime dispatcher — slots still mount through their normal component path.

---

## Scope detection

`detectScope(investigation, processMap)` in `@variscout/core` returns:

- **`b0`** — baseline. No node mappings, or the mappings cover the entire process. Cumulative is the natural default.
- **`b1`** — single-node investigation. One canonical-map node; all data lives under it.
- **`b2`** — multi-node investigation. Multiple nodes; the dashboard becomes flow-aware (per-step distributions, bottleneck detection).

Scope is a derived value, never persisted. Strategies and router branches read it at render time.

---

## The `TimelineWindow` discriminated union

```ts
type TimelineWindow =
  | { kind: 'fixed'; start: number; end: number }
  | { kind: 'rolling'; durationMs: number; anchor?: number }
  | { kind: 'open-ended'; start: number }
  | { kind: 'cumulative'; end?: number };
```

`applyWindow(rows, window, timeColumn)` filters rows by the parser-detected `timeColumn` (in `packages/core/src/time.ts`). The function is referentially transparent — given the same rows + window + column, it returns identical output. There is no separate "filter" stage for time; the window _is_ the temporal filter.

Defaults per surface (locked in spec §8 / plan Task 0.1):

| Surface                               | Default window               |
| ------------------------------------- | ---------------------------- |
| Investigation dashboard (SCOUT)       | `open-ended`                 |
| Process Hub Capability tab (hub-time) | `rolling` matched to cadence |
| Production-line-glance baseline (B0)  | `cumulative`                 |

V1 stores the active window as session-local React state on the dashboard. V2 will lift it into the investigation envelope; see plan Task 0.2 for the locked attachment point.

---

## Append-mode `mergeRows`

Re-uploading a CSV does not replace the dataset. `mergeRows(existing, incoming, keys)` (in `packages/core/src/parser`) deduplicates against a composite key:

```
key = timestamp + factor columns + outcome column
```

(Locked in plan Task 0.3.) The function emits a `MergeReport`:

```ts
type MergeReport = {
  added: number;
  duplicates: number;
  corrections: number; // existing keys with different outcome values
};
```

The chrome-walk surfaces the report after re-upload. A correction is treated as an explicit edit, not a duplicate — the user is shown a diff prompt before the row is overwritten.

---

## Drift detection

Findings record a `WindowContext` (window + active filters + spec hash) at save time. `computeFindingWindowDrift(savedContext, currentContext)` (in `packages/core/src/findings/drift.ts`) returns:

```ts
type DriftResult =
  | { kind: 'aligned' }
  | { kind: 'drifted'; relativeChange: number; reasons: DriftReason[] };
```

Default drift threshold is **0.20 relative change** (locked in plan Task 5.1). When drift is detected, the Finding footer flags it and the Wall handoff badge shifts colour. CoScout consumes `DriftResult` as a structured input in V2; V1 only surfaces it visually.

---

## Throughput module

`packages/core/src/throughput/` ships in V1 with two functions:

- `computeOutputRate(rows, window, timeColumn)` — outputs per unit time over the window.
- `computeBottleneck(rows, processMap, window)` — slowest step (lowest output rate) given a multi-node scope.

Both consume the windowed rows directly; they do not re-implement filtering. Cycle time, FPY, RTY (second slice) and OEE / takt / lead time / WIP (third slice) extend this module. They are deferred to subsequent plan slices.

---

## How metric modules plug in

Each strategy declares the metric modules its slots need via a `transforms[]` array of strings. The router resolves transform IDs to module functions and passes windowed rows. New metrics (e.g. throughput) need:

1. A pure function in the appropriate `packages/core/src/<module>/` directory.
2. A registered transform ID in the strategy's `transforms[]`.
3. Tests under `packages/core/src/<module>/__tests__/`.

No chart code changes. The component receives the new `ChartInput` shape and renders it.

---

## Boundary keeping

ADR-074 declares structural-absence rules per surface. A CI script ships at `scripts/check-level-boundaries.sh` (committed `6c682187`) and runs in pre-commit. It greps for forbidden imports — for example, SCOUT importing `processMap` editing helpers, or Evidence Map importing capability computation. Failures block the commit.

---

## Key files

| Concern               | File                                                               |
| --------------------- | ------------------------------------------------------------------ |
| Strategy + dataRouter | `packages/core/src/analysisStrategy.ts`                            |
| Scope detection       | `packages/core/src/scope/detectScope.ts`                           |
| TimelineWindow types  | `packages/core/src/timeline/index.ts`                              |
| applyWindow           | `packages/core/src/timeline/applyWindow.ts`                        |
| Append-mode merge     | `packages/core/src/parser/mergeRows.ts`                            |
| Drift detection       | `packages/core/src/findings/drift.ts`                              |
| Throughput            | `packages/core/src/throughput/`                                    |
| useTimelineWindow     | `packages/hooks/src/useTimelineWindow.ts`                          |
| useDataRouter         | `packages/hooks/src/useDataRouter.ts`                              |
| TimelineWindowPicker  | `packages/ui/src/components/TimelineWindowPicker/`                 |
| DashboardLayoutBase   | `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` |
| Boundary check        | `scripts/check-level-boundaries.sh`                                |

---

## Related

- [ADR-074 — SCOUT level-spanning surface boundary policy](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md)
- [ADR-073 — no statistical roll-up across heterogeneous units](../../07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md)
- [Multi-level SCOUT design spec](../../superpowers/specs/2026-04-29-multi-level-scout-design.md)
- [Dashboard Layout Architecture](dashboard-layout.md)
- [Mental Model Hierarchy](mental-model-hierarchy.md)
