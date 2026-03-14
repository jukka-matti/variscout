/**
 * Prompt templates for AI narration.
 */

import type { AIContext } from './types';

/**
 * Build the system prompt for narration.
 */
export function buildNarrationSystemPrompt(): string {
  return `You are a quality engineering assistant for VariScout, a variation analysis tool.
You explain statistical analysis results in clear, actionable language for quality professionals.
Keep responses concise (1-2 sentences for summaries). Use the provided terminology definitions.
Never invent data — only describe what is provided in the context.`;
}

/**
 * Build the user prompt for a summary narration.
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
      .map(f => `${f.factor}=${f.values.join(',')}${f.role ? ` (${f.role})` : ''}`)
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

  // Glossary
  if (context.glossaryFragment) {
    parts.push(context.glossaryFragment);
  }

  parts.push('Summarize this analysis state in 1-2 sentences for a quality professional.');

  return parts.join('\n\n');
}
