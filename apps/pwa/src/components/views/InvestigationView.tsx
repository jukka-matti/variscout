/**
 * InvestigationView - Question-driven investigation workspace for PWA
 *
 * Simplified version of Azure's InvestigationWorkspace:
 * - Left panel: QuestionChecklist + InvestigationPhaseBadge + InvestigationConclusion
 * - Center: Map/Wall toggle → FindingsLog (list/board/tree) | WallCanvas
 * - No CoScout (PWA has no AI)
 * - No Teams integration (no photos, no assignees)
 * - 3-status findings (not 5)
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  QuestionChecklist,
  InvestigationPhaseBadge,
  InvestigationConclusion,
  FindingsLog,
} from '@variscout/ui';
import {
  useResizablePanel,
  type UseFindingsReturn,
  type UseQuestionsReturn,
} from '@variscout/hooks';
import type { FindingStatus, Question } from '@variscout/core';
import { detectInvestigationPhase } from '@variscout/core/ai';
import { getStrategy } from '@variscout/core/strategy';
import type { ResolvedMode } from '@variscout/core/strategy';
import type { DrillStep } from '@variscout/hooks';
import { GripVertical } from 'lucide-react';
import { useWallLayoutStore, useProjectStore, useInvestigationStore } from '@variscout/stores';
import {
  WallCanvas,
  CommandPalette,
  Minimap,
  CANVAS_W,
  CANVAS_H,
  useWallKeyboard,
} from '@variscout/charts';
import { useFindingsStore } from '../../features/findings/findingsStore';
import {
  useInvestigationFeatureStore,
  type QuestionDisplayData,
} from '../../features/investigation/investigationStore';
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
  // Questions
  questionsState: UseQuestionsReturn;
  handleCreateQuestion: (findingId: string, text: string, factor?: string, level?: string) => void;
  // Question generation
  factorIntelQuestions: Question[];
  handleQuestionClick: (question: Question) => void;
  // Column aliases
  columnAliases: Record<string, string>;
  // Strategy
  resolvedMode: ResolvedMode;
  // Derived investigation data (from orchestration hook)
  questionsMap: Record<string, QuestionDisplayData>;
  ideaImpacts: Record<string, import('@variscout/core').IdeaImpact | undefined>;
}

const InvestigationView: React.FC<InvestigationViewProps> = ({
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  drillPath,
  questionsState,
  handleCreateQuestion,
  factorIntelQuestions,
  handleQuestionClick,
  columnAliases,
  resolvedMode,
  questionsMap,
  ideaImpacts,
}) => {
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);

  // Map/Wall sub-toggle (mirrors Azure InvestigationWorkspace)
  const wallViewMode = useWallLayoutStore(s => s.viewMode);
  const setWallViewMode = useWallLayoutStore(s => s.setViewMode);
  // Phase 13 scale features — thread store values into WallCanvas so zoom,
  // pan, and tributary clustering survive re-renders and route through the
  // existing undo/persist infrastructure.
  const wallZoom = useWallLayoutStore(s => s.zoom);
  const wallPan = useWallLayoutStore(s => s.pan);
  const setWallPan = useWallLayoutStore(s => s.setPan);
  const wallGroupByTributary = useWallLayoutStore(s => s.groupByTributary);
  const setWallGroupByTributary = useWallLayoutStore(s => s.setGroupByTributary);
  const processMap = useProjectStore(s => s.processContext?.processMap);
  const rawData = useProjectStore(s => s.rawData);
  // Undefined when no rows are loaded so WallCanvas keeps the missing-column
  // badge suppressed (rather than flagging every hub against an empty set).
  const wallActiveColumns = useMemo<string[] | undefined>(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : undefined),
    [rawData]
  );
  const hubs = useInvestigationStore(s => s.suspectedCauses);
  const wallFindings = useInvestigationStore(s => s.findings);
  const wallQuestions = useInvestigationStore(s => s.questions);

  // Investigation phase detection (deterministic)
  const investigationPhase = useMemo(
    () => detectInvestigationPhase(questionsState.questions, findingsState.findings),
    [questionsState.questions, findingsState.findings]
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

  // Phase 13 — ⌘K command palette trigger. Only active when Wall is visible.
  const [paletteOpen, setPaletteOpen] = useState(false);
  useWallKeyboard({
    onSearch: () => {
      if (wallViewMode === 'wall') setPaletteOpen(true);
    },
  });

  // Phase 13 — resolve a CommandPalette result id to a canvas-space pan target.
  // Positioning mirrors WallCanvas's deterministic layout (hubs row at y=400,
  // questions row at y=900). WallCanvas doesn't expose node positions, so this
  // recomputation is a controlled duplication — refactor if the layout ever
  // becomes dynamic.
  const handlePanToNode = useCallback(
    (nodeId: string) => {
      const hubIndex = hubs.findIndex(h => h.id === nodeId);
      if (hubIndex >= 0) {
        const hubSpacing = CANVAS_W / (hubs.length + 1);
        setWallPan({
          x: CANVAS_W / 2 - hubSpacing * (hubIndex + 1),
          y: CANVAS_H / 2 - 400,
        });
        return;
      }
      const questionIndex = wallQuestions.findIndex(q => q.id === nodeId);
      if (questionIndex >= 0) {
        setWallPan({
          x: CANVAS_W / 2 - (200 + questionIndex * 240),
          y: CANVAS_H / 2 - 900,
        });
      }
    },
    [hubs, wallQuestions, setWallPan]
  );

  // Categorize questions for InvestigationConclusion
  const { suspectedCauses, contributing, ruledOut } = useMemo(() => {
    const suspected: Question[] = [];
    const contrib: Question[] = [];
    const ruled: Question[] = [];
    for (const q of questionsState.questions) {
      if (q.causeRole === 'suspected-cause') suspected.push(q);
      else if (q.causeRole === 'contributing') contrib.push(q);
      else if (q.causeRole === 'ruled-out') ruled.push(q);
    }
    return { suspectedCauses: suspected, contributing: contrib, ruledOut: ruled };
  }, [questionsState.questions]);

  const drillFactors = useMemo(() => drillPath.map(d => d.factor), [drillPath]);

  // Question click: switch back to Analysis workspace with factor focused
  const handleQuestionClickWithSwitch = (question: Question) => {
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

      {/* Center: Map/Wall toggle + content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-surface flex-shrink-0">
          {/* Map/Wall primary toggle */}
          <div
            role="group"
            aria-label="Investigation view mode"
            className="inline-flex items-center gap-0.5 rounded border border-edge p-0.5"
          >
            {(['map', 'wall'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                aria-pressed={wallViewMode === mode}
                onClick={() => setWallViewMode(mode)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  wallViewMode === mode
                    ? 'bg-surface-secondary text-content'
                    : 'text-content-secondary hover:text-content'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* List/board/tree sub-toggle (only in Map/Findings view) */}
          {wallViewMode === 'map' && (
            <>
              <div className="w-px h-4 bg-edge mx-1" />
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
            </>
          )}

          {/* Wall-only: group-by-tributary toggle */}
          {wallViewMode === 'wall' && (
            <>
              <div className="w-px h-4 bg-edge mx-1" />
              <button
                type="button"
                aria-pressed={wallGroupByTributary}
                onClick={() => setWallGroupByTributary(!wallGroupByTributary)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  wallGroupByTributary
                    ? 'bg-surface-secondary text-content'
                    : 'text-content-secondary hover:text-content'
                }`}
              >
                Group by tributary
              </button>
            </>
          )}

          <span className="ml-auto text-xs text-content-tertiary">
            {findingsState.findings.length} finding
            {findingsState.findings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {wallViewMode === 'wall' ? (
          processMap ? (
            <div className="relative flex-1 flex flex-col min-h-0">
              <WallCanvas
                hubs={hubs}
                findings={wallFindings}
                questions={wallQuestions}
                processMap={processMap}
                problemCpk={0}
                eventsPerWeek={0}
                activeColumns={wallActiveColumns}
                zoom={wallZoom}
                pan={wallPan}
                groupByTributary={wallGroupByTributary}
              />
              <div className="absolute bottom-4 right-4 pointer-events-auto">
                <Minimap
                  hubs={hubs}
                  questions={wallQuestions}
                  zoom={wallZoom}
                  pan={wallPan}
                  onPanTo={(x, y) => setWallPan({ x, y })}
                />
              </div>
              <CommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
                onPanTo={handlePanToNode}
                hubs={hubs}
                questions={wallQuestions}
                findings={wallFindings}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-content-secondary text-sm px-6 text-center">
              Build a Process Map in the Frame workspace first.
            </div>
          )
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <FindingsLog
              findings={findingsState.findings}
              onEditFinding={findingsState.editFinding}
              onDeleteFinding={findingsState.deleteFinding}
              onRestoreFinding={handleRestoreFinding}
              viewMode={viewMode}
              questions={questionsState.questions}
              onSelectQuestion={(q: Question) =>
                useInvestigationFeatureStore.getState().expandToQuestion(q.id)
              }
              onAddSubQuestion={questionsState.addSubQuestion}
              factors={drillFactors}
              getChildrenSummary={questionsState.getChildrenSummary}
              onSetFindingStatus={handleSetFindingStatus}
              onSetFindingTag={findingsState.setFindingTag}
              onAddComment={(id: string, text: string) => findingsState.addFindingComment(id, text)}
              columnAliases={columnAliases}
              activeFindingId={highlightedFindingId}
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
              onSetCauseRole={questionsState.setCauseRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationView;
