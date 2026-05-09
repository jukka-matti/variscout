/**
 * ChartSelection — represents a user gesture on a mini-chart inside HypothesisCard.
 *
 * - range: drag-to-select on MiniIChart (index-based, inclusive)
 * - category: tap-to-select on MiniBoxplot (category string)
 *
 * Consumed by Task 17 (brush→pin Finding flow) to create FindingSource entries.
 */
export type ChartSelection =
  | { kind: 'range'; chartType: 'ichart'; startIdx: number; endIdx: number }
  | { kind: 'category'; chartType: 'boxplot'; category: string };
