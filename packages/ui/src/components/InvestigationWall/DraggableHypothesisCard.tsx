/**
 * DraggableHypothesisCard — dnd-kit draggable wrapper around HypothesisCard
 * (or HypothesisCardWithPlans when planningProps are supplied).
 *
 * Uses `useDraggable` to expose the hub as a drag source for gate composition.
 * Must be rendered inside a `<DndContext>` provided by WallCanvas (or a
 * similar container). Keeps HypothesisCard SVG-agnostic of dnd-kit — this
 * file owns the integration.
 *
 * The draggable id is `hub:<hubId>` (see `encodeHubDraggableId`), letting
 * `useWallDragDrop` round-trip the id without a payload.
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { HypothesisCard, type HypothesisCardProps } from './HypothesisCard';
import {
  HypothesisCardWithPlans,
  type HypothesisCardWithPlansProps,
} from './HypothesisCardWithPlans';
import { encodeHubDraggableId } from './hooks/useWallDragDrop';

/** Plan-related props forwarded to HypothesisCardWithPlans when provided. */
export type DraggableHypothesisCardPlanningProps = Omit<
  HypothesisCardWithPlansProps,
  keyof HypothesisCardProps
>;

export interface DraggableHypothesisCardProps extends HypothesisCardProps {
  /** When provided, renders HypothesisCardWithPlans instead of HypothesisCard. */
  planningProps?: DraggableHypothesisCardPlanningProps;
}

export const DraggableHypothesisCard: React.FC<DraggableHypothesisCardProps> = ({
  planningProps,
  ...props
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: encodeHubDraggableId(props.hub.id),
  });

  // Apply the drag transform via an SVG translate so the hub follows the pointer.
  const dx = transform?.x ?? 0;
  const dy = transform?.y ?? 0;

  // dnd-kit's setNodeRef is typed for HTMLElement; we're attaching to an SVG
  // `<g>`. Both extend Element and dnd-kit reads `getBoundingClientRect` which
  // exists on both — cast is safe.
  const setSvgRef = setNodeRef as unknown as React.Ref<SVGGElement>;

  // dnd-kit's `attributes` puts role="button" + tabIndex=0 on the draggable,
  // but HypothesisCard already owns the button semantics (its own role,
  // tabIndex, aria-label, and Enter/Space handler). Stacking both would
  // create nested focus targets and a screen reader would announce "button,
  // button". Strip role/tabIndex from the outer wrapper and keep the rest of
  // dnd-kit's a11y wiring (aria-roledescription, aria-describedby, etc.).
  const { role: _role, tabIndex: _tabIndex, ...dndAttributes } = attributes;
  void _role;
  void _tabIndex;

  return (
    <g
      ref={setSvgRef}
      transform={`translate(${dx}, ${dy})`}
      style={{ opacity: isDragging ? 0.6 : 1, cursor: 'grab' }}
      data-draggable-hub={props.hub.id}
      {...dndAttributes}
      {...listeners}
    >
      {planningProps ? (
        <HypothesisCardWithPlans {...props} {...planningProps} />
      ) : (
        <HypothesisCard {...props} />
      )}
    </g>
  );
};
