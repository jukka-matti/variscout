/**
 * Hook for sharing content via clipboard copy.
 *
 * Teams SDK removed per ADR-059. Always uses clipboard fallback.
 */

import { useCallback, useMemo, useRef } from 'react';
import type { SharePayload } from '../services/shareContent';
import type { SyncNotification } from '../services/storage';
import { buildQuestionLink, buildImprovementLink, buildOverviewLink } from '../services/deepLinks';

interface UseTeamsShareOptions {
  onToast?: (notif: Omit<SyncNotification, 'id'>) => void;
}

export function useTeamsShare(options?: UseTeamsShareOptions) {
  // Use ref to avoid recreating share callback when options object changes
  const onToastRef = useRef(options?.onToast);
  // eslint-disable-next-line react-hooks/refs -- intentional: sync ref to avoid stale closure
  onToastRef.current = options?.onToast;

  /**
   * Share a payload by copying the URL to clipboard.
   * Returns true if the copy succeeded.
   */
  const share = useCallback(async (payload: SharePayload): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(payload.url);
      onToastRef.current?.({
        type: 'info',
        message: 'Link copied to clipboard',
        dismissAfter: 3000,
      });
      return true;
    } catch {
      onToastRef.current?.({ type: 'error', message: "Couldn't share. Try again." });
      return false;
    }
  }, []);

  /** No-op — Teams deep link registration removed per ADR-059. */
  const setDeepLink = useCallback(
    (_subPageIdOrProject: string, _label: string, _target?: Record<string, string>) => {
      // No-op: Teams deep links removed
    },
    []
  );

  // Pre-bound link builders for convenience
  const baseUrl = useMemo(() => window.location.origin + window.location.pathname, []);

  const linkBuilders = useMemo(
    () => ({
      /** Build a URL linking to a specific question in the investigation view */
      buildQuestionLink: (projectId: string, questionId: string) =>
        buildQuestionLink(baseUrl, projectId, questionId),
      /** Build a URL linking directly to the improvement workspace */
      buildImprovementLink: (projectId: string) => buildImprovementLink(baseUrl, projectId),
      /** Build a URL linking to the project overview tab */
      buildOverviewLink: (projectId: string) => buildOverviewLink(baseUrl, projectId),
    }),
    [baseUrl]
  );

  return { share, setDeepLink, isTeams: false, ...linkBuilders };
}
