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
      .map(vc => {
        let label = `${vc.factor} \u03b7\u00b2=${Math.round(vc.etaSquared * 100)}%`;
        if (vc.factorType) {
          const parts: string[] = [vc.factorType];
          if (
            vc.relationship === 'quadratic' &&
            vc.optimum !== undefined &&
            Number.isFinite(vc.optimum)
          ) {
            parts.push(`sweet spot ${vc.optimum!.toFixed(2)}`);
          }
          label += ` [${parts.join(', ')}]`;
        }
        return label;
      })
      .join(', ');
    lines.push(`Top factors: ${topFactors}`);
  }

  // Best model equation
  if (context.bestModelEquation) {
    const bm = context.bestModelEquation;
    const factorList = bm.factors.join(', ');
    lines.push(
      `Best model: {${factorList}} \u2192 R\u00b2adj=${Number.isFinite(bm.rSquaredAdj) ? bm.rSquaredAdj.toFixed(2) : '?'}`
    );
    if (bm.worstCase && Object.keys(bm.worstCase.levels).length > 0) {
      const worstLevels = Object.entries(bm.worstCase.levels)
        .map(([f, v]) => `${f}=${v}`)
        .join(' + ');
      lines.push(
        `  Worst case: ${worstLevels} \u2192 ${Number.isFinite(bm.worstCase.predicted) ? bm.worstCase.predicted.toFixed(1) : '?'}`
      );
    }
    if (bm.bestCase && Object.keys(bm.bestCase.levels).length > 0) {
      const bestLevels = Object.entries(bm.bestCase.levels)
        .map(([f, v]) => `${f}=${v}`)
        .join(' + ');
      lines.push(
        `  Best case: ${bestLevels} \u2192 ${Number.isFinite(bm.bestCase.predicted) ? bm.bestCase.predicted.toFixed(1) : '?'}`
      );
    }
  }

  // Focus context from "Ask CoScout about this" actions
  if (context.focusContext) {
    const fc = context.focusContext;
    const parts: string[] = [];
    if (fc.chartType) parts.push(fc.chartType);
    if (fc.category) {
      let catDesc = fc.category.name;
      if (fc.category.mean !== undefined && Number.isFinite(fc.category.mean))
        catDesc += ` (mean=${fc.category.mean.toFixed(2)}`;
      if (fc.category.etaSquaredPct !== undefined)
        catDesc +=
          (fc.category.mean !== undefined ? ', ' : ' (') +
          `\u03b7\u00b2=${Math.round(fc.category.etaSquaredPct)}%`;
      if (fc.category.mean !== undefined || fc.category.etaSquaredPct !== undefined) catDesc += ')';
      parts.push(catDesc);
    }
    if (fc.finding) {
      parts.push(`finding: "${fc.finding.text.slice(0, 80)}"`);
    }
    if (parts.length > 0) {
      lines.push(`Focus: ${parts.join(' \u2014 ')}`);
    }
  }

  // Stats summary
  if (context.stats) {
    const s = context.stats;
    const statParts: string[] = [];
    statParts.push(`n=${s.samples}`);
    if (Number.isFinite(s.mean)) statParts.push(`mean=${s.mean.toFixed(2)}`);
    if (Number.isFinite(s.stdDev)) statParts.push(`\u03c3=${s.stdDev.toFixed(2)}`);
    if (s.cpk !== undefined && Number.isFinite(s.cpk)) statParts.push(`Cpk=${s.cpk.toFixed(2)}`);
    if (s.passRate !== undefined) statParts.push(`pass=${Math.round(s.passRate * 100)}%`);
    lines.push(`Stats: ${statParts.join(', ')}`);
  }

  if (lines.length === 0) return '';

  return `── Data Context ──\n${lines.join('\n')}`;
}
