import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { useActiveIPStore, type ActiveIPScope, type ActiveIPState } from '@variscout/stores';

export interface ActiveIPContext {
  scope: ActiveIPScope | null;
  activeState: ActiveIPState | null;
  activeIP: ImprovementProject | null;
  isIPScoped: boolean;
  setActiveIP: (ipId: ImprovementProject['id'], setAt?: number) => void;
  clearActiveIP: () => void;
}

function liveProjects(hub: ProcessHub | undefined | null): ImprovementProject[] {
  const p = hub?.improvementProject;
  return p && p.deletedAt === null ? [p] : [];
}

function clearedScopeKey(scopeKey: string): string {
  return `variscout:activeIP:cleared:${scopeKey}`;
}

function wasUserCleared(scopeKey: string): boolean {
  try {
    return sessionStorage.getItem(clearedScopeKey(scopeKey)) === 'true';
  } catch {
    return false;
  }
}

function markUserCleared(scopeKey: string): void {
  try {
    sessionStorage.setItem(clearedScopeKey(scopeKey), 'true');
  } catch {
    // Ignore storage failures; clearing still works for the current hook instance.
  }
}

function clearUserCleared(scopeKey: string): void {
  try {
    sessionStorage.removeItem(clearedScopeKey(scopeKey));
  } catch {
    // Ignore storage failures.
  }
}

export function useActiveIPContext(
  hub: ProcessHub | undefined | null,
  userId: string | null | undefined
): ActiveIPContext {
  const resolvedUserId = userId ?? 'local';
  const hubId = hub?.id ?? null;
  const scope = useMemo<ActiveIPScope | null>(
    () => (hubId ? { hubId, userId: resolvedUserId } : null),
    [hubId, resolvedUserId]
  );
  const scopeKey = scope ? `${scope.hubId}:${scope.userId}` : null;
  const autoActivatedScopeRef = useRef<string | null>(null);
  const activeIPs = useActiveIPStore(state => state.activeIPs);
  const rehydrateActiveIP = useActiveIPStore(state => state.rehydrateActiveIP);
  const storeSetActiveIP = useActiveIPStore(state => state.setActiveIP);
  const storeClearActiveIP = useActiveIPStore(state => state.clearActiveIP);

  useEffect(() => {
    if (scope) rehydrateActiveIP(scope);
  }, [rehydrateActiveIP, scope, scopeKey]);

  const activeState = scope ? useActiveIPStore.getState().getActiveIP(scope) : null;
  const projects = useMemo(() => liveProjects(hub), [hub]);
  const activeIP = activeState
    ? (projects.find(project => project.id === activeState.ipId) ?? null)
    : null;

  useEffect(() => {
    if (scope && activeState && !activeIP) {
      storeClearActiveIP(scope);
    }
  }, [activeIP, activeState, scope, scopeKey, storeClearActiveIP]);

  useEffect(() => {
    if (!scope || !scopeKey || activeState || projects.length !== 1) return;
    if (wasUserCleared(scopeKey)) return;
    if (autoActivatedScopeRef.current === scopeKey) return;
    autoActivatedScopeRef.current = scopeKey;
    storeSetActiveIP(scope, projects[0].id);
  }, [activeState, projects, scope, scopeKey, storeSetActiveIP]);

  const setActiveIP = useCallback(
    (ipId: ImprovementProject['id'], setAt?: number) => {
      if (scope && scopeKey) {
        clearUserCleared(scopeKey);
        storeSetActiveIP(scope, ipId, setAt);
      }
    },
    [scope, scopeKey, storeSetActiveIP]
  );

  const clearActiveIP = useCallback(() => {
    if (scope && scopeKey) {
      markUserCleared(scopeKey);
      storeClearActiveIP(scope);
    }
  }, [scope, scopeKey, storeClearActiveIP]);

  void activeIPs;

  return {
    scope,
    activeState: activeIP ? activeState : null,
    activeIP,
    isIPScoped: Boolean(activeIP),
    setActiveIP,
    clearActiveIP,
  };
}
