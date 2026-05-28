import type { OutcomeSpec } from '../processHub';
import type {
  ImprovementProjectFactorControl,
  ProcessStepEntry,
} from '../improvementProject/types';

export interface DeriveExploreLandingViewInput {
  outcomeSpecs: OutcomeSpec[];
  /**
   * Raw factor controls from `ImprovementProject.goal.factorControls`.
   * Each control's `factor` field is the dataset column name for that X.
   */
  factorControls: ImprovementProjectFactorControl[];
  processSteps: ProcessStepEntry[];
  /**
   * D3-derived categorical columns keyed by their derived column name
   * (e.g. `'Order_Date.day-of-week'`). Keys count as factor-equivalent
   * channels alongside raw `factorControls`. Values are sample category
   * labels (not used here — only the keys matter for routing).
   */
  categoricalValuesByColumn: Record<string, (string | null)[]>;
}

export interface ExploreLandingView {
  isEnabled: boolean;
  focusedChart: 'ichart' | 'boxplot' | null;
  boxplotFactor: string | undefined;
  previewText: string;
  /** Diagnostic — which row of the §4.5 routing table fired. */
  routeKey: 'y-only' | 'y-plus-one-factor' | 'y-plus-multi-factor' | 'y-plus-process' | 'disabled';
}

/**
 * Pure routing function — determines the Explore tab landing view based on
 * the current state of the active ImprovementProject's Canvas Edit-mode data.
 *
 * Used as the single source of truth for both:
 * 1. The `<ExploreExitButton>` subtitle preview (Task 2 of PR-CCJ-F1).
 * 2. The Explore tab landing intent applied on mount (Task 5 of PR-CCJ-F1).
 *
 * Route precedence (first match wins — order matters):
 * 1. `disabled`          — no outcomeSpecs → gate is locked.
 * 2. `y-plus-process`    — outcomeSpecs present + processSteps present
 *                          (process structure beats raw factor count).
 * 3. `y-only`            — outcomeSpecs present, allFactors is empty.
 * 4. `y-plus-one-factor` — outcomeSpecs present, exactly 1 factor (raw or D3).
 * 5. `y-plus-multi-factor` — outcomeSpecs present, 2+ factors.
 *
 * This is a pure function: same input → same output, no side effects.
 *
 * Spec §4.5 rows 5–6 (multi-outcome Y-tabs, per-step view switcher) are
 * deferred to H1 — see decision-log 2026-05-28 amendment.
 */
export function deriveExploreLandingView(input: DeriveExploreLandingViewInput): ExploreLandingView {
  const { outcomeSpecs, factorControls, processSteps, categoricalValuesByColumn } = input;

  // ── Route 1: disabled ───────────────────────────────────────────────────────
  if (outcomeSpecs.length === 0) {
    return {
      isEnabled: false,
      focusedChart: null,
      boxplotFactor: undefined,
      previewText: 'Set an outcome to unlock Explore',
      routeKey: 'disabled',
    };
  }

  const firstOutcomeColumn = outcomeSpecs[0].columnName;
  const firstStepName = processSteps[0]?.name;

  // ── Route 2: y-plus-process (process beats factor count) ───────────────────
  if (processSteps.length > 0) {
    return {
      isEnabled: true,
      focusedChart: 'boxplot',
      boxplotFactor: firstStepName,
      previewText: 'will land on Boxplot by Step',
      routeKey: 'y-plus-process',
    };
  }

  // ── Build combined factor list (raw first, D3 derivatives second) ───────────
  // Deduplication: a column should not double-count if somehow present in both
  // channels (e.g., a raw factor that also appears as a D3 key). Raw factors
  // take precedence in ordering per the routing spec.
  const rawFactorColumns = factorControls.map(fc => fc.factor);
  const categoricalKeys = Object.keys(categoricalValuesByColumn);
  const seenColumns = new Set<string>(rawFactorColumns);
  const dedupedCategoricalKeys = categoricalKeys.filter(k => !seenColumns.has(k));
  const allFactors: string[] = [...rawFactorColumns, ...dedupedCategoricalKeys];

  // ── Route 3: y-only ─────────────────────────────────────────────────────────
  if (allFactors.length === 0) {
    return {
      isEnabled: true,
      focusedChart: 'ichart',
      boxplotFactor: undefined,
      previewText: `will land on I-Chart of ${firstOutcomeColumn}`,
      routeKey: 'y-only',
    };
  }

  const firstFactor = allFactors[0];

  // ── Route 4: y-plus-one-factor ──────────────────────────────────────────────
  if (allFactors.length === 1) {
    return {
      isEnabled: true,
      focusedChart: 'boxplot',
      boxplotFactor: firstFactor,
      previewText: `will land on I-Chart + Boxplot by ${firstFactor}`,
      routeKey: 'y-plus-one-factor',
    };
  }

  // ── Route 5: y-plus-multi-factor ────────────────────────────────────────────
  return {
    isEnabled: true,
    focusedChart: 'boxplot',
    boxplotFactor: firstFactor,
    previewText: `will land on I-Chart + Boxplot — pick from ${allFactors.length} factors`,
    routeKey: 'y-plus-multi-factor',
  };
}
