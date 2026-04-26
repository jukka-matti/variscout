import React, { useEffect, useMemo, useState } from 'react';
import { Database, Upload, ShieldCheck } from 'lucide-react';
import {
  AGENT_REVIEW_LOG_PROFILE,
  parseText,
  type EvidenceSnapshot,
  type EvidenceSource,
} from '@variscout/core';
import { useStorage } from '../services/storage';

interface ProcessHubEvidencePanelProps {
  hubId: string;
  onEvidenceChanged?: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function falseGreenCount(snapshot: EvidenceSnapshot): number {
  return (
    snapshot.profileApplication?.derivedRows.reduce(
      (count, row) => count + (row.FalseGreen === 1 ? 1 : 0),
      0
    ) ?? 0
  );
}

const ProcessHubEvidencePanel: React.FC<ProcessHubEvidencePanelProps> = ({
  hubId,
  onEvidenceChanged,
}) => {
  const { listEvidenceSources, saveEvidenceSource, listEvidenceSnapshots, saveEvidenceSnapshot } =
    useStorage();
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [snapshots, setSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const selectedSource = useMemo(
    () => sources.find(source => source.id === selectedSourceId),
    [selectedSourceId, sources]
  );
  const latestSnapshot = snapshots[0];

  const refresh = async (): Promise<void> => {
    const nextSources = await listEvidenceSources(hubId);
    setSources(nextSources);
    const nextSourceId = selectedSourceId || nextSources[0]?.id || '';
    setSelectedSourceId(nextSourceId);
    if (nextSourceId) {
      setSnapshots(await listEvidenceSnapshots(hubId, nextSourceId));
    } else {
      setSnapshots([]);
    }
  };

  useEffect(() => {
    refresh().catch(() => setStatus('Evidence sources could not be loaded.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubId]);

  useEffect(() => {
    if (!selectedSourceId) return;
    listEvidenceSnapshots(hubId, selectedSourceId)
      .then(setSnapshots)
      .catch(() => setStatus('Snapshot history could not be loaded.'));
  }, [hubId, listEvidenceSnapshots, selectedSourceId]);

  const handleCreateAgentReviewSource = async (): Promise<void> => {
    const timestamp = nowIso();
    const source: EvidenceSource = {
      id: `agent-review-log-${Date.now()}`,
      hubId,
      name: 'Agent review log',
      cadence: 'weekly',
      profileId: AGENT_REVIEW_LOG_PROFILE.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveEvidenceSource(source);
    setSelectedSourceId(source.id);
    setStatus('Evidence Source created.');
    await refresh();
    onEvidenceChanged?.();
  };

  const handleSnapshotFile = async (file: File): Promise<void> => {
    if (!selectedSource) return;
    try {
      const text = await file.text();
      const rows = await parseText(text);
      const detection = AGENT_REVIEW_LOG_PROFILE.detect(rows);
      const mapping = detection?.recommendedMapping ?? {};
      const application = AGENT_REVIEW_LOG_PROFILE.apply(rows, mapping);
      const capturedAt = nowIso();
      const unsafeGreens = application.derivedRows.reduce(
        (count, row) => count + (row.FalseGreen === 1 ? 1 : 0),
        0
      );
      const snapshot: EvidenceSnapshot = {
        id: `snapshot-${Date.now()}`,
        hubId,
        sourceId: selectedSource.id,
        capturedAt,
        rowCount: rows.length,
        profileApplication: application,
        latestSignals:
          unsafeGreens > 0
            ? [
                {
                  id: `${selectedSource.id}:false-green`,
                  label: 'False green',
                  value: unsafeGreens,
                  severity: 'red',
                  capturedAt,
                },
              ]
            : [
                {
                  id: `${selectedSource.id}:safe-green`,
                  label: 'False green',
                  value: 0,
                  severity: 'green',
                  capturedAt,
                },
              ],
      };
      await saveEvidenceSnapshot(snapshot, text);
      setStatus(
        application.validation.ok
          ? 'Snapshot uploaded and profile applied.'
          : application.validation.errors.join(' ')
      );
      await refresh();
      onEvidenceChanged?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Snapshot upload failed.');
    }
  };

  return (
    <section className="rounded-lg border border-edge bg-surface-secondary p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-content">
            <Database size={16} />
            <h3>Evidence Sources</h3>
          </div>
          <p className="mt-1 text-xs text-content-secondary">
            Customer-owned snapshot contracts for recurring hub evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateAgentReviewSource}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-edge px-3 py-2 text-sm font-medium text-content-secondary hover:bg-surface hover:text-content"
        >
          <ShieldCheck size={16} />
          Agent Review Log
        </button>
      </div>

      {sources.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label className="text-xs font-medium text-content-secondary" htmlFor="evidence-source">
              Source
            </label>
            <select
              id="evidence-source"
              value={selectedSourceId}
              onChange={event => setSelectedSourceId(event.target.value)}
              className="mt-1 w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content"
            >
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Upload size={16} />
              Upload Snapshot
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void handleSnapshotFile(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            {status && <p className="mt-2 text-xs text-content-secondary">{status}</p>}
          </div>

          <div className="rounded-md border border-edge bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
              Latest snapshot
            </p>
            {latestSnapshot ? (
              <div className="mt-2 text-sm text-content">
                <p>{latestSnapshot.rowCount} rows</p>
                <p className="text-xs text-content-secondary">
                  {new Date(latestSnapshot.capturedAt).toLocaleString('en')}
                </p>
                <p className="mt-1 text-xs text-content-secondary">
                  False green: {falseGreenCount(latestSnapshot)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-content-secondary">No snapshots yet</p>
            )}
            {snapshots.length > 0 && (
              <div className="mt-3 border-t border-edge pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
                  History
                </p>
                <div className="mt-2 space-y-1">
                  {snapshots.slice(0, 4).map(snapshot => (
                    <p key={snapshot.id} className="text-xs text-content-secondary">
                      {snapshot.rowCount} rows ·{' '}
                      {new Date(snapshot.capturedAt).toLocaleDateString('en')}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProcessHubEvidencePanel;
