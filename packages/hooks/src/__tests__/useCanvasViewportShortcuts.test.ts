import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  type ProcessHubId,
} from '@variscout/stores';
import { useCanvasViewportShortcuts } from '../useCanvasViewportShortcuts';

const HUB_ID: ProcessHubId = 'hub-canvas-shortcuts';

type ShortcutKeyInit = {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

function keydown(key: string, init: ShortcutKeyInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
}

function keydownFrom(target: HTMLElement, key: string, init: ShortcutKeyInit = {}) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function viewport() {
  return useCanvasViewportStore.getState().getViewport(HUB_ID);
}

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

describe('useCanvasViewportShortcuts', () => {
  it('maps Cmd/Ctrl+1/2/0 to fit the requested viewport level', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));

    const l1Event = keydown('1', { metaKey: true });
    expect(l1Event.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l1',
      zoom: 0.2,
      pan: { x: 0, y: 0 },
    });

    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 20, y: -10 });
    const l2Event = keydown('2', { ctrlKey: true });
    expect(l2Event.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });

    useCanvasViewportStore.getState().setLevel(HUB_ID, 'l1');
    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 15, y: 15 });
    const fitCurrentEvent = keydown('0', { metaKey: true });
    expect(fitCurrentEvent.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l1',
      zoom: 0.2,
      pan: { x: 0, y: 0 },
    });
  });

  it('uses the caller-provided fit implementation when fitting with shortcuts', () => {
    const fitToContent = (hubId: ProcessHubId, targetLevel?: 'l1' | 'l2' | 'l3') => {
      useCanvasViewportStore.getState().fitToContent(hubId, targetLevel, {
        zoom: 1.9,
        pan: { x: 25, y: 12.5 },
      });
    };
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID, fitToContent }));

    const event = keydown('1', { metaKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l1',
      zoom: 1.9,
      pan: { x: 25, y: 12.5 },
    });
  });

  it('maps Cmd/Ctrl+3 to l3 only when the current viewport has a focal step', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));

    const bareL3Event = keydown('3', { metaKey: true });
    expect(bareL3Event.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });

    act(() => {
      useCanvasViewportStore.getState().setLevel(HUB_ID, 'l3', 'step-1');
      useCanvasViewportStore.getState().setPan(HUB_ID, { x: 12, y: -8 });
    });

    const focusedL3Event = keydown('3', { ctrlKey: true });
    expect(focusedL3Event.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l3',
      focalStepId: 'step-1',
      zoom: 2.5,
      pan: { x: 0, y: 0 },
    });
  });

  it('ignores level keys without Cmd/Ctrl and removes the listener on unmount', () => {
    const { unmount } = renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));

    const plainEvent = keydown('1');
    expect(plainEvent.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });

    unmount();
    const afterUnmountEvent = keydown('1', { metaKey: true });
    expect(afterUnmountEvent.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });

  it('ignores Cmd/Ctrl+1 from input and textarea targets', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    document.body.append(input, textarea);

    const inputEvent = keydownFrom(input, '1', { metaKey: true });
    const textareaEvent = keydownFrom(textarea, '1', { ctrlKey: true });

    expect(inputEvent.defaultPrevented).toBe(false);
    expect(textareaEvent.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });

  it('ignores Cmd/Ctrl+1 from contenteditable targets', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    document.body.appendChild(editor);

    const event = keydownFrom(editor, '1', { metaKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });

  it('ignores events already defaultPrevented before they reach window', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID }));
    const target = document.createElement('button');
    target.addEventListener('keydown', event => event.preventDefault());
    document.body.appendChild(target);

    const event = keydownFrom(target, '1', { metaKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });

  it('does not handle shortcuts while disabled', () => {
    renderHook(() => useCanvasViewportShortcuts({ hubId: HUB_ID, disabled: true }));

    const event = keydown('1', { metaKey: true });

    expect(event.defaultPrevented).toBe(false);
    expect(viewport()).toMatchObject({
      currentLevel: 'l2',
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });
});
