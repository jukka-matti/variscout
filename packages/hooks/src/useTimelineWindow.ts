import { useCallback, useMemo } from 'react';
import type { ProcessHubInvestigation, TimelineWindow } from '@variscout/core';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export interface UseTimelineWindowArgs {
  /**
   * Investigation envelope — only `id` and `metadata.timelineWindow` are read.
   * Pass a stable reference (the actual stored investigation, not a fresh
   * object literal each render); the returned `window` is memoized on
   * `metadata.timelineWindow` identity, so a new object every render makes
   * the memo thrash.
   */
  investigation: Pick<ProcessHubInvestigation, 'id' | 'metadata'>;
  /**
   * Persistence callback. Caller wires this to its existing
   * `persistInvestigation` flow (see apps/azure/src/features/processHub/
   * useHubMigrationState.ts for the canonical pattern). Receives
   * `investigationId` so the same callback can serve many investigations.
   */
  onChange: (investigationId: string, window: TimelineWindow) => void;
}

export interface UseTimelineWindowResult {
  window: TimelineWindow;
  setWindow: (window: TimelineWindow) => void;
}

export function useTimelineWindow({
  investigation,
  onChange,
}: UseTimelineWindowArgs): UseTimelineWindowResult {
  const window = useMemo<TimelineWindow>(
    () => investigation.metadata?.timelineWindow ?? DEFAULT_CUMULATIVE,
    [investigation.metadata?.timelineWindow]
  );

  const setWindow = useCallback(
    (w: TimelineWindow) => onChange(investigation.id, w),
    [investigation.id, onChange]
  );

  return { window, setWindow };
}
