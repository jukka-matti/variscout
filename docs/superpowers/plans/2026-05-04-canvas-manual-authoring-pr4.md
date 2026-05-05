---
title: Manual Canvas Authoring (PR4) Implementation Plan
audience: [engineer]
category: implementation
status: draft
date: 2026-05-04
related:
  - docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/decision-log.md
  - docs/investigations.md
---

# Manual Canvas Authoring (PR4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Spec 2 (Manual Canvas Authoring) as canvas migration PR4 — chip placement (Mode 1) + structural authoring (Mode 2) + auto-step-creation as fluid boundary, B4 visibility-based mode toggle, C1 state-history undo, fifth-domain Zustand `canvasStore`, accessibility from day 1.

**Architecture:** Three sequenced sub-PRs (4a / 4b / 4c) on a single conceptual branch family per `feedback_slice_size_cap`. **4a** lands the engine: canvas action types in `@variscout/core/canvas`, fifth domain `canvasStore` with Immer + devtools, history middleware. **4b** builds chip-placement UX: `@dnd-kit/core` integration, `ChipRail`, `ChipRailItem`, `AutoStepCreatePrompt`, basic Canvas mounting. **4c** completes the surface: structural authoring (steps, arrows, sub-step grouping, branch/join), `CanvasModeToggle` (B4 visibility-based), undo/redo bindings (Cmd+Z), accessibility (keyboard chip placement + ARIA + color-blindness).

**Tech Stack:** TypeScript, Vitest + React Testing Library + Playwright, Zustand + Immer + devtools middleware, `@dnd-kit/core` (drag-and-drop with built-in keyboard support), Tailwind v4. Builds on the canvas migration PR1+PR2+PR3 surface (`Canvas` component, `CanvasWorkspace`, `useSessionCanvasFilters`).

## Prerequisites

- **Canvas migration PR1+PR2+PR3** must be merged to main first (PR #126 covers this bundle). PR4's branches rebase onto main after that lands.
- **Spec 2** at `docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md` (on main as of `01de9177`).

## Slice Scope

### In scope (PR4 across 4a + 4b + 4c)

- Canvas action vocabulary (12-15 discriminated-union action types in `@variscout/core/canvas`)
- Fifth domain Zustand `canvasStore` with Immer + devtools middleware
- State-history undo/redo middleware (capped at 50 entries; per-session)
- `ChipRail` + `ChipRailItem` (left side panel of unassigned columns)
- `@dnd-kit/core` integration for drag-and-drop with keyboard alternative
- `AutoStepCreatePrompt` (drag-onto-empty-space → "Create step here?" UX)
- `StepCard` extension (drop-target highlighting, anchor handles, multi-select halo, `[✎]` chip)
- `StepArrow` SVG renderer with hover/click affordances
- `StructuralToolbar` (Add step / Group / Branch / Join)
- `SubStepGrouper` (multi-select halo + contextual menu)
- `CanvasModeToggle` (padlock-style author/read toggle; B4 visibility semantics)
- Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, E for mode toggle, Esc, Tab nav, Enter/Space chip placement)
- Accessibility constraints H1–H6 baked in
- E2E coverage in PWA + Azure (keyboard nav, chip placement, structural authoring, mode toggle, undo)

### Out of scope (subsequent specs/PRs)

- **PR5 / Spec 3:** card content (mini-charts, capability badges, drift indicators), drill-down on click, mode lenses
- **PR6 / Spec 4:** canvas overlays (investigations / hypotheses / suspected causes / findings), Wall projection sync, map version conflict resolution
- **PR7 / Spec 5:** PWA IndexedDB persistence schema (this PR uses existing `hubRepository.saveHub`)
- **PR8:** legacy component cleanup
- AI map drafting (cut from V1 per vision §5.7)
- Multi-user CRDT (V2+; constraints baked in but no implementation)
- Canvas virtualization (deferred until 50+ node smell)

## Branching + Workflow

- **Branch family:** `canvas-migration-phase-4a-state` → `canvas-migration-phase-4b-chip-placement` → `canvas-migration-phase-4c-structural`
- **Each sub-PR opens against `main`** — sequential merge, not chained PRs. After 4a merges, 4b rebases onto fresh main; same for 4c.
- **Pre-merge:** `bash scripts/pr-ready-check.sh` green per sub-PR.
- **Code review:** subagent-driven per-task review per `superpowers:subagent-driven-development`. Sonnet for implementer + per-task spec/quality reviewers (≥70% per `feedback_subagent_driven_default`); Opus for final-branch review per sub-PR.
- **Worktree per sub-PR** — `.worktrees/canvas-migration-phase-4a-state/` etc. per `feedback_one_worktree_per_agent`. The main session does NOT operate in any of these worktrees during sub-PR implementation.
- **No `--no-verify`** per `feedback_subagent_no_verify`.
- **Drive-by drift fixes** in same commit per `feedback_no_backcompat_clean_architecture`.

---

## Phase 4a — State + Actions Engine

**Branch:** `canvas-migration-phase-4a-state`
**Estimated:** 7 tasks
**PR title:** `feat: canvas action types + canvasStore + history middleware (PR4a)`

This phase ships the engine layer with no UI. Future phases (4b, 4c) consume the action vocabulary + store.

### Task 4a.1: Canvas action types in `@variscout/core/canvas`

**Files:**

- Create: `packages/core/src/canvas/types.ts`
- Create: `packages/core/src/canvas/__tests__/types.test.ts`

- [ ] **Step 1: Write failing test for action discriminated union**

```ts
// packages/core/src/canvas/__tests__/types.test.ts
import { describe, expect, it } from 'vitest';
import type { CanvasAction } from '../types';

describe('CanvasAction discriminated union', () => {
  it('PLACE_CHIP_ON_STEP carries chipId + stepId', () => {
    const action: CanvasAction = {
      kind: 'PLACE_CHIP_ON_STEP',
      chipId: 'col-pressure',
      stepId: 'step-mold',
    };
    expect(action.kind).toBe('PLACE_CHIP_ON_STEP');
    if (action.kind === 'PLACE_CHIP_ON_STEP') {
      expect(action.chipId).toBe('col-pressure');
      expect(action.stepId).toBe('step-mold');
    }
  });

  it('UNASSIGN_CHIP carries chipId only', () => {
    const action: CanvasAction = { kind: 'UNASSIGN_CHIP', chipId: 'col-pressure' };
    expect(action.kind).toBe('UNASSIGN_CHIP');
  });

  it('ADD_STEP carries stepName + optional position', () => {
    const action: CanvasAction = {
      kind: 'ADD_STEP',
      stepName: 'Cool',
      position: { x: 100, y: 200 },
    };
    expect(action.kind).toBe('ADD_STEP');
  });
});
```

- [ ] **Step 2: Run test — should fail with "Cannot find module '../types'"**

```bash
cd .worktrees/canvas-migration-phase-4a-state
CI=1 pnpm --filter @variscout/core test packages/core/src/canvas/__tests__/types.test.ts
```

- [ ] **Step 3: Implement `CanvasAction` discriminated union**

