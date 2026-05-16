---
title: 'PR-WV1-2 — Improve Workspace Migration (bite-sized plan)'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
  - docs/superpowers/plans/2026-05-16-pr-wv1-1-project-membership.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md
---

# PR-WV1-2 — Improve Workspace Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the legacy top-level Improve workspace into the Projects detail page as a 4-stage flow (`Charter / Approach / Improve / Sustainment` — Handoff folded into Sustainment closure). Introduce a simple `ActionItem`-backed tracker as the default Improve stage UI; expose the existing PDCA primitives behind an Advanced toggle. Cut the top-level Improve tab from the app shell, and absorb the two decision-log followups that are tightly coupled to this slice: (b) eager `team[] → members[]` migration and (d) `canAccess` wiring at consumer call sites.

**Architecture:** Stage-list refactor in `@variscout/ui`'s `IPDetailStageTabs` (the canonical 4-stage source), a new `ImproveStage` + `ImproveStageAdvanced` pair under `packages/ui/src/components/IPDetail/stages/`, fold of `HandoffOverview`/`HandoffSections` into `SustainmentOverview`/`SustainmentSections`, and route-handler/i18n cleanup in the PWA + Azure shells. Stage rename ships with a `migrateImprovementProjectMetadata` helper in `@variscout/core/improvementProject` that performs the legacy → wedge migration once at .vrs / Dexie hydration time, calling the already-shipped `migrateTeamToMembers` from PR-WV1-1.

**Tech Stack:** TypeScript + React 18 + Zustand + Dexie + Vitest + React Testing Library.

**Parent plan:** [`docs/superpowers/plans/2026-05-16-wedge-implementation.md`](2026-05-16-wedge-implementation.md) (PR-WV1-2 row).

**Canonical spec:** [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../specs/2026-05-16-wedge-architecture-design.md) §3.2 (4-stage IP detail) + §3.3 (Improve = simple tracker by default).

**PR-WV1-1 deferred items absorbed here:** (b) `team[]` eager cutover (Task 1) + (d) `canAccess` wiring (Task 0). Items (a) invitation lifecycle and (c) per-user persistence key are explicitly **NOT** absorbed — see "Deferred to later PRs" section at the bottom.

---

## PR sizing — single PR off this branch

Per `feedback_slice_size_cap` ("Cap slices at ~6–8 tasks/PR; multi-PR off one branch when larger"), this plan is 8 tasks. The decision-log fold-ins (canAccess wiring, team[] cutover) compose cleanly with the master-plan content because:

- Task 0 (canAccess wiring) MUST land before Task 2 builds ImproveStage — the new stage gates its edit affordances via `canAccess('edit-improve')`, so converging the ACL truth table FIRST keeps Task 2 from inventing a parallel inline check.
- Task 1's stage rename already touches the `.vrs`/Dexie migration path; folding `team[] → members[]` here is one extra function call, not a new task.

Recommendation: **single PR**. If reviewers ask for a split, the natural seam is at the end of Task 1 (canAccess + stage rename + migrations all coherent foundation work; remaining tasks are pure Improve-UI build-out).

---

## Branch setup

Branch already exists: `feat/wedge-pr-wv1-2-improve-workspace`, based on PR-WV1-1's HEAD (`7f7d21ea`). Worktree at `.worktrees/feat/wedge-pr-wv1-2-improve-workspace`. `pnpm install` already completed.

