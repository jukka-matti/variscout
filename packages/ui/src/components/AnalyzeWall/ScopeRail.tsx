/**
 * ScopeRail — current scope + flat sibling switcher.
 *
 * Lists the persisted ProblemStatementScopes for the active investigation as
 * flat siblings. The current scope is the anchor; sibling chips switch the Wall
 * to another complete scope. This is not a broad-to-narrow trail.
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
  const activeScope = scopes.find(scope => scope.id === activeScopeId);
  const activeConditionText = activeScope ? formatConditionLeaves(activeScope.predicates) : null;
  const scopeCountLabel = `${scopes.length} scope${scopes.length === 1 ? '' : 's'}`;

  if (scopes.length === 0) {
    return <div className="flex flex-row flex-wrap items-center gap-2" role="tablist" />;
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      <div
        data-testid="scope-current-anchor"
        className="min-w-0 rounded border border-edge bg-surface px-3 py-1.5"
      >
        <div className="text-[10px] font-medium uppercase tracking-normal text-content-tertiary">
          Current scope
        </div>
        <div className="max-w-sm truncate text-sm font-medium text-content">
          {activeConditionText ?? 'All data'}
        </div>
      </div>

      <div
        data-testid="scope-switcher"
        className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-2"
      >
        <span className="text-xs font-medium text-content-tertiary">{scopeCountLabel}</span>
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
                  onClick={() => {
                    if (!isActive) onScopeSelect(scope.id);
                  }}
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
      </div>
    </div>
  );
}
