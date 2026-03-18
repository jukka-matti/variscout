/**
 * Chart insight prompt templates — AI-enhanced chart annotations.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 */

import type { AIContext } from '../types';
import type { InsightChartType } from '../chartInsights';
import type { Locale } from '../../i18n/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';

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
export function buildChartInsightSystemPrompt(locale?: Locale): string {
  const hint = buildLocaleHint(locale);
  return `${hint ? hint + '\n\n' : ''}You are a quality engineering assistant for VariScout.
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
        .map(c => `${c.name} ${formatStatistic(c.variationPct, 'en', 0)}%`)
        .join(', ')}`;
    }
    if (d.nextDrillFactor) line += `. Suggested drill: ${d.nextDrillFactor}`;
    parts.push(line);
  }
  if (data.pareto) {
    const d = data.pareto;
    parts.push(
      `Pareto: top 2 = ${formatStatistic(d.cumulativeTop2Pct, 'en', 0)}%. Categories: ${d.topCategories
        .slice(0, 3)
        .map(c => `${c.name} ${formatStatistic(c.variationPct, 'en', 0)}%`)
        .join(', ')}`
    );
  }
  if (data.stats) {
    const d = data.stats;
    let line = `Stats: target Cpk=${d.cpkTarget}`;
    if (d.cpk !== undefined) line += `, actual Cpk=${formatStatistic(d.cpk, 'en', 2)}`;
    if (d.passRate !== undefined) line += `, pass rate=${formatStatistic(d.passRate, 'en', 1)}%`;
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
