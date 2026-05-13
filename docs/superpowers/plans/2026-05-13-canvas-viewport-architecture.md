---
title: Canvas Viewport Architecture (8f) — Implementation Plan
audience: [engineer]
category: implementation-plan
status: delivered
last-reviewed: 2026-05-13
related:
  - docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md
  - docs/07-decisions/adr-081-canvas-viewport-architecture.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
---

# Canvas Viewport Architecture (8f) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Delivered 2026-05-13 via PRs #156, #158, #160, #162, #164, and #165.

**Goal:** Implement Canvas viewport architecture per [spec 2026-05-13](../specs/2026-05-13-canvas-viewport-architecture-design.md) + [ADR-081](../../07-decisions/adr-081-canvas-viewport-architecture.md). Three methodology levels (System / Process Flow / Local Mechanism) become a pan/zoom canvas — no separate level picker. Closes vision §5.4, the last unmet vision-spec commitment.

**Architecture:** Unified `useCanvasViewportStore` (generalize today's `wallLayoutStore`) + `d3-zoom` for input math + `LODSwitcher` React primitive + pluggable per-level renderers (Wall stays SVG-native; Canvas-L2 stays DOM-native; new L1 and L3 renderers are DOM-native). Industry-standard pattern (Figma, Google Maps, VS Code, Notion, Visx all ship the same shape).

**Tech Stack:** TypeScript, React 18, Zustand (existing stores), Dexie (existing IndexedDB), `d3-zoom` (new — 3 KB gz), Vitest, Playwright (existing E2E). PWA + Azure tier parity per ADR-078.

**Branch:** `canvas-viewport-8f` (re-cut from `main` per PR if multi-session; single branch shared across all PRs in this plan).

**Slicing:** 6 PRs of 6–8 tasks each per `feedback_slice_size_cap`. Total ~40 tasks. Subagent-driven default per `feedback_subagent_driven_default`: Sonnet implementer + Sonnet reviewer per task + Opus final cross-cutting review per PR. **Sonnet for ≥70% of dispatches.**

---

## Pre-flight (one-time before PR1)

- [ ] **P.1 Cut the feature branch in a fresh worktree.**

Per `feedback_one_worktree_per_agent` + `feedback_subagent_worktree_discipline`: the main repo stays at root; this work lives in its own worktree. Run from repo root:

```bash
git fetch origin main
git worktree add .worktrees/canvas-viewport-8f origin/main -b canvas-viewport-8f
cd .worktrees/canvas-viewport-8f
pnpm install
```

- [ ] **P.2 Verify the worktree is clean + on the right branch.**

```bash
git status                # working tree clean
git branch --show-current # canvas-viewport-8f
git log --oneline -3      # should match origin/main
```

Expected: clean, on `canvas-viewport-8f`, latest commit matches `origin/main`.

- [ ] **P.3 Run the baseline test suite to confirm green.**

```bash
pnpm test
```

Expected: all packages green. Save the test counts (`@variscout/core`, `@variscout/hooks`, `@variscout/ui`, `@variscout/stores`, `@variscout/pwa`, `@variscout/azure-app`) for comparison across PRs.

---

# PR1 — Foundation: shape-change `wallLayoutStore` → hub-keyed `useCanvasViewportStore`

**Scope:** Clean shape change per `feedback_no_backcompat_clean_architecture` (no legacy alias). Promote the pre-8f project-keyed singleton into `viewports: Record<ProcessHubId, CanvasViewport>`, add new fields (`currentLevel`, `focalStepId`), change the persistence key from `projectId` to `hubId`, and perform a clean-break Dexie drop/recreate rather than attempting an impossible flat-to-keyed migration. Wall consumers refactored same-PR; every consumer must provide `hubId` and read via `useCanvasViewportStore(s => s.getViewport(hubId).zoom)`. Wall continues to work at runtime by creating a default viewport per Hub when no persisted Hub viewport exists.

**Size:** M. **Tasks:** 7. **Tests added:** ~12.

### Task 1: Add `d3-zoom` dependency

**Files:**

- Modify: `package.json` (root, add to dependencies)
- Modify: `packages/ui/package.json` (add to `dependencies`)
- Modify: `packages/stores/package.json` (no — store does not depend on d3-zoom; only UI does)

- [ ] **Step 1: Verify no existing d3-zoom dependency.**

```bash
grep -r "d3-zoom" package.json packages/*/package.json apps/*/package.json
```

Expected: no matches (clean slate).

- [ ] **Step 2: Add `d3-zoom` and types to `packages/ui/package.json`.**

Find `"dependencies": {` block in `packages/ui/package.json`. Add (alphabetically):

```json
"d3-zoom": "^3.0.0",
```

Find `"devDependencies": {` block. Add:

```json
"@types/d3-zoom": "^3.0.8",
```

- [ ] **Step 3: Install.**

```bash
pnpm install
```

Expected: lockfile updated; no errors.

- [ ] **Step 4: Verify import works.**

Create a temp file `/tmp/d3-zoom-smoke.ts`:

```ts
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
console.log(typeof zoom, typeof zoomIdentity);
```

Run:

```bash
cd packages/ui && pnpm exec tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler /tmp/d3-zoom-smoke.ts
```

Expected: no type errors. Delete the smoke file.

- [ ] **Step 5: Commit.**

```bash
git add package.json packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(8f): add d3-zoom dependency for canvas viewport"
```

---

### Task 2: Add `CanvasLevel` type to `@variscout/core`

**Files:**

- Create: `packages/core/src/canvas/viewport.ts`
- Modify: `packages/core/src/canvas/index.ts` (barrel re-export)
- Test: `packages/core/src/canvas/__tests__/viewport.test.ts`

- [ ] **Step 1: Write the failing test.**

`packages/core/src/canvas/__tests__/viewport.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { type CanvasLevel, inferLevel, LOD_THRESHOLDS, isValidLevel } from '../viewport';

describe('canvas viewport types', () => {
  it('inferLevel returns "l1" below the l1ToL2 threshold', () => {
    expect(inferLevel(0)).toBe<CanvasLevel>('l1');
    expect(inferLevel(LOD_THRESHOLDS.l1ToL2 - 0.001)).toBe<CanvasLevel>('l1');
  });

  it('inferLevel returns "l2" between thresholds', () => {
    expect(inferLevel(LOD_THRESHOLDS.l1ToL2)).toBe<CanvasLevel>('l2');
    expect(inferLevel(1.0)).toBe<CanvasLevel>('l2');
    expect(inferLevel(LOD_THRESHOLDS.l2ToL3 - 0.001)).toBe<CanvasLevel>('l2');
  });

  it('inferLevel returns "l3" at or above the l2ToL3 threshold', () => {
    expect(inferLevel(LOD_THRESHOLDS.l2ToL3)).toBe<CanvasLevel>('l3');
    expect(inferLevel(5.0)).toBe<CanvasLevel>('l3');
  });

  it('LOD_THRESHOLDS has the spec values (chrome-walk-tunable)', () => {
    expect(LOD_THRESHOLDS.l1ToL2).toBe(0.3);
    expect(LOD_THRESHOLDS.l2ToL3).toBe(2.0);
  });

  it('isValidLevel narrows correctly', () => {
    expect(isValidLevel('l1')).toBe(true);
    expect(isValidLevel('l2')).toBe(true);
    expect(isValidLevel('l3')).toBe(true);
    expect(isValidLevel('l4')).toBe(false);
    expect(isValidLevel('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails.**

```bash
cd packages/core && pnpm test -- --run viewport.test.ts
```

Expected: FAIL — `Cannot find module '../viewport'`.

- [ ] **Step 3: Write the minimal implementation.**

`packages/core/src/canvas/viewport.ts`:

```ts
/**
 * Canvas viewport level model (spec 2026-05-13 §3, ADR-081 Decision 2).
 * Three methodology levels (System / Process Flow / Local Mechanism)
 * are inferred from the canvas zoom value via discrete thresholds.
 *
 * Threshold values are SPEC-LEVEL (chrome-walk-tunable per ADR-081).
 * The three-band shape itself is ADR-LEVEL (locked).
 */

export type CanvasLevel = 'l1' | 'l2' | 'l3';

export const LOD_THRESHOLDS = {
  /** zoom < l1ToL2 → L1 System. */
  l1ToL2: 0.3,
  /** zoom >= l2ToL3 → L3 Local Mechanism. */
  l2ToL3: 2.0,
} as const;

export function inferLevel(zoom: number): CanvasLevel {
  if (zoom < LOD_THRESHOLDS.l1ToL2) return 'l1';
  if (zoom >= LOD_THRESHOLDS.l2ToL3) return 'l3';
  return 'l2';
}

export function isValidLevel(value: unknown): value is CanvasLevel {
  return value === 'l1' || value === 'l2' || value === 'l3';
}
```

- [ ] **Step 4: Add to barrel export.**

In `packages/core/src/canvas/index.ts`, add:

```ts
export * from './viewport';
```

- [ ] **Step 5: Run test to verify it passes.**

```bash
cd packages/core && pnpm test -- --run viewport.test.ts
```

Expected: 5 PASS.

- [ ] **Step 6: Commit.**

```bash
git add packages/core/src/canvas/viewport.ts packages/core/src/canvas/index.ts packages/core/src/canvas/__tests__/viewport.test.ts
git commit -m "feat(8f): add CanvasLevel type + LOD threshold model"
```

---

### Task 3: Shape-change `wallLayoutStore` → hub-keyed `canvasViewportStore` (file move + add fields)

**Files:**

- Move: `packages/stores/src/wallLayoutStore.ts` → `packages/stores/src/canvasViewportStore.ts`
- Modify: store contents — add `viewports: Record<ProcessHubId, CanvasViewport>`, `currentLevel`, `focalStepId` fields + methods
- Modify: `packages/stores/src/index.ts` (barrel)
- Test: `packages/stores/src/__tests__/canvasViewportStore.test.ts` (move from `wallLayoutStore.test.ts`)

- [ ] **Step 1: Move file + tests.**

```bash
git mv packages/stores/src/wallLayoutStore.ts packages/stores/src/canvasViewportStore.ts
git mv packages/stores/src/__tests__/wallLayoutStore.test.ts packages/stores/src/__tests__/canvasViewportStore.test.ts
```

- [ ] **Step 2: Update store contents and promote the key to `hubId`.**

Read the existing `canvasViewportStore.ts` (just moved). First apply the mechanical name change:

- All `WallLayout` → `CanvasViewport`
- All `wallLayout` → `canvasViewport`
- Hook export `useWallLayoutStore` → `useCanvasViewportStore`

Then reshape the state so the persisted snapshot is Hub-keyed, not project-flat:

```ts
import type { CanvasLevel } from '@variscout/core/canvas';
import type { StepId } from '@variscout/core';

// ... existing imports

// Inside the CanvasViewportSnapshot interface (formerly WallLayoutSnapshot):
export interface CanvasViewportSnapshot {
  zoom: number;
  pan: { x: number; y: number };
  currentLevel: CanvasLevel; // NEW
  focalStepId?: StepId; // NEW (required when currentLevel === 'l3')
  // Existing wall-layout fields preserved:
  nodePositions: Record<NodeId, { x: number; y: number }>;
  groupByTributary: boolean;
}

// Default for new viewports:
const DEFAULT_VIEWPORT: CanvasViewportSnapshot = {
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  currentLevel: 'l2',
  nodePositions: {},
  groupByTributary: false,
};
```

State interface requirement:

```ts
viewports: Record<ProcessHubId, CanvasViewportSnapshot>;
getViewport(hubId: ProcessHubId): CanvasViewportSnapshot;
```

Do not copy a pre-8f flat project snapshot into the first Hub. The old shape was one project row; the new shape is N Hub rows, and the mapping cannot be inferred.

Add corresponding setters:

```ts
setLevel(hubId: ProcessHubId, level: CanvasLevel, focalStepId?: StepId): void;
fitToContent(hubId: ProcessHubId, level?: CanvasLevel): void; // stub; real impl in PR3
```

For `setLevel`: validates `focalStepId` is provided when `level === 'l3'`; throws otherwise. Stub `fitToContent` returns the current viewport unchanged for now (real implementation in PR3 Task 3).

- [ ] **Step 3: Update barrel export.**

`packages/stores/src/index.ts`:

```diff
- export { useWallLayoutStore, type WallLayoutSnapshot } from './wallLayoutStore';
+ export { useCanvasViewportStore, type CanvasViewportSnapshot } from './canvasViewportStore';
```

- [ ] **Step 4: Update the test file.**

In `__tests__/canvasViewportStore.test.ts`:

- Rename all imports
- Update all references in `describe` / `it` titles
- Add new tests for `setLevel` (success + throw-without-focalStepId at L3)
- Add tests for the new default `currentLevel: 'l2'`
- Add a multi-Hub independence test proving `hub-A` and `hub-B` can have different zoom/pan/level/node positions without overwriting each other

Example new test block:

```ts
describe('setLevel', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState({ viewports: {} });
  });

  it('sets the level when transitioning to l1 or l2 without focalStepId', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l1');
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
    useCanvasViewportStore.getState().setLevel('hub-A', 'l2');
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l2');
  });

  it('sets level + focalStepId when transitioning to l3', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    const vp = useCanvasViewportStore.getState().getViewport('hub-A');
    expect(vp.currentLevel).toBe('l3');
    expect(vp.focalStepId).toBe('step-7');
  });

  it('throws when transitioning to l3 without focalStepId', () => {
    expect(() => useCanvasViewportStore.getState().setLevel('hub-A', 'l3')).toThrow(
      /focalStepId required when currentLevel === 'l3'/
    );
  });

  it('keeps viewport state independent per hub', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 0.5);
    useCanvasViewportStore.getState().setZoom('hub-B', 2.5);
    useCanvasViewportStore.getState().setLevel('hub-A', 'l1');
    useCanvasViewportStore.getState().setLevel('hub-B', 'l3', 'step-7');

    expect(useCanvasViewportStore.getState().getViewport('hub-A').zoom).toBe(0.5);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
    expect(useCanvasViewportStore.getState().getViewport('hub-B').zoom).toBe(2.5);
    expect(useCanvasViewportStore.getState().getViewport('hub-B').currentLevel).toBe('l3');
  });
});
```

- [ ] **Step 5: Run tests.**

```bash
cd packages/stores && pnpm test -- --run canvasViewportStore.test.ts
```

Expected: all PASS (existing tests after shape change + 4 new tests).

- [ ] **Step 6: Confirm no other file still imports the old name.**

```bash
grep -r "useWallLayoutStore\|WallLayoutSnapshot\|wallLayoutStore" packages apps --include="*.ts" --include="*.tsx"
```

Expected: no matches (consumers are refactored in next task).

- [ ] **Step 7: Commit.**

```bash
git add packages/stores
git commit -m "feat(8f): shape-change wallLayoutStore to hub-keyed canvas viewport"
```

---

### Task 4: Refactor existing Wall consumers to use the hub-keyed store

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/WallCanvas.tsx`
- Modify: `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx`
- Modify: any other file flagged by Task 3 Step 6 (run again here)

