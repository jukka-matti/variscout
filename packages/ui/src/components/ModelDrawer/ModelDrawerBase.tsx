/**
 * ModelDrawerBase — "The model behind the ranking" (ER-3, spec §6 / D5).
 *
 * A single, transient, right-anchored drawer that renders the live engine's
 * model for the shown subset: model summary · reference-coded equation · full
 * coefficient table (intercept row first) · ANOVA (Type III) · best-subsets
 * ladder · predict widget. Opened from the Explore strip's ANOVA link AND from
 * the Analyze tab's Model toggle. Props-based, no store reads.
 *
 * ── SAME-FIT COHERENCE RULE ("one fit, one story") ──
 * The drawer runs `computeBestSubsets` itself (memoised) and selects the SHOWN
 * subset the same way the old ModelBuilderBand did (`selectVitalFew` over a
 * `buildSubsetIndex`). Then:
 *   • If the shown subset HAS `predictors` (OLS path — incl. interaction-augmented
 *     winners), the coefficient table, S, R², R²adj, equation, ANOVA, and predict
 *     widget ALL read from that one `BestSubsetResult`. (ANOVA per-term SS comes
 *     from its `typeIIIResults` when present.)
 *   • If `predictors` is absent (the all-categorical ANOVA path), we call
 *     `fitSubsetGLM(rows, outcome, shown.factors)` ONCE and use ITS numbers for
 *     ALL of summary / equation / coefficient table / ANOVA / predict.
 * Never mix numbers from two fits in one drawer view.
 *
 * After the run we fire `onModelStats({ kept, deltaR2 })` (the DOI feed that the
 * Wall consumes for glyph contribution bars + the domain-weighted DOI).
 *
 * P5: every "coefficients are contrasts, not causes" caption is REQUIRED.
 * No auto-select: predict selects default to each factor's REFERENCE level.
 * All copy via `modelDrawer.*` MessageCatalog keys; numbers via `formatStatistic`.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BestSubsetResult, DataRow } from '@variscout/core';
import { formatStatistic, formatMessage } from '@variscout/core/i18n';
import {
  computeBestSubsets,
  buildSubsetIndex,
  selectVitalFew,
  perFactorDeltaR2,
  perFactorPValues,
  predictFromUnifiedModel,
  fitSubsetGLM,
  INTERCEPT_TERM,
  computeTypeIIISS,
} from '@variscout/core/stats';
import type {
  PredictorInfo,
  TypeIIIResult,
  FactorSpec,
  InteractionScreenResult,
} from '@variscout/core/stats';
import { useWallLocale } from '../AnalyzeWall/hooks/useWallLocale';

/**
 * Snapshot of the model the analyst chose to capture (capture-as-Finding).
 *
 * Canonical home for the type (MOVED here from ModelBuilderBand in ER-3 — the
 * band re-exports it untouched until Task 4 deletes the band). The app creates
 * the Finding + attaches this to its projection's modelContext.
 */
export interface CapturedModelSnapshot {
  /** The kept factors, in the order shown. */
  factors: string[];
  /** Adjusted R² of the kept-factor subset. */
  rSquaredAdj: number;
  /** Per-factor p for the kept factors. */
  perFactorP: Record<string, number>;
  /** Human-readable scope label ('All data' or the drill condition). */
  scopeLabel: string;
  /** The single most-explanatory kept factor (for linkedFactor on the Finding). */
  topFactor: string | null;
}

/**
 * The winning interaction term to surface on the Explore strip (ER-6).
 * Pattern is geometric only — ordinal or disordinal — never role-based.
 */
export interface ModelInteraction {
  /** First factor in the interaction pair (alphabetical order). */
  factorA: string;
  /** Second factor in the interaction pair (alphabetical order). */
  factorB: string;
  /** Semipartial ΔR²adj from adding this interaction term. */
  deltaR2: number;
  /**
   * Geometric classification of the interaction pattern.
   * Derived from classifyInteractionPattern() — NEVER hardcoded.
   * 'ordinal' = lines differ in slope but do not cross.
   * 'disordinal' = lines cross (pattern reverses).
   */
  pattern: 'ordinal' | 'disordinal';
  /**
   * The level of the categorical source factor in the winning interaction term
   * with the largest |coefficient|. Used as the focal level for the paired
   * comparison on the Explore strip.
   * Null for cont×cont interactions (no discrete level exists).
   */
  focalLevel: string | null;
}

