import { useState, useCallback } from 'react';
import { createHypothesis } from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface UseHypothesesOptions {
  /** Initial hubs (for restoring persisted state) */
  initialHubs: Hypothesis[];
  /** Callback when hubs change (for external persistence) */
  onHubsChange?: (hubs: Hypothesis[]) => void;
}

export type HypothesisUpdate = Partial<
  Pick<Hypothesis, 'name' | 'synthesis' | 'status' | 'nextMove' | 'counterFindingIds'>
>;

export interface UseHypothesesReturn {
  /** Current list of hypothesis hubs */
  hubs: Hypothesis[];
  /** Create a new hub and return it */
  createHub: (name: string, synthesis: string) => Hypothesis;
  /** Update name and/or synthesis of an existing hub */
  updateHub: (hubId: string, updates: HypothesisUpdate) => void;
  /** Delete a hub by id */
  deleteHub: (hubId: string) => void;
  /**
   * Replace the entire hub list atomically (e.g. after migration).
   * Updates hook state and fires onHubsChange so the store stays in sync.
   */
  resetHubs: (newHubs: Hypothesis[]) => void;
  /** Connect a finding to a hub (no-op if already connected) */
  connectFinding: (hubId: string, findingId: string) => void;
  /** Disconnect a finding from a hub */
  disconnectFinding: (hubId: string, findingId: string) => void;
  /** Find the hub that contains a given findingId */
  getHubForFinding: (findingId: string) => Hypothesis | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages hypothesis hubs — named groupings of questions and findings
 * that represent a single mechanism the analyst believes is driving variation.
 *
 * Each hub connects multiple evidence threads (questions + findings) under a
 * shared name and synthesis, enabling the analyst to reason about causes
 * rather than individual data points.
 *
 * Follows the same pattern as `useQuestions` and `useFindings`.
 */
export function useHypotheses(options: UseHypothesesOptions): UseHypothesesReturn {
  const { initialHubs, onHubsChange } = options;
  const [hubs, setHubs] = useState<Hypothesis[]>(initialHubs);

  /** Update state and notify external listener via functional updater pattern */
  const update = useCallback(
    (updater: (prev: Hypothesis[]) => Hypothesis[]) => {
      setHubs(prev => {
        const next = updater(prev);
        onHubsChange?.(next);
        return next;
      });
    },
    [onHubsChange]
  );

  const createHub = useCallback(
    (name: string, synthesis: string): Hypothesis => {
      const hub = createHypothesis(name, synthesis);
      update(prev => [...prev, hub]);
      return hub;
    },
    [update]
  );

  const updateHub = useCallback(
    (hubId: string, updates: HypothesisUpdate): void => {
      update(prev =>
        prev.map(h => (h.id === hubId ? { ...h, ...updates, updatedAt: Date.now() } : h))
      );
    },
    [update]
  );

  const deleteHub = useCallback(
    (hubId: string): void => {
      update(prev => prev.filter(h => h.id !== hubId));
    },
    [update]
  );

  const connectFinding = useCallback(
    (hubId: string, findingId: string): void => {
      update(prev =>
        prev.map(h => {
          if (h.id !== hubId) return h;
          if (h.findingIds.includes(findingId)) return h;
          return {
            ...h,
            findingIds: [...h.findingIds, findingId],
            updatedAt: Date.now(),
          };
        })
      );
    },
    [update]
  );

  const disconnectFinding = useCallback(
    (hubId: string, findingId: string): void => {
      update(prev =>
        prev.map(h =>
          h.id !== hubId
            ? h
            : {
                ...h,
                findingIds: h.findingIds.filter(id => id !== findingId),
                updatedAt: Date.now(),
              }
        )
      );
    },
    [update]
  );

  const resetHubs = useCallback(
    (newHubs: Hypothesis[]): void => {
      setHubs(newHubs);
      onHubsChange?.(newHubs);
    },
    [onHubsChange]
  );

  const getHubForFinding = useCallback(
    (findingId: string): Hypothesis | undefined => hubs.find(h => h.findingIds.includes(findingId)),
    [hubs]
  );

  return {
    hubs,
    createHub,
    updateHub,
    deleteHub,
    resetHubs,
    connectFinding,
    disconnectFinding,
    getHubForFinding,
  };
}
