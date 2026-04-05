/**
 * Knowledge context formatter for CoScout Tier 2 (semi-static context).
 *
 * Extracted from legacy.ts — formats Knowledge Base results and documents
 * into human-readable text blocks for CoScout system prompt injection.
 */

import type { AIContext } from '../../../types';
import { formatStatistic } from '../../../../i18n/format';

/**
 * Format Knowledge Base results for injection into CoScout context.
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
        parts.push(`   \u03b7\u00b2: ${formatStatistic(r.etaSquared * 100, 'en', 1)}%`);
      if (r.cpkBefore !== null && r.cpkAfter !== null)
        parts.push(
          `   Cpk: ${formatStatistic(r.cpkBefore, 'en', 2)} \u2192 ${formatStatistic(r.cpkAfter, 'en', 2)}`
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
      const parts = [`${i + 1}. "${d.title}" [Source: ${d.source}]`];
      if (d.snippet) {
        // Truncate but keep enough for meaningful context
        const truncated = d.snippet.length > 400 ? d.snippet.slice(0, 400) + '\u2026' : d.snippet;
        parts.push(`   ${truncated}`);
      }
      if (d.url) parts.push(`   Link: ${d.url}`);
      return parts.join('\n');
    });
    sections.push(docLines.join('\n\n'));
  }

  if (sections.length === 0) return '';

  return `Knowledge Base documents found (from the team's SharePoint \u2014 cite these naturally with [Source: name] when relevant):\n${sections.join('\n\n')}`;
}
