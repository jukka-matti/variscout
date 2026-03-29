import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import type { GlossaryTerm } from '@variscout/core';
import type { StatsPanelBaseProps, StatsPanelTab } from './types';
import { StagedComparisonCard } from './StagedComparisonCard';
import TargetDiscoveryCard from './TargetDiscoveryCard';
import BestSubsetsCard from './BestSubsetsCard';

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

const CONTAINER_CLASS =
  'w-full lg:w-80 bg-surface-secondary rounded-xl border border-edge p-3 flex flex-col gap-3 shadow-lg relative';
const CONTAINER_COMPACT_CLASS = 'flex flex-col h-full p-3 overflow-auto scroll-touch';
const TAB_BAR_CLASS = 'flex bg-surface/50 p-1 rounded-lg border border-edge/50';
const TAB_ACTIVE_CLASS = 'bg-surface-tertiary text-content shadow-sm';
const TAB_INACTIVE_CLASS = 'text-content-secondary hover:text-content';
const METRIC_CARD_BG_CLASS =
  'bg-surface-secondary/50 border border-edge/50 rounded-lg px-2 py-1.5 text-center';
const METRIC_LABEL_CLASS =
  'flex items-center justify-center gap-1 text-[10px] text-content-secondary mb-0.5';
const METRIC_VALUE_CLASS = 'text-base font-semibold font-mono text-content';
const EMPTY_STATE_CLASS =
  'flex items-center justify-center h-full text-content-muted italic text-sm';

const pencilIcon = <Pencil size={12} />;

interface TabButtonProps {
  tab: StatsPanelTab;
  label: string;
  helpTerm?: GlossaryTerm;
  activeTab: StatsPanelTab;
  onTabChange: (tab: StatsPanelTab) => void;
  compact?: boolean;
}