```ts
// packages/core/src/canvas/types.ts
/**
 * Discriminated-union of all canvas authoring actions.
 *
 * Each action is the unit of merge for future CRDT (V2+ multiplayer).
 * Per Spec 2 Decision D + G — see docs/superpowers/specs/2026-05-04-manual-canvas-authoring-design.md.
 */
export type CanvasAction =
  | { kind: 'PLACE_CHIP_ON_STEP'; chipId: string; stepId: string }
  | { kind: 'UNASSIGN_CHIP'; chipId: string }
  | { kind: 'REORDER_CHIP_IN_STEP'; chipId: string; stepId: string; toIndex: number }
  | { kind: 'ADD_STEP'; stepName: string; position?: { x: number; y: number } }
  | { kind: 'REMOVE_STEP'; stepId: string }
  | { kind: 'RENAME_STEP'; stepId: string; newName: string }
  | { kind: 'CONNECT_STEPS'; fromStepId: string; toStepId: string }
  | { kind: 'DISCONNECT_STEPS'; fromStepId: string; toStepId: string }
  | { kind: 'GROUP_INTO_SUB_STEP'; stepIds: string[]; parentStepId: string }
  | { kind: 'UNGROUP_SUB_STEP'; stepId: string };

/** Type-narrowing helper: pick a specific action kind by string literal. */
export type CanvasActionOf<K extends CanvasAction['kind']> = Extract<CanvasAction, { kind: K }>;
```

- [ ] **Step 4: Run test — verify all three pass**

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/canvas/types.ts packages/core/src/canvas/__tests__/types.test.ts
git commit -m "feat(4a): canvas action discriminated union types"
```

### Task 4a.2: Canvas action factory functions

**Files:**

- Create: `packages/core/src/canvas/actions.ts`
- Create: `packages/core/src/canvas/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing tests for factory functions**

```ts
// packages/core/src/canvas/__tests__/actions.test.ts
import { describe, expect, it } from 'vitest';
import {
  placeChipOnStepAction,
  unassignChipAction,
  addStepAction,
  connectStepsAction,
  groupIntoSubStepAction,
} from '../actions';

describe('canvas action factories', () => {
  it('placeChipOnStepAction returns typed action', () => {
    const action = placeChipOnStepAction('col-1', 'step-1');
    expect(action).toEqual({ kind: 'PLACE_CHIP_ON_STEP', chipId: 'col-1', stepId: 'step-1' });
  });

  it('addStepAction omits position when not provided', () => {
    const action = addStepAction('Mold');
    expect(action.kind).toBe('ADD_STEP');
    expect(action.stepName).toBe('Mold');
    expect(action.position).toBeUndefined();
  });

  it('groupIntoSubStepAction accepts step id arrays', () => {
    const action = groupIntoSubStepAction(['s1', 's2'], 'parent-1');
    expect(action.stepIds).toEqual(['s1', 's2']);
  });
});
```

- [ ] **Step 2: Run test — fails on missing exports**

- [ ] **Step 3: Implement factories**

```ts
// packages/core/src/canvas/actions.ts
import type { CanvasAction } from './types';

export const placeChipOnStepAction = (chipId: string, stepId: string): CanvasAction => ({
  kind: 'PLACE_CHIP_ON_STEP',
  chipId,
  stepId,
});

export const unassignChipAction = (chipId: string): CanvasAction => ({
  kind: 'UNASSIGN_CHIP',
  chipId,
});

export const reorderChipInStepAction = (
  chipId: string,
  stepId: string,
  toIndex: number
): CanvasAction => ({ kind: 'REORDER_CHIP_IN_STEP', chipId, stepId, toIndex });

export const addStepAction = (
  stepName: string,
  position?: { x: number; y: number }
): CanvasAction => ({ kind: 'ADD_STEP', stepName, ...(position ? { position } : {}) });

export const removeStepAction = (stepId: string): CanvasAction => ({
  kind: 'REMOVE_STEP',
  stepId,
});

export const renameStepAction = (stepId: string, newName: string): CanvasAction => ({
  kind: 'RENAME_STEP',
  stepId,
  newName,
});

export const connectStepsAction = (fromStepId: string, toStepId: string): CanvasAction => ({
  kind: 'CONNECT_STEPS',
  fromStepId,
  toStepId,
});

export const disconnectStepsAction = (fromStepId: string, toStepId: string): CanvasAction => ({
  kind: 'DISCONNECT_STEPS',
  fromStepId,
  toStepId,
});

export const groupIntoSubStepAction = (stepIds: string[], parentStepId: string): CanvasAction => ({
  kind: 'GROUP_INTO_SUB_STEP',
  stepIds,
  parentStepId,
});

export const ungroupSubStepAction = (stepId: string): CanvasAction => ({
  kind: 'UNGROUP_SUB_STEP',
  stepId,
});
```

- [ ] **Step 4: Run test — verify pass**

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/canvas/actions.ts packages/core/src/canvas/__tests__/actions.test.ts
git commit -m "feat(4a): canvas action factory functions"
```

### Task 4a.3: Sub-path export `@variscout/core/canvas`

**Files:**

- Create: `packages/core/src/canvas/index.ts`
- Modify: `packages/core/package.json` (add `./canvas` to `exports`)

- [ ] **Step 1: Create barrel**

```ts
// packages/core/src/canvas/index.ts
export type { CanvasAction, CanvasActionOf } from './types';
export {
  placeChipOnStepAction,
  unassignChipAction,
  reorderChipInStepAction,
  addStepAction,
  removeStepAction,
  renameStepAction,
  connectStepsAction,
  disconnectStepsAction,
  groupIntoSubStepAction,
  ungroupSubStepAction,
} from './actions';
```

- [ ] **Step 2: Add `./canvas` to `packages/core/package.json` exports**

Open `packages/core/package.json`, find the `exports` field, add the new entry alongside existing sub-paths (mirror `./pareto` pattern from slice 4):

```json
{
  "exports": {
    "...other sub-paths...": "...",
    "./canvas": "./src/canvas/index.ts",
    "./pareto": "./src/pareto/index.ts"
  }
}
```

- [ ] **Step 3: Run package build to verify exports work**

```bash
cd .worktrees/canvas-migration-phase-4a-state
pnpm --filter @variscout/core build
```

Expected: clean build, no module-resolution errors.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/canvas/index.ts packages/core/package.json
git commit -m "feat(4a): wire @variscout/core/canvas sub-path export"
```

### Task 4a.4: `canvasStore` (Zustand + Immer + devtools)

**Files:**

- Create: `packages/stores/src/canvasStore.ts`
- Create: `packages/stores/src/__tests__/canvasStore.test.ts`

- [ ] **Step 1: Write failing tests for store actions**

