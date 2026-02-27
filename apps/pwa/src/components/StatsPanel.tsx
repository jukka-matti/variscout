import React, { useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import { StatsPanelBase, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import SpecEditor from './settings/SpecEditor';

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: 'summary' | 'histogram' | 'normality';
  className?: string;
  compact?: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  defaultTab,
  className,
  compact = false,
}) => {
  const { setSpecs } = useData();
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    setSpecs(newSpecs);
  };

  return (
    <>
      {/* Spec Editor Popover */}
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
        getTerm={getTerm}
        renderHistogram={(data, specLimits, mean) => (
          <CapabilityHistogram data={data} specs={specLimits} mean={mean} />
        )}
        renderProbabilityPlot={(data, mean, stdDev) => (
          <ProbabilityPlot data={data} mean={mean} stdDev={stdDev} />
        )}
      />
    </>
  );
};

export default StatsPanel;
