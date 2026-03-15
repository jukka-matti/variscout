/**
 * Assembles the structured AI context from current analysis state.
 */

import type { AIContext, ProcessContext, TargetMetric, InvestigationPhase } from './types';
import type { Finding, Hypothesis, InvestigationCategory } from '../findings';
import { groupFindingsByStatus, getCategoryForFactor } from '../findings';
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
  /** Dynamic investigation categories */
  categories?: InvestigationCategory[];
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
    nelsonRule2Count?: number;
    nelsonRule3Count?: number;
  };
  findings?: Finding[];
  /** Hypotheses for investigation context */
  hypotheses?: Hypothesis[];
  /** Investigation progress data */
  investigationProgress?: {
    targetMetric: TargetMetric;
    targetValue: number;
    currentValue: number;
    progressPercent: number;
  };
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
    categories: categoriesOpt,
    violations,
    findings,
    hypotheses,
    investigationProgress,
    maxGlossaryTerms = 40,
  } = options;

  // Determine relevant glossary categories based on state
  const glossaryCategories: GlossaryCategory[] = ['methodology'];
  if (stats?.cp !== undefined || stats?.cpk !== undefined) glossaryCategories.push('capability');
  if (Object.keys(filters).length > 0) glossaryCategories.push('statistics');
  if (findings && findings.length > 0) glossaryCategories.push('investigation');

  const context: AIContext = {
    process,
    filters: Object.entries(filters).map(([factor, values]) => {
      const cat = categoriesOpt ? getCategoryForFactor(categoriesOpt, factor) : undefined;
      return {
        factor,
        values,
        category: cat?.name,
      };
    }),
    glossaryFragment: buildGlossaryPrompt(glossaryCategories, maxGlossaryTerms),
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

  // Add investigation context if problem statement or hypotheses exist
  if (process.problemStatement || (hypotheses && hypotheses.length > 0) || investigationProgress) {
    context.investigation = {};

    if (process.problemStatement) {
      context.investigation.problemStatement = process.problemStatement;
    }

    if (investigationProgress) {
      context.investigation.targetMetric = investigationProgress.targetMetric;
      context.investigation.targetValue = investigationProgress.targetValue;
      context.investigation.currentValue = investigationProgress.currentValue;
      context.investigation.progressPercent = investigationProgress.progressPercent;
    }

    if (hypotheses && hypotheses.length > 0) {
      context.investigation.allHypotheses = hypotheses.map(h => ({
        text: h.text,
        status: h.status,
      }));

      // Build hypothesis tree for root hypotheses with children
      const roots = hypotheses.filter(h => !h.parentId);
      if (roots.length > 0) {
        context.investigation.hypothesisTree = roots.map(root => {
          const children = hypotheses.filter(h => h.parentId === root.id);
          const cat =
            root.factor && categoriesOpt
              ? getCategoryForFactor(categoriesOpt, root.factor)
              : undefined;
          return {
            text: root.text,
            status: root.status,
            factor: root.factor,
            category: cat?.name,
            validationType: root.validationType,
            children:
              children.length > 0
                ? children.map(c => ({
                    text: c.text,
                    status: c.status,
                    validationType: c.validationType,
                  }))
                : undefined,
          };
        });
      }

      // Add categories for completeness prompting
      if (categoriesOpt && categoriesOpt.length > 0) {
        context.investigation.categories = categoriesOpt.map(c => ({
          name: c.name,
          factorNames: c.factorNames,
        }));
      }

      // Detect investigation phase
      context.investigation.phase = detectInvestigationPhase(hypotheses, findings);
    }
  }

  return context;
}

/**
 * Deterministic investigation phase detection based on hypothesis tree state.
 */
export function detectInvestigationPhase(
  hypotheses: Hypothesis[],
  findings?: Finding[]
): InvestigationPhase {
  if (hypotheses.length === 0) return 'initial';

  const hasChildren = hypotheses.some(h => h.parentId);
  const tested = hypotheses.filter(h => h.status !== 'untested');
  const untested = hypotheses.filter(h => h.status === 'untested');
  const hasActions = findings?.some(f => f.actions && f.actions.length > 0) ?? false;

  if (hasActions) return 'acting';
  if (tested.length > untested.length) return 'converging';
  if (hasChildren && untested.length >= tested.length) return 'diverging';
  if (tested.length > 0 && untested.length > 0) return 'validating';

  // Roots only, mostly untested
  return hasChildren ? 'diverging' : 'initial';
}
