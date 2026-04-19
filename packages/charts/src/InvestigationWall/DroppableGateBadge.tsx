/**
 * DroppableGateBadge — dnd-kit droppable wrapper around GateBadge.
 *
 * Uses `useDroppable` to register the gate as a drop target for hub drops.
 * Must be rendered inside a `<DndContext>`. The `gatePath` prop is encoded
 * into the droppable id so `useWallDragDrop` can decode it on drop.
 *
 * Visual feedback: when a compatible hub is hovering, the badge's wrapper
 * gets `data-drop-over="true"` for CSS-driven highlighting (caller styles).
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { GatePath } from '@variscout/core';
import { GateBadge, type GateBadgeProps } from './GateBadge';
import { encodeGatePath } from './hooks/useWallDragDrop';

export interface DroppableGateBadgeProps extends Omit<GateBadgeProps, 'gatePath'> {
  /**
   * Structured gate path — the droppable id is derived from this via
   * `encodeGatePath`. GateBadge expects a string gatePath; we serialize
   * the structured path for its onRun/onContextMenu callbacks too so
   * downstream consumers can decode consistently.
   */
  path: GatePath;
}

export const DroppableGateBadge: React.FC<DroppableGateBadgeProps> = ({ path, ...rest }) => {
  const droppableId = encodeGatePath(path);
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  // See DraggableHypothesisCard for the SVG ref cast rationale.
  const setSvgRef = setNodeRef as unknown as React.Ref<SVGGElement>;

  return (
    <g
      ref={setSvgRef}
      data-drop-target="gate"
      data-drop-path={droppableId}
      data-drop-over={isOver ? 'true' : 'false'}
    >
      <GateBadge {...rest} gatePath={droppableId} />
    </g>
  );
};
