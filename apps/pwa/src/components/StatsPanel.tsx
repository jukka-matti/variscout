import React, { useState, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { Plus } from 'lucide-react';
import type { StatsResult, GlossaryTerm } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { useData } from '../context/DataContext';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import SpecEditor from './SpecEditor';

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

interface StatsPanelProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
  outcome?: string | null;
  defaultTab?: 'summary' | 'histogram' | 'normality';
  className?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  defaultTab,
  className,
}) => {
  const { displayOptions, setDisplayOptions, setSpecs, setGrades, grades } = useData();
  const { getTerm } = useGlossary();
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>(
    defaultTab || 'summary'
  );
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  const handleSaveSpecs = (
    newSpecs: { usl?: number; lsl?: number; target?: number },
    newGrades: { max: number; label: string; color: string }[]
  ) => {
    setSpecs(newSpecs);
    setGrades(newGrades);

    // Auto-enable Cp display when both USL and LSL are set
    if (newSpecs.usl !== undefined && newSpecs.lsl !== undefined && !displayOptions.showCp) {
      setDisplayOptions({ ...displayOptions, showCp: true });
    }
  };

  return (
    <div
      className={twMerge(
        'w-full lg:w-80 bg-surface-secondary rounded-xl border border-edge p-6 flex flex-col gap-4 shadow-lg relative',
        className
      )}
    >
      {/* Header / Tab buttons */}
      <div className="flex justify-between items-center border-b border-edge pb-4">
        <div className="flex bg-surface/50 p-1 rounded-lg border border-edge/50">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'summary'
                ? 'bg-surface-tertiary text-white shadow-sm'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'histogram'
                ? 'bg-surface-tertiary text-white shadow-sm'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            Histogram
          </button>
          <button
            onClick={() => setActiveTab('normality')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'normality'
                ? 'bg-surface-tertiary text-white shadow-sm'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            Prob Plot
          </button>
        </div>
      </div>

      {/* Spec Editor Popover */}
      {isEditingSpecs && (
        <SpecEditor
          specs={specs}
          grades={grades}
          onSave={handleSaveSpecs}
          onClose={() => setIsEditingSpecs(false)}
          style={{ top: '70px', right: '0px', width: '100%', maxWidth: '320px', zIndex: 20 }}
        />
      )}

      {activeTab === 'summary' ? (
        /* Summary Tab Content */
        <>
          <div className="flex-1">
            {/* Grade Summary Mode (Coffee/Textiles) */}
            {stats?.gradeCounts && stats.gradeCounts.length > 0 ? (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-2 text-[10px] text-content-muted uppercase tracking-wider font-semibold">
                  <span>Grade</span>
                  <span>Count</span>
                  <span>%</span>
                </div>
                {stats.gradeCounts.map((grade, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_40px_45px] gap-4 items-center p-2 rounded hover:bg-surface-tertiary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: grade.color }}
                      ></div>
                      <span
                        className="text-content text-sm font-medium truncate"
                        title={grade.label}
                      >
                        {grade.label}
                      </span>
                    </div>
                    <div className="text-right text-content-muted text-xs font-mono">
                      {grade.count}
                    </div>
                    <div className="text-right text-white font-bold font-mono">
                      {grade.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Process Health Card Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
            )}
          </div>

          <div
            className="mt-auto p-4 bg-surface/80 rounded-lg text-xs text-content-muted border border-edge cursor-pointer hover:border-edge-secondary transition-colors group"
            onClick={() => setIsEditingSpecs(true)}
          >
            {specs.usl && (
              <div className="flex justify-between">
                <span>USL:</span>{' '}
                <span className="font-mono text-content-secondary group-hover:text-white">
                  {specs.usl}
                </span>
              </div>
            )}
            {specs.lsl && (
              <div className="flex justify-between">
                <span>LSL:</span>{' '}
                <span className="font-mono text-content-secondary group-hover:text-white">
                  {specs.lsl}
                </span>
              </div>
            )}
            {!specs.usl && !specs.lsl && (
              <div className="italic text-center text-content-muted group-hover:text-blue-400 flex items-center justify-center gap-2">
                <Plus size={14} /> Add Specs
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
            <div className="flex items-center justify-center h-full text-content-muted italic text-sm">
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
            <div className="flex items-center justify-center h-full text-content-muted italic text-sm">
              No data available for probability plot
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
