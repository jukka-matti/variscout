import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import type { OutcomeSpec } from '@variscout/core';
import type { ChipNavigationTarget } from '../handlers/navigateToExploreForChip';
import { OutcomeCard } from './OutcomeCard';
import { OutcomeSpecsPopover } from './OutcomeSpecsPopover';
import { encodeOutcomeDropId } from './encodeOutcomeDropId';

export interface OutcomeZoneProps {
  specs: OutcomeSpec[];
  /**
   * Numeric values per column, plumbed through for Task 7's drag-end →
   * `deriveDefaultSpecs` chain at the `DndContext` parent. Unused inside the
   * zone itself; accepted here so the inlined edit chrome can pass through
   * unchanged.
   */
  numericValuesByColumn: Record<string, number[]>;
  /**
   * Fired when a new outcome should be created (drop landed). Wired by Task 7
   * at the DndContext parent. Currently unused inside the zone; kept on the
   * props surface so callers can pre-wire it.
   */
  onSpecAdd: (columnName: string, derived: Partial<OutcomeSpec>) => void;
  onSpecUpdate: (specId: string, updated: OutcomeSpec) => void;
  /** LV1-D — fires when user clicks the Explore jump affordance for a chip. */
  onChipExploreJump?: (target: ChipNavigationTarget) => void;
}

interface OpenSpecs {
  specId: string;
  anchor: { x: number; y: number };
}

export function OutcomeZone({
  specs,
  // Plumbed for Task 7 drag-end chain at DndContext parent; unused inside the zone itself.
  numericValuesByColumn: _numericValuesByColumn,
  // Plumbed for Task 7 drag-end chain at DndContext parent; unused inside the zone itself.
  onSpecAdd: _onSpecAdd,
  onSpecUpdate,
  onChipExploreJump,
}: OutcomeZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: encodeOutcomeDropId('singleton') });
  const [openSpecs, setOpenSpecs] = useState<OpenSpecs | null>(null);

  const containerBorder = isOver ? 'border-2 border-dashed border-cyan-400' : 'border border-edge';
  const activeSpec = openSpecs ? specs.find(s => s.id === openSpecs.specId) : null;

  return (
    <div
      ref={setNodeRef}
      data-testid="outcome-zone"
      className={`flex min-h-[6rem] flex-col gap-2 rounded-md p-3 ${containerBorder}`}
    >
      {specs.length === 0 ? (
        <p className="text-sm text-content-tertiary">Drop a numeric column to set an outcome</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {specs.map(spec => (
            <OutcomeCard
              key={spec.id}
              spec={spec}
              onSpecsClick={anchor => setOpenSpecs({ specId: spec.id, anchor })}
              onExploreJumpClick={
                onChipExploreJump
                  ? () => onChipExploreJump({ kind: 'outcome', columnName: spec.columnName })
                  : undefined
              }
            />
          ))}
        </div>
      )}
      {openSpecs && activeSpec && (
        <OutcomeSpecsPopover
          spec={activeSpec}
          anchor={openSpecs.anchor}
          onApply={updated => {
            onSpecUpdate(activeSpec.id, updated);
            setOpenSpecs(null);
          }}
          onClose={() => setOpenSpecs(null)}
        />
      )}
    </div>
  );
}

export default OutcomeZone;
