/**
 * Status helpers and utility functions for findings domain.
 */
import type {
  Finding,
  FindingStatus,
  FindingContext,
  FindingSource,
  InvestigationCategory,
  Question,
  SuspectedCause,
} from './types';
import { createSuspectedCause } from './factories';

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
    // Category-based charts (boxplot/pareto/yamazumi)
    if (source.chart === 'boxplot' || source.chart === 'pareto' || source.chart === 'yamazumi') {
      return (
        (f.source.chart === 'boxplot' ||
          f.source.chart === 'pareto' ||
          f.source.chart === 'yamazumi') &&
        f.source.category === source.category
      );
    }
    // I-Chart: no duplicate detection by position (each is unique)
    // CoScout: no duplicate detection (each message is unique)
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

/**
 * Determine if a finding is in scope for cumulative projection.
 * Auto-scope: investigating or analyzed status. Manual override via scoped field.
 */
export function isFindingScoped(finding: Finding): boolean {
  if (finding.scoped !== undefined) return finding.scoped;
  return finding.status === 'investigating' || finding.status === 'analyzed';
}

/**
 * Get all scoped findings (excluding benchmarks).
 */
export function getScopedFindings(findings: Finding[]): Finding[] {
  return findings.filter(f => f.role !== 'benchmark' && isFindingScoped(f));
}

// ============================================================================
// SuspectedCause hub helpers
// ============================================================================

/**
 * Compute the aggregate evidence contribution for a SuspectedCause hub.
 *
 * Sums η² (etaSquared) from each connected question. Falls back to rSquaredAdj
 * when etaSquared is absent. Questions not present in the provided list are
 * silently skipped (e.g. questions from a different investigation scope).
 *
 * @param hub - The SuspectedCause hub to compute contribution for
 * @param questions - All questions in scope (e.g. from the investigation store)
 * @returns Aggregate contribution as a decimal (e.g. 0.56 = 56%)
 */
export function computeHubContribution(hub: SuspectedCause, questions: Question[]): number {
  const hubQuestionIds = new Set(hub.questionIds);
  let total = 0;
  for (const q of questions) {
    if (!hubQuestionIds.has(q.id)) continue;
    const contribution = q.evidence?.etaSquared ?? q.evidence?.rSquaredAdj ?? 0;
    total += contribution;
  }
  return total;
}

/**
 * Migrate legacy `causeRole: 'suspected-cause'` tags on questions into individual
 * SuspectedCause hub instances.
 *
 * One hub is created per question that has `causeRole === 'suspected-cause'` and
 * a non-empty `factor` name. Questions with `ruled-out` or `contributing` roles,
 * or questions without a factor, are skipped.
 *
 * This is a one-time migration helper — new investigations should use the
 * SuspectedCause hub model directly.
 *
 * @param questions - All questions in the investigation tree
 * @returns New SuspectedCause hubs (one per migrated question)
 */
export function migrateCauseRolesToHubs(questions: Question[]): SuspectedCause[] {
  const hubs: SuspectedCause[] = [];
  for (const q of questions) {
    if (q.causeRole !== 'suspected-cause') continue;
    if (!q.factor) continue;
    hubs.push(createSuspectedCause(q.factor, '', [q.id], q.linkedFindingIds ?? []));
  }
  return hubs;
}
