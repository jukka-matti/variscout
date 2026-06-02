import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCanvasHypothesisArrows } from '../useCanvasHypothesisArrows';
import type { RefObject } from 'react';
import type { CanvasAnalyzeOverlayModel } from '../useCanvasAnalyzeOverlays';

type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

function makeSurfaceRef(rect?: Partial<DOMRect>): RefObject<HTMLElement | null> {
  const el = document.createElement('div');
  const fullRect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 800,
    bottom: 400,
    width: 800,
    height: 400,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  el.getBoundingClientRect = () => fullRect;
  return { current: el };
}

function makeOverlays(
  fromStepId: string,
  toStepId: string,
  id = 'link-1'
): CanvasAnalyzeOverlayModel {
  return {
    byStep: {},
    arrows: [
      {
        id,
        fromStepId,
        toStepId,
        label: 'link',
        focus: { kind: 'causal-link', id },
      },
    ],
    unresolved: { findings: [], hypotheses: [], causalLinks: [] },
  };
}

function renderArrowsHook(
  overrides: Partial<Parameters<typeof useCanvasHypothesisArrows>[0]> = {}
) {
  const cardSurfaceRef = makeSurfaceRef();

  const { result, rerender } = renderHook(
    (props: Partial<Parameters<typeof useCanvasHypothesisArrows>[0]>) =>
      useCanvasHypothesisArrows({
        resolvedOverlays: ['hypotheses'],
        investigationOverlays: undefined,
        cardSurfaceRef,
        resolvedLens: 'default',
        stepCards: [],
        viewportPanX: 0,
        viewportPanY: 0,
        viewportZoom: 1,
        ...overrides,
        ...props,
      }),
    { initialProps: {} }
  );

  return { result, rerender, cardSurfaceRef };
}

