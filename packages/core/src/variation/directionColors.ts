/**
 * Direction-aware category coloring for boxplot charts
 *
 * Colors box fills by how well each category's mean aligns with the
 * characteristic type direction (nominal/smaller/larger).
 */

import type { SpecLimits } from '../types';
import { inferCharacteristicType } from '../types';

export type DirectionColor = 'red' | 'amber' | 'green';

/**
 * Compute direction-aware colors for boxplot categories based on
 * how well each category's mean aligns with the quality goal.
 *
 * @param data - Array of objects with key and mean (e.g., BoxplotGroupData)
 * @param specs - Specification limits (with optional characteristicType)
 * @returns Map of category key → color, or null if coloring not applicable
 */
export function computeCategoryDirectionColors(
  data: { key: string; mean: number }[],
  specs: SpecLimits
): Record<string, DirectionColor> | null {
  // Need specs and at least 2 categories for meaningful comparison
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) return null;
  if (data.length < 2) return null;

  const type = inferCharacteristicType(specs);

  // Compute "goodness score" per category based on characteristic type
  const scored = data.map(d => {
    let score: number;
    switch (type) {
      case 'smaller':
        score = -d.mean; // lower is better
        break;
      case 'larger':
        score = d.mean; // higher is better
        break;
      case 'nominal': {
        const target =
          specs.target ??
          (specs.usl !== undefined && specs.lsl !== undefined
            ? (specs.usl + specs.lsl) / 2
            : undefined);
        // If no target derivable, fall back to distance from midpoint of data
        if (target !== undefined) {
          score = -Math.abs(d.mean - target); // closer to target is better
        } else {
          return { key: d.key, score: 0 };
        }
        break;
      }
    }
    return { key: d.key, score };
  });

  // Sort by score descending (best first)
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  // Assign colors by thirds
  const n = sorted.length;
  const result: Record<string, DirectionColor> = {};

  if (n === 2) {
    // Special case: best = green, worst = red
    result[sorted[0].key] = 'green';
    result[sorted[1].key] = 'red';
  } else {
    const topThreshold = Math.ceil(n / 3);
    const bottomThreshold = n - Math.ceil(n / 3);

    for (let i = 0; i < n; i++) {
      if (i < topThreshold) {
        result[sorted[i].key] = 'green';
      } else if (i >= bottomThreshold) {
        result[sorted[i].key] = 'red';
      } else {
        result[sorted[i].key] = 'amber';
      }
    }
  }

  return result;
}
