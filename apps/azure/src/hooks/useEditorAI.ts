/**
 * useEditorAI - Extracted AI orchestration from Editor.tsx
 *
 * Composes AI hooks (context, narration, CoScout, knowledge search)
 * and computes derived state for the AI-enhanced editing experience.
 * Uses the Responses API exclusively (ADR-028).
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
import type { FilterAction, ToolHandlerMap, JourneyPhase, EntryScenario } from '@variscout/core';
import {
  buildSuggestedQuestions,
  formatKnowledgeContext,
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
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
  type ActionProposal,
} from '@variscout/core';
import { getEtaSquared, groupDataByFactor } from '@variscout/core';
import { calculateStats } from '@variscout/core';
import { isTeamPlan } from '@variscout/core';
import { useAIDerivedState } from './useAIDerivedState';
import type { ResponsesApiConfig } from '@variscout/core';
import {
  fetchNarration as fetchNarrationFromAI,
  fetchChartInsight as fetchChartInsightFromAI,
  isAIAvailable,
  getAIProviderLabel,
  getResponsesApiConfig,
} from '../services/aiService';
import type { AIPreferences } from '../context/DataContext';
import {
  searchDocuments,
  isKnowledgeBaseAvailable,
  checkKnowledgeBasePermissions,
} from '../services/searchService';
import { getChannelDriveInfo } from '../services/channelDrive';
import { getGraphToken } from '../auth/graphToken';
import { updateFindingsPopout } from '@variscout/ui';

export interface UseEditorAIOptions {
  enabled: boolean;
  aiPreferences?: AIPreferences;
  stats?: StatsResult;
  filteredData: DataRow[];
  /** Raw unfiltered data — used for action tool preview computation (ADR-029) */
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
  /** Custom SharePoint folder path for Knowledge Base search (ADR-026) */
  knowledgeSearchFolder?: string;
  /** Current journey phase for tool phase-gating (ADR-029) */
  journeyPhase?: JourneyPhase;
  /** Entry scenario for tool routing (ADR-029) */
  entryScenario?: EntryScenario;
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
  /** Resolved channel folder SharePoint URL (for "Open in SharePoint" links) */
  resolvedChannelFolderUrl?: string;
  /** Friendly label for KB search scope */
  knowledgeSearchScope?: string;
  /** Timestamp of last KB search */
  knowledgeSearchTimestamp?: number;
  /** Whether admin consent for SharePoint is missing */
  kbPermissionWarning: boolean;
}

