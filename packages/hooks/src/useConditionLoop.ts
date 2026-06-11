/**
 * useConditionLoop — the ER-4 condition-loop orchestration shared by both apps'
 * Dashboards (spec §7.1–7.2, D6).
 *
 * A condition (categorical ∧ range) is MINTED from a chart gesture via the one
 * pill pattern (`ConditionPillBase`), APPLIED as the visible scope (the scope-bar
 * row + I-Chart highlight tier + filtered comparisons), and CARRIED to Analyze.
 *
 * This hook owns the judgment-heavy derivation so each Dashboard stays thin:
 *   - The brush pill: y-band summary (`buildBandLeaf`), nIn + x̄ in-vs-out over the
 *     lensed rows, anchored near the brush.
 *   - The group pill: the boxplot/Pareto transient-highlight group summary
 *     (`buildGroupLeaf`), same honest n + x̄ in-vs-out.
 *   - The applied condition: `appliedLeaves` → `conditionRows` (range-aware filter
 *     of the lensed rows) + `conditionMemberIndices` (DISPLAY-index space, for the
 *     I-Chart membership channel) + the scope-bar label + nIn/nTotal.
 *   - Handlers: `applyCondition` (leaves → scope store ONLY — NOT projectStore.filters),
 *     `clearCondition` (the ONE coherent clear), `takeToAnalyze` (mint the PSS then
 *     navigate), `mintScopeIdForCapture` (mint-or-match the active scope id).
 *
 * Membership / brush index space: `selectedPoints` and `conditionMemberIndices`
 * are DISPLAY indices — the index into the chart's plotted series after the
 * NaN-filter (`useIChartData`). This hook reproduces that exact projection so the
 * brush y-band and the membership Set agree with what the I-Chart plots.
 *
 * Invariants:
 * - Commit is always EXPLICIT (no silent filter on click; the pill's actions are
 *   the only commit path). Never auto-selects.
 * - Conditions are scope-store-only: `applyCondition` writes
 *   `analysisScopeStore.conditionLeaves` and NEVER `projectStore.filters`.
 *   `projectStore.filters` remains the legacy/restore carrier (finding-restore
 *   setFilters, deep links). `clearCondition` still clears BOTH (coherent clear,
 *   belt-and-braces for any legacy filters).
 * - The I-Chart receives the FULL lensed series + the member Set for ALL conditions
 *   (categorical AND range). Because conditions never write filters,
 *   useFilteredData / useAnalysisStats are automatically full-series — the plotted
 *   series and the stats/limits derive from the SAME unconditioned lensed rows, so
 *   limits are never drawn over a different population than plotted (D6 — a filtered
 *   control chart of a y-band, or of a categorical subset, is nonsense). The
 *   condition's members are lit within that full series.
 */

import { useCallback, useMemo } from 'react';
import {
  buildBandLeaf,
  buildGroupLeaf,
  rowMatchesConditionLeaves,
  formatConditionLeaves,
  type ConditionLeaf,
  type DataRow,
} from '@variscout/core';
import { useViewStore, useAnalysisScopeStore, useAnalyzeStore } from '@variscout/stores';
import { matchActiveScopeIdByLeaves } from './matchActiveScope';

/** Mean of a finite numeric column over the given rows; undefined when empty. */
function meanOf(rows: readonly DataRow[], column: string): number | undefined {
  let sum = 0;
  let n = 0;
  for (const row of rows) {
    const v = Number(row[column]);
    if (Number.isFinite(v)) {
      sum += v;
      n += 1;
    }
  }
  return n > 0 ? sum / n : undefined;
}

/** A pill's honest in-vs-out comparison over the lensed rows for a candidate condition. */
export interface ConditionPillSummary {
  /** Human-readable condition (already `formatConditionLeaves`-formatted). */
  summary: string;
  /** Rows inside the condition (over the lensed rows). */
  nIn: number;
  /** Mean of Y inside the condition. */
  meanIn?: number;
  /** Mean of Y outside the condition. */
  meanOut?: number;
  /** The minted leaf the pill commits via `view as condition →`. */
  leaf: ConditionLeaf;
}

