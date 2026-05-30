---
title: 'ADR-087: Process-step model reconciliation — rich ProcessMap is canonical'
status: active
date: 2026-05-29
purpose: decide
tier: living
audience: both
topic: [canvas, stores, frame, wedge-v1]
related:
  - adr-085-drop-question-problem-statement-scope
  - adr-081-canvas-viewport-architecture
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - 2026-05-29-investigation-surface-design
layer: L5
last-verified: 2026-05-29
---

# ADR-087: Process-step model reconciliation — rich ProcessMap is canonical

**Status:** Accepted
**Date:** 2026-05-29

## Context

The investigation-surface design (2026-05-29, Clusters A/B/C) settles a V1 spine that
joins outcomes, factors, and a Measurement Plan to **process steps** via a `processLocation`
(stepId) key, and recurses Y → X → x through the process flow (L1 → L2 → L3). Every one of
those features depends on a single, trustworthy answer to the question _"what is a step, and
what is its id?"_ — and today the codebase does not have one.

There are **three** homes for step structure, not two:

1. **Rich, canonical — `ProcessMap`.** `ProcessContext.processMap?: ProcessMap`
   (`packages/core/src/ai/types.ts:142`, persisted per ADR-070) holds the structure that
   actually carries the joinable shape: each `ProcessMapNode`
   (`packages/core/src/frame/types.ts:29`) has `ctqColumn`, `capabilityScope`, `tributaries`,
   and `parentStepId`. `ProcessMap` itself is at `packages/core/src/frame/types.ts:109`. This
   is Hub-owned.
2. **Working-copy projection — `canvasStore.canonicalMap`.** The canvas hydrates a working
   copy from `processContext.processMap` (`canvasStore.ts:13`; hydration at
   `CanvasWorkspace.tsx:414` and `:318`) and exposes 10 dispatch handlers for editing it.
3. **Flat, separate — `IP.processSteps`.** `IP.processSteps?: ProcessStepEntry[]`
   (`packages/core/src/improvementProject/types.ts:161`) is a second, independent list of
   `{ id, name, order }` (`ProcessStepEntry` at `types.ts:25`). It is referenced by
   `stepTimings.stepId`, `goal.outcomeGoals[].stepId`, and `goal.factorControls[].stepId`.

**There is no sync code between the rich map and the flat list** — a grep returns zero. Worse,
the two id schemes **diverge**: the canvas mints `step-${slug}-${seq}` (`canvasStore.ts:146`)
while the flat extractor mints `step-${columnName}-${idx}`
(`extractStepsFromCategoricalColumn.ts:23`). A `stepId` persisted against one scheme will not
resolve against the other — silent orphaning.

The doc comments themselves contradict each other on what `stepId` even points at:
`improvementProject/types.ts:52` says it "references a step id in the IP's ProcessMap" — but the
IP has **no `processMap` field** — while `:166` says it "references entries in `processSteps`".
The reconciliation must state, unambiguously, which structure `stepId` resolves against.

The column-overlap join engine already exists and is read-only: `getStepColumnAssignments`
(`packages/core/src/frame/stepColumns.ts:40`) and `conditionReferencesStep`
(`packages/core/src/findings/hypothesisCondition.ts:160`); the L3 `LocalMechanismView`
recursion is scoped through these. The pieces are built against the rich map — the flat list
is the outlier.

This ADR is the architectural prerequisite (PR IM-0) that gates the `processLocation` join and
L2/L3 recursion work in the sibling ADRs and the spec's Measurement-Plan (DCP) section. It is a
plumbing decision, not a feature.

## Decision

**The rich `ProcessMap` / `ProcessMapNode` is the single canonical step structure. The flat
`IP.processSteps` becomes a derived read-only projection of `map.nodes`, computed on read.
All step references resolve against rich-map node ids.**

Concretely:

1. **`ProcessMap` stays Hub-owned and canonical** on `ProcessContext.processMap`. It is the
   only structure that carries `ctqColumn`, `capabilityScope`, `tributaries`, and
   `parentStepId` — everything the `processLocation` join, L2/L3 recursion, and
   column-overlap binding need. We do not churn its ~53-file consumer surface. Per the
   2026-05-18 decision-log, **one Project wraps one Hub 1:1**, so Hub-owned _is_
   Project-owned; the sibling prereq **IM-0a** enforces that 1:1 (retiring the legacy
   `improvementProjects[]` / `projectsByHub` machinery and re-keying project-scoped state
   by `ProjectId`), and this step-model reconciliation runs as **IM-0b**.
2. **`IP.processSteps` becomes a derived projection** of `map.nodes` (`{ id, name, order }`
   computed on read from the canonical nodes), **not a second source of truth.** Consumers
   that read `IP.processSteps` repoint to the projection. There is no longer anything to keep
   in sync because there is no second store.
