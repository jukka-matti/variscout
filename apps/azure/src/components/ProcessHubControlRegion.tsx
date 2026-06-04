import React from 'react';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import {
  selectControlBuckets,
  isControlEligible,
  isControlled,
  type ControlReviewItem,
  type ControlRecord,
  type ControlHandoff,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { formatSustainmentVerdict, formatSustainmentDue } from './ProcessHubFormat';

export interface ProcessHubControlRegionProps {
  /**
   * Projects in scope for the control queue. On the Project tab this is the
   * single active project (`[activeProject]`); the buckets degrade gracefully
   * to the single-project case.
   */
  projects: ImprovementProject[];
  records: ControlRecord[];
  handoffs: ControlHandoff[];
  /** Injectable "now" for deterministic tests. Defaults to the render time. */
  renderDate?: Date;
  onOpenProject: (projectId: string) => void;
  onSetupControl: (projectId: string) => void;
  onLogReview: (recordId: string) => void;
}

interface BucketSectionProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  items: ControlReviewItem[];
  onItemClick: (item: ControlReviewItem) => void;
  itemAriaLabel: (item: ControlReviewItem) => string;
  iconForItem: React.ReactNode;
  renderSubline?: (item: ControlReviewItem) => string;
  testId: string;
}

const BucketSection: React.FC<BucketSectionProps> = ({
  label,
  count,
  icon,
  items,
  onItemClick,
  itemAriaLabel,
  iconForItem,
  renderSubline,
  testId,
}) => (
  <div data-testid={testId}>
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
          {label}
        </p>
      </div>
      <span className="text-xs text-content-muted">{count}</span>
    </div>
    <div className="space-y-2">
      {items.map(item => (
        <button
          key={item.project.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
          aria-label={itemAriaLabel(item)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-content">
            {iconForItem}
            <span>{item.project.metadata.title}</span>
          </div>
          {renderSubline && (
            <p className="mt-1 text-xs text-content-secondary">{renderSubline(item)}</p>
          )}
        </button>
      ))}
    </div>
  </div>
);

const ProcessHubControlRegion: React.FC<ProcessHubControlRegionProps> = ({
  projects,
  records,
  handoffs,
  renderDate,
  onOpenProject,
  onSetupControl,
  onLogReview,
}) => {
  const now = renderDate ?? new Date();

  const buckets = selectControlBuckets(projects, records, handoffs, now);

  // Setup candidates read FACTS, not the analyzeStatus label (PR-PO-2): a
  // project is control-eligible (closed lifecycle OR a live control artifact)
  // but not yet controlled (no live ControlRecord). Projects already surfaced
  // in a due/overdue/recently-reviewed bucket are not re-listed here.
  const bucketedProjectIds = new Set([
    ...buckets.dueNow.map(item => item.project.id),
    ...buckets.overdue.map(item => item.project.id),
    ...buckets.recentlyReviewed.map(item => item.project.id),
  ]);

  const setupCandidates = projects.filter(project => {
    if (!isControlEligible(project, records, handoffs)) return false;
    if (isControlled(project, records)) return false;
    if (bucketedProjectIds.has(project.id)) return false;
    return true;
  });

  const reviewSubline = (item: ControlReviewItem): string => {
    const verdict = item.record.latestVerdict;
    const nextReviewDue = item.record.nextReviewDue;
    return [
      verdict ? formatSustainmentVerdict(verdict) : null,
      formatSustainmentDue(nextReviewDue, now),
    ]
      .filter(Boolean)
      .join(' · ');
  };

  // Due/overdue → log a review against the record. Recently-reviewed → open the
  // project (nothing to log right now; mirrors the pre-PO-2 open-not-log intent).
  const handleReviewClick = (item: ControlReviewItem) => {
    onLogReview(item.record.id);
  };

  const handleOpenClick = (item: ControlReviewItem) => {
    onOpenProject(item.project.id);
  };

  const totalSustainmentItems =
    buckets.dueNow.length + buckets.overdue.length + buckets.recentlyReviewed.length;

  return (
    <section className="space-y-3" data-testid="control-region" aria-label="Control region">
      {buckets.overdue.length > 0 && (
        <BucketSection
          label="Overdue"
          count={buckets.overdue.length}
          icon={<ShieldAlert size={14} className="text-red-400" />}
          items={buckets.overdue}
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Log overdue control review for ${item.project.metadata.title}`}
          iconForItem={<ShieldAlert size={14} className="text-red-400" />}
          renderSubline={reviewSubline}
          testId="control-overdue"
        />
      )}

      {buckets.dueNow.length > 0 && (
        <BucketSection
          label="Control due"
          count={buckets.dueNow.length}
          icon={<ShieldCheck size={14} className="text-amber-400" />}
          items={buckets.dueNow}
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Log control review for ${item.project.metadata.title}`}
          iconForItem={<ShieldCheck size={14} className="text-amber-400" />}
          renderSubline={reviewSubline}
          testId="control-due"
        />
      )}

      {buckets.recentlyReviewed.length > 0 && (
        <BucketSection
          label="Recently reviewed"
          count={buckets.recentlyReviewed.length}
          icon={<History size={14} className="text-green-400" />}
          items={buckets.recentlyReviewed}
          onItemClick={handleOpenClick}
          itemAriaLabel={item => `Open recently reviewed project ${item.project.metadata.title}`}
          iconForItem={<ShieldCheck size={14} className="text-green-400" />}
          renderSubline={reviewSubline}
          testId="control-recently-reviewed"
        />
      )}

      {setupCandidates.length > 0 ? (
        <div data-testid="control-setup">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-content-muted" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Set up control
              </p>
            </div>
            <span className="text-xs text-content-muted">{setupCandidates.length}</span>
          </div>
          <div className="space-y-2">
            {setupCandidates.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSetupControl(project.id)}
                className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
                aria-label={`Set up control cadence for ${project.metadata.title}`}
              >
                <p className="text-sm font-medium text-content">{project.metadata.title}</p>
                <p className="mt-1 text-xs text-content-secondary">Set up control cadence</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        totalSustainmentItems === 0 && (
          <p className="text-sm text-content-secondary">
            No control items yet — projects move here once they reach the Control stage.
          </p>
        )
      )}
    </section>
  );
};

export default ProcessHubControlRegion;
