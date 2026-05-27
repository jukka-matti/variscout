---
tier: ephemeral
purpose: build
title: PR-CCJ-C — Outcome zone + Factors zone + Process structure zone — Master Sequencer
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-C — Outcome zone + Factors zone + Process structure zone — Master Sequencer

> **For agentic workers:** This is the PR-level master sequencer for Phase C of the Canvas Connection Journey (master-of-master per `feedback_master_plan_for_multi_subsystem_specs`). It does NOT contain bite-sized 2–5-minute task steps; those come from per-sub-PR `superpowers:writing-plans` invocations when each sub-PR is ready to execute. Use `superpowers:subagent-driven-development` to execute individual sub-PRs once their sub-plans are drafted.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.2, §3.2.1, §3.2.2, §3.3, §3.3.1, §3.4, §4.2, §4.3

**Parent master plan:** [`2026-05-26-canvas-connection-journey-master-plan.md`](./2026-05-26-canvas-connection-journey-master-plan.md) §"Phase C — Outcomes + Factors + Process structure"

**Depends on:** PR-CCJ-A2 (canAccess 2-tier collapse), PR-CCJ-A3 (multi-outcome types + step-bound `stepId?` on outcome goals), PR-CCJ-B1 (EditModeShell + State/Edit toggle), PR-CCJ-B2 (column chips + palette + parsing UX, drag-id codec `column:<name>`). All shipped.

---

## Why master-of-master

The master plan flagged Phase C explicitly: C3 is annotated _"Sub-plan needed: YES"_ given its size (5–7 days, ~10 tasks). Three reasons to keep all three sub-PRs split rather than collapsing C1+C2 into one PR:

- Each zone is an independent surface with its own drop-id codec, primitives, and tests; combining them would exceed `feedback_slice_size_cap` (~6–8 tasks/PR for feature work where complexity grows nonlinearly).
- C2 requires a type-level extension to `ImprovementProjectFactorControl` (adding `stepId?: string`); keeping that isolated lets C1 ship without touching `@variscout/core` types and lets C2's review focus on the type ripple.
- C3's emergent-step interaction is the highest-judgment work in Phase C; running it after C1+C2 means its sub-plan can be written against locked-in C-zone drop-id conventions rather than speculative ones (`feedback_master_plan_for_multi_subsystem_specs` plan-as-you-execute principle).

---

## Sub-PR sequence

```
C1 Outcome zone + specs popover   ─→  C2 Factors zone + step-bound model   ─→  C3 Process structure zone + emergent steps
   (3–4 days, ~7 tasks)                  (3–4 days, ~7 tasks)                       (5–7 days, ~10 tasks, own master-of-master)
```

Strict ordering: C2 needs C1's `useDroppable` zone conventions + `OutcomeCard`/`SpecsPopover` patterns to mirror in `FactorChip`/`FactorPopover`. C3 needs C2's step-bound contract (drop id `factor-zone:step:<stepId>`) to wire step-side receivers.

### PR-CCJ-C1 · Outcome zone + specs popover (UI)

**Scope:** Top half of the Outcomes & Factors zone column in `EditModeShell`. Renders an `<OutcomeZone>` `useDroppable` target with the singleton id `outcome-zone:singleton` that accepts `column:<name>` drag events from the palette. On drop: derives default specs from the dropped column's numeric values + `characteristicType` (`smallerIsBetter` / `largerIsBetter` / `nominalIsBest`), creates an `OutcomeCard` with direction indicator (`↑` / `↓` / `=`) + spec pills (`target / LSL / USL / Cpk`) + `⚙` button. `SpecsPopover` opens on `⚙` click — fixed position, viewport-clamped, mutual-exclusion overlay state in zone; LSL disabled when smallerIsBetter, USL disabled when largerIsBetter, Cpk target defaults to 1.33 (customer-overridable per §3.2.1).

**Files:**

