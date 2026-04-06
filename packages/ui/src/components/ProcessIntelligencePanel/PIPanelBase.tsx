import React, { useState, useRef, useEffect } from 'react';
import { Pencil, MoreHorizontal, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { HelpTooltip } from '../HelpTooltip';
import type { GlossaryTerm } from '@variscout/core';
import type { PIPanelBaseProps, PITab, PIOverflowView, PITabConfig, PIOverflowItem } from './types';
import { StagedComparisonCard } from './StagedComparisonCard';
import TargetDiscoveryCard from './TargetDiscoveryCard';

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
  'flex items-center justify-center gap-1 text-[0.625rem] text-content-secondary mb-0.5';
const METRIC_VALUE_CLASS = 'text-base font-semibold font-mono text-content';
const EMPTY_STATE_CLASS =
  'flex items-center justify-center h-full text-content-muted italic text-sm';

const pencilIcon = <Pencil size={12} />;

// ─── Legacy tab button (PITab-based) ────────────────────────────────────────

interface TabButtonProps {
  tab: PITab;
  label: string;
  helpTerm?: GlossaryTerm;
  activeTab: PITab;
  onTabChange: (tab: PITab) => void;
  compact?: boolean;
  badge?: number;
}

const TabButton = ({
  tab,
  label,
  helpTerm,
  activeTab,
  onTabChange,
  compact,
  badge,
}: TabButtonProps) => (
  <button
    onClick={() => onTabChange(tab)}
    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
      activeTab === tab ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
    } ${compact ? 'flex-1 px-2 py-2' : ''}`}
    style={compact ? { minHeight: 44 } : undefined}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[0.5rem] font-semibold rounded-full bg-blue-500/20 text-blue-400 leading-none">
        {badge}
      </span>
    )}
    {helpTerm && <HelpTooltip term={helpTerm} iconSize={10} />}
  </button>
);

// ─── Config-driven tab button ────────────────────────────────────────────────

interface ConfigTabButtonProps {
  tab: PITabConfig;
  activeId: string;
  onTabChange: (id: string) => void;
  compact?: boolean;
}

const ConfigTabButton = ({ tab, activeId, onTabChange, compact }: ConfigTabButtonProps) => (
  <button
    onClick={() => onTabChange(tab.id)}
    data-testid={`pi-tab-${tab.id}`}
    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
      activeId === tab.id ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
    } ${compact ? 'flex-1 px-2 py-2' : ''}`}
    style={compact ? { minHeight: 44 } : undefined}
  >
    {tab.label}
    {tab.badge !== undefined && tab.badge > 0 && (
      <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[0.5rem] font-semibold rounded-full bg-blue-500/20 text-blue-400 leading-none">
        {tab.badge}
      </span>
    )}
  </button>
);

// ─── Inlined overflow menu ───────────────────────────────────────────────────

interface OverflowMenuProps {
  activeOverflow: PIOverflowView;
  onSelect: (view: PIOverflowView) => void;
}

const LEGACY_OVERFLOW_LABELS: Record<NonNullable<PIOverflowView>, string> = {
  data: 'Data Table',
  whatif: 'What-If',
};

