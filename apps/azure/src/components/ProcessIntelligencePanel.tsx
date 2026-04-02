import React, { useMemo, useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { ComplementInsight } from '@variscout/ui';
import type { PIOverflowView } from '@variscout/ui';
import {
  PIPanelBase,
  useGlossary,
  WhatIfSimulator,
  computePresets,
  FactorIntelligencePanel,
} from '@variscout/ui';
import { computeBestSubsets, computeMainEffects, computeInteractionEffects } from '@variscout/core';
import SpecEditor from './settings/SpecEditor';

interface ProcessIntelligencePanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  onSaveSpecs?: (specs: SpecLimits) => void;
  showCpk?: boolean;
  cpkTarget?: number;
  onCpkClick?: () => void;
  subgroupsMeetingTarget?: number;
  subgroupCount?: number;
  /** Target discovery props */
  isDrilling?: boolean;
  complement?: ComplementInsight | null;
  activeProjection?: ProcessProjection | null;
  centeringOpportunity?: CenteringOpportunity | null;
  sampleCount?: number;
  /** Data table render prop */
  renderDataTable?: () => React.ReactNode;
  /** Factor Intelligence: available factor column names */
  factors?: string[];
  /** Factor Intelligence: callback when user clicks a subset for drill-down */
  onFactorDrillDown?: (factors: string[]) => void;
  /** Factor Intelligence: callback when user clicks "Investigate" on a significant factor */
  onInvestigateFactor?: (effect: import('@variscout/core/stats').FactorMainEffect) => void;
  /** Pre-computed best subsets (from useQuestionGeneration) to avoid double computation */
  precomputedBestSubsets?: import('@variscout/core/stats').BestSubsetsResult | null;
  /** PI panel: Questions tab render prop */
  renderQuestionsTab?: () => React.ReactNode;
  /** PI panel: Journal tab render prop */
  renderJournalTab?: () => React.ReactNode;
  /** PI panel: open question count for badge */
  openQuestionCount?: number;
  /** PI panel: overflow view state (controlled) */
  overflowView?: PIOverflowView;
  /** PI panel: overflow view change handler */
  onOverflowViewChange?: (view: PIOverflowView) => void;
}

const ProcessIntelligencePanel: React.FC<ProcessIntelligencePanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  onSaveSpecs,
  showCpk = true,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  isDrilling,
  complement,
  activeProjection,
  centeringOpportunity,
  sampleCount,
  renderDataTable,
  factors = [],
  onFactorDrillDown,
  onInvestigateFactor,
  precomputedBestSubsets,
  renderQuestionsTab,
  renderJournalTab,
  openQuestionCount,
  overflowView,
  onOverflowViewChange,
}) => {
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    onSaveSpecs?.(newSpecs);
    setIsEditingSpecs(false);
  };

  const presets = useMemo(() => {
    if (!stats || !outcome) return undefined;
    return computePresets(
      { mean: stats.mean, stdDev: stats.stdDev, median: stats.median },
      specs,
      filteredData,
      outcome
    );
  }, [stats, specs, filteredData, outcome]);

  // ── Factor Intelligence (Layers 1-3) ──
  const hasFactorIntelligence = factors.length >= 2 && outcome && filteredData.length > 0;

  const bestSubsets = useMemo(() => {
    if (precomputedBestSubsets !== undefined) return precomputedBestSubsets;
    if (!hasFactorIntelligence) return null;
    return computeBestSubsets(filteredData, outcome!, factors);
  }, [precomputedBestSubsets, filteredData, outcome, factors, hasFactorIntelligence]);

  const mainEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeMainEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  const interactionEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeInteractionEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  return (
    <>
      {isEditingSpecs && onSaveSpecs && (
        <SpecEditor
          specs={specs}
          onSave={handleSaveSpecs}
          onClose={() => setIsEditingSpecs(false)}
          style={{ top: '70px', right: '0px', width: '100%', maxWidth: '320px', zIndex: 20 }}
        />
      )}

      <PIPanelBase
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        outcome={outcome}
        showCpk={showCpk}
        cpkTarget={cpkTarget}
        onCpkClick={onCpkClick}
        subgroupsMeetingTarget={subgroupsMeetingTarget}
        subgroupCount={subgroupCount}
        onEditSpecs={onSaveSpecs ? () => setIsEditingSpecs(true) : undefined}
        getTerm={getTerm}
        sampleCount={sampleCount}
        isDrilling={isDrilling}
        complement={complement}
        activeProjection={activeProjection}
        centeringOpportunity={centeringOpportunity}
        onAcceptSpecs={
          onSaveSpecs
            ? (lsl, usl) => {
                onSaveSpecs({ ...specs, lsl, usl });
                setIsEditingSpecs(true);
              }
            : undefined
        }
        renderDataTable={renderDataTable}
        renderQuestionsTab={renderQuestionsTab}
        renderJournalTab={renderJournalTab}
        openQuestionCount={openQuestionCount}
        overflowView={overflowView}
        onOverflowViewChange={onOverflowViewChange}
        renderWhatIf={
          stats && (specs.usl !== undefined || specs.lsl !== undefined)
            ? () => (
                <WhatIfSimulator
                  currentStats={{ mean: stats.mean, stdDev: stats.stdDev, cpk: stats.cpk }}
                  specs={specs}
                  defaultExpanded={true}
                  cpkTarget={cpkTarget}
                  presets={presets}
                />
              )
            : undefined
        }
      />

      {/* Factor Intelligence — shows when ≥2 factors available */}
      {hasFactorIntelligence && bestSubsets && (
        <FactorIntelligencePanel
          bestSubsets={bestSubsets}
          mainEffects={mainEffects}
          interactionEffects={interactionEffects}
          onSubsetClick={onFactorDrillDown}
          onInvestigateFactor={onInvestigateFactor}
        />
      )}
    </>
  );
};

export default ProcessIntelligencePanel;
