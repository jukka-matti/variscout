/**
 * useNewHubProvision — creates the in-memory Untitled hub + ImprovementProject
 * pair from a goal narrative during the Azure Mode B framing flow.
 *
 * Word-style durability (first-session spec §3, FSJ-3a): the Untitled pair is
 * born together in-memory; eager saveProcessHub is retired; first explicit save
 * flushes the hub to the catalog. Pre-auth edge: no identity → bare hub only
 * (the next authenticated entry's ensureHubProject completes the pair).
 *
 * Called by HubCreationFlow after Stage 1 (HubGoalForm) to materialise the
 * Hub row before Stage 3 (ColumnMapping) runs. The created hub id is written
 * to `processContext.processHubId` so subsequent saves (e.g. from
 * handleMappingConfirmWithCategories) land on the correct hub.
 */
import { useCallback } from 'react';
import { extractHubName } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import { getCurrentUser } from '../../auth/getCurrentUser';
import { useUnsavedHubsStore } from '../hubs/unsavedHubsStore';
import { ensureHubProject } from '../../lib/landing';

export interface UseNewHubProvisionOptions {
  /** Called with the new hub once it has been registered in-memory. */
  onCreated: (hub: ProcessHub) => void;
}

export interface UseNewHubProvisionResult {
  /**
   * Create the Untitled hub + ImprovementProject pair in-memory from the given
   * goal narrative. Returns the hub so callers can immediately set
   * processContext.processHubId. Nothing is persisted — first explicit save
   * flushes via saveProcessHub (Word-style, spec §3).
   */
  createHubFromGoal: (goalNarrative: string) => Promise<ProcessHub>;
  /** Whether a creation call is in-flight. */
  isPending: boolean;
}

export function useNewHubProvision({
  onCreated,
}: UseNewHubProvisionOptions): UseNewHubProvisionResult {
  const createHubFromGoal = useCallback(
    async (goalNarrative: string): Promise<ProcessHub> => {
      const trimmed = goalNarrative.trim();
      const name = extractHubName(trimmed) || 'Untitled hub';
      const now = Date.now();
      const base: ProcessHub = {
        id: crypto.randomUUID(),
        name,
        processGoal: trimmed || undefined,
        createdAt: now,
        deletedAt: null,
        updatedAt: now,
      };
      const user = await getCurrentUser();
      const hub = user
        ? ensureHubProject(base, name === 'Untitled hub' ? 'Untitled project' : name, user)
        : base;
      useUnsavedHubsStore.getState().upsertHub(hub);
      onCreated(hub);
      return hub;
    },
    [onCreated]
  );

  return {
    createHubFromGoal,
    // isPending is not tracked at this scope — callers gate the CTA button
    // while the promise is in-flight using local state in HubCreationFlow.
    isPending: false,
  };
}
