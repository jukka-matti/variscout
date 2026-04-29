---
title: 'Multi-level SCOUT V1 — load-bearing decisions'
audience: [engineer, architect]
category: implementation
status: accepted
date: 2026-04-29
related:
  - multi-level-scout-design
  - investigation-scope-and-drill-semantics
  - adr-074-scout-level-spanning-surface-boundary-policy
---

# Multi-level SCOUT V1 — Load-Bearing Decisions

This document locks three load-bearing architectural decisions flagged in the design spec's "Open in spec" section (§8 ambiguities #1, #4, #6). The other three ambiguities (#2, #3, #5) are deferred to their implementing tasks with specific lock points noted.

---

## Decision #1: TimelineWindow attachment point

**Decision:** `TimelineWindow` attaches as a top-level field on the **Investigation envelope**, not as an extension of `ProcessContext`.

```typescript
// packages/core/src/types.ts (illustrative)
interface Investigation {
  // existing fields
  processContext: ProcessContext;
  nodeMappings: Record<string, NodeMapping>; // from scope spec

  // NEW — V1 first slice
  window: TimelineWindow;

  // …other fields (id, createdAt, etc.)
}
```

**Rationale:** `ProcessContext` is scope-binding-only — it holds the canonical map, factor roles, and spec rules. The timeline window is an analyst-time control that can change without invalidating the scope. Co-locating `window` with `nodeMappings` at the envelope level keeps scope and temporal framing coherent and makes it clear that the window can be adjusted independently of the process model.

**Interaction:** This placement respects `nodeMappings` positioning (introduced by `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §2) and avoids conflating data-binding with temporal filtering.

---

## Decision #4: Append-mode row-merge keys

**Decision:** Append-mode deduplicates rows by the tuple **(timestamp value, all currently-mapped factor columns, outcome column)**.

**Algorithm:**

- Timestamp is the discriminator for "newer reading" — when the same measurement recurs, the newest timestamp wins.
- The set of factor columns + outcome column identifies the specific measurement. Two rows with identical timestamp + factors + outcome are exact duplicates and are dropped.
- Rows where timestamp + factors match but outcomes differ → **corrections** (newer timestamp wins; older outcome is replaced).
- Logged as a merge report: count of new rows, duplicates dropped, and corrections applied.

**Rationale:** This matches standard ETL practices for time-series re-upload (e.g., lab system reprocessing, sensor recalibration). The outcome column is included in the key because a re-upload may correct both measurement and outcome. Timestamp is always the tiebreaker to make the resolution deterministic and audit-friendly.

**Implementation note:** The merge report is persisted alongside the `EvidenceSnapshot` and visible in the Investigation UI as a passive footer (no interactive corrections UI in V1).

---

## Decision #6: Default window per mode

**Decision:** Default windows are determined by `(mode × phase)` tuple:

### Investigation Phase (all modes)

- Default: **`openEnded`** from the investigation's `createdAt` to `today`.
- Rationale: An active investigation starts at a point in the past and continues into the present; `openEnded` reflects that continuity without requiring analysts to adjust the window as time passes.

### Hub Phase, Capability Mode

- Default: **`rolling`** matching the hub's `cadence` field:
  - `weekly` → rolling 7 days
  - `daily` → rolling 1 day
  - `hourly` → rolling 24 hours
  - Unset cadence → falls back to `rolling 30d`
- Rationale: Hub-time review is operational monitoring at the rhythm the hub defines. A rolling window keeps the most recent cadence cycle visible and aligns with Grafana / Power-BI defaults for live dashboards.

### Hub Phase, All Other Modes (Performance, Standard, Yamazumi, Defect, Process Flow)

- Default: **`cumulative`** (all data, no window applied).
- Rationale: These modes are not built for hub-time review in V1; the placeholder default preserves all evidence for post-hoc analysis.

### Legacy B0 (no `nodeMappings`)

- Default: **`cumulative`** always — B0 data has no recurring source and no temporal frame to anchor a rolling window.
- Rationale: B0 is historical/incident data; cumulative analysis is the only sensible default.

**Implementation note:** Analysts can override any default window in the Timeline filter UI (`FilterContextBar`). These defaults apply only at investigation creation and hub entry.

---

## Deferred Decisions

### Ambiguity #2: `SpecLookupContext` shape

- **Deferred to:** Task 7 (Router Implementation)
- **Lock point:** The router API will accept either the resolved `SpecRule` directly or a lookup tuple + resolver function. The shape is determined by how `dataRouter` is called from the strategy layer.
- **Reference:** `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md` §4 defines lookup keys as `Record<string, string | null>`.

### Ambiguity #3: `ChartVariantId` taxonomy

- **Deferred to:** Task 7 (Router Implementation)
- **Lock point:** Existing `ChartSlotType` union at `packages/core/src/analysisStrategy.ts:18-32` is the current source. `ChartVariantId` will equal `ChartSlotType` unless window-aware variants require a superset.
- **Reference:** Current variants: ichart, capability-ichart, cpk-scatter, yamazumi-chart, boxplot, distribution-boxplot, yamazumi-ichart, pareto, cpk-pareto, yamazumi-pareto, stats, histogram, yamazumi-summary, defect-summary.

### Ambiguity #5: Drift threshold default

- **Deferred to:** Task 5 (Drift Detector Implementation)
- **Lock point:** Set to **0.20 relative change** (20% Cpk delta) as the baseline methodology-informed default. CoScout coaching review will cover the rationale.
- **Rationale:** Matches Six Sigma "notable shift" heuristic; tuneable via investigation config.

---

## Related Documents

- Spec: `docs/superpowers/specs/2026-04-29-multi-level-scout-design.md`
- Scope spec: `docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-29-multi-level-scout-v1.md`
- Boundary policy (ADR-074): `docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md`
