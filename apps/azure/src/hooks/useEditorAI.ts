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
  buildSuggestedQuestions,
  type StatsResult,
  type SpecLimits,
  type DataRow,
  type Finding,
  type Hypothesis,
  type AIContext,
  type ProcessContext,
  type InsightChartType,
  type StagedStatsResult,
  type Locale,
} from '@variscout/core';
import { useAIDerivedState } from './useAIDerivedState';
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
  stagedStats?: StagedStatsResult | null;
  drillPath: DrillStep[];
  persistedHypotheses?: Hypothesis[];
  locale?: Locale;
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
  stagedStats,
  drillPath,
  persistedHypotheses,
  locale,
  onOpenCoScout,
  onOpenFindings,
}: UseEditorAIOptions): UseEditorAIReturn {
  const aiAvailable = enabled && isAIAvailable();

  // Per-component preferences (default all on)
  const prefs = aiPreferences ?? { narration: true, insights: true, coscout: true };

  // AI-specific derived state (violations, contributions, selected finding, team, staged)
  const {
    violationCounts,
    aiVariationContributions,
    aiSelectedFinding,
    aiTeamContributors,
    stagedComparison,
  } = useAIDerivedState({
    stats,
    filteredData,
    outcome,
    specs,
    findings,
    hypotheses,
    factors,
    highlightedFindingId,
    stagedStats,
  });

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
    stagedComparison,
    locale,
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
        let question = `What should I investigate about this finding: "${findingText}"?`;
        const ideas = ctx?.finding?.ideas;
        if (ideas && ideas.length > 0) {
          const ideaTexts = ideas
            .slice(0, 5)
            .map(i => i.text)
            .join(', ');
          question += ` Existing ideas: ${ideaTexts}`;
        }
        setTimeout(() => {
          coscout.send(question);
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
    fetchChartInsight:
      aiAvailable && prefs.insights
        ? (userPrompt: string) => fetchChartInsightFromAI(userPrompt, locale)
        : undefined,
    handleNarrativeAsk,
    handleAskCoScoutFromIdeas,
    handleAskCoScoutFromFinding,
    handleAskCoScoutFromCategory,
    providerLabel,
    aiContextSummary,
  };
}
