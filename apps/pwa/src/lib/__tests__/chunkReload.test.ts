import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { lazyWithRetry, loadWithChunkRetry } from '../chunkReload';

const RELOAD_SENTINEL = 'variscout:chunk-reload-attempted';

interface CachesShape {
  keys: () => Promise<string[]>;
  delete: (key: string) => Promise<boolean>;
}

let reloadSpy: ReturnType<typeof vi.fn>;
let cachesMock: CachesShape & {
  keys: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
let originalCaches: PropertyDescriptor | undefined;

beforeEach(() => {
  window.sessionStorage.clear();

  reloadSpy = vi.fn();
  vi.stubGlobal('location', { reload: reloadSpy, href: 'http://localhost/' });

  cachesMock = {
    keys: vi.fn(async () => [
      'workbox-precache-v2-https://example.com/',
      'workbox-runtime-cache',
      'workbox-precache-v2-other',
      'js-cache',
    ]),
    delete: vi.fn(async () => true),
  };
  originalCaches = Object.getOwnPropertyDescriptor(window, 'caches');
  Object.defineProperty(window, 'caches', {
    value: cachesMock,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalCaches) {
    Object.defineProperty(window, 'caches', originalCaches);
  } else {
    delete (window as unknown as { caches?: unknown }).caches;
  }
});

describe('loadWithChunkRetry', () => {
  it('returns the resolved module on success', async () => {
    const module = { default: 'value' };
    const result = await loadWithChunkRetry(async () => module);
    expect(result).toBe(module);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(RELOAD_SENTINEL)).toBeNull();
  });

  it('reloads, sets sentinel, and evicts workbox-precache-* on first ChunkLoadError', async () => {
    vi.useFakeTimers();
    try {
      const err = new Error('Loading chunk PasteScreen failed');
      err.name = 'ChunkLoadError';

      void loadWithChunkRetry(async () => {
        throw err;
      });

      await vi.runAllTimersAsync();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      expect(window.sessionStorage.getItem(RELOAD_SENTINEL)).toBe('1');
      expect(cachesMock.delete).toHaveBeenCalledWith('workbox-precache-v2-https://example.com/');
      expect(cachesMock.delete).toHaveBeenCalledWith('workbox-precache-v2-other');
      expect(cachesMock.delete).not.toHaveBeenCalledWith('workbox-runtime-cache');
      expect(cachesMock.delete).not.toHaveBeenCalledWith('js-cache');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rethrows on second ChunkLoadError when sentinel is already set', async () => {
    window.sessionStorage.setItem(RELOAD_SENTINEL, '1');

    const err = new Error('Loading chunk PasteScreen failed');
    err.name = 'ChunkLoadError';

    await expect(
      loadWithChunkRetry(async () => {
        throw err;
      })
    ).rejects.toBe(err);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('reloads on a non-ChunkLoadError name when message matches the dynamic-import pattern', async () => {
    vi.useFakeTimers();
    try {
      const err = new Error('Failed to fetch dynamically imported module: /assets/PasteScreen.js');

      void loadWithChunkRetry(async () => {
        throw err;
      });

      await vi.runAllTimersAsync();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      expect(window.sessionStorage.getItem(RELOAD_SENTINEL)).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rethrows immediately for a non-chunk error and does not reload', async () => {
    const err = new TypeError('Something unrelated exploded');

    await expect(
      loadWithChunkRetry(async () => {
        throw err;
      })
    ).rejects.toBe(err);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(RELOAD_SENTINEL)).toBeNull();
  });

  it('still reloads when the caches API is unavailable', async () => {
    vi.useFakeTimers();
    try {
      delete (window as unknown as { caches?: unknown }).caches;

      const err = new Error('Loading chunk failed');
      err.name = 'ChunkLoadError';

      void loadWithChunkRetry(async () => {
        throw err;
      });

      await vi.runAllTimersAsync();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('still reloads when sessionStorage.getItem throws (Safari private mode)', async () => {
    vi.useFakeTimers();
    const originalSessionStorage = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
    try {
      const throwingStorage = {
        getItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError', 'SecurityError');
        }),
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError', 'SecurityError');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: throwingStorage,
        configurable: true,
        writable: true,
      });

      const err = new Error('Loading chunk failed');
      err.name = 'ChunkLoadError';

      void loadWithChunkRetry(async () => {
        throw err;
      });

      await vi.runAllTimersAsync();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      expect(throwingStorage.getItem).toHaveBeenCalledWith(RELOAD_SENTINEL);
      expect(throwingStorage.setItem).toHaveBeenCalledWith(RELOAD_SENTINEL, '1');
    } finally {
      if (originalSessionStorage) {
        Object.defineProperty(window, 'sessionStorage', originalSessionStorage);
      }
      vi.useRealTimers();
    }
  });
});

describe('lazyWithRetry', () => {
  it('renders the resolved default export through Suspense', async () => {
    const FakeComponent: React.FC = () => React.createElement('span', null, 'ok');
    const Lazy = lazyWithRetry(async () => ({ default: FakeComponent }));

    // First render kicks off the loader; second render observes the resolved module.
    renderToStaticMarkup(
      React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy))
    );
    await new Promise(resolve => setTimeout(resolve, 10));

    const html = renderToStaticMarkup(
      React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy))
    );
    expect(html).toBe('<span>ok</span>');
  });
});