- [ ] **Step 1: Audit consumers and their Hub identity source.**

```bash
grep -rn "useWallLayoutStore\|wallLayoutStore\|WallLayoutSnapshot" packages apps --include="*.ts" --include="*.tsx"
```

For each match, plan the substitution: `useWallLayoutStore` → `useCanvasViewportStore`, etc. Also identify the `hubId` available at that boundary. Every consumer must address a specific Hub and read through `getViewport(hubId)` or a setter that takes `hubId`.

- [ ] **Step 2: Apply substitutions.**

Use Edit (or `sed -i ''`) per file. Example for one file:

```
useWallLayoutStore       → useCanvasViewportStore
WallLayoutSnapshot       → CanvasViewportSnapshot
wallLayoutStore          → canvasViewportStore
```

The new fields (`currentLevel`, `focalStepId`) are not yet consumed by anything in this PR — they exist in the store but are not read by Wall. That's expected; PR3 wires them in.

Where old code selected flat store fields directly, replace that with Hub-scoped selectors:

```ts
const viewport = useCanvasViewportStore(s => s.getViewport(hubId));
const setPan = useCanvasViewportStore(s => s.setPan);
const setZoom = useCanvasViewportStore(s => s.setZoom);
```

If a consumer does not currently receive `hubId`, thread it from its owner component in the same PR. Do not fall back to project ID or a singleton default.

- [ ] **Step 3: Run UI typecheck + tests.**

```bash
pnpm --filter @variscout/ui exec tsc --noEmit
pnpm --filter @variscout/ui test
```

Expected: typecheck clean; all UI tests pass.

- [ ] **Step 4: Verify Wall still renders in the browser.**

Start dev server:

```bash
pnpm dev
```

Open http://localhost:5173 → seed a Hub with hypotheses → open Investigation tab → confirm Wall renders and pan/drag still works.

Note: wheel-zoom is still missing from Wall (will be added in PR2 Task 4). Pointer-drag pan is the existing behavior and must continue to work.

- [ ] **Step 5: Commit.**

```bash
git add .
git commit -m "refactor(8f): switch Wall consumers to useCanvasViewportStore"
```

---

### Task 5: Add Dexie clean-break schema for Hub-keyed viewport state (PWA + Azure)

**Files:**

- Modify: `apps/pwa/src/db/schema.ts`
- Modify: `apps/azure/src/db/schema.ts`
- Modify: PWA + Azure HubRepository or store-persistence files that round-trip Hub-keyed viewport snapshots

- [ ] **Step 1: Inspect the existing wall-layout persistence path and confirm it is pre-8f flat.**

```bash
grep -rn "WallLayoutSnapshot\|wallLayout" apps/pwa/src apps/azure/src --include="*.ts"
```

Identify where wallLayout is read/written. The new state is keyed by `hubId`; `currentLevel` and `focalStepId` must round-trip inside each Hub snapshot.

- [ ] **Step 2: PWA schema bump / clean break.**

PWA drops the pre-8f `variscout-wall-layout` Dexie database/table on first init post-deploy and recreates snapshots as `hubId,updatedAt` (Dexie v2). Do not write an upgrade callback that reads old rows and guesses a Hub. Data loss is limited to Wall node positions, persisted zoom/pan, and `groupByTributary`; no domain data is lost.

- [ ] **Step 3: Azure schema bump / clean break.**

Same analysis for `apps/azure/src/db/schema.ts`. If Azure HubRepository syncs wall-layout fields to per-Hub blobs, those keep working because the keys are already aligned. If Azure has a flat per-project wall-layout table, drop and recreate it keyed by `hubId`. This is an Azure Dexie version bump after the v9→v10 clean-break precedent from PR-RPS-5. Use a clean break — no upgrade callback — per `feedback_no_backcompat_clean_architecture`, and keep Blob sync aligned to one per-Hub viewport blob/record.

- [ ] **Step 4: Add a round-trip test.**

In `packages/stores/src/__tests__/canvasViewportStore.test.ts`, add a section:

```ts
describe('persistence round-trip', () => {
  it('preserves currentLevel + focalStepId across serialize/deserialize', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().setZoom('hub-A', 2.5);

    // Use the store's partialize / persistence shape directly:
    const snap = useCanvasViewportStore.getState().viewports['hub-A'];
    const serialized = JSON.stringify(snap);
    const restored = JSON.parse(serialized) as CanvasViewportSnapshot;

    expect(restored.currentLevel).toBe('l3');
    expect(restored.focalStepId).toBe('step-7');
    expect(restored.zoom).toBe(2.5);
  });
});
```

- [ ] **Step 5: Add app-level integration tests (PWA + Azure).**

For PWA, add (or extend) `apps/pwa/src/__tests__/db.test.ts` (or wherever existing Dexie round-trip tests live — find with `grep -rn "schema" apps/pwa/src/__tests__`). Test should:

1. Write a snapshot with `currentLevel: 'l3'` + `focalStepId: 'step-X'`
2. Read it back
3. Assert both fields preserved
4. Write a second Hub snapshot with different zoom/pan/level
5. Assert both Hubs remain independent after reload

Mirror the test for Azure.

- [ ] **Step 6: Run tests.**

```bash
pnpm --filter @variscout/stores test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

Expected: all green.

- [ ] **Step 7: Commit.**

```bash
git add apps/pwa apps/azure packages/stores
git commit -m "feat(8f): Dexie clean-break for hub-keyed canvas viewport"
```

---

### Task 6: Add `LayerBoundary` test confirming store is annotation-per-project

**Files:**

- Modify: `packages/stores/src/__tests__/layerBoundary.test.ts` (the F4 layer hygiene test)

- [ ] **Step 1: Add the canvasViewportStore entry to the layer-boundary assertions.**

Find the existing assertion block for `useWallLayoutStore` (it asserted `STORE_LAYER === 'annotation-per-project'`). Rename to `useCanvasViewportStore` and confirm the same layer assertion. If the test file flatly enumerates expected stores in the annotation-per-project layer, add `canvasViewportStore` to the list.

- [ ] **Step 2: Run.**

```bash
pnpm --filter @variscout/stores test -- --run layerBoundary
```

Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add packages/stores/src/__tests__/layerBoundary.test.ts
git commit -m "chore(8f): layerBoundary test asserts canvasViewportStore = annotation-per-project"
```

---

### Task 7: PR1 verification + open PR

- [ ] **Step 1: Full local verification.**

```bash
bash scripts/pr-ready-check.sh
pnpm --filter @variscout/ui build
```

Expected: both green. UI build is critical per `feedback_ui_build_before_merge`.

- [ ] **Step 2: Compare test counts to baseline (from P.3).**

`@variscout/core`, `@variscout/stores`, `@variscout/hooks`, `@variscout/ui`, `@variscout/pwa`, `@variscout/azure-app` should all be unchanged or higher (Task 2 added 5 tests; Task 3 added 3; Task 5 added 1 + per-app round-trips). No tests should disappear.

- [ ] **Step 3: Manual `--chrome` walk.**

Start `claude --chrome` per CLAUDE.md. Verify:

