/**
 * Interaction screening for the two-pass best subsets algorithm (Pass 2).
 *
 * After Pass 1 finds the best main-effects model, this module tests whether
 * interaction terms significantly improve the model via partial F-tests.
 *
 * Three exported functions:
 *   - screenInteractionPair   — partial F-test for one factor pair
 *   - classifyInteractionPattern — ordinal vs. disordinal classification
 *   - assignPlotAxes          — axis assignment convention
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type { FactorSpec } from './designMatrix';
import { buildDesignMatrix } from './designMatrix';
import { solveOLS } from './olsRegression';
import { fDistributionPValue } from './distributions';
import * as d3 from 'd3-array';

// ============================================================================
// Public types
// ============================================================================

/**
 * Result of screening one factor pair for an interaction.
 */
export interface InteractionScreenResult {
  /** Factor names in alphabetical order */
  factors: [string, string];
  /** Whether the interaction lines cross (disordinal) or merely differ in slope (ordinal) */
  pattern: 'ordinal' | 'disordinal';
  /** Improvement in adjusted R² from adding the interaction term */
  deltaRSquaredAdj: number;
  /** p-value from partial F-test */
  pValue: number;
  /** Whether the interaction is significant at the given alpha threshold */
  isSignificant: boolean;
  /** Kind of factor pair */
  interactionType: 'cont×cont' | 'cont×cat' | 'cat×cat';
  /** Factor to place on the x-axis of an interaction plot */
  plotXAxis: string;
  /** Factor to use as the series (lines) in an interaction plot */
  plotSeries: string;
  /** Rationale for the axis assignment */
  plotAxisRationale: 'continuous-on-x' | 'more-levels-on-x';
}

/**
 * Result of assignPlotAxes.
 */
export interface PlotAxisAssignment {
  plotXAxis: string;
  plotSeries: string;
  rationale: 'continuous-on-x' | 'more-levels-on-x';
}

// ============================================================================
// screenInteractionPair
// ============================================================================

/**
 * Screen a factor pair for interaction via partial F-test.
 *
 * Fits two models:
 *   1. Main-effects only (all factors in allSpecs)
 *   2. Main effects + interaction term (factorA × factorB appended)
 *
 * Uses a partial F-test to determine whether the interaction term adds
 * significant explanatory power.
 *
 * @param data       Source data rows
 * @param outcome    Name of the numeric outcome column
 * @param allSpecs   All main-effect factor specs (must include factorA and factorB)
 * @param factorA    Name of the first factor to screen
 * @param factorB    Name of the second factor to screen
 * @param alpha      Significance threshold (default 0.10 — generous for screening)
 * @returns          InteractionScreenResult
 */
export function screenInteractionPair(
  data: DataRow[],
  outcome: string,
  allSpecs: FactorSpec[],
  factorA: string,
  factorB: string,
  alpha: number = 0.1
): InteractionScreenResult {
  // Alphabetically sort factor names for canonical output
  const [nameAlpha, nameBeta] = [factorA, factorB].sort() as [string, string];

  // -----------------------------------------------------------------------
  // 1. Fit main-effects model
  // -----------------------------------------------------------------------
  const mainMatrix = buildDesignMatrix(data, outcome, allSpecs);
  const mainSolution = solveOLS(mainMatrix.X, mainMatrix.y, mainMatrix.n, mainMatrix.p);

  // -----------------------------------------------------------------------
  // 2. Determine interaction type
  // -----------------------------------------------------------------------
  const specA = allSpecs.find(s => s.name === factorA);
  const specB = allSpecs.find(s => s.name === factorB);

  const typeA = specA?.type ?? 'continuous';
  const typeB = specB?.type ?? 'continuous';

  let interactionType: InteractionScreenResult['interactionType'];
  if (typeA === 'continuous' && typeB === 'continuous') {
    interactionType = 'cont×cont';
  } else if (typeA === 'categorical' && typeB === 'categorical') {
    interactionType = 'cat×cat';
  } else {
    interactionType = 'cont×cat';
  }

  // -----------------------------------------------------------------------
  // 3. Fit full model (main effects + interaction)
  // -----------------------------------------------------------------------
  const interactionName = `${factorA}×${factorB}`;
  const fullSpecs: FactorSpec[] = [
    ...allSpecs,
    {
      name: interactionName,
      type: 'interaction',
      sourceFactors: [factorA, factorB],
    },
  ];

  let fullSolution: ReturnType<typeof solveOLS>;
  try {
    const fullMatrix = buildDesignMatrix(data, outcome, fullSpecs);
    fullSolution = solveOLS(fullMatrix.X, fullMatrix.y, fullMatrix.n, fullMatrix.p);
  } catch {
    // Underdetermined or rank-deficient — cannot screen
    const axisAssignment = assignPlotAxes(
      factorA,
      typeA,
      factorB,
      typeB,
      getUniqueLevels(data, factorA),
      getUniqueLevels(data, factorB)
    );
    return {
      factors: [nameAlpha, nameBeta],
      pattern: 'ordinal',
      deltaRSquaredAdj: 0,
      pValue: 1,
      isSignificant: false,
      interactionType,
      plotXAxis: axisAssignment.plotXAxis,
      plotSeries: axisAssignment.plotSeries,
      plotAxisRationale: axisAssignment.rationale,
    };
  }

  // -----------------------------------------------------------------------
  // 4. Partial F-test
  //    F = [(SSE_main - SSE_full) / df_interaction] / [SSE_full / df_residual]
  // -----------------------------------------------------------------------
  const dfInteraction = fullSolution.p - mainSolution.p;
  const dfResidual = fullSolution.n - fullSolution.p;
  const sseDiff = Math.max(0, mainSolution.sse - fullSolution.sse);

  let pValue: number;
  let partialF: number;

  if (dfInteraction <= 0 || dfResidual <= 0 || fullSolution.sse <= 0) {
    partialF = 0;
    pValue = 1;
  } else {
    const mseInteraction = sseDiff / dfInteraction;
    const mseFull = fullSolution.sse / dfResidual;
    partialF = mseFull > 0 ? mseInteraction / mseFull : 0;
    pValue = fDistributionPValue(partialF, dfInteraction, dfResidual);
  }

  const deltaRSquaredAdj = fullSolution.rSquaredAdj - mainSolution.rSquaredAdj;
  const isSignificant = pValue < alpha;

  // -----------------------------------------------------------------------
  // 5. Classify pattern and assign axes
  // -----------------------------------------------------------------------
  const pattern = classifyInteractionPattern(data, outcome, factorA, factorB);

  const axisAssignment = assignPlotAxes(
    factorA,
    typeA,
    factorB,
    typeB,
    getUniqueLevels(data, factorA),
    getUniqueLevels(data, factorB)
  );

  return {
    factors: [nameAlpha, nameBeta],
    pattern,
    deltaRSquaredAdj,
    pValue,
    isSignificant,
    interactionType,
    plotXAxis: axisAssignment.plotXAxis,
    plotSeries: axisAssignment.plotSeries,
    plotAxisRationale: axisAssignment.rationale,
  };
}

