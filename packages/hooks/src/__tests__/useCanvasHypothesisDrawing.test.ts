import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCanvasHypothesisDrawing } from '../useCanvasHypothesisDrawing';
import { useHypothesisDrawTool } from '../useHypothesisDrawTool';
import type { CanvasToolId } from '../useHypothesisDrawTool';
import { useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import type { ArrowEndpoint } from '../useHypothesisDrawTool';

const stepA: ArrowEndpoint = { kind: 'step', id: 'step-a' };
const stepB: ArrowEndpoint = { kind: 'step', id: 'step-b' };

function makeElement(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('div');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

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

function renderDrawingHook(
  overrides: Partial<Parameters<typeof useCanvasHypothesisDrawing>[0]> = {}
) {
  const cardSurfaceRef = makeSurfaceRef();

  const { result: drawToolResult } = renderHook(() =>
    useHypothesisDrawTool({ active: overrides.activeCanvasTool === 'draw-hypothesis' })
  );

  const { result } = renderHook(() =>
    useCanvasHypothesisDrawing({
      activeCanvasTool: 'draw-hypothesis',
      disabled: false,
      drawTool: drawToolResult.current,
      cardSurfaceRef,
      onCanvasToolChange: vi.fn(),
      stepMetricColumns: { 'step-a': 'Pressure', 'step-b': 'Defect' },
      ...overrides,
    })
  );

  return { result, drawToolResult, cardSurfaceRef };
}

describe('useCanvasHypothesisDrawing', () => {
  beforeEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('returns handlers and endpointLabel', () => {
    const { result } = renderDrawingHook();

    expect(result.current.handlers.onPointerDown).toBeInstanceOf(Function);
    expect(result.current.handlers.onPointerMove).toBeInstanceOf(Function);
    expect(result.current.handlers.onPointerUp).toBeInstanceOf(Function);
    expect(result.current.handlers.onKeyDown).toBeInstanceOf(Function);
    expect(result.current.endpointLabel).toBeInstanceOf(Function);
  });

  it('endpointLabel returns column name for column endpoints', () => {
    const { result } = renderDrawingHook({
      stepMetricColumns: { 'step-a': 'Pressure' },
    });
    const colEndpoint: ArrowEndpoint = {
      kind: 'column',
      name: 'Temperature',
      hostStepId: 'step-a',
    };

    expect(result.current.endpointLabel(colEndpoint)).toBe('Temperature');
  });

  it('endpointLabel returns metric column for step endpoints', () => {
    const { result } = renderDrawingHook({
      stepMetricColumns: { 'step-a': 'Pressure', 'step-b': 'Defect' },
    });

    expect(result.current.endpointLabel(stepA)).toBe('Pressure');
    expect(result.current.endpointLabel(stepB)).toBe('Defect');
  });

  it('endpointLabel falls back to step id when no metric column', () => {
    const { result } = renderDrawingHook({
      stepMetricColumns: {},
    });

    expect(result.current.endpointLabel(stepA)).toBe('step-a');
  });

  it('parseEndpointElement returns null for null input', () => {
    const { result } = renderDrawingHook();

    expect(result.current.parseEndpointElement(null)).toBeNull();
  });

  it('parseEndpointElement resolves step endpoints', () => {
    const { result } = renderDrawingHook();
    const el = makeElement({ 'data-arrow-endpoint': 'step:step-a' });
    document.body.appendChild(el);

    expect(result.current.parseEndpointElement(el)).toEqual({ kind: 'step', id: 'step-a' });
  });

  it('parseEndpointElement resolves column endpoints with host step in same element', () => {
    const { result } = renderDrawingHook();
    const el = makeElement({
      'data-arrow-endpoint': 'column:Pressure',
      'data-arrow-host-step-id': 'step-a',
    });
    document.body.appendChild(el);

    expect(result.current.parseEndpointElement(el)).toEqual({
      kind: 'column',
      name: 'Pressure',
      hostStepId: 'step-a',
    });
  });

  it('parseEndpointElement resolves column endpoints when host step is in parent', () => {
    const { result } = renderDrawingHook();
    const parent = makeElement({ 'data-arrow-host-step-id': 'step-b' });
    const child = makeElement({ 'data-arrow-endpoint': 'column:Defect' });
    parent.appendChild(child);
    document.body.appendChild(parent);

    expect(result.current.parseEndpointElement(child)).toEqual({
      kind: 'column',
      name: 'Defect',
      hostStepId: 'step-b',
    });
  });

  it('handleKeyDown does nothing when tool is not draw-hypothesis', () => {
    const onCanvasToolChange = vi.fn();
    const { result } = renderDrawingHook({
      activeCanvasTool: 'select',
      onCanvasToolChange,
    });

    act(() => {
      result.current.handlers.onKeyDown({
        key: 'Escape',
        preventDefault: vi.fn(),
        target: document.createElement('div'),
      } as unknown as KeyboardEvent<HTMLElement>);
    });

    expect(onCanvasToolChange).not.toHaveBeenCalled();
  });

  it('handleKeyDown cancels and switches tool on Escape', () => {
    const onCanvasToolChange = vi.fn();
    const { result: drawToolResult } = renderHook(() => useHypothesisDrawTool({ active: true }));
    const cardSurfaceRef = makeSurfaceRef();
    const { result } = renderHook(() =>
      useCanvasHypothesisDrawing({
        activeCanvasTool: 'draw-hypothesis',
        disabled: false,
        drawTool: drawToolResult.current,
        cardSurfaceRef,
        onCanvasToolChange,
        stepMetricColumns: {},
      })
    );

    // Start drawing first
    act(() => {
      drawToolResult.current.onPointerDown(stepA, { x: 10, y: 20 });
    });

    act(() => {
      result.current.handlers.onKeyDown({
        key: 'Escape',
        preventDefault: vi.fn(),
        target: document.createElement('div'),
      } as unknown as KeyboardEvent<HTMLElement>);
    });

    expect(onCanvasToolChange).toHaveBeenCalledWith('select');
  });

  it('starts drawing on pointer down over a step endpoint', () => {
    const { result: drawToolResult } = renderHook(() => useHypothesisDrawTool({ active: true }));
    const cardSurfaceRef = makeSurfaceRef();
    const { result } = renderHook(() =>
      useCanvasHypothesisDrawing({
        activeCanvasTool: 'draw-hypothesis',
        disabled: false,
        drawTool: drawToolResult.current,
        cardSurfaceRef,
        stepMetricColumns: { 'step-a': 'Pressure', 'step-b': 'Defect' },
      })
    );

    const sourceEl = makeElement({ 'data-arrow-endpoint': 'step:step-a' });
    const mockRect = {
      left: 50,
      top: 50,
      width: 100,
      height: 80,
      right: 150,
      bottom: 130,
      x: 50,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect;
    sourceEl.getBoundingClientRect = () => mockRect;
    document.body.appendChild(sourceEl);

    act(() => {
      result.current.handlers.onPointerDown({
        target: sourceEl,
        clientX: 80,
        clientY: 80,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>);
    });

    expect(drawToolResult.current.state.phase).toBe('drawing');
  });

  it('ignores pointer down when disabled', () => {
    const { result: drawToolResult } = renderHook(() => useHypothesisDrawTool({ active: true }));
    const cardSurfaceRef = makeSurfaceRef();
    const { result } = renderHook(() =>
      useCanvasHypothesisDrawing({
        activeCanvasTool: 'draw-hypothesis',
        disabled: true,
        drawTool: drawToolResult.current,
        cardSurfaceRef,
        stepMetricColumns: {},
      })
    );

    const sourceEl = makeElement({ 'data-arrow-endpoint': 'step:step-a' });
    document.body.appendChild(sourceEl);

    act(() => {
      result.current.handlers.onPointerDown({
        target: sourceEl,
        clientX: 80,
        clientY: 80,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>);
    });

    expect(drawToolResult.current.state.phase).toBe('idle');
  });
});

// b0-expander mount-loop regression (investigations 2026-06-06): the suites
// above render the two hooks in SEPARATE renderHook calls, which hides the
// production composition — Canvas calls BOTH hooks in one component and the
// reset effect's `drawTool` dep is the draw-tool hook's result object. With
// an unstable result + a non-bailing reset(), mounting the composition with
// the default 'select' tool looped forever (Maximum update depth exceeded —
// live at the FrameViewB0 process-steps expander, the only Canvas mount on
// the PWA fresh-paste path).
describe('useHypothesisDrawTool + useCanvasHypothesisDrawing composition (Canvas wiring)', () => {
  function useComposedProbe(activeCanvasTool: CanvasToolId) {
    const drawTool = useHypothesisDrawTool({ active: activeCanvasTool === 'draw-hypothesis' });
    // Stable ref identity, matching production (Canvas uses React.useRef) —
    // an inline makeSurfaceRef() here would churn handler identities per
    // render, which the loop fix doesn't depend on but the probe shouldn't add.
    const [cardSurfaceRef] = useState(() => makeSurfaceRef());
    useCanvasHypothesisDrawing({
      activeCanvasTool,
      disabled: false,
      drawTool,
      cardSurfaceRef,
      onCanvasToolChange: vi.fn(),
      stepMetricColumns: {},
    });
    return drawTool;
  }

  it("mounts with the default 'select' tool without a render loop", () => {
    // Today this throws "Maximum update depth exceeded" before the fix.
    const { result } = renderHook(() => useComposedProbe('select'));

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('switching away from draw-hypothesis still resets an in-flight draw (negative control)', () => {
    // The loop fix must not neuter the reset effect: a drawing in progress
    // when the tool flips back to select MUST return to idle.
    const { result, rerender } = renderHook(
      ({ tool }: { tool: CanvasToolId }) => useComposedProbe(tool),
      { initialProps: { tool: 'draw-hypothesis' as CanvasToolId } }
    );

    act(() => result.current.onPointerDown(stepA, { x: 5, y: 5 }));
    expect(result.current.state.phase).toBe('drawing');

    rerender({ tool: 'select' });

    expect(result.current.state).toEqual({ phase: 'idle' });
  });
});
