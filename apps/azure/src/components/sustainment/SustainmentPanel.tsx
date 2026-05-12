import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SustainmentForm, type SustainmentRecordChangePatch } from '@variscout/ui';
import type { ProcessHub, SustainmentRecord, SustainmentReview } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { azureHubRepository } from '../../persistence';

interface SustainmentPanelProps {
  activeHub?: ProcessHub;
  targetId?: string;
  onBack: () => void;
}

const buttonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-left text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sr-${Date.now()}`;
}

function liveRecords(records: SustainmentRecord[] | undefined): SustainmentRecord[] {
  return (records ?? []).filter(record => record.deletedAt === null);
}

function firstClosedProject(
  hub: ProcessHub,
  preferredProjectId?: string
): ImprovementProject | undefined {
  const liveClosedProjects = (hub.improvementProjects ?? []).filter(
    project => project.deletedAt === null && project.status === 'closed'
  );
  const preferred = liveClosedProjects.find(project => project.id === preferredProjectId);
  if (preferred) return preferred;
  return liveClosedProjects[0];
}

function recordMatchesTarget(record: SustainmentRecord, targetId: string | undefined): boolean {
  return (
    targetId !== undefined && (record.id === targetId || record.improvementProjectId === targetId)
  );
}

function selectedRecordForTarget(
  records: SustainmentRecord[],
  selectedRecordId: string | null,
  targetId: string | undefined
): SustainmentRecord | null {
  const targetRecord = records.find(record => recordMatchesTarget(record, targetId));
  if (targetRecord) return targetRecord;
  if (records.length === 1) return records[0];
  return records.find(record => record.id === selectedRecordId) ?? null;
}

function firstClosedProjectLegacy(hub: ProcessHub): ImprovementProject | undefined {
  return (hub.improvementProjects ?? []).find(
    project => project.deletedAt === null && project.status === 'closed'
  );
}

function buildDraftRecord(hub: ProcessHub, preferredProjectId?: string): SustainmentRecord {
  const project = firstClosedProject(hub, preferredProjectId) ?? firstClosedProjectLegacy(hub);
  const now = Date.now();
  const investigationId = project?.metadata.investigationId ?? `${hub.id}:sustainment`;
  const title = project ? `Sustain ${project.metadata.title}` : `Sustain ${hub.name}`;

  return {
    id: makeId(),
    hubId: hub.id,
    investigationId,
    status: 'pending',
    title,
    improvementProjectId: project?.id,
    goal: project?.goal,
    targetSummary: project?.goal.freeText,
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'monthly',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function mergeRecordPatch(
  record: SustainmentRecord,
  patch: SustainmentRecordChangePatch
): SustainmentRecord {
  return { ...record, ...patch, updatedAt: Date.now() };
}

const SustainmentPanel: React.FC<SustainmentPanelProps> = ({ activeHub, targetId, onBack }) => {
  const [records, setRecords] = useState<SustainmentRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<SustainmentReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(Boolean(activeHub));
  const creatingForHubRef = useRef<string | null>(null);

  useEffect(() => {
    setRecords(liveRecords(activeHub?.sustainmentRecords));
    setSelectedRecordId(null);
    setReviews([]);
    setIsLoadingRecords(Boolean(activeHub));

    if (!activeHub) {
      setIsLoadingRecords(false);
      return;
    }

    let cancelled = false;
    void azureHubRepository.sustainmentRecords
      .listByHub(activeHub.id)
      .then((rows: SustainmentRecord[]) => {
        if (!cancelled) setRecords(liveRecords(rows));
      })
      .catch(() => {
        if (!cancelled) setRecords(liveRecords(activeHub.sustainmentRecords));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub]);

  useEffect(() => {
    if (
      !activeHub ||
      isLoadingRecords ||
      records.length > 0 ||
      creatingForHubRef.current === activeHub.id
    ) {
      return;
    }

    const createHubId = activeHub.id;
    const record = buildDraftRecord(activeHub, targetId);
    creatingForHubRef.current = activeHub.id;
    setError(null);
    let cancelled = false;

    void azureHubRepository
      .dispatch({ kind: 'SUSTAINMENT_RECORD_CREATE', hubId: activeHub.id, record })
      .then(() => {
        if (cancelled || creatingForHubRef.current !== createHubId) return;
        setRecords([record]);
        setSelectedRecordId(record.id);
      })
      .catch(() => {
        if (!cancelled) setError('Could not create a sustainment record.');
      })
      .finally(() => {
        if (creatingForHubRef.current === createHubId) creatingForHubRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, isLoadingRecords, records.length, targetId]);

  const selectedRecord = selectedRecordForTarget(records, selectedRecordId, targetId);

  useEffect(() => {
    if (!activeHub || !selectedRecord) {
      setReviews([]);
      return;
    }

    let cancelled = false;
    void azureHubRepository.sustainmentReviews
      .listByRecord(activeHub.id, selectedRecord.id)
      .then((rows: SustainmentReview[]) => {
        if (!cancelled)
          setReviews(rows.filter((review: SustainmentReview) => review.deletedAt === null));
      })
      .catch(() => {
        if (!cancelled) {
          setReviews(
            (activeHub.sustainmentReviews ?? []).filter(
              review => review.deletedAt === null && review.recordId === selectedRecord.id
            )
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, selectedRecord]);

  const updateSelectedRecord = useCallback(
    (patch: SustainmentRecordChangePatch) => {
      if (!selectedRecord) return;
      const next = mergeRecordPatch(selectedRecord, patch);
      setRecords(current => current.map(record => (record.id === next.id ? next : record)));
      void azureHubRepository
        .dispatch({ kind: 'SUSTAINMENT_RECORD_UPDATE', recordId: selectedRecord.id, patch })
        .catch(() => {
          setError('Could not save the sustainment record changes.');
        });
    },
    [selectedRecord]
  );

  const heading = useMemo(() => activeHub?.name ?? 'No active hub', [activeHub]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-primary p-4 text-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sustainment</h2>
          <p className="text-sm text-content-secondary">{heading}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Back to FRAME
        </button>
      </div>

      {!activeHub ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Create or select a Process Hub before opening sustainment.
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
          {error}
        </p>
      ) : records.length > 1 && !selectedRecord ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-content">Choose a sustainment record</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {records.map(record => (
              <button
                key={record.id}
                type="button"
                className={buttonClassName}
                onClick={() => setSelectedRecordId(record.id)}
              >
                {record.title}
              </button>
            ))}
          </div>
        </div>
      ) : selectedRecord ? (
        <SustainmentForm
          record={selectedRecord}
          reviews={reviews}
          onRecordChange={updateSelectedRecord}
        />
      ) : (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Creating sustainment record...
        </p>
      )}
    </div>
  );
};

export default SustainmentPanel;
