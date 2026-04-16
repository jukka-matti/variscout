/**
 * Defect question generator — defect-specific investigation questions.
 *
 * Generates investigation questions based on defect type dominance,
 * factor-driven variation (from best subsets), and temporal stability.
 */

import type { DataRow } from '../types';
import type { GeneratedQuestion, BestSubsetsResult } from '../stats/bestSubsets';
import { generateQuestionsFromRanking } from '../stats/bestSubsets';

/**
 * Input for defect-specific question generation.
 */
export interface DefectQuestionInput {
  /** Transformed (aggregated) defect data rows */
  transformedData: DataRow[];
  /** Name of the outcome column (e.g., 'DefectCount' or 'DefectRate') */
  outcomeColumn: string;
  /** Optional column identifying defect types */
  defectTypeColumn?: string;
  /** Available factor columns */
  factors: string[];
}

/**
 * Generate defect-specific investigation questions.
 *
 * Produces up to three categories of questions:
 * 1. Defect type dominance — which defect type(s) dominate (if defectTypeColumn exists)
 * 2. Factor-driven variation — which factors drive defect rate (from best subsets)
 * 3. Temporal stability — is the defect rate stable over time (always generated)
 *
 * @param input - Defect data and column mapping
 * @param bestSubsets - Best subsets result for factor-driven questions (nullable)
 * @returns Investigation questions sorted by evidence strength descending
 */
export function generateDefectAnalysisQuestions(
  input: DefectQuestionInput,
  bestSubsets: BestSubsetsResult | null
): GeneratedQuestion[] {
  const { transformedData, outcomeColumn, defectTypeColumn, factors } = input;

  if (transformedData.length === 0) return [];

  const questions: GeneratedQuestion[] = [];

  // --- 1. Defect type dominance questions ---
  if (defectTypeColumn) {
    const typeCounts = new Map<string, number>();
    let totalDefects = 0;

    for (const row of transformedData) {
      const defectType = String(row[defectTypeColumn] ?? '');
      if (!defectType) continue;

      // Use outcome column value as the count/rate weight
      const value = typeof row[outcomeColumn] === 'number' ? (row[outcomeColumn] as number) : 1;
      typeCounts.set(defectType, (typeCounts.get(defectType) ?? 0) + value);
      totalDefects += value;
    }

    if (totalDefects > 0) {
      // Sort by count descending, take top 3
      const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
      const top = sorted.slice(0, 3);

      for (const [typeName, count] of top) {
        const pct = count / totalDefects;
        questions.push({
          text: `Does ${typeName} dominate the defect rate?`,
          factors: [defectTypeColumn],
          rSquaredAdj: pct, // type proportion used as evidence weight for sorting (not a regression R²adj)
          autoAnswered: false,
          source: 'factor-intel',
          type: 'main-effect',
        });
      }
    }
  }

  // --- 2. Factor-driven variation questions (from best subsets) ---
  if (bestSubsets) {
    const factorQuestions = generateQuestionsFromRanking(bestSubsets, { mode: 'defect' });
    questions.push(...factorQuestions);
  }

  // --- 3. Temporal stability question (always present) ---
  questions.push({
    text: 'Is the defect rate stable over time?',
    factors: factors.length > 0 ? [factors[0]] : [],
    rSquaredAdj: 0,
    autoAnswered: false,
    source: 'factor-intel',
    type: 'main-effect',
  });

  // Sort by evidence strength descending (temporal stability sinks to bottom)
  questions.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return questions;
}
