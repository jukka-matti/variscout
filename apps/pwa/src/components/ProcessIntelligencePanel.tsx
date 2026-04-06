import React, { useMemo, useState } from 'react';
import type { StatsResult, DataRow, SpecLimits } from '@variscout/core';
import type { PIOverflowView } from '@variscout/ui';
import { PIPanelBase, StatsTabContent, WhatIfSimulator, computePresets } from '@variscout/ui';
import type { PITabConfig, PIOverflowItem } from '@variscout/ui';
import { useProjectStore } from '@variscout/stores';
import SpecEditor from './settings/SpecEditor';

interface ProcessIntelligencePanelProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: string;
  className?: string;
  compact?: boolean;
  cpkTarget?: number;
  onCpkClick?: () => void;
  subgroupsMeetingTarget?: number;
  subgroupCount?: number;
  sampleCount?: number;
  /** PI panel: Questions tab render prop */
  renderQuestionsTab?: () => React.ReactNode;
  /** PI panel: Journal tab render prop */
  renderJournalTab?: () => React.ReactNode;
  /** PI panel: open question count for badge */
  openQuestionCount?: number;
  /** PI panel: overflow view state (controlled by parent) */
  overflowView?: PIOverflowView;
  /** PI panel: overflow view change handler */
  onOverflowViewChange?: (view: PIOverflowView) => void;
}

const ProcessIntelligencePanel: React.FC<ProcessIntelligencePanelProps> = ({
  stats,
  specs,
  filteredData = [],
  outcome,
  defaultTab,
  className,
  compact = false,
  cpkTarget,
  onCpkClick,
  subgroupsMeetingTarget,
  subgroupCount,
  sampleCount: _sampleCount,
  renderQuestionsTab,
  renderJournalTab,
  openQuestionCount,
  overflowView: _overflowView,
  onOverflowViewChange: _onOverflowViewChange,
}) => {
  const setSpecs = useProjectStore(s => s.setSpecs);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const handleSaveSpecs = (newSpecs: SpecLimits) => {
    setSpecs(newSpecs);
  };

  const presets = useMemo(() => {
    if (!stats || !outcome) return undefined;
    return computePresets(
      { mean: stats.mean, stdDev: stats.stdDev, median: stats.median },
      specs,
      filteredData,
      outcome
    );
  }, [stats, specs, filteredData, outcome]);

  // Build tabs config
  const tabs: PITabConfig[] = useMemo(() => {
    const result: PITabConfig[] = [
      {
        id: 'stats',
        label: 'Stats',
        content: (
          <StatsTabContent
            onEditSpecs={() => setIsEditingSpecs(true)}
            showCpk={true}
            cpkTarget={cpkTarget}
            onCpkClick={onCpkClick}
            subgroupsMeetingTarget={subgroupsMeetingTarget}
            subgroupCount={subgroupCount}
          />
        ),
      },
    ];
    if (renderQuestionsTab) {
      result.push({
        id: 'questions',
        label: 'Questions',
        badge: openQuestionCount,
        content: renderQuestionsTab(),
      });
    }
    if (renderJournalTab) {
      result.push({
        id: 'journal',
        label: 'Journal',
        content: renderJournalTab(),
      });
    }
    return result;
  }, [
    cpkTarget,
    onCpkClick,
    subgroupsMeetingTarget,
    subgroupCount,
    renderQuestionsTab,
    renderJournalTab,
    openQuestionCount,
  ]);

  // Build overflow items
  const overflowItems: PIOverflowItem[] = useMemo(() => {
    const items: PIOverflowItem[] = [];
    if (filteredData.length > 0 && outcome) {
      items.push({
        id: 'data',
        label: 'Data Table',
        content: (
          <div className="text-xs text-content-secondary p-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-edge/50">
                  <th className="text-left py-1 px-2 font-medium">#</th>
                  <th className="text-right py-1 px-2 font-medium">{outcome}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-b border-edge/20 hover:bg-surface-tertiary/30">
                    <td className="py-0.5 px-2 text-content-muted">{i + 1}</td>
                    <td className="py-0.5 px-2 text-right font-mono">
                      {String(row[outcome] ?? '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 100 && (
              <div className="text-center text-content-muted mt-2">
                Showing 100 of {filteredData.length} rows
              </div>
            )}
          </div>
        ),
      });
    }
    if (stats && (specs.usl !== undefined || specs.lsl !== undefined)) {
      items.push({
        id: 'whatif',
        label: 'What-If',
        content: (
          <WhatIfSimulator
            currentStats={{ mean: stats.mean, stdDev: stats.stdDev, cpk: stats.cpk }}
            specs={specs}
            defaultExpanded={true}
            cpkTarget={cpkTarget}
            presets={presets}
          />
        ),
      });
    }
    return items;
  }, [filteredData, outcome, stats, specs, cpkTarget, presets]);

  return (
    <>
      {isEditingSpecs && (
        <SpecEditor
          specs={specs}
          onSave={handleSaveSpecs}
          onClose={() => setIsEditingSpecs(false)}
          style={{ top: '70px', right: '0px', width: '100%', maxWidth: '320px', zIndex: 20 }}
        />
      )}

      <PIPanelBase
        tabs={tabs}
        overflowItems={overflowItems}
        defaultTab={defaultTab}
        className={className}
        compact={compact}
      />
    </>
  );
};

export default ProcessIntelligencePanel;
