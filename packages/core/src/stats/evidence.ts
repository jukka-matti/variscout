/**
 * Evidence interpretation for ANOVA results.
 *
 * Maps statistical metrics (p-value, η²) to practitioner-friendly
 * evidence levels and insight text for the ChartInsightChip / NarrativeBar.
 */

export type EvidenceLevel = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface EvidenceInterpretation {
  evidenceLevel: EvidenceLevel;
  message: string;
}

interface InterpretEvidenceInput {
  etaSquared: number;
  pValue: number;
  totalN: number;
  groupCount: number;
}

/**
 * Derive an evidence level from p-value alone.
 *
 * | p        | Level        |
 * |----------|--------------|
 * | < 0.01   | strong       |
 * | < 0.05   | moderate     |
 * | < 0.10   | weak         |
 * | >= 0.10  | insufficient |
 */
function evidenceLevelFromP(pValue: number): EvidenceLevel {
  if (pValue < 0.01) return 'strong';
  if (pValue < 0.05) return 'moderate';
  if (pValue < 0.1) return 'weak';
  return 'insufficient';
}

/**
 * Interpret ANOVA evidence into a practitioner-friendly level and message.
 *
 * The message uses `{topCategory}` as a placeholder when the top category
 * name is relevant but not known at this level.
 */
export function interpretEvidence(input: InterpretEvidenceInput): EvidenceInterpretation {
  const { etaSquared, pValue } = input;
  const evidenceLevel = evidenceLevelFromP(pValue);
  const message = generateAnovaInsightLine({
    etaSquared,
    pValue,
    topCategoryName: '{topCategory}',
  });

  return { evidenceLevel, message };
}

interface AnovaInsightInput {
  etaSquared: number;
  pValue: number;
  topCategoryName: string;
}

/**
 * Generate a practitioner-friendly insight line from ANOVA metrics.
 *
 * Uses both η² (effect size) and p-value to select the most
 * appropriate message for the analyst.
 */
export function generateAnovaInsightLine(input: AnovaInsightInput): string {
  const { etaSquared, pValue, topCategoryName } = input;

  // Large effect (η² >= 0.15)
  if (etaSquared >= 0.15) {
    if (pValue < 0.05) {
      return `${topCategoryName} stands out — select it to see how other factors behave`;
    }
    if (pValue < 0.1) {
      return `${topCategoryName} shows a pattern — strengthen with gemba or expert evidence`;
    }
    return 'Data shows a pattern — strengthen with gemba or expert evidence';
  }

  // Medium effect (0.05 <= η² < 0.15)
  if (etaSquared >= 0.05) {
    if (pValue < 0.05) {
      return `${topCategoryName} contributes but isn't the primary driver — could be a contributing cause`;
    }
    return 'No clear pattern for this factor';
  }

  // Small effect (η² < 0.05)
  if (pValue < 0.001) {
    return 'Detectable but small — other factors explain more';
  }
  return 'No clear pattern for this factor';
}
