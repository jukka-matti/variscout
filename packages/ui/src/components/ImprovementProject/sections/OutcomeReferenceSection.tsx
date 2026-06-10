import React from 'react';
import type { ControlHandoff, ControlRecord } from '@variscout/core';

export interface OutcomeReferenceSectionProps {
  controlRecord?: ControlRecord & { title?: string };
  controlHandoff?: ControlHandoff;
  onNavigate?: (target: { kind: 'controlRecord' | 'controlHandoff'; id: string }) => void;
}

const panelClassName = 'rounded-md border border-edge bg-surface-secondary p-4';
const cardClassName =
  'w-full rounded-md border border-edge bg-surface p-3 text-left text-sm transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';
const staticCardClassName = 'w-full rounded-md border border-edge bg-surface p-3 text-sm';
const emptyClassName =
  'rounded-md border border-dashed border-edge bg-surface p-3 text-sm text-content/60';
const metadataClassName =
  'rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content/70';

function formatLabel(value: string | undefined): string | undefined {
  return value?.replaceAll('-', ' ');
}

function formatDate(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}

function renderCard(
  content: React.ReactNode,
  label: string,
  onClick: (() => void) | undefined
): React.ReactElement {
  if (onClick) {
    return (
      <button type="button" className={cardClassName} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <article className={staticCardClassName} aria-label={label}>
      {content}
    </article>
  );
}

export const OutcomeReferenceSection: React.FC<OutcomeReferenceSectionProps> = ({
  controlRecord,
  controlHandoff,
  onNavigate,
}) => {
  const headingId = React.useId();
  const sustainmentHeadingId = `${headingId}-sustainment`;
  const handoffHeadingId = `${headingId}-handoff`;

  const sustainmentTitle = controlRecord?.title?.trim() || 'Linked sustainment record';
  const nextCheckDate = formatDate(controlRecord?.nextCheckSuggestedAt);
  const handoffDate = formatDate(controlHandoff?.handoffDate);
  const ladder = controlRecord?.ladder?.length ? controlRecord.ladder : [7];
  const ladderStep =
    controlRecord && Number.isFinite(controlRecord.ladderStep) ? controlRecord.ladderStep : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={panelClassName} aria-labelledby={sustainmentHeadingId}>
        <div className="mb-3">
          <h3 id={sustainmentHeadingId} className="text-sm font-semibold text-content">
            Control
          </h3>
        </div>

        {controlRecord ? (
          renderCard(
            <>
              <span className="block font-medium text-content">{sustainmentTitle}</span>
              <span className="mt-2 flex flex-wrap gap-2">
                <span className={metadataClassName}>
                  {controlRecord.deletedAt ? 'archived' : 'active'}
                </span>
                <span className={metadataClassName}>{formatLabel(controlRecord.status)}</span>
                <span className={metadataClassName}>
                  Ladder {ladderStep + 1}/{ladder.length}
                </span>
              </span>
              <span className="mt-2 flex flex-wrap gap-2 text-xs text-content/70">
                {nextCheckDate && <span>Next suggested re-check {nextCheckDate}</span>}
                {controlRecord.owner?.displayName && (
                  <span>Owner {controlRecord.owner.displayName}</span>
                )}
              </span>
            </>,
            sustainmentTitle,
            onNavigate
              ? () => onNavigate({ kind: 'controlRecord', id: controlRecord.id })
              : undefined
          )
        ) : (
          <p className={emptyClassName}>
            Control: not yet started - set up after Improvement closes.
          </p>
        )}
      </section>

      <section className={panelClassName} aria-labelledby={handoffHeadingId}>
        <div className="mb-3">
          <h3 id={handoffHeadingId} className="text-sm font-semibold text-content">
            Control handoff
          </h3>
        </div>

        {controlHandoff ? (
          renderCard(
            <>
              <span className="block font-medium text-content">{controlHandoff.systemName}</span>
              <span className="mt-2 flex flex-wrap gap-2">
                <span className={metadataClassName}>{formatLabel(controlHandoff.surface)}</span>
                {controlHandoff.operationalOwner.displayName && (
                  <span className={metadataClassName}>
                    Owner {controlHandoff.operationalOwner.displayName}
                  </span>
                )}
              </span>
              <span className="mt-2 block text-xs text-content/70">
                {handoffDate ? `Effective ${handoffDate}` : 'Effective date not set'}
              </span>
            </>,
            controlHandoff.systemName,
            onNavigate
              ? () => onNavigate({ kind: 'controlHandoff', id: controlHandoff.id })
              : undefined
          )
        ) : (
          <p className={emptyClassName}>Control handoff: not yet linked.</p>
        )}
      </section>
    </div>
  );
};
