---
tier: ephemeral
purpose: build
title: 'PR-CS-15 — Framing-on-load refinement'
status: active
date: 2026-06-08
layer: spec
implements: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-15 — Framing-on-load refinement

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine `CanvasWorkspace` framing-on-load without breaking the six load-bearing seams in connective-surface spec §5, and retire deprecated `ProcessMapBase`.

**Architecture:** Preserve-and-refine. `CanvasWorkspace` remains the b0/b1 router and app-session composition layer; `Canvas` remains the canonical rendered surface; `canvasStore` remains the canonical rich-map authoring authority; `projectStore.outcome/factors` callbacks remain the Explore Y/X authoring channel. `ProcessMapBase` is renamed/promoted to a canonical internal `ProcessMap` component with stable props, DOM, test ids, and behavior.

**Tech stack:** TypeScript monorepo (pnpm/turbo); React; Zustand; `@dnd-kit/core`; Vitest + happy-dom + React Testing Library; `@variscout/{core,hooks,stores,ui}`.

---

## Grounding

- **Spec:** connective-surface §5 defines b0/b1 framing-on-load as surgical and names six seams that must not break.
- **Master row:** `docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md` PR-CS-15 requires `CanvasWorkspace` framing refinement, six seam regression tests, and `ProcessMapBase` retirement.
- **Current code:** `CanvasWorkspace` owns b0/b1 routing (`detectScopeFromMap`), hydration guard, edit-mode column-drop `DndContext`, and `projectStore` setter callbacks; `Canvas` owns chip-to-step `DndContext` and L1/L2/L3 focal routing; `ProcessMapBase` contains the actual process-map UI and is deprecated by name per `packages/ui/CLAUDE.md`.
- **Ruflo:** `pnpm codex:ruflo-check` verified registration, but Ruflo MCP tools were not exposed in this Codex session during planning; proceed with repo docs, `rg`, tests, and normal validation.

## File structure

| File                                                                     | Change                                                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`                  | Minimal framing refinements only if needed by seam tests; preserve all existing callback/store channels.                                    |
| `packages/ui/src/components/Canvas/index.tsx`                            | Import/render promoted `ProcessMap` instead of deprecated `ProcessMapBase`.                                                                 |
| `packages/ui/src/components/Canvas/internal/ProcessMap.tsx`              | New canonical internal process-map component, moved from `ProcessMapBase` with stable behavior.                                             |
| `packages/ui/src/components/Canvas/internal/ProcessMapBase.tsx`          | Delete.                                                                                                                                     |
| `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`   | Add integrated seam regression coverage for b0/b1, persistence/hydration, Y/X, DnD split, chip click-vs-drag, and focal-step read contract. |
| `packages/ui/src/components/Canvas/__tests__/CanvasProcessMap.test.tsx`  | Update imports and component names to `ProcessMap`; keep behavioral coverage.                                                               |
| `packages/stores/src/canvasStore.ts`                                     | Rename comments from deprecated component to canonical process-map UI.                                                                      |
| `packages/ui/src/components/StepDefectIndicator/StepDefectIndicator.tsx` | Rename future-mount comment away from `ProcessMapBase`.                                                                                     |
| `packages/ui/CLAUDE.md`                                                  | Remove `ProcessMapBase` from the deprecated-wrapper list after deletion.                                                                    |

## Six seam contract

1. **b0/b1 gate:** Empty `ProcessMap.nodes` renders `FrameViewB0`; adding/replacing process steps flips to b1/edit shell and removes the b0 picker as the primary surface.
2. **dual-write persist seam + hydration guard:** Rich-map edits update `canvasStore.canonicalMap` and mirror once through `setProcessContext({ processMap })`; rerender with the mirrored map must not clobber the edit or rehydrate in a loop.
3. **`projectStore.outcome/factors` as Explore Y/X:** b0 Y/X interactions must keep calling `setOutcome` / `setFactors`; `See the data` must commit a pending mode-aware default before navigation.
4. **two `DndContext`s:** `column:*` drops route to edit-mode zones; `chip:*` drops route to Canvas chip placement. Neither route may double-fire the other.
5. **chip drag-vs-click coexistence:** The same b1 chips remain draggable to steps and clickable to Explore via `onChipExploreJump`.
6. **ProcessMap focal-step contract:** L3/Wall focal-step reads continue to derive assigned, CTQ, and tributary columns from `ProcessMap` through `getStepColumnAssignments` / `conditionReferencesStep`; focal views do not write the map.

## Tasks

### Task 0: Commit this contract

- [ ] Add this file.
- [ ] Run branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-cs-15-framing-refinement`; branch is `feat/cs-15-framing-refinement`.

