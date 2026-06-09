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
  FilterAction,
  ActionProposal,
  Hypothesis,
  CausalLink,
} from '@variscout/core';
import { computeFilterPreview, hashFilterStack, generateProposalId } from '@variscout/core';
import { wouldCreateCycle } from '@variscout/core/stats';
import type { ToolHandlerMap } from '@variscout/core';

export interface ActionToolDeps {
  stats?: StatsResult;
  filteredData: DataRow[];
  rawData?: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  /** Existing hypothesis hubs — the suspected causes that own improvement ideas (IM-1). */
  hypotheses?: Hypothesis[];
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  /** Existing causal links — used by suggest_causal_link handler */
  causalLinks?: CausalLink[];
  /** Available factor column names — used for validation */
  factors?: string[];
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
  causalLinks,
  factors,
}: ActionToolDeps): Partial<ToolHandlerMap> {
  const hubs = hypotheses ?? [];
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

    suggest_improvement_idea: async (args: Record<string, unknown>) => {
      // IM-1 (ADR-085): ideas re-home onto Hypothesis hubs. Accept hypothesis_id
      // (preferred) with a question_id fallback for older callers.
      const hypothesisId = (args.hypothesis_id as string) ?? (args.question_id as string);
      const text = args.text as string;
      const direction = args.direction as string;
      const timeframe = args.timeframe as string;
      const cost = args.cost as string | undefined;
      const riskAxis1 = args.risk_axis1 as number | null | undefined;
      const riskAxis2 = args.risk_axis2 as number | null | undefined;

      if (!hypothesisId || !text || !direction) {
        return JSON.stringify({ error: 'Missing hypothesis_id, text, or direction' });
      }

      const targetHub = hubs.find(h => h.id === hypothesisId);
      if (!targetHub) {
        return JSON.stringify({ error: `Hypothesis not found: ${hypothesisId}` });
      }
      if (targetHub.status === 'refuted') {
        return JSON.stringify({
          error: `Hypothesis is refuted; ideas only apply to live hubs`,
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
          hypothesisText: targetHub.name,
          existingIdeasCount: targetHub.ideas?.length ?? 0,
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
      const category = (args.category as string | null) ?? undefined;
      const reasoning = (args.reasoning as string | null) ?? undefined;
      const suggestedHypothesisId =
        (args.suggested_hypothesis_id as string | null | undefined) ??
        (args.suggested_question_id as string | null | undefined);

      if (!insightText) return JSON.stringify({ error: 'Missing insight_text' });

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_save_finding',
        params: {
          insight_text: insightText,
          category: category,
          reasoning,
          suggested_hypothesis_id: suggestedHypothesisId ?? null,
        },
        preview: {
          contextSnapshot: {
            filters: Object.keys(filters),
            samples: filteredData.length,
            mean: stats?.mean,
            cpk: stats?.cpk,
          },
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

    suggest_hypothesis: async (args: Record<string, unknown>) => {
      const name = args.name as string;
      const synthesis = args.synthesis as string;
      const findingIds = (args.findingIds as string[] | undefined) ?? [];

      if (!name) return JSON.stringify({ error: 'Missing name' });
      if (findingIds.length === 0) {
        return JSON.stringify({ error: 'At least one findingId is required' });
      }

      // Validate that referenced findings exist
      const missingFindings = findingIds.filter(id => !findings.find(f => f.id === id));
      if (missingFindings.length > 0) {
        return JSON.stringify({ error: `Findings not found: ${missingFindings.join(', ')}` });
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_hypothesis',
        params: { name, synthesis, findingIds },
        preview: {
          name,
          synthesis,
          findingCount: findingIds.length,
          previewText: `Create hypothesis: "${name}"\nConnecting ${findingIds.length} finding${findingIds.length !== 1 ? 's' : ''}`,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
        editableText: synthesis,
      };
      return JSON.stringify({ proposal: true, ...proposal });
    },

    connect_hub_evidence: async (args: Record<string, unknown>) => {
      const hubId = args.hubId as string;
      const findingIds = (args.findingIds as string[] | undefined) ?? [];
      const reason = (args.reason as string) ?? '';

      if (!hubId) return JSON.stringify({ error: 'Missing hubId' });

      const hub = hubs.find(h => h.id === hubId);
      if (!hub) return JSON.stringify({ error: `Suspected cause hub not found: ${hubId}` });

      if (findingIds.length === 0) {
        return JSON.stringify({ error: 'At least one findingId is required' });
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'connect_hub_evidence',
        params: { hubId, findingIds, reason },
        preview: {
          hubName: hub.name,
          findingCount: findingIds.length,
          reason,
          previewText: `Connect ${findingIds.length} finding${findingIds.length !== 1 ? 's' : ''} to hub "${hub.name}"${reason ? ` \u2014 ${reason}` : ''}`,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
      };
      return JSON.stringify({ proposal: true, ...proposal });
    },

    suggest_causal_link: async (args: Record<string, unknown>) => {
      const fromFactor = args.fromFactor as string;
      const toFactor = args.toFactor as string;
      const mechanism = args.mechanism as string;
      const direction = (args.direction as string) ?? 'drives';
      const fromLevel = (args.fromLevel as string | null) ?? undefined;
      const toLevel = (args.toLevel as string | null) ?? undefined;

      if (!fromFactor || !toFactor || !mechanism) {
        return JSON.stringify({ error: 'Missing fromFactor, toFactor, or mechanism' });
      }

      // Validate that factors exist in the dataset
      if (factors && factors.length > 0) {
        if (!factors.includes(fromFactor)) {
          return JSON.stringify({ error: `Factor not found in dataset: ${fromFactor}` });
        }
        if (!factors.includes(toFactor)) {
          return JSON.stringify({ error: `Factor not found in dataset: ${toFactor}` });
        }
      }

      // Check for existing link between these factors
      if (causalLinks && causalLinks.length > 0) {
        const existing = causalLinks.find(
          l => l.fromFactor === fromFactor && l.toFactor === toFactor
        );
        if (existing) {
          return JSON.stringify({
            error: `A causal link from "${fromFactor}" to "${toFactor}" already exists`,
          });
        }
      }

      // Check for cycle
      if (causalLinks && wouldCreateCycle(causalLinks, fromFactor, toFactor)) {
        return JSON.stringify({
          error: `Adding ${fromFactor} → ${toFactor} would create a cycle in the causal graph`,
        });
      }

      const validDirections = ['drives', 'modulates', 'confounds'];
      const safeDirection = validDirections.includes(direction) ? direction : 'drives';

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'suggest_causal_link',
        params: { fromFactor, toFactor, mechanism, direction: safeDirection, fromLevel, toLevel },
        preview: {
          fromFactor,
          toFactor,
          mechanism,
          direction: safeDirection,
          fromLevel: fromLevel ?? undefined,
          toLevel: toLevel ?? undefined,
          previewText: `${fromFactor}${fromLevel ? ` (${fromLevel})` : ''} ${safeDirection} ${toFactor}${toLevel ? ` (${toLevel})` : ''}: ${mechanism}`,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
        editableText: mechanism,
      };
      return JSON.stringify({ proposal: true, ...proposal });
    },

    highlight_map_pattern: async (args: Record<string, unknown>) => {
      const patternFactors = args.factors as string[];
      const patternType = args.patternType as string;
      const explanation = args.explanation as string;

      if (!patternFactors || patternFactors.length === 0) {
        return JSON.stringify({ error: 'Missing factors array' });
      }
      if (!patternType || !explanation) {
        return JSON.stringify({ error: 'Missing patternType or explanation' });
      }

      const validPatternTypes = ['convergence', 'gap', 'interaction', 'redundancy'];
      if (!validPatternTypes.includes(patternType)) {
        return JSON.stringify({ error: `Invalid patternType: ${patternType}` });
      }

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'highlight_map_pattern',
        params: { factors: patternFactors, patternType, explanation },
        preview: {
          factors: patternFactors,
          patternType,
          explanation,
          previewText: `${patternType}: ${patternFactors.join(', ')} \u2014 ${explanation}`,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
      };
      return JSON.stringify({ proposal: true, ...proposal });
    },
  };
}
