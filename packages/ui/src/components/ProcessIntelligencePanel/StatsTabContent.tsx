import React, { useMemo } from 'react';
import { useAnalysisStats, useFilteredData } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import { computeMainEffects, computeInteractionEffects } from '@variscout/core/stats';
import type { BestSubsetsResult, FactorMainEffect } from '@variscout/core/stats';
import type { StagedComparison } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import { useGlossary } from '../../hooks/useGlossary';
import StatsSummaryPanel from './StatsSummaryPanel';
import FactorIntelligencePanel from './FactorIntelligencePanel';
import EquationDisplay from './EquationDisplay';
import type { ComplementInsight } from './TargetDiscoveryCard';

export interface StatsTabContentProps {
  /**
   * Pre-computed best subsets — provided by the caller (e.g. from useQuestionGeneration)
   * to avoid double computation. When null/undefined, factor intelligence is not shown.
   */
  bestSubsets?: BestSubsetsResult | null;
  /** Opens the spec editor (app-specific, can't come from a store) */
  onEditSpecs?: () => void;
  /** Navigate to investigation for a factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
  /** Whether to show capability metrics (Cp/Cpk/Pass Rate) */
  showCpk?: boolean;
  /** Staged comparison object for staged analysis display */
  stagedComparison?: StagedComparison;
  /** Whether the user is drilling into a subgroup */
  isDrilling?: boolean;
  /** Complement insight for target discovery */
  complement?: ComplementInsight | null;
  /** Active process projection for target discovery */
  activeProjection?: ProcessProjection | null;
  /** Centering opportunity for target discovery */
  centeringOpportunity?: CenteringOpportunity | null;
}

/**
 * StatsTabContent — store-aware content for the "Stats" tab in the PI Panel.
 *
 * Reads its own data:
 * - stats via useAnalysisStats()
 * - filteredData via useFilteredData()
 * - specs, outcome, cpkTarget, factors from useProjectStore
 *
 * Accepts optional props that can't come from stores (callbacks, app-specific state).
 *
 * Composes: StatsSummaryPanel, EquationDisplay (conditional), FactorIntelligencePanel (conditional).
 */
const StatsTabContent: React.FC<StatsTabContentProps> = ({
  bestSubsets,
  onEditSpecs,
  onInvestigateFactor,
  showCpk = true,
  stagedComparison,
  isDrilling: _isDrilling = false,
  complement: _complement,
  activeProjection: _activeProjection,
  centeringOpportunity: _centeringOpportunity,
}) => {
  const { getTerm } = useGlossary();

  // Store reads
  const specs = useProjectStore(s => s.specs);
  const outcome = useProjectStore(s => s.outcome);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const factors = useProjectStore(s => s.factors);

  // Hook reads
  const { stats } = useAnalysisStats();
  const { filteredData } = useFilteredData();

  // Factor Intelligence: compute main/interaction effects when we have enough data
  const hasFactorIntelligence =
    factors.length >= 2 && !!outcome && filteredData.length > 0 && !!bestSubsets;

  const mainEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeMainEffects(filteredData, outcome!, factors);
  }, [hasFactorIntelligence, filteredData, outcome, factors]);

  const interactionEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeInteractionEffects(filteredData, outcome!, factors);
  }, [hasFactorIntelligence, filteredData, outcome, factors]);

  // Equation display: show when bestSubsets has a valid top subset
  const topSubset = bestSubsets?.subsets?.[0];
  const showEquation = hasFactorIntelligence && !!topSubset && !!outcome;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary stats summary */}
      <StatsSummaryPanel
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        onEditSpecs={onEditSpecs}
        showCpk={showCpk}
        stagedComparison={stagedComparison}
        cpkTarget={cpkTarget}
        getTerm={getTerm}
      />

      {/* Equation display — shown when best subsets regression has a result */}
      {showEquation && topSubset && outcome && (
        <EquationDisplay
          bestSubset={topSubset}
          grandMean={bestSubsets!.grandMean}
          outcome={outcome}
          factorTypes={bestSubsets!.factorTypes}
          predictors={topSubset.predictors}
          intercept={topSubset.intercept}
          rmse={topSubset.rmse}
          n={bestSubsets!.n}
        />
      )}

      {/* Staged comparison overrides the stat cards — already handled inside StatsSummaryPanel,
          so we don't render factor intelligence when staged */}
      {!stagedComparison && hasFactorIntelligence && bestSubsets && (
        <FactorIntelligencePanel
          bestSubsets={bestSubsets}
          mainEffects={mainEffects}
          interactionEffects={interactionEffects}
          onInvestigateFactor={onInvestigateFactor}
        />
      )}
    </div>
  );
};

export default StatsTabContent;
