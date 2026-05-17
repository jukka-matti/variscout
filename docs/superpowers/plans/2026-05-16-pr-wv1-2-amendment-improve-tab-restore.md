---
title: 'PR-WV1-2 amendment — restore Improve as top-level verb tab + Project singular (bite-sized plan)'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/archive/specs/2026-05-16-improve-tab-amendment-design.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-2-improve-workspace.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
  - docs/07-decisions/adr-082-wedge-architecture.md
---

# PR-WV1-2 amendment — restore Improve as top-level verb tab + Project singular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **TDD IS NON-NEGOTIABLE** per user's explicit reminder: every code-touching step follows red→green→commit.

**Goal:** Amend the in-flight PR-WV1-2 branch to (a) trim `StageName` from 4 values to 3 (drop `'improve'`), (b) remove `<ImproveStage>` routing from `IPDetailPage`, (c) wire the existing top-level Improve tab to render `<ImproveTabRoot>` which mounts `<ImproveStage>` (with active IP) or `<NoActiveProjectGuidance>` (without), (d) rename the `workspace.projects` i18n key to `workspace.project` across 32 locale files, (e) amend the decision-log to reflect the restored 7-tab nav.

**Architecture:** The existing `<ImprovementView>` in PWA + the Azure equivalent currently render `<ImprovementWorkspaceBase>` as the legacy Improve panel. The amendment replaces `<ImprovementView>`'s body with `<ImproveTabRoot>`, which uses active-IP context (via `useActiveIPContext(sessionHub)`) to choose between the simple tracker (`<ImproveStage>` from Task 2) and the guidance state. `<ImprovementWorkspaceBase>` continues to back the Advanced toggle inside `<ImproveStage>` (replacing the Task 3 `<ImproveStageAdvanced>` skeleton, which retires). The `'improve'` stage is removed from IP detail per the amendment spec; consumers in `IPDetailPage` are cleaned up.

**Tech Stack:** TypeScript + React 18 + Zustand + Vitest + React Testing Library.

**Canonical spec:** [`docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`](../../archive/specs/2026-05-16-improve-tab-amendment-design.md).

**Parent sub-plan (historical):** `docs/superpowers/plans/2026-05-16-pr-wv1-2-improve-workspace.md` — Tasks 0-5 stand verbatim per the amendment spec; this plan covers the rework needed on top.

---

## Branch setup

The branch `feat/wedge-pr-wv1-2-improve-workspace` already exists in the worktree at `/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace`, 16 commits ahead of PR-WV1-1's HEAD (`7f7d21ea`), top commit `01e65326` (the spec amendment).

Verify:

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace branch --show-current
# expect: feat/wedge-pr-wv1-2-improve-workspace

