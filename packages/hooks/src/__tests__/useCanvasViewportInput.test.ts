import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { useRef, type RefObject } from 'react';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  type ProcessHubId,
} from '@variscout/stores';
import { useCanvasViewportInput } from '../useCanvasViewportInput';

interface D3ZoomElement extends HTMLDivElement {
  __zoom?: { k: number; x: number; y: number };
  __on?: Array<{ type: string; name: string; value: (event: Event) => void }>;
}

const HUB_ID: ProcessHubId = 'hub-canvas-input';

function makeCanvasElement(): D3ZoomElement {
  const element = document.createElement('div') as D3ZoomElement;
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 200 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 100 });
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(element);
  return element;
}

function renderCanvasViewportInput(element: HTMLElement = makeCanvasElement()) {
  const ref: RefObject<HTMLElement | SVGSVGElement | null> = { current: element };
  const rendered = renderHook(() => useCanvasViewportInput({ hubId: HUB_ID, ref }));
  return { element: element as D3ZoomElement, ...rendered };
}

function renderDisabledCanvasViewportInput(element: HTMLElement = makeCanvasElement()) {
  const ref: RefObject<HTMLElement | SVGSVGElement | null> = { current: element };
  const rendered = renderHook(() => useCanvasViewportInput({ hubId: HUB_ID, ref, disabled: true }));
  return { element: element as D3ZoomElement, ...rendered };
}

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  document.body.innerHTML = '';
});

describe('useCanvasViewportInput', () => {
  it('accepts nullable HTMLElement and SVG refs from React useRef', () => {
    const { result } = renderHook(() => {
      const htmlRef = useRef<HTMLDivElement>(null);
      const svgRef = useRef<SVGSVGElement>(null);

      useCanvasViewportInput({ hubId: HUB_ID, ref: htmlRef });
      useCanvasViewportInput({ hubId: HUB_ID, ref: svgRef });

      return null;
    });

    expect(result.current).toBeNull();
  });

  it('attaches d3 zoom state and listeners to the element', () => {
    const { element } = renderCanvasViewportInput();

    expect(element.__zoom).toMatchObject({ k: 1, x: 0, y: 0 });
    expect(element.__on?.some(listener => listener.name === 'zoom')).toBe(true);
  });

  it('initializes d3 transform from the current hub viewport', () => {
    useCanvasViewportStore.getState().setPan(HUB_ID, { x: 42, y: -17 });
    useCanvasViewportStore.getState().setZoom(HUB_ID, 2.5);

    const { element } = renderCanvasViewportInput();

    expect(element.__zoom).toMatchObject({ k: 2.5, x: 42, y: -17 });
  });

  it('syncs external hub viewport writes into d3 internal zoom state', () => {
    const { element } = renderCanvasViewportInput();

    act(() => {
      useCanvasViewportStore.getState().setZoom(HUB_ID, 2);
      useCanvasViewportStore.getState().setPan(HUB_ID, { x: 34, y: -12 });
    });

    expect(element.__zoom).toMatchObject({ k: 2, x: 34, y: -12 });
  });

  it('writes d3 zoom events back to the hub viewport store', () => {
    const { element } = renderCanvasViewportInput();

    element.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -180,
        clientX: 100,
        clientY: 50,
      })
    );

    const viewport = useCanvasViewportStore.getState().getViewport(HUB_ID);
    expect(viewport.zoom).toBeGreaterThan(1);
    expect(viewport.pan.x).toBeLessThan(0);
    expect(viewport.pan.y).toBeLessThan(0);
  });

  it('removes zoom listeners on cleanup', () => {
    const { element, unmount } = renderCanvasViewportInput();

    unmount();

    expect(element.__on?.some(listener => listener.name === 'zoom')).not.toBe(true);
  });

  it('does not attach listeners or update the store when disabled', () => {
    const { element } = renderDisabledCanvasViewportInput();

    expect(element.__zoom).toBeUndefined();
    expect(element.__on?.some(listener => listener.name === 'zoom')).not.toBe(true);

    element.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -180,
        clientX: 100,
        clientY: 50,
      })
    );

    expect(useCanvasViewportStore.getState().getViewport(HUB_ID)).toMatchObject({
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });
});
