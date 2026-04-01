/**
 * InvestigationView - Question-driven investigation workspace for PWA
 *
 * Simplified version of Azure's InvestigationWorkspace:
 * - Left panel: QuestionChecklist + InvestigationPhaseBadge + InvestigationConclusion
 * - Center: FindingsLog (list/board/tree)
 * - No CoScout (PWA has no AI)
 * - No Teams integration (no photos, no assignees)
 * - 3-status findings (not 5)
 */
import React, { useMemo, useState } from 'react';
import {
  QuestionChecklist,
  InvestigationPhaseBadge,
  InvestigationConclusion,
  FindingsLog,
} from '@variscout/ui';
import {
  useResizablePanel,
  type UseFindingsReturn,
  type UseHypothesesReturn,
} from '@variscout/hooks';
import type { FindingStatus, Hypothesis } from '@variscout/core';
import { detectInvestigationPhase } from '@variscout/core/ai';
import { getStrategy } from '@variscout/core/strategy';
import type { ResolvedMode } from '@variscout/core/strategy';
import type { DrillStep } from '@variscout/hooks';
import { GripVertical } from 'lucide-react';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { useInvestigationStore } from '../../features/investigation/investigationStore';
import { usePanelsStore } from '../../features/panels/panelsStore';

interface InvestigationViewProps {
  // Data context
  filteredData: Record<string, unknown>[];
  outcome: string | null;
  factors: string[];
  // Findings
  findingsState: UseFindingsReturn;
  handleRestoreFinding: (id: string) => void;
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  drillPath: DrillStep[];
  // Hypotheses
  hypothesesState: UseHypothesesReturn;
  handleCreateHypothesis: (
    findingId: string,
    text: string,
    factor?: string,
    level?: string
  ) => void;
  // Question generation
  factorIntelQuestions: Hypothesis[];
  handleQuestionClick: (question: Hypothesis) => void;
  // Column aliases
  columnAliases: Record<string, string>;
  // Strategy
  resolvedMode: ResolvedMode;
}

const InvestigationView: React.FC<InvestigationViewProps> = ({
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  drillPath,
  hypothesesState,
  handleCreateHypothesis,
  factorIntelQuestions,
  handleQuestionClick,
  columnAliases,
  resolvedMode,
}) => {
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const hypothesesMap = useInvestigationStore(s => s.hypothesesMap);
  const ideaImpacts = useInvestigationStore(s => s.ideaImpacts);

  // Investigation phase detection (deterministic)
  const investigationPhase = useMemo(
    () => detectInvestigationPhase(hypothesesState.hypotheses, findingsState.findings),
    [hypothesesState.hypotheses, findingsState.findings]
  );

  const strategy = getStrategy(resolvedMode);

  // Left panel resizable
  const leftPanel = useResizablePanel(
    'variscout-pwa-investigation-left-width',
    220,
    400,
    280,
    'left'
  );

  // View mode (list/board/tree)
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'tree'>('board');

  // Categorize hypotheses for InvestigationConclusion
  const { suspectedCauses, contributing, ruledOut } = useMemo(() => {
    const suspected: Hypothesis[] = [];
    const contrib: Hypothesis[] = [];
    const ruled: Hypothesis[] = [];
    for (const h of hypothesesState.hypotheses) {
      if (h.causeRole === 'suspected-cause') suspected.push(h);
      else if (h.causeRole === 'contributing') contrib.push(h);
      else if (h.causeRole === 'ruled-out') ruled.push(h);
    }
    return { suspectedCauses: suspected, contributing: contrib, ruledOut: ruled };
  }, [hypothesesState.hypotheses]);

  const drillFactors = useMemo(() => drillPath.map(d => d.factor), [drillPath]);

  // Question click: switch back to Analysis workspace with factor focused
  const handleQuestionClickWithSwitch = (question: Hypothesis) => {
    handleQuestionClick(question);
    usePanelsStore.getState().showAnalysis();
  };

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Left panel: Question checklist + phase + conclusions */}
      <div
        className="relative hidden md:flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
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
            onQuestionClick={handleQuestionClickWithSwitch}
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
              hasConclusions={suspectedCauses.length > 0}
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
              onClick={() => setViewMode(mode)}
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
            hypotheses={hypothesesState.hypotheses}
            onSelectHypothesis={h => useInvestigationStore.getState().expandToHypothesis(h.id)}
            onAddSubHypothesis={hypothesesState.addSubHypothesis}
            factors={drillFactors}
            getChildrenSummary={hypothesesState.getChildrenSummary}
            onSetFindingStatus={handleSetFindingStatus}
            onSetFindingTag={findingsState.setFindingTag}
            onAddComment={(id: string, text: string) => findingsState.addFindingComment(id, text)}
            columnAliases={columnAliases}
            activeFindingId={highlightedFindingId}
            onCreateHypothesis={handleCreateHypothesis}
            hypothesesMap={hypothesesMap}
            onSetValidationTask={hypothesesState.setValidationTask}
            onCompleteTask={hypothesesState.completeTask}
            onSetManualStatus={hypothesesState.setManualStatus}
            onAddAction={findingsState.addAction}
            onCompleteAction={findingsState.completeAction}
            onDeleteAction={findingsState.deleteAction}
            onSetOutcome={findingsState.setOutcome}
            ideaImpacts={ideaImpacts}
            onAddIdea={hypothesesState.addIdea}
            onUpdateIdea={hypothesesState.updateIdea}
            onRemoveIdea={hypothesesState.removeIdea}
            onSelectIdea={hypothesesState.selectIdea}
            onSetCauseRole={hypothesesState.setCauseRole}
          />
        </div>
      </div>
    </div>
  );
};

export default InvestigationView;
