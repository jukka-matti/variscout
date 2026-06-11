/**
 * ModelBuilderBand — the scope-level "vital-few model-builder" (Factors &
 * Evaluation Increment 1, spec §3).
 *
 * Mounted on the Investigation Wall via a `foreignObject` anchored at the
 * factor-band position from `computeWallLayout` (WallCanvas owns the mount; this
 * component is the HTML panel). It is NOT a leaf with injected stats — it
 * receives the scope's rows + candidate columns + outcome Y and runs the REAL
 * `computeBestSubsets` engine through the pure `modelBuilder` selector, so a dead
 * wiring (no rows / no outcome) renders the empty state, not a fake model.
 *
 * View-state only: toggling a candidate across the vital-few line is LOCAL
 * useState (LOCKED #4 — nothing persists until capture-as-Finding). Toggling is
 * an O(1) `lookupSubset` into the already-enumerated subsets (no recompute).
 *
 * Surface metrics = adjusted R² + per-factor p + per-factor ΔR² (semipartial R²,
 * "association strength") ONLY (LOCKED #2, refined CS-8 — no Cp/BIC; ΔR² is the
 * effect size behind the partial p, never a model-selection criterion).
 * Copy uses factor-side verbs only ("accounts for the spread", "vital few").
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DataRow, BestSubsetResult } from '@variscout/core';
import {
  computeBestSubsets,
  buildSubsetIndex,
  lookupSubset,
  selectVitalFew,
  perFactorPValues,
  isFitOnlyEstimate,
  redundancyHint,
  computeSubsetVIF,
  factorSetKey,
  perFactorDeltaR2,
} from '@variscout/core/stats';
import { formatMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

/**
 * Snapshot of the model the analyst chose to capture (capture-as-Finding).
 *
 * The canonical definition MOVED to the ModelDrawer module in ER-3 (Task 4 will
 * re-point all consumers there + delete this band). Imported for local use and
 * re-exported untouched so nothing breaks before Task 4 lands.
 */
import type { CapturedModelSnapshot } from '../ModelDrawer';
export type { CapturedModelSnapshot };

export interface ModelBuilderBandProps {
  /** Rows in the active scope (drilled subset, or full dataset). */
  rows: ReadonlyArray<DataRow>;
  /** Candidate factor columns (the columns the analyst may toggle). */
  candidateFactors: ReadonlyArray<string>;
  /** Outcome Y column. */
  outcome: string | null;
  /** Scope label for the header + the captured Finding. */
  scopeLabel: string;
  /**
   * Factors that are CONSTANT in the active scope (drilled on) — chipped
   * "constant in scope" and excluded from the model. Empty for the global scope.
   */
  constantFactors?: ReadonlyArray<string>;
  /** foreignObject anchor (canvas user-space). */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Capture-as-Finding affordance. When provided, a "Capture model" button
   * renders; firing it calls back with the current model snapshot. The app
   * creates the Finding + attaches the model snapshot to its projection's
   * modelContext (rSquaredAdj / scopeLabel / linkedFactor). Omit to hide.
   */
  onCaptureModel?: (snapshot: CapturedModelSnapshot) => void;
  /**
   * PR-CS-12: report the CURRENT model's kept set + per-factor association
   * strength (semipartial ΔR²) up to the Wall, for factor glyphs +
   * domain-weighted DOI. Fires whenever the analyst's kept set or its ΔR² map
   * changes; `null` when the engine can't produce a model. Single source of
   * truth — the Wall must NOT recompute best-subsets. Pass a stable callback
   * (e.g. a useState setter); an inline arrow re-fires the effect on every
   * parent render.
   */
  onModelStatsChange?: (
    stats: { kept: string[]; deltaR2: ReadonlyMap<string, number> } | null
  ) => void;
}

/** Format an R²adj as a 2-decimal string (deterministic, locale-agnostic). */
function fmtR2(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}
/** Format a p-value: <.001 collapses, else 3 decimals. */
function fmtP(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value < 0.001) return '<.001';
  return value.toFixed(3);
}
/** Sort factors by descending association strength (ΔR²); shared by capture + both lists. */
const byDeltaR2Desc =
  (m: Map<string, number>) =>
  (a: string, b: string): number =>
    (m.get(b) ?? 0) - (m.get(a) ?? 0);

/** A small inline association-strength bar; width = ΔR² (0..1), honest scale. */
const DeltaBar = ({ value }: { value: number }) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <span className="bg-surface-secondary inline-block h-1.5 w-10 overflow-hidden rounded-sm align-middle">
      <span className="block h-full bg-blue-300" style={{ width: `${pct}%` }} />
    </span>
  );
};

