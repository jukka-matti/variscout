import React from 'react';
import { gradeCpk, sourceLabelFor, type CpkTargetSource } from '@variscout/core/capability';

export interface ReportPerformanceKPIGridProps {
  totalChannels: number;
  passingChannels: number;
  worstCpk: number;
  worstChannelName: string;
  meanCpk: number;
  cpkTarget: number;
  /**
   * Cascade level that produced `cpkTarget`. Appended as "(per-spec)" /
   * "(hub default)" / etc to the target subtitle so users can see which
   * cascade level is in effect.
   */
  cpkTargetSource?: CpkTargetSource;
}

function getCpkColor(cpk: number, target: number): string {
  const grade = gradeCpk(cpk, target);
  if (grade === 'green') return 'text-green-600 dark:text-green-400';
  if (grade === 'red') return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

function getChannelsColor(passing: number, total: number): string {
  if (passing === total) return 'text-green-600 dark:text-green-400';
  if (total > 0 && passing / total > 0.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const cardClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3';
const labelClass = 'text-xs text-slate-500 dark:text-slate-400';

export const ReportPerformanceKPIGrid: React.FC<ReportPerformanceKPIGridProps> = ({
  totalChannels,
  passingChannels,
  worstCpk,
  worstChannelName,
  meanCpk,
  cpkTarget,
  cpkTargetSource,
}) => {
  return (
    <div data-report-kpi className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {/* Channels Passing */}
      <div className={cardClass}>
        <div className={labelClass}>Channels Passing</div>
        <div
          className={`mt-1 text-lg font-semibold ${getChannelsColor(passingChannels, totalChannels)}`}
        >
          {passingChannels}/{totalChannels}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">meeting target</div>
      </div>

      {/* Worst Channel */}
      <div className={cardClass}>
        <div className={labelClass}>Worst Channel</div>
        <div
          data-testid="worst-cpk"
          className={`mt-1 text-lg font-semibold ${getCpkColor(worstCpk, cpkTarget)}`}
        >
          {Number.isFinite(worstCpk) ? worstCpk.toFixed(2) : '—'}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{worstChannelName}</div>
      </div>

      {/* Mean Cpk */}
      <div className={cardClass}>
        <div className={labelClass}>Mean Cpk</div>
        <div className={`mt-1 text-lg font-semibold ${getCpkColor(meanCpk, cpkTarget)}`}>
          {Number.isFinite(meanCpk) ? meanCpk.toFixed(2) : '—'}
        </div>
        <div
          className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
          data-testid="cpk-target-caption"
        >
          target: {Number.isFinite(cpkTarget) ? cpkTarget.toFixed(2) : '—'}
          {cpkTargetSource ? ` (${sourceLabelFor(cpkTargetSource)})` : ''}
        </div>
      </div>
    </div>
  );
};
