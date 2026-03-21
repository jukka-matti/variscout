import React from 'react';
import type { YamazumiSummary } from '@variscout/core';

export interface ReportYamazumiKPIGridProps {
  summary: YamazumiSummary;
}

function getVaRatioColor(ratio: number): string {
  if (ratio >= 0.5) return 'text-green-600 dark:text-green-400';
  if (ratio < 0.3) return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

function getStepsOverTaktColor(count: number): string {
  if (count === 0) return 'text-green-600 dark:text-green-400';
  return 'text-red-600 dark:text-red-400';
}

const cardClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3';
const labelClass = 'text-xs text-slate-500 dark:text-slate-400';
const valueClass = 'text-lg font-semibold text-slate-900 dark:text-slate-100';

export const ReportYamazumiKPIGrid: React.FC<ReportYamazumiKPIGridProps> = ({ summary }) => {
  const vaRatioPct = Math.round(summary.vaRatio * 100);
  const efficiencyPct = Math.round(summary.processEfficiency * 100);
  const stepsCount = summary.stepsOverTakt.length;
  const hasTakt = summary.taktTime !== undefined;

  const displayedSteps = summary.stepsOverTakt.slice(0, 3);
  const remaining = stepsCount - displayedSteps.length;

  return (
    <div data-report-kpi className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* VA Ratio */}
      <div className={cardClass}>
        <div className={labelClass}>VA Ratio</div>
        <div className={`mt-1 text-lg font-semibold ${getVaRatioColor(summary.vaRatio)}`}>
          {vaRatioPct}%
        </div>
      </div>

      {/* Process Efficiency */}
      <div className={cardClass}>
        <div className={labelClass}>Process Efficiency</div>
        <div className={`mt-1 ${valueClass}`}>{efficiencyPct}%</div>
      </div>

      {/* Takt Time */}
      <div className={cardClass}>
        <div className={labelClass}>Takt Time</div>
        <div className={`mt-1 ${valueClass}`}>{hasTakt ? `${summary.taktTime}s` : '—'}</div>
      </div>

      {/* Steps Over Takt */}
      <div className={cardClass}>
        <div className={labelClass}>Over Takt</div>
        {hasTakt ? (
          <>
            <div className={`mt-1 text-lg font-semibold ${getStepsOverTaktColor(stepsCount)}`}>
              {stepsCount} steps
            </div>
            {stepsCount > 0 && (
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {displayedSteps.join(', ')}
                {remaining > 0 && ` +${remaining} more`}
              </div>
            )}
          </>
        ) : (
          <div className={`mt-1 ${valueClass}`}>—</div>
        )}
      </div>
    </div>
  );
};