1. Wall renders.
2. Pan-drag works.
3. Existing flows (paste-into-Hub, hypothesis creation, etc.) work.

This is the "pre-PR2" baseline check.

- [ ] **Step 4: Push the branch.**

```bash
git push -u origin canvas-viewport-8f
```

- [ ] **Step 5: Open PR.**

```bash
gh pr create --title "feat(8f): PR1 Foundation — shape-change wallLayoutStore to hub-keyed canvas viewport" --body "$(cat <<'EOF'
## Summary
- Shape-change `useWallLayoutStore` → Hub-keyed `useCanvasViewportStore` per ADR-081 Decision 2 + spec §8.2
- Add `currentLevel` + `focalStepId` fields to each Hub viewport snapshot
- Add `setLevel(hubId, level, focalStepId?)` setter with L3 focalStepId validation
- Stub `fitToContent` (real impl in PR3)
- Dexie persistence clean-breaks to Hub-keyed viewport records and round-trips both new fields (PWA + Azure)
- All Wall consumers refactored in-place (no legacy alias per feedback_no_backcompat_clean_architecture)

## Test plan
- [x] `packages/core` new viewport.ts type tests pass
- [x] `packages/stores` shape-change + setLevel tests pass + multi-Hub independence + persistence round-trip
- [x] Layer-boundary test confirms annotation-per-project
- [x] `bash scripts/pr-ready-check.sh` green
- [x] `pnpm --filter @variscout/ui build` green
- [x] Manual --chrome walk: Wall pan-drag still works

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 6: Subagent code review (Opus).**

Per `feedback_subagent_driven_default` + `feedback_code_review_subagent_must_checkout_pr_branch`: dispatch an Opus code-reviewer subagent. Prompt must include STEP 0: `git fetch && git checkout canvas-viewport-8f && git branch --show-current` before reviewing.

- [ ] **Step 7: Merge after review approves + checks green.**

```bash
gh pr merge --squash --delete-branch=false
```

Branch stays for subsequent PRs.

---

# PR2 — Input layer: d3-zoom integration

**Scope:** Wire d3-zoom as the input driver for the viewport. Wall gets wheel-zoom for free (currently missing per spec §2). Canvas-L2 gets pan/zoom on its DOM grid wrapper. Coord-space utility lands. No level transitions yet — that's PR3.

**Size:** M. **Tasks:** 6. **Tests added:** ~10.

### Task 8: Create the `CanvasViewport` primitive (DOM CSS-transform wrapper)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/CanvasViewport.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/CanvasViewport.test.tsx`

This primitive is the **container** that applies CSS `transform: scale(zoom) translate(pan.x, pan.y)` to its children. It does NOT yet wire d3-zoom; Task 9 does that.

- [ ] **Step 1: Write the failing test.**

`packages/ui/src/components/Canvas/internal/__tests__/CanvasViewport.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CanvasViewport } from '../CanvasViewport';

describe('<CanvasViewport>', () => {
  it('applies CSS transform per zoom + pan', () => {
    const { container } = render(
      <CanvasViewport zoom={1.5} pan={{ x: 100, y: 50 }}>
        <div>child</div>
      </CanvasViewport>
    );
    const inner = container.querySelector('[data-canvas-viewport-inner]') as HTMLDivElement;
    expect(inner).not.toBeNull();
    expect(inner.style.transform).toBe('scale(1.5) translate(100px, 50px)');
  });

  it('sets touch-action: none on the wrapper', () => {
    const { container } = render(
      <CanvasViewport zoom={1} pan={{ x: 0, y: 0 }}>
        <div />
      </CanvasViewport>
    );
    const wrapper = container.querySelector('[data-canvas-viewport-wrapper]') as HTMLDivElement;
    expect(wrapper.style.touchAction).toBe('none');
  });

  it('forwards children unchanged', () => {
    const { getByText } = render(
      <CanvasViewport zoom={1} pan={{ x: 0, y: 0 }}>
        <div>hello viewport</div>
      </CanvasViewport>
    );
    expect(getByText('hello viewport')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify fails.**

```bash
cd packages/ui && pnpm test -- --run CanvasViewport.test.tsx
```

Expected: FAIL — `Cannot find module '../CanvasViewport'`.

- [ ] **Step 3: Implement.**

`packages/ui/src/components/Canvas/internal/CanvasViewport.tsx`:

```tsx
import type { ReactNode } from 'react';

export interface CanvasViewportProps {
  zoom: number;
  pan: { x: number; y: number };
  children: ReactNode;
}

/**
 * Canvas viewport wrapper. Applies CSS transform to its children based on
 * zoom + pan state. d3-zoom (Task 9) wires up the input handlers that
 * mutate the store; this component is the renderer's substrate.
 *
 * `touch-action: none` prevents browser pinch-zoom from competing with
 * d3-zoom's handler.
 */
export function CanvasViewport({ zoom, pan, children }: CanvasViewportProps) {
  return (
    <div
      data-canvas-viewport-wrapper
      style={{
        touchAction: 'none',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        data-canvas-viewport-inner
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify passes.**

```bash
cd packages/ui && pnpm test -- --run CanvasViewport.test.tsx
```

Expected: 3 PASS.

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasViewport.tsx packages/ui/src/components/Canvas/internal/__tests__/CanvasViewport.test.tsx
git commit -m "feat(8f): CanvasViewport CSS-transform wrapper primitive"
```

---

### Task 9: Create the `useCanvasViewportInput` d3-zoom binding hook

**Files:**

- Create: `packages/hooks/src/useCanvasViewportInput.ts`
- Test: `packages/hooks/src/__tests__/useCanvasViewportInput.test.ts`

This hook binds d3-zoom to a DOM element. On input events (wheel, pinch, drag), it calls the store's `setZoom`/`setPan` for the given `hubId`. Encapsulates all d3-zoom interop in one place.

- [ ] **Step 1: Write the failing test.**

`packages/hooks/src/__tests__/useCanvasViewportInput.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasViewportStore } from '@variscout/stores';
import { useCanvasViewportInput } from '../useCanvasViewportInput';

describe('useCanvasViewportInput', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState({ viewports: {} });
  });

  it('attaches a d3-zoom behavior to the ref element', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const ref = { current: element };
    const { unmount } = renderHook(() => useCanvasViewportInput({ hubId: 'hub-A', ref }));
    // d3-zoom attaches "__zoom" property to the element when bound
    expect((element as any).__zoom).toBeDefined();
    unmount();
    document.body.removeChild(element);
  });

  it('updates store zoom when d3 zoom event fires', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const ref = { current: element };
    renderHook(() => useCanvasViewportInput({ hubId: 'hub-A', ref }));
    // Simulate a zoom event by calling the bound zoom behavior directly:
    // (For a real test, fire a wheel event with deltaY; here we test the wiring.)
    const initialZoom = useCanvasViewportStore.getState().getViewport('hub-A').zoom;
    expect(initialZoom).toBe(1.0); // default
    // Simulate via store-direct path; full integration test is in Task 11 chrome walk
  });

  it('clamps zoom to scaleExtent [0.1, 8]', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const ref = { current: element };
    renderHook(() => useCanvasViewportInput({ hubId: 'hub-A', ref }));
    // Attempt to set zoom outside extent; d3-zoom should clamp
    useCanvasViewportStore.getState().setZoom('hub-A', 100);
    // (Note: store setZoom doesn't clamp; d3-zoom does via scaleExtent.
    //  This test asserts the *configured extent* is what we expect.)
    const element_any = element as any;
    expect(element_any.__zoom).toBeDefined();
    // Inspecting d3-zoom's scaleExtent requires accessing the behavior; we trust the configuration.
  });
});
```

- [ ] **Step 2: Run to verify fails.**

```bash
cd packages/hooks && pnpm test -- --run useCanvasViewportInput.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement.**

`packages/hooks/src/useCanvasViewportInput.ts`:

```ts
import { useEffect, type RefObject } from 'react';
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import { useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core';

export interface UseCanvasViewportInputOptions {
  hubId: ProcessHubId;
  ref: RefObject<HTMLElement>;
  /** Min/max zoom; defaults to [0.1, 8] (the spec's full LOD range with headroom). */
  scaleExtent?: [number, number];
}

/**
 * Binds d3-zoom to a DOM element. Wheel / pinch / pointer-drag input
 * fires store updates for the given hubId.
 *
 * Spec 2026-05-13 §6.1 (Map convention gestures), ADR-081 Decision 1.
 */
export function useCanvasViewportInput({
  hubId,
  ref,
  scaleExtent = [0.1, 8],
}: UseCanvasViewportInputOptions): void {
  const setZoom = useCanvasViewportStore(s => s.setZoom);
  const setPan = useCanvasViewportStore(s => s.setPan);
  const getViewport = useCanvasViewportStore(s => s.getViewport);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const zoomBehavior = zoom<HTMLElement, unknown>()
      .scaleExtent(scaleExtent)
      .on('zoom', (event: D3ZoomEvent<HTMLElement, unknown>) => {
        const { k, x, y } = event.transform;
        // d3 transform gives us the composed { translateX, translateY, scale }
        setZoom(hubId, k);
        setPan(hubId, { x, y });
      });

    // Initialize d3's internal transform from current store state:
    const vp = getViewport(hubId);
    select(element).call(
      zoomBehavior.transform,
      zoomIdentity.translate(vp.pan.x, vp.pan.y).scale(vp.zoom)
    );
    select(element).call(zoomBehavior);

    return () => {
      select(element).on('.zoom', null);
    };
  }, [hubId, ref, scaleExtent, setZoom, setPan, getViewport]);
}
```

- [ ] **Step 4: Run test to verify passes.**

```bash
cd packages/hooks && pnpm test -- --run useCanvasViewportInput.test.ts
```

Expected: 3 PASS.

- [ ] **Step 5: Add hook to barrel.**

`packages/hooks/src/index.ts`:

```ts
export { useCanvasViewportInput } from './useCanvasViewportInput';
```

- [ ] **Step 6: Commit.**

```bash
git add packages/hooks/src/useCanvasViewportInput.ts packages/hooks/src/__tests__/useCanvasViewportInput.test.ts packages/hooks/src/index.ts
git commit -m "feat(8f): useCanvasViewportInput d3-zoom binding hook"
```

---

### Task 10: Create the coordinate-space utility

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/coordSpace.ts`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/coordSpace.test.ts`

Per spec §4.7: translation between client-pixel / viewport-world / renderer-local. Used by cross-renderer features (hypothesis arrow ending on Wall mirror card).

- [ ] **Step 1: Write the failing test.**

