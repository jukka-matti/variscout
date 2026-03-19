/**
 * CoScout conversational AI prompt templates.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext, CoScoutMessage, JourneyPhase, EntryScenario } from '../types';
import type { ToolDefinition } from '../responsesApi';
import type { Locale } from '../../i18n/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';
import { buildSummaryPrompt } from './narration';

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
  userMessage: string
): {
  instructions: string;
  input: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
} {
  const instructions = buildCoScoutSystemPrompt({
    glossaryFragment: context.glossaryFragment,
    investigation: context.investigation,
    teamContributors: context.teamContributors,
    sampleCount: context.stats?.samples,
    stagedComparison: context.stagedComparison,
    locale: context.locale,
    entryScenario: context.entryScenario,
  });

  const input: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

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

  // Current user message
  input.push({ role: 'user', content: userMessage });

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

    if (investigation.allHypotheses && investigation.allHypotheses.length > 0) {
      const hypothesisList = investigation.allHypotheses
        .map(h => `- "${h.text}" (${h.status})`)
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
        improving:
          'The process is in the improvement phase (PDCA). Tell the user: "You\'re in the improvement cycle — let\'s check whether Cpk is improving and actions are effective."',
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
          phaseInstructions.improving = `The process is in the improvement phase (PDCA). You're addressing ${primaryText}${contribSuffix}. Let's check whether the corrective actions are working and Cpk is improving.`;
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
      if (sf.hypothesis) findingLine += ` (hypothesis: "${sf.hypothesis}")`;
      if (sf.projection) {
        findingLine += `. Projected impact: mean ${sf.projection.meanDelta > 0 ? '+' : ''}${formatStatistic(sf.projection.meanDelta, 'en', 2)}, sigma ${sf.projection.sigmaDelta > 0 ? '+' : ''}${formatStatistic(sf.projection.sigmaDelta, 'en', 2)}`;
      }
      if (sf.actions && sf.actions.length > 0) {
        const done = sf.actions.filter(a => a.status === 'done').length;
        findingLine += `\nActions (${done}/${sf.actions.length} complete):`;
        const capped = sf.actions.slice(0, 5);
        for (const a of capped) {
          findingLine += `\n  - [${a.status}] ${a.text}`;
        }
        if (sf.actions.length > 5) {
          findingLine += `\n  ... and ${sf.actions.length - 5} more`;
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
  userMessage: string
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
- INVESTIGATE: Guide the analyst to create hypotheses linked to the top-contributing factors.`;

    case 'hypothesis':
      return `Entry scenario: Hypothesis to check — The analyst entered with an upfront hypothesis.
- SCOUT: Immediately use compare_categories on the factor named in the hypothesis. Report Contribution % and per-category stats. If supported (>=15%), suggest apply_filter and create_finding.
- INVESTIGATE: Propose create_hypothesis with the upfront hypothesis as the root node. Then suggest sub-hypotheses.`;

    case 'routine':
      return `Entry scenario: Routine check — No specific problem or hypothesis. Scanning for signals.
- SCOUT: Use compare_categories conservatively. Only suggest apply_filter if a notable signal is found (Contribution % > 10%). Do NOT proactively suggest findings unless a clear anomaly is detected.
- INVESTIGATE: Only reached if the analyst manually creates a finding. Follow their lead.`;
  }
}
