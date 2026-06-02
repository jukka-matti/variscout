import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageCircle,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { FindingAssignee } from '@variscout/core';

export interface ActionItemsSectionProps {
  findingId: string;
  actions: Array<{
    id: string;
    text: string;
    assignee?: FindingAssignee;
    dueDate?: string;
    completedAt?: number;
    createdAt: number;
    /**
     * Set once this finding-level action has been promoted (COPIED) into the
     * project action tracker. When present, the "Promote to project" affordance
     * is hidden (PR-CS-6 Edge 1 re-promotion guard).
     */
    parentImprovementProjectId?: null | string;
  }>;
  onAddAction: (id: string, text: string, assignee?: FindingAssignee, dueDate?: string) => void;
  onCompleteAction?: (id: string, actionId: string) => void;
  onDeleteAction?: (id: string, actionId: string) => void;
  /**
   * Copy a finding-level action into the active project's action tracker.
   * Hidden unless provided AND an active project exists (gated by the wrapper).
   */
  onPromoteAction?: (findingId: string, actionId: string) => void;
  onAskCoScout?: (question: string) => void;
  readOnly?: boolean;
  renderActionAssigneePicker?: (onSelect: (a: FindingAssignee) => void) => React.ReactNode;
}

const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({
  findingId,
  actions,
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  onPromoteAction,
  onAskCoScout,
  readOnly,
  renderActionAssigneePicker,
}) => {
  const [isOpen, setIsOpen] = useState(actions.length > 0);
  const [newActionText, setNewActionText] = useState('');
  const [pendingAssignee, setPendingAssignee] = useState<FindingAssignee | undefined>(undefined);

  const overdue = actions.filter(
    a => a.dueDate && !a.completedAt && new Date(a.dueDate) < new Date()
  );
  const completed = actions.filter(a => a.completedAt);

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[0.625rem] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <CheckCircle2 size={10} />
        <span>
          Actions ({completed.length}/{actions.length})
        </span>
        {overdue.length > 0 && (
          <span className="ml-1 text-red-400 text-[0.5625rem]">{overdue.length} overdue</span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1">
          {actions.map(action => (
            <div
              key={action.id}
              className="flex items-start gap-1.5 group/action"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (!action.completedAt && onCompleteAction)
                    onCompleteAction(findingId, action.id);
                }}
                className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  action.completedAt
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-edge hover:border-blue-500/50'
                }`}
                disabled={readOnly || !!action.completedAt}
                title={action.completedAt ? 'Completed' : 'Mark complete'}
              >
                {action.completedAt && <CheckCircle2 size={8} />}
              </button>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-[0.6875rem] ${action.completedAt ? 'line-through text-content-muted' : 'text-content-secondary'}`}
                >
                  {action.text}
                </span>
                {(action.assignee || action.dueDate) && (
                  <div className="flex items-center gap-2 text-[0.5625rem] text-content-muted mt-0.5">
                    {action.assignee && <span>{action.assignee.displayName}</span>}
                    {action.dueDate && (
                      <span
                        className={`flex items-center gap-0.5 ${
                          !action.completedAt && new Date(action.dueDate) < new Date()
                            ? 'text-red-400'
                            : ''
                        }`}
                      >
                        <Clock size={8} />
                        {action.dueDate}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {onPromoteAction && !action.parentImprovementProjectId && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onPromoteAction(findingId, action.id);
                  }}
                  className="p-0.5 rounded text-content-muted hover:text-blue-400 opacity-0 group-hover/action:opacity-100 touch-show transition-opacity"
                  title="Promote to project action tracker"
                  aria-label="Promote action to project"
                  data-testid="promote-action-btn"
                >
                  <ArrowUpRight size={10} />
                </button>
              )}
              {action.parentImprovementProjectId && (
                <span
                  className="text-[0.5rem] text-blue-400/80 flex-shrink-0 mt-0.5"
                  title="Promoted to the project action tracker"
                  data-testid="action-promoted-marker"
                >
                  in project
                </span>
              )}
              {!action.completedAt && onAskCoScout && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAskCoScout(`How should I approach this action: "${action.text}"?`);
                  }}
                  className="p-0.5 rounded text-content-muted hover:text-cyan-400 opacity-0 group-hover/action:opacity-100 touch-show transition-opacity"
                  title="Ask CoScout about this action"
                >
                  <MessageCircle size={10} />
                </button>
              )}
              {!readOnly && onDeleteAction && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteAction(findingId, action.id);
                  }}
                  className="p-0.5 rounded text-content-muted hover:text-red-400 opacity-0 group-hover/action:opacity-100 touch-show transition-opacity"
                  title="Delete action"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <div className="mt-1 space-y-1" onClick={e => e.stopPropagation()}>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newActionText}
                  onChange={e => setNewActionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newActionText.trim()) {
                      onAddAction(findingId, newActionText.trim(), pendingAssignee);
                      setNewActionText('');
                      setPendingAssignee(undefined);
                    }
                  }}
                  placeholder="Add action..."
                  className="flex-1 text-[0.6875rem] bg-surface-tertiary/50 border border-edge/50 rounded px-2 py-1 text-content placeholder:text-content-muted focus:outline-none focus:border-blue-500/50"
                />
              </div>
              {pendingAssignee && (
                <div className="flex items-center gap-1 text-[0.625rem] text-purple-400">
                  <UserPlus size={9} />
                  <span>{pendingAssignee.displayName}</span>
                  <button
                    onClick={() => setPendingAssignee(undefined)}
                    className="text-content-muted hover:text-red-400"
                    title="Remove assignee"
                  >
                    ×
                  </button>
                </div>
              )}
              {renderActionAssigneePicker &&
                !pendingAssignee &&
                renderActionAssigneePicker(setPendingAssignee)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionItemsSection;
