import { describe, it, expect, beforeEach } from 'vitest';
import {
  useProjectMembershipStore,
  getProjectMembershipInitialState,
} from '../useProjectMembershipStore';
import type { Invitation } from '@variscout/core/projectMembership';
import {
  useImprovementProjectStore,
  getImprovementProjectInitialState,
} from '../improvementProjectStore';
import type { ImprovementProject } from '@variscout/core/improvementProject';

// Polyfill localStorage for the Node test environment — mirrors activeIPStore.test.ts.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
    configurable: true,
  });
}

function makeInvite(id: string): Invitation {
  return {
    id,
    createdAt: 1,
    deletedAt: null,
    projectId: 'ip-1',
    userId: 'u@org',
    displayName: 'U',
    role: 'member',
    invitedAt: 1,
    status: 'pending',
  };
}

describe('useProjectMembershipStore', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
    localStorage.clear();
  });

  it('declares STORE_LAYER as annotation-per-user', async () => {
    const mod = await import('../useProjectMembershipStore');
    expect(mod.STORE_LAYER).toBe('annotation-per-user');
  });

  it('initializes with empty pending invites', () => {
    const { pendingInvites } = useProjectMembershipStore.getState();
    expect(pendingInvites).toEqual([]);
  });

  it('adds and lists pending invites', () => {
    useProjectMembershipStore.getState().addPendingInvite(makeInvite('inv-1'));
    expect(useProjectMembershipStore.getState().pendingInvites).toHaveLength(1);
  });

  it('removes invite on acceptance', () => {
    useProjectMembershipStore.getState().addPendingInvite(makeInvite('inv-1'));
    useProjectMembershipStore.getState().acceptInvite('inv-1');
    expect(useProjectMembershipStore.getState().pendingInvites).toHaveLength(0);
  });

  it('removes invite on revoke', () => {
    useProjectMembershipStore.getState().addPendingInvite(makeInvite('inv-1'));
    useProjectMembershipStore.getState().revokeInvite('inv-1');
    expect(useProjectMembershipStore.getState().pendingInvites).toHaveLength(0);
  });

  it('does not remove unrelated invites when accepting one', () => {
    useProjectMembershipStore.getState().addPendingInvite(makeInvite('inv-1'));
    useProjectMembershipStore.getState().addPendingInvite(makeInvite('inv-2'));
    useProjectMembershipStore.getState().acceptInvite('inv-1');
    const { pendingInvites } = useProjectMembershipStore.getState();
    expect(pendingInvites).toHaveLength(1);
    expect(pendingInvites[0]!.id).toBe('inv-2');
  });
});

describe('useProjectMembershipStore — acceptInvite composite', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
    useImprovementProjectStore.setState(getImprovementProjectInitialState());
    localStorage.clear();
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
    expect(updated!.metadata.members).toHaveLength(1);
    expect(updated!.metadata.members?.[0]!.userId).toBe('mira@org');
    expect(updated!.metadata.members?.[0]!.role).toBe('member');
  });

  it('no-ops when the invitation does not exist in pendingInvites', () => {
    expect(() => useProjectMembershipStore.getState().acceptInvite('missing-id')).not.toThrow();
    expect(useImprovementProjectStore.getState().getProjectsForHub('hub-1')).toEqual([]);
  });

  it('still removes the invite when the target project is not in the store', () => {
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
    expect(useProjectMembershipStore.getState().pendingInvites).toEqual([]);
  });
});

describe('useProjectMembershipStore — revokeInvite', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
    localStorage.clear();
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
