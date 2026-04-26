/**
 * reportExport — Render report sections to a publishable document.
 *
 * Converts ReportSectionDescriptor[] into a structured Markdown document
 * suitable for uploading to SharePoint. Markdown is used as the intermediate
 * format because:
 *   - It's human-readable as-is
 *   - Copilot Retrieval API can search it effectively
 *   - It can be rendered to .docx via pandoc or a future client-side library
 *   - It preserves structure (headings, lists, tables) for AI retrieval
 *
 * ADR-026: Reports are published alongside .vrs files in the channel's
 * SharePoint folder, forming the team's knowledge base.
 */

import type { Finding, Question, ProcessContext, StatsResult, Locale } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import type { ReportSectionDescriptor, ReportType, ReportWorkspace } from '@variscout/hooks';

// ── Types ───────────────────────────────────────────────────────────────

export interface ReportMetadata {
  projectName: string;
  processName?: string;
  analyst?: string;
  date: string;
  reportType: ReportType;
  cpk?: number;
  mean?: number;
  sampleCount?: number;
}

export interface RenderReportOptions {
  metadata: ReportMetadata;
  sections: ReportSectionDescriptor[];
  processContext?: ProcessContext;
  stats?: StatsResult;
  aiNarrative?: string;
  locale?: Locale;
}

// ── Workspace labels ────────────────────────────────────────────────────

const WORKSPACE_HEADING: Record<ReportWorkspace, string> = {
  analysis: 'Analysis',
  findings: 'Findings',
  improvement: 'Improvement',
};

// ── Rendering ───────────────────────────────────────────────────────────

/**
 * Render a complete report as Markdown.
 *
 * The document is structured for both human readability and AI retrieval:
 * - YAML-style metadata block at the top
 * - Workspace group headings (## Analysis, ## Findings, ## Improvement)
 * - Section headings matching step numbers
 * - Findings formatted with status tags, questions, and outcomes
 */
