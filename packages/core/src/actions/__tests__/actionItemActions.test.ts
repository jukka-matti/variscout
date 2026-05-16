import { describe, it, expect } from 'vitest';
import { reduceActionItems, type ActionItemPatch } from '../actionItemActions';
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
