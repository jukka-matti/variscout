import React from 'react';
import { Plus } from 'lucide-react';
import {
  buildCurrentProcessState,
  buildProcessHubCadence,
  deriveResponsePathAction,
} from '@variscout/core';
import type {
  Finding,
  ProcessHubAnalyze,
  ProcessHubRollup,
  ProcessStateItem,
  ProcessStateNote,
  ResponsePathAction,
} from '@variscout/core';
import { InboxDigest, ProcessHubCurrentStatePanel, type InboxDigestPrompt } from '@variscout/ui';
import { surveyInboxRules } from '@variscout/core/survey';
import ProcessHubCadenceQuestions from './ProcessHubCadenceQuestions';
import ProcessHubCadenceQueues from './ProcessHubCadenceQueues';
import { formatLatestActivity } from './ProcessHubFormat';

interface ProcessHubReviewPanelProps {
  rollup: ProcessHubRollup<ProcessHubAnalyze>;
  onOpenInvestigation: (id: string) => void;
  onStartInvestigation: () => void;
  onSetupControl: (analyzeId: string) => void;
  onLogReview: (recordId: string) => void;
  onResponsePathAction: (item: ProcessStateItem, action: ResponsePathAction, hubId: string) => void;
  /** Notes wiring */
  onRequestAddNote: (item: ProcessStateItem, hubId: string) => void;
  onRequestEditNote: (item: ProcessStateItem, note: ProcessStateNote, hubId: string) => void;
  onDeleteNote: (item: ProcessStateItem, noteId: string, hubId: string) => void;
  currentUserId: string;
  /** Evidence wiring (PR #2) — async finding loader; Dashboard owns sheet state. */
  loadFindingsForItem: (item: ProcessStateItem, hubId: string) => Promise<readonly Finding[]>;
  /** count is threaded through so Dashboard can include it in chip-click telemetry. */
  onChipClick: (item: ProcessStateItem, hubId: string, count: number) => void;
  onFindingSelect: (item: ProcessStateItem, finding: Finding, hubId: string) => void;
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
  onSetupControl,
  onLogReview,
  onResponsePathAction,
  onRequestAddNote,
  onRequestEditNote,
  onDeleteNote,
  currentUserId,
  loadFindingsForItem,
  onChipClick,
  onFindingSelect,
}) => {
  const cadence = buildProcessHubCadence(rollup);
  const currentState = buildCurrentProcessState(rollup, cadence);
  const inboxPrompts = React.useMemo(
    () =>
      surveyInboxRules({
        hub: rollup.hub,
        improvementProject: rollup.hub.improvementProject,
        controlRecords: rollup.controlRecords,
        controlReviews: rollup.hub.controlReviews ?? [],
        controlHandoffs: rollup.controlHandoffs,
        now: Date.now(),
      }),
    [
      rollup.hub.id,
      rollup.hub.improvementProject,
      rollup.hub.controlReviews,
      rollup.controlHandoffs,
      rollup.controlRecords,
    ]
  );

  // Pick the most-recently-modified analyze in this hub as the
  // default navigation target for hub-aggregate state items (capability-gap,
  // change-signals, top-focus). For per-analyze items, the action
  // uses item.analyzeIds[0] instead.
  const defaultAnalyzeId = React.useMemo(() => {
    const sorted = [...rollup.analyzes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    // Empty fallback when the rollup has no analyzes: deriveResponsePathAction
    // will then return unsupported actions for hub-aggregate items, which actionToHref
    // maps to null, producing a silent no-op (correct UX — nothing to navigate to).
    return sorted[0]?.id ?? '';
  }, [rollup.analyzes]);

  const actionFor = React.useCallback(
    (item: ProcessStateItem) => deriveResponsePathAction(item, defaultAnalyzeId),
    [defaultAnalyzeId]
  );

  const handleInboxNavigate = React.useCallback(
    (prompt: InboxDigestPrompt) => {
      const surface = prompt.action?.opensSurface;
      const targetId = prompt.action?.opensId;
      const targetProject =
        rollup.hub.improvementProject?.id === targetId ? rollup.hub.improvementProject : undefined;
      // 'sustainment' surface key kept intact — matches panelsStore.activeView workspace
      // identifier + survey/control.ts emitter values (see Group 5 cascade note). The Stage 4
      // workspace key was deliberately preserved across the renames.
      if (surface === 'sustainment' && targetId) {
        if (rollup.controlRecords.some(record => record.id === targetId)) {
          onLogReview(targetId);
          return;
        }
        if (targetProject?.metadata.investigationId) {
          onSetupControl(targetProject.metadata.investigationId);
          return;
        }
        onOpenInvestigation(targetId);
        return;
      }
      if (surface === 'improvement-projects' && targetId) {
        onOpenInvestigation(targetProject?.metadata.investigationId ?? targetId);
        return;
      }
      if (targetId) onOpenInvestigation(targetId);
    },
    [
      onLogReview,
      onOpenInvestigation,
      onSetupControl,
      rollup.hub.improvementProject,
      rollup.controlRecords,
    ]
  );

  // Resolver: given a state item, return the analyze IDs whose findings
  // should "back" it. Mirrors the spec's Investigation-ID resolver table.
  //
  // For per-analyze items (queue items), use item.analyzeIds[0..N].
  // For hub-aggregate items (capability-gap, change-signals, top-focus, etc.),
  // fall back to all analyzes in the hub.
  const analyzeIdResolver = React.useCallback(
    (item: ProcessStateItem): readonly string[] => {
      if (item.analyzeIds && item.analyzeIds.length > 0) {
        return item.analyzeIds;
      }
      return rollup.analyzes.map(inv => inv.id);
    },
    [rollup.analyzes]
  );

  // countFor: cheap derivation from rollup metadata (same arithmetic as the
  // PR #99 synthetic-Finding length, but returns the integer directly).
  const countFor = React.useCallback(
    (item: ProcessStateItem): number => {
      const analyzeIds = analyzeIdResolver(item);
      let total = 0;
      for (const invId of analyzeIds) {
        const inv = rollup.analyzes.find(i => i.id === invId);
        const counts = inv?.metadata?.findingCounts ?? {};
        total += (counts.analyzed ?? 0) + (counts.improving ?? 0) + (counts.resolved ?? 0);
      }
      return total;
    },
    [rollup.analyzes, analyzeIdResolver]
  );

  // Aggregate stateNotes from all linked analyzes for an item.
  // Per-analyze items use item.analyzeIds; aggregate items pull
  // from all hub analyzes.
  const notesFor = React.useCallback(
    (item: ProcessStateItem): readonly ProcessStateNote[] => {
      const analyzeIds =
        item.analyzeIds && item.analyzeIds.length > 0
          ? item.analyzeIds
          : rollup.analyzes.map(inv => inv.id);
      const all: ProcessStateNote[] = [];
      for (const invId of analyzeIds) {
        const inv = rollup.analyzes.find(i => i.id === invId);
        const notes = inv?.metadata?.stateNotes ?? [];
        for (const note of notes) {
          if (note.itemId === item.id) all.push(note);
        }
      }
      // Sort by createdAt asc so older notes appear first
      return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [rollup.analyzes]
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
          New Analyze
        </button>
      </div>

      <div className="mt-4">
        <InboxDigest prompts={inboxPrompts} onNavigate={handleInboxNavigate} />
      </div>

      <ProcessHubCurrentStatePanel
        state={currentState}
        actions={{
          actionFor,
          onInvoke: (item, action) => onResponsePathAction(item, action, rollup.hub.id),
        }}
        evidence={{
          countFor,
          loadFindingsFor: item => loadFindingsForItem(item, rollup.hub.id),
          onChipClick: item => onChipClick(item, rollup.hub.id, countFor(item)),
          onFindingSelect: (item, finding) => onFindingSelect(item, finding, rollup.hub.id),
        }}
        notes={{
          notesFor,
          onRequestAddNote: item => onRequestAddNote(item, rollup.hub.id),
          onRequestEditNote: (item, note) => onRequestEditNote(item, note, rollup.hub.id),
          onDeleteNote: (item, noteId) => onDeleteNote(item, noteId, rollup.hub.id),
          currentUserId,
        }}
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
          label="Control"
          value={cadence.snapshot.control}
          testId="cadence-snapshot-control"
          tone={cadence.snapshot.control > 0 ? 'green' : 'default'}
        />
      </div>

      <ProcessHubCadenceQuestions rollup={rollup} />
      <ProcessHubCadenceQueues
        cadence={cadence}
        rollup={rollup}
        onOpenInvestigation={onOpenInvestigation}
        onSetupControl={onSetupControl}
        onLogReview={onLogReview}
      />
    </section>
  );
};

export default ProcessHubReviewPanel;
