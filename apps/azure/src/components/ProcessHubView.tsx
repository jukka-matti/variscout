/**
 * ProcessHubView — tab container around ProcessHubReviewPanel.
 *
 * Two tabs: "Status" (the existing flat layout, default) and "Capability"
 * (the production-line-glance dashboard). Plan C1 — see spec
 * docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.
 */
import React, { useState } from 'react';
import type {
  Finding,
  ProcessHubInvestigation,
  ProcessHubRollup,
  ProcessStateItem,
  ProcessStateNote,
  ResponsePathAction,
} from '@variscout/core';
import ProcessHubReviewPanel from './ProcessHubReviewPanel';
import { ProcessHubCapabilityTab } from './ProcessHubCapabilityTab';

export interface ProcessHubViewProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onStartInvestigation: () => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
  onResponsePathAction: (item: ProcessStateItem, action: ResponsePathAction, hubId: string) => void;
  onRequestAddNote: (item: ProcessStateItem, hubId: string) => void;
  onRequestEditNote: (item: ProcessStateItem, note: ProcessStateNote, hubId: string) => void;
  onDeleteNote: (item: ProcessStateItem, noteId: string, hubId: string) => void;
  currentUserId: string;
  loadFindingsForItem: (item: ProcessStateItem, hubId: string) => Promise<readonly Finding[]>;
  onChipClick: (item: ProcessStateItem, hubId: string, count: number) => void;
  onFindingSelect: (item: ProcessStateItem, finding: Finding, hubId: string) => void;
}

type TabKey = 'status' | 'capability';

export const ProcessHubView: React.FC<ProcessHubViewProps> = ({ rollup, ...reviewProps }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('status');

  const tabClass = (key: TabKey) =>
    activeTab === key
      ? 'border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-content'
      : 'border-b-2 border-transparent px-4 py-2 text-sm text-content-secondary hover:text-content';

  return (
    <div className="flex h-full flex-col">
      <div
        role="tablist"
        aria-label="Process Hub view"
        className="flex border-b border-edge bg-surface"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'status'}
          aria-controls="process-hub-status-tab-panel"
          onClick={() => setActiveTab('status')}
          className={tabClass('status')}
        >
          Status
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'capability'}
          aria-controls="process-hub-capability-tab-panel"
          onClick={() => setActiveTab('capability')}
          className={tabClass('capability')}
        >
          Capability
        </button>
      </div>

      {activeTab === 'status' ? (
        <div
          role="tabpanel"
          id="process-hub-status-tab-panel"
          data-testid="process-hub-status-tab-panel"
          className="flex-1 overflow-y-auto"
        >
          <ProcessHubReviewPanel rollup={rollup} {...reviewProps} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="process-hub-capability-tab-panel"
          data-testid="process-hub-capability-tab-panel"
          className="flex-1 overflow-y-auto"
        >
          <ProcessHubCapabilityTab rollup={rollup} />
        </div>
      )}
    </div>
  );
};

export default ProcessHubView;