export interface UseConditionLoopArgs {
  /**
   * The LENSED rows the charts plot (post time-lens, pre-condition). The brush
   * y-band, group membership, and condition-row filter are all computed over
   * THESE rows so the pill's n/x̄ and the scope-bar count agree with the grid.
   */
  lensedRows: readonly DataRow[];
  /** The active outcome (Y) column — the effectiveOutcome the charts plot. */
  outcome: string | null | undefined;
  /**
   * Project-id key the PSS producer/matcher keys scopes under. MUST mirror the
   * value the Analyze surface stores scopes under (`String(canvasViewportHubId)` /
   * DEFAULT_PROCESS_HUB_ID sentinel).
   */
  scopeProjectId: string;
}

export interface UseConditionLoopReturn {
  // ── Applied condition (drives the scope bar + the FILTER-tier charts) ──
  /** The applied condition leaves (`analysisScopeStore.conditionLeaves`). Empty → no condition. */
  appliedLeaves: ReadonlyArray<ConditionLeaf>;
  /** True when a condition is applied. */
  hasCondition: boolean;
  /** The lensed rows that match the applied condition (feed the boxplot/histogram/probability). */
  conditionRows: DataRow[];
  /**
   * Membership Set in DISPLAY-index space (the I-Chart's brush/highlight index
   * space) for the applied condition — the rows whose `row[col]===value` translated
   * to plotted-series indices. Empty when no condition is applied.
   */
  conditionMemberIndices: Set<number>;
  /** The scope-bar label (`formatConditionLeaves(appliedLeaves)`). */
  scopeBarLabel: string;
  /** Rows inside the condition (scope-bar nIn). */
  scopeBarNIn: number;
  /** The lensed total (scope-bar nTotal). */
  scopeBarNTotal: number;

  // ── Transient highlight (tier 2 — cross-chart, Esc-clearable) ──
  /** The group pill summary derived from `viewStore.transientHighlight`, or null. */
  groupPill: ConditionPillSummary | null;
  /**
   * Membership Set in DISPLAY-index space for the TRANSIENT highlight (cross-chart
   * I-Chart dimming while the group pill is up). Empty when no highlight is active.
   */
  transientMemberIndices: Set<number>;

  // ── Handlers ──
  /** Build the brush pill summary from a brush selection (display indices) + a draft. */
  buildBrushPill: (selectedDisplayIndices: ReadonlySet<number>) => ConditionPillSummary | null;
  /**
   * Apply a condition: leaves → scope store ONLY (v1: replaces). Does NOT write
   * projectStore.filters — conditions are scope-store-only so useFilteredData /
   * useAnalysisStats stay full-series for the I-Chart (D6). projectStore.filters
   * remains the legacy/restore carrier.
   */
  applyCondition: (leaves: ReadonlyArray<ConditionLeaf>) => void;
  /** The ONE coherent clear: filters + scope store + transient highlight together. */
  clearCondition: (clearFilters: () => void) => void;
  /** Take the applied condition to Analyze: mint/refresh the PSS, then navigate. */
  takeToAnalyze: (onOpenWall?: () => void) => void;
  /**
   * Mint-or-match the active scope id for a capture under a condition. Returns the
   * scope id when a condition is active (minting if needed), else undefined.
   */
  mintScopeIdForCapture: () => string | undefined;
}

/**
 * Project lensed rows → the plotted display series (mirrors `useIChartData`'s
 * NaN-filter): keep only rows with a finite Y, preserving order. Returns the
 * surviving lensed-row indices in display order so a display index can be mapped
 * back to its lensed row.
 */
