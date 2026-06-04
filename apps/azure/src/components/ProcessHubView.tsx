/**
 * ProcessHubView — the portfolio Dashboard's thin Process Hub host.
 *
 * PO-3: the review surface (ProcessHubReviewPanel — CurrentStatePanel + Inbox +
 * state-item UI) is retired. The host keeps the Capability orient content
 * (production-line-glance dashboard) as its single scroll surface, plus the
 * GoalBanner, framing prompt, OutcomePin row, and the B0 migration banner/modal.
 * See spec docs/superpowers/specs/2026-06-02-connective-surface-model-design.md §2A.
 *
 * T11: B0 migration banner + modal (overlay).
 */
import React from 'react';
import type { ProcessHubAnalyze, ProcessHubRollup } from '@variscout/core';
import { isProcessHubComplete } from '@variscout/core';
import {
  GoalBanner,
  OutcomePin,
  ProductionLineGlanceMigrationBanner,
  ProductionLineGlanceMigrationModal,
} from '@variscout/ui';
import { ProcessHubCapabilityTab } from './ProcessHubCapabilityTab';
import { useHubMigrationState } from '../features/processHub/useHubMigrationState';

export interface ProcessHubViewProps {
  rollup: ProcessHubRollup<ProcessHubAnalyze>;
  persistInvestigation: (next: ProcessHubAnalyze) => void;
  /**
   * Persist the hub-level Cpk target default (cascade level "hub"). Writes to
   * `processHub.reviewSignal.capability.cpkTarget`. `undefined` clears it.
   */
  onHubCpkTargetCommit: (hubId: string, next: number | undefined) => void;
  /** Called when the analyst edits the goal narrative inline via GoalBanner. */
  onHubGoalChange?: (hubId: string, next: string) => void;
  /** Opens the framing flow for this hub. Absent → no CTA rendered. */
  onEditFraming?: (hubId: string) => void;
}

export const ProcessHubView: React.FC<ProcessHubViewProps> = ({
  rollup,
  persistInvestigation,
  onHubCpkTargetCommit,
  onHubGoalChange,
  onEditFraming,
}) => {
  const hubIsComplete = isProcessHubComplete(rollup.hub);

  const migration = useHubMigrationState({
    hubId: rollup.hub.id,
    members: rollup.analyzes,
    canonicalMap: rollup.hub.canonicalProcessMap,
    persistInvestigation,
  });

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
      {/* OutcomePin row — one pin per outcome when hub is complete.
          Stats are not available in the rollup model without a live analysis;
          the pin renders in the fallback (mean ± σ + n = 0) state and shows
          an "+ Add specs" chip that opens the framing flow for spec entry. */}
      {hubIsComplete && rollup.hub.outcomes && rollup.hub.outcomes.length > 0 && (
        <div
          className="flex flex-wrap gap-2 px-4 py-2 border-b border-edge bg-surface-secondary"
          data-testid="outcome-pin-row"
        >
          {rollup.hub.outcomes.map(outcome => (
            <OutcomePin
              key={outcome.columnName}
              outcome={outcome}
              stats={{
                mean: rollup.reviewSignal?.capability
                  ? ((rollup.reviewSignal as { mean?: number }).mean ?? 0)
                  : 0,
                sigma: 0,
                n: rollup.reviewSignal?.rowCount ?? 0,
              }}
              onAddSpecs={_col => onEditFraming?.(rollup.hub.id)}
            />
          ))}
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
      {/* PO-3: the review surface (ProcessHubReviewPanel — CurrentStatePanel +
          Inbox + state-item UI) is retired. The thin host keeps the Capability
          orient content (production-line-glance) as the single scroll surface. */}
      <div className="flex-1 overflow-y-auto" data-testid="process-hub-surface">
        <ProcessHubCapabilityTab rollup={rollup} onHubCpkTargetCommit={onHubCpkTargetCommit} />
      </div>
    </div>
  );
};

export default ProcessHubView;
