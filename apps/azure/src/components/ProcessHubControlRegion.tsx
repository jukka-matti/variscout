import React from 'react';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import { ControlVerificationBand } from '@variscout/ui';
import {
  isControlEligible,
  isControlled,
  isCheckSuggested,
  type ControlRecord,
  type ControlReview,
  type ControlHandoff,
  type DataRow,
  type SpecLimits,
} from '@variscout/core';
import { useSustainmentComparison } from '@variscout/hooks';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { formatSustainmentVerdict, formatSustainmentDue } from './controlFormat';

export interface ProcessHubControlRegionProps {
  /**
   * The single active project for this workspace. Pass `null` / `undefined`
   * when no project is loaded (region renders the empty-state line).
   */
  project: ImprovementProject | null | undefined;
  records: ControlRecord[];
  reviews?: ControlReview[];
  handoffs: ControlHandoff[];
  rawData?: DataRow[];
  timeColumn?: string | null;
  specs?: SpecLimits;
  /** Injectable "now" for deterministic tests. Defaults to the render time. */
  renderDate?: Date;
  onOpenProject: (projectId: string) => void;
  onSetupControl: (projectId: string) => void;
  onLogReview: (recordId: string) => void;
}

/** Find the first non-tombstoned ControlRecord for a given project id. */
function liveRecordForProject(
  projectId: string,
  records: ControlRecord[]
): ControlRecord | undefined {
  return records.find(r => r.improvementProjectId === projectId && r.deletedAt === null);
}

const ProcessHubControlRegion: React.FC<ProcessHubControlRegionProps> = ({
  project,
  records,
  reviews = [],
  handoffs,
  rawData = [],
  timeColumn,
  specs,
  renderDate,
  onOpenProject,
  onSetupControl,
  onLogReview,
}) => {
  const now = renderDate ?? new Date();
  const record = project ? liveRecordForProject(project.id, records) : undefined;
  const recordReviews = record
    ? reviews.filter(review => review.recordId === record.id && review.deletedAt === null)
    : [];
  const comparison = useSustainmentComparison({
    rows: rawData,
    timeColumn,
    specs,
    record,
  });

  if (!project) {
    return (
      <section className="space-y-3" data-testid="control-region" aria-label="Control region">
        <p className="text-sm text-content-secondary">
          No control items yet — projects move here once they reach the Control stage.
        </p>
      </section>
    );
  }

  const eligible = isControlEligible(project, records, handoffs);
  const controlled = isControlled(project, records);

  // Determine single-project status.
  let status: 'suggested' | 'recently-reviewed' | 'needs-setup' | 'empty' = 'empty';

  if (eligible) {
    if (record) {
      if (isCheckSuggested(record, now)) {
        status = 'suggested';
      } else if (record.latestReviewAt) {
        const recentCutoffMs = now.getTime() - 14 * 24 * 60 * 60 * 1000;
        const reviewedMs = new Date(record.latestReviewAt).getTime();
        if (Number.isFinite(reviewedMs) && reviewedMs >= recentCutoffMs) {
          status = 'recently-reviewed';
        }
      }
    } else if (!controlled) {
      // Eligible but no live record → show setup prompt.
      status = 'needs-setup';
    }
  }

  const subline =
    record && status !== 'needs-setup'
      ? [
          record.status === 'drifted' ? formatSustainmentVerdict('drifted') : null,
          formatSustainmentDue(record.nextCheckSuggestedAt, now),
        ]
          .filter(Boolean)
          .join(' · ')
      : undefined;

  return (
    <section className="space-y-3" data-testid="control-region" aria-label="Control region">
      {status === 'suggested' && record && (
        <div data-testid="control-suggested">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Re-check suggested
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLogReview(record.id)}
            className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
            aria-label={`Log control re-check for ${project.metadata.title}`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-content">
              <ShieldAlert size={14} className="text-amber-400" />
              <span>{project.metadata.title}</span>
            </div>
            {subline && <p className="mt-1 text-xs text-content-secondary">{subline}</p>}
          </button>
          <div className="mt-3">
            <ControlVerificationBand
              record={record}
              comparison={comparison}
              reviews={recordReviews}
              rawData={rawData}
              timeColumn={timeColumn}
              specs={specs}
              onLogReview={onLogReview}
            />
          </div>
        </div>
      )}

      {status === 'recently-reviewed' && record && (
        <div data-testid="control-recently-reviewed">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <History size={14} className="text-green-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Recently reviewed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
            aria-label={`Open recently reviewed project ${project.metadata.title}`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-content">
              <ShieldCheck size={14} className="text-green-400" />
              <span>{project.metadata.title}</span>
            </div>
            {subline && <p className="mt-1 text-xs text-content-secondary">{subline}</p>}
          </button>
          <div className="mt-3">
            <ControlVerificationBand
              record={record}
              comparison={comparison}
              reviews={recordReviews}
              rawData={rawData}
              timeColumn={timeColumn}
              specs={specs}
              onLogReview={onLogReview}
            />
          </div>
        </div>
      )}

      {status === 'needs-setup' && (
        <div data-testid="control-setup">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-content-muted" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Set up control
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSetupControl(project.id)}
            className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
            aria-label={`Set up control cadence for ${project.metadata.title}`}
          >
            <p className="text-sm font-medium text-content">{project.metadata.title}</p>
            <p className="mt-1 text-xs text-content-secondary">Set up control cadence</p>
          </button>
        </div>
      )}

      {status === 'empty' && (
        <p className="text-sm text-content-secondary">
          No control items yet — projects move here once they reach the Control stage.
        </p>
      )}
    </section>
  );
};

export default ProcessHubControlRegion;
