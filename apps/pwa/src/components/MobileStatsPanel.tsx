import React, { useState, useMemo } from 'react';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import type { StatsResult, GlossaryTerm } from '@variscout/core';

// Status helper functions
const getCpStatus = (value: number): 'good' | 'warning' | 'poor' => {
  if (value >= 1.33) return 'good';
  if (value >= 1.0) return 'warning';
  return 'poor';
};

const getPassRateStatus = (value: number): 'good' | 'warning' | 'poor' => {
  if (value >= 99) return 'good';
  if (value >= 95) return 'warning';
  return 'poor';
};

const getStatusColor = (status?: 'good' | 'warning' | 'poor'): string => {
  if (!status) return 'text-white';
  return status === 'good'
    ? 'text-green-500'
    : status === 'warning'
      ? 'text-amber-500'
      : 'text-red-400';
};

// MetricCard component for the summary grid
interface MetricCardProps {
  label: string;
  value: string | number;
  helpTerm?: GlossaryTerm;
  status?: 'good' | 'warning' | 'poor';
  unit?: string;
}

const MetricCard = ({ label, value, helpTerm, status, unit }: MetricCardProps) => (
  <div className="bg-surface-secondary/50 border border-edge/50 rounded-lg p-3 text-center">
    <div className="flex items-center justify-center gap-1 text-xs text-content-secondary mb-1">
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={12} />}
    </div>
    <div className={`text-xl font-bold font-mono ${getStatusColor(status)}`}>
      {value}
      {unit}
    </div>
    {status && (
      <div className={`text-xs mt-1 ${getStatusColor(status)}`}>
        {status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Marginal' : '✗ Poor'}
      </div>
    )}
  </div>
);

interface MobileStatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
  outcome?: string | null;
}

const MobileStatsPanel: React.FC<MobileStatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
}) => {
  const { getTerm } = useGlossary();
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>('summary');

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  return (
    <div className="flex flex-col h-full p-3 overflow-auto scroll-touch">
      {/* Tab Buttons */}
      <div className="flex bg-surface/50 p-1 rounded-lg border border-edge/50 mb-4">
        {(['summary', 'histogram', 'normality'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all touch-feedback
                            ${
                              activeTab === tab
                                ? 'bg-surface-tertiary text-white shadow-sm'
                                : 'text-content-secondary'
                            }`}
            style={{ minHeight: 44 }}
          >
            {tab === 'summary' ? 'Summary' : tab === 'histogram' ? 'Histogram' : 'Prob Plot'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'summary' && (
          <div className="space-y-3">
            {/* Grade Summary Mode (Coffee/Textiles) */}
            {stats?.gradeCounts && stats.gradeCounts.length > 0 ? (
              <div className="space-y-2">
                {stats.gradeCounts.map((grade, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-edge/50"
                    style={{ minHeight: 56 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: grade.color }}
                      />
                      <span className="text-content text-sm font-medium">{grade.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{grade.percentage.toFixed(1)}%</span>
                      <span className="text-content-muted text-xs ml-2">({grade.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Process Health Card Grid */
              <>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Pass Rate"
                    value={(100 - (stats?.outOfSpecPercentage || 0)).toFixed(1)}
                    unit="%"
                    helpTerm={getTerm('passRate')}
                    status={getPassRateStatus(100 - (stats?.outOfSpecPercentage || 0))}
                  />
                  <MetricCard
                    label="Cp"
                    value={stats?.cp?.toFixed(2) ?? 'N/A'}
                    helpTerm={getTerm('cp')}
                    status={stats?.cp ? getCpStatus(stats.cp) : undefined}
                  />
                  <MetricCard
                    label="Cpk"
                    value={stats?.cpk?.toFixed(2) ?? 'N/A'}
                    helpTerm={getTerm('cpk')}
                    status={stats?.cpk ? getCpStatus(stats.cpk) : undefined}
                  />
                  <MetricCard
                    label="Mean"
                    value={stats?.mean?.toFixed(2) ?? 'N/A'}
                    helpTerm={getTerm('mean')}
                  />
                  <MetricCard
                    label="Std Dev"
                    value={stats?.stdDev?.toFixed(2) ?? 'N/A'}
                    helpTerm={getTerm('stdDev')}
                  />
                  <MetricCard label="Samples" value={`n=${filteredData?.length ?? 0}`} />
                </div>

                {/* Specs Display */}
                <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-edge/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-content-muted text-xs mb-1 flex items-center justify-center gap-1">
                        LSL
                        <HelpTooltip term={getTerm('lsl')} iconSize={12} />
                      </div>
                      <div className="font-mono text-white text-lg">{specs.lsl ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-content-muted text-xs mb-1 flex items-center justify-center gap-1">
                        Target
                        <HelpTooltip term={getTerm('target')} iconSize={12} />
                      </div>
                      <div className="font-mono text-white text-lg">{specs.target ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-content-muted text-xs mb-1 flex items-center justify-center gap-1">
                        USL
                        <HelpTooltip term={getTerm('usl')} iconSize={12} />
                      </div>
                      <div className="font-mono text-white text-lg">{specs.usl ?? '-'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'histogram' && (
          <div className="h-full min-h-[200px]">
            {histogramData.length > 0 && stats ? (
              <CapabilityHistogram data={histogramData} specs={specs} mean={stats.mean} />
            ) : (
              <EmptyState message="No data for histogram" />
            )}
          </div>
        )}

        {activeTab === 'normality' && (
          <div className="h-full min-h-[200px]">
            {histogramData.length > 0 && stats ? (
              <ProbabilityPlot data={histogramData} mean={stats.mean} stdDev={stats.stdDev} />
            ) : (
              <EmptyState message="No data for probability plot" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full text-content-muted italic">{message}</div>
);

export default MobileStatsPanel;
