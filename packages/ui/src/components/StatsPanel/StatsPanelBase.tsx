import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

// Inline spec input for Target-first progressive disclosure
interface InlineSpecInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  inputClass: string;
  labelClass: string;
}

const InlineSpecInput = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  inputClass,
  labelClass,
}: InlineSpecInputProps) => (
  <div className="flex items-center gap-2">
    <label className={`${labelClass} w-20 text-right shrink-0`}>{label}</label>
    <input
      type="number"
      step="any"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder || ''}
      className={inputClass}
      aria-label={label}
    />
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
  onSaveSpecs,
  renderHistogram,
  renderProbabilityPlot,
  renderSummaryFooter,
  getTerm,
}) => {
  const cs = colorScheme;
  const [activeTab, setActiveTab] = useState<'summary' | 'histogram' | 'normality'>(
    defaultTab || 'summary'
  );

  // Inline spec input state
  const [targetInput, setTargetInput] = useState('');
  const [lslInput, setLslInput] = useState('');
  const [uslInput, setUslInput] = useState('');
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const targetAppliedRef = useRef(false);

  // Extract numeric values for histogram
  const histogramData = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData.map((d: any) => Number(d[outcome])).filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  const emptyState = (message: string) => <div className={cs.emptyState}>{message}</div>;

  const applyInlineSpecs = useCallback(() => {
    if (!onSaveSpecs) return;
    const target = targetInput.trim() ? parseFloat(targetInput) : undefined;
    const lsl = lslInput.trim() ? parseFloat(lslInput) : undefined;
    const usl = uslInput.trim() ? parseFloat(uslInput) : undefined;
    // Only apply if at least one value is set
    if (target !== undefined || lsl !== undefined || usl !== undefined) {
      const newSpecs: { lsl?: number; target?: number; usl?: number } = {};
      if (target !== undefined && !isNaN(target)) newSpecs.target = target;
      if (lsl !== undefined && !isNaN(lsl)) newSpecs.lsl = lsl;
      if (usl !== undefined && !isNaN(usl)) newSpecs.usl = usl;
      onSaveSpecs(newSpecs);
      targetAppliedRef.current = true;
    }
  }, [onSaveSpecs, targetInput, lslInput, uslInput]);

  const isAzure = cs === statsPanelAzureColorScheme;
  const inputClass = isAzure
    ? 'flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 placeholder-slate-600'
    : 'flex-1 bg-surface border border-edge rounded px-2 py-1.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 placeholder-content-muted';
  const inlineLabelClass = isAzure ? 'text-xs text-slate-400' : 'text-xs text-content-secondary';
  const inlineHeadingClass = isAzure ? 'text-sm text-slate-300' : 'text-sm text-content';
  const inlineSubtextClass = isAzure ? 'text-xs text-slate-500' : 'text-xs text-content-muted';
  const chevronClass = isAzure ? 'text-slate-400' : 'text-content-secondary';
  const expandButtonClass = isAzure
    ? 'flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 cursor-pointer transition-colors'
    : 'flex items-center gap-1.5 text-xs text-content-secondary hover:text-content cursor-pointer transition-colors';
  const inlineContainerClass = isAzure
    ? 'bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 space-y-3'
    : 'bg-surface-secondary/50 border border-edge/50 rounded-lg p-4 space-y-3';

  const renderInlineSpecInputs = () => {
    if (!onSaveSpecs) return null;
    return (
      <div className={inlineContainerClass} data-testid="inline-spec-inputs">
        <p className={inlineHeadingClass}>What should this measure be?</p>
        <InlineSpecInput
          label="Target"
          value={targetInput}
          onChange={setTargetInput}
          onBlur={applyInlineSpecs}
          inputClass={inputClass}
          labelClass={inlineLabelClass}
        />
        <button
          onClick={() => setLimitsExpanded(!limitsExpanded)}
          className={expandButtonClass}
          type="button"
        >
          {limitsExpanded ? (
            <ChevronDown size={14} className={chevronClass} />
          ) : (
            <ChevronRight size={14} className={chevronClass} />
          )}
          <span>Set tolerance limits (LSL / USL)</span>
        </button>
        {limitsExpanded && (
          <div className="space-y-2 pt-1">
            <InlineSpecInput
              label="LSL (Min)"
              value={lslInput}
              onChange={setLslInput}
              onBlur={applyInlineSpecs}
              inputClass={inputClass}
              labelClass={inlineLabelClass}
            />
            <InlineSpecInput
              label="USL (Max)"
              value={uslInput}
              onChange={setUslInput}
              onBlur={applyInlineSpecs}
              inputClass={inputClass}
              labelClass={inlineLabelClass}
            />
          </div>
        )}
        <p className={inlineSubtextClass}>Values apply when you tab or click away.</p>
      </div>
    );
  };

  const renderMetricGrid = () => {
    const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
    return (
      <div className="space-y-3">
        <div
          className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-2'}
        >
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
        {!hasSpecs && renderInlineSpecInputs()}
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
          {activeTab === 'summary' && <div className="space-y-3">{renderMetricGrid()}</div>}
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
          <div className="flex-1">{renderMetricGrid()}</div>
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
