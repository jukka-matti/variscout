/**
 * Factor effects — main effects and interaction analysis.
 *
 * Layer 2: Main effects — per-factor level means + effect sizes.
 * Layer 3: Interaction effects — ΔR² for factor pairs, cell means.
 *
 * Built on the existing ANOVA infrastructure (groupDataByFactor, getEtaSquared).
 * Complements bestSubsets.ts (Layer 1) in the Factor Intelligence system.
 */

import * as d3 from 'd3-array';
import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { fDistributionPValue } from './distributions';

// ============================================================================
// Types
// ============================================================================

/** Mean and sample size for one factor level. */
export interface LevelEffect {
  /** Factor level label (e.g., "Supplier A") */
  level: string;
  /** Mean outcome for this level */
  mean: number;
  /** Sample count at this level */
  n: number;
  /** Effect = level mean − grand mean */
  effect: number;
  /** Standard deviation of outcome at this level */
  stdDev: number;
}

/** Main effects result for one factor. */
export interface FactorMainEffect {
  /** Factor name */
  factor: string;
  /** Per-level means and effects, sorted by mean descending */
  levels: LevelEffect[];
  /** Eta-squared: proportion of total SS explained by this factor */
  etaSquared: number;
  /** P-value from one-way ANOVA */
  pValue: number;
  /** Whether the effect is statistically significant (p < 0.05) */
  isSignificant: boolean;
  /** Name of the best-performing level (highest or lowest mean) */
  bestLevel: string;
  /** Name of the worst-performing level */
  worstLevel: string;
  /** Range of means (max − min) — larger = stronger effect */
  effectRange: number;
}

/** Complete main effects result for all factors. */
export interface MainEffectsResult {
  /** Per-factor main effects, sorted by η² descending */
  factors: FactorMainEffect[];
  /** Grand mean of the outcome */
  grandMean: number;
  /** Total observations */
  n: number;
  /** Number of factors with significant effects */
  significantCount: number;
}

/** Cell mean for one combination of two factor levels. */
export interface CellMean {
  /** Level of factor A */
  levelA: string;
  /** Level of factor B */
  levelB: string;
  /** Mean outcome in this cell */
  mean: number;
  /** Sample count in this cell */
  n: number;
}

/** Interaction result for one pair of factors. */
export interface InteractionResult {
  /** First factor name */
  factorA: string;
  /** Second factor name */
  factorB: string;
  /** Levels of factor A (for x-axis) */
  levelsA: string[];
  /** Levels of factor B (for line series) */
  levelsB: string[];
  /** Cell means matrix (factorA level × factorB level) */
  cellMeans: CellMean[];
  /** R² of the combined A+B model (main effects only) */
  rSquaredMainEffects: number;
  /** R² of the A+B+A×B model (with interaction) */
  rSquaredWithInteraction: number;
  /** ΔR² = interaction R² − main effects R² */
  deltaRSquared: number;
  /** P-value for the interaction term */
  pValue: number;
  /** Whether the interaction is significant (p < 0.05) */
  isSignificant: boolean;
}

/** Complete interaction analysis result. */
export interface InteractionEffectsResult {
  /** All factor pair interactions, sorted by ΔR² descending */
  interactions: InteractionResult[];
  /** Number with significant interactions */
  significantCount: number;
}

// ============================================================================
// Main Effects (Layer 2)
// ============================================================================

/**
 * Compute main effects for all factors.
 *
 * For each factor, computes per-level means, effect sizes, η², and significance.
 * Results are sorted by η² descending (strongest factor first).
 */
