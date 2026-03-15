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

interface UseShareFindingOptions {
  projectName: string;
  baseUrl: string;
}

export function useShareFinding({ projectName, baseUrl }: UseShareFindingOptions) {
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
            return true;
          }
        } catch (err) {
          console.warn('[ShareFinding] Channel mention failed, falling back:', err);
        }
      }

      // Fallback: Teams share dialog or clipboard
      const payload = buildFindingSharePayload(finding, projectName, baseUrl);
      return share(payload);
    },
    [canMentionInChannel, baseUrl, projectName, share]
  );

  return { shareFinding, canMentionInChannel };
}
