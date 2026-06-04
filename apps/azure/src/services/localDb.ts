// src/services/localDb.ts
// IndexedDB operations for project persistence (Dexie wrapper)

import { DEFAULT_PROCESS_HUB, buildProjectMetadata, evaluateSurvey } from '@variscout/core';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
  ProcessHubSurveyReadinessSummary,
  ProjectMetadata,
  ControlMetadataProjection,
  ControlRecord,
  ControlReview,
  SurveyEvaluation,
} from '@variscout/core';
import { db } from '../db/schema';
import type { DocumentAccess, ProjectRecord } from '../db/schema';
import type { StorageLocation, CloudProject } from './cloudSync';
import type { DocumentSnapshot } from '@variscout/stores';

export type Project = DocumentSnapshot;

// ── Metadata extraction ─────────────────────────────────────────────────

function summarizeSurveyReadiness(evaluation: SurveyEvaluation): ProcessHubSurveyReadinessSummary {
  return {
    possibilityStatus: evaluation.possibility.overallStatus,
    powerStatus: evaluation.power.overallStatus,
    trustStatus: evaluation.trust.overallStatus,
    recommendationCount: evaluation.recommendations.length,
    topRecommendations: evaluation.recommendations
      .slice(0, 3)
      .map(recommendation => recommendation.title),
  };
}

/**
 * Extract portfolio metadata from the canonical DocumentSnapshot shape.
 */
export function extractMetadataInputs(
  project: Project,
  userId: string,
  existingLastViewedAt?: Record<string, number>
): ProjectMetadata | null {
  try {
    const findings = project.analyze.findings;
    const questions: readonly unknown[] = [];
    const rawData = project.project.rawData;
    const hasData = rawData.length > 0;
    const processContext = project.project.processContext ?? undefined;
    const outcome = project.project.outcome;
    const factors = project.project.factors;
    const specs = project.project.specs;
    const timeColumn = project.project.timeColumn;
    const surveyReadiness = summarizeSurveyReadiness(
      evaluateSurvey({
        data: rawData,
        outcomeColumn: outcome,
        factorColumns: factors,
        timeColumn,
        specs,
        processContext,
        findings,
      })
    );

    return buildProjectMetadata(
      findings,
      questions,
      hasData,
      userId,
      existingLastViewedAt,
      processContext,
      undefined,
      surveyReadiness
    );
  } catch {
    return null;
  }
}

export function extractDocumentAccess(project: Project, userId: string): DocumentAccess {
  const members = project.improvementProject?.metadata.members ?? [];
  const memberUserIds = members.map(member => member.userId).filter(Boolean);
  const lead = members.find(member => member.role === 'lead')?.userId;
  const ownerUserId = lead ?? userId;

  return {
    ownerUserId,
    memberUserIds: memberUserIds.length > 0 ? memberUserIds : [ownerUserId],
    hubId: project.hubId,
    projectId: project.improvementProject?.id ?? null,
  };
}

export function canAccessProjectRecord(record: ProjectRecord, userId: string): boolean {
  const access = record.access ?? extractDocumentAccess(record.data, userId);
  return access.ownerUserId === userId || access.memberUserIds.includes(userId);
}

function metadataChanged(current: ProjectMetadata | undefined, next: ProjectMetadata): boolean {
  return JSON.stringify(current ?? null) !== JSON.stringify(next);
}

async function backfillProjectMetadataRecords(
  records: ProjectRecord[],
  userId: string
): Promise<{ records: ProjectRecord[]; updated: number }> {
  let updated = 0;
  const nextRecords: ProjectRecord[] = [];

  for (const record of records) {
    const nextMeta = extractMetadataInputs(record.data, userId, record.meta?.lastViewedAt);
    const nextAccess = record.access ?? extractDocumentAccess(record.data, userId);
    const accessChanged = !record.access;
    if (!nextMeta || (!metadataChanged(record.meta, nextMeta) && !accessChanged)) {
      nextRecords.push(record);
      continue;
    }
    const nextRecord = { ...record, meta: nextMeta, access: nextAccess };
    nextRecords.push(nextRecord);
    await db.projects.update(record.name, { meta: nextMeta, access: nextAccess });
    updated++;
  }

  return { records: nextRecords, updated };
}

export async function backfillProjectMetadataInIndexedDB(userId = 'local'): Promise<number> {
  const records = await db.projects.toArray();
  const result = await backfillProjectMetadataRecords(records, userId);
  return result.updated;
}

// ── IndexedDB operations ────────────────────────────────────────────────

export async function saveToIndexedDB(
  project: Project,
  name: string,
  location: StorageLocation,
  meta?: ProjectMetadata,
  userId = 'local'
) {
  await db.projects.put({
    name,
    location,
    modified: new Date(),
    synced: false,
    data: project,
    meta,
    access: extractDocumentAccess(project, userId),
  });
}

export async function loadFromIndexedDB(name: string): Promise<Project | null> {
  const record = await db.projects.get(name);
  return record?.data || null;
}

export async function listFromIndexedDB(userId = 'local'): Promise<CloudProject[]> {
  const records = await db.projects.toArray();
  const result = await backfillProjectMetadataRecords(records, userId);
  return result.records
    .filter(record => canAccessProjectRecord(record, userId))
    .map(r => ({
      id: r.name,
      name: r.name,
      modified: r.modified?.toISOString() || new Date().toISOString(),
      location: r.location,
      metadata: r.meta,
      access: r.access,
    }));
}

