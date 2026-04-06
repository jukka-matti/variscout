/**
 * useCoScoutProps - Assembles the shared CoScoutPanelBase props object.
 *
 * Extracts the 20+ prop assembly from EditorDashboardView.tsx into a
 * reusable hook so that both the dashboard view and the investigation
 * workspace can spread the same props onto CoScoutPanelBase without
 * duplicating callback construction logic.
 *
 * The hook accepts:
 * - `aiOrch`  — return value of useAIOrchestration (coscout, knowledgeSearch, suggestedQuestions)
 * - `findingsState` — UseFindingsReturn (addFinding, addFindingComment, findings list)
 * - `questionsState` — UseQuestionsReturn (addIdea, questions list)
 * - `actionProposalsState` — UseActionProposalsReturn (proposals + execute/dismiss)
 * - `filters` — current active filter record for finding context
 * - `stats` — current stats slice for finding context
 * - `filteredDataLength` — length of filtered data for finding context
 * - `visualGroundingHighlight` — callback to activate a REF marker
 * - `handleSearchKnowledge` — triggers on-demand KB search
 * - `handleAddCommentWithAuthor` — routes photo-attachment comments
 *
 * Returns a partial CoScoutPanelBaseProps object (all props except
 * `isOpen`/`onClose` which remain in the consuming component).
 */

import { useCallback, useMemo } from 'react';
import type { ActionProposal, CoScoutMessage, CoScoutError, StatsResult } from '@variscout/core';
import type { UseFindingsReturn } from './useFindings';
import type { UseQuestionsReturn } from './useQuestions';
import type { UseAICoScoutReturn } from './useAICoScout';
import type { UseKnowledgeSearchReturn, DocumentResult } from './useKnowledgeSearch';

// ---------------------------------------------------------------------------
// Inline minimal shapes for the aiOrch and actionProposalsState parameters.
// These mirror the relevant slices of UseAIOrchestrationReturn and
// UseActionProposalsReturn without introducing a dependency on the azure-app.
// ---------------------------------------------------------------------------

export interface CoScoutAIOrchSlice {
  coscout: UseAICoScoutReturn;
  knowledgeSearch: UseKnowledgeSearchReturn;
  suggestedQuestions: string[];
  resizeConfig: CoScoutResizeConfig;
}

export interface CoScoutResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

export interface CoScoutActionProposalsSlice {
  actionProposals: ActionProposal[];
  handleExecuteAction: (proposal: ActionProposal, editedText?: string) => void;
  handleDismissAction: (proposalId: string) => void;
}

// ---------------------------------------------------------------------------
// Stats slice needed for finding context — mirrors the fields used downstream
// ---------------------------------------------------------------------------

