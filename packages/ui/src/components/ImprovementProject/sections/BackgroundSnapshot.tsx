import React from 'react';
import { shouldShowDrift } from '@variscout/core/improvementProject';

export interface BackgroundSnapshotProps {
  snapshot?: { value: string; sourceHash: string; snapshottedAt?: string };
  current?: { value: string; hash: string };
  onRefreshFromLive?: (nextSnapshot: NonNullable<BackgroundSnapshotProps['snapshot']>) => void;
}

export const BackgroundSnapshot: React.FC<BackgroundSnapshotProps> = ({
  snapshot,
  current,
  onRefreshFromLive,
}) => {
  const hasDrift =
    snapshot !== undefined && current !== undefined && shouldShowDrift(snapshot, current);
  const canRefresh = hasDrift && onRefreshFromLive !== undefined && current !== undefined;

  return (
    <div className="space-y-3 rounded-md border border-edge bg-surface-secondary p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-content">Auto snapshot</h3>
          {snapshot?.snapshottedAt ? (
            <p className="text-xs text-content/60">Captured {snapshot.snapshottedAt}</p>
          ) : null}
        </div>

        {hasDrift ? (
          <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
            Live source changed
          </span>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap text-sm text-content">
        {snapshot?.value ?? 'No background snapshot captured.'}
      </p>

      {canRefresh ? (
        <button
          type="button"
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/20"
          onClick={() =>
            onRefreshFromLive({
              value: current.value,
              sourceHash: current.hash,
              snapshottedAt: new Date().toISOString(),
            })
          }
        >
          Refresh from live
        </button>
      ) : null}
    </div>
  );
};
