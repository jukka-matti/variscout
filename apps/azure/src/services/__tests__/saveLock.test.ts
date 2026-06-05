import { afterEach, describe, expect, it } from 'vitest';
import { DOCUMENT_SAVE_LOCK_PREFIX, withDocumentSaveLock } from '../saveLock';

function installMockLockManager() {
  const queues = new Map<string, Promise<unknown>>();
  const requested: string[] = [];
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (name: string, _opts: unknown, cb: () => Promise<unknown>) => {
        requested.push(name);
        const prev = queues.get(name) ?? Promise.resolve();
        const next = prev.then(() => cb());
        queues.set(
          name,
          next.catch(() => undefined)
        );
        return next;
      },
    },
  });
  return requested;
}

afterEach(() => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
});

describe('withDocumentSaveLock (PO-8b)', () => {
  it('runs the callback without a lock when navigator.locks is absent (jsdom / older Safari)', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    const result = await withDocumentSaveLock('doc-a', async () => 'ran');
    expect(result).toBe('ran');
  });

  it('requests an exclusive per-document lock named by the document', async () => {
    const requested = installMockLockManager();
    await withDocumentSaveLock('My Project', async () => undefined);
    expect(requested).toEqual([`${DOCUMENT_SAVE_LOCK_PREFIX}My Project`]);
  });

  it('serializes two callbacks on the SAME document (negative control: different documents run concurrently)', async () => {
    installMockLockManager();
    const events: string[] = [];
    const slow = (label: string) => async () => {
      events.push(`${label}-start`);
      await new Promise(resolve => setTimeout(resolve, 10));
      events.push(`${label}-end`);
    };

    await Promise.all([
      withDocumentSaveLock('same-doc', slow('a')),
      withDocumentSaveLock('same-doc', slow('b')),
    ]);
    expect(events).toEqual(['a-start', 'a-end', 'b-start', 'b-end']);

    events.length = 0;
    await Promise.all([
      withDocumentSaveLock('doc-1', slow('x')),
      withDocumentSaveLock('doc-2', slow('y')),
    ]);
    // different lock names → no serialization
    expect(events.slice(0, 2)).toEqual(['x-start', 'y-start']);
  });

  it('releases the lock when the callback throws (the next waiter still runs)', async () => {
    installMockLockManager();
    await expect(
      withDocumentSaveLock('same-doc', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    const result = await withDocumentSaveLock('same-doc', async () => 'after-throw');
    expect(result).toBe('after-throw');
  });
});
