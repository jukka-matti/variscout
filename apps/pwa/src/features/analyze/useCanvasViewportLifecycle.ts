import { useEffect } from 'react';
import {
  persistCanvasViewport,
  rehydrateCanvasViewport,
  useCanvasViewportStore,
} from '@variscout/stores';
import { normalizeProcessHubId } from '@variscout/core';

export function useCanvasViewportLifecycle(hubId: string | null | undefined): void {
  useEffect(() => {
    if (!hubId) return;
    const boundHubId = normalizeProcessHubId(hubId);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    rehydrateCanvasViewport(boundHubId, () => !cancelled).catch(() => undefined);

    const unsubscribe = useCanvasViewportStore.subscribe((state, prev) => {
      const changed =
        state.viewMode !== prev.viewMode ||
        state.railOpen !== prev.railOpen ||
        state.viewports[boundHubId] !== prev.viewports[boundHubId];
      if (!changed) return;

      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) {
          persistCanvasViewport(boundHubId).catch(() => undefined);
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
