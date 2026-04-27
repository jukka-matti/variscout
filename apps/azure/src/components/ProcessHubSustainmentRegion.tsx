import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import {
  selectControlHandoffCandidates,
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

const ProcessHubSustainmentRegion: React.FC<ProcessHubSustainmentRegionProps> = ({
  cadence,
  rollup,
  onOpenInvestigation,
  onSetupSustainment,
  onLogReview,
  onRecordHandoff,
}) => {
  const handoffCandidates = selectControlHandoffCandidates(
    rollup.investigations,
    rollup.controlHandoffs
  );

  const sustainmentDueIds = new Set(
    cadence.sustainment.items.map((item: ProcessHubReviewItem) => item.investigation.id)
  );
  const handoffIds = new Set(handoffCandidates.map(item => item.investigation.id));

  const setupCandidates = rollup.investigations.filter(inv => {
    const status = inv.metadata?.investigationStatus;
    if (status !== 'resolved' && status !== 'controlled') return false;
    if (inv.metadata?.sustainment) return false;
    if (sustainmentDueIds.has(inv.id)) return false;
    if (handoffIds.has(inv.id)) return false;
    return true;
  });

  const renderDate = new Date();

  return (
    <section className="space-y-3" data-testid="sustainment-region" aria-label="Sustainment region">
      {cadence.sustainment.totalCount > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-green-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Sustainment due
              </p>
            </div>
            <span className="text-xs text-content-muted">{cadence.sustainment.totalCount}</span>
          </div>
          <div className="space-y-2">
            {cadence.sustainment.items.map((item: ProcessHubReviewItem) => {
              const recordId = item.investigation.metadata?.sustainment?.recordId;
              const verdict = item.investigation.metadata?.sustainment?.latestVerdict;
              const nextReviewDue = item.investigation.metadata?.sustainment?.nextReviewDue;
              return (
                <button
                  key={item.investigation.id}
                  type="button"
                  onClick={() =>
                    recordId ? onLogReview(recordId) : onOpenInvestigation(item.investigation.id)
                  }
                  className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
                  aria-label={`Log sustainment review for ${item.investigation.name}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-content">
                    <ShieldCheck size={14} className="text-green-400" />
                    <span>{item.investigation.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-content-secondary">
                    {verdict && `${formatSustainmentVerdict(verdict)} · `}
                    {formatSustainmentDue(nextReviewDue, renderDate)}
                  </p>
                </button>
              );
            })}
            {cadence.sustainment.hiddenCount > 0 && (
              <p className="pt-1 text-xs font-medium text-content-secondary">
                +{cadence.sustainment.hiddenCount} more
              </p>
            )}
          </div>
        </div>
      )}

      {handoffCandidates.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowRight size={14} className="text-content-secondary" />
              <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
                Control handoff
              </p>
            </div>
            <span className="text-xs text-content-muted">{handoffCandidates.length}</span>
          </div>
          <div className="space-y-2">
            {handoffCandidates.map(item => (
              <button
                key={item.investigation.id}
                type="button"
                onClick={() => onRecordHandoff(item.investigation.id)}
                className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
                aria-label={`Record control handoff for ${item.investigation.name}`}
              >
                <p className="text-sm font-medium text-content">{item.investigation.name}</p>
                <p className="mt-1 text-xs text-content-secondary">Needs control handoff</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {setupCandidates.length > 0 ? (
        <div>
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
        cadence.sustainment.totalCount === 0 &&
        handoffCandidates.length === 0 && (
          <p className="text-sm text-content-secondary">
            No sustainment items yet — investigations move here once resolved or controlled.
          </p>
        )
      )}
    </section>
  );
};

export default ProcessHubSustainmentRegion;
