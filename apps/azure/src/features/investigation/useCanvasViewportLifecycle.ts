import { useEffect } from 'react';
import {
  persistCanvasViewport,
  rehydrateCanvasViewport,
  useCanvasViewportStore,
} from '@variscout/stores';

export function useCanvasViewportLifecycle(hubId: string | null | undefined): void {
  useEffect(() => {
    if (!hubId) return;

    rehydrateCanvasViewport(hubId).catch(() => undefined);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const unsubscribe = useCanvasViewportStore.subscribe((state, prev) => {
      const changed =
        state.viewMode !== prev.viewMode ||
        state.railOpen !== prev.railOpen ||
        state.viewports[hubId] !== prev.viewports[hubId];
      if (!changed) return;

      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) {
          persistCanvasViewport(hubId).catch(() => undefined);
        }
      }, 500);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [hubId]);
}
