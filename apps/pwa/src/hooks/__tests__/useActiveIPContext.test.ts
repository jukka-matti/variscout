import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { getActiveIPInitialState, useActiveIPStore } from '@variscout/stores';
import { useActiveIPContext } from '../useActiveIPContext';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line',
  createdAt: 0,
  deletedAt: null,
  // 1:1 — a hub carries at most one improvementProject
  improvementProject: {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Heads 5-8 Cpk shortfall' },
    goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
    sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
  },
};

describe('useActiveIPContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useActiveIPStore.setState(getActiveIPInitialState());
  });

  it('returns PWA local scope and active IP when stored', () => {
    useActiveIPStore.getState().setActiveIP({ hubId: 'hub-1', userId: 'local' }, 'ip-1', 123);

    const { result } = renderHook(() => useActiveIPContext(baseHub));

    expect(result.current.scope).toEqual({ hubId: 'hub-1', userId: 'local' });
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.activeState?.setAt).toBe(123);
    expect(result.current.isIPScoped).toBe(true);
  });

  it('clears active state when the stored IP is not live on the hub', () => {
    // Under the 1:1 invariant a hub carries at most one IP, and a single live IP
    // is auto-activated. To isolate the "stored IP is not live → clear" behavior
    // without the auto-activate confound, give the hub a soft-deleted IP (so
    // liveProjects is empty) and point the store at that now-non-live IP.
    const hubWithDeletedIP: ProcessHub = {
      ...baseHub,
      improvementProject: {
        ...baseHub.improvementProject!,
        deletedAt: 99,
      },
    };
    useActiveIPStore.getState().setActiveIP({ hubId: 'hub-1', userId: 'local' }, 'ip-1', 123);

    const { result } = renderHook(() => useActiveIPContext(hubWithDeletedIP));

    expect(result.current.activeIP).toBeNull();
    expect(result.current.isIPScoped).toBe(false);
    expect(useActiveIPStore.getState().getActiveIP({ hubId: 'hub-1', userId: 'local' })).toBeNull();
  });

  it('auto-activates the only live IP once per session scope', async () => {
    const { result, unmount } = renderHook(() => useActiveIPContext(baseHub));

    await waitFor(() => expect(result.current.activeIP?.id).toBe('ip-1'));
    expect(useActiveIPStore.getState().getActiveIP({ hubId: 'hub-1', userId: 'local' })?.ipId).toBe(
      'ip-1'
    );

    act(() => result.current.clearActiveIP());
    expect(result.current.activeIP).toBeNull();
    expect(result.current.isIPScoped).toBe(false);

    unmount();
    const { result: remounted } = renderHook(() => useActiveIPContext(baseHub));
    await waitFor(() => expect(remounted.current.activeIP).toBeNull());
    expect(remounted.current.isIPScoped).toBe(false);
  });

  it('sets and clears active IP through returned actions', () => {
    const { result } = renderHook(() => useActiveIPContext(baseHub));

    act(() => result.current.setActiveIP('ip-1', 456));
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.isIPScoped).toBe(true);

    act(() => result.current.clearActiveIP());
    expect(result.current.activeIP).toBeNull();
    expect(result.current.isIPScoped).toBe(false);
  });
});
