/**
 * Type III Sum of Squares decomposition.
 *
 * Computes per-factor Type III SS using the model-comparison approach:
 *   - Fit full model with all factors
 *   - For each factor, fit reduced model WITHOUT that factor
 *   - Type III SS = SSE(reduced) - SSE(full)
 *
 * This gives the unique contribution of each factor after adjusting for
 * all other factors — correct for unbalanced designs.
 *
 * @module typeIIISS
 */

import type { DataRow, TypeIIIResult } from '../types';
import type { FactorSpec } from './designMatrix';
import { buildDesignMatrix } from './designMatrix';
import { solveOLS } from './olsRegression';
import { safeDivide, finiteOrUndefined } from './safeMath';
import { fDistributionPValue } from './distributions';

/**
 * Compute Type III SS for each factor in the model.
 *
 * Algorithm:
 * 1. Build full model with all factors → get SSE_full and df_full
 * 2. For each factor f:
 *    a. Build reduced model excluding factor f → get SSE_reduced
 *    b. Type III SS(f) = SSE_reduced - SSE_full
 *    c. df_effect(f) = number of columns factor f contributes
 *    d. F(f) = [SS(f) / df_effect(f)] / MSE_full
 *    e. partial η²(f) = SS(f) / (SS(f) + SSE_full)
 *
 * @param data - Data rows
 * @param outcome - Outcome column name
 * @param factorSpecs - Factor specifications (name, type, includeQuadratic)
 * @returns Map from factor name to TypeIIIResult, or null if model fails
 */
export function computeTypeIIISS(
  data: DataRow[],
  outcome: string,
  factorSpecs: FactorSpec[]
): Map<string, TypeIIIResult> | null {
  if (factorSpecs.length === 0) return null;

  // 1. Fit full model
  const fullMatrix = buildDesignMatrix(data, outcome, factorSpecs);
  if (fullMatrix.n < fullMatrix.p + 1) return null; // insufficient observations

  let fullSolution;
  try {
    fullSolution = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);
  } catch {
    return null;
  }

  const sseFullModel = fullSolution.sse;
  const dfResidualFull = fullMatrix.n - fullMatrix.p;
  if (dfResidualFull <= 0) return null;

  const mseFull = sseFullModel / dfResidualFull;

  const results = new Map<string, TypeIIIResult>();

  // 2. For each factor, build reduced model without it
  for (let fi = 0; fi < factorSpecs.length; fi++) {
    const factorToRemove = factorSpecs[fi];
    const reducedSpecs = factorSpecs.filter((_, i) => i !== fi);

    // Number of columns this factor contributes to the design matrix
    const encoding = fullMatrix.encodings[fi];
    const dfEffect = encoding.columnIndices.length;

    if (reducedSpecs.length === 0) {
      // Only one factor — reduced model is intercept-only
      // SSE_reduced = SST (since intercept-only means all residual is total SS)
      const ssTypeIII = fullSolution.sst - sseFullModel;
      // Actually: SSE(intercept-only) = SST, so Type III SS = SST - SSE_full = SSR_full
      // But more precisely: Type III SS = SSE_reduced - SSE_full = SST - SSE_full
      const partialEtaSq =
        ssTypeIII + sseFullModel > 0
          ? (finiteOrUndefined(ssTypeIII / (ssTypeIII + sseFullModel)) ?? 0)
          : 0;
      const msEffect = safeDivide(ssTypeIII, dfEffect);
      const fStat = msEffect !== undefined && mseFull > 0 ? msEffect / mseFull : 0;
      const pValue = dfResidualFull > 0 ? fDistributionPValue(fStat, dfEffect, dfResidualFull) : 1;

      results.set(factorToRemove.name, {
        ssTypeIII,
        dfEffect,
        partialEtaSq,
        fStat,
        pValue,
      });
      continue;
    }

    // Build reduced model
    const reducedMatrix = buildDesignMatrix(data, outcome, reducedSpecs);
    if (reducedMatrix.n < reducedMatrix.p + 1) {
      // Can't fit reduced model — skip this factor
      continue;
    }

    let reducedSolution;
    try {
      reducedSolution = solveOLS(
        reducedMatrix.X,
        reducedMatrix.y,
        reducedMatrix.n,
        reducedMatrix.p
      );
    } catch {
      continue;
    }

    const ssTypeIII = Math.max(0, reducedSolution.sse - sseFullModel);
    const partialEtaSq =
      ssTypeIII + sseFullModel > 0
        ? (finiteOrUndefined(ssTypeIII / (ssTypeIII + sseFullModel)) ?? 0)
        : 0;
    const msEffect = safeDivide(ssTypeIII, dfEffect);
    const fStat = msEffect !== undefined && mseFull > 0 ? msEffect / mseFull : 0;
    const pValue = dfResidualFull > 0 ? fDistributionPValue(fStat, dfEffect, dfResidualFull) : 1;

    results.set(factorToRemove.name, {
      ssTypeIII,
      dfEffect,
      partialEtaSq,
      fStat,
      pValue,
    });
  }

  return results;
}
