/**
 * ProblemConditionCard — Red-bordered card at the top of the Investigation Wall
 *
 * Displays the CTS (Critical-to-Satisfaction) column, Cpk index, and event
 * rate for the primary problem condition. Positioned by its center-top point.
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 */

import React from 'react';
import { formatStatistic, formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '../colors';
import { useWallLocale } from './hooks/useWallLocale';

export interface ProblemConditionCardProps {
  ctsColumn: string;
  cpk: number;
  eventsPerWeek: number;
  x: number;
  y: number;
}

const CARD_W = 320;
const CARD_H = 80;

export const ProblemConditionCard: React.FC<ProblemConditionCardProps> = ({
  ctsColumn,
  cpk,
  eventsPerWeek,
  x,
  y,
}) => {
  const locale = useWallLocale();
  const cpkFormatted = formatStatistic(cpk, locale, 2);
  const label = formatMessage(locale, 'wall.problem.ariaLabel', {
    column: ctsColumn,
    cpk: cpkFormatted,
    count: eventsPerWeek,
  });
  const eventsLabel = formatMessage(locale, 'wall.problem.eventsPerWeek', {
    count: eventsPerWeek,
  });

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CARD_W / 2}, ${y})`}
    >
      <rect
        width={CARD_W}
        height={CARD_H}
        rx={8}
        className="fill-surface-secondary"
        stroke={chartColors.fail}
        strokeWidth={2}
      />
      <text
        x={CARD_W / 2}
        y={28}
        textAnchor="middle"
        className="fill-content font-semibold text-sm"
      >
        {getMessage(locale, 'wall.problem.title')}
      </text>
      <text x={CARD_W / 2} y={50} textAnchor="middle" className="fill-content-muted text-xs">
        {ctsColumn} · Cpk {cpkFormatted}
      </text>
      <text
        x={CARD_W / 2}
        y={70}
        textAnchor="middle"
        className="fill-content-subtle text-[10px] font-mono"
      >
        {eventsLabel}
      </text>
    </g>
  );
};