/** The live model stats handed up for the DOI feed (glyph bars + domain-weighted DOI). */
export interface ModelDrawerStats {
  /** The kept (shown) factor set. */
  kept: string[];
  /** Per-factor association strength (semipartial ΔR²). */
  deltaR2: Map<string, number>;
  /**
   * Adjusted R² of the currently shown model (ER-6).
   * Used by the Explore strip to compute residual = 1 − R²adj.
   * Null when no model is available.
   */
  rSquaredAdj: number | null;
  /**
   * The single winning interaction term from Pass-2 best subsets (ER-6).
   * Null when there is no significant interaction (no Pass-2 candidates or
   * none reached significance).
   */
  interaction: ModelInteraction | null;
}

export interface ModelDrawerBaseProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Close handler (× / Escape). */
  onClose: () => void;
  /** Rows in the active scope (drilled subset, or full dataset). */
  rows: DataRow[];
  /** Outcome Y column. */
  outcome: string | null;
  /** Display label for the outcome (defaults to the raw column name). */
  outcomeLabel?: string;
  /** Candidate factor columns. */
  candidateFactors: string[];
  /** Scope label for the header + the captured Finding. */
  scopeLabel: string;
  /**
   * Factors that are CONSTANT in the active scope (drilled on) — chipped and
   * excluded from the model. Empty for the global scope.
   */
  constantFactors?: string[];
  /**
   * Capture-as-Finding affordance. When provided, a footer "Capture model"
   * button renders; firing it calls back with the snapshot. Omit to hide.
   */
  onCaptureModel?: (snapshot: CapturedModelSnapshot) => void;
  /**
   * Report the CURRENT model's kept set + per-factor ΔR² up to the Wall (DOI
   * feed). Fires after the engine run; `null` when no model. Pass a STABLE
   * callback (e.g. a useState setter) — an inline arrow re-fires every render.
   */
  onModelStats?: (stats: ModelDrawerStats | null) => void;
}

/** A coefficient + a precomputed "is this row significant" flag (isSignificant, not |t|>2). */
interface CoefRow {
  term: string;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
  isIntercept: boolean;
  /** SE/t/p unavailable for this row (OLS-engine intercept — the subset doesn't expose them). */
  diagnosticsUnavailable?: boolean;
}

/** One row of the best-subsets ladder. */
interface LadderRow {
  factors: string[];
  termCount: number;
  rSquared: number;
  rSquaredAdj: number;
  isShown: boolean;
}

/** One per-term ANOVA row. */
interface AnovaRow {
  source: string;
  df: number;
  ss: number;
  f: number;
  p: number;
}

/** Distinct observed levels for a categorical factor (reference first), in display order. */
function levelsOf(rows: DataRow[], factor: string, referenceLevel?: string): string[] {
  const seen = new Set<string>();
  for (const r of rows) {
    const v = r[factor];
    if (v !== undefined && v !== null && v !== '') seen.add(String(v));
  }
  const all = [...seen].sort();
  if (referenceLevel && all.includes(referenceLevel)) {
    return [referenceLevel, ...all.filter(l => l !== referenceLevel)];
  }
  return all;
}

