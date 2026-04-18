import React from 'react';

export interface CauseSummaryCardData {
  id: string;
  factor: string;
  evidence: string;
  color: string;
  ideaCount: number;
  quickWinCount: number;
  avgProjectedCpk?: number;
}

export interface CauseSummaryCardsProps {
  causes: CauseSummaryCardData[];
  onViewIdeas?: (causeId: string) => void;
}

export const CauseSummaryCards: React.FC<CauseSummaryCardsProps> = ({ causes, onViewIdeas }) => {
  if (causes.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="cause-summary-cards"
      className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1"
    >
      {causes.map(cause => (
        <div
          key={cause.id}
          data-testid={`cause-card-${cause.id}`}
          className="min-w-[260px] snap-center bg-surface-secondary rounded-xl border border-edge p-4 flex-shrink-0 flex flex-col gap-2"
        >
          {/* Header: dot + factor name */}
          <div className="flex items-center gap-2">
            <span
              data-testid={`cause-dot-${cause.id}`}
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cause.color }}
            />
            <span
              data-testid={`cause-factor-${cause.id}`}
              className="text-sm font-semibold text-content"
            >
              {cause.factor}
            </span>
          </div>

          {/* Evidence */}
          <span data-testid={`cause-evidence-${cause.id}`} className="text-xs text-content-muted">
            {cause.evidence}
          </span>

          {/* Stats row */}
          <div className="flex items-center gap-2">
            <span
              data-testid={`cause-idea-count-${cause.id}`}
              className="text-xs text-content-secondary"
            >
              {cause.ideaCount} {cause.ideaCount === 1 ? 'idea' : 'ideas'}
            </span>
            <span className="text-xs text-content-muted">·</span>
            <span
              data-testid={`cause-quick-wins-${cause.id}`}
              className="text-xs text-content-secondary"
            >
              {cause.quickWinCount} quick {cause.quickWinCount === 1 ? 'win' : 'wins'}
            </span>
          </div>

          {/* Avg Cpk */}
          <span
            data-testid={`cause-avg-cpk-${cause.id}`}
            className={
              cause.avgProjectedCpk != null
                ? 'text-xs text-green-700 dark:text-green-400'
                : 'text-xs text-content-muted'
            }
          >
            {cause.avgProjectedCpk != null
              ? `Avg Cpk: ${Number.isFinite(cause.avgProjectedCpk) ? cause.avgProjectedCpk.toFixed(2) : '—'}`
              : 'Avg Cpk: —'}
          </span>

          {/* View ideas button */}
          {onViewIdeas && (
            <button
              data-testid={`cause-view-ideas-${cause.id}`}
              onClick={() => onViewIdeas(cause.id)}
              className="self-start text-xs text-blue-400 hover:underline focus:outline-none"
            >
              View ideas
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
