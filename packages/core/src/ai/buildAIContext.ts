/**
 * Assembles the structured AI context from current analysis state.
 */

import type { AIContext, ProcessContext, FactorRole } from './types';
import type { Finding } from '../findings';
import { groupFindingsByStatus } from '../findings';
import { buildGlossaryPrompt } from '../glossary/buildGlossaryPrompt';
import type { GlossaryCategory } from '../glossary/types';

/** Stats input for AI context — extends StatsResult with app-level fields */
export interface AIStatsInput {
  mean: number;
  stdDev: number;
  /** Sample count (apps track this separately from StatsResult) */
  count: number;
  cp?: number;
  cpk?: number;
  /** Pass rate percentage (0-100). If not provided, derived from outOfSpecPercentage. */
  passRate?: number;
  /** From StatsResult — used to derive passRate if passRate not given */
  outOfSpecPercentage?: number;
}

export interface BuildAIContextOptions {
  process?: ProcessContext;
  stats?: AIStatsInput;
  filters?: Record<string, (string | number)[]>;
  factorRoles?: Record<string, FactorRole>;
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
    nelsonRule2Count?: number;
    nelsonRule3Count?: number;
  };
  findings?: Finding[];
  /** Maximum token budget for glossary (default 40 terms) */
  maxGlossaryTerms?: number;
}

/**
 * Build a structured AI context from the current analysis state.
 * Token-budget aware — keeps glossary compact for fast-tier models.
 */
export function buildAIContext(options: BuildAIContextOptions): AIContext {
  const {
    process = {},
    stats,
    filters = {},
    factorRoles = {},
    violations,
    findings,
    maxGlossaryTerms = 40,
  } = options;

  // Determine relevant glossary categories based on state
  const categories: GlossaryCategory[] = ['methodology'];
  if (stats?.cp !== undefined || stats?.cpk !== undefined) categories.push('capability');
  if (Object.keys(filters).length > 0) categories.push('statistics');
  if (findings && findings.length > 0) categories.push('investigation');

  const context: AIContext = {
    process,
    filters: Object.entries(filters).map(([factor, values]) => ({
      factor,
      values,
      role: factorRoles[factor],
    })),
    glossaryFragment: buildGlossaryPrompt(categories, maxGlossaryTerms),
  };

  if (stats) {
    const passRate =
      stats.passRate !== undefined
        ? stats.passRate
        : stats.outOfSpecPercentage !== undefined
          ? 100 - stats.outOfSpecPercentage
          : undefined;

    context.stats = {
      mean: stats.mean,
      stdDev: stats.stdDev,
      samples: stats.count,
      cpk: stats.cpk,
      cp: stats.cp,
      passRate,
    };
  }

  if (violations) {
    context.violations = violations;
  }

  if (findings && findings.length > 0) {
    const groups = groupFindingsByStatus(findings);
    const keyDrivers = findings
      .filter(f => f.tag === 'key-driver')
      .map(f => f.text)
      .filter(Boolean);

    context.findings = {
      total: findings.length,
      byStatus: Object.fromEntries(
        Object.entries(groups).map(([status, items]) => [status, items.length])
      ),
      keyDrivers,
    };
  }

  return context;
}
