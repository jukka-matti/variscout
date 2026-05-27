---
tier: ephemeral
purpose: build
title: PR-CCJ-C2 — Factors zone + global/step-bound model
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-C2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task.

**Goal:** Render the bottom half of EditModeShell's Outcomes & Factors zone as a functional drop target: `FactorZone` accepts `column:<name>` drag events from the palette and emits `onFactorControlAdd(columnName)`. Extends `ImprovementProjectFactorControl` with optional `stepId?: string` for step-bound factors. **Also wires both `handleOutcomeDrop` (deferred from C1) and the new `handleFactorDrop` into the parent `Canvas/index.tsx` `handleDragEnd`** — so column-drop → outcome/factor card actually fires end-to-end.

**Architecture:** UI TDD + one type extension in `@variscout/core`. `useDroppable` wraps the global factor zone with id `factor-zone:global`; the codec also produces per-step IDs `factor-zone:step:<stepId>` (for C3 to receive). Mutual-exclusion popover state mirrors `OutcomeZone` (`openFactorPopover: { factor: string; anchor } | null`). Wiring at Canvas: extend the existing parent `handleDragEnd` callback chain (already handles `chip:` → `step:` / `canvas:empty`) with C-phase column routing.

**Tech Stack:** React 18, TypeScript, `@dnd-kit/core` (`useDroppable`), Tailwind semantic tokens, Vitest + happy-dom.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.3, §3.3.1 ("One drag gesture, four positions, two roles")

**Parent master sequencer:** `2026-05-27-canvas-connection-journey-c-master-plan.md`

**Depends on:** PR-CCJ-C1 (OutcomeZone primitives, `decodeColumnDragId`, `handleOutcomeDrop` helper, EditModeShell prop shape). Shipped at `b12e5e6e`.

---

## File Structure

```
Create:
  packages/ui/src/test-utils/factorControl.ts                                                — createTestFactorControl() factory
  packages/ui/src/components/Canvas/EditMode/FactorZone/encodeFactorDropId.ts                — drop-id codec
  packages/ui/src/components/Canvas/EditMode/FactorZone/FactorChip.tsx                       — factor chip primitive
  packages/ui/src/components/Canvas/EditMode/FactorZone/FactorSpecsPopover.tsx               — popover editor
  packages/ui/src/components/Canvas/EditMode/FactorZone/index.tsx                            — FactorZone container
  packages/ui/src/components/Canvas/EditMode/handleFactorDrop.ts                             — pure drag-end router
  packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/encodeFactorDropId.test.ts
  packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorChip.test.tsx
  packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorSpecsPopover.test.tsx
  packages/ui/src/components/Canvas/EditMode/FactorZone/__tests__/FactorZone.test.tsx
  packages/ui/src/components/Canvas/EditMode/__tests__/handleFactorDrop.test.ts
Modify:
  packages/core/src/improvementProject/types.ts                                              — add stepId?: string to ImprovementProjectFactorControl
  packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx                               — wire FactorZone (bottom half), add factor props
  packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx                — FactorZone wiring assertions
  packages/ui/src/components/Canvas/index.tsx                                                — route column drops to outcome + factor helpers in handleDragEnd
```

---

## Tasks

### Task 1 — Worktree + branch + type extension + test factory

- Create worktree `.worktrees/feat/wedge-v1-ccj-c-2-factor-zone/` off main.
- Modify `packages/core/src/improvementProject/types.ts`: add `stepId?: string` to `ImprovementProjectFactorControl` (direct add, no migration — per `feedback_wedge_v1_no_migration_no_backcompat`).
- Create `packages/ui/src/test-utils/factorControl.ts` with `createTestFactorControl(overrides?: Partial<ImprovementProjectFactorControl>): ImprovementProjectFactorControl` defaulting to `{ factor: 'Temperature', targetCondition: '120 ± 5°C' }`.
- Sanity test on factory.
- Run `pnpm --filter @variscout/ui test factorControl.test` and `pnpm --filter @variscout/ui build` — verify the type extension doesn't break any consumers (it shouldn't since `stepId` is optional).
- Commit: `feat(core,ui): add stepId to ImprovementProjectFactorControl + factory`

### Task 2 — `encodeFactorDropId` codec

