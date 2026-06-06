import { useCallback, useMemo, useState } from 'react';

export type CanvasToolId = 'select' | 'draw-hypothesis';

export type ArrowEndpoint =
  | { kind: 'step'; id: string }
  | { kind: 'column'; name: string; hostStepId: string };

export type Point = { x: number; y: number };

export type DrawToolState =
  | { phase: 'idle' }
  | {
      phase: 'drawing';
      source: ArrowEndpoint;
      anchorAt: Point;
      cursorAt: Point;
      hover: ArrowEndpoint | null;
    }
  | {
      phase: 'awaitingForm';
      source: ArrowEndpoint;
      target: ArrowEndpoint;
      releaseAt: Point;
    };

export interface UseHypothesisDrawToolArgs {
  active: boolean;
}

export interface UseHypothesisDrawToolResult {
  state: DrawToolState;
  onPointerDown: (endpoint: ArrowEndpoint, at: Point) => void;
  onPointerMove: (at: Point, hover: ArrowEndpoint | null) => void;
  onPointerUp: (endpoint: ArrowEndpoint | null, at: Point) => void;
  onPointerCancel: () => void;
  cancel: () => void;
  reset: () => void;
}

function endpointHostId(endpoint: ArrowEndpoint): string {
  return endpoint.kind === 'step' ? endpoint.id : endpoint.hostStepId;
}

function endpointsEqual(a: ArrowEndpoint, b: ArrowEndpoint): boolean {
  if (a.kind === 'step' && b.kind === 'step') return a.id === b.id;
  if (a.kind === 'column' && b.kind === 'column') {
    return a.name === b.name && a.hostStepId === b.hostStepId;
  }
  return false;
}

function isSelfLoop(source: ArrowEndpoint, target: ArrowEndpoint): boolean {
  return endpointHostId(source) === endpointHostId(target) || endpointsEqual(source, target);
}

export function useHypothesisDrawTool({
  active,
}: UseHypothesisDrawToolArgs): UseHypothesisDrawToolResult {
  const [state, setState] = useState<DrawToolState>({ phase: 'idle' });

  const onPointerDown = useCallback(
    (endpoint: ArrowEndpoint, at: Point): void => {
      if (!active) return;
      setState({
        phase: 'drawing',
        source: endpoint,
        anchorAt: at,
        cursorAt: at,
        hover: null,
      });
    },
    [active]
  );

  const onPointerMove = useCallback(
    (at: Point, hover: ArrowEndpoint | null): void => {
      if (!active) return;
      setState(current =>
        current.phase === 'drawing' ? { ...current, cursorAt: at, hover } : current
      );
    },
    [active]
  );

  const onPointerUp = useCallback(
    (endpoint: ArrowEndpoint | null, at: Point): void => {
      if (!active) return;
      setState(current => {
        if (current.phase !== 'drawing') return current;
        if (!endpoint || isSelfLoop(current.source, endpoint)) return { phase: 'idle' };
        return {
          phase: 'awaitingForm',
          source: current.source,
          target: endpoint,
          releaseAt: at,
        };
      });
    },
    [active]
  );

  const reset = useCallback((): void => {
    // Bail to the SAME reference when already idle — a fresh `{ phase: 'idle' }`
    // object would defeat React's setState bail-out and re-render for nothing,
    // which (with the result object below used as an effect dep) looped every
    // Canvas mount at the b0 expander (max-update-depth, 2026-06-06).
    setState(current => (current.phase === 'idle' ? current : { phase: 'idle' }));
  }, []);

  // Memoized so consumers may safely use the result object itself as an
  // effect/callback dep (Canvas does) — identity changes only with state.
  return useMemo(
    () => ({
      state,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      cancel: reset,
      reset,
    }),
    [state, onPointerDown, onPointerMove, onPointerUp, reset]
  );
}

export function resolveEndpointToFactor(
  endpoint: ArrowEndpoint,
  stepMetricColumns: Record<string, string | undefined>
): string | undefined {
  return endpoint.kind === 'column' ? endpoint.name : stepMetricColumns[endpoint.id];
}
