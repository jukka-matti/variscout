import {
  inferCharacteristicType,
  findBestSubgroup,
  findTightestSubgroup,
  normalQuantile,
  normalCDF,
  toNumericValue,
  type DataRow,
  type SpecLimits,
  type CategoryStats,
} from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import type { SimulatorPreset } from './types';

/**
 * Compute per-category stats for a factor column.
 */
function getCategoryStats(
  data: DataRow[],
  factor: string,
  outcome: string
): CategoryStats[] | null {
  if (data.length === 0) return null;
  const groups = new Map<string | number, number[]>();
  for (const row of data) {
    const cat = row[factor];
    if (cat === undefined || cat === null || cat === '') continue;
    const num = toNumericValue(row[outcome]);
    if (num === undefined) continue;
    const key = cat as string | number;
    const arr = groups.get(key);
    if (arr) arr.push(num);
    else groups.set(key, [num]);
  }
  if (groups.size === 0) return null;
  const result: CategoryStats[] = [];
  for (const [value, values] of groups) {
    const count = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / count;
    const variance = count > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (count - 1) : 0;
    result.push({ value, count, mean, stdDev: Math.sqrt(variance) });
  }
  return result;
}

/**
 * Compute smart presets based on current stats, specs, and category data.
 */
export function computePresets(
  currentStats: { mean: number; stdDev: number; median: number },
  specs: SpecLimits,
  filteredData: DataRow[],
  outcome: string,
  activeFactor?: string | null,
  fmt: (v: number, d?: number) => string = (v, d = 2) => formatStatistic(v, 'en', d),
  referenceLabel?: string
): SimulatorPreset[] {
  const presets: SimulatorPreset[] = [];
  const type = inferCharacteristicType(specs);

  // --- Spec-based presets (always available when specs set) ---

  // 1. Shift to target
  const target =
    specs.target ??
    (specs.usl !== undefined && specs.lsl !== undefined ? (specs.usl + specs.lsl) / 2 : undefined);

  if (target !== undefined) {
    const shift = target - currentStats.mean;
    if (Math.abs(shift) > currentStats.stdDev * 0.05) {
      presets.push({
        label: 'Shift to target',
        description: `Move mean to ${fmt(target, 1)} (shift ${shift >= 0 ? '+' : ''}${fmt(shift, 1)})`,
        meanShift: shift,
        variationReduction: 0,
        icon: 'target',
      });
    }
  }

  // 2. Shift to median (useful for skewed distributions)
  if (Math.abs(currentStats.median - currentStats.mean) > currentStats.stdDev * 0.1) {
    const shift = currentStats.median - currentStats.mean;
    presets.push({
      label: 'Shift to median',
      description: `Move mean to median ${fmt(currentStats.median, 1)} (corrects skew)`,
      meanShift: shift,
      variationReduction: 0,
    });
  }

  // 5. Reach 95% yield
  if (specs.usl !== undefined || specs.lsl !== undefined) {
    const z95 = normalQuantile(0.95); // ~1.645

    // Calculate current yield
    let currentYield = 100;
    if (currentStats.stdDev > 0) {
      if (specs.usl !== undefined && specs.lsl !== undefined) {
        currentYield =
          (normalCDF((specs.usl - currentStats.mean) / currentStats.stdDev) -
            normalCDF((specs.lsl - currentStats.mean) / currentStats.stdDev)) *
          100;
      } else if (specs.usl !== undefined) {
        currentYield = normalCDF((specs.usl - currentStats.mean) / currentStats.stdDev) * 100;
      } else if (specs.lsl !== undefined) {
        currentYield = (1 - normalCDF((specs.lsl - currentStats.mean) / currentStats.stdDev)) * 100;
      }
    }

    if (currentYield < 95 && currentStats.stdDev > 0) {
      let yieldShift = 0;
      let yieldReduction = 0;

      if (type === 'smaller' && specs.usl !== undefined) {
        // Shift mean down: need mean <= USL - z * sigma
        yieldShift = specs.usl - z95 * currentStats.stdDev - currentStats.mean;
        if (yieldShift > 0) {
          // Already centered enough, reduce spread instead
          const sigmaNeeded = (specs.usl - currentStats.mean) / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
          yieldShift = 0;
        }
      } else if (type === 'larger' && specs.lsl !== undefined) {
        // Shift mean up: need mean >= LSL + z * sigma
        yieldShift = specs.lsl + z95 * currentStats.stdDev - currentStats.mean;
        if (yieldShift < 0) {
          const sigmaNeeded = (currentStats.mean - specs.lsl) / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
          yieldShift = 0;
        }
      } else if (specs.usl !== undefined && specs.lsl !== undefined) {
        // Nominal: center first, then reduce spread if needed
        const midpoint = (specs.usl + specs.lsl) / 2;
        yieldShift = midpoint - currentStats.mean;
        // Check if centering achieves 95%
        const centeredYield =
          (normalCDF((specs.usl - midpoint) / currentStats.stdDev) -
            normalCDF((specs.lsl - midpoint) / currentStats.stdDev)) *
          100;
        if (centeredYield < 95) {
          // Also need spread reduction
          const halfRange = (specs.usl - specs.lsl) / 2;
          const sigmaNeeded = halfRange / z95;
          yieldReduction = Math.min(1 - sigmaNeeded / currentStats.stdDev, 0.5);
        }
      }

      if (Math.abs(yieldShift) > 0.001 || yieldReduction > 0.001) {
        presets.push({
          label: 'Reach 95% yield',
          description: 'Minimum adjustment to achieve 95% in-spec yield',
          meanShift: yieldShift,
          variationReduction: Math.max(0, yieldReduction),
          icon: 'star',
        });
      }
    }
  }

  // --- Category-based presets (need activeFactor + category data) ---

  if (activeFactor && filteredData.length > 0) {
    const categoryStats = getCategoryStats(filteredData, activeFactor, outcome);

    if (categoryStats && categoryStats.length >= 2) {
      // 3. Match best category
      const bestCategory = findBestSubgroup(categoryStats, type, target, specs);

      const matchBestShift = bestCategory.mean - currentStats.mean;
      if (Math.abs(matchBestShift) > currentStats.stdDev * 0.05) {
        const bestLabel = referenceLabel ?? bestCategory.value;
        presets.push({
          label: `Match ${bestLabel} mean`,
          description: `Shift mean to match "${bestCategory.value}" (mean ${fmt(bestCategory.mean, 1)})`,
          meanShift: matchBestShift,
          variationReduction: 0,
        });
      }

      // 4. Tighten spread (match tightest category)
      const tightestCategory = findTightestSubgroup(categoryStats);
      if (tightestCategory.stdDev > 0 && tightestCategory.stdDev < currentStats.stdDev) {
        const reduction = Math.min(1 - tightestCategory.stdDev / currentStats.stdDev, 0.5);
        if (reduction > 0.02) {
          const tightenLabel = referenceLabel ?? tightestCategory.value;
          presets.push({
            label: `Match ${tightenLabel} spread`,
            description: `Reduce variation to match "${tightestCategory.value}" (sigma ${fmt(tightestCategory.stdDev)})`,
            meanShift: 0,
            variationReduction: reduction,
          });
        }
      }

      // 6. Best of both (combine match best + tighten spread)
      if (
        Math.abs(matchBestShift) > currentStats.stdDev * 0.05 &&
        tightestCategory.stdDev > 0 &&
        tightestCategory.stdDev < currentStats.stdDev
      ) {
        const reduction = Math.min(1 - tightestCategory.stdDev / currentStats.stdDev, 0.5);
        if (reduction > 0.02) {
          const bothLabel = referenceLabel ?? 'best';
          presets.push({
            label: `Match ${bothLabel} fully`,
            description: `Combine best mean ("${bestCategory.value}") + tightest spread ("${tightestCategory.value}")`,
            meanShift: matchBestShift,
            variationReduction: reduction,
            icon: 'star',
          });
        }
      }
    }
  }

  return presets;
}
