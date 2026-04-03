import React, { useMemo } from 'react';
import type {
  ImprovementIdea,
  IdeaTimeframe,
  IdeaDirection,
  IdeaCostCategory,
  ComputedRiskLevel,
  RiskAxisConfig,
} from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { SynthesisCard } from './SynthesisCard';
import { IdeaGroupCard } from './IdeaGroupCard';
import { ImprovementSummaryBar } from './ImprovementSummaryBar';

export interface ImprovementWorkspaceBaseProps {
  synthesis?: string;
  onSynthesisChange?: (text: string) => void;
  questions: Array<{
    id: string;
    text: string;
    causeRole?: 'suspected-cause' | 'contributing' | 'ruled-out';
    factor?: string;
    ideas: ImprovementIdea[];
    linkedFindingName?: string;
    evidence?: { rSquaredAdj?: number; etaSquared?: number };
  }>;
  linkedFindings?: Array<{ id: string; text: string }>;
  onToggleSelect?: (questionId: string, ideaId: string, selected: boolean) => void;
  onUpdateTimeframe?: (
    questionId: string,
    ideaId: string,
    timeframe: IdeaTimeframe | undefined
  ) => void;
  onUpdateDirection?: (
    questionId: string,
    ideaId: string,
    direction: IdeaDirection | undefined
  ) => void;
  onUpdateCost?: (
    questionId: string,
    ideaId: string,
    cost: { category: IdeaCostCategory } | undefined
  ) => void;
  onOpenRisk?: (questionId: string, ideaId: string) => void;
  onRemoveIdea?: (questionId: string, ideaId: string) => void;
  onOpenWhatIf?: (questionId: string, ideaId: string) => void;
  onAddIdea?: (questionId: string, text: string) => void;
  onAskCoScout?: (question: string) => void;
  onConvertToActions?: () => void;
  onBack?: () => void;
  riskAxisConfig?: RiskAxisConfig;
  budget?: number;
  /** Open in popout window */
  onPopout?: () => void;
  /** Currently selected idea IDs for summary calculation */
  selectedIdeaIds?: Set<string>;
  /** Map of ideaId to whether it has been converted to an action */
  convertedIdeaIds?: Set<string>;
  targetCpk?: number;
  /** Left panel content (context panel or What-If) */
  renderLeftPanel?: () => React.ReactNode;
  /** Whether left panel is visible (default true when renderLeftPanel provided) */
  showLeftPanel?: boolean;
  /** Matrix component to render in top zone */
  renderMatrix?: () => React.ReactNode;
  /** Current view: 'plan' (default) or 'track' */
  activeView?: 'plan' | 'track';
  /** Track view content (rendered when activeView === 'track') */
  renderTrackView?: () => React.ReactNode;
  /** Callback when analyst navigates back to plan from track */
  onBackToPlan?: () => void;
  /** Callback when hovering over an idea (for bidirectional matrix highlight) */
  onIdeaHover?: (ideaId: string | null) => void;
  /** ID of idea highlighted from matrix click (for scroll-to + ring animation) */
  highlightedIdeaId?: string | null;
  /** Open brainstorm modal for a cause question */
  onOpenBrainstorm?: (questionId: string) => void;
}

