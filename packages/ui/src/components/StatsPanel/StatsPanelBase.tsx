import React, { useState, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { HelpTooltip } from '../HelpTooltip';
import type { GlossaryTerm } from '@variscout/core';
import type { StatsPanelBaseProps, StatsPanelColorScheme } from './types';
import { StagedComparisonCard } from './StagedComparisonCard';

// MetricCard component for the summary grid
interface MetricCardProps {
  label: string;
  value: string | number;
  helpTerm?: GlossaryTerm;
  unit?: string;
  bgClass: string;
  labelClass: string;
  valueClass: string;
}

const MetricCard = ({
  label,
  value,
  helpTerm,
  unit,
  bgClass,
  labelClass,
  valueClass,
}: MetricCardProps) => (
  <div className={bgClass} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className={labelClass}>
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={12} />}
    </div>
    <div
      className={valueClass}
      data-testid={`stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {value}
      {unit}
    </div>
  </div>
);

export const statsPanelDefaultColorScheme: StatsPanelColorScheme = {
  container:
    'w-full lg:w-80 bg-surface-secondary rounded-xl border border-edge p-6 flex flex-col gap-4 shadow-lg relative',
  containerCompact: 'flex flex-col h-full p-3 overflow-auto scroll-touch',
  tabBar: 'flex bg-surface/50 p-1 rounded-lg border border-edge/50',
  tabActive: 'bg-surface-tertiary text-white shadow-sm',
  tabInactive: 'text-content-secondary hover:text-content',
  metricCardBg: 'bg-surface-secondary/50 border border-edge/50 rounded-lg p-3 text-center',
  metricLabel: 'flex items-center justify-center gap-1 text-xs text-content-secondary mb-1',
  metricValue: 'text-xl font-bold font-mono text-white',
  emptyState: 'flex items-center justify-center h-full text-content-muted italic text-sm',
};

const StatsPanelBase: React.FC<StatsPanelBaseProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  defaultTab,
  className,
  compact = false,
  colorScheme = statsPanelDefaultColorScheme,
  onEditSpecs,
  showCpk = true,
  stagedComparison,
  cpkTarget,
  renderHistogram,
  renderProbabilityPlot,
  renderSummaryFooter,
  getTerm,
}) => {
  const cs = colorScheme;
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>(
    defaultTab || 'summary'
  );

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData
      .map((d: Record<string, unknown>) => Number(d[outcome]))
      .filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  const emptyState = (message: string) => <div className={cs.emptyState}>{message}</div>;

  const editButtonClass =
    'flex items-center gap-1.5 text-xs text-content-secondary hover:text-blue-400 cursor-pointer transition-colors';

  const renderMetricGrid = () => {
    const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
    return (
      <div className="space-y-3">
        <div
          className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-2'}
          aria-live="polite"
          aria-label="Analysis statistics"
        >
          {hasSpecs && showCpk && (
            <>
              <MetricCard
                label="Pass Rate"
                value={(100 - (stats?.outOfSpecPercentage || 0)).toFixed(1)}
                unit="%"
                helpTerm={getTerm('passRate')}
                bgClass={cs.metricCardBg}
                labelClass={cs.metricLabel}
                valueClass={cs.metricValue}
              />
              <MetricCard
                label="Cp"
                value={stats?.cp?.toFixed(2) ?? 'N/A'}
                helpTerm={getTerm('cp')}
                bgClass={cs.metricCardBg}
                labelClass={cs.metricLabel}
                valueClass={cs.metricValue}
              />
              <MetricCard
                label="Cpk"
                value={stats?.cpk?.toFixed(2) ?? 'N/A'}
                helpTerm={getTerm('cpk')}
                bgClass={cs.metricCardBg}
                labelClass={cs.metricLabel}
                valueClass={cs.metricValue}
              />
            </>
          )}
          <MetricCard
            label="Mean"
            value={stats?.mean?.toFixed(2) ?? 'N/A'}
            helpTerm={getTerm('mean')}
            bgClass={cs.metricCardBg}
            labelClass={cs.metricLabel}
            valueClass={cs.metricValue}
          />
          <MetricCard
            label="Median"
            value={stats?.median?.toFixed(2) ?? 'N/A'}
            helpTerm={getTerm('median')}
            bgClass={cs.metricCardBg}
            labelClass={cs.metricLabel}
            valueClass={cs.metricValue}
          />
          <MetricCard
            label="Std Dev"
            value={stats?.stdDev?.toFixed(2) ?? 'N/A'}
            helpTerm={getTerm('stdDev')}
            bgClass={cs.metricCardBg}
            labelClass={cs.metricLabel}
            valueClass={cs.metricValue}
          />
          <MetricCard
            label="Samples"
            value={`n=${filteredData?.length ?? 0}`}
            bgClass={cs.metricCardBg}
            labelClass={cs.metricLabel}
            valueClass={cs.metricValue}
          />
        </div>
        {onEditSpecs && (
          <button
            onClick={onEditSpecs}
            className={editButtonClass}
            type="button"
            data-testid="edit-specs-link"
          >
            <Pencil size={12} />
            <span>{hasSpecs ? 'Edit spec limits' : 'Set spec limits'}</span>
          </button>
        )}
      </div>
    );
  };

  const renderSummaryContent = () => {
    if (stagedComparison) {
      return <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />;
    }
    return renderMetricGrid();
  };

  const renderHistogramContent = () => {
    if (histogramData.length > 0 && stats && renderHistogram) {
      return renderHistogram(histogramData, specs, stats.mean);
    }
    return emptyState('No data available for histogram');
  };

  const renderProbPlotContent = () => {
    if (histogramData.length > 0 && stats && renderProbabilityPlot) {
      return renderProbabilityPlot(histogramData, stats.mean, stats.stdDev);
    }
    return emptyState('No data available for probability plot');
  };

  // Tab button component
  const TabButton = ({
    tab,
    label,
    helpTerm,
  }: {
    tab: 'summary' | 'histogram' | 'normality';
    label: string;
    helpTerm?: GlossaryTerm;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
        activeTab === tab ? cs.tabActive : cs.tabInactive
      } ${compact ? 'flex-1 px-2 py-2' : ''}`}
      style={compact ? { minHeight: 44 } : undefined}
    >
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={10} />}
    </button>
  );

  // Compact layout (mobile)
  if (compact) {
    return (
      <div className={cs.containerCompact}>
        <div className={`${cs.tabBar} mb-4`}>
          <TabButton tab="summary" label="Summary" />
          <TabButton tab="histogram" label="Histogram" helpTerm={getTerm('capabilityAnalysis')} />
          <TabButton tab="normality" label="Prob Plot" />
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === 'summary' && <div className="space-y-3">{renderSummaryContent()}</div>}
          {activeTab === 'histogram' && (
            <div className="h-full min-h-[200px]">{renderHistogramContent()}</div>
          )}
          {activeTab === 'normality' && (
            <div className="h-full min-h-[200px]">{renderProbPlotContent()}</div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={className ? `${cs.container} ${className}` : cs.container}>
      {/* Header / Tab buttons */}
      <div className="flex justify-between items-center border-b border-inherit pb-4">
        <div className={cs.tabBar}>
          <TabButton tab="summary" label="Summary" />
          <TabButton tab="histogram" label="Histogram" helpTerm={getTerm('capabilityAnalysis')} />
          <TabButton tab="normality" label="Prob Plot" />
        </div>
      </div>

      {activeTab === 'summary' ? (
        <>
          <div className="flex-1">{renderSummaryContent()}</div>
          {stats && renderSummaryFooter?.(stats, specs)}
        </>
      ) : activeTab === 'histogram' ? (
        <div className={compact ? 'flex-1 min-h-[200px]' : 'h-[300px] w-full'}>
          {renderHistogramContent()}
        </div>
      ) : (
        <div className={compact ? 'flex-1 min-h-[200px]' : 'h-[300px] w-full'}>
          {renderProbPlotContent()}
        </div>
      )}
    </div>
  );
};

export default StatsPanelBase;
