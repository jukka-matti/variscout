/**
 * ReportDefectKPIGrid - KPI summary grid for defect analysis mode reports.
 *
 * Shows defect-specific metrics instead of Cpk/capability metrics:
 * Total defects, defect rate, top defect type, and 80/20 Pareto indicator.
 */

import React from 'react';

export interface ReportDefectKPIGridProps {
  totalDefects: number;
  defectRate: number;
  rateLabel: string;
  sampleCount?: number;
  topDefectType?: string;
  topDefectPercent?: number;
  paretoCount80?: number;
  totalTypes?: number;
  trendDirection?: 'up' | 'stable' | 'down';
}

function getTrendColor(direction: 'up' | 'stable' | 'down'): string {
  switch (direction) {
    case 'down':
      return 'text-green-600 dark:text-green-400';
    case 'up':
      return 'text-red-600 dark:text-red-400';
    case 'stable':
      return 'text-slate-500 dark:text-slate-400';
  }
}

function getTrendSymbol(direction: 'up' | 'stable' | 'down'): string {
  switch (direction) {
    case 'up':
      return '\u2191';
    case 'down':
      return '\u2193';
    case 'stable':
      return '\u2192';
  }
}

const cardClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3';
const labelClass = 'text-xs text-slate-500 dark:text-slate-400';
const valueClass = 'text-lg font-semibold text-slate-900 dark:text-slate-100';

export const ReportDefectKPIGrid: React.FC<ReportDefectKPIGridProps> = ({
  totalDefects,
  defectRate,
  rateLabel,
  sampleCount,
  topDefectType,
  topDefectPercent,
  paretoCount80,
  totalTypes,
  trendDirection,
}) => {
  const hasPareto = paretoCount80 !== undefined && totalTypes !== undefined;
  const gridCols = topDefectType ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <div data-report-kpi className={`grid grid-cols-2 ${gridCols} gap-3`}>
      {/* Total Defects */}
      <div className={cardClass}>
        <div className={labelClass}>Total Defects</div>
        <div className={`mt-1 ${valueClass}`}>{totalDefects.toLocaleString()}</div>
        {sampleCount !== undefined && (
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            in {sampleCount.toLocaleString()} observations
          </div>
        )}
      </div>

      {/* Defect Rate */}
      <div className={cardClass}>
        <div className={labelClass}>Defect Rate</div>
        <div className="flex items-baseline mt-1">
          <span className={valueClass}>
            {Number.isFinite(defectRate)
              ? defectRate.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : '--'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">/{rateLabel}</span>
          {trendDirection && (
            <span
              className={`ml-1.5 text-lg font-bold ${getTrendColor(trendDirection)}`}
              aria-label={`Trend ${trendDirection}`}
            >
              {getTrendSymbol(trendDirection)}
            </span>
          )}
        </div>
      </div>

      {/* Top Defect Type */}
      {topDefectType && (
        <div className={cardClass}>
          <div className={labelClass}>Top Defect Type</div>
          <div className={`mt-1 ${valueClass}`}>{topDefectType}</div>
          {topDefectPercent !== undefined && Number.isFinite(topDefectPercent) && (
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {Math.round(topDefectPercent * 10) / 10}% of total
            </div>
          )}
        </div>
      )}

      {/* 80/20 Pareto */}
      {hasPareto && (
        <div className={cardClass}>
          <div className={labelClass}>80/20 Rule</div>
          <div className={`mt-1 ${valueClass}`}>
            {paretoCount80} of {totalTypes}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            types account for 80%
          </div>
        </div>
      )}
    </div>
  );
};
