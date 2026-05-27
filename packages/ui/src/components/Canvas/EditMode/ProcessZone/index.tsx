import { useDroppable } from '@dnd-kit/core';
import React, { type FC, type ReactNode } from 'react';
import { encodeProcessDropId } from './encodeProcessDropId';
import { StepBox, type StepBoxStep } from './StepBox';

export interface ProcessStructureZoneProps {
  steps: StepBoxStep[];
  /**
   * D1 slot — timing badge nodes keyed by step id. Each entry is forwarded
   * as `timingBadge` to the matching `<StepBox>`. Absent or undefined entries
   * render no badge (default `{}`).
   */
  timingByStepId?: Record<string, ReactNode>;
}

export const ProcessStructureZone: FC<ProcessStructureZoneProps> = ({
  steps,
  timingByStepId = {},
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: encodeProcessDropId() });

  const borderClass = isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge';

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      data-testid="process-structure-zone"
      className={`flex min-h-0 flex-1 flex-col gap-2 rounded-md ${borderClass} bg-surface-secondary p-3`}
    >
      {sortedSteps.length === 0 ? (
        <p className="text-sm text-content-tertiary">
          Drop a categorical column to define process steps
        </p>
      ) : (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {sortedSteps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <StepBox step={step} timingBadge={timingByStepId?.[step.id]} />
              {idx < sortedSteps.length - 1 ? (
                <span
                  data-testid={`process-step-connector-${idx}`}
                  className="text-content-tertiary"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessStructureZone;
