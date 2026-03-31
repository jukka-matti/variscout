/**
 * Findings report prompt templates — AI-generated investigation reports.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 */

import type { AIContext } from '../types';
import type { Finding, Hypothesis } from '../../findings';
import type { Locale } from '../../i18n/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint } from './shared';

/**
 * Build the system prompt for AI findings report generation.
 */
export function buildReportSystemPrompt(locale?: Locale): string {
  const hint = buildLocaleHint(locale);
  return `${hint ? hint + '\n\n' : ''}You are a quality engineering report writer for VariScout.
Write a structured Markdown report summarizing the investigation findings.
Be precise and evidence-driven. Never invent data — only reference what is provided.
Use professional quality engineering language. Use evidence-calibrated language: 'clearly drives', 'suggests', 'may show a pattern' — never 'statistically significant' or 'not significant'.`;
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
  if (context.process?.issueStatement) {
    parts.push(`## Issue Statement\n${context.process.issueStatement}`);
  }

  // Stats
  if (context.stats) {
    const s = context.stats;
    let statsLine = `Mean=${formatStatistic(s.mean, 'en', 2)}, StdDev=${formatStatistic(s.stdDev, 'en', 3)}, n=${s.samples}`;
    if (s.cpk !== undefined) statsLine += `, Cpk=${formatStatistic(s.cpk, 'en', 2)}`;
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
    if (f.context.stats?.cpk !== undefined)
      line += `\n   Cpk: ${formatStatistic(f.context.stats.cpk, 'en', 2)}`;
    if (f.outcome) {
      line += `\n   Outcome: ${f.outcome.effective}`;
      if (f.outcome.cpkAfter)
        line += ` (Cpk after: ${formatStatistic(f.outcome.cpkAfter, 'en', 2)})`;
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
