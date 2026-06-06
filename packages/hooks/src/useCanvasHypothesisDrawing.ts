import { useCallback, useEffect } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import type { ArrowEndpoint, UseHypothesisDrawToolResult } from './useHypothesisDrawTool';
import type { CanvasToolId } from './useHypothesisDrawTool';

export interface UseCanvasHypothesisDrawingArgs {
  activeCanvasTool: CanvasToolId;
  disabled?: boolean;
  drawTool: UseHypothesisDrawToolResult;
  cardSurfaceRef: RefObject<HTMLElement | null>;
  onCanvasToolChange?: (next: CanvasToolId) => void;
  stepMetricColumns: Record<string, string | undefined>;
}

export interface UseCanvasHypothesisDrawingResult {
  handlers: {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  };
  endpointLabel: (endpoint: ArrowEndpoint) => string;
  parseEndpointElement: (element: Element | null) => ArrowEndpoint | null;
}

export function useCanvasHypothesisDrawing({
  activeCanvasTool,
  disabled,
  drawTool,
  cardSurfaceRef,
  onCanvasToolChange,
  stepMetricColumns,
}: UseCanvasHypothesisDrawingArgs): UseCanvasHypothesisDrawingResult {
  const surfacePoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = cardSurfaceRef.current?.getBoundingClientRect();
      return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: clientX, y: clientY };
    },
    [cardSurfaceRef]
  );

  const endpointElementFromTarget = useCallback((target: EventTarget | null): Element | null => {
    return target instanceof Element ? target.closest('[data-arrow-endpoint]') : null;
  }, []);

  const parseEndpointElement = useCallback((element: Element | null): ArrowEndpoint | null => {
    let node: Element | null = element;
    while (node) {
      const attr = node.getAttribute('data-arrow-endpoint');
      if (attr) {
        const separator = attr.indexOf(':');
        if (separator < 0) return null;
        const kind = attr.slice(0, separator);
        const id = attr.slice(separator + 1);
        if (kind === 'step') return { kind: 'step', id };
        if (kind === 'column') {
          const directHostStepId = node.getAttribute('data-arrow-host-step-id');
          if (directHostStepId) return { kind: 'column', name: id, hostStepId: directHostStepId };
          let stepNode = node.parentElement;
          while (stepNode) {
            const hostStepId = stepNode.getAttribute('data-arrow-host-step-id');
            if (hostStepId) return { kind: 'column', name: id, hostStepId };
            const stepAttr = stepNode.getAttribute('data-arrow-endpoint');
            if (stepAttr?.startsWith('step:')) {
              return { kind: 'column', name: id, hostStepId: stepAttr.slice(5) };
            }
            stepNode = stepNode.parentElement;
          }
        }
      }
      node = node.parentElement;
    }
    return null;
  }, []);

  const endpointFromPointerEvent = useCallback(
    (event: PointerEvent<HTMLElement>): ArrowEndpoint | null => {
      const targetElement = endpointElementFromTarget(event.target);
      const fallbackElement =
        typeof document === 'undefined' || typeof document.elementFromPoint !== 'function'
          ? null
          : document.elementFromPoint(event.clientX, event.clientY);
      return parseEndpointElement(targetElement) ?? parseEndpointElement(fallbackElement);
    },
    [endpointElementFromTarget, parseEndpointElement]
  );

  const endpointFromKeyboardEvent = useCallback(
    (
      event: KeyboardEvent<HTMLElement>
    ): { endpoint: ArrowEndpoint; at: { x: number; y: number } } | null => {
      const element = endpointElementFromTarget(event.target);
      const endpoint = parseEndpointElement(element);
      if (!endpoint) return null;
      const elementRect = element?.getBoundingClientRect();
      const surfaceRect = cardSurfaceRef.current?.getBoundingClientRect();
      if (elementRect && surfaceRect) {
        return {
          endpoint,
          at: {
            x: elementRect.left + elementRect.width / 2 - surfaceRect.left,
            y: elementRect.top + elementRect.height / 2 - surfaceRect.top,
          },
        };
      }
      return { endpoint, at: { x: 0, y: 0 } };
    },
    [cardSurfaceRef, endpointElementFromTarget, parseEndpointElement]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>): void => {
      if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
      const endpoint = endpointFromPointerEvent(event);
      if (!endpoint) return;
      const sourceElement = endpointElementFromTarget(event.target);
      const sourceRect = sourceElement?.getBoundingClientRect();
      const surfaceRect = cardSurfaceRef.current?.getBoundingClientRect();
      const anchor =
        sourceRect && surfaceRect
          ? {
              x: sourceRect.left + sourceRect.width / 2 - surfaceRect.left,
              y: sourceRect.top + sourceRect.height / 2 - surfaceRect.top,
            }
          : surfacePoint(event.clientX, event.clientY);
      event.preventDefault();
      drawTool.onPointerDown(endpoint, anchor);
    },
    [
      activeCanvasTool,
      cardSurfaceRef,
      disabled,
      drawTool,
      endpointElementFromTarget,
      endpointFromPointerEvent,
      surfacePoint,
    ]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>): void => {
      if (drawTool.state.phase !== 'drawing') return;
      drawTool.onPointerMove(
        surfacePoint(event.clientX, event.clientY),
        endpointFromPointerEvent(event)
      );
    },
    [drawTool, endpointFromPointerEvent, surfacePoint]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>): void => {
      if (drawTool.state.phase !== 'drawing') return;
      drawTool.onPointerUp(
        endpointFromPointerEvent(event),
        surfacePoint(event.clientX, event.clientY)
      );
    },
    [drawTool, endpointFromPointerEvent, surfacePoint]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (activeCanvasTool !== 'draw-hypothesis' || disabled) return;
      if (event.key === 'Escape') {
        drawTool.cancel();
        onCanvasToolChange?.('select');
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const resolved = endpointFromKeyboardEvent(event);
      if (!resolved) return;
      event.preventDefault();
      if (drawTool.state.phase === 'drawing') {
        drawTool.onPointerUp(resolved.endpoint, resolved.at);
      } else {
        drawTool.onPointerDown(resolved.endpoint, resolved.at);
      }
    },
    [activeCanvasTool, disabled, drawTool, endpointFromKeyboardEvent, onCanvasToolChange]
  );

  const endpointLabel = useCallback(
    (endpoint: ArrowEndpoint): string =>
      endpoint.kind === 'column' ? endpoint.name : (stepMetricColumns[endpoint.id] ?? endpoint.id),
    [stepMetricColumns]
  );

  // Reset draw tool when the active tool changes away from draw-hypothesis.
  // Dep is the stable `reset` callback, NOT the whole drawTool object — the
  // object's identity tracks draw state, and depending on it re-ran this
  // effect on every state change (the b0-expander mount loop, 2026-06-06).
  const resetDrawTool = drawTool.reset;
  useEffect(() => {
    if (activeCanvasTool !== 'draw-hypothesis') resetDrawTool();
  }, [activeCanvasTool, resetDrawTool]);

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onKeyDown: handleKeyDown,
    },
    endpointLabel,
    parseEndpointElement,
  };
}
