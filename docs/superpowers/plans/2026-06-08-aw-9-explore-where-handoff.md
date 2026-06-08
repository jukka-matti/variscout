---
tier: living
purpose: build
title: 'AW-9 Explore WHERE handoff'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, explore, categorical-filters, handoff]
related:
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
---

# AW-9 Explore WHERE Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Analyze→Explore chip navigation so categorical `ConditionLeaf` WHERE predicates become Explore chart filters in both Azure and PWA.

**Architecture:** Add an inverse categorical predicate bridge in `@variscout/core`, then make the shared `navigateToExploreForChip` helper write both `analysisScopeStore.categoricalFilters` and `projectStore.filters` when a target carries predicates. App call-sites pass the active Wall scope's predicates for Analyze Wall jumps only; Process-tab chip targets keep their current shape and behavior.

**Tech Stack:** React, TypeScript, Zustand stores, Vitest/RTL, shared `@variscout/core` finding conditions, shared `@variscout/ui` Canvas navigation helper.

---

## File Map

- Modify `packages/core/src/findings/hypothesisCondition.ts`: add `conditionLeavesToCategoricalFilters`.
- Modify `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`: cover inverse conversion, `in` grouping, numeric-range deferral, duplicate suppression.
- Modify `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`: add optional `predicates?: ReadonlyArray<ConditionLeaf>` and optional origin ids to all target kinds; write categorical filters additively when present.
- Modify `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`: assert helper writes `analysisScopeStore` and `projectStore.filters`, drops numeric predicates, and preserves existing Process-chip behavior when predicates are omitted.
- Modify `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`: pass `activeScope?.predicates` from Wall `handleExploreFactor`.
- Modify `apps/pwa/src/components/views/AnalyzeView.tsx`: pass `activeScope?.predicates` from Wall `handleExploreFactor`.
- Modify `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx`: render-through test for categorical WHERE handoff.
- Modify `apps/pwa/src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx`: same PWA seam.

## Task 1: Core Predicate-To-Filter Bridge

**Files:**

- Modify: `packages/core/src/findings/hypothesisCondition.ts`
- Modify: `packages/core/src/findings/__tests__/hypothesisCondition.test.ts`

- [ ] **Step 1: Write failing core tests**

Add tests near `categoricalFiltersToActiveFilters`:

```ts
describe('conditionLeavesToCategoricalFilters', () => {
  it('maps eq and in leaves to categorical filter chips grouped by column', () => {
    const result = conditionLeavesToCategoricalFilters([
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Line', op: 'in', value: ['L1', 'L2'] },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Weekend' },
    ]);
    expect(result).toEqual([
      { column: 'Shift', values: ['Night', 'Weekend'] },
      { column: 'Line', values: ['L1', 'L2'] },
    ]);
  });

  it('drops range and inequality predicates because project filters are categorical membership only', () => {
    const result = conditionLeavesToCategoricalFilters([
      { kind: 'leaf', column: 'Y', op: 'between', value: [10, 20] },
      { kind: 'leaf', column: 'Temp', op: 'gt', value: 80 },
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
    ]);
    expect(result).toEqual([{ column: 'Shift', values: ['Night'] }]);
  });

  it('deduplicates repeated categorical values per column', () => {
    const result = conditionLeavesToCategoricalFilters([
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'Shift', op: 'in', value: ['Night', 'Day'] },
    ]);
    expect(result).toEqual([{ column: 'Shift', values: ['Night', 'Day'] }]);
  });
});
```

Update the import list in the test:

```ts
import {
  // existing imports...
  conditionLeavesToCategoricalFilters,
} from '../hypothesisCondition';
```

- [ ] **Step 2: Run the failing core test**

Run:

```bash
pnpm --filter @variscout/core test -- src/findings/__tests__/hypothesisCondition.test.ts
```

Expected: FAIL because `conditionLeavesToCategoricalFilters` is not exported.

- [ ] **Step 3: Implement the bridge**

Add after `buildConditionFromCategoricalFilters`:

```ts
export function conditionLeavesToCategoricalFilters(
  predicates: ReadonlyArray<ConditionLeaf>
): CategoricalFilterInput[] {
  const byColumn = new Map<string, (string | number)[]>();

  const addValues = (column: string, values: ReadonlyArray<string | number>): void => {
    const existing = byColumn.get(column) ?? [];
    for (const value of values) {
      if (!existing.includes(value)) existing.push(value);
    }
    byColumn.set(column, existing);
  };

  for (const leaf of predicates) {
    if (leaf.op === 'eq' && (typeof leaf.value === 'string' || typeof leaf.value === 'number')) {
      addValues(leaf.column, [leaf.value]);
    } else if (leaf.op === 'in' && Array.isArray(leaf.value)) {
      const values = leaf.value.filter(
        (value): value is string | number => typeof value === 'string' || typeof value === 'number'
      );
      addValues(leaf.column, values);
    }
  }

  return [...byColumn.entries()].map(([column, values]) => ({ column, values }));
}
```

- [ ] **Step 4: Run the core test**

Run:

```bash
pnpm --filter @variscout/core test -- src/findings/__tests__/hypothesisCondition.test.ts
```

