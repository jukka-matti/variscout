/**
 * Typed tool registry for CoScout Responses API function calling.
 *
 * Each tool is defined ONCE with its schema, classification (read/action),
 * surface availability, and optional conditions. `getToolsForSurface()` filters
 * the registry to produce the tools array for a given surface/mode.
 *
 * ADR-029: Extended the original tool loop with action tools.
 * 2026-06-09 surface redesign: registry now advertises only executable tools
 * and gates them by deterministic product surface.
 */

import type { ToolDefinition } from '../../../responsesApi';
import type { CoScoutSurface } from '../types';
import type { AnalysisMode } from '../../../../types';
import type { Hypothesis } from '../../../../findings/types';

// ── Consumer-facing options type ────────────────────────────────────────

/** Options for building surface-gated CoScout tools (formerly in legacy.ts) */
export interface BuildCoScoutToolsOptions {
  /** Current product surface — determines which tools are available */
  surface?: CoScoutSurface;
  /** Existing Hypothesis hubs — enables connect_hub_evidence when non-empty */
  existingHubs?: Hypothesis[];
}

// ── Registry entry type ────────────────────────────────────────────────

export interface ToolRegistryEntry {
  /** Tool definition for the Responses API (name, description, parameters) */
  definition: ToolDefinition;
  /** Read tools are auto-executed; action tools need user confirmation */
  classification: 'read' | 'action';
  /** Product surfaces where this tool is available */
  surfaces: CoScoutSurface[];
  /** Optional: restrict to specific analysis modes */
  modes?: AnalysisMode[];
  /** Optional: dynamic availability condition */
  condition?: (ctx: { existingHubs?: Hypothesis[] }) => boolean;
}

// ── Tool Registry ──────────────────────────────────────────────────────

