/**
 * Migration functions for findings domain — handles schema evolution
 * from older status models and data shapes.
 */
import type { Finding, FindingSource, FindingAssignee } from './types';

/**
 * Migrate a finding from the old 4-status model to the new 3-status model.
 * - 'confirmed' → 'analyzed' + tag 'key-driver'
 * - 'dismissed' → 'analyzed' + tag 'low-impact'
 * Other statuses pass through unchanged.
 */
export function migrateFindingStatus(finding: Finding): Finding {
  const status = finding.status as string;
  if (status === 'confirmed') {
    return { ...finding, status: 'analyzed', tag: finding.tag ?? 'key-driver' };
  }
  if (status === 'dismissed') {
    return { ...finding, status: 'analyzed', tag: finding.tag ?? 'low-impact' };
  }
  return finding;
}

/**
 * Normalize a legacy flat FindingSource to the discriminated union shape.
 * Safe to call on already-migrated data.
 */
function migrateSource(source: FindingSource | undefined): FindingSource | undefined {
  if (!source) return undefined;
  if (source.chart === 'ichart') {
    // Ensure ichart shape has required anchorX/anchorY
    const s = source as Record<string, unknown>;
    return {
      chart: 'ichart',
      anchorX: (s.anchorX as number) ?? 0,
      anchorY: (s.anchorY as number) ?? 0,
    };
  }
  // Yamazumi: category-based with optional activityType
  if (source.chart === 'yamazumi') {
    const s = source as Record<string, unknown>;
    const result: FindingSource = {
      chart: 'yamazumi',
      category: (s.category as string) ?? '',
    };
    if (s.activityType)
      (result as { activityType?: string }).activityType = s.activityType as string;
    return result;
  }
  // Ensure boxplot/pareto shape has required category
  const s = source as Record<string, unknown>;
  return { chart: source.chart, category: (s.category as string) ?? '' };
}

/**
 * Migrate a legacy string assignee on an ActionItem to FindingAssignee.
 * - undefined → undefined
 * - string → { upn: string, displayName: string } (uses string for both)
 * - FindingAssignee → pass through
 */
export function migrateActionAssignee(
  assignee: string | FindingAssignee | undefined
): FindingAssignee | undefined {
  if (assignee === undefined) return undefined;
  if (typeof assignee === 'string') {
    return { upn: assignee, displayName: assignee };
  }
  return assignee;
}

/**
 * Migrate an array of findings from old status model to new.
 * Also normalizes FindingSource to discriminated union shape
 * and migrates ActionItem assignees from string to FindingAssignee.
 * Safe to call on already-migrated data.
 */
export function migrateFindings(findings: Finding[]): Finding[] {
  return findings.map(f => {
    let migrated = migrateFindingStatus(f);
    const source = migrateSource(migrated.source);
    if (source !== migrated.source) {
      migrated = { ...migrated, source };
    }
    // Migrate action assignees from string to FindingAssignee
    if (migrated.actions?.length) {
      const migratedActions = migrated.actions.map(a => {
        const newAssignee = migrateActionAssignee(
          a.assignee as string | FindingAssignee | undefined
        );
        return newAssignee !== a.assignee ? { ...a, assignee: newAssignee } : a;
      });
      if (migratedActions.some((a, i) => a !== migrated.actions![i])) {
        migrated = { ...migrated, actions: migratedActions };
      }
    }
    return migrated;
  });
}
