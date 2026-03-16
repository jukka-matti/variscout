/**
 * Prompt templates for AI narration.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Read the AIX Design System before modifying any prompt template.
 *
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext, CoScoutMessage } from './types';
import type { InsightChartType } from './chartInsights';
import type { Finding, Hypothesis } from '../findings';

/**
 * Terminology enforcement instruction appended to all AI system prompts.
 * Ensures consistent domain language across narration, CoScout, and chart insights.
 * See docs/05-technical/architecture/aix-design-system.md §1.2
 */
export const TERMINOLOGY_INSTRUCTION = `Terminology rules — always use VariScout terms:
- Say "Contribution %" not "eta squared" or "effect size".
- Say "Progressive stratification" not "drill-down".
- Say "Voice of the Process" not "control limits" and "Voice of the Customer" not "spec limits" or "specification limits".
- Say "characteristic" not "measurement" or "variable".`;

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

  parts.push(TERMINOLOGY_INSTRUCTION);

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

  // Factor roles
  if (context.process?.factorRoles) {
    const entries = Object.entries(context.process.factorRoles);
    if (entries.length > 0) {
      parts.push(`Factor roles: ${entries.map(([f, r]) => `${f} (${r})`).join(', ')}`);
    }
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

  // Variation contributions
  if (context.variationContributions && context.variationContributions.length > 0) {
    const vcStr = context.variationContributions
      .map(
        vc =>
          `${vc.factor}${vc.category ? ` (${vc.category})` : ''}: η²=${(vc.etaSquared * 100).toFixed(1)}%`
      )
      .join(', ');
    parts.push(`Variation contributions: ${vcStr}`);
  }

  // Findings
  if (context.findings) {
    parts.push(`Findings: ${context.findings.total} total`);
    if (context.findings.keyDrivers.length > 0) {
      parts.push(`Key drivers: ${context.findings.keyDrivers.join(', ')}`);
    }
  }

  // Team contributors
  if (context.teamContributors && context.teamContributors.count > 0) {
    let teamLine = `Team: ${context.teamContributors.count} contributors`;
    if (context.teamContributors.hypothesisAreas.length > 0) {
      teamLine += ` investigating ${context.teamContributors.hypothesisAreas.join(', ')}`;
    }
    parts.push(teamLine);
  }

  // Problem statement
  if (context.process?.problemStatement) {
    parts.push(`Problem statement: ${context.process.problemStatement}`);
  }

  // Staged comparison (Before/After verification)
  if (context.stagedComparison) {
    const sc = context.stagedComparison;
    const d = sc.deltas;
    let stageLine = `Staged comparison (${sc.stageNames.join(' → ')}):`;
    stageLine += ` Mean shift ${d.meanShift > 0 ? '+' : ''}${d.meanShift.toFixed(2)}`;
    stageLine += `, Variation ratio ${d.variationRatio.toFixed(2)}`;
    if (d.cpkDelta !== null)
      stageLine += `, Cpk delta ${d.cpkDelta > 0 ? '+' : ''}${d.cpkDelta.toFixed(2)}`;
    if (sc.cpkBefore !== undefined && sc.cpkAfter !== undefined) {
      stageLine += ` (${sc.cpkBefore.toFixed(2)} → ${sc.cpkAfter.toFixed(2)})`;
    }
    if (d.outOfSpecReduction !== 0) {
      stageLine += `, Out-of-spec reduction ${d.outOfSpecReduction > 0 ? '+' : ''}${d.outOfSpecReduction.toFixed(1)}%`;
    }
    parts.push(stageLine);
  }

  // Confidence calibration — hedging instructions based on sample size
  if (context.stats) {
    const n = context.stats.samples;
    if (n < 10) {
      parts.push(
        `Data quality note: Only ${n} observations. Use cautious language: "With only ${n} observations, this is not yet reliable. Consider collecting more data."`
      );
    } else if (n < 30) {
      parts.push(
        'Data quality note: Limited sample size. Use hedged language: "Based on limited data...", "Preliminary analysis indicates..."'
      );
    } else if (n < 100) {
      parts.push('Use standard language: "The analysis suggests...", "Current data indicates..."');
    }
  }

  if (context.stagedComparison) {
    parts.push(
      'This is a verification analysis with Before/After stages. Lead with whether the improvement worked — quantify the change. Then note any remaining concerns.'
    );
  } else {
    parts.push('Summarize this analysis state in 1-2 sentences for a quality professional.');
  }

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
Be specific and actionable. Never invent data.

${TERMINOLOGY_INSTRUCTION}`;
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
  investigation?: AIContext['investigation'],
  teamContributors?: AIContext['teamContributors'],
  sampleCount?: number,
  stagedComparison?: AIContext['stagedComparison']
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

      // Override acting phase with verification-specific instructions when staged data available
      if (investigation.phase === 'acting' && stagedComparison) {
        const sd = stagedComparison.deltas;
        let verificationContext =
          'Verification data available — the analyst has collected After data.';
        verificationContext += ` Staged comparison: mean shift ${sd.meanShift.toFixed(2)}`;
        verificationContext += `, variation ratio ${sd.variationRatio.toFixed(2)}`;
        if (sd.cpkDelta !== null)
          verificationContext += `, Cpk delta ${sd.cpkDelta > 0 ? '+' : ''}${sd.cpkDelta.toFixed(2)}`;
        verificationContext += '.';
        phaseInstructions.acting = `The investigation is in the Acting Phase with verification data. ${verificationContext} Help assess: Is the improvement real and sustained? Are there new patterns or risks in the After stage? What sustaining controls are needed?`;
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
        findingLine += `. Projected impact: mean ${sf.projection.meanDelta > 0 ? '+' : ''}${sf.projection.meanDelta.toFixed(2)}, sigma ${sf.projection.sigmaDelta > 0 ? '+' : ''}${sf.projection.sigmaDelta.toFixed(2)}`;
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
 * Shows past findings from other projects as reference context.
 * Optionally includes document results with source attribution.
 */
export function formatKnowledgeContext(
  results: NonNullable<AIContext['knowledgeResults']>,
  documents?: AIContext['knowledgeDocuments']
): string {
  const sections: string[] = [];

  if (results.length > 0) {
    const lines = results.map((r, i) => {
      const parts = [
        `${i + 1}. [From: findings] "${r.suspectedCause || 'Unknown cause'}" — ${r.projectName}`,
      ];
      parts.push(`   Factor: ${r.factor}, Status: ${r.status}`);
      if (r.etaSquared !== null) parts.push(`   η²: ${(r.etaSquared * 100).toFixed(1)}%`);
      if (r.cpkBefore !== null && r.cpkAfter !== null)
        parts.push(`   Cpk: ${r.cpkBefore.toFixed(2)} → ${r.cpkAfter.toFixed(2)}`);
      if (r.actionsText) parts.push(`   Actions: ${r.actionsText}`);
      if (r.outcomeEffective !== null)
        parts.push(`   Outcome: ${r.outcomeEffective ? 'effective' : 'not effective'}`);
      return parts.join('\n');
    });
    sections.push(lines.join('\n\n'));
  }

  if (documents && documents.length > 0) {
    const docLines = documents.map((d, i) => {
      const parts = [`${i + 1}. [From: ${d.source}] "${d.title}"`];
      if (d.snippet) parts.push(`   ${d.snippet.slice(0, 300)}`);
      return parts.join('\n');
    });
    sections.push(docLines.join('\n\n'));
  }

  if (sections.length === 0) return '';

  return `Past findings from the Knowledge Base (similar situations from other projects — reference only, do not present as current data):\n${sections.join('\n\n')}`;
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
    content: buildCoScoutSystemPrompt(
      context.glossaryFragment,
      context.investigation,
      context.teamContributors,
      context.stats?.samples,
      context.stagedComparison
    ),
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

// ============================================================================
// Findings Report Prompts
// ============================================================================

/**
 * Build the system prompt for AI findings report generation.
 */
export function buildReportSystemPrompt(): string {
  return `You are a quality engineering report writer for VariScout.
Write a structured Markdown report summarizing the investigation findings.
Be precise and data-driven. Never invent data — only reference what is provided.
Use professional quality engineering language.`;
}

/**
 * Build the user prompt for generating an AI findings report.
 * Caps at 20 most significant findings (key-drivers + resolved first).
 */
export function buildReportPrompt(
  context: AIContext,
  findings: Finding[],
  hypotheses: Hypothesis[]
): string {
  const parts: string[] = [];

  // Process context
  if (context.process?.description) {
    parts.push(`## Process\n${context.process.description}`);
  }
  if (context.process?.problemStatement) {
    parts.push(`## Problem Statement\n${context.process.problemStatement}`);
  }

  // Stats
  if (context.stats) {
    const s = context.stats;
    let statsLine = `Mean=${s.mean.toFixed(2)}, StdDev=${s.stdDev.toFixed(3)}, n=${s.samples}`;
    if (s.cpk !== undefined) statsLine += `, Cpk=${s.cpk.toFixed(2)}`;
    parts.push(`## Current Statistics\n${statsLine}`);
  }

  // Prioritize findings: key-drivers first, then resolved, then by date
  const sorted = [...findings].sort((a, b) => {
    if (a.tag === 'key-driver' && b.tag !== 'key-driver') return -1;
    if (b.tag === 'key-driver' && a.tag !== 'key-driver') return 1;
    if (a.status === 'resolved' && b.status !== 'resolved') return -1;
    if (b.status === 'resolved' && a.status !== 'resolved') return 1;
    return b.createdAt - a.createdAt;
  });

  const top = sorted.slice(0, 20);
  const hypothesisMap = new Map(hypotheses.map(h => [h.id, h]));

  const findingLines = top.map((f, i) => {
    const h = f.hypothesisId ? hypothesisMap.get(f.hypothesisId) : undefined;
    let line = `${i + 1}. [${f.status.toUpperCase()}${f.tag ? ` · ${f.tag}` : ''}] ${f.text}`;
    if (h) line += `\n   Hypothesis: "${h.text}" (${h.status})`;
    if (f.context.stats?.cpk !== undefined) line += `\n   Cpk: ${f.context.stats.cpk.toFixed(2)}`;
    if (f.outcome) {
      line += `\n   Outcome: ${f.outcome.effective}`;
      if (f.outcome.cpkAfter) line += ` (Cpk after: ${f.outcome.cpkAfter.toFixed(2)})`;
    }
    if (f.actions?.length) {
      const done = f.actions.filter(a => a.completedAt).length;
      line += `\n   Actions: ${done}/${f.actions.length} complete`;
    }
    return line;
  });

  parts.push(`## Findings (${top.length} of ${findings.length})\n${findingLines.join('\n\n')}`);

  parts.push(`Generate a quality engineering report with these sections:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Root Causes (from hypotheses)
4. Actions Taken (from action items)
5. Outcomes (effectiveness)
6. Recommendations (next steps)`);

  return parts.join('\n\n');
}
