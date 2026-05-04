/**
 * ProcessHubView — tab container around ProcessHubReviewPanel.
 *
 * Two tabs: "Status" (the existing flat layout, default) and "Capability"
 * (the production-line-glance dashboard). Plan C1 — see spec
 * docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.
 *
 * T11: B0 migration banner (above tablist) + modal (overlay).
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
import { isProcessHubComplete } from '@variscout/core';
import {
  GoalBanner,
  ProductionLineGlanceMigrationBanner,
  ProductionLineGlanceMigrationModal,
} from '@variscout/ui';
import ProcessHubReviewPanel from './ProcessHubReviewPanel';
import { ProcessHubCapabilityTab } from './ProcessHubCapabilityTab';
import { useHubMigrationState } from '../features/processHub/useHubMigrationState';

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
  persistInvestigation: (next: ProcessHubInvestigation) => void;
  /**
   * Persist the hub-level Cpk target default (cascade level "hub"). Writes to
   * `processHub.reviewSignal.capability.cpkTarget`. `undefined` clears it.
   */
  onHubCpkTargetCommit: (hubId: string, next: number | undefined) => void;
  /**
   * Called when the analyst edits the goal narrative inline via GoalBanner.
   * Absent → GoalBanner is read-only (existing behaviour pre-Task H).
   */
  onHubGoalChange?: (hubId: string, next: string) => void;
  /**
   * Opens the framing flow for this hub (HubCreationFlow or equivalent).
   * When provided, an "Edit framing" / "Add framing" CTA is shown on hubs
   * that fail isProcessHubComplete(). Absent → no CTA rendered.
   */
  onEditFraming?: (hubId: string) => void;
}

type TabKey = 'status' | 'capability';

export const ProcessHubView: React.FC<ProcessHubViewProps> = ({
  rollup,
  persistInvestigation,
  onHubCpkTargetCommit,
  onHubGoalChange,
  onEditFraming,
  ...reviewProps
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('status');
  const hubIsComplete = isProcessHubComplete(rollup.hub);

  const migration = useHubMigrationState({
    hubId: rollup.hub.id,
    members: rollup.investigations,
    canonicalMap: rollup.hub.canonicalProcessMap,
    persistInvestigation,
  });

  const tabClass = (key: TabKey) =>
    activeTab === key
      ? 'border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-content'
      : 'border-b-2 border-transparent px-4 py-2 text-sm text-content-secondary hover:text-content';

  return (
    <div className="flex h-full flex-col">
      {/*
        Mode A.1 reopen: surface the saved process goal immediately on Hub
        load. Azure Standard tier persists Hub-level state via Dexie always
        (no opt-in needed). GoalBanner self-renders nothing when goal is
        empty, so unbiased Hubs (pre-Framing-Layer Hubs without processGoal)
        keep the existing layout untouched.

        onChange wired to onHubGoalChange to persist inline edits (Task H).
      */}
      <GoalBanner
        goal={rollup.hub.processGoal}
        onChange={onHubGoalChange ? next => onHubGoalChange(rollup.hub.id, next) : undefined}
      />

      {/* Incomplete-hub framing prompt — shown when hub lacks goal or outcomes,
          and an onEditFraming handler is wired in. Gives returning analysts a
          single-click path back to the framing flow without blocking navigation. */}
      {!hubIsComplete && onEditFraming && (
        <div
          className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-sm"
          data-testid="hub-framing-prompt"
        >
          <span className="text-amber-700 dark:text-amber-400 flex-1">
            This hub hasn&apos;t been framed yet — add a process goal and outcome to unlock full
            analysis.
          </span>
          <button
            type="button"
            className="text-xs px-3 py-1 rounded border border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            onClick={() => onEditFraming(rollup.hub.id)}
            data-testid="hub-framing-prompt-cta"
          >
            Add framing
          </button>
        </div>
      )}
      <ProductionLineGlanceMigrationBanner
        count={migration.count}
        onMapClick={migration.openModal}
      />
      <ProductionLineGlanceMigrationModal
        isOpen={migration.isModalOpen}
        entries={migration.modalEntries}
        onSave={migration.handleSave}
        onDecline={migration.handleDecline}
        onClose={migration.closeModal}
      />
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
          <ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={onHubCpkTargetCommit} />
        </div>
      )}
    </div>
  );
};

export default ProcessHubView;