Verify:

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace branch --show-current
# expect: feat/wedge-pr-wv1-2-improve-workspace
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace log --oneline -5
# expect top three commits to be PR-WV1-1 work (7f7d21ea, fce353ff, 695091e3)
```

---

## Foundation already in place (from PR-WV1-1)

- `@variscout/core/projectMembership`: `ProjectRole` (`'lead' | 'member' | 'sponsor'`), `ProjectMember`, `Invitation`, `MembershipAction`, `canAccess(userId, members, action)`, `ProjectAction` (`'edit-charter' | 'edit-approach' | 'edit-improve' | 'edit-sustainment' | 'manage-membership' | 'view-report'`).
- `@variscout/core/improvementProject/migration.ts`: `migrateTeamToMembers(legacyTeam, migrationTimestamp): ProjectMember[]` — exists but currently invoked nowhere.
- `ImprovementProjectMetadata` has BOTH `team?` (legacy) and `members?: ProjectMember[]` (wedge) — coexisting during the migration window.
- `IPDetailPage` renders the Sponsor placeholder (`data-testid="sponsor-report-panel"`) and `NoAccessRedirect` for non-members when `currentUserId` + populated `members[]` are both present; inline role lookup is used today (will be replaced by Task 0).

---

## Surfaces touched (from Explore scout 2026-05-16)

| Concern                                   | Canonical file                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage type + `STAGE_ORDER`                | `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`                                                                                                                                   |
| Stage routing in IP detail                | `packages/ui/src/components/IPDetail/IPDetailPage.tsx`                                                                                                                                        |
| Sustainment + Handoff stage views         | `packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx`, `SustainmentSections.tsx`, `HandoffOverview.tsx`, `HandoffSections.tsx`                                                 |
| Existing PDCA primitives                  | `packages/ui/src/components/ImprovementPlan/{PrioritizationMatrix,BrainstormModal,IdeaGroupCard,ImprovementContextPanel}.tsx`, `packages/ui/src/components/WhatIfExplorer/WhatIfExplorer.tsx` |
| Top-level Improve tab handler             | `apps/pwa/src/App.tsx:398` (`else if (tab === 'improve') panels.showImprovement()`), `apps/azure/src/pages/Editor.tsx:561` (`ps.showImprovement()`)                                           |
| Tab i18n keys                             | `packages/core/src/i18n/messages/*.ts` (key `workspace.improve`)                                                                                                                              |
| ActionItem entity (drives simple tracker) | `packages/core/src/findings/types.ts:161`                                                                                                                                                     |
| ImprovementProject types                  | `packages/core/src/improvementProject/types.ts`                                                                                                                                               |

---

## Task 0 — Wire `canAccess` at consumer call sites

**Goal:** Replace the inline `members.find(m => m.userId === currentUserId)?.role` lookup in `IPDetailPage` and the `onInvite`-prop-presence gating in `CharterOverview` with calls to `canAccess` from `@variscout/core/projectMembership`. This converges the ACL truth table on one entry point BEFORE Task 2 adds new consumers.

**Why first:** Per PR-WV1-1's final Opus review: "if PR-WV1-2 adds a 4th role or refines `ProjectAction` semantics, drift between `canAccess` and `IPDetailPage` is silent."

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx`

### Steps

- [ ] **Step 1: Read both files end-to-end first.** Verify the current inline-lookup shape and the `onInvite`-prop gate location. Note the line numbers; don't write any code yet.

- [ ] **Step 2: Write a failing test asserting `IPDetailPage` uses `canAccess` for the Sponsor placeholder branch**

Add to `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx` (inside the existing `describe('ACL guard', ...)` block):

```typescript
it('uses canAccess view-report for Sponsor placeholder gating', () => {
  // Sponsor's only allowed action is 'view-report'; the placeholder must render
  // and stage tabs must be hidden — same observable behavior as before, but
  // routed through canAccess.
  render(
    <IPDetailPage
      ip={aclIP}
      onBackToList={() => {}}
      currentUserId="sponsor@org"
    />
  );
  expect(screen.getByTestId('sponsor-report-panel')).toBeInTheDocument();
  expect(screen.queryByTestId('stage-tab-charter')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify the test passes today (it tests current observable behavior)**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: PASS. This test pins the observable contract; the refactor below must preserve it.

- [ ] **Step 4: Refactor `IPDetailPage.tsx` to use `canAccess`**

Replace the inline lookups (around the `isExplicitlyExcluded` / `isSponsor` derivations) with:

```tsx
import { canAccess } from '@variscout/core/projectMembership';

// ... inside the component, after `const members = ip.metadata.members ?? [];`
const hasIdentity = currentUserId !== undefined && members.length > 0;
const isExplicitlyExcluded = hasIdentity && !canAccess(currentUserId, members, 'view-report');
const isSponsor =
  hasIdentity &&
  canAccess(currentUserId, members, 'view-report') &&
  !canAccess(currentUserId, members, 'edit-charter');
```

This preserves the existing two-branch logic but routes every role decision through `canAccess`. Delete any leftover `userRole` const if it's only used by these branches; if it's used elsewhere, leave it.

- [ ] **Step 5: Run the full IPDetailPage suite to verify all 6 ACL-guard tests + the new one pass**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: all green (existing 6 ACL tests + Sponsor placeholder test from step 2).

- [ ] **Step 6: Write a failing test asserting CharterOverview gates Invite on `canAccess('manage-membership')`**

Add to `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx` (inside the existing `describe('Team section', ...)` block):

```typescript
it('hides the Invite button for non-Lead viewers even when onInvite is provided', () => {
  // Member-role current user; should NOT see Invite even though onInvite handler is wired
  render(
    <CharterOverview
      ip={charterIPWithMembers}
      mode="overview"
      currentUserId="member@org"
      onInvite={() => {}}
      onMemberRemove={() => {}}
    />
  );
  expect(screen.queryByRole('button', { name: /invite team/i })).not.toBeInTheDocument();
});
```

(Use the existing test's members fixture — it should include a Member-role entry with `userId: 'member@org'`. If not, extend the fixture in the same step.)

- [ ] **Step 7: Run the test to verify it fails today** (Member currently sees the Invite button because gating uses `onInvite` prop presence, not role)

```bash
pnpm --filter @variscout/ui test -- CharterOverview
```

Expected: FAIL on the new test; the existing 6 tests still pass.

- [ ] **Step 8: Refactor `CharterOverview.tsx` to gate the Invite button via `canAccess`**

Inside the component (where the Team section is rendered), replace the `{onInvite ? ... : null}` gating with:

```tsx
import { canAccess } from '@variscout/core/projectMembership';

// inside the component body, after destructuring props:
const canManageMembership =
  currentUserId !== undefined && canAccess(currentUserId, members, 'manage-membership');

// in JSX, render the Team section only when membership data exists,
// and render the Invite button only when canManageMembership is true:
{
  members !== undefined && (
    <section aria-label="Team">
      ...
      {canManageMembership && onInvite && (
        <button onClick={() => setInviteOpen(true)}>Invite team</button>
      )}
      <MemberList
        members={members}
        currentUserId={currentUserId ?? ''}
        onRemove={onMemberRemove ?? (() => {})}
      />
      ...
    </section>
  );
}
```

If `members` is typed as optional, narrow it explicitly. Keep `onInvite` as a continued requirement for actually opening the modal — `canManageMembership` is a strictly tighter gate.

- [ ] **Step 9: Run the test to verify it now passes**

```bash
pnpm --filter @variscout/ui test -- CharterOverview
```

Expected: all 7 Team-section tests pass (6 existing + new Member-hidden Invite test).

- [ ] **Step 10: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace add packages/ui/src/components/IPDetail/IPDetailPage.tsx packages/ui/src/components/IPDetail/stages/CharterOverview.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-2-improve-workspace commit -m "refactor(ui): route IPDetailPage + Charter ACL through canAccess"
```

---

## Task 1 — Stage type rename + .vrs migration + team[] → members[] eager cutover

**Goal:** Rename the IP stage list from `['charter', 'approach', 'sustainment', 'handoff']` to `['charter', 'approach', 'improve', 'sustainment']`. Add a single migration helper (`migrateImprovementProjectMetadata`) that runs at `.vrs` load / Dexie rehydration and folds (a) the legacy stage rename + (b) the `team[]` → `members[]` cutover from PR-WV1-1's deferred item (b).

**Why combined:** the `.vrs` / Dexie migration codepath is a single seam. Adding two separate migration passes here would be ceremony; folding them into one helper keeps the migration window short and the migration logic discoverable.

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx` (StageName type, STAGE_ORDER, LABEL map)
- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx` (stage routing — if any inline references to `'handoff'` exist)
- Modify: `packages/ui/src/components/IPDetail/index.ts` (barrel — verify the new `StageName` shape still flows through)
- Create: `packages/core/src/improvementProject/migrateMetadata.ts` — `migrateImprovementProjectMetadata(ip, now)` helper
- Create: `packages/core/src/improvementProject/__tests__/migrateMetadata.test.ts`
- Modify: `packages/core/src/improvementProject/index.ts` — export `migrateImprovementProjectMetadata`
- Modify: `apps/azure/src/services/localDb.ts` AND/OR `apps/azure/src/db/schema.ts` (find via grep — the .vrs / Dexie hydration call site)
- Modify: `apps/pwa/src/services/` equivalent (find via grep — PWA hydration is likely in-memory only via `useProjectStore`)
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx` (if it pins `'handoff'`)

### Steps

- [ ] **Step 1: Read `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`** to confirm the exact shape of `StageName`, `STAGE_ORDER`, and the `LABEL` map. Also read `packages/ui/src/components/IPDetail/IPDetailPage.tsx` to identify every `'handoff'` / `'sustainment'` reference (active-stage default, persistence of last-viewed stage, etc.).

- [ ] **Step 2: Find the .vrs / Dexie hydration call site**

```bash
grep -rn "improvementProjects\|ImprovementProject\b" apps/azure/src/services apps/azure/src/db apps/pwa/src/services 2>/dev/null | grep -v test | head -20
```

Identify the function(s) that load `ImprovementProject` records from storage (Dexie `.toArray()` / `.get()` reads in Azure; localStorage/Zustand hydration in PWA). The migration call should hook here — every load goes through `migrateImprovementProjectMetadata`.

If unclear after 5 minutes, STOP and report. Don't guess at the call site.

- [ ] **Step 3: Write the failing migration helper test**

```typescript
// packages/core/src/improvementProject/__tests__/migrateMetadata.test.ts
import { describe, it, expect } from 'vitest';
import { migrateImprovementProjectMetadata } from '../migrateMetadata';
import type { ImprovementProject } from '../types';

describe('migrateImprovementProjectMetadata', () => {
  const baseIP: ImprovementProject = {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Test IP' },
    goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 } },
    sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
  };

  it('migrates legacy team[] to members[] when members is absent', () => {
    const legacy: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [
          { role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } },
          { role: 'teamMember', person: { displayName: 'Mira' } },
        ],
      },
    };
    const out = migrateImprovementProjectMetadata(legacy, 1234);
    expect(out.metadata.members).toBeDefined();
    expect(out.metadata.members).toHaveLength(2);
    expect(out.metadata.members?.[0].role).toBe('lead');
    expect(out.metadata.members?.[1].role).toBe('member');
    // Legacy team[] preserved for backward compat readers in this PR
    expect(out.metadata.team).toBeDefined();
  });

  it('does not migrate when members[] already populated', () => {
    const alreadyMigrated: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [{ role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } }],
        members: [
          {
            id: 'pm-existing',
            createdAt: 100,
            deletedAt: null,
            userId: 'someone-else@org',
            displayName: 'Someone Else',
            role: 'lead',
            invitedAt: 100,
          },
        ],
      },
    };
    const out = migrateImprovementProjectMetadata(alreadyMigrated, 1234);
    expect(out.metadata.members).toHaveLength(1);
    expect(out.metadata.members?.[0].userId).toBe('someone-else@org');
  });

  it('is a no-op when neither team nor members exist', () => {
    const out = migrateImprovementProjectMetadata(baseIP, 1234);
    expect(out.metadata.members).toBeUndefined();
    expect(out).toEqual(baseIP);
  });

  it('returns a new object (does not mutate input)', () => {
    const legacy: ImprovementProject = {
      ...baseIP,
      metadata: {
        ...baseIP.metadata,
        team: [{ role: 'projectLead', person: { displayName: 'Lead', upn: 'lead@org' } }],
      },
    };
    const out = migrateImprovementProjectMetadata(legacy, 1234);
    expect(out).not.toBe(legacy);
    expect(legacy.metadata.members).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run to verify it fails** (module not found)

```bash
pnpm --filter @variscout/core test -- improvementProject/__tests__/migrateMetadata
```

Expected: FAIL.

- [ ] **Step 5: Implement `migrateImprovementProjectMetadata`**

```typescript
// packages/core/src/improvementProject/migrateMetadata.ts
import type { ImprovementProject } from './types';
import { migrateTeamToMembers } from './migration';

/**
 * Idempotent migration applied at hydration time. Folds two PR-WV1-2 changes
 * over the wedge V1 metadata shape:
 *   1. legacy `team[]` → wedge `members[]` (via migrateTeamToMembers)
 *
 * Legacy `team[]` is preserved on the output for now; PR-WV1-5 (tier-gating
 * retirement + nav reorder) drops it.
 */