- Failing test for: `encodeFactorDropId('global') === 'factor-zone:global'`; `encodeFactorDropId({ stepId: 's-1' }) === 'factor-zone:step:s-1'`; `isFactorDropId(value)` type guards; `decodeFactorDropId(value)` returns `{ scope: 'global' } | { scope: 'step'; stepId: string } | null`.
- Implement `encodeFactorDropId.ts` with these signatures. Discriminated-union argument keeps callers explicit.
- Commit: `feat(ui): encodeFactorDropId codec (global + per-step)`

### Task 3 — `FactorChip` primitive

- Failing tests: renders `factor` name + target-condition pill + step-binding indicator (`step <stepId>` pill if stepId set, otherwise `global` pill) + `⚙` button emitting `onSpecsClick(anchor)` from `getBoundingClientRect()`.
- Implement `FactorChip.tsx`. Props: `{ control: ImprovementProjectFactorControl; onSpecsClick: (anchor) => void }`. Mirror `OutcomeCard` styling. Step-binding pill uses `bg-surface-secondary text-content-secondary`; global uses `bg-blue-50 text-blue-700` to distinguish visually.
- Commit: `feat(ui): FactorChip with target-condition pill and binding indicator`

### Task 4 — `FactorSpecsPopover`

- Failing tests: renders fixed-positioned popover; input for `targetCondition` (free text per current type); selector for `stepId` (None | each step from prop list); Escape + backdrop close; Apply fires `onApply(updatedControl)`.
- Implement `FactorSpecsPopover.tsx`. Props: `{ control; anchor; steps: { id: string; name: string }[]; onApply; onClose }`. Mirror `OutcomeSpecsPopover` for backdrop + Escape patterns. Step selector is a `<select>` with options `[{value: '', label: 'Global (no step binding)'}, ...steps.map]`.
- Commit: `feat(ui): FactorSpecsPopover with target-condition + step-binding editor`

### Task 5 — `FactorZone` container

- Failing tests:
  - Renders `useDroppable({ id: 'factor-zone:global' })` wrapper with `data-testid="factor-zone-global"`
  - Empty state: hint text "Drop a column to set a factor"
  - Renders one `FactorChip` per control
  - `isOver === true` → applies cyan dashed border (mirrors OutcomeZone affordance)
  - Clicking `⚙` opens `FactorSpecsPopover` anchored at button
  - Mutual exclusion: only one popover open at a time
  - Popover Apply → fires `onControlUpdate(originalFactorName, updatedControl)` (key by factor since no id field exists yet; if uniqueness becomes an issue, future work introduces an id)
- Implement `FactorZone/index.tsx`. Props: `{ controls: ImprovementProjectFactorControl[]; steps: { id; name }[]; onControlAdd: (columnName) => void; onControlUpdate: (factorName, updated) => void }`.
- Commit: `feat(ui): FactorZone container with drop target and popover orchestration`

### Task 6 — `handleFactorDrop` pure helper

- Failing tests at `__tests__/handleFactorDrop.test.ts`:
  - Routes `column:<name>` → `factor-zone:global` to `onFactorControlAdd(columnName, undefined)` (no stepId)
  - Routes `column:<name>` → `factor-zone:step:s-1` to `onFactorControlAdd(columnName, 's-1')`
  - Returns false when overId is not a factor-zone id
  - Returns false when activeId is not a column drag
  - Returns false when overId undefined
- Implement `handleFactorDrop.ts`. Signature: `handleFactorDrop({ activeId, overId, onFactorControlAdd }): boolean` where `onFactorControlAdd: (columnName: string, stepId?: string) => void`.
- Commit: `feat(ui): handleFactorDrop helper for column → factor-zone routing`

### Task 7 — Wire `FactorZone` into `EditModeShell` + new props

- Failing test in `EditModeShell.test.tsx`:
  - With `factorControls={[]}` renders `<FactorZone>` inside outcomes-factors zone (replaces "Factor zone arrives in C2" placeholder)
  - Forwards `onFactorControlUpdate` to popover Apply
- Modify `EditModeShell.tsx`:
  - Add props: `factorControls?: ImprovementProjectFactorControl[]`, `steps?: { id: string; name: string }[]`, `onFactorControlAdd?: (columnName, stepId?) => void`, `onFactorControlUpdate?: (factorName, updated) => void`
  - Replace the "Factor zone arrives in C2" placeholder with `<FactorZone>` consuming the props.
