# FSJ-7 Capture Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FSJ-7 capture grammar as one shared draft card, starting with PR 7a: shared card model/UI, PWA I-Chart brush capture, and Wall `BrushToFindingFlow` convergence.

**Architecture:** The card is shared UI state, not core store state. Gesture builders produce a `CaptureDraft`; app callbacks save the draft by optionally minting a derived factor, then writing a normal `Finding.context.activeFilters` snapshot. Wall factor edges continue to derive from existing `activeFilters` machinery.

**Tech Stack:** React, TypeScript, Zustand stores, Vitest/Testing Library, pnpm/turbo.

---

## Sequencer

FSJ-7 exceeds the 6-8 task PR cap, so ship sequential PRs:

1. **PR 7a:** shared `CaptureDraft` + `CaptureCard`, PWA I-Chart brush card, Wall `BrushToFindingFlow` convergence, brush derived factor save, empty-state copy.
2. **PR 7b:** visible point capture, probability value-band capture, inflection `Factor only`, I-Chart saved bands.
3. **PR 7c:** engine signal chip, PWA/Azure mobile bottom sheet, Azure mirror.

This plan implements PR 7a only. After PR 7a merges, write a new sub-plan for PR 7b from the then-current `origin/main`.

## Grounded Decisions

- `FindingSource` already supports `ichart.brushedRange` and `probability`; do not add a new source variant for PR 7a.
- Do not widen `Finding.context.activeFilters`; brush saves a derived factor name as a normal key, for example `{ "obs 32-58": ["in"] }`.
- Evidence contrast defaults to selected-window mean/n vs complement mean/n; include Cpk only when specs are present.
- Factor-only in PR 7a creates the derived factor column and selects it as the boxplot/pareto factor; it does not create a Finding.
- Capture in PR 7a creates the factor first, then creates the Finding with the new factor filter.
- Hardcoded English is accepted under the FSJ precedent; log i18n catalog sweep only if new copy lands outside existing catalog patterns.

## Task 1: Capture Draft Model

**Files:**

- Create: `packages/hooks/src/captureDraft.ts`
- Create: `packages/hooks/src/__tests__/captureDraft.test.ts`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Write failing tests**

Add tests covering brush draft construction and save payload conversion:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildBrushCaptureDraft,
  buildBrushDerivedColumn,
  applyDerivedFactorToFilters,
} from '../captureDraft';

describe('captureDraft', () => {
  const rows = [
    { Cycle_Time: 30, Step: 'Prep' },
    { Cycle_Time: 40, Step: 'Fill' },
    { Cycle_Time: 50, Step: 'Fill' },
    { Cycle_Time: 60, Step: 'Pack' },
  ];

  it('builds an I-Chart brush draft with factor-expressed condition and evidence contrast', () => {
    const draft = buildBrushCaptureDraft({
      rows,
      outcome: 'Cycle_Time',
      selectedIndices: new Set([1, 2]),
      activeFilters: { Step: ['Fill'] },
    });

    expect(draft.entryKind).toBe('brush');
    expect(draft.source.chart).toBe('ichart');
    expect(draft.source.brushedRange).toEqual({ startIdx: 1, endIdx: 2 });
    expect(draft.proposedFactorName).toBe('obs 2-3');
    expect(draft.conditionLabel).toBe('Step = Fill x obs 2-3');
    expect(draft.evidenceLabel).toBe('mean 45 vs 45 · n=2');
  });

  it('applies a derived brush factor as an ordinary activeFilters key', () => {
    expect(applyDerivedFactorToFilters({ Step: ['Fill'] }, 'obs 2-3')).toEqual({
      Step: ['Fill'],
      'obs 2-3': ['in'],
    });
  });

  it('creates in/out values for selected rows only', () => {
    const nextRows = buildBrushDerivedColumn(rows, new Set([1, 2]), 'obs 2-3');
    expect(nextRows.map(row => row['obs 2-3'])).toEqual(['out', 'in', 'in', 'out']);
  });
});
```

Run: `pnpm --filter @variscout/hooks test src/__tests__/captureDraft.test.ts`

Expected: fail because `captureDraft` does not exist.

- [ ] **Step 2: Implement minimal model**

Create `captureDraft.ts` with:

```ts
import type { DataRow, FindingSource, SpecLimits } from '@variscout/core';
import { calculateStats } from '@variscout/core';
import { usePreferencesStore } from '@variscout/stores';

