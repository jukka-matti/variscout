import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { getActiveIPInitialState, useActiveIPStore } from '@variscout/stores';
import { useActiveIPContext } from '../useActiveIPContext';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line',
  createdAt: 0,
  deletedAt: null,
  improvementProject: {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 1,
    updatedAt: 2,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Heads 5-8 Cpk shortfall' },
    goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
    sections: { background: {}, approach: {}, outcomeReference: {} },
  },
};

describe('useActiveIPContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useActiveIPStore.setState(getActiveIPInitialState());
  });

  it('uses the local scope by default and returns the workspace project', () => {
    useActiveIPStore.getState().setActiveIP({ hubId: 'hub-1', userId: 'local' }, 'ip-1', 123);

    const { result } = renderHook(() => useActiveIPContext(baseHub));

    expect(result.current.scope).toEqual({ hubId: 'hub-1', userId: 'local' });
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.activeState?.setAt).toBe(1);
    expect(result.current.isIPScoped).toBe(true);
  });

  it('uses the provided user id for Azure-scoped active IP state', () => {
    useActiveIPStore
      .getState()
      .setActiveIP({ hubId: 'hub-1', userId: 'mira@example.com' }, 'ip-1', 123);

    const { result } = renderHook(() =>
      useActiveIPContext(baseHub, { userId: 'mira@example.com' })
    );

    expect(result.current.scope).toEqual({ hubId: 'hub-1', userId: 'mira@example.com' });
    expect(result.current.activeIP?.id).toBe('ip-1');
  });

  it('falls back to local user id when the provided user id is unavailable', () => {
    const { result } = renderHook(() => useActiveIPContext(baseHub, { userId: null }));
    expect(result.current.scope).toEqual({ hubId: 'hub-1', userId: 'local' });
  });

  it('ignores stale stored focus when the workspace project is not live', () => {
    const hubWithDeletedIP: ProcessHub = {
      ...baseHub,
      improvementProject: {
        ...baseHub.improvementProject!,
        deletedAt: 99,
      },
    };
    useActiveIPStore
      .getState()
      .setActiveIP({ hubId: 'hub-1', userId: 'mira@example.com' }, 'ip-1', 123);

    const { result } = renderHook(() =>
      useActiveIPContext(hubWithDeletedIP, { userId: 'mira@example.com' })
    );

    expect(result.current.activeIP).toBeNull();
    expect(result.current.isIPScoped).toBe(false);
  });

  it('returns the workspace project without active-focus storage', () => {
    const { result } = renderHook(() =>
      useActiveIPContext(baseHub, { userId: 'mira@example.com' })
    );

    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.isIPScoped).toBe(true);
    expect(
      useActiveIPStore.getState().getActiveIP({ hubId: 'hub-1', userId: 'mira@example.com' })
    ).toBeNull();
  });

  it('keeps the workspace project attached when legacy clearActiveIP is called', () => {
    const { result, unmount } = renderHook(() =>
      useActiveIPContext(baseHub, { userId: 'mira@example.com' })
    );

    act(() => result.current.clearActiveIP());
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.isIPScoped).toBe(true);

    unmount();
    const { result: remounted } = renderHook(() =>
      useActiveIPContext(baseHub, { userId: 'mira@example.com' })
    );
    expect(remounted.current.activeIP?.id).toBe('ip-1');
    expect(remounted.current.isIPScoped).toBe(true);
  });

  it('sets and clears active IP through returned actions', () => {
    const { result } = renderHook(() =>
      useActiveIPContext(baseHub, { userId: 'mira@example.com' })
    );

    act(() => result.current.setActiveIP('ip-1', 456));
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.isIPScoped).toBe(true);

    act(() => result.current.clearActiveIP());
    expect(result.current.activeIP?.id).toBe('ip-1');
    expect(result.current.isIPScoped).toBe(true);
  });
});
