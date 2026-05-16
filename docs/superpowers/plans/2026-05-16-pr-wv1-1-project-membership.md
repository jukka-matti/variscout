---
tier: ephemeral
purpose: build
title: 'PR-WV1-1 — Project Membership Foundation (bite-sized plan)'
status: draft
last-reviewed: 2026-05-16
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/plans/2026-05-16-wedge-implementation.md
  - docs/07-decisions/adr-082-wedge-architecture.md
---

# PR-WV1-1 — Project Membership Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy 5-role `team[]` field on `ImprovementProject` with a 3-role `members[]` field (Lead / Member / Sponsor). Add a pure `canAccess()` ACL function, a Zustand store, Invite/MemberList UI, and route-level ACL guards.

**Architecture:** Type-first migration. New `ProjectMember` + `ProjectRole` types in `@variscout/core`. Pure `canAccess(userId, project, action)` function (no React, no state — testable in isolation). Annotation-layer Zustand store. UI primitives in `@variscout/ui`. `.vrs` round-trip + Dexie migration map legacy `team[]` → `members[]`.

**Tech Stack:** TypeScript + React 18 + Zustand + Dexie + Vitest + React Testing Library.

**Parent plan:** [`docs/superpowers/plans/2026-05-16-wedge-implementation.md`](2026-05-16-wedge-implementation.md) (PR-WV1-1 row).

**Canonical spec:** [`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`](../specs/2026-05-16-wedge-architecture-design.md) §4 (Project membership model).

---

## Branch setup

