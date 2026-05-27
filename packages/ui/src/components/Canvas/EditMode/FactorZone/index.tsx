import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
import { FactorChip } from './FactorChip';
import { FactorSpecsPopover } from './FactorSpecsPopover';
import { encodeFactorDropId } from './encodeFactorDropId';

export interface FactorZoneProps {
  controls: ImprovementProjectFactorControl[];
  steps: { id: string; name: string }[];
  /**
   * Plumbed for parent-level DnD routing; FactorZone itself does not consume drops.
   * The DndContext parent (Canvas/index.tsx) calls handleFactorDrop() which invokes this.
   */
  onControlAdd: (columnName: string, stepId?: string) => void;
  onControlUpdate: (originalFactorName: string, updated: ImprovementProjectFactorControl) => void;
}

interface OpenPopover {
  factorName: string;
  anchor: { x: number; y: number };
}

export function FactorZone({
  controls,
  steps,
  onControlAdd: _onControlAdd,
  onControlUpdate,
}: FactorZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: encodeFactorDropId('global') });
  const [openPopover, setOpenPopover] = useState<OpenPopover | null>(null);

  const containerBorder = isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge';
  const activeControl = openPopover
    ? controls.find(c => c.factor === openPopover.factorName)
    : null;

  return (
    <div
      ref={setNodeRef}
      data-testid="factor-zone-global"
      className={`flex min-h-[6rem] flex-col gap-2 rounded-md p-3 ${containerBorder}`}
    >
      {controls.length === 0 ? (
        <p className="text-sm text-content-tertiary">Drop a column to set a factor</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {controls.map(control => (
            <FactorChip
              key={control.factor}
              control={control}
              onSpecsClick={anchor => setOpenPopover({ factorName: control.factor, anchor })}
            />
          ))}
        </div>
      )}
      {openPopover && activeControl && (
        <FactorSpecsPopover
          control={activeControl}
          anchor={openPopover.anchor}
          steps={steps}
          onApply={updated => {
            onControlUpdate(activeControl.factor, updated);
            setOpenPopover(null);
          }}
          onClose={() => setOpenPopover(null)}
        />
      )}
    </div>
  );
}

export default FactorZone;
