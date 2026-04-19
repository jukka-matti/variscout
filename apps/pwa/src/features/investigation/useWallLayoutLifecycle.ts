/**
 * useWallLayoutLifecycle — rehydrate/persist wallLayoutStore per project (PWA)
 *
 * The PWA is session-only: projectId is always null or undefined in normal
 * use, so this hook is effectively a no-op at runtime. It exists so the PWA
 * shares the same component API as the Azure app and so tests can verify the
 * hook's contract in isolation.
 *
 * On project open (projectId defined or changed): calls rehydrateWallLayout to
 * restore saved zoom/pan/viewMode/railOpen/nodePositions from IndexedDB.
 *
 * While a project is active: subscribes to wallLayoutStore and debounce-persists
 * any change to the 5 persistable fields after 500 ms of inactivity.
 *
 * Errors from Dexie are non-fatal — they are silently swallowed so a DB failure
 * never crashes the app.
 */

import { useEffect } from 'react';
import { useWallLayoutStore, persistWallLayout, rehydrateWallLayout } from '@variscout/stores';

export function useWallLayoutLifecycle(projectId: string | null | undefined): void {
  useEffect(() => {
    if (!projectId) return;

    // Restore saved layout for this project on mount / project switch.
    rehydrateWallLayout(projectId).catch(() => {
      // Non-fatal — fall back to defaults.
    });

    // Debounced persist on any persistable store change.
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const unsubscribe = useWallLayoutStore.subscribe((state, prev) => {
      const changed =
        state.viewMode !== prev.viewMode ||
        state.zoom !== prev.zoom ||
        state.pan !== prev.pan ||
        state.railOpen !== prev.railOpen ||
        state.nodePositions !== prev.nodePositions;
      if (!changed) return;

      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) {
          persistWallLayout(projectId).catch(() => undefined);
        }
      }, 500);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [projectId]);
}
