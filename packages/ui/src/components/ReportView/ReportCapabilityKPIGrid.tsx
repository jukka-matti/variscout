import React from 'react';

export interface ReportCapabilityKPIGridProps {
  meanCpk: number;
  meanCp?: number; // undefined for one-sided specs
  cpkTarget: number;
  subgroupCount: number;
  passingCount: number;
}

function getCpkColor(cpk: number, target: number): string {
  if (cpk >= target) return 'text-green-600 dark:text-green-400';
  if (cpk < 1.0) return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

function getPassingColor(pct: number): string {
  if (pct >= 90) return 'text-green-600 dark:text-green-400';
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const cardClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3';
const labelClass = 'text-xs text-slate-500 dark:text-slate-400';
const valueClass = 'text-lg font-semibold text-slate-900 dark:text-slate-100';

export const ReportCapabilityKPIGrid: React.FC<ReportCapabilityKPIGridProps> = ({
  meanCpk,
  meanCp,
  cpkTarget,
  subgroupCount,
  passingCount,
}) => {
  const hasCp = meanCp !== undefined;
  const centeringLoss = hasCp ? (meanCp - meanCpk).toFixed(2) : '—';
  const passingPct = Math.round((passingCount / subgroupCount) * 100);
  const colsClass = hasCp ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <div data-report-kpi className={`grid grid-cols-2 ${colsClass} gap-3`}>
      {/* Mean Cpk */}
      <div className={cardClass}>
        <div className={labelClass}>Mean Cpk</div>
        <div className={`mt-1 text-lg font-semibold ${getCpkColor(meanCpk, cpkTarget)}`}>
          {meanCpk.toFixed(2)}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          target: {cpkTarget.toFixed(2)}
        </div>
      </div>

      {/* Mean Cp — only when two-sided specs */}
      {hasCp && (
        <div className={cardClass}>
          <div className={labelClass}>Mean Cp</div>
          <div className={`mt-1 ${valueClass}`}>{meanCp.toFixed(2)}</div>
        </div>
      )}

      {/* Centering Loss */}
      <div className={cardClass}>
        <div className={labelClass}>Centering Loss</div>
        <div className={`mt-1 ${valueClass}`}>{centeringLoss}</div>
      </div>

      {/* Passing Target */}
      <div className={cardClass}>
        <div className={labelClass}>Passing Target</div>
        <div className={`mt-1 text-lg font-semibold ${getPassingColor(passingPct)}`}>
          {passingPct}%
        </div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {passingCount}/{subgroupCount} subgroups
        </div>
      </div>
    </div>
  );
};
