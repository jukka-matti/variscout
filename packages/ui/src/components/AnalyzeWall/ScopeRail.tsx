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
 */

import React from 'react';
import type { ProblemStatementScope } from '@variscout/core';
import { formatConditionLeaves } from '@variscout/core';

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
  return (
    <div className="flex flex-row flex-wrap gap-2 items-center" role="tablist">
      {scopes.map(scope => {
        const isActive = scope.id === activeScopeId;
        const conditionText = formatConditionLeaves(scope.predicates);
        return (
          <button
            key={scope.id}
            role="tab"
            data-testid={`scope-chip-${scope.id}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onScopeSelect(scope.id)}
            className={[
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border',
              isActive
                ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
            type="button"
          >
            <span className="truncate max-w-xs">{conditionText}</span>
            <span
              data-testid={`scope-archive-${scope.id}`}
              role="button"
              aria-label={`Archive scope ${conditionText}`}
              onClick={e => {
                e.stopPropagation();
                onScopeArchive(scope.id);
              }}
              className="ml-1 flex-shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              &times;
            </span>
          </button>
        );
      })}
    </div>
  );
}