// ============================================================================
// classifyInteractionPattern
// ============================================================================

/**
 * Classify interaction as ordinal or disordinal.
 *
 * For a continuous x-axis factor: discretize into quartile bins, then compute
 * cell means for each (bin, seriesLevel) combination. If the ranking of
 * series levels reverses between any two x-bins → disordinal.
 *
 * For cat×cat: compute cell means for each (levelA, levelB) cell,
 * then check for ranking reversals across columns.
 *
 * @param data     Source data rows
 * @param outcome  Name of the numeric outcome column
 * @param factorA  Name of the first factor
 * @param factorB  Name of the second factor
 * @returns        'ordinal' | 'disordinal'
 */
export function classifyInteractionPattern(
  data: DataRow[],
  outcome: string,
  factorA: string,
  factorB: string
): 'ordinal' | 'disordinal' {
  // Determine which factor is continuous (more than 6 unique numeric values)
  const isContinuousA = isContinuousFactor(data, factorA);
  const isContinuousB = isContinuousFactor(data, factorB);

  // Assign plotX (continuous preferred) and series
  let plotX: string;
  let series: string;

  if (isContinuousA && !isContinuousB) {
    plotX = factorA;
    series = factorB;
  } else if (!isContinuousA && isContinuousB) {
    plotX = factorB;
    series = factorA;
  } else if (isContinuousA && isContinuousB) {
    // Both continuous — use factorA as x
    plotX = factorA;
    series = factorB;
  } else {
    // Both categorical — use factorA as x
    plotX = factorA;
    series = factorB;
  }

  // Get series levels
  const seriesLevels = getUniqueLevels(data, series);
  if (seriesLevels.length < 2) return 'ordinal';

  let xBins: string[];
  let rowBinMapper: (row: DataRow) => string | undefined;

  if (isContinuousA || isContinuousB) {
    // Continuous x-axis: discretize into quartile bins
    const xValues = data
      .map(r => toNumericValue(r[plotX]))
      .filter((v): v is number => v !== undefined);

    if (xValues.length < 4) return 'ordinal';

    const q1 = d3.quantile(
      xValues.sort((a, b) => a - b),
      0.25
    )!;
    const q2 = d3.quantile(xValues, 0.5)!;
    const q3 = d3.quantile(xValues, 0.75)!;

    xBins = ['Q1', 'Q2', 'Q3', 'Q4'];
    rowBinMapper = (row: DataRow) => {
      const v = toNumericValue(row[plotX]);
      if (v === undefined) return undefined;
      if (v <= q1) return 'Q1';
      if (v <= q2) return 'Q2';
      if (v <= q3) return 'Q3';
      return 'Q4';
    };
  } else {
    // Cat×cat: use the unique levels of plotX as bins
    xBins = getUniqueLevels(data, plotX);
    rowBinMapper = (row: DataRow) => {
      const v = row[plotX];
      return v !== null && v !== undefined ? String(v) : undefined;
    };
  }

  // Compute cell means: means[bin][seriesLevel]
  const sums: Record<string, Record<string, number>> = {};
  const counts: Record<string, Record<string, number>> = {};

  for (const bin of xBins) {
    sums[bin] = {};
    counts[bin] = {};
    for (const lvl of seriesLevels) {
      sums[bin][lvl] = 0;
      counts[bin][lvl] = 0;
    }
  }

  for (const row of data) {
    const bin = rowBinMapper(row);
    if (!bin) continue;
    const seriesVal = row[series];
    if (seriesVal === null || seriesVal === undefined) continue;
    const lvl = String(seriesVal);
    if (!seriesLevels.includes(lvl)) continue;

    const yVal = toNumericValue(row[outcome]);
    if (yVal === undefined) continue;

    if (!sums[bin]) continue; // bin not in our set
    sums[bin][lvl] += yVal;
    counts[bin][lvl] += 1;
  }

  // Build means arrays per bin
  const binsWithData = xBins.filter(bin => seriesLevels.every(lvl => counts[bin][lvl] > 0));

  if (binsWithData.length < 2) return 'ordinal';

  // Get the ranking of series levels in each bin (by mean value)
  function getRanking(bin: string): string[] {
    return [...seriesLevels].sort(
      (a, b) => sums[bin][b] / counts[bin][b] - sums[bin][a] / counts[bin][a]
    );
  }

  const firstRanking = getRanking(binsWithData[0]);

  for (let bi = 1; bi < binsWithData.length; bi++) {
    const thisRanking = getRanking(binsWithData[bi]);
    // Check if any pair of levels has reversed order
    for (let i = 0; i < seriesLevels.length - 1; i++) {
      for (let j = i + 1; j < seriesLevels.length; j++) {
        const levelI = seriesLevels[i];
        const levelJ = seriesLevels[j];
        const firstOrderIJ = firstRanking.indexOf(levelI) < firstRanking.indexOf(levelJ);
        const thisOrderIJ = thisRanking.indexOf(levelI) < thisRanking.indexOf(levelJ);
        if (firstOrderIJ !== thisOrderIJ) {
          return 'disordinal';
        }
      }
    }
  }

  return 'ordinal';
}

