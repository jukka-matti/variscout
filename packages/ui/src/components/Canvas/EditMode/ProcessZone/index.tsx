import { useDroppable } from '@dnd-kit/core';
import type { FC } from 'react';
import { encodeProcessDropId } from './encodeProcessDropId';
import { StepBox, type StepBoxStep } from './StepBox';

export interface ProcessStructureZoneProps {
  steps: StepBoxStep[];
}

export const ProcessStructureZone: FC<ProcessStructureZoneProps> = ({ steps }) => {
  const { setNodeRef, isOver } = useDroppable({ id: encodeProcessDropId() });

  const borderClass = isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge';

  return (
    <div
      ref={setNodeRef}
      data-testid="process-structure-zone"
      className={`flex min-h-0 flex-1 flex-col gap-2 rounded-md ${borderClass} bg-surface-secondary p-3`}
    >
      {steps.length === 0 ? (
        <p className="text-sm text-content-tertiary">
          Drop a categorical column to define process steps
        </p>
      ) : (
        <div className="flex flex-row flex-wrap items-start gap-2">
          {[...steps]
            .sort((a, b) => a.order - b.order)
            .map(step => (
              <StepBox key={step.id} step={step} />
            ))}
        </div>
      )}
    </div>
  );
};

export default ProcessStructureZone;
