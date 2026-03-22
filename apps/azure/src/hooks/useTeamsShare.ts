/**
 * Hook for sharing content via Teams native share dialog or clipboard fallback.
 *
 * In Teams: uses sharing.shareWebContent() for rich link cards.
 * Outside Teams: copies the deep link URL to clipboard.
 */

import { useCallback } from 'react';
import { sharing, pages } from '@microsoft/teams-js';
import { isInTeams } from '../teams';
import type { SharePayload } from '../services/shareContent';
import type { SyncNotification } from '../services/storage';

interface UseTeamsShareOptions {
  onToast?: (notif: Omit<SyncNotification, 'id'>) => void;
}

export function useTeamsShare(options?: UseTeamsShareOptions) {
  /**
   * Share a payload via Teams share dialog, or copy URL to clipboard as fallback.
   * Returns true if the share/copy succeeded.
   */
  const share = useCallback(
    async (payload: SharePayload): Promise<boolean> => {
      if (isInTeams()) {
        try {
          await sharing.shareWebContent({
            content: [
              {
                type: 'URL',
                url: payload.url,
                message: payload.previewText,
                preview: true,
              },
            ],
          });
          options?.onToast?.({ type: 'success', message: 'Shared in Teams', dismissAfter: 3000 });
          return true;
        } catch {
          // Teams share dialog failed or was dismissed — fall through to clipboard
        }
      }

      // Non-Teams or fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(payload.url);
        options?.onToast?.({
          type: 'info',
          message: 'Link copied to clipboard',
          dismissAfter: 3000,
        });
        return true;
      } catch {
        options?.onToast?.({ type: 'error', message: "Couldn't share. Try again." });
        return false;
      }
    },
    [options]
  );

  /**
   * Set the Teams deep link for the current view.
   * This allows Teams to resolve deep links natively when sharing the tab.
   */
  const setDeepLink = useCallback((subPageId: string, label: string) => {
    if (isInTeams()) {
      try {
        pages.shareDeepLink({ subPageId, subPageLabel: label });
      } catch {
        // Non-critical — deep link registration is best-effort
      }
    }
  }, []);

  return { share, setDeepLink, isTeams: isInTeams() };
}