export function migrateImprovementProjectMetadata(
  ip: ImprovementProject,
  now: number
): ImprovementProject {
  const hasMembers = ip.metadata.members !== undefined;
  const hasLegacyTeam = ip.metadata.team !== undefined && ip.metadata.team.length > 0;

  if (hasMembers || !hasLegacyTeam) {
    return ip;
  }

  const members = migrateTeamToMembers(ip.metadata.team, now);

  return {
    ...ip,
    metadata: {
      ...ip.metadata,
      members,
    },
  };
}
```

- [ ] **Step 6: Export from `improvementProject` barrel**

In `packages/core/src/improvementProject/index.ts`, add:

```typescript
export { migrateImprovementProjectMetadata } from './migrateMetadata';
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test -- improvementProject
```

Expected: all four migration tests pass, plus all existing core/improvementProject tests.

- [ ] **Step 8: Rename `StageName` + `STAGE_ORDER` in `IPDetailStageTabs.tsx`**

Edit `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`:

```typescript
export type StageName = 'charter' | 'approach' | 'improve' | 'sustainment';

const STAGE_ORDER: StageName[] = ['charter', 'approach', 'improve', 'sustainment'];
```

Update the `LABEL` map: drop `'handoff'`, add `'improve'`. Use the existing `workspace.improve` i18n key — that key already exists in all locales (per Explore scout finding §3).

- [ ] **Step 9: Update `IPDetailPage.tsx` to remove any hard-coded `'handoff'` references**

Search the file: any `activeStage === 'handoff'` or `'handoff' as StageName` references should map to `'sustainment'` (since Handoff is folded into Sustainment closure in Task 5).

Also update the Sponsor placeholder's stage-tab-absent assertion path if it referenced 4 named stages.

- [ ] **Step 10: Fix existing tests that assert the legacy 4-stage shape**

```bash
grep -rln "'handoff'\b" packages/ui/src/components/IPDetail/ apps/ --include="*.tsx" --include="*.ts" | head
```

Update each hit:

- Test fixtures using `status: 'handoff'` should still be valid IP shapes (per `ImprovementProject.status: 'draft' | 'active' | 'closed'` — `'handoff'` is NOT a project status, it's a stage; confirm by checking `improvementProject/types.ts`).
- Any test assertion like `expect(screen.getByTestId('stage-tab-handoff')).toBeInTheDocument()` should become `'stage-tab-improve'`.

- [ ] **Step 11: Wire the migration helper into Azure Dexie hydration**

From Step 2's discovery, identify the Dexie `.toArray()` call that loads ImprovementProject records on app startup or hub-open. Wrap each loaded IP through `migrateImprovementProjectMetadata(ip, Date.now())` before handing to the store / UI.

If the load happens in multiple places, prefer to add the migration at the lowest call site (closest to the Dexie read) — single seam.

- [ ] **Step 12: Wire the migration helper into PWA hydration**

PWA likely hydrates from `localStorage` + `useProjectStore`. The migration call should happen at the same boundary as the Azure one — wherever the raw stored shape becomes a typed `ImprovementProject` in the store.

If both apps share a hydration helper (e.g., in `@variscout/stores` or a `useEditorDataFlow` hook), wire it once at that helper level.

- [ ] **Step 13: Run the full UI + apps test suites for touched files**

```bash
pnpm --filter @variscout/ui test -- IPDetail 2>&1 | tail -10
pnpm --filter @variscout/azure-app test -- ProjectsTabView 2>&1 | tail -10
pnpm --filter @variscout/pwa test -- ProjectsTabView 2>&1 | tail -10
```

Expected: all green.

- [ ] **Step 14: Commit**

```bash
git -C <worktree> add packages/core/src/improvementProject/ packages/ui/src/components/IPDetail/ apps/azure/src/ apps/pwa/src/
git -C <worktree> commit -m "feat(core): rename Handoff stage to Improve; eager-migrate legacy team[]"
```

If the diff is large and touches both core + UI + apps, split into two commits: `feat(core): ...` for the migration helper + stage type, and `refactor(ui,apps): wire stage rename + metadata migration` for everything else. Use judgment.

---

## Task 2 — Build `ImproveStage` (simple ActionItem tracker)

**Goal:** Render a focused list of `ActionItem` entities scoped to the current IP. Show title (`text`), owner (`assignedTo?.displayName`), due date (`dueAt`), status (`status`), and the linked suspected cause name (looked up via `parentImprovementIdeaId → ImprovementIdea`, falling back to "Unattributed"). Gate edit affordances via `canAccess(currentUserId, members, 'edit-improve')`.

**Why an existing entity:** `ActionItem` already carries every field the simple tracker needs (`packages/core/src/findings/types.ts:161`). No new types — PR-WV1-2 is a UI/integration slice, not a data-modeling slice.

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/ImproveStage.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx` (route `'improve'` stage to `<ImproveStage>`)