3. **One step-id scheme.** All `stepId` values resolve against the canonical rich-map node id.
   We retire the divergent `step-${columnName}-${idx}` minting; node ids come from the canvas
   scheme. Per the wedge "no users yet, no migration, no back-compat" stance, we ship a
   **no-data IDB version bump** (schema-version increment only) — **we do not build a
   `migrateX()` helper.** Existing persisted `goal.stepId` / `stepTimings.stepId` values that
   were minted against the old flat scheme may **orphan** (fail to resolve to a node). This is
   stated honestly and is **acceptable pre-launch** — see Consequences.
4. **`processLocation` (stepId) is the join key** used by the Measurement Plan / DCP
   (sibling work, [ADR-085](adr-085-drop-question-problem-statement-scope.md) + the spec's DCP
   section). It resolves against the canonical rich-map node id — the same id everything else
   now uses.
5. **Rich-map authoring moves onto the canvas.** Authoring of `ctqColumn` / `capabilityScope`
   / `tributaries` moves **off** the deprecated `ProcessMapBase` and **into** `canvasStore`
   actions plus the Canvas Edit-mode UI. `onFactorControlAdd` (currently passed `undefined`)
   gets wired.

   > [!NOTE]
   > **Stale as of IM-0b / IM-0b-2 (2026-05-30).** `onFactorControlAdd` is **already wired**
   > (IM-0b — `CanvasWorkspace.handleFactorControlAdd` → `IP.goal.factorControls`); the
   > "currently passed `undefined`" phrasing is historical. **IM-0b-2** moved `ctqColumn` /
   > `tributaries` / `subgroupAxes` / hunch authoring into `canvasStore` actions dispatched
   > by `ProcessMapBase` (the second persistence path is retired). **Scope cut:** per-step
   > `capabilityScope` (`SpecRule[]`) authoring was **deferred** — the per-step specs editor
   > keeps routing to project-wide `measureSpecs` via `setMeasureSpec`; canvasStore has **no**
   > `setStepCapabilityScope` action. Deferred to the IM-5/IM-6 holistic design. The full
   > visual retirement of `ProcessMapBase` is also deferred (it is now a thin dispatcher).
   > See `investigations.md` "IM-0b-2 deferrals".

**Scope note (WHERE ≠ WHY).** A `stepId` answers _where in the process_ a measure, outcome,
factor, or condition sits — it is a location key, not a cause. Steps locate evidence; they do
not explain it. A suspected contribution (Hypothesis) is a mechanism nested **within** a
scoped step condition, never the step itself. This reconciliation unifies the _location_
vocabulary only; it makes no causal claim.

## Rationale

- **The rich map is where the feature work already lives.** Capability per step, tributaries,
  parent/child recursion, and the column-overlap join engine are all built against
  `ProcessMapNode`. The flat list carries none of it. Making the structure that already does
  the work canonical is the low-churn choice; promoting the flat list would mean rebuilding
  five features it cannot express.
- **One source of truth removes the sync bug class entirely.** The hazard here is not a sync
  bug we need to fix — it is the _absence_ of sync between two independent stores with
  divergent id schemes. A derived projection cannot drift from its source, so the entire
  class of "the IP says step X, the map says step Y" defects disappears by construction.
- **The wedge stance makes the cheap path the correct path.** With no production users
  (ADR-082), there is no migration obligation. Building a `migrateX()` helper for the old flat
  ids would be ceremony that protects data that does not exist. A bare schema-version bump,
  plus an honest statement that pre-launch fixtures may orphan, is the pragmatic minimum that
  catches the actual risk (a fixture silently resolving to the wrong step) by failing loudly.
- **Per-step capability must survive untouched.** `capabilityScope` is per-node (a per-step
  `ctqColumn` + `SpecRule`). The reconciliation preserves per-step capability exactly and
  introduces **no roll-up across steps** — there is no aggregate Cp/Cpk over a flow of
  heterogeneous steps ([ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md);
  Cp/Cpk only, no Pp/Ppk per ADR-084). Steps remain distributions, not an aggregate.
- **Concentrating the change on the small side bounds the blast radius.** The flat-model
  consumer set is ~9 non-test files; the rich-map consumer set is ~53. Demoting the small side
  to a projection is the move that touches the fewest files while making the structure that
  matters canonical.

## Consequences

### Code-level

- `IP.processSteps?: ProcessStepEntry[]` (`improvementProject/types.ts:161`) is recomputed from
  `map.nodes` on read. The `ProcessStepEntry` shape (`types.ts:25`, `{ id, name, order }`) is
  retained as the projection's element type; ~6 `ProcessStepEntry` consumers repoint to the
  derived value.