const LegacyOverflowMenu: React.FC<OverflowMenuProps> = ({ activeOverflow, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (activeOverflow !== null) {
    return (
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-surface-tertiary text-content border border-edge/60 hover:bg-surface hover:text-content-secondary transition-colors"
        aria-label={`Close ${LEGACY_OVERFLOW_LABELS[activeOverflow]}`}
      >
        <span>{LEGACY_OVERFLOW_LABELS[activeOverflow]}</span>
        <X size={10} />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative ml-auto flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-surface border border-edge rounded-lg shadow-lg py-1"
        >
          <button
            role="menuitem"
            type="button"
            className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors"
            onClick={() => {
              onSelect('data');
              setOpen(false);
            }}
          >
            {LEGACY_OVERFLOW_LABELS['data']}
          </button>
          <button
            role="menuitem"
            type="button"
            className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors"
            onClick={() => {
              onSelect('whatif');
              setOpen(false);
            }}
          >
            {LEGACY_OVERFLOW_LABELS['whatif']}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Config-driven overflow menu ─────────────────────────────────────────────

interface ConfigOverflowMenuProps {
  items: PIOverflowItem[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

const ConfigOverflowMenu: React.FC<ConfigOverflowMenuProps> = ({ items, activeId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const activeItem = activeId ? items.find(i => i.id === activeId) : null;

  if (activeItem) {
    return (
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-surface-tertiary text-content border border-edge/60 hover:bg-surface hover:text-content-secondary transition-colors"
        aria-label={`Close ${activeItem.label}`}
        data-testid={`pi-overflow-close-${activeItem.id}`}
      >
        <span>{activeItem.label}</span>
        <X size={10} />
      </button>
    );
  }

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative ml-auto flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="pi-overflow-trigger"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-surface border border-edge rounded-lg shadow-lg py-1"
        >
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors flex items-center gap-2"
              data-testid={`pi-overflow-item-${item.id}`}
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PIPanelBase ─────────────────────────────────────────────────────────────

const PIPanelBase: React.FC<PIPanelBaseProps> = ({
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
  // Legacy tab render props
  renderDataTable,
  renderWhatIf,
  renderQuestionsTab,
  renderJournalTab,
  openQuestionCount,
  // Legacy docs tab props
  showDocsTab,
  renderDocsTab,
  docsCount,
  // Legacy overflow menu props
  overflowView: overflowViewProp,
  onOverflowViewChange,
  // New config-driven API
  tabs,
  overflowItems,
}) => {
  const { t, formatStat } = useTranslation();

  // ── Legacy tab state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PITab>(defaultTab || 'stats');

  // Legacy overflow view can be controlled (via prop) or uncontrolled (local state)
  const [overflowViewLocal, setOverflowViewLocal] = useState<PIOverflowView>(null);
  const overflowView = overflowViewProp !== undefined ? overflowViewProp : overflowViewLocal;
  const setOverflowView = (view: PIOverflowView) => {
    if (onOverflowViewChange) {
      onOverflowViewChange(view);
    } else {
      setOverflowViewLocal(view);
    }
  };

  // ── Config-driven tab state ───────────────────────────────────────────────
  const [activeConfigTabId, setActiveConfigTabId] = useState<string>(() =>
    tabs && tabs.length > 0 ? tabs[0].id : ''
  );
  const [activeOverflowItemId, setActiveOverflowItemId] = useState<string | null>(null);

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
        <div className="flex items-center gap-3 text-[0.625rem] text-content-muted">
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
          onOpenWhatIf={renderWhatIf ? () => setOverflowView('whatif') : undefined}
          sampleCount={sampleCount ?? filteredData?.length}
        />
        {renderMetricGrid()}
      </>
    );
  };

  // ── Config-driven rendering ───────────────────────────────────────────────

  const renderConfigTabBar = () => {
    if (!tabs) return null;
    const hasOverflow = overflowItems && overflowItems.length > 0;
    return (
      <div className={`${TAB_BAR_CLASS} ${compact ? 'mb-4' : ''} items-center`}>
        {tabs.map(tab => (
          <ConfigTabButton
            key={tab.id}
            tab={tab}
            activeId={activeConfigTabId}
            onTabChange={setActiveConfigTabId}
            compact={compact}
          />
        ))}
        {hasOverflow && (
          <ConfigOverflowMenu
            items={overflowItems!}
            activeId={activeOverflowItemId}
            onSelect={setActiveOverflowItemId}
          />
        )}
      </div>
    );
  };

  const renderConfigTabContent = () => {
    if (!tabs) return null;

    // Overflow item content takes priority
    if (activeOverflowItemId) {
      const item = overflowItems?.find(i => i.id === activeOverflowItemId);
      if (item) {
        return (
          <div
            className="flex-1 min-h-0 overflow-auto"
            data-testid={`pi-overflow-content-${item.id}`}
          >
            {item.content}
          </div>
        );
      }
    }

    const activeTab = tabs.find(t => t.id === activeConfigTabId) ?? tabs[0];
    if (!activeTab) return null;

    return (
      <div className="flex-1 min-h-0 overflow-auto" data-testid={`pi-tab-content-${activeTab.id}`}>
        {activeTab.content}
      </div>
    );
  };

  // ── Legacy rendering ──────────────────────────────────────────────────────

  const renderLegacyTabBar = () => (
    <div className={`${TAB_BAR_CLASS} ${compact ? 'mb-4' : ''} items-center`}>
      <TabButton
        tab="stats"
        label="Stats"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
      />
      <TabButton
        tab="questions"
        label="Questions"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
        badge={openQuestionCount}
      />
      <TabButton
        tab="journal"
        label="Journal"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compact={compact}
      />
      {showDocsTab && (
        <TabButton
          tab="docs"
          label="Docs"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          compact={compact}
          badge={docsCount}
        />
      )}
      <LegacyOverflowMenu activeOverflow={overflowView} onSelect={setOverflowView} />
    </div>
  );

  const renderLegacyTabContent = () => {
    // Overflow views take priority over tab selection
    if (overflowView === 'data') {
      return (
        <div className="flex-1 min-h-0 overflow-auto">
          {renderDataTable ? renderDataTable() : emptyState('No data available')}
        </div>
      );
    }
    if (overflowView === 'whatif') {
      return (
        <div className="flex-1 min-h-0 overflow-auto">
          {renderWhatIf ? renderWhatIf() : emptyState('No What-If simulator available')}
        </div>
      );
    }

    switch (activeTab) {
      case 'stats':
        return (
          <>
            <div className="flex-1">{renderSummaryContent()}</div>
            {stats && renderSummaryFooter?.(stats, specs)}
          </>
        );
      case 'questions':
        return (
          <div className="flex-1 min-h-0 overflow-auto">
            {renderQuestionsTab ? renderQuestionsTab() : emptyState('No questions yet')}
          </div>
        );
      case 'journal':
        return (
          <div className="flex-1 min-h-0 overflow-auto">
            {renderJournalTab ? renderJournalTab() : emptyState('No journal entries yet')}
          </div>
        );
      case 'docs':
        return (
          <div className="flex-1 min-h-0 overflow-auto">
            {renderDocsTab ? renderDocsTab() : emptyState('No documents uploaded yet')}
          </div>
        );
    }
  };

  // ── Routing: config vs legacy ─────────────────────────────────────────────

  const isConfigMode = tabs !== undefined;
  const renderTabBar = isConfigMode ? renderConfigTabBar : renderLegacyTabBar;
  const renderTabContent = isConfigMode ? renderConfigTabContent : renderLegacyTabContent;

  // Compact layout (mobile)
  if (compact) {
    return (
      <div className={CONTAINER_COMPACT_CLASS}>
        {renderTabBar()}
        <div className="flex-1 min-h-0">{renderTabContent()}</div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={className ? `${CONTAINER_CLASS} ${className}` : CONTAINER_CLASS}>
      <div className="flex justify-between items-center border-b border-inherit pb-4">
        {renderTabBar()}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default PIPanelBase;
