/**
 * useHubProvision — selects hub + members + rowsByInvestigation from the
 * azure-app data layer.
 *
 * V1 reads from `ProcessHubRollup` which already aggregates the data.
 * Future iterations may wire `useLiveQuery` for streaming Dexie updates
 * if rows are split across tables.
 */
import { useMemo } from 'react';
import type {
  DataRow,
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubRollup,
} from '@variscout/core';

export interface UseHubProvisionInput {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export interface UseHubProvisionResult {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  rowsByInvestigation: ReadonlyMap<string, readonly DataRow[]>;
}

export function useHubProvision(input: UseHubProvisionInput): UseHubProvisionResult {
  const { rollup } = input;
  return useMemo<UseHubProvisionResult>(() => {
    const rowsByInvestigation = new Map<string, readonly DataRow[]>();
    for (const inv of rollup.investigations) {
      const rows = (inv as { rows?: readonly DataRow[] }).rows ?? [];
      rowsByInvestigation.set(inv.id, rows);
    }
    return {
      hub: rollup.hub,
      members: rollup.investigations,
      rowsByInvestigation,
    };
  }, [rollup]);
}