function displayRowMap(rows: readonly DataRow[], outcome: string): number[] {
  const map: number[] = [];
  rows.forEach((row, i) => {
    if (!isNaN(Number(row[outcome]))) map.push(i);
  });
  return map;
}

/** Translate a membership predicate over the lensed rows → DISPLAY-index Set. */
function memberDisplayIndices(
  rows: readonly DataRow[],
  outcome: string,
  predicate: (row: DataRow) => boolean
): Set<number> {
  const set = new Set<number>();
  let displayIndex = 0;
  for (const row of rows) {
    if (isNaN(Number(row[outcome]))) continue; // dropped from the plotted series
    if (predicate(row)) set.add(displayIndex);
    displayIndex += 1;
  }
  return set;
}

export function useConditionLoop({
  lensedRows,
  outcome,
  scopeProjectId,
}: UseConditionLoopArgs): UseConditionLoopReturn {
  const appliedLeaves = useAnalysisScopeStore(s => s.conditionLeaves);
  const setConditionLeaves = useAnalysisScopeStore(s => s.setConditionLeaves);
  const transientHighlight = useViewStore(s => s.transientHighlight);
  const setTransientHighlight = useViewStore(s => s.setTransientHighlight);

  const hasCondition = appliedLeaves.length > 0;

  // ── Applied condition: the lensed rows that match (range-aware) ──
  const conditionRows = useMemo(() => {
    if (!hasCondition) return lensedRows.slice();
    return lensedRows.filter(row =>
      rowMatchesConditionLeaves(row, appliedLeaves as ConditionLeaf[])
    );
  }, [lensedRows, appliedLeaves, hasCondition]);

  const conditionMemberIndices = useMemo(() => {
    if (!hasCondition || !outcome) return new Set<number>();
    return memberDisplayIndices(lensedRows, outcome, row =>
      rowMatchesConditionLeaves(row, appliedLeaves as ConditionLeaf[])
    );
  }, [lensedRows, outcome, appliedLeaves, hasCondition]);

  const scopeBarLabel = useMemo(() => formatConditionLeaves(appliedLeaves), [appliedLeaves]);

  // ── Transient highlight (tier 2) ──
  const groupPill = useMemo<ConditionPillSummary | null>(() => {
    if (!transientHighlight || !outcome) return null;
    const { column, value } = transientHighlight;
    const leaf = buildGroupLeaf(column, value);
    const inRows = lensedRows.filter(row => row[column] === value);
    const outRows = lensedRows.filter(row => row[column] !== value);
    return {
      summary: formatConditionLeaves([leaf]),
      nIn: inRows.length,
      meanIn: meanOf(inRows, outcome),
      meanOut: meanOf(outRows, outcome),
      leaf,
    };
  }, [transientHighlight, outcome, lensedRows]);

  const transientMemberIndices = useMemo(() => {
    if (!transientHighlight || !outcome) return new Set<number>();
    const { column, value } = transientHighlight;
    return memberDisplayIndices(lensedRows, outcome, row => row[column] === value);
  }, [transientHighlight, outcome, lensedRows]);

  // ── Brush pill: y-band over the brushed display rows ──
  const buildBrushPill = useCallback(
    (selectedDisplayIndices: ReadonlySet<number>): ConditionPillSummary | null => {
      if (!outcome || selectedDisplayIndices.size === 0) return null;
      const displayToLensed = displayRowMap(lensedRows, outcome);
      let lo = Infinity;
      let hi = -Infinity;
      for (const di of selectedDisplayIndices) {
        const lensedIndex = displayToLensed[di];
        if (lensedIndex === undefined) continue;
        const y = Number(lensedRows[lensedIndex][outcome]);
        if (!Number.isFinite(y)) continue;
        if (y < lo) lo = y;
        if (y > hi) hi = y;
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
      const leaf = buildBandLeaf(outcome, lo, hi);
      const inRows = lensedRows.filter(row => rowMatchesConditionLeaves(row, [leaf]));
      const outRows = lensedRows.filter(row => !rowMatchesConditionLeaves(row, [leaf]));
      return {
        summary: formatConditionLeaves([leaf]),
        nIn: inRows.length,
        meanIn: meanOf(inRows, outcome),
        meanOut: meanOf(outRows, outcome),
        leaf,
      };
    },
    [outcome, lensedRows]
  );

  // ── Apply a condition (v1: replaces the existing applied condition) ──
  const applyCondition = useCallback(
    (leaves: ReadonlyArray<ConditionLeaf>) => {
      // An applied condition lives in analysisScopeStore.conditionLeaves ONLY. It is
      // NOT routed to projectStore.filters: that write was redundant (the filter-tier
      // charts already feed via the conditionRows dataOverride, evaluated at the
      // Dashboard seam) and it CAUSED an I-Chart inconsistency — a categorical-part
      // write filtered useFilteredData/useAnalysisStats down to the categorical
      // subset, so the I-Chart plotted only that subset while its membership channel
      // (computed over the FULL lensed series) became meaningless. With filters
      // untouched, useFilteredData / useAnalysisStats stay full-series and the I-Chart
      // plots the full lensed series with the condition's members lit (D6's letter).
      // projectStore.filters remains the legacy/restore carrier (finding-restore
      // setFilters, deep links) — conditions never touch it.
      setConditionLeaves(leaves);
      // Apply clears the transient highlight (it has been promoted to an applied
      // condition — the tier-2 dimming gives way to the membership tier).
      setTransientHighlight(null);
    },
    [setConditionLeaves, setTransientHighlight]
  );

  // ── The ONE coherent clear ──
  // Clears BOTH the scope store and projectStore.filters. Conditions no longer write
  // filters, so clearing them is belt-and-braces for legacy filters (finding-restore /
  // deep links) — harmless and keeps "×" the single honest reset of all scope chrome.
  const clearCondition = useCallback(
    (clearFilters: () => void) => {
      clearFilters();
      useAnalysisScopeStore.getState().clearScope(); // includes conditionLeaves
      setTransientHighlight(null);
    },
    [setTransientHighlight]
  );

  // ── Mint-or-match the active scope id (capture under a condition / take-to-Analyze) ──
  const mintScopeIdForCapture = useCallback((): string | undefined => {
    if (appliedLeaves.length === 0 || !outcome) return undefined;
    const leaves = appliedLeaves as ConditionLeaf[];
    const matched = matchActiveScopeIdByLeaves({
      leaves,
      outcome,
      scopeProjectId,
      scopes: useAnalyzeStore.getState().scopes,
    });
    if (matched) return matched;
    return useAnalyzeStore.getState().syncScopeFromCondition(scopeProjectId, outcome, leaves);
  }, [appliedLeaves, outcome, scopeProjectId]);

  // ── Take the applied condition to Analyze: mint the PSS FIRST, then navigate ──
  const takeToAnalyze = useCallback(
    (onOpenWall?: () => void) => {
      if (appliedLeaves.length > 0 && outcome) {
        // The mint-before-navigate is what carries the RANGE — Analyze's categorical
        // re-derive can't reconstruct between/gte predicates.
        useAnalyzeStore
          .getState()
          .syncScopeFromCondition(scopeProjectId, outcome, appliedLeaves as ConditionLeaf[]);
      }
      onOpenWall?.();
    },
    [appliedLeaves, outcome, scopeProjectId]
  );

  return {
    appliedLeaves,
    hasCondition,
    conditionRows,
    conditionMemberIndices,
    scopeBarLabel,
    scopeBarNIn: conditionRows.length,
    scopeBarNTotal: lensedRows.length,
    groupPill,
    transientMemberIndices,
    buildBrushPill,
    applyCondition,
    clearCondition,
    takeToAnalyze,
    mintScopeIdForCapture,
  };
}
