/**
 * Graph Channel Message — post @mention messages to a Teams channel.
 *
 * POST /teams/{teamId}/channels/{channelId}/messages
 * Requires ChannelMessage.Send delegated permission (Team plan only).
 */

import type { Finding, FindingAssignee } from '@variscout/core';
import { formatFindingFilters } from '@variscout/core';
import { getGraphTokenWithScopes } from '../auth/graphToken';
import { buildFindingLink } from './deepLinks';

const CHANNEL_MESSAGE_SCOPES = ['https://graph.microsoft.com/ChannelMessage.Send'];

/**
 * Build the HTML body for a channel @mention message.
 * Includes finding text, stats context, and a deep link.
 */
export function buildMentionMessageBody(
  finding: Finding,
  assignee: FindingAssignee,
  deepLinkUrl: string
): { body: string; mentions: MentionEntity[] } {
  const parts: string[] = [];

  // @mention the assignee
  parts.push(`<at id="0">${escapeHtml(assignee.displayName)}</at>`);

  // Finding text
  if (finding.text) {
    parts.push(escapeHtml(finding.text) + '.');
  }

  // Stats context
  const statsContext: string[] = [];
  if (finding.context.stats?.cpk !== undefined) {
    statsContext.push(`Cpk ${finding.context.stats.cpk.toFixed(1)}`);
  }
  if (finding.context.stats?.samples !== undefined) {
    statsContext.push(`n=${finding.context.stats.samples}`);
  }
  const filterStr = formatFindingFilters(finding.context);
  if (filterStr) {
    statsContext.push(filterStr);
  }
  if (statsContext.length > 0) {
    parts.push(statsContext.join(' \u2014 '));
  }

  // Deep link
  parts.push(`<a href="${escapeHtml(deepLinkUrl)}">Open in VariScout</a>`);

  const mentions: MentionEntity[] = [
    {
      id: 0,
      mentionText: assignee.displayName,
      mentioned: {
        user: {
          id: assignee.userId ?? '',
          displayName: assignee.displayName,
          userIdentityType: 'aadUser',
        },
      },
    },
  ];

  return { body: parts.join(' '), mentions };
}

interface MentionEntity {
  id: number;
  mentionText: string;
  mentioned: {
    user: {
      id: string;
      displayName: string;
      userIdentityType: string;
    };
  };
}

export interface CardMentionEntity {
  type: 'mention';
  text: string;
  mentioned: {
    id: string;
    name: string;
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Post an @mention message to a Teams channel.
 *
 * @param teamId - Teams team internal ID (from getTeamsContext())
 * @param channelId - Teams channel ID (from getTeamsContext())
 * @param finding - The finding to share
 * @param assignee - The person to @mention
 * @param baseUrl - App base URL for building deep links
 * @param projectName - Current project name for deep link
 */
export async function postChannelMention(
  teamId: string,
  channelId: string,
  finding: Finding,
  assignee: FindingAssignee,
  baseUrl: string,
  projectName: string
): Promise<void> {
  const token = await getGraphTokenWithScopes(CHANNEL_MESSAGE_SCOPES);
  const deepLinkUrl = buildFindingLink(baseUrl, projectName, finding.id);
  const { body, mentions } = buildMentionMessageBody(finding, assignee, deepLinkUrl);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content: body,
        },
        mentions,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Channel message failed: ${res.status} ${errorBody}`);
  }
}

/**
 * Post an Adaptive Card status update to a Teams channel.
 *
 * Used when findings reach 'analyzed' or 'resolved' status.
 * Reuses the same Graph endpoint and permission scope as postChannelMention.
 */
export async function postStatusUpdateCard(
  teamId: string,
  channelId: string,
  cardPayload: Record<string, unknown>,
  mentions: CardMentionEntity[],
  summaryText: string
): Promise<void> {
  const token = await getGraphTokenWithScopes(CHANNEL_MESSAGE_SCOPES);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content: summaryText,
        },
        attachments: [
          {
            id: 'statusCard',
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: JSON.stringify(cardPayload),
          },
        ],
        mentions: mentions.map((m, i) => ({
          id: i,
          mentionText: m.mentioned.name,
          mentioned: {
            user: {
              id: m.mentioned.id,
              displayName: m.mentioned.name,
              userIdentityType: 'aadUser',
            },
          },
        })),
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Status update card failed: ${res.status} ${errorBody}`);
  }
}
