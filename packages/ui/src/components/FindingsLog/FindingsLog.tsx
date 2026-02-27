import React from 'react';
import { Pin } from 'lucide-react';
import type { Finding, FindingStatus, FindingTag } from '@variscout/core';
import FindingCard from './FindingCard';
import FindingBoardView from './FindingBoardView';

export interface FindingsLogProps {
  /** List of findings to display */
  findings: Finding[];
  /** Edit a finding's note */
  onEditFinding: (id: string, text: string) => void;
  /** Delete a finding */
  onDeleteFinding: (id: string) => void;
  /** Click a finding card to restore its filter state */
  onRestoreFinding: (id: string) => void;
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** ID of the finding that matches current active filters (if any) */
  activeFindingId?: string | null;
  /** View mode: 'list' (flat) or 'board' (grouped by status) */
  viewMode?: 'list' | 'board';
  /** Change finding investigation status */
  onSetFindingStatus?: (id: string, status: FindingStatus) => void;
  /** Set a finding's classification tag */
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  /** Add a comment to a finding */
  onAddComment?: (id: string, text: string) => void;
  /** Edit an existing comment */
  onEditComment?: (findingId: string, commentId: string, text: string) => void;
  /** Delete a comment */
  onDeleteComment?: (findingId: string, commentId: string) => void;
  /** Callback when a photo is attached to a comment */
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  /** Show author names on comments */
  showAuthors?: boolean;
}

/**
 * Scrollable list of analyst findings.
 * Supports list view (flat) and board view (grouped by status accordion).
 * Shows empty state with guidance when no findings exist.
 */
const FindingsLog: React.FC<FindingsLogProps> = ({
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  columnAliases,
  activeFindingId,
  viewMode = 'list',
  onSetFindingStatus,
  onSetFindingTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddPhoto,
  showAuthors,
}) => {
  if (findings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-surface-tertiary/50 flex items-center justify-center mb-3">
          <Pin size={18} className="text-content-muted" />
        </div>
        <p className="text-sm text-content-secondary mb-1">No findings yet</p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Pin interesting filter combinations as you explore. Click the pin button in the breadcrumb
          bar to save your current view.
        </p>
      </div>
    );
  }

  if (viewMode === 'board' && onSetFindingStatus) {
    return (
      <FindingBoardView
        findings={findings}
        onEditFinding={onEditFinding}
        onDeleteFinding={onDeleteFinding}
        onRestoreFinding={onRestoreFinding}
        onSetFindingStatus={onSetFindingStatus}
        onSetFindingTag={onSetFindingTag}
        onAddComment={onAddComment ?? (() => {})}
        onEditComment={onEditComment ?? (() => {})}
        onDeleteComment={onDeleteComment ?? (() => {})}
        onAddPhoto={onAddPhoto}
        showAuthors={showAuthors}
        columnAliases={columnAliases}
        activeFindingId={activeFindingId}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" data-testid="findings-list">
      {findings.map(finding => (
        <FindingCard
          key={finding.id}
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
          showAuthors={showAuthors}
          columnAliases={columnAliases}
          isActive={finding.id === activeFindingId}
        />
      ))}
    </div>
  );
};

export default FindingsLog;
