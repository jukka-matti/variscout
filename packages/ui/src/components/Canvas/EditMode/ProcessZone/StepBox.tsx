import { useDroppable } from '@dnd-kit/core';
import type { FC } from 'react';
import { encodeOutcomeDropId } from '../OutcomeZone/encodeOutcomeDropId';

export interface StepBoxStep {
  id: string;
  name: string;
  order: number;
}

export interface StepBoxProps {
  step: StepBoxStep;
}

export const StepBox: FC<StepBoxProps> = ({ step }) => {
  const internalY = useDroppable({ id: encodeOutcomeDropId({ stepId: step.id }) });

  return (
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

      <section
        ref={internalY.setNodeRef}
        data-testid={`step-box-${step.id}-internal-y`}
        className={`mt-2 rounded-sm p-2 ${
          internalY.isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge'
        }`}
      >
        <p className="text-xs text-content-tertiary">
          {"Drop a numeric column for this step's outcome"}
        </p>
      </section>
    </div>
  );
};
