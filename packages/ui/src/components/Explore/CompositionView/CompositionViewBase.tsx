/**
 * CompositionViewBase — per-level composition of a selected factor under the
 * active condition (ER-5a, spec §7.3).
 *
 * When the analyst selects a factor chip from the membership strip, this view
 * occupies the freed Pareto slot and answers:
 *   "How are each level of <factor> distributed between the condition and the rest?"
 *
 * Two view modes (local toggle, default 'lift'):
 *   - **lift view**: paired bars per level (share-in vs share-out), sorted lift desc.
 *     The leading level's lift annotation renders "×N.N" (or "only in condition").
 *   - **count view**: bars by nIn (Pareto reading of the condition), sorted nIn desc.
 *
 * Per-level ⊕ button: calls onAddToCondition(level) — minting a compound
 * condition via `applyCondition([...appliedLeaves, buildGroupLeaf(column, level)])`.
 * The button is absent when onAddToCondition is not supplied.
 *
 * Honesty rules (P5 / ADR-069 B3):
 *   - Bars are parallel, never stacked (D3 — same rule as the magnitude strip).
 *   - Lift labels say "×N.N", never "N% more likely" (that's a probability claim).
 *   - The subtitle says "share", never "% of variation".
 *
 * Props-based, NO store access (*Base convention).
 * All copy via useTranslation; all numbers via formatStat (never toFixed).
 * Tailwind tokens verified against theme.css.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@variscout/hooks';
import type { MembershipLevelComposition } from '@variscout/core';

/** The two view modes for the composition view. */
type CompositionViewMode = 'lift' | 'count';

/** Bar scale budget — the level with the largest bar maps to this width. */
const BAR_MAX_PX = 72;
const BAR_MIN_PX = 4;

export interface CompositionViewBaseProps {
  /**
   * Per-level composition data from useCompositionModel, sorted lift desc.
   * The count view re-sorts locally to nIn desc.
   */
  levels: MembershipLevelComposition[];
  /** Number of rows inside the condition (NIn). */
  nIn: number;
  /** Number of rows outside the condition (NOut). */
  nOut: number;
  /** The factor whose levels are being decomposed (used in the heading). */
  factorLabel: string;
  /**
   * Called with the level label when the analyst clicks ⊕ to add a level
   * to the compound condition. Absent → ⊕ button hidden (never a dead control).
   */
  onAddToCondition?: (level: string) => void;
}

/**
 * CompositionViewBase — paired share bars per level, lift annotation, ⊕ compound
 * condition minting, count ⇄ lift toggle.
 */
