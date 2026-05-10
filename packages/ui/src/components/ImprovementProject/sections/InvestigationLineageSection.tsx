import React from 'react';
import type { Finding, Hypothesis } from '@variscout/core/findings';

export interface InvestigationLineageSectionProps {
  hypotheses?: Hypothesis[];
  findings?: Finding[];
  onNavigate?: (target: { kind: 'hypothesis' | 'finding'; id: string }) => void;
}

const panelClassName = 'rounded-md border border-edge bg-surface-secondary p-4';
const chipClassName =
  'w-full rounded-md border border-edge bg-surface p-3 text-left text-sm transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';
const metadataClassName = 'text-xs font-medium uppercase text-content/60';
const emptyClassName =
  'rounded-md border border-dashed border-edge bg-surface p-3 text-sm text-content/60';

function formatStatus(status: string | undefined): string | undefined {
  return status?.replaceAll('-', ' ');
}

export const InvestigationLineageSection: React.FC<InvestigationLineageSectionProps> = ({
  hypotheses = [],
  findings = [],
  onNavigate,
}) => {
  const headingId = React.useId();
  const hypothesesHeadingId = `${headingId}-hypotheses`;
  const findingsHeadingId = `${headingId}-findings`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={panelClassName} aria-labelledby={hypothesesHeadingId}>
        <div className="mb-3">
          <h3 id={hypothesesHeadingId} className="text-sm font-semibold text-content">
            Linked hypotheses
          </h3>
        </div>

        {hypotheses.length > 0 ? (
          <div className="space-y-2">
            {hypotheses.map(hypothesis => {
              const content = (
                <>
                  <span className="block font-medium text-content">{hypothesis.name}</span>
                  <span className="mt-1 block text-xs text-content/70">
                    {formatStatus(hypothesis.status)}
                  </span>
                  {hypothesis.synthesis?.trim() && (
                    <span className="mt-2 block text-content/80">{hypothesis.synthesis}</span>
                  )}
                  {hypothesis.themeTags && hypothesis.themeTags.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {hypothesis.themeTags.map(tag => (
                        <span
                          key={tag}
                          className="rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs text-content/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </>
              );

              return onNavigate ? (
                <button
                  key={hypothesis.id}
                  type="button"
                  className={chipClassName}
                  onClick={() => onNavigate({ kind: 'hypothesis', id: hypothesis.id })}
                >
                  {content}
                </button>
              ) : (
                <article key={hypothesis.id} className={chipClassName}>
                  {content}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={emptyClassName}>No linked hypotheses yet.</p>
        )}
      </section>

      <section className={panelClassName} aria-labelledby={findingsHeadingId}>
        <div className="mb-3">
          <h3 id={findingsHeadingId} className="text-sm font-semibold text-content">
            Linked findings
          </h3>
        </div>

        {findings.length > 0 ? (
          <div className="space-y-2">
            {findings.map(finding => {
              const content = (
                <>
                  <span className="block font-medium text-content">{finding.text}</span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    {finding.evidenceType && (
                      <span className={metadataClassName}>{finding.evidenceType}</span>
                    )}
                    {finding.status && (
                      <span className={metadataClassName}>{formatStatus(finding.status)}</span>
                    )}
                  </span>
                </>
              );

              return onNavigate ? (
                <button
                  key={finding.id}
                  type="button"
                  className={chipClassName}
                  onClick={() => onNavigate({ kind: 'finding', id: finding.id })}
                >
                  {content}
                </button>
              ) : (
                <article key={finding.id} className={chipClassName}>
                  {content}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={emptyClassName}>No linked findings yet.</p>
        )}
      </section>
    </div>
  );
};
