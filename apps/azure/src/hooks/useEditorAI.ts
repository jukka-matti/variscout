/**
 * useEditorAI - Extracted AI orchestration from Editor.tsx
 *
 * Composes AI hooks (context, narration, CoScout, knowledge search)
 * and computes derived state for the AI-enhanced editing experience.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useAIContext,
  useNarration,
  useAICoScout,
  useKnowledgeSearch,
  type UseAICoScoutReturn,
  type UseNarrationReturn,
  type UseAIContextReturn,
  type UseKnowledgeSearchReturn,
  type DrillStep,
} from '@variscout/hooks';
import type { ViewState } from '@variscout/hooks';
import type { FilterAction } from '@variscout/core';
import {
  hasTeamFeatures,
  buildSuggestedQuestions,
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  calculateFactorVariations,
  type StatsResult,
  type SpecLimits,
  type DataRow,
  type Finding,
  type Hypothesis,
  type AIContext,
  type ProcessContext,
  type InsightChartType,
} from '@variscout/core';
import {
  fetchNarration as fetchNarrationFromAI,
  fetchChartInsight as fetchChartInsightFromAI,
  fetchCoScoutResponse,
  fetchCoScoutStreamingResponse,
  isAIAvailable,
  getAIProviderLabel,
} from '../services/aiService';
import type { AIPreferences } from '../context/DataContext';
import {
  searchRelatedFindings,
  searchDocuments,
  isKnowledgeBaseAvailable,
} from '../services/searchService';
import { updateFindingsPopout } from '@variscout/ui';

export interface UseEditorAIOptions {
  enabled: boolean;
  aiPreferences?: AIPreferences;
  stats?: StatsResult;
  filteredData: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  hypotheses: Hypothesis[];
  factors: string[];
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  processContext?: ProcessContext;
  highlightedFindingId?: string | null;
  viewState?: ViewState | null;
  columnAliases: Record<string, string>;
  categories?: import('@variscout/core').InvestigationCategory[];
  drillPath: DrillStep[];
  persistedHypotheses?: Hypothesis[];
  onOpenCoScout: () => void;
  onOpenFindings: () => void;
}

/** Summary of AI context for transparency disclosure in CoScout */
export interface AIContextSummary {
  stats: string;
  filterCount: number;
  findingCount: number;
  phase?: string;
}

export interface UseEditorAIReturn {
  aiContext: UseAIContextReturn;
  narration: UseNarrationReturn;
  coscout: UseAICoScoutReturn;
  knowledgeSearch: UseKnowledgeSearchReturn;
  suggestedQuestions: string[];
  fetchChartInsight: ((userPrompt: string) => Promise<string>) | undefined;
  handleNarrativeAsk: () => void;
  handleAskCoScoutFromIdeas: (question: string) => void;
  handleAskCoScoutFromFinding: (ctx: AIContext['focusContext']) => void;
  handleAskCoScoutFromCategory: (ctx: AIContext['focusContext']) => void;
  providerLabel: string | null;
  aiContextSummary: AIContextSummary | null;
}

