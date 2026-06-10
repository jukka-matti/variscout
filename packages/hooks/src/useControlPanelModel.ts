import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceLadder,
  resetLadder,
  type ControlRecord,
  type ControlReview,
  type OutcomeSpec,
  type ProcessHub,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { HubRepository } from '@variscout/core/persistence';

export type ControlPanelRecordPatch = Partial<
  Omit<ControlRecord, 'id' | 'createdAt' | 'hubId' | 'projectId' | 'updatedAt' | 'deletedAt'>
>;

export type ControlPanelReviewInput = Pick<
  ControlReview,
  'verdict' | 'nowStats' | 'dataStamp' | 'observation'
>;

export interface UseControlPanelModelOptions {
  activeHub?: ProcessHub;
  targetId?: string;
  repository: Pick<HubRepository, 'dispatch' | 'controlRecords' | 'controlReviews'>;
}

export interface UseControlPanelModelReturn {
  records: ControlRecord[];
  selectedRecord: ControlRecord | null;
  reviews: ControlReview[];
  error: string | null;
  isLoadingRecords: boolean;
  heading: string;
  selectRecord: (recordId: ControlRecord['id']) => void;
  updateSelectedRecord: (patch: ControlPanelRecordPatch) => void;
  logRecheck: (input: ControlPanelReviewInput) => void;
}