export function renderReportMarkdown(options: RenderReportOptions): string {
  const { metadata, sections, processContext, stats, aiNarrative, locale = 'en' } = options;
  const fmt = (n: number, d: number = 2) => formatStatistic(n, locale, d);
  const parts: string[] = [];

  // ── Title & metadata ────────────────────────────────────────────────
  parts.push(`# VariScout ${formatReportType(metadata.reportType)}: ${metadata.projectName}`);
  parts.push('');
  parts.push(`**Date:** ${metadata.date}`);
  if (metadata.analyst) parts.push(`**Analyst:** ${metadata.analyst}`);
  if (metadata.processName) parts.push(`**Process:** ${metadata.processName}`);
  parts.push(`**Report Type:** ${formatReportType(metadata.reportType)}`);
  parts.push('');

  // ── Key metrics ─────────────────────────────────────────────────────
  if (stats || metadata.cpk !== undefined) {
    parts.push('## Key Metrics');
    parts.push('');
    const metrics: string[] = [];
    if (metadata.cpk !== undefined) metrics.push(`- **Cpk:** ${fmt(metadata.cpk)}`);
    if (metadata.mean !== undefined) metrics.push(`- **Mean:** ${fmt(metadata.mean, 3)}`);
    if (stats?.stdDev !== undefined) metrics.push(`- **StdDev:** ${fmt(stats.stdDev, 4)}`);
    if (metadata.sampleCount !== undefined)
      metrics.push(`- **Sample Size:** ${metadata.sampleCount}`);
    if (stats?.outOfSpecPercentage !== undefined) {
      metrics.push(`- **Out of Spec:** ${fmt(stats.outOfSpecPercentage, 1)}%`);
    }
    parts.push(metrics.join('\n'));
    parts.push('');
  }

  // ── Process context ─────────────────────────────────────────────────
  if (processContext?.description) {
    parts.push('## Process Description');
    parts.push('');
    parts.push(processContext.description);
    parts.push('');
  }

  if (processContext?.issueStatement) {
    parts.push('## Issue / Concern');
    parts.push('');
    parts.push(processContext.issueStatement);
    parts.push('');
  }

  if (processContext?.currentUnderstanding?.summary) {
    parts.push('## Current Understanding');
    parts.push('');
    parts.push(processContext.currentUnderstanding.summary);
    parts.push('');
  }

  if (processContext?.problemStatement) {
    parts.push('## Approved Problem Statement');
    parts.push('');
    parts.push(processContext.problemStatement);
    parts.push('');
  }

  // ── Sections grouped by workspace ─────────────────────────────────
  let currentWorkspace: ReportWorkspace | null = null;

  for (const section of sections) {
    // Workspace group heading
    if (section.workspace !== currentWorkspace) {
      currentWorkspace = section.workspace;
      parts.push(`## ${WORKSPACE_HEADING[currentWorkspace]}`);
      parts.push('');
    }

    parts.push(`### Step ${section.stepNumber}: ${section.title}`);
    parts.push('');

    // Render synthesis for evidence-trail section
    if (section.id === 'evidence-trail' && processContext?.synthesis) {
      parts.push(`> ${processContext.synthesis}`);
      parts.push('');
    }

    // Render questions for evidence-trail and improvement-plan sections
    if (
      (section.id === 'evidence-trail' || section.id === 'improvement-plan') &&
      section.questions.length > 0
    ) {
      parts.push('**Questions:**');
      parts.push('');
      for (const h of section.questions) {
        const roleTag = h.causeRole ? ` [${h.causeRole}]` : '';
        parts.push(`- **${h.text}** (${h.status})${roleTag}`);

        // Render ideas for improvement-plan section
        if (section.id === 'improvement-plan' && h.ideas && h.ideas.length > 0) {
          for (const idea of h.ideas) {
            const selected = idea.selected ? '✅' : '⬜';
            const direction = idea.direction ? ` [${idea.direction}]` : '';
            const timeframe = idea.timeframe ?? '';
            const projCpk =
              idea.projection?.projectedCpk != null
                ? ` — Cpk ${fmt(idea.projection.projectedCpk)}`
                : '';
            parts.push(`  - ${selected} ${idea.text}${direction} (${timeframe})${projCpk}`);
          }
        }
      }
      parts.push('');

      // Skip orphan question rendering for improvement-plan (already covered above)
      if (section.id === 'improvement-plan') continue;
    }

    // Render findings
    for (const finding of section.findings) {
      parts.push(renderFinding(finding, section.questions, locale));
    }

    // Render standalone questions (not already covered by findings)
    const orphanQuestions = section.questions.filter(
      h => !section.findings.some(f => f.questionId === h.id)
    );
    if (orphanQuestions.length > 0 && section.id !== 'improvement-plan') {
      parts.push('**Questions:**');
      parts.push('');
      for (const h of orphanQuestions) {
        parts.push(`- **${h.text}** (${h.status})`);
      }
      parts.push('');
    }
  }

  // ── AI narrative ────────────────────────────────────────────────────
  if (aiNarrative) {
    parts.push('## AI-Generated Summary');
    parts.push('');
    parts.push(aiNarrative);
    parts.push('');
  }

  // ── Footer ──────────────────────────────────────────────────────────
  parts.push('---');
  parts.push(`*Generated by VariScout on ${metadata.date}*`);

  return parts.join('\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────

function renderFinding(finding: Finding, questions: Question[], locale: Locale = 'en'): string {
  const fmt = (n: number, d: number = 2) => formatStatistic(n, locale, d);
  const lines: string[] = [];
  const statusTag = `[${finding.status.toUpperCase()}]`;
  const tagSuffix = finding.tag ? ` · ${finding.tag}` : '';

  lines.push(`#### ${statusTag}${tagSuffix} ${finding.text}`);
  lines.push('');

  // Linked question
  if (finding.questionId) {
    const question = questions.find(h => h.id === finding.questionId);
    if (question) {
      lines.push(`**Question:** "${question.text}" (${question.status})`);
      lines.push('');
    }
  }

  // Stats snapshot
  if (finding.context.stats?.cpk !== undefined) {
    lines.push(`**Cpk at time of finding:** ${fmt(finding.context.stats.cpk)}`);
    lines.push('');
  }

  // Actions
  if (finding.actions && finding.actions.length > 0) {
    lines.push('**Actions:**');
    lines.push('');
    for (const action of finding.actions) {
      const status = action.completedAt ? '✅' : '⬜';
      let actionLine = `- ${status} ${action.text}`;
      if (action.assignee) actionLine += ` (${action.assignee.displayName})`;
      if (action.dueDate) actionLine += ` — due: ${action.dueDate}`;
      lines.push(actionLine);
    }
    lines.push('');
  }

  // Outcome
  if (finding.outcome) {
    const effective =
      finding.outcome.effective === 'yes'
        ? '✅ Effective'
        : finding.outcome.effective === 'partial'
          ? '🟡 Partially effective'
          : '❌ Not effective';

    let outcomeLine = `**Outcome:** ${effective}`;
    if (finding.outcome.cpkAfter) {
      outcomeLine += ` — Cpk improved to ${fmt(finding.outcome.cpkAfter)}`;
    }
    lines.push(outcomeLine);
    if (finding.outcome.notes) {
      lines.push(`> ${finding.outcome.notes}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatReportType(type: ReportType): string {
  switch (type) {
    case 'analysis-snapshot':
      return 'Analysis Snapshot';
    case 'investigation-report':
      return 'Investigation Report';
    case 'improvement-story':
      return 'Improvement Story';
    default:
      return type;
  }
}

/**
 * Generate a filename for the report.
 * Format: "VariScout Report — {projectName} — {date}.md"
 */
export function generateReportFilename(
  projectName: string,
  date: string,
  extension: 'md' = 'md'
): string {
  const RESERVED = /^(CON|PRN|AUX|NUL|COM\d|LPT\d)$/i;
  const safeName = projectName.replace(/[<>:"/\\|?*]/g, '_').trim();
  const finalName = RESERVED.test(safeName) ? `_${safeName}` : safeName;
  const safeDate = date.replace(/[:/]/g, '-').substring(0, 10);
  return `VariScout Report — ${finalName} — ${safeDate}.${extension}`;
}
