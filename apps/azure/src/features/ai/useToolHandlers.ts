/**
 * useToolHandlers - Extracted tool handler map from useEditorAI.
 *
 * Builds the ToolHandlerMap for CoScout function calling (ADR-028, ADR-029).
 * Each handler returns a JSON string — read tools auto-execute, action tools
 * return proposal objects for user confirmation.
 */
import { useMemo } from 'react';
import type {
  ToolHandlerMap,
  StatsResult,
  SpecLimits,
  DataRow,
  Finding,
  Hypothesis,
  FilterAction,
  ActionProposal,
} from '@variscout/core';
import {
  getEtaSquared,
  groupDataByFactor,
  calculateStats,
  isTeamPlan,
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
  formatKnowledgeContext,
  searchProjectArtifacts,
} from '@variscout/core';
import type { UseKnowledgeSearchReturn } from '@variscout/hooks';
import { bus } from '../../events/bus';
import type { NavigationTarget } from '@variscout/core/events';

export interface UseToolHandlersOptions {
  aiAvailable: boolean;
  coscoutEnabled: boolean;
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
  knowledgeSearch: UseKnowledgeSearchReturn;
}

export function useToolHandlers({
  aiAvailable,
  coscoutEnabled,
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
}: UseToolHandlersOptions): ToolHandlerMap | undefined {
  return useMemo((): ToolHandlerMap | undefined => {
    if (!aiAvailable || !coscoutEnabled) return undefined;

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

      // ── Read Tools (continued) ─────────────────────────────────────
      search_project: async (args: Record<string, unknown>) => {
        const results = searchProjectArtifacts({
          query: (args.query as string) ?? '',
          findings,
          hypotheses,
          artifactType: args.artifact_type as string as
            | 'finding'
            | 'hypothesis'
            | 'idea'
            | 'action'
            | 'all'
            | undefined,
          findingStatus: (args.finding_status as string) ?? 'any',
          hypothesisStatus: (args.hypothesis_status as string) ?? 'any',
        });
        return JSON.stringify({ results });
      },

      // ── Navigation Tool (hybrid: auto-execute or proposal) ─────────
      navigate_to: async (args: Record<string, unknown>) => {
        const target = args.target as NavigationTarget;
        const targetId = (args.target_id as string) || undefined;
        const restoreFilters = (args.restore_filters as boolean) ?? false;
        const chartType = args.chart_type as string;
        const factor = (args.factor as string) || undefined;

        if (restoreFilters && targetId) {
          // Return as proposal for user confirmation (filter restoration mutates state)
          const targetFinding = findings.find(f => f.id === targetId);
          const proposal: ActionProposal = {
            id: generateProposalId(),
            tool: 'navigate_to',
            params: { target, target_id: targetId, restore_filters: true, factor },
            preview: {
              findingText: targetFinding?.text,
              target,
              targetId,
            },
            status: 'pending',
            filterStackHash: hashFilterStack(filterStack),
            timestamp: Date.now(),
          };
          return JSON.stringify({ proposal: true, ...proposal });
        }

        // Validate target
        const validTargets: NavigationTarget[] = [
          'dashboard',
          'finding',
          'hypothesis',
          'chart',
          'improvement_workspace',
          'report',
        ];
        if (!validTargets.includes(target)) {
          return JSON.stringify({ error: `Unknown navigation target: ${target}` });
        }

        // Auto-execute navigation via domain event
        bus.emit('navigate:to', { target, targetId, chartType });
        return JSON.stringify({
          navigated: target,
          ...(targetId && { id: targetId }),
          ...(chartType && { chartType }),
        });
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
    coscoutEnabled,
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
}
