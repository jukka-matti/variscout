import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database, Upload, ShieldCheck } from 'lucide-react';
import {
  AGENT_REVIEW_LOG_PROFILE,
  DATA_PROFILE_REGISTRY,
  detectDataProfiles,
  parseText,
  type DataProfileDefinition,
  type DataProfileDetection,
  type DataRow,
  type EvidenceCadence,
  type EvidenceSnapshot,
  type EvidenceSource,
} from '@variscout/core';
import { useStorage } from '../services/storage';
import { safeTrackEvent } from '../lib/appInsights';

interface ProcessHubEvidencePanelProps {
  hubId: string;
  onEvidenceChanged?: () => void;
}

function nowMs(): number {
  return Date.now();
}

// capturedAt is the data-time field (string ISO); reuse this helper where strings are needed.
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

const FALSE_GREEN_AMBER_RATE = 0.01;

function falseGreenSeverity(unsafeGreens: number, totalRows: number): 'green' | 'amber' | 'red' {
  if (unsafeGreens === 0) return 'green';
  if (totalRows === 0) return 'red';
  return unsafeGreens / totalRows <= FALSE_GREEN_AMBER_RATE ? 'amber' : 'red';
}

// ---------------------------------------------------------------------------
// Wizard state machine
// ---------------------------------------------------------------------------

