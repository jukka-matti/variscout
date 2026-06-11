/**
 * ConditionPillBase — the ONE pattern for minting a condition from a chart
 * gesture (ER-4, spec §7.1; mockup `.capture-pill` / #bandPill).
 *
 * A small floating card that appears on a brush band (I-Chart) OR a group click
 * (boxplot / Pareto). It reports the gesture's condition honestly —
 *   `<gesture><summary> · n=<nIn> · x̄ <meanIn> vs <meanOut>`
 * — and offers two commit actions: `✚ Capture finding` (optional — hidden when
 * `onCapture` is absent so it is never a dead control) and `view as condition →`.
 *
 * The pill itself commits NOTHING; the host decides what happens on each action
 * (the click→drill path retires — commit is explicit, D6/Principle 6). Esc and
 * outside-click dismiss it (the ModelDrawer / EvidenceMapContextMenu convention).
 *
 * Props-based, NO store reads (a *Base primitive). All copy via the
 * `conditionPill.*` MessageCatalog keys; numbers via `formatStatistic` — never
 * `.toFixed()`. Colours via semantic theme classes only (tokens are @theme-only).
 */

import React, { useEffect, useRef } from 'react';
import { formatStatistic, formatMessage } from '@variscout/core/i18n';
import { useWallLocale } from '../../AnalyzeWall/hooks/useWallLocale';

export interface ConditionPillBaseProps {
  /**
   * The gesture's human-readable condition, already formatted by the caller via
   * `formatConditionLeaves` (e.g. "Weight_g > 12.1" or "Cavity = Cav1").
   */
  summary: string;
  /** Row count inside the gesture's condition. */
  nIn: number;
  /** Mean of Y inside the condition. Both means required to show the comparison. */
  meanIn?: number;
  /** Mean of Y outside the condition. Both means required to show the comparison. */
  meanOut?: number;
  /** Statistic label shown before the means; defaults to "x̄". */
  statLabel?: string;
  /**
   * Optional prefix that only the brush gesture supplies (e.g. "brushed: ") — a
   * group-click pill omits it so it reads "<summary> · n=… · x̄ … vs …".
   */
  gestureLabel?: string;
  /**
   * ✚ Capture finding (spec §7.1 grants the pill a capture affordance). Optional —
   * the button is hidden entirely when absent (never a dead control).
   */
  onCapture?(): void;
  /** view as condition → — commit the gesture as the applied scope. */
  onViewAsCondition(): void;
  /** Dismiss (Esc / outside-click). */
  onDismiss(): void;
  /**
   * Absolute position within the chart container. When provided the pill floats
   * at {x, y}; when absent it renders inline (static, no absolute positioning).
   */
  anchor?: { x: number; y: number };
}

export const ConditionPillBase: React.FC<ConditionPillBaseProps> = ({
  summary,
  nIn,
  meanIn,
  meanOut,
  statLabel,
  gestureLabel,
  onCapture,
  onViewAsCondition,
  onDismiss,
  anchor,
}) => {
  const locale = useWallLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Esc + outside-click dismiss (the ModelDrawer / EvidenceMapContextMenu
  //    convention: document-level listeners while mounted). ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [onDismiss]);

  // Show the in-vs-out comparison only when BOTH halves are finite.
  const hasMeans =
    meanIn !== undefined &&
    meanOut !== undefined &&
    Number.isFinite(meanIn) &&
    Number.isFinite(meanOut);

  const resolvedStatLabel = statLabel ?? formatMessage(locale, 'conditionPill.statDefault');
  const prefix = gestureLabel ?? '';

  const copy = hasMeans
    ? formatMessage(locale, 'conditionPill.summaryWithMeans', {
        gesture: prefix,
        summary,
        n: nIn,
        statLabel: resolvedStatLabel,
        meanIn: formatStatistic(meanIn as number, locale, 1),
        meanOut: formatStatistic(meanOut as number, locale, 1),
      })
    : formatMessage(locale, 'conditionPill.summaryNoMeans', {
        gesture: prefix,
        summary,
        n: nIn,
      });

  const style: React.CSSProperties = anchor
    ? { position: 'absolute', left: `${anchor.x}px`, top: `${anchor.y}px` }
    : {};

  return (
    <div
      ref={rootRef}
      data-testid="condition-pill"
      role="dialog"
      aria-label={formatMessage(locale, 'conditionPill.ariaLabel', { summary })}
      style={style}
      className="z-30 inline-flex items-stretch overflow-hidden rounded-lg border border-edge bg-surface text-xs shadow-lg"
    >
      <span className="whitespace-nowrap px-2.5 py-1.5 font-mono text-content-secondary">
        {copy}
      </span>
      {onCapture && (
        <button
          type="button"
          data-testid="condition-pill-capture"
          onClick={onCapture}
          className="whitespace-nowrap border-l border-edge px-3 font-semibold text-content hover:bg-surface-secondary"
        >
          {formatMessage(locale, 'conditionPill.capture')}
        </button>
      )}
      <button
        type="button"
        data-testid="condition-pill-apply"
        onClick={onViewAsCondition}
        className="whitespace-nowrap border-l border-edge bg-content px-3 py-1.5 font-semibold text-surface hover:opacity-90"
      >
        {formatMessage(locale, 'conditionPill.apply')}
      </button>
    </div>
  );
};
