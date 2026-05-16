import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { buildApplyAction } from '../ImprovementView';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ActionItem } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'active',
    metadata: { title: 'Heads 5-8 Cpk shortfall' },
    goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 } },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

function makeActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'ai-1',
    createdAt: 1000,
    deletedAt: null,
    text: 'Run a pilot on Line 3',
    parentImprovementProjectId: 'ip-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildApplyAction — null activeIP guard', () => {
  it('is a no-op when activeIP is null', () => {
    const upsertProject = vi.fn();
    const apply = buildApplyAction(null, upsertProject);
    apply({ kind: 'ACTION_ITEM_ADD', hubId: 'hub-1', actionItem: makeActionItem() });
    expect(upsertProject).not.toHaveBeenCalled();
  });
});

describe('buildApplyAction — ACTION_ITEM_ADD', () => {
  let upsertProject: Mock<(project: ImprovementProject) => void>;

  beforeEach(() => {
    upsertProject = vi.fn() as Mock<(project: ImprovementProject) => void>;
  });

  it('appends action to empty metadata.actions', () => {
    const ip = makeIP(); // no actions field
    const apply = buildApplyAction(ip, upsertProject);
    const newItem = makeActionItem({ id: 'ai-new', text: 'Investigate root contrib' });

    apply({ kind: 'ACTION_ITEM_ADD', hubId: 'hub-1', actionItem: newItem });

    expect(upsertProject).toHaveBeenCalledTimes(1);
    const called = upsertProject.mock.calls[0][0] as ImprovementProject;
    expect(called.metadata.actions).toHaveLength(1);
    expect(called.metadata.actions![0]).toEqual(newItem);
  });

  it('appends action to existing metadata.actions', () => {
    const existing = makeActionItem({ id: 'ai-0', text: 'Existing action' });
    const ip = makeIP({ metadata: { title: 'Test', actions: [existing] } });
    const apply = buildApplyAction(ip, upsertProject);
    const newItem = makeActionItem({ id: 'ai-new' });

    apply({ kind: 'ACTION_ITEM_ADD', hubId: 'hub-1', actionItem: newItem });

    const called = upsertProject.mock.calls[0][0] as ImprovementProject;
    expect(called.metadata.actions).toHaveLength(2);
    expect(called.metadata.actions![1]).toEqual(newItem);
  });

  it('preserves all other IP fields unchanged', () => {
    const ip = makeIP();
    const apply = buildApplyAction(ip, upsertProject);

    apply({
      kind: 'ACTION_ITEM_ADD',
      hubId: 'hub-1',
      actionItem: makeActionItem({ id: 'ai-x' }),
    });

    const called = upsertProject.mock.calls[0][0] as ImprovementProject;
    expect(called.id).toBe('ip-1');
    expect(called.hubId).toBe('hub-1');
    expect(called.status).toBe('active');
    expect(called.goal).toEqual(ip.goal);
  });
});

describe('buildApplyAction — ACTION_ITEM_UPDATE', () => {
  it('merges patch onto the matching action', () => {
    const existing = makeActionItem({ id: 'ai-1', status: 'open' });
    const ip = makeIP({ metadata: { title: 'Test', actions: [existing] } });
    const upsertProject = vi.fn();
    const apply = buildApplyAction(ip, upsertProject);

    apply({ kind: 'ACTION_ITEM_UPDATE', actionItemId: 'ai-1', patch: { status: 'done' } });

    const called = upsertProject.mock.calls[0][0] as ImprovementProject;
    expect(called.metadata.actions![0]!.status).toBe('done');
    expect(called.metadata.actions![0]!.id).toBe('ai-1');
  });
});

describe('buildApplyAction — ACTION_ITEM_REMOVE', () => {
  it('soft-deletes the matching action (sets deletedAt)', () => {
    const existing = makeActionItem({ id: 'ai-1', deletedAt: null });
    const ip = makeIP({ metadata: { title: 'Test', actions: [existing] } });
    const upsertProject = vi.fn();
    const apply = buildApplyAction(ip, upsertProject);

    apply({ kind: 'ACTION_ITEM_REMOVE', actionItemId: 'ai-1', removedAt: 9999 });

    const called = upsertProject.mock.calls[0][0] as ImprovementProject;
    expect(called.metadata.actions![0]!.deletedAt).toBe(9999);
    expect(called.metadata.actions![0]!.id).toBe('ai-1');
  });
});
