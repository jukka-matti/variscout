import type { Finding } from '../findings/types';

function humanizeColumnName(column: string, columnAliases?: Record<string, string>): string {
  const alias = columnAliases?.[column];
  if (alias && alias.trim().length > 0) return alias.trim();
  return column
    .trim()
    .split('_')
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && ['of', 'and', 'or', 'the'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('-');
}

function observationRangeFromText(text: string): string | null {
  const match = text.match(/\b(?:obs|indices)\s+(\d+)\s*[-–]\s*(\d+)\b/i);
  if (!match) return null;
  return `observations ${match[1]}-${match[2]}`;
}

function brushedTextLabel(text: string, columnAliases?: Record<string, string>): string | null {
  const match = text.match(/^Brushed indices\s+(\d+)\s*[-–]\s*(\d+)\s+on\s+(.+)$/i);
  if (!match) return null;
  const column = humanizeColumnName(match[3], columnAliases);
  return `${column}, observations ${match[1]}-${match[2]}`;
}

function activeFilterLabel(
  finding: Finding,
  columnAliases?: Record<string, string>
): string | null {
  for (const [column, values] of Object.entries(finding.context.activeFilters ?? {})) {
    const observationRange = observationRangeFromText(column);
    if (observationRange && values.map(String).includes('in')) return observationRange;
  }

  const parts = Object.entries(finding.context.activeFilters ?? {}).map(([column, values]) => {
    const label = humanizeColumnName(column, columnAliases);
    return `${label} = ${values.map(String).join(', ')}`;
  });
  return parts.length > 0 ? parts.join(' x ') : null;
}

export function isAutoMintedReportLabel(label: string): boolean {
  const normalized = label.trim();
  return (
    /^Brushed indices\s+\d+\s*[-–]\s*\d+\s+on\s+.+$/i.test(normalized) ||
    /\bobs\s+\d+\s*[-–]\s*\d+\b/i.test(normalized)
  );
}

export function humanizeAutoMintedReportLabel(
  label: string,
  columnAliases?: Record<string, string>
): string {
  const brushed = brushedTextLabel(label, columnAliases);
  if (brushed) return brushed;
  return observationRangeFromText(label) ?? label;
}

export function humanizeReportFindingLabel(
  finding: Finding,
  columnAliases?: Record<string, string>
): string {
  const text = finding.text.trim();
  const autoMinted = humanizeAutoMintedReportLabel(text, columnAliases);
  if (autoMinted !== text) return autoMinted;

  if (text.length > 0 && !isAutoMintedReportLabel(text)) return text;

  return activeFilterLabel(finding, columnAliases) ?? (text || 'Observation');
}
