import { useEffect, type RefObject } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';

export const DEFAULT_SCALE_EXTENT: [number, number] = [0.1, 8];

export interface UseCanvasViewportInputOptions {
  hubId: ProcessHubId;
  ref: RefObject<HTMLElement | SVGSVGElement | null>;
  scaleExtent?: [number, number];
}

export function useCanvasViewportInput({
  hubId,
  ref,
  scaleExtent = DEFAULT_SCALE_EXTENT,
}: UseCanvasViewportInputOptions): void {
  const setZoom = useCanvasViewportStore(s => s.setZoom);
  const setPan = useCanvasViewportStore(s => s.setPan);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const selection = select<HTMLElement | SVGSVGElement, unknown>(element);
    const zoomBehavior = zoom<HTMLElement | SVGSVGElement, unknown>()
      .scaleExtent(scaleExtent)
      .on('zoom', (event: D3ZoomEvent<HTMLElement | SVGSVGElement, unknown>) => {
        setZoom(hubId, event.transform.k);
        setPan(hubId, { x: event.transform.x, y: event.transform.y });
      });

    selection.call(zoomBehavior);

    const viewport = useCanvasViewportStore.getState().getViewport(hubId);
    selection.call(
      zoomBehavior.transform,
      zoomIdentity.translate(viewport.pan.x, viewport.pan.y).scale(viewport.zoom)
    );

    return () => {
      selection.on('.zoom', null);
    };
  }, [hubId, ref, scaleExtent, setPan, setZoom]);
}
