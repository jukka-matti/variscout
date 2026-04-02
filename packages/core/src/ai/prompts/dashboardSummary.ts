/**
 * Dashboard summary prompt builder — project status AI summary card.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Fast tier (gpt-5.4-nano, reasoning: none). No system prompt needed.
 */

import type { AIContext } from '../types';

/**
 * Build the user prompt for the dashboard AI summary card.
 * Uses existing AIContext — no new context collection needed.
 * Fast tier (gpt-5.4-nano, reasoning: none).
 *
 * @param context - The current AI context assembled from analysis state
 * @returns A prompt string for generating a 1-3 sentence project status summary
 */
export function buildDashboardSummaryPrompt(context: AIContext): string {
  const parts: string[] = [];

  parts.push('Generate a 1-3 sentence project status summary for a returning analyst.');
  parts.push('Be concise and actionable. Highlight what matters most right now.');
  parts.push('');

  // Stats
  if (context.stats) {
    const { samples, cpk, mean } = context.stats;
    const cpkStr = cpk != null ? `, Cpk=${cpk.toFixed(2)}` : '';
    parts.push(`Current analysis: ${samples} samples, mean=${mean.toFixed(2)}${cpkStr}`);
  }

  // Findings
  if (context.findings && context.findings.total > 0) {
    const { total, byStatus, keyDrivers } = context.findings;
    const statusParts: string[] = [];
    if (byStatus) {
      for (const [status, count] of Object.entries(byStatus)) {
        if (count > 0) statusParts.push(`${count} ${status}`);
      }
    }
    parts.push(
      `Findings: ${total} total (${statusParts.join(', ')}). ${keyDrivers?.length ?? 0} key drivers identified.`
    );
  }

  // Questions
  if (context.investigation?.allQuestions && context.investigation.allQuestions.length > 0) {
    const qs = context.investigation.allQuestions;
    const answered = qs.filter(q => q.status === 'answered');
    const open = qs.filter(q => q.status === 'open');
    const ruledOut = qs.filter(q => q.status === 'ruled-out');

    let qSummary = `Questions: ${qs.length} total`;
    if (answered.length > 0)
      qSummary += `, ${answered.length} answered (${answered.map(q => q.text).join(', ')})`;
    if (open.length > 0) qSummary += `, ${open.length} open`;
    if (ruledOut.length > 0) qSummary += `, ${ruledOut.length} ruled out`;
    parts.push(qSummary);
  }

  // Investigation phase
  if (context.investigation?.phase) {
    parts.push(`Investigation phase: ${context.investigation.phase}`);
  }

  // Focus instruction
  if (context.findings && context.findings.total > 0) {
    parts.push(
      'Focus: Highlight overdue actions, stalled investigations, or suggested next steps.'
    );
  } else {
    parts.push('Focus: Suggest what the analyst should examine next based on the data.');
  }

  return parts.join('\n');
}
