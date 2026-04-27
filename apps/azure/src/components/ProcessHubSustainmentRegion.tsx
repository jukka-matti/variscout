import React from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight, History } from 'lucide-react';
import {
  selectControlHandoffCandidates,
  selectSustainmentBuckets,
  type ProcessHubCadenceSummary,
  type ProcessHubInvestigation,
  type ProcessHubReviewItem,
  type ProcessHubRollup,
} from '@variscout/core';
import { formatSustainmentVerdict, formatSustainmentDue } from './ProcessHubFormat';

export interface ProcessHubSustainmentRegionProps {
  cadence: ProcessHubCadenceSummary<ProcessHubInvestigation>;
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
}

interface BucketSectionProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  items: ProcessHubReviewItem<ProcessHubInvestigation>[];
  onItemClick: (item: ProcessHubReviewItem<ProcessHubInvestigation>) => void;
  itemAriaLabel: (item: ProcessHubReviewItem<ProcessHubInvestigation>) => string;
  iconForItem: React.ReactNode;
  renderSubline?: (item: ProcessHubReviewItem<ProcessHubInvestigation>) => string;
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
          key={item.investigation.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
          aria-label={itemAriaLabel(item)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-content">
            {iconForItem}
            <span>{item.investigation.name}</span>
          </div>
          {renderSubline && (
            <p className="mt-1 text-xs text-content-secondary">{renderSubline(item)}</p>
          )}
        </button>
      ))}
    </div>
  </div>
);

const ProcessHubSustainmentRegion: React.FC<ProcessHubSustainmentRegionProps> = ({
  cadence: _cadence,
  rollup,
  onOpenInvestigation,
  onSetupSustainment,
  onLogReview,
  onRecordHandoff,
}) => {
  const renderDate = new Date();

  const buckets = selectSustainmentBuckets(
    rollup.investigations,
    rollup.sustainmentRecords,
    rollup.controlHandoffs,
    renderDate
  );

  const handoffCandidates = selectControlHandoffCandidates(
    rollup.investigations,
    rollup.controlHandoffs
  );

  const dueAndOverdueIds = new Set([
    ...buckets.dueNow.map(item => item.investigation.id),
    ...buckets.overdue.map(item => item.investigation.id),
  ]);
  const reviewedIds = new Set(buckets.recentlyReviewed.map(item => item.investigation.id));
  const handoffIds = new Set(handoffCandidates.map(item => item.investigation.id));

  const setupCandidates = rollup.investigations.filter(inv => {
    const status = inv.metadata?.investigationStatus;
    if (status !== 'resolved' && status !== 'controlled') return false;
    if (inv.metadata?.sustainment) return false;
    if (dueAndOverdueIds.has(inv.id)) return false;
    if (reviewedIds.has(inv.id)) return false;
    if (handoffIds.has(inv.id)) return false;
    return true;
  });

  const reviewSubline = (item: ProcessHubReviewItem<ProcessHubInvestigation>): string => {
    const verdict = item.investigation.metadata?.sustainment?.latestVerdict;
    const nextReviewDue = item.investigation.metadata?.sustainment?.nextReviewDue;
    return [
      verdict ? formatSustainmentVerdict(verdict) : null,
      formatSustainmentDue(nextReviewDue, renderDate),
    ]
      .filter(Boolean)
      .join(' · ');
  };

  const handleReviewClick = (item: ProcessHubReviewItem<ProcessHubInvestigation>) => {
    const recordId = item.investigation.metadata?.sustainment?.recordId;
    if (recordId) {
      onLogReview(recordId);
    } else {
      onOpenInvestigation(item.investigation.id);
    }
  };

  const totalSustainmentItems =
    buckets.dueNow.length +
    buckets.overdue.length +
    buckets.recentlyReviewed.length +
    handoffCandidates.length;

  return (
    <section className="space-y-3" data-testid="sustainment-region" aria-label="Sustainment region">
      {buckets.overdue.length > 0 && (
        <BucketSection
          label="Overdue"
          count={buckets.overdue.length}
          icon={<ShieldAlert size={14} className="text-red-400" />}
          items={buckets.overdue}
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Log overdue sustainment review for ${item.investigation.name}`}
          iconForItem={<ShieldAlert size={14} className="text-red-400" />}
          renderSubline={reviewSubline}
          testId="sustainment-overdue"
        />
      )}

      {buckets.dueNow.length > 0 && (
        <BucketSection
          label="Sustainment due"
          count={buckets.dueNow.length}
          icon={<ShieldCheck size={14} className="text-amber-400" />}
          items={buckets.dueNow}
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Log sustainment review for ${item.investigation.name}`}
          iconForItem={<ShieldCheck size={14} className="text-amber-400" />}
          renderSubline={reviewSubline}
          testId="sustainment-due"
        />
      )}

      {buckets.recentlyReviewed.length > 0 && (
        <BucketSection
          label="Recently reviewed"
          count={buckets.recentlyReviewed.length}
          icon={<History size={14} className="text-green-400" />}
          items={buckets.recentlyReviewed}
          onItemClick={handleReviewClick}
          itemAriaLabel={item => `Open recently reviewed investigation ${item.investigation.name}`}
          iconForItem={<ShieldCheck size={14} className="text-green-400" />}
          renderSubline={reviewSubline}
          testId="sustainment-recently-reviewed"
        />
      )}

      {handoffCandidates.length > 0 && (
        <BucketSection
          label="Control handoff"
          count={handoffCandidates.length}
          icon={<ArrowRight size={14} className="text-content-secondary" />}
          items={handoffCandidates}
          onItemClick={item => onRecordHandoff(item.investigation.id)}
          itemAriaLabel={item => `Record control handoff for ${item.investigation.name}`}
          iconForItem={<ArrowRight size={14} className="text-content-secondary" />}
          renderSubline={() => 'Needs control handoff'}
          testId="sustainment-handoff"
        />
      )}

      {setupCandidates.length > 0 ? (
        <div data-testid="sustainment-setup">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-content-muted" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Set up sustainment
              </p>
            </div>
            <span className="text-xs text-content-muted">{setupCandidates.length}</span>
          </div>
          <div className="space-y-2">
            {setupCandidates.map(inv => (
              <button
                key={inv.id}
                type="button"
                onClick={() => onSetupSustainment(inv.id)}
                className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
                aria-label={`Set up sustainment cadence for ${inv.name}`}
              >
                <p className="text-sm font-medium text-content">{inv.name}</p>
                <p className="mt-1 text-xs text-content-secondary">Set up sustainment cadence</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        totalSustainmentItems === 0 && (
          <p className="text-sm text-content-secondary">
            No sustainment items yet — investigations move here once resolved or controlled.
          </p>
        )
      )}
    </section>
  );
};

export default ProcessHubSustainmentRegion;
