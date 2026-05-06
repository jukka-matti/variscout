/**
 * useNewHubProvision — creates and persists a new ProcessHub from a goal
 * narrative during the Azure Mode B framing flow.
 *
 * Called by HubCreationFlow after Stage 1 (HubGoalForm) to materialise the
 * Hub row before Stage 3 (ColumnMapping) runs. The created hub id is written
 * to `processContext.processHubId` so subsequent saves (e.g. from
 * handleMappingConfirmWithCategories) land on the correct hub.
 */
import { useCallback } from 'react';
import { extractHubName } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import { useStorage } from '../../services/storage';

export interface UseNewHubProvisionOptions {
  /** Called with the new hub once it has been persisted. */
  onCreated: (hub: ProcessHub) => void;
}

export interface UseNewHubProvisionResult {
  /**
   * Create and persist a new Hub from the given goal narrative. Returns the
   * hub so callers can immediately set processContext.processHubId.
   */
  createHubFromGoal: (goalNarrative: string) => Promise<ProcessHub>;
  /** Whether a creation call is in-flight. */
  isPending: boolean;
}

export function useNewHubProvision({
  onCreated,
}: UseNewHubProvisionOptions): UseNewHubProvisionResult {
  const { saveProcessHub } = useStorage();

  const createHubFromGoal = useCallback(
    async (goalNarrative: string): Promise<ProcessHub> => {
      const trimmed = goalNarrative.trim();
      const name = extractHubName(trimmed) || 'Untitled hub';
      const now = Date.now();
      const hub: ProcessHub = {
        id: crypto.randomUUID(),
        name,
        processGoal: trimmed || undefined,
        createdAt: now,
        deletedAt: null,
        updatedAt: now,
      };

      await saveProcessHub(hub);
      onCreated(hub);
      return hub;
    },
    [saveProcessHub, onCreated]
  );

  return {
    createHubFromGoal,
    // isPending is not tracked at this scope — callers gate the CTA button
    // while the promise is in-flight using local state in HubCreationFlow.
    isPending: false,
  };
}