```ts
// packages/stores/src/__tests__/canvasStore.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useCanvasStore } from '../canvasStore';

describe('canvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      canonicalMap: { steps: [], arrows: [], assignments: {} },
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: 'v0',
    });
  });

  it('placeChipOnStep records assignment + bumps version', () => {
    const before = useCanvasStore.getState().canonicalMapVersion;
    useCanvasStore.getState().placeChipOnStep('col-1', 'step-1');
    const state = useCanvasStore.getState();
    expect(state.canonicalMap.assignments['col-1']).toBe('step-1');
    expect(state.canonicalMapVersion).not.toBe(before);
  });

  it('unassignChip removes assignment', () => {
    useCanvasStore.getState().placeChipOnStep('col-1', 'step-1');
    useCanvasStore.getState().unassignChip('col-1');
    expect(useCanvasStore.getState().canonicalMap.assignments['col-1']).toBeUndefined();
  });

  it('addStep appends new step to canonicalMap.steps', () => {
    useCanvasStore.getState().addStep('Mold');
    const steps = useCanvasStore.getState().canonicalMap.steps;
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe('Mold');
  });

  it('removeStep removes step + drops its column assignments', () => {
    useCanvasStore.getState().addStep('Mold');
    const stepId = useCanvasStore.getState().canonicalMap.steps[0].id;
    useCanvasStore.getState().placeChipOnStep('col-1', stepId);
    useCanvasStore.getState().removeStep(stepId);
    expect(useCanvasStore.getState().canonicalMap.steps).toHaveLength(0);
    expect(useCanvasStore.getState().canonicalMap.assignments['col-1']).toBeUndefined();
  });

  it('connectSteps + disconnectSteps add/remove arrows', () => {
    useCanvasStore.getState().addStep('A');
    useCanvasStore.getState().addStep('B');
    const [a, b] = useCanvasStore.getState().canonicalMap.steps;
    useCanvasStore.getState().connectSteps(a.id, b.id);
    expect(useCanvasStore.getState().canonicalMap.arrows).toHaveLength(1);
    useCanvasStore.getState().disconnectSteps(a.id, b.id);
    expect(useCanvasStore.getState().canonicalMap.arrows).toHaveLength(0);
  });

  it('renameStep updates step.name', () => {
    useCanvasStore.getState().addStep('Old Name');
    const stepId = useCanvasStore.getState().canonicalMap.steps[0].id;
    useCanvasStore.getState().renameStep(stepId, 'New Name');
    expect(useCanvasStore.getState().canonicalMap.steps[0].name).toBe('New Name');
  });

  it('actions produce immutable updates (Immer)', () => {
    const before = useCanvasStore.getState().canonicalMap;
    useCanvasStore.getState().placeChipOnStep('col-1', 'step-1');
    const after = useCanvasStore.getState().canonicalMap;
    expect(after).not.toBe(before);
    expect(after.assignments).not.toBe(before.assignments);
  });
});
```

- [ ] **Step 2: Run test — fails on missing module**

- [ ] **Step 3: Implement `canvasStore`**

```ts
// packages/stores/src/canvasStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { OutcomeSpec } from '@variscout/core';

/**
 * Plain JSON-serializable canvas document state. Per Spec 2 Decision G:
 * no class instances, no shared refs, no functions in state.
 */
export interface CanvasMap {
  steps: CanvasStep[];
  arrows: CanvasArrow[];
  /** Map from column id to the step id it's assigned to. */
  assignments: Record<string, string>;
}

export interface CanvasStep {
  id: string;
  name: string;
  position?: { x: number; y: number };
  /** Sub-step parent reference. Null for top-level steps. One level of nesting only. */
  parentStepId?: string | null;
}

export interface CanvasArrow {
  id: string;
  fromStepId: string;
  toStepId: string;
}

const newId = () =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

const newVersion = () => newId();

export interface CanvasStoreState {
  canonicalMap: CanvasMap;
  outcomes: OutcomeSpec[];
  primaryScopeDimensions: string[];
  canonicalMapVersion: string;

  placeChipOnStep: (chipId: string, stepId: string) => void;
  unassignChip: (chipId: string) => void;
  reorderChipInStep: (chipId: string, stepId: string, toIndex: number) => void;
  addStep: (stepName: string, position?: { x: number; y: number }) => void;
  removeStep: (stepId: string) => void;
  renameStep: (stepId: string, newName: string) => void;
  connectSteps: (fromStepId: string, toStepId: string) => void;
  disconnectSteps: (fromStepId: string, toStepId: string) => void;
  groupIntoSubStep: (stepIds: string[], parentStepId: string) => void;
  ungroupSubStep: (stepId: string) => void;
}

const defaultMap = (): CanvasMap => ({ steps: [], arrows: [], assignments: {} });

export const useCanvasStore = create<CanvasStoreState>()(
  devtools(
    immer(set => ({
      canonicalMap: defaultMap(),
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: newVersion(),

      placeChipOnStep: (chipId, stepId) =>
        set(
          state => {
            state.canonicalMap.assignments[chipId] = stepId;
            state.canonicalMapVersion = newVersion();
          },
          false,
          'PLACE_CHIP_ON_STEP'
        ),

      unassignChip: chipId =>
        set(
          state => {
            delete state.canonicalMap.assignments[chipId];
            state.canonicalMapVersion = newVersion();
          },
          false,
          'UNASSIGN_CHIP'
        ),

      reorderChipInStep: (_chipId, _stepId, _toIndex) =>
        set(
          state => {
            // Reorder semantics: assignments map doesn't preserve order; if order matters
            // for rendering, the consumer maintains a per-step `chipOrder` array. This action
            // is a placeholder for V1 — future refinement once the rendering need is concrete.
            state.canonicalMapVersion = newVersion();
          },
          false,
          'REORDER_CHIP_IN_STEP'
        ),

      addStep: (stepName, position) =>
        set(
          state => {
            state.canonicalMap.steps.push({
              id: newId(),
              name: stepName,
              ...(position ? { position } : {}),
            });
            state.canonicalMapVersion = newVersion();
          },
          false,
          'ADD_STEP'
        ),

      removeStep: stepId =>
        set(
          state => {
            state.canonicalMap.steps = state.canonicalMap.steps.filter(s => s.id !== stepId);
            state.canonicalMap.arrows = state.canonicalMap.arrows.filter(
              a => a.fromStepId !== stepId && a.toStepId !== stepId
            );
            for (const [chipId, sid] of Object.entries(state.canonicalMap.assignments)) {
              if (sid === stepId) delete state.canonicalMap.assignments[chipId];
            }
            state.canonicalMapVersion = newVersion();
          },
          false,
          'REMOVE_STEP'
        ),

      renameStep: (stepId, newName) =>
        set(
          state => {
            const step = state.canonicalMap.steps.find(s => s.id === stepId);
            if (step) {
              step.name = newName;
              state.canonicalMapVersion = newVersion();
            }
          },
          false,
          'RENAME_STEP'
        ),

      connectSteps: (fromStepId, toStepId) =>
        set(
          state => {
            state.canonicalMap.arrows.push({ id: newId(), fromStepId, toStepId });
            state.canonicalMapVersion = newVersion();
          },
          false,
          'CONNECT_STEPS'
        ),

      disconnectSteps: (fromStepId, toStepId) =>
        set(
          state => {
            state.canonicalMap.arrows = state.canonicalMap.arrows.filter(
              a => !(a.fromStepId === fromStepId && a.toStepId === toStepId)
            );
            state.canonicalMapVersion = newVersion();
          },
          false,
          'DISCONNECT_STEPS'
        ),

      groupIntoSubStep: (stepIds, parentStepId) =>
        set(
          state => {
            for (const sid of stepIds) {
              const step = state.canonicalMap.steps.find(s => s.id === sid);
              if (step) step.parentStepId = parentStepId;
            }
            state.canonicalMapVersion = newVersion();
          },
          false,
          'GROUP_INTO_SUB_STEP'
        ),

      ungroupSubStep: stepId =>
        set(
          state => {
            const step = state.canonicalMap.steps.find(s => s.id === stepId);
            if (step) step.parentStepId = null;
            state.canonicalMapVersion = newVersion();
          },
          false,
          'UNGROUP_SUB_STEP'
        ),
    })),
    { name: 'canvas-store' }
  )
);
```