- [ ] Commit:

```bash
git add docs/superpowers/plans/2026-06-08-cs-15-framing-refinement.md
git commit -m "docs: add CS-15 framing refinement contract"
```

### Task 1: Lock seam tests

- [ ] Add failing behavior tests in `CanvasWorkspace.test.tsx` for all six seams above. Prefer existing helpers/mocks; use factories for any domain fixtures.
- [ ] Update `CanvasProcessMap.test.tsx` import target in the same task if the test needs the canonical component name for red/green clarity.
- [ ] Verify red before implementation:

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx CanvasProcessMap.test.tsx LocalMechanismView.test.tsx
```

Expected: at least the new tests fail for missing canonical rename or uncovered seam behavior.

- [ ] Commit after green:

```bash
git add packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx packages/ui/src/components/Canvas/__tests__/CanvasProcessMap.test.tsx
git commit -m "test: lock canvas framing seams"
```

### Task 2: Retire `ProcessMapBase`

- [ ] Move `Canvas/internal/ProcessMapBase.tsx` to `Canvas/internal/ProcessMap.tsx`.
- [ ] Rename exported types/symbols to `ProcessMapProps` and `ProcessMap`.
- [ ] Update `Canvas/index.tsx` and tests to import/render `ProcessMap`.
- [ ] Delete every `ProcessMapBase` code/comment reference except historical docs if any are intentionally archived.
- [ ] Verify:

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx CanvasProcessMap.test.tsx LocalMechanismView.test.tsx
pnpm --filter @variscout/stores test -- canvasStore.test.ts
pnpm --filter @variscout/ui build
```

- [ ] Commit:

```bash
git add packages/ui/src/components/Canvas packages/stores/src/canvasStore.ts packages/ui/src/components/StepDefectIndicator/StepDefectIndicator.tsx packages/ui/CLAUDE.md
git commit -m "refactor: retire ProcessMapBase wrapper"
```

### Task 3: Minimal framing refinement

- [ ] Apply only changes required by the seam tests and spec §5: no new product behavior, no store reconciliation, no status-ladder changes.
- [ ] Preserve b0/b1 routing, app callback props, nested DnD split, hydration signature guard, URL/focal-step behavior, and existing test ids.
- [ ] Verify focused tests/build:

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx CanvasProcessMap.test.tsx LocalMechanismView.test.tsx
pnpm --filter @variscout/stores test -- canvasStore.test.ts
pnpm --filter @variscout/ui build
```

- [ ] Commit if code changed:

```bash
git add packages/ui/src/components/Canvas
git commit -m "refactor: preserve canvas framing on load"
```

### Task 4: Final gates and browser smoke

- [ ] Run:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] Browser smoke PWA and Azure: load a sample, confirm b0, create b1 process framing, place/connect a column to a step, click chip-to-Explore, and record screenshot/note evidence in the PR body.
- [ ] Open PR and merge only after checks are green:

```bash
gh pr merge --merge --delete-branch
```

## Non-goals

- Do not reconcile `projectStore` and `canvasStore`.
- Do not alter Analyze status semantics or labels (`Suspected` / `Supported` / `Ruled out`).
- Do not change PWA/Azure app-level Explore routing beyond preserving existing callbacks.
- Do not replace `@dnd-kit/core` or merge the two DnD contexts.
- Do not introduce new product behavior or visual redesign beyond the surgical framing refinement.
