/**
 * Prompt templates for AI narration.
 *
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext, CoScoutMessage } from './types';
import type { InsightChartType } from './chartInsights';

/**
 * Build the system prompt for narration.
 * Includes glossary grounding as static prefix for prompt caching.
 */
export function buildNarrationSystemPrompt(glossaryFragment?: string): string {
  const parts = [
    `You are a quality engineering assistant for VariScout, a variation analysis tool.
You explain statistical analysis results in clear, actionable language for quality professionals.
Keep responses concise (1-2 sentences for summaries). Use the provided terminology definitions.
Never invent data — only describe what is provided in the context.`,
  ];

  if (glossaryFragment) {
    parts.push(glossaryFragment);
  }

  return parts.join('\n\n');
}

/**
 * Build the user prompt for a summary narration.
 * Contains only variable context (stats, filters, findings).
 * Glossary is placed in the system prompt for prompt caching.
 */
export function buildSummaryPrompt(context: AIContext): string {
  const parts: string[] = [];

  // Process context
  if (context.process?.description) {
    parts.push(`Process: ${context.process.description}`);
  }

  // Stats
  if (context.stats) {
    const s = context.stats;
    let statsLine = `Mean=${s.mean.toFixed(2)}, StdDev=${s.stdDev.toFixed(3)}, n=${s.samples}`;
    if (s.cpk !== undefined) statsLine += `, Cpk=${s.cpk.toFixed(2)}`;
    if (s.cp !== undefined) statsLine += `, Cp=${s.cp.toFixed(2)}`;
    if (s.passRate !== undefined) statsLine += `, PassRate=${s.passRate.toFixed(1)}%`;
    parts.push(`Statistics: ${statsLine}`);
  }

  // Filters
  if (context.filters.length > 0) {
    const filterStr = context.filters
      .map(f => `${f.factor}=${f.values.join(',')}${f.category ? ` (${f.category})` : ''}`)
      .join('; ');
    parts.push(`Active filters: ${filterStr}`);
  }

  // Violations
  if (context.violations) {
    const v = context.violations;
    const violationParts: string[] = [];
    if (v.outOfControl > 0) violationParts.push(`${v.outOfControl} out-of-control`);
    if (v.aboveUSL > 0) violationParts.push(`${v.aboveUSL} above USL`);
    if (v.belowLSL > 0) violationParts.push(`${v.belowLSL} below LSL`);
    if (v.nelsonRule2Count && v.nelsonRule2Count > 0)
      violationParts.push(`${v.nelsonRule2Count} Nelson Rule 2 (process shift)`);
    if (v.nelsonRule3Count && v.nelsonRule3Count > 0)
      violationParts.push(`${v.nelsonRule3Count} Nelson Rule 3 (trend/drift)`);
    if (violationParts.length > 0) {
      parts.push(`Violations: ${violationParts.join(', ')}`);
    }
  }

  // Findings
  if (context.findings) {
    parts.push(`Findings: ${context.findings.total} total`);
    if (context.findings.keyDrivers.length > 0) {
      parts.push(`Key drivers: ${context.findings.keyDrivers.join(', ')}`);
    }
  }

  // Problem statement
  if (context.process?.problemStatement) {
    parts.push(`Problem statement: ${context.process.problemStatement}`);
  }

  parts.push('Summarize this analysis state in 1-2 sentences for a quality professional.');

  return parts.join('\n\n');
}

/** Chart-specific data for AI insight enhancement */
export interface ChartInsightData {
  chartType: InsightChartType;
  /** The computed deterministic insight text */
  deterministicInsight: string;
  /** I-Chart specifics */
  ichart?: {
    nelsonRule2Count: number;
    nelsonRule3Count: number;
    outOfControlCount: number;
    totalPoints: number;
  };
  /** Boxplot specifics */
  boxplot?: {
    currentFactor: string;
    /** Dynamic category name (from InvestigationCategory) */
    category?: string;
    topCategories: Array<{ name: string; variationPct: number }>;
    nextDrillFactor?: string;
  };
  /** Pareto specifics */
  pareto?: {
    topCategories: Array<{ name: string; variationPct: number }>;
    cumulativeTop2Pct: number;
  };
  /** Stats specifics */
  stats?: {
    cpk?: number;
    cpkTarget: number;
    passRate?: number;
  };
}

/**
 * Build the system prompt for chart insight enhancement.
 */
export function buildChartInsightSystemPrompt(): string {
  return `You are a quality engineering assistant for VariScout.
Enhance the provided deterministic insight with process context.
Respond in exactly one sentence, under 120 characters.
Be specific and actionable. Never invent data.`;
}

/**
 * Build the user prompt for a chart-specific AI insight.
 */
