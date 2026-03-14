/**
 * useNarration - Manages narration lifecycle: idle -> loading -> ready -> error.
 * Handles caching, debouncing, and abort control.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AIContext } from '@variscout/core';

export type NarrationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseNarrationOptions {
  /** AI context to generate narration for */
  context: AIContext | null;
  /** Function to fetch narration from AI service */
  fetchNarration?: (context: AIContext) => Promise<string>;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Minimum interval between requests in ms (default: 5000) */
  minIntervalMs?: number;
}

export interface UseNarrationReturn {
  /** Current narration text */
  narrative: string | null;
  /** Whether the narration is currently loading */
  isLoading: boolean;
  /** Whether the current narration is from cache */
  isCached: boolean;
  /** Current status */
  status: NarrationStatus;
  /** Error message if status is 'error' */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => void;
}

/** Simple hash for cache key */
function hashContext(ctx: AIContext): string {
  // Use a stable subset of context for cache key
  const key = JSON.stringify({
    s: ctx.stats ? { m: ctx.stats.mean, sd: ctx.stats.stdDev, n: ctx.stats.samples } : null,
    f: ctx.filters.map(f => `${f.factor}:${f.values.join(',')}`).sort(),
    v: ctx.violations,
  });
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return String(hash);
}

export function useNarration(options: UseNarrationOptions): UseNarrationReturn {
  const { context, fetchNarration, debounceMs = 2000, minIntervalMs = 5000 } = options;

  const [narrative, setNarrative] = useState<string | null>(null);
  const [status, setStatus] = useState<NarrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const cache = useRef<Map<string, string>>(new Map());
  const lastRequestTime = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Hash of the context currently displayed — prevents re-fetch on state-update re-renders */
  const activeHash = useRef<string | null>(null);

  const doFetch = useCallback(
    async (ctx: AIContext) => {
      if (!fetchNarration) return;

      // Check cache
      const key = hashContext(ctx);
      const cached = cache.current.get(key);
      if (cached) {
        activeHash.current = key;
        setNarrative(cached);
        setIsCached(true);
        setStatus('ready');
        return;
      }

      // Rate limit
      const now = Date.now();
      if (now - lastRequestTime.current < minIntervalMs) return;
      lastRequestTime.current = now;

      // Abort previous
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setError(null);

      try {
        const result = await fetchNarration(ctx);
        if (controller.signal.aborted) return;

        cache.current.set(key, result);
        activeHash.current = key;
        setNarrative(result);
        setIsCached(false);
        setStatus('ready');
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to generate narration');
        setStatus('error');
      }
    },
    [fetchNarration, minIntervalMs]
  );

  // Debounced auto-fetch when context changes
  useEffect(() => {
    if (!context || !fetchNarration) {
      setStatus('idle');
      return;
    }

    // If the context hash hasn't changed, skip — prevents re-fetch on state-update re-renders
    const key = hashContext(context);
    if (activeHash.current === key) return;

    // Check cache immediately
    const cached = cache.current.get(key);
    if (cached) {
      activeHash.current = key;
      setNarrative(cached);
      setIsCached(true);
      setStatus('ready');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(context), debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [context, fetchNarration, debounceMs, doFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const refresh = useCallback(() => {
    if (!context) return;
    // Clear cache for this context to force re-fetch
    const key = hashContext(context);
    cache.current.delete(key);
    activeHash.current = null;
    lastRequestTime.current = 0; // Reset rate limit
    doFetch(context);
  }, [context, doFetch]);

  return {
    narrative,
    isLoading: status === 'loading',
    isCached,
    status,
    error,
    refresh,
  };
}
