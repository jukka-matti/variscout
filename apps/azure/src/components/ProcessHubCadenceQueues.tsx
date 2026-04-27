import React from 'react';
import { ArrowRight, CircleAlert, ClipboardCheck, Layers3, Radar } from 'lucide-react';
import type {
  EvidenceLatestSignal,
  InvestigationDepth,
  ProcessHubCadenceQueue,
  ProcessHubCadenceSummary,
  ProcessHubInvestigation,
  ProcessHubReadinessReason,
  ProcessHubReviewItem,
  ProcessHubRollup,
} from '@variscout/core';
import {
  formatCapability,
  formatChangeSignals,
  formatMetric,
  formatOverdueActions,
  formatStatus,
  formatTopFocus,
} from './ProcessHubFormat';
import ProcessHubSustainmentRegion from './ProcessHubSustainmentRegion';

interface ProcessHubCadenceQueuesProps {
  cadence: ProcessHubCadenceSummary<ProcessHubInvestigation>;
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
}

const DEPTH_SECTIONS: Array<{ depth: InvestigationDepth; label: string }> = [
  { depth: 'quick', label: 'Quick' },
  { depth: 'focused', label: 'Focused' },
  { depth: 'chartered', label: 'Chartered' },
];

const READINESS_REASON_LABELS: Record<ProcessHubReadinessReason, string> = {
  'missing-metadata': 'Refresh saved metadata',
  'missing-process-hub': 'Assign process hub',
  'missing-process-context': 'Complete process context',
  'missing-customer-requirement': 'Clarify customer requirement',
  'survey-gap': 'Survey needs input',
  'verification-gap': 'Plan verification',
  'sustainment-candidate': 'Review sustainment',
};

const EVIDENCE_SIGNAL_CLASS: Record<EvidenceLatestSignal['severity'], string> = {
  green: 'border-emerald-500/30 text-emerald-400',
  amber: 'border-amber-500/30 text-amber-400',
  red: 'border-rose-500/30 text-rose-400',
  neutral: 'border-edge text-content-secondary',
};

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-content">
    {icon}
    <h4>{title}</h4>
  </div>
);

const ReviewItemButton: React.FC<{
  item: ProcessHubReviewItem;
  children: React.ReactNode;
  onOpenInvestigation: (id: string) => void;
}> = ({ item, children, onOpenInvestigation }) => (
  <button
    type="button"
    onClick={() => onOpenInvestigation(item.investigation.id)}
    className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
    aria-label={`Open review item ${item.investigation.name}`}
  >
    {children}
  </button>
);

const MoreCount: React.FC<{ hiddenCount: number }> = ({ hiddenCount }) =>
  hiddenCount > 0 ? (
    <p className="pt-1 text-xs font-medium text-content-secondary">+{hiddenCount} more</p>
  ) : null;

const QueueSection: React.FC<{
  title: string;
  queue: ProcessHubCadenceQueue;
  children: (item: ProcessHubReviewItem) => React.ReactNode;
}> = ({ title, queue, children }) =>
  queue.totalCount > 0 ? (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
          {title}
        </p>
        <span className="text-xs text-content-muted">{queue.totalCount}</span>
      </div>
      <div className="space-y-2">
        {queue.items.map(item => children(item))}
        <MoreCount hiddenCount={queue.hiddenCount} />
      </div>
    </div>
  ) : null;