- [ ] **Step 4: Add `immer` dependency if not present**

```bash
cd .worktrees/canvas-migration-phase-4a-state
# Check if zustand/middleware/immer is available — Zustand bundles it but immer must be installed
pnpm --filter @variscout/stores add immer
```

- [ ] **Step 5: Run tests**

```bash
CI=1 pnpm --filter @variscout/stores test packages/stores/src/__tests__/canvasStore.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/canvasStore.ts packages/stores/src/__tests__/canvasStore.test.ts packages/stores/package.json pnpm-lock.yaml
git commit -m "feat(4a): canvasStore with Zustand + Immer + devtools"
```

### Task 4a.5: Re-export canvasStore from `@variscout/stores`

**Files:**

- Modify: `packages/stores/src/index.ts`

- [ ] **Step 1: Add export**

```ts
// packages/stores/src/index.ts (append)
export {
  useCanvasStore,
  type CanvasStoreState,
  type CanvasMap,
  type CanvasStep,
  type CanvasArrow,
} from './canvasStore';
```

- [ ] **Step 2: Verify build**

```bash
cd .worktrees/canvas-migration-phase-4a-state
pnpm --filter @variscout/stores build
```

- [ ] **Step 3: Commit**

```bash
git add packages/stores/src/index.ts
git commit -m "feat(4a): re-export canvasStore from @variscout/stores barrel"
```

### Task 4a.6: Canvas history middleware (undo/redo)

**Files:**

- Create: `packages/stores/src/canvasHistoryMiddleware.ts`
- Create: `packages/stores/src/__tests__/canvasHistoryMiddleware.test.ts`

- [ ] **Step 1: Write failing tests for history**

```ts
// packages/stores/src/__tests__/canvasHistoryMiddleware.test.ts
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { withCanvasHistory } from '../canvasHistoryMiddleware';

interface TestState {
  count: number;
  inc: () => void;
}

describe('withCanvasHistory', () => {
  const mkStore = () =>
    create<TestState & { undo: () => void; redo: () => void; historyDepth: () => number }>()(
      withCanvasHistory(
        set => ({
          count: 0,
          inc: () => set(s => ({ ...s, count: s.count + 1 })),
        }),
        { capacity: 50 }
      )
    );

  it('undo restores prior state', () => {
    const store = mkStore();
    store.getState().inc();
    store.getState().inc();
    expect(store.getState().count).toBe(2);
    store.getState().undo();
    expect(store.getState().count).toBe(1);
  });

  it('redo replays after undo', () => {
    const store = mkStore();
    store.getState().inc();
    store.getState().undo();
    store.getState().redo();
    expect(store.getState().count).toBe(1);
  });

  it('new action drains the future stack', () => {
    const store = mkStore();
    store.getState().inc();
    store.getState().inc();
    store.getState().undo();
    store.getState().inc();
    // count was 2 → undo → 1 → inc → 2; future is now empty
    expect(store.getState().count).toBe(2);
    // redo should be a no-op now
    store.getState().redo();
    expect(store.getState().count).toBe(2);
  });

  it('history is capped at capacity', () => {
    const store = mkStore();
    for (let i = 0; i < 60; i++) store.getState().inc();
    expect(store.getState().count).toBe(60);
    // historyDepth reflects past entries up to capacity (50)
    expect(store.getState().historyDepth()).toBeLessThanOrEqual(50);
  });

  it('undo when history empty is a no-op', () => {
    const store = mkStore();
    store.getState().undo();
    expect(store.getState().count).toBe(0);
  });
});
```

- [ ] **Step 2: Run test — fails on missing module**

- [ ] **Step 3: Implement middleware**

```ts
// packages/stores/src/canvasHistoryMiddleware.ts
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

export interface CanvasHistoryOptions {
  /** Maximum number of past states to retain. Default 50 per Spec 2 Decision C. */
  capacity?: number;
  /**
   * Selector that extracts the slice of state to track. Defaults to identity.
   * Use to exclude view-state (filters, mode toggle, etc.) from history per Spec 2 Decision C.
   */
  trackedSlice?: <T>(state: T) => unknown;
}

interface HistoryControls {
  undo: () => void;
  redo: () => void;
  historyDepth: () => number;
  clearHistory: () => void;
}

type Cast<T, U> = T extends U ? T : U;

/**
 * Custom Zustand middleware: state-history snapshots for undo/redo.
 * Per Spec 2 Decision C — capped at 50 entries; per-session; cleared on canvas mount.
 */
export const withCanvasHistory =
  <T extends object>(
    config: StateCreator<T, [['zustand/immer', never]] | [], [], T>,
    options: CanvasHistoryOptions = {}
  ): StateCreator<T & HistoryControls, [], [], T & HistoryControls> =>
  (set, get, api) => {
    const capacity = options.capacity ?? 50;
    const past: T[] = [];
    const future: T[] = [];

    const trackedSet: typeof set = (partial, replace, ...rest) => {
      const before = { ...(get() as T) };
      // typed-set passthrough — push prior state, drain future
      past.push(before);
      while (past.length > capacity) past.shift();
      future.length = 0;
      // forward call to underlying set
      (set as unknown as Function).apply(null, [partial, replace, ...rest]);
    };

    const baseState = config(
      trackedSet as Cast<typeof set, typeof set>,
      get as () => T,
      api as never
    );

    const controls: HistoryControls = {
      undo: () => {
        const last = past.pop();
        if (!last) return;
        const current = { ...(get() as T) };
        future.push(current);
        // Restore without recording to history
        (set as unknown as Function).call(null, last, true);
      },
      redo: () => {
        const next = future.pop();
        if (!next) return;
        const current = { ...(get() as T) };
        past.push(current);
        (set as unknown as Function).call(null, next, true);
      },
      historyDepth: () => past.length,
      clearHistory: () => {
        past.length = 0;
        future.length = 0;
      },
    };

    return { ...(baseState as T), ...controls };
  };
```

