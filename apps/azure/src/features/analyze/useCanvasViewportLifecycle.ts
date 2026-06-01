import { useEffect, useRef } from 'react';
import {
  getLocalViewportUpdatedAt,
  persistCanvasViewport,
  rehydrateCanvasViewport,
  useCanvasViewportStore,
} from '@variscout/stores';
import { normalizeProcessHubId } from '@variscout/core';
import { safeTrackEvent } from '../../lib/appInsights';
import { loadBlobCanvasViewport, saveBlobCanvasViewport } from '../../services/blobClient';
import type { ViewportBlobShape } from '../../services/blobClient';

/**
 * Azure canvas viewport lifecycle: Dexie cache + Blob sync (ADR-081 §2).
 *
 * Mount sequence:
 *   1. Rehydrate from local Dexie (instant cache, avoids layout shift).
 *   2. Fetch per-Hub Blob; if it exists and is newer than Dexie, apply to
 *      store and write back to Dexie for the next offline session.
 *   3. Track the Blob ETag in a ref for subsequent writes.
 *
 * Mutation sequence (debounced 500 ms):
 *   1. Persist to Dexie (existing call, keeps PWA parity).
 *   2. PUT to Blob with If-Match ETag.
 *      - Success → update etagRef.
 *      - Precondition-failed → log telemetry (no PII), re-fetch Blob, apply
 *        if newer, update etagRef. This is viewport UI preference sync, not
 *        document persistence, and does not blind-overwrite document state.
 */
export function useCanvasViewportLifecycle(hubId: string | null | undefined): void {
  const etagRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hubId) return;
    const boundHubId = normalizeProcessHubId(hubId);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    // ── Mount: Dexie cache (instant) then Blob reconcile ──────────────────
    rehydrateCanvasViewport(boundHubId, () => !cancelled).catch(() => undefined);

    void (async () => {
      // Read local updatedAt before the async Blob fetch so we compare
      // against the version already loaded by rehydrateCanvasViewport.
      const localUpdatedAt = await getLocalViewportUpdatedAt(boundHubId);

      if (cancelled) return;

      const loaded = await loadBlobCanvasViewport(boundHubId);
      if (cancelled) return;
      if (!loaded) return;

      etagRef.current = loaded.etag;

      if (loaded.snapshot.updatedAt > localUpdatedAt) {
        const { zoom, pan, currentLevel, focalStepId, nodePositions, groupByTributary } =
          loaded.snapshot;
        useCanvasViewportStore.setState(s => ({
          viewports: {
            ...s.viewports,
            [boundHubId]: { zoom, pan, currentLevel, focalStepId, nodePositions, groupByTributary },
          },
        }));
        // Write back to Dexie so the next offline session gets this state.
        await persistCanvasViewport(boundHubId).catch(() => undefined);
      }
    })();

    // ── Mutation: debounced Dexie + Blob persist ───────────────────────────
    const unsubscribe = useCanvasViewportStore.subscribe((state, prev) => {
      const changed =
        state.viewMode !== prev.viewMode ||
        state.railOpen !== prev.railOpen ||
        state.viewports[boundHubId] !== prev.viewports[boundHubId];
      if (!changed) return;

      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;

        // Dexie persist (existing).
        persistCanvasViewport(boundHubId).catch(() => undefined);

        // Build Blob snapshot from current store state.
        const current = useCanvasViewportStore.getState();
        const vp = current.viewports[boundHubId];
        if (!vp) return; // hub not in store yet; skip blob write

        const snapshot: ViewportBlobShape = {
          zoom: vp.zoom,
          pan: vp.pan,
          currentLevel: vp.currentLevel,
          ...(vp.focalStepId !== undefined ? { focalStepId: vp.focalStepId } : {}),
          nodePositions: vp.nodePositions,
          groupByTributary: vp.groupByTributary,
          updatedAt: Date.now(),
        };

        void saveBlobCanvasViewport(boundHubId, snapshot, etagRef.current).then(result => {
          if (cancelled) return;

          if (result.ok) {
            etagRef.current = result.etag;
            return;
          }

          if (result.reason === 'precondition-failed') {
            // Log conflict — no PII; structural metadata only.
            safeTrackEvent('canvas-viewport-sync-conflict', {
              hubId: 'redacted', // never log actual hubId per ADR-059
            });

            // Re-fetch Blob; apply if newer than our last write.
            void loadBlobCanvasViewport(boundHubId).then(loaded => {
              if (cancelled || !loaded) return;
              etagRef.current = loaded.etag;

              const currentVp = useCanvasViewportStore.getState().viewports[boundHubId];
              if (!currentVp) return;

              // Viewport UI sync: apply the server-accepted snapshot to the local store.
              const { zoom, pan, currentLevel, focalStepId, nodePositions, groupByTributary } =
                loaded.snapshot;
              useCanvasViewportStore.setState(s => ({
                viewports: {
                  ...s.viewports,
                  [boundHubId]: {
                    zoom,
                    pan,
                    currentLevel,
                    focalStepId,
                    nodePositions,
                    groupByTributary,
                  },
                },
              }));
            });
          }
          // auth / network / unknown: silently ignore — next mutation will retry naturally.
        });
      }, 500);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [hubId]);
}
