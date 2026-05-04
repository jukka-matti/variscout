import type { EvidenceSnapshot } from '@variscout/core';

export interface SnapshotTimelineStripProps {
  allSnapshots: EvidenceSnapshot[];
  newSnapshotIds: Set<string>;
}

export function SnapshotTimelineStrip({
  allSnapshots,
  newSnapshotIds,
}: SnapshotTimelineStripProps) {
  if (allSnapshots.length === 0) return null;

  let min = Infinity;
  let max = -Infinity;
  for (const s of allSnapshots) {
    const t = new Date(s.capturedAt).getTime();
    if (Number.isFinite(t)) {
      if (t < min) min = t;
      if (t > max) max = t;
    }
  }
  const span = max - min || 1;

  return (
    <div
      className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded my-1 w-full max-w-md"
      data-testid="snapshot-timeline-strip"
    >
      {allSnapshots.map(snap => {
        const t = new Date(snap.capturedAt).getTime();
        if (!Number.isFinite(t)) return null;
        const left = ((t - min) / span) * 100;
        const isNew = newSnapshotIds.has(snap.id);
        return (
          <div
            key={snap.id}
            data-testid={`snapshot-segment-${snap.id}`}
            className={`absolute top-0 bottom-0 w-1 rounded-sm ${isNew ? 'bg-green-400' : 'bg-gray-400'}`}
            style={{ left: `calc(${left}% - 2px)` }}
            title={snap.capturedAt}
          />
        );
      })}
    </div>
  );
}
