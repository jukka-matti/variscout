import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type {
  FactorStripChip,
  MembershipChip,
  FactorStripStepDecoration,
  DefectRateChip,
} from '@variscout/hooks';
import type { ModelInteraction } from '../ModelDrawer/ModelDrawerBase';

/**
 * Winning interaction from the model drawer (ER-6).
 * Re-exported here so callers can reference the type from @variscout/ui
 * without importing from @variscout/ui/model-drawer.
 * Pattern is geometric only — ordinal or disordinal — never role-based.
 */
export type { ModelInteraction };

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
   * 'defect-rate-share' renders the defect-rate concentration view when in defect
   * dispatch (ER-5b): factors ranked by how strongly their levels concentrate the
   * defect rate. Rate concentration is NOT a variance share (ADR-088 / P5).
   */
  variant?: 'magnitude' | 'membership' | 'defect-rate-share';
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
  /**
   * Defect-rate chips from useDefectRateModel (required when variant='defect-rate-share').
   * Ignored when variant is 'magnitude' or 'membership'.
   */
  defectRateChips?: DefectRateChip[];
  /**
   * Whether the defect outcome is a rate (0–1 proportion → DefectRate) or a raw
   * mean count (→ DefectCount). Controls whether the per-level top-level annotation
   * multiplies by 100 and appends "%" (rate path) or formats the count directly
   * without scaling (count path). Statistical honesty requirement (P5 / ADR-069):
   * a count of 3.2 must NEVER render as "320.0%" — that would be an honesty violation.
   *
   * true  → DefectRate path: topLevel annotation uses i18n key `factorStrip.defectRate.chip.topLevel`
   *          with `rate = formatStat(value * 100, 1)` and a "%" suffix from the template.
   * false → DefectCount path: annotation uses `factorStrip.defectRate.chip.topLevelCount`
   *          with `count = formatStat(value, 1)` — no ×100, no %.
   *
   * Defaults to true (rate path) to preserve existing behaviour for callers that
   * have not yet threaded outcomeColumn (backwards-compatible).
   */
  isDefectRate?: boolean;
  /**
   * Strip v2 (ER-6): live model stats from the model drawer.
   * When present (magnitude variant only), chips render in-model semipartial ΔR²
   * instead of marginal adjusted-η², the caption flips to "in the model", and the
   * residual becomes 1 − R²adj. When absent, v1 marginal output is preserved exactly.
   * Membership and defect-rate variants ignore this prop.
   */
  modelStats?: {
    deltaR2: Map<string, number>;
    rSquaredAdj: number | null;
    interaction?: ModelInteraction | null;
  } | null;
  /**
   * ER-6: fired when the analyst clicks the ⚡ interaction chip.
   * Receives the interaction payload so the caller can render the focal comparison.
   * Optional — omit when the interaction chip is not wired.
   */
  onInteractionSelect?: (interaction: ModelInteraction) => void;
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
  defectRateChips,
  isDefectRate = true,
  modelStats,
  onInteractionSelect,
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

  // ER-6: strip v2. When modelStats is present on the magnitude variant, chips render
  // in-model ΔR² and the residual is 1 − R²adj. When absent, the v1 marginal path
  // is preserved exactly (progressive non-regressive enhancement).
  const isV2 = variant === 'magnitude' && !!modelStats;

  // v2 residual: 1 − R²adj (percentage). v1: the passed residualPct.
  const effectiveResidualPct = useMemo<number | null>(() => {
    if (!isV2) return residualPct;
    const rAdj = modelStats?.rSquaredAdj;
    if (rAdj == null || !Number.isFinite(rAdj)) return residualPct;
    return Math.round((1 - rAdj) * 100);
  }, [isV2, residualPct, modelStats]);

  // v2 chip value lookup: ΔR² from modelStats, scaled to percentage.
  const getChipPct = (factor: string, adjustedPct: number): number => {
    if (!isV2) return adjustedPct;
    const dr2 = modelStats?.deltaR2.get(factor);
    return dr2 != null ? dr2 * 100 : adjustedPct;
  };

  // Common-scale normalization: the largest adjusted share maps to BAR_MAX_PX.
  // v2: normalize over in-model ΔR² values; v1: over adjustedPct.
  const maxPct = useMemo(() => {
    if (isV2 && modelStats) {
      const values = [...modelStats.deltaR2.values()].map(v => v * 100);
      return values.reduce((m, v) => Math.max(m, v), 0);
    }
    return chips.reduce((m, c) => Math.max(m, c.adjustedPct), 0);
  }, [chips, isV2, modelStats]);

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
            style={{ width: `${barWidthPx(getChipPct(chip.factor, chip.adjustedPct))}px` }}
          />
          <span className="text-[11px] text-content-secondary">
            {formatStat(getChipPct(chip.factor, chip.adjustedPct), 1)}%
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

    // Lift rendering: undefined (only-in-condition) → i18n label; finite → formatted to 1 decimal.
    let topLevelAnnotation: string | null = null;
    if (chip.topLevel !== null) {
      const { level, lift } = chip.topLevel;
      if (lift === undefined || !Number.isFinite(lift)) {
        topLevelAnnotation = `${level} — ${t('factorStrip.membership.chip.onlyInCondition')}`;
      } else {
        topLevelAnnotation = tf('factorStrip.membership.chip.topLevel', {
          level,
          lift: formatStat(lift, 1),
        });
      }
    }

    // Chip hover: p-value + χ² df (k−1 for the factor's level count) + n.
    // Both df and n are forwarded from the engine — never hardcoded constants.
    const hoverTitle = tf('factorStrip.membership.chip.hover', {
      p: formatStat(chip.pValue, 4),
      df: chip.df,
      n: chip.n,
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

  // ── Defect-rate-share variant helpers ──────────────────────────────────
  // Concentration → bar width: the largest concentration maps to BAR_MAX_PX.
  const maxConcentration = useMemo(
    () => (defectRateChips ?? []).reduce((m, c) => Math.max(m, c.concentration), 0),
    [defectRateChips]
  );

  const defectRateBarWidthPx = (concentration: number): number => {
    if (maxConcentration <= 0) return BAR_MIN_PX;
    return Math.max(BAR_MIN_PX, Math.round((concentration / maxConcentration) * BAR_MAX_PX));
  };

  const renderDefectRateChip = (chip: DefectRateChip, rankIndex: number) => {
    const isActive = selectedFactor === chip.factor;
    const isExamined = examinedKeys.has(chip.factor);
    const isStarred = rankIndex === 0 && chip.isSignificant;

    // Statistical-honesty branch (P5 / ADR-069): rate outcomes are ×100 + "%";
    // count outcomes are formatted as-is with no scaling or percent symbol.
    const topLevelAnnotation =
      chip.topLevel !== null
        ? isDefectRate
          ? tf('factorStrip.defectRate.chip.topLevel', {
              level: chip.topLevel.level,
              rate: formatStat(chip.topLevel.rate * 100, 1),
            })
          : tf('factorStrip.defectRate.chip.topLevelCount', {
              level: chip.topLevel.level,
              count: formatStat(chip.topLevel.rate, 1),
            })
        : null;

    return (
      <div
        key={chip.factor}
        data-testid={`factor-chip-${chip.factor}`}
        data-factor={chip.factor}
        data-active={isActive ? 'true' : 'false'}
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
        {/* Row 1: factor name + star + examined glyph */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-content">
          <span>{chip.factor}</span>
          {isStarred && (
            <span
              data-testid="factor-chip-defect-rate-star"
              title={t('factorStrip.defectRate.star.title')}
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
        {/* Row 2: top-level annotation (most over-concentrated level) */}
        {topLevelAnnotation && (
          <span
            data-testid="factor-chip-defect-rate-top-level"
            className="text-[11px] font-medium text-content-secondary"
          >
            {topLevelAnnotation}
          </span>
        )}
        {/* Row 3: concentration bar + readout (rate dispersion — NOT % of variation) */}
        <span className="flex items-center gap-2">
          <span
            data-testid="factor-chip-bar"
            className="h-1 rounded-full bg-status-warning"
            style={{ width: `${defectRateBarWidthPx(chip.concentration)}px` }}
          />
          <span
            data-testid="factor-chip-defect-rate-concentration"
            className="text-[11px] text-content-secondary"
          >
            {tf('factorStrip.defectRate.chip.concentration', {
              value: formatStat(chip.concentration, 3),
            })}
          </span>
        </span>
      </div>
    );
  };

  // Defect-rate disclosure: same top-3 + significant rule
  const { primaryDefectRateChips, collapsedDefectRateChips } = useMemo(() => {
    const chips = defectRateChips ?? [];
    const primary: DefectRateChip[] = [];
    const collapsed: DefectRateChip[] = [];
    chips.forEach((chip, idx) => {
      if (idx < TOP_N_EXPANDED || chip.isSignificant) primary.push(chip);
      else collapsed.push(chip);
    });
    return { primaryDefectRateChips: primary, collapsedDefectRateChips: collapsed };
  }, [defectRateChips]);

  const visibleDefectRateChips = expanded ? (defectRateChips ?? []) : primaryDefectRateChips;
  const hiddenDefectRateCount = collapsedDefectRateChips.length;

  const title =
    variant === 'defect-rate-share'
      ? t('factorStrip.title.defectRate')
      : variant === 'membership'
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
        {variant === 'defect-rate-share' ? (
          <span className="text-[11px] text-content-muted">
            {t('factorStrip.defectRate.subtitle')}
          </span>
        ) : variant === 'membership' ? (
          <span className="text-[11px] text-content-muted">
            {t('factorStrip.membership.subtitle')}
          </span>
        ) : (
          <>
            <span className="text-[11px] text-content-muted">
              {isV2 ? t('factorStrip.inModel.subtitle') : t('factorStrip.subtitle')}
            </span>
            {!isV2 && (
              <span className="basis-full text-[11px] text-content-muted">
                {t('factorStrip.bridge')}
              </span>
            )}
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
      {variant === 'defect-rate-share' ? (
        <div className="flex flex-wrap items-stretch gap-1.5">
          {visibleDefectRateChips.map((chip, idx) => renderDefectRateChip(chip, idx))}

          {!expanded && hiddenDefectRateCount > 0 && (
            <button
              type="button"
              data-testid="factor-strip-also-screened"
              onClick={() => setExpanded(true)}
              className="flex items-center rounded-lg border border-dashed border-edge px-2.5 py-1.5 text-[11px] font-medium text-content-muted hover:bg-surface-secondary transition-colors"
            >
              {tf('factorStrip.alsoScreened', { n: hiddenDefectRateCount })}
            </button>
          )}
        </div>
      ) : variant === 'membership' ? (
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

          {effectiveResidualPct !== null && (
            <div
              data-testid="factor-chip-residual"
              title={t('factorStrip.residual.hover')}
              className="flex flex-col justify-center px-2.5 py-1.5 text-[11px] text-content-muted"
            >
              {isV2
                ? tf('factorStrip.inModel.residual', { n: String(effectiveResidualPct) })
                : tf('factorStrip.residual', { n: formatStat(effectiveResidualPct, 0) })}
            </div>
          )}

          {/* ER-6: ⚡ interaction chip — only on magnitude variant with modelStats.interaction */}
          {isV2 && modelStats?.interaction && (
            <div
              data-testid="factor-chip-interaction"
              role="button"
              tabIndex={0}
              onClick={() => onInteractionSelect?.(modelStats.interaction!)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInteractionSelect?.(modelStats.interaction!);
                }
              }}
              className="flex flex-col gap-1 rounded-lg border border-dashed border-status-info px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-surface-secondary"
            >
              <span className="text-[11px] font-medium text-content-secondary">
                {tf('factorStrip.interaction.chip', {
                  factorA: modelStats.interaction.factorA,
                  factorB: modelStats.interaction.factorB,
                  deltaR2Pct: formatStat(modelStats.interaction.deltaR2 * 100, 1),
                })}
              </span>
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
