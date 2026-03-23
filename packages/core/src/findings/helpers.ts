/**
 * Status helpers and utility functions for findings domain.
 */
import type {
  Finding,
  FindingStatus,
  FindingContext,
  FindingSource,
  InvestigationCategory,
} from './types';

/**
 * Get finding status
 */
export function getFindingStatus(finding: Finding): FindingStatus {
  return finding.status;
}

/**
 * Group findings by status for board view
 */
export function groupFindingsByStatus(findings: Finding[]): Record<FindingStatus, Finding[]> {
  const groups: Record<FindingStatus, Finding[]> = {
    observed: [],
    investigating: [],
    analyzed: [],
    improving: [],
    resolved: [],
  };

  for (const finding of findings) {
    groups[finding.status].push(finding);
  }

  return groups;
}

/**
 * Compare two activeFilters objects (order-insensitive for both keys and values)
 */
export function filtersEqual(
  a: Record<string, (string | number)[]>,
  b: Record<string, (string | number)[]>
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    const valsA = a[keysA[i]].map(String).sort();
    const valsB = b[keysB[i]].map(String).sort();
    if (valsA.length !== valsB.length) return false;
    for (let j = 0; j < valsA.length; j++) {
      if (valsA[j] !== valsB[j]) return false;
    }
  }
  return true;
}

/**
 * Find an existing finding with matching filters, or undefined
 */
export function findDuplicateFinding(
  findings: Finding[],
  activeFilters: Record<string, (string | number)[]>
): Finding | undefined {
  return findings.find(f => filtersEqual(f.context.activeFilters, activeFilters));
}

/**
 * Find an existing finding with matching chart source (same chart type + category).
 * Used for duplicate detection when adding chart observations.
 */
export function findDuplicateBySource(
  findings: Finding[],
  source: FindingSource
): Finding | undefined {
  return findings.find(f => {
    if (!f.source) return false;
    if (f.source.chart !== source.chart) return false;
    // Category-based charts (boxplot/pareto)
    if (source.chart !== 'ichart') {
      return f.source.chart !== 'ichart' && f.source.category === source.category;
    }
    // I-Chart: no duplicate detection by position (each is unique)
    return false;
  });
}

/**
 * Get the category that a factor belongs to, or undefined if uncategorized.
 */
export function getCategoryForFactor(
  categories: InvestigationCategory[],
  factorName: string
): InvestigationCategory | undefined {
  return categories.find(c => c.factorNames.includes(factorName));
}

/**
 * Format a finding's filters as a compact display string
 */
export function formatFindingFilters(
  context: FindingContext,
  columnAliases?: Record<string, string>
): string {
  const parts: string[] = [];
  for (const [factor, values] of Object.entries(context.activeFilters)) {
    const label = columnAliases?.[factor] || factor;
    const valStr =
      values.length <= 2 ? values.map(String).join(', ') : `${values[0]} +${values.length - 1}`;
    parts.push(`${label}=${valStr}`);
  }
  return parts.join(' · ');
}
