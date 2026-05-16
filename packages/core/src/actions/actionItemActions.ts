import type { ActionItem } from '../findings/types';
import type { ProcessHub } from '../processHub';

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
