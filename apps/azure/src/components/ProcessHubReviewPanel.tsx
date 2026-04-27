import React from 'react';
import { Plus } from 'lucide-react';
import {
  buildCurrentProcessState,
  buildProcessHubCadence,
  deriveResponsePathAction,
} from '@variscout/core';
import type {
  ProcessHubInvestigation,
  ProcessHubRollup,
  ProcessStateItem,
  ResponsePathAction,
} from '@variscout/core';
import { ProcessHubCurrentStatePanel } from '@variscout/ui';
import ProcessHubCadenceQuestions from './ProcessHubCadenceQuestions';
import ProcessHubCadenceQueues from './ProcessHubCadenceQueues';
import { formatLatestActivity } from './ProcessHubFormat';

interface ProcessHubReviewPanelProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onStartInvestigation: () => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
  onResponsePathAction: (item: ProcessStateItem, action: ResponsePathAction, hubId: string) => void;
}

const SnapshotCard: React.FC<{
  label: string;
  value: number;
  testId: string;
  tone?: 'default' | 'amber' | 'green';
}> = ({ label, value, testId, tone = 'default' }) => {
  const toneClass =
    tone === 'amber' ? 'text-amber-400' : tone === 'green' ? 'text-green-400' : 'text-content';

  return (
    <div className="rounded-md border border-edge bg-surface px-3 py-2">
      <p className="text-xs font-medium text-content-secondary">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`} data-testid={testId}>
        {value}
      </p>
    </div>
  );
};

const ProcessHubReviewPanel: React.FC<ProcessHubReviewPanelProps> = ({
  rollup,
  onOpenInvestigation,
  onStartInvestigation,
  onSetupSustainment,
  onLogReview,
  onRecordHandoff,
  onResponsePathAction,
}) => {
  const cadence = buildProcessHubCadence(rollup);
  const currentState = buildCurrentProcessState(rollup, cadence);

  // Pick the most-recently-modified investigation in this hub as the
  // default navigation target for hub-aggregate state items (capability-gap,
  // change-signals, top-focus). For per-investigation items, the action
  // uses item.investigationIds[0] instead.
  const defaultInvestigationId = React.useMemo(() => {
    const sorted = [...rollup.investigations].sort((a, b) =>
      (b.modified ?? '').localeCompare(a.modified ?? '')
    );
    // Empty fallback when the rollup has no investigations: deriveResponsePathAction
    // will then return unsupported actions for hub-aggregate items, which actionToHref
    // maps to null, producing a silent no-op (correct UX — nothing to navigate to).
    return sorted[0]?.id ?? '';
  }, [rollup.investigations]);

  const actionFor = React.useCallback(
    (item: ProcessStateItem) => deriveResponsePathAction(item, defaultInvestigationId),
    [defaultInvestigationId]
  );
  const headingId = `process-hub-current-state-${rollup.hub.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={headingId} className="text-lg font-semibold text-content">
            {rollup.hub.name} Current Process State
          </h3>
          <p className="mt-1 text-sm font-medium text-content-secondary">Process state review</p>
          <p className="mt-1 text-xs text-content-secondary">
            {rollup.hub.processOwner?.displayName
              ? `Owner: ${rollup.hub.processOwner.displayName} · `
              : ''}
            {formatLatestActivity(cadence.latestActivity)}
          </p>
        </div>
        <button
          type="button"
          onClick={onStartInvestigation}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          New Investigation
        </button>
      </div>

      <ProcessHubCurrentStatePanel
        state={currentState}
        actions={{
          actionFor,
          onInvoke: (item, action) => onResponsePathAction(item, action, rollup.hub.id),
        }}
        evidence={{ findingsFor: () => [], onChipClick: () => {} }}
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        <SnapshotCard
          label="Active"
          value={cadence.snapshot.active}
          testId="cadence-snapshot-active"
        />
        <SnapshotCard
          label="Readiness"
          value={cadence.snapshot.readiness}
          testId="cadence-snapshot-readiness"
        />
        <SnapshotCard
          label="Verification"
          value={cadence.snapshot.verification}
          testId="cadence-snapshot-verification"
        />
        <SnapshotCard
          label="Overdue Actions"
          value={cadence.snapshot.overdueActions}
          testId="cadence-snapshot-overdue-actions"
          tone={cadence.snapshot.overdueActions > 0 ? 'amber' : 'default'}
        />
        <SnapshotCard
          label="Sustainment"
          value={cadence.snapshot.sustainment}
          testId="cadence-snapshot-sustainment"
          tone={cadence.snapshot.sustainment > 0 ? 'green' : 'default'}
        />
      </div>

      <ProcessHubCadenceQuestions rollup={rollup} />
      <ProcessHubCadenceQueues
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={onOpenInvestigation}
        onSetupSustainment={onSetupSustainment}
        onLogReview={onLogReview}
        onRecordHandoff={onRecordHandoff}
      />
    </section>
  );
};

export default ProcessHubReviewPanel;
