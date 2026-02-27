/**
 * React hook for Teams context.
 *
 * Initializes the Teams SDK on mount and provides the context to components.
 * Safe to use outside Teams — returns `isTeams: false` immediately.
 */

import { useState, useEffect } from 'react';
import { initTeams, getTeamsContext, type TeamsContext } from './teamsContext';

/**
 * Hook that initializes the Teams SDK and returns the context.
 *
 * - First render: returns `isTeams: false, loading: true`
 * - After init: returns the real context with `loading: false`
 * - Outside Teams: `isTeams: false, loading: false`
 */
export function useTeamsContext(): TeamsContext & { loading: boolean } {
  const [context, setContext] = useState<TeamsContext>(getTeamsContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    initTeams().then(ctx => {
      if (mounted) {
        setContext(ctx);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { ...context, loading };
}
