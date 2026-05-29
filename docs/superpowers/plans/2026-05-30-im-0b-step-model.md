---
tier: ephemeral
purpose: build
title: 'IM-0b — Process-step model reconciliation core (sub-plan)'
status: draft
date: 2026-05-30
layer: spec
---

# IM-0b — Process-step model reconciliation (core)

> **For agentic workers:** Sub-plan for IM-0b of the [investigation-surface master plan](2026-05-29-investigation-surface-master-plan.md). Execute as **ONE Opus implementer dispatch** (Architect → Migration → Validator) — a type/structure cascade. Branch `im-0b-step-model` (off origin/main with IM-0a). Canonical decision: [ADR-087](../../07-decisions/adr-087-process-step-model-reconciliation.md).

**Goal:** Make the rich `ProcessMap` the single canonical step structure; `IP.processSteps` becomes a derived read-only projection; unify on ONE step-id scheme; wire `onFactorControlAdd`. **Scope split (grounding-driven):** the ProcessMapBase authoring-relocation (ctqColumn / capabilityScope / tributaries / subgroupAxes / ctsColumn → canvasStore actions) is the heavy chunk and **gates nothing downstream** (the join reads those fields regardless of how they were authored) → deferred to **IM-0b-2**. `processLocation` (the `MeasurementPlan` field) ships in **IM-2**, not here — IM-0b only establishes the canonical node-id it resolves against.

**Wedge stance:** no users → no data migration. IDB version bump only.

---

## The crux (grounding): two disconnected author paths

- **Path A (rich map):** canvas add/rename/remove/connect step + chip placement → canvasStore mutators → `persistCanvasStoreMap()` → `setProcessContext({...,processMap})` (`CanvasWorkspace.tsx:1044,429`). Mints ids `step-${slug}-${seq}` (`canvasStore.ts:140`).
- **Path B (flat list):** drag a categorical column onto the Process zone → `handleProcessStructureDrop` → `extractStepsFromCategoricalColumn` (mints `step-${columnName}-${idx}`, `ProcessZone/extractStepsFromCategoricalColumn.ts:23`) → `handleStepsReplace` → `patchActiveIP({ processSteps })` (`CanvasWorkspace.tsx:592-616`).

They never cross. **Making `processSteps` derive is NOT enough — Path B's write must be retargeted at the rich map, or the column-drop gesture silently stops creating steps.** This is the #1 break risk.

> **Verified safe:** the join engine (`getStepColumnAssignments` `frame/stepColumns.ts:40`, `conditionReferencesStep` `findings/hypothesisCondition.ts:140`) derives column overlap from `assignments`/`tributaries`/`node.ctqColumn` — it never parses the column name out of the id. So retiring the `step-${columnName}-${idx}` scheme does not break the join.

---

## Tasks (one Opus dispatch, per-category commits)

### Architect

- Confirm branch `im-0b-step-model`. Read ADR-087, spec §8, this sub-plan, `canvasStore.ts` (the `applyUndoable` + `persistCanvasStoreMap` signature-guard pattern), `CanvasWorkspace.tsx:340-435` (hydrate/persist seam).
- **TDD first:** add `deriveProcessSteps(map: ProcessMap | undefined): ProcessStepEntry[]` in `packages/core/src/frame/` (`= map.nodes.map(n => ({id:n.id,name:n.name,order:n.order})).sort(by order)`) + unit test. Add canvasStore action `addStepsFromColumn(columnName, distinctValues)` (one node per value via `nextStepId`, canvas scheme; `applyUndoable` + persist) + store test.

### Migration (per-category commits)

- **core**: `deriveProcessSteps`; resolve the contradictory comments at `improvementProject/types.ts:50-55,156-167` → "`stepId` references a canonical `ProcessMap` node id; `processSteps` is a read-only projection of `processContext.processMap.nodes`." Commit `refactor(core): processSteps derived from ProcessMap (IM-0b)`.
- **stores**: `addStepsFromColumn` action (+ undo/redo + persist). Commit `feat(stores): canvasStore addStepsFromColumn — one id scheme (IM-0b)`.
- **ui**: `CanvasWorkspace.tsx` — replace `:564` `activeIP?.processSteps ?? localProcessSteps` with `deriveProcessSteps(map)`; delete `localProcessSteps` state + `setProcessSteps` + the `patchActiveIP({processSteps})` arm; retarget `handleStepsReplace`/`handleProcessStructureDrop` to dispatch `addStepsFromColumn` (retire the `step-${columnName}-${idx}` mint); wire `onFactorControlAdd` at `:1208` (+ the `:1318` `onControlAdd` stub) to write `IP.goal.factorControls` with `stepId` resolved against the canonical node id. **Mind the hydrate/persist signature race** (`lastHydratedMapSignature` must be set before `handleChange`, mirror `persistCanvasStoreMap`). Commit `refactor(ui): Canvas authoring writes the canonical map (IM-0b)`.
- **apps**: IDB version bump — azure `db/schema.ts` `version(16).stores({})`, pwa `version(9).stores({})`, no `migrateX` (mirror the IM-0a v15/v8 comment). Commit `chore(apps): IDB bump for step-model reconciliation (IM-0b)`.
- **test-util migration**: `createTestIP({processSteps})` (`packages/ui/src/test-utils/improvementProject.ts:22,64`) — `processSteps` is no longer a settable field; seed `processContext.processMap.nodes` instead. Update affected tests: `CanvasWorkspace.test.tsx`, `ExploreExitButton.test.tsx`, `deriveExploreLandingView.test.ts`, `e1-create-project-flow.test.tsx`, `schema.v6.test.ts`, `core/improvementProject/__tests__/types.test.ts`. Commit `test(im-0b): seed process steps via ProcessMap nodes`.

### Validator

- `pnpm --filter @variscout/core --filter @variscout/stores --filter @variscout/ui build` (tsc) + **app tsc on BOTH apps** (`pnpm --filter @variscout/azure-app exec tsc --noEmit` + pwa) — `pr-ready-check` does NOT catch app test-file tsc (the IM-0a lesson, `feedback_ui_build_before_merge`). Targeted vitest on touched packages (< 90 s each). No `--no-verify`. No full turbo sweep (controller runs `pr-ready-check`).
- Report per-category SHAs + `git show --stat` + any consumer that needed judgment + confirmation the column-drop still creates steps (rich nodes, one id scheme).

---

## Acceptance

- `IP.processSteps` is a derived projection of `map.nodes` (no stored write path survives); `deriveProcessSteps` is the single read source.
- Column-drop-to-process-zone creates **rich nodes** via `addStepsFromColumn` (canvas id scheme); `step-${columnName}-${idx}` is retired — one id scheme.
- `onFactorControlAdd` writes `factorControls` with a `stepId` resolved against the canonical node id (no more `undefined`/no-op stub).
- `getStepColumnAssignments` / `conditionReferencesStep` unchanged + green; per-step `capabilityScope` + ADR-073 untouched.
- Both apps' IDB bumped; both apps' **app tsc clean**; touched-package vitest green.

## Out of scope

- **IM-0b-2:** move ctqColumn / capabilityScope / tributaries / subgroupAxes / ctsColumn authoring off the deprecated `ProcessMapBase` into canvasStore actions (gates nothing downstream).
- **IM-2:** the `MeasurementPlan.processLocation` field.
