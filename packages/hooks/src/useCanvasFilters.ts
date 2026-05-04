import { useCallback, useMemo } from 'react';
import type {
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
  ScopeFilter,
  TimelineWindow,
} from '@variscout/core';

const DEFAULT_CUMULATIVE: TimelineWindow = { kind: 'cumulative' };

export interface UseCanvasFiltersArgs {
  /**
   * Investigation envelope — only `id` and `metadata` (timelineWindow, scopeFilter,
   * paretoGroupBy) are read. Pass a stable reference (the actual stored investigation,
   * not a fresh object literal each render); returned values are memoized on the
   * relevant metadata identity.
   */
  investigation: Pick<ProcessHubInvestigation, 'id' | 'metadata'>;
  /**
   * Persistence callback. Receives `investigationId` and the new metadata patch.
   * Caller wires this to its existing persist-investigation-metadata flow.
   * The patch is a Partial<ProcessHubInvestigationMetadata> containing ONLY the
   * field(s) that changed in the last call — so the caller can apply it as a
   * shallow merge over the current metadata.
   */
  onChange: (investigationId: string, patch: Partial<ProcessHubInvestigationMetadata>) => void;
}

export interface UseCanvasFiltersResult {
  /** Current timeline window. Defaults to { kind: 'cumulative' } when unset. */
  timelineWindow: TimelineWindow;
  /** Setter for the timeline window. */
  setTimelineWindow: (window: TimelineWindow) => void;
  /** Current scope filter, or undefined when not set. */
  scopeFilter: ScopeFilter | undefined;
  /** Setter for the scope filter; pass undefined to clear. */
  setScopeFilter: (filter: ScopeFilter | undefined) => void;
  /** Current Pareto group-by column name, or undefined when caller should use default. */
  paretoGroupBy: string | undefined;
  /** Setter for the group-by column; pass undefined to clear. */
  setParetoGroupBy: (factor: string | undefined) => void;
}

export function useCanvasFilters({
  investigation,
  onChange,
}: UseCanvasFiltersArgs): UseCanvasFiltersResult {
  const timelineWindow = useMemo<TimelineWindow>(
    () => investigation.metadata?.timelineWindow ?? DEFAULT_CUMULATIVE,
    [investigation.metadata?.timelineWindow]
  );
  const scopeFilter = useMemo(
    () => investigation.metadata?.scopeFilter,
    [investigation.metadata?.scopeFilter]
  );
  const paretoGroupBy = useMemo(
    () => investigation.metadata?.paretoGroupBy,
    [investigation.metadata?.paretoGroupBy]
  );

  const setTimelineWindow = useCallback(
    (window: TimelineWindow) => onChange(investigation.id, { timelineWindow: window }),
    [investigation.id, onChange]
  );
  const setScopeFilter = useCallback(
    (filter: ScopeFilter | undefined) => onChange(investigation.id, { scopeFilter: filter }),
    [investigation.id, onChange]
  );
  const setParetoGroupBy = useCallback(
    (factor: string | undefined) => onChange(investigation.id, { paretoGroupBy: factor }),
    [investigation.id, onChange]
  );

  return {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
  };
}
