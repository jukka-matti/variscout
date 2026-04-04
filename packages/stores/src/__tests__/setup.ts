/**
 * Test setup — mock idb-keyval for Zustand persist middleware.
 * In tests, persist uses in-memory storage instead of IndexedDB.
 */
import { vi } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? undefined)),
  set: vi.fn((key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    store.delete(key);
    return Promise.resolve();
  }),
}));

// Clear the in-memory store between tests
beforeEach(() => {
  store.clear();
});
