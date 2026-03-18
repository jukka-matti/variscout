import React from 'react';
import type { InvestigationPhase } from '@variscout/core';

export interface DiamondPhaseMapProps {
  phase?: InvestigationPhase;
}

/** Diamond phases only (excluding 'improving' which belongs to PDCA) */
type DiamondPhase = 'initial' | 'diverging' | 'validating' | 'converging';

interface DiamondStep {
  phase: DiamondPhase;
  label: string;
  formalLabel: string;
  dotColor: string;
  activeDotColor: string;
}

const DIAMOND_STEPS: DiamondStep[] = [
  {
    phase: 'initial',
    label: 'First look',
    formalLabel: 'Initial',
    dotColor: 'border-slate-400/40',
    activeDotColor: 'bg-slate-400 border-slate-400',
  },
  {
    phase: 'diverging',
    label: 'Exploring possible causes',
    formalLabel: 'Diverging',
    dotColor: 'border-amber-400/40',
    activeDotColor: 'bg-amber-400 border-amber-400',
  },
  {
    phase: 'validating',
    label: 'Gathering evidence',
    formalLabel: 'Validating',
    dotColor: 'border-blue-400/40',
    activeDotColor: 'bg-blue-400 border-blue-400',
  },
  {
    phase: 'converging',
    label: 'Identifying suspected cause',
    formalLabel: 'Converging',
    dotColor: 'border-purple-400/40',
    activeDotColor: 'bg-purple-400 border-purple-400',
  },
];

const DiamondPhaseMap: React.FC<DiamondPhaseMapProps> = ({ phase }) => {
  // Map 'improving' to beyond converging (all diamond steps completed)
  const diamondPhase = phase === 'improving' ? undefined : phase;
  const currentIndex = diamondPhase
    ? DIAMOND_STEPS.findIndex(s => s.phase === diamondPhase)
    : DIAMOND_STEPS.length;

  return (
    <div data-testid="diamond-phase-map">
      <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-2">
        Investigation Diamond
      </div>
      <div className="space-y-1.5">
        {DIAMOND_STEPS.map((step, i) => {
          const isCurrent = step.phase === diamondPhase;
          const isPast = i < currentIndex;

          return (
            <div key={step.phase} className="flex items-start gap-2">
              {/* Dot */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full border-[1.5px] ${
                    isCurrent
                      ? step.activeDotColor
                      : isPast
                        ? 'bg-content-muted/30 border-content-muted/40'
                        : step.dotColor
                  }`}
                />
              </div>
              {/* Labels */}
              <div className="min-w-0">
                <span
                  className={`text-[11px] leading-tight block ${
                    isCurrent ? 'text-content font-medium' : 'text-content-secondary'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-content-muted">{step.formalLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { DiamondPhaseMap };
