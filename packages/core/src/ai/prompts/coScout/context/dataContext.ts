/**
 * Data context formatter for CoScout Tier 2 (semi-static context).
 *
 * Owns: active chart, drill scope, top factors by eta-squared,
 * best model equation (R²adj), stats summary (n, mean, sigma, Cpk).
 *
 * Investigation state (problem statement, Evidence Map topology,
 * question progress) is owned by investigation.ts to avoid duplication.
 */

import type { AIContext } from '../../../types';

/**
 * Format the grounded data context block for CoScout.
 *
 * Produces a human-readable summary of the current analysis state.
 * Lines with undefined/empty values are omitted.
 *
 * Returns empty string when context has no meaningful data.
 */
export function formatDataContext(context: AIContext): string {
  const lines: string[] = [];

  // Active chart with factor info
  if (context.activeChart) {
    const filters = context.filters;
    const activeFactor = filters.length > 0 ? filters[filters.length - 1] : undefined;
    let chartLine = `Active chart: ${context.activeChart}`;
    if (activeFactor) {
      const catCount = activeFactor.values.length;
      chartLine += ` — ${activeFactor.factor} (${catCount} ${catCount === 1 ? 'category' : 'categories'})`;
    }
    lines.push(chartLine);
  }

  // Drill scope
  if (context.drillPath && context.drillPath.length > 0) {
    const scopePct =
      context.cumulativeScope !== undefined
        ? `${Math.round(context.cumulativeScope * 100)}% of total variation`
        : undefined;
    const pathStr = context.drillPath.join(' > ');
    if (scopePct) {
      lines.push(`Drill scope: ${scopePct} (${pathStr})`);
    } else {
      lines.push(`Drill path: ${pathStr}`);
    }
  }

  // Top factors by eta-squared
  if (context.variationContributions && context.variationContributions.length > 0) {
    const topFactors = context.variationContributions
      .slice(0, 5)
      .map(vc => `${vc.factor} \u03b7\u00b2=${Math.round(vc.etaSquared * 100)}%`)
      .join(', ');
    lines.push(`Top factors: ${topFactors}`);
  }

  // Best model equation
  if (context.bestModelEquation) {
    const bm = context.bestModelEquation;
    const factorList = bm.factors.join(' + ');
    const rAdj = Math.round(bm.rSquaredAdj * 100);
    lines.push(`Best model: ${factorList} \u2192 R\u00b2adj=${rAdj}%`);
  }

  // Stats summary
  if (context.stats) {
    const s = context.stats;
    const statParts: string[] = [];
    statParts.push(`n=${s.samples}`);
    statParts.push(`mean=${s.mean.toFixed(2)}`);
    statParts.push(`\u03c3=${s.stdDev.toFixed(2)}`);
    if (s.cpk !== undefined) statParts.push(`Cpk=${s.cpk.toFixed(2)}`);
    if (s.passRate !== undefined) statParts.push(`pass=${Math.round(s.passRate * 100)}%`);
    lines.push(`Stats: ${statParts.join(', ')}`);
  }

  if (lines.length === 0) return '';

  return `── Data Context ──\n${lines.join('\n')}`;
}
