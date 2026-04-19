/**
 * MobileCardList — Vertical stack of hub cards for narrow viewports.
 *
 * Replaces the 2000×1400 SVG WallCanvas below 768px, where the full canvas
 * is unreadable. Each hub renders as an HTML card with name, status label,
 * findings and questions counts, and a subtle status-colored left border.
 *
 * Status derivation mirrors `deriveDisplayStatus` in WallCanvas: confirmed
 * and not-confirmed map directly; otherwise "evidenced" when at least one
 * supporting finding exists without a contradictor, else "proposed".
 */

import React from 'react';
import type { MessageCatalog, SuspectedCause, Finding, Question } from '@variscout/core';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '../colors';
import { EmptyState } from './EmptyState';
import type { WallStatus } from './types';
import { getDocumentLocale } from './hooks/useWallLocale';

export interface MobileCardListProps {
  hubs: SuspectedCause[];
  findings: Finding[];
  /**
   * Question list. Currently only `hub.questionIds.length` (linked questions)
   * is shown — the full list is passed through for future mobile affordances
   * (e.g., expanding a hub to reveal its linked question text) without
   * another prop break.
   */
  questions: Question[];
  onSelectHub?: (hubId: string) => void;
  onWriteHypothesis?: () => void;
  onPromoteFromQuestion?: () => void;
  onSeedFromFactorIntel?: () => void;
}

const STATUS_KEY: Record<WallStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  confirmed: 'wall.status.confirmed',
  refuted: 'wall.status.refuted',
};

/**
 * Status-specific left-border colors. Matches the stroke palette used by
 * `HypothesisCard` so the card list reads as a compact version of the SVG
 * rendering. Sourced from `chartColors` — no hardcoded hex.
 */
const STATUS_ACCENT: Record<WallStatus, string> = {
  proposed: chartColors.mean,
  evidenced: chartColors.control,
  confirmed: chartColors.pass,
  refuted: chartColors.fail,
};

/**
 * Derive the displayed status. Kept local (instead of imported from
 * WallCanvas) to avoid introducing a shared-helpers file mid-phase — the
 * computation is tiny and the two call sites share nothing else.
 */
function deriveDisplayStatus(hub: SuspectedCause, findings: Finding[]): WallStatus {
  if (hub.status === 'confirmed') return 'confirmed';
  if (hub.status === 'not-confirmed') return 'refuted';
  const supporting = hub.findingIds
    .map(id => findings.find(f => f.id === id))
    .filter((f): f is Finding => !!f);
  const hasContradictor = supporting.some(f => f.validationStatus === 'contradicts');
  if (supporting.length >= 1 && !hasContradictor) return 'evidenced';
  return 'proposed';
}

export const MobileCardList: React.FC<MobileCardListProps> = ({
  hubs,
  findings,
  questions: _questions,
  onSelectHub,
  onWriteHypothesis,
  onPromoteFromQuestion,
  onSeedFromFactorIntel,
}) => {
  const locale = getDocumentLocale();

  if (hubs.length === 0) {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onPromoteFromQuestion={onPromoteFromQuestion}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }

  const hypothesisLabel = getMessage(locale, 'wall.card.hypothesisLabel');

  return (
    <ul
      data-testid="wall-mobile-card-list"
      className="flex flex-col gap-2 p-3 w-full"
      aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
    >
      {hubs.map(hub => {
        const status = deriveDisplayStatus(hub, findings);
        const statusLabel = getMessage(locale, STATUS_KEY[status]);
        const findingsLabel = formatMessage(locale, 'wall.card.findings', {
          count: hub.findingIds.length,
        });
        // Linked questions only — `questionIds` is the canonical link list,
        // matching the "question count" signal used by HypothesisCard copy.
        const linkedQuestionCount = hub.questionIds.length;
        const ariaLabel = formatMessage(locale, 'wall.card.ariaLabel', {
          name: hub.name,
          status: statusLabel,
          count: hub.findingIds.length,
        });
        return (
          <li
            key={hub.id}
            data-testid={`wall-mobile-hub-${hub.id}`}
            data-status={status}
            className="rounded bg-surface-secondary border border-edge px-3 py-2 cursor-pointer hover:bg-surface"
            style={{ borderLeft: `4px solid ${STATUS_ACCENT[status]}` }}
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            onClick={() => onSelectHub?.(hub.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectHub?.(hub.id);
              }
            }}
          >
            <div className="text-[10px] uppercase tracking-wide font-mono text-content-subtle">
              {hypothesisLabel} · {statusLabel}
            </div>
            <div className="text-sm font-semibold text-content mt-0.5">{hub.name}</div>
            <div className="text-xs font-mono text-content-muted mt-1 flex gap-3">
              <span data-testid={`wall-mobile-hub-${hub.id}-findings`}>{findingsLabel}</span>
              <span data-testid={`wall-mobile-hub-${hub.id}-questions`}>
                {linkedQuestionCount} Q
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