- Create `packages/ui/src/components/Canvas/EditMode/OutcomeZone/index.tsx` — OutcomeZone container
- Create `packages/ui/src/components/Canvas/EditMode/OutcomeZone/OutcomeCard.tsx` — outcome chip
- Create `packages/ui/src/components/Canvas/EditMode/OutcomeZone/SpecsPopover.tsx` — specs editor popover
- Create `packages/ui/src/components/Canvas/EditMode/OutcomeZone/encodeOutcomeDropId.ts` — drop-id codec
- Create `packages/ui/src/components/Canvas/EditMode/OutcomeZone/deriveDefaultSpecs.ts` — derive target from values + characteristicType
- Create `packages/ui/src/test-utils/outcomeSpec.ts` — `createTestOutcomeSpec()` factory
- Create 4 test files (`OutcomeCard`, `SpecsPopover`, `OutcomeZone`, `deriveDefaultSpecs`)
- Modify `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — wire OutcomeZone (top half of Outcomes & Factors zone), add `outcomeSpecs` + `onOutcomeSpecAdd` + `onOutcomeSpecUpdate` + `numericValuesByColumn` props

**Includes:**

- `OutcomeCard` with direction indicator + spec pills + `⚙` button
- `SpecsPopover` with target/LSL/USL/cpkTarget inputs + characteristicType radio; LSL disabled when smallerIsBetter, USL disabled when largerIsBetter
- `OutcomeZone` `useDroppable` wrapper, empty-state hint, cyan-dashed `isOver` affordance, mutual-exclusion popover state via single `openSpecsForSpecId: string | null` slot (mirrors B2.3 `OpenOverlay` discipline)
- Multi-outcome handled by horizontal wrap (per §3.2.2 — no "primary" hierarchy)
- `deriveDefaultSpecs` pure helper: mean-as-target for nominalIsBest; LSL/USL unset by default; Cpk target always 1.33

**Size:** ~7 tasks. Pure UI TDD; no `@variscout/core` type changes.

**Sub-plan:** [`2026-05-27-canvas-connection-journey-c-1-outcome-zone.md`](./2026-05-27-canvas-connection-journey-c-1-outcome-zone.md) — produced alongside this sequencer.

### PR-CCJ-C2 · Factors zone + global/step-bound model (UI + core type extension)

**Scope:** Bottom half of the Outcomes & Factors zone column. Extends `ImprovementProjectFactorControl` in `packages/core/src/improvementProject/types.ts:41-45` with `stepId?: string` for step-bound factors (direct add, no migration helper per `feedback_wedge_v1_no_migration_no_backcompat`). Renders global factor chips when dropped on the global factor zone, with visual styling that distinguishes global from step-bound state. Drop zone id: `factor-zone:global`. Step-bound drops route through C3's step boxes (drop id `factor-zone:step:<stepId>`) — C2 emits the contract; C3 wires the step-side receivers.

**Files:**

- Modify `packages/core/src/improvementProject/types.ts` — add `stepId?: string` to `ImprovementProjectFactorControl`
- Create `packages/ui/src/components/Canvas/EditMode/FactorZone/index.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx`
- Create `packages/ui/src/components/Canvas/EditMode/FactorZone/FactorPopover.tsx` — target-condition editor + step-binding selector
- Create `packages/ui/src/components/Canvas/EditMode/FactorZone/encodeFactorDropId.ts` — `factor-zone:global` + `factor-zone:step:<stepId>` codec
- Modify `EditModeShell.tsx` — wire FactorZone (bottom half of Outcomes & Factors zone), add `factorControls` + `onFactorAdd` + `onFactorUpdate` props
- 4 test files

**Includes:**

- `FactorChip` with target-condition pill + step-binding indicator (global vs step-bound visual)
- `FactorPopover` for target-condition + linkedHypothesisId + step-binding edits
- `FactorZone` `useDroppable` wrapper for `factor-zone:global` drop id
- Step-bound drop id contract exposed for C3 consumption

**Size:** ~7 tasks.

**Sub-plan:** `2026-05-27-canvas-connection-journey-c-2-factor-zone.md` — written after C1 merged (link added when file lands).

### PR-CCJ-C3 · Process structure zone + emergent step model (UI; own master-of-master)

**Scope:** Replaces the children slot of EditModeShell's process zone with a fully drop-aware `<ProcessStructureZone>`. Categorical column drop (3–30 distinct values) → emergent step boxes materialize from those values. Each step box renders internal Y (step-bound outcomes) + internal X (step-bound factors) sections that accept the respective drop ids (`outcome-zone:step:<stepId>`, `factor-zone:step:<stepId>`). Timing badge appears when ≥ 1 step has paired start+end (Phase D feeds the timing model; C3 just renders the placeholder slot).

**Likely sub-splits** (decided when C3 writing-plans runs):

- C3.1 · Emergent step materialization from categorical column drop
- C3.2 · Step-bound drop targets within step boxes (outcome + factor receivers)
- C3.3 · Step box visual state + timing badge placeholder slot

**Size:** 5–7 days, ~10 tasks total across sub-splits.

**Sub-plan:** TBD — runs `superpowers:writing-plans` after C2 merged.

---

## Plan + parallel-write discipline

Per `feedback_one_worktree_per_agent` + `feedback_subagent_driven_default`:

- Each sub-PR gets its own branch + worktree (`.worktrees/<branch>/`); main session stays at repo root.
- Per-PR sub-plan executes via `superpowers:subagent-driven-development` (fresh implementer per task + spec reviewer + code quality reviewer + final Opus branch reviewer).
- Right-size models per task: Sonnet for well-specified TDD against 1–3 files (standard); Opus for type-ripple work + final branch review (`feedback_subagent_driven_default`).
- Use `gh pr merge --merge --delete-branch` per `feedback_preserve_commit_history` (NOT `--squash`).

---

## Out of scope for Phase C (entire master-of-master)

- **Persistence of outcome/factor specs to IP blob** — C-phase state is prop-driven; consumer (PWA / Azure app) wires Zustand bridge in **E1 (Charter modal)** when the IP blob shape locks in.
- **Derived chips with the `✨` marker** (`Lead_time`, `Total_work_time`, etc.) appearing in palette — Phase D, PR-CCJ-D1.
- **Ghost-suggested heuristics** (the heuristic computation that decides which palette chips look ghost-suggested) — Phase F, PR-CCJ-F1. ColumnChip already has the prop surface from B2.2.
- **Inflection binning** in the chip context menu — Phase G, PR-CCJ-G1.
- **Drag-source visual feedback** on ColumnChip (`dropped` prop driven by drop success) — wired during C-phase drop handlers; chip is already prop-ready from B2.2.

---

## Verification (overall Phase C completion)

After C3 merges, the canvas Edit mode is a fully drop-aware authoring surface:

- Palette column chip → drag → drop on outcome zone creates an `OutcomeCard` with derived specs (C1)
- Palette column chip → drag → drop on factor zone creates a global `FactorChip` (C2)
- Palette categorical column (3–30 distinct values) → drag → drop on process zone materializes emergent step boxes from values (C3)
- Step box → accepts step-bound outcome drops (`outcome-zone:step:<stepId>`) + step-bound factor drops (`factor-zone:step:<stepId>`) (C3)
- Each card has a `⚙` button that opens its specs/conditions popover; only one popover open at a time (mutual exclusion preserved across all C-phase surfaces)

No regressions on prior ui suite (2191+ tests).

---

## Related

- [[wedge-v1]] (canonical product anatomy)
- [[canvas-connection-journey]] (Spec 2 memory)
- [[feedback_master_plan_for_multi_subsystem_specs]] (why this is master-of-master)
- [[feedback_slice_size_cap]] (≤ 6–8 tasks/PR)
- [[feedback_subagent_driven_default]] (execution shape)
- [[feedback_one_worktree_per_agent]] (parallel discipline)
- [[feedback_preserve_commit_history]] (merge strategy)
- [[feedback_wedge_v1_no_migration_no_backcompat]] (C2 type extension policy)
