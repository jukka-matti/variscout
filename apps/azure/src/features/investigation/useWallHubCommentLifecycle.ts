/**
 * useWallHubCommentLifecycle — Azure integration for per-hub SSE comments.
 *
 * Thin adapter that reads the currently selected hubs from wallLayoutStore
 * and opens an SSE stream (via useHubCommentStream) for each one. Only runs
 * when the Wall view is active; otherwise no streams open.
 *
 * Why "selected" and not "all visible": selection is the already-tracked
 * proxy for "hub the user is actually looking at" — selecting a hub opens
 * its composer / detail pane, which is where the live discussion renders.
 * Opening a stream for every hub on the canvas would be wasteful at scale
 * and racy against Phase 13's LOD / clustering work.
 *
 * The hook is side-effect-only (returns void). Incoming comments flow into
 * investigationStore.suspectedCauses[*].comments via the shared hook.
 */

import { useMemo } from 'react';
import { useProjectStore, useWallLayoutStore } from '@variscout/stores';
import { useHubCommentStream } from '@variscout/hooks';

export function useWallHubCommentLifecycle(): void {
  const projectId = useProjectStore(s => s.projectId);
  const viewMode = useWallLayoutStore(s => s.viewMode);
  const selection = useWallLayoutStore(s => s.selection);

  // Stable reference — the Set identity changes on every mutation, so
  // memoize on its size + sorted-contents string so unrelated store
  // changes don't churn the hook.
  const visibleHubIds = useMemo(() => {
    if (viewMode !== 'wall') return [];
    return Array.from(selection).sort();
    // selection is a Set — React treats it as stable across renders unless
    // explicitly replaced, so it's fine to depend on it directly.
  }, [viewMode, selection]);

  useHubCommentStream({ projectId, visibleHubIds });
}
