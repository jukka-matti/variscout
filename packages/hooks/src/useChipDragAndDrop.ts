import { useCallback, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';

export const CHIP_DRAG_PREFIX = 'chip:';
export const STEP_DROP_PREFIX = 'step:';
export const CANVAS_EMPTY_DROP_ID = 'canvas:empty';

export interface UseChipDragAndDropArgs {
  onPlace: (chipId: string, stepId: string) => void;
  onCreateStep: (chipId: string) => void;
}

export interface UseChipDragAndDropResult {
  handleDragEnd: (event: DragEndEvent) => void;
}

export function encodeChipDragId(chipId: string): string {
  return `${CHIP_DRAG_PREFIX}${chipId}`;
}

export function decodeChipDragId(id: string): string | null {
  if (!id.startsWith(CHIP_DRAG_PREFIX)) return null;
  const chipId = id.slice(CHIP_DRAG_PREFIX.length);
  return chipId.length > 0 ? chipId : null;
}

export function encodeStepDropId(stepId: string): string {
  return `${STEP_DROP_PREFIX}${stepId}`;
}

export function decodeStepDropId(id: string): string | null {
  if (!id.startsWith(STEP_DROP_PREFIX)) return null;
  const stepId = id.slice(STEP_DROP_PREFIX.length);
  return stepId.length > 0 ? stepId : null;
}

export function useChipDragAndDrop({
  onPlace,
  onCreateStep,
}: UseChipDragAndDropArgs): UseChipDragAndDropResult {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const chipId = decodeChipDragId(String(event.active.id));
      if (!chipId) return;

      const overId = event.over ? String(event.over.id) : null;
      if (!overId) return;

      if (overId === CANVAS_EMPTY_DROP_ID) {
        onCreateStep(chipId);
        return;
      }

      const stepId = decodeStepDropId(overId);
      if (!stepId) return;

      onPlace(chipId, stepId);
    },
    [onCreateStep, onPlace]
  );

  return useMemo(() => ({ handleDragEnd }), [handleDragEnd]);
}