export function useEditorAI({
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
  onOpenCoScout,
  onOpenFindings,
}: UseEditorAIOptions): UseEditorAIReturn {
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
  const toolHandlers = useMemo((): ToolHandlerMap | undefined => {
    if (!aiAvailable || !prefs.coscout) return undefined;

    const handlers: ToolHandlerMap = {
      // ── Read Tools (auto-execute) ──────────────────────────────────
      get_chart_data: async (args: Record<string, unknown>) => {
        const chart = args.chart as string;
        if (!stats) return JSON.stringify({ error: 'No data loaded' });
        const data: Record<string, unknown> = { chart, samples: filteredData.length };
        if (chart === 'ichart') {
          data.mean = stats.mean;
          data.ucl = stats.ucl;
          data.lcl = stats.lcl;
          data.stdDev = stats.stdDev;
        } else if (chart === 'boxplot' || chart === 'pareto') {
          data.factors = factors;
          data.filterCount = Object.keys(filters).length;
        } else if (chart === 'capability') {
          data.cpk = stats.cpk;
          data.cp = stats.cp;
          data.mean = stats.mean;
          data.stdDev = stats.stdDev;
        }
        return JSON.stringify(data);
      },

      get_statistical_summary: async () => {
        if (!stats) return JSON.stringify({ error: 'No data loaded' });
        return JSON.stringify({
          mean: stats.mean,
          stdDev: stats.stdDev,
          cpk: stats.cpk,
          cp: stats.cp,
          samples: filteredData.length,
          ucl: stats.ucl,
          lcl: stats.lcl,
        });
      },

      suggest_knowledge_search: async (args: Record<string, unknown>) => {
        const query = args.query as string;
        if (!query) return JSON.stringify({ error: 'No query provided' });
        const { findings: kbFindings, documents } = await knowledgeSearch.search(query);
        const formatted = formatKnowledgeContext(kbFindings, documents);
        return formatted || JSON.stringify({ results: 0 });
      },

      get_available_factors: async () => {
        if (!filteredData.length) return JSON.stringify({ error: 'No data loaded' });
        const result = factors.map(f => {
          const uniqueVals = [...new Set(filteredData.map(row => String(row[f])))].sort();
          const activeFilter = filters[f] ? filters[f].map(String) : undefined;
          return { name: f, categories: uniqueVals, activeFilter };
        });
        return JSON.stringify({ factors: result });
      },

      compare_categories: async (args: Record<string, unknown>) => {
        const factor = args.factor as string;
        if (!factor || !factors.includes(factor)) {
          return JSON.stringify({
            error: `Unknown factor: ${factor}. Available: ${factors.join(', ')}`,
          });
        }
        if (!outcome || !filteredData.length) {
          return JSON.stringify({ error: 'No data loaded' });
        }

        // Group by factor and compute per-category stats
        const groups = groupDataByFactor(filteredData, factor, outcome);
        const categoryStats: Array<{
          name: string;
          mean: number;
          stdDev: number;
          count: number;
          cpk?: number;
        }> = [];

        groups.forEach((values, name) => {
          if (values.length === 0) return;
          const catStats = calculateStats(values, specs?.usl, specs?.lsl);
          categoryStats.push({
            name,
            mean: catStats.mean,
            stdDev: catStats.stdDev,
            count: values.length,
            cpk: catStats.cpk ?? undefined,
          });
        });

        // Compute eta-squared
        const etaSquared = getEtaSquared(filteredData, factor, outcome);

        return JSON.stringify({
          factor,
          etaSquared: Math.round(etaSquared * 1000) / 1000,
          contributionPct: Math.round(etaSquared * 100),
          categories: categoryStats,
        });
      },

      // ── Action Tools (return proposals) ────────────────────────────
      apply_filter: async (args: Record<string, unknown>) => {
        const factor = args.factor as string;
        const value = args.value as string;
        if (!factor || !value) return JSON.stringify({ error: 'Missing factor or value' });
        if (!outcome || !rawData?.length) return JSON.stringify({ error: 'No data loaded' });

        const filterPreview = computeFilterPreview(
          rawData,
          outcome,
          filterStack,
          { factor, value },
          specs
        );
        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'apply_filter',
          params: { factor, value },
          preview: { ...filterPreview },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },

      clear_filters: async () => {
        if (!outcome || !rawData?.length) return JSON.stringify({ error: 'No data loaded' });

        const clearPreview = computeFilterPreview(rawData, outcome, [], null, specs);
        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'clear_filters',
          params: {},
          preview: { ...clearPreview },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },

      create_finding: async (args: Record<string, unknown>) => {
        const text = args.text as string;
        if (!text) return JSON.stringify({ error: 'Missing finding text' });

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'create_finding',
          params: { text },
          preview: {
            contextSnapshot: {
              filters: Object.keys(filters),
              samples: filteredData.length,
              mean: stats?.mean,
              cpk: stats?.cpk,
            },
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
          editableText: text,
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },

      create_hypothesis: async (args: Record<string, unknown>) => {
        const text = args.text as string;
        const factor = (args.factor as string | null) ?? undefined;
        const level = (args.level as string | null) ?? undefined;
        const parentId = (args.parent_id as string | null) ?? undefined;
        const validationType = (args.validation_type as string) || 'data';
        const validationTask = (args.validation_task as string | null) ?? undefined;

        if (!text) return JSON.stringify({ error: 'Missing hypothesis text' });

        // Compute predicted validation status if factor is specified
        let predictedStatus: string | undefined;
        let etaSquared: number | undefined;
        if (factor && outcome && filteredData.length > 0) {
          etaSquared = getEtaSquared(filteredData, factor, outcome);
          if (etaSquared >= 0.15) predictedStatus = 'supported';
          else if (etaSquared < 0.05) predictedStatus = 'contradicted';
          else predictedStatus = 'partial';
        }

        // Find parent hypothesis text
        const parentHypo = parentId ? hypotheses.find(h => h.id === parentId) : undefined;

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'create_hypothesis',
          params: {
            text,
            factor,
            level,
            parent_id: parentId,
            validation_type: validationType,
            validation_task: validationTask,
          },
          preview: {
            predictedStatus,
            etaSquared: etaSquared !== undefined ? Math.round(etaSquared * 1000) / 1000 : undefined,
            parentText: parentHypo?.text,
            depth: parentHypo ? 2 : 1,
            validationType,
            validationTask,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
          editableText: text,
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },

      suggest_improvement_idea: async (args: Record<string, unknown>) => {
        const hypothesisId = args.hypothesis_id as string;
        const text = args.text as string;
        const direction = args.direction as string;
        const timeframe = args.timeframe as string;
        const cost = args.cost as string | undefined;
        const riskAxis1 = args.risk_axis1 as number | null | undefined;
        const riskAxis2 = args.risk_axis2 as number | null | undefined;

        if (!hypothesisId || !text || !direction) {
          return JSON.stringify({ error: 'Missing hypothesis_id, text, or direction' });
        }

        const targetHypothesis = hypotheses.find(h => h.id === hypothesisId);
        if (!targetHypothesis) {
          return JSON.stringify({ error: `Hypothesis not found: ${hypothesisId}` });
        }
        if (targetHypothesis.status !== 'supported' && targetHypothesis.status !== 'partial') {
          return JSON.stringify({
            error: `Hypothesis must be 'supported' or 'partial', currently '${targetHypothesis.status}'`,
          });
        }

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'suggest_improvement_idea',
          params: {
            hypothesis_id: hypothesisId,
            text,
            direction,
            timeframe,
            cost: cost ?? undefined,
            risk_axis1: riskAxis1 ?? undefined,
            risk_axis2: riskAxis2 ?? undefined,
          },
          preview: {
            hypothesisText: targetHypothesis.text,
            existingIdeasCount: targetHypothesis.ideas?.length ?? 0,
            direction,
            timeframe,
            cost: cost ?? undefined,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
          editableText: text,
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },

      suggest_action: async (args: Record<string, unknown>) => {
        const findingId = args.finding_id as string;
        const text = args.text as string;
        const source = args.source as string;

        if (!findingId || !text) return JSON.stringify({ error: 'Missing finding_id or text' });

        const targetFinding = findings.find(f => f.id === findingId);
        if (!targetFinding) return JSON.stringify({ error: `Finding not found: ${findingId}` });
        if (targetFinding.status !== 'analyzed' && targetFinding.status !== 'improving') {
          return JSON.stringify({
            error: `Finding must be at 'analyzed' or 'improving' status, currently '${targetFinding.status}'`,
          });
        }

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'suggest_action',
          params: { finding_id: findingId, text, source },
          preview: {
            findingText: targetFinding.text,
            currentActionCount: targetFinding.actions?.length ?? 0,
            source: source || undefined,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
          editableText: text,
        };
        return JSON.stringify({ proposal: true, ...proposal });
      },
    };

    // Team-only sharing tools
    if (isTeamPlan()) {
      handlers.share_finding = async (args: Record<string, unknown>) => {
        const findingId = args.finding_id as string;
        if (!findingId) return JSON.stringify({ error: 'Missing finding_id' });
        const targetFinding = findings.find(f => f.id === findingId);
        if (!targetFinding) return JSON.stringify({ error: `Finding not found: ${findingId}` });

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'share_finding',
          params: { finding_id: findingId },
          preview: {
            findingText: targetFinding.text,
            stats: { mean: stats?.mean, cpk: stats?.cpk, samples: filteredData.length },
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      };

      handlers.publish_report = async () => {
        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'publish_report',
          params: {},
          preview: {
            findingCount: findings.length,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      };

      handlers.notify_action_owners = async (args: Record<string, unknown>) => {
        const findingId = args.finding_id as string;
        if (!findingId) return JSON.stringify({ error: 'Missing finding_id' });
        const targetFinding = findings.find(f => f.id === findingId);
        if (!targetFinding) return JSON.stringify({ error: `Finding not found: ${findingId}` });

        const actions = targetFinding.actions ?? [];
        const assignedActions = actions.filter(a => a.assignee);
        const unassignedCount = actions.length - assignedActions.length;

        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'notify_action_owners',
          params: { finding_id: findingId },
          preview: {
            findingText: targetFinding.text,
            actions: assignedActions.map(a => ({
              text: a.text,
              assigneeDisplayName: a.assignee?.displayName,
              dueDate: a.dueDate,
            })),
            unassignedCount,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      };
    }

    return handlers;
  }, [
    aiAvailable,
    prefs.coscout,
    stats,
    filteredData,
    rawData,
    outcome,
    factors,
    filters,
    filterStack,
    specs,
    findings,
    hypotheses,
    knowledgeSearch,
  ]);

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
