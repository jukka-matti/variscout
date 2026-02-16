import React, { useState, useMemo } from 'react';
import { HelpTooltip } from '../HelpTooltip';
import type { GlossaryTerm } from '@variscout/core';
import type { StatsPanelBaseProps, StatsPanelColorScheme } from './types';

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
  gradeRow:
    'grid grid-cols-[1fr_40px_45px] gap-4 items-center p-2 rounded hover:bg-surface-tertiary/30 transition-colors',
  gradeLabel: 'text-content text-sm font-medium truncate',
  gradeCount: 'text-right text-content-muted text-xs font-mono',
  gradePercent: 'text-right text-white font-bold font-mono',
  gradeHeader:
    'grid grid-cols-[1fr_auto_auto] gap-4 px-2 text-[10px] text-content-muted uppercase tracking-wider font-semibold',
  gradeCompactCard:
    'flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-edge/50',
  gradeCompactLabel: 'text-content text-sm font-medium',
  gradeCompactPercent: 'text-white font-bold',
  gradeCompactCount: 'text-content-muted text-xs ml-2',
  emptyState: 'flex items-center justify-center h-full text-content-muted italic text-sm',
  specEditButton:
    'mt-auto p-3 text-center bg-surface/80 rounded-lg text-xs text-content-muted border border-dashed border-edge cursor-pointer hover:border-edge-secondary hover:text-content hover:bg-surface-tertiary/50 transition-all flex items-center justify-center gap-2',
};

export const statsPanelAzureColorScheme: StatsPanelColorScheme = {
  container:
    'w-full lg:w-80 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-4 shadow-lg relative',
  containerCompact: 'flex flex-col h-full p-3 overflow-auto scroll-touch',
  tabBar: 'flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50',
  tabActive: 'bg-slate-700 text-white shadow-sm',
  tabInactive: 'text-slate-400 hover:text-slate-300',
  metricCardBg: 'bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center',
  metricLabel: 'flex items-center justify-center gap-1 text-xs text-slate-400 mb-1',
  metricValue: 'text-xl font-bold font-mono text-white',
  gradeRow:
    'grid grid-cols-[1fr_40px_45px] gap-4 items-center p-2 rounded hover:bg-slate-700/30 transition-colors',
  gradeLabel: 'text-slate-300 text-sm font-medium truncate',
  gradeCount: 'text-right text-slate-500 text-xs font-mono',
  gradePercent: 'text-right text-white font-bold font-mono',
  gradeHeader:
    'grid grid-cols-[1fr_auto_auto] gap-4 px-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold',
  gradeCompactCard:
    'flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50',
  gradeCompactLabel: 'text-slate-300 text-sm font-medium',
  gradeCompactPercent: 'text-white font-bold',
  gradeCompactCount: 'text-slate-500 text-xs ml-2',
  emptyState: 'flex items-center justify-center h-full text-slate-500 italic text-sm',
  specEditButton:
    'mt-auto p-3 text-center bg-slate-900/80 rounded-lg text-xs text-slate-500 border border-dashed border-slate-700 cursor-pointer hover:border-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2',
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
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  const emptyState = (message: string) => <div className={cs.emptyState}>{message}</div>;

  // Grade summary rows
  const renderGrades = () => {
    if (!stats?.gradeCounts || stats.gradeCounts.length === 0) return null;

    if (compact) {
      return (
        <div className="space-y-2">
          {stats.gradeCounts.map((grade, i) => (
            <div key={i} className={cs.gradeCompactCard} style={{ minHeight: 56 }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: grade.color }}
                />
                <span className={cs.gradeCompactLabel}>{grade.label}</span>
              </div>
              <div className="text-right">
                <span className={cs.gradeCompactPercent}>{grade.percentage.toFixed(1)}%</span>
                <span className={cs.gradeCompactCount}>({grade.count})</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className={cs.gradeHeader}>
          <span>Grade</span>
          <span>Count</span>
          <span>%</span>
        </div>
        {stats.gradeCounts.map((grade, i) => (
          <div key={i} className={cs.gradeRow}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: grade.color }}
              />
              <span className={cs.gradeLabel} title={grade.label}>
                {grade.label}
              </span>
            </div>
            <div className={cs.gradeCount}>{grade.count}</div>
            <div className={cs.gradePercent}>{grade.percentage.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetricGrid = () => {
    const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
    return (
      <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-2'}>
        {hasSpecs && (
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
    );
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
  }: {
    tab: 'summary' | 'histogram' | 'normality';
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
        activeTab === tab ? cs.tabActive : cs.tabInactive
      } ${compact ? 'flex-1 px-2 py-2' : ''}`}
      style={compact ? { minHeight: 44 } : undefined}
    >
      {label}
    </button>
  );

  // Compact layout (mobile)
  if (compact) {
    return (
      <div className={cs.containerCompact}>
        <div className={`${cs.tabBar} mb-4`}>
          <TabButton tab="summary" label="Summary" />
          <TabButton tab="histogram" label="Histogram" />
          <TabButton tab="normality" label="Prob Plot" />
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === 'summary' && (
            <div className="space-y-3">{renderGrades() || renderMetricGrid()}</div>
          )}
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
          <TabButton tab="histogram" label="Histogram" />
          <TabButton tab="normality" label="Prob Plot" />
        </div>
      </div>

      {activeTab === 'summary' ? (
        <>
          <div className="flex-1">{renderGrades() || renderMetricGrid()}</div>
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
