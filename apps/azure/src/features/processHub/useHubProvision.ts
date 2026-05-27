/**
 * useHubProvision — selects hub + members + rowsByAnalyze from the
 * azure-app data layer.
 *
 * V1 reads from `ProcessHubRollup` which already aggregates the data.
 * Future iterations may wire `useLiveQuery` for streaming Dexie updates
 * if rows are split across tables.
 */
import { useMemo } from 'react';
import type { DataRow, ProcessHub, ProcessHubAnalyze, ProcessHubRollup } from '@variscout/core';

export interface UseHubProvisionInput {
  rollup: ProcessHubRollup<ProcessHubAnalyze>;
}

export interface UseHubProvisionResult {
  hub: ProcessHub;
  members: readonly ProcessHubAnalyze[];
  rowsByAnalyze: ReadonlyMap<string, readonly DataRow[]>;
}

export function useHubProvision(input: UseHubProvisionInput): UseHubProvisionResult {
  const { rollup } = input;
  return useMemo<UseHubProvisionResult>(() => {
    const rowsByAnalyze = new Map<string, readonly DataRow[]>();
    for (const inv of rollup.analyzes) {
      const rows = (inv as { rows?: readonly DataRow[] }).rows ?? [];
      rowsByAnalyze.set(inv.id, rows);
    }
    return {
      hub: rollup.hub,
      members: rollup.analyzes,
      rowsByAnalyze,
    };
  }, [rollup]);
}