export function computeMainEffects(
  data: DataRow[],
  outcome: string,
  factors: string[]
): MainEffectsResult | null {
  if (factors.length === 0) return null;

  // Extract valid observations
  const validRows: { value: number; factorValues: Record<string, string> }[] = [];

  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const fv: Record<string, string> = {};
    let allPresent = true;
    for (const f of factors) {
      const v = String(row[f] ?? '');
      if (v === '' || v === 'undefined' || v === 'null') {
        allPresent = false;
        break;
      }
      fv[f] = v;
    }
    if (!allPresent) continue;

    validRows.push({ value: val, factorValues: fv });
  }

  const n = validRows.length;
  if (n < 3) return null;

  const values = validRows.map(r => r.value);
  const grandMean = d3.mean(values) ?? 0;
  const ssTotal = d3.sum(values, v => (v - grandMean) ** 2);
  if (ssTotal === 0) return null;

  const factorResults: FactorMainEffect[] = [];

  for (const factor of factors) {
    // Group by factor level
    const groups = new Map<string, number[]>();
    for (const row of validRows) {
      const key = row.factorValues[factor];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row.value);
    }

    if (groups.size < 2) continue; // Need at least 2 levels

    // Compute eta-squared
    let ssBetween = 0;
    for (const vals of groups.values()) {
      const groupMean = d3.mean(vals) ?? 0;
      ssBetween += vals.length * (groupMean - grandMean) ** 2;
    }
    const etaSquared = ssBetween / ssTotal;

    // F-test
    const dfBetween = groups.size - 1;
    const dfWithin = n - groups.size;
    const ssWithin = ssTotal - ssBetween;
    let pValue = 1;
    if (dfBetween > 0 && dfWithin > 0 && ssWithin > 0) {
      const F = ssBetween / dfBetween / (ssWithin / dfWithin);
      pValue = fDistributionPValue(F, dfBetween, dfWithin);
    }

    // Per-level effects
    const levels: LevelEffect[] = [];
    for (const [level, vals] of groups) {
      const mean = d3.mean(vals) ?? 0;
      const stdDev = d3.deviation(vals) ?? 0;
      levels.push({
        level,
        mean,
        n: vals.length,
        effect: mean - grandMean,
        stdDev,
      });
    }
    levels.sort((a, b) => b.mean - a.mean);

    const best = levels[0];
    const worst = levels[levels.length - 1];

    factorResults.push({
      factor,
      levels,
      etaSquared,
      pValue,
      isSignificant: pValue < 0.05,
      bestLevel: best.level,
      worstLevel: worst.level,
      effectRange: best.mean - worst.mean,
    });
  }

  // Sort by η² descending
  factorResults.sort((a, b) => b.etaSquared - a.etaSquared);

  return {
    factors: factorResults,
    grandMean,
    n,
    significantCount: factorResults.filter(f => f.isSignificant).length,
  };
}

// ============================================================================
// Interaction Effects (Layer 3)
// ============================================================================

/**
 * Compute interaction effects for all factor pairs.
 *
 * For each pair (A, B), computes:
 *   - R² of main-effects-only model (A + B)
 *   - R² of full model with interaction (A + B + A×B)
 *   - ΔR² = full − main effects (the variance uniquely explained by interaction)
 *   - Cell means matrix for interaction plot visualization
 */
export function computeInteractionEffects(
  data: DataRow[],
  outcome: string,
  factors: string[]
): InteractionEffectsResult | null {
  if (factors.length < 2) return null;

  // Extract valid observations
  const validRows: { value: number; factorValues: Record<string, string> }[] = [];

  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const fv: Record<string, string> = {};
    let allPresent = true;
    for (const f of factors) {
      const v = String(row[f] ?? '');
      if (v === '' || v === 'undefined' || v === 'null') {
        allPresent = false;
        break;
      }
      fv[f] = v;
    }
    if (!allPresent) continue;

    validRows.push({ value: val, factorValues: fv });
  }

  const n = validRows.length;
  if (n < 5) return null;

  const values = validRows.map(r => r.value);
  const grandMean = d3.mean(values) ?? 0;
  const ssTotal = d3.sum(values, v => (v - grandMean) ** 2);
  if (ssTotal === 0) return null;

  const interactions: InteractionResult[] = [];

  // Evaluate all pairs
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const factorA = factors[i];
      const factorB = factors[j];

      // Main effects model: group by A|B compound key
      const mainGroups = new Map<string, number[]>();
      // Full model: group by A×B interaction cells
      const cellGroups = new Map<string, number[]>();
      const cellMeansMap = new Map<string, { levelA: string; levelB: string; values: number[] }>();

      const levelsASet = new Set<string>();
      const levelsBSet = new Set<string>();

      for (const row of validRows) {
        const a = row.factorValues[factorA];
        const b = row.factorValues[factorB];
        levelsASet.add(a);
        levelsBSet.add(b);

        // Main effects: compound key
        const mainKey = `${a}|${b}`;
        if (!mainGroups.has(mainKey)) mainGroups.set(mainKey, []);
        mainGroups.get(mainKey)!.push(row.value);

        // Interaction cells (same for full model)
        const cellKey = `${a}||${b}`;
        if (!cellGroups.has(cellKey)) cellGroups.set(cellKey, []);
        cellGroups.get(cellKey)!.push(row.value);

        if (!cellMeansMap.has(cellKey)) {
          cellMeansMap.set(cellKey, { levelA: a, levelB: b, values: [] });
        }
        cellMeansMap.get(cellKey)!.values.push(row.value);
      }

      const levelsA = [...levelsASet].sort();
      const levelsB = [...levelsBSet].sort();

      // R² for main effects model (compound grouping)
      let ssbMain = 0;
      for (const vals of mainGroups.values()) {
        const groupMean = d3.mean(vals) ?? 0;
        ssbMain += vals.length * (groupMean - grandMean) ** 2;
      }
      const rSquaredMain = ssbMain / ssTotal;

      // R² for full model with interaction (same grouping, but df differs conceptually)
      // Since we're using cell means (A×B), the SSB is the same as the main effects compound model
      // The interaction effect is the residual between the additive model and the cell means model

      // Additive model: predicted value = grandMean + effectA + effectB
      const meanA = new Map<string, number>();
      const meanB = new Map<string, number>();
      for (const a of levelsA) {
        const vals = validRows.filter(r => r.factorValues[factorA] === a).map(r => r.value);
        meanA.set(a, (d3.mean(vals) ?? 0) - grandMean);
      }
      for (const b of levelsB) {
        const vals = validRows.filter(r => r.factorValues[factorB] === b).map(r => r.value);
        meanB.set(b, (d3.mean(vals) ?? 0) - grandMean);
      }

      // SS interaction = Σ n_ij × (cellMean_ij - grandMean - effectA_i - effectB_j)²
      let ssInteraction = 0;
      for (const cell of cellMeansMap.values()) {
        const cellMean = d3.mean(cell.values) ?? 0;
        const predicted = grandMean + (meanA.get(cell.levelA) ?? 0) + (meanB.get(cell.levelB) ?? 0);
        ssInteraction += cell.values.length * (cellMean - predicted) ** 2;
      }

      const rSquaredFull = (ssbMain + ssInteraction) / ssTotal;
      // Clamp to avoid floating point issues
      const deltaRSquared = Math.max(0, rSquaredFull - rSquaredMain);

      // F-test for interaction term
      const dfInteraction = (levelsA.length - 1) * (levelsB.length - 1);
      const dfResidual = n - levelsA.length * levelsB.length;
      let interactionPValue = 1;

      if (dfInteraction > 0 && dfResidual > 0) {
        const ssResidual = ssTotal - ssbMain - ssInteraction;
        if (ssResidual > 0) {
          const F = ssInteraction / dfInteraction / (ssResidual / dfResidual);
          interactionPValue = fDistributionPValue(F, dfInteraction, dfResidual);
        }
      }

      // Build cell means array
      const cellMeans: CellMean[] = [];
      for (const cell of cellMeansMap.values()) {
        cellMeans.push({
          levelA: cell.levelA,
          levelB: cell.levelB,
          mean: d3.mean(cell.values) ?? 0,
          n: cell.values.length,
        });
      }

      interactions.push({
        factorA,
        factorB,
        levelsA,
        levelsB,
        cellMeans,
        rSquaredMainEffects: rSquaredMain,
        rSquaredWithInteraction: rSquaredFull,
        deltaRSquared,
        pValue: interactionPValue,
        isSignificant: interactionPValue < 0.05,
      });
    }
  }

  // Sort by ΔR² descending (strongest interaction first)
  interactions.sort((a, b) => b.deltaRSquared - a.deltaRSquared);

  return {
    interactions,
    significantCount: interactions.filter(i => i.isSignificant).length,
  };
}

