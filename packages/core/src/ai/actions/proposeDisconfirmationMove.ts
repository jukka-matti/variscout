/**
 * Pure heuristic that proposes a complementary brush region analysts should try
 * in order to disconfirm a suspected cause. Emits a `SuggestedBrush` the Wall UI
 * can hand to CoScout's `critique_investigation_state` tool output.
 *
 * Gate: hub has ≥3 supporting findings AND no existing finding with
 * validationStatus === 'contradicts'. Returns undefined otherwise.
 */

import type { SuspectedCause, Finding, FindingSource, DataRow } from '../..';

export interface SuggestedBrush {
  chart: FindingSource['chart'];
  suggestedCategory?: string;
  suggestedRange?: [number, number];
  column?: string;
  reason: string;
}

const SUPPORT_THRESHOLD = 3;

export function proposeDisconfirmationMove(
  hub: SuspectedCause,
  findings: Finding[],
  data: DataRow[]
): SuggestedBrush | undefined {
  const supporters = findings.filter(f => hub.findingIds.includes(f.id));
  if (supporters.length < SUPPORT_THRESHOLD) return undefined;
  if (supporters.some(f => f.validationStatus === 'contradicts')) return undefined;

  // Prefer categorical findings first — they have a clean "opposite" via other categories.
  const categorical = supporters.find(
    f =>
      f.source &&
      (f.source.chart === 'boxplot' || f.source.chart === 'pareto' || f.source.chart === 'yamazumi')
  );
  if (categorical?.source && 'category' in categorical.source) {
    const usedCategory = categorical.source.category;
    const columnHint = inferCategoryColumn(data, usedCategory);
    if (!columnHint) return undefined;
    const otherCategory = firstDistinctValue(data, columnHint, usedCategory);
    if (!otherCategory) return undefined;
    return {
      chart: categorical.source.chart,
      suggestedCategory: otherCategory,
      column: columnHint,
      reason: `${hub.name} has no disconfirmation attempted. Try brushing ${otherCategory}.`,
    };
  }

  // Numeric ichart — propose opposite side of the anchor.
  const numeric = supporters.find(f => f.source?.chart === 'ichart');
  if (numeric?.source && numeric.source.chart === 'ichart') {
    const threshold = numeric.source.anchorY;
    return {
      chart: 'ichart',
      suggestedRange: [Number.NEGATIVE_INFINITY, threshold],
      reason: `${hub.name} has no disconfirmation attempted. Try brushing values below ${threshold}.`,
    };
  }

  return undefined;
}

/** Guess which column the supporting findings share by scanning data for value match. */
function inferCategoryColumn(data: DataRow[], value: string): string | undefined {
  if (data.length === 0) return undefined;
  for (const key of Object.keys(data[0])) {
    if (data.some(row => row[key] === value)) return key;
  }
  return undefined;
}

function firstDistinctValue(data: DataRow[], column: string, exclude: string): string | undefined {
  for (const row of data) {
    const v = row[column];
    if (typeof v === 'string' && v !== exclude) return v;
  }
  return undefined;
}
