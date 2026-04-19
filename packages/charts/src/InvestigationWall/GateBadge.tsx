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
import { chartColors } from '../colors';

export interface GateBadgeProps {
  kind: 'and' | 'or' | 'not';
  gatePath: string;
  holds?: number;
  total?: number;
  x: number;
  y: number;
  onRun?: (gatePath: string) => void;
  onContextMenu?: (gatePath: string, event: React.MouseEvent) => void;
}

const GATE_R = 22;

export const GateBadge: React.FC<GateBadgeProps> = ({
  kind,
  gatePath,
  holds,
  total,
  x,
  y,
  onRun,
  onContextMenu,
}) => {
  const label = kind.toUpperCase();
  const glyph = kind === 'not' ? '⊘' : '◇';
  const holdsText =
    holds === undefined || total === undefined
      ? ''
      : total === 0
        ? '—/0'
        : `HOLDS ${holds}/${total}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Gate ${label} ${holdsText}`}
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
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        fontSize={24}
        fill={chartColors.warning}
        className="pointer-events-none"
      >
        {glyph}
      </text>
      <text
        x={0}
        y={5}
        textAnchor="middle"
        className="fill-content font-mono text-[10px] font-bold pointer-events-none"
      >
        {label}
      </text>
      {holdsText && (
        <text x={GATE_R + 8} y={5} className="fill-content-muted text-xs font-mono">
          {holdsText}
        </text>
      )}
    </g>
  );
};
