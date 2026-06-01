// src/services/blobClient.ts
// Same-origin Azure Blob persistence adapter.
//
// R6e disables broad browser container SAS access. This module preserves the
// historical exported function names, but routes all persistence through
// authenticated server APIs that enforce project/hub access before touching Blob
// Storage.

import type {
  ControlHandoff,
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
  ProjectMetadata,
  ControlRecord,
  ControlReview,
} from '@variscout/core';
import { processHubEvidenceBlobPath } from '@variscout/core';
import type { Project } from './localDb';

// ── Types ──────────────────────────────────────────────────────────────

export interface BlobProjectMetadata {
  projectId: string;
  name: string;
  updated: string;
  createdBy?: string;
  metadata?: ProjectMetadata;
  access?: import('../db/schema').DocumentAccess;
}

export type SaveBlobProjectResult =
  | { ok: true; etag: string }
  | { ok: false; reason: 'precondition-failed' };

export type UpdateBlobConditionalResult =
  | { ok: true; etag: string }
  | { ok: false; reason: 'concurrency-exhausted' | 'network' | 'auth' };

export type ViewportBlobShape = {
  zoom: number;
  pan: { x: number; y: number };
  currentLevel: 'l1' | 'l2' | 'l3';
  focalStepId?: string;
  nodePositions: Record<string, { x: number; y: number }>;
  groupByTributary: boolean;
  updatedAt: number;
};

export interface LoadedViewport {
  snapshot: ViewportBlobShape;
  etag: string | null;
}

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;
type FetchBody = NonNullable<FetchInit['body']>;
type JsonInit = Omit<FetchInit, 'body'> & { body?: unknown };

// ── Disabled SAS compatibility exports ─────────────────────────────────

export function _resetSasCache(): void {
  // Compatibility no-op. R6e removed browser-side SAS token caching.
}

export async function getSasToken(): Promise<string> {
  throw new Error('Direct container SAS disabled. Use same-origin storage APIs.');
}

export function blobUrl(sasUrl: string, blobPath: string): string {
  const qIndex = sasUrl.indexOf('?');
  if (qIndex === -1) return `${sasUrl}/${blobPath}`;
  return `${sasUrl.slice(0, qIndex)}/${blobPath}${sasUrl.slice(qIndex)}`;
}

// ── Fetch helpers ──────────────────────────────────────────────────────

function encode(value: string): string {
  return encodeURIComponent(value);
}

function projectIdFromBlobPath(path: string): string {
  const projectId = path.split('/')[0];
  if (!projectId) throw new Error('400 Blob path must start with projectId');
  return projectId;
}

async function requestJson<T>(
  url: string,
  init: JsonInit = {}
): Promise<{ data: T; res: Response }> {
  const headers = new Headers(init.headers);
  let body: FetchBody | undefined;

  if (init.body !== undefined) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
    body = headers.get('Content-Type')?.includes('application/json')
      ? JSON.stringify(init.body)
      : (init.body as FetchBody);
  }

  const res = await fetch(url, { ...init, headers, body });
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`${res.status} ${message || res.statusText || 'Storage request failed'}`);
  }

  const text = await res.text();
  const data = (text ? JSON.parse(text) : {}) as T;
  return { data, res };
}

async function requestMaybeJson<T>(
  url: string,
  init: JsonInit = {}
): Promise<{ data: T; res: Response } | null> {
  const headers = new Headers(init.headers);
  let body: FetchBody | undefined;

  if (init.body !== undefined) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url, { ...init, headers, body });
  if (res.status === 404) return null;
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`${res.status} ${message || res.statusText || 'Storage request failed'}`);
  }

  const text = await res.text();
  return { data: (text ? JSON.parse(text) : {}) as T, res };
}

function isAuthStatus(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /\b(401|403)\b/.test(msg);
}

function isNetworkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return !/\b(401|403|412)\b/.test(msg);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Saved documents ────────────────────────────────────────────────────

export async function saveBlobProject(
  project: Project,
  projectId: string,
  metadata: BlobProjectMetadata,
  priorEtag?: string | null
): Promise<SaveBlobProjectResult> {
  const headers: Record<string, string> = {};
  if (priorEtag) headers['If-Match'] = priorEtag;

  try {
    const { data, res } = await requestJson<{ etag?: string }>(
      `/api/storage/projects/${encode(projectId)}`,
      {
        method: 'PUT',
        headers,
        body: { project, metadata },
      }
    );
    return { ok: true, etag: data.etag ?? res.headers.get('ETag') ?? '' };
  } catch (error) {
    if (/\b412\b/.test(error instanceof Error ? error.message : String(error))) {
      return { ok: false, reason: 'precondition-failed' };
    }
    throw error;
  }
}