- [ ] **Step 4: Run tests — verify all 5 pass**

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/canvasHistoryMiddleware.ts packages/stores/src/__tests__/canvasHistoryMiddleware.test.ts
git commit -m "feat(4a): canvas history middleware (undo/redo capped 50)"
```

### Task 4a.7: Wire canvasHistoryMiddleware into canvasStore

**Files:**

- Modify: `packages/stores/src/canvasStore.ts`
- Modify: `packages/stores/src/__tests__/canvasStore.test.ts` (add undo/redo tests)

- [ ] **Step 1: Write failing tests for store-level undo/redo**

```ts
// packages/stores/src/__tests__/canvasStore.test.ts (append to existing describe)
describe('canvasStore undo/redo', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      canonicalMap: { steps: [], arrows: [], assignments: {} },
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: 'v0',
    });
  });

  it('undo reverts placeChipOnStep', () => {
    useCanvasStore.getState().placeChipOnStep('col-1', 'step-1');
    expect(useCanvasStore.getState().canonicalMap.assignments['col-1']).toBe('step-1');
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().canonicalMap.assignments['col-1']).toBeUndefined();
  });

  it('redo replays after undo', () => {
    useCanvasStore.getState().placeChipOnStep('col-1', 'step-1');
    useCanvasStore.getState().undo();
    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().canonicalMap.assignments['col-1']).toBe('step-1');
  });
});
```

- [ ] **Step 2: Wire middleware into canvasStore**

In `packages/stores/src/canvasStore.ts`:

```ts
import { withCanvasHistory } from './canvasHistoryMiddleware';

// Update the create() chain to compose history middleware:
export const useCanvasStore = create<
  CanvasStoreState & {
    undo: () => void;
    redo: () => void;
    historyDepth: () => number;
    clearHistory: () => void;
  }
>()(
  devtools(
    withCanvasHistory(
      immer(set => ({
        // ... existing state and actions unchanged
      })),
      { capacity: 50 }
    ),
    { name: 'canvas-store' }
  )
);
```

- [ ] **Step 3: Run tests — verify all original tests + new undo/redo tests pass**

```bash
CI=1 pnpm --filter @variscout/stores test packages/stores/src/__tests__/canvasStore.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/stores/src/canvasStore.ts packages/stores/src/__tests__/canvasStore.test.ts
git commit -m "feat(4a): wire history middleware into canvasStore"
```

### Phase 4a wrap

After Task 4a.7 lands:

- [ ] Run full pre-merge gate

```bash
cd .worktrees/canvas-migration-phase-4a-state
bash scripts/pr-ready-check.sh
```

Expected: all green (engine layer; no UI surface introduced).

- [ ] Push + open PR

```bash
git push -u origin canvas-migration-phase-4a-state
gh pr create --base main --head canvas-migration-phase-4a-state \
  --title "feat: canvas action types + canvasStore + history middleware (PR4a)" \
  --body "First sub-PR of canvas migration PR4 (Spec 2 implementation). Engine layer only — no UI surface change. Sets up: @variscout/core/canvas action vocabulary, fifth domain Zustand canvasStore with Immer + devtools, undo/redo history middleware. PR4b consumes this surface."
```

- [ ] Final code-review (Opus); merge once approved.

---

## Phase 4b — Chip Placement UI

**Branch (after 4a merges):** `canvas-migration-phase-4b-chip-placement`
**Estimated:** 8 tasks
**PR title:** `feat: chip rail + drag-and-drop for column placement (PR4b)`

This phase ships the Mode 1 (chip placement) UX surface using `@dnd-kit/core`.

### Task 4b.1: Install `@dnd-kit/core` + supporting packages

**Files:**

- Modify: `packages/ui/package.json`
- Modify: `packages/hooks/package.json`

- [ ] **Step 1: Add dnd-kit packages**

```bash
cd .worktrees/canvas-migration-phase-4b-chip-placement
pnpm --filter @variscout/ui add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm --filter @variscout/hooks add @dnd-kit/core
```

- [ ] **Step 2: Verify install**

```bash
pnpm --filter @variscout/ui list @dnd-kit/core
```

- [ ] **Step 3: Commit**

```bash
git add packages/ui/package.json packages/hooks/package.json pnpm-lock.yaml
git commit -m "feat(4b): add @dnd-kit/core + sortable for canvas chip placement"
```

### Task 4b.2: `useChipDragAndDrop` hook

**Files:**

- Create: `packages/hooks/src/useChipDragAndDrop.ts`
- Create: `packages/hooks/src/__tests__/useChipDragAndDrop.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/hooks/src/__tests__/useChipDragAndDrop.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChipDragAndDrop } from '../useChipDragAndDrop';

describe('useChipDragAndDrop', () => {
  it('exposes onDragEnd callback', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep: vi.fn() }));
    expect(typeof result.current.handleDragEnd).toBe('function');
  });

  it('calls onPlace when chip is dropped on a step', () => {
    const onPlace = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep: vi.fn() }));
    act(() => {
      result.current.handleDragEnd({
        active: { id: 'chip-col-1' },
        over: { id: 'step-mold' },
      } as Parameters<typeof result.current.handleDragEnd>[0]);
    });
    expect(onPlace).toHaveBeenCalledWith('col-1', 'mold');
  });

  it('calls onCreateStep when chip is dropped on empty canvas', () => {
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace: vi.fn(), onCreateStep }));
    act(() => {
      result.current.handleDragEnd({
        active: { id: 'chip-col-1' },
        over: { id: 'canvas-empty' },
      } as Parameters<typeof result.current.handleDragEnd>[0]);
    });
    expect(onCreateStep).toHaveBeenCalledWith('col-1');
  });

  it('does nothing when dropped without a target', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));
    act(() => {
      result.current.handleDragEnd({ active: { id: 'chip-col-1' }, over: null } as Parameters<
        typeof result.current.handleDragEnd
      >[0]);
    });
    expect(onPlace).not.toHaveBeenCalled();
    expect(onCreateStep).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement hook**

```ts
// packages/hooks/src/useChipDragAndDrop.ts
import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';

export interface UseChipDragAndDropArgs {
  /** Called when a chip is dropped on an existing step. Receives chipId + stepId (without prefixes). */
  onPlace: (chipId: string, stepId: string) => void;
  /** Called when a chip is dropped on empty canvas space. Receives chipId. */
  onCreateStep: (chipId: string) => void;
}

const CHIP_PREFIX = 'chip-';
const STEP_PREFIX = 'step-';
const CANVAS_EMPTY_ID = 'canvas-empty';

export interface UseChipDragAndDropResult {
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useChipDragAndDrop({
  onPlace,
  onCreateStep,
}: UseChipDragAndDropArgs): UseChipDragAndDropResult {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      if (!activeId.startsWith(CHIP_PREFIX)) return;
      const chipId = activeId.slice(CHIP_PREFIX.length);

      const overId = event.over ? String(event.over.id) : null;
      if (!overId) return;

      if (overId.startsWith(STEP_PREFIX)) {
        onPlace(chipId, overId.slice(STEP_PREFIX.length));
      } else if (overId === CANVAS_EMPTY_ID) {
        onCreateStep(chipId);
      }
    },
    [onPlace, onCreateStep]
  );

  return { handleDragEnd };
}
```