- The cascade is concentrated on the flat-model side (~9 non-test files plus tests):
  `deriveExploreLandingView`, `improvementProject/types`, `CanvasWorkspace`,
  `ExploreExitButton`, `EditModeToolbar`, `extractStepsFromCategoricalColumn`, the Azure
  `FrameView`, and both apps' `db/schema.ts`.
- The divergent id minting in `extractStepsFromCategoricalColumn.ts:23`
  (`step-${columnName}-${idx}`) is retired; the canvas scheme `step-${slug}-${seq}`
  (`canvasStore.ts:146`) is the single source of node ids.
- Both apps' IDB schemas (`apps/azure` + `apps/pwa` `db/schema.ts`) persist `processSteps`, so a
  **schema-version bump is required**. It is a version increment only — **no `migrateX()`
  helper.** The data-migration story is "none; pre-launch."
- Rich-map authoring (`ctqColumn` / `capabilityScope` / `tributaries`) moves off the deprecated
  `ProcessMapBase` into `canvasStore` actions + Canvas Edit-mode UI. `onFactorControlAdd`,
  currently passed `undefined`, is wired.
  <!-- STALE as of IM-0b / IM-0b-2 (2026-05-30): onFactorControlAdd is already wired (IM-0b).
       IM-0b-2 moved ctqColumn/tributaries/subgroupAxes/hunch authoring into canvasStore
       (ProcessMapBase dispatches; second persistence path retired). Per-step capabilityScope
       authoring was DEFERRED to IM-5/IM-6 (specs still route to project-wide measureSpecs);
       full visual retirement of ProcessMapBase also deferred. See investigations.md. -->
- The read-only join engine (`getStepColumnAssignments` at `frame/stepColumns.ts:40`,
  `conditionReferencesStep` at `findings/hypothesisCondition.ts:160`) is unchanged — it already
  resolves against rich-map nodes.

### Methodological

- Per-step capability is preserved exactly: each step's `capabilityScope` (`ctqColumn` +
  `SpecRule`) computes its own Cp/Cpk. There is **no aggregate capability across steps** — a
  multi-step flow is a set of per-step distributions, not a rolled-up index
  ([ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md)). Trust in a step's
  number remains a soft caveat (op-def / MSA notes), not a stability gate.
- `stepId` is purely a **location** key (the {step} the evidence sits at). It carries no causal
  weight; suspected contributions remain mechanisms nested within a scoped step condition.

### Forward implication

- This ADR unblocks the `processLocation` join and the L2/L3 (`LocalMechanismView`) recursion in
  the spec — once there is one node-id scheme, the Measurement Plan / DCP can bind a needed
  factor to a `processLocation` that actually resolves.
- The doc-comment contradiction at `improvementProject/types.ts:52` vs `:166` is resolved in
  favor of a single statement: **`stepId` references a canonical `ProcessMap` node id**, surfaced
  to the IP via the derived projection. Both comments are rewritten to say exactly that.

### Documentation

- The investigation-surface spec
  ([2026-05-29-investigation-surface-design](../superpowers/specs/2026-05-29-investigation-surface-design.md))
  must state, in its Measurement-Plan / DCP and process-flow sections, that `processLocation`
  resolves against the canonical rich-map node id — not against `IP.processSteps` (which is now a
  projection of that same structure).
- This ADR is the durable home for the "rich map is canonical, flat list is a projection"
  decision; the decision-log CANDIDATE for the step-model reconciliation graduates here.

## Alternatives considered

1. **Keep both structures and add a sync layer.** Rejected: building bidirectional sync between
   two stores with divergent id schemes adds exactly the maintenance and drift surface this ADR
   exists to remove. A derived projection cannot drift; a synced copy can.
2. **Make the flat `IP.processSteps` canonical and derive the map.** Rejected: the flat shape
   (`{ id, name, order }`) cannot express `ctqColumn`, `capabilityScope`, `tributaries`, or
   `parentStepId`. Five features (per-step capability, the column-overlap join, L2/L3 recursion,
   tributaries, the `processLocation` bind) would have to be rebuilt on a structure that loses
   the information they need.
3. **Build a `migrateX()` helper to re-key old flat `stepId`s to node ids.** Rejected per the
   wedge no-users / no-migration stance (ADR-082). It would protect data that does not exist and
   add a code path that has no production caller. A bare schema-version bump with honest
   orphaning is the pragmatic minimum.
4. **Defer reconciliation; build the `processLocation` join against whichever structure is handy
   per call site.** Rejected: that is how three homes became three homes. Two structures with
   divergent id schemes and no sync is precisely the state that produces silent orphaning. The
   join key must resolve against one id scheme, decided once, here.