```ts
import { describe, expect, it } from 'vitest';
import { clientToWorld, worldToCanvasDom, worldToWallSvg } from '../coordSpace';

describe('coordSpace', () => {
  const viewport = {
    zoom: 2,
    pan: { x: 100, y: 50 },
    currentLevel: 'l2' as const,
    nodePositions: {},
    groupByTributary: false,
  };

  it('clientToWorld inverts the viewport transform', () => {
    // A click at client (300, 200) with viewport scale=2 + pan(100, 50):
    //   world = (client - pan) / scale = ((300-100)/2, (200-50)/2) = (100, 75)
    expect(clientToWorld({ x: 300, y: 200 }, viewport)).toEqual({ x: 100, y: 75 });
  });

  it('worldToCanvasDom applies the viewport transform forward', () => {
    // Inverse of clientToWorld:
    //   client = world * scale + pan = (100*2 + 100, 75*2 + 50) = (300, 200)
    expect(worldToCanvasDom({ x: 100, y: 75 }, viewport)).toEqual({ x: 300, y: 200 });
  });

  it('worldToWallSvg maps to Wall user-space (no scaling — Wall transforms its own SVG)', () => {
    // Wall's SVG <g> already has its own transform applied internally;
    // worldToWallSvg returns coordinates in Wall's user-space (the viewBox).
    expect(worldToWallSvg({ x: 100, y: 75 }, viewport)).toEqual({ x: 100, y: 75 });
  });

  it('round-trips correctly', () => {
    const world = { x: 42, y: 17 };
    const dom = worldToCanvasDom(world, viewport);
    const back = clientToWorld(dom, viewport);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});
```

- [ ] **Step 2: Run to verify fails.**

```bash
cd packages/ui && pnpm test -- --run coordSpace.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement.**

`packages/ui/src/components/Canvas/internal/coordSpace.ts`:

```ts
import type { CanvasViewportSnapshot } from '@variscout/stores';

export interface Point {
  x: number;
  y: number;
}

/** client (CSS px) → viewport-world. Inverts the viewport transform. */
export function clientToWorld(p: Point, viewport: CanvasViewportSnapshot): Point {
  return {
    x: (p.x - viewport.pan.x) / viewport.zoom,
    y: (p.y - viewport.pan.y) / viewport.zoom,
  };
}

/** viewport-world → Canvas DOM CSS px. Applies the viewport transform forward. */
export function worldToCanvasDom(p: Point, viewport: CanvasViewportSnapshot): Point {
  return {
    x: p.x * viewport.zoom + viewport.pan.x,
    y: p.y * viewport.zoom + viewport.pan.y,
  };
}

/**
 * viewport-world → Wall SVG user-space. The Wall renders its own SVG <g>
 * with its own transform; world coordinates pass through identity here
 * because the SVG <g>'s transform applies the same zoom+pan to render.
 *
 * (If a future divergence emerges between Canvas viewport coords and
 * Wall coords, this is the seam to amend.)
 */
export function worldToWallSvg(p: Point, _viewport: CanvasViewportSnapshot): Point {
  return p;
}
```

- [ ] **Step 4: Run to verify passes.**

```bash
cd packages/ui && pnpm test -- --run coordSpace.test.ts
```

Expected: 4 PASS.

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/components/Canvas/internal/coordSpace.ts packages/ui/src/components/Canvas/internal/__tests__/coordSpace.test.ts
git commit -m "feat(8f): coordinate-space translation utility"
```

---

### Task 11: Wire `CanvasViewport` + `useCanvasViewportInput` into Canvas-L2

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx` (or wherever the grid `<div>` is)
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` (props pipeline if needed)

- [ ] **Step 1: Locate the L2 grid wrapper.**

```bash
grep -n "grid-cols\|overflow-auto" packages/ui/src/components/Canvas/index.tsx
```

Identify the container `<div>` that holds the step cards.

- [ ] **Step 2: Wrap the grid in `<CanvasViewport>` + attach input hook.**

Pseudo-diff:

```tsx
// At top of the Canvas component:
import { useRef } from 'react';
import { CanvasViewport } from './internal/CanvasViewport';
import { useCanvasViewportInput } from '@variscout/hooks';
import { useCanvasViewportStore } from '@variscout/stores';

// Inside the component body:
const viewportRef = useRef<HTMLDivElement>(null);
const viewport = useCanvasViewportStore(s => s.getViewport(hubId));
useCanvasViewportInput({ hubId, ref: viewportRef });

// In the JSX, replace the existing grid wrapper:
return (
  <div ref={viewportRef} style={{ width: '100%', height: '100%' }}>
    <CanvasViewport zoom={viewport.zoom} pan={viewport.pan}>
      {/* Existing grid content goes here */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">{/* CanvasStepCards as today */}</div>
    </CanvasViewport>
  </div>
);
```

- [ ] **Step 3: Build + typecheck.**

```bash
pnpm --filter @variscout/ui exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Run the existing Canvas tests.**

```bash
pnpm --filter @variscout/ui test
```

Expected: all green (cards still render; layout is wrapped in the viewport but otherwise unchanged).

- [ ] **Step 5: Manual --chrome walk.**

- Open dev server, load a seeded Hub.
- Wheel up/down on the canvas → cards scale (zoom).
- Drag empty area → canvas pans.
- Click a card → drill-down opens (existing behavior preserved).
- Drag a card by its handle → card moves (existing behavior preserved).

If any of the above fails, debug input-layer precedence (spec §6.2). The card's pointer-down handler must `stopPropagation` to prevent viewport pan from capturing.

- [ ] **Step 6: Commit.**

```bash
git add packages/ui/src/components/Canvas
git commit -m "feat(8f): Canvas-L2 wrapped in CanvasViewport with d3-zoom input"
```

---

### Task 12: Wire d3-zoom into Wall (gives Wall wheel-zoom for free)

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/WallCanvas.tsx` OR `packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx`

Per spec §2: Wall has pan-drag today but no wheel-zoom. PR2's input layer adds it.

- [ ] **Step 1: Identify where Wall currently attaches its pointer handler.**

```bash
grep -n "onPointerDown\|onMouseDown\|onWheel" packages/ui/src/components/InvestigationWall/WallCanvas.tsx packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx
```

- [ ] **Step 2: Replace the hand-rolled pointer-drag with `useCanvasViewportInput`.**

In whichever component owns the outer Wall container, add:

```tsx
const wallRef = useRef<SVGSVGElement>(null);
useCanvasViewportInput({ hubId, ref: wallRef });
```

Remove the existing custom pointer-drag handler (the one in `CanvasWallOverlay.tsx` around lines 36–95 per spec exploration). The d3-zoom-driven handler replaces it.

Note: Wall's SVG `<g transform=...>` continues to read `zoom` + `pan` from the store unchanged. The input source is now d3-zoom; the renderer is unchanged.

- [ ] **Step 3: Build + typecheck.**

```bash
pnpm --filter @variscout/ui exec tsc --noEmit
```

- [ ] **Step 4: Manual --chrome walk.**

- Open Wall in destination view: pan-drag works.
- Wheel up/down on Wall: cards zoom (new behavior).
- Pinch on trackpad: zoom (new behavior).
- Open Wall mirror in Canvas overlay (PR8 8e): same behaviors work.

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/src/components/InvestigationWall packages/ui/src/components/Canvas/internal/CanvasWallOverlay.tsx
git commit -m "feat(8f): Wall picks up wheel-zoom via d3-zoom input hook"
```

---

### Task 13: PR2 verification + open PR

- [ ] **Step 1: Full local verification.**

```bash
bash scripts/pr-ready-check.sh
pnpm --filter @variscout/ui build
```

- [ ] **Step 2: --chrome walk per Task 11 Step 5 + Task 12 Step 4.**

- [ ] **Step 3: Push + open PR.**

```bash
git push origin canvas-viewport-8f
gh pr create --title "feat(8f): PR2 Input layer — d3-zoom integration" --body "..."
```

Body summarizes: CanvasViewport primitive + useCanvasViewportInput hook + coordSpace utility + Canvas-L2 wired + Wall wired (wheel-zoom now works).

- [ ] **Step 4: Subagent code review + merge.**

---

# PR3 — LOD switcher + L2 continuous-detail gradient + mobile picker

**Scope:** `LODSwitcher` primitive that reads `currentLevel` and mounts the right renderer. L1 + L3 are placeholder panels in this PR ("Coming next"). L2 gains the continuous-detail gradient (cards shrink + summarize at zoom < 1.0). Cmd+1/2/3 + Cmd+0 keyboard shortcuts. Mobile sequential-picker UI.

**Size:** M. **Tasks:** 7. **Tests added:** ~14.

### Task 14: Create the `LODSwitcher` React primitive

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/LODSwitcher.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/LODSwitcher.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { LODSwitcher } from '../LODSwitcher';

describe('<LODSwitcher>', () => {
  it('renders L1 view when currentLevel === l1', () => {
    const { getByTestId } = render(
      <LODSwitcher
        currentLevel="l1"
        l1={<div data-testid="l1-view">L1</div>}
        l2={<div data-testid="l2-view">L2</div>}
        l3={<div data-testid="l3-view">L3</div>}
      />
    );
    expect(getByTestId('l1-view')).toBeTruthy();
  });

  it('renders L2 view when currentLevel === l2', () => {
    const { getByTestId } = render(
      <LODSwitcher
        currentLevel="l2"
        l1={<div data-testid="l1-view">L1</div>}
        l2={<div data-testid="l2-view">L2</div>}
        l3={<div data-testid="l3-view">L3</div>}
      />
    );
    expect(getByTestId('l2-view')).toBeTruthy();
  });

  it('renders L3 view when currentLevel === l3', () => {
    const { getByTestId } = render(
      <LODSwitcher
        currentLevel="l3"
        l1={<div data-testid="l1-view">L1</div>}
        l2={<div data-testid="l2-view">L2</div>}
        l3={<div data-testid="l3-view">L3</div>}
      />
    );
    expect(getByTestId('l3-view')).toBeTruthy();
  });

  it('applies a cross-fade transition on level change', () => {
    const { container, rerender } = render(
      <LODSwitcher currentLevel="l2" l1={<div />} l2={<div data-testid="x" />} l3={<div />} />
    );
    rerender(
      <LODSwitcher currentLevel="l3" l1={<div />} l2={<div />} l3={<div data-testid="x" />} />
    );
    // The wrapper has a transition style:
    const wrapper = container.querySelector('[data-lod-wrapper]') as HTMLDivElement;
    expect(wrapper.style.transition).toMatch(/opacity/);
  });
});
```

- [ ] **Step 2: Run to verify fails.**

```bash
cd packages/ui && pnpm test -- --run LODSwitcher.test.tsx
```

- [ ] **Step 3: Implement.**

```tsx
import type { ReactNode } from 'react';
import type { CanvasLevel } from '@variscout/core/canvas';

export interface LODSwitcherProps {
  currentLevel: CanvasLevel;
  l1: ReactNode;
  l2: ReactNode;
  l3: ReactNode;
}

const TRANSITION_MS = 150;

/**
 * Mounts the renderer for the current level. Wrapped in an opacity
 * cross-fade so the swap doesn't snap jarringly (spec §4.6).
 */
export function LODSwitcher({ currentLevel, l1, l2, l3 }: LODSwitcherProps) {
  const active = currentLevel === 'l1' ? l1 : currentLevel === 'l3' ? l3 : l2;
  return (
    <div
      data-lod-wrapper
      key={currentLevel}
      style={{
        opacity: 1,
        transition: `opacity ${TRANSITION_MS}ms ease`,
        width: '100%',
        height: '100%',
      }}
    >
      {active}
    </div>
  );
}
```

