import React from 'react';
import type { StatsResult, DataRow } from '@variscout/core';
import { StatsPanelBase, useGlossary } from '@variscout/ui';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import WhatIfSimulator from './WhatIfSimulator';

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: DataRow[];
  outcome?: string | null;
  onSaveSpecs?: (specs: { lsl?: number; target?: number; usl?: number }) => void;
  showCpk?: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  onSaveSpecs,
  showCpk = true,
}) => {
  const { getTerm } = useGlossary();

  return (
    <StatsPanelBase
      stats={stats}
      specs={specs}
      filteredData={filteredData}
      outcome={outcome}
      showCpk={showCpk}
      onSaveSpecs={onSaveSpecs}
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
  );
};

export default StatsPanel;