export const CompositionViewBase: React.FC<CompositionViewBaseProps> = ({
  levels,
  nIn,
  nOut,
  factorLabel,
  onAddToCondition,
}) => {
  const { t, tf, formatStat } = useTranslation();
  const [mode, setMode] = useState<CompositionViewMode>('lift');

  // Degenerate guard: no levels or counts → empty state.
  const isEmpty = levels.length === 0 || (nIn === 0 && nOut === 0);

  // Count view re-sorts nIn desc locally — the hook returns lift-desc order.
  const sortedLevels = useMemo<MembershipLevelComposition[]>(() => {
    if (mode === 'count') {
      return [...levels].sort((a, b) => b.nIn - a.nIn);
    }
    return levels; // lift view: engine order (lift desc) preserved
  }, [levels, mode]);

  // Common scale: the bar proportional to its share (for both modes).
  // Lift view: bars proportional to shareIn (in-condition share).
  // Count view: bars proportional to nIn (condition count).
  const maxBarValue = useMemo(() => {
    if (mode === 'count') return sortedLevels.reduce((m, l) => Math.max(m, l.nIn), 0);
    return sortedLevels.reduce((m, l) => Math.max(m, l.shareIn, l.shareOut), 0);
  }, [sortedLevels, mode]);

  const barWidthPx = (value: number): number => {
    if (maxBarValue <= 0) return BAR_MIN_PX;
    return Math.max(BAR_MIN_PX, Math.round((value / maxBarValue) * BAR_MAX_PX));
  };

  // Lift label for a level entry.
  const liftLabel = (level: MembershipLevelComposition): string => {
    if (level.lift === undefined || !Number.isFinite(level.lift)) {
      return t('compositionView.liftOnlyInCondition');
    }
    return tf('compositionView.lift', { lift: formatStat(level.lift, 1) });
  };

  if (isEmpty) {
    return (
      <div
        data-testid="composition-view"
        className="flex items-center px-3.5 py-2.5 text-[11px] text-content-muted"
      >
        {t('compositionView.empty')}
      </div>
    );
  }

  return (
    <div data-testid="composition-view" className="flex flex-col gap-2 px-3.5 py-2.5">
      {/* ── Header row: title + toggle ── */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-[12.5px] font-semibold text-content">
          {tf('compositionView.title', { factor: factorLabel })}
        </h2>
        {/* count ⇄ lift toggle (D12 — condition-scoped, local UI state) */}
        <div
          data-testid="composition-toggle"
          role="group"
          aria-label="View mode"
          className="ml-auto flex rounded-md border border-edge overflow-hidden text-[11px]"
        >
          <button
            type="button"
            data-testid="composition-toggle-lift"
            onClick={() => setMode('lift')}
            aria-pressed={mode === 'lift'}
            className={[
              'px-2.5 py-0.5 font-medium transition-colors',
              mode === 'lift'
                ? 'bg-status-info text-surface'
                : 'bg-surface-elevated text-content-secondary hover:bg-surface-secondary',
            ].join(' ')}
          >
            {t('compositionView.toggle.lift')}
          </button>
          <button
            type="button"
            data-testid="composition-toggle-count"
            onClick={() => setMode('count')}
            aria-pressed={mode === 'count'}
            className={[
              'px-2.5 py-0.5 font-medium border-l border-edge transition-colors',
              mode === 'count'
                ? 'bg-status-info text-surface'
                : 'bg-surface-elevated text-content-secondary hover:bg-surface-secondary',
            ].join(' ')}
          >
            {t('compositionView.toggle.count')}
          </button>
        </div>
      </div>

      {/* ── Level rows ── */}
      <div className="flex flex-col gap-2">
        {sortedLevels.map(level => (
          <div
            key={level.level}
            data-testid={`composition-level-${level.level}`}
            className="flex flex-col gap-0.5"
          >
            {/* Level label row + ⊕ button */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-content min-w-0 truncate">
                {level.level}
              </span>
              {/* Lift annotation (lift view only) */}
              {mode === 'lift' && (
                <span
                  data-testid={`composition-lift-${level.level}`}
                  className="text-[11px] text-content-secondary shrink-0"
                >
                  {liftLabel(level)}
                </span>
              )}
              {/* Count annotation (count view only) */}
              {mode === 'count' && (
                <span
                  data-testid={`composition-count-${level.level}`}
                  className="text-[11px] text-content-secondary shrink-0"
                >
                  {level.nIn} {t('compositionView.countIn')}
                </span>
              )}
              {/* ⊕ add to condition — absent when handler not supplied */}
              {onAddToCondition && (
                <button
                  type="button"
                  data-testid={`composition-add-${level.level}`}
                  aria-label={tf('compositionView.addAria', { level: level.level })}
                  onClick={() => onAddToCondition(level.level)}
                  className="ml-auto shrink-0 rounded border border-edge bg-surface-elevated px-1.5 py-0.5 text-[11px] font-medium text-status-info hover:bg-status-info-soft transition-colors"
                >
                  ⊕
                </button>
              )}
            </div>

            {/* Paired bars (lift view) or single bar (count view) */}
            {mode === 'lift' ? (
              <div className="flex flex-col gap-0.5 pl-0">
                {/* In-condition bar */}
                <div className="flex items-center gap-2">
                  <span
                    data-testid={`composition-bar-in-${level.level}`}
                    className="h-2 rounded-full bg-status-info shrink-0"
                    style={{ width: `${barWidthPx(level.shareIn)}px` }}
                  />
                  <span className="text-[10px] text-content-secondary shrink-0">
                    {formatStat(level.shareIn * 100, 1)}% {t('compositionView.shareIn')}
                  </span>
                </div>
                {/* Out-of-condition bar */}
                <div className="flex items-center gap-2">
                  <span
                    data-testid={`composition-bar-out-${level.level}`}
                    className="h-2 rounded-full bg-edge-secondary shrink-0"
                    style={{ width: `${barWidthPx(level.shareOut)}px` }}
                  />
                  <span className="text-[10px] text-content-muted shrink-0">
                    {formatStat(level.shareOut * 100, 1)}% {t('compositionView.shareOut')}
                  </span>
                </div>
              </div>
            ) : (
              /* Count view: single bar proportional to nIn */
              <div className="flex items-center gap-2">
                <span
                  data-testid={`composition-bar-in-${level.level}`}
                  className="h-2 rounded-full bg-status-info shrink-0"
                  style={{ width: `${barWidthPx(level.nIn)}px` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompositionViewBase;
