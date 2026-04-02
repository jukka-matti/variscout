/**
 * useShareFinding — share a finding via clipboard deep link.
 *
 * Teams channel @mentions removed per ADR-059. Always copies deep link to clipboard.
 */

import { useCallback } from 'react';
import type { Finding, FindingAssignee } from '@variscout/core';
import { buildFindingSharePayload } from '../services/shareContent';
import { useTeamsShare } from './useTeamsShare';
import type { SyncNotification } from '../services/storage';

interface UseShareFindingOptions {
  projectName: string;
  baseUrl: string;
  onToast?: (notif: Omit<SyncNotification, 'id'>) => void;
}

export function useShareFinding({ projectName, baseUrl, onToast }: UseShareFindingOptions) {
  const { share } = useTeamsShare();

  /**
   * Share a finding by copying a deep link to clipboard.
   * Returns true if the share succeeded.
   */
  const shareFinding = useCallback(
    async (finding: Finding, _assignee?: FindingAssignee): Promise<boolean> => {
      const payload = buildFindingSharePayload(finding, projectName, baseUrl);
      const result = await share(payload);
      if (result) {
        onToast?.({ type: 'info', message: 'Link copied to clipboard', dismissAfter: 3000 });
      } else {
        onToast?.({ type: 'error', message: "Couldn't share finding. Try again." });
      }
      return result;
    },
    [baseUrl, projectName, share, onToast]
  );

  return { shareFinding, canMentionInChannel: false };
}
