import { useDroppable } from '@dnd-kit/core';
import type { FC, ReactNode } from 'react';
import { encodeOutcomeDropId } from '../OutcomeZone/encodeOutcomeDropId';
import { encodeFactorDropId } from '../FactorZone/encodeFactorDropId';
import { ExploreJumpButton } from '../ExploreJumpButton';

export interface StepBoxStep {
  id: string;
  name: string;
  order: number;
}

export interface StepBoxProps {
  step: StepBoxStep;
  /** D1 slot — step timing badge (e.g. "⏱ ~ 42 min"). Rendered at the right edge of the header when provided. */
  timingBadge?: ReactNode;
  /** Future slot — resource indicator (e.g. "× 2 reactors"). Rendered after timingBadge when provided. */
  resourceIndicator?: ReactNode;
  /** LV1-D — fires when user clicks the Explore jump affordance for this step. */
  onExploreJumpClick?: () => void;
}

export const StepBox: FC<StepBoxProps> = ({
  step,
  timingBadge,
  resourceIndicator,
  onExploreJumpClick,
}) => {
  const internalY = useDroppable({ id: encodeOutcomeDropId({ stepId: step.id }) });
  const internalX = useDroppable({ id: encodeFactorDropId({ stepId: step.id }) });

  return (
    <div
      data-testid={`step-box-${step.id}`}
      className="group flex min-w-0 flex-col rounded-md border border-edge bg-surface-primary p-2"
    >
      <header className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-secondary text-xs text-content-secondary">
          {step.order + 1}
        </span>
        <span className="truncate text-sm font-medium text-content">{step.name}</span>
        {timingBadge ? (
          <span className="ml-auto text-xs text-content-secondary">{timingBadge}</span>
        ) : null}
        {resourceIndicator ? (
          <span className="text-xs text-content-secondary">{resourceIndicator}</span>
        ) : null}
        {onExploreJumpClick && <ExploreJumpButton label={step.name} onClick={onExploreJumpClick} />}
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

      <section
        ref={internalX.setNodeRef}
        data-testid={`step-box-${step.id}-internal-x`}
        className={`mt-2 rounded-sm p-2 ${
          internalX.isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge'
        }`}
      >
        <p className="text-xs text-content-tertiary">{"Drop a column for this step's factor"}</p>
      </section>
    </div>
  );
};
