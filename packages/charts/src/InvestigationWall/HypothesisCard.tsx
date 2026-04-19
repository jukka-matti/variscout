/**
 * HypothesisCard — Status-bordered card for a SuspectedCause hub on the Investigation Wall.
 *
 * Displays the hypothesis name, Wall status label, findings count, and an optional
 * evidence-gap warning badge. Positioned by its center-top point (x, y).
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 * Keyboard: Enter / Space triggers onSelect.
 * Context menu: onContextMenu is called with preventDefault applied first.
 */

import React from 'react';
import type { MessageCatalog, SuspectedCause } from '@variscout/core';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '../colors';
import type { WallStatus } from './types';
import { getDocumentLocale } from './hooks/useWallLocale';

export interface HypothesisCardProps {
  hub: SuspectedCause;
  displayStatus: WallStatus;
  x: number;
  y: number;
  hasGap?: boolean;
  /**
   * When true, this hub's condition references a data column that no longer exists
   * (renamed, dropped, or the active dataset shifted). AND-check still correctly
   * returns false for such hubs — this badge surfaces the reason to the analyst.
   */
  missingColumn?: boolean;
  onSelect?: (hubId: string) => void;
  onContextMenu?: (hubId: string, event: React.MouseEvent) => void;
}

const CARD_W = 280;
const CARD_H = 180;

const STATUS_KEY: Record<WallStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  confirmed: 'wall.status.confirmed',
  refuted: 'wall.status.refuted',
};

/** Status-specific border colors sourced from chartColors — no hardcoded hex. */
const STATUS_STROKE: Record<WallStatus, string> = {
  proposed: chartColors.mean, // blue-500 — neutral/open
  evidenced: chartColors.control, // cyan-500 — data linked
  confirmed: chartColors.pass, // green-500 — outcome verified
  refuted: chartColors.fail, // red-500 — hypothesis rejected
};

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hub,
  displayStatus,
  x,
  y,
  hasGap,
  missingColumn,
  onSelect,
  onContextMenu,
}) => {
  const locale = getDocumentLocale();
  const statusLabel = getMessage(locale, STATUS_KEY[displayStatus]);
  const hypothesisLabel = getMessage(locale, 'wall.card.hypothesisLabel');
  const findingsLabel = formatMessage(locale, 'wall.card.findings', {
    count: hub.findingIds.length,
  });
  const label = formatMessage(locale, 'wall.card.ariaLabel', {
    name: hub.name,
    status: statusLabel,
    count: hub.findingIds.length,
  });
  const missingColumnText = getMessage(locale, 'wall.card.missingColumn');
  const missingColumnAria = getMessage(locale, 'wall.card.missingColumnAria');
  const evidenceGapAria = getMessage(locale, 'wall.card.evidenceGap');

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CARD_W / 2}, ${y})`}
      data-status={displayStatus}
      onClick={() => onSelect?.(hub.id)}
      onContextMenu={e => {
        e.preventDefault();
        onContextMenu?.(hub.id, e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(hub.id);
        }
      }}
      className="cursor-pointer"
    >
      <rect
        className="hub-card fill-surface-secondary"
        width={CARD_W}
        height={CARD_H}
        rx={12}
        stroke={STATUS_STROKE[displayStatus]}
        strokeWidth={2}
      />
      <text
        x={16}
        y={24}
        className="fill-content-subtle text-[10px] uppercase tracking-wide font-mono"
      >
        {hypothesisLabel} · {statusLabel}
      </text>
      <text x={16} y={48} className="fill-content font-semibold text-sm">
        {hub.name}
      </text>
      {/* Mini-chart slot — integration hook for later tasks */}
      <rect x={16} y={64} width={CARD_W - 32} height={72} rx={4} className="fill-surface" />
      <text x={16} y={CARD_H - 16} className="fill-content-muted text-xs font-mono">
        {findingsLabel}
      </text>
      {hasGap && (
        <g aria-label={evidenceGapAria}>
          <circle cx={CARD_W - 24} cy={24} r={10} fill={chartColors.warning} />
          <text
            x={CARD_W - 24}
            y={28}
            textAnchor="middle"
            className="fill-content text-xs font-bold pointer-events-none"
          >
            !
          </text>
        </g>
      )}
      {missingColumn && (
        <g aria-label={missingColumnAria}>
          <rect
            x={CARD_W - 196}
            y={CARD_H - 28}
            width={180}
            height={20}
            rx={4}
            fill={chartColors.warning}
            opacity={0.15}
            stroke={chartColors.warning}
            strokeWidth={1}
          />
          <text
            x={CARD_W - 188}
            y={CARD_H - 14}
            className="text-[10px] font-medium pointer-events-none"
            fill={chartColors.warning}
          >
            {missingColumnText}
          </text>
        </g>
      )}
    </g>
  );
};
