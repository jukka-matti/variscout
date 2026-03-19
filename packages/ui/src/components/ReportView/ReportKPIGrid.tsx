import React from 'react';
import type { StatsResult, SpecLimits } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

export interface ReportKPIGridColorScheme {
  container: string;
  card: string;
  label: string;
  value: string;
}

export const reportKPIGridDefaultColorScheme: ReportKPIGridColorScheme = {
  container: 'grid grid-cols-2 sm:grid-cols-5 gap-3',
  card: 'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3',
  label: 'text-xs text-slate-500 dark:text-slate-400',
  value: 'text-lg font-semibold text-slate-900 dark:text-slate-100',
};

export interface ReportKPIGridProps {
  stats: StatsResult;
  specs: SpecLimits;
  sampleCount?: number;
  cpkTarget?: number;
  colorScheme?: Partial<ReportKPIGridColorScheme>;
}

function getCpkColor(cpk: number | undefined, target: number): string {
  if (cpk === undefined) return 'text-slate-900 dark:text-slate-100';
  if (cpk >= target) return 'text-green-600 dark:text-green-400';
  if (cpk < 1.0) return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

export const ReportKPIGrid: React.FC<ReportKPIGridProps> = ({
  stats,
  sampleCount,
  cpkTarget = 1.33,
  colorScheme,
}) => {
  const { t, formatStat } = useTranslation();
  const scheme: ReportKPIGridColorScheme = {
    ...reportKPIGridDefaultColorScheme,
    ...colorScheme,
  };

  const inSpecPct = 100 - stats.outOfSpecPercentage;
  const cpkColor = getCpkColor(stats.cpk, cpkTarget);

  return (
    <div data-report-kpi className={scheme.container}>
      {/* Samples */}
      <div className={scheme.card}>
        <div className={scheme.label}>{t('report.kpi.samples')}</div>
        <div className={`mt-1 ${scheme.value}`}>
          {sampleCount !== undefined ? sampleCount.toString() : '—'}
        </div>
      </div>

      {/* Mean */}
      <div className={scheme.card}>
        <div className={scheme.label}>{t('report.kpi.mean')}</div>
        <div className={`mt-1 ${scheme.value}`}>{formatStat(stats.mean)}</div>
      </div>

      {/* Variation */}
      <div className={scheme.card}>
        <div className={scheme.label}>{t('report.kpi.variation')} (σ)</div>
        <div className={`mt-1 ${scheme.value}`}>{formatStat(stats.stdDev, 3)}</div>
      </div>

      {/* Cpk */}
      <div className={scheme.card}>
        <div className={scheme.label}>{t('report.kpi.cpk')}</div>
        <div className={`mt-1 text-lg font-semibold ${cpkColor}`}>
          {stats.cpk !== undefined ? formatStat(stats.cpk) : '—'}
        </div>
      </div>

      {/* In-Spec % */}
      <div className={scheme.card}>
        <div className={scheme.label}>{t('report.kpi.inSpec')} %</div>
        <div className={`mt-1 ${scheme.value}`}>{formatStat(inSpecPct, 1)}%</div>
      </div>
    </div>
  );
};
