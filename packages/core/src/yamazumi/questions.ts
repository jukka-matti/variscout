/**
 * Yamazumi question generator — lean investigation questions from time study data.
 *
 * Generates investigation questions based on waste composition, takt compliance,
 * and kaizen targeting from Yamazumi bar data.
 */

import type { YamazumiBarData } from './types';
import type { GeneratedQuestion } from '../stats/bestSubsets';

/**
 * Generate lean investigation questions from Yamazumi stacked bar data.
 *
 * Produces up to 5 question types:
 * 1. Takt compliance — which steps exceed takt time (only when taktTime provided)
 * 2. Waste composition — is the bottleneck real work or waste
 * 3. Waste driver ranking — which waste type dominates
 * 4. Temporal stability — is waste increasing over time (reserved for future)
 * 5. Kaizen targeting — where should kaizen focus first
 *
 * @param data - Yamazumi bar data (one bar per process step)
 * @param taktTime - Optional reference takt time for compliance questions
 * @returns Investigation questions sorted by waste contribution descending
 */
export function generateYamazumiQuestions(
  data: YamazumiBarData[],
  taktTime?: number
): GeneratedQuestion[] {
  if (data.length === 0) return [];

  const questions: GeneratedQuestion[] = [];

  // Compute totals across all steps
  const totalTimeAllSteps = data.reduce((sum, bar) => sum + bar.totalTime, 0);
  if (totalTimeAllSteps === 0) return [];

  // --- 1. Takt compliance questions ---
  if (taktTime != null && taktTime > 0) {
    const stepsOverTakt = data.filter(bar => bar.totalTime > taktTime);
    if (stepsOverTakt.length > 0) {
      const overTaktFraction = stepsOverTakt.length / data.length;
      questions.push({
        text: `Which steps exceed takt time? (${stepsOverTakt.length} of ${data.length} steps)`,
        factors: stepsOverTakt.map(bar => bar.key),
        rSquaredAdj: overTaktFraction,
        autoAnswered: false,
        source: 'factor-intel',
        type: 'single-factor',
      });
    }
  }

  // --- 2. Waste composition for the bottleneck step ---
  const bottleneck = data.reduce(
    (max, bar) => (bar.totalTime > max.totalTime ? bar : max),
    data[0]
  );
  const bottleneckWaste = bottleneck.segments.find(s => s.activityType === 'waste');
  const bottleneckWastePct = bottleneckWaste ? bottleneckWaste.percentage / 100 : 0;
  questions.push({
    text: `Is the bottleneck in ${bottleneck.key} real work or waste?`,
    factors: [bottleneck.key],
    rSquaredAdj: bottleneckWastePct,
    autoAnswered: bottleneckWastePct === 0,
    ...(bottleneckWastePct === 0 ? { autoStatus: 'ruled-out' as const } : {}),
    source: 'factor-intel',
    type: 'single-factor',
  });

  // --- 3. Waste driver ranking ---
  const totalWasteTime = data.reduce((sum, bar) => {
    const wasteSeg = bar.segments.find(s => s.activityType === 'waste');
    return sum + (wasteSeg?.totalTime ?? 0);
  }, 0);
  const wasteFraction = totalWasteTime / totalTimeAllSteps;
  questions.push({
    text: `Which waste type dominates? (${Math.round(wasteFraction * 100)}% total waste)`,
    factors: data.map(bar => bar.key),
    rSquaredAdj: wasteFraction,
    autoAnswered: wasteFraction === 0,
    ...(wasteFraction === 0 ? { autoStatus: 'ruled-out' as const } : {}),
    source: 'factor-intel',
    type: 'single-factor',
  });

  // --- 4. Temporal stability (placeholder — requires time dimension) ---
  // Skipped: only generated when time column is available in future extension

  // --- 5. Kaizen targeting ---
  // Find the step with the most waste time
  let maxWasteStep = data[0];
  let maxWasteTime = 0;
  for (const bar of data) {
    const wasteSeg = bar.segments.find(s => s.activityType === 'waste');
    const wt = wasteSeg?.totalTime ?? 0;
    if (wt > maxWasteTime) {
      maxWasteTime = wt;
      maxWasteStep = bar;
    }
  }
  const kaizenWasteFraction = totalTimeAllSteps > 0 ? maxWasteTime / totalTimeAllSteps : 0;
  questions.push({
    text: `Where should kaizen focus first? ${maxWasteStep.key} has the most waste.`,
    factors: [maxWasteStep.key],
    rSquaredAdj: kaizenWasteFraction,
    autoAnswered: kaizenWasteFraction === 0,
    ...(kaizenWasteFraction === 0 ? { autoStatus: 'ruled-out' as const } : {}),
    source: 'factor-intel',
    type: 'single-factor',
  });

  // Sort by evidence (rSquaredAdj = waste contribution fraction) descending
  questions.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return questions;
}
