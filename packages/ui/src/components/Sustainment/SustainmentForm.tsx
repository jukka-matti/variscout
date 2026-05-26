import React from 'react';
import type { SustainmentCadence, SustainmentRecord, SustainmentReview } from '@variscout/core';
import type {
  ImprovementProjectFactorControl,
  ImprovementProjectGoal,
  ImprovementProjectMechanismGoal,
} from '@variscout/core/improvementProject';
import { CollapsibleSection } from '../ImprovementProject/CollapsibleSection';

export interface SustainmentFormProps {
  record: SustainmentRecord;
  reviews?: SustainmentReview[];
  onRecordChange?: (patch: SustainmentRecordChangePatch) => void;
}

export type SustainmentRecordChangePatch = Partial<
  Pick<SustainmentRecord, 'title' | 'targetSummary' | 'cadence'>
>;

export type { SustainmentCadence };

const cadenceOptions: SustainmentCadence[] = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'on-demand',
];

const labelClassName = 'block space-y-2';
const labelTextClassName = 'text-sm font-medium text-content';
const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const disabledInputClassName = `${inputClassName} disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-content/60`;
const metadataClassName =
  'rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content/70';

function formatLabel(value: string | undefined): string {
  return value?.replaceAll('-', ' ') ?? 'not set';
}

function formatDate(value: string | number | undefined): string {
  if (value === undefined) return 'not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'not set';

  return date.toISOString().slice(0, 10);
}

function renderFactorControl(control: ImprovementProjectFactorControl, index: number) {
  return (
    <li key={`${control.factor}-${index}`} className="space-y-1">
      <div className="font-medium text-content">{control.factor || 'Unnamed factor'}</div>
      <div className="text-content/70">{control.targetCondition || 'Target condition not set'}</div>
    </li>
  );
}

function renderMechanismGoal(goal: ImprovementProjectMechanismGoal, index: number) {
  return (
    <li key={`${goal.description}-${index}`} className="text-content/80">
      {goal.description || 'Mechanism goal not set'}
    </li>
  );
}

function GoalCarryForward({ goal }: { goal?: ImprovementProjectGoal }) {
  if (!goal) {
    return <p className="text-sm text-content/60">No carried-forward goal.</p>;
  }

  // Legacy first-outcome read — multi-outcome rendering is later phases
  // (Spec 2 §3.2.2 / PR-CCJ-C1).
  const outcome = goal.outcomeGoals[0];
  const factorControls = goal.factorControls ?? [];
  const mechanismGoals = goal.mechanismGoals ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-2" aria-labelledby="sustainment-goal-y-heading">
        <h3 id="sustainment-goal-y-heading" className="text-sm font-semibold text-content">
          Y-level outcome target
        </h3>
        {outcome ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-content/60">Outcome spec</dt>
              <dd className="font-medium text-content">{outcome.outcomeSpecId}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              {outcome.baseline !== undefined && (
                <span className={metadataClassName}>Baseline {outcome.baseline}</span>
              )}
              <span className={metadataClassName}>Target {outcome.target}</span>
              {outcome.deadline && (
                <span className={metadataClassName}>Due {outcome.deadline}</span>
              )}
            </div>
          </dl>
        ) : (
          <p className="text-sm text-content/60">No outcome target set.</p>
        )}
        {goal.freeText && <p className="text-sm text-content/70">{goal.freeText}</p>}
      </section>

      <section className="space-y-2" aria-labelledby="sustainment-goal-x-heading">
        <h3 id="sustainment-goal-x-heading" className="text-sm font-semibold text-content">
          X-level factor controls
        </h3>
        {factorControls.length > 0 ? (
          <ul className="space-y-3 text-sm">{factorControls.map(renderFactorControl)}</ul>
        ) : (
          <p className="text-sm text-content/60">No factor controls.</p>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="sustainment-goal-little-x-heading">
        <h3 id="sustainment-goal-little-x-heading" className="text-sm font-semibold text-content">
          x-level mechanism goals
        </h3>
        {mechanismGoals.length > 0 ? (
          <ul className="space-y-2 text-sm">{mechanismGoals.map(renderMechanismGoal)}</ul>
        ) : (
          <p className="text-sm text-content/60">No mechanism goals.</p>
        )}
      </section>
    </div>
  );
}

export const SustainmentForm: React.FC<SustainmentFormProps> = ({
  record,
  reviews = [],
  onRecordChange,
}) => {
  const ticks = Math.max(0, Math.floor(record.consecutiveOnTargetTicks ?? 0));
  const isReadOnly = !onRecordChange;

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Metadata" defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>Title</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={record.title}
              onChange={event => onRecordChange?.({ title: event.currentTarget.value })}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Cadence</span>
            <select
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={record.cadence}
              onChange={event =>
                onRecordChange?.({ cadence: event.currentTarget.value as SustainmentCadence })
              }
            >
              {cadenceOptions.map(cadence => (
                <option key={cadence} value={cadence}>
                  {formatLabel(cadence)}
                </option>
              ))}
            </select>
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            <span className={labelTextClassName}>Target summary</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isReadOnly}
              value={record.targetSummary ?? ''}
              onChange={event => onRecordChange?.({ targetSummary: event.currentTarget.value })}
            />
          </label>

          <dl className="grid gap-2 text-sm md:col-span-2 md:grid-cols-3">
            <div>
              <dt className="text-content/60">Owner</dt>
              <dd className="font-medium text-content">{record.owner?.displayName ?? 'not set'}</dd>
            </div>
            <div>
              <dt className="text-content/60">Next review</dt>
              <dd className="font-medium text-content">{formatDate(record.nextReviewDue)}</dd>
            </div>
            <div>
              <dt className="text-content/60">Latest review</dt>
              <dd className="font-medium text-content">{formatDate(record.latestReviewAt)}</dd>
            </div>
          </dl>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Current status" defaultOpen>
        <dl className="grid gap-3 md:grid-cols-3">
          <div>
            <dt className="text-content/60">Status</dt>
            <dd className="mt-1 font-medium text-content">{formatLabel(record.status)}</dd>
          </div>
          <div>
            <dt className="text-content/60">Latest verdict</dt>
            <dd className="mt-1 font-medium text-content">{formatLabel(record.latestVerdict)}</dd>
          </div>
          <div>
            <dt className="text-content/60">On-target streak</dt>
            <dd className="mt-1 font-medium text-content">{ticks} of 4 ticks</dd>
          </div>
        </dl>
      </CollapsibleSection>

      <CollapsibleSection title="Review history" defaultOpen>
        {reviews.length > 0 ? (
          <ol className="space-y-3">
            {reviews.map(review => (
              <li key={review.id} className="border-b border-edge pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-content">
                    Review verdict: {formatLabel(review.verdict)}
                  </span>
                  <span className={metadataClassName}>{formatDate(review.reviewedAt)}</span>
                  {review.snapshotId && (
                    <span className={metadataClassName}>Snapshot {review.snapshotId}</span>
                  )}
                </div>
                {review.observation && (
                  <p className="mt-2 text-sm text-content/80">{review.observation}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-content/60">No reviews logged.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Goal carry-forward" defaultOpen>
        <GoalCarryForward goal={record.goal} />
      </CollapsibleSection>
    </div>
  );
};
