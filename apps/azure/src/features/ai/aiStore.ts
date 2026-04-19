import { create } from 'zustand';
import type { ActionProposal, BestSubsetsCandidate } from '@variscout/core';
import type {
  UseNarrationReturn,
  UseAICoScoutReturn,
  UseKnowledgeSearchReturn,
} from '@variscout/hooks';

// ── Types ───────────────────────────────────────────────────────────────────

/** Summary of AI context for transparency disclosure in CoScout */
export interface AIContextSummary {
  stats: string;
  filterCount: number;
  findingCount: number;
  phase?: string;
}

/**
 * A single proactive CoScout suggestion surfaced by a background pipeline.
 *
 * `kind: 'suggestion'` tags the message so the CoScout UI can render it
 * distinctly from user/assistant messages without extending the external
 * `UseAICoScoutReturn['messages']` type. The `candidates` payload is the raw
 * best-subsets detector output — rendering (e.g. "Consider citing {column} in
 * a hub") happens in the CoScout panel.
 */
export interface WallSuggestion {
  kind: 'suggestion';
  /** Stable id so repeated debounced emits can replace-in-place. */
  id: string;
  /** Source of the suggestion — currently only the best-subsets pipeline. */
  source: 'best-subsets';
  /** Detector output. Consumers may render only the top N. */
  candidates: BestSubsetsCandidate[];
  /** Emit timestamp for stale-display gating. */
  emittedAt: number;
}

// ── State ───────────────────────────────────────────────────────────────────

interface AIStoreState {
  /** Pending question to pre-fill CoScout when navigating from the project dashboard */
  pendingDashboardQuestion: string | null;
  /** Narration state (text, loading, etc.) */
  narration: Pick<UseNarrationReturn, 'narrative' | 'isLoading' | 'isCached' | 'error'> | null;
  /** CoScout conversation messages */
  coscoutMessages: UseAICoScoutReturn['messages'];
  /** Suggested questions for CoScout */
  suggestedQuestions: string[];
  /** Action proposals from CoScout responses */
  actionProposals: ActionProposal[];
  /** AI context transparency summary */
  aiContextSummary: AIContextSummary | null;
  /** Whether admin consent for SharePoint KB is missing */
  kbPermissionWarning: boolean;
  /** Provider label for CoScout header */
  providerLabel: string | null;
  /** Friendly label for KB search scope */
  knowledgeSearchScope: string | undefined;
  /** Timestamp of last KB search */
  knowledgeSearchTimestamp: number | undefined;
  /** Whether knowledge search is available */
  knowledgeAvailable: boolean;
  /** Whether knowledge search is in progress */
  knowledgeSearching: boolean;
  /** Knowledge search documents */
  knowledgeDocuments: UseKnowledgeSearchReturn['documents'];
  /** Factor type classification from best subsets (stable metadata) */
  factorMetadata: Map<
    string,
    {
      factorType: 'categorical' | 'continuous';
      relationship?: 'linear' | 'quadratic';
      optimum?: number;
    }
  > | null;
  // Session engagement tracking (for session-close save prompt)
  pendingSaveProposals: number;
  unsavedBookmarks: string[];
  turnCount: number;
  findingsCreatedThisSession: boolean;
  /** Proactive Wall suggestions emitted by background pipelines (Phase 9). */
  wallSuggestions: WallSuggestion[];
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface AIStoreActions {
  syncNarration: (
    narration: Pick<UseNarrationReturn, 'narrative' | 'isLoading' | 'isCached' | 'error'> | null
  ) => void;
  syncCoScoutMessages: (messages: UseAICoScoutReturn['messages']) => void;
  syncSuggestedQuestions: (questions: string[]) => void;
  syncActionProposals: (proposals: ActionProposal[]) => void;
  syncAIContext: (summary: AIContextSummary | null) => void;
  setKbPermissionWarning: (value: boolean) => void;
  setProviderLabel: (label: string | null) => void;
  setKnowledgeSearchScope: (scope: string | undefined) => void;
  setKnowledgeSearchTimestamp: (ts: number | undefined) => void;
  syncKnowledgeSearch: (state: {
    isAvailable: boolean;
    isSearching: boolean;
    documents: UseKnowledgeSearchReturn['documents'];
  }) => void;
  syncFactorMetadata: (metadata: AIStoreState['factorMetadata']) => void;
  /** Set or clear a pending question to pre-fill CoScout from the project dashboard */
  setPendingDashboardQuestion: (question: string | null) => void;
  incrementPendingSaveProposals: () => void;
  decrementPendingSaveProposals: () => void;
  addUnsavedBookmark: (messageId: string) => void;
  removeUnsavedBookmark: (messageId: string) => void;
  incrementTurnCount: () => void;
  markFindingCreatedThisSession: () => void;
  resetSessionState: () => void;
  /** Check if session-close prompt should show */
  shouldShowClosePrompt: () => boolean;
  /**
   * Insert-or-replace a Wall suggestion by id. Used by background pipelines
   * (e.g. `useWallBackgroundJobs`) to emit debounced proactive hints without
   * duplicating entries on every run.
   */
  upsertWallSuggestion: (suggestion: WallSuggestion) => void;
  /** Drop a Wall suggestion by id (e.g. when the user dismisses it). */
  dismissWallSuggestion: (id: string) => void;
  /** Clear every Wall suggestion — e.g. on project switch. */
  clearWallSuggestions: () => void;
}

export type AIStore = AIStoreState & AIStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  pendingDashboardQuestion: null,
  narration: null,
  coscoutMessages: [],
  suggestedQuestions: [],
  actionProposals: [],
  aiContextSummary: null,
  kbPermissionWarning: false,
  providerLabel: null,
  knowledgeSearchScope: undefined,
  knowledgeSearchTimestamp: undefined,
  knowledgeAvailable: false,
  knowledgeSearching: false,
  knowledgeDocuments: [],
  factorMetadata: null,
  pendingSaveProposals: 0,
  unsavedBookmarks: [],
  turnCount: 0,
  findingsCreatedThisSession: false,
  wallSuggestions: [],

