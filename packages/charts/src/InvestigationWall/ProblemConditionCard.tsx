/**
 * ProblemConditionCard — Red-bordered card at the top of the Investigation Wall
 *
 * Displays the CTS (Critical-to-Satisfaction) column, Cpk index, and event
 * rate for the primary problem condition. Positioned by its center-top point.
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 */

import React from 'react';
import type { Locale } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { chartColors } from '../colors';

export interface ProblemConditionCardProps {
  ctsColumn: string;
  cpk: number;
  eventsPerWeek: number;
  x: number;
  y: number;
}

const CARD_W = 320;
const CARD_H = 80;

/** Read locale from document attribute (matches accessibility.ts pattern) */
function getDocumentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale === 'de' || locale === 'es' || locale === 'fr' || locale === 'pt') {
    return locale;
  }
  return 'en';
}

export const ProblemConditionCard: React.FC<ProblemConditionCardProps> = ({
  ctsColumn,
  cpk,
  eventsPerWeek,
  x,
  y,
}) => {
  const locale = getDocumentLocale();
  const cpkFormatted = formatStatistic(cpk, locale, 2);
  const label = `Problem condition: ${ctsColumn}, Cpk ${cpkFormatted}, ${eventsPerWeek} events per week`;

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
        Problem condition
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
        {eventsPerWeek} events/wk
      </text>
    </g>
  );
};
