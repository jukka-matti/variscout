/**
 * Narration prompt templates — summary narration for analysis state.
 *
 * Governance: docs/05-technical/architecture/aix-design-system.md
 * Structure optimized for Azure AI Foundry automatic prompt caching:
 * System prompts place static content (role + glossary) first as a cacheable prefix (≥1,024 tokens),
 * with variable context (stats, filters, findings) in subsequent messages.
 */

import type { AIContext } from '../types';
import type { Locale } from '../../i18n/types';
import { formatStatistic } from '../../i18n/format';
import { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';

/**
 * Build the system prompt for narration.
 * Includes glossary grounding as static prefix for prompt caching.
 */
export function buildNarrationSystemPrompt(glossaryFragment?: string, locale?: Locale): string {
  const parts: string[] = [];
  const hint = buildLocaleHint(locale);
  if (hint) parts.push(hint);
  parts.push(
    `You are a quality engineering assistant for VariScout, a structured investigation tool for process improvement.
You explain statistical analysis results in clear, actionable language for quality professionals.
Keep responses concise (1-2 sentences for summaries). Use the provided terminology definitions.
Never invent data — only describe what is provided in the context.`
  );

  if (glossaryFragment) {
    parts.push(glossaryFragment);
  }

  parts.push(TERMINOLOGY_INSTRUCTION);

  const prompt = parts.join('\n\n');

  if (import.meta.env.DEV) {
    const estTokens = Math.ceil(prompt.length / 4);
    if (estTokens < 1024) {
      console.warn(
        `[VariScout AI] Narration system prompt ~${estTokens} tokens. Prompt caching requires ≥1,024.`
      );
    }
  }

  return prompt;
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
  if (context.process?.product) {
    parts.push(`Product: ${context.process.product}`);
  }
  if (context.process?.measurement) {
    parts.push(`Measurement: ${context.process.measurement}`);
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
    let statsLine = `Mean=${formatStatistic(s.mean, 'en', 2)}, StdDev=${formatStatistic(s.stdDev, 'en', 3)}, n=${s.samples}`;
    if (s.cpk !== undefined) statsLine += `, Cpk=${formatStatistic(s.cpk, 'en', 2)}`;
    if (s.cp !== undefined) statsLine += `, Cp=${formatStatistic(s.cp, 'en', 2)}`;
    if (s.passRate !== undefined)
      statsLine += `, PassRate=${formatStatistic(s.passRate, 'en', 1)}%`;
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
      .map(vc => {
        let label = `${vc.factor}${vc.category ? ` (${vc.category})` : ''}: η²=${formatStatistic(vc.etaSquared * 100, 'en', 1)}%`;
        if (vc.factorType) {
          const parts: string[] = [vc.factorType];
          if (
            vc.relationship === 'quadratic' &&
            vc.optimum !== undefined &&
            Number.isFinite(vc.optimum)
          ) {
            parts.push(`sweet spot ${vc.optimum!.toFixed(2)}`);
          }
          label += ` [${parts.join(', ')}]`;
        }
        return label;
      })
      .join(', ');
    parts.push(`Variation contributions: ${vcStr}`);
  }

  // Drill path with scope
  if (context.drillPathEnriched && context.drillPathEnriched.length > 0) {
    const drillStr = context.drillPathEnriched
      .map(
        step =>
          `${step.factor}:${step.values.join(',')} (${Math.round(step.scopeFraction * 100)}% scope)`
      )
      .join(' → ');
    parts.push(
      `Drill path: ${drillStr}${context.cumulativeScope !== undefined ? ` (${Math.round(context.cumulativeScope * 100)}% total scope)` : ''}`
    );
  } else if (context.drillPath && context.drillPath.length > 0) {
    parts.push(`Drill path: ${context.drillPath.join(' → ')}`);
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
    if (context.teamContributors.questionAreas.length > 0) {
      teamLine += ` investigating ${context.teamContributors.questionAreas.join(', ')}`;
    }
    parts.push(teamLine);
  }

  // Issue statement
  if (context.process?.issueStatement) {
    parts.push(`Issue statement: ${context.process.issueStatement}`);
  }

  // Convergence synthesis
  if (context.process?.synthesis) {
    parts.push(`Synthesis (suspected cause): ${context.process.synthesis}`);
  }

  // Staged comparison (Before/After verification)
  if (context.stagedComparison) {
    const sc = context.stagedComparison;
    const d = sc.deltas;
    let stageLine = `Staged comparison (${sc.stageNames.join(' → ')}):`;
    stageLine += ` Mean shift ${d.meanShift > 0 ? '+' : ''}${formatStatistic(d.meanShift, 'en', 2)}`;
    stageLine += `, Variation ratio ${formatStatistic(d.variationRatio, 'en', 2)}`;
    if (d.cpkDelta !== null)
      stageLine += `, Cpk delta ${d.cpkDelta > 0 ? '+' : ''}${formatStatistic(d.cpkDelta, 'en', 2)}`;
    if (sc.cpkBefore !== undefined && sc.cpkAfter !== undefined) {
      stageLine += ` (${formatStatistic(sc.cpkBefore, 'en', 2)} → ${formatStatistic(sc.cpkAfter, 'en', 2)})`;
    }
    if (d.outOfSpecReduction !== 0) {
      stageLine += `, Out-of-spec reduction ${d.outOfSpecReduction > 0 ? '+' : ''}${formatStatistic(d.outOfSpecReduction, 'en', 1)}%`;
    }
    parts.push(stageLine);
  }

  // Confidence calibration — hedging instructions based on sample size
  if (context.stats) {
    const n = context.stats.samples;
    if (n < 10) {
      parts.push(
        `Data quality note: Only ${n} observations. Use cautious language: "With only ${n} observations, this is preliminary. Consider gemba observations or expert input alongside the data."`
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
