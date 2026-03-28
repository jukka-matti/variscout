import React, { useMemo, useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { ComplementInsight } from '@variscout/ui';
import { StatsPanelBase, useGlossary, WhatIfSimulator, computePresets } from '@variscout/ui';
import SpecEditor from './settings/SpecEditor';

interface StatsPanelProps {
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
}

const StatsPanel: React.FC<StatsPanelProps> = ({
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

      <StatsPanelBase
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
    </>
  );
};

export default StatsPanel;
