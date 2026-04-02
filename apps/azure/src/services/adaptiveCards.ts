/**
 * Adaptive Card builders for Teams channel status updates.
 *
 * Posts cards when findings reach 'analyzed' or 'resolved' status,
 * closing the investigation loop in the team channel.
 */

import type { Finding, FindingAssignee, Locale } from '@variscout/core';
import { FINDING_STATUS_LABELS, formatFindingFilters } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

function getDocLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale === 'de' || locale === 'es' || locale === 'fr' || locale === 'pt') return locale;
  return 'en';
}

function fmtStat(v: number, d: number = 2): string {
  return formatStatistic(v, getDocLocale(), d);
}

// ── Types ────────────────────────────────────────────────────────────────

export interface MentionEntity {
  type: 'mention';
  text: string;
  mentioned: {
    id: string;
    name: string;
  };
}

export interface AdaptiveCardResult {
  card: Record<string, unknown>;
  mentions: MentionEntity[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case 'analyzed':
      return 'accent';
    case 'resolved':
      return 'good';
    default:
      return 'default';
  }
}

// ── Analyzed Card ────────────────────────────────────────────────────────

/**
 * Build an Adaptive Card for a finding that reached 'analyzed' status.
 *
 * Shows: finding text, status, suspected cause (question), action items
 * with assignee @mentions, and a deep link button.
 */
export function buildAnalyzedCard(
  finding: Finding,
  questionText: string | undefined,
  deepLinkUrl: string,
  actionAssignees?: FindingAssignee[]
): AdaptiveCardResult {
  const mentions: MentionEntity[] = [];
  const body: Record<string, unknown>[] = [];

  // Header with status
  body.push({
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column',
        width: 'stretch',
        items: [
          {
            type: 'TextBlock',
            text: finding.text || 'Untitled finding',
            weight: 'bolder',
            size: 'medium',
            wrap: true,
          },
        ],
      },
      {
        type: 'Column',
        width: 'auto',
        items: [
          {
            type: 'TextBlock',
            text: FINDING_STATUS_LABELS.analyzed,
            color: statusColor('analyzed'),
            weight: 'bolder',
          },
        ],
      },
    ],
  });

  // Filter context
  const filterStr = formatFindingFilters(finding.context);
  if (filterStr) {
    body.push({
      type: 'TextBlock',
      text: filterStr,
      size: 'small',
      isSubtle: true,
      wrap: true,
    });
  }

  // Stats
  const statsItems: string[] = [];
  if (finding.context.stats?.cpk !== undefined) {
    statsItems.push(`Cpk ${fmtStat(finding.context.stats.cpk)}`);
  }
  if (finding.context.stats?.samples !== undefined) {
    statsItems.push(`n=${finding.context.stats.samples}`);
  }
  if (statsItems.length > 0) {
    body.push({
      type: 'TextBlock',
      text: statsItems.join(' · '),
      size: 'small',
      isSubtle: true,
    });
  }

  // Suspected cause (question)
  if (questionText) {
    body.push({
      type: 'TextBlock',
      text: `**Suspected cause:** ${questionText}`,
      wrap: true,
      spacing: 'medium',
    });
  }

  // Action items with @mentions
  if (finding.actions?.length) {
    body.push({
      type: 'TextBlock',
      text: '**Action items:**',
      spacing: 'medium',
    });

    for (const action of finding.actions) {
      let actionText = `- ${action.text}`;
      if (action.assignee) {
        const assignee = action.assignee;
        if (assignee.userId) {
          const mentionText = `<at>${assignee.displayName}</at>`;
          mentions.push({
            type: 'mention',
            text: mentionText,
            mentioned: {
              id: assignee.userId,
              name: assignee.displayName,
            },
          });
          actionText += ` → ${mentionText}`;
        } else {
          actionText += ` → ${assignee.displayName}`;
        }
      }
      if (action.dueDate) {
        actionText += ` (due ${action.dueDate})`;
      }
      body.push({
        type: 'TextBlock',
        text: actionText,
        wrap: true,
        size: 'small',
      });
    }
  }

  // Additional assignee mentions (e.g., from caller context)
  if (actionAssignees) {
    for (const assignee of actionAssignees) {
      if (assignee.userId && !mentions.some(m => m.mentioned.id === assignee.userId)) {
        mentions.push({
          type: 'mention',
          text: `<at>${assignee.displayName}</at>`,
          mentioned: {
            id: assignee.userId,
            name: assignee.displayName,
          },
        });
      }
    }
  }

  // Deep link button
  body.push({
    type: 'ActionSet',
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Open in VariScout',
        url: deepLinkUrl,
      },
    ],
    spacing: 'medium',
  });

  return {
    card: {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.4',
      body,
    },
    mentions,
  };
}

// ── Resolved Card ────────────────────────────────────────────────────────

/**
 * Build an Adaptive Card for a finding that reached 'resolved' status.
 *
 * Shows: finding text, status, outcome (effective/partial/not effective),
 * Cpk before→after with delta, notes, and a deep link button.
 */
export function buildResolvedCard(finding: Finding, deepLinkUrl: string): AdaptiveCardResult {
  const body: Record<string, unknown>[] = [];

  // Header with status
  body.push({
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column',
        width: 'stretch',
        items: [
          {
            type: 'TextBlock',
            text: finding.text || 'Untitled finding',
            weight: 'bolder',
            size: 'medium',
            wrap: true,
          },
        ],
      },
      {
        type: 'Column',
        width: 'auto',
        items: [
          {
            type: 'TextBlock',
            text: FINDING_STATUS_LABELS.resolved,
            color: statusColor('resolved'),
            weight: 'bolder',
          },
        ],
      },
    ],
  });

  // Outcome
  if (finding.outcome) {
    const effectiveLabels = {
      yes: '✅ Effective',
      no: '❌ Not Effective',
      partial: '⚠️ Partially Effective',
    };
    body.push({
      type: 'TextBlock',
      text: `**Outcome:** ${effectiveLabels[finding.outcome.effective]}`,
      wrap: true,
      spacing: 'medium',
    });

    // Cpk before → after
    const cpkBefore = finding.context.stats?.cpk;
    const cpkAfter = finding.outcome.cpkAfter;
    if (cpkBefore !== undefined && cpkAfter !== undefined) {
      const delta = cpkAfter - cpkBefore;
      const deltaStr = delta >= 0 ? `+${fmtStat(delta)}` : fmtStat(delta);
      body.push({
        type: 'TextBlock',
        text: `**Cpk:** ${fmtStat(cpkBefore)} → ${fmtStat(cpkAfter)} (${deltaStr})`,
        size: 'small',
      });
    }

    // Notes
    if (finding.outcome.notes) {
      body.push({
        type: 'TextBlock',
        text: finding.outcome.notes,
        wrap: true,
        size: 'small',
        isSubtle: true,
      });
    }
  }

  // Deep link button
  body.push({
    type: 'ActionSet',
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Open in VariScout',
        url: deepLinkUrl,
      },
    ],
    spacing: 'medium',
  });

  return {
    card: {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.4',
      body,
    },
    mentions: [],
  };
}
