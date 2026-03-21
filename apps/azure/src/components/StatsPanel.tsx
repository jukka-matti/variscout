import React, { useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import { StatsPanelBase, useGlossary } from '@variscout/ui';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import SpecEditor from './settings/SpecEditor';
import { WhatIfSimulator } from '@variscout/ui';

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
}) => {
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    onSaveSpecs?.(newSpecs);
    setIsEditingSpecs(false);
  };

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
        renderHistogram={(data, specLimits, mean) => (
          <CapabilityHistogram data={data} specs={specLimits} mean={mean} />
        )}
        renderProbabilityPlot={(data, mean, stdDev) => (
          <ProbabilityPlot data={data} mean={mean} stdDev={stdDev} />
        )}
        renderSummaryFooter={(s, sp) =>
          s && (sp.usl !== undefined || sp.lsl !== undefined) ? (
            <div className="mt-4">
              <WhatIfSimulator
                currentStats={{
                  mean: s.mean,
                  stdDev: s.stdDev,
                  cpk: s.cpk,
                }}
                specs={sp}
                defaultExpanded={false}
              />
            </div>
          ) : null
        }
      />
    </>
  );
};

export default StatsPanel;
