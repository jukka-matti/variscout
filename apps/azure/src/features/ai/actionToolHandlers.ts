/**
 * Action tool handlers — return proposal objects for user confirmation.
 *
 * Each handler validates input, computes preview data, and returns an
 * ActionProposal. No side effects until the user clicks "Apply".
 */
import type {
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
  computeFilterPreview,
  hashFilterStack,
  generateProposalId,
} from '@variscout/core';
import type { ToolHandlerMap } from '@variscout/core';

export interface ActionToolDeps {
  stats?: StatsResult;
  filteredData: DataRow[];
  rawData?: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  hypotheses: Hypothesis[];
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
}

export function buildActionToolHandlers({
  stats,
  filteredData,
  rawData,
  outcome,
  specs,
  findings,
  hypotheses,
  filters,
  filterStack,
}: ActionToolDeps): Partial<ToolHandlerMap> {
  return {
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

      let predictedStatus: string | undefined;
      let etaSquared: number | undefined;
      if (factor && outcome && filteredData.length > 0) {
        etaSquared = getEtaSquared(filteredData, factor, outcome);
        if (etaSquared >= 0.15) predictedStatus = 'supported';
        else if (etaSquared < 0.05) predictedStatus = 'contradicted';
        else predictedStatus = 'partial';
      }

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

    suggest_save_finding: async (args: Record<string, unknown>) => {
      const insightText = args.insight_text as string;
      const suggestedHypothesisId = (args.suggested_hypothesis_id as string | null) ?? undefined;
      const category = (args.category as string | null) ?? undefined;

      if (!insightText) return JSON.stringify({ error: 'Missing insight_text' });

      if (suggestedHypothesisId) {
        const targetHypo = hypotheses.find(h => h.id === suggestedHypothesisId);
        if (!targetHypo) {
          return JSON.stringify({ error: `Hypothesis not found: ${suggestedHypothesisId}` });
        }
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_save_finding',
        params: {
          insight_text: insightText,
          suggested_hypothesis_id: suggestedHypothesisId,
          category: category,
        },
        preview: {
          contextSnapshot: {
            filters: Object.keys(filters),
            samples: filteredData.length,
            mean: stats?.mean,
            cpk: stats?.cpk,
          },
          suggestedHypothesisText: suggestedHypothesisId
            ? hypotheses.find(h => h.id === suggestedHypothesisId)?.text
            : undefined,
          category,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
        editableText: insightText,
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
}
