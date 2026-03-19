import React, { useEffect, useState, useCallback } from 'react';
import type { IdeaEffort, IdeaDirection, ImprovementIdea } from '@variscout/core';
import { ImprovementWorkspaceBase } from '@variscout/ui';

/**
 * Storage keys for cross-window data sync (mirrors FindingsWindow pattern).
 */
export const IMPROVEMENT_SYNC_KEY = 'variscout_improvement_sync';
export const IMPROVEMENT_ACTION_KEY = 'variscout_improvement_action';

export interface ImprovementSyncData {
  synthesis?: string;
  hypotheses: Array<{
    id: string;
    text: string;
    causeRole?: 'primary' | 'contributing';
    factor?: string;
    ideas: ImprovementIdea[];
    linkedFindingName?: string;
  }>;
  linkedFindings?: Array<{ id: string; text: string }>;
  selectedIdeaIds: string[];
  convertedIdeaIds: string[];
  targetCpk?: number;
  timestamp: number;
}

export type ImprovementAction =
  | { type: 'synthesis-change'; text: string; timestamp: number }
  | {
      type: 'toggle-select';
      hypothesisId: string;
      ideaId: string;
      selected: boolean;
      timestamp: number;
    }
  | {
      type: 'update-effort';
      hypothesisId: string;
      ideaId: string;
      effort: IdeaEffort | undefined;
      timestamp: number;
    }
  | {
      type: 'update-direction';
      hypothesisId: string;
      ideaId: string;
      direction: IdeaDirection | undefined;
      timestamp: number;
    }
  | { type: 'remove-idea'; hypothesisId: string; ideaId: string; timestamp: number }
  | { type: 'add-idea'; hypothesisId: string; text: string; timestamp: number }
  | { type: 'convert-to-actions'; timestamp: number };

/**
 * Standalone improvement window for dual-screen setups.
 *
 * Rendered when the URL contains ?view=improvement.
 * Receives data from the main window via localStorage sync.
 *
 * Communication pattern (same as FindingsWindow):
 * 1. Main window writes data to localStorage under IMPROVEMENT_SYNC_KEY
 * 2. This window listens for storage events and updates its state
 * 3. Actions are sent back via IMPROVEMENT_ACTION_KEY
 */