export async function loadBlobProject(projectId: string): Promise<Project | null> {
  const loaded = await requestMaybeJson<{ project: Project }>(
    `/api/storage/projects/${encode(projectId)}`
  );
  return loaded?.data.project ?? null;
}

export async function loadBlobMetadata(projectId: string): Promise<BlobProjectMetadata | null> {
  const loaded = await requestMaybeJson<{ metadata: BlobProjectMetadata }>(
    `/api/storage/projects/${encode(projectId)}`
  );
  return loaded?.data.metadata ?? null;
}

export async function listBlobProjects(): Promise<BlobProjectMetadata[]> {
  const { data } = await requestJson<{ projects: BlobProjectMetadata[] }>('/api/storage/projects');
  return data.projects ?? [];
}

export async function updateBlobIndex(_projects: BlobProjectMetadata[]): Promise<void> {
  // R6e server writes _index.json as part of PUT /api/storage/projects/:projectId.
}

export async function getEtagForProject(projectId: string): Promise<string | null> {
  const loaded = await requestMaybeJson<{ etag?: string }>(
    `/api/storage/projects/${encode(projectId)}`
  );
  return loaded?.data.etag ?? loaded?.res.headers.get('ETag') ?? null;
}

// ── Process Hub catalog ────────────────────────────────────────────────

export async function listBlobProcessHubs(): Promise<ProcessHub[]> {
  const { data } = await requestJson<{ hubs: ProcessHub[] }>('/api/storage/process-hubs');
  return data.hubs ?? [];
}

export async function updateBlobProcessHubs(hubs: ProcessHub[]): Promise<void> {
  await requestJson('/api/storage/process-hubs', { method: 'PUT', body: { hubs } });
}

// ── Evidence sources and snapshots ─────────────────────────────────────

export async function listBlobEvidenceSources(hubId: string): Promise<EvidenceSource[]> {
  const { data } = await requestJson<{ sources: EvidenceSource[] }>(
    `/api/storage/hubs/${encode(hubId)}/evidence-sources`
  );
  return data.sources ?? [];
}

export async function saveBlobEvidenceSource(source: EvidenceSource): Promise<void> {
  await updateBlobEvidenceSources(source.hubId, [source]);
}

export async function updateBlobEvidenceSources(
  hubId: string,
  sources: EvidenceSource[]
): Promise<void> {
  await requestJson(`/api/storage/hubs/${encode(hubId)}/evidence-sources`, {
    method: 'PUT',
    body: { sources },
  });
}

export async function listBlobEvidenceSnapshots(
  hubId: string,
  sourceId: string
): Promise<EvidenceSnapshot[]> {
  const { data } = await requestJson<{ snapshots: EvidenceSnapshot[] }>(
    `/api/storage/hubs/${encode(hubId)}/evidence-sources/${encode(sourceId)}/snapshots`
  );
  return data.snapshots ?? [];
}

export async function saveBlobEvidenceSnapshot(
  snapshot: EvidenceSnapshot,
  sourceCsv?: string
): Promise<void> {
  await requestJson(
    `/api/storage/hubs/${encode(snapshot.hubId)}/evidence-sources/${encode(snapshot.sourceId)}/snapshots`,
    {
      method: 'PUT',
      body: { snapshots: [snapshot], sourceCsv },
    }
  );
}

export async function updateBlobEvidenceSnapshots(
  hubId: string,
  sourceId: string,
  snapshots: EvidenceSnapshot[]
): Promise<void> {
  await requestJson(
    `/api/storage/hubs/${encode(hubId)}/evidence-sources/${encode(sourceId)}/snapshots`,
    {
      method: 'PUT',
      body: { snapshots },
    }
  );
}

