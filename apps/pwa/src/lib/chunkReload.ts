import React, { type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_SENTINEL = 'variscout:chunk-reload-attempted';
const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed/i;

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'ChunkLoadError') return true;
  return CHUNK_ERROR_PATTERN.test(error.message);
}

async function evictWorkboxPrecaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await window.caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith('workbox-precache-')).map(key => window.caches.delete(key))
    );
  } catch {
    // Best-effort; cache eviction must never bubble.
  }
}

export async function loadWithChunkRetry<T>(importer: () => Promise<T>): Promise<T> {
  try {
    return await importer();
  } catch (error) {
    if (!isChunkLoadError(error)) throw error;

    let alreadyAttempted = false;
    try {
      alreadyAttempted = window.sessionStorage.getItem(RELOAD_SENTINEL) === '1';
    } catch {
      // noop
    }
    if (alreadyAttempted) throw error;

    try {
      window.sessionStorage.setItem(RELOAD_SENTINEL, '1');
    } catch {
      // noop
    }
    await evictWorkboxPrecaches();
    window.location.reload();
    return new Promise<T>(() => {});
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return React.lazy(() => loadWithChunkRetry(importer));
}