Expected: PASS.

## Task 2: Shared Navigation Helper Writes WHERE Filters

**Files:**

- Modify: `packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts`
- Modify: `packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts`

- [ ] **Step 1: Write failing helper tests**

Add tests:

```ts
it('factor target with predicates writes categorical scope and project filters', () => {
  const onNavigate = vi.fn();
  navigateToExploreForChip(
    {
      kind: 'factor',
      columnName: 'Shift',
      outcomeColumn: 'Fill_Weight_g',
      predicates: [
        { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
        { kind: 'leaf', column: 'Line', op: 'in', value: ['L2', 'L3'] },
      ],
      hypothesisId: 'h-shift',
    },
    onNavigate
  );

  expect(useAnalysisScopeStore.getState().yColumn).toBe('Fill_Weight_g');
  expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Shift');
  expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
    { column: 'Shift', values: ['Night'] },
    { column: 'Line', values: ['L2', 'L3'] },
  ]);
  expect(useProjectStore.getState().filters).toEqual({ Shift: ['Night'], Line: ['L2', 'L3'] });
  expect(onNavigate).toHaveBeenCalledTimes(1);
});

it('factor target with predicates drops numeric range predicates from project filters', () => {
  const onNavigate = vi.fn();
  navigateToExploreForChip(
    {
      kind: 'factor',
      columnName: 'Shift',
      predicates: [
        { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
        { kind: 'leaf', column: 'Fill_Weight_g', op: 'between', value: [11.9, 12.1] },
      ],
    },
    onNavigate
  );

  expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
    { column: 'Shift', values: ['Night'] },
  ]);
  expect(useProjectStore.getState().filters).toEqual({ Shift: ['Night'] });
});

it('targets without predicates preserve existing categorical scope and project filters', () => {
  useAnalysisScopeStore.getState().setCategoricalValues('Existing', ['A']);
  useProjectStore.getState().setFilters({ Existing: ['A'] });
  const onNavigate = vi.fn();

  navigateToExploreForChip({ kind: 'factor', columnName: 'Vessel' }, onNavigate);

  expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
    { column: 'Existing', values: ['A'] },
  ]);
  expect(useProjectStore.getState().filters).toEqual({ Existing: ['A'] });
});
```

Import `useProjectStore` in the test and reset it in `beforeEach`:

```ts
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  useProjectStore,
  getProjectInitialState,
} from '@variscout/stores';

beforeEach(() => {
  useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  useProjectStore.setState(getProjectInitialState());
});
```

- [ ] **Step 2: Run the failing helper test**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts
```

Expected: FAIL because target predicates are ignored.

- [ ] **Step 3: Implement additive target fields and filter writes**

Update helper imports and target type:

```ts
import {
  categoricalFiltersToActiveFilters,
  conditionLeavesToCategoricalFilters,
  type ConditionLeaf,
} from '@variscout/core/findings';
import { useAnalysisScopeStore, useProjectStore } from '@variscout/stores';

interface ChipNavigationContext {
  predicates?: ReadonlyArray<ConditionLeaf>;
  findingId?: string;
  hypothesisId?: string;
}

export type ChipNavigationTarget =
  | ({ kind: 'outcome'; columnName: string; stepId?: string } & ChipNavigationContext)
  | ({
      kind: 'factor';
      columnName: string;
      stepId?: string;
      outcomeColumn?: string;
    } & ChipNavigationContext)
  | ({ kind: 'step'; stepId: string } & ChipNavigationContext);
```

Before the `switch`, add:

```ts
if (target.predicates !== undefined) {
  const categoricalFilters = conditionLeavesToCategoricalFilters(target.predicates);
  scope.clearScope();
  for (const filter of categoricalFilters) {
    scope.setCategoricalValues(filter.column, filter.values);
  }
  useProjectStore.getState().setFilters(categoricalFiltersToActiveFilters(categoricalFilters));
}
```

Do not read `findingId` or `hypothesisId` yet; they are origin metadata for downstream callers and must not alter behavior in AW-9.

- [ ] **Step 4: Run the helper test**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts
```

Expected: PASS.

## Task 3: Wire Analyze Wall Call-Sites In Both Apps

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx`

- [ ] **Step 1: Write failing render-through seam assertions**

In each Explore jump seam test, update the wired harness callback:

```ts
navigateToExploreForChip(
  {
    kind: 'factor',
    columnName: factor,
    outcomeColumn: 'Y',
    predicates: [
      { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
      { kind: 'leaf', column: 'LINE', op: 'in', value: ['L2', 'L3'] },
    ],
    hypothesisId: hub.id,
  },
  () => usePanelsStore.getState().showExplore()
);
```

Then assert:

```ts
expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
  { column: 'SHIFT', values: ['Night'] },
  { column: 'LINE', values: ['L2', 'L3'] },
]);
expect(useProjectStore.getState().filters).toEqual({ SHIFT: ['Night'], LINE: ['L2', 'L3'] });
```

Import and reset `useProjectStore` / `getProjectInitialState` in each test.

- [ ] **Step 2: Run failing app seam tests**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx
```

