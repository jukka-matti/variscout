import { useState, useCallback } from 'react';
import { createSuspectedCause } from '@variscout/core/findings';
import type { SuspectedCause } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface UseSuspectedCausesOptions {
  /** Initial hubs (for restoring persisted state) */
  initialHubs: SuspectedCause[];
  /** Callback when hubs change (for external persistence) */
  onHubsChange?: (hubs: SuspectedCause[]) => void;
}

export interface UseSuspectedCausesReturn {
  /** Current list of suspected cause hubs */
  hubs: SuspectedCause[];
  /** Create a new hub and return it */
  createHub: (name: string, synthesis: string) => SuspectedCause;
  /** Update name and/or synthesis of an existing hub */
  updateHub: (hubId: string, updates: Partial<Pick<SuspectedCause, 'name' | 'synthesis'>>) => void;
  /** Delete a hub by id */
  deleteHub: (hubId: string) => void;
  /** Connect a question to a hub (no-op if already connected) */
  connectQuestion: (hubId: string, questionId: string) => void;
  /** Disconnect a question from a hub */
  disconnectQuestion: (hubId: string, questionId: string) => void;
  /** Connect a finding to a hub (no-op if already connected) */
  connectFinding: (hubId: string, findingId: string) => void;
  /** Disconnect a finding from a hub */
  disconnectFinding: (hubId: string, findingId: string) => void;
  /** Update the status of a hub */
  setHubStatus: (hubId: string, status: SuspectedCause['status']) => void;
  /** Find the hub that contains a given questionId */
  getHubForQuestion: (questionId: string) => SuspectedCause | undefined;
  /** Find the hub that contains a given findingId */
  getHubForFinding: (findingId: string) => SuspectedCause | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages suspected cause hubs — named groupings of questions and findings
 * that represent a single mechanism the analyst believes is driving variation.
 *
 * Each hub connects multiple evidence threads (questions + findings) under a
 * shared name and synthesis, enabling the analyst to reason about causes
 * rather than individual data points.
 *
 * Follows the same pattern as `useQuestions` and `useFindings`.
 */
export function useSuspectedCauses(options: UseSuspectedCausesOptions): UseSuspectedCausesReturn {
  const { initialHubs, onHubsChange } = options;
  const [hubs, setHubs] = useState<SuspectedCause[]>(initialHubs);

  /** Update state and notify external listener via functional updater pattern */
  const update = useCallback(
    (updater: (prev: SuspectedCause[]) => SuspectedCause[]) => {
      setHubs(prev => {
        const next = updater(prev);
        onHubsChange?.(next);
        return next;
      });
    },
    [onHubsChange]
  );

  const createHub = useCallback(
    (name: string, synthesis: string): SuspectedCause => {
      const hub = createSuspectedCause(name, synthesis);
      update(prev => [...prev, hub]);
      return hub;
    },
    [update]
  );

  const updateHub = useCallback(
    (hubId: string, updates: Partial<Pick<SuspectedCause, 'name' | 'synthesis'>>): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
        )
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

  const connectQuestion = useCallback(
    (hubId: string, questionId: string): void => {
      update(prev =>
        prev.map(h => {
          if (h.id !== hubId) return h;
          if (h.questionIds.includes(questionId)) return h;
          return {
            ...h,
            questionIds: [...h.questionIds, questionId],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [update]
  );

  const disconnectQuestion = useCallback(
    (hubId: string, questionId: string): void => {
      update(prev =>
        prev.map(h =>
          h.id !== hubId
            ? h
            : {
                ...h,
                questionIds: h.questionIds.filter(id => id !== questionId),
                updatedAt: new Date().toISOString(),
              }
        )
      );
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
            updatedAt: new Date().toISOString(),
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
                updatedAt: new Date().toISOString(),
              }
        )
      );
    },
    [update]
  );

  const setHubStatus = useCallback(
    (hubId: string, status: SuspectedCause['status']): void => {
      update(prev =>
        prev.map(h => (h.id !== hubId ? h : { ...h, status, updatedAt: new Date().toISOString() }))
      );
    },
    [update]
  );

  const getHubForQuestion = useCallback(
    (questionId: string): SuspectedCause | undefined =>
      hubs.find(h => h.questionIds.includes(questionId)),
    [hubs]
  );

  const getHubForFinding = useCallback(
    (findingId: string): SuspectedCause | undefined =>
      hubs.find(h => h.findingIds.includes(findingId)),
    [hubs]
  );

  return {
    hubs,
    createHub,
    updateHub,
    deleteHub,
    connectQuestion,
    disconnectQuestion,
    connectFinding,
    disconnectFinding,
    setHubStatus,
    getHubForQuestion,
    getHubForFinding,
  };
}