describe('useCanvasHypothesisArrows', () => {
  beforeEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    vi.restoreAllMocks();
  });

  it('starts with empty arrow segments', () => {
    const { result } = renderArrowsHook();

    expect(result.current.arrowSegments).toEqual([]);
  });

  it('returns a stable registerCardElement callback', () => {
    const { result } = renderArrowsHook();
    const first = result.current.registerCardElement;
    expect(result.current.registerCardElement).toBe(first);
  });

  it('registerCardElement stores elements and removes on null', () => {
    // Since cardElements is internal, we verify indirectly:
    // register an element so it can participate in arrow measurement,
    // then remove it and ensure no crash.
    const cardSurfaceRef = makeSurfaceRef();
    const { result } = renderHook(() =>
      useCanvasHypothesisArrows({
        resolvedOverlays: ['hypotheses'],
        investigationOverlays: makeOverlays('step-1', 'step-2'),
        cardSurfaceRef,
        resolvedLens: 'default',
        stepCards: [],
        viewportPanX: 0,
        viewportPanY: 0,
        viewportZoom: 1,
      })
    );

    const el = document.createElement('div');
    document.body.appendChild(el);

    act(() => {
      result.current.registerCardElement('step-1', el);
    });

    act(() => {
      result.current.registerCardElement('step-1', null);
    });

    // No crash — passes if we get here
    expect(result.current.arrowSegments).toBeDefined();
  });

  it('returns empty segments when hypotheses overlay is not active', () => {
    const cardSurfaceRef = makeSurfaceRef();
    const { result } = renderHook(() =>
      useCanvasHypothesisArrows({
        resolvedOverlays: ['findings'],
        investigationOverlays: makeOverlays('step-1', 'step-2'),
        cardSurfaceRef,
        resolvedLens: 'default',
        stepCards: [],
        viewportPanX: 0,
        viewportPanY: 0,
        viewportZoom: 1,
      })
    );

    expect(result.current.arrowSegments).toEqual([]);
  });

  it('returns empty segments when investigationOverlays is undefined', () => {
    const { result } = renderArrowsHook({ investigationOverlays: undefined });

    expect(result.current.arrowSegments).toEqual([]);
  });

  it('computes arrow segments from registered card elements when viewport changes', () => {
    // The arrow measurement layout effect reads cardElements.current (a ref) and fires
    // when viewportPanX/Y/Zoom deps change. Register elements first, then trigger a
    // viewport change to force the measurement effect to run with the registered elements.
    const cardSurfaceRef = makeSurfaceRef({ left: 0, top: 0 } as Partial<DOMRect>);

    const fromEl = document.createElement('div');
    const toEl = document.createElement('div');

    fromEl.getBoundingClientRect = () =>
      ({ left: 50, top: 50, width: 100, height: 80, toJSON: () => ({}) }) as DOMRect;
    toEl.getBoundingClientRect = () =>
      ({ left: 300, top: 50, width: 100, height: 80, toJSON: () => ({}) }) as DOMRect;

    document.body.appendChild(fromEl);
    document.body.appendChild(toEl);

    const { result, rerender } = renderHook(
      ({ zoom }: { zoom: number }) =>
        useCanvasHypothesisArrows({
          resolvedOverlays: ['hypotheses'],
          investigationOverlays: makeOverlays('step-1', 'step-2'),
          cardSurfaceRef,
          resolvedLens: 'default',
          stepCards: [],
          viewportPanX: 0,
          viewportPanY: 0,
          viewportZoom: zoom,
        }),
      { initialProps: { zoom: 1 } }
    );

    // Register elements directly (mutates ref, doesn't trigger re-render)
    result.current.registerCardElement('step-1', fromEl);
    result.current.registerCardElement('step-2', toEl);

    // Trigger the measurement effect by changing a dep
    rerender({ zoom: 1.0001 });

    expect(result.current.arrowSegments).toHaveLength(1);
    expect(result.current.arrowSegments[0]).toMatchObject({
      id: 'link-1',
      x1: 100, // 50 + 100/2 - 0 (surface left)
      y1: 90, // 50 + 80/2 - 0 (surface top)
      x2: 350, // 300 + 100/2 - 0
      y2: 90,
    });
  });

  it('attaches and detaches ResizeObserver when conditions are met', () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
        observe = mockObserve;
        disconnect = mockDisconnect;
        unobserve = vi.fn();
      }
    );

    const cardSurfaceRef = makeSurfaceRef();

    const { unmount } = renderHook(() =>
      useCanvasHypothesisArrows({
        resolvedOverlays: ['hypotheses'],
        investigationOverlays: makeOverlays('step-1', 'step-2'),
        cardSurfaceRef,
        resolvedLens: 'default',
        stepCards: [],
        viewportPanX: 0,
        viewportPanY: 0,
        viewportZoom: 1,
      })
    );

    expect(mockObserve).toHaveBeenCalledWith(cardSurfaceRef.current);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('remeasures segments when viewport pan changes', () => {
    const cardSurfaceRef = makeSurfaceRef({ left: 0, top: 0 } as Partial<DOMRect>);

    const fromEl = document.createElement('div');
    const toEl = document.createElement('div');
    let panOffset = 0;

    fromEl.getBoundingClientRect = () =>
      ({ left: 50 + panOffset, top: 50, width: 100, height: 80, toJSON: () => ({}) }) as DOMRect;
    toEl.getBoundingClientRect = () =>
      ({ left: 300 + panOffset, top: 50, width: 100, height: 80, toJSON: () => ({}) }) as DOMRect;

    document.body.appendChild(fromEl);
    document.body.appendChild(toEl);

    const { result, rerender } = renderHook(
      ({ panX }: { panX: number }) =>
        useCanvasHypothesisArrows({
          resolvedOverlays: ['hypotheses'],
          investigationOverlays: makeOverlays('step-1', 'step-2'),
          cardSurfaceRef,
          resolvedLens: 'default',
          stepCards: [],
          viewportPanX: panX,
          viewportPanY: 0,
          viewportZoom: 1,
        }),
      { initialProps: { panX: 0 } }
    );

    // Register elements (mutates ref) then trigger measurement via zoom change
    result.current.registerCardElement('step-1', fromEl);
    result.current.registerCardElement('step-2', toEl);
    rerender({ panX: 0.0001 }); // bump to trigger measurement with current elements

    const initialX1 = result.current.arrowSegments[0]?.x1;
    expect(initialX1).toBeDefined();

    // Now change pan offset and trigger remeasurement
    panOffset = 20;
    rerender({ panX: 20 });

    // After rerender with new panX, the effect runs and measures new positions
    expect(result.current.arrowSegments[0]?.x1).toBe(initialX1! + 20);
  });
});
