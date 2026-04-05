import React, { useEffect, useState, useCallback } from 'react';
import {
  useTranslation,
  usePopoutChannel,
  writeHydrationData,
  HYDRATION_KEYS,
} from '@variscout/hooks';
import type {
  FindingsSyncData,
  FindingsAction,
  FindingsSyncMessage,
  FindingsActionMessage,
  DrillStep,
} from '@variscout/hooks';
import { formatForMobile } from '@variscout/core/ai';
import { ClipboardCopy, Check, List, LayoutGrid, Copy } from 'lucide-react';
import { useIsMobile } from '../../hooks';
import type {
  Finding,
  FindingStatus,
  FindingTag,
  Question,
  ProcessContext,
  InvestigationPhase,
} from '@variscout/core';
import FindingsLog from '../FindingsLog/FindingsLog';
import FindingBoardColumns from '../FindingsLog/FindingBoardColumns';
import { copyFindingsToClipboard } from '../FindingsLog/export';
import BriefHeader from '../FindingsPanel/BriefHeader';
import FindingDetailPanel from '../FindingsPanel/FindingDetailPanel';
import { InvestigationPhaseBadge } from '../InvestigationPhaseBadge';
import { InvestigationSidebar } from './InvestigationSidebar';

/**
 * Standalone findings window for dual-screen setups.
 *
 * Rendered when the URL contains ?view=findings.
 * Receives findings from the main window via BroadcastChannel (usePopoutChannel).
 *
 * Communication pattern:
 * 1. Main window writes hydration data to localStorage, then opens this window
 * 2. This window reads hydration data on mount via usePopoutChannel
 * 3. Ongoing sync via BroadcastChannel messages (FindingsSyncMessage)
 * 4. Edit/delete actions sent back via BroadcastChannel (FindingsActionMessage)
 */
