import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { CanvasLensId, CanvasStepCardModel } from './useCanvasStepCards';
import type {
  CanvasInvestigationOverlayModel,
  CanvasOverlayId,
} from './useCanvasInvestigationOverlays';

export type ArrowSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function areArrowSegmentsEqual(left: ArrowSegment[], right: ArrowSegment[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((segment, index) => {
    const next = right[index];
    return (
      segment.id === next.id &&
      segment.x1 === next.x1 &&
      segment.y1 === next.y1 &&
      segment.x2 === next.x2 &&
      segment.y2 === next.y2
    );
  });
}

export interface UseCanvasHypothesisArrowsArgs {
  resolvedOverlays: readonly CanvasOverlayId[];
  investigationOverlays: CanvasInvestigationOverlayModel | undefined;
  cardSurfaceRef: RefObject<HTMLElement | null>;
  resolvedLens: CanvasLensId;
  stepCards: readonly CanvasStepCardModel[];
  viewportPanX: number;
  viewportPanY: number;
  viewportZoom: number;
}

export interface UseCanvasHypothesisArrowsResult {
  arrowSegments: ArrowSegment[];
  registerCardElement: (stepId: string, element: HTMLElement | null) => void;
}

export function useCanvasHypothesisArrows({
  resolvedOverlays,
  investigationOverlays,
  cardSurfaceRef,
  resolvedLens,
  stepCards,
  viewportPanX,
  viewportPanY,
  viewportZoom,
}: UseCanvasHypothesisArrowsArgs): UseCanvasHypothesisArrowsResult {
  const cardElements = useRef(new Map<string, HTMLElement>());
  const [arrowSegments, setArrowSegments] = useState<ArrowSegment[]>([]);
  const [arrowMeasureVersion, setArrowMeasureVersion] = useState(0);

  const registerCardElement = useCallback((stepId: string, element: HTMLElement | null) => {
    if (element) cardElements.current.set(stepId, element);
    else cardElements.current.delete(stepId);
  }, []);

  useLayoutEffect(() => {
    if (
      !resolvedOverlays.includes('hypotheses') ||
      !investigationOverlays ||
      !cardSurfaceRef.current
    ) {
      return;
    }

    const refresh = () => setArrowMeasureVersion(version => version + 1);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh);
    resizeObserver?.observe(cardSurfaceRef.current);
    for (const element of cardElements.current.values()) resizeObserver?.observe(element);
    window.addEventListener('resize', refresh);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', refresh);
    };
  }, [cardSurfaceRef, investigationOverlays, resolvedLens, resolvedOverlays, stepCards]);

  useLayoutEffect(() => {
    if (
      !resolvedOverlays.includes('hypotheses') ||
      !investigationOverlays ||
      !cardSurfaceRef.current
    ) {
      setArrowSegments(current => (current.length === 0 ? current : []));
      return;
    }
    const surfaceRect = cardSurfaceRef.current.getBoundingClientRect();
    const next = investigationOverlays.arrows.flatMap(arrow => {
      const from = cardElements.current.get(arrow.fromStepId);
      const to = cardElements.current.get(arrow.toStepId);
      if (!from || !to) return [];
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      return [
        {
          id: arrow.id,
          x1: fromRect.left + fromRect.width / 2 - surfaceRect.left,
          y1: fromRect.top + fromRect.height / 2 - surfaceRect.top,
          x2: toRect.left + toRect.width / 2 - surfaceRect.left,
          y2: toRect.top + toRect.height / 2 - surfaceRect.top,
        },
      ];
    });
    setArrowSegments(current => (areArrowSegmentsEqual(current, next) ? current : next));
  }, [
    arrowMeasureVersion,
    cardSurfaceRef,
    investigationOverlays,
    resolvedLens,
    resolvedOverlays,
    stepCards,
    viewportPanX,
    viewportPanY,
    viewportZoom,
  ]);

  return {
    arrowSegments,
    registerCardElement,
  };
}
