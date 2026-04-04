import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { SuspectedCause as SuspectedCauseHub, SuspectedCauseEvidence } from '@variscout/core';

export interface SuspectedCause {
  factor: string;
  projectedCpk?: number;
}

export interface ConclusionCardProps {
  suspectedCauses: SuspectedCause[];
  currentCpk?: number;
  combinedProjectedCpk?: number;
  targetCpk?: number;
  /** Hub-based display (new model) */
  hubs?: SuspectedCauseHub[];
  hubEvidences?: Map<string, SuspectedCauseEvidence>;
  onNavigateToInvestigation?: () => void;
}

const HUB_STATUS_DOT: Record<SuspectedCauseHub['status'], string> = {
  suspected: 'bg-amber-500',
  confirmed: 'bg-green-500',
  'not-confirmed': 'bg-content-muted/40',
};

/**
 * ConclusionCard — shows suspected causes with Cpk projections when the
 * investigation is converging. Returns null when no suspected causes exist.
 *
 * Supports two display modes:
 * - Legacy chip model (suspectedCauses prop)
 * - Hub model (hubs prop) — takes precedence when provided
 */
const ConclusionCard: React.FC<ConclusionCardProps> = ({
  suspectedCauses,
  currentCpk,
  combinedProjectedCpk,
  targetCpk,
  hubs,
  hubEvidences,
  onNavigateToInvestigation,
}) => {
  const useHubModel = hubs !== undefined && hubs.length > 0;

  if (!useHubModel && suspectedCauses.length === 0) {
    return null;
  }

  const combinedMeetsTarget =
    combinedProjectedCpk !== undefined &&
    targetCpk !== undefined &&
    combinedProjectedCpk >= targetCpk;

  return (
    <div
      className="mx-2 mb-2 rounded border border-purple-500/30 bg-purple-950/30 px-3 py-2 flex flex-col gap-1.5"
      data-testid="conclusion-card"
    >
      {/* Header */}
      <div className="text-[0.625rem] font-semibold text-purple-300 uppercase tracking-wide">
        Suspected causes
      </div>

      {/* Hub-based display */}
      {useHubModel ? (
        <div className="space-y-1">
          {hubs!.map(hub => {
            const evidence = hubEvidences?.get(hub.id);
            const evidenceBadge = evidence
              ? `${evidence.contribution.label} ${Math.round(evidence.contribution.value * 100)}%`
              : null;

            return (
              <div
                key={hub.id}
                className="flex items-center gap-1.5 rounded bg-purple-500/15 px-1.5 py-1"
                data-testid={`conclusion-hub-${hub.id}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${HUB_STATUS_DOT[hub.status]}`}
                />
                <span className="text-[0.6875rem] text-purple-200 font-medium flex-1 truncate">
                  {hub.name}
                </span>
                {evidenceBadge && (
                  <span className="text-[0.5625rem] text-purple-300/70 font-medium shrink-0">
                    {evidenceBadge}
                  </span>
                )}
              </div>
            );
          })}
          {onNavigateToInvestigation && (
            <button
              onClick={onNavigateToInvestigation}
              className="flex items-center gap-1 text-[0.625rem] text-purple-300 hover:text-purple-200 transition-colors mt-0.5"
              data-testid="conclusion-navigate"
            >
              View in Investigation
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      ) : (
        /* Legacy chip display */
        <div className="flex flex-wrap gap-1">
          {suspectedCauses.map(cause => {
            const delta =
              cause.projectedCpk !== undefined && currentCpk !== undefined
                ? cause.projectedCpk - currentCpk
                : null;

            return (
              <div
                key={cause.factor}
                className="flex items-center gap-1 rounded bg-purple-500/15 px-1.5 py-0.5"
                data-testid={`cause-chip-${cause.factor}`}
              >
                <span className="text-[0.6875rem] text-purple-200 font-medium">{cause.factor}</span>
                {delta !== null && (
                  <span
                    className={`text-[0.5625rem] font-mono ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}
                    aria-label={`Cpk delta ${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Combined projection footer */}
      {combinedProjectedCpk !== undefined && currentCpk !== undefined && (
        <div
          className="flex items-center gap-1 text-[0.6875rem] text-content-secondary border-t border-purple-500/20 pt-1 mt-0.5"
          data-testid="conclusion-combined"
        >
          <span>Combined:</span>
          <span className="font-mono text-content">{currentCpk.toFixed(2)}</span>
          <span aria-hidden="true">→</span>
          <span className="font-mono text-green-400">{combinedProjectedCpk.toFixed(2)}</span>
          {combinedMeetsTarget && (
            <>
              <Check size={11} className="text-green-500 shrink-0" aria-hidden="true" />
              <span className="text-green-400">target</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConclusionCard;
