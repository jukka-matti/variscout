/**
 * useHubCommentStream — live SSE subscription to per-hub comment streams.
 *
 * Mirrors the brainstorm session SSE pattern in `useBrainstormSession.ts`.
 * The Investigation Wall renders hypothesis hubs (SuspectedCause), each with
 * an optional live team discussion. This hook opens one EventSource per
 * visible hub and dispatches incoming `comment` events to the
 * `investigationStore` via `addHubComment`'s server-idempotent id path, or
 * directly via `setState` when the comment is a pure incoming observation
 * from another client (dedup by id prevents self-echo loops).
 *
 * Key design choices:
 * - One EventSource per visible hub. When a hub scrolls out of view it's
 *   removed from the array and its stream closes. This keeps connection
 *   counts bounded to the visible viewport, not the whole wall.
 * - Reconnects on error with a 1 s backoff (matches brainstorm behavior).
 * - Dedups incoming comments by id. The server echoes our own appends back
 *   via the stream; matching id with the optimistic local copy is a no-op.
 * - Never throws. A closed server / missing endpoint is a silent degrade —
 *   the Wall still works in single-user mode (optimistic updates persist
 *   via the store's normal Dexie path).
 *
 * PWA fallback: apps/pwa has no server. The PWA twin
 * (`useWallHubCommentLocal`) is a no-op stub with the same signature so
 * the Wall's render tree does not branch on app identity.
 */

import { useEffect, useRef } from 'react';
import { useInvestigationStore } from '@variscout/stores';
import type { FindingComment } from '@variscout/core/findings';

interface UseHubCommentStreamOptions {
  /** Active project id. Null disables the hook (no project = no stream). */
  projectId: string | null | undefined;
  /**
   * Hub ids currently visible in the viewport. Streams are opened for hubs
   * in this list and closed for hubs that leave it. Pass a stable reference
   * (memoize) to avoid unnecessary reconnects.
   */
  visibleHubIds: string[];
}

interface HubStreamEntry {
  es: EventSource;
  retryTimer?: ReturnType<typeof setTimeout>;
}

const RECONNECT_BACKOFF_MS = 1000;

/**
 * Append a comment to a hub if no comment with the same id already exists.
 * Used to dedup incoming SSE echoes against optimistically added comments.
 */
function mergeIncomingComment(hubId: string, incoming: FindingComment): void {
  useInvestigationStore.setState(state => ({
    suspectedCauses: state.suspectedCauses.map(h => {
      if (h.id !== hubId) return h;
      const existing = h.comments ?? [];
      if (existing.some(c => c.id === incoming.id)) return h;
      return { ...h, comments: [...existing, incoming] };
    }),
  }));
}

export function useHubCommentStream({
  projectId,
  visibleHubIds,
}: UseHubCommentStreamOptions): void {
  // Map<hubId, HubStreamEntry> — one EventSource per visible hub.
  // Stored in a ref so streams persist across renders; we diff visible
  // hubs against the ref to decide what to open/close each render, and
  // only tear everything down on projectId change or unmount.
  const streamsRef = useRef<Map<string, HubStreamEntry>>(new Map());

  // Track the last projectId we saw so we can tear down on change (not just
  // on unmount — otherwise rebuilding the array of visibleHubIds closes the
  // streams that should persist).
  const lastProjectIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const streams = streamsRef.current;

    // Helper: close a single hub's stream + any pending retry timer.
    const closeStream = (hubId: string): void => {
      const entry = streams.get(hubId);
      if (!entry) return;
      if (entry.retryTimer) clearTimeout(entry.retryTimer);
      entry.es.close();
      streams.delete(hubId);
    };

    const closeAll = (): void => {
      for (const hubId of Array.from(streams.keys())) closeStream(hubId);
    };

    // Tear down completely when the project changes (or becomes null).
    if (lastProjectIdRef.current !== projectId) {
      closeAll();
      lastProjectIdRef.current = projectId;
    }

    if (!projectId) return;

    const visibleSet = new Set(visibleHubIds);

    // 1. Close streams whose hub is no longer visible.
    for (const hubId of Array.from(streams.keys())) {
      if (!visibleSet.has(hubId)) closeStream(hubId);
    }

    // 2. Open streams for newly-visible hubs.
    const openStream = (hubId: string): void => {
      // Build a fresh ES for this hub. Factored so reconnect-on-error can
      // call it again without stale closure refs.
      const url = `/api/hub-comments/stream?projectId=${encodeURIComponent(
        projectId
      )}&hubId=${encodeURIComponent(hubId)}`;
      const es = new EventSource(url);
      const entry: HubStreamEntry = { es };
      streams.set(hubId, entry);

      es.onmessage = event => {
        try {
          const data = JSON.parse(event.data as string) as {
            type: string;
            comments?: FindingComment[];
            comment?: FindingComment;
          };
          if (data.type === 'init' && Array.isArray(data.comments)) {
            // Merge server's known comments into the hub (dedup by id).
            for (const c of data.comments) {
              mergeIncomingComment(hubId, c);
            }
          } else if (data.type === 'comment' && data.comment) {
            mergeIncomingComment(hubId, data.comment);
          }
        } catch {
          // Ignore malformed frames — keep the connection alive.
        }
      };

      es.onerror = () => {
        // Close + schedule reconnect. Browsers auto-reconnect on network
        // flakiness, but server-terminated streams (e.g. pod restart) need
        // a manual nudge. 1 s backoff matches brainstorm behavior.
        es.close();
        const current = streams.get(hubId);
        if (!current) return; // cleaned up elsewhere
        if (current.retryTimer) clearTimeout(current.retryTimer);
        current.retryTimer = setTimeout(() => {
          // Only retry if still visible.
          if (streams.has(hubId)) openStream(hubId);
        }, RECONNECT_BACKOFF_MS);
      };
    };

    for (const hubId of visibleHubIds) {
      if (!streams.has(hubId)) {
        openStream(hubId);
      }
    }
  }, [projectId, visibleHubIds]);

  // Unmount-only teardown. Separate effect so renders that only change
  // visibleHubIds don't tear down persisting streams.
  useEffect(() => {
    const streams = streamsRef.current;
    return () => {
      for (const hubId of Array.from(streams.keys())) {
        const entry = streams.get(hubId);
        if (!entry) continue;
        if (entry.retryTimer) clearTimeout(entry.retryTimer);
        entry.es.close();
        streams.delete(hubId);
      }
    };
  }, []);
}

export type { UseHubCommentStreamOptions };
