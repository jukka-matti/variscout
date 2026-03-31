import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardCheck } from 'lucide-react';
import type { Hypothesis } from '@variscout/core';

export interface InvestigationConclusionProps {
  /** Questions marked as suspected causes */
  suspectedCauses: Hypothesis[];
  /** Questions marked as ruled out (negative learnings) */
  ruledOut: Hypothesis[];
  /** Questions marked as contributing */
  contributing: Hypothesis[];
  /** Synthesized problem statement */
  problemStatement?: string;
  /** Whether the investigation has enough evidence for conclusions */
  hasConclusions: boolean;
}

/** Format evidence percentage from a hypothesis */
function evidencePercent(h: Hypothesis): string | null {
  const r2 = h.evidence?.rSquaredAdj;
  const eta = h.evidence?.etaSquared;
  const value = r2 ?? eta;
  if (value == null) return null;
  const label = r2 != null ? 'R²adj' : 'η²';
  return `${label} ${Math.round(value * 100)}%`;
}

/** Sort hypotheses by evidence strength (highest first) */
function sortByEvidenceDesc(a: Hypothesis, b: Hypothesis): number {
  const aVal = a.evidence?.rSquaredAdj ?? a.evidence?.etaSquared ?? -1;
  const bVal = b.evidence?.rSquaredAdj ?? b.evidence?.etaSquared ?? -1;
  return bVal - aVal;
}

const InvestigationConclusion: React.FC<InvestigationConclusionProps> = ({
  suspectedCauses,
  ruledOut,
  contributing,
  problemStatement,
  hasConclusions,
}) => {
  const [ruledOutExpanded, setRuledOutExpanded] = useState(false);

  if (!hasConclusions) return null;

  const sortedCauses = [...suspectedCauses].sort(sortByEvidenceDesc);
  const sortedContributing = [...contributing].sort(sortByEvidenceDesc);
  const sortedRuledOut = [...ruledOut].sort(sortByEvidenceDesc);

  return (
    <div className="space-y-3" data-testid="investigation-conclusion">
      {/* Section header */}
      <div className="flex items-center gap-1.5">
        <ClipboardCheck size={12} className="text-content-muted" />
        <span className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium">
          Investigation Conclusions
        </span>
      </div>

      {/* Suspected Causes */}
      {sortedCauses.length > 0 && (
        <div data-testid="suspected-causes">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[0.625rem] font-medium text-content-secondary">
              Suspected Causes
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[0.5625rem] font-medium">
              {sortedCauses.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {sortedCauses.map(h => (
              <CauseRow key={h.id} hypothesis={h} dotClass="bg-amber-500" />
            ))}
          </div>
        </div>
      )}

      {/* Contributing Factors */}
      {sortedContributing.length > 0 && (
        <div data-testid="contributing-factors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[0.625rem] font-medium text-content-secondary">Contributing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[0.5625rem] font-medium">
              {sortedContributing.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {sortedContributing.map(h => (
              <CauseRow key={h.id} hypothesis={h} dotClass="bg-blue-500" compact />
            ))}
          </div>
        </div>
      )}

      {/* Ruled Out (collapsed by default) */}
      {sortedRuledOut.length > 0 && (
        <div data-testid="ruled-out">
          <button
            onClick={() => setRuledOutExpanded(!ruledOutExpanded)}
            className="flex items-center gap-1 text-[0.625rem] font-medium text-content-secondary hover:text-content transition-colors mb-1.5"
            data-testid="ruled-out-toggle"
          >
            {ruledOutExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Ruled Out (negative learnings)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-secondary text-content-muted text-[0.5625rem] font-medium">
              {sortedRuledOut.length}
            </span>
          </button>
          {ruledOutExpanded && (
            <div className="space-y-0.5">
              {sortedRuledOut.map(h => (
                <div
                  key={h.id}
                  className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface opacity-50"
                  data-testid={`ruled-out-${h.id}`}
                >
                  {/* Gray dot */}
                  <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-content-muted/40" />
                  {/* Strikethrough text */}
                  <span className="flex-1 text-[0.6875rem] leading-relaxed text-content-secondary line-through">
                    {h.text}
                  </span>
                  {/* Evidence badge */}
                  {evidencePercent(h) && (
                    <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full bg-surface-secondary text-[0.5625rem] text-content-muted font-medium">
                      {evidencePercent(h)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Problem Statement */}
      {problemStatement && (
        <div className="border-l-2 border-green-500 pl-2.5 py-1.5" data-testid="problem-statement">
          <div className="text-[0.5625rem] uppercase tracking-wider text-content-muted font-medium mb-0.5">
            Problem Statement
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-content-secondary">
            {problemStatement}
          </p>
        </div>
      )}
    </div>
  );
};

/** Single cause/contributing row */
const CauseRow: React.FC<{
  hypothesis: Hypothesis;
  dotClass: string;
  compact?: boolean;
}> = ({ hypothesis, dotClass, compact }) => {
  const badge = evidencePercent(hypothesis);

  return (
    <div
      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface ${compact ? 'py-1' : ''}`}
      data-testid={`cause-${hypothesis.id}`}
    >
      {/* Status dot */}
      <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${dotClass}`} />
      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-content-secondary leading-relaxed ${compact ? 'text-[0.625rem]' : 'text-[0.6875rem]'}`}
        >
          {hypothesis.text}
        </span>
        {/* Factor + level */}
        {hypothesis.factor && (
          <span className="ml-1 text-[0.5625rem] text-content-muted">
            {hypothesis.factor}
            {hypothesis.level ? ` = ${hypothesis.level}` : ''}
          </span>
        )}
      </div>
      {/* Evidence badge */}
      {badge && (
        <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full bg-surface-secondary text-[0.5625rem] text-content-muted font-medium whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  );
};

export { InvestigationConclusion };
