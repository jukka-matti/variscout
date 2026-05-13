import { useEffect, useRef, type RefObject } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';

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
      });

    selection.call(zoomBehavior);
    syncElementToStoreViewport();

    const unsubscribe = useCanvasViewportStore.subscribe(() => {
      if (syncingFromD3Ref.current) return;
      syncElementToStoreViewport();
    });

    return () => {
      unsubscribe();
      selection.on('.zoom', null);
    };
  }, [disabled, filter, hubId, ref, scaleExtent, setPan, setZoom]);
}
