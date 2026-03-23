// src/services/localDb.ts
// IndexedDB operations for project persistence (Dexie wrapper)

import { buildProjectMetadata } from '@variscout/core';
import type { ProjectMetadata, Finding, Hypothesis } from '@variscout/core';
import { db } from '../db/schema';
import type { StorageLocation, CloudProject } from './cloudSync';

// Project data is serialized to JSON for IndexedDB/OneDrive — kept as unknown
// because the storage layer is a passthrough that doesn't inspect the shape.
export type Project = unknown;

// ── Metadata extraction ─────────────────────────────────────────────────

/**
 * Extract findings, hypotheses, and data presence from an opaque project object.
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
    const hypotheses = (Array.isArray(p.hypotheses) ? p.hypotheses : []) as Hypothesis[];
    const hasData = Array.isArray(p.rawData) && p.rawData.length > 0;
    return buildProjectMetadata(findings, hypotheses, hasData, userId, existingLastViewedAt);
  } catch {
    return null;
  }
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

export async function listFromIndexedDB(): Promise<CloudProject[]> {
  const records = await db.projects.toArray();
  return records.map(r => ({
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
