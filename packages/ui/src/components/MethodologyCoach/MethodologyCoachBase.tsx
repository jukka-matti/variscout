import React, { useState, useCallback, useMemo } from 'react';
import { PanelRightOpen, PanelRightClose, Copy, Check } from 'lucide-react';
import type { JourneyPhase, InvestigationPhase, Hypothesis, Finding } from '@variscout/core';
import { JourneyPhaseIndicator } from './JourneyPhaseIndicator';
import { DiamondPhaseMap } from './DiamondPhaseMap';
import { PDCAProgress } from './PDCAProgress';

// ---------------------------------------------------------------------------
// Color scheme
// ---------------------------------------------------------------------------

export interface MethodologyCoachColorScheme {
  container: string;
  headerBg: string;
  sectionBg: string;
}

export const defaultMethodologyCoachColorScheme: MethodologyCoachColorScheme = {
  container: 'bg-surface-secondary border-l border-edge',
  headerBg: 'bg-surface-tertiary/30',
  sectionBg: 'bg-surface',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MethodologyCoachBaseProps {
  journeyPhase: JourneyPhase;
  // FRAME phase
  frameChecklist?: {
    dataLoaded: boolean;
    outcomeSelected: boolean;
    factorsMapped: number;
    totalFactors: number;
    specsSet: boolean;
  };
  // SCOUT phase
  scoutHints?: Array<{ text: string; type: 'contribution' | 'violation' | 'capability' }>;
  drillSuggestion?: string;
  // INVESTIGATE phase
  investigationPhase?: InvestigationPhase;
  hypotheses?: Hypothesis[];
  factorRoles?: Record<string, string>;
  suggestedQuestions?: string[];
  // IMPROVE phase
  findings?: Finding[];
  hasStagedData?: boolean;
  // UI state
  collapsed: boolean;
  onToggle: () => void;
  colorScheme?: Partial<MethodologyCoachColorScheme>;
}

// ---------------------------------------------------------------------------
// Verification checklist (reused from InvestigationSidebar)
// ---------------------------------------------------------------------------

const VERIFICATION_CHECKLIST = [
  'I-Chart: are violations reduced?',
  'Stats: did Cpk improve toward target?',
  'Boxplot: did the problem factor improve?',
  'Side effects: nothing else degraded?',
  'Outcome: recorded in finding',
];

// ---------------------------------------------------------------------------
// Hint type icons
// ---------------------------------------------------------------------------

const HINT_ICONS: Record<string, string> = {
  contribution: '\u03B7\u00B2', // eta-squared
  violation: '!',
  capability: 'Cpk',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MethodologyCoachBase: React.FC<MethodologyCoachBaseProps> = ({
  journeyPhase,
  frameChecklist,
  scoutHints,
  drillSuggestion,
  investigationPhase,
  hypotheses,
  factorRoles,
  suggestedQuestions,
  findings,
  hasStagedData,
  collapsed,
  onToggle,
  colorScheme: schemeProp,
}) => {
  const scheme = { ...defaultMethodologyCoachColorScheme, ...schemeProp };

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = useCallback((question: string, index: number) => {
    navigator.clipboard.writeText(question).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Uncovered factor roles (factors with no hypothesis linked)
  const uncoveredRoles = useMemo(() => {
    if (!factorRoles) return [];
    const coveredFactors = new Set((hypotheses ?? []).filter(h => h.factor).map(h => h.factor!));
    return Object.entries(factorRoles)
      .filter(([factor]) => !coveredFactors.has(factor))
      .map(([factor, role]) => ({ factor, role }));
  }, [factorRoles, hypotheses]);

  // Toggle button (always visible)
  const toggleButton = (
    <button
      onClick={onToggle}
      className="absolute -left-8 top-3 p-1.5 rounded-l-lg bg-surface-secondary border border-r-0 border-edge text-content-muted hover:text-content transition-colors z-10"
      title={collapsed ? 'Show methodology coach' : 'Hide methodology coach'}
      aria-label={collapsed ? 'Show methodology coach' : 'Hide methodology coach'}
      data-testid="methodology-coach-toggle"
    >
      {collapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
    </button>
  );

  if (collapsed) {
    return (
      <div className="relative flex-shrink-0" data-testid="methodology-coach">
        {toggleButton}
      </div>
    );
  }

  return (
    <div
      className={`relative w-[280px] flex-shrink-0 ${scheme.container} overflow-y-auto hidden sm:block`}
      data-testid="methodology-coach"
    >
      {toggleButton}

      <div className="p-3 space-y-4">
        {/* Journey phase indicator (always shown) */}
        <JourneyPhaseIndicator phase={journeyPhase} />

        {/* ---- FRAME phase content ---- */}
        {journeyPhase === 'frame' && frameChecklist && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
              Setup Checklist
            </div>
            <div className="space-y-1">
              <ChecklistItem done={frameChecklist.dataLoaded} label="Data loaded" />
              <ChecklistItem
                done={frameChecklist.outcomeSelected}
                label="Outcome column selected"
              />
              <ChecklistItem
                done={frameChecklist.factorsMapped > 0}
                label={`Factors mapped (${frameChecklist.factorsMapped}/${frameChecklist.totalFactors})`}
              />
              <ChecklistItem done={frameChecklist.specsSet} label="Specification limits set" />
            </div>
          </div>
        )}

        {/* ---- SCOUT phase content ---- */}
        {journeyPhase === 'scout' && (
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
                      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg ${scheme.sectionBg} text-[11px] text-content-secondary leading-relaxed`}
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
              <div>
                <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                  Suggested Next Step
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  {drillSuggestion}
                </p>
              </div>
            )}
          </>
        )}

        {/* ---- INVESTIGATE phase content ---- */}
        {journeyPhase === 'investigate' && (
          <>
            <DiamondPhaseMap phase={investigationPhase} />

            {/* Uncovered factor roles */}
            {uncoveredRoles.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                  Uninvestigated Factors
                </div>
                <div className="space-y-1">
                  {uncoveredRoles.map(({ factor, role }) => (
                    <div
                      key={factor}
                      className="flex items-center gap-1.5 text-[11px]"
                      data-testid={`uncovered-factor-${factor}`}
                    >
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                        {role}
                      </span>
                      <span className="text-content-secondary">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
                  Ask CoScout
                </div>
                <div className="space-y-1">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopyQuestion(q, i)}
                      className={`w-full text-left flex items-start gap-1.5 px-2 py-1.5 rounded-lg ${scheme.sectionBg} text-[11px] text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors group`}
                      title="Copy to clipboard — paste in main window CoScout"
                      data-testid={`coach-question-${i}`}
                    >
                      <span className="flex-1 leading-relaxed">{q}</span>
                      {copiedIndex === i ? (
                        <Check size={10} className="flex-shrink-0 mt-0.5 text-green-400" />
                      ) : (
                        <Copy
                          size={10}
                          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-50 transition-opacity"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---- IMPROVE phase content ---- */}
        {journeyPhase === 'improve' && (
          <>
            <PDCAProgress findings={findings ?? []} hypotheses={hypotheses} />

            {/* Verification checklist (when staged data is available) */}
            {hasStagedData && (
              <div data-testid="verification-checklist">
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
    </div>
  );
};

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

interface ChecklistItemProps {
  done: boolean;
  label: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ done, label }) => (
  <div className="flex items-center gap-1.5 text-[11px]">
    <span className={`flex-shrink-0 ${done ? 'text-green-500' : 'text-content-muted'}`}>
      {done ? '\u2611' : '\u2610'}
    </span>
    <span className={done ? 'text-content' : 'text-content-secondary'}>{label}</span>
  </div>
);

export { MethodologyCoachBase };