export type CaptureEntryKind =
  | 'pin'
  | 'brush'
  | 'point'
  | 'probability-band'
  | 'engine-signal'
  | 'inflection-binning';

export interface CaptureDraft {
  entryKind: CaptureEntryKind;
  source: FindingSource;
  activeFilters: Record<string, (string | number)[]>;
  proposedFactorName?: string;
  conditionLabel: string;
  evidenceLabel: string;
  note: string;
}

export interface BrushCaptureDraftInput {
  rows: DataRow[];
  outcome: string;
  selectedIndices: Set<number>;
  activeFilters: Record<string, (string | number)[]>;
  specs?: SpecLimits;
}
```

Implement `buildBrushCaptureDraft`, `buildBrushDerivedColumn`, and `applyDerivedFactorToFilters`. Use 1-based row labels for the default name: selected indices `1,2` become `obs 2-3`.

- [ ] **Step 3: Export and verify**

Export from `packages/hooks/src/index.ts`.

Run: `pnpm --filter @variscout/hooks test src/__tests__/captureDraft.test.ts`

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/hooks/src/captureDraft.ts packages/hooks/src/__tests__/captureDraft.test.ts packages/hooks/src/index.ts
git rev-parse --abbrev-ref HEAD
git commit -m "feat(fsj-7): add capture draft model"
```

Expected branch: `feat/fsj-7-capture-card`.

## Task 2: Shared Capture Card UI

**Files:**

- Create: `packages/ui/src/components/CaptureCard/CaptureCard.tsx`
- Create: `packages/ui/src/components/CaptureCard/__tests__/CaptureCard.test.tsx`
- Create: `packages/ui/src/components/CaptureCard/index.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write failing component tests**

Cover rendering, note/factor editing, Capture, Factor only, Escape, and click-away.

Run: `pnpm --filter @variscout/ui test src/components/CaptureCard/__tests__/CaptureCard.test.tsx`

Expected: fail because the component does not exist.

- [ ] **Step 2: Implement component**

Render a fixed desktop card by default and `bottomSheet` layout when `variant="bottom-sheet"`. Props:

```ts
export interface CaptureCardProps {
  draft: CaptureDraft;
  variant?: 'popover' | 'bottom-sheet';
  onDraftChange: (patch: Partial<Pick<CaptureDraft, 'note' | 'proposedFactorName'>>) => void;
  onCapture: () => void;
  onFactorOnly?: () => void;
  onCancel: () => void;
}
```

Use buttons labelled `Capture`, `Factor only`, and `Cancel`. Factor-only is shown only when `draft.proposedFactorName` is present.

- [ ] **Step 3: Export and verify**

Run:

```bash
pnpm --filter @variscout/ui test src/components/CaptureCard/__tests__/CaptureCard.test.tsx
pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx
```

Expected: new tests pass; existing Wall tests still pass before convergence.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/ui/src/components/CaptureCard packages/ui/src/index.ts
git rev-parse --abbrev-ref HEAD
git commit -m "feat(fsj-7): add shared capture card"
```

## Task 3: PWA I-Chart Brush Save

**Files:**

- Modify: `apps/pwa/src/components/Dashboard.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Test: `apps/pwa/src/components/__tests__/Dashboard.test.tsx`
- Test: `apps/pwa/src/__tests__/App.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests proving an I-Chart brush opens the shared card and `Capture` creates a Finding whose `activeFilters` includes the derived factor key. Add a second test proving `Factor only` mutates rows/factors but does not create a Finding.

Run: `pnpm --filter @variscout/pwa test src/components/__tests__/Dashboard.test.tsx src/__tests__/App.test.tsx`

Expected: fail because Dashboard does not render the capture card.

- [ ] **Step 2: Implement PWA card state and save callbacks**

