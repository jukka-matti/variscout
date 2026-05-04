import { useEffect, useState, useCallback } from 'react';
import { listEvidenceSnapshotsFromCloud } from '../../services/cloudSync';
import { db } from '../../db/schema';
import type { EvidenceSnapshot } from '@variscout/core';

export interface NewSnapshotsState {
  /** Number of snapshots that arrived since lastSeenAt cursor. */
  newCount: number;
  /** IDs of those new snapshots, ordered by capturedAt asc. */
  newSnapshotIds: string[];
  /** When the user dismisses (clicks the chip), call markSeen() to advance the cursor. */
  markSeen: () => Promise<void>;
  /** The new snapshots themselves (for UI rendering of timeline strip etc.). */
  newSnapshots: EvidenceSnapshot[];
  /** Latest column-drift message if any new snapshot has derived columns the first didn't. */
  columnDriftMessage?: string;
  /** True while a sync is in flight. */
  isLoading: boolean;
}

const NOOP = async () => undefined;

export function useEvidenceSourceSync(
  hubId: string,
  sourceId: string,
  token: string | undefined
): NewSnapshotsState {
  const [newSnapshots, setNewSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [columnDriftMessage, setColumnDriftMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setNewSnapshots([]);
      setColumnDriftMessage(undefined);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const cursor = await db.evidenceSourceCursors.get([hubId, sourceId]);
        const cloudSnapshots = await listEvidenceSnapshotsFromCloud(token, hubId, sourceId);
        if (cancelled) return;
        const cursorTime = cursor ? new Date(cursor.lastSeenAt).getTime() : -Infinity;
        const filtered = cloudSnapshots
          .filter(s => new Date(s.capturedAt).getTime() > cursorTime)
          .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
        setNewSnapshots(filtered);
        setColumnDriftMessage(detectColumnDrift(filtered));
      } catch {
        // Quiet failure — telemetry is logged at the cloudSync layer.
        // No PII allowed in App Insights.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hubId, sourceId, token]);

  const markSeen = useCallback(async () => {
    if (newSnapshots.length === 0) return;
    const latest = newSnapshots[newSnapshots.length - 1];
    await db.evidenceSourceCursors.put({
      hubId,
      sourceId,
      lastSeenSnapshotId: latest.id,
      lastSeenAt: latest.capturedAt,
    });
    setNewSnapshots([]);
    setColumnDriftMessage(undefined);
  }, [newSnapshots, hubId, sourceId]);

  return {
    newCount: newSnapshots.length,
    newSnapshotIds: newSnapshots.map(s => s.id),
    newSnapshots,
    markSeen: token ? markSeen : NOOP,
    columnDriftMessage,
    isLoading,
  };
}

/**
 * Inspect the new snapshots' profileApplication.derivedColumns and detect
 * columns that appear in a later snapshot but not in earlier ones. V1 returns
 * a single one-line message naming the first new derived column found. V2
 * detail per spec §6.3.
 *
 * Note: EvidenceSnapshot.profileApplication has shape { derivedColumns: string[] }
 * (not a nested profile.columns object). The mapping keys (source columns) are
 * tracked separately; here we track derived output columns as the drift signal
 * since those are what the processing pipeline exposes at the snapshot level.
 */
function detectColumnDrift(snapshots: readonly EvidenceSnapshot[]): string | undefined {
  const seen = new Set<string>();
  for (const snap of snapshots) {
    const cols = snap.profileApplication?.derivedColumns ?? [];
    for (const col of cols) {
      if (seen.size > 0 && !seen.has(col)) {
        return `Snapshot ${snap.id} introduced new column "${col}" — review map?`;
      }
      seen.add(col);
    }
  }
  return undefined;
}
