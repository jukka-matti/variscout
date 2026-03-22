/**
 * useShareFinding — compose channel @mention with fallback chain.
 *
 * Fallback chain:
 * 1. isChannelTab() && hasTeamFeatures() → POST @mention to channel
 * 2. isInTeams() → shareWebContent() (Teams share dialog)
 * 3. Otherwise → copy deep link to clipboard
 */

import { useCallback, useMemo } from 'react';
import type { Finding, FindingAssignee } from '@variscout/core';
import { isChannelTab, getTeamsContext } from '../teams';
import { hasTeamFeatures } from '@variscout/core';
import { postChannelMention } from '../services/graphChannelMessage';
import { buildFindingSharePayload } from '../services/shareContent';
import { useTeamsShare } from './useTeamsShare';
import type { SyncNotification } from '../services/storage';

interface UseShareFindingOptions {
  projectName: string;
  baseUrl: string;
  onToast?: (notif: Omit<SyncNotification, 'id'>) => void;
}

export function useShareFinding({ projectName, baseUrl, onToast }: UseShareFindingOptions) {
  // Do NOT pass onToast here — useShareFinding handles its own toasts to avoid double-firing
  const { share } = useTeamsShare();

  const canMentionInChannel = useMemo(() => isChannelTab() && hasTeamFeatures(), []);

  /**
   * Share a finding, optionally @mentioning an assignee in the channel.
   * Returns true if the share succeeded.
   */
  const shareFinding = useCallback(
    async (finding: Finding, assignee?: FindingAssignee): Promise<boolean> => {
      // Fast path: channel @mention with assignee
      if (canMentionInChannel && assignee?.userId) {
        try {
          const ctx = getTeamsContext();
          if (ctx.teamId && ctx.channelId) {
            await postChannelMention(
              ctx.teamId,
              ctx.channelId,
              finding,
              assignee,
              baseUrl,
              projectName
            );
            onToast?.({
              type: 'success',
              message: 'Finding shared to channel',
              dismissAfter: 3000,
            });
            return true;
          }
        } catch (err) {
          console.warn('[ShareFinding] Channel mention failed, falling back:', err);
        }
      }

      // Fallback: Teams share dialog or clipboard
      const payload = buildFindingSharePayload(finding, projectName, baseUrl);
      const result = await share(payload);
      if (result) {
        onToast?.({ type: 'info', message: 'Link copied to clipboard', dismissAfter: 3000 });
      } else {
        onToast?.({ type: 'error', message: "Couldn't share finding. Try again." });
      }
      return result;
    },
    [canMentionInChannel, baseUrl, projectName, share, onToast]
  );

  return { shareFinding, canMentionInChannel };
}
