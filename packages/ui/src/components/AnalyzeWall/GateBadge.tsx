/**
 * GateBadge — SVG primitive for a logic gate (AND/OR/NOT) on the Investigation Wall.
 *
 * Renders a glyph, the gate label, and an optional HOLDS X/Y badge indicating
 * how many observations satisfy the gate condition. Positioned by (x, y).
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 * Context menu: right-click calls onContextMenu with preventDefault applied first.
 */

import React from 'react';
import type { MessageCatalog } from '@variscout/core';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '@variscout/charts';
import { useWallLocale } from './hooks/useWallLocale';

export interface GateBadgeProps {
  kind: 'and' | 'or' | 'not';
  gatePath: string;
  holds?: number;
  total?: number;
  expression?: string;
  x: number;
  y: number;
  onRun?: (gatePath: string) => void;
  onContextMenu?: (gatePath: string, event: React.MouseEvent) => void;
}

const BADGE_H = 42;
const MIN_BADGE_W = 128;
const CHAR_W = 7.5;

const KIND_KEY: Record<GateBadgeProps['kind'], keyof MessageCatalog> = {
  and: 'wall.gate.and',
  or: 'wall.gate.or',
  not: 'wall.gate.not',
};

export const GateBadge: React.FC<GateBadgeProps> = ({
  kind,
  gatePath,
  holds,
  total,
  expression,
  x,
  y,
  onRun,
  onContextMenu,
}) => {
  const locale = useWallLocale();
  const label = getMessage(locale, KIND_KEY[kind]);
  const holdsText =
    holds === undefined || total === undefined
      ? ''
      : total === 0
        ? getMessage(locale, 'wall.gate.noTotals')
        : formatMessage(locale, 'wall.gate.holds', { matching: holds, total });
  const primaryText = holdsText || label;
  const expressionText = expression?.trim();
  const badgeWidth = Math.max(
    MIN_BADGE_W,
    40 + primaryText.length * CHAR_W + (expressionText ? 22 + expressionText.length * CHAR_W : 0)
  );
  const ariaLabel = formatMessage(locale, 'wall.gate.ariaLabel', {
    kind: label,
    holds: holdsText,
  });

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      transform={`translate(${x}, ${y})`}
      onClick={() => onRun?.(gatePath)}
      onContextMenu={e => {
        e.preventDefault();
        onContextMenu?.(gatePath, e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRun?.(gatePath);
        }
      }}
      className="cursor-pointer"
      data-wall-gate-badge={gatePath}
      data-wall-gate-readable="true"
    >
      <rect
        data-wall-gate-bg
        x={-badgeWidth / 2}
        y={-BADGE_H / 2}
        width={badgeWidth}
        height={BADGE_H}
        rx={8}
        fill="#fffbeb"
        stroke={chartColors.warning}
        strokeWidth={1.5}
        className="pointer-events-none"
      />
      <text
        x={-badgeWidth / 2 + 14}
        y={5}
        fontSize={14}
        fontWeight={700}
        fill={chartColors.warning}
        className="pointer-events-none"
      >
        {primaryText}
      </text>
      {expressionText ? (
        <>
          <text
            x={-badgeWidth / 2 + 14 + primaryText.length * CHAR_W + 8}
            y={5}
            fontSize={13}
            fill="#64748b"
            className="pointer-events-none"
          >
            ·
          </text>
          <text
            x={-badgeWidth / 2 + 14 + primaryText.length * CHAR_W + 20}
            y={5}
            fontSize={13}
            fontWeight={600}
            fill="#0f172a"
            className="pointer-events-none"
          >
            {expressionText}
          </text>
        </>
      ) : null}
      {holdsText ? (
        <text
          x={badgeWidth / 2 - 12}
          y={-BADGE_H / 2 + 11}
          textAnchor="middle"
          fontSize={8}
          fontWeight={700}
          fill="#64748b"
          data-wall-gate-kind={kind}
          className="pointer-events-none"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};
