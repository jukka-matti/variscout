import React from 'react';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import {
  selectControlBuckets,
  type ProcessHubCadenceSummary,
  type ProcessHubAnalyze,
  type ProcessHubReviewItem,
  type ProcessHubRollup,
} from '@variscout/core';
import { formatSustainmentVerdict, formatSustainmentDue } from './ProcessHubFormat';

export interface ProcessHubControlRegionProps {
  cadence: ProcessHubCadenceSummary<ProcessHubAnalyze>;
  rollup: ProcessHubRollup<ProcessHubAnalyze>;
  onOpenInvestigation: (id: string) => void;
  onSetupControl: (analyzeId: string) => void;
  onLogReview: (recordId: string) => void;
}

interface BucketSectionProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  items: ProcessHubReviewItem<ProcessHubAnalyze>[];
  onItemClick: (item: ProcessHubReviewItem<ProcessHubAnalyze>) => void;
  itemAriaLabel: (item: ProcessHubReviewItem<ProcessHubAnalyze>) => string;
  iconForItem: React.ReactNode;
  renderSubline?: (item: ProcessHubReviewItem<ProcessHubAnalyze>) => string;
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
          key={item.analyze.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
          aria-label={itemAriaLabel(item)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-content">
            {iconForItem}
            <span>{item.analyze.name}</span>
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
  cadence: _cadence,
  rollup,
  onOpenInvestigation,
  onSetupControl,
  onLogReview,
}) => {
  const renderDate = new Date();

  const buckets = selectControlBuckets(
    rollup.analyzes,
    rollup.controlRecords,
    rollup.controlHandoffs,
    renderDate
  );

  const dueAndOverdueIds = new Set([
    ...buckets.dueNow.map(item => item.analyze.id),
    ...buckets.overdue.map(item => item.analyze.id),
  ]);
  const reviewedIds = new Set(buckets.recentlyReviewed.map(item => item.analyze.id));

  const setupCandidates = rollup.analyzes.filter(inv => {
    const status = inv.metadata?.analyzeStatus;
    if (status !== 'resolved' && status !== 'controlled') return false;
    if (inv.metadata?.sustainment) return false;
    if (dueAndOverdueIds.has(inv.id)) return false;
    if (reviewedIds.has(inv.id)) return false;
    return true;
  });

  const reviewSubline = (item: ProcessHubReviewItem<ProcessHubAnalyze>): string => {
    const verdict = item.analyze.metadata?.sustainment?.latestVerdict;
    const nextReviewDue = item.analyze.metadata?.sustainment?.nextReviewDue;
    return [
      verdict ? formatSustainmentVerdict(verdict) : null,
      formatSustainmentDue(nextReviewDue, renderDate),
    ]
      .filter(Boolean)
      .join(' · ');
  };

  const handleReviewClick = (item: ProcessHubReviewItem<ProcessHubAnalyze>) => {
    const recordId = item.analyze.metadata?.sustainment?.recordId;
    if (recordId) {
      onLogReview(recordId);
    } else {
      onOpenInvestigation(item.analyze.id);
    }
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
          itemAriaLabel={item => `Log overdue control review for ${item.analyze.name}`}
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
          itemAriaLabel={item => `Log control review for ${item.analyze.name}`}
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
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Open recently reviewed analyze ${item.analyze.name}`}
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
            {setupCandidates.map(inv => (
              <button
                key={inv.id}
                type="button"
                onClick={() => onSetupControl(inv.id)}
                className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
                aria-label={`Set up control cadence for ${inv.name}`}
              >
                <p className="text-sm font-medium text-content">{inv.name}</p>
                <p className="mt-1 text-xs text-content-secondary">Set up control cadence</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        totalSustainmentItems === 0 && (
          <p className="text-sm text-content-secondary">
            No control items yet — analyzes move here once resolved or controlled.
          </p>
        )
      )}
    </section>
  );
};

export default ProcessHubControlRegion;
