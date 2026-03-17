/**
 * FindingDetailPanel — Right-side detail panel for the Investigation page.
 *
 * Shows full finding detail with sections for hypothesis, projection, actions, outcome.
 * Rendered alongside FindingBoardColumns in the 3-zone investigation layout.
 */

import React from 'react';
import { X, ArrowLeft, ExternalLink } from 'lucide-react';
import type { Finding, FindingSource, FindingStatus, FindingTag } from '@variscout/core';
import FindingCard from '../FindingsLog/FindingCard';

export interface FindingDetailPanelProps {
  /** The finding to display in detail, or null if none selected */
  finding: Finding | null;
  /** Close the detail panel */
  onClose: () => void;
  /** Column aliases for display */
  columnAliases?: Record<string, string>;
  /** Whether the display is compact (phone/medium) vs side-by-side (wide) */
  compact?: boolean;

  // FindingCard callbacks (passed through)
  onEditFinding: (id: string, text: string) => void;
  onDeleteFinding: (id: string) => void;
  onRestoreFinding: (id: string) => void;
  onSetFindingStatus?: (id: string, status: FindingStatus) => void;
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  onAddComment?: (id: string, text: string) => void;
  onEditComment?: (findingId: string, commentId: string, text: string) => void;
  onDeleteComment?: (findingId: string, commentId: string) => void;
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  hypothesesMap?: Record<string, { text: string; status: string; factor?: string; level?: string }>;
  onAddAction?: (
    id: string,
    text: string,
    assignee?: import('@variscout/core').FindingAssignee,
    dueDate?: string
  ) => void;
  onCompleteAction?: (id: string, actionId: string) => void;
  onDeleteAction?: (id: string, actionId: string) => void;
  onSetOutcome?: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;
  onProjectImprovement?: (findingId: string) => void;
  hasSpecs?: boolean;

  /** Navigate to the chart that sourced this finding */
  onNavigateToChart?: (source: FindingSource) => void;
}

const FindingDetailPanel: React.FC<FindingDetailPanelProps> = ({
  finding,
  onClose,
  columnAliases,
  compact = false,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  onSetFindingStatus,
  onSetFindingTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onCreateHypothesis,
  hypothesesMap,
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  onSetOutcome,
  onProjectImprovement,
  hasSpecs,
  onNavigateToChart,
}) => {
  if (!finding) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-content-muted text-sm"
        data-testid="detail-empty"
      >
        Select a finding to see details
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full border-l border-edge bg-surface ${compact ? 'absolute inset-0 z-10' : ''}`}
      data-testid="finding-detail-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge bg-surface-secondary/50">
        {compact && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-tertiary text-content-muted hover:text-content transition-colors"
            aria-label="Back to board"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <span className="text-sm font-medium text-content flex-1 truncate">Finding Detail</span>
        {finding.source && onNavigateToChart && (
          <button
            onClick={() => onNavigateToChart(finding.source!)}
            className="p-1 rounded hover:bg-surface-tertiary text-blue-400 hover:text-blue-300 transition-colors"
            title="Navigate to chart"
            aria-label="Navigate to chart"
          >
            <ExternalLink size={14} />
          </button>
        )}
        {!compact && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-tertiary text-content-muted hover:text-content transition-colors"
            aria-label="Close detail panel"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content — reuses FindingCard for rendering */}
      <div className="flex-1 overflow-y-auto p-3">
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
          columnAliases={columnAliases}
          onCreateHypothesis={onCreateHypothesis}
          hypothesesMap={hypothesesMap}
          onAddAction={onAddAction}
          onCompleteAction={onCompleteAction}
          onDeleteAction={onDeleteAction}
          onSetOutcome={onSetOutcome}
          onProjectImprovement={onProjectImprovement}
          hasSpecs={hasSpecs}
          onNavigateToChart={onNavigateToChart}
          maxStatuses={5}
        />
      </div>
    </div>
  );
};

export default FindingDetailPanel;