In `Dashboard.tsx`, replace the brush selection `SelectionPanel` create-factor path for I-Chart selection with `CaptureCard`. Preserve `CreateFactorModal` for non-FSJ paths only if still reachable. Add props for:

```ts
onCaptureDraft?: (draft: CaptureDraft) => void;
onFactorOnlyDraft?: (draft: CaptureDraft) => void;
```

In `App.tsx`, implement the save callbacks by:

1. Building rows with `buildBrushDerivedColumn`.
2. Appending the derived factor to `projectStore.factors`.
3. Recomputing context through `buildFindingContext` with `applyDerivedFactorToFilters`.
4. Calling `useAnalyzeStore.getState().addFinding(note, context, draft.source)`.

- [ ] **Step 3: Verify targeted tests**

Run:

```bash
pnpm --filter @variscout/hooks test src/__tests__/captureDraft.test.ts
pnpm --filter @variscout/ui test src/components/CaptureCard/__tests__/CaptureCard.test.tsx
pnpm --filter @variscout/pwa test src/components/__tests__/Dashboard.test.tsx src/__tests__/App.test.tsx
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add apps/pwa/src/components/Dashboard.tsx apps/pwa/src/App.tsx apps/pwa/src/components/__tests__/Dashboard.test.tsx apps/pwa/src/__tests__/App.test.tsx
git rev-parse --abbrev-ref HEAD
git commit -m "feat(fsj-7): route pwa brush capture through card"
```

## Task 4: Wall BrushToFindingFlow Convergence

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/BrushToFindingFlow.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx`

- [ ] **Step 1: Write failing tests**

Update existing tests so they expect the shared card labels `Capture` and `Factor only`, editable factor name, and a saved finding context containing the derived factor key. Confirm Escape still cancels and `connectFindingToHub` still runs on Capture.

Run: `pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx`

Expected: fail because the old inline dialog still renders `Pin`.

- [ ] **Step 2: Replace local dialog with CaptureCard**

Use `buildBrushCaptureDraft` for range gestures. On Capture, call `addFinding(draft.note, context, source)` with derived factor in `context.activeFilters`, then `connectFindingToHub`. On Factor-only in the Wall mini-chart, close without saving because the Wall has no project raw-data writer; keep the button hidden if no writer is available.

- [ ] **Step 3: Verify**

Run:

```bash
pnpm --filter @variscout/ui test src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx
pnpm --filter @variscout/ui test src/components/CaptureCard/__tests__/CaptureCard.test.tsx
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/ui/src/components/AnalyzeWall/BrushToFindingFlow.tsx packages/ui/src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx
git rev-parse --abbrev-ref HEAD
git commit -m "feat(fsj-7): converge wall brush capture"
```

## Task 5: Empty State Copy and PR 7a Verification

**Files:**

- Modify likely: `packages/ui/src/components/FindingsPanel/FindingsPanelBase.tsx`
- Test likely: `packages/ui/src/components/FindingsPanel/__tests__/FindingsPanelBase.test.tsx`

- [ ] **Step 1: Write failing copy test**

Find the current Findings empty state and update its test to expect:

```text
Brush a range, pin your filters, or capture a detected signal.
```

Run the relevant UI test file.

Expected: fail with the old copy.

- [ ] **Step 2: Update copy**

Replace only the empty-state instruction text. Do not change pin gating.

- [ ] **Step 3: Verify PR 7a**

Run:

```bash
pnpm --filter @variscout/hooks test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
bash scripts/pr-ready-check.sh
```

Expected: all pass. Existing React `act(...)` warnings from baseline may remain; no new failures.

- [ ] **Step 4: Commit and PR**

Run:

```bash
git add packages/ui/src/components/FindingsPanel packages/ui/src/components/FindingsPanel/__tests__
git rev-parse --abbrev-ref HEAD
git commit -m "feat(fsj-7): teach capture grammar in findings empty state"
git push -u origin feat/fsj-7-capture-card
```

Create PR with grounding corrections, task list, test counts, OWNER-CALL-PENDING evidence default, and live-verification checklist. Merge with:

```bash
gh pr merge --merge --delete-branch
```
