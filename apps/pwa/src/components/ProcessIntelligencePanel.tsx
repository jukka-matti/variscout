import React, { useMemo, useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { PITab, ComplementInsight, PIOverflowView } from '@variscout/ui';
import { PIPanelBase, WhatIfSimulator, computePresets, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import SpecEditor from './settings/SpecEditor';

interface ProcessIntelligencePanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: PITab;
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
  /** PI panel: Questions tab render prop */
  renderQuestionsTab?: () => React.ReactNode;
  /** PI panel: Journal tab render prop */
  renderJournalTab?: () => React.ReactNode;
  /** PI panel: open question count for badge */
  openQuestionCount?: number;
  /** PI panel: overflow view state (controlled by parent) */
  overflowView?: PIOverflowView;
  /** PI panel: overflow view change handler */
  onOverflowViewChange?: (view: PIOverflowView) => void;
}

const ProcessIntelligencePanel: React.FC<ProcessIntelligencePanelProps> = ({
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
  renderQuestionsTab,
  renderJournalTab,
  openQuestionCount,
  overflowView,
  onOverflowViewChange,
}) => {
  const { setSpecs } = useData();
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    setSpecs(newSpecs);
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
      {isEditingSpecs && (
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
        renderQuestionsTab={renderQuestionsTab}
        renderJournalTab={renderJournalTab}
        openQuestionCount={openQuestionCount}
        overflowView={overflowView}
        onOverflowViewChange={onOverflowViewChange}
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
                  presets={presets}
                />
              )
            : undefined
        }
      />
    </>
  );
};

export default ProcessIntelligencePanel;