### Steps

- [ ] **Step 1: Discover the ActionItem data source**

```bash
grep -rn "actionItems\b\|ActionItem\[\]\|HubAction.*ACTION_ITEM\|actionItemActions" packages/core/src packages/stores/src apps --include="*.ts" --include="*.tsx" | head -15
```

Identify where `actionItems[]` lives in app state (likely on `ProcessHub.actionItems` per `findings/types.ts:161` `EntityBase` peers). Identify any reducer / dispatch helper that adds / updates / removes them.

If ActionItems are NOT yet wired through a store / dispatch surface today, this task gets larger — STOP and report scope concern. (Master plan assumed they exist; verify.)

- [ ] **Step 2: Write the failing component test**

```typescript
// packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImproveStage } from '../ImproveStage';
import type { ActionItem } from '@variscout/core/findings';
import type { ProjectMember } from '@variscout/core/projectMembership';

const leadMembers: ProjectMember[] = [
  {
    id: 'pm-1',
    createdAt: 1,
    deletedAt: null,
    userId: 'lead@org',
    displayName: 'Lead',
    role: 'lead',
    invitedAt: 1,
  },
];

const actions: ActionItem[] = [
  {
    id: 'ai-1',
    createdAt: 1,
    deletedAt: null,
    text: 'Run a pilot on Line 3',
    assignedTo: { displayName: 'Mira', upn: 'mira@org' },
    dueAt: '2026-06-01',
    status: 'open',
    parentImprovementProjectId: 'ip-1',
  },
  {
    id: 'ai-2',
    createdAt: 2,
    deletedAt: null,
    text: 'Document the new SOP',
    status: 'done',
    parentImprovementProjectId: 'ip-1',
  },
];

describe('ImproveStage', () => {
  it('renders the scoped ActionItem list', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={actions}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByText('Run a pilot on Line 3')).toBeInTheDocument();
    expect(screen.getByText('Document the new SOP')).toBeInTheDocument();
  });

  it('shows owner display name when present', () => {
    render(
      <ImproveStage
        projectId="ip-1"
        actions={actions}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.getByText('Mira')).toBeInTheDocument();
  });

  it('renders an Add Action affordance for users with edit-improve', () => {
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
    expect(screen.getByRole('button', { name: /add action/i })).toBeInTheDocument();
  });

  it('hides Add Action for users without edit-improve (Sponsor)', () => {
    const mixedMembers: ProjectMember[] = [
      ...leadMembers,
      {
        id: 'pm-2',
        createdAt: 1,
        deletedAt: null,
        userId: 'sponsor@org',
        displayName: 'Sponsor',
        role: 'sponsor',
        invitedAt: 1,
      },
    ];
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={mixedMembers}
        currentUserId="sponsor@org"
        onActionAdd={() => {}}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /add action/i })).not.toBeInTheDocument();
  });

  it('calls onActionAdd with a typed payload when Add is submitted', () => {
    const onActionAdd = vi.fn();
    render(
      <ImproveStage
        projectId="ip-1"
        actions={[]}
        members={leadMembers}
        currentUserId="lead@org"
        onActionAdd={onActionAdd}
        onActionUpdate={() => {}}
        onActionRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add action/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New action' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onActionAdd).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'New action', parentImprovementProjectId: 'ip-1' })
    );
  });

  it('renders an empty state when there are no actions', () => {
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
    expect(screen.getByText(/no actions yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify the test fails**

```bash
pnpm --filter @variscout/ui test -- ImproveStage
```

Expected: FAIL (module not found).

- [ ] **Step 4: Implement `ImproveStage.tsx`**

```tsx
// packages/ui/src/components/IPDetail/stages/ImproveStage.tsx
import { useState } from 'react';
import type { ActionItem } from '@variscout/core/findings';
import { canAccess, type ProjectMember } from '@variscout/core/projectMembership';

export interface ImproveStageProps {
  projectId: string;
  actions: ActionItem[];
  members: ProjectMember[];
  currentUserId?: string;
  onActionAdd: (action: Pick<ActionItem, 'text' | 'parentImprovementProjectId'>) => void;
  onActionUpdate: (
    actionId: string,
    patch: Partial<Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt'>>
  ) => void;
  onActionRemove: (actionId: string) => void;
}

