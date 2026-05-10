import type { ActionItem } from '../findings/types';
import type { ProcessHub } from '../processHub';

export type ActionItemAction = {
  kind: 'ACTION_ITEM_ADD';
  hubId: ProcessHub['id'];
  actionItem: ActionItem;
};
