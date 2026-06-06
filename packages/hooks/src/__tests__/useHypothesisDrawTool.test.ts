import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHypothesisDrawTool, resolveEndpointToFactor } from '../useHypothesisDrawTool';
import type { ArrowEndpoint } from '../useHypothesisDrawTool';

const stepA: ArrowEndpoint = { kind: 'step', id: 'step-a' };
const stepB: ArrowEndpoint = { kind: 'step', id: 'step-b' };
const colX: ArrowEndpoint = { kind: 'column', name: 'temp_psi', hostStepId: 'step-a' };
const colY: ArrowEndpoint = { kind: 'column', name: 'yield', hostStepId: 'step-b' };

describe('useHypothesisDrawTool', () => {
  it('starts in idle phase', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('starts drawing on pointerDown over a valid endpoint', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));

    expect(result.current.state).toEqual({
      phase: 'drawing',
      source: stepA,
      anchorAt: { x: 10, y: 20 },
      cursorAt: { x: 10, y: 20 },
      hover: null,
    });
  });

  it('tracks cursor and hover target on pointerMove', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerMove({ x: 100, y: 50 }, stepB));

    expect(result.current.state).toMatchObject({
      phase: 'drawing',
      anchorAt: { x: 10, y: 20 },
      cursorAt: { x: 100, y: 50 },
      hover: stepB,
    });
  });

  it('opens the form on pointerUp over a valid different target', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerMove({ x: 100, y: 50 }, stepB));
    act(() => result.current.onPointerUp(stepB, { x: 100, y: 50 }));

    expect(result.current.state).toEqual({
      phase: 'awaitingForm',
      source: stepA,
      target: stepB,
      releaseAt: { x: 100, y: 50 },
    });
  });

  it('rejects same endpoint releases', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerUp(stepA, { x: 12, y: 22 }));

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('rejects releases with no target', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerUp(null, { x: 999, y: 999 }));

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('resets on cancel and pointerCancel', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.cancel());
    expect(result.current.state).toEqual({ phase: 'idle' });

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));
    act(() => result.current.onPointerCancel());
    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('ignores events while inactive', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: false }));

    act(() => result.current.onPointerDown(stepA, { x: 10, y: 20 }));

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  it('supports column-grabbed endpoints', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(colX, { x: 0, y: 0 }));
    act(() => result.current.onPointerUp(colY, { x: 10, y: 10 }));

    expect(result.current.state).toMatchObject({
      phase: 'awaitingForm',
      source: colX,
      target: colY,
    });
  });

  it('reset returns to idle from awaitingForm', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));

    act(() => result.current.onPointerDown(stepA, { x: 0, y: 0 }));
    act(() => result.current.onPointerUp(stepB, { x: 100, y: 100 }));
    act(() => result.current.reset());

    expect(result.current.state).toEqual({ phase: 'idle' });
  });

  // b0-expander mount-loop regression (investigations 2026-06-06): reset()
  // while already idle must be a true no-op — minting a fresh
  // `{ phase: 'idle' }` object on every call defeats React's setState
  // bail-out and, combined with an unstable hook result used as an effect
  // dep, loops any mount of the composed drawing surface forever.
  it('reset while already idle preserves state identity (setState bail-out)', () => {
    const { result } = renderHook(() => useHypothesisDrawTool({ active: true }));
    const before = result.current.state;

    act(() => result.current.reset());

    expect(result.current.state).toBe(before);
  });

  it('result object is referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useHypothesisDrawTool({ active: true }));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe('resolveEndpointToFactor', () => {
  it('resolves step-grabbed endpoints to the step metric column', () => {
    expect(resolveEndpointToFactor(stepA, { 'step-a': 'pressure_psi' })).toBe('pressure_psi');
  });

  it('returns undefined when a step has no metric column', () => {
    expect(resolveEndpointToFactor(stepA, { 'step-a': undefined })).toBeUndefined();
  });

  it('returns column names directly for column endpoints', () => {
    expect(resolveEndpointToFactor(colX, {})).toBe('temp_psi');
  });
});
