import { useCallback, useMemo } from 'react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { type ActiveIPScope, type ActiveIPState } from '@variscout/stores';

/** Default per-user scope key for active-IP state when the caller supplies no
 *  identity (PWA free tier has no auth). Exported so writers outside the hook
 *  (e.g. the PWA landing router) activate under the SAME key the hook reads. */
export const DEFAULT_ACTIVE_IP_USER_ID = 'local';

export interface ActiveIPContext {
  scope: ActiveIPScope | null;
  activeState: ActiveIPState | null;
  activeIP: ImprovementProject | null;
  isIPScoped: boolean;
  setActiveIP: (ipId: ImprovementProject['id'], setAt?: number) => void;
  clearActiveIP: () => void;
}

export interface UseActiveIPContextOptions {
  userId?: string | null;
}

function liveProjects(hub: ProcessHub | undefined | null): ImprovementProject[] {
  const p = hub?.improvementProject;
  return p && p.deletedAt === null ? [p] : [];
}

export function useActiveIPContext(
  hub: ProcessHub | undefined | null,
  options: UseActiveIPContextOptions = {}
): ActiveIPContext {
  const resolvedUserId = options.userId ?? DEFAULT_ACTIVE_IP_USER_ID;
  const hubId = hub?.id ?? null;
  const scope = useMemo<ActiveIPScope | null>(
    () => (hubId ? { hubId, userId: resolvedUserId } : null),
    [hubId, resolvedUserId]
  );
  const projects = useMemo(() => liveProjects(hub), [hub]);
  const activeIP = projects[0] ?? null;
  const activeState: ActiveIPState | null = activeIP
    ? { ipId: activeIP.id, setAt: activeIP.createdAt }
    : null;

  const setActiveIP = useCallback((_ipId: ImprovementProject['id'], _setAt?: number) => {
    // Compatibility no-op: a Workspace's attached Project is always the context.
  }, []);

  const clearActiveIP = useCallback(() => {
    // Compatibility no-op: V1 no longer supports exiting the Workspace Project lens.
  }, []);

  return {
    scope,
    activeState,
    activeIP,
    isIPScoped: Boolean(activeIP),
    setActiveIP,
    clearActiveIP,
  };
}