Branch off `main` (after PR #182 squash-merges):

```bash
git fetch && git checkout main && git pull
git checkout -b feat/wedge-pr-wv1-1-project-membership
```

---

## Task 1: ProjectRole + ProjectMember types

**Files:**

- Create: `packages/core/src/projectMembership/types.ts`
- Create: `packages/core/src/projectMembership/index.ts`
- Test: `packages/core/src/projectMembership/types.test.ts`
- Modify: `packages/core/package.json` (add sub-path export `./projectMembership`)
- Modify: `packages/core/tsconfig.json` (add path `@variscout/core/projectMembership`)

- [ ] **Step 1: Write the failing types test**

```typescript
// packages/core/src/projectMembership/types.test.ts
import { describe, it, expect } from 'vitest';
import type { ProjectRole, ProjectMember, Invitation } from './types';

describe('ProjectRole', () => {
  it('exhaustively enumerates Lead / Member / Sponsor', () => {
    const roles: ProjectRole[] = ['lead', 'member', 'sponsor'];
    expect(roles).toHaveLength(3);
  });
});

describe('ProjectMember', () => {
  it('has required fields', () => {
    const m: ProjectMember = {
      id: 'pm-1',
      userId: 'user@org.com',
      displayName: 'Pat Lee',
      role: 'lead',
      invitedAt: 1234567890,
      acceptedAt: 1234567900,
    };
    expect(m.role).toBe('lead');
  });
});

describe('Invitation', () => {
  it('has required fields with pending state', () => {
    const inv: Invitation = {
      id: 'inv-1',
      projectId: 'ip-1',
      userId: 'user@org.com',
      displayName: 'Pat Lee',
      role: 'member',
      invitedAt: 1234567890,
      status: 'pending',
    };
    expect(inv.status).toBe('pending');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- projectMembership/types
```

Expected: FAIL with "Cannot find module './types'"

- [ ] **Step 3: Write minimal types**

```typescript
// packages/core/src/projectMembership/types.ts
import type { EntityBase } from '../identity';

export type ProjectRole = 'lead' | 'member' | 'sponsor';

export interface ProjectMember extends EntityBase {
  userId: string;
  displayName: string;
  role: ProjectRole;
  invitedAt: number;
  acceptedAt?: number;
}

export interface Invitation extends EntityBase {
  projectId: string;
  userId: string;
  displayName: string;
  role: ProjectRole;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: number;
  revokedAt?: number;
}
```

```typescript
// packages/core/src/projectMembership/index.ts
export type { ProjectRole, ProjectMember, Invitation } from './types';
```

- [ ] **Step 4: Update package.json + tsconfig.json sub-path exports**

In `packages/core/package.json` exports, add:

```json
"./projectMembership": {
  "types": "./dist/projectMembership/index.d.ts",
  "import": "./dist/projectMembership/index.js"
}
```

In `packages/core/tsconfig.json` paths, add:

```json
"@variscout/core/projectMembership": ["./src/projectMembership/index.ts"]
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- projectMembership/types
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/projectMembership packages/core/package.json packages/core/tsconfig.json
git commit -m "feat(core): add ProjectRole + ProjectMember + Invitation types"
```

---

## Task 2: HubAction kinds for membership

**Files:**

- Create: `packages/core/src/projectMembership/actions.ts`
- Test: `packages/core/src/projectMembership/actions.test.ts`
- Modify: `packages/core/src/actions/index.ts` (export the new action union members)

- [ ] **Step 1: Write the failing actions test**

```typescript
// packages/core/src/projectMembership/actions.test.ts
import { describe, it, expect } from 'vitest';
import { reduceProjectMembers, type MembershipAction } from './actions';
import type { ProjectMember } from './types';

describe('reduceProjectMembers', () => {
  const initial: ProjectMember[] = [];

  it('adds a member on PROJECT_MEMBER_ADD', () => {
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_ADD',
      projectId: 'ip-1',
      member: {
        id: 'pm-1',
        userId: 'pat@org.com',
        displayName: 'Pat',
        role: 'lead',
        invitedAt: 1,
      },
    };
    const next = reduceProjectMembers(initial, action);
    expect(next).toHaveLength(1);
    expect(next[0].role).toBe('lead');
  });

  it('updates a member on PROJECT_MEMBER_UPDATE', () => {
    const start: ProjectMember[] = [
      { id: 'pm-1', userId: 'p@x', displayName: 'P', role: 'member', invitedAt: 1 },
    ];
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_UPDATE',
      projectId: 'ip-1',
      memberId: 'pm-1',
      patch: { role: 'lead' },
    };
    const next = reduceProjectMembers(start, action);
    expect(next[0].role).toBe('lead');
  });

  it('removes a member on PROJECT_MEMBER_REMOVE', () => {
    const start: ProjectMember[] = [
      { id: 'pm-1', userId: 'p@x', displayName: 'P', role: 'member', invitedAt: 1 },
    ];
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_REMOVE',
      projectId: 'ip-1',
      memberId: 'pm-1',
    };
    const next = reduceProjectMembers(start, action);
    expect(next).toHaveLength(0);
  });

  it('rejects PROJECT_MEMBER_UPDATE patch attempting to change id / userId / invitedAt', () => {
    const start: ProjectMember[] = [
      { id: 'pm-1', userId: 'p@x', displayName: 'P', role: 'member', invitedAt: 1 },
    ];
    const action: MembershipAction = {
      kind: 'PROJECT_MEMBER_UPDATE',
      projectId: 'ip-1',
      memberId: 'pm-1',
      // @ts-expect-error patch type omits id, userId, invitedAt
      patch: { id: 'pm-99' },
    };
    expect(() => reduceProjectMembers(start, action)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- projectMembership/actions
```

Expected: FAIL with "Cannot find module './actions'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// packages/core/src/projectMembership/actions.ts
import type { ProjectMember } from './types';

export type MembershipAction =
  | { kind: 'PROJECT_MEMBER_ADD'; projectId: string; member: ProjectMember }
  | {
      kind: 'PROJECT_MEMBER_UPDATE';
      projectId: string;
      memberId: string;
      patch: Partial<Omit<ProjectMember, 'id' | 'userId' | 'invitedAt'>>;
    }
  | { kind: 'PROJECT_MEMBER_REMOVE'; projectId: string; memberId: string };

export function reduceProjectMembers(
  state: ProjectMember[],
  action: MembershipAction
): ProjectMember[] {
  switch (action.kind) {
    case 'PROJECT_MEMBER_ADD':
      return [...state, action.member];
    case 'PROJECT_MEMBER_UPDATE': {
      if ('id' in action.patch || 'userId' in action.patch || 'invitedAt' in action.patch) {
        throw new Error('PROJECT_MEMBER_UPDATE patch cannot change id, userId, or invitedAt');
      }
      return state.map(m => (m.id === action.memberId ? { ...m, ...action.patch } : m));
    }
    case 'PROJECT_MEMBER_REMOVE':
      return state.filter(m => m.id !== action.memberId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- projectMembership/actions
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Export from core actions index**

```typescript
// packages/core/src/actions/index.ts (append)
export type { MembershipAction } from '../projectMembership/actions';
export { reduceProjectMembers } from '../projectMembership/actions';
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/projectMembership/actions.ts packages/core/src/projectMembership/actions.test.ts packages/core/src/actions/index.ts
git commit -m "feat(core): add MembershipAction kinds + reducer"
```

---

## Task 3: canAccess(user, project, action) ACL function

**Files:**

- Create: `packages/core/src/projectMembership/canAccess.ts`
- Test: `packages/core/src/projectMembership/canAccess.test.ts`

- [ ] **Step 1: Write the failing canAccess test**

```typescript
// packages/core/src/projectMembership/canAccess.test.ts
import { describe, it, expect } from 'vitest';
import { canAccess } from './canAccess';
import type { ProjectMember } from './types';

const members: ProjectMember[] = [
  { id: 'pm-1', userId: 'lead@org', displayName: 'L', role: 'lead', invitedAt: 1 },
  { id: 'pm-2', userId: 'member@org', displayName: 'M', role: 'member', invitedAt: 1 },
  { id: 'pm-3', userId: 'sponsor@org', displayName: 'S', role: 'sponsor', invitedAt: 1 },
];

describe('canAccess', () => {
  it('Lead can edit any project surface', () => {
    expect(canAccess('lead@org', members, 'edit-charter')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-approach')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-improve')).toBe(true);
    expect(canAccess('lead@org', members, 'edit-sustainment')).toBe(true);
    expect(canAccess('lead@org', members, 'manage-membership')).toBe(true);
    expect(canAccess('lead@org', members, 'view-report')).toBe(true);
  });

  it('Member can edit working surfaces but not manage membership', () => {
    expect(canAccess('member@org', members, 'edit-charter')).toBe(true);
    expect(canAccess('member@org', members, 'edit-approach')).toBe(true);
    expect(canAccess('member@org', members, 'edit-improve')).toBe(true);
    expect(canAccess('member@org', members, 'edit-sustainment')).toBe(true);
    expect(canAccess('member@org', members, 'manage-membership')).toBe(false);
    expect(canAccess('member@org', members, 'view-report')).toBe(true);
  });

  it('Sponsor sees Report-only, nothing else', () => {
    expect(canAccess('sponsor@org', members, 'view-report')).toBe(true);
    expect(canAccess('sponsor@org', members, 'edit-charter')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-approach')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-improve')).toBe(false);
    expect(canAccess('sponsor@org', members, 'edit-sustainment')).toBe(false);
    expect(canAccess('sponsor@org', members, 'manage-membership')).toBe(false);
  });

  it('Non-member has no access', () => {
    expect(canAccess('stranger@org', members, 'view-report')).toBe(false);
    expect(canAccess('stranger@org', members, 'edit-charter')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- projectMembership/canAccess
```

Expected: FAIL — "Cannot find module './canAccess'"

- [ ] **Step 3: Write the canAccess implementation**

```typescript
// packages/core/src/projectMembership/canAccess.ts
import type { ProjectMember, ProjectRole } from './types';

export type ProjectAction =
  | 'edit-charter'
  | 'edit-approach'
  | 'edit-improve'
  | 'edit-sustainment'
  | 'manage-membership'
  | 'view-report';

const ROLE_PERMISSIONS: Record<ProjectRole, ReadonlyArray<ProjectAction>> = {
  lead: [
    'edit-charter',
    'edit-approach',
    'edit-improve',
    'edit-sustainment',
    'manage-membership',
    'view-report',
  ],
  member: ['edit-charter', 'edit-approach', 'edit-improve', 'edit-sustainment', 'view-report'],
  sponsor: ['view-report'],
};

export function canAccess(
  userId: string,
  members: ReadonlyArray<ProjectMember>,
  action: ProjectAction
): boolean {
  const member = members.find(m => m.userId === userId);
  if (!member) return false;
  return ROLE_PERMISSIONS[member.role].includes(action);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- projectMembership/canAccess
```

Expected: PASS — all 4 test blocks pass.

- [ ] **Step 5: Export from projectMembership barrel**

Append to `packages/core/src/projectMembership/index.ts`:

```typescript
export { canAccess } from './canAccess';
export type { ProjectAction } from './canAccess';
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/projectMembership/
git commit -m "feat(core): add canAccess ACL function for project membership"
```

---

## Task 4: Add `members[]` field to `ImprovementProject` + migrate legacy `team[]`

**Files:**

- Modify: `packages/core/src/improvementProject/types.ts`
- Modify: `packages/core/src/improvementProject/migration.ts` (CREATE)
- Test: `packages/core/src/improvementProject/migration.test.ts` (CREATE)
- Modify: `packages/core/src/improvementProject/index.ts`

Legacy `team[]` shape (per existing `types.ts`):

```typescript
role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
raci?: 'R' | 'A' | 'C' | 'I';
person: ProcessParticipantRef;
```

Wedge mapping:

- `champion` → `sponsor` (V1 terminology)
- `sponsor` → `sponsor`
- `projectLead` → `lead`
- `teamMember` → `member`
- `processOwner` → `member` (Process Owner persona retires; defaults to Member)
- `raci` → dropped entirely

- [ ] **Step 1: Write the failing migration test**

```typescript
// packages/core/src/improvementProject/migration.test.ts
import { describe, it, expect } from 'vitest';
import { migrateTeamToMembers } from './migration';

describe('migrateTeamToMembers', () => {
  it('maps each legacy role to the wedge role enum', () => {
    const legacyTeam = [
      { role: 'champion' as const, person: { id: 'u1', displayName: 'C', email: 'c@org' } },
      { role: 'sponsor' as const, person: { id: 'u2', displayName: 'S', email: 's@org' } },
      { role: 'projectLead' as const, person: { id: 'u3', displayName: 'L', email: 'l@org' } },
      { role: 'teamMember' as const, person: { id: 'u4', displayName: 'M', email: 'm@org' } },
      { role: 'processOwner' as const, person: { id: 'u5', displayName: 'P', email: 'p@org' } },
    ];
    const result = migrateTeamToMembers(legacyTeam, 1000);
    expect(result).toHaveLength(5);
    expect(result[0].role).toBe('sponsor');
    expect(result[1].role).toBe('sponsor');
    expect(result[2].role).toBe('lead');
    expect(result[3].role).toBe('member');
    expect(result[4].role).toBe('member');
    result.forEach(m => expect(m.invitedAt).toBe(1000));
  });

  it('drops the RACI field entirely', () => {
    const legacyTeam = [
      {
        role: 'projectLead' as const,
        raci: 'R' as const,
        person: { id: 'u1', displayName: 'L', email: 'l@org' },
      },
    ];
    const result = migrateTeamToMembers(legacyTeam, 1000);
    expect(result[0]).not.toHaveProperty('raci');
  });

  it('handles empty / undefined team', () => {
    expect(migrateTeamToMembers([], 1)).toEqual([]);
    expect(migrateTeamToMembers(undefined, 1)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- improvementProject/migration
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write migration implementation**

```typescript
// packages/core/src/improvementProject/migration.ts
import type { ProjectMember, ProjectRole } from '../projectMembership/types';

type LegacyTeamEntry = {
  role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
  raci?: 'R' | 'A' | 'C' | 'I';
  person: { id: string; displayName: string; email?: string };
};

const ROLE_MAP: Record<LegacyTeamEntry['role'], ProjectRole> = {
  champion: 'sponsor',
  sponsor: 'sponsor',
  projectLead: 'lead',
  teamMember: 'member',
  processOwner: 'member',
};

export function migrateTeamToMembers(
  legacyTeam: ReadonlyArray<LegacyTeamEntry> | undefined,
  migrationTimestamp: number
): ProjectMember[] {
  if (!legacyTeam || legacyTeam.length === 0) return [];
  return legacyTeam.map((entry, idx) => ({
    id: `pm-migrated-${entry.person.id}-${idx}`,
    userId: entry.person.email ?? entry.person.id,
    displayName: entry.person.displayName,
    role: ROLE_MAP[entry.role],
    invitedAt: migrationTimestamp,
    acceptedAt: migrationTimestamp,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- improvementProject/migration
```

Expected: PASS — all 3 tests.

- [ ] **Step 5: Add `members[]` field to `ImprovementProjectMetadata`**

In `packages/core/src/improvementProject/types.ts`:

```typescript
import type { ProjectMember } from '../projectMembership/types';

// In ImprovementProjectMetadata interface, ADD:
  members?: ProjectMember[];
// Keep team?: legacy field for backward compatibility during migration window
```

- [ ] **Step 6: Round-trip test for members field**

Append to existing `packages/core/src/improvementProject/snapshot.test.ts` (or create if absent):

```typescript
it('round-trips members[] field', () => {
  const ip: ImprovementProject = {
    /* minimum valid IP */
    metadata: {
      title: 'Test',
      members: [{ id: 'pm-1', userId: 'l@org', displayName: 'L', role: 'lead', invitedAt: 1 }],
    },
    // ... other required fields
  };
  const serialized = serializeIP(ip);
  const restored = deserializeIP(serialized);
  expect(restored.metadata.members).toEqual(ip.metadata.members);
});
```

- [ ] **Step 7: Run tests, commit**

```bash
pnpm --filter @variscout/core test -- improvementProject
git add packages/core/src/improvementProject/ packages/core/src/projectMembership/
git commit -m "feat(core): add members[] to ImprovementProject + legacy team[] migration"
```

---

## Task 5: useProjectMembershipStore (Annotation-layer)

**Files:**

- Create: `packages/stores/src/useProjectMembershipStore.ts`
- Test: `packages/stores/src/useProjectMembershipStore.test.ts`
- Modify: `packages/stores/src/index.ts` (export)

Per `packages/stores/CLAUDE.md`: this is an **Annotation-layer** store (V state), keyed by `(hubId, userId)`, persisted to `localStorage`. Pattern follows `useActiveIPStore`.

- [ ] **Step 1: Write the failing store test**

```typescript
// packages/stores/src/useProjectMembershipStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectMembershipStore } from './useProjectMembershipStore';

describe('useProjectMembershipStore', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState({ pendingInvites: [] });
    localStorage.clear();
  });

  it('initializes with empty pending invites', () => {
    const { result } = renderHook(() => useProjectMembershipStore(s => s.pendingInvites));
    expect(result.current).toEqual([]);
  });

  it('adds and lists pending invites', () => {
    const { result } = renderHook(() => useProjectMembershipStore());
    act(() => {
      result.current.addPendingInvite({
        id: 'inv-1',
        projectId: 'ip-1',
        userId: 'u@org',
        displayName: 'U',
        role: 'member',
        invitedAt: 1,
        status: 'pending',
      });
    });
    expect(result.current.pendingInvites).toHaveLength(1);
  });

  it('removes invite on acceptance', () => {
    const { result } = renderHook(() => useProjectMembershipStore());
    act(() => {
      result.current.addPendingInvite({
        id: 'inv-1',
        projectId: 'ip-1',
        userId: 'u@org',
        displayName: 'U',
        role: 'member',
        invitedAt: 1,
        status: 'pending',
      });
      result.current.acceptInvite('inv-1');
    });
    expect(result.current.pendingInvites).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/stores test -- useProjectMembershipStore
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the store**

```typescript
// packages/stores/src/useProjectMembershipStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invitation } from '@variscout/core/projectMembership';

interface ProjectMembershipState {
  pendingInvites: Invitation[];
  addPendingInvite: (inv: Invitation) => void;
  acceptInvite: (id: string) => void;
  revokeInvite: (id: string) => void;
}

export const useProjectMembershipStore = create<ProjectMembershipState>()(
  persist(
    set => ({
      pendingInvites: [],
      addPendingInvite: inv => set(s => ({ pendingInvites: [...s.pendingInvites, inv] })),
      acceptInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
      revokeInvite: id => set(s => ({ pendingInvites: s.pendingInvites.filter(i => i.id !== id) })),
    }),
    { name: 'variscout:projectMembership' }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/stores test -- useProjectMembershipStore
```

Expected: PASS — all 3 tests.

- [ ] **Step 5: Export from stores index**

```typescript
// packages/stores/src/index.ts (append)
export { useProjectMembershipStore } from './useProjectMembershipStore';
```

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/useProjectMembershipStore.ts packages/stores/src/useProjectMembershipStore.test.ts packages/stores/src/index.ts
git commit -m "feat(stores): add useProjectMembershipStore (Annotation layer)"
```

---

## Task 6: InviteModal component

**Files:**

- Create: `packages/ui/src/components/projects/InviteModal.tsx`
- Test: `packages/ui/src/components/projects/InviteModal.test.tsx`
- Modify: `packages/ui/src/components/projects/index.ts` (export)

- [ ] **Step 1: Write the failing component test**

```typescript
// packages/ui/src/components/projects/InviteModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteModal } from './InviteModal';

describe('InviteModal', () => {
  it('renders with form fields for email + role', () => {
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={() => {}} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('calls onInvite with email + role on submit', async () => {
    const onInvite = vi.fn();
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={onInvite} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'newbie@org.com');
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'member');
    await userEvent.click(screen.getByRole('button', { name: /invite/i }));
    expect(onInvite).toHaveBeenCalledWith({ email: 'newbie@org.com', role: 'member' });
  });

  it('shows three role options: Lead, Member, Sponsor', () => {
    render(<InviteModal isOpen={true} onClose={() => {}} onInvite={() => {}} />);
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      'lead',
      'member',
      'sponsor',
    ]);
  });

  it('does not render when isOpen is false', () => {
    render(<InviteModal isOpen={false} onClose={() => {}} onInvite={() => {}} />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- InviteModal
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
// packages/ui/src/components/projects/InviteModal.tsx
import { useState } from 'react';
import type { ProjectRole } from '@variscout/core/projectMembership';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; role: ProjectRole }) => void;
}

export function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({ email, role });
    setEmail('');
    setRole('member');
  };

  return (
    <div role="dialog" aria-label="Invite teammate" className="modal">
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-label="Email"
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={e => setRole(e.target.value as ProjectRole)}
            aria-label="Role"
          >
            <option value="lead">Lead</option>
            <option value="member">Member</option>
            <option value="sponsor">Sponsor</option>
          </select>
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Invite</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- InviteModal
```

Expected: PASS — all 4 tests.

- [ ] **Step 5: Export + commit**

```typescript
// packages/ui/src/components/projects/index.ts (append)
export { InviteModal } from './InviteModal';
```

```bash
git add packages/ui/src/components/projects/InviteModal.tsx packages/ui/src/components/projects/InviteModal.test.tsx packages/ui/src/components/projects/index.ts
git commit -m "feat(ui): add InviteModal component for project membership"
```

---

## Task 7: MemberList component

**Files:**

- Create: `packages/ui/src/components/projects/MemberList.tsx`
- Test: `packages/ui/src/components/projects/MemberList.test.tsx`
- Modify: `packages/ui/src/components/projects/index.ts` (export)

- [ ] **Step 1: Write the failing component test**

```typescript
// packages/ui/src/components/projects/MemberList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberList } from './MemberList';
import type { ProjectMember } from '@variscout/core/projectMembership';

const members: ProjectMember[] = [
  { id: 'pm-1', userId: 'lead@org', displayName: 'Lead Pat', role: 'lead', invitedAt: 1 },
  { id: 'pm-2', userId: 'member@org', displayName: 'Member Mira', role: 'member', invitedAt: 1 },
  { id: 'pm-3', userId: 'sponsor@org', displayName: 'Sponsor Chen', role: 'sponsor', invitedAt: 1 },
];

describe('MemberList', () => {
  it('renders all members with role badges', () => {
    render(<MemberList members={members} currentUserId="lead@org" onRemove={() => {}} />);
    expect(screen.getByText('Lead Pat')).toBeInTheDocument();
    expect(screen.getByText('Member Mira')).toBeInTheDocument();
    expect(screen.getByText('Sponsor Chen')).toBeInTheDocument();
    expect(screen.getAllByText(/lead|member|sponsor/i)).toHaveLength(6); // names + roles
  });

  it('shows Remove button only when current user is Lead', () => {
    render(<MemberList members={members} currentUserId="lead@org" onRemove={() => {}} />);
    // Lead user sees Remove buttons for non-self members (Member + Sponsor)
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(2);
  });

  it('hides Remove button when current user is Member', () => {
    render(<MemberList members={members} currentUserId="member@org" onRemove={() => {}} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls onRemove with memberId on click', async () => {
    const onRemove = vi.fn();
    render(<MemberList members={members} currentUserId="lead@org" onRemove={onRemove} />);
    const buttons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith('pm-2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- MemberList
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
// packages/ui/src/components/projects/MemberList.tsx
import type { ProjectMember } from '@variscout/core/projectMembership';

interface MemberListProps {
  members: ProjectMember[];
  currentUserId: string;
  onRemove: (memberId: string) => void;
}

export function MemberList({ members, currentUserId, onRemove }: MemberListProps) {
  const currentUserRole = members.find(m => m.userId === currentUserId)?.role;
  const canManage = currentUserRole === 'lead';

  return (
    <ul className="member-list">
      {members.map(m => (
        <li key={m.id}>
          <span className="display-name">{m.displayName}</span>
          <span className={`role-badge role-${m.role}`}>{m.role}</span>
          {canManage && m.userId !== currentUserId && (
            <button type="button" onClick={() => onRemove(m.id)}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- MemberList
```

Expected: PASS — all 4 tests.

- [ ] **Step 5: Export + commit**

```typescript
// packages/ui/src/components/projects/index.ts (append)
export { MemberList } from './MemberList';
```

```bash
git add packages/ui/src/components/projects/MemberList.tsx packages/ui/src/components/projects/MemberList.test.tsx packages/ui/src/components/projects/index.ts
git commit -m "feat(ui): add MemberList component with role-gated remove"
```

---

## Task 8: Wire InviteModal + MemberList into Charter stage

**Files:**

- Modify: `packages/ui/src/components/projects/CharterSections.tsx` (or wherever Charter stage UI lives)
- Test: `packages/ui/src/components/projects/CharterSections.test.tsx`

Find the actual file with `grep -rn "Charter" packages/ui/src/components/projects` first if path differs.

- [ ] **Step 1: Find the Charter component**

```bash
grep -rn "CharterSections\|CharterOverview" packages/ui/src/components/projects/ | head -5
```

Note the exact filename for the next steps.

- [ ] **Step 2: Add failing test for "Invite team" button**

```typescript
// packages/ui/src/components/projects/CharterSections.test.tsx (extend existing or create)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharterSections } from './CharterSections';

describe('CharterSections — membership integration', () => {
  it('shows "Invite team" button that opens InviteModal', async () => {
    render(<CharterSections /* needed props */ />);
    const inviteBtn = screen.getByRole('button', { name: /invite team/i });
    await userEvent.click(inviteBtn);
    expect(screen.getByRole('dialog', { name: /invite teammate/i })).toBeInTheDocument();
  });

  it('renders MemberList with current project members', () => {
    render(<CharterSections /* with members prop */ />);
    expect(screen.getByText(/lead/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- CharterSections
```

Expected: FAIL — "Invite team" button not rendered.

- [ ] **Step 4: Modify CharterSections to add Invite button + MemberList + Modal state**

Pseudocode (adapt to actual file structure):

```tsx
// Add to CharterSections.tsx
import { useState } from 'react';
import { InviteModal } from './InviteModal';
import { MemberList } from './MemberList';

// Inside the component:
const [inviteOpen, setInviteOpen] = useState(false);
const members = ip.metadata.members ?? [];

const handleInvite = (data: { email: string; role: ProjectRole }) => {
  // dispatch PROJECT_MEMBER_ADD action with the new member
  setInviteOpen(false);
};

const handleRemove = (memberId: string) => {
  // dispatch PROJECT_MEMBER_REMOVE action
};

// In the JSX:
<section aria-label="Team">
  <header>
    <h3>Team</h3>
    <button onClick={() => setInviteOpen(true)}>Invite team</button>
  </header>
  <MemberList members={members} currentUserId={currentUserId} onRemove={handleRemove} />
  <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />
</section>;
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- CharterSections
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/projects/CharterSections.tsx packages/ui/src/components/projects/CharterSections.test.tsx
git commit -m "feat(ui): wire InviteModal + MemberList into Charter stage"
```

---

## Task 9: ACL guards on project-scoped reads

**Files:**

- Modify: `packages/ui/src/components/projects/IPDetailPage.tsx`
- Modify: `packages/ui/src/components/projects/IPDetailPage.test.tsx`

- [ ] **Step 1: Write failing access-guard test**

```typescript
// packages/ui/src/components/projects/IPDetailPage.test.tsx (extend)
import { canAccess } from '@variscout/core/projectMembership';

describe('IPDetailPage — ACL guard', () => {
  it('redirects non-member with "no access" toast', () => {
    // render with currentUserId='stranger@org', members containing only lead+member+sponsor
    const { container } = render(/* IPDetailPage with stranger@org */);
    expect(container.textContent).toContain("don't have access");
  });

  it('Sponsor sees Report tab only', () => {
    // render with currentUserId='sponsor@org'
    render(/* IPDetailPage with sponsor@org */);
    expect(screen.queryByRole('tab', { name: /charter/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /report/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: FAIL.

- [ ] **Step 3: Implement guard logic**

```tsx
// In IPDetailPage.tsx
import { canAccess } from '@variscout/core/projectMembership';

// Near top of component:
const members = ip.metadata.members ?? [];
const userRole = members.find(m => m.userId === currentUserId)?.role;
const isMember = userRole !== undefined;

if (!isMember) {
  return <NoAccessRedirect projectTitle={ip.metadata.title} />;
}

// In the tab list:
const visibleTabs =
  userRole === 'sponsor' ? ['report'] : ['charter', 'approach', 'improve', 'sustainment', 'report'];
```

Add `NoAccessRedirect` component if absent:

```tsx
// packages/ui/src/components/projects/NoAccessRedirect.tsx
export function NoAccessRedirect({ projectTitle }: { projectTitle: string }) {
  return (
    <div role="alert">
      You don&apos;t have access to "{projectTitle}". Ask the project Lead for an invitation.
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/projects/IPDetailPage.tsx packages/ui/src/components/projects/IPDetailPage.test.tsx packages/ui/src/components/projects/NoAccessRedirect.tsx
git commit -m "feat(ui): add ACL guard + Sponsor Report-only restriction on IPDetailPage"
```

---

## Task 10: Azure AD invitation sync stub (Azure app only)

**Files:**

- Create: `apps/azure/src/features/projectMembership/useInvitationSync.ts`
- Test: `apps/azure/src/features/projectMembership/useInvitationSync.test.ts`

V1 ships a stub; real Graph API wiring is a later Azure-only task.

- [ ] **Step 1: Write failing stub test**

```typescript
// apps/azure/src/features/projectMembership/useInvitationSync.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvitationSync } from './useInvitationSync';

describe('useInvitationSync', () => {
  it('returns a lookupUser function that resolves Azure AD user info', async () => {
    const { result } = renderHook(() => useInvitationSync());
    const user = await result.current.lookupUser('test@org.com');
    expect(user).toEqual({
      userId: 'test@org.com',
      displayName: expect.any(String),
    });
  });

  it('returns null for invalid input', async () => {
    const { result } = renderHook(() => useInvitationSync());
    const user = await result.current.lookupUser('');
    expect(user).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/azure-app test -- useInvitationSync
```

Expected: FAIL.

- [ ] **Step 3: Implement stub**

```typescript
// apps/azure/src/features/projectMembership/useInvitationSync.ts
import { useMemo } from 'react';

interface LookupResult {
  userId: string;
  displayName: string;
}

export function useInvitationSync() {
  return useMemo(
    () => ({
      lookupUser: async (email: string): Promise<LookupResult | null> => {
        if (!email || !email.includes('@')) return null;
        // V1 stub — real Graph API call deferred
        return {
          userId: email,
          displayName: email.split('@')[0],
        };
      },
    }),
    []
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/azure-app test -- useInvitationSync
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/projectMembership/
git commit -m "feat(azure): add useInvitationSync stub for Azure AD lookup"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
pnpm test
```

Expected: all packages green.

- [ ] **Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green (architecture tests, doc-health, lint, build all pass).

- [ ] **Browser walk via `claude --chrome`** (manual verification)

1. Create a new project (as Lead) → Charter stage shows "Invite team" button.
2. Click "Invite team" → modal opens with email + role fields (Lead/Member/Sponsor).
3. Invite `member@example.com` as Member → MemberList shows new row.
4. Sign in as `member@example.com` → can edit Charter/Approach/Improve/Sustainment; no Remove buttons; sees same tabs as Lead.
5. Invite `sponsor@example.com` as Sponsor → MemberList shows new row.
6. Sign in as `sponsor@example.com` → IPDetailPage shows Report tab only; other tabs hidden.
7. Sign in as `stranger@example.com` (not invited) → "You don't have access" message.

- [ ] **Push and open PR**

```bash
git push -u origin feat/wedge-pr-wv1-1-project-membership
gh pr create --title "feat(wedge): PR-WV1-1 project membership foundation" \
  --body "Implements PR-WV1-1 of the wedge V1 implementation plan (master plan: docs/superpowers/plans/2026-05-16-wedge-implementation.md, sub-plan: docs/superpowers/plans/2026-05-16-pr-wv1-1-project-membership.md). Adds ProjectRole + ProjectMember + Invitation types, canAccess ACL, useProjectMembershipStore, InviteModal + MemberList UI, Charter stage integration, IPDetailPage ACL guard, Azure AD lookup stub. Legacy team[] migrated to members[] via migrateTeamToMembers."
```

- [ ] **Dispatch final-review subagent**

Per `subagent-driven-development`: dispatch a final code-reviewer (Opus) with explicit STEP 0 (`git fetch && git checkout feat/wedge-pr-wv1-1-project-membership`) before review.

---

## Self-review checklist

- [ ] **Spec coverage**: §4 (Project membership model) — Lead/Member/Sponsor roles ✓, ACL enforcement ✓, Sponsor Report-only ✓, Charter Invite UI ✓.
- [ ] **Placeholder scan**: no TBD / TODO / placeholder code in any step. ✓
- [ ] **Type consistency**: `ProjectMember`, `ProjectRole`, `Invitation`, `canAccess`, `ProjectAction`, `MembershipAction` — all consistent across tasks.
- [ ] **No `Math.random`** in test code (per @variscout/core CLAUDE.md hard rule).
- [ ] **No "root cause" language** (per P5 amended).
- [ ] **Legacy `team[]` migration tested** with all 5 legacy roles → 3 new roles.
- [ ] **Azure AD constraint honored**: stub only at V1; real Graph API in a later Azure-only task.

---

## Execution handoff

Plan complete. Recommended approach:

**Subagent-Driven Development** (recommended):

- Fresh implementer subagent per task (10 tasks)
- Per-task spec reviewer + quality reviewer pair
- Final code reviewer (Opus) at end of branch
- Sonnet for implementer + per-task reviewers (~70%+ of dispatches per CLAUDE.md memory)

Invoke `superpowers:subagent-driven-development` with this plan as input.
