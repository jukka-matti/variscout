import React, { useEffect, useState, useCallback } from 'react';
import type { IdeaTimeframe, IdeaDirection, IdeaCostCategory } from '@variscout/core';
import { ImprovementWorkspaceBase } from '@variscout/ui';
import { usePopoutChannel, writeHydrationData, HYDRATION_KEYS } from '@variscout/hooks';
import type {
  ImprovementSyncData,
  ImprovementSyncMessage,
  ImprovementActionMessage,
  ImprovementAction,
} from '@variscout/hooks';

/**
 * Standalone improvement window for dual-screen setups.
 *
 * Rendered when the URL contains ?view=improvement.
 * Receives data from the main window via BroadcastChannel (usePopoutChannel).
 *
 * Communication pattern (same as FindingsWindow):
 * 1. Main window writes hydration data to localStorage, then opens this window
 * 2. This window reads hydration data on mount via usePopoutChannel
 * 3. Ongoing sync via BroadcastChannel messages (ImprovementSyncMessage)
 * 4. Actions sent back via BroadcastChannel (ImprovementActionMessage)
 */
const ImprovementWindow: React.FC = () => {
  const { lastMessage, sendMessage, hydrationData } = usePopoutChannel<
    ImprovementSyncMessage | ImprovementActionMessage
  >({
    windowId: 'improvement',
    hydrationKey: HYDRATION_KEYS.improvement,
  });

  const [syncData, setSyncData] = useState<ImprovementSyncData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize from hydration data (localStorage snapshot written before popup opened)
  useEffect(() => {
    if (hydrationData) {
      setSyncData(hydrationData as ImprovementSyncData);
    } else {
      setError('No data available. Please open from the main VariScout window.');
    }
  }, [hydrationData]);

  // Listen for ongoing sync via BroadcastChannel
  useEffect(() => {
    if (lastMessage?.type === 'improvement-sync') {
      setSyncData((lastMessage as ImprovementSyncMessage).payload);
      setError(null);
    }
  }, [lastMessage]);

  /** Send an action to the main window via BroadcastChannel */
  const sendAction = useCallback(
    (action: ImprovementAction) => {
      sendMessage({
        type: 'improvement-action',
        target: 'main',
        payload: action,
      } as Omit<ImprovementActionMessage, 'source'>);
    },
    [sendMessage]
  );

  const handleSynthesisChange = useCallback(
    (text: string) => {
      sendAction({ action: 'synthesis-change', text });
      setSyncData(prev => (prev ? { ...prev, synthesis: text } : prev));
    },
    [sendAction]
  );

  const handleToggleSelect = useCallback(
    (questionId: string, ideaId: string, selected: boolean) => {
      sendAction({ action: 'toggle-select', questionId, ideaId, selected });
      setSyncData(prev => {
        if (!prev) return prev;
        const selectedSet = new Set(prev.selectedIdeaIds);
        if (selected) selectedSet.add(ideaId);
        else selectedSet.delete(ideaId);
        return {
          ...prev,
          selectedIdeaIds: Array.from(selectedSet),
          questions: prev.questions.map(h =>
            h.id === questionId
              ? {
                  ...h,
                  ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
                }
              : h
          ),
        };
      });
    },
    [sendAction]
  );

  const handleUpdateTimeframe = useCallback(
    (questionId: string, ideaId: string, timeframe: IdeaTimeframe | undefined) => {
      sendAction({
        action: 'update-timeframe',
        questionId,
        ideaId,
        timeframe,
      });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(h =>
            h.id === questionId
              ? { ...h, ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, timeframe } : i)) }
              : h
          ),
        };
      });
    },
    [sendAction]
  );

  const handleUpdateDirection = useCallback(
    (questionId: string, ideaId: string, direction: IdeaDirection | undefined) => {
      sendAction({
        action: 'update-direction',
        questionId,
        ideaId,
        direction,
      });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(h =>
            h.id === questionId
              ? { ...h, ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, direction } : i)) }
              : h
          ),
        };
      });
    },
    [sendAction]
  );

  const handleUpdateCost = useCallback(
    (questionId: string, ideaId: string, cost: { category: IdeaCostCategory } | undefined) => {
      sendAction({
        action: 'update-cost',
        questionId,
        ideaId,
        cost,
      });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(h =>
            h.id === questionId
              ? { ...h, ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, cost } : i)) }
              : h
          ),
        };
      });
    },
    [sendAction]
  );

  const handleRemoveIdea = useCallback(
    (questionId: string, ideaId: string) => {
      sendAction({ action: 'remove-idea', questionId, ideaId });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(h =>
            h.id === questionId ? { ...h, ideas: h.ideas.filter(i => i.id !== ideaId) } : h
          ),
          selectedIdeaIds: prev.selectedIdeaIds.filter(id => id !== ideaId),
        };
      });
    },
    [sendAction]
  );

  const handleAddIdea = useCallback(
    (questionId: string, text: string) => {
      sendAction({ action: 'add-idea', questionId, text });
      // Optimistic add with temp ID — will be reconciled on next sync
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(h =>
            h.id === questionId
              ? {
                  ...h,
                  ideas: [
                    ...h.ideas,
                    {
                      id: `tmp-${Date.now()}`,
                      text,
                      selected: false,
                      createdAt: Date.now(),
                      deletedAt: null,
                    },
                  ],
                }
              : h
          ),
        };
      });
    },
    [sendAction]
  );

  const handleConvertToActions = useCallback(() => {
    sendAction({ action: 'convert-to-actions' });
  }, [sendAction]);

  // Error state
  if (error) {
    return (
      <div className="h-dvh w-screen bg-surface flex items-center justify-center p-8">
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
      <div className="h-dvh w-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-content-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-screen bg-surface">
      <ImprovementWorkspaceBase
        synthesis={syncData.synthesis}
        onSynthesisChange={handleSynthesisChange}
        questions={syncData.questions}
        linkedFindings={syncData.linkedFindings}
        onToggleSelect={handleToggleSelect}
        onUpdateTimeframe={handleUpdateTimeframe}
        onUpdateDirection={handleUpdateDirection}
        onUpdateCost={handleUpdateCost}
        onRemoveIdea={handleRemoveIdea}
        onAddIdea={handleAddIdea}
        onConvertToActions={handleConvertToActions}
        selectedIdeaIds={new Set(syncData.selectedIdeaIds)}
        convertedIdeaIds={new Set(syncData.convertedIdeaIds)}
        targetCpk={syncData.targetCpk}
      />
    </div>
  );
};

export default ImprovementWindow;

/**
 * Open the improvement workspace in a popout window.
 * Writes hydration data to localStorage, then opens a new window with ?view=improvement.
 * Ongoing sync happens via BroadcastChannel (usePopoutChannel).
 */
export function openImprovementPopout(data: ImprovementSyncData): Window | null {
  writeHydrationData(HYDRATION_KEYS.improvement, data);

  const url = `${window.location.origin}${window.location.pathname}?view=improvement`;
  return window.open(
    url,
    'variscout-improvement',
    'width=960,height=700,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );
}

/**
 * Update the improvement popout with new data (call on every data change).
 * Sends a BroadcastChannel message — the popout listens via usePopoutChannel.
 */
export function updateImprovementPopout(data: ImprovementSyncData): void {
  try {
    const channel = new BroadcastChannel('variscout-sync');
    channel.postMessage({
      type: 'improvement-sync',
      source: 'main',
      payload: data,
    } satisfies ImprovementSyncMessage);
    channel.close();
  } catch {
    // BroadcastChannel not available — silently ignore
  }
}
