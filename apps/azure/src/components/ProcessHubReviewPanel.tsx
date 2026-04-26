import React from 'react';
import { ArrowRight, CircleAlert, ClipboardCheck, Plus, Radar } from 'lucide-react';
import { buildProcessHubReview } from '@variscout/core';
import type {
  ProcessHubInvestigation,
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

const formatTopFocus = (item: ProcessHubReviewItem): string | null => {
  const topFocus = item.investigation.metadata?.reviewSignal?.topFocus;
  if (!topFocus) return null;
  return topFocus.value === undefined ? topFocus.factor : `${topFocus.factor} / ${topFocus.value}`;
};

const formatCapability = (item: ProcessHubReviewItem): string | null => {
  const capability = item.investigation.metadata?.reviewSignal?.capability;
  if (capability?.cpk === undefined || capability.cpkTarget === undefined) return null;
  return `Cpk ${formatMetric(capability.cpk)} vs target ${formatMetric(capability.cpkTarget)}`;
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

const ProcessHubReviewPanel: React.FC<ProcessHubReviewPanelProps> = ({
  rollup,
  onOpenInvestigation,
  onStartInvestigation,
}) => {
  const review = buildProcessHubReview(rollup);
  const hasActiveReviewItems =
    review.verificationQueue.length > 0 ||
    review.overdueActionQueue.length > 0 ||
    review.nextMoveQueue.length > 0;
  const headingId = `process-hub-review-${rollup.hub.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={headingId} className="text-lg font-semibold text-content">
            {rollup.hub.name} Review
          </h3>
          <p className="mt-1 text-xs text-content-secondary">
            {review.activeInvestigationCount} active investigation
            {review.activeInvestigationCount === 1 ? '' : 's'}
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeader title="Latest Signals" icon={<Radar size={16} />} />
          {review.whereToFocus.length === 0 ? (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              No latest signals yet
            </p>
          ) : (
            <div className="space-y-2">
              {review.whereToFocus.slice(0, 3).map(item => {
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
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="Where to Focus" icon={<ClipboardCheck size={16} />} />
          {hasActiveReviewItems ? (
            <div className="space-y-3">
              {review.verificationQueue.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-content-secondary">
                    Verification
                  </p>
                  <div className="space-y-2">
                    {review.verificationQueue.map(item => (
                      <ReviewItemButton
                        key={item.investigation.id}
                        item={item}
                        onOpenInvestigation={onOpenInvestigation}
                      >
                        <p className="text-sm font-medium text-content">
                          {item.investigation.name}
                        </p>
                        {item.nextMove && (
                          <p className="mt-1 text-xs text-content-secondary">{item.nextMove}</p>
                        )}
                      </ReviewItemButton>
                    ))}
                  </div>
                </div>
              )}

              {review.overdueActionQueue.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-content-secondary">
                    Actions
                  </p>
                  <div className="space-y-2">
                    {review.overdueActionQueue.map(item => (
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
                    ))}
                  </div>
                </div>
              )}

              {review.nextMoveQueue.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-content-secondary">
                    Next Moves
                  </p>
                  <div className="space-y-2">
                    {review.nextMoveQueue.map(item => (
                      <ReviewItemButton
                        key={item.investigation.id}
                        item={item}
                        onOpenInvestigation={onOpenInvestigation}
                      >
                        <p className="text-sm font-medium text-content">
                          {item.investigation.name}
                        </p>
                        {item.nextMove && (
                          <p className="mt-1 text-xs text-content-secondary">{item.nextMove}</p>
                        )}
                      </ReviewItemButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              No active review items yet
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProcessHubReviewPanel;