const FindingsWindow: React.FC = () => {
  const { t, formatStat } = useTranslation();
  const isMobile = useIsMobile();

  const { lastMessage, sendMessage, hydrationData } = usePopoutChannel<
    FindingsSyncMessage | FindingsActionMessage
  >({
    windowId: 'findings',
    hydrationKey: HYDRATION_KEYS.findings,
  });

  const [syncData, setSyncData] = useState<FindingsSyncData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('variscout_findings_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('variscout_findings_sidebar_collapsed', next ? '1' : '');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Initialize from hydration data (localStorage snapshot written before popup opened)
  useEffect(() => {
    if (hydrationData) {
      setSyncData(hydrationData as FindingsSyncData);
    } else {
      setError('No data available. Please open from the main VariScout window.');
    }
  }, [hydrationData]);

  // Listen for ongoing sync via BroadcastChannel
  useEffect(() => {
    if (lastMessage?.type === 'findings-sync') {
      setSyncData((lastMessage as FindingsSyncMessage).payload);
      setError(null);
    }
  }, [lastMessage]);

  /** Send an action to the main window via BroadcastChannel */
  const sendAction = useCallback(
    (action: FindingsAction) => {
      sendMessage({
        type: 'findings-action',
        target: 'main',
        payload: action,
      } as Omit<FindingsActionMessage, 'source'>);
    },
    [sendMessage]
  );

  // Edit finding
  const handleEditFinding = useCallback(
    (id: string, text: string) => {
      sendAction({ action: 'edit', id, text });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f => (f.id === id ? { ...f, text } : f)),
        };
      });
    },
    [sendAction]
  );

  // Delete finding
  const handleDeleteFinding = useCallback(
    (id: string) => {
      sendAction({ action: 'delete', id });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.filter(f => f.id !== id),
        };
      });
    },
    [sendAction]
  );

  // Set finding status
  const handleSetStatus = useCallback(
    (id: string, status: FindingStatus) => {
      sendAction({ action: 'set-status', id, status });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f =>
            f.id === id ? { ...f, status, statusChangedAt: Date.now() } : f
          ),
        };
      });
    },
    [sendAction]
  );

  // Set finding tag
  const handleSetTag = useCallback(
    (id: string, tag: FindingTag | null) => {
      sendAction({ action: 'set-tag', id, tag });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f => (f.id === id ? { ...f, tag: tag ?? undefined } : f)),
        };
      });
    },
    [sendAction]
  );

  // Add comment
  const handleAddComment = useCallback(
    (id: string, text: string) => {
      sendAction({ action: 'add-comment', id, text });
      // Optimistic: append a comment locally
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f =>
            f.id === id
              ? {
                  ...f,
                  comments: [
                    ...f.comments,
                    { id: `tmp-${Date.now()}`, text, createdAt: Date.now() },
                  ],
                }
              : f
          ),
        };
      });
    },
    [sendAction]
  );

  // Edit comment
  const handleEditComment = useCallback(
    (findingId: string, commentId: string, text: string) => {
      sendAction({ action: 'edit-comment', id: findingId, commentId, text });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f =>
            f.id === findingId
              ? {
                  ...f,
                  comments: f.comments.map(c => (c.id === commentId ? { ...c, text } : c)),
                }
              : f
          ),
        };
      });
    },
    [sendAction]
  );

  // Delete comment
  const handleDeleteComment = useCallback(
    (findingId: string, commentId: string) => {
      sendAction({ action: 'delete-comment', id: findingId, commentId });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map(f =>
            f.id === findingId ? { ...f, comments: f.comments.filter(c => c.id !== commentId) } : f
          ),
        };
      });
    },
    [sendAction]
  );

  // Restore finding (no-op in popout — navigate happens in main window)
  const handleRestoreFinding = useCallback(() => {
    // Restoring filters only makes sense in the main window
  }, []);

  // Copy all findings
  const handleCopyAll = useCallback(async () => {
    if (!syncData) return;
    const ok = await copyFindingsToClipboard(syncData.findings, syncData.columnAliases);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [syncData]);

  // Handle finding card click in board → open detail
  const handleFindingClick = useCallback((id: string) => {
    setSelectedFindingId(prev => (prev === id ? null : id));
  }, []);

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-surface flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">:(</div>
          <h1 className="text-xl font-bold text-content mb-2">No Connection</h1>
          <p className="text-content-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!syncData) {
    return (
      <div className="h-screen w-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-content-secondary">Loading...</div>
      </div>
    );
  }

  const {
    findings,
    columnAliases,
    drillPath,
    treeQuestions,
    processContext,
    currentValue,
    investigationPhase,
    suggestedQuestions,
    factorRoles,
    aiAvailable,
    questions,
    issueStatement: syncIssueStatement,
    suggestedIssueStatement,
    problemStatement,
    isProblemStatementComplete,
  } = syncData;
  const selectedFinding = selectedFindingId
    ? (findings.find(f => f.id === selectedFindingId) ?? null)
    : null;

  // Determine layout based on window width
  const isWide = typeof window !== 'undefined' && window.innerWidth > 1200;

  return (
    <div className="h-screen w-screen bg-surface flex flex-col">
      {/* Zone 1: Brief Header */}
      <BriefHeader
        processContext={processContext}
        questions={treeQuestions}
        currentValue={currentValue}
        projectedValue={syncData.projectedValue}
      />

      {/* Header bar */}
      <div className="flex-shrink-0 border-b border-edge">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-content">
              {t('panel.investigation')}
              {findings.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] bg-blue-500/20 text-blue-400 rounded">
                  {findings.length}
                </span>
              )}
            </h1>
            {investigationPhase && <InvestigationPhaseBadge phase={investigationPhase} />}
          </div>

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
                  title={t('view.list')}
                  aria-label={t('view.list')}
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
                  title={t('view.board')}
                  aria-label={t('view.board')}
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
                title={t('action.copyAll')}
                aria-label={t('action.copyAll')}
              >
                {copyFeedback ? <Check size={14} /> : <ClipboardCopy size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Suggested question chips — click copies to clipboard */}
        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div
            className="overflow-x-auto flex gap-1.5 px-4 pb-2"
            data-testid="popout-suggested-questions"
          >
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                data-testid={`popout-suggestion-${i}`}
                onClick={() => {
                  navigator.clipboard.writeText(q).catch(() => {});
                }}
                className="inline-flex items-center gap-1 bg-surface-tertiary text-content-secondary text-[0.625rem] px-2.5 py-1 whitespace-nowrap rounded-full hover:bg-surface-tertiary/80 hover:text-content transition-colors flex-shrink-0"
                title="Copy to clipboard"
              >
                {isMobile ? formatForMobile(q) : q}
                <Copy size={8} className="opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone 2 + Zone 3: Board + Detail Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Zone 2: Board or list */}
        <div className={`flex-1 overflow-hidden ${isWide && selectedFinding ? 'w-[60%]' : ''}`}>
          {viewMode === 'board' && findings.length > 0 ? (
            <FindingBoardColumns
              findings={findings}
              onEditFinding={handleEditFinding}
              onDeleteFinding={handleDeleteFinding}
              onRestoreFinding={handleFindingClick}
              onSetFindingStatus={handleSetStatus}
              onSetFindingTag={handleSetTag}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              columnAliases={columnAliases}
              activeFindingId={selectedFindingId}
            />
          ) : (
            <FindingsLog
              findings={findings}
              onEditFinding={handleEditFinding}
              onDeleteFinding={handleDeleteFinding}
              onRestoreFinding={handleFindingClick}
              onSetFindingStatus={handleSetStatus}
              onSetFindingTag={handleSetTag}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              columnAliases={columnAliases}
              activeFindingId={selectedFindingId}
              viewMode="list"
            />
          )}
        </div>

        {/* Zone 3: Detail Panel */}
        {selectedFinding && (
          <div className={isWide ? 'w-[40%]' : 'absolute inset-0'}>
            <FindingDetailPanel
              finding={selectedFinding}
              onClose={() => setSelectedFindingId(null)}
              columnAliases={columnAliases}
              compact={!isWide}
              onEditFinding={handleEditFinding}
              onDeleteFinding={handleDeleteFinding}
              onRestoreFinding={handleRestoreFinding}
              onSetFindingStatus={handleSetStatus}
              onSetFindingTag={handleSetTag}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>
        )}

        {/* Zone 4: Investigation Sidebar (AI-enabled only) */}
        {aiAvailable && (
          <InvestigationSidebar
            phase={investigationPhase}
            treeQuestions={treeQuestions}
            factorRoles={factorRoles}
            suggestedQuestions={suggestedQuestions}
            collapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
            questions={questions}
            issueStatement={syncIssueStatement}
            suggestedIssueStatement={suggestedIssueStatement}
            problemStatement={problemStatement}
            isProblemStatementComplete={isProblemStatementComplete}
          />
        )}
      </div>

      {/* Drill path footer */}
      {drillPath.length > 0 && (
        <div className="px-4 py-3 border-t border-edge flex-shrink-0">
          <div className="text-[0.625rem] text-content-muted uppercase tracking-wider mb-1.5">
            {t('panel.drillPath')}
          </div>
          <div className="flex flex-wrap gap-1">
            {drillPath.map((step, i) => (
              <span
                key={step.factor}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[0.6875rem] rounded-full"
              >
                {columnAliases?.[step.factor] || step.factor}
                <span className="text-blue-300/60">{formatStat(step.scopeFraction * 100, 0)}%</span>
                {i < drillPath.length - 1 && (
                  <span className="text-content-muted ml-0.5">&rarr;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindingsWindow;

/**
 * Open the findings in a popout window.
 * Writes hydration data to localStorage, then opens a new window with ?view=findings.
 * Ongoing sync happens via BroadcastChannel (usePopoutChannel).
 */
export interface PopoutSyncOptions {
  findings: Finding[];
  columnAliases?: Record<string, string>;
  drillPath?: DrillStep[];
  treeQuestions?: Question[];
  processContext?: ProcessContext;
  currentValue?: number;
  projectedValue?: number;
  investigationPhase?: InvestigationPhase;
  suggestedQuestions?: string[];
  factorRoles?: Record<string, string>;
  aiAvailable?: boolean;
  questions?: Question[];
  issueStatement?: string;
  suggestedIssueStatement?: string;
  problemStatement?: string;
  isProblemStatementComplete?: boolean;
}

function buildSyncData(
  findings: Finding[],
  columnAliases?: Record<string, string>,
  drillPath?: DrillStep[],
  options?: Omit<PopoutSyncOptions, 'findings' | 'columnAliases' | 'drillPath'>
): FindingsSyncData {
  return {
    findings,
    columnAliases,
    drillPath: drillPath ?? [],
    treeQuestions: options?.treeQuestions,
    processContext: options?.processContext,
    currentValue: options?.currentValue,
    projectedValue: options?.projectedValue,
    investigationPhase: options?.investigationPhase,
    suggestedQuestions: options?.suggestedQuestions,
    factorRoles: options?.factorRoles,
    aiAvailable: options?.aiAvailable,
    questions: options?.questions,
    issueStatement: options?.issueStatement,
    suggestedIssueStatement: options?.suggestedIssueStatement,
    problemStatement: options?.problemStatement,
    isProblemStatementComplete: options?.isProblemStatementComplete,
  };
}

export function openFindingsPopout(
  findings: Finding[],
  columnAliases?: Record<string, string>,
  drillPath?: DrillStep[],
  options?: Omit<PopoutSyncOptions, 'findings' | 'columnAliases' | 'drillPath'>
): Window | null {
  const syncData = buildSyncData(findings, columnAliases, drillPath, options);

  // Write hydration snapshot for the popout to read on mount
  writeHydrationData(HYDRATION_KEYS.findings, syncData);

  const url = `${window.location.origin}${window.location.pathname}?view=findings`;
  const popup = window.open(
    url,
    'variscout-findings',
    'width=960,height=700,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );

  return popup;
}

/**
 * Update the findings popout with new data (call on every findings/drillPath change).
 * Sends a BroadcastChannel message — the popout listens via usePopoutChannel.
 */
export function updateFindingsPopout(
  findings: Finding[],
  columnAliases?: Record<string, string>,
  drillPath?: DrillStep[],
  options?: Omit<PopoutSyncOptions, 'findings' | 'columnAliases' | 'drillPath'>
): void {
  const syncData = buildSyncData(findings, columnAliases, drillPath, options);

  try {
    const channel = new BroadcastChannel('variscout-sync');
    channel.postMessage({
      type: 'findings-sync',
      source: 'main',
      payload: syncData,
    } satisfies FindingsSyncMessage);
    channel.close();
  } catch {
    // BroadcastChannel not available — silently ignore
  }
}
