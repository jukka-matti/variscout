/**
 * ScopeRail — Task 5 (IM-4b) Multi-scope rail
 *
 * A horizontal breadcrumb/tab rail that lists the persisted
 * ProblemStatementScopes for the active investigation.
 *
 * - Clicking a chip calls onScopeSelect(scope.id) to re-anchor the Wall.
 * - The archive button on each chip calls onScopeArchive(scope.id) via
 *   SCOPE_ARCHIVE (analyzeStore.archiveScope); stops propagation so the
 *   chip click (onScopeSelect) does NOT fire.
 * - The active scope chip carries aria-current="true".
 * - Condition text is rendered via formatConditionLeaves from @variscout/core.
 *
 * Accessibility: each scope is a `role="tab"` button. The archive affordance is
 * a sibling `<button>` (NOT a nested button — invalid HTML) absolutely
 * positioned over the chip's trailing edge, so it stays inside the rail's
 * `role="tablist"` without producing an interactive-inside-interactive tree.
 *
 * Styling follows the sibling Wall chrome (semantic design tokens — `bg-surface`,
 * `border-edge`, `text-content`) rather than raw palette classes.
 */

import React from 'react';
import type { ProblemStatementScope } from '@variscout/core';
import { formatConditionLeaves, predicateSetKey } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

export interface ScopeRailProps {
  /** The persisted scopes (active — deletedAt === null — already filtered by caller). */
  scopes: ReadonlyArray<ProblemStatementScope>;
  /** Id of the currently active scope (re-anchors the Problem card). */
  activeScopeId?: string;
  /** Called when the user selects a scope chip. */
  onScopeSelect: (scopeId: string) => void;
  /** Called when the user archives a scope (SCOPE_ARCHIVE). */
  onScopeArchive: (scopeId: string) => void;
}

function leafKey(scopePredicate: ProblemStatementScope['predicates'][number]): string {
  return predicateSetKey([scopePredicate]);
}

function isStrictPredicateSubset(
  maybeParent: ProblemStatementScope,
  child: ProblemStatementScope
): boolean {
  if (
    maybeParent.predicates.length === 0 ||
    maybeParent.predicates.length >= child.predicates.length
  ) {
    return false;
  }
  const childKeys = new Set(child.predicates.map(leafKey));
  return maybeParent.predicates.every(predicate => childKeys.has(leafKey(predicate)));
}

function resolveLineageParent(
  scope: ProblemStatementScope,
  scopes: ReadonlyArray<ProblemStatementScope>
): ProblemStatementScope | undefined {
  if (scope.parentScopeId) {
    const explicit = scopes.find(candidate => candidate.id === scope.parentScopeId);
    if (explicit) return explicit;
  }

  return scopes
    .filter(
      candidate =>
        candidate.id !== scope.id &&
        candidate.deletedAt === null &&
        candidate.projectId === scope.projectId &&
        candidate.outcome === scope.outcome &&
        isStrictPredicateSubset(candidate, scope)
    )
    .sort((a, b) => b.predicates.length - a.predicates.length)[0];
}

function formatDeltaSegment(parent: ProblemStatementScope, child: ProblemStatementScope): string {
  const parentKeys = new Set(parent.predicates.map(leafKey));
  const delta = child.predicates.filter(predicate => !parentKeys.has(leafKey(predicate)));
  return formatConditionLeaves(delta.length > 0 ? delta : child.predicates);
}

function buildLineageSegments(
  scope: ProblemStatementScope,
  scopes: ReadonlyArray<ProblemStatementScope>,
  visited = new Set<string>()
): string[] {
  if (visited.has(scope.id)) return [formatConditionLeaves(scope.predicates)];
  visited.add(scope.id);

  const parent = resolveLineageParent(scope, scopes);
  if (!parent || visited.has(parent.id)) return [formatConditionLeaves(scope.predicates)];

  return [...buildLineageSegments(parent, scopes, visited), formatDeltaSegment(parent, scope)];
}

function formatScopeLineage(
  scope: ProblemStatementScope,
  scopes: ReadonlyArray<ProblemStatementScope>
): string | undefined {
  if (!resolveLineageParent(scope, scopes)) return undefined;
  return buildLineageSegments(scope, scopes).join(' → ');
}

/**
 * Horizontal rail of scope chips. Each chip displays the scope's compound
 * WHERE condition and carries an archive affordance.
 */
export function ScopeRail({
  scopes,
  activeScopeId,
  onScopeSelect,
  onScopeArchive,
}: ScopeRailProps): React.ReactElement {
  const locale = useWallLocale();
  return (
    <div className="flex flex-row flex-wrap items-center gap-2" role="tablist">
      {scopes.map(scope => {
        const isActive = scope.id === activeScopeId;
        const conditionText = formatConditionLeaves(scope.predicates);
        const lineageText = formatScopeLineage(scope, scopes);
        return (
          <div key={scope.id} className="relative inline-flex">
            <button
              role="tab"
              data-testid={`scope-chip-${scope.id}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onScopeSelect(scope.id)}
              className={[
                'inline-flex max-w-sm flex-col items-start gap-0.5 rounded-full border py-1 pl-3 pr-7 text-sm',
                isActive
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                  : 'border-edge bg-surface text-content-secondary hover:bg-surface-secondary',
              ].join(' ')}
              type="button"
            >
              <span
                className="max-w-xs truncate"
                data-testid={lineageText ? `scope-lineage-${scope.id}` : undefined}
              >
                {lineageText ?? conditionText}
              </span>
              {lineageText && (
                <span className="max-w-xs truncate text-[10px] font-normal opacity-70">
                  {conditionText}
                </span>
              )}
            </button>
            <button
              type="button"
              data-testid={`scope-archive-${scope.id}`}
              aria-label={getMessage(locale, 'wall.scope.archive').replace(
                '{condition}',
                conditionText
              )}
              onClick={e => {
                e.stopPropagation();
                onScopeArchive(scope.id);
              }}
              className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-content-tertiary hover:bg-surface-secondary hover:text-content"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
