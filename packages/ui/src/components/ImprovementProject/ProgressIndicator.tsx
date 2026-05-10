import React from 'react';

const DEFAULT_STEPS = [
  'Project metadata',
  'Background / Current State',
  'Goal',
  'Investigation lineage',
  'Approach / Countermeasures',
  'Outcome reference',
];

export interface ProgressIndicatorProps {
  currentStep?: number;
  steps?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep = 1,
  steps = DEFAULT_STEPS,
}) => {
  const boundedCurrentStep = Math.min(Math.max(currentStep, 1), steps.length);

  return (
    <ol aria-label="Improvement project progress" className="grid grid-cols-6 gap-2">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const state =
          stepNumber < boundedCurrentStep
            ? 'complete'
            : stepNumber === boundedCurrentStep
              ? 'current'
              : 'upcoming';

        return (
          <li
            key={label}
            aria-label={`Step ${stepNumber} of ${steps.length}, ${label}, ${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
            className="min-w-0"
          >
            <span
              className={`block h-2 rounded-full ${
                state === 'complete'
                  ? 'bg-content'
                  : state === 'current'
                    ? 'bg-accent'
                    : 'bg-surface-secondary'
              }`}
            />
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ol>
  );
};