git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace log --oneline 7f7d21ea..HEAD | head -20
# expect (top to bottom): 01e65326 spec amendment, 6de849c3 Task 5 Sustainment fold, 80876352 Task 4 toggle, 09e03a37 Task 3 ImproveStageAdvanced, 7b391a9a Task 2 ImproveStage, c6e5872c + 6dba97c4 Task 1 stage rename, d16b7655 + b45a24a2 Task 0 canAccess.
```

---

## Foundation in place

Already shipped on this branch:

- PR-WV1-2 Task 0 — `canAccess` wired at `IPDetailPage` + `CharterOverview` Invite gate.
- PR-WV1-2 Task 1 — stage rename to 4 stages (`StageName = 'charter' | 'approach' | 'improve' | 'sustainment'`) + `migrateImprovementProjectMetadata` helper. The amendment trims this to 3 stages.
- PR-WV1-2 Task 2 — `<ImproveStage>` component at `packages/ui/src/components/IPDetail/stages/ImproveStage.tsx`. Currently routed from `IPDetailPage`. The amendment moves it.
- PR-WV1-2 Task 3 — `<ImproveStageAdvanced>` skeleton at `packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx`. Mounts existing PDCA primitives. **The amendment retires this** — the production Advanced surface is `<ImprovementWorkspaceBase>` (already wired in `<ImprovementView>`), not this skeleton.
- PR-WV1-2 Task 4 — Advanced toggle on `<ImproveStage>` that swaps in `<ImproveStageAdvanced>`. The amendment re-points the toggle target.
- PR-WV1-2 Task 5 — Handoff close-logic folded into Sustainment closure; `HandoffOverview`/`HandoffSections` deleted.

Scout findings to anchor file paths:

- **PWA Improve tab handler:** `apps/pwa/src/features/panels/panelsStore.ts:113` — `showImprovement: () => set({ activeView: 'improvement' })`. PWA `App.tsx` lines 1330-1344 render `<ImprovementView>` when `activeView === 'improvement'`.
- **Azure Improve tab handler:** `apps/azure/src/pages/Editor.tsx:561` — `ps.showImprovement()`. Equivalent panel-store-driven render path in Editor.
- **Active-IP cascade hook:** `useActiveIPContext(sessionHub)` — returns `{ activeIP, activeIPScope, setActiveIP, clearActiveIP, ... }`. Canonical consumer pattern: `const { activeIP } = useActiveIPContext(sessionHub)`.
- **ActionItem fetch pattern:** `pwaHubRepository.actionItems.listByHub(activeHubId)` returns `ActionItem[]`. Used in `FrameView.tsx:150` and similar.
- **i18n locale count:** 32 files in `packages/core/src/i18n/messages/`. The `workspace.projects` key exists in every locale with literal value `'Projects'` (singular semantics in some languages, but English value is plural).
- **i18n test:** `packages/core/src/i18n/__tests__/index.test.ts:228` — "every locale defines every wall.\* key" pattern. The amendment adds `workspace.project` to every locale; the key-coverage test will fail if any locale is missed.
- **Nav consumer:** `apps/pwa/src/components/layout/AppHeader.tsx:101-102` — tab config has `{ id: 'projects', labelKey: 'workspace.projects' }`. Azure equivalent in the analogous header file.
- **`ImproveStage` callers:** Only `packages/ui/src/components/IPDetail/IPDetailPage.tsx:22` imports `ImproveStage`. `ImproveStage.tsx:4` imports `ImproveStageAdvanced` internally.

---

## File structure (final state after amendment)

**Created:**

- `packages/ui/src/components/Improve/NoActiveProjectGuidance.tsx` — guidance panel with role="alert" + heading + body + "Go to Home" button.
- `packages/ui/src/components/Improve/NoActiveProjectGuidance.test.tsx` — RTL tests.
- `packages/ui/src/components/Improve/ImproveTabRoot.tsx` — switches between `<ImproveStage>` (active IP) and `<NoActiveProjectGuidance>` (no active IP).
- `packages/ui/src/components/Improve/ImproveTabRoot.test.tsx` — RTL tests covering both branches.
- `packages/ui/src/components/Improve/index.ts` — barrel exporting both components.

**Moved (via `git mv` to preserve history):**

- `packages/ui/src/components/IPDetail/stages/ImproveStage.tsx` → `packages/ui/src/components/Improve/ImproveStage.tsx`
- `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx` → `packages/ui/src/components/Improve/ImproveStage.test.tsx`

**Deleted:**

- `packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx` — the Task 3 skeleton retires; `<ImprovementWorkspaceBase>` is the production Advanced surface.
- `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx`

**Modified:**

- `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx` — `StageName` becomes `'charter' | 'approach' | 'sustainment'`; `STAGE_ORDER` becomes 3 values; `LABEL` drops `'improve'` entry.
- `packages/ui/src/components/IPDetail/stageState.ts` — `StageStateInputs.improveComplete` retires; `deriveStageState` simplifies per amendment spec table.
- `packages/ui/src/components/IPDetail/IPDetailPage.tsx` — remove `import { ImproveStage } from './stages/ImproveStage'`; remove `'improve'` case from stage router; remove `onActionAdd`/`Update`/`Remove` from `IPDetailPageProps`.
- `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx` + `stageState.test.ts` + `IPDetailPage.test.tsx` — trim assertions to 3 stages.
- `packages/ui/src/components/Improve/ImproveStage.tsx` (after move) — Advanced toggle's `<ImproveStageAdvanced>` import switches to `<ImprovementWorkspaceBase>` from `@variscout/ui` (verify the actual import path during implementation).
- `packages/ui/src/components/Improve/ImproveStage.test.tsx` (after move) — Advanced-toggle test updated to assert the production Advanced surface renders (not the deleted skeleton).
- `packages/ui/src/index.ts` — export new `Improve/` barrel.
- `packages/core/src/i18n/messages/*.ts` (32 files) — drop `'workspace.projects'` line, add `'workspace.project'` line.
- `apps/pwa/src/components/layout/AppHeader.tsx` — update tab config: `labelKey: 'workspace.project'`.
- `apps/azure/src/components/layout/AppHeader.tsx` (or equivalent) — same update.
- `apps/pwa/src/App.tsx` — `<ImprovementView>` body replaced by `<ImproveTabRoot>` wiring (or `<ImprovementView>` itself updated to compose `<ImproveTabRoot>` internally).
- `apps/azure/src/pages/Editor.tsx` — same.
- `docs/decision-log.md` — amendment under the existing 2026-05-16 wedge entry.

**Sub-path exports:** No new sub-path needed. `Improve/` directory exports flow through the existing `packages/ui/src/index.ts` barrel. Sub-path-export pair (`package.json#exports` + `tsconfig.json#paths`) does NOT need updating.

---

## Task A — Trim `StageName` to 3 values

**Goal:** Remove `'improve'` from `StageName` and downstream. After this, IP detail has 3 stage tabs.

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`
- Modify: `packages/ui/src/components/IPDetail/stageState.ts`
- Test: `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx`
- Test: `packages/ui/src/components/IPDetail/__tests__/stageState.test.ts`

- [ ] **Step 1: Write the failing test asserting 3 stages**

Add to `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx`:

```typescript
describe('STAGE_ORDER (amendment — 3 stages)', () => {
  it('contains exactly charter, approach, sustainment', () => {
    // STAGE_ORDER is module-internal; assert via the rendered tab list.
    const ip: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Test' },
      goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 } },
      sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
    };
    render(
      <IPDetailStageTabs
        ip={ip}
        activeStage="charter"
        onStageChange={() => {}}
      />
    );
    expect(screen.getByTestId('stage-tab-charter')).toBeInTheDocument();
    expect(screen.getByTestId('stage-tab-approach')).toBeInTheDocument();
    expect(screen.getByTestId('stage-tab-sustainment')).toBeInTheDocument();
    expect(screen.queryByTestId('stage-tab-improve')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- IPDetailStageTabs
```

Expected: FAIL — `stage-tab-improve` still present (Task 1 added it).

- [ ] **Step 3: Trim `StageName` and `STAGE_ORDER` in `IPDetailStageTabs.tsx`**

Replace the existing declarations:

```typescript
export type StageName = 'charter' | 'approach' | 'sustainment';

const STAGE_ORDER: StageName[] = ['charter', 'approach', 'sustainment'];
```

Update the `LABEL` map: drop the `'improve'` entry entirely. Keep the existing `'charter'`, `'approach'`, `'sustainment'` entries verbatim.

- [ ] **Step 4: Trim `deriveStageState` in `stageState.ts`**

Open `packages/ui/src/components/IPDetail/stageState.ts`. Remove the `improveComplete` field from `StageStateInputs`. Update `deriveStageState` to return the new 3-key shape per the amendment spec table:

```typescript
export interface StageStateInputs {
  status: ImprovementProject['status'];
  sustainmentConfirmed: boolean;
}

export interface StageStateMap {
  charter: StageState;
  approach: StageState;
  sustainment: StageState;
}

export function deriveStageState({
  status,
  sustainmentConfirmed,
}: StageStateInputs): StageStateMap {
  if (sustainmentConfirmed) {
    return { charter: 'done', approach: 'done', sustainment: 'done' };
  }
  switch (status) {
    case 'draft':
      return { charter: 'current', approach: 'upcoming', sustainment: 'upcoming' };
    case 'active':
      return { charter: 'done', approach: 'current', sustainment: 'upcoming' };
    case 'closed':
      return { charter: 'done', approach: 'done', sustainment: 'current' };
  }
}
```

- [ ] **Step 5: Update `stageState.test.ts` to assert the new 3-key shape**

Open `packages/ui/src/components/IPDetail/__tests__/stageState.test.ts`. Remove every reference to `improveComplete` (the input field) and to the `improve` key (in the output). For every test case, replace the 4-key `expect(...).toEqual({ charter, approach, improve, sustainment })` with the 3-key form `{ charter, approach, sustainment }`. Mirror the table above.

If existing tests covered the `improveComplete` signal explicitly (e.g., "when improveComplete is true, sustainment is current"), delete those tests — the signal no longer exists; `status === 'closed'` is the new "sustainment is current" trigger.

- [ ] **Step 6: Update `IPDetailStageTabs.test.tsx` existing tests to match 3 stages**

Find every assertion that pinned 4 tabs and trim to 3. Existing tests that asserted `stage-tab-improve` should now assert it's NOT present (covered by Step 1) or be deleted if redundant.

- [ ] **Step 7: Run all stage-related tests to verify PASS**

```bash
pnpm --filter @variscout/ui test -- "IPDetailStageTabs|stageState"
```

Expected: green across both suites.

- [ ] **Step 8: Run the full IPDetail suite to catch downstream breakage**

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: green. If `IPDetailPage.test.tsx`'s "Improve stage routing" test (added in PR-WV1-2 Task 2) fails because `stage-tab-improve` is gone, that's expected — Task B deletes that test. Note the failure but proceed to commit; Task B fixes it.

If the failure count is bigger than the one improve-routing test, STOP and report — there's more downstream coupling than the amendment spec anticipated.

- [ ] **Step 9: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace add packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx packages/ui/src/components/IPDetail/stageState.ts packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx packages/ui/src/components/IPDetail/__tests__/stageState.test.ts
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace commit -m "refactor(ui): trim StageName to 3 values — drop 'improve' stage per amendment"
```

---

## Task B — Remove `ImproveStage` routing from `IPDetailPage`

**Goal:** `IPDetailPage` no longer renders `<ImproveStage>` or accepts the three `onAction*` props. Stage router has 3 cases.

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test asserting the props are gone**

In `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`, add (near the top of the file, after the existing fixture imports):

```typescript
describe('IPDetailPageProps (amendment — no onAction* props)', () => {
  it('does not accept onActionAdd / onActionUpdate / onActionRemove props', () => {
    // @ts-expect-error onActionAdd should be removed from IPDetailPageProps
    const props = { ip, onBackToList: () => {}, onActionAdd: () => {} } as IPDetailPageProps;
    expect(props).toBeDefined();
  });
});
```

If the `IPDetailPageProps` type is not currently exported (it may be local), export it from `IPDetailPage.tsx` for this test:

```typescript
export interface IPDetailPageProps { ... }
```

- [ ] **Step 2: Run to verify FAIL (the @ts-expect-error fires red when types still accept the prop)**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: the test file fails to type-check OR the @ts-expect-error directive itself raises a tsc warning about being unused. (Vitest will surface the type error if its TS integration is enabled; otherwise this test pins via the type system at build time.)

If the @ts-expect-error pattern doesn't fire in the vitest run, switch to a runtime assertion: after removing the prop from `IPDetailPageProps`, the existing "Improve stage routing" test (added in Task 2) will fail because the component no longer routes `'improve'`. That failure IS the red-light gate. Use whichever signal is firmer.

- [ ] **Step 3: Remove `ImproveStage` import + props from `IPDetailPage.tsx`**

In `packages/ui/src/components/IPDetail/IPDetailPage.tsx`:

- Delete the line `import { ImproveStage } from './stages/ImproveStage';` (currently around line 22).
- Delete the three optional props from `IPDetailPageProps`: `onActionAdd?`, `onActionUpdate?`, `onActionRemove?`. They retire entirely.
- Delete any destructured references to these props in the component body.
- Delete the `case 'improve':` branch from the stage routing switch (if it survived Task A — it shouldn't, since `StageName` no longer includes `'improve'`, but verify).

- [ ] **Step 4: Delete the "Improve stage routing" describe block from `IPDetailPage.test.tsx`**

The test added by PR-WV1-2 Task 2:

```typescript
describe('Improve stage routing', () => {
  it('renders ImproveStage when activeStage = improve', () => { ... });
});
```

Delete this describe block entirely. No replacement — the Improve stage no longer exists in IP detail.

- [ ] **Step 5: Run the IPDetailPage suite to verify PASS**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: all remaining tests pass. The Sponsor placeholder test, the canAccess routing test, the Charter team section test, the ACL guard tests — all should remain green.

- [ ] **Step 6: Update the app-side callers if they pass `onActionAdd`/`Update`/`Remove`**

```bash
grep -rn "onActionAdd\|onActionUpdate\|onActionRemove" apps/pwa/src apps/azure/src --include="*.ts" --include="*.tsx"
```

If any consumer (likely `ProjectsTabView.tsx` in both apps) passes these props to `<IPDetailPage>`, remove the prop assignments. The callbacks themselves (if they reference any other code path) can stay for now — Task C reuses them for the Improve tab wiring.

- [ ] **Step 7: Run app-side tests**

```bash
pnpm --filter @variscout/pwa test -- ProjectsTabView
pnpm --filter @variscout/azure-app test -- ProjectsTabView
```

Expected: green. If a test asserted `<IPDetailPage onActionAdd={...}>` was called with specific props, update the test to drop those expectations.

- [ ] **Step 8: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace add packages/ui/src/components/IPDetail/IPDetailPage.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx apps/pwa/src apps/azure/src
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace commit -m "refactor(ui): remove ImproveStage routing from IPDetailPage per amendment"
```

---

## Task C — Build `ImproveTabRoot` + `NoActiveProjectGuidance`, retire `ImproveStageAdvanced`, move files, wire apps

**Goal:** Replace the existing top-level Improve tab body (`<ImprovementView>` content) with `<ImproveTabRoot>`, which switches between `<ImproveStage>` (active IP) and `<NoActiveProjectGuidance>` (no active IP). Reuse `<ImprovementWorkspaceBase>` as the Advanced-toggle target inside `<ImproveStage>`, retiring `<ImproveStageAdvanced>`. Move the Improve components to `packages/ui/src/components/Improve/`.

This is the largest task — split into 4 substantive sub-commits.

### Sub-task C.1 — `NoActiveProjectGuidance` component

**Files:**

- Create: `packages/ui/src/components/Improve/NoActiveProjectGuidance.tsx`
- Create: `packages/ui/src/components/Improve/__tests__/NoActiveProjectGuidance.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/Improve/__tests__/NoActiveProjectGuidance.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NoActiveProjectGuidance } from '../NoActiveProjectGuidance';

describe('NoActiveProjectGuidance', () => {
  it('renders the "No active project" heading + body copy', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
    expect(screen.getByText(/improvement work happens inside a chartered project/i)).toBeInTheDocument();
  });

  it('renders a "Go to Home" button', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('calls onGoHome when the button is clicked', () => {
    const onGoHome = vi.fn();
    render(<NoActiveProjectGuidance onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- NoActiveProjectGuidance
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// packages/ui/src/components/Improve/NoActiveProjectGuidance.tsx
export interface NoActiveProjectGuidanceProps {
  onGoHome: () => void;
}

export function NoActiveProjectGuidance({ onGoHome }: NoActiveProjectGuidanceProps) {
  return (
    <section role="alert" className="p-8 text-content max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">No active project</h2>
      <p className="text-content-secondary mb-4">
        Improvement work happens inside a chartered project. Pick a project from Home, or create a
        new one to start tracking actions and ideating with the PDCA workbench.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        Go to Home
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify PASS**

```bash
pnpm --filter @variscout/ui test -- NoActiveProjectGuidance
```

Expected: 3/3 pass.

- [ ] **Step 5: Commit**

```bash
git -C <worktree> add packages/ui/src/components/Improve/NoActiveProjectGuidance.tsx packages/ui/src/components/Improve/__tests__/NoActiveProjectGuidance.test.tsx
git -C <worktree> commit -m "feat(ui): add NoActiveProjectGuidance empty state for Improve tab"
```

### Sub-task C.2 — Move `ImproveStage` + retire `ImproveStageAdvanced`; re-point Advanced toggle to `<ImprovementWorkspaceBase>`

**Files:**

- Move: `packages/ui/src/components/IPDetail/stages/ImproveStage.tsx` → `packages/ui/src/components/Improve/ImproveStage.tsx`
- Move: `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx` → `packages/ui/src/components/Improve/__tests__/ImproveStage.test.tsx`
- Delete: `packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx`
- Delete: `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx`

- [ ] **Step 1: `git mv` ImproveStage and its test to the new location**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace
git mv packages/ui/src/components/IPDetail/stages/ImproveStage.tsx packages/ui/src/components/Improve/ImproveStage.tsx
git mv packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx packages/ui/src/components/Improve/__tests__/ImproveStage.test.tsx
```

(`__tests__/` directory will be auto-created by `git mv` if it doesn't exist; if it doesn't, create it first with `mkdir`.)

- [ ] **Step 2: Delete `ImproveStageAdvanced`**

```bash
git rm packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx
git rm packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx
```

- [ ] **Step 3: Find the production `ImprovementWorkspaceBase` import path**

```bash
grep -rn "ImprovementWorkspaceBase\b" packages/ui/src --include="*.tsx" --include="*.ts" | head -10
```

Note the export path (likely `from '@variscout/ui'` or `from './ImprovementPlan/ImprovementWorkspaceBase'`). Use it in step 4.

- [ ] **Step 4: Update `ImproveStage.tsx` (now at new path) to use `ImprovementWorkspaceBase` for the Advanced view**

Replace the `import { ImproveStageAdvanced } from './ImproveStageAdvanced';` line with:

```typescript
import { ImprovementWorkspaceBase } from '<path-from-step-3>';
```

Replace the `<ImproveStageAdvanced projectId={projectId} ... />` JSX with `<ImprovementWorkspaceBase ... />`. The actual prop shape of `ImprovementWorkspaceBase` may differ — read its component declaration to identify required props. Likely needs: an `ip` reference, members, action callbacks. If `ImprovementWorkspaceBase` has 10+ required props that aren't reachable from `ImproveStage`'s current prop set, accept them on `ImproveStageProps` as a passthrough bundle (`advancedProps?: ComponentProps<typeof ImprovementWorkspaceBase>`).

- [ ] **Step 5: Update `ImproveStage.test.tsx` (at new path)**

The test "switches to Advanced workbench when toggle clicked" currently asserts `screen.getByLabelText(/context/i)` (from the deleted `ImproveStageAdvanced` skeleton's region label). After the swap to `ImprovementWorkspaceBase`, the toggle target's observable identity changes. Update the assertion:

```typescript
it('switches to Advanced workbench when toggle clicked', () => {
  render(
    <ImproveStage
      projectId="ip-1"
      actions={[]}
      members={leadMembers}
      currentUserId="lead@org"
      onActionAdd={() => {}}
      onActionUpdate={() => {}}
      onActionRemove={() => {}}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
  // ImprovementWorkspaceBase renders an identifiable region — adapt to its actual structure
  expect(screen.getByTestId('improvement-workspace-base')).toBeInTheDocument();
});
```

The exact selector depends on what `ImprovementWorkspaceBase` renders. If it doesn't have a stable test ID, add one (`data-testid="improvement-workspace-base"`) at its root in a tiny separate edit, OR pick a unique always-visible string from its content. Note the choice in the commit message.

- [ ] **Step 6: Update import path in `IPDetailPage.tsx`** (it was removed in Task B, but verify no orphan imports remain)

```bash
grep -n "ImproveStage\b\|ImproveStageAdvanced\b" packages/ui/src/components/IPDetail/IPDetailPage.tsx
```

Expected: zero matches (Task B already removed the import).

- [ ] **Step 7: Run tests to verify PASS**

```bash
pnpm --filter @variscout/ui test -- "ImproveStage|NoActiveProjectGuidance"
```

Expected: all green. ImproveStage's 8 tests (incl. the updated Advanced toggle test) + the 3 NoActiveProjectGuidance tests = 11 passing.

- [ ] **Step 8: Commit**

```bash
git -C <worktree> add packages/ui/src/components/Improve/ packages/ui/src/components/IPDetail/stages/
git -C <worktree> commit -m "refactor(ui): move ImproveStage to Improve/; retire ImproveStageAdvanced; reuse ImprovementWorkspaceBase as Advanced view"
```

### Sub-task C.3 — `ImproveTabRoot` orchestration component

**Files:**

- Create: `packages/ui/src/components/Improve/ImproveTabRoot.tsx`
- Create: `packages/ui/src/components/Improve/__tests__/ImproveTabRoot.test.tsx`
- Create: `packages/ui/src/components/Improve/index.ts` (barrel)
- Modify: `packages/ui/src/index.ts` (export the new barrel)

- [ ] **Step 1: Write the failing tests for both branches**

```typescript
// packages/ui/src/components/Improve/__tests__/ImproveTabRoot.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImproveTabRoot } from '../ImproveTabRoot';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProjectMember } from '@variscout/core/projectMembership';
import type { ActionItem } from '@variscout/core/findings';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: {
    title: 'Test IP',
    members: [
      {
        id: 'pm-1',
        createdAt: 1,
        deletedAt: null,
        userId: 'lead@org',
        displayName: 'Lead',
        role: 'lead',
        invitedAt: 1,
      } satisfies ProjectMember,
    ],
  },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

const actions: ActionItem[] = [];

describe('ImproveTabRoot', () => {
  it('renders NoActiveProjectGuidance when activeIP is null', () => {
    render(
      <ImproveTabRoot
        activeIP={null}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={() => {}}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /actions/i })).not.toBeInTheDocument();
  });

  it('renders ImproveStage scoped to activeIP when set', () => {
    render(
      <ImproveTabRoot
        activeIP={ip}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={() => {}}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /no active project/i })).not.toBeInTheDocument();
  });

  it('passes onGoHome from NoActiveProjectGuidance through correctly', () => {
    const onGoHome = vi.fn();
    render(
      <ImproveTabRoot
        activeIP={null}
        actions={actions}
        currentUserId="lead@org"
        onGoHome={onGoHome}
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- ImproveTabRoot
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ImproveTabRoot`**

```tsx
// packages/ui/src/components/Improve/ImproveTabRoot.tsx
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';
import { ImproveStage } from './ImproveStage';
import { NoActiveProjectGuidance } from './NoActiveProjectGuidance';

export interface ImproveTabRootProps {
  activeIP: ImprovementProject | null;
  actions: ActionItem[];
  currentUserId?: string;
  onGoHome: () => void;
  onActionAdd: (action: Pick<ActionItem, 'text' | 'parentImprovementProjectId'>) => void;
  onActionUpdate: (
    actionId: string,
    patch: Partial<Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  onActionRemove: (actionId: string) => void;
}

export function ImproveTabRoot({
  activeIP,
  actions,
  currentUserId,
  onGoHome,
  onActionAdd,
  onActionUpdate,
  onActionRemove,
}: ImproveTabRootProps) {
  if (activeIP === null) {
    return <NoActiveProjectGuidance onGoHome={onGoHome} />;
  }
  const members = activeIP.metadata.members ?? [];
  const scopedActions = actions.filter(a => a.parentImprovementProjectId === activeIP.id);
  return (
    <ImproveStage
      projectId={activeIP.id}
      actions={scopedActions}
      members={members}
      currentUserId={currentUserId}
      onActionAdd={onActionAdd}
      onActionUpdate={onActionUpdate}
      onActionRemove={onActionRemove}
    />
  );
}
```

- [ ] **Step 4: Create the barrel**

```typescript
// packages/ui/src/components/Improve/index.ts
export { ImproveTabRoot, type ImproveTabRootProps } from './ImproveTabRoot';
export { ImproveStage, type ImproveStageProps } from './ImproveStage';
export {
  NoActiveProjectGuidance,
  type NoActiveProjectGuidanceProps,
} from './NoActiveProjectGuidance';
```

- [ ] **Step 5: Update `packages/ui/src/index.ts` to re-export the new barrel**

Find an existing `export *` line near the project surfaces (e.g., `export * from './components/projects'` from PR-WV1-1 Task 6's app wiring) and add:

```typescript
export * from './components/Improve';
```

Place it alphabetically near other re-exports.

- [ ] **Step 6: Run tests to verify PASS**

```bash
pnpm --filter @variscout/ui test -- ImproveTabRoot
```

Expected: 3/3 pass.

- [ ] **Step 7: Commit**

```bash
git -C <worktree> add packages/ui/src/components/Improve/ImproveTabRoot.tsx packages/ui/src/components/Improve/__tests__/ImproveTabRoot.test.tsx packages/ui/src/components/Improve/index.ts packages/ui/src/index.ts
git -C <worktree> commit -m "feat(ui): add ImproveTabRoot orchestration component"
```

### Sub-task C.4 — Wire `ImproveTabRoot` into PWA + Azure shells

**Files:**

- Modify: `apps/pwa/src/components/ImprovementView.tsx` (or wherever the top-level Improve panel body lives)
- Modify: `apps/azure/src/components/ImprovementView.tsx` (or equivalent)
- Modify: existing app-shell test files that exercise the Improve tab

- [ ] **Step 1: Read the existing `ImprovementView` in both apps**

```bash
find apps/pwa/src apps/azure/src -name "ImprovementView*" -type f
```

Read each to understand the current component shape, what it renders, and what props it accepts. The amendment replaces its body with `<ImproveTabRoot>` but preserves the outer wrapper (which likely handles header, layout, etc.).

- [ ] **Step 2: Discover the active-IP cascade pattern + ActionItem fetch pattern at the call site**

```bash
grep -n "useActiveIPContext\|activeIP\|actionItems.*listByHub" apps/pwa/src/App.tsx apps/azure/src/pages/Editor.tsx | head -15
```

Find:

- How the existing app shell reads `activeIP` from `useActiveIPContext(sessionHub)`.
- How it fetches ActionItems for the active hub (likely `pwaHubRepository.actionItems.listByHub(activeHubId)` in PWA; similar in Azure).
- How it threads these into `<ImprovementView>` today (or if it doesn't yet).

- [ ] **Step 3: Write the failing test for PWA**

In the existing test file for `App.tsx` or `ImprovementView.test.tsx` (whichever exists), add:

```typescript
it('renders NoActiveProjectGuidance when Improve tab is opened with no active IP', () => {
  // Setup: render the PWA shell with no active IP (use the existing pattern for shell tests)
  render(<App /* test props */ />);
  fireEvent.click(screen.getByRole('tab', { name: /improve/i }));
  expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
});

