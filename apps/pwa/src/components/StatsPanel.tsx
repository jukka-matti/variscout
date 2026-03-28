import React, { useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { StatsPanelTab, ComplementInsight } from '@variscout/ui';
import { StatsPanelBase, useGlossary } from '@variscout/ui';
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
      />
    </>
  );
};

export default StatsPanel;
