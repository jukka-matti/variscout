/**
 * Generate deterministic finding text from statistical evidence.
 * Used as initial text when auto-creating findings from question answers.
 * CoScout can enrich this asynchronously.
 */
export interface FindingTextInput {
  factor: string;
  worstLevel?: string;
  bestLevel?: string;
  etaSquared?: number;
  rSquaredAdj?: number;
  mean?: number;
  sigma?: number;
  samples?: number;
}

export function generateFindingText(input: FindingTextInput): string {
  const parts: string[] = [];

  // Factor name + evidence
  if (input.etaSquared != null) {
    const pct = Math.round(input.etaSquared * 100);
    parts.push(`${input.factor}: η²=${pct}%`);
  } else if (input.rSquaredAdj != null) {
    const pct = Math.round(input.rSquaredAdj * 100);
    parts.push(`${input.factor}: R²adj=${pct}%`);
  } else {
    parts.push(input.factor);
  }

  // Best/worst levels
  if (input.worstLevel && input.bestLevel) {
    parts.push(`${input.worstLevel} is worst, ${input.bestLevel} is best`);
  } else if (input.worstLevel) {
    parts.push(`${input.worstLevel} is worst`);
  }

  // Stats context
  const stats: string[] = [];
  if (input.mean != null) stats.push(`mean=${input.mean.toFixed(1)}`);
  if (input.sigma != null) stats.push(`σ=${input.sigma.toFixed(2)}`);
  if (input.samples != null) stats.push(`n=${input.samples}`);
  if (stats.length > 0) parts.push(`(${stats.join(', ')})`);

  return parts.join(', ');
}