- Commit: `feat(ui): wire FactorZone into EditModeShell`

### Task 8 — Wire `handleOutcomeDrop` + `handleFactorDrop` into `Canvas/index.tsx` (the deferred C1 wiring)

- This is the cross-cutting integration that completes BOTH C1's deferred wiring AND C2's new routing in one atomic change. The existing `Canvas/index.tsx` `handleDragEnd` (via `useChipDragAndDrop`) routes `chip:<id>` only. We extend it with column routing at the top of the chain.
- **Approach:** the simplest pattern — Canvas accepts new optional props `onOutcomeSpecAdd?` and `onFactorControlAdd?` (plus `numericValuesByColumn?` for outcome derivation). Inside Canvas, a small wrapper around `handleDragEnd` from `useChipDragAndDrop` checks `handleOutcomeDrop(...)` then `handleFactorDrop(...)` first; if either consumes, return; otherwise delegate to the chip handler.
- Failing tests in `Canvas.test.tsx` (or a new `__tests__/handleCanvasDragEnd.test.ts` if Canvas's existing tests are too heavy to extend) — verify the chain: column drop on outcome zone fires the outcome callback; column drop on factor zone fires the factor callback; chip drop still goes through.
- Modify `packages/ui/src/components/Canvas/index.tsx`: extend the props, extract a small `handleCanvasDragEnd(event)` helper that composes outcome + factor + chip routers in order. Existing chip behavior unchanged.
- Modify `EditModeShell.tsx` to forward `onOutcomeSpecAdd` and `onFactorControlAdd` through to Canvas if Canvas wraps EditModeShell (verify the prop-flow direction in this codebase — likely Canvas is the OUTER component and EditModeShell is inside it; the consumer of Canvas provides the callbacks directly).
- Final test + build green: `pnpm --filter @variscout/ui test && pnpm --filter @variscout/ui build` — both must pass.
- Push branch + open PR.
- Commit: `feat(ui): wire column → outcome/factor drop helpers into Canvas handleDragEnd`

---

## Verification

After all 8 tasks merge:

1. `pnpm --filter @variscout/ui test` — all FactorZone + Canvas + EditModeShell tests green; no regressions
2. `pnpm --filter @variscout/ui build` — clean
3. `pnpm test` (turbo) — global suites green
4. `bash scripts/pr-ready-check.sh` — full pre-merge gauntlet green
5. **End-to-end manual check:** rendering a Canvas with paste-mode data + dragging a column chip onto OutcomeZone fires the outcome-create callback; dragging a different column chip onto FactorZone fires the factor-create callback. (No persistence yet — visual confirmation only with consumer-side useState.)

## Out of scope (this PR)

Deferred to **C3:**

- `<ProcessStructureZone>` — children slot still hosts existing CanvasWorkspace
- Step-bound drop receivers (`factor-zone:step:<stepId>` consumers — the IDs are encoded by C2's codec but no step boxes consume them yet)
- Emergent step boxes from categorical drops

Deferred to **E1 (Charter modal):**

- Persistence of `factorControls` to the IP blob — C2 state is prop-driven

Deferred to **F1:**

- Ghost-suggested heuristics on column chips for factor vs outcome routing

## Execution model

Per `feedback_subagent_driven_default` + `feedback_one_worktree_per_agent`:

- **Worktree:** `.worktrees/feat/wedge-v1-ccj-c-2-factor-zone/`
- **Per task:** Sonnet implementer + reviewers (each task is well-specified TDD against 1–3 files); Task 8 may benefit from Opus per `feedback_subagent_driven_default` (multi-file integration in Canvas)
- **Final branch review:** Opus on full diff before merge — must STEP 0 `git checkout`
- **Merge:** `gh pr merge --merge --delete-branch`
- **Subagent constraints:** NEVER `--no-verify`; NEVER migration helpers; worktree-only

## Related

- [Phase C master sequencer](./2026-05-27-canvas-connection-journey-c-master-plan.md)
- [PR-CCJ-C1 sub-plan](./2026-05-27-canvas-connection-journey-c-1-outcome-zone.md) (shipped at `b12e5e6e`)
- Memory: `[[canvas-connection-journey]]`, `[[wedge-v1]]`, `[[feedback_subagent_driven_default]]`, `[[feedback_one_worktree_per_agent]]`, `[[feedback_wedge_v1_no_migration_no_backcompat]]`
