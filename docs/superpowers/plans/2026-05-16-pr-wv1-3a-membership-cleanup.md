---
title: 'PR-WV1-3a — Membership lifecycle + ActionItem CRUD (bite-sized plan)'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
  - docs/07-decisions/adr-082-wedge-architecture.md
layer: spec
---

# PR-WV1-3a — Membership lifecycle + ActionItem CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **TDD IS NON-NEGOTIABLE** per the user's standing reminder — every code-touching step follows red → green → commit.

**Goal:** Close the two deferred items from PR-WV1-1 + PR-WV1-2 — Invitation lifecycle (`INVITATION_ACCEPT` / `INVITATION_REVOKE` action kinds + composite member synthesis) and ActionItem CRUD (`ACTION_ITEM_UPDATE` / `ACTION_ITEM_REMOVE` action kinds + reducer + app wiring). Surface pending invites on Home (PWA) / dashboard (Azure) via a new `<PendingInvitesBanner>` component.

**Architecture:** `MembershipAction` already exists with 3 `PROJECT_MEMBER_*` kinds + a working `reduceProjectMembers` reducer. PR-WV1-3a extends the union with 2 invitation kinds + adds a `reduceProjectMembers` case for `INVITATION_ACCEPT` that emits a synthesized `ProjectMember` (composite action). `ActionItemAction` ships today with only 1 kind and **no reducer**; PR-WV1-3a adds the 2 missing kinds + a fresh `reduceActionItems` reducer. Store wiring: `useProjectMembershipStore.acceptInvite/revokeInvite` re-routes — the Zustand action methods now call `useImprovementProjectStore.upsertProject(...)` directly with the new member appended (per the codebase's existing direct-Zustand pattern; there is no central dispatch loop).

**Tech Stack:** TypeScript + React 18 + Zustand + Vitest + React Testing Library.

**Canonical spec:** [`docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md`](../specs/2026-05-16-pr-wv1-3-measurement-plans-design.md) §"PR-WV1-3a — Membership cleanup + ActionItem CRUD" + §"Acceptance criteria" #1-6.

---

## Branch setup

Worktree at `/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans`, branch `feat/wedge-pr-wv1-3-measurement-plans`. Top commit `618bd733` (design spec); 1 commit ahead of PR-WV1-2's HEAD `eb28ad60`. pnpm install completed.

Verify:

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans branch --show-current
# expect: feat/wedge-pr-wv1-3-measurement-plans

git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans log --oneline -3
# expect top commit: 618bd733 docs(specs): PR-WV1-3 MeasurementPlan + Invitation lifecycle + ActionItem CRUD design
```

---

## Foundation already in place

**`MembershipAction` union (from PR-WV1-1 + PR-WV1-2)** at `packages/core/src/projectMembership/actions.ts`:

```typescript
export type MembershipAction =
  | { kind: 'PROJECT_MEMBER_ADD'; projectId: ImprovementProject['id']; member: ProjectMember }
  | {
      kind: 'PROJECT_MEMBER_UPDATE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
      patch: ProjectMemberPatch;
    }
  | {
      kind: 'PROJECT_MEMBER_REMOVE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
    };

export type ProjectMemberPatch = Partial<
  Omit<ProjectMember, 'id' | 'createdAt' | 'deletedAt' | 'userId' | 'invitedAt'>
>;

export function reduceProjectMembers(
  state: ProjectMember[],
  action: MembershipAction
): ProjectMember[] {
  switch (action.kind) {
    case 'PROJECT_MEMBER_ADD':
      return [...state, action.member];
    case 'PROJECT_MEMBER_UPDATE':
      return state.map(m => (m.id === action.memberId ? { ...m, ...action.patch } : m));
    case 'PROJECT_MEMBER_REMOVE':
      return state.filter(m => m.id !== action.memberId);
  }
}
```

**`Invitation` interface** at `packages/core/src/projectMembership/types.ts`:

```typescript
export interface Invitation extends EntityBase {
  projectId: ImprovementProject['id'];
  userId: string;
  displayName: string;
  role: ProjectRole;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: number;
  revokedAt?: number;
}
```

**`useProjectMembershipStore`** at `packages/stores/src/useProjectMembershipStore.ts` — current `acceptInvite`/`revokeInvite` just filter from `pendingInvites[]`:

```typescript
acceptInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
revokeInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
```

**`ActionItemAction` (stub)** at `packages/core/src/actions/actionItemActions.ts`:

```typescript
export type ActionItemAction = {
  kind: 'ACTION_ITEM_ADD';
  hubId: ProcessHub['id'];
  actionItem: ActionItem;
};
```

No reducer exists for `ActionItem` yet — PR-WV1-3a creates one.

**`ImprovementProjectStore`** at `packages/stores/src/improvementProjectStore.ts` — canonical IP write path:

```typescript
export interface ImprovementProjectStoreActions {
  setProjectsForHub: (hubId: ProcessHub['id'], projects: ImprovementProject[]) => void;
  getProjectsForHub: (hubId: ProcessHub['id']) => ImprovementProject[];
  upsertProject: (project: ImprovementProject) => void;
  removeProject: (projectId: ImprovementProject['id']) => void;
}
```

`upsertProject` is the canonical path for mutating IP data (members, actions, etc.) — Task 3 + 6 use it.

**`<ImprovementView>` console.warn stubs from PR-WV1-2:**

- **PWA** `apps/pwa/src/components/views/ImprovementView.tsx` lines 49, 52, 55 — `onActionAdd`/`onActionUpdate`/`onActionRemove` stubs
- **Azure** `apps/azure/src/pages/Editor.tsx` lines 1888, 1892, 1898 — same three stubs inside the `activeView === 'improvement'` branch

**Home screen + Azure dashboard mount points** (scout-discovered):

- **PWA** `apps/pwa/src/components/HomeScreen.tsx` — React component, lazy-mounted in `App.tsx:94` as `HomeScreen`
- **Azure** has no dedicated Home component; the dashboard lives in tabbed Editor (`Editor.tsx`). Banner mounts in the Editor layout chrome (Task 5 picks the exact spot).

---

## Architecture notes (scout-driven adaptations)

The design spec said "dispatch INVITATION_ACCEPT through the canonical project-store dispatch path." Reconnaissance confirmed **there is no central dispatch loop in this codebase**. Zustand stores use direct action methods (`upsertProject`, etc.). PR-WV1-3a adapts:

1. **Composite action handling in the store, not the reducer.** `useProjectMembershipStore.acceptInvite(id)`:
   - Reads the invitation from `pendingInvites[]`
   - Calls `useImprovementProjectStore.getState().upsertProject(...)` with a new `members[]` that includes the synthesized member from the invitation
   - Filters the invitation out of `pendingInvites[]`
   - The `reduceProjectMembers` reducer's INVITATION_ACCEPT case is the SHAPE — it appends a synthesized member to the members[] state. The store uses it via `reduceProjectMembers(currentMembers, { kind: 'INVITATION_ACCEPT', ... })` to derive the next `members[]`.

2. **Invitation persistence stays transient for V1.** No `invitations?: Invitation[]` field added to `ImprovementProjectMetadata` in this PR. Pending invites live in `useProjectMembershipStore.pendingInvites[]` + localStorage only. Implication: an invitee on a different browser does NOT see their invites in-app — they rely on the wedge spec §4.2 "in-app + email notification" via the email half. Documented as V1 limitation; durable cross-device invitations tracked as `docs/investigations.md` follow-up.

3. **Azure banner mounts in Editor layout chrome**, not a dedicated Home component. PWA mounts in `HomeScreen.tsx` above the active-IP launchpad. Both use the same `<PendingInvitesBanner>` component from `@variscout/ui`.

---

## File structure

**Create:**

- `packages/ui/src/components/Home/PendingInvitesBanner.tsx`
- `packages/ui/src/components/Home/__tests__/PendingInvitesBanner.test.tsx`
- `packages/ui/src/components/Home/index.ts` (barrel)

**Modify:**

- `packages/core/src/projectMembership/actions.ts` — extend `MembershipAction` union + extend `reduceProjectMembers`
- `packages/core/src/projectMembership/__tests__/actions.test.ts` — add tests for INVITATION_ACCEPT + INVITATION_REVOKE
- `packages/core/src/actions/actionItemActions.ts` — extend `ActionItemAction` union + add `reduceActionItems`
- `packages/core/src/actions/__tests__/actionItemActions.test.ts` (NEW file alongside existing tests in this dir)
- `packages/stores/src/useProjectMembershipStore.ts` — re-wire `acceptInvite/revokeInvite` to dispatch through `useImprovementProjectStore.upsertProject`
- `packages/stores/src/__tests__/useProjectMembershipStore.test.ts` — update tests for the new dispatch behavior
- `packages/ui/src/index.ts` — re-export `./components/Home`
- `apps/pwa/src/components/views/ImprovementView.tsx` — replace 3 console.warn stubs with real dispatches
- `apps/azure/src/pages/Editor.tsx` — same 3 stubs in the improvement branch
- `apps/pwa/src/components/HomeScreen.tsx` — mount `<PendingInvitesBanner>` above the launchpad
- `apps/azure/src/pages/Editor.tsx` (dashboard chrome) — mount `<PendingInvitesBanner>` (same component)

**Sub-path exports unchanged** — `Home/` barrel ships through existing `@variscout/ui` top-level barrel.

---

## Task 1 — `INVITATION_ACCEPT` + `INVITATION_REVOKE` action kinds + reducer extension

**Goal:** Extend `MembershipAction` with 2 invitation lifecycle kinds. `reduceProjectMembers` handles `INVITATION_ACCEPT` by appending a synthesized `ProjectMember` (composite action: the invitation's fields become a real member). `INVITATION_REVOKE` is a no-op at the members[] level (invitation status transitions happen in the store layer).

**Files:**

- Modify: `packages/core/src/projectMembership/actions.ts`
- Test: `packages/core/src/projectMembership/__tests__/actions.test.ts`

### Steps

- [ ] **Step 1: Write the failing test**

Append to `packages/core/src/projectMembership/__tests__/actions.test.ts`:

```typescript
describe('reduceProjectMembers — INVITATION_ACCEPT', () => {
  it('appends a synthesized ProjectMember built from the invitation', () => {
    const existingMembers: ProjectMember[] = [];
    const inv: Invitation = {
      id: 'inv-1',
      projectId: 'ip-1',
      createdAt: 100,
      deletedAt: null,
      userId: 'mira@org',
      displayName: 'Mira',
      role: 'member',
      invitedAt: 100,
      status: 'pending',
    };
    const action: MembershipAction = {
      kind: 'INVITATION_ACCEPT',
      projectId: 'ip-1',
      invitation: inv,
      acceptedAt: 200,
    };
    const next = reduceProjectMembers(existingMembers, action);
    expect(next).toHaveLength(1);
    expect(next[0].userId).toBe('mira@org');
    expect(next[0].displayName).toBe('Mira');
    expect(next[0].role).toBe('member');
    expect(next[0].invitedAt).toBe(100);
    expect(next[0].acceptedAt).toBe(200);
    expect(next[0].id).toBeDefined();
    expect(next[0].createdAt).toBe(200);
    expect(next[0].deletedAt).toBeNull();
  });
});

describe('reduceProjectMembers — INVITATION_REVOKE', () => {
  it('does not mutate members[] (invitation status transitions are store-level)', () => {
    const existingMembers: ProjectMember[] = [
      {
        id: 'pm-1',
        createdAt: 1,
        deletedAt: null,
        userId: 'pat@org',
        displayName: 'Pat',
        role: 'lead',
        invitedAt: 1,
      },
    ];
    const action: MembershipAction = {
      kind: 'INVITATION_REVOKE',
      projectId: 'ip-1',
      invitationId: 'inv-1',
      revokedAt: 200,
    };
    const next = reduceProjectMembers(existingMembers, action);
    expect(next).toEqual(existingMembers);
  });
});
```

Imports at the top of the file should already cover `Invitation`, `MembershipAction`, `ProjectMember`, `reduceProjectMembers`. Verify and add any missing ones.

- [ ] **Step 2: Run the test to verify FAIL**

```bash
pnpm --filter @variscout/core test -- projectMembership/__tests__/actions
```

Expected: FAIL — `MembershipAction` doesn't include `INVITATION_ACCEPT` or `INVITATION_REVOKE` kinds; TypeScript compile error on the test's action literal.

- [ ] **Step 3: Extend `MembershipAction` union + add reducer cases**

In `packages/core/src/projectMembership/actions.ts`, replace the existing `MembershipAction` union with the extended 5-kind version:

```typescript
import { generateDeterministicId } from '../identity';
import type { Invitation } from './types';
// (other existing imports unchanged)

export type MembershipAction =
  | { kind: 'PROJECT_MEMBER_ADD'; projectId: ImprovementProject['id']; member: ProjectMember }
  | {
      kind: 'PROJECT_MEMBER_UPDATE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
      patch: ProjectMemberPatch;
    }
  | {
      kind: 'PROJECT_MEMBER_REMOVE';
      projectId: ImprovementProject['id'];
      memberId: ProjectMember['id'];
    }
  | {
      kind: 'INVITATION_ACCEPT';
      projectId: ImprovementProject['id'];
      invitation: Invitation;
      acceptedAt: number;
    }
  | {
      kind: 'INVITATION_REVOKE';
      projectId: ImprovementProject['id'];
      invitationId: Invitation['id'];
      revokedAt: number;
    };

export function reduceProjectMembers(
  state: ProjectMember[],
  action: MembershipAction
): ProjectMember[] {
  switch (action.kind) {
    case 'PROJECT_MEMBER_ADD':
      return [...state, action.member];
    case 'PROJECT_MEMBER_UPDATE':
      return state.map(m => (m.id === action.memberId ? { ...m, ...action.patch } : m));
    case 'PROJECT_MEMBER_REMOVE':
      return state.filter(m => m.id !== action.memberId);
    case 'INVITATION_ACCEPT': {
      const synthesizedMember: ProjectMember = {
        id: generateDeterministicId(),
        createdAt: action.acceptedAt,
        deletedAt: null,
        userId: action.invitation.userId,
        displayName: action.invitation.displayName,
        role: action.invitation.role,
        invitedAt: action.invitation.invitedAt,
        acceptedAt: action.acceptedAt,
      };
      return [...state, synthesizedMember];
    }
    case 'INVITATION_REVOKE':
      return state;
  }
}
```

`generateDeterministicId` is in `packages/core/src/identity.ts` — adds it to imports. Confirm by reading the file before editing.

- [ ] **Step 4: Run the test to verify PASS**

```bash
pnpm --filter @variscout/core test -- projectMembership/__tests__/actions
```

Expected: PASS for both new tests; the 4 existing reducer tests still green.

- [ ] **Step 5: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add packages/core/src/projectMembership/actions.ts packages/core/src/projectMembership/__tests__/actions.test.ts
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(core): add INVITATION_ACCEPT + INVITATION_REVOKE to MembershipAction"
```

---

## Task 2 — `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` action kinds + `reduceActionItems` reducer

**Goal:** Extend the stub `ActionItemAction` (currently single-kind `ACTION_ITEM_ADD`) with `UPDATE` + `REMOVE` kinds. Create the missing `reduceActionItems` reducer that handles all 3 kinds. `REMOVE` is a soft-delete (`deletedAt: removedAt`). Patch type omits id + createdAt + deletedAt + parentImprovementProjectId per `feedback_action_patch_omit_lifecycle`.

**Files:**

- Modify: `packages/core/src/actions/actionItemActions.ts`
- Create: `packages/core/src/actions/__tests__/actionItemActions.test.ts` (or extend if a peer test exists)

### Steps

- [ ] **Step 1: Verify existing `ActionItemAction` shape**

```bash
cat /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans/packages/core/src/actions/actionItemActions.ts
ls /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans/packages/core/src/actions/__tests__/ 2>&1
```

Expected output of the source file:

```typescript
export type ActionItemAction = {
  kind: 'ACTION_ITEM_ADD';
  hubId: ProcessHub['id'];
  actionItem: ActionItem;
};
```

If there is no `actionItemActions.test.ts` in `__tests__/`, this task creates it. If one exists, append to it.

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/actions/__tests__/actionItemActions.test.ts` (or append):

```typescript
import { describe, it, expect } from 'vitest';
import {
  reduceActionItems,
  type ActionItemAction,
  type ActionItemPatch,
} from '../actionItemActions';
import type { ActionItem } from '../../findings/types';

const baseAction: ActionItem = {
  id: 'ai-1',
  createdAt: 100,
  deletedAt: null,
  text: 'Run a pilot on Line 3',
  parentImprovementProjectId: 'ip-1',
  status: 'open',
};

describe('reduceActionItems — ACTION_ITEM_ADD', () => {
  it('appends a new action', () => {
    const next = reduceActionItems([], {
      kind: 'ACTION_ITEM_ADD',
      hubId: 'hub-1',
      actionItem: baseAction,
    });
    expect(next).toEqual([baseAction]);
  });
});

describe('reduceActionItems — ACTION_ITEM_UPDATE', () => {
  it('merges patch onto the matched action', () => {
    const start: ActionItem[] = [baseAction];
    const patch: ActionItemPatch = { status: 'done', text: 'Pilot complete' };
    const next = reduceActionItems(start, {
      kind: 'ACTION_ITEM_UPDATE',
      actionItemId: 'ai-1',
      patch,
    });
    expect(next).toHaveLength(1);
    expect(next[0].status).toBe('done');
    expect(next[0].text).toBe('Pilot complete');
    expect(next[0].id).toBe('ai-1');
    expect(next[0].createdAt).toBe(100);
  });

  it('leaves non-matching actions unchanged', () => {
    const otherAction = { ...baseAction, id: 'ai-2', text: 'Other' };
    const next = reduceActionItems([baseAction, otherAction], {
      kind: 'ACTION_ITEM_UPDATE',
      actionItemId: 'ai-1',
      patch: { status: 'done' },
    });
    expect(next[1]).toEqual(otherAction);
  });
});

describe('reduceActionItems — ACTION_ITEM_REMOVE', () => {
  it('soft-deletes the matched action (sets deletedAt)', () => {
    const next = reduceActionItems([baseAction], {
      kind: 'ACTION_ITEM_REMOVE',
      actionItemId: 'ai-1',
      removedAt: 200,
    });
    expect(next).toHaveLength(1);
    expect(next[0].deletedAt).toBe(200);
    expect(next[0].id).toBe('ai-1');
    expect(next[0].text).toBe(baseAction.text);
  });

  it('does not mutate input', () => {
    const start: ActionItem[] = [baseAction];
    reduceActionItems(start, {
      kind: 'ACTION_ITEM_REMOVE',
      actionItemId: 'ai-1',
      removedAt: 200,
    });
    expect(start[0].deletedAt).toBeNull();
  });
});

describe('ActionItemPatch', () => {
  it('forbids changing id / createdAt / deletedAt / parentImprovementProjectId at the type level', () => {
    // @ts-expect-error id is in the Omit list
    const _patch1: ActionItemPatch = { id: 'ai-99' };
    // @ts-expect-error createdAt is in the Omit list
    const _patch2: ActionItemPatch = { createdAt: 999 };
    // @ts-expect-error deletedAt is in the Omit list
    const _patch3: ActionItemPatch = { deletedAt: 999 };
    // @ts-expect-error parentImprovementProjectId is in the Omit list
    const _patch4: ActionItemPatch = { parentImprovementProjectId: 'ip-other' };
    // Allowed: status, text, dueAt, etc.
    const _patch5: ActionItemPatch = { status: 'done', text: 'updated' };
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify FAIL**

```bash
pnpm --filter @variscout/core test -- actions/__tests__/actionItemActions
```

Expected: FAIL — `reduceActionItems` not exported; `ACTION_ITEM_UPDATE`/`REMOVE` kinds not in union; `ActionItemPatch` type not exported.

- [ ] **Step 4: Implement the reducer + extend the union**

Replace the body of `packages/core/src/actions/actionItemActions.ts` with:

```typescript
import type { ProcessHub } from '../processHub';
import type { ActionItem } from '../findings/types';

export type ActionItemPatch = Partial<
  Omit<ActionItem, 'id' | 'createdAt' | 'deletedAt' | 'parentImprovementProjectId'>
>;

export type ActionItemAction =
  | { kind: 'ACTION_ITEM_ADD'; hubId: ProcessHub['id']; actionItem: ActionItem }
  | { kind: 'ACTION_ITEM_UPDATE'; actionItemId: ActionItem['id']; patch: ActionItemPatch }
  | { kind: 'ACTION_ITEM_REMOVE'; actionItemId: ActionItem['id']; removedAt: number };

export function reduceActionItems(state: ActionItem[], action: ActionItemAction): ActionItem[] {
  switch (action.kind) {
    case 'ACTION_ITEM_ADD':
      return [...state, action.actionItem];
    case 'ACTION_ITEM_UPDATE':
      return state.map(a => (a.id === action.actionItemId ? { ...a, ...action.patch } : a));
    case 'ACTION_ITEM_REMOVE':
      return state.map(a =>
        a.id === action.actionItemId ? { ...a, deletedAt: action.removedAt } : a
      );
  }
}
```

Verify import paths by running `pnpm --filter @variscout/core test -- actionItemActions` after edit — any path errors surface immediately.

- [ ] **Step 5: Run the test to verify PASS**

```bash
pnpm --filter @variscout/core test -- actions/__tests__/actionItemActions
```

Expected: PASS — all 7 test cases green (1 ADD + 2 UPDATE + 2 REMOVE + 1 type test).

- [ ] **Step 6: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add packages/core/src/actions/actionItemActions.ts packages/core/src/actions/__tests__/actionItemActions.test.ts
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(core): add ACTION_ITEM_UPDATE + ACTION_ITEM_REMOVE kinds + reduceActionItems"
```

---

## Task 3 — Re-wire `useProjectMembershipStore.acceptInvite` / `revokeInvite`

**Goal:** `acceptInvite(invitationId)` no longer just filters from `pendingInvites[]`. After this task:

1. Reads the invitation from `pendingInvites[]`
2. Calls `useImprovementProjectStore.upsertProject(...)` with the synthesized member appended to that project's `metadata.members[]` (uses `reduceProjectMembers` with INVITATION_ACCEPT to derive the new members[])
3. Filters the invitation out of `pendingInvites[]`

`revokeInvite(invitationId)` simply filters from `pendingInvites[]` (no member synthesis). Invitation status transition is lost without durable persistence — that's the V1 acceptable simplification per the architecture note.

**Files:**

- Modify: `packages/stores/src/useProjectMembershipStore.ts`
- Test: `packages/stores/src/__tests__/useProjectMembershipStore.test.ts`

### Steps

- [ ] **Step 1: Write the failing test**

Append to `packages/stores/src/__tests__/useProjectMembershipStore.test.ts`:

```typescript
import { useImprovementProjectStore } from '../improvementProjectStore';
import type { ImprovementProject } from '@variscout/core/improvementProject';

describe('useProjectMembershipStore — acceptInvite composite', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
    useImprovementProjectStore.setState({ projectsByHub: {} });
  });

  it('synthesizes a ProjectMember on the target IP and removes the invite from pendingInvites', () => {
    const targetProject: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Test', members: [] },
      goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.5, target: 1.33 } },
      sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
    };
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', [targetProject]);
    const inv: Invitation = {
      id: 'inv-1',
      projectId: 'ip-1',
      createdAt: 100,
      deletedAt: null,
      userId: 'mira@org',
      displayName: 'Mira',
      role: 'member',
      invitedAt: 100,
      status: 'pending',
    };
    useProjectMembershipStore.getState().addPendingInvite(inv);

    useProjectMembershipStore.getState().acceptInvite('inv-1');

    // Pending invite removed
    expect(useProjectMembershipStore.getState().pendingInvites).toEqual([]);
    // Member appended to the target project
    const updated = useImprovementProjectStore.getState().getProjectsForHub('hub-1')[0];
    expect(updated.metadata.members).toHaveLength(1);
    expect(updated.metadata.members?.[0].userId).toBe('mira@org');
    expect(updated.metadata.members?.[0].role).toBe('member');
  });

  it('no-ops when the invitation does not exist in pendingInvites', () => {
    // Just verify no throw / no project mutation
    expect(() => useProjectMembershipStore.getState().acceptInvite('missing-id')).not.toThrow();
    expect(useImprovementProjectStore.getState().getProjectsForHub('hub-1')).toEqual([]);
  });

  it('no-ops when the target project is not in the store', () => {
    const inv: Invitation = {
      id: 'inv-1',
      projectId: 'ip-missing',
      createdAt: 100,
      deletedAt: null,
      userId: 'mira@org',
      displayName: 'Mira',
      role: 'member',
      invitedAt: 100,
      status: 'pending',
    };
    useProjectMembershipStore.getState().addPendingInvite(inv);
    useProjectMembershipStore.getState().acceptInvite('inv-1');
    // Invite still removed locally even if no project was updated
    expect(useProjectMembershipStore.getState().pendingInvites).toEqual([]);
  });
});

