/**
 * Assembles the structured AI context from current analysis state.
 */

import type { AIContext, ProcessContext, TargetMetric, InvestigationPhase } from './types';
import type { InsightChartType } from './chartInsights';
import type { Finding, Question, InvestigationCategory, SuspectedCause } from '../findings';
import type { StagedComparison } from '../stats/staged';
import { groupFindingsByStatus, getCategoryForFactor } from '../findings';
import { computeOptimum } from '../stats/safeMath';
import { buildGlossaryPrompt } from '../glossary/buildGlossaryPrompt';
import type { GlossaryCategory } from '../glossary/types';
import type { AnalysisMode } from '../types';
import type { YamazumiSummary } from '../yamazumi/types';
import type { SubgroupCapabilityResult, SubgroupConfig } from '../stats/subgroupCapability';
import type { Locale } from '../i18n/types';
import type { BestSubsetsResult } from '../stats/bestSubsets';

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
  /** Questions for investigation context */
  questions?: Question[];
  /** ID of the question currently focused in the PI panel */
  focusedQuestionId?: string;
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
  variationContributions?: Array<{
    factor: string;
    etaSquared: number;
    factorType?: 'categorical' | 'continuous';
    relationship?: 'linear' | 'quadratic';
    optimum?: number;
  }>;
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
    question?: string;
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
  /** Best subsets result for model equation context */
  bestSubsetsResult?: BestSubsetsResult;
  /** Maximum token budget for glossary (default 40 terms) */
  maxGlossaryTerms?: number;
  /** Locale for bilingual glossary and AI response language */
  locale?: Locale;
  /** Current analysis mode */
  analysisMode?: AnalysisMode;
  /** Suspected cause hubs from investigation */
  suspectedCauses?: SuspectedCause[];
  /** R²adj-weighted coverage percentage (0-100) */
  coveragePercent?: number;
  /** Number of questions that have been checked (answered or ruled-out) */
  questionsChecked?: number;
  /** Total number of questions in the investigation */
  questionsTotal?: number;
  /** Problem statement maturity stage */
  problemStatementStage?: 'partial' | 'actionable' | 'with-causes';
  /** Live problem statement text */
  liveStatement?: string;
  /** Yamazumi summary stats (when in yamazumi mode) */
  yamazumiSummary?: YamazumiSummary;
  /** Subgroup capability data (when capability mode is active) */
  capabilityData?: {
    subgroupResults: SubgroupCapabilityResult[];
    cpkStats: { mean: number; ucl: number; lcl: number } | null;
    cpStats: { mean: number } | null;
    config: SubgroupConfig;
    cpkTarget?: number;
  };
  /** Evidence Map topology for graph-aware CoScout reasoning */
  evidenceMapTopology?: NonNullable<AIContext['investigation']>['evidenceMapTopology'];
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
    questions,
    focusedQuestionId,
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
      return {
        ...vc,
        ...(cat ? { category: cat.name } : {}),
      };
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

  // Propagate analysis mode to AI context
  if (analysisMode) {
    context.analysisMode = analysisMode;
  }

  if (analysisMode === 'yamazumi' && yamazumiSummary) {
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
        cpkTarget: options.capabilityData.cpkTarget,
        subgroupsMeetingTarget:
          options.capabilityData.cpkTarget !== undefined
            ? cpkValues.filter(v => v >= options.capabilityData!.cpkTarget!).length
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

    const coscoutInsights = findings
      .filter(f => f.source?.chart === 'coscout')
      .map(f => ({ text: f.text, status: f.status }));

    // Top 5 findings by recency (most recent first)
    const topFindings = [...findings]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(f => {
        const cpkDelta =
          f.outcome?.cpkBefore !== undefined && f.outcome?.cpkAfter !== undefined
            ? f.outcome.cpkAfter - f.outcome.cpkBefore
            : undefined;
        return {
          id: f.id,
          text: f.text,
          status: f.status,
          commentCount: f.comments.length,
          ...(f.outcome
            ? {
                outcome: {
                  effective: f.outcome.effective,
                  ...(cpkDelta !== undefined ? { cpkDelta } : {}),
                },
              }
            : {}),
        };
      });

    // Overdue actions: uncompleted + past dueDate, top 3 most overdue
    const now = Date.now();
    const overdueActions: Array<{
      text: string;
      assignee?: string;
      daysOverdue: number;
      findingId: string;
    }> = [];

    for (const finding of findings) {
      for (const action of finding.actions ?? []) {
        if (!action.dueDate || action.completedAt) continue;
        const dueMs = new Date(action.dueDate).getTime();
        if (dueMs >= now) continue;
        const daysOverdue = Math.floor((now - dueMs) / 86400000);
        overdueActions.push({
          text: action.text,
          ...(action.assignee ? { assignee: action.assignee.displayName } : {}),
          daysOverdue,
          findingId: finding.id,
        });
      }
    }
    overdueActions.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const top3Overdue = overdueActions.slice(0, 3);

    context.findings = {
      total: findings.length,
      byStatus: Object.fromEntries(
        Object.entries(groups).map(([status, items]) => [status, items.length])
      ),
      keyDrivers,
      ...(coscoutInsights.length > 0 ? { coscoutInsights } : {}),
      topFindings,
      ...(top3Overdue.length > 0 ? { overdueActions: top3Overdue } : {}),
    };
  }

  // Add investigation context if issue/problem statement or questions exist
  if (
    process.issueStatement ||
    process.problemStatement ||
    (questions && questions.length > 0) ||
    investigationProgress ||
    selectedFinding ||
    focusedQuestionId ||
    options.evidenceMapTopology
  ) {
    context.investigation = {};

    if (process.issueStatement) {
      context.investigation.issueStatement = process.issueStatement;
    }

    if (process.problemStatement) {
      context.investigation.problemStatement = { fullText: process.problemStatement };
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

    if (questions && questions.length > 0) {
      context.investigation.allQuestions = questions.map(q => ({
        id: q.id,
        text: q.text,
        status: q.status,
        questionSource: q.questionSource,
        causeRole: q.causeRole,
        manualNote: q.manualNote,
        linkedFindingIds: q.linkedFindingIds,
        ideas:
          q.ideas && q.ideas.length > 0
            ? q.ideas.map(idea => ({
                text: idea.text,
                selected: idea.selected,
                projection: idea.projection
                  ? { meanDelta: idea.projection.meanDelta, sigmaDelta: idea.projection.sigmaDelta }
                  : undefined,
                category: idea.category,
                direction: idea.direction,
                timeframe: idea.timeframe,
                riskLevel: idea.risk?.computed,
              }))
            : undefined,
      }));

      // Build question tree for root questions with children
      const roots = questions.filter(q => !q.parentId);
      if (roots.length > 0) {
        context.investigation.questionTree = roots.map(root => {
          const children = questions.filter(q => q.parentId === root.id);
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
                    taskCompleted: c.validationTask ? c.status !== 'open' : undefined,
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
      context.investigation.phase = detectInvestigationPhase(questions, findings);

      // Collect ALL questions with a causeRole (suspected-cause, contributing, ruled-out)
      const suspectedCauses = questions
        .filter(q => q.causeRole)
        .map(q => ({
          id: q.id,
          text: q.text,
          causeRole: q.causeRole!,
          factor: q.factor,
          status: q.status,
          evidence: q.evidence,
        }));
      if (suspectedCauses.length > 0) {
        context.investigation.suspectedCauses = suspectedCauses;
      }

      // Wire focused question from PI panel
      if (focusedQuestionId) {
        context.investigation.focusedQuestionId = focusedQuestionId;
        const focusedQuestion = questions.find(q => q.id === focusedQuestionId);
        if (focusedQuestion) {
          context.investigation.focusedQuestionText = focusedQuestion.text;
        }
      }
    } else if (focusedQuestionId) {
      // focusedQuestionId provided without a questions list
      context.investigation.focusedQuestionId = focusedQuestionId;
    }

    // Suspected cause hubs (Phase 6 — CoScout as Investigation Partner)
    if (options.suspectedCauses && options.suspectedCauses.length > 0) {
      context.investigation.suspectedCauseHubs = options.suspectedCauses.map(hub => ({
        id: hub.id,
        name: hub.name,
        synthesis: hub.synthesis,
        status: hub.status,
        questionCount: hub.questionIds.length,
        findingCount: hub.findingIds.length,
        evidence: hub.evidence
          ? {
              value: hub.evidence.contribution.value,
              label: hub.evidence.contribution.label,
              description: hub.evidence.contribution.description,
            }
          : undefined,
        selectedForImprovement: hub.selectedForImprovement,
      }));
    }

    // Coverage and progress metrics
    if (options.coveragePercent !== undefined) {
      context.investigation.coveragePercent = options.coveragePercent;
    }
    if (options.questionsChecked !== undefined && options.questionsTotal !== undefined) {
      context.investigation.questionsChecked = options.questionsChecked;
      context.investigation.questionsTotal = options.questionsTotal;
    }

    // Problem statement maturity
    if (options.problemStatementStage) {
      context.investigation.problemStatementStage = options.problemStatementStage;
    }
    if (options.liveStatement) {
      context.investigation.liveStatement = options.liveStatement;
    }

    if (options.evidenceMapTopology) {
      // Enrich factor nodes with type metadata when bestSubsetsResult is available
      const topology = options.evidenceMapTopology;
      if (options.bestSubsetsResult?.factorTypes || options.bestSubsetsResult?.subsets.length) {
        const bestSubset = options.bestSubsetsResult?.subsets[0];
        const factorTypes = options.bestSubsetsResult?.factorTypes ?? bestSubset?.factorTypes;

        const enrichedNodes = topology.factorNodes.map(
          (node: (typeof topology.factorNodes)[number]) => {
            if (!factorTypes) return node;
            const factorType = factorTypes.get(node.factor);
            if (!factorType) return node;

            if (factorType === 'categorical') {
              return { ...node, type: 'categorical' as const };
            }

            // Continuous factor: extract range and relationship shape from best model
            if (bestSubset?.predictors) {
              const linearP = bestSubset.predictors.find(
                p => p.factorName === node.factor && p.type === 'continuous'
              );
              const quadraticP = bestSubset.predictors.find(
                p => p.factorName === node.factor && p.type === 'quadratic'
              );

              const relationship = quadraticP && quadraticP.pValue < 0.1 ? 'quadratic' : 'linear';

              // Estimate optimum via vertex of centered quadratic: x* = xbar - b1 / (2*b2)
              // Only meaningful when quadratic term is significant and both coefficients present
              let optimum: number | undefined;
              if (relationship === 'quadratic' && linearP && quadraticP) {
                optimum = computeOptimum(
                  linearP.coefficient,
                  quadraticP.coefficient,
                  quadraticP.mean ?? 0
                );
              }

              return {
                ...node,
                type: 'continuous' as const,
                relationship,
                ...(optimum !== undefined ? { optimum } : {}),
              };
            }

            return { ...node, type: 'continuous' as const };
          }
        );

        context.investigation.evidenceMapTopology = {
          ...topology,
          factorNodes: enrichedNodes as typeof topology.factorNodes,
        };
      } else {
        context.investigation.evidenceMapTopology = topology;
      }
    }
  }

  // Populate interaction effects from best subsets Pass 2 screening
  if (options.bestSubsetsResult?.subsets[0]?.interactionScreenResults) {
    const screenResults = options.bestSubsetsResult.subsets[0].interactionScreenResults;
    const significant = screenResults.filter(r => r.isSignificant);
    if (significant.length > 0) {
      if (!context.investigation) context.investigation = {};
      context.investigation.interactionEffects = significant.map(r => ({
        factors: r.factors,
        pattern: r.pattern,
        deltaRSquaredAdj: r.deltaRSquaredAdj,
        pValue: r.pValue,
        plainLanguage:
          r.pattern === 'disordinal'
            ? `${r.factors[0]} and ${r.factors[1]} — the ranking reverses across ${r.plotSeries} levels.`
            : `${r.factors[0]} and ${r.factors[1]} — the gap between ${r.plotSeries} levels changes at different ${r.plotXAxis} values.`,
      }));
    }
  }

  // Add best model equation when available
  if (options.bestSubsetsResult) {
    const topSubset = options.bestSubsetsResult.subsets[0];
    if (topSubset && topSubset.rSquaredAdj > 0.01) {
      // Convert Maps to Records for JSON serialization
      const levelEffects: Record<string, Record<string, number>> = {};
      for (const [factor, effects] of topSubset.levelEffects.entries()) {
        const rec: Record<string, number> = {};
        for (const [level, effect] of effects.entries()) {
          rec[level] = effect;
        }
        levelEffects[factor] = rec;
      }

      // Find worst and best cell means
      let worstKey = '';
      let bestKey = '';
      let worstMean = -Infinity;
      let bestMean = Infinity;
      for (const [key, { mean }] of topSubset.cellMeans.entries()) {
        if (mean > worstMean) {
          worstMean = mean;
          worstKey = key;
        }
        if (mean < bestMean) {
          bestMean = mean;
          bestKey = key;
        }
      }

      const buildLevels = (key: string): Record<string, string> => {
        const parts = key.split('\x00');
        const levels: Record<string, string> = {};
        topSubset.factors.forEach((f, i) => {
          levels[f] = parts[i];
        });
        return levels;
      };

      context.bestModelEquation = {
        factors: topSubset.factors,
        rSquaredAdj: topSubset.rSquaredAdj,
        levelEffects,
        worstCase: { levels: buildLevels(worstKey), predicted: worstMean },
        bestCase: { levels: buildLevels(bestKey), predicted: bestMean },
      };
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
 * Deterministic investigation phase detection based on question tree state.
 */
export function detectInvestigationPhase(
  questions: Question[],
  findings?: Finding[]
): InvestigationPhase {
  if (questions.length === 0) return 'initial';

  const hasChildren = questions.some(q => q.parentId);
  const answered = questions.filter(q => q.status !== 'open');
  const open = questions.filter(q => q.status === 'open');
  const hasActions =
    findings?.some(
      f =>
        (f.status === 'improving' || f.status === 'resolved') && f.actions && f.actions.length > 0
    ) ?? false;

  if (hasActions) return 'improving';
  if (answered.length > open.length) return 'converging';
  if (hasChildren && open.length >= answered.length) return 'diverging';
  if (answered.length > 0 && open.length > 0) return 'validating';

  // Roots only, mostly open
  return hasChildren ? 'diverging' : 'initial';
}