interface StatsSliceForFinding {
  mean: number;
  median: number;
  cpk?: number | null;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseCoScoutPropsReturn {
  messages: CoScoutMessage[];
  onSend: (
    text: string,
    images?: Array<{ id: string; dataUrl: string; mimeType?: string }>
  ) => void;
  isLoading: boolean;
  isStreaming: boolean;
  onStopStreaming: () => void;
  error: CoScoutError | null;
  onRetry: () => void;
  onClear: () => void;
  onCopyLastResponse: () => Promise<boolean>;
  resizeConfig: CoScoutResizeConfig;
  suggestedQuestions: string[];
  onSuggestedQuestionClick: (
    text: string,
    images?: Array<{ id: string; dataUrl: string; mimeType?: string }>
  ) => void;
  knowledgeAvailable: boolean;
  knowledgeSearching: boolean;
  knowledgeDocuments: DocumentResult[];
  onSearchKnowledge: () => void;
  actionProposals: ActionProposal[];
  onExecuteAction: (proposal: ActionProposal, editedText?: string) => void;
  onDismissAction: (proposalId: string) => void;
  onSaveAsNewFinding: (text: string, sourceMessageId: string) => void;
  onAddCommentToFinding: (findingId: string, text: string, attachment?: File) => void;
  onAddCommentToHypothesis: (questionId: string, text: string) => void;
  insightFindings: Array<{ id: string; text: string }>;
  insightQuestions: Array<{ id: string; text: string }>;
  onRefActivate: (targetType: string, targetId?: string) => void;
}

// ---------------------------------------------------------------------------
// Hook inputs
// ---------------------------------------------------------------------------

export interface UseCoScoutPropsOptions {
  /** Slice of AI orchestration state (coscout, knowledgeSearch, suggestedQuestions, resizeConfig) */
  aiOrch: CoScoutAIOrchSlice;
  /** Findings state for insight capture callbacks */
  findingsState: UseFindingsReturn;
  /** Questions state for insight capture callbacks */
  questionsState: UseQuestionsReturn;
  /** Action proposals state for execution/dismissal callbacks */
  actionProposalsState: CoScoutActionProposalsSlice;
  /** Current active filters (for finding context) */
  filters: Record<string, (string | number)[]>;
  /** Current stats result (for finding context) */
  stats: StatsSliceForFinding | StatsResult | null | undefined;
  /** Length of filtered data (for finding context) */
  filteredDataLength: number;
  /** Activates a visual grounding REF marker in the Evidence Map */
  visualGroundingHighlight: (targetType: string, targetId?: string) => void;
  /** Triggers on-demand KB search */
  handleSearchKnowledge: () => void;
  /**
   * Routes photo-attachment comments — if no attachment, delegates to
   * findingsState.addFindingComment directly.
   */
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCoScoutProps(options: UseCoScoutPropsOptions): UseCoScoutPropsReturn {
  const {
    aiOrch,
    findingsState,
    questionsState,
    actionProposalsState,
    filters,
    stats,
    filteredDataLength,
    visualGroundingHighlight,
    handleSearchKnowledge,
    handleAddCommentWithAuthor,
  } = options;

  const { coscout, knowledgeSearch, suggestedQuestions, resizeConfig } = aiOrch;
  const { actionProposals, handleExecuteAction, handleDismissAction } = actionProposalsState;

  // Wrapped send — callers pass images as plain objects; useAICoScout.send
  // requires { id, dataUrl, mimeType } which is the same shape already.
  const handleCoScoutSend = useCallback(
    (text: string, images?: Array<{ id: string; dataUrl: string; mimeType?: string }>) => {
      coscout.send(
        text,
        images?.map(img => ({
          id: img.id,
          dataUrl: img.dataUrl,
          mimeType: img.mimeType ?? 'image/png',
        }))
      );
    },
    [coscout]
  );

  // Save CoScout insight as a new finding
  const handleSaveAsNewFinding = useCallback(
    (text: string, sourceMessageId: string) => {
      findingsState.addFinding(
        text,
        {
          activeFilters: filters,
          cumulativeScope: null,
          stats: stats
            ? {
                mean: stats.mean,
                median: stats.median,
                cpk: (stats as StatsSliceForFinding).cpk ?? undefined,
                samples: filteredDataLength,
              }
            : undefined,
        },
        { chart: 'coscout', messageId: sourceMessageId }
      );
    },
    [findingsState, filters, stats, filteredDataLength]
  );

  // Add comment to an existing finding, routing attachments via the author handler
  const handleAddCommentToFinding = useCallback(
    (findingId: string, text: string, attachment?: File) => {
      if (attachment) {
        void handleAddCommentWithAuthor(findingId, text, attachment);
      } else {
        findingsState.addFindingComment(findingId, text);
      }
    },
    [findingsState, handleAddCommentWithAuthor]
  );

  // Add a comment/idea to a question
  const handleAddCommentToQuestion = useCallback(
    (questionId: string, text: string) => {
      questionsState.addIdea(questionId, text);
    },
    [questionsState]
  );

  // Insight target lists for SaveInsightDialog
  const insightFindings = useMemo(
    () => findingsState.findings.map(f => ({ id: f.id, text: f.text })),
    [findingsState.findings]
  );

  const insightQuestions = useMemo(
    () => questionsState.questions.map(h => ({ id: h.id, text: h.text })),
    [questionsState.questions]
  );

  return {
    messages: coscout.messages,
    onSend: handleCoScoutSend,
    isLoading: coscout.isLoading,
    isStreaming: coscout.isStreaming ?? false,
    onStopStreaming: coscout.stopStreaming,
    error: coscout.error,
    onRetry: coscout.retry,
    onClear: coscout.clear,
    onCopyLastResponse: coscout.copyLastResponse,
    resizeConfig,
    suggestedQuestions,
    onSuggestedQuestionClick: handleCoScoutSend,
    knowledgeAvailable: knowledgeSearch.isAvailable,
    knowledgeSearching: knowledgeSearch.isSearching,
    knowledgeDocuments: knowledgeSearch.documents ?? [],
    onSearchKnowledge: handleSearchKnowledge,
    actionProposals,
    onExecuteAction: handleExecuteAction,
    onDismissAction: handleDismissAction,
    onSaveAsNewFinding: handleSaveAsNewFinding,
    onAddCommentToFinding: handleAddCommentToFinding,
    onAddCommentToHypothesis: handleAddCommentToQuestion,
    insightFindings,
    insightQuestions,
    onRefActivate: visualGroundingHighlight,
  };
}
