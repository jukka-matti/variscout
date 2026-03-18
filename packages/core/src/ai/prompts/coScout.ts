/**
 * CoScout conversational AI prompt templates.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext, CoScoutMessage } from '../types';
import type { ToolDefinition } from '../responsesApi';
import type { Locale } from '../../i18n/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';
import { buildSummaryPrompt } from './narration';

/**
 * Build tool definitions for CoScout Responses API integration.
 * These enable the AI to read chart data and statistics via function calling.
 */
export function buildCoScoutTools(): ToolDefinition[] {
  return [
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
      },
    },
  ];
}

/** Options for building the CoScout system prompt */
export interface BuildCoScoutSystemPromptOptions {
  glossaryFragment?: string;
  investigation?: AIContext['investigation'];
  teamContributors?: AIContext['teamContributors'];
  sampleCount?: number;
  stagedComparison?: AIContext['stagedComparison'];
  locale?: Locale;
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
          'The investigation is gathering evidence. Tell the user: "You\'re gathering evidence — let\'s check what the data and contribution percentages tell us."',
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

  return parts.join('\n\n');
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
