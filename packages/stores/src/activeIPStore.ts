import { create } from 'zustand';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

export const STORE_LAYER = 'annotation-per-user' as const;

export interface ActiveIPState {
  ipId: ImprovementProject['id'];
  setAt: number;
}

export interface ActiveIPScope {
  hubId: ProcessHub['id'];
  userId: string;
}

export interface ActiveIPStoreState {
  activeIPs: Record<string, ActiveIPState>;
}

export interface ActiveIPStoreActions {
  getActiveIP: (scope: ActiveIPScope) => ActiveIPState | null;
  setActiveIP: (scope: ActiveIPScope, ipId: ImprovementProject['id'], setAt?: number) => void;
  clearActiveIP: (scope: ActiveIPScope) => void;
  rehydrateActiveIP: (scope: ActiveIPScope) => void;
}

export type ActiveIPStore = ActiveIPStoreState & ActiveIPStoreActions;

export function activeIPStorageKey(scope: ActiveIPScope): string {
  const hubId = encodeURIComponent(scope.hubId);
  const userId = encodeURIComponent(scope.userId);
  return `variscout:activeIP:${hubId}:${userId}`;
}

export function getActiveIPInitialState(): ActiveIPStoreState {
  return { activeIPs: {} };
}

function getLocalStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorageItem(key: string): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: ActiveIPState): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // In-memory state still represents the user's current scope for this tab.
  }
}

function removeStorageItem(key: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Best effort only; clearing in-memory state must still succeed.
  }
}

function isActiveIPState(value: unknown): value is ActiveIPState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ActiveIPState>;
  return typeof candidate.ipId === 'string' && typeof candidate.setAt === 'number';
}

export const useActiveIPStore = create<ActiveIPStore>()((set, get) => ({
  ...getActiveIPInitialState(),

  getActiveIP: scope => get().activeIPs[activeIPStorageKey(scope)] ?? null,

  setActiveIP: (scope, ipId, setAt = Date.now()) => {
    const key = activeIPStorageKey(scope);
    const value: ActiveIPState = { ipId, setAt };
    writeStorageItem(key, value);
    set(state => ({ activeIPs: { ...state.activeIPs, [key]: value } }));
  },

  clearActiveIP: scope => {
    const key = activeIPStorageKey(scope);
    removeStorageItem(key);
    set(state => {
      const { [key]: _removed, ...activeIPs } = state.activeIPs;
      return { activeIPs };
    });
  },

  rehydrateActiveIP: scope => {
    const key = activeIPStorageKey(scope);
    const raw = readStorageItem(key);
    if (raw === null) {
      set(state => {
        const { [key]: _removed, ...activeIPs } = state.activeIPs;
        return { activeIPs };
      });
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isActiveIPState(parsed)) {
        removeStorageItem(key);
        set(state => {
          const { [key]: _removed, ...activeIPs } = state.activeIPs;
          return { activeIPs };
        });
        return;
      }
      set(state => ({ activeIPs: { ...state.activeIPs, [key]: parsed } }));
    } catch {
      removeStorageItem(key);
      set(state => {
        const { [key]: _removed, ...activeIPs } = state.activeIPs;
        return { activeIPs };
      });
    }
  },
}));
