/**
 * MobileCardList — Vertical stack of hub cards for narrow viewports.
 *
 * Replaces the 2000×1400 SVG WallCanvas below 768px, where the full canvas
 * is unreadable. Each hub renders as a structured Mechanism Branch card with
 * suspected mechanism, clue/check counts, readiness, next move, and a subtle
 * status-colored left border.
 */

import React from 'react';
import {
  projectMechanismBranch,
  type MessageCatalog,
  type ProcessMap,
  type Hypothesis,
  type HypothesisStatus,
  type Finding,
} from '@variscout/core';
import { deriveHypothesisStatus } from '@variscout/core/survey';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '@variscout/charts';
import { EmptyState } from './EmptyState';
import { useWallLocale } from './hooks/useWallLocale';

export interface MobileCardListProps {
  hubs: Hypothesis[];
  findings: Finding[];
  processMap?: ProcessMap;
  onSelectHub?: (hubId: string) => void;
  onWriteHypothesis?: () => void;
  onSeedFromFactorIntel?: () => void;
}

const STATUS_KEY: Record<HypothesisStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  'evidence-survived-test': 'wall.status.confirmed', // catalog key unchanged — value already 'Supported'
  refuted: 'wall.status.refuted',
  'needs-disconfirmation': 'wall.status.needsDisconfirmation',
};

/**
 * Status-specific left-border colors. Matches the stroke palette used by
 * `HypothesisCard` so the card list reads as a compact version of the SVG
 * rendering. Sourced from `chartColors` — no hardcoded hex.
 */
const STATUS_ACCENT: Record<HypothesisStatus, string> = {
  proposed: chartColors.mean,
  evidenced: chartColors.control,
  'evidence-survived-test': chartColors.pass,
  refuted: chartColors.fail,
  'needs-disconfirmation': chartColors.warning,
};

export const MobileCardList: React.FC<MobileCardListProps> = ({
  hubs,
  findings,
  processMap,
  onSelectHub,
  onWriteHypothesis,
  onSeedFromFactorIntel,
}) => {
  const locale = useWallLocale();

  if (hubs.length === 0) {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }

  const branchLabel = getMessage(locale, 'wall.card.hypothesisLabel');

  return (
    <ul
      data-testid="wall-mobile-card-list"
      className="flex flex-col gap-2 p-3 w-full"
      aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
    >
      {hubs.map(hub => {
        const status = deriveHypothesisStatus(hub, findings);
        const branch = projectMechanismBranch(hub, {
          findings,
          processContext: processMap ? { processMap } : undefined,
        });
        const statusLabel = getMessage(locale, STATUS_KEY[status]);
        const findingsLabel = formatMessage(locale, 'wall.card.findings', {
          count: hub.findingIds.length,
        });
        const ariaLabel = formatMessage(locale, 'wall.card.ariaLabel', {
          name: branch.suspectedMechanism,
          status: statusLabel,
          count: branch.supportingClues.length,
        });
        const supportingLabel = `${branch.supportingClues.length} supporting clue${branch.supportingClues.length === 1 ? '' : 's'}`;
        const counterLabel = `${branch.counterClues.length} counter-clue${branch.counterClues.length === 1 ? '' : 's'}`;
        // "Open checks" derive from not-yet-tested clues (Question retired — IM-1).
        const openChecksLabel = `${branch.notTestedClues.length} open check${branch.notTestedClues.length === 1 ? '' : 's'}`;
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
              {branchLabel} · {statusLabel}
            </div>
            <div className="text-sm font-semibold text-content mt-0.5">
              {branch.suspectedMechanism}
            </div>
            <div className="text-[11px] text-content-muted mt-1">
              Suspected mechanism · {branch.readiness.label}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs text-content-secondary">
              <span>{supportingLabel}</span>
              <span>{counterLabel}</span>
              <span>{openChecksLabel}</span>
            </div>
            {branch.nextMove && (
              <div className="text-xs text-content-secondary mt-2">Next: {branch.nextMove}</div>
            )}
            <div className="text-xs font-mono text-content-muted mt-1 flex gap-3">
              <span data-testid={`wall-mobile-hub-${hub.id}-findings`}>{findingsLabel}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
