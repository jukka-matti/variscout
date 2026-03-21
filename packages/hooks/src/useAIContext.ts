/**
 * useAIContext - Assembles AI context from current analysis state.
 * Memoized to avoid excessive recomputation.
 */

import { useMemo } from 'react';
import { buildAIContext } from '@variscout/core';
import type {
  AIContext,
  ProcessContext,
  BuildAIContextOptions,
  InvestigationCategory,
  InsightChartType,
  StagedComparison,
  Locale,
  EntryScenario,
} from '@variscout/core';
import type {
  StatsResult,
  SpecLimits,
  Finding,
  Hypothesis,
  AnalysisMode,
  YamazumiSummary,
} from '@variscout/core';

export interface UseAIContextOptions {
  /** Whether AI is enabled */
  enabled: boolean;
  /** Process context from user settings */
  process?: ProcessContext;
  /** Current stats */
  stats?: StatsResult;
  /** Number of samples in current filtered dataset */
  sampleCount?: number;
  /** Current spec limits */
  specs?: SpecLimits;
  /** Active filters */
  filters?: Record<string, (string | number)[]>;
  /** Dynamic investigation categories */
  categories?: InvestigationCategory[];
  /** Control/spec violations */
  violations?: {
    outOfControl: number;
    aboveUSL: number;
    belowLSL: number;
    nelsonRule2Count?: number;
    nelsonRule3Count?: number;
  };
  /** Current findings */
  findings?: Finding[];
  /** Current hypotheses for investigation context */
  hypotheses?: Hypothesis[];
  /** Currently active/focused chart */
  activeChart?: InsightChartType;
  /** Variation contributions per factor (η²) */
  variationContributions?: Array<{ factor: string; etaSquared: number }>;
  /** Drill path: ordered factor names from filter stack */
  drillPath?: string[];
  /** Selected finding for context-aware suggestions */
  selectedFinding?: BuildAIContextOptions['selectedFinding'];
  /** Focus context from "Ask CoScout about this" actions */
  focusContext?: AIContext['focusContext'];
  /** Team contributor awareness (Teams plan only) */
  teamContributors?: AIContext['teamContributors'];
  /** Staged comparison result (when Before/After stages detected) */
  stagedComparison?: StagedComparison | null;
  /** Active locale for AI response language */
  locale?: Locale;
  /** Entry scenario for tool routing (ADR-029) */
  entryScenario?: EntryScenario;
  /** Current analysis mode */
  analysisMode?: AnalysisMode;
  /** Yamazumi summary stats */
  yamazumiSummary?: YamazumiSummary;
  /** Cumulative scope fraction from drill path (0-1) */
  cumulativeScope?: number;
  /** Enriched drill path with scope fractions */
  drillPathEnriched?: Array<{ factor: string; values: string[]; scopeFraction: number }>;
  /** Subgroup capability data (when capability mode is active) */
  capabilityData?: BuildAIContextOptions['capabilityData'];
}

export interface UseAIContextReturn {
  /** The assembled AI context, or null if AI is disabled */
  context: AIContext | null;
}

/**
 * Assembles a structured AI context from current analysis state.
 * Returns null when AI is disabled.
 */
export function useAIContext(options: UseAIContextOptions): UseAIContextReturn {
  const {
    enabled,
    process,
    stats,
    sampleCount,
    filters,
    categories,
    violations,
    findings,
    hypotheses,
    activeChart,
    variationContributions,
    drillPath,
    selectedFinding,
    focusContext,
    teamContributors,
    stagedComparison,
    locale,
    entryScenario,
    analysisMode,
    yamazumiSummary,
    cumulativeScope,
    drillPathEnriched,
    capabilityData,
  } = options;

  const context = useMemo<AIContext | null>(() => {
    if (!enabled) return null;

    const buildOptions: BuildAIContextOptions = {
      process,
      filters,
      categories,
      violations,
      findings,
      hypotheses,
      activeChart,
      variationContributions,
      drillPath,
      selectedFinding,
      focusContext,
      teamContributors,
      stagedComparison,
      locale,
      analysisMode,
      yamazumiSummary,
      cumulativeScope,
      drillPathEnriched,
      capabilityData,
    };

    // Map StatsResult to AIStatsInput
    if (stats) {
      buildOptions.stats = {
        mean: stats.mean,
        stdDev: stats.stdDev,
        count: sampleCount ?? 0,
        cp: stats.cp,
        cpk: stats.cpk,
        outOfSpecPercentage: stats.outOfSpecPercentage,
      };
    }

    const ctx = buildAIContext(buildOptions);
    if (ctx && entryScenario) {
      ctx.entryScenario = entryScenario;
    }
    return ctx;
  }, [
    enabled,
    process,
    stats,
    sampleCount,
    filters,
    categories,
    violations,
    findings,
    hypotheses,
    activeChart,
    variationContributions,
    drillPath,
    selectedFinding,
    focusContext,
    teamContributors,
    stagedComparison,
    locale,
    entryScenario,
    analysisMode,
    yamazumiSummary,
    cumulativeScope,
    drillPathEnriched,
    capabilityData,
  ]);

  return { context };
}