Expected: FAIL until the helper is implemented; after Task 2, PASS for direct helper use.

- [ ] **Step 3: Pass active scope predicates from real app call-sites**

In `AnalyzeWorkspace.tsx`, change `handleExploreFactor`:

```ts
const handleExploreFactor = useCallback(
  (factor: string) => {
    navigateToExploreForChip(
      {
        kind: 'factor',
        columnName: factor,
        outcomeColumn: outcome ?? undefined,
        predicates: activeScope?.predicates,
        hypothesisId: selectedWallObject?.kind === 'cause' ? selectedWallObject.id : undefined,
      },
      () => usePanelsStore.getState().showExplore()
    );
  },
  [activeScope, outcome, selectedWallObject]
);
```

In `AnalyzeView.tsx`, apply the same shape:

```ts
const handleExploreFactor = useCallback(
  (factor: string) => {
    navigateToExploreForChip(
      {
        kind: 'factor',
        columnName: factor,
        outcomeColumn: outcome ?? undefined,
        predicates: activeScope?.predicates,
        hypothesisId: focusedWallEntityId ?? undefined,
      },
      () => usePanelsStore.getState().showExplore()
    );
  },
  [activeScope, focusedWallEntityId, outcome]
);
```

If either app does not have the selected/focused id available in that scope, omit the origin id rather than threading new state. `predicates` is the load-bearing field.

- [ ] **Step 4: Run app seam tests**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx
```

Expected: PASS.

## Task 4: Focused Validation And Commit

**Files:**

- All AW-9 files above.

- [ ] **Step 1: Run focused tests together**

Run:

```bash
pnpm --filter @variscout/core test -- src/findings/__tests__/hypothesisCondition.test.ts
pnpm --filter @variscout/ui test -- src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx
```

Expected: all PASS.

- [ ] **Step 2: Build touched packages**

Run:

```bash
pnpm --filter @variscout/core build
pnpm --filter @variscout/ui build
pnpm --filter @variscout/azure-app build
pnpm --filter @variscout/pwa build
```

Expected: all PASS; existing chunk-size warnings are acceptable.

- [ ] **Step 3: Branch guard**

Run:

```bash
git rev-parse --abbrev-ref HEAD
pwd
```

Expected:

```text
feat/aw-9-explore-where-handoff
/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat-aw-9-explore-where-handoff
```

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add packages/core/src/findings/hypothesisCondition.ts \
  packages/core/src/findings/__tests__/hypothesisCondition.test.ts \
  packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts \
  packages/ui/src/components/Canvas/EditMode/handlers/__tests__/navigateToExploreForChip.test.ts \
  apps/azure/src/components/editor/AnalyzeWorkspace.tsx \
  apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.exploreJump.seam.test.tsx \
  apps/pwa/src/components/views/AnalyzeView.tsx \
  apps/pwa/src/components/views/__tests__/AnalyzeView.exploreJump.seam.test.tsx
git commit -m "feat(analyze): carry categorical where into Explore"
```

## Task 5: Browser Smoke, PR Gate, Merge

- [ ] **Step 1: Browser smoke Azure**

Start:

```bash
pnpm --filter @variscout/azure-app dev
```

Open `http://localhost:5173/?sample=analyze-showcase`, go to Analyze, create/select a categorical scope if needed, click a cause/factor `→` Explore handoff, and verify:

- Explore opens.
- The scope chip shows categorical WHERE.
- `useProjectStore.getState().filters` contains the categorical WHERE in the browser.
- No Vite overlay and no console errors.

- [ ] **Step 2: Browser smoke PWA**

Start:

```bash
pnpm dev
```

Open `http://localhost:5173/?sample=analyze-showcase`, repeat the Analyze→Explore handoff, and verify the same filter/chip behavior.

- [ ] **Step 3: Run PR-ready**

Run:

```bash
bash scripts/pr-ready-check.sh
```

Expected: PASS.

- [ ] **Step 4: Push, PR, checks, merge**

Run:

```bash
git push -u origin feat/aw-9-explore-where-handoff
gh pr create --base main --head feat/aw-9-explore-where-handoff --title "AW-9: carry categorical WHERE into Explore" --body "<summary + verification>"
gh pr checks <pr-number> --watch
gh pr merge <pr-number> --merge --delete-branch
```

If `gh pr merge` reports the local `main` worktree conflict, verify remote merge state with:

```bash
gh pr view <pr-number> --json state,mergedAt,mergeCommit,url,headRefName
```

Delete the remote branch explicitly only if it still exists.

## Self-Review

- Spec coverage: AW-9 categorical WHERE handoff is covered by the core bridge, shared helper, both app call-sites, store/filter assertions, and browser smoke. Numeric-range predicates are intentionally dropped by the bridge and tested as deferred.
- CS-15 coordination: existing target fields remain optional; Process-tab chip callers continue to omit predicates and therefore preserve their current behavior.
- PWA parity: PWA gets the same helper behavior and app seam as Azure; no PWA-mount deferral remains for categorical Explore filters because `projectStore.filters` already drives chart data.
