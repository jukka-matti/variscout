/**
 * useWallDragDrop — Gate composition via drag-drop on the Investigation Wall.
 *
 * Hubs (HypothesisCard) are draggable; gate badges (GateBadge) are drop
 * targets. Dropping a hub on a gate calls `onDrop({ hubId, gatePath })`,
 * which the caller wires to `composeGate` on investigationStore.
 *
 * Dropping on another hub is intentionally ignored — we only compose via
 * gates to keep the tree structure intentional. The hook is a thin wrapper
 * around `@dnd-kit/core`'s `DndContext.onDragEnd` that decodes the draggable
 * id (`hub:<id>`) and droppable id (`gate:<json-path>`) into typed data.
 *
 * Path encoding: `GatePath` (union of number | 'child' steps) is JSON-encoded
 * into the droppable id. GateBadge wrappers serialize their path via
 * `encodeGatePath`; this hook inverts via `decodeGatePath`.
 */

import { useCallback, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GatePath } from '@variscout/core';

export const DRAGGABLE_HUB_PREFIX = 'hub:';
export const DROPPABLE_GATE_PREFIX = 'gate:';

/** Encode a hub id as a draggable id string for dnd-kit. */
export function encodeHubDraggableId(hubId: string): string {
  return `${DRAGGABLE_HUB_PREFIX}${hubId}`;
}

/** Decode a draggable id back to its hubId. Returns `null` if not a hub. */
export function decodeHubDraggableId(id: string): string | null {
  if (!id.startsWith(DRAGGABLE_HUB_PREFIX)) return null;
  return id.slice(DRAGGABLE_HUB_PREFIX.length);
}

/** Encode a GatePath as a droppable id string for dnd-kit. */
export function encodeGatePath(path: GatePath): string {
  return `${DROPPABLE_GATE_PREFIX}${JSON.stringify(path)}`;
}

/** Decode a droppable id back to a GatePath. Returns `null` if not a gate. */
export function decodeGatePath(id: string): GatePath | null {
  if (!id.startsWith(DROPPABLE_GATE_PREFIX)) return null;
  try {
    const json = id.slice(DROPPABLE_GATE_PREFIX.length);
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    // Shallow shape validation — steps are number | 'child'
    for (const step of parsed) {
      if (typeof step !== 'number' && step !== 'child') return null;
    }
    return parsed as GatePath;
  } catch {
    return null;
  }
}

export interface WallDropPayload {
  hubId: string;
  gatePath: GatePath;
}

export interface UseWallDragDropOptions {
  /**
   * Called when a hub is dropped on a gate badge. Non-gate drops (e.g. on
   * another hub or outside any droppable) are filtered out by the hook.
   */
  onDrop?: (payload: WallDropPayload) => void;
}

export interface UseWallDragDropResult {
  /**
   * Spread onto `<DndContext>` as `onDragEnd={onDragEnd}`. Decodes the
   * draggable/droppable ids and invokes `onDrop` for valid hub→gate drops.
   */
  onDragEnd: (event: DragEndEvent) => void;
}

export function useWallDragDrop(options: UseWallDragDropOptions = {}): UseWallDragDropResult {
  const { onDrop } = options;

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onDrop) return;
      const { active, over } = event;
      if (!over) return; // dropped outside any droppable

      const hubId = decodeHubDraggableId(String(active.id));
      if (!hubId) return; // not a hub drag — ignore

      const gatePath = decodeGatePath(String(over.id));
      if (!gatePath) return; // not a gate drop target — ignore

      onDrop({ hubId, gatePath });
    },
    [onDrop]
  );

  return useMemo(() => ({ onDragEnd }), [onDragEnd]);
}
