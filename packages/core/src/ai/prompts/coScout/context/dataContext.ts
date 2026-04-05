/**
 * Data context formatter for CoScout Tier 2 (semi-static context).
 *
 * NEW formatter — produces the grounded data context block that summarizes
 * the current analysis state: problem statement, active chart, drill scope,
 * top factors, best model, Evidence Map topology, and question progress.
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

  // Problem statement
  const problemText =
    context.investigation?.liveStatement ??
    context.investigation?.problemStatement?.fullText ??
    context.process?.problemStatement;
  const problemStage = context.investigation?.problemStatementStage;
  if (problemText) {
    const stage = problemStage ? ` (${problemStage})` : '';
    lines.push(`Problem: "${problemText}"${stage}`);
  }

  // Active chart with factor info
  if (context.activeChart) {
    const filters = context.filters;
    const activeFactor = filters && filters.length > 0 ? filters[filters.length - 1] : undefined;
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

  // Evidence Map topology
  if (context.investigation?.evidenceMapTopology) {
    const topo = context.investigation.evidenceMapTopology;
    const nodeCount = topo.factorNodes.length;
    const edgeCount = topo.relationships.length;
    const convergenceCount = topo.convergencePoints.length;

    let mapLine = `Evidence Map: ${nodeCount} factor nodes, ${edgeCount} relationships`;
    if (convergenceCount > 0) {
      mapLine += `, ${convergenceCount} convergence points`;
    }
    lines.push(mapLine);
  }

  // Question progress
  if (context.investigation?.questionTree && context.investigation.questionTree.length > 0) {
    const questions = context.investigation.questionTree;
    let openCount = 0;
    let answeredCount = 0;
    let ruledOutCount = 0;
    let topOpenQuestion: string | undefined;

    for (const q of questions) {
      if (q.status === 'open') {
        openCount++;
        if (!topOpenQuestion) topOpenQuestion = q.text;
      } else if (q.status === 'answered') {
        answeredCount++;
      } else if (q.status === 'ruled-out') {
        ruledOutCount++;
      }
      if (q.children) {
        for (const child of q.children) {
          if (child.status === 'open') {
            openCount++;
            if (!topOpenQuestion) topOpenQuestion = child.text;
          } else if (child.status === 'answered') {
            answeredCount++;
          } else if (child.status === 'ruled-out') {
            ruledOutCount++;
          }
        }
      }
    }

    let qLine = `Questions: ${openCount} open, ${answeredCount} answered, ${ruledOutCount} ruled-out`;
    if (topOpenQuestion) {
      qLine += ` (priority: "${topOpenQuestion}")`;
    }
    lines.push(qLine);
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