// ============================================================================
// Question generation (Layers 2-3 → follow-up questions)
// ============================================================================

// Import GeneratedQuestion from bestSubsets to keep the type in one place
import type { GeneratedQuestion } from './bestSubsets';

/**
 * Generate follow-up questions from main effects and interactions.
 * Layer 2: "Is [level] specifically the worst for [factor]?"
 * Layer 3: "Do [Factor A] and [Factor B] interact?"
 *
 * These are gated — only generated when prerequisites are met.
 */
export function generateFollowUpQuestions(
  mainEffects: MainEffectsResult | null,
  interactions: InteractionEffectsResult | null,
  options?: { minEtaSquared?: number }
): GeneratedQuestion[] {
  const minEta = options?.minEtaSquared ?? 0.05;
  const questions: GeneratedQuestion[] = [];

  // Layer 2: main effect follow-ups
  if (mainEffects) {
    for (const factor of mainEffects.factors) {
      if (factor.etaSquared < minEta) continue;

      questions.push({
        text: `Is ${factor.worstLevel} specifically the worst for ${factor.factor}? (effect range: ${factor.effectRange.toFixed(2)})`,
        factors: [factor.factor],
        rSquaredAdj: factor.etaSquared, // Use eta-squared as evidence strength
        autoAnswered: false,
        source: 'factor-intel',
        type: 'main-effect',
      });
    }
  }

  // Layer 3: interaction follow-ups — gated on >= 2 significant main effects
  if (interactions && mainEffects && mainEffects.significantCount >= 2) {
    for (const interaction of interactions.interactions) {
      if (!interaction.isSignificant) continue;

      questions.push({
        text: `Do ${interaction.factorA} and ${interaction.factorB} interact \u2014 does the combination matter more than expected?`,
        factors: [interaction.factorA, interaction.factorB],
        rSquaredAdj: interaction.deltaRSquared, // Use deltaR² as evidence strength
        autoAnswered: false,
        source: 'factor-intel',
        type: 'interaction',
      });
    }
  }

  return questions;
}