describe('useProjectMembershipStore — revokeInvite', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
  });

  it('removes the invite from pendingInvites', () => {
    const inv: Invitation = {
      id: 'inv-2',
      projectId: 'ip-1',
      createdAt: 100,
      deletedAt: null,
      userId: 'pat@org',
      displayName: 'Pat',
      role: 'lead',
      invitedAt: 100,
      status: 'pending',
    };
    useProjectMembershipStore.getState().addPendingInvite(inv);
    useProjectMembershipStore.getState().revokeInvite('inv-2');
    expect(useProjectMembershipStore.getState().pendingInvites).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify FAIL**

```bash
pnpm --filter @variscout/stores test -- useProjectMembershipStore
```

Expected: FAIL — the new "synthesizes a ProjectMember on the target IP" test fails because the current `acceptInvite` just filters. The other 2 (no-op when missing / revoke) pass already.

- [ ] **Step 3: Re-wire `acceptInvite` + `revokeInvite`**

In `packages/stores/src/useProjectMembershipStore.ts`, add imports + rewrite the two actions:

```typescript
import { reduceProjectMembers, type MembershipAction } from '@variscout/core/projectMembership';
import { useImprovementProjectStore } from './improvementProjectStore';

// Inside the create() factory, replace acceptInvite + revokeInvite:

acceptInvite: id =>
  set(s => {
    const invitation = s.pendingInvites.find(i => i.id === id);
    if (!invitation) return s;

    // Find the target project across all hub buckets
    const allProjects = Object.values(useImprovementProjectStore.getState().projectsByHub).flat();
    const target = allProjects.find(p => p.id === invitation.projectId);

    if (target) {
      const action: MembershipAction = {
        kind: 'INVITATION_ACCEPT',
        projectId: invitation.projectId,
        invitation,
        acceptedAt: Date.now(),
      };
      const currentMembers = target.metadata.members ?? [];
      const nextMembers = reduceProjectMembers(currentMembers, action);
      useImprovementProjectStore.getState().upsertProject({
        ...target,
        metadata: { ...target.metadata, members: nextMembers },
      });
    }

    return { pendingInvites: s.pendingInvites.filter(i => i.id !== id) };
  }),

revokeInvite: id =>
  set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
```

Verify `useImprovementProjectStore` has a `projectsByHub` field — read the actual state shape if uncertain. If the field is named differently (e.g., `projectsByHubId`), adapt.

- [ ] **Step 4: Run the test to verify PASS**

```bash
pnpm --filter @variscout/stores test -- useProjectMembershipStore
```

Expected: all 3 new tests pass; all existing tests still green.

- [ ] **Step 5: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add packages/stores/src/useProjectMembershipStore.ts packages/stores/src/__tests__/useProjectMembershipStore.test.ts
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(stores): wire acceptInvite to synthesize a ProjectMember on the target IP"
```

---

## Task 4 — `<PendingInvitesBanner>` component

**Goal:** Collapsed/expanded banner for pending invitations. Props: `{ invites: Invitation[]; onAccept: (id) => void; onDecline: (id) => void }`. Renders `null` when `invites.length === 0`. Mirror the test scaffolding pattern from PR-WV1-2's `<NoActiveProjectGuidance>` (peer in `packages/ui/src/components/Improve/__tests__/`).

**Files:**

- Create: `packages/ui/src/components/Home/PendingInvitesBanner.tsx`
- Create: `packages/ui/src/components/Home/__tests__/PendingInvitesBanner.test.tsx`
- Create: `packages/ui/src/components/Home/index.ts`
- Modify: `packages/ui/src/index.ts` (re-export the new barrel)

### Steps

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Home/__tests__/PendingInvitesBanner.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PendingInvitesBanner } from '../PendingInvitesBanner';
import type { Invitation } from '@variscout/core/projectMembership';

const inviteA: Invitation = {
  id: 'inv-A',
  projectId: 'ip-1',
  createdAt: 100,
  deletedAt: null,
  userId: 'mira@org',
  displayName: 'Mira',
  role: 'member',
  invitedAt: 100,
  status: 'pending',
};

const inviteB: Invitation = {
  id: 'inv-B',
  projectId: 'ip-2',
  createdAt: 200,
  deletedAt: null,
  userId: 'mira@org',
  displayName: 'Mira',
  role: 'sponsor',
  invitedAt: 200,
  status: 'pending',
};

describe('PendingInvitesBanner', () => {
  it('renders null when invites is empty', () => {
    const { container } = render(
      <PendingInvitesBanner invites={[]} onAccept={() => {}} onDecline={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a collapsed banner showing the invite count', () => {
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={() => {}} />);
    expect(screen.getByText(/1 pending invitation/i)).toBeInTheDocument();
  });

  it('uses plural copy for multiple invites', () => {
    render(
      <PendingInvitesBanner invites={[inviteA, inviteB]} onAccept={() => {}} onDecline={() => {}} />
    );
    expect(screen.getByText(/2 pending invitations/i)).toBeInTheDocument();
  });

  it('expands to show per-invite rows when the toggle is clicked', () => {
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={() => {}} />);
    // Collapsed: per-invite buttons not visible
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    // Click toggle
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    // Expanded: rows now visible
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('calls onAccept with the invite id', () => {
    const onAccept = vi.fn();
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={onAccept} onDecline={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledWith('inv-A');
  });

  it('calls onDecline with the invite id', () => {
    const onDecline = vi.fn();
    render(<PendingInvitesBanner invites={[inviteA]} onAccept={() => {}} onDecline={onDecline} />);
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(onDecline).toHaveBeenCalledWith('inv-A');
  });

  it('renders each invite with its role label', () => {
    render(
      <PendingInvitesBanner invites={[inviteA, inviteB]} onAccept={() => {}} onDecline={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /show invitations/i }));
    expect(screen.getByText(/member/i)).toBeInTheDocument();
    expect(screen.getByText(/sponsor/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify FAIL**

```bash
pnpm --filter @variscout/ui test -- PendingInvitesBanner
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/components/Home/PendingInvitesBanner.tsx`:

```tsx
import { useState } from 'react';
import type { Invitation } from '@variscout/core/projectMembership';

export interface PendingInvitesBannerProps {
  invites: Invitation[];
  onAccept: (id: Invitation['id']) => void;
  onDecline: (id: Invitation['id']) => void;
}

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  member: 'Member',
  sponsor: 'Sponsor',
};

export function PendingInvitesBanner({ invites, onAccept, onDecline }: PendingInvitesBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (invites.length === 0) return null;

  const headline = `${invites.length} pending invitation${invites.length === 1 ? '' : 's'}`;

  return (
    <section
      aria-label="Pending invitations"
      className="border border-edge rounded p-3 mb-4 bg-surface-secondary"
    >
      <header className="flex items-center justify-between">
        <span className="text-content text-sm font-medium">{headline}</span>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-content-secondary hover:text-content"
        >
          {expanded ? 'Hide invitations' : 'Show invitations'}
        </button>
      </header>

      {expanded && (
        <ul className="mt-3 divide-y divide-edge">
          {invites.map(inv => (
            <li key={inv.id} className="py-2 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-content truncate">{inv.projectId}</div>
                <div className="text-xs text-content-muted">{ROLE_LABEL[inv.role] ?? inv.role}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onAccept(inv.id)}
                  aria-label={`Accept ${inv.role} invitation`}
                  className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onDecline(inv.id)}
                  aria-label={`Decline ${inv.role} invitation`}
                  className="px-3 py-1 rounded text-xs text-content-secondary hover:bg-surface-secondary transition-colors"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify PASS**

```bash
pnpm --filter @variscout/ui test -- PendingInvitesBanner
```

Expected: 7/7 pass.

- [ ] **Step 5: Create the Home barrel + re-export from `@variscout/ui` root**

Create `packages/ui/src/components/Home/index.ts`:

```typescript
export { PendingInvitesBanner, type PendingInvitesBannerProps } from './PendingInvitesBanner';
```

Append to `packages/ui/src/index.ts` (find the existing `export * from './components/Improve'` line from PR-WV1-2 — alphabetical placement near it):

```typescript
export * from './components/Home';
```

- [ ] **Step 6: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add packages/ui/src/components/Home packages/ui/src/index.ts
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(ui): add PendingInvitesBanner component for Home + dashboard"
```

---

## Task 5 — Mount `<PendingInvitesBanner>` in PWA HomeScreen + Azure Editor

**Goal:** Both apps surface the banner above their primary landing surface. PWA mounts it in `HomeScreen.tsx`. Azure mounts it in `Editor.tsx`'s top-level layout chrome (above the tab content).

**Files:**

- Modify: `apps/pwa/src/components/HomeScreen.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: existing app-shell tests if any cover Home / Editor

### Steps

- [ ] **Step 1: Locate the mount points**

```bash
grep -n "HomeLaunchpadCard\|active.*IP.*launchpad\|currentUser" apps/pwa/src/components/HomeScreen.tsx | head -10
grep -n "<TabContent\|TopBar\|Layout\|ProjectsTabView" apps/azure/src/pages/Editor.tsx | head -15
```

Find the line where the active-IP launchpad mounts in PWA (banner goes above it) and the line in Azure where tab content is rendered (banner goes above the tab area).

- [ ] **Step 2: Write the failing test for PWA HomeScreen**

If `apps/pwa/src/components/__tests__/HomeScreen.test.tsx` exists, append. If not, create it with minimum scaffolding mirroring `ProjectsTabView.test.tsx` from PR-WV1-1:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from '../HomeScreen';
import { useProjectMembershipStore } from '@variscout/stores';

describe('HomeScreen — PendingInvitesBanner integration', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState({ pendingInvites: [] });
  });

  it('does not render the banner when there are no pending invites', () => {
    render(<HomeScreen /* required props from peer */ />);
    expect(screen.queryByLabelText(/pending invitations/i)).not.toBeInTheDocument();
  });

  it('renders the banner when pending invites exist', () => {
    useProjectMembershipStore.setState({
      pendingInvites: [
        {
          id: 'inv-1',
          projectId: 'ip-1',
          createdAt: 1,
          deletedAt: null,
          userId: 'mira@org',
          displayName: 'Mira',
          role: 'member',
          invitedAt: 1,
          status: 'pending',
        },
      ],
    });
    render(<HomeScreen /* required props from peer */ />);
    expect(screen.getByLabelText(/pending invitations/i)).toBeInTheDocument();
    expect(screen.getByText(/1 pending invitation/i)).toBeInTheDocument();
  });
});
```

If `HomeScreen` requires specific props, read 1-2 existing renders of it in `App.tsx` and mirror.

- [ ] **Step 3: Run to verify FAIL**

```bash
pnpm --filter @variscout/pwa test -- HomeScreen
```

Expected: FAIL — banner not rendered.

- [ ] **Step 4: Wire `<PendingInvitesBanner>` into HomeScreen**

Edit `apps/pwa/src/components/HomeScreen.tsx`. Add imports at the top:

```typescript
import { PendingInvitesBanner } from '@variscout/ui';
import { useProjectMembershipStore } from '@variscout/stores';
```

Inside the component body, read pending invites + render the banner above the existing launchpad section:

```tsx
const pendingInvites = useProjectMembershipStore(s => s.pendingInvites);
const acceptInvite = useProjectMembershipStore(s => s.acceptInvite);
const revokeInvite = useProjectMembershipStore(s => s.revokeInvite);

// In the JSX, place ABOVE the active-IP launchpad block:
<PendingInvitesBanner invites={pendingInvites} onAccept={acceptInvite} onDecline={revokeInvite} />;
```

Use selectors per `packages/stores/CLAUDE.md` hard rule — never bare `useProjectMembershipStore()`.

- [ ] **Step 5: Run PWA tests to verify PASS**

```bash
pnpm --filter @variscout/pwa test -- HomeScreen
```

Expected: both tests pass.

- [ ] **Step 6: Wire `<PendingInvitesBanner>` into Azure Editor**

Edit `apps/azure/src/pages/Editor.tsx`. Add same imports near the top. Find the top-level Editor layout — the chrome that wraps all tab content. Place `<PendingInvitesBanner>` above the tab content area (a Tailwind flex column ancestor of the tab switcher).

```tsx
const pendingInvites = useProjectMembershipStore(s => s.pendingInvites);
const acceptInvite = useProjectMembershipStore(s => s.acceptInvite);
const revokeInvite = useProjectMembershipStore(s => s.revokeInvite);

// In the Editor's JSX, ABOVE the tab content area:
<PendingInvitesBanner invites={pendingInvites} onAccept={acceptInvite} onDecline={revokeInvite} />;
```

If Azure has an existing Editor test, add a similar visibility test. If not, run the existing test suite to confirm no regressions.

- [ ] **Step 7: Run Azure tests**

```bash
pnpm --filter @variscout/azure-app test -- Editor
```

Expected: existing tests still green (the banner render-when-no-invites case is null so doesn't break layout).

- [ ] **Step 8: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add apps/pwa/src/components/HomeScreen.tsx apps/azure/src/pages/Editor.tsx apps/pwa/src/components/__tests__/
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(apps): mount PendingInvitesBanner above Home + Azure Editor"
```

---

## Task 6 — Replace `console.warn` stubs in `<ImprovementView>` with real ActionItem dispatches

**Goal:** PWA + Azure `<ImprovementView>` consumed `<ImproveTabRoot>`'s 3 callbacks but stubbed update/remove with `console.warn`. After this task, the stubs are gone — real Zustand mutations + `reduceActionItems` applications flow through `useImprovementProjectStore.upsertProject`.

**Files:**

- Modify: `apps/pwa/src/components/views/ImprovementView.tsx` (lines 49, 52, 55)
- Modify: `apps/azure/src/pages/Editor.tsx` (lines 1888, 1892, 1898)

### Steps

- [ ] **Step 1: Read the current stub blocks**

```bash
sed -n '40,70p' apps/pwa/src/components/views/ImprovementView.tsx
sed -n '1880,1910p' apps/azure/src/pages/Editor.tsx
```

Confirm the exact shape of the 3 callbacks + the `<ImproveTabRoot>` prop names.

- [ ] **Step 2: Write the failing test for PWA**

Append to `apps/pwa/src/components/views/__tests__/ImprovementView.test.tsx` (or create following peer pattern):

```typescript
import { reduceActionItems } from '@variscout/core/actions';
// ... existing imports

describe('ImprovementView — ActionItem dispatch', () => {
  it('dispatches ACTION_ITEM_ADD to the active project', () => {
    // Seed an active project + active IP context
    // Render ImprovementView via ImproveTabRoot path
    // Trigger onActionAdd from ImproveStage's "Add action" form
    // Assert: useImprovementProjectStore.getProjectsForHub returns the project with new action appended
  });

  it('dispatches ACTION_ITEM_REMOVE as a soft-delete', () => {
    // Seed a project with 1 existing action
    // Trigger onActionRemove
    // Assert: action's deletedAt is set; action still in actions[]
  });
});
```

Adapt the scaffolding to whatever existing pattern is in the test directory.

- [ ] **Step 3: Run to verify FAIL**

```bash
pnpm --filter @variscout/pwa test -- ImprovementView
```

Expected: FAIL — console.warn stubs don't mutate the store.

- [ ] **Step 4: Replace stubs in PWA `<ImprovementView>`**

Edit `apps/pwa/src/components/views/ImprovementView.tsx`. Replace the 3 stub callbacks (lines 49-55 area) with real dispatches:

```tsx
import { useImprovementProjectStore } from '@variscout/stores';
import { reduceActionItems, type ActionItemAction } from '@variscout/core/actions';
import { generateDeterministicId } from '@variscout/core/identity';
// (preserve existing imports)

const upsertProject = useImprovementProjectStore(s => s.upsertProject);

const applyAction = (action: ActionItemAction) => {
  if (!activeIP) return;
  const currentActions = activeIP.metadata.actions ?? [];
  const nextActions = reduceActionItems(currentActions, action);
  upsertProject({ ...activeIP, metadata: { ...activeIP.metadata, actions: nextActions } });
};

// In JSX:
<ImproveTabRoot
  activeIP={activeIP}
  actions={activeIP?.metadata.actions ?? []}
  currentUserId={PWA_USER_ID}
  onGoHome={onGoHome}
  onActionAdd={({ text, parentImprovementProjectId }) =>
    applyAction({
      kind: 'ACTION_ITEM_ADD',
      hubId: activeIP?.hubId ?? '',
      actionItem: {
        id: generateDeterministicId(),
        createdAt: Date.now(),
        deletedAt: null,
        text,
        parentImprovementProjectId,
        status: 'open',
      },
    })
  }
  onActionUpdate={(actionItemId, patch) =>
    applyAction({ kind: 'ACTION_ITEM_UPDATE', actionItemId, patch })
  }
  onActionRemove={actionItemId =>
    applyAction({ kind: 'ACTION_ITEM_REMOVE', actionItemId, removedAt: Date.now() })
  }
/>;
```

Verify by reading the current shape: `activeIP.metadata` may not yet have an `actions?: ActionItem[]` field. If it doesn't, this requires adding the field to `ImprovementProjectMetadata` — that's a `@variscout/core` change. Read `packages/core/src/improvementProject/types.ts` and confirm. If the field doesn't exist, add it as `actions?: ActionItem[]` (optional, parallel to `members?` and `team?`); update the `migrateImprovementProjectMetadata` helper or related round-trip code to preserve the field.

If `actions` lives somewhere else entirely (e.g., as a top-level repository table queried per-hub), use the appropriate store action instead of `upsertProject`. Confirm by grep `actionItems\b` across `packages/stores/src/` before committing.

- [ ] **Step 5: Run to verify PASS**

```bash
pnpm --filter @variscout/pwa test -- ImprovementView
```

Expected: tests pass.

- [ ] **Step 6: Replace stubs in Azure Editor**

Edit `apps/azure/src/pages/Editor.tsx` lines 1880-1910 area. Apply the same pattern: same `applyAction` helper inline OR extract to a hook if duplicated. Reuse the same imports.

Azure's `currentUserId` source per PR-WV1-1 is `currentUser?.email` (from EasyAuth). Verify and preserve.

- [ ] **Step 7: Run Azure tests**

```bash
pnpm --filter @variscout/azure-app test -- Editor
```

Expected: green.

- [ ] **Step 8: Commit**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add apps/pwa/src apps/azure/src packages/core/src/improvementProject
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "feat(apps): wire ActionItem dispatch through useImprovementProjectStore.upsertProject"
```

If you had to add `actions?: ActionItem[]` to `ImprovementProjectMetadata`, that change goes in a separate prior commit (`feat(core): add actions[] field to ImprovementProjectMetadata`) so the apps commit is clean.

---

## Task 7 — Final verification + decision-log amendment + PR open

**Goal:** Pre-PR check sweep + decision-log entry + PR open. The controller handles the `--chrome` walk + final reviews separately.

### Steps

- [ ] **Step 1: Run targeted test sweep**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans
pnpm --filter @variscout/core test 2>&1 | tail -5
pnpm --filter @variscout/stores test 2>&1 | tail -5
pnpm --filter @variscout/pwa test 2>&1 | tail -5
pnpm --filter @variscout/azure-app test 2>&1 | tail -5
pnpm --filter @variscout/ui test -- "Home|PendingInvitesBanner" 2>&1 | tail -10
pnpm --filter @variscout/ui test -- IPDetail 2>&1 | tail -10
pnpm --filter @variscout/ui test -- Improve 2>&1 | tail -10
```

Expected: all green. If `@variscout/ui` full suite still has the documented Canvas hang per MEMORY.md, run only the touched filters.

- [ ] **Step 2: Run `pnpm build`**

```bash
pnpm build 2>&1 | tail -10
```

Expected: 5/5 packages/apps green. Per `feedback_ui_build_before_merge`, catches cross-package type-export gaps.

- [ ] **Step 3: Run `pr-ready-check`**

```bash
bash scripts/pr-ready-check.sh 2>&1 | tail -30
```

Expected: green (architecture grep, ADR-074 boundary, lint, doc-health).

- [ ] **Step 4: Amend `docs/decision-log.md`**

Add an amendment block under the existing 2026-05-16 wedge entry, after the PR-WV1-2 amendment block but before the 2026-05-14 Projects-tab entry:

```markdown
**Amendment 2026-05-16 — PR-WV1-3a shipped (Invitation lifecycle + ActionItem CRUD).** Closes two deferred items from prior wedge PRs. (1) Invitation lifecycle: `MembershipAction` extended with `INVITATION_ACCEPT` (composite — synthesizes a `ProjectMember` from the Invitation via `reduceProjectMembers`) + `INVITATION_REVOKE` (no-op at members[] level; store filters from pendingInvites). `useProjectMembershipStore.acceptInvite/revokeInvite` re-wired: `acceptInvite` now finds the target IP in `useImprovementProjectStore` and dispatches via `upsertProject` with the new members[] array; both still filter from `pendingInvites[]`. Closes PR-WV1-1 decision-log item (a). (2) ActionItem CRUD: `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` action kinds added to `ActionItemAction`; new `reduceActionItems` reducer covers all 3 kinds. `REMOVE` is soft-delete (sets `deletedAt: removedAt`). PWA + Azure `<ImprovementView>` consumers now dispatch through `useImprovementProjectStore.upsertProject(...)` with `reduceActionItems`-derived new actions[]. Closes PR-WV1-2 Task 2 deferred CRUD. (3) New `<PendingInvitesBanner>` at `packages/ui/src/components/Home/`; mounted in PWA `HomeScreen.tsx` above the active-IP launchpad and in Azure `Editor.tsx` layout chrome above tab content. Renders null when zero pending invites. **V1 limitation logged**: invitations remain transient in `useProjectMembershipStore.pendingInvites[]` + localStorage; not persisted on `ImprovementProjectMetadata`. Implication: an invitee on a different browser does not see invites in-app — relies on the wedge spec §4.2 email notification half. Durable cross-device invitation persistence tracked as `docs/investigations.md` follow-up. **Still owed**: (c) per-user persistence key on `useProjectMembershipStore` → PR-WV1-5. MeasurementPlan + Wall integration → PR-WV1-3b (sequenced off this branch). Canonical artifacts: design spec `docs/superpowers/specs/2026-05-16-pr-wv1-3-measurement-plans-design.md`; plan `docs/superpowers/plans/2026-05-16-pr-wv1-3a-membership-cleanup.md`. _Amendment pinned 2026-05-16._
```

- [ ] **Step 5: Log the V1 invitation persistence limitation in `docs/investigations.md`**

Find the existing "Active investigations" section near the top of `docs/investigations.md`. Add a new entry after the PR-WV1-1 entry:

```markdown
### Durable cross-device invitation persistence

**Surfaced by:** PR-WV1-3a Implementation 2026-05-16.

**Description:** Invitations live transiently in `useProjectMembershipStore.pendingInvites[]` + localStorage. The inviter sees the invite locally; the invitee on a different browser does not. The wedge spec §4.2 "in-app + email notification" relies on the email half for cross-device delivery. For durable in-app multi-device delivery, invitations must persist somewhere tenant-scoped (`ImprovementProjectMetadata.invitations?: Invitation[]` field OR a tenant-wide invitation table).

**Possible directions:**

- Add `invitations?: Invitation[]` to `ImprovementProjectMetadata` (parallel to `members?`). Banner reads from a derived selector iterating all IPs for the current user. Cost: schema migration, .vrs round-trip, Dexie scheme bump.
- Tenant-wide invitation table in `azureHubRepository`. Cost: new repo path; PWA has no parallel.

**Promotion path:** Decision required if customer demand surfaces for multi-device invite UX. Track until PR-WV1-5 (tier-gating retirement + nav reorder, where auth-wiring refinement lands) — that PR is the natural place to revisit since per-user persistence keys (`useProjectMembershipStore`'s deferred item (c)) are also being addressed there.
```

- [ ] **Step 6: Commit the decision-log + investigations updates**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans add docs/decision-log.md docs/investigations.md
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans commit -m "docs(wedge): log PR-WV1-3a delivery + invitation persistence V2 follow-up"
```

- [ ] **Step 7: Push branch + open PR**

```bash
git -C /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-pr-wv1-3-measurement-plans push -u origin feat/wedge-pr-wv1-3-measurement-plans
gh pr create --base feat/wedge-pr-wv1-2-improve-workspace --title "feat(wedge): PR-WV1-3a membership lifecycle + ActionItem CRUD" \
  --body "$(cat <<'EOF'
## Summary

Closes the two deferred cleanup items from PR-WV1-1 + PR-WV1-2:
- **Invitation lifecycle:** `MembershipAction` extended with `INVITATION_ACCEPT` (composite — synthesizes `ProjectMember` via `reduceProjectMembers`) + `INVITATION_REVOKE`. `useProjectMembershipStore.acceptInvite` now dispatches the synthesized member through `useImprovementProjectStore.upsertProject`. Closes PR-WV1-1 deferred item (a).
- **ActionItem CRUD:** `ACTION_ITEM_UPDATE` + `ACTION_ITEM_REMOVE` action kinds + new `reduceActionItems` reducer. `REMOVE` is soft-delete. PWA + Azure `<ImprovementView>` console.warn stubs replaced with real dispatches. Closes PR-WV1-2 Task 2 deferred work.
- **`<PendingInvitesBanner>`** mounted above PWA Home launchpad and Azure Editor tab chrome. Renders null when zero invites.

## V1 limitation logged

Invitations remain transient (store + localStorage). Cross-device durable persistence tracked as `docs/investigations.md` V2 follow-up. PR-WV1-5 will revisit alongside per-user persistence key work.

## Test plan

- [x] pnpm test (per-package; full @variscout/ui suite has the documented Canvas hang)
- [x] pnpm build green
- [x] bash scripts/pr-ready-check.sh
- [ ] `--chrome` browser walk: invite + accept flow on PWA single-user (synthesized member appears on the target IP after accept)

## Sub-plan

`docs/superpowers/plans/2026-05-16-pr-wv1-3a-membership-cleanup.md`

## Next

PR-WV1-3b (MeasurementPlan + Wall integration) lands next on the same branch — opens against this PR's branch until it merges.
EOF
)"
```

GitHub will rebase the base when prior PRs merge.

---

## Verification

End-to-end:

1. **Action kinds:** `MembershipAction` has 5 variants; `ActionItemAction` has 3 variants. Both reducers handle every variant exhaustively.
2. **Composite acceptance:** `useProjectMembershipStore.acceptInvite('inv-x')` synthesizes a `ProjectMember` on the target IP via `upsertProject` AND filters from `pendingInvites[]`. Both atomic in one store update.
3. **Soft-delete:** `ACTION_ITEM_REMOVE` sets `deletedAt`; the action stays in `actions[]` for consumers that need historical reads.
4. **Banner:** renders zero on empty invites; collapsed banner on >0; expanded view shows per-row Accept/Decline.
5. **App wiring:** PWA + Azure `<ImprovementView>` dispatch real actions; no console.warn stubs remain.
6. **Tests:** core/stores/pwa/azure-app + ui touched suites all green; pnpm build green; pr-ready-check green.

---

## Self-review checklist

- [ ] **Spec coverage** — every acceptance-criterion item #1-6 in the design spec maps to a Task (1-6) in this plan.
- [ ] **Placeholder scan** — no TBD / TODO. Every code block has actual code.
- [ ] **Type consistency** — `MembershipAction`, `Invitation`, `ProjectMember`, `ActionItemAction`, `ActionItemPatch`, `PendingInvitesBannerProps` all named consistently across tasks.
- [ ] **TDD compliance** — every code-touching task has 5-step rhythm (test → fail → impl → pass → commit).
- [ ] **No `Math.random`** anywhere — including tests (use seeded helpers if randomness needed).
- [ ] **No "root cause" language** anywhere.
- [ ] **No `.toFixed()` on stat values** — irrelevant here, but enforced by ESLint.
- [ ] **Patch type Omit** — `ActionItemPatch` excludes `id | createdAt | deletedAt | parentImprovementProjectId` per `feedback_action_patch_omit_lifecycle`.
- [ ] **Selectors required** — PWA + Azure consumers use `useProjectMembershipStore(s => s.field)`, never bare `useProjectMembershipStore()`.
- [ ] **Sub-path exports** — no new sub-path; `Home/` flows through existing `packages/ui` barrel.
- [ ] **No `--no-verify`** — pre-commit hooks pass naturally.

---

## Deferred to later PRs

- **Durable invitation persistence** (`ImprovementProjectMetadata.invitations?: Invitation[]` + cross-device read selector) — V2 follow-up tracked in `docs/investigations.md`. Decision required if multi-device invite UX surfaces as a customer ask.
- **(c) per-user persistence key on `useProjectMembershipStore`** — still owed to PR-WV1-5 (tier-gating retirement + nav reorder).
- **MeasurementPlan + Wall integration (PR-WV1-3b)** — sequenced on the same branch; ships after PR-WV1-3a merges. Plan TBD via `superpowers:writing-plans` after this lands.
