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
import { formatConditionLeaves } from '@variscout/core';
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
        return (
          <div key={scope.id} className="relative inline-flex">
            <button
              role="tab"
              data-testid={`scope-chip-${scope.id}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onScopeSelect(scope.id)}
              className={[
                'inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-7 text-sm',
                isActive
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                  : 'border-edge bg-surface text-content-secondary hover:bg-surface-secondary',
              ].join(' ')}
              type="button"
            >
              <span className="max-w-xs truncate">{conditionText}</span>
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
