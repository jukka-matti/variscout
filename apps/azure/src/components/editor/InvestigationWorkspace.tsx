import React, { useCallback, useMemo, useState } from 'react';
import {
  QuestionChecklist,
  InvestigationPhaseBadge,
  InvestigationConclusion,
  FindingsLog,
  CoScoutPanelBase,
} from '@variscout/ui';
import {
  useResizablePanel,
  useQuestionGeneration,
  useProblemStatement,
  type UseFindingsReturn,
  type UseQuestionsReturn,
} from '@variscout/hooks';
import type { FindingStatus, Question } from '@variscout/core';
import { hasTeamFeatures, inferCharacteristicType } from '@variscout/core';
import { detectInvestigationPhase } from '@variscout/core/ai';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { GripVertical } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationStore } from '../../features/investigation/investigationStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import type { UseAIOrchestrationReturn } from '../../features/ai';

// Resize panel config (individual args for useResizablePanel)

interface InvestigationWorkspaceProps {
  // Findings
  findingsState: UseFindingsReturn;
  handleRestoreFinding: UseFindingsOrchestrationReturn['handleRestoreFinding'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  handleNavigateToChart: UseFindingsOrchestrationReturn['handleNavigateToChart'];
  handleShareFinding: UseFindingsOrchestrationReturn['handleShareFinding'];
  drillPath: UseFindingsOrchestrationReturn['drillPath'];
  // Questions
  questionsState: UseQuestionsReturn;
  handleCreateQuestion: (findingId: string, text: string, factor?: string, level?: string) => void;
  handleProjectIdea: (questionId: string, ideaId: string) => void;
  // Comments
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
  handleAddPhoto: ((findingId: string, commentId: string, file: File) => Promise<void>) | undefined;
  handleCaptureFromTeams: ((findingId: string, commentId: string) => Promise<void>) | undefined;
  isTeamsCamera: boolean;
  // AI
  aiOrch: UseAIOrchestrationReturn;
  // Column aliases
  columnAliases: Record<string, string>;
  // View state
  viewMode?: 'list' | 'board' | 'tree';
  onViewModeChange?: (mode: 'list' | 'board' | 'tree') => void;
}

/**
 * Investigation workspace (ADR-055): Three-column layout for question-driven EDA.
 *
 * Left: QuestionChecklist + PhaseBadge + InvestigationConclusion
 * Center: FindingsLog (list / board / tree)
 * Right: CoScout (optional)
 */
export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  handleNavigateToChart,
  handleShareFinding,
  drillPath,
  questionsState,
  handleCreateQuestion,
  handleProjectIdea,
  handleAddCommentWithAuthor,
  handleAddPhoto,
  handleCaptureFromTeams,
  isTeamsCamera,
  aiOrch,
  columnAliases,
  viewMode: externalViewMode,
  onViewModeChange,
}) => {
  const {
    filteredData,
    outcome,
    factors,
    specs,
    processContext,
    setProcessContext,
    analysisMode,
    stats,
    cpkTarget,
  } = useData();

  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const questionsMap = useInvestigationStore(s => s.questionsMap);
  const ideaImpacts = useInvestigationStore(s => s.ideaImpacts);

  // Investigation phase (deterministic, from question/findings state)
  const investigationPhase = useMemo(
    () => detectInvestigationPhase(questionsState.questions, findingsState.findings),
    [questionsState.questions, findingsState.findings]
  );

  // Question generation (ADR-053) — computed from data context
  const resolved = resolveMode(analysisMode ?? 'standard');
  const strategy = getStrategy(resolved);
  const { questions: factorIntelQuestions, handleQuestionClick } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    questionsState,
    mode: resolved,
  });

  // Characteristic type derived from spec configuration (for Watson Q2)
  const characteristicType = useMemo(() => inferCharacteristicType(specs), [specs]);

  // Location factor: first significant single-factor question from Factor Intelligence (for Watson Q3)
  // Picks the first factor-intel question that has a factor and is not ruled out — ordered by
  // evidence (rSquaredAdj) descending. This is available as soon as bestSubsets runs.
  const locationFactor = useMemo(() => {
    const topQuestion = factorIntelQuestions
      .filter(q => q.factor && q.causeRole !== 'ruled-out' && q.questionSource === 'factor-intel')
      .sort(
        (a, b) =>
          (b.evidence?.rSquaredAdj ?? b.evidence?.etaSquared ?? 0) -
          (a.evidence?.rSquaredAdj ?? a.evidence?.etaSquared ?? 0)
      )[0];
    if (!topQuestion?.factor) return undefined;
    return {
      factor: topQuestion.factor,
      level: topQuestion.level,
      evidence: topQuestion.evidence?.rSquaredAdj ?? topQuestion.evidence?.etaSquared,
    };
  }, [factorIntelQuestions]);

  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-investigation-left-width', 260, 420, 320, 'left');

  // Internal view mode (if not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'board' | 'tree'>('board');
  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewMode = onViewModeChange ?? setInternalViewMode;

  // Categorize questions for InvestigationConclusion
  const { suspectedCauses, contributing, ruledOut } = useMemo(() => {
    const suspected: Question[] = [];
    const contrib: Question[] = [];
    const ruled: Question[] = [];
    for (const h of questionsState.questions) {
      if (h.causeRole === 'suspected-cause') suspected.push(h);
      else if (h.causeRole === 'contributing') contrib.push(h);
      else if (h.causeRole === 'ruled-out') ruled.push(h);
    }
    return { suspectedCauses: suspected, contributing: contrib, ruledOut: ruled };
  }, [questionsState.questions]);

  const { coscout } = aiOrch;

  const drillFactors = useMemo(() => drillPath.map(d => d.factor), [drillPath]);

  // Problem statement auto-synthesis (Watson's 3 questions)
  const handleProblemStatementChange = useCallback(
    (text: string) => {
      setProcessContext({ ...processContext, problemStatement: text });
    },
    [processContext, setProcessContext]
  );

  const problemStatement = useProblemStatement({
    outcome,
    targetCpk: cpkTarget,
    currentCpk: stats?.cpk ?? undefined,
    characteristicType,
    locationFactor,
    questions: questionsState.questions,
    existingStatement: processContext?.problemStatement,
    onStatementChange: handleProblemStatementChange,
  });

  // Issue statement handlers
  const handleIssueStatementChange = (text: string) => {
    setProcessContext({ ...processContext, issueStatement: text });
  };

  // Question click: switch to Analysis workspace with factor focused (round-trip pattern)
  const handleQuestionClickWithSwitch = (question: Question) => {
    handleQuestionClick(question);
    usePanelsStore.getState().showAnalysis();
  };

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Left panel: Question checklist + phase + conclusions */}
      <div
        className="relative flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
        style={{ width: leftPanel.width }}
      >
        {/* Phase badge */}
        {investigationPhase && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <InvestigationPhaseBadge phase={investigationPhase} />
          </div>
        )}

        {/* Question checklist */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <QuestionChecklist
            questions={factorIntelQuestions}
            issueStatement={processContext?.issueStatement}
            onIssueStatementChange={handleIssueStatementChange}
            onQuestionClick={handleQuestionClickWithSwitch}
            problemStatement={processContext?.problemStatement}
            evidenceLabel={strategy.questionStrategy.evidenceLabel}
          />
        </div>

        {/* Investigation conclusion */}
        {(suspectedCauses.length > 0 || ruledOut.length > 0) && (
          <div className="border-t border-edge px-3 py-2 flex-shrink-0">
            <InvestigationConclusion
              suspectedCauses={suspectedCauses}
              ruledOut={ruledOut}
              contributing={contributing}
              problemStatement={processContext?.problemStatement}
              hasConclusions={suspectedCauses.length > 0}
              problemStatementDraft={problemStatement.draft}
              isProblemStatementReady={problemStatement.isReady}
              onGenerateProblemStatement={problemStatement.generate}
              onAcceptProblemStatement={problemStatement.accept}
              onDismissProblemStatement={problemStatement.dismiss}
            />
          </div>
        )}

        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
          onMouseDown={leftPanel.handleMouseDown}
        >
          <GripVertical
            size={12}
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 text-content-tertiary"
          />
        </div>
      </div>

      {/* Center: Findings (list/board/tree) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-surface flex-shrink-0">
          {(['list', 'board', 'tree'] as const).map(mode => (
            <button
              key={mode}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === mode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
              }`}
              onClick={() => handleViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-content-tertiary">
            {findingsState.findings.length} finding
            {findingsState.findings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Findings content */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <FindingsLog
            findings={findingsState.findings}
            onEditFinding={findingsState.editFinding}
            onDeleteFinding={findingsState.deleteFinding}
            onRestoreFinding={handleRestoreFinding}
            viewMode={viewMode}
            questions={questionsState.questions}
            onSelectQuestion={h => useInvestigationStore.getState().expandToQuestion(h.id)}
            onAddSubQuestion={questionsState.addSubQuestion}
            factors={drillFactors}
            getChildrenSummary={questionsState.getChildrenSummary}
            onSetFindingStatus={handleSetFindingStatus}
            onSetFindingTag={findingsState.setFindingTag}
            onAddComment={(id: string, text: string) => handleAddCommentWithAuthor(id, text)}
            columnAliases={columnAliases}
            activeFindingId={highlightedFindingId}
            onAddPhoto={
              hasTeamFeatures() && handleAddPhoto
                ? (fId: string, cId: string, file: File) => {
                    handleAddPhoto(fId, cId, file);
                  }
                : undefined
            }
            onCaptureFromTeams={
              hasTeamFeatures() && isTeamsCamera && handleCaptureFromTeams
                ? (fId: string, cId: string) => {
                    handleCaptureFromTeams(fId, cId);
                  }
                : undefined
            }
            onCreateQuestion={handleCreateQuestion}
            questionsMap={questionsMap}
            onSetValidationTask={questionsState.setValidationTask}
            onCompleteTask={questionsState.completeTask}
            onSetManualStatus={questionsState.setManualStatus}
            onAddAction={findingsState.addAction}
            onCompleteAction={findingsState.completeAction}
            onDeleteAction={findingsState.deleteAction}
            onSetOutcome={findingsState.setOutcome}
            ideaImpacts={ideaImpacts}
            onAddIdea={questionsState.addIdea}
            onUpdateIdea={questionsState.updateIdea}
            onRemoveIdea={questionsState.removeIdea}
            onSelectIdea={questionsState.selectIdea}
            onProjectIdea={handleProjectIdea}
            onSetCauseRole={questionsState.setCauseRole}
            onShareFinding={handleShareFinding}
            onNavigateToChart={handleNavigateToChart}
            showAuthors
          />
        </div>
      </div>

      {/* Right: CoScout panel (optional, self-managing resize) */}
      {coscout && (
        <CoScoutPanelBase
          isOpen={isCoScoutOpen}
          onClose={() => usePanelsStore.getState().setCoScoutOpen(false)}
          resizeConfig={{
            storageKey: 'variscout-azure-coscout-panel-width',
            min: 320,
            max: 600,
            defaultWidth: 384,
          }}
          messages={coscout.messages}
          onSend={
            coscout.send as (
              text: string,
              images?: { id: string; dataUrl: string; mimeType?: string }[]
            ) => void
          }
          isLoading={coscout.isLoading}
          isStreaming={coscout.isStreaming}
          onStopStreaming={coscout.stopStreaming}
          error={coscout.error}
          onRetry={coscout.retry}
          suggestedQuestions={aiOrch.suggestedQuestions}
        />
      )}
    </div>
  );
};
