/**
 * Pure helper: maps a Hypothesis.condition + column-type map + outcome column
 * to a discriminated union describing which mini-chart to render inside a
 * HypothesisCard on the Investigation Wall.
 *
 * This module has no UI imports and must stay pure TypeScript.
 */

import type { Hypothesis } from './types';
import type { Finding } from './types';
import type { HypothesisCondition } from './hypothesisCondition';
import { collectReferencedColumns } from './hypothesisCondition';
import type { ImprovementProject } from '../improvementProject';
import type { ColumnAnalysis } from '../parser/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MiniChartKind = 'i-chart' | 'boxplot' | 'placeholder';

export type MiniChartPlaceholderReason =
  | 'no-condition'
  | 'no-factor'
  | 'unknown-column'
  | 'unsupported-type'
  | 'no-outcome';

export type MiniChartConfig =
  | { kind: 'i-chart'; factor: string; outcome?: string }
  | { kind: 'boxplot'; factor: string; outcome: string }
  | { kind: 'placeholder'; factor?: string; reason: MiniChartPlaceholderReason };

/** Lookup table from column name → parser-detected column type. */
export type ColumnTypeMap = Record<string, ColumnAnalysis['type']>;

export type IPReportMiniChartType =
  | 'ichart-factor-target-band'
  | 'boxplot-by-subgroup'
  | 'capability-histogram'
  | 'ichart-outcome-target-band';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Depth-first search for the first leaf column in a condition tree.
 * Handles all four condition kinds: leaf, and, or, not.
 */
function firstLeafColumn(c: HypothesisCondition): string | undefined {
  switch (c.kind) {
    case 'leaf':
      return c.column;
    case 'and':
    case 'or':
      for (const child of c.children) {
        const col = firstLeafColumn(child);
        if (col !== undefined) return col;
      }
      return undefined;
    case 'not':
      return firstLeafColumn(c.child);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derive the mini-chart configuration for a hypothesis card.
 *
 * Decision rules (in priority order):
 * 1. No condition → `placeholder` with reason `no-condition`.
 * 2. No leaf column found in tree → `placeholder` with reason `no-factor`.
 * 3. Column not in `columnTypes` map → `placeholder` with reason `unknown-column`.
 * 4. `numeric` | `date` column → `i-chart` (time-ordered individual values).
 * 5. `categorical` column + outcome present → `boxplot`.
 * 6. `categorical` column + no outcome → `placeholder` with reason `no-outcome`.
 * 7. Any other type (`text`, future additions) → `placeholder` with reason `unsupported-type`.
 *
 * @param hypothesis   The hypothesis whose `condition` field drives chart selection.
 * @param columnTypes  Map from column name → parser-detected type.
 * @param outcome      The outcome column name (e.g. "thickness"). Pass `undefined`
 *                     or `null` when no outcome has been detected for the dataset.
 */
export function deriveMiniChartConfig(
  hypothesis: Hypothesis,
  columnTypes: ColumnTypeMap,
  outcome: string | undefined | null
): MiniChartConfig {
  if (!hypothesis.condition) {
    return { kind: 'placeholder', reason: 'no-condition' };
  }

  const factor = firstLeafColumn(hypothesis.condition);
  if (factor === undefined) {
    return { kind: 'placeholder', reason: 'no-factor' };
  }

  const colType = columnTypes[factor];
  if (colType === undefined) {
    return { kind: 'placeholder', factor, reason: 'unknown-column' };
  }

  if (colType === 'numeric' || colType === 'date') {
    return { kind: 'i-chart', factor, outcome: outcome ?? undefined };
  }

  if (colType === 'categorical') {
    if (outcome == null) {
      return { kind: 'placeholder', factor, reason: 'no-outcome' };
    }
    return { kind: 'boxplot', factor, outcome };
  }

  // Covers 'text' and any future ColumnAnalysis types.
  return { kind: 'placeholder', factor, reason: 'unsupported-type' };
}

export function deriveIPReportMiniChartType(input: {
  ip: ImprovementProject;
  hypothesis: Hypothesis;
  linkedFindings: readonly Finding[];
  outcome: string | undefined | null;
}): IPReportMiniChartType {
  const conditionColumns = input.hypothesis.condition
    ? collectReferencedColumns(input.hypothesis.condition)
    : new Set<string>();
  const hasLinkedFactorControl = (input.ip.goal.factorControls ?? []).some(
    control =>
      control.linkedHypothesisId === input.hypothesis.id ||
      (control.linkedHypothesisId == null && conditionColumns.has(control.factor))
  );
  if (hasLinkedFactorControl) return 'ichart-factor-target-band';

  const mechanismFindingIds = new Set(
    (input.ip.goal.mechanismGoals ?? []).flatMap(goal => goal.linkedFindingIds ?? [])
  );
  const hasLinkedMechanismFinding = input.linkedFindings.some(finding =>
    mechanismFindingIds.has(finding.id)
  );
  if (hasLinkedMechanismFinding) return 'capability-histogram';

  if (input.hypothesis.condition) return 'boxplot-by-subgroup';

  return 'ichart-outcome-target-band';
}
