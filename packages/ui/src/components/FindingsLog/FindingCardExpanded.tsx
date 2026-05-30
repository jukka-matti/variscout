import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronRight } from 'lucide-react';

import { useTranslation } from '@variscout/hooks';

// ============================================================================
// Outcome Section
// ============================================================================

export interface OutcomeSectionProps {
  findingId: string;
  outcome?: {
    effective: 'yes' | 'no' | 'partial';
    cpkAfter?: number;
    notes?: string;
    verifiedAt: number;
  };
  onSetOutcome: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;
  readOnly?: boolean;
  projectedCpk?: number;
}

export const OutcomeSection: React.FC<OutcomeSectionProps> = ({
  findingId,
  outcome,
  onSetOutcome,
  readOnly,
  projectedCpk,
}) => {
  const [isOpen, setIsOpen] = useState(!!outcome);
  const { formatStat } = useTranslation();

  const effectiveLabels = { yes: 'Effective', no: 'Not Effective', partial: 'Partially Effective' };
  const effectiveColors = { yes: 'text-green-400', no: 'text-red-400', partial: 'text-amber-400' };

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[0.625rem] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Activity size={10} />
        <span>Outcome</span>
        {outcome && !isOpen && (
          <span className={`ml-1 ${effectiveColors[outcome.effective]}`}>
            &mdash; {effectiveLabels[outcome.effective]}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1.5" onClick={e => e.stopPropagation()}>
          {!readOnly && !outcome && (
            <div className="flex gap-1.5">
              {(['yes', 'no', 'partial'] as const).map(eff => (
                <button
                  key={eff}
                  onClick={() =>
                    onSetOutcome(findingId, { effective: eff, verifiedAt: Date.now() })
                  }
                  className={`px-2 py-1 text-[0.625rem] rounded border border-edge/50 hover:border-blue-500/50 transition-colors ${effectiveColors[eff]}`}
                >
                  {effectiveLabels[eff]}
                </button>
              ))}
            </div>
          )}
          {outcome && (
            <div className="text-[0.6875rem]">
              <span className={effectiveColors[outcome.effective]}>
                {effectiveLabels[outcome.effective]}
              </span>
              {outcome.cpkAfter !== undefined && (
                <span className="ml-2 text-content-muted">
                  Cpk after: {formatStat(outcome.cpkAfter)}
                </span>
              )}
              {projectedCpk !== undefined && outcome.cpkAfter !== undefined && (
                <span
                  className={`ml-2 text-[0.625rem] ${
                    outcome.cpkAfter >= projectedCpk ? 'text-green-400' : 'text-red-400'
                  }`}
                  data-testid={`projected-vs-actual-${findingId}`}
                >
                  Projected {formatStat(projectedCpk)} &rarr; Actual {formatStat(outcome.cpkAfter)}{' '}
                  ({outcome.cpkAfter >= projectedCpk ? '+' : ''}
                  {formatStat(outcome.cpkAfter - projectedCpk)})
                </span>
              )}
              {outcome.notes && (
                <p className="text-content-secondary mt-0.5 italic">{outcome.notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
