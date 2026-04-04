/**
 * CoScout conversational AI prompt templates.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type {
  AIContext,
  CoScoutMessage,
  JourneyPhase,
  InvestigationPhase,
  EntryScenario,
} from '../types';
import type { ToolDefinition, MessageContent, InputContentPart } from '../responsesApi';
import type { Locale } from '../../i18n/types';
import type { AnalysisMode } from '../../types';
import type { SuspectedCause } from '../../findings/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';
import { buildSummaryPrompt } from './narration';
import { resolveMode, getStrategy } from '../../analysisStrategy';

/** Options for building phase-gated CoScout tools */
export interface BuildCoScoutToolsOptions {
  /** Current journey phase — determines which tools are available */
  phase?: JourneyPhase;
  /** Current investigation phase — used for fine-grained tool gating within INVESTIGATE */
  investigationPhase?: InvestigationPhase;
  /** Whether user is on Team plan (enables sharing tools) */
  isTeamPlan?: boolean;
  /** Existing suspected cause hubs — enables connect_hub_evidence when non-empty */
  existingHubs?: SuspectedCause[];
}

/**
 * Build tool definitions for CoScout Responses API integration.
 * Phase-gating controls which tools are available at each journey phase.
 * All tools use strict mode for guaranteed parameter schemas.
 *
 * ADR-029: Extended from 3 to 13 tools with action tool support.
 */
