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
  Question,
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
  questions: Question[];
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
  questions,
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

    create_question: async (args: Record<string, unknown>) => {
      const text = args.text as string;
      const factor = (args.factor as string | null) ?? undefined;
      const level = (args.level as string | null) ?? undefined;
      const parentId = (args.parent_id as string | null) ?? undefined;
      const validationType = (args.validation_type as string) || 'data';
      const validationTask = (args.validation_task as string | null) ?? undefined;

      if (!text) return JSON.stringify({ error: 'Missing question text' });

      let predictedStatus: string | undefined;
      let etaSquared: number | undefined;
      if (factor && outcome && filteredData.length > 0) {
        etaSquared = getEtaSquared(filteredData, factor, outcome);
        if (etaSquared >= 0.15) predictedStatus = 'answered';
        else if (etaSquared < 0.05) predictedStatus = 'ruled-out';
        else predictedStatus = 'investigating';
      }

      const parentQuestion = parentId ? questions.find(h => h.id === parentId) : undefined;

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'create_question',
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
          parentText: parentQuestion?.text,
          depth: parentQuestion ? 2 : 1,
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
      const questionId = args.question_id as string;
      const text = args.text as string;
      const direction = args.direction as string;
      const timeframe = args.timeframe as string;
      const cost = args.cost as string | undefined;
      const riskAxis1 = args.risk_axis1 as number | null | undefined;
      const riskAxis2 = args.risk_axis2 as number | null | undefined;

      if (!questionId || !text || !direction) {
        return JSON.stringify({ error: 'Missing question_id, text, or direction' });
      }

      const targetQuestion = questions.find(h => h.id === questionId);
      if (!targetQuestion) {
        return JSON.stringify({ error: `Question not found: ${questionId}` });
      }
      if (targetQuestion.status !== 'answered' && targetQuestion.status !== 'investigating') {
        return JSON.stringify({
          error: `Question must be 'answered' or 'investigating', currently '${targetQuestion.status}'`,
        });
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_improvement_idea',
        params: {
          question_id: questionId,
          text,
          direction,
          timeframe,
          cost: cost ?? undefined,
          risk_axis1: riskAxis1 ?? undefined,
          risk_axis2: riskAxis2 ?? undefined,
        },
        preview: {
          questionText: targetQuestion.text,
          existingIdeasCount: targetQuestion.ideas?.length ?? 0,
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
      const suggestedQuestionId = (args.suggested_question_id as string | null) ?? undefined;
      const category = (args.category as string | null) ?? undefined;

      if (!insightText) return JSON.stringify({ error: 'Missing insight_text' });

      if (suggestedQuestionId) {
        const targetQuestion = questions.find(h => h.id === suggestedQuestionId);
        if (!targetQuestion) {
          return JSON.stringify({ error: `Question not found: ${suggestedQuestionId}` });
        }
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_save_finding',
        params: {
          insight_text: insightText,
          suggested_question_id: suggestedQuestionId,
          category: category,
        },
        preview: {
          contextSnapshot: {
            filters: Object.keys(filters),
            samples: filteredData.length,
            mean: stats?.mean,
            cpk: stats?.cpk,
          },
          suggestedQuestionText: suggestedQuestionId
            ? questions.find(h => h.id === suggestedQuestionId)?.text
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
