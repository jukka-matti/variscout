import React from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import type { StatsResult, SpecLimits, GlossaryTerm, StagedComparison } from '@variscout/core';
import { StagedComparisonCard } from './StagedComparisonCard';

export interface StatsSummaryPanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: { length: number };
  onEditSpecs?: () => void;
  showCpk?: boolean;
  stagedComparison?: StagedComparison;
  cpkTarget?: number;
  onCpkClick?: () => void;
  subgroupsMeetingTarget?: number;
  subgroupCount?: number;
  renderSummaryFooter?: (stats: StatsResult, specs: SpecLimits) => React.ReactNode;
  getTerm: (key: string) => GlossaryTerm | undefined;
}

const METRIC_CARD_BG = 'bg-surface-secondary/50 border border-edge/50 rounded-lg p-3 text-center';
const METRIC_LABEL = 'flex items-center justify-center gap-1 text-xs text-content-secondary mb-1';
const METRIC_VALUE = 'text-xl font-bold font-mono text-content';

interface MetricCardProps {
  label: string;
  value: string | number;
  helpTerm?: GlossaryTerm;
  unit?: string;
}

const MetricCard = ({ label, value, helpTerm, unit }: MetricCardProps) => (
  <div className={METRIC_CARD_BG} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className={METRIC_LABEL}>
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={12} />}
    </div>
    <div
      className={METRIC_VALUE}
      data-testid={`stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {value}
      {unit}
    </div>
  </div>
);

const pencilIcon = <Pencil size={12} />;

/**
 * StatsSummaryPanel — Summary-only stats card for use in the dashboard grid.
 *
 * Displays metric cards (Pass Rate, Cp, Cpk, Mean, Median, StdDev) without
 * tabs or chart rendering. Styled to match DashboardChartCard aesthetics.
 */
const StatsSummaryPanel: React.FC<StatsSummaryPanelProps> = ({
  stats,
  specs,
  filteredData,
  onEditSpecs,
  showCpk = true,
  stagedComparison,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  renderSummaryFooter,
  getTerm,
}) => {
  const { t, formatStat } = useTranslation();

  if (stagedComparison) {
    return (
      <div className="w-full h-full bg-surface-secondary rounded-2xl border border-edge p-4 shadow-xl shadow-black/20 flex flex-col">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
          {t('stats.summary')}
        </h3>
        <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />
      </div>
    );
  }

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  return (
    <div
      className="w-full h-full bg-surface-secondary rounded-2xl border border-edge p-4 shadow-xl shadow-black/20 flex flex-col"
      data-testid="chart-stats"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
          {t('stats.summary')}
        </h3>
        {onEditSpecs && (
          <button
            onClick={onEditSpecs}
            className="flex items-center gap-1.5 text-xs text-content-secondary hover:text-blue-400 cursor-pointer transition-colors"
            type="button"
            data-testid="edit-specs-link"
          >
            {pencilIcon}
            <span>{t('stats.editSpecs')}</span>
          </button>
        )}
      </div>
      <div
        className="grid grid-cols-2 gap-2 flex-1 content-start"
        aria-live="polite"
        aria-label="Analysis statistics"
      >
        {hasSpecs && showCpk && (
          <>
            <MetricCard
              label={t('stats.passRate')}
              value={formatStat(100 - (stats?.outOfSpecPercentage || 0), 1)}
              unit="%"
              helpTerm={getTerm('passRate')}
            />
            <MetricCard
              label="Cp"
              value={stats?.cp !== undefined && stats?.cp !== null ? formatStat(stats.cp) : 'N/A'}
              helpTerm={getTerm('cp')}
            />
            <div
              className={`${METRIC_CARD_BG}${onCpkClick ? ' cursor-pointer hover:border-blue-500/50 transition-colors' : ''}`}
              data-testid="stat-cpk"
              onClick={onCpkClick}
              role={onCpkClick ? 'button' : undefined}
              tabIndex={onCpkClick ? 0 : undefined}
              onKeyDown={
                onCpkClick
                  ? (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') onCpkClick();
                    }
                  : undefined
              }
            >
              <div className={METRIC_LABEL}>
                Cpk
                {getTerm('cpk') && <HelpTooltip term={getTerm('cpk')!} iconSize={12} />}
              </div>
              <div className={METRIC_VALUE} data-testid="stat-value-cpk">
                {stats?.cpk !== undefined && stats?.cpk !== null ? formatStat(stats.cpk) : 'N/A'}
              </div>
              {cpkTarget !== undefined && (
                <div
                  className={`text-[0.625rem] mt-0.5 ${
                    stats?.cpk !== undefined && stats?.cpk !== null && stats.cpk >= cpkTarget
                      ? 'text-green-500'
                      : 'text-red-400'
                  }`}
                >
                  target: {formatStat(cpkTarget)}
                  {subgroupsMeetingTarget !== undefined && subgroupCount !== undefined && (
                    <span className="ml-1">
                      ({subgroupsMeetingTarget}/{subgroupCount})
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        <MetricCard
          label={t('stats.mean')}
          value={stats?.mean !== undefined && stats?.mean !== null ? formatStat(stats.mean) : 'N/A'}
          helpTerm={getTerm('mean')}
        />
        <MetricCard
          label={t('stats.median')}
          value={
            stats?.median !== undefined && stats?.median !== null ? formatStat(stats.median) : 'N/A'
          }
          helpTerm={getTerm('median')}
        />
        <MetricCard
          label={t('stats.stdDev')}
          value={
            stats?.stdDev !== undefined && stats?.stdDev !== null ? formatStat(stats.stdDev) : 'N/A'
          }
          helpTerm={getTerm('stdDev')}
        />
        <MetricCard label={t('stats.samples')} value={`n=${filteredData?.length ?? 0}`} />
      </div>
      {stats && renderSummaryFooter?.(stats, specs)}
    </div>
  );
};

export default StatsSummaryPanel;