  // Actions
  syncNarration: narration => set({ narration }),
  syncCoScoutMessages: messages => set({ coscoutMessages: messages }),
  syncSuggestedQuestions: questions => set({ suggestedQuestions: questions }),
  syncActionProposals: proposals => set({ actionProposals: proposals }),
  syncAIContext: summary => set({ aiContextSummary: summary }),
  setKbPermissionWarning: value => set({ kbPermissionWarning: value }),
  setProviderLabel: label => set({ providerLabel: label }),
  setKnowledgeSearchScope: scope => set({ knowledgeSearchScope: scope }),
  setKnowledgeSearchTimestamp: ts => set({ knowledgeSearchTimestamp: ts }),
  syncKnowledgeSearch: state =>
    set({
      knowledgeAvailable: state.isAvailable,
      knowledgeSearching: state.isSearching,
      knowledgeDocuments: state.documents,
    }),
  syncFactorMetadata: metadata => set({ factorMetadata: metadata }),
  setPendingDashboardQuestion: question => set({ pendingDashboardQuestion: question }),
  incrementPendingSaveProposals: () =>
    set(s => ({ pendingSaveProposals: s.pendingSaveProposals + 1 })),
  decrementPendingSaveProposals: () =>
    set(s => ({ pendingSaveProposals: Math.max(0, s.pendingSaveProposals - 1) })),
  addUnsavedBookmark: messageId =>
    set(s => ({ unsavedBookmarks: [...s.unsavedBookmarks, messageId] })),
  removeUnsavedBookmark: messageId =>
    set(s => ({ unsavedBookmarks: s.unsavedBookmarks.filter(id => id !== messageId) })),
  incrementTurnCount: () => set(s => ({ turnCount: s.turnCount + 1 })),
  markFindingCreatedThisSession: () => set({ findingsCreatedThisSession: true }),
  resetSessionState: () =>
    set({
      pendingSaveProposals: 0,
      unsavedBookmarks: [],
      turnCount: 0,
      findingsCreatedThisSession: false,
    }),
  shouldShowClosePrompt: () => {
    const { pendingSaveProposals, unsavedBookmarks, turnCount, findingsCreatedThisSession } = get();
    return (
      pendingSaveProposals > 0 ||
      unsavedBookmarks.length > 0 ||
      (turnCount >= 5 && !findingsCreatedThisSession)
    );
  },
  upsertWallSuggestion: suggestion =>
    set(s => {
      const existingIndex = s.wallSuggestions.findIndex(x => x.id === suggestion.id);
      if (existingIndex === -1) {
        return { wallSuggestions: [...s.wallSuggestions, suggestion] };
      }
      const next = s.wallSuggestions.slice();
      next[existingIndex] = suggestion;
      return { wallSuggestions: next };
    }),
  dismissWallSuggestion: id =>
    set(s => ({ wallSuggestions: s.wallSuggestions.filter(x => x.id !== id) })),
  clearWallSuggestions: () => set({ wallSuggestions: [] }),
}));
