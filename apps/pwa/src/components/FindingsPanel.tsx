import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ClipboardCopy, Check, ExternalLink, List, LayoutGrid } from 'lucide-react';
import type { Finding, FindingStatus } from '@variscout/core';
import type { DrillStep } from '@variscout/hooks';
import { FindingsLog, copyFindingsToClipboard } from '@variscout/ui';

interface FindingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  findings: Finding[];
  onEditFinding: (id: string, text: string) => void;
  onDeleteFinding: (id: string) => void;
  onRestoreFinding: (id: string) => void;
  onSetFindingStatus: (id: string, status: FindingStatus) => void;
  onAddComment: (id: string, text: string) => void;
  onEditComment: (findingId: string, commentId: string, text: string) => void;
  onDeleteComment: (findingId: string, commentId: string) => void;
  columnAliases?: Record<string, string>;
  drillPath: DrillStep[];
  activeFindingId?: string | null;
  /** Open findings in a separate popout window */
  onPopout?: () => void;
}

/**
 * PWA FindingsPanel — fixed overlay + backdrop + slide-in animation.
 * Replaces the old MindmapPanel.
 */
const FindingsPanel: React.FC<FindingsPanelProps> = ({
  isOpen,
  onClose,
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  onSetFindingStatus,
  onAddComment,
  onEditComment,
  onDeleteComment,
  columnAliases,
  drillPath,
  activeFindingId,
  onPopout,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
    };
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-96 bg-surface-secondary border-l border-edge shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-white">
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
                  onClick={() => setViewMode('list')}
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
                  onClick={() => setViewMode('board')}
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
                    : 'text-content-secondary hover:text-white hover:bg-surface-tertiary'
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
                className="hidden sm:inline-flex p-1.5 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Open in separate window"
                aria-label="Open findings in separate window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
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
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          columnAliases={columnAliases}
          activeFindingId={activeFindingId}
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

export default FindingsPanel;
