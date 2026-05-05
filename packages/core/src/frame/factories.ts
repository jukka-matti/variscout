import type { ProcessMap } from './types';

/**
 * Build an empty `ProcessMap` with current timestamps. Used by FRAME views in
 * both apps as the initial state when no `processContext.processMap` exists.
 */
export function createEmptyMap(): ProcessMap {
  const now = new Date().toISOString();
  return {
    version: 1,
    nodes: [],
    tributaries: [],
    assignments: {},
    arrows: [],
    createdAt: now,
    updatedAt: now,
  };
}
