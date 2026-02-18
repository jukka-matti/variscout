import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { StatsResult } from '@variscout/core';
import { StatsPanelBase, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import SpecEditor from './settings/SpecEditor';

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
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
  const { displayOptions, setDisplayOptions, setSpecs } = useData();
  const { getTerm } = useGlossary();
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: { usl?: number; lsl?: number; target?: number }) => {
    setSpecs(newSpecs);

    // Auto-enable Cp display when both USL and LSL are set
    if (newSpecs.usl !== undefined && newSpecs.lsl !== undefined && !displayOptions.showCp) {
      setDisplayOptions({ ...displayOptions, showCp: true });
    }
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
        onSaveSpecs={handleSaveSpecs}
        getTerm={getTerm}
        renderHistogram={(data, specLimits, mean) => (
          <CapabilityHistogram data={data} specs={specLimits} mean={mean} />
        )}
        renderProbabilityPlot={(data, mean, stdDev) => (
          <ProbabilityPlot data={data} mean={mean} stdDev={stdDev} />
        )}
        renderSummaryFooter={
          compact
            ? undefined
            : () => (
                <div
                  className="mt-auto p-3 text-center bg-surface/80 rounded-lg text-xs text-content-muted border border-dashed border-edge cursor-pointer hover:border-edge-secondary hover:text-content hover:bg-surface-tertiary/50 transition-all flex items-center justify-center gap-2"
                  onClick={() => setIsEditingSpecs(true)}
                >
                  <Plus size={14} />
                  <span>Edit Specifications</span>
                </div>
              )
        }
      />
    </>
  );
};

export default StatsPanel;
