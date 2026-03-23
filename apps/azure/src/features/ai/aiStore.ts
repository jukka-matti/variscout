import { create } from 'zustand';
import type { ActionProposal } from '@variscout/core';
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
  /** Resolved channel folder SharePoint URL */
  resolvedChannelFolderUrl: string | undefined;
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
  setResolvedChannelFolderUrl: (url: string | undefined) => void;
  setKnowledgeSearchScope: (scope: string | undefined) => void;
  setKnowledgeSearchTimestamp: (ts: number | undefined) => void;
  syncKnowledgeSearch: (state: {
    isAvailable: boolean;
    isSearching: boolean;
    documents: UseKnowledgeSearchReturn['documents'];
  }) => void;
  /** Set or clear a pending question to pre-fill CoScout from the project dashboard */
  setPendingDashboardQuestion: (question: string | null) => void;
}

export type AIStore = AIStoreState & AIStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useAIStore = create<AIStore>(set => ({
  // Initial state
  pendingDashboardQuestion: null,
  narration: null,
  coscoutMessages: [],
  suggestedQuestions: [],
  actionProposals: [],
  aiContextSummary: null,
  kbPermissionWarning: false,
  providerLabel: null,
  resolvedChannelFolderUrl: undefined,
  knowledgeSearchScope: undefined,
  knowledgeSearchTimestamp: undefined,
  knowledgeAvailable: false,
  knowledgeSearching: false,
  knowledgeDocuments: [],

  // Actions
  syncNarration: narration => set({ narration }),
  syncCoScoutMessages: messages => set({ coscoutMessages: messages }),
  syncSuggestedQuestions: questions => set({ suggestedQuestions: questions }),
  syncActionProposals: proposals => set({ actionProposals: proposals }),
  syncAIContext: summary => set({ aiContextSummary: summary }),
  setKbPermissionWarning: value => set({ kbPermissionWarning: value }),
  setProviderLabel: label => set({ providerLabel: label }),
  setResolvedChannelFolderUrl: url => set({ resolvedChannelFolderUrl: url }),
  setKnowledgeSearchScope: scope => set({ knowledgeSearchScope: scope }),
  setKnowledgeSearchTimestamp: ts => set({ knowledgeSearchTimestamp: ts }),
  syncKnowledgeSearch: state =>
    set({
      knowledgeAvailable: state.isAvailable,
      knowledgeSearching: state.isSearching,
      knowledgeDocuments: state.documents,
    }),
  setPendingDashboardQuestion: question => set({ pendingDashboardQuestion: question }),
}));
