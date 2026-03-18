import React from 'react';
import type { JourneyPhase } from '@variscout/core';

export interface JourneyPhaseIndicatorProps {
  phase: JourneyPhase;
}

const phaseConfig: Record<JourneyPhase, { label: string; color: string; activeColor: string }> = {
  frame: {
    label: 'Setting up',
    color: 'border-blue-500/40',
    activeColor: 'bg-blue-500 border-blue-500',
  },
  scout: {
    label: 'Exploring patterns',
    color: 'border-green-500/40',
    activeColor: 'bg-green-500 border-green-500',
  },
  investigate: {
    label: 'Investigating causes',
    color: 'border-amber-500/40',
    activeColor: 'bg-amber-500 border-amber-500',
  },
  improve: {
    label: 'Improving process',
    color: 'border-purple-500/40',
    activeColor: 'bg-purple-500 border-purple-500',
  },
};

const PHASES: JourneyPhase[] = ['frame', 'scout', 'investigate', 'improve'];

const PHASE_NAMES: Record<JourneyPhase, string> = {
  frame: 'Frame',
  scout: 'Scout',
  investigate: 'Investigate',
  improve: 'Improve',
};

const JourneyPhaseIndicator: React.FC<JourneyPhaseIndicatorProps> = ({ phase }) => {
  const currentIndex = PHASES.indexOf(phase);

  return (
    <div data-testid="journey-phase-indicator">
      {/* Step dots with connecting lines */}
      <div className="flex items-center gap-0 mb-1.5">
        {PHASES.map((p, i) => {
          const config = phaseConfig[p];
          const isCurrent = p === phase;
          const isPast = i < currentIndex;

          return (
            <React.Fragment key={p}>
              {i > 0 && (
                <div className={`flex-1 h-px ${isPast ? 'bg-content-muted/40' : 'bg-edge'}`} />
              )}
              <div className="flex flex-col items-center" style={{ minWidth: 8 }}>
                <div
                  className={`w-2 h-2 rounded-full border ${
                    isCurrent
                      ? config.activeColor
                      : isPast
                        ? 'bg-content-muted/30 border-content-muted/40'
                        : config.color
                  }`}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex justify-between">
        {PHASES.map(p => {
          const isCurrent = p === phase;
          return (
            <span
              key={p}
              className={`text-[9px] uppercase tracking-wider ${
                isCurrent ? 'text-content font-medium' : 'text-content-muted'
              }`}
            >
              {PHASE_NAMES[p]}
            </span>
          );
        })}
      </div>

      {/* Current phase description */}
      <p className="text-[11px] text-content-secondary leading-relaxed mt-1.5">
        {phaseConfig[phase].label}
      </p>
    </div>
  );
};

export { JourneyPhaseIndicator };
