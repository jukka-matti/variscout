import React from 'react';
import type {
  JourneyPhase,
  InvestigationPhase,
  Finding,
  Hypothesis,
  EntryScenario,
} from '@variscout/core';
import { DiamondPhaseMap } from './DiamondPhaseMap';
import { PDCAProgress } from './PDCAProgress';

export interface ScoutHint {
  text: string;
  type: 'contribution' | 'violation' | 'capability';
}

export interface CoachPopoverProps {
  phase: JourneyPhase;
  entryScenario?: EntryScenario;
  coachingText?: string;
  onClose: () => void;
  // SCOUT props
  scoutHints?: ScoutHint[];
  drillSuggestion?: string;
  // INVESTIGATE props
  investigationPhase?: InvestigationPhase;
  uncoveredFactors?: Array<{ factor: string; role: string }>;
  // IMPROVE props
  findings?: Finding[];
  hypotheses?: Hypothesis[];
  hasStagedData?: boolean;
}

const HINT_ICONS: Record<string, string> = {
  contribution: '\u03B7\u00B2',
  violation: '!',
  capability: 'Cpk',
};

const VERIFICATION_CHECKLIST = [
  'I-Chart: are violations reduced?',
  'Stats: did Cpk improve toward target?',
  'Boxplot: did the problem factor improve?',
  'Side effects: nothing else degraded?',
  'Outcome: recorded in finding',
];

/**
 * Phase-switched popover content for the JourneyPhaseStrip.
 * Reuses DiamondPhaseMap and PDCAProgress sub-components.
 */
const CoachPopover: React.FC<CoachPopoverProps> = ({
  phase,
  coachingText,
  scoutHints,
  drillSuggestion,
  investigationPhase,
  uncoveredFactors,
  findings,
  hypotheses,
  hasStagedData,
}) => {
  return (
    <div
      className="w-72 bg-surface-secondary border border-edge rounded-xl shadow-xl p-3 space-y-3"
      data-testid="coach-popover"
    >
      {/* Coaching text */}
      {coachingText && (
        <p className="text-xs text-content-secondary leading-relaxed">{coachingText}</p>
      )}

      {/* ---- SCOUT ---- */}
      {phase === 'scout' && (
        <>
          {scoutHints && scoutHints.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                Key Observations
              </div>
              <div className="space-y-1">
                {scoutHints.map((hint, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface text-[11px] text-content-secondary leading-relaxed"
                  >
                    <span className="flex-shrink-0 text-[9px] font-mono text-content-muted mt-0.5 w-4 text-center">
                      {HINT_ICONS[hint.type] ?? '?'}
                    </span>
                    <span>{hint.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {drillSuggestion && (
            <p className="text-[11px] text-content-secondary leading-relaxed px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
              {drillSuggestion}
            </p>
          )}
        </>
      )}

      {/* ---- INVESTIGATE ---- */}
      {phase === 'investigate' && (
        <>
          <DiamondPhaseMap phase={investigationPhase} />
          {uncoveredFactors && uncoveredFactors.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                Uninvestigated Factors
              </div>
              <div className="space-y-1">
                {uncoveredFactors.map(({ factor, role }) => (
                  <div key={factor} className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                      {role}
                    </span>
                    <span className="text-content-secondary">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ---- IMPROVE ---- */}
      {phase === 'improve' && (
        <>
          <PDCAProgress findings={findings ?? []} hypotheses={hypotheses} />
          {hasStagedData && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                Verification Checklist
              </div>
              <ul className="space-y-1">
                {VERIFICATION_CHECKLIST.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[11px] text-content-secondary leading-relaxed"
                  >
                    <span className="text-content-muted mt-0.5">&#9744;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { CoachPopover };
