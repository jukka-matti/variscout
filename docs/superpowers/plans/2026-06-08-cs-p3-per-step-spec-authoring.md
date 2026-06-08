---
tier: ephemeral
purpose: build
title: 'PR-CS-P3 — Per-step spec-authoring UI at framing'
status: active
date: 2026-06-08
layer: spec
related:
  - 2026-06-02-connective-surface-model-master-plan
  - 2026-06-02-connective-surface-model-design
  - adr-087-process-step-model-reconciliation
---

# PR-CS-P3 · Per-Step Spec Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax. Run an internal adversarial review before final gates.

**Goal:** Ship the framing "ask the specs" UI so analysts author per-step LSL/USL/target/Cpk target by context on `ProcessMapNode.capabilityScope.specRules`, making CS-P2's per-step capability view non-empty.

**Architecture:** `ProcessMap` is canonical per ADR-087, so per-step specs must write through `canvasStore` and persist via the existing `CanvasWorkspace` `persistCanvasStoreMap()` path. `calculateNodeCapability` already consumes `node.capabilityScope.specRules`; this PR only feeds authored `SpecRule[]` into that engine. The current StepCard specs grid is reused for the default rule, and a compact context-rule editor uses the existing Process-tab `availableContext` / `contextValueOptions`.

**Tech Stack:** React + TypeScript, Zustand/immer, Vitest, `@variscout/{core,stores,ui,hooks}`, Vite.

---

## File Structure

| File                                                                                             | Change                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/stores/src/canvasStore.ts`                                                             | Add `setCapabilityScope` and `editCapabilityScope` actions that mutate only canonical-map nodes and preserve undo/version semantics. |
| `packages/stores/src/__tests__/canvasStore.test.ts`                                              | TDD coverage for replace, add/update/remove context rule, no-op, undo/redo.                                                          |
| `packages/ui/src/components/Canvas/internal/ProcessMap.tsx`                                      | Route per-step specs to `capabilityScope.specRules`; render default-rule grid plus context-rule editor.                              |
| `packages/ui/src/components/Canvas/index.tsx`                                                    | Add controlled callback props and forward context metadata to `ProcessMap`.                                                          |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`                                          | Wire callbacks to canvasStore actions and persist through `setProcessContext`; stop calling `setMeasureSpec` for per-step specs.     |
| `packages/ui/src/components/Canvas/__tests__/CanvasProcessMap.test.tsx`                          | Assert dispatch callback use and context-rule payload shape.                                                                         |
| `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`                           | Assert persistence path and no project-wide spec write.                                                                              |
| `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx` or `ConnectedStepCapability` tests | Acceptance: authored per-step specs make capability Cpk visible.                                                                     |

---

## Task 0: Commit this contract

- [ ] **Step 1: Confirm branch guard**

Run:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: worktree path ends in `.worktrees/feat/cs-p3-per-step-spec-authoring`; branch is `feat/cs-p3-per-step-spec-authoring`.

- [ ] **Step 2: Commit this plan**

```bash
git add docs/superpowers/plans/2026-06-08-cs-p3-per-step-spec-authoring.md
git commit -m "docs(cs-p3): per-step spec authoring implementation plan"
```

---

## Task 1: Add canvasStore capabilityScope actions

**Files:** `packages/stores/src/canvasStore.ts`, `packages/stores/src/__tests__/canvasStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Add tests proving:

- `setCapabilityScope(stepId, rules)` writes `node.capabilityScope.specRules`.
- `setCapabilityScope(stepId, [])` deletes `node.capabilityScope`.
- `editCapabilityScope(stepId, { index, rule })` adds or replaces one rule.
- `editCapabilityScope(stepId, { index, rule: undefined })` removes one rule and deletes the scope if empty.
- missing step and unchanged rules are no-op.
- undo/redo round-trips the authored rules.

Use literal `SpecRule` fixtures, not ad hoc untyped objects.

- [ ] **Step 2: Run red**

Run: `pnpm --filter @variscout/stores test canvasStore`

Expected: FAIL because the actions do not exist.

- [ ] **Step 3: Implement actions**

Add `SpecRule` import from `@variscout/core`, add actions to `CanvasStoreActions`, and implement with `applyUndoable`. Treat rules as changed only when JSON-stable equality differs from the current `specRules`. Keep these method-only, matching `setStepCtq`.

- [ ] **Step 4: Run green**

Run: `pnpm --filter @variscout/stores test canvasStore`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/canvasStore.ts packages/stores/src/__tests__/canvasStore.test.ts
git commit -m "feat(stores): author per-step capabilityScope specRules"
```

---

## Task 2: Route StepCard specs through capabilityScope

**Files:** `packages/ui/src/components/Canvas/internal/ProcessMap.tsx`, `packages/ui/src/components/Canvas/index.tsx`, `packages/ui/src/components/Canvas/__tests__/CanvasProcessMap.test.tsx`

