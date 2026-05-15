import { beforeEach, describe, expect, it } from 'vitest';
import {
  activeIPStorageKey,
  getActiveIPInitialState,
  useActiveIPStore,
  type ActiveIPScope,
} from '../activeIPStore';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
    configurable: true,
  });
}

const scope = (hubId: string, userId = 'user-1'): ActiveIPScope => ({ hubId, userId });

describe('useActiveIPStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useActiveIPStore.setState(getActiveIPInitialState());
  });

  it('declares STORE_LAYER as annotation-per-user', async () => {
    const mod = await import('../activeIPStore');
    expect(mod.STORE_LAYER).toBe('annotation-per-user');
  });

  it('builds an encoded per-hub per-user localStorage key', () => {
    expect(activeIPStorageKey(scope('hub A/1', 'analyst@example.com'))).toBe(
      'variscout:activeIP:hub%20A%2F1:analyst%40example.com'
    );
  });

  it('sets and gets the active improvement project for a scope', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123);

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toEqual({
      ipId: 'ip-1',
      setAt: 123,
    });
    expect(JSON.parse(localStorage.getItem(activeIPStorageKey(scope('hub-1'))) ?? '')).toEqual({
      ipId: 'ip-1',
      setAt: 123,
    });
  });

  it('keeps in-memory state when localStorage setItem throws', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('storage blocked');
    };

    try {
      expect(() =>
        useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123)
      ).not.toThrow();
      expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toEqual({
        ipId: 'ip-1',
        setAt: 123,
      });
    } finally {
      localStorage.setItem = original;
    }
  });

  it('rehydrates the active improvement project from localStorage', () => {
    localStorage.setItem(
      activeIPStorageKey(scope('hub-1')),
      JSON.stringify({ ipId: 'ip-1', setAt: 123 })
    );

    useActiveIPStore.getState().rehydrateActiveIP(scope('hub-1'));

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toEqual({
      ipId: 'ip-1',
      setAt: 123,
    });
  });

  it('clears the active improvement project for a scope', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123);

    useActiveIPStore.getState().clearActiveIP(scope('hub-1'));

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toBeNull();
    expect(localStorage.getItem(activeIPStorageKey(scope('hub-1')))).toBeNull();
  });

  it('clears in-memory state when localStorage removeItem throws', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123);
    const original = localStorage.removeItem;
    localStorage.removeItem = () => {
      throw new Error('storage blocked');
    };

    try {
      expect(() => useActiveIPStore.getState().clearActiveIP(scope('hub-1'))).not.toThrow();
      expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toBeNull();
    } finally {
      localStorage.removeItem = original;
    }
  });

  it('treats throwing localStorage getItem as no persisted active IP', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123);
    const original = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('storage blocked');
    };

    try {
      expect(() => useActiveIPStore.getState().rehydrateActiveIP(scope('hub-1'))).not.toThrow();
      expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toBeNull();
    } finally {
      localStorage.getItem = original;
    }
  });

  it('keeps in-memory state when localStorage getter throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage unavailable');
      },
    });

    try {
      expect(() =>
        useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123)
      ).not.toThrow();
      expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toEqual({
        ipId: 'ip-1',
        setAt: 123,
      });
      expect(() => useActiveIPStore.getState().clearActiveIP(scope('hub-1'))).not.toThrow();
      expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toBeNull();
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'localStorage', descriptor);
      }
    }
  });

  it('removes corrupt JSON during rehydrate', () => {
    const key = activeIPStorageKey(scope('hub-1'));
    localStorage.setItem(key, '{not-json');

    useActiveIPStore.getState().rehydrateActiveIP(scope('hub-1'));

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('isolates active improvement projects by hub', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1'), 'ip-1', 123);
    useActiveIPStore.getState().setActiveIP(scope('hub-2'), 'ip-2', 456);

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1'))?.ipId).toBe('ip-1');
    expect(useActiveIPStore.getState().getActiveIP(scope('hub-2'))?.ipId).toBe('ip-2');
  });

  it('isolates active improvement projects by user', () => {
    useActiveIPStore.getState().setActiveIP(scope('hub-1', 'user-1'), 'ip-1', 123);
    useActiveIPStore.getState().setActiveIP(scope('hub-1', 'user-2'), 'ip-2', 456);

    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1', 'user-1'))?.ipId).toBe('ip-1');
    expect(useActiveIPStore.getState().getActiveIP(scope('hub-1', 'user-2'))?.ipId).toBe('ip-2');
  });
});
