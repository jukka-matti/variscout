import type { Finding } from '@variscout/core';
import { formatFindingFilters } from '@variscout/core';

/**
 * Format all findings as readable text for clipboard export
 */
export function formatFindingsText(
  findings: Finding[],
  columnAliases?: Record<string, string>
): string {
  if (findings.length === 0) return '';

  const lines: string[] = ['VariScout Findings', '==================', ''];

  findings.forEach((finding, i) => {
    const filterStr = formatFindingFilters(finding.context, columnAliases);
    const statsParts: string[] = [];

    if (finding.context.stats?.cpk !== undefined) {
      statsParts.push(`Cpk ${finding.context.stats.cpk.toFixed(2)}`);
    }
    if (finding.context.stats?.samples !== undefined) {
      statsParts.push(`n=${finding.context.stats.samples}`);
    }
    if (finding.context.cumulativeScope !== null && finding.context.cumulativeScope !== undefined) {
      statsParts.push(`${Math.round(finding.context.cumulativeScope)}% isolated`);
    }

    const statsStr = statsParts.length > 0 ? ` | ${statsParts.join(' \u00b7 ')}` : '';
    lines.push(`${i + 1}. ${filterStr || '(no filters)'}${statsStr}`);
    lines.push(`   "${finding.text}"`);
    lines.push('');
  });

  return lines.join('\n').trim();
}

/**
 * Copy all findings to clipboard as formatted text
 */
export async function copyFindingsToClipboard(
  findings: Finding[],
  columnAliases?: Record<string, string>
): Promise<boolean> {
  const text = formatFindingsText(findings, columnAliases);
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