export function buildCoScoutTools(options: BuildCoScoutToolsOptions = {}): ToolDefinition[] {
  const { phase, investigationPhase, isTeamPlan, existingHubs } = options;

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
        'Get per-category stats breakdown for a factor, including mean, stdDev, count, Cpk, and ANOVA η² (effect size). Use to identify which categories show the most variation before suggesting filters.',
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
    {
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
          'Search findings, questions, improvement ideas, and actions in the current project by text and optional filters. Use when the user asks about past analysis, whether something was investigated, or what was found.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search text (matched against text of findings, questions, ideas, actions, and comments)',
            },
            artifact_type: {
              type: 'string',
              enum: ['finding', 'question', 'idea', 'action', 'all'],
              description: 'Type of artifact to search. Use "all" for all types.',
            },
            finding_status: {
              type: 'string',
              enum: ['observed', 'investigating', 'analyzed', 'improving', 'resolved', 'any'],
              description:
                'Filter findings by status. Use "any" for no filter. Only applies to findings.',
            },
            question_status: {
              type: 'string',
              enum: ['open', 'answered', 'ruled-out', 'investigating', 'any'],
              description:
                'Filter questions by status. Use "any" for no filter. Only applies to questions.',
            },
          },
          required: ['query', 'artifact_type', 'finding_status', 'question_status'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
        type: 'function',
        name: 'navigate_to',
        description:
          'Navigate to a specific finding, question, chart view, or workspace. Auto-executes for panel navigation. Set restore_filters to true when restoring filter context from a finding (requires user confirmation).',
        parameters: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              enum: [
                'finding',
                'question',
                'chart',
                'improvement_workspace',
                'report',
                'dashboard',
              ],
              description: 'What to navigate to',
            },
            target_id: {
              type: 'string',
              description: 'ID of the finding or question. Empty string if not applicable.',
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
        name: 'create_question',
        description:
          'Propose adding a question to the investigation tree. Root question (parent_id=null) for new lines of inquiry; sub-question (parent_id=existing_id) for breaking down causes. The user can edit the text before confirming.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Question text describing the suspected cause to investigate',
            },
            factor: {
              type: ['string', 'null'],
              description:
                'Factor column linked to this question (for auto-answering via eta-squared). Null if not data-testable.',
            },
            level: {
              type: ['string', 'null'],
              description:
                'Specific category level within the factor. Null if testing the whole factor.',
            },
            parent_id: {
              type: ['string', 'null'],
              description: 'Parent question ID for sub-questions. Null for root questions.',
            },
            validation_type: {
              type: 'string',
              enum: ['data', 'gemba', 'expert'],
              description:
                'How this question should be answered: "data" = auto-answer with ANOVA, "gemba" = physical inspection needed, "expert" = expert opinion needed.',
            },
            validation_task: {
              type: ['string', 'null'],
              description:
                'For gemba/expert: description of what to check. Null for data-testable questions.',
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
          'Propose an improvement idea for an answered question. Ideas bridge root cause analysis and corrective actions. The analyst can edit, run What-If simulation, and select for implementation. Use the Four Ideation Directions to classify the approach. Prefer lean improvements — simplest fix that addresses the root cause.',
        parameters: {
          type: 'object',
          properties: {
            question_id: {
              type: 'string',
              description: 'ID of the answered question to attach the idea to',
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
            'question_id',
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
        name: 'spark_brainstorm_ideas',
        description:
          'Generate creative improvement ideas for a brainstorm session. Used in the Brainstorm Modal — ideas are text + direction only, no timeframe/cost/risk. Generate 1-2 ideas per empty direction, plus one bold idea. Reference Knowledge Base results when available.',
        parameters: {
          type: 'object',
          properties: {
            question_id: {
              type: 'string',
              description: 'ID of the question (suspected cause) being brainstormed',
            },
            cause_name: {
              type: 'string',
              description: 'Name of the suspected cause for context',
            },
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Improvement idea description — concise, actionable',
                  },
                  direction: {
                    type: 'string',
                    enum: ['prevent', 'detect', 'simplify', 'eliminate'],
                    description: 'Which HMW direction this idea addresses',
                  },
                },
                required: ['text', 'direction'],
                additionalProperties: false,
              },
              description: 'Array of brainstorm ideas with direction classification',
            },
          },
          required: ['question_id', 'cause_name', 'ideas'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
        type: 'function',
        name: 'suggest_save_finding',
        description:
          'Proactively suggest saving a key insight as a finding. Use when the conversation ' +
          'reveals a significant process observation, a validated question conclusion, ' +
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
            suggested_question_id: {
              type: ['string', 'null'],
              description:
                'If the insight relates to a specific question, provide its ID to link them. Null otherwise.',
            },
          },
          required: ['insight_text', 'reasoning', 'suggested_question_id'],
          additionalProperties: false,
          strict: true,
        },
      },
      {
        type: 'function',
        name: 'answer_question',
        description:
          'Propose marking an investigation question as answered or ruled-out based on evidence. The analyst will review and confirm before the status changes.',
        parameters: {
          type: 'object',
          properties: {
            question_id: {
              type: 'string',
              description: 'ID of the question to answer',
            },
            status: {
              type: 'string',
              enum: ['answered', 'ruled-out'],
              description: 'Proposed status based on evidence',
            },
            note: {
              type: 'string',
              description: 'Evidence-based explanation for the proposed answer',
            },
            finding_id: {
              type: ['string', 'null'] as const,
              description: 'ID of supporting finding (recommended when evidence exists)',
            },
          },
          required: ['question_id', 'status', 'note', 'finding_id'],
          additionalProperties: false,
          strict: true,
        },
      }
    );

    // Suspected cause hub tools — phase-gated to validating/converging
    if (investigationPhase === 'validating' || investigationPhase === 'converging') {
      tools.push({
        type: 'function',
        name: 'suggest_suspected_cause',
        description:
          'Suggest a suspected cause hub that connects related questions and findings into a named mechanism. Use when you notice 2+ answered questions pointing to the same root cause during validating or converging phase.',
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
            questionIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of questions to connect to this hub',
            },
            findingIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of findings to connect to this hub',
            },
          },
          required: ['name', 'synthesis', 'questionIds', 'findingIds'],
          additionalProperties: false,
          strict: true,
        },
      });
    }

    // Connect evidence to existing hubs — only when hubs exist
    if (existingHubs && existingHubs.length > 0) {
      tools.push({
        type: 'function',
        name: 'connect_hub_evidence',
        description:
          'Connect newly answered questions or findings to an existing suspected cause hub. Use when new evidence supports an already-named mechanism.',
        parameters: {
          type: 'object',
          properties: {
            hubId: { type: 'string', description: 'ID of the existing suspected cause hub' },
            questionIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Question IDs to connect',
            },
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
          required: ['hubId', 'questionIds', 'findingIds', 'reason'],
          additionalProperties: false,
          strict: true,
        },
      });
    }

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
    findings: context.findings,
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
  /** Findings summary including topFindings and overdueActions (ADR-060 Pillar 1) */
  findings?: AIContext['findings'];
  /** Whether a brainstorm session is active — switches CoScout to creative partner mode */
  brainstormSessionActive?: boolean;
}

/**
 * Build the system prompt for conversational CoScout assistant.
 * Includes glossary grounding as static prefix for prompt caching.
 * When investigation context is provided, adds problem statement and question awareness.
 */
