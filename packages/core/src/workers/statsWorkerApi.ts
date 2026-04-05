import { calculateStats } from '../stats/basic';
import { calculateKDE } from '../stats/kde';
import { calculateAnovaFromArrays } from '../stats/anova';
import { computeBestSubsets as computeBestSubsetsCore } from '../stats/bestSubsets';
import type { BestSubsetResult, BestSubsetsResult } from '../stats/bestSubsets';
import type { AnovaResult } from '../types';
import type {
  StatsComputeRequest,
  StatsComputeResult,
  AnovaComputeRequest,
  BestSubsetsComputeRequest,
  SerializedBestSubsetsResult,
} from './types';

/**
 * Compute stats and optionally KDE.
 * This function runs inside the Web Worker — heavy computation offloaded from main thread.
 */
export function computeStats(request: StatsComputeRequest): StatsComputeResult {
  const { specs, computeKDE: doKDE } = request;
  // Convert Float64Array to regular array (d3 and KDE expect number[])
  const values =
    request.values instanceof Float64Array ? Array.from(request.values) : request.values;

  // Basic stats (mean, stdDev, Cp, Cpk, control limits)
  const stats = calculateStats(values, specs.usl, specs.lsl);

  // KDE (kernel density estimation for violin plots) — O(n * numPoints)
  let kde: StatsComputeResult['kde'] = null;
  if (doKDE && values.length > 0) {
    kde = calculateKDE(values);
  }

  return { stats, kde };
}

/**
 * Compute one-way ANOVA from pre-extracted column arrays.
 * Runs inside the Web Worker — avoids serializing full DataRow[] objects.
 */
export function computeAnova(request: AnovaComputeRequest): AnovaResult | null {
  // Convert Float64Array to regular array if needed
  const outcomeValues =
    request.outcomeValues instanceof Float64Array
      ? Array.from(request.outcomeValues)
      : request.outcomeValues;
  return calculateAnovaFromArrays(request.factorValues, outcomeValues, request.outcomeName);
}

/**
 * Serialize a BestSubsetResult to a structured-clone-safe form.
 * Maps are converted to Records for cross-thread transfer via Comlink.
 */
function serializeSubset(subset: BestSubsetResult): SerializedBestSubsetsResult['subsets'][number] {
  const levelEffects: Record<string, Record<string, number>> = {};
  for (const [factor, effects] of subset.levelEffects.entries()) {
    const rec: Record<string, number> = {};
    for (const [level, effect] of effects.entries()) {
      rec[level] = effect;
    }
    levelEffects[factor] = rec;
  }

  const cellMeans: Record<string, { mean: number; n: number }> = {};
  for (const [key, val] of subset.cellMeans.entries()) {
    cellMeans[key] = val;
  }

  const factorTypes: Record<string, 'continuous' | 'categorical'> | undefined = subset.factorTypes
    ? Object.fromEntries(subset.factorTypes.entries())
    : undefined;

  const typeIIIResults:
    | Record<
        string,
        {
          ssTypeIII: number;
          dfEffect: number;
          fStat: number;
          pValue: number;
          partialEtaSq: number;
        }
      >
    | undefined = subset.typeIIIResults
    ? Object.fromEntries(subset.typeIIIResults.entries())
    : undefined;

  const vif: Record<string, number> | undefined = subset.vif
    ? Object.fromEntries(subset.vif.entries())
    : undefined;

  const referenceLevels: Record<string, string> | undefined = subset.referenceLevels
    ? Object.fromEntries(subset.referenceLevels.entries())
    : undefined;

  return {
    factors: subset.factors,
    factorCount: subset.factorCount,
    rSquared: subset.rSquared,
    rSquaredAdj: subset.rSquaredAdj,
    fStatistic: subset.fStatistic,
    pValue: subset.pValue,
    isSignificant: subset.isSignificant,
    dfModel: subset.dfModel,
    levelEffects,
    cellMeans,
    predictors: subset.predictors,
    intercept: subset.intercept,
    modelType: subset.modelType,
    factorTypes,
    hasQuadraticTerms: subset.hasQuadraticTerms,
    rmse: subset.rmse,
    typeIIIResults,
    vif,
    referenceLevels,
    warnings: subset.warnings,
  };
}