export async function markAsSynced(
  name: string,
  cloudId: string,
  etag: string,
  baseStateJson?: string
) {
  const record = await db.projects.get(name);
  if (record) {
    await db.projects.update(name, { synced: true });
    await db.syncState.put({
      name,
      cloudId,
      lastSynced: new Date().toISOString(),
      etag,
      baseStateJson,
    });
  }
}

// ── Process Hub catalog ────────────────────────────────────────────────

export async function ensureDefaultProcessHubInIndexedDB(): Promise<void> {
  const existing = await db.processHubs.get(DEFAULT_PROCESS_HUB.id);
  if (!existing) {
    await db.processHubs.put(DEFAULT_PROCESS_HUB);
  }
}

export async function saveProcessHubToIndexedDB(hub: ProcessHub): Promise<void> {
  await db.processHubs.put(hub);
}

export async function listProcessHubsFromIndexedDB(): Promise<ProcessHub[]> {
  await ensureDefaultProcessHubInIndexedDB();
  const hubs = await db.processHubs.toArray();
  return hubs.sort((a, b) => {
    if (a.id === DEFAULT_PROCESS_HUB.id) return -1;
    if (b.id === DEFAULT_PROCESS_HUB.id) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Evidence Sources and Snapshots ─────────────────────────────────────

export async function saveEvidenceSourceToIndexedDB(source: EvidenceSource): Promise<void> {
  await db.evidenceSources.put(source);
}

export async function listEvidenceSourcesFromIndexedDB(hubId?: string): Promise<EvidenceSource[]> {
  const sources = hubId
    ? await db.evidenceSources.where('hubId').equals(hubId).toArray()
    : await db.evidenceSources.toArray();
  return sources.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveEvidenceSnapshotToIndexedDB(snapshot: EvidenceSnapshot): Promise<void> {
  await db.evidenceSnapshots.put(snapshot);
}

export async function listEvidenceSnapshotsFromIndexedDB(
  hubId: string,
  sourceId?: string
): Promise<EvidenceSnapshot[]> {
  const snapshots = sourceId
    ? await db.evidenceSnapshots.where('sourceId').equals(sourceId).toArray()
    : await db.evidenceSnapshots.where('hubId').equals(hubId).toArray();
  return snapshots
    .filter(snapshot => snapshot.hubId === hubId && (!sourceId || snapshot.sourceId === sourceId))
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
}

// ── Control records, reviews, and control handoffs ─────────────────

export async function saveControlRecordToIndexedDB(record: ControlRecord): Promise<void> {
  await db.controlRecords.put(record);
}

export async function listControlRecordsFromIndexedDB(hubId: string): Promise<ControlRecord[]> {
  return db.controlRecords.where('hubId').equals(hubId).toArray();
}

export async function saveControlReviewToIndexedDB(review: ControlReview): Promise<void> {
  await db.controlReviews.put(review);
}

export async function listControlReviewsFromIndexedDB(recordId: string): Promise<ControlReview[]> {
  const rows = await db.controlReviews.where('recordId').equals(recordId).toArray();
  return rows.sort((a, b) => b.reviewedAt - a.reviewedAt);
}

export async function saveControlHandoffToIndexedDB(handoff: ControlHandoff): Promise<void> {
  await db.controlHandoffs.put(handoff);
}

export async function listControlHandoffsFromIndexedDB(hubId: string): Promise<ControlHandoff[]> {
  return db.controlHandoffs.where('hubId').equals(hubId).toArray();
}

// ── Control projection helpers ─────────────────────────────────────

export function buildSustainmentProjection(
  record: ControlRecord,
  handoff?: ControlHandoff
): ControlMetadataProjection {
  return {
    recordId: record.id,
    cadence: record.cadence,
    nextReviewDue: record.nextReviewDue,
    latestVerdict: record.latestVerdict,
    handoffSurface: handoff?.surface,
  };
}

export async function updateProjectSustainmentProjectionInIndexedDB(
  investigationId: string,
  projection: ControlMetadataProjection | undefined
): Promise<void> {
  const project = await db.projects.get(investigationId);
  if (!project) return;
  const existingMeta = project.meta;
  const updatedMeta = existingMeta ? { ...existingMeta, sustainment: projection } : undefined;
  if (!updatedMeta) return;
  await db.projects.update(investigationId, { meta: updatedMeta });
}

export async function recomputeSustainmentProjectionForRecord(
  record: ControlRecord
): Promise<void> {
  const handoff = record.controlHandoffId
    ? await db.controlHandoffs.get(record.controlHandoffId).catch(() => undefined)
    : undefined;
  const projection = buildSustainmentProjection(record, handoff);
  await updateProjectSustainmentProjectionInIndexedDB(record.investigationId, projection);
}

export async function tombstoneControlRecordsForInvestigation(
  investigationId: string,
  deletedAt: number
): Promise<number> {
  const records = await db.controlRecords
    .where('investigationId')
    .equals(investigationId)
    .toArray();
  if (records.length === 0) return 0;
  let updated = 0;
  for (const record of records) {
    if (record.deletedAt !== null) continue; // already archived; skip
    await db.controlRecords.update(record.id, {
      deletedAt,
      updatedAt: deletedAt,
    });
    updated += 1;
  }
  if (updated > 0) {
    // Clear the project's meta.sustainment projection — the live record is gone.
    await clearProjectSustainmentProjectionInIndexedDB(investigationId);
  }
  return updated;
}

export async function clearProjectSustainmentProjectionInIndexedDB(
  investigationId: string
): Promise<void> {
  const project = await db.projects.get(investigationId);
  if (!project?.meta?.sustainment) return;
  const { sustainment: _removed, ...restMeta } = project.meta;
  void _removed;
  await db.projects.update(investigationId, { meta: restMeta });
}