export const ModelBuilderBand: React.FC<ModelBuilderBandProps> = ({
  rows,
  candidateFactors,
  outcome,
  scopeLabel,
  constantFactors = [],
  x,
  y,
  width,
  height,
  onCaptureModel,
  onModelStatsChange,
}) => {
  const locale = useWallLocale();
  const [dismissedRedundancy, setDismissedRedundancy] = useState<string | null>(null);

  // Factors eligible for the model = candidates minus the scope-constant ones.
  const eligibleFactors = useMemo(
    () => candidateFactors.filter(f => !constantFactors.includes(f)),
    [candidateFactors, constantFactors]
  );

  // Run the REAL engine once per (rows, outcome, eligibleFactors). Returns null
  // when the scope can't yield a model (no outcome / no factors / too few rows).
  const engine = useMemo(() => {
    if (!outcome || eligibleFactors.length === 0 || rows.length === 0) return null;
    const data = [...rows];
    const result = computeBestSubsets(data, outcome, [...eligibleFactors]);
    if (!result || result.subsets.length === 0) return null;
    const index = buildSubsetIndex(result);
    // Honest nested-F partial p gates the vital-few inclusion (uniform OLS/ANOVA).
    const vitalFew = selectVitalFew(result, index, { data, outcome });
    if (!vitalFew) return null;
    return { result, index, vitalFew };
  }, [rows, outcome, eligibleFactors]);

  // The analyst's working selection (view-state). null = "follow the suggestion".
  // We store the chosen factor SET; the displayed subset is an O(1) lookup.
  const [selectedFactors, setSelectedFactors] = useState<string[] | null>(null);
  // The factor the analyst just removed (drives the redundancy comparison). null
  // after an add / snap-back / scope change.
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);

  // Reset the manual override whenever the engine recomputes (re-rank on drill /
  // outcome change) so the band always snaps back to the fresh suggestion.
  const engineKey = engine ? factorSetKey(engine.vitalFew.factors) + '|' + engine.result.n : '';
  const [lastEngineKey, setLastEngineKey] = useState('');
  if (engineKey !== lastEngineKey) {
    // Render-phase reset (cheap, idempotent) — mirrors the useScopedModels reset
    // pattern. Clears the override so the new scope shows its own vital-few.
    setLastEngineKey(engineKey);
    if (selectedFactors !== null) setSelectedFactors(null);
    if (lastRemoved !== null) setLastRemoved(null);
  }

  // The effective kept-factor set + the subset that backs it.
  const kept = useMemo<string[]>(() => {
    if (!engine) return [];
    if (selectedFactors === null) return engine.vitalFew.factors;
    return selectedFactors;
  }, [engine, selectedFactors]);

  const keptSubset = useMemo<BestSubsetResult | null>(() => {
    if (!engine) return null;
    if (kept.length === 0) return null;
    return lookupSubset(engine.index, kept);
  }, [engine, kept]);

  const keptP = useMemo<Map<string, number>>(() => {
    if (!engine || !keptSubset || !outcome) return new Map();
    // Honest in-model partial p (nested-F, uniform OLS/ANOVA) for the kept set.
    return perFactorPValues(keptSubset, engine.index, [...rows], outcome);
  }, [engine, keptSubset, rows, outcome]);

  // Per-factor (group) VIF for the CURRENTLY-kept model. The engine stamps `vif`
  // only on the winner (`subsets[0]`), so a toggled non-winner model would show a
  // blank VIF hover; computing it here (same design-matrix + OLS primitives the
  // engine uses — NOT a re-enumeration) keeps the hover live for any selection.
  const keptVif = useMemo<Map<string, number>>(() => {
    if (!keptSubset || !outcome) return new Map();
    return computeSubsetVIF([...rows], outcome, kept);
  }, [keptSubset, rows, outcome, kept]);

  // Per-factor association strength (semipartial R²) for kept + candidate
  // factors. O(1) reads off the enumerated index (see perFactorDeltaR2).
  const deltaR2 = useMemo<Map<string, number>>(() => {
    if (!engine) return new Map();
    return perFactorDeltaR2(kept, eligibleFactors, engine.index);
  }, [engine, kept, eligibleFactors]);

  // PR-CS-12: lift the live model stats to the Wall (glyph bars + DOI weights).
  useEffect(() => {
    if (!onModelStatsChange) return;
    onModelStatsChange(engine ? { kept, deltaR2 } : null);
  }, [onModelStatsChange, engine, kept, deltaR2]);

  // Has the analyst deviated from the engine suggestion? Drives the snap-back.
  const deviated = useMemo(() => {
    if (!engine) return false;
    return factorSetKey(kept) !== factorSetKey(engine.vitalFew.factors);
  }, [engine, kept]);

  const toggleFactor = useCallback(
    (factor: string) => {
      if (!engine) return;
      const base = selectedFactors ?? engine.vitalFew.factors;
      const isKept = base.includes(factor);
      const next = isKept ? base.filter(f => f !== factor) : [...base, factor];
      setSelectedFactors(next);
      setLastRemoved(isKept ? factor : null);
      setDismissedRedundancy(null);
    },
    [engine, selectedFactors]
  );

  const snapBack = useCallback(() => {
    setSelectedFactors(null);
    setLastRemoved(null);
    setDismissedRedundancy(null);
  }, []);

  // Redundancy hint (spec §3): when the analyst just removed a factor from the
  // current model AND that factor was highly collinear (high VIF) AND its removal
  // barely moved R²adj → "redundant not irrelevant". The WITH-factor subset
  // (current kept ∪ the removed factor) is an O(1) lookup for the R²adj delta;
  // its per-factor VIF is computed on demand (the engine only stamps VIF on the
  // winner) via `computeSubsetVIF`, which re-uses the design-matrix + OLS
  // primitives — NOT a recompute of the subset enumeration.
  const redundancy = useMemo(() => {
    if (!engine || !keptSubset || !lastRemoved || !outcome) return null;
    if (lastRemoved === dismissedRedundancy) return null;
    if (kept.includes(lastRemoved)) return null; // re-added; nothing removed
    const withFactorFactors = [...kept, lastRemoved];
    const withFactor = lookupSubset(engine.index, withFactorFactors);
    if (!withFactor) return null;
    const vifMap = computeSubsetVIF([...rows], outcome, withFactorFactors);
    return redundancyHint(lastRemoved, withFactor, keptSubset, {
      vif: vifMap.get(lastRemoved),
    });
  }, [engine, keptSubset, kept, lastRemoved, dismissedRedundancy, rows, outcome]);

  const fitOnly = keptSubset ? isFitOnlyEstimate(keptSubset) : false;

  const handleCapture = useCallback(() => {
    if (!onCaptureModel || !keptSubset || kept.length === 0) return;
    const perFactorP: Record<string, number> = {};
    for (const f of kept) perFactorP[f] = keptP.get(f) ?? 1;
    // top factor = the kept factor with the highest association strength (ΔR²).
    const topFactor = kept.length > 0 ? [...kept].sort(byDeltaR2Desc(deltaR2))[0] : null;
    onCaptureModel({
      factors: [...kept],
      rSquaredAdj: keptSubset.rSquaredAdj,
      perFactorP,
      scopeLabel,
      topFactor,
    });
  }, [onCaptureModel, keptSubset, kept, keptP, scopeLabel, deltaR2]);

  // ── Render ────────────────────────────────────────────────────────────────
  const keptSorted = [...kept].sort(byDeltaR2Desc(deltaR2));
  const candidatesBelowLine = eligibleFactors
    .filter(f => !kept.includes(f))
    .sort(byDeltaR2Desc(deltaR2));

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
      data-no-wall-pan
      data-testid="model-builder-band"
    >
      <div
        className="bg-surface border-edge text-content overflow-auto rounded border p-2 text-[11px] shadow-sm"
        role="group"
        aria-label={formatMessage(locale, 'wall.model.bandAriaLabel')}
        style={{ height: '100%' }}
      >
        {!engine || !keptSubset ? (
          rows.length > 0 && outcome && eligibleFactors.length > 0 ? (
            // Engine ran but the scope was too thin to re-rank → parent-scope note.
            <div data-testid="model-too-few" className="text-content-muted">
              {formatMessage(locale, 'wall.model.tooFewRows')}
            </div>
          ) : (
            <div data-testid="model-empty" className="text-content-muted">
              {formatMessage(locale, 'wall.model.empty')}
            </div>
          )
        ) : (
          <>
            {/* Header: title + R²adj + the fit-only dot. */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-semibold">{formatMessage(locale, 'wall.model.title')}</span>
              <span className="flex items-center gap-1.5">
                <span data-testid="model-r2adj" className="font-mono">
                  {formatMessage(locale, 'wall.model.rSquaredAdj', {
                    value: fmtR2(keptSubset.rSquaredAdj),
                  })}
                </span>
                {fitOnly && (
                  <span
                    data-testid="model-fit-only-dot"
                    title={formatMessage(locale, 'wall.model.fitOnlyTooltip')}
                    aria-label={formatMessage(locale, 'wall.model.fitOnlyDot')}
                    className="inline-block h-2 w-2 rounded-full bg-amber-500"
                  />
                )}
              </span>
            </div>

            {/* Association framing — this is a magnitude, not a cause verdict. */}
            <div
              data-testid="model-not-a-verdict"
              className="text-content-subtle mb-1 text-[10px] italic"
            >
              {formatMessage(locale, 'wall.model.notAVerdict')}
            </div>

            {/* KEPT — the vital few, above the line. */}
            <div className="text-content-subtle text-[10px] font-semibold uppercase">
              {formatMessage(locale, 'wall.model.keptHeading')}
            </div>
            <ul data-testid="model-kept" className="mb-1 space-y-0.5">
              {keptSorted.map(factor => (
                <li key={factor} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-no-wall-pan
                    data-testid={`model-kept-factor-${factor}`}
                    onClick={() => toggleFactor(factor)}
                    aria-label={formatMessage(locale, 'wall.model.removeFromModel', { factor })}
                    className="hover:bg-surface-secondary flex-1 rounded px-1 text-left"
                  >
                    {factor}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <DeltaBar value={deltaR2.get(factor) ?? 0} />
                    <span
                      data-testid={`model-deltaR2-${factor}`}
                      title={formatMessage(locale, 'wall.model.deltaR2Caption')}
                      className="text-content font-mono"
                    >
                      {formatMessage(locale, 'wall.model.deltaR2', {
                        value: fmtR2(deltaR2.get(factor) ?? 0),
                      })}
                    </span>
                    <span
                      data-testid={`model-p-${factor}`}
                      title={
                        keptVif.get(factor) !== undefined
                          ? formatMessage(locale, 'wall.model.vifTooltip', {
                              value: fmtR2(keptVif.get(factor)!),
                            })
                          : undefined
                      }
                      className="text-content-muted font-mono"
                    >
                      {formatMessage(locale, 'wall.model.factorP', {
                        value: fmtP(keptP.get(factor) ?? 1),
                      })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* The vital-few line. */}
            <div
              data-testid="vital-few-line"
              className="border-edge text-content-subtle my-1 border-t border-dashed pt-0.5 text-[9px] uppercase"
            >
              {formatMessage(locale, 'wall.model.vitalFewLine')}
            </div>

            {/* CANDIDATES — dimmed, below the line. */}
            {(candidatesBelowLine.length > 0 || constantFactors.length > 0) && (
              <>
                <div className="text-content-subtle text-[10px] font-semibold uppercase">
                  {formatMessage(locale, 'wall.model.candidatesHeading')}
                </div>
                <ul data-testid="model-candidates" className="space-y-0.5 opacity-60">
                  {candidatesBelowLine.map(factor => (
                    <li key={factor} className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-no-wall-pan
                        data-testid={`model-candidate-factor-${factor}`}
                        onClick={() => toggleFactor(factor)}
                        aria-label={formatMessage(locale, 'wall.model.addToModel', { factor })}
                        className="hover:bg-surface-secondary flex-1 rounded px-1 text-left"
                      >
                        {factor}
                      </button>
                      <span
                        data-testid={`model-deltaR2-${factor}`}
                        className="text-content-muted font-mono"
                      >
                        {formatMessage(locale, 'wall.model.deltaR2', {
                          value: fmtR2(deltaR2.get(factor) ?? 0),
                        })}
                      </span>
                    </li>
                  ))}
                  {constantFactors.map(factor => (
                    <li
                      key={factor}
                      data-testid={`model-constant-factor-${factor}`}
                      className="text-content-muted px-1 italic"
                    >
                      {factor} · {formatMessage(locale, 'wall.model.constantInScope')}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Redundancy honesty line (dismissible). */}
            {redundancy && (
              <div
                data-testid="model-redundancy"
                className="mt-1 flex items-start gap-1 rounded bg-amber-50 px-1.5 py-1 text-amber-900"
              >
                <span className="flex-1">
                  {formatMessage(locale, 'wall.model.redundancy', {
                    factor: redundancy.removedFactor,
                  })}
                </span>
                <button
                  type="button"
                  data-no-wall-pan
                  data-testid="model-redundancy-dismiss"
                  onClick={() => setDismissedRedundancy(redundancy.removedFactor)}
                  className="font-semibold underline"
                >
                  {formatMessage(locale, 'wall.model.redundancyDismiss')}
                </button>
              </div>
            )}

            {/* Snap-back — appears whenever the analyst has deviated (LOCKED #4). */}
            {deviated && (
              <button
                type="button"
                data-no-wall-pan
                data-testid="model-use-suggested"
                onClick={snapBack}
                className="mt-1 w-full rounded bg-blue-600 px-2 py-1 font-semibold text-white"
              >
                {formatMessage(locale, 'wall.model.useSuggested')}
              </button>
            )}

            {/* Capture-as-Finding. */}
            {onCaptureModel && (
              <button
                type="button"
                data-no-wall-pan
                data-testid="model-capture"
                onClick={handleCapture}
                className="border-edge hover:bg-surface-secondary mt-1 w-full rounded border px-2 py-1"
              >
                {formatMessage(locale, 'wall.model.captureModel')}
              </button>
            )}
          </>
        )}
      </div>
    </foreignObject>
  );
};
