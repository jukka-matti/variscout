import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Finding, FindingStatus, FindingTag } from '@variscout/core';
import { FINDING_STATUSES, FINDING_STATUS_LABELS, groupFindingsByStatus } from '@variscout/core';
import FindingCard from './FindingCard';
import { STATUS_DOT_COLORS } from './FindingStatusBadge';

export interface FindingBoardViewProps {
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
  showAuthors?: boolean;
  columnAliases?: Record<string, string>;
  activeFindingId?: string | null;
}

/**
 * Accordion layout for the findings panel — collapsible sections per status.
 * Non-empty sections start expanded, empty sections start collapsed.
 */
const FindingBoardView: React.FC<FindingBoardViewProps> = ({
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
  showAuthors,
  columnAliases,
  activeFindingId,
}) => {
  const groups = groupFindingsByStatus(findings);

  // Track which sections are expanded
  const [expanded, setExpanded] = useState<Record<FindingStatus, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const status of FINDING_STATUSES) {
      initial[status] = groups[status].length > 0;
    }
    return initial as Record<FindingStatus, boolean>;
  });

  const toggleSection = (status: FindingStatus) => {
    setExpanded(prev => ({ ...prev, [status]: !prev[status] }));
  };

  if (findings.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" data-testid="findings-board">
      {FINDING_STATUSES.map(status => {
        const items = groups[status];
        const isExpanded = expanded[status];

        return (
          <div key={status} className="rounded-lg border border-edge overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(status)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-surface-tertiary/30 hover:bg-surface-tertiary/50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={12} className="text-content-muted flex-shrink-0" />
              ) : (
                <ChevronRight size={12} className="text-content-muted flex-shrink-0" />
              )}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[status]}`} />
              <span className="text-xs font-medium text-content flex-1 text-left">
                {FINDING_STATUS_LABELS[status]}
              </span>
              <span className="text-[10px] text-content-muted px-1.5 py-0.5 bg-surface-tertiary rounded">
                {items.length}
              </span>
            </button>

            {/* Section body */}
            {isExpanded && items.length > 0 && (
              <div className="px-2 py-2 space-y-2">
                {items.map(finding => (
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
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FindingBoardView;
