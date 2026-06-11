import { useState, useCallback } from 'react';
import {
  createHypothesis,
  createFindingComment,
  createActionItem,
  createImprovementIdea,
} from '@variscout/core/findings';
import type {
  Hypothesis,
  DisconfirmationAttempt,
  FindingComment,
  FindingAssignee,
  ActionItem,
  ImprovementIdea,
} from '@variscout/core';

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
  Pick<
    Hypothesis,
    'name' | 'synthesis' | 'status' | 'nextMove' | 'counterFindingIds' | 'supersededByHypothesisId'
  >
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
  /**
   * Append a disconfirmation attempt to a hub's `disconfirmationAttempts` array.
   *
   * Routes through the hook's `update()` so `onHubsChange` fires and the LOCAL
   * hook state (= the Wall's source of truth for `deriveHypothesisStatus`) is
   * updated immediately — the `needs-disconfirmation → confirmed` gate fires
   * live in-session without a reload.
   *
   * No-op if the hub is not found.
   */
  recordDisconfirmation: (hubId: string, attempt: DisconfirmationAttempt) => void;
  /** Analyst-owned status setter; routes through update() so onHubsChange syncs. */
  setHubStatus: (hubId: string, status: Hypothesis['status']) => void;
  /**
   * IM-4b Task 1 — append a team comment to a hub. Routes through the hook's
   * `update()` so the Wall (which reads `hubs` from this hook) re-renders with
   * the new comment immediately AND `onHubsChange` syncs the domain store.
   * Returns the created comment so the caller can mirror it to the repository.
   * No-op + returns null if the hub is not found.
   */
  addComment: (
    hubId: string,
    text: string,
    author?: string,
    mentionedUserIds?: string[]
  ) => FindingComment | null;
  /** IM-4b Task 1 — edit a hub comment's text. No-op if hub/comment not found. */
  editComment: (hubId: string, commentId: string, text: string) => void;
  /** IM-4b Task 1 — delete a hub comment. No-op if hub/comment not found. */
  deleteComment: (hubId: string, commentId: string) => void;
  /**
   * IM-4b Task 3 — append an ActionItem task to a hub. Returns the created item
   * so the caller can mirror it to the repository. No-op + null if hub absent.
   */
  addAction: (hubId: string, text: string, assignee?: FindingAssignee) => ActionItem | null;
  /** IM-4b Task 3 — mark a hub action item done (sets completedAt). */
  completeAction: (hubId: string, actionId: string, completedAt: number) => void;
  /**
   * IM-4b Task 6 — append an improvement idea to a hub. Returns the created
   * idea so the caller can mirror it. No-op + null if hub absent.
   */
  addIdea: (hubId: string, text: string) => ImprovementIdea | null;
  /** IM-4b Task 6 — patch an improvement idea on a hub. */
  updateIdea: (
    hubId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /** IM-4b Task 6 — remove an improvement idea from a hub. */
  removeIdea: (hubId: string, ideaId: string) => void;
  /** IM-4b Task 6 — select/deselect an improvement idea on a hub. */
  selectIdea: (hubId: string, ideaId: string, selected: boolean) => void;
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

  const recordDisconfirmation = useCallback(
    (hubId: string, attempt: DisconfirmationAttempt): void => {
      update(prev =>
        prev.map(h => {
          if (h.id !== hubId) return h;
          return {
            ...h,
            disconfirmationAttempts: [...(h.disconfirmationAttempts ?? []), attempt],
            updatedAt: Date.now(),
          };
        })
      );
    },
    [update]
  );

  const setHubStatus = useCallback(
    (hubId: string, status: Hypothesis['status']): void => {
      update(prev => prev.map(h => (h.id !== hubId ? h : { ...h, status, updatedAt: Date.now() })));
    },
    [update]
  );

  // ── IM-4b Task 1 — hub comment thread ───────────────────────────────────
  const addComment = useCallback(
    (
      hubId: string,
      text: string,
      author?: string,
      mentionedUserIds?: string[]
    ): FindingComment | null => {
      const hub = hubs.find(h => h.id === hubId);
      if (!hub) return null;
      const comment = createFindingComment(text, hubId, 'hypothesis', author);
      if (mentionedUserIds && mentionedUserIds.length > 0) {
        comment.mentionedUserIds = mentionedUserIds;
      }
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? { ...h, comments: [...(h.comments ?? []), comment], updatedAt: Date.now() }
            : h
        )
      );
      return comment;
    },
    [hubs, update]
  );

  const editComment = useCallback(
    (hubId: string, commentId: string, text: string): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                comments: (h.comments ?? []).map(c => (c.id === commentId ? { ...c, text } : c)),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
  );

  const deleteComment = useCallback(
    (hubId: string, commentId: string): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                comments: (h.comments ?? []).filter(c => c.id !== commentId),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
  );

  // ── IM-4b Task 3 — hub ActionItem tasks ─────────────────────────────────
  const addAction = useCallback(
    (hubId: string, text: string, assignee?: FindingAssignee): ActionItem | null => {
      const hub = hubs.find(h => h.id === hubId);
      if (!hub) return null;
      const action = createActionItem(text, assignee);
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? { ...h, actions: [...(h.actions ?? []), action], updatedAt: Date.now() }
            : h
        )
      );
      return action;
    },
    [hubs, update]
  );

  const completeAction = useCallback(
    (hubId: string, actionId: string, completedAt: number): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                actions: (h.actions ?? []).map(a =>
                  a.id === actionId ? { ...a, completedAt } : a
                ),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
  );

  // ── IM-4b Task 6 — improvement ideas ────────────────────────────────────
  const addIdea = useCallback(
    (hubId: string, text: string): ImprovementIdea | null => {
      const hub = hubs.find(h => h.id === hubId);
      if (!hub) return null;
      const idea = createImprovementIdea(text);
      update(prev =>
        prev.map(h =>
          h.id === hubId ? { ...h, ideas: [...(h.ideas ?? []), idea], updatedAt: Date.now() } : h
        )
      );
      return idea;
    },
    [hubs, update]
  );

  const updateIdea = useCallback(
    (
      hubId: string,
      ideaId: string,
      updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
    ): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                ideas: (h.ideas ?? []).map(i => (i.id === ideaId ? { ...i, ...updates } : i)),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
  );

  const removeIdea = useCallback(
    (hubId: string, ideaId: string): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                ideas: (h.ideas ?? []).filter(i => i.id !== ideaId),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
  );

  const selectIdea = useCallback(
    (hubId: string, ideaId: string, selected: boolean): void => {
      update(prev =>
        prev.map(h =>
          h.id === hubId
            ? {
                ...h,
                ideas: (h.ideas ?? []).map(i => (i.id === ideaId ? { ...i, selected } : i)),
                updatedAt: Date.now(),
              }
            : h
        )
      );
    },
    [update]
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
    recordDisconfirmation,
    setHubStatus,
    addComment,
    editComment,
    deleteComment,
    addAction,
    completeAction,
    addIdea,
    updateIdea,
    removeIdea,
    selectIdea,
  };
}