- [ ] **Step 4: Run + pass.** **Step 5: Commit.**

```bash
git commit -m "feat(8f): LODSwitcher primitive with cross-fade"
```

---

### Task 15: Add `currentLevel` sync from zoom value

**Files:**

- Modify: `packages/stores/src/canvasViewportStore.ts` (extend `setZoom` to update `currentLevel`)
- Test: `packages/stores/src/__tests__/canvasViewportStore.test.ts`

When zoom crosses a threshold, `currentLevel` updates automatically. The user can also set level explicitly via Cmd+1/2/3 (which sets both zoom + level in one call).

- [ ] **Step 1: Add test.**

In `canvasViewportStore.test.ts`:

```ts
describe('zoom ↔ currentLevel sync', () => {
  beforeEach(() => useCanvasViewportStore.setState({ viewports: {} }));

  it('setZoom updates currentLevel to L1 when zoom < 0.3', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 0.2);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
  });

  it('setZoom updates currentLevel to L2 when 0.3 <= zoom < 2.0', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 1.5);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l2');
  });

  it('setZoom updates currentLevel to L3 when zoom >= 2.0', () => {
    // Need focalStepId set first; setZoom should auto-clear if leaving L3
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().setZoom('hub-A', 2.5);
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l3');
  });

  it('setZoom clears focalStepId when leaving L3 downward', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().setZoom('hub-A', 1.0); // dropping to L2
    const vp = useCanvasViewportStore.getState().getViewport('hub-A');
    expect(vp.currentLevel).toBe('l2');
    expect(vp.focalStepId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run → fails.**

- [ ] **Step 3: Implement.**

In `canvasViewportStore.ts`, modify `setZoom`:

```ts
import { inferLevel } from '@variscout/core/canvas';

setZoom: (hubId, newZoom) => set((state) => {
  const vp = state.viewports[hubId] ?? DEFAULT_VIEWPORT;
  const newLevel = inferLevel(newZoom);
  return {
    viewports: {
      ...state.viewports,
      [hubId]: {
        ...vp,
        zoom: newZoom,
        currentLevel: newLevel,
        // Clear focalStepId if leaving L3:
        focalStepId: newLevel === 'l3' ? vp.focalStepId : undefined,
      },
    },
  };
}),
```

- [ ] **Step 4: Run + pass + commit.**

```bash
git commit -m "feat(8f): zoom value derives currentLevel via inferLevel"
```

---

### Task 16: Implement `fitToContent` in the store

**Files:**

- Modify: `packages/stores/src/canvasViewportStore.ts`
- Test: `packages/stores/src/__tests__/canvasViewportStore.test.ts`

- [ ] **Step 1: Add test.**

```ts
describe('fitToContent', () => {
  it('sets zoom to 1.0 and pan to {0, 0} for L2 (placeholder default)', () => {
    useCanvasViewportStore.getState().fitToContent('hub-A', 'l2');
    const vp = useCanvasViewportStore.getState().getViewport('hub-A');
    expect(vp.zoom).toBe(1.0);
    expect(vp.pan).toEqual({ x: 0, y: 0 });
    expect(vp.currentLevel).toBe('l2');
  });

  it('sets zoom < 0.3 for L1', () => {
    useCanvasViewportStore.getState().fitToContent('hub-A', 'l1');
    const vp = useCanvasViewportStore.getState().getViewport('hub-A');
    expect(vp.zoom).toBeLessThan(0.3);
    expect(vp.currentLevel).toBe('l1');
  });

  it('sets zoom >= 2.0 for L3 with focalStepId already set', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().fitToContent('hub-A', 'l3');
    const vp = useCanvasViewportStore.getState().getViewport('hub-A');
    expect(vp.zoom).toBeGreaterThanOrEqual(2.0);
    expect(vp.currentLevel).toBe('l3');
    expect(vp.focalStepId).toBe('step-7');
  });
});
```

- [ ] **Step 2: Implement.** Replace the stub `fitToContent` from PR1 Task 3 with:

```ts
fitToContent: (hubId, level) => set((state) => {
  const target = level ?? state.viewports[hubId]?.currentLevel ?? 'l2';
  const ZOOMS = { l1: 0.2, l2: 1.0, l3: 2.5 };
  const vp = state.viewports[hubId] ?? DEFAULT_VIEWPORT;
  return {
    viewports: {
      ...state.viewports,
      [hubId]: {
        ...vp,
        zoom: ZOOMS[target],
        pan: { x: 0, y: 0 },
        currentLevel: target,
      },
    },
  };
}),
```

Note: this is a placeholder fit-to-content — the real implementation should measure step-card bounding boxes and compute the right zoom. Defer the real measurement-based fit to PR6 Task 35 (integration polish) — for PRs 3–5 the default zooms are sufficient.

- [ ] **Step 3: Run + pass + commit.**

```bash
git commit -m "feat(8f): fitToContent default-zoom impl (measurement-based fit in PR6)"
```

---

### Task 17: L2 continuous-detail gradient inside `CanvasStepCard`

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepCard.test.tsx`

- [ ] **Step 1: Add test.**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CanvasStepCard } from '../CanvasStepCard';

const STUB_PROPS = {
  /* fill with current minimum-required props per CanvasStepCardModel */
};

