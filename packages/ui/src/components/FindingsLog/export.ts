import type { Finding, Locale } from '@variscout/core';
import {
  formatFindingFilters,
  getFindingStatus,
  FINDING_STATUS_LABELS,
  FINDING_TAG_LABELS,
} from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

/** Get locale from document attribute for non-React contexts */
function getDocLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const locale = document.documentElement.getAttribute('data-locale');
  if (locale === 'de' || locale === 'es' || locale === 'fr' || locale === 'pt') return locale;
  return 'en';
}

/** Format relative time for comments */
function relativeTimeExport(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
    const status = getFindingStatus(finding);
    const statusLabel = FINDING_STATUS_LABELS[status].toUpperCase();
    const tagLabel = finding.tag ? ` \u00b7 ${FINDING_TAG_LABELS[finding.tag].toUpperCase()}` : '';

    if (finding.context.stats?.cpk !== undefined) {
      statsParts.push(`Cpk ${formatStatistic(finding.context.stats.cpk, getDocLocale())}`);
    }
    if (finding.context.stats?.samples !== undefined) {
      statsParts.push(`n=${finding.context.stats.samples}`);
    }
    if (finding.context.cumulativeScope !== null && finding.context.cumulativeScope !== undefined) {
      statsParts.push(`${Math.round(finding.context.cumulativeScope)}% in focus`);
    }

    const statsStr = statsParts.length > 0 ? ` | ${statsParts.join(' \u00b7 ')}` : '';
    // Chart source prefix
    const sourceStr = finding.source
      ? `${finding.source.chart.charAt(0).toUpperCase() + finding.source.chart.slice(1)}${'category' in finding.source ? `: ${finding.source.category}` : ''} \u00b7 `
      : '';
    lines.push(
      `${i + 1}. [${statusLabel}${tagLabel}] ${sourceStr}${filterStr || '(no filters)'}${statsStr}`
    );
    if (finding.text) {
      lines.push(`   "${finding.text}"`);
    }
    // Append comments
    const comments = finding.comments;
    for (const comment of comments) {
      const authorPrefix = comment.author ? `${comment.author}: ` : '';
      const photoSuffix = comment.photos?.length ? ` [${comment.photos.length} photo(s)]` : '';
      lines.push(
        `   > ${authorPrefix}${comment.text}${photoSuffix} (${relativeTimeExport(comment.createdAt)})`
      );
    }
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