// ============================================================================
// assignPlotAxes
// ============================================================================

/**
 * Assign axis roles for an interaction plot by convention.
 *
 * Rules:
 *   - Continuous always on x-axis when paired with categorical
 *   - cat×cat: more levels on x-axis
 *   - cont×cont: first factor on x-axis
 *
 * @param factorA  Name of factor A
 * @param typeA    Type of factor A
 * @param factorB  Name of factor B
 * @param typeB    Type of factor B
 * @param levelsA  Unique levels for factor A (used for cat×cat)
 * @param levelsB  Unique levels for factor B (used for cat×cat)
 * @returns        PlotAxisAssignment
 */
export function assignPlotAxes(
  factorA: string,
  typeA: 'continuous' | 'categorical' | 'interaction',
  factorB: string,
  typeB: 'continuous' | 'categorical' | 'interaction',
  levelsA?: string[],
  levelsB?: string[]
): PlotAxisAssignment {
  const isContinuousA = typeA === 'continuous';
  const isContinuousB = typeB === 'continuous';

  if (isContinuousA && !isContinuousB) {
    // cont×cat: continuous on x
    return { plotXAxis: factorA, plotSeries: factorB, rationale: 'continuous-on-x' };
  }

  if (!isContinuousA && isContinuousB) {
    // cat×cont: continuous on x
    return { plotXAxis: factorB, plotSeries: factorA, rationale: 'continuous-on-x' };
  }

  if (isContinuousA && isContinuousB) {
    // cont×cont: first factor on x
    return { plotXAxis: factorA, plotSeries: factorB, rationale: 'continuous-on-x' };
  }

  // cat×cat: more levels on x
  const countA = levelsA?.length ?? 0;
  const countB = levelsB?.length ?? 0;

  if (countA >= countB) {
    return { plotXAxis: factorA, plotSeries: factorB, rationale: 'more-levels-on-x' };
  } else {
    return { plotXAxis: factorB, plotSeries: factorA, rationale: 'more-levels-on-x' };
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Check if a factor is continuous: numeric values with more than 6 unique values.
 */
function isContinuousFactor(data: DataRow[], factor: string): boolean {
  const unique = new Set<number>();
  for (const row of data) {
    const v = toNumericValue(row[factor]);
    if (v !== undefined) unique.add(v);
    if (unique.size > 6) return true;
  }
  return false;
}

/**
 * Get unique string levels for a factor from the data.
 */
function getUniqueLevels(data: DataRow[], factor: string): string[] {
  const seen = new Set<string>();
  for (const row of data) {
    const v = row[factor];
    if (v !== null && v !== undefined) seen.add(String(v));
  }
  return Array.from(seen).sort();
}
