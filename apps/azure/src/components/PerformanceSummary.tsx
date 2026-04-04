/**
 * PerformanceSummary - Summary bar for performance mode
 *
 * Shows total channels, average Cpk, and channels below target.
 * User sets Cpk target themselves - no automatic health classification.
 */

import React from 'react';
import { useTranslation } from '@variscout/hooks';
import { usePerformanceAnalysis } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

const PerformanceSummary: React.FC = () => {
  const { formatStat } = useTranslation();
  const performanceResult = usePerformanceAnalysis();
  const selectedMeasure = useProjectStore(s => s.selectedMeasure);
  const setSelectedMeasure = useProjectStore(s => s.setSelectedMeasure);
  const measureLabel = useProjectStore(s => s.measureLabel);

  if (!performanceResult) {
    return null;
  }

  const { summary } = performanceResult;
  const { totalChannels, overall, needsAttentionCount } = summary;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-surface-secondary/50 border-b border-edge">
      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-content-secondary">
          <span className="font-medium text-content">{totalChannels}</span>{' '}
          {measureLabel.toLowerCase()}s
        </div>
        <div className="text-content-secondary border-l border-edge-secondary pl-4">
          Avg Cpk:{' '}
          <span className="font-mono font-medium text-content">{formatStat(overall.meanCpk)}</span>
        </div>
        {needsAttentionCount > 0 && (
          <div className="text-amber-400 border-l border-edge-secondary pl-4">
            <span className="font-medium">{needsAttentionCount}</span> below target
          </div>
        )}
      </div>

      {/* Clear selection button */}
      {selectedMeasure && (
        <button
          onClick={() => setSelectedMeasure(null)}
          className="text-xs text-content-secondary hover:text-content underline"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};

export default PerformanceSummary;
