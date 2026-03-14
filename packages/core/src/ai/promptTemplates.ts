/**
 * Prompt templates for AI narration.
 */

import type { AIContext, FactorRole } from './types';
import type { InsightChartType } from './chartInsights';

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

/** Chart-specific data for AI insight enhancement */
export interface ChartInsightData {
  chartType: InsightChartType;
  /** The computed deterministic insight text */
  deterministicInsight: string;
  /** I-Chart specifics */
  ichart?: {
    nelsonSequenceCount: number;
    outOfControlCount: number;
    totalPoints: number;
  };
  /** Boxplot specifics */
  boxplot?: {
    currentFactor: string;
    factorRole?: FactorRole;
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
    parts.push(
      `I-Chart: ${d.totalPoints} points, ${d.outOfControlCount} out-of-control, ${d.nelsonSequenceCount} Nelson sequences`
    );
  }
  if (data.boxplot) {
    const d = data.boxplot;
    let line = `Boxplot factor: ${d.currentFactor}`;
    if (d.factorRole) line += ` (${d.factorRole})`;
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
