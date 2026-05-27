import type { FC } from 'react';

export interface StepBoxStep {
  id: string;
  name: string;
  order: number;
}

export interface StepBoxProps {
  step: StepBoxStep;
}

export const StepBox: FC<StepBoxProps> = ({ step }) => (
  <div
    data-testid={`step-box-${step.id}`}
    className="flex min-w-0 flex-col rounded-md border border-edge bg-surface-primary p-2"
  >
    <header className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-secondary text-xs text-content-secondary">
        {step.order + 1}
      </span>
      <span className="truncate text-sm font-medium text-content">{step.name}</span>
    </header>
  </div>
);
