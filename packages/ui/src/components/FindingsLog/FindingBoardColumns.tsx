import React from 'react';
import type { Finding, FindingStatus, FindingTag } from '@variscout/core';
import { FINDING_STATUSES, FINDING_STATUS_LABELS, groupFindingsByStatus } from '@variscout/core';
import FindingCard from './FindingCard';
import { STATUS_DOT_COLORS } from './FindingStatusBadge';

export interface FindingBoardColumnsProps {
  findings: Finding[];
  onEditFinding: (id: string, text: string) => void;
  onDeleteFinding: (id: string) => void;
  onRestoreFinding: (id: string) => void;
  onSetFindingStatus: (id: string, status: FindingStatus) => void;
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  onAddComment: (id: string, text: string) => void;
  onEditComment: (findingId: string, commentId: string, text: string) => void;
  onDeleteComment: (findingId: string, commentId: string) => void;
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  showAuthors?: boolean;
  columnAliases?: Record<string, string>;
  activeFindingId?: string | null;
}

/**
 * Horizontal column layout for the popout window.
 * Each status gets a column with draggable cards.
 * Uses native drag-and-drop for zero-dependency simplicity.
 */
const FindingBoardColumns: React.FC<FindingBoardColumnsProps> = ({
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  onSetFindingStatus,
  onSetFindingTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddPhoto,
  onCaptureFromTeams,
  showAuthors,
  columnAliases,
  activeFindingId,
}) => {
  const groups = groupFindingsByStatus(findings);

  const handleDragStart = (e: React.DragEvent, findingId: string) => {
    e.dataTransfer.setData('text/plain', findingId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: FindingStatus) => {
    e.preventDefault();
    const findingId = e.dataTransfer.getData('text/plain');
    if (findingId) {
      onSetFindingStatus(findingId, targetStatus);
    }
  };

  return (
    <div
      className="flex-1 flex gap-3 overflow-x-auto px-3 py-3 min-h-0"
      data-testid="findings-board-columns"
    >
      {FINDING_STATUSES.map(status => {
        const items = groups[status];
        return (
          <div
            key={status}
            className="flex-shrink-0 w-[220px] flex flex-col rounded-lg border border-edge bg-surface-secondary/50 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-edge bg-surface-tertiary/30">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[status]}`} />
              <span className="text-xs font-medium text-content flex-1">
                {FINDING_STATUS_LABELS[status]}
              </span>
              <span className="text-[10px] text-content-muted px-1.5 py-0.5 bg-surface-tertiary rounded">
                {items.length}
              </span>
            </div>

            {/* Column body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {items.map(finding => (
                <div
                  key={finding.id}
                  draggable
                  onDragStart={e => handleDragStart(e, finding.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <FindingCard
                    finding={finding}
                    onEdit={onEditFinding}
                    onDelete={onDeleteFinding}
                    onRestore={onRestoreFinding}
                    onSetStatus={onSetFindingStatus}
                    onSetTag={onSetFindingTag}
                    onAddComment={onAddComment}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    onAddPhoto={onAddPhoto}
                    onCaptureFromTeams={onCaptureFromTeams}
                    showAuthors={showAuthors}
                    columnAliases={columnAliases}
                    isActive={finding.id === activeFindingId}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-[10px] text-content-muted text-center py-4 italic">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FindingBoardColumns;
