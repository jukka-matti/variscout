import { describe, it, expect, beforeEach } from 'vitest';
import {
  useProjectMembershipStore,
  getProjectMembershipInitialState,
} from '../useProjectMembershipStore';
import type { Invitation } from '@variscout/core/projectMembership';

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
