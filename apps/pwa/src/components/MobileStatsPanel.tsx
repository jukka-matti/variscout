import React, { useState, useMemo } from 'react';
import { CheckCircle2, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { useData } from '../context/DataContext';
import { StatsResult } from '../logic/stats';

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
  const { displayOptions } = useData();
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>('summary');

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  return (
    <div className="flex flex-col h-full p-3 overflow-auto scroll-touch">
      {/* Tab Buttons */}
      <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 mb-4">
        {(['summary', 'histogram', 'normality'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all touch-feedback
                            ${
                              activeTab === tab
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400'
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
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    style={{ minHeight: 56 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: grade.color }}
                      />
                      <span className="text-slate-300 text-sm font-medium">{grade.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{grade.percentage.toFixed(1)}%</span>
                      <span className="text-slate-500 text-xs ml-2">({grade.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Standard Cp/Cpk Mode */
              <>
                <StatCard
                  icon={<CheckCircle2 className="text-green-500" size={20} />}
                  label="Pass Rate"
                  value={`${(100 - (stats?.outOfSpecPercentage || 0)).toFixed(1)}%`}
                  highlight
                />

                {displayOptions.showCpk && stats?.cpk !== undefined && (
                  <StatCard
                    icon={<TrendingUp className="text-blue-400" size={20} />}
                    label="Cpk"
                    value={stats.cpk.toFixed(2)}
                    status={stats.cpk >= 1.33 ? 'good' : 'warning'}
                  />
                )}

                {displayOptions.showCp && stats?.cp !== undefined && (
                  <StatCard
                    icon={<BarChart3 className="text-purple-400" size={20} />}
                    label="Cp"
                    value={stats.cp.toFixed(2)}
                    status={stats.cp >= 1.33 ? 'good' : 'warning'}
                  />
                )}

                <StatCard
                  icon={<AlertCircle className="text-red-400" size={20} />}
                  label="Rejected"
                  value={`${stats?.outOfSpecPercentage?.toFixed(1) || 0}%`}
                />

                {/* Specs Display */}
                <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">LSL</div>
                      <div className="font-mono text-white text-lg">{specs.lsl ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Target</div>
                      <div className="font-mono text-white text-lg">{specs.target ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">USL</div>
                      <div className="font-mono text-white text-lg">{specs.usl ?? '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                {stats && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Mean</div>
                        <div className="font-mono text-white">{stats.mean.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Std Dev</div>
                        <div className="font-mono text-white">{stats.stdDev.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">UCL</div>
                        <div className="font-mono text-white">{stats.ucl.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">LCL</div>
                        <div className="font-mono text-white">{stats.lcl.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
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

// Helper components
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: 'good' | 'warning';
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, status, highlight }) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl border
            ${highlight ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-700/50'}`}
    style={{ minHeight: 56 }}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-slate-300">{label}</span>
    </div>
    <span
      className={`text-xl font-bold
            ${status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-white'}`}
    >
      {value}
    </span>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full text-slate-500 italic">{message}</div>
);

export default MobileStatsPanel;
