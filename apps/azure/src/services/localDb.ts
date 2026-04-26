// src/services/localDb.ts
// IndexedDB operations for project persistence (Dexie wrapper)

import {
  DEFAULT_PROCESS_HUB,
  buildHubReviewSignal,
  buildProjectMetadata,
  evaluateSurvey,
} from '@variscout/core';
import type {
  DataRow,
  Finding,
  ProcessContext,
  ProcessHub,
  ProcessHubSurveyReadinessSummary,
  ProjectMetadata,
  Question,
  SpecLimits,
  SurveyEvaluation,
} from '@variscout/core';
import { db } from '../db/schema';
import type { ProjectRecord } from '../db/schema';
import type { StorageLocation, CloudProject } from './cloudSync';

// Project data is serialized to JSON for IndexedDB/OneDrive — kept as unknown
// because the storage layer is a passthrough that doesn't inspect the shape.
export type Project = unknown;

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
 * Extract findings, questions, and data presence from an opaque project object.
 * The storage layer treats project data as `unknown`; this peeks at the shape
 * to pull out the fields needed for metadata building.
 */
export function extractMetadataInputs(
  project: Project,
  userId: string,
  existingLastViewedAt?: Record<string, number>
): ProjectMetadata | null {
  try {
    const p = project as Record<string, unknown> | null;
    if (!p || typeof p !== 'object') return null;
    const findings = (Array.isArray(p.findings) ? p.findings : []) as Finding[];
    const questions = (Array.isArray(p.questions) ? p.questions : []) as Question[];
    const rawData = Array.isArray(p.rawData) ? (p.rawData as DataRow[]) : [];
    const hasData = rawData.length > 0;
    const processContext =
      p.processContext && typeof p.processContext === 'object'
        ? (p.processContext as ProcessContext)
        : undefined;
    const outcome = typeof p.outcome === 'string' ? p.outcome : null;
    const factors = Array.isArray(p.factors)
      ? p.factors.filter((factor): factor is string => typeof factor === 'string')
      : [];
    const specs = p.specs && typeof p.specs === 'object' ? (p.specs as SpecLimits) : undefined;
    const cpkTarget = typeof p.cpkTarget === 'number' ? p.cpkTarget : undefined;
    const timeColumn = typeof p.timeColumn === 'string' ? p.timeColumn : null;
    const dataFilename = typeof p.dataFilename === 'string' ? p.dataFilename : null;
    const reviewSignal = buildHubReviewSignal({
      rawData,
      outcome,
      factors,
      specs,
      cpkTarget,
      timeColumn,
      dataFilename,
    });
    const surveyReadiness = summarizeSurveyReadiness(
      evaluateSurvey({
        data: rawData,
        outcomeColumn: outcome,
        factorColumns: factors,
        timeColumn,
        specs,
        processContext,
        questions,
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
      reviewSignal,
      surveyReadiness
    );
  } catch {
    return null;
  }
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
    if (!nextMeta || !metadataChanged(record.meta, nextMeta)) {
      nextRecords.push(record);
      continue;
    }
    const nextRecord = { ...record, meta: nextMeta };
    nextRecords.push(nextRecord);
    await db.projects.update(record.name, { meta: nextMeta });
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
  meta?: ProjectMetadata
) {
  await db.projects.put({
    name,
    location,
    modified: new Date(),
    synced: false,
    data: project,
    meta,
  });
}

export async function loadFromIndexedDB(name: string): Promise<Project | null> {
  const record = await db.projects.get(name);
  return record?.data || null;
}

export async function listFromIndexedDB(userId = 'local'): Promise<CloudProject[]> {
  const records = await db.projects.toArray();
  const result = await backfillProjectMetadataRecords(records, userId);
  return result.records.map(r => ({
    id: r.name,
    name: r.name,
    modified: r.modified?.toISOString() || new Date().toISOString(),
    location: r.location,
    metadata: r.meta,
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