export function ImproveStage({
  projectId,
  actions,
  members,
  currentUserId,
  onActionAdd,
  onActionUpdate,
  onActionRemove,
}: ImproveStageProps) {
  const canEdit = currentUserId !== undefined && canAccess(currentUserId, members, 'edit-improve');
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onActionAdd({ text: trimmed, parentImprovementProjectId: projectId });
    setNewTitle('');
    setAddOpen(false);
  };

  return (
    <section aria-label="Improve stage">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-content text-lg font-semibold">Actions</h2>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Add action
          </button>
        )}
      </header>

      {addOpen && canEdit && (
        <form onSubmit={submit} className="mb-4 p-3 border border-edge rounded">
          <label className="block text-sm text-content">
            Title
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              aria-label="Title"
              className="w-full mt-1 px-2 py-1 border border-edge rounded"
            />
          </label>
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-3 py-1 text-content-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <p className="text-content-muted">No actions yet.</p>
      ) : (
        <ul className="divide-y divide-edge">
          {actions.map(a => (
            <li key={a.id} className="py-2">
              <div className="flex items-baseline justify-between">
                <span className="text-content">{a.text}</span>
                <span className="text-xs text-content-secondary">{a.status ?? 'open'}</span>
              </div>
              <div className="text-xs text-content-muted mt-1 flex gap-3">
                {a.assignedTo?.displayName && <span>{a.assignedTo.displayName}</span>}
                {a.dueAt && <span>Due {a.dueAt}</span>}
              </div>
              {canEdit && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onActionUpdate(a.id, { status: 'done' })}
                    className="text-xs text-content-secondary hover:text-content"
                    aria-label={`Mark ${a.text} done`}
                  >
                    Mark done
                  </button>
                  <button
                    type="button"
                    onClick={() => onActionRemove(a.id)}
                    className="text-xs text-content-secondary hover:text-content"
                    aria-label={`Remove ${a.text}`}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ImproveStage
```

Expected: 6/6 pass.

- [ ] **Step 6: Route `'improve'` stage in `IPDetailPage.tsx` to render `<ImproveStage>`**

Locate the stage-routing switch in `IPDetailPage.tsx` (the place that picks between CharterOverview / ApproachOverview / SustainmentOverview / HandoffOverview today). Add an `'improve'` case rendering `<ImproveStage>` with the right props plumbed:

- `projectId={ip.id}`
- `actions={...}` — filtered from app state. Source: from Task 2 step 1's discovery. If actions live on `ProcessHub.actionItems`, get them via the existing hook / prop the page already uses.
- `members={ip.metadata.members ?? []}`
- `currentUserId={currentUserId}`
- `onActionAdd` / `onActionUpdate` / `onActionRemove` — callback props on `IPDetailPage` mirroring the `onMembersChange` pattern from PR-WV1-1. Add the three optional props to `IPDetailPageProps`.

The PWA + Azure call sites in `apps/{pwa,azure}/src/components/ProjectsTabView.tsx` get the three new callbacks wired in Task 6.

- [ ] **Step 7: Add an integration test in IPDetailPage.test.tsx for the Improve stage routing**

Inside the existing test file, add:

```typescript
describe('Improve stage routing', () => {
  it('renders ImproveStage when activeStage = improve', () => {
    // Configure default active stage to 'improve' (likely via a status that puts the IP in that stage,
    // or by passing an explicit activeStage prop if IPDetailPage supports one — confirm via existing tests).
    render(
      <IPDetailPage
        ip={{ ...ip, status: 'active', metadata: { ...ip.metadata, members: [] } }}
        onBackToList={() => {}}
        currentUserId="anybody@org"
      />
    );
    // Click the Improve stage tab
    fireEvent.click(screen.getByTestId('stage-tab-improve'));
    expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run all IPDetail tests**

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: green.

- [ ] **Step 9: Commit**

```bash
git -C <worktree> add packages/ui/src/components/IPDetail/stages/ImproveStage.tsx packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx packages/ui/src/components/IPDetail/IPDetailPage.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx
git -C <worktree> commit -m "feat(ui): add ImproveStage with canAccess-gated ActionItem tracker"
```

---

## Task 3 — Build `ImproveStageAdvanced` (PDCA primitives)

**Goal:** Mount the four existing PDCA primitives (`PrioritizationMatrix`, `BrainstormModal`, `IdeaGroupCard`, `ImprovementContextPanel`) + `WhatIfExplorer` inside a single `ImproveStageAdvanced` wrapper. This wrapper renders when the user toggles the Improve stage to Advanced mode (Task 4 wires the toggle).

**Why minimal:** the primitives are already modular (Explore scout §4). This task is composition, not new functionality. The wrapper just lays out the existing components in a sensible Advanced workspace shape — left rail = ContextPanel, main = BrainstormModal + IdeaGroupCard list, right rail = PrioritizationMatrix + WhatIfExplorer.

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx`

### Steps

- [ ] **Step 1: Read each PDCA primitive's prop shape**

```bash
grep -A 10 "interface PrioritizationMatrixProps\|interface BrainstormModalProps\|interface IdeaGroupCardProps\|interface ImprovementContextPanelProps\|interface WhatIfExplorerProps" packages/ui/src/components/ImprovementPlan/ packages/ui/src/components/WhatIfExplorer/ -r 2>/dev/null | head -40
```

Note the required props for each. If any primitive's prop shape mismatches the Improve-stage data context (e.g., it expects data shapes that don't exist in `ImprovementProject`), STOP and report — task will need design adjustment.

- [ ] **Step 2: Write the failing test**

```typescript
// packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImproveStageAdvanced } from '../ImproveStageAdvanced';

describe('ImproveStageAdvanced', () => {
  it('renders all four PDCA workspace regions', () => {
    render(<ImproveStageAdvanced projectId="ip-1" />);
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ideas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prioritization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what-if/i)).toBeInTheDocument();
  });
});
```

This test pins region presence only — the primitives' own tests cover their internal behavior. Don't duplicate.

- [ ] **Step 3: Run to verify the test fails**

```bash
pnpm --filter @variscout/ui test -- ImproveStageAdvanced
```

Expected: FAIL (module not found).

- [ ] **Step 4: Implement `ImproveStageAdvanced.tsx`**

```tsx
// packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx
import { ImprovementContextPanel } from '../../ImprovementPlan/ImprovementContextPanel';
import { BrainstormModal } from '../../ImprovementPlan/BrainstormModal';
import { IdeaGroupCard } from '../../ImprovementPlan/IdeaGroupCard';
import { PrioritizationMatrix } from '../../ImprovementPlan/PrioritizationMatrix';
import { WhatIfExplorer } from '../../WhatIfExplorer/WhatIfExplorer';

export interface ImproveStageAdvancedProps {
  projectId: string;
  // Additional props flow in as the existing primitives reveal their requirements
  // during Step 1 inspection. Add them here and propagate from IPDetailPage in Step 6.
}

export function ImproveStageAdvanced({ projectId }: ImproveStageAdvancedProps) {
  return (
    <section aria-label="Improve stage advanced" className="grid grid-cols-12 gap-4">
      <aside aria-label="Context" className="col-span-3">
        <ImprovementContextPanel /* required props from Step 1 */ />
      </aside>
      <div aria-label="Ideas" className="col-span-6 flex flex-col gap-3">
        <BrainstormModal /* required props from Step 1 */ />
        <IdeaGroupCard /* required props from Step 1 */ />
      </div>
      <aside aria-label="Prioritization" className="col-span-3 flex flex-col gap-3">
        <PrioritizationMatrix /* required props from Step 1 */ />
        <section aria-label="What-If">
          <WhatIfExplorer /* required props from Step 1 */ />
        </section>
      </aside>
    </section>
  );
}
```

Fill in the actual required props per Step 1. If any primitive requires substantive props that don't exist in the IP detail context (e.g., a whole `ProcessHub` reference), accept the prop on `ImproveStageAdvancedProps` and pass through.

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- ImproveStageAdvanced
```

Expected: 1/1 pass.

- [ ] **Step 6: Commit**

```bash
git -C <worktree> add packages/ui/src/components/IPDetail/stages/ImproveStageAdvanced.tsx packages/ui/src/components/IPDetail/stages/__tests__/ImproveStageAdvanced.test.tsx
git -C <worktree> commit -m "feat(ui): add ImproveStageAdvanced mounting PDCA primitives"
```

---

## Task 4 — Advanced toggle inside `ImproveStage`

**Goal:** Add a "Show advanced workbench" toggle to `ImproveStage` that swaps in `ImproveStageAdvanced`. State persists per-IP in `useViewStore` (View layer — transient is fine; per IP scope so a user's mode choice doesn't leak across projects within a session).

**Files:**

- Modify: `packages/ui/src/components/IPDetail/stages/ImproveStage.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx`
- Modify: `packages/stores/src/useViewStore.ts` — add a `improveAdvancedByIp: Record<string, boolean>` field (or similar) if View store doesn't already track per-IP UI state

### Steps

- [ ] **Step 1: Read `packages/stores/src/useViewStore.ts`** to confirm its current shape + how per-IP state is keyed (if at all). Note the test pattern used for resetting the store.

- [ ] **Step 2: Write a failing test for the toggle behavior**

Append to `ImproveStage.test.tsx`:

```typescript
describe('ImproveStage advanced toggle', () => {
  it('renders simple tracker by default', () => {
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
    expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/context/i)).not.toBeInTheDocument();
  });

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
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify the new tests fail**

```bash
pnpm --filter @variscout/ui test -- ImproveStage
```

Expected: 2 new tests fail; 6 existing pass.

- [ ] **Step 4: Add the toggle to `ImproveStage.tsx`**

Add a state hook (or, if Step 1 found a per-IP view-store hook, use that):

```tsx
import { ImproveStageAdvanced } from './ImproveStageAdvanced';
import { useViewStore } from '@variscout/stores'; // if applicable

// inside the component:
const [showAdvanced, setShowAdvanced] = useState(false);
// Optional: hydrate/persist via useViewStore per-IP if Step 1 confirmed the shape.

// In the header (next to Add action button):
<button
  type="button"
  onClick={() => setShowAdvanced(v => !v)}
  className="text-xs text-content-secondary hover:text-content"
>
  {showAdvanced ? 'Simple view' : 'Advanced'}
</button>

// In the body:
{showAdvanced ? (
  <ImproveStageAdvanced projectId={projectId} />
) : (
  /* existing simple tracker JSX */
)}
```

If a per-IP view-store slice gets added, keep it minimal: `improveAdvancedByIp: Record<string, boolean>` + `setImproveAdvanced(projectId, advanced)` + a getter selector. Tests for the slice should follow the existing useViewStore test pattern.

- [ ] **Step 5: Run the tests**

```bash
pnpm --filter @variscout/ui test -- ImproveStage
```

Expected: 8/8 pass.

- [ ] **Step 6: Commit**

```bash
git -C <worktree> add packages/ui/src/components/IPDetail/stages/ImproveStage.tsx packages/ui/src/components/IPDetail/stages/__tests__/ImproveStage.test.tsx packages/stores/
git -C <worktree> commit -m "feat(ui): add Advanced toggle on ImproveStage"
```

---

## Task 5 — Fold Handoff close-logic into Sustainment closure

**Goal:** Move the Handoff stage's "close project" action into `SustainmentOverview` (or a new `SustainmentClosure` extraction inside it), and delete `HandoffOverview` + `HandoffSections`. Preserve every external observable behavior the existing Handoff tests verified, including any auto-fire path tied to ADR-080's pattern.

**Note on ADR-080 auto-fire:** the Explore scout confirmed the data model exists (`sustainmentRecords[]`, `controlHandoffs[]`) but found NO live "auto-create on SuspectedCause confirmation" trigger in the current tree. Per the master plan: the requirement here is to **preserve whatever is shipped**, not to add the trigger. If shipped behavior doesn't include the auto-fire today, then there's nothing to preserve beyond the data model + close-action flow.

**Files:**

- Modify: `packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/SustainmentSections.tsx`
- Delete: `packages/ui/src/components/IPDetail/stages/HandoffOverview.tsx`
- Delete: `packages/ui/src/components/IPDetail/stages/HandoffSections.tsx`
- Modify: existing `HandoffOverview.test.tsx` + `HandoffSections.test.tsx` — port their assertions into the Sustainment test files
- Modify: any consumer that imports `HandoffOverview` / `HandoffSections` (grep first)

### Steps

- [ ] **Step 1: Read `HandoffOverview.tsx`, `HandoffSections.tsx`, `SustainmentOverview.tsx`, `SustainmentSections.tsx` end-to-end.** Identify what Handoff does that Sustainment doesn't:
  - Close-project action and its handler
  - Any HubAction dispatched (search for `HANDOFF_` action kinds via `grep`)
  - Activity-feed events emitted
  - Any data-flow specific to Handoff (e.g., controlHandoffs[] CRUD)

- [ ] **Step 2: Find every consumer of HandoffOverview / HandoffSections**

```bash
grep -rln "HandoffOverview\|HandoffSections" packages/ui/src apps/ --include="*.ts" --include="*.tsx" | head
```

Expected: imports in `IPDetailPage.tsx` (stage routing switch) and possibly a barrel.

- [ ] **Step 3: Port the close-project action into `SustainmentOverview.tsx`**

Move the Handoff close-project button, modal, and submit handler into SustainmentOverview's UI. If the close-project action dispatched a `HANDOFF_CLOSE` HubAction kind, rename it to `SUSTAINMENT_CLOSE` (or absorb into an existing `IMPROVEMENT_PROJECT_UPDATE` patch — confirm via Step 1's discovery). If the action kind needs renaming, the dispatch-pattern follows `feedback_action_patch_omit_lifecycle` — verify the patch type uses the standard `Omit<E, 'id' | 'createdAt' | ...>` shape.

- [ ] **Step 4: Port the Handoff tests into Sustainment test files**

Open `HandoffOverview.test.tsx` and `HandoffSections.test.tsx`. For each test:

- If the test asserts Handoff-specific UI (close button, modal, signoff field), move the assertion into the matching Sustainment test file, adapting the rendered component.
- If the test asserts a Handoff-only data flow that's being collapsed, decide: keep the assertion (renaming to `Sustainment closure`) or drop it (and document why in the commit message).

- [ ] **Step 5: Run all Sustainment + Handoff tests in their new shape**

```bash
pnpm --filter @variscout/ui test -- "Sustainment|Handoff"
```

Expected: all ported tests pass; no dangling references to the old Handoff components.

- [ ] **Step 6: Delete HandoffOverview.tsx + HandoffSections.tsx + their `__tests__` files**

```bash
rm packages/ui/src/components/IPDetail/stages/HandoffOverview.tsx
rm packages/ui/src/components/IPDetail/stages/HandoffSections.tsx
rm packages/ui/src/components/IPDetail/stages/__tests__/HandoffOverview.test.tsx
rm packages/ui/src/components/IPDetail/stages/__tests__/HandoffSections.test.tsx
```

- [ ] **Step 7: Remove Handoff imports from `IPDetailPage.tsx`** (and any barrel). Update the stage-routing switch: there's no `'handoff'` case any more — that StageName value no longer exists per Task 1.

- [ ] **Step 8: Run `pnpm build` to catch cross-package type-export gaps**

```bash
pnpm build 2>&1 | tail -10
```

Per `feedback_ui_build_before_merge`: build catches type-export gaps that per-package vitest misses. Expected: green.

- [ ] **Step 9: Commit**

```bash
git -C <worktree> add packages/ui/src/components/IPDetail/stages/
git -C <worktree> commit -m "refactor(ui): fold Handoff close-logic into Sustainment closure"
```

---

## Task 6 — Remove top-level Improve tab (PWA + Azure)

**Goal:** Remove the `'improve'` tab from the app shell. Both apps redirect users to `/projects` with a one-time toast when they hit the legacy URL. The 7→6 tab transition lands here; the **nav reorder** to wedge's `[Home] [Projects] [Process] [Analyze] [Investigation] [Report]` is explicitly deferred to PR-WV1-5.

**Files:**

- Modify: `apps/pwa/src/App.tsx` (remove `else if (tab === 'improve') panels.showImprovement()` and any tab list that includes 'improve')
- Modify: `apps/azure/src/pages/Editor.tsx` (same: remove `ps.showImprovement()` branch + tab list entry)
- Modify: `packages/core/src/i18n/messages/*.ts` — delete the `workspace.improve` key from every locale
- Modify: matching test files

### Steps

- [ ] **Step 1: Find every `tab === 'improve'` reference**

```bash
grep -rn "tab === 'improve'\|'improve' as\|showImprovement\|workspace.improve" packages/ apps/ --include="*.ts" --include="*.tsx" | head -25
```

Note each call site.

- [ ] **Step 2: Write a failing test asserting the legacy `/improve` route redirects to `/projects` with a toast** (one test per app, in its existing app-shell test file)

Adapt the redirect mechanism to whatever the app shell uses for routing (URL / hash / tab state). If the app shell has no current "navigate to tab X with toast Y" mechanism, document the workaround used.

- [ ] **Step 3: Run the tests to verify they fail**

```bash
pnpm --filter @variscout/pwa test -- App
pnpm --filter @variscout/azure-app test -- Editor
```

Expected: new tests fail.

- [ ] **Step 4: Implement the redirect in both apps**

In `apps/pwa/src/App.tsx`, replace:

```typescript
} else if (tab === 'improve') {
  panels.showImprovement();
}
```

with:

```typescript
} else if (tab === 'improve') {
  // Wedge V1: Improve moved to a stage inside Projects detail (ADR-082, wedge spec §3.2).
  showToast({ kind: 'info', message: 'Improve is now a stage in each project.' });
  setActiveTab('projects');
}
```

(Adapt `showToast` / `setActiveTab` to the app's actual toast + nav helpers — read 1-2 existing tab-switch call sites to mirror the pattern.) Do the same in `apps/azure/src/pages/Editor.tsx`.

- [ ] **Step 5: Remove the `'improve'` entry from the tab list array**

If the apps construct their tab list from a hardcoded array (PWA scout found this in `App.tsx`; Azure equivalent in `Editor.tsx`), drop `'improve'` from the array. Drop the i18n key from every locale file. This is mechanical; use a single `sed` if all locales use the identical key shape, but verify the change in one locale first.

- [ ] **Step 6: Run all tests**

```bash
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

Expected: both green.

- [ ] **Step 7: Run `pnpm docs:check`** (i18n key deletions can cascade)

```bash
pnpm docs:check 2>&1 | tail -10
```

Expected: green.

- [ ] **Step 8: Commit**

```bash
git -C <worktree> add apps/ packages/core/src/i18n/
git -C <worktree> commit -m "feat(apps): retire top-level Improve tab (now a project stage)"
```

---

## Task 7 — Final verification + decision-log amendment

**Goal:** Run the full pre-PR check suite, perform a `--chrome` browser walk covering the wedge V1 spec §3.2 verification scenarios, and amend the decision-log to mark PR-WV1-2 shipped + explicitly defer the two remaining PR-WV1-1 follow-ups (invitation lifecycle to PR-WV1-3, per-user persistence key to PR-WV1-5).

### Steps

- [ ] **Step 1: Targeted test sweep**

```bash
pnpm --filter @variscout/core test 2>&1 | tail -5
pnpm --filter @variscout/stores test 2>&1 | tail -5
pnpm --filter @variscout/pwa test 2>&1 | tail -5
pnpm --filter @variscout/azure-app test 2>&1 | tail -5
pnpm --filter @variscout/ui test -- IPDetail 2>&1 | tail -5
pnpm --filter @variscout/ui test -- projects 2>&1 | tail -5
pnpm --filter @variscout/ui test -- Charter 2>&1 | tail -5
pnpm --filter @variscout/ui test -- Improve 2>&1 | tail -5
pnpm --filter @variscout/ui test -- Sustainment 2>&1 | tail -5
```

Expected: all green. (Full `@variscout/ui` suite has a documented unchanged-Canvas hang per prior memory entries — touched suites are run in isolation.)

- [ ] **Step 2: Full build**

```bash
pnpm build 2>&1 | tail -10
```

Expected: 5/5 packages/apps green.

- [ ] **Step 3: pr-ready-check**

```bash
bash scripts/pr-ready-check.sh 2>&1 | tail -30
```

Expected: green (architecture grep, ADR-074 boundary, lint, docs).

- [ ] **Step 4: Browser walk (`claude --chrome`)**

Verify each wedge V1 §3.2 + §3.3 scenario end-to-end:

1. Create a new project as Lead → IP detail shows 4 stage tabs: Charter, Approach, Improve, Sustainment (no Handoff).
2. Open the Improve stage → simple ActionItem tracker shows; "Add action" button visible; "Advanced" toggle in the header.
3. Click "Add action" → enter title → save → action appears in list.
4. Click "Advanced" → ImproveStageAdvanced workspace shows Context / Ideas / Prioritization / What-If regions.
5. Click "Simple view" → returns to tracker.
6. Sign in as a Sponsor → IPDetailPage shows the Sponsor placeholder pointing to the top Report nav tab; Improve stage isn't reachable from this view.
7. Sign in as a Member → can see + edit Improve actions; cannot see the Invite-team button on Charter.
8. Open the Sustainment stage → closure UI present; absorb Handoff close-action invokes correctly (project status moves to `closed`).
9. Navigate to the legacy `/improve` URL → redirected to Projects list with toast "Improve is now a stage in each project."
10. Load an existing customer `.vrs` with legacy `team[]` populated and no `members[]` → after hydration, `members[]` is auto-populated via `migrateImprovementProjectMetadata`; the Team rail on Charter shows entries; legacy `team[]` is still readable by the legacy `IPDetailTeamRail`.

If any step fails, capture a screenshot, log to `docs/investigations.md`, and decide whether to block the PR or fold into a follow-up. Document the choice in the PR description.

- [ ] **Step 5: Amend `docs/decision-log.md` 2026-05-16 wedge entry**

Add a new "Amendment 2026-05-16 — PR-WV1-2 shipped" block under the existing wedge entry. Cover:

- 4-stage rename (`Sustainment+Handoff` → `Improve+Sustainment`); Handoff stage views deleted; `SustainmentOverview` absorbs close-action.
- New `ImproveStage` (simple ActionItem tracker) + `ImproveStageAdvanced` (PDCA primitives mounted) + Advanced toggle.
- `migrateImprovementProjectMetadata` helper folds (a) stage rename + (b) `team[] → members[]` eager cutover; invoked at `.vrs` / Dexie hydration in both apps.
- Top-level Improve tab retired (7 → 6 tabs; reorder still deferred to PR-WV1-5).
- `canAccess` wired at `IPDetailPage` (Sponsor placeholder + non-member gate) and `CharterOverview` Invite-button gating. PR-WV1-1 deferred item (d) closed.
- PR-WV1-1 deferred item (b) closed.
- **Remaining PR-WV1-1 followups:** (a) `INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds — re-owned by **PR-WV1-3** (Investigation Wall + MeasurementPlans is the natural carrier; Inbox simplification is part of that slice). (c) Per-user persistence key on `useProjectMembershipStore` — re-owned by **PR-WV1-5** (tier-gating retirement + nav reorder, where auth-wiring refinement naturally lands).

- [ ] **Step 6: Commit the decision-log amendment**

```bash
git -C <worktree> add docs/decision-log.md
git -C <worktree> commit -m "docs(wedge): log PR-WV1-2 delivery + re-owner remaining followups"
```

- [ ] **Step 7: Push + open PR**

```bash
git -C <worktree> push -u origin feat/wedge-pr-wv1-2-improve-workspace
gh pr create --title "feat(wedge): PR-WV1-2 Improve workspace migration" \
  --body "$(cat <<'EOF'
## Summary

Implements wedge V1 spec §3.2 + §3.3 — IP detail flattens to 4 stages (Charter / Approach / Improve / Sustainment with Handoff folded into Sustainment closure), top-level Improve tab retires, simple ActionItem tracker is the default Improve stage UI with PDCA primitives behind an Advanced toggle.

Also absorbs two of PR-WV1-1's deferred items per decision-log 2026-05-16 amendment:
- (b) `team[]` → `members[]` eager cutover at .vrs / Dexie hydration via new `migrateImprovementProjectMetadata`
- (d) `canAccess` wired at consumer call sites (IPDetailPage + CharterOverview Invite gate)

## Test plan

- [x] pnpm test (per-package; full @variscout/ui suite has documented unchanged-Canvas hang)
- [x] pnpm build green
- [x] bash scripts/pr-ready-check.sh
- [ ] `--chrome` browser walk per wedge §3.2 + §3.3 (10 scenarios in plan §Task 7 Step 4)

## Master plan

`docs/superpowers/plans/2026-05-16-wedge-implementation.md` (PR-WV1-2 row).

## Sub-plan

`docs/superpowers/plans/2026-05-16-pr-wv1-2-improve-workspace.md`
EOF
)"
```

If the PR is opened while PR-WV1-1 (#183) is still open, GitHub will show this PR's base as `feat/wedge-pr-wv1-1-project-membership`. When #183 squash-merges to main, GitHub auto-updates this PR's base to main.

---

## Verification (end-to-end)

1. **Schema:** legacy `team[]` and wedge `members[]` coexist on `ImprovementProjectMetadata`; `migrateImprovementProjectMetadata` populates `members[]` from `team[]` at hydration only when `members` is absent.
2. **Stage flow:** 4 named stages render in `IPDetailStageTabs`. The Improve stage routes to `<ImproveStage>` by default; Sustainment closure absorbs Handoff. No `'handoff'` StageName anywhere.
3. **ACL:** `canAccess` is the single ACL entry point. IPDetailPage Sponsor / non-member branches route through it. CharterOverview Invite button is gated on `canAccess('manage-membership')`. ImproveStage edit affordances gate on `canAccess('edit-improve')`.
4. **Apps:** PWA + Azure shells retire the `'improve'` tab handler with a redirect-to-Projects + toast; existing `currentUserId` + `onMembersChange` wiring from PR-WV1-1 propagates unchanged.
5. **Test sweep:** core + stores + PWA + Azure green; UI touched suites (IPDetail, projects, Charter, Improve, Sustainment) green.
6. **Build:** `pnpm build` green across all 5 packages/apps.

---

## Self-review checklist

- [ ] **Spec coverage**: every wedge spec §3.2 (4-stage IP detail) + §3.3 (simple-by-default Improve + Advanced toggle) commitment lands in a task.
- [ ] **Placeholder scan**: no TBD / TODO / placeholder code; every step has the actual content.
- [ ] **Type consistency**: `StageName`, `ProjectAction`, `MembershipAction`, `ImproveStageProps`, `ImproveStageAdvancedProps` used consistently across tasks.
- [ ] **No `Math.random`** in code or tests (per `packages/core/CLAUDE.md` hard rule).
- [ ] **No "root cause" language** anywhere (per P5 amended).
- [ ] **Sub-path exports paired**: no new sub-path added in this PR; if Task 1's migration helper goes through the existing `improvementProject` barrel (it should), no change to `package.json#exports` or `tsconfig.json#paths` is needed. Verify before committing.
- [ ] **Patch types**: any new `*_UPDATE` HubAction added (e.g., a renamed `SUSTAINMENT_CLOSE`) uses `Omit<E, 'id'|'createdAt'|'hubId'|'updatedAt'|'deletedAt'>` per `feedback_action_patch_omit_lifecycle`.
- [ ] **`canAccess` is the single ACL entry point** after this PR. No inline role-string comparisons remain in IPDetailPage / CharterOverview / ImproveStage.

---

## Deferred to later PRs

- **PR-WV1-1 deferred item (a) — `INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds** — moves to PR-WV1-3 (Investigation Wall + Measurement Plans). The Inbox simplification context lands there; acceptance is the user action that transitions an `Invitation.status` → emits a `PROJECT_MEMBER_ADD` via composite reducer.
- **PR-WV1-1 deferred item (c) — Per-user persistence key on `useProjectMembershipStore`** — moves to PR-WV1-5 (tier-gating retirement + nav reorder). That PR refines auth wiring (single-user PWA vs. multi-user Azure) and is the natural place to adopt the `useActiveIPStore`-style dynamic-key pattern.
- **ADR-080 auto-fire trigger** — Out of scope for this PR. The data model is preserved; the auto-creation hook (SuspectedCause confirmed + matching improvement implemented → Sustainment record) does not yet exist in the current tree per the Explore scout. Track as a separate workstream once the canonical trigger source is decided.

---

## Execution handoff

Plan complete. Recommended approach:

**Subagent-Driven Development** (recommended):

- Fresh implementer subagent per task (8 tasks)
- Per-task spec reviewer + quality reviewer pair
- Final architecture review (`system-architect` Opus) + code review (`superpowers:requesting-code-review` Opus) at end of branch
- Sonnet for implementer + per-task reviewers (~70%+ of dispatches per CLAUDE.md memory)

Invoke `superpowers:subagent-driven-development` with this plan as input.
