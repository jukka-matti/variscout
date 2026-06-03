import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Lightbulb, CheckSquare } from 'lucide-react';
import type { Hypothesis, HypothesisEvidence } from '@variscout/core';
import type { HubProjection } from '@variscout/core/findings';

export interface HubCardProps {
  hub: Hypothesis;
  evidence?: HypothesisEvidence;
  projection?: HubProjection;
  findingsCount: number;
  onEdit: () => void;
  onToggleSelect: () => void;
  onBrainstorm: () => void;
}

const STATUS_STYLES: Record<Hypothesis['status'], { dot: string; label: string }> = {
  proposed: { dot: 'bg-slate-400', label: 'Proposed' },
  evidenced: { dot: 'bg-amber-500', label: 'Evidenced' },
  // Falsification can only fail to break a hypothesis, never *confirm* it, so
  // both the status code and the user-facing word say "supported", not "confirmed".
  'evidence-survived-test': { dot: 'bg-green-500', label: 'Supported' },
  refuted: { dot: 'bg-content-muted/40', label: 'Refuted' },
  'needs-disconfirmation': { dot: 'bg-orange-500', label: 'Needs disconfirmation' },
};

const HubCard: React.FC<HubCardProps> = ({
  hub,
  evidence,
  projection,
  findingsCount,
  onEdit,
  onToggleSelect,
  onBrainstorm,
}) => {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[hub.status];

  const evidenceBadge = evidence
    ? `${evidence.contribution.label} ${Math.round(evidence.contribution.value * 100)}%`
    : null;

  const projectionText = projection
    ? `${projection.label} ${projection.predictedMeanDelta > 0 ? '+' : ''}${Number.isFinite(projection.predictedMeanDelta) ? projection.predictedMeanDelta.toFixed(1) : '—'} (R²adj ${Number.isFinite(projection.rSquaredAdj) ? Math.round(projection.rSquaredAdj * 100) : '—'}%)`
    : null;

  const summaryParts: string[] = [];
  if (findingsCount > 0)
    summaryParts.push(`${findingsCount} finding${findingsCount !== 1 ? 's' : ''}`);

  return (
    <div
      className="rounded-lg border border-edge bg-surface p-2.5 space-y-1"
      data-testid={`hub-card-${hub.id}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        {expanded ? (
          <ChevronDown size={10} className="text-content-muted shrink-0" />
        ) : (
          <ChevronRight size={10} className="text-content-muted shrink-0" />
        )}
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />
        <span className="flex-1 text-[0.6875rem] font-semibold text-content truncate">
          {hub.name}
        </span>
        {evidenceBadge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium shrink-0">
            {evidenceBadge}
          </span>
        )}
      </button>

      {/* Summary line */}
      {summaryParts.length > 0 && (
        <div className="text-xs text-content-secondary pl-5">{summaryParts.join(' \u00b7 ')}</div>
      )}

      {/* Projection */}
      {projectionText && (
        <div className="text-xs text-content-secondary pl-5">{projectionText}</div>
      )}

      {hub.nextMove && (
        <div className="text-xs text-content-secondary pl-5">Next: {hub.nextMove}</div>
      )}

      {/* Expanded: synthesis + evidence */}
      {expanded && (
        <div className="pl-5 pt-1 space-y-1 border-t border-edge mt-1">
          {hub.synthesis && (
            <p className="text-xs text-content-secondary leading-relaxed">{hub.synthesis}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pl-5 pt-0.5">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors px-1.5 py-0.5 rounded hover:bg-surface-secondary"
          data-testid={`hub-edit-${hub.id}`}
        >
          <Pencil size={10} />
          Edit
        </button>
        <button
          onClick={onToggleSelect}
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
            hub.selectedForImprovement
              ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20'
              : 'text-content-muted hover:text-content hover:bg-surface-secondary'
          }`}
          data-testid={`hub-select-${hub.id}`}
        >
          <CheckSquare size={10} />
          {hub.selectedForImprovement ? 'Selected' : 'Select'}
        </button>
        <button
          onClick={onBrainstorm}
          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-500/10"
          data-testid={`hub-brainstorm-${hub.id}`}
        >
          <Lightbulb size={10} />
          Brainstorm
        </button>
      </div>
    </div>
  );
};

export { HubCard };