- [ ] **Step 1: Write failing ProcessMap tests**

Add tests that render a step with `ctqColumn` and assert:

- editing `process-map-step-specs-<stepId>-lsl` calls `onCapabilityScopeChange(stepId, [{ specs: { lsl: value, ... } }])` and does not call `onChange`.
- a preexisting default rule renders in `SpecsGrid`.
- adding a context rule using an available context column/value emits `{ when: { product: 'A' }, specs: { ... } }`.
- removing a context rule emits the remaining rule list.

- [ ] **Step 2: Run red**

Run: `pnpm --filter @variscout/ui test CanvasProcessMap`

Expected: FAIL because the new callback/context editor does not exist.

- [ ] **Step 3: Implement ProcessMap UI**

Add props:

```ts
capabilityContext?: {
  availableContext: {
    hubColumns: string[];
    tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  contextValueOptions: Record<string, string[]>;
};
onCapabilityScopeChange?: (stepId: string, specRules: SpecRule[]) => void;
```

For each `StepCard`, derive the default rule from `step.capabilityScope?.specRules.find(rule => !rule.when || Object.keys(rule.when).length === 0)`. Editing the default grid replaces or inserts that rule at the front. Context rules render below it with column/value selectors plus the same `SpecsGrid`; add/remove operations emit the full next list. Keep legacy `onStepSpecsChange` only as fallback when `onCapabilityScopeChange` is absent.

- [ ] **Step 4: Run green**

Run: `pnpm --filter @variscout/ui test CanvasProcessMap`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/ProcessMap.tsx packages/ui/src/components/Canvas/index.tsx packages/ui/src/components/Canvas/__tests__/CanvasProcessMap.test.tsx
git commit -m "feat(ui): route per-step specs to capabilityScope"
```

---

## Task 3: Wire CanvasWorkspace persistence and acceptance

**Files:** `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`, `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`, `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`

- [ ] **Step 1: Write failing workspace tests**

Add a `CanvasWorkspace` harness test proving a per-step LSL edit:

- writes to `processContext.processMap.nodes[0].capabilityScope.specRules[0].specs.lsl`;
- calls `setProcessContext`;
- does not call `setMeasureSpec`;
- survives the canvasStore hydration seam without reverting.

- [ ] **Step 2: Add/extend acceptance test**

Add a focused CS-P2 acceptance test that supplies data, a node mapping, and an authored default spec rule, then asserts the connected per-step capability surface shows numeric Cpk instead of `Cpk unavailable`.

- [ ] **Step 3: Run red**

Run: `pnpm --filter @variscout/ui test CanvasWorkspace Canvas`

Expected: FAIL until workspace wiring exists.

- [ ] **Step 4: Implement workspace wiring**

Read `setCapabilityScope` from `useCanvasStore`, call it from a memoized `handleCapabilityScopeChange(stepId, specRules)`, then call `persistCanvasStoreMap()` exactly like CTQ/tributary/hunch actions. Pass `capabilityContext` from `data.availableContext` / `data.contextValueOptions`. Remove stale comments that say per-step specs are deferred or route to project-wide `measureSpecs`.

- [ ] **Step 5: Run green**

Run: `pnpm --filter @variscout/ui test CanvasWorkspace Canvas ConnectedStepCapability`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx
git commit -m "feat(ui): persist per-step specs into the process map"
```

---

## Task 4: Review, gates, browser verification, PR, merge

- [ ] **Step 1: Internal adversarial review**

Run greps for stale routing and forbidden terms:

```bash
rg -n "onStepSpecsChange|setMeasureSpec|capability-scope authoring is deferred|root cause|moderator|primary" packages/ui/src/components/Canvas packages/stores/src docs/superpowers/plans/2026-06-08-cs-p3-per-step-spec-authoring.md
```

Expected: no stale per-step routing; no forbidden terminology introduced.

- [ ] **Step 2: Run gates**

```bash
pnpm --filter @variscout/stores test canvasStore
pnpm --filter @variscout/ui test CanvasProcessMap CanvasWorkspace ConnectedStepCapability
pnpm --filter @variscout/ui build
bash scripts/pr-ready-check.sh
```

Expected: all pass.

- [ ] **Step 3: Browser verify Azure**

Start `pnpm --filter @variscout/azure-app dev`, open the Azure app, frame a multi-step process, set one step CTQ + per-step specs, and verify the per-step capability strip changes from unavailable/no specs to numeric Cpk. Capture screenshot evidence for the PR body.

- [ ] **Step 4: PR and merge**

Push branch, create PR with screenshot evidence and gate output summary, wait for checks, then merge with:

```bash
gh pr merge --merge --delete-branch
```

Never squash.
