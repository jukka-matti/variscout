/**
 * CoScoutSection — reusable CoScout panel wiring for Azure editor views.
 *
 * Extracts the CoScout-related state management and rendering from
 * EditorDashboardView so that both the Analysis view and the Investigation
 * workspace can mount a fully-wired CoScout panel without duplicating
 * callback construction, visual grounding setup, or session-close prompt logic.
 *
 * The component:
 * - Reads `isCoScoutOpen` from panelsStore
 * - Reads `aiEnabled` from sessionStore
 * - Calls `useCoScoutProps` to assemble the 20+ CoScoutPanelBase props
 * - Sets up visual grounding callbacks via `useVisualGrounding`
 * - Manages session-close prompt state (pending unsaved insights)
 * - Renders `CoScoutPanelBase` when CoScout is open (phone overlay or sidebar)
 * - Renders `SessionClosePrompt` when the user tries to close with pending items
 */

import React, { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { CoScoutPanelBase, SessionClosePrompt } from '@variscout/ui';
import type { SessionClosePromptItem } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { useSessionStore } from '@variscout/stores';
import { useVisualGrounding } from '@variscout/hooks';
import { useCoScoutProps } from '@variscout/hooks';
import type { UseFindingsReturn, UseQuestionsReturn } from '@variscout/hooks';
import { isAIAvailable } from '../../services/aiService';
import { isSpeechToTextAvailable, transcribeAudio } from '../../services/speechService';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useAIStore } from '../../features/ai/aiStore';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { UseActionProposalsReturn } from '../../features/ai';
import { useFilteredData, useAnalysisStats } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COSCOUT_RESIZE_CONFIG = {
  storageKey: 'variscout-azure-coscout-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CoScoutSectionProps {
  /** AI orchestration state (coscout, knowledgeSearch, suggestedQuestions) */
  aiOrch: UseAIOrchestrationReturn;
  /** Findings state for insight capture callbacks */
  findingsState: UseFindingsReturn;
  /** Questions state for insight capture callbacks */
  questionsState: UseQuestionsReturn;
  /** Action proposals state — Azure-only, required for close-prompt logic */
  actionProposalsState: UseActionProposalsReturn;
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
// Component
// ---------------------------------------------------------------------------

export const CoScoutSection: React.FC<CoScoutSectionProps> = ({
  aiOrch,
  findingsState,
  questionsState,
  actionProposalsState,
  handleSearchKnowledge,
  handleAddCommentWithAuthor,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const aiEnabled = useSessionStore(s => s.aiEnabled);
  const filters = useProjectStore(s => s.filters);
  const { filteredData } = useFilteredData();
  const { stats } = useAnalysisStats();

  // Session-close prompt state (ADR-049)
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [closePromptItems, setClosePromptItems] = useState<SessionClosePromptItem[]>([]);

  // Visual grounding for CoScout REF markers (ADR-057)
  const { highlight: visualGroundingHighlight } = useVisualGrounding({
    onFocusChart: chartType => {
      usePanelsStore.getState().setPendingChartFocus(chartType);
    },
    onExpandPanel: (panelId, targetId) => {
      if (panelId === 'question' || panelId === 'finding') {
        usePanelsStore.getState().setPIActiveTab('questions');
        if (!usePanelsStore.getState().isPISidebarOpen) {
          usePanelsStore.getState().togglePISidebar();
        }
        if (panelId === 'question' && targetId) {
          questionsState.setFocusedQuestion(targetId);
        }
      } else if (panelId === 'stats') {
        usePanelsStore.getState().setPIActiveTab('stats');
        if (!usePanelsStore.getState().isPISidebarOpen) {
          usePanelsStore.getState().togglePISidebar();
        }
      } else if (panelId === 'improvement') {
        usePanelsStore.getState().showImprovement();
      }
    },
  });

  // Assemble the shared CoScout props via useCoScoutProps hook (Task 2)
  const coScoutProps = useCoScoutProps({
    aiOrch: {
      coscout: aiOrch.coscout,
      knowledgeSearch: aiOrch.knowledgeSearch,
      suggestedQuestions: aiOrch.suggestedQuestions,
      resizeConfig: COSCOUT_RESIZE_CONFIG,
    },
    findingsState,
    questionsState,
    actionProposalsState: {
      actionProposals: actionProposalsState.actionProposals,
      handleExecuteAction: actionProposalsState.handleExecuteAction,
      handleDismissAction: actionProposalsState.handleDismissAction,
    },
    filters,
    stats,
    filteredDataLength: filteredData?.length ?? 0,
    visualGroundingHighlight,
    handleSearchKnowledge,
    handleAddCommentWithAuthor,
  });

  // CoScout close intercept: check for unsaved insights before closing (ADR-049)
  const handleCoScoutClose = useCallback(() => {
    const aiState = useAIStore.getState();
    if (!aiState.shouldShowClosePrompt()) {
      usePanelsStore.getState().setCoScoutOpen(false);
      aiState.resetSessionState();
      return;
    }

    // Build items list from unsaved bookmarks and pending save proposals
    const messages = aiState.coscoutMessages;
    const items: SessionClosePromptItem[] = [];

    // Bookmarked messages (preChecked = true, user explicitly bookmarked them)
    for (const messageId of aiState.unsavedBookmarks) {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        items.push({ id: `bookmark:${messageId}`, text: msg.content, preChecked: true });
      }
    }

    // Pending save proposals from action proposals (preChecked = false, suggested by AI)
    for (const proposal of aiState.actionProposals) {
      if (proposal.tool === 'suggest_save_finding' && proposal.status === 'pending') {
        const text =
          proposal.editableText ??
          (typeof proposal.params.insight_text === 'string' ? proposal.params.insight_text : '');
        if (text) {
          items.push({ id: `proposal:${proposal.id}`, text, preChecked: false });
        }
      }
    }

    if (items.length === 0) {
      // No specific items but threshold met (turn count) — close without prompt
      usePanelsStore.getState().setCoScoutOpen(false);
      aiState.resetSessionState();
      return;
    }

    setClosePromptItems(items);
    setShowClosePrompt(true);
  }, []);

  // Save selected items as findings and close
  const handleClosePromptSave = useCallback(
    (selectedIds: string[]) => {
      for (const id of selectedIds) {
        if (id.startsWith('bookmark:')) {
          const messageId = id.slice('bookmark:'.length);
          const messages = useAIStore.getState().coscoutMessages;
          const msg = messages.find(m => m.id === messageId);
          if (msg) {
            coScoutProps.onSaveAsNewFinding(msg.content, messageId);
          }
        }
        // Proposals are applied via their own action handlers — skip here
      }
      setShowClosePrompt(false);
      usePanelsStore.getState().setCoScoutOpen(false);
      useAIStore.getState().resetSessionState();
    },
    [coScoutProps]
  );

  // Dismiss without saving and close
  const handleClosePromptDismiss = useCallback(() => {
    setShowClosePrompt(false);
    usePanelsStore.getState().setCoScoutOpen(false);
    useAIStore.getState().resetSessionState();
  }, []);

  const aiAvailable = aiEnabled && isAIAvailable();
  const voiceInput = isSpeechToTextAvailable() ? { isAvailable: true, transcribeAudio } : undefined;

  // Don't render anything if AI is not available (CoScoutPanelBase handles isOpen=false)
  if (!aiAvailable && !isCoScoutOpen) {
    return null;
  }

  // Destructure onAddCommentToHypothesis from hook (name differs from CoScoutPanelBase prop)
  const { onAddCommentToHypothesis, ...restCoScoutProps } = coScoutProps;

  return (
    <>
      {/* CoScoutPanel: full-screen overlay on phone, inline sidebar on desktop */}
      {isPhone && isCoScoutOpen ? (
        <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
            <h2 className="text-sm font-semibold text-content">CoScout</h2>
            <button
              onClick={handleCoScoutClose}
              className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label="Close CoScout"
            >
              <X size={20} />
            </button>
          </div>
          <CoScoutPanelBase
            isOpen={true}
            onClose={handleCoScoutClose}
            {...restCoScoutProps}
            onAddCommentToQuestion={onAddCommentToHypothesis}
            voiceInput={voiceInput}
          />
        </div>
      ) : (
        <CoScoutPanelBase
          isOpen={isCoScoutOpen}
          onClose={handleCoScoutClose}
          {...restCoScoutProps}
          onAddCommentToQuestion={onAddCommentToHypothesis}
          voiceInput={voiceInput}
        />
      )}

      {/* Session-close save prompt (ADR-049) */}
      <SessionClosePrompt
        isOpen={showClosePrompt}
        items={closePromptItems}
        onSave={handleClosePromptSave}
        onDismiss={handleClosePromptDismiss}
      />
    </>
  );
};