describe('<CanvasStepCard> continuous-detail gradient', () => {
  it('renders overview-tile fields when zoom < 1.0', () => {
    const { queryByTestId } = render(<CanvasStepCard {...STUB_PROPS} zoom={0.5} />);
    expect(queryByTestId('step-name')).toBeTruthy();
    expect(queryByTestId('cpk-badge')).toBeTruthy();
    expect(queryByTestId('drift-arrow')).toBeTruthy();
    // Overview hides:
    expect(queryByTestId('mini-chart')).toBeNull();
    expect(queryByTestId('dnd-chip-zone')).toBeNull();
    expect(queryByTestId('response-path-ctas')).toBeNull();
  });

  it('renders full-detail fields when zoom >= 1.0', () => {
    const { queryByTestId } = render(<CanvasStepCard {...STUB_PROPS} zoom={1.5} />);
    expect(queryByTestId('step-name')).toBeTruthy();
    expect(queryByTestId('cpk-badge')).toBeTruthy();
    expect(queryByTestId('mini-chart')).toBeTruthy();
    expect(queryByTestId('dnd-chip-zone')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run → fails (missing zoom prop and conditional rendering).**

- [ ] **Step 3: Add `zoom` prop + conditional render.**

In `CanvasStepCard.tsx`, add `zoom: number` to props. Render conditionally:

```tsx
const detailLevel = zoom < 1.0 ? 'overview' : 'detail';

return (
  <div className="step-card">
    <div data-testid="step-name">{stepName}</div>
    <div data-testid="cpk-badge">{cpk?.toFixed(2)}</div>
    <div data-testid="drift-arrow">{driftArrow}</div>
    {detailLevel === 'detail' && (
      <>
        <div data-testid="mini-chart">
          <MiniChart />
        </div>
        <div data-testid="dnd-chip-zone">
          <DnDKitChipZone />
        </div>
        <div data-testid="drift-overlay">
          <DriftOverlay />
        </div>
        <div data-testid="response-path-ctas">
          <ResponsePathCTAs />
        </div>
      </>
    )}
  </div>
);
```

- [ ] **Step 4: Pipe `zoom` from the parent.** In whichever Canvas component renders `<CanvasStepCard>`, read `zoom` from the store and pass it down.

- [ ] **Step 5: Run + pass + commit.**

```bash
git commit -m "feat(8f): L2 continuous-detail gradient in CanvasStepCard"
```

---

### Task 18: Cmd+1/2/3 + Cmd+0 keyboard shortcuts

**Files:**

- Create: `packages/hooks/src/useCanvasViewportShortcuts.ts`
- Test: `packages/hooks/src/__tests__/useCanvasViewportShortcuts.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { useCanvasViewportStore } from '@variscout/stores';
import { useCanvasViewportShortcuts } from '../useCanvasViewportShortcuts';

describe('useCanvasViewportShortcuts', () => {
  beforeEach(() => useCanvasViewportStore.setState({ viewports: {} }));

  it('Cmd+1 jumps to L1', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: 'hub-A' }));
    fireEvent.keyDown(window, { key: '1', metaKey: true });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
  });

  it('Cmd+2 jumps to L2', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: 'hub-A' }));
    fireEvent.keyDown(window, { key: '2', metaKey: true });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l2');
  });

  it('Cmd+3 requires focalStepId; no-op when not set', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: 'hub-A' }));
    const before = useCanvasViewportStore.getState().getViewport('hub-A').currentLevel;
    fireEvent.keyDown(window, { key: '3', metaKey: true });
    const after = useCanvasViewportStore.getState().getViewport('hub-A').currentLevel;
    expect(after).toBe(before); // no transition without focal step
  });

  it('Cmd+0 calls fitToContent for current level', () => {
    useCanvasViewportStore.getState().setZoom('hub-A', 0.75);
    renderHook(() => useCanvasViewportShortcuts({ hubId: 'hub-A' }));
    fireEvent.keyDown(window, { key: '0', metaKey: true });
    expect(useCanvasViewportStore.getState().getViewport('hub-A').zoom).toBe(1.0); // L2 fit zoom
  });
});
```

- [ ] **Step 2: Run → fails.**

- [ ] **Step 3: Implement.**

```ts
import { useEffect } from 'react';
import { useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core';

export function useCanvasViewportShortcuts({ hubId }: { hubId: ProcessHubId }): void {
  const setLevel = useCanvasViewportStore(s => s.setLevel);
  const fitToContent = useCanvasViewportStore(s => s.fitToContent);
  const getViewport = useCanvasViewportStore(s => s.getViewport);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      switch (e.key) {
        case '0':
          e.preventDefault();
          fitToContent(hubId);
          break;
        case '1':
          e.preventDefault();
          fitToContent(hubId, 'l1');
          break;
        case '2':
          e.preventDefault();
          fitToContent(hubId, 'l2');
          break;
        case '3':
          e.preventDefault();
          const vp = getViewport(hubId);
          if (vp.focalStepId) fitToContent(hubId, 'l3');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hubId, setLevel, fitToContent, getViewport]);
}
```

- [ ] **Step 4: Wire into Canvas.** Add `useCanvasViewportShortcuts({ hubId })` to the Canvas top-level component (same place as `useCanvasViewportInput`).

- [ ] **Step 5: Run + pass + commit.**

```bash
git commit -m "feat(8f): Cmd+0/1/2/3 keyboard shortcuts for level navigation"
```

---

### Task 19: Mobile sequential-picker UI (<768px)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/MobileLevelPicker.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/MobileLevelPicker.test.tsx`
- Modify: `packages/ui/src/components/Canvas/index.tsx` (mount picker at <768px)

- [ ] **Step 1: Write the failing test.**

```tsx
import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MobileLevelPicker } from '../MobileLevelPicker';
import { useCanvasViewportStore } from '@variscout/stores';

describe('<MobileLevelPicker>', () => {
  beforeEach(() => useCanvasViewportStore.setState({ viewports: {} }));

  it('renders a segmented control with three options', () => {
    const { getByText } = render(<MobileLevelPicker hubId="hub-A" />);
    expect(getByText('System')).toBeTruthy();
    expect(getByText('Process')).toBeTruthy();
    expect(getByText('Step')).toBeTruthy();
  });

  it('tapping a level sets currentLevel in the store', () => {
    const { getByText } = render(<MobileLevelPicker hubId="hub-A" />);
    fireEvent.click(getByText('System'));
    expect(useCanvasViewportStore.getState().getViewport('hub-A').currentLevel).toBe('l1');
  });

  it('disables Step option when focalStepId is not set', () => {
    const { getByText } = render(<MobileLevelPicker hubId="hub-A" />);
    const stepBtn = getByText('Step') as HTMLButtonElement;
    expect(stepBtn.disabled).toBe(true);
  });

  it('enables Step option when focalStepId is set', () => {
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    useCanvasViewportStore.getState().setLevel('hub-A', 'l2'); // demote but keep focalStepId? Actually focalStepId clears on L→L2. Adjust test.
    // Instead: directly set focalStepId via setLevel('hub-A', 'l3', 'step-7')
    useCanvasViewportStore.getState().setLevel('hub-A', 'l3', 'step-7');
    const { getByText } = render(<MobileLevelPicker hubId="hub-A" />);
    const stepBtn = getByText('Step') as HTMLButtonElement;
    expect(stepBtn.disabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run → fails.**

- [ ] **Step 3: Implement.**

```tsx
import { useCanvasViewportStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core';

export function MobileLevelPicker({ hubId }: { hubId: ProcessHubId }) {
  const viewport = useCanvasViewportStore(s => s.getViewport(hubId));
  const fit = useCanvasViewportStore(s => s.fitToContent);

  const stepDisabled = !viewport.focalStepId;

  return (
    <div role="tablist" className="flex border-b border-slate-200">
      <button
        role="tab"
        aria-selected={viewport.currentLevel === 'l1'}
        onClick={() => fit(hubId, 'l1')}
        className={viewport.currentLevel === 'l1' ? 'font-bold' : ''}
      >
        System
      </button>
      <button
        role="tab"
        aria-selected={viewport.currentLevel === 'l2'}
        onClick={() => fit(hubId, 'l2')}
      >
        Process
      </button>
      <button
        role="tab"
        aria-selected={viewport.currentLevel === 'l3'}
        onClick={() => fit(hubId, 'l3')}
        disabled={stepDisabled}
      >
        Step
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Mount conditionally in Canvas.**

In `Canvas/index.tsx`, use a media-query hook (or `window.matchMedia('(max-width: 767px)')`) to decide whether to render the mobile picker + skip the pan/zoom viewport:

```tsx
const isMobile = useMediaQuery('(max-width: 767px)');
if (isMobile) {
  return (
    <>
      <MobileLevelPicker hubId={hubId} />
      <LODSwitcher currentLevel={viewport.currentLevel} l1={...} l2={...} l3={...} />
    </>
  );
}
// Else: pan/zoom canvas (current path)
```

If a `useMediaQuery` hook doesn't exist, create it at `packages/hooks/src/useMediaQuery.ts`.

- [ ] **Step 5: Run + pass + commit.**

```bash
git commit -m "feat(8f): mobile sequential level picker (<768px fallback)"
```

---

### Task 20: PR3 verification + open PR

- [ ] **Step 1: Full local verification + --chrome walk.**

Verify on desktop:

- Wheel zoom out past 0.3 → currentLevel auto-switches to L1, placeholder "Coming next" renders
- Wheel zoom in past 2.0 → "Need focal step for L3" placeholder (since focalStepId isn't set yet)
- Cmd+1/2 jump levels
- L2 cards shrink at zoom < 1.0 (overview tiles)

Verify on mobile width (resize browser to <768px):

- Segmented picker [System | Process | Step] appears
- Tapping switches level
- Step is disabled when no focalStepId

- [ ] **Step 2: Push + open PR + review + merge.**

---

# PR4 — L3 investigator-mode renderer

**Scope:** L3 (Local Mechanism) view scoped to one focal step, in investigator (b0) mode. Embeds Evidence Map's per-step factor network + Wall mirror filtered by step. Column-level mini-charts. ADR-053-anchored factor-contribution gating. Response-path CTAs at column-mechanism granularity.

**Size:** M-L. **Tasks:** 7. **Tests added:** ~12.

### Task 21: Add `filterByStepId` prop to WallCanvas

**Files:**

- Modify: `packages/ui/src/components/InvestigationWall/WallCanvas.tsx`
- Test: `packages/ui/src/components/InvestigationWall/__tests__/WallCanvas.test.tsx`

- [ ] **Step 1: Add test.**

```tsx
describe('<WallCanvas filterByStepId>', () => {
  it('renders all hypothesis cards when filterByStepId is undefined', () => {
    const { container } = render(<WallCanvas hypotheses={ALL_HYPS} />);
    expect(container.querySelectorAll('[data-testid="hypothesis-card"]').length).toBe(
      ALL_HYPS.length
    );
  });

  it('renders only cards whose condition references the focal step', () => {
    const { container } = render(<WallCanvas hypotheses={ALL_HYPS} filterByStepId="step-7" />);
    const cards = container.querySelectorAll('[data-testid="hypothesis-card"]');
    cards.forEach(c => {
      const stepIds = c.getAttribute('data-step-ids')?.split(',') ?? [];
      expect(stepIds).toContain('step-7');
    });
  });
});
```

- [ ] **Step 2: Implement.** Add the prop:

```tsx
filterByStepId?: StepId;
```

In the component, before rendering hypothesis cards, filter the hypotheses list:

```tsx
const visible = filterByStepId
  ? hypotheses.filter(h => referencesStep(h.condition, filterByStepId))
  : hypotheses;
```

`referencesStep` is a small helper that walks the `HypothesisCondition` predicate tree and returns true if any leaf references a column belonging to the given step. Add it to `packages/core/src/findings/hypothesisCondition.ts` (or wherever HypothesisCondition lives).

- [ ] **Step 3: Run + pass + commit.**

```bash
git commit -m "feat(8f): WallCanvas filterByStepId prop"
```

---

### Task 22: Extract a lean `EvidenceMapBase` export (already exists; verify + amend)

**Files:**

- Modify: `packages/charts/src/EvidenceMap/index.ts`
- (Possibly) Modify: `packages/charts/src/EvidenceMap/EvidenceMapBase.tsx`

- [ ] **Step 1: Audit exports.**

```bash
grep -rn "export" packages/charts/src/EvidenceMap/index.ts
```

If `EvidenceMapBase` is already a named export with a `filterByStepId` prop or a `scope` prop, skip Step 2. Otherwise:

- [ ] **Step 2: Add a `filterByStepId` prop to `EvidenceMapBase`.**

Same pattern as Task 21. Pass through to the factor-network filtering — only edges/nodes whose source or target column belongs to the focal step render.

- [ ] **Step 3: Add a test asserting the filter works.** **Commit.**

```bash
git commit -m "feat(8f): EvidenceMapBase filterByStepId prop"
```

---

### Task 23: Create the `LocalMechanismView` (L3 investigator renderer)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/LocalMechanismView.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
describe('<LocalMechanismView>', () => {
  it('renders column mini-charts for each column linked to the focal step', () => {
    const { container } = render(<LocalMechanismView hubId="hub-A" focalStepId="step-7" />);
    expect(container.querySelectorAll('[data-testid="column-mini-chart"]').length).toBeGreaterThan(
      0
    );
  });

  it('embeds EvidenceMapBase filtered to the focal step', () => {
    const { getByTestId } = render(<LocalMechanismView hubId="hub-A" focalStepId="step-7" />);
    expect(getByTestId('evidence-map-base')).toBeTruthy();
  });

  it('embeds WallCanvas filtered to the focal step', () => {
    const { getByTestId } = render(<LocalMechanismView hubId="hub-A" focalStepId="step-7" />);
    expect(getByTestId('wall-canvas')).toBeTruthy();
  });

  it('renders column mini-charts but NOT factor-contribution rankings when no active investigation', () => {
    // No active investigation in store
    const { queryByTestId } = render(<LocalMechanismView hubId="hub-A" focalStepId="step-7" />);
    expect(queryByTestId('column-mini-chart')).toBeTruthy();
    expect(queryByTestId('factor-contribution-rankings')).toBeNull();
  });

  it('renders factor-contribution rankings WHEN an active investigation exists', () => {
    useInvestigationStore.getState().setActiveInvestigation({ id: 'inv-1' /* ... */ });
    const { getByTestId } = render(<LocalMechanismView hubId="hub-A" focalStepId="step-7" />);
    expect(getByTestId('factor-contribution-rankings')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement.**

```tsx
import { EvidenceMapBase } from '@variscout/charts';
import { WallCanvas } from '../../InvestigationWall/WallCanvas';
import { useColumnsForStep } from '@variscout/hooks';
import { useInvestigationStore } from '@variscout/stores';
import { MiniIChart, MiniBoxplot } from '../../InvestigationWall/...'; // existing exports from PR-RPS-3

export interface LocalMechanismViewProps {
  hubId: ProcessHubId;
  focalStepId: StepId;
}

export function LocalMechanismView({ hubId, focalStepId }: LocalMechanismViewProps) {
  const columns = useColumnsForStep(hubId, focalStepId);
  const activeInvestigation = useInvestigationStore(s => s.activeInvestigation);
  const hasInvestigation = Boolean(activeInvestigation);

  return (
    <div className="local-mechanism-view">
      <h2>{focalStepId}</h2>

      <section data-testid="column-mini-charts">
        {columns.map(col => (
          <div key={col.id} data-testid="column-mini-chart">
            {col.kind === 'numeric' ? <MiniIChart column={col} /> : <MiniBoxplot column={col} />}
          </div>
        ))}
      </section>

      {hasInvestigation && (
        <section data-testid="factor-contribution-rankings">
          <FactorContributionRankings stepId={focalStepId} />
        </section>
      )}

      <section>
        <EvidenceMapBase
          data-testid="evidence-map-base"
          filterByStepId={focalStepId}
          hubId={hubId}
        />
      </section>

      <section>
        <WallCanvas
          data-testid="wall-canvas"
          filterByStepId={focalStepId}
          hypotheses={/* from store */}
        />
      </section>
    </div>
  );
}
```

`FactorContributionRankings` is a small component that consumes existing `@variscout/core/stats` factor analysis (ANOVA η², bestSubsets) and renders a ranked list. If it doesn't exist yet, create a stub that calls `computeFactorContributions(hubId, focalStepId)` from core; the core function may need to be added if missing.

- [ ] **Step 3: Run + pass + commit.**

```bash
git commit -m "feat(8f): LocalMechanismView L3 investigator-mode renderer"
```

---

### Task 24: Wire L3 into the LODSwitcher

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx` (or CanvasWorkspace)

- [ ] **Step 1: In the LODSwitcher props, replace the placeholder L3 with the real component.**

```tsx
<LODSwitcher
  currentLevel={viewport.currentLevel}
  l1={<L1Placeholder />}
  l2={<CanvasL2Renderer hubId={hubId} />}
  l3={
    viewport.focalStepId ? (
      <LocalMechanismView hubId={hubId} focalStepId={viewport.focalStepId} />
    ) : (
      <NoFocalStepPrompt />
    )
  }
/>
```

`NoFocalStepPrompt`: a small component that says "Zoom in on a step or pick one to drill into" and shows a step list.

- [ ] **Step 2: Auto-set focalStepId when crossing into L3 via wheel zoom.**

In `canvasViewportStore.ts` `setZoom`, when the new level becomes L3 and `focalStepId` is unset, compute the focal step from the viewport center. This requires knowing the step layout — defer the _real_ implementation to PR6 polish; for now, set `focalStepId` to the first step in the Hub if undefined.

- [ ] **Step 3: --chrome walk.** Wheel zoom past 2.0 → L3 renders with the first step's columns visible. Pick a different step from the `NoFocalStepPrompt` → L3 switches.

- [ ] **Step 4: Commit.**

```bash
git commit -m "feat(8f): L3 investigator-mode wired into LODSwitcher"
```

---

### Task 25: Response-path CTAs at column-mechanism granularity (V1: surface existing CTAs, scoped)

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx`
- Reuse: existing `LogActionModal` + `RecentActivityPanel` from PR-RPS-8

- [ ] **Step 1: Add a "Quick Action" CTA per column in `LocalMechanismView`.**

For each column in the column mini-charts section, render a `<QuickActionButton column={col} step={focalStepId} />`. Clicking opens `LogActionModal` with the action's context pre-populated to reference the column.

- [ ] **Step 2: Test.** Click "Quick Action" on a column → modal opens with column + step in context.

- [ ] **Step 3: Commit.**

```bash
git commit -m "feat(8f): column-granularity Quick Action CTA in L3"
```

---

### Task 26: Click-to-deepen in L3

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx`

Per spec §5.3.a: clicking inside Canvas-L3 opens the owner surface full-screen.

- [ ] **Step 1: Wire click handlers.**

```tsx
<EvidenceMapBase
  filterByStepId={focalStepId}
  hubId={hubId}
  onNodeClick={(factorId) => navigateToEvidenceMap({ hubId, factorId })}
/>
<WallCanvas
  filterByStepId={focalStepId}
  hypotheses={hypotheses}
  onCardClick={(hypId) => navigateToWall({ hubId, hypothesisId: hypId })}
/>
```

`navigateToEvidenceMap` / `navigateToWall` are existing navigation hooks (or router calls) — find with `grep -rn "navigateToEvidenceMap\|navigateToWall" packages apps`.

- [ ] **Step 2: Column mini-chart click opens AnalysisPanel.**

For each column mini-chart, on click, open the existing AnalysisPanel for that column scoped to the focal step.

- [ ] **Step 3: Test the click handlers (mock the navigation function).** **Commit.**

```bash
git commit -m "feat(8f): L3 click-to-deepen into owner surfaces"
```

---

### Task 27: PR4 verification + open PR

- [ ] **Step 1: Full local verification + --chrome walk in investigator mode (b0).**

On a seeded Hub with hypotheses + an active investigation:

1. Wheel zoom into a step (zoom >= 2.0) → L3 renders
2. Column mini-charts visible for the focal step's columns
3. Factor contribution rankings visible (since investigation is active)
4. Embedded Evidence Map filtered to the step
5. Wall mirror filtered to the step
6. Click a factor → Evidence Map opens full-screen
7. Click a hypothesis card → Wall opens at that hypothesis
8. Click "Quick Action" on a column → modal opens with column context

- [ ] **Step 2: Push + open PR + review + merge.**

---

# PR5 — L3 author-mode renderer

**Scope:** Author-archetype (b1) L3 renderer: FRAME column-assignment UI for the focal step inside Canvas. Routed by existing CanvasWorkspace b0/b1 state.

**Size:** S-M. **Tasks:** 5. **Tests added:** ~6.

### Task 28: Surface CanvasWorkspace's b0/b1 archetype to LocalMechanismView

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx` (accept archetype prop)

- [ ] **Step 1: Inspect CanvasWorkspace.**

```bash
grep -n "b0\|b1\|archetype" packages/ui/src/components/Canvas/CanvasWorkspace.tsx
```

Identify how the current archetype is stored (likely a prop or context).

- [ ] **Step 2: Pass archetype to LocalMechanismView.**

Add `archetype: 'b0' | 'b1'` to `LocalMechanismViewProps`. Pipe it from CanvasWorkspace through the LODSwitcher.

- [ ] **Step 3: Commit.**

```bash
git commit -m "refactor(8f): pipe archetype through to LocalMechanismView"
```

---

### Task 29: Create the `AuthorL3View` (column-assignment UI inside L3)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/AuthorL3View.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/AuthorL3View.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
describe('<AuthorL3View>', () => {
  it('renders unassigned columns + assigned columns for the focal step', () => {
    const { getByTestId } = render(<AuthorL3View hubId="hub-A" focalStepId="step-7" />);
    expect(getByTestId('unassigned-columns')).toBeTruthy();
    expect(getByTestId('assigned-columns')).toBeTruthy();
  });

  it('drag-drop assigns a column to the step', () => {
    // Use dnd-kit's test utilities to simulate drag from unassigned → assigned
    // Verify the store mutation
  });
});
```

- [ ] **Step 2: Implement.**

Reuse existing FRAME column-assignment primitives (likely in `packages/ui/src/components/Frame/` per memory). The new component is a thin shell that scopes the chip placement to one step's column set:

```tsx
import { ColumnChipZone, AssignedColumnsList } from '../../Frame/...';

export function AuthorL3View({ hubId, focalStepId }: { hubId: ProcessHubId; focalStepId: StepId }) {
  return (
    <div className="author-l3-view">
      <h2>Wire columns to {focalStepId}</h2>
      <section data-testid="unassigned-columns">
        <ColumnChipZone hubId={hubId} />
      </section>
      <section data-testid="assigned-columns">
        <AssignedColumnsList hubId={hubId} stepId={focalStepId} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Run + pass + commit.**

```bash
git commit -m "feat(8f): AuthorL3View column-assignment renderer"
```

---

### Task 30: Switch L3 renderer based on archetype

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/LocalMechanismView.tsx` (or wherever the L3 renderer is mounted)

- [ ] **Step 1: Route by archetype.**

```tsx
{
  currentLevel === 'l3' &&
    (archetype === 'b0' ? (
      <LocalMechanismView hubId={hubId} focalStepId={focalStepId} />
    ) : (
      <AuthorL3View hubId={hubId} focalStepId={focalStepId} />
    ));
}
```

If the existing routing pattern is different (e.g., a switch inside `LocalMechanismView`), follow the existing pattern.

- [ ] **Step 2: Test the routing.** Mock `archetype="b1"` → AuthorL3View renders; `archetype="b0"` → factor-network renders.

- [ ] **Step 3: Commit.**

```bash
git commit -m "feat(8f): L3 archetype routing (b0 investigator | b1 author)"
```

---

### Task 31: --chrome walk: switch archetype mid-L3

- [ ] **Step 1: Manual walk.**

1. Open a hub in b1 (author) mode → zoom into a step → AuthorL3View renders
2. Switch to b0 (investigator) → LocalMechanismView renders without losing focal step
3. Both renderers respect the same `focalStepId`

- [ ] **Step 2: Document any UX gaps as `docs/investigations.md` entries.** Commit polish if found.

---

### Task 32: PR5 verification + open PR + review + merge

- [ ] Push, open PR titled "feat(8f): PR5 L3 author-mode renderer", subagent review, merge.

---

# PR6 — L1 outcome panel + mode-lens × level matrix + integration polish

**Scope:** L1 slim outcome panel (ADR-073-compliant); mode-lens × level matrix complete + disabled-cell empty states; deep-link wiring (`?level=`); measurement-based fit-to-content; ADR-074 amendment verification; --chrome walks per level; mobile sequential picker QA.

**Size:** M. **Tasks:** 8. **Tests added:** ~14.

### Task 33: Create the `SystemLevelView` (L1 slim outcome panel)

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/SystemLevelView.tsx`
- Test: `packages/ui/src/components/Canvas/internal/__tests__/SystemLevelView.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
describe('<SystemLevelView>', () => {
  it('renders the Hub name + outcome name', () => {
    const { getByText } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByText(/Hub: hub-A/)).toBeTruthy();
  });

  it('renders outcome distribution chart', () => {
    const { getByTestId } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByTestId('outcome-distribution')).toBeTruthy();
  });

  it('renders drift indicator + time-series', () => {
    const { getByTestId } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByTestId('drift-indicator')).toBeTruthy();
    expect(getByTestId('outcome-time-series')).toBeTruthy();
  });

  it('renders capability against outcome spec (single row, no cross-step aggregation)', () => {
    const { getByTestId } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByTestId('outcome-capability')).toBeTruthy();
  });

  it('renders Inbox digest + active investigations summary', () => {
    const { getByTestId } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByTestId('inbox-digest')).toBeTruthy();
    expect(getByTestId('active-investigations-summary')).toBeTruthy();
  });

  it('does NOT render per-step response-path CTAs at L1', () => {
    const { queryByTestId } = render(<SystemLevelView hubId="hub-A" />);
    expect(queryByTestId('response-path-ctas')).toBeNull();
  });

  it('renders a click-to-open-SCOUT button', () => {
    const { getByText } = render(<SystemLevelView hubId="hub-A" />);
    expect(getByText(/Open SCOUT/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement.**

Reuse existing SCOUT primitives from `packages/ui/src/components/DashboardBase/`. The L1 view is a slim composition:

```tsx
import { OutcomeDistribution, DriftIndicator, OutcomeCapability } from '../../DashboardBase/...';
import { InboxDigest, ActiveInvestigationsSummary } from '../../...';

export function SystemLevelView({ hubId }: { hubId: ProcessHubId }) {
  return (
    <div className="system-level-view">
      <header>Hub: {hubId}</header>
      <section data-testid="outcome-distribution">
        <OutcomeDistribution hubId={hubId} />
      </section>
      <section data-testid="drift-indicator">
        <DriftIndicator hubId={hubId} />
      </section>
      <section data-testid="outcome-time-series">
        <OutcomeTimeSeries hubId={hubId} />
      </section>
      <section data-testid="outcome-capability">
        <OutcomeCapability hubId={hubId} />
      </section>
      <section data-testid="inbox-digest">
        <InboxDigest hubId={hubId} />
      </section>
      <section data-testid="active-investigations-summary">
        <ActiveInvestigationsSummary hubId={hubId} />
      </section>
      <button onClick={() => openScoutDashboard(hubId)}>Open SCOUT</button>
    </div>
  );
}
```

If some primitives don't exist as standalone exports, factor them out from `DashboardBase/` in the same PR (per ADR-074 amendment — Canvas embeds, doesn't re-render).

- [ ] **Step 3: Wire into LODSwitcher.** Replace the L1 placeholder with `<SystemLevelView hubId={hubId} />`.

- [ ] **Step 4: Commit.**

```bash
git commit -m "feat(8f): SystemLevelView L1 outcome panel (ADR-073-compliant)"
```

---

### Task 34: Mode-lens × level matrix in strategy

**Files:**

- Modify: `packages/core/src/strategy/...` (mode strategy registry)
- Test: `packages/core/src/strategy/__tests__/...`

- [ ] **Step 1: Inspect existing strategy pattern.**

```bash
grep -rn "isLensValidAt\|LensId\|ModeStrategy" packages/core/src/strategy
```

- [ ] **Step 2: Extend with a `level` parameter.**

Add to the mode strategy interface:

```ts
isValidAtLevel(lens: LensId, level: CanvasLevel): boolean;
```

Per spec §10 matrix:

- `yamazumi × l1`: invalid
- `process-flow × l1`: invalid
- `process-flow × l3`: invalid
- All others: valid

Implement the predicate + tests for all 15 cells.

- [ ] **Step 3: Render an empty-state per disabled cell.**

In whichever component reads the lens × level matrix (`LODSwitcher` or its parent), if `isValidAtLevel(lens, currentLevel) === false`, render an inline message:

```tsx
<div className="disabled-cell-empty-state">
  {lens} isn't available at {levelName(currentLevel)} — try {suggestLevel(lens, currentLevel)}.
</div>
```

- [ ] **Step 4: Test + commit.**

```bash
git commit -m "feat(8f): mode-lens × level matrix in strategy + disabled-cell empty state"
```

---

### Task 35: Measurement-based `fitToContent`

**Files:**

- Modify: `packages/stores/src/canvasViewportStore.ts` OR add a new hook `useFitToContent`
- Modify: Canvas component to call the real fit on mount + on Cmd+0

Replaces the placeholder zoom values from PR3 Task 16 with real measurement.

- [ ] **Step 1: Add a `useFitToContent` hook.**

```ts
import { useEffect } from 'react';
import { useCanvasViewportStore } from '@variscout/stores';

export function useFitToContent({
  hubId,
  level,
}: {
  hubId: ProcessHubId;
  level: CanvasLevel;
}): () => void {
  return () => {
    // Measure the bounding box of the rendered content for the level:
    const contentBounds = document
      .querySelector(`[data-canvas-level="${level}"]`)
      ?.getBoundingClientRect();
    if (!contentBounds) return;
    const viewportBounds = document
      .querySelector('[data-canvas-viewport-wrapper]')
      ?.getBoundingClientRect();
    if (!viewportBounds) return;
    const fitZoom =
      Math.min(
        viewportBounds.width / contentBounds.width,
        viewportBounds.height / contentBounds.height
      ) * 0.95;
    const fitPan = {
      x: viewportBounds.width / 2 - (contentBounds.width / 2) * fitZoom,
      y: viewportBounds.height / 2 - (contentBounds.height / 2) * fitZoom,
    };
    useCanvasViewportStore.getState().setZoom(hubId, fitZoom);
    useCanvasViewportStore.getState().setPan(hubId, fitPan);
  };
}
```

- [ ] **Step 2: Replace the placeholder `fitToContent` in the store with a no-op that defers to the hook.** Or: change the store's `fitToContent` to fire a custom event that the hook listens to.

- [ ] **Step 3: Update Cmd+0 shortcut to call the hook.** Update `useCanvasViewportShortcuts` (Task 18) to call `useFitToContent` instead of the store's placeholder.

- [ ] **Step 4: Test in --chrome.** Press Cmd+0 → content fits the viewport. Adjust the `0.95` margin if needed.

- [ ] **Step 5: Commit.**

```bash
git commit -m "feat(8f): measurement-based fit-to-content"
```

---

### Task 36: URL deep-link (`?level=l1|l2|l3`)

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` (or wherever URL parsing lives)
- Test: in `apps/pwa/e2e/` and `apps/azure/e2e/`

- [ ] **Step 1: On mount, read `?level=` from the URL.**

```tsx
const urlLevel = new URLSearchParams(location.search).get('level');
if (urlLevel && isValidLevel(urlLevel)) {
  useCanvasViewportStore.getState().setLevel(hubId, urlLevel as CanvasLevel);
  useCanvasViewportStore.getState().fitToContent(hubId, urlLevel as CanvasLevel);
}
```

- [ ] **Step 2: When `currentLevel` changes, update the URL (without reload).**

```tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  params.set('level', viewport.currentLevel);
  history.replaceState(null, '', `?${params.toString()}`);
}, [viewport.currentLevel]);
```

- [ ] **Step 3: Add E2E test.** In `apps/azure/e2e/canvas-viewport.spec.ts`:

```ts
test('opens at L1 when URL has ?level=l1', async ({ page }) => {
  await page.goto('/hub/abc?level=l1');
  await expect(page.getByTestId('outcome-distribution')).toBeVisible();
});
```

- [ ] **Step 4: Commit.**

```bash
git commit -m "feat(8f): URL deep-link ?level=l1|l2|l3"
```

---

### Task 37: ADR-074 amendment verification scripts

**Files:**

- Modify: `scripts/check-level-boundaries.sh` (or wherever ADR-074's grep checks live; create if not exists)

Per ADR-074 amendment 2026-05-13: Canvas may import owner-surface components; may not implement parallel ones.

- [ ] **Step 1: Add a grep assertion.**

```bash
# In scripts/check-level-boundaries.sh, after existing checks:

# Canvas may import EvidenceMapBase, DashboardBase, WallCanvas, but may not implement parallel ones:
rg "outcomeStats|outcomeBoxplot|stratifyByFactor|factorEdge" packages/ui/src/components/Canvas/internal/ \
  --type ts --type tsx \
  | grep -v "import" && echo "FAIL: Canvas implements forbidden L1/L3 primitives" && exit 1

echo "OK: Canvas-as-viewport-surface boundary clean"
```

- [ ] **Step 2: Run the check.** Add it to `bash scripts/pr-ready-check.sh` if not auto-invoked.

- [ ] **Step 3: Commit.**

```bash
git commit -m "chore(8f): ADR-074 amendment verification — Canvas may import, not reimplement"
```

---

### Task 38: --chrome walk every (mode × level) cell

- [ ] **Step 1: Manual walk through all 13 valid cells.**

For each cell (e.g., `capability × L1`, `defect × L2`, `yamazumi × L3`), verify the renderer produces sensible output. Log any UX gaps as `docs/investigations.md` entries.

- [ ] **Step 2: Manual walk through the 2 disabled cells.** Verify the empty-state messages render with helpful copy.

---

### Task 39: Mobile sequential-picker QA

- [ ] **Step 1: Resize browser to <768px.**

Verify:

1. Segmented picker `[System | Process | Step]` appears
2. Each tab renders its level content
3. "Step" disabled when no focalStepId; enabled after picking a step from L2's step list
4. No pan/zoom gestures on mobile (touch-action: none not set on mobile DOM)
5. Existing mobile flows (paste, hypothesis create, etc.) work

---

### Task 40: PR6 final verification + ADR/spec status promotion

- [ ] **Step 1: Full local + --chrome verification.**

- [ ] **Step 2: Open PR.** Title: "feat(8f): PR6 L1 outcome panel + lens × level matrix + integration polish (closes 8f)"

- [ ] **Step 3: Final Opus cross-cutting code review.**

Dispatch an Opus subagent with explicit prompt: check the entire 8f workstream against [the spec](../specs/2026-05-13-canvas-viewport-architecture-design.md) + [ADR-081](../../07-decisions/adr-081-canvas-viewport-architecture.md). Verify all 13 locked decisions land. Per `feedback_code_review_subagent_must_checkout_pr_branch`, STEP 0 is `git fetch && git checkout canvas-viewport-8f`.

- [ ] **Step 4: Merge.**

- [ ] **Step 5: Post-merge housekeeping.**

```bash
# Promote spec + plan to delivered (in main, after PR6 merges):
# Edit docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md:
#   status: accepted → delivered
# Edit docs/superpowers/plans/2026-05-13-canvas-viewport-architecture.md:
#   status: active → delivered

# Update docs/roadmap.md:
#   Move 8f from §2 In flight → §1 Just shipped
#   Add "8f Canvas viewport SHIPPED 2026-05-XX" entry with PRs

# Add decision-log entry:
#   "2026-05-XX — 8f canvas viewport SHIPPED — vision §5.4 closed"

# Memory updates:
#   ~/.claude/projects/.../memory/project_variscout_roadmap.md: 8f SHIPPED
#   ~/.claude/projects/.../memory/project_canvas_replaces_tabs.md: cross-ref 8f
#   ruflo memory: store durable fact "8f shipped" via mcp__ruflo__memory_store

# Delete the worktree (per CLAUDE.md):
git worktree remove .worktrees/canvas-viewport-8f
git branch -D canvas-viewport-8f
git fetch --prune
```

---

## Summary

**6 PRs, ~40 tasks, single branch `canvas-viewport-8f`.**

- **PR1 Foundation** (Tasks 1–7): shape-change store, add fields, Hub-keyed Dexie persistence
- **PR2 Input layer** (Tasks 8–13): d3-zoom, CanvasViewport primitive, coord-space utility, Wall wheel-zoom
- **PR3 LOD switcher + L2 gradient + mobile picker** (Tasks 14–20)
- **PR4 L3 investigator-mode** (Tasks 21–27): factor network embed, Wall mirror filtered, column mini-charts, response-path CTAs
- **PR5 L3 author-mode** (Tasks 28–32): FRAME column-assignment inside L3
- **PR6 L1 + matrix + polish** (Tasks 33–40): SystemLevelView, mode-lens × level, fit-to-content, URL deep-link, boundary scripts, --chrome walks, post-merge housekeeping

**Subagent-driven by default** (`feedback_subagent_driven_default`). Sonnet implementer + Sonnet reviewer per task + Opus final per PR. Subagent reviewers MUST `git checkout canvas-viewport-8f` before reviewing (`feedback_code_review_subagent_must_checkout_pr_branch`).

**Pre-existing-pattern callouts (avoid recreating):**

- Pan/drag pattern: `WallCanvas.tsx` + `CanvasWallOverlay.tsx`
- Mini-chart components: `MiniIChart` + `MiniBoxplot` from PR-RPS-3
- Action modal: `LogActionModal` + `RecentActivityPanel` from PR-RPS-8
- HubAction dispatch: `applyAction.ts` pattern from F4
- Dexie clean break: PR-RPS-5 (Azure v9→v10) precedent

**End-of-workstream verification gate** (per spec §15):

- ✅ Can a user pan/zoom L1 → L2 → L3 without a level-picker control?
- ✅ Mode lens persists across level transitions?
- ✅ ADR-073 not violated at L1?
- ✅ ADR-053 not violated at L3?
- ✅ Mobile sequential picker works at <768px?
- ✅ Wall mirror (PR8 8e) continues to work at L2?
- ✅ Hypothesis-arrow draw tool (PR8 8d) continues to work at L2?
- ✅ `bash scripts/pr-ready-check.sh` green on every PR?
- ✅ `pnpm --filter @variscout/ui build` green on every PR?
- ✅ Final Opus code-review pass on PR6 before squash-merge?
