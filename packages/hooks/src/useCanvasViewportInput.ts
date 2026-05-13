import { useEffect, useRef, type RefObject } from 'react';
import { select } from 'd3-selection';
import 'd3-transition'; // augments Selection with .transition()
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';
import { LOD_SNAP_BOUNDARIES, LOD_THRESHOLDS } from '@variscout/core/canvas';

export const SNAP_EASE_DURATION_MS = 150;

/**
 * Given a zoom level k, returns the snap target zoom if k is stranded in a
 * half-open LOD boundary range, or undefined if no snap is required.
 *
 * Ranges per spec §4.6:
 *   [l1ToL2, L2_OVERVIEW_LOW) = [0.3, 0.5) → snap to 0.5 (low end of l2)
 *   [L2_DETAIL_HIGH, l2ToL3)  = [1.8, 2.0) → snap to 1.8 (high end of l2)
 */
export function snapTarget(k: number): number | undefined {
  if (k >= LOD_THRESHOLDS.l1ToL2 && k < LOD_SNAP_BOUNDARIES.L2_OVERVIEW_LOW) {
    return LOD_SNAP_BOUNDARIES.L2_OVERVIEW_LOW;
  }
  if (k >= LOD_SNAP_BOUNDARIES.L2_DETAIL_HIGH && k < LOD_THRESHOLDS.l2ToL3) {
    return LOD_SNAP_BOUNDARIES.L2_DETAIL_HIGH;
  }
  return undefined;
}

export const DEFAULT_SCALE_EXTENT: [number, number] = [0.1, 8];

type D3ZoomManagedElement = (HTMLElement | SVGSVGElement) & {
  __zoom?: { k: number; x: number; y: number };
};

export interface UseCanvasViewportInputOptions {
  hubId: ProcessHubId;
  ref: RefObject<HTMLElement | SVGSVGElement | null>;
  scaleExtent?: [number, number];
  disabled?: boolean;
  filter?: (event: Event) => boolean;
}

function defaultZoomFilter(event: Event): boolean {
  const pointerEvent = event as Event & { button?: number; ctrlKey?: boolean };
  return (!pointerEvent.ctrlKey || event.type === 'wheel') && !pointerEvent.button;
}

export function useCanvasViewportInput({
  hubId,
  ref,
  scaleExtent = DEFAULT_SCALE_EXTENT,
  disabled = false,
  filter,
}: UseCanvasViewportInputOptions): void {
  const setZoom = useCanvasViewportStore(s => s.setZoom);
  const setPan = useCanvasViewportStore(s => s.setPan);
  const syncingFromD3Ref = useRef(false);
  const syncingFromStoreRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return undefined;

    const selection = select<HTMLElement | SVGSVGElement, unknown>(element);
    const syncElementToStoreViewport = () => {
      const viewport = useCanvasViewportStore.getState().getViewport(hubId);
      const desiredTransform = zoomIdentity
        .translate(viewport.pan.x, viewport.pan.y)
        .scale(viewport.zoom);
      const currentTransform = (element as D3ZoomManagedElement).__zoom;
      if (
        currentTransform?.k === desiredTransform.k &&
        currentTransform.x === desiredTransform.x &&
        currentTransform.y === desiredTransform.y
      ) {
        return;
      }

      syncingFromStoreRef.current = true;
      try {
        selection.call(zoomBehavior.transform, desiredTransform);
      } finally {
        syncingFromStoreRef.current = false;
      }
    };
    const zoomBehavior = zoom<HTMLElement | SVGSVGElement, unknown>()
      .filter(event => defaultZoomFilter(event) && (filter ? filter(event) : true))
      .clickDistance(6)
      .scaleExtent(scaleExtent)
      .on('zoom', (event: D3ZoomEvent<HTMLElement | SVGSVGElement, unknown>) => {
        if (syncingFromStoreRef.current) return;

        syncingFromD3Ref.current = true;
        try {
          setZoom(hubId, event.transform.k);
          setPan(hubId, { x: event.transform.x, y: event.transform.y });
        } finally {
          syncingFromD3Ref.current = false;
        }
      })
      .on('end', (event: D3ZoomEvent<HTMLElement | SVGSVGElement, unknown>) => {
        if (syncingFromStoreRef.current) return;

        const target = snapTarget(event.transform.k);
        if (target === undefined) return;

        const snapTransform = zoomIdentity
          .translate(event.transform.x, event.transform.y)
          .scale(target);

        syncingFromStoreRef.current = true;
        try {
          selection
            .transition()
            .duration(SNAP_EASE_DURATION_MS)
            .call(zoomBehavior.transform, snapTransform);
        } finally {
          syncingFromStoreRef.current = false;
        }
      });

    selection.call(zoomBehavior);
    syncElementToStoreViewport();

    // Subscribe to the full store but short-circuit on reference equality of the
    // hub's viewport slice — avoids running syncElementToStoreViewport on every
    // unrelated mutation (e.g. setRailOpen, setViewMode, openChartCluster).
    let prevViewportRef = useCanvasViewportStore.getState().viewports[hubId];
    const unsubscribe = useCanvasViewportStore.subscribe(state => {
      if (syncingFromD3Ref.current) return;
      const nextViewport = state.viewports[hubId];
      if (nextViewport === prevViewportRef) return;
      prevViewportRef = nextViewport;
      syncElementToStoreViewport();
    });

    return () => {
      unsubscribe();
      selection.on('.zoom', null);
    };
  }, [disabled, filter, hubId, ref, scaleExtent, setPan, setZoom]);
}