const TabButton = ({ tab, label, helpTerm, activeTab, onTabChange, compact }: TabButtonProps) => (
  <button
    onClick={() => onTabChange(tab)}
    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
      activeTab === tab ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
    } ${compact ? 'flex-1 px-2 py-2' : ''}`}
    style={compact ? { minHeight: 44 } : undefined}
  >
    {label}
    {helpTerm && <HelpTooltip term={helpTerm} iconSize={10} />}
  </button>
);

const StatsPanelBase: React.FC<StatsPanelBaseProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome: _outcome,
  defaultTab,
  className,
  compact = false,
  onEditSpecs,
  showCpk = true,
  stagedComparison,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  renderSummaryFooter,
  getTerm,
  sampleCount,
  // Target Discovery props
  isDrilling = false,
  complement,
  activeProjection,
  centeringOpportunity,
  onAcceptSpecs,
  // New tab render props
  renderDataTable,
  renderWhatIf,
  // Best subsets
  bestSubsetsResult,
  onBestSubsetClick,
}) => {
  const { t, formatStat } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatsPanelTab>(defaultTab || 'summary');

  const emptyState = (message: string) => <div className={EMPTY_STATE_CLASS}>{message}</div>;

  const editButtonClass =
    'flex items-center gap-1.5 text-xs text-content-secondary hover:text-blue-400 cursor-pointer transition-colors';

  const renderMetricGrid = () => {
    const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
    return (
      <div className="space-y-3">
        <div
          className={compact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-3 gap-1.5'}
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
                bgClass={METRIC_CARD_BG_CLASS}
                labelClass={METRIC_LABEL_CLASS}
                valueClass={METRIC_VALUE_CLASS}
              />
              <MetricCard
                label="Cp"
                value={stats?.cp !== undefined && stats?.cp !== null ? formatStat(stats.cp) : 'N/A'}
                helpTerm={getTerm('cp')}
                bgClass={METRIC_CARD_BG_CLASS}
                labelClass={METRIC_LABEL_CLASS}
                valueClass={METRIC_VALUE_CLASS}
              />
              <div
                className={`${METRIC_CARD_BG_CLASS}${onCpkClick ? ' cursor-pointer hover:border-blue-500/50 transition-colors' : ''}`}
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
                <div className={METRIC_LABEL_CLASS}>
                  Cpk
                  {getTerm('cpk') && <HelpTooltip term={getTerm('cpk')!} iconSize={12} />}
                </div>
                <div className={METRIC_VALUE_CLASS} data-testid="stat-value-cpk">
                  {stats?.cpk !== undefined && stats?.cpk !== null ? formatStat(stats.cpk) : 'N/A'}
                </div>
                {cpkTarget !== undefined && (
                  <div
                    className={`text-[10px] mt-0.5 ${
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
            value={
              stats?.mean !== undefined && stats?.mean !== null ? formatStat(stats.mean) : 'N/A'
            }
            helpTerm={getTerm('mean')}
            bgClass={METRIC_CARD_BG_CLASS}
            labelClass={METRIC_LABEL_CLASS}
            valueClass={METRIC_VALUE_CLASS}
          />
          <MetricCard
            label={t('stats.median')}
            value={
              stats?.median !== undefined && stats?.median !== null
                ? formatStat(stats.median)
                : 'N/A'
            }
            helpTerm={getTerm('median')}
            bgClass={METRIC_CARD_BG_CLASS}
            labelClass={METRIC_LABEL_CLASS}
            valueClass={METRIC_VALUE_CLASS}
          />
          <MetricCard
            label={t('stats.stdDev')}
            value={
              stats?.stdDev !== undefined && stats?.stdDev !== null
                ? formatStat(stats.stdDev)
                : 'N/A'
            }
            helpTerm={getTerm('stdDev')}
            bgClass={METRIC_CARD_BG_CLASS}
            labelClass={METRIC_LABEL_CLASS}
            valueClass={METRIC_VALUE_CLASS}
          />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-content-muted">
          <span data-testid="stat-value-samples">n={sampleCount ?? filteredData?.length ?? 0}</span>
          {onEditSpecs && (
            <button
              onClick={onEditSpecs}
              className={editButtonClass}
              type="button"
              data-testid="edit-specs-link"
            >
              {pencilIcon}
              <span>{t('stats.editSpecs')}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSummaryContent = () => {
    if (stagedComparison) {
      return <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />;
    }
    return (
      <>
        <TargetDiscoveryCard
          stats={stats}
          specs={specs}
          isDrilling={isDrilling}
          complement={complement}
          activeProjection={activeProjection}
          centeringOpportunity={centeringOpportunity}
          cpkTarget={cpkTarget}
          onAcceptSpecs={onAcceptSpecs}
          onCustomize={onEditSpecs}
          onOpenWhatIf={renderWhatIf ? () => setActiveTab('whatif') : undefined}
          sampleCount={sampleCount ?? filteredData?.length}
        />
        <BestSubsetsCard result={bestSubsetsResult ?? null} onSubsetClick={onBestSubsetClick} />
        {renderMetricGrid()}
      </>
    );
  };

  const renderTabs = () => (
    <div className={`${TAB_BAR_CLASS} ${compact ? 'mb-4' : ''}`}>
      <TabButton
        tab="summary"
        label={t('stats.summary')}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
      />
      <TabButton
        tab="data"
        label="Data"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
      />
      <TabButton
        tab="whatif"
        label="What-If"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <>
            <div className="flex-1">{renderSummaryContent()}</div>
            {stats && renderSummaryFooter?.(stats, specs)}
          </>
        );
      case 'data':
        return (
          <div className="flex-1 min-h-0 overflow-auto">
            {renderDataTable ? renderDataTable() : emptyState('No data available')}
          </div>
        );
      case 'whatif':
        return (
          <div className="flex-1 min-h-0 overflow-auto">
            {renderWhatIf ? renderWhatIf() : emptyState('No What-If simulator available')}
          </div>
        );
    }
  };

  // Compact layout (mobile)
  if (compact) {
    return (
      <div className={CONTAINER_COMPACT_CLASS}>
        {renderTabs()}
        <div className="flex-1 min-h-0">{renderTabContent()}</div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={className ? `${CONTAINER_CLASS} ${className}` : CONTAINER_CLASS}>
      <div className="flex justify-between items-center border-b border-inherit pb-4">
        {renderTabs()}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default StatsPanelBase;