export const ImprovementWorkspaceBase: React.FC<ImprovementWorkspaceBaseProps> = ({
  synthesis,
  onSynthesisChange,
  questions,
  linkedFindings,
  onToggleSelect,
  onUpdateTimeframe,
  onUpdateDirection,
  onUpdateCost,
  onOpenRisk,
  onRemoveIdea,
  onOpenWhatIf,
  onAddIdea,
  onAskCoScout,
  onConvertToActions,
  onBack,
  onPopout,
  selectedIdeaIds,
  convertedIdeaIds,
  targetCpk,
  riskAxisConfig: _riskAxisConfig,
  budget,
  renderLeftPanel,
  showLeftPanel,
  renderMatrix,
  activeView = 'plan',
  renderTrackView,
  onBackToPlan: _onBackToPlan,
  onIdeaHover,
  highlightedIdeaId,
  onOpenBrainstorm,
}) => {
  const { t } = useTranslation();

  // Collect all ideas across questions for summary calculations
  const allIdeas = useMemo(() => questions.flatMap(h => h.ideas), [questions]);

  const selectedIdeas = useMemo(() => {
    if (!selectedIdeaIds || selectedIdeaIds.size === 0) return [];
    return allIdeas.filter(idea => selectedIdeaIds.has(idea.id));
  }, [allIdeas, selectedIdeaIds]);

  const timeframeBreakdown = useMemo(() => {
    const breakdown = { 'just-do': 0, days: 0, weeks: 0, months: 0 };
    for (const idea of selectedIdeas) {
      if (idea.timeframe) {
        breakdown[idea.timeframe]++;
      }
    }
    return breakdown;
  }, [selectedIdeas]);

  // Max risk among selected ideas
  const maxRisk = useMemo<ComputedRiskLevel | undefined>(() => {
    const levels: ComputedRiskLevel[] = ['low', 'medium', 'high', 'very-high'];
    let max = -1;
    for (const idea of selectedIdeas) {
      if (idea.risk) {
        const idx = levels.indexOf(idea.risk.computed);
        if (idx > max) max = idx;
      }
    }
    return max >= 0 ? levels[max] : undefined;
  }, [selectedIdeas]);

  // Total cost from selected ideas with precise amounts
  const totalCost = useMemo(() => {
    let sum = 0;
    let hasAmount = false;
    for (const idea of selectedIdeas) {
      if (idea.cost?.amount != null) {
        sum += idea.cost.amount;
        hasAmount = true;
      }
    }
    return hasAmount ? sum : undefined;
  }, [selectedIdeas]);

  // Best (max) single-idea projected Cpk among selected ideas
  const projectedCpk = useMemo(() => {
    const withProjection = selectedIdeas.filter(idea => idea.projection?.projectedCpk != null);
    if (withProjection.length === 0) return undefined;
    return Math.max(...withProjection.map(i => i.projection!.projectedCpk!));
  }, [selectedIdeas]);

  const hasIdeas = questions.some(h => h.ideas.length > 0);

  const leftPanelVisible = showLeftPanel !== false && !!renderLeftPanel;

  // Scrollable idea cards content (shared between legacy and split layout)
  const ideaCardsContent = (
    <>
      {/* Synthesis card — only in scrollable area when no left panel */}
      {!renderLeftPanel && (
        <SynthesisCard
          synthesis={synthesis}
          onSynthesisChange={onSynthesisChange}
          linkedFindings={linkedFindings}
        />
      )}

      {/* Question groups */}
      {hasIdeas ? (
        questions
          .filter(h => h.ideas.length > 0)
          .map(h => (
            <IdeaGroupCard
              key={h.id}
              question={h}
              ideas={h.ideas}
              linkedFindingName={h.linkedFindingName}
              evidence={h.evidence}
              onToggleSelect={onToggleSelect}
              onUpdateTimeframe={onUpdateTimeframe}
              onUpdateDirection={onUpdateDirection}
              onUpdateCost={onUpdateCost}
              onOpenRisk={onOpenRisk}
              onRemoveIdea={onRemoveIdea}
              onOpenWhatIf={onOpenWhatIf}
              onAddIdea={onAddIdea}
              onAskCoScout={onAskCoScout}
              convertedIdeaIds={convertedIdeaIds}
              onIdeaHover={onIdeaHover}
              highlightedIdeaId={highlightedIdeaId}
              onOpenBrainstorm={onOpenBrainstorm}
            />
          ))
      ) : (
        <div
          data-testid="improvement-empty-state"
          className="flex flex-col items-center justify-center py-12 text-sm text-content/50 text-center px-6 gap-2"
        >
          {questions.length === 0 ? (
            <>
              <p className="font-medium text-content/60">
                {!linkedFindings || linkedFindings.length === 0
                  ? t('improve.emptyNoFindings')
                  : t('improve.emptyNoSupported')}
              </p>
            </>
          ) : (
            <p>{t('improve.noIdeas')}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div data-testid="improvement-workspace" className="flex h-full flex-col bg-surface">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
        {onBack && (
          <button
            data-testid="improvement-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-content/70 hover:text-content transition-colors"
          >
            <ArrowLeft size={16} />
            {t('improve.backToAnalysis')}
          </button>
        )}
        <h2 className="text-base font-semibold text-content ml-auto mr-auto truncate">
          {t('improve.title')}
        </h2>
        {/* Popout + spacer to balance back button */}
        <div className="w-[120px] flex justify-end">
          {onPopout && (
            <button
              onClick={onPopout}
              className="hidden sm:inline-flex p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
              title="Open in separate window"
              aria-label="Open improvement in separate window"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel (300px) */}
        {leftPanelVisible && (
          <div className="w-[300px] min-w-[300px] border-r border-edge flex-shrink-0 overflow-hidden">
            {renderLeftPanel!()}
          </div>
        )}

        {/* Center hub */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeView === 'track' && renderTrackView ? (
            renderTrackView()
          ) : (
            <>
              {/* Matrix top zone (only when renderMatrix provided) */}
              {renderMatrix && (
                <div className="flex-shrink-0 border-b border-edge">{renderMatrix()}</div>
              )}

              {/* Scrollable idea cards bottom zone */}
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">
                {ideaCardsContent}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky summary bar */}
      <div className="safe-area-bottom">
        <ImprovementSummaryBar
          selectedCount={selectedIdeaIds?.size ?? 0}
          timeframeBreakdown={timeframeBreakdown}
          maxRisk={maxRisk}
          totalCost={totalCost}
          budget={budget}
          projectedCpk={projectedCpk}
          targetCpk={targetCpk}
          onConvertToActions={onConvertToActions}
          convertDisabled={!selectedIdeaIds || selectedIdeaIds.size === 0}
        />
      </div>
    </div>
  );
};
