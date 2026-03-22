import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronRight, Target } from 'lucide-react';

import { useTranslation } from '@variscout/hooks';

// ============================================================================
// Hypothesis Section
// ============================================================================

const HYPOTHESIS_STATUS_COLORS: Record<string, string> = {
  untested: 'text-content-muted',
  supported: 'text-green-400',
  contradicted: 'text-red-400',
  partial: 'text-amber-400',
};

export interface HypothesisMapEntry {
  text: string;
  status: string;
  factor?: string;
  level?: string;
  ideas?: Array<{ text: string; selected?: boolean }>;
  causeRole?: 'primary' | 'contributing';
}

export interface HypothesisSectionProps {
  findingId: string;
  hypothesisId?: string;
  hypothesesMap?: Record<string, HypothesisMapEntry>;
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  readOnly?: boolean;
}

export const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  findingId,
  hypothesisId,
  hypothesesMap,
  onCreateHypothesis,
  readOnly,
}) => {
  const { t } = useTranslation();
  const hypothesis = hypothesisId ? hypothesesMap?.[hypothesisId] : undefined;
  const [isOpen, setIsOpen] = useState(!!hypothesis);
  const [draft, setDraft] = useState('');

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Target size={10} />
        <span>{t('investigation.hypothesis')}</span>
        {hypothesis && !isOpen && (
          <span
            className={`ml-1 truncate flex-1 ${HYPOTHESIS_STATUS_COLORS[hypothesis.status] ?? 'text-content-secondary'}`}
          >
            &mdash; {hypothesis.text}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1">
          {hypothesis ? (
            <div className="text-[11px] space-y-1" onClick={e => e.stopPropagation()}>
              <p className="text-content-secondary italic">&ldquo;{hypothesis.text}&rdquo;</p>
              <div className="flex items-center gap-2 text-[10px]">
                <span
                  className={HYPOTHESIS_STATUS_COLORS[hypothesis.status] ?? 'text-content-muted'}
                >
                  {hypothesis.status.charAt(0).toUpperCase() + hypothesis.status.slice(1)}
                </span>
                {hypothesis.factor && (
                  <span className="text-content-muted">
                    {hypothesis.factor}
                    {hypothesis.level ? `=${hypothesis.level}` : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            !readOnly &&
            onCreateHypothesis && (
              <div onClick={e => e.stopPropagation()}>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
                      e.preventDefault();
                      onCreateHypothesis(findingId, draft.trim());
                      setDraft('');
                    }
                  }}
                  placeholder="What do you think is causing this? (Enter to create)"
                  className="w-full text-[11px] bg-surface-tertiary/50 border border-edge/50 rounded px-2 py-1.5 text-content placeholder:text-content-muted resize-none focus:outline-none focus:border-blue-500/50"
                  rows={2}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Suspected Cause Section (primary + contributing hypotheses)
// ============================================================================

export interface SuspectedCauseSectionProps {
  hypothesesMap: Record<
    string,
    {
      text: string;
      status: string;
      factor?: string;
      causeRole?: 'primary' | 'contributing';
    }
  >;
}

export const SuspectedCauseSection: React.FC<SuspectedCauseSectionProps> = ({ hypothesesMap }) => {
  const entries = Object.entries(hypothesesMap);
  const primary = entries.find(([, h]) => h.causeRole === 'primary');
  const contributing = entries.filter(([, h]) => h.causeRole === 'contributing');

  if (!primary && contributing.length === 0) return null;

  return (
    <div className="mt-2 border-t border-edge/50 pt-2" data-testid="suspected-cause-section">
      <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
        <Target size={10} />
        <span className="font-medium">Suspected cause</span>
      </div>
      <div className="space-y-1">
        {primary && (
          <div className="flex items-start gap-1.5 text-[11px]">
            <span className="text-red-400 mt-0.5 flex-shrink-0">{'\u{25CF}'}</span>
            <div className="flex-1 min-w-0">
              <span className="text-content-secondary">{primary[1].text}</span>
              <div className="flex items-center gap-2 text-[10px] mt-0.5">
                <span className="text-red-400 font-medium">PRIMARY</span>
                <span
                  className={HYPOTHESIS_STATUS_COLORS[primary[1].status] ?? 'text-content-muted'}
                >
                  {primary[1].status}
                </span>
                {primary[1].factor && (
                  <span className="text-content-muted">{primary[1].factor}</span>
                )}
              </div>
            </div>
          </div>
        )}
        {contributing.map(([id, h]) => (
          <div key={id} className="flex items-start gap-1.5 text-[11px]">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">{'\u25C7'}</span>
            <div className="flex-1 min-w-0">
              <span className="text-content-secondary">{h.text}</span>
              <div className="flex items-center gap-2 text-[10px] mt-0.5">
                <span className="text-amber-400 font-medium">CONTRIBUTING</span>
                <span className={HYPOTHESIS_STATUS_COLORS[h.status] ?? 'text-content-muted'}>
                  {h.status}
                </span>
                {h.factor && <span className="text-content-muted">{h.factor}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full text-left"
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
                  className={`px-2 py-1 text-[10px] rounded border border-edge/50 hover:border-blue-500/50 transition-colors ${effectiveColors[eff]}`}
                >
                  {effectiveLabels[eff]}
                </button>
              ))}
            </div>
          )}
          {outcome && (
            <div className="text-[11px]">
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
                  className={`ml-2 text-[10px] ${
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
