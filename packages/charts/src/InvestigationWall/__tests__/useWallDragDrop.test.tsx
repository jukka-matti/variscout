import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  useWallDragDrop,
  encodeHubDraggableId,
  encodeGatePath,
  decodeHubDraggableId,
  decodeGatePath,
} from '../hooks/useWallDragDrop';
import type { GatePath } from '@variscout/core';

function makeDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
  // Minimal shape sufficient for the hook — dnd-kit's real DragEndEvent has
  // many more fields but the hook only reads active.id and over.id.
  return {
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    over: overId
      ? {
          id: overId,
          rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 },
          disabled: false,
          data: { current: undefined },
        }
      : null,
    collisions: null,
    delta: { x: 0, y: 0 },
    activatorEvent: new Event('pointerdown'),
  } as unknown as DragEndEvent;
}

describe('useWallDragDrop id codec', () => {
  it('round-trips a hub draggable id', () => {
    const id = encodeHubDraggableId('hub-123');
    expect(decodeHubDraggableId(id)).toBe('hub-123');
  });

  it('returns null for a non-hub draggable id', () => {
    expect(decodeHubDraggableId('gate:[0]')).toBeNull();
    expect(decodeHubDraggableId('random')).toBeNull();
  });

  it('round-trips a GatePath', () => {
    const path: GatePath = [0, 1, 'child'];
    const id = encodeGatePath(path);
    expect(decodeGatePath(id)).toEqual(path);
  });

  it('round-trips the empty path (root)', () => {
    const id = encodeGatePath([]);
    expect(decodeGatePath(id)).toEqual([]);
  });

  it('returns null for malformed gate ids', () => {
    expect(decodeGatePath('hub:abc')).toBeNull();
    expect(decodeGatePath('gate:not-json')).toBeNull();
    expect(decodeGatePath('gate:{"x":1}')).toBeNull(); // not an array
    expect(decodeGatePath('gate:[true]')).toBeNull(); // invalid step type
  });
});

describe('useWallDragDrop onDragEnd', () => {
  it('invokes onDrop with decoded hubId + gatePath', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useWallDragDrop({ onDrop }));

    const event = makeDragEndEvent(encodeHubDraggableId('h1'), encodeGatePath([0]));
    result.current.onDragEnd(event);

    expect(onDrop).toHaveBeenCalledWith({ hubId: 'h1', gatePath: [0] });
  });

  it('ignores drops outside any droppable', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useWallDragDrop({ onDrop }));

    result.current.onDragEnd(makeDragEndEvent(encodeHubDraggableId('h1'), null));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('ignores drops on another hub (not a gate target)', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useWallDragDrop({ onDrop }));

    // overId is a hub id, not a gate id — hook should filter it out.
    result.current.onDragEnd(
      makeDragEndEvent(encodeHubDraggableId('h1'), encodeHubDraggableId('h2'))
    );
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('ignores non-hub draggables', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useWallDragDrop({ onDrop }));

    result.current.onDragEnd(makeDragEndEvent('rogue-id', encodeGatePath([0])));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('is a safe no-op when onDrop is omitted', () => {
    const { result } = renderHook(() => useWallDragDrop());
    expect(() =>
      result.current.onDragEnd(makeDragEndEvent(encodeHubDraggableId('h1'), encodeGatePath([0])))
    ).not.toThrow();
  });

  it('decodes nested gate paths', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useWallDragDrop({ onDrop }));
    const nested: GatePath = [1, 'child', 0];
    result.current.onDragEnd(makeDragEndEvent(encodeHubDraggableId('h1'), encodeGatePath(nested)));
    expect(onDrop).toHaveBeenCalledWith({ hubId: 'h1', gatePath: nested });
  });
});
