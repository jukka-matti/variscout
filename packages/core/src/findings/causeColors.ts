// 8-color palette for cause grouping (matches operatorColors from @variscout/charts)
const CAUSE_PALETTE = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

/**
 * Assign consistent colors to question IDs for cause grouping.
 * Colors are assigned in sorted order for stability across renders.
 */
export function assignCauseColors(questionIds: string[]): Map<string, string> {
  const sorted = [...questionIds].sort();
  const map = new Map<string, string>();
  sorted.forEach((id, i) => {
    map.set(id, CAUSE_PALETTE[i % CAUSE_PALETTE.length]);
  });
  return map;
}
