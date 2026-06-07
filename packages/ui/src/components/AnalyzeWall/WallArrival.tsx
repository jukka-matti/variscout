import React from 'react';
import type { Finding } from '@variscout/core';

export interface WallArrivalProps {
  findings: Finding[];
  onProposeHypothesis?: (findingId: string) => void;
  onWriteHypothesis?: () => void;
  onSeedFromFactorIntel?: () => void;
}

function formatFindingCondition(finding: Finding): string {
  const filters = Object.entries(finding.context.activeFilters);
  if (filters.length === 0) return finding.text.trim() || 'Captured observation';
  return filters.map(([column, values]) => `${column} ${values.join(', ')}`).join(' x ');
}

function formatFindingEvidence(finding: Finding): string {
  if (finding.text.trim().length > 0) return finding.text.trim();
  const source = finding.source?.chart ? `via ${finding.source.chart}` : 'captured';
  return `${source} observation`;
}

export function WallArrival({
  findings,
  onProposeHypothesis,
  onWriteHypothesis,
  onSeedFromFactorIntel,
}: WallArrivalProps): React.JSX.Element {
  return (
    <section
      aria-label="Findings waiting to be explained"
      className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-content"
      data-testid="wall-arrival"
    >
      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-semibold">You've observed:</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {findings.map(finding => (
            <article
              key={finding.id}
              className="rounded border border-edge bg-surface-secondary p-3 shadow-sm"
              data-testid={`wall-arrival-finding-${finding.id}`}
            >
              <div className="text-sm font-semibold text-content">
                {formatFindingCondition(finding)}
              </div>
              <div className="mt-1 text-xs text-content-muted">
                {formatFindingEvidence(finding)}
              </div>
              {onProposeHypothesis ? (
                <button
                  type="button"
                  className="mt-3 rounded bg-surface border border-edge px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-tertiary"
                  onClick={() => onProposeHypothesis(finding.id)}
                >
                  What might cause this?
                </button>
              ) : null}
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-content-muted">...or start from a hunch:</span>
          {onWriteHypothesis ? (
            <button
              type="button"
              className="rounded border border-edge bg-surface-secondary px-3 py-1.5 text-content hover:bg-surface"
              onClick={onWriteHypothesis}
            >
              Add a suspected cause
            </button>
          ) : null}
          {onSeedFromFactorIntel ? (
            <button
              type="button"
              className="rounded border border-edge bg-surface-secondary px-3 py-1.5 text-content hover:bg-surface"
              onClick={onSeedFromFactorIntel}
            >
              Seed from factor intel
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
