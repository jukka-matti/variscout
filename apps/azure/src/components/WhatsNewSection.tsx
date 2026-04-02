import React, { useMemo } from 'react';
import type { Finding, Question } from '@variscout/core';
import { FINDING_STATUS_LABELS } from '@variscout/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WhatsNewSectionProps {
  findings: Finding[];
  questions: Question[];
  /** Epoch ms — show items newer than this timestamp */
  lastViewedAt: number;
}

interface WhatsNewItem {
  type: 'finding-new' | 'finding-status' | 'question-status' | 'action-completed' | 'comment-new';
  text: string;
  timestamp: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_ITEMS = 10;

/**
 * Format a timestamp as a short, human-readable date string.
 * e.g. "Mar 19" or "Mar 19, 2025" when year differs from current year.
 */
function formatShortDate(epochMs: number): string {
  const date = new Date(epochMs);
  const now = new Date();
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

/**
 * Truncate a text string to a maximum length with an ellipsis.
 */
function truncate(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '\u2026';
}

// ── Component ─────────────────────────────────────────────────────────────────

const WhatsNewSection: React.FC<WhatsNewSectionProps> = ({ findings, questions, lastViewedAt }) => {
  const items = useMemo<WhatsNewItem[]>(() => {
    const result: WhatsNewItem[] = [];

    for (const finding of findings) {
      // New findings
      if (finding.createdAt > lastViewedAt) {
        result.push({
          type: 'finding-new',
          text: `New finding: \u2018${truncate(finding.text)}\u2019`,
          timestamp: finding.createdAt,
        });
      }

      // Finding status changes (only if status changed after creation)
      if (finding.statusChangedAt > lastViewedAt && finding.statusChangedAt !== finding.createdAt) {
        const statusLabel = FINDING_STATUS_LABELS[finding.status] ?? finding.status;
        result.push({
          type: 'finding-status',
          text: `Finding \u2018${truncate(finding.text)}\u2019 \u2192 ${statusLabel}`,
          timestamp: finding.statusChangedAt,
        });
      }

      // Completed actions
      if (finding.actions) {
        for (const action of finding.actions) {
          if (action.completedAt && action.completedAt > lastViewedAt) {
            result.push({
              type: 'action-completed',
              text: `Action completed: \u2018${truncate(action.text)}\u2019`,
              timestamp: action.completedAt,
            });
          }
        }
      }

      // New comments
      for (const comment of finding.comments) {
        if (comment.createdAt > lastViewedAt) {
          result.push({
            type: 'comment-new',
            text: `New comment on \u2018${truncate(finding.text)}\u2019`,
            timestamp: comment.createdAt,
          });
        }
      }
    }

    // Question status changes
    // NOTE: Question.createdAt and updatedAt are ISO strings — use Date.parse()
    for (const h of questions) {
      const updatedAtMs = Date.parse(h.updatedAt);
      if (updatedAtMs > lastViewedAt) {
        result.push({
          type: 'question-status',
          text: `\u2018${truncate(h.text)}\u2019 question \u2192 ${h.status}`,
          timestamp: updatedAtMs,
        });
      }
    }

    // Sort newest first, cap at MAX_ITEMS
    result.sort((a, b) => b.timestamp - a.timestamp);
    return result.slice(0, MAX_ITEMS);
  }, [findings, questions, lastViewedAt]);

  const sinceLabel = formatShortDate(lastViewedAt);

  return (
    <div
      className="rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700 p-3 space-y-2"
      data-testid="whats-new-section"
    >
      {/* Header */}
      <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
        What&apos;s new since {sinceLabel}
      </p>

      {/* Items list or empty state */}
      {items.length === 0 ? (
        <p
          className="text-xs text-indigo-600/70 dark:text-indigo-400/70"
          data-testid="whats-new-empty"
        >
          Nothing new since your last visit. All caught up. \u2713
        </p>
      ) : (
        <ul className="space-y-1" data-testid="whats-new-list">
          {items.map((item, index) => (
            <li
              key={`${item.type}-${item.timestamp}-${index}`}
              className="flex items-start gap-2 text-xs text-indigo-800 dark:text-indigo-200"
              data-testid={`whats-new-item-${item.type}`}
            >
              <span className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400">\u2022</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WhatsNewSection;