export async function updateBlobEvidenceSnapshotsConditional(
  hubId: string,
  sourceId: string,
  catalog: EvidenceSnapshot[],
  options?: {
    maxRetries?: number;
    backoffMs?: number;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<UpdateBlobConditionalResult> {
  const maxRetries = options?.maxRetries ?? 3;
  const backoffMs = options?.backoffMs ?? 100;
  const sleep = options?.sleep ?? defaultSleep;
  const url = `/api/storage/hubs/${encode(hubId)}/evidence-sources/${encode(sourceId)}/snapshots`;

  let attempt = 0;
  while (attempt < maxRetries) {
    let etag: string | null = null;
    try {
      const loaded = await requestMaybeJson<{ etag?: string }>(url);
      etag = loaded?.data.etag ?? loaded?.res.headers.get('ETag') ?? null;
    } catch (error) {
      return { ok: false, reason: isAuthStatus(error) ? 'auth' : 'network' };
    }

    try {
      const headers: Record<string, string> = {};
      if (etag) headers['If-Match'] = etag;
      const { data, res } = await requestJson<{ etag?: string }>(url, {
        method: 'PUT',
        headers,
        body: { snapshots: catalog },
      });
      return { ok: true, etag: data.etag ?? res.headers.get('ETag') ?? '' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/\b401\b|\b403\b/.test(msg)) return { ok: false, reason: 'auth' };
      if (/\b412\b/.test(msg)) {
        attempt += 1;
        if (attempt < maxRetries) await sleep(backoffMs * Math.pow(2, attempt - 1));
        continue;
      }
      return { ok: false, reason: isNetworkError(error) ? 'network' : 'network' };
    }
  }

  return { ok: false, reason: 'concurrency-exhausted' };
}

// ── Binary/text artifacts ──────────────────────────────────────────────

export async function saveBlobPhoto(
  projectId: string,
  findingId: string,
  photoId: string,
  blob: Blob
): Promise<string> {
  const res = await fetch(
    `/api/storage/projects/${encode(projectId)}/photos/${encode(findingId)}/${encode(photoId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob,
    }
  );
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`${res.status} ${message || 'Failed to save photo blob'}`);
  }
  const body = (await res.json()) as { url?: string };
  return body.url ?? `/api/storage/projects/${projectId}/photos/${findingId}/${photoId}`;
}

export async function uploadTextBlob(path: string, content: string): Promise<void> {
  const projectId = projectIdFromBlobPath(path);
  await requestJson('/api/storage/blob-text', {
    method: 'PUT',
    body: {
      projectId,
      blobPath: path,
      text: content,
      contentType: 'application/x-ndjson',
    },
  });
}

// ── Per-Hub canvas viewport snapshot ───────────────────────────────────

export async function loadBlobCanvasViewport(hubId: string): Promise<LoadedViewport | null> {
  try {
    const loaded = await requestMaybeJson<{ snapshot: ViewportBlobShape; etag?: string }>(
      `/api/storage/hubs/${encode(hubId)}/viewport`
    );
    if (!loaded) return null;
    return {
      snapshot: loaded.data.snapshot,
      etag: loaded.data.etag ?? loaded.res.headers.get('ETag'),
    };
  } catch {
    return null;
  }
}

export async function saveBlobCanvasViewport(
  hubId: string,
  snapshot: ViewportBlobShape,
  priorEtag: string | null
): Promise<
  | { ok: true; etag: string }
  | {
      ok: false;
      reason: 'precondition-failed' | 'network' | 'auth' | 'unknown';
      status?: number;
      message: string;
    }
> {
  const headers: Record<string, string> = {};
  if (priorEtag !== null) headers['If-Match'] = priorEtag;

  try {
    const { data, res } = await requestJson<{ etag?: string }>(
      `/api/storage/hubs/${encode(hubId)}/viewport`,
      {
        method: 'PUT',
        headers,
        body: { snapshot },
      }
    );
    return { ok: true, etag: data.etag ?? res.headers.get('ETag') ?? '' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = Number(msg.match(/\b(\d{3})\b/)?.[1] ?? 0) || undefined;
    if (status === 412) {
      return {
        ok: false,
        reason: 'precondition-failed',
        status,
        message: 'Precondition Failed — concurrent write detected',
      };
    }
    if (status === 401 || status === 403) {
      return {
        ok: false,
        reason: 'auth',
        status,
        message: `${status} Auth error writing viewport blob`,
      };
    }
    return {
      ok: false,
      reason: status ? 'unknown' : 'network',
      status,
      message: msg,
    };
  }
}

// ── Control blobs ─────────────────────────────────────────────────────

export async function listBlobControlRecords(hubId: string): Promise<ControlRecord[]> {
  const { data } = await requestJson<{ records: ControlRecord[] }>(
    `/api/storage/hubs/${encode(hubId)}/control-records`
  );
  return data.records ?? [];
}

export async function saveBlobControlRecord(record: ControlRecord): Promise<void> {
  await updateBlobSustainmentCatalog(record.hubId, [record]);
}

export async function updateBlobSustainmentCatalog(
  hubId: string,
  records: ControlRecord[]
): Promise<void> {
  await requestJson(`/api/storage/hubs/${encode(hubId)}/control-records`, {
    method: 'PUT',
    body: { records },
  });
}

export async function loadBlobControlReview(
  hubId: string,
  recordId: string,
  reviewId: string
): Promise<ControlReview | null> {
  const path = processHubEvidenceBlobPath(hubId, recordId, reviewId, 'unsupported');
  void path;
  return null;
}

export async function saveBlobControlReview(review: ControlReview): Promise<void> {
  await requestJson('/api/storage/control-reviews', {
    method: 'POST',
    body: { review },
  });
}

export async function saveBlobControlHandoff(handoff: ControlHandoff): Promise<void> {
  await requestJson('/api/storage/control-handoffs', {
    method: 'POST',
    body: { handoff },
  });
}
