/**
 * Assembles the structured AI context from current analysis state.
 */

import type { AIContext, ProcessContext, TargetMetric, InvestigationPhase } from './types';
import type { InsightChartType } from './chartInsights';
import type { Finding, Hypothesis, InvestigationCategory } from '../findings';
import type { StagedComparison } from '../stats/staged';
import { groupFindingsByStatus, getCategoryForFactor } from '../findings';
import { buildGlossaryPrompt } from '../glossary/buildGlossaryPrompt';
import type { GlossaryCategory } from '../glossary/types';
import type { AnalysisMode } from '../types';
import type { YamazumiSummary } from '../yamazumi/types';
import type { SubgroupCapabilityResult, SubgroupConfig } from '../stats/subgroupCapability';
import type { Locale } from '../i18n/types';

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
  /** Currently active/focused chart */
  activeChart?: InsightChartType;
  /** Variation contributions per factor (η²) */
  variationContributions?: Array<{ factor: string; etaSquared: number }>;
  /** Drill path: ordered factor names from filter stack */
  drillPath?: string[];
  /** Cumulative scope fraction (0-1) from drill path */
  cumulativeScope?: number;
  /** Enriched drill path with per-step scope fractions */
  drillPathEnriched?: Array<{ factor: string; values: string[]; scopeFraction: number }>;
  /** Selected finding for context-aware suggestions */
  selectedFinding?: {
    text: string;
    status?: string;
    hypothesis?: string;
    projection?: { meanDelta: number; sigmaDelta: number };
    actions?: Array<{ text: string; status: string; overdue?: boolean }>;
    actionProgress?: {
      total: number;
      done: number;
      overdueCount: number;
    };
  };
  /** Focus context from "Ask CoScout about this" actions */
  focusContext?: AIContext['focusContext'];
  /** Team contributor awareness (Teams plan only) */
  teamContributors?: AIContext['teamContributors'];
  /** Staged comparison result (when Before/After stages detected) */
  stagedComparison?: StagedComparison | null;
  /** Maximum token budget for glossary (default 40 terms) */
  maxGlossaryTerms?: number;
  /** Locale for bilingual glossary and AI response language */
  locale?: Locale;
  /** Current analysis mode */
  analysisMode?: AnalysisMode;
  /** Yamazumi summary stats (when in yamazumi mode) */
  yamazumiSummary?: YamazumiSummary;
  /** Subgroup capability data (when capability mode is active) */
  capabilityData?: {
    subgroupResults: SubgroupCapabilityResult[];
    cpkStats: { mean: number; ucl: number; lcl: number } | null;
    cpStats: { mean: number } | null;
    config: SubgroupConfig;
  };
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
    activeChart,
    variationContributions,
    drillPath,
    selectedFinding,
    focusContext,
    teamContributors,
    stagedComparison,
    maxGlossaryTerms = 40,
    locale,
    analysisMode,
    yamazumiSummary,
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
    glossaryFragment: buildGlossaryPrompt(glossaryCategories, maxGlossaryTerms, {
      includeConcepts: true,
      locale,
    }),
    locale,
  };

  // Derive factorRoles from investigation categories
  if (categoriesOpt && categoriesOpt.length > 0) {
    const roles: Record<string, string> = {};
    for (const cat of categoriesOpt) {
      for (const factor of cat.factorNames) {
        roles[factor] = cat.name;
      }
    }
    if (Object.keys(roles).length > 0) {
      context.process = { ...context.process, factorRoles: roles };
    }
  }

  if (activeChart) {
    context.activeChart = activeChart;
  }

  if (variationContributions && variationContributions.length > 0) {
    context.variationContributions = variationContributions.map(vc => {
      const cat = categoriesOpt ? getCategoryForFactor(categoriesOpt, vc.factor) : undefined;
      return cat ? { ...vc, category: cat.name } : vc;
    });
  }

  if (drillPath && drillPath.length > 0) {
    context.drillPath = drillPath;
  }

  if (options.cumulativeScope !== undefined) {
    context.cumulativeScope = options.cumulativeScope;
  }

  if (options.drillPathEnriched && options.drillPathEnriched.length > 0) {
    context.drillPathEnriched = options.drillPathEnriched;
  }

  if (analysisMode === 'yamazumi' && yamazumiSummary) {
    context.analysisMode = 'yamazumi';
    context.yamazumi = {
      vaRatio: yamazumiSummary.vaRatio,
      processEfficiency: yamazumiSummary.processEfficiency,
      totalLeadTime: yamazumiSummary.totalLeadTime,
      wasteTime: yamazumiSummary.wasteTime,
      waitTime: yamazumiSummary.waitTime,
      taktTime: yamazumiSummary.taktTime,
      stepsOverTakt: yamazumiSummary.stepsOverTakt,
    };
  }

  // Subgroup capability context (standard mode with capability toggle)
  if (analysisMode !== 'yamazumi' && options.capabilityData) {
    const { subgroupResults, cpkStats, cpStats, config } = options.capabilityData;
    const cpkValues = subgroupResults.map(r => r.cpk).filter((v): v is number => v !== undefined);
    const cpValues = subgroupResults.map(r => r.cp).filter((v): v is number => v !== undefined);

    if (cpkValues.length > 0 && cpkStats) {
      const cpkInControl = cpkValues.filter(v => v >= cpkStats.lcl && v <= cpkStats.ucl).length;
      context.capabilityStability = {
        method: config.method,
        column: config.column,
        subgroupSize: config.size,
        granularity: config.granularity,
        subgroupCount: cpkValues.length,
        meanCpk: cpkStats.mean,
        minCpk: Math.min(...cpkValues),
        maxCpk: Math.max(...cpkValues),
        cpkInControl,
        cpkOutOfControl: cpkValues.length - cpkInControl,
        meanCp: cpStats?.mean,
        centeringLoss:
          cpStats && cpValues.length > 0
            ? cpValues.reduce((a, b) => a + b, 0) / cpValues.length - cpkStats.mean
            : undefined,
      };
    }
  }

  if (focusContext) {
    context.focusContext = focusContext;
  }

  if (teamContributors && teamContributors.count > 0) {
    context.teamContributors = teamContributors;
  }

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
  if (
    process.problemStatement ||
    (hypotheses && hypotheses.length > 0) ||
    investigationProgress ||
    selectedFinding
  ) {
    context.investigation = {};

    if (process.problemStatement) {
      context.investigation.problemStatement = process.problemStatement;
    }

    if (selectedFinding) {
      context.investigation.selectedFinding = selectedFinding;
    }

    if (investigationProgress) {
      context.investigation.targetMetric = investigationProgress.targetMetric;
      context.investigation.targetValue = investigationProgress.targetValue;
      context.investigation.currentValue = investigationProgress.currentValue;
      context.investigation.progressPercent = investigationProgress.progressPercent;
    }

    if (hypotheses && hypotheses.length > 0) {
      context.investigation.allHypotheses = hypotheses.map(h => ({
        id: h.id,
        text: h.text,
        status: h.status,
        ideas:
          h.ideas && h.ideas.length > 0
            ? h.ideas.map(idea => ({
                text: idea.text,
                selected: idea.selected,
                projection: idea.projection
                  ? { meanDelta: idea.projection.meanDelta, sigmaDelta: idea.projection.sigmaDelta }
                  : undefined,
                category: idea.category,
              }))
            : undefined,
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
            id: root.id,
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
                    factor: c.factor,
                    level: c.level,
                    ideas:
                      c.ideas && c.ideas.length > 0
                        ? c.ideas.map(idea => ({ text: idea.text, selected: idea.selected }))
                        : undefined,
                    validationTask: c.validationTask,
                    taskCompleted: c.validationTask ? c.status !== 'untested' : undefined,
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

      // Build suspected cause from hypotheses with causeRole
      const primaryH = hypotheses.find(h => h.causeRole === 'primary');
      const contributingH = hypotheses.filter(h => h.causeRole === 'contributing');
      if (primaryH || contributingH.length > 0) {
        context.investigation.suspectedCause = {
          primary: primaryH
            ? { text: primaryH.text, factor: primaryH.factor, status: primaryH.status }
            : undefined,
          contributing: contributingH.map(h => ({
            text: h.text,
            factor: h.factor,
            status: h.status,
          })),
        };
      }
    }
  }

  // Add staged comparison when available
  if (stagedComparison) {
    context.stagedComparison = {
      stageNames: stagedComparison.stages.map(s => s.name),
      deltas: stagedComparison.deltas,
      colorCoding: stagedComparison.colorCoding,
      cpkBefore: stagedComparison.stages[0]?.stats.cpk,
      cpkAfter: stagedComparison.stages[stagedComparison.stages.length - 1]?.stats.cpk,
    };
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

  if (hasActions) return 'improving';
  if (tested.length > untested.length) return 'converging';
  if (hasChildren && untested.length >= tested.length) return 'diverging';
  if (tested.length > 0 && untested.length > 0) return 'validating';

  // Roots only, mostly untested
  return hasChildren ? 'diverging' : 'initial';
}
