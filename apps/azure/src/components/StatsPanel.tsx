import React from 'react';
import type { StatsResult } from '@variscout/core';
import { StatsPanelBase, statsPanelAzureColorScheme, useGlossary } from '@variscout/ui';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import WhatIfSimulator from './WhatIfSimulator';

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
  outcome?: string | null;
  onSaveSpecs?: (specs: { lsl?: number; target?: number; usl?: number }) => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  onSaveSpecs,
}) => {
  const { getTerm } = useGlossary();

  return (
    <StatsPanelBase
      stats={stats}
      specs={specs}
      filteredData={filteredData}
      outcome={outcome}
      colorScheme={statsPanelAzureColorScheme}
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
