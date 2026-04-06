import React, { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { useAnalysisStats, useFilteredData, useTranslation } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import { computeMainEffects, computeInteractionEffects } from '@variscout/core/stats';
import type { BestSubsetsResult, FactorMainEffect } from '@variscout/core/stats';
import type { StatsResult, SpecLimits, GlossaryTerm, StagedComparison } from '@variscout/core';
import { useGlossary } from '../../hooks/useGlossary';
import { HelpTooltip } from '../HelpTooltip';
import { StagedComparisonCard } from './StagedComparisonCard';
import FactorIntelligencePanel from './FactorIntelligencePanel';
import EquationDisplay from './EquationDisplay';

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
  /** Cpk target threshold (shown in Cpk card) */
  cpkTarget?: number;
  /** Callback when Cpk card is clicked (navigates to capability mode) */
  onCpkClick?: () => void;
  /** Number of subgroups meeting cpkTarget */
  subgroupsMeetingTarget?: number;
  /** Total subgroup count */
  subgroupCount?: number;
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

const METRIC_CARD_BG = 'bg-surface-secondary/50 border border-edge/50 rounded-lg p-3 text-center';
const METRIC_LABEL = 'flex items-center justify-center gap-1 text-xs text-content-secondary mb-1';
const METRIC_VALUE = 'text-xl font-bold font-mono text-content';

interface MetricCardProps {
  label: string;
  value: string | number;
  helpTerm?: GlossaryTerm;
  unit?: string;
}

const MetricCard = ({ label, value, helpTerm, unit }: MetricCardProps) => (
  <div className={METRIC_CARD_BG} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className={METRIC_LABEL}>
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={12} />}
    </div>
    <div
      className={METRIC_VALUE}
      data-testid={`stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {value}
      {unit}
    </div>
  </div>
);

const pencilIcon = <Pencil size={12} />;

// ─── Stats Summary (inlined from former StatsSummaryPanel) ───────────────────

interface StatsSummaryProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData: { length: number };
  onEditSpecs?: () => void;
  showCpk: boolean;
  stagedComparison?: StagedComparison;
  cpkTarget?: number;
  onCpkClick?: () => void;
  subgroupsMeetingTarget?: number;
  subgroupCount?: number;
  getTerm: (key: string) => GlossaryTerm | undefined;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({
  stats,
  specs,
  filteredData,
  onEditSpecs,
  showCpk,
  stagedComparison,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  getTerm,
}) => {
  const { t, formatStat } = useTranslation();

  if (stagedComparison) {
    return (
      <div className="w-full h-full bg-surface-secondary rounded-2xl border border-edge p-4 shadow-xl shadow-black/20 flex flex-col">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
          {t('stats.summary')}
        </h3>
        <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />
      </div>
    );
  }

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  return (
    <div
      className="w-full h-full bg-surface-secondary rounded-2xl border border-edge p-4 shadow-xl shadow-black/20 flex flex-col"
      data-testid="chart-stats"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
          {t('stats.summary')}
        </h3>
        {onEditSpecs && (
          <button
            onClick={onEditSpecs}
            className="flex items-center gap-1.5 text-xs text-content-secondary hover:text-blue-400 cursor-pointer transition-colors"
            type="button"
            data-testid="edit-specs-link"
          >
            {pencilIcon}
            <span>{t('stats.editSpecs')}</span>
          </button>
        )}
      </div>
      <div
        className="grid grid-cols-2 gap-2 flex-1 content-start"
        aria-live="polite"
        aria-label="Analysis statistics"
      >
        {hasSpecs && showCpk && (
          <>
            <MetricCard
              label={t('stats.passRate')}
              value={formatStat(100 - (stats?.outOfSpecPercentage || 0), 1)}
              unit="%"
              helpTerm={getTerm('passRate')}
            />
            <MetricCard
              label="Cp"
              value={stats?.cp !== undefined && stats?.cp !== null ? formatStat(stats.cp) : 'N/A'}
              helpTerm={getTerm('cp')}
            />
            <div
              className={`${METRIC_CARD_BG}${onCpkClick ? ' cursor-pointer hover:border-blue-500/50 transition-colors' : ''}`}
              data-testid="stat-cpk"
              onClick={onCpkClick}
              role={onCpkClick ? 'button' : undefined}
              tabIndex={onCpkClick ? 0 : undefined}
              onKeyDown={
                onCpkClick
                  ? (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') onCpkClick();
                    }
                  : undefined
              }
            >
              <div className={METRIC_LABEL}>
                Cpk
                {getTerm('cpk') && <HelpTooltip term={getTerm('cpk')!} iconSize={12} />}
              </div>
              <div className={METRIC_VALUE} data-testid="stat-value-cpk">
                {stats?.cpk !== undefined && stats?.cpk !== null ? formatStat(stats.cpk) : 'N/A'}
              </div>
              {cpkTarget !== undefined && (
                <div
                  className={`text-[0.625rem] mt-0.5 ${
                    stats?.cpk !== undefined && stats?.cpk !== null && stats.cpk >= cpkTarget
                      ? 'text-green-500'
                      : 'text-red-400'
                  }`}
                >
                  target: {formatStat(cpkTarget)}
                  {subgroupsMeetingTarget !== undefined && subgroupCount !== undefined && (
                    <span className="ml-1">
                      ({subgroupsMeetingTarget}/{subgroupCount})
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        <MetricCard
          label={t('stats.mean')}
          value={stats?.mean !== undefined && stats?.mean !== null ? formatStat(stats.mean) : 'N/A'}
          helpTerm={getTerm('mean')}
        />
        <MetricCard
          label={t('stats.median')}
          value={
            stats?.median !== undefined && stats?.median !== null ? formatStat(stats.median) : 'N/A'
          }
          helpTerm={getTerm('median')}
        />
        <MetricCard
          label={t('stats.stdDev')}
          value={
            stats?.stdDev !== undefined && stats?.stdDev !== null ? formatStat(stats.stdDev) : 'N/A'
          }
          helpTerm={getTerm('stdDev')}
        />
        <MetricCard label={t('stats.samples')} value={`n=${filteredData?.length ?? 0}`} />
      </div>
    </div>
  );
};

// ─── StatsTabContent ─────────────────────────────────────────────────────────

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
 * Composes: StatsSummary (inlined), EquationDisplay (conditional), FactorIntelligencePanel (conditional).
 */
const StatsTabContent: React.FC<StatsTabContentProps> = ({
  bestSubsets,
  onEditSpecs,
  onInvestigateFactor,
  showCpk = true,
  stagedComparison,
  cpkTarget: cpkTargetProp,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
}) => {
  const { getTerm } = useGlossary();

  // Store reads
  const specs = useProjectStore(s => s.specs);
  const outcome = useProjectStore(s => s.outcome);
  const storeCpkTarget = useProjectStore(s => s.cpkTarget);
  const factors = useProjectStore(s => s.factors);

  // Hook reads
  const { stats } = useAnalysisStats();
  const { filteredData } = useFilteredData();

  const cpkTarget = cpkTargetProp ?? storeCpkTarget;

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
      <StatsSummary
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        onEditSpecs={onEditSpecs}
        showCpk={showCpk}
        stagedComparison={stagedComparison}
        cpkTarget={cpkTarget}
        onCpkClick={onCpkClick}
        subgroupsMeetingTarget={subgroupsMeetingTarget}
        subgroupCount={subgroupCount}
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

      {/* Staged comparison overrides the stat cards — already handled inside StatsSummary,
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
