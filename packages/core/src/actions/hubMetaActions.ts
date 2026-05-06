import type { ProcessHub } from '../processHub';

export type HubMetaAction =
  | { kind: 'HUB_UPDATE_GOAL'; hubId: ProcessHub['id']; processGoal: string }
  | {
      kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS';
      hubId: ProcessHub['id'];
      dimensions: string[];
    }
  /** PWA-specific full-blob persist (transitional, F2-only). */
  | { kind: 'HUB_PERSIST_SNAPSHOT'; hub: ProcessHub };
