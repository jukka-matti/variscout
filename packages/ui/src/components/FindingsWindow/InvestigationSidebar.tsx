import React, { useState, useCallback } from 'react';
import { Copy, Check, PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { Hypothesis, InvestigationPhase } from '@variscout/core';
import { InvestigationPhaseBadge } from '../InvestigationPhaseBadge';

export interface InvestigationSidebarProps {
  phase?: InvestigationPhase;
  hypotheses?: Hypothesis[];
  factorRoles?: Record<string, string>;
  suggestedQuestions?: string[];
  collapsed: boolean;
  onToggle: () => void;
  /** When true and phase is 'improving', shows a verification checklist */
  hasStagedData?: boolean;
}

const phaseDescriptions: Record<string, string> = {
  initial: 'Begin by examining charts for patterns. What stands out?',
  diverging: 'Explore multiple hypotheses across factor categories. Cast a wide net.',
  validating: 'Drill into factors to test hypotheses with data. Check contribution %.',
  converging: 'Synthesize findings into a suspected root cause. Brainstorm improvement ideas.',
  improving: 'IMPROVE phase: monitor corrective actions and verify effectiveness (PDCA).',
};

/**
 * Read-only investigation sidebar for the FindingsWindow popout.
 * No API calls — "Ask CoScout" copies question to clipboard.
 */
const VERIFICATION_CHECKLIST = [
  'I-Chart: are violations reduced?',
  'Stats: did Cpk improve toward target?',
  'Boxplot: did the problem factor improve?',
  'Side effects: nothing else degraded?',
  'Outcome: recorded in finding',
];

const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({
  phase,
  hypotheses,
  factorRoles,
  suggestedQuestions,
  collapsed,
  onToggle,
  hasStagedData,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = useCallback((question: string, index: number) => {
    navigator.clipboard.writeText(question).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Find uncovered factor roles (roles with no hypothesis linked)
  const uncoveredRoles = React.useMemo(() => {
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
      title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      aria-label={collapsed ? 'Show investigation sidebar' : 'Hide investigation sidebar'}
      data-testid="sidebar-toggle"
    >
      {collapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
    </button>
  );

  if (collapsed) {
    return (
      <div className="relative flex-shrink-0" data-testid="investigation-sidebar">
        {toggleButton}
      </div>
    );
  }

  const hasContent =
    phase ||
    uncoveredRoles.length > 0 ||
    (suggestedQuestions && suggestedQuestions.length > 0) ||
    (phase === 'improving' && hasStagedData);

  return (
    <div
      className="relative w-[280px] flex-shrink-0 border-l border-edge bg-surface-secondary overflow-y-auto hidden sm:block"
      data-testid="investigation-sidebar"
    >
      {toggleButton}

      <div className="p-3 space-y-4">
        {/* Phase section */}
        {phase && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-content-muted font-medium">
                Phase
              </span>
              <InvestigationPhaseBadge phase={phase} />
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              {phaseDescriptions[phase]}
            </p>
          </div>
        )}

        {/* Verification checklist — shown when improving phase + staged data */}
        {phase === 'improving' && hasStagedData && (
          <div data-testid="verification-checklist">
            <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">
              PDCA: Check — Verification
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
                  className="w-full text-left flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface text-[11px] text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors group"
                  title="Copy to clipboard — paste in main window CoScout"
                  data-testid={`sidebar-question-${i}`}
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

        {!hasContent && (
          <p className="text-[11px] text-content-muted italic">
            Investigation context will appear here when AI features are active.
          </p>
        )}
      </div>
    </div>
  );
};

export { InvestigationSidebar };
