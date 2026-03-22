/**
 * useAIOrchestration - AI orchestration hook replacing useEditorAI.
 *
 * Composes AI hooks (context, narration, CoScout, knowledge search, tool handlers)
 * and syncs derived state to the aiStore. Uses the Responses API exclusively (ADR-028).
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useAIContext,
  useNarration,
  useAICoScout,
  useKnowledgeSearch,
  useTranslation,
  type UseAICoScoutReturn,
  type UseNarrationReturn,
  type UseAIContextReturn,
  type UseKnowledgeSearchReturn,
  type DrillStep,
} from '@variscout/hooks';
import type { ViewState } from '@variscout/hooks';
import type {
  FilterAction,
  JourneyPhase,
  EntryScenario,
  BuildAIContextOptions,
  AIContext,
  InsightChartType,
  Locale,
} from '@variscout/core';
import {
  buildSuggestedQuestions,
  type StatsResult,
  type SpecLimits,
  type DataRow,
  type Finding,
  type Hypothesis,
  type ProcessContext,
  type StagedStatsResult,
} from '@variscout/core';
import { isTeamPlan } from '@variscout/core';
import { useAIDerivedState } from './useAIDerivedState';
import { useToolHandlers } from './useToolHandlers';
import { useAIStore, type AIContextSummary } from './aiStore';
import type { ResponsesApiConfig } from '@variscout/core';
import {
  fetchNarration as fetchNarrationFromAI,
  fetchChartInsight as fetchChartInsightFromAI,
  isAIAvailable,
  getAIProviderLabel,
  getResponsesApiConfig,
} from '../../services/aiService';
import type { AIPreferences } from '../../context/DataContext';
import {
  searchDocuments,
  isKnowledgeBaseAvailable,
  checkKnowledgeBasePermissions,
} from '../../services/searchService';
import { getChannelDriveInfo } from '../../services/channelDrive';
import { getGraphToken } from '../../auth/graphToken';
import { updateFindingsPopout } from '@variscout/ui';

// ── Options ─────────────────────────────────────────────────────────────────

export interface UseAIOrchestrationOptions {
  enabled: boolean;
  aiPreferences?: AIPreferences;
  stats?: StatsResult;
  filteredData: DataRow[];
  rawData?: DataRow[];
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
  knowledgeSearchFolder?: string;
  journeyPhase?: JourneyPhase;
  entryScenario?: EntryScenario;
  capabilityData?: BuildAIContextOptions['capabilityData'];
  onOpenCoScout: () => void;
  onOpenFindings: () => void;
}

// ── Return ──────────────────────────────────────────────────────────────────

export interface UseAIOrchestrationReturn {
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
  resolvedChannelFolderUrl?: string;
  knowledgeSearchScope?: string;
  knowledgeSearchTimestamp?: number;
  kbPermissionWarning: boolean;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAIOrchestration({
  enabled,
  aiPreferences,
  stats,
  filteredData,
  rawData,
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
  knowledgeSearchFolder,
  journeyPhase,
  entryScenario,
  capabilityData,
  onOpenCoScout,
  onOpenFindings,
}: UseAIOrchestrationOptions): UseAIOrchestrationReturn {
  const { formatStat } = useTranslation();
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

  // Responses API config (resolved async)
  const [responsesConfig, setResponsesConfig] = useState<ResponsesApiConfig | undefined>(undefined);
  useEffect(() => {
    if (!aiAvailable) return;
    let cancelled = false;
    getResponsesApiConfig('reasoning').then(config => {
      if (!cancelled) setResponsesConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, [aiAvailable]);

  // Auto-resolve channel folder URL for default knowledge search scope (ADR-026)
  const [resolvedChannelFolderUrl, setResolvedChannelFolderUrl] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    if (!aiAvailable || knowledgeSearchFolder !== undefined) return;
    let cancelled = false;
    getGraphToken()
      .then(token => getChannelDriveInfo(token))
      .then(info => {
        if (!cancelled && info?.folderWebUrl) {
          setResolvedChannelFolderUrl(info.folderWebUrl);
        }
      })
      .catch(() => {
        // Non-critical — search will work without folder scope
      });
    return () => {
      cancelled = true;
    };
  }, [aiAvailable, knowledgeSearchFolder]);

  // Admin consent runtime check for KB (Item 4)
  const [kbPermissionWarning, setKbPermissionWarning] = useState(false);
  useEffect(() => {
    if (!isKnowledgeBaseAvailable()) return;
    checkKnowledgeBasePermissions().then(result => {
      if (result.available && !result.hasSharePointAccess) setKbPermissionWarning(true);
    });
  }, []);

  // Effective folder scope: explicit user setting > auto-resolved channel folder
  const effectiveFolderScope = knowledgeSearchFolder ?? resolvedChannelFolderUrl;

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
    entryScenario,
    capabilityData,
  });

  // AI narration (disabled when per-component toggle is off)
  const narration = useNarration({
    context: aiContext.context,
    fetchNarration: aiAvailable && prefs.narration ? fetchNarrationFromAI : undefined,
  });

  // Knowledge Base search — on-demand via CoScout UI (ADR-026)
  const knowledgeSearch = useKnowledgeSearch({
    searchDocumentsFn: searchDocuments,
    enabled: isKnowledgeBaseAvailable(),
    folderScope: effectiveFolderScope,
  });

  // Build tool handlers for CoScout function calling (ADR-028, ADR-029)
  const toolHandlers = useToolHandlers({
    aiAvailable,
    coscoutEnabled: prefs.coscout,
    stats,
    filteredData,
    rawData,
    outcome,
    specs,
    findings,
    hypotheses,
    factors,
    filters,
    filterStack,
    knowledgeSearch,
  });

  // Tool phase-gating options (ADR-029)
  const toolsOptions = useMemo(
    () => ({
      phase: journeyPhase,
      isTeamPlan: isTeamPlan(),
    }),
    [journeyPhase]
  );

  // AI CoScout conversation (disabled when per-component toggle is off)
  const coscout = useAICoScout({
    context: aiContext.context,
    initialNarrative: narration.narrative,
    responsesApiConfig: aiAvailable && prefs.coscout ? responsesConfig : undefined,
    toolHandlers,
    toolsOptions,
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
      ? `n=${ctx.stats.samples}${ctx.stats.cpk !== undefined ? `, Cpk=${formatStat(ctx.stats.cpk)}` : ''}`
      : 'No data';
    return {
      stats: statsStr,
      filterCount: ctx.filters.length,
      findingCount: ctx.findings?.total ?? 0,
      phase: ctx.investigation?.phase,
    };
  }, [aiContext.context, formatStat]);

  // Knowledge search scope label (Item 3)
  const knowledgeSearchScope = useMemo(() => {
    if (!effectiveFolderScope) return undefined;
    try {
      const url = new URL(effectiveFolderScope);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'Channel folder';
    } catch {
      return effectiveFolderScope.split('/').pop() || 'Channel folder';
    }
  }, [effectiveFolderScope]);

  // ── Sync to aiStore ──────────────────────────────────────────────────────
  const store = useAIStore;

  useEffect(() => {
    store.getState().syncNarration({
      narrative: narration.narrative,
      isLoading: narration.isLoading,
      isCached: narration.isCached,
      error: narration.error,
    });
  }, [narration.narrative, narration.isLoading, narration.isCached, narration.error, store]);

  useEffect(() => {
    store.getState().syncCoScoutMessages(coscout.messages);
  }, [coscout.messages, store]);

  useEffect(() => {
    store.getState().syncSuggestedQuestions(suggestedQuestions);
  }, [suggestedQuestions, store]);

  useEffect(() => {
    store.getState().syncAIContext(aiContextSummary);
  }, [aiContextSummary, store]);

  useEffect(() => {
    store.getState().setProviderLabel(providerLabel);
  }, [providerLabel, store]);

  useEffect(() => {
    store.getState().setKbPermissionWarning(kbPermissionWarning);
  }, [kbPermissionWarning, store]);

  useEffect(() => {
    store.getState().setResolvedChannelFolderUrl(resolvedChannelFolderUrl);
  }, [resolvedChannelFolderUrl, store]);

  useEffect(() => {
    store.getState().setKnowledgeSearchScope(knowledgeSearchScope);
  }, [knowledgeSearchScope, store]);

  useEffect(() => {
    store.getState().setKnowledgeSearchTimestamp(knowledgeSearch.lastSearchTimestamp);
  }, [knowledgeSearch.lastSearchTimestamp, store]);

  useEffect(() => {
    store.getState().syncKnowledgeSearch({
      isAvailable: knowledgeSearch.isAvailable,
      isSearching: knowledgeSearch.isSearching,
      documents: knowledgeSearch.documents,
    });
  }, [knowledgeSearch.isAvailable, knowledgeSearch.isSearching, knowledgeSearch.documents, store]);

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
    resolvedChannelFolderUrl,
    knowledgeSearchScope,
    knowledgeSearchTimestamp: knowledgeSearch.lastSearchTimestamp,
    kbPermissionWarning,
  };
}
