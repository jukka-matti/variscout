import React from 'react';
import type { ProbabilityPlotSeries } from '@variscout/core';

export interface ProbabilityPlotTooltipProps {
  series: ProbabilityPlotSeries | null;
  position: { x: number; y: number };
}

/**
 * Hover card for probability plot series.
 * Shows N, Mean, StDev, and Anderson-Darling p-value.
 */
export const ProbabilityPlotTooltip: React.FC<ProbabilityPlotTooltipProps> = ({
  series,
  position,
}) => {
  if (!series) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      <div className="bg-surface-tooltip border border-edge rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="font-semibold text-content">{series.key}</span>
        </div>
        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-content-secondary">
          <span className="text-content-muted">N</span>
          <span className="font-mono">{series.n}</span>
          <span className="text-content-muted">Mean</span>
          <span className="font-mono">{formatStat(series.mean)}</span>
          <span className="text-content-muted">StDev</span>
          <span className="font-mono">{formatStat(series.stdDev)}</span>
          <span className="text-content-muted">AD p</span>
          <span className="font-mono">
            {series.adTestPValue !== null ? formatStat(series.adTestPValue) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

function formatStat(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(3);
  return value.toFixed(4);
}
