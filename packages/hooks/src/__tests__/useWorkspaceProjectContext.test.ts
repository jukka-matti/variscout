import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { useWorkspaceProjectContext } from '../useWorkspaceProjectContext';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line',
  createdAt: 0,
  deletedAt: null,
  improvementProject: {
    id: 'project-1',
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

describe('useWorkspaceProjectContext', () => {
  it('returns the live Workspace Project attached to the hub', () => {
    const { result } = renderHook(() => useWorkspaceProjectContext(baseHub));

    expect(result.current.workspaceProject?.id).toBe('project-1');
    expect(result.current.activeState).toEqual({ projectId: 'project-1', setAt: 1 });
    expect(result.current.isWorkspaceProjectScoped).toBe(true);
  });

  it('ignores caller identity because the Workspace Project is hub-owned', () => {
    const { result } = renderHook(() =>
      useWorkspaceProjectContext(baseHub, { userId: 'mira@example.com' })
    );

    expect(result.current.workspaceProject?.id).toBe('project-1');
  });

  it('returns null when the Workspace has no live Project', () => {
    const hubWithDeletedProject: ProcessHub = {
      ...baseHub,
      improvementProject: {
        ...baseHub.improvementProject!,
        deletedAt: 99,
      },
    };

    const { result } = renderHook(() => useWorkspaceProjectContext(hubWithDeletedProject));

    expect(result.current.workspaceProject).toBeNull();
    expect(result.current.activeState).toBeNull();
    expect(result.current.isWorkspaceProjectScoped).toBe(false);
  });

  it('keeps compatibility setWorkspaceProject as a no-op', () => {
    const { result } = renderHook(() => useWorkspaceProjectContext(baseHub));

    act(() => result.current.setWorkspaceProject('project-1', 456));

    expect(result.current.workspaceProject?.id).toBe('project-1');
    expect(result.current.isWorkspaceProjectScoped).toBe(true);
  });
});
