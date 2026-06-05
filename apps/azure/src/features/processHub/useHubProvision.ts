/**
 * useHubProvision — selects hub + members + rowsByAnalyze from the
 * azure-app data layer.
 *
 * V1 reads from `ProcessStepCapabilitySource` (built by the portfolio
 * Dashboard from the project documents). The portfolio source carries no rows;
 * CS-P2 wires the editor's live `rawData` through the `rowsByAnalyze` seam.
 */
import { useMemo } from 'react';
import type {
  DataRow,
  ProcessHub,
  ProcessStepCapabilityMember,
  ProcessStepCapabilitySource,
} from '@variscout/core';

export interface UseHubProvisionInput {
  source: ProcessStepCapabilitySource;
}

export interface UseHubProvisionResult {
  hub: ProcessHub;
  members: readonly ProcessStepCapabilityMember[];
  rowsByAnalyze: ReadonlyMap<string, readonly DataRow[]>;
}

export function useHubProvision(input: UseHubProvisionInput): UseHubProvisionResult {
  const { source } = input;
  return useMemo<UseHubProvisionResult>(() => {
    // CS-P2 seam: populated from the editor's live rawData at lift; the
    // portfolio source carries no rows.
    const rowsByAnalyze = new Map<string, readonly DataRow[]>();
    return {
      hub: source.hub,
      members: source.members,
      rowsByAnalyze,
    };
  }, [source]);
}