export const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
  // ── Read tools (always available) ────────────────────────────────────

  get_chart_data: {
    definition: {
      type: 'function',
      name: 'get_chart_data',
      description:
        'Read current chart data from VariScout. Returns data points, categories, or distribution data for the specified chart type.',
      parameters: {
        type: 'object',
        properties: {
          chart: {
            type: 'string',
            enum: ['ichart', 'boxplot', 'pareto', 'capability'],
            description: 'Which chart to read data from',
          },
        },
        required: ['chart'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  get_statistical_summary: {
    definition: {
      type: 'function',
      name: 'get_statistical_summary',
      description:
        'Get current statistical summary: mean, standard deviation, Cpk, Cp, pass rate, sample count, and violation counts.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  search_knowledge_base: {
    definition: {
      type: 'function',
      name: 'search_knowledge_base',
      description:
        'Search the project knowledge base for reference documents (SOPs, specs, FMEAs), past findings, and team member answers. Returns relevant chunks with source attribution.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  get_available_factors: {
    definition: {
      type: 'function',
      name: 'get_available_factors',
      description:
        'List all factor columns with their categories and current filter state. Call before apply_filter to verify factor and category names exist.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  critique_investigation_state: {
    definition: {
      type: 'function',
      name: 'critique_investigation_state',
      description:
        'Orient the current investigation loop: coverage, open candidate factors, hypothesis support, disconfirmation gaps, and next best move. Returns a structured gap array for the Wall rail critique feed.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['analyze'],
  },

  compare_categories: {
    definition: {
      type: 'function',
      name: 'compare_categories',
      description:
        'Get per-category stats breakdown for a factor, including mean, stdDev, count, Cpk, and ANOVA \u03B7\u00B2 (effect size). Use to identify which categories show the most variation before suggesting filters.',
      parameters: {
        type: 'object',
        properties: {
          factor: {
            type: 'string',
            description: 'Factor column name to compare categories for',
          },
        },
        required: ['factor'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  get_finding_attachment: {
    definition: {
      type: 'function',
      name: 'get_finding_attachment',
      description:
        "Retrieve photos and file metadata attached to a finding's comments. " +
        'Returns attachment descriptions and metadata. ' +
        'Use when the analyst references a finding photo or asks to compare visual evidence.',
      parameters: {
        type: 'object',
        properties: {
          finding_id: {
            type: 'string',
            description: 'ID of the finding to retrieve attachments from',
          },
        },
        required: ['finding_id'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['process', 'explore', 'analyze', 'report'],
  },

  // ── Explore/Analyze action tools ─────────────────────────────────────

  apply_filter: {
    definition: {
      type: 'function',
      name: 'apply_filter',
      description:
        'Propose filtering the data to a specific category. Returns a preview with stats (not executed until user confirms). The user will see an inline confirmation card.',
      parameters: {
        type: 'object',
        properties: {
          factor: { type: 'string', description: 'Factor column name to filter by' },
          value: { type: 'string', description: 'Category value to filter to' },
        },
        required: ['factor', 'value'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['explore', 'analyze'],
  },

  clear_filters: {
    definition: {
      type: 'function',
      name: 'clear_filters',
      description:
        'Propose clearing all active filters to return to the full dataset. Returns a preview with full-dataset stats.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['explore', 'analyze'],
  },

  create_finding: {
    definition: {
      type: 'function',
      name: 'create_finding',
      description:
        'Propose recording an observation as a finding. The user can edit the text before confirming. Write finding text as a concise factual observation.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description:
              'Finding text \u2014 concise factual observation, e.g., "Machine A shows Cpk 0.85 (below 1.33 target), contributing 34% of total variation"',
          },
        },
        required: ['text'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['explore', 'analyze'],
  },

  search_project: {
    definition: {
      type: 'function',
      name: 'search_project',
      description:
        'Search findings, hypotheses, improvement ideas, and actions in the current project by text and optional filters. Use when the user asks about past analysis, whether something was investigated, or what was found.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Search text (matched against text of findings, hypotheses, ideas, actions, and comments)',
          },
          artifact_type: {
            type: 'string',
            enum: ['finding', 'hypothesis', 'idea', 'action', 'all'],
            description: 'Type of artifact to search. Use "all" for all types.',
          },
          finding_status: {
            type: 'string',
            enum: ['observed', 'investigating', 'analyzed', 'improving', 'resolved', 'any'],
            description:
              'Filter findings by status. Use "any" for no filter. Only applies to findings.',
          },
          hypothesis_status: {
            type: 'string',
            enum: ['candidate', 'supported', 'refuted', 'selected-for-improvement', 'any'],
            description:
              'Filter hypotheses by status. Use "any" for no filter. Only applies to hypotheses.',
          },
        },
        required: ['query', 'artifact_type', 'finding_status', 'hypothesis_status'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'read',
    surfaces: ['explore', 'analyze', 'report'],
  },

  navigate_to: {
    definition: {
      type: 'function',
      name: 'navigate_to',
      description:
        'Navigate to a specific finding, hypothesis, chart view, or workspace. Auto-executes for panel navigation. Set restore_filters to true when restoring filter context from a finding (requires user confirmation).',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: [
              'finding',
              'hypothesis',
              'chart',
              'improvement_workspace',
              'report',
              'dashboard',
            ],
            description: 'What to navigate to',
          },
          target_id: {
            type: 'string',
            description: 'ID of the finding or hypothesis. Empty string if not applicable.',
          },
          chart_type: {
            type: 'string',
            enum: ['ichart', 'boxplot', 'pareto', 'capability', 'stats', 'none'],
            description: 'Which chart to focus. Use "none" if not applicable.',
          },
          restore_filters: {
            type: 'boolean',
            description:
              'Restore the filter context from when the finding was created. When true, requires user confirmation via proposal card.',
          },
          factor: {
            type: 'string',
            description:
              'Factor context to restore for boxplot/pareto. Empty string if not applicable.',
          },
        },
        required: ['target', 'target_id', 'chart_type', 'restore_filters', 'factor'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['explore', 'analyze'],
  },

  // ── Analyze action tools ─────────────────────────────────────────────

  suggest_hypothesis: {
    definition: {
      type: 'function',
      name: 'suggest_hypothesis',
      description:
        'Suggest a Hypothesis hub that connects related findings into a named mechanism. Use when you notice 2+ findings pointing to the same contributing factor during validating or converging phase.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description:
              'Analyst-friendly name for the mechanism, e.g., "Nozzle wear on night shift"',
          },
          synthesis: {
            type: 'string',
            description: 'Brief explanation of how the evidence connects',
          },
          findingIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of findings to connect to this hub',
          },
        },
        required: ['name', 'synthesis', 'findingIds'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },

  connect_hub_evidence: {
    definition: {
      type: 'function',
      name: 'connect_hub_evidence',
      description:
        'Connect newly recorded findings to an existing Hypothesis hub. Use when new evidence supports an already-named mechanism.',
      parameters: {
        type: 'object',
        properties: {
          hubId: { type: 'string', description: 'ID of the existing Hypothesis hub' },
          findingIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Finding IDs to connect',
          },
          reason: {
            type: 'string',
            description: 'Brief explanation of why this evidence belongs to this hub',
          },
        },
        required: ['hubId', 'findingIds', 'reason'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
    condition: ctx => Boolean(ctx.existingHubs && ctx.existingHubs.length > 0),
  },

  suggest_improvement_idea: {
    definition: {
      type: 'function',
      name: 'suggest_improvement_idea',
      description:
        'Propose an improvement idea for a confirmed/contributing hypothesis hub. Ideas bridge investigation findings and corrective actions. The analyst can edit, run What-If simulation, and select for implementation. Use the Four Ideation Directions to classify the approach. Prefer lean improvements \u2014 simplest fix that addresses the contributing factor.',
      parameters: {
        type: 'object',
        properties: {
          hypothesis_id: {
            type: 'string',
            description: 'ID of the confirmed/contributing hypothesis hub to attach the idea to',
          },
          text: {
            type: 'string',
            description:
              'Improvement idea description, e.g., "Simplify setup procedure with visual alignment guides"',
          },
          direction: {
            type: 'string',
            enum: ['prevent', 'detect', 'simplify', 'eliminate'],
            description:
              'prevent = stop the cause from occurring (poka-yoke, maintenance schedule, SOP), detect = catch it sooner before defects (sensor, alarm, visual inspection), simplify = reduce complexity/error opportunities (fewer steps, visual guides, kits), eliminate = remove the step entirely (automate, redesign)',
          },
          timeframe: {
            type: 'string',
            enum: ['just-do', 'days', 'weeks', 'months'],
            description:
              'Estimated timeframe: just-do = can be done right now with existing resources, no approval needed, days = requires minor coordination, can be done within days, weeks = requires planning, coordination, moderate resources, months = requires investment, cross-team coordination, significant planning',
          },
          cost: {
            type: 'string',
            enum: ['none', 'low', 'medium', 'high'],
            description:
              'Estimated cost: none = no additional cost (adjust setting, change SOP), low = minor budget within team authority (parts, supplies), medium = requires budget approval (training, fixture modification), high = capital investment or executive approval (new equipment, process redesign)',
          },
          risk_axis1: {
            type: ['integer', 'null'],
            enum: [1, 2, 3, null],
            description:
              'Process impact risk (optional): 1 = small/negligible, 2 = significant/moderate, 3 = severe/critical. Set null if uncertain.',
          },
          risk_axis2: {
            type: ['integer', 'null'],
            enum: [1, 2, 3, null],
            description:
              'Safety impact risk (optional): 1 = none, 2 = possible, 3 = immediate. Set null if uncertain.',
          },
        },
        required: [
          'hypothesis_id',
          'text',
          'direction',
          'timeframe',
          'cost',
          'risk_axis1',
          'risk_axis2',
        ],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },

  suggest_action: {
    definition: {
      type: 'function',
      name: 'suggest_action',
      description:
        'Propose adding a corrective/preventive action to an existing finding. Use when the user asks "what should we do?" or when Knowledge Base search reveals a relevant SOP.',
      parameters: {
        type: 'object',
        properties: {
          finding_id: {
            type: 'string',
            description: 'ID of the finding to add the action to',
          },
          text: {
            type: 'string',
            description:
              'Action description, e.g., "Replace nozzle tip weekly on Machine 5 \u2014 per SOP-NZ-003"',
          },
          source: {
            type: 'string',
            description:
              'Where this suggestion came from: empty string for CoScout reasoning, or a Knowledge Base source name',
          },
        },
        required: ['finding_id', 'text', 'source'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },

  suggest_save_finding: {
    definition: {
      type: 'function',
      name: 'suggest_save_finding',
      description:
        'Proactively suggest saving a key insight as a finding. Use when the conversation ' +
        'reveals a significant process observation, a validated hypothesis conclusion, ' +
        'or a negative learning (approach tried and found ineffective). ' +
        'The analyst sees a confirmation card and can edit before saving.',
      parameters: {
        type: 'object',
        properties: {
          insight_text: {
            type: 'string',
            description:
              'Concise insight text, e.g., "Nozzle 3 shows 2x variation of other nozzles \u2014 ' +
              'cleaning frequency is the likely contributing factor (eta-squared 0.42)"',
          },
          reasoning: {
            type: 'string',
            description:
              'Why this insight is worth saving \u2014 helps analyst decide. ' +
              'E.g., "This explains 42% of total variation and directly informs the improvement plan."',
          },
          suggested_hypothesis_id: {
            type: ['string', 'null'],
            description:
              'If the insight relates to a specific hypothesis, provide its ID to link them. Null otherwise.',
          },
        },
        required: ['insight_text', 'reasoning', 'suggested_hypothesis_id'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },

  // ── Evidence Map tools (Analyze surface) ─────────────────────────────

  suggest_causal_link: {
    definition: {
      type: 'function',
      name: 'suggest_causal_link',
      description:
        'Propose a causal relationship between two factors based on statistical evidence. ' +
        'Use when interaction \u0394R\u00B2 > 2% or when the analyst asks about factor relationships.',
      parameters: {
        type: 'object',
        properties: {
          fromFactor: { type: 'string', description: 'Source factor column name' },
          toFactor: { type: 'string', description: 'Target factor column name' },
          fromLevel: {
            type: ['string', 'null'],
            description: 'Specific source condition (null if not applicable)',
          },
          toLevel: {
            type: ['string', 'null'],
            description: 'Specific target condition (null if not applicable)',
          },
          mechanism: {
            type: 'string',
            description: 'Why this causal relationship exists',
          },
          direction: {
            type: 'string',
            enum: ['drives', 'modulates', 'confounds'],
            description:
              'Type of causal relationship: drives = direct cause, modulates = affects strength, confounds = shared upstream cause',
          },
        },
        required: ['fromFactor', 'toFactor', 'fromLevel', 'toLevel', 'mechanism', 'direction'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },

  highlight_map_pattern: {
    definition: {
      type: 'function',
      name: 'highlight_map_pattern',
      description:
        'Draw attention to a convergence, gap, or relationship pattern on the Evidence Map. ' +
        'Use when you notice multiple factors clustering, isolated nodes, or redundant links.',
      parameters: {
        type: 'object',
        properties: {
          factors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Factors involved in the pattern',
          },
          patternType: {
            type: 'string',
            enum: ['convergence', 'gap', 'interaction', 'redundancy'],
            description:
              'convergence = multiple links point to same target, gap = factor with no links, interaction = synergistic effect, redundancy = overlapping links',
          },
          explanation: {
            type: 'string',
            description: 'Why this pattern is noteworthy',
          },
        },
        required: ['factors', 'patternType', 'explanation'],
        additionalProperties: false,
        strict: true,
      },
    },
    classification: 'action',
    surfaces: ['analyze'],
  },
};

/** Union of all tool names in the registry */
export type ToolName = keyof typeof TOOL_REGISTRY;

// ── Surface/mode/tier filter ───────────────────────────────────────────

/**
 * Filter the tool registry to produce the tools array for a given surface/mode.
 *
 * @param surface - Current CoScout product surface
 * @param mode - Current analysis mode, scoped to the Analyze surface
 * @param options - Existing hubs for dynamic availability
 * @returns Filtered array of ToolDefinition for the Responses API
 */
export function getToolsForSurface(
  surface: CoScoutSurface,
  mode: AnalysisMode,
  options?: {
    existingHubs?: Hypothesis[];
  }
): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY)
    .filter(entry => {
      // Surface check
      if (!entry.surfaces.includes(surface)) return false;
      // Mode check
      if (entry.modes && !entry.modes.includes(mode)) return false;
      // Dynamic condition
      if (
        entry.condition &&
        !entry.condition({
          existingHubs: options?.existingHubs,
        })
      )
        return false;
      return true;
    })
    .map(entry => entry.definition);
}
