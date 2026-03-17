/**
 * useStatusUpdateCards — Posts Adaptive Cards to Teams channel when
 * a finding reaches 'analyzed' or 'resolved' status.
 *
 * Only active when running as a channel tab on Team plan.
 */

import { useCallback, useRef } from 'react';
import type { Finding, FindingStatus, Hypothesis } from '@variscout/core';
import { hasTeamFeatures } from '@variscout/core';
import { isChannelTab, getTeamsContext } from '../teams/teamsContext';
import { buildFindingLink } from '../services/deepLinks';
import { buildAnalyzedCard, buildResolvedCard } from '../services/adaptiveCards';
import { postStatusUpdateCard } from '../services/graphChannelMessage';

/** Target statuses that trigger card posting */
const CARD_STATUSES: Set<FindingStatus> = new Set(['analyzed', 'resolved']);

/** Debounce window: skip duplicate finding+status within 5 seconds */
const DEBOUNCE_MS = 5000;

export interface UseStatusUpdateCardsOptions {
  hypotheses?: Hypothesis[];
  addNotification?: (message: string, type: 'success' | 'error') => void;
  /** Base URL for deep links (defaults to window.location.origin) */
  baseUrl?: string;
  /** Current project name for deep link construction */
  projectName?: string;
}

export interface UseStatusUpdateCardsReturn {
  onStatusChanged: (finding: Finding, newStatus: FindingStatus) => void;
}

export function useStatusUpdateCards({
  hypotheses,
  addNotification,
  baseUrl,
  projectName,
}: UseStatusUpdateCardsOptions): UseStatusUpdateCardsReturn {
  const recentPosts = useRef<Map<string, number>>(new Map());

  const onStatusChanged = useCallback(
    (finding: Finding, newStatus: FindingStatus) => {
      // Guard: only channel tab + Team plan
      if (!isChannelTab() || !hasTeamFeatures()) return;

      // Only post for target statuses
      if (!CARD_STATUSES.has(newStatus)) return;

      // Debounce: skip if same finding+status posted recently
      const key = `${finding.id}:${newStatus}`;
      const now = Date.now();
      const lastPost = recentPosts.current.get(key);
      if (lastPost && now - lastPost < DEBOUNCE_MS) return;
      recentPosts.current.set(key, now);

      // Fire and forget — don't block the UI
      void postCard(finding, newStatus);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hypotheses, addNotification, baseUrl, projectName]
  );

  async function postCard(finding: Finding, status: FindingStatus) {
    try {
      const ctx = getTeamsContext();
      if (!ctx.teamId || !ctx.channelId) return;

      const resolvedBaseUrl = baseUrl ?? window.location.origin;
      const resolvedProject = projectName ?? 'default';
      const deepLinkUrl = buildFindingLink(resolvedBaseUrl, resolvedProject, finding.id);

      let cardResult;
      let summaryText: string;

      if (status === 'analyzed') {
        const hypothesis = finding.hypothesisId
          ? hypotheses?.find(h => h.id === finding.hypothesisId)
          : undefined;
        cardResult = buildAnalyzedCard(finding, hypothesis?.text, deepLinkUrl);
        summaryText = `Finding analyzed: ${finding.text || 'Untitled'}`;
      } else {
        cardResult = buildResolvedCard(finding, deepLinkUrl);
        summaryText = `Finding resolved: ${finding.text || 'Untitled'}`;
      }

      await postStatusUpdateCard(
        ctx.teamId,
        ctx.channelId,
        cardResult.card,
        cardResult.mentions,
        summaryText
      );

      addNotification?.(`Status update posted to channel`, 'success');
    } catch (err) {
      console.warn('[StatusUpdateCards] Failed to post card:', err);
      addNotification?.(`Failed to post status update to channel`, 'error');
    }
  }

  return { onStatusChanged };
}
