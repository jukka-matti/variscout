import React, { useMemo } from 'react';
import type {
  ImprovementIdea,
  IdeaTimeframe,
  IdeaDirection,
  IdeaCostCategory,
  IdeaRiskAssessment,
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
  hypotheses: Array<{
    id: string;
    text: string;
    causeRole?: 'primary' | 'contributing';
    factor?: string;
    ideas: ImprovementIdea[];
    linkedFindingName?: string;
  }>;
  linkedFindings?: Array<{ id: string; text: string }>;
  onToggleSelect?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  onUpdateTimeframe?: (
    hypothesisId: string,
    ideaId: string,
    timeframe: IdeaTimeframe | undefined
  ) => void;
  onUpdateDirection?: (
    hypothesisId: string,
    ideaId: string,
    direction: IdeaDirection | undefined
  ) => void;
  onUpdateCost?: (
    hypothesisId: string,
    ideaId: string,
    cost: { category: IdeaCostCategory } | undefined
  ) => void;
  onUpdateRisk?: (
    hypothesisId: string,
    ideaId: string,
    risk: IdeaRiskAssessment | undefined
  ) => void;
  onOpenRisk?: (hypothesisId: string, ideaId: string) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onOpenWhatIf?: (hypothesisId: string, ideaId: string) => void;
  onAddIdea?: (hypothesisId: string, text: string) => void;
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
}

export const ImprovementWorkspaceBase: React.FC<ImprovementWorkspaceBaseProps> = ({
  synthesis,
  onSynthesisChange,
  hypotheses,
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
}) => {
  const { t } = useTranslation();

  // Collect all ideas across hypotheses for summary calculations
  const allIdeas = useMemo(() => hypotheses.flatMap(h => h.ideas), [hypotheses]);

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

  const hasIdeas = hypotheses.some(h => h.ideas.length > 0);

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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Synthesis card */}
        <SynthesisCard
          synthesis={synthesis}
          onSynthesisChange={onSynthesisChange}
          linkedFindings={linkedFindings}
        />

        {/* Four Directions hint */}
        <p
          data-testid="four-directions-hint"
          className="text-sm italic text-content/50 text-center"
        >
          {t('improve.fourDirections')}
        </p>

        {/* Hypothesis groups */}
        {hasIdeas ? (
          hypotheses
            .filter(h => h.ideas.length > 0)
            .map(h => (
              <IdeaGroupCard
                key={h.id}
                hypothesis={h}
                ideas={h.ideas}
                linkedFindingName={h.linkedFindingName}
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
              />
            ))
        ) : (
          <div
            data-testid="improvement-empty-state"
            className="flex flex-col items-center justify-center py-12 text-sm text-content/50 text-center px-6 gap-2"
          >
            {hypotheses.length === 0 ? (
              <>
                <p className="font-medium text-content/60">
                  {!linkedFindings || linkedFindings.length === 0
                    ? t(
                        'improve.emptyNoFindings',
                        'Pin findings from the Analysis view, then brainstorm improvement ideas here.'
                      )
                    : t(
                        'improve.emptyNoSupported',
                        'Validate your hypotheses in the Findings view. Supported hypotheses unlock improvement brainstorming.'
                      )}
                </p>
              </>
            ) : (
              <p>{t('improve.noIdeas')}</p>
            )}
          </div>
        )}
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
