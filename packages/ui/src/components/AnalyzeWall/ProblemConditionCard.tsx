/**
 * ProblemConditionCard — Red-bordered card at the top of the Investigation Wall
 *
 * The SCOPE ANCHOR (IM-4a): the compound WHERE of the active
 * `ProblemStatementScope`. Displays the CTS/outcome label, the live Cpk +
 * event rate for the scoped subset, and — when scope props are threaded — the
 * compound condition text, the HOLDS N/M gate (the scope's gateNode evaluated
 * via `runAndCheck`), and the IM-5 What-If projected Cpk + coverage %.
 *
 * Values are computed by the caller (app) from the live active scope + data
 * window and threaded in as props (the same pattern as `cpk`/`eventsPerWeek`).
 * Within ONE homogeneous outcome (ADR-073) — no roll-up.
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 */

import React from 'react';
import { formatStatistic, formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '@variscout/charts';
import { useWallLocale } from './hooks/useWallLocale';

export interface ProblemConditionCardProps {
  ctsColumn: string;
  cpk: number;
  eventsPerWeek: number;
  x: number;
  y: number;
  /**
   * The active scope's compound WHERE as display text (e.g.
   * "Machine = B ∩ Product = X"). Omit when there is no active scope; the card
   * then renders just the outcome label (back-compat).
   */
  conditionText?: string;
  /** HOLDS — rows satisfying the scope's gateNode (`runAndCheck.holds`). */
  holds?: number;
  /** Total rows in the active data window (`runAndCheck.total`). */
  total?: number;
  /**
   * The scope's What-If projected overall Cpk (`computeScopeWhatIfProjection`).
   * `null`/`undefined` when unprojectable — the row is then omitted.
   */
  whatIfCpk?: number | null;
  /** The scope's condition coverage % (`computeConditionCoverage`, 0–100). */
  coveragePct?: number;
}

const CARD_W = 320;
/** Base card height (no scope rows). */
const CARD_H_BASE = 80;
/** Extra height per scope detail row. */
const ROW_H = 18;

export const ProblemConditionCard: React.FC<ProblemConditionCardProps> = ({
  ctsColumn,
  cpk,
  eventsPerWeek,
  x,
  y,
  conditionText,
  holds,
  total,
  whatIfCpk,
  coveragePct,
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

  const hasHolds = holds !== undefined && total !== undefined;
  const holdsText = hasHolds
    ? total === 0
      ? getMessage(locale, 'wall.gate.noTotals')
      : formatMessage(locale, 'wall.gate.holds', { matching: holds, total })
    : undefined;

  const hasWhatIf = whatIfCpk !== undefined && whatIfCpk !== null;
  const whatIfText = hasWhatIf
    ? formatMessage(locale, 'wall.scope.whatIf', {
        value: formatStatistic(whatIfCpk, locale, 2),
      })
    : undefined;

  const hasCoverage = coveragePct !== undefined;
  const coverageText = hasCoverage
    ? formatMessage(locale, 'wall.scope.coverage', {
        value: formatStatistic(coveragePct, locale, 0),
      })
    : undefined;

  // Dynamic height: add a row for the condition line, the HOLDS line, and the
  // What-If/coverage line (the latter two share a row).
  const conditionRow = conditionText ? 1 : 0;
  const holdsRow = hasHolds ? 1 : 0;
  const projectionRow = hasWhatIf || hasCoverage ? 1 : 0;
  const cardH = CARD_H_BASE + (conditionRow + holdsRow + projectionRow) * ROW_H;

  // Vertical cursor for the scope detail rows (each row below the events line
  // at y=70 advances by ROW_H).
  let rowY = 70;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x - CARD_W / 2}, ${y})`}
    >
      <rect
        width={CARD_W}
        height={cardH}
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
        y={rowY}
        textAnchor="middle"
        className="fill-content-subtle text-[10px] font-mono"
      >
        {eventsLabel}
      </text>

      {conditionText && (
        <text
          x={CARD_W / 2}
          y={(rowY += ROW_H)}
          textAnchor="middle"
          className="fill-content text-[10px] font-mono"
          data-testid="problem-scope-condition"
        >
          {conditionText}
        </text>
      )}

      {holdsText && (
        <text
          x={CARD_W / 2}
          y={(rowY += ROW_H)}
          textAnchor="middle"
          className="fill-content-muted text-[10px] font-mono"
          data-testid="problem-scope-holds"
        >
          {holdsText}
        </text>
      )}

      {(whatIfText || coverageText) && (
        <text
          x={CARD_W / 2}
          y={(rowY += ROW_H)}
          textAnchor="middle"
          className="fill-content-subtle text-[10px] font-mono"
          data-testid="problem-scope-projection"
        >
          {[whatIfText, coverageText].filter(Boolean).join(' · ')}
        </text>
      )}
    </g>
  );
};