export const ModelDrawerBase: React.FC<ModelDrawerBaseProps> = ({
  open,
  onClose,
  rows,
  outcome,
  outcomeLabel,
  candidateFactors,
  scopeLabel,
  constantFactors = [],
  onCaptureModel,
  onModelStats,
}) => {
  const locale = useWallLocale();
  const asideRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Eligible factors = candidates minus the scope-constant ones (mirrors the band).
  const eligibleFactors = useMemo(
    () => candidateFactors.filter(f => !constantFactors.includes(f)),
    [candidateFactors, constantFactors]
  );

  // ── Engine run (memoised; the band's pattern). Computed regardless of `open`
  //    so the effect that fires onModelStats has a stable dependency, but the
  //    component returns null when closed so nothing renders. ──
  const engine = useMemo(() => {
    if (!outcome || eligibleFactors.length === 0 || rows.length === 0) return null;
    const data = [...rows];
    const result = computeBestSubsets(data, outcome, [...eligibleFactors]);
    if (!result || result.subsets.length === 0) return null;
    const index = buildSubsetIndex(result);
    const vitalFew = selectVitalFew(result, index, { data, outcome });
    if (!vitalFew) return null;
    return { result, index, vitalFew };
  }, [rows, outcome, eligibleFactors]);

  const shown: BestSubsetResult | null = engine?.vitalFew.subset ?? null;
  const shownFactors = useMemo(() => engine?.vitalFew.factors ?? [], [engine]);

  // The SAME-FIT dispatch: OLS engine subset (has predictors) → read it; else
  // re-fit the shown subset ONCE via fitSubsetGLM (the all-categorical path).
  const glm = useMemo(() => {
    if (!engine || !shown || !outcome) return null;
    if (shown.predictors && shown.predictors.length > 0) return null; // OLS path uses `shown`
    return fitSubsetGLM([...rows], outcome, [...shownFactors], {
      factorTypes: engine.result.factorTypes,
    });
  }, [engine, shown, outcome, rows, shownFactors]);

  // ── Per-factor ΔR² (DOI feed) ──
  const deltaR2 = useMemo<Map<string, number>>(() => {
    if (!engine) return new Map();
    return perFactorDeltaR2(shownFactors, eligibleFactors, engine.index);
  }, [engine, shownFactors, eligibleFactors]);

  // ── ER-6: rSquaredAdj from the SAME fit in play ──
  const rSquaredAdj = useMemo<number | null>(() => {
    if (glm) return glm.rSquaredAdj;
    if (shown) return shown.rSquaredAdj;
    return null;
  }, [glm, shown]);

  // ── ER-6: Winning interaction from the drawer's existing Pass-2 results ──
  // Consumes the drawer's already-computed `shown.interactionScreenResults` — no new fit.
  // Picks the most significant (largest deltaRSquaredAdj) significant result.
  // focalLevel = level from the interaction predictor with the largest |coefficient|.
  // For cont×cont interactions there is no discrete categorical level → focalLevel = null.
  const interaction = useMemo<ModelInteraction | null>(() => {
    if (!shown?.interactionScreenResults || !shown.hasInteractionTerms) return null;
    const significant = shown.interactionScreenResults.filter(r => r.isSignificant);
    if (significant.length === 0) return null;
    // Pick the most significant interaction by largest ΔR²adj.
    const winner: InteractionScreenResult = [...significant].sort(
      (a, b) => b.deltaRSquaredAdj - a.deltaRSquaredAdj
    )[0];
    const [factorA, factorB] = winner.factors;

    // Derive focalLevel from the interaction predictors.
    // extractPredictors() now attaches the `level` field to each interaction predictor
    // for cont×cat and cat×cat interactions (one level per non-reference column).
    // For cont×cont there is no discrete level → focalLevel = null.
    let focalLevel: string | null = null;
    if (shown.predictors && shown.predictors.length > 0) {
      const interactionKey = `${factorA}×${factorB}`;
      const interactionPreds = shown.predictors.filter(
        p => p.factorName === interactionKey && p.type === 'interaction'
      );
      if (interactionPreds.length > 0) {
        const largest = [...interactionPreds].sort(
          (a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)
        )[0];
        // Use the `level` field set by extractPredictors() for cont×cat / cat×cat.
        // Remains undefined (→ null) for cont×cont.
        focalLevel = largest.level ?? null;
      }
    }

    return {
      factorA,
      factorB,
      deltaR2: winner.deltaRSquaredAdj,
      pattern: winner.pattern,
      focalLevel,
    };
  }, [shown]);

  // Lift the live model stats to the Wall (glyph bars + DOI weights).
  useEffect(() => {
    if (!onModelStats) return;
    onModelStats(engine ? { kept: shownFactors, deltaR2, rSquaredAdj, interaction } : null);
  }, [onModelStats, engine, shownFactors, deltaR2, rSquaredAdj, interaction]);

  // ── Escape closes (document-level while open — the EvidenceMapContextMenu convention) ──
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ── Focus moves into the drawer on open (a11y) ──
  useEffect(() => {
    if (!open) return;
    // Prefer the close button; fall back to the aside.
    (closeRef.current ?? asideRef.current)?.focus();
  }, [open]);

  // ── Coefficient table (one fit, one story) ──
  const coefRows = useMemo<CoefRow[]>(() => {
    const predictors: PredictorInfo[] | undefined = glm
      ? glm.predictors
      : shown?.predictors
        ? prependEngineIntercept(shown)
        : undefined;
    if (!predictors) return [];
    // OLS-engine path: the synthesized intercept row carries no SE/t/p (the engine
    // subset doesn't expose them) — render its diagnostics as em-dashes, never as 0.
    const olsInterceptHasNoDiagnostics = !glm;
    return predictors.map(p => {
      const isIntercept = p.factorName === INTERCEPT_TERM;
      return {
        term: isIntercept ? INTERCEPT_TERM : p.name,
        coefficient: p.coefficient,
        standardError: p.standardError,
        tStatistic: p.tStatistic,
        pValue: p.pValue,
        isSignificant: p.isSignificant,
        isIntercept,
        diagnosticsUnavailable: isIntercept && olsInterceptHasNoDiagnostics,
      };
    });
  }, [glm, shown, rows]);

  // Total SS for the OLS path (BestSubsetsResult.ssTotal) — computed over the
  // same listwise-deleted population as the fit. Falls back to a direct
  // Σ(y − ȳ)² pass over ALL finite-y rows only when the engine result is
  // unavailable (defensive fallback, should not occur on live data).
  //
  // NOTE: the GLM path uses glm.sst (fitSubsetGLM exposes the solver's own sst,
  // same listwise-deleted population as glm.sse and glm.n), NOT this memo —
  // ensuring Error and Total share the same population even when factors have
  // missing values.
  const sstFallback = useMemo(() => {
    if (!outcome) return 0;
    let sum = 0;
    let count = 0;
    for (const r of rows) {
      const v = Number(r[outcome]);
      if (Number.isFinite(v)) {
        sum += v;
        count++;
      }
    }
    if (count === 0) return 0;
    const mean = sum / count;
    let acc = 0;
    for (const r of rows) {
      const v = Number(r[outcome]);
      if (Number.isFinite(v)) acc += (v - mean) ** 2;
    }
    return acc;
  }, [rows, outcome]);

  // The fit's scalar summary (S / R² / R²adj / n), read from the ONE fit in play.
  const summary = useMemo(() => {
    if (glm) {
      // model df = parameters excluding intercept = predictor rows minus the intercept row.
      const modelDf = glm.predictors.filter(p => p.factorName !== INTERCEPT_TERM).length;
      return {
        s: glm.rmse,
        rSquared: glm.rSquared,
        rSquaredAdj: glm.rSquaredAdj,
        n: glm.n,
        sse: glm.sse,
        // Use the solver's own sst — same listwise-deleted population as sse and n.
        // This ensures Error and Total share one population even when factors have
        // missing values (the component-level sstFallback covers ALL finite-y rows).
        sst: glm.sst,
        modelDf,
        intercept: glm.intercept,
        referenceLevels: glm.referenceLevels,
        typeIII: glm.typeIII,
      };
    }
    if (shown) {
      const n = engine?.result.n ?? rows.length;
      const sstEngine = engine?.result.ssTotal ?? sstFallback;
      // BestSubsetResult has no `sse`; derive honestly from (1 − R²)·SST (same fit).
      const sse = (1 - shown.rSquared) * sstEngine;

      // typeIII for the shown subset: the engine computes it for subsets[0] only
      // (main-effects AND interaction-augmented variants). Non-winner OLS subsets
      // lack it → compute on demand here.
      //
      // Safety note: augmentation only modifies subsets[0], so a shown subset that
      // is NOT subsets[0] is guaranteed to be a plain main-effects model. The
      // computeTypeIIISS call therefore always decomposes a main-effects design —
      // no interaction terms sneak in on this fallback path.
      let typeIII = shown.typeIIIResults;
      if (!typeIII) {
        const fallbackSpecs: FactorSpec[] = shownFactors.map(f => ({
          name: f,
          type: (engine?.result.factorTypes?.get(f) ?? 'categorical') as
            | 'continuous'
            | 'categorical',
          includeQuadratic: false,
        }));
        typeIII = computeTypeIIISS([...rows], outcome!, fallbackSpecs) ?? undefined;
      }

      return {
        s: shown.rmse ?? Math.sqrt(sse / Math.max(1, n - shown.dfModel - 1)),
        rSquared: shown.rSquared,
        rSquaredAdj: shown.rSquaredAdj,
        n,
        sse,
        sst: sstEngine,
        modelDf: shown.dfModel,
        intercept: shown.intercept ?? 0,
        referenceLevels: shown.referenceLevels ?? new Map<string, string>(),
        typeIII: typeIII ?? new Map<string, TypeIIIResult>(),
      };
    }
    return null;
  }, [glm, engine, rows, sstFallback]);

  // ── Equation (largest |coef| first; reference-coded) ──
  const equation = useMemo(() => {
    if (!summary) return null;
    const nonIntercept = coefRows.filter(r => !r.isIntercept);
    const sorted = [...nonIntercept].sort(
      (a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)
    );
    const head = sorted.slice(0, 4);
    const yLabel = outcomeLabel ?? outcome ?? 'Y';
    const terms = head.map(r => {
      const sign = r.coefficient >= 0 ? '+' : '−';
      return { sign, mag: formatStatistic(Math.abs(r.coefficient), locale, 1), term: r.term };
    });
    return { yLabel, beta0: formatStatistic(summary.intercept, locale, 1), terms };
  }, [summary, coefRows, outcomeLabel, outcome, locale]);

  // ── ANOVA table ──
  // Iterate the typeIII MAP's own keys — not shownFactors — so that interaction
  // terms with compound keys (e.g. "A×B") are included. The engine stores the
  // interaction term under its spec name (e.g. "X×G"), and shownFactors only
  // carries the main-effect factor names.
  const anovaRows = useMemo<AnovaRow[]>(() => {
    if (!summary) return [];
    const out: AnovaRow[] = [];
    for (const [source, t] of summary.typeIII) {
      out.push({ source, df: t.dfEffect, ss: t.ssTypeIII, f: t.fStat, p: t.pValue });
    }
    return out;
  }, [summary]);

  // ── Best-subsets ladder (already R²adj-desc) ──
  const ladderRows = useMemo<LadderRow[]>(() => {
    if (!engine) return [];
    const shownKey = [...shownFactors].sort().join('\x00');
    return engine.result.subsets.map(s => ({
      factors: s.factors,
      termCount: s.dfModel,
      rSquared: s.rSquared,
      rSquaredAdj: s.rSquaredAdj,
      isShown: [...s.factors].sort().join('\x00') === shownKey,
    }));
  }, [engine, shownFactors]);

  // ── Predict widget state: one selected level per factor, defaulting to reference. ──
  const factorLevels = useMemo<Map<string, string[]>>(() => {
    const m = new Map<string, string[]>();
    if (!summary) return m;
    for (const f of shownFactors) {
      m.set(f, levelsOf(rows, f, summary.referenceLevels.get(f)));
    }
    return m;
  }, [summary, shownFactors, rows]);

  const referenceSelection = useMemo<Record<string, string>>(() => {
    const sel: Record<string, string> = {};
    for (const f of shownFactors) {
      const lv = factorLevels.get(f);
      // Default to the reference level (first entry — NEVER a "best").
      if (lv && lv.length > 0) sel[f] = lv[0];
    }
    return sel;
  }, [shownFactors, factorLevels]);

  const [selection, setSelection] = useState<Record<string, string>>(referenceSelection);
  // Re-seed to reference levels whenever the model changes (render-phase reset).
  const selectionKey = shownFactors.join('|') + '#' + (summary?.n ?? 0);
  const [lastSelectionKey, setLastSelectionKey] = useState('');
  if (selectionKey !== lastSelectionKey) {
    setLastSelectionKey(selectionKey);
    setSelection(referenceSelection);
  }

  // ── Predict result for the current selection (fitted ± S vs observed cell mean) ──
  const prediction = useMemo(() => {
    if (!summary) return null;
    // Fitted: engine-subset path → predictFromUnifiedModel; fitSubsetGLM path →
    // intercept + matched dummy coefficients (same fit).
    let fitted: number | null = null;
    if (glm) {
      fitted = summary.intercept;
      for (const p of glm.predictors) {
        if (p.factorName === INTERCEPT_TERM) continue;
        if (p.type === 'categorical') {
          if (String(selection[p.factorName]) === p.level) fitted += p.coefficient;
        }
      }
    } else if (shown) {
      const values: Record<string, string | number> = {};
      for (const f of shownFactors) {
        const raw = selection[f];
        const num = Number(raw);
        values[f] = raw !== undefined && raw !== '' && !Number.isNaN(num) ? num : raw;
      }
      fitted = predictFromUnifiedModel(shown, values);
    }

    // Observed cell mean from the engine subset's cellMeans (keyed levels.join('\x00')).
    const cellMeans = shown?.cellMeans;
    const key = shownFactors.map(f => selection[f]).join('\x00');
    const cell = cellMeans?.get(key);

    return { fitted, observedMean: cell?.mean, observedN: cell?.n };
  }, [summary, glm, shown, shownFactors, selection]);

  // ── Capture-model snapshot (same shape the band produced) ──
  const handleCapture = useCallback(() => {
    if (!onCaptureModel || !shown || !engine || shownFactors.length === 0 || !outcome) return;
    const keptP = perFactorPValues(shown, engine.index, [...rows], outcome);
    const perFactorP: Record<string, number> = {};
    for (const f of shownFactors) perFactorP[f] = keptP.get(f) ?? 1;
    const topFactor =
      shownFactors.length > 0
        ? [...shownFactors].sort((a, b) => (deltaR2.get(b) ?? 0) - (deltaR2.get(a) ?? 0))[0]
        : null;
    onCaptureModel({
      factors: [...shownFactors],
      rSquaredAdj: shown.rSquaredAdj,
      perFactorP,
      scopeLabel,
      topFactor,
    });
  }, [onCaptureModel, shown, engine, shownFactors, outcome, rows, deltaR2, scopeLabel]);

  if (!open) return null;

  const yLabel = outcomeLabel ?? outcome ?? 'Y';
  const termList = shownFactors.join(' + ') || '—';
  const subtitle = formatMessage(locale, 'modelDrawer.subtitle', {
    outcome: yLabel,
    terms: termList,
    scope: scopeLabel,
  });
  const referenceList = summary
    ? [...summary.referenceLevels.entries()].map(([f, lv]) => `${f} = ${lv}`).join(' · ')
    : '';

  return (
    <aside
      ref={asideRef}
      tabIndex={-1}
      data-testid="model-drawer"
      aria-label={formatMessage(locale, 'modelDrawer.title')}
      className="absolute right-3 top-16 z-30 flex max-h-[calc(100%-5rem)] w-[min(560px,calc(100%-1.5rem))] flex-col overflow-hidden rounded border border-edge bg-surface shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start gap-2 border-b border-edge px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-content">
            {formatMessage(locale, 'modelDrawer.title')}
          </h2>
          <p data-testid="model-drawer-subtitle" className="mt-0.5 text-[11px] text-content-muted">
            {subtitle}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          data-testid="model-drawer-close"
          data-close="modelDrawer"
          onClick={onClose}
          aria-label={formatMessage(locale, 'modelDrawer.closeAria')}
          className="rounded px-1 text-base leading-none text-content-muted hover:bg-surface-secondary"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3 text-[11px] text-content">
        {!summary ? (
          <div data-testid="model-drawer-empty" className="text-content-muted">
            {formatMessage(locale, 'modelDrawer.empty')}
          </div>
        ) : (
          <>
            {/* 1. Model summary */}
            <section data-testid="model-drawer-summary">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                {formatMessage(locale, 'modelDrawer.summaryHeading')}
              </h3>
              <table className="w-full border-collapse font-mono">
                <thead>
                  <tr className="text-right text-content-secondary">
                    <th className="border-b border-edge px-2 py-0.5 text-left font-semibold">
                      {formatMessage(locale, 'modelDrawer.summaryS')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.summaryR2')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.summaryR2adj')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.summaryN')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-right">
                    <td data-testid="model-drawer-S" className="px-2 py-0.5 text-left">
                      {formatStatistic(summary.s, locale, 2)}
                    </td>
                    <td className="px-2 py-0.5">
                      {formatStatistic(summary.rSquared * 100, locale, 1)}%
                    </td>
                    <td className="px-2 py-0.5">
                      {formatStatistic(summary.rSquaredAdj * 100, locale, 1)}%
                    </td>
                    <td className="px-2 py-0.5">{summary.n}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1 text-[10px] text-content-muted">
                {formatMessage(locale, 'modelDrawer.summaryCaption')}
              </p>
            </section>

            {/* 2. Equation */}
            {equation && (
              <section data-testid="model-drawer-equation">
                <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                  {formatMessage(locale, 'modelDrawer.equationHeading')}
                </h3>
                <div className="rounded bg-surface-secondary px-3 py-2 font-mono text-[11px] leading-relaxed">
                  {equation.yLabel} = <span className="text-blue-600">{equation.beta0}</span>
                  {equation.terms.map((t, i) => (
                    <React.Fragment key={i}>
                      {' '}
                      {t.sign} <span className="text-blue-600">{t.mag}</span>·[{t.term}]
                    </React.Fragment>
                  ))}
                  {' + … + ε'}
                </div>
                <p className="mt-1 text-[10px] text-content-muted">
                  {formatMessage(locale, 'modelDrawer.equationCaption', {
                    references: referenceList || '—',
                  })}
                </p>
              </section>
            )}

            {/* 3. Coefficients */}
            <section data-testid="model-drawer-coefficients">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                {formatMessage(locale, 'modelDrawer.coefficientsHeading')}
              </h3>
              <table className="w-full border-collapse font-mono">
                <thead>
                  <tr className="text-right text-content-secondary">
                    <th className="border-b border-edge px-2 py-0.5 text-left font-semibold">
                      {formatMessage(locale, 'modelDrawer.coefTerm')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.coefCoef')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.coefSE')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.coefT')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.coefP')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coefRows.map(r => (
                    <tr
                      key={r.term}
                      data-testid={`model-drawer-coef-row-${r.term}`}
                      data-coef-significant={r.isSignificant ? 'true' : 'false'}
                      className={`text-right ${r.isSignificant ? 'font-semibold' : ''}`}
                    >
                      <td className="px-2 py-0.5 text-left">{r.term}</td>
                      <td className="px-2 py-0.5">{formatStatistic(r.coefficient, locale, 1)}</td>
                      <td className="px-2 py-0.5">
                        {r.diagnosticsUnavailable
                          ? '—'
                          : formatStatistic(r.standardError, locale, 1)}
                      </td>
                      <td className="px-2 py-0.5">
                        {r.diagnosticsUnavailable ? '—' : formatStatistic(r.tStatistic, locale, 1)}
                      </td>
                      <td className="px-2 py-0.5">
                        {r.diagnosticsUnavailable ? '—' : formatStatistic(r.pValue, locale, 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 4. ANOVA */}
            <section data-testid="model-drawer-anova">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                {formatMessage(locale, 'modelDrawer.anovaHeading')}
              </h3>
              <table className="w-full border-collapse font-mono">
                <thead>
                  <tr className="text-right text-content-secondary">
                    <th className="border-b border-edge px-2 py-0.5 text-left font-semibold">
                      {formatMessage(locale, 'modelDrawer.anovaSource')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.anovaDF')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.anovaSS')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.anovaF')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.anovaP')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {anovaRows.map(r => (
                    <tr
                      key={r.source}
                      data-testid={`model-drawer-anova-row-${r.source}`}
                      className="text-right"
                    >
                      <td className="px-2 py-0.5 text-left">{r.source}</td>
                      <td className="px-2 py-0.5">{r.df}</td>
                      <td className="px-2 py-0.5">{formatStatistic(r.ss, locale, 0)}</td>
                      <td className="px-2 py-0.5">{formatStatistic(r.f, locale, 1)}</td>
                      <td className="px-2 py-0.5">{formatStatistic(r.p, locale, 3)}</td>
                    </tr>
                  ))}
                  {/* Error + Total — derived honestly from the SAME fit.
                      Error df = n − (modelDf + 1 intercept); Error SS = SSE.
                      Total df = n − 1; Total SS = Σ(y − ȳ)² (computed directly).
                      Type III SS are partial (not additive) so we never reconstruct
                      Total from them. */}
                  <tr
                    data-testid="model-drawer-anova-row-Error"
                    className="text-right text-content-muted"
                  >
                    <td className="px-2 py-0.5 text-left">
                      {formatMessage(locale, 'modelDrawer.anovaError')}
                    </td>
                    <td className="px-2 py-0.5">{Math.max(0, summary.n - summary.modelDf - 1)}</td>
                    <td className="px-2 py-0.5">{formatStatistic(summary.sse, locale, 0)}</td>
                    <td className="px-2 py-0.5" />
                    <td className="px-2 py-0.5" />
                  </tr>
                  <tr
                    data-testid="model-drawer-anova-row-Total"
                    className="text-right text-content-muted"
                  >
                    <td className="px-2 py-0.5 text-left">
                      {formatMessage(locale, 'modelDrawer.anovaTotal')}
                    </td>
                    <td className="px-2 py-0.5">{summary.n - 1}</td>
                    <td className="px-2 py-0.5">{formatStatistic(summary.sst, locale, 0)}</td>
                    <td className="px-2 py-0.5" />
                    <td className="px-2 py-0.5" />
                  </tr>
                </tbody>
              </table>
              <p
                data-testid="model-drawer-anova-caption"
                className="mt-1 text-[10px] text-content-muted"
              >
                {formatMessage(locale, 'modelDrawer.anovaCaption')}
              </p>
            </section>

            {/* 5. Best-subsets ladder */}
            <section data-testid="model-drawer-ladder">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                {formatMessage(locale, 'modelDrawer.ladderHeading')}
              </h3>
              <table className="w-full border-collapse font-mono">
                <thead>
                  <tr className="text-right text-content-secondary">
                    <th className="border-b border-edge px-2 py-0.5 text-left font-semibold">
                      {formatMessage(locale, 'modelDrawer.ladderModel')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.ladderTerms')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.ladderR2')}
                    </th>
                    <th className="border-b border-edge px-2 py-0.5 font-semibold">
                      {formatMessage(locale, 'modelDrawer.ladderR2adj')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ladderRows.map((r, i) => (
                    <tr
                      key={i}
                      data-testid={r.isShown ? 'model-drawer-ladder-shown' : undefined}
                      className={`text-right ${r.isShown ? 'bg-blue-50 font-semibold' : ''}`}
                    >
                      <td className="px-2 py-0.5 text-left">
                        {r.factors.join(' + ')}
                        {r.isShown ? ` ${formatMessage(locale, 'modelDrawer.ladderShown')}` : ''}
                      </td>
                      <td className="px-2 py-0.5">{r.termCount}</td>
                      <td className="px-2 py-0.5">
                        {formatStatistic(r.rSquared * 100, locale, 1)}%
                      </td>
                      <td className="px-2 py-0.5">
                        {formatStatistic(r.rSquaredAdj * 100, locale, 1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-[10px] text-content-muted">
                {formatMessage(locale, 'modelDrawer.ladderNote')}
              </p>
            </section>

            {/* 6. Predict widget */}
            <section data-testid="model-drawer-predict">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                {formatMessage(locale, 'modelDrawer.predictHeading')}
              </h3>
              <div className="flex flex-wrap items-center gap-2 rounded bg-surface-secondary px-3 py-2">
                {shownFactors.map(f => {
                  const lv = factorLevels.get(f) ?? [];
                  return (
                    <select
                      key={f}
                      data-testid={`model-drawer-predict-select-${f}`}
                      aria-label={f}
                      value={selection[f] ?? ''}
                      onChange={e => setSelection(s => ({ ...s, [f]: e.target.value }))}
                      className="rounded border border-edge bg-surface px-2 py-1 text-[11px]"
                    >
                      {lv.map(l => (
                        <option key={l} value={l}>
                          {f}={l}
                        </option>
                      ))}
                    </select>
                  );
                })}
                <span data-testid="model-drawer-predict-result" className="font-mono text-[11px]">
                  {prediction && prediction.fitted !== null
                    ? prediction.observedMean !== undefined
                      ? formatMessage(locale, 'modelDrawer.predictResult', {
                          fitted: formatStatistic(prediction.fitted, locale, 1),
                          s: formatStatistic(summary.s, locale, 1),
                          observed: formatStatistic(prediction.observedMean, locale, 1),
                          n: prediction.observedN ?? 0,
                        })
                      : formatMessage(locale, 'modelDrawer.predictNoCell', {
                          fitted: formatStatistic(prediction.fitted, locale, 1),
                          s: formatStatistic(summary.s, locale, 1),
                        })
                    : '—'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-content-muted">
                {formatMessage(locale, 'modelDrawer.predictCaption')}
              </p>
            </section>

            {/* Constant-in-scope chips (excluded from the model). */}
            {constantFactors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {constantFactors.map(f => (
                  <span
                    key={f}
                    data-testid={`model-drawer-constant-${f}`}
                    className="rounded bg-surface-secondary px-2 py-0.5 text-[10px] italic text-content-muted"
                  >
                    {f} · {formatMessage(locale, 'modelDrawer.constantInScope')}
                  </span>
                ))}
              </div>
            )}

            {/* Rank-deficiency warning only fires on the GLM path (fitSubsetGLM);
                the OLS engine doesn't surface warnings — known structural gap. */}
            {summary.typeIII.size === 0 && glm?.warnings && glm.warnings.length > 0 && (
              <p className="text-[10px] text-amber-700">
                {formatMessage(locale, 'modelDrawer.warningRankDeficient')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer — capture only when onCaptureModel present (Analyze surface). */}
      {onCaptureModel && summary && (
        <div className="border-t border-edge px-4 py-2">
          <button
            type="button"
            data-testid="model-drawer-capture"
            onClick={handleCapture}
            className="w-full rounded border border-edge px-3 py-1.5 text-[12px] font-semibold text-content hover:bg-surface-secondary"
          >
            {formatMessage(locale, 'modelDrawer.captureModel')}
          </button>
        </div>
      )}
    </aside>
  );
};

/**
 * The OLS engine subset's `predictors` do NOT include the intercept row (its
 * `extractPredictors` skips column 0). Synthesise the intercept row here so the
 * coefficient table reads from the SAME fit (the engine subset) — same numbers,
 * no second fit. The intercept's SE/t/p are not exposed on the engine subset, so
 * the coefficient row renders em-dashes for SE/t/p (flagged `diagnosticsUnavailable`)
 * rather than fake zeros or a number from a different fit. (The all-categorical
 * path uses fitSubsetGLM, which DOES expose the intercept's certified SE/t/p.)
 */
function prependEngineIntercept(shown: BestSubsetResult): PredictorInfo[] {
  const interceptRow: PredictorInfo = {
    name: INTERCEPT_TERM,
    factorName: INTERCEPT_TERM,
    type: 'continuous',
    coefficient: shown.intercept ?? 0,
    standardError: 0,
    tStatistic: 0,
    pValue: 1,
    isSignificant: false,
  };
  return [interceptRow, ...(shown.predictors ?? [])];
}
