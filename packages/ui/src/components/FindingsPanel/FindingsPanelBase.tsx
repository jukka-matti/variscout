import React, { useState, useEffect, useCallback } from 'react';
import {
  GripVertical,
  X,
  ClipboardCopy,
  Check,
  ExternalLink,
  List,
  LayoutGrid,
} from 'lucide-react';
import type { Finding, FindingStatus, FindingTag } from '@variscout/core';
import type { DrillStep } from '@variscout/hooks';
import { useResizablePanel } from '@variscout/hooks';
import { FindingsLog, copyFindingsToClipboard } from '../FindingsLog';

export interface FindingsPanelResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

export interface FindingsPanelBaseProps {
  isOpen: boolean;
  onClose: () => void;

  // FindingsLog passthrough
  findings: Finding[];
  onEditFinding: (id: string, text: string) => void;
  onDeleteFinding: (id: string) => void;
  onRestoreFinding: (id: string) => void;
  onSetFindingStatus: (id: string, status: FindingStatus) => void;
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  onAddComment: (id: string, text: string) => void;
  onEditComment: (findingId: string, commentId: string, text: string) => void;
  onDeleteComment: (findingId: string, commentId: string) => void;

  // Azure-optional (not used in PWA)
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  showAuthors?: boolean;
  onShareFinding?: (findingId: string) => void;
  onAssignFinding?: (findingId: string) => void;

  // Panel chrome
  columnAliases?: Record<string, string>;
  drillPath: DrillStep[];
  activeFindingId?: string | null;
  onPopout?: () => void;

  // View mode (uncontrolled by default, controlled when both provided)
  viewMode?: 'list' | 'board';
  onViewModeChange?: (mode: 'list' | 'board') => void;

  // Resize config
  resizeConfig: FindingsPanelResizeConfig;
}

const FindingsPanelBase: React.FC<FindingsPanelBaseProps> = ({
  isOpen,
  onClose,
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
  drillPath,
  activeFindingId,
  onPopout,
  onShareFinding,
  onAssignFinding,
  viewMode: externalViewMode,
  onViewModeChange,
  resizeConfig,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [localViewMode, setLocalViewMode] = useState<'list' | 'board'>('list');
  const viewMode = externalViewMode ?? localViewMode;

  const handleViewModeChange = (mode: 'list' | 'board') => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const { width, isDragging, handleMouseDown } = useResizablePanel(
    resizeConfig.storageKey,
    resizeConfig.min ?? 320,
    resizeConfig.max ?? 600,
    resizeConfig.defaultWidth ?? 384
  );

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyAll = useCallback(async () => {
    const ok = await copyFindingsToClipboard(findings, columnAliases);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [findings, columnAliases]);

  if (!isOpen) return null;

  return (
    <>
      {/* Draggable divider */}
      <div
        className={`w-1 bg-surface-tertiary hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={12} className="text-content-muted" />
      </div>

      {/* Panel */}
      <div
        className="flex-shrink-0 bg-surface-secondary border-l border-edge flex flex-col overflow-hidden"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content">
            Findings
            {findings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                {findings.length}
              </span>
            )}
          </h2>

          <div className="flex items-center gap-1">
            {/* View toggle */}
            {findings.length > 0 && (
              <div className="flex items-center rounded-lg border border-edge overflow-hidden mr-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-surface-tertiary text-content'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title="List view"
                  aria-label="List view"
                >
                  <List size={12} />
                </button>
                <button
                  onClick={() => handleViewModeChange('board')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'board'
                      ? 'bg-surface-tertiary text-content'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title="Board view"
                  aria-label="Board view"
                >
                  <LayoutGrid size={12} />
                </button>
              </div>
            )}
            {findings.length > 0 && (
              <button
                onClick={handleCopyAll}
                className={`p-1.5 rounded-lg transition-all ${
                  copyFeedback
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title="Copy all findings to clipboard"
                aria-label="Copy all findings"
              >
                {copyFeedback ? <Check size={14} /> : <ClipboardCopy size={14} />}
              </button>
            )}
            {onPopout && (
              <button
                onClick={onPopout}
                className="hidden sm:inline-flex p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Open in separate window"
                aria-label="Open findings in separate window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
              title="Close"
              aria-label="Close findings panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Findings list/board */}
        <FindingsLog
          findings={findings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
          onRestoreFinding={onRestoreFinding}
          onSetFindingStatus={onSetFindingStatus}
          onSetFindingTag={onSetFindingTag}
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onAddPhoto={onAddPhoto}
          onCaptureFromTeams={onCaptureFromTeams}
          showAuthors={showAuthors}
          columnAliases={columnAliases}
          activeFindingId={activeFindingId}
          onShareFinding={onShareFinding}
          onAssignFinding={onAssignFinding}
          viewMode={viewMode}
        />

        {/* Drill path footer */}
        {drillPath.length > 0 && (
          <div className="px-4 py-3 border-t border-edge">
            <div className="text-[10px] text-content-muted uppercase tracking-wider mb-1.5">
              Drill Path
            </div>
            <div className="flex flex-wrap gap-1">
              {drillPath.map((step, i) => (
                <span
                  key={step.factor}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] rounded-full"
                >
                  {columnAliases?.[step.factor] || step.factor}
                  <span className="text-blue-300/60">{(step.scopeFraction * 100).toFixed(0)}%</span>
                  {i < drillPath.length - 1 && (
                    <span className="text-content-muted ml-0.5">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { FindingsPanelBase };
