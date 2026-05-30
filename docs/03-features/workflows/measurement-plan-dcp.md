---
tier: living
purpose: design
title: Measurement Plan (DCP Shape)
audience: human
category: workflow
status: active
last-reviewed: 2026-05-30
related: [analyze-wall, adr-085, adr-087, hypothesis, process-maps]
layer: L3
kind: ui
serves:
  - docs/03-features/specifications.md
  - docs/03-features/workflows/analyze-wall.md
---

# Measurement Plan (DCP Shape)

A Measurement Plan is a sub-entity of a Hypothesis on the Investigation Wall. It specifies
**what evidence to collect, how to collect it, under what conditions, and at which process step** —
the DCP (Detection Control Plan) pattern adapted for investigation.

Each Hypothesis can have zero or more Measurement Plans. Plans are created in-line via the
`AddPlanForm` component, rendered as `MeasurementPlanChip` rows below each Hypothesis card on the Wall.

## Field reference (spec §7.1)

| Field              | Type                    | Required                 | Notes                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hypothesisId`     | `Hypothesis['id']`      | **Required + immutable** | Exclusively links the plan to one Hypothesis. Cannot be patched (excluded from `MeasurementPlanPatch` via `Omit<>`). See decision-log 2026-05-30.                                                                                                                                                                                                      |
| `outcome`          | `string`                | Required                 | The Y being studied on this plan. Pre-filled from the project/hypothesis outcome at the call site when available; otherwise user-entered.                                                                                                                                                                                                              |
| `primaryFactor`    | `string`                | Required                 | The primary X being measured. Renamed from `factor` (IM-2).                                                                                                                                                                                                                                                                                            |
| `neededFactors`    | `string[]`              | Required (may be `[]`)   | **Values are dataset column names** (not display labels). Stratifiers or covariates to collect alongside `primaryFactor`. IM-3's column-overlap matcher joins on these names — preserving this contract is critical.                                                                                                                                   |
| `sampleSize`       | `number`                | Required                 | Minimum planned sample count.                                                                                                                                                                                                                                                                                                                          |
| `method`           | `MeasurementMethod`     | Required                 | One of: `sensor`, `manual-count`, `gemba-walk`, `expert-assessment`, `other`.                                                                                                                                                                                                                                                                          |
| `owner`            | `ProjectMember['id']`   | Required                 | Entity id of the responsible member (Lead or Member; Sponsors are excluded from the owner picker).                                                                                                                                                                                                                                                     |
| `status`           | `MeasurementPlanStatus` | Required                 | Lifecycle state: `planned` → `in-progress` → `complete` or `skipped`.                                                                                                                                                                                                                                                                                  |
| `scope`            | `ConditionLeaf[]`       | Required (may be `[]`)   | A **snapshot copy** of the active WHERE drill-chip conditions at plan-creation time (ADR-085). Derived from `analysisScopeStore.categoricalFilters` via `buildConditionFromCategoricalFilters`. This is **not** a reference to the `ProblemStatementScope` entity — it is a captured point-in-time WHERE clause. Empty when no drill chips are active. |
| `processLocation`  | `string`                | Required (may be `''`)   | ProcessMap node id (`step-${slug}-${seq}`) identifying the process step this plan targets. Resolved against canonical ProcessMap node ids (ADR-087). Empty string `''` is allowed for mapless projects — ADR-087 tolerates orphaned/empty `stepId` values pre-launch.                                                                                  |
| `opDef`            | `string?`               | Optional                 | Free-text operational-definition note — **informational only, not a maturity gate**.                                                                                                                                                                                                                                                                   |
| `msaNote`          | `string?`               | Optional                 | Free-text MSA / Gage R&R comment — **informational only, not a gate**. Replaces the removed `msaRequired: boolean` flag (IM-2). Formal MSA / Gage R&R workflow defers to V2.                                                                                                                                                                           |
| `linkedFindingIds` | `Finding['id'][]?`      | Optional                 | Finding ids linked to this plan via `MEASUREMENT_PLAN_LINK_FINDING`.                                                                                                                                                                                                                                                                                   |

## DCP contract notes

- **`neededFactors[]` = dataset column names.** This is a hard contract: IM-3's
  column-overlap matcher (`packages/core/src/...`) joins `neededFactors` against
  the dataset's column keys. Do not store display labels here.

- **`processLocation` join.** ProcessMap node ids are canonical (`step-${slug}-${seq}`,
  minted by `canvasStore`). `processLocation` is an intentionally non-strict FK (ADR-087):
  orphaned or empty values are tolerated pre-launch so the form can be submitted without
  a configured processMap.

- **`scope` is a snapshot, not a live filter.** The `ConditionLeaf[]` is captured once
  at plan-creation time from `analysisScopeStore.categoricalFilters`. After creation the
  plan's `scope` does not update when the drill chips change. This is intentional — the
  scope documents the WHERE at the time the measurement commitment was made.

- **`opDef` and `msaNote` are optional notes.** VariScout V1 treats these as informational
  context that improves communication across the team. They are **not** maturity gates,
  not required for plan status progression, and not validated against any schema beyond
  `string`.

## Persistence

Plans are stored in the `measurementPlans` Dexie table (both PWA and Azure apps), indexed
on `id`, `hypothesisId`, `status`, and `deletedAt`. The new DCP fields (`outcome`,
`neededFactors`, `scope`, `processLocation`, `opDef`, `msaNote`) are non-indexed object
fields — Dexie stores them freely without an IDB version bump. No migration is required
for existing rows (wedge = no existing production rows).

The reducer (`reduceMeasurementPlans` in `packages/core/src/measurementPlan/actions.ts`) is
a pure spread-merge — it requires no changes when new fields are added to `MeasurementPlan`
(the `MeasurementPlanPatch` type auto-widens via `Partial<Omit<...>>`).

## UI threading

```
WallCanvas (planningProps bag)
  └─ derives stepOptions from processMap via deriveProcessSteps()
  └─ forwards defaultScope? + defaultOutcome? from planningProps
     └─ HypothesisCardWithPlans
          └─ AddPlanForm
               scope = defaultScope ?? []
               processLocation = selected stepOption.id ('' if none / no options)
               outcome = user input || defaultOutcome || ''
```

Call sites that cannot cheaply source `defaultScope` or `defaultOutcome` pass `undefined`;
the form defaults to `[]` / `''` respectively.

## Related decisions

- [ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md) — `ConditionLeaf`
  scope capture (WHERE snapshot).
- [ADR-087](../../07-decisions/adr-087-process-step-model-reconciliation.md) — `processLocation`
  non-strict join; `deriveProcessSteps` as the single read source.
- [Decision log 2026-05-30](../../decision-log.md) — `hypothesisId` stays required + immutable;
  `neededFactors[]` = dataset column names contract pinned.
