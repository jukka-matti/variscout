import type { DragEndEvent } from '@dnd-kit/core';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CANVAS_EMPTY_DROP_ID,
  CHIP_DRAG_PREFIX,
  STEP_DROP_PREFIX,
  decodeChipDragId,
  decodeStepDropId,
  encodeChipDragId,
  encodeStepDropId,
  useChipDragAndDrop,
} from '../useChipDragAndDrop';

function makeDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
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

describe('chip drag and step drop id helpers', () => {
  it('exposes colon-prefixed drag and drop ids', () => {
    expect(CHIP_DRAG_PREFIX).toBe('chip:');
    expect(STEP_DROP_PREFIX).toBe('step:');
    expect(CANVAS_EMPTY_DROP_ID).toBe('canvas:empty');
  });

  it('round-trips chip drag ids', () => {
    expect(encodeChipDragId('column-1')).toBe('chip:column-1');
    expect(decodeChipDragId('chip:column-1')).toBe('column-1');
  });

  it('round-trips step drop ids', () => {
    expect(encodeStepDropId('step-1')).toBe('step:step-1');
    expect(decodeStepDropId('step:step-1')).toBe('step-1');
  });

  it('returns null for malformed or wrong-prefix ids', () => {
    expect(decodeChipDragId('step:column-1')).toBeNull();
    expect(decodeChipDragId('chip:')).toBeNull();
    expect(decodeStepDropId('chip:step-1')).toBeNull();
    expect(decodeStepDropId('step:')).toBeNull();
  });
});

describe('useChipDragAndDrop', () => {
  it('places a chip on an existing step', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));

    result.current.handleDragEnd(
      makeDragEndEvent(encodeChipDragId('column-1'), encodeStepDropId('step-1'))
    );

    expect(onPlace).toHaveBeenCalledWith('column-1', 'step-1');
    expect(onCreateStep).not.toHaveBeenCalled();
  });

  it('creates a new step when a chip is dropped on the empty canvas target', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));

    result.current.handleDragEnd(
      makeDragEndEvent(encodeChipDragId('column-1'), CANVAS_EMPTY_DROP_ID)
    );

    expect(onCreateStep).toHaveBeenCalledWith('column-1');
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('does nothing when dropped outside any target', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));

    result.current.handleDragEnd(makeDragEndEvent(encodeChipDragId('column-1'), null));

    expect(onPlace).not.toHaveBeenCalled();
    expect(onCreateStep).not.toHaveBeenCalled();
  });

  it('does nothing for malformed or non-chip active ids', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));

    result.current.handleDragEnd(makeDragEndEvent('column-1', encodeStepDropId('step-1')));
    result.current.handleDragEnd(makeDragEndEvent('chip:', CANVAS_EMPTY_DROP_ID));

    expect(onPlace).not.toHaveBeenCalled();
    expect(onCreateStep).not.toHaveBeenCalled();
  });

  it('does nothing for malformed or non-step over ids unless the target is the empty canvas', () => {
    const onPlace = vi.fn();
    const onCreateStep = vi.fn();
    const { result } = renderHook(() => useChipDragAndDrop({ onPlace, onCreateStep }));

    result.current.handleDragEnd(makeDragEndEvent(encodeChipDragId('column-1'), 'step:'));
    result.current.handleDragEnd(makeDragEndEvent(encodeChipDragId('column-1'), 'chip:column-2'));

    expect(onPlace).not.toHaveBeenCalled();
    expect(onCreateStep).not.toHaveBeenCalled();
  });
});