const ImprovementWindow: React.FC = () => {
  const [syncData, setSyncData] = useState<ImprovementSyncData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(IMPROVEMENT_SYNC_KEY);
      if (stored) {
        setSyncData(JSON.parse(stored) as ImprovementSyncData);
      } else {
        setError('No data available. Please open from the main VariScout window.');
      }
    } catch {
      setError('Failed to load data from main window.');
    }
  }, []);

  // Listen for storage updates from main window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === IMPROVEMENT_SYNC_KEY && e.newValue) {
        try {
          setSyncData(JSON.parse(e.newValue) as ImprovementSyncData);
          setError(null);
        } catch (err) {
          console.error('Failed to parse improvement sync data:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /** Send an action to the main window via localStorage */
  const sendAction = useCallback((action: ImprovementAction) => {
    localStorage.setItem(IMPROVEMENT_ACTION_KEY, JSON.stringify(action));
  }, []);

  const handleSynthesisChange = useCallback(
    (text: string) => {
      sendAction({ type: 'synthesis-change', text, timestamp: Date.now() });
      setSyncData(prev => (prev ? { ...prev, synthesis: text, timestamp: Date.now() } : prev));
    },
    [sendAction]
  );

  const handleToggleSelect = useCallback(
    (hypothesisId: string, ideaId: string, selected: boolean) => {
      sendAction({ type: 'toggle-select', hypothesisId, ideaId, selected, timestamp: Date.now() });
      setSyncData(prev => {
        if (!prev) return prev;
        const selectedSet = new Set(prev.selectedIdeaIds);
        if (selected) selectedSet.add(ideaId);
        else selectedSet.delete(ideaId);
        return {
          ...prev,
          selectedIdeaIds: Array.from(selectedSet),
          hypotheses: prev.hypotheses.map(h =>
            h.id === hypothesisId
              ? {
                  ...h,
                  ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, selected } : i)),
                }
              : h
          ),
          timestamp: Date.now(),
        };
      });
    },
    [sendAction]
  );

  const handleUpdateEffort = useCallback(
    (hypothesisId: string, ideaId: string, effort: IdeaEffort | undefined) => {
      sendAction({ type: 'update-effort', hypothesisId, ideaId, effort, timestamp: Date.now() });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hypotheses: prev.hypotheses.map(h =>
            h.id === hypothesisId
              ? { ...h, ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, effort } : i)) }
              : h
          ),
          timestamp: Date.now(),
        };
      });
    },
    [sendAction]
  );

  const handleUpdateDirection = useCallback(
    (hypothesisId: string, ideaId: string, direction: IdeaDirection | undefined) => {
      sendAction({
        type: 'update-direction',
        hypothesisId,
        ideaId,
        direction,
        timestamp: Date.now(),
      });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hypotheses: prev.hypotheses.map(h =>
            h.id === hypothesisId
              ? { ...h, ideas: h.ideas.map(i => (i.id === ideaId ? { ...i, direction } : i)) }
              : h
          ),
          timestamp: Date.now(),
        };
      });
    },
    [sendAction]
  );

  const handleRemoveIdea = useCallback(
    (hypothesisId: string, ideaId: string) => {
      sendAction({ type: 'remove-idea', hypothesisId, ideaId, timestamp: Date.now() });
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hypotheses: prev.hypotheses.map(h =>
            h.id === hypothesisId ? { ...h, ideas: h.ideas.filter(i => i.id !== ideaId) } : h
          ),
          selectedIdeaIds: prev.selectedIdeaIds.filter(id => id !== ideaId),
          timestamp: Date.now(),
        };
      });
    },
    [sendAction]
  );

  const handleAddIdea = useCallback(
    (hypothesisId: string, text: string) => {
      sendAction({ type: 'add-idea', hypothesisId, text, timestamp: Date.now() });
      // Optimistic add with temp ID — will be reconciled on next sync
      setSyncData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hypotheses: prev.hypotheses.map(h =>
            h.id === hypothesisId
              ? {
                  ...h,
                  ideas: [
                    ...h.ideas,
                    {
                      id: `tmp-${Date.now()}`,
                      text,
                      selected: false,
                      createdAt: new Date().toISOString(),
                    } as ImprovementIdea,
                  ],
                }
              : h
          ),
          timestamp: Date.now(),
        };
      });
    },
    [sendAction]
  );

  const handleConvertToActions = useCallback(() => {
    sendAction({ type: 'convert-to-actions', timestamp: Date.now() });
  }, [sendAction]);

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

  return (
    <div className="h-screen w-screen bg-surface">
      <ImprovementWorkspaceBase
        synthesis={syncData.synthesis}
        onSynthesisChange={handleSynthesisChange}
        hypotheses={syncData.hypotheses}
        linkedFindings={syncData.linkedFindings}
        onToggleSelect={handleToggleSelect}
        onUpdateEffort={handleUpdateEffort}
        onUpdateDirection={handleUpdateDirection}
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
 * Writes sync data to localStorage, then opens a new window with ?view=improvement.
 */
export function openImprovementPopout(data: ImprovementSyncData): Window | null {
  localStorage.setItem(IMPROVEMENT_SYNC_KEY, JSON.stringify(data));

  const url = `${window.location.origin}${window.location.pathname}?view=improvement`;
  return window.open(
    url,
    'variscout-improvement',
    'width=960,height=700,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );
}

/**
 * Update the improvement popout with new data.
 */
export function updateImprovementPopout(data: ImprovementSyncData): void {
  localStorage.setItem(IMPROVEMENT_SYNC_KEY, JSON.stringify(data));
}