function makeId(prefix = 'sr'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}`;
}

function liveRecords(records: ControlRecord[] | undefined): ControlRecord[] {
  return (records ?? []).filter(record => record.deletedAt === null);
}

function firstClosedProject(
  hub: ProcessHub,
  preferredProjectId?: string
): ImprovementProject | undefined {
  const p = hub.improvementProject;
  if (!p || p.deletedAt !== null || p.status !== 'closed') return undefined;
  if (preferredProjectId !== undefined && p.id !== preferredProjectId) return undefined;
  return p;
}

function recordMatchesTarget(record: ControlRecord, targetId: string | undefined): boolean {
  return (
    targetId !== undefined && (record.id === targetId || record.improvementProjectId === targetId)
  );
}

function selectedRecordForTarget(
  records: ControlRecord[],
  selectedRecordId: string | null,
  targetId: string | undefined
): ControlRecord | null {
  const targetRecord = records.find(record => recordMatchesTarget(record, targetId));
  if (targetRecord) return targetRecord;
  if (records.length === 1) return records[0];
  return records.find(record => record.id === selectedRecordId) ?? null;
}

function firstClosedProjectLegacy(hub: ProcessHub): ImprovementProject | undefined {
  const p = hub.improvementProject;
  return p && p.deletedAt === null && p.status === 'closed' ? p : undefined;
}

function buildDraftRecord(hub: ProcessHub, preferredProjectId?: string): ControlRecord {
  const project = firstClosedProject(hub, preferredProjectId) ?? firstClosedProjectLegacy(hub);
  const now = Date.now();
  // The Control join key: the project's self-FK when a closed project exists,
  // else the synthetic `${hub.id}:sustainment` fallback — the only join key for
  // records created without an associated closed project. PO-7 renamed the
  // FIELD to `projectId` (honest rename); the fallback VALUE is deliberately
  // not a project id and is preserved byte-identical.
  const joinKey = project?.metadata.projectId ?? `${hub.id}:sustainment`;
  const title = project ? `Sustain ${project.metadata.title}` : `Sustain ${hub.name}`;
  const measure = defaultMeasureForProject(project, hub.outcomes);

  return {
    id: makeId(),
    hubId: hub.id,
    projectId: joinKey,
    status: 'verifying',
    title,
    improvementDate: new Date(now).toISOString(),
    baseline: {
      capturedAt: now,
      window: {
        startISO: new Date(now).toISOString(),
        endISO: new Date(now).toISOString(),
      },
      measure,
      n: 0,
      mean: 0,
      sigma: 0,
    },
    ladder: [7, 30, 90, 180],
    ladderStep: 0,
    nextCheckSuggestedAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    improvementProjectId: project?.id,
    goal: project?.goal,
    targetSummary: project?.goal.freeText,
    lastEvaluatedSnapshotId: undefined,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function defaultMeasureForProject(
  project: ImprovementProject | undefined,
  outcomes: OutcomeSpec[] | undefined
): string {
  const outcomeSpecId = project?.goal.outcomeGoals[0]?.outcomeSpecId;
  const outcome = outcomes?.find(spec => spec.id === outcomeSpecId);
  return outcome?.columnName ?? outcomeSpecId ?? outcomes?.[0]?.columnName ?? 'outcome';
}

function mergeRecordPatch(record: ControlRecord, patch: ControlPanelRecordPatch): ControlRecord {
  return { ...record, ...patch, updatedAt: Date.now() };
}

export function useControlPanelModel({
  activeHub,
  targetId,
  repository,
}: UseControlPanelModelOptions): UseControlPanelModelReturn {
  const [records, setRecords] = useState<ControlRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ControlReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(Boolean(activeHub));
  const creatingForHubRef = useRef<string | null>(null);

  useEffect(() => {
    setRecords(liveRecords(activeHub?.controlRecords));
    setSelectedRecordId(null);
    setReviews([]);
    setIsLoadingRecords(Boolean(activeHub));

    if (!activeHub) {
      setIsLoadingRecords(false);
      return;
    }

    let cancelled = false;
    void repository.controlRecords
      .listByHub(activeHub.id)
      .then((rows: ControlRecord[]) => {
        if (!cancelled) setRecords(liveRecords(rows));
      })
      .catch(() => {
        if (!cancelled) setRecords(liveRecords(activeHub.controlRecords));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, repository]);

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

    void repository
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
  }, [activeHub, isLoadingRecords, records.length, repository, targetId]);

  const selectedRecord = selectedRecordForTarget(records, selectedRecordId, targetId);

  useEffect(() => {
    if (!activeHub || !selectedRecord) {
      setReviews([]);
      return;
    }

    let cancelled = false;
    void repository.controlReviews
      .listByRecord(activeHub.id, selectedRecord.id)
      .then((rows: ControlReview[]) => {
        if (!cancelled)
          setReviews(rows.filter((review: ControlReview) => review.deletedAt === null));
      })
      .catch(() => {
        if (!cancelled) {
          setReviews(
            (activeHub.controlReviews ?? []).filter(
              review => review.deletedAt === null && review.recordId === selectedRecord.id
            )
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeHub, repository, selectedRecord?.id]);

  const selectRecord = useCallback((recordId: ControlRecord['id']) => {
    setSelectedRecordId(recordId);
  }, []);

  const updateSelectedRecord = useCallback(
    (patch: ControlPanelRecordPatch) => {
      if (!selectedRecord) return;
      const next = mergeRecordPatch(selectedRecord, patch);
      setRecords(current => current.map(record => (record.id === next.id ? next : record)));
      void repository
        .dispatch({ kind: 'SUSTAINMENT_RECORD_UPDATE', recordId: selectedRecord.id, patch })
        .catch(() => {
          setError('Could not save the sustainment record changes.');
        });
    },
    [repository, selectedRecord]
  );

  const logRecheck = useCallback(
    (input: ControlPanelReviewInput) => {
      if (!selectedRecord) return;
      const now = Date.now();
      const reviewId = makeId('review');
      const reviewedAtISO = new Date(now).toISOString();
      const observation = input.observation?.trim();
      const review: ControlReview = {
        id: reviewId,
        recordId: selectedRecord.id,
        projectId: selectedRecord.projectId,
        hubId: selectedRecord.hubId,
        reviewedAt: now,
        reviewer: selectedRecord.owner ?? { displayName: 'Analyst' },
        verdict: input.verdict,
        nowStats: input.nowStats,
        dataStamp: input.dataStamp,
        ...(observation ? { observation } : {}),
        createdAt: now,
        deletedAt: null,
      };
      const reviewAnchor = reviewedAtISO;
      const reviewedRecord = {
        ...selectedRecord,
        latestReviewAt: reviewedAtISO,
        latestReviewId: reviewId,
        updatedAt: now,
      };
      const nextRecord =
        input.verdict === 'holding'
          ? advanceLadder(reviewedRecord, reviewAnchor)
          : input.verdict === 'drifted'
            ? resetLadder({ ...reviewedRecord, status: 'drifted' }, reviewAnchor)
            : reviewedRecord;

      setRecords(current =>
        current.map(record => (record.id === nextRecord.id ? nextRecord : record))
      );
      setReviews(current => [review, ...current]);
      void repository
        .dispatch({ kind: 'SUSTAINMENT_RECHECK_LOGGED', record: nextRecord, review })
        .catch(() => {
          setError('Could not log the sustainment re-check.');
        });
    },
    [repository, selectedRecord]
  );

  const heading = useMemo(() => activeHub?.name ?? 'No active hub', [activeHub]);

  return {
    records,
    selectedRecord,
    reviews,
    error,
    isLoadingRecords,
    heading,
    selectRecord,
    updateSelectedRecord,
    logRecheck,
  };
}
