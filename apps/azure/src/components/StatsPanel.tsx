import React, { useState, useMemo } from 'react';
import type { StatsResult, GlossaryTerm } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import WhatIfSimulator from './WhatIfSimulator';

// MetricCard component for the summary grid
interface MetricCardProps {
  label: string;
  value: string | number;
  helpTerm?: GlossaryTerm;
  unit?: string;
}

const MetricCard = ({ label, value, helpTerm, unit }: MetricCardProps) => (
  <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
      {label}
      {helpTerm && <HelpTooltip term={helpTerm} iconSize={12} />}
    </div>
    <div className="text-xl font-bold font-mono text-white">
      {value}
      {unit}
    </div>
  </div>
);

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
  outcome?: string | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, specs, filteredData = [], outcome }) => {
  const { getTerm } = useGlossary();
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>('summary');

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  return (
    <div className="w-full lg:w-80 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-4 shadow-lg relative">
      {/* Header / Tab buttons */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'summary'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'histogram'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Histogram
          </button>
          <button
            onClick={() => setActiveTab('normality')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'normality'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Prob Plot
          </button>
        </div>
      </div>

      {activeTab === 'summary' ? (
        /* Summary Tab Content */
        <>
          <div className="flex-1">
            {/* Grade Summary Mode (Coffee/Textiles) */}
            {stats?.gradeCounts && stats.gradeCounts.length > 0 ? (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  <span>Grade</span>
                  <span>Count</span>
                  <span>%</span>
                </div>
                {stats.gradeCounts.map((grade, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_40px_45px] gap-4 items-center p-2 rounded hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: grade.color }}
                      ></div>
                      <span
                        className="text-slate-300 text-sm font-medium truncate"
                        title={grade.label}
                      >
                        {grade.label}
                      </span>
                    </div>
                    <div className="text-right text-slate-500 text-xs font-mono">{grade.count}</div>
                    <div className="text-right text-white font-bold font-mono">
                      {grade.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Process Health Card Grid */
              (() => {
                const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hasSpecs && (
                      <>
                        <MetricCard
                          label="Pass Rate"
                          value={(100 - (stats?.outOfSpecPercentage || 0)).toFixed(1)}
                          unit="%"
                          helpTerm={getTerm('passRate')}
                        />
                        <MetricCard
                          label="Cp"
                          value={stats?.cp?.toFixed(2) ?? 'N/A'}
                          helpTerm={getTerm('cp')}
                        />
                        <MetricCard
                          label="Cpk"
                          value={stats?.cpk?.toFixed(2) ?? 'N/A'}
                          helpTerm={getTerm('cpk')}
                        />
                      </>
                    )}
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
                );
              })()
            )}

            {/* What-If Simulator */}
            {stats && (specs.usl !== undefined || specs.lsl !== undefined) && (
              <div className="mt-4">
                <WhatIfSimulator
                  currentStats={{
                    mean: stats.mean,
                    stdDev: stats.stdDev,
                    cpk: stats.cpk,
                  }}
                  specs={specs}
                  defaultExpanded={false}
                />
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'histogram' ? (
        /* Histogram Tab Content */
        <div className="flex-1 min-h-[200px]">
          {histogramData.length > 0 && stats ? (
            <CapabilityHistogram data={histogramData} specs={specs} mean={stats.mean} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
              No data available for histogram
            </div>
          )}
        </div>
      ) : (
        /* Normality Tab Content (Probability Plot) */
        <div className="flex-1 min-h-[200px]">
          {histogramData.length > 0 && stats ? (
            <ProbabilityPlot data={histogramData} mean={stats.mean} stdDev={stats.stdDev} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
              No data available for probability plot
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