const EvidenceSignalCard: React.FC<{ signal: EvidenceLatestSignal }> = ({ signal }) => (
  <div
    className={`rounded-md border bg-surface px-3 py-2 ${EVIDENCE_SIGNAL_CLASS[signal.severity]}`}
    data-testid="evidence-snapshot-signal"
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-content">{signal.label}</p>
      <span className="text-sm font-semibold">{formatMetric(signal.value)}</span>
    </div>
    <p className="mt-1 text-xs text-content-secondary">
      Snapshot{' '}
      {new Date(signal.capturedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
    </p>
  </div>
);

const ProcessHubCadenceQueues: React.FC<ProcessHubCadenceQueuesProps> = ({
  cadence,
  rollup,
  onOpenInvestigation,
  onSetupSustainment,
  onLogReview,
  onRecordHandoff,
}) => {
  const hasActiveWork = DEPTH_SECTIONS.some(
    ({ depth }) => cadence.activeWork[depth].totalCount > 0
  );
  const hasActiveReviewItems =
    cadence.readiness.totalCount > 0 ||
    cadence.verification.totalCount > 0 ||
    cadence.actions.totalCount > 0 ||
    cadence.nextMoves.totalCount > 0 ||
    cadence.sustainment.totalCount > 0;
  const hasDailyDecisionItems =
    cadence.verification.totalCount > 0 ||
    cadence.actions.totalCount > 0 ||
    cadence.nextMoves.totalCount > 0;
  const hasWeeklyDecisionItems =
    cadence.readiness.totalCount > 0 || cadence.sustainment.totalCount > 0;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
          Daily huddle
        </p>
        <SectionHeader title="Latest Signals" icon={<Radar size={16} />} />
        {cadence.latestSignals.totalCount === 0 ? (
          <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
            No latest signals yet
          </p>
        ) : (
          <div className="space-y-2">
            {cadence.latestSignals.items.map(item => {
              const topFocus = formatTopFocus(item);
              const capability = formatCapability(item);

              return (
                <ReviewItemButton
                  key={item.investigation.id}
                  item={item}
                  onOpenInvestigation={onOpenInvestigation}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-content">{item.investigation.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-content-secondary">
                        {topFocus && <span>{topFocus}</span>}
                        {item.changeSignalCount > 0 && (
                          <span>{formatChangeSignals(item.changeSignalCount)}</span>
                        )}
                        {capability && <span>{capability}</span>}
                      </div>
                    </div>
                    <ArrowRight size={16} className="mt-0.5 shrink-0 text-content-muted" />
                  </div>
                </ReviewItemButton>
              );
            })}
            <MoreCount hiddenCount={cadence.latestSignals.hiddenCount} />
          </div>
        )}

        {cadence.latestEvidenceSignals.totalCount > 0 && (
          <div className="mt-4">
            <SectionHeader title="Evidence Snapshots" icon={<Radar size={16} />} />
            <div className="space-y-2">
              {cadence.latestEvidenceSignals.items.map(signal => (
                <EvidenceSignalCard key={signal.id} signal={signal} />
              ))}
              <MoreCount hiddenCount={cadence.latestEvidenceSignals.hiddenCount} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <SectionHeader title="Decision Queues" icon={<ClipboardCheck size={16} />} />
          <p className="mb-2 text-xs text-content-secondary">Where to Focus</p>
          {hasDailyDecisionItems ? (
            <div className="space-y-3">
              <QueueSection title="Verification" queue={cadence.verification}>
                {item => (
                  <ReviewItemButton
                    key={item.investigation.id}
                    item={item}
                    onOpenInvestigation={onOpenInvestigation}
                  >
                    <p className="text-sm font-medium text-content">{item.investigation.name}</p>
                    {item.nextMove && (
                      <p className="mt-1 text-xs text-content-secondary">{item.nextMove}</p>
                    )}
                  </ReviewItemButton>
                )}
              </QueueSection>

              <QueueSection title="Actions" queue={cadence.actions}>
                {item => (
                  <ReviewItemButton
                    key={item.investigation.id}
                    item={item}
                    onOpenInvestigation={onOpenInvestigation}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-content">
                      <CircleAlert size={14} className="text-amber-400" />
                      <span>{item.investigation.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-amber-400">
                      {formatOverdueActions(item.overdueActionCount)}
                    </p>
                  </ReviewItemButton>
                )}
              </QueueSection>

              <QueueSection title="Next Moves" queue={cadence.nextMoves}>
                {item => (
                  <ReviewItemButton
                    key={item.investigation.id}
                    item={item}
                    onOpenInvestigation={onOpenInvestigation}
                  >
                    <p className="text-sm font-medium text-content">{item.investigation.name}</p>
                    {item.nextMove && (
                      <p className="mt-1 text-xs text-content-secondary">{item.nextMove}</p>
                    )}
                  </ReviewItemButton>
                )}
              </QueueSection>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              No active review items yet
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
          Weekly process review
        </p>
        <SectionHeader title="Active Work" icon={<Layers3 size={16} />} />
        {hasActiveWork ? (
          <div className="grid gap-2">
            {DEPTH_SECTIONS.map(({ depth, label }) => {
              const queue = cadence.activeWork[depth];

              return (
                <div key={depth} className="rounded-md border border-edge bg-surface p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
                      {label}
                    </p>
                    <span className="text-xs text-content-muted">{queue.totalCount}</span>
                  </div>
                  {queue.totalCount > 0 ? (
                    <div className="space-y-2">
                      {queue.items.map(item => (
                        <ReviewItemButton
                          key={item.investigation.id}
                          item={item}
                          onOpenInvestigation={onOpenInvestigation}
                        >
                          <p className="text-sm font-medium text-content">
                            {item.investigation.name}
                          </p>
                          <p className="mt-1 text-xs text-content-secondary">
                            {formatStatus(item.investigation.metadata?.investigationStatus)}
                          </p>
                        </ReviewItemButton>
                      ))}
                      <MoreCount hiddenCount={queue.hiddenCount} />
                    </div>
                  ) : (
                    <p className="text-xs text-content-muted">
                      No active {label.toLowerCase()} work
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
            No active investigations yet
          </p>
        )}

        <div className="mt-4">
          <SectionHeader title="Weekly queues" icon={<ClipboardCheck size={16} />} />
        </div>
        {hasWeeklyDecisionItems ? (
          <div className="space-y-3">
            <QueueSection title="Readiness" queue={cadence.readiness}>
              {item => (
                <ReviewItemButton
                  key={item.investigation.id}
                  item={item}
                  onOpenInvestigation={onOpenInvestigation}
                >
                  <p className="text-sm font-medium text-content">{item.investigation.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.readinessReasons.map(reason => (
                      <span
                        key={reason}
                        className="rounded-sm border border-edge px-2 py-0.5 text-xs text-content-secondary"
                      >
                        {READINESS_REASON_LABELS[reason]}
                      </span>
                    ))}
                  </div>
                  {item.investigation.metadata?.surveyReadiness?.topRecommendations.map(
                    recommendation => (
                      <p key={recommendation} className="mt-1 text-xs text-content-secondary">
                        {recommendation}
                      </p>
                    )
                  )}
                </ReviewItemButton>
              )}
            </QueueSection>

            <ProcessHubSustainmentRegion
              cadence={cadence}
              rollup={rollup}
              onOpenInvestigation={onOpenInvestigation}
              onSetupSustainment={onSetupSustainment}
              onLogReview={onLogReview}
              onRecordHandoff={onRecordHandoff}
            />
          </div>
        ) : hasActiveReviewItems ? null : (
          <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
            No weekly review items yet
          </p>
        )}
      </div>
    </div>
  );
};

export default ProcessHubCadenceQueues;