export function useEditorAI({
  enabled,
  aiPreferences,
  stats,
  filteredData,
  outcome,
  specs,
  findings,
  hypotheses,
  factors,
  filters,
  filterStack,
  processContext,
  highlightedFindingId,
  viewState,
  columnAliases,
  categories,
  drillPath,
  persistedHypotheses,
  onOpenCoScout,
  onOpenFindings,
}: UseEditorAIOptions): UseEditorAIReturn {
  const aiAvailable = enabled && isAIAvailable();

  // Per-component preferences (default all on)
  const prefs = aiPreferences ?? { narration: true, insights: true, coscout: true };

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
    const fv = calculateFactorVariations(filteredData, factors, outcome, []);
    return Array.from(fv.entries()).map(([factor, etaSquared]) => ({ factor, etaSquared }));
  }, [filteredData, factors, outcome]);

  // Selected finding for AI context (when highlighted in FindingsPanel)
  const aiSelectedFinding = useMemo(() => {
    if (!highlightedFindingId || !findings) return undefined;
    const f = findings.find(fi => fi.id === highlightedFindingId);
    if (!f) return undefined;
    const hypothesis = f.hypothesisId ? hypotheses.find(h => h.id === f.hypothesisId) : undefined;
    return {
      text: f.text,
      hypothesis: hypothesis?.text,
      projection: f.projection
        ? {
            meanDelta: f.projection.projectedMean - f.projection.baselineMean,
            sigmaDelta: f.projection.projectedSigma - f.projection.baselineSigma,
          }
        : undefined,
      actions: f.actions?.map(a => ({ text: a.text, status: a.completedAt ? 'done' : 'pending' })),
    };
  }, [highlightedFindingId, findings, hypotheses]);

  // Team contributors for AI context (Teams plan only)
  const aiTeamContributors = useMemo(() => {
    if (!hasTeamFeatures() || !findings) return undefined;
    const authors = new Set<string>();
    const areas = new Set<string>();
    for (const f of findings) {
      if (f.assignee?.displayName) authors.add(f.assignee.displayName);
      for (const c of f.comments ?? []) {
        if (c.author) authors.add(c.author);
      }
      if (f.hypothesisId) {
        const h = hypotheses.find(hy => hy.id === f.hypothesisId);
        if (h?.factor) areas.add(h.factor);
      }
    }
    if (authors.size === 0) return undefined;
    return { count: authors.size, hypothesisAreas: Array.from(areas) };
  }, [findings, hypotheses]);

  // Focus context state for "Ask CoScout about this" actions
  const [focusContext, setFocusContext] = useState<AIContext['focusContext']>(undefined);

  // AI context
  const aiContext = useAIContext({
    enabled: aiAvailable,
    process: processContext,
    stats: stats ?? undefined,
    sampleCount: filteredData.length,
    specs: specs ?? undefined,
    filters,
    categories,
    violations: violationCounts,
    findings,
    hypotheses,
    activeChart: viewState?.focusedChart as InsightChartType | undefined,
    variationContributions: aiVariationContributions,
    drillPath: filterStack.filter(a => a.type === 'filter' && a.factor).map(a => a.factor!),
    selectedFinding: aiSelectedFinding,
    focusContext,
    teamContributors: aiTeamContributors,
  });

  // AI narration (disabled when per-component toggle is off)
  const narration = useNarration({
    context: aiContext.context,
    fetchNarration: aiAvailable && prefs.narration ? fetchNarrationFromAI : undefined,
  });

  // Knowledge Base search (Team AI preview)
  const knowledgeSearch = useKnowledgeSearch({
    searchFn: searchRelatedFindings,
    searchDocumentsFn: searchDocuments,
    enabled: isKnowledgeBaseAvailable(),
  });

  // AI CoScout conversation (disabled when per-component toggle is off)
  const coscout = useAICoScout({
    context: aiContext.context,
    fetchResponse: aiAvailable && prefs.coscout ? fetchCoScoutResponse : undefined,
    fetchStreamingResponse:
      aiAvailable && prefs.coscout ? fetchCoScoutStreamingResponse : undefined,
    initialNarrative: narration.narrative,
    onBeforeSend: isKnowledgeBaseAvailable()
      ? async (text, ctx) => {
          const results = await knowledgeSearch.search(text);
          ctx.knowledgeResults = results.map(r => ({
            projectName: r.projectName,
            factor: r.factor,
            status: r.status,
            etaSquared: r.etaSquared,
            cpkBefore: r.cpkBefore,
            cpkAfter: r.cpkAfter,
            suspectedCause: r.suspectedCause,
            actionsText: r.actionsText,
            outcomeEffective: r.outcomeEffective,
          }));
          if (knowledgeSearch.documents.length > 0) {
            ctx.knowledgeDocuments = knowledgeSearch.documents.map(d => ({
              title: d.title,
              snippet: d.snippet,
              source: d.source,
              url: d.url,
            }));
          }
        }
      : undefined,
  });

  const suggestedQuestions = useMemo(
    () => (aiContext.context ? buildSuggestedQuestions(aiContext.context) : []),
    [aiContext.context]
  );

  // Sync AI-derived fields to popout (phase + suggested questions arrive after orchestration hook)
  useEffect(() => {
    const phase = aiContext.context?.investigation?.phase;
    if (!phase && suggestedQuestions.length === 0) return;
    updateFindingsPopout(findings, columnAliases, drillPath, {
      hypotheses: persistedHypotheses,
      processContext,
      currentValue: stats?.cpk ?? stats?.mean,
      investigationPhase: phase,
      suggestedQuestions,
      factorRoles: processContext?.factorRoles,
      aiAvailable,
    });
  }, [
    aiContext.context?.investigation?.phase,
    suggestedQuestions,
    findings,
    columnAliases,
    drillPath,
    persistedHypotheses,
    processContext,
    stats,
    aiAvailable,
  ]);

  const handleNarrativeAsk = useCallback(() => {
    onOpenCoScout();
  }, [onOpenCoScout]);

  // Ask CoScout from improvement ideas section
  const handleAskCoScoutFromIdeas = useCallback(
    (question: string) => {
      onOpenCoScout();
      setTimeout(() => {
        coscout.send(question);
      }, 100);
    },
    [onOpenCoScout, coscout]
  );

  // Ask CoScout about a specific finding (from FindingCard)
  const handleAskCoScoutFromFinding = useCallback(
    (ctx: AIContext['focusContext']) => {
      setFocusContext(ctx);
      onOpenFindings();
      const findingText = ctx?.finding?.text;
      if (findingText) {
        setTimeout(() => {
          coscout.send(`What should I investigate about this finding: "${findingText}"?`);
        }, 100);
      }
    },
    [onOpenFindings, coscout]
  );

  // Ask CoScout about a category (from MobileCategorySheet)
  const handleAskCoScoutFromCategory = useCallback(
    (ctx: AIContext['focusContext']) => {
      setFocusContext(ctx);
      onOpenCoScout();
      const catName = ctx?.category?.name;
      if (catName) {
        setTimeout(() => {
          coscout.send(`What can you tell me about "${catName}"?`);
        }, 100);
      }
    },
    [onOpenCoScout, coscout]
  );

  // Provider label for CoScout header (T3)
  const providerLabel = useMemo(() => (aiAvailable ? getAIProviderLabel() : null), [aiAvailable]);

  // AI context summary for transparency disclosure (T1)
  const aiContextSummary = useMemo((): AIContextSummary | null => {
    const ctx = aiContext.context;
    if (!ctx) return null;
    const statsStr = ctx.stats
      ? `n=${ctx.stats.samples}${ctx.stats.cpk !== undefined ? `, Cpk=${ctx.stats.cpk.toFixed(2)}` : ''}`
      : 'No data';
    return {
      stats: statsStr,
      filterCount: ctx.filters.length,
      findingCount: ctx.findings?.total ?? 0,
      phase: ctx.investigation?.phase,
    };
  }, [aiContext.context]);

  return {
    aiContext,
    narration,
    coscout,
    knowledgeSearch,
    suggestedQuestions,
    fetchChartInsight: aiAvailable && prefs.insights ? fetchChartInsightFromAI : undefined,
    handleNarrativeAsk,
    handleAskCoScoutFromIdeas,
    handleAskCoScoutFromFinding,
    handleAskCoScoutFromCategory,
    providerLabel,
    aiContextSummary,
  };
}