type WizardState =
  | { step: 'idle' }
  | {
      step: 'picking-profile';
      rows: DataRow[];
      rawText: string;
      sourceName: string;
      matches: DataProfileDetection[];
    }
  | {
      step: 'confirming-mapping';
      rows: DataRow[];
      rawText: string;
      sourceName: string;
      profile: DataProfileDefinition;
      mapping: Record<string, string>;
    }
  | {
      step: 'choosing-cadence';
      rows: DataRow[];
      rawText: string;
      sourceName: string;
      profile: DataProfileDefinition;
      mapping: Record<string, string>;
    }
  | {
      step: 'saving';
      rows: DataRow[];
      rawText: string;
      sourceName: string;
      profile: DataProfileDefinition;
      mapping: Record<string, string>;
      cadence: EvidenceCadence;
    }
  | { step: 'success' }
  | { step: 'error'; message: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // Wizard state
  const [wizard, setWizard] = useState<WizardState>({ step: 'idle' });
  const [chosenCadence, setChosenCadence] = useState<EvidenceCadence>('manual');
  const newSourceFileInputRef = useRef<HTMLInputElement>(null);

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

  // ---------------------------------------------------------------------------
  // Existing quick-path: Agent Review Log
  // ---------------------------------------------------------------------------

  const handleCreateAgentReviewSource = async (): Promise<void> => {
    const timestamp = nowMs();
    const source: EvidenceSource = {
      id: `agent-review-log-${timestamp}`,
      hubId,
      name: 'Agent review log',
      cadence: 'weekly',
      profileId: AGENT_REVIEW_LOG_PROFILE.id,
      createdAt: timestamp,
      deletedAt: null,
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
      const severity = falseGreenSeverity(unsafeGreens, rows.length);
      const signalId =
        severity === 'green'
          ? `${selectedSource.id}:safe-green`
          : `${selectedSource.id}:false-green`;
      const snapshotNow = nowMs();
      const snapshot: EvidenceSnapshot = {
        id: `snapshot-${snapshotNow}`,
        hubId,
        sourceId: selectedSource.id,
        capturedAt,
        rowCount: rows.length,
        origin: `evidence-source:${selectedSource.id}`,
        importedAt: snapshotNow,
        createdAt: snapshotNow,
        deletedAt: null,
        profileApplication: application,
        latestSignals: [
          {
            id: signalId,
            label: 'False green',
            value: unsafeGreens,
            severity,
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

  // ---------------------------------------------------------------------------
  // New generic wizard path
  // ---------------------------------------------------------------------------

  const handleNewSourceFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const rows = await parseText(text);
      const sourceName = file.name.replace(/\.[^.]+$/, '') || 'Evidence source';
      if (rows.length === 0) {
        setWizard({ step: 'error', message: 'File contains no rows.' });
        return;
      }
      const matches = detectDataProfiles(rows);
      if (matches.length === 0) {
        setWizard({ step: 'error', message: 'No profile matched this file.' });
        return;
      }
      if (matches.length === 1) {
        const profile = DATA_PROFILE_REGISTRY.find(p => p.id === matches[0]!.profileId);
        if (!profile) {
          setWizard({ step: 'error', message: 'Detected profile is not registered.' });
          return;
        }
        setWizard({
          step: 'confirming-mapping',
          rows,
          rawText: text,
          sourceName,
          profile,
          mapping: { ...matches[0]!.recommendedMapping },
        });
      } else {
        setWizard({
          step: 'picking-profile',
          rows,
          rawText: text,
          sourceName,
          matches,
        });
      }
    } catch (err) {
      setWizard({
        step: 'error',
        message: err instanceof Error ? err.message : 'File upload failed.',
      });
    }
  };

  const handlePickProfile = (profileId: string): void => {
    setWizard(prev => {
      if (prev.step !== 'picking-profile') return prev;
      const profile = DATA_PROFILE_REGISTRY.find(p => p.id === profileId);
      if (!profile) return prev;
      const detection = prev.matches.find(m => m.profileId === profileId);
      return {
        step: 'confirming-mapping',
        rows: prev.rows,
        rawText: prev.rawText,
        sourceName: prev.sourceName,
        profile,
        mapping: { ...(detection?.recommendedMapping ?? {}) },
      };
    });
  };

  const handleMappingChange = (key: string, value: string): void => {
    setWizard(prev => {
      if (prev.step !== 'confirming-mapping') return prev;
      return { ...prev, mapping: { ...prev.mapping, [key]: value } };
    });
  };

  const handleConfirmMapping = (): void => {
    setWizard(prev => {
      if (prev.step !== 'confirming-mapping') return prev;
      return {
        step: 'choosing-cadence',
        rows: prev.rows,
        rawText: prev.rawText,
        sourceName: prev.sourceName,
        profile: prev.profile,
        mapping: prev.mapping,
      };
    });
  };

  const handleSaveNewSource = async (): Promise<void> => {
    if (wizard.step !== 'choosing-cadence') return;
    const { rows, rawText, sourceName, profile, mapping } = wizard;
    setWizard({
      step: 'saving',
      rows,
      rawText,
      sourceName,
      profile,
      mapping,
      cadence: chosenCadence,
    });
    try {
      const timestamp = nowMs();
      const sourceId = `evidence-source-${timestamp}`;
      const source: EvidenceSource = {
        id: sourceId,
        hubId,
        name: sourceName,
        cadence: chosenCadence,
        profileId: profile.id,
        createdAt: timestamp,
        deletedAt: null,
        updatedAt: timestamp,
      };
      await saveEvidenceSource(source);

      const capturedAt = nowIso(); // capturedAt is data-time (string)
      const application = profile.apply(rows, mapping);
      const snapshot: EvidenceSnapshot = {
        id: `snapshot-${Date.now()}`,
        hubId,
        sourceId,
        capturedAt,
        rowCount: rows.length,
        origin: `evidence-source:${sourceId}`,
        importedAt: timestamp,
        createdAt: timestamp,
        deletedAt: null,
        profileApplication: application,
      };
      await saveEvidenceSnapshot(snapshot, rawText);

      safeTrackEvent('process_hub.evidence_source_created', {
        hubId,
        profileId: profile.id,
        columnCount: Object.keys(rows[0] ?? {}).length,
        rowCount: rows.length,
        cadence: chosenCadence,
      });

      setWizard({ step: 'success' });
      await refresh();
      onEvidenceChanged?.();
      setTimeout(() => setWizard({ step: 'idle' }), 800);
    } catch (err) {
      setWizard({
        step: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    }
  };

  const handleCancelWizard = (): void => {
    setWizard({ step: 'idle' });
    setChosenCadence('manual');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        <div className="flex flex-wrap gap-2">
          {wizard.step === 'idle' && (
            <button
              type="button"
              onClick={handleCreateAgentReviewSource}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-edge px-3 py-2 text-sm font-medium text-content-secondary hover:bg-surface hover:text-content"
            >
              <ShieldCheck size={16} />
              Agent Review Log
            </button>
          )}

          {/* New Source wizard trigger */}
          {wizard.step === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => newSourceFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-edge px-3 py-2 text-sm font-medium text-content-secondary hover:bg-surface hover:text-content"
              >
                <Upload size={16} />
                New Source
              </button>
              <input
                ref={newSourceFileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                data-testid="evidence-source-file-input"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void handleNewSourceFile(file);
                  event.currentTarget.value = '';
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Wizard steps                                                         */}
      {/* ------------------------------------------------------------------ */}

      {wizard.step === 'picking-profile' && (
        <div
          data-testid="profile-picker"
          className="mt-4 rounded-md border border-edge bg-surface p-3"
        >
          <p className="text-sm font-semibold text-content">Pick a profile</p>
          {wizard.matches.map(m => {
            const profile = DATA_PROFILE_REGISTRY.find(p => p.id === m.profileId);
            if (!profile) return null;
            return (
              <button
                key={m.profileId}
                type="button"
                onClick={() => handlePickProfile(m.profileId)}
                className="mt-2 block w-full rounded-md border border-edge px-3 py-2 text-left text-sm text-content hover:bg-surface-hover"
              >
                <p className="font-medium">{profile.label}</p>
                <p className="text-xs text-content-secondary">Confidence: {m.confidence}</p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleCancelWizard}
            className="mt-3 text-xs text-content-secondary hover:text-content"
          >
            Cancel
          </button>
        </div>
      )}

      {wizard.step === 'confirming-mapping' && (
        <form
          data-testid="mapping-confirmation-form"
          className="mt-4 rounded-md border border-edge bg-surface p-3"
          onSubmit={e => {
            e.preventDefault();
            handleConfirmMapping();
          }}
        >
          <p className="text-sm font-semibold text-content">Confirm column mapping</p>
          <p className="mt-1 text-xs text-content-secondary">Profile: {wizard.profile.label}</p>
          {Object.keys(wizard.mapping).length === 0 && (
            <p className="mt-2 text-xs text-content-secondary">
              No mappings to confirm — defaults will be used.
            </p>
          )}
          {Object.entries(wizard.mapping).map(([key, value]) => (
            <div key={key} className="mt-3">
              <label
                className="text-xs font-medium text-content-secondary"
                htmlFor={`mapping-${key}`}
              >
                {key}
              </label>
              <select
                id={`mapping-${key}`}
                value={value}
                onChange={e => handleMappingChange(key, e.target.value)}
                className="mt-1 w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content"
              >
                {Object.keys(wizard.rows[0] ?? {}).map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCancelWizard}
              className="rounded-md border border-edge px-3 py-1 text-xs text-content-secondary hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </form>
      )}

      {wizard.step === 'choosing-cadence' && (
        <div
          data-testid="cadence-selector"
          className="mt-4 rounded-md border border-edge bg-surface p-3"
        >
          <p className="text-sm font-semibold text-content">Choose cadence</p>
          {(['manual', 'hourly', 'shiftly', 'daily', 'weekly'] as const).map(c => (
            <label key={c} className="mt-2 flex items-center gap-2 text-sm text-content">
              <input
                type="radio"
                name="cadence"
                value={c}
                checked={chosenCadence === c}
                onChange={() => setChosenCadence(c)}
              />
              <span className="capitalize">{c}</span>
            </label>
          ))}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCancelWizard}
              className="rounded-md border border-edge px-3 py-1 text-xs text-content-secondary hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSaveNewSource()}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {wizard.step === 'saving' && <p className="mt-4 text-sm text-content-secondary">Saving…</p>}

      {wizard.step === 'success' && (
        <p className="mt-4 text-sm text-content-secondary">Evidence Source created.</p>
      )}

      {wizard.step === 'error' && (
        <div className="mt-4 rounded-md border border-rose-500/40 bg-surface p-3 text-sm text-rose-400">
          <p>{wizard.message}</p>
          <button
            type="button"
            onClick={handleCancelWizard}
            className="mt-2 text-xs text-content-secondary hover:text-content"
          >
            Back
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Existing source selector + snapshot upload                           */}
      {/* ------------------------------------------------------------------ */}

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
