import { useProjectStore } from '@variscout/stores';
import { useInvestigationStore } from '@variscout/stores';

/**
 * Set up store subscriptions that auto-save when project state changes.
 *
 * Subscribes to `useProjectStore` and `useInvestigationStore`. On any state
 * change the gate is checked (`rawData.length > 0 && projectId !== null`); if
 * open, the `onSave` callback is debounced by `debounceMs` (default 2000 ms).
 *
 * The first change emitted by each store (the initial subscription fire) is
 * skipped — mirroring `useAutoSave`'s "skip first render" behaviour so that
 * loading a project does not immediately trigger a save.
 *
 * @param onSave     - Callback invoked when the debounce timer fires
 * @param debounceMs - Debounce delay in milliseconds (default 2000)
 * @returns          Cleanup function that unsubscribes both stores and clears
 *                   any pending timeout
 */
export function setupCloudSync(onSave: () => void, debounceMs: number = 2000): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let projectStoreInitialized = false;
  let investigationStoreInitialized = false;

  function scheduleOrSkip(initialized: boolean): boolean {
    if (!initialized) {
      // Skip the initial subscription fire
      return true;
    }

    const { rawData, projectId } = useProjectStore.getState();
    if (rawData.length === 0 || projectId === null) {
      return false;
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      onSave();
    }, debounceMs);

    return false;
  }

  const unsubProject = useProjectStore.subscribe(() => {
    if (!projectStoreInitialized) {
      projectStoreInitialized = true;
      return;
    }
    scheduleOrSkip(true);
  });

  const unsubInvestigation = useInvestigationStore.subscribe(() => {
    if (!investigationStoreInitialized) {
      investigationStoreInitialized = true;
      return;
    }
    scheduleOrSkip(true);
  });

  return () => {
    unsubProject();
    unsubInvestigation();
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
}
