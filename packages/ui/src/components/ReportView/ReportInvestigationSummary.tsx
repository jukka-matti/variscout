/**
 * ReportInvestigationSummary — Read-only investigation audit trail for reports.
 *
 * Renders the question-driven EDA narrative:
 * - Issue statement (original concern)
 * - Problem statement (refined formulation)
 * - Suspected causes with evidence
 * - Negative learnings (ruled-out factors)
 *
 * Print-friendly, no interactive elements.
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface SuspectedCause {
  text: string;
  factor?: string;
  level?: string;
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
}

interface RuledOutFactor {
  text: string;
  factor?: string;
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
}

export interface ReportInvestigationSummaryProps {
  /** Original issue statement */
  issueStatement?: string;
  /** Formulated problem statement */
  problemStatement?: string;
  /** Suspected causes from investigation */
  suspectedCauses?: SuspectedCause[];
  /** Ruled-out factors (negative learnings) */
  ruledOut?: RuledOutFactor[];
}

// ============================================================================
// Helpers
// ============================================================================

function formatPercentage(value: number | undefined): string | null {
  if (value == null) return null;
  return `${(value * 100).toFixed(1)}%`;
}

function renderEvidence(evidence?: { rSquaredAdj?: number; etaSquared?: number }): React.ReactNode {
  if (!evidence) return null;

  const parts: string[] = [];
  const eta = formatPercentage(evidence.etaSquared);
  const rSq = formatPercentage(evidence.rSquaredAdj);

  if (eta) parts.push(`\u03B7\u00B2 = ${eta}`);
  if (rSq) parts.push(`R\u00B2 adj = ${rSq}`);

  if (parts.length === 0) return null;

  return <span className="text-xs text-content-muted ml-1">({parts.join(', ')})</span>;
}

// ============================================================================
// Component
// ============================================================================

export const ReportInvestigationSummary: React.FC<ReportInvestigationSummaryProps> = ({
  issueStatement,
  problemStatement,
  suspectedCauses,
  ruledOut,
}) => {
  const hasContent =
    issueStatement ||
    problemStatement ||
    (suspectedCauses && suspectedCauses.length > 0) ||
    (ruledOut && ruledOut.length > 0);

  if (!hasContent) return null;

  return (
    <div data-testid="report-investigation-summary" className="space-y-4">
      {/* Issue Statement */}
      {issueStatement && (
        <div className="rounded-lg border border-edge bg-surface-elevated p-4">
          <p className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
            Issue Statement
          </p>
          <p className="text-sm text-content leading-relaxed">{issueStatement}</p>
        </div>
      )}

      {/* Problem Statement */}
      {problemStatement && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
            Problem Statement
          </p>
          <p className="text-sm text-content leading-relaxed">{problemStatement}</p>
        </div>
      )}

      {/* Suspected Causes */}
      {suspectedCauses && suspectedCauses.length > 0 && (
        <div className="rounded-lg border border-edge bg-surface-elevated p-4">
          <p className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
            Suspected Causes
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            {suspectedCauses.map((cause, index) => (
              <li key={index} className="text-sm text-content">
                <span>{cause.text}</span>
                {cause.factor && (
                  <span className="text-xs text-content-muted ml-1">
                    ({cause.factor}
                    {cause.level ? `: ${cause.level}` : ''})
                  </span>
                )}
                {renderEvidence(cause.evidence)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Negative Learnings (Ruled Out) */}
      {ruledOut && ruledOut.length > 0 && (
        <div className="rounded-lg border border-edge bg-surface-elevated p-4">
          <p className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
            Negative Learnings
          </p>
          <p className="text-xs text-content-muted mb-2">
            The following factors were investigated and found to not significantly contribute:
          </p>
          <ul className="space-y-1.5">
            {ruledOut.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-content-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-edge-secondary flex-shrink-0 mt-1.5" />
                <span>
                  {item.text}
                  {item.factor && (
                    <span className="text-xs text-content-muted ml-1">({item.factor})</span>
                  )}
                  {renderEvidence(item.evidence)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
