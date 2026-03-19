import React, { useMemo } from 'react';
import type { Finding, Hypothesis } from '@variscout/core';

export interface PDCAProgressProps {
  findings: Finding[];
  hypotheses?: Hypothesis[];
  /** Whether the convergence synthesis has been written */
  hasSynthesis?: boolean;
}

interface PDCAStep {
  label: string;
  description: string;
  done: boolean;
  inProgress?: boolean;
  detail?: string;
  /** Methodology hint shown below the detail line */
  hint?: string;
}

const PDCAProgress: React.FC<PDCAProgressProps> = ({
  findings,
  hypotheses: _hypotheses,
  hasSynthesis,
}) => {
  const steps = useMemo((): PDCAStep[] => {
    // Plan: at least one finding has a linked hypothesis
    const findingsWithHypothesis = findings.filter(f => f.hypothesisId);
    const planDone = findingsWithHypothesis.length > 0;

    // Do: count actions across all findings
    const allActions = findings.flatMap(f => f.actions ?? []);
    const totalActions = allActions.length;
    const completedActions = allActions.filter(a => a.completedAt).length;
    const doInProgress = totalActions > 0 && completedActions < totalActions;
    const doDone = totalActions > 0 && completedActions === totalActions;

    // Check: any finding has an outcome recorded
    const findingsWithOutcome = findings.filter(f => f.outcome);
    const checkDone = findingsWithOutcome.length > 0;

    // Act: any finding with outcome effective === 'yes' or resolved status
    const actDone = findings.some(f => f.outcome?.effective === 'yes' || f.status === 'resolved');

    return [
      {
        label: 'Plan',
        description: 'Cause identified',
        done: planDone,
        detail: planDone
          ? `${findingsWithHypothesis.length} finding${findingsWithHypothesis.length !== 1 ? 's' : ''} linked${hasSynthesis ? ' \u00b7 Synthesis written' : ''}`
          : undefined,
        hint: !planDone ? undefined : 'Ideate: Prevent, Detect, Simplify, Eliminate',
      },
      {
        label: 'Do',
        description: 'Actions in progress',
        done: doDone,
        inProgress: doInProgress,
        detail: totalActions > 0 ? `${completedActions}/${totalActions} actions done` : undefined,
      },
      {
        label: 'Check',
        description: 'Collect After data to verify',
        done: checkDone,
      },
      {
        label: 'Act',
        description: 'Record outcome',
        done: actDone,
      },
    ];
  }, [findings, hasSynthesis]);

  return (
    <div data-testid="pdca-progress">
      <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-2">
        PDCA Cycle
      </div>
      <div className="space-y-1.5">
        {steps.map(step => (
          <div key={step.label} className="flex items-start gap-2">
            {/* Checkbox */}
            <span className="flex-shrink-0 text-[13px] leading-none mt-px">
              {step.done ? (
                <span className="text-green-500">&#9745;</span>
              ) : step.inProgress ? (
                <span className="text-amber-500">&#9744;</span>
              ) : (
                <span className="text-content-muted">&#9744;</span>
              )}
            </span>
            {/* Content */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-medium ${
                    step.done
                      ? 'text-content'
                      : step.inProgress
                        ? 'text-amber-500'
                        : 'text-content-secondary'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-content-muted">{step.description}</span>
              </div>
              {step.detail && (
                <span className="text-[10px] text-content-muted leading-tight block mt-0.5">
                  {step.detail}
                </span>
              )}
              {step.hint && (
                <span className="text-[10px] text-blue-400 leading-tight block mt-0.5 italic">
                  {step.hint}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { PDCAProgress };
