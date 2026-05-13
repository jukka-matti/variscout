import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { ControlHandoff, ControlHandoffSurface, SustainmentRecord } from '@variscout/core';
import { CollapsibleSection } from '../ImprovementProject/CollapsibleSection';

export interface HandoffFormProps {
  handoff: ControlHandoff;
  sustainmentRecord?: SustainmentRecord;
  isPaidTier?: boolean;
  onHandoffChange?: (patch: HandoffChangePatch) => void;
  onAcknowledge?: () => void;
  onMarkOperational?: () => void;
  onSponsorSignoff?: () => void;
}

export type HandoffChangePatch = Partial<
  Pick<
    ControlHandoff,
    | 'surface'
    | 'systemName'
    | 'description'
    | 'referenceUri'
    | 'retainSustainmentReview'
    | 'escalationPath'
    | 'reactionPlan'
  >
> & {
  operationalOwner?: ControlHandoff['operationalOwner'];
  handoffDate?: ControlHandoff['handoffDate'];
};

const surfaceOptions: ControlHandoffSurface[] = [
  'mes-recipe',
  'scada-alarm',
  'qms-procedure',
  'work-instruction',
  'training-record',
  'audit-program',
  'dashboard-only',
  'ticket-queue',
  'other',
];

const labelClassName = 'block space-y-2';
const labelTextClassName = 'text-sm font-medium text-content';
const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const disabledInputClassName = `${inputClassName} disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-content/60`;
const metadataClassName =
  'rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content/70';
const actionButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60';

function formatLabel(value: string | undefined): string {
  return value?.replaceAll('-', ' ') ?? 'not set';
}

function dateInputValue(value: number | undefined): string {
  if (value === undefined) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function timestampFromDateInput(value: string): number | undefined {
  if (!value) return undefined;
  const time = new Date(`${value}T00:00:00.000Z`).getTime();
  return Number.isNaN(time) ? undefined : time;
}

export const HandoffForm: React.FC<HandoffFormProps> = ({
  handoff,
  sustainmentRecord,
  isPaidTier = false,
  onHandoffChange,
  onAcknowledge,
  onMarkOperational,
  onSponsorSignoff,
}) => {
  const isReadOnly = !onHandoffChange;
  const isAcknowledged = handoff.status === 'acknowledged' || handoff.status === 'operational';
  const isOperational = handoff.status === 'operational';

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Metadata" defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>Surface</span>
            <select
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={handoff.surface}
              onChange={event =>
                onHandoffChange?.({ surface: event.currentTarget.value as ControlHandoffSurface })
              }
            >
              {surfaceOptions.map(surface => (
                <option key={surface} value={surface}>
                  {formatLabel(surface)}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>System name</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={handoff.systemName}
              onChange={event => onHandoffChange?.({ systemName: event.currentTarget.value })}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Process owner</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={handoff.operationalOwner.displayName}
              onChange={event =>
                onHandoffChange?.({
                  operationalOwner: {
                    ...handoff.operationalOwner,
                    displayName: event.currentTarget.value,
                  },
                })
              }
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>Handoff date</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              type="date"
              value={dateInputValue(handoff.handoffDate)}
              onChange={event => {
                const handoffDate = timestampFromDateInput(event.currentTarget.value);
                if (handoffDate !== undefined) onHandoffChange?.({ handoffDate });
              }}
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            <span className={labelTextClassName}>Control plan</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isReadOnly}
              value={handoff.description}
              onChange={event => onHandoffChange?.({ description: event.currentTarget.value })}
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            <span className={labelTextClassName}>Reference URI</span>
            <input
              className={disabledInputClassName}
              disabled={isReadOnly}
              value={handoff.referenceUri ?? ''}
              onChange={event =>
                onHandoffChange?.({ referenceUri: event.currentTarget.value || undefined })
              }
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Linked sustainment" defaultOpen>
        {sustainmentRecord ? (
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-content/60">Record</dt>
              <dd className="font-medium text-content">{sustainmentRecord.title}</dd>
            </div>
            <div>
              <dt className="text-content/60">Status</dt>
              <dd className="font-medium text-content">{formatLabel(sustainmentRecord.status)}</dd>
            </div>
            <div>
              <dt className="text-content/60">Latest verdict</dt>
              <dd className="font-medium text-content">
                {formatLabel(sustainmentRecord.latestVerdict)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-content/60">No linked sustainment record.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Owner acknowledgement" defaultOpen>
        <div className="flex flex-wrap items-center gap-3">
          <span className={metadataClassName}>Status {formatLabel(handoff.status)}</span>
          {handoff.acknowledgedAt && (
            <span className={metadataClassName}>
              Acknowledged {dateInputValue(handoff.acknowledgedAt)}
            </span>
          )}
          <button
            type="button"
            className={actionButtonClassName}
            disabled={isAcknowledged || !onAcknowledge}
            onClick={onAcknowledge}
          >
            <CheckCircle2 size={16} />
            Acknowledge handoff
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            disabled={isOperational || !onMarkOperational}
            onClick={onMarkOperational}
          >
            <CheckCircle2 size={16} />
            Mark operational
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Reaction plan" defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>Escalation path</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isReadOnly}
              value={handoff.escalationPath ?? ''}
              onChange={event => onHandoffChange?.({ escalationPath: event.currentTarget.value })}
            />
          </label>
          <label className={labelClassName}>
            <span className={labelTextClassName}>Reaction plan</span>
            <textarea
              className={`${disabledInputClassName} min-h-20 resize-y`}
              disabled={isReadOnly}
              value={handoff.reactionPlan ?? ''}
              onChange={event => onHandoffChange?.({ reactionPlan: event.currentTarget.value })}
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Sponsor signoff" defaultOpen>
        <div className="flex flex-wrap items-center gap-3">
          {handoff.signoff?.approvedAt ? (
            <span className={metadataClassName}>
              Signed {dateInputValue(handoff.signoff.approvedAt)}
            </span>
          ) : (
            <span className={metadataClassName}>Not signed</span>
          )}
          {isPaidTier ? (
            <button
              type="button"
              className={actionButtonClassName}
              disabled={!onSponsorSignoff}
              onClick={onSponsorSignoff}
              aria-label="Run sponsor signoff"
            >
              Sponsor signoff
            </button>
          ) : (
            <button
              type="button"
              className={actionButtonClassName}
              disabled
              title="Sponsor signoff is available on paid VariScout plans."
              aria-label="Sponsor signoff locked"
            >
              <Lock size={16} />
              Sponsor signoff
            </button>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};
