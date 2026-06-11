import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { FactorStripChip, MembershipChip, FactorStripStepDecoration } from '@variscout/hooks';

/** Width budget for the common-scale bar (wireframe: max share → 72px). */
const BAR_MAX_PX = 72;
const BAR_MIN_PX = 4;
/** Max width for the membership separation bar (Ṽ is [0,1] bounded). */
const MEMBERSHIP_BAR_MAX_PX = 72;
/** Default what-if reference target when the caller cascade resolves nothing. */
const DEFAULT_CPK_TARGET = 1.33;
/** Ranked chips always shown expanded (disclosure — top-N by global rank). */
const TOP_N_EXPANDED = 3;

export interface FactorStripBaseProps {
  /** Ranked chips from useFactorStripModel (engine order, adjusted DESC). */
  chips: FactorStripChip[];
  /** Approximate joint-model residual (100 − largest share). Null → hidden. */
  residualPct: number | null;
  /** The active comparison factor — its chip renders active. */
  selectedFactor?: string | null;
  /** Factor names already examined → render an examined ✓ glyph. */
  examinedKeys: ReadonlySet<string>;
  /** Drilled into a condition → scoped retitle + scoped what-if copy. */
  isScoped?: boolean;
  /** Reference Cpk for the what-if hover (caller resolves the 1.33 cascade). */
  cpkTarget?: number;
  /** Outcome alias for hover copy ("average <outcomeLabel>"). */
  outcomeLabel?: string;
  /** Chip click — caller wires both selection and examined-marking. */
  onFactorSelect(factor: string): void;
  /** Model/ANOVA link handler — absent → a transient stub tooltip. */
  onAnovaLinkClick?(): void;
  /**
   * Strip variant. Default 'magnitude' — renders exactly as before (byte-identical).
   * 'membership' renders the membership-separation view when a condition is applied
   * (ER-5a, D7): factors ranked by Cramér's Ṽ, each chip showing its over-represented
   * level + separation bar. The magnitude rendering path is 100% unchanged.
   */
  variant?: 'magnitude' | 'membership';
  /**
   * Membership chips from useMembershipModel (required when variant='membership').
   * Ignored when variant is 'magnitude' (default).
   */
  membershipChips?: MembershipChip[];
  /**
   * Optional step decorations for the membership variant (ER-9 preservation).
   * Keyed by factor column name — mirrors the stepDecorations prop in
   * useFactorStripModel so the step badge still renders on membership chips.
   * Absent → no step badge rendered (safe default).
   */
  membershipStepDecorations?: ReadonlyMap<string, FactorStripStepDecoration>;
}

/**
 * FactorStripBase — the headline guidance surface under the I-Chart hero
 * ("What explains the variation?"). Ranks candidate factors by
 * cardinality-penalised share of variation (η², ω²-adjusted by the engine) and
 * renders ranked chips with a common-scale bar, ★ on the largest significant
 * share, an everyday-variation residual chip, and a what-if hover card.
 *
 * Props-based, store-free (ui *Base convention). All copy via i18n; all numbers
 * via formatStat (never toFixed). The strip NEVER auto-selects a factor —
 * onFactorSelect fires only from a user click. P5: ★ says "largest share",
 * never force-ranked language; D3: parallel bars only, never stacked/pie.
 */
