/**
 * QuestionPill — SVG pill primitive for an investigation question on the Wall.
 *
 * Displays a '?' glyph, the question text (struck through when ruled-out),
 * and a dashed border for open questions. Positioned by its center-top point (x, y).
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 * Context menu: right-click calls onPromote with preventDefault applied first.
 */

import React from 'react';
import type { QuestionStatus } from '@variscout/core';

export interface QuestionPillProps {
  questionId: string;
  text: string;
  status: QuestionStatus;
  x: number;
  y: number;
  onSelect?: (id: string) => void;
  onPromote?: (id: string) => void;
}

const PILL_W = 220;
const PILL_H = 28;

export const QuestionPill: React.FC<QuestionPillProps> = ({
  questionId,
  text,
  status,
  x,
  y,
  onSelect,
  onPromote,
}) => {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Question: ${text}, ${status}`}
      transform={`translate(${x - PILL_W / 2}, ${y})`}
      onClick={() => onSelect?.(questionId)}
      onContextMenu={e => {
        e.preventDefault();
        onPromote?.(questionId);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(questionId);
        }
      }}
      data-status={status}
      className="cursor-pointer"
    >
      <rect
        width={PILL_W}
        height={PILL_H}
        rx={PILL_H / 2}
        className="fill-surface stroke-edge"
        strokeDasharray={status === 'open' ? '4 2' : '0'}
      />
      <text x={14} y={PILL_H / 2 + 4} className="fill-content-muted text-xs font-mono">
        ?
      </text>
      <text x={28} y={PILL_H / 2 + 4} className="fill-content text-xs">
        {status === 'ruled-out' ? <tspan textDecoration="line-through">{text}</tspan> : text}
      </text>
    </g>
  );
};