export function buildChartInsightPrompt(context: AIContext, data: ChartInsightData): string {
  const parts: string[] = [];

  // Process context
  if (context.process?.description) {
    parts.push(`Process: ${context.process.description}`);
  }

  // Deterministic insight to enhance
  parts.push(`Current insight: "${data.deterministicInsight}"`);
  parts.push(`Chart: ${data.chartType}`);

  // Chart-specific data
  if (data.ichart) {
    const d = data.ichart;
    const ichartParts = [`${d.totalPoints} points`];
    if (d.outOfControlCount > 0) ichartParts.push(`${d.outOfControlCount} out-of-control`);
    if (d.nelsonRule2Count > 0) ichartParts.push(`${d.nelsonRule2Count} Rule 2 (shift)`);
    if (d.nelsonRule3Count > 0) ichartParts.push(`${d.nelsonRule3Count} Rule 3 (trend)`);
    parts.push(`I-Chart: ${ichartParts.join(', ')}`);
  }
  if (data.boxplot) {
    const d = data.boxplot;
    let line = `Boxplot factor: ${d.currentFactor}`;
    if (d.category) line += ` (${d.category})`;
    if (d.topCategories.length > 0) {
      line += `. Top: ${d.topCategories
        .slice(0, 3)
        .map(c => `${c.name} ${c.variationPct.toFixed(0)}%`)
        .join(', ')}`;
    }
    if (d.nextDrillFactor) line += `. Suggested drill: ${d.nextDrillFactor}`;
    parts.push(line);
  }
  if (data.pareto) {
    const d = data.pareto;
    parts.push(
      `Pareto: top 2 = ${d.cumulativeTop2Pct.toFixed(0)}%. Categories: ${d.topCategories
        .slice(0, 3)
        .map(c => `${c.name} ${c.variationPct.toFixed(0)}%`)
        .join(', ')}`
    );
  }
  if (data.stats) {
    const d = data.stats;
    let line = `Stats: target Cpk=${d.cpkTarget}`;
    if (d.cpk !== undefined) line += `, actual Cpk=${d.cpk.toFixed(2)}`;
    if (d.passRate !== undefined) line += `, pass rate=${d.passRate.toFixed(1)}%`;
    parts.push(line);
  }

  // Active filters
  if (context.filters.length > 0) {
    parts.push(
      `Filters: ${context.filters.map(f => `${f.factor}=${f.values.join(',')}`).join('; ')}`
    );
  }

  parts.push('Enhance this insight in one sentence under 120 characters.');

  return parts.join('\n\n');
}

/**
 * Build the system prompt for conversational CoScout assistant.
 * Includes glossary grounding as static prefix for prompt caching.
 * When investigation context is provided, adds problem statement and hypothesis awareness.
 */
export function buildCoScoutSystemPrompt(
  glossaryFragment?: string,
  investigation?: AIContext['investigation']
): string {
  const parts = [
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
Never invent data or statistics. If the context does not contain enough information to answer, say so.`,
  ];

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
      // Check if there are supported hypotheses for IDEOI-specific instructions
      const hasSupportedHypotheses =
        investigation.allHypotheses?.some(h => h.status === 'supported') ?? false;

      const phaseInstructions: Record<string, string> = {
        initial:
          'The investigation is in the Initial Phase — help identify which chart to examine first and what patterns to look for.',
        diverging:
          'The investigation is in the Diverging Phase — encourage exploring hypotheses across different factor categories. Cast a wide net.',
        validating:
          'The investigation is in the Validating Phase — help interpret η² (contribution, not causation) and prioritize untested hypotheses.',
        converging: hasSupportedHypotheses
          ? 'The investigation is in the Converging Phase — supported causes found. Help brainstorm improvement ideas. Compare effort vs impact. Suggest alternatives or evaluate existing ideas.'
          : 'The investigation is in the Converging Phase — help synthesize findings into a coherent root cause story.',
        acting:
          'The investigation is in the Acting Phase — check the Capability chart. Is Cpk improving? Help monitor effectiveness.',
      };
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

    if (invParts.length > 0) {
      parts.push('Investigation context:\n' + invParts.join('\n'));
    }
  }

  return parts.join('\n\n');
}

/** Maximum number of history messages to include in CoScout API calls */
const COSCOUT_HISTORY_LIMIT = 10;

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
    content: buildCoScoutSystemPrompt(context.glossaryFragment, context.investigation),
  });

  // Context summary — variable per analysis state
  const contextSummary = buildSummaryPrompt(context).replace(
    /Summarize this analysis state.*$/,
    "This is the current analysis context. Use it to answer the user's question."
  );
  messages.push({ role: 'system', content: contextSummary });

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