it('renders ImproveStage when Improve tab is opened with an active IP', () => {
  // Setup: pre-activate an IP via useActiveIPStore.setActiveIP({ hubId, userId }, ip.id)
  render(<App /* test props with seeded active IP */ />);
  fireEvent.click(screen.getByRole('tab', { name: /improve/i }));
  expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
});
```

Adapt the test scaffolding to the actual PWA shell test pattern. If integration testing at the App-level is heavy, write a simpler test against `ImprovementView` directly, with stub `activeIP` props.

- [ ] **Step 4: Run to verify FAIL**

```bash
pnpm --filter @variscout/pwa test -- "ImprovementView|App"
```

Expected: FAIL on the two new assertions.

- [ ] **Step 5: Update `apps/pwa/src/components/ImprovementView.tsx` to render `<ImproveTabRoot>`**

Pseudocode (adapt to actual shape):

```tsx
import { ImproveTabRoot } from '@variscout/ui';

export function ImprovementView(props: ImprovementViewProps) {
  const { activeIP } = useActiveIPContext(props.sessionHub);
  const actions = useActionItems(props.sessionHub); // hook that lists actions for the active hub
  const currentUserId = PWA_USER_ID; // from PR-WV1-1's app wiring

  return (
    <ImproveTabRoot
      activeIP={activeIP}
      actions={actions}
      currentUserId={currentUserId}
      onGoHome={() => props.onTabChange('home')}
      onActionAdd={action =>
        actionItemDispatch({
          kind: 'ACTION_ITEM_ADD',
          actionItem: {
            ...action,
            id: generateDeterministicId(),
            createdAt: Date.now(),
            deletedAt: null,
          },
        })
      }
      onActionUpdate={(id, patch) => {
        /* PR-WV1-3 will wire — for now log a console warning */
      }}
      onActionRemove={id => {
        /* PR-WV1-3 will wire */
      }}
    />
  );
}
```

`onActionUpdate` and `onActionRemove` lack live dispatch (per PR-WV1-2 Task 2's scoping decision — `ACTION_ITEM_UPDATE`/`REMOVE` action kinds don't exist yet). Wire them as no-op-with-console-warning stubs for V1; PR-WV1-3 adds the action kinds.

`useActionItems` may not exist; if not, write a small hook that wraps `pwaHubRepository.actionItems.listByHub(activeHubId)` using the same pattern `FrameView.tsx:150` uses. Keep it in `apps/pwa/src/features/improvement/` or similar.

- [ ] **Step 6: Run PWA tests to verify PASS**

```bash
pnpm --filter @variscout/pwa test -- "ImprovementView|App"
```

Expected: green.

- [ ] **Step 7: Repeat Steps 3-6 for Azure**

`apps/azure/src/components/ImprovementView.tsx` gets the same treatment, sourcing `currentUserId` from `currentUser?.email` (EasyAuth, per PR-WV1-1's app wiring) and using the Azure `azureHubRepository.actionItems.listByHub` fetch.

- [ ] **Step 8: Commit**

```bash
git -C <worktree> add apps/pwa/src apps/azure/src
git -C <worktree> commit -m "feat(apps): wire ImproveTabRoot into PWA + Azure Improve tab"
```

---

## Task D — Rename `workspace.projects` i18n key to `workspace.project`

**Goal:** Singular noun. 32 locale files updated; the nav consumer reads the new key.

**Files:**

- Modify: `packages/core/src/i18n/messages/*.ts` (32 files)
- Modify: `apps/pwa/src/components/layout/AppHeader.tsx` (tab config)
- Modify: `apps/azure/src/components/layout/AppHeader.tsx` (or equivalent)
- Test: `packages/core/src/i18n/__tests__/index.test.ts` (already exists; will guard the transition)

- [ ] **Step 1: Write the failing test asserting the new key exists in every locale**

In `packages/core/src/i18n/__tests__/index.test.ts`, add:

```typescript
describe('workspace.project key (amendment — replaces workspace.projects)', () => {
  it('is defined in every locale', () => {
    for (const [localeName, messages] of Object.entries(ALL_LOCALES)) {
      expect(messages, `${localeName} missing workspace.project`).toHaveProperty(
        'workspace.project'
      );
    }
  });

  it('workspace.projects is no longer present in any locale', () => {
    for (const [localeName, messages] of Object.entries(ALL_LOCALES)) {
      expect(messages, `${localeName} still has workspace.projects`).not.toHaveProperty(
        'workspace.projects'
      );
    }
  });
});
```

`ALL_LOCALES` should be the existing aggregate the test file uses for the wall.\* key-coverage test (read `index.test.ts:228` for the pattern). Mirror it.

- [ ] **Step 2: Run to verify FAIL**

```bash
pnpm --filter @variscout/core test -- i18n
```

Expected: FAIL — `workspace.project` not defined yet.

- [ ] **Step 3: Inventory all 32 locale files + their current `workspace.projects` line**

```bash
grep -n "'workspace\.projects'" packages/core/src/i18n/messages/*.ts | head -40
```

Confirm 32 hits, one per file. Note each file's path.

- [ ] **Step 4: Apply the rename across all 32 locales**

For each locale file, replace the single line:

```typescript
'workspace.projects': '<TranslatedString>',
```

with:

```typescript
'workspace.project': '<TranslatedString>',
```

The translated value stays the same string verbatim (the singular form in each language). For English (`en.ts`), the value goes from `'Projects'` to `'Project'`. For other locales, judge case-by-case:

- Finnish (`fi.ts`): `'Projektit'` → `'Projekti'`
- Swedish (`sv.ts`): `'Projekt'` (already singular in Swedish for both) — change key, keep value
- Japanese (`ja.ts`): `'プロジェクト'` (no plural in Japanese) — change key, keep value
- Simplified Chinese (`zhHans.ts`): `'项目'` (no plural in Chinese) — change key, keep value
- German (`de.ts`): `'Projekte'` → `'Projekt'`

For each locale, the convention is: if the language distinguishes singular/plural, switch to singular. If not, keep the existing word. Use a single `sed -i` invocation per file if confident, OR open each file and edit manually for the 3-4 locales you're least confident in.

Verify your edits for at least these 5 locales before committing:

- `en.ts`
- `fi.ts`
- `de.ts`
- `ja.ts`
- `zhHans.ts`

- [ ] **Step 5: Update the nav consumer in PWA**

In `apps/pwa/src/components/layout/AppHeader.tsx:101-102`, change:

```typescript
{ id: 'projects', labelKey: 'workspace.projects' }
```

to:

```typescript
{ id: 'projects', labelKey: 'workspace.project' }
```

The tab `id` stays `'projects'` (internal identifier; not user-visible). Only the `labelKey` changes.

- [ ] **Step 6: Update the Azure equivalent**

```bash
grep -rn "labelKey: 'workspace.projects'" apps/azure/src --include="*.ts" --include="*.tsx"
```

Apply the same edit at every hit.

- [ ] **Step 7: Run tests to verify PASS**

```bash
pnpm --filter @variscout/core test -- i18n
pnpm --filter @variscout/pwa test -- AppHeader
pnpm --filter @variscout/azure-app test -- AppHeader
```

Expected: green on all three.

- [ ] **Step 8: Commit**

```bash
git -C <worktree> add packages/core/src/i18n/ apps/pwa/src/components apps/azure/src
git -C <worktree> commit -m "refactor(i18n): rename workspace.projects to workspace.project (singular)"
```

---

## Task E — Final verification + decision-log amendment

**Goal:** Run pre-PR check suite. Browser walk. Decision-log entry.

- [ ] **Step 1: Run targeted test sweep**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace
pnpm --filter @variscout/core test 2>&1 | tail -5
pnpm --filter @variscout/stores test 2>&1 | tail -5
pnpm --filter @variscout/pwa test 2>&1 | tail -5
pnpm --filter @variscout/azure-app test 2>&1 | tail -5
pnpm --filter @variscout/ui test -- IPDetail 2>&1 | tail -10
pnpm --filter @variscout/ui test -- Improve 2>&1 | tail -10
pnpm --filter @variscout/ui test -- projects 2>&1 | tail -10
pnpm --filter @variscout/ui test -- Charter 2>&1 | tail -10
pnpm --filter @variscout/ui test -- Sustainment 2>&1 | tail -10
```

Expected: all green. The full `@variscout/ui` suite has a documented Canvas hang per prior memory entries — touched suites in isolation are the gate.

- [ ] **Step 2: Run full build**

```bash
pnpm build 2>&1 | tail -10
```

Expected: 5/5 packages/apps green.

- [ ] **Step 3: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh 2>&1 | tail -30
```

Expected: green.

- [ ] **Step 4: Browser walk via `claude --chrome`**

Verify each scenario in the amendment spec §"Acceptance criteria":

1. App loads → nav shows 7 tabs in order `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]`.
2. Tab labels show "Project" (singular) in English.
3. Switch locale to Finnish → tab shows "Projekti" (singular).
4. Pick a project from Home (sets active IP).
5. Click Project tab → 3 stage tabs visible (Charter / Approach / Sustainment); no Improve stage.
6. Click Improve tab → simple action tracker renders for the active IP; "Add action" button visible.
7. Click "Advanced" toggle → `<ImprovementWorkspaceBase>` renders (PDCA workbench with Brainstorm + IdeaCard + Prioritization + What-If).
8. Click "Simple view" → tracker returns.
9. Exit IP (clear active IP from Home or chip) → click Improve tab → "No active project" guidance renders with "Go to Home" button.
10. Click "Go to Home" → lands on Home tab.

Capture any failures and decide: block PR or fold to follow-up.

- [ ] **Step 5: Amend `docs/decision-log.md` under the existing 2026-05-16 wedge entry**

Add a new "Amendment 2026-05-16 — PR-WV1-2 shipped (Improve restored as top-level tab + Project singular)" block. Cover:

- 7-tab nav reinstated: `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]`. Reverses decision-log §(1) "Improve tab removed as top-level".
- "Projects" → "Project" singular rename across the i18n surface.
- Project detail trimmed from 4 stages to 3 (`Charter / Approach / Sustainment`); the `'improve'` stage retires.
- Improve tab content: `<ImproveTabRoot>` mounts `<ImproveStage>` (simple action tracker) with the Advanced toggle re-pointed to the production `<ImprovementWorkspaceBase>`. `<ImproveStageAdvanced>` skeleton from PR-WV1-2 Task 3 retires.
- `<ImproveStage>` and `<NoActiveProjectGuidance>` live in `packages/ui/src/components/Improve/`.
- Improve tab activates active-IP cascade pattern from PR-PT-7: empty state when no active IP, scoped tracker when active.
- Preserves decision-log §(3): cross-IP idea board / action conversion still retire. The Improve tab is single-IP-scoped, not free-roaming.
- Remaining PR-WV1-1 followups: (a) `INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds → still owed to PR-WV1-3. (c) Per-user persistence key on `useProjectMembershipStore` → still owed to PR-WV1-5.
- Canonical artifact: `docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`.

- [ ] **Step 6: Commit the decision-log amendment**

```bash
git -C <worktree> add docs/decision-log.md
git -C <worktree> commit -m "docs(wedge): log PR-WV1-2 delivery + Improve-tab amendment"
```

- [ ] **Step 7: Push + open PR**

```bash
git -C <worktree> push -u origin feat/wedge-pr-wv1-2-improve-workspace
gh pr create --title "feat(wedge): PR-WV1-2 Improve workspace migration (amended)" \
  --body "$(cat <<'EOF'
## Summary

Implements wedge V1 spec §3.2 + §3.3 with the 2026-05-16 amendment (Improve restored as top-level verb tab; Projects → Project singular). 4-stage IP detail collapses to 3 (`Charter / Approach / Sustainment`) with Handoff folded into Sustainment closure. Top-level Improve tab renders simple action tracker (default) + production `<ImprovementWorkspaceBase>` PDCA workbench (Advanced toggle), scoped to active IP via PR-PT-7 cascade. Empty state guides to Home when no active IP.

Also absorbs two of PR-WV1-1's deferred items:
- (b) `team[] → members[]` eager cutover at .vrs / Dexie hydration via `migrateImprovementProjectMetadata`
- (d) `canAccess` wired at consumer call sites (IPDetailPage + CharterOverview Invite gate)

## Test plan

- [x] pnpm test (per-package targeted; full @variscout/ui suite has documented Canvas hang)
- [x] pnpm build green
- [x] bash scripts/pr-ready-check.sh
- [ ] `--chrome` browser walk per amendment spec §Acceptance criteria (10 scenarios)

## Spec amendment

`docs/archive/specs/2026-05-16-improve-tab-amendment-design.md`

## Master plan

`docs/superpowers/plans/2026-05-16-wedge-implementation.md` PR-WV1-2 row.

## Sub-plans

`docs/superpowers/plans/2026-05-16-pr-wv1-2-improve-workspace.md` (original)
`docs/superpowers/plans/2026-05-16-pr-wv1-2-amendment-improve-tab-restore.md` (amendment)
EOF
)"
```

GitHub will show the PR's base as `feat/wedge-pr-wv1-1-project-membership` until PR-WV1-1 (#183) merges; then auto-updates to main.

---

## Verification

End-to-end:

1. **Schema:** `StageName` is 3 values; legacy `'handoff'` removed earlier; `'improve'` removed by this amendment. `migrateImprovementProjectMetadata` still folds team[] → members[] at hydration.
2. **Stage flow:** Project detail renders 3 stage tabs. Sustainment closure absorbs Handoff close-action. No `'improve'` stage anywhere.
3. **ACL:** `canAccess` is the single ACL entry point. `<ImproveStage>` gates Add/Mark-done/Remove via `canAccess('edit-improve')`.
4. **Nav:** 7 tabs in order. `workspace.project` key live; `workspace.projects` gone.
5. **Improve tab:** `<ImproveTabRoot>` switches between `<ImproveStage>` (active IP) and `<NoActiveProjectGuidance>` (no active IP). Advanced toggle reaches `<ImprovementWorkspaceBase>`.
6. **Apps:** PWA + Azure shells render `<ImproveTabRoot>` inside `<ImprovementView>` body.

---

## Self-review checklist

- [ ] **Spec coverage**: each numbered item in `2026-05-16-improve-tab-amendment-design.md` §"Acceptance criteria" maps to a task above.
- [ ] **Placeholder scan**: no TBD / TODO. Every code block has actual code.
- [ ] **Type consistency**: `StageName`, `IPDetailPageProps`, `ImproveTabRootProps`, `ImproveStageProps`, `NoActiveProjectGuidanceProps` used consistently.
- [ ] **No `Math.random`** in code or tests.
- [ ] **No "root cause"** language anywhere (P5 amended).
- [ ] **No `.toFixed()`** on stat values.
- [ ] **TDD compliance**: every code-touching task has 5-step rhythm (test → fail → impl → pass → commit).
- [ ] **Sub-path exports paired**: no new sub-path needed — `Improve/` flows through existing `packages/ui` barrel.
- [ ] **Patch types**: `ActionItem` UPDATE patch uses `Omit<E, 'id' | 'createdAt' | 'deletedAt'>` per `feedback_action_patch_omit_lifecycle`.
- [ ] **`canAccess` is the single ACL entry point** after this amendment.
- [ ] **No inline role-string comparisons** in IPDetailPage / CharterOverview / ImproveStage / ImproveTabRoot.

---

## Deferred to later PRs (still applies, unchanged from PR-WV1-2 original plan)

- **PR-WV1-1 deferred item (a) — `INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds** — still owed to PR-WV1-3 (Investigation Wall + Inbox simplification).
- **PR-WV1-1 deferred item (c) — Per-user persistence key on `useProjectMembershipStore`** — still owed to PR-WV1-5 (tier-gating retirement + nav reorder).
- **ADR-080 auto-fire trigger** — still out of scope. Data model preserved; trigger pending.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-16-pr-wv1-2-amendment-improve-tab-restore.md`. Per `feedback_subagent_driven_default`, dispatching `superpowers:subagent-driven-development` next without asking — fresh implementer subagent per task (A through E), Sonnet workhorses, spec + quality reviewer pair per task, final architecture review (system-architect Opus) + code-review skill (Opus) at end.
