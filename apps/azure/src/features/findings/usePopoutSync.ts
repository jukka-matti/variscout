/**
 * usePopoutSync - Manages findings popout window lifecycle and two-way sync.
 *
 * Extracted from useFindingsOrchestration to keep popout window management
 * (open, update, listen for BroadcastChannel messages) in its own hook.
 *
 * Communication pattern:
 * - Main → Popout: openFindingsPopout (hydration) + updateFindingsPopout (BroadcastChannel)
 * - Popout → Main: FindingsActionMessage via BroadcastChannel, received here via usePopoutChannel
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import type { Finding, Question, ProcessContext } from '@variscout/core';
import type { UseFindingsReturn, DrillStep, FindingsActionMessage } from '@variscout/hooks';
import { usePopoutChannel } from '@variscout/hooks';
import { openFindingsPopout, updateFindingsPopout } from '@variscout/ui';

export interface UsePopoutSyncOptions {
  /** Current findings list */
  findings: Finding[];
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Current drill path for context */
  drillPath: DrillStep[];
  /** Findings CRUD state (for handling actions from popout) */
  findingsState: UseFindingsReturn;
  /** Questions for popout sync */
  questions?: Question[];
  /** Process context for popout sync */
  processContext?: ProcessContext;
  /** Current Cpk or mean value for popout sync */
  currentValue?: number;
  /** Projected metric value from selected improvement ideas */
  projectedValue?: number;
  /** Factor role classifications for sidebar */
  factorRoles?: Record<string, string>;
  /** Whether AI features are available */
  aiAvailable?: boolean;
}

export interface UsePopoutSyncReturn {
  /** Open findings in a popout window */
  handleOpenFindingsPopout: () => void;
}

export function usePopoutSync({
  findings,
  columnAliases,
  drillPath,
  findingsState,
  questions,
  processContext,
  currentValue,
  projectedValue,
  factorRoles,
  aiAvailable,
}: UsePopoutSyncOptions): UsePopoutSyncReturn {
  const popupRef = useRef<Window | null>(null);

  const popoutOptions = useMemo(
    () => ({ questions, processContext, currentValue, projectedValue, factorRoles, aiAvailable }),
    [questions, processContext, currentValue, projectedValue, factorRoles, aiAvailable]
  );

  const handleOpenFindingsPopout = useCallback(() => {
    popupRef.current = openFindingsPopout(findings, columnAliases, drillPath, popoutOptions);
  }, [findings, columnAliases, drillPath, popoutOptions]);

  // Sync popout when findings/drillPath change
  useEffect(() => {
    if (!popupRef.current || popupRef.current.closed) return;
    updateFindingsPopout(findings, columnAliases, drillPath, popoutOptions);
  }, [findings, columnAliases, drillPath, popoutOptions]);

  // Listen for actions from popout window via BroadcastChannel
  const { lastMessage } = usePopoutChannel<FindingsActionMessage>({
    windowId: 'main',
  });

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'findings-action') return;
    const action = (lastMessage as FindingsActionMessage).payload;
    switch (action.action) {
      case 'edit':
        if (action.text !== undefined) findingsState.editFinding(action.id, action.text);
        break;
      case 'delete':
        findingsState.deleteFinding(action.id);
        break;
      case 'set-status':
        if (action.status) findingsState.setFindingStatus(action.id, action.status);
        break;
      case 'set-tag':
        findingsState.setFindingTag(action.id, action.tag ?? null);
        break;
      case 'add-comment':
        if (action.text !== undefined) findingsState.addFindingComment(action.id, action.text);
        break;
      case 'edit-comment':
        if (action.commentId && action.text !== undefined)
          findingsState.editFindingComment(action.id, action.commentId, action.text);
        break;
      case 'delete-comment':
        if (action.commentId) findingsState.deleteFindingComment(action.id, action.commentId);
        break;
    }
  }, [lastMessage, findingsState]);

  return { handleOpenFindingsPopout };
}