- [ ] **Step 3: Run tests — pass**

- [ ] **Step 4: Commit**

```bash
git add packages/hooks/src/useChipDragAndDrop.ts packages/hooks/src/__tests__/useChipDragAndDrop.test.ts
git commit -m "feat(4b): useChipDragAndDrop hook"
```

### Task 4b.3: `useCanvasKeyboard` hook

**Files:**

- Create: `packages/hooks/src/useCanvasKeyboard.ts`
- Create: `packages/hooks/src/__tests__/useCanvasKeyboard.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/hooks/src/__tests__/useCanvasKeyboard.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasKeyboard } from '../useCanvasKeyboard';

describe('useCanvasKeyboard', () => {
  it('Cmd+Z fires onUndo', () => {
    const onUndo = vi.fn();
    renderHook(() => useCanvasKeyboard({ onUndo, onRedo: vi.fn(), onToggleMode: vi.fn() }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    expect(onUndo).toHaveBeenCalled();
  });

  it('Cmd+Shift+Z fires onRedo', () => {
    const onRedo = vi.fn();
    renderHook(() => useCanvasKeyboard({ onUndo: vi.fn(), onRedo, onToggleMode: vi.fn() }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true }));
    expect(onRedo).toHaveBeenCalled();
  });

  it('Ctrl+Z fires onUndo on non-Mac platforms', () => {
    const onUndo = vi.fn();
    renderHook(() => useCanvasKeyboard({ onUndo, onRedo: vi.fn(), onToggleMode: vi.fn() }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(onUndo).toHaveBeenCalled();
  });

  it('E toggles canvas mode', () => {
    const onToggleMode = vi.fn();
    renderHook(() => useCanvasKeyboard({ onUndo: vi.fn(), onRedo: vi.fn(), onToggleMode }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(onToggleMode).toHaveBeenCalled();
  });

  it('does not fire when typing in input field', () => {
    const onUndo = vi.fn();
    const onToggleMode = vi.fn();
    renderHook(() => useCanvasKeyboard({ onUndo, onRedo: vi.fn(), onToggleMode }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    expect(onUndo).not.toHaveBeenCalled();
    input.remove();
  });
});
```

- [ ] **Step 2: Implement hook**

```ts
// packages/hooks/src/useCanvasKeyboard.ts
import { useEffect } from 'react';

export interface UseCanvasKeyboardArgs {
  onUndo: () => void;
  onRedo: () => void;
  onToggleMode: () => void;
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

export function useCanvasKeyboard({ onUndo, onRedo, onToggleMode }: UseCanvasKeyboardArgs): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (!meta && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        onToggleMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onToggleMode]);
}
```

- [ ] **Step 3: Run tests + barrel export**

```bash
CI=1 pnpm --filter @variscout/hooks test
```

Update `packages/hooks/src/index.ts`:

```ts
export { useChipDragAndDrop, type UseChipDragAndDropArgs } from './useChipDragAndDrop';
export { useCanvasKeyboard, type UseCanvasKeyboardArgs } from './useCanvasKeyboard';
```

- [ ] **Step 4: Commit**

```bash
git add packages/hooks/src/useCanvasKeyboard.ts packages/hooks/src/__tests__/useCanvasKeyboard.test.ts packages/hooks/src/index.ts
git commit -m "feat(4b): useCanvasKeyboard hook (Cmd+Z, E, etc.)"
```

### Task 4b.4: `ChipRailItem` component

**Files:**

- Create: `packages/ui/src/components/ChipRail/ChipRailItem.tsx`
- Create: `packages/ui/src/components/ChipRail/__tests__/ChipRailItem.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// packages/ui/src/components/ChipRail/__tests__/ChipRailItem.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ChipRailItem } from '../ChipRailItem';

const renderInDnd = (ui: React.ReactNode) => render(<DndContext>{ui}</DndContext>);

describe('ChipRailItem', () => {
  it('renders column name', () => {
    renderInDnd(<ChipRailItem chipId="pressure_psi" label="pressure_psi" role="factor" />);
    expect(screen.getByText('pressure_psi')).toBeInTheDocument();
  });

  it('shows role badge', () => {
    renderInDnd(<ChipRailItem chipId="meta-shift" label="shift" role="metadata" />);
    expect(screen.getByText(/metadata/i)).toBeInTheDocument();
  });

  it('has aria-label describing the chip', () => {
    renderInDnd(<ChipRailItem chipId="pressure_psi" label="pressure_psi" role="factor" />);
    const chip = screen.getByRole('button', { name: /pressure_psi/i });
    expect(chip).toHaveAttribute('aria-label', expect.stringContaining('factor'));
  });
});
```

- [ ] **Step 2: Implement component**

```tsx
// packages/ui/src/components/ChipRail/ChipRailItem.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export type ChipRole = 'factor' | 'metadata';

export interface ChipRailItemProps {
  chipId: string;
  label: string;
  role: ChipRole;
}

const roleClasses: Record<ChipRole, string> = {
  factor: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  metadata: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
};

export const ChipRailItem: React.FC<ChipRailItemProps> = ({ chipId, label, role }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip-${chipId}`,
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      data-testid={`chip-rail-item-${chipId}`}
      aria-label={`${label} (${role}). Drag to step or press Enter to pick up.`}
      {...listeners}
      {...attributes}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing ${
        roleClasses[role]
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] uppercase opacity-70">{role}</span>
    </button>
  );
};
```

- [ ] **Step 3: Run test — verify pass**

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ChipRail/ChipRailItem.tsx packages/ui/src/components/ChipRail/__tests__/ChipRailItem.test.tsx
git commit -m "feat(4b): ChipRailItem draggable component"
```

### Task 4b.5: `ChipRail` container component

**Files:**

- Create: `packages/ui/src/components/ChipRail/ChipRail.tsx`
- Create: `packages/ui/src/components/ChipRail/index.ts`
- Create: `packages/ui/src/components/ChipRail/__tests__/ChipRail.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// packages/ui/src/components/ChipRail/__tests__/ChipRail.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ChipRail } from '../ChipRail';

const chips = [
  { chipId: 'pressure_psi', label: 'pressure_psi', role: 'factor' as const },
  { chipId: 'shift', label: 'shift', role: 'metadata' as const },
];

describe('ChipRail', () => {
  it('renders one item per chip', () => {
    render(
      <DndContext>
        <ChipRail chips={chips} />
      </DndContext>
    );
    expect(screen.getByTestId('chip-rail-item-pressure_psi')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-shift')).toBeInTheDocument();
  });

  it('renders empty state when no chips', () => {
    render(
      <DndContext>
        <ChipRail chips={[]} />
      </DndContext>
    );
    expect(screen.getByText(/all columns assigned/i)).toBeInTheDocument();
  });

  it('has accessible heading', () => {
    render(
      <DndContext>
        <ChipRail chips={chips} />
      </DndContext>
    );
    expect(screen.getByRole('heading', { name: /unassigned columns/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// packages/ui/src/components/ChipRail/ChipRail.tsx
import React from 'react';
import { ChipRailItem, type ChipRole } from './ChipRailItem';

export interface ChipRailEntry {
  chipId: string;
  label: string;
  role: ChipRole;
}

export interface ChipRailProps {
  chips: ChipRailEntry[];
  className?: string;
}

export const ChipRail: React.FC<ChipRailProps> = ({ chips, className }) => (
  <aside
    data-testid="chip-rail"
    className={`flex h-full w-56 flex-col border-r border-edge bg-surface-secondary p-3 ${
      className ?? ''
    }`}
  >
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
      Unassigned columns
    </h3>
    {chips.length === 0 ? (
      <p className="text-xs italic text-content-secondary">All columns assigned</p>
    ) : (
      <div className="flex flex-col gap-1.5">
        {chips.map(chip => (
          <ChipRailItem
            key={chip.chipId}
            chipId={chip.chipId}
            label={chip.label}
            role={chip.role}
          />
        ))}
      </div>
    )}
  </aside>
);
```

