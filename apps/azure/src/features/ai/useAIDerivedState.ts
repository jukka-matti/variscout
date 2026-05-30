/**
 * useAIDerivedState - AI-specific derived state.
 *
 * Computes violation counts, variation contributions, selected finding context,
 * team contributors, and staged comparison from raw analysis data.
 */
import { useMemo } from 'react';
import {
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  getEtaSquared,
  calculateStagedComparison,
  type StatsResult,
  type SpecLimits,
  type DataRow,
  type Finding,
  type Hypothesis,
  type AIContext,
  type StagedStatsResult,
} from '@variscout/core';

export interface UseAIDerivedStateOptions {
  stats?: StatsResult;
  filteredData: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  /** Hypothesis hubs (the suspected causes) — IM-1: replaces the retired questions. */
  hypotheses: Hypothesis[];
  factors: string[];
  highlightedFindingId?: string | null;
  stagedStats?: StagedStatsResult | null;
}

export interface UseAIDerivedStateReturn {
  violationCounts: AIContext['violations'];
  aiVariationContributions: Array<{ factor: string; etaSquared: number }> | undefined;
  aiSelectedFinding: NonNullable<AIContext['investigation']>['selectedFinding'] | undefined;
  aiTeamContributors: AIContext['teamContributors'];
  stagedComparison: ReturnType<typeof calculateStagedComparison> | null;
}

export function useAIDerivedState({
  stats,
  filteredData,
  outcome,
  specs,
  findings,
  hypotheses,
  factors,
  highlightedFindingId,
  stagedStats,
}: UseAIDerivedStateOptions): UseAIDerivedStateReturn {
  // Aggregate violation counts for AI narration context
  const violationCounts = useMemo(() => {
    if (!outcome || !stats || filteredData.length === 0) return undefined;

    const values = filteredData
      .map(r => {
        const v = r[outcome];
        return typeof v === 'number' ? v : parseFloat(String(v));
      })
      .filter(v => !isNaN(v));
    if (values.length === 0) return undefined;

    const outOfControl = values.filter(v => v > stats.ucl || v < stats.lcl).length;
    const aboveUSL = specs?.usl !== undefined ? values.filter(v => v > specs.usl!).length : 0;
    const belowLSL = specs?.lsl !== undefined ? values.filter(v => v < specs.lsl!).length : 0;

    const rule2Sequences = getNelsonRule2Sequences(values, stats.mean);
    const rule3Sequences = getNelsonRule3Sequences(values);

    return {
      outOfControl,
      aboveUSL,
      belowLSL,
      nelsonRule2Count: rule2Sequences.length,
      nelsonRule3Count: rule3Sequences.length,
    };
  }, [filteredData, outcome, stats, specs]);

  // Variation contributions for AI context (factor-level eta-squared)
  const aiVariationContributions = useMemo(() => {
    if (!outcome || filteredData.length < 2 || factors.length === 0) return undefined;
    return factors.map(factor => ({
      factor,
      etaSquared: getEtaSquared(filteredData, factor, outcome),
    }));
  }, [filteredData, factors, outcome]);

  // Selected finding for AI context (when highlighted in FindingsPanel)
  const aiSelectedFinding = useMemo(() => {
    if (!highlightedFindingId || !findings) return undefined;
    const f = findings.find(fi => fi.id === highlightedFindingId);
    if (!f) return undefined;
    // IM-1: findings link to a hypothesis hub via Hypothesis.findingIds.
    const hub = hypotheses.find(h => h.findingIds.includes(f.id));

    // eslint-disable-next-line react-hooks/purity -- Date.now() intentional for overdue calculation
    const now = Date.now();
    const actions = f.actions?.map(a => ({
      text: a.text,
      status: a.completedAt ? 'done' : 'pending',
      overdue: !a.completedAt && a.dueDate ? new Date(a.dueDate).getTime() < now : undefined,
    }));

    const total = actions?.length ?? 0;
    const done = actions?.filter(a => a.status === 'done').length ?? 0;
    const overdueCount = actions?.filter(a => a.overdue).length ?? 0;

    return {
      text: f.text,
      status: f.status,
      question: hub?.name,
      projection: f.projection
        ? {
            meanDelta: f.projection.projectedMean - f.projection.baselineMean,
            sigmaDelta: f.projection.projectedSigma - f.projection.baselineSigma,
          }
        : undefined,
      actions,
      actionProgress: total > 0 ? { total, done, overdueCount } : undefined,
    };
  }, [highlightedFindingId, findings, hypotheses]);

  // Team contributors for AI context
  const aiTeamContributors = useMemo(() => {
    if (!findings) return undefined;
    const authors = new Set<string>();
    const areas = new Set<string>();
    for (const f of findings) {
      if (f.assignee?.displayName) authors.add(f.assignee.displayName);
      for (const c of f.comments ?? []) {
        if (c.author) authors.add(c.author);
      }
      // IM-1: investigation "area" derives from the owning hypothesis hub's name.
      const hub = hypotheses.find(hy => hy.findingIds.includes(f.id));
      if (hub?.name) areas.add(hub.name);
    }
    if (authors.size === 0) return undefined;
    return { count: authors.size, questionAreas: Array.from(areas) };
  }, [findings, hypotheses]);

  // Staged comparison for AI verification narrative
  const stagedComparison = useMemo(
    () => (stagedStats ? calculateStagedComparison(stagedStats) : null),
    [stagedStats]
  );

  return {
    violationCounts,
    aiVariationContributions,
    aiSelectedFinding,
    aiTeamContributors,
    stagedComparison,
  };
}
