/**
 * CL-5a: Pure view resolver for the consultation pack builder.
 *
 * Takes already-fetched analysis data (condition, ichart, boxplot) and maps
 * them to `ResolvedView[]` in the order required by `buildConsultationPack`:
 *   1. condition (if present)
 *   2. ichart (if present and non-empty)
 *   3. boxplot (if present and non-empty)
 *
 * PURE FUNCTION — no hooks, no store reads, no side effects.
 * The caller (CL-5b) is responsible for pulling data from stores/hooks and
 * passing it here.
 */

import type { ResolvedView } from './buildConsultationPack';
import type { StaticBoxplotInput } from './staticChartSvg';

// ── Input shape ────────────────────────────────────────────────────────────────

export interface ResolveViewsInput {
  /** Active drill/condition to surface. Omit when no condition is active. */
  condition?: {
    label: string;
    statsText: string;
  };
  /** I-Chart (individual values) data. Omit when no chart is selected. */
  ichart?: {
    title: string;
    data: Array<{ x: number; y: number }>;
    mean?: number;
    ucl?: number;
    lcl?: number;
  };
  /** Boxplot group statistics. Omit when no boxplot is selected. */
  boxplot?: {
    title: string;
    groups: StaticBoxplotInput['groups'];
  };
}

// ── resolveConsultationViews ───────────────────────────────────────────────────

/**
 * Map a `ResolveViewsInput` to an ordered `ResolvedView[]`.
 *
 * Order: condition first, ichart second, boxplot third.
 * Absent or empty inputs produce no view entry (ichart with an empty data
 * array is omitted; boxplot with an empty groups array is omitted).
 */
export function resolveConsultationViews(input: ResolveViewsInput): ResolvedView[] {
  const views: ResolvedView[] = [];

  // 1. Condition
  if (input.condition) {
    views.push({
      kind: 'condition',
      label: input.condition.label,
      statsText: input.condition.statsText,
    });
  }

  // 2. I-Chart — skip when data array is absent or empty
  if (input.ichart && input.ichart.data.length > 0) {
    views.push({
      kind: 'chart',
      chartType: 'ichart',
      title: input.ichart.title,
      data: input.ichart.data,
      mean: input.ichart.mean,
      ucl: input.ichart.ucl,
      lcl: input.ichart.lcl,
    });
  }

  // 3. Boxplot — skip when groups array is absent or empty
  if (input.boxplot && input.boxplot.groups.length > 0) {
    views.push({
      kind: 'chart',
      chartType: 'boxplot',
      title: input.boxplot.title,
      groups: input.boxplot.groups,
    });
  }

  return views;
}