```ts
// packages/ui/src/components/ChipRail/index.ts
export { ChipRail, type ChipRailEntry, type ChipRailProps } from './ChipRail';
export { ChipRailItem, type ChipRailItemProps, type ChipRole } from './ChipRailItem';
```

- [ ] **Step 3: Test pass + barrel export**

Append to `packages/ui/src/index.ts`:

```ts
export { ChipRail, ChipRailItem } from './components/ChipRail';
export type {
  ChipRailEntry,
  ChipRailProps,
  ChipRailItemProps,
  ChipRole,
} from './components/ChipRail';
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ChipRail packages/ui/src/index.ts
git commit -m "feat(4b): ChipRail container component"
```

### Task 4b.6: `AutoStepCreatePrompt` component

**Files:**

- Create: `packages/ui/src/components/AutoStepCreatePrompt/index.tsx`
- Create: `packages/ui/src/components/AutoStepCreatePrompt/__tests__/AutoStepCreatePrompt.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// packages/ui/src/components/AutoStepCreatePrompt/__tests__/AutoStepCreatePrompt.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoStepCreatePrompt } from '..';

describe('AutoStepCreatePrompt', () => {
  it('renders proposed step name', () => {
    render(
      <AutoStepCreatePrompt
        chipLabel="pressure_psi"
        position={{ x: 100, y: 200 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/Create step for/i)).toBeInTheDocument();
    expect(screen.getByText(/pressure_psi/i)).toBeInTheDocument();
  });

  it('Confirm fires onConfirm', () => {
    const onConfirm = vi.fn();
    render(
      <AutoStepCreatePrompt
        chipLabel="pressure_psi"
        position={{ x: 100, y: 200 }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create step/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Esc dismisses', () => {
    const onCancel = vi.fn();
    render(
      <AutoStepCreatePrompt
        chipLabel="pressure_psi"
        position={{ x: 100, y: 200 }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// packages/ui/src/components/AutoStepCreatePrompt/index.tsx
import React, { useEffect } from 'react';

export interface AutoStepCreatePromptProps {
  chipLabel: string;
  position: { x: number; y: number };
  onConfirm: () => void;
  onCancel: () => void;
}

export const AutoStepCreatePrompt: React.FC<AutoStepCreatePromptProps> = ({
  chipLabel,
  position,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      data-testid="auto-step-create-prompt"
      role="dialog"
      aria-label={`Create step for ${chipLabel}?`}
      className="absolute z-50 rounded-md border border-edge bg-surface px-3 py-2 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <p className="mb-2 text-sm">
        Create step for <code className="rounded bg-surface-tertiary px-1">{chipLabel}</code>?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
        >
          Create step
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-surface-tertiary px-2 py-1 text-xs hover:bg-surface-elevated"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Test pass + barrel export**

Append to `packages/ui/src/index.ts`:

```ts
export {
  AutoStepCreatePrompt,
  type AutoStepCreatePromptProps,
} from './components/AutoStepCreatePrompt';
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/AutoStepCreatePrompt packages/ui/src/index.ts
git commit -m "feat(4b): AutoStepCreatePrompt component"
```

### Task 4b.7: Wire chip-placement into Canvas

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`

- [ ] **Step 1: Write integration test**

```tsx
// packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx (extend)
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas } from '../index';

describe('Canvas with chip placement', () => {
  it('renders ChipRail when chips array is non-empty and mode is author', () => {
    render(
      <Canvas
        mode="author"
        chips={[{ chipId: 'col-1', label: 'pressure_psi', role: 'factor' }]}
        canonicalMap={{ steps: [], arrows: [], assignments: {} }}
      />
    );
    expect(screen.getByTestId('chip-rail')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-col-1')).toBeInTheDocument();
  });

  it('hides ChipRail in read mode', () => {
    render(
      <Canvas
        mode="read"
        chips={[{ chipId: 'col-1', label: 'pressure_psi', role: 'factor' }]}
        canonicalMap={{ steps: [], arrows: [], assignments: {} }}
      />
    );
    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Extend Canvas component**

In `packages/ui/src/components/Canvas/index.tsx`, add the ChipRail mount when `mode === 'author'`. Wrap children in `DndContext`. Wire `useChipDragAndDrop` and `canvasStore` actions. Reference Spec 2 §8 for the component structure.

- [ ] **Step 3: Tests pass; build clean**

```bash
CI=1 pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui build
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/Canvas
git commit -m "feat(4b): mount ChipRail + DndContext in Canvas"
```

### Task 4b.8: Wire Canvas + canvasStore in PWA + Azure FrameView

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/FrameView.test.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`

- [ ] **Step 1: PWA FrameView integration**

PWA FrameView uses `CanvasWorkspace` (PR3 of canvas migration). Extend FrameView to (a) compute `chips` array from `detectColumns()` output minus already-assigned columns, (b) wire `canvasStore` actions to `Canvas` props, (c) initialize `canvasStore` from session hub on mount.

```tsx
// Pseudocode:
const chips = useMemo(
  () => deriveUnassignedChips(detectedColumns, assignments),
  [detectedColumns, assignments]
);
const placeChip = useCanvasStore(s => s.placeChipOnStep);
// Mount Canvas with chips + canonicalMap + actions
```

- [ ] **Step 2: Azure FrameView integration (mirror)**

- [ ] **Step 3: Run tests + build**

```bash
CI=1 pnpm --filter @variscout/pwa test
CI=1 pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa build
pnpm --filter @variscout/azure-app build
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa apps/azure
git commit -m "feat(4b): wire chip placement in PWA + Azure FrameView"
```

### Phase 4b wrap

- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Push + open PR `canvas-migration-phase-4b-chip-placement`
- [ ] Final code-review (Opus); merge

---

## Phase 4c — Structural Authoring + Undo + Accessibility

**Branch (after 4b merges):** `canvas-migration-phase-4c-structural`
**Estimated:** 9 tasks
**PR title:** `feat: structural authoring + mode toggle + undo + a11y (PR4c)`

