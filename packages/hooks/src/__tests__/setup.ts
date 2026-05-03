/**
 * Hooks test setup — supplements the root test/setup.ts.
 *
 * Provides a minimal in-memory IndexedDB stub so that the sessionStore's
 * Zustand persist middleware (which uses idb-keyval internally) does not
 * throw "indexedDB is not defined" or "Cannot set properties of undefined"
 * when tests call useSessionStore.setState() in a jsdom environment.
 *
 * The stub implements only the subset of the IndexedDB API that idb-keyval
 * actually exercises:
 *   - indexedDB.open(name)  → IDBOpenDBRequest (fires onsuccess/onupgradeneeded)
 *   - db.transaction(stores, mode).objectStore(name)  → IDBObjectStore stub
 *   - objectStore.get(key)   → IDBRequest (settable onsuccess)
 *   - objectStore.put(value, key)  → IDBRequest (settable onsuccess)
 *   - promisifyRequest() sets .onsuccess AND .oncomplete on the same object
 *
 * idb-keyval's set() path:
 *   store.put(value, key);
 *   return promisifyRequest(store.transaction);  ← resolves on transaction.oncomplete
 *
 * idb-keyval's get() path:
 *   return promisifyRequest(store.get(key));     ← resolves on request.onsuccess
 */

if (typeof window !== 'undefined') {
  const memDb = new Map<string, unknown>();

  /**
   * Creates an IDB-like request that fires onsuccess/oncomplete asynchronously.
   * idb-keyval's promisifyRequest() does:
   *   request.oncomplete = request.onsuccess = () => resolve(request.result);
   * so we need a plain object whose properties are settable.
   */
  function makeRequest<T>(result: T): {
    result: T;
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
    oncomplete: (() => void) | null;
  } {
    const req = {
      result,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      oncomplete: null as (() => void) | null,
    };
    // Fire in a microtask — mirrors real IDB's async dispatch
    Promise.resolve().then(() => {
      req.onsuccess?.();
      req.oncomplete?.();
    });
    return req;
  }

  // The transaction object returned by db.transaction()
  // idb-keyval's set() calls promisifyRequest(store.transaction) → resolves on .oncomplete
  function makeTransaction(_storeName: string) {
    const txReq = {
      result: undefined as undefined,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      oncomplete: null as (() => void) | null,
    };

    const objectStore = {
      get: (key: string) => makeRequest(memDb.get(String(key)) ?? undefined),
      put: (value: unknown, key: string) => {
        memDb.set(String(key), value);
        // Fire tx.oncomplete after a microtask so idb-keyval's promisifyRequest resolves
        Promise.resolve().then(() => {
          txReq.onsuccess?.();
          txReq.oncomplete?.();
        });
        return makeRequest(undefined);
      },
      delete: (key: string) => {
        memDb.delete(String(key));
        Promise.resolve().then(() => {
          txReq.onsuccess?.();
          txReq.oncomplete?.();
        });
        return makeRequest(undefined);
      },
      // idb-keyval reads store.transaction from within the callback
      get transaction() {
        return txReq;
      },
    };

    return { objectStore: (_name: string) => objectStore, txReq };
  }

  function makeDb() {
    return {
      createObjectStore: () => ({}),
      transaction: (storeName: string | string[]) => {
        const name = Array.isArray(storeName) ? storeName[0] : storeName;
        return makeTransaction(name);
      },
      onclose: null as (() => void) | null,
      close: () => {},
    };
  }

  const db = makeDb();

  (window as Record<string, unknown>)['indexedDB'] = {
    open: (_dbName: string, _version?: number) => {
      const openReq = {
        result: db,
        error: null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        oncomplete: null as (() => void) | null,
        onupgradeneeded: null as
          | ((e: { target: { result: ReturnType<typeof makeDb> } }) => void)
          | null,
      };
      Promise.resolve().then(() => {
        openReq.onupgradeneeded?.({ target: { result: db } });
        openReq.onsuccess?.();
        openReq.oncomplete?.();
      });
      return openReq;
    },
    deleteDatabase: (_name: string) => makeRequest(undefined),
  };

  beforeEach(() => {
    memDb.clear();
  });
}