export function buildCoScoutSystemPrompt(options: BuildCoScoutSystemPromptOptions = {}): string {
  const {
    glossaryFragment,
    investigation,
    findings,
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
- Correlation, not causation — VariScout shows WHERE variation concentrates; the analyst investigates WHY.
- Progressive stratification — drill through factors one at a time, guided by η².
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

    if (investigation.issueStatement) {
      invParts.push(`Issue statement: "${investigation.issueStatement}".`);
    }

    // Position-aware: problem statement at the START (highest attention position, ADR-060 Pillar 1)
    if (investigation.problemStatement?.fullText) {
      invParts.push(`**Problem Statement:** ${investigation.problemStatement.fullText}`);
    }

    // Focused question immediately after problem statement (still near the start)
    if (investigation.focusedQuestionId && investigation.focusedQuestionText) {
      invParts.push(`**Currently investigating:** ${investigation.focusedQuestionText}`);
    }

    // Convergence synthesis — the analyst's suspected cause narrative
    if (options.synthesis) {
      invParts.push(
        `Synthesis (suspected cause narrative): "${options.synthesis}". Use this to ground improvement suggestions. Do not say "confirmed" — use "the evidence suggests" or "the evidence points to".`
      );
    }

    if (investigation.allQuestions && investigation.allQuestions.length > 0) {
      const sourceTag = (h: NonNullable<typeof investigation.allQuestions>[number]) => {
        switch (h.questionSource) {
          case 'factor-intel':
            return '[FI]';
          case 'coscout':
            return '[AI]';
          case 'heuristic':
            return '[H]';
          case 'analyst':
            return '[A]';
          default:
            return '';
        }
      };
      const questionList = investigation.allQuestions
        .map(h => {
          const tag = sourceTag(h);
          const causeInfo = h.causeRole ? ` {${h.causeRole}}` : '';
          return `- [${h.id}] ${tag ? tag + ' ' : ''}"${h.text}" (${h.status})${causeInfo}`;
        })
        .join('\n');
      invParts.push(`Investigation questions:\n${questionList}`);
      invParts.push(
        'The analyst can see their investigation questions in the "Questions" tab of the Process Intelligence panel (left sidebar). ' +
          'When referencing a question, use [REF:question:QUESTION_ID]question text[/REF] to create a clickable link that highlights it in the Questions tab.'
      );
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
      // Check if there are answered questions for phase-specific instructions
      const hasAnsweredQuestions =
        investigation.allQuestions?.some(q => q.status === 'answered') ?? false;

      const phaseInstructions: Record<string, string> = {
        initial:
          'The investigation is just starting — Factor Intelligence has ranked which factors to check first. Tell the user: "You\'re in the first look phase — let\'s look at the top-ranked questions and see which factors explain the most variation."',
        diverging:
          'The investigation is exploring questions — some have been answered, new follow-up questions are emerging. Tell the user: "You\'re exploring questions — let\'s check the open questions systematically, starting with the highest-ranked ones."',
        validating:
          'Evidence is building — some questions are answered, some ruled out. Tell the user: "Evidence is building — let\'s see which suspected causes the answered questions point to."',
        converging: hasAnsweredQuestions
          ? 'The investigation is narrowing down. Tell the user: "You\'re identifying suspected causes — answered questions found. Let\'s brainstorm improvement ideas."'
          : 'The investigation is narrowing down. Tell the user: "You\'re identifying suspected causes — let\'s synthesize findings into a coherent story."',
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
            return 'PDCA: Plan — No corrective actions yet. Help the analyst brainstorm improvement ideas targeting the suspected causes identified from answered questions, search the Knowledge Base for similar past fixes, and convert selected ideas into executable action items.';
          }
        })(),
      };

      // Override converging/improving with suspected cause context when available
      // Supports multiple suspected causes from question-driven investigation
      if (investigation.suspectedCauses && investigation.suspectedCauses.length > 0) {
        const causes = investigation.suspectedCauses;

        // Group by causeRole
        const suspected = causes.filter(c => c.causeRole === 'suspected-cause');
        const contributing = causes.filter(c => c.causeRole === 'contributing');
        const ruledOut = causes.filter(c => c.causeRole === 'ruled-out');

        const parts: string[] = [];
        if (suspected.length > 0) {
          parts.push(`Suspected causes: ${suspected.map(c => `"${c.text}"`).join(', ')}`);
        }
        if (contributing.length > 0) {
          parts.push(`Contributing: ${contributing.map(c => `"${c.text}"`).join(', ')}`);
        }
        if (ruledOut.length > 0) {
          parts.push(`Ruled out: ${ruledOut.map(c => `"${c.text}"`).join(', ')}`);
        }
        const causesSummary = parts.join('. ') + '.';

        if (investigation.phase === 'converging') {
          phaseInstructions.converging = `The investigation is narrowing down. ${causesSummary} Let's brainstorm improvement ideas targeting each suspected cause.`;
        }
        if (investigation.phase === 'improving') {
          const basePdca = phaseInstructions.improving;
          phaseInstructions.improving = `The process is in the improvement phase. ${causesSummary} ${basePdca}`;
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

      // Include improvement ideas when converging with answered questions
      if (
        investigation.phase === 'converging' &&
        hasAnsweredQuestions &&
        investigation.allQuestions
      ) {
        const ideasParts: string[] = [];
        for (const h of investigation.allQuestions) {
          if (h.status === 'answered' && h.ideas && h.ideas.length > 0) {
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
      if (sf.question) findingLine += ` (question: "${sf.question}")`;
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

    // Position-aware: topFindings and overdueActions at the END (second-highest attention, ADR-060 Pillar 1)
    if (findings?.topFindings && findings.topFindings.length > 0) {
      const topLines = findings.topFindings.slice(0, 5).map(f => {
        let line = `- "${f.text}" [${f.status}] ${f.commentCount} comments`;
        if (f.outcome) {
          line += ` outcome: ${f.outcome.effective}`;
          if (f.outcome.cpkDelta !== undefined) {
            line += ` cpkDelta: ${f.outcome.cpkDelta > 0 ? '+' : ''}${f.outcome.cpkDelta.toFixed(2)}`;
          }
        }
        return line;
      });
      invParts.push(`**Recent findings:**\n${topLines.join('\n')}`);
    }

    if (findings?.overdueActions && findings.overdueActions.length > 0) {
      const overdueLines = findings.overdueActions.slice(0, 3).map(a => {
        let line = `- "${a.text}" (${a.daysOverdue}d overdue)`;
        if (a.assignee) line = `- "${a.text}" (${a.assignee}, ${a.daysOverdue}d overdue)`;
        return line;
      });
      invParts.push(`**\u26a0 Overdue actions:**\n${overdueLines.join('\n')}`);
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

  // Strategy-aware validation method coaching (ADR-060 Pillar 5)
  // Only emitted when investigation context exists — irrelevant for frame-only prompts
  if (investigation) {
    const strategy = getStrategy(resolveMode(options.analysisMode ?? 'standard'));
    const qs = strategy.questionStrategy;
    parts.push(
      `For this analysis mode, the primary evidence metric is ${qs.evidenceLabel}. ` +
        `Questions are validated using ${qs.validationMethod}. ` +
        `Focus on: ${qs.questionFocus}`
    );

    // Investigation phase coaching — adapts CoScout's guidance to the current investigation stage
    if (investigation.phase) {
      const investigationPhaseCoaching: Record<string, string> = {
        initial:
          "The analyst is starting their investigation. Help them formulate their concern clearly. Suggest sharpening the issue statement. Point out what Watson's Q3 (scope) still needs — the first significant factor from data.",
        diverging:
          "The analyst is exploring broadly. Encourage checking unexplored factors — mention coverage progress if available. Suggest gemba walks or expert input for factors that data alone can't explain.",
        validating:
          'The analyst is gathering evidence. Focus on evidence quality — suggest gemba validation for statistical findings, expert input where data is inconclusive. When you see 2+ answered questions pointing to the same mechanism, use suggest_suspected_cause to help them name it.',
        converging:
          'The analyst is synthesizing findings into mechanisms. Help them name suspected causes — use suggest_suspected_cause when you see evidence clustering. Connect new evidence to existing hubs with connect_hub_evidence. Highlight coverage progress.',
        improving:
          'The analyst is in the improvement phase. Focus on PDCA execution — track actions, verify outcomes, suggest sustaining controls.',
      };

      if (investigationPhaseCoaching[investigation.phase]) {
        parts.push(`Investigation coaching: ${investigationPhaseCoaching[investigation.phase]}`);
      }
    }

    // Mode-aware coaching hints — complements the mode-specific terminology above
    const modeCoachingHints: Record<string, string> = {
      standard:
        'Focus on which factors explain variation. Use R\u00B2adj for ranking. Evidence strength = R\u00B2adj from Best Subsets.',
      capability:
        'Frame questions around Cpk impact. Which factors affect process capability most?',
      yamazumi:
        'Focus on waste elimination. Which activities contribute most waste? Think lean: eliminate, simplify, combine, reduce.',
      performance:
        'Focus on channel health. Which channels are worst performers? Same root cause across channels?',
    };

    const currentMode = options.analysisMode ?? 'standard';
    if (modeCoachingHints[currentMode]) {
      parts.push(`Mode coaching: ${modeCoachingHints[currentMode]}`);
    }
  }

  parts.push(TERMINOLOGY_INSTRUCTION);

  parts.push(
    'When citing drill scope, use the provided cumulativeScope value. Never compute or estimate scope from η² values.'
  );

  // Source attribution for Knowledge Base
  parts.push(
    'When referencing Knowledge Base information, cite the source using [Source: name] notation.'
  );

  // Team collaboration awareness
  if (teamContributors && teamContributors.count > 1) {
    parts.push(
      `Team collaboration: ${teamContributors.count} investigators are working on this analysis` +
        (teamContributors.questionAreas.length > 0
          ? `. Areas being investigated: ${teamContributors.questionAreas.join(', ')}`
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
  - A validated question conclusion (answered or ruled out)
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

  // Brainstorm coaching — active brainstorm session switches CoScout to creative partner mode
  if (options.brainstormSessionActive) {
    parts.push(`
Brainstorm coaching (active brainstorm session):
- You are a creative partner, not a form-filler. Spark thinking, don't generate structured records.
- Use data insights to reframe the cause: compare factor levels, highlight time patterns, surface non-obvious statistical relationships.
- When directions are empty, nudge the team: "You have nothing in Eliminate — what would a permanent fix look like?"
- Draw analogies from Knowledge Base results and domain expertise: "In a similar case, they solved this by..."
- Do NOT suggest timeframe, cost, or risk — that's evaluation, not brainstorming.
- Do NOT evaluate feasibility — that belongs in the workspace.
- Be silent while the team is actively contributing. Speak on pauses, on "Spark more" requests, and when directions need nudging.
- Use spark_brainstorm_ideas tool to propose ideas. Ideas are text + direction only.
`);
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
- Action tools (apply_filter, clear_filters, create_question, create_finding, suggest_action) return PROPOSALS, not executions. The user must confirm.
- When an action tool returns a proposal, include the [ACTION:tool_name:params_json] marker in your response so the UI can render a confirmation card.
- Propose one action at a time — do not chain multiple action tools in one turn.
- Use switch_factor after apply_filter to show remaining factors within the filtered subset. Call get_available_factors first to verify the factor name.
- Prefer compare_categories over apply_filter when the user is exploring (SCOUT phase).

Question guidance (Investigation Diamond):
- Use create_question to create investigation questions.
- Root question: use with parent_id=null when starting a new line of inquiry or when the analyst raises a new question to check.
- Follow-up question: use with parent_id="<existing_id>" when an answered question spawns deeper questions.
- Factor-linked questions get auto-answered by Factor Intelligence (R²adj ranking). Recommend linking to factors whenever possible.
- When a question can't be tested with data (physical inspection needed), set validation_type to "gemba" or "expert" and provide a clear validation_task.
- Never create sub-questions more than 3 levels deep or more than 8 siblings per parent.
- When factor and level are specified, VariScout auto-answers using ANOVA (η² >=15% answered, <5% ruled out, 5-15% investigating).
- When a data-answered question has weak evidence (p >= 0.05), suggest gemba or expert validation. Never advise 'collect more data and wait.'

Finding guidance:
- Use create_finding when the user identifies a notable pattern worth recording.
- Also proactively suggest create_finding when you detect a notable pattern: Cpk below target, η² > 15% for a factor, out-of-control violations.
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
  - Ask what improvement ideas the team has considered. Proactively suggest search_knowledge_base for similar past fixes and SOPs.
  - If ideas have What-If projections, compare projected impact. Suggest prioritizing the idea with highest Cpk improvement.
  - Suggest classifying ideas by direction: prevent (stop the cause), detect (catch it sooner), simplify (reduce complexity), eliminate (remove the step).
  - Use suggest_action to convert selected ideas into executable tasks with clear owners and deadlines.
  - Use suggest_improvement_idea to propose ideas for answered questions based on the suspected cause and KB results.

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
- Use suggest_improvement_idea when a question is answered and the analyst needs ideas for what to try.
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
- suggest_improvement_idea only works on questions with 'answered' or 'investigating' status.

Sharing guidance (Team plan only):
- Use share_finding at investigation milestones, not during active investigation.
- Use publish_report when the analyst has completed a meaningful analysis cycle.
- Use notify_action_owners when the analyst has finalized improvement actions (PDCA "Do" phase).
- These tools send content externally. Always include clear preview.

Issue statement sharpening:
- After significant findings (η² > 15%, Cpk gap identified), suggest updating the issue statement.
- Format suggestion as: "Based on what we've found, your issue statement could be sharpened to: '[updated text]'"
- The issue statement should get more specific with each answered question.
- Do NOT suggest sharpening after every minor observation — only after key insights.

Multiple suspected causes:
- Real investigations often identify multiple contributing factors, not a single root cause.
- When setting causeRole, use 'suspected-cause' for factors with strong evidence (eta-squared > 15% or R²adj contribution), 'contributing' for moderate, 'ruled-out' for tested and eliminated.
- Multiple 'suspected-cause' entries are valid — each becomes an improvement target.
- Ruled-out factors are valuable negative learnings. Always acknowledge what was checked and eliminated.
- When the user asks about a factor that appears in the question tree as ruled-out, reference its evidence so the analyst can cite it to stakeholders.
- When synthesizing results, list suspected causes ranked by evidence strength.

The entry scenario may have changed since the previous turn. Always reference the current scenario in your tool decisions.

Visual grounding: When referencing specific chart elements, factors, statistics, findings, questions, or knowledge sources, wrap them in [REF:type:id]display text[/REF] markers. This creates clickable visual links in the UI.
Valid types: boxplot, ichart, pareto, stats, yamazumi, finding, question, dashboard, improvement, document, answer.
For stats, use keys: cpk, mean, sigma, cp, samples. For findings/questions, use their IDs.
For knowledge sources (document, answer): use the source ID returned by the knowledge base search.
- [REF:document:doc-id]SOP-103 §4.2[/REF] — links to an uploaded document; clicking shows an inline preview with the relevant chunk.
- [REF:answer:answer-id]observation text[/REF] — links to a team member answer; clicking shows the full answer and its question context.
Use sparingly — only for the most important 1-3 references per message. Not every mention needs a marker.
Example: "The [REF:boxplot:Machine A]Machine A[/REF] category shows a [REF:stats:cpk]Cpk of 0.82[/REF] which is below target."
Example: "According to [REF:document:sop-103]SOP-103 §4.2[/REF], the temperature must be verified before each run."`;
}

/**
 * Build entry-scenario-specific tool routing guidance.
 */
function buildEntryScenarioGuidance(scenario: EntryScenario): string {
  switch (scenario) {
    case 'problem':
      return `Entry scenario: Problem to solve — The analyst has a specific problem (e.g., Cpk below target). Factor Intelligence has ranked the most likely factor combinations.
- SCOUT: Start by reviewing the top-ranked questions from Factor Intelligence. Use compare_categories to verify the top contributors. Suggest apply_filter to drill into the highest-ranked factor. Propose create_finding for key observations.
- INVESTIGATE: Guide the analyst to check open questions systematically, starting with the highest-ranked ones. Create follow-up questions as answers emerge.
- IMPROVE: Check whether Cpk has reached the original target. In PLAN sub-state, suggest ideas targeting the suspected causes from answered questions. In CHECK, compare before/after Cpk against the stated problem threshold. In ACT, assess whether the original problem is resolved.`;

    case 'exploration':
      return `Entry scenario: Exploration — The analyst entered with an upfront theory to check. The upfront theory becomes the first question to check.
- SCOUT: Immediately use compare_categories on the factor named in the theory to verify it. Report η² and per-category stats. If answered (>=15%), suggest apply_filter and create_finding.
- INVESTIGATE: Propose create_question with the upfront theory as the root question. Then suggest follow-up questions based on answers.
- IMPROVE: After addressing the suspected causes, compare before/after on the metric linked to the original theory. In PLAN, search KB for fixes to the confirmed factor. In ACT, verify whether the theory-specific metric improved.`;

    case 'routine':
      return `Entry scenario: Routine check — No specific problem or theory. Scanning for signals. Factor Intelligence questions are available for proactive scanning.
- SCOUT: Use compare_categories conservatively. Only suggest apply_filter if a notable signal is found (η² > 10%). Do NOT proactively suggest findings unless a clear anomaly is detected.
- INVESTIGATE: Only reached if the analyst manually creates a finding. Follow their lead.
- IMPROVE: Signal has been addressed — help evaluate whether sustaining controls prevent recurrence. In PLAN, suggest preventive actions and SOP updates. In ACT, recommend scheduling a follow-up check in 30 days.`;
  }
}