This phase completes Spec 2 — Mode 2 (structural authoring), B4 mode toggle, C1 undo bindings, H1–H6 accessibility constraints.

### Task 4c.1: `StepCard` extension (drop targets, anchor handles, multi-select)

**Files:**

- Modify: existing step-card component (likely in `packages/ui/src/components/Canvas/internal/` or via `ProcessMapBase` per PR2 absorption)
- Modify: corresponding test file

The step card lives inside the absorbed `ProcessMapBase` (now `Canvas/internal/ProcessMapBase.tsx` per PR2). Extend it to:

1. Accept `onChipDrop?: (stepId: string) => void` for drop-target highlighting via `useDroppable({ id: 'step-' + stepId })`
2. Render anchor handles on hover (small `+` icons on each edge for arrow start)
3. Add `aria-label` per H3 ("Step Mold, contains 3 columns: pressure, temperature, humidity")
4. Selectable with `aria-selected`; click toggles selection in author mode for sub-step grouping

Detailed steps follow the same TDD pattern: failing test → impl → pass → commit.

### Task 4c.2: `StepArrow` SVG renderer

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/StepArrow.tsx`
- Create: corresponding test

Render an SVG path from one step to another. Hover reveals a small "✕" to disconnect. Click opens future arrow detail (Spec 4 territory; for V1, no-op or shows the arrow's id in a tooltip).

### Task 4c.3: `StructuralToolbar` component

**Files:**

- Create: `packages/ui/src/components/StructuralToolbar/index.tsx`
- Create: tests

Toolbar with buttons: Add step / Group selection / Branch / Join / Mode toggle (passes through to `CanvasModeToggle`). Visible in author mode only.

### Task 4c.4: `CanvasModeToggle` component

**Files:**

- Create: `packages/ui/src/components/CanvasModeToggle/index.tsx`
- Create: tests

Padlock icon button. `aria-pressed` reflects current mode. `aria-live` region announces transitions. Click + `E` keyboard shortcut both toggle.

### Task 4c.5: `SubStepGrouper` component

**Files:**

- Create: `packages/ui/src/components/SubStepGrouper/index.tsx`
- Create: tests

Multi-select halo + contextual menu ("Group into sub-step", "Ungroup"). Triggered by Cmd+click on multiple steps; affordance appears at selection centroid.

### Task 4c.6: Canvas integration — wire all structural authoring

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: tests

Mount `StructuralToolbar` and `CanvasModeToggle` in canvas chrome. Wire `useCanvasKeyboard` for Cmd+Z / Cmd+Shift+Z / E. Connect store actions to UI affordances.

### Task 4c.7: Mode-toggle visibility logic

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`

Implement B4 visibility rules:

- Default mode by context: `assignmentsComplete && stepsAuthored ? 'read' : 'author'`
- Read mode hides ChipRail + StructuralToolbar + spec-edit `[✎]` icons
- Author mode shows everything
- Mode is session-scoped (stored in `useSessionCanvasFilters` or similar; resets on reload)

### Task 4c.8: PWA E2E — keyboard accessibility

**Files:**

- Create: `apps/pwa/e2e/canvas-keyboard.e2e.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('canvas keyboard chip placement (PWA)', async ({ page }) => {
  await page.goto('/');
  // Paste sample → land on FrameView with chip rail
  // Tab to first chip → Enter → arrow keys to step → Enter → assigned
  // Cmd+Z → unassigned
});

test('mode toggle keyboard shortcut (E)', async ({ page }) => {
  // Land on canvas → press E → assert chip rail collapses → press E again → expands
});
```

### Task 4c.9: Azure E2E mirror

**Files:**

- Create: `apps/azure/e2e/canvas-keyboard.spec.ts`

Mirror PWA E2E in Azure environment.

### Phase 4c wrap

- [ ] All E2E green
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Manual `claude --chrome` walk both apps:
  - Mode B paste → Stage 1–3 → land on canvas → place chips → add step → connect arrows → undo → redo → toggle to read mode → click step → drill-down opens (existing flow from Spec 1)
  - Mode A re-open mature hub → starts in read mode → toggle to author → refine
- [ ] Push + open PR `canvas-migration-phase-4c-structural`
- [ ] Final code-review (Opus); merge

---

## Verification (acceptance criteria — combined PR4)

Mirrors Spec 2 §9 verification list. After all three sub-PRs merge:

- [ ] **Mode 1 chip placement:** drag-from-rail to step / empty canvas / reorder / unassign all work
- [ ] **Mode 2 structural authoring:** add step / connect arrows / multi-select-group / branch / join / inline rename / spec edit all work
- [ ] **Mode toggle:** default by context; toggle via button or `E`; affordances cross-fade; ARIA announcements
- [ ] **Undo/redo:** Cmd+Z + Cmd+Shift+Z; bounded 50; view-state excluded
- [ ] **State (D):** all action functions; Zustand devtools shows action names; `canonicalMapVersion` increments; persists via existing `saveProcessHub` / `hubRepository.saveHub`
- [ ] **Accessibility (H):** Tab traversal; keyboard chip placement; ARIA labels; color-blindness check
- [ ] **CRDT-readiness (G):** plain JSON state; discriminated-union actions; no shared mutable refs
- [ ] **No σ-based suggestions** for LSL/USL anywhere
- [ ] **ADR-073 structural absence preserved**
- [ ] All three sub-PRs merged in sequence to main
- [ ] `bash scripts/pr-ready-check.sh` green per sub-PR
- [ ] Final code-reviewer (Opus) approves each sub-PR

## Risk register

Per Spec 2 §10. Key carry-forwards:

- **`@dnd-kit/core` bundle weight:** verified <5 KB gzip; if larger, reconsider in 4b spec-reviewer pass
- **Mobile drag-and-drop UX:** dnd-kit handles long-press; verify in `--chrome` walk on mobile sizes
- **Chip rail performance at 50+ chips:** virtualize if observed; not blocking V1
- **Mode toggle hidden during read mode:** padlock icon stays visible; only state changes
- **Codex/parallel-agent worktree collisions:** each sub-PR gets its own `.worktrees/<branch>/` checkout per `feedback_one_worktree_per_agent`

## Out of scope (carried forward)

Per Spec 2 §11. Card content + drill-down + lenses → Spec 3 (PR5). Canvas overlays → Spec 4 (PR6). PWA persistence schema → Spec 5 (PR7). AI map drafting → V2. CRDT multiplayer → V2. Canvas virtualization → deferred.

---

**Execution choice:**

After this plan is approved:

1. **Subagent-Driven (recommended)** — Fresh subagent per task in dedicated `.worktrees/canvas-migration-phase-4a-state/` (etc.) per phase. Two-stage review (spec compliance → code quality) per task. Sonnet workhorse; Opus for final-branch review. Per `superpowers:subagent-driven-development`.

2. **Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`. Slower; more risk of collision with parallel agents. Only viable if no other agent (Codex etc.) is operating concurrently.

Subagent-driven is the default per `feedback_subagent_driven_default` and is appropriate for the ~24-task scope spread across 3 sub-PRs.
