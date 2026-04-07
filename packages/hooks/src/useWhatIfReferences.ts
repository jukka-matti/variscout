import { useMemo } from 'react';
import type { BestSubsetResult, SpecLimits, DataRow } from '@variscout/core';
import { predictFromModel } from '@variscout/core/stats';

/** A reference point for benchmarking the analyst's projection */
export interface WhatIfReference {
  /** Display label: "Best performer", "Model optimum", "95th percentile" */
  label: string;
  /** Outcome value at this reference point */
  value: number;
  /** Cpk at this reference point (if specs exist) */
  cpk?: number;
  /** Source type for visual styling */
  source: 'empirical' | 'model' | 'statistical';
}

/** Compute Cpk from mean, sigma, and specs */
function computeCpk(mean: number, sigma: number, specs?: SpecLimits): number | undefined {
  if (!specs || !Number.isFinite(sigma) || sigma <= 0) return undefined;
  if (!Number.isFinite(mean)) return undefined;
  const { usl, lsl } = specs;
  if (usl === undefined && lsl === undefined) return undefined;

  const cpkValues: number[] = [];
  if (usl !== undefined) cpkValues.push((usl - mean) / (3 * sigma));
  if (lsl !== undefined) cpkValues.push((mean - lsl) / (3 * sigma));
  return Math.min(...cpkValues);
}

/** Find optimal factor levels from model level effects */
function findOptimalLevels(
  model: BestSubsetResult,
  characteristicType?: 'nominal' | 'smaller' | 'larger'
): Record<string, string> {
  const optimal: Record<string, string> = {};
  const direction = characteristicType === 'smaller' ? 'min' : 'max';

  for (const factor of model.factors) {
    const levels = model.levelEffects.get(factor);
    if (!levels || levels.size === 0) continue;

    let bestLevel: string | undefined;
    let bestEffect = direction === 'min' ? Infinity : -Infinity;

    for (const [level, effect] of levels) {
      if (direction === 'min' ? effect < bestEffect : effect > bestEffect) {
        bestEffect = effect;
        bestLevel = level;
      }
    }

    if (bestLevel !== undefined) optimal[factor] = bestLevel;
  }

  return optimal;
}

/** Find worst factor levels (current performance proxy) */
function findWorstLevels(
  model: BestSubsetResult,
  characteristicType?: 'nominal' | 'smaller' | 'larger'
): Record<string, string> {
  const worst: Record<string, string> = {};
  const direction = characteristicType === 'smaller' ? 'max' : 'min';

  for (const factor of model.factors) {
    const levels = model.levelEffects.get(factor);
    if (!levels || levels.size === 0) continue;

    let worstLevel: string | undefined;
    let worstEffect = direction === 'min' ? Infinity : -Infinity;

    for (const [level, effect] of levels) {
      if (direction === 'min' ? effect < worstEffect : effect > worstEffect) {
        worstEffect = effect;
        worstLevel = level;
      }
    }

    if (worstLevel !== undefined) worst[factor] = worstLevel;
  }

  return worst;
}

export interface UseWhatIfReferencesOptions {
  /** Current process stats */
  currentMean: number;
  currentSigma: number;
  /** Specification limits */
  specs?: SpecLimits;
  /** Best subsets regression model */
  model?: BestSubsetResult | null;
  /** Grand mean (from full dataset) */
  grandMean?: number;
  /** Data for percentile computation */
  data?: DataRow[];
  /** Outcome column name */
  outcome?: string;
}

/**
 * Computes reference markers for the What-If Explorer.
 *
 * Returns an array of references: current, best performer (empirical),
 * model optimum (regression-predicted), and 95th percentile.
 */
export function useWhatIfReferences(options: UseWhatIfReferencesOptions): WhatIfReference[] {
  const { currentMean, currentSigma, specs, model, grandMean, data, outcome } = options;

  return useMemo<WhatIfReference[]>(() => {
    const refs: WhatIfReference[] = [];

    // Current (always present)
    refs.push({
      label: 'Current',
      value: currentMean,
      cpk: computeCpk(currentMean, currentSigma, specs),
      source: 'empirical',
    });

    // Best performer: empirical best category mean from model level effects
    if (model && model.factors.length > 0 && grandMean !== undefined) {
      const optimalLevels = findOptimalLevels(model, specs?.characteristicType);
      const worstLevels = findWorstLevels(model, specs?.characteristicType);

      if (Object.keys(optimalLevels).length > 0 && Object.keys(worstLevels).length > 0) {
        const prediction = predictFromModel(model, grandMean, worstLevels, optimalLevels);
        if (prediction) {
          const bestMean = currentMean + prediction.meanDelta;
          refs.push({
            label: 'Best performer',
            value: bestMean,
            cpk: computeCpk(bestMean, currentSigma, specs),
            source: 'empirical',
          });
        }
      }
    }

    // Model optimum: predicted best from regression (may exceed observed best)
    if (model && model.factors.length > 0 && grandMean !== undefined) {
      const optimalLevels = findOptimalLevels(model, specs?.characteristicType);
      const currentLevels = findWorstLevels(model, specs?.characteristicType);

      if (Object.keys(optimalLevels).length > 0 && Object.keys(currentLevels).length > 0) {
        const prediction = predictFromModel(model, grandMean, currentLevels, optimalLevels);
        if (prediction) {
          const optimumMean = prediction.predictedMean;
          // Only show if materially different from best performer
          const bestRef = refs.find(r => r.label === 'Best performer');
          if (!bestRef || Math.abs(optimumMean - bestRef.value) > 0.01 * currentSigma) {
            refs.push({
              label: 'Model optimum',
              value: optimumMean,
              cpk: computeCpk(optimumMean, currentSigma, specs),
              source: 'model',
            });
          }
        }
      }
    }

    // 95th percentile (best-of-best from data)
    if (data && outcome && data.length > 0) {
      const values = data
        .map(row => {
          const v = row[outcome];
          return typeof v === 'number' ? v : parseFloat(String(v));
        })
        .filter(v => Number.isFinite(v))
        .sort((a, b) => a - b);

      if (values.length >= 20) {
        const direction = specs?.characteristicType === 'smaller' ? 'lower' : 'upper';
        const idx =
          direction === 'lower'
            ? Math.floor(values.length * 0.05)
            : Math.floor(values.length * 0.95);
        const p95 = values[Math.min(idx, values.length - 1)];
        refs.push({
          label: direction === 'lower' ? '5th percentile' : '95th percentile',
          value: p95,
          cpk: computeCpk(p95, currentSigma, specs),
          source: 'statistical',
        });
      }
    }

    return refs;
  }, [currentMean, currentSigma, specs, model, grandMean, data, outcome]);
}