/**
 * Serialize a full BestSubsetsResult to a structured-clone-safe form.
 */
function serializeBestSubsetsResult(result: BestSubsetsResult): SerializedBestSubsetsResult {
  return {
    subsets: result.subsets.map(serializeSubset),
    n: result.n,
    totalFactors: result.totalFactors,
    factorNames: result.factorNames,
    grandMean: result.grandMean,
    ssTotal: result.ssTotal,
    factorTypes: result.factorTypes ? Object.fromEntries(result.factorTypes.entries()) : undefined,
    usedOLS: result.usedOLS,
  };
}

/**
 * Compute Best Subsets regression in the Web Worker thread.
 *
 * Returns a serialized form with Maps converted to Records for structured-clone
 * compatibility. Use deserializeBestSubsetsResult() in the main thread to
 * reconstruct the full BestSubsetsResult with Map objects restored.
 *
 * This allows computeBestSubsets (OLS + combinatorial enumeration) to run
 * off the main thread for datasets where it may take >50ms.
 *
 * Named with 'Worker' suffix to distinguish from the core computeBestSubsets
 * function (which returns BestSubsetsResult with Maps, not serialized Records).
 */
export function computeBestSubsetsWorker(
  request: BestSubsetsComputeRequest
): SerializedBestSubsetsResult | null {
  const result = computeBestSubsetsCore(request.data, request.outcome, request.factors);
  if (!result) return null;
  return serializeBestSubsetsResult(result);
}

/**
 * Deserialize a SerializedBestSubsetsResult back to a full BestSubsetsResult.
 * Restores Map objects from Records for use with bestSubsets helper functions.
 */
export function deserializeBestSubsetsResult(
  serialized: SerializedBestSubsetsResult
): BestSubsetsResult {
  const subsets: BestSubsetResult[] = serialized.subsets.map(s => {
    const levelEffects = new Map<string, Map<string, number>>();
    for (const [factor, effects] of Object.entries(s.levelEffects)) {
      levelEffects.set(factor, new Map(Object.entries(effects)));
    }

    const cellMeans = new Map<string, { mean: number; n: number }>(Object.entries(s.cellMeans));

    const factorTypes = s.factorTypes
      ? new Map(Object.entries(s.factorTypes) as Array<[string, 'continuous' | 'categorical']>)
      : undefined;

    const typeIIIResults = s.typeIIIResults ? new Map(Object.entries(s.typeIIIResults)) : undefined;

    const vif = s.vif ? new Map(Object.entries(s.vif)) : undefined;

    const referenceLevels = s.referenceLevels
      ? new Map(Object.entries(s.referenceLevels))
      : undefined;

    return {
      factors: s.factors,
      factorCount: s.factorCount,
      rSquared: s.rSquared,
      rSquaredAdj: s.rSquaredAdj,
      fStatistic: s.fStatistic,
      pValue: s.pValue,
      isSignificant: s.isSignificant,
      dfModel: s.dfModel,
      levelEffects,
      cellMeans,
      predictors: s.predictors,
      intercept: s.intercept,
      modelType: s.modelType,
      factorTypes,
      hasQuadraticTerms: s.hasQuadraticTerms,
      rmse: s.rmse,
      typeIIIResults,
      vif,
      referenceLevels,
      warnings: s.warnings,
    };
  });

  const factorTypes = serialized.factorTypes
    ? new Map(
        Object.entries(serialized.factorTypes) as Array<[string, 'continuous' | 'categorical']>
      )
    : undefined;

  return {
    subsets,
    n: serialized.n,
    totalFactors: serialized.totalFactors,
    factorNames: serialized.factorNames,
    grandMean: serialized.grandMean,
    ssTotal: serialized.ssTotal,
    factorTypes,
    usedOLS: serialized.usedOLS,
  };
}
