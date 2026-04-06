import React from 'react';
import { Check, Plus, AlertTriangle } from 'lucide-react';

export interface TrackedAction {
  id: string;
  text: string;
  assignee?: { name: string; email?: string };
  dueDate?: string; // ISO date YYYY-MM-DD
  completedAt?: number; // timestamp
  createdAt: number;
  ideaId?: string;
  // Extra metadata from parent
  findingId: string;
  causeColor?: string; // hex color for cause dot
  causeName?: string; // e.g., "Shift"
  projectedCpk?: number;
}

export interface ActionTrackerSectionProps {
  actions: TrackedAction[];
  onToggleComplete: (actionId: string, findingId: string) => void;
  onAssign?: (actionId: string, findingId: string) => void;
  onSetDueDate?: (actionId: string, findingId: string) => void;
  onAddAction?: () => void;
  onActionClick?: (actionId: string, findingId: string) => void;
}

function isOverdue(action: TrackedAction): boolean {
  return !action.completedAt && action.dueDate != null && new Date(action.dueDate) < new Date();
}

function sortActions(actions: TrackedAction[]): TrackedAction[] {
  return [...actions].sort((a, b) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    const aCompleted = !!a.completedAt;
    const bCompleted = !!b.completedAt;

    // overdue first, then pending, then completed
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (!aCompleted && bCompleted) return -1;
    if (aCompleted && !bCompleted) return 1;
    return a.createdAt - b.createdAt;
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ActionTrackerSection: React.FC<ActionTrackerSectionProps> = ({
  actions,
  onToggleComplete,
  onAssign,
  onSetDueDate,
  onAddAction,
  onActionClick,
}) => {
  const total = actions.length;
  const completedCount = actions.filter(a => !!a.completedAt).length;
  const overdueActions = actions.filter(isOverdue);
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const sorted = sortActions(actions);

  return (
    <div className="flex flex-col gap-3" data-testid="action-tracker-section">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-content">Actions</h3>
          <span className="text-xs text-content-muted" data-testid="action-progress-count">
            {completedCount}/{total} complete
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div
          className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden"
          data-testid="action-progress-bar"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            data-testid="action-progress-fill"
          />
        </div>
      )}

      {/* Overdue banner */}
      {overdueActions.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
          data-testid="action-overdue-banner"
        >
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <span className="text-sm text-red-300">
            {overdueActions.length} action{overdueActions.length !== 1 ? 's' : ''} overdue
          </span>
        </div>
      )}

      {/* Action cards */}
      <div className="flex flex-col gap-2">
        {sorted.map(action => {
          const completed = !!action.completedAt;
          const overdue = isOverdue(action);

          return (
            <div
              key={action.id}
              data-testid={`action-card-${action.id}`}
              className={`relative rounded-lg border bg-surface px-3 py-2.5 flex items-start gap-3 ${
                overdue ? 'border-red-500/30' : 'border-edge'
              }`}
            >
              {/* Primary click target — ::after overlay (Fluent focusMode pattern) */}
              {onActionClick && (
                <button
                  className="absolute inset-0 z-0 rounded-lg bg-transparent after:absolute after:inset-0 after:rounded-lg hover:bg-surface-secondary/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  onClick={() => onActionClick(action.id, action.findingId)}
                  aria-label={`View action: ${action.text}`}
                  tabIndex={0}
                />
              )}

              {/* Completion circle */}
              <button
                data-testid={`action-toggle-${action.id}`}
                onClick={() => onToggleComplete(action.id, action.findingId)}
                className={`relative z-10 mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  completed
                    ? 'bg-green-500 border-green-500 border-2'
                    : 'border-2 border-edge hover:border-green-400'
                }`}
                aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {completed && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Action text */}
                <p
                  data-testid={`action-text-${action.id}`}
                  className={`text-sm ${
                    completed ? 'text-content-muted line-through' : 'text-content'
                  }`}
                >
                  {action.text}
                </p>

                {/* Meta row */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {/* Cause dot + name */}
                  {action.causeName && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-content-muted"
                      data-testid={`action-cause-${action.id}`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={
                          action.causeColor ? { backgroundColor: action.causeColor } : undefined
                        }
                      />
                      {action.causeName}
                    </span>
                  )}

                  {/* Assignee badge */}
                  {action.assignee ? (
                    <span
                      className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400"
                      data-testid={`action-assignee-${action.id}`}
                    >
                      {action.assignee.name}
                    </span>
                  ) : (
                    onAssign && (
                      <button
                        data-testid={`action-assign-btn-${action.id}`}
                        onClick={() => onAssign(action.id, action.findingId)}
                        className="relative z-10 text-xs text-content-muted hover:text-content transition-colors"
                      >
                        + Assign
                      </button>
                    )
                  )}

                  {/* Due date */}
                  {action.dueDate ? (
                    <span
                      className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-content-muted'}`}
                      data-testid={`action-due-date-${action.id}`}
                    >
                      {formatDate(action.dueDate)}
                    </span>
                  ) : (
                    onSetDueDate && (
                      <button
                        data-testid={`action-due-date-btn-${action.id}`}
                        onClick={() => onSetDueDate(action.id, action.findingId)}
                        className="relative z-10 text-xs text-content-muted hover:text-content transition-colors"
                      >
                        + Due date
                      </button>
                    )
                  )}

                  {/* Projected Cpk */}
                  {action.projectedCpk != null && (
                    <span
                      className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-blue-500"
                      data-testid={`action-cpk-${action.id}`}
                    >
                      Cpk{' '}
                      {Number.isFinite(action.projectedCpk) ? action.projectedCpk.toFixed(2) : '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add action */}
      {onAddAction && (
        <button
          data-testid="action-add-btn"
          onClick={onAddAction}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-edge py-2.5 text-sm text-content-muted hover:text-content hover:border-content-muted transition-colors"
        >
          <Plus size={14} />
          Add action
        </button>
      )}
    </div>
  );
};
