/**
 * CoScout conversational AI prompt templates.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext, CoScoutMessage, JourneyPhase, EntryScenario } from '../types';
import type { ToolDefinition, MessageContent, InputContentPart } from '../responsesApi';
import type { Locale } from '../../i18n/types';
import type { AnalysisMode } from '../../types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';
import { buildSummaryPrompt } from './narration';
import { resolveMode, getStrategy } from '../../analysisStrategy';

/** Options for building phase-gated CoScout tools */
export interface BuildCoScoutToolsOptions {
  /** Current journey phase — determines which tools are available */
  phase?: JourneyPhase;
  /** Whether user is on Team plan (enables sharing tools) */
  isTeamPlan?: boolean;
}

/**
 * Build tool definitions for CoScout Responses API integration.
 * Phase-gating controls which tools are available at each journey phase.
 * All tools use strict mode for guaranteed parameter schemas.
 *
 * ADR-029: Extended from 3 to 13 tools with action tool support.
 */
export function buildCoScoutTools(options: BuildCoScoutToolsOptions = {}): ToolDefinition[] {
  const { phase, isTeamPlan } = options;

  // Read tools — always available
  const tools: ToolDefinition[] = [
    {
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
    {
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
    {
      type: 'function',
      name: 'suggest_knowledge_search',
      description:
        'Search the team Knowledge Base (SharePoint documents) for related SOPs, fault trees, past investigations, or procedures. Call when the user asks about historical patterns, root causes, or institutional knowledge.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for Knowledge Base documents' },
        },
        required: ['query'],
        additionalProperties: false,
        strict: true,
      },
    },
    {
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
    {
      type: 'function',
      name: 'compare_categories',
      description:
        'Get per-category stats breakdown for a factor, including mean, stdDev, count, Cpk, and ANOVA eta-squared (Contribution %). Use to identify which categories show the most variation before suggesting filters.',
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
  ];

  // SCOUT+ tools (not available in FRAME)
  if (phase && phase !== 'frame') {
    tools.push(
      {
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
      {
        type: 'function',
        name: 'switch_factor',
        description:
          'Propose switching the Boxplot to show a different factor. Use after apply_filter to show remaining factors within the filtered subset.',
        parameters: {
          type: 'object',
          properties: {
            factor: {
              type: 'string',
              description: 'Factor column name to switch the Boxplot to',
            },
          },
          required: ['factor'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
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
      {
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
                'Finding text — concise factual observation, e.g., "Machine A shows Cpk 0.85 (below 1.33 target), contributing 34% of total variation"',
            },
          },
          required: ['text'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
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
              enum: ['untested', 'supported', 'contradicted', 'partial', 'any'],
              description:
                'Filter hypotheses by validation status. Use "any" for no filter. Only applies to hypotheses.',
            },
          },
          required: ['query', 'artifact_type', 'finding_status', 'hypothesis_status'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
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
      }
    );
  }

  // INVESTIGATE+ tools
  if (phase === 'investigate' || phase === 'improve') {
    tools.push(
      {
        type: 'function',
        name: 'create_hypothesis',
        description:
          'Propose adding a hypothesis to the investigation tree. Root hypothesis (parent_id=null) for new theories; sub-hypothesis (parent_id=existing_id) for breaking down causes. The user can edit the text before confirming.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Hypothesis text describing the suspected cause',
            },
            factor: {
              type: ['string', 'null'],
              description:
                'Factor column linked to this hypothesis (for auto-validation via eta-squared). Null if not data-testable.',
            },
            level: {
              type: ['string', 'null'],
              description:
                'Specific category level within the factor. Null if testing the whole factor.',
            },
            parent_id: {
              type: ['string', 'null'],
              description: 'Parent hypothesis ID for sub-hypotheses. Null for root hypotheses.',
            },
            validation_type: {
              type: 'string',
              enum: ['data', 'gemba', 'expert'],
              description:
                'How this hypothesis should be validated: "data" = auto-validate with ANOVA, "gemba" = physical inspection needed, "expert" = expert opinion needed.',
            },
            validation_task: {
              type: ['string', 'null'],
              description:
                'For gemba/expert: description of what to check. Null for data-testable hypotheses.',
            },
          },
          required: ['text', 'factor', 'level', 'parent_id', 'validation_type', 'validation_task'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
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
                'Action description, e.g., "Replace nozzle tip weekly on Machine 5 — per SOP-NZ-003"',
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
      {
        type: 'function',
        name: 'suggest_improvement_idea',
        description:
          'Propose an improvement idea for a supported hypothesis. Ideas bridge root cause analysis and corrective actions. The analyst can edit, run What-If simulation, and select for implementation. Use the Four Ideation Directions to classify the approach. Prefer lean improvements — simplest fix that addresses the root cause.',
        parameters: {
          type: 'object',
          properties: {
            hypothesis_id: {
              type: 'string',
              description: 'ID of the supported hypothesis to attach the idea to',
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
      {
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
                'Concise insight text, e.g., "Nozzle 3 shows 2x variation of other nozzles — ' +
                'cleaning frequency is the likely root cause (eta-squared 0.42)"',
            },
            reasoning: {
              type: 'string',
              description:
                'Why this insight is worth saving — helps analyst decide. ' +
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
      }
    );

    // Team-only sharing tools (INVESTIGATE+)
    if (isTeamPlan) {
      tools.push(
        {
          type: 'function',
          name: 'share_finding',
          description:
            'Propose posting a finding summary to the Teams channel. Shows a preview before sending. Only use at investigation milestones.',
          parameters: {
            type: 'object',
            properties: {
              finding_id: {
                type: 'string',
                description: 'ID of the finding to share',
              },
            },
            required: ['finding_id'],
            additionalProperties: false,
            strict: true,
          },
        },
        {
          type: 'function',
          name: 'publish_report',
          description:
            'Propose publishing the current scouting report to SharePoint. Shows report type and section count before publishing.',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false,
            strict: true,
          },
        }
      );
    }
  }

  // IMPROVE-only tools
  if (phase === 'improve' && isTeamPlan) {
    tools.push({
      type: 'function',
      name: 'notify_action_owners',
      description:
        'Propose sending Teams notifications to action item assignees. Shows a preview of who will be notified. Only use after actions have been assigned.',
      parameters: {
        type: 'object',
        properties: {
          finding_id: {
            type: 'string',
            description: 'ID of the finding whose action owners to notify',
          },
        },
        required: ['finding_id'],
        additionalProperties: false,
        strict: true,
      },
    });
  }

  return tools;
}

/**
 * Build Responses API input format for CoScout.
 * Returns { instructions, input } suitable for the Responses API,
 * replacing the Chat Completions message array pattern.
 *
 * The instructions field contains the system prompt (static cacheable prefix).
 * The input field contains the variable context + user message.
 */
export function buildCoScoutInput(
  context: AIContext,
  history: CoScoutMessage[],
  userMessage: string,
  options?: {
    journeyPhase?: JourneyPhase;
    isTeamPlan?: boolean;
    images?: Array<{ dataUrl: string }>;
  }
): {
  instructions: string;
  input: Array<{ role: 'user' | 'assistant' | 'system'; content: MessageContent }>;
} {
  const instructions = buildCoScoutSystemPrompt({
    glossaryFragment: context.glossaryFragment,
    investigation: context.investigation,
    teamContributors: context.teamContributors,
    sampleCount: context.stats?.samples,
    stagedComparison: context.stagedComparison,
    locale: context.locale,
    entryScenario: context.entryScenario,
    phase: options?.journeyPhase,
    hasActionTools: options?.journeyPhase != null,
    synthesis: context.process?.synthesis,
    capabilityStability: context.capabilityStability,
    analysisMode: context.analysisMode,
    coscoutInsights: context.findings?.coscoutInsights,
  });

  const input: Array<{ role: 'user' | 'assistant' | 'system'; content: MessageContent }> = [];

  // Context summary — variable per analysis state
  const contextSummary = buildSummaryPrompt(context).replace(
    /Summarize this analysis state.*$/,
    "This is the current analysis context. Use it to answer the user's question."
  );
  input.push({ role: 'system', content: contextSummary });

  // Knowledge Base context (when results/documents available)
  const hasKnowledgeResults = context.knowledgeResults && context.knowledgeResults.length > 0;
  const hasKnowledgeDocs = context.knowledgeDocuments && context.knowledgeDocuments.length > 0;
  if (hasKnowledgeResults || hasKnowledgeDocs) {
    const knowledgeContent = formatKnowledgeContext(
      context.knowledgeResults ?? [],
      context.knowledgeDocuments
    );
    if (knowledgeContent) {
      input.push({ role: 'system', content: knowledgeContent });
    }
  }

  // Recent history (last N messages)
  const recentHistory = history.slice(-COSCOUT_HISTORY_LIMIT);
  for (const msg of recentHistory) {
    if (!msg.error) {
      input.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  // Current user message — multimodal when images are present
  const images = options?.images;
  if (images && images.length > 0) {
    const parts: InputContentPart[] = [
      { type: 'input_text', text: userMessage },
      ...images.map(img => ({
        type: 'input_image' as const,
        image_url: img.dataUrl,
        detail: 'auto' as const,
      })),
    ];
    input.push({ role: 'user', content: parts });
  } else {
    input.push({ role: 'user', content: userMessage });
  }

  return { instructions, input };
}

/** Options for building the CoScout system prompt */
export interface BuildCoScoutSystemPromptOptions {
  glossaryFragment?: string;
  investigation?: AIContext['investigation'];
  teamContributors?: AIContext['teamContributors'];
  sampleCount?: number;
  stagedComparison?: AIContext['stagedComparison'];
  locale?: Locale;
  /** Entry scenario for tool routing guidance (ADR-029) */
  entryScenario?: EntryScenario;
  /** Current journey phase for tool routing (ADR-029) */
  phase?: JourneyPhase;
  /** Whether action tools are enabled (adds tool routing instructions) */
  hasActionTools?: boolean;
  /** Convergence synthesis narrative (from ProcessContext) */
  synthesis?: string;
  /** Subgroup capability stability data (when capability mode active) */
  capabilityStability?: AIContext['capabilityStability'];
  /** Current analysis mode for mode-specific terminology (ADR-047) */
  analysisMode?: AnalysisMode;
  /** Insights previously saved from CoScout conversations — used to avoid repetition (ADR-049) */
  coscoutInsights?: Array<{ text: string; status: string }>;
}

/**
 * Build the system prompt for conversational CoScout assistant.
 * Includes glossary grounding as static prefix for prompt caching.
 * When investigation context is provided, adds problem statement and hypothesis awareness.
 */
export function buildCoScoutSystemPrompt(options: BuildCoScoutSystemPromptOptions = {}): string {
  const {
    glossaryFragment,
    investigation,
    teamContributors,
    sampleCount,
    stagedComparison,
    locale,
    // entryScenario, phase, hasActionTools are read from `options` directly below
  } = options;
  const parts: string[] = [];
  const hint = buildLocaleHint(locale);
  if (hint) parts.push(hint);
  parts.push(
    `You are CoScout, the quality engineering assistant for VariScout — an Exploratory Data Analysis tool for process improvement.

VariScout shows four analytical tools simultaneously with linked filtering:
- I-Chart: What patterns exist in the time-series data?
- Boxplot: Where does variation concentrate across factors?
- Pareto: Which categories contribute most to variation?
- Capability: Does the process meet customer specifications?

Two Voices distinguish stability from capability: Voice of the Process (control limits) vs Voice of the Customer (specification limits).

Key principles:
- Contribution, not causation — VariScout shows WHERE variation concentrates; the analyst investigates WHY.
- Progressive stratification — drill through factors one at a time, guided by contribution %.
- Iterative exploration — each finding triggers new questions and deeper analysis.

Use the provided context (statistics, filters, violations, findings) to ground every answer.
Keep responses focused and practical — 2-4 sentences unless the user asks for more detail.
Never invent data or statistics. If the context does not contain enough information to answer, say so.`
  );

  if (glossaryFragment) {
    parts.push(glossaryFragment);
  }

  // Investigation-aware instructions
  if (investigation) {
    const invParts: string[] = [];

    if (investigation.problemStatement) {
      invParts.push(`The analyst is investigating: "${investigation.problemStatement}".`);
    }

    // Convergence synthesis — the analyst's suspected cause narrative
    if (options.synthesis) {
      invParts.push(
        `Synthesis (suspected cause narrative): "${options.synthesis}". Use this to ground improvement suggestions. Do not say "confirmed" — use "the evidence suggests" or "the evidence points to".`
      );
    }

    if (investigation.allHypotheses && investigation.allHypotheses.length > 0) {
      const hypothesisList = investigation.allHypotheses
        .map(h => `- [${h.id}] "${h.text}" (${h.status})`)
        .join('\n');
      invParts.push(`Known hypotheses:\n${hypothesisList}`);
    }

    if (investigation.targetMetric && investigation.targetValue !== undefined) {
      invParts.push(
        `Target: ${investigation.targetMetric} = ${investigation.targetValue}` +
          (investigation.currentValue !== undefined
            ? `, current = ${investigation.currentValue}`
            : '') +
          (investigation.progressPercent !== undefined
            ? ` (${Math.round(investigation.progressPercent)}% progress)`
            : '')
      );
    }

    if (investigation.phase) {
      // Check if there are supported hypotheses for phase-specific instructions
      const hasSupportedHypotheses =
        investigation.allHypotheses?.some(h => h.status === 'supported') ?? false;

      const phaseInstructions: Record<string, string> = {
        initial:
          'The investigation is just starting. Tell the user: "You\'re in the first look phase — let\'s identify which chart to examine first and what patterns to look for."',
        diverging:
          'The investigation is exploring possible causes. Tell the user: "You\'re exploring possible causes — let\'s cast a wide net across different factor categories."',
        validating:
          'The investigation is gathering evidence. Tell the user: "You\'re gathering evidence — data, gemba, and expert input all contribute to understanding. Let\'s see what the data shows."',
        converging: hasSupportedHypotheses
          ? 'The investigation is narrowing down. Tell the user: "You\'re identifying the suspected cause — supported hypotheses found. Let\'s brainstorm improvement ideas."'
          : 'The investigation is narrowing down. Tell the user: "You\'re identifying the suspected cause — let\'s synthesize findings into a coherent story."',
        improving: (() => {
          const sf = investigation?.selectedFinding;
          const hasActions = sf?.actions && sf.actions.length > 0;
          const allActionsDone = hasActions && sf!.actions!.every(a => a.status === 'done');
          // Note: stagedComparison override happens below, so this handles non-staged cases
          if (allActionsDone) {
            return 'PDCA: Act — All corrective actions are complete. Help the analyst assess the outcome: was the improvement effective, partial, or not effective? Recommend sustaining controls for effective improvements.';
          } else if (hasActions) {
            return 'PDCA: Do — Corrective actions are in progress. Track progress, flag overdue items, and keep the team focused on execution. Do not suggest new actions unless asked.';
          } else {
            return 'PDCA: Plan — No corrective actions yet. Help the analyst brainstorm improvement ideas, search the Knowledge Base for similar past fixes, and convert selected ideas into executable action items.';
          }
        })(),
      };

      // Override converging/improving with suspected cause context when available
      if (investigation.suspectedCause) {
        const sc = investigation.suspectedCause;
        const primaryText = sc.primary ? `"${sc.primary.text}"` : 'not yet identified';
        const contribTexts = sc.contributing.map(c => `"${c.text}"`).join(', ');
        const contribSuffix =
          sc.contributing.length > 0 ? `, with ${contribTexts} contributing` : '';

        if (investigation.phase === 'converging') {
          phaseInstructions.converging = `The investigation is narrowing down. Your suspected root cause is ${primaryText}${contribSuffix}. Let's brainstorm improvement ideas targeting the primary cause.`;
        }
        if (investigation.phase === 'improving') {
          const basePdca = phaseInstructions.improving;
          phaseInstructions.improving = `The process is in the improvement phase. You're addressing ${primaryText}${contribSuffix}. ${basePdca}`;
        }
      }

      // Override improving phase with verification-specific instructions when staged data available
      if (investigation.phase === 'improving' && stagedComparison) {
        const sd = stagedComparison.deltas;
        let verificationContext =
          'Verification data available — the analyst has collected After data.';
        verificationContext += ` Staged comparison: mean shift ${formatStatistic(sd.meanShift, 'en', 2)}`;
        verificationContext += `, variation ratio ${formatStatistic(sd.variationRatio, 'en', 2)}`;
        if (sd.cpkDelta !== null)
          verificationContext += `, Cpk delta ${sd.cpkDelta > 0 ? '+' : ''}${formatStatistic(sd.cpkDelta, 'en', 2)}`;
        verificationContext += '.';
        phaseInstructions.improving = `The process is in the Improvement Phase with verification data (PDCA: Check). ${verificationContext} Help assess: Is the improvement real and sustained? Are there new patterns or risks in the After stage? What sustaining controls are needed?`;
      }

      if (phaseInstructions[investigation.phase]) {
        invParts.push(phaseInstructions[investigation.phase]);
      }

      // Include improvement ideas when converging with supported hypotheses
      if (
        investigation.phase === 'converging' &&
        hasSupportedHypotheses &&
        investigation.allHypotheses
      ) {
        const ideasParts: string[] = [];
        for (const h of investigation.allHypotheses) {
          if (h.status === 'supported' && h.ideas && h.ideas.length > 0) {
            const ideaLines = h.ideas.map(idea => {
              let line = `  - "${idea.text}"`;
              if (idea.direction) line += ` [${idea.direction}]`;
              if (idea.selected) line += ' [selected]';
              if (idea.projection) line += ' (projected)';
              return line;
            });
            ideasParts.push(`Existing improvement ideas for "${h.text}":\n${ideaLines.join('\n')}`);
          }
        }
        if (ideasParts.length > 0) {
          invParts.push(
            ideasParts.join('\n') +
              '\nBuild on these — suggest alternatives or evaluate existing ones.'
          );
        }
      }
    }

    // Selected finding context
    if (investigation.selectedFinding) {
      const sf = investigation.selectedFinding;
      let findingLine = `Currently focused finding: "${sf.text}"`;
      if (sf.status) findingLine += ` [status: ${sf.status}]`;
      if (sf.hypothesis) findingLine += ` (hypothesis: "${sf.hypothesis}")`;
      if (sf.projection) {
        findingLine += `. Projected impact: mean ${sf.projection.meanDelta > 0 ? '+' : ''}${formatStatistic(sf.projection.meanDelta, 'en', 2)}, sigma ${sf.projection.sigmaDelta > 0 ? '+' : ''}${formatStatistic(sf.projection.sigmaDelta, 'en', 2)}`;
      }
      if (sf.actions && sf.actions.length > 0) {
        const done = sf.actions.filter(a => a.status === 'done').length;
        findingLine += `\nActions (${done}/${sf.actions.length} complete):`;
        const capped = sf.actions.slice(0, 5);
        for (const a of capped) {
          findingLine += `\n  - [${a.status}] ${a.text}${a.overdue ? ' \u26a0 OVERDUE' : ''}`;
        }
        if (sf.actions.length > 5) {
          findingLine += `\n  ... and ${sf.actions.length - 5} more`;
        }
      }
      if (sf.actionProgress) {
        findingLine += `\nAction progress: ${sf.actionProgress.done}/${sf.actionProgress.total} complete`;
        if (sf.actionProgress.overdueCount > 0) {
          findingLine += ` (${sf.actionProgress.overdueCount} overdue)`;
        }
      }
      invParts.push(findingLine);
    }

    if (invParts.length > 0) {
      parts.push('Investigation context:\n' + invParts.join('\n'));
    }
  }

  // Confidence calibration — adjust tone based on sample size
  // See docs/05-technical/architecture/aix-design-system.md §1.2
  if (sampleCount !== undefined) {
    if (sampleCount < 10) {
      parts.push(
        `Confidence calibration: Only ${sampleCount} observations available. Use cautious language — qualify all conclusions with "With only ${sampleCount} observations, this is not yet reliable." Recommend collecting more data before drawing conclusions.`
      );
    } else if (sampleCount < 30) {
      parts.push(
        'Confidence calibration: Limited sample size (< 30). Use hedged language — "Based on limited data...", "Preliminary analysis indicates..." Do not make strong claims about process stability or capability.'
      );
    } else if (sampleCount < 100) {
      parts.push(
        'Confidence calibration: Moderate sample size. Use standard language — "The analysis suggests...", "Current data indicates..."'
      );
    }
  }

  // Capability stability mode context
  if (options.capabilityStability) {
    const cs = options.capabilityStability;
    const subgroupDesc =
      cs.method === 'column' ? `by ${cs.column}` : `fixed size n=${cs.subgroupSize}`;
    let capSection = `CAPABILITY STABILITY MODE ACTIVE
The analyst is viewing Cp/Cpk per subgroup on the I-Chart. This reveals whether process capability itself is stable over time.

Current state: ${cs.subgroupCount} subgroups (${subgroupDesc})
Mean Cpk: ${cs.meanCpk.toFixed(2)}, range: ${cs.minCpk.toFixed(2)}–${cs.maxCpk.toFixed(2)}
In-control: ${cs.cpkInControl}/${cs.subgroupCount} subgroups`;

    if (cs.cpkTarget !== undefined && cs.subgroupsMeetingTarget !== undefined) {
      capSection += `\nCpk target: ${cs.cpkTarget.toFixed(2)} — ${cs.subgroupsMeetingTarget}/${cs.subgroupCount} subgroups meet target`;
    }

    if (cs.centeringLoss !== undefined) {
      capSection += `\nCentering loss: ${cs.centeringLoss.toFixed(3)} (gap between mean Cp and mean Cpk)`;
    }

    capSection += `

Interpretation guidance:
- If ALL subgroups in control → capability is stable, overall Ppk is representative
- If subgroups OUT OF CONTROL → capability is shifting; investigate WHICH subgroups and WHEN
- Large Cp-Cpk gap → process is capable but off-center; investigate centering drift
- Low Cpk with high Cp → the spread is fine, the mean is shifting
- Both Cp and Cpk out of control → process is fundamentally unstable

Focus your analysis on:
1. Are there specific subgroups (${cs.method === 'column' ? 'batches/groups' : 'time periods'}) where capability drops?
2. Is the centering loss systematic or random?
3. What factors might explain capability shifts between subgroups?`;
    parts.push(capSection);
  }

  // Mode-specific terminology and coaching (ADR-047)
  // Routed through strategy registry — adding a new mode only requires a registry entry
  const modeToolSet = options.analysisMode
    ? getStrategy(resolveMode(options.analysisMode)).aiToolSet
    : 'standard';
  if (modeToolSet === 'yamazumi') {
    parts.push(
      `## Analysis Mode: Time Study (Yamazumi)
You are analyzing cycle time composition by activity type across process steps — a lean manufacturing technique.

Terminology:
- "cycle time" — not "measurement value"
- "VA ratio" (value-add time / total lead time) — the lean counterpart to Cpk
- "process efficiency" (VA / (VA + NVA Required)) — excludes pure waste
- "takt time" (available time / demand) — the lean counterpart to specification limits
- "takt compliance" (stations below takt / total) — the lean counterpart to pass rate
- "process steps" or "stations" — not "categories"

Activity types (fixed semantic colors):
- VA (green): Value-adding work → optimize efficiency
- NVA Required (amber): Necessary but non-value-adding → reduce through automation/simplification
- Waste (red): Eliminable waste (muda) → remove entirely
- Wait (grey): Queue/idle time → eliminate

The four charts show:
- Yamazumi Chart: Stacked bars showing time composition per step. Bars exceeding takt time are the bottlenecks.
- I-Chart: Time trend with switchable metric (Total / VA-only / Waste-only). Shows if waste is increasing over time.
- Pareto: Waste ranking with 5 grouping modes (steps-total, steps-waste, steps-nva, activities, reasons).
- Summary Bar: VA ratio, process efficiency, lead time, bottleneck station, takt compliance.

Coaching workflow:
1. "Which steps exceed takt?" → Read the Yamazumi chart. Bars above the takt line are bottlenecks.
2. "Is the bottleneck real work or waste?" → Check the segment composition. Green (VA) vs red (Waste).
3. "What type of waste dominates?" → Switch Pareto to "Reasons" mode for waste driver ranking.
4. "Is waste getting worse?" → Switch I-Chart to Waste-only metric. Look for upward trends.
5. "Where should kaizen focus?" → The step with the most red (Waste) segments above takt.

After kaizen, use staged analysis to verify: compare before/after VA ratio and takt compliance.
Never reference Cpk, control limits, or SPC terminology. Use lean language throughout.`
    );
  } else if (modeToolSet === 'performance') {
    parts.push(
      `## Analysis Mode: Multi-Channel Performance
You are analyzing equipment with multiple measurement channels (e.g., fill heads, cavities, spindles, lanes).
Each channel is an independent measurement point with its own Cpk.

Terminology:
- "channels" or "measures" — not "factors" or "categories"
- "worst-channel Cpk" — the key metric (equipment is only as good as its worst channel)
- "channel health" — critical (<1.0), warning (1.0–1.33), capable (1.33–1.67), excellent (≥1.67)

The four charts show:
- Performance Pareto: All channels ranked by Cpk, worst first. Start here to prioritize.
- Performance I-Chart: Cpk scatter across channels. Out-of-control points = systematically worse channels (not random).
- Performance Boxplot: Distribution comparison of worst 5. Shows if the problem is centering vs. spread.
- Performance Capability: Single-channel histogram. Deep-dive on the selected channel.

Coaching workflow:
1. "Which channels need attention?" → Read the Pareto. Count critical/warning channels.
2. "Why is this channel worst?" → Compare its boxplot to peers. Centering issue or spread issue?
3. "Is the problem systematic?" → Check the I-Chart. Are bad channels clustered or scattered?
4. "What should I do?" → Click the worst channel to switch to standard analysis. Add factors (Shift, Operator) to investigate root cause.

Never use standard SPC terminology (control limits, Nelson rules) for the channel comparison view. Those apply after drilling into a single channel.`
    );
  }

  parts.push(TERMINOLOGY_INSTRUCTION);

  parts.push(
    'When citing drill scope, use the provided cumulativeScope value. Never compute or estimate scope from Contribution % values.'
  );

  // Source attribution for Knowledge Base
  parts.push(
    'When referencing Knowledge Base information, cite the source using [Source: name] notation.'
  );

  // Team collaboration awareness
  if (teamContributors && teamContributors.count > 1) {
    parts.push(
      `Team collaboration: ${teamContributors.count} investigators are working on this analysis` +
        (teamContributors.hypothesisAreas.length > 0
          ? `. Areas being investigated: ${teamContributors.hypothesisAreas.join(', ')}`
          : '') +
        `. Avoid suggesting investigation steps already covered by team members.`
    );
  }

  // Action tool routing instructions (ADR-029)
  if (options.hasActionTools) {
    parts.push(buildToolRoutingInstructions());

    // Entry scenario routing
    if (options.entryScenario) {
      parts.push(buildEntryScenarioGuidance(options.entryScenario));
    }

    // Insight capture guidance — INVESTIGATE and IMPROVE phases only (ADR-049)
    if (options.phase === 'investigate' || options.phase === 'improve') {
      parts.push(
        `Insight capture guidance (INVESTIGATE/IMPROVE phases):
- Use suggest_save_finding when the conversation reveals:
  - A validated hypothesis conclusion (supported or refuted)
  - A quantitative process insight (specific eta-squared, Cpk shift, or defect rate)
  - A negative learning (approach tried and found ineffective — equally valuable)
  - A root cause identification with supporting evidence
  - A cross-factor interaction discovered during drill-down
- Include negative learnings: "Adjusting temperature had no effect on variation (eta-squared < 0.01)" is as valuable as positive findings.
- Do NOT suggest saving generic observations or restating what's already in findings.
- Limit to 1-2 suggestions per conversation to avoid prompt fatigue.`
      );
    }
  }

  // Prior CoScout insights nudge — tell CoScout about findings it already helped create (ADR-049)
  if (options.coscoutInsights && options.coscoutInsights.length > 0) {
    const insightLines = options.coscoutInsights.map(i => `- "${i.text}" (${i.status})`).join('\n');
    parts.push(
      `Previous CoScout insights saved as findings:\n${insightLines}\nBuild on these — don't repeat them.`
    );
  }

  const prompt = parts.join('\n\n');

  if (import.meta.env.DEV) {
    const estTokens = Math.ceil(prompt.length / 4);
    if (estTokens < 1024) {
      console.warn(
        `[VariScout AI] CoScout system prompt ~${estTokens} tokens. Prompt caching requires ≥1,024.`
      );
    }
  }

  return prompt;
}

/** Maximum number of history messages to include in CoScout API calls */
const COSCOUT_HISTORY_LIMIT = 10;

/**
 * Format Knowledge Base results for injection into CoScout system prompt.
 *
 * ADR-026: Primary path is SharePoint documents via Remote SharePoint knowledge sources.
 * The findings path is deprecated but kept for backward compatibility (returns empty []).
 *
 * Documents include source attribution (folder path, URL) for natural citation.
 */
export function formatKnowledgeContext(
  results: NonNullable<AIContext['knowledgeResults']>,
  documents?: AIContext['knowledgeDocuments']
): string {
  const sections: string[] = [];

  // Legacy findings path (deprecated — ADR-026)
  if (results.length > 0) {
    const lines = results.map((r, i) => {
      const parts = [
        `${i + 1}. [From: findings] "${r.suspectedCause || 'Unknown cause'}" — ${r.projectName}`,
      ];
      parts.push(`   Factor: ${r.factor}, Status: ${r.status}`);
      if (r.etaSquared !== null)
        parts.push(`   η²: ${formatStatistic(r.etaSquared * 100, 'en', 1)}%`);
      if (r.cpkBefore !== null && r.cpkAfter !== null)
        parts.push(
          `   Cpk: ${formatStatistic(r.cpkBefore, 'en', 2)} → ${formatStatistic(r.cpkAfter, 'en', 2)}`
        );
      if (r.actionsText) parts.push(`   Actions: ${r.actionsText}`);
      if (r.outcomeEffective !== null)
        parts.push(`   Outcome: ${r.outcomeEffective ? 'effective' : 'not effective'}`);
      return parts.join('\n');
    });
    sections.push(lines.join('\n\n'));
  }

  // Document results (ADR-026: primary knowledge path via SharePoint)
  if (documents && documents.length > 0) {
    const docLines = documents.map((d, i) => {
      const parts = [`${i + 1}. 📄 "${d.title}" [Source: ${d.source}]`];
      if (d.snippet) {
        // Truncate but keep enough for meaningful context
        const truncated = d.snippet.length > 400 ? d.snippet.slice(0, 400) + '…' : d.snippet;
        parts.push(`   ${truncated}`);
      }
      if (d.url) parts.push(`   Link: ${d.url}`);
      return parts.join('\n');
    });
    sections.push(docLines.join('\n\n'));
  }

  if (sections.length === 0) return '';

  return `Knowledge Base documents found (from the team's SharePoint — cite these naturally with [Source: name] when relevant):\n${sections.join('\n\n')}`;
}

/**
 * Build the full messages array for a CoScout API call.
 * Returns [system (with glossary), context summary, ...recent history, user message].
 *
 * Glossary is placed in the system prompt (static prefix) for Azure AI Foundry
 * automatic prompt caching. Variable context follows in a separate system message.
 */
export function buildCoScoutMessages(
  context: AIContext,
  history: CoScoutMessage[],
  userMessage: string,
  options?: { journeyPhase?: JourneyPhase; isTeamPlan?: boolean }
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  // System prompt with glossary (static cacheable prefix) + investigation context
  messages.push({
    role: 'system',
    content: buildCoScoutSystemPrompt({
      glossaryFragment: context.glossaryFragment,
      investigation: context.investigation,
      teamContributors: context.teamContributors,
      sampleCount: context.stats?.samples,
      stagedComparison: context.stagedComparison,
      locale: context.locale,
      entryScenario: context.entryScenario,
      phase: options?.journeyPhase,
      hasActionTools: options?.journeyPhase != null,
      synthesis: context.process?.synthesis,
    }),
  });

  // Context summary — variable per analysis state
  const contextSummary = buildSummaryPrompt(context).replace(
    /Summarize this analysis state.*$/,
    "This is the current analysis context. Use it to answer the user's question."
  );
  messages.push({ role: 'system', content: contextSummary });

  // Knowledge Base context (when preview enabled and results/documents available)
  const hasKnowledgeResults = context.knowledgeResults && context.knowledgeResults.length > 0;
  const hasKnowledgeDocs = context.knowledgeDocuments && context.knowledgeDocuments.length > 0;
  if (hasKnowledgeResults || hasKnowledgeDocs) {
    const knowledgeContent = formatKnowledgeContext(
      context.knowledgeResults ?? [],
      context.knowledgeDocuments
    );
    if (knowledgeContent) {
      messages.push({ role: 'system', content: knowledgeContent });
    }
  }

  // Recent history (last N messages to stay within token budget)
  const recentHistory = history.slice(-COSCOUT_HISTORY_LIMIT);
  for (const msg of recentHistory) {
    if (!msg.error) {
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  // Current user message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

// ── Tool Routing Instructions (ADR-029) ──────────────────────────────────

/**
 * Build tool routing instructions for the CoScout system prompt.
 * Added when action tools are enabled.
 */
function buildToolRoutingInstructions(): string {
  return `Tool usage guidance:
- Call get_available_factors before apply_filter to verify factor and category names exist.
- Use compare_categories to identify which categories show the most variation before suggesting filters.
- Action tools (apply_filter, clear_filters, create_hypothesis, create_finding, suggest_action) return PROPOSALS, not executions. The user must confirm.
- When an action tool returns a proposal, include the [ACTION:tool_name:params_json] marker in your response so the UI can render a confirmation card.
- Propose one action at a time — do not chain multiple action tools in one turn.
- Use switch_factor after apply_filter to show remaining factors within the filtered subset. Call get_available_factors first to verify the factor name.
- Prefer compare_categories over apply_filter when the user is exploring (SCOUT phase).

Hypothesis guidance (Investigation Diamond):
- Root hypothesis: use create_hypothesis with parent_id=null when starting an investigation or when the user states a new causal theory.
- Sub-hypothesis: use create_hypothesis with parent_id="<existing_id>" when breaking a root cause into testable branches. Ask the user what sub-causes might explain the root hypothesis.
- Never create sub-hypotheses more than 3 levels deep or more than 8 siblings per parent.
- When factor and level are specified, VariScout auto-validates using ANOVA (Contribution % >=15% supported, <5% contradicted, 5-15% partial). Recommend linking hypotheses to factors whenever possible.
- When a data-validated hypothesis has weak evidence (p ≥ 0.05), suggest gemba or expert validation. Never advise 'collect more data and wait.'
- When a hypothesis cannot be tested with data (physical wear, alignment, contamination), set validation_type to "gemba" or "expert" and provide a clear validation_task.

Finding guidance:
- Use create_finding when the user identifies a notable pattern worth recording.
- Also proactively suggest create_finding when you detect a notable pattern: Cpk below target, Contribution % > 15% for a factor, out-of-control violations.
- Write finding text as a concise factual observation: "[Factor] shows [metric] = [value] ([context])".

Action suggestion guidance (IMPROVE phase):
- Use suggest_action when the user asks "what should we do?" or when you have a concrete improvement recommendation.
- When Knowledge Base search returned relevant SOPs, cite them and set the source field.
- Write action text as a clear, executable task: "[Verb] [what] [where/when] — [rationale or source]".
- suggest_action only works on findings at 'analyzed' or 'improving' status.

Knowledge Base in IMPROVE phase:
- Search for similar past improvement patterns and their outcomes before suggesting actions.
- Look up sustaining control procedures (SOPs, work instructions) relevant to the corrective action.
- When verifying outcomes, search for historical Cpk benchmarks to contextualize improvement magnitude.

PDCA coaching (when investigation phase is 'improving'):
- PLAN (finding at 'analyzed' status, no actions yet):
  - Ask what improvement ideas the team has considered. Proactively suggest suggest_knowledge_search for similar past fixes and SOPs.
  - If ideas have What-If projections, compare projected impact. Suggest prioritizing the idea with highest Cpk improvement.
  - Suggest classifying ideas by direction: prevent (stop the cause), detect (catch it sooner), simplify (reduce complexity), eliminate (remove the step).
  - Use suggest_action to convert selected ideas into executable tasks with clear owners and deadlines.
  - Use suggest_improvement_idea to propose ideas for supported hypotheses based on the suspected cause and KB results.

- DO (finding at 'improving' status, actions in progress):
  - Acknowledge action progress: "N of M actions complete."
  - If overdue actions exist, flag them: "N actions are past their due date."
  - Suggest notify_action_owners (Team plan) if actions have assignees but aren't progressing.
  - Do NOT suggest new actions unless the analyst asks — focus on tracking existing ones.

- CHECK (staged comparison data available):
  - Interpret staged deltas quantitatively with decision criteria:
    - Cpk delta > 0 AND Cpk after >= target: strong evidence of improvement
    - Cpk delta > 0 BUT Cpk after < target: partial improvement, more work needed
    - Variation ratio < 0.8: meaningful variation reduction
    - Variation ratio > 1.0: variation INCREASED — flag as concern
    - New out-of-control violations in After data: flag as potential new issue
  - Recommend compare_categories on the addressed factor to verify IT specifically improved (not just aggregate shift).
  - If Cpk is still below target despite improvement, say so explicitly with the gap.

- ACT (all actions complete, outcome assessment needed):
  - Based on staged data, propose an outcome assessment:
    - Cpk after >= target AND variation ratio < 1.0: suggest "effective"
    - Cpk improved but still below target: suggest "partial"
    - Cpk unchanged or degraded: suggest "not effective"
  - For effective: suggest sustaining controls — update SOPs, set control chart limits, schedule 30-day follow-up.
  - For partial/not effective: suggest which factors to re-investigate, whether the root cause was actually addressed.

Improvement idea guidance (converging/IMPROVE):
- Use suggest_improvement_idea when a hypothesis is supported and the analyst needs ideas for what to try.
- When asked for ideas, suggest 2-4 covering different Ideation Directions and timeframe levels.
- Classify each idea using the Four Ideation Directions:
  - prevent: stop the cause from occurring (poka-yoke, maintenance schedule, SOP update)
  - detect: catch it sooner before defects (sensor, alarm, control chart alert, visual inspection)
  - simplify: reduce complexity to reduce error opportunities (fewer steps, visual guides, kits)
  - eliminate: remove the step or factor entirely (automate, redesign)
- Always estimate timeframe: just-do (existing resources, no approval), days (minor coordination), weeks (planning, moderate resources), months (investment, cross-team).
- Always estimate cost: none (no cost), low (team budget), medium (needs approval), high (capital investment).
- If you can assess the risk, provide risk_axis1 (process impact 1-3) and risk_axis2 (safety impact 1-3). Set null if uncertain.
- Prefer lean improvements — the simplest fix that addresses the root cause. Suggest just-do and days timeframe ideas first.
- Assess feasibility: Does it remove the root cause? Can the team do it themselves? Can they try small first? Can they measure the result?
- If Knowledge Base search revealed a past fix for a similar cause, suggest it as an improvement idea with the source cited.
- suggest_improvement_idea only works on hypotheses with 'supported' or 'partial' status.

Sharing guidance (Team plan only):
- Use share_finding at investigation milestones, not during active investigation.
- Use publish_report when the analyst has completed a meaningful analysis cycle.
- Use notify_action_owners when the analyst has finalized improvement actions (PDCA "Do" phase).
- These tools send content externally. Always include clear preview.

The entry scenario may have changed since the previous turn. Always reference the current scenario in your tool decisions.`;
}

/**
 * Build entry-scenario-specific tool routing guidance.
 */
function buildEntryScenarioGuidance(scenario: EntryScenario): string {
  switch (scenario) {
    case 'problem':
      return `Entry scenario: Problem to solve — The analyst has a specific problem (e.g., Cpk below target).
- SCOUT: Proactively use compare_categories to scan all factors for the biggest contributor. Suggest apply_filter to drill into the top contributor. Propose create_finding for the key observation.
- INVESTIGATE: Guide the analyst to create hypotheses linked to the top-contributing factors.
- IMPROVE: Check whether Cpk has reached the original target. In PLAN sub-state, suggest ideas targeting the confirmed root cause. In CHECK, compare before/after Cpk against the stated problem threshold. In ACT, assess whether the original problem is resolved.`;

    case 'hypothesis':
      return `Entry scenario: Hypothesis to check — The analyst entered with an upfront hypothesis.
- SCOUT: Immediately use compare_categories on the factor named in the hypothesis. Report Contribution % and per-category stats. If supported (>=15%), suggest apply_filter and create_finding.
- INVESTIGATE: Propose create_hypothesis with the upfront hypothesis as the root node. Then suggest sub-hypotheses.
- IMPROVE: After addressing the confirmed cause, compare before/after on the metric linked to the original hypothesis. In PLAN, search KB for fixes to the confirmed hypothesis factor. In ACT, verify whether the hypothesis-specific metric improved.`;

    case 'routine':
      return `Entry scenario: Routine check — No specific problem or hypothesis. Scanning for signals.
- SCOUT: Use compare_categories conservatively. Only suggest apply_filter if a notable signal is found (Contribution % > 10%). Do NOT proactively suggest findings unless a clear anomaly is detected.
- INVESTIGATE: Only reached if the analyst manually creates a finding. Follow their lead.
- IMPROVE: Signal has been addressed — help evaluate whether sustaining controls prevent recurrence. In PLAN, suggest preventive actions and SOP updates. In ACT, recommend scheduling a follow-up check in 30 days.`;
  }
}
