import React from 'react';
import {
  ArrowRight,
  CircleAlert,
  ClipboardCheck,
  Layers3,
  Plus,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import { buildProcessHubCadence } from '@variscout/core';
import type {
  InvestigationDepth,
  InvestigationStatus,
  ProcessHubCadenceQueue,
  EvidenceLatestSignal,
  ProcessHubInvestigation,
  ProcessHubReadinessReason,
  ProcessHubReviewItem,
  ProcessHubRollup,
} from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

interface ProcessHubReviewPanelProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onStartInvestigation: () => void;
}

const formatMetric = (value: number): string => formatStatistic(value, 'en', 2);

const formatChangeSignals = (count: number): string =>
  `${count} change signal${count === 1 ? '' : 's'}`;

const formatOverdueActions = (count: number): string =>
  `${count} overdue action${count === 1 ? '' : 's'}`;

const formatLatestActivity = (value: string | null): string => {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Activity date unknown';
  return `Latest activity ${date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

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

const formatStatus = (status?: InvestigationStatus): string =>
  (status ?? 'scouting').replace(/-/g, ' ');

const formatTopFocus = (item: ProcessHubReviewItem): string | null => {
  const topFocus = item.investigation.metadata?.reviewSignal?.topFocus;
  if (!topFocus) return null;
  return topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`;
};

const formatHubTopFocus = (rollup: ProcessHubRollup<ProcessHubInvestigation>): string | null => {
  const topFocus = rollup.reviewSignal?.topFocus;
  if (!topFocus) return null;
  return topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`;
};

const formatCapability = (item: ProcessHubReviewItem): string | null => {
  const capability = item.investigation.metadata?.reviewSignal?.capability;
  if (capability?.cpk === undefined || capability.cpkTarget === undefined) return null;
  return `Cpk ${formatMetric(capability.cpk)} vs target ${formatMetric(capability.cpkTarget)}`;
};

const formatHubCapability = (rollup: ProcessHubRollup<ProcessHubInvestigation>): string | null => {
  const capability = rollup.reviewSignal?.capability;
  if (capability?.cpk === undefined || capability.cpkTarget === undefined) return null;
  return `Cpk ${formatMetric(capability.cpk)} vs target ${formatMetric(capability.cpkTarget)}`;
};

const firstDefined = <T,>(values: Array<T | undefined>): T | undefined =>
  values.find(value => value !== undefined && value !== null);

const requirementSummary = (rollup: ProcessHubRollup<ProcessHubInvestigation>): string | null =>
  firstDefined(
    rollup.investigations.map(
      investigation =>
        investigation.metadata?.customerRequirementSummary ??
        investigation.metadata?.processMapSummary?.ctsColumn
    )
  ) ?? null;

const processQuestionAnswers = (
  rollup: ProcessHubRollup<ProcessHubInvestigation>
): { requirement: string; change: string; focus: string } => {
  const requirement = requirementSummary(rollup);
  const capability = formatHubCapability(rollup);
  const topFocus = formatHubTopFocus(rollup);
  const latestChangeSignalCount = rollup.reviewSignal?.changeSignals.total ?? 0;

  return {
    requirement: requirement ?? capability ?? 'No requirement signal yet',
    change:
      latestChangeSignalCount > 0
        ? `Latest evidence has ${formatChangeSignals(latestChangeSignalCount)}.`
        : 'No change signal yet',
    focus:
      (topFocus && `Focus on ${topFocus}.`) ??
      (rollup.problemConditionSummary && `Focus on ${rollup.problemConditionSummary}.`) ??
      (rollup.nextMove && `Next move: ${rollup.nextMove}`) ??
      'No focus signal yet',
  };
};

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

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-content">
    {icon}
    <h4>{title}</h4>
  </div>
);

const QuestionBand: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="rounded-md border border-edge bg-surface px-3 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
      {question}
    </p>
    <p className="mt-2 text-sm font-medium text-content">{answer}</p>
  </div>
);

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

const MoreCount: React.FC<{ hiddenCount: number }> = ({ hiddenCount }) =>
  hiddenCount > 0 ? (
    <p className="pt-1 text-xs font-medium text-content-secondary">+{hiddenCount} more</p>
  ) : null;

const EVIDENCE_SIGNAL_CLASS: Record<EvidenceLatestSignal['severity'], string> = {
  green: 'border-emerald-500/30 text-emerald-400',
  amber: 'border-amber-500/30 text-amber-400',
  red: 'border-rose-500/30 text-rose-400',
  neutral: 'border-edge text-content-secondary',
};

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

const ProcessHubReviewPanel: React.FC<ProcessHubReviewPanelProps> = ({
  rollup,
  onOpenInvestigation,
  onStartInvestigation,
}) => {
  const cadence = buildProcessHubCadence(rollup);
  const questionAnswers = processQuestionAnswers(rollup);
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
  const headingId = `process-hub-review-${rollup.hub.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={headingId} className="text-lg font-semibold text-content">
            {rollup.hub.name} Cadence Review
          </h3>
          <p className="mt-1 text-sm font-medium text-content-secondary">Cadence Review Board</p>
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

      <div className="mt-4">
        <SectionHeader title="Cadence Questions" icon={<ClipboardCheck size={16} />} />
        <div className="grid gap-2 lg:grid-cols-3">
          <QuestionBand
            question="Are we meeting the requirement?"
            answer={questionAnswers.requirement}
          />
          <QuestionBand question="What changed?" answer={questionAnswers.change} />
          <QuestionBand question="Where should we focus?" answer={questionAnswers.focus} />
        </div>
      </div>

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
                        <p className="text-sm font-medium text-content">
                          {item.investigation.name}
                        </p>
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

              <QueueSection title="Sustainment" queue={cadence.sustainment}>
                {item => (
                  <ReviewItemButton
                    key={item.investigation.id}
                    item={item}
                    onOpenInvestigation={onOpenInvestigation}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-content">
                      <ShieldCheck size={14} className="text-green-400" />
                      <span>{item.investigation.name}</span>
                    </div>
                    {item.nextMove && (
                      <p className="mt-1 text-xs text-content-secondary">{item.nextMove}</p>
                    )}
                  </ReviewItemButton>
                )}
              </QueueSection>
            </div>
          ) : hasActiveReviewItems ? null : (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              No weekly review items yet
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProcessHubReviewPanel;
