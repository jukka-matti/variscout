import React, { useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { StatsPanelTab, ComplementInsight } from '@variscout/ui';
import { StatsPanelBase, WhatIfSimulator, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import SpecEditor from './settings/SpecEditor';

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: StatsPanelTab;
  className?: string;
  compact?: boolean;
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
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  defaultTab,
  className,
  compact = false,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  isDrilling,
  complement,
  activeProjection,
  centeringOpportunity,
  sampleCount,
}) => {
  const { setSpecs } = useData();
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    setSpecs(newSpecs);
  };

  return (
    <>
      {isEditingSpecs && (
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
        defaultTab={defaultTab}
        className={className}
        compact={compact}
        onEditSpecs={() => setIsEditingSpecs(true)}
        cpkTarget={cpkTarget}
        onCpkClick={onCpkClick}
        subgroupsMeetingTarget={subgroupsMeetingTarget}
        subgroupCount={subgroupCount}
        getTerm={getTerm}
        sampleCount={sampleCount}
        isDrilling={isDrilling}
        complement={complement}
        activeProjection={activeProjection}
        centeringOpportunity={centeringOpportunity}
        onAcceptSpecs={(lsl, usl) => {
          setSpecs({ ...specs, lsl, usl });
          setIsEditingSpecs(true);
        }}
        renderDataTable={
          filteredData.length > 0 && outcome
            ? () => (
                <div className="text-xs text-content-secondary p-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-edge/50">
                        <th className="text-left py-1 px-2 font-medium">#</th>
                        <th className="text-right py-1 px-2 font-medium">{outcome}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.slice(0, 100).map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-edge/20 hover:bg-surface-tertiary/30"
                        >
                          <td className="py-0.5 px-2 text-content-muted">{i + 1}</td>
                          <td className="py-0.5 px-2 text-right font-mono">
                            {String(row[outcome] ?? '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length > 100 && (
                    <div className="text-center text-content-muted mt-2">
                      Showing 100 of {filteredData.length} rows
                    </div>
                  )}
                </div>
              )
            : undefined
        }
        renderWhatIf={
          stats && (specs.usl !== undefined || specs.lsl !== undefined)
            ? () => (
                <WhatIfSimulator
                  currentStats={{ mean: stats.mean, stdDev: stats.stdDev, cpk: stats.cpk }}
                  specs={specs}
                  defaultExpanded={true}
                  cpkTarget={cpkTarget}
                />
              )
            : undefined
        }
      />
    </>
  );
};

export default StatsPanel;