export const FactorStripBase: React.FC<FactorStripBaseProps> = ({
  chips,
  residualPct,
  selectedFactor,
  examinedKeys,
  isScoped = false,
  cpkTarget = DEFAULT_CPK_TARGET,
  outcomeLabel,
  onFactorSelect,
  onAnovaLinkClick,
  variant = 'magnitude',
  membershipChips,
  membershipStepDecorations,
}) => {
  const { t, tf, formatStat } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [stubVisible, setStubVisible] = useState(false);
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const stubTimerRef = useRef<number | null>(null);

  // M-8: clear the stub timeout on unmount to prevent setState-after-unmount.
  useEffect(() => {
    return () => {
      if (stubTimerRef.current !== null) {
        window.clearTimeout(stubTimerRef.current);
      }
    };
  }, []);

  // Common-scale normalization: the largest adjusted share maps to BAR_MAX_PX.
  const maxPct = useMemo(() => chips.reduce((m, c) => Math.max(m, c.adjustedPct), 0), [chips]);

  // Disclosure: the top-N by global rank always render expanded; any
  // framing-selected chip outside the top-N also renders expanded (selection =
  // prominence). Everything else collapses under "+N also screened".
  const { primaryChips, collapsedChips } = useMemo(() => {
    const primary: FactorStripChip[] = [];
    const collapsed: FactorStripChip[] = [];
    chips.forEach((chip, idx) => {
      if (idx < TOP_N_EXPANDED || chip.isSelected) primary.push(chip);
      else collapsed.push(chip);
    });
    return { primaryChips: primary, collapsedChips: collapsed };
  }, [chips]);

  const visibleChips = expanded ? chips : primaryChips;
  const hiddenCount = collapsedChips.length;

  const barWidthPx = (pct: number): number => {
    if (maxPct <= 0) return BAR_MIN_PX;
    return Math.max(BAR_MIN_PX, Math.round((pct / maxPct) * BAR_MAX_PX));
  };

  // I-3: O(1) rank look-up — avoids O(n²) chips.indexOf inside the render loop.
  const rankIndexMap = useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>();
    chips.forEach((chip, idx) => m.set(chip.factor, idx));
    return m;
  }, [chips]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAnovaLinkClick) {
      onAnovaLinkClick();
      return;
    }
    setStubVisible(true);
    if (stubTimerRef.current !== null) {
      window.clearTimeout(stubTimerRef.current);
    }
    stubTimerRef.current = window.setTimeout(() => {
      setStubVisible(false);
      stubTimerRef.current = null;
    }, 2400);
  };

  const renderChip = (chip: FactorStripChip, rankIndex: number) => {
    const isStarred = rankIndex === 0 && chip.isSignificant && chip.adjustedPct >= 1;
    const isExamined = examinedKeys.has(chip.factor);
    const isActive = selectedFactor === chip.factor;
    // M-6: prefix with "joint n=" to distinguish from the per-factor n in the what-if card.
    const hoverTitle = tf('factorStrip.chip.hover', {
      p: formatStat(chip.pValue, 4),
      dfB: chip.dfBetween,
      dfW: chip.dfWithin,
      n: chip.n,
    });

    return (
      <div
        key={chip.factor}
        data-testid={`factor-chip-${chip.factor}`}
        data-factor={chip.factor}
        data-weak={chip.isWeak ? 'true' : 'false'}
        data-active={isActive ? 'true' : 'false'}
        title={hoverTitle}
        aria-label={chip.factor}
        onClick={() => onFactorSelect(chip.factor)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFactorSelect(chip.factor);
          }
        }}
        onMouseEnter={() => setHoveredFactor(chip.factor)}
        onMouseLeave={() => setHoveredFactor(prev => (prev === chip.factor ? null : prev))}
        onFocus={() => setHoveredFactor(chip.factor)}
        onBlur={() => setHoveredFactor(prev => (prev === chip.factor ? null : prev))}
        role="button"
        tabIndex={0}
        className={[
          'flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors',
          isActive
            ? 'border-status-info bg-status-info-soft'
            : 'border-edge bg-surface-elevated hover:bg-surface-secondary',
          chip.isWeak ? 'opacity-70' : '',
        ].join(' ')}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-content">
          <span>{chip.factor}</span>
          {chip.step && (
            <span
              data-testid="factor-chip-step-badge"
              title={tf('factorStrip.stepBadge.title', { step: chip.step.stepName })}
              className="rounded border border-edge bg-surface-secondary px-1 py-0.5 text-[10px] font-medium text-content-secondary"
            >
              {chip.step.stepName}
            </span>
          )}
          {chip.binnedForRanking && (
            <span className="text-content-muted font-normal">{t('factorStrip.binned')}</span>
          )}
          {isStarred && (
            <span
              data-testid="factor-chip-star"
              title={t('factorStrip.star.title')}
              className="text-status-warning"
            >
              <Star size={11} className="fill-status-warning text-status-warning" />
            </span>
          )}
          {isExamined && (
            <span
              data-testid="factor-chip-check"
              title={t('factorStrip.examined')}
              className="ml-auto text-status-pass"
            >
              <Check size={11} />
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span
            data-testid="factor-chip-bar"
            className={[
              'h-1 rounded-full',
              chip.isWeak ? 'bg-edge-secondary' : 'bg-status-info',
            ].join(' ')}
            style={{ width: `${barWidthPx(chip.adjustedPct)}px` }}
          />
          <span className="text-[11px] text-content-secondary">
            {formatStat(chip.adjustedPct, 1)}%
          </span>
        </span>
      </div>
    );
  };

  // ── Membership variant helpers ──────────────────────────────────────────
  // Ṽ separation → bar width: Ṽ is bounded [0,1]; the largest Ṽ maps to
  // MEMBERSHIP_BAR_MAX_PX (common-scale, same honesty principle as magnitude).
  const maxSeparation = useMemo(
    () => (membershipChips ?? []).reduce((m, c) => Math.max(m, c.separation), 0),
    [membershipChips]
  );

  const membershipBarWidthPx = (separation: number): number => {
    if (maxSeparation <= 0) return BAR_MIN_PX;
    return Math.max(BAR_MIN_PX, Math.round((separation / maxSeparation) * MEMBERSHIP_BAR_MAX_PX));
  };

  const renderMembershipChip = (chip: MembershipChip) => {
    const isActive = selectedFactor === chip.factor;
    const isExamined = examinedKeys.has(chip.factor);
    // ER-9 step badge: look up from the caller-supplied decorations map.
    const stepDecoration = membershipStepDecorations?.get(chip.factor) ?? null;

    // Lift rendering: Infinity → i18n label; finite → formatted to 1 decimal.
    let topLevelAnnotation: string | null = null;
    if (chip.topLevel !== null) {
      const { level, lift } = chip.topLevel;
      if (!Number.isFinite(lift)) {
        topLevelAnnotation = `${level} — ${t('factorStrip.membership.chip.onlyInCondition')}`;
      } else {
        topLevelAnnotation = tf('factorStrip.membership.chip.topLevel', {
          level,
          lift: formatStat(lift, 1),
        });
      }
    }

    // Chip hover: p-value + χ² df (df = 1 for binary membership column, r−1=1).
    const hoverTitle = tf('factorStrip.membership.chip.hover', {
      p: formatStat(chip.pValue, 4),
      df: 1,
      n: 0,
    });

    return (
      <div
        key={chip.factor}
        data-testid={`factor-chip-${chip.factor}`}
        data-factor={chip.factor}
        data-active={isActive ? 'true' : 'false'}
        title={hoverTitle}
        aria-label={chip.factor}
        onClick={() => onFactorSelect(chip.factor)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFactorSelect(chip.factor);
          }
        }}
        role="button"
        tabIndex={0}
        className={[
          'flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors',
          isActive
            ? 'border-status-info bg-status-info-soft'
            : 'border-edge bg-surface-elevated hover:bg-surface-secondary',
          chip.isSignificant ? '' : 'opacity-70',
        ].join(' ')}
      >
        {/* Row 1: factor name + step badge + binned annotation + examined glyph */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-content">
          <span>{chip.factor}</span>
          {/* ER-9 preservation: step badge from caller-supplied decorations map */}
          {stepDecoration && (
            <span
              data-testid="factor-chip-step-badge"
              title={tf('factorStrip.stepBadge.title', { step: stepDecoration.stepName })}
              className="rounded border border-edge bg-surface-secondary px-1 py-0.5 text-[10px] font-medium text-content-secondary"
            >
              {stepDecoration.stepName}
            </span>
          )}
          {chip.binnedForRanking && (
            <span className="text-content-muted font-normal">{t('factorStrip.binned')}</span>
          )}
          {isExamined && (
            <span
              data-testid="factor-chip-check"
              title={t('factorStrip.examined')}
              className="ml-auto text-status-pass"
            >
              <Check size={11} />
            </span>
          )}
        </span>
        {/* Row 2: top-level annotation ("Level ×N.N" or "only in condition") */}
        {topLevelAnnotation && (
          <span
            data-testid="factor-chip-membership-top-level"
            className="text-[11px] font-medium text-content-secondary"
          >
            {topLevelAnnotation}
          </span>
        )}
        {/* Row 3: separation bar + separation label (NOT "% of variation" — P5) */}
        <span className="flex items-center gap-2">
          <span
            data-testid="factor-chip-bar"
            className="h-1 rounded-full bg-status-info"
            style={{ width: `${membershipBarWidthPx(chip.separation)}px` }}
          />
          <span
            data-testid="factor-chip-separation-label"
            className="text-[11px] text-content-secondary"
          >
            {t('factorStrip.membership.separation')} {formatStat(chip.separation, 2)}
          </span>
        </span>
      </div>
    );
  };

  const title =
    variant === 'membership'
      ? t('factorStrip.title.membership')
      : isScoped
        ? t('factorStrip.title.scoped')
        : t('factorStrip.title');

  // Resolve the what-if card for the currently-hovered chip (skip when absent).
  const hoveredChip = hoveredFactor ? (chips.find(c => c.factor === hoveredFactor) ?? null) : null;
  const whatIf = hoveredChip?.whatIf;

  // ── Membership chip list (disclosure: same top-3 + selected rule) ──
  const { primaryMembershipChips, collapsedMembershipChips } = useMemo(() => {
    const chips = membershipChips ?? [];
    const primary: MembershipChip[] = [];
    const collapsed: MembershipChip[] = [];
    chips.forEach((chip, idx) => {
      if (idx < TOP_N_EXPANDED || chip.isSelected) primary.push(chip);
      else collapsed.push(chip);
    });
    return { primaryMembershipChips: primary, collapsedMembershipChips: collapsed };
  }, [membershipChips]);

  const visibleMembershipChips = expanded ? (membershipChips ?? []) : primaryMembershipChips;
  const hiddenMembershipCount = collapsedMembershipChips.length;

  return (
    <div className="relative flex flex-col gap-2 px-3.5 py-2.5">
      {/* ── Label row ── */}
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <h2 className="text-[12.5px] font-semibold text-content">{title}</h2>
        {variant === 'membership' ? (
          <span className="text-[11px] text-content-muted">
            {t('factorStrip.membership.subtitle')}
          </span>
        ) : (
          <>
            <span className="text-[11px] text-content-muted">{t('factorStrip.subtitle')}</span>
            <span className="basis-full text-[11px] text-content-muted">
              {t('factorStrip.bridge')}
            </span>
            <a
              href="#"
              onClick={handleLinkClick}
              className="ml-auto text-[11px] text-status-info no-underline hover:underline"
            >
              {t('factorStrip.modelLink')}
            </a>
          </>
        )}
      </div>

      {stubVisible && (
        <div
          data-testid="factor-strip-model-stub"
          role="status"
          className="absolute right-3.5 top-7 z-30 rounded-md border border-edge bg-surface-elevated px-2 py-1 text-[11px] text-content-secondary shadow-sm"
        >
          {t('factorStrip.modelLink.stub')}
        </div>
      )}

      {/* ── Chip row ── */}
      {variant === 'membership' ? (
        <div className="flex flex-wrap items-stretch gap-1.5">
          {visibleMembershipChips.map(chip => renderMembershipChip(chip))}

          {!expanded && hiddenMembershipCount > 0 && (
            <button
              type="button"
              data-testid="factor-strip-also-screened"
              onClick={() => setExpanded(true)}
              className="flex items-center rounded-lg border border-dashed border-edge px-2.5 py-1.5 text-[11px] font-medium text-content-muted hover:bg-surface-secondary transition-colors"
            >
              {tf('factorStrip.alsoScreened', { n: hiddenMembershipCount })}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-stretch gap-1.5">
          {visibleChips.map(chip => {
            // rankIndex is the GLOBAL rank (chips is engine-ordered), so the star
            // gate keys off true rank, not the position within the visible slice.
            // I-3: O(1) Map look-up instead of identity-fragile chips.indexOf.
            const rankIndex = rankIndexMap.get(chip.factor) ?? 0;
            return renderChip(chip, rankIndex);
          })}

          {!expanded && hiddenCount > 0 && (
            <button
              type="button"
              data-testid="factor-strip-also-screened"
              onClick={() => setExpanded(true)}
              className="flex items-center rounded-lg border border-dashed border-edge px-2.5 py-1.5 text-[11px] font-medium text-content-muted hover:bg-surface-secondary transition-colors"
            >
              {tf('factorStrip.alsoScreened', { n: hiddenCount })}
            </button>
          )}

          {residualPct !== null && (
            <div
              data-testid="factor-chip-residual"
              title={t('factorStrip.residual.hover')}
              className="flex flex-col justify-center px-2.5 py-1.5 text-[11px] text-content-muted"
            >
              {tf('factorStrip.residual', { n: formatStat(residualPct, 0) })}
            </div>
          )}
        </div>
      )}

      {/* ── What-if hover card (absent when the chip carries no projection) ── */}
      {whatIf && hoveredChip && (
        <div
          data-testid="factor-whatif-card"
          className="absolute left-3.5 top-full z-30 mt-1.5 flex w-[300px] max-w-[90%] flex-col gap-1 rounded-lg border border-edge bg-surface-elevated p-2.5 text-[11px] text-content-secondary shadow-md"
        >
          <span className="font-semibold text-content-muted">{t('factorStrip.whatif.label')}</span>
          <span>
            {tf('factorStrip.whatif.matched', {
              factor: hoveredChip.factor,
              bestLevel: whatIf.bestLevel,
            })}
          </span>
          <span>
            {tf(isScoped ? 'factorStrip.whatif.average.scoped' : 'factorStrip.whatif.average', {
              outcome: outcomeLabel ?? '',
              n: whatIf.n,
              current: formatStat(whatIf.currentMean, 0),
              projected: formatStat(whatIf.projectedMean, 0),
            })}
          </span>
          {whatIf.currentCpk !== undefined && whatIf.projectedCpk !== undefined && (
            <span>
              {tf('factorStrip.whatif.cpk', {
                current: formatStat(whatIf.currentCpk, 2),
                projected: formatStat(whatIf.projectedCpk, 2),
                target: formatStat(cpkTarget, 2),
              })}
            </span>
          )}
          <span className="text-content-muted">
            {tf('factorStrip.whatif.bridge', { k: whatIf.k })}
          </span>
        </div>
      )}
    </div>
  );
};

export default FactorStripBase;
